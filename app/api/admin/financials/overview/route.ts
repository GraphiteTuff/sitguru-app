import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type KpiTone = "green" | "blue" | "red";

type SourceStatus = {
  id: string;
  table: string;
  ok: boolean;
  rowCount: number;
  message: string;
};

type DashboardKpi = {
  label: string;
  value: string;
  rawValue: number;
  change: string;
  helper: string;
  tone: KpiTone;
};

type FunnelRow = {
  label: string;
  value: string;
  rawValue: number;
  widthClass: string;
};

type PayoutStatus = {
  paid: number;
  processing: number;
  pending: number;
  total: number;
};

type CommissionStatus = {
  paid: number;
  pending: number;
  processing: number;
  total: number;
};

type CashRunway = {
  months: number;
  cashBalance: number;
  monthlyBurn: number;
  runwayEndLabel: string;
};

type TrendPoint = {
  label: string;
  platformRevenue: number;
  grossBookings: number;
};

type ExpenseTrendPoint = {
  month: string;
  payouts: number;
  commissions: number;
  fees: number;
  other: number;
};

type CashFlowCategory = {
  label: string;
  value: number;
  displayValue: string;
  type: "inflow" | "outflow" | "net";
};

type ManagementAlert = {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical" | "success";
  href: string;
};

type PlaidBankingSummary = {
  businessAccountCount: number;
  checkingCount: number;
  savingsCount: number;
  currentCash: number;
  availableCash: number;
  postedRows: number;
  pendingRows: number;
  needsReviewRows: number;
  manualCategorizedRows: number;
  autoCategorizedRows: number;
  uncategorizedRows: number;
  excludedRows: number;
  transactionRows: number;
  revenue: number;
  expenses: number;
  ownerContributions: number;
  ownerDraws: number;
  transfers: number;
  cashIn: number;
  cashOut: number;
  netCashFlow: number;
  lastSyncedAt: string | null;
  status: "ready" | "needs_review" | "not_connected";
  message: string;
};

type FinancialOverviewResponse = {
  ok: boolean;
  isLive: boolean;
  generatedAt: string;
  filters: {
    range: string;
    startDate: string | null;
    endDate: string | null;
    segment: string;
  };
  sourceHealth: SourceStatus[];
  plaidBanking: PlaidBankingSummary;
  kpis: DashboardKpi[];
  breakEven: {
    percent: number;
    target: number;
    currentContribution: number;
    remaining: number;
    runwayMonths: number;
  };
  bookingsToCashFunnel: FunnelRow[];
  guruPayoutStatus: PayoutStatus;
  partnerCommissionStatus: CommissionStatus;
  cashRunway: CashRunway;
  revenueTrend: TrendPoint[];
  expenseTrend: ExpenseTrendPoint[];
  cashFlowByCategory: CashFlowCategory[];
  managementAlerts: ManagementAlert[];
  fallbackUsed: boolean;
};

type AnyRow = Record<string, unknown>;

type AdminIdentity = {
  id: string;
  email: string;
  role: string;
  canAccessFinancials: boolean;
};

const BREAK_EVEN_TARGET = 1450000;

const FINANCE_ROLES = [
  "owner",
  "super_admin",
  "admin",
  "finance_admin",
  "finance",
  "accounting",
  "bookkeeper",
];

const TABLE_NAMES = [
  "admin_plaid_accounts",
  "admin_plaid_transactions",
  "admin_plaid_items",
  "bookings",
  "customer_bookings",
  "payments",
  "stripe_transactions",
  "stripe_balance_transactions",
  "financial_ledger_entries",
  "bank_transactions",
  "expense_ledger",
  "cash_flow_lines",
  "balance_sheet_lines",
  "financial_statement_lines",
  "guru_payouts",
  "payouts",
  "commissions",
  "partner_commissions",
  "financial_export_history",
  "financial_audit_logs",
  "proforma_assumptions",
  "guru_trust_safety_plan_purchases",
  "trust_safety_financial_events",
  "booking_trust_safety_deductions",
];

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const cleaned = value.replace(/[$,%\s,()]/g, "");
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

function centsToDollars(value: unknown) {
  return toNumber(value) / 100;
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

function getSearchParam(url: string, name: string, fallback = "") {
  const value = new URL(url).searchParams.get(name);
  return value && value.trim() ? value.trim() : fallback;
}

function getDateOrNull(value: string) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return value.slice(0, 10);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

function formatPercent(value: number) {
  return `${Number.isFinite(value) ? value.toFixed(1) : "0.0"}%`;
}

function getString(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function getStatus(row: AnyRow) {
  return getString(row, [
    "status",
    "payment_status",
    "payout_status",
    "commission_status",
    "repayment_status",
    "state",
  ]).toLowerCase();
}

function getRowDate(row: AnyRow) {
  return (
    getString(row, [
      "date",
      "transaction_date",
      "posted_at",
      "paid_at",
      "payout_date",
      "available_on",
      "service_date",
      "booking_date",
      "created_at",
      "updated_at",
    ]) || ""
  );
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}

function isInsideDateWindow(
  row: AnyRow,
  startDate: string | null,
  endDate: string | null,
) {
  if (!startDate && !endDate) return true;

  const rowDate = parseDate(getRowDate(row));

  if (!rowDate) return false;

  if (startDate) {
    const start = new Date(`${startDate}T00:00:00.000Z`);
    if (rowDate < start) return false;
  }

  if (endDate) {
    const end = new Date(`${endDate}T23:59:59.999Z`);
    if (rowDate > end) return false;
  }

  return true;
}

function getRangeWindow(range: string, explicitStart: string | null, explicitEnd: string | null) {
  if (explicitStart || explicitEnd) {
    return {
      startDate: explicitStart,
      endDate: explicitEnd,
    };
  }

  const now = new Date();
  const endDate = now.toISOString().slice(0, 10);

  if (range === "all") {
    return {
      startDate: null,
      endDate: null,
    };
  }

  if (range === "ytd") {
    return {
      startDate: `${now.getFullYear()}-01-01`,
      endDate,
    };
  }

  const days =
    range === "7d"
      ? 7
      : range === "30d"
        ? 30
        : range === "90d"
          ? 90
          : range === "12m"
            ? 365
            : 30;

  const start = new Date(now);
  start.setDate(start.getDate() - days);

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate,
  };
}

function monthsBack(count: number) {
  const now = new Date();
  const rows: { key: string; label: string; start: Date; end: Date }[] = [];

  for (let index = count - 1; index >= 0; index -= 1) {
    const month = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999);

    rows.push({
      key: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
      label: month.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
      start: month,
      end,
    });
  }

  return rows;
}

function isBusinessCheckingOrSavings(row: AnyRow) {
  const name = `${asTrimmedString(row.name)} ${asTrimmedString(
    row.official_name,
  )}`.toLowerCase();
  const subtype = asTrimmedString(row.subtype).toLowerCase();

  return (
    (subtype === "checking" || subtype === "savings") &&
    name.includes("business")
  );
}

function isBusinessChecking(row: AnyRow) {
  const name = `${asTrimmedString(row.name)} ${asTrimmedString(
    row.official_name,
  )}`.toLowerCase();
  const subtype = asTrimmedString(row.subtype).toLowerCase();

  return subtype === "checking" && name.includes("business");
}

function isBusinessSavings(row: AnyRow) {
  const name = `${asTrimmedString(row.name)} ${asTrimmedString(
    row.official_name,
  )}`.toLowerCase();
  const subtype = asTrimmedString(row.subtype).toLowerCase();

  return subtype === "savings" && name.includes("business");
}

function getTransactionType(row: AnyRow) {
  return (
    asTrimmedString(row.sitguru_category_type).toLowerCase() || "uncategorized"
  );
}

function getReviewStatus(row: AnyRow) {
  return asTrimmedString(row.review_status).toLowerCase() || "needs_review";
}

function isReviewedTransaction(row: AnyRow) {
  const status = getReviewStatus(row);
  return status === "reviewed" || status === "auto_categorized";
}

function isExcluded(row: AnyRow) {
  return Boolean(
    row.removed_at ||
      getOptionalBoolean(row.is_excluded_from_reports) ||
      getTransactionType(row) === "ignore",
  );
}

function isReportableTransaction(row: AnyRow) {
  return !isExcluded(row) && isReviewedTransaction(row);
}

function getAbsoluteTransactionAmount(row: AnyRow) {
  return Math.abs(toNumber(row.amount));
}

function getSignedCashAmount(row: AnyRow) {
  const type = getTransactionType(row);
  const amount = getAbsoluteTransactionAmount(row);

  if (type === "income" || type === "owner_equity") return amount;

  if (type === "expense" || type === "owner_draw" || type === "liability") {
    return -amount;
  }

  if (type === "transfer") {
    const label = `${asTrimmedString(row.name)} ${asTrimmedString(
      row.merchant_name,
    )} ${asTrimmedString(row.sitguru_notes)}`.toLowerCase();

    if (
      label.includes("from savings") ||
      label.includes("to checking") ||
      label.includes("deposit")
    ) {
      return amount;
    }

    return -amount;
  }

  return -amount;
}

function getManualExpenseAmount(row: AnyRow) {
  return Math.abs(
    toNumber(row.amount) ||
      toNumber(row.total_amount) ||
      toNumber(row.expense_amount) ||
      toNumber(row.cost),
  );
}

function getGrossAmount(row: AnyRow) {
  return (
    toCentsAwareAmount(row.gross_amount) ||
    toCentsAwareAmount(row.amount) ||
    toCentsAwareAmount(row.total_amount) ||
    toCentsAwareAmount(row.booking_total) ||
    toCentsAwareAmount(row.price) ||
    toCentsAwareAmount(row.subtotal) ||
    0
  );
}

function getNetAmount(row: AnyRow) {
  return (
    toCentsAwareAmount(row.net_amount) ||
    toCentsAwareAmount(row.net) ||
    toCentsAwareAmount(row.platform_revenue) ||
    toCentsAwareAmount(row.platform_fee) ||
    toCentsAwareAmount(row.sitguru_fee) ||
    0
  );
}

function getPayoutAmount(row: AnyRow) {
  return (
    toCentsAwareAmount(row.payout_amount) ||
    toCentsAwareAmount(row.amount) ||
    toCentsAwareAmount(row.total_amount) ||
    0
  );
}

function getCommissionAmount(row: AnyRow) {
  return (
    toCentsAwareAmount(row.commission_amount) ||
    toCentsAwareAmount(row.amount) ||
    toCentsAwareAmount(row.total_amount) ||
    0
  );
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

function getTrustSafetyRemainingBalance(row: AnyRow) {
  const paymentStatus = getStatus(row);
  const repaymentStatus = asTrimmedString(row.repayment_status).toLowerCase();

  if (
    ["canceled", "cancelled", "refunded", "voided", "failed"].includes(paymentStatus) ||
    repaymentStatus === "canceled"
  ) {
    return 0;
  }

  return Math.max(0, centsToDollars(row.remaining_balance_cents));
}

function getMonthLabel(value: string) {
  const date = parseDate(value);

  if (!date) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

function widthClassFor(value: number, max: number) {
  if (max <= 0) return "w-[5%]";

  const percent = Math.max(5, Math.min(100, Math.round((value / max) * 100)));

  if (percent >= 95) return "w-full";
  if (percent >= 85) return "w-11/12";
  if (percent >= 75) return "w-10/12";
  if (percent >= 65) return "w-9/12";
  if (percent >= 55) return "w-8/12";
  if (percent >= 45) return "w-7/12";
  if (percent >= 35) return "w-6/12";
  if (percent >= 25) return "w-5/12";
  if (percent >= 15) return "w-4/12";

  return "w-3/12";
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
  query: PromiseLike<{ data: unknown; error: unknown }>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Financial overview query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Financial overview query skipped for ${label}:`, error);
    return [];
  }
}

async function checkSource(table: string): Promise<SourceStatus> {
  try {
    const { count, error } = await supabaseAdmin
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) {
      return {
        id: table,
        table,
        ok: false,
        rowCount: 0,
        message: "Table unavailable or not yet configured.",
      };
    }

    return {
      id: table,
      table,
      ok: true,
      rowCount: count || 0,
      message: count ? "Live source connected." : "Table exists but has no rows yet.",
    };
  } catch {
    return {
      id: table,
      table,
      ok: false,
      rowCount: 0,
      message: "Table unavailable or not yet configured.",
    };
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
      "admin_users_financial_overview_access",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("profiles")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "profiles_financial_overview_access",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("users")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "users_financial_overview_access",
    ),
  ]);

  const profile = (profileChecks.flat().find(Boolean) || {}) as AnyRow;
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

function buildPlaidBankingSummary({
  accounts,
  transactions,
  items,
  startDate,
  endDate,
}: {
  accounts: AnyRow[];
  transactions: AnyRow[];
  items: AnyRow[];
  startDate: string | null;
  endDate: string | null;
}): PlaidBankingSummary {
  const businessAccounts = accounts.filter(isBusinessCheckingOrSavings);
  const allowedAccountIds = new Set(
    businessAccounts
      .map((account) => asTrimmedString(account.account_id))
      .filter(Boolean),
  );

  const businessTransactions = transactions
    .filter((transaction) =>
      allowedAccountIds.has(asTrimmedString(transaction.account_id)),
    )
    .filter((transaction) => !transaction.removed_at)
    .filter((transaction) => isInsideDateWindow(transaction, startDate, endDate));

  const reportableTransactions = businessTransactions.filter(isReportableTransaction);
  const postedRows = businessTransactions.filter(
    (transaction) => !getOptionalBoolean(transaction.pending),
  ).length;
  const pendingRows = businessTransactions.filter((transaction) =>
    getOptionalBoolean(transaction.pending),
  ).length;

  const needsReviewRows = businessTransactions.filter(
    (transaction) =>
      !isExcluded(transaction) && getReviewStatus(transaction) === "needs_review",
  ).length;

  const manualCategorizedRows = businessTransactions.filter((transaction) =>
    getOptionalBoolean(transaction.manually_categorized),
  ).length;

  const autoCategorizedRows = businessTransactions.filter(
    (transaction) => getReviewStatus(transaction) === "auto_categorized",
  ).length;

  const uncategorizedRows = businessTransactions.filter(
    (transaction) =>
      !isExcluded(transaction) &&
      (getTransactionType(transaction) === "uncategorized" ||
        getString(transaction, ["sitguru_category"]) === "Uncategorized"),
  ).length;

  const excludedRows = businessTransactions.filter(isExcluded).length;

  const currentCash = businessAccounts.reduce(
    (sum, account) => sum + toNumber(account.current_balance),
    0,
  );

  const availableCash = businessAccounts.reduce(
    (sum, account) => sum + toNumber(account.available_balance),
    0,
  );

  const revenue = reportableTransactions
    .filter((transaction) => getTransactionType(transaction) === "income")
    .reduce((sum, transaction) => sum + getAbsoluteTransactionAmount(transaction), 0);

  const expenses = reportableTransactions
    .filter((transaction) => getTransactionType(transaction) === "expense")
    .reduce((sum, transaction) => sum + getAbsoluteTransactionAmount(transaction), 0);

  const ownerContributions = reportableTransactions
    .filter((transaction) => getTransactionType(transaction) === "owner_equity")
    .reduce((sum, transaction) => sum + getAbsoluteTransactionAmount(transaction), 0);

  const ownerDraws = reportableTransactions
    .filter((transaction) => getTransactionType(transaction) === "owner_draw")
    .reduce((sum, transaction) => sum + getAbsoluteTransactionAmount(transaction), 0);

  const transfers = reportableTransactions
    .filter((transaction) => getTransactionType(transaction) === "transfer")
    .reduce((sum, transaction) => sum + getAbsoluteTransactionAmount(transaction), 0);

  const cashImpacts = reportableTransactions.map(getSignedCashAmount);
  const cashIn = cashImpacts
    .filter((amount) => amount > 0)
    .reduce((sum, amount) => sum + amount, 0);
  const cashOut = cashImpacts
    .filter((amount) => amount < 0)
    .reduce((sum, amount) => sum + Math.abs(amount), 0);

  const itemSyncedDates = items
    .map((item) => asTrimmedString(item.transactions_last_synced_at))
    .filter(Boolean)
    .sort();

  const transactionUpdatedDates = businessTransactions
    .map((transaction) => asTrimmedString(transaction.updated_at))
    .filter(Boolean)
    .sort();

  const lastSyncedAt =
    itemSyncedDates.at(-1) || transactionUpdatedDates.at(-1) || null;

  const checkingCount = businessAccounts.filter(isBusinessChecking).length;
  const savingsCount = businessAccounts.filter(isBusinessSavings).length;

  const status =
    businessAccounts.length === 0
      ? "not_connected"
      : needsReviewRows || uncategorizedRows
        ? "needs_review"
        : "ready";

  const message =
    status === "not_connected"
      ? "No NFCU business checking or savings accounts are currently connected."
      : status === "needs_review"
        ? "NFCU business banking is connected, but some rows still need category review."
        : "NFCU Business Checking and Business Savings are connected and reporting.";

  return {
    businessAccountCount: businessAccounts.length,
    checkingCount,
    savingsCount,
    currentCash,
    availableCash,
    postedRows,
    pendingRows,
    needsReviewRows,
    manualCategorizedRows,
    autoCategorizedRows,
    uncategorizedRows,
    excludedRows,
    transactionRows: businessTransactions.length,
    revenue,
    expenses,
    ownerContributions,
    ownerDraws,
    transfers,
    cashIn,
    cashOut,
    netCashFlow: cashIn - cashOut,
    lastSyncedAt,
    status,
    message,
  };
}

function buildRevenueTrend({
  businessTransactions,
  bookingRows,
  paymentRows,
}: {
  businessTransactions: AnyRow[];
  bookingRows: AnyRow[];
  paymentRows: AnyRow[];
}): TrendPoint[] {
  const months = monthsBack(6);

  return months.map((month) => {
    const transactionRows = businessTransactions.filter((row) => {
      const rowDate = parseDate(getRowDate(row));
      return Boolean(rowDate && rowDate >= month.start && rowDate <= month.end);
    });

    const bookingMonthRows = bookingRows.filter((row) => {
      const rowDate = parseDate(getRowDate(row));
      return Boolean(rowDate && rowDate >= month.start && rowDate <= month.end);
    });

    const paymentMonthRows = paymentRows.filter((row) => {
      const rowDate = parseDate(getRowDate(row));
      return Boolean(rowDate && rowDate >= month.start && rowDate <= month.end);
    });

    const plaidRevenue = transactionRows
      .filter(isReportableTransaction)
      .filter((row) => getTransactionType(row) === "income")
      .reduce((sum, row) => sum + getAbsoluteTransactionAmount(row), 0);

    const bookingGross = bookingMonthRows.reduce(
      (sum, row) => sum + getGrossAmount(row),
      0,
    );

    const paymentGross = paymentMonthRows.reduce(
      (sum, row) => sum + getGrossAmount(row),
      0,
    );

    return {
      label: month.label,
      platformRevenue:
        plaidRevenue ||
        paymentMonthRows.reduce((sum, row) => sum + getNetAmount(row), 0),
      grossBookings: bookingGross || paymentGross || plaidRevenue,
    };
  });
}

function buildExpenseTrend({
  businessTransactions,
  manualExpenses,
  payoutRows,
  commissionRows,
  stripeRows,
}: {
  businessTransactions: AnyRow[];
  manualExpenses: AnyRow[];
  payoutRows: AnyRow[];
  commissionRows: AnyRow[];
  stripeRows: AnyRow[];
}): ExpenseTrendPoint[] {
  const months = monthsBack(6);

  return months.map((month) => {
    const inMonth = (row: AnyRow) => {
      const rowDate = parseDate(getRowDate(row));
      return Boolean(rowDate && rowDate >= month.start && rowDate <= month.end);
    };

    const bankExpenses = businessTransactions
      .filter(inMonth)
      .filter(isReportableTransaction)
      .filter((row) => getTransactionType(row) === "expense")
      .reduce((sum, row) => sum + getAbsoluteTransactionAmount(row), 0);

    const manual = manualExpenses
      .filter(inMonth)
      .reduce((sum, row) => sum + getManualExpenseAmount(row), 0);

    return {
      month: month.label,
      payouts: payoutRows.filter(inMonth).reduce((sum, row) => sum + getPayoutAmount(row), 0),
      commissions: commissionRows
        .filter(inMonth)
        .reduce((sum, row) => sum + getCommissionAmount(row), 0),
      fees: stripeRows
        .filter(inMonth)
        .reduce((sum, row) => sum + Math.abs(toCentsAwareAmount(row.fee)), 0),
      other: bankExpenses + manual,
    };
  });
}

function buildPayoutStatus(rows: AnyRow[]): PayoutStatus {
  const paid = rows.filter((row) => {
    const status = getStatus(row);
    return status.includes("paid") || status.includes("complete") || status.includes("succeeded");
  }).length;

  const processing = rows.filter((row) => getStatus(row).includes("processing")).length;
  const pending = rows.filter((row) => {
    const status = getStatus(row);
    return status.includes("pending") || status.includes("queued") || status.includes("ready");
  }).length;

  return {
    paid,
    processing,
    pending,
    total: rows.length,
  };
}

function buildCommissionStatus(rows: AnyRow[]): CommissionStatus {
  const paid = rows.filter((row) => {
    const status = getStatus(row);
    return status.includes("paid") || status.includes("complete") || status.includes("succeeded");
  }).length;

  const processing = rows.filter((row) => getStatus(row).includes("processing")).length;
  const pending = rows.filter((row) => {
    const status = getStatus(row);
    return status.includes("pending") || status.includes("queued") || status.includes("ready");
  }).length;

  return {
    paid,
    pending,
    processing,
    total: rows.length,
  };
}

function buildManagementAlerts({
  plaidBanking,
  manualRows,
  proformaRows,
  reconciliationScore,
  netIncome,
  cashRunwayMonths,
}: {
  plaidBanking: PlaidBankingSummary;
  manualRows: number;
  proformaRows: number;
  reconciliationScore: number;
  netIncome: number;
  cashRunwayMonths: number;
}): ManagementAlert[] {
  const alerts: ManagementAlert[] = [];

  if (plaidBanking.businessAccountCount === 0) {
    alerts.push({
      id: "plaid-not-connected",
      title: "Connect NFCU business banking",
      description:
        "The financial dashboard does not see connected NFCU Business Checking or Savings accounts yet.",
      severity: "critical",
      href: "/admin/financials/plaid",
    });
  } else if (plaidBanking.needsReviewRows || plaidBanking.uncategorizedRows) {
    alerts.push({
      id: "plaid-needs-review",
      title: "Banking categories need review",
      description: `${plaidBanking.needsReviewRows.toLocaleString()} needs-review rows and ${plaidBanking.uncategorizedRows.toLocaleString()} uncategorized rows should be cleaned up.`,
      severity: "warning",
      href: "/admin/financials/plaid",
    });
  } else {
    alerts.push({
      id: "plaid-ready",
      title: "Plaid/NFCU business banking is active",
      description:
        "Business Checking and Savings data is available for the connected financial pages.",
      severity: "success",
      href: "/admin/financials/plaid",
    });
  }

  if (reconciliationScore < 80) {
    alerts.push({
      id: "reconciliation-low",
      title: "Reconciliation score needs improvement",
      description:
        "Review pending, uncategorized, and needs-review bank rows before relying on final reports.",
      severity: "warning",
      href: "/admin/financials/reconciliation",
    });
  }

  if (manualRows === 0) {
    alerts.push({
      id: "manual-rows-missing",
      title: "Manual financial rows are not loaded",
      description:
        "Add manual expense, cash flow, or balance sheet lines for CPA adjustments and operating expenses that are not bank-fed.",
      severity: "info",
      href: "/admin/financials/reconciliation",
    });
  }

  if (proformaRows === 0) {
    alerts.push({
      id: "proforma-missing",
      title: "Forecast assumptions need setup",
      description:
        "Add or confirm Pro Forma assumptions so the dashboard can show reliable forward-looking financials.",
      severity: "info",
      href: "/admin/financials/pro-forma",
    });
  }

  if (netIncome < 0) {
    alerts.push({
      id: "net-income-negative",
      title: "Net income is currently negative",
      description:
        "Review revenue, bank expenses, manual expenses, and forecast assumptions for the current period.",
      severity: "warning",
      href: "/admin/financials/profit-loss",
    });
  }

  if (cashRunwayMonths > 0 && cashRunwayMonths < 6) {
    alerts.push({
      id: "runway-low",
      title: "Cash runway is under six months",
      description:
        "Monitor current cash, burn rate, and near-term expenses before increasing spend.",
      severity: "warning",
      href: "/admin/financials/cash-flow",
    });
  }

  return alerts.slice(0, 8);
}

export async function GET(request: Request) {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessFinancials) {
    return NextResponse.json(
      {
        ok: false,
        error: "Financial access required.",
      },
      { status: 403 },
    );
  }

  const range = getSearchParam(request.url, "range", "30d");
  const segment = getSearchParam(request.url, "segment", "all");
  const explicitStart = getDateOrNull(getSearchParam(request.url, "startDate"));
  const explicitEnd = getDateOrNull(getSearchParam(request.url, "endDate"));
  const { startDate, endDate } = getRangeWindow(range, explicitStart, explicitEnd);

  const [
    sourceHealth,
    plaidAccounts,
    plaidTransactions,
    plaidItems,
    bookingRowsA,
    bookingRowsB,
    paymentRows,
    stripeRows,
    stripeBalanceRows,
    expenseRows,
    cashFlowLines,
    balanceSheetLines,
    statementLines,
    payoutRowsA,
    payoutRowsB,
    commissionRowsA,
    commissionRowsB,
    proformaRows,
    trustSafetyPurchases,
    trustSafetyEvents,
    bookingDeductions,
  ] = await Promise.all([
    Promise.all(TABLE_NAMES.map(checkSource)),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("admin_plaid_accounts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "admin_plaid_accounts",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("admin_plaid_transactions")
        .select("*")
        .is("removed_at", null)
        .order("date", { ascending: false })
        .limit(10000),
      "admin_plaid_transactions",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("admin_plaid_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "admin_plaid_items",
    ),
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
        .from("customer_bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "customer_bookings",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "payments",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("stripe_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "stripe_transactions",
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
        .from("expense_ledger")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "expense_ledger",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("cash_flow_lines")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "cash_flow_lines",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("balance_sheet_lines")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "balance_sheet_lines",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("financial_statement_lines")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "financial_statement_lines",
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
        .from("payouts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "payouts",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("commissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "commissions",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("partner_commissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "partner_commissions",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("proforma_assumptions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "proforma_assumptions",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("guru_trust_safety_plan_purchases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "guru_trust_safety_plan_purchases",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("trust_safety_financial_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "trust_safety_financial_events",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("booking_trust_safety_deductions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "booking_trust_safety_deductions",
    ),
  ]);

  const bookingRows = [...bookingRowsA, ...bookingRowsB]
    .filter((row) => !isArchivedRow(row))
    .filter((row) => isInsideDateWindow(row, startDate, endDate));

  const activePaymentRows = paymentRows
    .filter((row) => !isArchivedRow(row))
    .filter((row) => isInsideDateWindow(row, startDate, endDate));

  const activeExpenseRows = expenseRows
    .filter((row) => !isArchivedRow(row))
    .filter((row) => isInsideDateWindow(row, startDate, endDate));

  const activeCashFlowLines = cashFlowLines.filter((row) => !isArchivedRow(row));
  const activeBalanceSheetLines = balanceSheetLines.filter((row) => !isArchivedRow(row));
  const activeStatementLines = statementLines.filter((row) => !isArchivedRow(row));
  const activeProformaRows = proformaRows.filter((row) => !isArchivedRow(row));
  const activeTrustSafetyPurchases = trustSafetyPurchases.filter(
    (row) => !isArchivedRow(row),
  );

  const plaidBanking = buildPlaidBankingSummary({
    accounts: plaidAccounts,
    transactions: plaidTransactions,
    items: plaidItems,
    startDate,
    endDate,
  });

  const businessAccounts = plaidAccounts.filter(isBusinessCheckingOrSavings);
  const allowedAccountIds = new Set(
    businessAccounts
      .map((account) => asTrimmedString(account.account_id))
      .filter(Boolean),
  );

  const businessTransactions = plaidTransactions
    .filter((transaction) =>
      allowedAccountIds.has(asTrimmedString(transaction.account_id)),
    )
    .filter((transaction) => !transaction.removed_at)
    .filter((transaction) => isInsideDateWindow(transaction, startDate, endDate));

  const reportableBusinessTransactions = businessTransactions.filter(
    isReportableTransaction,
  );

  const manualExpenseTotal = activeExpenseRows.reduce(
    (sum, row) => sum + getManualExpenseAmount(row),
    0,
  );

  const grossBookings =
    bookingRows.reduce((sum, row) => sum + getGrossAmount(row), 0) ||
    activePaymentRows.reduce((sum, row) => sum + getGrossAmount(row), 0) ||
    plaidBanking.revenue;

  const platformRevenue =
    activePaymentRows.reduce((sum, row) => sum + getNetAmount(row), 0) ||
    plaidBanking.revenue;

  const bankExpenseTotal = plaidBanking.expenses;
  const totalExpenses = bankExpenseTotal + manualExpenseTotal;

  const payoutRows = [...payoutRowsA, ...payoutRowsB]
    .filter((row) => !isArchivedRow(row))
    .filter((row) => isInsideDateWindow(row, startDate, endDate));

  const commissionRows = [...commissionRowsA, ...commissionRowsB]
    .filter((row) => !isArchivedRow(row))
    .filter((row) => isInsideDateWindow(row, startDate, endDate));

  const payoutTotal = payoutRows.reduce((sum, row) => sum + getPayoutAmount(row), 0);
  const commissionTotal = commissionRows.reduce(
    (sum, row) => sum + getCommissionAmount(row),
    0,
  );

  const stripeFees =
    stripeBalanceRows
      .filter((row) => isInsideDateWindow(row, startDate, endDate))
      .reduce((sum, row) => sum + Math.abs(toCentsAwareAmount(row.fee)), 0) ||
    stripeRows
      .filter((row) => isInsideDateWindow(row, startDate, endDate))
      .reduce((sum, row) => sum + Math.abs(toCentsAwareAmount(row.fee)), 0);

  const refunds = stripeRows
    .filter((row) => isInsideDateWindow(row, startDate, endDate))
    .filter((row) => getStatus(row).includes("refund"))
    .reduce((sum, row) => sum + Math.abs(toCentsAwareAmount(row.amount)), 0);

  const netIncome =
    platformRevenue - totalExpenses - payoutTotal - commissionTotal - stripeFees - refunds;

  const trustSafetyReceivables = activeTrustSafetyPurchases.reduce(
    (sum, row) => sum + getTrustSafetyRemainingBalance(row),
    0,
  );

  const manualRows =
    activeExpenseRows.length +
    activeCashFlowLines.length +
    activeBalanceSheetLines.length +
    activeStatementLines.length;

  const reconciliationIssues =
    plaidBanking.needsReviewRows +
    plaidBanking.uncategorizedRows +
    Math.round(plaidBanking.pendingRows / 2);

  const reconciliationScore =
    plaidBanking.transactionRows === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            100,
            Math.round(100 - (reconciliationIssues / plaidBanking.transactionRows) * 100),
          ),
        );

  const monthlyBurn = Math.max(totalExpenses + payoutTotal + commissionTotal + stripeFees, 0);
  const cashRunwayMonths =
    monthlyBurn > 0 ? Math.floor(plaidBanking.currentCash / monthlyBurn) : 0;

  const runwayDate = new Date();
  runwayDate.setMonth(runwayDate.getMonth() + Math.max(cashRunwayMonths, 0));

  const breakEvenContribution =
    platformRevenue - totalExpenses - payoutTotal - commissionTotal - stripeFees;

  const breakEvenPercent =
    BREAK_EVEN_TARGET > 0
      ? Math.max(0, Math.min(100, (breakEvenContribution / BREAK_EVEN_TARGET) * 100))
      : 0;

  const revenueTrend = buildRevenueTrend({
    businessTransactions,
    bookingRows,
    paymentRows: activePaymentRows,
  });

  const expenseTrend = buildExpenseTrend({
    businessTransactions,
    manualExpenses: activeExpenseRows,
    payoutRows,
    commissionRows,
    stripeRows: [...stripeRows, ...stripeBalanceRows],
  });

  const funnelValues = [
    {
      label: "Gross Bookings",
      rawValue: grossBookings,
    },
    {
      label: "Platform Revenue",
      rawValue: platformRevenue,
    },
    {
      label: "Bank Cash In",
      rawValue: plaidBanking.cashIn,
    },
    {
      label: "Net Cash Flow",
      rawValue: plaidBanking.netCashFlow,
    },
  ];

  const maxFunnelValue = Math.max(...funnelValues.map((row) => Math.abs(row.rawValue)), 1);

  const cashFlowByCategory: CashFlowCategory[] = [
    {
      label: "Bank Cash In",
      value: plaidBanking.cashIn,
      displayValue: formatCurrency(plaidBanking.cashIn),
      type: "inflow",
    },
    {
      label: "Bank Cash Out",
      value: plaidBanking.cashOut,
      displayValue: formatCurrency(plaidBanking.cashOut),
      type: "outflow",
    },
    {
      label: "Manual Expenses",
      value: manualExpenseTotal,
      displayValue: formatCurrency(manualExpenseTotal),
      type: "outflow",
    },
    {
      label: "Net Cash Flow",
      value: plaidBanking.netCashFlow - manualExpenseTotal,
      displayValue: formatCurrency(plaidBanking.netCashFlow - manualExpenseTotal),
      type: "net",
    },
  ];

  const kpis: DashboardKpi[] = [
    {
      label: "Current Cash",
      value: formatCurrency(plaidBanking.currentCash),
      rawValue: plaidBanking.currentCash,
      change: plaidBanking.lastSyncedAt ? "Live Plaid/NFCU" : "Not synced",
      helper: "Current balance from NFCU Business Checking and Business Savings.",
      tone: plaidBanking.currentCash >= 0 ? "green" : "red",
    },
    {
      label: "Available Cash",
      value: formatCurrency(plaidBanking.availableCash),
      rawValue: plaidBanking.availableCash,
      change: `${plaidBanking.businessAccountCount} business accounts`,
      helper: "Available cash across connected business banking accounts.",
      tone: plaidBanking.availableCash >= 0 ? "green" : "red",
    },
    {
      label: "Platform Revenue",
      value: formatCurrency(platformRevenue),
      rawValue: platformRevenue,
      change: `${plaidBanking.postedRows.toLocaleString()} posted bank rows`,
      helper: "Reviewed income activity from Plaid/NFCU and payment records.",
      tone: "green",
    },
    {
      label: "Total Expenses",
      value: formatCurrency(totalExpenses),
      rawValue: totalExpenses,
      change: `${activeExpenseRows.length.toLocaleString()} manual expense rows`,
      helper: "Bank expenses plus manual expense ledger rows.",
      tone: totalExpenses > 0 ? "red" : "green",
    },
    {
      label: "Net Income",
      value: formatCurrency(netIncome),
      rawValue: netIncome,
      change: netIncome >= 0 ? "Positive" : "Loss",
      helper: "Estimated from revenue minus bank, manual, payout, commission, fee, and refund costs.",
      tone: netIncome >= 0 ? "green" : "red",
    },
    {
      label: "Needs Review",
      value: plaidBanking.needsReviewRows.toLocaleString(),
      rawValue: plaidBanking.needsReviewRows,
      change: `${plaidBanking.uncategorizedRows.toLocaleString()} uncategorized`,
      helper: "Bank transactions still needing category or report review.",
      tone: plaidBanking.needsReviewRows ? "red" : "green",
    },
  ];

  const managementAlerts = buildManagementAlerts({
    plaidBanking,
    manualRows,
    proformaRows: activeProformaRows.length,
    reconciliationScore,
    netIncome,
    cashRunwayMonths,
  });

  const response: FinancialOverviewResponse = {
    ok: true,
    isLive: true,
    generatedAt: new Date().toISOString(),
    filters: {
      range,
      startDate,
      endDate,
      segment,
    },
    sourceHealth,
    plaidBanking,
    kpis,
    breakEven: {
      percent: Number(formatPercent(breakEvenPercent).replace("%", "")),
      target: BREAK_EVEN_TARGET,
      currentContribution: breakEvenContribution,
      remaining: Math.max(0, BREAK_EVEN_TARGET - breakEvenContribution),
      runwayMonths: cashRunwayMonths,
    },
    bookingsToCashFunnel: funnelValues.map((row) => ({
      label: row.label,
      value: formatCurrency(row.rawValue),
      rawValue: row.rawValue,
      widthClass: widthClassFor(Math.abs(row.rawValue), maxFunnelValue),
    })),
    guruPayoutStatus: buildPayoutStatus(payoutRows),
    partnerCommissionStatus: buildCommissionStatus(commissionRows),
    cashRunway: {
      months: cashRunwayMonths,
      cashBalance: plaidBanking.currentCash,
      monthlyBurn,
      runwayEndLabel:
        cashRunwayMonths > 0
          ? runwayDate.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })
          : "Not available",
    },
    revenueTrend,
    expenseTrend,
    cashFlowByCategory,
    managementAlerts,
    fallbackUsed: false,
  };

  return NextResponse.json(response);
}