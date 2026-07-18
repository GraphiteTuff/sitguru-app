import type { CSSProperties } from "react";
import Link from "next/link";
import Stripe from "stripe";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STRIPE_API_VERSION = "2026-03-25.dahlia";

type SuccessPageProps = {
  searchParams?: Promise<{
    session_id?: string;
    bookingId?: string;
    booking_id?: string;
  }>;
};

type BookingRow = Record<string, unknown>;
type PaymentLedgerRow = Record<string, unknown>;

type PaymentStatusKind =
  | "paid"
  | "processing"
  | "pending"
  | "failed"
  | "refunded"
  | "disputed"
  | "unknown";

type StripeSessionSnapshot = {
  session: Stripe.Checkout.Session | null;
  paymentIntentId: string;
  paymentIntentStatus: string;
  chargeId: string;
  receiptUrl: string;
  paymentMethodType: string;
  cardBrand: string;
  cardLast4: string;
  failureMessage: string;
  error: string;
};

type ConfettiPiece = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  rotate: number;
  shape: "rect" | "circle" | "pill";
  color: string;
};

const confettiPieces: ConfettiPiece[] = [
  { id: 1, left: 4, delay: 0, duration: 5.8, size: 12, rotate: 15, shape: "rect", color: "#10b981" },
  { id: 2, left: 8, delay: 0.1, duration: 6.4, size: 16, rotate: 35, shape: "pill", color: "#34d399" },
  { id: 3, left: 12, delay: 0.25, duration: 5.9, size: 10, rotate: 75, shape: "circle", color: "#f59e0b" },
  { id: 4, left: 16, delay: 0.05, duration: 6.8, size: 18, rotate: 110, shape: "rect", color: "#0ea5e9" },
  { id: 5, left: 20, delay: 0.2, duration: 5.7, size: 12, rotate: 140, shape: "pill", color: "#ec4899" },
  { id: 6, left: 24, delay: 0.35, duration: 6.5, size: 15, rotate: 210, shape: "rect", color: "#22c55e" },
  { id: 7, left: 28, delay: 0.08, duration: 6.1, size: 11, rotate: 250, shape: "circle", color: "#8b5cf6" },
  { id: 8, left: 32, delay: 0.18, duration: 6.9, size: 19, rotate: 300, shape: "pill", color: "#14b8a6" },
  { id: 9, left: 36, delay: 0.28, duration: 5.8, size: 13, rotate: 345, shape: "rect", color: "#f97316" },
  { id: 10, left: 40, delay: 0.04, duration: 6.6, size: 17, rotate: 25, shape: "circle", color: "#06b6d4" },
  { id: 11, left: 44, delay: 0.16, duration: 6.2, size: 12, rotate: 85, shape: "rect", color: "#84cc16" },
  { id: 12, left: 48, delay: 0.3, duration: 7.1, size: 20, rotate: 130, shape: "pill", color: "#eab308" },
  { id: 13, left: 52, delay: 0.12, duration: 6.3, size: 14, rotate: 180, shape: "rect", color: "#10b981" },
  { id: 14, left: 56, delay: 0.22, duration: 5.9, size: 11, rotate: 225, shape: "circle", color: "#f43f5e" },
  { id: 15, left: 60, delay: 0.07, duration: 6.7, size: 18, rotate: 275, shape: "pill", color: "#3b82f6" },
  { id: 16, left: 64, delay: 0.26, duration: 6.1, size: 13, rotate: 315, shape: "rect", color: "#a855f7" },
  { id: 17, left: 68, delay: 0.14, duration: 7, size: 16, rotate: 45, shape: "circle", color: "#22c55e" },
  { id: 18, left: 72, delay: 0.33, duration: 6.4, size: 12, rotate: 95, shape: "rect", color: "#fb7185" },
  { id: 19, left: 76, delay: 0.03, duration: 6.8, size: 19, rotate: 145, shape: "pill", color: "#0f766e" },
  { id: 20, left: 80, delay: 0.2, duration: 6, size: 14, rotate: 200, shape: "rect", color: "#facc15" },
  { id: 21, left: 84, delay: 0.1, duration: 7.2, size: 17, rotate: 255, shape: "circle", color: "#38bdf8" },
  { id: 22, left: 88, delay: 0.27, duration: 6.3, size: 13, rotate: 305, shape: "rect", color: "#16a34a" },
  { id: 23, left: 92, delay: 0.17, duration: 6.9, size: 20, rotate: 355, shape: "pill", color: "#f97316" },
  { id: 24, left: 96, delay: 0.32, duration: 5.8, size: 12, rotate: 65, shape: "circle", color: "#d946ef" },

  { id: 25, left: 6, delay: 0.55, duration: 6.2, size: 18, rotate: 120, shape: "pill", color: "#10b981" },
  { id: 26, left: 14, delay: 0.65, duration: 6.8, size: 13, rotate: 210, shape: "rect", color: "#60a5fa" },
  { id: 27, left: 22, delay: 0.5, duration: 7.3, size: 20, rotate: 285, shape: "circle", color: "#f59e0b" },
  { id: 28, left: 30, delay: 0.72, duration: 6.6, size: 15, rotate: 15, shape: "rect", color: "#ec4899" },
  { id: 29, left: 38, delay: 0.6, duration: 7.1, size: 19, rotate: 80, shape: "pill", color: "#22c55e" },
  { id: 30, left: 46, delay: 0.8, duration: 6.4, size: 14, rotate: 160, shape: "circle", color: "#8b5cf6" },
  { id: 31, left: 54, delay: 0.58, duration: 7.4, size: 21, rotate: 240, shape: "rect", color: "#06b6d4" },
  { id: 32, left: 62, delay: 0.7, duration: 6.7, size: 16, rotate: 320, shape: "pill", color: "#f43f5e" },
  { id: 33, left: 70, delay: 0.52, duration: 7, size: 12, rotate: 45, shape: "circle", color: "#84cc16" },
  { id: 34, left: 78, delay: 0.75, duration: 6.5, size: 18, rotate: 135, shape: "rect", color: "#eab308" },
  { id: 35, left: 86, delay: 0.62, duration: 7.2, size: 15, rotate: 215, shape: "pill", color: "#14b8a6" },
  { id: 36, left: 94, delay: 0.82, duration: 6.1, size: 20, rotate: 295, shape: "rect", color: "#fb7185" },
];


function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    return null;
  }

  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
  });
}

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function firstNonEmpty(...values: unknown[]) {
  for (const value of values) {
    const text = safeString(value);

    if (text) {
      return text;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
}

function safeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function dollarsToCents(value: unknown) {
  const amount = safeNumber(value);

  if (amount === null) {
    return null;
  }

  return Math.max(0, Math.round(amount * 100));
}

function formatMoney(amountCents: number | null, currencyValue: unknown) {
  const currency = safeString(currencyValue) || "usd";

  if (amountCents === null) {
    return "Not available";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amountCents / 100);
  } catch {
    return `$${(amountCents / 100).toFixed(2)}`;
  }
}

function humanize(value: unknown) {
  const text = safeString(value);

  if (!text) {
    return "";
  }

  return text
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatBookingDate(value: unknown) {
  const text = safeString(value);

  if (!text) {
    return "";
  }

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? `${text}T12:00:00`
    : text;

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return text;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

async function getAuthenticatedUserId() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return "";
    }

    return user.id;
  } catch (error) {
    console.error("Unable to resolve booking success user:", error);
    return "";
  }
}

async function retrieveCharge(
  stripe: Stripe,
  value: string | Stripe.Charge | null | undefined,
) {
  if (!value) {
    return null;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return await stripe.charges.retrieve(value);
  } catch (error) {
    console.error("Unable to retrieve Stripe charge for success page:", error);
    return null;
  }
}

function getPaymentMethodDetails(charge: Stripe.Charge | null) {
  const details = charge?.payment_method_details as unknown as
    | Record<string, unknown>
    | null
    | undefined;

  const card =
    details?.card && typeof details.card === "object"
      ? (details.card as Record<string, unknown>)
      : null;

  return {
    paymentMethodType: firstNonEmpty(details?.type),
    cardBrand: firstNonEmpty(card?.brand),
    cardLast4: firstNonEmpty(card?.last4),
  };
}

async function getStripeSessionSnapshot(
  sessionId: string,
): Promise<StripeSessionSnapshot> {
  const emptySnapshot: StripeSessionSnapshot = {
    session: null,
    paymentIntentId: "",
    paymentIntentStatus: "",
    chargeId: "",
    receiptUrl: "",
    paymentMethodType: "",
    cardBrand: "",
    cardLast4: "",
    failureMessage: "",
    error: "",
  };

  if (!sessionId) {
    return emptySnapshot;
  }

  const stripe = getStripeClient();

  if (!stripe) {
    return {
      ...emptySnapshot,
      error: "Secure payment verification is temporarily unavailable.",
    };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent.latest_charge"],
    });

    let paymentIntent: Stripe.PaymentIntent | null = null;

    if (typeof session.payment_intent === "string") {
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(
          session.payment_intent,
          {
            expand: ["latest_charge"],
          },
        );
      } catch (error) {
        console.error(
          "Unable to retrieve Stripe payment intent for success page:",
          error,
        );
      }
    } else if (session.payment_intent) {
      paymentIntent = session.payment_intent;
    }

    const charge = paymentIntent
      ? await retrieveCharge(stripe, paymentIntent.latest_charge)
      : null;

    const method = getPaymentMethodDetails(charge);

    return {
      session,
      paymentIntentId: paymentIntent?.id || "",
      paymentIntentStatus: paymentIntent?.status || "",
      chargeId: charge?.id || "",
      receiptUrl: charge?.receipt_url || "",
      paymentMethodType: method.paymentMethodType,
      cardBrand: method.cardBrand,
      cardLast4: method.cardLast4,
      failureMessage:
        paymentIntent?.last_payment_error?.message ||
        paymentIntent?.last_payment_error?.decline_code ||
        "",
      error: "",
    };
  } catch (error) {
    console.error("Unable to retrieve Stripe session:", error);

    return {
      ...emptySnapshot,
      error: "SitGuru could not verify this checkout session.",
    };
  }
}

async function fetchOwnedBooking(
  bookingId: string,
  userId: string,
): Promise<BookingRow | null> {
  if (!bookingId || !userId) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("customer_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Unable to load booking confirmation record:", error);
    return null;
  }

  return (data as BookingRow | null) || null;
}

async function fetchOwnedPaymentLedger({
  sessionId,
  bookingId,
  userId,
}: {
  sessionId: string;
  bookingId: string;
  userId: string;
}): Promise<PaymentLedgerRow | null> {
  if (!userId) {
    return null;
  }

  if (sessionId) {
    const { data, error } = await supabaseAdmin
      .from("booking_payments")
      .select("*")
      .eq("stripe_checkout_session_id", sessionId)
      .eq("payer_user_id", userId)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data as PaymentLedgerRow;
    }

    if (error) {
      console.error(
        "Unable to load booking payment ledger by Stripe session:",
        error,
      );
    }
  }

  if (bookingId) {
    const { data, error } = await supabaseAdmin
      .from("booking_payments")
      .select("*")
      .eq("booking_id", bookingId)
      .eq("payer_user_id", userId)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data as PaymentLedgerRow;
    }

    if (error) {
      console.error("Unable to load booking payment ledger by booking:", error);
    }
  }

  return null;
}

function normalizeStatus(value: unknown) {
  return safeString(value).toLowerCase().replace(/[\s-]+/g, "_");
}

function resolvePaymentStatusKind({
  ledgerStatus,
  bookingStatus,
  sessionStatus,
  paymentIntentStatus,
}: {
  ledgerStatus: unknown;
  bookingStatus: unknown;
  sessionStatus: unknown;
  paymentIntentStatus: unknown;
}): PaymentStatusKind {
  const ledger = normalizeStatus(ledgerStatus);
  const booking = normalizeStatus(bookingStatus);
  const session = normalizeStatus(sessionStatus);
  const intent = normalizeStatus(paymentIntentStatus);

  const terminalStatuses = [ledger, booking];

  if (
    terminalStatuses.some(
      (status) =>
        status === "refunded" ||
        status === "partially_refunded" ||
        status.includes("refund"),
    )
  ) {
    return "refunded";
  }

  if (
    terminalStatuses.some(
      (status) =>
        status === "disputed" ||
        status === "chargeback" ||
        status.includes("dispute"),
    )
  ) {
    return "disputed";
  }

  if (
    terminalStatuses.some(
      (status) =>
        status === "failed" ||
        status === "canceled" ||
        status === "cancelled" ||
        status === "expired",
    ) ||
    intent === "requires_payment_method" ||
    intent === "canceled"
  ) {
    return "failed";
  }

  if (
    session === "paid" ||
    session === "no_payment_required" ||
    intent === "succeeded" ||
    ledger === "paid" ||
    booking === "paid"
  ) {
    return "paid";
  }

  if (
    session === "processing" ||
    intent === "processing" ||
    ledger === "processing" ||
    booking === "processing"
  ) {
    return "processing";
  }

  if (
    session === "unpaid" ||
    ledger === "pending" ||
    booking === "pending" ||
    intent === "requires_action" ||
    intent === "requires_confirmation"
  ) {
    return "pending";
  }

  return "unknown";
}

function getStatusPresentation(
  kind: PaymentStatusKind,
  failureMessage: string,
) {
  if (kind === "paid") {
    return {
      icon: "✅",
      eyebrow: "Booking Confirmed",
      title: "Your booking is confirmed.",
      description:
        "Your payment was processed and the booking is recorded in SitGuru.",
      iconClass: "bg-emerald-100",
      badgeClass: "text-emerald-700",
      noticeClass: "border-emerald-200 bg-emerald-50 text-emerald-900",
    };
  }

  if (kind === "processing") {
    return {
      icon: "⏳",
      eyebrow: "Payment Processing",
      title: "Your payment is processing.",
      description:
        "SitGuru received your booking request. We will update the booking as soon as the payment processor finishes.",
      iconClass: "bg-sky-100",
      badgeClass: "text-sky-700",
      noticeClass: "border-sky-200 bg-sky-50 text-sky-900",
    };
  }

  if (kind === "pending") {
    return {
      icon: "🕒",
      eyebrow: "Confirmation Pending",
      title: "We are confirming your payment.",
      description:
        "Your booking request was received, but payment confirmation is still pending.",
      iconClass: "bg-amber-100",
      badgeClass: "text-amber-700",
      noticeClass: "border-amber-200 bg-amber-50 text-amber-900",
    };
  }

  if (kind === "refunded") {
    return {
      icon: "↩️",
      eyebrow: "Payment Refunded",
      title: "This payment has been refunded.",
      description:
        "The payment ledger shows a full or partial refund. Review your booking dashboard for the latest details.",
      iconClass: "bg-violet-100",
      badgeClass: "text-violet-700",
      noticeClass: "border-violet-200 bg-violet-50 text-violet-900",
    };
  }

  if (kind === "disputed") {
    return {
      icon: "⚠️",
      eyebrow: "Payment Under Review",
      title: "This payment is under review.",
      description:
        "A payment dispute or chargeback is associated with this booking. SitGuru support will keep the booking record updated.",
      iconClass: "bg-orange-100",
      badgeClass: "text-orange-700",
      noticeClass: "border-orange-200 bg-orange-50 text-orange-900",
    };
  }

  if (kind === "failed") {
    return {
      icon: "❗",
      eyebrow: "Payment Needs Attention",
      title: "Your payment was not completed.",
      description:
        failureMessage ||
        "The payment processor could not complete this payment. Return to your bookings to try again.",
      iconClass: "bg-rose-100",
      badgeClass: "text-rose-700",
      noticeClass: "border-rose-200 bg-rose-50 text-rose-900",
    };
  }

  return {
    icon: "🔎",
    eyebrow: "Verification In Progress",
    title: "We are checking your booking.",
    description:
      "SitGuru could not confirm the final payment status yet. Your dashboard will show the latest verified booking status.",
    iconClass: "bg-slate-100",
    badgeClass: "text-slate-700",
    noticeClass: "border-slate-200 bg-slate-50 text-slate-900",
  };
}

function resolveAmountCents({
  ledger,
  session,
  booking,
}: {
  ledger: PaymentLedgerRow | null;
  session: Stripe.Checkout.Session | null;
  booking: BookingRow | null;
}) {
  const ledgerAmount = safeNumber(ledger?.amount_cents);

  if (ledgerAmount !== null) {
    return Math.max(0, Math.round(ledgerAmount));
  }

  if (typeof session?.amount_total === "number") {
    return session.amount_total;
  }

  return dollarsToCents(
    firstNonEmpty(
      booking?.checkout_amount,
      booking?.total_customer_paid,
      booking?.customer_total_amount,
      booking?.amount_total,
    ),
  );
}

function resolvePaymentMethodLabel({
  ledger,
  booking,
  snapshot,
}: {
  ledger: PaymentLedgerRow | null;
  booking: BookingRow | null;
  snapshot: StripeSessionSnapshot;
}) {
  const cardBrand = firstNonEmpty(snapshot.cardBrand, ledger?.card_brand);
  const cardLast4 = firstNonEmpty(snapshot.cardLast4, ledger?.card_last4);

  if (cardBrand && cardLast4) {
    return `${humanize(cardBrand)} ending in ${cardLast4}`;
  }

  if (cardLast4) {
    return `Card ending in ${cardLast4}`;
  }

  const storedLabel = firstNonEmpty(
    ledger?.payment_method_label,
    booking?.payment_method_label,
  );

  if (storedLabel) {
    return humanize(storedLabel);
  }

  const paymentMethodType = firstNonEmpty(
    snapshot.paymentMethodType,
    ledger?.payment_method_type,
    booking?.payment_method_type,
  );

  return paymentMethodType
    ? humanize(paymentMethodType)
    : "Stripe Checkout";
}

function resolveRawStatus({
  ledger,
  booking,
  snapshot,
}: {
  ledger: PaymentLedgerRow | null;
  booking: BookingRow | null;
  snapshot: StripeSessionSnapshot;
}) {
  return firstNonEmpty(
    ledger?.status,
    booking?.payment_status,
    snapshot.session?.payment_status,
    snapshot.paymentIntentStatus,
  );
}

function ConfettiBurst() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {confettiPieces.map((piece) => {
        const style = {
          "--left": `${piece.left}%`,
          "--delay": `${piece.delay}s`,
          "--duration": `${piece.duration}s`,
          "--size": `${piece.size}px`,
          "--rotate": `${piece.rotate}deg`,
          "--color": piece.color,
        } as CSSProperties;

        return (
          <span
            key={piece.id}
            className={`confetti-piece confetti-${piece.shape}`}
            style={style}
          />
        );
      })}

      <style>{`
        .confetti-piece {
          position: absolute;
          top: -40px;
          left: var(--left);
          width: var(--size);
          height: calc(var(--size) * 1.45);
          background: var(--color);
          opacity: 0;
          transform: translate3d(0, -60px, 0) rotate(var(--rotate));
          animation: sitguru-confetti-fall var(--duration) ease-in forwards;
          animation-delay: var(--delay);
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.16);
        }

        .confetti-circle {
          border-radius: 9999px;
          height: var(--size);
        }

        .confetti-pill {
          border-radius: 9999px;
          width: calc(var(--size) * 0.72);
          height: calc(var(--size) * 1.9);
        }

        .confetti-rect {
          border-radius: 4px;
        }

        @keyframes sitguru-confetti-fall {
          0% {
            opacity: 0;
            transform: translate3d(0, -70px, 0) rotate(var(--rotate)) scale(1.15);
          }

          8% {
            opacity: 1;
          }

          38% {
            opacity: 1;
            transform: translate3d(-38px, 38vh, 0) rotate(calc(var(--rotate) + 190deg)) scale(1);
          }

          68% {
            opacity: 0.98;
            transform: translate3d(44px, 72vh, 0) rotate(calc(var(--rotate) + 410deg)) scale(0.96);
          }

          100% {
            opacity: 0;
            transform: translate3d(-28px, 112vh, 0) rotate(calc(var(--rotate) + 720deg)) scale(0.88);
          }
        }
      `}</style>
    </div>
  );
}


export default async function BookingSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  const sessionId = safeString(resolvedSearchParams.session_id);
  const fallbackBookingId =
    safeString(resolvedSearchParams.bookingId) ||
    safeString(resolvedSearchParams.booking_id);

  const [snapshot, userId] = await Promise.all([
    getStripeSessionSnapshot(sessionId),
    getAuthenticatedUserId(),
  ]);

  const bookingId =
    safeString(snapshot.session?.metadata?.booking_id) ||
    safeString(snapshot.session?.metadata?.bookingId) ||
    fallbackBookingId;

  const booking = await fetchOwnedBooking(bookingId, userId);

  const ledger = await fetchOwnedPaymentLedger({
    sessionId,
    bookingId,
    userId,
  });

  const statusKind = resolvePaymentStatusKind({
    ledgerStatus: ledger?.status,
    bookingStatus: booking?.payment_status,
    sessionStatus: snapshot.session?.payment_status,
    paymentIntentStatus: snapshot.paymentIntentStatus,
  });

  const failureMessage = firstNonEmpty(
    snapshot.failureMessage,
    ledger?.failure_message,
    booking?.payment_failure_message,
  );

  const presentation = getStatusPresentation(statusKind, failureMessage);
  const rawStatus = resolveRawStatus({
    ledger,
    booking,
    snapshot,
  });

  const currency = firstNonEmpty(
    ledger?.currency,
    snapshot.session?.currency,
    booking?.currency,
    "usd",
  );

  const amountCents = resolveAmountCents({
    ledger,
    session: snapshot.session,
    booking,
  });

  const provider = firstNonEmpty(
    ledger?.provider,
    booking?.payment_provider,
    snapshot.session ? "stripe" : "",
  );

  const paymentMethodLabel = resolvePaymentMethodLabel({
    ledger,
    booking,
    snapshot,
  });

  const receiptUrl = firstNonEmpty(
    snapshot.receiptUrl,
    ledger?.receipt_url,
    booking?.receipt_url,
    booking?.stripe_receipt_url,
  );

  const customerEmail = firstNonEmpty(
    snapshot.session?.customer_details?.email,
    snapshot.session?.customer_email,
    booking?.customer_email,
  );

  const serviceLabel = firstNonEmpty(
    booking?.service,
    booking?.service_name,
    booking?.service_type,
  );

  const petName = firstNonEmpty(
    booking?.pet_name,
    booking?.petName,
  );

  const bookingDate = formatBookingDate(
    firstNonEmpty(
      booking?.booking_date,
      booking?.service_date,
      booking?.start_date,
    ),
  );

  const isLiveMode = snapshot.session?.livemode === true;
  const isTestMode =
    snapshot.session?.livemode === false ||
    sessionId.toLowerCase().startsWith("cs_test_");

  const showConfetti = statusKind === "paid";
  const verificationWarning =
    snapshot.error && !ledger && !booking ? snapshot.error : "";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_28%),linear-gradient(to_bottom_right,_#ecfdf5,_#f8fafc,_#ffffff)] px-4 py-10 sm:px-6 lg:px-8">
      {showConfetti ? <ConfettiBurst /> : null}

      <div className="mx-auto max-w-3xl">
        <section className="relative rounded-[32px] border border-emerald-100 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-10">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl shadow-[0_10px_30px_rgba(15,23,42,0.10)] ${presentation.iconClass}`}
          >
            {presentation.icon}
          </div>

          <p
            className={`mt-6 text-center text-xs font-semibold uppercase tracking-[0.26em] ${presentation.badgeClass}`}
          >
            {presentation.eyebrow}
          </p>

          <h1 className="mt-3 text-center text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
            {presentation.title}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-7 text-slate-600">
            {presentation.description}
          </p>

          {verificationWarning ? (
            <div
              className={`mx-auto mt-6 max-w-2xl rounded-2xl border px-5 py-4 text-center ${presentation.noticeClass}`}
            >
              <p className="text-sm font-black">Payment verification notice</p>
              <p className="mt-1 text-sm leading-6">{verificationWarning}</p>
            </div>
          ) : null}

          {isTestMode ? (
            <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-center">
              <p className="text-sm font-black text-amber-800">
                Test mode payment
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-800/90">
                This checkout used Stripe test mode. No live customer money was
                charged.
              </p>
            </div>
          ) : isLiveMode ? (
            <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-center">
              <p className="text-sm font-black text-emerald-800">
                Secure live payment
              </p>
              <p className="mt-1 text-sm leading-6 text-emerald-800/90">
                This payment was processed through SitGuru&apos;s live Stripe
                checkout.
              </p>
            </div>
          ) : null}

          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                  SitGuru payment record
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                  Booking summary
                </h2>
              </div>

              {receiptUrl ? (
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
                >
                  View Stripe receipt
                </a>
              ) : null}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Payment Status
                </p>
                <p className="mt-2 text-sm font-black text-slate-900">
                  {humanize(rawStatus) || humanize(statusKind)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Amount
                </p>
                <p className="mt-2 text-sm font-black text-slate-900">
                  {formatMoney(amountCents, currency)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Payment Provider
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  {provider ? humanize(provider) : "Not available"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Payment Method
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  {paymentMethodLabel}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Booking ID
                </p>
                <p className="mt-2 break-all text-sm font-medium text-slate-800">
                  {bookingId || "Pending"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Customer Email
                </p>
                <p className="mt-2 break-all text-sm font-medium text-slate-800">
                  {customerEmail || "Available in your account"}
                </p>
              </div>

              {serviceLabel ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Service
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {serviceLabel}
                  </p>
                </div>
              ) : null}

              {petName || bookingDate ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Care Details
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {[petName, bookingDate].filter(Boolean).join(" • ")}
                  </p>
                </div>
              ) : null}
            </div>

            <details className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-black text-slate-800">
                Payment references
              </summary>

              <div className="mt-4 grid gap-3 text-xs text-slate-600">
                <div>
                  <p className="font-black uppercase tracking-[0.12em] text-slate-500">
                    Checkout Session
                  </p>
                  <p className="mt-1 break-all font-medium">
                    {sessionId || "Not available"}
                  </p>
                </div>

                <div>
                  <p className="font-black uppercase tracking-[0.12em] text-slate-500">
                    Payment Intent
                  </p>
                  <p className="mt-1 break-all font-medium">
                    {firstNonEmpty(
                      snapshot.paymentIntentId,
                      ledger?.stripe_payment_intent_id,
                      booking?.stripe_payment_intent_id,
                    ) || "Not available"}
                  </p>
                </div>

                <div>
                  <p className="font-black uppercase tracking-[0.12em] text-slate-500">
                    Charge
                  </p>
                  <p className="mt-1 break-all font-medium">
                    {firstNonEmpty(
                      snapshot.chargeId,
                      ledger?.stripe_charge_id,
                      booking?.stripe_charge_id,
                    ) || "Not available"}
                  </p>
                </div>
              </div>
            </details>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/customer/dashboard"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
            >
              Go to Customer Dashboard
            </Link>

            <Link
              href="/bookings"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
            >
              View My Bookings
            </Link>

            <Link
              href="/search"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
            >
              Browse More Gurus
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}