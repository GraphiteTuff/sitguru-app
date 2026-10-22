"use client";

/**
 * Shared web hook: restore / attach durable companion conversations for
 * Rogue, Scout, Taco, and Delilah. Clears local state on account switch.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Message } from "ai";
import { supabase } from "@/lib/supabase";
import type { CompanionId } from "@/lib/companions/types";

export type CompanionConversationState = {
  conversationId: string | null;
  authUserId: string | null;
  hydrated: boolean;
  persistenceAvailable: boolean;
  /** Merge into useChat request body. */
  requestExtras: {
    conversationId?: string;
    clientMessageId?: string;
  };
  /** Apply restored server messages (caller decides greeting fallback). */
  restoredMessages: Message[] | null;
  clearLocalCompanionState: () => void;
  beginTurn: () => { clientMessageId: string };
};

const LEGACY_WEB_KEYS = [
  "sitguru-homepage-lead-chat",
  "sitguru_chat_history",
  "sitguru_client_first_name",
] as const;

function clearLegacyGuestKeys() {
  try {
    for (const key of LEGACY_WEB_KEYS) {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    }
  } catch {
    // ignore quota / private mode
  }
}

export function useCompanionConversation(opts: {
  companionId: CompanionId;
  /** When false, skip server restore (still tracks auth for cleanup). */
  enabled?: boolean;
  setMessages?: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  greetingMessages?: Message[];
}): CompanionConversationState {
  const enabled = opts.enabled !== false;
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [persistenceAvailable, setPersistenceAvailable] = useState(true);
  const [restoredMessages, setRestoredMessages] = useState<Message[] | null>(
    null,
  );
  const conversationIdRef = useRef<string | null>(null);
  const previousUserIdRef = useRef<string | null>(null);
  const abortEpochRef = useRef(0);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  const clearLocalCompanionState = useCallback(() => {
    clearLegacyGuestKeys();
    setConversationId(null);
    conversationIdRef.current = null;
    setRestoredMessages(null);
    if (opts.greetingMessages && opts.setMessages) {
      opts.setMessages(opts.greetingMessages);
    }
  }, [opts.greetingMessages, opts.setMessages]);

  useEffect(() => {
    let active = true;

    async function sync() {
      const epoch = ++abortEpochRef.current;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!active || epoch !== abortEpochRef.current) return;

        const nextUserId = session?.user?.id || null;
        const previous = previousUserIdRef.current;

        // Account switch / logout: never attribute prior UI or guest cache.
        if (previous && previous !== nextUserId) {
          clearLocalCompanionState();
        }

        if (!nextUserId) {
          previousUserIdRef.current = null;
          setAuthUserId(null);
          setConversationId(null);
          conversationIdRef.current = null;
          setHydrated(true);
          return;
        }

        // First sign-in after guest: discard unowned guest/local history.
        if (!previous && nextUserId) {
          clearLegacyGuestKeys();
        }

        previousUserIdRef.current = nextUserId;
        setAuthUserId(nextUserId);

        if (!enabled) {
          setHydrated(true);
          return;
        }

        const res = await fetch("/api/companions/conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session!.access_token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            companion: opts.companionId,
            includeMessages: true,
          }),
        });

        if (!active || epoch !== abortEpochRef.current) return;

        if (res.status === 503) {
          setPersistenceAvailable(false);
          setHydrated(true);
          return;
        }

        if (!res.ok) {
          setPersistenceAvailable(false);
          setHydrated(true);
          return;
        }

        setPersistenceAvailable(true);
        const json = (await res.json().catch(() => ({}))) as {
          conversation?: { id?: string };
          messages?: Array<{ id: string; role: string; content: string }>;
        };

        const id = json.conversation?.id || null;
        if (id) {
          setConversationId(id);
          conversationIdRef.current = id;
        }

        const restored = (json.messages || [])
          .filter(
            (row) =>
              (row.role === "user" || row.role === "assistant") &&
              String(row.content || "").trim(),
          )
          .map((row) => ({
            id: row.id,
            role: row.role as Message["role"],
            content: row.content,
          }));

        if (restored.length) {
          setRestoredMessages(restored);
          opts.setMessages?.(restored);
        } else {
          setRestoredMessages(null);
        }
      } catch {
        setPersistenceAvailable(false);
      } finally {
        if (active && epoch === abortEpochRef.current) {
          setHydrated(true);
        }
      }
    }

    void sync();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void sync();
    });

    return () => {
      active = false;
      abortEpochRef.current += 1;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auth subscription owns refresh; companionId is the restore key
  }, [opts.companionId, enabled, clearLocalCompanionState]);

  const beginTurn = useCallback(() => {
    const clientMessageId = `web-${opts.companionId}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    return { clientMessageId };
  }, [opts.companionId]);

  return {
    conversationId,
    authUserId,
    hydrated,
    persistenceAvailable,
    requestExtras: {
      ...(conversationIdRef.current
        ? { conversationId: conversationIdRef.current }
        : conversationId
          ? { conversationId }
          : {}),
    },
    restoredMessages,
    clearLocalCompanionState,
    beginTurn,
  };
}
