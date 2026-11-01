import {
  isAdminPathAllowedForModules,
  modulesFromPortalAreas,
  portalHomePath,
} from "@/lib/admin/portal-areas";

/** Shared by proxy and Admin chrome. No service-role imports. */

export const GROWTH_ONLY_ROLES = new Set([
  "social_community_manager",
  "social_growth_manager",
  "growth_manager",
  "social_media_community_growth_manager",
]);

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
    .toLowerCase()
    .replace(/[-\s]+/g, "_");
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

/** Where /admin/login should land after a successful staff sign-in. */
export function adminLoginDestination(input: {
  role: string | null | undefined;
  isSuperUser?: boolean;
  portalAreas?: readonly string[] | null;
}) {
  if (input.isSuperUser) return "/admin";
  if (input.portalAreas?.length) return portalHomePath(input.portalAreas);
  if (isGrowthOnlyRole(input.role)) return "/manager";
  return "/admin";
}

/**
 * Path fence for staff who are not Super Users.
 * An explicit portal_areas list replaces the role default.
 * Growth-only accounts still land on the Manager desk.
 */
export function decideAdminPath(input: {
  pathname: string;
  isSuperUser?: boolean;
  growthOnly?: boolean;
  portalAreas: readonly string[] | null;
}) {
  if (input.isSuperUser || input.pathname === "/admin/login") {
    return { allowed: true, redirectTo: "/admin" };
  }

  if (input.portalAreas?.length) {
    const modules = modulesFromPortalAreas(input.portalAreas);
    return {
      allowed: isAdminPathAllowedForModules(input.pathname, modules),
      redirectTo: portalHomePath(input.portalAreas),
    };
  }

  if (input.growthOnly) {
    const path = input.pathname || "/";
    const allowed =
      path !== "/admin" &&
      path !== "/admin/" &&
      isGrowthAllowedAdminPath(path);
    return { allowed, redirectTo: "/manager" };
  }

  return { allowed: true, redirectTo: "/admin" };
}
