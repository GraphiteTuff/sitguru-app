import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AdminIdentity } from "@/lib/admin/access";
import { getPublicSiteUrl } from "@/lib/admin/growth/constants";

export const GROWTH_HIRE_ROLE = "social_community_manager";
export const GROWTH_HIRE_DEPARTMENT = "sales_marketing";
export const GROWTH_HIRE_TITLE = "Social & Community Manager";

export type GrowthHireRecord = {
  id: string;
  email: string;
  userId: string;
  name: string;
  status: string;
  notes: string;
  assignedAt: string | null;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function findAuthUserIdByEmail(email: string) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id,email,full_name,first_name,last_name")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();

  if (profile?.id) {
    return {
      userId: String(profile.id),
      name:
        text(profile.full_name) ||
        `${text(profile.first_name)} ${text(profile.last_name)}`.trim(),
    };
  }

  for (let page = 1; page <= 5; page += 1) {
    const response = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    const match = (response.data.users || []).find(
      (user) => text(user.email).toLowerCase() === email,
    );
    if (match?.id) {
      return { userId: match.id, name: text(match.user_metadata?.full_name) };
    }
    if ((response.data.users || []).length < 200) break;
  }

  return { userId: "", name: "" };
}

export async function listGrowthHires(): Promise<GrowthHireRecord[]> {
  const { data, error } = await supabaseAdmin
    .from("admin_user_access")
    .select("id,email,user_id,role_key,is_active,notes,assigned_at")
    .eq("role_key", GROWTH_HIRE_ROLE)
    .order("assigned_at", { ascending: false })
    .limit(40);

  if (error) {
    console.warn("Growth hire list skipped:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: text(row.id),
    email: text(row.email),
    userId: text(row.user_id),
    name: text(row.email).split("@")[0] || "Growth hire",
    status: row.is_active ? "active" : "inactive",
    notes: text(row.notes),
    assignedAt: text(row.assigned_at) || null,
  }));
}

export async function grantGrowthHireAccess(input: {
  actor: AdminIdentity;
  email: string;
  name?: string;
  notes?: string;
  location?: string;
  startDate?: string;
  invite?: boolean;
}) {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false as const, error: "Enter a real work email." };
  }

  let found = await findAuthUserIdByEmail(email);
  let invited = false;

  if (!found.userId && input.invite) {
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${getPublicSiteUrl()}/admin/growth`,
      data: {
        full_name: input.name || GROWTH_HIRE_TITLE,
        sitguru_role: GROWTH_HIRE_ROLE,
      },
    });

    if (error && !error.message.toLowerCase().includes("already")) {
      return { ok: false as const, error: error.message };
    }

    invited = !error;
    if (data?.user?.id) {
      found = { userId: data.user.id, name: input.name || found.name };
    } else {
      found = await findAuthUserIdByEmail(email);
    }
  }

  const now = new Date().toISOString();
  const payload = {
    user_id: found.userId || null,
    email,
    department_key: GROWTH_HIRE_DEPARTMENT,
    role_key: GROWTH_HIRE_ROLE,
    access_level: "editor",
    is_active: true,
    notes:
      input.notes ||
      "30-day contractor trial. Growth Portal only. Success = Pet Parent and Guru signups.",
    assigned_by: input.actor.id,
    assigned_by_email: input.actor.email,
    assigned_at: now,
    updated_at: now,
  };

  const { data: existing } = await supabaseAdmin
    .from("admin_user_access")
    .select("id")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  const write = existing?.id
    ? await supabaseAdmin.from("admin_user_access").update(payload).eq("id", existing.id)
    : await supabaseAdmin.from("admin_user_access").insert({
        ...payload,
        created_at: now,
      });

  if (write.error) {
    return { ok: false as const, error: write.error.message };
  }

  if (found.userId) {
    await supabaseAdmin.from("user_roles").upsert(
      {
        user_id: found.userId,
        role: GROWTH_HIRE_ROLE,
        updated_at: now,
      },
      { onConflict: "user_id,role" },
    );
  }

  try {
    await supabaseAdmin.from("hr_employees").insert({
      profile_id: found.userId || null,
      full_name: input.name || found.name || email.split("@")[0],
      department: GROWTH_HIRE_DEPARTMENT,
      role_title: GROWTH_HIRE_TITLE,
      employment_status: "contractor",
      location: input.location || "Remote US",
      start_date: input.startDate || now.slice(0, 10),
    });
  } catch (error) {
    console.warn("HR employee roster insert skipped:", error);
  }

  try {
    await supabaseAdmin.from("admin_audit_logs").insert({
      actor_id: input.actor.id,
      actor_email: input.actor.email,
      action: "hired growth manager",
      area: "hr",
      target_type: "admin_user_access",
      target_id: email,
      metadata: { email, user_id: found.userId || null, invited },
    });
  } catch {
    // Audit is optional.
  }

  return {
    ok: true as const,
    invited,
    userId: found.userId,
    email,
  };
}

export async function deactivateGrowthHire(email: string, actor: AdminIdentity) {
  const normalized = email.trim().toLowerCase();
  const now = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("admin_user_access")
    .update({
      is_active: false,
      deactivated_at: now,
      updated_at: now,
    })
    .eq("email", normalized)
    .eq("role_key", GROWTH_HIRE_ROLE);

  if (error) return { ok: false as const, error: error.message };

  const found = await findAuthUserIdByEmail(normalized);
  if (found.userId) {
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", found.userId)
      .eq("role", GROWTH_HIRE_ROLE);
  }

  try {
    await supabaseAdmin.from("admin_audit_logs").insert({
      actor_id: actor.id,
      actor_email: actor.email,
      action: "removed growth manager",
      area: "hr",
      target_type: "admin_user_access",
      target_id: normalized,
    });
  } catch {
    // optional
  }

  return { ok: true as const };
}
