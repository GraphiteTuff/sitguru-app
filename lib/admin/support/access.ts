import { redirect } from "next/navigation";
import {
  getAdminIdentity,
  isSuperUserRole,
  type AdminIdentity,
} from "@/lib/admin/access";
import { createClient } from "@/lib/supabase/server";

/** Support dashboard is restricted to Super Users and platform Admins only. */
export const SUPPORT_DASHBOARD_ROLES = new Set([
  "super_user",
  "super_admin",
  "superuser",
  "admin",
  "founder",
  "owner",
]);

function normalizeRole(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function canAccessSupportDashboard(
  identity: AdminIdentity | null,
  metadataRole?: string | null
): boolean {
  if (identity?.isSuperUser) return true;
  if (identity && SUPPORT_DASHBOARD_ROLES.has(normalizeRole(identity.role))) {
    return true;
  }
  if (identity && isSuperUserRole(identity.role)) return true;

  const meta = normalizeRole(metadataRole);
  return SUPPORT_DASHBOARD_ROLES.has(meta) || isSuperUserRole(meta);
}

/**
 * Rigid server-side gate for `/admin/support`.
 * Aborts with redirect to `/admin` when the session is not super_user / admin.
 */
export async function requireSupportDashboardAccess(): Promise<AdminIdentity> {
  const identity = await getAdminIdentity();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const metadataRole = normalizeRole(
    user?.app_metadata?.role || user?.user_metadata?.role
  );

  if (identity && canAccessSupportDashboard(identity, metadataRole)) {
    return identity;
  }

  if (
    user &&
    (SUPPORT_DASHBOARD_ROLES.has(metadataRole) || isSuperUserRole(metadataRole))
  ) {
    const isSuper =
      isSuperUserRole(metadataRole) ||
      metadataRole === "super_user" ||
      metadataRole === "superuser";

    return {
      id: user.id,
      email: String(user.email || "").toLowerCase(),
      role: metadataRole || "admin",
      canAccessAdmin: true,
      canAccessFinancials: isSuper,
      canManageUsers: isSuper,
      canManageRoles: isSuper,
      canResetPasswords: true,
      isSuperUser: isSuper,
    };
  }

  redirect("/admin");
}
