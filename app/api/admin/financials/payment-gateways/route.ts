import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";
import {
  PAYMENT_GATEWAY_META,
  classifyPaymentGateway,
  parsePaymentGatewayFilter,
  type PaymentGatewayFilter,
  type PaymentGatewayId,
  type PaymentGatewayRange,
} from "@/lib/admin/financials/payment-gateways";
import { asAnyRows } from "@/lib/supabase/as-rows";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AnyRow = Record<string, unknown>;

type GatewaySummary = {
  id: PaymentGatewayId;
  label: string;
  shortLabel: string;
  logoSrc: string | null;
  role: "processor" | "wallet" | "banking";
  parentProcessor: "stripe" | "paypal" | "plaid" | null;
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

type SourceHealth = {
  id: string;
  label: string;
  ok: boolean;
  message: string;
  rowCount: number;
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

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function centsToDollars(value: unknown) {
  return asNumber(value) / 100;
}

function getText(row: AnyRow, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }
  return fallback;
}

function getDate(row: AnyRow) {
  return (
    getText(row, [
      "paid_at",
      "occurred_at",
      "created_at",
      "updated_at",
      "posted_at",
      "transaction_date",
      "refunded_at",
      "last_synced_at",
    ]) || null
  );
}

function moneyFromRow(row: AnyRow) {
  if ("amount_cents" in row || "subtotal_cents" in row) {
    return centsToDollars(
      row.amount_cents ?? row.subtotal_cents ?? row.gross_amount_cents ?? 0,
    );
  }

  return asNumber(
    row.amount ?? row.gross_amount ?? row.total ?? row.payment_amount ?? 0,
  );
}

function feeFromRow(row: AnyRow) {
  if ("fee_cents" in row || "processing_fee_cents" in row || "stripe_fee_cents" in row) {
    return centsToDollars(
      row.fee_cents ?? row.processing_fee_cents ?? row.stripe_fee_cents ?? 0,
    );
  }

  return asNumber(row.fee ?? row.processing_fee ?? row.stripe_fee ?? 0);
}

function refundFromRow(row: AnyRow) {
  if ("refund_amount_cents" in row) {
    return centsToDollars(row.refund_amount_cents);
  }

  return asNumber(row.refund_amount ?? row.refunded_amount ?? 0);
}

function parseRangeBoundary(
  value: string | null,
  edge: "start" | "end",
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return edge === "start"
      ? `${trimmed}T00:00:00.000Z`
      : `${trimmed}T23:59:59.999Z`;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
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

function parseRange(value: string | null): PaymentGatewayRange {
  const allowed: PaymentGatewayRange[] = [
    "today",
    "week",
    "month",
    "quarter",
    "annual",
    "ytd",
  ];
  if (value && allowed.includes(value as PaymentGatewayRange)) {
    return value as PaymentGatewayRange;
  }
  return "month";
}

function isWithinRange(
  isoDate: string | null,
  startIso: string | null,
  endIso: string | null,
) {
  if (!isoDate) return true;
  const time = new Date(isoDate).getTime();
  if (Number.isNaN(time)) return true;
  if (startIso && time < new Date(startIso).getTime()) return false;
  if (endIso && time > new Date(endIso).getTime()) return false;
  return true;
}


async function safeSelect(
  table: string,
  columns = "*",
  limit = 500,
): Promise<{ ok: boolean; rows: AnyRow[]; message: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select(columns)
      .limit(limit);

    if (error) {
      return { ok: false, rows: [], message: error.message };
    }

    return {
      ok: true,
      rows: asAnyRows(data),
      message: `${table} connected`,
    };
  } catch (error) {
    return {
      ok: false,
      rows: [],
      message: error instanceof Error ? error.message : `Unable to read ${table}`,
    };
  }
}

function emptyGatewaySummaries(): GatewaySummary[] {
  return PAYMENT_GATEWAY_META.map((meta) => ({
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
    statusMessage:
      meta.role === "banking"
        ? "Open Plaid banking for deposit matching and account sync."
        : "No activity in this range yet.",
  }));
}

function normalizePaymentRow(row: AnyRow, index: number): GatewayTransaction {
  const provider = getText(row, ["provider"], "stripe");
  const paymentMethodType = getText(row, [
    "payment_method_type",
    "payment_method",
    "method",
  ]);
  const paymentMethodLabel = getText(row, [
    "payment_method_label",
    "payment_method_name",
  ]);
  const gateway = classifyPaymentGateway({
    provider,
    paymentMethodType,
    paymentMethodLabel,
    description: getText(row, ["description", "memo"]),
    source: getText(row, ["__source_table"]),
  });
  const meta = PAYMENT_GATEWAY_META.find((item) => item.id === gateway);
  const amount = moneyFromRow(row);
  const fee = feeFromRow(row);
  const refund = refundFromRow(row);
  const status = getText(row, ["status", "payment_status"], "pending").toLowerCase();
  const isRefund =
    status.includes("refund") || (refund > 0 && amount <= 0);

  return {
    id: getText(row, ["id", "payment_id"], `gateway-txn-${index}`),
    createdAt: getDate(row) || new Date().toISOString(),
    gateway,
    gatewayLabel: meta?.label || "Stripe",
    processor: provider || meta?.parentProcessor || "stripe",
    customerName: getText(
      row,
      ["customer_name", "pet_parent_name", "name", "billing_name"],
      "Customer",
    ),
    customerEmail: getText(row, ["customer_email", "email", "billing_email"]),
    description: getText(
      row,
      ["description", "memo", "payment_method_label"],
      `${meta?.label || "Payment"} transaction`,
    ),
    paymentMethod:
      paymentMethodLabel ||
      paymentMethodType ||
      meta?.shortLabel ||
      "Payment",
    amount: isRefund ? -Math.abs(refund || amount) : Math.abs(amount),
    fee: Math.abs(fee),
    net: Math.max(Math.abs(amount) - Math.abs(fee) - Math.abs(refund), 0),
    status: status || "pending",
    bookingReference:
      getText(row, ["booking_id", "booking_reference", "reservation_id"]) ||
      null,
    providerReference:
      getText(row, [
        "stripe_payment_intent_id",
        "stripe_charge_id",
        "stripe_checkout_session_id",
        "paypal_order_id",
        "paypal_capture_id",
        "provider_reference",
        "id",
      ]) || "Pending reference",
  };
}

function applyGatewayFilter(
  transactions: GatewayTransaction[],
  filter: PaymentGatewayFilter,
) {
  if (filter === "all") return transactions;
  return transactions.filter((transaction) => transaction.gateway === filter);
}

function buildSummaries(
  transactions: GatewayTransaction[],
  paypalAccounts: MerchantAccount[],
  plaidRowCount: number,
  plaidOk: boolean,
): GatewaySummary[] {
  const summaries = emptyGatewaySummaries();
  const byId = new Map(summaries.map((summary) => [summary.id, summary]));

  for (const transaction of transactions) {
    const summary = byId.get(transaction.gateway);
    if (!summary) continue;

    summary.transactionCount += 1;

    if (transaction.amount < 0 || transaction.status.includes("refund")) {
      summary.refunds += Math.abs(transaction.amount);
      summary.refundCount += 1;
    } else {
      summary.grossVolume += Math.max(transaction.amount, 0);
      summary.fees += Math.max(transaction.fee, 0);
      summary.netVolume += Math.max(transaction.net, 0);
    }

    summary.status = "live";
    summary.statusMessage = `${summary.transactionCount.toLocaleString()} transactions in range`;
  }

  const paypalSummary = byId.get("paypal");
  if (paypalSummary) {
    paypalSummary.connectedAccounts = paypalAccounts.length;
    paypalSummary.readyAccounts = paypalAccounts.filter(
      (account) =>
        account.status === "connected" || account.paymentsReceivable,
    ).length;

    if (paypalAccounts.length > 0 && paypalSummary.transactionCount === 0) {
      paypalSummary.status = "partial";
      paypalSummary.statusMessage = `${paypalSummary.readyAccounts}/${paypalSummary.connectedAccounts} PayPal merchants ready`;
    } else if (paypalAccounts.length > 0) {
      paypalSummary.statusMessage = `${paypalSummary.statusMessage} · ${paypalSummary.readyAccounts} merchants ready`;
    }
  }

  const venmoSummary = byId.get("venmo");
  if (venmoSummary && venmoSummary.transactionCount === 0 && paypalAccounts.length > 0) {
    venmoSummary.status = "partial";
    venmoSummary.statusMessage =
      "Venmo rides on PayPal eligibility — no Venmo-tagged volume in this range.";
  }

  const plaidSummary = byId.get("plaid");
  if (plaidSummary) {
    plaidSummary.transactionCount = plaidRowCount;
    plaidSummary.status = "banking";
    plaidSummary.statusMessage = plaidOk
      ? `${plaidRowCount.toLocaleString()} banking rows available for deposit matching`
      : "Connect NFCU / Plaid banking to match payout deposits.";
  }

  for (const summary of summaries) {
    if (summary.transactionCount > 0 && summary.status === "idle") {
      summary.status = "live";
    }
  }

  return summaries;
}

export async function GET(request: NextRequest) {
  const financeCheck = await requireFinanceAdminApi();
  if (!financeCheck.identity) {
    return financeCheck.response;
  }

  const range = parseRange(request.nextUrl.searchParams.get("range"));
  const filter = parsePaymentGatewayFilter(
    request.nextUrl.searchParams.get("gateway") ||
      request.nextUrl.searchParams.get("provider"),
  );
  const defaults = getRangeDates(range);
  const startIso = parseRangeBoundary(
    request.nextUrl.searchParams.get("startDate") || defaults.startDate,
    "start",
  );
  const endIso = parseRangeBoundary(
    request.nextUrl.searchParams.get("endDate") || defaults.endDate,
    "end",
  );

  const paymentTables = [
    "booking_payments",
    "payments",
    "stripe_transactions",
  ];

  let paymentRows: AnyRow[] = [];
  let paymentsOk = false;
  let paymentsMessage = "No payment ledger tables available yet.";

  for (const table of paymentTables) {
    const result = await safeSelect(table, "*", 800);
    if (!result.ok) continue;
    paymentsOk = true;
    paymentsMessage = result.message;
    paymentRows = [
      ...paymentRows,
      ...result.rows.map((row) => ({ ...row, __source_table: table })),
    ];
  }

  const paypalResult = await safeSelect(
    "paypal_merchant_accounts",
    "user_id, environment, status, merchant_email, payments_receivable, paypal_merchant_id, last_synced_at, tracking_id",
    500,
  );

  const plaidTables = [
    "admin_plaid_transactions",
    "bank_transactions",
    "plaid_bank_transactions",
  ];
  let plaidRows: AnyRow[] = [];
  let plaidOk = false;
  let plaidMessage = "Plaid banking tables not connected yet.";

  for (const table of plaidTables) {
    const result = await safeSelect(table, "*", 300);
    if (!result.ok) continue;
    plaidOk = true;
    plaidMessage = result.message;
    plaidRows = result.rows;
    break;
  }

  const allTransactions = paymentRows
    .map(normalizePaymentRow)
    .filter((transaction) =>
      isWithinRange(transaction.createdAt, startIso, endIso),
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const paypalAccounts: MerchantAccount[] = paypalResult.rows.map(
    (row, index) => ({
      id:
        getText(row, ["paypal_merchant_id", "tracking_id", "user_id"]) ||
        `paypal-merchant-${index}`,
      gateway: "paypal" as const,
      merchantEmail: getText(row, ["merchant_email"], "Merchant"),
      status: getText(row, ["status"], "not_started"),
      paymentsReceivable: Boolean(row.payments_receivable),
      environment: getText(row, ["environment"], "live"),
      lastSyncedAt: getDate(row),
    }),
  );

  const summaries = buildSummaries(
    allTransactions,
    paypalAccounts,
    plaidRows.filter((row) => isWithinRange(getDate(row), startIso, endIso))
      .length,
    plaidOk,
  );

  const transactions = applyGatewayFilter(allTransactions, filter).slice(0, 200);

  const totals = summaries.reduce(
    (acc, summary) => {
      if (summary.id === "plaid") return acc;
      acc.grossVolume += summary.grossVolume;
      acc.netVolume += summary.netVolume;
      acc.refunds += summary.refunds;
      acc.fees += summary.fees;
      acc.transactionCount += summary.transactionCount;
      return acc;
    },
    {
      grossVolume: 0,
      netVolume: 0,
      refunds: 0,
      fees: 0,
      transactionCount: 0,
    },
  );

  const sourceHealth: SourceHealth[] = [
    {
      id: "payment-ledgers",
      label: "Payment Ledgers",
      ok: paymentsOk,
      message: paymentsMessage,
      rowCount: paymentRows.length,
    },
    {
      id: "paypal-merchants",
      label: "PayPal Merchant Accounts",
      ok: paypalResult.ok,
      message: paypalResult.ok
        ? `${paypalAccounts.length} merchant records`
        : paypalResult.message,
      rowCount: paypalAccounts.length,
    },
    {
      id: "plaid-banking",
      label: "Plaid / NFCU Banking",
      ok: plaidOk,
      message: plaidMessage,
      rowCount: plaidRows.length,
    },
  ];

  const isLive = sourceHealth.some((source) => source.ok);

  return NextResponse.json({
    ok: true,
    isLive,
    generatedAt: new Date().toISOString(),
    range,
    gateway: filter,
    message: isLive
      ? "Payment gateway activity loaded by provider."
      : "Payment gateway route is ready. Connect Stripe/PayPal ledgers and Plaid banking to populate live totals.",
    totals,
    gateways: summaries,
    transactions,
    merchants: paypalAccounts.slice(0, 50),
    sourceHealth,
  });
}
