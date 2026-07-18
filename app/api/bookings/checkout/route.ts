import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { supabaseAdmin } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STRIPE_API_VERSION = "2026-03-25.dahlia";

const MARKETPLACE_FEE_AMOUNT = 0;
const TRUST_AND_SAFETY_FEE_AMOUNT = 0;
const TIP_AMOUNT_DEFAULT = 0;

type CheckoutProcessor = "stripe" | "paypal";
type CheckoutFundingSource = "automatic" | "paypal" | "venmo";

type CheckoutRail = {
  processor: CheckoutProcessor;
  fundingSource: CheckoutFundingSource;
  requestedMethod: string;
};

type AuthenticatedUser = {
  id: string;
  email: string | null;
};

type RequestBody = Record<string, unknown>;

const LOCAL_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:8082",
]);

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function isAllowedOrigin(origin: string) {
  const normalized = normalizeOrigin(origin);

  if (LOCAL_ORIGINS.has(normalized)) {
    return true;
  }

  try {
    const url = new URL(normalized);

    return (
      url.hostname === "sitguru.com" ||
      url.hostname.endsWith(".sitguru.com")
    );
  } catch {
    return false;
  }
}

function corsHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    "Cache-Control": "no-store, max-age=0",
    Vary: "Origin",
  };

  const origin = req.headers.get("origin") || "";

  if (!origin || !isAllowedOrigin(origin)) {
    return headers;
  }

  headers["Access-Control-Allow-Credentials"] = "true";
  headers["Access-Control-Allow-Headers"] =
    "Authorization, Content-Type, X-Requested-With";
  headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
  headers["Access-Control-Allow-Origin"] = origin;

  return headers;
}

function json(
  req: NextRequest,
  body: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(body, {
    status,
    headers: corsHeaders(req),
  });
}

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    return null;
  }

  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
  });
}

function getBaseUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

  return configuredUrl.replace(/\/+$/, "");
}

function toCents(amount: number) {
  return Math.round(amount * 100);
}

function roundMoney(amount: number) {
  return Number(amount.toFixed(2));
}

function normalizeMoneyValue(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function normalizeRequestedMethod(value: unknown) {
  return typeof value === "string"
    ? value.trim().toLowerCase().replace(/[\s-]+/g, "_")
    : "";
}

function resolveCheckoutRail(body: RequestBody): CheckoutRail | null {
  const requestedMethod = normalizeRequestedMethod(
    body.paymentProvider ||
      body.provider ||
      body.paymentMethod ||
      body.paymentRail,
  );

  if (
    !requestedMethod ||
    requestedMethod === "stripe" ||
    requestedMethod === "automatic" ||
    requestedMethod === "card" ||
    requestedMethod === "credit_card" ||
    requestedMethod === "debit_card" ||
    requestedMethod === "apple_pay" ||
    requestedMethod === "applepay" ||
    requestedMethod === "google_pay" ||
    requestedMethod === "googlepay" ||
    requestedMethod === "link" ||
    requestedMethod === "cash_app" ||
    requestedMethod === "cash_app_pay"
  ) {
    return {
      processor: "stripe",
      fundingSource: "automatic",
      requestedMethod: requestedMethod || "stripe",
    };
  }

  if (requestedMethod === "paypal") {
    return {
      processor: "paypal",
      fundingSource: "paypal",
      requestedMethod,
    };
  }

  if (requestedMethod === "venmo") {
    return {
      processor: "paypal",
      fundingSource: "venmo",
      requestedMethod,
    };
  }

  return null;
}

async function getAuthenticatedUser(
  req: NextRequest,
): Promise<AuthenticatedUser | null> {
  const authorization = req.headers.get("authorization") || "";
  const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);

  if (bearerMatch?.[1]) {
    const accessToken = bearerMatch[1].trim();

    const { data, error } =
      await supabaseAdmin.auth.getUser(accessToken);

    if (error || !data.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email || null,
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email || null,
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req),
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return json(
        req,
        {
          success: false,
          error: "Authentication required.",
        },
        401,
      );
    }

    let body: RequestBody;

    try {
      body = (await req.json()) as RequestBody;
    } catch {
      return json(
        req,
        {
          success: false,
          error: "Request body must be valid JSON.",
        },
        400,
      );
    }

    const checkoutRail = resolveCheckoutRail(body);

    if (!checkoutRail) {
      return json(
        req,
        {
          success: false,
          error: "Unsupported SitGuru payment method.",
          code: "UNSUPPORTED_PAYMENT_METHOD",
          availableProviders: [
            {
              processor: "stripe",
              methods: [
                "card",
                "apple_pay",
                "google_pay",
                "link",
                "cash_app",
              ],
              enabled: true,
            },
            {
              processor: "paypal",
              methods: ["paypal", "venmo"],
              enabled: false,
            },
          ],
        },
        400,
      );
    }

    /*
      PayPal and Venmo are part of the shared SitGuru payment model, but
      transactions must not be created until SitGuru receives PayPal
      marketplace approval and production credentials.
    */
    if (checkoutRail.processor === "paypal") {
      return json(
        req,
        {
          success: false,
          error:
            checkoutRail.fundingSource === "venmo"
              ? "Venmo checkout is not enabled yet."
              : "PayPal checkout is not enabled yet.",
          code: "PAYPAL_MARKETPLACE_NOT_ENABLED",
          processor: checkoutRail.processor,
          fundingSource: checkoutRail.fundingSource,
          setupStatus: "awaiting_marketplace_approval",
          availableProviders: [
            {
              processor: "stripe",
              enabled: true,
            },
            {
              processor: "paypal",
              enabled: false,
            },
          ],
        },
        409,
      );
    }

    const bookingId = String(body.bookingId || "").trim();

    const requestedTipAmount = Math.max(
      0,
      roundMoney(
        normalizeMoneyValue(
          body.tipAmount,
          TIP_AMOUNT_DEFAULT,
        ),
      ),
    );

    if (!bookingId) {
      return json(
        req,
        {
          success: false,
          error: "bookingId is required.",
        },
        400,
      );
    }

    const { data: booking, error: bookingError } =
      await supabaseAdmin
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .eq("customer_id", user.id)
        .single();

    if (bookingError || !booking) {
      console.error("Checkout booking lookup error:", {
        bookingId,
        userId: user.id,
        bookingError,
      });

      return json(
        req,
        {
          success: false,
          error: "Booking not found.",
        },
        404,
      );
    }

    const stripe = getStripeClient();

    if (!stripe) {
      console.error(
        "Checkout configuration error: STRIPE_SECRET_KEY is missing.",
      );

      return json(
        req,
        {
          success: false,
          error: "Secure card checkout is temporarily unavailable.",
          code: "STRIPE_NOT_CONFIGURED",
        },
        503,
      );
    }

    const storedServiceAmount = normalizeMoneyValue(
      booking.price,
      0,
    );

    /*
      Preserve the current $25 fallback until the booking pricing source
      is fully normalized. The server remains the source of truth and
      never accepts the service amount directly from the client.
    */
    const serviceAmount =
      storedServiceAmount > 0 ? storedServiceAmount : 25;

    const marketplaceFeeAmount = MARKETPLACE_FEE_AMOUNT;

    const trustAndSafetyFeeAmount = TRUST_AND_SAFETY_FEE_AMOUNT;

    const tipAmount =
      requestedTipAmount > 0
        ? requestedTipAmount
        : TIP_AMOUNT_DEFAULT;

    const checkoutAmount = roundMoney(
      serviceAmount +
        marketplaceFeeAmount +
        trustAndSafetyFeeAmount +
        tipAmount,
    );

    const currency =
      typeof booking.currency === "string" &&
      booking.currency.trim()
        ? booking.currency.trim().toLowerCase()
        : "usd";

    const lineItems = [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: toCents(serviceAmount),
          product_data: {
            name:
              typeof booking.service === "string" &&
              booking.service.trim()
                ? booking.service.trim()
                : "Pet Care Booking",
            description: `${
              typeof booking.pet_name === "string" &&
              booking.pet_name.trim()
                ? booking.pet_name.trim()
                : "Pet"
            } • ${
              typeof booking.booking_date === "string"
                ? booking.booking_date
                : ""
            }`,
          },
        },
      },
    ];

    if (tipAmount > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency,
          unit_amount: toCents(tipAmount),
          product_data: {
            name: "Optional Guru Tip",
            description: "Optional appreciation for your Guru.",
          },
        },
      });
    }

    const session =
      await stripe.checkout.sessions.create({
        mode: "payment",

        /*
          Stripe Checkout controls eligible card and wallet methods.
          Do not force payment_method_types here.

          This allows SitGuru's Stripe Dashboard settings to display
          eligible card, Apple Pay, Google Pay, Link, Cash App Pay,
          and other approved Stripe-managed methods.

          PayPal and Venmo use a separate approved PayPal marketplace
          integration and must not be routed through this Stripe session.
        */
        customer_email: user.email || undefined,
        line_items: lineItems,

        metadata: {
          booking_id: String(booking.id),
          customer_id: String(
            booking.customer_id || "",
          ),
          sitter_id: String(booking.sitter_id || ""),
          payment_provider: "stripe",
          requested_payment_method:
            checkoutRail.requestedMethod,
          service_amount: String(serviceAmount),
          marketplace_fee_amount: String(
            marketplaceFeeAmount,
          ),
          trust_and_safety_fee_amount: String(
            trustAndSafetyFeeAmount,
          ),
          tip_amount: String(tipAmount),
          checkout_amount: String(checkoutAmount),
          fee_status: "free",
          checkout_model: "sitguru_unified_v1",
        },

        success_url: `${getBaseUrl()}/bookings/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${getBaseUrl()}/bookings?canceled=1`,
      });

    if (!session.url) {
      console.error(
        "Stripe checkout session was created without a URL:",
        session.id,
      );

      return json(
        req,
        {
          success: false,
          error: "Checkout was created but could not be opened.",
          code: "STRIPE_CHECKOUT_URL_MISSING",
        },
        500,
      );
    }

    const { error: updateError } =
      await supabaseAdmin
        .from("bookings")
        .update({
          stripe_checkout_session_id: session.id,
          payment_provider: "stripe",
          payment_status: "pending",
          marketplace_fee_amount:
            marketplaceFeeAmount,
          trust_and_safety_fee_amount:
            trustAndSafetyFeeAmount,
          tip_amount: tipAmount,
          checkout_amount: checkoutAmount,
          fee_status: "free",
        })
        .eq("id", booking.id)
        .eq("customer_id", user.id);

    if (updateError) {
      console.error(
        "Booking update after checkout error:",
        updateError,
      );

      try {
        await stripe.checkout.sessions.expire(
          session.id,
        );
      } catch (expireError) {
        console.error(
          "Unable to expire orphaned Stripe checkout session:",
          expireError,
        );
      }

      return json(
        req,
        {
          success: false,
          error:
            "Checkout was created but SitGuru could not securely attach it to the booking.",
          code: "BOOKING_PAYMENT_UPDATE_FAILED",
        },
        500,
      );
    }

    return json(req, {
      success: true,
      provider: "stripe",
      processor: "stripe",
      fundingSource:
        checkoutRail.fundingSource,
      requestedPaymentMethod:
        checkoutRail.requestedMethod,
      url: session.url,
      checkoutUrl: session.url,
      sessionId: session.id,
      stripeSessionId: session.id,
      bookingId: String(booking.id),
      serviceAmount,
      marketplaceFeeAmount,
      trustAndSafetyFeeAmount,
      tipAmount,
      checkoutAmount,
      currency,
      feeStatus: "free",
      availableProviders: [
        {
          processor: "stripe",
          enabled: true,
        },
        {
          processor: "paypal",
          methods: ["paypal", "venmo"],
          enabled: false,
          status: "awaiting_marketplace_approval",
        },
      ],
    });
  } catch (error) {
    console.error("Checkout create error:", error);

    return json(
      req,
      {
        success: false,
        error: "Unable to create checkout session.",
      },
      500,
    );
  }
}