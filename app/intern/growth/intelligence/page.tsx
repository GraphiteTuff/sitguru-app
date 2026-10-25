import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { GrowthIntelligenceScreen } from "@/components/admin/growth/GrowthWorkplacePages";

export const dynamic = "force-dynamic";

export default async function InternGrowthIntelligencePage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  return <GrowthIntelligenceScreen workplace={access} />;
}
