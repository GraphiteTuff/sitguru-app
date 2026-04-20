import { redirect } from "next/navigation";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import BookingSuccessClient from "./BookingSuccessClient";

export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-03-31.basil",
});

type SuccessPageProps = {
  searchParams: Promise<{
    bookingId?: string;
    session_id?: string;
  }>;
};

async function markBookingPaid(bookingId: string, sessionId: string) {
  const primaryUpdate = await supabaseAdmin
    .from("bookings")
    .update({
      status: "confirmed",
      payment_status: "paid",
      stripe_session_id: sessionId,
    })
    .eq("id", bookingId);

  if (!primaryUpdate.error) {
    return;
  }

  const message = primaryUpdate.error.message || "";

  if (
    message.includes("stripe_session_id") ||
    message.includes("column") ||
    message.includes("schema cache")
  ) {
    const fallbackUpdate = await supabaseAdmin
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "paid",
      })
      .eq("id", bookingId);

    if (fallbackUpdate.error) {
      console.error("Booking success fallback update error:", fallbackUpdate.error);
    }

    return;
  }

  console.error("Booking success update error:", primaryUpdate.error);
}

export default async function BookingSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const params = await searchParams;
  const bookingId =
    typeof params.bookingId === "string" ? params.bookingId.trim() : "";
  const sessionId =
    typeof params.session_id === "string" ? params.session_id.trim() : "";

  if (!bookingId || !sessionId) {
    redirect("/bookings/cancel");
  }

  let session: Stripe.Checkout.Session;

  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    console.error("Stripe success session retrieve error:", error);
    redirect("/bookings/cancel");
  }

  const sessionBookingId =
    typeof session.metadata?.booking_id === "string"
      ? session.metadata.booking_id.trim()
      : "";

  const paymentComplete =
    session.payment_status === "paid" || session.status === "complete";

  if (!paymentComplete || sessionBookingId !== bookingId) {
    redirect("/bookings/cancel");
  }

  await markBookingPaid(bookingId, sessionId);

  return <BookingSuccessClient bookingId={bookingId} />;
}