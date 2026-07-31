// lib/messaging/presence.ts
/**
 * Online presence for omnichannel SMS outfall (offline → Twilio SMS).
 */

import { supabaseAdmin } from "@/utils/supabase/admin";

/** Consider offline if no heartbeat within this window */
export const PRESENCE_OFFLINE_MS = 2 * 60 * 1000;

export async function touchUserPresence(params: {
  userId: string;
  isOnline?: boolean;
  deviceLabel?: string;
}) {
  const now = new Date().toISOString();
  const row = {
    user_id: params.userId,
    last_seen_at: now,
    is_online: params.isOnline ?? true,
    device_label: params.deviceLabel || null,
    updated_at: now,
  };

  const { error } = await supabaseAdmin.from("user_presence").upsert(row, {
    onConflict: "user_id",
  });

  if (error) {
    // Fallback: profiles.last_seen_at only
    await supabaseAdmin
      .from("profiles")
      .update({ last_seen_at: now })
      .eq("id", params.userId);
    return { ok: false as const, error: error.message };
  }

  await supabaseAdmin
    .from("profiles")
    .update({ last_seen_at: now })
    .eq("id", params.userId);

  return { ok: true as const };
}

export async function isUserOnline(userId: string, now = Date.now()): Promise<boolean> {
  const id = String(userId || "").trim();
  if (!id) return false;

  const { data } = await supabaseAdmin
    .from("user_presence")
    .select("last_seen_at,is_online")
    .eq("user_id", id)
    .maybeSingle();

  const lastSeen =
    (data as { last_seen_at?: string; is_online?: boolean } | null)?.last_seen_at ||
    null;

  if (!lastSeen) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("last_seen_at")
      .eq("id", id)
      .maybeSingle();
    const profileSeen = (profile as { last_seen_at?: string } | null)?.last_seen_at;
    if (!profileSeen) return false;
    return now - new Date(profileSeen).getTime() < PRESENCE_OFFLINE_MS;
  }

  const row = data as { last_seen_at?: string; is_online?: boolean };
  if (row.is_online === false) return false;
  return now - new Date(String(row.last_seen_at)).getTime() < PRESENCE_OFFLINE_MS;
}
