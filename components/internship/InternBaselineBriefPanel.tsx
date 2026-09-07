"use client";

import { useMemo, useState } from "react";
import InternWorkAttachments from "@/components/internship/InternWorkAttachments";
import {
  reviewBaselineBrief,
  saveBaselineBrief,
  saveExperiment,
  saveInternMetric,
  saveSmartGoal,
  submitInternWork,
} from "@/lib/internship/actions";
import {
  BASELINE_ATTACHMENT_CATEGORIES,
  BASELINE_AUDIENCE_FIELDS,
  BASELINE_BRIEF_SECTIONS,
  BASELINE_GROWTH_BRIEF_COMPLETION,
  BASELINE_GROWTH_BRIEF_PURPOSE,
  BASELINE_GROWTH_BRIEF_SUBTITLE,
  BASELINE_GROWTH_TRACKS,
  BASELINE_KPI_TIERS,
  BASELINE_KPI_VANITY_RULE,
  BASELINE_METRIC_FIELDS,
  BASELINE_PII_REMINDER,
  BASELINE_PPT_SLIDES,
  BASELINE_PROJECT_FIELDS,
  BASELINE_SITUATION_FIELDS,
  BASELINE_STATUS_HELP,
  BASELINE_VAGUE_AUDIENCE_HINT,
  SUPERVISOR_REVIEW_EXAMPLE,
  SUPERVISOR_REVIEW_GUIDANCE,
  baselineBriefChecklist,
  baselineBriefReadyPercent,
  baselineBriefReadyToSubmit,
  baselineBriefSubmitBlockers,
  baselineDeliverableLabel,
  baselineDeliverableStatus,
  baselineMetricsFromWorkspace,
  internCanEditBrief,
  parseBaselineBriefPayload,
  type BaselineBriefPayload,
  type BaselineMetricRow,
} from "@/lib/internship/baseline-brief";
import { METRIC_SOURCE_SYSTEMS } from "@/lib/internship/constants";
import { internGhostBtnClass, internPrimaryBtnClass } from "@/lib/internship/intern-ui";
import { metricSourceLabel } from "@/lib/internship/labels";
import type {
  InternshipExperiment,
  InternshipIntern,
  InternshipMetric,
  InternshipSmartGoal,
  InternshipTask,
  InternshipWorkAttachment,
} from "@/lib/internship/types";

function Help({
  meaning,
  example,
  why,
  review,
  feedsReport,
}: {
  meaning: string;
  example?: string;
  why?: string;
  review?: string;
  feedsReport?: string;
}) {
  return (
    <div className="mt-1 space-y-1 text-xs font-semibold leading-5 text-slate-500">
      <p>{meaning}</p>
      {why ? <p>{why}</p> : null}
      {review ? <p>SitGuru will review: {review}</p> : null}
      {feedsReport ? <p className="text-emerald-800">{feedsReport}</p> : null}
      {example ? <p>Example: {example}</p> : null}
    </div>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: { meaning: string; example?: string; why?: string };
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
        {label}
      </span>
      {help ? <Help meaning={help.meaning} example={help.example} why={help.why} /> : null}
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass =
  "min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold text-slate-950";
const areaClass =
  "mt-1 w-full rounded-xl border border-emerald-100 px-3 py-3 text-sm font-semibold text-slate-950";

export default function InternBaselineBriefPanel({
  intern,
  task,
  attachments,
  metrics,
  smartGoals,
  experiments,
  mode,
  preview = false,
}: {
  intern: InternshipIntern;
  task: InternshipTask;
  attachments: InternshipWorkAttachment[];
  metrics: InternshipMetric[];
  smartGoals: InternshipSmartGoal[];
  experiments: InternshipExperiment[];
  mode: "intern" | "supervisor";
  preview?: boolean;
}) {
  const initial = useMemo(
    () => parseBaselineBriefPayload(task.briefPayload),
    [task.briefPayload],
  );
  const [payload, setPayload] = useState<BaselineBriefPayload>(initial);
  const locked = !internCanEditBrief({ intern, payload, taskStatus: task.status });
  const readOnly = preview || locked || mode === "supervisor";
  const status = baselineDeliverableStatus({ task, payload, intern });
  const statusHelp = BASELINE_STATUS_HELP[status] || BASELINE_STATUS_HELP.todo;
  const checklist = baselineBriefChecklist({
    payload,
    attachments,
    taskId: task.id,
    smartGoals,
    experiments,
    metrics,
  });
  const percent = baselineBriefReadyPercent(checklist);
  const blockers = baselineBriefSubmitBlockers(checklist);
  const metricRows = baselineMetricsFromWorkspace(payload, metrics);

  function patch(next: Partial<BaselineBriefPayload>) {
    setPayload((current) => ({ ...current, ...next }));
  }

  function patchProject(key: keyof BaselineBriefPayload["project"], value: string) {
    patch({ project: { ...payload.project, [key]: value } });
  }

  function patchAudience(key: keyof BaselineBriefPayload["audience"], value: string) {
    patch({ audience: { ...payload.audience, [key]: value } });
  }

  function patchSituation(key: keyof BaselineBriefPayload["situation"], value: string) {
    patch({ situation: { ...payload.situation, [key]: value } });
  }

  function addMetricRow() {
    const row: BaselineMetricRow = {
      metricKey: "",
      label: "",
      kpiTier: "tier_1",
      internReportedValue: "",
      verifiedValue: "",
      unit: "",
      periodStart: "",
      periodEnd: "",
      sourceSystem: "registration_records",
      sourceUrl: "",
      capturedOn: "",
      internNotes: "",
      verificationStatus: "draft",
    };
    patch({ metrics: [...metricRows, row] });
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-2xl bg-[#166534] p-4 public-dark-section">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] !text-white">
          {BASELINE_GROWTH_BRIEF_SUBTITLE}
        </p>
        <p className="mt-2 text-sm font-semibold leading-6 !text-white">
          {BASELINE_GROWTH_BRIEF_PURPOSE}
        </p>
        <p className="mt-2 text-xs font-semibold leading-5 !text-white/90">
          {BASELINE_GROWTH_BRIEF_COMPLETION}
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-black text-emerald-900">Ready to Submit {percent}%</p>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-800">
            {baselineDeliverableLabel(status)}
          </p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
          <div className="h-full bg-[#166534]" style={{ width: `${percent}%` }} />
        </div>
        <Help
          meaning={statusHelp.meaning}
          example={statusHelp.example}
        />
        <p className="mt-2 text-xs font-semibold text-slate-600">
          {BASELINE_STATUS_HELP.draft.meaning} {BASELINE_STATUS_HELP.approved.meaning}{" "}
          {BASELINE_STATUS_HELP.locked.meaning}
        </p>
      </div>

      <div className="space-y-3">
        {BASELINE_ATTACHMENT_CATEGORIES.map((area) => (
          <div key={area.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
              {area.label}
            </p>
            <Help meaning={area.meaning} why={area.why} example={area.example} />
            <InternWorkAttachments
              internId={intern.id}
              itemType="task"
              itemId={task.id}
              attachments={attachments}
              mode={mode}
              preview={readOnly}
              label={`${area.label} files`}
              category={area.id}
              accept={area.accept}
              emptyCopy={area.emptyCopy}
            />
          </div>
        ))}
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-900">
          {BASELINE_PII_REMINDER} Bookings stay on SitGuru.
        </p>
      </div>

      <details className="rounded-2xl border border-emerald-100 bg-white px-4 py-3" open>
        <summary className="min-h-11 cursor-pointer font-black text-slate-950">
          Recommended 10-slide presentation
        </summary>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
          This is guidance, not a slide builder. Use it so SitGuru can follow the same story as the written brief.
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm font-semibold text-slate-700">
          {BASELINE_PPT_SLIDES.map((slide) => (
            <li key={slide}>{slide}</li>
          ))}
        </ol>
      </details>

      {BASELINE_BRIEF_SECTIONS.filter((section) => section.id === "project").map((section) => (
        <details key={section.id} className="rounded-2xl border border-emerald-100 bg-white px-4 py-3" open>
          <summary className="min-h-11 cursor-pointer font-black text-slate-950">
            {section.title}
          </summary>
          <Help meaning={section.meaning} review={section.review} feedsReport={section.feedsReport} />
          <div className="mt-3 grid gap-3">
            <Field label={BASELINE_PROJECT_FIELDS[0].label} help={BASELINE_PROJECT_FIELDS[0]}>
              <input
                className={inputClass}
                value={payload.project.name}
                disabled={readOnly}
                onChange={(event) => patchProject("name", event.target.value)}
              />
            </Field>
            <Field label={BASELINE_PROJECT_FIELDS[1].label} help={BASELINE_PROJECT_FIELDS[1]}>
              <select
                className={inputClass}
                value={payload.project.growthTrack}
                disabled={readOnly}
                onChange={(event) => patchProject("growthTrack", event.target.value)}
              >
                <option value="">Pick the primary growth track</option>
                {BASELINE_GROWTH_TRACKS.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={BASELINE_PROJECT_FIELDS[2].label} help={BASELINE_PROJECT_FIELDS[2]}>
              <input
                className={inputClass}
                value={payload.project.assignedMarket}
                disabled={readOnly}
                onChange={(event) => patchProject("assignedMarket", event.target.value)}
              />
            </Field>
            <Field label={BASELINE_PROJECT_FIELDS[3].label} help={BASELINE_PROJECT_FIELDS[3]}>
              <input
                className={inputClass}
                value={payload.project.geographicBoundaries}
                disabled={readOnly}
                onChange={(event) => patchProject("geographicBoundaries", event.target.value)}
              />
            </Field>
            <Field label={BASELINE_PROJECT_FIELDS[4].label} help={BASELINE_PROJECT_FIELDS[4]}>
              <textarea
                className={areaClass}
                rows={3}
                value={payload.project.businessObjective}
                disabled={readOnly}
                onChange={(event) => patchProject("businessObjective", event.target.value)}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={BASELINE_PROJECT_FIELDS[5].label} help={BASELINE_PROJECT_FIELDS[5]}>
                <input
                  type="date"
                  className={inputClass}
                  value={payload.project.projectStartDate}
                  disabled={readOnly}
                  onChange={(event) => patchProject("projectStartDate", event.target.value)}
                />
              </Field>
              <Field label={BASELINE_PROJECT_FIELDS[6].label} help={BASELINE_PROJECT_FIELDS[6]}>
                <input
                  className={inputClass}
                  value={payload.project.baselineMeasurementRange}
                  disabled={readOnly}
                  onChange={(event) => patchProject("baselineMeasurementRange", event.target.value)}
                />
              </Field>
            </div>
          </div>
        </details>
      ))}

      <details className="rounded-2xl border border-emerald-100 bg-white px-4 py-3" open>
        <summary className="min-h-11 cursor-pointer font-black text-slate-950">
          {BASELINE_BRIEF_SECTIONS[1].title}
        </summary>
        <Help
          meaning={BASELINE_BRIEF_SECTIONS[1].meaning}
          review={BASELINE_BRIEF_SECTIONS[1].review}
          feedsReport={BASELINE_BRIEF_SECTIONS[1].feedsReport}
        />
        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
          {BASELINE_KPI_VANITY_RULE} {BASELINE_KPI_TIERS.map((tier) => `${tier.label}: ${tier.meaning}`).join(" ")}
        </p>
        <div className="mt-3 space-y-3">
          {metricRows.map((row, index) => (
            <div key={`${row.metricKey}-${index}`} className="grid gap-2 rounded-2xl border border-slate-100 p-3">
              <Field label={BASELINE_METRIC_FIELDS[0].label} help={BASELINE_METRIC_FIELDS[0]}>
                <input
                  className={inputClass}
                  value={row.label}
                  disabled={readOnly}
                  onChange={(event) => {
                    const next = metricRows.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, label: event.target.value } : item,
                    );
                    patch({ metrics: next });
                  }}
                />
              </Field>
              <Field label={BASELINE_METRIC_FIELDS[1].label} help={BASELINE_METRIC_FIELDS[1]}>
                <select
                  className={inputClass}
                  value={row.kpiTier}
                  disabled={readOnly}
                  onChange={(event) => {
                    const next = metricRows.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, kpiTier: event.target.value } : item,
                    );
                    patch({ metrics: next });
                  }}
                >
                  {BASELINE_KPI_TIERS.map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      {tier.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Baseline value (intern-reported)" help={BASELINE_METRIC_FIELDS[2]}>
                  <input
                    className={inputClass}
                    value={row.internReportedValue}
                    disabled={readOnly}
                    onChange={(event) => {
                      const next = metricRows.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, internReportedValue: event.target.value } : item,
                      );
                      patch({ metrics: next });
                    }}
                  />
                </Field>
                <Field label="Employer-verified value" help={BASELINE_METRIC_FIELDS[3]}>
                  <input
                    className={inputClass}
                    value={row.verifiedValue}
                    disabled={mode !== "supervisor" || preview}
                    readOnly={mode !== "supervisor"}
                  />
                </Field>
              </div>
              <Field label={BASELINE_METRIC_FIELDS[5].label} help={BASELINE_METRIC_FIELDS[6]}>
                <select
                  className={inputClass}
                  value={row.sourceSystem}
                  disabled={readOnly}
                  onChange={(event) => {
                    const next = metricRows.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, sourceSystem: event.target.value } : item,
                    );
                    patch({ metrics: next });
                  }}
                >
                  {METRIC_SOURCE_SYSTEMS.map((source) => (
                    <option key={source} value={source}>
                      {metricSourceLabel(source)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={BASELINE_METRIC_FIELDS[9].label} help={BASELINE_METRIC_FIELDS[9]}>
                <textarea
                  className={areaClass}
                  rows={2}
                  value={row.internNotes}
                  disabled={readOnly}
                  onChange={(event) => {
                    const next = metricRows.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, internNotes: event.target.value } : item,
                    );
                    patch({ metrics: next });
                  }}
                />
              </Field>
              <p className="text-xs font-semibold text-slate-500">
                Status: {BASELINE_STATUS_HELP[row.verificationStatus]?.label || row.verificationStatus}.{" "}
                {BASELINE_STATUS_HELP.intern_reported.meaning}
              </p>
            </div>
          ))}
          {!readOnly ? (
            <button type="button" className={internGhostBtnClass} onClick={addMetricRow}>
              Add a baseline metric
            </button>
          ) : null}
        </div>
      </details>

      <details className="rounded-2xl border border-emerald-100 bg-white px-4 py-3">
        <summary className="min-h-11 cursor-pointer font-black text-slate-950">
          {BASELINE_BRIEF_SECTIONS[2].title}
        </summary>
        <Help
          meaning={BASELINE_BRIEF_SECTIONS[2].meaning}
          review={BASELINE_BRIEF_SECTIONS[2].review}
          feedsReport={BASELINE_BRIEF_SECTIONS[2].feedsReport}
        />
        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
          {BASELINE_VAGUE_AUDIENCE_HINT}
        </p>
        <div className="mt-3 grid gap-3">
          {(
            [
              ["primary", BASELINE_AUDIENCE_FIELDS[0]],
              ["secondary", BASELINE_AUDIENCE_FIELDS[1]],
              ["geo", BASELINE_AUDIENCE_FIELDS[2]],
              ["problemNeed", BASELINE_AUDIENCE_FIELDS[3]],
              ["alternative", BASELINE_AUDIENCE_FIELDS[4]],
              ["whySitguru", BASELINE_AUDIENCE_FIELDS[5]],
              ["whereReached", BASELINE_AUDIENCE_FIELDS[6]],
              ["conversionBarrier", BASELINE_AUDIENCE_FIELDS[7]],
              ["evidence", BASELINE_AUDIENCE_FIELDS[8]],
            ] as const
          ).map(([key, help]) => (
            <Field key={key} label={help.label} help={help}>
              <textarea
                className={areaClass}
                rows={2}
                value={payload.audience[key]}
                disabled={readOnly}
                onChange={(event) => patchAudience(key, event.target.value)}
              />
            </Field>
          ))}
        </div>
      </details>

      <details className="rounded-2xl border border-emerald-100 bg-white px-4 py-3">
        <summary className="min-h-11 cursor-pointer font-black text-slate-950">
          {BASELINE_BRIEF_SECTIONS[3].title}
        </summary>
        <Help
          meaning={BASELINE_BRIEF_SECTIONS[3].meaning}
          review={BASELINE_BRIEF_SECTIONS[3].review}
          feedsReport={BASELINE_BRIEF_SECTIONS[3].feedsReport}
        />
        <div className="mt-3 grid gap-3">
          {(
            [
              ["current", BASELINE_SITUATION_FIELDS[0]],
              ["working", BASELINE_SITUATION_FIELDS[1]],
              ["weak", BASELINE_SITUATION_FIELDS[2]],
              ["missing", BASELINE_SITUATION_FIELDS[3]],
              ["channels", BASELINE_SITUATION_FIELDS[4]],
              ["messaging", BASELINE_SITUATION_FIELDS[5]],
              ["conversionGaps", BASELINE_SITUATION_FIELDS[6]],
              ["competitive", BASELINE_SITUATION_FIELDS[7]],
              ["community", BASELINE_SITUATION_FIELDS[8]],
            ] as const
          ).map(([key, help]) => (
            <Field key={key} label={help.label} help={help}>
              <textarea
                className={areaClass}
                rows={2}
                value={payload.situation[key]}
                disabled={readOnly}
                onChange={(event) => patchSituation(key, event.target.value)}
              />
            </Field>
          ))}
        </div>
      </details>

      <details className="rounded-2xl border border-emerald-100 bg-white px-4 py-3">
        <summary className="min-h-11 cursor-pointer font-black text-slate-950">
          {BASELINE_BRIEF_SECTIONS[4].title}
        </summary>
        <Help
          meaning={BASELINE_BRIEF_SECTIONS[4].meaning}
          review={BASELINE_BRIEF_SECTIONS[4].review}
          feedsReport={BASELINE_BRIEF_SECTIONS[4].feedsReport}
        />
        <div className="mt-3 space-y-3">
          {payload.risks.map((row, index) => (
            <div key={`risk-${index}`} className="grid gap-2 rounded-2xl border border-slate-100 p-3">
              <Field label={`Risk ${index + 1}`}>
                <input
                  className={inputClass}
                  value={row.risk}
                  disabled={readOnly}
                  onChange={(event) => {
                    const risks = payload.risks.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, risk: event.target.value } : item,
                    );
                    patch({ risks });
                  }}
                />
              </Field>
              <Field label="Evidence">
                <input
                  className={inputClass}
                  value={row.evidence}
                  disabled={readOnly}
                  onChange={(event) => {
                    const risks = payload.risks.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, evidence: event.target.value } : item,
                    );
                    patch({ risks });
                  }}
                />
              </Field>
              <Field label="Impact">
                <input
                  className={inputClass}
                  value={row.impact}
                  disabled={readOnly}
                  onChange={(event) => {
                    const risks = payload.risks.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, impact: event.target.value } : item,
                    );
                    patch({ risks });
                  }}
                />
              </Field>
              <Field label="Mitigation">
                <input
                  className={inputClass}
                  value={row.mitigation}
                  disabled={readOnly}
                  onChange={(event) => {
                    const risks = payload.risks.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, mitigation: event.target.value } : item,
                    );
                    patch({ risks });
                  }}
                />
              </Field>
            </div>
          ))}
        </div>
      </details>

      <details className="rounded-2xl border border-emerald-100 bg-white px-4 py-3">
        <summary className="min-h-11 cursor-pointer font-black text-slate-950">
          {BASELINE_BRIEF_SECTIONS[5].title}
        </summary>
        <Help
          meaning={BASELINE_BRIEF_SECTIONS[5].meaning}
          review={BASELINE_BRIEF_SECTIONS[5].review}
          feedsReport={BASELINE_BRIEF_SECTIONS[5].feedsReport}
        />
        <div className="mt-3 space-y-3">
          {payload.opportunities.map((row, index) => (
            <div key={`opp-${index}`} className="grid gap-2 rounded-2xl border border-slate-100 p-3">
              <Field label={`Opportunity ${index + 1}`}>
                <input
                  className={inputClass}
                  value={row.opportunity}
                  disabled={readOnly}
                  onChange={(event) => {
                    const opportunities = payload.opportunities.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, opportunity: event.target.value } : item,
                    );
                    patch({ opportunities });
                  }}
                />
              </Field>
              <Field label="Recommended test">
                <input
                  className={inputClass}
                  value={row.recommendedTest}
                  disabled={readOnly}
                  onChange={(event) => {
                    const opportunities = payload.opportunities.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, recommendedTest: event.target.value } : item,
                    );
                    patch({ opportunities });
                  }}
                />
              </Field>
              <Field label="Priority">
                <select
                  className={inputClass}
                  value={row.priority}
                  disabled={readOnly}
                  onChange={(event) => {
                    const opportunities = payload.opportunities.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, priority: event.target.value as typeof row.priority }
                        : item,
                    );
                    patch({ opportunities });
                  }}
                >
                  <option value="">Choose</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </Field>
            </div>
          ))}
        </div>
      </details>

      <details className="rounded-2xl border border-emerald-100 bg-white px-4 py-3">
        <summary className="min-h-11 cursor-pointer font-black text-slate-950">
          {BASELINE_BRIEF_SECTIONS[6].title}
        </summary>
        <Help
          meaning={BASELINE_BRIEF_SECTIONS[6].meaning}
          review={BASELINE_BRIEF_SECTIONS[6].review}
          feedsReport={BASELINE_BRIEF_SECTIONS[6].feedsReport}
        />
        {smartGoals.length ? (
          <ul className="mt-3 space-y-2">
            {smartGoals.map((goal) => (
              <li key={goal.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                {goal.specific} · {goal.baselineValue || "—"} → {goal.targetValue || "—"} ·{" "}
                {goal.status.replaceAll("_", " ")}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs font-semibold text-slate-500">
            No SMART goal yet. Propose one below. It stays Draft until SitGuru approves it.
          </p>
        )}
        {!readOnly ? (
          <form action={saveSmartGoal} className="mt-3 grid gap-3">
            <input type="hidden" name="internId" value={intern.id} />
            <input type="hidden" name="mode" value={mode} />
            <Field label="Specific" help={{ meaning: "What exactly will change, for whom, in this market." }}>
              <input name="specific" required className={inputClass} />
            </Field>
            <Field label="Measurable" help={{ meaning: "The number SitGuru can check from an approved source." }}>
              <input name="measurable" required className={inputClass} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Baseline" help={{ meaning: "Starting number. Intern-reported until SitGuru verifies it." }}>
                <input name="baselineValue" className={inputClass} />
              </Field>
              <Field label="Target" help={{ meaning: "The number you are aiming for by the date below." }}>
                <input name="targetValue" required className={inputClass} />
              </Field>
            </div>
            <Field label="Time-bound" help={{ meaning: "When SitGuru should be able to check the result." }}>
              <input name="timeBound" required className={inputClass} />
            </Field>
            <Field label="Relevant" help={{ meaning: "Why this goal matches your growth track." }}>
              <input name="relevant" className={inputClass} />
            </Field>
            <Field label="Achievable" help={{ meaning: "Why this is realistic in one semester." }}>
              <input name="achievable" className={inputClass} />
            </Field>
            <button className={internGhostBtnClass}>Save SMART goal as Draft</button>
          </form>
        ) : null}
      </details>

      <details className="rounded-2xl border border-emerald-100 bg-white px-4 py-3">
        <summary className="min-h-11 cursor-pointer font-black text-slate-950">
          {BASELINE_BRIEF_SECTIONS[7].title}
        </summary>
        <Help
          meaning={BASELINE_BRIEF_SECTIONS[7].meaning}
          review={BASELINE_BRIEF_SECTIONS[7].review}
          feedsReport={BASELINE_BRIEF_SECTIONS[7].feedsReport}
        />
        {experiments.length ? (
          <ul className="mt-3 space-y-2">
            {experiments.map((row) => (
              <li key={row.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                {row.hypothesis || row.action}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs font-semibold text-slate-500">
            Log 1–3 first tests. Hypothesis → action → measurement → success threshold.
          </p>
        )}
        {!readOnly ? (
          <form action={saveExperiment} className="mt-3 grid gap-3">
            <input type="hidden" name="internId" value={intern.id} />
            <input type="hidden" name="mode" value={mode} />
            <Field label="Hypothesis" help={{ meaning: "If we do X for this audience, Y will happen." }}>
              <textarea name="hypothesis" required rows={2} className={areaClass} />
            </Field>
            <Field label="Action" help={{ meaning: "The one change you will make." }}>
              <textarea name="action" required rows={2} className={areaClass} />
            </Field>
            <Field label="Audience" help={{ meaning: "Who this test is for. Be specific." }}>
              <input name="audience" className={inputClass} />
            </Field>
            <Field
              label="Next step / success threshold"
              help={{ meaning: "How you will know it worked, and what you will do next if it misses." }}
            >
              <input name="nextStep" className={inputClass} />
            </Field>
            <button className={internGhostBtnClass}>Save experiment</button>
          </form>
        ) : null}
      </details>

      {!preview && !locked ? (
        <form action={saveBaselineBrief} className="grid gap-3">
          <input type="hidden" name="internId" value={intern.id} />
          <input type="hidden" name="mode" value={mode} />
          <input type="hidden" name="itemType" value="task" />
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="briefPayload" value={JSON.stringify(payload)} />
          {mode === "intern" ? (
            <>
              <Field
                label="Supervisor review requested"
                help={{
                  meaning: SUPERVISOR_REVIEW_GUIDANCE,
                  example: SUPERVISOR_REVIEW_EXAMPLE,
                }}
              >
                <textarea
                  name="supervisorReviewRequested"
                  required
                  rows={4}
                  value={payload.supervisorReviewRequested}
                  onChange={(event) => patch({ supervisorReviewRequested: event.target.value })}
                  className={areaClass}
                />
              </Field>
              <Field
                label="Link to completed work"
                help={{
                  meaning: "Optional Drive, Canva, or Doc link SitGuru can open. Files above are still required.",
                }}
              >
                <input name="workUrl" defaultValue={task.workUrl || ""} className={inputClass} />
              </Field>
              <Field
                label="Note to supervisor"
                help={{ meaning: "Optional extra context, or what you changed after a send-back." }}
              >
                <input name="internComment" placeholder="Optional" className={inputClass} />
              </Field>
              {!baselineBriefReadyToSubmit(checklist) ? (
                <ul className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                  {blockers.map((row) => (
                    <li key={row}>{row}</li>
                  ))}
                </ul>
              ) : null}
              <button className={internGhostBtnClass}>Save draft</button>
              <button formAction={submitInternWork} className={`${internPrimaryBtnClass} w-full`}>
                {task.status === "submitted" || task.status === "revision_requested"
                  ? "Send it back for review"
                  : "Send to SitGuru for review"}
              </button>
            </>
          ) : (
            <button className={internPrimaryBtnClass}>Save brief notes</button>
          )}
        </form>
      ) : null}

      {mode === "supervisor" && !preview ? (
        <form action={reviewBaselineBrief} className="grid gap-3 rounded-2xl border border-emerald-100 p-4">
          <input type="hidden" name="internId" value={intern.id} />
          <input type="hidden" name="id" value={task.id} />
          <p className="text-sm font-semibold leading-5 text-slate-600">
            Approve the brief only when the written brief, presentation, required fields, baseline
            review, and SMART goals are addressed. Hours approval is a different decision.
          </p>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
              Section comments
            </span>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Tell the intern what to fix by section. This is not a university grade.
            </p>
            <textarea
              name="comments"
              rows={4}
              className={areaClass}
              placeholder="Project is clear. Verify the registration baseline before lock. Audience is still too broad."
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-3">
            <button name="decision" value="approved" className={`${internPrimaryBtnClass} w-full`}>
              Approve brief
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
              value="lock"
              className="min-h-12 rounded-2xl border border-emerald-200 bg-emerald-50 text-sm font-black text-emerald-900"
            >
              Lock baseline
            </button>
          </div>
        </form>
      ) : null}
      {mode === "intern" && !readOnly ? (
        <form action={saveInternMetric} className="hidden">
          <input type="hidden" name="internId" value={intern.id} />
        </form>
      ) : null}
    </div>
  );
}
