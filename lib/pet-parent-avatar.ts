/**
 * Canonical Pet Parent avatar resolution for the web portal.
 * Header, dashboard, and profile hub must all use this so the same
 * photo appears everywhere (no stock fallbacks, no OAuth provider pics).
 */

export type PetParentAvatarSource = {
  profile_photo_url?: string | null;
  photo_url?: string | null;
  image_url?: string | null;
  avatar_url?: string | null;
  picture?: string | null;
  [key: string]: unknown;
};

export function isOAuthProviderAvatarUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return (
      hostname.includes("googleusercontent.com") ||
      hostname.includes("ggpht.com") ||
      hostname.includes("google.com") ||
      hostname.includes("googleapis.com") ||
      hostname.includes("facebook.com") ||
      hostname.includes("fbcdn.net") ||
      hostname.includes("apple.com")
    );
  } catch {
    return false;
  }
}

export function normalizePetParentAvatarUrl(value?: string | null) {
  if (!value) return "";
  const cleanValue = value.trim();
  if (!cleanValue) return "";
  if (isOAuthProviderAvatarUrl(cleanValue)) return "";

  if (
    cleanValue.startsWith("http://") ||
    cleanValue.startsWith("https://") ||
    cleanValue.startsWith("/") ||
    cleanValue.startsWith("data:image")
  ) {
    return cleanValue;
  }

  return `/${cleanValue}`;
}

function readSourceString(
  source: PetParentAvatarSource | null | undefined,
  key: string,
) {
  if (!source) return "";
  const value = source[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

/**
 * Prefer SitGuru-uploaded profile photo fields in Header order, then
 * auth metadata. Never return OAuth provider avatars or stock placeholders.
 */
export function resolvePetParentAvatarUrl(
  profile?: PetParentAvatarSource | null,
  metadata?: Record<string, unknown> | null,
) {
  const profileCandidates = [
    readSourceString(profile, "profile_photo_url"),
    readSourceString(profile, "photo_url"),
    readSourceString(profile, "image_url"),
    readSourceString(profile, "avatar_url"),
    readSourceString(profile, "picture"),
  ];

  for (const candidate of profileCandidates) {
    const normalized = normalizePetParentAvatarUrl(candidate);
    if (normalized) return normalized;
  }

  if (metadata) {
    const metadataCandidates = [
      metadata.profile_photo_url,
      metadata.photo_url,
      metadata.image_url,
      metadata.avatar_url,
      metadata.picture,
      metadata.avatar,
    ];

    for (const candidate of metadataCandidates) {
      const normalized = normalizePetParentAvatarUrl(
        typeof candidate === "string" ? candidate : null,
      );
      if (normalized) return normalized;
    }
  }

  return "";
}

/** Columns to keep in sync when a Pet Parent uploads a new photo. */
export const PET_PARENT_AVATAR_COLUMNS = [
  "profile_photo_url",
  "photo_url",
  "avatar_url",
  "image_url",
] as const;

export function petParentAvatarWritePayload(avatarUrl: string) {
  return {
    profile_photo_url: avatarUrl,
    photo_url: avatarUrl,
    avatar_url: avatarUrl,
    image_url: avatarUrl,
  };
}
