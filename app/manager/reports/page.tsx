import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { getGrowthHomeStats, listGrowthCampaigns } from "@/lib/admin/growth/data";
import BusinessGrowthReport from "@/components/portal/BusinessGrowthReport";
import { campusReportTotals, loadCampusGrowth } from "@/lib/internship/campus-growth-data";
import ManagerGrowthReportingCenter from "@/components/manager/ManagerGrowthReportingCenter";
import { getGrowthReportPeriod, growthReportFilters } from "@/lib/growth-center-v2/report-periods";
import { loadGrowthCenterSnapshot } from "@/lib/growth-center-v2/snapshot";
import { readStoredGrowthReport } from "@/lib/growth-center-v2/report-sharepoint";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function ManagerBusinessGrowthReportPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const period = getGrowthReportPeriod({ cadence: first(params.period), end: first(params.end) });
  const actor = access.actor.isSuperUser ? "supervisor" : "manager";
  const [snapshot, stored, stats, campaigns, campus] = await Promise.all([
    loadGrowthCenterSnapshot({ audience: "manager", filters: growthReportFilters(period) }),
    readStoredGrowthReport(period),
    getGrowthHomeStats(),
    listGrowthCampaigns(),
    loadCampusGrowth({ actor, actorUserId: access.actor.id }),
  ]);
  return (
    <div className="space-y-5 pb-20">
      <ManagerGrowthReportingCenter
        period={period}
        snapshot={stored.report?.status === "submitted" ? stored.report.snapshot : snapshot}
        saved={stored.report}
        storeState={stored.state}
        canEdit={!access.actor.isSuperUser}
        flash={{ ok: first(params.ok), error: first(params.error) }}
      />
      <details className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <summary className="cursor-pointer text-sm font-black text-[#0F2744]">
          Open original Business Growth Report (legacy dashboard)
        </summary>
        <div className="mt-5">
          <BusinessGrowthReport
            audience="manager"
            stats={stats}
            campaigns={campaigns}
            campus={campusReportTotals(campus.cards, campus.missions)}
          />
        </div>
      </details>
    </div>
  );
}
