// hooks/useGuruWalkGeolocation.ts
"use client";

/**
 * Mobile hardware geolocation harness for Guru walk publishing.
 * - watchPosition with highAccuracy
 * - Throttled pings to /api/guru/walk/ping every 10–15s while Tracking Live
 * - Graceful permission / signal-loss messaging
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type GuruGeoFix = {
  lat: number;
  lng: number;
  accuracy: number | null;
  recordedAt: number;
};

type UseGuruWalkGeolocationOptions = {
  bookingId: string;
  /** Only dispatch pings while true (active walk, not break/ended) */
  shouldTrack: boolean;
  /** Throttle window in ms (default 12s — mid of 10–15s battery budget) */
  pingIntervalMs?: number;
};

type UseGuruWalkGeolocationResult = {
  lastFix: GuruGeoFix | null;
  gpsMessage: string;
  connectionLabel: "tracking" | "paused" | "reconnecting" | "idle";
  lastPingAt: number | null;
  readCurrentFix: () => Promise<GuruGeoFix | null>;
  forcePing: () => Promise<boolean>;
};

const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

function geoErrorMessage(error: GeolocationPositionError | null) {
  if (!error) return "Location unavailable — actions still work without GPS.";
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location permission denied. Enable GPS to publish live route points.";
    case error.POSITION_UNAVAILABLE:
      return "GPS signal lost temporarily. Retrying…";
    case error.TIMEOUT:
      return "GPS timed out. Waiting for the next fix…";
    default:
      return "Location unavailable right now.";
  }
}

export function useGuruWalkGeolocation(
  options: UseGuruWalkGeolocationOptions,
): UseGuruWalkGeolocationResult {
  const pingIntervalMs = options.pingIntervalMs ?? 12000;
  const [lastFix, setLastFix] = useState<GuruGeoFix | null>(null);
  const [gpsMessage, setGpsMessage] = useState("GPS standby");
  const [lastPingAt, setLastPingAt] = useState<number | null>(null);
  const [connectionLabel, setConnectionLabel] = useState<
    "tracking" | "paused" | "reconnecting" | "idle"
  >("idle");

  const watchIdRef = useRef<number | null>(null);
  const lastFixRef = useRef<GuruGeoFix | null>(null);
  const lastPingAtRef = useRef(0);
  const shouldTrackRef = useRef(options.shouldTrack);
  const bookingIdRef = useRef(options.bookingId);

  useEffect(() => {
    shouldTrackRef.current = options.shouldTrack;
  }, [options.shouldTrack]);

  useEffect(() => {
    bookingIdRef.current = options.bookingId;
  }, [options.bookingId]);

  const dispatchPing = useCallback(async (fix: GuruGeoFix) => {
    try {
      const response = await fetch("/api/guru/walk/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bookingId: bookingIdRef.current,
          lat: fix.lat,
          lng: fix.lng,
          accuracy: fix.accuracy,
        }),
      });

      if (response.status === 409) {
        // On break — expected swallow
        return true;
      }

      if (!response.ok) {
        setConnectionLabel("reconnecting");
        return false;
      }

      setLastPingAt(Date.now());
      setConnectionLabel("tracking");
      return true;
    } catch {
      setConnectionLabel("reconnecting");
      return false;
    }
  }, []);

  const clearWatch = useCallback(() => {
    if (
      watchIdRef.current !== null &&
      typeof navigator !== "undefined" &&
      navigator.geolocation
    ) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const readCurrentFix = useCallback(async () => {
    if (lastFixRef.current) return lastFixRef.current;
    if (typeof navigator === "undefined" || !navigator.geolocation) return null;

    return new Promise<GuruGeoFix | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const fix: GuruGeoFix = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy ?? null,
            recordedAt: Date.now(),
          };
          lastFixRef.current = fix;
          setLastFix(fix);
          resolve(fix);
        },
        (error) => {
          setGpsMessage(geoErrorMessage(error));
          resolve(null);
        },
        WATCH_OPTIONS,
      );
    });
  }, []);

  const forcePing = useCallback(async () => {
    const fix = await readCurrentFix();
    if (!fix) return false;
    lastPingAtRef.current = Date.now();
    return dispatchPing(fix);
  }, [dispatchPing, readCurrentFix]);

  useEffect(() => {
    if (!options.shouldTrack) {
      clearWatch();
      setConnectionLabel("paused");
      setGpsMessage((current) =>
        current.toLowerCase().includes("denied")
          ? current
          : "GPS paused — coordinate collection suspended.",
      );
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsMessage("This browser does not support GPS.");
      setConnectionLabel("reconnecting");
      return;
    }

    clearWatch();
    setGpsMessage("Acquiring high-accuracy GPS…");
    setConnectionLabel("tracking");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const fix: GuruGeoFix = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
          recordedAt: Date.now(),
        };
        lastFixRef.current = fix;
        setLastFix(fix);
        setGpsMessage(
          fix.accuracy != null
            ? `GPS locked (±${Math.round(fix.accuracy)}m)`
            : "GPS locked",
        );

        if (!shouldTrackRef.current) return;

        const now = Date.now();
        if (now - lastPingAtRef.current < pingIntervalMs) return;
        lastPingAtRef.current = now;
        void dispatchPing(fix);
      },
      (error) => {
        setGpsMessage(geoErrorMessage(error));
        setConnectionLabel("reconnecting");
      },
      WATCH_OPTIONS,
    );

    return () => clearWatch();
  }, [
    options.shouldTrack,
    options.bookingId,
    pingIntervalMs,
    clearWatch,
    dispatchPing,
  ]);

  useEffect(() => () => clearWatch(), [clearWatch]);

  return {
    lastFix,
    gpsMessage,
    connectionLabel: options.shouldTrack ? connectionLabel : "paused",
    lastPingAt,
    readCurrentFix,
    forcePing,
  };
}
