import { useCallback, useEffect, useState } from 'react';
import { useGlobalSearchParams, usePathname } from 'expo-router';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

import { useAuth } from '@/hooks/useAuth';
import { useRealtimeSubscription } from '@/hooks/data/useRealtimeSubscription';
import { firstString, asString, type RecordRow } from '@/lib/data/fields';
import { REALTIME_CHANNELS, TABLES } from '@/lib/data/schema';

export type ChatToastPayload = {
  id: string;
  conversationId: string;
  title: string;
  snippet: string;
  createdAt: number;
};

function summarizeMessageBody(body: string): { title: string; snippet: string } {
  const text = body.trim();

  if (/\[Voice note/i.test(text)) {
    return {
      title: 'Voice note received',
      snippet: 'Tap to open the conversation and play it back.',
    };
  }

  if (
    /pawreport/i.test(text) ||
    /live walk/i.test(text) ||
    /care update/i.test(text)
  ) {
    return {
      title: 'New PawReport Update',
      snippet: text.slice(0, 90) || 'Your Guru shared a care update.',
    };
  }

  if (
    /https?:\/\/\S+\.(jpg|jpeg|png|webp|heic)/i.test(text) ||
    /supabase\.co\/storage/i.test(text) ||
    /pawreport-photos|provider-media|pet-media/i.test(text)
  ) {
    return {
      title: 'New care photo',
      snippet: 'A photo was shared in your SitGuru chat.',
    };
  }

  const preview = text.replace(/\s+/g, ' ').slice(0, 90);
  return {
    title: 'New message',
    snippet: preview || 'Open Messages to reply.',
  };
}

function paramAsString(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

/**
 * Global recipient-scoped message listener for in-app toast banners.
 * Suppresses toasts while the user is already inside that conversation.
 */
export function useIncomingMessageToast(options?: { enabled?: boolean }) {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const params = useGlobalSearchParams<{ conversationId?: string | string[] }>();
  const enabled = (options?.enabled ?? true) && isAuthenticated && !!user?.id;
  const [toast, setToast] = useState<ChatToastPayload | null>(null);

  const activeConversationId = pathname?.includes('conversation')
    ? paramAsString(params.conversationId)
    : '';

  const dismiss = useCallback(() => setToast(null), []);

  const onPayload = useCallback(
    (payload: RealtimePostgresChangesPayload<RecordRow>) => {
      if (payload.eventType !== 'INSERT') return;

      const row = (payload.new ?? {}) as RecordRow;
      const recipientId = asString(row.recipient_id);
      const senderId = asString(row.sender_id);
      const conversationId = asString(row.conversation_id);
      const messageId = asString(row.id);

      if (!user?.id || recipientId !== user.id) return;
      if (senderId === user.id) return;
      if (!conversationId || !messageId) return;

      if (activeConversationId && activeConversationId === conversationId) {
        return;
      }

      const body = firstString(row, ['content', 'body', 'message', 'text']);
      const summary = summarizeMessageBody(body);

      setToast({
        id: messageId,
        conversationId,
        title: summary.title,
        snippet: summary.snippet,
        createdAt: Date.now(),
      });
    },
    [activeConversationId, user?.id],
  );

  useRealtimeSubscription<RecordRow>({
    channelName: user?.id
      ? REALTIME_CHANNELS.inboxToast(user.id)
      : 'inbox-toast-idle',
    table: TABLES.messages,
    event: 'INSERT',
    filter: user?.id ? `recipient_id=eq.${user.id}` : undefined,
    enabled,
    onPayload,
  });

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5200);
    return () => clearTimeout(timer);
  }, [toast?.id]);

  return {
    toast,
    dismiss,
  };
}
