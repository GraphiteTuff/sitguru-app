import { INTERNSHIP_PORTAL_PATH } from "@/lib/internship/constants";
import { INTERNSHIP_ONBOARDING_PATH } from "@/lib/internship/onboarding";

export const INTERNSHIP_GROWTH_PATH = `${INTERNSHIP_PORTAL_PATH}/growth`;
export const INTERNSHIP_HELP_PATH = `${INTERNSHIP_PORTAL_PATH}/help`;

export function internHelpPath(path: string | null | undefined) {
  const suffix = String(path || "").trim();
  if (!suffix) return INTERNSHIP_HELP_PATH;
  return `${INTERNSHIP_HELP_PATH}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
}

export function isInternHelpPath(value: string | null | undefined) {
  const path = String(value || "").trim();
  return path === INTERNSHIP_HELP_PATH || path.startsWith(`${INTERNSHIP_HELP_PATH}/`);
}

/** Keep intern login deep-links inside the student portal. */
export function internSafeNext(value: string | null | undefined) {
  const next = String(value || "").trim();
  if (!next.startsWith(INTERNSHIP_PORTAL_PATH)) return INTERNSHIP_PORTAL_PATH;
  if (next.startsWith("//") || next.includes("://") || next.includes("\\")) {
    return INTERNSHIP_PORTAL_PATH;
  }
  return next.split("#")[0] || INTERNSHIP_PORTAL_PATH;
}

/** Unsigned interns stay on onboarding even if a deep link was requested. */
export function internPortalDestination(
  next: string | null | undefined,
  onboarded: boolean,
) {
  const safe = internSafeNext(next);
  if (
    !onboarded &&
    safe !== INTERNSHIP_ONBOARDING_PATH &&
    !safe.startsWith(`${INTERNSHIP_ONBOARDING_PATH}/`) &&
    !isInternHelpPath(safe)
  ) {
    return INTERNSHIP_ONBOARDING_PATH;
  }
  return safe;
}
