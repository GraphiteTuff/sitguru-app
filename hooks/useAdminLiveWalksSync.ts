// hooks/useAdminLiveWalksSync.ts
"use client";

/**
 * Admin Live Walks fleet sync — Supabase Realtime + 5s polling fallback.
 * Keeps KPI stats + left-queue rows fresh when simulateWalk / Guru devices write.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  EMPTY_LIVE_STATS,
  type AdminLiveWalkRow,
  type AdminLiveWalkStats,
  type LiveWalksListResponse,
} from "@/components/admin/live-walks/types";

type UseAdminLiveWalksSyncOptions = {
  query?: string;
  pollIntervalMs?: number;
  enabled?: boolean;
};

type UseAdminLiveWalksSyncResult = {
  rows: AdminLiveWalkRow[];
  stats: AdminLiveWalkStats;
  isLoading: boolean;
  error: string;
  lastSyncedAt: string | null;
  syncMode: "realtime" | "polling";
  refresh: () => Promise<void>;
};

async function getAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session?.access_token) {
    throw new Error("Please log in as an admin.");
  }
  return session.access_token;
}

export function useAdminLiveWalksSync(
  options: UseAdminLiveWalksSyncOptions = {},
): UseAdminLiveWalksSyncResult {
  const pollIntervalMs = options.pollIntervalMs ?? 5000;
  const enabled = options.enabled !== false;
  const query = options.query || "";

  const [rows, setRows] = useState<AdminLiveWalkRow[]>([]);
  const [stats, setStats] = useState<AdminLiveWalkStats>(EMPTY_LIVE_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncMode, setSyncMode] = useState<"realtime" | "polling">("polling");

  const inFlightRef = useRef(false);
  const queryRef = useRef(query);
  queryRef.current = query;

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      const token = await getAccessToken();
      const params = new URLSearchParams({
        liveOnly: "1",
        scanAlerts: "1",
        limit: "200",
      });
      if (queryRef.current.trim()) {
        params.set("q", queryRef.current.trim());
      }

      const response = await fetch(`/api/admin/reports/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = (await response.json()) as LiveWalksListResponse;

      if (response.status === 403) {
        throw new Error("403 Access Denied — admin role required.");
      }
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Unable to load live walks.");
      }

      setRows(payload.rows || []);
      if (payload.stats) setStats(payload.stats);
      setLastSyncedAt(new Date().toISOString());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed.");
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  // Initial load + lightweight polling fallback (5s)
  useEffect(() => {
    if (!enabled) return;

    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, pollIntervalMs);

    return () => window.clearInterval(timer);
  }, [enabled, pollIntervalMs, refresh, query]);

  // Supabase Realtime — instant refresh on session/track mutations
  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(`admin-live-walks-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "booking_visit_sessions" },
        () => {
          setSyncMode("realtime");
          void refresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "booking_walk_tracks" },
        () => {
          setSyncMode("realtime");
          void refresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "booking_walk_track_points" },
        () => {
          setSyncMode("realtime");
          void refresh();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setSyncMode("realtime");
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setSyncMode("polling");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, refresh]);

  return {
    rows,
    stats,
    isLoading,
    error,
    lastSyncedAt,
    syncMode,
    refresh,
  };
}
