import Link from "next/link";
import { readAssignmentBrief, isHttpUrl } from "@/lib/internship/manager-assignment";
import { legacyStatusToStage } from "@/lib/internship/review-flow";
import { taskStatusLabel } from "@/lib/internship/labels";
import { saveInternAssignmentProgress } from "@/lib/internship/intern-assignment-progress";
import { expectedInternAssignmentFolder } from "@/lib/microsoft/assignment-sharepoint";
import { DESK_UI } from "@/lib/portal/desk-ui";
import type { InternshipTask, InternshipWorkspaceData } from "@/lib/internship/types";
import type { AssignmentIntegration } from "@/lib/microsoft/assignment-integrations";
import { FINAL_CONTRIBUTION_SECTIONS, FINAL_PROJECT_OUTPUTS, FINAL_WORKSPACE_CHAPTERS } from "@/lib/internship/final-project";
import { isValidFinalSection } from "@/lib/internship/syllabus-alignment";

type LinkedIntegration = AssignmentIntegration & { assignmentId: string };

export default function InternAssignmentDetailLayout({
  workspace,
  task,
  integrations,
  backHref,
  adminPreview = false,
  canSaveToSharePoint = false,
  flash,
}: {
  workspace: InternshipWorkspaceData;
  task: InternshipTask;
  integrations: LinkedIntegration[];
  backHref: string;
  adminPreview?: boolean;
  canSaveToSharePoint?: boolean;
  flash?: { ok?: string; error?: string };
}) {
  const brief = readAssignmentBrief(task.briefPayload);
  const work = task.briefPayload?.internWork && typeof task.briefPayload.internWork === "object"
    ? task.briefPayload.internWork as Record<string, unknown> : {};
  const stage = legacyStatusToStage(task.status, task.reviewStage);
  const editable = stage === "draft" || stage === "changes_requested";
  const canEdit = editable && !adminPreview;
  const integration = (name: string) => integrations.find((item) => item.provider === name);
  const sharePoint = integration("sharepoint");
  const expected = expectedInternAssignmentFolder(workspace.intern.fullName, task.title);
  const folderUrl = sharePoint?.externalUrl || expected.url;
  const submittedUrl = String(work.sharePointDocumentUrl || "");
  const workDocumentUrl = submittedUrl ||
    (expected.knownFolderId ? `${expected.url}/SitGuru%20Assignment%20Work.md` : "");
  const comments = workspace.comments.filter((row) => row.itemType === "task" && row.itemId === task.id);
  const finalSection = isValidFinalSection(task.finalSection)
    ? FINAL_CONTRIBUTION_SECTIONS.find((row) => row.id === task.finalSection)
    : null;
  const finalChapter = FINAL_WORKSPACE_CHAPTERS.find((row) => row.id === finalSection?.chapter);
  const finalOutput = FINAL_PROJECT_OUTPUTS.find((row) => row.id === finalSection?.output);
  const project = workspace.projects.find((row) => row.id === task.projectId);

  const workFields = (
    <>
      <label className="block space-y-2">
        <span className="text-sm font-black text-slate-950">Your answers, notes, and ideas</span>
        <textarea
          name="studentNotes"
          defaultValue={String(work.notes || "")}
          rows={9}
          readOnly={!canEdit}
          placeholder="Write your research, answers, ideas, or progress here. You can save and come back before submitting."
          className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 read-only:bg-slate-50"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-black text-slate-950">Link to your work (optional)</span>
        <input
          name="workUrl"
          type="url"
          readOnly={!canEdit}
          defaultValue={String(work.researchLink || "")}
          placeholder="https://"
          className="min-h-11 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none read-only:bg-slate-50"
        />
      </label>
    </>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-24 xl:pb-8">
      <Link href={backHref} className="inline-flex min-h-10 items-center text-sm font-bold text-blue-700">
        ← {adminPreview ? "Back to intern assignment preview" : "Back to My Assignments"}
      </Link>

      {adminPreview ? (
        <div role="status" className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-950">
          <p className="font-black">Admin preview · {workspace.intern.fullName} · Read only</p>
          <p className="mt-1">
            You are viewing this intern's actual assignment data without signing in as them. Saving, submitting, and editing are disabled. Use Employer review to manage work.
          </p>
        </div>
      ) : null}

      {!adminPreview ? (
        <section aria-label="How assignments work" className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 sm:px-5">
          <h2 className="text-sm font-black text-[#0F2744]">Three easy steps</h2>
          <ol className="mt-3 grid gap-3 text-sm font-semibold text-slate-700 sm:grid-cols-3">
            <li><span className="mr-2 font-black text-blue-700">1.</span>Read your instructions</li>
            <li><span className="mr-2 font-black text-blue-700">2.</span>Write your work and save a draft</li>
            <li><span className="mr-2 font-black text-blue-700">3.</span>Submit to Ava for review</li>
          </ol>
        </section>
      ) : null}

      <section className={`${DESK_UI.card} p-5 sm:p-7`}>
        <p className="text-xs font-black uppercase tracking-widest text-blue-700">{brief.category || "Intern assignment"}</p>
        <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">{task.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600">
          <span>{workspace.intern.fullName}</span>
          <span>·</span>
          <span>Due {task.dueOn || "TBD"}</span>
          <span>·</span>
          <span>{taskStatusLabel(task.status, task.reviewStage)}</span>
          <span>·</span>
          <span>Review: {brief.review || "Manager review required"}</span>
        </div>

        {flash?.ok ? (
          <p role="status" className="mt-4 rounded-xl border border-green-200 bg-green-50 px-3 py-3 text-sm font-semibold text-green-800">{flash.ok}</p>
        ) : null}
        {flash?.error ? (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm font-semibold text-red-800">{flash.error}</p>
        ) : null}

        <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-4">
          <p className="text-xs font-black uppercase tracking-wider text-[#0D5C3A]">Why this matters for your final project</p>
          {finalSection ? (
            <>
              <p className="mt-1 text-sm font-black text-slate-950">{finalSection.label} → {finalChapter?.label || "Final Growth Project"}</p>
              <p className="mt-1 text-xs font-semibold text-slate-700">
                {project ? project.name + " · " : ""}{finalOutput?.name || "Final Growth Project"}
              </p>
              <p className="mt-2 text-xs font-medium leading-5 text-slate-600">
                Save the requested evidence and submit it to Ava. Approved work becomes a contribution to
                this final project chapter. Your report, Playbook, and portfolio reuse that approved work.
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm font-medium text-slate-600">
              Ava has not assigned this task to a final-project chapter yet.
              Complete the instructions as usual; your work will be preserved for manager review.
            </p>
          )}
          {!adminPreview ? (
            <Link href="/intern/growth" className="mt-3 inline-flex min-h-10 items-center text-xs font-black text-blue-800 underline">
              Open my Business Growth Report →
            </Link>
          ) : null}
        </div>

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
        <h2 className="text-xl font-black text-slate-950">Your work</h2>
        <p className="mt-2 text-sm text-slate-600">
          Write everything here. Click Save draft to keep it in SharePoint, then submit when it is ready for Ava. You do not need to open Planner or Teams.
        </p>

        {adminPreview ? (
          <div className="mt-5 space-y-4">
            {workFields}
            <div className="flex flex-wrap gap-3">
              <button type="button" disabled className="min-h-11 rounded-full bg-blue-700 px-6 text-sm font-black text-white opacity-50 cursor-not-allowed">
                Save draft
              </button>
              <button type="button" disabled className="min-h-11 rounded-full bg-emerald-700 px-6 text-sm font-black text-white opacity-50 cursor-not-allowed">
                Submit to Ava
              </button>
            </div>
            <p className="text-xs font-semibold text-amber-900">Disabled for administrator previews; no files or assignment statuses can change.</p>
          </div>
        ) : (
          <>
            {!canSaveToSharePoint ? (
              <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
                Saving and submitting are temporarily unavailable while SitGuru connects Microsoft 365. You can still read the assignment and open the SharePoint folder if you have permission. Please contact Ava for another way to submit your work.
              </p>
            ) : null}
            <form action={saveInternAssignmentProgress} className="mt-5 space-y-4">
              <input type="hidden" name="assignmentId" value={task.id} />
              {workFields}
              {canEdit ? (
                <>
                <p className="text-xs font-medium text-slate-500">Saving keeps your draft editable. Submitting sends it to Ava and pauses editing until review.</p>
                <div className="flex flex-wrap gap-3">
                  <button type="submit" name="intent" value="save" disabled={!canSaveToSharePoint} className="min-h-11 rounded-full bg-blue-700 px-6 text-sm font-black text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
                    Save draft
                  </button>
                  <button type="submit" name="intent" value="submit" disabled={!canSaveToSharePoint} className="min-h-11 rounded-full bg-emerald-700 px-6 text-sm font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
                    Submit to Ava
                  </button>
                </div>
                </>
              ) : (
                <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                  {stage === "submitted_to_ava" ? "Awaiting Ava’s review." : "This assignment is read-only until changes are requested."}
                </p>
              )}
            </form>
          </>
        )}

        {workDocumentUrl && isHttpUrl(workDocumentUrl) ? (
          <a href={workDocumentUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex break-all text-sm font-bold text-blue-700 underline">
            Open assignment work in SharePoint
          </a>
        ) : null}
      </section>

      <details className={`${DESK_UI.card} p-5`}>
        <summary className="cursor-pointer text-base font-black text-slate-950">Extra resources (SharePoint, Teams, Planner) — optional</summary>
        <p className="mt-2 text-sm text-slate-600">Your assignment can be completed entirely in SitGuru. These links are available if you want them.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="font-black text-slate-950">SharePoint files</p>
            <p className="mt-1 text-xs text-slate-500">
              {sharePoint?.status === "connected" ? "Connected" : sharePoint?.status === "needs_access" ? "SharePoint access needed" : sharePoint?.status === "error" ? "Folder sync failed" : folderUrl ? "Folder available; sync not verified" : "Not configured"}
            </p>
            {isHttpUrl(folderUrl) ? (
              <a href={folderUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-bold text-blue-700 underline">Open assignment folder</a>
            ) : null}
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="font-black text-slate-950">Microsoft Planner</p>
            <p className="mt-1 text-xs text-slate-500">
              {integration("planner")?.status === "connected" ? "Connected" : integration("planner")?.status === "linked_manually" ? "Task link added (unverified)" : "Not yet configured"}
            </p>
            {integration("planner")?.externalUrl && isHttpUrl(integration("planner")!.externalUrl) ? (
              <a href={integration("planner")!.externalUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-bold text-blue-700 underline">Open Planner task</a>
            ) : null}
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="font-black text-slate-950">Microsoft Teams</p>
            <p className="mt-1 text-xs text-slate-500">
              {integration("teams")?.status === "connected" ? "Channel linked" : "Not yet configured"}
            </p>
            {integration("teams")?.externalUrl && isHttpUrl(integration("teams")!.externalUrl) ? (
              <a href={integration("teams")!.externalUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-bold text-blue-700 underline">Open Teams</a>
            ) : null}
          </div>
        </div>
      </details>

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
