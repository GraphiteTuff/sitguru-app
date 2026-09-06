import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { GrowthMediaScreen } from "@/components/admin/growth/GrowthWorkplacePages";

export const dynamic = "force-dynamic";

export default async function InternGrowthMediaPage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  return <GrowthMediaScreen workplace={access} />;
}
