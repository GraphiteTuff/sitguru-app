import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STRIPE_API_VERSION = "2026-03-25.dahlia";

let stripeClient: Stripe | null = null;

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    return null;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: STRIPE_API_VERSION,
    });
  }

  return stripeClient;
}

function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
}

type BookingRow = Record<string, unknown>;

type PaymentSnapshot = {
  paymentIntentId: string;
  paymentIntentStatus: string;
  chargeId: string;
  receiptUrl: string;
  paymentMethodType: string;
  cardBrand: string;
  cardLast4: string;
  failureMessage: string;
  metadata: Stripe.Metadata;
};

type FinancialSnapshot = {
  serviceAmountCents: number;
  marketplaceFeeCents: number;
  marketplaceFeePercent: number;
  trustAndSafetyFeeCents: number;
  tipCents: number;
  taxCents: number;
  totalPaidCents: number;
  guruNetCents: number;
  guruPayoutCents: number;
};

function centsToDollars(cents: number | null | undefined) {
  const value =
    typeof cents === "number" && Number.isFinite(cents) ? cents : 0;

  return Number((value / 100).toFixed(2));
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function firstNonEmpty(...values: unknown[]) {
  for (const value of values) {
    const text = asTrimmedString(value);

    if (text) return text;

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
}

function toFiniteNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function toWholeCents(value: unknown, fallback = 0) {
  const parsed = toFiniteNumber(value, Number.NaN);

  if (!Number.isFinite(parsed)) return fallback;

  return Math.max(0, Math.round(parsed));
}

function dollarsToCents(value: unknown, fallback = 0) {
  const parsed = toFiniteNumber(value, Number.NaN);

  if (!Number.isFinite(parsed)) return fallback;

  return Math.max(0, Math.round(parsed * 100));
}

function metadataCents(
  metadata: Stripe.Metadata | null | undefined,
  centsKeys: string[],
  dollarKeys: string[] = [],
  fallback = 0,
) {
  for (const key of centsKeys) {
    const value = metadata?.[key];

    if (value !== undefined && value !== null && value !== "") {
      return toWholeCents(value, fallback);
    }
  }

  for (const key of dollarKeys) {
    const value = metadata?.[key];

    if (value !== undefined && value !== null && value !== "") {
      return dollarsToCents(value, fallback);
    }
  }

  return fallback;
}

function bookingCents(
  booking: BookingRow | null,
  dollarKeys: string[],
  fallback = 0,
) {
  if (!booking) return fallback;

  for (const key of dollarKeys) {
    const value = booking[key];

    if (value !== undefined && value !== null && value !== "") {
      return dollarsToCents(value, fallback);
    }
  }

  return fallback;
}

function getMissingColumnName(errorMessage: string) {
  const quotedColumnMatch = errorMessage.match(/'([^']+)' column/i);
  if (quotedColumnMatch?.[1]) return quotedColumnMatch[1];

  const columnDoesNotExistMatch = errorMessage.match(
    /column "([^"]+)" does not exist/i,
  );
  if (columnDoesNotExistMatch?.[1]) return columnDoesNotExistMatch[1];

  const schemaCacheMatch = errorMessage.match(
    /Could not find the '([^']+)' column/i,
  );
  if (schemaCacheMatch?.[1]) return schemaCacheMatch[1];

  return null;
}

function isTrustSafetyMetadata(metadata: Stripe.Metadata | null | undefined) {
  return metadata?.purpose === "trust_safety_screening";
}

function isTrustSafetyScreeningSession(session: Stripe.Checkout.Session) {
  return isTrustSafetyMetadata(session.metadata);
}

async function fetchBookingById(bookingId: string) {
  if (!bookingId) return null;

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Stripe webhook booking lookup failed:", error);
    return null;
  }

  return (data as BookingRow | null) || null;
}


function asUuidOrNull(value: unknown) {
  const text = asTrimmedString(value);

  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      text,
    )
  ) {
    return text;
  }

  return null;
}

function getBookingOwnerUserId(booking: BookingRow | null) {
  return asUuidOrNull(
    firstNonEmpty(
      booking?.pet_owner_id,
      booking?.customer_id,
      booking?.pet_parent_id,
      booking?.user_id,
      booking?.owner_id,
      booking?.client_id,
      booking?.booked_by,
    ),
  );
}

function getBookingGuruUserId(booking: BookingRow | null) {
  return asUuidOrNull(
    firstNonEmpty(
      booking?.guru_user_id,
      booking?.provider_user_id,
      booking?.sitter_user_id,
      booking?.caregiver_user_id,
      booking?.payee_user_id,
    ),
  );
}

function getBookingGuruReference(booking: BookingRow | null) {
  return firstNonEmpty(
    booking?.guru_id,
    booking?.provider_id,
    booking?.sitter_id,
    booking?.caregiver_id,
    booking?.provider_profile_id,
  );
}

function getBookingGuruProfileId(booking: BookingRow | null) {
  return asUuidOrNull(
    firstNonEmpty(
      booking?.guru_profile_id,
      booking?.provider_profile_id,
      booking?.sitter_profile_id,
    ),
  );
}

async function fetchBookingByPaymentIntent(paymentIntentId: string) {
  if (!paymentIntentId) return null;

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .limit(1)
    .maybeSingle();

  if (error) {
    const message = error.message || "";

    if (!message.includes("does not exist") && !message.includes("schema cache")) {
      console.error("Stripe webhook payment booking lookup failed:", error);
    }

    return null;
  }

  return (data as BookingRow | null) || null;
}

async function findPaymentLedgerId({
  paymentIntentId,
  checkoutSessionId,
}: {
  paymentIntentId: string;
  checkoutSessionId: string;
}) {
  const lookups = [
    {
      column: "stripe_payment_intent_id",
      value: paymentIntentId,
    },
    {
      column: "stripe_checkout_session_id",
      value: checkoutSessionId,
    },
  ].filter((lookup) => lookup.value);

  for (const lookup of lookups) {
    const { data, error } = await supabaseAdmin
      .from("booking_payments")
      .select("id")
      .eq(lookup.column, lookup.value)
      .limit(1)
      .maybeSingle();

    if (!error && data?.id) {
      return String(data.id);
    }

    if (error) {
      console.error("Booking payment ledger lookup failed:", error);
    }
  }

  return "";
}

async function safePaymentLedgerUpsert(
  payload: Record<string, unknown>,
) {
  const paymentIntentId = asTrimmedString(
    payload.stripe_payment_intent_id,
  );
  const checkoutSessionId = asTrimmedString(
    payload.stripe_checkout_session_id,
  );

  let existingId = await findPaymentLedgerId({
    paymentIntentId,
    checkoutSessionId,
  });

  let writePayload: Record<string, unknown> = {
    ...payload,
    provider: firstNonEmpty(payload.provider, "stripe"),
    currency: firstNonEmpty(payload.currency, "usd").toLowerCase(),
    updated_at: new Date().toISOString(),
  };

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const result = existingId
      ? await supabaseAdmin
          .from("booking_payments")
          .update(writePayload)
          .eq("id", existingId)
      : await supabaseAdmin.from("booking_payments").insert({
          ...writePayload,
          created_at: firstNonEmpty(writePayload.created_at) || new Date().toISOString(),
        });

    if (!result.error) return true;

    const missingColumn = getMissingColumnName(result.error.message || "");

    if (missingColumn && missingColumn in writePayload) {
      console.warn(
        "Removing missing booking payment ledger column and retrying:",
        missingColumn,
      );
      delete writePayload[missingColumn];
      continue;
    }

    if (!existingId && result.error.code === "23505") {
      existingId = await findPaymentLedgerId({
        paymentIntentId,
        checkoutSessionId,
      });

      if (existingId) continue;
    }

    console.error("Booking payment ledger write failed:", result.error);
    return false;
  }

  return false;
}

function buildPaymentLedgerPayload({
  bookingId,
  booking,
  session,
  payment,
  financial,
  status,
  now,
  failureMessage = "",
  refundAmountCents = 0,
  refundStatus = "",
  disputeAmountCents = 0,
  disputeStatus = "",
  disputeReason = "",
}: {
  bookingId: string;
  booking: BookingRow | null;
  session?: Stripe.Checkout.Session | null;
  payment: PaymentSnapshot;
  financial: FinancialSnapshot;
  status: string;
  now: string;
  failureMessage?: string;
  refundAmountCents?: number;
  refundStatus?: string;
  disputeAmountCents?: number;
  disputeStatus?: string;
  disputeReason?: string;
}) {
  const payerUserId = getBookingOwnerUserId(booking);
  const payeeUserId = getBookingGuruUserId(booking);

  return {
    booking_id: bookingId,
    payer_user_id: payerUserId,
    customer_id: payerUserId,
    pet_parent_id: payerUserId,
    payee_user_id: payeeUserId,
    guru_id: getBookingGuruReference(booking) || null,
    guru_profile_id: getBookingGuruProfileId(booking),

    provider: "stripe",
    currency: firstNonEmpty(session?.currency, booking?.currency, "usd").toLowerCase(),
    status,

    payment_method_type: payment.paymentMethodType || null,
    payment_method_label:
      firstNonEmpty(
        booking?.payment_method_label,
        booking?.selected_payment_option,
        payment.paymentMethodType,
      ) || null,
    card_brand: payment.cardBrand || null,
    card_last4: payment.cardLast4 || null,

    stripe_checkout_session_id: session?.id || null,
    stripe_payment_intent_id: payment.paymentIntentId || null,
    stripe_charge_id: payment.chargeId || null,
    receipt_url: payment.receiptUrl || null,

    subtotal_cents: financial.serviceAmountCents,
    marketplace_support_cents: financial.marketplaceFeeCents,
    tax_cents: financial.taxCents,
    tip_cents: financial.tipCents,
    amount_cents: financial.totalPaidCents,

    refund_amount_cents: refundAmountCents,
    refund_status: refundStatus || null,
    dispute_status: disputeStatus || null,
    dispute_reason: disputeReason || null,
    dispute_amount_cents: disputeAmountCents,

    failure_message: failureMessage || null,
    processing_at: status === "processing" ? now : null,
    paid_at: status === "paid" ? now : null,
    failed_at: status === "failed" ? now : null,
    canceled_at:
      status === "canceled" || status === "expired" ? now : null,
    refunded_at:
      status === "refunded" || status === "partially_refunded"
        ? now
        : null,

    metadata: {
      stripe_payment_intent_status: payment.paymentIntentStatus || null,
      checkout_payment_status: session?.payment_status || null,
      guru_net_cents: financial.guruNetCents,
      guru_payout_cents: financial.guruPayoutCents,
      marketplace_fee_percent: financial.marketplaceFeePercent,
      stripe_metadata: payment.metadata,
      checkout_metadata: session?.metadata || {},
    },
  };
}

async function safeBookingUpdateById(
  bookingId: string,
  payload: Record<string, unknown>,
) {
  if (!bookingId) return false;

  let updatePayload = { ...payload };

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const { error } = await supabaseAdmin
      .from("bookings")
      .update(updatePayload)
      .eq("id", bookingId);

    if (!error) return true;

    const missingColumn = getMissingColumnName(error.message || "");

    if (missingColumn && missingColumn in updatePayload) {
      console.warn(
        "Removing missing Stripe webhook booking column and retrying:",
        missingColumn,
      );
      delete updatePayload[missingColumn];
      continue;
    }

    console.error("Stripe webhook booking update failed:", error);
    return false;
  }

  console.error(
    "Stripe webhook booking update stopped after too many missing columns.",
    { bookingId },
  );

  return false;
}

async function safeBookingUpdateByPaymentIntent(
  paymentIntentId: string,
  payload: Record<string, unknown>,
) {
  if (!paymentIntentId) return false;

  let updatePayload = { ...payload };

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const { error } = await supabaseAdmin
      .from("bookings")
      .update(updatePayload)
      .eq("stripe_payment_intent_id", paymentIntentId);

    if (!error) return true;

    const missingColumn = getMissingColumnName(error.message || "");

    if (missingColumn && missingColumn in updatePayload) {
      console.warn(
        "Removing missing Stripe webhook payment column and retrying:",
        missingColumn,
      );
      delete updatePayload[missingColumn];
      continue;
    }

    console.error("Stripe webhook payment-intent update failed:", error);
    return false;
  }

  return false;
}

async function retrieveCharge(
  value: string | Stripe.Charge | null | undefined,
) {
  if (!value) return null;

  if (typeof value !== "string") {
    return value;
  }

  const stripe = getStripeClient();

  if (!stripe) {
    console.error(
      "Failed to retrieve Stripe charge: STRIPE_SECRET_KEY is missing.",
    );
    return null;
  }

  try {
    return await stripe.charges.retrieve(value);
  } catch (error) {
    console.error("Failed to retrieve Stripe charge:", error);
    return null;
  }
}

function getPaymentMethodSummary(charge: Stripe.Charge | null) {
  const details = charge?.payment_method_details as unknown as
    | Record<string, unknown>
    | null
    | undefined;

  const paymentMethodType = firstNonEmpty(details?.type);

  const cardDetails =
    details?.card && typeof details.card === "object"
      ? (details.card as Record<string, unknown>)
      : null;

  return {
    paymentMethodType,
    cardBrand: firstNonEmpty(cardDetails?.brand),
    cardLast4: firstNonEmpty(cardDetails?.last4),
  };
}

async function getPaymentIntentSnapshot(
  paymentIntentValue:
    | string
    | Stripe.PaymentIntent
    | null
    | undefined,
): Promise<PaymentSnapshot> {
  const emptySnapshot: PaymentSnapshot = {
    paymentIntentId: "",
    paymentIntentStatus: "",
    chargeId: "",
    receiptUrl: "",
    paymentMethodType: "",
    cardBrand: "",
    cardLast4: "",
    failureMessage: "",
    metadata: {},
  };

  if (!paymentIntentValue) {
    return emptySnapshot;
  }

  const stripe = getStripeClient();

  if (!stripe) {
    console.error(
      "Failed to retrieve Stripe payment intent: STRIPE_SECRET_KEY is missing.",
    );

    return {
      ...emptySnapshot,
      paymentIntentId:
        typeof paymentIntentValue === "string"
          ? paymentIntentValue
          : paymentIntentValue.id,
    };
  }

  let paymentIntent: Stripe.PaymentIntent;

  try {
    paymentIntent =
      typeof paymentIntentValue === "string"
        ? await stripe.paymentIntents.retrieve(paymentIntentValue, {
            expand: ["latest_charge"],
          })
        : paymentIntentValue;
  } catch (error) {
    console.error("Failed to retrieve Stripe payment intent:", error);

    return {
      ...emptySnapshot,
      paymentIntentId:
        typeof paymentIntentValue === "string"
          ? paymentIntentValue
          : paymentIntentValue.id,
    };
  }

  const charge = await retrieveCharge(paymentIntent.latest_charge);
  const method = getPaymentMethodSummary(charge);

  return {
    paymentIntentId: paymentIntent.id,
    paymentIntentStatus: paymentIntent.status || "",
    chargeId: charge?.id || "",
    receiptUrl: charge?.receipt_url || "",
    paymentMethodType: method.paymentMethodType,
    cardBrand: method.cardBrand,
    cardLast4: method.cardLast4,
    failureMessage:
      paymentIntent.last_payment_error?.message ||
      paymentIntent.last_payment_error?.decline_code ||
      "",
    metadata: paymentIntent.metadata || {},
  };
}

async function getSessionPaymentSnapshot(session: Stripe.Checkout.Session) {
  return getPaymentIntentSnapshot(session.payment_intent);
}

function getBookingId(
  sessionMetadata: Stripe.Metadata | null | undefined,
  paymentMetadata: Stripe.Metadata | null | undefined,
) {
  return firstNonEmpty(
    sessionMetadata?.booking_id,
    sessionMetadata?.bookingId,
    paymentMetadata?.booking_id,
    paymentMetadata?.bookingId,
  );
}

function getFinancialSnapshot({
  session,
  metadata,
  booking,
}: {
  session?: Stripe.Checkout.Session | null;
  metadata: Stripe.Metadata;
  booking: BookingRow | null;
}): FinancialSnapshot {
  const sessionSubtotalCents =
    typeof session?.amount_subtotal === "number"
      ? session.amount_subtotal
      : 0;

  const sessionTotalCents =
    typeof session?.amount_total === "number"
      ? session.amount_total
      : sessionSubtotalCents;

  const marketplaceFeeCents = metadataCents(
    metadata,
    [
      "marketplace_fee_cents",
      "sitguru_fee_cents",
      "platform_fee_cents",
    ],
    [
      "marketplace_fee_amount",
      "sitguru_fee_amount",
      "platform_fee_amount",
    ],
    bookingCents(booking, [
      "marketplace_fee_amount",
      "sitguru_fee_amount",
      "platform_fee_amount",
      "platform_fee",
    ]),
  );

  const trustAndSafetyFeeCents = metadataCents(
    metadata,
    ["trust_and_safety_fee_cents"],
    ["trust_and_safety_fee_amount"],
    bookingCents(booking, ["trust_and_safety_fee_amount"]),
  );

  const tipCents = metadataCents(
    metadata,
    ["tip_cents", "guru_tip_cents"],
    ["tip_amount", "guru_tip_amount"],
    bookingCents(booking, ["tip_amount", "guru_tip_amount"]),
  );

  const computedServiceCents = Math.max(
    0,
    sessionSubtotalCents -
      marketplaceFeeCents -
      trustAndSafetyFeeCents -
      tipCents,
  );

  const serviceAmountCents = metadataCents(
    metadata,
    [
      "subtotal_cents",
      "service_amount_cents",
      "booking_subtotal_cents",
    ],
    ["service_amount", "subtotal_amount", "booking_subtotal_amount"],
    bookingCents(
      booking,
      ["subtotal_amount", "service_amount", "booking_subtotal_amount"],
      computedServiceCents,
    ),
  );

  const taxCents =
    typeof session?.total_details?.amount_tax === "number"
      ? session.total_details.amount_tax
      : metadataCents(
          metadata,
          ["tax_cents", "sales_tax_cents"],
          ["tax_amount", "sales_tax_amount"],
          bookingCents(booking, ["sales_tax_amount", "tax_amount"]),
        );

  const totalPaidCents = metadataCents(
    metadata,
    ["total_customer_paid_cents", "checkout_amount_cents"],
    ["total_customer_paid", "checkout_amount"],
    sessionTotalCents ||
      bookingCents(booking, [
        "total_customer_paid",
        "checkout_amount",
        "customer_total_amount",
        "amount_total",
      ]),
  );

  const guruNetCents = metadataCents(
    metadata,
    ["guru_net_cents"],
    ["guru_net_amount"],
    bookingCents(
      booking,
      ["guru_net_amount", "guru_estimated_base_payout"],
      Math.max(0, serviceAmountCents - marketplaceFeeCents),
    ),
  );

  const guruPayoutCents = metadataCents(
    metadata,
    ["guru_payout_cents"],
    ["guru_payout_amount"],
    bookingCents(
      booking,
      ["guru_payout_amount", "guru_estimated_total_payout"],
      guruNetCents + tipCents,
    ),
  );

  const marketplaceFeePercent = toFiniteNumber(
    firstNonEmpty(
      metadata.marketplace_fee_percent,
      metadata.sitguru_fee_percent,
      booking?.marketplace_fee_percent,
      booking?.sitguru_fee_percent,
    ),
    0,
  );

  return {
    serviceAmountCents,
    marketplaceFeeCents,
    marketplaceFeePercent,
    trustAndSafetyFeeCents,
    tipCents,
    taxCents,
    totalPaidCents,
    guruNetCents,
    guruPayoutCents,
  };
}

function paymentReferencePayload({
  session,
  payment,
}: {
  session?: Stripe.Checkout.Session | null;
  payment: PaymentSnapshot;
}) {
  return {
    payment_provider: "stripe",
    stripe_session_id: session?.id || null,
    stripe_checkout_session_id: session?.id || null,
    stripe_payment_intent_id: payment.paymentIntentId || null,
    stripe_payment_intent_status:
      payment.paymentIntentStatus || session?.payment_status || null,
    stripe_charge_id: payment.chargeId || null,
    receipt_url: payment.receiptUrl || null,
    stripe_receipt_url: payment.receiptUrl || null,
    payment_method_type: payment.paymentMethodType || null,
    card_brand: payment.cardBrand || null,
    card_last4: payment.cardLast4 || null,
    currency: session?.currency || null,
  };
}

function financialPayload(financial: FinancialSnapshot) {
  return {
    subtotal_amount: centsToDollars(financial.serviceAmountCents),
    service_amount: centsToDollars(financial.serviceAmountCents),

    marketplace_fee_amount: centsToDollars(
      financial.marketplaceFeeCents,
    ),
    sitguru_fee_amount: centsToDollars(financial.marketplaceFeeCents),
    platform_fee_amount: centsToDollars(financial.marketplaceFeeCents),
    platform_fee: centsToDollars(financial.marketplaceFeeCents),
    marketplace_fee_percent: financial.marketplaceFeePercent || null,

    trust_and_safety_fee_amount: centsToDollars(
      financial.trustAndSafetyFeeCents,
    ),

    tip_amount: centsToDollars(financial.tipCents),
    guru_tip_amount: centsToDollars(financial.tipCents),

    sales_tax_amount: centsToDollars(financial.taxCents),
    tax_amount: centsToDollars(financial.taxCents),
    tax_status:
      financial.taxCents > 0 ? "collected" : "not_applicable",

    total_customer_paid: centsToDollars(financial.totalPaidCents),
    customer_total_amount: centsToDollars(financial.totalPaidCents),
    checkout_amount: centsToDollars(financial.totalPaidCents),
    amount_total: centsToDollars(financial.totalPaidCents),

    guru_net_amount: centsToDollars(financial.guruNetCents),
    guru_estimated_base_payout: centsToDollars(
      financial.guruNetCents,
    ),
    guru_payout_amount: centsToDollars(financial.guruPayoutCents),
    guru_estimated_total_payout: centsToDollars(
      financial.guruPayoutCents,
    ),

    fee_status:
      financial.marketplaceFeeCents > 0 ? "charged" : "not_applicable",
  };
}

async function updateBookingFromCheckoutSession(
  session: Stripe.Checkout.Session,
  status: "paid" | "processing" | "failed" | "expired",
) {
  const payment = await getSessionPaymentSnapshot(session);
  const metadata = {
    ...(payment.metadata || {}),
    ...(session.metadata || {}),
  } as Stripe.Metadata;

  if (isTrustSafetyMetadata(metadata)) {
    console.log("Paused Trust & Safety Stripe checkout event ignored:", {
      sessionId: session.id,
      status,
    });
    return;
  }

  const bookingId = getBookingId(session.metadata, payment.metadata);

  if (!bookingId) {
    console.warn("No booking_id in Stripe checkout metadata:", {
      sessionId: session.id,
      status,
    });
    return;
  }

  const booking = await fetchBookingById(bookingId);
  const financial = getFinancialSnapshot({
    session,
    metadata,
    booking,
  });

  const now = new Date().toISOString();

  const basePayload: Record<string, unknown> = {
    ...paymentReferencePayload({ session, payment }),
    ...financialPayload(financial),
    updated_at: now,
  };

  let bookingPayload: Record<string, unknown>;
  let ledgerStatus: string;
  let failureMessage = "";

  if (status === "paid") {
    bookingPayload = {
      ...basePayload,
      status: "confirmed",
      payment_status: "paid",
      payment_confirmed_at: now,
      paid_at: now,
      payment_failed_at: null,
      payment_failure_message: null,
      payout_status: "pending",
    };
    ledgerStatus = "paid";
  } else if (status === "processing") {
    bookingPayload = {
      ...basePayload,
      payment_status: "processing",
      payment_processing_at: now,
      payment_failure_message: null,
      payout_status: "pending_payment",
    };
    ledgerStatus = "processing";
  } else if (status === "failed") {
    failureMessage =
      payment.failureMessage ||
      "The payment method did not complete successfully.";
    bookingPayload = {
      ...basePayload,
      payment_status: "failed",
      payment_failed_at: now,
      payment_failure_message: failureMessage,
      payout_status: "not_started",
    };
    ledgerStatus = "failed";
  } else {
    bookingPayload = {
      ...basePayload,
      payment_status: "expired",
      checkout_expired_at: now,
      payout_status: "not_started",
    };
    ledgerStatus = "expired";
  }

  await safeBookingUpdateById(bookingId, bookingPayload);
  await safePaymentLedgerUpsert(
    buildPaymentLedgerPayload({
      bookingId,
      booking,
      session,
      payment,
      financial,
      status: ledgerStatus,
      now,
      failureMessage,
    }),
  );

  console.log("Stripe checkout status recorded:", {
    bookingId,
    status: ledgerStatus,
  });
}

async function updateBookingFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
  status: "paid" | "processing" | "failed" | "canceled",
) {
  if (isTrustSafetyMetadata(paymentIntent.metadata)) {
    console.log("Paused Trust & Safety PaymentIntent event ignored:", {
      paymentIntentId: paymentIntent.id,
      status,
    });
    return;
  }

  const payment = await getPaymentIntentSnapshot(paymentIntent);
  const metadataBookingId = getBookingId(null, payment.metadata);
  const booking = metadataBookingId
    ? await fetchBookingById(metadataBookingId)
    : await fetchBookingByPaymentIntent(payment.paymentIntentId);
  const bookingId =
    metadataBookingId || firstNonEmpty(booking?.id, booking?.booking_id);
  const financial = getFinancialSnapshot({
    metadata: payment.metadata,
    booking,
  });
  const now = new Date().toISOString();

  const referencePayload = paymentReferencePayload({
    session: null,
    payment,
  });

  let updatePayload: Record<string, unknown>;
  let failureMessage = "";

  if (status === "paid") {
    updatePayload = {
      ...referencePayload,
      status: "confirmed",
      payment_status: "paid",
      payment_confirmed_at: now,
      paid_at: now,
      payment_failed_at: null,
      payment_failure_message: null,
      payout_status: "pending",
      updated_at: now,
    };
  } else if (status === "processing") {
    updatePayload = {
      ...referencePayload,
      payment_status: "processing",
      payment_processing_at: now,
      payment_failure_message: null,
      payout_status: "pending_payment",
      updated_at: now,
    };
  } else if (status === "failed") {
    failureMessage =
      payment.failureMessage ||
      "The payment method did not complete successfully.";
    updatePayload = {
      ...referencePayload,
      payment_status: "failed",
      payment_failed_at: now,
      payment_failure_message: failureMessage,
      payout_status: "not_started",
      updated_at: now,
    };
  } else {
    updatePayload = {
      ...referencePayload,
      payment_status: "canceled",
      payment_canceled_at: now,
      payout_status: "not_started",
      updated_at: now,
    };
  }

  if (bookingId) {
    await safeBookingUpdateById(bookingId, updatePayload);
    await safePaymentLedgerUpsert(
      buildPaymentLedgerPayload({
        bookingId,
        booking,
        payment,
        financial,
        status,
        now,
        failureMessage,
      }),
    );
  } else {
    await safeBookingUpdateByPaymentIntent(
      payment.paymentIntentId,
      updatePayload,
    );
    console.warn(
      "PaymentIntent did not include a booking reference; ledger row was not created:",
      payment.paymentIntentId,
    );
  }
}

async function updateBookingRefundedFromCharge(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id || "";

  if (!paymentIntentId) return;

  const payment = await getPaymentIntentSnapshot(paymentIntentId);
  const metadataBookingId = getBookingId(null, payment.metadata);
  const booking = metadataBookingId
    ? await fetchBookingById(metadataBookingId)
    : await fetchBookingByPaymentIntent(paymentIntentId);
  const bookingId =
    metadataBookingId || firstNonEmpty(booking?.id, booking?.booking_id);
  const financial = getFinancialSnapshot({
    metadata: payment.metadata,
    booking,
  });

  const refundedCents =
    typeof charge.amount_refunded === "number"
      ? charge.amount_refunded
      : 0;

  const chargeAmountCents =
    typeof charge.amount === "number" ? charge.amount : 0;

  const fullyRefunded =
    Boolean(charge.refunded) ||
    (chargeAmountCents > 0 && refundedCents >= chargeAmountCents);

  const refundStatus = fullyRefunded
    ? "refunded"
    : "partially_refunded";
  const now = new Date().toISOString();

  const resolvedPayment: PaymentSnapshot = {
    ...payment,
    chargeId: charge.id,
    receiptUrl: charge.receipt_url || payment.receiptUrl,
  };

  const payload: Record<string, unknown> = {
    ...paymentReferencePayload({
      session: null,
      payment: resolvedPayment,
    }),
    payment_status: refundStatus,
    refund_status: refundStatus,
    refund_amount: centsToDollars(refundedCents),
    refunded_amount: centsToDollars(refundedCents),
    refunded_at: now,
    payout_status: "adjusted",
    updated_at: now,
  };

  if (bookingId) {
    await safeBookingUpdateById(bookingId, payload);
    await safePaymentLedgerUpsert(
      buildPaymentLedgerPayload({
        bookingId,
        booking,
        payment: resolvedPayment,
        financial,
        status: refundStatus,
        now,
        refundAmountCents: refundedCents,
        refundStatus,
      }),
    );
  } else {
    await safeBookingUpdateByPaymentIntent(paymentIntentId, payload);
  }

  console.log("Stripe refund recorded:", {
    paymentIntentId,
    fullyRefunded,
    refundedCents,
  });
}

async function updateBookingFromDispute(dispute: Stripe.Dispute) {
  const charge = await retrieveCharge(dispute.charge);

  const paymentIntentId =
    typeof charge?.payment_intent === "string"
      ? charge.payment_intent
      : charge?.payment_intent?.id || "";

  if (!paymentIntentId) return;

  const payment = await getPaymentIntentSnapshot(paymentIntentId);
  const metadataBookingId = getBookingId(null, payment.metadata);
  const booking = metadataBookingId
    ? await fetchBookingById(metadataBookingId)
    : await fetchBookingByPaymentIntent(paymentIntentId);
  const bookingId =
    metadataBookingId || firstNonEmpty(booking?.id, booking?.booking_id);
  const financial = getFinancialSnapshot({
    metadata: payment.metadata,
    booking,
  });
  const disputeStatus = dispute.status || "needs_response";
  const now = new Date().toISOString();

  const disputeWon = disputeStatus === "won";
  const disputeLost = disputeStatus === "lost";
  const paymentStatus = disputeWon
    ? "paid"
    : disputeLost
      ? "chargeback"
      : "disputed";

  const resolvedPayment: PaymentSnapshot = {
    ...payment,
    chargeId: charge?.id || payment.chargeId,
    receiptUrl: charge?.receipt_url || payment.receiptUrl,
  };

  const payload: Record<string, unknown> = {
    ...paymentReferencePayload({
      session: null,
      payment: resolvedPayment,
    }),
    payment_status: paymentStatus,
    dispute_status: disputeStatus,
    dispute_reason: dispute.reason || null,
    dispute_amount: centsToDollars(dispute.amount),
    dispute_updated_at: now,
    payout_status: disputeWon
      ? "pending"
      : disputeLost
        ? "adjusted"
        : "on_hold",
    updated_at: now,
  };

  if (bookingId) {
    await safeBookingUpdateById(bookingId, payload);
    await safePaymentLedgerUpsert(
      buildPaymentLedgerPayload({
        bookingId,
        booking,
        payment: resolvedPayment,
        financial,
        status: paymentStatus,
        now,
        disputeAmountCents: dispute.amount,
        disputeStatus,
        disputeReason: dispute.reason || "",
      }),
    );
  } else {
    await safeBookingUpdateByPaymentIntent(paymentIntentId, payload);
  }

  console.log("Stripe dispute recorded:", {
    paymentIntentId,
    disputeStatus,
  });
}

async function skipPausedTrustSafetyInvoice(invoice: Stripe.Invoice) {
  console.log("Paused Trust & Safety invoice event ignored:", {
    invoiceId: invoice.id,
  });
}

async function skipPausedTrustSafetySubscription(
  subscription: Stripe.Subscription,
) {
  console.log("Paused Trust & Safety subscription event ignored:", {
    subscriptionId: subscription.id,
  });
}

export async function POST(req: NextRequest) {
  const stripe = getStripeClient();
  const webhookSecret = getStripeWebhookSecret();

  if (!stripe || !webhookSecret) {
    console.error("Stripe webhook configuration is incomplete.", {
      hasStripeSecretKey: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
      hasStripeWebhookSecret: Boolean(
        process.env.STRIPE_WEBHOOK_SECRET?.trim(),
      ),
    });

    return NextResponse.json(
      {
        error: "Stripe webhook is not configured.",
        code: "STRIPE_WEBHOOK_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret,
    );
  } catch (error) {
    console.error("Webhook signature error:", error);

    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (isTrustSafetyScreeningSession(session)) {
          console.log(
            "Paused Trust & Safety checkout completion ignored:",
            session.id,
          );
          break;
        }

        const paid =
          session.payment_status === "paid" ||
          session.payment_status === "no_payment_required";

        await updateBookingFromCheckoutSession(
          session,
          paid ? "paid" : "processing",
        );
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;

        await updateBookingFromCheckoutSession(session, "paid");
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;

        await updateBookingFromCheckoutSession(session, "failed");
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (isTrustSafetyScreeningSession(session)) {
          console.log(
            "Paused Trust & Safety checkout expiration ignored:",
            session.id,
          );
          break;
        }

        await updateBookingFromCheckoutSession(session, "expired");
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        await updateBookingFromPaymentIntent(paymentIntent, "paid");
        break;
      }

      case "payment_intent.processing": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        await updateBookingFromPaymentIntent(
          paymentIntent,
          "processing",
        );
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        await updateBookingFromPaymentIntent(paymentIntent, "failed");
        break;
      }

      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        await updateBookingFromPaymentIntent(paymentIntent, "canceled");
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;

        await updateBookingRefundedFromCharge(charge);
        break;
      }

      case "charge.dispute.created":
      case "charge.dispute.updated":
      case "charge.dispute.closed": {
        const dispute = event.data.object as Stripe.Dispute;

        await updateBookingFromDispute(dispute);
        break;
      }

      case "invoice.paid":
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        await skipPausedTrustSafetyInvoice(invoice);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription =
          event.data.object as Stripe.Subscription;

        await skipPausedTrustSafetySubscription(subscription);
        break;
      }

      default: {
        console.log(`Unhandled Stripe event type: ${event.type}`);
      }
    }

    return NextResponse.json({
      received: true,
      eventId: event.id,
      eventType: event.type,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Webhook processing failed",
      },
      { status: 500 },
    );
  }
}