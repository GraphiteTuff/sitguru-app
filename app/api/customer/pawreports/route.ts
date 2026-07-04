import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

type BookingIdRow = {
  id?: string | number | null;
};

type VisitSessionRow = {
  id: string;
  booking_id: string;
  status: string | null;
  started_at: string | null;
  ended_at: string | null;
  final_note: string | null;
};

type VisitUpdateRow = {
  id: string;
  booking_id: string;
  update_type: string | null;
  note: string | null;
  photo_url: string | null;
  created_at: string | null;
};

type WalkTrackRow = {
  id: string;
  booking_id: string;
  session_id: string | null;
  status: string | null;
  started_at: string | null;
  ended_at: string | null;
  total_distance_meters: number | string | null;
  total_duration_seconds: number | string | null;
  updated_at: string | null;
};

function asNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateDurationSeconds(
  startedAt?: string | null,
  endedAt?: string | null,
) {
  if (!startedAt) return 0;

  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0;

  return Math.round((end - start) / 1000);
}

async function fetchBookingIdsForUser(userId: string, email?: string | null) {
  const normalizedEmail = email?.trim().toLowerCase() || "";
  const attempts: Array<{ column: string; value: string }> = [
    { column: "pet_owner_id", value: userId },
    { column: "customer_id", value: userId },
    { column: "user_id", value: userId },
  ];

  if (normalizedEmail) {
    attempts.push(
      { column: "customer_email", value: normalizedEmail },
      { column: "email", value: normalizedEmail },
    );
  }

  const ids = new Set<string>();

  for (const attempt of attempts) {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("id")
      .eq(attempt.column, attempt.value)
      .limit(100);

    if (error || !data) continue;

    (data as BookingIdRow[]).forEach((row) => {
      if (row.id) ids.add(String(row.id));
    });
  }

  return Array.from(ids);
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookingIds = await fetchBookingIdsForUser(user.id, user.email);

  if (bookingIds.length === 0) {
    return NextResponse.json({ summaries: [] });
  }

  const [{ data: sessions }, { data: updates }, { data: walks }] =
    await Promise.all([
      supabaseAdmin
        .from("booking_visit_sessions")
        .select("id,booking_id,status,started_at,ended_at,final_note")
        .in("booking_id", bookingIds),
      supabaseAdmin
        .from("booking_visit_updates")
        .select("id,booking_id,update_type,note,photo_url,created_at")
        .in("booking_id", bookingIds)
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("booking_walk_tracks")
        .select(
          "id,booking_id,session_id,status,started_at,ended_at,total_distance_meters,total_duration_seconds,updated_at",
        )
        .in("booking_id", bookingIds)
        .order("updated_at", { ascending: false }),
    ]);

  const sessionRows = (sessions || []) as VisitSessionRow[];
  const updateRows = (updates || []) as VisitUpdateRow[];
  const walkRows = (walks || []) as WalkTrackRow[];

  const updatesByBooking = new Map<string, VisitUpdateRow[]>();
  updateRows.forEach((update) => {
    const bookingId = String(update.booking_id || "");
    if (!bookingId) return;

    const existing = updatesByBooking.get(bookingId) || [];
    existing.push(update);
    updatesByBooking.set(bookingId, existing);
  });

  const walksByBooking = new Map<string, WalkTrackRow[]>();
  walkRows.forEach((walk) => {
    const bookingId = String(walk.booking_id || "");
    if (!bookingId) return;

    const existing = walksByBooking.get(bookingId) || [];
    existing.push(walk);
    walksByBooking.set(bookingId, existing);
  });

  const sessionByBooking = new Map<string, VisitSessionRow>();
  sessionRows.forEach((session) => {
    const bookingId = String(session.booking_id || "");
    if (!bookingId) return;
    sessionByBooking.set(bookingId, session);
  });

  const summaries = bookingIds.map((bookingId) => {
    const session = sessionByBooking.get(bookingId) || null;
    const bookingUpdates = updatesByBooking.get(bookingId) || [];
    const latestUpdate = bookingUpdates[bookingUpdates.length - 1] || null;
    const bookingWalks = walksByBooking.get(bookingId) || [];
    const activeWalk =
      bookingWalks.find((walk) => walk.status === "in_progress") ||
      bookingWalks.find((walk) => walk.status === "paused") ||
      bookingWalks[0] ||
      null;

    return {
      booking_id: bookingId,
      status: session?.status || "not_started",
      started_at: session?.started_at || null,
      ended_at: session?.ended_at || null,
      final_note: session?.final_note || null,
      update_count: bookingUpdates.length,
      photo_count: bookingUpdates.filter((update) => update.photo_url).length,
      potty_count: bookingUpdates.filter((update) =>
        ["pee", "poop"].includes(String(update.update_type || "")),
      ).length,
      food_water_count: bookingUpdates.filter((update) =>
        ["food", "water"].includes(String(update.update_type || "")),
      ).length,
      note_count: bookingUpdates.filter((update) =>
        ["note", "medication", "walk", "play", "mood"].includes(
          String(update.update_type || ""),
        ),
      ).length,
      latest_update_type: latestUpdate?.update_type || null,
      latest_update_note: latestUpdate?.note || null,
      latest_update_at: latestUpdate?.created_at || session?.started_at || null,
      active_walk_status: activeWalk?.status || null,
      active_walk_started_at: activeWalk?.started_at || null,
      active_walk_ended_at: activeWalk?.ended_at || null,
      active_walk_distance_meters: asNumber(activeWalk?.total_distance_meters),
      active_walk_duration_seconds:
        asNumber(activeWalk?.total_duration_seconds) ||
        calculateDurationSeconds(activeWalk?.started_at, activeWalk?.ended_at),
    };
  });

  return NextResponse.json({ summaries });
}
