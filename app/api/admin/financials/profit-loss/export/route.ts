import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type BookingRow = Record<string, unknown>;
type ExpenseRow = Record<string, unknown>;
type PayoutRow = Record<string, unknown>;
type DisputeRow = Record<string, unknown>;
type StripeBalanceRow = Record<string, unknown>;
type BankTransactionRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type ExportFormat = "csv" | "excel" | "word" | "html" | "json";

type ExportRow = {
  section: string;
  line_item: string;
  accounting_account: string;
  quickbooks_account: string;
  source: string;
  source_count: number;
  amount: number;
  debit: number;
  credit: number;
  formatted_amount: string;
  statement_impact: "profit_loss" | "balance_sheet" | "cash_flow" | "memo";
  tax_treatment: string;
  reconciliation_status: "ready" | "needs_review" | "missing_source" | "memo";
  notes: string;
};

type UserAccess = {
  ok: boolean;
  userId?: string;
  email?: string;
  role?: string;
  reason?: string;
};

type ExportPayload = {
  rows: ExportRow[];
  generatedAt: string;
  startDate: string | null;
  endDate: string | null;
  summary: {
    totalRevenue: number;
    totalCostOfRevenue: number;
    grossProfit: number;
    totalOperatingExpenses: number;
    netIncome: number;
    stripeRows: number;
    bankRows: number;
    reconciliationReady: boolean;
  };
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

const EXPORT_COLUMNS: Array<keyof ExportRow> = [
  "section",
  "line_item",
  "accounting_account",
  "quickbooks_account",
  "source",
  "source_count",
  "amount",
  "debit",
  "credit",
  "formatted_amount",
  "statement_impact",
  "tax_treatment",
  "reconciliation_status",
  "notes",
];

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
    maximumFractionDigits: 2,
  }).format(Math.abs(value || 0));

  return value < 0 ? `(${formatted})` : formatted;
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function htmlEscape(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseDate(value: unknown) {
  const text = asTrimmedString(value);
  if (!text) return null;

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getRowDate(row: Record<string, unknown>) {
  return (
    parseDate(row.created_at) ||
    parseDate(row.date) ||
    parseDate(row.transaction_date) ||
    parseDate(row.paid_at) ||
    parseDate(row.available_on) ||
    parseDate(row.posted_at)
  );
}

function rowInDateRange(row: Record<string, unknown>, startDate: string | null, endDate: string | null) {
  const rowDate = getRowDate(row);

  if (!rowDate) return true;

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

function isActiveFinancialRow(row: Record<string, unknown>) {
  if (row.deleted_at || row.voided_at || row.archived_at) return false;
  if (row.is_deleted === true || row.is_void === true) return false;
  if (row.is_active === false) return false;
  return true;
}

async function createSupabaseUserClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Route handlers can run in contexts where setting cookies is not available.
          }
        },
      },
    },
  );
}

function envEmailAllowed(email?: string | null) {
  if (!email) return false;

  const configured = [
    process.env.SITGURU_FINANCE_ADMIN_EMAILS,
    process.env.ADMIN_EMAILS,
  ]
    .filter(Boolean)
    .join(",")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return configured.includes(email.toLowerCase());
}

async function requireFinanceAccess(): Promise<UserAccess> {
  try {
    const supabase = await createSupabaseUserClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { ok: false, reason: "Not authenticated" };
    }

    const email = user.email || "";

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, account_type")
      .eq("id", user.id)
      .maybeSingle();

    const profileRole = asTrimmedString(profile?.role).toLowerCase();
    const profileAccountType = asTrimmedString(profile?.account_type).toLowerCase();

    if (FINANCE_ROLES.has(profileRole) || FINANCE_ROLES.has(profileAccountType)) {
      return {
        ok: true,
        userId: user.id,
        email,
        role: profileRole || profileAccountType,
      };
    }

    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const role = (roleRows || [])
      .map((row) => asTrimmedString(row.role).toLowerCase())
      .find((item) => FINANCE_ROLES.has(item));

    if (role) {
      return { ok: true, userId: user.id, email, role };
    }

    if (envEmailAllowed(email)) {
      return { ok: true, userId: user.id, email, role: "finance_env_allowlist" };
    }

    return { ok: false, userId: user.id, email, reason: "Finance access required" };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "Unable to verify finance access",
    };
  }
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Profit and loss export query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Profit and loss export query skipped for ${label}:`, error);
    return [];
  }
}

async function auditFinancialExport({
  access,
  format,
  rowCount,
  startDate,
  endDate,
  delivery,
}: {
  access: UserAccess;
  format: string;
  rowCount: number;
  startDate: string | null;
  endDate: string | null;
  delivery: "download" | "email";
}) {
  const headerStore = await headers();
  const metadata = {
    format,
    row_count: rowCount,
    start_date: startDate,
    end_date: endDate,
    delivery,
    ip:
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headerStore.get("x-real-ip") ||
      null,
    user_agent: headerStore.get("user-agent"),
  };

  const payload = {
    admin_user_id: access.userId || null,
    admin_email: access.email || null,
    action: delivery === "email" ? "email_profit_loss_export" : "download_profit_loss_export",
    resource_type: "profit_loss_statement",
    resource_id: "profit_loss_export",
    metadata,
  };

  try {
    const result = await supabaseAdmin.from("financial_audit_logs").insert(payload);
    if (!result.error) return;
  } catch {
    // Fall through to the more generic audit table.
  }

  try {
    await supabaseAdmin.from("admin_audit_logs").insert(payload);
  } catch {
    // Audit tables may not exist during local development; exports should not crash.
  }
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
  return toNumber(booking.sales_tax_amount) || toNumber(booking.tax_amount);
}

function getPlatformFee(booking: BookingRow) {
  const storedFee =
    toNumber(booking.sitguru_fee_amount) ||
    toNumber(booking.platform_fee_amount) ||
    toNumber(booking.application_fee_amount);

  if (storedFee > 0) return storedFee;

  return getBookingGrossAmount(booking) * 0.08;
}

function getGuruPayoutAmount(booking: BookingRow) {
  const storedNet =
    toNumber(booking.guru_net_amount) ||
    toNumber(booking.guru_payout_amount) ||
    toNumber(booking.provider_payout_amount);

  if (storedNet > 0) return storedNet;

  return Math.max(0, getBookingGrossAmount(booking) - getPlatformFee(booking));
}

function getRefundAmount(booking: BookingRow) {
  const explicitRefund = toNumber(booking.refund_amount) || toNumber(booking.refunded_amount);
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

function getExpenseCategory(expense: ExpenseRow) {
  const category = (
    asTrimmedString(expense.category) ||
    asTrimmedString(expense.expense_category) ||
    asTrimmedString(expense.type) ||
    asTrimmedString(expense.name) ||
    "Other"
  ).toLowerCase();

  if (category.includes("market") || category.includes("advert")) return "Marketing";
  if (category.includes("software") || category.includes("tool")) return "Software";
  if (category.includes("payroll") || category.includes("contractor")) return "Admin / Payroll";
  if (category.includes("admin") || category.includes("office")) return "Admin";
  if (category.includes("legal") || category.includes("accounting")) return "Professional Services";
  if (category.includes("insurance")) return "Insurance";
  if (category.includes("travel") || category.includes("vehicle")) return "Vehicle / Travel";
  if (category.includes("stripe") || category.includes("processing") || category.includes("merchant")) return "Merchant Fees";

  return "Other";
}

function getDisputeAmount(dispute: DisputeRow) {
  return (
    toNumber(dispute.amount) ||
    toNumber(dispute.dispute_amount) ||
    toNumber(dispute.refund_amount) ||
    toNumber(dispute.total_amount)
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

  return status.includes("paid") || status.includes("released") || status.includes("complete");
}

function getStripeFee(row: StripeBalanceRow) {
  return Math.abs(toNumber(row.fee) || toNumber(row.fee_amount) || toNumber(row.stripe_fee_amount));
}

function getBankAmount(row: BankTransactionRow) {
  return toNumber(row.amount) || toNumber(row.transaction_amount) || toNumber(row.net_amount);
}

function buildExportRow(input: Omit<ExportRow, "debit" | "credit" | "formatted_amount">): ExportRow {
  const amount = Number.isFinite(input.amount) ? input.amount : 0;

  return {
    ...input,
    amount,
    debit: amount < 0 ? Math.abs(amount) : 0,
    credit: amount > 0 ? amount : 0,
    formatted_amount: money(amount),
  };
}

async function getProfitLossExportPayload({
  startDate,
  endDate,
}: {
  startDate: string | null;
  endDate: string | null;
}): Promise<ExportPayload> {
  const [bookingRows, expenseRows, payoutRows, disputeRows, stripeRows, bankRows] = await Promise.all([
    safeRows<BookingRow>(
      supabaseAdmin.from("bookings").select("*").order("created_at", { ascending: false }).limit(10000),
      "bookings",
    ),
    safeRows<ExpenseRow>(
      supabaseAdmin.from("expense_ledger").select("*").order("created_at", { ascending: false }).limit(10000),
      "expense_ledger",
    ),
    safeRows<PayoutRow>(
      supabaseAdmin.from("guru_payouts").select("*").order("created_at", { ascending: false }).limit(10000),
      "guru_payouts",
    ),
    safeRows<DisputeRow>(
      supabaseAdmin.from("dispute_cases").select("*").order("created_at", { ascending: false }).limit(10000),
      "dispute_cases",
    ),
    safeRows<StripeBalanceRow>(
      supabaseAdmin.from("stripe_balance_transactions").select("*").order("created_at", { ascending: false }).limit(10000),
      "stripe_balance_transactions",
    ),
    safeRows<BankTransactionRow>(
      supabaseAdmin.from("bank_transactions").select("*").order("created_at", { ascending: false }).limit(10000),
      "bank_transactions",
    ),
  ]);

  const bookings = bookingRows.filter(isActiveFinancialRow).filter((row) => rowInDateRange(row, startDate, endDate));
  const expenses = expenseRows.filter(isActiveFinancialRow).filter((row) => rowInDateRange(row, startDate, endDate));
  const payouts = payoutRows.filter(isActiveFinancialRow).filter((row) => rowInDateRange(row, startDate, endDate));
  const disputes = disputeRows.filter(isActiveFinancialRow).filter((row) => rowInDateRange(row, startDate, endDate));
  const stripe = stripeRows.filter(isActiveFinancialRow).filter((row) => rowInDateRange(row, startDate, endDate));
  const bank = bankRows.filter(isActiveFinancialRow).filter((row) => rowInDateRange(row, startDate, endDate));

  const paidBookings = bookings.filter(isPaidBooking);

  const grossBookingVolume = bookings.reduce((sum, booking) => sum + getBookingGrossAmount(booking), 0);
  const paidBookingVolume = paidBookings.reduce((sum, booking) => sum + getBookingGrossAmount(booking), 0);
  const taxCollected = bookings.reduce((sum, booking) => sum + getBookingTaxAmount(booking), 0);
  const platformFeeRevenue = bookings.reduce((sum, booking) => sum + getPlatformFee(booking), 0);
  const guruPayoutsFromBookings = bookings.reduce((sum, booking) => sum + getGuruPayoutAmount(booking), 0);
  const paidPayoutsFromTable = payouts.filter(isPayoutPaid).reduce((sum, payout) => sum + getPayoutAmount(payout), 0);
  const guruPayouts = paidPayoutsFromTable > 0 ? paidPayoutsFromTable : guruPayoutsFromBookings;
  const refunds = bookings.reduce((sum, booking) => sum + getRefundAmount(booking), 0);
  const disputeLosses = disputes.reduce((sum, dispute) => sum + getDisputeAmount(dispute), 0);
  const stripeProcessingFees = stripe.reduce((sum, row) => sum + getStripeFee(row), 0);

  const bankDeposits = bank.filter((row) => getBankAmount(row) > 0).reduce((sum, row) => sum + getBankAmount(row), 0);
  const bankWithdrawals = bank.filter((row) => getBankAmount(row) < 0).reduce((sum, row) => sum + Math.abs(getBankAmount(row)), 0);

  const marketingExpenses = expenses.filter((expense) => getExpenseCategory(expense) === "Marketing").reduce((sum, expense) => sum + getExpenseAmount(expense), 0);
  const softwareExpenses = expenses.filter((expense) => getExpenseCategory(expense) === "Software").reduce((sum, expense) => sum + getExpenseAmount(expense), 0);
  const adminExpenses = expenses.filter((expense) => ["Admin", "Admin / Payroll", "Professional Services"].includes(getExpenseCategory(expense))).reduce((sum, expense) => sum + getExpenseAmount(expense), 0);
  const insuranceExpenses = expenses.filter((expense) => getExpenseCategory(expense) === "Insurance").reduce((sum, expense) => sum + getExpenseAmount(expense), 0);
  const travelExpenses = expenses.filter((expense) => getExpenseCategory(expense) === "Vehicle / Travel").reduce((sum, expense) => sum + getExpenseAmount(expense), 0);
  const otherExpenses = expenses.filter((expense) => getExpenseCategory(expense) === "Other").reduce((sum, expense) => sum + getExpenseAmount(expense), 0);

  const totalRevenue = platformFeeRevenue;
  const totalCostOfRevenue = guruPayouts + refunds + disputeLosses;
  const grossProfit = totalRevenue - totalCostOfRevenue;
  const totalOperatingExpenses = marketingExpenses + softwareExpenses + adminExpenses + insuranceExpenses + travelExpenses + otherExpenses + stripeProcessingFees;
  const netIncome = grossProfit - totalOperatingExpenses;
  const reconciliationReady = stripe.length > 0 && bank.length > 0;

  const rows: ExportRow[] = [
    buildExportRow({
      section: "Memo / Marketplace Volume",
      line_item: "Gross Booking Volume",
      accounting_account: "Marketplace Volume",
      quickbooks_account: "Memo: Gross Booking Volume",
      source: "bookings",
      source_count: bookings.length,
      amount: grossBookingVolume,
      statement_impact: "memo",
      tax_treatment: "Memo only; review pass-through treatment with CPA.",
      reconciliation_status: bookings.length > 0 ? "memo" : "missing_source",
      notes: "Not counted as SitGuru revenue unless CPA confirms gross reporting.",
    }),
    buildExportRow({
      section: "Memo / Marketplace Volume",
      line_item: "Paid Booking Volume",
      accounting_account: "Marketplace Volume",
      quickbooks_account: "Memo: Paid Booking Volume",
      source: "bookings",
      source_count: paidBookings.length,
      amount: paidBookingVolume,
      statement_impact: "memo",
      tax_treatment: "Memo only; useful for Stripe and bank reconciliation.",
      reconciliation_status: paidBookings.length > 0 ? "memo" : "missing_source",
      notes: "Use to trace customer payments before Stripe fees, payouts, refunds, and deposits.",
    }),
    buildExportRow({
      section: "Revenue",
      line_item: "SitGuru Platform Fee Revenue",
      accounting_account: "Service Revenue",
      quickbooks_account: "Sales of Product Income: Service Revenue",
      source: "bookings",
      source_count: bookings.length,
      amount: platformFeeRevenue,
      statement_impact: "profit_loss",
      tax_treatment: "Revenue; review gross vs net reporting with CPA.",
      reconciliation_status: bookings.length > 0 ? "ready" : "missing_source",
      notes: "Default platform-fee revenue calculation uses stored fee fields or 8% fallback.",
    }),
    buildExportRow({
      section: "Balance Sheet Liability",
      line_item: "Sales Tax Collected / Held",
      accounting_account: "Sales Tax Payable",
      quickbooks_account: "Other Current Liabilities: Sales Tax Payable",
      source: "bookings",
      source_count: bookings.length,
      amount: taxCollected,
      statement_impact: "balance_sheet",
      tax_treatment: "Liability, not revenue.",
      reconciliation_status: taxCollected > 0 ? "needs_review" : "memo",
      notes: "Keep out of P&L revenue unless CPA directs otherwise.",
    }),
    buildExportRow({
      section: "Revenue",
      line_item: "Total Revenue",
      accounting_account: "Service Revenue",
      quickbooks_account: "Sales of Product Income: Service Revenue",
      source: "bookings",
      source_count: bookings.length,
      amount: totalRevenue,
      statement_impact: "profit_loss",
      tax_treatment: "Revenue subtotal.",
      reconciliation_status: bookings.length > 0 ? "ready" : "missing_source",
      notes: "P&L revenue subtotal excludes sales tax and memo-only gross booking volume.",
    }),
    buildExportRow({
      section: "Cost of Revenue",
      line_item: "Guru Payouts",
      accounting_account: "Contractor Payments / Cost of Revenue",
      quickbooks_account: "Cost of Goods Sold: Contractor Payments",
      source: paidPayoutsFromTable > 0 ? "guru_payouts" : "bookings",
      source_count: paidPayoutsFromTable > 0 ? payouts.length : bookings.length,
      amount: -guruPayouts,
      statement_impact: "profit_loss",
      tax_treatment: "Potential 1099/vendor support item; review threshold and classification.",
      reconciliation_status: guruPayouts > 0 ? "ready" : "missing_source",
      notes: "Uses paid payout table when available; otherwise estimates from booking economics.",
    }),
    buildExportRow({
      section: "Cost of Revenue",
      line_item: "Refunds / Credits",
      accounting_account: "Refunds and Allowances",
      quickbooks_account: "Income: Refunds and Allowances",
      source: "bookings",
      source_count: bookings.length,
      amount: -refunds,
      statement_impact: "profit_loss",
      tax_treatment: "Contra-revenue or expense based on CPA classification.",
      reconciliation_status: refunds > 0 ? "needs_review" : "memo",
      notes: "Should reconcile to Stripe refund balance transactions.",
    }),
    buildExportRow({
      section: "Cost of Revenue",
      line_item: "Dispute Losses / Adjustments",
      accounting_account: "Chargebacks / Dispute Losses",
      quickbooks_account: "Expenses: Chargebacks and Disputes",
      source: "dispute_cases",
      source_count: disputes.length,
      amount: -disputeLosses,
      statement_impact: "profit_loss",
      tax_treatment: "Expense or contra-revenue; review with CPA.",
      reconciliation_status: disputeLosses > 0 ? "needs_review" : "memo",
      notes: "Should reconcile to Stripe dispute records and bank activity.",
    }),
    buildExportRow({
      section: "Gross Profit",
      line_item: "Gross Profit",
      accounting_account: "Gross Profit",
      quickbooks_account: "Calculated subtotal",
      source: "calculated",
      source_count: 0,
      amount: grossProfit,
      statement_impact: "profit_loss",
      tax_treatment: "Calculated subtotal.",
      reconciliation_status: "ready",
      notes: "Total revenue minus cost of revenue.",
    }),
    buildExportRow({
      section: "Operating Expenses",
      line_item: "Stripe / Merchant Processing Fees",
      accounting_account: "Merchant Processing Fees",
      quickbooks_account: "Expenses: Merchant Processing Fees",
      source: "stripe_balance_transactions",
      source_count: stripe.length,
      amount: -stripeProcessingFees,
      statement_impact: "profit_loss",
      tax_treatment: "Deductible operating expense; confirm with CPA.",
      reconciliation_status: stripe.length > 0 ? "ready" : "needs_review",
      notes: "Use Stripe balance transactions as the preferred source for fees.",
    }),
    buildExportRow({
      section: "Operating Expenses",
      line_item: "Marketing / Advertising",
      accounting_account: "Advertising and Marketing",
      quickbooks_account: "Expenses: Advertising and Marketing",
      source: "expense_ledger",
      source_count: expenses.length,
      amount: -marketingExpenses,
      statement_impact: "profit_loss",
      tax_treatment: "Deductible operating expense; confirm with CPA.",
      reconciliation_status: marketingExpenses > 0 ? "ready" : "memo",
      notes: "Includes Instagram ads and other marketing entries from expense ledger.",
    }),
    buildExportRow({
      section: "Operating Expenses",
      line_item: "Software / Tools",
      accounting_account: "Software Subscriptions",
      quickbooks_account: "Expenses: Software Subscriptions",
      source: "expense_ledger",
      source_count: expenses.length,
      amount: -softwareExpenses,
      statement_impact: "profit_loss",
      tax_treatment: "Deductible operating expense; confirm capitalization rules if applicable.",
      reconciliation_status: softwareExpenses > 0 ? "ready" : "memo",
      notes: "Includes tools, hosting, and software entries.",
    }),
    buildExportRow({
      section: "Operating Expenses",
      line_item: "Admin / Payroll / Professional Services",
      accounting_account: "Admin and Professional Services",
      quickbooks_account: "Expenses: Legal and Professional Fees",
      source: "expense_ledger",
      source_count: expenses.length,
      amount: -adminExpenses,
      statement_impact: "profit_loss",
      tax_treatment: "Review payroll vs contractor vs professional service classification.",
      reconciliation_status: adminExpenses > 0 ? "needs_review" : "memo",
      notes: "CPA should separate payroll, contractors, legal, accounting, and admin spend as needed.",
    }),
    buildExportRow({
      section: "Operating Expenses",
      line_item: "Insurance",
      accounting_account: "Business Insurance",
      quickbooks_account: "Expenses: Insurance",
      source: "expense_ledger",
      source_count: expenses.length,
      amount: -insuranceExpenses,
      statement_impact: "profit_loss",
      tax_treatment: "Deductible operating expense; confirm with CPA.",
      reconciliation_status: insuranceExpenses > 0 ? "ready" : "memo",
      notes: "Business insurance and policy-related operating expenses.",
    }),
    buildExportRow({
      section: "Operating Expenses",
      line_item: "Vehicle / Travel",
      accounting_account: "Travel and Vehicle",
      quickbooks_account: "Expenses: Travel",
      source: "expense_ledger",
      source_count: expenses.length,
      amount: -travelExpenses,
      statement_impact: "profit_loss",
      tax_treatment: "Review substantiation and business-use percentage with CPA.",
      reconciliation_status: travelExpenses > 0 ? "needs_review" : "memo",
      notes: "Vehicle, mileage, lodging, or travel entries.",
    }),
    buildExportRow({
      section: "Operating Expenses",
      line_item: "Other Operating Expenses",
      accounting_account: "Other Business Expenses",
      quickbooks_account: "Expenses: Other Business Expenses",
      source: "expense_ledger",
      source_count: expenses.length,
      amount: -otherExpenses,
      statement_impact: "profit_loss",
      tax_treatment: "Needs category review before year-end.",
      reconciliation_status: otherExpenses > 0 ? "needs_review" : "memo",
      notes: "Use category mapping to reduce uncategorized expenses before CPA handoff.",
    }),
    buildExportRow({
      section: "Operating Expenses",
      line_item: "Total Operating Expenses",
      accounting_account: "Operating Expenses",
      quickbooks_account: "Calculated subtotal",
      source: "calculated",
      source_count: 0,
      amount: -totalOperatingExpenses,
      statement_impact: "profit_loss",
      tax_treatment: "Calculated subtotal.",
      reconciliation_status: "ready",
      notes: "Includes merchant fees and manual expense ledger categories.",
    }),
    buildExportRow({
      section: "Net Income / Loss",
      line_item: "Net Income / Loss",
      accounting_account: "Current Year Earnings",
      quickbooks_account: "Equity: Current Year Earnings",
      source: "calculated",
      source_count: 0,
      amount: netIncome,
      statement_impact: "profit_loss",
      tax_treatment: "Calculated net income before CPA adjustments.",
      reconciliation_status: reconciliationReady ? "ready" : "needs_review",
      notes: "Use reconciliation dashboard before relying on this for final tax filing.",
    }),
    buildExportRow({
      section: "Cash Reconciliation Memo",
      line_item: "Navy Federal / Bank Deposits",
      accounting_account: "Business Checking / Savings",
      quickbooks_account: "Bank: Navy Federal Business Checking/Savings",
      source: "bank_transactions",
      source_count: bank.length,
      amount: bankDeposits,
      statement_impact: "cash_flow",
      tax_treatment: "Cash movement, not revenue by itself.",
      reconciliation_status: bank.length > 0 ? "needs_review" : "missing_source",
      notes: "Match Stripe payouts to bank deposits to avoid double-counting revenue.",
    }),
    buildExportRow({
      section: "Cash Reconciliation Memo",
      line_item: "Navy Federal / Bank Withdrawals",
      accounting_account: "Business Checking / Savings",
      quickbooks_account: "Bank: Navy Federal Business Checking/Savings",
      source: "bank_transactions",
      source_count: bank.length,
      amount: -bankWithdrawals,
      statement_impact: "cash_flow",
      tax_treatment: "Cash movement; categorize expenses, transfers, owner draws, and tax payments.",
      reconciliation_status: bank.length > 0 ? "needs_review" : "missing_source",
      notes: "Bank withdrawals should be categorized before monthly close.",
    }),
  ];

  return {
    rows,
    generatedAt: new Date().toISOString(),
    startDate,
    endDate,
    summary: {
      totalRevenue,
      totalCostOfRevenue,
      grossProfit,
      totalOperatingExpenses,
      netIncome,
      stripeRows: stripe.length,
      bankRows: bank.length,
      reconciliationReady,
    },
  };
}

function buildCsv(payload: ExportPayload) {
  const headers = EXPORT_COLUMNS.map((column) => column.replace(/_/g, " ").toUpperCase());

  const body = payload.rows.map((row) =>
    EXPORT_COLUMNS.map((column) => csvEscape(row[column])).join(","),
  );

  return [headers.map(csvEscape).join(","), ...body].join("\n");
}

function buildHtmlReport(payload: ExportPayload, mode: "word" | "excel" | "html") {
  const generatedAt = new Date(payload.generatedAt).toLocaleString("en-US");
  const period = payload.startDate || payload.endDate ? `${payload.startDate || "Start"} to ${payload.endDate || "Today"}` : "All available records";

  const rowsHtml = payload.rows
    .map((row) => {
      const tone = row.reconciliation_status === "ready" ? "ready" : row.reconciliation_status === "missing_source" ? "missing" : "review";

      return `
        <tr>
          <td>${htmlEscape(row.section)}</td>
          <td>${htmlEscape(row.line_item)}</td>
          <td>${htmlEscape(row.accounting_account)}</td>
          <td>${htmlEscape(row.quickbooks_account)}</td>
          <td>${htmlEscape(row.source)}</td>
          <td style="text-align:right;">${htmlEscape(row.source_count)}</td>
          <td style="text-align:right;">${htmlEscape(row.amount.toFixed(2))}</td>
          <td style="text-align:right;">${htmlEscape(row.debit.toFixed(2))}</td>
          <td style="text-align:right;">${htmlEscape(row.credit.toFixed(2))}</td>
          <td style="text-align:right;">${htmlEscape(row.formatted_amount)}</td>
          <td><span class="pill ${tone}">${htmlEscape(row.reconciliation_status.replace(/_/g, " "))}</span></td>
          <td>${htmlEscape(row.tax_treatment)}</td>
          <td>${htmlEscape(row.notes)}</td>
        </tr>
      `;
    })
    .join("");

  const isExcel = mode === "excel";

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>SitGuru Profit & Loss Statement</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 32px;
            font-family: Arial, Helvetica, sans-serif;
            color: #0f172a;
            background: #f7fbf8;
          }
          .shell {
            max-width: 1280px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #d1fae5;
            border-radius: ${isExcel ? "0" : "28px"};
            overflow: hidden;
          }
          .hero {
            padding: 28px;
            background: linear-gradient(135deg, #ecfdf5, #ffffff 55%, #eff6ff);
            border-bottom: 1px solid #d1fae5;
          }
          .eyebrow {
            margin: 0 0 8px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: #047857;
          }
          h1 {
            margin: 0;
            font-size: 34px;
            line-height: 1.05;
            color: #0f172a;
          }
          .meta {
            margin: 10px 0 0;
            color: #475569;
            font-size: 13px;
            font-weight: 700;
          }
          .cards {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px;
            padding: 18px 28px;
            border-bottom: 1px solid #e2e8f0;
          }
          .card {
            border: 1px solid #d1fae5;
            border-radius: ${isExcel ? "0" : "18px"};
            background: #f8fafc;
            padding: 14px;
          }
          .card-label {
            margin: 0;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: #047857;
          }
          .card-value {
            margin: 8px 0 0;
            font-size: 22px;
            font-weight: 900;
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          th {
            position: sticky;
            top: 0;
            background: #064e3b;
            color: #ffffff;
            border: 1px solid #065f46;
            padding: 9px;
            text-align: left;
            font-size: 10px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          td {
            border: 1px solid #e2e8f0;
            padding: 8px;
            vertical-align: top;
          }
          tr:nth-child(even) { background: #f8fafc; }
          .pill {
            display: inline-block;
            border-radius: 999px;
            padding: 3px 8px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            white-space: nowrap;
          }
          .ready { background: #dcfce7; color: #166534; }
          .review { background: #fef3c7; color: #92400e; }
          .missing { background: #fee2e2; color: #991b1b; }
          .footer {
            padding: 18px 28px;
            color: #475569;
            font-size: 12px;
            line-height: 1.6;
            border-top: 1px solid #e2e8f0;
          }
          @media print {
            body { background: #ffffff; padding: 0; }
            .shell { border: none; border-radius: 0; }
            .hero { break-inside: avoid; }
            th { position: static; }
          }
        </style>
      </head>
      <body>
        <div class="shell">
          <section class="hero">
            <p class="eyebrow">SitGuru Admin / Financials / Profit & Loss</p>
            <h1>SitGuru Statement of Operations</h1>
            <p class="meta">Generated ${htmlEscape(generatedAt)} · Period: ${htmlEscape(period)} · CPA / QuickBooks readiness export</p>
          </section>

          <section class="cards">
            <div class="card"><p class="card-label">Revenue</p><p class="card-value">${htmlEscape(money(payload.summary.totalRevenue))}</p></div>
            <div class="card"><p class="card-label">Gross Profit</p><p class="card-value">${htmlEscape(money(payload.summary.grossProfit))}</p></div>
            <div class="card"><p class="card-label">Operating Expenses</p><p class="card-value">${htmlEscape(money(-payload.summary.totalOperatingExpenses))}</p></div>
            <div class="card"><p class="card-label">Net Income / Loss</p><p class="card-value">${htmlEscape(money(payload.summary.netIncome))}</p></div>
          </section>

          <table>
            <thead>
              <tr>
                <th>Section</th>
                <th>Line Item</th>
                <th>Accounting Account</th>
                <th>QuickBooks Account</th>
                <th>Source</th>
                <th>Rows</th>
                <th>Amount</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Formatted</th>
                <th>Status</th>
                <th>Tax Treatment</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>

          <section class="footer">
            <strong>Reconciliation note:</strong> Stripe payouts deposited into Navy Federal checking or savings are cash movements, not new revenue. Match Stripe payout records to bank deposits before final CPA handoff to avoid double-counting.
          </section>
        </div>
      </body>
    </html>
  `;
}

function responseWithFile({
  body,
  contentType,
  filename,
}: {
  body: string;
  contentType: string;
  filename: string;
}) {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function normalizeFormat(value: string | null): ExportFormat {
  const format = value?.trim().toLowerCase();

  if (format === "json") return "json";
  if (format === "word" || format === "doc") return "word";
  if (format === "excel" || format === "xls") return "excel";
  if (format === "html" || format === "print" || format === "pdf") return "html";

  return "csv";
}

function getDownloadBody(payload: ExportPayload, format: ExportFormat) {
  if (format === "json") {
    return {
      body: JSON.stringify(payload, null, 2),
      contentType: "application/json; charset=utf-8",
      extension: "json",
    };
  }

  if (format === "word") {
    return {
      body: buildHtmlReport(payload, "word"),
      contentType: "application/msword; charset=utf-8",
      extension: "doc",
    };
  }

  if (format === "excel") {
    return {
      body: buildHtmlReport(payload, "excel"),
      contentType: "application/vnd.ms-excel; charset=utf-8",
      extension: "xls",
    };
  }

  if (format === "html") {
    return {
      body: buildHtmlReport(payload, "html"),
      contentType: "text/html; charset=utf-8",
      extension: "html",
    };
  }

  return {
    body: buildCsv(payload),
    contentType: "text/csv; charset=utf-8",
    extension: "csv",
  };
}

async function sendEmailWithResend({
  to,
  subject,
  message,
  filename,
  body,
  contentType,
}: {
  to: string;
  subject: string;
  message: string;
  filename: string;
  body: string;
  contentType: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FINANCIAL_EXPORT_FROM_EMAIL || process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return {
      ok: false,
      status: 501,
      message:
        "Email delivery is not configured yet. Add RESEND_API_KEY and FINANCIAL_EXPORT_FROM_EMAIL to enable email attachments.",
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
      html: `<p>${htmlEscape(message).replace(/\n/g, "<br />")}</p>`,
      attachments: [
        {
          filename,
          content: Buffer.from(body, "utf8").toString("base64"),
          content_type: contentType.split(";")[0],
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return {
      ok: false,
      status: response.status,
      message: text || "Email provider rejected the request.",
    };
  }

  return { ok: true, status: 200, message: "Profit & Loss export emailed successfully." };
}

export async function GET(req: NextRequest) {
  const access = await requireFinanceAccess();

  if (!access.ok) {
    return NextResponse.json(
      { ok: false, message: access.reason || "Finance access required." },
      { status: access.reason === "Not authenticated" ? 401 : 403 },
    );
  }

  const format = normalizeFormat(req.nextUrl.searchParams.get("format"));
  const startDate = req.nextUrl.searchParams.get("startDate") || null;
  const endDate = req.nextUrl.searchParams.get("endDate") || null;
  const payload = await getProfitLossExportPayload({ startDate, endDate });
  const date = new Date().toISOString().slice(0, 10);

  await auditFinancialExport({
    access,
    format,
    rowCount: payload.rows.length,
    startDate,
    endDate,
    delivery: "download",
  });

  if (format === "json") {
    return NextResponse.json({ ok: true, ...payload });
  }

  const file = getDownloadBody(payload, format);
  const filename = `sitguru-profit-loss-${date}.${file.extension}`;

  if (format === "html") {
    return new Response(file.body, {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  return responseWithFile({
    body: file.body,
    contentType: file.contentType,
    filename,
  });
}

export async function POST(req: NextRequest) {
  const access = await requireFinanceAccess();

  if (!access.ok) {
    return NextResponse.json(
      { ok: false, message: access.reason || "Finance access required." },
      { status: access.reason === "Not authenticated" ? 401 : 403 },
    );
  }

  let json: Record<string, unknown> = {};

  try {
    json = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const to = asTrimmedString(json.to);
  const format = normalizeFormat(asTrimmedString(json.format) || "pdf");
  const startDate = asTrimmedString(json.startDate) || null;
  const endDate = asTrimmedString(json.endDate) || null;

  if (!to || !to.includes("@")) {
    return NextResponse.json(
      { ok: false, message: "A valid recipient email address is required." },
      { status: 400 },
    );
  }

  const payload = await getProfitLossExportPayload({ startDate, endDate });
  const date = new Date().toISOString().slice(0, 10);
  const file = getDownloadBody(payload, format === "html" ? "word" : format);
  const filename = `sitguru-profit-loss-${date}.${file.extension}`;

  const emailResult = await sendEmailWithResend({
    to,
    subject: asTrimmedString(json.subject) || `SitGuru Profit & Loss Statement - ${date}`,
    message:
      asTrimmedString(json.message) ||
      "Attached is the SitGuru Profit & Loss statement export. Please review reconciliation notes before final CPA/tax use.",
    filename,
    body: file.body,
    contentType: file.contentType,
  });

  if (!emailResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: emailResult.message,
        download_url: `/api/admin/financials/profit-loss/export?format=${format}&startDate=${startDate || ""}&endDate=${endDate || ""}`,
      },
      { status: emailResult.status },
    );
  }

  await auditFinancialExport({
    access,
    format,
    rowCount: payload.rows.length,
    startDate,
    endDate,
    delivery: "email",
  });

  return NextResponse.json({
    ok: true,
    message: emailResult.message,
    filename,
    rows: payload.rows.length,
  });
}
