import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

function toIsoDate(date: string) {
  return `${date}T12:00:00`;
}

function toCleanString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value).trim();
  return "";
}

function toSafeNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details,
    },
    { status }
  );
}

function getSupabaseErrorMessage(error: unknown) {
  if (!error) return "Unknown Supabase error.";

  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unknown Supabase error.";
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Booking route unauthorized:", userError);

      return jsonError(
        userError?.message || "Unauthorized. Please sign in again.",
        401,
        userError
      );
    }

    let body: Record<string, unknown>;

    try {
      body = await req.json();
    } catch (error) {
      console.error("Invalid booking JSON body:", error);

      return jsonError(
        "Invalid request body. JSON is required.",
        400,
        error instanceof Error ? error.message : error
      );
    }

    const guruId = toCleanString(body.guru_id || body.guruId);
    const petName = toCleanString(body.pet_name || body.petName);
    const date = toCleanString(
      body.date || body.booking_date || body.requested_date || body.requestedDate
    );
    const notes = toCleanString(body.notes);

    const serviceType =
      toCleanString(body.service_type || body.serviceType) || "Pet Care";

    const timeWindow =
      toCleanString(body.time_window || body.timeWindow) || null;

    const visitLength =
      toCleanString(body.visit_length || body.visitLength) || null;

    if (!guruId) {
      return jsonError("Guru ID is required.", 400, {
        receivedBodyKeys: Object.keys(body),
      });
    }

    if (!petName) {
      return jsonError("Pet name is required.", 400, {
        receivedBodyKeys: Object.keys(body),
      });
    }

    if (!date) {
      return jsonError("Date is required.", 400, {
        receivedBodyKeys: Object.keys(body),
      });
    }

    const { data: guru, error: guruError } = await supabaseAdmin
      .from("gurus")
      .select("id, profile_id, display_name, hourly_rate, stripe_account_id")
      .or(`profile_id.eq.${guruId},id.eq.${guruId}`)
      .maybeSingle();

    if (guruError || !guru) {
      console.error("Guru lookup failed:", {
        guruId,
        guruError,
      });

      return jsonError(
        guruError
          ? getSupabaseErrorMessage(guruError)
          : `Guru not found for ID: ${guruId}`,
        404,
        guruError
      );
    }

    const resolvedGuruId =
      typeof guru.profile_id === "string" && guru.profile_id.trim()
        ? guru.profile_id
        : typeof guru.id === "string" && guru.id.trim()
          ? guru.id
          : guruId;

    const totalAmount =
      typeof guru.hourly_rate === "number" && guru.hourly_rate > 0
        ? guru.hourly_rate
        : toSafeNumber(body.total_amount || body.total || body.amount_total, 25);

    const now = new Date().toISOString();

    const bookingInsertPayload = {
      pet_owner_id: user.id,
      customer_id: user.id,
      user_id: user.id,

      guru_id: resolvedGuruId,

      status: "pending",
      payment_status: "unpaid",

      total_amount: totalAmount,
      amount_total: totalAmount,
      total: totalAmount,

      pet_name: petName,
      service_type: serviceType,
      time_window: timeWindow,
      visit_length: visitLength,
      notes,

      booking_date: date,
      requested_date: date,
      start_time: toIsoDate(date),

      booking_type: "instant_booking",

      compliance_accepted: true,
      compliance_accepted_at: now,
      terms_accepted: true,
      terms_accepted_at: now,

      created_at: now,
      updated_at: now,
    };

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert(bookingInsertPayload)
      .select("*")
      .single();

    if (bookingError || !booking) {
      console.error("Booking insert failed:", {
        bookingError,
        bookingInsertPayload,
      });

      return jsonError(
        bookingError?.message || "Failed to create booking.",
        500,
        bookingError
      );
    }

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("Booking create route error:", error);

    return jsonError(
      error instanceof Error ? error.message : "Failed to create booking.",
      500,
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error
    );
  }
}
