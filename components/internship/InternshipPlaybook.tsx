import {
  ATTRIBUTION_TOOLS,
  COMPLIANCE_CONTROLS,
  HOURS_RULE,
  ILLUSTRATIVE_TARGETS,
  INFORMATION_ACCESS_CONTROLS,
  INTERN_ACCESS_TOOLS,
  LEARNING_OBJECTIVES,
  MARKET_GROWTH_PROJECT_NAME,
  MARKET_GROWTH_PROJECT_STATEMENT,
  MEASUREMENT_HIERARCHY,
  SEMESTER_DELIVERABLES,
  SMART_CHECKLIST,
  SMART_RULE,
  SUCCESS_DEFINITION,
  SUPERVISION_CONTROLS,
  WEEKLY_RHYTHM,
} from "@/lib/internship/playbook";
import { ATTRIBUTION_RULE } from "@/lib/internship/constants";
import { ThemeStatCard } from "@/components/sitguru/ThemeStatCard";
import { KPI_LETTER_RUBRIC, rubricTrend } from "@/lib/internship/grading";

export default function InternshipPlaybook() {
  return (
    <div className="space-y-5">
      <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
          SitGuru Market Growth Project
        </p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">
          {MARKET_GROWTH_PROJECT_NAME}
        </h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          {MARKET_GROWTH_PROJECT_STATEMENT}
        </p>
        <p className="mt-3 text-sm font-semibold text-amber-800">{HOURS_RULE}</p>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[1.5rem] border border-emerald-100 bg-white p-5">
          <h3 className="font-black text-slate-950">Learning objectives</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm font-semibold text-slate-600">
            {LEARNING_OBJECTIVES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </article>
        <article className="rounded-[1.5rem] border border-emerald-100 bg-white p-5">
          <h3 className="font-black text-slate-950">Weekly rhythm</h3>
          <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-600">
            {WEEKLY_RHYTHM.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-semibold text-slate-500">{SMART_RULE}</p>
        </article>
      </section>

      <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5">
        <h3 className="font-black text-slate-950">Semester deliverables</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {SEMESTER_DELIVERABLES.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-100 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                {item.timing}
              </p>
              <p className="mt-1 font-black text-slate-950">{item.title}</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                {item.demonstrates}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[1.5rem] border border-emerald-100 bg-white p-5">
          <h3 className="font-black text-slate-950">Measurement hierarchy</h3>
          <div className="mt-3 space-y-3">
            {MEASUREMENT_HIERARCHY.map((row) => (
              <div key={row.tier}>
                <p className="font-black text-slate-950">{row.tier}</p>
                <p className="text-sm font-semibold text-slate-600">{row.evidence}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-[1.5rem] border border-emerald-100 bg-white p-5">
          <h3 className="font-black text-slate-950">
            Illustrative semester targets
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Finalize after the first two weeks of baseline analysis. These are
            planning ranges, not promises.
          </p>
          <div className="mt-3 space-y-3">
            {ILLUSTRATIVE_TARGETS.map((row) => (
              <div key={row.metric}>
                <p className="font-black text-slate-950">
                  {row.metric}{" "}
                  <span className="text-xs font-semibold text-slate-400">
                    {row.role}
                  </span>
                </p>
                <p className="text-sm font-semibold text-slate-600">
                  {row.planningTarget}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5">
        <h3 className="font-black text-slate-950">KPI letter grades</h3>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Employer evaluation versus SMART targets. SitGuru green up-arrows mean
          the verified KPI is at or above target. Rose down-arrows mean it is short.
          This is not the university’s official course grade.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {KPI_LETTER_RUBRIC.map((row) => (
            <ThemeStatCard
              key={row.letter}
              label={`Letter ${row.letter}`}
              value={row.letter}
              helper={row.meaning}
              tone={row.tone}
              trend={rubricTrend(row.letter)}
              trendTitle="vs 100% of target"
            />
          ))}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5">
        <h3 className="font-black text-slate-950">Attribution tools</h3>
        <p className="mt-2 text-sm font-semibold text-slate-600">{ATTRIBUTION_RULE}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm font-semibold text-slate-600">
          {ATTRIBUTION_TOOLS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5">
        <h3 className="font-black text-slate-950">S.M.A.R.T. goal design</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {SMART_CHECKLIST.map((item) => (
            <div key={item.letter} className="rounded-2xl bg-emerald-50 p-3">
              <p className="text-2xl font-black text-emerald-900">{item.letter}</p>
              <p className="font-black text-slate-950">{item.label}</p>
              <p className="mt-2 text-xs font-semibold text-slate-600">{item.prompt}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-[1.5rem] border border-emerald-100 bg-white p-5">
          <h3 className="font-black text-slate-950">Supervision</h3>
          <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-600">
            {SUPERVISION_CONTROLS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="rounded-[1.5rem] border border-emerald-100 bg-white p-5">
          <h3 className="font-black text-slate-950">Compliance & risk</h3>
          <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-600">
            {COMPLIANCE_CONTROLS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="rounded-[1.5rem] border border-emerald-100 bg-white p-5">
          <h3 className="font-black text-slate-950">Information access</h3>
          <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-600">
            {INFORMATION_ACCESS_CONTROLS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-emerald-800">
            Candidate tools
          </p>
          <ul className="mt-2 space-y-1 text-sm font-semibold text-slate-600">
            {INTERN_ACCESS_TOOLS.map((tool) => (
              <li key={tool.key}>
                {tool.name} · {tool.access}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5">
        <h3 className="font-black text-slate-950">Pilot success definition</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {SUCCESS_DEFINITION.map((row) => (
            <div key={row.area} className="rounded-2xl border border-slate-100 p-4">
              <p className="font-black text-slate-950">{row.area}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{row.definition}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
