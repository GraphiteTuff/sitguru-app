/**
 * Ambassador metrics chart primitives — pure SVG / Tailwind, fluid widths.
 */

"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Zap } from "lucide-react";

const BRAND = "#0D5C3A";

export function CircuitBrokenAlert({
  initHref = "/ambassador/dashboard/referrals",
}: {
  initHref?: string;
}) {
  return (
    <div
      role="alert"
      className="w-full rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4 text-amber-950 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-200/80 text-amber-900">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">
              Circuit broken
            </p>
            <p className="mt-1 text-sm font-black text-amber-950">
              Referral code unconfigured
            </p>
            <p className="mt-1 text-sm font-semibold leading-6 text-amber-900/90">
              Metrics charts are frozen at zero until your tracking string is
              initialized. Connect your ambassador referral code to restore the
              live circuit.
            </p>
          </div>
        </div>
        <Link
          href={initHref}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0D5C3A] px-4 text-xs font-black text-white transition hover:bg-[#09462C]"
        >
          Initialize tracking
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

/** Horizontal milestone pipeline: 0 → 25 → 50 → 150 signups. */
export function MilestonePipelineChart({
  referralCount,
  frozen = false,
  milestones = [
    { signups: 25, reward: 25 },
    { signups: 50, reward: 100 },
    { signups: 150, reward: 200 },
  ],
}: {
  referralCount: number;
  frozen?: boolean;
  milestones?: ReadonlyArray<{ signups: number; reward: number }>;
}) {
  const max = milestones[milestones.length - 1]?.signups || 150;
  const liveCount = frozen ? 0 : Math.max(0, referralCount);
  const progressPct = Math.min(100, (liveCount / max) * 100);

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
            Milestone pipeline
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {frozen
              ? "Progress held at 0 — reconnect referralCode"
              : `${liveCount} verified signups toward ${max}`}
          </p>
        </div>
        <p className="text-2xl font-black tabular-nums text-slate-950">
          {Math.round(progressPct)}%
        </p>
      </div>

      <div className="relative w-full pt-2">
        <div className="absolute left-0 right-0 top-[1.35rem] h-2 rounded-full bg-slate-100" />
        <div
          className="absolute left-0 top-[1.35rem] h-2 rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${progressPct}%`,
            backgroundColor: BRAND,
          }}
        />
        <ol className="relative z-[1] grid w-full grid-cols-4 gap-1">
          <li className="flex flex-col items-start">
            <span
              className={`grid h-7 w-7 place-items-center rounded-full border-2 text-[10px] font-black ${
                liveCount >= 0
                  ? "border-[#0D5C3A] bg-[#0D5C3A] text-white"
                  : "border-slate-200 bg-white text-slate-400"
              }`}
            >
              0
            </span>
            <span className="mt-2 text-[10px] font-bold text-slate-500">Start</span>
          </li>
          {milestones.map((milestone) => {
            const reached = liveCount >= milestone.signups;
            return (
              <li key={milestone.signups} className="flex flex-col items-end">
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full border-2 text-[10px] font-black ${
                    reached
                      ? "border-[#0D5C3A] bg-[#0D5C3A] text-white"
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                  title={`$${milestone.reward} at ${milestone.signups}`}
                >
                  {milestone.signups}
                </span>
                <span className="mt-2 text-right text-[10px] font-bold text-slate-500">
                  ${milestone.reward}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/** Clicks vs conversions distribution with fluid fill bars. */
export function TrafficDistributionChart({
  clicksCount,
  referralCount,
  frozen = false,
}: {
  clicksCount: number;
  referralCount: number;
  frozen?: boolean;
}) {
  const clicks = frozen ? 0 : Math.max(0, clicksCount);
  const conversions = frozen ? 0 : Math.max(0, referralCount);
  const max = Math.max(clicks, conversions, 1);
  const clickWidth = (clicks / max) * 100;
  const conversionWidth = (conversions / max) * 100;
  const rate =
    clicks > 0 ? Math.min(100, Math.round((conversions / clicks) * 1000) / 10) : 0;

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
            Traffic distribution
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Clicks vs conversions
            {frozen ? " — frozen at zero" : ""}
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
          <Zap className="h-3.5 w-3.5" aria-hidden />
          {rate}% convert
        </div>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2">
        <TrafficBar
          label="Clicks"
          value={clicks}
          widthPct={clickWidth}
          color="#0D5C3A"
        />
        <TrafficBar
          label="Conversions"
          value={conversions}
          widthPct={conversionWidth}
          color="#0f766e"
        />
      </div>

      <svg
        className="mt-5 h-16 w-full"
        viewBox="0 0 400 64"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Clicks ${clicks}, conversions ${conversions}`}
      >
        <rect x="0" y="8" width="400" height="20" rx="10" fill="#ecfdf5" />
        <rect
          x="0"
          y="8"
          width={(clickWidth / 100) * 400}
          height="20"
          rx="10"
          fill="#0D5C3A"
        />
        <rect x="0" y="36" width="400" height="20" rx="10" fill="#f0fdfa" />
        <rect
          x="0"
          y="36"
          width={(conversionWidth / 100) * 400}
          height="20"
          rx="10"
          fill="#0f766e"
        />
      </svg>
    </div>
  );
}

function TrafficBar({
  label,
  value,
  widthPct,
  color,
}: {
  label: string;
  value: number;
  widthPct: number;
  color: string;
}) {
  return (
    <div className="w-full min-w-0">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
          {label}
        </span>
        <span className="text-lg font-black tabular-nums text-slate-950">
          {value}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${widthPct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
