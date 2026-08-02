import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  FINANCE_ROLES,
  isFinanceRole,
  type FinanceAdminIdentity,
} from "@/lib/admin/financials/access";

export const ADMIN_ROLES = [
  ...FINANCE_ROLES,
  "support_admin",
  "operations",
  "moderator",
] as const;

export type AdminIdentity = {
  id: string;
  email: string;
  role: string;
  canAccessAdmin: boolean;
  canAccessFinancials: boolean;
};

function getEnvAdminEmails() {
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

export function isAdminRole(role: string | null | undefined) {
  return ADMIN_ROLES.includes(
    String(role || "")
      .trim()
      .toLowerCase() as (typeof ADMIN_ROLES)[number],
  );
}

/**
 * Resolve a signed-in admin identity.
 * Never invents a default "admin" role when no profile row exists.
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

  if (envEmails.includes(email)) {
    return {
      id: user.id,
      email,
      role: "admin",
      canAccessAdmin: true,
      canAccessFinancials: true,
    };
  }

  const [adminUser, profile, users] = await Promise.all([
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

  const row =
    adminUser.data?.[0] || profile.data?.[0] || users.data?.[0] || null;

  if (!row || row.is_active === false) return null;

  const role = String(row.role || "")
    .trim()
    .toLowerCase();

  if (!role || !isAdminRole(role)) return null;

  const canAccessFinancials =
    Boolean(row.can_access_financials) || isFinanceRole(role);

  return {
    id: user.id,
    email: String(row.email || email || "").toLowerCase(),
    role,
    canAccessAdmin: true,
    canAccessFinancials,
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
  | { identity: FinanceAdminIdentity & { canAccessFinancials: true }; response: null }
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
