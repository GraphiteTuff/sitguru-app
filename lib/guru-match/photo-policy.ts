/**
 * Trusted, public-facing photo sources for personalized Guru Match posters.
 *
 * An individual Guru's social poster must use their own uploaded photo, never
 * an unrelated marketing stock photo. The current upload limit allows normal
 * full-resolution phone pictures (the former 2 MB limit rejected many).
 */
export const MAX_GURU_MATCH_PHOTO_BYTES = 12_000_000;
export const MAX_GURU_MATCH_PHOTO_PIXELS = 40_000_000;
export const GURU_MATCH_PHOTO_TIMEOUT_MS = 9000;

export function trustedGuruMatchPhotoUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    const isStorage = host === "mmtjhxnzuglbyumbsjhs.supabase.co" &&
      (/^\/storage\/v1\/object\/(?:public|sign)\//.test(url.pathname) ||
        /^\/storage\/v1\/render\/image\/(?:public|sign)\//.test(url.pathname));
    const isGoogle = host === "lh3.googleusercontent.com";
    const isSitGuruAuth = host === "auth.sitguru.com";
    if (!isStorage && !isGoogle && !isSitGuruAuth) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function allowedGuruMatchPhotoBytes(bytes: number): boolean {
  return Number.isFinite(bytes) && bytes > 0 && bytes <= MAX_GURU_MATCH_PHOTO_BYTES;
}
