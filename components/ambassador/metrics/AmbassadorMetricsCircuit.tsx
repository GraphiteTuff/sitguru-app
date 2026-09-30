/**
 * Ambassador metrics circuit shell — charts gated by referralCode.
 * Supports optional demo override for performance-route mock previews.
 */

"use client";

import { Loader2 } from "lucide-react";
import { useConnectedAmbassadorMetrics } from "@/hooks/useConnectedAmbassadorMetrics";
import {
  AMBASSADOR_METRICS_MOCK,
  CircuitBrokenAlert,
  MilestonePipelineChart,
  TrafficDistributionChart,
} from "@/components/ambassador/metrics/AmbassadorMetricsCharts";

type AmbassadorMetricsCircuitProps = {
  userSessionId?: string | null;
  initHref?: string;
  /** Optional server-seeded signup count when ledger is still catching up. */
  seedReferralCount?: number;
  /** Dev / QA: force active charts with realistic mock numbers. */
  isMockActive?: boolean;
  className?: string;
};

export default function AmbassadorMetricsCircuit({
  userSessionId,
  initHref = "/ambassador/dashboard/referrals",
  seedReferralCount,
  isMockActive = false,
  className = "",
}: AmbassadorMetricsCircuitProps) {
  const metrics = useConnectedAmbassadorMetrics(userSessionId);
  const frozen = isMockActive ? false : !metrics.isCircuitConnected;
  const referralCount = isMockActive
    ? AMBASSADOR_METRICS_MOCK.referralCount
    : frozen
      ? 0
      : Math.max(metrics.referralCount, seedReferralCount || 0);
  const clicksCount = isMockActive
    ? AMBASSADOR_METRICS_MOCK.clicksCount
    : frozen
      ? 0
      : metrics.clicksCount;
  const unlockedCommissions = isMockActive
    ? AMBASSADOR_METRICS_MOCK.unlockedCommissions
    : metrics.unlockedCommissions || 0;
  const liveCode = isMockActive
    ? AMBASSADOR_METRICS_MOCK.referralCode
    : metrics.referralCode;

  if (metrics.loading && !isMockActive) {
    return (
      <div
        className={`flex w-full justify-center rounded-2xl border border-emerald-100 bg-white py-10 ${className}`}
      >
        <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
      </div>
    );
  }

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {frozen ? <CircuitBrokenAlert initHref={initHref} /> : null}

      {!frozen && liveCode ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-100 bg-white px-4 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
              {isMockActive ? "Tracking circuit (mock)" : "Tracking circuit live"}
            </p>
            <p className="mt-0.5 font-mono text-sm font-black text-slate-950">
              {liveCode}
            </p>
          </div>
          <p className="text-xs font-semibold text-slate-500">
            Unlocked{" "}
            <span className="font-black text-emerald-800">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(unlockedCommissions)}
            </span>
          </p>
        </div>
      ) : null}

      <div className="grid w-full gap-4 lg:grid-cols-2">
        <section className="w-full rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <MilestonePipelineChart
            referralCount={referralCount}
            frozen={frozen}
            milestones={metrics.milestones.map((m) => ({
              signups: m.signups,
              reward: m.reward,
            }))}
          />
        </section>
        <section className="w-full rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <TrafficDistributionChart
            clicksCount={clicksCount}
            referralCount={referralCount}
            frozen={frozen}
          />
        </section>
      </div>
    </div>
  );
}
