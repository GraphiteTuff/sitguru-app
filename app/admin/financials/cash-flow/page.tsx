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

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type CashFlowSectionKey = "operating" | "investing" | "financing" | "cash_position";

type CashFlowLine = {
  id: string;
  dbId: string;
  isSaved: boolean;
  section: CashFlowSectionKey;
  label: string;
  amount: number;
  notes: string;
  displayOrder: number;
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
    notes: "Estimated from paid SitGuru booking rows",
  },
  {
    section: "operating",
    label: "Cash Paid to Gurus",
    amount: 0,
    display_order: 20,
    notes: "Estimated from Guru payout amounts",
  },
  {
    section: "operating",
    label: "Cash Paid for Operating Expenses",
    amount: 0,
    display_order: 30,
    notes: "Estimated from expense_ledger rows",
  },
  {
    section: "operating",
    label: "Cash Paid for Refunds / Credits",
    amount: 0,
    display_order: 40,
    notes: "Estimated from refund-related booking rows",
  },
  {
    section: "operating",
    label: "Sales Tax Held / Paid",
    amount: 0,
    display_order: 50,
    notes: "Estimated from booking sales tax fields",
  },
  {
    section: "investing",
    label: "Equipment Purchases",
    amount: 0,
    display_order: 10,
    notes: "Manual investing activity",
  },
  {
    section: "investing",
    label: "Software / Platform Asset Investment",
    amount: 0,
    display_order: 20,
    notes: "Manual platform investment",
  },
  {
    section: "financing",
    label: "Owner Contributions",
    amount: 0,
    display_order: 10,
    notes: "Manual owner contribution",
  },
  {
    section: "financing",
    label: "Loans Received",
    amount: 0,
    display_order: 20,
    notes: "Manual loan proceeds",
  },
  {
    section: "financing",
    label: "Loan Repayments",
    amount: 0,
    display_order: 30,
    notes: "Manual loan repayment",
  },
  {
    section: "cash_position",
    label: "Beginning Cash Balance",
    amount: 0,
    display_order: 10,
    notes: "Manual beginning cash balance",
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
  label: string
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

async function addCashFlowLine(formData: FormData) {
  "use server";

  const section = String(formData.get("section") || "").trim();
  const preset = String(formData.get("preset") || "").trim();
  const customLabel = String(formData.get("customLabel") || "").trim();
  const amount = Number(formData.get("amount") || 0);
  const notes = String(formData.get("notes") || "").trim();

  const isValidSection = SECTION_OPTIONS.some((item) => item.value === section);

  if (!isValidSection) {
    return;
  }

  const label = customLabel || preset;

  if (!label) {
    return;
  }

  await supabaseAdmin.from("cash_flow_lines").insert({
    section,
    label,
    amount: Number.isFinite(amount) ? amount : 0,
    notes,
    display_order: 100,
    is_active: true,
  });

  revalidatePath("/admin/financials/cash-flow");
}

async function deleteCashFlowLine(formData: FormData) {
  "use server";

  const lineId = String(formData.get("lineId") || "").trim();

  if (!lineId) {
    return;
  }

  await supabaseAdmin
    .from("cash_flow_lines")
    .update({ is_active: false })
    .eq("id", lineId);

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
    asTrimmedString(booking.payment_status) ||
    asTrimmedString(booking.status)
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

function getLedgerAccountName(row: FinancialLedgerRow) {
  return asTrimmedString(row.account_name).toLowerCase();
}

function getLedgerRefundCashOutflow(ledgerEntries: FinancialLedgerRow[]) {
  return ledgerEntries.reduce((sum, row) => {
    const accountName = getLedgerAccountName(row);

    if (
      accountName === "refunds / customer credits" ||
      accountName === "refunds / credits" ||
      accountName === "customer credits"
    ) {
      return sum + getLedgerDebit(row);
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

function getCashFlowLineAmount({
  line,
  bookings,
  expenses,
  payouts,
  disputes,
  ledgerEntries,
}: {
  line: CashFlowRow;
  bookings: BookingRow[];
  expenses: ExpenseRow[];
  payouts: PayoutRow[];
  disputes: DisputeRow[];
  ledgerEntries: FinancialLedgerRow[];
}) {
  const label = asTrimmedString(line.label).toLowerCase();
  const storedAmount = toNumber(line.amount);

  if (label.includes("cash received") && label.includes("booking")) {
    return bookings
      .filter(isPaidBooking)
      .reduce((sum, booking) => sum + getBookingGrossAmount(booking), 0);
  }

  if (label.includes("paid to guru") || label.includes("paid to gurus")) {
    const payoutTableTotal = payouts
      .filter(isPayoutReleased)
      .reduce((sum, payout) => sum + getPayoutAmount(payout), 0);

    if (payoutTableTotal > 0) {
      return -Math.abs(payoutTableTotal);
    }

    return -Math.abs(
      bookings
        .filter(isPaidBooking)
        .reduce((sum, booking) => sum + getGuruPayoutAmount(booking), 0)
    );
  }

  if (label.includes("operating expense")) {
    return -Math.abs(
      expenses.reduce((sum, expense) => sum + getExpenseAmount(expense), 0)
    );
  }

  if (label.includes("refund") || label.includes("credit")) {
    const ledgerRefunds = getLedgerRefundCashOutflow(ledgerEntries);
    const bookingRefunds = bookings.reduce(
      (sum, booking) => sum + getRefundAmount(booking),
      0
    );

    return -Math.abs(ledgerRefunds > 0 ? ledgerRefunds : bookingRefunds);
  }

  if (label.includes("sales tax")) {
    return -Math.abs(
      bookings.reduce((sum, booking) => sum + getBookingTaxAmount(booking), 0)
    );
  }

  if (label.includes("dispute")) {
    return -Math.abs(getNonRefundDisputeCashImpact(disputes));
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
    emerald: "border-emerald-400/20 bg-emerald-400/10",
    sky: "border-sky-400/20 bg-sky-400/10",
    violet: "border-violet-400/20 bg-violet-400/10",
    amber: "border-amber-400/20 bg-amber-400/10",
    rose: "border-rose-400/20 bg-rose-400/10",
  }[tone];

  return (
    <div className={`rounded-3xl border p-5 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-white">
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
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
        className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:border-emerald-300/30 hover:bg-white/10"
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
      <div className="border-y border-emerald-400/20 bg-emerald-400/10 px-4 py-2">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-200">
          {title}
        </p>
      </div>

      <div className="divide-y divide-white/10">
        {lines.length ? (
          lines.map((line) => (
            <div
              key={line.id}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3 text-slate-300"
            >
              <div>
                <p className="pl-6">{line.label}</p>
                {line.notes ? (
                  <p className="mt-1 pl-6 text-xs text-slate-600">
                    {line.notes}
                  </p>
                ) : null}
              </div>

              <p
                className={`font-bold tabular-nums ${
                  line.amount < 0 ? "text-rose-200" : "text-white"
                }`}
              >
                {money(line.amount)}
              </p>

              {line.isSaved ? (
                <form action={deleteCashFlowLine}>
                  <input type="hidden" name="lineId" value={line.dbId} />
                  <button
                    type="submit"
                    className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-xs font-bold text-rose-200 transition hover:bg-rose-400/20"
                  >
                    Delete
                  </button>
                </form>
              ) : (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-500">
                  Default
                </span>
              )}
            </div>
          ))
        ) : (
          <div className="px-4 py-4 text-sm text-slate-500">
            No lines added in this section yet.
          </div>
        )}

        <div className="grid grid-cols-[1fr_auto] gap-4 bg-white/5 px-4 py-3 font-black text-white">
          <p>{totalLabel}</p>
          <p className={totalValue < 0 ? "text-rose-200" : "text-white"}>
            {money(totalValue)}
          </p>
        </div>
      </div>
    </div>
  );
}

async function getCashFlowData() {
  const [savedLines, bookings, expenses, payouts, disputes, ledgerEntries] = await Promise.all([
    safeRows<CashFlowRow>(
      supabaseAdmin
        .from("cash_flow_lines")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(500),
      "cash_flow_lines"
    ),
    safeRows<BookingRow>(
      supabaseAdmin
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1500),
      "bookings"
    ),
    safeRows<ExpenseRow>(
      supabaseAdmin
        .from("expense_ledger")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1500),
      "expense_ledger"
    ),
    safeRows<PayoutRow>(
      supabaseAdmin
        .from("guru_payouts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1500),
      "guru_payouts"
    ),
    safeRows<DisputeRow>(
      supabaseAdmin
        .from("dispute_cases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1500),
      "dispute_cases"
    ),
    safeRows<FinancialLedgerRow>(
      supabaseAdmin
        .from("financial_ledger_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3000),
      "financial_ledger_entries"
    ),
  ]);

  const sourceLines = savedLines.length > 0 ? savedLines : DEFAULT_CASH_FLOW_LINES;

  const lines: CashFlowLine[] = sourceLines
    .map((line, index) => {
      const dbId = asTrimmedString(line.id);

      return {
        id: getLineId(line, index),
        dbId,
        isSaved: Boolean(dbId && savedLines.length > 0),
        section: getCashFlowSection(line),
        label: asTrimmedString(line.label) || "Cash flow line",
        amount: getCashFlowLineAmount({
          line,
          bookings,
          expenses,
          payouts,
          disputes,
          ledgerEntries,
        }),
        notes: asTrimmedString(line.notes),
        displayOrder: toNumber(line.display_order) || 100,
      };
    })
    .sort(
      (a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label)
    );

  const operatingLines = lines.filter((line) => line.section === "operating");
  const investingLines = lines.filter((line) => line.section === "investing");
  const financingLines = lines.filter((line) => line.section === "financing");
  const cashPositionLines = lines.filter(
    (line) => line.section === "cash_position"
  );

  const netOperatingCash = operatingLines.reduce(
    (sum, line) => sum + line.amount,
    0
  );
  const netInvestingCash = investingLines.reduce(
    (sum, line) => sum + line.amount,
    0
  );
  const netFinancingCash = financingLines.reduce(
    (sum, line) => sum + line.amount,
    0
  );

  const beginningCash = cashPositionLines.reduce(
    (sum, line) => sum + line.amount,
    0
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
    1
  );

  const paidBookings = bookings.filter(isPaidBooking);
  const recentExpenses = expenses.slice(0, 6).map((expense, index) => ({
    id: asTrimmedString(expense.id) || `${getExpenseName(expense)}-${index}`,
    name: getExpenseName(expense),
    amount: getExpenseAmount(expense),
    date: formatDateShort(asTrimmedString(expense.created_at)),
  }));

  return {
    operatingLines,
    investingLines,
    financingLines,
    cashPositionLines,
    recentExpenses,
    savedLineCount: savedLines.length,
    totals: {
      bookings: bookings.length,
      paidBookings: paidBookings.length,
      expenseRows: expenses.length,
      payoutRows: payouts.length,
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
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const cashFlow = await getCashFlowData();

  const visualRows = [
    {
      label: "Operating Cash Flow",
      value: cashFlow.totals.netOperatingCash,
      tone:
        cashFlow.totals.netOperatingCash >= 0
          ? "bg-emerald-400"
          : "bg-rose-400",
    },
    {
      label: "Investing Cash Flow",
      value: cashFlow.totals.netInvestingCash,
      tone:
        cashFlow.totals.netInvestingCash >= 0
          ? "bg-sky-400"
          : "bg-amber-400",
    },
    {
      label: "Financing Cash Flow",
      value: cashFlow.totals.netFinancingCash,
      tone:
        cashFlow.totals.netFinancingCash >= 0
          ? "bg-violet-400"
          : "bg-rose-400",
    },
    {
      label: "Net Change in Cash",
      value: cashFlow.totals.netChangeInCash,
      tone:
        cashFlow.totals.netChangeInCash >= 0
          ? "bg-emerald-400"
          : "bg-rose-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_30%),radial-gradient(circle_at_right,_rgba(14,165,233,0.10),_transparent_28%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-sky-500/10 p-6 shadow-[0_12px_60px_rgba(0,0,0,0.28)] lg:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                Admin / Financials / Cash Flow
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                SitGuru Statement of Cash Flows.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Tracks cash moving through SitGuru from operating, investing,
                and financing activities. Auto-estimates booking cash receipts,
                Guru payouts, expenses, refunds, taxes, and dispute adjustments.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionLink href="/admin/financials" label="Financials" />
              <ActionLink href="/admin/financials/profit-loss" label="P&L" />
              <ActionLink href="/admin/financials/balance-sheet" label="Balance Sheet" />
              <ActionLink href="/admin/payments" label="Payments" primary />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Operating Cash Flow"
              value={money(cashFlow.totals.netOperatingCash)}
              detail="Booking receipts minus Guru payouts, expenses, refunds, and tax cash movement."
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
              detail="Owner contributions, loans received, loan repayments, and financing activity."
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

        <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                  Add Cash Flow Line
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                  Add operating, investing, or financing cash lines.
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Add manual cash flow lines for loans, owner contributions,
                  equipment, platform assets, or beginning cash.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-bold text-slate-300">
                {cashFlow.savedLineCount > 0
                  ? `${cashFlow.savedLineCount} saved cash flow lines`
                  : "Using default cash flow lines"}
              </div>
            </div>

            <form
              action={addCashFlowLine}
              className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr]"
            >
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Section
                </label>
                <select
                  name="section"
                  defaultValue=""
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-emerald-300/50"
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
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-emerald-300/50"
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
                  placeholder="Example: Loan Received, Owner Contribution..."
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/50"
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
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/50"
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
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/50"
                />
              </div>

              <button
                type="submit"
                className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 xl:col-span-2"
              >
                Add Cash Flow Line
              </button>
            </form>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Cash Flow Visuals
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
              Operating, investing, financing, and net cash change.
            </h2>

            <div className="mt-6 space-y-5">
              {visualRows.map((row) => (
                <div key={row.label}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="text-sm font-bold text-white">{row.label}</p>
                    <p
                      className={`text-sm font-bold ${
                        row.value < 0 ? "text-rose-200" : "text-white"
                      }`}
                    >
                      {money(row.value)}
                    </p>
                  </div>

                  <div className="h-3 rounded-full bg-white/10">
                    <div
                      className={`h-3 rounded-full ${row.tone}`}
                      style={{
                        width: `${getBarWidth(
                          row.value,
                          cashFlow.totals.maxVisualValue
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Beginning Cash
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {money(cashFlow.totals.beginningCash)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Net Cash Change
                </p>
                <p
                  className={`mt-2 text-2xl font-black ${
                    cashFlow.totals.netChangeInCash >= 0
                      ? "text-emerald-200"
                      : "text-rose-200"
                  }`}
                >
                  {money(cashFlow.totals.netChangeInCash)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Paid Bookings
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {cashFlow.totals.paidBookings.toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Expense Rows
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {cashFlow.totals.expenseRows.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
            <div className="border-b border-white/10 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Statement of Cash Flows
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                Cash movement by activity.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Default lines use available SitGuru data where possible.
                Manually added rows can be deleted.
              </p>
            </div>

            <div className="p-4 sm:p-6">
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/50">
                <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-white">
                    Line Item
                  </p>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-white">
                    Current
                  </p>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-white">
                    Action
                  </p>
                </div>

                <CashFlowSection
                  title="Cash Flows from Operating Activities"
                  lines={cashFlow.operatingLines}
                  totalLabel="Net Cash Provided / Used by Operating Activities"
                  totalValue={cashFlow.totals.netOperatingCash}
                />

                <CashFlowSection
                  title="Cash Flows from Investing Activities"
                  lines={cashFlow.investingLines}
                  totalLabel="Net Cash Provided / Used by Investing Activities"
                  totalValue={cashFlow.totals.netInvestingCash}
                />

                <CashFlowSection
                  title="Cash Flows from Financing Activities"
                  lines={cashFlow.financingLines}
                  totalLabel="Net Cash Provided / Used by Financing Activities"
                  totalValue={cashFlow.totals.netFinancingCash}
                />

                <CashFlowSection
                  title="Cash Position"
                  lines={cashFlow.cashPositionLines}
                  totalLabel="Beginning Cash Balance"
                  totalValue={cashFlow.totals.beginningCash}
                />

                <div className="grid grid-cols-[1fr_auto] gap-4 border-y border-white/10 bg-white/10 px-4 py-4 font-black text-white">
                  <p>Net Increase / Decrease in Cash</p>
                  <p
                    className={
                      cashFlow.totals.netChangeInCash < 0
                        ? "text-rose-200"
                        : "text-white"
                    }
                  >
                    {money(cashFlow.totals.netChangeInCash)}
                  </p>
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-4 border-t border-emerald-400/30 bg-emerald-400/10 px-4 py-4 font-black text-white">
                  <p>Cash Balance at End of Period</p>
                  <p
                    className={
                      cashFlow.totals.endingCash < 0
                        ? "text-rose-200"
                        : "text-white"
                    }
                  >
                    {money(cashFlow.totals.endingCash)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Cash Flow Health
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                Liquidity and operating cash generation.
              </h2>

              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Operating Cash Flow
                  </p>
                  <p
                    className={`mt-2 text-2xl font-black ${
                      cashFlow.totals.netOperatingCash >= 0
                        ? "text-emerald-200"
                        : "text-rose-200"
                    }`}
                  >
                    {money(cashFlow.totals.netOperatingCash)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Ending Cash
                  </p>
                  <p
                    className={`mt-2 text-2xl font-black ${
                      cashFlow.totals.endingCash >= 0
                        ? "text-emerald-200"
                        : "text-rose-200"
                    }`}
                  >
                    {money(cashFlow.totals.endingCash)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Runway Signal
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Cash flow becomes more meaningful once beginning cash and
                    real recurring expenses are entered.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Recent Cash Outflows
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                Expense ledger activity.
              </h2>

              <div className="mt-6 space-y-4">
                {cashFlow.recentExpenses.length ? (
                  cashFlow.recentExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-white">{expense.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {expense.date}
                          </p>
                        </div>
                        <p className="font-black text-rose-200">
                          ({moneyExact(expense.amount)})
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-400">
                    No expense ledger rows found yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-sky-400/20 bg-sky-400/10 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
                SitGuru Cash Flow Notes
              </p>
              <p className="mt-3 text-sm leading-7 text-sky-50/90">
                Operating cash flow is estimated from booking receipts, Guru
                payout cash movement, expenses, refunds, sales tax, and dispute
                data. Investing and financing lines are usually entered manually
                as they occur.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}