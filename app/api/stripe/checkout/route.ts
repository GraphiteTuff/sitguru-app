import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

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
 * Old behavior:
 * - Hardcoded 8% fee.
 *
 * New behavior:
 * - Default marketplace fee starts at 15%.
 * - Locality rules can move the fee between 15% and 20%.
 * - Tips are not commissionable and should pass through to the Guru.
 */
const DEFAULT_SITGURU_FEE_PERCENT = 15;
const MIN_SITGURU_FEE_PERCENT = 15;
const MAX_SITGURU_FEE_PERCENT = 20;

const TIP_PRESET_PERCENTAGES = [0, 10, 15, 20] as const;
const MAX_TIP_CENTS = 50_000;

// Stripe Tax code for general services.
// This keeps Stripe automatic tax from failing during checkout.
// Confirm final tax category before live production launch.
const SITGURU_STRIPE_TAX_CODE = "txcd_20030000";

type BookingRow = Record<string, unknown>;

type LocalityFeeRuleRow = {
  id?: string;
  locality_name?: string | null;
  state?: string | null;
  city?: string | null;
  postal_code?: string | null;
  fee_percent?: number | string | null;
  is_active?: boolean | null;
  priority?: number | null;
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
  }

  return "";
}

function normalizeComparable(value: unknown) {
  return asTrimmedString(value).toLowerCase();
}

function normalizePostalCode(value: unknown) {
  return asTrimmedString(value).replace(/\s+/g, "").toLowerCase();
}

function clampMarketplaceFeePercent(value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_SITGURU_FEE_PERCENT;
  }

  return Math.min(
    MAX_SITGURU_FEE_PERCENT,
    Math.max(MIN_SITGURU_FEE_PERCENT, parsed)
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
  subtotalCents: number
) {
  const directTipCents = toTipCents(
    body?.tipCents ?? body?.tip_cents,
    subtotalCents
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
    body?.tipPercent ?? body?.tip_percent ?? body?.tipPercentage
  );

  if (
    Number.isFinite(requestedPercentage) &&
    TIP_PRESET_PERCENTAGES.includes(
      requestedPercentage as (typeof TIP_PRESET_PERCENTAGES)[number]
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
    booking.owner_email
  );
}

function getBookingCity(booking: BookingRow) {
  return firstNonEmpty(
    booking.city,
    booking.service_city,
    booking.booking_city,
    booking.customer_city,
    booking.pet_city,
    booking.location_city
  );
}

function getBookingState(booking: BookingRow) {
  return firstNonEmpty(
    booking.state,
    booking.service_state,
    booking.booking_state,
    booking.customer_state,
    booking.pet_state,
    booking.location_state
  );
}

function getBookingPostalCode(booking: BookingRow) {
  return firstNonEmpty(
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
    booking.pet_zip_code
  );
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

function ruleMatchesBooking(rule: LocalityFeeRuleRow, booking: BookingRow) {
  const bookingCity = normalizeComparable(getBookingCity(booking));
  const bookingState = normalizeComparable(getBookingState(booking));
  const bookingPostalCode = normalizePostalCode(getBookingPostalCode(booking));

  const ruleCity = normalizeComparable(rule.city);
  const ruleState = normalizeComparable(rule.state);
  const rulePostalCode = normalizePostalCode(rule.postal_code);

  if (
    rulePostalCode &&
    bookingPostalCode &&
    rulePostalCode === bookingPostalCode
  ) {
    return true;
  }

  if (ruleCity && ruleState && bookingCity && bookingState) {
    return ruleCity === bookingCity && ruleState === bookingState;
  }

  if (ruleCity && bookingCity) {
    return ruleCity === bookingCity;
  }

  if (ruleState && bookingState) {
    return ruleState === bookingState;
  }

  const hasNoSpecificLocality = !rulePostalCode && !ruleCity && !ruleState;
  return hasNoSpecificLocality;
}

async function getMarketplaceFeePercentForBooking(booking: BookingRow) {
  const existingFeePercent = firstNonEmpty(
    booking.marketplace_fee_percent,
    booking.sitguru_fee_percent,
    booking.platform_fee_percent
  );

  if (existingFeePercent) {
    return {
      feePercent: clampMarketplaceFeePercent(existingFeePercent),
      feeSource: "booking",
      feeRuleId: "",
      feeRuleName: "Existing booking fee",
    };
  }

  const { data, error } = await supabaseAdmin
    .from("marketplace_fee_rules")
    .select(
      "id, locality_name, state, city, postal_code, fee_percent, is_active, priority"
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
      };
    }

    console.error("Marketplace fee rule lookup error:", error);

    return {
      feePercent: DEFAULT_SITGURU_FEE_PERCENT,
      feeSource: "default",
      feeRuleId: "",
      feeRuleName: "Default SitGuru marketplace fee",
    };
  }

  const matchingRule = (data as LocalityFeeRuleRow[] | null | undefined)?.find(
    (rule) => ruleMatchesBooking(rule, booking)
  );

  if (!matchingRule) {
    return {
      feePercent: DEFAULT_SITGURU_FEE_PERCENT,
      feeSource: "default",
      feeRuleId: "",
      feeRuleName: "Default SitGuru marketplace fee",
    };
  }

  return {
    feePercent: clampMarketplaceFeePercent(matchingRule.fee_percent),
    feeSource: "marketplace_fee_rules",
    feeRuleId: asTrimmedString(matchingRule.id),
    feeRuleName:
      asTrimmedString(matchingRule.locality_name) ||
      "Local SitGuru marketplace fee",
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
    tipAmount: number;
    guruPayoutAmount: number;
  }
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
      marketplace_fee_amount: values.sitguruFeeAmount,
      marketplace_fee_percent: values.marketplaceFeePercent,
      marketplace_fee_source: values.marketplaceFeeSource,
      marketplace_fee_rule_id: values.marketplaceFeeRuleId || null,
      marketplace_fee_rule_name: values.marketplaceFeeRuleName,
      guru_net_amount: values.guruNetAmount,
      guru_payout_amount: values.guruPayoutAmount,
      tip_amount: values.tipAmount,
      total_customer_paid: values.totalCustomerPaid,
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
    message.includes("marketplace_fee_amount") ||
    message.includes("marketplace_fee_percent") ||
    message.includes("marketplace_fee_source") ||
    message.includes("marketplace_fee_rule_id") ||
    message.includes("marketplace_fee_rule_name") ||
    message.includes("guru_net_amount") ||
    message.includes("guru_payout_amount") ||
    message.includes("tip_amount") ||
    message.includes("total_customer_paid") ||
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
        fallbackUpdate.error
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
        { status: 404 }
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
        { status: 403 }
      );
    }

    if (!ownerId && bookingCustomerEmail && !hasEmailMatch) {
      return NextResponse.json(
        { error: "You do not have access to this booking" },
        { status: 403 }
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

    const subtotalCents = toStripeAmount(
      booking.total_amount ??
        booking.amount ??
        booking.price ??
        booking.hourly_rate ??
        25
    );

    const {
      feePercent: sitguruFeePercent,
      feeSource: sitguruFeeSource,
      feeRuleId: sitguruFeeRuleId,
      feeRuleName: sitguruFeeRuleName,
    } = await getMarketplaceFeePercentForBooking(booking);

    const tipCents = getTipCentsFromBody(body, subtotalCents);
    const sitguruFeeCents = Math.round(
      subtotalCents * (sitguruFeePercent / 100)
    );
    const guruNetCents = subtotalCents - sitguruFeeCents;
    const guruPayoutCents = guruNetCents + tipCents;
    const totalCustomerPaidCents = subtotalCents + tipCents;

    const bookingIdString = String(booking.id);
    const bookingOwnerId = ownerId || user.id;

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
      sitter_id: asTrimmedString(booking.sitter_id),
      provider_profile_id: asTrimmedString(booking.provider_profile_id),
      guru_slug: asTrimmedString(booking.guru_slug),
      pet_id: asTrimmedString(booking.pet_id),
      pet_name: petName,
      service: serviceName,
      subtotal_cents: String(subtotalCents),
      sitguru_fee_percent: String(sitguruFeePercent),
      sitguru_fee_source: sitguruFeeSource,
      sitguru_fee_rule_id: sitguruFeeRuleId,
      sitguru_fee_rule_name: sitguruFeeRuleName,
      marketplace_fee_percent: String(sitguruFeePercent),
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
      payment_method_types: ["card"],
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
          for now. Later, when connected Guru Stripe accounts are wired, add:
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
      tipAmount: centsToDollars(tipCents),
      guruPayoutAmount: centsToDollars(guruPayoutCents),
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe session did not return a checkout URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: session.url,
      financialPreview: {
        subtotalAmount: centsToDollars(subtotalCents),
        marketplaceFeePercent: sitguruFeePercent,
        marketplaceFeeSource: sitguruFeeSource,
        marketplaceFeeRuleName: sitguruFeeRuleName,
        sitguruFeeAmount: centsToDollars(sitguruFeeCents),
        marketplaceFeeAmount: centsToDollars(sitguruFeeCents),
        tipAmount: centsToDollars(tipCents),
        guruNetAmount: centsToDollars(guruNetCents),
        guruPayoutAmount: centsToDollars(guruPayoutCents),
        taxAmount: 0,
        totalCustomerPaid: centsToDollars(totalCustomerPaidCents),
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
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Checkout failed",
      },
      { status: 500 }
    );
  }
}