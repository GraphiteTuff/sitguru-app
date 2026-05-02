import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type BookingRow = Record<string, unknown>;
type PayoutRow = Record<string, unknown>;
type DisputeRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type TransactionRow = {
  id: string;
  type: string;
  user: string;
  method: string;
  amount: string;
  rawAmount: number;
  status: string;
  time: string;
  href: string;
};

type PayoutDisplayRow = {
  id: string;
  guru: string;
  amount: string;
  rawAmount: number;
  jobs: string;
  method: string;
  status: string;
  href: string;
};

type DisputeDisplayRow = {
  id: string;
  booking: string;
  customer: string;
  amount: string;
  rawAmount: number;
  reason: string;
  deadline: string;
  status: string;
  href: string;
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function moneyCents(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function calcPercent(value: number, total: number) {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(100, (value / total) * 100));
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateShort(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Admin payments query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Admin payments query skipped for ${label}:`, error);
    return [];
  }
}

function getBookingId(booking: BookingRow) {
  return (
    asTrimmedString(booking.id) ||
    asTrimmedString(booking.booking_id) ||
    "booking"
  );
}

function getBookingCustomerName(booking: BookingRow) {
  return (
    asTrimmedString(booking.customer_name) ||
    asTrimmedString(booking.pet_parent_name) ||
    asTrimmedString(booking.owner_name) ||
    asTrimmedString(booking.customer_email) ||
    asTrimmedString(booking.pet_owner_id) ||
    "Customer"
  );
}

function getBookingGuruName(booking: BookingRow) {
  return (
    asTrimmedString(booking.guru_name) ||
    asTrimmedString(booking.sitter_name) ||
    asTrimmedString(booking.provider_name) ||
    asTrimmedString(booking.guru_id) ||
    "Guru"
  );
}

function getBookingGrossAmount(booking: BookingRow) {
  const subtotal = toNumber(booking.subtotal_amount);

  if (subtotal > 0) return subtotal;

  return (
    toNumber(booking.total_customer_paid) ||
    toNumber(booking.total_amount) ||
    toNumber(booking.amount) ||
    toNumber(booking.price) ||
    toNumber(booking.hourly_rate)
  );
}

function getBookingTaxAmount(booking: BookingRow) {
  return toNumber(booking.sales_tax_amount);
}

function getBookingFeeAmount(booking: BookingRow) {
  const storedFee = toNumber(booking.sitguru_fee_amount);

  if (storedFee > 0) return storedFee;

  return getBookingGrossAmount(booking) * 0.08;
}

function getBookingGuruNetAmount(booking: BookingRow) {
  const storedNet = toNumber(booking.guru_net_amount);

  if (storedNet > 0) return storedNet;

  return Math.max(0, getBookingGrossAmount(booking) - getBookingFeeAmount(booking));
}

function getBookingPaymentStatus(booking: BookingRow) {
  return (
    asTrimmedString(booking.payment_status) ||
    asTrimmedString(booking.status) ||
    "pending"
  );
}

function getBookingPayoutStatus(booking: BookingRow) {
  return (
    asTrimmedString(booking.payout_status) ||
    asTrimmedString(booking.guru_payout_status) ||
    "pending"
  );
}

function getBookingPaymentMethod(booking: BookingRow) {
  return (
    asTrimmedString(booking.payment_method) ||
    asTrimmedString(booking.card_brand) ||
    asTrimmedString(booking.stripe_payment_method) ||
    "Stripe"
  );
}

function isPaidBooking(booking: BookingRow) {
  const paymentStatus = getBookingPaymentStatus(booking).toLowerCase();
  const status = asTrimmedString(booking.status).toLowerCase();

  return paymentStatus === "paid" || status.includes("paid") || status.includes("complete");
}

function isFailedBooking(booking: BookingRow) {
  const paymentStatus = getBookingPaymentStatus(booking).toLowerCase();
  const status = asTrimmedString(booking.status).toLowerCase();

  return (
    paymentStatus.includes("fail") ||
    paymentStatus.includes("expired") ||
    status.includes("cancel") ||
    status.includes("fail")
  );
}

function isRefundBooking(booking: BookingRow) {
  const status = (
    getBookingPaymentStatus(booking) ||
    asTrimmedString(booking.status)
  ).toLowerCase();

  return status.includes("refund") || toNumber(booking.refund_amount) > 0;
}

function getPayoutId(payout: PayoutRow) {
  return (
    asTrimmedString(payout.id) ||
    asTrimmedString(payout.payout_id) ||
    asTrimmedString(payout.transfer_id) ||
    "payout"
  );
}

function getPayoutAmount(payout: PayoutRow) {
  return (
    toNumber(payout.amount) ||
    toNumber(payout.payout_amount) ||
    toNumber(payout.guru_net_amount) ||
    toNumber(payout.net_amount)
  );
}

function getPayoutStatus(payout: PayoutRow) {
  return (
    asTrimmedString(payout.status) ||
    asTrimmedString(payout.payout_status) ||
    "pending"
  );
}

function getPayoutGuruName(payout: PayoutRow) {
  return (
    asTrimmedString(payout.guru_name) ||
    asTrimmedString(payout.sitter_name) ||
    asTrimmedString(payout.provider_name) ||
    asTrimmedString(payout.guru_id) ||
    "Guru"
  );
}

function getDisputeId(dispute: DisputeRow) {
  return (
    asTrimmedString(dispute.id) ||
    asTrimmedString(dispute.dispute_id) ||
    asTrimmedString(dispute.case_id) ||
    "dispute"
  );
}

function getDisputeAmount(dispute: DisputeRow) {
  return (
    toNumber(dispute.amount) ||
    toNumber(dispute.dispute_amount) ||
    toNumber(dispute.refund_amount) ||
    toNumber(dispute.total_amount)
  );
}

function getDisputeStatus(dispute: DisputeRow) {
  return (
    asTrimmedString(dispute.status) ||
    asTrimmedString(dispute.case_status) ||
    "open"
  );
}

function getDisputeReason(dispute: DisputeRow) {
  return (
    asTrimmedString(dispute.reason) ||
    asTrimmedString(dispute.dispute_reason) ||
    asTrimmedString(dispute.description) ||
    "Payment issue"
  );
}

function getDisputeCustomer(dispute: DisputeRow) {
  return (
    asTrimmedString(dispute.customer_name) ||
    asTrimmedString(dispute.pet_parent_name) ||
    asTrimmedString(dispute.customer_email) ||
    asTrimmedString(dispute.customer_id) ||
    "Customer"
  );
}

function getStatusStyle(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("failed") ||
    normalized.includes("hold") ||
    normalized.includes("respond") ||
    normalized.includes("open") ||
    normalized.includes("urgent") ||
    normalized.includes("flag")
  ) {
    return "border-rose-400/20 bg-rose-400/10 text-rose-200";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("processing") ||
    normalized.includes("evidence") ||
    normalized.includes("review")
  ) {
    return "border-amber-400/20 bg-amber-400/10 text-amber-200";
  }

  if (
    normalized.includes("ready") ||
    normalized.includes("succeeded") ||
    normalized.includes("paid") ||
    normalized.includes("complete")
  ) {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  }

  return "border-sky-400/20 bg-sky-400/10 text-sky-200";
}

function statToneClasses(tone: "emerald" | "violet" | "amber" | "rose") {
  if (tone === "emerald") {
    return "border-emerald-400/20 bg-emerald-400/10";
  }

  if (tone === "violet") {
    return "border-violet-400/20 bg-violet-400/10";
  }

  if (tone === "amber") {
    return "border-amber-400/20 bg-amber-400/10";
  }

  return "border-rose-400/20 bg-rose-400/10";
}

function ActionLink({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  if (primary) {
    return (
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:border-emerald-300/30 hover:bg-white/10"
    >
      {label}
    </Link>
  );
}

async function getPaymentsData() {
  const [bookings, payouts, disputes] = await Promise.all([
    safeRows<BookingRow>(
      supabaseAdmin
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "bookings"
    ),
    safeRows<PayoutRow>(
      supabaseAdmin
        .from("guru_payouts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "guru_payouts"
    ),
    safeRows<DisputeRow>(
      supabaseAdmin
        .from("dispute_cases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "dispute_cases"
    ),
  ]);

  const paidBookings = bookings.filter(isPaidBooking);
  const failedBookings = bookings.filter(isFailedBooking);
  const refundBookings = bookings.filter(isRefundBooking);

  const grossVolume = bookings.reduce(
    (sum, booking) => sum + getBookingGrossAmount(booking) + getBookingTaxAmount(booking),
    0
  );

  const platformRevenue = bookings.reduce(
    (sum, booking) => sum + getBookingFeeAmount(booking),
    0
  );

  const taxHeld = bookings.reduce(
    (sum, booking) => sum + getBookingTaxAmount(booking),
    0
  );

  const bookingPayoutsPending = bookings.reduce((sum, booking) => {
    const payoutStatus = getBookingPayoutStatus(booking).toLowerCase();

    if (isPaidBooking(booking) && payoutStatus !== "paid" && payoutStatus !== "released") {
      return sum + getBookingGuruNetAmount(booking);
    }

    return sum;
  }, 0);

  const explicitPayoutsPending = payouts.reduce((sum, payout) => {
    const status = getPayoutStatus(payout).toLowerCase();

    if (status !== "paid" && status !== "released" && status !== "complete") {
      return sum + getPayoutAmount(payout);
    }

    return sum;
  }, 0);

  const payoutsPending = explicitPayoutsPending || bookingPayoutsPending;

  const refundVolume = bookings.reduce((sum, booking) => {
    const explicitRefund = toNumber(booking.refund_amount);

    if (explicitRefund > 0) return sum + explicitRefund;

    if (isRefundBooking(booking)) return sum + getBookingGrossAmount(booking);

    return sum;
  }, 0);

  const openDisputes = disputes.filter((dispute) => {
    const status = getDisputeStatus(dispute).toLowerCase();
    return !status.includes("closed") && !status.includes("resolved");
  });

  const recentBookingTransactions: TransactionRow[] = bookings.slice(0, 10).map((booking) => {
    const id = getBookingId(booking);
    const paymentStatus = getBookingPaymentStatus(booking);
    const transactionId =
      asTrimmedString(booking.stripe_payment_intent_id) ||
      asTrimmedString(booking.payment_intent_id) ||
      id;

    return {
      id: transactionId,
      type: isRefundBooking(booking) ? "Refund / Booking Adjustment" : "Booking Payment",
      user: getBookingCustomerName(booking),
      method: getBookingPaymentMethod(booking),
      amount: moneyCents(getBookingGrossAmount(booking) + getBookingTaxAmount(booking)),
      rawAmount: getBookingGrossAmount(booking) + getBookingTaxAmount(booking),
      status: paymentStatus,
      time: formatDateTime(asTrimmedString(booking.created_at)),
      href: `/admin/bookings?booking=${id}`,
    };
  });

  const recentPayoutTransactions: TransactionRow[] = payouts.slice(0, 8).map((payout) => {
    const id = getPayoutId(payout);

    return {
      id,
      type: "Guru Payout",
      user: getPayoutGuruName(payout),
      method:
        asTrimmedString(payout.method) ||
        asTrimmedString(payout.payout_method) ||
        "Bank Transfer",
      amount: moneyCents(getPayoutAmount(payout)),
      rawAmount: getPayoutAmount(payout),
      status: getPayoutStatus(payout),
      time: formatDateTime(asTrimmedString(payout.created_at)),
      href: `/admin/commissions?payout=${id}`,
    };
  });

  const recentTransactions = [...recentBookingTransactions, ...recentPayoutTransactions]
    .sort((a, b) => {
      const aDate = new Date(a.time).getTime();
      const bDate = new Date(b.time).getTime();

      return (
        (Number.isFinite(bDate) ? bDate : 0) -
        (Number.isFinite(aDate) ? aDate : 0)
      );
    })
    .slice(0, 8);

  const payoutRows: PayoutDisplayRow[] =
    payouts.length > 0
      ? payouts.slice(0, 8).map((payout) => {
          const id = getPayoutId(payout);

          return {
            id,
            guru: getPayoutGuruName(payout),
            amount: moneyCents(getPayoutAmount(payout)),
            rawAmount: getPayoutAmount(payout),
            jobs:
              asTrimmedString(payout.jobs_label) ||
              asTrimmedString(payout.booking_count)
                ? `${asTrimmedString(payout.booking_count)} completed bookings`
                : "Payout record",
            method:
              asTrimmedString(payout.method) ||
              asTrimmedString(payout.payout_method) ||
              "Bank Transfer",
            status: getPayoutStatus(payout),
            href: `/admin/commissions?payout=${id}`,
          };
        })
      : paidBookings.slice(0, 8).map((booking) => {
          const id = getBookingId(booking);
          const amount = getBookingGuruNetAmount(booking);

          return {
            id,
            guru: getBookingGuruName(booking),
            amount: moneyCents(amount),
            rawAmount: amount,
            jobs: "1 completed booking",
            method: "Booking payout",
            status: getBookingPayoutStatus(booking),
            href: `/admin/bookings?booking=${id}`,
          };
        });

  const disputeRows: DisputeDisplayRow[] =
    disputes.length > 0
      ? disputes.slice(0, 8).map((dispute) => {
          const id = getDisputeId(dispute);
          const bookingId =
            asTrimmedString(dispute.booking_id) ||
            asTrimmedString(dispute.booking) ||
            "—";

          return {
            id,
            booking: bookingId,
            customer: getDisputeCustomer(dispute),
            amount: moneyCents(getDisputeAmount(dispute)),
            rawAmount: getDisputeAmount(dispute),
            reason: getDisputeReason(dispute),
            deadline: formatDateShort(
              asTrimmedString(dispute.due_by) ||
                asTrimmedString(dispute.deadline) ||
                asTrimmedString(dispute.respond_by)
            ),
            status: getDisputeStatus(dispute),
            href: `/admin/disputes?case=${id}`,
          };
        })
      : refundBookings.slice(0, 8).map((booking) => {
          const id = getBookingId(booking);
          const refundAmount = toNumber(booking.refund_amount) || getBookingGrossAmount(booking);

          return {
            id: `refund-${id}`,
            booking: id,
            customer: getBookingCustomerName(booking),
            amount: moneyCents(refundAmount),
            rawAmount: refundAmount,
            reason: "Refund or payment adjustment",
            deadline: "—",
            status: getBookingPaymentStatus(booking),
            href: `/admin/bookings?booking=${id}`,
          };
        });

  const successfulCollectionsRate = calcPercent(paidBookings.length, bookings.length);
  const payoutCompletionRate = calcPercent(
    payouts.filter((payout) => {
      const status = getPayoutStatus(payout).toLowerCase();
      return status.includes("paid") || status.includes("released") || status.includes("complete");
    }).length,
    payouts.length
  );

  const disputeControlRate = Math.max(
    0,
    100 - calcPercent(openDisputes.length, Math.max(disputes.length || bookings.length, 1))
  );

  return {
    stats: [
      {
        label: "Gross Volume",
        value: money(grossVolume),
        subtext: `${paidBookings.length.toLocaleString()} paid / completed booking rows`,
        tone: "emerald" as const,
        href: "/admin/bookings",
      },
      {
        label: "Guru Payouts Pending",
        value: money(payoutsPending),
        subtext: `${payoutRows.length.toLocaleString()} payout records or paid booking rows`,
        tone: "violet" as const,
        href: "/admin/commissions",
      },
      {
        label: "Refund Volume",
        value: money(refundVolume),
        subtext: `${refundBookings.length.toLocaleString()} refund or adjustment booking rows`,
        tone: "amber" as const,
        href: "/admin/disputes",
      },
      {
        label: "Disputes Open",
        value: openDisputes.length.toLocaleString(),
        subtext: `${disputes.length.toLocaleString()} total dispute case rows`,
        tone: "rose" as const,
        href: "/admin/disputes",
      },
    ],
    recentTransactions,
    payoutRows,
    disputeRows,
    totals: {
      bookings: bookings.length,
      paidBookings: paidBookings.length,
      failedBookings: failedBookings.length,
      grossVolume,
      platformRevenue,
      taxHeld,
      payoutsPending,
      refundVolume,
      openDisputes: openDisputes.length,
      successfulCollectionsRate,
      payoutCompletionRate: payouts.length > 0 ? payoutCompletionRate : successfulCollectionsRate,
      disputeControlRate,
    },
  };
}

export default async function AdminPaymentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const payments = await getPaymentsData();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_30%),radial-gradient(circle_at_right,_rgba(14,165,233,0.10),_transparent_28%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-sky-500/10 p-6 shadow-[0_12px_60px_rgba(0,0,0,0.28)] lg:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                Financial Operations
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Live SitGuru payments, payouts, refunds, and disputes.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                This dashboard is wired to SitGuru booking and payment records.
                It tracks booking volume, Stripe payment status, Guru payout
                readiness, refunds, tax held, platform revenue, and dispute cases.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionLink href="/admin" label="Overview" />
              <ActionLink href="/admin/bookings" label="Bookings" />
              <ActionLink href="/admin/financials" label="Financials" />
              <ActionLink href="/admin/exports" label="Export Payments" primary />
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {payments.stats.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-3xl border p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition hover:border-emerald-300/30 hover:bg-white/10 ${statToneClasses(
                  item.tone
                )}`}
              >
                <p className="text-sm font-semibold text-slate-300">
                  {item.label}
                </p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <h2 className="text-3xl font-black tracking-tight text-white">
                    {item.value}
                  </h2>
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-400">
                  {item.subtext}
                </p>
                <p className="mt-4 text-sm font-semibold text-emerald-300">
                  Open SitGuru records →
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                  Recent Transactions
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                  Live money movement
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Booking payments and Guru payouts from SitGuru tables.
                </p>
              </div>

              <ActionLink href="/admin/financials" label="View Ledger" />
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white/5 text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Transaction
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        User
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Method
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Status
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Time
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/10 bg-slate-950/40">
                    {payments.recentTransactions.length ? (
                      payments.recentTransactions.map((tx) => (
                        <tr
                          key={`${tx.id}-${tx.type}`}
                          className="transition hover:bg-white/5"
                        >
                          <td className="px-4 py-4">
                            <Link
                              href={tx.href}
                              className="font-semibold text-white transition hover:text-emerald-300"
                            >
                              {tx.id}
                            </Link>
                            <div className="mt-1 text-xs text-slate-500">
                              {tx.type}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-slate-300">
                            {tx.user}
                          </td>
                          <td className="px-4 py-4 text-slate-400">
                            {tx.method}
                          </td>
                          <td className="px-4 py-4 font-semibold text-white">
                            {tx.amount}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(
                                tx.status
                              )}`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-500">
                            {tx.time}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-slate-400"
                        >
                          No payment transactions found yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Quick Actions
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                Payment operations
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Open the real SitGuru admin areas for payouts, held items,
                disputes, and reporting.
              </p>

              <div className="mt-5 grid gap-3">
                <Link
                  href="/admin/commissions"
                  className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-center text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/15"
                >
                  Release / Review Guru Payouts
                </Link>
                <Link
                  href="/admin/bookings?payment_status=pending"
                  className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-center text-sm font-bold text-amber-100 transition hover:bg-amber-400/15"
                >
                  Review Held Transactions
                </Link>
                <Link
                  href="/admin/disputes"
                  className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-center text-sm font-bold text-rose-100 transition hover:bg-rose-400/15"
                >
                  Open Disputes Queue
                </Link>
                <Link
                  href="/admin/exports"
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-slate-900"
                >
                  Download Settlement Report
                </Link>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-slate-950/60 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Revenue Health
              </p>
              <h3 className="mt-3 text-4xl font-black tracking-tight text-white">
                {money(payments.totals.platformRevenue)}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Estimated SitGuru platform revenue from booking fee fields or
                default marketplace take rate.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                    <span>Successful Collections</span>
                    <span>{percent(payments.totals.successfulCollectionsRate)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-emerald-400"
                      style={{
                        width: `${payments.totals.successfulCollectionsRate}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                    <span>Payout Completion</span>
                    <span>{percent(payments.totals.payoutCompletionRate)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-sky-400"
                      style={{ width: `${payments.totals.payoutCompletionRate}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                    <span>Dispute Control</span>
                    <span>{percent(payments.totals.disputeControlRate)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-violet-400"
                      style={{ width: `${payments.totals.disputeControlRate}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Tax Held
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {money(payments.totals.taxHeld)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-2">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                  Guru Payout Queue
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                  Pending transfers
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Payout rows when available, otherwise paid booking payout
                  estimates.
                </p>
              </div>

              <ActionLink href="/admin/commissions" label="Review All" />
            </div>

            <div className="space-y-4">
              {payments.payoutRows.length ? (
                payments.payoutRows.map((payout) => (
                  <Link
                    key={`${payout.id}-${payout.status}`}
                    href={payout.href}
                    className="block rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition hover:border-emerald-300/30 hover:bg-white/10"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-bold text-white">{payout.guru}</h3>
                        <p className="mt-1 text-sm text-slate-400">
                          {payout.jobs} • {payout.method}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-lg font-black text-white">
                          {payout.amount}
                        </p>
                        <span
                          className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(
                            payout.status
                          )}`}
                        >
                          {payout.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-400">
                  No payout rows or paid booking payout estimates found yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                  Refunds & Disputes
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                  Payment issue handling
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Dispute cases and refund-related booking rows.
                </p>
              </div>

              <ActionLink href="/admin/disputes" label="Open Cases" />
            </div>

            <div className="space-y-4">
              {payments.disputeRows.length ? (
                payments.disputeRows.map((item) => (
                  <Link
                    key={`${item.id}-${item.status}`}
                    href={item.href}
                    className="block rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition hover:border-rose-300/30 hover:bg-white/10"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-white">{item.id}</h3>
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-400">
                          {item.customer} • Booking {item.booking}
                        </p>
                        <p className="mt-2 text-sm text-slate-300">
                          {item.reason}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-lg font-black text-white">
                          {item.amount}
                        </p>
                        <p className="text-xs text-slate-500">
                          Deadline {item.deadline}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-bold text-white">
                      Review Case
                    </p>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-400">
                  No dispute cases or refund-related bookings found yet.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
