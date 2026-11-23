import Link from "next/link";
import SocialIntelligenceBoard from "@/components/social-intelligence/SocialIntelligenceBoard";
import { loadSocialIntelligenceSnapshot } from "@/lib/social-intelligence/dashboard";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { parseFiltersFromSearch } from "@/lib/growth-center-v2/date-range";
import { loadGrowthCenterSnapshot } from "@/lib/growth-center-v2/snapshot";
import GrowthCenterInsightsBoard from "@/components/growth-center-v2/GrowthCenterInsightsBoard";
import LiveSocialAutoRefresh from "@/components/portal/LiveSocialAutoRefresh";
import ManagerActivityHeatmap from "@/components/manager/ManagerActivityHeatmap";
import { loadManagerDashboard } from "@/lib/internship/manager-data";

export const dynamic = "force-dynamic";

export default async function ManagerMetricsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const filters = parseFiltersFromSearch({
    ...params,
    view: Array.isArray(params.view) ? params.view[0] : params.view || "overview",
  });
  const socialMode = (Array.isArray(params.view) ? params.view[0] : params.view) === "social-intelligence";
  if (socialMode) {
    const socialSnapshot = await loadSocialIntelligenceSnapshot({ filters });
    return <SocialIntelligenceBoard snapshot={socialSnapshot} />;
  }
  const [snapshot, team] = await Promise.all([
    loadGrowthCenterSnapshot({ audience: "manager", filters }),
    loadManagerDashboard({
      actorUserId: access.actor.id,
      actorKind: access.actor.isSuperUser ? "supervisor" : "manager",
    }),
  ]);
  const exportQuery = new URLSearchParams();
  exportQuery.set("preset", filters.preset);
  exportQuery.set("platform", filters.platform);
  exportQuery.set("audience", filters.audience);

  return (
    <div className="space-y-5">
      <LiveSocialAutoRefresh intervalMs={90_000} />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D1EADD] bg-gradient-to-r from-[#EFF6FF] via-[#F0FDF4] to-white p-4 shadow-[0_8px_24px_rgba(15,39,68,0.05)]">
        <div>
          <p className="font-black text-[#0F2744]">Social Intelligence &amp; Content Performance</p>
          <p className="text-xs font-semibold text-slate-600">Rank your best posts, compare social engagement, and measure tracked SitGuru activity.</p>
        </div>
        <Link href="/manager/metrics?view=social-intelligence" className="inline-flex min-h-11 items-center rounded-xl bg-[#2563EB] px-4 text-sm font-black text-white shadow-sm hover:bg-[#1D4ED8]">Open Social Intelligence</Link>
      </div>
      <GrowthCenterInsightsBoard
        snapshot={snapshot}
        userId={access.actor.id}
        exportHref={`/api/growth-center/v2/export?${exportQuery.toString()}`}
      />
      <ManagerActivityHeatmap data={team.activityHeatmap} />
    </div>
  );
}
