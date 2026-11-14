import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, FileText, FolderOpen, GraduationCap, Megaphone } from "lucide-react";
import DeskPageHero from "@/components/manager/DeskPageHero";
import SharedTeamToolkitAssets from "@/components/portal/SharedTeamToolkitAssets";
import { getAdminIdentity } from "@/lib/admin/access";
import { listBrandAssets, resolveBrandActor } from "@/lib/manager/brand-kit-store";

export const dynamic = "force-dynamic";

export default async function AdminTeamResourcesPage() {
  const admin = await getAdminIdentity();
  if (!admin?.canAccessAdmin) redirect("/admin/login?next=/admin/resources");
  const actor = await resolveBrandActor();
  const listed = actor?.capabilities.viewApproved
    ? await listBrandAssets({ actor, status: "approved", pageSize: 6 })
    : { assets: [], total: 0, error: "Approved assets are not available for this account." };
  const groups = [
    { title: "Brand guidelines & approved media", desc: "Use shared, approved creative files rather than separate copies.", href: "/admin/toolkit/brand?category=guidelines", icon: BookOpen },
    { title: "Campaign templates", desc: "Approved marketing flyers, post layouts and visuals.", href: "/admin/toolkit/brand?category=templates", icon: Megaphone },
    { title: "Internship program syllabus", desc: "University-neutral curriculum, academic expectations and project milestones.", href: "/admin/internship/playbook", icon: GraduationCap },
    { title: "People & HR resources", desc: "Staff and university administration stays in secured Admin HQ.", href: "/admin/hr", icon: FileText },
  ];
  return (
    <main className="admin-desk-surface mx-auto w-full max-w-7xl space-y-5 px-3 pb-24 sm:px-5 lg:px-6">
      <DeskPageHero icon={<FolderOpen size={22} />} title="Admin Resources" subtitle="Approved team files plus role-specific administration and training links." quote="Support. Develop. Create Opportunities. Bigger Impact." />
      <SharedTeamToolkitAssets role="admin" assets={listed.assets} total={listed.total} error={listed.error} />
      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map((group) => (
          <Link key={group.title} href={group.href} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-[#BFDBFE] hover:bg-[#EFF6FF]">
            <group.icon size={20} aria-hidden="true" className="text-[#2563EB]" />
            <p className="mt-3 font-black text-[#0F2744]">{group.title}</p>
            <p className="mt-1 text-sm font-medium text-slate-600">{group.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
