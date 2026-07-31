// components/pawreport/GuruLiveActionPanel.tsx
"use client";

/**
 * Guru mobile live action panel — phone-first walk controls.
 * Uses navigator.geolocation.watchPosition with graceful GPS / permission fallbacks.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  snackbarFromLiveEvent,
  trackingStateFromEventType,
  type PawReportLiveEvent,
  type WalkActionName,
  type WalkTrackingState,
} from "@/lib/pawreport/walk-events";

type GuruLiveActionPanelProps = {
  bookingId: string;
  petName?: string;
  className?: string;
  onEvent?: (event: PawReportLiveEvent) => void;
};

type GeoFix = {
  lat: number;
  lng: number;
  accuracy: number | null;
};

function geolocationErrorMessage(error: GeolocationPositionError | null) {
  if (!error) {
    return "Location is temporarily unavailable. You can still log walk actions without GPS.";
  }

  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location permission denied. Enable location for live tracking — potty/break buttons still work without GPS.";
    case error.POSITION_UNAVAILABLE:
      return "GPS signal lost temporarily. We'll keep trying — actions still save without coordinates.";
    case error.TIMEOUT:
      return "GPS timed out. Retrying when signal returns…";
    default:
      return "Location unavailable right now. Walk controls remain usable.";
  }
}

export default function GuruLiveActionPanel({
  bookingId,
  petName = "Scout",
  className = "",
  onEvent,
}: GuruLiveActionPanelProps) {
  const [trackingState, setTrackingState] = useState<WalkTrackingState>("idle");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");
  const [gpsMessage, setGpsMessage] = useState("");
  const [lastMessage, setLastMessage] = useState("");
  const [lastFix, setLastFix] = useState<GeoFix | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const trackingStateRef = useRef<WalkTrackingState>("idle");
  const lastFixRef = useRef<GeoFix | null>(null);
  const isBusyRef = useRef(false);
  const lastPingAtRef = useRef(0);

  useEffect(() => {
    trackingStateRef.current = trackingState;
  }, [trackingState]);

  useEffect(() => {
    lastFixRef.current = lastFix;
  }, [lastFix]);

  useEffect(() => {
    isBusyRef.current = isBusy;
  }, [isBusy]);

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

  const startWatch = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsMessage(
        "This browser does not support GPS. You can still log breaks and potty updates.",
      );
      return;
    }

    clearWatch();
    setGpsMessage("Acquiring GPS signal…");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const fix: GeoFix = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
        };
        lastFixRef.current = fix;
        setLastFix(fix);
        setGpsMessage(
          position.coords.accuracy != null
            ? `GPS locked (±${Math.round(position.coords.accuracy)}m)`
            : "GPS locked",
        );

        // Throttle silent coordinate pings (~8s) while walk is active
        const now = Date.now();
        if (
          trackingStateRef.current !== "active" ||
          isBusyRef.current ||
          now - lastPingAtRef.current < 8000
        ) {
          return;
        }
        lastPingAtRef.current = now;

        void fetch(`/api/walk/${encodeURIComponent(bookingId)}/actions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            action: "ping_coordinate",
            lat: fix.lat,
            lng: fix.lng,
            accuracy: fix.accuracy,
          }),
        }).catch(() => {
          // Network blips must not crash the tracking UI
        });
      },
      (geoError) => {
        setGpsMessage(geolocationErrorMessage(geoError));
        // Keep last known fix — transient signal loss must not wipe coordinates
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      },
    );
  }, [bookingId, clearWatch]);

  // Start watching when walk becomes active; stop on break/end/idle
  useEffect(() => {
    if (trackingState === "active") {
      startWatch();
      return () => clearWatch();
    }

    clearWatch();
    if (trackingState === "on_break") {
      setGpsMessage((current) =>
        current.includes("denied")
          ? current
          : "GPS paused on break (prevents park drift).",
      );
    }
    if (trackingState === "ended") {
      setGpsMessage("Walk ended — route locked.");
    }
  }, [trackingState, startWatch, clearWatch]);

  useEffect(() => () => clearWatch(), [clearWatch]);

  const runAction = useCallback(
    async (
      action: WalkActionName,
      extras: { pottyKind?: "pee" | "poop"; note?: string } = {},
    ) => {
      if (isBusyRef.current) return;
      setIsBusy(true);
      setError("");

      try {
        // Prefer last watch fix; fall back to a one-shot read if needed
        let geo = lastFixRef.current;

        if (
          !geo &&
          typeof navigator !== "undefined" &&
          navigator.geolocation &&
          action !== "ping_coordinate"
        ) {
          geo = await new Promise<GeoFix | null>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                  accuracy: position.coords.accuracy ?? null,
                });
              },
              (geoError) => {
                setGpsMessage(geolocationErrorMessage(geoError));
                resolve(null);
              },
              {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 10000,
              },
            );
          });
        }

        const response = await fetch(
          `/api/walk/${encodeURIComponent(bookingId)}/actions`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              action,
              lat: geo?.lat ?? null,
              lng: geo?.lng ?? null,
              accuracy: geo?.accuracy ?? null,
              pottyKind: extras.pottyKind,
              note: extras.note,
            }),
          },
        );

        const payload = (await response.json().catch(() => null)) as {
          error?: string;
          event?: PawReportLiveEvent;
        } | null;

        if (!response.ok || !payload?.event) {
          throw new Error(payload?.error || "Walk action failed.");
        }

        const nextState = trackingStateFromEventType(
          payload.event.eventType,
          trackingStateRef.current,
        );
        trackingStateRef.current = nextState;
        setTrackingState(nextState);

        const banner = snackbarFromLiveEvent(payload.event);
        setLastMessage(
          banner?.body || payload.event.data.message || `${action} ok`,
        );
        onEvent?.(payload.event);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Walk action failed.");
      } finally {
        setIsBusy(false);
      }
    },
    [bookingId, onEvent],
  );

  const statusLabel =
    trackingState === "active"
      ? "Walk active — GPS tracking"
      : trackingState === "on_break"
        ? "On break — GPS paused"
        : trackingState === "ended"
          ? "Walk ended — route locked"
          : "Ready to start";

  return (
    <section
      className={`rounded-[28px] border border-emerald-100 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-5 ${className}`}
      style={{ fontFamily: "var(--font-sans), var(--sitguru-font-sans)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
            Guru live actions
          </p>
          <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-950">
            {petName}&apos;s walk controls
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {statusLabel}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-[11px] font-black ${
            trackingState === "active"
              ? "bg-emerald-100 text-emerald-800"
              : trackingState === "on_break"
                ? "bg-amber-100 text-amber-900"
                : "bg-slate-100 text-slate-700"
          }`}
        >
          {trackingState}
        </span>
      </div>

      {gpsMessage ? (
        <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
          {gpsMessage}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
          {error}
        </p>
      ) : null}

      {lastMessage ? (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
          {lastMessage}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          disabled={
            isBusy ||
            trackingState === "active" ||
            trackingState === "on_break"
          }
          onClick={() => void runAction("start_walk")}
          className="col-span-2 min-h-14 rounded-2xl bg-emerald-700 px-4 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start Walk
        </button>

        {trackingState === "on_break" ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => void runAction("resume")}
            className="min-h-14 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-black text-emerald-900 disabled:opacity-50"
          >
            Resume
          </button>
        ) : (
          <button
            type="button"
            disabled={isBusy || trackingState !== "active"}
            onClick={() => void runAction("take_break")}
            className="min-h-14 rounded-2xl border border-amber-200 bg-amber-50 px-3 text-sm font-black text-amber-950 disabled:opacity-50"
          >
            Take Break
          </button>
        )}

        <button
          type="button"
          disabled={
            isBusy || trackingState === "idle" || trackingState === "ended"
          }
          onClick={() => void runAction("end_walk")}
          className="min-h-14 rounded-2xl border border-slate-200 bg-slate-900 px-3 text-sm font-black text-white disabled:opacity-50"
        >
          End Walk
        </button>

        <button
          type="button"
          disabled={
            isBusy || trackingState === "idle" || trackingState === "ended"
          }
          onClick={() => void runAction("potty_break", { pottyKind: "pee" })}
          className="min-h-14 rounded-2xl border border-sky-200 bg-sky-50 px-3 text-sm font-black text-sky-950 disabled:opacity-50"
        >
          Potty · Pee
        </button>

        <button
          type="button"
          disabled={
            isBusy || trackingState === "idle" || trackingState === "ended"
          }
          onClick={() => void runAction("potty_break", { pottyKind: "poop" })}
          className="min-h-14 rounded-2xl border border-amber-200 bg-orange-50 px-3 text-sm font-black text-amber-950 disabled:opacity-50"
        >
          Potty · Poop
        </button>
      </div>

      <p className="mt-4 text-[11px] font-semibold leading-5 text-slate-500">
        GPS uses watchPosition while the walk is active. If signal drops or
        permission is denied, actions still save to the PawReport history —
        coordinates are attached when available.
      </p>
    </section>
  );
}
