import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { saveIntern } from "@/lib/internship/actions";
import { inviteInternshipManager } from "@/lib/internship/assignment-actions";
import { saveRyanManiboCandidate } from "@/lib/internship/onboarding-assign-actions";
import AdminInternTeam, { type AdminInternCard } from "@/components/internship/AdminInternTeam";
import { internPortalPreviewPath, ACADEMIC_LEVELS } from "@/lib/internship/constants";
import { focusedInternshipWeek, lifecycleLabel } from "@/lib/internship/assignment";
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
import InternAvatar from "@/components/internship/InternAvatar";
import InternshipRequirementChecker from "@/components/internship/InternshipRequirementChecker";
import AdminPortalDirectory from "@/components/admin/AdminPortalDirectory";

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

  return (
    <main className="mx-auto max-w-6xl space-y-5 overflow-x-hidden px-3 pb-8 sm:px-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-black text-slate-950">Intern team</h1>
        <Link href="/admin/internship/staff" className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-900">
          Staff eligibility
        </Link>
      </div>
      <p className="max-w-3xl text-sm font-semibold text-slate-600">
        Use this page for every intern. Add the manager once, then add Ryan or anyone else. Pending university approval does not start Week 1. Leave hours blank until the school confirms them.
      </p>
      {ok ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{ok}</p> : null}
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</p> : null}

      <AdminPortalDirectory />

      <AdminInternTeam interns={cards} managers={managers} supervisors={supervisors} departments={departments} />

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-2 xl:col-span-5">
          {interns.map((intern) => (
            <div key={intern.id} className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white px-4 py-4 shadow-sm">
              <InternAvatar name={intern.fullName} email={intern.email} src={intern.avatarUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="font-black text-slate-950">{intern.fullName}</p>
                <p className="text-xs font-semibold text-slate-500">
                  {[intern.email, lifecycleLabel(intern.status)].filter(Boolean).join(" · ")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={internPortalPreviewPath(intern.id)} className="inline-flex min-h-11 items-center rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white">Intern portal</Link>
                  <Link href={`/admin/internship/interns/${intern.id}`} className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 px-4 text-sm font-black text-emerald-900">Employer review</Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 xl:col-span-7">
        <form action={inviteInternshipManager} className="space-y-3 rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
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
          <button className="min-h-12 w-full rounded-2xl border border-emerald-200 text-sm font-black text-emerald-950">
            Add manager
          </button>
        </form>
        <form action={saveRyanManiboCandidate} className="space-y-3 rounded-[1.5rem] border border-amber-100 bg-amber-50 p-5 shadow-sm">
          <h2 className="font-black text-slate-950">Ryan Manibo</h2>
          <p className="text-sm font-semibold text-slate-700">
            Lola Uhl and Lalita Dhital are already pending Spring 2027 records. Ryan still needs a verified contact email. Saving him does not send an invitation or open the portal. Planned plan: 3 credits, 150 hours, 10 hours a week, 15 weeks, university confirmation pending.
          </p>
          <input name="email" type="email" required placeholder="Ryan's verified contact email" className="min-h-12 w-full rounded-xl border border-amber-200 bg-white px-3 text-base font-semibold" />
          <button className="min-h-12 rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white">Save Ryan as pending</button>
        </form>
        <form action={saveIntern} className="space-y-3 rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="font-black text-slate-950">Create internship</h2>
          <p className="text-sm font-semibold text-slate-600">
            Add each intern here. Leave university hours blank until the school confirms them. Check the invite box to email their intern login. The same form works for every future intern.
          </p>
          {!cohort ? <p className="text-sm font-semibold text-rose-700">Create a cohort before assigning interns.</p> : <input type="hidden" name="cohortId" value={cohort.id} />}
          <input name="fullName" required placeholder="Intern name" className="min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base font-semibold" />
          <input name="email" type="email" required placeholder="SitGuru login email" className="min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base font-semibold" />
          <input name="studentEmail" type="email" placeholder="School email" className="min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base font-semibold" />
          <input name="phone" type="tel" placeholder="Phone" className="min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base font-semibold" />
          <input name="internshipTitle" placeholder="Internship title" defaultValue="Social Media & Community Growth Intern" className="min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base font-semibold" />
          <select name="academicLevel" className="min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base font-semibold">
            <option value="">Academic level</option>
            {ACADEMIC_LEVELS.map((level) => (
              <option key={level} value={level}>{academicLevelLabel(level)}</option>
            ))}
          </select>
          <InternshipRequirementChecker universities={universities} />
          <select name="departmentId" className="min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base font-semibold">
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
          <select name="pathType" className="min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base font-semibold">
            {pathTypes.map((path) => (
              <option key={path.slug} value={path.slug}>{path.name}</option>
            ))}
          </select>
          <input name="semester" placeholder="Term" defaultValue={cohort ? `${cohort.season} ${cohort.year}` : ""} className="min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base font-semibold" />
          <input name="academicYear" placeholder="Academic year" defaultValue={cohort?.academicYear || ""} className="min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base font-semibold" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="credits" inputMode="decimal" placeholder="Credits, or leave pending" className="min-h-12 rounded-xl border border-emerald-100 px-3 text-base font-semibold" />
            <input name="requiredHours" inputMode="decimal" placeholder="Required hours, or leave pending" className="min-h-12 rounded-xl border border-emerald-100 px-3 text-base font-semibold" />
            <input name="plannedWeeklyHours" inputMode="decimal" placeholder="Weekly hours" className="min-h-12 rounded-xl border border-emerald-100 px-3 text-base font-semibold" />
            <input name="internshipWeeks" inputMode="numeric" placeholder="Weeks" className="min-h-12 rounded-xl border border-emerald-100 px-3 text-base font-semibold" />
            <input type="date" name="academicStartDate" className="min-h-12 rounded-xl border border-emerald-100 px-3 text-base font-semibold" />
            <input type="date" name="academicEndDate" className="min-h-12 rounded-xl border border-emerald-100 px-3 text-base font-semibold" />
          </div>
          <select name="universityApproval" defaultValue="pending" className="min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base font-semibold">
            <option value="pending">University approval: pending</option>
            <option value="approved">University approval: approved</option>
            <option value="needs_information">University approval: needs information</option>
            <option value="declined">University approval: declined</option>
            <option value="not_required">University approval: not required</option>
          </select>
          <select name="status" defaultValue="pending_university_approval" className="min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base font-semibold">
            <option value="prospective">Prospective candidate</option>
          <option value="candidate">Candidate</option>
            <option value="pending_university_approval">Pending university approval</option>
            <option value="approved">Approved</option>
            <option value="onboarding">Onboarding</option>
            <option value="active">Active</option>
          </select>
          <textarea name="notes" rows={2} placeholder="University notes" className="w-full rounded-xl border border-emerald-100 px-3 py-3 text-base font-semibold" />
          <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-slate-800">
            <input type="checkbox" name="invite" className="h-5 w-5" />
            Email this intern a SitGuru login
          </label>
          <button disabled={!cohort} className="min-h-12 w-full rounded-2xl bg-[#0D5C3A] text-sm font-black !text-white disabled:opacity-50">
            Create internship assignment
          </button>
        </form>
        </div>
      </section>
    </main>
  );
}
