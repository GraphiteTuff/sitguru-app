import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type BookingCreateBody = Record<string, unknown>;

type CheckoutRouteResponse = {
  url?: string;
  checkoutUrl?: string;
  stripeSessionId?: string;
  sessionId?: string;
  financialPreview?: unknown;
  error?: string;
  message?: string;
  details?: unknown;
};

const DEFAULT_MARKETPLACE_FEE_PERCENT = 15;
const MIN_MARKETPLACE_FEE_PERCENT = 15;
const MAX_MARKETPLACE_FEE_PERCENT = 20;

function jsonError(message: string, status = 400, details?: unknown) {
  console.error("BOOKING CREATE ERROR:", {
    message,
    status,
    details,
  });

  return NextResponse.json(
    {
      success: false,
      error: message,
      details,
    },
    { status },
  );
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function toText(value: unknown, fallback = "") {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
}

function toIsoDate(date: string) {
  return `${date}T12:00:00`;
}

function clampMarketplaceFeePercent(value: unknown) {
  const parsed = toNumber(value, DEFAULT_MARKETPLACE_FEE_PERCENT);

  return Math.min(
    MAX_MARKETPLACE_FEE_PERCENT,
    Math.max(MIN_MARKETPLACE_FEE_PERCENT, parsed),
  );
}

function getFirstText(body: BookingCreateBody, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = toText(body[key]);
    if (value) return value;
  }

  return fallback;
}

function getFirstNumber(body: BookingCreateBody, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = body[key];
    const parsed = toNumber(value, Number.NaN);

    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function getStringArray(body: BookingCreateBody, keys: string[]) {
  for (const key of keys) {
    const value = body[key];

    if (Array.isArray(value)) {
      return value.map((item) => toText(item)).filter(Boolean);
    }

    if (typeof value === "string" && value.trim()) {
      const trimmed = value.trim();

      try {
        const parsed = JSON.parse(trimmed);

        if (Array.isArray(parsed)) {
          return parsed.map((item) => toText(item)).filter(Boolean);
        }
      } catch {
        return trimmed
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }
  }

  return [] as string[];
}

function getMissingColumnName(errorMessage: string) {
  const quotedColumnMatch = errorMessage.match(/'([^']+)' column/i);
  if (quotedColumnMatch?.[1]) return quotedColumnMatch[1];

  const columnDoesNotExistMatch = errorMessage.match(
    /column "([^"]+)" does not exist/i,
  );
  if (columnDoesNotExistMatch?.[1]) return columnDoesNotExistMatch[1];

  return null;
}

function getSupabaseErrorMessage(error: unknown) {
  if (!error) return "Unknown Supabase error.";

  if (error instanceof Error) return error.message;

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

function normalizeDateSelectionMode(value: string) {
  return value === "range" ? "range" : "single";
}

function getDateRangeLabel({
  mode,
  startDate,
  endDate,
  fallback,
}: {
  mode: string;
  startDate: string;
  endDate: string;
  fallback: string;
}) {
  if (fallback) return fallback;
  if (mode !== "range") return startDate;
  if (!endDate || endDate === startDate) return startDate;

  return `${startDate} to ${endDate}`;
}

function getGuruName(guru: Record<string, unknown> | null, fallback = "SitGuru") {
  if (!guru) return fallback;

  return (
    getFirstText(guru, [
      "display_name",
      "full_name",
      "public_name",
      "business_name",
      "name",
      "first_name",
    ]) || fallback
  );
}

function getGuruAvatarUrl(guru: Record<string, unknown> | null) {
  if (!guru) return "";

  return getFirstText(guru, [
    "profile_photo_url",
    "photo_url",
    "avatar_url",
    "image_url",
    "headshot_url",
    "profile_image_url",
  ]);
}

function getPetPhotoUrl(pet: Record<string, unknown> | null) {
  if (!pet) return "";

  return getFirstText(pet, [
    "photo_url",
    "pet_photo_url",
    "avatar_url",
    "profile_photo_url",
  ]);
}

async function insertBookingWithMissingColumnRetry(
  payload: Record<string, unknown>,
) {
  let insertPayload = { ...payload };

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .insert(insertPayload)
      .select("*")
      .single();

    if (!error) return { data, error: null };

    console.error("BOOKING INSERT ERROR:", error);

    const missingColumn = getMissingColumnName(error.message || "");

    if (missingColumn && missingColumn in insertPayload) {
      console.warn("Removing missing booking column and retrying:", missingColumn);
      delete insertPayload[missingColumn];
      continue;
    }

    return { data: null, error };
  }

  return {
    data: null,
    error: {
      message:
        "Could not create booking because too many booking columns are missing from the database.",
    },
  };
}

async function safeUpdateBooking(
  bookingId: string | number,
  payload: Record<string, unknown>,
) {
  let updatePayload = { ...payload };

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const { error } = await supabaseAdmin
      .from("bookings")
      .update(updatePayload)
      .eq("id", bookingId);

    if (!error) return null;

    console.error("BOOKING UPDATE ERROR:", error);

    const missingColumn = getMissingColumnName(error.message || "");

    if (missingColumn && missingColumn in updatePayload) {
      console.warn("Removing missing update column and retrying:", missingColumn);
      delete updatePayload[missingColumn];
      continue;
    }

    return error;
  }

  return null;
}

async function fetchGuruForBooking({
  guruId,
  guruSlug,
}: {
  guruId: string;
  guruSlug: string;
}) {
  if (guruId) {
    const attempts = [
      { column: "id", value: guruId },
      { column: "profile_id", value: guruId },
      { column: "user_id", value: guruId },
    ];

    for (const attempt of attempts) {
      const { data, error } = await supabaseAdmin
        .from("gurus")
        .select("*")
        .eq(attempt.column, attempt.value)
        .limit(1)
        .maybeSingle();

      if (!error && data) return data as Record<string, unknown>;
    }
  }

  if (guruSlug) {
    const { data, error } = await supabaseAdmin
      .from("gurus")
      .select("*")
      .eq("slug", guruSlug)
      .limit(1)
      .maybeSingle();

    if (!error && data) return data as Record<string, unknown>;
  }

  return null;
}

async function fetchPetForBooking({
  userId,
  petId,
  petName,
}: {
  userId: string;
  petId: string | null;
  petName: string;
}) {
  const ownerColumns = ["owner_id", "user_id", "customer_id", "pet_owner_id"];

  if (petId) {
    for (const ownerColumn of ownerColumns) {
      const { data, error } = await supabaseAdmin
        .from("pets")
        .select("*")
        .eq("id", petId)
        .eq(ownerColumn, userId)
        .limit(1)
        .maybeSingle();

      if (!error && data) return data as Record<string, unknown>;
    }

    const { data, error } = await supabaseAdmin
      .from("pets")
      .select("*")
      .eq("id", petId)
      .limit(1)
      .maybeSingle();

    if (!error && data) return data as Record<string, unknown>;
  }

  if (!petName.trim()) return null;

  for (const ownerColumn of ownerColumns) {
    const { data, error } = await supabaseAdmin
      .from("pets")
      .select("*")
      .eq(ownerColumn, userId)
      .ilike("name", petName.trim())
      .order("photo_url", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) return data as Record<string, unknown>;
  }

  return null;
}

function getCheckoutBaseUrl(req: NextRequest) {
  const origin =
    req.headers.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  return origin.replace(/\/+$/, "");
}

async function createCheckoutForBooking({
  req,
  bookingId,
  checkoutPayload,
}: {
  req: NextRequest;
  bookingId: string;
  checkoutPayload: Record<string, unknown>;
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
      ...checkoutPayload,
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

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "SitGuru booking create API route is working.",
  });
}

export async function POST(req: NextRequest) {
  try {
    let body: BookingCreateBody;

    try {
      body = await req.json();
    } catch {
      return jsonError(
        "Invalid booking request. The request body was not valid JSON.",
        400,
      );
    }

    console.log("BOOKING CREATE BODY:", body);

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonError("You must be signed in to create a booking.", 401, userError);
    }

    const guruSlug = getFirstText(body, ["guruSlug", "slug", "guru_slug"]);
    const incomingGuruId = getFirstText(body, ["guruId", "guru_id"]);
    const petName = getFirstText(body, ["petName", "pet_name"]);
    const incomingPetId = getFirstText(body, ["petId", "pet_id"]) || null;

    const dateSelectionMode = normalizeDateSelectionMode(
      getFirstText(body, ["dateSelectionMode", "date_selection_mode"], "single"),
    );
    const requestedStartDate = getFirstText(body, [
      "requestedStartDate",
      "requested_start_date",
      "requestedDate",
      "requested_date",
      "bookingDate",
      "booking_date",
      "date",
    ]);
    const requestedEndDate =
      dateSelectionMode === "range"
        ? getFirstText(
            body,
            ["requestedEndDate", "requested_end_date"],
            requestedStartDate,
          )
        : requestedStartDate;
    const selectedDates = getStringArray(body, ["selectedDates", "selected_dates"]);
    const dateRangeLabel = getDateRangeLabel({
      mode: dateSelectionMode,
      startDate: requestedStartDate,
      endDate: requestedEndDate,
      fallback: getFirstText(body, ["dateRangeLabel", "date_range_label"]),
    });

    const serviceType = getFirstText(
      body,
      ["serviceType", "service_type", "service"],
      "Drop-In Visit",
    );
    const serviceKey = getFirstText(body, ["serviceKey", "service_key"]);
    const timeWindow = getFirstText(body, ["timeWindow", "time_window"], "Morning");
    const visitLength = getFirstText(body, ["visitLength", "visit_length"], "30 minutes");
    const notes = getFirstText(body, ["notes"]);

    const customerName = getFirstText(
      body,
      ["customerName", "customer_name"],
      "SitGuru Customer",
    );
    const customerEmail = getFirstText(
      body,
      ["customerEmail", "customer_email"],
      user.email || "",
    );

    if (!guruSlug && !incomingGuruId) {
      return jsonError("Missing Guru information for this booking.", 400);
    }

    if (!petName) {
      return jsonError("Missing pet name for this booking.", 400);
    }

    if (!requestedStartDate) {
      return jsonError("Missing requested booking date.", 400);
    }

    if (dateSelectionMode === "range" && !requestedEndDate) {
      return jsonError("Missing requested booking end date.", 400);
    }

    if (!customerEmail) {
      return jsonError("Missing customer email for checkout.", 400);
    }

    const guru = await fetchGuruForBooking({
      guruId: incomingGuruId,
      guruSlug,
    });

    const resolvedGuruId =
      getFirstText(guru || {}, ["profile_id", "id", "user_id"]) || incomingGuruId;
    const resolvedGuruName =
      getFirstText(body, ["guruName", "guru_name", "sitter_name", "provider_name"]) ||
      getGuruName(guru, "SitGuru");
    const resolvedGuruAvatarUrl =
      getFirstText(body, [
        "guruAvatarUrl",
        "guru_avatar_url",
        "guruPhotoUrl",
        "guru_photo_url",
        "sitter_avatar_url",
        "provider_avatar_url",
      ]) || getGuruAvatarUrl(guru);

    const matchedPet = await fetchPetForBooking({
      userId: user.id,
      petId: incomingPetId,
      petName,
    });

    const resolvedPetId =
      incomingPetId ||
      (matchedPet?.id ? String(matchedPet.id) : "") ||
      null;

    const resolvedPetPhotoUrl =
      getFirstText(body, [
        "petPhotoUrl",
        "pet_photo_url",
        "petAvatarUrl",
        "pet_avatar_url",
      ]) || getPetPhotoUrl(matchedPet);

    const servicePrice = getFirstNumber(
      body,
      [
        "servicePrice",
        "service_price",
        "subtotalAmount",
        "subtotal_amount",
        "bookingSubtotalAmount",
        "booking_subtotal_amount",
      ],
      25,
    );

    const marketplaceFeePercent = clampMarketplaceFeePercent(
      body.marketplace_fee_percent ?? body.marketplaceFeePercent,
    );

    const marketplaceFee = getFirstNumber(
      body,
      [
        "marketplaceFeeAmount",
        "marketplace_fee_amount",
        "marketplaceFee",
        "marketplace_fee",
        "platformFee",
        "platform_fee",
      ],
      Number((servicePrice * (marketplaceFeePercent / 100)).toFixed(2)),
    );

    const tipAmount = getFirstNumber(
      body,
      ["tipAmount", "tip_amount", "guruTipAmount", "guru_tip_amount"],
      0,
    );

    const customerTotal = getFirstNumber(
      body,
      ["customerTotalAmount", "customer_total_amount", "amount_total", "total_amount", "total"],
      Number((servicePrice + marketplaceFee + tipAmount).toFixed(2)),
    );

    if (!customerTotal || customerTotal <= 0) {
      return jsonError("Missing valid checkout total for this booking.", 400);
    }

    const guruBasePayout = Number((servicePrice - marketplaceFee).toFixed(2));
    const guruTotalPayout = Number((guruBasePayout + tipAmount).toFixed(2));
    const now = new Date().toISOString();

    const bookingPayload: Record<string, unknown> = {
      customer_id: user.id,
      user_id: user.id,
      pet_owner_id: user.id,
      pet_parent_id: user.id,

      guru_id: resolvedGuruId,
      guru_slug: guruSlug,
      guru_name: resolvedGuruName,
      guru_avatar_url: resolvedGuruAvatarUrl || null,
      guru_photo_url: resolvedGuruAvatarUrl || null,

      pet_id: resolvedPetId,
      pet_name: petName,
      pet_photo_url: resolvedPetPhotoUrl || null,

      customer_name: customerName,
      customer_email: customerEmail,

      service_type: serviceType,
      service_key: serviceKey || null,
      requested_date: requestedStartDate,
      booking_date: requestedStartDate,
      requested_start_date: requestedStartDate,
      requested_end_date: requestedEndDate,
      date_selection_mode: dateSelectionMode,
      date_range_label: dateRangeLabel,
      selected_dates: selectedDates.length > 0 ? selectedDates : [requestedStartDate, requestedEndDate].filter(Boolean),
      start_time: toIsoDate(requestedStartDate),
      time_window: timeWindow,
      visit_length: visitLength,

      notes: [
        notes,
        "",
        dateSelectionMode === "range"
          ? `Requested dates: ${dateRangeLabel}`
          : `Requested date: ${requestedStartDate}`,
        `Guru: ${resolvedGuruName}`,
        resolvedGuruAvatarUrl ? `Guru avatar URL: ${resolvedGuruAvatarUrl}` : "",
        resolvedPetPhotoUrl ? `Pet photo URL: ${resolvedPetPhotoUrl}` : "",
        `SitGuru marketplace fee estimate: ${marketplaceFeePercent}%`,
        `SitGuru marketplace fee amount: $${marketplaceFee.toFixed(2)}`,
        tipAmount > 0
          ? `Guru tip selected: $${tipAmount.toFixed(2)}. 100% of the tip goes directly to the Guru.`
          : "",
        `Estimated Guru payout: $${guruTotalPayout.toFixed(2)}`,
      ]
        .filter(Boolean)
        .join("\n"),

      subtotal_amount: servicePrice,
      service_price: servicePrice,
      booking_subtotal_amount: servicePrice,
      platform_fee: marketplaceFee,
      sitguru_fee_amount: marketplaceFee,
      marketplace_fee_amount: marketplaceFee,
      marketplace_fee_percent: marketplaceFeePercent,
      marketplace_fee_min_percent: MIN_MARKETPLACE_FEE_PERCENT,
      marketplace_fee_max_percent: MAX_MARKETPLACE_FEE_PERCENT,

      tip_amount: tipAmount,
      guru_tip_amount: tipAmount,
      tip_cents: Math.round(tipAmount * 100),

      guru_estimated_base_payout: guruBasePayout,
      guru_net_amount: guruBasePayout,
      guru_estimated_total_payout: guruTotalPayout,
      guru_payout_amount: guruTotalPayout,

      total: customerTotal,
      amount_total: customerTotal,
      total_amount: servicePrice,
      customer_total_amount: customerTotal,
      total_customer_paid: customerTotal,

      booking_type: getFirstText(body, ["bookingType", "booking_type"], "instant_booking"),

      compliance_accepted: body.complianceAccepted ?? body.compliance_accepted ?? true,
      compliance_accepted_at: now,

      terms_accepted: body.termsAccepted ?? body.terms_accepted ?? true,
      terms_accepted_at: now,

      status: "pending",
      payment_status: "unpaid",
      payout_status: "pending",

      created_at: now,
      updated_at: now,
    };

    const { data: booking, error: bookingError } =
      await insertBookingWithMissingColumnRetry(bookingPayload);

    if (bookingError || !booking) {
      return jsonError(
        getSupabaseErrorMessage(bookingError) || "Could not create the booking.",
        500,
        bookingError,
      );
    }

    const bookingId = String((booking as Record<string, unknown>).id || "");

    if (!bookingId) {
      return NextResponse.json({
        success: true,
        booking,
        bookingId: "",
        checkoutWarning:
          "Booking was created, but no booking ID was returned to start checkout.",
      });
    }

    await safeUpdateBooking(bookingId, {
      pet_id: resolvedPetId,
      pet_photo_url: resolvedPetPhotoUrl || null,
      guru_name: resolvedGuruName,
      guru_avatar_url: resolvedGuruAvatarUrl || null,
      guru_photo_url: resolvedGuruAvatarUrl || null,
      requested_start_date: requestedStartDate,
      requested_end_date: requestedEndDate,
      date_selection_mode: dateSelectionMode,
      date_range_label: dateRangeLabel,
      selected_dates: selectedDates.length > 0 ? selectedDates : [requestedStartDate, requestedEndDate].filter(Boolean),
      updated_at: new Date().toISOString(),
    });

    const checkoutResult = await createCheckoutForBooking({
      req,
      bookingId,
      checkoutPayload: {
        guru_id: resolvedGuruId,
        guru_name: resolvedGuruName,
        guru_avatar_url: resolvedGuruAvatarUrl || "",
        pet_id: resolvedPetId || "",
        pet_name: petName,
        pet_photo_url: resolvedPetPhotoUrl || "",
        requested_start_date: requestedStartDate,
        requested_end_date: requestedEndDate,
        requested_date: requestedStartDate,
        date_selection_mode: dateSelectionMode,
        date_range_label: dateRangeLabel,
        selected_dates: selectedDates.join(","),
        service_type: serviceType,
        service_key: serviceKey,
        subtotal_amount: servicePrice,
        service_price: servicePrice,
        marketplace_fee_amount: marketplaceFee,
        platform_fee: marketplaceFee,
        tip_amount: tipAmount,
        guru_payout_amount: guruTotalPayout,
        customer_total_amount: customerTotal,
        total: customerTotal,
      },
    });

    if (!checkoutResult.ok) {
      return NextResponse.json({
        success: true,
        booking,
        bookingId,
        checkoutWarning: checkoutResult.error,
        checkoutDetails: checkoutResult.data,
      });
    }

    const checkoutUrl =
      checkoutResult.data?.checkoutUrl || checkoutResult.data?.url || "";

    return NextResponse.json({
      success: true,
      booking,
      bookingId,
      checkoutUrl,
      checkout_url: checkoutUrl,
      url: checkoutUrl,
      stripeSessionId:
        checkoutResult.data?.stripeSessionId ||
        checkoutResult.data?.sessionId ||
        null,
      financialPreview: checkoutResult.data?.financialPreview || null,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Something went wrong while creating the booking.",
      500,
      error,
    );
  }
}
