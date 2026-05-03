import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

type BookingInsertPayload = Record<string, unknown>;

type CheckoutRouteResponse = {
  url?: string;
  checkoutUrl?: string;
  stripeSessionId?: string;
  financialPreview?: unknown;
  error?: string;
  message?: string;
  details?: unknown;
};

const DEFAULT_MARKETPLACE_FEE_PERCENT = 15;
const MIN_MARKETPLACE_FEE_PERCENT = 15;
const MAX_MARKETPLACE_FEE_PERCENT = 20;

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

function toSafeCents(value: unknown, fallback = 0) {
  const parsed = toSafeNumber(value, fallback);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return Math.round(parsed);
}

function clampMarketplaceFeePercent(value: unknown) {
  const parsed = toSafeNumber(value, DEFAULT_MARKETPLACE_FEE_PERCENT);

  return Math.min(
    MAX_MARKETPLACE_FEE_PERCENT,
    Math.max(MIN_MARKETPLACE_FEE_PERCENT, parsed),
  );
}

function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details,
    },
    { status },
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

function shouldFallbackForMissingColumns(error: unknown) {
  const message = getSupabaseErrorMessage(error).toLowerCase();

  return (
    message.includes("column") ||
    message.includes("schema cache") ||
    message.includes("could not find") ||
    message.includes("does not exist")
  );
}

function getBookingId(booking: Record<string, unknown>) {
  const id = booking.id;

  if (typeof id === "string" && id.trim()) return id.trim();
  if (typeof id === "number" && Number.isFinite(id)) return String(id);

  return "";
}

function getCheckoutBaseUrl(req: NextRequest) {
  const forwardedProto = req.headers.get("x-forwarded-proto") || "http";
  const forwardedHost = req.headers.get("x-forwarded-host") || req.headers.get("host");

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return req.nextUrl.origin;
}

function getBodyNumber(body: Record<string, unknown>, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = body[key];
    const parsed = toSafeNumber(value, Number.NaN);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function getBodyString(body: Record<string, unknown>, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = toCleanString(body[key]);

    if (value) return value;
  }

  return fallback;
}

async function insertBookingWithFallback({
  richPayload,
  fallbackPayload,
}: {
  richPayload: BookingInsertPayload;
  fallbackPayload: BookingInsertPayload;
}) {
  const richInsert = await supabaseAdmin
    .from("bookings")
    .insert(richPayload)
    .select("*")
    .single();

  if (!richInsert.error && richInsert.data) {
    return {
      booking: richInsert.data as Record<string, unknown>,
      usedFallback: false,
      error: null,
    };
  }

  if (!shouldFallbackForMissingColumns(richInsert.error)) {
    return {
      booking: null,
      usedFallback: false,
      error: richInsert.error,
    };
  }

  console.warn("Booking insert used fallback payload because some enhanced columns are missing:", {
    error: richInsert.error,
  });

  const fallbackInsert = await supabaseAdmin
    .from("bookings")
    .insert(fallbackPayload)
    .select("*")
    .single();

  return {
    booking: fallbackInsert.data as Record<string, unknown> | null,
    usedFallback: true,
    error: fallbackInsert.error,
  };
}

async function createCheckoutForBooking({
  req,
  bookingId,
  tipCents,
  tipAmount,
  tipChoice,
}: {
  req: NextRequest;
  bookingId: string;
  tipCents: number;
  tipAmount: number;
  tipChoice: string;
}) {
  const checkoutUrl = new URL("/api/stripe/checkout", getCheckoutBaseUrl(req));

  const cookieHeader = req.headers.get("cookie") || "";
  const authorizationHeader = req.headers.get("authorization") || "";

  const response = await fetch(checkoutUrl.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      ...(authorizationHeader ? { authorization: authorizationHeader } : {}),
    },
    body: JSON.stringify({
      bookingId,
      booking_id: bookingId,
      tipCents,
      tip_cents: tipCents,
      tipAmount,
      tip_amount: tipAmount,
      tipChoice,
      tip_choice: tipChoice,
    }),
    cache: "no-store",
  });

  const responseText = await response.text();

  let data: CheckoutRouteResponse | null = null;

  try {
    data = responseText ? (JSON.parse(responseText) as CheckoutRouteResponse) : null;
  } catch {
    data = {
      error: responseText || "Checkout route returned a non-JSON response.",
    };
  }

  if (!response.ok) {
    console.error("Internal checkout creation failed:", {
      status: response.status,
      data,
    });

    return {
      ok: false,
      data,
      error:
        data?.error ||
        data?.message ||
        "Booking was created, but secure checkout could not be started.",
    };
  }

  return {
    ok: true,
    data,
    error: "",
  };
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
        userError,
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
        error instanceof Error ? error.message : error,
      );
    }

    const guruId = getBodyString(body, ["guru_id", "guruId"]);
    const petName = getBodyString(body, ["pet_name", "petName"]);
    const date = getBodyString(body, [
      "date",
      "booking_date",
      "requested_date",
      "requestedDate",
    ]);
    const notes = toCleanString(body.notes);

    const serviceType =
      getBodyString(body, ["service_type", "serviceType"]) || "Pet Care";

    const serviceKey = getBodyString(body, ["service_key", "serviceKey"]);

    const timeWindow =
      getBodyString(body, ["time_window", "timeWindow"]) || null;

    const visitLength =
      getBodyString(body, ["visit_length", "visitLength"]) || null;

    const bookingType =
      getBodyString(body, ["booking_type", "bookingType"]) || "instant_booking";

    const careZipCode = getBodyString(body, ["care_zip_code", "careZipCode"]);
    const careCity = getBodyString(body, ["care_city", "careCity"]);
    const careState = getBodyString(body, ["care_state", "careState"]);

    const selectedPetId =
      getBodyString(body, ["pet_id", "petId"]) || null;

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
        guruError,
      );
    }

    const resolvedGuruId =
      typeof guru.profile_id === "string" && guru.profile_id.trim()
        ? guru.profile_id
        : typeof guru.id === "string" && guru.id.trim()
          ? guru.id
          : guruId;

    const subtotalAmount = getBodyNumber(
      body,
      [
        "subtotal_amount",
        "subtotalAmount",
        "booking_subtotal_amount",
        "bookingSubtotalAmount",
        "service_price",
        "servicePrice",
      ],
      typeof guru.hourly_rate === "number" && guru.hourly_rate > 0
        ? guru.hourly_rate
        : 25,
    );

    const marketplaceFeePercent = clampMarketplaceFeePercent(
      body.marketplace_fee_percent ?? body.marketplaceFeePercent,
    );

    const marketplaceFeeAmount = getBodyNumber(
      body,
      [
        "marketplace_fee_amount",
        "marketplaceFeeAmount",
        "marketplace_fee",
        "marketplaceFee",
        "platform_fee",
        "platformFee",
      ],
      Number((subtotalAmount * (marketplaceFeePercent / 100)).toFixed(2)),
    );

    const tipAmount = getBodyNumber(
      body,
      ["tip_amount", "tipAmount", "guru_tip_amount", "guruTipAmount"],
      0,
    );

    const tipCents =
      toSafeCents(body.tip_cents ?? body.tipCents) || Math.round(tipAmount * 100);

    const tipChoice = getBodyString(body, ["tip_choice", "tipChoice"], "none");

    const guruEstimatedBasePayout = getBodyNumber(
      body,
      ["guru_estimated_base_payout", "guruEstimatedBasePayout"],
      Number((subtotalAmount - marketplaceFeeAmount).toFixed(2)),
    );

    const guruEstimatedTotalPayout = getBodyNumber(
      body,
      ["guru_estimated_total_payout", "guruEstimatedTotalPayout"],
      Number((guruEstimatedBasePayout + tipAmount).toFixed(2)),
    );

    const customerTotalAmount = getBodyNumber(
      body,
      ["customer_total_amount", "customerTotalAmount", "amount_total", "total_amount", "total"],
      Number((subtotalAmount + marketplaceFeeAmount + tipAmount).toFixed(2)),
    );

    const now = new Date().toISOString();

    const richBookingInsertPayload: BookingInsertPayload = {
      pet_owner_id: user.id,
      customer_id: user.id,
      user_id: user.id,

      guru_id: resolvedGuruId,
      pet_id: selectedPetId,

      status: "pending",
      payment_status: "unpaid",
      payout_status: "pending",

      /*
        Important:
        total_amount remains the service subtotal for checkout calculation.
        The Stripe checkout route calculates the final customer payment with:
        service subtotal + customer tip + Stripe automatic tax.
      */
      total_amount: subtotalAmount,
      amount_total: customerTotalAmount,
      total: customerTotalAmount,

      subtotal_amount: subtotalAmount,
      service_price: subtotalAmount,
      booking_subtotal_amount: subtotalAmount,

      marketplace_fee_percent: marketplaceFeePercent,
      marketplace_fee_amount: marketplaceFeeAmount,
      marketplace_fee_min_percent: MIN_MARKETPLACE_FEE_PERCENT,
      marketplace_fee_max_percent: MAX_MARKETPLACE_FEE_PERCENT,
      sitguru_fee_amount: marketplaceFeeAmount,
      platform_fee: marketplaceFeeAmount,

      tip_choice: tipChoice,
      tip_amount: tipAmount,
      tip_cents: tipCents,
      guru_tip_amount: tipAmount,

      guru_estimated_base_payout: guruEstimatedBasePayout,
      guru_estimated_total_payout: guruEstimatedTotalPayout,
      guru_net_amount: guruEstimatedBasePayout,
      guru_payout_amount: guruEstimatedTotalPayout,

      customer_total_amount: customerTotalAmount,
      total_customer_paid: customerTotalAmount,

      pet_name: petName,
      service_type: serviceType,
      service_key: serviceKey || null,
      time_window: timeWindow,
      visit_length: visitLength,
      notes,

      care_zip_code: careZipCode || null,
      care_city: careCity || null,
      care_state: careState || null,

      booking_date: date,
      requested_date: date,
      start_time: toIsoDate(date),

      booking_type: bookingType,

      compliance_accepted: true,
      compliance_accepted_at: now,
      terms_accepted: true,
      terms_accepted_at: now,

      created_at: now,
      updated_at: now,
    };

    const fallbackBookingInsertPayload: BookingInsertPayload = {
      pet_owner_id: user.id,
      customer_id: user.id,
      user_id: user.id,

      guru_id: resolvedGuruId,

      status: "pending",
      payment_status: "unpaid",

      total_amount: subtotalAmount,
      amount_total: customerTotalAmount,
      total: customerTotalAmount,

      pet_name: petName,
      service_type: serviceType,
      time_window: timeWindow,
      visit_length: visitLength,
      notes: [
        notes,
        "",
        `SitGuru marketplace fee estimate: ${marketplaceFeePercent}%`,
        `SitGuru marketplace fee amount: $${marketplaceFeeAmount.toFixed(2)}`,
        `Guru tip selected: $${tipAmount.toFixed(2)}. 100% of the tip goes directly to the Guru.`,
        `Estimated Guru payout: $${guruEstimatedTotalPayout.toFixed(2)}`,
      ]
        .filter(Boolean)
        .join("\n"),

      booking_date: date,
      requested_date: date,
      start_time: toIsoDate(date),

      booking_type: bookingType,

      compliance_accepted: true,
      compliance_accepted_at: now,
      terms_accepted: true,
      terms_accepted_at: now,

      created_at: now,
      updated_at: now,
    };

    const {
      booking,
      usedFallback,
      error: bookingError,
    } = await insertBookingWithFallback({
      richPayload: richBookingInsertPayload,
      fallbackPayload: fallbackBookingInsertPayload,
    });

    if (bookingError || !booking) {
      console.error("Booking insert failed:", {
        bookingError,
        richBookingInsertPayload,
        fallbackBookingInsertPayload,
      });

      return jsonError(
        bookingError?.message || "Failed to create booking.",
        500,
        bookingError,
      );
    }

    const bookingId = getBookingId(booking);

    if (!bookingId) {
      return NextResponse.json({
        success: true,
        booking,
        checkoutWarning:
          "Booking was created, but no booking ID was returned to start secure checkout.",
      });
    }

    const checkoutResult = await createCheckoutForBooking({
      req,
      bookingId,
      tipCents,
      tipAmount,
      tipChoice,
    });

    if (!checkoutResult.ok) {
      return NextResponse.json({
        success: true,
        booking,
        checkoutWarning: checkoutResult.error,
        checkoutDetails: checkoutResult.data,
        usedFallbackBookingInsert: usedFallback,
      });
    }

    const checkoutUrl =
      checkoutResult.data?.checkoutUrl || checkoutResult.data?.url || "";

    return NextResponse.json({
      success: true,
      booking,
      checkoutUrl,
      url: checkoutUrl,
      stripeSessionId: checkoutResult.data?.stripeSessionId || null,
      financialPreview: checkoutResult.data?.financialPreview || null,
      usedFallbackBookingInsert: usedFallback,
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
        : error,
    );
  }
}