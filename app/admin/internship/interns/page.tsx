import Link from "next/link";
import { ClipboardCheck, GraduationCap, Plus, Settings2, Users } from "lucide-react";
import DeskPageHero from "@/components/manager/DeskPageHero";
import { DESK_UI } from "@/lib/portal/desk-ui";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { saveIntern } from "@/lib/internship/actions";
import { inviteInternshipManager } from "@/lib/internship/assignment-actions";
import { saveRyanManiboCandidate } from "@/lib/internship/onboarding-assign-actions";
import AdminInternTeam, { type AdminInternCard } from "@/components/internship/AdminInternTeam";
import { ACADEMIC_LEVELS } from "@/lib/internship/constants";
import { focusedInternshipWeek } from "@/lib/internship/assignment";
import { summarizeInternshipHours } from "@/lib/internship/hours";
import { academicLevelLabel } from "@/lib/internship/labels";
import {
  getActiveCohort,
  listInterns,
  listPathTypes,
  listUniversities,
} from "@/lib/internship/queries";
import { listInternshipDepartments, listSelectableInternshipStaff } from "@/lib/internship/staff";
import InternshipStaffPicker from "@/components/internship/InternshipStaffPicker";
import { supabaseAdmin } from "@/lib/supabase/admin";
import InternshipRequirementChecker from "@/components/internship/InternshipRequirementChecker";
import AdminPortalDirectory from "@/components/admin/AdminPortalDirectory";
import { excludeFromInternPortalList } from "@/lib/internship/team-roster";

export const dynamic = "force-dynamic";

export default async function InternshipInternsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) redirect("/admin/login");

  const cohort = await getActiveCohort();
  const [interns, universities, pathTypes, managers, supervisors, departments] = await Promise.all([
    listInterns(cohort?.id),
    listUniversities(),
    listPathTypes(),
    listSelectableInternshipStaff("manager"),
    listSelectableInternshipStaff("supervisor"),
    listInternshipDepartments(),
  ]);
  const ids = interns.map((intern) => intern.id);
  const { data: logs } = ids.length
    ? await supabaseAdmin.from("internship_time_logs").select("intern_id,hours,status,worked_on,week_number").in("intern_id", ids)
    : { data: [] };
  const universityName = new Map(universities.map((row) => [row.id, row.displayName || row.name]));
  const departmentName = new Map(departments.map((row) => [row.id, row.name]));
  const staffName = new Map([...managers, ...supervisors].map((row) => [row.id, row.name]));
  const cards: AdminInternCard[] = interns.map((intern) => {
    const summary = summarizeInternshipHours({
      requiredHours: intern.requiredHours,
      requirementStatus: intern.requirementStatus,
      plannedWeeklyHours: intern.plannedWeeklyHours,
      internshipWeeks: intern.internshipWeeks,
      startDate: intern.academicStartDate,
      internshipStatus: intern.status,
      weekZeroReady: true,
      entries: (logs || [])
        .filter((row) => row.intern_id === intern.id)
        .map((row) => ({
          workedOn: String(row.worked_on || ""),
          hours: Number(row.hours) || 0,
          status: String(row.status || "draft"),
          weekNumber: row.week_number == null ? null : Number(row.week_number),
        })),
    });
    const week = focusedInternshipWeek({
      status: intern.status,
      startDate: intern.academicStartDate,
      weekZeroReady: true,
    });
    return {
      id: intern.id,
      avatarUrl: intern.avatarUrl,
      name: intern.preferredName || intern.fullName,
      email: intern.email,
      university: universityName.get(intern.universityId) || "",
      program: intern.academicProgram,
      term: intern.semester,
      academicYear: intern.academicYear || "",
      title: intern.internshipTitle || "",
      departmentId: intern.departmentId || "",
      departmentName: intern.departmentId ? departmentName.get(intern.departmentId) || "" : "",
      managerUserId: intern.managerUserId || "",
      managerName: intern.managerUserId ? staffName.get(intern.managerUserId) || "Assigned manager" : "",
      supervisorUserId: intern.supervisorUserId || "",
      supervisorName: intern.supervisorUserId ? staffName.get(intern.supervisorUserId) || "Assigned supervisor" : "",
      universityStatus: intern.universityVerificationStatus || "pending",
      internshipStatus: intern.status,
      credits: intern.credits == null ? "" : String(intern.credits),
      requiredHours: intern.requiredHours == null ? "" : String(intern.requiredHours),
      plannedWeeklyHours: intern.plannedWeeklyHours == null ? "" : String(intern.plannedWeeklyHours),
      weeks: intern.internshipWeeks == null ? "" : String(intern.internshipWeeks),
      startDate: intern.academicStartDate || "",
      endDate: intern.academicEndDate || "",
      weekLabel: week <= 0 ? "Not started" : `Week ${week}${intern.internshipWeeks ? ` of ${intern.internshipWeeks}` : ""}`,
      paceLabel: summary.paceLabel,
      approvedHours: summary.pendingRequirement ? "Pending" : String(summary.approvedHours),
      notes: intern.universityNotes || "",
    };
  });
  const params = searchParams ? await searchParams : {};
  const ok = Array.isArray(params.ok) ? params.ok[0] : params.ok;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  const cohortInterns = interns.filter((intern) => !excludeFromInternPortalList(intern) && !["archived", "withdrawn"].includes(intern.status));
  const activeInterns = cohortInterns.filter((intern) => intern.status === "active").length;
  const awaitingUniversity = cohortInterns.filter((intern) => ["pending", "needs_information"].includes(intern.universityVerificationStatus || "")).length;
  const assignedManagers = cohortInterns.filter((intern) => Boolean(intern.managerUserId)).length;
  const ryanExists = interns.some((intern) => /ryan\\s+manibo/i.test(intern.fullName));

  return (
    <main className="mx-auto w-full max-w-7xl min-w-0 space-y-5 overflow-x-hidden px-3 pb-24 sm:px-5 lg:px-6">
      <DeskPageHero
        icon={<Users size={22} />}
        title="Intern Team"
        subtitle={`${cohort?.name || "SitGuru internship program"} · Keep every student, assignment and university requirement organized in one place.`}
        quote="Support. Develop. Create Opportunities. Bigger Impact."
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/admin/internship" className="text-xs font-black text-[#2563EB] hover:underline">Internship command center</Link>
        <Link href="/admin/internship/staff" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-[#0F2744] hover:bg-[#F4F7FB]">
          <Settings2 size={15} aria-hidden="true" /> Staff eligibility
        </Link>
      </div>

      <section aria-label="Cohort at a glance" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Current interns", value: cohortInterns.length, help: "This cohort, excluding archived and test records", theme: "border-[#DBEAFE] bg-[#EFF6FF] text-[#1D4ED8]" },
          { label: "Active placements", value: activeInterns, help: "Marked active in SitGuru records", theme: "border-[#DCFCE7] bg-[#F0FDF4] text-[#166534]" },
          { label: "University follow-up", value: awaitingUniversity, help: "Pending or needs more information", theme: "border-[#FFEDD5] bg-[#FFF7ED] text-[#C2410C]" },
          { label: "Manager assignments", value: `${assignedManagers}/${cohortInterns.length}`, help: "Current interns with a manager assigned", theme: "border-[#EDE9FE] bg-[#F5F3FF] text-[#6D28D9]" },
        ].map((stat) => (
          <article key={stat.label} className={`rounded-2xl border p-4 shadow-sm ${stat.theme}`}>
            <p className="text-[11px] font-black uppercase tracking-wider">{stat.label}</p>
            <p className="mt-2 text-3xl font-black">{stat.value}</p>
            <p className="mt-1 text-xs font-medium text-slate-600">{stat.help}</p>
          </article>
        ))}
      </section>

      {ok ? <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{ok}</p> : null}
      {error ? <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">{error}</p> : null}

      <AdminInternTeam interns={cards} managers={managers} supervisors={supervisors} departments={departments} />

      <section id="team-actions" className={`${DESK_UI.card} scroll-mt-24 p-4 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[#0F2744]">Team administration</h2>
            <p className="mt-1 text-sm font-medium text-slate-600">Add new placements and manager accounts only when needed. Existing records remain unchanged.</p>
          </div>
          <span className="rounded-full bg-[#EFF6FF] px-3 py-2 text-xs font-black text-[#1D4ED8]">Admin tools</span>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <details id="new-intern" className="group rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 lg:col-span-2">
            <summary className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-black text-[#0F2744]">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#DBEAFE] text-[#2563EB]"><Plus size={18} /></span>
              <span className="flex-1">Create a new internship placement <span className="block text-xs font-medium text-slate-500">University details, supervisor, hours and portal access</span></span>
            </summary>
                    <form action={saveIntern} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <h2 className="font-black text-slate-950">Create internship</h2>
          <p className="text-sm font-semibold text-slate-600">
            Add each intern here. Leave university hours blank until the school confirms them. Check the invite box to email their intern login. The same form works for every future intern.
          </p>
          {!cohort ? <p className="text-sm font-semibold text-rose-700">Create a cohort before assigning interns.</p> : <input type="hidden" name="cohortId" value={cohort.id} />}
          <input name="fullName" required placeholder="Intern name" className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base font-semibold" />
          <input name="email" type="email" required placeholder="SitGuru login email" className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base font-semibold" />
          <input name="studentEmail" type="email" placeholder="School email" className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base font-semibold" />
          <input name="phone" type="tel" placeholder="Phone" className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base font-semibold" />
          <input name="internshipTitle" placeholder="Internship title" defaultValue="Social Media & Community Growth Intern" className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base font-semibold" />
          <select name="academicLevel" className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base font-semibold">
            <option value="">Academic level</option>
            {ACADEMIC_LEVELS.map((level) => (
              <option key={level} value={level}>{academicLevelLabel(level)}</option>
            ))}
          </select>
          <InternshipRequirementChecker universities={universities} />
          <select name="departmentId" className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base font-semibold">
            <option value="">Department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </select>
          <InternshipStaffPicker
            name="managerUserId"
            label="Assigned manager"
            people={managers}
            emptyMessage="No manager login yet. Add the manager's name and work email in Add manager login on this page."
          />
          <InternshipStaffPicker
            name="supervisorUserId"
            label="Formal supervisor"
            people={supervisors}
            emptyMessage="No eligible internship supervisors are configured."
          />
          <select name="pathType" className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base font-semibold">
            {pathTypes.map((path) => (
              <option key={path.slug} value={path.slug}>{path.name}</option>
            ))}
          </select>
          <input name="semester" placeholder="Term" defaultValue={cohort ? `${cohort.season} ${cohort.year}` : ""} className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base font-semibold" />
          <input name="academicYear" placeholder="Academic year" defaultValue={cohort?.academicYear || ""} className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base font-semibold" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="credits" inputMode="decimal" placeholder="Credits, or leave pending" className="min-h-12 rounded-xl border border-slate-200 px-3 text-base font-semibold" />
            <input name="requiredHours" inputMode="decimal" placeholder="Required hours, or leave pending" className="min-h-12 rounded-xl border border-slate-200 px-3 text-base font-semibold" />
            <input name="plannedWeeklyHours" inputMode="decimal" placeholder="Weekly hours" className="min-h-12 rounded-xl border border-slate-200 px-3 text-base font-semibold" />
            <input name="internshipWeeks" inputMode="numeric" placeholder="Weeks" className="min-h-12 rounded-xl border border-slate-200 px-3 text-base font-semibold" />
            <input type="date" name="academicStartDate" className="min-h-12 rounded-xl border border-slate-200 px-3 text-base font-semibold" />
            <input type="date" name="academicEndDate" className="min-h-12 rounded-xl border border-slate-200 px-3 text-base font-semibold" />
          </div>
          <select name="universityApproval" defaultValue="pending" className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base font-semibold">
            <option value="pending">University approval: pending</option>
            <option value="approved">University approval: approved</option>
            <option value="needs_information">University approval: needs information</option>
            <option value="declined">University approval: declined</option>
            <option value="not_required">University approval: not required</option>
          </select>
          <select name="status" defaultValue="pending_university_approval" className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base font-semibold">
            <option value="prospective">Prospective candidate</option>
          <option value="candidate">Candidate</option>
            <option value="pending_university_approval">Pending university approval</option>
            <option value="approved">Approved</option>
            <option value="onboarding">Onboarding</option>
            <option value="active">Active</option>
          </select>
          <textarea name="notes" rows={2} placeholder="University notes" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-base font-semibold" />
          <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-slate-800">
            <input type="checkbox" name="invite" className="h-5 w-5" />
            Email this intern a SitGuru login
          </label>
          <button disabled={!cohort} className="min-h-11 w-full rounded-xl bg-[#2563EB] text-sm font-black !text-white disabled:opacity-50">
            Create internship assignment
          </button>
        </form>
          </details>
          <details className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4">
            <summary className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-black text-[#0F2744]">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#DCFCE7] text-[#166534]"><Users size={18} /></span>
              <span className="flex-1">Add a manager login <span className="block text-xs font-medium text-slate-500">Invite an eligible manager to SitGuru</span></span>
            </summary>
                    <form action={inviteInternshipManager} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <h2 className="font-black text-slate-950">Add manager login</h2>
          <input type="hidden" name="returnTo" value="interns" />
          <p className="text-sm font-semibold text-slate-600">
            This creates a Social Media & Community Growth Manager login and adds that person to Assigned manager. Use it for the current manager, then again for a future manager.
          </p>
          <input name="name" required placeholder="Manager first and last name" className="min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base font-semibold" />
          <input name="email" type="email" required placeholder="Manager work email" className="min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base font-semibold" />
          <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-slate-800">
            <input type="checkbox" name="invite" className="h-5 w-5" />
            Email the manager login
          </label>
          <button className="min-h-11 w-full rounded-xl bg-[#2563EB] text-sm font-black !text-white">
            Add manager
          </button>
        </form>
          </details>
          <details className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4">
            <summary className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-black text-[#0F2744]">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#EDE9FE] text-[#6D28D9]"><GraduationCap size={18} /></span>
              <span className="flex-1">University & administrative directory <span className="block text-xs font-medium text-slate-500">Additional institutional and operational tools</span></span>
            </summary>
            <div className="mt-4 border-t border-slate-100 pt-4"><AdminPortalDirectory /></div>
          </details>
          {!ryanExists ? (
            <details className="rounded-2xl border border-amber-200 bg-[#FFF7ED] p-4 lg:col-span-2">
              <summary className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-black text-[#0F2744]">
                <ClipboardCheck size={18} aria-hidden="true" className="text-[#C2410C]" /> Historical Ryan Manibo candidate quick-add
              </summary>
                      <form action={saveRyanManiboCandidate} className="mt-4 space-y-3 border-t border-amber-100 pt-4">
          <h2 className="font-black text-slate-950">Ryan Manibo</h2>
          <p className="text-sm font-semibold text-slate-700">
            Lola Uhl and Lalita Dhital are already pending Spring 2027 records. Ryan still needs a verified contact email. Saving him does not send an invitation or open the portal. Planned plan: 3 credits, 150 hours, 10 hours a week, 15 weeks, university confirmation pending.
          </p>
          <input name="email" type="email" required placeholder="Ryan's verified contact email" className="min-h-12 w-full rounded-xl border border-amber-200 bg-white px-3 text-base font-semibold" />
          <button className="min-h-11 rounded-xl bg-[#2563EB] px-4 text-sm font-black !text-white">Save Ryan as pending</button>
        </form>
            </details>
          ) : null}
        </div>
      </section>
    </main>
  );
}
