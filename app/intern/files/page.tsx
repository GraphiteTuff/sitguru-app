import Link from "next/link";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadInternSectionWorkspace } from "@/lib/internship/intern-section-data";
import { listAssignmentIntegrations } from "@/lib/microsoft/assignment-integrations";

export const dynamic = "force-dynamic";

export default async function InternFilesPage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const data = await loadInternSectionWorkspace();
  if (!data) return <p className="rounded-2xl bg-white p-5">My Files requires a linked intern account.</p>;

  const { intern, tasks } = data.workspace;
  const assignments = tasks.filter((task) => task.internId === intern.id);
  const integrations = await listAssignmentIntegrations(assignments.map((task) => task.id));
  const folders = new Map(integrations
    .filter((item) => item.provider === "sharepoint" && item.externalUrl?.startsWith("https://"))
    .map((item) => [item.assignmentId, item.externalUrl]));

  return (
    <section className="space-y-4 rounded-2xl border border-emerald-950/10 bg-white p-4 sm:p-6">
      <h1 className="text-2xl font-black text-[#183b31]">My Files</h1>
      <p className="text-sm text-slate-700">Open your assigned SharePoint folders with your SitGuru work account.</p>
      {assignments.length ? (
        <ul className="divide-y divide-slate-100">
          {assignments.map((task) => {
            const folder = folders.get(task.id);
            return (
              <li key={task.id} className="flex flex-wrap items-center justify-between gap-x-4 py-2">
                <Link href={`/intern/assignments/${encodeURIComponent(task.id)}`} className="flex min-h-12 min-w-0 items-center break-words font-semibold text-[#10583f] hover:underline">{task.title}</Link>
                {folder ? (
                  <a href={folder} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center text-sm font-bold text-[#10583f] hover:underline">Open SharePoint folder</a>
                ) : <span className="text-sm text-slate-600">No folder linked</span>}
              </li>
            );
          })}
        </ul>
      ) : <p className="text-sm text-slate-600">Assignment folders will appear here once linked.</p>}
    </section>
  );
}
