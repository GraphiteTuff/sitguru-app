import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import Link from "next/link";
import { GrowthWorkplaceHome } from "@/components/admin/growth/GrowthWorkplaceHome";

export const dynamic = "force-dynamic";

export default async function AdminGrowthHomePage() {
  const access = await requireGrowthWorkplace("admin");
  if (!access.ok) return access.ui;
  return <div className="space-y-5">
    {access.actor.isSuperUser?<section className="rounded-2xl border border-emerald-100 bg-white p-5">
      <h2 className="text-lg font-black text-[#0F2744]">Community Studio promotion tools</h2>
      <p className="mt-1 text-sm font-semibold text-slate-600">Create and review tracked outreach for Gurus and local pet events; monitor staff sharing results across SitGuru.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Link href="/admin/growth/community-studio" className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-900">Community Studio &amp; Share Desk →</Link>
        <Link href="/admin/growth/guru-match" className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-blue-900">Guru Match &amp; Share →</Link>
        <Link href="/admin/growth/event-match" className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-900">Event Match &amp; Share →</Link>
      </div>
    </section>:null}
    <GrowthWorkplaceHome workplace={access} />
  </div>;
}
