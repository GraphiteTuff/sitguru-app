/**
 * Scout mount surfaces — shared by Layout + AIScoutCompanion + RouteShell.
 * Public onboarding routes never require Guru auth.
 */

export const SCOUT_WORKSPACE_ROUTE_PREFIXES = [
  "/guru/dashboard",
  "/guru/bookings",
  "/guru/referrals",
  "/guru/messages",
  "/guru/profile",
  "/guru/availability",
  "/guru/earnings",
  "/guru/success-center",
  "/guru/resources",
  "/guru/pet-families",
  "/guru/walk",
] as const;

export const SCOUT_PUBLIC_GURU_ROUTE_PREFIXES = [
  "/become-a-guru",
  "/guru/signup",
  "/guru/application",
] as const;

/** Known private / onboarding Guru paths that must never be treated as public profiles. */
export const GURU_PRIVATE_OR_ONBOARDING_PREFIXES = [
  ...SCOUT_WORKSPACE_ROUTE_PREFIXES,
  ...SCOUT_PUBLIC_GURU_ROUTE_PREFIXES,
  "/guru/login",
] as const;

export function matchesRoutePrefix(
  pathname: string | null | undefined,
  prefixes: readonly string[],
) {
  if (!pathname) return false;
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Unauthenticated Guru application / Become a Guru surfaces. */
export function isPublicGuruOnboardingPath(pathname: string | null | undefined) {
  return matchesRoutePrefix(pathname, SCOUT_PUBLIC_GURU_ROUTE_PREFIXES);
}

/** Logged-in Guru workspace (dashboard, bookings, walk, etc.). */
export function isGuruWorkspacePath(pathname: string | null | undefined) {
  return matchesRoutePrefix(pathname, SCOUT_WORKSPACE_ROUTE_PREFIXES);
}

/**
 * Public marketing Guru profile (`/guru/{slug}`), not login/signup/dashboard.
 */
export function isPublicGuruProfilePath(pathname: string | null | undefined) {
  if (!pathname?.startsWith("/guru/")) return false;
  if (matchesRoutePrefix(pathname, GURU_PRIVATE_OR_ONBOARDING_PREFIXES)) {
    return false;
  }
  // `/guru` alone is not a profile.
  if (pathname === "/guru") return false;
  return true;
}
