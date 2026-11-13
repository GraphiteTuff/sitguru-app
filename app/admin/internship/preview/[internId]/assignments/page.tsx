import Link from "next/link";
import { InternName } from "@/components/portal/PersonFace";
import { adminInternAssignmentPath, requireAdminInternAssignmentPreview } from "@/lib/internship/admin-preview";
import { internPortalPreviewPath } from "@/lib/internship/constants";
import { taskStatusLabel } from "@/lib/internship/labels";
import { readAssignmentBrief, isHttpUrl } from "@/lib/internship/manager-assignment";
import { listAssignmentIntegrations } from "@/lib/microsoft/assignment-integrations";

export const dynamic = "force-dynamic";

export default async function AdminInternAssignmentsPreviewPage({
  params,
}: {
  params: Promise<{ internId: string }>;
}) {
  const { internId } = await params;
  const workspace = await requireAdminInternAssignmentPreview(internId);
  const tasks = [...workspace.tasks].sort((a, b) => String(a.dueOn || "9999").localeCompare(String(b.dueOn || "9999")));
  const integrations = await listAssignmentIntegrations(tasks.map((task) => task.id));
  const completed = tasks.filter((task) => task.status === "approved" || ["ceo_approved", "approved_complete"].includes(task.reviewStage || "")).length;
  const pendingReview = tasks.filter((task) => task.status === "submitted" || ["submitted_to_ava", "submitted_to_jason"].includes(task.reviewStage || "")).length;

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-3 pb-14 sm:px-5">
      <Link href="/admin/internship/portal" className="inline-flex min-h-10 items-center text-sm font-black text-blue-700">
        ← All intern portals
      </Link>

      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-black uppercase tracking-widest text-blue-700">Admin HQ · Intern workspace preview</p>
        <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
          <InternName name={workspace.intern.fullName} src={workspace.intern.avatarUrl} /> · Assignments
        </h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Browse this intern's assigned work exactly as it appears in SitGuru, without signing in as them.
          This administrator preview is read-only: it cannot edit, save, approve, or submit their work.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={internPortalPreviewPath(internId)} className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">
            Student portal overview
          </Link>
          <Link href={`/admin/internship/interns/${encodeURIComponent(internId)}`} className="inline-flex min-h-11 items-center rounded-xl border border-emerald-200 px-4 text-sm font-bold text-emerald-900 hover:bg-emerald-50">
            Employer review
          </Link>
        </div>
      </section>

      <div role="status" className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
        <span className="font-black">Read-only administrator preview.</span>{" "}
        You are still signed in as yourself. To test an actual Save Work request, use an authorized intern account with its own test assignment.
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Visible assignments</p>
          <p className="mt-1 text-3xl font-black text-slate-950">{tasks.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Needs review</p>
          <p className="mt-1 text-3xl font-black text-slate-950">{pendingReview}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Approved</p>
          <p className="mt-1 text-3xl font-black text-slate-950">{completed}</p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-black text-slate-950">My assignments · {workspace.intern.fullName}</h2>
        {tasks.length ? tasks.map((task) => {
          const brief = readAssignmentBrief(task.briefPayload);
          const assignmentIntegrations = integrations.filter((row) => row.assignmentId === task.id);
          const files = assignmentIntegrations.find((row) => row.provider === "sharepoint");
          const planner = assignmentIntegrations.find((row) => row.provider === "planner");
          const teams = assignmentIntegrations.find((row) => row.provider === "teams");
          return (
            <article key={task.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0 space-y-2">
                  <Link href={adminInternAssignmentPath(internId, task.id)} className="text-base font-black text-slate-950 hover:text-blue-700 hover:underline">
                    {task.title}
                  </Link>
                  <p className="text-sm font-semibold text-slate-600">
                    {brief.category || "Assignment"} · Due {task.dueOn || "TBD"} · {taskStatusLabel(task.status, task.reviewStage)}
                  </p>
                  {brief.description ? <p className="line-clamp-2 text-sm text-slate-600">{brief.description}</p> : null}
                </div>
                <Link href={adminInternAssignmentPath(internId, task.id)} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-blue-700 px-4 text-sm font-black !text-white hover:bg-blue-800">
                  Preview assignment
                </Link>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-600">
                <span>Planner: {planner?.status === "connected" ? "Linked" : "Not configured"}</span>
                {files?.externalUrl && isHttpUrl(files.externalUrl) ? (
                  <a href={files.externalUrl} target="_blank" rel="noreferrer" className="text-blue-700 underline">SharePoint files</a>
                ) : <span>SharePoint: Not linked</span>}
                {teams?.externalUrl && isHttpUrl(teams.externalUrl) ? (
                  <a href={teams.externalUrl} target="_blank" rel="noreferrer" className="text-blue-700 underline">Teams channel</a>
                ) : <span>Teams: Not linked</span>}
              </div>
            </article>
          );
        }) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-sm font-semibold text-slate-600">
            No published assignments are currently assigned to this intern. This preview uses actual SitGuru data; it does not add sample tasks.
          </div>
        )}
      </section>
    </main>
  );
}
