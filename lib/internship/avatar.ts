import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolvePetParentAvatarUrl } from "@/lib/pet-parent-avatar";
import type { InternshipIntern } from "@/lib/internship/types";

type ProfileAvatarRow = {
  id?: string | null;
  email?: string | null;
  profile_photo_url?: string | null;
  photo_url?: string | null;
  image_url?: string | null;
  avatar_url?: string | null;
};

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export function internAvatarFromProfile(
  profile?: ProfileAvatarRow | Record<string, unknown> | null,
  metadata?: Record<string, unknown> | null,
) {
  return resolvePetParentAvatarUrl(profile, metadata);
}

export async function attachInternAvatars(
  interns: InternshipIntern[],
): Promise<InternshipIntern[]> {
  if (!interns.length) return interns;

  const userIds = [
    ...new Set(interns.map((intern) => intern.userId).filter(Boolean)),
  ] as string[];
  const emails = [
    ...new Set(interns.map((intern) => normalizeEmail(intern.email)).filter(Boolean)),
  ];

  const [byIdResult, byEmailResult] = await Promise.all([
    userIds.length
      ? supabaseAdmin
          .from("profiles")
          .select("id,email,profile_photo_url,photo_url,image_url,avatar_url")
          .in("id", userIds)
      : Promise.resolve({ data: [] as ProfileAvatarRow[] }),
    emails.length
      ? supabaseAdmin
          .from("profiles")
          .select("id,email,profile_photo_url,photo_url,image_url,avatar_url")
          .in("email", emails)
      : Promise.resolve({ data: [] as ProfileAvatarRow[] }),
  ]);

  const byUserId = new Map<string, string>();
  const byEmail = new Map<string, string>();

  for (const row of (byIdResult.data || []) as ProfileAvatarRow[]) {
    const url = internAvatarFromProfile(row);
    if (row.id && url) byUserId.set(String(row.id), url);
    const email = normalizeEmail(row.email);
    if (email && url) byEmail.set(email, url);
  }
  for (const row of (byEmailResult.data || []) as ProfileAvatarRow[]) {
    const url = internAvatarFromProfile(row);
    const email = normalizeEmail(row.email);
    if (email && url) byEmail.set(email, url);
    if (row.id && url && !byUserId.has(String(row.id))) {
      byUserId.set(String(row.id), url);
    }
  }

  return interns.map((intern) => ({
    ...intern,
    avatarUrl:
      intern.avatarUrl ||
      (intern.userId ? byUserId.get(intern.userId) : "") ||
      byEmail.get(normalizeEmail(intern.email)) ||
      "",
  }));
}

export async function attachInternAvatar(intern: InternshipIntern | null) {
  if (!intern) return null;
  const [withAvatar] = await attachInternAvatars([intern]);
  return withAvatar || intern;
}

export async function lookupProfileAvatarForUser(input: {
  userId?: string | null;
  email?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const userId = String(input.userId || "").trim();
  const email = normalizeEmail(input.email);

  if (userId) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id,email,profile_photo_url,photo_url,image_url,avatar_url")
      .eq("id", userId)
      .maybeSingle();
    const url = internAvatarFromProfile(data, input.metadata);
    if (url) return url;
  }

  if (email) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id,email,profile_photo_url,photo_url,image_url,avatar_url")
      .eq("email", email)
      .maybeSingle();
    const url = internAvatarFromProfile(data, input.metadata);
    if (url) return url;
  }

  return internAvatarFromProfile(null, input.metadata);
}
