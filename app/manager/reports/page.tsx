import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { getGrowthHomeStats, listGrowthCampaigns } from "@/lib/admin/growth/data";
import BusinessGrowthReport from "@/components/portal/BusinessGrowthReport";

export const dynamic = "force-dynamic";

export default async function ManagerBusinessGrowthReportPage() {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const [stats, campaigns] = await Promise.all([getGrowthHomeStats(), listGrowthCampaigns()]);
  return <BusinessGrowthReport audience="manager" stats={stats} campaigns={campaigns} />;
}
