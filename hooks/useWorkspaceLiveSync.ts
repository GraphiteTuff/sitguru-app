"use client";

/**
 * Workspace live sync — Supabase Realtime on sitguru_live_signals + refresh-on-focus.
 * Reuses the Messaging / Admin Live Walks pattern; does not poll every few seconds (req 94).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyForms = useRef(new Set<HTMLFormElement>());
  const refreshWaiting = useRef(false);

  const refresh = useCallback(() => {
    for (const form of dirtyForms.current) {
      if (!form.isConnected) dirtyForms.current.delete(form);
    }
    // RSC refresh preserves client state, but a remotely reviewed item can
    // disappear from a conditional review form. Wait for save/reset/close so
    // unfinished captions, uploads, and manager feedback stay in place.
    if (dirtyForms.current.size) {
      refreshWaiting.current = true;
      if (options.showStatus) setStatusLabel("Updates waiting while you edit");
      return;
    }
    refreshWaiting.current = false;
    setLastSyncedAt(new Date().toISOString());
    if (options.showStatus) setStatusLabel("Updated just now");
    router.refresh();
  }, [options.showStatus, router]);

  // The subscription debounces onChange, but onPayload runs per row. Coalesce
  // bursts here so an assignment + approval + notice cause one server refresh.
  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      refreshTimer.current = null;
      if (document.visibilityState === "visible" && navigator.onLine) refresh();
    }, options.debounceMs ?? 350);
  }, [options.debounceMs, refresh]);

  useEffect(() => {
    if (!enabled) return;
    const markDirty = (event: Event) => {
      const field = event.target;
      if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement)) return;
      if (field instanceof HTMLInputElement && ["hidden", "search", "submit", "button"].includes(field.type)) return;
      if (field.form) dirtyForms.current.add(field.form);
    };
    const reset = (event: Event) => {
      if (event.target instanceof HTMLFormElement) dirtyForms.current.delete(event.target);
      if (refreshWaiting.current) scheduleRefresh();
    };
    // A close/discard button can remove the edited form without resetting it.
    const resume = () => { if (refreshWaiting.current) scheduleRefresh(); };
    document.addEventListener("input", markDirty, true);
    document.addEventListener("change", markDirty, true);
    document.addEventListener("reset", reset, true);
    document.addEventListener("click", resume);
    return () => {
      document.removeEventListener("input", markDirty, true);
      document.removeEventListener("change", markDirty, true);
      document.removeEventListener("reset", reset, true);
      document.removeEventListener("click", resume);
      dirtyForms.current.clear();
    };
  }, [enabled, userId, scheduleRefresh]);

  useEffect(() => () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
  }, [enabled, userId, scheduleRefresh]);

  useEffect(() => {
    if (!enabled) return;
    const online = () => { setSyncMode("focus"); scheduleRefresh(); };
    const offline = () => {
      setSyncMode("offline");
      if (options.showStatus) setStatusLabel("Offline · updates resume on reconnect");
    };
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, [enabled, options.showStatus, scheduleRefresh]);

  useRefreshOnFocus({
    enabled,
    minIntervalMs: 5000,
    onRefresh: () => {
      setSyncMode((prev) => (prev === "realtime" ? prev : "focus"));
      scheduleRefresh();
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
      scheduleRefresh();
    },
    onChange: undefined,
    onStatus: (status) => {
      if (status === "SUBSCRIBED") {
        setSyncMode("realtime");
        if (options.showStatus) setStatusLabel("Back online");
        scheduleRefresh();
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        setSyncMode("focus");
        if (options.showStatus) setStatusLabel("Reconnecting…");
      } else if (status === "CLOSED") {
        setSyncMode("offline");
      }
    },
  });

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
