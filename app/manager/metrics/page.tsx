import Link from "next/link";
import { BarChart3, Handshake, Megaphone, PawPrint, TrendingUp } from "lucide-react";
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
    return <>
      <nav aria-label="Manager metrics views" className="mb-4 flex flex-wrap gap-2">
        <Link href="/manager/metrics" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#0F2744]"> <BarChart3 size={17}/> Growth Metrics</Link>
        <span aria-current="page" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0D5C3A] px-4 py-2 text-sm font-black text-white"><TrendingUp size={17}/> Social Intelligence</span>
        <Link href="/manager/community-studio/guru-match" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#D1EADD] bg-[#F0FDF4] px-4 py-2 text-sm font-black text-[#0D5C3A]"><PawPrint size={17}/> Guru Match Tracking</Link>
        <Link href="/manager/community-studio/event-match" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#D1EADD] bg-[#F0FDF4] px-4 py-2 text-sm font-black text-[#0D5C3A]"><PawPrint size={17}/> Event Match &amp; Share</Link>
        <Link href="/manager/campaigns-content" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] px-4 py-2 text-sm font-bold text-[#0F2744]"><Megaphone size={17}/> Content Studio</Link>
        <Link href="/manager/referrals" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-950"><Handshake size={17}/> Referral & Partner Results</Link>
      </nav>
      <LiveSocialAutoRefresh intervalMs={90_000}/>
      <SocialIntelligenceBoard snapshot={socialSnapshot} />
    </>;
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
      <section aria-label="Social and growth reporting" className="rounded-2xl border border-[#D1EADD] bg-gradient-to-r from-[#EFF6FF] via-[#F0FDF4] to-white p-4 shadow-[0_8px_24px_rgba(15,39,68,0.05)] sm:p-5">
        <p className="text-xs font-black uppercase tracking-wider text-[#0D5C3A]">SitGuru · Live Social & Community Growth</p>
        <h1 className="mt-1 text-xl font-black text-[#0F2744] sm:text-2xl">Metrics & Social Intelligence</h1>
        <p className="mt-1 text-sm font-semibold text-slate-600">Find official Facebook and Instagram posts, available insights, tracked clicks and signups, Guru promotions, and Content Studio updates. Reports show unavailable sources rather than invented numbers.</p>
        <nav aria-label="Open social growth workspaces" className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-6">
          <span aria-current="page" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#0F2744] px-4 py-3 text-sm font-black text-white"><BarChart3 size={18}/> Growth Metrics</span>
          <Link href="/manager/metrics?view=social-intelligence" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-[#1D4ED8]"><TrendingUp size={18}/> Open Social Intelligence</Link>
          <Link href="/manager/community-studio/guru-match" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#D1EADD] bg-white px-4 py-3 text-sm font-black text-[#0D5C3A] hover:bg-[#F0FDF4]"><PawPrint size={18}/> Guru Match Tracking</Link>
          <Link href="/manager/community-studio/event-match" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#D1EADD] bg-white px-4 py-3 text-sm font-black text-[#0D5C3A] hover:bg-[#F0FDF4]"><PawPrint size={18}/> Event Match &amp; Share</Link>
          <Link href="/manager/campaigns-content" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#DBEAFE] bg-white px-4 py-3 text-sm font-black text-[#0F2744] hover:bg-[#EFF6FF]"><Megaphone size={18}/> Content Studio</Link>
          <Link href="/manager/referrals" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-950 hover:bg-emerald-100"><Handshake size={18}/> Referrals & Partners</Link>
        </nav>
      </section>
      <GrowthCenterInsightsBoard
        snapshot={snapshot}
        userId={access.actor.id}
        exportHref={`/api/growth-center/v2/export?${exportQuery.toString()}`}
      />
      <ManagerActivityHeatmap data={team.activityHeatmap} />
    </div>
  );
}
