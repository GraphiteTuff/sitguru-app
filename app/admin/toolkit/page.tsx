import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderOpen, Palette, Users } from "lucide-react";
import DeskPageHero from "@/components/manager/DeskPageHero";
import SharedTeamToolkitAssets from "@/components/portal/SharedTeamToolkitAssets";
import { getAdminIdentity } from "@/lib/admin/access";
import { resolveBrandActor, listBrandAssets } from "@/lib/manager/brand-kit-store";

export const dynamic = "force-dynamic";

export default async function AdminSharedToolkitPage() {
  const admin = await getAdminIdentity();
  if (!admin?.canAccessAdmin) redirect("/admin/login?next=/admin/toolkit");
  const actor = await resolveBrandActor();
  const listed = actor?.capabilities.viewApproved
    ? await listBrandAssets({ actor, status: "approved", pageSize: 6 })
    : { assets: [], total: 0, error: "Approved assets are not available for this account." };

  return (
    <main className="admin-desk-surface mx-auto w-full max-w-7xl space-y-5 px-3 pb-24 sm:px-5 lg:px-6">
      <DeskPageHero icon={<Palette size={22} />} title="Admin Toolkit" subtitle="One approved SitGuru brand and resource library, shared with managers and interns." quote="Support. Develop. Create Opportunities. Bigger Impact." />
      <SharedTeamToolkitAssets role="admin" assets={listed.assets} total={listed.total} error={listed.error} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/admin/toolkit/brand" className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 font-black text-[#0F2744] shadow-sm hover:bg-[#EFF6FF]"><Palette className="shrink-0 text-[#2563EB]" /> Brand Kit <span className="ml-auto text-xs font-medium text-slate-500">Approved assets & review controls</span></Link>
        <Link href="/admin/resources" className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 font-black text-[#0F2744] shadow-sm hover:bg-[#EFF6FF]"><FolderOpen className="shrink-0 text-[#0D5C3A]" /> Team resources <span className="ml-auto text-xs font-medium text-slate-500">Guides, documents and tools</span></Link>
        <Link href="/admin/internship/interns" className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 font-black text-[#0F2744] shadow-sm hover:bg-[#EFF6FF]"><Users className="shrink-0 text-[#7C3AED]" /> Intern Team <span className="ml-auto text-xs font-medium text-slate-500">Programs and assignments</span></Link>
      </div>
    </main>
  );
}
