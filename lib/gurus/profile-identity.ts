/**
 * Safe identity checks for public Guru profile and image lookups.
 * A matching display name alone does not prove two rows belong to the same account.
 */
export type GuruIdentityFields = {
  id?: string | number | null;
  user_id?: string | null;
  profile_id?: string | null;
  email?: string | null;
  slug?: string | null;
  public_slug?: string | null;
};

function normalizedId(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function normalizedSlug(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function accountIds(guru: GuruIdentityFields): string[] {
  return [guru.id, guru.user_id, guru.profile_id]
    .map(normalizedId)
    .filter(Boolean);
}

/** Only reuse media across rows with a shared immutable ID or account email. */
export function isSameGuruAccount(
  left: GuruIdentityFields | null | undefined,
  right: GuruIdentityFields | null | undefined,
): boolean {
  if (!left || !right) return false;

  const leftIds = accountIds(left);
  const rightIds = new Set(accountIds(right));
  if (leftIds.some((id) => rightIds.has(id))) return true;

  const leftEmail = normalizedId(left.email);
  const rightEmail = normalizedId(right.email);
  return Boolean(
    leftEmail &&
    rightEmail &&
    leftEmail === rightEmail &&
    !leftEmail.endsWith("@placeholder.sitguru.local"),
  );
}

/** Exact stored slug or immutable ID prefix must outrank a profile photo. */
export function getGuruUrlMatchPriority(
  guru: GuruIdentityFields,
  identifier: string,
): number {
  const requested = normalizedSlug(identifier);
  if (!requested) return 0;

  if (
    [guru.public_slug, guru.slug]
      .map(normalizedSlug)
      .some((slug) => slug && slug === requested)
  ) {
    return 3;
  }

  const prefix = requested.match(/-([0-9a-f]{6,8})$/)?.[1];
  if (!prefix) return 0;

  if (
    accountIds(guru).some((id) =>
      id.replace(/-/g, "").startsWith(prefix),
    )
  ) {
    return 2;
  }

  return 0;
}
