// components/pawreport/WalkTracker.tsx
"use client";

type WalkTrackerProps = {
  distanceLabel?: string;
  durationLabel?: string;
  statusLabel?: string;
  /** Guru can log walk actions; Pet Parent is view-only. */
  interactive?: boolean;
  onLogWalk?: () => void;
  className?: string;
};

/**
 * Placeholder walk progress card — metrics + SVG route path.
 * Matches the homepage PawReport Live mock (0.8 mi · 18 min).
 */
export default function WalkTracker({
  distanceLabel = "0.8 mi",
  durationLabel = "18 min",
  statusLabel = "Walk in progress",
  interactive = false,
  onLogWalk,
  className = "",
}: WalkTrackerProps) {
  return (
    <div
      className={`rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
            {statusLabel}
          </p>
          <p className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-950 sm:text-2xl">
            {distanceLabel} · {durationLabel}
          </p>
        </div>
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm"
        >
          🚶
        </span>
      </div>

      {/* SVG route map placeholder */}
      <div className="relative mt-4 h-36 overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 sm:h-40">
        <svg
          viewBox="0 0 320 160"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={`Walk route preview, ${distanceLabel} in ${durationLabel}`}
        >
          <defs>
            <linearGradient id="pawRouteStroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>

          {/* Soft map dots */}
          <circle cx="48" cy="118" r="3" fill="#10b981" opacity="0.55" />
          <circle cx="128" cy="78" r="3" fill="#38bdf8" opacity="0.55" />
          <circle cx="214" cy="52" r="3" fill="#10b981" opacity="0.55" />
          <circle cx="278" cy="36" r="3" fill="#38bdf8" opacity="0.45" />

          {/* Route path */}
          <path
            d="M42 122 C78 108, 98 92, 128 78 S176 58, 214 52 S258 42, 278 36"
            fill="none"
            stroke="url(#pawRouteStroke)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Start / end pins */}
          <circle cx="42" cy="122" r="7" fill="#059669" />
          <circle cx="42" cy="122" r="3" fill="#ffffff" />
          <circle cx="278" cy="36" r="7" fill="#0284c7" />
          <circle cx="278" cy="36" r="3" fill="#ffffff" />
        </svg>
      </div>

      {interactive ? (
        <button
          type="button"
          onClick={onLogWalk}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-black text-white transition hover:bg-emerald-800"
        >
          Log walk update
        </button>
      ) : null}
    </div>
  );
}
