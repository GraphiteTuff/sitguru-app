/**
 * Temporary public-surface tombstone for a Guru account removed by the owner.
 *
 * Supabase Auth deletion does not necessarily remove denormalized Guru search
 * projections, public-search overrides, or retained Guru/profile rows. Block
 * the confirmed account identifiers while the backend records are reconciled.
 * This changes public rendering only; it never deletes booking/audit history.
 */
const REMOVED_ACCOUNT_IDENTIFIERS = new Set([
  "b583515d-df26-4495-a559-223e664d2ea3", // Auth user
  "e691e4a4-60c9-49ce-9d68-ee82c630a0cc", // Guru record
  "la.kurtycz@gmail.com", // Linked account email
  "laura-kurtycz-b583515d", // Public URL
]);

const REMOVED_PROFILE_SLUGS = new Set([
  "laura-kurtycz",
  "laura-kurtycz-b583515d",
]);

function normalized(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim().toLowerCase()
    : "";
}

/** The public route must also block the URL even if every DB record is gone. */
export function isRemovedGuruProfileIdentifier(identifier: unknown): boolean {
  const value = normalized(identifier);
  return REMOVED_ACCOUNT_IDENTIFIERS.has(value) || REMOVED_PROFILE_SLUGS.has(value);
}

/**
 * Match only confirmed identifiers, or the full name plus location of the
 * removed record to catch orphaned materialized search projections.
 * Other Gurus sharing a partial name should not be hidden.
 */
export function isRemovedGuruAccount(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const guru = value as Record<string, unknown>;

  const identifiers = [
    guru.id,
    guru.user_id,
    guru.profile_id,
    guru.guru_id,
    guru.email,
    guru.slug,
    guru.public_slug,
    guru.source_id,
  ];

  if (identifiers.some((id) => REMOVED_ACCOUNT_IDENTIFIERS.has(normalized(id)))) {
    return true;
  }

  const name = normalized(guru.full_name || guru.display_name || guru.name);
  if (name !== "laura kurtycz") return false;

  const zip = normalized(guru.zip_code || guru.service_zip || guru.service_zip_code || guru.postal_code);
  if (zip === "49505") return true;
  const city = normalized(guru.city || guru.service_city);
  const state = normalized(guru.state || guru.service_state);
  return city === "grand rapids" && (state === "mi" || state === "michigan");
}
