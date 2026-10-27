/**
 * Mobile workspace live sync — same sitguru_live_signals bus as web (req 93).
 * Business state stays on shared Supabase tables; this only triggers refresh callbacks.
 */

import { useCallback, useState } from 'react';

import { useRealtimeSubscription } from '@/hooks/data/useRealtimeSubscription';
import { LIVE_SIGNAL_TABLE, REALTIME_CHANNELS } from '@/lib/data/schema';

export type UseWorkspaceLiveSyncOptions = {
  userId?: string | null;
  enabled?: boolean;
  scopes?: string[];
  onRefresh?: () => void;
  debounceMs?: number;
};

export function useWorkspaceLiveSync({
  userId,
  enabled = true,
  scopes,
  onRefresh,
  debounceMs = 400,
}: UseWorkspaceLiveSyncOptions) {
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncMode, setSyncMode] = useState<'realtime' | 'idle'>('idle');

  const refresh = useCallback(() => {
    setLastSyncedAt(new Date().toISOString());
    onRefresh?.();
  }, [onRefresh]);

  useRealtimeSubscription({
    channelName: userId
      ? REALTIME_CHANNELS.liveSignals(userId)
      : 'sitguru-live-signals:off',
    table: LIVE_SIGNAL_TABLE,
    event: 'INSERT',
    filter: userId ? `recipient_user_id=eq.${userId}` : undefined,
    enabled: enabled && Boolean(userId),
    debounceMs,
    onPayload: (payload) => {
      const row = (payload.new || {}) as { scope?: string };
      const scope = String(row.scope || '');
      if (scopes?.length && scope && !scopes.includes(scope)) return;
      setSyncMode('realtime');
      refresh();
    },
  });

  return { lastSyncedAt, syncMode, refresh };
}
