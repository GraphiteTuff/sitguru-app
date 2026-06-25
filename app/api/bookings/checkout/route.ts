import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

const MARKETPLACE_FEE_AMOUNT = 0;
const TRUST_AND_SAFETY_FEE_AMOUNT = 0;
const TIP_AMOUNT_DEFAULT = 0;

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function toCents(amount: number) {
  return Math.round(amount * 100);
}

function normalizeMoneyValue(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const bookingId = String(body.bookingId || "").trim();
    const requestedTipAmount = normalizeMoneyValue(
      body.tipAmount,
      TIP_AMOUNT_DEFAULT,
    );

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required" },
        { status: 400 },
      );
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .eq("customer_id", user.id)
      .single();

    if (bookingError || !booking) {
      console.error("Checkout booking lookup error:", bookingError);
      return NextResponse.json(
        {
          error: "Booking not found",
          debug: {
            bookingId,
            userId: user.id,
          },
        },
        { status: 404 },
      );
    }

    const serviceAmount =
      typeof booking.price === "number" && booking.price > 0
        ? booking.price
        : 25;

    const marketplaceFeeAmount = MARKETPLACE_FEE_AMOUNT;
    const trustAndSafetyFeeAmount = TRUST_AND_SAFETY_FEE_AMOUNT;
    const tipAmount =
      requestedTipAmount > 0 ? requestedTipAmount : TIP_AMOUNT_DEFAULT;

    const checkoutAmount =
      serviceAmount + marketplaceFeeAmount + trustAndSafetyFeeAmount + tipAmount;

    const currency =
      typeof booking.currency === "string" && booking.currency.trim()
        ? booking.currency.toLowerCase()
        : "usd";

    const lineItems = [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: toCents(serviceAmount),
          product_data: {
            name: booking.service || "Pet Care Booking",
            description: `${booking.pet_name || "Pet"} • ${
              booking.booking_date || ""
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

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      /*
        Pet Parent payments must stay in SitGuru-controlled Stripe Checkout.
        Intentionally omit payment_method_types so Checkout uses SitGuru's
        Stripe Dashboard payment method settings and can show eligible
        Stripe-managed options instead of locking this flow to card-only.
        Do not add or route any direct Pet Parent-to-Guru payment options here.
      */
      customer_email: user.email ?? undefined,
      line_items: lineItems,
      metadata: {
        booking_id: String(booking.id),
        customer_id: String(booking.customer_id || ""),
        sitter_id: String(booking.sitter_id || ""),
        service_amount: String(serviceAmount),
        marketplace_fee_amount: String(marketplaceFeeAmount),
        trust_and_safety_fee_amount: String(trustAndSafetyFeeAmount),
        tip_amount: String(tipAmount),
        checkout_amount: String(checkoutAmount),
        fee_status: "free",
      },
      success_url: `${getBaseUrl()}/bookings/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getBaseUrl()}/bookings?canceled=1`,
    });

    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({
        stripe_checkout_session_id: session.id,
        payment_status: "pending",
        marketplace_fee_amount: marketplaceFeeAmount,
        trust_and_safety_fee_amount: trustAndSafetyFeeAmount,
        tip_amount: tipAmount,
        checkout_amount: checkoutAmount,
        fee_status: "free",
      })
      .eq("id", booking.id);

    if (updateError) {
      console.error("Booking update after checkout error:", updateError);
      return NextResponse.json(
        { error: "Checkout created but failed to update booking" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      bookingId: String(booking.id),
      serviceAmount,
      marketplaceFeeAmount,
      trustAndSafetyFeeAmount,
      tipAmount,
      checkoutAmount,
      feeStatus: "free",
    });
  } catch (error) {
    console.error("Checkout create error:", error);
    return NextResponse.json(
      { error: "Unable to create checkout session" },
      { status: 500 },
    );
  }
}
