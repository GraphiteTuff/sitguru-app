import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  isEligibleInternshipManagerRole,
  staffRoleLabel,
} from "@/lib/internship/assignment";
import type { InternshipIntern } from "@/lib/internship/types";

export type InternshipStaffPerson = {
  id: string;
  name: string;
  email: string;
  role: string;
  title: string;
  active: boolean;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function nameFrom(row: Record<string, unknown>) {
  const full = text(row.full_name) || text(row.name);
  if (full) return full;
  const combined = `${text(row.first_name)} ${text(row.last_name)}`.trim();
  if (combined) return combined;
  const email = text(row.email);
  return email ? email.split("@")[0] : "SitGuru staff";
}

export async function listEligibleInternshipStaff(): Promise<InternshipStaffPerson[]> {
  const [access, admins, profiles] = await Promise.all([
    supabaseAdmin
      .from("admin_user_access")
      .select("user_id,email,role_key,is_active")
      .eq("is_active", true)
      .limit(200),
    supabaseAdmin
      .from("admin_users")
      .select("user_id,email,role,is_active")
      .eq("is_active", true)
      .limit(200),
    supabaseAdmin
      .from("profiles")
      .select("id,email,full_name,first_name,last_name,role,is_active")
      .limit(400),
  ]);

  const people = new Map<string, InternshipStaffPerson>();
  const consider = (
    id: string,
    email: string,
    role: string,
    active: boolean,
    row: Record<string, unknown>,
  ) => {
    if (!id || !isEligibleInternshipManagerRole(role) || active === false) return;
    const current = people.get(id);
    const next: InternshipStaffPerson = {
      id,
      name: nameFrom({ ...row, email }),
      email: email.toLowerCase(),
      role,
      title: staffRoleLabel(role),
      active: true,
    };
    if (!current || next.name.length > current.name.length) people.set(id, next);
  };

  for (const row of access.data || []) {
    consider(text(row.user_id), text(row.email), text(row.role_key), row.is_active !== false, row);
  }
  for (const row of admins.data || []) {
    consider(text(row.user_id), text(row.email), text(row.role), row.is_active !== false, row);
  }
  for (const row of profiles.data || []) {
    consider(text(row.id), text(row.email), text(row.role), row.is_active !== false, row);
  }

  const missingNames = [...people.values()].filter((person) => person.name === person.email.split("@")[0]);
  if (missingNames.length) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id,email,full_name,first_name,last_name")
      .in("id", missingNames.map((person) => person.id));
    for (const row of data || []) {
      const person = people.get(text(row.id));
      if (!person) continue;
      const name = nameFrom(row);
      if (name) person.name = name;
    }
  }

  return [...people.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function staffPersonById(userId: string | null | undefined) {
  if (!userId) return null;
  const people = await listEligibleInternshipStaff();
  return people.find((person) => person.id === userId) || null;
}

export async function attachInternshipStaff(intern: InternshipIntern) {
  const ids = [intern.managerUserId, intern.supervisorUserId].filter(Boolean) as string[];
  if (!ids.length && !intern.departmentId) return intern;
  const { data } = ids.length
    ? await supabaseAdmin
        .from("profiles")
        .select("id,full_name,first_name,last_name,email,role,is_active")
        .in("id", ids)
    : { data: [] };
  const byId = new Map((data || []).map((row) => [text(row.id), row]));
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
    managerName: manager ? nameFrom(manager) : intern.managerName || "",
    managerTitle: manager ? staffRoleLabel(text(manager.role)) : intern.managerTitle || "",
    supervisorName: supervisor ? nameFrom(supervisor) : intern.supervisorName || "",
    supervisorTitle: supervisor ? staffRoleLabel(text(supervisor.role)) : intern.supervisorTitle || "",
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
