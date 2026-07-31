// hooks/useAdminWalkMapData.ts
"use client";

/**
 * Loads polyline coordinates + timeline pins for the selected admin walk.
 * Polls every 5s and refreshes on Realtime track-point inserts.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export type AdminMapCoordinate = {
  lat: number;
  lng: number;
  recordedAt: string;
  accuracy?: number | null;
};

export type AdminMapEventPin = {
  id: string;
  kind: "potty" | "break" | "start" | "end" | "note";
  label: string;
  lat: number;
  lng: number;
  at: string;
};

export type AdminWalkMapPayload = {
  bookingId: string;
  petName: string;
  globalTrackingStatus: string;
  walkStatus: string | null;
  isCompleted: boolean;
  distanceMiles: number;
  durationMinutes: number;
  path: AdminMapCoordinate[];
  events: AdminMapEventPin[];
  lastPoint: AdminMapCoordinate | null;
};

type UseAdminWalkMapDataResult = {
  data: AdminWalkMapPayload | null;
  isLoading: boolean;
  error: string;
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

export function useAdminWalkMapData(
  bookingId: string | null,
): UseAdminWalkMapDataResult {
  const [data, setData] = useState<AdminWalkMapPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inFlightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!bookingId || inFlightRef.current) return;
    inFlightRef.current = true;
    setIsLoading(true);

    try {
      const token = await getAccessToken();
      const response = await fetch(
        `/api/admin/reports/${encodeURIComponent(bookingId)}/live-map`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
      } & Partial<AdminWalkMapPayload>;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Unable to load walk map.");
      }

      setData({
        bookingId: payload.bookingId || bookingId,
        petName: payload.petName || "Scout",
        globalTrackingStatus: payload.globalTrackingStatus || "ACTIVE_TRACKING",
        walkStatus: payload.walkStatus ?? null,
        isCompleted: Boolean(payload.isCompleted),
        distanceMiles: Number(payload.distanceMiles || 0),
        durationMinutes: Number(payload.durationMinutes || 0),
        path: payload.path || [],
        events: payload.events || [],
        lastPoint: payload.lastPoint || null,
      });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Map load failed.");
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) {
      setData(null);
      return;
    }

    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, 5000);

    const channel = supabase
      .channel(`admin-walk-map-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "booking_walk_track_points",
          filter: `booking_id=eq.${bookingId}`,
        },
        () => {
          void refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "booking_visit_updates",
          filter: `booking_id=eq.${bookingId}`,
        },
        () => {
          void refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "booking_walk_tracks",
          filter: `booking_id=eq.${bookingId}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [bookingId, refresh]);

  return { data, isLoading, error, refresh };
}
