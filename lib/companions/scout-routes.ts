/**
 * Scout mount surfaces — shared by Layout + AIScoutCompanion.
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
] as const;

export const SCOUT_PUBLIC_GURU_ROUTE_PREFIXES = [
  "/become-a-guru",
  "/guru/signup",
  "/guru/application",
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
