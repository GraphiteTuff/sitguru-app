// components/pawreport/WalkTracker.tsx
"use client";

type WalkTrackerProps = {
  distanceLabel?: string;
  durationLabel?: string;
  statusLabel?: string;
  /** Guru can log walk actions; Pet Parent is view-only. */
  interactive?: boolean;
  /** Render an illustrated sample route, never a live location. */
  demo?: boolean;
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
  demo = false,
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

      {demo ? (
        <>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs font-extrabold text-emerald-900">Sample walk progress</p>
            <p className="text-xs font-extrabold text-emerald-700">60% complete</p>
          </div>
          <div role="progressbar" aria-label="Sample walk progress" aria-valuenow={60} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-2.5 overflow-hidden rounded-full bg-emerald-100">
            <div className="h-full w-[60%] rounded-full bg-gradient-to-r from-green-600 to-lime-500" />
          </div>
          <div role="img" aria-label="Illustrated demo route with start and end markers; not live GPS" className="relative mt-4 h-40 overflow-hidden rounded-2xl border border-emerald-100 bg-[#e9f6ec] sm:h-48">
            <svg aria-hidden="true" viewBox="0 0 520 240" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
              <rect width="520" height="240" fill="#e9f6ed" />
              <path d="M0 170 L165 123 280 172 390 138 520 170 V240 H0Z" fill="#d4ebce" />
              <path d="M0 44 116 56 193 18 295 50 377 12 520 45" fill="none" stroke="#ffffff" strokeWidth="18" />
              <path d="M20 238 125 158 205 152 287 99 340 0" fill="none" stroke="#ffffff" strokeWidth="15" />
              <path d="M0 100 93 118 200 88 283 119 377 93 520 133" fill="none" stroke="#ffffff" strokeWidth="15" />
              <path d="M168 0 164 80 216 141 231 240" fill="none" stroke="#ffffff" strokeWidth="12" />
              <path d="M432 0 416 66 442 155 503 240" fill="none" stroke="#ffffff" strokeWidth="12" />
              <path d="M382 0 C389 30 360 50 385 72 S444 105 432 139" fill="none" stroke="#b2dfee" strokeWidth="20" />
              <path d="M60 185 C115 195 151 151 196 130 S258 106 290 122 S365 126 405 91 L460 63" fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M60 185 C115 195 151 151 196 130 S258 106 290 122 S365 126 405 91 L460 63" fill="none" stroke="#00a450" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="60" cy="185" r="16" fill="#fff"/><circle cx="60" cy="185" r="10" fill="#00834e"/><circle cx="60" cy="185" r="4" fill="#fff"/>
              <circle cx="460" cy="63" r="23" fill="#fff"/><circle cx="460" cy="63" r="17" fill="#00834e"/><circle cx="460" cy="63" r="6" fill="#fff"/>
            </svg>
            <span className="absolute bottom-2 left-2 rounded-md bg-white/95 px-2 py-1 text-[10px] font-bold text-emerald-900 shadow-sm">Illustrative route · Not GPS</span>
          </div>
        </>
      ) : (
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

      )}
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
