import GrowthPlaybookPanel from "@/components/admin/growth/GrowthPlaybookPanel";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { GrowthPromoteScreen } from "@/components/admin/growth/GrowthWorkplacePages";

export const dynamic = "force-dynamic";

export default async function InternGrowthPartnersPage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  return <div className="space-y-5"><GrowthPlaybookPanel mode="intern" /><GrowthPromoteScreen workplace={access} kind="partner" /></div>;
}
