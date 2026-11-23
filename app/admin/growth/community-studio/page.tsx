import Link from "next/link";
import CommunityShareDesk from "@/components/community-studio/CommunityShareDesk";
import CommunityStudioBoard from "@/components/community-studio/CommunityStudioBoard";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadCommunityWorkspace, loadPublishedCommunity } from "@/lib/community-studio/actions";

export const dynamic = "force-dynamic";

export default async function AdminCommunityStudioPage() {
  const access = await requireGrowthWorkplace("admin");
  if (!access.ok) return access.ui;
  const [workspace, publishedStories] = await Promise.all([loadCommunityWorkspace("manager"), loadPublishedCommunity()]);
  return <main className="mx-auto max-w-7xl space-y-5 px-3 py-5 sm:px-5">
    <nav className="flex flex-wrap gap-2 text-sm font-bold">
      <Link href="/admin/growth" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[#0F2744]">← Admin Growth</Link>
      <Link href="/admin/growth/content" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[#0F2744]">Content overview</Link>
      <Link href="/admin/growth/guru-match" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[#0F2744]">Guru Match &amp; Share</Link>
      <Link href="/admin/growth/event-match" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[#0F2744]">Event Match &amp; Share</Link>
    </nav>
    <CommunityShareDesk items={publishedStories} role="admin" />
    <CommunityStudioBoard workspace={workspace} />
  </main>;
}
