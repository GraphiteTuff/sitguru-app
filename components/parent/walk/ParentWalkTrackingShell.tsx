// components/parent/walk/ParentWalkTrackingShell.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useLiveWalkStream } from "@/hooks/useLiveWalkStream";
import ParentWalkHeroBar from "@/components/parent/walk/ParentWalkHeroBar";
import ParentWalkSnackbar from "@/components/parent/walk/ParentWalkSnackbar";
import ParentWalkCompletedCard from "@/components/parent/walk/ParentWalkCompletedCard";
import {
  ParentWalkDeadZoneCard,
  ParentWalkMapSkeleton,
} from "@/components/parent/walk/ParentWalkSkeletons";
import WalkChatBridge from "@/components/messaging/WalkChatBridge";

const ParentWalkMobileMap = dynamic(
  () => import("@/components/parent/walk/ParentWalkMobileMap"),
  {
    ssr: false,
    loading: () => <ParentWalkMapSkeleton />,
  },
);

type ParentWalkTrackingShellProps = {
  bookingId: string;
  initialPetName?: string;
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

export default function ParentWalkTrackingShell({
  bookingId,
  initialPetName = "Scout",
  currentUserId,
}: ParentWalkTrackingShellProps) {
  const {
    trackingState,
    path,
    markers,
    snackbar,
    lastEvent,
    petName,
    distanceMiles,
    durationMinutes,
    isConnected,
    dismissSnackbar,
  } = useLiveWalkStream(bookingId);

  const displayPet = petName || initialPetName;
  const isCompleted = trackingState === "ended";
  const [bootstrapped, setBootstrapped] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [walkStartedAt, setWalkStartedAt] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setBootstrapped(true), 350);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (lastEvent?.eventType === "WALK_START") {
      setWalkStartedAt(Date.now());
    }
    if (lastEvent?.eventType === "WALK_END") {
      setWalkStartedAt(null);
    }
  }, [lastEvent?.eventType, lastEvent?.data.timestamp]);

  useEffect(() => {
    if (trackingState === "idle") {
      setElapsedSeconds(Math.round(durationMinutes * 60));
      return;
    }
    if (trackingState === "ended") {
      setElapsedSeconds(Math.round(durationMinutes * 60));
      return;
    }

    const started =
      walkStartedAt ??
      Date.now() - Math.max(0, Math.round(durationMinutes * 60) * 1000);

    const tick = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [trackingState, durationMinutes, walkStartedAt]);

  const elapsedLabel = useMemo(
    () => formatElapsed(elapsedSeconds || Math.round(durationMinutes * 60)),
    [elapsedSeconds, durationMinutes],
  );

  return (
    <main className="relative min-h-[100dvh] bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_42%,#f8fafc_100%)] text-slate-950">
      <ParentWalkHeroBar
        petName={displayPet}
        trackingState={trackingState}
        distanceMiles={distanceMiles}
        elapsedLabel={elapsedLabel}
        loggedCount={markers.length}
        isConnected={isConnected}
      />

      <ParentWalkSnackbar
        snackbar={snackbar}
        lastEvent={lastEvent}
        petName={displayPet}
        onDismiss={dismissSnackbar}
      />

      {!isConnected && bootstrapped ? <ParentWalkDeadZoneCard /> : null}

      <div className="px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        {isCompleted ? (
          <ParentWalkCompletedCard
            petName={displayPet}
            bookingId={bookingId}
            distanceMiles={distanceMiles}
            durationMinutes={durationMinutes}
            loggedCount={markers.length}
          />
        ) : null}

        <div className={isCompleted ? "mt-3" : ""}>
          {!bootstrapped ? (
            <ParentWalkMapSkeleton />
          ) : (
            <ParentWalkMobileMap
              path={path}
              markers={markers}
              isCompleted={isCompleted}
            />
          )}
        </div>

        {!isCompleted ? (
          <section className="mt-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
              Recent markers
            </h2>
            {markers.length === 0 ? (
              <p className="mt-3 text-sm font-semibold text-slate-500">
                Potty and break pins will appear here the moment your Guru logs
                them.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {[...markers].reverse().slice(0, 6).map((marker) => (
                  <li
                    key={marker.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2.5"
                  >
                    <span className="text-sm font-black text-slate-900">
                      {marker.label}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {new Date(marker.createdAt).toLocaleTimeString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <p className="mt-3 px-1 text-center text-xs font-semibold text-slate-500">
            Final route frozen above · reopen anytime from your booking history.
          </p>
        )}
      </div>

      {currentUserId ? (
        <WalkChatBridge
          bookingId={bookingId}
          currentUserId={currentUserId}
          title={`${displayPet}'s care chat`}
        />
      ) : null}
    </main>
  );
}
