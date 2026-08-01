/**
 * Browser-safe Guru live-update contracts.
 * Used by Realtime bridge + search/profile surfaces.
 * Never import service-role clients here.
 */

export const GURU_LIVE_UPDATE_EVENT = "sitguru:guru-live-update";

export type GuruLiveGuruPatch = {
  type: "guru";
  row: Record<string, unknown>;
};

export type GuruLiveRatesPatch = {
  type: "rates";
  row: Record<string, unknown>;
  event: "INSERT" | "UPDATE" | "DELETE" | "*";
};

export type GuruLiveUpdateDetail = GuruLiveGuruPatch | GuruLiveRatesPatch;

/** Fields that matter for public cards / profile hero. */
export const GURU_LIVE_PATCH_KEYS = [
  "id",
  "user_id",
  "slug",
  "public_slug",
  "display_name",
  "full_name",
  "name",
  "title",
  "bio",
  "status",
  "application_status",
  "admin_status",
  "public_status",
  "booking_status",
  "is_public",
  "is_public_visible",
  "is_active",
  "is_bookable",
  "is_accepting_bookings",
  "accepting_bookings",
  "hourly_rate",
  "rate",
  "profile_photo_url",
  "photo_url",
  "avatar_url",
  "image_url",
  "services",
  "service_city",
  "service_state",
  "service_zip",
  "city",
  "state",
  "zip_code",
  "rating_avg",
  "rating",
  "review_count",
] as const;

export function pickGuruLiveFields(
  row: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!row || typeof row !== "object") return {};
  const next: Record<string, unknown> = {};
  for (const key of GURU_LIVE_PATCH_KEYS) {
    if (key in row) next[key] = row[key];
  }
  return next;
}

export function guruRowMatchesId(
  guru: Record<string, unknown>,
  incoming: Record<string, unknown>,
): boolean {
  const candidates = [
    guru.id,
    guru.guru_id,
    guru.user_id,
    guru.profile_id,
  ]
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  const incomingIds = [
    incoming.id,
    incoming.guru_id,
    incoming.user_id,
    incoming.profile_id,
  ]
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  if (candidates.some((id) => incomingIds.includes(id))) return true;

  const slug = String(guru.public_slug || guru.slug || "")
    .trim()
    .toLowerCase();
  const incomingSlug = String(incoming.public_slug || incoming.slug || "")
    .trim()
    .toLowerCase();
  return Boolean(slug && incomingSlug && slug === incomingSlug);
}

export function dispatchGuruLiveUpdate(detail: GuruLiveUpdateDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<GuruLiveUpdateDetail>(GURU_LIVE_UPDATE_EVENT, { detail }),
  );
}
