// lib/pawreport/admin-status.ts
/**
 * Sync PawReport global_tracking_status + last_gps_at (no heavy imports).
 */

import { supabaseAdmin } from "@/utils/supabase/admin";
import type { PawReportGlobalTrackingStatus } from "@/lib/pawreport/admin-types";

export async function syncSessionTrackingStatus(params: {
  bookingId: string;
  sessionId?: string | null;
  status: PawReportGlobalTrackingStatus;
  lastGpsAt?: string | null;
  clearFlag?: boolean;
}) {
  const timestamp = new Date().toISOString();
  const patch: Record<string, unknown> = {
    global_tracking_status: params.status,
    updated_at: timestamp,
  };

  if (params.lastGpsAt) patch.last_gps_at = params.lastGpsAt;
  if (params.clearFlag) patch.flagged_at = null;
  if (params.status === "ARCHIVED") patch.archived_at = timestamp;
  if (params.status === "FLAGGED_ALERT") patch.flagged_at = timestamp;

  let query = supabaseAdmin
    .from("booking_visit_sessions")
    .update(patch)
    .eq("booking_id", params.bookingId);

  if (params.sessionId) {
    query = query.eq("id", params.sessionId);
  }

  await query;

  const walkPatch: Record<string, unknown> = {
    global_tracking_status: params.status,
    updated_at: timestamp,
  };
  if (params.lastGpsAt) walkPatch.last_gps_at = params.lastGpsAt;

  await supabaseAdmin
    .from("booking_walk_tracks")
    .update(walkPatch)
    .eq("booking_id", params.bookingId)
    .in("status", ["in_progress", "paused", "completed"]);
}
