// components/guru/walk/GuruWalkControlShell.tsx
"use client";

/**
 * Guru mobile walk publisher — sticky metrics + thumb action grid + GPS harness.
 * Posts actions to /api/walk/[bookingId]/actions and GPS batches to /api/guru/walk/ping.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  trackingStateFromEventType,
  type PawReportLiveEvent,
  type WalkActionName,
  type WalkTrackingState,
} from "@/lib/pawreport/walk-events";
import { useGuruWalkGeolocation } from "@/hooks/useGuruWalkGeolocation";
import GuruWalkMetricsBar from "@/components/guru/walk/GuruWalkMetricsBar";
import GuruWalkActionGrid from "@/components/guru/walk/GuruWalkActionGrid";
import WalkChatBridge from "@/components/messaging/WalkChatBridge";
import PawPerkRewardModal from "@/components/guru/live-walks/PawPerkRewardModal";

type GuruWalkControlShellProps = {
  bookingId: string;
  petName?: string;
  currentUserId?: string;
};

function formatElapsed(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}:${String(rm).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function GuruWalkControlShell({
  bookingId,
  petName = "Scout",
  currentUserId,
}: GuruWalkControlShellProps) {
  const [trackingState, setTrackingState] = useState<WalkTrackingState>("idle");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastMessage, setLastMessage] = useState("");
  const [distanceMiles, setDistanceMiles] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [rewardOpen, setRewardOpen] = useState(false);

  const trackingStateRef = useRef<WalkTrackingState>("idle");
  const isBusyRef = useRef(false);

  useEffect(() => {
    trackingStateRef.current = trackingState;
  }, [trackingState]);

  useEffect(() => {
    isBusyRef.current = isBusy;
  }, [isBusy]);

  const shouldTrack = trackingState === "active";

  const { gpsMessage, connectionLabel, lastFix, readCurrentFix } =
    useGuruWalkGeolocation({
      bookingId,
      shouldTrack,
      pingIntervalMs: 12000,
    });

  // Live elapsed clock while walk is active or on break
  useEffect(() => {
    if (trackingState === "idle") {
      setElapsedSeconds(0);
      return;
    }
    if (trackingState === "ended") {
      setElapsedSeconds(Math.round(durationMinutes * 60));
      return;
    }

    const origin =
      startedAt ??
      Date.now() - Math.max(0, Math.round(durationMinutes * 60) * 1000);

    const tick = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - origin) / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [trackingState, startedAt, durationMinutes]);

  const banner = useMemo(() => {
    if (trackingState === "ended") {
      return { label: "Walk locked · PawReport sent", tone: "ended" as const };
    }
    if (trackingState === "on_break") {
      return { label: "Paused on Break", tone: "paused" as const };
    }
    if (trackingState === "active") {
      if (connectionLabel === "reconnecting") {
        return {
          label: "Disconnected / Reconnecting",
          tone: "reconnect" as const,
        };
      }
      return { label: "Tracking Live", tone: "live" as const };
    }
    return { label: "Ready to start", tone: "idle" as const };
  }, [trackingState, connectionLabel]);

  const runAction = useCallback(
    async (
      action: WalkActionName,
      extras: { pottyKind?: "pee" | "poop"; note?: string } = {},
    ) => {
      if (isBusyRef.current) return;
      setIsBusy(true);
      setError("");

      try {
        // Prefer last watch fix; otherwise one-shot high-accuracy read
        let geo = lastFix;
        if (!geo && action !== "ping_coordinate") {
          geo = await readCurrentFix();
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

        const event = payload.event;
        const nextState = trackingStateFromEventType(
          event.eventType,
          trackingStateRef.current,
        );
        trackingStateRef.current = nextState;
        setTrackingState(nextState);

        if (event.eventType === "WALK_START") {
          setStartedAt(Date.now());
          setDistanceMiles(0);
          setDurationMinutes(0);
        }
        if (event.eventType === "WALK_END") {
          setStartedAt(null);
        }

        if (event.data.currentMetrics) {
          setDistanceMiles(event.data.currentMetrics.distanceMiles);
          setDurationMinutes(event.data.currentMetrics.durationMinutes);
        }

        setLastMessage(
          event.data.message ||
            (extras.pottyKind
              ? `${extras.pottyKind === "poop" ? "Poop" : "Pee"} logged.`
              : `${action} ok`),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Walk action failed.");
      } finally {
        setIsBusy(false);
      }
    },
    [bookingId, lastFix, readCurrentFix],
  );

  function handleEnd() {
    if (
      !window.confirm(
        "End walk and send the PawReport? This locks the route and notifies the Pet Parent.",
      )
    ) {
      return;
    }
    void runAction("end_walk");
  }

  function handleToggleBreak() {
    if (trackingState === "on_break") {
      void runAction("resume");
      return;
    }
    void runAction("take_break");
  }

  return (
    <main className="relative min-h-[100dvh] bg-[linear-gradient(180deg,#ecfdf5_0%,#f8fafc_48%,#ffffff_100%)] text-slate-950">
      <GuruWalkMetricsBar
        petName={petName}
        distanceMiles={distanceMiles}
        elapsedLabel={formatElapsed(elapsedSeconds)}
        banner={banner}
        gpsMessage={gpsMessage}
      />

      {/* Keep-browser-awake notice — mobile OS will suspend background tabs */}
      <div className="mx-3 mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] font-bold leading-5 text-amber-950">
        Keep this browser tab open in the foreground while tracking. Mobile OS
        power saving can pause GPS if SitGuru is backgrounded or the screen
        locks for a long time.
      </div>

      <div className="px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        {error ? (
          <p className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
            {error}
          </p>
        ) : null}

        {lastMessage ? (
          <p className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
            {lastMessage}
          </p>
        ) : null}

        <GuruWalkActionGrid
          trackingState={trackingState}
          isBusy={isBusy}
          onStart={() => void runAction("start_walk")}
          onPotty={(kind) =>
            void runAction("potty_break", {
              pottyKind: kind,
              note:
                kind === "poop"
                  ? "POTTY_BREAK: Poop logged."
                  : "POTTY_BREAK: Pee logged.",
            })
          }
          onToggleBreak={handleToggleBreak}
          onEnd={handleEnd}
          onRewardPerks={() => setRewardOpen(true)}
        />

        <p className="mt-4 px-1 text-center text-[11px] font-semibold leading-5 text-slate-500">
          GPS pings batch to the SitGuru engine every ~12 seconds while Tracking
          Live. Breaks suspend coordinate collection to prevent park drift.
        </p>
      </div>

      <PawPerkRewardModal
        open={rewardOpen}
        onClose={() => setRewardOpen(false)}
        bookingId={bookingId}
        petName={petName}
        onAwarded={({ pointsAwarded }) => {
          setLastMessage(
            `✨ Awarded ${pointsAwarded} PawPerks to ${petName}'s parent.`,
          );
        }}
      />

      {currentUserId ? (
        <WalkChatBridge
          bookingId={bookingId}
          currentUserId={currentUserId}
          title={`${petName} · Parent chat`}
        />
      ) : null}
    </main>
  );
}
