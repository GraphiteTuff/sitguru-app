import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { GrowthCampaignsScreen } from "@/components/admin/growth/GrowthWorkplacePages";

export const dynamic = "force-dynamic";

export default async function ManagerPage() {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  return <GrowthCampaignsScreen workplace={access} />;
}
