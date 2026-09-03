/**
 * Guru authorization is additive. A Pet Parent who becomes a Guru keeps
 * Pet Parent access. A completed/eligible guru profile grants dashboard access
 * even when user_roles is missing the guru row.
 */

export const GURU_DASHBOARD_PATH = "/guru/dashboard";
export const GURU_APPLICATION_PATH = "/guru/application";
export const ADD_GURU_TO_ACCOUNT_PATH = "/become-a-sitter";

const GURU_ROLE_TOKENS = new Set([
  "guru",
  "future_guru",
  "future-guru",
  "provider",
  "sitter",
  "walker",
  "caretaker",
  "caregiver",
  "pet_guru",
  "pet-care-guru",
  "pet_care_guru",
  "both",
  "customer_guru",
  "customer-guru",
  "pet_parent_and_guru",
  "pet-parent-and-guru",
]);

const RETIRED_GURU_STATUSES = new Set([
  "merged_duplicate",
  "archived",
  "rejected",
  "denied",
  "inactive",
]);

export type GuruAccessProfile = {
  id?: string | null;
  user_id?: string | null;
  email?: string | null;
  status?: string | null;
  application_status?: string | null;
  is_bookable?: boolean | null;
  is_active?: boolean | null;
  is_public?: boolean | null;
};

export function normalizeAccessToken(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function isGuruRoleValue(value: unknown) {
  const role = normalizeAccessToken(value).replace(/[\s]+/g, "_");
  if (!role) return false;
  if (GURU_ROLE_TOKENS.has(role)) return true;
  return role.includes("guru") && !role.includes("approvals");
}

export function isEligibleGuruProfile(
  row: GuruAccessProfile | null | undefined,
) {
  if (!row) return false;
  if (!row.id && !row.user_id && !row.email) return false;

  const status = normalizeAccessToken(row.status);
  const application = normalizeAccessToken(row.application_status);

  if (RETIRED_GURU_STATUSES.has(status) || RETIRED_GURU_STATUSES.has(application)) {
    return false;
  }

  return true;
}

export function hasGuruAccessFromSignals(input: {
  roles?: Array<string | null | undefined> | null;
  hasGuruRole?: boolean;
  hasEligibleGuruProfile?: boolean;
}) {
  const hasRole =
    input.hasGuruRole === true ||
    (input.roles || []).some((role) => isGuruRoleValue(role));

  return hasRole || input.hasEligibleGuruProfile === true;
}

export function shouldRepairMissingGuruRole(input: {
  hasGuruRole: boolean;
  hasEligibleGuruProfile: boolean;
}) {
  return !input.hasGuruRole && input.hasEligibleGuruProfile;
}

export function isGuruDashboardApplicationLoop(input: {
  from?: string | null;
  reason?: string | null;
  destination?: string | null;
}) {
  const from = normalizeAccessToken(input.from);
  const reason = normalizeAccessToken(input.reason);
  const destination = String(input.destination || "");
  const bouncedFromDashboard =
    from === "guru-dashboard" ||
    reason === "customer-only" ||
    reason === "guru-access-required";
  const destinationIsDashboard =
    destination === GURU_DASHBOARD_PATH ||
    destination.startsWith(`${GURU_DASHBOARD_PATH}/`);

  return bouncedFromDashboard && destinationIsDashboard;
}

function withQuery(path: string, params: URLSearchParams) {
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/**
 * Resolve /guru/application. Never send a customer-only bounce back onto
 * /guru/dashboard*, and never send an eligible Guru back to application.
 */
export function resolveGuruApplicationPath(input: {
  hasGuruAccess: boolean;
  from?: string | null;
  reason?: string | null;
  saved?: string | null;
  submitted?: string | null;
  message?: string | null;
  error?: string | null;
}) {
  if (input.hasGuruAccess) {
    return GURU_DASHBOARD_PATH;
  }

  const bounceParams = new URLSearchParams();
  if (input.from) bounceParams.set("from", input.from);
  if (input.reason) bounceParams.set("reason", input.reason);

  if (
    isGuruDashboardApplicationLoop({
      from: input.from,
      reason: input.reason,
      destination: `${GURU_DASHBOARD_PATH}/profile`,
    })
  ) {
    return withQuery(ADD_GURU_TO_ACCOUNT_PATH, bounceParams);
  }

  const searchParams = new URLSearchParams(bounceParams);
  if (input.saved) searchParams.set("saved", input.saved);
  if (input.submitted) searchParams.set("submitted", input.submitted);
  if (input.message) searchParams.set("message", input.message);
  if (input.error) searchParams.set("error", input.error);

  return withQuery(`${GURU_DASHBOARD_PATH}/profile`, searchParams);
}

export function mergeRoleTokens(
  existing: readonly string[],
  add: readonly string[],
) {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const value of [...existing, ...add]) {
    const role = normalizeAccessToken(value);
    if (!role || seen.has(role)) continue;
    seen.add(role);
    merged.push(role);
  }

  return merged;
}

export function authorizedRolesForPetParentGuru(existing: readonly string[]) {
  return mergeRoleTokens(existing, ["parent", "guru"]);
}

export function guruLookupOrFilter(userId: string, email?: string | null) {
  const cleanEmail = normalizeAccessToken(email);
  if (!cleanEmail) return `user_id.eq.${userId}`;
  return `user_id.eq.${userId},email.eq.${cleanEmail}`;
}
