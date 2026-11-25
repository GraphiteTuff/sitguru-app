import PartnerProposalWorkspace from "@/components/admin/growth/PartnerProposalWorkspace";
import GrowthPlaybookPanel from "@/components/admin/growth/GrowthPlaybookPanel";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { GrowthPromoteScreen } from "@/components/admin/growth/GrowthWorkplacePages";

export const dynamic = "force-dynamic";

export default async function InternGrowthPartnersPage({ searchParams }: { searchParams?: Promise<{ partnerOk?: string; partnerError?: string }> }) {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  return <div className="space-y-5"><PartnerProposalWorkspace mode="intern" searchParams={searchParams} /><GrowthPlaybookPanel mode="intern" /><GrowthPromoteScreen workplace={access} kind="partner" /></div>;
}
