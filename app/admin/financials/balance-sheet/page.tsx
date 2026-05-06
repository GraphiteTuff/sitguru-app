import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type BalanceSheetRow = Record<string, unknown>;
type BookingRow = Record<string, unknown>;
type PayoutRow = Record<string, unknown>;
type ExpenseRow = Record<string, unknown>;
type DisputeRow = Record<string, unknown>;
type FinancialLedgerRow = Record<string, unknown>;
type BankTransactionRow = Record<string, unknown>;
type StripeTransactionRow = Record<string, unknown>;

type AdminIdentity = {
  id: string;
  email: string;
  role: string;
  canAccessFinancials: boolean;
};

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type BalanceSectionKey =
  | "current_assets"
  | "non_current_assets"
  | "current_liabilities"
  | "long_term_liabilities"
  | "equity";

type BalanceLine = {
  id: string;
  dbId: string;
  isSaved: boolean;
  section: BalanceSectionKey;
  label: string;
  amount: number;
  notes: string;
  displayOrder: number;
};

type BalanceReadinessItem = {
  label: string;
  status: "ready" | "needs_review" | "missing";
  detail: string;
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
  { section: "current_assets", label: "Navy Federal Business Checking" },
  { section: "current_assets", label: "Navy Federal Business Savings" },
  { section: "current_assets", label: "Cash / Operating Account" },
  { section: "current_assets", label: "Stripe Balance / Pending Receipts" },
  { section: "current_assets", label: "Accounts Receivable" },
  { section: "current_assets", label: "Prepaid Expenses" },
  { section: "non_current_assets", label: "Equipment" },
  { section: "non_current_assets", label: "Office Furniture" },
  { section: "non_current_assets", label: "Intangible Assets / Software" },
  { section: "non_current_assets", label: "Other Long-Term Assets" },
  { section: "current_liabilities", label: "Accounts Payable" },
  { section: "current_liabilities", label: "Short-Term Loans" },
  { section: "current_liabilities", label: "Guru Payouts Payable" },
  { section: "current_liabilities", label: "Sales Tax Payable" },
  { section: "current_liabilities", label: "Refunds Payable" },
  { section: "current_liabilities", label: "Disputes / Chargebacks Payable" },
  { section: "long_term_liabilities", label: "Bank Loan" },
  { section: "long_term_liabilities", label: "Long-Term Debt" },
  { section: "long_term_liabilities", label: "Lease Obligations" },
  { section: "equity", label: "Owner’s Capital" },
  { section: "equity", label: "Retained Earnings" },
  { section: "equity", label: "Current Net Income / Loss" },
] as const;

const DEFAULT_BALANCE_LINES: BalanceSheetRow[] = [
  {
    section: "current_assets",
    label: "Navy Federal Business Checking",
    amount: 0,
    display_order: 5,
    notes: "Bank-connected or manually entered operating cash.",
  },
  {
    section: "current_assets",
    label: "Navy Federal Business Savings",
    amount: 0,
    display_order: 8,
    notes: "Bank-connected or manually entered savings and reserves.",
  },
  {
    section: "current_assets",
    label: "Stripe Balance / Pending Receipts",
    amount: 0,
    display_order: 20,
    notes: "Stripe clearing balance and pending payout placeholder.",
  },
  {
    section: "current_assets",
    label: "Accounts Receivable",
    amount: 0,
    display_order: 30,
    notes: "Uncollected customer balances from unpaid bookings.",
  },
  {
    section: "current_assets",
    label: "Prepaid Expenses",
    amount: 0,
    display_order: 40,
    notes: "Prepaid tools, insurance, or services.",
  },
  {
    section: "non_current_assets",
    label: "Equipment",
    amount: 0,
    display_order: 10,
    notes: "Equipment owned by SitGuru.",
  },
  {
    section: "non_current_assets",
    label: "Intangible Assets / Software",
    amount: 0,
    display_order: 20,
    notes: "Software or platform asset value.",
  },
  {
    section: "current_liabilities",
    label: "Guru Payouts Payable",
    amount: 0,
    display_order: 10,
    notes: "Estimated from paid bookings that have not been released to gurus.",
  },
  {
    section: "current_liabilities",
    label: "Sales Tax Payable",
    amount: 0,
    display_order: 20,
    notes: "Estimated from booking tax fields.",
  },
  {
    section: "current_liabilities",
    label: "Refunds Payable",
    amount: 0,
    display_order: 30,
    notes: "Estimated from refund-related bookings and customer credits.",
  },
  {
    section: "current_liabilities",
    label: "Disputes / Chargebacks Payable",
    amount: 0,
    display_order: 40,
    notes: "Estimated from dispute cases with financial impact.",
  },
  {
    section: "long_term_liabilities",
    label: "Long-Term Debt",
    amount: 0,
    display_order: 10,
    notes: "Manual long-term debt.",
  },
  {
    section: "equity",
    label: "Owner’s Capital",
    amount: 0,
    display_order: 10,
    notes: "Manual owner contribution.",
  },
  {
    section: "equity",
    label: "Retained Earnings",
    amount: 0,
    display_order: 20,
    notes: "Manual retained earnings from prior periods.",
  },
  {
    section: "equity",
    label: "Current Net Income / Loss",
    amount: 0,
    display_order: 30,
    notes: "Estimated from current SitGuru P&L activity.",
  },
];

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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
    safeRows<Record<string, unknown>>(
      supabaseAdmin
        .from("admin_users")
        .select("role,email,is_active,can_access_financials")
        .eq("user_id", user.id)
        .limit(1),
      "admin_users_balance_sheet_access",
    ),
    safeRows<Record<string, unknown>>(
      supabaseAdmin
        .from("profiles")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "profiles_balance_sheet_access",
    ),
    safeRows<Record<string, unknown>>(
      supabaseAdmin
        .from("users")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "users_balance_sheet_access",
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
    // Keep finance actions from failing if the audit table has not been created yet.
  }

  try {
    await supabaseAdmin.from("admin_audit_logs").insert(payload);
  } catch (error) {
    console.warn("Balance sheet audit log skipped:", error);
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
    })
    .select("id")
    .single();

  await writeFinancialAuditLog({
    actor,
    action: "add_balance_sheet_line",
    targetType: "balance_sheet_line",
    targetId: asTrimmedString((insertedLine as Record<string, unknown> | null)?.id),
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
    .update({ is_active: false })
    .eq("id", lineId);

  await writeFinancialAuditLog({
    actor,
    action: "deactivate_balance_sheet_line",
    targetType: "balance_sheet_line",
    targetId: lineId,
  });

  revalidatePath("/admin/financials/balance-sheet");
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

function getBookingTaxAmount(booking: BookingRow) {
  return toNumber(booking.sales_tax_amount);
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

function isPayoutReleased(status: string) {
  const normalized = status.toLowerCase();

  return (
    normalized.includes("paid") ||
    normalized.includes("released") ||
    normalized.includes("complete")
  );
}

function getBookingPayoutStatus(booking: BookingRow) {
  return (
    asTrimmedString(booking.payout_status) ||
    asTrimmedString(booking.guru_payout_status) ||
    "pending"
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
  return (
    asTrimmedString(expense.category) ||
    asTrimmedString(expense.expense_category) ||
    asTrimmedString(expense.type) ||
    asTrimmedString(expense.name) ||
    "other"
  ).toLowerCase();
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

function getLedgerDebit(row: FinancialLedgerRow) {
  return toNumber(row.debit);
}

function getLedgerCredit(row: FinancialLedgerRow) {
  return toNumber(row.credit);
}

function getLedgerAccountName(row: FinancialLedgerRow) {
  return asTrimmedString(row.account_name || row.account).toLowerCase();
}

function getLedgerText(row: FinancialLedgerRow) {
  return [
    row.source,
    row.source_type,
    row.account_name,
    row.account,
    row.description,
    row.memo,
    row.external_account_name,
  ]
    .map(asTrimmedString)
    .join(" ")
    .toLowerCase();
}

function getAnyRowText(row: Record<string, unknown>) {
  return [
    row.source,
    row.source_type,
    row.account_name,
    row.account,
    row.account_type,
    row.institution_name,
    row.description,
    row.name,
    row.memo,
    row.category,
    row.external_account_name,
  ]
    .map(asTrimmedString)
    .join(" ")
    .toLowerCase();
}

function getLedgerNetForAccountMatches(
  ledgerEntries: FinancialLedgerRow[],
  accountNameMatches: string[],
) {
  const normalizedMatches = accountNameMatches.map((name) => name.toLowerCase());

  return ledgerEntries.reduce((sum, row) => {
    const accountName = getLedgerAccountName(row);
    const text = getLedgerText(row);
    const matches = normalizedMatches.some(
      (match) => accountName.includes(match) || text.includes(match),
    );

    if (!matches) return sum;

    return sum + getLedgerDebit(row) - getLedgerCredit(row);
  }, 0);
}

function getBankTransactionAmount(row: BankTransactionRow) {
  if (row.amount !== undefined) return toNumber(row.amount);
  return toNumber(row.credit) - toNumber(row.debit);
}

function getBankNetForMatches(
  bankTransactions: BankTransactionRow[],
  matches: string[],
) {
  const normalizedMatches = matches.map((match) => match.toLowerCase());

  return bankTransactions.reduce((sum, row) => {
    const text = getAnyRowText(row);
    const matchesRow = normalizedMatches.some((match) => text.includes(match));

    if (!matchesRow) return sum;

    return sum + getBankTransactionAmount(row);
  }, 0);
}

function getStripeTransactionNet(row: StripeTransactionRow) {
  return (
    toNumber(row.net) ||
    toNumber(row.net_amount) ||
    toNumber(row.amount) - toNumber(row.fee) ||
    toNumber(row.balance_amount)
  );
}

function getStripeBalanceEstimate(stripeTransactions: StripeTransactionRow[]) {
  return stripeTransactions.reduce(
    (sum, row) => sum + getStripeTransactionNet(row),
    0,
  );
}

function getLineSection(line: BalanceSheetRow): BalanceSectionKey {
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

function getLineId(line: BalanceSheetRow, index: number) {
  return (
    asTrimmedString(line.id) ||
    `${asTrimmedString(line.section)}-${asTrimmedString(line.label)}-${index}`
  );
}

function normalizeBalanceLabel(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function getBalanceLineKey(line: BalanceSheetRow) {
  return `${getLineSection(line)}:${normalizeBalanceLabel(asTrimmedString(line.label))}`;
}

function dedupeBalanceLines(lines: BalanceSheetRow[]) {
  const byKey = new Map<string, BalanceSheetRow>();

  for (const line of lines) {
    byKey.set(getBalanceLineKey(line), line);
  }

  return Array.from(byKey.values()).sort(
    (a, b) =>
      (toNumber(a.display_order) || 100) - (toNumber(b.display_order) || 100) ||
      asTrimmedString(a.label).localeCompare(asTrimmedString(b.label)),
  );
}

function calculateCurrentNetIncome({
  bookings,
  expenses,
  disputes,
}: {
  bookings: BookingRow[];
  expenses: ExpenseRow[];
  disputes: DisputeRow[];
}) {
  const bookingRevenue = bookings.reduce(
    (sum, booking) => sum + getBookingGrossAmount(booking),
    0,
  );
  const platformFees = bookings.reduce(
    (sum, booking) => sum + getPlatformFee(booking),
    0,
  );
  const guruPayouts = bookings.reduce(
    (sum, booking) => sum + getGuruPayoutAmount(booking),
    0,
  );
  const refunds = bookings.reduce(
    (sum, booking) => sum + getRefundAmount(booking),
    0,
  );
  const disputeLosses = disputes.reduce(
    (sum, dispute) => sum + getDisputeAmount(dispute),
    0,
  );
  const operatingExpenses = expenses
    .filter((expense) => {
      const category = getExpenseCategory(expense);
      return !category.includes("asset") && !category.includes("prepaid");
    })
    .reduce((sum, expense) => sum + getExpenseAmount(expense), 0);

  return bookingRevenue + platformFees - guruPayouts - refunds - disputeLosses - operatingExpenses;
}

function getBalanceLineAmount({
  line,
  bookings,
  expenses,
  disputes,
  ledgerEntries,
  bankTransactions,
  stripeTransactions,
  currentNetIncome,
}: {
  line: BalanceSheetRow;
  bookings: BookingRow[];
  expenses: ExpenseRow[];
  disputes: DisputeRow[];
  ledgerEntries: FinancialLedgerRow[];
  bankTransactions: BankTransactionRow[];
  stripeTransactions: StripeTransactionRow[];
  currentNetIncome: number;
}) {
  const label = normalizeBalanceLabel(asTrimmedString(line.label));
  const storedAmount = toNumber(line.amount);

  if (
    label.includes("navy federal business checking") ||
    label.includes("checking") ||
    label === "cash" ||
    label === "cash / operating account"
  ) {
    return (
      storedAmount +
      getLedgerNetForAccountMatches(ledgerEntries, [
        "cash",
        "operating account",
        "checking",
        "navy federal business checking",
      ]) +
      getBankNetForMatches(bankTransactions, ["checking", "navy", "operating"])
    );
  }

  if (label.includes("savings")) {
    return (
      storedAmount +
      getLedgerNetForAccountMatches(ledgerEntries, [
        "savings",
        "reserve",
        "navy federal business savings",
      ]) +
      getBankNetForMatches(bankTransactions, ["savings", "reserve"])
    );
  }

  if (label.includes("stripe") || label.includes("pending receipts")) {
    return (
      storedAmount +
      getLedgerNetForAccountMatches(ledgerEntries, [
        "stripe balance",
        "stripe clearing",
        "pending receipts",
      ]) +
      getStripeBalanceEstimate(stripeTransactions)
    );
  }

  if (label.includes("guru payout") || label.includes("payouts payable")) {
    const bookingPendingPayouts = bookings.reduce((sum, booking) => {
      const payoutStatus = getBookingPayoutStatus(booking);

      if (isPaidBooking(booking) && !isPayoutReleased(payoutStatus)) {
        return sum + getGuruPayoutAmount(booking);
      }

      return sum;
    }, 0);

    return storedAmount + bookingPendingPayouts;
  }

  if (label.includes("sales tax")) {
    return (
      storedAmount +
      bookings.reduce((sum, booking) => sum + getBookingTaxAmount(booking), 0)
    );
  }

  if (label.includes("refund")) {
    return (
      storedAmount +
      bookings.reduce((sum, booking) => sum + getRefundAmount(booking), 0)
    );
  }

  if (label.includes("dispute") || label.includes("chargeback")) {
    return storedAmount + disputes.reduce((sum, dispute) => sum + getDisputeAmount(dispute), 0);
  }

  if (label.includes("receivable")) {
    const bookingReceivables = bookings.reduce((sum, booking) => {
      return isPaidBooking(booking) ? sum : sum + getBookingGrossAmount(booking);
    }, 0);

    return (
      storedAmount +
      bookingReceivables +
      getLedgerNetForAccountMatches(ledgerEntries, ["accounts receivable"])
    );
  }

  if (label.includes("prepaid")) {
    const prepaidExpenses = expenses
      .filter((expense) => getExpenseCategory(expense).includes("prepaid"))
      .reduce((sum, expense) => sum + getExpenseAmount(expense), 0);

    return storedAmount + prepaidExpenses;
  }

  if (label.includes("current net income") || label.includes("current net loss")) {
    return storedAmount + currentNetIncome;
  }

  return storedAmount;
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
      </div>

      <div className="mt-4 rounded-2xl border border-slate-100 bg-[#fbfefd] p-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
          Statement Exports
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
          Export routes are ready to wire to the same secure accounting package
          pattern used by Profit & Loss.
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
            label="PDF / Print"
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
                {line.notes ? (
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                    {line.notes}
                  </p>
                ) : null}
              </div>

              <p className="text-right text-sm font-black tabular-nums text-slate-950 sm:text-base">
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
            This panel checks whether SitGuru has cash, bank, Stripe clearing,
            receivable, payable, liability, equity, and reconciliation data ready
            for CPA review and QuickBooks-style export mapping.
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

function BalanceFlowPanel() {
  const steps = [
    "Stripe and booking activity create receivables, clearing balances, payouts payable, refunds, and tax liabilities.",
    "Navy Federal checking and savings confirm real cash balances, deposits, transfers, and withdrawals.",
    "Manual balance lines capture owner capital, retained earnings, loans, equipment, prepaid assets, and corrections.",
    "Current net income/loss feeds from available P&L activity so equity stays connected to operations.",
    "Financial Overview, Balance Sheet, Cash Flow, exports, and CPA handoff use the same accounting foundation.",
  ];

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
        Balance Sheet Flow
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        How this statement should stay wired
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

function getReadinessItems({
  balanceLineCount,
  bankTransactions,
  stripeTransactions,
  ledgerEntries,
  currentAssets,
  totalLiabilities,
  totalEquity,
  isBalanced,
}: {
  balanceLineCount: number;
  bankTransactions: BankTransactionRow[];
  stripeTransactions: StripeTransactionRow[];
  ledgerEntries: FinancialLedgerRow[];
  currentAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  isBalanced: boolean;
}): BalanceReadinessItem[] {
  const bankRows = bankTransactions.length || ledgerEntries.filter((row) => {
    const text = getLedgerText(row);
    return text.includes("navy") || text.includes("checking") || text.includes("savings") || text.includes("bank");
  }).length;
  const stripeRows = stripeTransactions.length || ledgerEntries.filter((row) => getLedgerText(row).includes("stripe")).length;
  const reconciliationRows = ledgerEntries.filter((entry) =>
    Boolean(entry.reconciled_at || entry.matched_transaction_id || entry.reconciliation_id),
  ).length;

  return [
    {
      label: "Bank cash accounts",
      status: bankRows ? "ready" : "needs_review",
      detail: bankRows
        ? `${bankRows.toLocaleString()} Navy Federal/bank-related rows are available for checking and savings support.`
        : "Connect Plaid or import Navy Federal CSV/QBO/OFX records to support cash balances.",
    },
    {
      label: "Stripe clearing balance",
      status: stripeRows ? "ready" : "needs_review",
      detail: stripeRows
        ? `${stripeRows.toLocaleString()} Stripe-related rows can support pending receipts and clearing balances.`
        : "Normalize Stripe balance transactions into the ledger so pending payouts and fees are supportable.",
    },
    {
      label: "Manual balance lines",
      status: balanceLineCount ? "ready" : "needs_review",
      detail: balanceLineCount
        ? `${balanceLineCount.toLocaleString()} custom balance sheet rows are saved for owner capital, debt, cash, or other adjustments.`
        : "Add manual rows for owner capital, retained earnings, debt, fixed assets, and corrections.",
    },
    {
      label: "Assets captured",
      status: currentAssets ? "ready" : "needs_review",
      detail: currentAssets
        ? `${money(currentAssets)} in current assets is currently reflected.`
        : "Cash, Stripe clearing, receivables, or prepaid asset rows need to be connected or entered.",
    },
    {
      label: "Liabilities and equity",
      status: totalLiabilities || totalEquity ? "ready" : "needs_review",
      detail: `${money(totalLiabilities)} liabilities and ${money(totalEquity)} equity are currently reflected.` ,
    },
    {
      label: "Balance equation",
      status: isBalanced ? "ready" : "missing",
      detail: isBalanced
        ? "Assets equal liabilities plus equity within the current rounding threshold."
        : "Add or adjust cash, owner capital, retained earnings, current income, debt, or liabilities until the equation balances.",
    },
  ];
}

async function getBalanceSheetData() {
  const [
    rawSavedLines,
    rawBookings,
    rawPayouts,
    rawExpenses,
    rawDisputes,
    rawLedgerEntries,
    rawBankTransactions,
    rawStripeTransactions,
  ] = await Promise.all([
    safeRows<BalanceSheetRow>(
      supabaseAdmin
        .from("balance_sheet_lines")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(500),
      "balance_sheet_lines",
    ),
    safeRows<BookingRow>(
      supabaseAdmin
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1500),
      "bookings",
    ),
    safeRows<PayoutRow>(
      supabaseAdmin
        .from("guru_payouts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1500),
      "guru_payouts",
    ),
    safeRows<ExpenseRow>(
      supabaseAdmin
        .from("expense_ledger")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1500),
      "expense_ledger",
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
        .limit(3000),
      "financial_ledger_entries",
    ),
    safeRows<BankTransactionRow>(
      supabaseAdmin
        .from("bank_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3000),
      "bank_transactions",
    ),
    safeRows<StripeTransactionRow>(
      supabaseAdmin
        .from("stripe_balance_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3000),
      "stripe_balance_transactions",
    ),
  ]);

  const savedLines = rawSavedLines.filter((row) => !isArchivedRow(row));
  const bookings = rawBookings.filter((row) => !isArchivedRow(row));
  const payouts = rawPayouts.filter((row) => !isArchivedRow(row));
  const expenses = rawExpenses.filter((row) => !isArchivedRow(row));
  const disputes = rawDisputes.filter((row) => !isArchivedRow(row));
  const ledgerEntries = rawLedgerEntries.filter((row) => !isArchivedRow(row));
  const bankTransactions = rawBankTransactions.filter((row) => !isArchivedRow(row));
  const stripeTransactions = rawStripeTransactions.filter((row) => !isArchivedRow(row));

  const defaultLineKeys = new Set(DEFAULT_BALANCE_LINES.map(getBalanceLineKey));
  const sourceLines = dedupeBalanceLines([...DEFAULT_BALANCE_LINES, ...savedLines]);
  const customSavedLineCount = savedLines.filter((line) => !defaultLineKeys.has(getBalanceLineKey(line))).length;
  const currentNetIncome = calculateCurrentNetIncome({ bookings, expenses, disputes });

  const lines: BalanceLine[] = sourceLines
    .map((line, index) => {
      const dbId = asTrimmedString(line.id);
      const isCoreDefaultLine = defaultLineKeys.has(getBalanceLineKey(line));

      return {
        id: getLineId(line, index),
        dbId,
        isSaved: Boolean(dbId && !isCoreDefaultLine),
        section: getLineSection(line),
        label: asTrimmedString(line.label) || "Balance sheet line",
        amount: getBalanceLineAmount({
          line,
          bookings,
          expenses,
          disputes,
          ledgerEntries,
          bankTransactions,
          stripeTransactions,
          currentNetIncome,
        }),
        notes: asTrimmedString(line.notes),
        displayOrder: toNumber(line.display_order) || 100,
      };
    })
    .sort((a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label));

  const currentAssets = lines.filter((line) => line.section === "current_assets");
  const nonCurrentAssets = lines.filter((line) => line.section === "non_current_assets");
  const currentLiabilities = lines.filter((line) => line.section === "current_liabilities");
  const longTermLiabilities = lines.filter((line) => line.section === "long_term_liabilities");
  const equityLines = lines.filter((line) => line.section === "equity");

  const totalCurrentAssets = currentAssets.reduce((sum, line) => sum + line.amount, 0);
  const totalNonCurrentAssets = nonCurrentAssets.reduce((sum, line) => sum + line.amount, 0);
  const totalAssets = totalCurrentAssets + totalNonCurrentAssets;
  const totalCurrentLiabilities = currentLiabilities.reduce((sum, line) => sum + line.amount, 0);
  const totalLongTermLiabilities = longTermLiabilities.reduce((sum, line) => sum + line.amount, 0);
  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;
  const totalEquity = equityLines.reduce((sum, line) => sum + line.amount, 0);
  const liabilitiesPlusEquity = totalLiabilities + totalEquity;
  const balanceDifference = totalAssets - liabilitiesPlusEquity;
  const isBalanced = Math.abs(balanceDifference) < 1;
  const maxVisualValue = Math.max(totalAssets, totalLiabilities, Math.abs(totalEquity), Math.abs(balanceDifference), 1);

  const recentExpenseAssets = expenses.slice(0, 5).map((expense, index) => ({
    id: asTrimmedString(expense.id) || `${getExpenseName(expense)}-${index}`,
    name: getExpenseName(expense),
    amount: getExpenseAmount(expense),
    date: formatDateShort(asTrimmedString(expense.created_at)),
  }));

  const pendingPayoutsFromPayoutTable = payouts.reduce((sum, payout) => {
    const status = (
      asTrimmedString(payout.status) || asTrimmedString(payout.payout_status)
    ).toLowerCase();

    if (!isPayoutReleased(status)) {
      return sum + (toNumber(payout.amount) || toNumber(payout.payout_amount));
    }

    return sum;
  }, 0);

  const readinessItems = getReadinessItems({
    balanceLineCount: customSavedLineCount,
    bankTransactions,
    stripeTransactions,
    ledgerEntries,
    currentAssets: totalCurrentAssets,
    totalLiabilities,
    totalEquity,
    isBalanced,
  });

  return {
    currentAssets,
    nonCurrentAssets,
    currentLiabilities,
    longTermLiabilities,
    equityLines,
    recentExpenseAssets,
    savedLineCount: customSavedLineCount,
    readinessItems,
    totals: {
      bookings: bookings.length,
      totalCurrentAssets,
      totalNonCurrentAssets,
      totalAssets,
      totalCurrentLiabilities,
      totalLongTermLiabilities,
      totalLiabilities,
      totalEquity,
      liabilitiesPlusEquity,
      balanceDifference,
      isBalanced,
      maxVisualValue,
      currentNetIncome,
      pendingPayoutsFromPayoutTable,
      bankRows: bankTransactions.length,
      stripeRows: stripeTransactions.length,
    },
  };
}

export default async function AdminBalanceSheetPage() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessFinancials) {
    return null;
  }

  const balance = await getBalanceSheetData();

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
      detail: "Owner capital, retained earnings, and current income",
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
                pulls from bookings, payouts, Stripe clearing rows, Navy Federal
                banking, expense records, manual balance lines, and current P&L
                activity.
              </p>
            </div>

            <BalanceExportPanel />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  Add Balance Sheet Line
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  Add assets, liabilities, or equity.
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Add manual balance sheet rows for cash, debt, owner capital,
                  assets, liabilities, opening balances, or CPA adjustments.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-[#fbfefd] px-4 py-3 text-sm font-bold text-slate-600">
                {balance.savedLineCount > 0
                  ? `${balance.savedLineCount} custom balance lines`
                  : "Using core balance lines"}
              </div>
            </div>

            <form
              action={addBalanceSheetLine}
              className="mt-6 grid gap-4 2xl:grid-cols-[1fr_1fr]"
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
          </div>

          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Balance Check
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Assets = Liabilities + Equity
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This card compares SitGuru’s total assets against total
              liabilities plus total equity and shows where the balance sheet
              needs adjustment.
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
                <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-4 text-sm font-black text-slate-950">
                  <span>Difference</span>
                  <span className={balance.totals.isBalanced ? "text-emerald-700" : "text-rose-700"}>
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
                  Add or adjust Navy Federal cash, Stripe clearing, owner capital,
                  retained earnings, debt, current income, or liabilities until
                  the equation balances.
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
                        width: `${getBarWidth(row.value, balance.totals.maxVisualValue)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-sm">
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
                  <p className={balance.totals.isBalanced ? "text-emerald-700" : "text-rose-700"}>
                    {money(balance.totals.balanceDifference)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Balance Sheet Summary
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Assets, liabilities, equity, and difference.
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
                          width: `${getBarWidth(row.value, balance.totals.maxVisualValue)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Bank Rows
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-950">
                    {balance.totals.bankRows.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Stripe Rows
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-950">
                    {balance.totals.stripeRows.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Support Snapshot
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Current Assets
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {money(balance.totals.totalCurrentAssets)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Current Liabilities
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {money(balance.totals.totalCurrentLiabilities)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Current Net Income / Loss
                  </p>
                  <p
                    className={`mt-2 text-2xl font-black ${
                      balance.totals.currentNetIncome >= 0
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    {money(balance.totals.currentNetIncome)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Bookings Used
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {balance.totals.bookings.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-sky-100 bg-sky-50 p-5 shadow-sm sm:p-6 lg:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                SitGuru Balance Sheet Notes
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                Auto-estimated lines include guru payouts payable, sales tax
                payable, refund obligations, dispute exposure, accounts
                receivable, Stripe clearing, bank cash, and current net income
                when source data is available. Owner capital, retained earnings,
                long-term debt, equipment, and opening balances should usually
                be entered or confirmed manually with your CPA.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Current Asset Detail
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Cash, Stripe, receivables, and prepaid assets
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              These are the asset lines that should tie back to bank accounts,
              Stripe clearing activity, booking receivables, or manual CPA entries.
            </p>

            <div className="mt-6 space-y-5">
              {balance.currentAssets.length ? (
                balance.currentAssets.map((row, index) => {
                  const tones = ["bg-emerald-400", "bg-sky-400", "bg-violet-400", "bg-amber-400", "bg-rose-400"];

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
                          style={{ width: `${getBarWidth(row.amount, Math.max(balance.totals.totalCurrentAssets, 1))}%` }}
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

          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  Recent Operating Activity
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  Expense rows for balance review
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Latest expense ledger rows that may affect assets, liabilities,
                  equity, or supporting schedules.
                </p>
              </div>

              <ActionLink
                href="/api/admin/financials/balance-sheet/export?format=csv"
                label="Export"
              />
            </div>

            <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-100">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Activity
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Date
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {balance.recentExpenseAssets.length ? (
                      balance.recentExpenseAssets.map((expense) => (
                        <tr key={expense.id} className="transition hover:bg-slate-50">
                          <td className="px-4 py-4 font-semibold text-slate-950">
                            {expense.name}
                          </td>
                          <td className="px-4 py-4 font-semibold text-slate-950">
                            {moneyExact(expense.amount)}
                          </td>
                          <td className="px-4 py-4 text-slate-600">
                            {expense.date}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-slate-600">
                          No recent expense ledger rows found yet.
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
