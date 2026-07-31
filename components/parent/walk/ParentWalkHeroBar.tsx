// components/parent/walk/ParentWalkHeroBar.tsx
"use client";

import type { WalkTrackingState } from "@/lib/pawreport/walk-events";

type ParentWalkHeroBarProps = {
  petName: string;
  trackingState: WalkTrackingState;
  distanceMiles: number;
  elapsedLabel: string;
  loggedCount: number;
  isConnected: boolean;
};

function statusCopy(state: WalkTrackingState) {
  switch (state) {
    case "active":
      return { label: "Live tracking", tone: "bg-emerald-400" };
    case "on_break":
      return { label: "On break", tone: "bg-amber-300" };
    case "ended":
      return { label: "Walk complete", tone: "bg-sky-300" };
    default:
      return { label: "Waiting for Guru", tone: "bg-white/50" };
  }
}

export default function ParentWalkHeroBar({
  petName,
  trackingState,
  distanceMiles,
  elapsedLabel,
  loggedCount,
  isConnected,
}: ParentWalkHeroBarProps) {
  const status = statusCopy(trackingState);

  return (
    <header className="sticky top-0 z-40 bg-emerald-900 text-white shadow-[0_12px_40px_rgba(6,78,59,0.35)]">
      <div className="px-4 pb-4 pt-[max(0.85rem,env(safe-area-inset-top))]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200/90">
              PawReport Live
            </p>
            <h1 className="mt-1 truncate text-[clamp(1.35rem,5.5vw,1.85rem)] font-black leading-tight tracking-[-0.04em]">
              {petName}&apos;s walk
            </h1>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold">
              <span className={`h-2 w-2 rounded-full ${status.tone} ${trackingState === "active" ? "animate-pulse" : ""}`} />
              {status.label}
              <span className="text-emerald-100/70">·</span>
              <span className={isConnected ? "text-emerald-100" : "text-amber-200"}>
                {isConnected ? "Live" : "Reconnecting"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Metric
            label="Distance"
            value={`${distanceMiles.toFixed(1)}`}
            unit="mi"
          />
          <Metric label="Time" value={elapsedLabel} unit="" />
          <Metric
            label="Logged"
            value={String(loggedCount)}
            unit={loggedCount === 1 ? "event" : "events"}
          />
        </div>
      </div>
    </header>
  );
}

function Metric(props: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-2.5 py-2.5 backdrop-blur-sm">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-100/80">
        {props.label}
      </p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="text-[clamp(1.05rem,4.8vw,1.35rem)] font-black tracking-[-0.03em] tabular-nums">
          {props.value}
        </span>
        {props.unit ? (
          <span className="text-[10px] font-bold text-emerald-100/80">
            {props.unit}
          </span>
        ) : null}
      </p>
    </div>
  );
}
