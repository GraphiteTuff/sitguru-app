import Link from "next/link";
import type { ReactNode } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarRange,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Users,
} from "lucide-react";
import SpringInternTable, { type InternTableRow } from "@/components/admin/hr/SpringInternTable";
import { SPRING_2027_CANDIDATE_PLANS } from "@/lib/internship/spring2027-candidates";
import { getActiveCohort, listCohortMilestones, listInterns } from "@/lib/internship/queries";
import {
  buildSpringRoster,
  displayUniversityName,
  optionalStoredNumber,
  type RosterAccountHint,
  type RosterInternRecord,
} from "@/lib/internship/team-roster";
import { supabaseAdmin } from "@/lib/supabase/admin";

const primary =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0D5C3A] px-4 text-sm font-black !text-white";

const bands = [
  "Weeks 1–2  Onboarding & Brand Foundations",
  "Weeks 3–5  Content Strategy & Campaigns",
  "Weeks 6–8  Campaign Execution & Growth",
  "Weeks 9–11  Optimization & Partnerships",
  "Weeks 12–14  Final Project Development",
  "Week 15  Final Review & Presentation",
];

const tools = [
  { href: "/admin/internship/interns", title: "Intern Records", detail: "Manage student profiles and academic plans.", icon: Users, tint: "bg-emerald-50 text-emerald-700" },
  { href: "/admin/hr/team-access", title: "Manager Assignments", detail: "Assign Ava and supervisors.", icon: Users, tint: "bg-sky-50 text-sky-700" },
  { href: "/admin/internship/universities", title: "Academic Requirements", detail: "Track credits, hours, and university approvals.", icon: BookOpen, tint: "bg-violet-50 text-violet-700" },
  { href: "/admin/internship/timeline", title: "Projects & Milestones", detail: "Manage the 15-week program.", icon: CheckCircle2, tint: "bg-emerald-50 text-emerald-700" },
  { href: "/admin/internship/time", title: "Hours & Progress", detail: "Monitor time tracking and completion.", icon: Clock3, tint: "bg-sky-50 text-sky-700" },
  { href: "/admin/internship/playbook", title: "Reports", detail: "Program status and university reporting.", icon: BarChart3, tint: "bg-violet-50 text-violet-700" },
] as const;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function microsoftLabel(value: string) {
  const normalized = value.toLowerCase();
  if (!normalized || normalized === "not_created") return "Not created";
  return normalized.replaceAll("_", " ");
}

function statusTone(label: string): InternTableRow["statusTone"] {
  if (label.toLowerCase().includes("prospective")) return "violet";
  if (label.toLowerCase().includes("active") || label.toLowerCase().includes("approved")) return "emerald";
  if (label.toLowerCase().includes("pending") || label.toLowerCase().includes("missing")) return "amber";
  return "slate";
}

function schoolMark(name: string) {
  if (/hazleton/i.test(name)) return { letters: "PSH", tint: "bg-blue-900 text-white" };
  if (/joseph/i.test(name)) return { letters: "SJU", tint: "bg-red-800 text-white" };
  if (/penn state/i.test(name)) return { letters: "PSU", tint: "bg-blue-800 text-white" };
  return { letters: name.slice(0, 3).toUpperCase(), tint: "bg-slate-700 text-white" };
}

function Stat({
  value,
  label,
  helper,
  icon,
  tint,
}: {
  value: string;
  label: string;
  helper: string;
  icon: ReactNode;
  tint: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${tint}`}>{icon}</span>
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
      <p className="text-sm font-black text-slate-800">{label}</p>
      <p className="text-xs font-semibold text-slate-500">{helper}</p>
    </article>
  );
}

export default async function SpringProgramDashboard({
  canAdminister,
  notice = "",
  noticeError = "",
}: {
  canAdminister: boolean;
  notice?: string;
  noticeError?: string;
}) {
  const cohort = await getActiveCohort();
  const [interns, academic, universities, accounts, onboarded, managers] = await Promise.all([
    listInterns(cohort?.id),
    supabaseAdmin
      .from("internship_interns")
      .select("id,credits,requested_credits,planned_total_hours,planned_weekly_hours,internship_weeks,university_verification_status,microsoft_readiness,manager_user_id,internship_title"),
    supabaseAdmin.from("internship_universities").select("id,name"),
    supabaseAdmin
      .from("profiles")
      .select("id,email,full_name")
      .or("full_name.ilike.%Manibo%,full_name.ilike.%Uhl%,full_name.ilike.%Dhital%,email.ilike.%manibo%,email.ilike.%uh15%,email.ilike.%dhital%"),
    supabaseAdmin.from("internship_onboarding_acknowledgments").select("intern_id,onboarding_status"),
    supabaseAdmin.from("profiles").select("id,full_name").eq("email", "ava@sitguru.com"),
  ]);
  const milestones = cohort ? await listCohortMilestones(cohort.id) : [];
  const doneMilestones = milestones.filter((row) => row.status === "done").length;
  const progress = milestones.length ? Math.round((doneMilestones / milestones.length) * 100) : 0;

  const academicById = new Map((academic.data || []).map((row) => [text(row.id), row]));
  const universityName = new Map((universities.data || []).map((row) => [text(row.id), text(row.name)]));
  const started = new Set(
    (onboarded.data || [])
      .filter((row) => text(row.onboarding_status) && text(row.onboarding_status) !== "pending")
      .map((row) => text(row.intern_id)),
  );
  const managerName = text(managers.data?.[0]?.full_name) || "Ava Venezia";
  const records: RosterInternRecord[] = interns.map((intern) => {
    const raw = academicById.get(intern.id);
    return {
      id: intern.id,
      fullName: intern.fullName,
      preferredName: intern.preferredName,
      email: intern.email,
      userId: intern.userId,
      status: intern.status,
      portalEnabled: intern.portalEnabled,
      universityName: universityName.get(intern.universityId) || "",
      credits: optionalStoredNumber(raw?.credits),
      requestedCredits: optionalStoredNumber(raw?.requested_credits),
      plannedTotalHours: optionalStoredNumber(raw?.planned_total_hours),
      plannedWeeklyHours: optionalStoredNumber(raw?.planned_weekly_hours),
      internshipWeeks: optionalStoredNumber(raw?.internship_weeks),
    };
  });
  const accountHints: RosterAccountHint[] = (accounts.data || []).map((row) => ({
    userId: text(row.id),
    email: text(row.email).toLowerCase(),
    fullName: text(row.full_name),
  }));
  const roster = buildSpringRoster({ interns: records, accounts: accountHints });
  const verifiedCount = roster.filter((person) => {
    const raw = person.recordId ? academicById.get(person.recordId) : null;
    const status = text(raw?.university_verification_status).toLowerCase();
    return status === "verified" || status === "confirmed" || status === "university_verified";
  }).length;
  const activeCount = roster.filter((person) => person.workspaceAction === "active" || person.statusLabel.toLowerCase() === "active").length;
  const plannedHours = roster.reduce((sum, person) => {
    const plan = SPRING_2027_CANDIDATE_PLANS.find((item) => item.key === person.key);
    const raw = person.recordId ? academicById.get(person.recordId) : null;
    return sum + (optionalStoredNumber(raw?.planned_total_hours) ?? plan?.plannedTotalHours ?? 0);
  }, 0);
  const schools = new Map<string, number>();
  for (const person of roster) {
    const name = displayUniversityName(person.universityLabel);
    schools.set(name, (schools.get(name) || 0) + 1);
  }

  const rows: InternTableRow[] = roster.map((person) => {
    const raw = person.recordId ? academicById.get(person.recordId) : null;
    const plan = SPRING_2027_CANDIDATE_PLANS.find((item) => item.key === person.key);
    const status = person.recordId ? person.statusLabel : person.accountLabel;
    return {
      key: person.key,
      name: person.fullName,
      roleTitle: text(raw?.internship_title) || "Social Media & Community Growth Intern",
      university: displayUniversityName(person.universityLabel),
      academicProgram: plan?.academicProgram || "Program pending",
      creditLine: person.creditLabel,
      hoursLine: person.hoursLabel,
      weeklyLine: `${person.weeklyLabel.replace(" planned hours/week", " hrs/week")} · ${person.weeksLabel.replace(" planned weeks", " weeks")}`,
      status,
      statusTone: statusTone(status),
      onboarding: person.recordId && started.has(person.recordId) ? "In progress" : "Not started",
      microsoft: person.recordId ? microsoftLabel(text(raw?.microsoft_readiness)) : "Not created",
      managerName,
      recordId: person.recordId,
      canCreate: person.canCreatePendingRecord,
    };
  });

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">Admin HQ / Internship Program</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Spring 2027 Internship Program</h1>
          <p className="mt-1 max-w-3xl text-sm font-semibold text-slate-600">
            Manage interns, universities, projects, milestones, and academic requirements.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            <span className="sr-only">Cohort</span>
            <select className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800" defaultValue="spring-2027" aria-label="Internship cohort">
              <option value="spring-2027">Spring 2027</option>
            </select>
          </label>
          <Link href="/admin/internship/playbook" className={primary}>View Program Syllabus</Link>
        </div>
      </div>

      {notice ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{notice}</p> : null}
      {noticeError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{noticeError}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat icon={<GraduationCap className="h-5 w-5" />} tint="bg-emerald-50 text-emerald-700" value={String(roster.length)} label="Total Interns (Planned)" helper="Spring 2027 cohort" />
        <Stat icon={<Users className="h-5 w-5" />} tint="bg-sky-50 text-sky-700" value={String(activeCount)} label="Active Interns" helper="Currently active" />
        <Stat icon={<Clock3 className="h-5 w-5" />} tint="bg-amber-50 text-amber-700" value={String(plannedHours)} label="Total Planned Hours" helper="Across all interns" />
        <Stat icon={<BookOpen className="h-5 w-5" />} tint="bg-violet-50 text-violet-700" value={String(schools.size)} label="Universities" helper="Partner schools" />
        <Stat icon={<CheckCircle2 className="h-5 w-5" />} tint="bg-emerald-50 text-emerald-700" value={`${verifiedCount}/${roster.length}`} label="University Approvals" helper="Verified" />
      </div>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-950">Spring 2027 Interns</h2>
            <p className="text-sm font-semibold text-slate-500">Create, update, and manage internship records, academic requirements, and onboarding.</p>
          </div>
        </div>
        <div className="mt-4">
          <SpringInternTable rows={rows} canAdminister={canAdminister} />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
            <CalendarRange className="h-5 w-5 text-emerald-700" /> Program Timeline
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">Key dates for the Spring 2027 internship program.</p>
          <ol className="mt-4 space-y-4">
            {[
              ["Jan 11, 2027", "Program start (Week 1)"],
              ["Jan – Apr 2027", "15-week internship program"],
              ["Apr 18, 2027", "Program end (Week 15)"],
              ["Apr 30, 2027", "Final reports and university closeout"],
            ].map(([when, label]) => (
              <li key={label} className="flex gap-3">
                <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-[#0D5C3A]" />
                <span>
                  <span className="block text-xs font-black uppercase tracking-[0.08em] text-slate-400">{when}</span>
                  <span className="text-sm font-bold text-slate-800">{label}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
            <BarChart3 className="h-5 w-5 text-emerald-700" /> Milestone Progress
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">15-week program with guided deliverables.</p>
          <ul className="mt-4 space-y-3">
            {bands.map((label) => (
              <li key={label}>
                <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                  <span>{label}</span>
                  <span className="text-xs font-bold text-slate-400">{progress}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[#0D5C3A]" style={{ width: `${progress}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
            <GraduationCap className="h-5 w-5 text-emerald-700" /> University Partners
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">Participating schools and academic programs.</p>
          <ul className="mt-4 space-y-3">
            {[...schools.entries()].map(([name, count]) => {
              const mark = schoolMark(name);
              return (
                <li key={name} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-[10px] font-black ${mark.tint}`}>
                      {mark.letters}
                    </span>
                    <span className="text-sm font-bold text-slate-800">{name}</span>
                  </span>
                  <span className="text-xs font-bold text-slate-500">{count} intern{count === 1 ? "" : "s"}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-black text-slate-950">Program Management Tools</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">Quick access to core internship program functions.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <Link key={tool.title} href={tool.href} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-emerald-200 hover:bg-emerald-50">
              <span>
                <span className="flex items-center gap-2 text-sm font-black text-slate-950">
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${tool.tint}`}>
                    <tool.icon className="h-4 w-4" />
                  </span>
                  {tool.title}
                </span>
                <span className="mt-1 block pl-10 text-xs font-semibold leading-5 text-slate-500">{tool.detail}</span>
              </span>
              <span className="text-slate-300">›</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
