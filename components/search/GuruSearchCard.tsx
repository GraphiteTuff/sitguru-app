"use client";

/**
 * High-visibility pet compatibility badge for Guru search cards.
 */

import { buildMatchBadgeLabel } from "@/lib/search/matching-engine";

type GuruSearchMatchBadgeProps = {
  matchScore?: number | null;
  petName?: string | null;
  headline?: string | null;
  className?: string;
};

export default function GuruSearchMatchBadge({
  matchScore,
  petName,
  headline,
  className = "",
}: GuruSearchMatchBadgeProps) {
  if (matchScore == null || !Number.isFinite(matchScore) || matchScore <= 0) {
    return null;
  }

  const score = Math.round(matchScore);
  const name = (petName || "your pet").trim() || "your pet";

  return (
    <div className={`space-y-1 ${className}`.trim()}>
      <span className="inline-flex max-w-full items-center rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-300 px-3 py-1.5 text-xs font-black tracking-tight text-slate-950 shadow-md shadow-amber-500/25 ring-1 ring-amber-200/80">
        <span className="truncate">
          {buildMatchBadgeLabel(score, name)}
        </span>
      </span>
      {headline ? (
        <p className="line-clamp-2 text-[11px] font-semibold leading-4 text-emerald-800">
          {headline}
        </p>
      ) : null}
    </div>
  );
}
