import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  FINANCE_ROLES,
  isFinanceRole,
  type FinanceAdminIdentity,
} from "@/lib/admin/financials/access";
import { isHardcodedSuperUserEmail } from "@/lib/admin/super-users";

/** Roles that unlock general /admin access across SitGuru. */
export const ADMIN_ROLES = [
  ...FINANCE_ROLES,
  "admin",
  "founder",
  "support_admin",
  "operations",
  "operations_admin",
  "moderator",
  "hr_admin",
  "billing_admin",
  "sales_admin",
  "marketing_admin",
  "social_community_manager",
  "partner_admin",
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
] as const;

const SUPER_USER_ROLES = new Set([
  "founder",
  "owner",
  "super_admin",
  "super_user",
]);

const MANAGE_USERS_ROLES = new Set([
  "founder",
  "owner",
  "super_admin",
  "hr_admin",
  "tech_support_admin",
  "systems_admin",
]);

const RESET_PASSWORD_ROLES = new Set([
  "founder",
  "owner",
  "super_admin",
  "hr_admin",
  "support_admin",
  "customer_service",
  "tech_support_admin",
  "technical_support",
  "systems_admin",
]);

export type AdminIdentity = {
  id: string;
  email: string;
  role: string;
  canAccessAdmin: boolean;
  canAccessFinancials: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canResetPasswords: boolean;
  isSuperUser: boolean;
};

function getEnvAdminEmails() {
  // Prefer server-only allowlists. NEXT_PUBLIC_* is last-resort legacy.
  return String(
    process.env.SITGURU_FINANCE_ADMIN_EMAILS ||
      process.env.ADMIN_EMAILS ||
      process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
      "",
  )
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperUserRole(role: string | null | undefined) {
  return SUPER_USER_ROLES.has(
    String(role || "")
      .trim()
      .toLowerCase(),
  );
}

export function isAdminRole(role: string | null | undefined) {
  const normalized = String(role || "")
    .trim()
    .toLowerCase();

  if (!normalized) return false;

  return (
    ADMIN_ROLES.includes(normalized as (typeof ADMIN_ROLES)[number]) ||
    isSuperUserRole(normalized)
  );
}

function normalizeRoleCandidate(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

/** Map legacy / mistaken keys onto canonical admin roles. */
function canonicalizeRole(role: string, accessLevel?: string | null) {
  const normalized = normalizeRoleCandidate(role);
  const level = normalizeRoleCandidate(accessLevel);

  if (
    normalized === "super_user" ||
    normalized === "superuser" ||
    level === "super_user" ||
    level === "superuser"
  ) {
    return "super_admin";
  }

  if (normalized === "administrator" || normalized === "sitguru_admin") {
    return "admin";
  }

  return normalized;
}

function pickBestRole(candidates: string[]) {
  const normalized = candidates
    .map((role) => canonicalizeRole(role))
    .filter(Boolean);

  const superRole = normalized.find((role) => isSuperUserRole(role));
  if (superRole) return superRole;

  const adminRole = normalized.find((role) => isAdminRole(role));
  if (adminRole) return adminRole;

  return normalized[0] || "";
}

function buildCapabilities(role: string, explicitFinance = false) {
  const normalized = role.trim().toLowerCase();
  const isSuperUser = isSuperUserRole(normalized);

  return {
    canAccessAdmin: isAdminRole(normalized) || isSuperUser,
    canAccessFinancials:
      isSuperUser || isFinanceRole(normalized) || explicitFinance,
    canManageUsers: isSuperUser || MANAGE_USERS_ROLES.has(normalized),
    canManageRoles: isSuperUser,
    canResetPasswords: isSuperUser || RESET_PASSWORD_ROLES.has(normalized),
    isSuperUser,
  };
}

/**
 * Resolve a signed-in admin identity.
 * Never invents a default "admin" role when no profile / HQ assignment exists.
 */
export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const email = String(user.email || "").toLowerCase();
  const envEmails = getEnvAdminEmails();

  // Match proxy.ts / admin login: hardcoded HQ emails + env allowlist.
  if (isHardcodedSuperUserEmail(email) || envEmails.includes(email)) {
    const caps = buildCapabilities("super_admin");
    return {
      id: user.id,
      email,
      role: "super_admin",
      ...caps,
    };
  }

  const [hqAccess, adminUser, profile, users] = await Promise.all([
    supabaseAdmin
      .from("admin_user_access")
      .select("role_key,email,is_active,access_level")
      .eq("email", email)
      .eq("is_active", true)
      .limit(1),
    supabaseAdmin
      .from("admin_users")
      .select("role,email,is_active,can_access_financials")
      .eq("user_id", user.id)
      .limit(1),
    supabaseAdmin
      .from("profiles")
      .select("role,email,is_active,can_access_financials")
      .eq("id", user.id)
      .limit(1),
    supabaseAdmin
      .from("users")
      .select("role,email,is_active,can_access_financials")
      .eq("id", user.id)
      .limit(1),
  ]);

  const hqRow = hqAccess.data?.[0] || null;
  const adminRow = adminUser.data?.[0] || null;
  const profileRow = profile.data?.[0] || null;
  const usersRow = users.data?.[0] || null;
  const row = adminRow || profileRow || usersRow || null;

  const role = pickBestRole([
    canonicalizeRole(hqRow?.role_key, hqRow?.access_level),
    normalizeRoleCandidate(adminRow?.role),
    normalizeRoleCandidate(profileRow?.role),
    normalizeRoleCandidate(usersRow?.role),
  ]);

  if (!role || !isAdminRole(role)) return null;

  if (hqRow && hqRow.is_active === false) return null;
  if (row && row.is_active === false) return null;

  const explicitFinance = Boolean(row?.can_access_financials);
  const caps = buildCapabilities(role, explicitFinance);

  if (!caps.canAccessAdmin) return null;

  return {
    id: user.id,
    email: String(hqRow?.email || row?.email || email || "").toLowerCase(),
    role,
    ...caps,
  };
}

type AdminApiOk = {
  identity: AdminIdentity;
  response: null;
};

type AdminApiDenied = {
  identity: null;
  response: NextResponse;
};

export async function requireAdminApi(): Promise<AdminApiOk | AdminApiDenied> {
  const identity = await getAdminIdentity();

  if (!identity?.canAccessAdmin) {
    return {
      identity: null,
      response: NextResponse.json(
        { error: "Admin access required." },
        { status: 403 },
      ),
    };
  }

  return {
    identity,
    response: null,
  };
}

export async function requireFinanceCapableAdminApi(): Promise<
  | {
      identity: FinanceAdminIdentity & { canAccessFinancials: true };
      response: null;
    }
  | AdminApiDenied
> {
  const identity = await getAdminIdentity();

  if (!identity?.canAccessAdmin || !identity.canAccessFinancials) {
    return {
      identity: null,
      response: NextResponse.json(
        { error: "Finance admin access required." },
        { status: 403 },
      ),
    };
  }

  return {
    identity: {
      id: identity.id,
      email: identity.email,
      role: identity.role,
      canAccessFinancials: true,
    },
    response: null,
  };
}
