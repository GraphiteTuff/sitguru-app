import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { parseFiltersFromSearch } from "@/lib/growth-center-v2/date-range";
import { loadGrowthCenterSnapshot } from "@/lib/growth-center-v2/snapshot";
import GrowthCenterInsightsBoard from "@/components/growth-center-v2/GrowthCenterInsightsBoard";
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
      <GrowthCenterInsightsBoard
        snapshot={snapshot}
        userId={access.actor.id}
        exportHref={`/api/growth-center/v2/export?${exportQuery.toString()}`}
      />
      <ManagerActivityHeatmap data={team.activityHeatmap} />
    </div>
  );
}
