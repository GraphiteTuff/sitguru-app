// hooks/useLiveWalkStream.ts
"use client";

/**
 * Pet Parent realtime walk reception via SSE.
 * Consumes enforced PawReportLiveEvent payloads.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  snackbarFromLiveEvent,
  trackingStateFromEventType,
  type PawReportLiveEvent,
  type WalkGeoPoint,
  type WalkMapMarker,
  type WalkTrackingState,
} from "@/lib/pawreport/walk-events";

export type LiveWalkSnackbar = {
  id: string;
  tone: "info" | "success" | "potty" | "break";
  title: string;
  body: string;
};

type UseLiveWalkStreamOptions = {
  enabled?: boolean;
};

type UseLiveWalkStreamResult = {
  trackingState: WalkTrackingState;
  path: WalkGeoPoint[];
  markers: WalkMapMarker[];
  snackbar: LiveWalkSnackbar | null;
  lastEvent: PawReportLiveEvent | null;
  petName: string;
  distanceMiles: number;
  durationMinutes: number;
  isConnected: boolean;
  error: string;
  dismissSnackbar: () => void;
};

function pointFromEvent(event: PawReportLiveEvent): WalkGeoPoint | null {
  if (event.data.latitude == null || event.data.longitude == null) return null;
  return {
    lat: event.data.latitude,
    lng: event.data.longitude,
    accuracy: event.data.accuracy ?? null,
    recordedAt: event.data.timestamp,
  };
}

function markerFromEvent(event: PawReportLiveEvent): WalkMapMarker | null {
  const point = pointFromEvent(event);
  if (!point) return null;

  const map: Record<string, WalkMapMarker["kind"] | null> = {
    WALK_START: "start",
    BREAK_START: "break",
    BREAK_END: "break_end",
    POTTY_PEE: "potty_pee",
    POTTY_POOP: "potty_poop",
    WALK_END: "end",
  };

  const kind = map[event.eventType];
  if (!kind) return null;

  const labels: Record<WalkMapMarker["kind"], string> = {
    start: "Walk started",
    break: "Break",
    break_end: "Resumed",
    potty_pee: "Pee",
    potty_poop: "Poop",
    end: "Walk ended",
  };

  return {
    id: `${event.eventType}-${event.data.timestamp}`,
    kind,
    lat: point.lat,
    lng: point.lng,
    label: labels[kind],
    createdAt: event.data.timestamp,
  };
}

export function useLiveWalkStream(
  bookingId: string | null | undefined,
  options: UseLiveWalkStreamOptions = {},
): UseLiveWalkStreamResult {
  const enabled = options.enabled ?? true;
  const [trackingState, setTrackingState] = useState<WalkTrackingState>("idle");
  const [path, setPath] = useState<WalkGeoPoint[]>([]);
  const [markers, setMarkers] = useState<WalkMapMarker[]>([]);
  const [snackbar, setSnackbar] = useState<LiveWalkSnackbar | null>(null);
  const [lastEvent, setLastEvent] = useState<PawReportLiveEvent | null>(null);
  const [petName, setPetName] = useState("Scout");
  const [distanceMiles, setDistanceMiles] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const sourceRef = useRef<EventSource | null>(null);
  const trackingRef = useRef<WalkTrackingState>("idle");

  const dismissSnackbar = useCallback(() => setSnackbar(null), []);

  useEffect(() => {
    const id = String(bookingId || "").trim();
    if (!id || !enabled) return;

    const url = `/api/walk/stream/${encodeURIComponent(id)}`;
    const source = new EventSource(url, { withCredentials: true });
    sourceRef.current = source;

    source.onopen = () => {
      setIsConnected(true);
      setError("");
    };

    source.onerror = () => {
      setIsConnected(false);
      setError("Live walk stream disconnected. Reconnecting…");
    };

    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as PawReportLiveEvent;
        if (!event?.eventType || !event?.bookingId) return;

        if (event.eventType === "HEARTBEAT") return;

        setLastEvent(event);

        let nextState = trackingStateFromEventType(
          event.eventType,
          trackingRef.current,
        );

        // SNAPSHOT carries current walk status via message + walkTrackId
        if (event.eventType === "SNAPSHOT") {
          const msg = String(event.data.message || "").toLowerCase();
          if (msg.includes("break")) nextState = "on_break";
          else if (event.data.walkTrackId) nextState = "active";
          else nextState = "idle";
        }

        trackingRef.current = nextState;
        setTrackingState(nextState);

        if (event.data.petName) setPetName(event.data.petName);

        if (event.data.currentMetrics) {
          setDistanceMiles(event.data.currentMetrics.distanceMiles);
          setDurationMinutes(event.data.currentMetrics.durationMinutes);
        }

        const point = pointFromEvent(event);

        if (event.eventType === "WALK_START") {
          setPath(point ? [point] : []);
          setMarkers([]);
        }

        if (
          point &&
          (event.eventType === "GPS_PING" ||
            event.eventType === "BREAK_END" ||
            event.eventType === "WALK_START")
        ) {
          if (event.eventType !== "WALK_START") {
            setPath((previous) => [...previous, point]);
          }
        }

        const marker = markerFromEvent(event);
        if (marker) {
          setMarkers((previous) => {
            if (previous.some((item) => item.id === marker.id)) return previous;
            return [...previous, marker];
          });
        }

        const banner = snackbarFromLiveEvent(event);
        if (banner) {
          setSnackbar({
            id: `${event.eventType}-${event.data.timestamp}`,
            ...banner,
          });
        }
      } catch (err) {
        console.warn("Walk SSE parse error:", err);
      }
    };

    return () => {
      source.close();
      sourceRef.current = null;
      setIsConnected(false);
    };
  }, [bookingId, enabled]);

  useEffect(() => {
    if (!snackbar) return;
    const timer = window.setTimeout(() => setSnackbar(null), 5500);
    return () => window.clearTimeout(timer);
  }, [snackbar]);

  return {
    trackingState,
    path,
    markers,
    snackbar,
    lastEvent,
    petName,
    distanceMiles,
    durationMinutes,
    isConnected,
    error,
    dismissSnackbar,
  };
}
