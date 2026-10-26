"use client";

/**
 * Web Realtime lifecycle — mirrors sitguru-mobile useRealtimeSubscription.
 * Named channel → postgres_changes (optionally filtered) → removeChannel on unmount.
 */

import { useCallback, useEffect, useRef } from "react";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type PostgresEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

export type UseRealtimeSubscriptionOptions<T extends Record<string, unknown>> = {
  channelName: string;
  table: string;
  schema?: string;
  event?: PostgresEvent;
  /** Prefer server-side filters, e.g. `recipient_user_id=eq.${userId}`. */
  filter?: string;
  enabled?: boolean;
  onPayload?: (payload: RealtimePostgresChangesPayload<T>) => void;
  onChange?: () => void;
  debounceMs?: number;
  onStatus?: (status: string) => void;
};

export function useRealtimeSubscription<
  T extends Record<string, unknown> = Record<string, unknown>,
>({
  channelName,
  table,
  schema = "public",
  event = "*",
  filter,
  enabled = true,
  onPayload,
  onChange,
  debounceMs = 400,
  onStatus,
}: UseRealtimeSubscriptionOptions<T>) {
  const onPayloadRef = useRef(onPayload);
  const onChangeRef = useRef(onChange);
  const onStatusRef = useRef(onStatus);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  onPayloadRef.current = onPayload;
  onChangeRef.current = onChange;
  onStatusRef.current = onStatus;

  const scheduleChange = useCallback(() => {
    if (!onChangeRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChangeRef.current?.();
    }, debounceMs);
  }, [debounceMs]);

  useEffect(() => {
    if (!enabled || !channelName || !table) return;

    let channel: RealtimeChannel | null = null;

    const config: {
      event: PostgresEvent;
      schema: string;
      table: string;
      filter?: string;
    } = { event, schema, table };

    if (filter) config.filter = filter;

    channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        config,
        (payload: RealtimePostgresChangesPayload<T>) => {
          onPayloadRef.current?.(payload);
          scheduleChange();
        },
      )
      .subscribe((status) => {
        onStatusRef.current?.(status);
      });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (channel) void supabase.removeChannel(channel);
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
