import {
  isHardcodedSuperUserEmail,
  normalizeAdminEmail,
} from "@/lib/admin/super-users";

/**
 * Profile roles that count as SitGuru admin for bearer-token admin APIs.
 * HQ super users are also allowed by email even when profiles.role is
 * customer (the same account is a Pet Parent).
 */
const PRIVILEGED_PROFILE_ROLES = new Set([
  "admin",
  "super_admin",
  "super_user",
  "superuser",
  "superadmin",
  "founder",
  "owner",
]);

export function normalizePrivilegeRole(role: string | null | undefined) {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function isEnvAllowlistedAdminEmail(email: string | null | undefined) {
  const normalized = normalizeAdminEmail(email);
  if (!normalized) return false;

  return String(
    process.env.SITGURU_FINANCE_ADMIN_EMAILS ||
      process.env.ADMIN_EMAILS ||
      process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
      "",
  )
    .split(",")
    .map((item) => normalizeAdminEmail(item))
    .filter(Boolean)
    .includes(normalized);
}

export function hasPrivilegedAdminAccess(input: {
  email?: string | null;
  role?: string | null;
}) {
  if (
    isHardcodedSuperUserEmail(input.email) ||
    isEnvAllowlistedAdminEmail(input.email)
  ) {
    return true;
  }

  return PRIVILEGED_PROFILE_ROLES.has(normalizePrivilegeRole(input.role));
}
