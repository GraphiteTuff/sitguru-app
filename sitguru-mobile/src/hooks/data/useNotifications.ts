import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import {
  asString,
  firstString,
  getErrorMessage,
  type RecordRow,
} from '@/lib/data/fields';
import { REALTIME_CHANNELS, TABLES } from '@/lib/data/schema';
import { useRealtimeSubscription } from '@/hooks/data/useRealtimeSubscription';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type SitGuruNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  href: string;
  isRead: boolean;
  createdAt: string;
  raw: RecordRow;
};

function notificationFromRow(row: RecordRow): SitGuruNotification | null {
  const id = asString(row.id);
  if (!id) return null;

  return {
    id,
    userId: asString(row.user_id),
    title: firstString(row, ['title', 'subject'], 'SitGuru update'),
    body: firstString(row, ['body', 'message', 'content']),
    type: firstString(row, ['type', 'category'], 'general'),
    href: firstString(row, ['href', 'link', 'url', 'path']),
    isRead: row.is_read === true,
    createdAt: firstString(row, ['created_at', 'inserted_at']),
    raw: row,
  };
}

export function useNotifications(options?: {
  enabled?: boolean;
  realtime?: boolean;
  limit?: number;
}) {
  const { user, isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  const realtime = options?.realtime ?? true;
  const limit = options?.limit ?? 100;
  const instanceId = useId().replace(/:/g, '');
  const userId = user?.id ?? '';

  const [notifications, setNotifications] = useState<SitGuruNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelName = userId
    ? REALTIME_CHANNELS.notifications(userId, instanceId)
    : 'notifications-idle';

  /* eslint-disable react-hooks/preserve-manual-memoization -- React state setters are stable; compiler still infers them. Do not add setters to deps. */
  const refresh = useCallback(async () => {
    if (!enabled || !isAuthenticated || !userId || !isSupabaseConfigured) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    const result = await supabase
      .from(TABLES.notifications)
      .select('id, user_id, title, body, type, href, link, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (result.error) {
      const fallback = await supabase
        .from(TABLES.notifications)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fallback.error) {
        setError(getErrorMessage(fallback.error));
        setLoading(false);
        return;
      }

      setNotifications(
        (fallback.data ?? [])
          .map((row) => notificationFromRow(row as RecordRow))
          .filter((item): item is SitGuruNotification => Boolean(item)),
      );
      setError(null);
      setLoading(false);
      return;
    }

    setNotifications(
      (result.data ?? [])
        .map((row) => notificationFromRow(row as RecordRow))
        .filter((item): item is SitGuruNotification => Boolean(item)),
    );
    setError(null);
    setLoading(false);
  }, [enabled, isAuthenticated, limit, userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Supabase notification fetch
    void refresh();
  }, [refresh]);

  useRealtimeSubscription({
    channelName,
    table: TABLES.notifications,
    filter: userId ? `user_id=eq.${userId}` : undefined,
    enabled: Boolean(realtime && enabled && userId),
    onChange: () => {
      void refresh();
    },
  });

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const markRead = useCallback(
    async (notificationId: string) => {
      if (!userId || !isSupabaseConfigured) {
        return { error: 'Sign in required.' };
      }

      const result = await supabase
        .from(TABLES.notifications)
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (result.error) {
        return { error: getErrorMessage(result.error) };
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId ? { ...item, isRead: true } : item,
        ),
      );

      return { error: null as string | null };
    },
    [userId],
  );

  const markAllRead = useCallback(async () => {
    if (!userId || !isSupabaseConfigured) {
      return { error: 'Sign in required.' };
    }

    const result = await supabase
      .from(TABLES.notifications)
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (result.error) {
      return { error: getErrorMessage(result.error) };
    }

    setNotifications((current) =>
      current.map((item) => ({ ...item, isRead: true })),
    );

    return { error: null as string | null };
  }, [userId]);
  /* eslint-enable react-hooks/preserve-manual-memoization */

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markRead,
    markAllRead,
  };
}
