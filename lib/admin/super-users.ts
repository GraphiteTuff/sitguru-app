/**
 * Hardcoded SitGuru HQ super-user emails.
 * Kept in sync across proxy, admin login, and getAdminIdentity.
 */
export const SUPER_USER_EMAILS = [
  "jason@sitguru.com",
  "nette@sitguru.com",
] as const;

/**
 * Founder personal marketplace logins. These are real Pet Parent / Guru
 * accounts and must stay separate from the HQ Super Admin users above.
 * Jason Graff: jasongraff1978@gmail.com is personal; jason@sitguru.com is CEO HQ.
 */
export const FOUNDER_PERSONAL_MARKETPLACE_EMAILS = [
  "jasongraff1978@gmail.com",
] as const;

export function normalizeAdminEmail(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function isHardcodedSuperUserEmail(email: string | null | undefined) {
  return (SUPER_USER_EMAILS as readonly string[]).includes(
    normalizeAdminEmail(email),
  );
}

export function isFounderPersonalMarketplaceEmail(
  email: string | null | undefined,
) {
  return (FOUNDER_PERSONAL_MARKETPLACE_EMAILS as readonly string[]).includes(
    normalizeAdminEmail(email),
  );
}

/**
 * HQ Super Admin and founder personal accounts share a legal name on purpose.
 * Do not treat that name collision as a merge candidate.
 */
export function skipNameOnlyDuplicateMatch(email: string | null | undefined) {
  return (
    isHardcodedSuperUserEmail(email) ||
    isFounderPersonalMarketplaceEmail(email)
  );
}
