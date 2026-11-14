import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  ClipboardCheck,
  FileChartColumn,
  GraduationCap,
  ListChecks,
  LockKeyhole,
  Presentation,
  Users,
} from "lucide-react";
import {
  BA495A_EXAMPLE,
  SYLLABUS_ACADEMIC_FIELDS,
  SYLLABUS_ASSESSMENT,
  SYLLABUS_CORE_DELIVERABLES,
  SYLLABUS_GUIDELINES,
  SYLLABUS_PHASES,
  SYLLABUS_WORKFLOW,
} from "@/lib/internship/university-syllabus";
import type { InternshipIntern } from "@/lib/internship/types";
import { syllabusAcademicPlanSummary } from "@/lib/internship/university-syllabus";

export type SyllabusAcademicRow = Pick<
  InternshipIntern,
  "id" | "fullName" | "courseCode" | "credits" | "requiredHours" | "internshipWeeks" | "universityVerificationStatus"
> & { universityName: string };

const jumpLinks = [
  { label: "Overview", href: "#program-overview" },
  { label: "Roadmap", href: "#program-roadmap" },
  { label: "Deliverables", href: "#program-deliverables" },
  { label: "Academic rules", href: "#program-academic" },
  { label: "Workflows", href: "#program-workflow" },
  { label: "Assessment", href: "#program-assessment" },
  { label: "Full syllabus", href: "#program-full" },
] as const;

const quickLinks = [
  { title: "Assignment center", description: "Ava creates tasks and reviews submissions", href: "/manager/assignments", icon: ListChecks },
  { title: "Intern assignments", description: "Each student completes their assigned work", href: "/intern/assignments", icon: ClipboardCheck },
  { title: "Intern calendar", description: "Due dates appear from the assigned task", href: "/intern/calendar", icon: CalendarDays },
  { title: "University directory", description: "Institution-specific requirements and approvals", href: "/admin/internship/universities", icon: GraduationCap },
] as const;

const section = "scroll-mt-24 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7";
const kicker = "text-xs font-black uppercase tracking-[0.15em] text-[#167251]";

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className={kicker}>{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{subtitle}</p>
    </div>
  );
}

/** Read-only syllabus companion. Admins manage individual academic records separately. */
export default function InternshipSyllabusEnhancements({
  academicRows,
  cohortName,
}: {
  academicRows: SyllabusAcademicRow[];
  cohortName: string;
}) {
  return (
    <div className="space-y-5">
      <header id="program-overview" className="scroll-mt-24 overflow-hidden rounded-[1.7rem] border border-[#10374D] bg-[#102D41] text-white shadow-lg">
        <div className="relative grid gap-6 px-5 py-7 sm:px-8 sm:py-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.19em] text-emerald-200">
              SitGuru · {cohortName} · Program standard
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-black tracking-tight text-white sm:text-4xl">
              Social Media & Community Growth Internship Syllabus
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-100 sm:text-base">
              Real assignments. Research-led marketing. Measurable community outcomes.
              One supervised educational framework that welcomes students from any approved university.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/admin/internship" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-xs font-black text-[#102D41] hover:bg-emerald-50">
                Internship command center <ArrowRight size={15} />
              </Link>
              <Link href="/admin/internship/universities" className="inline-flex min-h-11 items-center rounded-full border border-emerald-300/70 px-4 text-xs font-black text-white hover:bg-white/10">
                Configure academic requirements
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 self-end">
            {[
              { value: "1", label: "Employer-led standard" },
              { value: "10", label: "Evidence categories" },
              { value: "5", label: "15-week model phases" },
              { value: "Any", label: "Approved university" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/20 bg-white/10 p-4">
                <p className="text-2xl font-black text-emerald-200">{stat.value}</p>
                <p className="mt-1 text-xs font-semibold leading-4 text-slate-100">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <nav aria-label="Syllabus sections" className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3">
        {jumpLinks.map((item) => (
          <a key={item.href} href={item.href} className="inline-flex min-h-10 items-center rounded-full bg-slate-100 px-4 text-xs font-black text-slate-700 hover:bg-emerald-100 hover:text-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
            {item.label}
          </a>
        ))}
      </nav>

      <section className={section}>
        <SectionHeader
          eyebrow="Program charter"
          title="One SitGuru syllabus. Individual university agreements."
          subtitle="The business owns learning activities, supervision, evidence quality and the Market Growth Project. Each institution controls its student's academic requirements and credit decision."
        />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            {
              title: "Program & purpose",
              value: "Social Media & Community Growth Intern",
              description: "A supervised, primarily remote, project-based experience building research, content, community outreach, analytics, and professional judgment.",
              icon: BookOpenText,
            },
            {
              title: "Day-to-day management",
              value: "Ava Venezia",
              description: "Creates and reviews assignments, coordinates campaigns, supports students, and gives actionable feedback.",
              icon: Users,
            },
            {
              title: "Site supervision",
              value: "Jason L. Graff",
              description: "Founder & CEO; oversees employer evaluations, approved results, final presentations, and university coordination unless another supervisor is assigned.",
              icon: ClipboardCheck,
            },
          ].map(({ title, value, description, icon: Icon }) => (
            <article key={title} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <Icon size={20} className="text-[#167251]" aria-hidden="true" />
              <p className="mt-3 text-xs font-black uppercase tracking-wider text-slate-500">{title}</p>
              <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="program-roadmap" className={section}>
        <SectionHeader
          eyebrow="Roadmap"
          title="A semester that builds toward one useful final product"
          subtitle="This is SitGuru's example 15-week roadmap. It can be shortened or extended to match an approved academic term without changing the core learning outcomes."
        />
        <div className="mt-5 grid gap-3 lg:grid-cols-5">
          {SYLLABUS_PHASES.map((phase, index) => (
            <article key={phase.label} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-[#0D5C3A] px-3 py-1 text-[11px] font-black text-white">{phase.label}</span>
                <span className="text-xs font-black text-slate-400">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-3 text-base font-black text-slate-950">{phase.title}</h3>
              <p className="mt-2 text-xs font-medium leading-5 text-slate-600">{phase.description}</p>
              <p className="mt-3 border-t border-slate-200 pt-3 text-xs font-black text-[#0D5C3A]">{phase.output}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="program-deliverables" className={section}>
        <SectionHeader
          eyebrow="Measurable student work"
          title="Ten deliverable categories with clear evidence"
          subtitle="These categories incorporate the work outlined in the Penn State BA 495A proposal and apply across universities. Example quantities are starting points for each student's approved learning plan—not blanket requirements."
        />
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {SYLLABUS_CORE_DELIVERABLES.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-emerald-200">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-sm font-black text-[#0D5C3A]">{item.letter}</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">{item.phase}</p>
                  <h3 className="mt-1 text-base font-black text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{item.objective}</p>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-slate-50 px-3 py-3">
                <p className="text-[10px] font-black uppercase text-slate-500">Evidence to submit</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">{item.evidence}</p>
              </div>
              <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{item.model}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="program-academic" className={section}>
        <SectionHeader
          eyebrow="Institution-specific requirements"
          title="What changes from university to university"
          subtitle="SitGuru keeps a single curriculum while the student record holds the institution's approved course, credit, hours, milestones and assessment paperwork. Never infer approval solely from a proposal or enrollment inquiry."
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SYLLABUS_ACADEMIC_FIELDS.map((item) => (
            <article key={item.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-black text-slate-950">{item.title}</h3>
              <p className="mt-2 text-xs font-medium leading-5 text-slate-600">{item.note}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          <article className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <p className="text-[11px] font-black uppercase tracking-widest text-blue-800">Example academic addendum · not universal</p>
            <h3 className="mt-2 text-lg font-black text-slate-950">{BA495A_EXAMPLE.label}</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{BA495A_EXAMPLE.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[BA495A_EXAMPLE.credits, BA495A_EXAMPLE.hours, BA495A_EXAMPLE.weeks].map((label) => (
                <span key={label} className="rounded-full border border-blue-100 bg-white px-3 py-2 text-xs font-black text-blue-900">{label}</span>
              ))}
            </div>
            <p className="mt-3 text-xs font-medium text-slate-600">
              Source example: a Spring 2027 Penn State BA 495A student proposal.
              The student's university must confirm the actual requirements and the format of any faculty-attended presentation.
            </p>
          </article>
          <article className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <GraduationCap size={22} className="text-[#0D5C3A]" aria-hidden="true" />
            <h3 className="mt-3 text-lg font-black text-slate-950">Academic approval stays with the university</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
              A three-credit, 150-hour plan may suit one school; a six-credit, 300-hour
              plan may suit another. Neither is SitGuru's universal minimum.
              Credit is not guaranteed by SitGuru and employer KPI scores do not replace course grades.
            </p>
            <Link href="/admin/internship/universities" className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-black text-[#0D5C3A] underline">
              Review university requirements <ArrowRight size={16} />
            </Link>
          </article>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-950">Individual academic plans</h3>
              <p className="mt-1 text-xs font-medium text-slate-600">Read-only, from current SitGuru intern records. Planned values are not proof of university approval.</p>
            </div>
            <Link href="/admin/internship/interns" className="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-slate-800 hover:bg-slate-100">
              Manage intern records
            </Link>
          </div>
          {academicRows.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {academicRows.map((intern) => {
                const [course, credits, hours, weeks] = syllabusAcademicPlanSummary({
                  courseCode: intern.courseCode,
                  credits: intern.credits,
                  requiredHours: intern.requiredHours,
                  weeks: intern.internshipWeeks ?? null,
                });
                const verification = intern.universityVerificationStatus || "pending";
                return (
                  <article key={intern.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="font-black text-slate-950">{intern.fullName}</h4>
                    <p className="mt-1 text-xs font-semibold text-[#0D5C3A]">{intern.universityName}</p>
                    <p className="mt-2 text-xs font-medium leading-5 text-slate-600">{[course, credits, hours, weeks].join(" · ")}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">University verification: {verification.replaceAll("_", " ")}</p>
                    <Link href={`/admin/internship/interns/${intern.id}`} className="mt-3 inline-flex min-h-10 items-center gap-1 text-xs font-black text-blue-700 underline">
                      Open academic record <ArrowRight size={14} />
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-white p-4 text-sm font-medium text-slate-600">No current intern records found. Add students through the Internship Program and attach their individual university requirements.</p>
          )}
        </div>
      </section>

      <section id="program-workflow" className={section}>
        <SectionHeader
          eyebrow="How the real work flows"
          title="Assignments → evidence → manager review → final report"
          subtitle="The student works in SitGuru. Ava manages the workflow. SharePoint holds assignment files and Microsoft Planner can mirror manager tasks when configured. Universities receive approved evidence and evaluations as required."
        />
        <ol className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {SYLLABUS_WORKFLOW.map((item) => (
            <li key={item.step} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#102D41] text-xs font-black text-white">{item.step}</span>
              <h3 className="mt-3 text-base font-black text-slate-950">{item.label}</h3>
              <p className="mt-1 text-xs font-black text-[#0D5C3A]">{item.actor}</p>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{item.detail}</p>
            </li>
          ))}
        </ol>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map(({ title, description, href, icon: Icon }) => (
            <Link key={href} href={href} className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:bg-emerald-50/30">
              <Icon size={21} className="text-[#0D5C3A]" aria-hidden="true" />
              <p className="mt-3 text-sm font-black text-slate-950">{title}</p>
              <p className="mt-1 text-xs font-medium leading-5 text-slate-600">{description}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-black text-blue-700">Open <ArrowRight size={14} /></span>
            </Link>
          ))}
        </div>
      </section>

      <section id="program-assessment" className={section}>
        <SectionHeader
          eyebrow="Supervision and evaluation"
          title="Evidence-based feedback, not a posting quota"
          subtitle="Employer review covers quality, verified impact and learning. Final course grades and mandatory faculty forms remain under the institution's academic policy."
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {SYLLABUS_ASSESSMENT.map((item, index) => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black text-[#167251]">0{index + 1}</p>
              <h3 className="mt-1 text-base font-black text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2">
            <LockKeyhole size={18} className="text-amber-800" aria-hidden="true" />
            <h3 className="text-sm font-black text-slate-950">Professional, privacy and university safeguards</h3>
          </div>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm font-medium leading-6 text-slate-700">
            {SYLLABUS_GUIDELINES.map((rule) => <li key={rule}>{rule}</li>)}
          </ul>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex gap-3 rounded-2xl border border-slate-200 p-4">
            <FileChartColumn size={21} className="shrink-0 text-[#0D5C3A]" aria-hidden="true" />
            <div>
              <p className="text-sm font-black text-slate-950">Final Business Growth Report</p>
              <p className="mt-1 text-xs font-medium leading-5 text-slate-600">Research, baseline, approved campaigns, verified metrics, experiment analysis, recommendations and lessons learned.</p>
            </div>
          </div>
          <div className="flex gap-3 rounded-2xl border border-slate-200 p-4">
            <Presentation size={21} className="shrink-0 text-[#0D5C3A]" aria-hidden="true" />
            <div>
              <p className="text-sm font-black text-slate-950">Handoff & professional portfolio</p>
              <p className="mt-1 text-xs font-medium leading-5 text-slate-600">Reusable playbook, sanitized case study, final presentation, and the employer/university evaluations that apply.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
