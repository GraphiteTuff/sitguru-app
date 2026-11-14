import Link from "next/link";
import { redirect } from "next/navigation";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import ManagerGrowthReportingCenter from "@/components/manager/ManagerGrowthReportingCenter";
import { getGrowthReportPeriod, growthReportFilters } from "@/lib/growth-center-v2/report-periods";
import { loadGrowthCenterSnapshot } from "@/lib/growth-center-v2/snapshot";
import { readStoredGrowthReport } from "@/lib/growth-center-v2/report-sharepoint";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function AdminGrowthReportsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("admin");
  if (!access.ok) return access.ui;
  if (!access.actor.isSuperUser) redirect("/manager/reports");
  const params = searchParams ? await searchParams : {};
  const period = getGrowthReportPeriod({ cadence: first(params.period), end: first(params.end) });
  const [snapshot, stored] = await Promise.all([
    loadGrowthCenterSnapshot({ audience: "admin", filters: growthReportFilters(period) }),
    readStoredGrowthReport(period),
  ]);
  return (
    <main className="space-y-4 pb-20">
      <div className="rounded-2xl bg-[#0F2744] p-4 text-sm font-semibold text-white">
        CEO read-only reporting · Ava's submitted reports are preserved in Microsoft 365.
        <Link href="/admin" className="ml-3 font-black underline">Back to Admin HQ</Link>
      </div>
      <ManagerGrowthReportingCenter
        period={period}
        snapshot={snapshot}
        saved={stored.report}
        storeState={stored.state}
        canEdit={false}
        flash={{}}
      />
    </main>
  );
}
