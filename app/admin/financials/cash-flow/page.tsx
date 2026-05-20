import Link from "next/link";
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

type AdminCashFlowPageProps = {
  searchParams?: Promise<{
    period?: string;
  }>;
};

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
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

type ExpenseLedgerRow = Record<string, unknown>;
type CashFlowLineRow = Record<string, unknown>;
type GrowthMarketingExpenseRow = Record<string, unknown>;
type ReferralRewardLiabilityRow = Record<string, unknown>;

type PeriodWindow = {
  key: PeriodKey;
  label: string;
  comparisonLabel: string;
  start: Date | null;
  end: Date | null;
  previousStart: Date | null;
  previousEnd: Date | null;
};

type CashFlowSectionKey =
  | "operating"
  | "investing"
  | "financing"
  | "transfers"
  | "cash_position";

type CashFlowLine = {
  id: string;
  dbId: string;
  isSaved: boolean;
  section: CashFlowSectionKey;
  label: string;
  amount: number;
  notes: string;
  displayOrder: number;
  source: string;
};

type CashActivityRow = {
  id: string;
  date: string;
  description: string;
  merchant: string;
  category: string;
  type: string;
  section: string;
  bankStatus: string;
  source: "Plaid/NFCU" | "Manual" | "Growth/Referrals";
  amount: number;
};

type CashFlowMetrics = {
  cashIn: number;
  cashOut: number;
  operatingCashIn: number;
  operatingCashOut: number;
  netOperatingCash: number;
  netInvestingCash: number;
  netFinancingCash: number;
  transferIn: number;
  transferOut: number;
  netTransferCash: number;
  ownerContributions: number;
  ownerDraws: number;
  manualExpenses: number;
  growthMarketingCashOut: number;
  issuedReferralRewardCashOut: number;
  growthReferralCashOut: number;
  netChangeInCash: number;
  beginningCash: number;
  endingCash: number;
  reportableTransactions: number;
};

type CashFlowData = {
  accounts: PlaidAccountRow[];
  plaidTransactions: PlaidTransactionRow[];
  manualExpenses: ExpenseLedgerRow[];
  growthMarketingExpenses: GrowthMarketingExpenseRow[];
  issuedReferralRewards: ReferralRewardLiabilityRow[];
  customLines: CashFlowLine[];
  operatingLines: CashFlowLine[];
  investingLines: CashFlowLine[];
  financingLines: CashFlowLine[];
  transferLines: CashFlowLine[];
  cashPositionLines: CashFlowLine[];
  recentActivity: CashActivityRow[];
  needsReviewActivity: CashActivityRow[];
  recentGrowthReferralActivity: CashActivityRow[];
  period: PeriodWindow;
  previousMetrics: CashFlowMetrics;
  totals: CashFlowMetrics & {
    connectedAccounts: number;
    currentBalance: number;
    availableBalance: number;
    totalBankTransactions: number;
    pendingCount: number;
    postedCount: number;
    needsReviewCount: number;
    manualExpenseCount: number;
    customLineCount: number;
    maxVisualValue: number;
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

const SECTION_LABELS: Record<CashFlowSectionKey, string> = {
  operating: "Operating Activities",
  investing: "Investing Activities",
  financing: "Financing Activities",
  transfers: "Business Account Transfers",
  cash_position: "Cash Position",
};

const SECTION_OPTIONS: { value: CashFlowSectionKey; label: string }[] = [
  { value: "operating", label: "Operating Activities" },
  { value: "investing", label: "Investing Activities" },
  { value: "financing", label: "Financing Activities" },
  { value: "transfers", label: "Business Account Transfers" },
  { value: "cash_position", label: "Cash Position" },
];

const LINE_PRESETS = [
  { section: "operating", label: "Stripe / Payment Cash Received" },
  { section: "operating", label: "Other Operating Cash In" },
  { section: "operating", label: "Cash Paid for Operating Expenses" },
  { section: "operating", label: "Refunds / Credits Paid" },
  { section: "operating", label: "Payment Processing Fees" },
  { section: "investing", label: "Equipment Purchases" },
  { section: "investing", label: "Software / Platform Asset Investment" },
  { section: "investing", label: "Other Long-Term Asset Activity" },
  { section: "financing", label: "Owner Contributions" },
  { section: "financing", label: "Owner Draws" },
  { section: "financing", label: "Loans Received" },
  { section: "financing", label: "Loan Repayments" },
  { section: "transfers", label: "Transfer To Savings" },
  { section: "transfers", label: "Transfer From Savings" },
  { section: "cash_position", label: "Beginning Cash Balance" },
  { section: "cash_position", label: "Manual Cash Adjustment" },
] as const;

const DEFAULT_CASH_FLOW_LINES: CashFlowLine[] = [
  {
    id: "core-operating-cash-in",
    dbId: "",
    isSaved: false,
    section: "operating",
    label: "Reviewed Bank Cash In",
    amount: 0,
    notes: "Reviewed bank-credit transactions from NFCU Business Checking/Savings. Cash movement only; Stripe/payments drive P&L revenue.",
    displayOrder: 10,
    source: "admin_plaid_transactions",
  },
  {
    id: "core-operating-cash-out",
    dbId: "",
    isSaved: false,
    section: "operating",
    label: "Cash Out for Expenses",
    amount: 0,
    notes: "Reviewed expense transactions from NFCU Business Checking/Savings.",
    displayOrder: 20,
    source: "admin_plaid_transactions",
  },
  {
    id: "core-manual-expenses",
    dbId: "",
    isSaved: false,
    section: "operating",
    label: "Manual Operating Expenses",
    amount: 0,
    notes: "Manual expenses added to the expense ledger.",
    displayOrder: 30,
    source: "expense_ledger",
  },
  {
    id: "core-growth-marketing-expenses",
    dbId: "",
    isSaved: false,
    section: "operating",
    label: "Growth Marketing Cash Out",
    amount: 0,
    notes: "Campaign costs from Growth & Referrals marketing expense views.",
    displayOrder: 40,
    source: "admin_growth_marketing_expenses",
  },
  {
    id: "core-issued-referral-rewards",
    dbId: "",
    isSaved: false,
    section: "operating",
    label: "Issued Referral Rewards Cash Out",
    amount: 0,
    notes:
      "Issued PawPerks, Ambassador, Guru, Partner, or referral rewards paid or credited.",
    displayOrder: 50,
    source: "admin_referral_reward_liability",
  },
  {
    id: "core-owner-contributions",
    dbId: "",
    isSaved: false,
    section: "financing",
    label: "Owner Contributions",
    amount: 0,
    notes: "Owner contribution or equity cash-in transactions.",
    displayOrder: 10,
    source: "admin_plaid_transactions",
  },
  {
    id: "core-owner-draws",
    dbId: "",
    isSaved: false,
    section: "financing",
    label: "Owner Draws",
    amount: 0,
    notes: "Owner draw or equity cash-out transactions.",
    displayOrder: 20,
    source: "admin_plaid_transactions",
  },
  {
    id: "core-transfer-in",
    dbId: "",
    isSaved: false,
    section: "transfers",
    label: "Transfer In",
    amount: 0,
    notes:
      "Transfers into the active business accounts. Shown separately from P&L.",
    displayOrder: 10,
    source: "admin_plaid_transactions",
  },
  {
    id: "core-transfer-out",
    dbId: "",
    isSaved: false,
    section: "transfers",
    label: "Transfer Out",
    amount: 0,
    notes:
      "Transfers out of the active business accounts. Shown separately from P&L.",
    displayOrder: 20,
    source: "admin_plaid_transactions",
  },
  {
    id: "core-current-cash",
    dbId: "",
    isSaved: false,
    section: "cash_position",
    label: "Current Cash Balance",
    amount: 0,
    notes:
      "Current balance across NFCU Business Checking and Business Savings.",
    displayOrder: 10,
    source: "admin_plaid_accounts",
  },
  {
    id: "core-available-cash",
    dbId: "",
    isSaved: false,
    section: "cash_position",
    label: "Available Cash Balance",
    amount: 0,
    notes: "Available cash across NFCU Business Checking and Business Savings.",
    displayOrder: 20,
    source: "admin_plaid_accounts",
  },
];

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

function formatSignedPercent(value: number) {
  if (!Number.isFinite(value)) return "0.0%";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

function formatSignedMoney(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${moneyExact(value)}`;
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

function isWithinWindow(
  dateValue: string | null | undefined,
  window: PeriodWindow,
) {
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

function getBarWidth(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.max(4, Math.min(100, (Math.abs(value) / max) * 100));
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Cash flow query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Cash flow query skipped for ${label}:`, error);
    return [];
  }
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

  const profileChecks = await Promise.all([
    safeRows<Record<string, unknown>>(
      supabaseAdmin
        .from("admin_users")
        .select("role,email,is_active,can_access_financials")
        .eq("user_id", user.id)
        .limit(1),
      "admin_users_finance_access",
    ),
    safeRows<Record<string, unknown>>(
      supabaseAdmin
        .from("profiles")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "profiles_finance_access",
    ),
    safeRows<Record<string, unknown>>(
      supabaseAdmin
        .from("users")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "users_finance_access",
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

async function writeFinancialAuditLog({
  actor,
  action,
  targetType,
  targetId,
  metadata,
}: {
  actor: AdminIdentity;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  const payload = {
    actor_id: actor.id,
    actor_email: actor.email,
    actor_role: actor.role,
    action,
    area: "financials.cash_flow",
    target_type: targetType,
    target_id: targetId || null,
    metadata: metadata || {},
    created_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabaseAdmin
      .from("financial_audit_logs")
      .insert(payload);

    if (!error) return;
  } catch {
    // Keep financial actions from failing if the audit table is not created yet.
  }

  try {
    await supabaseAdmin.from("admin_audit_logs").insert(payload);
  } catch (error) {
    console.warn("Financial audit log skipped:", error);
  }
}

async function addCashFlowLine(formData: FormData) {
  "use server";

  const actor = await requireFinancialAdminAction("add_cash_flow_line");
  if (!actor) return;

  const section = String(formData.get("section") || "").trim();
  const preset = String(formData.get("preset") || "").trim();
  const customLabel = String(formData.get("customLabel") || "").trim();
  const amount = Number(formData.get("amount") || 0);
  const notes = String(formData.get("notes") || "").trim();

  const validSection = SECTION_OPTIONS.some((item) => item.value === section);

  if (!validSection) return;

  const label = customLabel || preset;

  if (!label) return;

  const { data: insertedLine } = await supabaseAdmin
    .from("cash_flow_lines")
    .insert({
      section,
      label,
      amount: Number.isFinite(amount) ? amount : 0,
      notes,
      display_order: 100,
      source: "manual_admin",
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  await writeFinancialAuditLog({
    actor,
    action: "add_cash_flow_line",
    targetType: "cash_flow_line",
    targetId: asTrimmedString(
      (insertedLine as Record<string, unknown> | null)?.id,
    ),
    metadata: { section, label, amount, notes },
  });

  revalidatePath("/admin/financials/cash-flow");
}

async function deleteCashFlowLine(formData: FormData) {
  "use server";

  const actor = await requireFinancialAdminAction("deactivate_cash_flow_line");
  if (!actor) return;

  const lineId = String(formData.get("lineId") || "").trim();

  if (!lineId) return;

  await supabaseAdmin
    .from("cash_flow_lines")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", lineId);

  await writeFinancialAuditLog({
    actor,
    action: "deactivate_cash_flow_line",
    targetType: "cash_flow_line",
    targetId: lineId,
  });

  revalidatePath("/admin/financials/cash-flow");
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

function isArchivedCashFlowLine(row: CashFlowLineRow) {
  return Boolean(
    row.deleted_at ||
    row.archived_at ||
    row.is_deleted === true ||
    row.is_active === false,
  );
}

function isBusinessCheckingOrSavings(account: PlaidAccountRow) {
  const name =
    `${account.name || ""} ${account.official_name || ""}`.toLowerCase();
  const subtype = String(account.subtype || "").toLowerCase();

  return (
    (subtype === "checking" || subtype === "savings") &&
    name.includes("business")
  );
}

function getTransactionDate(transaction: PlaidTransactionRow) {
  return transaction.date || transaction.created_at || null;
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

function isReviewed(transaction: PlaidTransactionRow) {
  const reviewStatus = getReviewStatus(transaction);
  return reviewStatus === "reviewed" || reviewStatus === "auto_categorized";
}

function getBankStatus(transaction: PlaidTransactionRow) {
  return transaction.pending ? "Pending" : "Posted";
}

function getTransactionAmount(transaction: PlaidTransactionRow) {
  return Math.abs(toNumber(transaction.amount));
}

function getSignedCashAmount(transaction: PlaidTransactionRow) {
  const type = getTransactionType(transaction);
  const amount = getTransactionAmount(transaction);

  if (type === "income" || type === "owner_equity") return amount;
  if (type === "expense" || type === "owner_draw" || type === "liability") {
    return -amount;
  }

  if (type === "transfer") {
    const name =
      `${transaction.name || ""} ${transaction.merchant_name || ""}`.toLowerCase();

    if (
      name.includes("from savings") ||
      name.includes("to checking") ||
      name.includes("deposit")
    ) {
      return amount;
    }

    return -amount;
  }

  return toNumber(transaction.amount);
}

function shouldIncludeCashTransaction(transaction: PlaidTransactionRow) {
  const type = getTransactionType(transaction);

  return (
    !transaction.removed_at &&
    !transaction.is_excluded_from_reports &&
    isReviewed(transaction) &&
    [
      "income",
      "expense",
      "transfer",
      "owner_equity",
      "owner_draw",
      "liability",
    ].includes(type)
  );
}

function isNeedsReview(transaction: PlaidTransactionRow) {
  return (
    !transaction.removed_at &&
    !transaction.is_excluded_from_reports &&
    getReviewStatus(transaction) === "needs_review"
  );
}

function getManualExpenseName(row: ExpenseLedgerRow) {
  return (
    asTrimmedString(row.name) ||
    asTrimmedString(row.description) ||
    "Manual operating expense"
  );
}

function getManualExpenseCategory(row: ExpenseLedgerRow) {
  return asTrimmedString(row.category) || "Manual Expense";
}

function getManualExpenseAmount(row: ExpenseLedgerRow) {
  return (
    toNumber(row.amount) ||
    toNumber(row.total_amount) ||
    toNumber(row.expense_amount) ||
    toNumber(row.cost)
  );
}

function getManualExpenseDate(row: ExpenseLedgerRow) {
  return (
    asTrimmedString(row.created_at) ||
    asTrimmedString(row.date) ||
    asTrimmedString(row.expense_date)
  );
}

function getManualExpenseId(row: ExpenseLedgerRow, index: number) {
  return (
    asTrimmedString(row.id) ||
    asTrimmedString(row.expense_id) ||
    `${getManualExpenseName(row)}-${index}`
  );
}

function getGrowthExpenseName(row: GrowthMarketingExpenseRow) {
  return (
    asTrimmedString(row.campaign_name) ||
    asTrimmedString(row.cost_type) ||
    "Growth marketing expense"
  );
}

function getGrowthExpenseCategory(row: GrowthMarketingExpenseRow) {
  return (
    asTrimmedString(row.financial_category) ||
    asTrimmedString(row.cost_type) ||
    "Growth Marketing Expense"
  );
}

function getGrowthExpenseAmount(row: GrowthMarketingExpenseRow) {
  return Math.abs(
    toNumber(row.amount) ||
      toNumber(row.spend) ||
      toNumber(row.ad_spend) ||
      toNumber(row.marketing_spend),
  );
}

function getGrowthExpenseDate(row: GrowthMarketingExpenseRow) {
  return (
    asTrimmedString(row.cost_date) ||
    asTrimmedString(row.created_at) ||
    asTrimmedString(row.updated_at)
  );
}

function getGrowthExpenseId(row: GrowthMarketingExpenseRow, index: number) {
  return (
    asTrimmedString(row.id) ||
    asTrimmedString(row.campaign_id) ||
    `${getGrowthExpenseName(row)}-${index}`
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

function getReferralRewardName(row: ReferralRewardLiabilityRow) {
  return (
    asTrimmedString(row.financial_category) ||
    asTrimmedString(row.reward_type) ||
    asTrimmedString(row.type) ||
    "Issued referral reward"
  );
}

function getReferralRewardAmount(row: ReferralRewardLiabilityRow) {
  return Math.abs(
    toNumber(row.normalized_amount) ||
      toNumber(row.reward_amount) ||
      toNumber(row.credit_amount) ||
      toNumber(row.payout_amount) ||
      toNumber(row.commission_amount) ||
      toNumber(row.amount),
  );
}

function getReferralRewardDate(row: ReferralRewardLiabilityRow) {
  return (
    asTrimmedString(row.paid_at) ||
    asTrimmedString(row.issued_at) ||
    asTrimmedString(row.credited_at) ||
    asTrimmedString(row.completed_at) ||
    asTrimmedString(row.updated_at) ||
    asTrimmedString(row.created_at)
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

function getCashFlowSection(value: unknown): CashFlowSectionKey {
  const section = asTrimmedString(value) as CashFlowSectionKey;

  if (
    section === "operating" ||
    section === "investing" ||
    section === "financing" ||
    section === "transfers" ||
    section === "cash_position"
  ) {
    return section;
  }

  return "operating";
}

function normalizeCashFlowLine(
  row: CashFlowLineRow,
  index: number,
): CashFlowLine {
  const section = getCashFlowSection(row.section);
  const dbId = asTrimmedString(row.id);

  return {
    id: dbId || `${section}-${asTrimmedString(row.label)}-${index}`,
    dbId,
    isSaved: Boolean(dbId),
    section,
    label: asTrimmedString(row.label) || "Cash flow line",
    amount: toNumber(row.amount),
    notes: asTrimmedString(row.notes),
    displayOrder: toNumber(row.display_order) || 100,
    source: asTrimmedString(row.source) || "manual_admin",
  };
}

function toCashActivity(transaction: PlaidTransactionRow): CashActivityRow {
  return {
    id: transaction.transaction_id || transaction.id,
    date: formatDateShort(getTransactionDate(transaction)),
    description: asTrimmedString(transaction.name) || "Bank transaction",
    merchant: asTrimmedString(transaction.merchant_name) || "—",
    category: getTransactionCategory(transaction),
    type: getTransactionType(transaction),
    section: getTransactionSection(transaction),
    bankStatus: getBankStatus(transaction),
    source: "Plaid/NFCU",
    amount: getSignedCashAmount(transaction),
  };
}

function toManualCashActivity(
  row: ExpenseLedgerRow,
  index: number,
): CashActivityRow {
  return {
    id: getManualExpenseId(row, index),
    date: formatDateShort(getManualExpenseDate(row)),
    description: getManualExpenseName(row),
    merchant: "Manual entry",
    category: getManualExpenseCategory(row),
    type: "expense",
    section: "Operating Expenses",
    bankStatus: "Manual",
    source: "Manual",
    amount: -Math.abs(getManualExpenseAmount(row)),
  };
}

function toGrowthMarketingCashActivity(
  row: GrowthMarketingExpenseRow,
  index: number,
): CashActivityRow {
  return {
    id: getGrowthExpenseId(row, index),
    date: formatDateShort(getGrowthExpenseDate(row)),
    description: getGrowthExpenseName(row),
    merchant:
      asTrimmedString(row.vendor) ||
      asTrimmedString(row.source) ||
      "Growth campaign",
    category: getGrowthExpenseCategory(row),
    type: "expense",
    section: "Operating Activities",
    bankStatus: "Financial View",
    source: "Growth/Referrals",
    amount: -Math.abs(getGrowthExpenseAmount(row)),
  };
}

function toReferralRewardCashActivity(
  row: ReferralRewardLiabilityRow,
  index: number,
): CashActivityRow {
  return {
    id: getReferralRewardId(row, index),
    date: formatDateShort(getReferralRewardDate(row)),
    description: getReferralRewardName(row),
    merchant: asTrimmedString(row.source_table) || "Referral rewards",
    category: asTrimmedString(row.financial_category) || "Referral Rewards",
    type: "expense",
    section: "Operating Activities",
    bankStatus: "Issued",
    source: "Growth/Referrals",
    amount: -Math.abs(getReferralRewardAmount(row)),
  };
}

function calculateCashFlowMetrics({
  transactions,
  manualExpenses,
  growthMarketingExpenses,
  issuedReferralRewards,
  currentBalance,
}: {
  transactions: PlaidTransactionRow[];
  manualExpenses: ExpenseLedgerRow[];
  growthMarketingExpenses: GrowthMarketingExpenseRow[];
  issuedReferralRewards: ReferralRewardLiabilityRow[];
  currentBalance: number;
}): CashFlowMetrics {
  const cashTransactions = transactions.filter(shouldIncludeCashTransaction);

  const incomeTransactions = cashTransactions.filter(
    (transaction) => getTransactionType(transaction) === "income",
  );

  const expenseTransactions = cashTransactions.filter(
    (transaction) => getTransactionType(transaction) === "expense",
  );

  const transferTransactions = cashTransactions.filter(
    (transaction) => getTransactionType(transaction) === "transfer",
  );

  const ownerContributionTransactions = cashTransactions.filter(
    (transaction) => getTransactionType(transaction) === "owner_equity",
  );

  const ownerDrawTransactions = cashTransactions.filter(
    (transaction) => getTransactionType(transaction) === "owner_draw",
  );

  const liabilityTransactions = cashTransactions.filter(
    (transaction) => getTransactionType(transaction) === "liability",
  );

  const operatingCashIn = incomeTransactions.reduce(
    (sum, transaction) => sum + getTransactionAmount(transaction),
    0,
  );

  const operatingCashOut = expenseTransactions.reduce(
    (sum, transaction) => sum + getTransactionAmount(transaction),
    0,
  );

  const manualExpenseTotal = manualExpenses.reduce(
    (sum, row) => sum + Math.abs(getManualExpenseAmount(row)),
    0,
  );

  const growthMarketingCashOut = growthMarketingExpenses.reduce(
    (sum, row) => sum + Math.abs(getGrowthExpenseAmount(row)),
    0,
  );

  const issuedReferralRewardCashOut = issuedReferralRewards.reduce(
    (sum, row) => sum + Math.abs(getReferralRewardAmount(row)),
    0,
  );

  const growthReferralCashOut =
    growthMarketingCashOut + issuedReferralRewardCashOut;

  const transferIn = transferTransactions
    .map(getSignedCashAmount)
    .filter((amount) => amount > 0)
    .reduce((sum, amount) => sum + amount, 0);

  const transferOut = transferTransactions
    .map(getSignedCashAmount)
    .filter((amount) => amount < 0)
    .reduce((sum, amount) => sum + Math.abs(amount), 0);

  const ownerContributions = ownerContributionTransactions.reduce(
    (sum, transaction) => sum + getTransactionAmount(transaction),
    0,
  );

  const ownerDraws = ownerDrawTransactions.reduce(
    (sum, transaction) => sum + getTransactionAmount(transaction),
    0,
  );

  const liabilityCashImpact = liabilityTransactions.reduce(
    (sum, transaction) => sum + getSignedCashAmount(transaction),
    0,
  );

  const netOperatingCash =
    operatingCashIn -
    operatingCashOut -
    manualExpenseTotal -
    growthReferralCashOut;
  const netInvestingCash = 0;
  const netFinancingCash =
    ownerContributions - ownerDraws + liabilityCashImpact;
  const netTransferCash = transferIn - transferOut;
  const cashIn =
    operatingCashIn + ownerContributions + Math.max(0, liabilityCashImpact);
  const cashOut =
    operatingCashOut +
    manualExpenseTotal +
    growthReferralCashOut +
    ownerDraws +
    Math.abs(Math.min(0, liabilityCashImpact));

  const netChangeInCash =
    netOperatingCash + netInvestingCash + netFinancingCash;
  const beginningCash = currentBalance - netChangeInCash;
  const endingCash = beginningCash + netChangeInCash;

  return {
    cashIn,
    cashOut,
    operatingCashIn,
    operatingCashOut,
    netOperatingCash,
    netInvestingCash,
    netFinancingCash,
    transferIn,
    transferOut,
    netTransferCash,
    ownerContributions,
    ownerDraws,
    manualExpenses: manualExpenseTotal,
    growthMarketingCashOut,
    issuedReferralRewardCashOut,
    growthReferralCashOut,
    netChangeInCash,
    beginningCash,
    endingCash,
    reportableTransactions:
      cashTransactions.length +
      manualExpenses.length +
      growthMarketingExpenses.length +
      issuedReferralRewards.length,
  };
}

function buildCoreLines({
  metrics,
  currentBalance,
  availableBalance,
}: {
  metrics: CashFlowMetrics;
  currentBalance: number;
  availableBalance: number;
}) {
  return DEFAULT_CASH_FLOW_LINES.map((line) => {
    if (line.id === "core-operating-cash-in") {
      return { ...line, amount: metrics.operatingCashIn };
    }

    if (line.id === "core-operating-cash-out") {
      return { ...line, amount: -Math.abs(metrics.operatingCashOut) };
    }

    if (line.id === "core-manual-expenses") {
      return { ...line, amount: -Math.abs(metrics.manualExpenses) };
    }

    if (line.id === "core-growth-marketing-expenses") {
      return { ...line, amount: -Math.abs(metrics.growthMarketingCashOut) };
    }

    if (line.id === "core-issued-referral-rewards") {
      return {
        ...line,
        amount: -Math.abs(metrics.issuedReferralRewardCashOut),
      };
    }

    if (line.id === "core-owner-contributions") {
      return { ...line, amount: metrics.ownerContributions };
    }

    if (line.id === "core-owner-draws") {
      return { ...line, amount: -Math.abs(metrics.ownerDraws) };
    }

    if (line.id === "core-transfer-in") {
      return { ...line, amount: metrics.transferIn };
    }

    if (line.id === "core-transfer-out") {
      return { ...line, amount: -Math.abs(metrics.transferOut) };
    }

    if (line.id === "core-current-cash") {
      return { ...line, amount: currentBalance };
    }

    if (line.id === "core-available-cash") {
      return { ...line, amount: availableBalance };
    }

    return line;
  });
}

async function getCashFlowData(periodKey: PeriodKey): Promise<CashFlowData> {
  const period = getPeriodWindow(periodKey);

  const [
    accounts,
    transactions,
    manualExpenses,
    customLineRows,
    growthMarketingExpenseRows,
    referralRewardRows,
  ] = await Promise.all([
    safeRows<PlaidAccountRow>(
      supabaseAdmin
        .from("admin_plaid_accounts")
        .select(
          "id, account_id, item_id, name, official_name, mask, type, subtype, current_balance, available_balance, iso_currency_code, created_at, updated_at",
        )
        .order("created_at", { ascending: false }),
      "admin_plaid_accounts",
    ),
    safeRows<PlaidTransactionRow>(
      supabaseAdmin
        .from("admin_plaid_transactions")
        .select(
          "id, transaction_id, item_id, account_id, name, merchant_name, amount, iso_currency_code, date, pending, payment_channel, sitguru_category, sitguru_category_type, sitguru_report_section, sitguru_notes, review_status, is_excluded_from_reports, manually_categorized, removed_at, created_at, updated_at",
        )
        .is("removed_at", null)
        .order("date", { ascending: false })
        .limit(5000),
      "admin_plaid_transactions",
    ),
    safeRows<ExpenseLedgerRow>(
      supabaseAdmin
        .from("expense_ledger")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2500),
      "expense_ledger",
    ),
    safeRows<CashFlowLineRow>(
      supabaseAdmin
        .from("cash_flow_lines")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(500),
      "cash_flow_lines",
    ),
    safeRows<GrowthMarketingExpenseRow>(
      supabaseAdmin
        .from("admin_growth_marketing_expenses")
        .select("*")
        .order("cost_date", { ascending: false })
        .limit(2500),
      "admin_growth_marketing_expenses",
    ),
    safeRows<ReferralRewardLiabilityRow>(
      supabaseAdmin
        .from("admin_referral_reward_liability")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2500),
      "admin_referral_reward_liability",
    ),
  ]);

  const businessAccounts = accounts.filter(isBusinessCheckingOrSavings);
  const allowedAccountIds = new Set(
    businessAccounts.map((account) => account.account_id),
  );

  const businessTransactions = transactions
    .filter((transaction) => allowedAccountIds.has(transaction.account_id))
    .filter((transaction) => !transaction.removed_at);

  const periodTransactions = businessTransactions.filter((transaction) =>
    isWithinWindow(getTransactionDate(transaction), period),
  );

  const previousTransactions = businessTransactions.filter((transaction) =>
    isWithinPreviousWindow(getTransactionDate(transaction), period),
  );

  const activeManualExpenses = manualExpenses.filter(
    (row) => !isArchivedExpense(row),
  );

  const periodManualExpenses = activeManualExpenses.filter((row) =>
    isWithinWindow(getManualExpenseDate(row), period),
  );

  const previousManualExpenses = activeManualExpenses.filter((row) =>
    isWithinPreviousWindow(getManualExpenseDate(row), period),
  );

  const periodGrowthMarketingExpenses = growthMarketingExpenseRows.filter(
    (row) => isWithinWindow(getGrowthExpenseDate(row), period),
  );

  const previousGrowthMarketingExpenses = growthMarketingExpenseRows.filter(
    (row) => isWithinPreviousWindow(getGrowthExpenseDate(row), period),
  );

  const activeIssuedReferralRewards = referralRewardRows.filter(
    isIssuedReferralReward,
  );

  const periodIssuedReferralRewards = activeIssuedReferralRewards.filter(
    (row) => isWithinWindow(getReferralRewardDate(row), period),
  );

  const previousIssuedReferralRewards = activeIssuedReferralRewards.filter(
    (row) => isWithinPreviousWindow(getReferralRewardDate(row), period),
  );

  const currentBalance = businessAccounts.reduce(
    (sum, account) => sum + toNumber(account.current_balance),
    0,
  );

  const availableBalance = businessAccounts.reduce(
    (sum, account) => sum + toNumber(account.available_balance),
    0,
  );

  const metrics = calculateCashFlowMetrics({
    transactions: periodTransactions,
    manualExpenses: periodManualExpenses,
    growthMarketingExpenses: periodGrowthMarketingExpenses,
    issuedReferralRewards: periodIssuedReferralRewards,
    currentBalance,
  });

  const previousMetrics = calculateCashFlowMetrics({
    transactions: previousTransactions,
    manualExpenses: previousManualExpenses,
    growthMarketingExpenses: previousGrowthMarketingExpenses,
    issuedReferralRewards: previousIssuedReferralRewards,
    currentBalance,
  });

  const savedLines = customLineRows
    .filter((row) => !isArchivedCashFlowLine(row))
    .map(normalizeCashFlowLine);

  const coreLines = buildCoreLines({
    metrics,
    currentBalance,
    availableBalance,
  });

  const allLines = [...coreLines, ...savedLines].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label),
  );

  const operatingLines = allLines.filter(
    (line) => line.section === "operating",
  );
  const investingLines = allLines.filter(
    (line) => line.section === "investing",
  );
  const financingLines = allLines.filter(
    (line) => line.section === "financing",
  );
  const transferLines = allLines.filter((line) => line.section === "transfers");
  const cashPositionLines = allLines.filter(
    (line) => line.section === "cash_position",
  );

  const recentGrowthReferralActivity = [
    ...periodGrowthMarketingExpenses.map(toGrowthMarketingCashActivity),
    ...periodIssuedReferralRewards.map(toReferralRewardCashActivity),
  ];

  const recentActivity = [
    ...periodTransactions
      .filter(shouldIncludeCashTransaction)
      .map(toCashActivity),
    ...periodManualExpenses.map(toManualCashActivity),
    ...recentGrowthReferralActivity,
  ]
    .sort((a, b) => {
      const left = new Date(a.date).getTime();
      const right = new Date(b.date).getTime();

      if (Number.isNaN(left) || Number.isNaN(right)) return 0;

      return right - left;
    })
    .slice(0, 18);

  const needsReviewActivity = periodTransactions
    .filter(isNeedsReview)
    .slice(0, 12)
    .map(toCashActivity);

  const pendingCount = periodTransactions.filter(
    (transaction) => transaction.pending,
  ).length;

  const postedCount = periodTransactions.length - pendingCount;

  const needsReviewCount = periodTransactions.filter(isNeedsReview).length;

  const maxVisualValue = Math.max(
    Math.abs(metrics.cashIn),
    Math.abs(metrics.cashOut),
    Math.abs(metrics.netOperatingCash),
    Math.abs(metrics.netFinancingCash),
    Math.abs(metrics.netChangeInCash),
    Math.abs(currentBalance),
    1,
  );

  return {
    accounts: businessAccounts,
    plaidTransactions: periodTransactions,
    manualExpenses: periodManualExpenses,
    growthMarketingExpenses: periodGrowthMarketingExpenses,
    issuedReferralRewards: periodIssuedReferralRewards,
    customLines: savedLines,
    operatingLines,
    investingLines,
    financingLines,
    transferLines,
    cashPositionLines,
    recentActivity,
    needsReviewActivity,
    recentGrowthReferralActivity: recentGrowthReferralActivity.slice(0, 12),
    period,
    previousMetrics,
    totals: {
      ...metrics,
      connectedAccounts: businessAccounts.length,
      currentBalance,
      availableBalance,
      totalBankTransactions: periodTransactions.length,
      pendingCount,
      postedCount,
      needsReviewCount,
      manualExpenseCount: periodManualExpenses.length,
      customLineCount: savedLines.length,
      maxVisualValue,
    },
  };
}

function PeriodSelector({ currentPeriod }: { currentPeriod: PeriodKey }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PERIOD_OPTIONS.map((period) => (
        <Link
          key={period.key}
          href={`/admin/financials/cash-flow?period=${period.key}`}
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

function ExportLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-emerald-100 bg-white px-3 py-2 text-center text-xs font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
    >
      {label}
    </Link>
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

function SummaryBar({
  label,
  value,
  max,
  tone,
  detail,
}: {
  label: string;
  value: number;
  max: number;
  tone: string;
  detail: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-950">{label}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <p
          className={`text-sm font-bold ${
            value < 0 ? "text-rose-700" : "text-slate-950"
          }`}
        >
          {money(value)}
        </p>
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

function CashFlowSection({
  title,
  lines,
  totalLabel,
  totalValue,
}: {
  title: string;
  lines: CashFlowLine[];
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
        {lines.length ? (
          lines.map((line) => (
            <div
              key={line.id}
              className="grid gap-3 px-4 py-4 text-slate-600 sm:grid-cols-[minmax(0,1fr)_140px_110px] sm:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold leading-tight text-slate-950">
                    {line.label}
                  </p>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                      line.isSaved
                        ? "border-blue-100 bg-blue-50 text-blue-700"
                        : "border-emerald-100 bg-white text-emerald-700"
                    }`}
                  >
                    {line.isSaved ? "Custom" : "Core"}
                  </span>
                </div>

                {line.notes ? (
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                    {line.notes}
                  </p>
                ) : null}

                <p className="mt-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                  {line.source}
                </p>
              </div>

              <p
                className={`text-right text-sm font-black tabular-nums sm:text-base ${
                  line.amount < 0 ? "text-rose-700" : "text-slate-950"
                }`}
              >
                {money(line.amount)}
              </p>

              <div className="flex justify-end">
                {line.isSaved ? (
                  <form action={deleteCashFlowLine}>
                    <input type="hidden" name="lineId" value={line.dbId} />
                    <button
                      type="submit"
                      className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                    >
                      Deactivate
                    </button>
                  </form>
                ) : (
                  <span className="rounded-full border border-slate-100 bg-white px-3 py-1.5 text-xs font-bold text-slate-500">
                    Locked
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-4 text-sm text-slate-500">
            No lines added in this section yet.
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

function CashActivityTable({
  title,
  eyebrow,
  description,
  rows,
  emptyMessage,
}: {
  title: string;
  eyebrow: string;
  description: string;
  rows: CashActivityRow[];
  emptyMessage: string;
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
                  Category
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                  Type
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                  Bank Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em]">
                  Cash Impact
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.length ? (
                rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-4 font-semibold text-slate-600">
                      {row.date}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-black text-slate-950">
                        {row.description}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {row.merchant} · {row.source}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                        {row.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-semibold capitalize text-slate-600">
                      {row.type.replaceAll("_", " ")}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={
                          row.bankStatus === "Pending"
                            ? "rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800"
                            : row.bankStatus === "Manual"
                              ? "rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700"
                              : "rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800"
                        }
                      >
                        {row.bankStatus}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-4 text-right font-black ${
                        row.amount < 0 ? "text-rose-700" : "text-slate-950"
                      }`}
                    >
                      {moneyExact(row.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
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

function ReadinessPanel({ cashFlow }: { cashFlow: CashFlowData }) {
  const items = [
    {
      label: "NFCU Business Accounts",
      ready: cashFlow.totals.connectedAccounts >= 2,
      detail:
        cashFlow.totals.connectedAccounts >= 2
          ? `${cashFlow.totals.connectedAccounts} business accounts are connected.`
          : "Connect NFCU Business Checking and Business Savings.",
    },
    {
      label: "Cash Flow Transactions",
      ready: cashFlow.totals.reportableTransactions > 0,
      detail: `${cashFlow.totals.reportableTransactions} cash-flow-ready rows are included for ${cashFlow.period.label}.`,
    },
    {
      label: "Needs Review Queue",
      ready: cashFlow.totals.needsReviewCount === 0,
      detail: cashFlow.totals.needsReviewCount
        ? `${cashFlow.totals.needsReviewCount} transactions need review before they can affect cash reporting.`
        : "No cash transactions are waiting for review in this period.",
    },
    {
      label: "Manual Expenses",
      ready: cashFlow.totals.manualExpenseCount > 0,
      detail: `${cashFlow.totals.manualExpenseCount} manual expense rows are included in this period.`,
    },
    {
      label: "Growth / Referral Cash Out",
      ready: cashFlow.totals.growthReferralCashOut > 0,
      detail: `${money(cashFlow.totals.growthMarketingCashOut)} campaign cash out and ${money(cashFlow.totals.issuedReferralRewardCashOut)} issued referral rewards are included.`,
    },
    {
      label: "Transfer Visibility",
      ready: cashFlow.totals.transferIn > 0 || cashFlow.totals.transferOut > 0,
      detail: `${money(cashFlow.totals.transferIn)} transfer in and ${money(cashFlow.totals.transferOut)} transfer out.`,
    },
    {
      label: "Cash Position",
      ready:
        cashFlow.totals.currentBalance !== 0 ||
        cashFlow.totals.availableBalance !== 0,
      detail: `${moneyExact(cashFlow.totals.currentBalance)} current cash and ${moneyExact(cashFlow.totals.availableBalance)} available cash.`,
    },
  ];

  const readyCount = items.filter((item) => item.ready).length;

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Cash Flow Readiness
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Bank feed and reporting checks
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            This checks whether NFCU business accounts, categorized cash
            activity, manual expenses, transfers, and cash balances are ready
            for the selected period. Bank cash-in is cash movement only; Stripe/payments drive P&L revenue.
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

function AddCashFlowLinePanel({ cashFlow }: { cashFlow: CashFlowData }) {
  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Manual Cash Flow Controls
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Add operating, investing, financing, transfer, or cash-position
            lines.
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use this for one-off cash adjustments, loans, owner contributions,
            platform investment, reserve transfers, or beginning cash entries.
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-[#fbfefd] px-4 py-3 text-sm font-bold text-slate-600">
          {cashFlow.totals.customLineCount > 0
            ? `${cashFlow.totals.customLineCount} saved cash flow lines`
            : "Using core lines only"}
        </div>
      </div>

      <form action={addCashFlowLine} className="mt-6 grid gap-4 xl:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Section
          </label>
          <select
            name="section"
            defaultValue=""
            className="mt-2 w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            required
          >
            <option value="" disabled>
              Choose section...
            </option>
            {SECTION_OPTIONS.map((section) => (
              <option key={section.value} value={section.value}>
                {section.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Preset Label
          </label>
          <select
            name="preset"
            defaultValue=""
            className="mt-2 w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">Optional preset...</option>
            {LINE_PRESETS.map((item) => (
              <option key={`${item.section}-${item.label}`} value={item.label}>
                {SECTION_LABELS[item.section as CashFlowSectionKey]} —{" "}
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Custom Label
          </label>
          <input
            name="customLabel"
            type="text"
            placeholder="Example: Owner Contribution, Loan Received..."
            className="mt-2 w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Amount
          </label>
          <input
            name="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            className="mt-2 w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        <div className="xl:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Notes
          </label>
          <input
            name="notes"
            type="text"
            placeholder="Optional notes"
            className="mt-2 w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        <button
          type="submit"
          className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/10 transition hover:bg-emerald-800 xl:col-span-2"
        >
          Add Cash Flow Line
        </button>
      </form>
    </section>
  );
}

export default async function AdminCashFlowPage({
  searchParams,
}: AdminCashFlowPageProps) {
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
            Sign in with a finance-enabled admin account to view SitGuru Cash
            Flow reports.
          </p>
        </div>
      </div>
    );
  }

  const cashFlow = await getCashFlowData(selectedPeriod);

  const visualRows = [
    {
      label: "Cash In",
      value: cashFlow.totals.cashIn,
      detail:
        "Reviewed bank cash-in, owner contributions, and positive financing cash movement. This is cash movement, not P&L revenue.",
      tone: "bg-emerald-400",
    },
    {
      label: "Cash Out",
      value: -Math.abs(cashFlow.totals.cashOut),
      detail:
        "Expenses, manual expenses, growth marketing, issued rewards, owner draws, and negative financing movement.",
      tone: "bg-rose-400",
    },
    {
      label: "Net Operating Cash",
      value: cashFlow.totals.netOperatingCash,
      detail: "Operating cash in minus operating cash out and manual expenses.",
      tone:
        cashFlow.totals.netOperatingCash >= 0
          ? "bg-emerald-400"
          : "bg-rose-400",
    },
    {
      label: "Net Change in Cash",
      value: cashFlow.totals.netChangeInCash,
      detail:
        "Operating + investing + financing movement. Transfers are shown separately.",
      tone:
        cashFlow.totals.netChangeInCash >= 0 ? "bg-violet-400" : "bg-amber-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7fbf8] px-3 py-4 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1640px] space-y-5 sm:space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(420px,620px)] 2xl:items-start">
            <div className="max-w-5xl self-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                Admin / Financials / Cash Flow
              </p>

              <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                SitGuru Cash Flow by period.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                Tracks real cash movement from NFCU Business Checking and
                Business Savings, including reviewed bank credits, expenses, owner
                contributions, owner draws, transfers, manual expenses, growth
                marketing cash out, issued referral rewards, pending activity,
                and current cash position.
              </p>

              <div className="mt-5">
                <PeriodSelector currentPeriod={cashFlow.period.key} />
              </div>

              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-black text-emerald-950">
                  Viewing: {cashFlow.period.label}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                  {cashFlow.period.comparisonLabel}
                </p>
              </div>

              {cashFlow.totals.needsReviewCount ? (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-black text-amber-900">
                    {cashFlow.totals.needsReviewCount} transaction
                    {cashFlow.totals.needsReviewCount === 1 ? "" : "s"} need
                    review before they affect this cash flow report.
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

            <div className="rounded-[1.5rem] border border-emerald-100 bg-[#fbfefd] p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Cash Flow Actions
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <ActionLink href="/admin/financials" label="Financials" />
                <ActionLink href="/admin/financials/profit-loss" label="P&L" />
                <ActionLink href="/admin/financials/plaid" label="Banking" />
                <ActionLink
                  href="/admin/financials/reconciliation"
                  label="Reconcile"
                  primary
                />
              </div>

              <div className="mt-4 rounded-xl border border-slate-100 bg-white p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Export Statement
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <ExportLink
                    href="/api/admin/financials/cash-flow/export?format=csv"
                    label="CSV"
                  />
                  <ExportLink
                    href="/api/admin/financials/cash-flow/export?format=excel"
                    label="Excel"
                  />
                  <ExportLink
                    href="/api/admin/financials/cash-flow/export?format=word"
                    label="Word"
                  />
                  <ExportLink
                    href="/api/admin/financials/cash-flow/export?format=pdf"
                    label="PDF"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Cash In"
              value={money(cashFlow.totals.cashIn)}
              change={getMetricChange(
                cashFlow.totals.cashIn,
                cashFlow.previousMetrics.cashIn,
              )}
              comparisonLabel={cashFlow.period.comparisonLabel}
              detail="Reviewed bank cash-in, owner contributions, and positive cash movement. Stripe/payments drive revenue."
              tone="emerald"
            />

            <StatCard
              label="Cash Out"
              value={money(cashFlow.totals.cashOut)}
              change={getMetricChange(
                cashFlow.totals.cashOut,
                cashFlow.previousMetrics.cashOut,
              )}
              comparisonLabel={cashFlow.period.comparisonLabel}
              detail="Expenses, manual expenses, growth marketing, issued referral rewards, owner draws, and cash outflows."
              tone="rose"
            />

            <StatCard
              label="Net Cash Flow"
              value={money(cashFlow.totals.netChangeInCash)}
              change={getMetricChange(
                cashFlow.totals.netChangeInCash,
                cashFlow.previousMetrics.netChangeInCash,
              )}
              comparisonLabel={cashFlow.period.comparisonLabel}
              detail="Operating + investing + financing movement."
              tone={cashFlow.totals.netChangeInCash >= 0 ? "violet" : "amber"}
            />

            <StatCard
              label="Reportable Transactions"
              value={cashFlow.totals.reportableTransactions.toLocaleString()}
              detail={`${cashFlow.totals.postedCount} posted, ${cashFlow.totals.pendingCount} pending, ${cashFlow.totals.manualExpenseCount} manual expenses.`}
              tone="sky"
            />

            <StatCard
              label="Current Cash Position"
              value={moneyExact(cashFlow.totals.currentBalance)}
              detail={`${moneyExact(cashFlow.totals.availableBalance)} available across NFCU Business Checking/Savings.`}
              tone="emerald"
            />
          </div>
        </section>

        <ReadinessPanel cashFlow={cashFlow} />

        <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          <AddCashFlowLinePanel cashFlow={cashFlow} />

          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Cash Flow Visuals
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Cash in, cash out, and net movement.
            </h2>

            <div className="mt-6 space-y-5">
              {visualRows.map((row) => (
                <SummaryBar
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  max={cashFlow.totals.maxVisualValue}
                  tone={row.tone}
                  detail={row.detail}
                />
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Beginning Cash
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {moneyExact(cashFlow.totals.beginningCash)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Ending Cash
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {moneyExact(cashFlow.totals.endingCash)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Transfers In / Out
                </p>
                <p className="mt-2 text-xl font-black text-slate-950">
                  {money(cashFlow.totals.transferIn)} /{" "}
                  {money(cashFlow.totals.transferOut)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Owner Equity Movement
                </p>
                <p className="mt-2 text-xl font-black text-slate-950">
                  {money(
                    cashFlow.totals.ownerContributions -
                      cashFlow.totals.ownerDraws,
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Consolidated Statement
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                {cashFlow.period.label} Statement of Cash Flows
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Current SitGuru cash flow statement from NFCU business bank
                activity, reviewed categories, transfer activity, owner equity
                movement, manual expenses, and custom cash flow lines.
              </p>
            </div>

            <div className="p-4 sm:p-6">
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-[#fbfefd]">
                <div className="hidden grid-cols-[minmax(0,1fr)_140px_110px] gap-4 border-b border-slate-100 bg-slate-50 px-4 py-4 sm:grid">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-950">
                    Line Item
                  </p>
                  <p className="text-right text-xs font-black uppercase tracking-[0.2em] text-slate-950">
                    Current
                  </p>
                  <p className="text-right text-xs font-black uppercase tracking-[0.2em] text-slate-950">
                    Status
                  </p>
                </div>

                <CashFlowSection
                  title="Operating Activities"
                  lines={cashFlow.operatingLines}
                  totalLabel="Net Cash from Operating Activities"
                  totalValue={cashFlow.totals.netOperatingCash}
                />

                <CashFlowSection
                  title="Investing Activities"
                  lines={cashFlow.investingLines}
                  totalLabel="Net Cash from Investing Activities"
                  totalValue={cashFlow.totals.netInvestingCash}
                />

                <CashFlowSection
                  title="Financing Activities"
                  lines={cashFlow.financingLines}
                  totalLabel="Net Cash from Financing Activities"
                  totalValue={cashFlow.totals.netFinancingCash}
                />

                <CashFlowSection
                  title="Business Account Transfers"
                  lines={cashFlow.transferLines}
                  totalLabel="Net Transfer Movement"
                  totalValue={cashFlow.totals.netTransferCash}
                />

                <div className="grid grid-cols-[1fr_auto] gap-4 border-y border-slate-100 bg-slate-100 px-4 py-3 font-black text-slate-950">
                  <p>Net Change in Cash</p>
                  <p
                    className={
                      cashFlow.totals.netChangeInCash < 0
                        ? "text-rose-700"
                        : "text-slate-950"
                    }
                  >
                    {money(cashFlow.totals.netChangeInCash)}
                  </p>
                </div>

                <CashFlowSection
                  title="Cash Position"
                  lines={cashFlow.cashPositionLines}
                  totalLabel="Ending Cash Position"
                  totalValue={cashFlow.totals.endingCash}
                />

                <div className="grid grid-cols-[1fr_auto] gap-4 border-t border-emerald-400/30 bg-emerald-50 px-4 py-4 font-black text-slate-950">
                  <p>Available Cash</p>
                  <p>{moneyExact(cashFlow.totals.availableBalance)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Cash Flow Health
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Liquidity and bank movement.
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Operating Cash Flow
                  </p>
                  <p
                    className={`mt-2 text-2xl font-black ${
                      cashFlow.totals.netOperatingCash >= 0
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    {money(cashFlow.totals.netOperatingCash)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Current Cash
                  </p>
                  <p
                    className={`mt-2 text-2xl font-black ${
                      cashFlow.totals.currentBalance >= 0
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    {moneyExact(cashFlow.totals.currentBalance)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Bank Rows
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {cashFlow.totals.totalBankTransactions.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Growth / Referral Cash Out
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {money(cashFlow.totals.growthReferralCashOut)}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                  Cash Flow Note
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Transfers between NFCU Business Checking and Business Savings
                  are shown separately so the bank movement is visible without
                  incorrectly treating transfers as revenue or operating
                  expense. Reviewed bank cash-in is also kept separate from
                  P&L revenue unless supported by Stripe/payment records.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5 sm:p-6 lg:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                SitGuru Cash Flow Notes
              </p>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
                P&L shows profit. Cash Flow shows actual money movement. This
                page includes reviewed bank credits, expenses, manual operating expenses, owner
                equity, owner draws, transfers, growth marketing cash out,
                issued referral reward cash out, pending activity, posted bank
                activity, and available cash from NFCU business banking.
              </p>
            </div>
          </div>
        </section>

        <CashActivityTable
          eyebrow="Recent Cash Activity"
          title="Transactions included in cash flow"
          description="Reviewed cash-impacting Plaid/NFCU transactions and manual operating expenses for the selected period. Bank cash-in is shown as cash movement, not platform revenue."
          rows={cashFlow.recentActivity}
          emptyMessage="No reviewed cash-flow activity is available for this period yet."
        />

        <CashActivityTable
          eyebrow="Growth & Referral Cash Out"
          title="Growth costs included in cash flow"
          description="Campaign costs and issued referral rewards from the live Growth & Referrals financial views included as operating cash outflows."
          rows={cashFlow.recentGrowthReferralActivity}
          emptyMessage="No growth marketing expenses or issued referral rewards are included in this period yet."
        />

        <CashActivityTable
          eyebrow="Needs Review"
          title="Transactions not included yet"
          description="These transactions need review before they can affect the cash flow statement."
          rows={cashFlow.needsReviewActivity}
          emptyMessage="No transactions are waiting for review in this period."
        />
      </div>
    </div>
  );
}
