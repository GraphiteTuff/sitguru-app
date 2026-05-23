import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment");
}

if (!stripeWebhookSecret) {
  throw new Error("Missing STRIPE_WEBHOOK_SECRET in environment");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-03-25.dahlia",
});

const webhookSecret = stripeWebhookSecret;

const MARKETPLACE_FEE_AMOUNT = 0;
const TRUST_AND_SAFETY_FEE_AMOUNT = 0;

function centsToDollars(cents: number | null | undefined) {
  const value = typeof cents === "number" && Number.isFinite(cents) ? cents : 0;
  return Number((value / 100).toFixed(2));
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseMoneyMetadata(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function isTrustSafetyScreeningSession(session: Stripe.Checkout.Session) {
  return session.metadata?.purpose === "trust_safety_screening";
}

async function getPaymentIntentDetails(session: Stripe.Checkout.Session) {
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : "";

  let stripeChargeId = "";
  let paymentIntentStatus = "";

  if (!paymentIntentId) {
    return {
      paymentIntentId,
      stripeChargeId,
      paymentIntentStatus,
    };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });

    paymentIntentStatus = paymentIntent.status || "";

    if (
      paymentIntent.latest_charge &&
      typeof paymentIntent.latest_charge !== "string"
    ) {
      stripeChargeId = paymentIntent.latest_charge.id;
    } else if (typeof paymentIntent.latest_charge === "string") {
      stripeChargeId = paymentIntent.latest_charge;
    }
  } catch (error) {
    console.error("Failed to retrieve payment intent:", error);
  }

  return {
    paymentIntentId,
    stripeChargeId,
    paymentIntentStatus,
  };
}

async function updateBookingPaidFromCheckoutSession(
  session: Stripe.Checkout.Session,
) {
  const bookingId = asTrimmedString(session.metadata?.booking_id);

  if (!bookingId) {
    console.warn("No booking_id in checkout.session.completed metadata");
    return;
  }

  const serviceAmount = parseMoneyMetadata(
    session.metadata?.service_amount,
    centsToDollars(session.amount_subtotal),
  );

  const marketplaceFeeAmount = MARKETPLACE_FEE_AMOUNT;
  const trustAndSafetyFeeAmount = TRUST_AND_SAFETY_FEE_AMOUNT;
  const tipAmount = parseMoneyMetadata(session.metadata?.tip_amount, 0);

  const subtotalCents =
    typeof session.amount_subtotal === "number" ? session.amount_subtotal : 0;

  const totalCents =
    typeof session.amount_total === "number"
      ? session.amount_total
      : subtotalCents;

  const taxDetailsAmount =
    session.total_details?.amount_tax &&
    Number.isFinite(session.total_details.amount_tax)
      ? session.total_details.amount_tax
      : 0;

  const taxCents = taxDetailsAmount || Math.max(totalCents - subtotalCents, 0);

  const checkoutAmount = parseMoneyMetadata(
    session.metadata?.checkout_amount,
    centsToDollars(totalCents),
  );

  const guruNetAmount = Number((serviceAmount + tipAmount).toFixed(2));

  const { paymentIntentId, stripeChargeId, paymentIntentStatus } =
    await getPaymentIntentDetails(session);

  const updatePayload: Record<string, unknown> = {
    status: "confirmed",
    payment_status: paymentIntentStatus || "paid",
    stripe_session_id: session.id,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId || null,
    stripe_charge_id: stripeChargeId || null,
    currency: session.currency || "usd",

    subtotal_amount: serviceAmount,
    sales_tax_amount: centsToDollars(taxCents),
    total_customer_paid: checkoutAmount,
    tax_status: taxCents > 0 ? "collected" : "not_applicable",

    marketplace_fee_amount: marketplaceFeeAmount,
    trust_and_safety_fee_amount: trustAndSafetyFeeAmount,
    sitguru_fee_amount: marketplaceFeeAmount,
    platform_fee_amount: marketplaceFeeAmount,
    tip_amount: tipAmount,
    guru_tip_amount: tipAmount,
    checkout_amount: checkoutAmount,
    fee_status: "free",

    guru_net_amount: guruNetAmount,
    payout_status: "pending",
  };

  const { error } = await supabaseAdmin
    .from("bookings")
    .update(updatePayload)
    .eq("id", bookingId);

  if (error) {
    console.error("Error updating paid booking:", error);
  } else {
    console.log("Payment completed for booking:", bookingId);
  }
}

async function updateBookingExpiredFromCheckoutSession(
  session: Stripe.Checkout.Session,
) {
  const bookingId = asTrimmedString(session.metadata?.booking_id);

  if (!bookingId) {
    console.warn("No booking_id in checkout.session.expired metadata");
    return;
  }

  const { error } = await supabaseAdmin
    .from("bookings")
    .update({
      payment_status: "expired",
    })
    .eq("id", bookingId);

  if (error) {
    console.error("Error updating expired booking:", error);
  } else {
    console.log("Payment expired for booking:", bookingId);
  }
}

async function updateBookingRefundedFromCharge(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : "";

  if (!paymentIntentId) return;

  const { error } = await supabaseAdmin
    .from("bookings")
    .update({
      payment_status: "refunded",
      payout_status: "adjusted",
    })
    .eq("stripe_payment_intent_id", paymentIntentId);

  if (error) {
    console.error("Error updating refunded booking:", error);
  } else {
    console.log("Charge refunded for payment intent:", paymentIntentId);
  }
}

async function skipPausedTrustSafetyCheckoutSession(
  session: Stripe.Checkout.Session,
  eventType: string,
) {
  const guruId = asTrimmedString(session.metadata?.guru_id);

  console.log("Paused Trust & Safety Stripe checkout event ignored:", {
    eventType,
    sessionId: session.id,
    guruId,
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
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature error:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (isTrustSafetyScreeningSession(session)) {
          await skipPausedTrustSafetyCheckoutSession(session, event.type);
        } else {
          await updateBookingPaidFromCheckoutSession(session);
        }

        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (isTrustSafetyScreeningSession(session)) {
          await skipPausedTrustSafetyCheckoutSession(session, event.type);
        } else {
          await updateBookingExpiredFromCheckoutSession(session);
        }

        break;
      }

      case "invoice.paid":
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await skipPausedTrustSafetyInvoice(invoice);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await skipPausedTrustSafetySubscription(subscription);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await updateBookingRefundedFromCharge(charge);
        break;
      }

      default: {
        console.log(`Unhandled Stripe event type: ${event.type}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}