"use client";

import { useId, useState } from "react";

import {
  commentInternWork,
  reviewInternWork,
  submitInternWork,
} from "@/lib/internship/actions";
import {
  EMPLOYER_GRADE_DISCLAIMER,
  KPI_LETTER_RUBRIC,
  KPI_TIERS,
  employerLetterLabel,
  employerLetterTone,
} from "@/lib/internship/grading";
import { workCommentsForItem, workDateLabel, workTextParts, workTextPreview } from "@/lib/internship/work-presentation";
import { taskStatusLabel } from "@/lib/internship/labels";
import type { InternshipWorkAttachment, InternshipWorkComment } from "@/lib/internship/types";
import InternBaselineBriefPanel from "@/components/internship/InternBaselineBriefPanel";
import InternWorkAttachments from "@/components/internship/InternWorkAttachments";
import { isBaselineGrowthBriefTask } from "@/lib/internship/baseline-brief";
import { internGhostBtnClass, internPrimaryBtnClass } from "@/lib/internship/intern-ui";
import type {
  InternshipExperiment,
  InternshipIntern,
  InternshipMetric,
  InternshipSmartGoal,
  InternshipTask,
} from "@/lib/internship/types";

const TIER_LABELS: Record<string, string> = {
  tier_1: "Tier 1 — Business outcome",
  tier_2: "Tier 2 — Conversion",
  tier_3: "Tier 3 — Awareness",
  none: "Not yet classified",
};

function toneClass(letter?: string) {
  const tone = employerLetterTone(letter);
  if (tone === "emerald") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (tone === "amber") return "border-amber-200 bg-amber-50 text-amber-800";
  if (tone === "rose") return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function WorkText({ text }: { text: string }) {
  return (
    <p className="whitespace-pre-wrap text-base leading-7 text-slate-700 [overflow-wrap:anywhere]">
      {workTextParts(text).map((part, index) => part.href ? (
        <a key={index} href={part.href} title={part.href} target="_blank" rel="noreferrer"
          className="rounded text-blue-700 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
          {part.label}
        </a>
      ) : part.text)}
    </p>
  );
}

type WorkPanel = "submission" | "files" | "feedback" | "review";

export default function InternshipAssignmentReview({
  internId,
  mode,
  itemType,
  id,
  title,
  status,
  workUrl,
  draftUrl,
  publishedUrl,
  studentNotes,
  supervisorNotes,
  employerLetter,
  kpiTier,
  comments,
  attachments = [],
  preview = false,
  intern,
  task,
  metrics = [],
  smartGoals = [],
  experiments = [],
  reviewStage,
}: {
  internId: string;
  mode: "intern" | "supervisor";
  itemType: "task" | "content";
  id: string;
  title: string;
  status: string;
  workUrl?: string;
  draftUrl?: string;
  publishedUrl?: string;
  studentNotes?: string;
  supervisorNotes?: string;
  employerLetter?: string;
  kpiTier?: string;
  comments: InternshipWorkComment[];
  attachments?: InternshipWorkAttachment[];
  preview?: boolean;
  intern?: InternshipIntern;
  task?: InternshipTask;
  metrics?: InternshipMetric[];
  smartGoals?: InternshipSmartGoal[];
  experiments?: InternshipExperiment[];
  reviewStage?: string;
}) {
  const supervisor = mode === "supervisor";
  const closed = status === "approved" || status === "not_accepted" || status === "ava_approved" || status === "ceo_approved";
  const awaiting = status === "submitted" || status === "submitted_to_ava" || status === "submitted_to_jason";
  const needsRevision = status === "revision_requested" || status === "changes_requested";
  const panelId = useId();
  const [panel, setPanel] = useState<WorkPanel | null>(null);
  const { feedback: itemComments, activity } = workCommentsForItem(comments, { internId, itemType, id });
  const fileCount = attachments.filter((file) => file.internId === internId && file.itemType === itemType && file.itemId === id).length;
  const dueDate = workDateLabel(task?.dueOn);
  const activeStage = reviewStage || task?.reviewStage || status;
  const needsAttention = ["submitted", "submitted_to_ava", "submitted_to_jason", "ceo_review_required"].includes(activeStage);
  const revision = needsRevision || ["revision_requested", "changes_requested"].includes(activeStage);
  const notAccepted = activeStage === "not_accepted" || status === "not_accepted";
  const baselineBrief =
    itemType === "task" &&
    isBaselineGrowthBriefTask({ title, studentNotes }) &&
    intern &&
    (task || intern);
  const canReviewPanel = !closed && !preview && (supervisor || !baselineBrief);

  const actions: Array<{ id: WorkPanel; label: string }> = [
    { id: "submission", label: baselineBrief ? "View brief" : "View submission" },
    ...(!baselineBrief ? [{ id: "files" as const, label: `Files (${fileCount})` }] : []),
    { id: "feedback", label: "Feedback" },
    ...(canReviewPanel ? [{ id: "review" as const, label: supervisor ? "Review work" : "Update submission" }] : []),
  ];

  return (
    <article className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-lg font-black text-slate-950">{title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className={`rounded-full px-3 py-1 font-bold ${notAccepted ? "bg-rose-50 text-rose-800" : revision ? "bg-amber-50 text-amber-900" : needsAttention ? "bg-blue-50 text-blue-800" : closed ? "bg-[#166534] !text-white" : "bg-slate-100 text-slate-700"}`}>
              {taskStatusLabel(status, activeStage)}
            </span>
            {dueDate ? <span className="text-slate-600">Due <time dateTime={task?.dueOn || undefined}>{dueDate}</time></span> : null}
          </div>
        </div>
        {employerLetter ? (
          <span className={`rounded-full border px-3 py-1 text-sm font-black ${toneClass(employerLetter)}`}>
            {employerLetterLabel(employerLetter)}
          </span>
        ) : null}
      </div>

      {studentNotes && !baselineBrief ? (
        <p className="mt-3 line-clamp-2 text-base leading-6 text-slate-600 [overflow-wrap:anywhere]">{workTextPreview(studentNotes)}</p>
      ) : null}
      {supervisorNotes ? (
        <div className={`mt-3 rounded-xl px-4 py-3 ${revision ? "border border-amber-200 bg-amber-50" : "bg-slate-50"}`}>
          <p className="text-sm font-bold text-slate-900">{revision ? "Changes requested" : "Latest feedback"}</p>
          <p className="mt-1 line-clamp-3 text-base leading-6 text-slate-600 [overflow-wrap:anywhere]">{workTextPreview(supervisorNotes, 240)}</p>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" aria-label="Assignment actions">
        {actions.map((action) => (
          <button key={action.id} type="button" aria-expanded={panel === action.id}
            aria-controls={`${panelId}-${action.id}`} onClick={() => setPanel(panel === action.id ? null : action.id)}
            className={`${panel === action.id || action.id === "review" ? internPrimaryBtnClass : internGhostBtnClass} min-h-12 px-3`}>
            {action.label}
          </button>
        ))}
      </div>

      <section id={`${panelId}-submission`} hidden={panel !== "submission"} aria-label="Submission" className="mt-4 space-y-4 border-t border-slate-100 pt-4">
        <h4 className="text-base font-bold text-slate-950">{baselineBrief ? "Assignment brief" : "Full submission"}</h4>
        {workUrl || draftUrl || publishedUrl ? (
          <div className="flex flex-wrap gap-2">
            {workUrl ? <a href={workUrl} target="_blank" rel="noreferrer" className={internGhostBtnClass}>Open work link</a> : null}
            {draftUrl ? <a href={draftUrl} target="_blank" rel="noreferrer" className={internGhostBtnClass}>Open draft</a> : null}
            {publishedUrl ? <a href={publishedUrl} target="_blank" rel="noreferrer" className={internGhostBtnClass}>View published work</a> : null}
          </div>
        ) : null}
        {studentNotes && !baselineBrief ? <WorkText text={studentNotes} /> : null}
        {!studentNotes && !workUrl && !draftUrl && !publishedUrl && !baselineBrief ? <p className="text-base text-slate-600">No submission added yet.</p> : null}
        {kpiTier ? <p className="text-sm text-slate-600">Measure: {TIER_LABELS[kpiTier] || kpiTier}</p> : null}
        {baselineBrief && intern ? (
          <InternBaselineBriefPanel
            intern={intern}
            task={task || {
              id, internId, projectId: null, title, dueOn: null, status: status as InternshipTask["status"],
              workUrl: workUrl || "", businessObjective: "", metricAffected: "", studentNotes: studentNotes || "",
              supervisorNotes: supervisorNotes || "", supervisorApproved: false, approvedAt: null, submittedAt: null,
              employerLetter: employerLetter || "", kpiTier: kpiTier || "", outputVsTarget: null,
            }}
            attachments={attachments} metrics={metrics} smartGoals={smartGoals} experiments={experiments} mode={mode} preview={preview}
          />
        ) : null}
      </section>

      {!baselineBrief ? (
        <section id={`${panelId}-files`} hidden={panel !== "files"} aria-label="Assignment files" className="mt-4 border-t border-slate-100 pt-1">
          <InternWorkAttachments internId={internId} itemType={itemType} itemId={id} attachments={attachments} mode={mode} preview={preview} compact />
        </section>
      ) : null}

      <section id={`${panelId}-feedback`} hidden={panel !== "feedback"} aria-label="Feedback" className="mt-4 space-y-4 border-t border-slate-100 pt-4">
        <h4 className="text-base font-bold text-slate-950">Feedback & conversation</h4>
        {supervisorNotes ? <div className="rounded-xl bg-slate-50 p-4"><p className="mb-2 text-sm font-bold text-slate-900">Latest supervisor feedback</p><WorkText text={supervisorNotes} /></div> : null}
        {itemComments.length ? (
          <ul className="space-y-3">
            {itemComments.map((row) => (
              <li key={row.id} className="rounded-xl border border-slate-200 p-4">
                <p className="mb-2 flex flex-wrap gap-x-2 text-sm text-slate-500">
                  <span className="font-bold text-slate-900">{row.authorRole === "supervisor" ? "SitGuru" : "Intern"}</span>
                  {workDateLabel(row.createdAt) ? <time dateTime={row.createdAt}>{workDateLabel(row.createdAt)}</time> : null}
                </p>
                <WorkText text={row.body} />
              </li>
            ))}
          </ul>
        ) : !supervisorNotes ? <p className="text-base text-slate-600">No feedback yet.</p> : null}
      {!closed && !preview ? (
        <form action={commentInternWork} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="internId" value={internId} />
          <input type="hidden" name="mode" value={mode} />
          <input type="hidden" name="itemType" value={itemType} />
          <input type="hidden" name="id" value={id} />
          <input
            name="body"
            required
            aria-label={mode === "intern" ? "Add a note" : "Add feedback"}
            placeholder={mode === "intern" ? "Ask a question or add a note" : "Add feedback"}
            className="min-h-12 w-full flex-1 rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
          />
          <button className={internGhostBtnClass}>
            Post comment
          </button>
        </form>
      ) : null}

      </section>

      {canReviewPanel ? (
        <section id={`${panelId}-review`} hidden={panel !== "review"} aria-label={supervisor ? "Review work" : "Update submission"} className="mt-4 border-t border-slate-100 pt-4">
          <h4 className="text-base font-bold text-slate-950">{supervisor ? "Review work" : "Update submission"}</h4>
      {!baselineBrief && !supervisor && !preview && !closed ? (
        <form action={submitInternWork} className="mt-4 grid gap-3">
          <input type="hidden" name="internId" value={internId} />
          <input type="hidden" name="mode" value={mode} />
          <input type="hidden" name="itemType" value={itemType} />
          <input type="hidden" name="id" value={id} />
          {itemType === "task" ? (
            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                Work link
              </span>
              <input
                name="workUrl"
                defaultValue={workUrl || ""}
                className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base"
              />
            </label>
          ) : (
            <>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Draft link
                </span>
                <input
                  name="draftUrl"
                  defaultValue={draftUrl || ""}
                  className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Published link
                </span>
                <input
                  name="publishedUrl"
                  defaultValue={publishedUrl || ""}
                  className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base"
                />
              </label>
            </>
          )}
          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Submission notes
            </span>
            <textarea
              name="studentNotes"
              defaultValue={studentNotes || ""}
              rows={3}
              className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-3 text-base"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Note to supervisor
            </span>
            <input
              name="internComment"
              placeholder={needsRevision ? "Explain what you changed" : "Optional"}
              className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base"
            />
          </label>
          <button className={`${internPrimaryBtnClass} w-full`}>
            {awaiting ? "Resubmit for review" : "Submit for review"}
          </button>
        </form>
      ) : null}

      {supervisor && !preview && !closed ? (
        <form action={reviewInternWork} className="mt-4 grid gap-3">
          <input type="hidden" name="internId" value={internId} />
          <input type="hidden" name="itemType" value={itemType} />
          <input type="hidden" name="id" value={id} />
          <p className="text-xs font-semibold leading-5 text-slate-500">
            {EMPLOYER_GRADE_DISCLAIMER}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                Performance grade
              </span>
              <select
                name="letter"
                required
                defaultValue={employerLetter || ""}
                className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base"
              >
                <option value="">Select letter</option>
                {KPI_LETTER_RUBRIC.map((row) => (
                  <option key={row.letter} value={row.letter}>
                    {row.letter} — {row.evidence}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                Evidence tier
              </span>
              <select
                name="kpiTier"
                defaultValue={kpiTier || "tier_1"}
                className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base"
              >
                {KPI_TIERS.filter((tier) => tier !== "none").map((tier) => (
                  <option key={tier} value={tier}>
                    {TIER_LABELS[tier]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Goal achieved (%)
            </span>
            <input
              name="outputVsTarget"
              type="number"
              step="0.1"
              placeholder="100 = hit the SMART target"
              className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Feedback
            </span>
            <textarea
              name="comments"
              required
              rows={4}
              placeholder="What went well? What needs to change?"
              className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-3 text-base"
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-3">
            <button
              name="decision"
              value="approved"
              className="min-h-12 rounded-2xl bg-[#166534] text-sm font-black !text-white"
            >
              Approve
            </button>
            <button
              name="decision"
              value="revision_requested"
              className="min-h-12 rounded-2xl border border-amber-300 bg-amber-50 text-sm font-black text-amber-900"
            >
              Request changes
            </button>
            <button
              name="decision"
              value="not_accepted"
              className="min-h-12 rounded-2xl border border-rose-200 bg-rose-50 text-sm font-black text-rose-800"
            >
              Not accepted
            </button>
          </div>
        </form>
      ) : null}
        </section>
      ) : null}

      {activity.length ? (
        <details className="mt-4 rounded-xl border border-slate-200 px-4">
          <summary className="min-h-11 cursor-pointer content-center rounded text-sm font-semibold text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            Activity history ({activity.length})
          </summary>
          <ol className="space-y-2 border-t border-slate-100 py-3">
            {activity.map((row) => (
              <li key={row.id} className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm text-slate-600">
                <span>{row.body}</span>
                {workDateLabel(row.createdAt) ? <time dateTime={row.createdAt}>{workDateLabel(row.createdAt)}</time> : null}
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </article>
  );
}
