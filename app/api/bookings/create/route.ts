import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type BookingCreateBody = {
  guruId?: string | number | null;
  guruSlug?: string | null;
  slug?: string | null;
  guruName?: string | null;

  petId?: string | null;
  petName?: string | null;

  serviceType?: string | null;
  requestedDate?: string | null;
  bookingDate?: string | null;
  timeWindow?: string | null;
  visitLength?: string | null;

  servicePrice?: number | string | null;
  platformFee?: number | string | null;
  total?: number | string | null;

  customerName?: string | null;
  customerEmail?: string | null;

  notes?: string | null;

  bookingType?: string | null;
  complianceAccepted?: boolean | null;
  termsAccepted?: boolean | null;
};

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
    { status }
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

function getMissingColumnName(errorMessage: string) {
  const quotedColumnMatch = errorMessage.match(/'([^']+)' column/i);
  if (quotedColumnMatch?.[1]) return quotedColumnMatch[1];

  const columnDoesNotExistMatch = errorMessage.match(
    /column "([^"]+)" does not exist/i
  );
  if (columnDoesNotExistMatch?.[1]) return columnDoesNotExistMatch[1];

  return null;
}

async function insertBookingWithMissingColumnRetry(
  payload: Record<string, unknown>
) {
  let insertPayload = { ...payload };

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .insert(insertPayload)
      .select("*")
      .single();

    if (!error) {
      return { data, error: null };
    }

    console.error("BOOKING INSERT ERROR:", error);

    const message = error.message || "";
    const missingColumn = getMissingColumnName(message);

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
  payload: Record<string, unknown>
) {
  let updatePayload = { ...payload };

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { error } = await supabaseAdmin
      .from("bookings")
      .update(updatePayload)
      .eq("id", bookingId);

    if (!error) return;

    console.error("BOOKING UPDATE ERROR:", error);

    const missingColumn = getMissingColumnName(error.message || "");

    if (missingColumn && missingColumn in updatePayload) {
      console.warn("Removing missing update column and retrying:", missingColumn);
      delete updatePayload[missingColumn];
      continue;
    }

    return;
  }
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
        400
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

    const guruSlug = toText(body.guruSlug || body.slug);
    const guruId = body.guruId ?? null;

    const petId = body.petId || null;
    const petName = toText(body.petName);
    const serviceType = toText(body.serviceType, "Drop-In Visit");
    const requestedDate = toText(body.requestedDate || body.bookingDate);
    const timeWindow = toText(body.timeWindow, "Morning");
    const visitLength = toText(body.visitLength, "30 minutes");
    const notes = toText(body.notes);

    const servicePrice = toNumber(body.servicePrice, 25);
    const platformFee = toNumber(body.platformFee, 5);
    const total = toNumber(body.total, servicePrice + platformFee);

    const customerName = toText(body.customerName, "SitGuru Customer");
    const customerEmail = toText(body.customerEmail || user.email);

    if (!guruSlug && !guruId) {
      return jsonError("Missing Guru information for this booking.", 400);
    }

    if (!petName) {
      return jsonError("Missing pet name for this booking.", 400);
    }

    if (!requestedDate) {
      return jsonError("Missing requested booking date.", 400);
    }

    if (!customerEmail) {
      return jsonError("Missing customer email for checkout.", 400);
    }

    if (!total || total <= 0) {
      return jsonError("Missing valid checkout total for this booking.", 400);
    }

    const now = new Date().toISOString();

    const bookingPayload: Record<string, unknown> = {
      customer_id: user.id,
      user_id: user.id,
      pet_parent_id: user.id,

      guru_id: guruId,
      guru_slug: guruSlug,

      pet_id: petId,
      pet_name: petName,

      customer_name: customerName,
      customer_email: customerEmail,

      service_type: serviceType,
      requested_date: requestedDate,
      booking_date: requestedDate,
      time_window: timeWindow,
      visit_length: visitLength,

      notes,

      service_price: servicePrice,
      platform_fee: platformFee,
      total,
      amount_total: total,
      total_amount: total,

      booking_type: body.bookingType || "instant_booking",

      compliance_accepted: body.complianceAccepted ?? true,
      compliance_accepted_at: now,

      terms_accepted: body.termsAccepted ?? true,
      terms_accepted_at: now,

      status: "pending_checkout",
      payment_status: "checkout_started",

      created_at: now,
      updated_at: now,
    };

    const { data: booking, error: bookingError } =
      await insertBookingWithMissingColumnRetry(bookingPayload);

    if (bookingError || !booking) {
      return jsonError(
        bookingError?.message || "Could not create the booking.",
        500,
        bookingError
      );
    }

    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      const fallbackUrl = `/customer/dashboard?booking=created&guru=${encodeURIComponent(
        guruSlug
      )}`;

      return NextResponse.json({
        success: true,
        booking,
        bookingId: String(booking.id),
        checkoutUrl: fallbackUrl,
        checkout_url: fallbackUrl,
        url: fallbackUrl,
        warning:
          "Booking was created, but STRIPE_SECRET_KEY is missing so Stripe checkout was not started.",
      });
    }

    const stripe = new Stripe(stripeSecretKey);

    const bookingId = String(booking.id);

    let session: Stripe.Checkout.Session;

    try {
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: customerEmail,
        success_url: `${origin}/customer/dashboard?booking=confirmed&booking_id=${encodeURIComponent(
          bookingId
        )}&guru=${encodeURIComponent(guruSlug)}`,
        cancel_url: `${origin}/book/${encodeURIComponent(
          guruSlug
        )}?checkout=cancelled`,
        metadata: {
          booking_id: bookingId,
          customer_id: user.id,
          guru_id: guruId ? String(guruId) : "",
          guru_slug: guruSlug,
          pet_id: petId || "",
          pet_name: petName,
          service_type: serviceType,
          requested_date: requestedDate,
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: Math.round(total * 100),
              product_data: {
                name: `SitGuru ${serviceType}`,
                description: `${petName} • ${requestedDate} • ${timeWindow} • ${visitLength}`,
              },
            },
          },
        ],
      });
    } catch (stripeError) {
      return jsonError(
        stripeError instanceof Error
          ? stripeError.message
          : "Stripe checkout session could not be created.",
        500,
        stripeError
      );
    }

    if (!session.url) {
      return jsonError(
        "Stripe checkout session was created, but no checkout URL was returned.",
        500,
        {
          stripeSessionId: session.id,
        }
      );
    }

    await safeUpdateBooking(bookingId, {
      stripe_checkout_session_id: session.id,
      checkout_session_id: session.id,
      stripe_payment_status: session.payment_status,
      payment_status: "checkout_started",
      checkout_url: session.url,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      booking,
      bookingId,
      checkoutUrl: session.url,
      checkout_url: session.url,
      url: session.url,
      stripeSessionId: session.id,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Something went wrong while creating the booking.",
      500,
      error
    );
  }
}
