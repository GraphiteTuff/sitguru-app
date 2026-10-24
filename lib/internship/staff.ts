import { supabaseAdmin } from "@/lib/supabase/admin";
import { isEligibleInternshipManagerRole } from "@/lib/internship/assignment";
import {
  canSelectInternshipManager,
  canSelectInternshipSupervisor,
  type InternshipStaffIdentity,
} from "@/lib/internship/staff-eligibility";
import type { InternshipIntern } from "@/lib/internship/types";

export type InternshipStaffPerson = InternshipStaffIdentity;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function nameFrom(row: Record<string, unknown>) {
  const full = text(row.full_name) || text(row.name);
  if (full) return full;
  return `${text(row.first_name)} ${text(row.last_name)}`.trim();
}

function asIdentity(row: Record<string, unknown>, eligibility?: Record<string, unknown> | null): InternshipStaffIdentity {
  const active = row.is_active !== false && row.deleted_at == null && row.disabled_at == null;
  return {
    id: text(row.id) || text(row.user_id),
    name: nameFrom(row),
    email: text(row.email).toLowerCase(),
    role: text(row.role) || text(row.role_key),
    jobTitle: text(eligibility?.job_title),
    active,
    isTest: row.is_test === true || row.is_test_account === true,
    canManageInterns: eligibility?.can_manage_interns === true,
    canSuperviseInterns: eligibility?.can_supervise_interns === true,
  };
}

async function eligibilityByUser(ids: string[]) {
  if (!ids.length) return new Map<string, Record<string, unknown>>();
  const { data, error } = await supabaseAdmin
    .from("internship_staff_eligibility")
    .select("user_id,can_manage_interns,can_supervise_interns,job_title")
    .in("user_id", ids);
  if (error) return new Map<string, Record<string, unknown>>();
  return new Map((data || []).map((row) => [text(row.user_id), row as Record<string, unknown>]));
}

async function profileRows(ids: string[]) {
  if (!ids.length) return [] as Record<string, unknown>[];
  const rich = await supabaseAdmin
    .from("profiles")
    .select("id,email,full_name,first_name,last_name,role,is_active,is_test")
    .in("id", ids);
  if (!rich.error) return (rich.data || []) as Record<string, unknown>[];
  const basic = await supabaseAdmin
    .from("profiles")
    .select("id,email,full_name,first_name,last_name,role,is_active")
    .in("id", ids);
  return (basic.data || []) as Record<string, unknown>[];
}

export async function listInternshipStaffDirectory(): Promise<InternshipStaffPerson[]> {
  const [access, admins, flagged] = await Promise.all([
    supabaseAdmin.from("admin_user_access").select("user_id,email,role_key,is_active").eq("is_active", true).limit(200),
    supabaseAdmin.from("admin_users").select("user_id,email,role,is_active").eq("is_active", true).limit(200),
    supabaseAdmin.from("internship_staff_eligibility").select("user_id,can_manage_interns,can_supervise_interns,job_title").limit(200),
  ]);
  const ids = new Set<string>();
  for (const row of access.data || []) {
    if (isEligibleInternshipManagerRole(text(row.role_key))) ids.add(text(row.user_id));
  }
  for (const row of admins.data || []) {
    if (isEligibleInternshipManagerRole(text(row.role))) ids.add(text(row.user_id));
  }
  for (const row of flagged.data || []) ids.add(text(row.user_id));
  const profiles = await profileRows([...ids].filter(Boolean));
  const flags = new Map((flagged.data || []).map((row) => [text(row.user_id), row as Record<string, unknown>]));
  const people = new Map<string, InternshipStaffPerson>();
  for (const row of profiles) {
    const id = text(row.id);
    if (!id) continue;
    people.set(id, asIdentity(row, flags.get(id)));
  }
  for (const row of access.data || []) {
    const id = text(row.user_id);
    if (!id || people.has(id)) continue;
    people.set(id, asIdentity({ ...row, id, role: row.role_key }, flags.get(id)));
  }
  return [...people.values()].sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));
}

export async function listSelectableInternshipStaff(kind: "manager" | "supervisor") {
  const directory = await listInternshipStaffDirectory();
  return directory.filter((person) =>
    kind === "manager" ? canSelectInternshipManager(person) : canSelectInternshipSupervisor(person),
  );
}

export async function loadInternshipStaffGate(userId: string | null | undefined) {
  if (!userId) return null;
  const profiles = await profileRows([userId]);
  const flags = await eligibilityByUser([userId]);
  const row = profiles[0];
  if (!row) return null;
  return asIdentity(row, flags.get(userId));
}

export async function attachInternshipStaff(intern: InternshipIntern) {
  const ids = [intern.managerUserId, intern.supervisorUserId].filter(Boolean) as string[];
  const profiles = await profileRows(ids);
  const flags = await eligibilityByUser(ids);
  const byId = new Map(profiles.map((row) => [text(row.id), asIdentity(row, flags.get(text(row.id)))]));
  const manager = intern.managerUserId ? byId.get(intern.managerUserId) : null;
  const supervisor = intern.supervisorUserId ? byId.get(intern.supervisorUserId) : null;
  let departmentName = intern.departmentName || "";
  if (intern.departmentId) {
    const { data: department } = await supabaseAdmin
      .from("internship_departments")
      .select("name")
      .eq("id", intern.departmentId)
      .maybeSingle();
    departmentName = text(department?.name) || departmentName;
  }
  return {
    ...intern,
    managerName: manager?.name || intern.managerName || "",
    managerTitle: manager?.jobTitle || intern.managerTitle || "",
    supervisorName: supervisor?.name || intern.supervisorName || "",
    supervisorTitle: supervisor?.jobTitle || intern.supervisorTitle || "",
    departmentName,
  };
}

export async function listInternshipDepartments() {
  const { data, error } = await supabaseAdmin
    .from("internship_departments")
    .select("id,name,slug,is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) return [] as { id: string; name: string; slug: string }[];
  return (data || []).map((row) => ({
    id: text(row.id),
    name: text(row.name),
    slug: text(row.slug),
  }));
}
