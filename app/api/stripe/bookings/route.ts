import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { calculateDistanceMiles } from "@/lib/distance/calculateDistanceMiles";

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

type ZipLookupLocation = {
  zip: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
};

type GuruServiceRadiusCheck = {
  eligible: boolean;
  distanceMiles: number | null;
  guruLatitude: number | null;
  guruLongitude: number | null;
  guruRadiusMiles: number | null;
  customerLatitude: number | null;
  customerLongitude: number | null;
  reason: string;
};

const DEFAULT_MARKETPLACE_FEE_PERCENT = 0;
const MIN_MARKETPLACE_FEE_PERCENT = 0;
const MAX_MARKETPLACE_FEE_PERCENT = 0;

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

function toNullableNumber(value: unknown) {
  const parsed = toSafeNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function toSafeCents(value: unknown, fallback = 0) {
  const parsed = toSafeNumber(value, fallback);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return Math.round(parsed);
}

function clampMarketplaceFeePercent(_value?: unknown) {
  return 0;
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
  const forwardedHost =
    req.headers.get("x-forwarded-host") || req.headers.get("host");

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return req.nextUrl.origin;
}

function getBodyNumber(
  body: Record<string, unknown>,
  keys: string[],
  fallback = 0,
) {
  for (const key of keys) {
    const value = body[key];
    const parsed = toSafeNumber(value, Number.NaN);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function getBodyNullableNumber(body: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const parsed = toNullableNumber(body[key]);

    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

function getBodyString(
  body: Record<string, unknown>,
  keys: string[],
  fallback = "",
) {
  for (const key of keys) {
    const value = toCleanString(body[key]);

    if (value) return value;
  }

  return fallback;
}

function getBodyStringArray(body: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = body[key];

    if (Array.isArray(value)) {
      return value.map((item) => toCleanString(item)).filter(Boolean);
    }

    if (typeof value === "string" && value.trim()) {
      const trimmed = value.trim();

      try {
        const parsed = JSON.parse(trimmed);

        if (Array.isArray(parsed)) {
          return parsed.map((item) => toCleanString(item)).filter(Boolean);
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

function getCheckoutSafeMetadata(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.slice(0, 480);
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).slice(0, 480);
  }

  try {
    return JSON.stringify(value).slice(0, 480);
  } catch {
    return "";
  }
}

function getGuruName(guru: Record<string, unknown>, fallback = "SitGuru") {
  return (
    getBodyString(guru, [
      "display_name",
      "full_name",
      "public_name",
      "business_name",
      "name",
      "first_name",
    ]) || fallback
  );
}

function getGuruAvatarUrl(guru: Record<string, unknown>) {
  return getBodyString(guru, [
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

  return getBodyString(pet, [
    "photo_url",
    "pet_photo_url",
    "avatar_url",
    "profile_photo_url",
  ]);
}

function cleanZip(value?: string | null) {
  return String(value || "").replace(/\D/g, "").slice(0, 5);
}

function getGuruLatitude(guru: Record<string, unknown>) {
  return toNullableNumber(
    guru.service_latitude ?? guru.latitude ?? guru.lat ?? null,
  );
}

function getGuruLongitude(guru: Record<string, unknown>) {
  return toNullableNumber(
    guru.service_longitude ?? guru.longitude ?? guru.lng ?? null,
  );
}

function getGuruRadiusMiles(guru: Record<string, unknown>) {
  const parsed = toNullableNumber(
    guru.service_radius_miles ?? guru.service_radius ?? guru.radius_miles ?? null,
  );

  if (parsed === null || parsed <= 0) return 25;

  return parsed;
}

function isGuruServiceAreaDisabled(guru: Record<string, unknown>) {
  return guru.service_area_enabled === false;
}

async function lookupZipLocation(zip: string): Promise<ZipLookupLocation | null> {
  const clean = cleanZip(zip);

  if (clean.length !== 5) return null;

  try {
    const response = await fetch(`https://api.zippopotam.us/us/${clean}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 60 * 60 * 24 * 30,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const place = data?.places?.[0];

    const latitude = toNullableNumber(place?.latitude);
    const longitude = toNullableNumber(place?.longitude);

    if (latitude === null || longitude === null) return null;

    return {
      zip: clean,
      city: String(place?.["place name"] || ""),
      state: String(place?.["state abbreviation"] || ""),
      latitude,
      longitude,
    };
  } catch {
    return null;
  }
}

async function resolveCustomerCareLocation({
  body,
  careZipCode,
}: {
  body: Record<string, unknown>;
  careZipCode: string;
}) {
  const bodyLatitude = getBodyNullableNumber(body, [
    "care_latitude",
    "careLatitude",
    "sit_latitude",
    "sitLatitude",
    "customer_latitude",
    "customerLatitude",
  ]);

  const bodyLongitude = getBodyNullableNumber(body, [
    "care_longitude",
    "careLongitude",
    "sit_longitude",
    "sitLongitude",
    "customer_longitude",
    "customerLongitude",
  ]);

  if (bodyLatitude !== null && bodyLongitude !== null) {
    return {
      latitude: bodyLatitude,
      longitude: bodyLongitude,
      source: "booking_payload",
    };
  }

  const zipLocation = await lookupZipLocation(careZipCode);

  if (!zipLocation) {
    return {
      latitude: null,
      longitude: null,
      source: "missing",
    };
  }

  return {
    latitude: zipLocation.latitude,
    longitude: zipLocation.longitude,
    source: "zip_lookup",
  };
}

function checkGuruServiceRadius({
  guru,
  customerLatitude,
  customerLongitude,
}: {
  guru: Record<string, unknown>;
  customerLatitude: number | null;
  customerLongitude: number | null;
}): GuruServiceRadiusCheck {
  if (isGuruServiceAreaDisabled(guru)) {
    return {
      eligible: true,
      distanceMiles: null,
      guruLatitude: null,
      guruLongitude: null,
      guruRadiusMiles: getGuruRadiusMiles(guru),
      customerLatitude,
      customerLongitude,
      reason: "Service area filtering is disabled for this Guru.",
    };
  }

  const guruLatitude = getGuruLatitude(guru);
  const guruLongitude = getGuruLongitude(guru);
  const guruRadiusMiles = getGuruRadiusMiles(guru);

  if (customerLatitude === null || customerLongitude === null) {
    return {
      eligible: false,
      distanceMiles: null,
      guruLatitude,
      guruLongitude,
      guruRadiusMiles,
      customerLatitude,
      customerLongitude,
      reason: "Customer care location could not be verified.",
    };
  }

  if (guruLatitude === null || guruLongitude === null) {
    return {
      eligible: false,
      distanceMiles: null,
      guruLatitude,
      guruLongitude,
      guruRadiusMiles,
      customerLatitude,
      customerLongitude,
      reason: "Guru service location is missing map coordinates.",
    };
  }

  const distanceMiles = calculateDistanceMiles(
    customerLatitude,
    customerLongitude,
    guruLatitude,
    guruLongitude,
  );

  const eligible = distanceMiles <= guruRadiusMiles;

  return {
    eligible,
    distanceMiles,
    guruLatitude,
    guruLongitude,
    guruRadiusMiles,
    customerLatitude,
    customerLongitude,
    reason: eligible
      ? "Customer care location is within the Guru service radius."
      : "Customer care location is outside the Guru service radius.",
  };
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

  console.warn(
    "Booking insert used fallback payload because some enhanced columns are missing:",
    {
      error: richInsert.error,
    },
  );

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
  checkoutMetadata = {},
}: {
  req: NextRequest;
  bookingId: string;
  tipCents: number;
  tipAmount: number;
  tipChoice: string;
  checkoutMetadata?: Record<string, unknown>;
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
      ...checkoutMetadata,
      metadata: {
        booking_id: bookingId,
        tip_choice: tipChoice,
        tip_amount: getCheckoutSafeMetadata(tipAmount),
        ...Object.fromEntries(
          Object.entries(checkoutMetadata).map(([key, value]) => [
            key,
            getCheckoutSafeMetadata(value),
          ]),
        ),
      },
    }),
    cache: "no-store",
  });

  const responseText = await response.text();

  let data: CheckoutRouteResponse | null = null;

  try {
    data = responseText
      ? (JSON.parse(responseText) as CheckoutRouteResponse)
      : null;
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
    const dateSelectionMode = normalizeDateSelectionMode(
      getBodyString(
        body,
        ["date_selection_mode", "dateSelectionMode"],
        "single",
      ),
    );
    const requestedStartDate = getBodyString(body, [
      "requested_start_date",
      "requestedStartDate",
      "date",
      "booking_date",
      "requested_date",
      "requestedDate",
    ]);
    const requestedEndDate =
      dateSelectionMode === "range"
        ? getBodyString(
            body,
            ["requested_end_date", "requestedEndDate"],
            requestedStartDate,
          )
        : requestedStartDate;
    const selectedDates = getBodyStringArray(body, [
      "selected_dates",
      "selectedDates",
    ]);
    const dateRangeLabel = getDateRangeLabel({
      mode: dateSelectionMode,
      startDate: requestedStartDate,
      endDate: requestedEndDate,
      fallback: getBodyString(body, ["date_range_label", "dateRangeLabel"]),
    });
    const date = requestedStartDate;
    const notes = toCleanString(body.notes);

    const serviceType =
      getBodyString(body, ["service_type", "serviceType"]) || "Pet Care";

    const serviceKey = getBodyString(body, ["service_key", "serviceKey"]);

    const timeWindow =
      getBodyString(body, ["time_window", "timeWindow"]) || null;

    const visitLength =
      getBodyString(body, ["visit_length", "visitLength"]) || null;

    const bookingType =
      getBodyString(body, ["booking_type", "bookingType"]) ||
      "instant_booking";

    const careZipCode = getBodyString(body, ["care_zip_code", "careZipCode"]);
    const careCity = getBodyString(body, ["care_city", "careCity"]);
    const careState = getBodyString(body, ["care_state", "careState"]);
    const careLocalityName =
      getBodyString(body, ["care_locality_name", "careLocalityName"]) ||
      [careCity, careState].filter(Boolean).join(", ");

    const selectedPetId = getBodyString(body, ["pet_id", "petId"]) || null;

    const matchedPet = await fetchPetForBooking({
      userId: user.id,
      petId: selectedPetId,
      petName,
    });

    const resolvedPetId =
      selectedPetId || (matchedPet?.id ? String(matchedPet.id) : "") || null;

    const selectedPetPhotoUrl =
      getBodyString(body, [
        "pet_photo_url",
        "petPhotoUrl",
        "pet_avatar_url",
        "petAvatarUrl",
        "pet_image_url",
        "petImageUrl",
      ]) || getPetPhotoUrl(matchedPet);

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
      return jsonError("Requested start date is required.", 400, {
        receivedBodyKeys: Object.keys(body),
      });
    }

    if (dateSelectionMode === "range" && !requestedEndDate) {
      return jsonError(
        "Requested end date is required for date range bookings.",
        400,
        {
          receivedBodyKeys: Object.keys(body),
        },
      );
    }

    if (!careZipCode) {
      return jsonError("Care ZIP code is required before checkout.", 400, {
        receivedBodyKeys: Object.keys(body),
      });
    }

    const { data: guru, error: guruError } = await supabaseAdmin
      .from("gurus")
      .select("*")
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

    const customerCareLocation = await resolveCustomerCareLocation({
      body,
      careZipCode,
    });

    const serviceRadiusCheck = checkGuruServiceRadius({
      guru: guru as Record<string, unknown>,
      customerLatitude: customerCareLocation.latitude,
      customerLongitude: customerCareLocation.longitude,
    });

    if (!serviceRadiusCheck.eligible) {
      console.warn("Booking blocked by Guru service radius:", {
        guruId,
        careZipCode,
        careCity,
        careState,
        careLocalityName,
        serviceRadiusCheck,
      });

      return jsonError(
        "This Guru does not currently serve your sit location. Please choose another Guru available in your area.",
        400,
        {
          reason: serviceRadiusCheck.reason,
          distance_miles: serviceRadiusCheck.distanceMiles,
          service_radius_miles: serviceRadiusCheck.guruRadiusMiles,
          care_zip_code: careZipCode,
          care_city: careCity,
          care_state: careState,
          care_locality_name: careLocalityName,
        },
      );
    }

    const resolvedGuruId =
      typeof guru.profile_id === "string" && guru.profile_id.trim()
        ? guru.profile_id
        : typeof guru.id === "string" && guru.id.trim()
          ? guru.id
          : guruId;

    const resolvedGuruName =
      getBodyString(body, [
        "guru_name",
        "guruName",
        "sitter_name",
        "provider_name",
      ]) || getGuruName(guru as Record<string, unknown>, "SitGuru");

    const resolvedGuruAvatarUrl =
      getBodyString(body, [
        "guru_avatar_url",
        "guruAvatarUrl",
        "guru_photo_url",
        "guruPhotoUrl",
        "sitter_avatar_url",
        "sitter_photo_url",
        "provider_avatar_url",
        "provider_photo_url",
      ]) || getGuruAvatarUrl(guru as Record<string, unknown>);

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
      0,
    );

    const tipAmount = getBodyNumber(
      body,
      ["tip_amount", "tipAmount", "guru_tip_amount", "guruTipAmount"],
      0,
    );

    const tipCents =
      toSafeCents(body.tip_cents ?? body.tipCents) ||
      Math.round(tipAmount * 100);

    const tipChoice = getBodyString(body, ["tip_choice", "tipChoice"], "none");

    const guruEstimatedBasePayout = getBodyNumber(
      body,
      ["guru_estimated_base_payout", "guruEstimatedBasePayout"],
      Number(subtotalAmount.toFixed(2)),
    );

    const guruEstimatedTotalPayout = getBodyNumber(
      body,
      ["guru_estimated_total_payout", "guruEstimatedTotalPayout"],
      Number((guruEstimatedBasePayout + tipAmount).toFixed(2)),
    );

    const customerTotalAmount = getBodyNumber(
      body,
      [
        "customer_total_amount",
        "customerTotalAmount",
        "amount_total",
        "total_amount",
        "total",
      ],
      Number((subtotalAmount + tipAmount).toFixed(2)),
    );

    const now = new Date().toISOString();

    const richBookingInsertPayload: BookingInsertPayload = {
      pet_owner_id: user.id,
      customer_id: user.id,
      user_id: user.id,

      guru_id: resolvedGuruId,
      guru_name: resolvedGuruName,
      guru_avatar_url: resolvedGuruAvatarUrl || null,
      guru_photo_url: resolvedGuruAvatarUrl || null,
      pet_id: resolvedPetId,
      pet_photo_url: selectedPetPhotoUrl || null,

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
      care_locality_name: careLocalityName || null,
      care_latitude: serviceRadiusCheck.customerLatitude,
      care_longitude: serviceRadiusCheck.customerLongitude,

      guru_service_radius_miles_at_booking: serviceRadiusCheck.guruRadiusMiles,
      guru_service_latitude_at_booking: serviceRadiusCheck.guruLatitude,
      guru_service_longitude_at_booking: serviceRadiusCheck.guruLongitude,
      sit_latitude_at_booking: serviceRadiusCheck.customerLatitude,
      sit_longitude_at_booking: serviceRadiusCheck.customerLongitude,
      calculated_distance_miles: serviceRadiusCheck.distanceMiles,
      service_radius_eligible: serviceRadiusCheck.eligible,
      eligibility_checked_at: now,

      booking_date: date,
      requested_date: date,
      requested_start_date: requestedStartDate,
      requested_end_date: requestedEndDate,
      date_selection_mode: dateSelectionMode,
      date_range_label: dateRangeLabel,
      selected_dates:
        selectedDates.length > 0
          ? selectedDates
          : [requestedStartDate, requestedEndDate].filter(Boolean),
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
        `Guru name: ${resolvedGuruName}`,
        resolvedGuruAvatarUrl
          ? `Guru avatar URL: ${resolvedGuruAvatarUrl}`
          : "",
        resolvedPetId ? `Pet ID: ${resolvedPetId}` : "",
        selectedPetPhotoUrl ? `Pet photo URL: ${selectedPetPhotoUrl}` : "",
        dateSelectionMode === "range"
          ? `Requested dates: ${dateRangeLabel}`
          : `Requested date: ${requestedStartDate}`,
        dateSelectionMode === "range" && selectedDates.length > 0
          ? `Selected care dates: ${selectedDates.join(", ")}`
          : "",
        `Date selection mode: ${dateSelectionMode}`,
        "",
        `Care location: ${[careCity, careState, careZipCode]
          .filter(Boolean)
          .join(" ")}`,
        careLocalityName ? `Care locality: ${careLocalityName}` : "",
        `Care latitude: ${serviceRadiusCheck.customerLatitude ?? "not saved"}`,
        `Care longitude: ${serviceRadiusCheck.customerLongitude ?? "not saved"}`,
        `Geo source: ${customerCareLocation.source}`,
        `Guru service radius at booking: ${
          serviceRadiusCheck.guruRadiusMiles ?? "not saved"
        } miles`,
        `Calculated distance: ${
          serviceRadiusCheck.distanceMiles ?? "not calculated"
        } miles`,
        `Service radius eligible: ${serviceRadiusCheck.eligible ? "Yes" : "No"}`,
        `Eligibility checked at: ${now}`,
        "",
        "Internal SitGuru marketplace fee tracking amount: $0",
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
      checkoutMetadata: {
        guru_id: resolvedGuruId,
        guru_name: resolvedGuruName,
        guru_avatar_url: resolvedGuruAvatarUrl || "",
        pet_id: resolvedPetId || "",
        pet_name: petName,
        pet_photo_url: selectedPetPhotoUrl || "",
        requested_start_date: requestedStartDate,
        requested_end_date: requestedEndDate,
        requested_date: requestedStartDate,
        date_selection_mode: dateSelectionMode,
        date_range_label: dateRangeLabel,
        selected_dates: selectedDates.join(","),
        service_type: serviceType,
        service_key: serviceKey,
        customer_total_amount: customerTotalAmount,
        marketplace_fee_amount: marketplaceFeeAmount,
        marketplace_fee_percent: marketplaceFeePercent,
        tip_amount: tipAmount,
        guru_payout_amount: guruEstimatedTotalPayout,
        care_zip_code: careZipCode,
        care_city: careCity,
        care_state: careState,
        care_locality_name: careLocalityName,
        care_latitude: serviceRadiusCheck.customerLatitude ?? "",
        care_longitude: serviceRadiusCheck.customerLongitude ?? "",
        care_geo_source: customerCareLocation.source,
        calculated_distance_miles: serviceRadiusCheck.distanceMiles ?? "",
        guru_service_radius_miles: serviceRadiusCheck.guruRadiusMiles ?? "",
        service_radius_eligible: serviceRadiusCheck.eligible,
      },
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