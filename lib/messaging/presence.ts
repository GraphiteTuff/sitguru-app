// lib/messaging/presence.ts
/**
 * Online presence for omnichannel SMS outfall (offline → Twilio SMS)
 * and staff desk directory (Ava + interns).
 */

import { supabaseAdmin } from "@/utils/supabase/admin";

/** Consider offline if no heartbeat within this window */
export const PRESENCE_OFFLINE_MS = 2 * 60 * 1000;

export function presenceRowIsOnline(
  row: { last_seen_at?: string | null; is_online?: boolean | null } | null | undefined,
  now = Date.now(),
) {
  if (!row) return false;
  if (row.is_online === false) return false;
  const lastSeen = String(row.last_seen_at || "").trim();
  if (!lastSeen) return false;
  const seenAt = new Date(lastSeen).getTime();
  if (!Number.isFinite(seenAt)) return false;
  return now - seenAt < PRESENCE_OFFLINE_MS;
}

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

  if (data) return presenceRowIsOnline(data as { last_seen_at?: string; is_online?: boolean }, now);

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("last_seen_at")
    .eq("id", id)
    .maybeSingle();
  return presenceRowIsOnline(
    { last_seen_at: (profile as { last_seen_at?: string } | null)?.last_seen_at, is_online: true },
    now,
  );
}

/** Batch online map for staff directory rows. */
export async function mapUsersOnline(userIds: string[], now = Date.now()) {
  const ids = [...new Set(userIds.map((id) => String(id || "").trim()).filter(Boolean))];
  const online = new Map<string, boolean>();
  for (const id of ids) online.set(id, false);
  if (!ids.length) return online;

  const { data: presenceRows } = await supabaseAdmin
    .from("user_presence")
    .select("user_id,last_seen_at,is_online")
    .in("user_id", ids);

  const seen = new Set<string>();
  for (const row of (presenceRows || []) as Array<{
    user_id?: string;
    last_seen_at?: string;
    is_online?: boolean;
  }>) {
    const id = String(row.user_id || "").trim();
    if (!id) continue;
    seen.add(id);
    online.set(id, presenceRowIsOnline(row, now));
  }

  const missing = ids.filter((id) => !seen.has(id));
  if (!missing.length) return online;

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id,last_seen_at")
    .in("id", missing);

  for (const row of (profiles || []) as Array<{ id?: string; last_seen_at?: string }>) {
    const id = String(row.id || "").trim();
    if (!id) continue;
    online.set(id, presenceRowIsOnline({ last_seen_at: row.last_seen_at, is_online: true }, now));
  }

  return online;
}
