// app/api/guru/pawreports/[bookingId]/route.ts
/**
 * Guru write controllers for PawReport
 * -----------------------------------------------------------------------
 * POST  — create timeline update / start visit / start walk / add photo URL
 * PATCH — update walk metrics, end walk, patch status logs, complete visit
 *
 * RBAC: only the assigned Guru on an active booking (or admin) may write.
 * Pet Parents must use GET /api/pawreports/[bookingId] only.
 */

import { NextResponse } from "next/server";
import { resolvePawReportAccess } from "@/lib/pawreport/access";
import { buildPawReportLivePayload } from "@/lib/pawreport/service";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ bookingId: string }>;
};

type WriteBody = {
  action?: string;
  updateType?: string;
  note?: string;
  photoUrl?: string;
  lat?: number | null;
  lng?: number | null;
  accuracy?: number | null;
  distanceMeters?: number;
  durationSeconds?: number;
  walkTrackId?: string;
  finalNote?: string;
};

const ALLOWED_UPDATE_TYPES = new Set([
  "pee",
  "poop",
  "water",
  "food",
  "photo",
  "note",
  "medication",
  "walk",
  "play",
  "mood",
]);

async function requireGuruWriter(bookingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const access = await resolvePawReportAccess({
    bookingId,
    userId: user.id,
    email: user.email,
  });

  if (!access?.canRead) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  if (!access.canWrite || (access.role !== "guru" && access.role !== "admin")) {
    return {
      error: NextResponse.json(
        {
          error:
            "Only the assigned Guru on an active booking can modify this PawReport.",
        },
        { status: 403 },
      ),
    };
  }

  return { user, access };
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
    })
    .select("id,status")
    .single();

  if (error || !created) {
    console.error("PawReport session create error:", error);
    return null;
  }

  return created as { id: string; status: string };
}

async function respondWithReport(bookingId: string, access: NonNullable<
  Awaited<ReturnType<typeof resolvePawReportAccess>>
>) {
  const report = await buildPawReportLivePayload({ bookingId, access });
  return NextResponse.json({ ok: true, report });
}

export async function POST(request: Request, context: RouteContext) {
  const { bookingId: rawBookingId } = await context.params;
  const bookingId = String(rawBookingId || "").trim();

  if (!bookingId) {
    return NextResponse.json({ error: "Missing booking ID." }, { status: 400 });
  }

  const auth = await requireGuruWriter(bookingId);
  if (auth.error) return auth.error;

  const body = (await request.json().catch(() => ({}))) as WriteBody;
  const action = String(body.action || "add_update").trim();
  const now = new Date().toISOString();

  const session = await getOrCreateSession(bookingId, auth.user.id);
  if (!session) {
    return NextResponse.json(
      { error: "Could not create PawReport session." },
      { status: 500 },
    );
  }

  // ---- start_visit -------------------------------------------------------
  if (action === "start_visit") {
    const { error } = await supabaseAdmin
      .from("booking_visit_sessions")
      .update({
        status: "in_progress",
        started_at: now,
        start_lat: body.lat ?? null,
        start_lng: body.lng ?? null,
        start_accuracy: body.accuracy ?? null,
        updated_at: now,
      })
      .eq("id", session.id);

    if (error) {
      return NextResponse.json(
        { error: "Could not start PawReport." },
        { status: 500 },
      );
    }

    await supabaseAdmin.from("booking_visit_updates").insert({
      session_id: session.id,
      booking_id: bookingId,
      update_type: "visit_started",
      note: "PawReport started.",
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      accuracy: body.accuracy ?? null,
    });

    return respondWithReport(bookingId, auth.access);
  }

  // ---- start_walk --------------------------------------------------------
  if (action === "start_walk") {
    const { data: walk, error } = await supabaseAdmin
      .from("booking_walk_tracks")
      .insert({
        booking_id: bookingId,
        session_id: session.id,
        guru_id: auth.user.id,
        status: "in_progress",
        started_at: now,
        start_lat: body.lat ?? null,
        start_lng: body.lng ?? null,
        total_distance_meters: 0,
        total_duration_seconds: 0,
        updated_at: now,
      })
      .select("id")
      .single();

    if (error || !walk) {
      return NextResponse.json(
        { error: "Could not start walk track." },
        { status: 500 },
      );
    }

    if (body.lat != null && body.lng != null) {
      await supabaseAdmin.from("booking_walk_track_points").insert({
        walk_track_id: walk.id,
        booking_id: bookingId,
        session_id: session.id,
        guru_id: auth.user.id,
        lat: body.lat,
        lng: body.lng,
        accuracy: body.accuracy ?? null,
        recorded_at: now,
      });
    }

    await supabaseAdmin.from("booking_visit_updates").insert({
      session_id: session.id,
      booking_id: bookingId,
      update_type: "walk",
      note: "Walk started.",
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      accuracy: body.accuracy ?? null,
    });

    return respondWithReport(bookingId, auth.access);
  }

  // ---- add_update / photo ------------------------------------------------
  const updateType = String(body.updateType || "").trim().toLowerCase();
  if (!ALLOWED_UPDATE_TYPES.has(updateType)) {
    return NextResponse.json(
      { error: "Invalid updateType for PawReport." },
      { status: 400 },
    );
  }

  if (updateType === "photo" && !String(body.photoUrl || "").trim()) {
    return NextResponse.json(
      { error: "photoUrl is required for photo updates." },
      { status: 400 },
    );
  }

  const { error: insertError } = await supabaseAdmin
    .from("booking_visit_updates")
    .insert({
      session_id: session.id,
      booking_id: bookingId,
      update_type: updateType,
      note: String(body.note || "").trim() || null,
      photo_url: String(body.photoUrl || "").trim() || null,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      accuracy: body.accuracy ?? null,
    });

  if (insertError) {
    console.error("PawReport update insert error:", insertError);
    return NextResponse.json(
      { error: "Could not save PawReport update." },
      { status: 500 },
    );
  }

  return respondWithReport(bookingId, auth.access);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { bookingId: rawBookingId } = await context.params;
  const bookingId = String(rawBookingId || "").trim();

  if (!bookingId) {
    return NextResponse.json({ error: "Missing booking ID." }, { status: 400 });
  }

  const auth = await requireGuruWriter(bookingId);
  if (auth.error) return auth.error;

  const body = (await request.json().catch(() => ({}))) as WriteBody;
  const action = String(body.action || "record_walk_point").trim();
  const now = new Date().toISOString();

  const session = await getOrCreateSession(bookingId, auth.user.id);
  if (!session) {
    return NextResponse.json(
      { error: "Could not find PawReport session." },
      { status: 500 },
    );
  }

  // ---- record_walk_point / patch walk metrics ----------------------------
  if (action === "record_walk_point" || action === "patch_walk") {
    let walkTrackId = String(body.walkTrackId || "").trim();

    if (!walkTrackId) {
      const { data: activeWalk } = await supabaseAdmin
        .from("booking_walk_tracks")
        .select("id")
        .eq("booking_id", bookingId)
        .eq("status", "in_progress")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      walkTrackId = String(
        (activeWalk as { id?: string } | null)?.id || "",
      ).trim();
    }

    if (!walkTrackId) {
      return NextResponse.json(
        { error: "No active walk track to update." },
        { status: 404 },
      );
    }

    if (body.lat != null && body.lng != null) {
      await supabaseAdmin.from("booking_walk_track_points").insert({
        walk_track_id: walkTrackId,
        booking_id: bookingId,
        session_id: session.id,
        guru_id: auth.user.id,
        lat: body.lat,
        lng: body.lng,
        accuracy: body.accuracy ?? null,
        recorded_at: now,
      });
    }

    const patch: Record<string, unknown> = { updated_at: now };
    if (typeof body.distanceMeters === "number") {
      patch.total_distance_meters = body.distanceMeters;
    }
    if (typeof body.durationSeconds === "number") {
      patch.total_duration_seconds = body.durationSeconds;
    }

    await supabaseAdmin
      .from("booking_walk_tracks")
      .update(patch)
      .eq("id", walkTrackId);

    return respondWithReport(bookingId, auth.access);
  }

  // ---- end_walk ----------------------------------------------------------
  if (action === "end_walk") {
    const { data: activeWalk } = await supabaseAdmin
      .from("booking_walk_tracks")
      .select("id,total_distance_meters,total_duration_seconds")
      .eq("booking_id", bookingId)
      .eq("status", "in_progress")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const walkId = String(
      (activeWalk as { id?: string } | null)?.id || body.walkTrackId || "",
    ).trim();

    if (!walkId) {
      return NextResponse.json(
        { error: "No active walk to end." },
        { status: 404 },
      );
    }

    await supabaseAdmin
      .from("booking_walk_tracks")
      .update({
        status: "completed",
        ended_at: now,
        end_lat: body.lat ?? null,
        end_lng: body.lng ?? null,
        total_distance_meters:
          typeof body.distanceMeters === "number"
            ? body.distanceMeters
            : (activeWalk as { total_distance_meters?: number })
                ?.total_distance_meters,
        total_duration_seconds:
          typeof body.durationSeconds === "number"
            ? body.durationSeconds
            : (activeWalk as { total_duration_seconds?: number })
                ?.total_duration_seconds,
        updated_at: now,
      })
      .eq("id", walkId);

    await supabaseAdmin.from("booking_visit_updates").insert({
      session_id: session.id,
      booking_id: bookingId,
      update_type: "walk",
      note: "Walk completed.",
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      accuracy: body.accuracy ?? null,
    });

    return respondWithReport(bookingId, auth.access);
  }

  // ---- complete_visit ----------------------------------------------------
  if (action === "complete_visit") {
    await supabaseAdmin
      .from("booking_visit_sessions")
      .update({
        status: "completed",
        ended_at: now,
        end_lat: body.lat ?? null,
        end_lng: body.lng ?? null,
        end_accuracy: body.accuracy ?? null,
        final_note: String(body.finalNote || "").trim() || null,
        updated_at: now,
      })
      .eq("id", session.id);

    await supabaseAdmin.from("booking_visit_updates").insert({
      session_id: session.id,
      booking_id: bookingId,
      update_type: "visit_ended",
      note: String(body.finalNote || "").trim() || "PawReport completed.",
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      accuracy: body.accuracy ?? null,
    });

    return respondWithReport(bookingId, auth.access);
  }

  // ---- status_log shortcut (food/water/potty/medication) -----------------
  if (action === "status_log") {
    const updateType = String(body.updateType || "").trim().toLowerCase();
    const mapped =
      updateType === "potty"
        ? "pee"
        : ALLOWED_UPDATE_TYPES.has(updateType)
          ? updateType
          : "";

    if (!mapped) {
      return NextResponse.json(
        { error: "Invalid status log type." },
        { status: 400 },
      );
    }

    await supabaseAdmin.from("booking_visit_updates").insert({
      session_id: session.id,
      booking_id: bookingId,
      update_type: mapped,
      note: String(body.note || "").trim() || `${mapped} logged.`,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      accuracy: body.accuracy ?? null,
    });

    return respondWithReport(bookingId, auth.access);
  }

  return NextResponse.json({ error: "Unknown PATCH action." }, { status: 400 });
}
