import Link from "next/link";
import ProfitLossExportActions from "@/components/admin/financials/ProfitLossExportActions";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AdminIdentity = {
  id: string;
  email: string;
  role: string;
  canAccessFinancials: boolean;
};

type PeriodKey =
  | "today"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "annual"
  | "all";

type AdminProfitLossPageProps = {
  searchParams?: Promise<{
    period?: string;
  }>;
};

type PlaidTransactionRow = {
  id: string;
  transaction_id: string;
  item_id: string;
  account_id: string;
  name?: string | null;
  merchant_name?: string | null;
  amount?: number | null;
  iso_currency_code?: string | null;
  date?: string | null;
  pending?: boolean | null;
  payment_channel?: string | null;
  sitguru_category?: string | null;
  sitguru_category_type?: string | null;
  sitguru_report_section?: string | null;
  sitguru_notes?: string | null;
  review_status?: string | null;
  is_excluded_from_reports?: boolean | null;
  manually_categorized?: boolean | null;
  removed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type PlaidAccountRow = {
  id: string;
  account_id: string;
  item_id: string;
  name?: string | null;
  official_name?: string | null;
  mask?: string | null;
  type?: string | null;
  subtype?: string | null;
  current_balance?: number | null;
  available_balance?: number | null;
  iso_currency_code?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ExpenseLedgerRow = Record<string, unknown>;
type FinancialLineRow = Record<string, unknown>;
type GrowthMarketingExpenseRow = Record<string, unknown>;
type ReferralRewardLiabilityRow = Record<string, unknown>;

type CategorySummary = {
  category: string;
  type: string;
  section: string;
  amount: number;
  count: number;
};

type ReportTransaction = {
  id: string;
  date: string;
  name: string;
  merchant: string;
  category: string;
  type: string;
  section: string;
  amount: number;
  bankStatus: string;
  reviewStatus: string;
  manuallyCategorized: boolean;
  source: "Plaid/NFCU" | "Manual" | "Growth/Referral";
};

type StatementLine = {
  id: string;
  label: string;
  section: string;
  sourceType: string;
  categoryMatch: string;
};

type PeriodWindow = {
  key: PeriodKey;
  label: string;
  comparisonLabel: string;
  start: Date | null;
  end: Date | null;
  previousStart: Date | null;
  previousEnd: Date | null;
};

type PeriodMetrics = {
  totalRevenue: number;
  totalExpenses: number;
  plaidExpenses: number;
  manualExpenses: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  netMargin: number;
  reportableTransactions: number;
  cashFlow: number;
};

type ProfitLossData = {
  accounts: PlaidAccountRow[];
  reportTransactions: PlaidTransactionRow[];
  needsReviewTransactions: PlaidTransactionRow[];
  excludedTransactions: PlaidTransactionRow[];
  nonProfitLossTransactions: PlaidTransactionRow[];
  manualExpenses: ExpenseLedgerRow[];
  growthMarketingExpenses: GrowthMarketingExpenseRow[];
  issuedReferralRewards: ReferralRewardLiabilityRow[];
  statementLines: StatementLine[];
  revenueByCategory: CategorySummary[];
  expenseByCategory: CategorySummary[];
  expenseBySection: CategorySummary[];
  recentReportTransactions: ReportTransaction[];
  recentNeedsReview: ReportTransaction[];
  recentManualExpenses: ReportTransaction[];
  recentGrowthExpenses: ReportTransaction[];
  period: PeriodWindow;
  previousMetrics: PeriodMetrics;
  totals: PeriodMetrics & {
    connectedAccounts: number;
    totalBankTransactions: number;
    needsReviewCount: number;
    excludedCount: number;
    nonProfitLossCount: number;
    manualExpenseCount: number;
    growthMarketingExpenseCount: number;
    issuedReferralRewardCount: number;
    growthMarketingExpenseTotal: number;
    issuedReferralRewardExpenseTotal: number;
    growthAndReferralExpenseTotal: number;
    customStatementLineCount: number;
    currentBalance: number;
    availableBalance: number;
    pendingCount: number;
    postedCount: number;
    manualCategorizedCount: number;
    autoCategorizedCount: number;
  };
};

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "weekly", label: "This Week" },
  { key: "monthly", label: "This Month" },
  { key: "quarterly", label: "This Quarter" },
  { key: "yearly", label: "This Year" },
  { key: "annual", label: "Annual" },
  { key: "all", label: "All Time" },
];

const STATEMENT_CATEGORY_PRESETS = [
  {
    section: "revenue",
    label: "Booking Revenue",
    sourceType: "plaid",
    categoryMatch: "Booking Revenue",
  },
  {
    section: "revenue",
    label: "Service Revenue",
    sourceType: "plaid",
    categoryMatch: "Service Revenue",
  },
  {
    section: "revenue",
    label: "Stripe Deposit",
    sourceType: "plaid",
    categoryMatch: "Stripe Deposit",
  },
  {
    section: "revenue",
    label: "Referral Income",
    sourceType: "plaid",
    categoryMatch: "Referral Income",
  },
  {
    section: "revenue",
    label: "Other Income",
    sourceType: "plaid",
    categoryMatch: "Other Income",
  },
  {
    section: "cost_of_revenue",
    label: "Guru Payouts",
    sourceType: "plaid",
    categoryMatch: "Guru Payouts",
  },
  {
    section: "operating_expenses",
    label: "Software / SaaS",
    sourceType: "plaid",
    categoryMatch: "Software / SaaS",
  },
  {
    section: "operating_expenses",
    label: "Marketing / Advertising",
    sourceType: "plaid",
    categoryMatch: "Marketing / Advertising",
  },
  {
    section: "operating_expenses",
    label: "Payment Processing Fees",
    sourceType: "plaid",
    categoryMatch: "Payment Processing Fees",
  },
  {
    section: "operating_expenses",
    label: "Bank Fees",
    sourceType: "plaid",
    categoryMatch: "Bank Fees",
  },
  {
    section: "operating_expenses",
    label: "Insurance",
    sourceType: "plaid",
    categoryMatch: "Insurance",
  },
  {
    section: "operating_expenses",
    label: "Office / Supplies",
    sourceType: "plaid",
    categoryMatch: "Office / Supplies",
  },
  {
    section: "operating_expenses",
    label: "Legal / Professional",
    sourceType: "plaid",
    categoryMatch: "Legal / Professional",
  },
  {
    section: "operating_expenses",
    label: "Taxes",
    sourceType: "plaid",
    categoryMatch: "Taxes",
  },
  {
    section: "operating_expenses",
    label: "Refunds",
    sourceType: "plaid",
    categoryMatch: "Refunds",
  },
  {
    section: "operating_expenses",
    label: "Other Expense",
    sourceType: "plaid",
    categoryMatch: "Other Expense",
  },
] as const;

const MANUAL_EXPENSE_CATEGORIES = [
  {
    value: "Software / SaaS",
    label: "Software / SaaS",
    section: "Operating Expenses",
  },
  {
    value: "Marketing / Advertising",
    label: "Marketing / Advertising",
    section: "Operating Expenses",
  },
  {
    value: "Marketing - Print",
    label: "Marketing - Print",
    section: "Operating Expenses",
  },
  {
    value: "Marketing - General",
    label: "Marketing - General",
    section: "Operating Expenses",
  },
  {
    value: "Referral Rewards",
    label: "Referral Rewards",
    section: "Sales & Marketing",
  },
  {
    value: "Referral Commissions",
    label: "Referral Commissions",
    section: "Sales & Marketing",
  },
  {
    value: "Payment Processing Fees",
    label: "Payment Processing Fees",
    section: "Operating Expenses",
  },
  {
    value: "Bank Fees",
    label: "Bank Fees",
    section: "Operating Expenses",
  },
  {
    value: "Insurance",
    label: "Insurance",
    section: "Operating Expenses",
  },
  {
    value: "Office / Supplies",
    label: "Office / Supplies",
    section: "Operating Expenses",
  },
  {
    value: "Legal / Professional",
    label: "Legal / Professional",
    section: "Operating Expenses",
  },
  {
    value: "Taxes",
    label: "Taxes",
    section: "Operating Expenses",
  },
  {
    value: "Guru Payouts",
    label: "Guru Payouts",
    section: "Cost of Services",
  },
  {
    value: "Ambassador Commissions",
    label: "Ambassador Commissions",
    section: "Sales & Marketing",
  },
  {
    value: "Refunds",
    label: "Refunds",
    section: "Refunds",
  },
  {
    value: "Other Expense",
    label: "Other Expense",
    section: "Operating Expenses",
  },
] as const;

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

function money(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.abs(value));

  return value < 0 ? `(${formatted})` : formatted;
}

function moneyExact(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(value));

  return value < 0 ? `(${formatted})` : formatted;
}

function percent(value: number) {
  if (!Number.isFinite(value)) return "0.0%";
  return `${value.toFixed(1)}%`;
}

function formatSignedPercent(value: number) {
  if (!Number.isFinite(value)) return "0.0%";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

function formatSignedNumber(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toLocaleString()}`;
}

function formatDateShort(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(23, 59, 59, 999);
  return next;
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(value: Date, months: number) {
  const next = new Date(value);
  next.setMonth(next.getMonth() + months);
  return next;
}

function addYears(value: Date, years: number) {
  const next = new Date(value);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function getPeriodKey(value?: string): PeriodKey {
  const normalized = String(value || "monthly").toLowerCase();

  if (
    normalized === "today" ||
    normalized === "weekly" ||
    normalized === "monthly" ||
    normalized === "quarterly" ||
    normalized === "yearly" ||
    normalized === "annual" ||
    normalized === "all"
  ) {
    return normalized;
  }

  return "monthly";
}

function getPeriodWindow(period: PeriodKey): PeriodWindow {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  if (period === "today") {
    const previousStart = addDays(todayStart, -1);
    const previousEnd = endOfDay(previousStart);

    return {
      key: period,
      label: "Today",
      comparisonLabel: "vs yesterday",
      start: todayStart,
      end: todayEnd,
      previousStart,
      previousEnd,
    };
  }

  if (period === "weekly") {
    const day = todayStart.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const start = addDays(todayStart, mondayOffset);
    const end = todayEnd;
    const previousStart = addDays(start, -7);
    const previousEnd = endOfDay(addDays(start, -1));

    return {
      key: period,
      label: "This Week",
      comparisonLabel: "vs previous week",
      start,
      end,
      previousStart,
      previousEnd,
    };
  }

  if (period === "monthly") {
    const start = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
    const end = todayEnd;
    const previousStart = addMonths(start, -1);
    const previousEnd = endOfDay(addDays(start, -1));

    return {
      key: period,
      label: "This Month",
      comparisonLabel: "vs previous month",
      start,
      end,
      previousStart,
      previousEnd,
    };
  }

  if (period === "quarterly") {
    const quarterStartMonth = Math.floor(todayStart.getMonth() / 3) * 3;
    const start = new Date(todayStart.getFullYear(), quarterStartMonth, 1);
    const end = todayEnd;
    const previousStart = addMonths(start, -3);
    const previousEnd = endOfDay(addDays(start, -1));

    return {
      key: period,
      label: "This Quarter",
      comparisonLabel: "vs previous quarter",
      start,
      end,
      previousStart,
      previousEnd,
    };
  }

  if (period === "yearly" || period === "annual") {
    const start = new Date(todayStart.getFullYear(), 0, 1);
    const end = todayEnd;
    const previousStart = addYears(start, -1);
    const previousEnd = endOfDay(addDays(start, -1));

    return {
      key: period,
      label: period === "annual" ? "Annual" : "This Year",
      comparisonLabel: "vs previous year",
      start,
      end,
      previousStart,
      previousEnd,
    };
  }

  return {
    key: "all",
    label: "All Time",
    comparisonLabel: "all available records",
    start: null,
    end: null,
    previousStart: null,
    previousEnd: null,
  };
}

function isWithinWindow(dateValue: string | null | undefined, window: PeriodWindow) {
  if (!window.start || !window.end) return true;
  if (!dateValue) return false;

  const parsed = new Date(dateValue);

  if (Number.isNaN(parsed.getTime())) return false;

  return parsed >= window.start && parsed <= window.end;
}

function isWithinPreviousWindow(
  dateValue: string | null | undefined,
  window: PeriodWindow,
) {
  if (!window.previousStart || !window.previousEnd) return false;
  if (!dateValue) return false;

  const parsed = new Date(dateValue);

  if (Number.isNaN(parsed.getTime())) return false;

  return parsed >= window.previousStart && parsed <= window.previousEnd;
}

function getChangePercent(current: number, previous: number) {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function hasFinancialRole(role: string) {
  return [
    "owner",
    "super_admin",
    "admin",
    "finance_admin",
    "finance",
    "accounting",
    "bookkeeper",
  ].includes(role.trim().toLowerCase());
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

async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const userEmail = (user.email || "").toLowerCase();
  const envAdminEmails = getEnvAdminEmails();

  const profileChecks = await Promise.allSettled([
    supabaseAdmin
      .from("admin_users")
      .select("role,email,is_active,can_access_financials")
      .eq("user_id", user.id)
      .limit(1),
    supabaseAdmin
      .from("profiles")
      .select("role,email,is_active,can_access_financials")
      .eq("id", user.id)
      .limit(1),
    supabaseAdmin
      .from("users")
      .select("role,email,is_active,can_access_financials")
      .eq("id", user.id)
      .limit(1),
  ]);

  const profile = (profileChecks
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => {
      if (result.status !== "fulfilled") return [];
      return Array.isArray(result.value.data) ? result.value.data : [];
    })
    .find(Boolean) || {}) as Record<string, unknown>;

  const role = asTrimmedString(profile.role) || "admin";
  const active =
    profile.is_active === undefined
      ? true
      : getOptionalBoolean(profile.is_active);
  const explicitFinanceAccess = getOptionalBoolean(
    profile.can_access_financials,
  );
  const envAllowed = envAdminEmails.includes(userEmail);
  const canAccessFinancials =
    active && (hasFinancialRole(role) || explicitFinanceAccess || envAllowed);

  return {
    id: user.id,
    email: userEmail,
    role,
    canAccessFinancials,
  };
}

async function requireFinancialAdminAction(action: string) {
  const identity = await getAdminIdentity();

  if (!identity?.canAccessFinancials) {
    console.warn(`Blocked financial admin action: ${action}`);
    return null;
  }

  return identity;
}

async function addStatementLine(formData: FormData) {
  "use server";

  const actor = await requireFinancialAdminAction("add_statement_line");

  if (!actor) return;

  const presetKey = String(formData.get("preset") || "").trim();
  const customLabel = String(formData.get("customLabel") || "").trim();

  const preset = STATEMENT_CATEGORY_PRESETS.find(
    (item) => `${item.section}:${item.categoryMatch}` === presetKey,
  );

  if (!preset) {
    revalidatePath("/admin/financials/profit-loss");
    return;
  }

  const label = customLabel || preset.label;

  const { data: existingRows } = await supabaseAdmin
    .from("financial_statement_lines")
    .select("id")
    .eq("section", preset.section)
    .eq("label", label)
    .eq("is_active", true)
    .limit(1);

  if (Array.isArray(existingRows) && existingRows.length > 0) {
    revalidatePath("/admin/financials/profit-loss");
    return;
  }

  await supabaseAdmin.from("financial_statement_lines").insert({
    section: preset.section,
    label,
    source_type: preset.sourceType,
    category_match: preset.categoryMatch,
    display_order: 100,
    is_active: true,
    created_at: new Date().toISOString(),
  });

  revalidatePath("/admin/financials/profit-loss");
}

async function deleteStatementLine(formData: FormData) {
  "use server";

  const actor = await requireFinancialAdminAction("delete_statement_line");

  if (!actor) return;

  const lineId = String(formData.get("lineId") || "").trim();

  if (!lineId) return;

  await supabaseAdmin
    .from("financial_statement_lines")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", lineId);

  revalidatePath("/admin/financials/profit-loss");
}

async function addManualExpense(formData: FormData) {
  "use server";

  const actor = await requireFinancialAdminAction("add_manual_expense");

  if (!actor) return;

  const name = String(formData.get("expenseName") || "").trim();
  const category = String(formData.get("expenseCategory") || "").trim();
  const amount = Number(formData.get("expenseAmount") || 0);
  const description = String(formData.get("expenseDescription") || "").trim();

  if (!name || !category || !Number.isFinite(amount) || amount <= 0) {
    revalidatePath("/admin/financials/profit-loss");
    return;
  }

  const selectedCategory =
    MANUAL_EXPENSE_CATEGORIES.find((item) => item.value === category) ||
    MANUAL_EXPENSE_CATEGORIES[MANUAL_EXPENSE_CATEGORIES.length - 1];

  await supabaseAdmin.from("expense_ledger").insert({
    name,
    description,
    category: selectedCategory.value,
    amount,
    source: "manual_admin",
    created_at: new Date().toISOString(),
  });

  revalidatePath("/admin/financials/profit-loss");
}

async function voidManualExpense(formData: FormData) {
  "use server";

  const actor = await requireFinancialAdminAction("void_manual_expense");

  if (!actor) return;

  const expenseId = String(formData.get("expenseId") || "").trim();

  if (!expenseId) return;

  const { error } = await supabaseAdmin
    .from("expense_ledger")
    .update({
      is_void: true,
      voided_at: new Date().toISOString(),
      voided_by: actor.id,
    })
    .eq("id", expenseId);

  if (error) {
    await supabaseAdmin
      .from("expense_ledger")
      .update({
        is_active: false,
      })
      .eq("id", expenseId);
  }

  revalidatePath("/admin/financials/profit-loss");
}

function isBusinessCheckingOrSavings(account: PlaidAccountRow) {
  const name = `${account.name || ""} ${account.official_name || ""}`.toLowerCase();
  const subtype = String(account.subtype || "").toLowerCase();

  return (
    (subtype === "checking" || subtype === "savings") &&
    name.includes("business")
  );
}

function getTransactionCategory(transaction: PlaidTransactionRow) {
  return asTrimmedString(transaction.sitguru_category) || "Uncategorized";
}

function getTransactionType(transaction: PlaidTransactionRow) {
  return (
    asTrimmedString(transaction.sitguru_category_type).toLowerCase() ||
    "uncategorized"
  );
}

function getTransactionSection(transaction: PlaidTransactionRow) {
  return asTrimmedString(transaction.sitguru_report_section) || "Needs Review";
}

function getReviewStatus(transaction: PlaidTransactionRow) {
  return asTrimmedString(transaction.review_status) || "needs_review";
}

function getBankStatus(transaction: PlaidTransactionRow) {
  return transaction.pending ? "Pending" : "Posted";
}

function isReviewedForReports(transaction: PlaidTransactionRow) {
  const reviewStatus = getReviewStatus(transaction);
  return reviewStatus === "reviewed" || reviewStatus === "auto_categorized";
}

function isProfitLossTransaction(transaction: PlaidTransactionRow) {
  const type = getTransactionType(transaction);

  return (
    !transaction.is_excluded_from_reports &&
    !transaction.removed_at &&
    isReviewedForReports(transaction) &&
    (type === "income" || type === "expense")
  );
}

function isNeedsReview(transaction: PlaidTransactionRow) {
  return (
    !transaction.is_excluded_from_reports &&
    !transaction.removed_at &&
    getReviewStatus(transaction) === "needs_review"
  );
}

function getProfitLossAmount(transaction: PlaidTransactionRow) {
  return Math.abs(toNumber(transaction.amount));
}

function getDisplayAmount(transaction: PlaidTransactionRow) {
  const amount = getProfitLossAmount(transaction);
  const type = getTransactionType(transaction);

  if (type === "income") return amount;
  if (type === "expense") return -amount;

  return amount;
}

function isArchivedExpense(row: ExpenseLedgerRow) {
  return Boolean(
    row.deleted_at ||
      row.voided_at ||
      row.archived_at ||
      row.is_deleted === true ||
      row.is_void === true ||
      row.is_active === false,
  );
}

function getManualExpenseName(row: ExpenseLedgerRow) {
  return (
    asTrimmedString(row.name) ||
    asTrimmedString(row.description) ||
    "Manual expense"
  );
}

function getManualExpenseCategory(row: ExpenseLedgerRow) {
  return asTrimmedString(row.category) || "Other Expense";
}

function getManualExpenseSection(row: ExpenseLedgerRow) {
  const category = getManualExpenseCategory(row);

  return (
    asTrimmedString(row.report_section) ||
    MANUAL_EXPENSE_CATEGORIES.find((item) => item.value === category)?.section ||
    "Operating Expenses"
  );
}

function getManualExpenseAmount(row: ExpenseLedgerRow) {
  return (
    toNumber(row.amount) ||
    toNumber(row.total_amount) ||
    toNumber(row.expense_amount) ||
    toNumber(row.cost)
  );
}

function getManualExpenseId(row: ExpenseLedgerRow, index: number) {
  return (
    asTrimmedString(row.id) ||
    asTrimmedString(row.expense_id) ||
    `${getManualExpenseName(row)}-${index}`
  );
}

function getManualExpenseDate(row: ExpenseLedgerRow) {
  return (
    asTrimmedString(row.created_at) ||
    asTrimmedString(row.date) ||
    asTrimmedString(row.expense_date)
  );
}

function isArchivedGrowthExpense(row: GrowthMarketingExpenseRow) {
  return Boolean(
    row.deleted_at ||
      row.removed_at ||
      row.voided_at ||
      row.archived_at ||
      row.is_deleted === true ||
      row.is_void === true ||
      row.is_active === false,
  );
}

function getGrowthExpenseId(row: GrowthMarketingExpenseRow, index: number) {
  return (
    asTrimmedString(row.id) ||
    asTrimmedString(row.campaign_id) ||
    `${getGrowthExpenseName(row)}-${index}`
  );
}

function getGrowthExpenseName(row: GrowthMarketingExpenseRow) {
  return (
    asTrimmedString(row.campaign_name) ||
    asTrimmedString(row.financial_category) ||
    "Growth campaign expense"
  );
}

function getGrowthExpenseCategory(row: GrowthMarketingExpenseRow) {
  const category = asTrimmedString(row.financial_category);

  if (category === "Marketing - Advertising") return "Marketing / Advertising";
  if (category) return category;

  return "Marketing - General";
}

function getGrowthExpenseSection(row: GrowthMarketingExpenseRow) {
  return asTrimmedString(row.financial_statement_section) || "Operating Expenses";
}

function getGrowthExpenseAmount(row: GrowthMarketingExpenseRow) {
  return (
    toNumber(row.amount) ||
    toNumber(row.total_amount) ||
    toNumber(row.marketing_spend) ||
    toNumber(row.ad_spend) ||
    toNumber(row.spend)
  );
}

function getGrowthExpenseDate(row: GrowthMarketingExpenseRow) {
  return (
    asTrimmedString(row.cost_date) ||
    asTrimmedString(row.created_at) ||
    asTrimmedString(row.updated_at)
  );
}

function isIssuedReferralReward(row: ReferralRewardLiabilityRow) {
  const treatment = asTrimmedString(row.financial_treatment).toLowerCase();
  const status = asTrimmedString(row.normalized_status).toLowerCase();

  return (
    treatment === "issued_reward_expense" ||
    ["paid", "credited", "issued", "complete", "completed"].includes(status)
  );
}

function getReferralRewardId(row: ReferralRewardLiabilityRow, index: number) {
  return (
    asTrimmedString(row.id) ||
    asTrimmedString(row.referral_code_id) ||
    asTrimmedString(row.reward_id) ||
    `${getReferralRewardName(row)}-${index}`
  );
}

function getReferralRewardName(row: ReferralRewardLiabilityRow) {
  return (
    asTrimmedString(row.financial_category) ||
    asTrimmedString(row.source) ||
    asTrimmedString(row.referral_source) ||
    "Issued referral reward"
  );
}

function getReferralRewardCategory(row: ReferralRewardLiabilityRow) {
  return asTrimmedString(row.financial_category) || "Referral Rewards";
}

function getReferralRewardSection(row: ReferralRewardLiabilityRow) {
  return "Sales & Marketing";
}

function getReferralRewardAmount(row: ReferralRewardLiabilityRow) {
  return (
    toNumber(row.normalized_amount) ||
    toNumber(row.reward_amount) ||
    toNumber(row.credit_amount) ||
    toNumber(row.payout_amount) ||
    toNumber(row.commission_amount) ||
    toNumber(row.amount)
  );
}

function getReferralRewardDate(row: ReferralRewardLiabilityRow) {
  return (
    asTrimmedString(row.created_at) ||
    asTrimmedString(row.updated_at) ||
    asTrimmedString(row.paid_at) ||
    asTrimmedString(row.issued_at)
  );
}

function groupTransactionsByCategory(transactions: PlaidTransactionRow[]) {
  const map = new Map<string, CategorySummary>();

  for (const transaction of transactions) {
    const category = getTransactionCategory(transaction);
    const type = getTransactionType(transaction);
    const section = getTransactionSection(transaction);
    const key = `${type}:${section}:${category}`;
    const current = map.get(key);

    if (current) {
      current.amount += getProfitLossAmount(transaction);
      current.count += 1;
    } else {
      map.set(key, {
        category,
        type,
        section,
        amount: getProfitLossAmount(transaction),
        count: 1,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

function groupManualExpensesByCategory(expenses: ExpenseLedgerRow[]) {
  const map = new Map<string, CategorySummary>();

  for (const expense of expenses) {
    const category = getManualExpenseCategory(expense);
    const section = getManualExpenseSection(expense);
    const key = `expense:${section}:${category}`;
    const amount = getManualExpenseAmount(expense);
    const current = map.get(key);

    if (current) {
      current.amount += amount;
      current.count += 1;
    } else {
      map.set(key, {
        category,
        type: "expense",
        section,
        amount,
        count: 1,
      });
    }
  }

  return Array.from(map.values());
}

function groupGrowthExpensesByCategory(
  marketingExpenses: GrowthMarketingExpenseRow[],
  issuedRewards: ReferralRewardLiabilityRow[],
) {
  const map = new Map<string, CategorySummary>();

  for (const expense of marketingExpenses) {
    const category = getGrowthExpenseCategory(expense);
    const section = getGrowthExpenseSection(expense);
    const key = `expense:${section}:${category}`;
    const amount = getGrowthExpenseAmount(expense);
    const current = map.get(key);

    if (current) {
      current.amount += amount;
      current.count += 1;
    } else {
      map.set(key, {
        category,
        type: "expense",
        section,
        amount,
        count: 1,
      });
    }
  }

  for (const reward of issuedRewards) {
    const category = getReferralRewardCategory(reward);
    const section = getReferralRewardSection(reward);
    const key = `expense:${section}:${category}`;
    const amount = getReferralRewardAmount(reward);
    const current = map.get(key);

    if (current) {
      current.amount += amount;
      current.count += 1;
    } else {
      map.set(key, {
        category,
        type: "expense",
        section,
        amount,
        count: 1,
      });
    }
  }

  return Array.from(map.values());
}

function mergeCategorySummaries(rows: CategorySummary[]) {
  const map = new Map<string, CategorySummary>();

  for (const row of rows) {
    const key = `${row.type}:${row.section}:${row.category}`;
    const current = map.get(key);

    if (current) {
      current.amount += row.amount;
      current.count += row.count;
    } else {
      map.set(key, { ...row });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

function groupExpensesBySection(rows: CategorySummary[]) {
  const map = new Map<string, CategorySummary>();

  for (const row of rows) {
    const key = `expense:${row.section}`;
    const current = map.get(key);

    if (current) {
      current.amount += row.amount;
      current.count += row.count;
    } else {
      map.set(key, {
        category: row.section,
        type: "expense",
        section: row.section,
        amount: row.amount,
        count: row.count,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

function toReportTransaction(transaction: PlaidTransactionRow): ReportTransaction {
  return {
    id: transaction.transaction_id || transaction.id,
    date: formatDateShort(transaction.date),
    name: asTrimmedString(transaction.name) || "Bank transaction",
    merchant: asTrimmedString(transaction.merchant_name) || "—",
    category: getTransactionCategory(transaction),
    type: getTransactionType(transaction),
    section: getTransactionSection(transaction),
    amount: getDisplayAmount(transaction),
    bankStatus: getBankStatus(transaction),
    reviewStatus: getReviewStatus(transaction),
    manuallyCategorized: Boolean(transaction.manually_categorized),
    source: "Plaid/NFCU",
  };
}

function toManualExpenseTransaction(
  expense: ExpenseLedgerRow,
  index: number,
): ReportTransaction {
  return {
    id: getManualExpenseId(expense, index),
    date: formatDateShort(getManualExpenseDate(expense)),
    name: getManualExpenseName(expense),
    merchant: "Manual entry",
    category: getManualExpenseCategory(expense),
    type: "expense",
    section: getManualExpenseSection(expense),
    amount: -Math.abs(getManualExpenseAmount(expense)),
    bankStatus: "Manual",
    reviewStatus: "reviewed",
    manuallyCategorized: true,
    source: "Manual",
  };
}

function toGrowthMarketingExpenseTransaction(
  expense: GrowthMarketingExpenseRow,
  index: number,
): ReportTransaction {
  return {
    id: getGrowthExpenseId(expense, index),
    date: formatDateShort(getGrowthExpenseDate(expense)),
    name: getGrowthExpenseName(expense),
    merchant: asTrimmedString(expense.vendor) || "Growth campaign",
    category: getGrowthExpenseCategory(expense),
    type: "expense",
    section: getGrowthExpenseSection(expense),
    amount: -Math.abs(getGrowthExpenseAmount(expense)),
    bankStatus: "Supabase View",
    reviewStatus: "reviewed",
    manuallyCategorized: true,
    source: "Growth/Referral",
  };
}

function toIssuedReferralRewardTransaction(
  reward: ReferralRewardLiabilityRow,
  index: number,
): ReportTransaction {
  return {
    id: getReferralRewardId(reward, index),
    date: formatDateShort(getReferralRewardDate(reward)),
    name: getReferralRewardName(reward),
    merchant: "Issued referral reward",
    category: getReferralRewardCategory(reward),
    type: "expense",
    section: getReferralRewardSection(reward),
    amount: -Math.abs(getReferralRewardAmount(reward)),
    bankStatus: "Supabase View",
    reviewStatus: "reviewed",
    manuallyCategorized: true,
    source: "Growth/Referral",
  };
}

function getBarWidth(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.max(4, Math.min(100, (Math.abs(value) / max) * 100));
}

function normalizeStatementLine(row: FinancialLineRow): StatementLine {
  return {
    id: asTrimmedString(row.id),
    label: asTrimmedString(row.label) || "Statement category",
    section: asTrimmedString(row.section) || "operating_expenses",
    sourceType: asTrimmedString(row.source_type) || "manual",
    categoryMatch: asTrimmedString(row.category_match),
  };
}

function calculatePeriodMetrics({
  reportTransactions,
  manualExpenses,
  growthMarketingExpenses = [],
  issuedReferralRewards = [],
}: {
  reportTransactions: PlaidTransactionRow[];
  manualExpenses: ExpenseLedgerRow[];
  growthMarketingExpenses?: GrowthMarketingExpenseRow[];
  issuedReferralRewards?: ReferralRewardLiabilityRow[];
}): PeriodMetrics {
  const incomeTransactions = reportTransactions.filter(
    (transaction) => getTransactionType(transaction) === "income",
  );

  const expenseTransactions = reportTransactions.filter(
    (transaction) => getTransactionType(transaction) === "expense",
  );

  const totalRevenue = incomeTransactions.reduce(
    (sum, transaction) => sum + getProfitLossAmount(transaction),
    0,
  );

  const plaidExpenses = expenseTransactions.reduce(
    (sum, transaction) => sum + getProfitLossAmount(transaction),
    0,
  );

  const manualExpenseTotal = manualExpenses.reduce(
    (sum, expense) => sum + getManualExpenseAmount(expense),
    0,
  );

  const growthMarketingExpenseTotal = growthMarketingExpenses.reduce(
    (sum, expense) => sum + getGrowthExpenseAmount(expense),
    0,
  );

  const issuedReferralRewardExpenseTotal = issuedReferralRewards.reduce(
    (sum, reward) => sum + getReferralRewardAmount(reward),
    0,
  );

  const totalExpenses =
    plaidExpenses +
    manualExpenseTotal +
    growthMarketingExpenseTotal +
    issuedReferralRewardExpenseTotal;
  const netIncome = totalRevenue - totalExpenses;

  return {
    totalRevenue,
    totalExpenses,
    plaidExpenses,
    manualExpenses: manualExpenseTotal,
    grossProfit: netIncome,
    operatingIncome: netIncome,
    netIncome,
    netMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0,
    reportableTransactions: reportTransactions.length + manualExpenses.length,
    cashFlow: netIncome,
  };
}

async function getProfitLossData(periodKey: PeriodKey): Promise<ProfitLossData> {
  const period = getPeriodWindow(periodKey);

  const [
    accountsResult,
    transactionsResult,
    expensesResult,
    statementLinesResult,
    growthMarketingExpensesResult,
    referralRewardLiabilityResult,
  ] = await Promise.all([
      supabaseAdmin
        .from("admin_plaid_accounts")
        .select(
          "id, account_id, item_id, name, official_name, mask, type, subtype, current_balance, available_balance, iso_currency_code, created_at, updated_at",
        )
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("admin_plaid_transactions")
        .select(
          "id, transaction_id, item_id, account_id, name, merchant_name, amount, iso_currency_code, date, pending, payment_channel, sitguru_category, sitguru_category_type, sitguru_report_section, sitguru_notes, review_status, is_excluded_from_reports, manually_categorized, removed_at, created_at, updated_at",
        )
        .is("removed_at", null)
        .order("date", { ascending: false })
        .limit(5000),
      supabaseAdmin
        .from("expense_ledger")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2500),
      supabaseAdmin
        .from("financial_statement_lines")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(500),
      supabaseAdmin
        .from("admin_growth_marketing_expenses")
        .select("*")
        .order("cost_date", { ascending: false })
        .limit(2500),
      supabaseAdmin
        .from("admin_referral_reward_liability")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2500),
    ]);

  if (accountsResult.error) {
    console.warn("Profit & Loss Plaid accounts query skipped:", accountsResult.error);
  }

  if (transactionsResult.error) {
    console.warn(
      "Profit & Loss Plaid transactions query skipped:",
      transactionsResult.error,
    );
  }

  if (expensesResult.error) {
    console.warn("Profit & Loss manual expense query skipped:", expensesResult.error);
  }

  if (statementLinesResult.error) {
    console.warn(
      "Profit & Loss statement line query skipped:",
      statementLinesResult.error,
    );
  }

  if (growthMarketingExpensesResult.error) {
    console.warn(
      "Profit & Loss growth marketing expense query skipped:",
      growthMarketingExpensesResult.error,
    );
  }

  if (referralRewardLiabilityResult.error) {
    console.warn(
      "Profit & Loss referral reward liability query skipped:",
      referralRewardLiabilityResult.error,
    );
  }

  const accounts = ((accountsResult.data || []) as PlaidAccountRow[]).filter(
    isBusinessCheckingOrSavings,
  );

  const allowedAccountIds = new Set(accounts.map((account) => account.account_id));

  const allTransactions = ((transactionsResult.data || []) as PlaidTransactionRow[])
    .filter((transaction) => allowedAccountIds.has(transaction.account_id))
    .filter((transaction) => !transaction.removed_at);

  const allManualExpenses = ((expensesResult.data || []) as ExpenseLedgerRow[]).filter(
    (row) => !isArchivedExpense(row),
  );

  const allGrowthMarketingExpenses = (
    (growthMarketingExpensesResult.data || []) as GrowthMarketingExpenseRow[]
  ).filter((row) => !isArchivedGrowthExpense(row));

  const allIssuedReferralRewards = (
    (referralRewardLiabilityResult.data || []) as ReferralRewardLiabilityRow[]
  ).filter(isIssuedReferralReward);

  const statementLines = ((statementLinesResult.data || []) as FinancialLineRow[])
    .map(normalizeStatementLine)
    .filter((line) => line.id);

  const filteredTransactions = allTransactions.filter((transaction) =>
    isWithinWindow(transaction.date, period),
  );

  const filteredManualExpenses = allManualExpenses.filter((expense) =>
    isWithinWindow(getManualExpenseDate(expense), period),
  );

  const filteredGrowthMarketingExpenses = allGrowthMarketingExpenses.filter((expense) =>
    isWithinWindow(getGrowthExpenseDate(expense), period),
  );

  const filteredIssuedReferralRewards = allIssuedReferralRewards.filter((reward) =>
    isWithinWindow(getReferralRewardDate(reward), period),
  );

  const previousTransactions = allTransactions.filter((transaction) =>
    isWithinPreviousWindow(transaction.date, period),
  );

  const previousManualExpenses = allManualExpenses.filter((expense) =>
    isWithinPreviousWindow(getManualExpenseDate(expense), period),
  );

  const previousGrowthMarketingExpenses = allGrowthMarketingExpenses.filter((expense) =>
    isWithinPreviousWindow(getGrowthExpenseDate(expense), period),
  );

  const previousIssuedReferralRewards = allIssuedReferralRewards.filter((reward) =>
    isWithinPreviousWindow(getReferralRewardDate(reward), period),
  );

  const reportTransactions = filteredTransactions.filter(isProfitLossTransaction);
  const needsReviewTransactions = filteredTransactions.filter(isNeedsReview);
  const excludedTransactions = filteredTransactions.filter((transaction) =>
    Boolean(transaction.is_excluded_from_reports),
  );

  const previousReportTransactions =
    previousTransactions.filter(isProfitLossTransaction);

  const nonProfitLossTransactions = filteredTransactions.filter((transaction) => {
    const type = getTransactionType(transaction);

    return (
      !transaction.is_excluded_from_reports &&
      !transaction.removed_at &&
      isReviewedForReports(transaction) &&
      !["income", "expense"].includes(type)
    );
  });

  const incomeTransactions = reportTransactions.filter(
    (transaction) => getTransactionType(transaction) === "income",
  );

  const expenseTransactions = reportTransactions.filter(
    (transaction) => getTransactionType(transaction) === "expense",
  );

  const revenueByCategory = groupTransactionsByCategory(incomeTransactions);
  const plaidExpenseByCategory = groupTransactionsByCategory(expenseTransactions);
  const manualExpenseByCategory = groupManualExpensesByCategory(filteredManualExpenses);
  const growthExpenseByCategory = groupGrowthExpensesByCategory(
    filteredGrowthMarketingExpenses,
    filteredIssuedReferralRewards,
  );
  const expenseByCategory = mergeCategorySummaries([
    ...plaidExpenseByCategory,
    ...manualExpenseByCategory,
    ...growthExpenseByCategory,
  ]);
  const expenseBySection = groupExpensesBySection(expenseByCategory);

  const periodMetrics = calculatePeriodMetrics({
    reportTransactions,
    manualExpenses: filteredManualExpenses,
    growthMarketingExpenses: filteredGrowthMarketingExpenses,
    issuedReferralRewards: filteredIssuedReferralRewards,
  });

  const previousMetrics = calculatePeriodMetrics({
    reportTransactions: previousReportTransactions,
    manualExpenses: previousManualExpenses,
    growthMarketingExpenses: previousGrowthMarketingExpenses,
    issuedReferralRewards: previousIssuedReferralRewards,
  });

  const currentBalance = accounts.reduce(
    (sum, account) => sum + toNumber(account.current_balance),
    0,
  );

  const availableBalance = accounts.reduce(
    (sum, account) => sum + toNumber(account.available_balance),
    0,
  );

  const pendingCount = filteredTransactions.filter(
    (transaction) => transaction.pending,
  ).length;

  const postedCount = filteredTransactions.length - pendingCount;

  const manualCategorizedCount = filteredTransactions.filter(
    (transaction) => transaction.manually_categorized,
  ).length;

  const autoCategorizedCount = filteredTransactions.filter(
    (transaction) => getReviewStatus(transaction) === "auto_categorized",
  ).length;

  const recentPlaidReportTransactions = reportTransactions
    .slice(0, 10)
    .map(toReportTransaction);

  const recentManualExpenses = filteredManualExpenses
    .slice(0, 10)
    .map(toManualExpenseTransaction);

  const recentGrowthMarketingExpenses = filteredGrowthMarketingExpenses
    .slice(0, 10)
    .map(toGrowthMarketingExpenseTransaction);

  const recentIssuedReferralRewards = filteredIssuedReferralRewards
    .slice(0, 10)
    .map(toIssuedReferralRewardTransaction);

  const recentGrowthExpenses = [
    ...recentGrowthMarketingExpenses,
    ...recentIssuedReferralRewards,
  ].slice(0, 16);

  const recentReportTransactions = [
    ...recentPlaidReportTransactions,
    ...recentManualExpenses,
    ...recentGrowthExpenses,
  ].slice(0, 16);

  return {
    accounts,
    reportTransactions,
    needsReviewTransactions,
    excludedTransactions,
    nonProfitLossTransactions,
    manualExpenses: filteredManualExpenses,
    growthMarketingExpenses: filteredGrowthMarketingExpenses,
    issuedReferralRewards: filteredIssuedReferralRewards,
    statementLines,
    revenueByCategory,
    expenseByCategory,
    expenseBySection,
    recentReportTransactions,
    recentNeedsReview: needsReviewTransactions
      .slice(0, 8)
      .map(toReportTransaction),
    recentManualExpenses,
    recentGrowthExpenses,
    period,
    previousMetrics,
    totals: {
      connectedAccounts: accounts.length,
      totalBankTransactions: filteredTransactions.length,
      reportableTransactions: periodMetrics.reportableTransactions,
      needsReviewCount: needsReviewTransactions.length,
      excludedCount: excludedTransactions.length,
      nonProfitLossCount: nonProfitLossTransactions.length,
      manualExpenseCount: filteredManualExpenses.length,
      growthMarketingExpenseCount: filteredGrowthMarketingExpenses.length,
      issuedReferralRewardCount: filteredIssuedReferralRewards.length,
      growthMarketingExpenseTotal: filteredGrowthMarketingExpenses.reduce(
        (sum, expense) => sum + getGrowthExpenseAmount(expense),
        0,
      ),
      issuedReferralRewardExpenseTotal: filteredIssuedReferralRewards.reduce(
        (sum, reward) => sum + getReferralRewardAmount(reward),
        0,
      ),
      growthAndReferralExpenseTotal:
        filteredGrowthMarketingExpenses.reduce(
          (sum, expense) => sum + getGrowthExpenseAmount(expense),
          0,
        ) +
        filteredIssuedReferralRewards.reduce(
          (sum, reward) => sum + getReferralRewardAmount(reward),
          0,
        ),
      customStatementLineCount: statementLines.length,
      totalRevenue: periodMetrics.totalRevenue,
      plaidExpenses: periodMetrics.plaidExpenses,
      manualExpenses: periodMetrics.manualExpenses,
      totalExpenses: periodMetrics.totalExpenses,
      grossProfit: periodMetrics.grossProfit,
      operatingIncome: periodMetrics.operatingIncome,
      netIncome: periodMetrics.netIncome,
      netMargin: periodMetrics.netMargin,
      cashFlow: periodMetrics.cashFlow,
      currentBalance,
      availableBalance,
      pendingCount,
      postedCount,
      manualCategorizedCount,
      autoCategorizedCount,
    },
  };
}

function getMetricChange(current: number, previous: number, mode: "money" | "number") {
  const diff = current - previous;
  const pct = getChangePercent(current, previous);
  const diffLabel = mode === "money" ? moneyExact(diff) : formatSignedNumber(diff);

  return `${diffLabel} / ${formatSignedPercent(pct)}`;
}

function StatCard({
  label,
  value,
  detail,
  change,
  comparisonLabel,
  tone = "emerald",
}: {
  label: string;
  value: string;
  detail: string;
  change?: string;
  comparisonLabel?: string;
  tone?: "emerald" | "sky" | "violet" | "amber" | "rose" | "slate";
}) {
  const toneClass = {
    emerald: "border-emerald-100 bg-emerald-50",
    sky: "border-sky-100 bg-sky-50",
    violet: "border-violet-100 bg-violet-50",
    amber: "border-amber-100 bg-amber-50",
    rose: "border-rose-100 bg-rose-50",
    slate: "border-slate-100 bg-slate-50",
  }[tone];

  return (
    <div className={`rounded-[1.5rem] border p-5 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      {change ? (
        <p className="mt-2 text-sm font-black text-slate-950">{change}</p>
      ) : null}
      {comparisonLabel ? (
        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
          {comparisonLabel}
        </p>
      ) : null}
      <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
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
        className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-700/10 transition hover:bg-emerald-800"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:border-emerald-200 hover:bg-emerald-50"
    >
      {label}
    </Link>
  );
}

function PeriodSelector({ currentPeriod }: { currentPeriod: PeriodKey }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PERIOD_OPTIONS.map((period) => (
        <Link
          key={period.key}
          href={`/admin/financials/profit-loss?period=${period.key}`}
          className={
            currentPeriod === period.key
              ? "rounded-full bg-emerald-700 px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-sm"
              : "rounded-full border border-emerald-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-emerald-800 transition hover:bg-emerald-50"
          }
        >
          {period.label}
        </Link>
      ))}
    </div>
  );
}

function SummaryBar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-sm font-bold text-slate-950">{label}</p>
        <p className="text-sm font-bold text-slate-950">{money(value)}</p>
      </div>

      <div className="h-3 rounded-full bg-slate-100">
        <div
          className={`h-3 rounded-full ${tone}`}
          style={{ width: `${getBarWidth(value, max)}%` }}
        />
      </div>
    </div>
  );
}

function CategoryBreakdown({
  title,
  description,
  rows,
  emptyMessage,
}: {
  title: string;
  description: string;
  rows: CategorySummary[];
  emptyMessage: string;
}) {
  const max = Math.max(...rows.map((row) => row.amount), 1);
  const tones = [
    "bg-emerald-400",
    "bg-sky-400",
    "bg-violet-400",
    "bg-amber-400",
    "bg-rose-400",
    "bg-blue-400",
  ];

  return (
    <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
        {title}
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        Category breakdown
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>

      <div className="mt-6 space-y-5">
        {rows.length ? (
          rows.map((row, index) => (
            <div key={`${row.type}-${row.section}-${row.category}`}>
              <div className="mb-2 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-950">
                    {row.category}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    {row.section} · {row.count} transaction
                    {row.count === 1 ? "" : "s"}
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-950">
                  {money(row.amount)}
                </p>
              </div>

              <div className="h-3 rounded-full bg-slate-100">
                <div
                  className={`h-3 rounded-full ${tones[index % tones.length]}`}
                  style={{
                    width: `${getBarWidth(row.amount, max)}%`,
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionsTable({
  title,
  eyebrow,
  description,
  rows,
  emptyMessage,
  showVoidAction = false,
}: {
  title: string;
  eyebrow: string;
  description: string;
  rows: ReportTransaction[];
  emptyMessage: string;
  showVoidAction?: boolean;
}) {
  return (
    <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>

        <ActionLink href="/admin/financials/plaid" label="Review Banking" />
      </div>

      <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-100">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                  Date
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                  Transaction
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                  Source
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                  Category
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                  Section
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                  Bank Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em]">
                  Amount
                </th>
                {showVoidAction ? (
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em]">
                    Action
                  </th>
                ) : null}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.length ? (
                rows.map((transaction) => (
                  <tr key={transaction.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-4 font-semibold text-slate-600">
                      {transaction.date}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-black text-slate-950">
                        {transaction.name}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {transaction.merchant}
                      </p>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-600">
                      {transaction.source}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={
                          transaction.reviewStatus === "needs_review"
                            ? "rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800"
                            : transaction.manuallyCategorized
                              ? "rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-800"
                              : "rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800"
                        }
                      >
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-600">
                      {transaction.section}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={
                          transaction.bankStatus === "Pending"
                            ? "rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800"
                            : transaction.bankStatus === "Manual"
                              ? "rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700"
                              : "rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800"
                        }
                      >
                        {transaction.bankStatus}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-4 text-right font-black ${
                        transaction.amount < 0 ? "text-rose-700" : "text-slate-950"
                      }`}
                    >
                      {moneyExact(transaction.amount)}
                    </td>
                    {showVoidAction ? (
                      <td className="px-4 py-4 text-right">
                        <form action={voidManualExpense}>
                          <input
                            type="hidden"
                            name="expenseId"
                            value={transaction.id}
                          />
                          <button
                            type="submit"
                            className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                          >
                            Void
                          </button>
                        </form>
                      </td>
                    ) : null}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={showVoidAction ? 8 : 7}
                    className="px-4 py-8 text-center text-slate-600"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AccountingReadinessPanel({ pnl }: { pnl: ProfitLossData }) {
  const items = [
    {
      label: "NFCU Business Accounts",
      status: pnl.totals.connectedAccounts >= 2 ? "ready" : "needs_review",
      detail:
        pnl.totals.connectedAccounts >= 2
          ? `${pnl.totals.connectedAccounts} business accounts are connected for balance and cash activity.`
          : "Connect both NFCU Business Checking and Business Savings for complete cash visibility.",
    },
    {
      label: "Selected Period Activity",
      status: pnl.totals.reportableTransactions ? "ready" : "needs_review",
      detail: `${pnl.totals.reportableTransactions} reportable transactions are included for ${pnl.period.label}.`,
    },
    {
      label: "Manual Operating Expenses",
      status: pnl.totals.manualExpenseCount ? "ready" : "needs_review",
      detail: `${pnl.totals.manualExpenseCount} manual operating expense rows are included in this period.`,
    },
    {
      label: "Growth & Referral Expenses",
      status:
        pnl.totals.growthMarketingExpenseCount ||
        pnl.totals.issuedReferralRewardCount
          ? "ready"
          : "needs_review",
      detail: `${pnl.totals.growthMarketingExpenseCount} campaign cost rows and ${pnl.totals.issuedReferralRewardCount} issued referral reward rows are included from Supabase financial views.`,
    },
    {
      label: "Needs Review Queue",
      status: pnl.totals.needsReviewCount ? "needs_review" : "ready",
      detail: pnl.totals.needsReviewCount
        ? `${pnl.totals.needsReviewCount} transactions need manual categorization before they affect reports.`
        : "All active bank transactions are categorized or intentionally excluded for this period.",
    },
    {
      label: "Bank Status",
      status: pnl.totals.pendingCount ? "needs_review" : "ready",
      detail: `${pnl.totals.postedCount} posted and ${pnl.totals.pendingCount} pending transactions are visible for this period.`,
    },
    {
      label: "Custom P&L Categories",
      status: pnl.totals.customStatementLineCount ? "ready" : "needs_review",
      detail: `${pnl.totals.customStatementLineCount} active custom statement categories are configured.`,
    },
  ] as const;

  const classes = {
    ready: "border-emerald-100 bg-emerald-50 text-emerald-800",
    needs_review: "border-amber-100 bg-amber-50 text-amber-800",
  };

  const readyCount = items.filter((item) => item.status === "ready").length;

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Plaid / Manual P&L Readiness
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Report wiring checks
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            These checks confirm whether categorized NFCU activity, manual
            operating expenses, and custom P&L categories are ready for the
            selected period.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
          {readyCount}/{items.length} ready
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`rounded-xl border p-4 ${classes[item.status]}`}
          >
            <p className="text-xs font-black uppercase tracking-[0.16em] opacity-80">
              {item.status.replace("_", " ")}
            </p>
            <h3 className="mt-2 text-base font-black text-slate-950">
              {item.label}
            </h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              {item.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function IntegrationFlowPanel() {
  const steps = [
    "Plaid sync pulls NFCU Business Checking and Savings transactions.",
    "SitGuru auto-categorizes common bank transactions into report categories.",
    "Admin reviews and manually categorizes anything in Needs Review.",
    "Growth campaign costs and issued referral rewards flow from Supabase financial views into operating expenses.",
    "Manual P&L categories and real operating expenses can be added as backup.",
    "Period filters show daily, weekly, monthly, quarterly, yearly, annual, or all-time performance.",
  ];

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
        Bank Feed + Manual Controls
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        How SitGuru turns activity into P&L reports
      </h2>
      <div className="mt-6 grid gap-3 lg:grid-cols-5">
        {steps.map((step, index) => (
          <div
            key={step}
            className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-sm font-black text-white">
              {index + 1}
            </span>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
              {step}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatementSection({
  title,
  rows,
  totalLabel,
  totalValue,
}: {
  title: string;
  rows: CategorySummary[];
  totalLabel: string;
  totalValue: number;
}) {
  return (
    <div>
      <div className="border-y border-emerald-100 bg-emerald-50/80 px-4 py-3">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
          {title}
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {rows.length ? (
          rows.map((row) => (
            <div
              key={`${row.type}-${row.section}-${row.category}`}
              className="grid gap-3 px-4 py-4 text-slate-600 sm:grid-cols-[minmax(0,1fr)_140px] sm:items-center"
            >
              <div className="min-w-0">
                <p className="font-bold leading-tight text-slate-950">
                  {row.category}
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  {row.section} · {row.count} transaction
                  {row.count === 1 ? "" : "s"}
                </p>
              </div>

              <p className="text-right text-sm font-black tabular-nums text-slate-950 sm:text-base">
                {money(row.amount)}
              </p>
            </div>
          ))
        ) : (
          <div className="px-4 py-4 text-sm text-slate-500">
            No reviewed reportable rows in this section yet.
          </div>
        )}

        <div className="grid grid-cols-[1fr_auto] gap-4 bg-slate-50 px-4 py-3 font-black text-slate-950">
          <p>{totalLabel}</p>
          <p className={totalValue < 0 ? "text-rose-700" : "text-slate-950"}>
            {money(totalValue)}
          </p>
        </div>
      </div>
    </div>
  );
}

function GrowthReferralFinancialsPanel({ pnl }: { pnl: ProfitLossData }) {
  const rows = [
    {
      label: "Campaign Costs",
      value: pnl.totals.growthMarketingExpenseTotal,
      detail: `${pnl.totals.growthMarketingExpenseCount} marketing / advertising / print rows`,
      tone: "border-emerald-100 bg-emerald-50 text-emerald-800",
    },
    {
      label: "Issued Referral Rewards",
      value: pnl.totals.issuedReferralRewardExpenseTotal,
      detail: `${pnl.totals.issuedReferralRewardCount} issued, credited, paid, or completed reward rows`,
      tone: "border-blue-100 bg-blue-50 text-blue-800",
    },
    {
      label: "P&L Growth Expense",
      value: pnl.totals.growthAndReferralExpenseTotal,
      detail: "Included in Total Expenses and Net Income / Loss",
      tone: "border-amber-100 bg-amber-50 text-amber-800",
    },
  ];

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Growth / Referrals / P&amp;L
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Marketing costs and issued rewards now feed Profit &amp; Loss.
          </h2>
          <p className="mt-2 max-w-5xl text-sm leading-6 text-slate-600">
            Campaign costs from <span className="font-black">admin_growth_marketing_expenses</span> and issued referral reward expenses from <span className="font-black">admin_referral_reward_liability</span> are included as operating expenses for the selected period. Pending reward liability stays off the P&amp;L until issued, credited, or paid.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ActionLink href="/admin/referrals" label="Open Growth & Referrals" primary />
          <ActionLink href="/admin/financials" label="Financial Overview" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className={`rounded-[1.5rem] border p-5 ${row.tone}`}>
            <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80">
              {row.label}
            </p>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              {money(row.value)}
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              {row.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-100">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-600">
            Recent growth/referral rows included in P&amp;L
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white text-slate-600">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">Date</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">Item</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">Category</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">Section</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em]">Amount</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {pnl.recentGrowthExpenses.length ? (
                pnl.recentGrowthExpenses.map((transaction) => (
                  <tr key={transaction.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-4 font-semibold text-slate-600">{transaction.date}</td>
                    <td className="px-4 py-4">
                      <p className="font-black text-slate-950">{transaction.name}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{transaction.merchant}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-600">{transaction.section}</td>
                    <td className="px-4 py-4 text-right font-black text-rose-700">{moneyExact(transaction.amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-600">
                    No campaign costs or issued referral rewards are included in this selected P&amp;L period yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ManualControlsPanel({ pnl }: { pnl: ProfitLossData }) {
  return (
    <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
      <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Add P&L Category
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Add manual statement categories.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use this when you need a new P&L line available for reports, CPA
              review, or future category mapping.
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-[#fbfefd] px-4 py-3 text-sm font-bold text-slate-600">
            {pnl.totals.customStatementLineCount > 0
              ? `${pnl.totals.customStatementLineCount} active custom categories`
              : "No custom categories yet"}
          </div>
        </div>

        <form
          action={addStatementLine}
          className="mt-6 grid gap-4 2xl:grid-cols-[1fr_1fr_auto]"
        >
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Category Preset
            </label>
            <select
              name="preset"
              className="mt-2 w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              defaultValue=""
              required
            >
              <option value="" disabled>
                Choose category...
              </option>
              {STATEMENT_CATEGORY_PRESETS.map((item) => (
                <option
                  key={`${item.section}:${item.categoryMatch}`}
                  value={`${item.section}:${item.categoryMatch}`}
                >
                  {item.section.replaceAll("_", " ")} — {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Optional Custom Name
            </label>
            <input
              name="customLabel"
              type="text"
              placeholder="Example: Domains, Hosting, Photos..."
              className="mt-2 w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/10 transition hover:bg-emerald-800 xl:self-end"
          >
            Add Category
          </button>
        </form>

        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-100">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                    Label
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                    Section
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                    Match
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {pnl.statementLines.length ? (
                  pnl.statementLines.map((line) => (
                    <tr key={line.id}>
                      <td className="px-4 py-4 font-black text-slate-950">
                        {line.label}
                      </td>
                      <td className="px-4 py-4 font-semibold capitalize text-slate-600">
                        {line.section.replaceAll("_", " ")}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-600">
                        {line.categoryMatch || "—"}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <form action={deleteStatementLine}>
                          <input type="hidden" name="lineId" value={line.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                          >
                            Deactivate
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-slate-600"
                    >
                      No custom P&L categories have been added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
          Add Real Operating Expense
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
          Add expenses manually when needed.
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use this for expenses that do not come through Plaid yet, cleanup
          entries, CPA adjustments, or one-off admin costs.
        </p>

        <form action={addManualExpense} className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Expense Name
              </label>
              <input
                name="expenseName"
                type="text"
                placeholder="Example: GoDaddy renewal"
                className="mt-2 w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Amount
              </label>
              <input
                name="expenseAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="mt-2 w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr_auto]">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Category
              </label>
              <select
                name="expenseCategory"
                defaultValue=""
                className="mt-2 w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                required
              >
                <option value="" disabled>
                  Choose category...
                </option>
                {MANUAL_EXPENSE_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Optional Note
              </label>
              <input
                name="expenseDescription"
                type="text"
                placeholder="Optional detail"
                className="mt-2 w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/10 transition hover:bg-emerald-800 sm:self-end"
            >
              Add Expense
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default async function AdminProfitLossPage({
  searchParams,
}: AdminProfitLossPageProps) {
  const params = await searchParams;
  const selectedPeriod = getPeriodKey(params?.period);
  const actor = await getAdminIdentity();

  if (!actor?.canAccessFinancials) {
    return (
      <div className="min-h-screen bg-[#f7fbf8] px-6 py-10 text-slate-950">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-100 bg-white p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-700">
            Access Restricted
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
            Financial access required.
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Sign in with a finance-enabled admin account to view SitGuru Profit
            & Loss reports.
          </p>
        </div>
      </div>
    );
  }

  const pnl = await getProfitLossData(selectedPeriod);

  const maxVisualValue = Math.max(
    pnl.totals.totalRevenue,
    pnl.totals.totalExpenses,
    Math.abs(pnl.totals.netIncome),
    1,
  );

  const visualRows = [
    {
      label: "Revenue",
      value: pnl.totals.totalRevenue,
      detail: `${pnl.revenueByCategory.length} revenue categories`,
      tone: "bg-emerald-400",
    },
    {
      label: "Expenses",
      value: pnl.totals.totalExpenses,
      detail: `${pnl.expenseByCategory.length} expense categories`,
      tone: "bg-amber-400",
    },
    {
      label: pnl.totals.netIncome >= 0 ? "Net Income" : "Net Loss",
      value: Math.abs(pnl.totals.netIncome),
      detail: `${percent(pnl.totals.netMargin)} net margin`,
      tone: pnl.totals.netIncome >= 0 ? "bg-violet-400" : "bg-rose-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7fbf8] px-3 py-4 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1640px] space-y-5 sm:space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(420px,680px)] 2xl:items-start">
            <div className="max-w-5xl self-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                Admin / Financials / Profit & Loss
              </p>

              <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                SitGuru Profit & Loss by period.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                View daily, weekly, monthly, quarterly, yearly, annual, or
                all-time Profit & Loss using categorized NFCU transactions plus
                manual operating expenses.
              </p>

              <div className="mt-5">
                <PeriodSelector currentPeriod={pnl.period.key} />
              </div>

              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-black text-emerald-950">
                  Viewing: {pnl.period.label}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                  {pnl.period.comparisonLabel}
                </p>
              </div>

              {pnl.totals.needsReviewCount ? (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-black text-amber-900">
                    {pnl.totals.needsReviewCount} transaction
                    {pnl.totals.needsReviewCount === 1 ? "" : "s"} need review
                    before they affect this period’s reports.
                  </p>
                  <Link
                    href="/admin/financials/plaid"
                    className="mt-3 inline-flex rounded-full bg-amber-600 px-4 py-2 text-xs font-black text-white transition hover:bg-amber-700"
                  >
                    Review Banking Categories
                  </Link>
                </div>
              ) : null}
            </div>

            <ProfitLossExportActions />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Total Revenue"
              value={money(pnl.totals.totalRevenue)}
              change={getMetricChange(
                pnl.totals.totalRevenue,
                pnl.previousMetrics.totalRevenue,
                "money",
              )}
              comparisonLabel={pnl.period.comparisonLabel}
              detail={`${pnl.revenueByCategory.length} reviewed revenue categories.`}
              tone="emerald"
            />

            <StatCard
              label="Total Expenses"
              value={money(pnl.totals.totalExpenses)}
              change={getMetricChange(
                pnl.totals.totalExpenses,
                pnl.previousMetrics.totalExpenses,
                "money",
              )}
              comparisonLabel={pnl.period.comparisonLabel}
              detail={`${money(pnl.totals.plaidExpenses)} bank-fed + ${money(pnl.totals.manualExpenses)} manual + ${money(pnl.totals.growthAndReferralExpenseTotal)} growth/referral expenses.`}
              tone="amber"
            />

            <StatCard
              label="Net Income / Loss"
              value={money(pnl.totals.netIncome)}
              change={getMetricChange(
                pnl.totals.netIncome,
                pnl.previousMetrics.netIncome,
                "money",
              )}
              comparisonLabel={pnl.period.comparisonLabel}
              detail={`${percent(pnl.totals.netMargin)} net margin.`}
              tone={pnl.totals.netIncome >= 0 ? "violet" : "rose"}
            />

            <StatCard
              label="Reportable Transactions"
              value={pnl.totals.reportableTransactions.toLocaleString()}
              change={getMetricChange(
                pnl.totals.reportableTransactions,
                pnl.previousMetrics.reportableTransactions,
                "number",
              )}
              comparisonLabel={pnl.period.comparisonLabel}
              detail={`${pnl.totals.manualCategorizedCount.toLocaleString()} manual bank categories, ${pnl.totals.manualExpenseCount.toLocaleString()} manual expenses, and ${(
                pnl.totals.growthMarketingExpenseCount +
                pnl.totals.issuedReferralRewardCount
              ).toLocaleString()} growth/referral rows.`}
              tone="sky"
            />

            <StatCard
              label="Current Cash Flow"
              value={money(pnl.totals.cashFlow)}
              change={getMetricChange(
                pnl.totals.cashFlow,
                pnl.previousMetrics.cashFlow,
                "money",
              )}
              comparisonLabel={pnl.period.comparisonLabel}
              detail={
                pnl.totals.cashFlow >= 0
                  ? "Positive cash flow for selected period."
                  : "Negative cash flow for selected period."
              }
              tone={pnl.totals.cashFlow >= 0 ? "emerald" : "rose"}
            />
          </div>
        </section>

        <AccountingReadinessPanel pnl={pnl} />

        <IntegrationFlowPanel />

        <GrowthReferralFinancialsPanel pnl={pnl} />

        <ManualControlsPanel pnl={pnl} />

        <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Consolidated Statement
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                {pnl.period.label} Statement of Operations
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This statement includes reviewed bank-fed income and expenses,
                plus manual operating expense entries for the selected period.
              </p>
            </div>

            <div className="p-4 sm:p-6">
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-[#fbfefd]">
                <div className="hidden grid-cols-[minmax(0,1fr)_140px] gap-4 border-b border-slate-100 bg-slate-50 px-4 py-4 sm:grid">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-950">
                    Line Item
                  </p>
                  <p className="text-right text-xs font-black uppercase tracking-[0.2em] text-slate-950">
                    Current
                  </p>
                </div>

                <StatementSection
                  title="Revenue"
                  rows={pnl.revenueByCategory}
                  totalLabel="Total Revenue"
                  totalValue={pnl.totals.totalRevenue}
                />

                <StatementSection
                  title="Expenses"
                  rows={pnl.expenseByCategory}
                  totalLabel="Total Expenses"
                  totalValue={pnl.totals.totalExpenses}
                />

                <div className="grid grid-cols-[1fr_auto] gap-4 border-t border-emerald-400/30 bg-emerald-50 px-4 py-4 font-black text-slate-950">
                  <p>Net Income / Loss</p>
                  <p
                    className={
                      pnl.totals.netIncome < 0
                        ? "text-rose-700"
                        : "text-slate-950"
                    }
                  >
                    {money(pnl.totals.netIncome)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Visual P&L Summary
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Revenue, expenses, and net result.
              </h2>

              <div className="mt-6 space-y-5">
                {visualRows.map((row) => (
                  <SummaryBar
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    max={maxVisualValue}
                    tone={row.tone}
                  />
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Bank Transactions
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-950">
                    {pnl.totals.totalBankTransactions.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Available Balance
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-950">
                    {moneyExact(pnl.totals.availableBalance)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Manual Expenses
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-950">
                    {money(pnl.totals.manualExpenses)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Custom Categories
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-950">
                    {pnl.totals.customStatementLineCount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <CategoryBreakdown
              title="Expense Sections"
              description="Expenses grouped by report section from bank-fed and manual categories."
              rows={pnl.expenseBySection}
              emptyMessage="No reviewed expense transactions are available for this period."
            />
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-2">
          <CategoryBreakdown
            title="Revenue Detail"
            description="Reviewed income categories that feed the P&L for this period."
            rows={pnl.revenueByCategory}
            emptyMessage="No reviewed income transactions are available for this period."
          />

          <CategoryBreakdown
            title="Expense Detail"
            description="Reviewed expense categories and manual expense categories that feed the P&L for this period."
            rows={pnl.expenseByCategory}
            emptyMessage="No reviewed expense transactions are available for this period."
          />
        </section>

        <TransactionsTable
          eyebrow="Recent Report Activity"
          title="Transactions included in P&L"
          description="These reviewed income, reviewed expenses, and manual expenses are included in the selected period."
          rows={pnl.recentReportTransactions}
          emptyMessage="No reportable Plaid/NFCU or manual transactions are included in this period yet."
        />

        <TransactionsTable
          eyebrow="Manual Expenses"
          title="Manual operating expenses"
          description="Manual expenses are included in the selected P&L period until voided."
          rows={pnl.recentManualExpenses}
          emptyMessage="No manual operating expenses have been added for this period yet."
          showVoidAction
        />

        <TransactionsTable
          eyebrow="Growth & Referral Expenses"
          title="Campaign costs and issued rewards included in P&L"
          description="These campaign costs and issued referral rewards come from the Growth & Referrals financial Supabase views and are included in expenses for this period."
          rows={pnl.recentGrowthExpenses}
          emptyMessage="No campaign costs or issued referral rewards are included in this period yet."
        />

        <TransactionsTable
          eyebrow="Needs Review"
          title="Transactions not included yet"
          description="These transactions need category review before they can affect this period’s P&L."
          rows={pnl.recentNeedsReview}
          emptyMessage="No transactions are waiting for review in this period."
        />
      </div>
    </div>
  );
}