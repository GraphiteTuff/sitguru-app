import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

type BookingCreateBody = {
  guruId?: string;
  guru_id?: string;
  guruSlug?: string;
  guru_slug?: string;

  petId?: string;
  pet_id?: string;
  petName?: string;
  pet_name?: string;
  petPhotoUrl?: string;
  pet_photo_url?: string;

  date?: string;
  booking_date?: string;

  service?: string;
  service_name?: string;

  notes?: string;
  sessionId?: string;
};

type GuruRow = {
  id?: string | number | null;
  profile_id?: string | null;
  user_id?: string | null;
  slug?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  hourly_rate?: number | string | null;
  rate?: number | string | null;
  stripe_account_id?: string | null;
};

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function safeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function uuidOrNull(value: string) {
  return isUuid(value) ? value : null;
}

function toIsoDate(date: string) {
  return `${date}T12:00:00`;
}

function normalizeDate(value: string) {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return trimmed;
  }

  return parsed.toISOString().slice(0, 10);
}

function getGuruDisplayName(guru: GuruRow) {
  return (
    safeString(guru.display_name) ||
    safeString(guru.full_name) ||
    "Selected Guru"
  );
}

function getGuruAmount(guru: GuruRow) {
  const hourlyRate = safeNumber(guru.hourly_rate);
  if (hourlyRate > 0) return hourlyRate;

  const rate = safeNumber(guru.rate);
  if (rate > 0) return rate;

  return 25;
}

async function trackBookingEvent({
  userId,
  sessionId,
  eventName,
  guruId,
  bookingId,
  metadata,
}: {
  userId?: string | null;
  sessionId?: string | null;
  eventName: string;
  guruId?: string | null;
  bookingId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("analytics_events").insert({
      user_id: userId || null,
      session_id: sessionId || null,
      event_name: eventName,
      event_type: "booking",
      role: "customer",
      source: "booking_create_api",
      page_path: "/bookings/new",
      guru_id: guruId ? uuidOrNull(guruId) : null,
      booking_id: bookingId ? uuidOrNull(bookingId) : null,
      metadata: metadata || {},
    });
  } catch (error) {
    console.error("Booking analytics tracking failed:", error);
  }
}

async function findGuruById(guruId: string) {
  const byProfileId = await supabaseAdmin
    .from("gurus")
    .select("*")
    .eq("profile_id", guruId)
    .maybeSingle<GuruRow>();

  if (byProfileId.data) return byProfileId;

  const byUserId = await supabaseAdmin
    .from("gurus")
    .select("*")
    .eq("user_id", guruId)
    .maybeSingle<GuruRow>();

  if (byUserId.data) return byUserId;

  const byId = await supabaseAdmin
    .from("gurus")
    .select("*")
    .eq("id", guruId)
    .maybeSingle<GuruRow>();

  return byId;
}

async function findGuruBySlug(guruSlug: string) {
  return supabaseAdmin
    .from("gurus")
    .select("*")
    .eq("slug", guruSlug)
    .maybeSingle<GuruRow>();
}

async function findGuru({
  guruId,
  guruSlug,
}: {
  guruId: string;
  guruSlug: string;
}) {
  if (guruId) {
    const byId = await findGuruById(guruId);

    if (byId.data || byId.error) {
      return byId;
    }
  }

  if (guruSlug) {
    return findGuruBySlug(guruSlug);
  }

  return {
    data: null,
    error: new Error("Missing guru identifier"),
  };
}

export async function POST(req: NextRequest) {
  let userId: string | null = null;

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    userId = user?.id || null;

    if (userError || !user) {
      await trackBookingEvent({
        eventName: "booking_request_failed",
        metadata: {
          location: "api_bookings_create",
          reason: "unauthorized",
        },
      });

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as BookingCreateBody | null;

    const guruId = safeString(body?.guruId || body?.guru_id);
    const guruSlug = safeString(body?.guruSlug || body?.guru_slug);

    const petId = safeString(body?.petId || body?.pet_id);
    const petName = safeString(body?.petName || body?.pet_name);
    const petPhotoUrl = safeString(body?.petPhotoUrl || body?.pet_photo_url);

    const date = normalizeDate(safeString(body?.date || body?.booking_date));
    const service = safeString(body?.service || body?.service_name);
    const notes = safeString(body?.notes);
    const sessionId = safeString(body?.sessionId);

    if (!guruId && !guruSlug) {
      await trackBookingEvent({
        userId,
        sessionId,
        eventName: "booking_request_failed",
        metadata: {
          location: "api_bookings_create",
          reason: "missing_guru_information",
          guru_id: guruId,
          guru_slug: guruSlug,
          pet_id: petId,
          pet_name: petName,
          service,
        },
      });

      return NextResponse.json(
        { error: "Guru ID is required" },
        { status: 400 }
      );
    }

    if (!petName) {
      await trackBookingEvent({
        userId,
        sessionId,
        eventName: "booking_request_failed",
        guruId,
        metadata: {
          location: "api_bookings_create",
          reason: "missing_pet_name",
          guru_id: guruId,
          guru_slug: guruSlug,
          pet_id: petId,
          service,
        },
      });

      return NextResponse.json(
        { error: "Pet name is required" },
        { status: 400 }
      );
    }

    if (!date) {
      await trackBookingEvent({
        userId,
        sessionId,
        eventName: "booking_request_failed",
        guruId,
        metadata: {
          location: "api_bookings_create",
          reason: "missing_date",
          guru_id: guruId,
          guru_slug: guruSlug,
          pet_id: petId,
          pet_name: petName,
          service,
        },
      });

      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const { data: guru, error: guruError } = await findGuru({
      guruId,
      guruSlug,
    });

    if (guruError || !guru) {
      console.error("Guru lookup failed:", guruError);

      await trackBookingEvent({
        userId,
        sessionId,
        eventName: "booking_request_failed",
        guruId: guruId || guruSlug,
        metadata: {
          location: "api_bookings_create",
          reason: "guru_not_found",
          error: guruError?.message || "Guru not found",
          guru_id: guruId,
          guru_slug: guruSlug,
          pet_id: petId,
          pet_name: petName,
          service,
        },
      });

      return NextResponse.json({ error: "Guru not found" }, { status: 404 });
    }

    const resolvedGuruId =
      safeString(guru.profile_id) ||
      safeString(guru.user_id) ||
      safeString(guru.id) ||
      guruId ||
      guruSlug;

    const totalAmount = getGuruAmount(guru);
    const guruName = getGuruDisplayName(guru);

    await trackBookingEvent({
      userId,
      sessionId,
      eventName: "booking_request_received",
      guruId: resolvedGuruId,
      metadata: {
        location: "api_bookings_create",
        guru_id: guruId,
        guru_slug: guruSlug,
        resolved_guru_id: resolvedGuruId,
        guru_name: guruName,
        pet_id: petId,
        pet_name: petName,
        pet_photo_url: petPhotoUrl,
        booking_date: date,
        service,
        has_notes: Boolean(notes),
        total_amount: totalAmount,
      },
    });

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        pet_owner_id: user.id,
        guru_id: resolvedGuruId,
        status: "pending",
        payment_status: "unpaid",
        total_amount: totalAmount,
        pet_name: petName,
        notes,
        start_time: toIsoDate(date),
      })
      .select("*")
      .single();

    if (bookingError || !booking) {
      console.error("Booking insert failed:", bookingError);

      await trackBookingEvent({
        userId,
        sessionId,
        eventName: "booking_request_failed",
        guruId: resolvedGuruId,
        metadata: {
          location: "api_bookings_create",
          reason: "booking_insert_failed",
          error: bookingError?.message || "Failed to create booking",
          guru_id: guruId,
          guru_slug: guruSlug,
          resolved_guru_id: resolvedGuruId,
          guru_name: guruName,
          pet_id: petId,
          pet_name: petName,
          booking_date: date,
          service,
          total_amount: totalAmount,
        },
      });

      return NextResponse.json(
        { error: bookingError?.message || "Failed to create booking" },
        { status: 500 }
      );
    }

    const bookingId = safeString((booking as Record<string, unknown>).id);

    await trackBookingEvent({
      userId,
      sessionId,
      eventName: "booking_request_created",
      guruId: resolvedGuruId,
      bookingId,
      metadata: {
        location: "api_bookings_create",
        booking_id: bookingId,
        guru_id: guruId,
        guru_slug: guruSlug,
        resolved_guru_id: resolvedGuruId,
        guru_name: guruName,
        pet_id: petId,
        pet_name: petName,
        pet_photo_url: petPhotoUrl,
        booking_date: date,
        service,
        has_notes: Boolean(notes),
        total_amount: totalAmount,
      },
    });

    return NextResponse.json({
      success: true,
      bookingId,
      booking,
    });
  } catch (error) {
    console.error("Booking create route error:", error);

    await trackBookingEvent({
      userId,
      eventName: "booking_request_failed",
      metadata: {
        location: "api_bookings_create",
        reason: "unexpected_error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}