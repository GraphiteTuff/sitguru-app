/**
 * Server-friendly metrics charts panel — gated by referralCode prop (no fetch).
 * Supports optional demo override for previewing active chart animations.
 */

"use client";

import {
  AMBASSADOR_METRICS_MOCK,
  CircuitBrokenAlert,
  MilestonePipelineChart,
  TrafficDistributionChart,
} from "@/components/ambassador/metrics/AmbassadorMetricsCharts";

type AmbassadorMetricsChartsPanelProps = {
  referralCode: string | null | undefined;
  clicksCount?: number;
  referralCount?: number;
  initHref?: string;
  /** Dev / QA: force active charts with realistic mock numbers. */
  isMockActive?: boolean;
  className?: string;
};

export default function AmbassadorMetricsChartsPanel({
  referralCode,
  clicksCount = 0,
  referralCount = 0,
  initHref = "/ambassador/dashboard/referrals",
  isMockActive = false,
  className = "",
}: AmbassadorMetricsChartsPanelProps) {
  const code = typeof referralCode === "string" ? referralCode.trim() : "";
  const frozen = isMockActive ? false : !code;
  const liveClicks = isMockActive
    ? AMBASSADOR_METRICS_MOCK.clicksCount
    : frozen
      ? 0
      : clicksCount;
  const liveReferrals = isMockActive
    ? AMBASSADOR_METRICS_MOCK.referralCount
    : frozen
      ? 0
      : referralCount;

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {frozen ? <CircuitBrokenAlert initHref={initHref} /> : null}

      <div className="grid w-full gap-4 lg:grid-cols-2">
        <section className="w-full rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <MilestonePipelineChart
            referralCount={liveReferrals}
            frozen={frozen}
          />
        </section>
        <section className="w-full rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <TrafficDistributionChart
            clicksCount={liveClicks}
            referralCount={liveReferrals}
            frozen={frozen}
          />
        </section>
      </div>
    </div>
  );
}
