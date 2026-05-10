import Link from "next/link";
import ProfitLossExportActions from "@/components/admin/financials/ProfitLossExportActions";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type BookingRow = Record<string, unknown>;
type ExpenseRow = Record<string, unknown>;
type PayoutRow = Record<string, unknown>;
type DisputeRow = Record<string, unknown>;
type FinancialLedgerRow = Record<string, unknown>;
type FinancialLineRow = Record<string, unknown>;
type TrustSafetyPurchaseRow = Record<string, unknown>;
type TrustSafetyFinancialEventRow = Record<string, unknown>;
type AdminIdentity = {
  id: string;
  email: string;
  role: string;
  canAccessFinancials: boolean;
};

type AccountingReadinessItem = {
  label: string;
  status: "ready" | "needs_review" | "missing";
  detail: string;
};

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type StatementSectionKey =
  | "revenue"
  | "cost_of_revenue"
  | "operating_expenses"
  | "taxes"
  | "other_income_expense";

type StatementLine = {
  id: string;
  dbId: string;
  isSaved: boolean;
  section: StatementSectionKey;
  label: string;
  sourceType: string;
  categoryMatch: string;
  displayOrder: number;
  value: number;
};

type FinancialLineConfig = {
  id?: string;
  section: StatementSectionKey;
  label: string;
  source_type: string;
  category_match: string;
  display_order: number;
  is_active?: boolean;
  created_at?: string;
};

type RecentExpense = {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
};

type ExpenseCategorySummary = {
  label: string;
  category: string;
  value: number;
};

const SECTION_LABELS: Record<StatementSectionKey, string> = {
  revenue: "Revenue",
  cost_of_revenue: "Cost of Revenue",
  operating_expenses: "Operating Expenses",
  taxes: "Taxes",
  other_income_expense: "Other Income / Expense",
};

const CATEGORY_LABELS: Record<string, string> = {
  marketing: "Marketing / Advertising",
  software: "Software / Tools",
  payroll: "Payroll / Contractors",
  legal: "Legal / Accounting",
  insurance: "Insurance",
  admin: "Admin / Office",
  travel: "Vehicle / Travel",
  maintenance: "Repairs / Maintenance",
  payment_processing: "Stripe / Payment Processing",
  customer_credits: "Customer Credits",
  trust_safety_checkr_cost: "Trust & Safety / Checkr Vendor Cost",
  trust_safety_stripe_fees: "Trust & Safety Stripe Fees",
  trust_safety_refunds: "Trust & Safety Refunds",
  other: "Other Expenses",
};

const CATEGORY_PRESETS = [
  {
    section: "revenue",
    label: "Booking Revenue",
    sourceType: "bookings",
    categoryMatch: "booking_revenue",
  },
  {
    section: "revenue",
    label: "SitGuru Platform Fees",
    sourceType: "bookings",
    categoryMatch: "platform_fee",
  },
  {
    section: "revenue",
    label: "Marketplace Fees",
    sourceType: "bookings",
    categoryMatch: "marketplace_fees",
  },
  {
    section: "revenue",
    label: "Subscription Revenue",
    sourceType: "manual",
    categoryMatch: "subscription_revenue",
  },
  {
    section: "revenue",
    label: "Referral Revenue",
    sourceType: "manual",
    categoryMatch: "referral_revenue",
  },
  {
    section: "revenue",
    label: "Affiliate Revenue",
    sourceType: "manual",
    categoryMatch: "affiliate_revenue",
  },
  {
    section: "revenue",
    label: "Trust & Safety Plan Revenue",
    sourceType: "trust_safety",
    categoryMatch: "trust_safety_revenue",
  },
  {
    section: "revenue",
    label: "Paw in Full Revenue",
    sourceType: "trust_safety",
    categoryMatch: "paw_in_full_revenue",
  },
  {
    section: "revenue",
    label: "Pawstep Plan Revenue",
    sourceType: "trust_safety",
    categoryMatch: "pawstep_plan_revenue",
  },
  {
    section: "revenue",
    label: "Book & Bark Plan Revenue",
    sourceType: "trust_safety",
    categoryMatch: "book_and_bark_plan_revenue",
  },
  {
    section: "cost_of_revenue",
    label: "Guru Payouts",
    sourceType: "bookings",
    categoryMatch: "guru_payouts",
  },
  {
    section: "cost_of_revenue",
    label: "Stripe / Payment Processing",
    sourceType: "expense_ledger",
    categoryMatch: "payment_processing",
  },
  {
    section: "cost_of_revenue",
    label: "Checkr Vendor Costs",
    sourceType: "trust_safety",
    categoryMatch: "trust_safety_checkr_vendor_cost",
  },
  {
    section: "cost_of_revenue",
    label: "Trust & Safety Stripe Fees",
    sourceType: "trust_safety",
    categoryMatch: "trust_safety_stripe_fees",
  },
  {
    section: "cost_of_revenue",
    label: "Trust & Safety Refunds",
    sourceType: "trust_safety",
    categoryMatch: "trust_safety_refunds",
  },
  {
    section: "cost_of_revenue",
    label: "Refunds / Customer Credits",
    sourceType: "financial_ledger",
    categoryMatch: "refunds_customer_credits",
  },
  {
    section: "cost_of_revenue",
    label: "Dispute Losses",
    sourceType: "disputes",
    categoryMatch: "disputes",
  },
  {
    section: "operating_expenses",
    label: "Marketing / Advertising",
    sourceType: "expense_ledger",
    categoryMatch: "marketing",
  },
  {
    section: "operating_expenses",
    label: "Software / Tools",
    sourceType: "expense_ledger",
    categoryMatch: "software",
  },
  {
    section: "operating_expenses",
    label: "Payroll / Contractors",
    sourceType: "expense_ledger",
    categoryMatch: "payroll",
  },
  {
    section: "operating_expenses",
    label: "Legal / Accounting",
    sourceType: "expense_ledger",
    categoryMatch: "legal",
  },
  {
    section: "operating_expenses",
    label: "Insurance",
    sourceType: "expense_ledger",
    categoryMatch: "insurance",
  },
  {
    section: "operating_expenses",
    label: "Admin / Office",
    sourceType: "expense_ledger",
    categoryMatch: "admin",
  },
  {
    section: "operating_expenses",
    label: "Vehicle / Travel",
    sourceType: "expense_ledger",
    categoryMatch: "travel",
  },
  {
    section: "operating_expenses",
    label: "Repairs / Maintenance",
    sourceType: "expense_ledger",
    categoryMatch: "maintenance",
  },
  {
    section: "operating_expenses",
    label: "Other Expenses",
    sourceType: "expense_ledger",
    categoryMatch: "other",
  },
  {
    section: "taxes",
    label: "Federal Income Taxes",
    sourceType: "manual",
    categoryMatch: "federal_tax",
  },
  {
    section: "taxes",
    label: "State Income Taxes",
    sourceType: "manual",
    categoryMatch: "state_tax",
  },
  {
    section: "taxes",
    label: "Local Income Taxes",
    sourceType: "manual",
    categoryMatch: "local_tax",
  },
  {
    section: "other_income_expense",
    label: "Other Income",
    sourceType: "manual",
    categoryMatch: "other_income",
  },
  {
    section: "other_income_expense",
    label: "Other Expense",
    sourceType: "manual",
    categoryMatch: "other_expense",
  },
] as const;

const DEFAULT_STATEMENT_LINES: FinancialLineConfig[] = [
  {
    section: "revenue",
    label: "Booking Revenue",
    source_type: "bookings",
    category_match: "booking_revenue",
    display_order: 10,
  },
  {
    section: "revenue",
    label: "SitGuru Platform Fees",
    source_type: "bookings",
    category_match: "platform_fee",
    display_order: 20,
  },
  {
    section: "revenue",
    label: "Trust & Safety Plan Revenue",
    source_type: "trust_safety",
    category_match: "trust_safety_revenue",
    display_order: 30,
  },
  {
    section: "cost_of_revenue",
    label: "Guru Payouts",
    source_type: "bookings",
    category_match: "guru_payouts",
    display_order: 10,
  },
  {
    section: "cost_of_revenue",
    label: "Checkr Vendor Costs",
    source_type: "trust_safety",
    category_match: "trust_safety_checkr_vendor_cost",
    display_order: 15,
  },
  {
    section: "cost_of_revenue",
    label: "Trust & Safety Stripe Fees",
    source_type: "trust_safety",
    category_match: "trust_safety_stripe_fees",
    display_order: 18,
  },
  {
    section: "cost_of_revenue",
    label: "Refunds / Customer Credits",
    source_type: "financial_ledger",
    category_match: "refunds_customer_credits",
    display_order: 20,
  },
  {
    section: "cost_of_revenue",
    label: "Dispute Losses",
    source_type: "disputes",
    category_match: "disputes",
    display_order: 30,
  },
  {
    section: "operating_expenses",
    label: "Marketing / Advertising",
    source_type: "expense_ledger",
    category_match: "marketing",
    display_order: 10,
  },
  {
    section: "operating_expenses",
    label: "Software / Tools",
    source_type: "expense_ledger",
    category_match: "software",
    display_order: 20,
  },
  {
    section: "operating_expenses",
    label: "Payroll / Contractors",
    source_type: "expense_ledger",
    category_match: "payroll",
    display_order: 30,
  },
  {
    section: "operating_expenses",
    label: "Legal / Accounting",
    source_type: "expense_ledger",
    category_match: "legal",
    display_order: 40,
  },
  {
    section: "operating_expenses",
    label: "Insurance",
    source_type: "expense_ledger",
    category_match: "insurance",
    display_order: 50,
  },
  {
    section: "operating_expenses",
    label: "Admin / Office",
    source_type: "expense_ledger",
    category_match: "admin",
    display_order: 60,
  },
  {
    section: "operating_expenses",
    label: "Vehicle / Travel",
    source_type: "expense_ledger",
    category_match: "travel",
    display_order: 70,
  },
  {
    section: "operating_expenses",
    label: "Other Expenses",
    source_type: "expense_ledger",
    category_match: "other",
    display_order: 100,
  },
];

function getOptionalBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "1"].includes(normalized)) return true;
    if (["false", "no", "0"].includes(normalized)) return false;
  }
  return false;
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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
  return `${value.toFixed(1)}%`;
}

function calcRatio(value: number, total: number) {
  if (!total || total <= 0) return 0;
  return (value / total) * 100;
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

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Profit and loss query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Profit and loss query skipped for ${label}:`, error);
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
    area: "financials.profit_loss",
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
    // Keep finance actions from failing if the audit table has not been created yet.
  }

  try {
    await supabaseAdmin.from("admin_audit_logs").insert(payload);
  } catch (error) {
    console.warn("Financial audit log skipped:", error);
  }
}

function isArchivedRow(row: Record<string, unknown>) {
  return Boolean(
    row.deleted_at ||
    row.voided_at ||
    row.archived_at ||
    row.is_deleted === true ||
    row.is_void === true ||
    row.is_active === false,
  );
}

async function addStatementLine(formData: FormData) {
  "use server";

  const actor = await requireFinancialAdminAction("add_statement_line");

  if (!actor) return;

  const presetKey = String(formData.get("preset") || "").trim();
  const customLabel = String(formData.get("customLabel") || "").trim();

  const preset = CATEGORY_PRESETS.find(
    (item) => `${item.section}:${item.categoryMatch}` === presetKey,
  );

  if (!preset) {
    return;
  }

  const label = customLabel || preset.label;

  const existingLines = await safeRows<FinancialLineRow>(
    supabaseAdmin
      .from("financial_statement_lines")
      .select("*")
      .eq("section", preset.section)
      .eq("label", label)
      .limit(1),
    "financial_statement_lines_duplicate_check",
  );

  if (existingLines.length > 0) {
    revalidatePath("/admin/financials/profit-loss");
    return;
  }

  const { data: insertedLine } = await supabaseAdmin
    .from("financial_statement_lines")
    .insert({
      section: preset.section,
      label,
      source_type: preset.sourceType,
      category_match: preset.categoryMatch,
      display_order: 100,
      is_active: true,
    })
    .select("id")
    .single();

  await writeFinancialAuditLog({
    actor,
    action: "add_statement_line",
    targetType: "financial_statement_line",
    targetId: asTrimmedString(
      (insertedLine as Record<string, unknown> | null)?.id,
    ),
    metadata: {
      section: preset.section,
      label,
      sourceType: preset.sourceType,
      categoryMatch: preset.categoryMatch,
    },
  });

  revalidatePath("/admin/financials/profit-loss");
}

async function deleteStatementLine(formData: FormData) {
  "use server";

  const actor = await requireFinancialAdminAction("delete_statement_line");

  if (!actor) return;

  const lineId = String(formData.get("lineId") || "").trim();

  if (!lineId) {
    return;
  }

  await supabaseAdmin
    .from("financial_statement_lines")
    .update({ is_active: false })
    .eq("id", lineId);

  await writeFinancialAuditLog({
    actor,
    action: "deactivate_statement_line",
    targetType: "financial_statement_line",
    targetId: lineId,
  });

  revalidatePath("/admin/financials/profit-loss");
}

async function addExpenseLedgerRow(formData: FormData) {
  "use server";

  const actor = await requireFinancialAdminAction("add_expense_ledger_row");

  if (!actor) return;

  const name = String(formData.get("expenseName") || "").trim();
  const category = String(formData.get("expenseCategory") || "").trim();
  const amount = Number(formData.get("expenseAmount") || 0);
  const description = String(formData.get("expenseDescription") || "").trim();

  if (!name || !category || !Number.isFinite(amount) || amount <= 0) {
    return;
  }

  try {
    const { data: insertedExpense } = await supabaseAdmin
      .from("expense_ledger")
      .insert({
        name,
        description,
        category,
        amount,
        source: "manual_admin",
      })
      .select("id")
      .single();

    await writeFinancialAuditLog({
      actor,
      action: "add_expense_ledger_row",
      targetType: "expense_ledger",
      targetId: asTrimmedString(
        (insertedExpense as Record<string, unknown> | null)?.id,
      ),
      metadata: { name, category, amount },
    });
  } catch (error) {
    console.warn("Expense ledger insert skipped:", error);
  }

  revalidatePath("/admin/financials/profit-loss");
}

async function deleteExpenseLedgerRow(formData: FormData) {
  "use server";

  const actor = await requireFinancialAdminAction("void_expense_ledger_row");

  if (!actor) return;

  const expenseId = String(formData.get("expenseId") || "").trim();

  if (!expenseId) {
    return;
  }

  try {
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
        .update({ is_active: false })
        .eq("id", expenseId);
    }

    await writeFinancialAuditLog({
      actor,
      action: "void_expense_ledger_row",
      targetType: "expense_ledger",
      targetId: expenseId,
    });
  } catch (error) {
    console.warn("Expense ledger void skipped:", error);
  }

  revalidatePath("/admin/financials/profit-loss");
}

function getBookingGrossAmount(booking: BookingRow) {
  const subtotal = toNumber(booking.subtotal_amount);

  if (subtotal > 0) return subtotal;

  return (
    toNumber(booking.total_amount) ||
    toNumber(booking.amount) ||
    toNumber(booking.price) ||
    toNumber(booking.hourly_rate)
  );
}

function getBookingTaxAmount(booking: BookingRow) {
  return toNumber(booking.sales_tax_amount);
}

function getPlatformFee(booking: BookingRow) {
  const storedFee = toNumber(booking.sitguru_fee_amount);

  if (storedFee > 0) return storedFee;

  return getBookingGrossAmount(booking) * 0.08;
}

function getGuruPayoutAmount(booking: BookingRow) {
  const storedNet = toNumber(booking.guru_net_amount);

  if (storedNet > 0) return storedNet;

  return Math.max(0, getBookingGrossAmount(booking) - getPlatformFee(booking));
}

function getRefundAmount(booking: BookingRow) {
  const explicitRefund = toNumber(booking.refund_amount);

  if (explicitRefund > 0) return explicitRefund;

  const status = (
    asTrimmedString(booking.payment_status) || asTrimmedString(booking.status)
  ).toLowerCase();

  if (status.includes("refund")) {
    return getBookingGrossAmount(booking);
  }

  return 0;
}

function isPaidBooking(booking: BookingRow) {
  const paymentStatus = asTrimmedString(booking.payment_status).toLowerCase();
  const status = asTrimmedString(booking.status).toLowerCase();

  return (
    paymentStatus === "paid" ||
    paymentStatus === "succeeded" ||
    status.includes("paid") ||
    status.includes("complete")
  );
}

function getExpenseId(expense: ExpenseRow, index: number) {
  return (
    asTrimmedString(expense.id) ||
    asTrimmedString(expense.expense_id) ||
    `${getExpenseName(expense)}-${index}`
  );
}

function getExpenseAmount(expense: ExpenseRow) {
  return (
    toNumber(expense.amount) ||
    toNumber(expense.total_amount) ||
    toNumber(expense.expense_amount) ||
    toNumber(expense.cost)
  );
}

function getExpenseName(expense: ExpenseRow) {
  return (
    asTrimmedString(expense.name) ||
    asTrimmedString(expense.description) ||
    asTrimmedString(expense.category) ||
    "Expense"
  );
}

function getExpenseCategory(expense: ExpenseRow) {
  const category = (
    asTrimmedString(expense.category) ||
    asTrimmedString(expense.expense_category) ||
    asTrimmedString(expense.type) ||
    asTrimmedString(expense.name) ||
    "Other"
  ).toLowerCase();

  if (category.includes("market") || category.includes("advert"))
    return "marketing";
  if (category.includes("software") || category.includes("tool"))
    return "software";
  if (category.includes("payroll") || category.includes("contractor"))
    return "payroll";
  if (category.includes("admin") || category.includes("office")) return "admin";
  if (category.includes("legal") || category.includes("accounting"))
    return "legal";
  if (category.includes("insurance")) return "insurance";
  if (category.includes("travel") || category.includes("vehicle"))
    return "travel";
  if (category.includes("maintenance") || category.includes("repair"))
    return "maintenance";
  if (category.includes("payment") || category.includes("stripe"))
    return "payment_processing";
  if (category.includes("refund") || category.includes("credit"))
    return "customer_credits";

  return "other";
}

function getExpenseCategoryLabel(category: string) {
  return CATEGORY_LABELS[category] || "Other Expenses";
}

function getDisputeAmount(dispute: DisputeRow) {
  return (
    toNumber(dispute.amount) ||
    toNumber(dispute.dispute_amount) ||
    toNumber(dispute.refund_amount) ||
    toNumber(dispute.financial_impact) ||
    toNumber(dispute.total_amount)
  );
}

function isRefundDispute(dispute: DisputeRow) {
  const issueType = asTrimmedString(dispute.issue_type).toLowerCase();
  const financialAction = asTrimmedString(
    dispute.financial_action,
  ).toLowerCase();
  const refundAmount = toNumber(dispute.refund_amount);

  return (
    Boolean(dispute.refund_requested) ||
    refundAmount > 0 ||
    issueType.includes("refund") ||
    financialAction.includes("credit") ||
    financialAction.includes("refund")
  );
}

function getNonRefundDisputeAmount(dispute: DisputeRow) {
  if (isRefundDispute(dispute)) {
    return 0;
  }

  return getDisputeAmount(dispute);
}

function getFinancialLedgerAccountName(entry: FinancialLedgerRow) {
  return asTrimmedString(entry.account_name).toLowerCase();
}

function getFinancialLedgerDebit(entry: FinancialLedgerRow) {
  return toNumber(entry.debit);
}

function getFinancialLedgerCredit(entry: FinancialLedgerRow) {
  return toNumber(entry.credit);
}

function getFinancialLedgerRefundAmount(entries: FinancialLedgerRow[]) {
  return entries
    .filter((entry) => {
      const accountName = getFinancialLedgerAccountName(entry);
      return (
        accountName.includes("refund") ||
        accountName.includes("customer credit") ||
        accountName.includes("customer credits")
      );
    })
    .reduce(
      (sum, entry) =>
        sum +
        Math.max(
          0,
          getFinancialLedgerDebit(entry) - getFinancialLedgerCredit(entry),
        ),
      0,
    );
}

function getExpenseCustomerCreditAmount(expenses: ExpenseRow[]) {
  return expenses
    .filter((expense) => getExpenseCategory(expense) === "customer_credits")
    .reduce((sum, expense) => sum + getExpenseAmount(expense), 0);
}

function getBookingRefundTotal(bookings: BookingRow[]) {
  return bookings.reduce((sum, booking) => sum + getRefundAmount(booking), 0);
}

function getRefundsAndCustomerCreditsAmount({
  bookings,
  expenses,
  financialLedger,
}: {
  bookings: BookingRow[];
  expenses: ExpenseRow[];
  financialLedger: FinancialLedgerRow[];
}) {
  const bookingRefunds = getBookingRefundTotal(bookings);
  const ledgerRefunds = getFinancialLedgerRefundAmount(financialLedger);
  const expenseLedgerCredits = getExpenseCustomerCreditAmount(expenses);

  return (
    bookingRefunds + (ledgerRefunds > 0 ? ledgerRefunds : expenseLedgerCredits)
  );
}

function getPayoutAmount(payout: PayoutRow) {
  return (
    toNumber(payout.amount) ||
    toNumber(payout.payout_amount) ||
    toNumber(payout.guru_net_amount) ||
    toNumber(payout.net_amount)
  );
}

function isPayoutPaid(payout: PayoutRow) {
  const status = (
    asTrimmedString(payout.status) || asTrimmedString(payout.payout_status)
  ).toLowerCase();

  return (
    status.includes("paid") ||
    status.includes("released") ||
    status.includes("complete")
  );
}

function getBarWidth(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.max(4, Math.min(100, (Math.abs(value) / max) * 100));
}

function getLineIdentity(line: FinancialLineConfig, index: number) {
  return (
    asTrimmedString(line.id) ||
    `${asTrimmedString(line.section)}-${asTrimmedString(line.label)}-${index}`
  );
}

function getLineSection(line: FinancialLineConfig): StatementSectionKey {
  const section = line.section;

  if (
    section === "revenue" ||
    section === "cost_of_revenue" ||
    section === "operating_expenses" ||
    section === "taxes" ||
    section === "other_income_expense"
  ) {
    return section;
  }

  return "operating_expenses";
}

function normalizeFinancialLine(row: FinancialLineRow): FinancialLineConfig {
  return {
    id: asTrimmedString(row.id),
    section: getLineSection({
      section: asTrimmedString(row.section) as StatementSectionKey,
      label: asTrimmedString(row.label),
      source_type: asTrimmedString(row.source_type),
      category_match: asTrimmedString(row.category_match),
      display_order: toNumber(row.display_order) || 100,
    }),
    label: asTrimmedString(row.label) || "Statement line",
    source_type: asTrimmedString(row.source_type) || "manual",
    category_match: asTrimmedString(row.category_match),
    display_order: toNumber(row.display_order) || 100,
    is_active: row.is_active !== false,
    created_at: asTrimmedString(row.created_at),
  };
}

function getCanonicalLineCategory(line: FinancialLineConfig) {
  const categoryMatch = asTrimmedString(line.category_match).toLowerCase();
  const label = asTrimmedString(line.label).toLowerCase();

  if (
    categoryMatch === "refunds" ||
    categoryMatch === "customer_credits" ||
    categoryMatch === "refunds_customer_credits" ||
    label.includes("refund") ||
    label.includes("customer credit")
  ) {
    return "refunds_customer_credits";
  }

  if (categoryMatch === "disputes" || label.includes("dispute loss")) {
    return "dispute_losses";
  }

  return categoryMatch || label || "manual";
}

function getCanonicalLineSource(line: FinancialLineConfig) {
  const canonicalCategory = getCanonicalLineCategory(line);

  if (canonicalCategory === "refunds_customer_credits") {
    return "financial_ledger";
  }

  if (canonicalCategory === "dispute_losses") {
    return "disputes";
  }

  return asTrimmedString(line.source_type).toLowerCase() || "manual";
}

function normalizeStatementLineConfig(
  line: FinancialLineConfig,
): FinancialLineConfig {
  const canonicalCategory = getCanonicalLineCategory(line);

  if (canonicalCategory === "refunds_customer_credits") {
    return {
      ...line,
      label: "Refunds / Customer Credits",
      source_type: "financial_ledger",
      category_match: "refunds_customer_credits",
    };
  }

  if (canonicalCategory === "dispute_losses") {
    return {
      ...line,
      label: "Dispute Losses",
      source_type: "disputes",
      category_match: "disputes",
    };
  }

  return line;
}

function getCanonicalLineKey(line: FinancialLineConfig) {
  const normalized = normalizeStatementLineConfig(line);
  return (
    getLineSection(normalized) +
    ":" +
    getCanonicalLineSource(normalized) +
    ":" +
    getCanonicalLineCategory(normalized)
  );
}

function dedupeStatementLineConfigs(lines: FinancialLineConfig[]) {
  const byKey = new Map<string, FinancialLineConfig>();

  for (const line of lines) {
    const normalized = normalizeStatementLineConfig(line);
    byKey.set(getCanonicalLineKey(normalized), normalized);
  }

  return Array.from(byKey.values()).sort(
    (a, b) =>
      (a.display_order || 100) - (b.display_order || 100) ||
      asTrimmedString(a.label).localeCompare(asTrimmedString(b.label)),
  );
}


function centsToStatementDollars(value: unknown) {
  return toNumber(value) / 100;
}

function getTrustSafetyPurchasePaidAmount(purchase: TrustSafetyPurchaseRow) {
  return centsToStatementDollars(purchase.amount_paid_cents);
}

function getTrustSafetyPurchaseRevenue(
  purchases: TrustSafetyPurchaseRow[],
  planKey?: string,
) {
  return purchases
    .filter((purchase) => {
      if (!planKey) return true;
      return asTrimmedString(purchase.plan_key) === planKey;
    })
    .filter((purchase) => {
      const status = asTrimmedString(purchase.payment_status).toLowerCase();
      return status === "paid" || status === "partially_paid";
    })
    .reduce((sum, purchase) => sum + getTrustSafetyPurchasePaidAmount(purchase), 0);
}

function getTrustSafetyEventAmount(event: TrustSafetyFinancialEventRow) {
  const gross = centsToStatementDollars(event.gross_amount_cents);
  const net = centsToStatementDollars(event.net_amount_cents);
  const fee = centsToStatementDollars(event.fee_amount_cents);

  return Math.max(Math.abs(gross), Math.abs(net), Math.abs(fee), 0);
}

function getTrustSafetyFinancialEventTotal(
  events: TrustSafetyFinancialEventRow[],
  eventTypes: string[],
) {
  const allowed = new Set(eventTypes);

  return events
    .filter((event) => {
      const status = asTrimmedString(event.status).toLowerCase();
      return status !== "voided" && status !== "failed";
    })
    .filter((event) => allowed.has(asTrimmedString(event.event_type)))
    .reduce((sum, event) => sum + getTrustSafetyEventAmount(event), 0);
}

function getStatementLineAmount({
  line,
  bookings,
  expenses,
  payouts,
  disputes,
  financialLedger,
  trustSafetyPurchases,
  trustSafetyFinancialEvents,
}: {
  line: FinancialLineConfig;
  bookings: BookingRow[];
  expenses: ExpenseRow[];
  payouts: PayoutRow[];
  disputes: DisputeRow[];
  financialLedger: FinancialLedgerRow[];
  trustSafetyPurchases: TrustSafetyPurchaseRow[];
  trustSafetyFinancialEvents: TrustSafetyFinancialEventRow[];
}) {
  const normalizedLine = normalizeStatementLineConfig(line);
  const sourceType = normalizedLine.source_type.toLowerCase();
  const categoryMatch = normalizedLine.category_match.toLowerCase();

  if (sourceType === "bookings") {
    if (
      categoryMatch === "booking_revenue" ||
      categoryMatch === "gross_booking_volume"
    ) {
      return bookings.reduce(
        (sum, booking) => sum + getBookingGrossAmount(booking),
        0,
      );
    }

    if (
      categoryMatch === "platform_fee" ||
      categoryMatch === "marketplace_fees"
    ) {
      return bookings.reduce(
        (sum, booking) => sum + getPlatformFee(booking),
        0,
      );
    }

    if (categoryMatch === "guru_payouts") {
      return bookings.reduce(
        (sum, booking) => sum + getGuruPayoutAmount(booking),
        0,
      );
    }

    if (categoryMatch === "refunds") {
      return getRefundsAndCustomerCreditsAmount({
        bookings,
        expenses,
        financialLedger,
      });
    }

    if (categoryMatch === "tax_collected") {
      return bookings.reduce(
        (sum, booking) => sum + getBookingTaxAmount(booking),
        0,
      );
    }
  }

  if (sourceType === "payouts") {
    return payouts
      .filter(isPayoutPaid)
      .reduce((sum, payout) => sum + getPayoutAmount(payout), 0);
  }

  if (sourceType === "disputes") {
    return disputes.reduce(
      (sum, dispute) => sum + getNonRefundDisputeAmount(dispute),
      0,
    );
  }

  if (sourceType === "financial_ledger") {
    if (categoryMatch === "refunds_customer_credits") {
      return getRefundsAndCustomerCreditsAmount({
        bookings,
        expenses,
        financialLedger,
      });
    }
  }

  if (sourceType === "expense_ledger") {
    if (categoryMatch === "customer_credits") {
      return getRefundsAndCustomerCreditsAmount({
        bookings,
        expenses,
        financialLedger,
      });
    }

    return expenses
      .filter((expense) => getExpenseCategory(expense) === categoryMatch)
      .reduce((sum, expense) => sum + getExpenseAmount(expense), 0);
  }


  if (sourceType === "trust_safety") {
    if (categoryMatch === "trust_safety_revenue") {
      return getTrustSafetyPurchaseRevenue(trustSafetyPurchases);
    }

    if (categoryMatch === "paw_in_full_revenue") {
      return getTrustSafetyPurchaseRevenue(trustSafetyPurchases, "paw_in_full");
    }

    if (categoryMatch === "pawstep_plan_revenue") {
      return getTrustSafetyPurchaseRevenue(trustSafetyPurchases, "pawstep_plan");
    }

    if (categoryMatch === "book_and_bark_plan_revenue") {
      return getTrustSafetyPurchaseRevenue(
        trustSafetyPurchases,
        "book_and_bark_plan",
      );
    }

    if (categoryMatch === "trust_safety_checkr_vendor_cost") {
      return getTrustSafetyFinancialEventTotal(trustSafetyFinancialEvents, [
        "checkr_vendor_cost",
        "sitguru_fronted_cost",
      ]);
    }

    if (categoryMatch === "trust_safety_stripe_fees") {
      return getTrustSafetyFinancialEventTotal(trustSafetyFinancialEvents, [
        "stripe_fee",
      ]);
    }

    if (categoryMatch === "trust_safety_refunds") {
      return getTrustSafetyFinancialEventTotal(trustSafetyFinancialEvents, [
        "refund",
      ]);
    }
  }

  return 0;
}

function getLedgerText(entry: FinancialLedgerRow) {
  return [
    entry.source,
    entry.source_type,
    entry.account_name,
    entry.account,
    entry.description,
    entry.memo,
    entry.external_account_name,
  ]
    .map(asTrimmedString)
    .join(" ")
    .toLowerCase();
}

function getAccountingReadinessItems({
  bookings,
  expenses,
  payouts,
  disputes,
  financialLedger,
  trustSafetyPurchases,
  trustSafetyFinancialEvents,
}: {
  bookings: BookingRow[];
  expenses: ExpenseRow[];
  payouts: PayoutRow[];
  disputes: DisputeRow[];
  financialLedger: FinancialLedgerRow[];
  trustSafetyPurchases: TrustSafetyPurchaseRow[];
  trustSafetyFinancialEvents: TrustSafetyFinancialEventRow[];
}): AccountingReadinessItem[] {
  const stripeEntries = financialLedger.filter((entry) =>
    getLedgerText(entry).includes("stripe"),
  );
  const bankEntries = financialLedger.filter((entry) => {
    const text = getLedgerText(entry);
    return (
      text.includes("navy") ||
      text.includes("checking") ||
      text.includes("savings") ||
      text.includes("bank")
    );
  });
  const reconciliationReady = financialLedger.some((entry) =>
    Boolean(
      entry.reconciled_at ||
      entry.matched_transaction_id ||
      entry.reconciliation_id,
    ),
  );

  return [
    {
      label: "Bookings revenue source",
      status: bookings.length ? "ready" : "needs_review",
      detail: bookings.length
        ? `${bookings.length.toLocaleString()} booking rows are available for revenue and payout calculations.`
        : "No booking rows were found yet. Revenue will remain incomplete until bookings are connected.",
    },
    {
      label: "Stripe clearing activity",
      status: stripeEntries.length ? "ready" : "needs_review",
      detail: stripeEntries.length
        ? `${stripeEntries.length.toLocaleString()} Stripe-related ledger rows found for fees, refunds, payouts, or clearing entries.`
        : "Stripe balance transactions should be normalized into the ledger before CPA export.",
    },
    {
      label: "Navy Federal bank activity",
      status: bankEntries.length ? "ready" : "needs_review",
      detail: bankEntries.length
        ? `${bankEntries.length.toLocaleString()} bank/checking/savings ledger rows found for cash reconciliation.`
        : "Connect Plaid or import Navy Federal CSV/QBO/OFX statements to match bank deposits and expenses.",
    },
    {
      label: "Payout and dispute support",
      status: payouts.length || disputes.length ? "ready" : "needs_review",
      detail: `${payouts.length.toLocaleString()} payout rows and ${disputes.length.toLocaleString()} dispute rows available for support schedules.`,
    },
    {
      label: "Trust & Safety financial activity",
      status: trustSafetyPurchases.length || trustSafetyFinancialEvents.length ? "ready" : "needs_review",
      detail: trustSafetyPurchases.length || trustSafetyFinancialEvents.length
        ? `${trustSafetyPurchases.length.toLocaleString()} Trust & Safety purchase rows and ${trustSafetyFinancialEvents.length.toLocaleString()} financial event rows are available for P&L revenue, Checkr costs, Stripe fees, and refunds.`
        : "Trust & Safety plan purchases and financial events should be connected before screening revenue and Checkr costs are complete.",
    },
    {
      label: "Manual expense ledger",
      status: expenses.length ? "ready" : "needs_review",
      detail: expenses.length
        ? `${expenses.length.toLocaleString()} operating expense rows are categorized for P&L reporting.`
        : "Add or import operating expenses so the P&L reflects real admin costs.",
    },
    {
      label: "Reconciliation status",
      status: reconciliationReady ? "ready" : "missing",
      detail: reconciliationReady
        ? "At least one ledger row has reconciliation metadata for matching deposits, payouts, or transfers."
        : "Add reconciliation IDs/matches so Stripe payouts are not double-counted as revenue when they hit checking.",
    },
  ];
}

function readinessClasses(status: AccountingReadinessItem["status"]) {
  const classes = {
    ready: "border-emerald-100 bg-emerald-50 text-emerald-800",
    needs_review: "border-amber-100 bg-amber-50 text-amber-800",
    missing: "border-rose-100 bg-rose-50 text-rose-800",
  };

  return classes[status];
}

function AccountingReadinessPanel({
  items,
}: {
  items: AccountingReadinessItem[];
}) {
  const readyCount = items.filter((item) => item.status === "ready").length;

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            CPA / QuickBooks Readiness
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Accounting-program export checks
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            This panel checks whether the P&amp;L has the source records your
            CPA will expect: bookings, Stripe clearing entries, Navy Federal
            bank activity, payouts, disputes, categorized expenses, and
            reconciliation matches.
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

function IntegrationFlowPanel() {
  const steps = [
    "Customer booking creates revenue and payout records.",
    "Stripe balance transactions identify gross payments, Trust & Safety plan payments, fees, refunds, disputes, and payouts.",
    "Navy Federal checking/savings activity confirms cash deposits, transfers, and expenses.",
    "Reconciliation matches Stripe payouts to bank deposits so revenue is not double-counted.",
    "Financial Overview, P&L, Balance Sheet, Cash Flow, exports, Trust & Safety records, and CPA handoff use the same ledger foundation.",
  ];

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
        Stripe + Navy Federal Flow
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        How this statement should reconcile
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

function StatCard({
  label,
  value,
  detail,
  tone = "emerald",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "emerald" | "sky" | "violet" | "amber" | "rose";
}) {
  const toneClass = {
    emerald: "border-emerald-100 bg-emerald-50",
    sky: "border-sky-100 bg-sky-50",
    violet: "border-violet-100 bg-violet-50",
    amber: "border-amber-100 bg-amber-50",
    rose: "border-rose-100 bg-rose-50",
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
      className="inline-flex items-center justify-center rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:border-emerald-200 hover:bg-emerald-50"
    >
      {label}
    </Link>
  );
}

function StatementSection({
  title,
  lines,
  totalLabel,
  totalValue,
}: {
  title: string;
  lines: StatementLine[];
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
              className="grid gap-3 px-4 py-4 text-slate-600 sm:grid-cols-[minmax(0,1fr)_120px_96px] sm:items-center"
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
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  {line.sourceType} / {line.categoryMatch || "manual"}
                </p>
              </div>

              <p className="text-right text-sm font-black tabular-nums text-slate-950 sm:text-base">
                {money(line.value)}
              </p>

              <div className="flex justify-end">
                {line.isSaved ? (
                  <form action={deleteStatementLine}>
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

async function getProfitLossData() {
  const [
    rawBookings,
    rawExpenses,
    rawPayouts,
    rawDisputes,
    rawFinancialLedger,
    rawTrustSafetyPurchases,
    rawTrustSafetyFinancialEvents,
    savedRows,
  ] = await Promise.all([
    safeRows<BookingRow>(
      supabaseAdmin
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1500),
      "bookings",
    ),
    safeRows<ExpenseRow>(
      supabaseAdmin
        .from("expense_ledger")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1500),
      "expense_ledger",
    ),
    safeRows<PayoutRow>(
      supabaseAdmin
        .from("guru_payouts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1500),
      "guru_payouts",
    ),
    safeRows<DisputeRow>(
      supabaseAdmin
        .from("dispute_cases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1500),
      "dispute_cases",
    ),
    safeRows<FinancialLedgerRow>(
      supabaseAdmin
        .from("financial_ledger_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1500),
      "financial_ledger_entries",
    ),
    safeRows<TrustSafetyPurchaseRow>(
      supabaseAdmin
        .from("guru_trust_safety_plan_purchases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1500),
      "guru_trust_safety_plan_purchases",
    ),
    safeRows<TrustSafetyFinancialEventRow>(
      supabaseAdmin
        .from("trust_safety_financial_events")
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(1500),
      "trust_safety_financial_events",
    ),
    safeRows<FinancialLineRow>(
      supabaseAdmin
        .from("financial_statement_lines")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(500),
      "financial_statement_lines",
    ),
  ]);

  const bookings = rawBookings.filter((row) => !isArchivedRow(row));
  const expenses = rawExpenses.filter((row) => !isArchivedRow(row));
  const payouts = rawPayouts.filter((row) => !isArchivedRow(row));
  const disputes = rawDisputes.filter((row) => !isArchivedRow(row));
  const financialLedger = rawFinancialLedger.filter(
    (row) => !isArchivedRow(row),
  );
  const trustSafetyPurchases = rawTrustSafetyPurchases.filter(
    (row) => !isArchivedRow(row),
  );
  const trustSafetyFinancialEvents = rawTrustSafetyFinancialEvents.filter(
    (row) => !isArchivedRow(row),
  );

  const savedLines = savedRows.map(normalizeFinancialLine);
  const defaultLineKeys = new Set(
    DEFAULT_STATEMENT_LINES.map((line) =>
      getCanonicalLineKey(normalizeStatementLineConfig(line)),
    ),
  );
  const customSavedLineCount = savedLines.filter(
    (line) =>
      !defaultLineKeys.has(
        getCanonicalLineKey(normalizeStatementLineConfig(line)),
      ),
  ).length;
  const activeSourceLines: FinancialLineConfig[] = dedupeStatementLineConfigs([
    ...DEFAULT_STATEMENT_LINES,
    ...savedLines,
  ]);

  const statementLines: StatementLine[] = activeSourceLines
    .map((line, index) => {
      const normalizedLine = normalizeStatementLineConfig(line);
      const dbId = asTrimmedString(normalizedLine.id);
      const isCoreDefaultLine = defaultLineKeys.has(
        getCanonicalLineKey(normalizedLine),
      );

      return {
        id: getLineIdentity(normalizedLine, index),
        dbId,
        isSaved: Boolean(dbId && !isCoreDefaultLine),
        section: getLineSection(normalizedLine),
        label: normalizedLine.label || "Statement line",
        sourceType: normalizedLine.source_type || "manual",
        categoryMatch: normalizedLine.category_match,
        displayOrder: normalizedLine.display_order || 100,
        value: getStatementLineAmount({
          line: normalizedLine,
          bookings,
          expenses,
          payouts,
          disputes,
          financialLedger,
          trustSafetyPurchases,
          trustSafetyFinancialEvents,
        }),
      };
    })
    .sort(
      (a, b) =>
        a.displayOrder - b.displayOrder || a.label.localeCompare(b.label),
    );

  const paidBookings = bookings.filter(isPaidBooking);

  const grossBookingVolume = bookings.reduce(
    (sum, booking) => sum + getBookingGrossAmount(booking),
    0,
  );

  const paidBookingVolume = paidBookings.reduce(
    (sum, booking) => sum + getBookingGrossAmount(booking),
    0,
  );

  const taxCollected = bookings.reduce(
    (sum, booking) => sum + getBookingTaxAmount(booking),
    0,
  );

  const trustSafetyRevenue = getTrustSafetyPurchaseRevenue(trustSafetyPurchases);
  const trustSafetyCheckrCosts = getTrustSafetyFinancialEventTotal(
    trustSafetyFinancialEvents,
    ["checkr_vendor_cost", "sitguru_fronted_cost"],
  );
  const trustSafetyStripeFees = getTrustSafetyFinancialEventTotal(
    trustSafetyFinancialEvents,
    ["stripe_fee"],
  );
  const trustSafetyRefunds = getTrustSafetyFinancialEventTotal(
    trustSafetyFinancialEvents,
    ["refund"],
  );

  const revenueLines = statementLines.filter(
    (line) => line.section === "revenue",
  );
  const costLines = statementLines.filter(
    (line) => line.section === "cost_of_revenue",
  );
  const operatingLines = statementLines.filter(
    (line) => line.section === "operating_expenses",
  );
  const taxLines = statementLines.filter((line) => line.section === "taxes");
  const otherLines = statementLines.filter(
    (line) => line.section === "other_income_expense",
  );

  const totalRevenue = revenueLines.reduce((sum, line) => sum + line.value, 0);
  const totalCostOfRevenue = costLines.reduce(
    (sum, line) => sum + line.value,
    0,
  );
  const grossProfit = totalRevenue - totalCostOfRevenue;

  const totalOperatingExpenses = operatingLines.reduce(
    (sum, line) => sum + line.value,
    0,
  );

  const operatingIncome = grossProfit - totalOperatingExpenses;

  const totalTaxes = taxLines.reduce((sum, line) => sum + line.value, 0);
  const otherIncomeExpense = otherLines.reduce(
    (sum, line) => sum + line.value,
    0,
  );
  const netIncome = operatingIncome + otherIncomeExpense - totalTaxes;

  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;
  const costOfRevenueRatio = calcRatio(totalCostOfRevenue, totalRevenue);
  const operatingExpenseRatio = calcRatio(totalOperatingExpenses, totalRevenue);
  const payoutToBookingRatio = calcRatio(
    totalCostOfRevenue,
    grossBookingVolume,
  );

  const maxVisualValue = Math.max(
    totalRevenue,
    totalCostOfRevenue,
    totalOperatingExpenses,
    Math.abs(netIncome),
    grossBookingVolume,
    paidBookingVolume,
    1,
  );

  const expenseCategoryMap = new Map<string, number>();

  for (const expense of expenses) {
    const category = getExpenseCategory(expense);
    expenseCategoryMap.set(
      category,
      (expenseCategoryMap.get(category) || 0) + getExpenseAmount(expense),
    );
  }

  const expenseCategorySummary: ExpenseCategorySummary[] = Array.from(
    expenseCategoryMap.entries(),
  )
    .map(([category, value]) => ({
      category,
      label: getExpenseCategoryLabel(category),
      value,
    }))
    .sort((a, b) => b.value - a.value);

  const recentExpenses: RecentExpense[] = expenses
    .slice(0, 12)
    .map((expense, index) => {
      const category = getExpenseCategory(expense);

      return {
        id: getExpenseId(expense, index),
        name: getExpenseName(expense),
        category: getExpenseCategoryLabel(category),
        amount: getExpenseAmount(expense),
        date: formatDateShort(asTrimmedString(expense.created_at)),
      };
    });

  return {
    totals: {
      bookings: bookings.length,
      paidBookings: paidBookings.length,
      grossBookingVolume,
      paidBookingVolume,
      taxCollected,
      trustSafetyRevenue,
      trustSafetyCheckrCosts,
      trustSafetyStripeFees,
      trustSafetyRefunds,
      totalRevenue,
      totalCostOfRevenue,
      grossProfit,
      totalOperatingExpenses,
      operatingIncome,
      totalTaxes,
      otherIncomeExpense,
      netIncome,
      grossMargin,
      netMargin,
      costOfRevenueRatio,
      operatingExpenseRatio,
      payoutToBookingRatio,
      maxVisualValue,
    },
    revenueLines,
    costLines,
    operatingLines,
    taxLines,
    otherLines,
    expenseCategorySummary,
    recentExpenses,
    accountingReadiness: getAccountingReadinessItems({
      bookings,
      expenses,
      payouts,
      disputes,
      financialLedger,
      trustSafetyPurchases,
      trustSafetyFinancialEvents,
    }),
    savedLineCount: customSavedLineCount,
    expenseCount: expenses.length,
  };
}

export default async function AdminProfitLossPage() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessFinancials) {
    return null;
  }

  const pnl = await getProfitLossData();

  const visualRows = [
    {
      label: "Revenue",
      value: pnl.totals.totalRevenue,
      detail: "Statement revenue lines",
      tone: "bg-emerald-400",
    },
    {
      label: "Cost of Revenue",
      value: pnl.totals.totalCostOfRevenue,
      detail: `${percent(pnl.totals.costOfRevenueRatio)} of revenue`,
      tone: "bg-sky-400",
    },
    {
      label: "Operating Expenses",
      value: pnl.totals.totalOperatingExpenses,
      detail: `${percent(pnl.totals.operatingExpenseRatio)} of revenue`,
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
                SitGuru Statement of Operations.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                Live Profit & Loss view using SitGuru bookings, Guru payouts,
                Trust & Safety plan revenue, Checkr costs, Stripe fees,
                expense ledger rows, refunds, dispute records, and custom
                financial statement categories.
              </p>
            </div>

            <ProfitLossExportActions />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Total Revenue"
              value={money(pnl.totals.totalRevenue)}
              detail={`${pnl.totals.paidBookings.toLocaleString()} paid booking rows detected.`}
              tone="emerald"
            />
            <StatCard
              label="Trust & Safety Revenue"
              value={money(pnl.totals.trustSafetyRevenue)}
              detail={`${money(pnl.totals.trustSafetyCheckrCosts + pnl.totals.trustSafetyStripeFees + pnl.totals.trustSafetyRefunds)} related Checkr, Stripe, and refund costs.`}
              tone="sky"
            />
            <StatCard
              label="Gross Profit"
              value={money(pnl.totals.grossProfit)}
              detail={`${percent(pnl.totals.grossMargin)} gross margin after cost of revenue.`}
              tone={pnl.totals.grossProfit >= 0 ? "sky" : "rose"}
            />
            <StatCard
              label="Operating Expenses"
              value={money(pnl.totals.totalOperatingExpenses)}
              detail={`${pnl.expenseCount.toLocaleString()} expense ledger rows tracked.`}
              tone="amber"
            />
            <StatCard
              label="Net Income / Loss"
              value={money(pnl.totals.netIncome)}
              detail={`${percent(pnl.totals.netMargin)} net margin from available records.`}
              tone={pnl.totals.netIncome >= 0 ? "violet" : "rose"}
            />
          </div>
        </section>

        <AccountingReadinessPanel items={pnl.accountingReadiness} />

        <IntegrationFlowPanel />

        <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  Add Statement Line
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  Add P&L categories from dropdown.
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Select a marketplace category, optionally rename it, and add
                  it to the SitGuru statement.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-[#fbfefd] px-4 py-3 text-sm font-bold text-slate-600">
                {pnl.savedLineCount > 0
                  ? `${pnl.savedLineCount} saved statement lines`
                  : "Using default statement lines"}
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
                  {CATEGORY_PRESETS.map((item) => (
                    <option
                      key={`${item.section}:${item.categoryMatch}`}
                      value={`${item.section}:${item.categoryMatch}`}
                    >
                      {SECTION_LABELS[item.section as StatementSectionKey]} —{" "}
                      {item.label}
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
                  placeholder="Example: Instagram Ads, GoDaddy, Insurance..."
                  className="mt-2 w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/10 transition hover:bg-emerald-800 xl:self-end"
              >
                Add Line
              </button>
            </form>
          </div>

          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Add Expense Ledger Row
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Add real operating expenses.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Add expenses like Instagram ads, software, insurance, legal,
              GoDaddy, tools, contractors, or admin costs.
            </p>

            <form action={addExpenseLedgerRow} className="mt-6 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Expense Name
                  </label>
                  <input
                    name="expenseName"
                    type="text"
                    placeholder="Example: Instagram Ads"
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
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
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

        <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Consolidated Statement
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Statement of Operations
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Current live SitGuru operating statement from available platform
                records and saved categories. Added statement lines can be
                deactivated when they are custom saved rows.
              </p>
            </div>

            <div className="p-4 sm:p-6">
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-[#fbfefd]">
                <div className="hidden grid-cols-[minmax(0,1fr)_120px_96px] gap-4 border-b border-slate-100 bg-slate-50 px-4 py-4 sm:grid">
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

                <StatementSection
                  title="Revenue"
                  lines={pnl.revenueLines}
                  totalLabel="Total Revenue"
                  totalValue={pnl.totals.totalRevenue}
                />

                <StatementSection
                  title="Cost of Revenue"
                  lines={pnl.costLines}
                  totalLabel="Total Cost of Revenue"
                  totalValue={pnl.totals.totalCostOfRevenue}
                />

                <div className="grid grid-cols-[1fr_auto] gap-4 border-y border-slate-100 bg-slate-100 px-4 py-3 font-black text-slate-950">
                  <p>Gross Profit</p>
                  <p
                    className={
                      pnl.totals.grossProfit < 0
                        ? "text-rose-700"
                        : "text-slate-950"
                    }
                  >
                    {money(pnl.totals.grossProfit)}
                  </p>
                </div>

                <StatementSection
                  title="Operating Expenses"
                  lines={pnl.operatingLines}
                  totalLabel="Total Operating Expenses"
                  totalValue={pnl.totals.totalOperatingExpenses}
                />

                <div className="grid grid-cols-[1fr_auto] gap-4 border-y border-slate-100 bg-slate-100 px-4 py-3 font-black text-slate-950">
                  <p>Operating Income / Loss</p>
                  <p
                    className={
                      pnl.totals.operatingIncome < 0
                        ? "text-rose-700"
                        : "text-slate-950"
                    }
                  >
                    {money(pnl.totals.operatingIncome)}
                  </p>
                </div>

                <StatementSection
                  title="Taxes"
                  lines={pnl.taxLines}
                  totalLabel="Total Taxes"
                  totalValue={pnl.totals.totalTaxes}
                />

                <StatementSection
                  title="Other Income / Expense"
                  lines={pnl.otherLines}
                  totalLabel="Total Other Income / Expense"
                  totalValue={pnl.totals.otherIncomeExpense}
                />

                <div className="grid grid-cols-[1fr_auto] gap-4 border-t border-emerald-400/30 bg-emerald-50 px-4 py-4 font-black text-slate-950">
                  <p>Net Income / Loss</p>
                  <p
                    className={
                      pnl.totals.netIncome < 0 ? "text-rose-700" : "text-slate-950"
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
                Revenue, cost, expenses, and net result.
              </h2>

              <div className="mt-6 space-y-5">
                {visualRows.map((row) => (
                  <div key={row.label}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-slate-950">
                          {row.label}
                        </p>
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
                            pnl.totals.maxVisualValue,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Gross Booking Volume
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-950">
                    {money(pnl.totals.grossBookingVolume)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Paid Booking Volume
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-950">
                    {money(pnl.totals.paidBookingVolume)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Margin Snapshot
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Gross Margin
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {percent(pnl.totals.grossMargin)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Net Margin
                  </p>
                  <p
                    className={`mt-2 text-2xl font-black ${
                      pnl.totals.netMargin >= 0
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    {percent(pnl.totals.netMargin)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Cost of Revenue Ratio
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {percent(pnl.totals.costOfRevenueRatio)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Operating Expense Ratio
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {percent(pnl.totals.operatingExpenseRatio)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Tax Held
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {money(pnl.totals.taxCollected)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Bookings
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {pnl.totals.bookings.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Operating Expense Detail
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Expense category breakdown
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This is wired to the expense_ledger table and grouped by category.
            </p>

            <div className="mt-6 space-y-5">
              {pnl.expenseCategorySummary.length ? (
                pnl.expenseCategorySummary.map((row, index) => {
                  const tones = [
                    "bg-emerald-400",
                    "bg-sky-400",
                    "bg-violet-400",
                    "bg-amber-400",
                    "bg-rose-400",
                  ];

                  return (
                    <div key={row.category}>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-950">
                          {row.label}
                        </p>
                        <p className="text-sm font-bold text-slate-950">
                          {money(row.value)}
                        </p>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100">
                        <div
                          className={`h-3 rounded-full ${
                            tones[index % tones.length]
                          }`}
                          style={{
                            width: `${getBarWidth(
                              row.value,
                              Math.max(pnl.totals.totalOperatingExpenses, 1),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                  No expense ledger categories found yet. Add an expense above
                  to start building this chart.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  Recent Expenses
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  Expense ledger rows
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Latest live rows from the expense_ledger table.
                </p>
              </div>

              <ActionLink
                href="/api/admin/financials/profit-loss/export?format=csv"
                label="Export"
              />
            </div>

            <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-100">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Expense
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Category
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Date
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {pnl.recentExpenses.length ? (
                      pnl.recentExpenses.map((expense) => (
                        <tr
                          key={expense.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-4 py-4 font-semibold text-slate-950">
                            {expense.name}
                          </td>
                          <td className="px-4 py-4 text-slate-600">
                            {expense.category}
                          </td>
                          <td className="px-4 py-4 font-semibold text-slate-950">
                            {moneyExact(expense.amount)}
                          </td>
                          <td className="px-4 py-4 text-slate-600">
                            {expense.date}
                          </td>
                          <td className="px-4 py-4">
                            <form action={deleteExpenseLedgerRow}>
                              <input
                                type="hidden"
                                name="expenseId"
                                value={expense.id}
                              />
                              <button
                                type="submit"
                                className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                              >
                                Void
                              </button>
                            </form>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-slate-600"
                        >
                          No expense ledger rows found yet. Use the Add Expense
                          form above to start tracking operating expenses.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
