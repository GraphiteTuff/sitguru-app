import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function toCents(amount: number) {
  return Math.round(amount * 100);
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

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required" },
        { status: 400 }
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
        { status: 404 }
      );
    }

    const amount =
      typeof booking.price === "number" && booking.price > 0
        ? booking.price
        : 25;

    const currency =
      typeof booking.currency === "string" && booking.currency.trim()
        ? booking.currency.toLowerCase()
        : "usd";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: user.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: toCents(amount),
            product_data: {
              name: booking.service || "Pet Care Booking",
              description: `${booking.pet_name || "Pet"} • ${booking.booking_date || ""}`,
            },
          },
        },
      ],
      metadata: {
        booking_id: String(booking.id),
        customer_id: String(booking.customer_id || ""),
        sitter_id: String(booking.sitter_id || ""),
      },
      success_url: `${getBaseUrl()}/bookings/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getBaseUrl()}/bookings?canceled=1`,
    });

    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({
        stripe_checkout_session_id: session.id,
        payment_status: "pending",
      })
      .eq("id", booking.id);

    if (updateError) {
      console.error("Booking update after checkout error:", updateError);
      return NextResponse.json(
        { error: "Checkout created but failed to update booking" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      bookingId: String(booking.id),
    });
  } catch (error) {
    console.error("Checkout create error:", error);
    return NextResponse.json(
      { error: "Unable to create checkout session" },
      { status: 500 }
    );
  }
}