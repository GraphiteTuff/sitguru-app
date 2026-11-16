import PromotionEntryPoint from "@/components/manager/PromotionEntryPoint";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { GrowthPromoteScreen } from "@/components/admin/growth/GrowthWorkplacePages";

export const dynamic = "force-dynamic";

export default async function ManagerPromotePage() {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  return (
    <div className="space-y-4">
      <PromotionEntryPoint source="Community Events" description="Create local event promotions with dedicated tracked URLs while preserving each event's organizer and media permissions." />
      <GrowthPromoteScreen workplace={access} kind="event" />
    </div>
  );
}
