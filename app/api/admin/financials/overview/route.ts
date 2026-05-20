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
  connectedBusinessAccounts: number;
  businessCheckingAccounts: number;
  businessSavingsAccounts: number;
  currentCashBalance: number;
  availableCashBalance: number;
  postedTransactions: number;
  pendingTransactions: number;
  needsReviewTransactions: number;
  manualCategorizedTransactions: number;
  uncategorizedTransactions: number;
  businessOnlyFeed: boolean;
  lastSyncedAt: string | null;

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

function widthClassFor(value: number, maxValue: number) {
  const safeMax = Math.max(Math.abs(maxValue), 1);
  const percent = Math.max(
    6,
    Math.min(100, Math.round((Math.abs(value) / safeMax) * 100)),
  );

  if (percent >= 95) return "w-full";
  if (percent >= 83) return "w-5/6";
  if (percent >= 66) return "w-4/6";
  if (percent >= 50) return "w-3/6";
  if (percent >= 33) return "w-2/6";
  if (percent >= 16) return "w-1/6";

  return "w-[6%]";
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

function getRangeWindow(
  range: string,
  explicitStart: string | null,
  explicitEnd: string | null,
) {
  if (explicitStart || explicitEnd) {
    return {
      startDate: explicitStart,
      endDate: explicitEnd,
    };
  }

  const now = new Date();
  const endDate = now.toISOString().slice(0, 10);
  const start = new Date(now);

  if (range === "all") {
    return {
      startDate: null,
      endDate: null,
    };
  }

  if (range === "today") {
    return {
      startDate: endDate,
      endDate,
    };
  }

  if (range === "ytd") {
    return {
      startDate: `${now.getFullYear()}-01-01`,
      endDate,
    };
  }

  if (range === "week" || range === "7d") {
    start.setDate(now.getDate() - 7);
  } else if (range === "quarter" || range === "90d") {
    start.setMonth(now.getMonth() - 3);
  } else if (range === "annual" || range === "12m") {
    start.setFullYear(now.getFullYear() - 1);
  } else {
    start.setMonth(now.getMonth() - 1);
  }

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
    const end = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    rows.push({
      key: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(
        2,
        "0",
      )}`,
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

function getPlaidEnvironment() {
  return process.env.PLAID_ENV?.trim() || "production";
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
  const explicitFinanceAccess = getOptionalBoolean(profile.can_access_financials);
  const envAllowed = envAdminEmails.includes(userEmail);

  return {
    id: user.id,
    email: userEmail,
    role,
    canAccessFinancials:
      active && (hasFinancialRole(role) || explicitFinanceAccess || envAllowed),
  };
}

function getNewestProductionItemIds(items: AnyRow[]) {
  const currentEnvironment = getPlaidEnvironment();

  const productionItems = items
    .filter(
      (item) =>
        asTrimmedString(item.plaid_environment) === currentEnvironment ||
        (!asTrimmedString(item.plaid_environment) &&
          currentEnvironment === "production"),
    )
    .sort((a, b) => {
      const aDate = parseDate(asTrimmedString(a.created_at))?.getTime() || 0;
      const bDate = parseDate(asTrimmedString(b.created_at))?.getTime() || 0;
      return bDate - aDate;
    });

  const newestItemId = asTrimmedString(productionItems[0]?.item_id);

  return newestItemId ? new Set([newestItemId]) : new Set<string>();
}

function getActiveBusinessAccounts(accounts: AnyRow[], items: AnyRow[]) {
  const currentEnvironment = getPlaidEnvironment();
  const activeItemIds = getNewestProductionItemIds(items);

  return accounts
    .filter(
      (account) =>
        asTrimmedString(account.plaid_environment) === currentEnvironment ||
        (!asTrimmedString(account.plaid_environment) &&
          currentEnvironment === "production"),
    )
    .filter((account) =>
      activeItemIds.size
        ? activeItemIds.has(asTrimmedString(account.item_id))
        : true,
    )
    .filter(isBusinessCheckingOrSavings);
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
  const businessAccounts = getActiveBusinessAccounts(accounts, items);
  const allowedAccountIds = new Set(
    businessAccounts
      .map((account) => asTrimmedString(account.account_id))
      .filter(Boolean),
  );

  const activeItemIds = new Set(
    businessAccounts.map((account) => asTrimmedString(account.item_id)).filter(Boolean),
  );

  const businessTransactions = transactions
    .filter((transaction) =>
      allowedAccountIds.has(asTrimmedString(transaction.account_id)),
    )
    .filter((transaction) =>
      activeItemIds.size
        ? activeItemIds.has(asTrimmedString(transaction.item_id))
        : true,
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
    .filter((item) =>
      activeItemIds.size ? activeItemIds.has(asTrimmedString(item.item_id)) : true,
    )
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

  const netCashFlow = cashIn - cashOut;

  return {
    connectedBusinessAccounts: businessAccounts.length,
    businessCheckingAccounts: checkingCount,
    businessSavingsAccounts: savingsCount,
    currentCashBalance: currentCash,
    availableCashBalance: availableCash,
    postedTransactions: postedRows,
    pendingTransactions: pendingRows,
    needsReviewTransactions: needsReviewRows,
    manualCategorizedTransactions: manualCategorizedRows,
    uncategorizedTransactions: uncategorizedRows,
    businessOnlyFeed: true,
    lastSyncedAt,

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
    netCashFlow,
    status,
    message,
  };
}

function buildRevenueTrend({
  bookingRows,
  paymentRows,
}: {
  bookingRows: AnyRow[];
  paymentRows: AnyRow[];
}): TrendPoint[] {
  const months = monthsBack(6);

  return months.map((month) => {
    const bookingMonthRows = bookingRows.filter((row) => {
      const rowDate = parseDate(getRowDate(row));
      return Boolean(rowDate && rowDate >= month.start && rowDate <= month.end);
    });

    const paymentMonthRows = paymentRows.filter((row) => {
      const rowDate = parseDate(getRowDate(row));
      return Boolean(rowDate && rowDate >= month.start && rowDate <= month.end);
    });

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
      platformRevenue: paymentMonthRows.reduce(
        (sum, row) => sum + getNetAmount(row),
        0,
      ),
      grossBookings: bookingGross || paymentGross,
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
      payouts: payoutRows
        .filter(inMonth)
        .reduce((sum, row) => sum + getPayoutAmount(row), 0),
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
    return (
      status.includes("paid") ||
      status.includes("complete") ||
      status.includes("succeeded")
    );
  }).length;

  const processing = rows.filter((row) =>
    getStatus(row).includes("processing"),
  ).length;

  const pending = rows.filter((row) => {
    const status = getStatus(row);
    return (
      status.includes("pending") ||
      status.includes("queued") ||
      status.includes("ready")
    );
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
    return (
      status.includes("paid") ||
      status.includes("complete") ||
      status.includes("succeeded")
    );
  }).length;

  const processing = rows.filter((row) =>
    getStatus(row).includes("processing"),
  ).length;

  const pending = rows.filter((row) => {
    const status = getStatus(row);
    return (
      status.includes("pending") ||
      status.includes("queued") ||
      status.includes("ready")
    );
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

  const range = getSearchParam(request.url, "range", "month");
  const segment = getSearchParam(request.url, "segment", "all");
  const explicitStart = getDateOrNull(getSearchParam(request.url, "startDate"));
  const explicitEnd = getDateOrNull(getSearchParam(request.url, "endDate"));
  const { startDate, endDate } = getRangeWindow(range, explicitStart, explicitEnd);
  const plaidEnvironment = getPlaidEnvironment();

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
  ] = await Promise.all([
    Promise.all(TABLE_NAMES.map(checkSource)),

    safeRows<AnyRow>(
      supabaseAdmin
        .from("admin_plaid_accounts")
        .select("*")
        .eq("user_id", actor.id)
        .eq("plaid_environment", plaidEnvironment)
        .order("created_at", { ascending: false })
        .limit(1000),
      "admin_plaid_accounts",
    ),

    safeRows<AnyRow>(
      supabaseAdmin
        .from("admin_plaid_transactions")
        .select("*")
        .eq("user_id", actor.id)
        .is("removed_at", null)
        .order("date", { ascending: false })
        .limit(10000),
      "admin_plaid_transactions",
    ),

    safeRows<AnyRow>(
      supabaseAdmin
        .from("admin_plaid_items")
        .select("*")
        .eq("user_id", actor.id)
        .eq("plaid_environment", plaidEnvironment)
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
  ]);

  const bookingRows = [...bookingRowsA, ...bookingRowsB].filter(
    (row) => !isArchivedRow(row) && isInsideDateWindow(row, startDate, endDate),
  );

  const filteredPaymentRows = paymentRows.filter(
    (row) => !isArchivedRow(row) && isInsideDateWindow(row, startDate, endDate),
  );

  const filteredStripeRows = [...stripeRows, ...stripeBalanceRows].filter(
    (row) => !isArchivedRow(row) && isInsideDateWindow(row, startDate, endDate),
  );

  const filteredExpenseRows = expenseRows.filter(
    (row) => !isArchivedRow(row) && isInsideDateWindow(row, startDate, endDate),
  );

  const payoutRows = [...payoutRowsA, ...payoutRowsB].filter(
    (row) => !isArchivedRow(row) && isInsideDateWindow(row, startDate, endDate),
  );

  const commissionRows = [...commissionRowsA, ...commissionRowsB].filter(
    (row) => !isArchivedRow(row) && isInsideDateWindow(row, startDate, endDate),
  );

  const plaidBanking = buildPlaidBankingSummary({
    accounts: plaidAccounts,
    transactions: plaidTransactions,
    items: plaidItems,
    startDate,
    endDate,
  });

  const activeBusinessAccounts = getActiveBusinessAccounts(plaidAccounts, plaidItems);
  const activeAccountIds = new Set(
    activeBusinessAccounts.map((account) => asTrimmedString(account.account_id)),
  );

  const activeBusinessTransactions = plaidTransactions
    .filter((transaction) => activeAccountIds.has(asTrimmedString(transaction.account_id)))
    .filter((transaction) => !transaction.removed_at)
    .filter((transaction) => isInsideDateWindow(transaction, startDate, endDate));

  const grossBookings =
    bookingRows.reduce((sum, row) => sum + getGrossAmount(row), 0) ||
    filteredPaymentRows.reduce((sum, row) => sum + getGrossAmount(row), 0);

  const platformRevenue = filteredPaymentRows.reduce(
    (sum, row) => sum + getNetAmount(row),
    0,
  );

  const guruPayouts = payoutRows.reduce(
    (sum, row) => sum + getPayoutAmount(row),
    0,
  );

  const partnerCommissions = commissionRows.reduce(
    (sum, row) => sum + getCommissionAmount(row),
    0,
  );

  const stripeFees = filteredStripeRows.reduce(
    (sum, row) =>
      sum +
      Math.abs(
        toCentsAwareAmount(row.fee) ||
          toCentsAwareAmount(row.stripe_fee) ||
          toCentsAwareAmount(row.fee_amount),
      ),
    0,
  );

  const refundsAndChargebacks =
    filteredStripeRows
      .filter((row) => {
        const status = getStatus(row);
        const description = `${getString(row, [
          "description",
          "type",
          "reporting_category",
        ])}`.toLowerCase();

        return (
          status.includes("refund") ||
          status.includes("chargeback") ||
          description.includes("refund") ||
          description.includes("chargeback") ||
          description.includes("dispute")
        );
      })
      .reduce((sum, row) => sum + Math.abs(toCentsAwareAmount(row.amount)), 0) +
    activeBusinessTransactions
      .filter((row) => getString(row, ["sitguru_category"]).toLowerCase().includes("refund"))
      .reduce((sum, row) => sum + getAbsoluteTransactionAmount(row), 0);

  const bankOperatingExpenses = plaidBanking.expenses;
  const manualExpenses = filteredExpenseRows.reduce(
    (sum, row) => sum + getManualExpenseAmount(row),
    0,
  );

  const operatingExpenses = bankOperatingExpenses + manualExpenses;
  const totalExpenses =
    guruPayouts +
    partnerCommissions +
    stripeFees +
    refundsAndChargebacks +
    operatingExpenses;

  const netIncome = platformRevenue - totalExpenses;
  const netMargin = platformRevenue > 0 ? (netIncome / platformRevenue) * 100 : 0;

  const currentCash = plaidBanking.currentCash;
  const monthlyBurn = Math.max(0, operatingExpenses + stripeFees + partnerCommissions);
  const cashRunwayMonths =
    monthlyBurn > 0 ? Number((currentCash / monthlyBurn).toFixed(1)) : 0;

  const breakEvenPercent =
    BREAK_EVEN_TARGET > 0
      ? Math.max(
          0,
          Math.min(100, Number(((platformRevenue / BREAK_EVEN_TARGET) * 100).toFixed(1))),
        )
      : 0;

  const netBookings = Math.max(0, grossBookings - refundsAndChargebacks);
  const collectedCash = platformRevenue;
  const payoutAndFees = guruPayouts + partnerCommissions + stripeFees;
  const netCashRetained = collectedCash - payoutAndFees - operatingExpenses;

  const bookingsToCashFunnelValues = [
    grossBookings,
    refundsAndChargebacks,
    netBookings,
    collectedCash,
    payoutAndFees,
    netCashRetained,
  ];

  const funnelMax = Math.max(...bookingsToCashFunnelValues.map(Math.abs), 1);

  const bookingsToCashFunnel: FunnelRow[] = [
    {
      label: "Gross Bookings",
      value: formatCurrency(grossBookings),
      rawValue: grossBookings,
      widthClass: widthClassFor(grossBookings, funnelMax),
    },
    {
      label: "Less Cancellations",
      value: formatCurrency(refundsAndChargebacks),
      rawValue: refundsAndChargebacks,
      widthClass: widthClassFor(refundsAndChargebacks, funnelMax),
    },
    {
      label: "Net Bookings",
      value: formatCurrency(netBookings),
      rawValue: netBookings,
      widthClass: widthClassFor(netBookings, funnelMax),
    },
    {
      label: "Collected Cash",
      value: formatCurrency(collectedCash),
      rawValue: collectedCash,
      widthClass: widthClassFor(collectedCash, funnelMax),
    },
    {
      label: "Payouts & Fees",
      value: formatCurrency(payoutAndFees),
      rawValue: payoutAndFees,
      widthClass: widthClassFor(payoutAndFees, funnelMax),
    },
    {
      label: "Net Cash Retained",
      value: formatCurrency(netCashRetained),
      rawValue: netCashRetained,
      widthClass: widthClassFor(Math.abs(netCashRetained), funnelMax),
    },
  ];

  const revenueTrend = buildRevenueTrend({
    bookingRows,
    paymentRows: filteredPaymentRows,
  });

  const expenseTrend = buildExpenseTrend({
    businessTransactions: activeBusinessTransactions,
    manualExpenses: filteredExpenseRows,
    payoutRows,
    commissionRows,
    stripeRows: filteredStripeRows,
  });

  const cashFlowByCategory: CashFlowCategory[] = [
    {
      label: "Platform Revenue",
      value: platformRevenue,
      displayValue: formatCurrency(platformRevenue),
      type: "inflow",
    },
    {
      label: "Owner Contributions",
      value: plaidBanking.ownerContributions,
      displayValue: formatCurrency(plaidBanking.ownerContributions),
      type: "inflow",
    },
    {
      label: "Guru Payouts",
      value: -guruPayouts,
      displayValue: `-${formatCurrency(guruPayouts)}`,
      type: "outflow",
    },
    {
      label: "Partner Commissions",
      value: -partnerCommissions,
      displayValue: `-${formatCurrency(partnerCommissions)}`,
      type: "outflow",
    },
    {
      label: "Stripe Fees",
      value: -stripeFees,
      displayValue: `-${formatCurrency(stripeFees)}`,
      type: "outflow",
    },
    {
      label: "Refunds / Chargebacks",
      value: -refundsAndChargebacks,
      displayValue: `-${formatCurrency(refundsAndChargebacks)}`,
      type: "outflow",
    },
    {
      label: "Operating Expenses",
      value: -operatingExpenses,
      displayValue: `-${formatCurrency(operatingExpenses)}`,
      type: "outflow",
    },
    {
      label: "Net Cash Flow",
      value: netCashRetained,
      displayValue: formatCurrency(netCashRetained),
      type: "net",
    },
  ];

  const reconciliationScore =
    plaidBanking.transactionRows === 0
      ? 0
      : Math.round(
          ((plaidBanking.manualCategorizedRows + plaidBanking.autoCategorizedRows) /
            plaidBanking.transactionRows) *
            100,
        );

  const managementAlerts = buildManagementAlerts({
    plaidBanking,
    manualRows:
      filteredExpenseRows.length +
      cashFlowLines.length +
      balanceSheetLines.length +
      statementLines.length,
    proformaRows: proformaRows.length,
    reconciliationScore,
    netIncome,
    cashRunwayMonths,
  });

  if (plaidBanking.revenue > 0 && platformRevenue === 0) {
    managementAlerts.unshift({
      id: "bank-income-not-platform-revenue",
      title: "Bank income is not counted as Platform Revenue",
      description:
        "Plaid bank credits exist, but Platform Revenue remains $0 until matching Stripe/payment revenue is recorded.",
      severity: "info",
      href: "/admin/financials/plaid",
    });
  }

  const kpis: DashboardKpi[] = [
    {
      label: "Gross Bookings",
      value: formatCurrency(grossBookings),
      rawValue: grossBookings,
      change: "Live",
      helper: "bookings/payments",
      tone: "green",
    },
    {
      label: "Platform Revenue",
      value: formatCurrency(platformRevenue),
      rawValue: platformRevenue,
      change: "Live",
      helper: "Stripe/payments only",
      tone: "green",
    },
    {
      label: "Guru Payouts",
      value: formatCurrency(guruPayouts),
      rawValue: guruPayouts,
      change: "Live",
      helper: "payout rows",
      tone: "green",
    },
    {
      label: "Partner Commissions",
      value: formatCurrency(partnerCommissions),
      rawValue: partnerCommissions,
      change: "Live",
      helper: "commission rows",
      tone: "blue",
    },
    {
      label: "Stripe Fees",
      value: formatCurrency(stripeFees),
      rawValue: stripeFees,
      change: "Live",
      helper: "Stripe tables",
      tone: "blue",
    },
    {
      label: "Refunds / Chargebacks",
      value: formatCurrency(refundsAndChargebacks),
      rawValue: refundsAndChargebacks,
      change: "Live",
      helper: "Stripe/banking",
      tone: refundsAndChargebacks > 0 ? "red" : "green",
    },
    {
      label: "Net Margin",
      value: formatPercent(netMargin),
      rawValue: netMargin,
      change: "Live",
      helper: "calculated",
      tone: netMargin < 0 ? "red" : "green",
    },
    {
      label: "Cash Balance",
      value: formatCurrency(currentCash),
      rawValue: currentCash,
      change: "Live",
      helper: "NFCU/Plaid",
      tone: currentCash < 0 ? "red" : "green",
    },
  ];

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
      percent: breakEvenPercent,
      target: BREAK_EVEN_TARGET,
      currentContribution: platformRevenue,
      remaining: Math.max(0, BREAK_EVEN_TARGET - platformRevenue),
      runwayMonths: cashRunwayMonths,
    },
    bookingsToCashFunnel,
    guruPayoutStatus: buildPayoutStatus(payoutRows),
    partnerCommissionStatus: buildCommissionStatus(commissionRows),
    cashRunway: {
      months: cashRunwayMonths,
      cashBalance: currentCash,
      monthlyBurn,
      runwayEndLabel:
        cashRunwayMonths > 0
          ? new Date(
              Date.now() + cashRunwayMonths * 30 * 24 * 60 * 60 * 1000,
            ).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Unavailable",
    },
    revenueTrend,
    expenseTrend,
    cashFlowByCategory,
    managementAlerts,
    fallbackUsed: false,
  };

  return NextResponse.json(response);
}