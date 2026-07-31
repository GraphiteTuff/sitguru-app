// lib/pawreport/admin-reports.ts
/**
 * Admin PawReport list, metrics, and override helpers.
 */

import { supabaseAdmin } from "@/utils/supabase/admin";
import { evaluateStaleGpsSafetyAlerts } from "@/lib/pawreport/admin-alerts";
import { syncSessionTrackingStatus } from "@/lib/pawreport/admin-status";
import { executeWalkAction } from "@/lib/pawreport/walk-actions";
import { sendSms } from "@/lib/services/twilio";
import {
  GPS_STALE_ALERT_MS,
  PAWREPORT_GLOBAL_TRACKING_STATUSES,
  type AdminLiveWalkRow,
  type AdminLiveWalkStats,
  type AdminReportFilters,
  type AdminReportsListResult,
  type PawReportGlobalTrackingStatus,
} from "@/lib/pawreport/admin-types";

export { syncSessionTrackingStatus } from "@/lib/pawreport/admin-status";

function asNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asString(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function isTrackingStatus(value: string): value is PawReportGlobalTrackingStatus {
  return (PAWREPORT_GLOBAL_TRACKING_STATUSES as readonly string[]).includes(value);
}

function deriveStatus(params: {
  global?: string | null;
  walkStatus?: string | null;
  sessionStatus?: string | null;
}): PawReportGlobalTrackingStatus {
  const global = asString(params.global);
  if (isTrackingStatus(global)) return global;

  const walk = asString(params.walkStatus).toLowerCase();
  if (walk === "paused") return "PAUSED_BREAK";
  if (walk === "in_progress") return "ACTIVE_TRACKING";
  if (walk === "completed") return "COMPLETED";

  const session = asString(params.sessionStatus).toLowerCase();
  if (session === "completed") return "COMPLETED";
  if (session === "canceled") return "ARCHIVED";
  if (session === "in_progress") return "ACTIVE_TRACKING";
  return "PRE_WALK";
}

function displayName(row: Record<string, unknown> | null | undefined, fallback: string) {
  if (!row) return fallback;
  return (
    asString(row.full_name) ||
    asString(row.display_name) ||
    asString(row.name) ||
    asString(row.first_name) ||
    fallback
  );
}

export async function writeAdminAudit(params: {
  bookingId: string;
  sessionId?: string | null;
  adminUserId: string;
  action: string;
  detail?: string;
  metadata?: Record<string, unknown>;
}) {
  await supabaseAdmin.from("pawreport_admin_audit").insert({
    booking_id: params.bookingId,
    session_id: params.sessionId || null,
    admin_user_id: params.adminUserId,
    action: params.action,
    detail: params.detail || null,
    metadata: params.metadata || {},
  });
}

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function computeLiveWalkStats(): Promise<AdminLiveWalkStats> {
  const [
    { data: activeWalks },
    { count: flaggedCount },
    { count: preWalkCount },
    { data: todayPoints },
  ] = await Promise.all([
    supabaseAdmin
      .from("booking_walk_tracks")
      .select("id")
      .in("status", ["in_progress", "paused"]),
    supabaseAdmin
      .from("booking_visit_sessions")
      .select("id", { count: "exact", head: true })
      .eq("global_tracking_status", "FLAGGED_ALERT"),
    supabaseAdmin
      .from("booking_visit_sessions")
      .select("id", { count: "exact", head: true })
      .eq("global_tracking_status", "PRE_WALK"),
    supabaseAdmin
      .from("booking_walk_tracks")
      .select("total_distance_meters")
      .gte("started_at", startOfTodayIso()),
  ]);

  let todayMeters = 0;
  for (const row of todayPoints || []) {
    todayMeters += asNumber(
      (row as { total_distance_meters?: number }).total_distance_meters,
    );
  }

  return {
    totalActiveWalks: (activeWalks || []).length,
    totalDistanceTrackedTodayMiles: Number((todayMeters / 1609.344).toFixed(2)),
    activeAlerts: flaggedCount || 0,
    gurusEnRoute: preWalkCount || 0,
  };
}

export async function listAdminPawReports(
  filters: AdminReportFilters = {},
): Promise<AdminReportsListResult> {
  let scannedAlerts = 0;
  if (filters.liveOnly) {
    const scan = await evaluateStaleGpsSafetyAlerts();
    scannedAlerts = scan.flagged;
  }

  const limit = Math.min(Math.max(filters.limit || 100, 1), 250);
  const offset = Math.max(filters.offset || 0, 0);

  // Base from sessions (always one PawReport per booking)
  let sessionQuery = supabaseAdmin
    .from("booking_visit_sessions")
    .select(
      "id,booking_id,guru_id,status,global_tracking_status,admin_notes,last_gps_at,flagged_at,started_at,ended_at,created_at",
      { count: "exact" },
    )
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.guruId) {
    sessionQuery = sessionQuery.eq("guru_id", filters.guruId);
  }

  if (filters.trackingStatus && filters.trackingStatus !== "ACTIVE_ANY") {
    sessionQuery = sessionQuery.eq(
      "global_tracking_status",
      filters.trackingStatus,
    );
  } else if (filters.liveOnly || filters.trackingStatus === "ACTIVE_ANY") {
    sessionQuery = sessionQuery.in("global_tracking_status", [
      "PRE_WALK",
      "ACTIVE_TRACKING",
      "PAUSED_BREAK",
      "FLAGGED_ALERT",
    ]);
  }

  if (filters.dateFrom) {
    sessionQuery = sessionQuery.gte("created_at", filters.dateFrom);
  }
  if (filters.dateTo) {
    sessionQuery = sessionQuery.lte("created_at", filters.dateTo);
  }

  const { data: sessions, error, count } = await sessionQuery;
  if (error) {
    throw new Error(error.message || "Unable to load PawReports.");
  }

  const sessionRows = (sessions || []) as Array<Record<string, unknown>>;
  const bookingIds = sessionRows
    .map((row) => asString(row.booking_id))
    .filter(Boolean);

  if (!bookingIds.length) {
    return {
      rows: [],
      stats: await computeLiveWalkStats(),
      total: count || 0,
      scannedAlerts,
    };
  }

  const [{ data: bookings }, { data: walks }] = await Promise.all([
    supabaseAdmin.from("bookings").select("*").in("id", bookingIds),
    supabaseAdmin
      .from("booking_walk_tracks")
      .select(
        "id,booking_id,status,total_distance_meters,total_duration_seconds,started_at,last_gps_at,global_tracking_status,updated_at",
      )
      .in("booking_id", bookingIds)
      .order("updated_at", { ascending: false }),
  ]);

  const bookingById = new Map<string, Record<string, unknown>>();
  for (const booking of bookings || []) {
    bookingById.set(asString((booking as { id?: string }).id), booking as Record<string, unknown>);
  }

  const latestWalkByBooking = new Map<string, Record<string, unknown>>();
  for (const walk of walks || []) {
    const id = asString((walk as { booking_id?: string }).booking_id);
    if (!id || latestWalkByBooking.has(id)) continue;
    latestWalkByBooking.set(id, walk as Record<string, unknown>);
  }

  // Optional profile names
  const guruIds = new Set<string>();
  const parentIds = new Set<string>();
  for (const booking of bookingById.values()) {
    const guru =
      asString(booking.guru_id) ||
      asString(booking.provider_id) ||
      asString(booking.sitter_id);
    const parent =
      asString(booking.pet_owner_id) ||
      asString(booking.customer_id) ||
      asString(booking.user_id);
    if (guru) guruIds.add(guru);
    if (parent) parentIds.add(parent);
  }

  const profileIds = [...guruIds, ...parentIds];
  const profileById = new Map<string, Record<string, unknown>>();
  if (profileIds.length) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id,full_name,display_name,name,first_name,phone,mobile_phone")
      .in("id", profileIds);
    for (const profile of profiles || []) {
      profileById.set(
        asString((profile as { id?: string }).id),
        profile as Record<string, unknown>,
      );
    }
  }

  const lastEventByBooking = new Map<
    string,
    { update_type: string; note: string | null }
  >();
  if (bookingIds.length) {
    const { data: updates } = await supabaseAdmin
      .from("booking_visit_updates")
      .select("booking_id,update_type,note,created_at")
      .in("booking_id", bookingIds)
      .order("created_at", { ascending: false })
      .limit(Math.min(bookingIds.length * 3, 600));

    for (const update of updates || []) {
      const id = asString((update as { booking_id?: string }).booking_id);
      if (!id || lastEventByBooking.has(id)) continue;
      lastEventByBooking.set(id, {
        update_type: asString((update as { update_type?: string }).update_type),
        note: asString((update as { note?: string | null }).note) || null,
      });
    }
  }

  const now = Date.now();
  const rows: AdminLiveWalkRow[] = [];

  for (const session of sessionRows) {
    const bookingId = asString(session.booking_id);
    const booking = bookingById.get(bookingId) || {};
    const walk = latestWalkByBooking.get(bookingId) || null;

    const guruId =
      asString(session.guru_id) ||
      asString(booking.guru_id) ||
      asString(booking.provider_id) ||
      null;
    const petParentId =
      asString(booking.pet_owner_id) ||
      asString(booking.customer_id) ||
      asString(booking.user_id) ||
      null;

    if (filters.petParentId && petParentId !== filters.petParentId) {
      continue;
    }

    const bookingStatus = asString(booking.status) || null;
    if (
      filters.bookingStatus &&
      bookingStatus?.toLowerCase() !== filters.bookingStatus.toLowerCase()
    ) {
      continue;
    }

    const petName =
      asString(booking.pet_name) ||
      asString(booking.petName) ||
      asString(booking.animal_name) ||
      "Scout";

    if (filters.query) {
      const q = filters.query.toLowerCase();
      const hay = [
        bookingId,
        petName,
        guruId,
        petParentId,
        bookingStatus,
        asString(session.admin_notes),
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) continue;
    }

    const lastGpsAt =
      asString(session.last_gps_at) ||
      asString(walk?.last_gps_at) ||
      null;
    const globalTrackingStatus = deriveStatus({
      global: asString(session.global_tracking_status),
      walkStatus: asString(walk?.status),
      sessionStatus: asString(session.status),
    });

    const staleMinutes =
      lastGpsAt &&
      (globalTrackingStatus === "ACTIVE_TRACKING" ||
        globalTrackingStatus === "FLAGGED_ALERT")
        ? Math.max(0, Math.round((now - new Date(lastGpsAt).getTime()) / 60000))
        : null;

    const distanceMeters = asNumber(walk?.total_distance_meters);
    const durationSeconds = asNumber(walk?.total_duration_seconds);
    const lastEvent = lastEventByBooking.get(bookingId) || null;
    const { lastEventType, lastEventLabel } = resolveLastEventBadge(
      lastEvent,
      globalTrackingStatus,
    );

    const guruProfile = guruId ? profileById.get(guruId) : null;
    const guruPhone =
      asString(guruProfile?.phone) ||
      asString(guruProfile?.mobile_phone) ||
      asString(booking.guru_phone) ||
      asString(booking.provider_phone) ||
      null;

    rows.push({
      bookingId,
      sessionId: asString(session.id) || null,
      walkTrackId: walk ? asString(walk.id) || null : null,
      petName,
      guruId,
      guruName: displayName(guruProfile, "Guru"),
      guruPhone,
      petParentId,
      petParentName: displayName(
        petParentId ? profileById.get(petParentId) : null,
        "Pet Parent",
      ),
      bookingStatus,
      globalTrackingStatus,
      walkStatus: walk ? asString(walk.status) || null : null,
      adminNotes: asString(session.admin_notes) || null,
      lastGpsAt,
      flaggedAt: asString(session.flagged_at) || null,
      startedAt:
        asString(session.started_at) || asString(walk?.started_at) || null,
      distanceMeters,
      durationSeconds,
      distanceMiles: Number((distanceMeters / 1609.344).toFixed(2)),
      durationMinutes: Math.round(durationSeconds / 60),
      staleMinutes,
      isStaleAlert:
        globalTrackingStatus === "FLAGGED_ALERT" ||
        (staleMinutes != null && staleMinutes >= GPS_STALE_ALERT_MS / 60000),
      lastEventType,
      lastEventLabel,
    });
  }

  rows.sort((a, b) => {
    const aFlag =
      a.globalTrackingStatus === "FLAGGED_ALERT" || a.isStaleAlert ? 1 : 0;
    const bFlag =
      b.globalTrackingStatus === "FLAGGED_ALERT" || b.isStaleAlert ? 1 : 0;
    if (aFlag !== bFlag) return bFlag - aFlag;
    const aStale = a.staleMinutes ?? -1;
    const bStale = b.staleMinutes ?? -1;
    return bStale - aStale;
  });

  return {
    rows,
    stats: await computeLiveWalkStats(),
    total: count || rows.length,
    scannedAlerts,
  };
}

function resolveLastEventBadge(
  lastEvent: { update_type: string; note: string | null } | null,
  status: PawReportGlobalTrackingStatus,
): { lastEventType: string; lastEventLabel: string } {
  const type = asString(lastEvent?.update_type).toLowerCase();
  const note = asString(lastEvent?.note).toLowerCase();

  if (type === "pee" || type === "poop" || note.includes("potty")) {
    return { lastEventType: "potty", lastEventLabel: "💩 Potty" };
  }
  if (note.includes("walk_break") || note.includes("break") || type === "break") {
    return { lastEventType: "break", lastEventLabel: "🌲 Break" };
  }
  if (type === "walk" && note.includes("ended")) {
    return { lastEventType: "ended", lastEventLabel: "✅ Ended" };
  }
  if (status === "PAUSED_BREAK") {
    return { lastEventType: "break", lastEventLabel: "🌲 Break" };
  }
  if (status === "PRE_WALK") {
    return { lastEventType: "pre_walk", lastEventLabel: "🚗 En route" };
  }
  if (status === "FLAGGED_ALERT") {
    return { lastEventType: "alert", lastEventLabel: "⚠ Dead zone" };
  }
  if (type === "walk" || status === "ACTIVE_TRACKING") {
    return { lastEventType: "walking", lastEventLabel: "🏃 Walking" };
  }
  return { lastEventType: type || "note", lastEventLabel: "📝 Update" };
}

export async function adminForceEndWalk(params: {
  bookingId: string;
  adminUserId: string;
  note?: string;
  lat?: number | null;
  lng?: number | null;
}) {
  const result = await executeWalkAction({
    bookingId: params.bookingId,
    userId: params.adminUserId,
    action: "end_walk",
    lat: params.lat ?? null,
    lng: params.lng ?? null,
    note: params.note,
  });

  if (!result.ok) {
    return result;
  }

  await syncSessionTrackingStatus({
    bookingId: params.bookingId,
    status: "COMPLETED",
    clearFlag: true,
  });

  const { data: session } = await supabaseAdmin
    .from("booking_visit_sessions")
    .select("id,admin_notes")
    .eq("booking_id", params.bookingId)
    .maybeSingle();

  const sessionId = asString(session?.id) || null;
  const stamp = new Date().toISOString();
  const appendNote = `[ADMIN FORCE END ${stamp}] ${params.note?.trim() || "Walk force-ended by admin (Guru device offline / battery)."}`;
  const prior = asString(session?.admin_notes);
  await supabaseAdmin
    .from("booking_visit_sessions")
    .update({
      admin_notes: prior ? `${prior}\n${appendNote}` : appendNote,
      status: "completed",
      ended_at: stamp,
      updated_at: stamp,
    })
    .eq("booking_id", params.bookingId);

  if (sessionId) {
    await supabaseAdmin.from("booking_visit_updates").insert({
      session_id: sessionId,
      booking_id: params.bookingId,
      update_type: "note",
      note: appendNote,
      lat: params.lat ?? null,
      lng: params.lng ?? null,
    });
  }

  await writeAdminAudit({
    bookingId: params.bookingId,
    sessionId,
    adminUserId: params.adminUserId,
    action: "force_end_walk",
    detail: appendNote,
  });

  return result;
}

export async function adminAppendTimelineEvent(params: {
  bookingId: string;
  adminUserId: string;
  updateType: string;
  note: string;
  lat?: number | null;
  lng?: number | null;
}) {
  const note = params.note.trim();
  if (!note) {
    return { ok: false as const, status: 400, error: "Note is required." };
  }

  let { data: session } = await supabaseAdmin
    .from("booking_visit_sessions")
    .select("id,admin_notes")
    .eq("booking_id", params.bookingId)
    .maybeSingle();

  if (!session?.id) {
    const { data: created, error } = await supabaseAdmin
      .from("booking_visit_sessions")
      .insert({
        booking_id: params.bookingId,
        guru_id: params.adminUserId,
        status: "in_progress",
        global_tracking_status: "ACTIVE_TRACKING",
      })
      .select("id,admin_notes")
      .single();

    if (error || !created) {
      return {
        ok: false as const,
        status: 500,
        error: error?.message || "Could not open session.",
      };
    }
    session = created;
  }

  const stamped = `[ADMIN TIMELINE ${new Date().toISOString()}] ${note}`;
  const { data: row, error: insertError } = await supabaseAdmin
    .from("booking_visit_updates")
    .insert({
      session_id: session.id,
      booking_id: params.bookingId,
      update_type: params.updateType || "note",
      note: stamped,
      lat: params.lat ?? null,
      lng: params.lng ?? null,
    })
    .select("id,update_type,note,created_at,lat,lng")
    .single();

  if (insertError || !row) {
    return {
      ok: false as const,
      status: 500,
      error: insertError?.message || "Could not append timeline event.",
    };
  }

  await writeAdminAudit({
    bookingId: params.bookingId,
    sessionId: String(session.id),
    adminUserId: params.adminUserId,
    action: "append_timeline",
    detail: stamped,
    metadata: { updateType: params.updateType || "note" },
  });

  return { ok: true as const, update: row };
}

export async function adminUpdateReportMeta(params: {
  bookingId: string;
  adminUserId: string;
  adminNotes?: string;
  globalTrackingStatus?: PawReportGlobalTrackingStatus;
}) {
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof params.adminNotes === "string") {
    patch.admin_notes = params.adminNotes;
  }
  if (
    params.globalTrackingStatus &&
    isTrackingStatus(params.globalTrackingStatus)
  ) {
    patch.global_tracking_status = params.globalTrackingStatus;
    if (params.globalTrackingStatus === "ARCHIVED") {
      patch.archived_at = new Date().toISOString();
    }
    if (params.globalTrackingStatus === "FLAGGED_ALERT") {
      patch.flagged_at = new Date().toISOString();
    }
  }

  const { error } = await supabaseAdmin
    .from("booking_visit_sessions")
    .update(patch)
    .eq("booking_id", params.bookingId);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  await writeAdminAudit({
    bookingId: params.bookingId,
    adminUserId: params.adminUserId,
    action: "update_meta",
    detail: "Admin updated PawReport metadata",
    metadata: patch,
  });

  return { ok: true as const };
}

export async function adminSendGuruSms(params: {
  bookingId: string;
  adminUserId: string;
  message?: string;
}) {
  const { data: booking } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", params.bookingId)
    .maybeSingle();

  if (!booking) {
    return { ok: false as const, status: 404, error: "Booking not found." };
  }

  const row = booking as Record<string, unknown>;
  const guruId =
    asString(row.guru_id) ||
    asString(row.provider_id) ||
    asString(row.sitter_id) ||
    "";

  let phone =
    asString(row.guru_phone) ||
    asString(row.provider_phone) ||
    "";

  if (!phone && guruId) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("phone,mobile_phone")
      .eq("id", guruId)
      .maybeSingle();
    phone =
      asString(profile?.phone) || asString(profile?.mobile_phone) || "";
  }

  if (!phone) {
    return {
      ok: false as const,
      status: 400,
      error: "No Guru phone number on file for this booking.",
    };
  }

  const body =
    params.message?.trim() ||
    `SitGuru Ops: Please check in — booking ${params.bookingId.slice(0, 8)} shows a GPS dead zone or needs admin follow-up. Reply when safe.`;

  const result = await sendSms(phone, body);

  await writeAdminAudit({
    bookingId: params.bookingId,
    adminUserId: params.adminUserId,
    action: "send_guru_sms",
    detail: body,
    metadata: { phone, twilio: result },
  });

  if (!result.ok) {
    return {
      ok: false as const,
      status: 502,
      error: result.error || "Twilio SMS failed.",
      skipped: result.skipped,
    };
  }

  return { ok: true as const, sid: result.sid };
}

