"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  PAYMENT_GATEWAY_META,
  parsePaymentGatewayFilter,
  type PaymentGatewayFilter,
  type PaymentGatewayId,
  type PaymentGatewayRange,
} from "@/lib/admin/financials/payment-gateways";

type GatewaySummary = {
  id: PaymentGatewayId;
  label: string;
  shortLabel: string;
  logoSrc: string | null;
  role: "processor" | "wallet" | "banking";
  description: string;
  grossVolume: number;
  netVolume: number;
  refunds: number;
  fees: number;
  transactionCount: number;
  refundCount: number;
  connectedAccounts: number;
  readyAccounts: number;
  status: "live" | "partial" | "idle" | "banking";
  statusMessage: string;
};

type GatewayTransaction = {
  id: string;
  createdAt: string;
  gateway: PaymentGatewayId;
  gatewayLabel: string;
  processor: string;
  customerName: string;
  customerEmail: string;
  description: string;
  paymentMethod: string;
  amount: number;
  fee: number;
  net: number;
  status: string;
  bookingReference: string | null;
  providerReference: string;
};

type MerchantAccount = {
  id: string;
  gateway: "paypal" | "stripe";
  merchantEmail: string;
  status: string;
  paymentsReceivable: boolean;
  environment: string;
  lastSyncedAt: string | null;
};

type SourceHealth = {
  id: string;
  label: string;
  ok: boolean;
  message: string;
  rowCount: number;
};

type PaymentGatewaysResponse = {
  ok: boolean;
  isLive: boolean;
  generatedAt: string;
  range: PaymentGatewayRange;
  gateway: PaymentGatewayFilter;
  message?: string;
  totals: {
    grossVolume: number;
    netVolume: number;
    refunds: number;
    fees: number;
    transactionCount: number;
  };
  gateways: GatewaySummary[];
  transactions: GatewayTransaction[];
  merchants: MerchantAccount[];
  sourceHealth: SourceHealth[];
};

type StripeLiteResponse = {
  ok: boolean;
  isLive: boolean;
  summary?: {
    grossPayments: number;
    stripeFees: number;
    refunds: number;
    matchedDeposits: number;
    unmatchedDeposits: number;
    availableBalance: number;
    pendingBalance: number;
    payoutCount: number;
  };
};

const rangeFilters: { label: string; value: PaymentGatewayRange }[] = [
  { label: "Today", value: "today" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Quarter", value: "quarter" },
  { label: "Annual", value: "annual" },
  { label: "YTD", value: "ytd" },
];

const fallback: PaymentGatewaysResponse = {
  ok: true,
  isLive: false,
  generatedAt: new Date().toISOString(),
  range: "month",
  gateway: "all",
  message: "Loading payment gateway activity by provider...",
  totals: {
    grossVolume: 0,
    netVolume: 0,
    refunds: 0,
    fees: 0,
    transactionCount: 0,
  },
  gateways: PAYMENT_GATEWAY_META.map((meta) => ({
    ...meta,
    grossVolume: 0,
    netVolume: 0,
    refunds: 0,
    fees: 0,
    transactionCount: 0,
    refundCount: 0,
    connectedAccounts: 0,
    readyAccounts: 0,
    status: meta.role === "banking" ? "banking" : "idle",
    statusMessage: "Waiting for live ledger data.",
  })),
  transactions: [],
  merchants: [],
  sourceHealth: [],
};

function safeNumber(value: unknown, fallbackValue = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallbackValue;
}

function formatCurrency(value: unknown) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeNumber(value));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getRangeDates(range: PaymentGatewayRange) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (range === "today") start.setHours(0, 0, 0, 0);
  if (range === "week") start.setDate(now.getDate() - 7);
  if (range === "month") start.setMonth(now.getMonth() - 1);
  if (range === "quarter") start.setMonth(now.getMonth() - 3);
  if (range === "annual") start.setFullYear(now.getFullYear() - 1);
  if (range === "ytd") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function statusTone(status: GatewaySummary["status"]) {
  if (status === "live") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "partial") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "banking") return "border-sky-200 bg-sky-50 text-sky-800";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function readInitialGateway(): PaymentGatewayFilter {
  if (typeof window === "undefined") return "all";
  return parsePaymentGatewayFilter(
    new URLSearchParams(window.location.search).get("provider") ||
      new URLSearchParams(window.location.search).get("gateway"),
  );
}

function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{helper}</p>
    </div>
  );
}

export default function AdminPaymentGatewayPage() {
  const [range, setRange] = useState<PaymentGatewayRange>("month");
  const [gateway, setGateway] = useState<PaymentGatewayFilter>("all");
  const [data, setData] = useState<PaymentGatewaysResponse>(fallback);
  const [stripeLite, setStripeLite] = useState<StripeLiteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState(
    "Loading payment gateway activity by provider...",
  );

  const rangeDates = useMemo(() => getRangeDates(range), [range]);

  const selectedSummary = useMemo(() => {
    if (gateway === "all") return null;
    return data.gateways.find((item) => item.id === gateway) || null;
  }, [data.gateways, gateway]);

  useEffect(() => {
    setGateway(readInitialGateway());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (gateway === "all") {
      url.searchParams.delete("provider");
      url.searchParams.delete("gateway");
    } else {
      url.searchParams.set("provider", gateway);
      url.searchParams.delete("gateway");
    }
    window.history.replaceState({}, "", url.toString());
  }, [gateway]);

  async function loadGateways() {
    setLoading(true);
    setLoadMessage("Loading payment gateway activity by provider...");

    try {
      const params = new URLSearchParams({
        range,
        startDate: rangeDates.startDate,
        endDate: rangeDates.endDate,
        gateway,
      });

      const [gatewayResponse, stripeResponse] = await Promise.all([
        fetch(`/api/admin/financials/payment-gateways?${params}`, {
          cache: "no-store",
        }),
        fetch(
          `/api/admin/financials/stripe?range=${range}&startDate=${rangeDates.startDate}&endDate=${rangeDates.endDate}`,
          { cache: "no-store" },
        ),
      ]);

      const json = (await gatewayResponse.json()) as PaymentGatewaysResponse;
      const stripeJson = (await stripeResponse.json()) as StripeLiteResponse;

      if (!gatewayResponse.ok || !json.ok) {
        setData({
          ...fallback,
          range,
          gateway,
          message:
            json.message ||
            "Unable to load payment gateway data. Showing safe fallback.",
        });
        setLoadMessage(
          json.message ||
            "Unable to load payment gateway data. Showing safe fallback.",
        );
      } else {
        setData(json);
        setLoadMessage(
          json.isLive
            ? json.message || "Live payment gateway data connected."
            : json.message || "Payment gateway loaded with safe preview data.",
        );
      }

      if (stripeResponse.ok && stripeJson.ok) {
        setStripeLite(stripeJson);
      } else {
        setStripeLite(null);
      }
    } catch (error) {
      setData({
        ...fallback,
        range,
        gateway,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load payment gateway data.",
      });
      setLoadMessage(
        error instanceof Error
          ? error.message
          : "Unable to load payment gateway data.",
      );
      setStripeLite(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadGateways();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, gateway]);

  const headlineTotals = selectedSummary
    ? {
        grossVolume: selectedSummary.grossVolume,
        netVolume: selectedSummary.netVolume,
        refunds: selectedSummary.refunds,
        fees: selectedSummary.fees,
        transactionCount: selectedSummary.transactionCount,
      }
    : data.totals;

  const showStripeDeep =
    gateway === "all" || gateway === "stripe" || gateway === "apple_pay" || gateway === "google_pay";
  const showPaypalMerchants =
    gateway === "all" || gateway === "paypal" || gateway === "venmo";

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
                    data.isLive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {data.isLive ? "Live Gateways" : "Preview / Offline"}
                </span>
                <span className="text-sm font-bold text-slate-500">
                  {loading
                    ? "Loading..."
                    : `Updated ${formatDateTime(data.generatedAt)}`}
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950">
                Payment Gateway
              </h1>
              <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                Track Stripe, PayPal, Apple Pay, Google Pay, Venmo, and Plaid/NFCU
                banking side-by-side — volume, fees, refunds, merchant readiness,
                and deposit matching by provider.
              </p>

              <div
                className={`mt-4 rounded-[1.25rem] border p-4 ${
                  data.isLive
                    ? "border-emerald-100 bg-emerald-50"
                    : "border-amber-100 bg-amber-50"
                }`}
              >
                <p
                  className={`text-xs font-black uppercase tracking-[0.18em] ${
                    data.isLive ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  Gateway Data Status
                </p>
                <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
                  {loadMessage}
                </p>
              </div>
            </div>

            <div className="xl:min-w-[560px]">
              <div className="mb-3 flex flex-wrap gap-2">
                <Link
                  href="/admin/financials/reconciliation"
                  className="rounded-2xl bg-emerald-700 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800"
                >
                  Open Reconciliation
                </Link>
                <Link
                  href="/admin/financials/plaid"
                  className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
                >
                  NFCU / Plaid Banking
                </Link>
                <Link
                  href="/admin/payments"
                  className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
                >
                  Checkout Options
                </Link>
                <button
                  type="button"
                  onClick={loadGateways}
                  disabled={loading}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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
                    className={`rounded-2xl border px-4 py-2 text-xs font-black shadow-sm transition ${
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

          <section className="mt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Track by gateway
              </p>
              <button
                type="button"
                onClick={() => setGateway("all")}
                className={`rounded-2xl border px-4 py-2 text-xs font-black shadow-sm transition ${
                  gateway === "all"
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50"
                }`}
              >
                All gateways
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {data.gateways.map((item) => {
                const selected = gateway === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGateway(item.id)}
                    className={`rounded-[1.5rem] border p-4 text-left shadow-sm transition ${
                      selected
                        ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
                        : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"
                    }`}
                  >
                    <div className="flex min-h-[2.75rem] items-center justify-between gap-3">
                      {item.logoSrc ? (
                        <img
                          src={item.logoSrc}
                          alt=""
                          className="h-8 w-auto max-w-[7rem] object-contain"
                          draggable={false}
                        />
                      ) : (
                        <span className="text-sm font-black text-slate-900">
                          {item.shortLabel}
                        </span>
                      )}
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${statusTone(
                          item.status,
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-4 text-xl font-black text-slate-950">
                      {item.id === "plaid"
                        ? `${item.transactionCount.toLocaleString()} rows`
                        : formatCurrency(item.grossVolume)}
                    </p>
                    <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                      {item.id === "plaid"
                        ? item.statusMessage
                        : `${item.transactionCount.toLocaleString()} txns · ${formatCurrency(item.fees)} fees`}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryCard
              label={gateway === "all" ? "Gross (all gateways)" : "Gross volume"}
              value={formatCurrency(headlineTotals.grossVolume)}
              helper={
                selectedSummary?.description ||
                "Customer payments across selected gateways"
              }
            />
            <SummaryCard
              label="Net volume"
              value={formatCurrency(headlineTotals.netVolume)}
              helper="Gross minus fees and refunds"
            />
            <SummaryCard
              label="Fees"
              value={formatCurrency(headlineTotals.fees)}
              helper="Processor / wallet processing fees"
            />
            <SummaryCard
              label="Refunds"
              value={formatCurrency(headlineTotals.refunds)}
              helper="Refunded customer payments"
            />
            <SummaryCard
              label="Transactions"
              value={headlineTotals.transactionCount.toLocaleString()}
              helper={
                selectedSummary
                  ? selectedSummary.statusMessage
                  : "Across Stripe, PayPal, and wallets"
              }
            />
          </div>

          {showStripeDeep && stripeLite?.summary ? (
            <section className="mt-6 rounded-[1.5rem] border border-indigo-100 bg-indigo-50/60 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">
                    Stripe settlement pulse
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    Live Stripe balances, fees, and Plaid deposit matching for
                    Stripe-settled traffic (including Apple Pay / Google Pay when
                    processed by Stripe).
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${
                    stripeLite.isLive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {stripeLite.isLive ? "Live Stripe" : "Stripe Preview"}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                <SummaryCard
                  label="Stripe gross"
                  value={formatCurrency(stripeLite.summary.grossPayments)}
                  helper="Stripe API + ledger"
                />
                <SummaryCard
                  label="Stripe fees"
                  value={formatCurrency(stripeLite.summary.stripeFees)}
                  helper="Processing fees"
                />
                <SummaryCard
                  label="Available"
                  value={formatCurrency(stripeLite.summary.availableBalance)}
                  helper="Stripe available balance"
                />
                <SummaryCard
                  label="Pending"
                  value={formatCurrency(stripeLite.summary.pendingBalance)}
                  helper="Stripe pending balance"
                />
                <SummaryCard
                  label="Matched deposits"
                  value={String(stripeLite.summary.matchedDeposits)}
                  helper="Payouts matched to Plaid/NFCU"
                />
                <SummaryCard
                  label="Unmatched"
                  value={String(stripeLite.summary.unmatchedDeposits)}
                  helper={`${stripeLite.summary.payoutCount} payout batches`}
                />
              </div>
            </section>
          ) : null}

          {gateway === "plaid" ? (
            <section className="mt-6 rounded-[1.5rem] border border-sky-100 bg-sky-50 p-5">
              <h2 className="text-lg font-black text-slate-950">
                Plaid / NFCU banking
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                Plaid is the business-banking gateway for deposit matching — not a
                customer checkout processor. Open Banking to review accounts,
                balances, posted transactions, and Stripe payout matches.
              </p>
              <Link
                href="/admin/financials/plaid"
                className="mt-4 inline-flex rounded-2xl bg-[#0D5C3A] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-emerald-900"
              >
                Open NFCU / Plaid Banking
              </Link>
            </section>
          ) : null}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Gateway transactions
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {gateway === "all"
                    ? "All providers in this range"
                    : `${selectedSummary?.label || "Gateway"} activity in this range`}
                </p>
              </div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                {data.transactions.length.toLocaleString()} shown
              </p>
            </div>

            {data.transactions.length === 0 ? (
              <div className="mt-5 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
                <h3 className="text-base font-black text-slate-950">
                  No gateway activity yet
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  When booking payments settle through Stripe or PayPal (including
                  Apple Pay, Google Pay, and Venmo), they appear here tagged by
                  gateway.
                </p>
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                      <th className="px-2 py-3">When</th>
                      <th className="px-2 py-3">Gateway</th>
                      <th className="px-2 py-3">Customer</th>
                      <th className="px-2 py-3">Method</th>
                      <th className="px-2 py-3">Status</th>
                      <th className="px-2 py-3 text-right">Amount</th>
                      <th className="px-2 py-3 text-right">Fee</th>
                      <th className="px-2 py-3 text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-slate-50 align-top"
                      >
                        <td className="px-2 py-3 font-semibold text-slate-600">
                          {formatDateTime(transaction.createdAt)}
                        </td>
                        <td className="px-2 py-3">
                          <button
                            type="button"
                            onClick={() => setGateway(transaction.gateway)}
                            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-800 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                          >
                            {transaction.gatewayLabel}
                          </button>
                          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            via {transaction.processor}
                          </p>
                        </td>
                        <td className="px-2 py-3">
                          <p className="font-black text-slate-900">
                            {transaction.customerName}
                          </p>
                          <p className="text-xs font-semibold text-slate-500">
                            {transaction.customerEmail ||
                              transaction.bookingReference ||
                              transaction.providerReference}
                          </p>
                        </td>
                        <td className="px-2 py-3 font-semibold text-slate-700">
                          {transaction.paymentMethod}
                        </td>
                        <td className="px-2 py-3">
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-600">
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-right font-black text-slate-950">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-2 py-3 text-right font-semibold text-slate-600">
                          {formatCurrency(transaction.fee)}
                        </td>
                        <td className="px-2 py-3 text-right font-black text-emerald-800">
                          {formatCurrency(transaction.net)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {showPaypalMerchants ? (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-xl font-black text-slate-950">
                  PayPal merchant readiness
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Guru PayPal connections that unlock PayPal / Venmo checkout.
                </p>

                {data.merchants.length === 0 ? (
                  <div className="mt-4 rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4">
                    <p className="text-sm font-semibold leading-6 text-slate-600">
                      No PayPal merchant accounts found yet. Gurus connect PayPal
                      from Earnings to enable PayPal and Venmo for eligible
                      bookings.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {data.merchants.slice(0, 8).map((merchant) => (
                      <div
                        key={merchant.id}
                        className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-slate-900">
                              {merchant.merchantEmail}
                            </p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                              {merchant.environment} · {merchant.id}
                            </p>
                          </div>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                              merchant.status === "connected" ||
                              merchant.paymentsReceivable
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-amber-200 bg-amber-50 text-amber-800"
                            }`}
                          >
                            {merchant.status}
                          </span>
                        </div>
                        <p className="mt-2 text-xs font-semibold text-slate-500">
                          Synced {formatDateTime(merchant.lastSyncedAt)}
                          {merchant.paymentsReceivable
                            ? " · payments receivable"
                            : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ) : null}

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-black text-slate-950">Source health</h2>
              <div className="mt-4 space-y-3">
                {(data.sourceHealth.length
                  ? data.sourceHealth
                  : [
                      {
                        id: "pending",
                        label: "Payment gateways",
                        ok: false,
                        message: "Waiting for source checks.",
                        rowCount: 0,
                      },
                    ]
                ).map((source) => (
                  <div
                    key={source.id}
                    className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black text-slate-900">{source.label}</p>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                          source.ok
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-amber-200 bg-amber-50 text-amber-800"
                        }`}
                      >
                        {source.ok ? "Connected" : "Pending"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      {source.message}
                    </p>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                      {source.rowCount.toLocaleString()} rows
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  ["Cash Flow", "/admin/financials/cash-flow"],
                  ["Profit & Loss", "/admin/financials/profit-loss"],
                  ["General Ledger", "/admin/financials/general-ledger"],
                  ["Reconciliation", "/admin/financials/reconciliation"],
                  ["Plaid Banking", "/admin/financials/plaid"],
                ].map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
