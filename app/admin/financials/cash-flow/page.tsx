import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type CashFlowRow = Record<string, unknown>;
type BookingRow = Record<string, unknown>;
type ExpenseRow = Record<string, unknown>;
type PayoutRow = Record<string, unknown>;
type DisputeRow = Record<string, unknown>;
type FinancialLedgerRow = Record<string, unknown>;
type BankTransactionRow = Record<string, unknown>;
type StripeBalanceTransactionRow = Record<string, unknown>;

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

type CashFlowSectionKey =
  | "operating"
  | "investing"
  | "financing"
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

type CashFlowReadinessItem = {
  label: string;
  status: "ready" | "needs_review" | "missing";
  detail: string;
};

type RecentCashActivity = {
  id: string;
  name: string;
  source: string;
  amount: number;
  date: string;
};

const SECTION_LABELS: Record<CashFlowSectionKey, string> = {
  operating: "Operating Activities",
  investing: "Investing Activities",
  financing: "Financing Activities",
  cash_position: "Cash Position",
};

const SECTION_OPTIONS: { value: CashFlowSectionKey; label: string }[] = [
  { value: "operating", label: "Operating Activities" },
  { value: "investing", label: "Investing Activities" },
  { value: "financing", label: "Financing Activities" },
  { value: "cash_position", label: "Cash Position" },
];

const LINE_PRESETS = [
  { section: "operating", label: "Cash Received from Bookings" },
  { section: "operating", label: "Stripe Processing Fees" },
  { section: "operating", label: "Cash Paid to Gurus" },
  { section: "operating", label: "Cash Paid for Operating Expenses" },
  { section: "operating", label: "Cash Paid for Refunds / Credits" },
  { section: "operating", label: "Sales Tax Held / Paid" },
  { section: "operating", label: "Dispute Losses / Adjustments" },
  { section: "investing", label: "Equipment Purchases" },
  { section: "investing", label: "Software / Platform Asset Investment" },
  { section: "investing", label: "Other Long-Term Asset Activity" },
  { section: "financing", label: "Owner Contributions" },
  { section: "financing", label: "Loans Received" },
  { section: "financing", label: "Loan Repayments" },
  { section: "financing", label: "Transfers to Savings / Reserves" },
  { section: "financing", label: "Transfers from Savings / Reserves" },
  { section: "financing", label: "Other Financing Activity" },
  { section: "cash_position", label: "Beginning Cash Balance" },
  { section: "cash_position", label: "Manual Cash Adjustment" },
] as const;

const DEFAULT_CASH_FLOW_LINES: CashFlowRow[] = [
  {
    section: "operating",
    label: "Cash Received from Bookings",
    amount: 0,
    display_order: 10,
    notes: "Estimated from paid SitGuru booking rows and Stripe payment activity.",
    source: "bookings/stripe",
  },
  {
    section: "operating",
    label: "Stripe Processing Fees",
    amount: 0,
    display_order: 15,
    notes: "Estimated from Stripe balance transactions when available.",
    source: "stripe_balance_transactions",
  },
  {
    section: "operating",
    label: "Cash Paid to Gurus",
    amount: 0,
    display_order: 20,
    notes: "Estimated from Guru payout records, with booking fallback.",
    source: "guru_payouts/bookings",
  },
  {
    section: "operating",
    label: "Cash Paid for Operating Expenses",
    amount: 0,
    display_order: 30,
    notes: "Estimated from expense ledger and Navy Federal bank outflows.",
    source: "expense_ledger/bank_transactions",
  },
  {
    section: "operating",
    label: "Cash Paid for Refunds / Credits",
    amount: 0,
    display_order: 40,
    notes: "Estimated from refunds in bookings, Stripe, and the financial ledger.",
    source: "bookings/stripe/financial_ledger_entries",
  },
  {
    section: "operating",
    label: "Sales Tax Held / Paid",
    amount: 0,
    display_order: 50,
    notes: "Estimated from booking sales tax fields.",
    source: "bookings",
  },
  {
    section: "operating",
    label: "Dispute Losses / Adjustments",
    amount: 0,
    display_order: 60,
    notes: "Estimated from dispute records and chargeback activity.",
    source: "dispute_cases/stripe",
  },
  {
    section: "investing",
    label: "Equipment Purchases",
    amount: 0,
    display_order: 10,
    notes: "Manual investing activity.",
    source: "manual",
  },
  {
    section: "investing",
    label: "Software / Platform Asset Investment",
    amount: 0,
    display_order: 20,
    notes: "Manual platform investment.",
    source: "manual",
  },
  {
    section: "financing",
    label: "Owner Contributions",
    amount: 0,
    display_order: 10,
    notes: "Manual owner contribution or capital injection.",
    source: "manual/bank_transactions",
  },
  {
    section: "financing",
    label: "Loans Received",
    amount: 0,
    display_order: 20,
    notes: "Manual loan proceeds.",
    source: "manual/bank_transactions",
  },
  {
    section: "financing",
    label: "Loan Repayments",
    amount: 0,
    display_order: 30,
    notes: "Manual loan repayment.",
    source: "manual/bank_transactions",
  },
  {
    section: "financing",
    label: "Transfers to Savings / Reserves",
    amount: 0,
    display_order: 40,
    notes: "Navy Federal transfer movement to savings, tax reserve, or emergency reserve.",
    source: "bank_transactions",
  },
  {
    section: "financing",
    label: "Transfers from Savings / Reserves",
    amount: 0,
    display_order: 50,
    notes: "Navy Federal transfer movement back to checking.",
    source: "bank_transactions",
  },
  {
    section: "cash_position",
    label: "Beginning Cash Balance",
    amount: 0,
    display_order: 10,
    notes: "Manual beginning cash balance or opening bank balance.",
    source: "manual/bank_transactions",
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
    // Keep finance actions from failing if audit tables are not created yet.
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

async function addCashFlowLine(formData: FormData) {
  "use server";

  const actor = await requireFinancialAdminAction("add_cash_flow_line");
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
    .from("cash_flow_lines")
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
    .update({ is_active: false })
    .eq("id", lineId);

  await writeFinancialAuditLog({
    actor,
    action: "deactivate_cash_flow_line",
    targetType: "cash_flow_line",
    targetId: lineId,
  });

  revalidatePath("/admin/financials/cash-flow");
}

function getBookingGrossAmount(booking: BookingRow) {
  const subtotal = toNumber(booking.subtotal_amount);

  if (subtotal > 0) return subtotal;

  return (
    toNumber(booking.total_customer_paid) ||
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
    "Operating Expense"
  );
}

function getDisputeAmount(dispute: DisputeRow) {
  return (
    toNumber(dispute.amount) ||
    toNumber(dispute.dispute_amount) ||
    toNumber(dispute.refund_amount) ||
    toNumber(dispute.total_amount)
  );
}

function getLedgerDebit(row: FinancialLedgerRow) {
  return toNumber(row.debit);
}

function getLedgerCredit(row: FinancialLedgerRow) {
  return toNumber(row.credit);
}

function getLedgerAmount(row: FinancialLedgerRow) {
  return (
    toNumber(row.amount) ||
    getLedgerDebit(row) - getLedgerCredit(row) ||
    toNumber(row.net_amount)
  );
}

function getLedgerText(row: Record<string, unknown>) {
  return [
    row.source,
    row.source_type,
    row.account_name,
    row.account,
    row.description,
    row.memo,
    row.name,
    row.category,
    row.external_account_name,
    row.institution_name,
  ]
    .map(asTrimmedString)
    .join(" ")
    .toLowerCase();
}

function getLedgerRefundCashOutflow(ledgerEntries: FinancialLedgerRow[]) {
  return ledgerEntries.reduce((sum, row) => {
    const text = getLedgerText(row);

    if (
      text.includes("refund") ||
      text.includes("customer credit") ||
      text.includes("customer credits")
    ) {
      return sum + Math.abs(getLedgerAmount(row));
    }

    return sum;
  }, 0);
}

function getNonRefundDisputeCashImpact(disputes: DisputeRow[]) {
  return disputes.reduce((sum, dispute) => {
    const refundRequested = Boolean(dispute.refund_requested);
    const issueType = asTrimmedString(dispute.issue_type).toLowerCase();

    if (refundRequested || issueType === "refund_review") {
      return sum;
    }

    return sum + getDisputeAmount(dispute);
  }, 0);
}

function getPayoutAmount(payout: PayoutRow) {
  return (
    toNumber(payout.amount) ||
    toNumber(payout.payout_amount) ||
    toNumber(payout.guru_net_amount) ||
    toNumber(payout.net_amount)
  );
}

function isPayoutReleased(payout: PayoutRow) {
  const status = (
    asTrimmedString(payout.status) || asTrimmedString(payout.payout_status)
  ).toLowerCase();

  return (
    status.includes("paid") ||
    status.includes("released") ||
    status.includes("complete")
  );
}

function getBankAmount(row: BankTransactionRow) {
  return (
    toNumber(row.amount) ||
    toNumber(row.transaction_amount) ||
    toNumber(row.net_amount) ||
    toNumber(row.value)
  );
}

function getBankName(row: BankTransactionRow) {
  return (
    asTrimmedString(row.name) ||
    asTrimmedString(row.description) ||
    asTrimmedString(row.merchant_name) ||
    asTrimmedString(row.memo) ||
    "Bank Transaction"
  );
}

function getBankDate(row: BankTransactionRow) {
  return (
    asTrimmedString(row.date) ||
    asTrimmedString(row.transaction_date) ||
    asTrimmedString(row.posted_at) ||
    asTrimmedString(row.created_at)
  );
}

function isBankOutflow(row: BankTransactionRow) {
  const amount = getBankAmount(row);
  const direction = asTrimmedString(row.direction).toLowerCase();
  const type = asTrimmedString(row.type).toLowerCase();

  if (direction.includes("out") || type.includes("debit")) return true;
  if (direction.includes("in") || type.includes("credit")) return false;

  return amount < 0;
}

function isBankSavingsTransfer(row: BankTransactionRow) {
  const text = getLedgerText(row);
  return (
    text.includes("savings") ||
    text.includes("reserve") ||
    text.includes("transfer")
  );
}

function getStripeAmount(row: StripeBalanceTransactionRow) {
  return (
    toNumber(row.amount) ||
    toNumber(row.gross_amount) ||
    toNumber(row.net_amount) ||
    toNumber(row.fee)
  );
}

function getStripeFee(row: StripeBalanceTransactionRow) {
  return Math.abs(toNumber(row.fee) || toNumber(row.fee_amount));
}

function getStripeText(row: StripeBalanceTransactionRow) {
  return [
    row.type,
    row.reporting_category,
    row.description,
    row.source,
    row.status,
  ]
    .map(asTrimmedString)
    .join(" ")
    .toLowerCase();
}

function isArchivedCashFlowLine(row: Record<string, unknown>) {
  return Boolean(
    row.deleted_at || row.archived_at || row.is_deleted === true || row.is_active === false,
  );
}

function getCashFlowSection(line: CashFlowRow): CashFlowSectionKey {
  const section = asTrimmedString(line.section) as CashFlowSectionKey;

  if (
    section === "operating" ||
    section === "investing" ||
    section === "financing" ||
    section === "cash_position"
  ) {
    return section;
  }

  return "operating";
}

function getLineId(line: CashFlowRow, index: number) {
  return (
    asTrimmedString(line.id) ||
    `${asTrimmedString(line.section)}-${asTrimmedString(line.label)}-${index}`
  );
}

function normalizeCashFlowLabel(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function getDefaultLineKeys() {
  return new Set(
    DEFAULT_CASH_FLOW_LINES.map((line) =>
      `${getCashFlowSection(line)}:${normalizeCashFlowLabel(asTrimmedString(line.label))}`,
    ),
  );
}

function getCashFlowLineKey(line: CashFlowRow) {
  return `${getCashFlowSection(line)}:${normalizeCashFlowLabel(asTrimmedString(line.label))}`;
}

function dedupeCashFlowRows(lines: CashFlowRow[]) {
  const byKey = new Map<string, CashFlowRow>();

  for (const line of lines) {
    byKey.set(getCashFlowLineKey(line), line);
  }

  return Array.from(byKey.values()).sort(
    (a, b) =>
      (toNumber(a.display_order) || 100) - (toNumber(b.display_order) || 100) ||
      asTrimmedString(a.label).localeCompare(asTrimmedString(b.label)),
  );
}

function getCashFlowLineAmount({
  line,
  bookings,
  expenses,
  payouts,
  disputes,
  ledgerEntries,
  bankTransactions,
  stripeBalanceTransactions,
}: {
  line: CashFlowRow;
  bookings: BookingRow[];
  expenses: ExpenseRow[];
  payouts: PayoutRow[];
  disputes: DisputeRow[];
  ledgerEntries: FinancialLedgerRow[];
  bankTransactions: BankTransactionRow[];
  stripeBalanceTransactions: StripeBalanceTransactionRow[];
}) {
  const label = normalizeCashFlowLabel(asTrimmedString(line.label));
  const storedAmount = toNumber(line.amount);

  if (label.includes("cash received") && label.includes("booking")) {
    const stripePayments = stripeBalanceTransactions
      .filter((row) => {
        const text = getStripeText(row);
        return text.includes("charge") || text.includes("payment");
      })
      .reduce((sum, row) => sum + Math.abs(getStripeAmount(row)), 0);

    if (stripePayments > 0) return stripePayments;

    return bookings
      .filter(isPaidBooking)
      .reduce((sum, booking) => sum + getBookingGrossAmount(booking), 0);
  }

  if (label.includes("stripe") && label.includes("fee")) {
    const stripeFees = stripeBalanceTransactions.reduce(
      (sum, row) => sum + getStripeFee(row),
      0,
    );

    return -Math.abs(stripeFees);
  }

  if (label.includes("paid to guru") || label.includes("paid to gurus")) {
    const payoutTableTotal = payouts
      .filter(isPayoutReleased)
      .reduce((sum, payout) => sum + getPayoutAmount(payout), 0);

    if (payoutTableTotal > 0) return -Math.abs(payoutTableTotal);

    return -Math.abs(
      bookings
        .filter(isPaidBooking)
        .reduce((sum, booking) => sum + getGuruPayoutAmount(booking), 0),
    );
  }

  if (label.includes("operating expense")) {
    const bankOperatingOutflows = bankTransactions
      .filter((row) => isBankOutflow(row) && !isBankSavingsTransfer(row))
      .reduce((sum, row) => sum + Math.abs(getBankAmount(row)), 0);

    if (bankOperatingOutflows > 0) return -Math.abs(bankOperatingOutflows);

    return -Math.abs(
      expenses.reduce((sum, expense) => sum + getExpenseAmount(expense), 0),
    );
  }

  if (label.includes("refund") || label.includes("credit")) {
    const stripeRefunds = stripeBalanceTransactions
      .filter((row) => getStripeText(row).includes("refund"))
      .reduce((sum, row) => sum + Math.abs(getStripeAmount(row)), 0);
    const ledgerRefunds = getLedgerRefundCashOutflow(ledgerEntries);
    const bookingRefunds = bookings.reduce(
      (sum, booking) => sum + getRefundAmount(booking),
      0,
    );

    return -Math.abs(stripeRefunds || ledgerRefunds || bookingRefunds);
  }

  if (label.includes("sales tax")) {
    return -Math.abs(
      bookings.reduce((sum, booking) => sum + getBookingTaxAmount(booking), 0),
    );
  }

  if (label.includes("dispute")) {
    const stripeDisputes = stripeBalanceTransactions
      .filter((row) => {
        const text = getStripeText(row);
        return text.includes("dispute") || text.includes("chargeback");
      })
      .reduce((sum, row) => sum + Math.abs(getStripeAmount(row)), 0);

    return -Math.abs(stripeDisputes || getNonRefundDisputeCashImpact(disputes));
  }

  if (
    label.includes("equipment") ||
    label.includes("software") ||
    label.includes("asset") ||
    label.includes("purchase")
  ) {
    return -Math.abs(storedAmount);
  }

  if (label.includes("loan repayment")) {
    return -Math.abs(storedAmount);
  }

  if (label.includes("transfers to savings")) {
    const transfers = bankTransactions
      .filter((row) => isBankOutflow(row) && isBankSavingsTransfer(row))
      .reduce((sum, row) => sum + Math.abs(getBankAmount(row)), 0);
    return -Math.abs(transfers || storedAmount);
  }

  if (label.includes("transfers from savings")) {
    const transfers = bankTransactions
      .filter((row) => !isBankOutflow(row) && isBankSavingsTransfer(row))
      .reduce((sum, row) => sum + Math.abs(getBankAmount(row)), 0);
    return Math.abs(transfers || storedAmount);
  }

  if (label.includes("beginning cash")) {
    const earliestBalance = bankTransactions
      .map((row) => toNumber(row.running_balance) || toNumber(row.balance))
      .find((value) => value !== 0);
    return storedAmount || earliestBalance || 0;
  }

  return storedAmount;
}

function readinessClasses(status: CashFlowReadinessItem["status"]) {
  const classes = {
    ready: "border-emerald-100 bg-emerald-50 text-emerald-800",
    needs_review: "border-amber-100 bg-amber-50 text-amber-800",
    missing: "border-rose-100 bg-rose-50 text-rose-800",
  };

  return classes[status];
}

function getCashFlowReadinessItems({
  bookings,
  expenses,
  payouts,
  disputes,
  ledgerEntries,
  bankTransactions,
  stripeBalanceTransactions,
}: {
  bookings: BookingRow[];
  expenses: ExpenseRow[];
  payouts: PayoutRow[];
  disputes: DisputeRow[];
  ledgerEntries: FinancialLedgerRow[];
  bankTransactions: BankTransactionRow[];
  stripeBalanceTransactions: StripeBalanceTransactionRow[];
}): CashFlowReadinessItem[] {
  const reconciliationReady = [...ledgerEntries, ...bankTransactions].some(
    (entry) =>
      Boolean(
        entry.reconciled_at ||
          entry.matched_transaction_id ||
          entry.reconciliation_id ||
          entry.stripe_payout_id,
      ),
  );

  const bankRows = bankTransactions.filter((entry) => {
    const text = getLedgerText(entry);
    return (
      text.includes("navy") ||
      text.includes("checking") ||
      text.includes("savings") ||
      text.includes("bank") ||
      Object.keys(entry).length > 0
    );
  });

  return [
    {
      label: "Booking cash receipts",
      status: bookings.length ? "ready" : "needs_review",
      detail: bookings.length
        ? `${bookings.length.toLocaleString()} booking rows are available for operating cash receipt calculations.`
        : "No booking rows were found yet. Operating cash received will remain incomplete until bookings are connected.",
    },
    {
      label: "Stripe cash movement",
      status: stripeBalanceTransactions.length ? "ready" : "needs_review",
      detail: stripeBalanceTransactions.length
        ? `${stripeBalanceTransactions.length.toLocaleString()} Stripe balance rows found for payments, fees, refunds, disputes, and payouts.`
        : "Normalize Stripe balance transactions to improve cash flow accuracy.",
    },
    {
      label: "Navy Federal banking",
      status: bankRows.length ? "ready" : "needs_review",
      detail: bankRows.length
        ? `${bankRows.length.toLocaleString()} bank rows found for deposits, withdrawals, transfers, and cash balance support.`
        : "Connect Plaid or import Navy Federal CSV/QBO/OFX statements to confirm cash movement.",
    },
    {
      label: "Guru payout cash outflows",
      status: payouts.length ? "ready" : bookings.length ? "needs_review" : "missing",
      detail: payouts.length
        ? `${payouts.length.toLocaleString()} payout rows available for Guru cash outflow support.`
        : "Guru payouts are currently estimated from bookings until payout rows are connected.",
    },
    {
      label: "Operating expense cash outflows",
      status: expenses.length || bankTransactions.length ? "ready" : "needs_review",
      detail: expenses.length
        ? `${expenses.length.toLocaleString()} expense ledger rows are available for operating cash outflows.`
        : "Add or import operating expenses so the Cash Flow statement reflects real admin costs.",
    },
    {
      label: "Reconciliation status",
      status: reconciliationReady ? "ready" : "missing",
      detail: reconciliationReady
        ? "At least one row has reconciliation metadata for matching Stripe payouts to bank deposits or transfers."
        : "Add reconciliation IDs/matches so Stripe payouts and Navy Federal deposits are not double-counted.",
    },
    {
      label: "Disputes and refunds",
      status: disputes.length || stripeBalanceTransactions.length ? "ready" : "needs_review",
      detail: `${disputes.length.toLocaleString()} dispute rows and ${stripeBalanceTransactions.length.toLocaleString()} Stripe rows are available for refund/dispute support.`,
    },
  ];
}

function CashFlowReadinessPanel({
  items,
}: {
  items: CashFlowReadinessItem[];
}) {
  const readyCount = items.filter((item) => item.status === "ready").length;

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            CPA / Cash Flow Readiness
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Cash-flow export checks
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            This panel checks whether the Cash Flow statement has the source
            records your CPA will expect: bookings, Stripe cash movement, Navy
            Federal activity, payouts, expenses, refunds, disputes, and
            reconciliation matches.
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

function CashFlowIntegrationPanel() {
  const steps = [
    "Customer booking creates gross cash receipt activity.",
    "Stripe identifies gross payments, processing fees, refunds, disputes, and payouts.",
    "Navy Federal checking/savings confirms deposits, withdrawals, transfers, and ending cash.",
    "Reconciliation matches Stripe payouts to bank deposits so cash is not double-counted.",
    "Financial Overview, P&L, Balance Sheet, Cash Flow, exports, and CPA handoff use the same ledger foundation.",
  ];

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
        Stripe + Navy Federal Cash Flow
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
              className="grid gap-3 px-4 py-4 text-slate-600 sm:grid-cols-[minmax(0,1fr)_130px_100px] sm:items-center"
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

function isLikelyManualFinancing(entry: BankTransactionRow) {
  const text = getLedgerText(entry);
  return (
    text.includes("owner") ||
    text.includes("capital") ||
    text.includes("loan") ||
    text.includes("financing")
  );
}

async function getCashFlowData() {
  const [
    rawSavedLines,
    rawBookings,
    rawExpenses,
    rawPayouts,
    rawDisputes,
    rawLedgerEntries,
    rawBankTransactions,
    rawStripeBalanceTransactions,
  ] = await Promise.all([
    safeRows<CashFlowRow>(
      supabaseAdmin
        .from("cash_flow_lines")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(500),
      "cash_flow_lines",
    ),
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
    safeRows<StripeBalanceTransactionRow>(
      supabaseAdmin
        .from("stripe_balance_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3000),
      "stripe_balance_transactions",
    ),
  ]);

  const savedLines = rawSavedLines.filter((row) => !isArchivedCashFlowLine(row));
  const bookings = rawBookings.filter((row) => !isArchivedRow(row));
  const expenses = rawExpenses.filter((row) => !isArchivedRow(row));
  const payouts = rawPayouts.filter((row) => !isArchivedRow(row));
  const disputes = rawDisputes.filter((row) => !isArchivedRow(row));
  const ledgerEntries = rawLedgerEntries.filter((row) => !isArchivedRow(row));
  const bankTransactions = rawBankTransactions.filter((row) => !isArchivedRow(row));
  const stripeBalanceTransactions = rawStripeBalanceTransactions.filter(
    (row) => !isArchivedRow(row),
  );

  const defaultLineKeys = getDefaultLineKeys();
  const sourceLines = dedupeCashFlowRows([
    ...DEFAULT_CASH_FLOW_LINES,
    ...savedLines,
  ]);

  const customSavedLineCount = savedLines.filter(
    (line) => !defaultLineKeys.has(getCashFlowLineKey(line)),
  ).length;

  const lines: CashFlowLine[] = sourceLines
    .map((line, index) => {
      const dbId = asTrimmedString(line.id);
      const isCoreDefaultLine = defaultLineKeys.has(getCashFlowLineKey(line));

      return {
        id: getLineId(line, index),
        dbId,
        isSaved: Boolean(dbId && !isCoreDefaultLine),
        section: getCashFlowSection(line),
        label: asTrimmedString(line.label) || "Cash flow line",
        amount: getCashFlowLineAmount({
          line,
          bookings,
          expenses,
          payouts,
          disputes,
          ledgerEntries,
          bankTransactions,
          stripeBalanceTransactions,
        }),
        notes: asTrimmedString(line.notes),
        source: asTrimmedString(line.source) || "manual",
        displayOrder: toNumber(line.display_order) || 100,
      };
    })
    .sort(
      (a, b) =>
        a.displayOrder - b.displayOrder || a.label.localeCompare(b.label),
    );

  const operatingLines = lines.filter((line) => line.section === "operating");
  const investingLines = lines.filter((line) => line.section === "investing");
  const financingLines = lines.filter((line) => line.section === "financing");
  const cashPositionLines = lines.filter(
    (line) => line.section === "cash_position",
  );

  const netOperatingCash = operatingLines.reduce(
    (sum, line) => sum + line.amount,
    0,
  );
  const netInvestingCash = investingLines.reduce(
    (sum, line) => sum + line.amount,
    0,
  );
  const netFinancingCash = financingLines.reduce(
    (sum, line) => sum + line.amount,
    0,
  );

  const beginningCash = cashPositionLines.reduce(
    (sum, line) => sum + line.amount,
    0,
  );
  const netChangeInCash =
    netOperatingCash + netInvestingCash + netFinancingCash;
  const endingCash = beginningCash + netChangeInCash;

  const maxVisualValue = Math.max(
    Math.abs(netOperatingCash),
    Math.abs(netInvestingCash),
    Math.abs(netFinancingCash),
    Math.abs(netChangeInCash),
    Math.abs(endingCash),
    1,
  );

  const paidBookings = bookings.filter(isPaidBooking);

  const recentCashActivity: RecentCashActivity[] = [
    ...bankTransactions.slice(0, 8).map((transaction, index) => ({
      id:
        asTrimmedString(transaction.id) ||
        asTrimmedString(transaction.transaction_id) ||
        `bank-${index}`,
      name: getBankName(transaction),
      source: "Navy Federal / Bank",
      amount: getBankAmount(transaction),
      date: formatDateShort(getBankDate(transaction)),
    })),
    ...expenses.slice(0, 8).map((expense, index) => ({
      id: asTrimmedString(expense.id) || `${getExpenseName(expense)}-${index}`,
      name: getExpenseName(expense),
      source: getExpenseCategory(expense),
      amount: -Math.abs(getExpenseAmount(expense)),
      date: formatDateShort(asTrimmedString(expense.created_at)),
    })),
  ].slice(0, 10);

  const manualFinancingBankRows = bankTransactions.filter(isLikelyManualFinancing)
    .length;

  return {
    operatingLines,
    investingLines,
    financingLines,
    cashPositionLines,
    recentCashActivity,
    readinessItems: getCashFlowReadinessItems({
      bookings,
      expenses,
      payouts,
      disputes,
      ledgerEntries,
      bankTransactions,
      stripeBalanceTransactions,
    }),
    savedLineCount: customSavedLineCount,
    totals: {
      bookings: bookings.length,
      paidBookings: paidBookings.length,
      expenseRows: expenses.length,
      payoutRows: payouts.length,
      disputeRows: disputes.length,
      ledgerRows: ledgerEntries.length,
      bankRows: bankTransactions.length,
      stripeRows: stripeBalanceTransactions.length,
      manualFinancingBankRows,
      netOperatingCash,
      netInvestingCash,
      netFinancingCash,
      beginningCash,
      netChangeInCash,
      endingCash,
      maxVisualValue,
    },
  };
}

export default async function AdminCashFlowPage() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessFinancials) {
    return null;
  }

  const cashFlow = await getCashFlowData();

  const visualRows = [
    {
      label: "Operating Cash Flow",
      value: cashFlow.totals.netOperatingCash,
      detail: "Booking cash receipts less payouts, expenses, fees, refunds, taxes, and disputes.",
      tone:
        cashFlow.totals.netOperatingCash >= 0
          ? "bg-emerald-400"
          : "bg-rose-400",
    },
    {
      label: "Investing Cash Flow",
      value: cashFlow.totals.netInvestingCash,
      detail: "Equipment, software, platform assets, and long-term asset movement.",
      tone:
        cashFlow.totals.netInvestingCash >= 0
          ? "bg-sky-400"
          : "bg-amber-400",
    },
    {
      label: "Financing Cash Flow",
      value: cashFlow.totals.netFinancingCash,
      detail: "Owner capital, loans, repayments, and checking/savings reserve transfers.",
      tone:
        cashFlow.totals.netFinancingCash >= 0
          ? "bg-violet-400"
          : "bg-rose-400",
    },
    {
      label: "Net Change in Cash",
      value: cashFlow.totals.netChangeInCash,
      detail: "Operating + investing + financing cash movement.",
      tone:
        cashFlow.totals.netChangeInCash >= 0
          ? "bg-emerald-400"
          : "bg-rose-400",
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
                SitGuru Statement of Cash Flows.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                Tracks cash moving through SitGuru from operations, investing,
                financing, Stripe activity, Navy Federal deposits, bank
                withdrawals, transfers, refunds, disputes, and CPA-ready cash
                reconciliation.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-emerald-100 bg-[#fbfefd] p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Cash Flow Actions
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <ActionLink href="/admin/financials" label="Financials" />
                <ActionLink href="/admin/financials/profit-loss" label="P&L" />
                <ActionLink
                  href="/admin/financials/balance-sheet"
                  label="Balance Sheet"
                />
                <ActionLink href="/admin/financials/reconciliation" label="Reconcile" primary />
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
                    label="PDF / Print"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Operating Cash Flow"
              value={money(cashFlow.totals.netOperatingCash)}
              detail="Booking receipts minus Guru payouts, Stripe fees, expenses, refunds, taxes, and disputes."
              tone={cashFlow.totals.netOperatingCash >= 0 ? "emerald" : "rose"}
            />
            <StatCard
              label="Investing Cash Flow"
              value={money(cashFlow.totals.netInvestingCash)}
              detail="Equipment, software, platform investment, and long-term asset cash movement."
              tone={cashFlow.totals.netInvestingCash >= 0 ? "sky" : "amber"}
            />
            <StatCard
              label="Financing Cash Flow"
              value={money(cashFlow.totals.netFinancingCash)}
              detail="Owner contributions, loans, repayments, and reserve transfers."
              tone={cashFlow.totals.netFinancingCash >= 0 ? "violet" : "rose"}
            />
            <StatCard
              label="Ending Cash"
              value={money(cashFlow.totals.endingCash)}
              detail="Beginning cash plus net change in cash."
              tone={cashFlow.totals.endingCash >= 0 ? "emerald" : "rose"}
            />
          </div>
        </section>

        <CashFlowReadinessPanel items={cashFlow.readinessItems} />

        <CashFlowIntegrationPanel />

        <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  Add Cash Flow Line
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  Add operating, investing, or financing cash lines.
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Add manual cash flow lines for loans, owner contributions,
                  equipment, platform assets, reserve transfers, or beginning cash.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-[#fbfefd] px-4 py-3 text-sm font-bold text-slate-600">
                {cashFlow.savedLineCount > 0
                  ? `${cashFlow.savedLineCount} saved cash flow lines`
                  : "Using default cash flow lines"}
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
                      {SECTION_LABELS[item.section as CashFlowSectionKey]} — {item.label}
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
                  placeholder="Example: Loan Received, Owner Contribution..."
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
          </div>

          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Cash Flow Visuals
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Operating, investing, financing, and net cash change.
            </h2>

            <div className="mt-6 space-y-5">
              {visualRows.map((row) => (
                <div key={row.label}>
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{row.label}</p>
                      <p className="mt-1 text-xs text-slate-500">{row.detail}</p>
                    </div>
                    <p
                      className={`text-sm font-bold ${
                        row.value < 0 ? "text-rose-700" : "text-slate-950"
                      }`}
                    >
                      {money(row.value)}
                    </p>
                  </div>

                  <div className="h-3 rounded-full bg-slate-100">
                    <div
                      className={`h-3 rounded-full ${row.tone}`}
                      style={{
                        width: `${getBarWidth(
                          row.value,
                          cashFlow.totals.maxVisualValue,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Beginning Cash
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {money(cashFlow.totals.beginningCash)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Ending Cash
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {money(cashFlow.totals.endingCash)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Stripe Rows
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {cashFlow.totals.stripeRows.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Bank Rows
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {cashFlow.totals.bankRows.toLocaleString()}
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
                Statement of Cash Flows
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Current live SitGuru cash flow statement from bookings, Stripe,
                Navy Federal banking, payouts, expenses, disputes, financial
                ledger entries, and saved manual cash flow lines.
              </p>
            </div>

            <div className="p-4 sm:p-6">
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-[#fbfefd]">
                <div className="hidden grid-cols-[minmax(0,1fr)_130px_100px] gap-4 border-b border-slate-100 bg-slate-50 px-4 py-4 sm:grid">
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
                  totalLabel="Beginning Cash Balance"
                  totalValue={cashFlow.totals.beginningCash}
                />

                <div className="grid grid-cols-[1fr_auto] gap-4 border-t border-emerald-400/30 bg-emerald-50 px-4 py-4 font-black text-slate-950">
                  <p>Cash Balance at End of Period</p>
                  <p
                    className={
                      cashFlow.totals.endingCash < 0
                        ? "text-rose-700"
                        : "text-slate-950"
                    }
                  >
                    {money(cashFlow.totals.endingCash)}
                  </p>
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
                Liquidity and operating cash generation.
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
                    Ending Cash
                  </p>
                  <p
                    className={`mt-2 text-2xl font-black ${
                      cashFlow.totals.endingCash >= 0
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    {money(cashFlow.totals.endingCash)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Paid Bookings
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {cashFlow.totals.paidBookings.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Expense Rows
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {cashFlow.totals.expenseRows.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                  Runway Signal
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Cash flow becomes most accurate once Stripe balance
                  transactions are reconciled to Navy Federal checking/savings
                  deposits and recurring expense outflows are categorized.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Recent Cash Activity
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Bank and expense movement.
              </h2>

              <div className="mt-6 space-y-4">
                {cashFlow.recentCashActivity.length ? (
                  cashFlow.recentCashActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-slate-950">{activity.name}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {activity.source} · {activity.date}
                          </p>
                        </div>
                        <p
                          className={`font-black ${
                            activity.amount < 0 ? "text-rose-700" : "text-slate-950"
                          }`}
                        >
                          {moneyExact(activity.amount)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    No bank or expense rows found yet. Connect Plaid, import Navy
                    Federal statements, or add expense ledger activity to start
                    building the cash flow detail.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5 sm:p-6 lg:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                SitGuru Cash Flow Notes
              </p>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
                Cash received from customers should come from Stripe payments,
                while cash confirmed in the bank should come from Navy Federal
                deposits. Stripe payouts matched to bank deposits are cash
                movement, not new revenue, so reconciliation prevents double
                counting across P&L, Balance Sheet, Cash Flow, and Financial
                Overview.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
