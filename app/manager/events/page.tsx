import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { GrowthPromoteScreen } from "@/components/admin/growth/GrowthWorkplacePages";

export const dynamic = "force-dynamic";

export default async function ManagerPromotePage() {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  return <GrowthPromoteScreen workplace={access} kind="event" />;
}
