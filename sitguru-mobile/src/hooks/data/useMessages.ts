import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

import { sitguruApiFetch } from '@/lib/data/api';
import {
  asString,
  firstString,
  getErrorMessage,
  type RecordRow,
} from '@/lib/data/fields';
import { API_PATHS, REALTIME_CHANNELS, TABLES } from '@/lib/data/schema';
import { useRealtimeSubscription } from '@/hooks/data/useRealtimeSubscription';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type SitGuruMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  raw: RecordRow;
};

export type SitGuruConversation = {
  id: string;
  bookingId: string;
  customerId: string;
  guruId: string;
  subject: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  raw: RecordRow;
};

function messageFromRow(row: RecordRow): SitGuruMessage | null {
  const id = asString(row.id);
  const conversationId = asString(row.conversation_id);
  if (!id || !conversationId) return null;

  return {
    id,
    conversationId,
    senderId: asString(row.sender_id),
    recipientId: asString(row.recipient_id),
    content:
      firstString(row, ['content', 'body', 'message', 'text']) || '',
    createdAt: firstString(row, ['created_at', 'sent_at', 'inserted_at']),
    isRead: Boolean(row.is_read === true || row.read_at),
    raw: row,
  };
}

function conversationFromRow(row: RecordRow): SitGuruConversation | null {
  const id = asString(row.id);
  if (!id) return null;

  return {
    id,
    bookingId: asString(row.booking_id),
    customerId: asString(row.customer_id),
    guruId: asString(row.guru_id),
    subject: firstString(row, ['subject', 'topic'], 'SitGuru chat'),
    lastMessageAt: firstString(row, ['last_message_at', 'updated_at', 'created_at']),
    lastMessagePreview: firstString(row, [
      'last_message_preview',
      'last_message',
      'preview',
    ]),
    raw: row,
  };
}

function mergeMessages(existing: SitGuruMessage[], incoming: SitGuruMessage[]) {
  const map = new Map<string, SitGuruMessage>();
  for (const message of [...existing, ...incoming]) {
    map.set(message.id, message);
  }

  return Array.from(map.values()).sort((a, b) =>
    asString(a.createdAt).localeCompare(asString(b.createdAt)),
  );
}

export function useConversations(options?: { enabled?: boolean }) {
  const { user, isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  const [conversations, setConversations] = useState<SitGuruConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !isAuthenticated || !user?.id || !isSupabaseConfigured) {
      setConversations([]);
      return;
    }

    setLoading(true);

    const [asCustomer, asGuru] = await Promise.all([
      supabase
        .from(TABLES.conversations)
        .select('*')
        .eq('customer_id', user.id)
        .order('last_message_at', { ascending: false })
        .limit(100),
      supabase
        .from(TABLES.conversations)
        .select('*')
        .eq('guru_id', user.id)
        .order('last_message_at', { ascending: false })
        .limit(100),
    ]);

    if (asCustomer.error && asGuru.error) {
      setError(
        getErrorMessage(asCustomer.error || asGuru.error),
      );
      setLoading(false);
      return;
    }

    const map = new Map<string, SitGuruConversation>();
    for (const row of [...(asCustomer.data ?? []), ...(asGuru.data ?? [])]) {
      const conversation = conversationFromRow(row as RecordRow);
      if (conversation) map.set(conversation.id, conversation);
    }

    setConversations(Array.from(map.values()));
    setError(null);
    setLoading(false);
  }, [enabled, isAuthenticated, user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useRealtimeSubscription({
    channelName: user?.id
      ? `sitguru-conversations-${user.id}`
      : 'sitguru-conversations-idle',
    table: TABLES.conversations,
    enabled: Boolean(enabled && user?.id),
    onChange: () => {
      void refresh();
    },
  });

  return { conversations, loading, error, refresh };
}

export function useConversation(
  conversationId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const { user, isAuthenticated, primaryRole } = useAuth();
  const enabled = options?.enabled ?? true;
  const id = asString(conversationId);

  const [messages, setMessages] = useState<SitGuruMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !id || !isSupabaseConfigured) {
      setMessages([]);
      return;
    }

    setLoading(true);
    const result = await supabase
      .from(TABLES.messages)
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
      .limit(500);

    if (result.error) {
      setError(getErrorMessage(result.error));
      setLoading(false);
      return;
    }

    const next = (result.data ?? [])
      .map((row) => messageFromRow(row as RecordRow))
      .filter((message): message is SitGuruMessage => Boolean(message));

    setMessages(next);
    setError(null);
    setLoading(false);
  }, [enabled, id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useRealtimeSubscription<RecordRow>({
    channelName: id ? REALTIME_CHANNELS.chat(id) : 'chat-idle',
    table: TABLES.messages,
    event: 'INSERT',
    filter: id ? `conversation_id=eq.${id}` : undefined,
    enabled: Boolean(enabled && id),
    onPayload: (payload: RealtimePostgresChangesPayload<RecordRow>) => {
      const row = payload.new as RecordRow | null;
      const message = row ? messageFromRow(row) : null;
      if (!message) return;
      setMessages((current) => mergeMessages(current, [message]));
    },
  });

  const sendMessage = useCallback(
    async (params: {
      text: string;
      recipientId?: string;
      clientMessageId?: string;
      topic?: string;
    }) => {
      if (!isAuthenticated) {
        return { message: null as SitGuruMessage | null, error: 'Sign in required.' };
      }

      const text = asString(params.text);
      if (!text) {
        return { message: null, error: 'Enter a message before sending.' };
      }

      setSending(true);

      const clientMessageId =
        params.clientMessageId ||
        `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      const result = await sitguruApiFetch<{
        ok?: boolean;
        message?: RecordRow;
        error?: string;
      }>(API_PATHS.sendMessage, {
        body: {
          conversationId: id || undefined,
          message: text,
          content: text,
          body: text,
          recipientId: params.recipientId,
          topic: params.topic,
          clientMessageId,
          roleContext:
            primaryRole === 'guru'
              ? 'guru'
              : primaryRole === 'ambassador'
                ? 'ambassador'
                : primaryRole === 'admin'
                  ? 'admin'
                  : 'customer',
          source: 'sitguru-mobile',
        },
        idempotencyKey: clientMessageId,
      });

      setSending(false);

      if (result.error) {
        return { message: null, error: result.error };
      }

      const message = messageFromRow(
        (result.data?.message as RecordRow | undefined) ?? {
          id: clientMessageId,
          conversation_id: id,
          sender_id: user?.id,
          content: text,
          created_at: new Date().toISOString(),
        },
      );

      if (message) {
        setMessages((current) => mergeMessages(current, [message]));
      }

      return { message, error: null as string | null };
    },
    [id, isAuthenticated, primaryRole, user?.id],
  );

  const ensureBookingConversation = useCallback(async (bookingId: string) => {
    const result = await sitguruApiFetch<{
      ok?: boolean;
      conversationId?: string;
      id?: string;
      error?: string;
    }>(API_PATHS.ensureBookingConversation, {
      body: { bookingId },
    });

    if (result.error) {
      return { conversationId: null as string | null, error: result.error };
    }

    return {
      conversationId:
        asString(result.data?.conversationId) ||
        asString(result.data?.id) ||
        null,
      error: null as string | null,
    };
  }, []);

  const markRead = useCallback(async () => {
    if (!user?.id || !id || !isSupabaseConfigured) return;

    await supabase
      .from(TABLES.messages)
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('conversation_id', id)
      .eq('recipient_id', user.id)
      .eq('is_read', false);
  }, [id, user?.id]);

  const unreadCount = useMemo(
    () =>
      messages.filter(
        (message) =>
          !message.isRead && message.recipientId === user?.id,
      ).length,
    [messages, user?.id],
  );

  return {
    messages,
    loading,
    sending,
    error,
    unreadCount,
    refresh,
    sendMessage,
    ensureBookingConversation,
    markRead,
  };
}
