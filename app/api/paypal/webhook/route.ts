import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type JsonRecord = Record<string, unknown>;
type BookingRow = Record<string, unknown>;

type PayPalWebhookEvent = {
  id?: string;
  event_type?: string;
  resource_type?: string;
  resource_version?: string;
  create_time?: string;
  summary?: string;
  resource?: unknown;
  links?: unknown[];
};

type PayPalConfig = {
  clientId: string;
  clientSecret: string;
  webhookId: string;
  apiBaseUrl: string;
  environment: "sandbox" | "live";
};

type AccessTokenCache = {
  cacheKey: string;
  token: string;
  expiresAt: number;
};

type PaymentContext = {
  bookingId: string;
  orderId: string;
  captureId: string;
  refundId: string;
  payoutItemId: string;
  providerReferenceId: string;
  merchantId: string;
  trackingId: string;
  fundingSource: string;
  currency: string;
  amountCents: number;
  paypalFeeCents: number;
  netAmountCents: number;
  failureMessage: string;
  resourceStatus: string;
  order: JsonRecord | null;
  resource: JsonRecord;
};

type FinancialSnapshot = {
  serviceAmountCents: number;
  marketplaceSupportCents: number;
  taxCents: number;
  tipCents: number;
  amountCents: number;
  guruNetCents: number;
  guruPayoutCents: number;
  paypalFeeCents: number;
  netAmountCents: number;
};

type PaymentEventOutcome = {
  paymentStatus:
    | "processing"
    | "paid"
    | "failed"
    | "refunded"
    | "partially_refunded"
    | "disputed"
    | "chargeback";
  payoutStatus:
    | "pending_payment"
    | "pending"
    | "not_started"
    | "adjusted"
    | "on_hold";
  bookingStatus?: "confirmed";
  refundStatus?: "pending" | "failed" | "refunded" | "partially_refunded";
  disputeStatus?: string;
  disputeReason?: string;
  disputeAmountCents?: number;
  refundAmountCents?: number;
  failureMessage?: string;
};

let accessTokenCache: AccessTokenCache | null = null;

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as JsonRecord;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asTrimmedString(value: unknown) {
  if (typeof value === "string") return value.trim();

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

function firstNonEmpty(...values: unknown[]) {
  for (const value of values) {
    const text = asTrimmedString(value);

    if (text) return text;
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

function dollarsToCents(value: unknown, fallback = 0) {
  const parsed = toFiniteNumber(value, Number.NaN);

  if (!Number.isFinite(parsed)) return fallback;

  return Math.max(0, Math.round(parsed * 100));
}

function centsToDollars(value: number | null | undefined) {
  const cents =
    typeof value === "number" && Number.isFinite(value) ? value : 0;

  return Number((cents / 100).toFixed(2));
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

function getPath(record: JsonRecord | null, path: string[]) {
  let current: unknown = record;

  for (const segment of path) {
    const currentRecord = asRecord(current);

    if (!currentRecord) return undefined;

    current = currentRecord[segment];
  }

  return current;
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

function isMissingColumnError(error: unknown) {
  const record = asRecord(error);
  const message = firstNonEmpty(record?.message, error);

  return Boolean(getMissingColumnName(message));
}

function normalizePayPalEnvironment(value: unknown): "sandbox" | "live" {
  const normalized = asTrimmedString(value).toLowerCase();

  return normalized === "live" ||
    normalized === "production" ||
    normalized === "prod"
    ? "live"
    : "sandbox";
}

function getPayPalConfig(): PayPalConfig | null {
  const environment = normalizePayPalEnvironment(
    process.env.PAYPAL_ENVIRONMENT || process.env.PAYPAL_MODE,
  );

  const clientId = firstNonEmpty(
    environment === "live" ? process.env.PAYPAL_LIVE_CLIENT_ID : "",
    environment === "sandbox" ? process.env.PAYPAL_SANDBOX_CLIENT_ID : "",
    process.env.PAYPAL_CLIENT_ID,
  );

  const clientSecret = firstNonEmpty(
    environment === "live" ? process.env.PAYPAL_LIVE_CLIENT_SECRET : "",
    environment === "sandbox" ? process.env.PAYPAL_SANDBOX_CLIENT_SECRET : "",
    process.env.PAYPAL_CLIENT_SECRET,
  );

  const webhookId = firstNonEmpty(
    environment === "live" ? process.env.PAYPAL_LIVE_WEBHOOK_ID : "",
    environment === "sandbox" ? process.env.PAYPAL_SANDBOX_WEBHOOK_ID : "",
    process.env.PAYPAL_WEBHOOK_ID,
  );

  const apiBaseUrl = firstNonEmpty(
    process.env.PAYPAL_API_BASE_URL,
    environment === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com",
  ).replace(/\/+$/, "");

  if (!clientId || !clientSecret || !webhookId) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    webhookId,
    apiBaseUrl,
    environment,
  };
}

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

async function getPayPalAccessToken(config: PayPalConfig) {
  const cacheKey = `${config.environment}:${config.clientId}`;
  const now = Date.now();

  if (
    accessTokenCache?.cacheKey === cacheKey &&
    accessTokenCache.expiresAt > now + 60_000
  ) {
    return accessTokenCache.token;
  }

  const authorization = Buffer.from(
    `${config.clientId}:${config.clientSecret}`,
  ).toString("base64");

  const response = await fetch(`${config.apiBaseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Language": "en_US",
      Authorization: `Basic ${authorization}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | JsonRecord
    | null;

  if (!response.ok) {
    throw new Error(
      firstNonEmpty(
        payload?.error_description,
        payload?.message,
        `PayPal access-token request failed with HTTP ${response.status}.`,
      ),
    );
  }

  const token = asTrimmedString(payload?.access_token);
  const expiresInSeconds = Math.max(
    60,
    toFiniteNumber(payload?.expires_in, 300),
  );

  if (!token) {
    throw new Error("PayPal did not return an access token.");
  }

  accessTokenCache = {
    cacheKey,
    token,
    expiresAt: now + expiresInSeconds * 1000,
  };

  return token;
}

function buildVerificationBody({
  rawBody,
  webhookId,
  transmissionId,
  transmissionTime,
  transmissionSignature,
  certificateUrl,
  authenticationAlgorithm,
}: {
  rawBody: string;
  webhookId: string;
  transmissionId: string;
  transmissionTime: string;
  transmissionSignature: string;
  certificateUrl: string;
  authenticationAlgorithm: string;
}) {
  return [
    "{",
    `"auth_algo":${JSON.stringify(authenticationAlgorithm)},`,
    `"cert_url":${JSON.stringify(certificateUrl)},`,
    `"transmission_id":${JSON.stringify(transmissionId)},`,
    `"transmission_sig":${JSON.stringify(transmissionSignature)},`,
    `"transmission_time":${JSON.stringify(transmissionTime)},`,
    `"webhook_id":${JSON.stringify(webhookId)},`,
    `"webhook_event":${rawBody}`,
    "}",
  ].join("");
}

async function verifyPayPalWebhook({
  req,
  rawBody,
  config,
}: {
  req: NextRequest;
  rawBody: string;
  config: PayPalConfig;
}) {
  const transmissionId = req.headers.get("paypal-transmission-id") || "";
  const transmissionTime =
    req.headers.get("paypal-transmission-time") || "";
  const transmissionSignature =
    req.headers.get("paypal-transmission-sig") || "";
  const certificateUrl = req.headers.get("paypal-cert-url") || "";
  const authenticationAlgorithm =
    req.headers.get("paypal-auth-algo") || "";

  if (
    !transmissionId ||
    !transmissionTime ||
    !transmissionSignature ||
    !certificateUrl ||
    !authenticationAlgorithm
  ) {
    return {
      verified: false,
      status: 400,
      error: "Missing required PayPal webhook signature headers.",
      debugId: "",
    };
  }

  const accessToken = await getPayPalAccessToken(config);
  const response = await fetch(
    `${config.apiBaseUrl}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: buildVerificationBody({
        rawBody,
        webhookId: config.webhookId,
        transmissionId,
        transmissionTime,
        transmissionSignature,
        certificateUrl,
        authenticationAlgorithm,
      }),
      cache: "no-store",
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | JsonRecord
    | null;
  const debugId = firstNonEmpty(
    response.headers.get("paypal-debug-id"),
    payload?.debug_id,
  );

  if (!response.ok) {
    return {
      verified: false,
      status: 502,
      error: firstNonEmpty(
        payload?.message,
        payload?.name,
        `PayPal signature verification failed with HTTP ${response.status}.`,
      ),
      debugId,
    };
  }

  const verificationStatus = asTrimmedString(
    payload?.verification_status,
  ).toUpperCase();

  return {
    verified: verificationStatus === "SUCCESS",
    status: verificationStatus === "SUCCESS" ? 200 : 400,
    error:
      verificationStatus === "SUCCESS"
        ? ""
        : "PayPal webhook signature was not verified.",
    debugId,
  };
}

function normalizeCurrency(value: unknown) {
  return firstNonEmpty(value, "USD").toLowerCase();
}

function getAmountFromRecord(record: JsonRecord | null) {
  const amount = asRecord(record?.amount);
  const grossAmount = asRecord(
    getPath(record, ["seller_receivable_breakdown", "gross_amount"]),
  );

  const value = firstNonEmpty(amount?.value, grossAmount?.value);
  const currency = firstNonEmpty(
    amount?.currency_code,
    grossAmount?.currency_code,
    "USD",
  );

  return {
    amountCents: dollarsToCents(value),
    currency: normalizeCurrency(currency),
  };
}

function getPayPalFeeCents(record: JsonRecord | null) {
  return dollarsToCents(
    getPath(record, ["seller_receivable_breakdown", "paypal_fee", "value"]),
  );
}

function getPayPalNetAmountCents(record: JsonRecord | null) {
  return dollarsToCents(
    getPath(record, ["seller_receivable_breakdown", "net_amount", "value"]),
  );
}

function getPurchaseUnits(record: JsonRecord | null) {
  return asArray(record?.purchase_units)
    .map((value) => asRecord(value))
    .filter((value): value is JsonRecord => Boolean(value));
}

function extractBookingReference(value: unknown) {
  const text = asTrimmedString(value);

  if (!text) return "";

  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      text,
    )
  ) {
    return text;
  }

  if (/^\d+$/.test(text)) {
    return text;
  }

  const labeledMatch = text.match(
    /(?:booking|booking_id|bookingid)[:=_-]+([a-z0-9-]{4,128})/i,
  );

  if (labeledMatch?.[1]) {
    return labeledMatch[1];
  }

  return text.length <= 128 ? text : "";
}

function getBookingIdFromPayPalObject(record: JsonRecord | null) {
  if (!record) return "";

  const direct = extractBookingReference(
    firstNonEmpty(
      record.custom_id,
      record.invoice_id,
      record.booking_id,
      record.bookingId,
    ),
  );

  if (direct) return direct;

  for (const purchaseUnit of getPurchaseUnits(record)) {
    const purchaseUnitBookingId = extractBookingReference(
      firstNonEmpty(
        purchaseUnit.custom_id,
        purchaseUnit.invoice_id,
        purchaseUnit.reference_id,
      ),
    );

    if (purchaseUnitBookingId) return purchaseUnitBookingId;
  }

  return "";
}

function getRelatedIds(record: JsonRecord | null) {
  return (
    asRecord(getPath(record, ["supplementary_data", "related_ids"])) || {}
  );
}

function getDisputedTransaction(record: JsonRecord | null) {
  return (
    asRecord(asArray(record?.disputed_transactions)[0]) ||
    asRecord(record?.disputed_transaction)
  );
}

function getFundingSource(record: JsonRecord | null, fallback = "paypal") {
  const paymentSource = asRecord(record?.payment_source);

  if (paymentSource) {
    const preferredOrder = [
      "venmo",
      "paypal",
      "card",
      "apple_pay",
      "google_pay",
    ];

    for (const key of preferredOrder) {
      if (paymentSource[key]) return key;
    }

    const firstKey = Object.keys(paymentSource)[0];

    if (firstKey) return firstKey;
  }

  return firstNonEmpty(record?.funding_source, fallback).toLowerCase();
}

function getFailureMessage(record: JsonRecord | null) {
  const statusDetails = asRecord(record?.status_details);
  const processorResponse = asRecord(record?.processor_response);

  return firstNonEmpty(
    statusDetails?.reason,
    statusDetails?.description,
    processorResponse?.response_message,
    record?.reason,
    record?.message,
  );
}

function getMerchantId(record: JsonRecord | null) {
  return firstNonEmpty(
    getPath(record, ["payee", "merchant_id"]),
    record?.merchant_id,
    record?.merchant_id_in_paypal,
    record?.merchantIdInPayPal,
    record?.payer_id,
  );
}

function getTrackingId(record: JsonRecord | null) {
  return firstNonEmpty(
    record?.tracking_id,
    record?.trackingId,
    record?.merchant_id,
    record?.merchantId,
  );
}

async function getPayPalOrder(
  orderId: string,
  config: PayPalConfig,
): Promise<JsonRecord | null> {
  if (!orderId) return null;

  try {
    const accessToken = await getPayPalAccessToken(config);
    const response = await fetch(
      `${config.apiBaseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.warn("PayPal order lookup failed:", {
        orderId,
        status: response.status,
        debugId: response.headers.get("paypal-debug-id"),
      });
      return null;
    }

    return (await response.json()) as JsonRecord;
  } catch (error) {
    console.warn("PayPal order lookup threw:", {
      orderId,
      error,
    });
    return null;
  }
}

async function safeFindOneByColumn({
  table,
  column,
  value,
}: {
  table: string;
  column: string;
  value: string;
}) {
  if (!value) return null;

  const { data, error } = await supabaseAdmin
    .from(table)
    .select("*")
    .eq(column, value)
    .limit(1)
    .maybeSingle();

  if (error) {
    if (!isMissingColumnError(error)) {
      console.error("PayPal webhook lookup failed:", {
        table,
        column,
        value,
        error,
      });
    }

    return null;
  }

  return (data as JsonRecord | null) || null;
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
    console.error("PayPal webhook booking lookup failed:", {
      bookingId,
      error,
    });
    return null;
  }

  return (data as BookingRow | null) || null;
}

async function findLedgerByReferences(context: PaymentContext) {
  const lookups = [
    ["paypal_capture_id", context.captureId],
    ["paypal_order_id", context.orderId],
    ["paypal_refund_id", context.refundId],
    ["paypal_payout_item_id", context.payoutItemId],
    ["provider_reference_id", context.providerReferenceId],
    ["processor_reference_id", context.providerReferenceId],
    ["external_transaction_id", context.providerReferenceId],
  ] as const;

  for (const [column, value] of lookups) {
    if (!value) continue;

    const row = await safeFindOneByColumn({
      table: "booking_payments",
      column,
      value,
    });

    if (row) return row;
  }

  if (context.bookingId) {
    const { data, error } = await supabaseAdmin
      .from("booking_payments")
      .select("*")
      .eq("booking_id", context.bookingId)
      .eq("provider", "paypal")
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data as JsonRecord;
    }

    if (error && !isMissingColumnError(error)) {
      console.error("PayPal booking ledger lookup failed:", error);
    }
  }

  return null;
}

async function findBookingByPaymentReferences(context: PaymentContext) {
  const lookups = [
    ["paypal_capture_id", context.captureId],
    ["paypal_order_id", context.orderId],
    ["paypal_refund_id", context.refundId],
    ["provider_reference_id", context.providerReferenceId],
    ["payment_reference_id", context.providerReferenceId],
    ["external_transaction_id", context.providerReferenceId],
  ] as const;

  for (const [column, value] of lookups) {
    if (!value) continue;

    const booking = await safeFindOneByColumn({
      table: "bookings",
      column,
      value,
    });

    if (booking) return booking as BookingRow;
  }

  const ledger = await findLedgerByReferences(context);
  const ledgerBookingId = firstNonEmpty(ledger?.booking_id);

  if (ledgerBookingId) {
    return fetchBookingById(ledgerBookingId);
  }

  return null;
}

async function resolvePaymentContext(
  event: PayPalWebhookEvent,
  config: PayPalConfig,
): Promise<PaymentContext> {
  const resource = asRecord(event.resource) || {};
  const relatedIds = getRelatedIds(resource);
  const disputedTransaction = getDisputedTransaction(resource);
  const eventType = firstNonEmpty(event.event_type).toUpperCase();

  const orderId = firstNonEmpty(
    eventType.startsWith("CHECKOUT.ORDER.") ? resource.id : "",
    relatedIds.order_id,
    resource.order_id,
    resource.orderId,
  );

  const captureId = firstNonEmpty(
    eventType.startsWith("PAYMENT.CAPTURE.") ? resource.id : "",
    relatedIds.capture_id,
    resource.capture_id,
    disputedTransaction?.seller_transaction_id,
    disputedTransaction?.buyer_transaction_id,
  );

  const refundId = firstNonEmpty(
    eventType.startsWith("PAYMENT.REFUND.") ? resource.id : "",
    relatedIds.refund_id,
    resource.refund_id,
  );

  const payoutItemId = firstNonEmpty(
    eventType.startsWith("PAYMENT.REFERENCED-PAYOUT-ITEM.")
      ? resource.id
      : "",
    resource.payout_item_id,
  );

  const providerReferenceId = firstNonEmpty(
    captureId,
    orderId,
    refundId,
    payoutItemId,
    resource.id,
  );

  let order: JsonRecord | null = null;

  if (orderId && !eventType.startsWith("CHECKOUT.ORDER.")) {
    order = await getPayPalOrder(orderId, config);
  } else if (eventType.startsWith("CHECKOUT.ORDER.")) {
    order = resource;
  }

  const resourceAmount = getAmountFromRecord(resource);
  const orderPurchaseUnit = getPurchaseUnits(order)[0] || null;
  const orderAmount = getAmountFromRecord(orderPurchaseUnit);

  let bookingId = firstNonEmpty(
    getBookingIdFromPayPalObject(resource),
    getBookingIdFromPayPalObject(order),
  );

  const initialContext: PaymentContext = {
    bookingId,
    orderId,
    captureId,
    refundId,
    payoutItemId,
    providerReferenceId,
    merchantId: firstNonEmpty(
      getMerchantId(resource),
      getMerchantId(orderPurchaseUnit),
    ),
    trackingId: firstNonEmpty(
      getTrackingId(resource),
      getTrackingId(order),
    ),
    fundingSource: getFundingSource(
      order || resource,
      getFundingSource(resource, "paypal"),
    ),
    currency: normalizeCurrency(
      firstNonEmpty(resourceAmount.currency, orderAmount.currency, "USD"),
    ),
    amountCents: resourceAmount.amountCents || orderAmount.amountCents,
    paypalFeeCents: getPayPalFeeCents(resource),
    netAmountCents: getPayPalNetAmountCents(resource),
    failureMessage: getFailureMessage(resource),
    resourceStatus: firstNonEmpty(resource.status),
    order,
    resource,
  };

  if (!bookingId) {
    const ledger = await findLedgerByReferences(initialContext);
    bookingId = firstNonEmpty(ledger?.booking_id);
  }

  return {
    ...initialContext,
    bookingId,
  };
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

function bookingCents(
  booking: BookingRow | null,
  keys: string[],
  fallback = 0,
) {
  if (!booking) return fallback;

  for (const key of keys) {
    const value = booking[key];

    if (value !== undefined && value !== null && value !== "") {
      return dollarsToCents(value, fallback);
    }
  }

  return fallback;
}

function getFinancialSnapshot({
  context,
  booking,
}: {
  context: PaymentContext;
  booking: BookingRow | null;
}): FinancialSnapshot {
  const serviceAmountCents = bookingCents(booking, [
    "subtotal_amount",
    "service_amount",
    "service_price",
    "booking_subtotal_amount",
    "total_amount",
  ]);

  const marketplaceSupportCents = bookingCents(booking, [
    "marketplace_fee_amount",
    "marketplace_support_amount",
    "sitguru_fee_amount",
    "platform_fee_amount",
    "platform_fee",
  ]);

  const tipCents = bookingCents(booking, [
    "tip_amount",
    "guru_tip_amount",
  ]);

  const bookingTaxCents = bookingCents(booking, [
    "sales_tax_amount",
    "tax_amount",
  ]);

  const bookingTotalCents = bookingCents(booking, [
    "total_customer_paid",
    "checkout_amount",
    "customer_total_amount",
    "amount_total",
    "total",
  ]);

  const amountCents = context.amountCents || bookingTotalCents;
  const calculatedTaxCents = Math.max(
    0,
    amountCents -
      serviceAmountCents -
      marketplaceSupportCents -
      tipCents,
  );

  const guruNetCents = bookingCents(
    booking,
    ["guru_net_amount", "guru_estimated_base_payout"],
    Math.max(0, serviceAmountCents - marketplaceSupportCents),
  );

  const guruPayoutCents = bookingCents(
    booking,
    ["guru_payout_amount", "guru_estimated_total_payout"],
    guruNetCents + tipCents,
  );

  return {
    serviceAmountCents,
    marketplaceSupportCents,
    taxCents: bookingTaxCents || calculatedTaxCents,
    tipCents,
    amountCents,
    guruNetCents,
    guruPayoutCents,
    paypalFeeCents: context.paypalFeeCents,
    netAmountCents:
      context.netAmountCents ||
      Math.max(0, amountCents - context.paypalFeeCents),
  };
}

function paymentMethodLabel(fundingSource: string) {
  const normalized = fundingSource.trim().toLowerCase();

  if (normalized === "venmo") return "Venmo";
  if (normalized === "paypal") return "PayPal";
  if (normalized === "card") return "Card through PayPal";

  return normalized
    ? normalized
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "PayPal";
}

function preserveAdvancedPaymentStatus(
  currentStatus: string,
  incomingStatus: PaymentEventOutcome["paymentStatus"],
) {
  const current = currentStatus.trim().toLowerCase();

  const advancedStatuses = new Set([
    "refunded",
    "partially_refunded",
    "disputed",
    "chargeback",
  ]);

  if (
    advancedStatuses.has(current) &&
    (incomingStatus === "processing" ||
      incomingStatus === "paid" ||
      incomingStatus === "failed")
  ) {
    return current as PaymentEventOutcome["paymentStatus"];
  }

  if (
    current === "paid" &&
    (incomingStatus === "processing" || incomingStatus === "failed")
  ) {
    return "paid";
  }

  return incomingStatus;
}

async function safeBookingUpdateById(
  bookingId: string,
  payload: Record<string, unknown>,
) {
  if (!bookingId) return false;

  const updatePayload = { ...payload };

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const { error } = await supabaseAdmin
      .from("bookings")
      .update(updatePayload)
      .eq("id", bookingId);

    if (!error) return true;

    const missingColumn = getMissingColumnName(error.message || "");

    if (missingColumn && missingColumn in updatePayload) {
      console.warn(
        "Removing missing PayPal webhook booking column and retrying:",
        missingColumn,
      );
      delete updatePayload[missingColumn];
      continue;
    }

    console.error("PayPal webhook booking update failed:", {
      bookingId,
      error,
    });
    return false;
  }

  return false;
}

async function safePaymentLedgerUpsert({
  context,
  bookingId,
  payload,
}: {
  context: PaymentContext;
  bookingId: string;
  payload: Record<string, unknown>;
}) {
  let existing = await findLedgerByReferences({
    ...context,
    bookingId,
  });

  let existingId = firstNonEmpty(existing?.id);
  const existingMetadata = asRecord(existing?.metadata) || {};
  const incomingMetadata = asRecord(payload.metadata) || {};

  const writePayload: Record<string, unknown> = {
    ...payload,
    booking_id: bookingId,
    provider: "paypal",
    currency: normalizeCurrency(payload.currency),
    metadata: {
      ...existingMetadata,
      ...incomingMetadata,
    },
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
          created_at: firstNonEmpty(writePayload.created_at) ||
            new Date().toISOString(),
        });

    if (!result.error) return true;

    const missingColumn = getMissingColumnName(result.error.message || "");

    if (missingColumn && missingColumn in writePayload) {
      console.warn(
        "Removing missing PayPal payment-ledger column and retrying:",
        missingColumn,
      );
      delete writePayload[missingColumn];
      continue;
    }

    if (!existingId && result.error.code === "23505") {
      existing = await findLedgerByReferences({
        ...context,
        bookingId,
      });
      existingId = firstNonEmpty(existing?.id);

      if (existingId) continue;
    }

    console.error("PayPal payment-ledger write failed:", result.error);
    return false;
  }

  return false;
}

function buildPaymentLedgerPayload({
  event,
  context,
  booking,
  financial,
  outcome,
  paymentStatus,
  now,
}: {
  event: PayPalWebhookEvent;
  context: PaymentContext;
  booking: BookingRow | null;
  financial: FinancialSnapshot;
  outcome: PaymentEventOutcome;
  paymentStatus: PaymentEventOutcome["paymentStatus"];
  now: string;
}) {
  const payerUserId = getBookingOwnerUserId(booking);
  const payeeUserId = getBookingGuruUserId(booking);
  const methodLabel = paymentMethodLabel(context.fundingSource);

  return {
    payer_user_id: payerUserId,
    customer_id: payerUserId,
    pet_parent_id: payerUserId,
    payee_user_id: payeeUserId,
    guru_id: getBookingGuruReference(booking) || null,
    guru_profile_id: getBookingGuruProfileId(booking),

    provider: "paypal",
    payment_provider: "paypal",
    processor: "paypal",
    funding_source: context.fundingSource || "paypal",
    currency: context.currency,
    status: paymentStatus,

    payment_method_type: context.fundingSource || "paypal",
    payment_method_label: methodLabel,

    paypal_order_id: context.orderId || null,
    paypal_capture_id: context.captureId || null,
    paypal_refund_id: context.refundId || null,
    paypal_payout_item_id: context.payoutItemId || null,
    paypal_merchant_id: context.merchantId || null,
    provider_reference_id: context.providerReferenceId || null,
    processor_reference_id: context.providerReferenceId || null,
    external_transaction_id: context.providerReferenceId || null,

    subtotal_cents: financial.serviceAmountCents,
    marketplace_support_cents: financial.marketplaceSupportCents,
    tax_cents: financial.taxCents,
    tip_cents: financial.tipCents,
    amount_cents: financial.amountCents,
    processor_fee_cents: financial.paypalFeeCents,
    processor_net_cents: financial.netAmountCents,

    refund_amount_cents: outcome.refundAmountCents || 0,
    refund_status: outcome.refundStatus || null,
    dispute_status: outcome.disputeStatus || null,
    dispute_reason: outcome.disputeReason || null,
    dispute_amount_cents: outcome.disputeAmountCents || 0,

    failure_message: outcome.failureMessage || null,
    processing_at: paymentStatus === "processing" ? now : null,
    paid_at: paymentStatus === "paid" ? now : null,
    failed_at: paymentStatus === "failed" ? now : null,
    refunded_at:
      paymentStatus === "refunded" ||
      paymentStatus === "partially_refunded"
        ? now
        : null,

    metadata: {
      paypal_event_id: event.id || null,
      paypal_event_type: event.event_type || null,
      paypal_event_created_at: event.create_time || null,
      paypal_resource_type: event.resource_type || null,
      paypal_resource_status: context.resourceStatus || null,
      paypal_order_id: context.orderId || null,
      paypal_capture_id: context.captureId || null,
      paypal_refund_id: context.refundId || null,
      paypal_payout_item_id: context.payoutItemId || null,
      paypal_merchant_id: context.merchantId || null,
      funding_source: context.fundingSource || "paypal",
      guru_net_cents: financial.guruNetCents,
      guru_payout_cents: financial.guruPayoutCents,
      paypal_fee_cents: financial.paypalFeeCents,
      paypal_net_cents: financial.netAmountCents,
      summary: event.summary || null,
    },
  };
}

function buildBookingPaymentPayload({
  context,
  financial,
  outcome,
  paymentStatus,
  now,
}: {
  context: PaymentContext;
  financial: FinancialSnapshot;
  outcome: PaymentEventOutcome;
  paymentStatus: PaymentEventOutcome["paymentStatus"];
  now: string;
}) {
  const methodLabel = paymentMethodLabel(context.fundingSource);

  const payload: Record<string, unknown> = {
    payment_provider: "paypal",
    payment_processor: "paypal",
    payment_method_type: context.fundingSource || "paypal",
    payment_method_label: methodLabel,
    selected_payment_option: context.fundingSource || "paypal",

    paypal_order_id: context.orderId || null,
    paypal_capture_id: context.captureId || null,
    paypal_refund_id: context.refundId || null,
    paypal_payout_item_id: context.payoutItemId || null,
    paypal_merchant_id: context.merchantId || null,
    provider_reference_id: context.providerReferenceId || null,
    payment_reference_id: context.providerReferenceId || null,
    external_transaction_id: context.providerReferenceId || null,

    currency: context.currency,
    payment_status: paymentStatus,
    payout_status: outcome.payoutStatus,

    subtotal_amount: centsToDollars(financial.serviceAmountCents),
    service_amount: centsToDollars(financial.serviceAmountCents),
    marketplace_fee_amount: centsToDollars(
      financial.marketplaceSupportCents,
    ),
    marketplace_support_amount: centsToDollars(
      financial.marketplaceSupportCents,
    ),
    sitguru_fee_amount: centsToDollars(
      financial.marketplaceSupportCents,
    ),
    platform_fee_amount: centsToDollars(
      financial.marketplaceSupportCents,
    ),
    tip_amount: centsToDollars(financial.tipCents),
    guru_tip_amount: centsToDollars(financial.tipCents),
    sales_tax_amount: centsToDollars(financial.taxCents),
    tax_amount: centsToDollars(financial.taxCents),
    total_customer_paid: centsToDollars(financial.amountCents),
    customer_total_amount: centsToDollars(financial.amountCents),
    checkout_amount: centsToDollars(financial.amountCents),
    amount_total: centsToDollars(financial.amountCents),
    processor_fee_amount: centsToDollars(financial.paypalFeeCents),
    processor_net_amount: centsToDollars(financial.netAmountCents),
    guru_net_amount: centsToDollars(financial.guruNetCents),
    guru_payout_amount: centsToDollars(financial.guruPayoutCents),

    refund_status: outcome.refundStatus || null,
    refund_amount: centsToDollars(outcome.refundAmountCents || 0),
    refunded_amount: centsToDollars(outcome.refundAmountCents || 0),
    dispute_status: outcome.disputeStatus || null,
    dispute_reason: outcome.disputeReason || null,
    dispute_amount: centsToDollars(outcome.disputeAmountCents || 0),
    payment_failure_message: outcome.failureMessage || null,
    updated_at: now,
  };

  if (outcome.bookingStatus) {
    payload.status = outcome.bookingStatus;
  }

  if (paymentStatus === "paid") {
    payload.payment_confirmed_at = now;
    payload.paid_at = now;
    payload.payment_failed_at = null;
    payload.payment_failure_message = null;
  }

  if (paymentStatus === "processing") {
    payload.payment_processing_at = now;
  }

  if (paymentStatus === "failed") {
    payload.payment_failed_at = now;
  }

  if (
    paymentStatus === "refunded" ||
    paymentStatus === "partially_refunded"
  ) {
    payload.refunded_at = now;
  }

  if (paymentStatus === "disputed" || paymentStatus === "chargeback") {
    payload.dispute_updated_at = now;
  }

  return payload;
}

async function processBookingPaymentEvent({
  event,
  context,
  outcome,
}: {
  event: PayPalWebhookEvent;
  context: PaymentContext;
  outcome: PaymentEventOutcome;
}) {
  let bookingId = context.bookingId;
  let booking = bookingId ? await fetchBookingById(bookingId) : null;

  if (!booking) {
    booking = await findBookingByPaymentReferences(context);
    bookingId = firstNonEmpty(booking?.id, booking?.booking_id, bookingId);
  }

  if (!bookingId) {
    console.warn("PayPal webhook could not resolve a SitGuru booking:", {
      eventId: event.id,
      eventType: event.event_type,
      orderId: context.orderId,
      captureId: context.captureId,
      refundId: context.refundId,
      providerReferenceId: context.providerReferenceId,
    });

    return {
      handled: false,
      reason: "No SitGuru booking reference was found.",
    };
  }

  const financial = getFinancialSnapshot({
    context,
    booking,
  });
  const currentPaymentStatus = firstNonEmpty(booking?.payment_status);
  const paymentStatus = preserveAdvancedPaymentStatus(
    currentPaymentStatus,
    outcome.paymentStatus,
  );
  const now = new Date().toISOString();

  const bookingUpdated = await safeBookingUpdateById(
    bookingId,
    buildBookingPaymentPayload({
      context,
      financial,
      outcome,
      paymentStatus,
      now,
    }),
  );

  const ledgerUpdated = await safePaymentLedgerUpsert({
    context,
    bookingId,
    payload: buildPaymentLedgerPayload({
      event,
      context,
      booking,
      financial,
      outcome,
      paymentStatus,
      now,
    }),
  });

  if (!bookingUpdated || !ledgerUpdated) {
    throw new Error(
      "SitGuru could not persist the PayPal payment webhook update.",
    );
  }

  console.log("PayPal booking payment event recorded:", {
    eventId: event.id,
    eventType: event.event_type,
    bookingId,
    paymentStatus,
    orderId: context.orderId,
    captureId: context.captureId,
  });

  return {
    handled: true,
    bookingId,
    paymentStatus,
  };
}

function getRefundOutcome({
  context,
  booking,
}: {
  context: PaymentContext;
  booking: BookingRow | null;
}): PaymentEventOutcome {
  const refundedCents = context.amountCents;
  const originalTotalCents = bookingCents(booking, [
    "total_customer_paid",
    "checkout_amount",
    "customer_total_amount",
    "amount_total",
    "total",
  ]);

  const fullyRefunded =
    originalTotalCents <= 0 || refundedCents >= originalTotalCents;
  const paymentStatus = fullyRefunded
    ? "refunded"
    : "partially_refunded";

  return {
    paymentStatus,
    payoutStatus: "adjusted",
    refundStatus: paymentStatus,
    refundAmountCents: refundedCents,
  };
}

function getDisputeReason(resource: JsonRecord) {
  return firstNonEmpty(
    resource.reason,
    resource.dispute_reason,
    getPath(resource, ["reason", "reason_code"]),
    getPath(resource, ["reason", "reason_description"]),
  );
}

function getDisputeAmountCents(resource: JsonRecord) {
  const disputedTransaction = getDisputedTransaction(resource);

  return dollarsToCents(
    firstNonEmpty(
      getPath(resource, ["dispute_amount", "value"]),
      getPath(disputedTransaction, ["gross_amount", "value"]),
      getPath(disputedTransaction, ["seller_transaction_amount", "value"]),
    ),
  );
}

function getDisputeOutcome(
  eventType: string,
  resource: JsonRecord,
): PaymentEventOutcome {
  const disputeStatus = firstNonEmpty(resource.status, "OPEN");
  const outcomeCode = firstNonEmpty(
    resource.outcome_code,
    resource.outcome,
    getPath(resource, ["dispute_outcome", "outcome_code"]),
  ).toUpperCase();
  const sellerWon =
    outcomeCode.includes("SELLER") &&
    !outcomeCode.includes("BUYER");
  const buyerWon =
    outcomeCode.includes("BUYER") ||
    outcomeCode.includes("CHARGEBACK") ||
    outcomeCode.includes("LOSS");

  if (eventType === "CUSTOMER.DISPUTE.RESOLVED" && sellerWon) {
    return {
      paymentStatus: "paid",
      payoutStatus: "pending",
      disputeStatus,
      disputeReason: getDisputeReason(resource),
      disputeAmountCents: getDisputeAmountCents(resource),
    };
  }

  if (eventType === "CUSTOMER.DISPUTE.RESOLVED" && buyerWon) {
    return {
      paymentStatus: "chargeback",
      payoutStatus: "adjusted",
      disputeStatus,
      disputeReason: getDisputeReason(resource),
      disputeAmountCents: getDisputeAmountCents(resource),
    };
  }

  return {
    paymentStatus: "disputed",
    payoutStatus: "on_hold",
    disputeStatus,
    disputeReason: getDisputeReason(resource),
    disputeAmountCents: getDisputeAmountCents(resource),
  };
}

async function fetchPayPalPayoutAccount({
  userId,
  merchantId,
}: {
  userId: string;
  merchantId: string;
}) {
  if (merchantId) {
    const byMerchant = await safeFindOneByColumn({
      table: "user_payout_accounts",
      column: "provider_merchant_id",
      value: merchantId,
    });

    if (byMerchant) return byMerchant;
  }

  if (userId) {
    const { data, error } = await supabaseAdmin
      .from("user_payout_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("workspace_role", "guru")
      .eq("provider", "paypal")
      .limit(1)
      .maybeSingle();

    if (!error && data) return data as JsonRecord;

    if (error) {
      console.error("PayPal payout account lookup failed:", error);
    }
  }

  return null;
}

async function updatePayPalOnboardingAccount({
  event,
  context,
  completed,
}: {
  event: PayPalWebhookEvent;
  context: PaymentContext;
  completed: boolean;
}) {
  const now = new Date().toISOString();
  const userId = asUuidOrNull(context.trackingId) || "";
  const merchantId = context.merchantId;
  const existing = await fetchPayPalPayoutAccount({
    userId,
    merchantId,
  });
  const existingId = firstNonEmpty(existing?.id);
  const resolvedUserId = firstNonEmpty(existing?.user_id, userId);

  if (!existingId && !resolvedUserId) {
    console.warn("PayPal onboarding webhook has no SitGuru user mapping:", {
      eventId: event.id,
      eventType: event.event_type,
      merchantId,
      trackingId: context.trackingId,
    });

    return {
      handled: false,
      reason: "No SitGuru payout-account mapping was found.",
    };
  }

  const metadata = {
    ...(asRecord(existing?.metadata) || {}),
    paypal_event_id: event.id || null,
    paypal_event_type: event.event_type || null,
    paypal_merchant_id: merchantId || null,
    paypal_tracking_id: context.trackingId || null,
    consent_revoked: !completed,
    last_webhook_at: now,
  };

  const payload: Record<string, unknown> = {
    user_id: resolvedUserId,
    workspace_role: "guru",
    provider: "paypal",
    provider_account_id: merchantId || null,
    provider_merchant_id: merchantId || null,
    status: completed ? "ready" : "disabled",
    details_submitted: completed,
    charges_enabled: completed,
    payouts_enabled: completed,
    is_primary: existing?.is_primary ?? true,
    onboarding_started_at:
      existing?.onboarding_started_at || event.create_time || now,
    onboarding_completed_at: completed ? now : null,
    last_checked_at: now,
    metadata,
    updated_at: now,
  };

  let accountSaved = false;

  if (existingId) {
    const { error } = await supabaseAdmin
      .from("user_payout_accounts")
      .update(payload)
      .eq("id", existingId);

    accountSaved = !error;

    if (error) {
      console.error("PayPal payout account update failed:", error);
    }
  } else {
    const { error } = await supabaseAdmin
      .from("user_payout_accounts")
      .insert({
        ...payload,
        created_at: now,
      });

    accountSaved = !error;

    if (error) {
      console.error("PayPal payout account insert failed:", error);
    }
  }

  if (!accountSaved) {
    throw new Error("SitGuru could not save the PayPal onboarding status.");
  }

  if (resolvedUserId) {
    const { error: preferenceError } = await supabaseAdmin
      .from("user_payout_preferences")
      .upsert(
        {
          user_id: resolvedUserId,
          workspace_role: "guru",
          preferred_provider: "paypal",
          setup_timing: "before_first_paid_booking",
          allow_setup_later: true,
          setup_required: !completed,
          setup_completed: completed,
          setup_completed_at: completed ? now : null,
          updated_at: now,
        },
        {
          onConflict: "user_id,workspace_role",
        },
      );

    if (preferenceError) {
      throw new Error(
        `SitGuru could not update the PayPal payout preference: ${preferenceError.message}`,
      );
    }
  }

  console.log("PayPal seller onboarding event recorded:", {
    eventId: event.id,
    eventType: event.event_type,
    userId: resolvedUserId,
    merchantId,
    completed,
  });

  return {
    handled: true,
    userId: resolvedUserId,
    merchantId,
    completed,
  };
}

async function processReferencedPayoutEvent({
  event,
  context,
  succeeded,
}: {
  event: PayPalWebhookEvent;
  context: PaymentContext;
  succeeded: boolean;
}) {
  let bookingId = context.bookingId;
  let booking = bookingId ? await fetchBookingById(bookingId) : null;

  if (!booking) {
    booking = await findBookingByPaymentReferences(context);
    bookingId = firstNonEmpty(booking?.id, booking?.booking_id, bookingId);
  }

  if (!bookingId) {
    console.warn("Referenced payout event has no SitGuru booking mapping:", {
      eventId: event.id,
      eventType: event.event_type,
      referenceId: context.providerReferenceId,
    });

    return {
      handled: false,
      reason: "No SitGuru booking reference was found.",
    };
  }

  const now = new Date().toISOString();
  const payoutStatus = succeeded ? "paid" : "failed";
  const bookingUpdated = await safeBookingUpdateById(bookingId, {
    paypal_payout_item_id: context.payoutItemId || null,
    payout_status: payoutStatus,
    payout_paid_at: succeeded ? now : null,
    payout_failed_at: succeeded ? null : now,
    payout_failure_message: succeeded ? null : context.failureMessage,
    updated_at: now,
  });

  const financial = getFinancialSnapshot({
    context,
    booking,
  });

  const ledgerUpdated = await safePaymentLedgerUpsert({
    context,
    bookingId,
    payload: {
      provider: "paypal",
      paypal_order_id: context.orderId || null,
      paypal_capture_id: context.captureId || null,
      paypal_payout_item_id: context.payoutItemId || null,
      provider_reference_id: context.providerReferenceId || null,
      payout_status: payoutStatus,
      payout_paid_at: succeeded ? now : null,
      payout_failed_at: succeeded ? null : now,
      failure_message: succeeded ? null : context.failureMessage,
      amount_cents: financial.amountCents,
      currency: context.currency,
      metadata: {
        paypal_event_id: event.id || null,
        paypal_event_type: event.event_type || null,
        referenced_payout_succeeded: succeeded,
      },
    },
  });

  if (!bookingUpdated || !ledgerUpdated) {
    throw new Error(
      "SitGuru could not persist the PayPal referenced-payout update.",
    );
  }

  return {
    handled: true,
    bookingId,
    payoutStatus,
  };
}

async function handlePayPalEvent(
  event: PayPalWebhookEvent,
  config: PayPalConfig,
) {
  const eventType = firstNonEmpty(event.event_type).toUpperCase();
  const context = await resolvePaymentContext(event, config);

  switch (eventType) {
    case "MERCHANT.ONBOARDING.COMPLETED":
      return updatePayPalOnboardingAccount({
        event,
        context,
        completed: true,
      });

    case "MERCHANT.PARTNER-CONSENT.REVOKED":
      return updatePayPalOnboardingAccount({
        event,
        context,
        completed: false,
      });

    case "CHECKOUT.ORDER.APPROVED":
    case "PAYMENT.CAPTURE.PENDING":
      return processBookingPaymentEvent({
        event,
        context,
        outcome: {
          paymentStatus: "processing",
          payoutStatus: "pending_payment",
        },
      });

    case "PAYMENT.CAPTURE.COMPLETED":
      return processBookingPaymentEvent({
        event,
        context,
        outcome: {
          paymentStatus: "paid",
          payoutStatus: "pending",
          bookingStatus: "confirmed",
        },
      });

    case "CHECKOUT.PAYMENT-APPROVAL.REVERSED":
    case "PAYMENT.CAPTURE.DECLINED":
    case "PAYMENT.CAPTURE.DENIED":
      return processBookingPaymentEvent({
        event,
        context,
        outcome: {
          paymentStatus: "failed",
          payoutStatus: "not_started",
          failureMessage:
            context.failureMessage ||
            "The PayPal payment did not complete successfully.",
        },
      });

    case "PAYMENT.CAPTURE.REFUNDED": {
      const booking = context.bookingId
        ? await fetchBookingById(context.bookingId)
        : await findBookingByPaymentReferences(context);

      return processBookingPaymentEvent({
        event,
        context,
        outcome: getRefundOutcome({
          context,
          booking,
        }),
      });
    }

    case "PAYMENT.CAPTURE.REVERSED":
      return processBookingPaymentEvent({
        event,
        context,
        outcome: {
          paymentStatus: "chargeback",
          payoutStatus: "adjusted",
          disputeStatus: "reversed",
          disputeReason:
            context.failureMessage || "PayPal reversed the capture.",
          disputeAmountCents: context.amountCents,
        },
      });

    case "PAYMENT.REFUND.PENDING":
      return processBookingPaymentEvent({
        event,
        context,
        outcome: {
          paymentStatus: "paid",
          payoutStatus: "on_hold",
          refundStatus: "pending",
          refundAmountCents: context.amountCents,
        },
      });

    case "PAYMENT.REFUND.FAILED":
      return processBookingPaymentEvent({
        event,
        context,
        outcome: {
          paymentStatus: "paid",
          payoutStatus: "on_hold",
          refundStatus: "failed",
          refundAmountCents: context.amountCents,
          failureMessage:
            context.failureMessage || "The PayPal refund failed.",
        },
      });

    case "CUSTOMER.DISPUTE.CREATED":
    case "CUSTOMER.DISPUTE.UPDATED":
    case "CUSTOMER.DISPUTE.RESOLVED":
      return processBookingPaymentEvent({
        event,
        context,
        outcome: getDisputeOutcome(eventType, context.resource),
      });

    case "PAYMENT.REFERENCED-PAYOUT-ITEM.COMPLETED":
      return processReferencedPayoutEvent({
        event,
        context,
        succeeded: true,
      });

    case "PAYMENT.REFERENCED-PAYOUT-ITEM.FAILED":
      return processReferencedPayoutEvent({
        event,
        context,
        succeeded: false,
      });

    default:
      console.log("Unhandled PayPal webhook event:", {
        eventId: event.id,
        eventType,
      });

      return {
        handled: false,
        reason: `Unhandled PayPal event type: ${eventType || "unknown"}`,
      };
  }
}

export async function GET() {
  const config = getPayPalConfig();

  return json({
    success: true,
    service: "SitGuru PayPal webhook",
    environment: config?.environment ||
      normalizePayPalEnvironment(
        process.env.PAYPAL_ENVIRONMENT || process.env.PAYPAL_MODE,
      ),
    configured: Boolean(config),
    webhookPath: "/api/paypal/webhook",
  });
}

export async function POST(req: NextRequest) {
  const config = getPayPalConfig();

  if (!config) {
    return json(
      {
        success: false,
        error:
          "PayPal webhook configuration is incomplete. Add the PayPal client ID, client secret, and webhook ID for the active environment.",
      },
      503,
    );
  }

  const rawBody = await req.text();

  if (!rawBody.trim()) {
    return json(
      {
        success: false,
        error: "PayPal webhook body is empty.",
      },
      400,
    );
  }

  let verification:
    | Awaited<ReturnType<typeof verifyPayPalWebhook>>
    | undefined;

  try {
    verification = await verifyPayPalWebhook({
      req,
      rawBody,
      config,
    });
  } catch (error) {
    console.error("PayPal webhook verification request failed:", error);

    return json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "PayPal webhook verification failed.",
      },
      502,
    );
  }

  if (!verification.verified) {
    console.warn("PayPal webhook signature rejected:", {
      error: verification.error,
      debugId: verification.debugId,
    });

    return json(
      {
        success: false,
        error: verification.error,
        paypalDebugId: verification.debugId || null,
      },
      verification.status,
    );
  }

  let event: PayPalWebhookEvent;

  try {
    event = JSON.parse(rawBody) as PayPalWebhookEvent;
  } catch (error) {
    return json(
      {
        success: false,
        error: "PayPal webhook body is not valid JSON.",
        details: error instanceof Error ? error.message : null,
      },
      400,
    );
  }

  if (!event.id || !event.event_type) {
    return json(
      {
        success: false,
        error: "PayPal webhook event ID and event type are required.",
      },
      400,
    );
  }

  try {
    const result = await handlePayPalEvent(event, config);

    return json({
      success: true,
      received: true,
      verified: true,
      eventId: event.id,
      eventType: event.event_type,
      result,
    });
  } catch (error) {
    console.error("PayPal webhook processing failed:", {
      eventId: event.id,
      eventType: event.event_type,
      error,
    });

    return json(
      {
        success: false,
        received: true,
        verified: true,
        eventId: event.id,
        eventType: event.event_type,
        error:
          error instanceof Error
            ? error.message
            : "PayPal webhook processing failed.",
      },
      500,
    );
  }
}