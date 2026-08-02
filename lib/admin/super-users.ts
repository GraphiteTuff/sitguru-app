/**
 * Hardcoded SitGuru HQ super-user emails.
 * Kept in sync across proxy, admin login, and getAdminIdentity.
 */
export const SUPER_USER_EMAILS = [
  "jason@sitguru.com",
  "nette@sitguru.com",
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
