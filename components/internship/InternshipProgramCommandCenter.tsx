import Link from "next/link";
import type { ReactNode } from "react";
import { saveRyanManiboCandidate } from "@/lib/internship/onboarding-assign-actions";
import { internPortalPreviewPath } from "@/lib/internship/constants";
import { SPRING_2027_CANDIDATE_PLANS } from "@/lib/internship/spring2027-candidates";
import { listInterns } from "@/lib/internship/queries";
import {
  buildSpringRoster,
  optionalStoredNumber,
  type RosterAccountHint,
  type RosterInternRecord,
} from "@/lib/internship/team-roster";
import SpringInternTable, { type InternTableRow } from "@/components/admin/hr/SpringInternTable";
import type { InternshipMilestone, InternshipProject, InternshipUniversity } from "@/lib/internship/types";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  BookOpenCheck,
  ClipboardList,
  Clock3,
  FileBarChart,
  GraduationCap,
  Users,
} from "lucide-react";

const primary =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0D5C3A] px-4 text-sm font-black !text-white";
const secondary =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800";

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
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${tint}`}>
        {icon}
      </span>
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
      <p className="text-sm font-black text-slate-800">{label}</p>
      <p className="text-xs font-semibold text-slate-500">{helper}</p>
    </article>
  );
}

const tools = [
  { href: "/admin/internship/interns", title: "Intern Records", detail: "Manage student profiles and academic plans.", icon: Users },
  { href: "/admin/hr/team-access", title: "Manager Assignments", detail: "Assign Ava and supervisors.", icon: ClipboardList },
  { href: "/admin/internship/universities", title: "Academic Requirements", detail: "Track credits, hours, and university approvals.", icon: GraduationCap },
  { href: "/admin/internship/timeline", title: "Projects & Milestones", detail: "Manage the 15-week program.", icon: BookOpenCheck },
  { href: "/admin/internship/time", title: "Hours & Progress", detail: "Monitor time tracking and completion.", icon: Clock3 },
  { href: "/admin/internship/playbook", title: "Reports", detail: "Program status and university reporting.", icon: FileBarChart },
] as const;

export default async function InternshipProgramCommandCenter({
  canAdminister,
  cohortName,
  cohortId,
  startsOn,
  endsOn,
  milestones,
  projects,
  universities,
  notice = "",
  noticeError = "",
}: {
  canAdminister: boolean;
  cohortName: string;
  cohortId: string | null;
  startsOn: string | null;
  endsOn: string | null;
  milestones: InternshipMilestone[];
  projects: InternshipProject[];
  universities: InternshipUniversity[];
  notice?: string;
  noticeError?: string;
}) {
  let interns: Awaited<ReturnType<typeof listInterns>> = [];
  let academic: { data: Record<string, unknown>[] | null } = { data: [] };
  let uniRows: { data: { id?: string; name?: string }[] | null } = { data: [] };
  let accounts: { data: { id?: string; email?: string; full_name?: string }[] | null } = { data: [] };
  try {
  const loaded = await Promise.all([
    listInterns(cohortId || undefined),
    supabaseAdmin
      .from("internship_interns")
      .select(
        "id,credits,requested_credits,planned_total_hours,planned_weekly_hours,internship_weeks,university_verification_status,microsoft_readiness",
      ),
    supabaseAdmin.from("internship_universities").select("id,name"),
    supabaseAdmin
      .from("profiles")
      .select("id,email,full_name")
      .or(
        "full_name.ilike.%Manibo%,full_name.ilike.%Uhl%,full_name.ilike.%Dhital%,email.ilike.%manibo%,email.ilike.%uh15%,email.ilike.%dhital%",
      ),
  ]);
  interns = loaded[0];
  academic = { data: (loaded[1].data || []) as Record<string, unknown>[] };
  uniRows = { data: loaded[2].data || [] };
  accounts = { data: loaded[3].data || [] };
  } catch (error) {
    console.error(
      "[internship] command center",
      error instanceof Error ? error.message : error,
    );
  }

  const academicById = new Map((academic.data || []).map((row) => [text(row.id), row]));
  const universityName = new Map((uniRows.data || []).map((row) => [text(row.id), text(row.name)]));
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
  const activeCount = roster.filter((person) => person.workspaceAction === "active").length;
  const plannedHours = roster.reduce((sum, person) => {
    const plan = SPRING_2027_CANDIDATE_PLANS.find((item) => item.key === person.key);
    const raw = person.recordId ? academicById.get(person.recordId) : null;
    return sum + (optionalStoredNumber(raw?.planned_total_hours) ?? plan?.plannedTotalHours ?? 0);
  }, 0);
  const schoolCounts = new Map<string, number>();
  for (const person of roster) {
    schoolCounts.set(person.universityLabel, (schoolCounts.get(person.universityLabel) || 0) + 1);
  }

  const rows: InternTableRow[] = roster.map((person) => {
    const raw = person.recordId ? academicById.get(person.recordId) : null;
    const plan = SPRING_2027_CANDIDATE_PLANS.find((item) => item.key === person.key);
    return {
      key: person.key,
      name: person.fullName,
      roleTitle: "Social Media & Community Growth Intern",
      academicProgram: plan?.academicProgram || "Program pending",
      university: person.universityLabel,
      creditLine: person.creditLabel,
      hoursLine: person.hoursLabel,
      weeklyLine: `${person.weeklyLabel} · ${person.weeksLabel}`,
      status: person.recordId ? person.statusLabel : person.accountLabel,
      statusTone: statusTone(person.recordId ? person.statusLabel : person.accountLabel),
      microsoft: person.recordId ? microsoftLabel(text(raw?.microsoft_readiness)) : "Not created",
      onboarding: "Not started",
      managerName: "Ava Venezia",
      recordId: person.recordId,
      canCreate: person.canCreatePendingRecord,
    };
  });
  const ryan = roster.find((person) => person.canCreatePendingRecord);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 pb-8 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">Admin HQ / Internship Program</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            {cohortName || "Spring 2027 Internship Program"}
          </h1>
          <p className="mt-1 max-w-3xl text-sm font-semibold text-slate-600">
            Manage interns, universities, projects, milestones, and academic requirements.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Cohort
            <select
              className="mt-1 min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800"
              defaultValue="spring-2027"
              aria-label="Internship cohort"
            >
              <option value="spring-2027">Spring 2027</option>
            </select>
          </label>
          <Link href="/admin/internship/playbook" className={primary}>
            View Program Syllabus
          </Link>
        </div>
      </div>

      {notice ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{notice}</p> : null}
      {noticeError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{noticeError}</p> : null}

      {!cohortId ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
          No active cohort is configured yet. Intern records and milestones will appear here once a Spring cohort exists.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat icon={<Users className="h-5 w-5" />} tint="bg-emerald-50 text-emerald-700" value={String(roster.length)} label="Total Interns (Planned)" helper="Spring 2027 cohort" />
        <Stat icon={<Users className="h-5 w-5" />} tint="bg-sky-50 text-sky-700" value={String(activeCount)} label="Active Interns" helper="Currently active" />
        <Stat icon={<Clock3 className="h-5 w-5" />} tint="bg-violet-50 text-violet-700" value={String(plannedHours)} label="Total Planned Hours" helper="Across all interns" />
        <Stat icon={<GraduationCap className="h-5 w-5" />} tint="bg-amber-50 text-amber-700" value={String(schoolCounts.size || universities.length)} label="Universities" helper="Partner schools" />
        <Stat icon={<BookOpenCheck className="h-5 w-5" />} tint="bg-emerald-50 text-emerald-700" value={`${verifiedCount}/${roster.length}`} label="University Approvals" helper="Verified" />
      </div>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">Spring 2027 Interns</h2>
            <p className="text-sm font-semibold text-slate-500">
              Ryan, Lola, and Lalita — academic plans, approvals, and onboarding.
            </p>
          </div>
          <Link href="/admin/hr" className={secondary}>
            Open Hiring & People
          </Link>
        </div>
        <div className="mt-3">
          <SpringInternTable rows={rows} canAdminister={canAdminister} />
        </div>
        {canAdminister && ryan ? (
          <form action={saveRyanManiboCandidate} className="mt-4 grid gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <input type="hidden" name="returnTo" value="/admin/internship" />
            <label className="text-sm font-bold text-amber-950">
              Ryan still needs a verified contact email
              <input name="email" type="email" required placeholder="School or personal email" className="mt-1 min-h-11 w-full rounded-xl border border-amber-200 bg-white px-3 text-sm font-semibold" />
            </label>
            <button type="submit" className={primary}>Create pending record</button>
          </form>
        ) : null}
        {roster.some((person) => person.recordId && person.workspaceAction === "preview") ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {roster
              .filter((person) => person.recordId && person.workspaceAction === "preview")
              .map((person) => (
                <Link key={person.key} href={internPortalPreviewPath(person.recordId || "")} className={secondary}>
                  Preview {person.fullName}
                </Link>
              ))}
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-black text-slate-950">Program Timeline</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Planned dates for the cohort. Each school still confirms its own academic calendar.
          </p>
          <ol className="mt-4 space-y-3">
            {[
              [startsOn || "Jan 11, 2027", "Program start"],
              ["Jan–Apr 2027", "15-week internship program"],
              [endsOn || "Apr 18, 2027", "Program end"],
              ["Apr 30, 2027", "Final reports"],
            ].map(([when, label]) => (
              <li key={label} className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#0D5C3A]" />
                <span>
                  <span className="block text-xs font-black uppercase tracking-[0.08em] text-slate-400">
                    {when}
                  </span>
                  <span className="text-sm font-bold text-slate-800">{label}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-black text-slate-950">Milestone Progress</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Employer calendar for the cohort. Empty until milestones are scheduled.
          </p>
          <ul className="mt-4 space-y-2">
            {milestones.length ? (
              milestones.slice(0, 6).map((row) => (
                <li key={row.id} className="rounded-2xl border border-slate-100 px-3 py-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                    {row.phase || "Milestone"}
                    {row.dueOn ? ` · ${row.dueOn}` : ""}
                  </p>
                  <p className="text-sm font-bold text-slate-800">{row.title || "Untitled milestone"}</p>
                </li>
              ))
            ) : (
              <li className="text-sm font-semibold text-slate-500">No milestones are scheduled yet.</li>
            )}
          </ul>
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-black text-slate-950">University Partners</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Schools represented by Spring 2027 interns.
          </p>
          <ul className="mt-4 space-y-2">
            {schoolCounts.size ? (
              [...schoolCounts.entries()].map(([name, count]) => (
                <li key={name} className="flex items-center justify-between rounded-2xl border border-slate-100 px-3 py-2">
                  <span className="text-sm font-black text-slate-950">{name}</span>
                  <span className="text-xs font-bold text-slate-500">
                    {count} intern{count === 1 ? "" : "s"}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-sm font-semibold text-slate-500">No university partners are linked yet.</li>
            )}
          </ul>
          {projects.length ? (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Active projects</p>
              {projects.slice(0, 4).map((project) => (
                <p key={project.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800">
                  {project.name}
                </p>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-black text-slate-950">Program Management Tools</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Staff onboarding stays in Hiring & People. This page is the Spring 2027 program command center.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.title}
              href={tool.href}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-emerald-200 hover:bg-emerald-50"
            >
              <span className="flex items-center gap-2 text-sm font-black text-slate-950">
                <tool.icon className="h-4 w-4 text-[#0D5C3A]" />
                {tool.title}
              </span>
              <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">
                {tool.detail}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
