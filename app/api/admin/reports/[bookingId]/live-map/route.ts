// app/api/admin/reports/[bookingId]/live-map/route.ts
/**
 * GET /api/admin/reports/[bookingId]/live-map
 * Admin-only polyline path + timeline event pins for Focus Detail Map.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/supabase/admin";
import { supabaseAdmin } from "@/utils/supabase/admin";

function mapAuthErrorStatus(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("missing authorization") || lower.includes("unable to verify")) {
    return 401;
  }
  if (lower.includes("admin access") || lower.includes("not active")) {
    return 403;
  }
  return 400;
}

function asNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asString(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function classifyEvent(updateType: string, note: string) {
  const type = updateType.toLowerCase();
  const text = note.toLowerCase();

  if (type === "pee" || type === "poop" || text.includes("potty")) {
    return {
      kind: "potty" as const,
      label: type === "poop" ? "💩 Poop" : "💩 Potty",
    };
  }
  if (text.includes("walk_break") || text.includes("break") || text.includes("paused")) {
    return { kind: "break" as const, label: "🌲 Break" };
  }
  if (type === "walk" && (text.includes("ended") || text.includes("force"))) {
    return { kind: "end" as const, label: "✅ Walk ended" };
  }
  if (type === "walk" && text.includes("started")) {
    return { kind: "start" as const, label: "🏃 Walk started" };
  }
  return { kind: "note" as const, label: note.slice(0, 48) || "Update" };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ bookingId: string }> },
) {
  try {
    await requireAdminUser(request);
    const { bookingId: rawId } = await context.params;
    const bookingId = String(rawId || "").trim();

    if (!bookingId) {
      return NextResponse.json(
        { ok: false, error: "Missing booking ID." },
        { status: 400 },
      );
    }

    const [{ data: booking }, { data: session }, { data: walk }] =
      await Promise.all([
        supabaseAdmin
          .from("bookings")
          .select("id,pet_name,petName,animal_name")
          .eq("id", bookingId)
          .maybeSingle(),
        supabaseAdmin
          .from("booking_visit_sessions")
          .select(
            "id,status,global_tracking_status,started_at,ended_at,admin_notes",
          )
          .eq("booking_id", bookingId)
          .maybeSingle(),
        supabaseAdmin
          .from("booking_walk_tracks")
          .select(
            "id,status,total_distance_meters,total_duration_seconds,global_tracking_status,ended_at,updated_at",
          )
          .eq("booking_id", bookingId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    const walkId = asString(walk?.id);
    const [{ data: points }, { data: updates }] = await Promise.all([
      walkId
        ? supabaseAdmin
            .from("booking_walk_track_points")
            .select("id,lat,lng,accuracy,recorded_at")
            .eq("walk_track_id", walkId)
            .order("recorded_at", { ascending: true })
            .limit(2000)
        : Promise.resolve({ data: [] as unknown[] }),
      supabaseAdmin
        .from("booking_visit_updates")
        .select("id,update_type,note,lat,lng,created_at")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true })
        .limit(300),
    ]);

    const path = (points || [])
      .map((row) => {
        const lat = asNumber((row as { lat?: number }).lat);
        const lng = asNumber((row as { lng?: number }).lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return {
          lat,
          lng,
          recordedAt: asString((row as { recorded_at?: string }).recorded_at),
          accuracy:
            (row as { accuracy?: number | null }).accuracy == null
              ? null
              : asNumber((row as { accuracy?: number }).accuracy),
        };
      })
      .filter(Boolean);

    const events = (updates || [])
      .map((row) => {
        const lat = asNumber((row as { lat?: number | null }).lat);
        const lng = asNumber((row as { lng?: number | null }).lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || (!lat && !lng)) {
          return null;
        }
        const classified = classifyEvent(
          asString((row as { update_type?: string }).update_type),
          asString((row as { note?: string }).note),
        );
        if (classified.kind === "note") return null;
        return {
          id: asString((row as { id?: string }).id),
          kind: classified.kind,
          label: classified.label,
          lat,
          lng,
          at: asString((row as { created_at?: string }).created_at),
        };
      })
      .filter(Boolean);

    const bookingRow = (booking || {}) as Record<string, unknown>;
    const petName =
      asString(bookingRow.pet_name) ||
      asString(bookingRow.petName) ||
      asString(bookingRow.animal_name) ||
      "Scout";

    const globalTrackingStatus =
      asString(session?.global_tracking_status) ||
      asString(walk?.global_tracking_status) ||
      (asString(walk?.status) === "completed" ? "COMPLETED" : "ACTIVE_TRACKING");

    const distanceMeters = asNumber(walk?.total_distance_meters);
    const durationSeconds = asNumber(walk?.total_duration_seconds);
    const isCompleted =
      globalTrackingStatus === "COMPLETED" ||
      asString(walk?.status) === "completed" ||
      asString(session?.status) === "completed";

    return NextResponse.json({
      ok: true,
      bookingId,
      petName,
      globalTrackingStatus,
      walkStatus: walk ? asString(walk.status) : null,
      isCompleted,
      distanceMiles: Number((distanceMeters / 1609.344).toFixed(3)),
      durationMinutes: Number((durationSeconds / 60).toFixed(1)),
      path,
      events,
      lastPoint: path.length ? path[path.length - 1] : null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load live map.";
    return NextResponse.json(
      { ok: false, error: message },
      { status: mapAuthErrorStatus(message) },
    );
  }
}
