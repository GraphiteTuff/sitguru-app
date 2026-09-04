import { supabaseAdmin } from "@/lib/supabase/admin";
import { isGuruRoleValue } from "@/lib/auth/guru-access";

type AnyRow = Record<string, unknown>;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Find the Guru row for a login. Roles are additive: user_roles.guru is
 * enough even when profiles.role is still customer and the gurus row is
 * missing. Never invent a row for a Pet Parent-only account.
 */
export async function loadGuruProfileForUser(
  userId: string,
  email?: string | null,
): Promise<AnyRow | null> {
  const byUserId = await supabaseAdmin
    .from("gurus")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!byUserId.error && byUserId.data) {
    return byUserId.data as AnyRow;
  }

  const byProfileId = await supabaseAdmin
    .from("gurus")
    .select("*")
    .eq("profile_id", userId)
    .maybeSingle();

  if (!byProfileId.error && byProfileId.data) {
    return byProfileId.data as AnyRow;
  }

  const cleanEmail = text(email);
  if (cleanEmail) {
    const byEmail = await supabaseAdmin
      .from("gurus")
      .select("*")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (!byEmail.error && byEmail.data) {
      return byEmail.data as AnyRow;
    }
  }

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select(
        "id, full_name, display_name, name, email, role, account_type, profile_photo_url, avatar_url, image_url",
      )
      .eq("id", userId)
      .maybeSingle(),
    supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
  ]);

  const hasGuruRole =
    isGuruRoleValue((profile as AnyRow | null)?.role) ||
    isGuruRoleValue((profile as AnyRow | null)?.account_type) ||
    ((roleRows || []) as Array<{ role?: string | null }>).some((row) =>
      isGuruRoleValue(row.role),
    );

  if (!hasGuruRole || !profile) return null;

  const row = profile as AnyRow;
  return {
    id: row.id,
    user_id: userId,
    profile_id: row.id,
    email: row.email || cleanEmail,
    full_name: row.full_name || row.display_name || row.name,
    display_name: row.display_name || row.full_name || row.name,
    profile_photo_url: row.profile_photo_url,
    avatar_url: row.avatar_url,
    image_url: row.image_url,
    services: null,
    rate: null,
    hourly_rate: null,
    price: null,
    profile_completion: null,
    application_status: "profile_incomplete",
    status: "profile_incomplete",
    is_bookable: false,
    is_public: false,
  };
}
