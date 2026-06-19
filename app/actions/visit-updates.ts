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
  | "note";

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

  await supabaseAdmin.from("booking_visit_updates").insert({
    session_id: session.id,
    booking_id: bookingId,
    update_type: "visit_started",
    note: "PawReport started.",
    lat: location?.lat ?? null,
    lng: location?.lng ?? null,
    accuracy: location?.accuracy ?? null,
  });

  revalidatePath(`/guru/dashboard/bookings/${bookingId}/visit-updates`);
  revalidatePath(`/customer/dashboard/bookings/${bookingId}/visit-updates`);
  revalidatePath(`/admin/bookings/${bookingId}/visit-updates`);

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

  const now = new Date().toISOString();

  const { error: updateError } = await supabaseAdmin
    .from("booking_visit_sessions")
    .update({
      status: "completed",
      ended_at: now,
      end_lat: location?.lat ?? null,
      end_lng: location?.lng ?? null,
      end_accuracy: location?.accuracy ?? null,
      final_note: finalNote || null,
      updated_at: now,
    })
    .eq("id", session.id);

  if (updateError) {
    console.error("Complete PawReport error:", updateError);
    return { success: false, error: "Could not complete PawReport." };
  }

  await supabaseAdmin.from("booking_visit_updates").insert({
    session_id: session.id,
    booking_id: bookingId,
    update_type: "visit_ended",
    note: finalNote || "PawReport completed.",
    lat: location?.lat ?? null,
    lng: location?.lng ?? null,
    accuracy: location?.accuracy ?? null,
  });

  revalidatePath(`/guru/dashboard/bookings/${bookingId}/visit-updates`);
  revalidatePath(`/customer/dashboard/bookings/${bookingId}/visit-updates`);
  revalidatePath(`/admin/bookings/${bookingId}/visit-updates`);

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

  revalidatePath(`/guru/dashboard/bookings/${bookingId}/visit-updates`);
  revalidatePath(`/customer/dashboard/bookings/${bookingId}/visit-updates`);
  revalidatePath(`/admin/bookings/${bookingId}/visit-updates`);

  return { success: true, sessionId: session.id };
}