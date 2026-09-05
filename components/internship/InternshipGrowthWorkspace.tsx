"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  saveAccessGrant,
  saveExperiment,
  saveInternCampaign,
  saveInternContent,
  saveInternMetric,
  saveInternTask,
  saveScorecard,
  saveSmartGoal,
  saveWeeklyReview,
  verifyInternMetric,
} from "@/lib/internship/actions";
import { ATTRIBUTION_RULE, METRIC_SOURCE_SYSTEMS } from "@/lib/internship/constants";
import {
  contributionLabel,
  internStatusLabel,
  metricSourceLabel,
} from "@/lib/internship/labels";
import {
  INTERN_ACCESS_TOOLS,
  LEARNING_OBJECTIVES,
  MARKET_GROWTH_PROJECT_NAME,
  SMART_CHECKLIST,
  WEEKLY_RHYTHM,
} from "@/lib/internship/playbook";
import { buildInternshipProcess } from "@/lib/internship/process";
import type { InternshipWorkspaceData } from "@/lib/internship/types";
import InternshipTimelineBoard from "@/components/internship/InternshipTimelineBoard";
import InternshipKpiLetterBoard from "@/components/internship/InternshipKpiLetterBoard";
import InternshipAssignmentReview from "@/components/internship/InternshipAssignmentReview";

const TABS = [
  { id: "plan", label: "Plan" },
  { id: "tasks", label: "Tasks" },
  { id: "content", label: "Content" },
  { id: "campaigns", label: "Campaigns" },
  { id: "metrics", label: "Metrics" },
  { id: "review", label: "Review & Grades" },
] as const;

function Input({
  name,
  label,
  type = "text",
  required = false,
  placeholder = "",
  defaultValue = "",
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold text-slate-950"
      />
    </label>
  );
}

export default function InternshipGrowthWorkspace({
  data,
  mode,
  notice,
}: {
  data: InternshipWorkspaceData;
  mode: "intern" | "supervisor";
  notice?: { kind: "ok" | "error"; message: string } | null;
}) {
  const supervisor = mode === "supervisor";
  const process = useMemo(() => buildInternshipProcess(data), [data]);
  const pendingApproval = process.pendingApprovals;
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>(
    supervisor && pendingApproval > 0 ? "review" : "plan",
  );

  return (
    <div className="space-y-5">
      {notice ? (
        <p
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
            notice.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {notice.message}
        </p>
      ) : null}

      <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
              {data.intern.fullName} · {internStatusLabel(data.intern.status)}
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              {data.university?.displayName || "Student institution"}
              {data.intern.academicProgram ? ` — ${data.intern.academicProgram}` : ""}
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              {[
                data.intern.courseCode,
                data.intern.credits != null ? `${data.intern.credits} credits` : "",
                data.intern.requiredHours != null
                  ? `${data.intern.requiredHours} required hours`
                  : "Hours not verified",
                data.intern.pathType.replaceAll("_", " "),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
              Week {process.weekNumber}: {process.deliverable.title} ({process.deliverable.timing})
            </p>
          </div>
          {supervisor ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-800">
              {pendingApproval} awaiting Jason approval
            </span>
          ) : null}
        </div>
        {!data.intern.academicSnapshot?.requirementId ? (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            University requirements have not yet been verified for this student.
            {supervisor ? (
              <>
                {" "}
                <Link
                  href={`/admin/internship/universities/${data.intern.universityId}`}
                  className="font-black underline"
                >
                  Research Requirements
                </Link>
              </>
            ) : null}
          </p>
        ) : null}
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Pending approvals", String(process.pendingApprovals)],
            ["Verified metrics", String(process.verifiedMetrics)],
            ["SMART goals", String(process.smartGoalCount)],
            ["Weekly update", process.weeklyThisWeek ? "Logged" : "Due"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-100 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                {label}
              </p>
              <p className="font-black text-slate-950">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <InternshipKpiLetterBoard data={data} />

      <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:overflow-visible sm:px-0">
        <div className="flex min-w-max flex-wrap gap-2 sm:min-w-0">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`min-h-12 rounded-2xl px-4 text-sm font-black ${
              tab === item.id
                ? "bg-[#0D5C3A] !text-white"
                : "border border-emerald-100 bg-white text-emerald-900"
            }`}
          >
            {item.label}
          </button>
        ))}
        </div>
      </div>

      {tab === "plan" ? (
        <section className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <article className="rounded-[1.5rem] border border-emerald-100 bg-white p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                Shared SitGuru project
              </p>
              <h3 className="mt-1 font-black text-slate-950">
                {MARKET_GROWTH_PROJECT_NAME}
              </h3>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                {process.deliverable.demonstrates}
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm font-semibold text-slate-600">
                {LEARNING_OBJECTIVES.slice(0, 4).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs font-semibold text-slate-500">
                {WEEKLY_RHYTHM[0]} {WEEKLY_RHYTHM[1]}
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-emerald-100 bg-white p-5">
              <h3 className="font-black text-slate-950">SMART goals (synced)</h3>
              {(data.smartGoals || []).length ? (
                data.smartGoals.map((goal) => (
                  <div key={goal.id} className="mt-3 rounded-2xl border border-slate-100 p-3 text-sm font-semibold text-slate-600">
                    <p className="font-black text-slate-950">{goal.specific || "Goal"}</p>
                    <p>M: {goal.measurable || "—"} · T: {goal.timeBound || "—"}</p>
                    <p>
                      {goal.baselineValue || "No baseline"} → {goal.targetValue || "No target"} · {goal.status}
                    </p>
                  </div>
                ))
              ) : (
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  No SMART goals yet. Intern and supervisor see the same goals once saved.
                </p>
              )}
            </article>
            <article className="rounded-[1.5rem] border border-emerald-100 bg-white p-5">
              <h3 className="font-black text-slate-950">Tools & information access</h3>
              <div className="mt-3 space-y-2">
                {INTERN_ACCESS_TOOLS.map((tool) => {
                  const grant = (data.accessGrants || []).find((row) => row.toolKey === tool.key);
                  const granted = grant?.granted === true;
                  return (
                    <div key={tool.key} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2">
                      <div>
                        <p className="text-sm font-black text-slate-950">{tool.name}</p>
                        <p className="text-xs font-semibold text-slate-500">{tool.purpose}</p>
                      </div>
                      {supervisor ? (
                        <form action={saveAccessGrant} className="flex items-center gap-2">
                          <input type="hidden" name="internId" value={data.intern.id} />
                          <input type="hidden" name="toolKey" value={tool.key} />
                          <input type="hidden" name="notes" value={tool.purpose} />
                          <label className="text-xs font-black">
                            <input type="checkbox" name="granted" defaultChecked={granted} /> Access
                          </label>
                          <button className="min-h-9 rounded-xl bg-[#0D5C3A] px-3 text-xs font-black !text-white">
                            Sync
                          </button>
                        </form>
                      ) : (
                        <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${granted ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                          {granted ? "Granted" : "Not granted"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          </div>
          <form
            action={saveSmartGoal}
            className="space-y-3 rounded-[1.5rem] border border-emerald-100 bg-white p-5 lg:col-span-5"
          >
            <h3 className="font-black text-slate-950">Write a SMART goal</h3>
            <input type="hidden" name="internId" value={data.intern.id} />
            <input type="hidden" name="mode" value={mode} />
            {SMART_CHECKLIST.map((item) => (
              <Input
                key={item.letter}
                name={
                  item.letter === "S"
                    ? "specific"
                    : item.letter === "M"
                      ? "measurable"
                      : item.letter === "A"
                        ? "achievable"
                        : item.letter === "R"
                          ? "relevant"
                          : "timeBound"
                }
                label={`${item.letter} — ${item.label}`}
                placeholder={item.prompt}
              />
            ))}
            <Input name="baselineValue" label="Baseline (from SitGuru-controlled source)" />
            <Input name="targetValue" label="Target" />
            <Input name="metricKey" label="Metric key" placeholder="pet_parent_registrations" />
            <button className="min-h-11 w-full rounded-2xl bg-[#0D5C3A] text-sm font-black !text-white">
              Save SMART goal to both portals
            </button>
          </form>
          {process.relevantMilestones.length ? (
            <div className="xl:col-span-12">
              <InternshipTimelineBoard
                milestones={process.relevantMilestones.slice(0, 8)}
                compact
              />
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "tasks" ? (
        <section className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-3">
            {data.tasks.length ? (
              data.tasks.map((task) => (
                <InternshipAssignmentReview
                  key={task.id}
                  internId={data.intern.id}
                  mode={mode}
                  itemType="task"
                  id={task.id}
                  title={task.title}
                  status={task.status}
                  workUrl={task.workUrl}
                  studentNotes={task.studentNotes}
                  supervisorNotes={task.supervisorNotes}
                  employerLetter={task.employerLetter}
                  kpiTier={task.kpiTier}
                  comments={data.comments || []}
                />
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm font-semibold text-slate-500">
                No tasks yet. Add work with a due date, business objective, and metric.
              </p>
            )}
          </div>
          <form
            action={saveInternTask}
            className="lg:col-span-5 space-y-3 rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm"
          >
            <h3 className="font-black text-slate-950">New assignment</h3>
            <input type="hidden" name="internId" value={data.intern.id} />
            <input type="hidden" name="mode" value={mode} />
            <Input name="title" label="Task" required />
            <Input name="dueOn" label="Due date" type="date" />
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                Status
              </span>
              <select
                name="status"
                defaultValue="todo"
                className="mt-1 min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
              >
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="submitted">Submitted</option>
                <option value="blocked">Blocked</option>
              </select>
            </label>
            <Input name="workUrl" label="Link to completed work" />
            <Input name="businessObjective" label="Business objective" />
            <Input name="metricAffected" label="Metric affected" />
            <Input name="studentNotes" label="Student notes" />
            <button className="min-h-11 w-full rounded-2xl bg-[#0D5C3A] text-sm font-black !text-white">
              Save task
            </button>
          </form>
        </section>
      ) : null}

      {tab === "content" ? (
        <section className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-3">
            {data.content.map((item) => (
                <InternshipAssignmentReview
                  key={item.id}
                  internId={data.intern.id}
                  mode={mode}
                  itemType="content"
                  id={item.id}
                  title={item.title}
                  status={item.status}
                  draftUrl={item.draftUrl}
                  publishedUrl={item.publishedUrl}
                  studentNotes={item.studentNotes}
                  supervisorNotes={item.supervisorNotes}
                  employerLetter={item.employerLetter}
                  kpiTier={item.kpiTier}
                  comments={data.comments || []}
                />
              ))}
          </div>
          <form
            action={saveInternContent}
            className="lg:col-span-5 space-y-3 rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm"
          >
            <h3 className="font-black text-slate-950">Log content</h3>
            <input type="hidden" name="internId" value={data.intern.id} />
            <input type="hidden" name="mode" value={mode} />
            <Input name="title" label="Title" required />
            <Input name="platform" label="Platform" placeholder="Instagram, TikTok, blog…" />
            <Input name="draftUrl" label="Draft link" />
            <Input name="publishedUrl" label="Published link" />
            <Input name="studentNotes" label="Notes" />
            <button className="min-h-11 w-full rounded-2xl bg-[#0D5C3A] text-sm font-black !text-white">
              Save content
            </button>
          </form>
        </section>
      ) : null}

      {tab === "campaigns" ? (
        <section className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-3">
            {data.campaigns.map((campaign) => (
              <article
                key={campaign.id}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <h3 className="font-black text-slate-950">{campaign.name}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {campaign.utmSource && campaign.utmCampaign
                    ? `utm_source=${campaign.utmSource}&utm_campaign=${campaign.utmCampaign}`
                    : "Add tracking before counting results"}
                </p>
                {campaign.trackingUrl ? (
                  <p className="mt-2 break-all text-sm font-semibold text-emerald-800">
                    {campaign.trackingUrl}
                  </p>
                ) : null}
                <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                  {campaign.primaryOwnerInternId === data.intern.id
                    ? contributionLabel("primary")
                    : contributionLabel("supporting")}
                </p>
              </article>
            ))}
          </div>
          <form
            action={saveInternCampaign}
            className="lg:col-span-5 space-y-3 rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm"
          >
            <h3 className="font-black text-slate-950">New campaign</h3>
            <input type="hidden" name="internId" value={data.intern.id} />
            <input type="hidden" name="mode" value={mode} />
            <Input name="name" label="Campaign name" required />
            <Input name="utmSource" label="utm_source" placeholder="instagram" />
            <Input name="utmCampaign" label="utm_campaign" placeholder="spring27_growth" />
            <Input name="referralCode" label="Referral / campaign code" />
            <Input name="trackingUrl" label="Tracking URL (optional override)" />
            <Input name="objective" label="Business objective" />
            <p className="text-xs font-semibold leading-5 text-slate-500">
              {ATTRIBUTION_RULE}
            </p>
            <button className="min-h-11 w-full rounded-2xl bg-[#0D5C3A] text-sm font-black !text-white">
              Save campaign
            </button>
          </form>
          <form
            action={saveExperiment}
            className="xl:col-span-12 space-y-3 rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm"
          >
            <h3 className="font-black text-slate-950">Experiment log (synced)</h3>
            <p className="text-sm font-semibold text-slate-500">
              Hypothesis, action, audience, result, lesson, next step. Intern and HQ share this log.
            </p>
            {(data.experiments || []).map((row) => (
              <article key={row.id} className="rounded-2xl border border-slate-100 p-3 text-sm font-semibold text-slate-600">
                <p className="font-black text-slate-950">{row.hypothesis || "Experiment"}</p>
                <p>Action: {row.action || "—"} · Audience: {row.audience || "—"}</p>
                <p>Result: {row.result || "—"} · Lesson: {row.lesson || "—"}</p>
              </article>
            ))}
            <input type="hidden" name="internId" value={data.intern.id} />
            <input type="hidden" name="mode" value={mode} />
            <div className="grid gap-3 md:grid-cols-2">
              <Input name="hypothesis" label="Hypothesis" required />
              <Input name="action" label="Action" />
              <Input name="audience" label="Audience" />
              <Input name="result" label="Result" />
              <Input name="lesson" label="Lesson" />
              <Input name="nextStep" label="Next step" />
            </div>
            <button className="min-h-11 rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white">
              Log experiment
            </button>
          </form>
        </section>
      ) : null}

      {tab === "metrics" ? (
        <section className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-3">
            {data.metrics.map((metric) => (
              <article
                key={metric.id}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div className="flex justify-between gap-2">
                  <h3 className="font-black text-slate-950">{metric.label}</h3>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                      metric.isVerified
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {metric.isVerified ? "Verified" : "Unverified"}
                  </span>
                </div>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {metric.valueNumeric ?? "—"}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  Source: {metricSourceLabel(metric.sourceSystem)}
                  {metric.selfReported ? " · intern-submitted" : ""}
                </p>
                {supervisor && !metric.isVerified ? (
                  <form action={verifyInternMetric} className="mt-3">
                    <input type="hidden" name="internId" value={data.intern.id} />
                    <input type="hidden" name="id" value={metric.id} />
                    <button className="min-h-10 rounded-xl bg-[#0D5C3A] px-3 text-xs font-black !text-white">
                      Verify from SitGuru source
                    </button>
                  </form>
                ) : null}
              </article>
            ))}
            <p className="text-xs font-semibold leading-5 text-slate-500">{ATTRIBUTION_RULE}</p>
          </div>
          <form
            action={saveInternMetric}
            className="lg:col-span-5 space-y-3 rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm"
          >
            <h3 className="font-black text-slate-950">
              {supervisor ? "Record verified metric" : "Submit metric for verification"}
            </h3>
            <input type="hidden" name="internId" value={data.intern.id} />
            <input type="hidden" name="mode" value={mode} />
            <Input name="label" label="Metric" required placeholder="Pet Parent registrations" />
            <Input name="valueNumeric" label="Value" type="number" />
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                Approved source
              </span>
              <select
                name="sourceSystem"
                required
                className="mt-1 min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
              >
                {METRIC_SOURCE_SYSTEMS.map((source) => (
                  <option key={source} value={source}>
                    {metricSourceLabel(source)}
                  </option>
                ))}
              </select>
            </label>
            <Input name="sourceNote" label="Source note / report link" />
            {supervisor ? (
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" name="verify" />
                Mark verified from SitGuru-controlled systems
              </label>
            ) : (
              <p className="text-xs font-semibold text-amber-800">
                Interns can prepare numbers. Attributable results require supervisor
                verification from SitGuru Admin, GA4, social analytics, or another approved source.
              </p>
            )}
            <button className="min-h-11 w-full rounded-2xl bg-[#0D5C3A] text-sm font-black !text-white">
              Save metric
            </button>
          </form>
        </section>
      ) : null}

      {tab === "review" ? (
        <section className="space-y-5">
          <div className="space-y-3">
            <h3 className="font-black text-slate-950">Work awaiting grade</h3>
            {[
              ...data.tasks.filter((row) => row.status === "submitted"),
              ...data.content.filter((row) => row.status === "submitted"),
            ].length ? (
              <div className="space-y-3">
                {data.tasks
                  .filter((row) => row.status === "submitted")
                  .map((task) => (
                    <InternshipAssignmentReview
                      key={`review-task-${task.id}`}
                      internId={data.intern.id}
                      mode={mode}
                      itemType="task"
                      id={task.id}
                      title={task.title}
                      status={task.status}
                      workUrl={task.workUrl}
                      studentNotes={task.studentNotes}
                      supervisorNotes={task.supervisorNotes}
                      employerLetter={task.employerLetter}
                      kpiTier={task.kpiTier}
                      comments={data.comments || []}
                    />
                  ))}
                {data.content
                  .filter((row) => row.status === "submitted")
                  .map((item) => (
                    <InternshipAssignmentReview
                      key={`review-content-${item.id}`}
                      internId={data.intern.id}
                      mode={mode}
                      itemType="content"
                      id={item.id}
                      title={item.title}
                      status={item.status}
                      draftUrl={item.draftUrl}
                      publishedUrl={item.publishedUrl}
                      studentNotes={item.studentNotes}
                      supervisorNotes={item.supervisorNotes}
                      employerLetter={item.employerLetter}
                      kpiTier={item.kpiTier}
                      comments={data.comments || []}
                    />
                  ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-500">
                Nothing is waiting for a letter grade. Interns submit work; Employer HQ grades KPI output, comments, and approves or sends it back.
              </p>
            )}
          </div>
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <h3 className="font-black text-slate-950">Weekly reviews</h3>
            {data.weeklyReviews.map((review) => (
              <article
                key={review.id}
                className="rounded-2xl border border-slate-100 bg-white p-4 text-sm font-semibold text-slate-600"
              >
                <p className="font-black text-slate-950">Week of {review.weekOf}</p>
                <p className="mt-2">Accomplished: {review.accomplished}</p>
                <p>Data: {review.dataShowed}</p>
                <p>Didn’t work: {review.didntWork}</p>
                <p>Next week: {review.changingNextWeek}</p>
                <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-800">
                  {review.upcomingApproved ? "Upcoming work approved" : "Upcoming work pending approval"}
                </p>
              </article>
            ))}
            <form action={saveWeeklyReview} className="space-y-3 rounded-[1.5rem] border border-emerald-100 bg-white p-4">
              <input type="hidden" name="internId" value={data.intern.id} />
              <input type="hidden" name="mode" value={mode} />
              <Input name="weekOf" label="Week of" type="date" required />
              <Input name="accomplished" label="What did you accomplish?" />
              <Input name="dataShowed" label="What did the data show?" />
              <Input name="didntWork" label="What didn’t work?" />
              <Input name="changingNextWeek" label="What are you changing next week?" />
              {supervisor ? (
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" name="upcomingApproved" />
                  Approve upcoming work
                </label>
              ) : null}
              <button className="min-h-11 w-full rounded-2xl bg-[#0D5C3A] text-sm font-black !text-white">
                Save weekly review
              </button>
            </form>
          </div>

          <div className="space-y-3">
            <h3 className="font-black text-slate-950">Biweekly scorecards</h3>
            {data.scorecards.map((card) => (
              <article
                key={card.id}
                className="rounded-2xl border border-slate-100 bg-white p-4 text-sm font-semibold text-slate-600"
              >
                <p className="font-black text-slate-950">
                  {card.periodStart} → {card.periodEnd}
                </p>
                <p className="mt-2">
                  Quality {card.quality}/5 · Communication {card.communication}/5 ·
                  Reliability {card.reliability}/5 · Creativity {card.creativity}/5
                </p>
                <p>
                  Analytics {card.analytics}/5 · Judgment {card.judgment}/5 · Initiative{" "}
                  {card.initiative}/5 · KPI {card.kpiContribution}/5
                </p>
                <p className="mt-2">Strongest: {card.strongestContribution || "—"}</p>
                <p>Improve: {card.improvementRequired || "—"}</p>
              </article>
            ))}
            {supervisor ? (
              <form action={saveScorecard} className="space-y-3 rounded-[1.5rem] border border-emerald-100 bg-white p-4">
                <input type="hidden" name="internId" value={data.intern.id} />
                <div className="grid grid-cols-2 gap-2">
                  <Input name="periodStart" label="Period start" type="date" required />
                  <Input name="periodEnd" label="Period end" type="date" required />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["quality", "Quality"],
                    ["communication", "Communication"],
                    ["reliability", "Reliability"],
                    ["creativity", "Creativity"],
                    ["analytics", "Analytics"],
                    ["judgment", "Judgment"],
                    ["initiative", "Initiative"],
                    ["kpiContribution", "KPI contribution"],
                  ].map(([name, label]) => (
                    <Input key={name} name={name} label={`${label} /5`} type="number" />
                  ))}
                </div>
                <Input name="strongestContribution" label="Strongest contribution this period" />
                <Input name="improvementRequired" label="Improvement required next period" />
                <button className="min-h-11 w-full rounded-2xl bg-[#0D5C3A] text-sm font-black !text-white">
                  Save scorecard
                </button>
              </form>
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-500">
                Scorecards are employer-only. Your supervisor rates quality, reliability,
                and growth contribution every two weeks.
              </p>
            )}
          </div>
        </section>
        </section>
      ) : null}
    </div>
  );
}
