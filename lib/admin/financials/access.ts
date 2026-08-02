import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isHardcodedSuperUserEmail } from "@/lib/admin/super-users";

export const FINANCE_ROLES = [
  "owner",
  "super_admin",
  "admin",
  "finance_admin",
  "finance",
  "accounting",
  "bookkeeper",
] as const;

export type FinanceAdminIdentity = {
  id: string;
  email: string;
  role: string;
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

export function isFinanceRole(role: string | null | undefined) {
  return FINANCE_ROLES.includes(
    String(role || "")
      .trim()
      .toLowerCase() as (typeof FINANCE_ROLES)[number],
  );
}

export async function getFinanceAdminIdentity(): Promise<FinanceAdminIdentity | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const email = String(user.email || "").toLowerCase();
  const envEmails = getEnvAdminEmails();

  if (isHardcodedSuperUserEmail(email) || envEmails.includes(email)) {
    return { id: user.id, email, role: "super_admin" };
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

  const role = String(row.role || "").toLowerCase();
  const canAccess =
    Boolean(row.can_access_financials) || isFinanceRole(role);

  if (!canAccess) return null;

  return {
    id: user.id,
    email: String(row.email || email || "").toLowerCase(),
    role: role || "admin",
  };
}

type FinanceApiOk = {
  identity: FinanceAdminIdentity;
  response: null;
};

type FinanceApiDenied = {
  identity: null;
  response: NextResponse;
};

export async function requireFinanceAdminApi(): Promise<
  FinanceApiOk | FinanceApiDenied
> {
  const identity = await getFinanceAdminIdentity();

  if (!identity) {
    return {
      identity: null,
      response: NextResponse.json(
        { error: "Finance admin access required." },
        { status: 403 },
      ),
    };
  }

  return {
    identity,
    response: null,
  };
}

export async function requireFinanceAdminRedirect(
  loginPath = "/admin/login",
): Promise<FinanceApiOk | FinanceApiDenied> {
  const identity = await getFinanceAdminIdentity();

  if (!identity) {
    return {
      identity: null,
      response: NextResponse.redirect(loginPath),
    };
  }

  return {
    identity,
    response: null,
  };
}
