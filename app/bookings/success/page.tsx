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
  }>;
};

type BookingRow = Record<string, unknown>;

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function getBookingFromSession(sessionId: string): Promise<BookingRow | null> {
  if (!stripe || !sessionId) {
    return null;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    const bookingId =
      safeString(session.metadata?.bookingId) ||
      safeString(session.metadata?.booking_id);

    if (!bookingId) {
      return null;
    }

    return {
      id: bookingId,
      payment_status: session.payment_status || null,
      customer_email: session.customer_details?.email || null,
      amount_total: session.amount_total || null,
      currency: session.currency || null,
      status: "confirmed",
    };
  } catch (error) {
    console.error("Unable to retrieve Stripe session:", error);
    return null;
  }
}

export default async function BookingSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  const sessionId = safeString(resolvedSearchParams.session_id);

  const booking = sessionId ? await getBookingFromSession(sessionId) : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_28%),linear-gradient(to_bottom_right,_#ecfdf5,_#f8fafc,_#ffffff)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-[32px] border border-emerald-100 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
            ✅
          </div>

          <p className="mt-6 text-center text-xs font-semibold uppercase tracking-[0.26em] text-emerald-700">
            Booking Confirmed
          </p>

          <h1 className="mt-3 text-center text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Your booking request was successfully submitted.
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-7 text-slate-600">
            Thank you for booking with SitGuru. Your payment was processed and your
            request has been recorded.
          </p>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-bold text-slate-900">Booking summary</h2>

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
                <p className="mt-2 text-sm font-medium text-slate-800">
                  {safeString(booking?.id) || "Pending"}
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