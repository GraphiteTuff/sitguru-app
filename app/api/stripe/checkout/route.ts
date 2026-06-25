import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { calculateDistanceMiles } from "@/lib/distance/calculateDistanceMiles";

export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-03-25.dahlia",
});

/**
 * SitGuru marketplace fee rules
 *
 * Current behavior:
 * - Default marketplace fee starts at 15%.
 * - Locality rules can move the fee between 15% and 20%.
 * - Exact ZIP rules win before radius rules.
 * - Radius rules use booking care_latitude / care_longitude.
 * - Tips are not commissionable and pass through to the Guru.
 */
const DEFAULT_SITGURU_FEE_PERCENT = 15;
const MIN_SITGURU_FEE_PERCENT = 15;
const MAX_SITGURU_FEE_PERCENT = 20;

const TIP_PRESET_PERCENTAGES = [0, 10, 15, 20] as const;
const MAX_TIP_CENTS = 50_000;

// Stripe Tax code for general services.
// Confirm final tax category before live production launch.
const SITGURU_STRIPE_TAX_CODE = "txcd_20030000";

type BookingRow = Record<string, unknown>;

type LocalityFeeRuleRow = {
  id?: string;
  locality_name?: string | null;
  state?: string | null;
  city?: string | null;
  postal_code?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  radius_miles?: number | string | null;
  fee_percent?: number | string | null;
  is_active?: boolean | null;
  priority?: number | null;
};

type MarketplaceFeeResolution = {
  feePercent: number;
  feeSource: string;
  feeRuleId: string;
  feeRuleName: string;
  feeMatchType: string;
  feeDistanceMiles: number | null;
};

type CheckoutLineItem = {
  price_data: {
    currency: "usd";
    unit_amount: number;
    tax_behavior: "exclusive";
    product_data: {
      name: string;
      description: string;
      tax_code: string;
    };
  };
  quantity: number;
};

function normalizeUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function getBaseUrl(req: NextRequest) {
  const forwardedHost =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    req.nextUrl.host;

  const forwardedProto =
    req.headers.get("x-forwarded-proto") ||
    (forwardedHost.includes("localhost") || forwardedHost.includes("127.0.0.1")
      ? "http"
      : "https");

  const requestOrigin = normalizeUrl(`${forwardedProto}://${forwardedHost}`);

  const isLocalhost =
    forwardedHost.includes("localhost") || forwardedHost.includes("127.0.0.1");

  if (isLocalhost) {
    return requestOrigin;
  }

  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) {
    return normalizeUrl(envUrl);
  }

  return normalizeUrl(req.nextUrl.origin);
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function firstNonEmpty(...values: unknown[]) {
  for (const value of values) {
    const cleaned = asTrimmedString(value);
    if (cleaned) return cleaned;

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
}

function normalizeComparable(value: unknown) {
  return firstNonEmpty(value).toLowerCase();
}

function normalizePostalCode(value: unknown) {
  return firstNonEmpty(value).replace(/\s+/g, "").toLowerCase();
}

function toNullableNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

function clampMarketplaceFeePercent(value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_SITGURU_FEE_PERCENT;
  }

  return Math.min(
    MAX_SITGURU_FEE_PERCENT,
    Math.max(MIN_SITGURU_FEE_PERCENT, parsed),
  );
}

function toStripeAmount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value * 100);
  }

  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.round(parsed * 100);
  }

  return 2500;
}

function toTipCents(value: unknown, subtotalCents: number) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  const wholeCents = Math.round(parsed);
  const cappedBySubtotal = Math.max(subtotalCents, MAX_TIP_CENTS);

  return Math.min(wholeCents, cappedBySubtotal);
}

function getTipCentsFromBody(
  body: Record<string, unknown> | null,
  subtotalCents: number,
) {
  const directTipCents = toTipCents(
    body?.tipCents ?? body?.tip_cents,
    subtotalCents,
  );

  if (directTipCents > 0) {
    return directTipCents;
  }

  const customTipAmount = body?.tipAmount ?? body?.tip_amount;

  if (
    customTipAmount !== null &&
    customTipAmount !== undefined &&
    customTipAmount !== ""
  ) {
    return toStripeAmount(customTipAmount);
  }

  const requestedPercentage = Number(
    body?.tipPercent ?? body?.tip_percent ?? body?.tipPercentage,
  );

  if (
    Number.isFinite(requestedPercentage) &&
    TIP_PRESET_PERCENTAGES.includes(
      requestedPercentage as (typeof TIP_PRESET_PERCENTAGES)[number],
    )
  ) {
    return Math.round(subtotalCents * (requestedPercentage / 100));
  }

  return 0;
}

function centsToDollars(cents: number) {
  return Number((cents / 100).toFixed(2));
}

function getBookingOwnerId(booking: BookingRow) {
  const possibleOwnerFields = [
    "pet_owner_id",
    "customer_id",
    "user_id",
    "owner_id",
  ] as const;

  for (const field of possibleOwnerFields) {
    const value = booking[field];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function getBookingCustomerEmail(booking: BookingRow) {
  return firstNonEmpty(
    booking.customer_email,
    booking.email,
    booking.user_email,
    booking.owner_email,
  );
}

function getBookingCity(booking: BookingRow) {
  return firstNonEmpty(
    booking.care_city,
    booking.city,
    booking.service_city,
    booking.booking_city,
    booking.customer_city,
    booking.pet_city,
    booking.location_city,
  );
}

function getBookingState(booking: BookingRow) {
  return firstNonEmpty(
    booking.care_state,
    booking.state,
    booking.service_state,
    booking.booking_state,
    booking.customer_state,
    booking.pet_state,
    booking.location_state,
  );
}

function getBookingPostalCode(booking: BookingRow) {
  return firstNonEmpty(
    booking.care_zip_code,
    booking.postal_code,
    booking.zip_code,
    booking.zip,
    booking.service_postal_code,
    booking.service_zip_code,
    booking.booking_postal_code,
    booking.booking_zip_code,
    booking.customer_postal_code,
    booking.customer_zip_code,
    booking.pet_postal_code,
    booking.pet_zip_code,
  );
}

function getBookingLatitude(booking: BookingRow) {
  return toNullableNumber(
    booking.care_latitude ??
      booking.sit_latitude_at_booking ??
      booking.customer_latitude ??
      booking.latitude,
  );
}

function getBookingLongitude(booking: BookingRow) {
  return toNullableNumber(
    booking.care_longitude ??
      booking.sit_longitude_at_booking ??
      booking.customer_longitude ??
      booking.longitude,
  );
}

function getBookingLocalityName(booking: BookingRow) {
  return (
    firstNonEmpty(booking.care_locality_name, booking.locality_name) ||
    [getBookingCity(booking), getBookingState(booking)]
      .filter(Boolean)
      .join(", ")
  );
}

function getBookingDateValue(booking: BookingRow, ...keys: string[]) {
  for (const key of keys) {
    const value = firstNonEmpty(booking[key]);

    if (value) return value.slice(0, 10);
  }

  return "";
}

function getBookingDateRangeLabel(booking: BookingRow) {
  const existingLabel = firstNonEmpty(
    booking.date_range_label,
    booking.dateRangeLabel,
  );

  if (existingLabel) return existingLabel;

  const startDate = getBookingDateValue(
    booking,
    "requested_start_date",
    "requested_date",
    "booking_date",
    "date",
  );

  const endDate = getBookingDateValue(booking, "requested_end_date");

  if (!startDate) return "";
  if (!endDate || startDate === endDate) return startDate;

  return `${startDate} to ${endDate}`;
}

function getBookingSelectedDates(booking: BookingRow) {
  const selectedDates = booking.selected_dates ?? booking.selectedDates;

  if (Array.isArray(selectedDates)) {
    return selectedDates.map((value) => firstNonEmpty(value)).filter(Boolean);
  }

  const asString = firstNonEmpty(selectedDates);

  if (!asString) return [];

  try {
    const parsed = JSON.parse(asString);

    if (Array.isArray(parsed)) {
      return parsed.map((value) => firstNonEmpty(value)).filter(Boolean);
    }
  } catch {
    return asString
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return [];
}

function getBookingGuruName(booking: BookingRow) {
  return firstNonEmpty(
    booking.guru_name,
    booking.sitter_name,
    booking.provider_name,
    booking.guru_display_name,
    booking.guru_full_name,
  );
}

function getBookingGuruAvatarUrl(booking: BookingRow) {
  return firstNonEmpty(
    booking.guru_avatar_url,
    booking.guru_photo_url,
    booking.sitter_avatar_url,
    booking.sitter_photo_url,
    booking.provider_avatar_url,
    booking.provider_photo_url,
  );
}

function getBookingPetPhotoUrl(booking: BookingRow) {
  return firstNonEmpty(
    booking.pet_photo_url,
    booking.pet_avatar_url,
    booking.pet_image_url,
  );
}

function getPetPhotoUrl(pet: BookingRow | null) {
  if (!pet) return "";

  return firstNonEmpty(
    pet.photo_url,
    pet.pet_photo_url,
    pet.avatar_url,
    pet.profile_photo_url,
  );
}

async function fetchPetDetailsForBooking(booking: BookingRow, userId: string) {
  const petId = firstNonEmpty(
    booking.pet_id,
    booking.customer_pet_id,
    booking.primary_pet_id,
  );

  const petName = firstNonEmpty(booking.pet_name, booking.petName);

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

      if (!error && data) return data as BookingRow;
    }

    const { data, error } = await supabaseAdmin
      .from("pets")
      .select("*")
      .eq("id", petId)
      .limit(1)
      .maybeSingle();

    if (!error && data) return data as BookingRow;
  }

  if (!petName) return null;

  for (const ownerColumn of ownerColumns) {
    const { data, error } = await supabaseAdmin
      .from("pets")
      .select("*")
      .eq(ownerColumn, userId)
      .ilike("name", petName)
      .order("photo_url", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) return data as BookingRow;
  }

  return null;
}

function getGuruName(guru: BookingRow | null) {
  if (!guru) return "";

  return firstNonEmpty(
    guru.display_name,
    guru.full_name,
    guru.public_name,
    guru.business_name,
    guru.name,
    guru.first_name,
  );
}

function getGuruAvatarUrl(guru: BookingRow | null) {
  if (!guru) return "";

  return firstNonEmpty(
    guru.profile_photo_url,
    guru.photo_url,
    guru.avatar_url,
    guru.image_url,
    guru.headshot_url,
    guru.profile_image_url,
  );
}

async function fetchGuruDetailsForBooking(booking: BookingRow) {
  const guruId = firstNonEmpty(
    booking.guru_id,
    booking.sitter_id,
    booking.provider_id,
    booking.provider_profile_id,
  );

  if (!guruId) return null;

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

    if (!error && data) return data as BookingRow;
  }

  return null;
}

function firstRow<T>(value: T[] | null | undefined): T | null {
  return Array.isArray(value) && value.length > 0 ? value[0] : null;
}

async function fetchBookingById(bookingId: string) {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .limit(1);

  return {
    data: firstRow<BookingRow>(data as BookingRow[] | null | undefined),
    error,
  };
}

function isBookingFeeLocked(booking: BookingRow) {
  const existingFeePercent = firstNonEmpty(
    booking.marketplace_fee_percent,
    booking.sitguru_fee_percent,
    booking.platform_fee_percent,
  );

  if (!existingFeePercent) return false;

  const paymentStatus = normalizeComparable(booking.payment_status);
  const stripeSessionId = firstNonEmpty(
    booking.stripe_session_id,
    booking.stripe_checkout_session_id,
  );

  const feeSource = firstNonEmpty(
    booking.marketplace_fee_source,
    booking.sitguru_fee_source,
    booking.platform_fee_source,
  );

  const feeRuleId = firstNonEmpty(booking.marketplace_fee_rule_id);
  const feeRuleName = firstNonEmpty(booking.marketplace_fee_rule_name);

  return Boolean(
    stripeSessionId ||
      feeRuleId ||
      feeRuleName ||
      feeSource ||
      ["checkout_started", "paid", "succeeded", "complete", "completed"].includes(
        paymentStatus,
      ),
  );
}

function postalRuleMatches(rule: LocalityFeeRuleRow, booking: BookingRow) {
  const bookingPostalCode = normalizePostalCode(getBookingPostalCode(booking));
  const rulePostalCode = normalizePostalCode(rule.postal_code);

  return Boolean(
    rulePostalCode && bookingPostalCode && rulePostalCode === bookingPostalCode,
  );
}

function radiusRuleMatches(rule: LocalityFeeRuleRow, booking: BookingRow) {
  const bookingLatitude = getBookingLatitude(booking);
  const bookingLongitude = getBookingLongitude(booking);
  const ruleLatitude = toNullableNumber(rule.latitude);
  const ruleLongitude = toNullableNumber(rule.longitude);
  const radiusMiles = toNullableNumber(rule.radius_miles);

  if (
    bookingLatitude === null ||
    bookingLongitude === null ||
    ruleLatitude === null ||
    ruleLongitude === null ||
    radiusMiles === null ||
    radiusMiles <= 0
  ) {
    return {
      matches: false,
      distanceMiles: null,
    };
  }

  const distanceMiles = calculateDistanceMiles(
    bookingLatitude,
    bookingLongitude,
    ruleLatitude,
    ruleLongitude,
  );

  return {
    matches: distanceMiles <= radiusMiles,
    distanceMiles,
  };
}

function cityStateRuleMatches(rule: LocalityFeeRuleRow, booking: BookingRow) {
  const bookingCity = normalizeComparable(getBookingCity(booking));
  const bookingState = normalizeComparable(getBookingState(booking));
  const ruleCity = normalizeComparable(rule.city);
  const ruleState = normalizeComparable(rule.state);

  return Boolean(
    ruleCity &&
      ruleState &&
      bookingCity &&
      bookingState &&
      ruleCity === bookingCity &&
      ruleState === bookingState,
  );
}

function cityRuleMatches(rule: LocalityFeeRuleRow, booking: BookingRow) {
  const bookingCity = normalizeComparable(getBookingCity(booking));
  const ruleCity = normalizeComparable(rule.city);
  const ruleState = normalizeComparable(rule.state);
  const rulePostalCode = normalizePostalCode(rule.postal_code);
  const hasRadiusFields =
    toNullableNumber(rule.latitude) !== null ||
    toNullableNumber(rule.longitude) !== null ||
    toNullableNumber(rule.radius_miles) !== null;

  return Boolean(
    ruleCity &&
      !ruleState &&
      !rulePostalCode &&
      !hasRadiusFields &&
      bookingCity &&
      ruleCity === bookingCity,
  );
}

function stateRuleMatches(rule: LocalityFeeRuleRow, booking: BookingRow) {
  const bookingState = normalizeComparable(getBookingState(booking));
  const ruleState = normalizeComparable(rule.state);
  const ruleCity = normalizeComparable(rule.city);
  const rulePostalCode = normalizePostalCode(rule.postal_code);
  const hasRadiusFields =
    toNullableNumber(rule.latitude) !== null ||
    toNullableNumber(rule.longitude) !== null ||
    toNullableNumber(rule.radius_miles) !== null;

  return Boolean(
    ruleState &&
      !ruleCity &&
      !rulePostalCode &&
      !hasRadiusFields &&
      bookingState &&
      ruleState === bookingState,
  );
}

function defaultRuleMatches(rule: LocalityFeeRuleRow) {
  const hasNoPostalCode = !normalizePostalCode(rule.postal_code);
  const hasNoCity = !normalizeComparable(rule.city);
  const hasNoState = !normalizeComparable(rule.state);
  const hasNoLatitude = toNullableNumber(rule.latitude) === null;
  const hasNoLongitude = toNullableNumber(rule.longitude) === null;
  const hasNoRadius = toNullableNumber(rule.radius_miles) === null;

  return (
    hasNoPostalCode &&
    hasNoCity &&
    hasNoState &&
    hasNoLatitude &&
    hasNoLongitude &&
    hasNoRadius
  );
}

function buildRuleResolution({
  rule,
  matchType,
  distanceMiles = null,
}: {
  rule: LocalityFeeRuleRow;
  matchType: string;
  distanceMiles?: number | null;
}): MarketplaceFeeResolution {
  return {
    feePercent: clampMarketplaceFeePercent(rule.fee_percent),
    feeSource: `marketplace_fee_rules:${matchType}`,
    feeRuleId: asTrimmedString(rule.id),
    feeRuleName:
      asTrimmedString(rule.locality_name) ||
      "Local SitGuru marketplace fee",
    feeMatchType: matchType,
    feeDistanceMiles: distanceMiles,
  };
}

async function getMarketplaceFeePercentForBooking(
  booking: BookingRow,
): Promise<MarketplaceFeeResolution> {
  if (isBookingFeeLocked(booking)) {
    return {
      feePercent: clampMarketplaceFeePercent(
        firstNonEmpty(
          booking.marketplace_fee_percent,
          booking.sitguru_fee_percent,
          booking.platform_fee_percent,
        ),
      ),
      feeSource:
        firstNonEmpty(booking.marketplace_fee_source) || "locked_booking_fee",
      feeRuleId: firstNonEmpty(booking.marketplace_fee_rule_id),
      feeRuleName:
        firstNonEmpty(booking.marketplace_fee_rule_name) ||
        "Existing booking fee",
      feeMatchType: "locked_booking",
      feeDistanceMiles: toNullableNumber(booking.marketplace_fee_distance_miles),
    };
  }

  const { data, error } = await supabaseAdmin
    .from("marketplace_fee_rules")
    .select(
      "id, locality_name, state, city, postal_code, latitude, longitude, radius_miles, fee_percent, is_active, priority, created_at",
    )
    .eq("is_active", true)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    const message = error.message || "";

    if (
      message.includes("marketplace_fee_rules") ||
      message.includes("schema cache") ||
      message.includes("does not exist") ||
      message.includes("column")
    ) {
      return {
        feePercent: DEFAULT_SITGURU_FEE_PERCENT,
        feeSource: "default",
        feeRuleId: "",
        feeRuleName: "Default SitGuru marketplace fee",
        feeMatchType: "default",
        feeDistanceMiles: null,
      };
    }

    console.error("Marketplace fee rule lookup error:", error);

    return {
      feePercent: DEFAULT_SITGURU_FEE_PERCENT,
      feeSource: "default",
      feeRuleId: "",
      feeRuleName: "Default SitGuru marketplace fee",
      feeMatchType: "default",
      feeDistanceMiles: null,
    };
  }

  const rules = (data as LocalityFeeRuleRow[] | null | undefined) || [];

  const postalRule = rules.find((rule) => postalRuleMatches(rule, booking));

  if (postalRule) {
    return buildRuleResolution({
      rule: postalRule,
      matchType: "postal_code",
    });
  }

  for (const rule of rules) {
    const radiusMatch = radiusRuleMatches(rule, booking);

    if (radiusMatch.matches) {
      return buildRuleResolution({
        rule,
        matchType: "radius",
        distanceMiles: radiusMatch.distanceMiles,
      });
    }
  }

  const cityStateRule = rules.find((rule) =>
    cityStateRuleMatches(rule, booking),
  );

  if (cityStateRule) {
    return buildRuleResolution({
      rule: cityStateRule,
      matchType: "city_state",
    });
  }

  const cityRule = rules.find((rule) => cityRuleMatches(rule, booking));

  if (cityRule) {
    return buildRuleResolution({
      rule: cityRule,
      matchType: "city",
    });
  }

  const stateRule = rules.find((rule) => stateRuleMatches(rule, booking));

  if (stateRule) {
    return buildRuleResolution({
      rule: stateRule,
      matchType: "state",
    });
  }

  const defaultRule = rules.find(defaultRuleMatches);

  if (defaultRule) {
    return buildRuleResolution({
      rule: defaultRule,
      matchType: "default",
    });
  }

  return {
    feePercent: DEFAULT_SITGURU_FEE_PERCENT,
    feeSource: "default",
    feeRuleId: "",
    feeRuleName: "Default SitGuru marketplace fee",
    feeMatchType: "default",
    feeDistanceMiles: null,
  };
}

async function updateCheckoutStarted(
  bookingId: string,
  values: {
    stripeSessionId: string;
    subtotalAmount: number;
    sitguruFeeAmount: number;
    guruNetAmount: number;
    totalCustomerPaid: number;
    marketplaceFeePercent: number;
    marketplaceFeeSource: string;
    marketplaceFeeRuleId: string;
    marketplaceFeeRuleName: string;
    marketplaceFeeMatchType: string;
    marketplaceFeeDistanceMiles: number | null;
    tipAmount: number;
    guruPayoutAmount: number;
    guruName: string;
    guruAvatarUrl: string;
    petPhotoUrl: string;
    requestedStartDate: string;
    requestedEndDate: string;
    dateSelectionMode: string;
    dateRangeLabel: string;
    selectedDates: string[];
  },
) {
  const primaryUpdate = await supabaseAdmin
    .from("bookings")
    .update({
      payment_status: "checkout_started",
      stripe_session_id: values.stripeSessionId,
      stripe_checkout_session_id: values.stripeSessionId,
      currency: "usd",
      subtotal_amount: values.subtotalAmount,
      sitguru_fee_amount: values.sitguruFeeAmount,
      platform_fee: values.sitguruFeeAmount,
      marketplace_fee_amount: values.sitguruFeeAmount,
      marketplace_fee_percent: values.marketplaceFeePercent,
      marketplace_fee_source: values.marketplaceFeeSource,
      marketplace_fee_rule_id: values.marketplaceFeeRuleId || null,
      marketplace_fee_rule_name: values.marketplaceFeeRuleName,
      marketplace_fee_match_type: values.marketplaceFeeMatchType,
      marketplace_fee_distance_miles: values.marketplaceFeeDistanceMiles,
      guru_net_amount: values.guruNetAmount,
      guru_estimated_base_payout: values.guruNetAmount,
      guru_payout_amount: values.guruPayoutAmount,
      guru_estimated_total_payout: values.guruPayoutAmount,
      tip_amount: values.tipAmount,
      guru_tip_amount: values.tipAmount,
      total_customer_paid: values.totalCustomerPaid,
      customer_total_amount: values.totalCustomerPaid,
      amount_total: values.totalCustomerPaid,
      guru_name: values.guruName || null,
      guru_avatar_url: values.guruAvatarUrl || null,
      guru_photo_url: values.guruAvatarUrl || null,
      pet_photo_url: values.petPhotoUrl || null,
      requested_start_date: values.requestedStartDate || null,
      requested_end_date: values.requestedEndDate || null,
      date_selection_mode: values.dateSelectionMode || null,
      date_range_label: values.dateRangeLabel || null,
      selected_dates: values.selectedDates,
      tax_status: "stripe_automatic_tax_enabled",
      payout_status: "pending",
    })
    .eq("id", bookingId);

  if (!primaryUpdate.error) {
    return;
  }

  const message = primaryUpdate.error.message || "";

  if (
    message.includes("stripe_session_id") ||
    message.includes("stripe_checkout_session_id") ||
    message.includes("subtotal_amount") ||
    message.includes("sitguru_fee_amount") ||
    message.includes("platform_fee") ||
    message.includes("marketplace_fee_amount") ||
    message.includes("marketplace_fee_percent") ||
    message.includes("marketplace_fee_source") ||
    message.includes("marketplace_fee_rule_id") ||
    message.includes("marketplace_fee_rule_name") ||
    message.includes("marketplace_fee_match_type") ||
    message.includes("marketplace_fee_distance_miles") ||
    message.includes("guru_net_amount") ||
    message.includes("guru_estimated_base_payout") ||
    message.includes("guru_payout_amount") ||
    message.includes("guru_estimated_total_payout") ||
    message.includes("tip_amount") ||
    message.includes("guru_tip_amount") ||
    message.includes("total_customer_paid") ||
    message.includes("customer_total_amount") ||
    message.includes("amount_total") ||
    message.includes("guru_name") ||
    message.includes("guru_avatar_url") ||
    message.includes("guru_photo_url") ||
    message.includes("pet_photo_url") ||
    message.includes("requested_start_date") ||
    message.includes("requested_end_date") ||
    message.includes("date_selection_mode") ||
    message.includes("date_range_label") ||
    message.includes("selected_dates") ||
    message.includes("tax_status") ||
    message.includes("column") ||
    message.includes("schema cache")
  ) {
    const fallbackUpdate = await supabaseAdmin
      .from("bookings")
      .update({
        payment_status: "checkout_started",
      })
      .eq("id", bookingId);

    if (fallbackUpdate.error) {
      console.error(
        "Booking checkout fallback status update error:",
        fallbackUpdate.error,
      );
    }

    return;
  }

  console.error("Booking checkout status update error:", primaryUpdate.error);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    const bookingId = firstNonEmpty(body?.bookingId, body?.booking_id, body?.id);

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookingResult = await fetchBookingById(bookingId);
    const booking = bookingResult.data;

    if (bookingResult.error || !booking) {
      return NextResponse.json(
        { error: bookingResult.error?.message || "Booking not found" },
        { status: 404 },
      );
    }

    const ownerId = getBookingOwnerId(booking);
    const bookingCustomerEmail = getBookingCustomerEmail(booking);

    const hasOwnerMatch = ownerId ? ownerId === user.id : false;
    const hasEmailMatch =
      bookingCustomerEmail && user.email
        ? bookingCustomerEmail.toLowerCase() === user.email.toLowerCase()
        : false;

    if (ownerId && !hasOwnerMatch) {
      return NextResponse.json(
        { error: "You do not have access to this booking" },
        { status: 403 },
      );
    }

    if (!ownerId && bookingCustomerEmail && !hasEmailMatch) {
      return NextResponse.json(
        { error: "You do not have access to this booking" },
        { status: 403 },
      );
    }

    const baseUrl = getBaseUrl(req);

    const petName =
      asTrimmedString(booking.pet_name) ||
      asTrimmedString(booking.petName) ||
      "Pet Care";

    const serviceName =
      asTrimmedString(booking.service) ||
      asTrimmedString(booking.service_type) ||
      asTrimmedString(booking.service_name) ||
      asTrimmedString(booking.booking_type) ||
      "General care";

    const guruDetails = await fetchGuruDetailsForBooking(booking);
    const resolvedGuruName =
      getBookingGuruName(booking) || getGuruName(guruDetails) || "SitGuru";
    const resolvedGuruAvatarUrl =
      getBookingGuruAvatarUrl(booking) || getGuruAvatarUrl(guruDetails);
    const petDetails = await fetchPetDetailsForBooking(booking, user.id);
    const resolvedPetPhotoUrl =
      getBookingPetPhotoUrl(booking) || getPetPhotoUrl(petDetails);

    const requestedStartDate = getBookingDateValue(
      booking,
      "requested_start_date",
      "requested_date",
      "booking_date",
      "date",
    );

    const requestedEndDate =
      getBookingDateValue(booking, "requested_end_date") || requestedStartDate;

    const dateSelectionMode =
      firstNonEmpty(booking.date_selection_mode, booking.dateSelectionMode) ||
      (requestedEndDate && requestedEndDate !== requestedStartDate
        ? "range"
        : "single");

    const dateRangeLabel = getBookingDateRangeLabel(booking);
    const selectedDates = getBookingSelectedDates(booking);
    const normalizedSelectedDates =
      selectedDates.length > 0
        ? selectedDates
        : [requestedStartDate, requestedEndDate].filter(Boolean);

    const subtotalCents = toStripeAmount(
      booking.subtotal_amount ??
        booking.service_price ??
        booking.booking_subtotal_amount ??
        booking.total_amount ??
        booking.amount ??
        booking.price ??
        booking.hourly_rate ??
        25,
    );

    const {
      feePercent: sitguruFeePercent,
      feeSource: sitguruFeeSource,
      feeRuleId: sitguruFeeRuleId,
      feeRuleName: sitguruFeeRuleName,
      feeMatchType: sitguruFeeMatchType,
      feeDistanceMiles: sitguruFeeDistanceMiles,
    } = await getMarketplaceFeePercentForBooking(booking);

    const tipCents = getTipCentsFromBody(body, subtotalCents);
    const sitguruFeeCents = Math.round(
      subtotalCents * (sitguruFeePercent / 100),
    );
    const guruNetCents = subtotalCents - sitguruFeeCents;
    const guruPayoutCents = guruNetCents + tipCents;
    const totalCustomerPaidCents = subtotalCents + sitguruFeeCents + tipCents;

    const bookingIdString = String(booking.id);
    const bookingOwnerId = ownerId || user.id;

    const bookingCareCity = getBookingCity(booking);
    const bookingCareState = getBookingState(booking);
    const bookingCareZipCode = getBookingPostalCode(booking);
    const bookingCareLatitude = getBookingLatitude(booking);
    const bookingCareLongitude = getBookingLongitude(booking);
    const bookingCareLocalityName = getBookingLocalityName(booking);

    const checkoutLineItems: CheckoutLineItem[] = [
      {
        price_data: {
          currency: "usd",
          unit_amount: subtotalCents,
          tax_behavior: "exclusive",
          product_data: {
            name: `SitGuru Booking - ${petName}`,
            description: serviceName,
            tax_code: SITGURU_STRIPE_TAX_CODE,
          },
        },
        quantity: 1,
      },
    ];

    if (sitguruFeeCents > 0) {
      checkoutLineItems.push({
        price_data: {
          currency: "usd",
          unit_amount: sitguruFeeCents,
          tax_behavior: "exclusive",
          product_data: {
            name: "SitGuru Service Fee",
            description:
              "Marketplace support, secure payments, care tools, customer support, and safety-focused platform features.",
            tax_code: SITGURU_STRIPE_TAX_CODE,
          },
        },
        quantity: 1,
      });
    }

    if (tipCents > 0) {
      checkoutLineItems.push({
        price_data: {
          currency: "usd",
          unit_amount: tipCents,
          tax_behavior: "exclusive",
          product_data: {
            name: "Tip your Guru",
            description: "100% of your tip goes directly to your Guru.",
            tax_code: SITGURU_STRIPE_TAX_CODE,
          },
        },
        quantity: 1,
      });
    }

    const checkoutMetadata = {
      booking_id: bookingIdString,
      booking_owner_id: bookingOwnerId,
      guru_id: asTrimmedString(booking.guru_id),
      guru_name: resolvedGuruName,
      guru_avatar_url: resolvedGuruAvatarUrl,
      sitter_id: asTrimmedString(booking.sitter_id),
      provider_profile_id: asTrimmedString(booking.provider_profile_id),
      guru_slug: asTrimmedString(booking.guru_slug),
      pet_id: firstNonEmpty(booking.pet_id, petDetails?.id),
      pet_name: petName,
      pet_photo_url: resolvedPetPhotoUrl,
      service: serviceName,
      requested_start_date: requestedStartDate,
      requested_end_date: requestedEndDate,
      date_selection_mode: dateSelectionMode,
      date_range_label: dateRangeLabel,
      selected_dates: normalizedSelectedDates.join(","),
      care_zip_code: bookingCareZipCode,
      care_city: bookingCareCity,
      care_state: bookingCareState,
      care_locality_name: bookingCareLocalityName,
      care_latitude:
        bookingCareLatitude === null ? "" : String(bookingCareLatitude),
      care_longitude:
        bookingCareLongitude === null ? "" : String(bookingCareLongitude),
      subtotal_cents: String(subtotalCents),
      sitguru_fee_percent: String(sitguruFeePercent),
      sitguru_fee_source: sitguruFeeSource,
      sitguru_fee_rule_id: sitguruFeeRuleId,
      sitguru_fee_rule_name: sitguruFeeRuleName,
      marketplace_fee_percent: String(sitguruFeePercent),
      marketplace_fee_source: sitguruFeeSource,
      marketplace_fee_rule_id: sitguruFeeRuleId,
      marketplace_fee_rule_name: sitguruFeeRuleName,
      marketplace_fee_match_type: sitguruFeeMatchType,
      marketplace_fee_distance_miles:
        sitguruFeeDistanceMiles === null ? "" : String(sitguruFeeDistanceMiles),
      marketplace_fee_cents: String(sitguruFeeCents),
      sitguru_fee_cents: String(sitguruFeeCents),
      tip_cents: String(tipCents),
      guru_net_cents: String(guruNetCents),
      guru_payout_cents: String(guruPayoutCents),
      total_customer_paid_cents: String(totalCustomerPaidCents),
      tax_behavior: "exclusive",
      tax_code: SITGURU_STRIPE_TAX_CODE,
      customer_fee_message:
        "SitGuru keeps marketplace fees lower than many major care platforms.",
      tip_message: "100% of your tip goes directly to your Guru.",
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      /*
        Intentionally omit payment_method_types so Stripe Checkout can use
        SitGuru's Stripe Dashboard payment method settings and show eligible
        payment methods to Pet Parents. These methods are only for
        Pet Parent-to-SitGuru checkout; do not add or route any direct
        Pet Parent-to-Guru payment options here.
      */
      customer_email: user.email ?? undefined,

      automatic_tax: {
        enabled: true,
      },

      line_items: checkoutLineItems,

      payment_intent_data: {
        /*
          Do not add application_fee_amount here yet.

          Stripe only allows application_fee_amount for Connect direct charges
          or destination charges. SitGuru is currently creating a normal platform
          Checkout Session, so the SitGuru fee is tracked in Supabase and metadata
          for now.

          Later, when connected Guru Stripe accounts are wired, add:
          transfer_data: { destination: guruStripeAccountId }
          application_fee_amount: sitguruFeeCents

          Important:
          application_fee_amount should be calculated from the booking subtotal only.
          Tips are not commissionable and should pass through to the Guru.
        */
        metadata: checkoutMetadata,
      },

      success_url: `${baseUrl}/bookings/success?bookingId=${bookingIdString}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/bookings/cancel?bookingId=${bookingIdString}`,

      metadata: checkoutMetadata,
    });

    await updateCheckoutStarted(bookingIdString, {
      stripeSessionId: session.id,
      subtotalAmount: centsToDollars(subtotalCents),
      sitguruFeeAmount: centsToDollars(sitguruFeeCents),
      guruNetAmount: centsToDollars(guruNetCents),
      totalCustomerPaid: centsToDollars(totalCustomerPaidCents),
      marketplaceFeePercent: sitguruFeePercent,
      marketplaceFeeSource: sitguruFeeSource,
      marketplaceFeeRuleId: sitguruFeeRuleId,
      marketplaceFeeRuleName: sitguruFeeRuleName,
      marketplaceFeeMatchType: sitguruFeeMatchType,
      marketplaceFeeDistanceMiles: sitguruFeeDistanceMiles,
      tipAmount: centsToDollars(tipCents),
      guruPayoutAmount: centsToDollars(guruPayoutCents),
      guruName: resolvedGuruName,
      guruAvatarUrl: resolvedGuruAvatarUrl,
      petPhotoUrl: resolvedPetPhotoUrl,
      requestedStartDate,
      requestedEndDate,
      dateSelectionMode,
      dateRangeLabel,
      selectedDates: normalizedSelectedDates,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe session did not return a checkout URL" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      url: session.url,
      checkoutUrl: session.url,
      stripeSessionId: session.id,
      financialPreview: {
        subtotalAmount: centsToDollars(subtotalCents),
        marketplaceFeePercent: sitguruFeePercent,
        marketplaceFeeSource: sitguruFeeSource,
        marketplaceFeeRuleId: sitguruFeeRuleId,
        marketplaceFeeRuleName: sitguruFeeRuleName,
        marketplaceFeeMatchType: sitguruFeeMatchType,
        marketplaceFeeDistanceMiles: sitguruFeeDistanceMiles,
        sitguruFeeAmount: centsToDollars(sitguruFeeCents),
        marketplaceFeeAmount: centsToDollars(sitguruFeeCents),
        tipAmount: centsToDollars(tipCents),
        guruNetAmount: centsToDollars(guruNetCents),
        guruPayoutAmount: centsToDollars(guruPayoutCents),
        taxAmount: 0,
        totalCustomerPaid: centsToDollars(totalCustomerPaidCents),
        careZipCode: bookingCareZipCode,
        careCity: bookingCareCity,
        careState: bookingCareState,
        careLocalityName: bookingCareLocalityName,
        customerFeeMessage:
          "SitGuru keeps marketplace fees lower than many major care platforms.",
        tipMessage: "100% of your tip goes directly to your Guru.",
      },
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          error: error.message || "Stripe checkout failed",
          type: error.type || "StripeError",
          code: "code" in error ? error.code ?? null : null,
          statusCode: error.statusCode ?? null,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Checkout failed",
      },
      { status: 500 },
    );
  }
}
