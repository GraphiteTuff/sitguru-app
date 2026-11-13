import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadInternSectionWorkspace } from "@/lib/internship/intern-section-data";
import { InternAssignmentsPageView } from "@/components/internship/InternSectionPages";
import { listAssignmentIntegrations } from "@/lib/microsoft/assignment-integrations";

export const dynamic = "force-dynamic";

export default async function InternAssignmentsPage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const data = await loadInternSectionWorkspace();
  if (!data) {
    // Admin HQ does not impersonate an intern's Supabase login.
    // Redirect to an explicit, authorized intern picker instead of the
    // misleading "Assignments unavailable" screen.
    const admin = await getAdminIdentity();
    if (admin?.canAccessAdmin) redirect("/admin/internship/portal");
    return (
      <div className="mx-auto max-w-lg rounded-[1.75rem] border border-rose-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">No intern account connected</h1>
        <p className="mt-3 text-sm font-semibold text-slate-600">Sign in with the SitGuru account assigned to your internship to view your work.</p>
      </div>
    );
  }
  const integrations = await listAssignmentIntegrations((data.workspace.tasks || []).map((task) => task.id));
  const links: Record<string, { planner?: string; files?: string; teams?: string; canva?: string }> = {};
  for (const item of integrations) {
    const current = links[item.assignmentId] || {};
    if (item.provider === "planner" && item.externalUrl) current.planner = item.externalUrl;
    if (item.provider === "sharepoint" && item.externalUrl) current.files = item.externalUrl;
    if (item.provider === "teams" && item.externalUrl) current.teams = item.externalUrl;
    if (item.provider === "canva" && item.externalUrl) current.canva = item.externalUrl;
    links[item.assignmentId] = current;
  }
  return <InternAssignmentsPageView workspace={data.workspace} links={links} />;
}
