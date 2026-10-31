import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminIdentity } from "@/lib/admin/access";
import AssignManagerDesk from "@/components/internship/AssignManagerDesk";
import { canAdministerInternshipOnboarding } from "@/lib/internship/manager-access";
import {
  resolveStaffSeat,
  SPRING_2027_MANAGER_EMAIL,
  SPRING_2027_SUPERVISOR_EMAIL,
} from "@/lib/internship/onboarding-authority";
import { listInterns } from "@/lib/internship/queries";
import { internshipStaffOptionLabel, listSelectableInternshipStaff } from "@/lib/internship/staff";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function InternshipAssignScreen({
  returnTo,
  ok,
  error,
}: {
  returnTo: string;
  ok?: string;
  error?: string;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) redirect(`/admin/login?next=${encodeURIComponent(returnTo)}`);
  if (!canAdministerInternshipOnboarding(actor)) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-black text-slate-950">Assign manager</h1>
        <p className="mt-3 text-sm font-semibold text-slate-600">
          Only a Super Admin can assign internship managers or complete onboarding. Manager accounts stay on the Intern Team Desk after an intern is activated.
        </p>
      </main>
    );
  }

  const [interns, managers, supervisors, seats, historyRows, cohortDefaults] = await Promise.all([
    listInterns(),
    listSelectableInternshipStaff("manager"),
    listSelectableInternshipStaff("supervisor"),
    supabaseAdmin
      .from("profiles")
      .select("id,email,full_name")
      .in("email", [SPRING_2027_MANAGER_EMAIL, SPRING_2027_SUPERVISOR_EMAIL]),
    supabaseAdmin
      .from("internship_assignment_events")
      .select("id,summary,created_at")
      .order("created_at", { ascending: false })
      .limit(12),
    supabaseAdmin
      .from("internship_cohorts")
      .select("default_manager_user_id,default_supervisor_user_id")
      .eq("name", "Spring 2027 Cohort")
      .limit(1)
      .maybeSingle(),
  ]);

  const resolved = (seats.data || []).map((row) => ({
    id: String(row.id || ""),
    email: String(row.email || ""),
    name: String(row.full_name || row.email || "Staff"),
  }));
  const ava = resolveStaffSeat(resolved, SPRING_2027_MANAGER_EMAIL);
  const jason = resolveStaffSeat(resolved, SPRING_2027_SUPERVISOR_EMAIL);
  const managerOptions = managers.map((person) => ({
    id: person.id,
    label: internshipStaffOptionLabel(person),
  }));
  const supervisorOptions = supervisors.map((person) => ({
    id: person.id,
    label: internshipStaffOptionLabel(person),
  }));
  if (ava && !managerOptions.some((option) => option.id === ava.id)) {
    managerOptions.unshift({ id: ava.id, label: `Ava Venezia — ${ava.email}` });
  }
  if (jason && !supervisorOptions.some((option) => option.id === jason.id)) {
    supervisorOptions.unshift({ id: jason.id, label: `Jason Graff — ${jason.email}` });
  }

  const defaults = cohortDefaults.data;
  return (
    <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <p className="text-sm font-bold text-slate-500">
        <Link href="/admin/hr" className="text-[#0D5C3A]">Hiring & People</Link>
        {" / "}
        <Link href="/admin/internship" className="text-[#0D5C3A]">Internship Management</Link>
        {" / Assign Manager"}
      </p>
      <h1 className="text-3xl font-black text-slate-950">Assign manager</h1>
      <p className="max-w-3xl text-sm font-semibold leading-6 text-slate-600">
        Super Admin owns onboarding. Assigning Ava stores the manager now and leaves prospective interns off her active desk until you activate them.
      </p>
      {ok ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{ok}</p> : null}
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</p> : null}
      <AssignManagerDesk
        returnTo={returnTo}
        interns={interns.map((intern) => ({
          id: intern.id,
          name: intern.preferredName || intern.fullName,
          email: intern.email,
          semester: intern.semester,
          status: intern.status,
          portalEnabled: intern.portalEnabled,
          managerUserId: intern.managerUserId || "",
          managerName: intern.managerName || "",
          supervisorUserId: intern.supervisorUserId || "",
          supervisorName: intern.supervisorName || "",
        }))}
        managers={managerOptions}
        supervisors={supervisorOptions}
        defaultManagerId={String(defaults?.default_manager_user_id || ava?.id || "")}
        defaultSupervisorId={String(defaults?.default_supervisor_user_id || jason?.id || "")}
        history={(historyRows.data || []).map((row) => ({
          id: String(row.id),
          summary: String(row.summary || "Assignment updated"),
          when: String(row.created_at || "").slice(0, 10),
        }))}
      />
    </main>
  );
}
