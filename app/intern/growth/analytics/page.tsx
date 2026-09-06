import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { GrowthAnalyticsScreen } from "@/components/admin/growth/GrowthWorkplacePages";

export const dynamic = "force-dynamic";

export default async function InternGrowthAnalyticsPage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  return <GrowthAnalyticsScreen workplace={access} />;
}
