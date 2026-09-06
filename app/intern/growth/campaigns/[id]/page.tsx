import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { GrowthCampaignDetailScreen } from "@/components/admin/growth/GrowthWorkplacePages";

export const dynamic = "force-dynamic";

export default async function InternGrowthCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const { id } = await params;
  return <GrowthCampaignDetailScreen workplace={access} id={id} />;
}
