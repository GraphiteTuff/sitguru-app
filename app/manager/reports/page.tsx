import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { getGrowthHomeStats, listGrowthCampaigns } from "@/lib/admin/growth/data";
import BusinessGrowthReport from "@/components/portal/BusinessGrowthReport";
import { campusReportTotals, loadCampusGrowth } from "@/lib/internship/campus-growth-data";

export const dynamic = "force-dynamic";

export default async function ManagerBusinessGrowthReportPage() {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const actor = access.actor.isSuperUser ? "supervisor" : "manager";
  const [stats, campaigns, campus] = await Promise.all([
    getGrowthHomeStats(),
    listGrowthCampaigns(),
    loadCampusGrowth({ actor, actorUserId: access.actor.id }),
  ]);
  return <BusinessGrowthReport audience="manager" stats={stats} campaigns={campaigns} campus={campusReportTotals(campus.cards, campus.missions)} />;
}
