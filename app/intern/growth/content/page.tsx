import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { GrowthContentScreen } from "@/components/admin/growth/GrowthWorkplacePages";

export const dynamic = "force-dynamic";

export default async function InternGrowthContentPage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  return <GrowthContentScreen workplace={access} />;
}
