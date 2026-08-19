/**
 * When gurus/profiles lack a photo, copy Google (or other OAuth) avatar from
 * auth metadata and persist it so public profiles, search, and map stay in sync.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
}

/** Prefer a larger Google profile image when the OAuth URL is a tiny thumb. */
export function upgradeProviderAvatarUrl(url: string) {
  const trimmed = String(url || "").trim();
  if (!trimmed) return "";

  if (/googleusercontent\.com/i.test(trimmed)) {
    if (/=s\d+-c\b/i.test(trimmed)) {
      return trimmed.replace(/=s\d+-c\b/i, "=s512-c");
    }
    if (/=s\d+\b/i.test(trimmed)) {
      return trimmed.replace(/=s\d+\b/i, "=s512");
    }
  }

  return trimmed;
}

export async function findAuthMetadataAvatarUrl(userId: string | null | undefined) {
  const id = String(userId || "").trim();
  if (!id) return null;

  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
    if (error || !data?.user) return null;

    const metadata = (data.user.user_metadata || {}) as Record<string, unknown>;
    const raw = firstText(
      metadata.avatar_url,
      metadata.picture,
      metadata.profile_photo_url,
      metadata.photo_url,
    );

    if (!raw) return null;
    return upgradeProviderAvatarUrl(raw);
  } catch {
    return null;
  }
}

async function softUpdatePhotoFields(
  table: "gurus" | "profiles",
  id: string,
  avatarUrl: string,
) {
  const now = new Date().toISOString();
  const attempts: Array<Record<string, unknown>> = [
    {
      avatar_url: avatarUrl,
      profile_photo_url: avatarUrl,
      photo_url: avatarUrl,
      image_url: avatarUrl,
      updated_at: now,
    },
    {
      avatar_url: avatarUrl,
      profile_photo_url: avatarUrl,
      photo_url: avatarUrl,
      updated_at: now,
    },
    {
      avatar_url: avatarUrl,
      updated_at: now,
    },
  ];

  for (const payload of attempts) {
    try {
      const { error } = await supabaseAdmin.from(table).update(payload).eq("id", id);
      if (!error) return;
    } catch {
      // Try a smaller payload next.
    }
  }
}

export async function persistGuruAvatarFromAuth(options: {
  avatarUrl: string;
  guruId?: string | null;
  profileId?: string | null;
}) {
  const avatarUrl = upgradeProviderAvatarUrl(options.avatarUrl);
  if (!avatarUrl) return;

  const guruId = String(options.guruId || "").trim();
  const profileId = String(options.profileId || "").trim();

  if (guruId) await softUpdatePhotoFields("gurus", guruId, avatarUrl);
  if (profileId) await softUpdatePhotoFields("profiles", profileId, avatarUrl);
}
