import type { CSSProperties } from "react";
import Link from "next/link";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2026-03-25.dahlia",
    })
  : null;

type SuccessPageProps = {
  searchParams?: Promise<{
    session_id?: string;
    bookingId?: string;
    booking_id?: string;
  }>;
};

type BookingRow = Record<string, unknown>;

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

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function safeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatMoney(amountTotal: unknown, currencyValue: unknown) {
  const amount = safeNumber(amountTotal);
  const currency = safeString(currencyValue) || "usd";

  if (amount === null) return "Not available";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

async function getBookingFromSession(
  sessionId: string,
  fallbackBookingId?: string
): Promise<BookingRow | null> {
  if (!stripe || !sessionId) {
    return fallbackBookingId
      ? {
          id: fallbackBookingId,
          payment_status: "paid",
          status: "confirmed",
        }
      : null;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    const bookingId =
      safeString(session.metadata?.bookingId) ||
      safeString(session.metadata?.booking_id) ||
      safeString(fallbackBookingId);

    if (!bookingId) {
      return null;
    }

    return {
      id: bookingId,
      payment_status: session.payment_status || null,
      customer_email: session.customer_details?.email || null,
      amount_total: session.amount_total || null,
      currency: session.currency || null,
      livemode: session.livemode,
      status: "confirmed",
    };
  } catch (error) {
    console.error("Unable to retrieve Stripe session:", error);

    return fallbackBookingId
      ? {
          id: fallbackBookingId,
          payment_status: "paid",
          status: "confirmed",
        }
      : null;
  }
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

  const booking = sessionId
    ? await getBookingFromSession(sessionId, fallbackBookingId)
    : fallbackBookingId
      ? await getBookingFromSession("", fallbackBookingId)
      : null;

  const isLiveMode = booking?.livemode === true;
  const isTestMode =
    booking?.livemode === false || sessionId.toLowerCase().startsWith("cs_test_");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_28%),linear-gradient(to_bottom_right,_#ecfdf5,_#f8fafc,_#ffffff)] px-4 py-10 sm:px-6 lg:px-8">
      <ConfettiBurst />

      <div className="mx-auto max-w-3xl">
        <section className="relative rounded-[32px] border border-emerald-100 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl shadow-[0_10px_30px_rgba(16,185,129,0.18)]">
            ✅
          </div>

          <p className="mt-6 text-center text-xs font-semibold uppercase tracking-[0.26em] text-emerald-700">
            Booking Confirmed
          </p>

          <h1 className="mt-3 text-center text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
            Your booking request was successfully submitted.
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-7 text-slate-600">
            Thank you for booking with SitGuru. Your payment was processed and your
            request has been recorded.
          </p>

          {isTestMode ? (
            <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-center">
              <p className="text-sm font-black text-amber-800">
                Test mode payment
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-800/90">
                This booking was completed in Stripe sandbox/test mode. No live
                customer money was charged.
              </p>
            </div>
          ) : isLiveMode ? (
            <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-center">
              <p className="text-sm font-black text-emerald-800">
                Live payment
              </p>
              <p className="mt-1 text-sm leading-6 text-emerald-800/90">
                This booking was completed through live Stripe checkout.
              </p>
            </div>
          ) : null}

          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-3xl font-black tracking-tight text-slate-950">
              Booking summary
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Session ID
                </p>
                <p className="mt-2 break-all text-sm font-medium text-slate-800">
                  {sessionId || "Not available"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Booking ID
                </p>
                <p className="mt-2 break-all text-sm font-medium text-slate-800">
                  {safeString(booking?.id) || fallbackBookingId || "Pending"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Payment Status
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  {safeString(booking?.payment_status) || "Paid"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Customer Email
                </p>
                <p className="mt-2 break-all text-sm font-medium text-slate-800">
                  {safeString(booking?.customer_email) || "Not available"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Payment Mode
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  {isLiveMode ? "Live" : isTestMode ? "Test / Sandbox" : "Not available"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Amount
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  {formatMoney(booking?.amount_total, booking?.currency)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/customer/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Go to Customer Dashboard
            </Link>

            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
            >
              Browse More Gurus
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
