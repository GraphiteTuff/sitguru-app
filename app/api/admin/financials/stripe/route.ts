import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";
import { getStripeServer } from "@/lib/stripe/server";
import type Stripe from "stripe";
import { asAnyRows } from "@/lib/supabase/as-rows";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AnyRow = Record<string, unknown>;

type StripeRange = "today" | "week" | "month" | "quarter" | "annual" | "ytd";

type StripeTransactionStatus =
  | "paid"
  | "pending"
  | "refunded"
  | "disputed"
  | "failed";

type StripeTransactionType =
  | "payment"
  | "refund"
  | "dispute"
  | "fee"
  | "transfer"
  | "adjustment";

type ReconciliationStatus = "matched" | "needs_review" | "pending" | "unmatched";

type StripePayoutStatus = "paid" | "pending" | "in_transit" | "failed";

type SafeTableResult = {
  table: string;
  rows: AnyRow[];
  ok: boolean;
  message: string;
};

type SourceHealth = {
  id: string;
  label: string;
  ok: boolean;
  message: string;
  rowCount: number;
};

type NormalizedTransaction = {
  id: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  description: string;
  amount: number;
  fee: number;
  net: number;
  status: StripeTransactionStatus;
  type: StripeTransactionType;
  stripeReference: string;
  bookingReference: string | null;
  matchedBankDeposit: boolean;
  reconciliationStatus: ReconciliationStatus;
  sourceTable?: string;
};

type NormalizedPayout = {
  id: string;
  arrivalDate: string;
  amount: number;
  feeTotal: number;
  netAmount: number;
  status: StripePayoutStatus;
  stripePayoutId: string;
  bankDescription: string;
  bankMatched: boolean;
  plaidTransactionId: string | null;
};

const candidateTables = {
  stripeTransactions: [
    "booking_payments",
    "payments",
    "stripe_transactions",
    "stripe_balance_transactions",
    "stripe_payment_intents",
    "stripe_charges",
    "trust_safety_financial_events",
    "guru_trust_safety_plan_purchases",
    "booking_trust_safety_deductions",
  ],
  stripePayouts: [
    "stripe_payouts",
    "stripe_transfers",
    "payouts",
    "financial_payouts",
  ],
  stripeRefunds: [
    "stripe_refunds",
    "refunds",
    "payment_refunds",
    "financial_refunds",
  ],
  stripeDisputes: [
    "stripe_disputes",
    "stripe_chargebacks",
    "disputes",
    "chargebacks",
    "financial_disputes",
  ],
  plaidTransactions: [
    "admin_plaid_transactions",
    "bank_transactions",
    "financial_bank_transactions",
    "banking_transactions",
    "plaid_bank_transactions",
  ],
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

function normalizeMoney(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    if (!(key in row)) continue;

    const value = asNumber(row[key]);
    if (!value) continue;

    const lowerKey = key.toLowerCase();

    if (
      lowerKey.includes("cents") ||
      lowerKey.includes("_cent") ||
      lowerKey === "amount_received" ||
      lowerKey === "amount_captured" ||
      lowerKey === "amount_refunded" ||
      lowerKey === "application_fee_amount"
    ) {
      return centsToDollars(value);
    }

    return value;
  }

  return 0;
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
      "created",
      "date",
      "arrival_date",
      "available_on",
      "posted_at",
      "transaction_date",
      "start_time",
      "booking_date",
      "refunded_at",
    ]) || null
  );
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

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
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
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

function isWithinRange(row: AnyRow, startDate: string, endDate: string) {
  const dateValue = getDate(row);
  if (!dateValue) return true;

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return true;

  return parsed >= new Date(startDate) && parsed <= new Date(endDate);
}

async function safeQueryTable(table: string, limit = 1000): Promise<SafeTableResult> {
  try {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select("*")
      .limit(limit);

    if (error) {
      return {
        table,
        rows: [],
        ok: false,
        message: error.message,
      };
    }

    return {
      table,
      rows: asAnyRows(data).filter(Boolean),
      ok: true,
      message: "Connected.",
    };
  } catch (error) {
    return {
      table,
      rows: [],
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to query this source.",
    };
  }
}

async function queryCandidateTables(tables: string[], limit = 1000) {
  const results = await Promise.all(
    tables.map((table) => safeQueryTable(table, limit)),
  );

  const connected = results.filter((result) => result.ok);
  const rows = connected.flatMap((result) =>
    result.rows.map((row) => ({
      ...row,
      __source_table: result.table,
    })),
  );

  return {
    results,
    connected,
    rows,
    ok: connected.length > 0,
  };
}

function getStripeStatus(row: AnyRow): StripeTransactionStatus {
  const status = getText(row, [
    "status",
    "payment_status",
    "stripe_status",
    "charge_status",
    "repayment_status",
  ]).toLowerCase();

  const eventType = getText(row, ["event_type", "type", "transaction_type"]).toLowerCase();

  const refundedAmount = normalizeMoney(row, [
    "amount_refunded",
    "amount_refunded_cents",
    "refunded_amount",
    "refunded_amount_cents",
  ]);

  if (
    status.includes("dispute") ||
    status.includes("chargeback") ||
    eventType.includes("dispute") ||
    eventType.includes("chargeback")
  ) {
    return "disputed";
  }

  if (
    status.includes("refund") ||
    eventType.includes("refund") ||
    refundedAmount > 0
  ) {
    return "refunded";
  }

  if (
    status.includes("paid") ||
    status.includes("posted") ||
    status.includes("succeeded") ||
    status.includes("complete") ||
    status.includes("confirmed")
  ) {
    return "paid";
  }

  if (
    status.includes("fail") ||
    status.includes("cancel") ||
    status.includes("void")
  ) {
    return "failed";
  }

  return "pending";
}

function getStripeType(row: AnyRow): StripeTransactionType {
  const type = getText(row, [
    "event_type",
    "type",
    "transaction_type",
    "stripe_type",
    "reporting_category",
  ]).toLowerCase();

  const description = getText(row, ["description", "memo", "name"]).toLowerCase();

  if (type.includes("refund") || description.includes("refund")) return "refund";
  if (type.includes("dispute") || description.includes("dispute")) return "dispute";
  if (type.includes("chargeback") || description.includes("chargeback")) {
    return "dispute";
  }
  if (type.includes("fee") || description.includes("fee")) return "fee";
  if (type.includes("transfer") || type.includes("payout")) return "transfer";
  if (type.includes("adjustment")) return "adjustment";

  return "payment";
}

function getReconciliationStatus(row: AnyRow): ReconciliationStatus {
  const status = getText(row, [
    "reconciliation_status",
    "match_status",
    "bank_match_status",
    "plaid_match_status",
  ]).toLowerCase();

  const plaidId = getText(row, [
    "plaid_transaction_id",
    "bank_transaction_id",
    "matched_bank_transaction_id",
  ]);

  if (status.includes("matched") || plaidId) return "matched";
  if (status.includes("review")) return "needs_review";
  if (status.includes("unmatched")) return "unmatched";

  return "pending";
}

function getPayoutStatus(row: AnyRow): StripePayoutStatus {
  const status = getText(row, [
    "status",
    "payout_status",
    "transfer_status",
    "stripe_status",
  ]).toLowerCase();

  if (status.includes("paid") || status.includes("complete")) return "paid";
  if (status.includes("transit") || status.includes("in_transit")) {
    return "in_transit";
  }
  if (status.includes("fail") || status.includes("cancel")) return "failed";

  return "pending";
}

function rowHasStripeReference(row: AnyRow) {
  return Boolean(
    getText(row, [
      "stripe_reference",
      "stripe_id",
      "stripe_checkout_session_id",
      "stripe_session_id",
      "stripe_payment_intent_id",
      "payment_intent_id",
      "stripe_charge_id",
      "charge_id",
      "balance_transaction_id",
      "stripe_balance_transaction_id",
      "stripe_customer_id",
      "stripe_subscription_id",
      "stripe_payout_id",
      "stripe_refund_id",
      "stripe_dispute_id",
    ]),
  );
}

function rowLooksLikeRealStripePayment(row: AnyRow) {
  const source = getText(row, ["__source_table"]).toLowerCase();
  const status = getStripeStatus(row);
  const type = getStripeType(row);
  const provider = getText(row, ["provider"]).toLowerCase();

  if (provider && provider !== "stripe") return false;
  if (!rowHasStripeReference(row)) return false;
  if (status === "failed") return false;
  if (type !== "payment" && type !== "adjustment") return false;

  /*
    Do not let generic bookings/customer records become Stripe revenue.
    Payments are allowed only when they live in payment/Stripe tables and
    contain a Stripe reference.
  */
  return (
    source.includes("payment") ||
    source.includes("stripe") ||
    source.includes("trust_safety") ||
    source.includes("deduction")
  );
}

function rowLooksLikePayout(row: AnyRow) {
  const table = getText(row, ["__source_table"]).toLowerCase();
  const status = getText(row, ["payout_status", "status"]).toLowerCase();

  return (
    table.includes("payout") ||
    table.includes("transfer") ||
    status.includes("payout") ||
    Boolean(getText(row, ["stripe_payout_id", "payout_id", "transfer_id"]))
  );
}

function normalizeStripeTransaction(row: AnyRow, index: number) {
  const grossFromTrustSafety = normalizeMoney(row, [
    "gross_amount_cents",
    "due_today_cents",
    "amount_paid_cents",
    "gross_plan_value_cents",
  ]);

  const amount =
    grossFromTrustSafety ||
    normalizeMoney(row, [
      "gross_amount",
      "amount",
      "amount_cents",
      "amount_received",
      "amount_captured",
      "total",
      "total_amount",
      "payment_amount",
      "charge_amount",
      "total_customer_paid",
      "subtotal_amount",
    ]);

  const fee = normalizeMoney(row, [
    "stripe_fee",
    "stripe_fee_cents",
    "fee",
    "fee_cents",
    "fee_amount_cents",
    "processing_fee",
    "processing_fee_cents",
    "application_fee_amount",
    "sitguru_fee_amount",
  ]);

  const explicitNet = normalizeMoney(row, [
    "net",
    "net_amount",
    "net_amount_cents",
    "net_payment",
    "net_payment_cents",
    "guru_net_amount",
    "platform_revenue",
    "platform_fee",
    "sitguru_fee",
  ]);

  const net = explicitNet || Math.max(amount - fee, 0);
  const status = getStripeStatus(row);
  const type = getStripeType(row);
  const reconciliationStatus = getReconciliationStatus(row);

  return {
    id:
      getText(row, [
        "id",
        "stripe_id",
        "stripe_checkout_session_id",
        "stripe_session_id",
        "payment_intent_id",
        "stripe_payment_intent_id",
        "charge_id",
        "stripe_charge_id",
        "balance_transaction_id",
      ]) || `stripe-transaction-${index}`,
    createdAt: getDate(row) || new Date().toISOString(),
    customerName: getText(
      row,
      [
        "customer_name",
        "pet_parent_name",
        "name",
        "billing_name",
        "guru_name",
        "plan_name",
      ],
      "Customer",
    ),
    customerEmail: getText(row, ["customer_email", "email", "billing_email"]),
    description: getText(
      row,
      ["description", "memo", "statement_descriptor", "event_type", "type", "plan_name"],
      "Stripe transaction",
    ),
    amount,
    fee,
    net,
    status,
    type,
    stripeReference:
      getText(row, [
        "stripe_reference",
        "stripe_checkout_session_id",
        "stripe_session_id",
        "stripe_payment_intent_id",
        "payment_intent_id",
        "stripe_charge_id",
        "charge_id",
        "balance_transaction_id",
        "stripe_balance_transaction_id",
        "id",
      ]) || "Pending reference",
    bookingReference:
      getText(row, ["booking_id", "booking_reference", "reservation_id"]) ||
      null,
    matchedBankDeposit: reconciliationStatus === "matched",
    reconciliationStatus,
    sourceTable: getText(row, ["__source_table"]),
  };
}

function normalizePayout(row: AnyRow, index: number) {
  const amount = normalizeMoney(row, [
    "amount",
    "amount_cents",
    "gross_amount",
    "gross_amount_cents",
    "transfer_amount",
    "transfer_amount_cents",
    "guru_net_amount",
    "payout_amount",
  ]);

  const feeTotal = normalizeMoney(row, [
    "fee",
    "fee_cents",
    "stripe_fee",
    "stripe_fee_cents",
    "fee_total",
    "fee_total_cents",
    "sitguru_fee_amount",
  ]);

  const explicitNet = normalizeMoney(row, [
    "net",
    "net_amount",
    "net_amount_cents",
    "payout_net",
    "payout_net_cents",
    "guru_net_amount",
  ]);

  const netAmount = explicitNet || Math.max(amount - feeTotal, 0);

  const plaidTransactionId =
    getText(row, [
      "plaid_transaction_id",
      "bank_transaction_id",
      "matched_bank_transaction_id",
    ]) || null;

  return {
    id: getText(row, ["id", "stripe_payout_id", "payout_id"]) || `payout-${index}`,
    arrivalDate: getDate(row) || new Date().toISOString(),
    amount,
    feeTotal,
    netAmount,
    status: getPayoutStatus(row),
    stripePayoutId:
      getText(row, ["stripe_payout_id", "payout_id", "transfer_id", "id"]) ||
      "Pending payout reference",
    bankDescription:
      getText(row, ["bank_description", "description", "memo", "name"]) ||
      "Pending NFCU/Plaid match",
    bankMatched: Boolean(plaidTransactionId),
    plaidTransactionId,
  };
}

function normalizeRefund(row: AnyRow, index: number) {
  const amount = normalizeMoney(row, [
    "amount",
    "amount_cents",
    "refund_amount",
    "refund_amount_cents",
    "amount_refunded",
    "amount_refunded_cents",
  ]);

  return {
    id: getText(row, ["id", "stripe_refund_id", "refund_id"]) || `refund-${index}`,
    createdAt: getDate(row) || new Date().toISOString(),
    customerName: getText(row, ["customer_name", "pet_parent_name"], "Customer"),
    customerEmail: getText(row, ["customer_email", "email"]),
    description: getText(row, ["description", "reason"], "Stripe refund"),
    amount,
    fee: 0,
    net: -Math.abs(amount),
    status: "refunded" as StripeTransactionStatus,
    type: "refund" as StripeTransactionType,
    stripeReference:
      getText(row, ["stripe_refund_id", "refund_id", "stripe_id", "id"]) ||
      "Pending refund reference",
    bookingReference:
      getText(row, ["booking_id", "booking_reference", "reservation_id"]) ||
      null,
    matchedBankDeposit: false,
    reconciliationStatus: getReconciliationStatus(row),
    sourceTable: getText(row, ["__source_table"]),
  };
}

function normalizeDispute(row: AnyRow, index: number) {
  const amount = normalizeMoney(row, [
    "amount",
    "amount_cents",
    "dispute_amount",
    "dispute_amount_cents",
    "chargeback_amount",
    "chargeback_amount_cents",
  ]);

  return {
    id:
      getText(row, ["id", "stripe_dispute_id", "dispute_id"]) ||
      `dispute-${index}`,
    createdAt: getDate(row) || new Date().toISOString(),
    customerName: getText(row, ["customer_name", "pet_parent_name"], "Customer"),
    customerEmail: getText(row, ["customer_email", "email"]),
    description: getText(row, ["description", "reason"], "Stripe dispute"),
    amount,
    fee: 0,
    net: -Math.abs(amount),
    status: "disputed" as StripeTransactionStatus,
    type: "dispute" as StripeTransactionType,
    stripeReference:
      getText(row, ["stripe_dispute_id", "dispute_id", "stripe_id", "id"]) ||
      "Pending dispute reference",
    bookingReference:
      getText(row, ["booking_id", "booking_reference", "reservation_id"]) ||
      null,
    matchedBankDeposit: false,
    reconciliationStatus: getReconciliationStatus(row),
    sourceTable: getText(row, ["__source_table"]),
  };
}

function isStripeBankDeposit(row: AnyRow) {
  const text = [
    getText(row, ["name"]),
    getText(row, ["merchant_name"]),
    getText(row, ["description"]),
    getText(row, ["memo"]),
    getText(row, ["category"]),
  ]
    .join(" ")
    .toLowerCase();

  return (
    text.includes("stripe") ||
    text.includes("strp") ||
    text.includes("payment processing") ||
    text.includes("payout")
  );
}

function connectedTableMessage(connected: SafeTableResult[]) {
  if (!connected.length) return "No matching source table was found yet.";

  const withRows = connected.filter((source) => source.rows.length > 0);

  if (withRows.length) {
    return `Connected through ${withRows
      .map((source) => `${source.table} (${source.rows.length})`)
      .join(", ")}.`;
  }

  return `Connected table(s) found but no rows are stored yet: ${connected
    .map((source) => source.table)
    .join(", ")}.`;
}

function buildSourceHealth(params: {
  transactionConnected: SafeTableResult[];
  payoutConnected: SafeTableResult[];
  plaidConnected: SafeTableResult[];
  transactionCount: number;
  payoutCount: number;
  plaidStripeDeposits: number;
  liveStripeOk: boolean;
  liveStripeMessage: string;
  liveStripeRowCount: number;
}): SourceHealth[] {
  return [
    {
      id: "stripe-live-api",
      label: "Stripe Live API",
      ok: params.liveStripeOk,
      message: params.liveStripeMessage,
      rowCount: params.liveStripeRowCount,
    },
    {
      id: "stripe-financial-api",
      label: "Stripe Ledger Tables",
      ok: params.transactionConnected.length > 0,
      message: connectedTableMessage(params.transactionConnected),
      rowCount: params.transactionCount,
    },
    {
      id: "stripe-payouts",
      label: "Stripe Payouts",
      ok: params.payoutConnected.length > 0 || params.liveStripeOk,
      message: params.payoutConnected.length
        ? connectedTableMessage(params.payoutConnected)
        : params.liveStripeOk
          ? "Live Stripe payouts loaded from the Stripe API."
          : "No payout source table or live Stripe payouts found yet.",
      rowCount: params.payoutCount,
    },
    {
      id: "plaid-nfcu-deposit-matching",
      label: "Plaid/NFCU Deposit Matching",
      ok: params.plaidConnected.length > 0,
      message: params.plaidConnected.length
        ? `${connectedTableMessage(
            params.plaidConnected,
          )} Stripe payout deposits match by amount/date when customer payouts exist.`
        : "No Plaid/NFCU banking source table was found yet.",
      rowCount: params.plaidStripeDeposits,
    },
  ];
}

function uniqueByReference<T extends { id: string; stripeReference?: string }>(
  rows: T[],
) {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const row of rows) {
    const key = row.stripeReference || row.id;
    if (seen.has(key)) continue;

    seen.add(key);
    unique.push(row);
  }

  return unique;
}

function getLiveConnectedStatus(sourceHealth: SourceHealth[]) {
  return sourceHealth.some((source) => source.ok);
}

function tryGetStripeClient() {
  try {
    if (!process.env.STRIPE_SECRET_KEY?.trim()) return null;
    return getStripeServer();
  } catch {
    return null;
  }
}

function stripeAmountToDollars(amount: number | null | undefined) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return 0;
  return amount / 100;
}

function sumStripeBalance(
  buckets: Stripe.Balance.Available[] | Stripe.Balance.Pending[] | undefined,
) {
  return (buckets || [])
    .filter((bucket) => String(bucket.currency || "").toLowerCase() === "usd")
    .reduce((sum, bucket) => sum + stripeAmountToDollars(bucket.amount), 0);
}

function mapLiveBalanceTransaction(
  txn: Stripe.BalanceTransaction,
): NormalizedTransaction {
  const typeRaw = String(txn.type || "").toLowerCase();
  let type: StripeTransactionType = "payment";
  let status: StripeTransactionStatus = "paid";

  if (typeRaw.includes("refund")) {
    type = "refund";
    status = "refunded";
  } else if (typeRaw.includes("dispute") || typeRaw.includes("chargeback")) {
    type = "dispute";
    status = "disputed";
  } else if (typeRaw.includes("fee") || typeRaw === "stripe_fee") {
    type = "fee";
  } else if (typeRaw.includes("payout") || typeRaw.includes("transfer")) {
    type = "transfer";
  } else if (typeRaw.includes("adjustment")) {
    type = "adjustment";
  }

  const amount = Math.abs(stripeAmountToDollars(txn.amount));
  const fee = Math.abs(stripeAmountToDollars(txn.fee));
  const net = stripeAmountToDollars(txn.net);

  return {
    id: txn.id,
    createdAt: new Date((txn.created || 0) * 1000).toISOString(),
    customerName: "Stripe",
    customerEmail: "",
    description: txn.description || `Stripe ${txn.type}`,
    amount,
    fee,
    net,
    status,
    type,
    stripeReference: txn.id,
    bookingReference: null,
    matchedBankDeposit: false,
    reconciliationStatus: "pending",
    sourceTable: "stripe_live_balance_transactions",
  };
}

function mapLivePayout(payout: Stripe.Payout): NormalizedPayout {
  const statusRaw = String(payout.status || "").toLowerCase();
  let status: StripePayoutStatus = "pending";
  if (statusRaw === "paid") status = "paid";
  else if (statusRaw === "in_transit") status = "in_transit";
  else if (statusRaw === "failed" || statusRaw === "canceled") status = "failed";

  const amount = Math.abs(stripeAmountToDollars(payout.amount));

  return {
    id: payout.id,
    arrivalDate: payout.arrival_date
      ? new Date(payout.arrival_date * 1000).toISOString()
      : new Date((payout.created || 0) * 1000).toISOString(),
    amount,
    feeTotal: 0,
    netAmount: amount,
    status,
    stripePayoutId: payout.id,
    bankDescription:
      payout.description ||
      payout.statement_descriptor ||
      "Stripe payout to bank",
    bankMatched: false,
    plaidTransactionId: null,
  };
}

async function loadLiveStripeData(startDate: string, endDate: string) {
  const stripe = tryGetStripeClient();

  if (!stripe) {
    return {
      ok: false,
      message: "STRIPE_SECRET_KEY is not configured in this environment.",
      availableBalance: 0,
      pendingBalance: 0,
      transactions: [] as NormalizedTransaction[],
      payouts: [] as NormalizedPayout[],
      rowCount: 0,
    };
  }

  try {
    const createdGte = Math.floor(new Date(startDate).getTime() / 1000);
    const createdLte = Math.floor(new Date(endDate).getTime() / 1000);
    const createdFilter: { gte?: number; lte?: number } = {};
    if (Number.isFinite(createdGte)) createdFilter.gte = createdGte;
    if (Number.isFinite(createdLte)) createdFilter.lte = createdLte;

    const [balance, balanceTransactions, payouts] = await Promise.all([
      stripe.balance.retrieve(),
      stripe.balanceTransactions.list({
        limit: 100,
        ...(Object.keys(createdFilter).length
          ? { created: createdFilter }
          : {}),
      }),
      stripe.payouts.list({
        limit: 50,
        ...(Object.keys(createdFilter).length
          ? { created: createdFilter }
          : {}),
      }),
    ]);

    const transactions = (balanceTransactions.data || []).map(
      mapLiveBalanceTransaction,
    );
    const livePayouts = (payouts.data || []).map(mapLivePayout);

    return {
      ok: true,
      message: `Live Stripe connected. ${transactions.length} balance transactions, ${livePayouts.length} payouts.`,
      availableBalance: sumStripeBalance(balance.available),
      pendingBalance: sumStripeBalance(balance.pending),
      transactions,
      payouts: livePayouts,
      rowCount: transactions.length + livePayouts.length,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? `Stripe API error: ${error.message}`
          : "Unable to load live Stripe data.",
      availableBalance: 0,
      pendingBalance: 0,
      transactions: [] as NormalizedTransaction[],
      payouts: [] as NormalizedPayout[],
      rowCount: 0,
    };
  }
}

function daysBetween(a: string, b: string) {
  const left = new Date(a).getTime();
  const right = new Date(b).getTime();
  if (Number.isNaN(left) || Number.isNaN(right)) return Number.POSITIVE_INFINITY;
  return Math.abs(left - right) / (1000 * 60 * 60 * 24);
}

function matchPayoutsToPlaidDeposits(
  payouts: NormalizedPayout[],
  plaidDepositRows: AnyRow[],
): NormalizedPayout[] {
  const deposits = plaidDepositRows.map((row) => {
    const amount = Math.abs(
      normalizeMoney(row, [
        "amount",
        "amount_cents",
        "transaction_amount",
        "transaction_amount_cents",
      ]),
    );
    return {
      id:
        getText(row, ["transaction_id", "id", "plaid_transaction_id"]) ||
        `${getDate(row)}-${amount}`,
      transactionId:
        getText(row, ["transaction_id", "plaid_transaction_id", "id"]) || null,
      amount,
      date: getDate(row) || "",
      name:
        getText(row, ["name", "merchant_name", "description", "memo"]) ||
        "NFCU deposit",
    };
  });

  const used = new Set<string>();

  return payouts.map((payout) => {
    if (payout.bankMatched && payout.plaidTransactionId) return payout;

    const match = deposits.find((deposit) => {
      if (used.has(deposit.id)) return false;
      if (!deposit.amount || !payout.netAmount) return false;

      const amountClose =
        Math.abs(deposit.amount - Math.abs(payout.netAmount)) <= 1.05;
      const dateClose = daysBetween(deposit.date, payout.arrivalDate) <= 5;
      return amountClose && dateClose;
    });

    if (!match) return payout;

    used.add(match.id);

    return {
      ...payout,
      bankMatched: true,
      plaidTransactionId: match.transactionId,
      bankDescription: match.name,
    };
  });
}

function expandBookingPaymentRows(rows: AnyRow[]) {
  const expanded: AnyRow[] = [];

  for (const row of rows) {
    const source = getText(row, ["__source_table"]).toLowerCase();
    if (source !== "booking_payments") {
      expanded.push(row);
      continue;
    }

    expanded.push(row);

    const refundAmount = normalizeMoney(row, [
      "refund_amount_cents",
      "amount_refunded_cents",
      "refund_amount",
    ]);
    if (refundAmount > 0) {
      expanded.push({
        ...row,
        __source_table: "booking_payments_refunds",
        event_type: "refund",
        type: "refund",
        amount_cents: Math.round(refundAmount * 100),
        amount: refundAmount,
        status: "refunded",
        created_at: getText(row, ["refunded_at", "updated_at", "created_at"]),
        description: `Refund for booking ${getText(row, ["booking_id"]) || ""}`.trim(),
      });
    }

    const disputeAmount = normalizeMoney(row, [
      "dispute_amount_cents",
      "dispute_amount",
    ]);
    if (disputeAmount > 0 || getText(row, ["dispute_status"])) {
      expanded.push({
        ...row,
        __source_table: "booking_payments_disputes",
        event_type: "dispute",
        type: "dispute",
        amount_cents: Math.round(
          (disputeAmount ||
            normalizeMoney(row, ["amount_cents", "amount"])) *
            100,
        ),
        amount: disputeAmount || normalizeMoney(row, ["amount_cents", "amount"]),
        status: "disputed",
        description: getText(row, ["dispute_reason"], "Stripe dispute"),
      });
    }
  }

  return expanded;
}

export async function GET(request: Request) {
  const financeCheck = await requireFinanceAdminApi();
  if (!financeCheck.identity) {
    return financeCheck.response;
  }

  const url = new URL(request.url);
  const range = (url.searchParams.get("range") || "month") as StripeRange;
  const generatedAt = new Date().toISOString();

  const fallbackDates = getRangeDates(range);
  const startDate =
    parseRangeBoundary(url.searchParams.get("startDate"), "start") ||
    fallbackDates.startDate;
  const endDate =
    parseRangeBoundary(url.searchParams.get("endDate"), "end") ||
    fallbackDates.endDate;

  const [
    stripeTransactionResult,
    stripePayoutResult,
    stripeRefundResult,
    stripeDisputeResult,
    plaidResult,
    liveStripe,
  ] = await Promise.all([
    queryCandidateTables(candidateTables.stripeTransactions),
    queryCandidateTables(candidateTables.stripePayouts),
    queryCandidateTables(candidateTables.stripeRefunds),
    queryCandidateTables(candidateTables.stripeDisputes),
    queryCandidateTables(candidateTables.plaidTransactions),
    loadLiveStripeData(startDate, endDate),
  ]);

  const expandedPaymentRows = expandBookingPaymentRows(
    stripeTransactionResult.rows,
  );

  const stripePaymentRows = expandedPaymentRows
    .filter(rowLooksLikeRealStripePayment)
    .filter((row) => isWithinRange(row, startDate, endDate));

  const payoutRows = stripePayoutResult.rows
    .filter((row) => rowHasStripeReference(row) || rowLooksLikePayout(row))
    .filter((row) => isWithinRange(row, startDate, endDate));

  const refundRows = [
    ...stripeRefundResult.rows.filter(rowHasStripeReference),
    ...expandedPaymentRows.filter(
      (row) => getStripeType(row) === "refund" && rowHasStripeReference(row),
    ),
  ].filter((row) => isWithinRange(row, startDate, endDate));

  const disputeRows = [
    ...stripeDisputeResult.rows.filter(rowHasStripeReference),
    ...expandedPaymentRows.filter(
      (row) => getStripeType(row) === "dispute" && rowHasStripeReference(row),
    ),
  ].filter((row) => isWithinRange(row, startDate, endDate));

  const plaidRows = plaidResult.rows.filter((row) =>
    isWithinRange(row, startDate, endDate),
  );

  const dbTransactions = uniqueByReference([
    ...stripePaymentRows.map(normalizeStripeTransaction),
    ...refundRows.map(normalizeRefund),
    ...disputeRows.map(normalizeDispute),
  ]) as NormalizedTransaction[];

  const transactions = uniqueByReference([
    ...liveStripe.transactions,
    ...dbTransactions,
  ])
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 150) as NormalizedTransaction[];

  const dbPayouts = payoutRows.map(normalizePayout) as NormalizedPayout[];
  const plaidStripeDeposits = plaidRows.filter(isStripeBankDeposit);

  const payoutSeen = new Set<string>();
  const mergedPayouts: NormalizedPayout[] = [];
  for (const payout of [...liveStripe.payouts, ...dbPayouts]) {
    const key = payout.stripePayoutId || payout.id;
    if (payoutSeen.has(key)) continue;
    payoutSeen.add(key);
    mergedPayouts.push(payout);
  }

  const payouts = matchPayoutsToPlaidDeposits(
    mergedPayouts
      .sort(
        (a, b) =>
          new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime(),
      )
      .slice(0, 100),
    plaidStripeDeposits,
  );

  const grossPayments = transactions
    .filter((transaction) => transaction.type === "payment")
    .reduce((sum, transaction) => sum + Math.max(transaction.amount, 0), 0);

  const stripeFees = transactions.reduce(
    (sum, transaction) => sum + Math.abs(transaction.fee),
    0,
  );

  const refunds = transactions
    .filter((transaction) => transaction.type === "refund")
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

  const disputes = transactions
    .filter((transaction) => transaction.type === "dispute")
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

  const transfers = payouts.reduce(
    (sum, payout) => sum + Math.max(payout.netAmount, 0),
    0,
  );

  const matchedDeposits = payouts.filter((payout) => payout.bankMatched).length;
  const unmatchedDeposits = Math.max(payouts.length - matchedDeposits, 0);

  const payoutDeposits =
    plaidStripeDeposits.reduce(
      (sum, row) =>
        sum +
        Math.abs(
          normalizeMoney(row, [
            "amount",
            "amount_cents",
            "transaction_amount",
            "transaction_amount_cents",
          ]),
        ),
      0,
    ) || transfers;

  const netPayments = Math.max(grossPayments - stripeFees - refunds - disputes, 0);

  const sourceHealth = buildSourceHealth({
    transactionConnected: stripeTransactionResult.connected,
    payoutConnected: stripePayoutResult.connected,
    plaidConnected: plaidResult.connected,
    transactionCount: transactions.length,
    payoutCount: payouts.length,
    plaidStripeDeposits: plaidStripeDeposits.length,
    liveStripeOk: liveStripe.ok,
    liveStripeMessage: liveStripe.message,
    liveStripeRowCount: liveStripe.rowCount,
  });

  const isLive = getLiveConnectedStatus(sourceHealth);
  const hasStripeRows = transactions.length > 0 || payouts.length > 0;

  return NextResponse.json({
    ok: true,
    isLive,
    generatedAt,
    message: hasStripeRows
      ? liveStripe.ok
        ? "Live Stripe API + ledger/Plaid sources connected."
        : "Stripe ledger and/or Plaid sources connected."
      : liveStripe.ok
        ? "Live Stripe API connected. No customer payments or payouts in this range yet."
        : "Stripe financial route is ready. No live Stripe customer payments or payouts have been recorded yet.",
    range,
    summary: {
      grossPayments,
      netPayments,
      stripeFees,
      refunds,
      disputes,
      chargebacks: disputes,
      transfers,
      payoutDeposits,
      unmatchedDeposits,
      matchedDeposits,
      pendingBalance: liveStripe.pendingBalance,
      availableBalance: liveStripe.ok
        ? liveStripe.availableBalance
        : Math.max(netPayments - transfers, 0),
      transactionCount: transactions.length,
      payoutCount: payouts.length,
      refundCount: transactions.filter((transaction) => transaction.type === "refund")
        .length,
      disputeCount: transactions.filter(
        (transaction) => transaction.type === "dispute",
      ).length,
      lastSyncedAt: generatedAt,
    },
    transactions,
    payouts,
    sourceHealth,
  });
}