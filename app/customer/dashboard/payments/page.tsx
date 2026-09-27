"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  CreditCard,
  Loader2,
  Receipt,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Header from "@/components/Header";
import FinishPaymentButton, {
  isUnpaidBookingPayment,
} from "@/components/customer/FinishPaymentButton";
import PaymentIntegrationsGrid from "@/components/payments/PaymentIntegrationsGrid";
import { supabase } from "@/lib/supabase";
import {
  PREMIUM_PAYMENTS_CUSTOMER_SENTENCE,
  PREMIUM_PAYMENTS_TRUST_SENTENCE,
} from "@/lib/help/premium-payments";

type DbRow = Record<string, unknown>;

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function firstString(row: DbRow | null | undefined, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = readString(row?.[key]);
    if (value) return value;
  }
  return fallback;
}

function firstNumber(row: DbRow | null | undefined, keys: string[], fallback = 0) {
  for (const key of keys) {
    const parsed = readNumber(row?.[key], Number.NaN);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return fallback;
}

function formatStatus(value: string | null | undefined) {
  return (value || "pending")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date pending";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getBookingDate(booking: DbRow) {
  return (
    firstString(
      booking,
      ["start_time", "booking_date", "requested_date", "created_at"],
      "",
    ) || null
  );
}

function getBookingHref(booking: DbRow) {
  return `/customer/dashboard/bookings/${encodeURIComponent(String(booking.id))}`;
}

function getBestCustomerTotal(booking: DbRow) {
  return firstNumber(
    booking,
    [
      "total_customer_paid",
      "customer_total_paid",
      "customer_paid_amount",
      "customer_total_amount",
      "total_amount",
      "amount_total",
      "checkout_amount",
      "stripe_amount_total",
      "payment_amount",
      "service_price",
      "subtotal_amount",
    ],
    0,
  );
}

function getStatusClasses(status: string | null | undefined) {
  const normalized = (status || "pending").toLowerCase();

  if (
    ["pending", "requested", "checkout_started", "unpaid", "pending_payment"].includes(
      normalized,
    )
  ) {
    return "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
  }

  if (["confirmed", "paid", "completed", "succeeded"].includes(normalized)) {
    return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";
  }

  if (["cancelled", "canceled", "failed", "refunded"].includes(normalized)) {
    return "bg-rose-50 text-rose-800 ring-1 ring-rose-200";
  }

  return "bg-slate-50 text-slate-700 ring-1 ring-slate-200";
}

async function fetchCustomerBookings(userId: string, userEmail: string | null | undefined) {
  const attempts = [
    { column: "pet_owner_id", value: userId },
    { column: "customer_id", value: userId },
    { column: "user_id", value: userId },
    ...(userEmail
      ? [{ column: "customer_email", value: userEmail.toLowerCase() }]
      : []),
  ];

  const seen = new Set<string>();
  const results: DbRow[] = [];

  for (const attempt of attempts) {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq(attempt.column, attempt.value)
      .order("created_at", { ascending: false })
      .limit(40);

    if (error) continue;

    for (const row of (data as DbRow[] | null) || []) {
      const id = String(row.id || "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      results.push(row);
    }
  }

  return results.sort((a, b) => {
    const aTime = new Date(getBookingDate(a) || 0).getTime();
    const bTime = new Date(getBookingDate(b) || 0).getTime();
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });
}

function PaymentBookingCard({
  booking,
  showPayCta,
}: {
  booking: DbRow;
  showPayCta: boolean;
}) {
  const serviceType = firstString(booking, ["service_type", "service"], "Pet Care");
  const petName = firstString(booking, ["pet_name"], "your pet");
  const guruName = firstString(
    booking,
    ["guru_name", "sitter_name", "provider_name"],
    "your Guru",
  );
  const paymentStatus = firstString(booking, ["payment_status"], "unpaid");
  const total = getBestCustomerTotal(booking);
  const bookingId = String(booking.id || "");

  return (
    <article className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black tracking-tight text-slate-950">
              {serviceType} for {petName}
            </h3>
            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClasses(paymentStatus)}`}
            >
              {formatStatus(paymentStatus)}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            {formatDate(getBookingDate(booking))} · with {guruName}
          </p>
          {total > 0 ? (
            <p className="mt-2 text-base font-black text-slate-950">
              {formatMoney(total)}
            </p>
          ) : null}
        </div>
        <Link
          href={getBookingHref(booking)}
          className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-800 transition hover:bg-white"
        >
          View booking
        </Link>
      </div>

      {showPayCta && bookingId ? (
        <div className="mt-4">
          <FinishPaymentButton
            bookingId={bookingId}
            label="Finish payment with card or wallet"
          />
        </div>
      ) : null}
    </article>
  );
}

export default function CustomerPaymentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [bookings, setBookings] = useState<DbRow[]>([]);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const rows = await fetchCustomerBookings(user.id, user.email);
      setBookings(rows);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load payments right now.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const unpaidBookings = useMemo(
    () =>
      bookings.filter((booking) =>
        isUnpaidBookingPayment(firstString(booking, ["payment_status"], "")),
      ),
    [bookings],
  );

  const paidBookings = useMemo(
    () =>
      bookings
        .filter((booking) => {
          const payment = firstString(booking, ["payment_status"], "").toLowerCase();
          return ["paid", "succeeded", "confirmed", "completed"].includes(payment);
        })
        .slice(0, 8),
    [bookings],
  );

  const paidTotal = useMemo(
    () =>
      paidBookings.reduce(
        (sum, booking) => sum + getBestCustomerTotal(booking),
        0,
      ),
    [paidBookings],
  );

  return (
    <main className="min-h-screen bg-[#eef7f2] pb-16 text-slate-950">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/customer/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-900 shadow-sm transition hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <Link
            href="/customer/dashboard/bookings"
            className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
          >
            My Bookings
          </Link>
        </div>

        <div className="mt-5 overflow-hidden rounded-[2rem] border border-teal-200 bg-white shadow-sm">
          <div
            className="public-dark-section bg-[linear-gradient(135deg,#0D5C3A_0%,#0F766E_52%,#0E7490_100%)] px-6 py-8 text-white sm:px-8"
            data-brand-green
          >
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-100">
              Pet Parent Payments
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight !text-white sm:text-5xl">
              Your SitGuru payments, receipts, and checkout options
            </h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-emerald-50">
              Finish unpaid bookings, review recent charges, and pay securely in
              SitGuru checkout — never off-platform.
            </p>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Needs payment
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {loading ? "—" : unpaidBookings.length}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Paid bookings
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {loading ? "—" : paidBookings.length}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Recent paid total
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {loading ? "—" : formatMoney(paidTotal)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <PaymentIntegrationsGrid
            heading="Pay your way at checkout"
            description={PREMIUM_PAYMENTS_CUSTOMER_SENTENCE}
            ariaLabel="Secure SitGuru payment methods for Pet Parents"
          />
        </div>

        <div className="mt-6 rounded-[2rem] border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-emerald-600" />
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-950">
                Trust &amp; Safety
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                {PREMIUM_PAYMENTS_TRUST_SENTENCE}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/help/billing/parent-payment-guide"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  Payment guide
                </Link>
                <Link
                  href="/customer/dashboard/pawperks"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 px-4 text-sm font-black text-violet-800 transition hover:bg-violet-100"
                >
                  PawPerks rewards
                </Link>
              </div>
            </div>
          </div>
        </div>

        {loadError ? (
          <div className="mt-6 rounded-[1.6rem] border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-800">
            {loadError}
            <button
              type="button"
              onClick={() => void loadPayments()}
              className="ml-3 inline-flex min-h-[40px] items-center rounded-xl bg-rose-700 px-3 text-xs font-black text-white"
            >
              Retry
            </button>
          </div>
        ) : null}

        <section className="mt-6">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-teal-700" />
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Finish payment
            </h2>
          </div>

          {loading ? (
            <div className="flex min-h-[160px] items-center justify-center rounded-[2rem] border border-slate-200 bg-white">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-700" />
            </div>
          ) : unpaidBookings.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-teal-200 bg-white p-8 text-center shadow-sm">
              <Sparkles className="mx-auto h-10 w-10 text-teal-600" />
              <h3 className="mt-4 text-xl font-black text-slate-950">
                You&apos;re all caught up
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                No bookings need payment right now. When checkout is waiting,
                finish it here with card or wallet.
              </p>
              <Link
                href="/search"
                className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-[#0D5C3A] px-5 text-sm font-black text-white transition hover:bg-emerald-800"
              >
                Find Care near you
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {unpaidBookings.map((booking) => (
                <PaymentBookingCard
                  key={String(booking.id)}
                  booking={booking}
                  showPayCta
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <Receipt className="h-5 w-5 text-emerald-700" />
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Recent payments
            </h2>
          </div>

          {loading ? (
            <div className="flex min-h-[120px] items-center justify-center rounded-[2rem] border border-slate-200 bg-white">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-700" />
            </div>
          ) : paidBookings.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-lg font-black text-slate-950">No paid bookings yet</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Paid care will show here with amount and status.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {paidBookings.map((booking) => (
                <PaymentBookingCard
                  key={String(booking.id)}
                  booking={booking}
                  showPayCta={false}
                />
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
