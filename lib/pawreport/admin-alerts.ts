// lib/pawreport/admin-alerts.ts
/**
 * Safety alerts — stale GPS → FLAGGED_ALERT + admin console notifications.
 */

import { supabaseAdmin } from "@/utils/supabase/admin";
import {
  GPS_STALE_ALERT_MS,
  type PawReportGlobalTrackingStatus,
} from "@/lib/pawreport/admin-types";

async function listAdminUserIds() {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(200);

  if (error) {
    console.warn("[admin-alerts] list admins failed:", error.message);
    return [] as string[];
  }

  return (data || [])
    .map((row) => String((row as { id?: string }).id || "").trim())
    .filter(Boolean);
}

async function notifyAdmins(params: {
  title: string;
  body: string;
  bookingId: string;
}) {
  const adminIds = await listAdminUserIds();
  if (!adminIds.length) return 0;

  const href = `/admin/dashboard/live-walks?bookingId=${encodeURIComponent(params.bookingId)}`;
  const now = new Date().toISOString();
  const rows = adminIds.map((userId) => ({
    user_id: userId,
    title: params.title,
    body: params.body,
    type: "pawreport_admin_safety_alert",
    href,
    link: href,
    is_read: false,
    created_at: now,
    updated_at: now,
  }));

  const { error } = await supabaseAdmin.from("notifications").insert(rows);
  if (error) {
    console.warn("[admin-alerts] notifyAdmins failed:", error.message);
    return 0;
  }
  return rows.length;
}

/**
 * If a walk is ACTIVE_TRACKING but no GPS ping for >15 minutes,
 * flip to FLAGGED_ALERT and notify every admin profile.
 */
export async function evaluateStaleGpsSafetyAlerts(options?: {
  now?: Date;
  staleMs?: number;
}): Promise<{ flagged: number; bookingIds: string[] }> {
  const now = options?.now || new Date();
  const staleMs = options?.staleMs ?? GPS_STALE_ALERT_MS;
  const cutoffIso = new Date(now.getTime() - staleMs).toISOString();

  const { data: sessions, error } = await supabaseAdmin
    .from("booking_visit_sessions")
    .select("id,booking_id,global_tracking_status,last_gps_at,started_at,status")
    .eq("global_tracking_status", "ACTIVE_TRACKING" satisfies PawReportGlobalTrackingStatus)
    .limit(500);

  if (error) {
    console.warn("[admin-alerts] load ACTIVE_TRACKING sessions failed:", error.message);
    return { flagged: 0, bookingIds: [] };
  }

  const flaggedBookingIds: string[] = [];

  for (const session of sessions || []) {
    const bookingId = String(
      (session as { booking_id?: string }).booking_id || "",
    ).trim();
    const sessionId = String((session as { id?: string }).id || "").trim();
    if (!bookingId || !sessionId) continue;

    const lastGpsAt = (session as { last_gps_at?: string | null }).last_gps_at;
    const startedAt = (session as { started_at?: string | null }).started_at;
    const reference = lastGpsAt || startedAt;
    if (!reference) continue;

    if (new Date(reference).getTime() > new Date(cutoffIso).getTime()) {
      continue;
    }

    const flaggedAt = now.toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("booking_visit_sessions")
      .update({
        global_tracking_status: "FLAGGED_ALERT",
        flagged_at: flaggedAt,
        updated_at: flaggedAt,
      })
      .eq("id", sessionId)
      .eq("global_tracking_status", "ACTIVE_TRACKING");

    if (updateError) {
      console.warn("[admin-alerts] flag session failed:", updateError.message);
      continue;
    }

    await supabaseAdmin
      .from("booking_walk_tracks")
      .update({
        global_tracking_status: "FLAGGED_ALERT",
        updated_at: flaggedAt,
      })
      .eq("booking_id", bookingId)
      .in("status", ["in_progress", "paused"]);

    await supabaseAdmin.from("booking_visit_updates").insert({
      session_id: sessionId,
      booking_id: bookingId,
      update_type: "note",
      note: "FLAGGED_ALERT: No GPS ping received for more than 15 minutes. Admin safety review required.",
    });

    await notifyAdmins({
      bookingId,
      title: "PawReport safety alert",
      body: `GPS signal lost for >15 mins on booking ${bookingId}. Check in with the Guru.`,
    });

    flaggedBookingIds.push(bookingId);
  }

  return { flagged: flaggedBookingIds.length, bookingIds: flaggedBookingIds };
}
