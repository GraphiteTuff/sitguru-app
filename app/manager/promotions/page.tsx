import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadPromotionOpportunities } from "@/lib/growth-center-v2/promotion-sources";
import PromotionSourceHub from "@/components/manager/PromotionSourceHub";

export const dynamic = "force-dynamic";

export default async function ManagerPromotionHubPage() {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const items = await loadPromotionOpportunities({
    managerUserId: access.actor.id,
    includeStaffAssets: true,
  });
  return <PromotionSourceHub items={items} />;
}