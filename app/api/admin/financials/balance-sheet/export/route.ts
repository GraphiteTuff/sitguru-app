import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
type SafeQueryResponse = { data: unknown; error: unknown };
type BalanceSection = "assets" | "liabilities" | "equity";
type ExportFormat = "csv" | "excel" | "word" | "html" | "print" | "pdf";

type AdminIdentity = {
  id: string;
  email: string;
  role: string;
  canAccessFinancials: boolean;
};

type BalanceSheetLine = {
  section: BalanceSection;
  lineItem: string;
  accountingAccount: string;
  quickBooksAccount: string;
  source: string;
  sourceId?: string | null;
  sourceCount: number;
  amount: number;
  statementImpact: "Balance Sheet";
  taxTreatment: string;
  reconciliationStatus: string;
  notes: string;
};

type BalanceSheetExportPayload = {
  generatedAt: string;
  periodLabel: string;
  startDate: string | null;
  endDate: string | null;
  totals: {
    assets: number;
    liabilities: number;
    equity: number;
    liabilitiesAndEquity: number;
    difference: number;
    isBalanced: boolean;
  };
  lines: BalanceSheetLine[];
  readiness: {
    label: string;
    status: "ready" | "needs_review" | "missing";
    detail: string;
  }[];
};

const FINANCE_ROLES = new Set([
  "owner",
  "super_admin",
  "admin",
  "finance_admin",
  "finance",
  "accounting",
  "bookkeeper",
]);

const BALANCE_SHEET_EXPORT_COLUMNS = [
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

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
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

function formatCurrency(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Math.abs(value || 0));

  return value < 0 ? `(${formatted})` : formatted;
}

function escapeCsv(value: unknown) {
  const stringValue = String(value ?? "");
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function getPeriodLabel(startDate: string | null, endDate: string | null) {
  if (startDate && endDate) return `${startDate} to ${endDate}`;
  if (startDate) return `From ${startDate}`;
  if (endDate) return `Through ${endDate}`;
  return "All available records";
}

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
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

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;
    if (result.error) {
      console.warn(`Balance sheet export query skipped for ${label}:`, result.error);
      return [];
    }
    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Balance sheet export query skipped for ${label}:`, error);
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
    safeRows<Row>(
      supabaseAdmin
        .from("admin_users")
        .select("role,email,is_active,can_access_financials")
        .eq("user_id", user.id)
        .limit(1),
      "admin_users_finance_access",
    ),
    safeRows<Row>(
      supabaseAdmin
        .from("profiles")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "profiles_finance_access",
    ),
    safeRows<Row>(
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
    profile.is_active === undefined ? true : getOptionalBoolean(profile.is_active);
  const explicitFinanceAccess = getOptionalBoolean(profile.can_access_financials);
  const envAllowed = envAdminEmails.includes(userEmail);
  const canAccessFinancials =
    active &&
    (FINANCE_ROLES.has(role.trim().toLowerCase()) ||
      explicitFinanceAccess ||
      envAllowed);

  return {
    id: user.id,
    email: userEmail,
    role,
    canAccessFinancials,
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
    area: "financials.balance_sheet.export",
    target_type: "balance_sheet_export",
    target_id: null,
    metadata: metadata || {},
    created_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabaseAdmin.from("financial_audit_logs").insert(payload);
    if (!error) return;
  } catch {
    // Audit tables may not exist during setup. Exports should still work.
  }

  try {
    await supabaseAdmin.from("admin_audit_logs").insert(payload);
  } catch (error) {
    console.warn("Balance sheet export audit log skipped:", error);
  }
}

function isArchivedRow(row: Row) {
  return Boolean(
    row.deleted_at ||
      row.voided_at ||
      row.archived_at ||
      row.is_deleted === true ||
      row.is_void === true ||
      row.is_active === false,
  );
}

function getRowText(row: Row) {
  return [
    row.name,
    row.description,
    row.memo,
    row.category,
    row.type,
    row.source,
    row.source_type,
    row.account,
    row.account_name,
    row.external_account_name,
    row.institution_name,
    row.transaction_type,
    row.status,
  ]
    .map(asTrimmedString)
    .join(" ")
    .toLowerCase();
}

function getRowDate(row: Row) {
  return (
    normalizeDate(asTrimmedString(row.created_at)) ||
    normalizeDate(asTrimmedString(row.date)) ||
    normalizeDate(asTrimmedString(row.transaction_date)) ||
    normalizeDate(asTrimmedString(row.posted_at)) ||
    normalizeDate(asTrimmedString(row.available_on))
  );
}

function withinRange(row: Row, startDate: string | null, endDate: string | null) {
  const rowDate = getRowDate(row);
  if (!rowDate) return true;
  if (startDate && rowDate < startDate) return false;
  if (endDate && rowDate > endDate) return false;
  return true;
}

function getBookingGrossAmount(booking: Row) {
  const subtotal = toNumber(booking.subtotal_amount);
  if (subtotal > 0) return subtotal;

  return (
    toNumber(booking.total_amount) ||
    toNumber(booking.amount) ||
    toNumber(booking.price) ||
    toNumber(booking.hourly_rate)
  );
}

function getPlatformFee(booking: Row) {
  const storedFee = toNumber(booking.sitguru_fee_amount);
  if (storedFee > 0) return storedFee;
  return getBookingGrossAmount(booking) * 0.08;
}

function getGuruPayoutAmount(booking: Row) {
  const storedNet = toNumber(booking.guru_net_amount);
  if (storedNet > 0) return storedNet;
  return Math.max(0, getBookingGrossAmount(booking) - getPlatformFee(booking));
}

function getRefundAmount(row: Row) {
  const explicitRefund = toNumber(row.refund_amount);
  if (explicitRefund > 0) return explicitRefund;

  const status = getRowText(row);
  if (status.includes("refund")) {
    return getBookingGrossAmount(row) || toNumber(row.amount) || toNumber(row.total_amount);
  }

  return 0;
}

function isPaidBooking(booking: Row) {
  const text = getRowText(booking);
  return (
    text.includes("paid") ||
    text.includes("succeeded") ||
    text.includes("complete") ||
    text.includes("settled")
  );
}

function isUnpaidBooking(booking: Row) {
  const text = getRowText(booking);
  return (
    text.includes("unpaid") ||
    text.includes("pending") ||
    text.includes("failed") ||
    text.includes("past_due") ||
    text.includes("open")
  );
}

function getPayoutAmount(row: Row) {
  return (
    toNumber(row.amount) ||
    toNumber(row.payout_amount) ||
    toNumber(row.guru_net_amount) ||
    toNumber(row.net_amount)
  );
}

function isPayoutPayable(row: Row) {
  const text = getRowText(row);
  return (
    text.includes("pending") ||
    text.includes("processing") ||
    text.includes("approved") ||
    text.includes("payable") ||
    text.includes("scheduled")
  );
}

function getExpenseAmount(row: Row) {
  return (
    toNumber(row.amount) ||
    toNumber(row.total_amount) ||
    toNumber(row.expense_amount) ||
    toNumber(row.cost)
  );
}

function isExpensePayable(row: Row) {
  const text = getRowText(row);
  return (
    text.includes("unpaid") ||
    text.includes("pending") ||
    text.includes("payable") ||
    text.includes("due")
  );
}

function isOwnerEquityLine(row: Row) {
  const text = getRowText(row);
  return (
    text.includes("owner") ||
    text.includes("equity") ||
    text.includes("capital") ||
    text.includes("retained") ||
    text.includes("contribution") ||
    text.includes("distribution")
  );
}

function getManualBalanceSection(row: Row): BalanceSection {
  const section = asTrimmedString(row.section).toLowerCase();
  const type = asTrimmedString(row.type).toLowerCase();
  const text = getRowText(row);

  if (section.includes("asset") || type.includes("asset")) return "assets";
  if (section.includes("liabil") || type.includes("liabil")) return "liabilities";
  if (section.includes("equity") || type.includes("equity")) return "equity";

  if (text.includes("loan") || text.includes("debt") || text.includes("payable")) {
    return "liabilities";
  }

  if (isOwnerEquityLine(row)) return "equity";

  return "assets";
}

function getManualBalanceAmount(row: Row) {
  return (
    toNumber(row.amount) ||
    toNumber(row.balance) ||
    toNumber(row.current_balance) ||
    toNumber(row.value)
  );
}

function getBankTransactionAmount(row: Row) {
  return (
    toNumber(row.current_balance) ||
    toNumber(row.available_balance) ||
    toNumber(row.balance) ||
    toNumber(row.amount)
  );
}

function getBankAccountBucket(row: Row) {
  const text = getRowText(row);
  if (text.includes("savings")) return "Navy Federal Business Savings";
  if (text.includes("checking")) return "Navy Federal Business Checking";
  return "Business Bank Accounts";
}

function getStripeAmount(row: Row) {
  return (
    toNumber(row.net) ||
    toNumber(row.net_amount) ||
    toNumber(row.amount) - Math.abs(toNumber(row.fee) || toNumber(row.fee_amount))
  );
}

function getLedgerBalanceAmount(row: Row) {
  const debit = toNumber(row.debit);
  const credit = toNumber(row.credit);
  const amount = toNumber(row.amount) || toNumber(row.balance) || toNumber(row.value);

  if (debit || credit) return debit - credit;
  return amount;
}

function getLedgerBalanceSection(row: Row): BalanceSection | null {
  const section = asTrimmedString(row.section || row.statement_section).toLowerCase();
  const accountType = asTrimmedString(row.account_type || row.type).toLowerCase();
  const text = getRowText(row);

  if (section.includes("asset") || accountType.includes("asset")) return "assets";
  if (section.includes("liabil") || accountType.includes("liabil")) return "liabilities";
  if (section.includes("equity") || accountType.includes("equity")) return "equity";

  if (text.includes("cash") || text.includes("checking") || text.includes("savings")) {
    return "assets";
  }
  if (text.includes("payable") || text.includes("liability") || text.includes("debt")) {
    return "liabilities";
  }
  if (isOwnerEquityLine(row)) return "equity";

  return null;
}

function addLine(lines: BalanceSheetLine[], line: BalanceSheetLine) {
  if (!Number.isFinite(line.amount)) return;
  if (Math.abs(line.amount) < 0.005 && line.sourceCount === 0) return;
  lines.push(line);
}

function groupBy<T extends Row>(rows: T[], getKey: (row: T) => string) {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const key = getKey(row);
    const existing = grouped.get(key) || [];
    existing.push(row);
    grouped.set(key, existing);
  }
  return grouped;
}

function getReadiness(payload: BalanceSheetExportPayload, sourceCounts: Record<string, number>) {
  return [
    {
      label: "Bank cash accounts",
      status: sourceCounts.bankTransactions > 0 ? "ready" : "needs_review",
      detail:
        sourceCounts.bankTransactions > 0
          ? `${sourceCounts.bankTransactions.toLocaleString()} bank transaction or balance rows are available for cash accounts.`
          : "Connect Plaid or import Navy Federal CSV/QBO/OFX statements for checking and savings balances.",
    },
    {
      label: "Stripe clearing balance",
      status: sourceCounts.stripeTransactions > 0 ? "ready" : "needs_review",
      detail:
        sourceCounts.stripeTransactions > 0
          ? `${sourceCounts.stripeTransactions.toLocaleString()} Stripe balance rows are available for processor clearing.`
          : "Import or sync Stripe balance transactions to capture pending processor funds and payout timing.",
    },
    {
      label: "Manual balance lines",
      status: sourceCounts.manualLines > 0 ? "ready" : "needs_review",
      detail:
        sourceCounts.manualLines > 0
          ? `${sourceCounts.manualLines.toLocaleString()} manual balance sheet lines are included.`
          : "Add manual balance lines for owner capital, loans, fixed assets, opening balances, or other adjustments.",
    },
    {
      label: "Assets captured",
      status: payload.totals.assets > 0 ? "ready" : "missing",
      detail:
        payload.totals.assets > 0
          ? `Assets total ${formatCurrency(payload.totals.assets)}.`
          : "No asset balance has been detected yet.",
    },
    {
      label: "Liabilities and equity",
      status: payload.totals.liabilities + payload.totals.equity > 0 ? "ready" : "missing",
      detail:
        payload.totals.liabilities + payload.totals.equity > 0
          ? `Liabilities plus equity total ${formatCurrency(payload.totals.liabilitiesAndEquity)}.`
          : "Add liabilities, equity, retained earnings, or current net income to balance the statement.",
    },
    {
      label: "Balance equation",
      status: payload.totals.isBalanced ? "ready" : "needs_review",
      detail: payload.totals.isBalanced
        ? "Assets equal liabilities plus equity within rounding tolerance."
        : `Difference is ${formatCurrency(payload.totals.difference)}. Review missing cash, debt, owner equity, or retained earnings lines.`,
    },
  ] as BalanceSheetExportPayload["readiness"];
}

async function getBalanceSheetPayload({
  startDate,
  endDate,
}: {
  startDate: string | null;
  endDate: string | null;
}): Promise<BalanceSheetExportPayload> {
  const [
    rawBookings,
    rawExpenses,
    rawPayouts,
    rawDisputes,
    rawFinancialLedger,
    rawBankTransactions,
    rawStripeTransactions,
    rawManualLines,
  ] = await Promise.all([
    safeRows<Row>(
      supabaseAdmin.from("bookings").select("*").order("created_at", { ascending: false }).limit(5000),
      "bookings",
    ),
    safeRows<Row>(
      supabaseAdmin.from("expense_ledger").select("*").order("created_at", { ascending: false }).limit(5000),
      "expense_ledger",
    ),
    safeRows<Row>(
      supabaseAdmin.from("guru_payouts").select("*").order("created_at", { ascending: false }).limit(5000),
      "guru_payouts",
    ),
    safeRows<Row>(
      supabaseAdmin.from("dispute_cases").select("*").order("created_at", { ascending: false }).limit(5000),
      "dispute_cases",
    ),
    safeRows<Row>(
      supabaseAdmin
        .from("financial_ledger_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "financial_ledger_entries",
    ),
    safeRows<Row>(
      supabaseAdmin
        .from("bank_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "bank_transactions",
    ),
    safeRows<Row>(
      supabaseAdmin
        .from("stripe_balance_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "stripe_balance_transactions",
    ),
    safeRows<Row>(
      supabaseAdmin
        .from("balance_sheet_lines")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(1000),
      "balance_sheet_lines",
    ),
  ]);

  const bookings = rawBookings.filter((row) => !isArchivedRow(row) && withinRange(row, startDate, endDate));
  const expenses = rawExpenses.filter((row) => !isArchivedRow(row) && withinRange(row, startDate, endDate));
  const payouts = rawPayouts.filter((row) => !isArchivedRow(row) && withinRange(row, startDate, endDate));
  const disputes = rawDisputes.filter((row) => !isArchivedRow(row) && withinRange(row, startDate, endDate));
  const financialLedger = rawFinancialLedger.filter((row) => !isArchivedRow(row) && withinRange(row, startDate, endDate));
  const bankTransactions = rawBankTransactions.filter((row) => !isArchivedRow(row) && withinRange(row, startDate, endDate));
  const stripeTransactions = rawStripeTransactions.filter((row) => !isArchivedRow(row) && withinRange(row, startDate, endDate));
  const manualLines = rawManualLines.filter((row) => !isArchivedRow(row));

  const lines: BalanceSheetLine[] = [];

  const bankGroups = groupBy(bankTransactions, getBankAccountBucket);
  for (const [accountName, rows] of bankGroups.entries()) {
    const balanceRows = rows.filter(
      (row) => row.current_balance !== undefined || row.available_balance !== undefined || row.balance !== undefined,
    );
    const amount = balanceRows.length
      ? balanceRows.reduce((sum, row) => sum + getBankTransactionAmount(row), 0)
      : rows.reduce((sum, row) => sum + toNumber(row.amount), 0);

    addLine(lines, {
      section: "assets",
      lineItem: accountName,
      accountingAccount: "Cash and Cash Equivalents",
      quickBooksAccount: accountName,
      source: "bank_transactions",
      sourceId: null,
      sourceCount: rows.length,
      amount,
      statementImpact: "Balance Sheet",
      taxTreatment: "Cash asset; not income when reconciling Stripe payouts.",
      reconciliationStatus: rows.some((row) => row.reconciled_at || row.reconciliation_id || row.matched_transaction_id)
        ? "Partially or fully reconciled"
        : "Needs reconciliation",
      notes: "Navy Federal checking/savings or imported bank activity. Stripe payout deposits should be matched, not counted as revenue.",
    });
  }

  const stripeClearingAmount = stripeTransactions.reduce(
    (sum, row) => sum + getStripeAmount(row),
    0,
  );
  addLine(lines, {
    section: "assets",
    lineItem: "Stripe Processor Clearing",
    accountingAccount: "Payment Processor Clearing",
    quickBooksAccount: "Stripe Clearing",
    source: "stripe_balance_transactions",
    sourceId: null,
    sourceCount: stripeTransactions.length,
    amount: stripeClearingAmount,
    statementImpact: "Balance Sheet",
    taxTreatment: "Processor clearing asset; fees and revenue should be separated in the P&L.",
    reconciliationStatus: stripeTransactions.some((row) => row.payout_id || row.reconciliation_id || row.matched_transaction_id)
      ? "Payout metadata available"
      : "Needs payout-to-bank match",
    notes: "Represents Stripe net activity available for payout or clearing review.",
  });

  const accountsReceivable = bookings
    .filter(isUnpaidBooking)
    .reduce((sum, booking) => sum + getBookingGrossAmount(booking), 0);
  addLine(lines, {
    section: "assets",
    lineItem: "Accounts Receivable",
    accountingAccount: "Accounts Receivable",
    quickBooksAccount: "Accounts Receivable",
    source: "bookings",
    sourceId: null,
    sourceCount: bookings.filter(isUnpaidBooking).length,
    amount: accountsReceivable,
    statementImpact: "Balance Sheet",
    taxTreatment: "Open customer receivable; verify before accrual-basis export.",
    reconciliationStatus: accountsReceivable > 0 ? "Needs collection/payment review" : "No open receivable detected",
    notes: "Estimated from unpaid, pending, failed, or open booking rows.",
  });

  const guruPayoutsPayable = payouts
    .filter(isPayoutPayable)
    .reduce((sum, payout) => sum + getPayoutAmount(payout), 0);
  addLine(lines, {
    section: "liabilities",
    lineItem: "Guru Payouts Payable",
    accountingAccount: "Contractor Payables",
    quickBooksAccount: "Guru Payouts Payable",
    source: "guru_payouts",
    sourceId: null,
    sourceCount: payouts.filter(isPayoutPayable).length,
    amount: guruPayoutsPayable,
    statementImpact: "Balance Sheet",
    taxTreatment: "Contractor/vendor payable; support 1099 and payout schedules.",
    reconciliationStatus: guruPayoutsPayable > 0 ? "Needs payout review" : "No payable detected",
    notes: "Pending, processing, scheduled, or approved guru payout rows.",
  });

  const accountsPayable = expenses
    .filter(isExpensePayable)
    .reduce((sum, expense) => sum + getExpenseAmount(expense), 0);
  addLine(lines, {
    section: "liabilities",
    lineItem: "Accounts Payable",
    accountingAccount: "Accounts Payable",
    quickBooksAccount: "Accounts Payable",
    source: "expense_ledger",
    sourceId: null,
    sourceCount: expenses.filter(isExpensePayable).length,
    amount: accountsPayable,
    statementImpact: "Balance Sheet",
    taxTreatment: "Vendor payable; verify unpaid bill status before export.",
    reconciliationStatus: accountsPayable > 0 ? "Needs vendor payment review" : "No payable detected",
    notes: "Estimated from unpaid, pending, due, or payable expense ledger rows.",
  });

  const refundAndDisputeLiability =
    bookings.reduce((sum, booking) => sum + getRefundAmount(booking), 0) +
    disputes.reduce(
      (sum, dispute) => sum + (toNumber(dispute.refund_amount) || toNumber(dispute.amount) || toNumber(dispute.financial_impact)),
      0,
    );
  addLine(lines, {
    section: "liabilities",
    lineItem: "Refunds and Disputes Liability",
    accountingAccount: "Refunds and Disputes Payable",
    quickBooksAccount: "Refunds and Disputes Payable",
    source: "bookings/dispute_cases",
    sourceId: null,
    sourceCount: bookings.filter((booking) => getRefundAmount(booking) > 0).length + disputes.length,
    amount: refundAndDisputeLiability,
    statementImpact: "Balance Sheet",
    taxTreatment: "Refund/dispute liability; confirm chargeback resolution and tax treatment with CPA.",
    reconciliationStatus: refundAndDisputeLiability > 0 ? "Needs review" : "No refund liability detected",
    notes: "Estimated from refund-marked booking rows and dispute case financial impact.",
  });

  const taxCollected = bookings.reduce((sum, booking) => sum + toNumber(booking.sales_tax_amount), 0);
  addLine(lines, {
    section: "liabilities",
    lineItem: "Sales Tax Payable",
    accountingAccount: "Sales Tax Payable",
    quickBooksAccount: "Sales Tax Payable",
    source: "bookings",
    sourceId: null,
    sourceCount: bookings.filter((booking) => toNumber(booking.sales_tax_amount) > 0).length,
    amount: taxCollected,
    statementImpact: "Balance Sheet",
    taxTreatment: "Collected tax liability; not revenue.",
    reconciliationStatus: taxCollected > 0 ? "Needs tax remittance review" : "No collected sales tax detected",
    notes: "Uses sales_tax_amount on booking rows when available.",
  });

  const totalBookingRevenue = bookings.filter(isPaidBooking).reduce((sum, booking) => sum + getBookingGrossAmount(booking), 0);
  const totalPlatformFees = bookings.filter(isPaidBooking).reduce((sum, booking) => sum + getPlatformFee(booking), 0);
  const totalGuruCost = bookings.filter(isPaidBooking).reduce((sum, booking) => sum + getGuruPayoutAmount(booking), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + getExpenseAmount(expense), 0);
  const totalRefunds = bookings.reduce((sum, booking) => sum + getRefundAmount(booking), 0);
  const totalDisputes = disputes.reduce((sum, dispute) => sum + (toNumber(dispute.amount) || toNumber(dispute.financial_impact)), 0);
  const estimatedCurrentNetIncome = totalBookingRevenue + totalPlatformFees - totalGuruCost - totalExpenses - totalRefunds - totalDisputes;

  addLine(lines, {
    section: "equity",
    lineItem: "Current Net Income / Loss",
    accountingAccount: "Current Year Earnings",
    quickBooksAccount: "Current Year Earnings",
    source: "bookings/expense_ledger/dispute_cases",
    sourceId: null,
    sourceCount: bookings.length + expenses.length + disputes.length,
    amount: estimatedCurrentNetIncome,
    statementImpact: "Balance Sheet",
    taxTreatment: "Flows from current-period P&L; confirm final close entries with CPA.",
    reconciliationStatus: "Estimated from operational activity",
    notes: "Connects Balance Sheet equity to P&L-style activity until retained earnings close entries are posted.",
  });

  for (const ledgerRow of financialLedger) {
    const section = getLedgerBalanceSection(ledgerRow);
    if (!section) continue;

    const amount = Math.abs(getLedgerBalanceAmount(ledgerRow));
    const name =
      asTrimmedString(ledgerRow.account_name) ||
      asTrimmedString(ledgerRow.account) ||
      asTrimmedString(ledgerRow.description) ||
      "Financial Ledger Balance";

    addLine(lines, {
      section,
      lineItem: name,
      accountingAccount: name,
      quickBooksAccount: name,
      source: "financial_ledger_entries",
      sourceId: asTrimmedString(ledgerRow.id) || null,
      sourceCount: 1,
      amount,
      statementImpact: "Balance Sheet",
      taxTreatment: "Ledger balance sheet account; review mapping before QuickBooks import.",
      reconciliationStatus: ledgerRow.reconciled_at || ledgerRow.reconciliation_id ? "Reconciled" : "Needs review",
      notes: asTrimmedString(ledgerRow.memo) || asTrimmedString(ledgerRow.description) || "Imported from financial ledger entries.",
    });
  }

  for (const manualLine of manualLines) {
    const section = getManualBalanceSection(manualLine);
    const amount = getManualBalanceAmount(manualLine);
    const label =
      asTrimmedString(manualLine.label) ||
      asTrimmedString(manualLine.name) ||
      asTrimmedString(manualLine.description) ||
      "Manual Balance Sheet Line";

    addLine(lines, {
      section,
      lineItem: label,
      accountingAccount:
        asTrimmedString(manualLine.account_name) ||
        asTrimmedString(manualLine.account) ||
        label,
      quickBooksAccount:
        asTrimmedString(manualLine.quickbooks_account) ||
        asTrimmedString(manualLine.qbo_account) ||
        asTrimmedString(manualLine.account_name) ||
        label,
      source: "balance_sheet_lines",
      sourceId: asTrimmedString(manualLine.id) || null,
      sourceCount: 1,
      amount,
      statementImpact: "Balance Sheet",
      taxTreatment: asTrimmedString(manualLine.tax_treatment) || "Manual balance sheet classification; review with CPA.",
      reconciliationStatus: asTrimmedString(manualLine.reconciliation_status) || "Manual line",
      notes: asTrimmedString(manualLine.notes) || asTrimmedString(manualLine.memo) || "Manual admin balance sheet line.",
    });
  }

  const assets = lines
    .filter((line) => line.section === "assets")
    .reduce((sum, line) => sum + line.amount, 0);
  const liabilities = lines
    .filter((line) => line.section === "liabilities")
    .reduce((sum, line) => sum + line.amount, 0);
  const equity = lines
    .filter((line) => line.section === "equity")
    .reduce((sum, line) => sum + line.amount, 0);
  const liabilitiesAndEquity = liabilities + equity;
  const difference = assets - liabilitiesAndEquity;

  const payload: BalanceSheetExportPayload = {
    generatedAt: new Date().toISOString(),
    periodLabel: getPeriodLabel(startDate, endDate),
    startDate,
    endDate,
    totals: {
      assets,
      liabilities,
      equity,
      liabilitiesAndEquity,
      difference,
      isBalanced: Math.abs(difference) < 1,
    },
    lines: lines.sort((a, b) => {
      const sectionOrder: Record<BalanceSection, number> = {
        assets: 1,
        liabilities: 2,
        equity: 3,
      };
      return (
        sectionOrder[a.section] - sectionOrder[b.section] ||
        a.lineItem.localeCompare(b.lineItem)
      );
    }),
    readiness: [],
  };

  payload.readiness = getReadiness(payload, {
    bankTransactions: bankTransactions.length,
    stripeTransactions: stripeTransactions.length,
    manualLines: manualLines.length,
  });

  return payload;
}

function formatSection(section: BalanceSection) {
  if (section === "assets") return "Assets";
  if (section === "liabilities") return "Liabilities";
  return "Equity";
}

function lineToExportRow(line: BalanceSheetLine) {
  const debit = line.section === "assets" ? Math.max(0, line.amount) : 0;
  const credit = line.section === "liabilities" || line.section === "equity" ? Math.max(0, line.amount) : 0;

  return [
    formatSection(line.section),
    line.lineItem,
    line.accountingAccount,
    line.quickBooksAccount,
    line.source,
    line.sourceId || "",
    line.sourceCount,
    line.amount.toFixed(2),
    debit.toFixed(2),
    credit.toFixed(2),
    formatCurrency(line.amount),
    line.statementImpact,
    line.taxTreatment,
    line.reconciliationStatus,
    line.notes,
  ];
}

function buildCsv(payload: BalanceSheetExportPayload) {
  const summaryRows = [
    ["SitGuru Balance Sheet"],
    ["Period", payload.periodLabel],
    ["Generated At", payload.generatedAt],
    ["Total Assets", payload.totals.assets.toFixed(2)],
    ["Total Liabilities", payload.totals.liabilities.toFixed(2)],
    ["Total Equity", payload.totals.equity.toFixed(2)],
    ["Liabilities + Equity", payload.totals.liabilitiesAndEquity.toFixed(2)],
    ["Difference", payload.totals.difference.toFixed(2)],
    [],
  ];

  const csvRows = [
    ...summaryRows,
    BALANCE_SHEET_EXPORT_COLUMNS,
    ...payload.lines.map(lineToExportRow),
    [],
    ["Readiness Check", "Status", "Detail"],
    ...payload.readiness.map((item) => [item.label, item.status, item.detail]),
  ];

  return csvRows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

function buildHtml(payload: BalanceSheetExportPayload, mode: "excel" | "word" | "html") {
  const title = "SitGuru Balance Sheet";
  const extensionLabel = mode === "excel" ? "CPA Workbook" : mode === "word" ? "Report Document" : "Printable View";

  const groupedSections: BalanceSection[] = ["assets", "liabilities", "equity"];

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; background: #f7fbf8; }
    .page { max-width: 1180px; margin: 0 auto; background: #fff; border: 1px solid #bbf7d0; border-radius: 24px; padding: 28px; }
    .eyebrow { color: #047857; font-size: 11px; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; }
    h1 { margin: 10px 0 8px; font-size: 38px; line-height: 1; color: #16392b; }
    p { color: #475569; }
    .summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 24px 0; }
    .card { border: 1px solid #d1fae5; background: #ecfdf5; border-radius: 16px; padding: 14px; }
    .card.blue { border-color: #bae6fd; background: #f0f9ff; }
    .card.purple { border-color: #ddd6fe; background: #f5f3ff; }
    .card.red { border-color: #fecdd3; background: #fff1f2; }
    .label { font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #475569; }
    .value { margin-top: 8px; font-size: 24px; font-weight: 900; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-top: 18px; background: #fff; }
    th { text-align: left; font-size: 11px; letter-spacing: .14em; text-transform: uppercase; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; }
    td { border: 1px solid #e2e8f0; padding: 10px; font-size: 13px; vertical-align: top; }
    .section { background: #ecfdf5; color: #047857; font-weight: 900; text-transform: uppercase; letter-spacing: .12em; }
    .amount { text-align: right; font-weight: 800; white-space: nowrap; }
    .ready { color: #047857; font-weight: 800; }
    .review { color: #b45309; font-weight: 800; }
    .missing { color: #be123c; font-weight: 800; }
    @media print { body { background: #fff; margin: 0; } .page { border: none; border-radius: 0; } }
  </style>
</head>
<body>
  <main class="page">
    <div class="eyebrow">Admin / Financials / Balance Sheet / ${escapeHtml(extensionLabel)}</div>
    <h1>${escapeHtml(title)}</h1>
    <p>Period: ${escapeHtml(payload.periodLabel)} · Generated: ${escapeHtml(payload.generatedAt)}</p>

    <section class="summary">
      <div class="card"><div class="label">Total Assets</div><div class="value">${escapeHtml(formatCurrency(payload.totals.assets))}</div></div>
      <div class="card blue"><div class="label">Total Liabilities</div><div class="value">${escapeHtml(formatCurrency(payload.totals.liabilities))}</div></div>
      <div class="card purple"><div class="label">Total Equity</div><div class="value">${escapeHtml(formatCurrency(payload.totals.equity))}</div></div>
      <div class="card ${payload.totals.isBalanced ? "" : "red"}"><div class="label">Difference</div><div class="value">${escapeHtml(formatCurrency(payload.totals.difference))}</div></div>
    </section>

    <table>
      <thead>
        <tr>
          <th>Line Item</th>
          <th>Account</th>
          <th>Source</th>
          <th>Reconciliation</th>
          <th style="text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${groupedSections
          .map((section) => {
            const sectionLines = payload.lines.filter((line) => line.section === section);
            const total = sectionLines.reduce((sum, line) => sum + line.amount, 0);
            return `
              <tr><td class="section" colspan="5">${escapeHtml(formatSection(section))}</td></tr>
              ${sectionLines
                .map(
                  (line) => `<tr>
                    <td><strong>${escapeHtml(line.lineItem)}</strong><br /><small>${escapeHtml(line.notes)}</small></td>
                    <td>${escapeHtml(line.quickBooksAccount)}<br /><small>${escapeHtml(line.taxTreatment)}</small></td>
                    <td>${escapeHtml(line.source)} (${line.sourceCount})</td>
                    <td>${escapeHtml(line.reconciliationStatus)}</td>
                    <td class="amount">${escapeHtml(formatCurrency(line.amount))}</td>
                  </tr>`,
                )
                .join("")}
              <tr><td colspan="4"><strong>Total ${escapeHtml(formatSection(section))}</strong></td><td class="amount"><strong>${escapeHtml(formatCurrency(total))}</strong></td></tr>
            `;
          })
          .join("")}
      </tbody>
    </table>

    <h2>CPA / QuickBooks Readiness</h2>
    <table>
      <thead><tr><th>Check</th><th>Status</th><th>Detail</th></tr></thead>
      <tbody>
        ${payload.readiness
          .map((item) => `<tr>
            <td>${escapeHtml(item.label)}</td>
            <td class="${item.status === "ready" ? "ready" : item.status === "missing" ? "missing" : "review"}">${escapeHtml(item.status.replace("_", " "))}</td>
            <td>${escapeHtml(item.detail)}</td>
          </tr>`)
          .join("")}
      </tbody>
    </table>
  </main>
</body>
</html>`;
}

function getContentType(format: ExportFormat) {
  if (format === "csv") return "text/csv; charset=utf-8";
  if (format === "excel") return "application/vnd.ms-excel; charset=utf-8";
  if (format === "word") return "application/msword; charset=utf-8";
  return "text/html; charset=utf-8";
}

function getExtension(format: ExportFormat) {
  if (format === "csv") return "csv";
  if (format === "excel") return "xls";
  if (format === "word") return "doc";
  return "html";
}

function normalizeFormat(value: string | null): ExportFormat {
  const format = (value || "csv").toLowerCase();
  if (["csv", "excel", "word", "html", "print", "pdf"].includes(format)) {
    return format as ExportFormat;
  }
  return "csv";
}

function buildExportBody(payload: BalanceSheetExportPayload, format: ExportFormat) {
  if (format === "csv") return buildCsv(payload);
  if (format === "excel") return buildHtml(payload, "excel");
  if (format === "word") return buildHtml(payload, "word");
  return buildHtml(payload, "html");
}

async function sendWithResend({
  to,
  subject,
  html,
  filename,
  content,
}: {
  to: string;
  subject: string;
  html: string;
  filename: string;
  content: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.FINANCIAL_EXPORT_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    "SitGuru Financials <financials@sitguru.com>";

  if (!apiKey) {
    return {
      ok: false,
      message: "RESEND_API_KEY is not configured. Use the returned downloadUrl instead.",
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
      to: [to],
      subject,
      html,
      attachments: [
        {
          filename,
          content: Buffer.from(content).toString("base64"),
        },
      ],
    }),
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      message:
        asTrimmedString((json as Row).message) ||
        "Unable to send the Balance Sheet email attachment.",
    };
  }

  return { ok: true, message: "Balance Sheet email attachment sent." };
}

export async function GET(request: NextRequest) {
  const actor = await requireFinancialAdmin();

  if (!actor) {
    return NextResponse.json(
      { ok: false, message: "Financial admin access is required." },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const format = normalizeFormat(searchParams.get("format"));
  const startDate = normalizeDate(searchParams.get("startDate"));
  const endDate = normalizeDate(searchParams.get("endDate"));

  const payload = await getBalanceSheetPayload({ startDate, endDate });
  const body = buildExportBody(payload, format);
  const extension = getExtension(format);
  const filename = `sitguru-balance-sheet-${payload.periodLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}.${extension}`;

  await writeFinancialAuditLog({
    actor,
    action: "export_balance_sheet",
    metadata: {
      format,
      filename,
      startDate,
      endDate,
      rowCount: payload.lines.length,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    },
  });

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": getContentType(format),
      "Content-Disposition": `${format === "html" || format === "print" || format === "pdf" ? "inline" : "attachment"}; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: NextRequest) {
  const actor = await requireFinancialAdmin();

  if (!actor) {
    return NextResponse.json(
      { ok: false, message: "Financial admin access is required." },
      { status: 403 },
    );
  }

  let body: Row = {};

  try {
    body = (await request.json()) as Row;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid JSON request body." },
      { status: 400 },
    );
  }

  const to = asTrimmedString(body.to).toLowerCase();
  const format = normalizeFormat(asTrimmedString(body.format) || "excel");
  const startDate = normalizeDate(asTrimmedString(body.startDate));
  const endDate = normalizeDate(asTrimmedString(body.endDate));
  const subject =
    asTrimmedString(body.subject) ||
    `SitGuru Balance Sheet - ${getPeriodLabel(startDate, endDate)}`;
  const message =
    asTrimmedString(body.message) ||
    "Attached is the SitGuru Balance Sheet export for CPA/bookkeeping review.";

  if (!to || !to.includes("@")) {
    return NextResponse.json(
      { ok: false, message: "A valid recipient email is required." },
      { status: 400 },
    );
  }

  const payload = await getBalanceSheetPayload({ startDate, endDate });
  const content = buildExportBody(payload, format);
  const filename = `sitguru-balance-sheet-${payload.periodLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}.${getExtension(format)}`;
  const downloadUrl = `/api/admin/financials/balance-sheet/export?format=${encodeURIComponent(
    format,
  )}${startDate ? `&startDate=${encodeURIComponent(startDate)}` : ""}${
    endDate ? `&endDate=${encodeURIComponent(endDate)}` : ""
  }`;

  const emailResult = await sendWithResend({
    to,
    subject,
    html: `<p>${escapeHtml(message)}</p><p>Period: ${escapeHtml(payload.periodLabel)}</p><p>Generated by SitGuru Admin Financials.</p>`,
    filename,
    content,
  });

  await writeFinancialAuditLog({
    actor,
    action: emailResult.ok ? "email_balance_sheet_export" : "email_balance_sheet_export_failed",
    metadata: {
      to,
      format,
      filename,
      startDate,
      endDate,
      rowCount: payload.lines.length,
      emailConfigured: Boolean(process.env.RESEND_API_KEY),
      result: emailResult.message,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    },
  });

  return NextResponse.json({
    ok: emailResult.ok,
    message: emailResult.message,
    downloadUrl,
    filename,
    rowCount: payload.lines.length,
  });
}
