/**
 * Public Guru profile visibility + optional boolean helpers.
 *
 * Two common 404 causes:
 * 1) Public URLs use name + first 8 of user_id (e.g. kayla-keeter-f7706ea3)
 *    while matchers only knew name / full UUID / stored slug.
 * 2) Missing is_public / is_public_visible / is_active were coerced to false,
 *    so setup-in-progress Gurus looked intentionally hidden → notFound().
 *
 * Visibility ≠ bookable. Keep isBookable() strict (service area, etc.).
 */

export type GuruPublicVisibilityFields = {
  slug?: string | null;
  public_slug?: string | null;
  is_public?: boolean | null;
  is_public_visible?: boolean | null;
  is_active?: boolean | null;
  status?: string | null;
  application_status?: string | null;
  public_status?: string | null;
  booking_status?: string | null;
  admin_status?: string | null;
};

const HARD_BLOCKED_STATUSES = new Set([
  "inactive",
  "suspended",
  "rejected",
  "paused",
  "deleted",
  "archived",
  "not_approved",
  "not approved",
  "hidden",
  "disabled",
]);

const PRIVATE_PUBLIC_STATUSES = new Set(["private", "hidden"]);

const VISIBLE_PUBLIC_STATUSES = new Set([
  "public",
  "visible",
  "visible_setup_in_progress",
  "visible_placeholder",
]);

const VISIBLE_APPLICATION_STATUSES = new Set([
  "public",
  "visible",
  "bookable",
  "pre_approved",
  "approved",
  "pending",
  "pending_setup",
  "profile_incomplete",
  "needs_setup",
  "submitted",
  "reviewing",
]);

const LISTED_BOOKING_STATUSES = new Set([
  "listed_only",
  "requestable",
  "bookable",
  "not_listed",
]);

function normalizeStatus(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

/**
 * Preserve missing DB booleans as null.
 * Only return true/false when the value is explicitly boolean-like.
 */
export function asOptionalBoolean(value: unknown): boolean | null {
  if (value === true || value === false) return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "t", "1", "yes"].includes(normalized)) return true;
    if (["false", "f", "0", "no"].includes(normalized)) return false;
  }

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  return null;
}

export function hasGuruPublicSlug(profile: GuruPublicVisibilityFields | null) {
  return Boolean(String(profile?.public_slug || profile?.slug || "").trim());
}

/**
 * Whether /guru/[slug] should render for anonymous visitors.
 * Owner/admin viewers are handled separately by the page.
 *
 * Explicit false on visibility flags = intentionally hidden.
 * null/undefined = still completing setup → allow if not hard-blocked.
 */
export function isPubliclyVisibleGuruProfile(
  profile: GuruPublicVisibilityFields | null,
) {
  if (!profile) return false;

  const status = normalizeStatus(profile.status);
  const applicationStatus = normalizeStatus(profile.application_status);
  const publicStatus = normalizeStatus(profile.public_status);
  const bookingStatus = normalizeStatus(profile.booking_status);
  const adminStatus = normalizeStatus(profile.admin_status);

  if (
    HARD_BLOCKED_STATUSES.has(status) ||
    HARD_BLOCKED_STATUSES.has(applicationStatus) ||
    HARD_BLOCKED_STATUSES.has(publicStatus) ||
    HARD_BLOCKED_STATUSES.has(adminStatus)
  ) {
    return false;
  }

  if (PRIVATE_PUBLIC_STATUSES.has(publicStatus)) {
    return false;
  }

  // Explicit inactive/disabled only — missing is_active stays visible for setup.
  if (profile.is_active === false) {
    return false;
  }

  // Explicit hide. Do not treat null as hidden.
  if (profile.is_public === false || profile.is_public_visible === false) {
    // Legacy Hazel/Kayla rows were stored as false + not_listed with a public slug.
    // Allow those setup URLs; isBookable() still blocks booking.
    const allowSetupDespiteFalseFlags =
      hasGuruPublicSlug(profile) &&
      (bookingStatus === "not_listed" || !bookingStatus);

    if (!allowSetupDespiteFalseFlags) {
      return false;
    }
  }

  if (profile.is_public === true || profile.is_public_visible === true) {
    return true;
  }

  if (VISIBLE_PUBLIC_STATUSES.has(publicStatus)) {
    return true;
  }

  // Missing / in-progress application statuses: visible profile, not bookable.
  if (!applicationStatus || VISIBLE_APPLICATION_STATUSES.has(applicationStatus)) {
    return true;
  }

  if (!bookingStatus || LISTED_BOOKING_STATUSES.has(bookingStatus)) {
    return true;
  }

  if (hasGuruPublicSlug(profile)) {
    return true;
  }

  return false;
}

/** DB publish flags for listed (not bookable) public profiles. */
export const GURU_LISTED_ONLY_PUBLIC_FLAGS = {
  is_public: true,
  is_public_visible: true,
  is_active: true,
  public_status: "visible",
  booking_status: "listed_only",
} as const;
