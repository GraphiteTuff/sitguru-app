/**
 * Native streaming chat for the SitGuru AI companions (Rogue / Scout / Taco).
 *
 * Personas, tools, and marker generation all stay server-side. This hook only
 * owns transcript state, the streaming request, and per-companion persistence.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { AiCompanionProfile } from '@/constants/companions';
import { useAuth } from '@/hooks/useAuth';
import {
  buildCompanionRequest,
  type CompanionTurn,
} from '@/lib/ai/companion-api';
import {
  CompanionStreamError,
  isAbortError,
  streamCompanionResponse,
  type DataStreamTransport,
} from '@/lib/ai/data-stream';
import { getSupabaseAccessToken } from '@/lib/supabase';

const STORAGE_PREFIX = 'sitguru:companion-chat:v1';

/** Keeps the stored thread small and the request payload inside model limits. */
const MAX_PERSISTED_MESSAGES = 40;
const MAX_REQUEST_TURNS = 16;

export type CompanionChatMessageState = 'streaming' | 'complete' | 'error';

export type CompanionChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  state: CompanionChatMessageState;
};

export type UseCompanionChatResult = {
  messages: CompanionChatMessage[];
  /** False until the saved thread has been read from AsyncStorage. */
  hydrated: boolean;
  streaming: boolean;
  error: string | null;
  /** Which transport delivered the last stream — useful for diagnostics. */
  transport: DataStreamTransport | null;
  sendMessage: (text: string) => void;
  clearChat: () => void;
  stop: () => void;
};

function storageKey(companionId: string) {
  return `${STORAGE_PREFIX}:${companionId}`;
}

function createId(role: 'user' | 'assistant') {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isStoredMessage(value: unknown): value is CompanionChatMessage {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    (record.role === 'user' || record.role === 'assistant') &&
    typeof record.content === 'string'
  );
}

function normalizeStored(value: unknown): CompanionChatMessage[] {
  if (!Array.isArray(value)) return [];

  return value.filter(isStoredMessage).map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt || new Date().toISOString(),
    // A thread saved mid-stream should never reopen as a live stream.
    state: message.state === 'error' ? 'error' : 'complete',
  }));
}

/** Only completed turns with real copy belong in the model transcript. */
function toRequestTurns(messages: CompanionChatMessage[]): CompanionTurn[] {
  return messages
    .filter((message) => message.state !== 'error' && message.content.trim())
    .slice(-MAX_REQUEST_TURNS)
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }));
}

function friendlyStreamError(error: unknown, companionName: string) {
  if (error instanceof CompanionStreamError) {
    if (error.status === 401 || error.status === 403) {
      return `${companionName} needs you signed in with the right role for that. Try the public questions, or sign in and ask again.`;
    }
    if (error.status === 0) {
      return `${companionName} could not be reached. Check your connection and try again.`;
    }
    return `${companionName} hit a snag pulling that live Guru list. Open Explore and search the area, or ask again in a moment.`;
  }

  return `${companionName} could not answer just now. Try that again in a moment.`;
}

export function useCompanionChat(
  companion: AiCompanionProfile,
): UseCompanionChatResult {
  const { profile, user, roles } = useAuth();

  const [messages, setMessages] = useState<CompanionChatMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transport, setTransport] = useState<DataStreamTransport | null>(null);

  const messagesRef = useRef<CompanionChatMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const firstName = useMemo(() => {
    const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const candidates = [
      profile?.first_name,
      typeof metadata.first_name === 'string' ? metadata.first_name : '',
      profile?.full_name?.split(/\s+/)[0],
      user?.email?.split('@')[0],
    ];

    return (
      candidates.find(
        (candidate): candidate is string =>
          typeof candidate === 'string' && candidate.trim().length > 0,
      ) ?? ''
    ).trim();
  }, [profile?.first_name, profile?.full_name, user?.email, user?.user_metadata]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  // Restore the saved thread whenever the visitor switches companion.
  useEffect(() => {
    let active = true;
    setHydrated(false);
    setMessages([]);
    setError(null);

    async function restore() {
      try {
        const stored = await AsyncStorage.getItem(storageKey(companion.id));
        if (!active) return;
        if (stored) setMessages(normalizeStored(JSON.parse(stored)));
      } catch {
        // A corrupt or unavailable thread simply starts the chat fresh.
      } finally {
        if (active) setHydrated(true);
      }
    }

    void restore();

    return () => {
      active = false;
    };
  }, [companion.id]);

  // Persist after each settled turn so returning to the screen restores it.
  useEffect(() => {
    if (!hydrated || streaming) return;

    const persistable = messages
      .filter((message) => message.content.trim())
      .slice(-MAX_PERSISTED_MESSAGES);

    void (async () => {
      try {
        if (!persistable.length) {
          await AsyncStorage.removeItem(storageKey(companion.id));
          return;
        }
        await AsyncStorage.setItem(
          storageKey(companion.id),
          JSON.stringify(persistable),
        );
      } catch {
        // Losing the cache is acceptable; the live transcript still works.
      }
    })();
  }, [companion.id, hydrated, messages, streaming]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const clearChat = useCallback(() => {
    stop();
    setMessages([]);
    setError(null);
    setStreaming(false);
    void AsyncStorage.removeItem(storageKey(companion.id)).catch(() => {
      // Nothing to recover from — state is already cleared.
    });
  }, [companion.id, stop]);

  const sendMessage = useCallback(
    (text: string) => {
      const clean = text.trim();
      if (!clean || streaming) return;

      const userMessage: CompanionChatMessage = {
        id: createId('user'),
        role: 'user',
        content: clean,
        createdAt: new Date().toISOString(),
        state: 'complete',
      };

      const assistantId = createId('assistant');
      const assistantMessage: CompanionChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        state: 'streaming',
      };

      const turns = toRequestTurns([...messagesRef.current, userMessage]);

      setError(null);
      setStreaming(true);
      setMessages((current) => [...current, userMessage, assistantMessage]);

      function updateAssistant(
        update: (message: CompanionChatMessage) => CompanionChatMessage,
      ) {
        if (!mountedRef.current) return;
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId ? update(message) : message,
          ),
        );
      }

      const controller = new AbortController();
      abortRef.current = controller;

      void (async () => {
        let streamNotice: string | null = null;
        let accumulated = '';

        try {
          const accessToken = await getSupabaseAccessToken().catch(() => null);

          const request = buildCompanionRequest({
            companion,
            turns,
            firstName,
            roles,
            accessToken,
          });

          const result = await streamCompanionResponse({
            url: request.url,
            body: request.body,
            headers: request.headers,
            signal: controller.signal,
            onTextDelta: (delta) => {
              accumulated += delta;
              updateAssistant((message) => ({
                ...message,
                content: message.content + delta,
              }));
            },
            onStreamError: (message) => {
              streamNotice = message;
            },
          });

          if (!mountedRef.current) return;
          setTransport(result.transport);

          if (!accumulated.trim()) {
            const fallback =
              streamNotice ??
              `${companion.name} came back empty on that one. Try rephrasing it.`;
            setError(fallback);
            updateAssistant((message) => ({
              ...message,
              content: fallback,
              state: 'error',
            }));
            return;
          }

          if (streamNotice) setError(streamNotice);
          updateAssistant((message) => ({ ...message, state: 'complete' }));
        } catch (streamFailure) {
          if (!mountedRef.current) return;

          if (isAbortError(streamFailure)) {
            // Keep whatever streamed before the visitor stopped generation.
            const stopped = accumulated.trim();
            updateAssistant((message) => ({
              ...message,
              content: stopped || 'Stopped before answering.',
              state: stopped ? 'complete' : 'error',
            }));
            return;
          }

          const message = friendlyStreamError(streamFailure, companion.name);
          setError(message);
          updateAssistant((current) => ({
            ...current,
            content: accumulated.trim() || message,
            state: 'error',
          }));
        } finally {
          if (abortRef.current === controller) abortRef.current = null;
          if (mountedRef.current) setStreaming(false);
        }
      })();
    },
    [companion, firstName, roles, streaming],
  );

  return {
    messages,
    hydrated,
    streaming,
    error,
    transport,
    sendMessage,
    clearChat,
    stop,
  };
}

export type { DataStreamTransport };
