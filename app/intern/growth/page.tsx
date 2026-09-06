import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { GrowthWorkplaceHome } from "@/components/admin/growth/GrowthWorkplaceHome";

export const dynamic = "force-dynamic";

export default async function InternGrowthHomePage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  return <GrowthWorkplaceHome workplace={access} />;
}
