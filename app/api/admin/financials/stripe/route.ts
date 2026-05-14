import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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

const candidateTables = {
  stripeTransactions: [
    "trust_safety_financial_events",
    "bookings",
    "guru_trust_safety_plan_purchases",
    "stripe_transactions",
    "stripe_payment_intents",
    "stripe_charges",
    "payments",
    "booking_payments",
    "financial_transactions",
  ],
  stripePayouts: [
    "stripe_payouts",
    "stripe_transfers",
    "payouts",
    "financial_payouts",
    "bookings",
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
    "plaid_transactions",
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
    ]) || null
  );
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
      rows: ((data || []) as AnyRow[]).filter(Boolean),
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
      "stripe_customer_id",
      "stripe_subscription_id",
    ]),
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
        "id",
      ]) || "Pending reference",
    bookingReference:
      getText(row, ["booking_id", "booking_reference", "reservation_id"]) ||
      null,
    matchedBankDeposit: reconciliationStatus === "matched",
    reconciliationStatus,
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
}): SourceHealth[] {
  return [
    {
      id: "stripe-financial-api",
      label: "Stripe Financial API",
      ok: params.transactionConnected.length > 0,
      message: connectedTableMessage(params.transactionConnected),
      rowCount: params.transactionCount,
    },
    {
      id: "stripe-payouts",
      label: "Stripe Payouts",
      ok: params.payoutConnected.length > 0,
      message: connectedTableMessage(params.payoutConnected),
      rowCount: params.payoutCount,
    },
    {
      id: "plaid-nfcu-deposit-matching",
      label: "Plaid/NFCU Deposit Matching",
      ok: params.plaidConnected.length > 0,
      message: params.plaidConnected.length
        ? `${connectedTableMessage(
            params.plaidConnected,
          )} Stripe-related bank deposits are available for matching when payout deposits are present.`
        : "No Plaid/NFCU banking source table was found yet.",
      rowCount: params.plaidStripeDeposits,
    },
  ];
}

function uniqueByReference<T extends { id: string; stripeReference?: string }>(rows: T[]) {
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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const range = (url.searchParams.get("range") || "month") as StripeRange;
  const startDateParam = url.searchParams.get("startDate");
  const endDateParam = url.searchParams.get("endDate");
  const generatedAt = new Date().toISOString();

  const fallbackDates = getRangeDates(range);
  const startDate = startDateParam
    ? new Date(startDateParam).toISOString()
    : fallbackDates.startDate;
  const endDate = endDateParam
    ? new Date(endDateParam).toISOString()
    : fallbackDates.endDate;

  const [
    stripeTransactionResult,
    stripePayoutResult,
    stripeRefundResult,
    stripeDisputeResult,
    plaidResult,
  ] = await Promise.all([
    queryCandidateTables(candidateTables.stripeTransactions),
    queryCandidateTables(candidateTables.stripePayouts),
    queryCandidateTables(candidateTables.stripeRefunds),
    queryCandidateTables(candidateTables.stripeDisputes),
    queryCandidateTables(candidateTables.plaidTransactions),
  ]);

  const stripeRows = stripeTransactionResult.rows
    .filter(rowHasStripeReference)
    .filter((row) => isWithinRange(row, startDate, endDate));

  const payoutRows = stripePayoutResult.rows
    .filter((row) => rowHasStripeReference(row) || rowLooksLikePayout(row))
    .filter((row) => isWithinRange(row, startDate, endDate));

  const refundRows = stripeRefundResult.rows.filter((row) =>
    isWithinRange(row, startDate, endDate),
  );

  const disputeRows = stripeDisputeResult.rows.filter((row) =>
    isWithinRange(row, startDate, endDate),
  );

  const plaidRows = plaidResult.rows.filter((row) =>
    isWithinRange(row, startDate, endDate),
  );

  const transactions = uniqueByReference([
    ...stripeRows.map(normalizeStripeTransaction),
    ...refundRows.map(normalizeRefund),
    ...disputeRows.map(normalizeDispute),
  ])
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 100);

  const payouts = payoutRows
    .map(normalizePayout)
    .sort(
      (a, b) =>
        new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime(),
    )
    .slice(0, 100);

  const plaidStripeDeposits = plaidRows.filter(isStripeBankDeposit);

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
  });

  const isLive = sourceHealth.some((source) => source.ok && source.rowCount > 0);

  return NextResponse.json({
    ok: true,
    isLive,
    generatedAt,
    message: isLive
      ? "Live Stripe and Plaid/NFCU financial data connected."
      : "Stripe and Plaid/NFCU sources are connected only when matching tables contain rows.",
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
      pendingBalance: 0,
      availableBalance: Math.max(netPayments - transfers, 0),
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
