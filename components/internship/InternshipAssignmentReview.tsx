"use client";

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
import { taskStatusLabel } from "@/lib/internship/labels";
import type { InternshipWorkComment } from "@/lib/internship/types";

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
}) {
  const supervisor = mode === "supervisor";
  const closed = status === "approved" || status === "not_accepted";
  const awaiting = status === "submitted";
  const needsRevision = status === "revision_requested";
  const itemComments = comments.filter((row) => row.itemId === id);

  return (
    <article className="rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="break-words font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {taskStatusLabel(status)}
            {kpiTier ? ` · ${TIER_LABELS[kpiTier] || kpiTier}` : ""}
          </p>
        </div>
        {employerLetter ? (
          <span className={`rounded-full border px-3 py-1 text-sm font-black ${toneClass(employerLetter)}`}>
            {employerLetterLabel(employerLetter)}
          </span>
        ) : null}
      </div>

      {supervisorNotes ? (
        <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
          Supervisor: {supervisorNotes}
        </p>
      ) : null}

      {workUrl || draftUrl || publishedUrl ? (
        <div className="mt-3 flex flex-wrap gap-3 text-sm font-black text-emerald-800">
          {workUrl ? (
            <a href={workUrl} target="_blank" rel="noreferrer" className="min-h-11 inline-flex items-center underline">
              Submitted work
            </a>
          ) : null}
          {draftUrl ? (
            <a href={draftUrl} target="_blank" rel="noreferrer" className="min-h-11 inline-flex items-center underline">
              Draft
            </a>
          ) : null}
          {publishedUrl ? (
            <a href={publishedUrl} target="_blank" rel="noreferrer" className="min-h-11 inline-flex items-center underline">
              Published
            </a>
          ) : null}
        </div>
      ) : null}

      {studentNotes ? (
        <p className="mt-2 text-sm font-semibold text-slate-600">{studentNotes}</p>
      ) : null}

      {itemComments.length ? (
        <div className="mt-3 space-y-2">
          {itemComments.map((row) => (
            <p key={row.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
              <span className="font-black text-slate-950">
                {row.authorRole === "supervisor" ? "Jason" : "Intern"}:{" "}
              </span>
              {row.body}
            </p>
          ))}
        </div>
      ) : null}

      {!closed ? (
        <form action={commentInternWork} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="internId" value={internId} />
          <input type="hidden" name="mode" value={mode} />
          <input type="hidden" name="itemType" value={itemType} />
          <input type="hidden" name="id" value={id} />
          <input
            name="body"
            required
            placeholder="Instructor-style comment"
            className="min-h-12 w-full flex-1 rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
          />
          <button className="min-h-12 rounded-xl bg-white px-4 text-sm font-black text-emerald-900 ring-1 ring-emerald-200">
            Comment
          </button>
        </form>
      ) : null}

      {!supervisor && !closed ? (
        <form action={submitInternWork} className="mt-4 grid gap-3">
          <input type="hidden" name="internId" value={internId} />
          <input type="hidden" name="mode" value={mode} />
          <input type="hidden" name="itemType" value={itemType} />
          <input type="hidden" name="id" value={id} />
          {itemType === "task" ? (
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                Link to completed work
              </span>
              <input
                name="workUrl"
                defaultValue={workUrl || ""}
                className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
              />
            </label>
          ) : (
            <>
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                  Draft link
                </span>
                <input
                  name="draftUrl"
                  defaultValue={draftUrl || ""}
                  className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                  Published link
                </span>
                <input
                  name="publishedUrl"
                  defaultValue={publishedUrl || ""}
                  className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
                />
              </label>
            </>
          )}
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
              What should Jason review?
            </span>
            <textarea
              name="studentNotes"
              defaultValue={studentNotes || ""}
              rows={3}
              className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-3 text-sm font-semibold"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
              Note to supervisor
            </span>
            <input
              name="internComment"
              placeholder={needsRevision ? "Explain what you changed" : "Optional"}
              className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
            />
          </label>
          <button className="min-h-12 w-full rounded-2xl bg-[#0D5C3A] text-sm font-black !text-white">
            {awaiting ? "Resubmit for review" : "Submit for Jason’s review"}
          </button>
        </form>
      ) : null}

      {supervisor && !closed ? (
        <form action={reviewInternWork} className="mt-4 grid gap-3">
          <input type="hidden" name="internId" value={internId} />
          <input type="hidden" name="itemType" value={itemType} />
          <input type="hidden" name="id" value={id} />
          <p className="text-xs font-semibold leading-5 text-slate-500">
            {EMPLOYER_GRADE_DISCLAIMER}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                KPI letter
              </span>
              <select
                name="letter"
                required
                defaultValue={employerLetter || ""}
                className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
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
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                Evidence tier
              </span>
              <select
                name="kpiTier"
                defaultValue={kpiTier || "tier_1"}
                className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
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
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
              Output vs target %
            </span>
            <input
              name="outputVsTarget"
              type="number"
              step="0.1"
              placeholder="100 = hit the SMART target"
              className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
              Instructor comments
            </span>
            <textarea
              name="comments"
              required
              rows={4}
              placeholder="What met the business standard, what missed, and what to change."
              className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-3 text-sm font-semibold"
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-3">
            <button
              name="decision"
              value="approved"
              className="min-h-12 rounded-2xl bg-[#0D5C3A] text-sm font-black !text-white"
            >
              Approve
            </button>
            <button
              name="decision"
              value="revision_requested"
              className="min-h-12 rounded-2xl border border-amber-300 bg-amber-50 text-sm font-black text-amber-900"
            >
              Send back
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
    </article>
  );
}
