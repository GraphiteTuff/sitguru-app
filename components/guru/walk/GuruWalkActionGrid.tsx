// components/guru/walk/GuruWalkActionGrid.tsx
"use client";

import type { WalkTrackingState } from "@/lib/pawreport/walk-events";

type GuruWalkActionGridProps = {
  trackingState: WalkTrackingState;
  isBusy: boolean;
  onStart: () => void;
  onPotty: (kind: "pee" | "poop") => void;
  onToggleBreak: () => void;
  onEnd: () => void;
  onRewardPerks?: () => void;
};

/**
 * Thumb-first command pad — oversized tap targets for leash-in-hand use.
 */
export default function GuruWalkActionGrid({
  trackingState,
  isBusy,
  onStart,
  onPotty,
  onToggleBreak,
  onEnd,
  onRewardPerks,
}: GuruWalkActionGridProps) {
  const idle = trackingState === "idle";
  const active = trackingState === "active";
  const onBreak = trackingState === "on_break";
  const ended = trackingState === "ended";
  const canLog = active || onBreak;

  return (
    <div className="space-y-3">
      {/* Primary: Start */}
      <button
        type="button"
        disabled={isBusy || !idle}
        onClick={onStart}
        className="flex min-h-[64px] w-full items-center justify-center rounded-3xl bg-emerald-700 px-4 text-base font-black text-white shadow-[0_12px_28px_rgba(4,120,87,0.35)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
      >
        Start Walk Session
      </button>

      {/* Potty split */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={isBusy || !canLog}
          onClick={() => onPotty("poop")}
          className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-3xl border-2 border-amber-300 bg-orange-50 px-3 text-sm font-black text-amber-950 active:scale-[0.99] disabled:opacity-45"
        >
          <span className="text-2xl" aria-hidden="true">
            💩
          </span>
          Poop
        </button>
        <button
          type="button"
          disabled={isBusy || !canLog}
          onClick={() => onPotty("pee")}
          className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-3xl border-2 border-sky-300 bg-sky-50 px-3 text-sm font-black text-sky-950 active:scale-[0.99] disabled:opacity-45"
        >
          <span className="text-2xl" aria-hidden="true">
            💦
          </span>
          Pee
        </button>
      </div>

      {/* Break toggle */}
      <button
        type="button"
        disabled={isBusy || idle || ended}
        onClick={onToggleBreak}
        className={`flex min-h-[64px] w-full items-center justify-center gap-2 rounded-3xl border-2 px-4 text-base font-black active:scale-[0.99] disabled:opacity-45 ${
          onBreak
            ? "border-emerald-300 bg-emerald-50 text-emerald-950"
            : "border-sky-300 bg-sky-50 text-sky-950"
        }`}
      >
        <span aria-hidden="true">{onBreak ? "▶️" : "💧"}</span>
        {onBreak ? "Resume Walk" : "Toggle Water / Rest Break"}
      </button>

      {/* PawPerks quick award */}
      {onRewardPerks ? (
        <button
          type="button"
          disabled={isBusy || (!canLog && !ended)}
          onClick={onRewardPerks}
          className="flex min-h-[64px] w-full items-center justify-center gap-2 rounded-3xl border-2 border-violet-300 bg-violet-50 px-4 text-base font-black text-violet-950 active:scale-[0.99] disabled:opacity-45"
        >
          <span aria-hidden="true">✨</span>
          Reward PawPerks
        </button>
      ) : null}

      {/* End — bottom anchor feel */}
      <button
        type="button"
        disabled={isBusy || idle || ended}
        onClick={onEnd}
        className="flex min-h-[68px] w-full items-center justify-center rounded-3xl bg-slate-900 px-4 text-base font-black text-white shadow-[0_12px_28px_rgba(15,23,42,0.28)] active:scale-[0.99] disabled:opacity-45"
      >
        End &amp; Send PawReport
      </button>
    </div>
  );
}
