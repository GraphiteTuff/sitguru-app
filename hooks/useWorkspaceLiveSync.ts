"use client";

/**
 * Workspace live sync — Supabase Realtime on sitguru_live_signals + refresh-on-focus.
 * Reuses the Messaging / Admin Live Walks pattern; does not poll every few seconds (req 94).
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";

export type WorkspaceLiveSyncMode = "realtime" | "focus" | "offline";

export type UseWorkspaceLiveSyncOptions = {
  /** Authenticated user receiving authorized signals only. */
  userId?: string | null;
  enabled?: boolean;
  /** Optional: only refresh when signal scope matches (e.g. growth). */
  scopes?: string[];
  debounceMs?: number;
  showStatus?: boolean;
  onSignal?: (eventType: string, scope: string) => void;
};

export type UseWorkspaceLiveSyncResult = {
  syncMode: WorkspaceLiveSyncMode;
  lastSyncedAt: string | null;
  statusLabel: string | null;
};

type LiveSignalRow = {
  event_type?: string;
  scope?: string;
  paths?: string[] | null;
};

export function useWorkspaceLiveSync(
  options: UseWorkspaceLiveSyncOptions = {},
): UseWorkspaceLiveSyncResult {
  const router = useRouter();
  const userId = options.userId || null;
  const enabled = options.enabled !== false && Boolean(userId);
  const [syncMode, setSyncMode] = useState<WorkspaceLiveSyncMode>("focus");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLastSyncedAt(new Date().toISOString());
    if (options.showStatus) setStatusLabel("Updated just now");
    router.refresh();
  }, [options.showStatus, router]);

  useRefreshOnFocus({
    enabled,
    minIntervalMs: 5000,
    onRefresh: () => {
      setSyncMode((prev) => (prev === "realtime" ? prev : "focus"));
      refresh();
    },
  });

  useRealtimeSubscription<LiveSignalRow>({
    channelName: userId
      ? `sitguru-live-signals:${userId}`
      : "sitguru-live-signals:off",
    table: "sitguru_live_signals",
    event: "INSERT",
    filter: userId ? `recipient_user_id=eq.${userId}` : undefined,
    enabled,
    debounceMs: options.debounceMs ?? 350,
    onPayload: (payload) => {
      const row = (payload.new || {}) as LiveSignalRow;
      const scope = String(row.scope || "");
      if (
        options.scopes?.length &&
        scope &&
        !options.scopes.includes(scope)
      ) {
        return;
      }
      options.onSignal?.(String(row.event_type || ""), scope);
      setSyncMode("realtime");
      refresh();
    },
    onChange: undefined,
    onStatus: (status) => {
      if (status === "SUBSCRIBED") {
        setSyncMode("realtime");
        if (options.showStatus) setStatusLabel("Back online");
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        setSyncMode("focus");
        if (options.showStatus) setStatusLabel("Reconnecting…");
      } else if (status === "CLOSED") {
        setSyncMode("offline");
      }
    },
  });

  // Resolve session user when caller omits userId (layout-friendly).
  useEffect(() => {
    if (options.userId || options.enabled === false) return;
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      // Parent should pass userId; this effect is a no-op placeholder for SSR safety.
      void data.session?.user?.id;
    });
    return () => {
      cancelled = true;
    };
  }, [options.enabled, options.userId]);

  useEffect(() => {
    if (!options.showStatus || !statusLabel) return;
    if (statusLabel !== "Updated just now" && statusLabel !== "Back online") {
      return;
    }
    const timer = window.setTimeout(() => setStatusLabel(null), 2500);
    return () => window.clearTimeout(timer);
  }, [options.showStatus, statusLabel]);

  return {
    syncMode,
    lastSyncedAt,
    statusLabel: options.showStatus ? statusLabel : null,
  };
}
