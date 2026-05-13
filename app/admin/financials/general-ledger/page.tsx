import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type PeriodKey =
  | "today"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "annual"
  | "all";

type AdminGeneralLedgerPageProps = {
  searchParams?: Promise<{
    period?: string;
  }>;
};

type LedgerSource =
  | "financial_ledger_entries"
  | "trust_safety_financial_events"
  | "guru_trust_safety_plan_purchases"
  | "booking_trust_safety_deductions"
  | "expense_ledger"
  | "stripe_transactions"
  | "stripe_balance_transactions"
  | "bank_transactions"
  | "admin_plaid_transactions"
  | "cash_flow_lines"
  | "financial_statement_lines"
  | "payments"
  | "payouts"
  | "commissions"
  | "manual";

type LedgerEntry = {
  id: string;
  date: string;
  source: LedgerSource;
  sourceLabel: string;
  sourceId: string;
  account: string;
  quickBooksAccount: string;
  description: string;
  memo: string;
  debit: number;
  credit: number;
  amount: number;
  cashImpact: number;
  pnlImpact: number;
  status: string;
  bankStatus: string;
  reviewStatus: string;
  reconciliationStatus: string;
  taxTreatment: string;
  categoryType: string;
};

type AdminIdentity = {
  id: string;
  email: string;
  role: string;
  canAccessFinancials: boolean;
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

type LedgerTotals = {
  totalDebits: number;
  totalCredits: number;
  difference: number;
  isBalanced: boolean;
  needsReview: number;
  rowCount: number;
  cashIn: number;
  cashOut: number;
  netCashImpact: number;
  pnlIncome: number;
  pnlExpenses: number;
  pnlNet: number;
  pendingRows: number;
  postedRows: number;
  manualRows: number;
  plaidRows: number;
  trustSafetyRows: number;
  trustSafetyDebits: number;
  trustSafetyCredits: number;
  trustSafetyNet: number;
};

type SourceCount = {
  source: LedgerSource;
  label: string;
  count: number;
};

type AccountSummary = {
  account: string;
  debit: number;
  credit: number;
  net: number;
  count: number;
};

type GeneralLedgerData = {
  entries: LedgerEntry[];
  sourceCounts: SourceCount[];
  accountSummary: AccountSummary[];
  trustSafetyEntries: LedgerEntry[];
  period: PeriodWindow;
  previousTotals: LedgerTotals;
  totals: LedgerTotals;
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

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "weekly", label: "This Week" },
  { key: "monthly", label: "This Month" },
  { key: "quarterly", label: "This Quarter" },
  { key: "yearly", label: "This Year" },
  { key: "annual", label: "Annual" },
  { key: "all", label: "All Time" },
];

const SOURCE_TABLES: LedgerSource[] = [
  "financial_ledger_entries",
  "trust_safety_financial_events",
  "guru_trust_safety_plan_purchases",
  "booking_trust_safety_deductions",
  "expense_ledger",
  "stripe_transactions",
  "stripe_balance_transactions",
  "bank_transactions",
  "admin_plaid_transactions",
  "cash_flow_lines",
  "financial_statement_lines",
  "payments",
  "payouts",
  "commissions",
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

function centsAwareAmount(value: unknown) {
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

function money(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(value || 0));

  return value < 0 ? `(${formatted})` : formatted;
}

function formatSignedMoney(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${money(value)}`;
}

function formatSignedPercent(value: number) {
  if (!Number.isFinite(value)) return "0.0%";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

function dateLabel(value: string) {
  if (!value) return "No date";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "No date";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
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

function getMetricChange(current: number, previous: number) {
  const diff = current - previous;
  const pct = getChangePercent(current, previous);
  return `${formatSignedMoney(diff)} / ${formatSignedPercent(pct)}`;
}

function getDateValue(row: AnyRow) {
  return (
    asTrimmedString(row.date) ||
    asTrimmedString(row.occurred_at) ||
    asTrimmedString(row.transaction_date) ||
    asTrimmedString(row.posted_at) ||
    asTrimmedString(row.paid_at) ||
    asTrimmedString(row.payout_date) ||
    asTrimmedString(row.available_on) ||
    asTrimmedString(row.collected_at) ||
    asTrimmedString(row.created_at) ||
    asTrimmedString(row.updated_at) ||
    ""
  );
}

function getId(row: AnyRow, source: LedgerSource, index: number) {
  return (
    asTrimmedString(row.id) ||
    asTrimmedString(row.transaction_id) ||
    asTrimmedString(row.plaid_transaction_id) ||
    asTrimmedString(row.payment_intent_id) ||
    asTrimmedString(row.stripe_id) ||
    asTrimmedString(row.stripe_payment_intent_id) ||
    `${source}-${index}`
  );
}

function getText(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = asTrimmedString(row[key]);

    if (value) return value;
  }

  return "";
}

function getMetadataText(row: AnyRow) {
  const metadata = row.metadata || row.raw;

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "";
  }

  const meta = metadata as AnyRow;

  return (
    asTrimmedString(meta.description) ||
    asTrimmedString(meta.memo) ||
    asTrimmedString(meta.note) ||
    asTrimmedString(meta.name) ||
    asTrimmedString(meta.merchant_name) ||
    asTrimmedString(meta.payment_option) ||
    asTrimmedString(meta.action) ||
    ""
  );
}

function getStatus(row: AnyRow, source: LedgerSource) {
  if (source === "admin_plaid_transactions") {
    return getOptionalBoolean(row.pending) ? "pending" : "posted";
  }

  return (
    getText(row, [
      "status",
      "payment_status",
      "repayment_status",
      "payout_status",
      "commission_status",
      "reconciliation_status",
      "deduction_status",
      "management_approval_status",
      "state",
      "review_status",
    ]) || "recorded"
  );
}

function getBankStatus(row: AnyRow, source: LedgerSource) {
  if (source === "admin_plaid_transactions") {
    return getOptionalBoolean(row.pending) ? "Pending" : "Posted";
  }

  if (source === "expense_ledger" || source === "cash_flow_lines") {
    return "Manual";
  }

  return getText(row, ["bank_status", "posting_status", "status"]) || "Recorded";
}

function getReviewStatus(row: AnyRow, source: LedgerSource) {
  if (source === "admin_plaid_transactions") {
    return asTrimmedString(row.review_status) || "needs_review";
  }

  if (source === "expense_ledger" || source === "cash_flow_lines") {
    return "reviewed";
  }

  return (
    getText(row, ["review_status", "approval_status", "management_approval_status"]) ||
    "recorded"
  );
}

function sourceLabel(source: LedgerSource) {
  const labels: Record<LedgerSource, string> = {
    financial_ledger_entries: "Financial Ledger",
    trust_safety_financial_events: "Trust & Safety Events",
    guru_trust_safety_plan_purchases: "Trust & Safety Plans",
    booking_trust_safety_deductions: "Book & Bark Deductions",
    expense_ledger: "Expense Ledger",
    stripe_transactions: "Stripe Transactions",
    stripe_balance_transactions: "Stripe Balance",
    bank_transactions: "Bank Transactions",
    admin_plaid_transactions: "Plaid/NFCU Transactions",
    cash_flow_lines: "Cash Flow Lines",
    financial_statement_lines: "P&L Statement Lines",
    payments: "Payments",
    payouts: "Payouts",
    commissions: "Commissions",
    manual: "Manual",
  };

  return labels[source];
}

function statusClasses(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("paid") ||
    normalized.includes("posted") ||
    normalized.includes("succeeded") ||
    normalized.includes("reconciled") ||
    normalized.includes("ready") ||
    normalized.includes("approved") ||
    normalized.includes("collected") ||
    normalized.includes("reviewed") ||
    normalized.includes("auto_categorized")
  ) {
    return "border-emerald-100 bg-emerald-50 text-emerald-800";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("processing") ||
    normalized.includes("review") ||
    normalized.includes("not_started")
  ) {
    return "border-amber-100 bg-amber-50 text-amber-800";
  }

  if (
    normalized.includes("failed") ||
    normalized.includes("dispute") ||
    normalized.includes("chargeback") ||
    normalized.includes("void") ||
    normalized.includes("denied") ||
    normalized.includes("canceled") ||
    normalized.includes("refunded")
  ) {
    return "border-rose-100 bg-rose-50 text-rose-800";
  }

  return "border-slate-100 bg-slate-50 text-slate-700";
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
      console.warn(`General ledger query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`General ledger query skipped for ${label}:`, error);
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
      "admin_users_general_ledger_access",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("profiles")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "profiles_general_ledger_access",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("users")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "users_general_ledger_access",
    ),
  ]);

  const profile = (profileChecks.flat().find(Boolean) || {}) as Record<
    string,
    unknown
  >;

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
  const actor = await getAdminIdentity();

  if (!actor?.canAccessFinancials) return null;

  return actor;
}

function deriveTrustSafetyAccount(row: AnyRow, source: LedgerSource) {
  const eventType = asTrimmedString(row.event_type).toLowerCase();
  const planKey = asTrimmedString(row.plan_key).toLowerCase();
  const description = getText(row, ["description", "plan_name", "payment_model"]);
  const text = `${eventType} ${planKey} ${description}`.toLowerCase();

  if (source === "guru_trust_safety_plan_purchases") {
    if (planKey === "pawstep_plan") {
      return {
        account: "Trust & Safety Receivable - Pawstep",
        quickBooksAccount: "Accounts Receivable: Trust & Safety Pawstep",
        taxTreatment:
          "Installment receivable for financed Trust & Safety plan; CPA review.",
      };
    }

    if (planKey === "book_and_bark_plan") {
      return {
        account: "Trust & Safety Receivable - Book & Bark",
        quickBooksAccount:
          "Accounts Receivable: Trust & Safety Booking Deductions",
        taxTreatment:
          "Booking-deduction receivable for financed Trust & Safety plan; CPA review.",
      };
    }

    return {
      account: "Trust & Safety Plan Revenue",
      quickBooksAccount: "Service Revenue: Trust & Safety",
      taxTreatment: "Trust & Safety screening plan revenue; CPA review.",
    };
  }

  if (source === "booking_trust_safety_deductions") {
    return {
      account: "Trust & Safety Booking Deduction Recovery",
      quickBooksAccount:
        "Accounts Receivable: Trust & Safety Booking Deductions",
      taxTreatment:
        "Recovery of Book & Bark balance from completed booking payouts; CPA review.",
    };
  }

  if (text.includes("checkr") || eventType === "checkr_vendor_cost") {
    return {
      account: "Checkr Vendor Costs",
      quickBooksAccount: "Cost of Services: Background Checks",
      taxTreatment:
        "Vendor cost of revenue for Trust & Safety screening; CPA review.",
    };
  }

  if (text.includes("stripe") || eventType === "stripe_fee") {
    return {
      account: "Trust & Safety Stripe Fees",
      quickBooksAccount: "Bank Fees / Merchant Fees",
      taxTreatment: "Payment processing fee; CPA review.",
    };
  }

  if (text.includes("refund") || eventType === "refund") {
    return {
      account: "Trust & Safety Refunds",
      quickBooksAccount: "Refunds and Allowances: Trust & Safety",
      taxTreatment: "Contra-revenue or refund; CPA review.",
    };
  }

  if (
    eventType === "payment_collected" ||
    eventType === "down_payment_collected" ||
    eventType === "installment_collected" ||
    eventType === "booking_deduction_collected"
  ) {
    return {
      account: "Trust & Safety Plan Revenue",
      quickBooksAccount: "Service Revenue: Trust & Safety",
      taxTreatment: "Trust & Safety cash collected; CPA review.",
    };
  }

  return {
    account: "Trust & Safety Ledger Activity",
    quickBooksAccount: "Trust & Safety Clearing",
    taxTreatment: "Trust & Safety operational/financial event; CPA review.",
  };
}

function derivePlaidAccount(row: AnyRow) {
  const category = asTrimmedString(row.sitguru_category) || "Uncategorized";
  const type = asTrimmedString(row.sitguru_category_type).toLowerCase();
  const section = asTrimmedString(row.sitguru_report_section);
  const text = `${category} ${type} ${section}`.toLowerCase();

  if (type === "income") {
    return {
      account: category || "Operating Revenue",
      quickBooksAccount: "Income: Operating Revenue",
      taxTreatment: "Operating income; CPA review.",
    };
  }

  if (type === "expense") {
    return {
      account: category || "Operating Expenses",
      quickBooksAccount: section || "Expenses: Operating Expenses",
      taxTreatment: "Business expense; CPA should confirm deductibility.",
    };
  }

  if (type === "transfer") {
    return {
      account: "Bank Transfers",
      quickBooksAccount: "Transfer: Business Bank Accounts",
      taxTreatment:
        "Balance sheet transfer between accounts; excluded from P&L.",
    };
  }

  if (type === "owner_equity") {
    return {
      account: "Owner Contributions",
      quickBooksAccount: "Equity: Owner Contributions",
      taxTreatment: "Owner equity movement; excluded from P&L.",
    };
  }

  if (type === "owner_draw") {
    return {
      account: "Owner Draws",
      quickBooksAccount: "Equity: Owner Draws",
      taxTreatment: "Owner draw; excluded from P&L.",
    };
  }

  if (type === "liability") {
    return {
      account: category || "Liabilities",
      quickBooksAccount: "Liabilities",
      taxTreatment: "Liability cash movement; CPA review.",
    };
  }

  if (type === "ignore" || text.includes("personal")) {
    return {
      account: "Ignored / Personal",
      quickBooksAccount: "Excluded from Business Reports",
      taxTreatment: "Excluded from business financial statements.",
    };
  }

  return {
    account: "Uncategorized Bank Activity",
    quickBooksAccount: "Ask My Accountant",
    taxTreatment: "Needs accounting classification.",
  };
}

function deriveCashFlowLineAccount(row: AnyRow) {
  const section = asTrimmedString(row.section).replaceAll("_", " ");
  const label = asTrimmedString(row.label) || "Cash Flow Line";

  return {
    account: label,
    quickBooksAccount: `Cash Flow: ${section || "Manual"}`,
    taxTreatment: "Manual cash-flow line; CPA review.",
  };
}

function deriveStatementLineAccount(row: AnyRow) {
  const section = asTrimmedString(row.section).replaceAll("_", " ");
  const label = asTrimmedString(row.label) || "Statement Line";

  return {
    account: label,
    quickBooksAccount: `P&L: ${section || "Manual"}`,
    taxTreatment: "P&L statement category mapping; CPA review.",
  };
}

function deriveAccountFromText(text: string, source: LedgerSource, row?: AnyRow) {
  if (
    source === "trust_safety_financial_events" ||
    source === "guru_trust_safety_plan_purchases" ||
    source === "booking_trust_safety_deductions"
  ) {
    return deriveTrustSafetyAccount(row || {}, source);
  }

  if (source === "admin_plaid_transactions") {
    return derivePlaidAccount(row || {});
  }

  if (source === "cash_flow_lines") {
    return deriveCashFlowLineAccount(row || {});
  }

  if (source === "financial_statement_lines") {
    return deriveStatementLineAccount(row || {});
  }

  const normalized = text.toLowerCase();

  if (normalized.includes("trust") && normalized.includes("safety")) {
    return {
      account: "Trust & Safety Ledger Activity",
      quickBooksAccount: "Trust & Safety Clearing",
      taxTreatment: "Trust & Safety activity; CPA review.",
    };
  }

  if (normalized.includes("stripe") && normalized.includes("fee")) {
    return {
      account: "Merchant Processing Fees",
      quickBooksAccount: "Bank Fees / Merchant Fees",
      taxTreatment: "Ordinary and necessary business expense; CPA review.",
    };
  }

  if (
    normalized.includes("refund") ||
    normalized.includes("chargeback") ||
    normalized.includes("dispute")
  ) {
    return {
      account: "Refunds and Allowances",
      quickBooksAccount: "Refunds and Allowances",
      taxTreatment: "Contra-revenue or customer refund; CPA review.",
    };
  }

  if (
    normalized.includes("guru") ||
    normalized.includes("payout") ||
    normalized.includes("provider")
  ) {
    return {
      account: "Guru Payouts",
      quickBooksAccount: "Contract Labor / Cost of Services",
      taxTreatment: "Contractor payout support; 1099 classification review.",
    };
  }

  if (
    normalized.includes("partner") ||
    normalized.includes("commission") ||
    normalized.includes("affiliate") ||
    source === "commissions"
  ) {
    return {
      account: "Partner Commissions",
      quickBooksAccount: "Commissions Expense",
      taxTreatment: "Commission expense; CPA review.",
    };
  }

  if (
    normalized.includes("bank") ||
    normalized.includes("checking") ||
    normalized.includes("savings") ||
    normalized.includes("navy") ||
    normalized.includes("nfcu")
  ) {
    return {
      account: "Cash and Cash Equivalents",
      quickBooksAccount: "Checking / Savings",
      taxTreatment: "Balance sheet cash account.",
    };
  }

  if (
    normalized.includes("payment") ||
    normalized.includes("booking") ||
    normalized.includes("revenue") ||
    source === "payments"
  ) {
    return {
      account: "Platform Revenue",
      quickBooksAccount: "Service Revenue",
      taxTreatment: "Operating revenue; CPA review.",
    };
  }

  if (source === "expense_ledger") {
    return {
      account: "Operating Expenses",
      quickBooksAccount: "Operating Expenses",
      taxTreatment: "Deductibility depends on category and substantiation.",
    };
  }

  return {
    account: "Uncategorized Ledger Activity",
    quickBooksAccount: "Ask My Accountant",
    taxTreatment: "Needs accounting classification.",
  };
}

function amountFromTrustSafetyRow(row: AnyRow, source: LedgerSource) {
  if (source === "trust_safety_financial_events") {
    const net = centsToDollars(row.net_amount_cents);
    const gross = centsToDollars(row.gross_amount_cents);
    const fee = centsToDollars(row.fee_amount_cents);
    const eventType = asTrimmedString(row.event_type).toLowerCase();

    if (
      eventType === "stripe_fee" ||
      eventType === "checkr_vendor_cost" ||
      eventType === "sitguru_fronted_cost" ||
      eventType === "refund"
    ) {
      return -Math.abs(net || gross || fee);
    }

    return net || gross || 0;
  }

  if (source === "guru_trust_safety_plan_purchases") {
    const paid = centsToDollars(row.amount_paid_cents);
    const remaining = centsToDollars(row.remaining_balance_cents);
    const gross = centsToDollars(row.gross_plan_value_cents);

    return paid || remaining || gross || 0;
  }

  if (source === "booking_trust_safety_deductions") {
    return centsToDollars(row.deduction_amount_cents);
  }

  return 0;
}

function amountFromRow(row: AnyRow, source: LedgerSource) {
  if (
    source === "trust_safety_financial_events" ||
    source === "guru_trust_safety_plan_purchases" ||
    source === "booking_trust_safety_deductions"
  ) {
    return amountFromTrustSafetyRow(row, source);
  }

  if (source === "stripe_balance_transactions") {
    return (
      centsAwareAmount(row.net) ||
      centsAwareAmount(row.amount) ||
      centsAwareAmount(row.gross) ||
      centsAwareAmount(row.fee)
    );
  }

  if (source === "financial_statement_lines") {
    return 0;
  }

  return (
    toNumber(row.amount) ||
    toNumber(row.total_amount) ||
    toNumber(row.net_amount) ||
    toNumber(row.gross_amount) ||
    toNumber(row.expense_amount) ||
    toNumber(row.payout_amount) ||
    toNumber(row.commission_amount) ||
    toNumber(row.payment_amount) ||
    toNumber(row.balance)
  );
}

function getTrustSafetyDescription(row: AnyRow, source: LedgerSource) {
  if (source === "guru_trust_safety_plan_purchases") {
    return [
      asTrimmedString(row.plan_name) || "Trust & Safety Plan",
      asTrimmedString(row.payment_model),
      asTrimmedString(row.payment_status),
      asTrimmedString(row.management_approval_status),
    ]
      .filter(Boolean)
      .join(" · ");
  }

  if (source === "booking_trust_safety_deductions") {
    return "Book & Bark booking deduction collected toward Trust & Safety balance";
  }

  return (
    asTrimmedString(row.description) ||
    `${asTrimmedString(row.plan_name) || "Trust & Safety"} ${
      asTrimmedString(row.event_type) || "event"
    }`.trim()
  );
}

function getDescription(row: AnyRow, source: LedgerSource) {
  const isTrustSafetySource =
    source === "trust_safety_financial_events" ||
    source === "guru_trust_safety_plan_purchases" ||
    source === "booking_trust_safety_deductions";

  if (isTrustSafetySource) {
    return getTrustSafetyDescription(row, source);
  }

  if (source === "admin_plaid_transactions") {
    return (
      asTrimmedString(row.merchant_name) ||
      asTrimmedString(row.name) ||
      "Plaid/NFCU bank transaction"
    );
  }

  if (source === "cash_flow_lines") {
    return asTrimmedString(row.label) || "Cash flow line";
  }

  if (source === "financial_statement_lines") {
    return asTrimmedString(row.label) || "P&L statement line";
  }

  return (
    getText(row, [
      "description",
      "memo",
      "name",
      "title",
      "vendor_name",
      "customer_name",
      "statement_descriptor",
      "type",
      "transaction_type",
      "category",
    ]) ||
    getMetadataText(row) ||
    sourceLabel(source)
  );
}

function getCategoryType(row: AnyRow, source: LedgerSource) {
  if (source === "admin_plaid_transactions") {
    return asTrimmedString(row.sitguru_category_type) || "uncategorized";
  }

  if (source === "expense_ledger") return "expense";
  if (source === "cash_flow_lines") return "manual_cash_flow_line";
  if (source === "financial_statement_lines") return "statement_line";

  return asTrimmedString(row.category_type) || asTrimmedString(row.type) || source;
}

function getCashImpact(amount: number, row: AnyRow, source: LedgerSource) {
  if (source === "financial_statement_lines") return 0;

  if (source === "admin_plaid_transactions") {
    const type = getCategoryType(row, source).toLowerCase();
    const absoluteAmount = Math.abs(amount);

    if (type === "income" || type === "owner_equity") return absoluteAmount;

    if (type === "expense" || type === "owner_draw" || type === "liability") {
      return -absoluteAmount;
    }

    if (type === "transfer") {
      const name = `${row.name || ""} ${row.merchant_name || ""}`.toLowerCase();

      if (
        name.includes("from savings") ||
        name.includes("to checking") ||
        name.includes("deposit")
      ) {
        return absoluteAmount;
      }

      return -absoluteAmount;
    }

    return -amount;
  }

  if (source === "expense_ledger" || source === "payouts" || source === "commissions") {
    return -Math.abs(amount);
  }

  return amount;
}

function getPnlImpact(amount: number, row: AnyRow, source: LedgerSource) {
  if (source === "admin_plaid_transactions") {
    const type = getCategoryType(row, source).toLowerCase();
    const absoluteAmount = Math.abs(amount);

    if (type === "income") return absoluteAmount;
    if (type === "expense") return -absoluteAmount;

    return 0;
  }

  if (source === "expense_ledger") return -Math.abs(amount);
  if (source === "financial_statement_lines" || source === "cash_flow_lines") return 0;

  return amount;
}

function normalizeLedgerEntry(
  row: AnyRow,
  source: LedgerSource,
  index: number,
): LedgerEntry {
  const sourceId = getId(row, source, index);
  const explicitDebit = toNumber(row.debit) || toNumber(row.debit_amount);
  const explicitCredit = toNumber(row.credit) || toNumber(row.credit_amount);
  const amount = amountFromRow(row, source);
  const description = getDescription(row, source);
  const accountInfo =
    asTrimmedString(row.account_name) ||
    asTrimmedString(row.account) ||
    asTrimmedString(row.quickbooks_account) ||
    asTrimmedString(row.qb_account)
      ? {
          account:
            asTrimmedString(row.account_name) ||
            asTrimmedString(row.account) ||
            asTrimmedString(row.category) ||
            "Ledger Account",
          quickBooksAccount:
            asTrimmedString(row.quickbooks_account) ||
            asTrimmedString(row.qb_account) ||
            asTrimmedString(row.account_name) ||
            asTrimmedString(row.account) ||
            "Ask My Accountant",
          taxTreatment:
            asTrimmedString(row.tax_treatment) ||
            "CPA should confirm account treatment.",
        }
      : deriveAccountFromText(`${description} ${sourceLabel(source)}`, source, row);

  const debit =
    explicitDebit > 0
      ? explicitDebit
      : explicitCredit > 0
        ? 0
        : amount >= 0
          ? amount
          : 0;

  const credit =
    explicitCredit > 0
      ? explicitCredit
      : explicitDebit > 0
        ? 0
        : amount < 0
          ? Math.abs(amount)
          : 0;

  const cashImpact = getCashImpact(amount, row, source);
  const pnlImpact = getPnlImpact(amount, row, source);
  const status = getStatus(row, source);
  const bankStatus = getBankStatus(row, source);
  const reviewStatus = getReviewStatus(row, source);
  const categoryType = getCategoryType(row, source);

  return {
    id: `${source}-${sourceId}-${index}`,
    date: getDateValue(row),
    source,
    sourceLabel: sourceLabel(source),
    sourceId,
    account: accountInfo.account,
    quickBooksAccount: accountInfo.quickBooksAccount,
    description,
    memo:
      getText(row, [
        "notes",
        "note",
        "memo",
        "metadata_summary",
        "sitguru_notes",
        "official_name",
      ]) ||
      getMetadataText(row) ||
      "Imported from SitGuru financial data source.",
    debit,
    credit,
    amount: debit - credit,
    cashImpact,
    pnlImpact,
    status,
    bankStatus,
    reviewStatus,
    reconciliationStatus:
      getText(row, ["reconciliation_status", "reconciled_status"]) ||
      (source === "bank_transactions" ||
      source === "admin_plaid_transactions" ||
      source === "stripe_balance_transactions" ||
      source === "trust_safety_financial_events"
        ? "Needs reconciliation review"
        : "Not reconciled"),
    taxTreatment: accountInfo.taxTreatment,
    categoryType,
  };
}

async function getSourceRows(source: LedgerSource) {
  return safeRows<AnyRow>(
    supabaseAdmin
      .from(source)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000),
    source,
  );
}

function calculateTotals(entries: LedgerEntry[]): LedgerTotals {
  const totalDebits = entries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredits = entries.reduce((sum, entry) => sum + entry.credit, 0);
  const difference = totalDebits - totalCredits;
  const trustSafetyEntries = entries.filter(
    (entry) =>
      entry.source.includes("trust_safety") ||
      entry.account.toLowerCase().includes("trust & safety") ||
      entry.account.toLowerCase().includes("checkr"),
  );
  const trustSafetyDebits = trustSafetyEntries.reduce(
    (sum, entry) => sum + entry.debit,
    0,
  );
  const trustSafetyCredits = trustSafetyEntries.reduce(
    (sum, entry) => sum + entry.credit,
    0,
  );

  const cashIn = entries
    .filter((entry) => entry.cashImpact > 0)
    .reduce((sum, entry) => sum + entry.cashImpact, 0);

  const cashOut = entries
    .filter((entry) => entry.cashImpact < 0)
    .reduce((sum, entry) => sum + Math.abs(entry.cashImpact), 0);

  const pnlIncome = entries
    .filter((entry) => entry.pnlImpact > 0)
    .reduce((sum, entry) => sum + entry.pnlImpact, 0);

  const pnlExpenses = entries
    .filter((entry) => entry.pnlImpact < 0)
    .reduce((sum, entry) => sum + Math.abs(entry.pnlImpact), 0);

  const pendingRows = entries.filter((entry) =>
    `${entry.status} ${entry.bankStatus} ${entry.reviewStatus}`
      .toLowerCase()
      .includes("pending"),
  ).length;

  const postedRows = entries.filter((entry) =>
    `${entry.status} ${entry.bankStatus}`.toLowerCase().includes("posted"),
  ).length;

  const manualRows = entries.filter(
    (entry) =>
      entry.source === "manual" ||
      entry.source === "expense_ledger" ||
      entry.source === "cash_flow_lines",
  ).length;

  const plaidRows = entries.filter(
    (entry) => entry.source === "admin_plaid_transactions",
  ).length;

  const needsReview = entries.filter(
    (entry) =>
      entry.account === "Uncategorized Ledger Activity" ||
      entry.account === "Uncategorized Bank Activity" ||
      entry.quickBooksAccount === "Ask My Accountant" ||
      entry.reconciliationStatus.toLowerCase().includes("needs") ||
      entry.reviewStatus.toLowerCase().includes("needs_review"),
  ).length;

  return {
    totalDebits,
    totalCredits,
    difference,
    isBalanced: Math.abs(difference) < 0.01,
    needsReview,
    rowCount: entries.length,
    cashIn,
    cashOut,
    netCashImpact: cashIn - cashOut,
    pnlIncome,
    pnlExpenses,
    pnlNet: pnlIncome - pnlExpenses,
    pendingRows,
    postedRows,
    manualRows,
    plaidRows,
    trustSafetyRows: trustSafetyEntries.length,
    trustSafetyDebits,
    trustSafetyCredits,
    trustSafetyNet: trustSafetyDebits - trustSafetyCredits,
  };
}

function buildAccountSummary(entries: LedgerEntry[]) {
  return Array.from(
    entries.reduce<Map<string, { debit: number; credit: number; count: number }>>(
      (map, entry) => {
        const current = map.get(entry.account) || {
          debit: 0,
          credit: 0,
          count: 0,
        };

        current.debit += entry.debit;
        current.credit += entry.credit;
        current.count += 1;
        map.set(entry.account, current);

        return map;
      },
      new Map(),
    ),
  )
    .map(([account, values]) => ({
      account,
      ...values,
      net: values.debit - values.credit,
    }))
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
}

async function getGeneralLedgerData(periodKey: PeriodKey): Promise<GeneralLedgerData> {
  const period = getPeriodWindow(periodKey);

  const sourceResults = await Promise.all(
    SOURCE_TABLES.map(async (source) => ({
      source,
      rows: await getSourceRows(source),
    })),
  );

  const allEntries = sourceResults
    .flatMap(({ source, rows }) =>
      rows.map((row, index) => normalizeLedgerEntry(row, source, index)),
    )
    .filter((entry) => Boolean(entry.id))
    .sort((a, b) => {
      const aTime = new Date(a.date || "").getTime() || 0;
      const bTime = new Date(b.date || "").getTime() || 0;
      return bTime - aTime;
    });

  const entries = allEntries.filter((entry) => isWithinWindow(entry.date, period));

  const previousEntries = allEntries.filter((entry) =>
    isWithinPreviousWindow(entry.date, period),
  );

  const totals = calculateTotals(entries);
  const previousTotals = calculateTotals(previousEntries);

  const sourceCounts = sourceResults.map(({ source, rows }) => ({
    source,
    label: sourceLabel(source),
    count: rows.length,
  }));

  const accountSummary = buildAccountSummary(entries);

  const trustSafetyEntries = entries.filter(
    (entry) =>
      entry.source.includes("trust_safety") ||
      entry.account.toLowerCase().includes("trust & safety") ||
      entry.account.toLowerCase().includes("checkr"),
  );

  return {
    entries,
    sourceCounts,
    accountSummary,
    trustSafetyEntries,
    period,
    previousTotals,
    totals,
  };
}

function PeriodSelector({ currentPeriod }: { currentPeriod: PeriodKey }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PERIOD_OPTIONS.map((period) => (
        <Link
          key={period.key}
          href={`/admin/financials/general-ledger?period=${period.key}`}
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

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-4xl text-sm font-semibold leading-7 text-slate-600">
          {description}
        </p>
      ) : null}
    </div>
  );
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
  tone?: "emerald" | "blue" | "amber" | "rose" | "slate" | "violet";
}) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50",
    blue: "border-blue-100 bg-blue-50",
    amber: "border-amber-100 bg-amber-50",
    rose: "border-rose-100 bg-rose-50",
    slate: "border-slate-100 bg-slate-50",
    violet: "border-violet-100 bg-violet-50",
  };

  return (
    <div className={`rounded-[1.5rem] border p-5 ${tones[tone]}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-600">
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
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        {detail}
      </p>
    </div>
  );
}

function EmptyLedgerState() {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <p className="text-lg font-black text-slate-950">
        No ledger entries loaded for this period yet.
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        Connect Stripe, NFCU/Plaid bank activity, Trust & Safety records,
        payment records, payout records, commissions, expenses, or manual ledger
        rows to populate the General Ledger.
      </p>
    </div>
  );
}

function LedgerTable({ entries }: { entries: LedgerEntry[] }) {
  if (!entries.length) return <EmptyLedgerState />;

  return (
    <div className="w-full max-w-full overflow-hidden rounded-[1.5rem] border border-slate-100">
      <div className="w-full overflow-x-auto">
        <table className="min-w-[1500px] divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              {[
                "Date",
                "Account",
                "Description",
                "Source",
                "Status",
                "Bank Status",
                "Debit",
                "Credit",
                "Cash Impact",
                "P&L Impact",
                "QuickBooks",
                "Reconciliation",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {entries.slice(0, 225).map((entry) => (
              <tr key={entry.id} className="align-top transition hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-slate-700">
                  {dateLabel(entry.date)}
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm font-black text-slate-950">
                    {entry.account}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {entry.taxTreatment}
                  </p>
                </td>
                <td className="max-w-[300px] px-4 py-4">
                  <p className="text-sm font-bold leading-6 text-slate-700">
                    {entry.description}
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                    {entry.memo}
                  </p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                    {entry.categoryType.replaceAll("_", " ")}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm font-black text-slate-950">
                    {entry.sourceLabel}
                  </p>
                  <p className="mt-1 max-w-[180px] truncate text-xs font-semibold text-slate-500">
                    {entry.sourceId}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${statusClasses(
                      entry.status,
                    )}`}
                  >
                    {entry.status}
                  </span>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                    {entry.reviewStatus}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${statusClasses(
                      entry.bankStatus,
                    )}`}
                  >
                    {entry.bankStatus}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-black text-emerald-800">
                  {entry.debit > 0 ? money(entry.debit) : "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-black text-rose-800">
                  {entry.credit > 0 ? money(entry.credit) : "—"}
                </td>
                <td
                  className={`whitespace-nowrap px-4 py-4 text-right text-sm font-black ${
                    entry.cashImpact < 0 ? "text-rose-700" : "text-slate-950"
                  }`}
                >
                  {entry.cashImpact !== 0 ? money(entry.cashImpact) : "—"}
                </td>
                <td
                  className={`whitespace-nowrap px-4 py-4 text-right text-sm font-black ${
                    entry.pnlImpact < 0 ? "text-rose-700" : "text-slate-950"
                  }`}
                >
                  {entry.pnlImpact !== 0 ? money(entry.pnlImpact) : "—"}
                </td>
                <td className="px-4 py-4 text-sm font-bold text-slate-700">
                  {entry.quickBooksAccount}
                </td>
                <td className="max-w-[240px] px-4 py-4 text-sm font-semibold leading-6 text-slate-600">
                  {entry.reconciliationStatus}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SourceCountPanel({ sources }: { sources: SourceCount[] }) {
  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <SectionHeader
        eyebrow="Source Coverage"
        title="Financial data feeding the ledger"
        description="Each source is queried safely. Missing tables are skipped instead of breaking the page."
      />

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {sources.map((source) => (
          <div
            key={source.source}
            className="rounded-2xl border border-slate-100 bg-[#fbfefd] p-4"
          >
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              {source.label}
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {source.count.toLocaleString()}
            </p>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              {source.source}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AccountSummaryPanel({ rows }: { rows: AccountSummary[] }) {
  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <SectionHeader
        eyebrow="Account Summary"
        title="Ledger accounts by net activity"
        description="This groups all ledger rows by derived account name for CPA and QuickBooks review."
      />

      <div className="mt-6 w-full max-w-full overflow-hidden rounded-[1.5rem] border border-slate-100">
        <div className="w-full overflow-x-auto">
          <table className="min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.18em]">
                  Account
                </th>
                <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-[0.18em]">
                  Debits
                </th>
                <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-[0.18em]">
                  Credits
                </th>
                <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-[0.18em]">
                  Net
                </th>
                <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-[0.18em]">
                  Rows
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.slice(0, 30).map((row) => (
                <tr key={row.account}>
                  <td className="px-4 py-4 font-black text-slate-950">
                    {row.account}
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-emerald-800">
                    {money(row.debit)}
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-rose-800">
                    {money(row.credit)}
                  </td>
                  <td
                    className={`px-4 py-4 text-right font-black ${
                      row.net < 0 ? "text-rose-700" : "text-slate-950"
                    }`}
                  >
                    {money(row.net)}
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-slate-600">
                    {row.count.toLocaleString()}
                  </td>
                </tr>
              ))}

              {!rows.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-600">
                    No account activity is available for this period.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ReviewQueuePanel({ ledger }: { ledger: GeneralLedgerData }) {
  const reviewRows = ledger.entries.filter(
    (entry) =>
      entry.quickBooksAccount === "Ask My Accountant" ||
      entry.reconciliationStatus.toLowerCase().includes("needs") ||
      entry.reviewStatus.toLowerCase().includes("needs_review"),
  );

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <SectionHeader
        eyebrow="Review Queue"
        title="Rows needing attention"
        description="These rows are not fully classified, reconciled, or mapped to CPA-ready accounts."
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {reviewRows.slice(0, 12).map((entry) => (
          <div
            key={entry.id}
            className="rounded-2xl border border-amber-100 bg-amber-50 p-4"
          >
            <p className="text-sm font-black text-slate-950">
              {entry.description}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-600">
              {entry.sourceLabel} · {entry.account}
            </p>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-amber-800">
              {entry.reconciliationStatus}
            </p>
          </div>
        ))}

        {!reviewRows.length ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-sm font-black text-emerald-900">
              No review rows found for this period.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ReadinessPanel({ ledger }: { ledger: GeneralLedgerData }) {
  const items = [
    {
      label: "Plaid/NFCU Rows",
      ready: ledger.totals.plaidRows > 0,
      detail: `${ledger.totals.plaidRows.toLocaleString()} Plaid/NFCU rows are included in the selected period.`,
    },
    {
      label: "Manual Rows",
      ready: ledger.totals.manualRows > 0,
      detail: `${ledger.totals.manualRows.toLocaleString()} manual or ledger-controlled rows are included.`,
    },
    {
      label: "Pending / Posted",
      ready: ledger.totals.postedRows > 0 || ledger.totals.pendingRows > 0,
      detail: `${ledger.totals.postedRows.toLocaleString()} posted and ${ledger.totals.pendingRows.toLocaleString()} pending rows are visible.`,
    },
    {
      label: "Needs Review",
      ready: ledger.totals.needsReview === 0,
      detail: ledger.totals.needsReview
        ? `${ledger.totals.needsReview.toLocaleString()} rows still need classification or reconciliation review.`
        : "No ledger rows need classification review for this period.",
    },
    {
      label: "Cash Impact",
      ready: ledger.totals.cashIn > 0 || ledger.totals.cashOut > 0,
      detail: `${money(ledger.totals.cashIn)} cash in and ${money(ledger.totals.cashOut)} cash out.`,
    },
    {
      label: "P&L Impact",
      ready: ledger.totals.pnlIncome > 0 || ledger.totals.pnlExpenses > 0,
      detail: `${money(ledger.totals.pnlIncome)} income and ${money(ledger.totals.pnlExpenses)} expenses.`,
    },
  ];

  const readyCount = items.filter((item) => item.ready).length;

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
            Ledger Readiness
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Master accounting record checks
          </h2>
          <p className="mt-2 max-w-4xl text-sm font-semibold leading-7 text-slate-600">
            These checks confirm whether the ledger has bank rows, manual rows,
            P&L impact, cash impact, and review visibility for the selected
            period.
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
            className={`rounded-xl border p-4 ${
              item.ready
                ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                : "border-amber-100 bg-amber-50 text-amber-800"
            }`}
          >
            <p className="text-xs font-black uppercase tracking-[0.16em] opacity-80">
              {item.ready ? "Ready" : "Needs Review"}
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

export default async function AdminGeneralLedgerPage({
  searchParams,
}: AdminGeneralLedgerPageProps) {
  const params = await searchParams;
  const selectedPeriod = getPeriodKey(params?.period);
  const actor = await requireFinancialAdmin();

  if (!actor) {
    return (
      <main className="min-h-screen bg-[#f7fbf8] px-6 py-10 text-slate-950">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-100 bg-white p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-700">
            Access Restricted
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
            Financial access required.
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Sign in with a finance-enabled admin account to view SitGuru General
            Ledger reports.
          </p>
        </div>
      </main>
    );
  }

  const ledger = await getGeneralLedgerData(selectedPeriod);

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1700px] space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-5xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                Admin / Financials / General Ledger
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                SitGuru General Ledger by period.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-semibold leading-7 text-slate-600 sm:text-base">
                CPA-ready master ledger view for SitGuru financial activity. This
                combines P&L activity, Cash Flow activity, NFCU/Plaid bank rows,
                manual expenses, Trust & Safety activity, Stripe activity,
                payouts, commissions, and statement mappings into debit, credit,
                cash-impact, and P&L-impact rows.
              </p>

              <div className="mt-5">
                <PeriodSelector currentPeriod={ledger.period.key} />
              </div>

              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-black text-emerald-950">
                  Viewing: {ledger.period.label}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                  {ledger.period.comparisonLabel}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/financials/profit-loss"
                className="rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                Profit & Loss
              </Link>
              <Link
                href="/admin/financials/cash-flow"
                className="rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                Cash Flow
              </Link>
              <Link
                href="/admin/financials/plaid"
                className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-100"
              >
                Banking
              </Link>
              <Link
                href="/admin/financials"
                className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-700/10 transition hover:bg-emerald-800"
              >
                Financial Overview
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Ledger Rows"
              value={ledger.totals.rowCount.toLocaleString()}
              detail="Rows from bank, manual, Trust & Safety, Stripe, statements, payouts, payments, and commissions."
              tone="emerald"
            />
            <StatCard
              label="Total Debits"
              value={money(ledger.totals.totalDebits)}
              change={getMetricChange(
                ledger.totals.totalDebits,
                ledger.previousTotals.totalDebits,
              )}
              comparisonLabel={ledger.period.comparisonLabel}
              detail="Debit-side activity available for accounting review."
              tone="blue"
            />
            <StatCard
              label="Total Credits"
              value={money(ledger.totals.totalCredits)}
              change={getMetricChange(
                ledger.totals.totalCredits,
                ledger.previousTotals.totalCredits,
              )}
              comparisonLabel={ledger.period.comparisonLabel}
              detail="Credit-side activity available for accounting review."
              tone="amber"
            />
            <StatCard
              label={ledger.totals.isBalanced ? "Balanced" : "Review Needed"}
              value={money(ledger.totals.difference)}
              detail={`${ledger.totals.needsReview.toLocaleString()} rows need classification or reconciliation review.`}
              tone={ledger.totals.isBalanced ? "emerald" : "rose"}
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Cash Impact"
              value={money(ledger.totals.netCashImpact)}
              change={getMetricChange(
                ledger.totals.netCashImpact,
                ledger.previousTotals.netCashImpact,
              )}
              comparisonLabel={ledger.period.comparisonLabel}
              detail={`${money(ledger.totals.cashIn)} cash in and ${money(ledger.totals.cashOut)} cash out.`}
              tone={ledger.totals.netCashImpact >= 0 ? "emerald" : "rose"}
            />
            <StatCard
              label="P&L Impact"
              value={money(ledger.totals.pnlNet)}
              change={getMetricChange(
                ledger.totals.pnlNet,
                ledger.previousTotals.pnlNet,
              )}
              comparisonLabel={ledger.period.comparisonLabel}
              detail={`${money(ledger.totals.pnlIncome)} income and ${money(ledger.totals.pnlExpenses)} expenses.`}
              tone={ledger.totals.pnlNet >= 0 ? "violet" : "rose"}
            />
            <StatCard
              label="Plaid/NFCU Rows"
              value={ledger.totals.plaidRows.toLocaleString()}
              detail="Bank-fed rows from connected NFCU Business Checking/Savings."
              tone="slate"
            />
            <StatCard
              label="Manual Rows"
              value={ledger.totals.manualRows.toLocaleString()}
              detail="Expense ledger and manual cash-flow line rows."
              tone="slate"
            />
          </div>
        </section>

        <ReadinessPanel ledger={ledger} />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Trust & Safety Rows"
            value={ledger.totals.trustSafetyRows.toLocaleString()}
            detail="Plan purchases, financial events, and Book & Bark deductions."
            tone="emerald"
          />
          <StatCard
            label="Trust & Safety Debits"
            value={money(ledger.totals.trustSafetyDebits)}
            detail="Trust & Safety receivables, costs, or debit-side activity."
            tone="blue"
          />
          <StatCard
            label="Trust & Safety Credits"
            value={money(ledger.totals.trustSafetyCredits)}
            detail="Trust & Safety revenue, collections, recoveries, or credit-side activity."
            tone="amber"
          />
          <StatCard
            label="Trust & Safety Net"
            value={money(ledger.totals.trustSafetyNet)}
            detail="Debit minus credit for Trust & Safety ledger rows."
            tone="slate"
          />
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Master Ledger"
            title={`${ledger.period.label} ledger entries`}
            description="Shows all available ledger rows for the selected period. Rows include accounting account, source, status, debit, credit, cash impact, P&L impact, QuickBooks mapping, and reconciliation status."
          />

          <div className="mt-6">
            <LedgerTable entries={ledger.entries} />
          </div>

          {ledger.entries.length > 225 ? (
            <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm font-bold text-amber-800">
              Showing the latest 225 rows. Use exports later for the full
              period ledger.
            </p>
          ) : null}
        </section>

        <AccountSummaryPanel rows={ledger.accountSummary} />

        <ReviewQueuePanel ledger={ledger} />

        <SourceCountPanel sources={ledger.sourceCounts} />
      </div>
    </main>
  );
}