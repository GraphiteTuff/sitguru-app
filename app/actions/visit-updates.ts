"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

type VisitUpdateType =
  | "visit_started"
  | "visit_ended"
  | "pee"
  | "poop"
  | "water"
  | "food"
  | "photo"
  | "note"
  | "medication"
  | "walk"
  | "play"
  | "mood";

type LocationPayload = {
  lat?: number | null;
  lng?: number | null;
  accuracy?: number | null;
};

type ActionResult = {
  success: boolean;
  error?: string;
  sessionId?: string;
};

function cleanText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

async function getOrCreateSession(
  bookingId: string,
  userId: string
): Promise<{ id: string } | null> {
  const { data: existingSession, error: existingError } = await supabaseAdmin
    .from("booking_visit_sessions")
    .select("id")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (existingError) {
    console.error("PawReport session lookup error:", existingError);
    return null;
  }

  if (existingSession?.id) {
    return existingSession;
  }

  const { data: newSession, error: createError } = await supabaseAdmin
    .from("booking_visit_sessions")
    .insert({
      booking_id: bookingId,
      guru_id: userId,
      status: "not_started",
    })
    .select("id")
    .single();

  if (createError) {
    console.error("PawReport session create error:", createError);
    return null;
  }

  return newSession;
}

function revalidateVisitPaths(bookingId: string) {
  revalidatePath(`/guru/dashboard/bookings/${bookingId}/visit-updates`);
  revalidatePath(`/customer/dashboard/bookings/${bookingId}/visit-updates`);
  revalidatePath(`/admin/bookings/${bookingId}/visit-updates`);
  revalidatePath(`/guru/dashboard/bookings`);
  revalidatePath(`/customer/dashboard/bookings`);
}

export async function startVisitAction(
  bookingId: string,
  location?: LocationPayload
): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      success: false,
      error: "You must be logged in to start a PawReport.",
    };
  }

  if (!bookingId) {
    return { success: false, error: "Missing booking ID." };
  }

  const session = await getOrCreateSession(bookingId, userId);

  if (!session?.id) {
    return { success: false, error: "Could not create PawReport session." };
  }

  const now = new Date().toISOString();

  const { error: updateError } = await supabaseAdmin
    .from("booking_visit_sessions")
    .update({
      status: "in_progress",
      started_at: now,
      start_lat: location?.lat ?? null,
      start_lng: location?.lng ?? null,
      start_accuracy: location?.accuracy ?? null,
      updated_at: now,
    })
    .eq("id", session.id);

  if (updateError) {
    console.error("Start PawReport error:", updateError);
    return { success: false, error: "Could not start PawReport." };
  }

  const { error: insertError } = await supabaseAdmin
    .from("booking_visit_updates")
    .insert({
      session_id: session.id,
      booking_id: bookingId,
      update_type: "visit_started",
      note: "PawReport started.",
      lat: location?.lat ?? null,
      lng: location?.lng ?? null,
      accuracy: location?.accuracy ?? null,
    });

  if (insertError) {
    console.error("Start PawReport timeline insert error:", insertError);
  }

  revalidateVisitPaths(bookingId);

  return { success: true, sessionId: session.id };
}

export async function endVisitAction(
  bookingId: string,
  finalNote: string,
  location?: LocationPayload
): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      success: false,
      error: "You must be logged in to complete a PawReport.",
    };
  }

  if (!bookingId) {
    return { success: false, error: "Missing booking ID." };
  }

  const session = await getOrCreateSession(bookingId, userId);

  if (!session?.id) {
    return { success: false, error: "Could not find PawReport session." };
  }

  const cleanFinalNote = finalNote.trim();
  const now = new Date().toISOString();

  const { error: updateError } = await supabaseAdmin
    .from("booking_visit_sessions")
    .update({
      status: "completed",
      ended_at: now,
      end_lat: location?.lat ?? null,
      end_lng: location?.lng ?? null,
      end_accuracy: location?.accuracy ?? null,
      final_note: cleanFinalNote || null,
      updated_at: now,
    })
    .eq("id", session.id);

  if (updateError) {
    console.error("Complete PawReport error:", updateError);
    return { success: false, error: "Could not complete PawReport." };
  }

  const { error: insertError } = await supabaseAdmin
    .from("booking_visit_updates")
    .insert({
      session_id: session.id,
      booking_id: bookingId,
      update_type: "visit_ended",
      note: cleanFinalNote || "PawReport completed.",
      lat: location?.lat ?? null,
      lng: location?.lng ?? null,
      accuracy: location?.accuracy ?? null,
    });

  if (insertError) {
    console.error("Complete PawReport timeline insert error:", insertError);
  }

  revalidateVisitPaths(bookingId);

  return { success: true, sessionId: session.id };
}

export async function addVisitUpdateAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      success: false,
      error: "You must be logged in to add a PawReport update.",
    };
  }

  const bookingId = cleanText(formData.get("bookingId"));
  const updateType = cleanText(formData.get("updateType")) as VisitUpdateType;
  const note = cleanText(formData.get("note"));
  const photoUrl = cleanText(formData.get("photoUrl"));
  const lat = parseNumber(formData.get("lat"));
  const lng = parseNumber(formData.get("lng"));
  const accuracy = parseNumber(formData.get("accuracy"));

  if (!bookingId) {
    return { success: false, error: "Missing booking ID." };
  }

  const allowedTypes: VisitUpdateType[] = [
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
  ];

  if (!allowedTypes.includes(updateType)) {
    return { success: false, error: "Invalid PawReport update type." };
  }

  const session = await getOrCreateSession(bookingId, userId);

  if (!session?.id) {
    return { success: false, error: "Could not find PawReport session." };
  }

  const { error } = await supabaseAdmin.from("booking_visit_updates").insert({
    session_id: session.id,
    booking_id: bookingId,
    update_type: updateType,
    note: note || null,
    photo_url: photoUrl || null,
    lat,
    lng,
    accuracy,
  });

  if (error) {
    console.error("Add PawReport update error:", error);
    return { success: false, error: "Could not add PawReport update." };
  }

  revalidateVisitPaths(bookingId);

  return { success: true, sessionId: session.id };
}


type WalkTrackPayload = {
  bookingId: string;
  walkTrackId: string;
  lat?: number | null;
  lng?: number | null;
  accuracy?: number | null;
  totalDistanceMeters?: number | null;
  totalDurationSeconds?: number | null;
};

type WalkTrackResult = ActionResult & {
  walkTrackId?: string;
};

function formatWalkDistanceForNote(meters?: number | null) {
  if (!meters || !Number.isFinite(meters) || meters <= 0) return "0.00 mi";

  const miles = meters / 1609.344;
  return `${miles.toFixed(miles >= 10 ? 1 : 2)} mi`;
}

function formatWalkDurationForNote(seconds?: number | null) {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return "0 min";

  const minutes = Math.max(1, Math.round(seconds / 60));

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) return `${hours} hr`;

  return `${hours} hr ${remainingMinutes} min`;
}

export async function startWalkTrackAction(
  bookingId: string,
  location?: LocationPayload
): Promise<WalkTrackResult> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      success: false,
      error: "You must be logged in to start live walk tracking.",
    };
  }

  if (!bookingId) {
    return { success: false, error: "Missing booking ID." };
  }

  if (location?.lat == null || location?.lng == null) {
    return {
      success: false,
      error: "Location is required to start live walk tracking.",
    };
  }

  const session = await getOrCreateSession(bookingId, userId);

  if (!session?.id) {
    return { success: false, error: "Could not find PawReport session." };
  }

  const now = new Date().toISOString();

  const { data: walkTrack, error: walkError } = await supabaseAdmin
    .from("booking_walk_tracks")
    .insert({
      booking_id: bookingId,
      session_id: session.id,
      guru_id: userId,
      status: "in_progress",
      started_at: now,
      start_lat: location.lat,
      start_lng: location.lng,
      end_lat: null,
      end_lng: null,
      total_distance_meters: 0,
      total_duration_seconds: 0,
      updated_at: now,
    })
    .select("id")
    .single();

  if (walkError || !walkTrack?.id) {
    console.error("Start live walk error:", walkError);
    return { success: false, error: "Could not start live walk tracking." };
  }

  const { error: pointError } = await supabaseAdmin
    .from("booking_walk_track_points")
    .insert({
      walk_track_id: walkTrack.id,
      booking_id: bookingId,
      session_id: session.id,
      guru_id: userId,
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy ?? null,
      recorded_at: now,
    });

  if (pointError) {
    console.error("Start live walk point error:", pointError);
  }

  await supabaseAdmin.from("booking_visit_updates").insert({
    session_id: session.id,
    booking_id: bookingId,
    update_type: "walk",
    note: "Live walk started.",
    lat: location.lat,
    lng: location.lng,
    accuracy: location.accuracy ?? null,
  });

  revalidateVisitPaths(bookingId);

  return {
    success: true,
    sessionId: session.id,
    walkTrackId: walkTrack.id,
  };
}

export async function recordWalkTrackPointAction(
  payload: WalkTrackPayload
): Promise<WalkTrackResult> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      success: false,
      error: "You must be logged in to save live walk tracking.",
    };
  }

  if (!payload.bookingId || !payload.walkTrackId) {
    return { success: false, error: "Missing walk tracking details." };
  }

  if (payload.lat == null || payload.lng == null) {
    return { success: false, error: "Missing live walk location." };
  }

  const session = await getOrCreateSession(payload.bookingId, userId);

  if (!session?.id) {
    return { success: false, error: "Could not find PawReport session." };
  }

  const now = new Date().toISOString();

  const { error: pointError } = await supabaseAdmin
    .from("booking_walk_track_points")
    .insert({
      walk_track_id: payload.walkTrackId,
      booking_id: payload.bookingId,
      session_id: session.id,
      guru_id: userId,
      lat: payload.lat,
      lng: payload.lng,
      accuracy: payload.accuracy ?? null,
      recorded_at: now,
    });

  if (pointError) {
    console.error("Record live walk point error:", pointError);
    return { success: false, error: "Could not save live walk point." };
  }

  const { error: updateError } = await supabaseAdmin
    .from("booking_walk_tracks")
    .update({
      end_lat: payload.lat,
      end_lng: payload.lng,
      total_distance_meters: payload.totalDistanceMeters ?? 0,
      total_duration_seconds: payload.totalDurationSeconds ?? 0,
      updated_at: now,
    })
    .eq("id", payload.walkTrackId);

  if (updateError) {
    console.error("Update live walk summary error:", updateError);
  }

  revalidateVisitPaths(payload.bookingId);

  return {
    success: true,
    sessionId: session.id,
    walkTrackId: payload.walkTrackId,
  };
}

export async function endWalkTrackAction(
  payload: WalkTrackPayload
): Promise<WalkTrackResult> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      success: false,
      error: "You must be logged in to end live walk tracking.",
    };
  }

  if (!payload.bookingId || !payload.walkTrackId) {
    return { success: false, error: "Missing walk tracking details." };
  }

  const session = await getOrCreateSession(payload.bookingId, userId);

  if (!session?.id) {
    return { success: false, error: "Could not find PawReport session." };
  }

  const now = new Date().toISOString();
  const distanceLabel = formatWalkDistanceForNote(payload.totalDistanceMeters);
  const durationLabel = formatWalkDurationForNote(payload.totalDurationSeconds);

  const { error: updateError } = await supabaseAdmin
    .from("booking_walk_tracks")
    .update({
      status: "completed",
      ended_at: now,
      end_lat: payload.lat ?? null,
      end_lng: payload.lng ?? null,
      total_distance_meters: payload.totalDistanceMeters ?? 0,
      total_duration_seconds: payload.totalDurationSeconds ?? 0,
      updated_at: now,
    })
    .eq("id", payload.walkTrackId);

  if (updateError) {
    console.error("End live walk error:", updateError);
    return { success: false, error: "Could not end live walk tracking." };
  }

  if (payload.lat != null && payload.lng != null) {
    await supabaseAdmin.from("booking_walk_track_points").insert({
      walk_track_id: payload.walkTrackId,
      booking_id: payload.bookingId,
      session_id: session.id,
      guru_id: userId,
      lat: payload.lat,
      lng: payload.lng,
      accuracy: payload.accuracy ?? null,
      recorded_at: now,
    });
  }

  await supabaseAdmin.from("booking_visit_updates").insert({
    session_id: session.id,
    booking_id: payload.bookingId,
    update_type: "walk",
    note: `Live walk completed. Distance: ${distanceLabel}. Duration: ${durationLabel}.`,
    lat: payload.lat ?? null,
    lng: payload.lng ?? null,
    accuracy: payload.accuracy ?? null,
  });

  revalidateVisitPaths(payload.bookingId);

  return {
    success: true,
    sessionId: session.id,
    walkTrackId: payload.walkTrackId,
  };
}
