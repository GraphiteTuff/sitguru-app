/** Shared by proxy and Admin chrome. No service-role imports. */

export const GROWTH_ONLY_ROLES = new Set(["social_community_manager"]);

export const GROWTH_ALLOWED_ADMIN_PREFIXES = [
  "/admin/growth",
  "/admin/sales-marketing",
  "/admin/community",
  "/admin/referrals",
  "/admin/market-growth",
  "/admin/partners",
] as const;

function normalizeRole(role: string | null | undefined) {
  return String(role || "")
    .trim()
    .toLowerCase();
}

export function isGrowthOnlyRole(role: string | null | undefined) {
  return GROWTH_ONLY_ROLES.has(normalizeRole(role));
}

export function hasGrowthOnlyRole(roles: Array<string | null | undefined>) {
  return roles.some((role) => isGrowthOnlyRole(role));
}

export function isGrowthAllowedAdminPath(pathname: string) {
  const path = pathname || "/";

  if (path === "/admin/login") return true;

  return GROWTH_ALLOWED_ADMIN_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
