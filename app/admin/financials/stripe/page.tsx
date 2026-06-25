// app/admin/financials/stripe/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type StripeRange = "today" | "week" | "month" | "quarter" | "annual" | "ytd";

type StripeStatusTone = "green" | "blue" | "amber" | "red" | "slate" | "purple";

type StripeSummary = {
  grossPayments: number;
  netPayments: number;
  stripeFees: number;
  refunds: number;
  disputes: number;
  chargebacks: number;
  transfers: number;
  payoutDeposits: number;
  unmatchedDeposits: number;
  matchedDeposits: number;
  pendingBalance: number;
  availableBalance: number;
  transactionCount: number;
  payoutCount: number;
  refundCount: number;
  disputeCount: number;
  lastSyncedAt: string | null;
};

type StripeTransaction = {
  id: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  description: string;
  amount: number;
  fee: number;
  net: number;
  status: "paid" | "pending" | "refunded" | "disputed" | "failed";
  type: "payment" | "refund" | "dispute" | "fee" | "transfer" | "adjustment";
  stripeReference: string;
  bookingReference: string | null;
  matchedBankDeposit: boolean;
  reconciliationStatus: "matched" | "needs_review" | "pending" | "unmatched";
};

type StripePayout = {
  id: string;
  arrivalDate: string;
  amount: number;
  feeTotal: number;
  netAmount: number;
  status: "paid" | "pending" | "in_transit" | "failed";
  stripePayoutId: string;
  bankDescription: string;
  bankMatched: boolean;
  plaidTransactionId: string | null;
};

type StripeSourceHealth = {
  id: string;
  label: string;
  ok: boolean;
  message: string;
  rowCount: number;
};

type StripeFinancialsResponse = {
  ok: boolean;
  isLive: boolean;
  generatedAt: string;
  message?: string;
  range: StripeRange;
  summary: StripeSummary;
  transactions: StripeTransaction[];
  payouts: StripePayout[];
  sourceHealth: StripeSourceHealth[];
};

const rangeFilters: { label: string; value: StripeRange }[] = [
  { label: "Today", value: "today" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Quarter", value: "quarter" },
  { label: "Annual", value: "annual" },
  { label: "YTD", value: "ytd" },
];

const fallbackStripeFinancials: StripeFinancialsResponse = {
  ok: true,
  isLive: false,
  generatedAt: new Date().toISOString(),
  message:
    "Stripe financial data is ready for wiring. Showing safe preview values until the Stripe financial API is connected.",
  range: "month",
  summary: {
    grossPayments: 0,
    netPayments: 0,
    stripeFees: 0,
    refunds: 0,
    disputes: 0,
    chargebacks: 0,
    transfers: 0,
    payoutDeposits: 0,
    unmatchedDeposits: 0,
    matchedDeposits: 0,
    pendingBalance: 0,
    availableBalance: 0,
    transactionCount: 0,
    payoutCount: 0,
    refundCount: 0,
    disputeCount: 0,
    lastSyncedAt: null,
  },
  transactions: [],
  payouts: [],
  sourceHealth: [
    {
      id: "stripe-api-preview",
      label: "Stripe Financial API",
      ok: false,
      message:
        "Create or connect /api/admin/financials/stripe to load live Stripe payment, refund, dispute, fee, transfer, and payout records.",
      rowCount: 0,
    },
    {
      id: "plaid-match-preview",
      label: "Plaid/NFCU Deposit Matching",
      ok: false,
      message:
        "Stripe payout deposits should match Plaid/NFCU business banking transactions for reconciliation.",
      rowCount: 0,
    },
  ],
};

function safeNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function formatCurrency(value: unknown) {
  const safeValue = safeNumber(value);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(safeValue));
}

function formatDateTime(value: string | null) {
  if (!value) return "Not synced";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not synced";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function isTestStripeReference(value: string | null | undefined) {
  if (!value) return false;

  const cleanValue = value.toLowerCase();

  return (
    cleanValue.includes("cs_test") ||
    cleanValue.includes("pi_test") ||
    cleanValue.includes("ch_test") ||
    cleanValue.includes("txn_test") ||
    cleanValue.includes("tr_test") ||
    cleanValue.includes("po_test")
  );
}

function isTestStripeTransaction(transaction: StripeTransaction) {
  return (
    isTestStripeReference(transaction.id) ||
    isTestStripeReference(transaction.stripeReference) ||
    isTestStripeReference(transaction.bookingReference)
  );
}

function hideLiveTestTransactions(
  financials: StripeFinancialsResponse,
): StripeFinancialsResponse {
  if (!financials.isLive) {
    return financials;
  }

  const liveTransactions = financials.transactions.filter(
    (transaction) => !isTestStripeTransaction(transaction),
  );

  if (liveTransactions.length === financials.transactions.length) {
    return financials;
  }

  const removedTransactions = financials.transactions.filter((transaction) =>
    isTestStripeTransaction(transaction),
  );

  const removedPaymentAmount = removedTransactions
    .filter((transaction) => transaction.type === "payment")
    .reduce((total, transaction) => total + safeNumber(transaction.amount), 0);

  const removedNetAmount = removedTransactions
    .filter((transaction) => transaction.type === "payment")
    .reduce((total, transaction) => total + safeNumber(transaction.net), 0);

  const removedFeeAmount = removedTransactions
    .filter((transaction) => transaction.type === "payment")
    .reduce((total, transaction) => total + safeNumber(transaction.fee), 0);

  const removedRefundAmount = removedTransactions
    .filter((transaction) => transaction.type === "refund")
    .reduce((total, transaction) => total + safeNumber(transaction.amount), 0);

  const removedDisputeAmount = removedTransactions
    .filter((transaction) => transaction.type === "dispute")
    .reduce((total, transaction) => total + safeNumber(transaction.amount), 0);

  return {
    ...financials,
    message:
      financials.message ||
      "Live Stripe financial data connected. Test-mode Stripe records are hidden from live totals.",
    summary: {
      ...financials.summary,
      grossPayments: Math.max(
        0,
        financials.summary.grossPayments - removedPaymentAmount,
      ),
      netPayments: Math.max(
        0,
        financials.summary.netPayments - removedNetAmount,
      ),
      stripeFees: Math.max(0, financials.summary.stripeFees - removedFeeAmount),
      refunds: Math.max(0, financials.summary.refunds - removedRefundAmount),
      disputes: Math.max(0, financials.summary.disputes - removedDisputeAmount),
      availableBalance: Math.max(
        0,
        financials.summary.availableBalance - removedNetAmount,
      ),
      transactionCount: liveTransactions.length,
      refundCount: liveTransactions.filter(
        (transaction) => transaction.type === "refund",
      ).length,
      disputeCount: liveTransactions.filter(
        (transaction) => transaction.type === "dispute",
      ).length,
    },
    transactions: liveTransactions,
  };
}

function getRangeDates(range: StripeRange) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (range === "today") {
    start.setHours(0, 0, 0, 0);
  }

  if (range === "week") {
    start.setDate(now.getDate() - 7);
  }

  if (range === "month") {
    start.setMonth(now.getMonth() - 1);
  }

  if (range === "quarter") {
    start.setMonth(now.getMonth() - 3);
  }

  if (range === "annual") {
    start.setFullYear(now.getFullYear() - 1);
  }

  if (range === "ytd") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function toneClasses(tone: StripeStatusTone) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-rose-200 bg-rose-50 text-rose-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    purple: "border-purple-200 bg-purple-50 text-purple-800",
  };

  return tones[tone];
}

function transactionTone(
  status: StripeTransaction["status"],
): StripeStatusTone {
  if (status === "paid") return "green";
  if (status === "pending") return "amber";
  if (status === "refunded") return "blue";
  if (status === "disputed") return "red";
  return "slate";
}

function reconciliationTone(
  status: StripeTransaction["reconciliationStatus"],
): StripeStatusTone {
  if (status === "matched") return "green";
  if (status === "pending") return "amber";
  if (status === "needs_review") return "red";
  return "slate";
}

function payoutTone(status: StripePayout["status"]): StripeStatusTone {
  if (status === "paid") return "green";
  if (status === "in_transit") return "blue";
  if (status === "pending") return "amber";
  return "red";
}

function normalizeStripeResponse(
  json: Partial<StripeFinancialsResponse> | null,
  range: StripeRange,
): StripeFinancialsResponse {
  const summary = json?.summary ?? fallbackStripeFinancials.summary;

  return {
    ok: Boolean(json?.ok),
    isLive: Boolean(json?.isLive),
    generatedAt: json?.generatedAt || new Date().toISOString(),
    message: json?.message,
    range: json?.range || range,
    summary: {
      grossPayments: safeNumber(summary.grossPayments),
      netPayments: safeNumber(summary.netPayments),
      stripeFees: safeNumber(summary.stripeFees),
      refunds: safeNumber(summary.refunds),
      disputes: safeNumber(summary.disputes),
      chargebacks: safeNumber(summary.chargebacks),
      transfers: safeNumber(summary.transfers),
      payoutDeposits: safeNumber(summary.payoutDeposits),
      unmatchedDeposits: safeNumber(summary.unmatchedDeposits),
      matchedDeposits: safeNumber(summary.matchedDeposits),
      pendingBalance: safeNumber(summary.pendingBalance),
      availableBalance: safeNumber(summary.availableBalance),
      transactionCount: safeNumber(summary.transactionCount),
      payoutCount: safeNumber(summary.payoutCount),
      refundCount: safeNumber(summary.refundCount),
      disputeCount: safeNumber(summary.disputeCount),
      lastSyncedAt: summary.lastSyncedAt || null,
    },
    transactions: Array.isArray(json?.transactions)
      ? json.transactions.map((transaction, index) => ({
          id: transaction.id || `stripe-transaction-${index}`,
          createdAt: transaction.createdAt || new Date().toISOString(),
          customerName: transaction.customerName || "Customer",
          customerEmail: transaction.customerEmail || "",
          description: transaction.description || "Stripe transaction",
          amount: safeNumber(transaction.amount),
          fee: safeNumber(transaction.fee),
          net: safeNumber(transaction.net),
          status: transaction.status || "pending",
          type: transaction.type || "payment",
          stripeReference: transaction.stripeReference || "Pending reference",
          bookingReference: transaction.bookingReference || null,
          matchedBankDeposit: Boolean(transaction.matchedBankDeposit),
          reconciliationStatus: transaction.reconciliationStatus || "pending",
        }))
      : [],
    payouts: Array.isArray(json?.payouts)
      ? json.payouts.map((payout, index) => ({
          id: payout.id || `stripe-payout-${index}`,
          arrivalDate: payout.arrivalDate || new Date().toISOString(),
          amount: safeNumber(payout.amount),
          feeTotal: safeNumber(payout.feeTotal),
          netAmount: safeNumber(payout.netAmount),
          status: payout.status || "pending",
          stripePayoutId: payout.stripePayoutId || "Pending payout reference",
          bankDescription: payout.bankDescription || "Pending NFCU/Plaid match",
          bankMatched: Boolean(payout.bankMatched),
          plaidTransactionId: payout.plaidTransactionId || null,
        }))
      : [],
    sourceHealth: Array.isArray(json?.sourceHealth)
      ? json.sourceHealth.map((source, index) => ({
          id: source.id || `stripe-source-${index}`,
          label: source.label || "Stripe source",
          ok: Boolean(source.ok),
          message: source.message || "Source checked.",
          rowCount: safeNumber(source.rowCount),
        }))
      : fallbackStripeFinancials.sourceHealth,
  };
}

function SummaryCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: StripeStatusTone;
}) {
  return (
    <div className="rounded-[1.25rem] border border-slate-100 bg-white p-4 shadow-sm">
      <span
        className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${toneClasses(
          tone,
        )}`}
      >
        {label}
      </span>
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
        {helper}
      </p>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
      <h3 className="text-base font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}

export default function AdminStripeFinancialsPage() {
  const [range, setRange] = useState<StripeRange>("month");
  const [financials, setFinancials] = useState<StripeFinancialsResponse>(
    fallbackStripeFinancials,
  );
  const [loading, setLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState(
    "Loading Stripe financial activity...",
  );

  const rangeDates = useMemo(() => getRangeDates(range), [range]);

  const displayedFinancials = useMemo(
    () => hideLiveTestTransactions(financials),
    [financials],
  );

  const hiddenTestTransactionCount =
    financials.transactions.length - displayedFinancials.transactions.length;

  const matchedDepositRate = useMemo(() => {
    const total =
      displayedFinancials.summary.matchedDeposits +
      displayedFinancials.summary.unmatchedDeposits;

    if (!total) return 0;

    return Math.round(
      (displayedFinancials.summary.matchedDeposits / total) * 100,
    );
  }, [
    displayedFinancials.summary.matchedDeposits,
    displayedFinancials.summary.unmatchedDeposits,
  ]);

  async function loadStripeFinancials() {
    setLoading(true);
    setLoadMessage("Loading Stripe financial activity...");

    try {
      const searchParams = new URLSearchParams({
        range,
        startDate: rangeDates.startDate,
        endDate: rangeDates.endDate,
      });

      const response = await fetch(
        `/api/admin/financials/stripe?${searchParams.toString()}`,
        {
          cache: "no-store",
        },
      );

      const json = (await response.json()) as StripeFinancialsResponse;

      if (!response.ok || !json.ok) {
        setFinancials({
          ...fallbackStripeFinancials,
          range,
          message:
            json.message ||
            "Unable to load live Stripe financial data. Showing safe fallback.",
        });
        setLoadMessage(
          json.message ||
            "Unable to load live Stripe financial data. Showing safe fallback.",
        );
        return;
      }

      const normalized = normalizeStripeResponse(json, range);
      setFinancials(normalized);
      setLoadMessage(
        normalized.isLive
          ? "Live Stripe financial data connected."
          : normalized.message ||
              "Stripe financial page loaded with safe preview data.",
      );
    } catch (error) {
      setFinancials({
        ...fallbackStripeFinancials,
        range,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load Stripe financial data.",
      });
      setLoadMessage(
        error instanceof Error
          ? error.message
          : "Unable to load Stripe financial data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStripeFinancials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-3 py-4 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1640px] space-y-6">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/admin/financials"
                  className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
                >
                  ← Financial Dashboard
                </Link>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${
                    displayedFinancials.isLive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {displayedFinancials.isLive
                    ? "Live Stripe"
                    : "Preview / Offline"}
                </span>

                <span className="text-sm font-bold text-slate-500">
                  {loading
                    ? "Loading..."
                    : `Updated ${formatDateTime(displayedFinancials.generatedAt)}`}
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950">
                Stripe Transactions
              </h1>

              <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                Review customer payments, Stripe fees, refunds, disputes,
                chargebacks, transfers, payout deposits, and Plaid/NFCU bank
                matching so Stripe activity ties into SitGuru P&amp;L, Cash
                Flow, General Ledger, Reconciliation, and Banking.
              </p>

              <div
                className={`mt-4 rounded-[1.25rem] border p-4 ${
                  displayedFinancials.isLive
                    ? "border-emerald-100 bg-emerald-50"
                    : "border-amber-100 bg-amber-50"
                }`}
              >
                <p
                  className={`text-xs font-black uppercase tracking-[0.18em] ${
                    displayedFinancials.isLive
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  Stripe Data Status
                </p>
                <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
                  {loadMessage}
                </p>
                {hiddenTestTransactionCount > 0 ? (
                  <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-amber-700">
                    {hiddenTestTransactionCount.toLocaleString()} Stripe test
                    {hiddenTestTransactionCount === 1 ? " record" : " records"}
                    hidden from live totals
                  </p>
                ) : null}
              </div>
            </div>

            <div className="xl:min-w-[560px]">
              <div className="mb-3 flex flex-wrap gap-2">
                <Link
                  href="/admin/financials/reconciliation"
                  className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800"
                >
                  Open Reconciliation
                </Link>

                <Link
                  href="/admin/financials/plaid"
                  className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
                >
                  NFCU / Plaid Banking
                </Link>

                <button
                  type="button"
                  onClick={loadStripeFinancials}
                  disabled={loading}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {rangeFilters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setRange(filter.value)}
                    className={`rounded-full border px-4 py-2 text-xs font-black shadow-sm transition ${
                      range === filter.value
                        ? "border-emerald-700 bg-emerald-700 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <SummaryCard
              label="Gross Payments"
              value={formatCurrency(displayedFinancials.summary.grossPayments)}
              helper="Customer payments processed through Stripe"
              tone="green"
            />
            <SummaryCard
              label="Net Payments"
              value={formatCurrency(displayedFinancials.summary.netPayments)}
              helper="Payments after Stripe fees, refunds, and adjustments"
              tone="green"
            />
            <SummaryCard
              label="Stripe Fees"
              value={formatCurrency(displayedFinancials.summary.stripeFees)}
              helper="Processing fees feeding P&L and Cash Flow"
              tone="blue"
            />
            <SummaryCard
              label="Refunds"
              value={formatCurrency(displayedFinancials.summary.refunds)}
              helper={`${displayedFinancials.summary.refundCount.toLocaleString()} refund records`}
              tone="amber"
            />
            <SummaryCard
              label="Disputes"
              value={formatCurrency(displayedFinancials.summary.disputes)}
              helper={`${displayedFinancials.summary.disputeCount.toLocaleString()} dispute records`}
              tone="red"
            />
            <SummaryCard
              label="Transfers"
              value={formatCurrency(displayedFinancials.summary.transfers)}
              helper={`${displayedFinancials.summary.payoutCount.toLocaleString()} Stripe payout batches`}
              tone="purple"
            />
            <SummaryCard
              label="Available"
              value={formatCurrency(
                displayedFinancials.summary.availableBalance,
              )}
              helper="Stripe available balance"
              tone="blue"
            />
            <SummaryCard
              label="Pending"
              value={formatCurrency(displayedFinancials.summary.pendingBalance)}
              helper="Stripe pending balance"
              tone="amber"
            />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                  Stripe to Plaid/NFCU Matching
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  Payout Deposit Reconciliation
                </h2>
                <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
                  Stripe payout transfers should match NFCU/Plaid business bank
                  deposits. Unmatched deposits should be reviewed before
                  month-end close, CPA exports, and tax reporting.
                </p>
              </div>

              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
                  matchedDepositRate >= 90
                    ? toneClasses("green")
                    : matchedDepositRate >= 50
                      ? toneClasses("amber")
                      : toneClasses("red")
                }`}
              >
                {matchedDepositRate}% Matched
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                  Matched Deposits
                </p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {displayedFinancials.summary.matchedDeposits.toLocaleString()}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-600">
                  Stripe payouts matched to banking
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-rose-100 bg-rose-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-700">
                  Unmatched Deposits
                </p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {displayedFinancials.summary.unmatchedDeposits.toLocaleString()}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-600">
                  Needs reconciliation review
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                  Payout Deposits
                </p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {formatCurrency(displayedFinancials.summary.payoutDeposits)}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-600">
                  Bank deposit total
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4">
              <div className="h-4 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-emerald-600"
                  style={{
                    width: `${Math.max(0, Math.min(100, matchedDepositRate))}%`,
                  }}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-black text-slate-600">
                <span>Deposit matching progress</span>
                <span>{matchedDepositRate}% complete</span>
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
              Financial Flow
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              Stripe feeds the accounting foundation
            </h2>

            <div className="mt-5 space-y-3">
              {[
                {
                  title: "Payments → P&L Revenue",
                  description:
                    "Gross customer charges feed booking and platform revenue.",
                  href: "/admin/financials/profit-loss",
                },
                {
                  title: "Fees & Refunds → Expenses",
                  description:
                    "Stripe processing fees, refunds, and disputes reduce net income.",
                  href: "/admin/financials/profit-loss",
                },
                {
                  title: "Transfers → Cash Flow",
                  description:
                    "Stripe payout batches feed cash movement and operating deposits.",
                  href: "/admin/financials/cash-flow",
                },
                {
                  title: "Deposits → Reconciliation",
                  description:
                    "NFCU/Plaid bank deposits should match Stripe payout batches.",
                  href: "/admin/financials/reconciliation",
                },
                {
                  title: "Detail → General Ledger",
                  description:
                    "Stripe events should create audit-ready transaction detail.",
                  href: "/admin/financials/general-ledger",
                },
              ].map((item, index) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group flex gap-4 rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-black text-slate-950">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-xs font-bold leading-5 text-slate-600">
                      {item.description}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </aside>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
                Recent Stripe Activity
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Payments, Refunds, Fees, Disputes & Transfers
              </h2>
              <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                Review Stripe event-level activity and confirm each item is
                ready for financial statements and bank reconciliation.
              </p>
            </div>

            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-blue-800">
              {displayedFinancials.summary.transactionCount.toLocaleString()}{" "}
              Transactions
            </span>
          </div>

          {displayedFinancials.transactions.length > 0 ? (
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-100">
              <div className="overflow-x-auto">
                <table className="min-w-[1120px] w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Date
                      </th>
                      <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Description
                      </th>
                      <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Fee
                      </th>
                      <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Net
                      </th>
                      <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Status
                      </th>
                      <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Reconciliation
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {displayedFinancials.transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-4 py-4 text-sm font-bold text-slate-600">
                          {formatDateTime(transaction.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-black text-slate-950">
                            {transaction.customerName}
                          </p>
                          <p className="text-xs font-bold text-slate-500">
                            {transaction.customerEmail || "No email"}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-slate-700">
                            {transaction.description}
                          </p>
                          <p className="text-xs font-bold text-slate-500">
                            {transaction.stripeReference}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-sm font-black text-slate-950">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-4 py-4 text-sm font-black text-rose-600">
                          {formatCurrency(transaction.fee)}
                        </td>
                        <td className="px-4 py-4 text-sm font-black text-emerald-700">
                          {formatCurrency(transaction.net)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${toneClasses(
                              transactionTone(transaction.status),
                            )}`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${toneClasses(
                              reconciliationTone(
                                transaction.reconciliationStatus,
                              ),
                            )}`}
                          >
                            {transaction.reconciliationStatus.replace("_", " ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No Stripe transactions loaded yet"
              description="Once /api/admin/financials/stripe is connected, this table will show live customer charges, refunds, disputes, fees, transfers, and reconciliation status."
            />
          )}
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
                Stripe Payouts
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Payout Batches & Bank Deposit Matches
              </h2>
              <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                Confirm each Stripe payout batch matches a Plaid/NFCU business
                banking deposit before monthly close.
              </p>
            </div>

            <span className="rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-purple-800">
              {displayedFinancials.summary.payoutCount.toLocaleString()} Payouts
            </span>
          </div>

          {displayedFinancials.payouts.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {displayedFinancials.payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="rounded-[1.5rem] border border-slate-100 bg-[#fbfefd] p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${toneClasses(
                          payoutTone(payout.status),
                        )}`}
                      >
                        {payout.status.replace("_", " ")}
                      </span>
                      <h3 className="mt-3 text-xl font-black text-slate-950">
                        {formatCurrency(payout.netAmount)}
                      </h3>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                        payout.bankMatched
                          ? toneClasses("green")
                          : toneClasses("red")
                      }`}
                    >
                      {payout.bankMatched ? "Bank Matched" : "Needs Match"}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3 text-sm font-bold text-slate-600">
                    <p className="flex justify-between gap-4">
                      <span>Arrival</span>
                      <span className="text-slate-950">
                        {formatDateTime(payout.arrivalDate)}
                      </span>
                    </p>
                    <p className="flex justify-between gap-4">
                      <span>Gross</span>
                      <span className="text-slate-950">
                        {formatCurrency(payout.amount)}
                      </span>
                    </p>
                    <p className="flex justify-between gap-4">
                      <span>Fees</span>
                      <span className="text-rose-600">
                        {formatCurrency(payout.feeTotal)}
                      </span>
                    </p>
                    <p className="flex justify-between gap-4">
                      <span>Stripe ID</span>
                      <span className="max-w-[180px] truncate text-slate-950">
                        {payout.stripePayoutId}
                      </span>
                    </p>
                    <p className="flex justify-between gap-4">
                      <span>Bank</span>
                      <span className="max-w-[180px] truncate text-slate-950">
                        {payout.bankDescription}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Stripe payouts loaded yet"
              description="Live payout batches will appear here after the Stripe financial API returns payout and Plaid/NFCU matching details."
            />
          )}
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
              Source Health
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Stripe, Banking & Reconciliation Connections
            </h2>
            <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
              This confirms whether Stripe transactions, Stripe payouts,
              Plaid/NFCU bank records, and reconciliation records are connected.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {displayedFinancials.sourceHealth.map((source) => (
              <div
                key={source.id}
                className={`rounded-[1.25rem] border p-4 ${
                  source.ok
                    ? "border-emerald-100 bg-emerald-50"
                    : "border-amber-100 bg-amber-50"
                }`}
              >
                <p
                  className={`text-xs font-black uppercase tracking-[0.16em] ${
                    source.ok ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {source.ok ? "Connected" : "Needs Wiring"}
                </p>
                <h3 className="mt-2 text-base font-black text-slate-950">
                  {source.label}
                </h3>
                <p className="mt-1 text-sm font-bold text-slate-600">
                  Rows: {source.rowCount.toLocaleString()}
                </p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                  {source.message}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
