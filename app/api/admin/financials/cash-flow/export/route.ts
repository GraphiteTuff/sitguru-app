import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type AdminIdentity = {
  id: string;
  email: string;
  role: string;
  canAccessFinancials: boolean;
};

type CashFlowExportRow = {
  section: string;
  lineItem: string;
  accountingAccount: string;
  quickBooksAccount: string;
  source: string;
  sourceId: string;
  sourceCount: number;
  amount: number;
  debit: number;
  credit: number;
  formattedAmount: string;
  statementImpact: string;
  taxTreatment: string;
  reconciliationStatus: string;
  notes: string;
};

type CashFlowPackage = {
  rows: CashFlowExportRow[];
  totals: {
    operatingInflows: number;
    operatingOutflows: number;
    netOperatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    netCashChange: number;
    beginningCash: number;
    endingCash: number;
  };
  metadata: {
    reportName: string;
    generatedAt: string;
    startDate: string | null;
    endDate: string | null;
    rowCount: number;
  };
};

const FINANCE_ROLES = [
  "owner",
  "super_admin",
  "admin",
  "finance_admin",
  "finance",
  "accounting",
  "bookkeeper",
];

const CASH_IN_ACCOUNTS = [
  "Stripe Clearing",
  "Customer Payments",
  "Service Revenue",
  "Booking Revenue",
  "Navy Federal Business Checking",
];

const CASH_OUT_ACCOUNTS = [
  "Guru Payouts Payable",
  "Merchant Processing Fees",
  "Refunds and Allowances",
  "Chargeback Expense",
  "Operating Expenses",
];

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[$,()]/g, "").trim();
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) {
      return value.includes("(") && value.includes(")") ? -parsed : parsed;
    }
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toCentsAwareAmount(value: unknown) {
  const raw = toNumber(value);

  if (Math.abs(raw) >= 10000 && Number.isInteger(raw)) {
    return raw / 100;
  }

  return raw;
}

function money(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(value || 0));

  return value < 0 ? `(${formatted})` : formatted;
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function htmlEscape(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getOptionalBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "1"].includes(normalized)) return true;
    if (["false", "no", "0"].includes(normalized)) return false;
  }

  return false;
}

function getEnvAdminEmails() {
  return String(
    process.env.SITGURU_FINANCE_ADMIN_EMAILS ||
      process.env.ADMIN_EMAILS ||
      process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
      "",
  )
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function hasFinancialRole(role: string) {
  return FINANCE_ROLES.includes(role.trim().toLowerCase());
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Cash flow export query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Cash flow export query skipped for ${label}:`, error);
    return [];
  }
}

async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const userEmail = (user.email || "").toLowerCase();
  const envAdminEmails = getEnvAdminEmails();

  const profileChecks = await Promise.all([
    safeRows<AnyRow>(
      supabaseAdmin
        .from("admin_users")
        .select("role,email,is_active,can_access_financials")
        .eq("user_id", user.id)
        .limit(1),
      "admin_users_finance_access",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("profiles")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "profiles_finance_access",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("users")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "users_finance_access",
    ),
  ]);

  const profile = profileChecks.flat().find(Boolean) || {};
  const role = asTrimmedString(profile.role) || "admin";
  const active =
    profile.is_active === undefined
      ? true
      : getOptionalBoolean(profile.is_active);
  const explicitFinanceAccess = getOptionalBoolean(
    profile.can_access_financials,
  );
  const envAllowed = envAdminEmails.includes(userEmail);

  return {
    id: user.id,
    email: userEmail,
    role,
    canAccessFinancials:
      active && (hasFinancialRole(role) || explicitFinanceAccess || envAllowed),
  };
}

async function requireFinancialAdmin() {
  const identity = await getAdminIdentity();

  if (!identity?.canAccessFinancials) {
    return null;
  }

  return identity;
}

async function writeFinancialAuditLog({
  actor,
  action,
  metadata,
}: {
  actor: AdminIdentity;
  action: string;
  metadata?: Record<string, unknown>;
}) {
  const payload = {
    actor_id: actor.id,
    actor_email: actor.email,
    actor_role: actor.role,
    action,
    area: "financials.cash_flow.export",
    target_type: "cash_flow_statement",
    target_id: null,
    metadata: metadata || {},
    created_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabaseAdmin
      .from("financial_audit_logs")
      .insert(payload);

    if (!error) return;
  } catch {
    // Keep export from failing if audit table has not been created yet.
  }

  try {
    await supabaseAdmin.from("admin_audit_logs").insert(payload);
  } catch (error) {
    console.warn("Cash flow export audit log skipped:", error);
  }
}

function isArchivedRow(row: AnyRow) {
  return Boolean(
    row.deleted_at ||
      row.voided_at ||
      row.archived_at ||
      row.is_deleted === true ||
      row.is_void === true ||
      row.is_active === false,
  );
}

function getRowDate(row: AnyRow) {
  return (
    asTrimmedString(row.created_at) ||
    asTrimmedString(row.transaction_date) ||
    asTrimmedString(row.posted_at) ||
    asTrimmedString(row.available_on) ||
    asTrimmedString(row.date) ||
    asTrimmedString(row.paid_at) ||
    asTrimmedString(row.payout_date) ||
    asTrimmedString(row.booking_date)
  );
}

function isWithinDateRange(row: AnyRow, startDate: string | null, endDate: string | null) {
  const rowDate = getRowDate(row);
  if (!rowDate || (!startDate && !endDate)) return true;

  const parsed = new Date(rowDate);
  if (Number.isNaN(parsed.getTime())) return true;

  if (startDate) {
    const start = new Date(`${startDate}T00:00:00.000Z`);
    if (parsed < start) return false;
  }

  if (endDate) {
    const end = new Date(`${endDate}T23:59:59.999Z`);
    if (parsed > end) return false;
  }

  return true;
}

function getText(row: AnyRow) {
  return [
    row.source,
    row.source_type,
    row.type,
    row.category,
    row.name,
    row.description,
    row.memo,
    row.account_name,
    row.account,
    row.external_account_name,
    row.reporting_category,
    row.transaction_type,
  ]
    .map(asTrimmedString)
    .join(" ")
    .toLowerCase();
}

function getRowId(row: AnyRow) {
  return (
    asTrimmedString(row.id) ||
    asTrimmedString(row.source_id) ||
    asTrimmedString(row.transaction_id) ||
    asTrimmedString(row.stripe_id) ||
    asTrimmedString(row.balance_transaction_id) ||
    asTrimmedString(row.bank_transaction_id)
  );
}

function getBookingGrossAmount(booking: AnyRow) {
  const subtotal = toNumber(booking.subtotal_amount);
  if (subtotal > 0) return subtotal;

  return (
    toNumber(booking.total_amount) ||
    toNumber(booking.amount) ||
    toNumber(booking.price) ||
    toNumber(booking.hourly_rate)
  );
}

function getPlatformFee(booking: AnyRow) {
  const storedFee = toNumber(booking.sitguru_fee_amount);
  if (storedFee > 0) return storedFee;

  return getBookingGrossAmount(booking) * 0.08;
}

function getGuruPayoutAmount(booking: AnyRow) {
  const storedNet = toNumber(booking.guru_net_amount);
  if (storedNet > 0) return storedNet;

  return Math.max(0, getBookingGrossAmount(booking) - getPlatformFee(booking));
}

function isPaidBooking(booking: AnyRow) {
  const paymentStatus = asTrimmedString(booking.payment_status).toLowerCase();
  const status = asTrimmedString(booking.status).toLowerCase();

  return (
    paymentStatus === "paid" ||
    paymentStatus === "succeeded" ||
    status.includes("paid") ||
    status.includes("complete")
  );
}

function getRefundAmount(row: AnyRow) {
  const explicitRefund = toNumber(row.refund_amount);
  if (explicitRefund > 0) return explicitRefund;

  const text = getText(row);
  if (text.includes("refund")) {
    return (
      Math.abs(toNumber(row.amount)) ||
      Math.abs(toNumber(row.total_amount)) ||
      Math.abs(toNumber(row.financial_impact))
    );
  }

  return 0;
}

function getExpenseAmount(expense: AnyRow) {
  return Math.abs(
    toNumber(expense.amount) ||
      toNumber(expense.total_amount) ||
      toNumber(expense.expense_amount) ||
      toNumber(expense.cost),
  );
}

function getPayoutAmount(payout: AnyRow) {
  return Math.abs(
    toNumber(payout.amount) ||
      toNumber(payout.payout_amount) ||
      toNumber(payout.guru_net_amount) ||
      toNumber(payout.net_amount),
  );
}

function isPayoutPaid(payout: AnyRow) {
  const status = (
    asTrimmedString(payout.status) || asTrimmedString(payout.payout_status)
  ).toLowerCase();

  return (
    status.includes("paid") ||
    status.includes("released") ||
    status.includes("complete")
  );
}

function getStripeAmount(row: AnyRow) {
  return (
    toCentsAwareAmount(row.amount) ||
    toCentsAwareAmount(row.gross_amount) ||
    toCentsAwareAmount(row.net_amount)
  );
}

function getStripeFee(row: AnyRow) {
  return Math.abs(
    toCentsAwareAmount(row.fee) ||
      toCentsAwareAmount(row.fee_amount) ||
      toCentsAwareAmount(row.stripe_fee),
  );
}

function getBankAmount(row: AnyRow) {
  return (
    toNumber(row.amount) ||
    toNumber(row.transaction_amount) ||
    toNumber(row.value)
  );
}

function isLikelyTransfer(row: AnyRow) {
  const text = getText(row);

  return (
    text.includes("transfer") ||
    text.includes("owner draw") ||
    text.includes("owner distribution") ||
    text.includes("owner contribution") ||
    text.includes("savings") ||
    text.includes("checking") ||
    text.includes("internal")
  );
}

function isLikelyStripePayoutDeposit(row: AnyRow) {
  const text = getText(row);
  return (
    text.includes("stripe") &&
    (text.includes("payout") || text.includes("deposit") || text.includes("settlement"))
  );
}

function getReconciliationStatus(rows: AnyRow[]) {
  const matched = rows.some((row) =>
    Boolean(
      row.reconciled_at ||
        row.matched_transaction_id ||
        row.reconciliation_id ||
        row.match_id ||
        row.stripe_payout_id,
    ),
  );

  return matched ? "Reconciled / Matched" : "Needs Review";
}

function addRow(
  rows: CashFlowExportRow[],
  input: Omit<CashFlowExportRow, "formattedAmount" | "debit" | "credit">,
) {
  const debit = input.amount > 0 ? input.amount : 0;
  const credit = input.amount < 0 ? Math.abs(input.amount) : 0;

  rows.push({
    ...input,
    debit,
    credit,
    formattedAmount: money(input.amount),
  });
}

function getManualCashFlowRows(rows: AnyRow[]) {
  const normalized: CashFlowExportRow[] = [];

  for (const row of rows) {
    if (isArchivedRow(row)) continue;

    const section =
      asTrimmedString(row.section) ||
      asTrimmedString(row.cash_flow_section) ||
      "Manual Adjustments";
    const lineItem =
      asTrimmedString(row.label) ||
      asTrimmedString(row.line_item) ||
      asTrimmedString(row.name) ||
      "Manual cash flow line";
    const amount =
      toNumber(row.amount) ||
      toNumber(row.cash_amount) ||
      toNumber(row.value) ||
      toNumber(row.total);

    addRow(normalized, {
      section,
      lineItem,
      accountingAccount:
        asTrimmedString(row.accounting_account) || "Manual Cash Flow",
      quickBooksAccount:
        asTrimmedString(row.quickbooks_account) || "Ask My Accountant",
      source: "cash_flow_lines",
      sourceId: getRowId(row),
      sourceCount: 1,
      amount,
      statementImpact:
        asTrimmedString(row.statement_impact) || "Cash flow adjustment",
      taxTreatment: asTrimmedString(row.tax_treatment) || "CPA review",
      reconciliationStatus: getReconciliationStatus([row]),
      notes:
        asTrimmedString(row.notes) ||
        asTrimmedString(row.description) ||
        "Manual cash flow line created by admin.",
    });
  }

  return normalized;
}

async function getCashFlowPackage({
  startDate,
  endDate,
}: {
  startDate: string | null;
  endDate: string | null;
}): Promise<CashFlowPackage> {
  const [
    rawBookings,
    rawExpenses,
    rawPayouts,
    rawDisputes,
    rawFinancialLedger,
    rawBankTransactions,
    rawStripeBalanceTransactions,
    rawManualLines,
  ] = await Promise.all([
    safeRows<AnyRow>(
      supabaseAdmin
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "bookings",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("expense_ledger")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "expense_ledger",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("guru_payouts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "guru_payouts",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("dispute_cases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "dispute_cases",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("financial_ledger_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "financial_ledger_entries",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("bank_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "bank_transactions",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("stripe_balance_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "stripe_balance_transactions",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("cash_flow_lines")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(1000),
      "cash_flow_lines",
    ),
  ]);

  const bookings = rawBookings
    .filter((row) => !isArchivedRow(row))
    .filter((row) => isWithinDateRange(row, startDate, endDate));
  const expenses = rawExpenses
    .filter((row) => !isArchivedRow(row))
    .filter((row) => isWithinDateRange(row, startDate, endDate));
  const payouts = rawPayouts
    .filter((row) => !isArchivedRow(row))
    .filter((row) => isWithinDateRange(row, startDate, endDate));
  const disputes = rawDisputes
    .filter((row) => !isArchivedRow(row))
    .filter((row) => isWithinDateRange(row, startDate, endDate));
  const financialLedger = rawFinancialLedger
    .filter((row) => !isArchivedRow(row))
    .filter((row) => isWithinDateRange(row, startDate, endDate));
  const bankTransactions = rawBankTransactions
    .filter((row) => !isArchivedRow(row))
    .filter((row) => isWithinDateRange(row, startDate, endDate));
  const stripeBalanceTransactions = rawStripeBalanceTransactions
    .filter((row) => !isArchivedRow(row))
    .filter((row) => isWithinDateRange(row, startDate, endDate));
  const manualLines = rawManualLines
    .filter((row) => !isArchivedRow(row))
    .filter((row) => isWithinDateRange(row, startDate, endDate));

  const rows: CashFlowExportRow[] = [];

  const paidBookings = bookings.filter(isPaidBooking);
  const bookingCashReceipts = paidBookings.reduce(
    (sum, booking) => sum + getBookingGrossAmount(booking),
    0,
  );

  addRow(rows, {
    section: "Operating Activities - Cash Inflows",
    lineItem: "Customer Booking Cash Receipts",
    accountingAccount: "Customer Payments / Stripe Clearing",
    quickBooksAccount: "Undeposited Funds",
    source: "bookings",
    sourceId: "bookings:paid",
    sourceCount: paidBookings.length,
    amount: bookingCashReceipts,
    statementImpact: "Cash inflow from customer bookings",
    taxTreatment:
      "Gross customer receipts; sales tax and trust balances should be reviewed separately.",
    reconciliationStatus: getReconciliationStatus(paidBookings),
    notes:
      "Gross paid booking cash receipts. Stripe payout deposits should be matched, not counted again as new revenue.",
  });

  const stripeCharges = stripeBalanceTransactions.filter((row) => {
    const text = getText(row);
    return (
      getStripeAmount(row) > 0 &&
      (text.includes("charge") ||
        text.includes("payment") ||
        text.includes("checkout") ||
        text.includes("booking"))
    );
  });
  const stripeChargeAmount = stripeCharges.reduce(
    (sum, row) => sum + Math.max(0, getStripeAmount(row)),
    0,
  );

  if (stripeCharges.length) {
    addRow(rows, {
      section: "Operating Activities - Cash Inflows",
      lineItem: "Stripe Customer Payment Activity",
      accountingAccount: "Stripe Clearing",
      quickBooksAccount: "Undeposited Funds",
      source: "stripe_balance_transactions",
      sourceId: "stripe:charges",
      sourceCount: stripeCharges.length,
      amount: stripeChargeAmount,
      statementImpact: "Cash inflow support schedule",
      taxTreatment:
        "Support schedule for receipts; reconcile against bookings to avoid duplication.",
      reconciliationStatus: getReconciliationStatus(stripeCharges),
      notes:
        "Included as a support row for Stripe activity. If bookings already drive receipts, use this for reconciliation instead of duplicate revenue recognition.",
    });
  }

  const stripePayoutDeposits = bankTransactions.filter(isLikelyStripePayoutDeposit);
  const stripePayoutDepositAmount = stripePayoutDeposits.reduce(
    (sum, row) => sum + Math.max(0, getBankAmount(row)),
    0,
  );

  if (stripePayoutDeposits.length) {
    addRow(rows, {
      section: "Operating Activities - Reconciliation Memo",
      lineItem: "Stripe Payouts Deposited to Navy Federal",
      accountingAccount: "Navy Federal Business Checking",
      quickBooksAccount: "Checking",
      source: "bank_transactions",
      sourceId: "bank:stripe_payout_deposits",
      sourceCount: stripePayoutDeposits.length,
      amount: stripePayoutDepositAmount,
      statementImpact: "Cash deposit reconciliation memo",
      taxTreatment:
        "Not new income; match to Stripe payouts so revenue is not double-counted.",
      reconciliationStatus: getReconciliationStatus(stripePayoutDeposits),
      notes:
        "This row confirms cash landed in Navy Federal checking/savings. It should reconcile to Stripe payout records.",
    });
  }

  const paidPayouts = payouts.filter(isPayoutPaid);
  const payoutCashOut = paidPayouts.reduce(
    (sum, payout) => sum + getPayoutAmount(payout),
    0,
  );

  addRow(rows, {
    section: "Operating Activities - Cash Outflows",
    lineItem: "Guru Payouts Paid",
    accountingAccount: "Guru Payouts Payable",
    quickBooksAccount: "Contract Labor / Cost of Services",
    source: "guru_payouts",
    sourceId: "guru_payouts:paid",
    sourceCount: paidPayouts.length,
    amount: -payoutCashOut,
    statementImpact: "Cash outflow for contractor/guru payments",
    taxTreatment:
      "Potential 1099/contractor support; CPA should review classification.",
    reconciliationStatus: getReconciliationStatus(paidPayouts),
    notes: "Cash paid or released to gurus for completed services.",
  });

  const operatingExpenseCashOut = expenses.reduce(
    (sum, expense) => sum + getExpenseAmount(expense),
    0,
  );

  addRow(rows, {
    section: "Operating Activities - Cash Outflows",
    lineItem: "Operating Expenses Paid",
    accountingAccount: "Operating Expenses",
    quickBooksAccount: "Operating Expenses",
    source: "expense_ledger",
    sourceId: "expense_ledger:active",
    sourceCount: expenses.length,
    amount: -operatingExpenseCashOut,
    statementImpact: "Cash outflow for admin/vendor operating expenses",
    taxTreatment:
      "Deductibility depends on category, substantiation, and CPA review.",
    reconciliationStatus: getReconciliationStatus(expenses),
    notes:
      "Manual and imported expenses from SitGuru expense ledger. Match to bank/card transactions during close.",
  });

  const stripeFeeRows = stripeBalanceTransactions.filter((row) => getStripeFee(row) > 0);
  const stripeFees = stripeFeeRows.reduce(
    (sum, row) => sum + getStripeFee(row),
    0,
  );

  addRow(rows, {
    section: "Operating Activities - Cash Outflows",
    lineItem: "Stripe Processing Fees",
    accountingAccount: "Merchant Processing Fees",
    quickBooksAccount: "Merchant Account Fees",
    source: "stripe_balance_transactions",
    sourceId: "stripe:fees",
    sourceCount: stripeFeeRows.length,
    amount: -stripeFees,
    statementImpact: "Cash outflow / net settlement reduction",
    taxTreatment: "Generally deductible merchant processing expense; CPA review.",
    reconciliationStatus: getReconciliationStatus(stripeFeeRows),
    notes:
      "Stripe fees reduce net cash settlement. Export separately so CPA can map to merchant processing fees.",
  });

  const bookingRefunds = bookings.reduce(
    (sum, booking) => sum + getRefundAmount(booking),
    0,
  );
  const stripeRefunds = stripeBalanceTransactions
    .filter((row) => getText(row).includes("refund"))
    .reduce((sum, row) => sum + Math.abs(getStripeAmount(row)), 0);
  const refundCashOut = Math.max(bookingRefunds, stripeRefunds);

  addRow(rows, {
    section: "Operating Activities - Cash Outflows",
    lineItem: "Refunds / Customer Credits",
    accountingAccount: "Refunds and Allowances",
    quickBooksAccount: "Refunds and Allowances",
    source: "bookings + stripe_balance_transactions",
    sourceId: "refunds:combined",
    sourceCount:
      bookings.filter((booking) => getRefundAmount(booking) > 0).length +
      stripeBalanceTransactions.filter((row) => getText(row).includes("refund")).length,
    amount: -refundCashOut,
    statementImpact: "Cash outflow or revenue reversal support",
    taxTreatment:
      "Contra-revenue or customer credit treatment should be reviewed by CPA.",
    reconciliationStatus: getReconciliationStatus([
      ...bookings.filter((booking) => getRefundAmount(booking) > 0),
      ...stripeBalanceTransactions.filter((row) => getText(row).includes("refund")),
    ]),
    notes:
      "Uses the higher of booking refund records or Stripe refund rows to avoid understating refunds when one source is incomplete.",
  });

  const disputeCashOut = disputes.reduce(
    (sum, dispute) =>
      sum +
      Math.abs(
        toNumber(dispute.amount) ||
          toNumber(dispute.dispute_amount) ||
          toNumber(dispute.financial_impact) ||
          toNumber(dispute.total_amount),
      ),
    0,
  );

  addRow(rows, {
    section: "Operating Activities - Cash Outflows",
    lineItem: "Disputes / Chargebacks",
    accountingAccount: "Chargeback Expense",
    quickBooksAccount: "Chargebacks",
    source: "dispute_cases",
    sourceId: "disputes:active",
    sourceCount: disputes.length,
    amount: -disputeCashOut,
    statementImpact: "Cash outflow or loss from disputes",
    taxTreatment:
      "CPA should review whether each item is contra-revenue, fee, or operating loss.",
    reconciliationStatus: getReconciliationStatus(disputes),
    notes:
      "Includes dispute financial impact from available dispute case records.",
  });

  const bankTransfers = bankTransactions.filter(isLikelyTransfer);
  const netTransfers = bankTransfers.reduce((sum, row) => sum + getBankAmount(row), 0);

  addRow(rows, {
    section: "Financing Activities",
    lineItem: "Owner / Internal Checking-Savings Transfers",
    accountingAccount: "Owner Equity / Internal Transfers",
    quickBooksAccount: "Owner Investment / Owner Draws",
    source: "bank_transactions",
    sourceId: "bank:transfers",
    sourceCount: bankTransfers.length,
    amount: netTransfers,
    statementImpact:
      "Cash movement from owner activity or internal account transfers",
    taxTreatment:
      "Generally not operating income or expense; CPA should classify equity/transfer items.",
    reconciliationStatus: getReconciliationStatus(bankTransfers),
    notes:
      "Includes likely checking/savings transfers, owner draws, owner contributions, and internal cash movement.",
  });

  const investingRows = financialLedger.filter((row) => {
    const text = getText(row);
    return (
      text.includes("asset purchase") ||
      text.includes("equipment") ||
      text.includes("capital expenditure") ||
      text.includes("capex") ||
      text.includes("investment")
    );
  });
  const investingCashFlow = investingRows.reduce(
    (sum, row) => sum + toNumber(row.credit) - toNumber(row.debit),
    0,
  );

  addRow(rows, {
    section: "Investing Activities",
    lineItem: "Asset Purchases / Investing Activity",
    accountingAccount: "Fixed Assets / Investments",
    quickBooksAccount: "Fixed Assets",
    source: "financial_ledger_entries",
    sourceId: "ledger:investing",
    sourceCount: investingRows.length,
    amount: investingCashFlow,
    statementImpact: "Cash flow from investing activities",
    taxTreatment:
      "Capitalization/depreciation may apply; CPA should review assets.",
    reconciliationStatus: getReconciliationStatus(investingRows),
    notes:
      "Derived from ledger entries that appear related to assets, investments, or capital expenditures.",
  });

  for (const manualRow of getManualCashFlowRows(manualLines)) {
    rows.push(manualRow);
  }

  const operatingInflows = rows
    .filter((row) => row.section.includes("Operating") && row.amount > 0)
    .reduce((sum, row) => sum + row.amount, 0);
  const operatingOutflows = rows
    .filter((row) => row.section.includes("Operating") && row.amount < 0)
    .reduce((sum, row) => sum + Math.abs(row.amount), 0);
  const netOperatingCashFlow = operatingInflows - operatingOutflows;

  const finalInvestingCashFlow = rows
    .filter((row) => row.section.includes("Investing"))
    .reduce((sum, row) => sum + row.amount, 0);
  const financingCashFlow = rows
    .filter((row) => row.section.includes("Financing"))
    .reduce((sum, row) => sum + row.amount, 0);

  const netCashChange =
    netOperatingCashFlow + finalInvestingCashFlow + financingCashFlow;

  const beginningCash = 0;
  const endingCash = beginningCash + netCashChange;

  addRow(rows, {
    section: "Cash Flow Summary",
    lineItem: "Net Cash Provided by Operating Activities",
    accountingAccount: "Cash Flow Summary",
    quickBooksAccount: "Statement of Cash Flows",
    source: "calculated",
    sourceId: "summary:operating",
    sourceCount: rows.length,
    amount: netOperatingCashFlow,
    statementImpact: "Net operating cash flow",
    taxTreatment: "Statement summary; no direct tax category.",
    reconciliationStatus: "Calculated",
    notes:
      "Operating inflows less operating outflows. Reconciliation memo rows may be reviewed separately during close.",
  });

  addRow(rows, {
    section: "Cash Flow Summary",
    lineItem: "Net Change in Cash",
    accountingAccount: "Cash",
    quickBooksAccount: "Cash and Cash Equivalents",
    source: "calculated",
    sourceId: "summary:net_cash_change",
    sourceCount: rows.length,
    amount: netCashChange,
    statementImpact: "Net period cash movement",
    taxTreatment: "Statement summary; no direct tax category.",
    reconciliationStatus: "Calculated",
    notes:
      "Net operating, investing, and financing cash flow from available records.",
  });

  return {
    rows,
    totals: {
      operatingInflows,
      operatingOutflows,
      netOperatingCashFlow,
      investingCashFlow: finalInvestingCashFlow,
      financingCashFlow,
      netCashChange,
      beginningCash,
      endingCash,
    },
    metadata: {
      reportName: "SitGuru Cash Flow Statement",
      generatedAt: new Date().toISOString(),
      startDate,
      endDate,
      rowCount: rows.length,
    },
  };
}

function getExportHeaders() {
  return [
    "Section",
    "Line Item",
    "Accounting Account",
    "QuickBooks Account",
    "Source",
    "Source ID",
    "Source Count",
    "Amount",
    "Debit",
    "Credit",
    "Formatted Amount",
    "Statement Impact",
    "Tax Treatment",
    "Reconciliation Status",
    "Notes",
  ];
}

function rowToArray(row: CashFlowExportRow) {
  return [
    row.section,
    row.lineItem,
    row.accountingAccount,
    row.quickBooksAccount,
    row.source,
    row.sourceId,
    row.sourceCount,
    row.amount.toFixed(2),
    row.debit.toFixed(2),
    row.credit.toFixed(2),
    row.formattedAmount,
    row.statementImpact,
    row.taxTreatment,
    row.reconciliationStatus,
    row.notes,
  ];
}

function buildCsv(pkg: CashFlowPackage) {
  const rows = [
    ["Report", pkg.metadata.reportName],
    ["Generated At", pkg.metadata.generatedAt],
    ["Start Date", pkg.metadata.startDate || "All"],
    ["End Date", pkg.metadata.endDate || "All"],
    [],
    getExportHeaders(),
    ...pkg.rows.map(rowToArray),
    [],
    ["Summary"],
    ["Operating Inflows", pkg.totals.operatingInflows.toFixed(2)],
    ["Operating Outflows", pkg.totals.operatingOutflows.toFixed(2)],
    ["Net Operating Cash Flow", pkg.totals.netOperatingCashFlow.toFixed(2)],
    ["Investing Cash Flow", pkg.totals.investingCashFlow.toFixed(2)],
    ["Financing Cash Flow", pkg.totals.financingCashFlow.toFixed(2)],
    ["Net Change in Cash", pkg.totals.netCashChange.toFixed(2)],
  ];

  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

function buildHtml(pkg: CashFlowPackage, mode: "html" | "excel" | "word" = "html") {
  const title = htmlEscape(pkg.metadata.reportName);
  const generatedAt = htmlEscape(pkg.metadata.generatedAt);
  const period = htmlEscape(
    `${pkg.metadata.startDate || "All"} through ${pkg.metadata.endDate || "All"}`,
  );

  const tableRows = pkg.rows
    .map(
      (row) => `
        <tr>
          <td>${htmlEscape(row.section)}</td>
          <td><strong>${htmlEscape(row.lineItem)}</strong></td>
          <td>${htmlEscape(row.accountingAccount)}</td>
          <td>${htmlEscape(row.quickBooksAccount)}</td>
          <td>${htmlEscape(row.source)}</td>
          <td>${htmlEscape(row.sourceCount)}</td>
          <td class="amount">${htmlEscape(row.formattedAmount)}</td>
          <td>${htmlEscape(row.reconciliationStatus)}</td>
          <td>${htmlEscape(row.notes)}</td>
        </tr>
      `,
    )
    .join("");

  const printScript = mode === "html" ? "<script>window.print?.();</script>" : "";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      background: #f7fbf8;
      color: #0f172a;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .page {
      max-width: 1240px;
      margin: 0 auto;
      padding: 32px;
    }
    .hero {
      border: 1px solid #d1fae5;
      background: #ffffff;
      border-radius: 28px;
      padding: 28px;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    }
    .eyebrow {
      color: #047857;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }
    h1 {
      margin: 10px 0 6px;
      font-size: 36px;
      line-height: 1;
    }
    .meta {
      color: #64748b;
      font-size: 14px;
      font-weight: 600;
      line-height: 1.6;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-top: 18px;
    }
    .card {
      border: 1px solid #d1fae5;
      background: #ecfdf5;
      border-radius: 18px;
      padding: 16px;
    }
    .card p {
      margin: 0;
    }
    .card .label {
      color: #047857;
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }
    .card .value {
      margin-top: 8px;
      font-size: 22px;
      font-weight: 900;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
      overflow: hidden;
      border-radius: 18px;
      background: #ffffff;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      text-align: left;
      padding: 12px;
    }
    td {
      border-top: 1px solid #e2e8f0;
      color: #334155;
      font-size: 12px;
      line-height: 1.45;
      padding: 12px;
      vertical-align: top;
    }
    .amount {
      text-align: right;
      font-weight: 900;
      color: #0f172a;
      white-space: nowrap;
    }
    @media print {
      body {
        background: white;
      }
      .page {
        max-width: none;
        padding: 0;
      }
      .hero {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <section class="hero">
      <p class="eyebrow">SitGuru Financial Export</p>
      <h1>${title}</h1>
      <p class="meta">Period: ${period}<br />Generated: ${generatedAt}</p>
      <div class="summary">
        <div class="card">
          <p class="label">Operating Inflows</p>
          <p class="value">${htmlEscape(money(pkg.totals.operatingInflows))}</p>
        </div>
        <div class="card">
          <p class="label">Operating Outflows</p>
          <p class="value">${htmlEscape(money(-pkg.totals.operatingOutflows))}</p>
        </div>
        <div class="card">
          <p class="label">Net Operating Cash</p>
          <p class="value">${htmlEscape(money(pkg.totals.netOperatingCashFlow))}</p>
        </div>
        <div class="card">
          <p class="label">Net Change in Cash</p>
          <p class="value">${htmlEscape(money(pkg.totals.netCashChange))}</p>
        </div>
      </div>
    </section>

    <table>
      <thead>
        <tr>
          <th>Section</th>
          <th>Line Item</th>
          <th>Accounting Account</th>
          <th>QuickBooks Account</th>
          <th>Source</th>
          <th>Count</th>
          <th>Amount</th>
          <th>Reconciliation</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>
  ${printScript}
</body>
</html>`;
}

function getContentType(format: string) {
  if (format === "csv") return "text/csv; charset=utf-8";
  if (format === "excel") return "application/vnd.ms-excel; charset=utf-8";
  if (format === "word") return "application/msword; charset=utf-8";
  return "text/html; charset=utf-8";
}

function getFileExtension(format: string) {
  if (format === "csv") return "csv";
  if (format === "excel") return "xls";
  if (format === "word") return "doc";
  return "html";
}

function normalizeFormat(format: string | null) {
  const normalized = (format || "csv").trim().toLowerCase();

  if (["csv", "excel", "xls", "xlsx"].includes(normalized)) {
    return normalized === "csv" ? "csv" : "excel";
  }

  if (["word", "doc", "docx"].includes(normalized)) return "word";
  if (["pdf", "print", "html"].includes(normalized)) return "html";

  return "csv";
}

function buildExportBody(pkg: CashFlowPackage, format: string) {
  if (format === "csv") return buildCsv(pkg);
  if (format === "excel") return buildHtml(pkg, "excel");
  if (format === "word") return buildHtml(pkg, "word");
  return buildHtml(pkg, "html");
}

function getFilename(format: string, startDate: string | null, endDate: string | null) {
  const period = [startDate, endDate].filter(Boolean).join("_to_") || "all";
  return `sitguru-cash-flow-${period}.${getFileExtension(format)}`;
}

async function sendWithResend({
  to,
  subject,
  message,
  attachmentBody,
  filename,
  contentType,
}: {
  to: string;
  subject: string;
  message: string;
  attachmentBody: string;
  filename: string;
  contentType: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.FINANCIAL_EXPORT_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    "SitGuru Finance <finance@sitguru.com>";

  if (!apiKey) {
    return {
      ok: false,
      configured: false,
      message:
        "RESEND_API_KEY is not configured. Download URL is available instead.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html: `<p>${htmlEscape(message).replace(/\n/g, "<br />")}</p>`,
      attachments: [
        {
          filename,
          content: Buffer.from(attachmentBody).toString("base64"),
          content_type: contentType.split(";")[0],
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return {
      ok: false,
      configured: true,
      message: text || "Unable to send email.",
    };
  }

  return {
    ok: true,
    configured: true,
    message: "Cash Flow export email sent.",
  };
}

export async function GET(request: Request) {
  const actor = await requireFinancialAdmin();

  if (!actor) {
    return NextResponse.json(
      { ok: false, message: "Not authorized to export cash flow statements." },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const format = normalizeFormat(url.searchParams.get("format"));
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  const pkg = await getCashFlowPackage({ startDate, endDate });
  const body = buildExportBody(pkg, format);
  const filename = getFilename(format, startDate, endDate);
  const contentType = getContentType(format);

  await writeFinancialAuditLog({
    actor,
    action: "export_cash_flow_statement",
    metadata: {
      format,
      startDate,
      endDate,
      filename,
      rowCount: pkg.rows.length,
      delivery: "download",
    },
  });

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const actor = await requireFinancialAdmin();

  if (!actor) {
    return NextResponse.json(
      { ok: false, message: "Not authorized to email cash flow statements." },
      { status: 403 },
    );
  }

  let body: AnyRow = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const to = asTrimmedString(body.to);
  const format = normalizeFormat(asTrimmedString(body.format) || "excel");
  const startDate = asTrimmedString(body.startDate) || null;
  const endDate = asTrimmedString(body.endDate) || null;
  const subject =
    asTrimmedString(body.subject) || "SitGuru Cash Flow Statement";
  const message =
    asTrimmedString(body.message) ||
    "Attached is the SitGuru Cash Flow Statement for review.";

  if (!to || !to.includes("@")) {
    return NextResponse.json(
      { ok: false, message: "A valid recipient email is required." },
      { status: 400 },
    );
  }

  const pkg = await getCashFlowPackage({ startDate, endDate });
  const attachmentBody = buildExportBody(pkg, format);
  const filename = getFilename(format, startDate, endDate);
  const contentType = getContentType(format);

  const emailResult = await sendWithResend({
    to,
    subject,
    message,
    attachmentBody,
    filename,
    contentType,
  });

  await writeFinancialAuditLog({
    actor,
    action: "email_cash_flow_statement",
    metadata: {
      format,
      startDate,
      endDate,
      filename,
      rowCount: pkg.rows.length,
      delivery: "email",
      recipient: to,
      emailConfigured: emailResult.configured,
      emailOk: emailResult.ok,
    },
  });

  if (!emailResult.ok) {
    const searchParams = new URLSearchParams({
      format,
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    });

    return NextResponse.json(
      {
        ok: false,
        message: emailResult.message,
        downloadUrl: `/api/admin/financials/cash-flow/export?${searchParams.toString()}`,
      },
      { status: emailResult.configured ? 502 : 200 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: emailResult.message,
    filename,
    rowCount: pkg.rows.length,
  });
}
