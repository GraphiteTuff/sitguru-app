import Link from "next/link";
import { notFound } from "next/navigation";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadInternSectionWorkspace } from "@/lib/internship/intern-section-data";
import { readAssignmentBrief, isHttpUrl } from "@/lib/internship/manager-assignment";
import { legacyStatusToStage } from "@/lib/internship/review-flow";
import { taskStatusLabel } from "@/lib/internship/labels";
import { saveInternAssignmentProgress } from "@/lib/internship/intern-assignment-progress";
import { listAssignmentIntegrations } from "@/lib/microsoft/assignment-integrations";
import { expectedInternAssignmentFolder } from "@/lib/microsoft/assignment-sharepoint";
import { readMicrosoftGraphConfig } from "@/lib/microsoft/graph";
import { DESK_UI } from "@/lib/portal/desk-ui";

export const dynamic = "force-dynamic";

export default async function InternAssignmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const { id } = await params;
  const data = await loadInternSectionWorkspace();
  if (!data) notFound();
  const task = data.workspace.tasks.find((row) => row.id === id);
  if (!task || task.internId !== data.workspace.intern.id || task.status === "draft") notFound();

  const search = searchParams ? await searchParams : {};
  const flash = (key: "ok" | "error") => {
    const value = search[key];
    return String(Array.isArray(value) ? value[0] : value || "");
  };

  const brief = readAssignmentBrief(task.briefPayload);
  const work = task.briefPayload?.internWork && typeof task.briefPayload.internWork === "object"
    ? task.briefPayload.internWork as Record<string, unknown> : {};
  const storedNotes = String(work.notes || "");
  const externalLink = String(work.researchLink || "");
  const stage = legacyStatusToStage(task.status, task.reviewStage);
  const editable = stage === "draft" || stage === "changes_requested";
  const assigned = data.workspace.intern;
  const integrations = await listAssignmentIntegrations([task.id]);
  const integration = (name: string) => integrations.find((item) => item.provider === name);
  const sharePoint = integration("sharepoint");
  const expected = expectedInternAssignmentFolder(assigned.fullName, task.title);
  const folderUrl = sharePoint?.externalUrl || expected.url;
  const sharePointStatus = sharePoint?.status || "not_configured";
  const canSaveToSharePoint = readMicrosoftGraphConfig().configured;
  const submittedUrl = String(work.sharePointDocumentUrl || "");
  const existingLolaDocument = expected.knownFolderId ? `${expected.url}/SitGuru%20Assignment%20Work.md` : "";
  const workDocumentUrl = submittedUrl || existingLolaDocument;
  const comments = data.workspace.comments.filter((row) => row.itemType === "task" && row.itemId === task.id);

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-24 xl:pb-8">
      <Link href="/intern/assignments" className="text-sm font-bold text-blue-700">
        ← Back to My Assignments
      </Link>
      <section className={`${DESK_UI.card} p-5 sm:p-7`}>
        <p className="text-xs font-black uppercase tracking-widest text-blue-700">{brief.category || "Intern assignment"}</p>
        <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">{task.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600">
          <span>Due {task.dueOn || "TBD"}</span>
          <span>·</span>
          <span>{taskStatusLabel(task.status, task.reviewStage)}</span>
          <span>·</span>
          <span>Review: {brief.review || "Manager review required"}</span>
        </div>
        {flash("ok") ? (
          <p role="status" className="mt-4 rounded-xl border border-green-200 bg-green-50 px-3 py-3 text-sm font-semibold text-green-800">
            {flash("ok")}
          </p>
        ) : null}
        {flash("error") ? (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm font-semibold text-red-800">
            {flash("error")}
          </p>
        ) : null}
        <h2 className="mt-6 text-lg font-black text-slate-950">Assignment instructions</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {brief.description || task.businessObjective || "Ask your manager for more details."}
        </p>
        {brief.deliverables?.length ? (
          <div className="mt-5">
            <h2 className="text-base font-black text-slate-950">Deliverables</h2>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-6 text-slate-700">
              {brief.deliverables.map((deliverable, index) => <li key={index}>{deliverable}</li>)}
            </ul>
          </div>
        ) : null}
        {brief.resources?.length ? (
          <div className="mt-5">
            <h2 className="text-base font-black text-slate-950">Resources from Ava</h2>
            <div className="mt-2 flex flex-wrap gap-3">
              {brief.resources.filter(isHttpUrl).map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="break-all text-sm font-bold text-blue-700 underline">
                  {url}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className={`${DESK_UI.card} p-5 sm:p-7`}>
        <h2 className="text-xl font-black text-slate-950">My assignment work</h2>
        <p className="mt-2 text-sm text-slate-600">
          Work is saved to a Markdown document in SitGuru's SharePoint intern folder. Save as you go, then submit to Ava.
        </p>
        {!canSaveToSharePoint ? (
          <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
            Saving and submitting are temporarily unavailable while SitGuru connects Microsoft 365. You can still read the assignment and open the SharePoint folder if you have permission. Please contact Ava for another way to submit your work.
          </p>
        ) : null}
        <form action={saveInternAssignmentProgress} className="mt-5 space-y-4">
          <input type="hidden" name="assignmentId" value={task.id} />
          <label className="block space-y-2">
            <span className="text-sm font-black text-slate-950">Research, notes, and your content ideas</span>
            <textarea
              name="studentNotes"
              defaultValue={storedNotes}
              rows={11}
              readOnly={!editable}
              placeholder="Add your two pet trends, source links, SitGuru post or Reel ideas, and your SitGuru Pack discussion question here."
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-black text-slate-950">Additional work link (optional)</span>
            <input
              name="workUrl"
              type="url"
              readOnly={!editable}
              defaultValue={externalLink}
              placeholder="https://"
              className="min-h-11 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </label>
          {editable ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                name="intent"
                value="save"
                disabled={!canSaveToSharePoint}
                className="min-h-11 rounded-full bg-blue-700 px-6 text-sm font-black text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save Work to SharePoint
              </button>
              <button
                type="submit"
                name="intent"
                value="submit"
                disabled={!canSaveToSharePoint}
                className="min-h-11 rounded-full bg-emerald-700 px-6 text-sm font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Submit to Ava for Review
              </button>
            </div>
          ) : (
            <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
              {stage === "submitted_to_ava" ? "Awaiting Ava’s review." : "This assignment is read-only until changes are requested."}
            </p>
          )}
        </form>
        {workDocumentUrl ? (
          <a href={workDocumentUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex break-all text-sm font-bold text-blue-700 underline">
            Open assignment work in SharePoint
          </a>
        ) : null}
      </section>

      <section className={`${DESK_UI.card} p-5`}>
        <h2 className="text-lg font-black text-slate-950">Microsoft 365 assignment resources</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="font-black text-slate-950">SharePoint files</p>
            <p className="mt-1 text-xs text-slate-500">
              {sharePointStatus === "connected" ? "Connected" : "Folder found; automatic save requires configuration"}
            </p>
            <a href={folderUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-bold text-blue-700 underline">Open assignment folder</a>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="font-black text-slate-950">Microsoft Planner</p>
            <p className="mt-1 text-xs text-slate-500">
              {integration("planner")?.status === "connected" ? "Connected" : "Not yet configured"}
            </p>
            {integration("planner")?.externalUrl ? (
              <a href={integration("planner")!.externalUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-bold text-blue-700 underline">Open Planner task</a>
            ) : null}
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="font-black text-slate-950">Microsoft Teams</p>
            <p className="mt-1 text-xs text-slate-500">
              {integration("teams")?.status === "connected" ? "Channel linked" : "Not yet configured"}
            </p>
            {integration("teams")?.externalUrl ? (
              <a href={integration("teams")!.externalUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-bold text-blue-700 underline">Open Teams</a>
            ) : null}
          </div>
        </div>
      </section>

      {task.supervisorNotes || comments.length ? (
        <section className={`${DESK_UI.card} p-5`}>
          <h2 className="text-lg font-black text-slate-950">Manager feedback</h2>
          {task.supervisorNotes ? <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{task.supervisorNotes}</p> : null}
          <ul className="mt-3 space-y-2">
            {comments.map((comment) => (
              <li key={comment.id} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                <span className="font-black">{comment.authorRole === "intern" ? "You" : "SitGuru"}: </span>
                {comment.body}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
