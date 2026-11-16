import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadPromotionOpportunities } from "@/lib/growth-center-v2/promotion-sources";
import PromotionSourceHub from "@/components/manager/PromotionSourceHub";

export const dynamic = "force-dynamic";

/** Admin oversight sees the same promotion sources. Actual creative publishing
 * and advertising remain gated by manager review and provider authorization. */
export default async function AdminPromotionHubPage() {
  const access = await requireGrowthWorkplace("admin");
  if (!access.ok) return access.ui;
  const items = await loadPromotionOpportunities({
    managerUserId: access.actor.id,
    includeStaffAssets: true,
  });
  return <PromotionSourceHub items={items} />;
}