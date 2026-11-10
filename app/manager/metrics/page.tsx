import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { getGrowthHomeStats, listGrowthContent } from "@/lib/admin/growth/data";
import MetricsBoard from "@/components/portal/MetricsBoard";
import ManagerActivityHeatmap from "@/components/manager/ManagerActivityHeatmap";
import { loadManagerDashboard } from "@/lib/internship/manager-data";

export const dynamic = "force-dynamic";

export default async function ManagerMetricsPage() {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const [stats, content, team] = await Promise.all([
    getGrowthHomeStats(),
    listGrowthContent(),
    loadManagerDashboard({ actorUserId: access.actor.id, actorKind: access.actor.isSuperUser ? "supervisor" : "manager" }),
  ]);
  return (
    <div className="space-y-5">
      <MetricsBoard
        audience="manager"
        stats={stats}
        content={content.slice(0, 4).map((item) => ({
          title: item.title,
          detail: [item.platform, item.status].filter(Boolean).join(" · "),
        }))}
      />
      <ManagerActivityHeatmap data={team.activityHeatmap} />
    </div>
  );
}
