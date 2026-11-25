import GrowthPlaybookPanel from "@/components/admin/growth/GrowthPlaybookPanel";
import Link from "next/link";
import CommunityStudioBoard from "@/components/community-studio/CommunityStudioBoard";
import CommunityWorkLinks from "@/components/community-studio/CommunityWorkLinks";
import PartnerSpotlightEditor from "@/components/partners/PartnerSpotlightEditor";
import { getHomepagePartnerSpotlight } from "@/lib/partners/homepage-spotlight";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadCommunityWorkspace } from "@/lib/community-studio/actions";

export const dynamic = "force-dynamic";

export default async function ManagerCommunityStudioPage() {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const workspace = await loadCommunityWorkspace("manager");
  const spotlight = await getHomepagePartnerSpotlight(true);
  return <div className="space-y-5">
    <GrowthPlaybookPanel mode="manager" />
    <Link href="/manager/community-studio/guru-match"
      className="flex min-h-20 flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D1EADD] bg-gradient-to-r from-[#EFF6FF] via-[#F0FDF4] to-white p-5 shadow-sm hover:border-[#0D5C3A]">
      <span><span className="block text-lg font-black text-[#0F2744]">🐾 Guru Match &amp; Share</span>
      <span className="mt-1 block text-sm font-semibold text-slate-600">Match local Gurus by city, state and service. Generate QR cards and track clicks.</span></span>
      <span className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-black text-white">Open tool →</span>
    </Link>
    <Link href="/manager/community-studio/event-match"
      className="flex min-h-20 flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D1EADD] bg-gradient-to-r from-[#F0FDF4] via-[#EFF6FF] to-white p-5 shadow-sm hover:border-[#0D5C3A]">
      <span><span className="block text-lg font-black text-[#0F2744]">📅 Event Match &amp; Share</span>
      <span className="mt-1 block text-sm font-semibold text-slate-600">Promote current local pet events with tracked social links, graphics and QR codes. Expired events are removed automatically.</span></span>
      <span className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-black text-white">Open tool →</span>
    </Link>
    {(access.actor.isSuperUser || access.actor.email.toLowerCase() === "ava@sitguru.com") && <PartnerSpotlightEditor spotlight={spotlight} />}
    <CommunityStudioBoard workspace={workspace} />
    <CommunityWorkLinks mode="manager" />
  </div>;
}
