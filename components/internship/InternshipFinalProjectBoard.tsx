"use client";

import { saveWeeklyReview } from "@/lib/internship/actions";
import {
  assembleBusinessGrowthReport,
  assembleFinalProjectWorkspace,
  CAPSTONE_WEEK_PLAN,
  FINAL_CONTRIBUTION_SECTIONS,
  defaultFinalSectionForWeek,
  type FinalContributionSectionId,
} from "@/lib/internship/final-project";
import type { InternshipWorkspaceData } from "@/lib/internship/types";
import InternWorkAttachments from "@/components/internship/InternWorkAttachments";
import { internPrimaryBtnClass } from "@/lib/internship/intern-ui";

export function FinalSectionSelect({
  name = "finalSection",
  defaultValue,
  required = true,
}: {
  name?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
        Contribution to your report
      </span>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue || ""}
        className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold text-slate-950"
      >
        <option value="">Which part of your report did this help?</option>
        {FINAL_CONTRIBUTION_SECTIONS.map((section) => (
          <option key={section.id} value={section.id}>
            {section.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function statusTone(percent: number) {
  if (percent >= 80) return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (percent >= 40) return "border-amber-200 bg-amber-50 text-amber-900";
  if (percent > 0) return "border-sky-200 bg-sky-50 text-sky-900";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

export default function InternshipFinalProjectBoard({
  data,
  weekNumber,
  mode,
  preview = false,
}: {
  data: InternshipWorkspaceData;
  weekNumber: number;
  mode: "intern" | "supervisor";
  preview?: boolean;
}) {
  const workspace = assembleFinalProjectWorkspace(data);
  const report = assembleBusinessGrowthReport(workspace);
  const thisWeek = CAPSTONE_WEEK_PLAN[Math.min(14, Math.max(0, weekNumber - 1))];
  const defaultSection = defaultFinalSectionForWeek(weekNumber);
  const supervisor = mode === "supervisor";
  const included = workspace.blocks.filter((row) => row.included);

  return (
    <section className="space-y-4">
      <article className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
          Your final report
        </p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">
          Business Growth Report
        </h2>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Every task, post, and campaign you finish goes into this report. Week{" "}
          {thisWeek.week} feeds {thisWeek.buildsToward}.
        </p>
        <p className="mt-3 text-sm font-black text-emerald-900">
          Report assembled: {report.percent}%
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          Supporting: Playbook {workspace.outputs.find((row) => row.id === "playbook")?.percent || 0}% ·
          Portfolio {workspace.outputs.find((row) => row.id === "portfolio")?.percent || 0}%
        </p>
        <InternWorkAttachments
          internId={data.intern.id}
          itemType="report"
          itemId={data.intern.id}
          attachments={data.attachments || []}
          mode={mode}
          preview={preview}
          label="Final report files"
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">
              Measurable outcomes
            </p>
            <p className="mt-1 text-2xl font-black text-slate-950">
              {report.outcomes.length}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-600">
              SitGuru-checked results only. Your own numbers wait until SitGuru confirms them.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-amber-800">
              Lessons learned
            </p>
            <p className="mt-1 text-2xl font-black text-slate-950">
              {report.lessons.length}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-600">
              What didn’t work is still useful. Put it in the report.
            </p>
          </div>
        </div>
      </article>

      <article className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
        <h3 className="font-black text-slate-950">Business Growth Report draft</h3>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Keep filling this as you go. Don’t wait until week 15 to write it.
        </p>
        <div className="mt-4 space-y-2">
          {report.sections.map((section) => (
            <div
              key={section.id}
              className={`rounded-2xl border px-4 py-3 ${statusTone(
                section.entries.length ? Math.min(100, section.entries.length * 25) : 0,
              )}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-black">{section.label}</p>
                <p className="text-sm font-black">{section.statusLabel}</p>
              </div>
              {section.entries.length ? (
                <ul className="mt-2 space-y-1 text-sm font-semibold">
                  {section.entries.slice(0, 4).map((entry) => (
                    <li key={entry.id}>
                      {section.id === "outcomes" && entry.verified
                        ? `${entry.title}: ${entry.verified}`
                        : section.id === "lessons" && entry.learning
                          ? entry.learning
                          : entry.title}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
        <h3 className="font-black text-slate-950">This week’s build</h3>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          {thisWeek.work}
        </p>
        <p className="mt-2 rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
          Feeds {thisWeek.buildsToward}
        </p>
        {!preview ? (
          <form action={saveWeeklyReview} className="mt-4 space-y-3">
            <input type="hidden" name="internId" value={data.intern.id} />
            <input type="hidden" name="mode" value={mode} />
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                Week of
              </span>
              <input
                name="weekOf"
                type="date"
                required
                className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
              />
            </label>
            <FinalSectionSelect defaultValue={defaultSection} />
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                What did you add or improve this week?
              </span>
              <textarea
                name="contributionAdded"
                required
                rows={3}
                placeholder="What you shipped, who it reached, and what you learned."
                className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-3 text-sm font-semibold text-slate-950"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                What did you finish?
              </span>
              <textarea
                name="accomplished"
                rows={2}
                className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-3 text-sm font-semibold"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                What did the numbers show?
              </span>
              <textarea
                name="dataShowed"
                rows={2}
                className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-3 text-sm font-semibold"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                What didn’t work?
              </span>
              <textarea
                name="didntWork"
                rows={2}
                placeholder="If a test flopped, write it here. That still counts."
                className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-3 text-sm font-semibold"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                What’s next?
              </span>
              <textarea
                name="changingNextWeek"
                rows={2}
                className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-3 text-sm font-semibold"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                Hours this week
              </span>
              <input
                name="hoursLogged"
                type="number"
                step="0.5"
                className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                Your number (SitGuru will check it)
              </span>
              <input
                name="internReportedKpi"
                placeholder="Example: 27 Pet Parent signups"
                className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
              />
            </label>
            {supervisor ? (
              <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-black text-amber-950">
                  Supervisor inclusion review
                </p>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" name="workApproved" /> Weekly work: Approved
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" name="hoursApproved" /> Hours: Approved
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" name="evidenceApproved" /> Evidence: Approved
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" name="contributionApproved" /> Report
                  contribution: Approved for inclusion
                </label>
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                    SitGuru verified KPI
                  </span>
                  <input
                    name="verifiedKpi"
                    placeholder="24 verified Pet Parent registrations"
                    className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 bg-white px-3 text-sm font-semibold"
                  />
                </label>
              </div>
            ) : null}
            <button className={`${internPrimaryBtnClass} w-full`}>
              {supervisor ? "Approve into Business Growth Report" : "Save to your report"}
            </button>
          </form>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            HQ preview is view-only. Interns write the weekly contribution on /intern.
          </p>
        )}
      </article>

      <article className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
        <h3 className="font-black text-slate-950">
          Work SitGuru approved for your report
        </h3>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Finish work → attach proof → SitGuru checks it → it lands in your report.
        </p>
        {included.length ? (
          <div className="mt-4 space-y-3">
            {included.map((block) => (
              <article
                key={block.id}
                className="rounded-2xl border border-slate-100 p-4 text-sm font-semibold text-slate-600"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">
                  {block.kind} · {FINAL_CONTRIBUTION_SECTIONS.find((row) => row.id === block.section)?.label}
                </p>
                <p className="mt-1 font-black text-slate-950">{block.title}</p>
                {block.summary ? <p className="mt-2">{block.summary}</p> : null}
                {block.campaignName ? <p>Campaign: {block.campaignName}</p> : null}
                {block.smartGoal ? <p>SMART Goal: {block.smartGoal}</p> : null}
                {block.internReported ? <p>Intern reported: {block.internReported}</p> : null}
                {block.verified ? <p>SitGuru verified: {block.verified}</p> : null}
                {block.learning ? <p>Learning: {block.learning}</p> : null}
                {block.hoursApproved != null ? (
                  <p>Hours: {block.hoursApproved} approved</p>
                ) : null}
                <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-800">
                  Supervisor: Approved for inclusion
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-2xl border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-500">
            Approved work shows up here. Don’t try to rewrite the whole report at the end.
          </p>
        )}
      </article>
    </section>
  );
}

export type { FinalContributionSectionId };
