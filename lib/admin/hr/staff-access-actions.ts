"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { GROWTH_HIRE_ROLE, GROWTH_HIRE_TITLE } from "@/lib/admin/growth/hire";
import { getPublicSiteUrl } from "@/lib/admin/growth/constants";
import { staffAccessPath } from "@/lib/admin/hr/staff-access";
import { supabaseAdmin } from "@/lib/supabase/admin";

function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function bounce(userId: string, kind: "ok" | "error", message: string): never {
  const qs = new URLSearchParams({ [kind]: message });
  redirect(`${staffAccessPath(userId)}?${qs.toString()}`);
}

async function requireStaffAdmin() {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin || !actor.isSuperUser || !actor.canManageRoles) {
    return null;
  }
  return actor;
}

async function writeAudit(
  actor: { id: string; email: string },
  action: string,
  userId: string,
  metadata?: Record<string, unknown>,
) {
  try {
    await supabaseAdmin.from("admin_audit_logs").insert({
      actor_id: actor.id,
      actor_email: actor.email,
      action,
      area: "hr",
      target_type: "staff_access",
      target_id: userId,
      metadata: metadata || {},
    });
  } catch {
    // optional
  }
}

export async function setStaffManagerPortalAccess(formData: FormData) {
  const actor = await requireStaffAdmin();
  if (!actor) bounce(field(formData, "userId") || "unknown", "error", "Only a Super Admin can change Manager Portal access.");

  const userId = field(formData, "userId");
  const enable = field(formData, "enable") === "1";
  if (!userId) bounce(userId || "unknown", "error", "Missing staff account.");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id,email,full_name")
    .eq("id", userId)
    .maybeSingle();
  const email = String(profile?.email || "").trim().toLowerCase();
  if (!email) bounce(userId, "error", "This staff account has no verified email.");

  const now = new Date().toISOString();
  const { data: existing } = await supabaseAdmin
    .from("admin_user_access")
    .select("id")
    .eq("user_id", userId)
    .eq("role_key", GROWTH_HIRE_ROLE)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabaseAdmin
      .from("admin_user_access")
      .update({
        is_active: enable,
        deactivated_at: enable ? null : now,
        updated_at: now,
      })
      .eq("id", existing.id);
    if (error) bounce(userId, "error", error.message);
  } else if (enable) {
    const { error } = await supabaseAdmin.from("admin_user_access").insert({
      user_id: userId,
      email,
      department_key: "sales_marketing",
      role_key: GROWTH_HIRE_ROLE,
      access_level: "editor",
      is_active: true,
      notes: "Manager Portal access managed from Staff Access & Roles.",
      assigned_by: actor.id,
      assigned_by_email: actor.email,
      assigned_at: now,
      updated_at: now,
      created_at: now,
    });
    if (error) bounce(userId, "error", error.message);
  }

  if (enable) {
    await supabaseAdmin.from("user_roles").upsert(
      { user_id: userId, role: GROWTH_HIRE_ROLE, updated_at: now },
      { onConflict: "user_id,role" },
    );
  } else {
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", GROWTH_HIRE_ROLE);
  }

  await writeAudit(actor, enable ? "enabled manager portal" : "disabled manager portal", userId, {
    email,
  });
  revalidatePath("/admin/hr");
  revalidatePath(staffAccessPath(userId));
  bounce(
    userId,
    "ok",
    enable
      ? "Manager Portal access is on. Pet Parent and Ambassador roles were left unchanged."
      : "Manager Portal access is off. Pet Parent and Ambassador roles were left unchanged.",
  );
}

export async function setStaffInternEligibility(formData: FormData) {
  const actor = await requireStaffAdmin();
  if (!actor) bounce(field(formData, "userId") || "unknown", "error", "Only a Super Admin can change intern eligibility.");

  const userId = field(formData, "userId");
  const enable = field(formData, "enable") === "1";
  if (!userId) bounce(userId || "unknown", "error", "Missing staff account.");

  const now = new Date().toISOString();
  const { data: current } = await supabaseAdmin
    .from("internship_staff_eligibility")
    .select("can_supervise_interns,job_title")
    .eq("user_id", userId)
    .maybeSingle();

  const { error } = await supabaseAdmin.from("internship_staff_eligibility").upsert(
    {
      user_id: userId,
      can_manage_interns: enable,
      can_supervise_interns: current?.can_supervise_interns === true,
      job_title: String(current?.job_title || GROWTH_HIRE_TITLE),
      updated_by: actor.id,
      updated_at: now,
    },
    { onConflict: "user_id" },
  );
  if (error) bounce(userId, "error", error.message);

  await writeAudit(
    actor,
    enable ? "enabled intern management eligibility" : "disabled intern management eligibility",
    userId,
  );
  revalidatePath("/admin/hr");
  revalidatePath(staffAccessPath(userId));
  bounce(
    userId,
    "ok",
    enable
      ? "Intern management eligibility is on. This is Assigned Intern Preview only — not a student intern login."
      : "Intern management eligibility is off.",
  );
}

export async function resendStaffRegistrationInvite(formData: FormData) {
  const actor = await requireStaffAdmin();
  if (!actor) bounce(field(formData, "userId") || "unknown", "error", "Only a Super Admin can send invitations.");

  const userId = field(formData, "userId");
  if (!userId) bounce(userId || "unknown", "error", "Missing staff account.");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email,full_name")
    .eq("id", userId)
    .maybeSingle();
  const email = String(profile?.email || "").trim().toLowerCase();
  if (!email.includes("@")) bounce(userId, "error", "No verified work email is on file.");

  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${getPublicSiteUrl()}/manager`,
    data: {
      full_name: String(profile?.full_name || GROWTH_HIRE_TITLE),
      role: GROWTH_HIRE_ROLE,
      signup_role: GROWTH_HIRE_ROLE,
      account_type: GROWTH_HIRE_ROLE,
      sitguru_role: GROWTH_HIRE_ROLE,
    },
  });

  if (error && !/already/i.test(error.message)) {
    bounce(userId, "error", error.message);
  }

  await writeAudit(actor, "sent staff registration invitation", userId, { email });
  revalidatePath(staffAccessPath(userId));
  bounce(
    userId,
    "ok",
    error && /already/i.test(error.message)
      ? "That login already exists. No duplicate account was created, and the password was not changed."
      : `Secure registration invitation sent to ${email}.`,
  );
}

export async function suspendStaffManagerAccess(formData: FormData) {
  const actor = await requireStaffAdmin();
  if (!actor) bounce(field(formData, "userId") || "unknown", "error", "Only a Super Admin can suspend staff access.");

  const userId = field(formData, "userId");
  const confirmed = field(formData, "confirm") === "SUSPEND";
  if (!userId) bounce(userId || "unknown", "error", "Missing staff account.");
  if (!confirmed) {
    bounce(userId, "error", "Type SUSPEND to confirm. Pet Parent and Ambassador access stay intact.");
  }

  const now = new Date().toISOString();
  await supabaseAdmin
    .from("admin_user_access")
    .update({ is_active: false, deactivated_at: now, updated_at: now })
    .eq("user_id", userId)
    .eq("role_key", GROWTH_HIRE_ROLE);

  await supabaseAdmin
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", GROWTH_HIRE_ROLE);

  const { data: current } = await supabaseAdmin
    .from("internship_staff_eligibility")
    .select("can_supervise_interns,job_title")
    .eq("user_id", userId)
    .maybeSingle();
  if (current) {
    await supabaseAdmin.from("internship_staff_eligibility").upsert(
      {
        user_id: userId,
        can_manage_interns: false,
        can_supervise_interns: current.can_supervise_interns === true,
        job_title: String(current.job_title || GROWTH_HIRE_TITLE),
        updated_by: actor.id,
        updated_at: now,
      },
      { onConflict: "user_id" },
    );
  }

  await writeAudit(actor, "suspended manager staff access", userId, {
    preserved: ["pet_parent", "ambassador"],
  });
  revalidatePath("/admin/hr");
  revalidatePath(staffAccessPath(userId));
  bounce(
    userId,
    "ok",
    "Manager Portal and intern eligibility are suspended. Pet Parent and Ambassador access were preserved.",
  );
}
