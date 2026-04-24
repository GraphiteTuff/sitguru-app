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

const SITGURU_FEE_PERCENT = 0.08;

type BookingRow = Record<string, unknown>;

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

async function updateCheckoutStarted(
  bookingId: string,
  values: {
    stripeSessionId: string;
    subtotalAmount: number;
    sitguruFeeAmount: number;
    guruNetAmount: number;
    totalCustomerPaid: number;
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
      guru_net_amount: values.guruNetAmount,
      total_customer_paid: values.totalCustomerPaid,
      tax_status: "not_calculated",
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
    message.includes("guru_net_amount") ||
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
    const body = await req.json().catch(() => null);

    const bookingId = firstNonEmpty(
      body?.bookingId,
      body?.booking_id,
      body?.id
    );

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing bookingId" },
        { status: 400 }
      );
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

    const sitguruFeeCents = Math.round(subtotalCents * SITGURU_FEE_PERCENT);
    const guruNetCents = subtotalCents - sitguruFeeCents;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: user.email ?? undefined,
      automatic_tax: {
        enabled: true,
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `SitGuru Booking - ${petName}`,
              description: serviceName,
            },
            unit_amount: subtotalCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: sitguruFeeCents,
        metadata: {
          booking_id: String(booking.id),
          booking_owner_id: ownerId || user.id,
          guru_id: asTrimmedString(booking.guru_id),
          guru_slug: asTrimmedString(booking.guru_slug),
          pet_id: asTrimmedString(booking.pet_id),
          pet_name: petName,
          service: serviceName,
          subtotal_cents: String(subtotalCents),
          sitguru_fee_cents: String(sitguruFeeCents),
          guru_net_cents: String(guruNetCents),
        },
      },
      success_url: `${baseUrl}/bookings/success?bookingId=${String(
        booking.id
      )}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/bookings/cancel?bookingId=${String(booking.id)}`,
      metadata: {
        booking_id: String(booking.id),
        booking_owner_id: ownerId || user.id,
        guru_id: asTrimmedString(booking.guru_id),
        guru_slug: asTrimmedString(booking.guru_slug),
        pet_id: asTrimmedString(booking.pet_id),
        pet_name: petName,
        service: serviceName,
        subtotal_cents: String(subtotalCents),
        sitguru_fee_cents: String(sitguruFeeCents),
        guru_net_cents: String(guruNetCents),
      },
    });

    await updateCheckoutStarted(String(booking.id), {
      stripeSessionId: session.id,
      subtotalAmount: centsToDollars(subtotalCents),
      sitguruFeeAmount: centsToDollars(sitguruFeeCents),
      guruNetAmount: centsToDollars(guruNetCents),
      totalCustomerPaid: centsToDollars(subtotalCents),
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
        sitguruFeeAmount: centsToDollars(sitguruFeeCents),
        guruNetAmount: centsToDollars(guruNetCents),
        taxAmount: 0,
        totalCustomerPaid: centsToDollars(subtotalCents),
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