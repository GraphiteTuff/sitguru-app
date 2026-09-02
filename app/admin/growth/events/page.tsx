import { requireGrowthPortal } from "@/lib/admin/growth/access";
import { listPromotableEvents } from "@/lib/admin/growth/data";
import PromoteList from "@/components/admin/growth/PromoteList";
import { GrowthPageFrame } from "@/components/admin/growth/GrowthPageFrame";

export const dynamic = "force-dynamic";

export default async function GrowthEventsPage() {
  const access = await requireGrowthPortal();
  if (!access.ok) return access.ui;

  const items = await listPromotableEvents();

  return (
    <GrowthPageFrame
      title="Events"
      detail="Promote local pet events. Send people to the event page with a tracking link."
    >
      <PromoteList
        items={items}
        kind="event"
        empty="No published events yet. Add one in Community Events, then come back here."
      />
    </GrowthPageFrame>
  );
}
