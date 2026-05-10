import Link from "next/link";
import { revalidatePath } from "next/cache";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type GenericRow = Record<string, unknown>;

type AdminIdentity = {
  id: string;
  email: string;
  role: string;
  canAccessAdmin: boolean;
  canAccessFinancials: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canResetPasswords: boolean;
};

type AuthUserRow = {
  id: string;
  email: string;
  phone: string;
  createdAt: string;
  lastSignInAt: string;
  confirmedAt: string;
  role: string;
  appMetadata: Record<string, unknown>;
  userMetadata: Record<string, unknown>;
  factors: unknown[];
};

type DepartmentRow = {
  id?: string | null;
  department_key: string;
  name: string;
  description?: string | null;
  display_order?: number | string | null;
  is_active?: boolean | string | null;
};

type RoleRow = {
  id?: string | null;
  role_key: string;
  department_key: string;
  name: string;
  description?: string | null;
  access_level?: string | null;
  is_super_user?: boolean | string | null;
  can_manage_users?: boolean | string | null;
  can_manage_roles?: boolean | string | null;
  can_reset_passwords?: boolean | string | null;
  can_reset_mfa?: boolean | string | null;
  can_access_financials?: boolean | string | null;
  can_access_admin?: boolean | string | null;
  display_order?: number | string | null;
  is_active?: boolean | string | null;
};

type PermissionRow = {
  id?: string | null;
  role_key: string;
  permission_key: string;
  access_level: string;
};

type UserAssignmentRow = {
  id?: string | null;
  user_id?: string | null;
  email: string;
  department_key: string;
  role_key: string;
  access_level: string;
  is_active?: boolean | string | null;
  notes?: string | null;
  assigned_by_email?: string | null;
  assigned_at?: string | null;
};

type UserAccessRow = {
  id: string;
  email: string;
  phone: string;
  displayName: string;
  role: string;
  profileRole: string;
  adminRole: string;
  hqRoleKey: string;
  hqRoleName: string;
  departmentKey: string;
  departmentName: string;
  accessLevel: string;
  accountStatus: string;
  canAccessFinancials: boolean;
  canAccessAdmin: boolean;
  mfaEnabled: boolean;
  lastSignInAt: string;
  createdAt: string;
  confirmedAt: string;
  assignmentId: string;
};

type PermissionSummary = {
  roleKey: string;
  label: string;
  permissions: PermissionRow[];
};

const FALLBACK_DEPARTMENTS: DepartmentRow[] = [
  {
    department_key: "executive",
    name: "Executive / Founder",
    description: "Founder, CEO, owner, and super-user access across SitGuru.",
    display_order: 10,
    is_active: true,
  },
  {
    department_key: "operations",
    name: "Operations",
    description: "Bookings, Gurus, Pet Parents, programs, and day-to-day workflows.",
    display_order: 20,
    is_active: true,
  },
  {
    department_key: "hr_people",
    name: "HR / People",
    description: "User access, internal people support, roles, password support, and MFA workflows.",
    display_order: 30,
    is_active: true,
  },
  {
    department_key: "finance",
    name: "Billing & Finance",
    description: "Financial statements, Stripe, payouts, billing, reconciliation, and accounting controls.",
    display_order: 40,
    is_active: true,
  },
  {
    department_key: "sales_marketing",
    name: "Sales & Marketing",
    description: "Growth, sales, campaigns, partners, affiliates, referrals, and PawPerks programs.",
    display_order: 50,
    is_active: true,
  },
  {
    department_key: "customer_service",
    name: "Customer Service",
    description: "Support for Gurus, Pet Parents, bookings, messages, and customer issues.",
    display_order: 60,
    is_active: true,
  },
  {
    department_key: "trust_safety",
    name: "Trust & Safety",
    description: "Guru approvals, Checkr/background checks, screening plans, and safety readiness.",
    display_order: 70,
    is_active: true,
  },
  {
    department_key: "tech_support",
    name: "Tech Support",
    description: "System issues, login support, platform health, webhooks, integrations, and troubleshooting.",
    display_order: 80,
    is_active: true,
  },
  {
    department_key: "viewer",
    name: "Viewer / Read-Only",
    description: "Read-only access roles for leadership and department visibility.",
    display_order: 90,
    is_active: true,
  },
];

const FALLBACK_ROLES: RoleRow[] = [
  {
    role_key: "founder",
    department_key: "executive",
    name: "Founder / CEO",
    description: "Full super-user access for SitGuru founders and CEO.",
    access_level: "super_user",
    is_super_user: true,
    can_manage_users: true,
    can_manage_roles: true,
    can_reset_passwords: true,
    can_reset_mfa: true,
    can_access_financials: true,
    can_access_admin: true,
    display_order: 10,
    is_active: true,
  },
  {
    role_key: "owner",
    department_key: "executive",
    name: "Owner",
    description: "Full owner-level access across SitGuru.",
    access_level: "super_user",
    is_super_user: true,
    can_manage_users: true,
    can_manage_roles: true,
    can_reset_passwords: true,
    can_reset_mfa: true,
    can_access_financials: true,
    can_access_admin: true,
    display_order: 20,
    is_active: true,
  },
  {
    role_key: "super_admin",
    department_key: "executive",
    name: "Super Admin",
    description: "Full operational and system access across SitGuru.",
    access_level: "super_user",
    is_super_user: true,
    can_manage_users: true,
    can_manage_roles: true,
    can_reset_passwords: true,
    can_reset_mfa: true,
    can_access_financials: true,
    can_access_admin: true,
    display_order: 30,
    is_active: true,
  },
  {
    role_key: "operations_admin",
    department_key: "operations",
    name: "Operations Admin",
    description: "Full operations access across bookings, customers, Gurus, programs, and support workflows.",
    access_level: "manager",
    can_access_admin: true,
    display_order: 100,
    is_active: true,
  },
  {
    role_key: "hr_admin",
    department_key: "hr_people",
    name: "HR Admin",
    description: "Manages internal access support, password reset support, and MFA workflows.",
    access_level: "manager",
    can_manage_users: true,
    can_reset_passwords: true,
    can_reset_mfa: true,
    can_access_admin: true,
    display_order: 110,
    is_active: true,
  },
  {
    role_key: "finance_admin",
    department_key: "finance",
    name: "Finance Admin",
    description: "Full financial statements, billing, payouts, Stripe, and reconciliation access.",
    access_level: "manager",
    can_access_financials: true,
    can_access_admin: true,
    display_order: 120,
    is_active: true,
  },
  {
    role_key: "billing_admin",
    department_key: "finance",
    name: "Billing Admin",
    description: "Billing, payment, invoice, payout, and customer payment support.",
    access_level: "manager",
    can_access_financials: true,
    can_access_admin: true,
    display_order: 130,
    is_active: true,
  },
  {
    role_key: "sales_admin",
    department_key: "sales_marketing",
    name: "Sales Admin",
    description: "Sales channels, partners, affiliates, referrals, and campaigns.",
    access_level: "manager",
    can_access_admin: true,
    display_order: 200,
    is_active: true,
  },
  {
    role_key: "marketing_admin",
    department_key: "sales_marketing",
    name: "Marketing Admin",
    description: "Marketing programs, campaign reporting, analytics, and growth content.",
    access_level: "manager",
    can_access_admin: true,
    display_order: 210,
    is_active: true,
  },
  {
    role_key: "support_admin",
    department_key: "customer_service",
    name: "Support Admin",
    description: "Full customer service support across Gurus, Pet Parents, bookings, and messages.",
    access_level: "manager",
    can_reset_passwords: true,
    can_access_admin: true,
    display_order: 300,
    is_active: true,
  },
  {
    role_key: "customer_service",
    department_key: "customer_service",
    name: "Customer Service",
    description: "Support role for Pet Parents, Gurus, bookings, disputes, and messages.",
    access_level: "editor",
    can_reset_passwords: true,
    can_access_admin: true,
    display_order: 310,
    is_active: true,
  },
  {
    role_key: "trust_safety_admin",
    department_key: "trust_safety",
    name: "Trust & Safety Admin",
    description: "Full Trust & Safety, Guru approvals, Checkr, and background check management.",
    access_level: "manager",
    can_access_admin: true,
    display_order: 400,
    is_active: true,
  },
  {
    role_key: "tech_support_admin",
    department_key: "tech_support",
    name: "Tech Support Admin",
    description: "Senior technical support for logins, integrations, webhooks, system health, and MFA support.",
    access_level: "manager",
    can_reset_passwords: true,
    can_reset_mfa: true,
    can_access_admin: true,
    display_order: 500,
    is_active: true,
  },
  {
    role_key: "technical_support",
    department_key: "tech_support",
    name: "Technical Support",
    description: "Platform support for login issues, bugs, system errors, and integration troubleshooting.",
    access_level: "editor",
    can_reset_passwords: true,
    can_access_admin: true,
    display_order: 510,
    is_active: true,
  },
  {
    role_key: "systems_admin",
    department_key: "tech_support",
    name: "Systems Admin",
    description: "Technical systems administration for webhooks, integrations, health checks, and platform configuration.",
    access_level: "manager",
    can_reset_passwords: true,
    can_reset_mfa: true,
    can_access_admin: true,
    display_order: 520,
    is_active: true,
  },
  {
    role_key: "executive_viewer",
    department_key: "viewer",
    name: "Executive Viewer",
    description: "Read-only executive view across major operating areas.",
    access_level: "viewer",
    can_access_admin: true,
    display_order: 900,
    is_active: true,
  },
  {
    role_key: "finance_viewer",
    department_key: "viewer",
    name: "Finance Viewer",
    description: "Read-only financial access.",
    access_level: "viewer",
    can_access_financials: true,
    can_access_admin: true,
    display_order: 910,
    is_active: true,
  },
];

const DEFAULT_PERMISSION_LABELS: Record<string, string> = {
  "*": "Everything",
  "dashboard.view": "Dashboard",
  "users.view": "Users View",
  "users.manage": "Users Manage",
  "users.password_reset": "Password Reset",
  "users.mfa_reset": "MFA Reset",
  "roles.limited_manage": "Limited Role Management",
  "bookings.manage": "Bookings Manage",
  "customers.manage": "Pet Parents Manage",
  "gurus.manage": "Gurus Manage",
  "gurus.support": "Guru Support",
  "gurus.approve": "Guru Approvals",
  "messages.manage": "Messages Manage",
  "trust_safety.manage": "Trust & Safety Manage",
  "trust_safety.view": "Trust & Safety View",
  "trust_safety.finance_view": "Trust & Safety Financial View",
  "financials.manage": "Financials Manage",
  "financials.view": "Financials View",
  "financials.summary_view": "Financial Summary",
  "financials.export": "Financial Export",
  "financials.reconcile": "Reconciliation",
  "payouts.manage": "Payouts",
  "commissions.manage": "Commissions",
  "partners.manage": "Partners Manage",
  "partners.view": "Partners View",
  "programs.manage": "Programs",
  "marketing.manage": "Marketing",
  "analytics.marketing_view": "Marketing Analytics",
  "system_health.view": "System Health View",
  "system_health.manage": "System Health Manage",
  "webhooks.view": "Webhooks View",
  "webhooks.manage": "Webhooks Manage",
  "integrations.view": "Integrations View",
  "integrations.manage": "Integrations Manage",
  "audit.technical_view": "Technical Audit",
  "audit.hr_view": "HR Audit",
  "disputes.manage": "Disputes",
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getOptionalBoolean(value: unknown) {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "1"].includes(normalized)) return true;
    if (["false", "no", "0"].includes(normalized)) return false;
  }

  return false;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getSiteUrl() {
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";

  if (siteUrl.startsWith("http://") || siteUrl.startsWith("https://")) {
    return siteUrl.replace(/\/$/, "");
  }

  return `https://${siteUrl.replace(/\/$/, "")}`;
}

function getEnvAdminEmails() {
  return String(
    process.env.SITGURU_FINANCE_ADMIN_EMAILS ||
      process.env.ADMIN_EMAILS ||
      process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
      "",
  )
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function hasSuperUserRole(role: string) {
  return ["founder", "owner", "super_admin"].includes(role.trim().toLowerCase());
}

function hasAdminRole(role: string) {
  return [
    "founder",
    "owner",
    "super_admin",
    "admin",
    "operations_admin",
    "hr_admin",
    "finance_admin",
    "billing_admin",
    "bookkeeper",
    "accounting",
    "sales_admin",
    "marketing_admin",
    "partner_admin",
    "support_admin",
    "customer_service",
    "trust_safety_admin",
    "guru_approvals_admin",
    "tech_support_admin",
    "technical_support",
    "systems_admin",
    "developer_admin",
    "executive_viewer",
    "finance_viewer",
    "support_viewer",
    "marketing_viewer",
  ].includes(role.trim().toLowerCase());
}

function hasFinancialRole(role: string) {
  return [
    "founder",
    "owner",
    "super_admin",
    "finance_admin",
    "billing_admin",
    "bookkeeper",
    "accounting",
    "finance_viewer",
  ].includes(role.trim().toLowerCase());
}

function roleCanResetPasswords(role?: RoleRow | null, roleKey?: string) {
  if (!role && roleKey) {
    return ["founder", "owner", "super_admin", "hr_admin", "support_admin", "customer_service", "tech_support_admin", "technical_support", "systems_admin"].includes(roleKey);
  }

  return getOptionalBoolean(role?.can_reset_passwords) || hasSuperUserRole(asTrimmedString(role?.role_key));
}

function getAccessLabel(value: string) {
  const normalized = value.trim().toLowerCase().replaceAll("_", " ");

  if (!normalized) return "Viewer";
  return normalized
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getRoleLabel(value: string) {
  return getAccessLabel(value);
}

function getDepartmentName(departments: DepartmentRow[], departmentKey: string) {
  return (
    departments.find((department) => department.department_key === departmentKey)
      ?.name || getRoleLabel(departmentKey)
  );
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Admin settings query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as unknown as T[]) : [];
  } catch (error) {
    console.warn(`Admin settings query skipped for ${label}:`, error);
    return [];
  }
}

async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const userEmail = (user.email || "").toLowerCase();
  const envAdminEmails = getEnvAdminEmails();

  const [adminAccessRows, adminUsers, profiles, users] = await Promise.all([
    safeRows<UserAssignmentRow>(
      supabaseAdmin
        .from("admin_user_access")
        .select("*")
        .eq("email", userEmail)
        .eq("is_active", true)
        .limit(1),
      "admin_user_access_current_identity",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("admin_users")
        .select("role,email,is_active,can_access_financials")
        .eq("user_id", user.id)
        .limit(1),
      "admin_users_current_identity",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("profiles")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "profiles_current_identity",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("users")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "users_current_identity",
    ),
  ]);

  const hqAccess = adminAccessRows[0];
  const profile = [...adminUsers, ...profiles, ...users].find(Boolean) || {};
  const role =
    asTrimmedString(hqAccess?.role_key) || asTrimmedString(profile.role) || "admin";
  const active =
    profile.is_active === undefined
      ? true
      : getOptionalBoolean(profile.is_active);
  const explicitFinanceAccess = getOptionalBoolean(
    profile.can_access_financials,
  );
  const envAllowed = envAdminEmails.includes(userEmail);
  const superUser = hasSuperUserRole(role) || envAllowed;

  return {
    id: user.id,
    email: userEmail,
    role,
    canAccessAdmin: active && (superUser || hasAdminRole(role)),
    canAccessFinancials:
      active && (superUser || hasFinancialRole(role) || explicitFinanceAccess),
    canManageUsers:
      active &&
      (superUser || role === "hr_admin" || role === "tech_support_admin"),
    canManageRoles: active && superUser,
    canResetPasswords:
      active &&
      (superUser ||
        role === "hr_admin" ||
        role === "support_admin" ||
        role === "customer_service" ||
        role === "tech_support_admin" ||
        role === "technical_support" ||
        role === "systems_admin"),
  };
}

async function writeAdminSettingsAuditLog({
  actor,
  action,
  targetType,
  targetId,
  metadata,
}: {
  actor: AdminIdentity;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  const payload = {
    actor_id: actor.id,
    actor_email: actor.email,
    actor_role: actor.role,
    action,
    area: "admin.settings",
    target_type: targetType,
    target_id: targetId || null,
    metadata: metadata || {},
    created_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabaseAdmin
      .from("admin_audit_logs")
      .insert(payload);

    if (!error) return;
  } catch {
    // Keep Admin Settings actions from failing if audit tables are not ready.
  }

  try {
    await supabaseAdmin.from("financial_audit_logs").insert(payload);
  } catch (error) {
    console.warn("Admin settings audit log skipped:", error);
  }
}

async function sendPasswordReset(formData: FormData) {
  "use server";

  const actor = await getAdminIdentity();

  if (!actor?.canResetPasswords) return;

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  if (!email) return;

  const redirectTo = `${getSiteUrl()}/login?reset=password`;

  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  await writeAdminSettingsAuditLog({
    actor,
    action: error ? "password_reset_email_failed" : "password_reset_email_sent",
    targetType: "auth_user",
    targetId: email,
    metadata: {
      email,
      redirect_to: redirectTo,
      error: error?.message || null,
    },
  });

  revalidatePath("/admin/settings");
}

async function assignHqAccess(formData: FormData) {
  "use server";

  const actor = await getAdminIdentity();

  if (!actor?.canManageUsers) return;

  const userId = String(formData.get("userId") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const roleKey = String(formData.get("roleKey") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!email || !roleKey) return;

  const roleRows = await safeRows<RoleRow>(
    supabaseAdmin
      .from("admin_roles")
      .select("*")
      .eq("role_key", roleKey)
      .limit(1),
    "admin_roles_assign_lookup",
  );

  const role =
    roleRows[0] || FALLBACK_ROLES.find((candidate) => candidate.role_key === roleKey);

  if (!role) return;

  const payload = {
    user_id: userId || null,
    email,
    department_key: role.department_key,
    role_key: role.role_key,
    access_level: asTrimmedString(role.access_level) || "viewer",
    is_active: true,
    notes,
    assigned_by: actor.id,
    assigned_by_email: actor.email,
    assigned_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const existingRows = await safeRows<UserAssignmentRow>(
    supabaseAdmin
      .from("admin_user_access")
      .select("id")
      .eq("email", email)
      .limit(1),
    "admin_user_access_existing_assignment",
  );

  if (existingRows[0]?.id) {
    await supabaseAdmin
      .from("admin_user_access")
      .update(payload)
      .eq("id", existingRows[0].id);
  } else {
    await supabaseAdmin.from("admin_user_access").insert({
      ...payload,
      created_at: new Date().toISOString(),
    });
  }

  const adminPayload = {
    user_id: userId || null,
    email,
    role: role.role_key,
    is_active: true,
    can_access_financials:
      getOptionalBoolean(role.can_access_financials) || hasFinancialRole(role.role_key),
  };

  try {
    const existingAdmin = await safeRows<GenericRow>(
      supabaseAdmin
        .from("admin_users")
        .select("id,user_id,email")
        .eq("email", email)
        .limit(1),
      "admin_users_existing_assignment",
    );

    if (existingAdmin[0]?.id) {
      await supabaseAdmin
        .from("admin_users")
        .update(adminPayload)
        .eq("id", existingAdmin[0].id);
    } else {
      await supabaseAdmin.from("admin_users").insert(adminPayload);
    }
  } catch (error) {
    console.warn("admin_users mirror update skipped:", error);
  }

  await writeAdminSettingsAuditLog({
    actor,
    action: "hq_access_assigned",
    targetType: "admin_user_access",
    targetId: email,
    metadata: {
      email,
      user_id: userId || null,
      role_key: role.role_key,
      department_key: role.department_key,
      access_level: payload.access_level,
      notes,
    },
  });

  revalidatePath("/admin/settings");
}

async function deactivateHqAccess(formData: FormData) {
  "use server";

  const actor = await getAdminIdentity();

  if (!actor?.canManageUsers) return;

  const accessId = String(formData.get("accessId") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!accessId && !email) return;

  const updatePayload = {
    is_active: false,
    deactivated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (accessId) {
    await supabaseAdmin
      .from("admin_user_access")
      .update(updatePayload)
      .eq("id", accessId);
  } else {
    await supabaseAdmin
      .from("admin_user_access")
      .update(updatePayload)
      .eq("email", email);
  }

  try {
    await supabaseAdmin
      .from("admin_users")
      .update({ is_active: false })
      .eq("email", email);
  } catch (error) {
    console.warn("admin_users deactivate skipped:", error);
  }

  await writeAdminSettingsAuditLog({
    actor,
    action: "hq_access_deactivated",
    targetType: "admin_user_access",
    targetId: accessId || email,
    metadata: { email },
  });

  revalidatePath("/admin/settings");
}

function getRoleBadgeClass(role: string) {
  const normalized = role.toLowerCase();

  if (["founder", "owner", "super_admin"].includes(normalized)) {
    return "border-purple-200 bg-purple-50 text-purple-700";
  }

  if (normalized.includes("finance") || normalized.includes("billing")) {
    return "border-indigo-200 bg-indigo-50 text-indigo-700";
  }

  if (normalized.includes("tech") || normalized.includes("system")) {
    return "border-cyan-200 bg-cyan-50 text-cyan-700";
  }

  if (normalized.includes("trust") || normalized.includes("safety")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized.includes("support") || normalized.includes("service")) {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (normalized.includes("marketing") || normalized.includes("sales")) {
    return "border-pink-200 bg-pink-50 text-pink-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getDepartmentClass(departmentKey: string) {
  if (departmentKey === "executive") return "border-purple-200 bg-purple-50 text-purple-700";
  if (departmentKey === "finance") return "border-indigo-200 bg-indigo-50 text-indigo-700";
  if (departmentKey === "tech_support") return "border-cyan-200 bg-cyan-50 text-cyan-700";
  if (departmentKey === "trust_safety") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (departmentKey === "customer_service") return "border-sky-200 bg-sky-50 text-sky-700";
  if (departmentKey === "sales_marketing") return "border-pink-200 bg-pink-50 text-pink-700";
  if (departmentKey === "hr_people") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getStatusClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "active" || normalized === "confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "unconfirmed") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalized === "suspended" || normalized === "locked") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getSystemCheckStatus(value: boolean) {
  return value ? "Ready" : "Missing";
}

function getSystemCheckClass(value: boolean) {
  return value
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-amber-200 bg-amber-50 text-amber-700";
}

function Pill({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${className}`}
    >
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {detail}
      </p>
    </div>
  );
}

function SettingsCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50"
    >
      <h3 className="text-xl font-black tracking-tight text-slate-950">
        {title}
      </h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {description}
      </p>
      <p className="mt-4 text-sm font-black text-emerald-700">Open →</p>
    </Link>
  );
}

function DepartmentCard({
  department,
  roleCount,
  userCount,
}: {
  department: DepartmentRow;
  roleCount: number;
  userCount: number;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-black text-slate-950">{department.name}</h3>
        <Pill className={getDepartmentClass(department.department_key)}>
          {department.department_key.replaceAll("_", " ")}
        </Pill>
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        {department.description || "SitGuru HQ department."}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-100 bg-[#fbfefd] p-3">
          <p className="text-xl font-black text-slate-950">{roleCount}</p>
          <p className="text-xs font-bold text-slate-500">Roles</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-[#fbfefd] p-3">
          <p className="text-xl font-black text-slate-950">{userCount}</p>
          <p className="text-xs font-bold text-slate-500">Assigned</p>
        </div>
      </div>
    </div>
  );
}

function AssignAccessForm({
  user,
  roles,
  disabled,
}: {
  user: UserAccessRow;
  roles: RoleRow[];
  disabled: boolean;
}) {
  return (
    <form action={assignHqAccess} className="grid gap-2">
      <input type="hidden" name="userId" value={user.id} />
      <input type="hidden" name="email" value={user.email} />

      <select
        name="roleKey"
        defaultValue={user.hqRoleKey || ""}
        disabled={disabled}
        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
      >
        <option value="">Choose HQ role...</option>
        {roles.map((role) => (
          <option key={role.role_key} value={role.role_key}>
            {role.name} — {getAccessLabel(asTrimmedString(role.access_level) || "viewer")}
          </option>
        ))}
      </select>

      <input
        name="notes"
        placeholder="Optional access note"
        disabled={disabled}
        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
      />

      <button
        type="submit"
        disabled={disabled}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Assign / Update Access
      </button>
    </form>
  );
}

function UserAccessTable({
  users,
  roles,
  canManageUsers,
  canResetPasswords,
}: {
  users: UserAccessRow[];
  roles: RoleRow[];
  canManageUsers: boolean;
  canResetPasswords: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[1460px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-4 text-xs font-black uppercase tracking-[0.18em]">
                User
              </th>
              <th className="px-4 py-4 text-xs font-black uppercase tracking-[0.18em]">
                HQ Department
              </th>
              <th className="px-4 py-4 text-xs font-black uppercase tracking-[0.18em]">
                HQ Role
              </th>
              <th className="px-4 py-4 text-xs font-black uppercase tracking-[0.18em]">
                Access
              </th>
              <th className="px-4 py-4 text-xs font-black uppercase tracking-[0.18em]">
                Security
              </th>
              <th className="px-4 py-4 text-xs font-black uppercase tracking-[0.18em]">
                Assign Role
              </th>
              <th className="px-4 py-4 text-xs font-black uppercase tracking-[0.18em]">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {users.length ? (
              users.map((user) => (
                <tr key={user.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <p className="font-black text-slate-950">{user.displayName}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {user.email}
                    </p>
                    <p className="mt-1 break-all text-[11px] font-semibold text-slate-400">
                      {user.id}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Last sign in: {formatDate(user.lastSignInAt)}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <Pill className={getDepartmentClass(user.departmentKey)}>
                      {user.departmentName}
                    </Pill>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <Pill className={getRoleBadgeClass(user.hqRoleKey || user.role)}>
                        {user.hqRoleName}
                      </Pill>
                      <p className="text-xs font-semibold text-slate-500">
                        Legacy role: {user.role}
                      </p>
                      {user.adminRole !== "—" ? (
                        <p className="text-xs font-semibold text-slate-500">
                          Admin: {user.adminRole}
                        </p>
                      ) : null}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <Pill
                        className={
                          user.accessLevel === "super_user"
                            ? "border-purple-200 bg-purple-50 text-purple-700"
                            : "border-slate-200 bg-slate-50 text-slate-700"
                        }
                      >
                        {getAccessLabel(user.accessLevel)}
                      </Pill>
                      <Pill
                        className={
                          user.canAccessAdmin
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        }
                      >
                        {user.canAccessAdmin ? "Admin Access" : "No Admin"}
                      </Pill>
                      <Pill
                        className={
                          user.canAccessFinancials
                            ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        }
                      >
                        {user.canAccessFinancials ? "Finance Access" : "No Finance"}
                      </Pill>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <Pill className={getStatusClass(user.accountStatus)}>
                        {user.accountStatus}
                      </Pill>
                      <Pill
                        className={
                          user.mfaEnabled
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }
                      >
                        {user.mfaEnabled ? "MFA Enabled" : "MFA Not Seen"}
                      </Pill>
                      <p className="text-xs font-semibold text-slate-500">
                        Confirmed: {formatDate(user.confirmedAt)}
                      </p>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <AssignAccessForm
                      user={user}
                      roles={roles}
                      disabled={!canManageUsers}
                    />
                  </td>

                  <td className="px-4 py-4">
                    <div className="grid gap-2">
                      <form action={sendPasswordReset}>
                        <input type="hidden" name="email" value={user.email} />
                        <button
                          type="submit"
                          disabled={!canResetPasswords}
                          className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          Send Password Reset
                        </button>
                      </form>

                      {user.assignmentId ? (
                        <form action={deactivateHqAccess}>
                          <input
                            type="hidden"
                            name="accessId"
                            value={user.assignmentId}
                          />
                          <input type="hidden" name="email" value={user.email} />
                          <button
                            type="submit"
                            disabled={!canManageUsers}
                            className="inline-flex w-full items-center justify-center rounded-2xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-black text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                          >
                            Deactivate HQ Access
                          </button>
                        </form>
                      ) : null}

                      <Link
                        href={`/admin/users?email=${encodeURIComponent(user.email)}`}
                        className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                      >
                        Review User
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PermissionMatrix({
  roleSummaries,
}: {
  roleSummaries: PermissionSummary[];
}) {
  const visible = roleSummaries.slice(0, 12);

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {visible.map((role) => (
        <div
          key={role.roleKey}
          className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-lg font-black text-slate-950">{role.label}</h3>
            <Pill className={getRoleBadgeClass(role.roleKey)}>
              {role.roleKey}
            </Pill>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {role.permissions.length ? (
              role.permissions.slice(0, 10).map((permission) => (
                <Pill
                  key={`${role.roleKey}-${permission.permission_key}`}
                  className={
                    permission.access_level === "none"
                      ? "border-slate-200 bg-slate-50 text-slate-500"
                      : permission.access_level === "super_user"
                        ? "border-purple-200 bg-purple-50 text-purple-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }
                >
                  {DEFAULT_PERMISSION_LABELS[permission.permission_key] ||
                    permission.permission_key}
                </Pill>
              ))
            ) : (
              <p className="text-sm font-semibold text-slate-500">
                No permissions mapped yet.
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

async function getAdminSettingsData() {
  const [authUsersResponse, profiles, legacyAdminUsers, accessRows, departmentsRows, rolesRows, permissionRows] =
    await Promise.all([
      supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      }),
      safeRows<GenericRow>(
        supabaseAdmin
          .from("profiles")
          .select("id,email,role,full_name,display_name,name,is_active,can_access_financials")
          .limit(2000),
        "profiles_settings_access",
      ),
      safeRows<GenericRow>(
        supabaseAdmin
          .from("admin_users")
          .select("id,user_id,email,role,is_active,can_access_financials")
          .limit(2000),
        "admin_users_settings_access",
      ),
      safeRows<UserAssignmentRow>(
        supabaseAdmin
          .from("admin_user_access")
          .select("*")
          .eq("is_active", true)
          .limit(2000),
        "admin_user_access_settings",
      ),
      safeRows<DepartmentRow>(
        supabaseAdmin
          .from("admin_departments")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true })
          .limit(200),
        "admin_departments_settings",
      ),
      safeRows<RoleRow>(
        supabaseAdmin
          .from("admin_roles")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true })
          .limit(300),
        "admin_roles_settings",
      ),
      safeRows<PermissionRow>(
        supabaseAdmin
          .from("admin_role_permissions")
          .select("*")
          .limit(5000),
        "admin_role_permissions_settings",
      ),
    ]);

  const departments = (departmentsRows.length ? departmentsRows : FALLBACK_DEPARTMENTS).sort(
    (a, b) => toNumber(a.display_order) - toNumber(b.display_order),
  );
  const roles = (rolesRows.length ? rolesRows : FALLBACK_ROLES).sort(
    (a, b) => toNumber(a.display_order) - toNumber(b.display_order),
  );
  const permissions = permissionRows;

  const profileById = new Map<string, GenericRow>();
  const profileByEmail = new Map<string, GenericRow>();
  const legacyAdminById = new Map<string, GenericRow>();
  const legacyAdminByEmail = new Map<string, GenericRow>();
  const accessById = new Map<string, UserAssignmentRow>();
  const accessByEmail = new Map<string, UserAssignmentRow>();
  const roleByKey = new Map<string, RoleRow>(roles.map((role) => [role.role_key, role]));
  const envAdminEmails = getEnvAdminEmails();

  profiles.forEach((profile) => {
    const id = asTrimmedString(profile.id);
    const email = asTrimmedString(profile.email).toLowerCase();

    if (id) profileById.set(id, profile);
    if (email) profileByEmail.set(email, profile);
  });

  legacyAdminUsers.forEach((admin) => {
    const id = asTrimmedString(admin.user_id);
    const email = asTrimmedString(admin.email).toLowerCase();

    if (id) legacyAdminById.set(id, admin);
    if (email) legacyAdminByEmail.set(email, admin);
  });

  accessRows.forEach((access) => {
    const id = asTrimmedString(access.user_id);
    const email = asTrimmedString(access.email).toLowerCase();

    if (id) accessById.set(id, access);
    if (email) accessByEmail.set(email, access);
  });

  const authUsers =
    authUsersResponse.data.users?.map((user) => {
      const metadata = user.user_metadata || {};
      const appMetadata = user.app_metadata || {};

      return {
        id: user.id,
        email: user.email || "",
        phone: user.phone || "",
        createdAt: user.created_at || "",
        lastSignInAt: user.last_sign_in_at || "",
        confirmedAt: user.confirmed_at || user.email_confirmed_at || "",
        role: asTrimmedString(appMetadata.role) || "",
        appMetadata,
        userMetadata: metadata,
        factors: Array.isArray(user.factors) ? user.factors : [],
      } satisfies AuthUserRow;
    }) || [];

  const users: UserAccessRow[] = authUsers.map((user) => {
    const email = user.email.toLowerCase();
    const profile = profileById.get(user.id) || profileByEmail.get(email) || {};
    const legacyAdmin = legacyAdminById.get(user.id) || legacyAdminByEmail.get(email) || {};
    const assignment = accessById.get(user.id) || accessByEmail.get(email);

    const profileRole = asTrimmedString(profile.role) || "—";
    const adminRole = asTrimmedString(legacyAdmin.role) || "—";
    const fallbackRole =
      adminRole !== "—"
        ? adminRole
        : profileRole !== "—"
          ? profileRole
          : user.role || "user";

    const hqRoleKey = asTrimmedString(assignment?.role_key) || fallbackRole;
    const roleConfig = roleByKey.get(hqRoleKey);
    const departmentKey =
      asTrimmedString(assignment?.department_key) ||
      asTrimmedString(roleConfig?.department_key) ||
      "viewer";

    const accessLevel =
      asTrimmedString(assignment?.access_level) ||
      asTrimmedString(roleConfig?.access_level) ||
      (hasSuperUserRole(hqRoleKey) ? "super_user" : "viewer");

    const adminActive =
      legacyAdmin.is_active === undefined ? true : getOptionalBoolean(legacyAdmin.is_active);
    const profileActive =
      profile.is_active === undefined
        ? true
        : getOptionalBoolean(profile.is_active);
    const assignmentActive = assignment
      ? getOptionalBoolean(assignment.is_active)
      : true;
    const envAllowed = envAdminEmails.includes(email);
    const explicitFinanceAccess =
      getOptionalBoolean(legacyAdmin.can_access_financials) ||
      getOptionalBoolean(profile.can_access_financials) ||
      getOptionalBoolean(roleConfig?.can_access_financials);

    const confirmed = Boolean(user.confirmedAt);
    const superUser =
      envAllowed ||
      getOptionalBoolean(roleConfig?.is_super_user) ||
      hasSuperUserRole(hqRoleKey);

    return {
      id: user.id,
      email: user.email || "No email",
      phone: user.phone || "No phone",
      displayName:
        asTrimmedString(profile.display_name) ||
        asTrimmedString(profile.full_name) ||
        asTrimmedString(profile.name) ||
        asTrimmedString(user.userMetadata.full_name) ||
        asTrimmedString(user.userMetadata.name) ||
        user.email?.split("@")[0] ||
        "User",
      role: fallbackRole,
      profileRole,
      adminRole,
      hqRoleKey,
      hqRoleName: roleConfig?.name || getRoleLabel(hqRoleKey),
      departmentKey,
      departmentName: getDepartmentName(departments, departmentKey),
      accessLevel,
      accountStatus:
        adminActive && profileActive && assignmentActive
          ? confirmed
            ? "Active"
            : "Unconfirmed"
          : "Suspended",
      canAccessAdmin:
        adminActive &&
        profileActive &&
        assignmentActive &&
        (superUser ||
          getOptionalBoolean(roleConfig?.can_access_admin) ||
          hasAdminRole(hqRoleKey)),
      canAccessFinancials:
        adminActive &&
        profileActive &&
        assignmentActive &&
        (superUser || explicitFinanceAccess || hasFinancialRole(hqRoleKey)),
      mfaEnabled: user.factors.length > 0,
      lastSignInAt: user.lastSignInAt,
      createdAt: user.createdAt,
      confirmedAt: user.confirmedAt,
      assignmentId: asTrimmedString(assignment?.id),
    };
  });

  const usersByDepartment = new Map<string, number>();
  users.forEach((user) => {
    usersByDepartment.set(
      user.departmentKey,
      (usersByDepartment.get(user.departmentKey) || 0) + 1,
    );
  });

  const rolesByDepartment = new Map<string, number>();
  roles.forEach((role) => {
    rolesByDepartment.set(
      role.department_key,
      (rolesByDepartment.get(role.department_key) || 0) + 1,
    );
  });

  const permissionsByRole = new Map<string, PermissionRow[]>();
  permissions.forEach((permission) => {
    const current = permissionsByRole.get(permission.role_key) || [];
    current.push(permission);
    permissionsByRole.set(permission.role_key, current);
  });

  const roleSummaries: PermissionSummary[] = roles.map((role) => ({
    roleKey: role.role_key,
    label: role.name,
    permissions: permissionsByRole.get(role.role_key) || [],
  }));

  const superUserCount = users.filter((user) =>
    ["founder", "owner", "super_admin"].includes(user.hqRoleKey),
  ).length;
  const adminCount = users.filter((user) => user.canAccessAdmin).length;
  const financeCount = users.filter((user) => user.canAccessFinancials).length;
  const techSupportCount = users.filter(
    (user) => user.departmentKey === "tech_support",
  ).length;
  const mfaCount = users.filter((user) => user.mfaEnabled).length;
  const unconfirmedCount = users.filter(
    (user) => user.accountStatus === "Unconfirmed",
  ).length;

  const systemChecks = [
    {
      label: "HQ Access Tables",
      status: accessRows.length > 0 || rolesRows.length > 0,
      detail:
        "admin_departments, admin_roles, admin_role_permissions, and admin_user_access support corporate HQ access control.",
    },
    {
      label: "Supabase Service Role",
      status: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      detail: "Required for secure Admin user and access management.",
    },
    {
      label: "Stripe Secret Key",
      status: Boolean(process.env.STRIPE_SECRET_KEY),
      detail: "Required for payments, Trust & Safety checkout, and webhooks.",
    },
    {
      label: "Checkr API Key",
      status: Boolean(process.env.CHECKR_API_KEY),
      detail: "Required for background check invitations and status tracking.",
    },
    {
      label: "Plaid Client",
      status: Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET),
      detail: "Required for NFCU/Plaid bank connection and reconciliation.",
    },
    {
      label: "Email Sending",
      status: Boolean(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY),
      detail: "Required for Admin alerts, reset support, and marketplace emails.",
    },
    {
      label: "Site URL",
      status: Boolean(
        process.env.NEXT_PUBLIC_APP_URL ||
          process.env.NEXT_PUBLIC_SITE_URL ||
          process.env.VERCEL_URL,
      ),
      detail: "Required for login redirects, password resets, and auth callbacks.",
    },
  ];

  return {
    users,
    roles,
    departments,
    roleSummaries,
    rolesByDepartment,
    usersByDepartment,
    systemChecks,
    totals: {
      allUsers: users.length,
      admins: adminCount,
      finance: financeCount,
      techSupport: techSupportCount,
      superUsers: superUserCount,
      mfa: mfaCount,
      unconfirmed: unconfirmedCount,
      departments: departments.length,
      roles: roles.length,
      permissions: permissions.length,
      systemReady: systemChecks.filter((check) => check.status).length,
      systemTotal: systemChecks.length,
    },
  };
}

export default async function AdminSettingsPage() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessAdmin) {
    return null;
  }

  const settingsData = await getAdminSettingsData();

  return (
    <main className="min-h-screen bg-[#f9faf5] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1640px] space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.13),transparent_30%),linear-gradient(135deg,#ffffff_0%,#ecfdf5_58%,#f8fafc_100%)] p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                Admin / Settings / Corporate HQ Access
              </p>

              <h1 className="mt-3 max-w-5xl text-4xl font-black leading-[0.96] tracking-tight text-slate-950 sm:text-5xl">
                SitGuru Corporate HQ Access Control.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-semibold leading-7 text-slate-700 sm:text-base">
                Manage Founder/CEO super-user access, HR, Billing & Finance,
                Sales & Marketing, Customer Service, Trust & Safety, Tech
                Support, viewer-only roles, password reset support, MFA
                visibility, and platform readiness from one secure Admin center.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Signed in Admin
              </p>
              <p className="mt-2 text-sm font-black text-slate-950">
                {actor.email}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Role: {actor.role}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {actor.canManageUsers ? "Can manage HQ access" : "Viewer access only"}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <StatCard
              label="Total Users"
              value={settingsData.totals.allUsers.toLocaleString()}
              detail="Supabase Auth users visible to Admin."
            />
            <StatCard
              label="Super Users"
              value={settingsData.totals.superUsers.toLocaleString()}
              detail="Founder, owner, and super admin users."
            />
            <StatCard
              label="Admin Access"
              value={settingsData.totals.admins.toLocaleString()}
              detail="Users with Admin or department access."
            />
            <StatCard
              label="Finance Access"
              value={settingsData.totals.finance.toLocaleString()}
              detail="Users who can access financial Admin pages."
            />
            <StatCard
              label="Tech Support"
              value={settingsData.totals.techSupport.toLocaleString()}
              detail="Users assigned to technical support roles."
            />
            <StatCard
              label="System Ready"
              value={`${settingsData.totals.systemReady}/${settingsData.totals.systemTotal}`}
              detail="Configured environment and integration checks."
            />
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-4">
          <SettingsCard
            href="/admin/users"
            title="User Directory"
            description="Review user accounts, profile roles, account status, and user records."
          />
          <SettingsCard
            href="/admin/security"
            title="Security Center"
            description="Review access policies, audit controls, MFA handling, and platform security readiness."
          />
          <SettingsCard
            href="/admin/audit-trail"
            title="Audit Trail"
            description="Review Admin actions, role changes, password support actions, and financial updates."
          />
          <SettingsCard
            href="/admin/financials"
            title="Financial Access"
            description="Review Financial Overview, P&L, Balance Sheet, Cash Flow, Pro Forma, and reconciliation."
          />
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                HQ Departments
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Corporate departments and access boundaries.
              </h2>
              <p className="mt-2 max-w-4xl text-sm font-semibold leading-7 text-slate-600">
                Executive roles are super users. Department roles are full
                access inside their department and viewer-only or no access
                outside their role unless explicitly granted.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
              {settingsData.totals.departments} departments ·{" "}
              {settingsData.totals.roles} roles
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {settingsData.departments.map((department) => (
              <DepartmentCard
                key={department.department_key}
                department={department}
                roleCount={
                  settingsData.rolesByDepartment.get(department.department_key) || 0
                }
                userCount={
                  settingsData.usersByDepartment.get(department.department_key) || 0
                }
              />
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                Password & Role Access Support
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                User access management.
              </h2>
              <p className="mt-2 max-w-4xl text-sm font-semibold leading-7 text-slate-600">
                Assign users to HQ departments, set official internal roles,
                send password reset emails, view MFA status, and deactivate HQ
                access when needed. Admin should never view or manually store
                user passwords.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-black text-amber-800">
              {settingsData.totals.unconfirmed.toLocaleString()} unconfirmed
            </div>
          </div>

          <div className="mt-6">
            <UserAccessTable
              users={settingsData.users}
              roles={settingsData.roles}
              canManageUsers={actor.canManageUsers}
              canResetPasswords={actor.canResetPasswords}
            />
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                Permission Matrix
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Department role permissions.
              </h2>
              <p className="mt-2 max-w-4xl text-sm font-semibold leading-7 text-slate-600">
                This matrix shows the current permissions available by HQ role.
                Sidebar enforcement can be wired next so users only see the
                Admin areas their role allows.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
              {settingsData.totals.permissions.toLocaleString()} mapped
              permissions
            </div>
          </div>

          <div className="mt-6">
            <PermissionMatrix roleSummaries={settingsData.roleSummaries} />
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                System Readiness
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Platform access and integration checks.
              </h2>
              <p className="mt-2 max-w-4xl text-sm font-semibold leading-7 text-slate-600">
                These checks confirm whether Admin dependencies are configured
                for access management, payments, Trust & Safety, banking,
                emails, redirects, and HQ role management.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
              {settingsData.totals.systemReady}/{settingsData.totals.systemTotal} ready
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {settingsData.systemChecks.map((check) => (
              <div
                key={check.label}
                className="rounded-[1.5rem] border border-slate-200 bg-[#fbfefd] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-black text-slate-950">
                    {check.label}
                  </h3>
                  <Pill className={getSystemCheckClass(check.status)}>
                    {getSystemCheckStatus(check.status)}
                  </Pill>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                  {check.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-sky-100 bg-sky-50 p-5 shadow-sm sm:p-6 lg:p-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-700">
            Next Access Control Step
          </p>
          <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
            This page now supports Corporate HQ departments, official internal
            roles, role assignment, password reset support, and permission
            visibility. Next we should update the Admin sidebar so Financials,
            Trust & Safety, Customer Service, Sales & Marketing, Tech Support,
            and viewer-only roles only see the sections they are allowed to use.
          </p>
        </section>
      </div>
    </main>
  );
}
