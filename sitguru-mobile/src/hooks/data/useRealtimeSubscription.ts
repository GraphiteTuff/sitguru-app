import { useCallback, useEffect, useRef } from 'react';
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
  const onPayloadRef = useRef(onPayload);
  const onChangeRef = useRef(onChange);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  onPayloadRef.current = onPayload;
  onChangeRef.current = onChange;

  const scheduleChange = useCallback(() => {
    if (!onChangeRef.current) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      onChangeRef.current?.();
    }, debounceMs);
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
