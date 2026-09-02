import { requireGrowthPortal } from "@/lib/admin/growth/access";
import { listPromotablePartners } from "@/lib/admin/growth/data";
import PromoteList from "@/components/admin/growth/PromoteList";
import { GrowthPageFrame } from "@/components/admin/growth/GrowthPageFrame";

export const dynamic = "force-dynamic";

export default async function GrowthPartnersPage() {
  const access = await requireGrowthPortal();
  if (!access.ok) return access.ui;

  const items = await listPromotablePartners();

  return (
    <GrowthPageFrame
      title="Partners"
      detail="Approved local businesses only. Marketing copy and tracking links — no payouts."
    >
      <PromoteList
        items={items}
        kind="partner"
        empty="No active partners to spotlight yet."
      />
    </GrowthPageFrame>
  );
}
