/**
 * Ambassador metrics chart primitives — pure SVG / Tailwind, fluid widths.
 * Handles Locked (circuit broken) and Active tracking states.
 */

"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Lock,
  Zap,
} from "lucide-react";

const BRAND = "#0D5C3A";
const BRAND_DEEP = "#09462C";

export function CircuitBrokenAlert({
  initHref = "/ambassador/dashboard/referrals",
}: {
  initHref?: string;
}) {
  return (
    <div
      role="alert"
      className="w-full rounded-2xl border border-amber-200/60 bg-amber-50/50 px-4 py-3 shadow-sm backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-3 text-center sm:gap-3.5">
        <div className="flex w-full max-w-xl flex-col items-center gap-2.5 sm:flex-row sm:items-start sm:text-left">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-amber-200/70 bg-amber-100/70 text-amber-900 shadow-sm backdrop-blur-sm">
            <AlertTriangle className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-800">
              Circuit broken
            </p>
            <p className="mt-0.5 text-sm font-black text-amber-950">
              Referral code unconfigured
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-amber-900/85 sm:text-sm sm:leading-6">
              Metrics charts stay locked at zero until your tracking string is
              initialized. Connect your ambassador referral code to restore the
              live circuit.
            </p>
          </div>
        </div>

        <Link
          href={initHref}
          className="inline-flex min-h-11 w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-[#0D5C3A] px-5 text-xs font-black text-white shadow-md shadow-emerald-900/15 transition duration-200 hover:-translate-y-0.5 hover:bg-[#09462C] hover:shadow-lg hover:shadow-emerald-900/20 active:translate-y-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 sm:w-auto"
        >
          Initialize tracking
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

const DEFAULT_MILESTONES = [
  { signups: 25, reward: 25 },
  { signups: 50, reward: 100 },
  { signups: 150, reward: 200 },
] as const;

/** Horizontal milestone pipeline: 0 → 25 → 50 → 150 signups. */
export function MilestonePipelineChart({
  referralCount,
  frozen = false,
  milestones = DEFAULT_MILESTONES,
}: {
  referralCount: number;
  frozen?: boolean;
  milestones?: ReadonlyArray<{ signups: number; reward: number }>;
}) {
  const nodes = [
    { signups: 0, reward: 0, label: "Start" },
    ...milestones.map((m) => ({
      signups: m.signups,
      reward: m.reward,
      label: `$${m.reward}`,
    })),
  ];
  const max = nodes[nodes.length - 1]?.signups || 150;
  const liveCount = frozen ? 0 : Math.max(0, referralCount);
  const progressPct = Math.min(100, (liveCount / max) * 100);
  const unlockedReward = frozen
    ? 0
    : [...milestones].reverse().find((m) => liveCount >= m.signups)?.reward ||
      0;

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
            Milestone pipeline
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {frozen
              ? "Track locked — reconnect referralCode"
              : unlockedReward > 0
                ? `${liveCount} signups · $${unlockedReward} milestone unlocked`
                : `${liveCount} verified signups toward ${max}`}
          </p>
        </div>
        <p
          className={`text-2xl font-black tabular-nums transition-colors duration-300 ${
            frozen ? "text-slate-400" : "text-slate-950"
          }`}
        >
          {Math.round(progressPct)}%
        </p>
      </div>

      <div
        className={`relative w-full overflow-hidden rounded-2xl border px-3 py-5 sm:px-4 ${
          frozen
            ? "border-slate-200/80 bg-slate-50/80"
            : "border-emerald-100 bg-gradient-to-b from-emerald-50/40 to-white"
        }`}
      >
        {/* Track rail */}
        <div className="pointer-events-none absolute inset-x-8 top-[2.35rem] h-2.5 rounded-full bg-slate-200/90 sm:inset-x-10" />
        <div
          className="pointer-events-none absolute left-8 top-[2.35rem] h-2.5 rounded-full transition-[width] duration-700 ease-out sm:left-10"
          style={{
            width: frozen
              ? "0%"
              : `calc((100% - 4rem) * ${progressPct / 100})`,
            backgroundColor: frozen ? "#cbd5e1" : BRAND,
            boxShadow: frozen ? undefined : `0 0 12px ${BRAND}33`,
          }}
        />

        <ol className="relative z-[1] grid w-full grid-cols-4 gap-1">
          {nodes.map((node, index) => {
            const reached = !frozen && liveCount >= node.signups;
            const isStart = index === 0;

            return (
              <li
                key={node.signups}
                className={`flex flex-col ${
                  index === 0
                    ? "items-start"
                    : index === nodes.length - 1
                      ? "items-end"
                      : "items-center"
                }`}
              >
                <span className="relative inline-flex">
                  <span
                    className={[
                      "grid h-10 w-10 place-items-center rounded-full border-2 text-[11px] font-black transition-all duration-500 ease-out sm:h-11 sm:w-11",
                      frozen
                        ? "border-slate-300 bg-slate-200/90 text-slate-500 shadow-inner"
                        : reached
                          ? "border-[#0D5C3A] bg-[#0D5C3A] text-white shadow-md shadow-emerald-900/20 scale-105"
                          : "border-slate-200 bg-white text-slate-500",
                    ].join(" ")}
                    title={
                      node.reward
                        ? `$${node.reward} at ${node.signups}`
                        : "Pipeline start"
                    }
                  >
                    {frozen ? (
                      <Lock className="h-3.5 w-3.5 text-slate-500" aria-hidden />
                    ) : reached && !isStart ? (
                      <Check
                        className="h-4 w-4 origin-center transition-transform duration-300 ease-out"
                        style={{ animation: "sgCheckPop 420ms ease-out" }}
                        aria-hidden
                      />
                    ) : (
                      node.signups
                    )}
                  </span>
                  {frozen ? (
                    <span
                      className="pointer-events-none absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm"
                      aria-hidden
                    >
                      <Lock className="h-2.5 w-2.5" />
                    </span>
                  ) : null}
                </span>
                <span
                  className={`mt-2.5 text-[10px] font-bold ${
                    frozen
                      ? "text-slate-400"
                      : reached
                        ? "text-emerald-800"
                        : "text-slate-500"
                  }`}
                >
                  {node.label}
                </span>
                {!isStart ? (
                  <span
                    className={`mt-0.5 text-[9px] font-semibold tabular-nums ${
                      frozen ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    {node.signups}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>

      <style>{`
        @keyframes sgCheckPop {
          0% { transform: scale(0.55); opacity: 0.35; }
          55% { transform: scale(1.18); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/** Clicks vs conversions distribution — fluid dual-bar canvas. */
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
    clicks > 0
      ? Math.min(100, Math.round((conversions / clicks) * 1000) / 10)
      : 0;

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
            Traffic distribution
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Clicks vs conversions
            {frozen ? " — locked at zero" : ""}
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
            frozen
              ? "bg-slate-100 text-slate-500"
              : "bg-emerald-50 text-emerald-800"
          }`}
        >
          <Zap className="h-3.5 w-3.5" aria-hidden />
          {rate}% convert
        </div>
      </div>

      {/* Desktop: horizontal pair · Mobile: stacked */}
      <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5">
        <TrafficBarCard
          label="Clicks"
          value={clicks}
          widthPct={clickWidth}
          color={frozen ? "#94a3b8" : BRAND}
          trackColor={frozen ? "#e2e8f0" : "#ecfdf5"}
          frozen={frozen}
        />
        <TrafficBarCard
          label="Conversions"
          value={conversions}
          widthPct={conversionWidth}
          color={frozen ? "#94a3b8" : "#0f766e"}
          trackColor={frozen ? "#e2e8f0" : "#f0fdfa"}
          frozen={frozen}
        />
      </div>

      <div
        className={`mt-5 w-full overflow-hidden rounded-2xl border p-3 sm:p-4 ${
          frozen
            ? "border-slate-200 bg-slate-50/70"
            : "border-emerald-100 bg-white"
        }`}
      >
        <svg
          className="h-20 w-full"
          viewBox="0 0 400 80"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Clicks ${clicks}, conversions ${conversions}`}
        >
          <defs>
            <linearGradient id="sgClickFill" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={frozen ? "#94a3b8" : BRAND} />
              <stop
                offset="100%"
                stopColor={frozen ? "#cbd5e1" : BRAND_DEEP}
              />
            </linearGradient>
            <linearGradient id="sgConvFill" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={frozen ? "#94a3b8" : "#0f766e"} />
              <stop
                offset="100%"
                stopColor={frozen ? "#cbd5e1" : "#115e59"}
              />
            </linearGradient>
          </defs>

          <rect
            x="0"
            y="10"
            width="400"
            height="24"
            rx="12"
            fill={frozen ? "#e2e8f0" : "#ecfdf5"}
          />
          <rect
            x="0"
            y="10"
            width={Math.max(frozen ? 0 : (clickWidth / 100) * 400, clicks > 0 ? 18 : 0)}
            height="24"
            rx="12"
            fill="url(#sgClickFill)"
            style={{ transition: "width 700ms ease-out" }}
          >
            <title>Clicks</title>
          </rect>

          <rect
            x="0"
            y="46"
            width="400"
            height="24"
            rx="12"
            fill={frozen ? "#e2e8f0" : "#f0fdfa"}
          />
          <rect
            x="0"
            y="46"
            width={Math.max(
              frozen ? 0 : (conversionWidth / 100) * 400,
              conversions > 0 ? 18 : 0,
            )}
            height="24"
            rx="12"
            fill="url(#sgConvFill)"
            style={{ transition: "width 700ms ease-out" }}
          >
            <title>Conversions</title>
          </rect>
        </svg>
        <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
          <span>Clicks rail</span>
          <span>Conversions rail</span>
        </div>
      </div>
    </div>
  );
}

function TrafficBarCard({
  label,
  value,
  widthPct,
  color,
  trackColor,
  frozen,
}: {
  label: string;
  value: number;
  widthPct: number;
  color: string;
  trackColor: string;
  frozen: boolean;
}) {
  return (
    <div
      className={`w-full min-w-0 flex-1 rounded-2xl border p-3.5 transition-colors duration-300 sm:p-4 ${
        frozen
          ? "border-slate-200/80 bg-slate-50/60"
          : "border-emerald-100/80 bg-white"
      }`}
    >
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
          {label}
        </span>
        <span
          className={`text-xl font-black tabular-nums transition-colors duration-300 ${
            frozen ? "text-slate-400" : "text-slate-950"
          }`}
        >
          {value.toLocaleString()}
        </span>
      </div>
      <div
        className="h-4 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: trackColor }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${frozen ? 0 : widthPct}%`,
            backgroundColor: color,
            boxShadow: frozen || widthPct === 0 ? undefined : `0 0 10px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}

/** Realistic demo payload for Dev Mock Toggle previews. */
export const AMBASSADOR_METRICS_MOCK = {
  referralCode: "SG-DEMO-TRACK",
  clicksCount: 342,
  referralCount: 28,
  unlockedCommissions: 25,
} as const;
