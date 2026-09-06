import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { GrowthCampaignsScreen } from "@/components/admin/growth/GrowthWorkplacePages";

export const dynamic = "force-dynamic";

export default async function InternGrowthCampaignsPage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  return <GrowthCampaignsScreen workplace={access} />;
}
