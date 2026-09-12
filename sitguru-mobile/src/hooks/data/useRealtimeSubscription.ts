import { useCallback, useEffect, useRef } from 'react';

import { useLatestRef } from '@/hooks/useLatestRef';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type PostgresEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export type UseRealtimeSubscriptionOptions<T extends Record<string, unknown>> = {
  /** Stable channel name — prefer REALTIME_CHANNELS helpers. */
  channelName: string;
  table: string;
  schema?: string;
  event?: PostgresEvent;
  /** Prefer server-side filters, e.g. `user_id=eq.${userId}`. */
  filter?: string;
  enabled?: boolean;
  onPayload?: (
    payload: RealtimePostgresChangesPayload<T>,
  ) => void;
  /** Debounced full refresh callback (ms). */
  onChange?: () => void;
  debounceMs?: number;
};

/**
 * Shared Realtime lifecycle matching web patterns:
 * named channel → postgres_changes (optionally filtered) → removeChannel on unmount.
 */
export function useRealtimeSubscription<
  T extends Record<string, unknown> = Record<string, unknown>,
>({
  channelName,
  table,
  schema = 'public',
  event = '*',
  filter,
  enabled = true,
  onPayload,
  onChange,
  debounceMs = 400,
}: UseRealtimeSubscriptionOptions<T>) {
  const onPayloadRef = useLatestRef(onPayload);
  const onChangeRef = useLatestRef(onChange);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleChange = useCallback(() => {
    if (!onChangeRef.current) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      onChangeRef.current?.();
    }, debounceMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onChangeRef is a stable latest-ref
  }, [debounceMs]);

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured || !channelName || !table) {
      return;
    }

    let channel: RealtimeChannel | null = null;

    const config: {
      event: PostgresEvent;
      schema: string;
      table: string;
      filter?: string;
    } = {
      event,
      schema,
      table,
    };

    if (filter) {
      config.filter = filter;
    }

    channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        config,
        (payload: RealtimePostgresChangesPayload<T>) => {
          onPayloadRef.current?.(payload);
          scheduleChange();
        },
      )
      .subscribe();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
    // Latest-ref containers are stable; adding them reconnects channels.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onPayloadRef is a stable latest-ref
  }, [
    channelName,
    table,
    schema,
    event,
    filter,
    enabled,
    scheduleChange,
  ]);
}
