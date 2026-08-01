// lib/pawreport/walk-actions.ts
/**
 * Guru walk action controller — persist + broadcast SSE + notify Pet Parent.
 * Every broadcast uses the enforced PawReportLiveEvent payload shape.
 */

import {
  bookingAssignedGuruId,
  resolvePawReportAccess,
  type PawReportAccess,
} from "@/lib/pawreport/access";
import { publishWalkEvent } from "@/lib/pawreport/walk-event-bus";
import {
  buildLiveMetrics,
  type PawReportLiveEvent,
  type PawReportLiveEventType,
  type WalkActionName,
  type WalkGeoPoint,
  type WalkTrackingState,
} from "@/lib/pawreport/walk-events";
import { notifyPetParentWalkEvent } from "@/lib/notifications";
import { dispatchPawReportEvent } from "@/lib/notificationDispatcher";
import { syncSessionTrackingStatus } from "@/lib/pawreport/admin-status";
import { supabaseAdmin } from "@/utils/supabase/admin";

type ActionInput = {
  bookingId: string;
  userId: string;
  email?: string | null;
  action: WalkActionName;
  lat?: number | null;
  lng?: number | null;
  accuracy?: number | null;
  pottyKind?: "pee" | "poop";
  note?: string;
};

type ActionResult =
  | { ok: true; event: PawReportLiveEvent }
  | { ok: false; status: number; error: string };

function asNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nowIso() {
  return new Date().toISOString();
}

function pointFromBody(input: ActionInput): WalkGeoPoint | null {
  if (input.lat == null || input.lng == null) return null;
  return {
    lat: Number(input.lat),
    lng: Number(input.lng),
    accuracy: input.accuracy ?? null,
    recordedAt: nowIso(),
  };
}

async function resolvePetName(booking: Record<string, unknown>) {
  const petId = String(
    booking.pet_id || booking.customer_pet_id || booking.primary_pet_id || "",
  ).trim();

  if (petId) {
    const { data: pet } = await supabaseAdmin
      .from("pets")
      .select("name")
      .eq("id", petId)
      .maybeSingle();
    const liveName = (pet as { name?: string } | null)?.name;
    if (liveName?.trim()) return liveName.trim();
  }

  const raw =
    booking.pet_name || booking.petName || booking.animal_name || "Scout";
  return typeof raw === "string" && raw.trim() ? raw.trim() : "Scout";
}

function resolvePetParentUserId(booking: Record<string, unknown>) {
  return (
    String(booking.pet_owner_id || "").trim() ||
    String(booking.customer_id || "").trim() ||
    String(booking.user_id || "").trim() ||
    ""
  );
}

/** Build the enforced realtime payload */
function createLiveEvent(params: {
  bookingId: string;
  eventType: PawReportLiveEventType;
  petName: string;
  timestamp?: string;
  point?: WalkGeoPoint | null;
  message?: string;
  walkTrackId?: string | null;
  distanceMeters?: number;
  durationSeconds?: number;
}): PawReportLiveEvent {
  const timestamp = params.timestamp || nowIso();
  const distanceMeters = params.distanceMeters ?? 0;
  const durationSeconds = params.durationSeconds ?? 0;

  return {
    bookingId: params.bookingId,
    eventType: params.eventType,
    data: {
      timestamp,
      latitude: params.point?.lat,
      longitude: params.point?.lng,
      accuracy: params.point?.accuracy ?? null,
      message: params.message,
      walkTrackId: params.walkTrackId ?? null,
      petName: params.petName,
      currentMetrics: buildLiveMetrics(distanceMeters, durationSeconds),
    },
  };
}

async function getOrCreateSession(bookingId: string, guruId: string) {
  const { data: existing } = await supabaseAdmin
    .from("booking_visit_sessions")
    .select("id,status")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (existing?.id) return existing as { id: string; status: string };

  const { data: created, error } = await supabaseAdmin
    .from("booking_visit_sessions")
    .insert({
      booking_id: bookingId,
      guru_id: guruId,
      status: "not_started",
      global_tracking_status: "PRE_WALK",
    })
    .select("id,status")
    .single();

  if (error || !created) {
    console.error("Walk session create error:", error);
    return null;
  }

  return created as { id: string; status: string };
}

async function getActiveWalk(bookingId: string) {
  const { data } = await supabaseAdmin
    .from("booking_walk_tracks")
    .select(
      "id,status,started_at,total_distance_meters,total_duration_seconds,updated_at",
    )
    .eq("booking_id", bookingId)
    .in("status", ["in_progress", "paused"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as {
    id: string;
    status: string;
    started_at: string | null;
    total_distance_meters: number | string | null;
    total_duration_seconds: number | string | null;
  } | null;
}

function trackingStateFromWalkStatus(
  status: string | null | undefined,
): WalkTrackingState {
  const value = String(status || "").toLowerCase();
  if (value === "paused") return "on_break";
  if (value === "in_progress") return "active";
  if (value === "completed") return "ended";
  return "idle";
}

async function insertTimeline(params: {
  sessionId: string;
  bookingId: string;
  updateType: string;
  note: string;
  point: WalkGeoPoint | null;
}) {
  await supabaseAdmin.from("booking_visit_updates").insert({
    session_id: params.sessionId,
    booking_id: params.bookingId,
    update_type: params.updateType,
    note: params.note,
    lat: params.point?.lat ?? null,
    lng: params.point?.lng ?? null,
    accuracy: params.point?.accuracy ?? null,
  });
}

async function broadcastAndNotify(params: {
  access: PawReportAccess;
  event: PawReportLiveEvent;
  notifyKey?: "start_walk" | "take_break" | "potty_break" | "end_walk";
}) {
  publishWalkEvent(params.event);

  if (!params.notifyKey) return;

  const booking = params.access.booking as Record<string, unknown>;
  const petParentUserId = resolvePetParentUserId(booking);
  if (!petParentUserId) return;

  if (petParentUserId === bookingAssignedGuruId(params.access.booking)) return;

  const eventTypeMap = {
    start_walk: "WALK_START",
    take_break: "WALK_BREAK",
    potty_break: "POTTY_BREAK",
    end_walk: "WALK_END",
  } as const;

  try {
    await dispatchPawReportEvent(
      params.event.bookingId,
      eventTypeMap[params.notifyKey],
      params.event.data.petName || "Scout",
      {
        message: params.event.data.message,
        latitude: params.event.data.latitude,
        longitude: params.event.data.longitude,
        timestamp: params.event.data.timestamp,
        distanceMiles: params.event.data.currentMetrics?.distanceMiles,
        durationMinutes: params.event.data.currentMetrics?.durationMinutes,
        petParentUserId,
        phone:
          (typeof booking.customer_phone === "string"
            ? booking.customer_phone
            : null) ||
          (typeof booking.phone === "string" ? booking.phone : null),
        email:
          (typeof booking.customer_email === "string"
            ? booking.customer_email
            : null) ||
          (typeof booking.email === "string" ? booking.email : null),
      },
    );
  } catch (error) {
    console.warn("[walk-actions] dispatchPawReportEvent non-fatal:", error);
    try {
      await notifyPetParentWalkEvent({
        petParentUserId,
        bookingId: params.event.bookingId,
        petName: params.event.data.petName || "Scout",
        event: params.notifyKey,
      });
    } catch (fallbackError) {
      console.warn(
        "[walk-actions] legacy notify fallback failed:",
        fallbackError,
      );
    }
  }
}

export async function executeWalkAction(
  input: ActionInput,
): Promise<ActionResult> {
  const bookingId = String(input.bookingId || "").trim();
  if (!bookingId) {
    return { ok: false, status: 400, error: "Missing booking ID." };
  }

  const access = await resolvePawReportAccess({
    bookingId,
    userId: input.userId,
    email: input.email,
  });

  if (!access?.canRead) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  if (!access.canWrite || (access.role !== "guru" && access.role !== "admin")) {
    return {
      ok: false,
      status: 403,
      error: "Only the assigned Guru on an active booking can control this walk.",
    };
  }

  const petName = await resolvePetName(
    access.booking as Record<string, unknown>,
  );
  const point = pointFromBody(input);
  const timestamp = nowIso();
  const session = await getOrCreateSession(bookingId, input.userId);

  if (!session) {
    return { ok: false, status: 500, error: "Could not open PawReport session." };
  }

  if (input.action === "start_walk") {
    const existing = await getActiveWalk(bookingId);
    if (existing) {
      return {
        ok: false,
        status: 409,
        error: "A walk is already in progress for this booking.",
      };
    }

    await supabaseAdmin
      .from("booking_visit_sessions")
      .update({
        status: "in_progress",
        started_at: timestamp,
        start_lat: point?.lat ?? null,
        start_lng: point?.lng ?? null,
        start_accuracy: point?.accuracy ?? null,
        updated_at: timestamp,
      })
      .eq("id", session.id);

    const { data: walk, error } = await supabaseAdmin
      .from("booking_walk_tracks")
      .insert({
        booking_id: bookingId,
        session_id: session.id,
        guru_id: input.userId,
        status: "in_progress",
        started_at: timestamp,
        start_lat: point?.lat ?? null,
        start_lng: point?.lng ?? null,
        total_distance_meters: 0,
        total_duration_seconds: 0,
        global_tracking_status: "ACTIVE_TRACKING",
        last_gps_at: point ? timestamp : null,
        updated_at: timestamp,
      })
      .select("id")
      .single();

    if (error || !walk) {
      console.error("Start walk error:", error);
      return { ok: false, status: 500, error: "Could not start walk." };
    }

    await syncSessionTrackingStatus({
      bookingId,
      sessionId: session.id,
      status: "ACTIVE_TRACKING",
      lastGpsAt: point ? timestamp : null,
      clearFlag: true,
    });

    if (point) {
      await supabaseAdmin.from("booking_walk_track_points").insert({
        walk_track_id: walk.id,
        booking_id: bookingId,
        session_id: session.id,
        guru_id: input.userId,
        lat: point.lat,
        lng: point.lng,
        accuracy: point.accuracy ?? null,
        recorded_at: timestamp,
      });
    }

    await insertTimeline({
      sessionId: session.id,
      bookingId,
      updateType: "walk",
      note: "Walk started.",
      point,
    });

    const event = createLiveEvent({
      bookingId,
      eventType: "WALK_START",
      petName,
      timestamp,
      point,
      walkTrackId: walk.id,
      message: `${petName}'s walk has started! Tap to follow their route live.`,
      distanceMeters: 0,
      durationSeconds: 0,
    });

    await broadcastAndNotify({ access, event, notifyKey: "start_walk" });
    return { ok: true, event };
  }

  const activeWalk = await getActiveWalk(bookingId);
  if (!activeWalk) {
    return {
      ok: false,
      status: 404,
      error: "No active walk. Start a walk first.",
    };
  }

  const walkId = activeWalk.id;
  const currentState = trackingStateFromWalkStatus(activeWalk.status);
  const distanceMeters = asNumber(activeWalk.total_distance_meters);
  const durationSeconds = asNumber(activeWalk.total_duration_seconds);

  if (input.action === "take_break") {
    if (currentState !== "active") {
      return {
        ok: false,
        status: 409,
        error: "Walk must be active to take a break.",
      };
    }

    await supabaseAdmin
      .from("booking_walk_tracks")
      .update({ status: "paused", updated_at: timestamp })
      .eq("id", walkId);

    await syncSessionTrackingStatus({
      bookingId,
      sessionId: session.id,
      status: "PAUSED_BREAK",
    });

    await insertTimeline({
      sessionId: session.id,
      bookingId,
      // Persisted to booking_visit_updates for permanent PawReport history
      updateType: "note",
      note: "WALK_BREAK: Taking a water break — GPS paused.",
      point,
    });

    // Persist break pin on the walk path when coordinates are available
    if (point) {
      await supabaseAdmin.from("booking_walk_track_points").insert({
        walk_track_id: walkId,
        booking_id: bookingId,
        session_id: session.id,
        guru_id: input.userId,
        lat: point.lat,
        lng: point.lng,
        accuracy: point.accuracy ?? null,
        recorded_at: timestamp,
      });
    }

    const event = createLiveEvent({
      bookingId,
      eventType: "BREAK_START",
      petName,
      timestamp,
      point,
      walkTrackId: walkId,
      message: `${petName} and their Guru are taking a quick water break.`,
      distanceMeters,
      durationSeconds,
    });

    // Notify AFTER DB writes so history is durable even if push fails
    await broadcastAndNotify({ access, event, notifyKey: "take_break" });
    return { ok: true, event };
  }

  if (input.action === "resume") {
    if (currentState !== "on_break") {
      return { ok: false, status: 409, error: "Walk is not on a break." };
    }

    await supabaseAdmin
      .from("booking_walk_tracks")
      .update({ status: "in_progress", updated_at: timestamp })
      .eq("id", walkId);

    await syncSessionTrackingStatus({
      bookingId,
      sessionId: session.id,
      status: "ACTIVE_TRACKING",
      lastGpsAt: point ? timestamp : undefined,
      clearFlag: true,
    });

    if (point) {
      await supabaseAdmin.from("booking_walk_track_points").insert({
        walk_track_id: walkId,
        booking_id: bookingId,
        session_id: session.id,
        guru_id: input.userId,
        lat: point.lat,
        lng: point.lng,
        accuracy: point.accuracy ?? null,
        recorded_at: timestamp,
      });
    }

    await insertTimeline({
      sessionId: session.id,
      bookingId,
      updateType: "note",
      note: "Walk resumed.",
      point,
    });

    const event = createLiveEvent({
      bookingId,
      eventType: "BREAK_END",
      petName,
      timestamp,
      point,
      walkTrackId: walkId,
      message: `${petName} is on the move again.`,
      distanceMeters,
      durationSeconds,
    });

    publishWalkEvent(event);
    return { ok: true, event };
  }

  if (input.action === "potty_break") {
    const pottyKind = input.pottyKind === "poop" ? "poop" : "pee";
    const eventType: PawReportLiveEventType =
      pottyKind === "poop" ? "POTTY_POOP" : "POTTY_PEE";

    await insertTimeline({
      sessionId: session.id,
      bookingId,
      // pee/poop rows appear on the permanent VisitUpdateTimeline history
      updateType: pottyKind,
      note:
        input.note?.trim() ||
        (pottyKind === "poop"
          ? "POTTY_BREAK: Poop logged."
          : "POTTY_BREAK: Pee logged."),
      point,
    });

    if (point) {
      await supabaseAdmin.from("booking_walk_track_points").insert({
        walk_track_id: walkId,
        booking_id: bookingId,
        session_id: session.id,
        guru_id: input.userId,
        lat: point.lat,
        lng: point.lng,
        accuracy: point.accuracy ?? null,
        recorded_at: timestamp,
      });

      await syncSessionTrackingStatus({
        bookingId,
        sessionId: session.id,
        status:
          currentState === "on_break" ? "PAUSED_BREAK" : "ACTIVE_TRACKING",
        lastGpsAt: timestamp,
      });
    }

    const event = createLiveEvent({
      bookingId,
      eventType,
      petName,
      timestamp,
      point,
      walkTrackId: walkId,
      message: `Quick update! ${petName} just went potty.`,
      distanceMeters,
      durationSeconds,
    });

    // Push after durable timeline insert
    await broadcastAndNotify({ access, event, notifyKey: "potty_break" });
    return { ok: true, event };
  }

  if (input.action === "ping_coordinate") {
    if (currentState !== "active") {
      return {
        ok: false,
        status: 409,
        error: "Coordinates are ignored while on break.",
      };
    }

    if (!point) {
      return { ok: false, status: 400, error: "lat/lng required." };
    }

    await supabaseAdmin.from("booking_walk_track_points").insert({
      walk_track_id: walkId,
      booking_id: bookingId,
      session_id: session.id,
      guru_id: input.userId,
      lat: point.lat,
      lng: point.lng,
      accuracy: point.accuracy ?? null,
      recorded_at: timestamp,
    });

    await supabaseAdmin
      .from("booking_walk_tracks")
      .update({ updated_at: timestamp, last_gps_at: timestamp })
      .eq("id", walkId);

    // Fresh GPS clears FLAGGED_ALERT back to active tracking
    await syncSessionTrackingStatus({
      bookingId,
      sessionId: session.id,
      status: "ACTIVE_TRACKING",
      lastGpsAt: timestamp,
      clearFlag: true,
    });

    const event = createLiveEvent({
      bookingId,
      eventType: "GPS_PING",
      petName,
      timestamp,
      point,
      walkTrackId: walkId,
      distanceMeters,
      durationSeconds,
    });

    publishWalkEvent(event);
    return { ok: true, event };
  }

  if (input.action === "end_walk") {
    await supabaseAdmin
      .from("booking_walk_tracks")
      .update({
        status: "completed",
        ended_at: timestamp,
        end_lat: point?.lat ?? null,
        end_lng: point?.lng ?? null,
        global_tracking_status: "COMPLETED",
        updated_at: timestamp,
      })
      .eq("id", walkId);

    await syncSessionTrackingStatus({
      bookingId,
      sessionId: session.id,
      status: "COMPLETED",
      clearFlag: true,
    });

    await supabaseAdmin
      .from("booking_visit_sessions")
      .update({
        status: "completed",
        ended_at: timestamp,
        end_lat: point?.lat ?? null,
        end_lng: point?.lng ?? null,
        updated_at: timestamp,
      })
      .eq("id", session.id);

    await insertTimeline({
      sessionId: session.id,
      bookingId,
      updateType: "walk",
      note: "Walk ended — route locked. Full PawReport ready.",
      point,
    });

    const event = createLiveEvent({
      bookingId,
      eventType: "WALK_END",
      petName,
      timestamp,
      point,
      walkTrackId: walkId,
      message: `${petName} is back home safe and sound! Your full PawReport is ready to view.`,
      distanceMeters,
      durationSeconds,
    });

    await broadcastAndNotify({ access, event, notifyKey: "end_walk" });
    return { ok: true, event };
  }

  return { ok: false, status: 400, error: "Unknown walk action." };
}

/** Initial SSE snapshot for newly connected Pet Parents */
export async function buildWalkStreamSnapshot(params: {
  bookingId: string;
  access: PawReportAccess;
}): Promise<PawReportLiveEvent> {
  const petName = await resolvePetName(
    params.access.booking as Record<string, unknown>,
  );
  const walk = await getActiveWalk(params.bookingId);

  let point: WalkGeoPoint | null = null;
  if (walk?.id) {
    const { data: lastPoint } = await supabaseAdmin
      .from("booking_walk_track_points")
      .select("lat,lng,accuracy,recorded_at")
      .eq("walk_track_id", walk.id)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastPoint) {
      point = {
        lat: asNumber(lastPoint.lat),
        lng: asNumber(lastPoint.lng),
        accuracy:
          lastPoint.accuracy == null ? null : asNumber(lastPoint.accuracy),
        recordedAt: String(lastPoint.recorded_at || nowIso()),
      };
    }
  }

  const state = walk ? trackingStateFromWalkStatus(walk.status) : "idle";
  const message =
    state === "active"
      ? "Live walk in progress."
      : state === "on_break"
        ? "Walk is on a break — GPS paused."
        : "Waiting for Guru to start the walk.";

  return createLiveEvent({
    bookingId: params.bookingId,
    eventType: "SNAPSHOT",
    petName,
    point,
    walkTrackId: walk?.id || null,
    message,
    distanceMeters: asNumber(walk?.total_distance_meters),
    durationSeconds: asNumber(walk?.total_duration_seconds),
  });
}
