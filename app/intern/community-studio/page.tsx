import Link from "next/link";
import CommunityStudioBoard from "@/components/community-studio/CommunityStudioBoard";
import CommunityShareDesk from "@/components/community-studio/CommunityShareDesk";
import CommunityWorkLinks from "@/components/community-studio/CommunityWorkLinks";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadCommunityWorkspace, loadPublishedCommunity } from "@/lib/community-studio/actions";

export const dynamic = "force-dynamic";

export default async function InternCommunityStudioPage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const [workspace, publishedStories] = await Promise.all([loadCommunityWorkspace("intern"), loadPublishedCommunity()]);
  return <div className="space-y-5">
    <Link href="/intern/community-studio/guru-match"
      className="flex min-h-20 flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D1EADD] bg-gradient-to-r from-[#EFF6FF] via-[#F0FDF4] to-white p-5 shadow-sm hover:border-[#0D5C3A]">
      <span><span className="block text-lg font-black text-[#0F2744]">🐾 Guru Match &amp; Share</span>
      <span className="mt-1 block text-sm font-semibold text-slate-600">Match local Gurus by city, state and service. Generate QR cards and track clicks.</span></span>
      <span className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-black text-white">Open tool →</span>
    </Link>
    <Link href="/intern/community-studio/event-match"
      className="flex min-h-20 flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D1EADD] bg-gradient-to-r from-[#F0FDF4] via-[#EFF6FF] to-white p-5 shadow-sm hover:border-[#0D5C3A]">
      <span><span className="block text-lg font-black text-[#0F2744]">📅 Event Match &amp; Share</span>
      <span className="mt-1 block text-sm font-semibold text-slate-600">Promote current local pet events with tracked social links, graphics and QR codes. Expired events are removed automatically.</span></span>
      <span className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-black text-white">Open tool →</span>
    </Link>
    <CommunityShareDesk items={publishedStories} role="intern" />
    <CommunityStudioBoard workspace={workspace} mode="intern" />
    <CommunityWorkLinks mode="intern" />
  </div>;
}
