import Link from "next/link";
import { revalidatePath } from "next/cache";
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

type BalanceSectionKey =
  | "current_assets"
  | "non_current_assets"
  | "current_liabilities"
  | "long_term_liabilities"
  | "equity";

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

type BalanceLine = {
  id: string;
  dbId: string;
  isSaved: boolean;
  section: BalanceSectionKey;
  label: string;
  amount: number;
  notes: string;
  displayOrder: number;
  source: "core" | "manual" | "plaid" | "calculated";
};

type BalanceReadinessItem = {
  label: string;
  status: "ready" | "needs_review" | "missing";
  detail: string;
};

type BalanceSheetData = {
  currentAssets: BalanceLine[];
  nonCurrentAssets: BalanceLine[];
  currentLiabilities: BalanceLine[];
  longTermLiabilities: BalanceLine[];
  equityLines: BalanceLine[];
  readinessItems: BalanceReadinessItem[];
  recentBankRows: {
    id: string;
    date: string;
    description: string;
    category: string;
    type: string;
    amount: number;
    status: string;
  }[];
  recentManualExpenses: {
    id: string;
    date: string;
    name: string;
    amount: number;
    category: string;
  }[];
  savedLineCount: number;
  totals: {
    businessAccountCount: number;
    businessCheckingBalance: number;
    businessSavingsBalance: number;
    currentCashBalance: number;
    availableCashBalance: number;
    totalCurrentAssets: number;
    totalNonCurrentAssets: number;
    totalAssets: number;
    totalCurrentLiabilities: number;
    totalLongTermLiabilities: number;
    totalLiabilities: number;
    ownerContributions: number;
    ownerDraws: number;
    currentNetIncome: number;
    retainedEarnings: number;
    totalEquity: number;
    liabilitiesPlusEquity: number;
    balanceDifference: number;
    isBalanced: boolean;
    bankTransactionCount: number;
    needsReviewCount: number;
    manualExpenseCount: number;
    trustSafetyReceivableTotal: number;
    pawstepReceivable: number;
    bookAndBarkReceivable: number;
    maxVisualValue: number;
  };
};

const SECTION_LABELS: Record<BalanceSectionKey, string> = {
  current_assets: "Current Assets",
  non_current_assets: "Non-Current Assets",
  current_liabilities: "Current Liabilities",
  long_term_liabilities: "Long-Term Liabilities",
  equity: "Equity",
};

const SECTION_OPTIONS: { value: BalanceSectionKey; label: string }[] = [
  { value: "current_assets", label: "Current Assets" },
  { value: "non_current_assets", label: "Non-Current Assets" },
  { value: "current_liabilities", label: "Current Liabilities" },
  { value: "long_term_liabilities", label: "Long-Term Liabilities" },
  { value: "equity", label: "Equity" },
];

const LINE_PRESETS = [
  { section: "current_assets", label: "NFCU Business Checking" },
  { section: "current_assets", label: "NFCU Business Savings" },
  { section: "current_assets", label: "Stripe Balance / Pending Receipts" },
  { section: "current_assets", label: "Accounts Receivable" },
  { section: "current_assets", label: "Trust & Safety Receivables" },
  { section: "current_assets", label: "Pawstep Installment Receivable" },
  { section: "current_assets", label: "Book & Bark Booking Deduction Receivable" },
  { section: "current_assets", label: "Prepaid Expenses" },
  { section: "non_current_assets", label: "Equipment" },
  { section: "non_current_assets", label: "Office Furniture" },
  { section: "non_current_assets", label: "Intangible Assets / Software" },
  { section: "non_current_assets", label: "Other Long-Term Assets" },
  { section: "current_liabilities", label: "Accounts Payable" },
  { section: "current_liabilities", label: "Guru Payouts Payable" },
  { section: "current_liabilities", label: "Sales Tax Payable" },
  { section: "current_liabilities", label: "Refunds Payable" },
  { section: "current_liabilities", label: "Disputes / Chargebacks Payable" },
  { section: "long_term_liabilities", label: "Bank Loan" },
  { section: "long_term_liabilities", label: "Long-Term Debt" },
  { section: "long_term_liabilities", label: "Lease Obligations" },
  { section: "equity", label: "Owner’s Capital" },
  { section: "equity", label: "Owner Draws" },
  { section: "equity", label: "Retained Earnings" },
  { section: "equity", label: "Current Net Income / Loss" },
] as const;

const CORE_BALANCE_LINES: BalanceLine[] = [
  {
    id: "core-nfcu-business-checking",
    dbId: "",
    isSaved: false,
    section: "current_assets",
    label: "NFCU Business Checking",
    amount: 0,
    notes: "Current balance from connected NFCU Business Checking through Plaid.",
    displayOrder: 5,
    source: "plaid",
  },
  {
    id: "core-nfcu-business-savings",
    dbId: "",
    isSaved: false,
    section: "current_assets",
    label: "NFCU Business Savings",
    amount: 0,
    notes: "Current balance from connected NFCU Business Savings through Plaid.",
    displayOrder: 8,
    source: "plaid",
  },
  {
    id: "core-available-cash",
    dbId: "",
    isSaved: false,
    section: "current_assets",
    label: "Available Cash",
    amount: 0,
    notes: "Available cash across NFCU Business Checking and Savings.",
    displayOrder: 10,
    source: "plaid",
  },
  {
    id: "core-trust-safety-receivables",
    dbId: "",
    isSaved: false,
    section: "current_assets",
    label: "Trust & Safety Receivables",
    amount: 0,
    notes: "Outstanding Pawstep and Book & Bark Trust & Safety balances expected to be collected.",
    displayOrder: 30,
    source: "calculated",
  },
  {
    id: "core-pawstep-receivable",
    dbId: "",
    isSaved: false,
    section: "current_assets",
    label: "Pawstep Installment Receivable",
    amount: 0,
    notes: "Remaining Pawstep Plan balances expected through automatic installment payments.",
    displayOrder: 35,
    source: "calculated",
  },
  {
    id: "core-book-bark-receivable",
    dbId: "",
    isSaved: false,
    section: "current_assets",
    label: "Book & Bark Booking Deduction Receivable",
    amount: 0,
    notes: "Remaining Book & Bark balances expected to be recovered from future completed booking payouts.",
    displayOrder: 36,
    source: "calculated",
  },
  {
    id: "core-guru-payouts-payable",
    dbId: "",
    isSaved: false,
    section: "current_liabilities",
    label: "Guru Payouts Payable",
    amount: 0,
    notes: "Estimated payable placeholder for unreleased Guru payouts.",
    displayOrder: 10,
    source: "calculated",
  },
  {
    id: "core-refunds-payable",
    dbId: "",
    isSaved: false,
    section: "current_liabilities",
    label: "Refunds / Disputes Payable",
    amount: 0,
    notes: "Manual or future Stripe-backed refund and dispute exposure.",
    displayOrder: 30,
    source: "calculated",
  },
  {
    id: "core-owner-contributions",
    dbId: "",
    isSaved: false,
    section: "equity",
    label: "Owner Contributions",
    amount: 0,
    notes: "Owner contribution transactions categorized from bank activity.",
    displayOrder: 10,
    source: "calculated",
  },
  {
    id: "core-owner-draws",
    dbId: "",
    isSaved: false,
    section: "equity",
    label: "Owner Draws",
    amount: 0,
    notes: "Owner draw transactions categorized from bank activity.",
    displayOrder: 20,
    source: "calculated",
  },
  {
    id: "core-retained-earnings",
    dbId: "",
    isSaved: false,
    section: "equity",
    label: "Retained Earnings",
    amount: 0,
    notes: "Manual retained earnings or opening balance adjustments can be added below.",
    displayOrder: 30,
    source: "core",
  },
  {
    id: "core-current-net-income",
    dbId: "",
    isSaved: false,
    section: "equity",
    label: "Current Net Income / Loss",
    amount: 0,
    notes: "Estimated from reviewed NFCU income and expense transactions plus manual operating expenses.",
    displayOrder: 40,
    source: "calculated",
  },
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
    maximumFractionDigits: 0,
  }).format(Math.abs(value || 0));

  return value < 0 ? `(${formatted})` : formatted;
}

function moneyExact(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(value || 0));

  return value < 0 ? `(${formatted})` : formatted;
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
      console.warn(`Balance sheet query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Balance sheet query skipped for ${label}:`, error);
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
    safeRows<AnyRow>(
      supabaseAdmin
        .from("admin_users")
        .select("role,email,is_active,can_access_financials")
        .eq("user_id", user.id)
        .limit(1),
      "admin_users_balance_sheet_access",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("profiles")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "profiles_balance_sheet_access",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("users")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "users_balance_sheet_access",
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
    console.warn(`Blocked balance sheet admin action: ${action}`);
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
    area: "financials.balance_sheet",
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
    console.warn("Balance sheet audit log skipped:", error);
  }
}

async function addBalanceSheetLine(formData: FormData) {
  "use server";

  const actor = await requireFinancialAdminAction("add_balance_sheet_line");

  if (!actor) return;

  const section = String(formData.get("section") || "").trim();
  const preset = String(formData.get("preset") || "").trim();
  const customLabel = String(formData.get("customLabel") || "").trim();
  const amount = Number(formData.get("amount") || 0);
  const notes = String(formData.get("notes") || "").trim();

  const isValidSection = SECTION_OPTIONS.some((item) => item.value === section);

  if (!isValidSection) return;

  const label = customLabel || preset;

  if (!label) return;

  const { data: insertedLine } = await supabaseAdmin
    .from("balance_sheet_lines")
    .insert({
      section,
      label,
      amount: Number.isFinite(amount) ? amount : 0,
      notes,
      display_order: 100,
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  await writeFinancialAuditLog({
    actor,
    action: "add_balance_sheet_line",
    targetType: "balance_sheet_line",
    targetId: asTrimmedString((insertedLine as AnyRow | null)?.id),
    metadata: { section, label, amount, notes },
  });

  revalidatePath("/admin/financials/balance-sheet");
}

async function deleteBalanceSheetLine(formData: FormData) {
  "use server";

  const actor = await requireFinancialAdminAction("deactivate_balance_sheet_line");

  if (!actor) return;

  const lineId = String(formData.get("lineId") || "").trim();

  if (!lineId) return;

  await supabaseAdmin
    .from("balance_sheet_lines")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", lineId);

  await writeFinancialAuditLog({
    actor,
    action: "deactivate_balance_sheet_line",
    targetType: "balance_sheet_line",
    targetId: lineId,
  });

  revalidatePath("/admin/financials/balance-sheet");
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

function isBusinessCheckingOrSavings(account: PlaidAccountRow) {
  const name = `${account.name || ""} ${account.official_name || ""}`.toLowerCase();
  const subtype = String(account.subtype || "").toLowerCase();

  return (
    (subtype === "checking" || subtype === "savings") &&
    name.includes("business")
  );
}

function isBusinessChecking(account: PlaidAccountRow) {
  const name = `${account.name || ""} ${account.official_name || ""}`.toLowerCase();
  const subtype = String(account.subtype || "").toLowerCase();

  return subtype === "checking" && name.includes("business");
}

function isBusinessSavings(account: PlaidAccountRow) {
  const name = `${account.name || ""} ${account.official_name || ""}`.toLowerCase();
  const subtype = String(account.subtype || "").toLowerCase();

  return subtype === "savings" && name.includes("business");
}

function getTransactionType(transaction: PlaidTransactionRow) {
  return (
    asTrimmedString(transaction.sitguru_category_type).toLowerCase() ||
    "uncategorized"
  );
}

function getTransactionCategory(transaction: PlaidTransactionRow) {
  return asTrimmedString(transaction.sitguru_category) || "Uncategorized";
}

function getReviewStatus(transaction: PlaidTransactionRow) {
  return asTrimmedString(transaction.review_status) || "needs_review";
}

function isReviewed(transaction: PlaidTransactionRow) {
  const reviewStatus = getReviewStatus(transaction);
  return reviewStatus === "reviewed" || reviewStatus === "auto_categorized";
}

function isReportableTransaction(transaction: PlaidTransactionRow) {
  return (
    !transaction.removed_at &&
    !transaction.is_excluded_from_reports &&
    isReviewed(transaction)
  );
}

function getAbsoluteTransactionAmount(transaction: PlaidTransactionRow) {
  return Math.abs(toNumber(transaction.amount));
}

function getManualExpenseAmount(row: AnyRow) {
  return (
    toNumber(row.amount) ||
    toNumber(row.total_amount) ||
    toNumber(row.expense_amount) ||
    toNumber(row.cost)
  );
}

function getManualExpenseName(row: AnyRow) {
  return (
    asTrimmedString(row.name) ||
    asTrimmedString(row.description) ||
    "Manual expense"
  );
}

function getManualExpenseDate(row: AnyRow) {
  return (
    asTrimmedString(row.created_at) ||
    asTrimmedString(row.date) ||
    asTrimmedString(row.expense_date)
  );
}

function getManualExpenseCategory(row: AnyRow) {
  return asTrimmedString(row.category) || "Other Expense";
}

function getTrustSafetyPlanKey(purchase: AnyRow) {
  return asTrimmedString(purchase.plan_key).toLowerCase();
}

function isActiveTrustSafetyPurchase(purchase: AnyRow) {
  const paymentStatus = asTrimmedString(purchase.payment_status).toLowerCase();
  const repaymentStatus = asTrimmedString(purchase.repayment_status).toLowerCase();

  return (
    !["canceled", "cancelled", "refunded", "voided", "failed"].includes(
      paymentStatus,
    ) && repaymentStatus !== "canceled"
  );
}

function getTrustSafetyRemainingBalance(purchase: AnyRow) {
  if (!isActiveTrustSafetyPurchase(purchase)) return 0;

  return Math.max(0, centsToDollars(purchase.remaining_balance_cents));
}

function getTrustSafetyBookingDeductionRemaining(purchase: AnyRow) {
  if (!isActiveTrustSafetyPurchase(purchase)) return 0;

  const bookingDeductionRemaining = centsToDollars(
    purchase.booking_deduction_remaining_cents,
  );

  return Math.max(
    0,
    bookingDeductionRemaining || getTrustSafetyRemainingBalance(purchase),
  );
}

function getTrustSafetyReceivableTotal(purchases: AnyRow[]) {
  return purchases.reduce(
    (sum, purchase) => sum + getTrustSafetyRemainingBalance(purchase),
    0,
  );
}

function getTrustSafetyReceivableForPlan(purchases: AnyRow[], planKey: string) {
  return purchases
    .filter((purchase) => getTrustSafetyPlanKey(purchase) === planKey)
    .reduce((sum, purchase) => sum + getTrustSafetyRemainingBalance(purchase), 0);
}

function getTrustSafetyBookingDeductionReceivable(purchases: AnyRow[]) {
  return purchases
    .filter((purchase) => getTrustSafetyPlanKey(purchase) === "book_and_bark_plan")
    .reduce(
      (sum, purchase) => sum + getTrustSafetyBookingDeductionRemaining(purchase),
      0,
    );
}

function getManualLineSection(line: AnyRow): BalanceSectionKey {
  const section = asTrimmedString(line.section) as BalanceSectionKey;

  if (
    section === "current_assets" ||
    section === "non_current_assets" ||
    section === "current_liabilities" ||
    section === "long_term_liabilities" ||
    section === "equity"
  ) {
    return section;
  }

  return "current_assets";
}

function normalizeManualLine(line: AnyRow, index: number): BalanceLine {
  const dbId = asTrimmedString(line.id);
  const section = getManualLineSection(line);

  return {
    id: dbId || `${section}-${asTrimmedString(line.label)}-${index}`,
    dbId,
    isSaved: Boolean(dbId),
    section,
    label: asTrimmedString(line.label) || "Balance sheet line",
    amount: toNumber(line.amount),
    notes: asTrimmedString(line.notes),
    displayOrder: toNumber(line.display_order) || 100,
    source: "manual",
  };
}

function buildCoreLines({
  checkingBalance,
  savingsBalance,
  availableCashBalance,
  trustSafetyReceivableTotal,
  pawstepReceivable,
  bookAndBarkReceivable,
  ownerContributions,
  ownerDraws,
  currentNetIncome,
}: {
  checkingBalance: number;
  savingsBalance: number;
  availableCashBalance: number;
  trustSafetyReceivableTotal: number;
  pawstepReceivable: number;
  bookAndBarkReceivable: number;
  ownerContributions: number;
  ownerDraws: number;
  currentNetIncome: number;
}) {
  return CORE_BALANCE_LINES.map((line) => {
    if (line.id === "core-nfcu-business-checking") {
      return { ...line, amount: checkingBalance };
    }

    if (line.id === "core-nfcu-business-savings") {
      return { ...line, amount: savingsBalance };
    }

    if (line.id === "core-available-cash") {
      return { ...line, amount: availableCashBalance };
    }

    if (line.id === "core-trust-safety-receivables") {
      return { ...line, amount: trustSafetyReceivableTotal };
    }

    if (line.id === "core-pawstep-receivable") {
      return { ...line, amount: pawstepReceivable };
    }

    if (line.id === "core-book-bark-receivable") {
      return { ...line, amount: bookAndBarkReceivable };
    }

    if (line.id === "core-owner-contributions") {
      return { ...line, amount: ownerContributions };
    }

    if (line.id === "core-owner-draws") {
      return { ...line, amount: -Math.abs(ownerDraws) };
    }

    if (line.id === "core-current-net-income") {
      return { ...line, amount: currentNetIncome };
    }

    return line;
  });
}

function getReadinessItems({
  businessAccountCount,
  bankTransactionCount,
  needsReviewCount,
  manualLineCount,
  totalAssets,
  totalLiabilities,
  totalEquity,
  isBalanced,
  trustSafetyReceivableTotal,
}: {
  businessAccountCount: number;
  bankTransactionCount: number;
  needsReviewCount: number;
  manualLineCount: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  isBalanced: boolean;
  trustSafetyReceivableTotal: number;
}): BalanceReadinessItem[] {
  return [
    {
      label: "NFCU Business Accounts",
      status: businessAccountCount >= 2 ? "ready" : "needs_review",
      detail:
        businessAccountCount >= 2
          ? `${businessAccountCount} NFCU business accounts are connected through Plaid.`
          : "Connect NFCU Business Checking and Business Savings so cash balances are complete.",
    },
    {
      label: "Bank Transactions",
      status: bankTransactionCount > 0 ? "ready" : "needs_review",
      detail: `${bankTransactionCount.toLocaleString()} NFCU/Plaid transactions are available to support equity, cash, and current net income.`,
    },
    {
      label: "Needs Review Queue",
      status: needsReviewCount === 0 ? "ready" : "needs_review",
      detail: needsReviewCount
        ? `${needsReviewCount.toLocaleString()} bank transactions still need category review.`
        : "No active bank transactions are currently waiting for category review.",
    },
    {
      label: "Manual Balance Lines",
      status: manualLineCount > 0 ? "ready" : "needs_review",
      detail: manualLineCount
        ? `${manualLineCount.toLocaleString()} manual balance sheet rows are saved.`
        : "Add manual rows for owner capital, retained earnings, loans, equipment, opening balances, or CPA adjustments.",
    },
    {
      label: "Trust & Safety Receivables",
      status: trustSafetyReceivableTotal > 0 ? "ready" : "needs_review",
      detail: trustSafetyReceivableTotal
        ? `${money(trustSafetyReceivableTotal)} in Trust & Safety receivables is reflected.`
        : "No outstanding Trust & Safety receivables are currently reflected from financed plans.",
    },
    {
      label: "Assets Captured",
      status: totalAssets > 0 ? "ready" : "missing",
      detail: `${money(totalAssets)} in assets is reflected on the balance sheet.`,
    },
    {
      label: "Liabilities and Equity",
      status: totalLiabilities !== 0 || totalEquity !== 0 ? "ready" : "needs_review",
      detail: `${money(totalLiabilities)} liabilities and ${money(totalEquity)} equity are reflected.`,
    },
    {
      label: "Balance Equation",
      status: isBalanced ? "ready" : "missing",
      detail: isBalanced
        ? "Assets equal liabilities plus equity within the current rounding threshold."
        : "Add or adjust owner capital, retained earnings, debt, opening balances, or liability lines until the balance sheet balances.",
    },
  ];
}

async function getBalanceSheetData(): Promise<BalanceSheetData> {
  const [
    manualLines,
    accounts,
    transactions,
    expenses,
    trustSafetyPurchases,
  ] = await Promise.all([
    safeRows<AnyRow>(
      supabaseAdmin
        .from("balance_sheet_lines")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(500),
      "balance_sheet_lines",
    ),
    safeRows<PlaidAccountRow>(
      supabaseAdmin
        .from("admin_plaid_accounts")
        .select(
          "id, account_id, item_id, name, official_name, mask, type, subtype, current_balance, available_balance, iso_currency_code, created_at, updated_at",
        )
        .order("created_at", { ascending: false })
        .limit(500),
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
    safeRows<AnyRow>(
      supabaseAdmin
        .from("expense_ledger")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2500),
      "expense_ledger",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("guru_trust_safety_plan_purchases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3000),
      "guru_trust_safety_plan_purchases",
    ),
  ]);

  const activeManualLines = manualLines.filter((row) => !isArchivedRow(row));
  const activeExpenses = expenses.filter((row) => !isArchivedRow(row));
  const activeTrustSafetyPurchases = trustSafetyPurchases.filter(
    (row) => !isArchivedRow(row),
  );

  const businessAccounts = accounts.filter(isBusinessCheckingOrSavings);
  const allowedAccountIds = new Set(
    businessAccounts.map((account) => account.account_id),
  );

  const businessTransactions = transactions
    .filter((transaction) => allowedAccountIds.has(transaction.account_id))
    .filter((transaction) => !transaction.removed_at);

  const reviewedTransactions = businessTransactions.filter(isReportableTransaction);
  const needsReviewTransactions = businessTransactions.filter(
    (transaction) =>
      !transaction.removed_at &&
      !transaction.is_excluded_from_reports &&
      getReviewStatus(transaction) === "needs_review",
  );

  const checkingBalance = businessAccounts
    .filter(isBusinessChecking)
    .reduce((sum, account) => sum + toNumber(account.current_balance), 0);

  const savingsBalance = businessAccounts
    .filter(isBusinessSavings)
    .reduce((sum, account) => sum + toNumber(account.current_balance), 0);

  const availableCashBalance = businessAccounts.reduce(
    (sum, account) => sum + toNumber(account.available_balance),
    0,
  );

  const currentCashBalance = businessAccounts.reduce(
    (sum, account) => sum + toNumber(account.current_balance),
    0,
  );

  const incomeTotal = reviewedTransactions
    .filter((transaction) => getTransactionType(transaction) === "income")
    .reduce((sum, transaction) => sum + getAbsoluteTransactionAmount(transaction), 0);

  const expenseTotal = reviewedTransactions
    .filter((transaction) => getTransactionType(transaction) === "expense")
    .reduce((sum, transaction) => sum + getAbsoluteTransactionAmount(transaction), 0);

  const manualExpenseTotal = activeExpenses.reduce(
    (sum, expense) => sum + getManualExpenseAmount(expense),
    0,
  );

  const ownerContributions = reviewedTransactions
    .filter((transaction) => getTransactionType(transaction) === "owner_equity")
    .reduce((sum, transaction) => sum + getAbsoluteTransactionAmount(transaction), 0);

  const ownerDraws = reviewedTransactions
    .filter((transaction) => getTransactionType(transaction) === "owner_draw")
    .reduce((sum, transaction) => sum + getAbsoluteTransactionAmount(transaction), 0);

  const currentNetIncome = incomeTotal - expenseTotal - manualExpenseTotal;

  const trustSafetyReceivableTotal = getTrustSafetyReceivableTotal(
    activeTrustSafetyPurchases,
  );
  const pawstepReceivable = getTrustSafetyReceivableForPlan(
    activeTrustSafetyPurchases,
    "pawstep_plan",
  );
  const bookAndBarkReceivable = getTrustSafetyBookingDeductionReceivable(
    activeTrustSafetyPurchases,
  );

  const coreLines = buildCoreLines({
    checkingBalance,
    savingsBalance,
    availableCashBalance,
    trustSafetyReceivableTotal,
    pawstepReceivable,
    bookAndBarkReceivable,
    ownerContributions,
    ownerDraws,
    currentNetIncome,
  });

  const normalizedManualLines = activeManualLines
    .map(normalizeManualLine)
    .sort(
      (a, b) =>
        a.displayOrder - b.displayOrder || a.label.localeCompare(b.label),
    );

  const allLines = [...coreLines, ...normalizedManualLines].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label),
  );

  const currentAssets = allLines.filter((line) => line.section === "current_assets");
  const nonCurrentAssets = allLines.filter(
    (line) => line.section === "non_current_assets",
  );
  const currentLiabilities = allLines.filter(
    (line) => line.section === "current_liabilities",
  );
  const longTermLiabilities = allLines.filter(
    (line) => line.section === "long_term_liabilities",
  );
  const equityLines = allLines.filter((line) => line.section === "equity");

  const totalCurrentAssets = currentAssets.reduce(
    (sum, line) => sum + line.amount,
    0,
  );
  const totalNonCurrentAssets = nonCurrentAssets.reduce(
    (sum, line) => sum + line.amount,
    0,
  );
  const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

  const totalCurrentLiabilities = currentLiabilities.reduce(
    (sum, line) => sum + line.amount,
    0,
  );
  const totalLongTermLiabilities = longTermLiabilities.reduce(
    (sum, line) => sum + line.amount,
    0,
  );
  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

  const retainedEarnings = equityLines
    .filter((line) => line.label.toLowerCase().includes("retained"))
    .reduce((sum, line) => sum + line.amount, 0);

  const totalEquity = equityLines.reduce((sum, line) => sum + line.amount, 0);
  const liabilitiesPlusEquity = totalLiabilities + totalEquity;
  const balanceDifference = totalAssets - liabilitiesPlusEquity;
  const isBalanced = Math.abs(balanceDifference) < 1;

  const maxVisualValue = Math.max(
    Math.abs(totalAssets),
    Math.abs(totalLiabilities),
    Math.abs(totalEquity),
    Math.abs(balanceDifference),
    1,
  );

  const recentBankRows = businessTransactions.slice(0, 10).map((transaction) => ({
    id: transaction.transaction_id || transaction.id,
    date: formatDateShort(transaction.date || transaction.created_at),
    description:
      asTrimmedString(transaction.merchant_name) ||
      asTrimmedString(transaction.name) ||
      "Bank transaction",
    category: getTransactionCategory(transaction),
    type: getTransactionType(transaction),
    amount: toNumber(transaction.amount),
    status: transaction.pending ? "Pending" : "Posted",
  }));

  const recentManualExpenses = activeExpenses.slice(0, 8).map((expense, index) => ({
    id: asTrimmedString(expense.id) || `${getManualExpenseName(expense)}-${index}`,
    date: formatDateShort(getManualExpenseDate(expense)),
    name: getManualExpenseName(expense),
    amount: getManualExpenseAmount(expense),
    category: getManualExpenseCategory(expense),
  }));

  const readinessItems = getReadinessItems({
    businessAccountCount: businessAccounts.length,
    bankTransactionCount: businessTransactions.length,
    needsReviewCount: needsReviewTransactions.length,
    manualLineCount: normalizedManualLines.length,
    totalAssets,
    totalLiabilities,
    totalEquity,
    isBalanced,
    trustSafetyReceivableTotal,
  });

  return {
    currentAssets,
    nonCurrentAssets,
    currentLiabilities,
    longTermLiabilities,
    equityLines,
    readinessItems,
    recentBankRows,
    recentManualExpenses,
    savedLineCount: normalizedManualLines.length,
    totals: {
      businessAccountCount: businessAccounts.length,
      businessCheckingBalance: checkingBalance,
      businessSavingsBalance: savingsBalance,
      currentCashBalance,
      availableCashBalance,
      totalCurrentAssets,
      totalNonCurrentAssets,
      totalAssets,
      totalCurrentLiabilities,
      totalLongTermLiabilities,
      totalLiabilities,
      ownerContributions,
      ownerDraws,
      currentNetIncome,
      retainedEarnings,
      totalEquity,
      liabilitiesPlusEquity,
      balanceDifference,
      isBalanced,
      bankTransactionCount: businessTransactions.length,
      needsReviewCount: needsReviewTransactions.length,
      manualExpenseCount: activeExpenses.length,
      trustSafetyReceivableTotal,
      pawstepReceivable,
      bookAndBarkReceivable,
      maxVisualValue,
    },
  };
}

function StatCard({
  label,
  value,
  detail,
  tone = "emerald",
}: {
  label: string;
  value: string;
  detail: string;
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
      className="inline-flex items-center justify-center rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
    >
      {label}
    </Link>
  );
}

function BalanceExportPanel() {
  return (
    <div className="w-full rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm xl:max-w-[560px]">
      <div className="flex flex-wrap gap-2">
        <ActionLink href="/admin/financials" label="Financials" />
        <ActionLink href="/admin/financials/profit-loss" label="P&L" />
        <ActionLink href="/admin/financials/cash-flow" label="Cash Flow" />
        <ActionLink href="/admin/financials/general-ledger" label="Ledger" />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-100 bg-[#fbfefd] p-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
          Statement Exports
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
          Export routes are ready to connect to the same secure accounting
          package pattern used by Profit & Loss, Cash Flow, and General Ledger.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <ActionLink
            href="/api/admin/financials/balance-sheet/export?format=csv"
            label="CSV"
          />
          <ActionLink
            href="/api/admin/financials/balance-sheet/export?format=excel"
            label="Excel"
          />
          <ActionLink
            href="/api/admin/financials/balance-sheet/export?format=word"
            label="Word"
          />
          <ActionLink
            href="/api/admin/financials/balance-sheet/export?format=pdf"
            label="PDF"
            primary
          />
        </div>
      </div>
    </div>
  );
}

function BalanceSection({
  title,
  lines,
  totalLabel,
  totalValue,
}: {
  title: string;
  lines: BalanceLine[];
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
                        : line.source === "plaid"
                          ? "border-emerald-100 bg-white text-emerald-700"
                          : line.source === "calculated"
                            ? "border-violet-100 bg-violet-50 text-violet-700"
                            : "border-slate-100 bg-white text-slate-600"
                    }`}
                  >
                    {line.isSaved ? "Custom" : line.source}
                  </span>
                </div>

                {line.notes ? (
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                    {line.notes}
                  </p>
                ) : null}
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
                  <form action={deleteBalanceSheetLine}>
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

function readinessClasses(status: BalanceReadinessItem["status"]) {
  const classes = {
    ready: "border-emerald-100 bg-emerald-50 text-emerald-800",
    needs_review: "border-amber-100 bg-amber-50 text-amber-800",
    missing: "border-rose-100 bg-rose-50 text-rose-800",
  };

  return classes[status];
}

function BalanceReadinessPanel({ items }: { items: BalanceReadinessItem[] }) {
  const readyCount = items.filter((item) => item.status === "ready").length;

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            CPA / Balance Sheet Readiness
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Accounting-ready balance checks
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            This panel checks whether SitGuru has cash, bank transactions,
            receivables, manual balance lines, equity movement, and the balance
            equation ready for CPA review.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
          {readyCount}/{items.length} ready
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className={`rounded-xl border p-4 ${readinessClasses(item.status)}`}
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

function BalanceFlowPanel() {
  const steps = [
    "NFCU Business Checking and Savings create the cash foundation.",
    "Reviewed Plaid transactions feed current net income, owner contributions, and owner draws.",
    "Manual expense rows reduce current net income until matched to bank activity or adjusted.",
    "Manual balance lines capture opening balances, equipment, debt, owner capital, and CPA adjustments.",
    "Balance Sheet, P&L, Cash Flow, General Ledger, and future exports stay wired to the same accounting foundation.",
  ];

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
        Balance Sheet Flow
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        How this statement stays wired
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

function AddBalanceLinePanel({ savedLineCount }: { savedLineCount: number }) {
  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Add Balance Sheet Line
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Add assets, liabilities, or equity.
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use this for opening balances, equipment, owner capital, retained
            earnings, debt, liabilities, prepaid assets, or CPA adjustments.
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-[#fbfefd] px-4 py-3 text-sm font-bold text-slate-600">
          {savedLineCount > 0
            ? `${savedLineCount} custom balance lines`
            : "Using core balance lines"}
        </div>
      </div>

      <form
        action={addBalanceSheetLine}
        className="mt-6 grid gap-4 2xl:grid-cols-2"
      >
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
                {SECTION_LABELS[item.section as BalanceSectionKey]} — {item.label}
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
            placeholder="Example: Owner Capital, Bank Loan, Equipment..."
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

        <div className="2xl:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Notes
          </label>
          <input
            name="notes"
            type="text"
            placeholder="Optional notes for CPA, opening balance, adjustment, or source reference"
            className="mt-2 w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        <button
          type="submit"
          className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/10 transition hover:bg-emerald-800 2xl:col-span-2"
        >
          Add Balance Line
        </button>
      </form>
    </section>
  );
}

function BalanceCheckPanel({ balance }: { balance: BalanceSheetData }) {
  const visualRows = [
    {
      label: "Assets",
      value: balance.totals.totalAssets,
      detail: "Total current and non-current assets",
      tone: "bg-emerald-400",
    },
    {
      label: "Liabilities",
      value: balance.totals.totalLiabilities,
      detail: "Current and long-term obligations",
      tone: "bg-sky-400",
    },
    {
      label: "Equity",
      value: balance.totals.totalEquity,
      detail: "Owner capital, retained earnings, current income, and draws",
      tone: "bg-violet-400",
    },
    {
      label: "Difference",
      value: Math.abs(balance.totals.balanceDifference),
      detail: balance.totals.isBalanced ? "Equation is balanced" : "Needs adjustment",
      tone: balance.totals.isBalanced ? "bg-emerald-400" : "bg-rose-400",
    },
  ];

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
        Balance Check
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        Assets = Liabilities + Equity
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        This card compares SitGuru’s total assets against total liabilities plus
        equity and shows where opening balances or CPA adjustments are still needed.
      </p>

      <div className="mt-6 rounded-[1.5rem] border border-slate-100 bg-[#fbfefd] p-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 text-sm font-black text-slate-950">
            <span>Assets</span>
            <span>{money(balance.totals.totalAssets)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-sm font-black text-slate-950">
            <span>Liabilities + Equity</span>
            <span>{money(balance.totals.liabilitiesPlusEquity)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4 text-sm font-black text-slate-950">
            <span>Difference</span>
            <span
              className={
                balance.totals.isBalanced ? "text-emerald-700" : "text-rose-700"
              }
            >
              {money(balance.totals.balanceDifference)}
            </span>
          </div>
        </div>

        <div
          className={`mt-5 rounded-2xl border p-4 ${
            balance.totals.isBalanced
              ? "border-emerald-100 bg-emerald-50"
              : "border-rose-100 bg-rose-50"
          }`}
        >
          <p
            className={`text-sm font-bold ${
              balance.totals.isBalanced ? "text-emerald-800" : "text-rose-800"
            }`}
          >
            {balance.totals.isBalanced
              ? "Balance sheet is balanced."
              : "Balance sheet needs adjustment."}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Add or adjust opening cash, owner capital, retained earnings, loans,
            current liabilities, or CPA balance sheet lines until the statement balances.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {visualRows.map((row) => (
          <div key={row.label}>
            <div className="mb-2 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-950">{row.label}</p>
                <p className="text-xs text-slate-500">{row.detail}</p>
              </div>
              <p className="text-sm font-bold text-slate-950">
                {money(row.value)}
              </p>
            </div>

            <div className="h-3 rounded-full bg-slate-100">
              <div
                className={`h-3 rounded-full ${row.tone}`}
                style={{
                  width: `${getBarWidth(
                    row.value,
                    balance.totals.maxVisualValue,
                  )}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentActivityTables({ balance }: { balance: BalanceSheetData }) {
  return (
    <section className="grid gap-8 xl:grid-cols-2">
      <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
          Recent Bank Support
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
          NFCU/Plaid activity supporting the balance sheet
        </h2>

        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-100">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                    Date
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                    Activity
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em]">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {balance.recentBankRows.length ? (
                  balance.recentBankRows.map((row) => (
                    <tr key={row.id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-4 font-semibold text-slate-600">
                        {row.date}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-black text-slate-950">
                          {row.description}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {row.category} · {row.status}
                        </p>
                      </td>
                      <td className="px-4 py-4 font-semibold capitalize text-slate-600">
                        {row.type.replaceAll("_", " ")}
                      </td>
                      <td className="px-4 py-4 text-right font-black text-slate-950">
                        {moneyExact(row.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-600">
                      No NFCU/Plaid activity found yet.
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
          Recent Manual Expense Support
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
          Expense rows affecting current net income
        </h2>

        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-100">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                    Date
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                    Expense
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                    Category
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em]">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {balance.recentManualExpenses.length ? (
                  balance.recentManualExpenses.map((row) => (
                    <tr key={row.id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-4 font-semibold text-slate-600">
                        {row.date}
                      </td>
                      <td className="px-4 py-4 font-black text-slate-950">
                        {row.name}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-600">
                        {row.category}
                      </td>
                      <td className="px-4 py-4 text-right font-black text-slate-950">
                        {moneyExact(row.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-600">
                      No manual expense ledger rows found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function AdminBalanceSheetPage() {
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
            Sign in with a finance-enabled admin account to view SitGuru Balance
            Sheet reports.
          </p>
        </div>
      </div>
    );
  }

  const balance = await getBalanceSheetData();

  return (
    <div className="min-h-screen bg-[#f7fbf8] px-3 py-4 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1640px] space-y-5 sm:space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(420px,620px)] 2xl:items-start">
            <div className="max-w-5xl self-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                Admin / Financials / Balance Sheet
              </p>

              <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                SitGuru Balance Sheet.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                Snapshot of SitGuru assets, liabilities, and equity. This page
                is now wired to NFCU/Plaid business accounts, categorized bank
                transactions, manual expense rows, Trust & Safety receivables,
                and manual balance sheet lines.
              </p>
            </div>

            <BalanceExportPanel />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Total Assets"
              value={money(balance.totals.totalAssets)}
              detail={`${money(balance.totals.totalCurrentAssets)} current assets + ${money(balance.totals.totalNonCurrentAssets)} non-current assets.`}
              tone="emerald"
            />

            <StatCard
              label="Total Liabilities"
              value={money(balance.totals.totalLiabilities)}
              detail={`${money(balance.totals.totalCurrentLiabilities)} current liabilities + ${money(balance.totals.totalLongTermLiabilities)} long-term liabilities.`}
              tone="sky"
            />

            <StatCard
              label="Total Equity"
              value={money(balance.totals.totalEquity)}
              detail={`${money(balance.totals.currentNetIncome)} estimated current net income / loss.`}
              tone="violet"
            />

            <StatCard
              label="Available Cash"
              value={moneyExact(balance.totals.availableCashBalance)}
              detail={`${moneyExact(balance.totals.currentCashBalance)} current cash across NFCU Business Checking/Savings.`}
              tone="amber"
            />

            <StatCard
              label={balance.totals.isBalanced ? "Balanced" : "Out of Balance"}
              value={money(balance.totals.balanceDifference)}
              detail="Assets minus liabilities plus equity."
              tone={balance.totals.isBalanced ? "emerald" : "rose"}
            />
          </div>
        </section>

        <BalanceReadinessPanel items={balance.readinessItems} />

        <BalanceFlowPanel />

        <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          <AddBalanceLinePanel savedLineCount={balance.savedLineCount} />
          <BalanceCheckPanel balance={balance} />
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Balance Sheet Statement
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Assets, Liabilities, and Equity
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Core lines use available SitGuru data where possible. Custom
              manual rows can be deactivated while core lines remain locked.
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

              <BalanceSection
                title="Current Assets"
                lines={balance.currentAssets}
                totalLabel="Total Current Assets"
                totalValue={balance.totals.totalCurrentAssets}
              />

              <BalanceSection
                title="Non-Current Assets"
                lines={balance.nonCurrentAssets}
                totalLabel="Total Non-Current Assets"
                totalValue={balance.totals.totalNonCurrentAssets}
              />

              <div className="grid grid-cols-[1fr_auto] gap-4 border-y border-slate-100 bg-slate-100 px-4 py-3 font-black text-slate-950">
                <p>Total Assets</p>
                <p>{money(balance.totals.totalAssets)}</p>
              </div>

              <BalanceSection
                title="Current Liabilities"
                lines={balance.currentLiabilities}
                totalLabel="Total Current Liabilities"
                totalValue={balance.totals.totalCurrentLiabilities}
              />

              <BalanceSection
                title="Long-Term Liabilities"
                lines={balance.longTermLiabilities}
                totalLabel="Total Long-Term Liabilities"
                totalValue={balance.totals.totalLongTermLiabilities}
              />

              <div className="grid grid-cols-[1fr_auto] gap-4 border-y border-slate-100 bg-slate-100 px-4 py-3 font-black text-slate-950">
                <p>Total Liabilities</p>
                <p>{money(balance.totals.totalLiabilities)}</p>
              </div>

              <BalanceSection
                title="Equity"
                lines={balance.equityLines}
                totalLabel="Total Equity"
                totalValue={balance.totals.totalEquity}
              />

              <div className="grid grid-cols-[1fr_auto] gap-4 border-y border-slate-100 bg-slate-100 px-4 py-3 font-black text-slate-950">
                <p>Total Liabilities + Equity</p>
                <p>{money(balance.totals.liabilitiesPlusEquity)}</p>
              </div>

              <div
                className={`grid grid-cols-[1fr_auto] gap-4 border-t px-4 py-4 font-black ${
                  balance.totals.isBalanced
                    ? "border-emerald-400/30 bg-emerald-50 text-slate-950"
                    : "border-rose-400/30 bg-rose-50 text-slate-950"
                }`}
              >
                <p>Balance Difference</p>
                <p
                  className={
                    balance.totals.isBalanced ? "text-emerald-700" : "text-rose-700"
                  }
                >
                  {money(balance.totals.balanceDifference)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Current Asset Detail
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Cash, receivables, and balance sheet support
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              These are the asset lines that should tie back to NFCU business
              accounts, Trust & Safety receivables, or manual CPA entries.
            </p>

            <div className="mt-6 space-y-5">
              {balance.currentAssets.length ? (
                balance.currentAssets.map((row, index) => {
                  const tones = [
                    "bg-emerald-400",
                    "bg-sky-400",
                    "bg-violet-400",
                    "bg-amber-400",
                    "bg-rose-400",
                  ];

                  return (
                    <div key={row.id}>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-950">
                          {row.label}
                        </p>
                        <p className="text-sm font-bold text-slate-950">
                          {money(row.amount)}
                        </p>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100">
                        <div
                          className={`h-3 rounded-full ${tones[index % tones.length]}`}
                          style={{
                            width: `${getBarWidth(
                              row.amount,
                              Math.max(balance.totals.totalCurrentAssets, 1),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                  No current asset rows found yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-sky-100 bg-sky-50 p-5 shadow-sm sm:p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
              SitGuru Balance Sheet Notes
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Auto-estimated lines include NFCU Business Checking, NFCU Business
              Savings, available cash, Trust & Safety receivables, owner
              contributions, owner draws, and current net income when source data
              is available. Owner capital, retained earnings, long-term debt,
              equipment, prepaid assets, and opening balances should usually be
              entered or confirmed manually with your CPA.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-sky-100 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Bank Rows
                </p>
                <p className="mt-2 text-xl font-black text-slate-950">
                  {balance.totals.bankTransactionCount.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border border-sky-100 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Needs Review
                </p>
                <p className="mt-2 text-xl font-black text-slate-950">
                  {balance.totals.needsReviewCount.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border border-sky-100 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Manual Expenses
                </p>
                <p className="mt-2 text-xl font-black text-slate-950">
                  {balance.totals.manualExpenseCount.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border border-sky-100 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Manual Lines
                </p>
                <p className="mt-2 text-xl font-black text-slate-950">
                  {balance.savedLineCount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </section>

        <RecentActivityTables balance={balance} />
      </div>
    </div>
  );
}