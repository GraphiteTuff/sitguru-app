/**
 * Shared helpers for deciding whether a Guru has a real profile photo
 * suitable for public homepage / carousel surfaces.
 */

type PhotoSource = {
  profile_photo_url?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
};

const PLACEHOLDER_PHOTO_PATTERNS = [
  "sitguru-logo",
  "sitguru-admin-avatar",
  "sitguru-message-avatar",
  "/images/demo/",
  "placeholder",
];

function isPlaceholderGuruPhoto(url: string) {
  const lower = url.toLowerCase();
  return PLACEHOLDER_PHOTO_PATTERNS.some((pattern) => lower.includes(pattern));
}

/** First real (non-placeholder) photo URL on a Guru row, or null. */
export function getGuruProfilePhotoUrl(
  guru: PhotoSource | null | undefined,
): string | null {
  if (!guru) return null;

  const candidates = [
    guru.profile_photo_url,
    guru.photo_url,
    guru.avatar_url,
    guru.image_url,
  ];

  for (const candidate of candidates) {
    const photoUrl = String(candidate || "").trim();
    if (!photoUrl) continue;
    if (isPlaceholderGuruPhoto(photoUrl)) continue;
    return photoUrl;
  }

  return null;
}

/** True when the Guru has an uploaded/profile photo (not a site default). */
export function hasGuruProfilePhoto(
  guru: PhotoSource | null | undefined,
): boolean {
  return Boolean(getGuruProfilePhotoUrl(guru));
}
