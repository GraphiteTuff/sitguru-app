/**
 * Pure identity gate for Page access tokens returned by Meta Graph /me/accounts.
 * Never choose a different Page, even if a system user manages multiple Pages.
 * Caller must keep the credential server-side and never log the token.
 */
export function verifiedSitGuruFacebookPageToken(
  records: unknown,
  verifiedPageId: string,
): string | null {
  if (!Array.isArray(records)) return null;
  for (const item of records) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const page = item as Record<string, unknown>;
    if (page.id !== verifiedPageId || page.name !== "SitGuru") continue;
    if (typeof page.access_token !== "string") continue;
    const token = page.access_token.trim();
    if (token) return token;
  }
  return null;
}
