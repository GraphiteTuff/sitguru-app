import { requireGrowthPortal } from "@/lib/admin/growth/access";
import { listPromotableGurus } from "@/lib/admin/growth/data";
import PromoteList from "@/components/admin/growth/PromoteList";
import { GrowthPageFrame } from "@/components/admin/growth/GrowthPageFrame";

export const dynamic = "force-dynamic";

export default async function GrowthGurusPage() {
  const access = await requireGrowthPortal();
  if (!access.ok) return access.ui;

  const items = await listPromotableGurus();

  return (
    <GrowthPageFrame
      title="Gurus"
      detail="Public profiles only. No private messages, background checks, or payout details."
    >
      <PromoteList
        items={items}
        kind="guru"
        empty="No public Gurus are ready to promote yet."
      />
    </GrowthPageFrame>
  );
}
