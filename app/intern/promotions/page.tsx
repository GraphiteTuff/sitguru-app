import { currentAssignedIntern, requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadPromotionOpportunities } from "@/lib/growth-center-v2/promotion-sources";
import PromotionSourceHub from "@/components/manager/PromotionSourceHub";

export const dynamic = "force-dynamic";

/** Interns can select only published public promotion sources and approved
 * Brand Kit assets; they cannot publish without manager approval. */
export default async function InternPromotionHubPage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const intern = await currentAssignedIntern();
  const items = await loadPromotionOpportunities({
    managerUserId: intern?.managerUserId || "",
    includeStaffAssets: true,
  });
  return <PromotionSourceHub mode="intern" items={items} />;
}