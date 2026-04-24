import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type BalanceSheetRow = Record<string, unknown>;
type BookingRow = Record<string, unknown>;
type PayoutRow = Record<string, unknown>;
type ExpenseRow = Record<string, unknown>;
type FinancialLedgerRow = Record<string, unknown>;

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
  { section: "current_assets", label: "Cash / Operating Account" },
  { section: "current_assets", label: "Petty Cash" },
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
    label: "Cash / Operating Account",
    amount: 0,
    display_order: 10,
    notes: "Manual cash balance",
  },
  {
    section: "current_assets",
    label: "Stripe Balance / Pending Receipts",
    amount: 0,
    display_order: 20,
    notes: "Manual or Stripe balance placeholder",
  },
  {
    section: "current_assets",
    label: "Accounts Receivable",
    amount: 0,
    display_order: 30,
    notes: "Uncollected customer balances",
  },
  {
    section: "current_assets",
    label: "Prepaid Expenses",
    amount: 0,
    display_order: 40,
    notes: "Prepaid tools, insurance, or services",
  },
  {
    section: "non_current_assets",
    label: "Equipment",
    amount: 0,
    display_order: 10,
    notes: "Equipment owned by SitGuru",
  },
  {
    section: "non_current_assets",
    label: "Intangible Assets / Software",
    amount: 0,
    display_order: 20,
    notes: "Software or platform asset value",
  },
  {
    section: "current_liabilities",
    label: "Guru Payouts Payable",
    amount: 0,
    display_order: 10,
    notes: "Estimated from paid bookings not released",
  },
  {
    section: "current_liabilities",
    label: "Sales Tax Payable",
    amount: 0,
    display_order: 20,
    notes: "Estimated from booking tax fields",
  },
  {
    section: "current_liabilities",
    label: "Refunds Payable",
    amount: 0,
    display_order: 30,
    notes: "Estimated from refund-related bookings",
  },
  {
    section: "long_term_liabilities",
    label: "Long-Term Debt",
    amount: 0,
    display_order: 10,
    notes: "Manual long-term debt",
  },
  {
    section: "equity",
    label: "Owner’s Capital",
    amount: 0,
    display_order: 10,
    notes: "Manual owner contribution",
  },
  {
    section: "equity",
    label: "Retained Earnings",
    amount: 0,
    display_order: 20,
    notes: "Manual retained earnings",
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
      console.warn(`Balance sheet query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Balance sheet query skipped for ${label}:`, error);
    return [];
  }
}

async function addBalanceSheetLine(formData: FormData) {
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

  await supabaseAdmin.from("balance_sheet_lines").insert({
    section,
    label,
    amount: Number.isFinite(amount) ? amount : 0,
    notes,
    display_order: 100,
    is_active: true,
  });

  revalidatePath("/admin/financials/balance-sheet");
}

async function deleteBalanceSheetLine(formData: FormData) {
  "use server";

  const lineId = String(formData.get("lineId") || "").trim();

  if (!lineId) {
    return;
  }

  await supabaseAdmin
    .from("balance_sheet_lines")
    .update({ is_active: false })
    .eq("id", lineId);

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

function getLedgerDebit(row: FinancialLedgerRow) {
  return toNumber(row.debit);
}

function getLedgerCredit(row: FinancialLedgerRow) {
  return toNumber(row.credit);
}

function getLedgerAccountName(row: FinancialLedgerRow) {
  return asTrimmedString(row.account_name).toLowerCase();
}

function getLedgerNetForAccounts(
  ledgerEntries: FinancialLedgerRow[],
  accountNames: string[]
) {
  const normalizedNames = accountNames.map((name) => name.toLowerCase());

  return ledgerEntries.reduce((sum, row) => {
    const accountName = getLedgerAccountName(row);

    if (!normalizedNames.includes(accountName)) {
      return sum;
    }

    return sum + getLedgerDebit(row) - getLedgerCredit(row);
  }, 0);
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

function getBalanceLineAmount({
  line,
  bookings,
  ledgerEntries,
}: {
  line: BalanceSheetRow;
  bookings: BookingRow[];
  ledgerEntries: FinancialLedgerRow[];
}) {
  const label = normalizeBalanceLabel(asTrimmedString(line.label));
  const storedAmount = toNumber(line.amount);

  if (label === "cash" || label === "cash / operating account") {
    return (
      storedAmount +
      getLedgerNetForAccounts(ledgerEntries, [
        "Cash",
        "Cash / Operating Account",
      ])
    );
  }

  if (label === "petty cash") {
    return storedAmount + getLedgerNetForAccounts(ledgerEntries, ["Petty Cash"]);
  }

  if (label === "stripe balance / pending receipts") {
    return (
      storedAmount +
      getLedgerNetForAccounts(ledgerEntries, [
        "Stripe Balance",
        "Stripe Balance / Pending Receipts",
        "Pending Receipts",
      ])
    );
  }

  if (label.includes("guru payout") || label.includes("payouts payable")) {
    return bookings.reduce((sum, booking) => {
      const payoutStatus = getBookingPayoutStatus(booking);

      if (isPaidBooking(booking) && !isPayoutReleased(payoutStatus)) {
        return sum + getGuruPayoutAmount(booking);
      }

      return sum;
    }, 0);
  }

  if (label.includes("sales tax")) {
    return bookings.reduce((sum, booking) => sum + getBookingTaxAmount(booking), 0);
  }

  if (label.includes("refund")) {
    return bookings.reduce((sum, booking) => sum + getRefundAmount(booking), 0);
  }

  if (label.includes("receivable")) {
    const bookingReceivables = bookings.reduce((sum, booking) => {
      return isPaidBooking(booking) ? sum : sum + getBookingGrossAmount(booking);
    }, 0);

    return (
      storedAmount +
      bookingReceivables +
      getLedgerNetForAccounts(ledgerEntries, ["Accounts Receivable"])
    );
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

              <p className="font-bold tabular-nums text-white">
                {money(line.amount)}
              </p>

              {line.isSaved ? (
                <form action={deleteBalanceSheetLine}>
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

async function getBalanceSheetData() {
  const [savedLines, bookings, payouts, expenses, ledgerEntries] = await Promise.all([
    safeRows<BalanceSheetRow>(
      supabaseAdmin
        .from("balance_sheet_lines")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(500),
      "balance_sheet_lines"
    ),
    safeRows<BookingRow>(
      supabaseAdmin
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1500),
      "bookings"
    ),
    safeRows<PayoutRow>(
      supabaseAdmin
        .from("guru_payouts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1500),
      "guru_payouts"
    ),
    safeRows<ExpenseRow>(
      supabaseAdmin
        .from("expense_ledger")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1500),
      "expense_ledger"
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

  const sourceLines = savedLines.length > 0 ? savedLines : DEFAULT_BALANCE_LINES;

  let lines: BalanceLine[] = sourceLines
    .map((line, index) => {
      const dbId = asTrimmedString(line.id);

      return {
        id: getLineId(line, index),
        dbId,
        isSaved: Boolean(dbId && savedLines.length > 0),
        section: getLineSection(line),
        label: asTrimmedString(line.label) || "Balance sheet line",
        amount: getBalanceLineAmount({ line, bookings, ledgerEntries }),
        notes: asTrimmedString(line.notes),
        displayOrder: toNumber(line.display_order) || 100,
      };
    })
    .sort(
      (a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label)
    );

  const hasCurrentNetIncomeLine = lines.some(
    (line) =>
      line.section === "equity" &&
      normalizeBalanceLabel(line.label) === "current net income / loss"
  );

  if (hasCurrentNetIncomeLine) {
    const preliminaryAssets = lines
      .filter(
        (line) =>
          line.section === "current_assets" ||
          line.section === "non_current_assets"
      )
      .reduce((sum, line) => sum + line.amount, 0);

    const preliminaryLiabilities = lines
      .filter(
        (line) =>
          line.section === "current_liabilities" ||
          line.section === "long_term_liabilities"
      )
      .reduce((sum, line) => sum + line.amount, 0);

    const manualEquity = lines
      .filter(
        (line) =>
          line.section === "equity" &&
          normalizeBalanceLabel(line.label) !== "current net income / loss"
      )
      .reduce((sum, line) => sum + line.amount, 0);

    const currentNetIncomeOrLoss =
      preliminaryAssets - preliminaryLiabilities - manualEquity;

    lines = lines.map((line) => {
      if (
        line.section === "equity" &&
        normalizeBalanceLabel(line.label) === "current net income / loss"
      ) {
        return {
          ...line,
          amount: currentNetIncomeOrLoss,
          notes:
            line.notes ||
            "Auto-balancing current period income/loss from tracked assets, liabilities, and manual equity.",
        };
      }

      return line;
    });
  }

  const currentAssets = lines.filter((line) => line.section === "current_assets");
  const nonCurrentAssets = lines.filter(
    (line) => line.section === "non_current_assets"
  );
  const currentLiabilities = lines.filter(
    (line) => line.section === "current_liabilities"
  );
  const longTermLiabilities = lines.filter(
    (line) => line.section === "long_term_liabilities"
  );
  const equityLines = lines.filter((line) => line.section === "equity");

  const totalCurrentAssets = currentAssets.reduce(
    (sum, line) => sum + line.amount,
    0
  );
  const totalNonCurrentAssets = nonCurrentAssets.reduce(
    (sum, line) => sum + line.amount,
    0
  );
  const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

  const totalCurrentLiabilities = currentLiabilities.reduce(
    (sum, line) => sum + line.amount,
    0
  );
  const totalLongTermLiabilities = longTermLiabilities.reduce(
    (sum, line) => sum + line.amount,
    0
  );
  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

  const totalEquity = equityLines.reduce((sum, line) => sum + line.amount, 0);
  const liabilitiesPlusEquity = totalLiabilities + totalEquity;
  const balanceDifference = totalAssets - liabilitiesPlusEquity;
  const isBalanced = Math.abs(balanceDifference) < 1;

  const maxVisualValue = Math.max(totalAssets, totalLiabilities, totalEquity, 1);

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

  return {
    currentAssets,
    nonCurrentAssets,
    currentLiabilities,
    longTermLiabilities,
    equityLines,
    recentExpenseAssets,
    savedLineCount: savedLines.length,
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
      pendingPayoutsFromPayoutTable,
    },
  };
}

export default async function AdminBalanceSheetPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const balance = await getBalanceSheetData();

  const visualRows = [
    {
      label: "Assets",
      value: balance.totals.totalAssets,
      tone: "bg-emerald-400",
    },
    {
      label: "Liabilities",
      value: balance.totals.totalLiabilities,
      tone: "bg-sky-400",
    },
    {
      label: "Equity",
      value: balance.totals.totalEquity,
      tone: "bg-violet-400",
    },
    {
      label: "Difference",
      value: Math.abs(balance.totals.balanceDifference),
      tone: balance.totals.isBalanced ? "bg-emerald-400" : "bg-rose-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_30%),radial-gradient(circle_at_right,_rgba(14,165,233,0.10),_transparent_28%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-sky-500/10 p-6 shadow-[0_12px_60px_rgba(0,0,0,0.28)] lg:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                Admin / Financials / Balance Sheet
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                SitGuru Balance Sheet.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Snapshot of SitGuru assets, liabilities, and equity. The balance
                sheet checks whether Assets equal Liabilities plus Equity.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionLink href="/admin/financials" label="Financials" />
              <ActionLink href="/admin/financials/profit-loss" label="P&L" />
              <ActionLink href="/admin/payments" label="Payments" />
              <ActionLink href="/api/admin/financials/profit-loss/export?format=csv" label="CSV" />
              <ActionLink href="/api/admin/financials/profit-loss/export?format=excel" label="Excel" />
              <ActionLink href="/api/admin/financials/profit-loss/export?format=word" label="Word" primary />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Assets"
              value={money(balance.totals.totalAssets)}
              detail={`${money(balance.totals.totalCurrentAssets)} current assets + ${money(
                balance.totals.totalNonCurrentAssets
              )} non-current assets.`}
              tone="emerald"
            />
            <StatCard
              label="Total Liabilities"
              value={money(balance.totals.totalLiabilities)}
              detail={`${money(
                balance.totals.totalCurrentLiabilities
              )} current liabilities + ${money(
                balance.totals.totalLongTermLiabilities
              )} long-term liabilities.`}
              tone="sky"
            />
            <StatCard
              label="Total Equity"
              value={money(balance.totals.totalEquity)}
              detail="Owner’s capital, retained earnings, and other equity lines."
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

        <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                  Add Balance Sheet Line
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                  Add assets, liabilities, or equity.
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Add manual balance sheet rows for cash, debt, owner capital,
                  assets, or liabilities.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-bold text-slate-300">
                {balance.savedLineCount > 0
                  ? `${balance.savedLineCount} saved balance lines`
                  : "Using default balance lines"}
              </div>
            </div>

            <form
              action={addBalanceSheetLine}
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
                      {SECTION_LABELS[item.section as BalanceSectionKey]} —{" "}
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
                  placeholder="Example: Cash, Bank Loan, Owner Capital..."
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
                Add Balance Line
              </button>
            </form>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Balance Check
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
              Assets = Liabilities + Equity
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              This card compares SitGuru’s total assets against total
              liabilities plus total equity.
            </p>

            <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/50 p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-bold text-slate-400">Assets</p>
                <p className="text-xl font-black text-white">
                  {money(balance.totals.totalAssets)}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-4">
                <p className="text-sm font-bold text-slate-400">
                  Liabilities + Equity
                </p>
                <p className="text-xl font-black text-white">
                  {money(balance.totals.liabilitiesPlusEquity)}
                </p>
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-bold text-slate-400">Difference</p>
                  <p
                    className={`text-xl font-black ${
                      balance.totals.isBalanced
                        ? "text-emerald-200"
                        : "text-rose-200"
                    }`}
                  >
                    {money(balance.totals.balanceDifference)}
                  </p>
                </div>
              </div>

              <div
                className={`mt-5 rounded-2xl border p-4 ${
                  balance.totals.isBalanced
                    ? "border-emerald-400/20 bg-emerald-400/10"
                    : "border-rose-400/20 bg-rose-400/10"
                }`}
              >
                <p
                  className={`text-sm font-bold ${
                    balance.totals.isBalanced
                      ? "text-emerald-100"
                      : "text-rose-100"
                  }`}
                >
                  {balance.totals.isBalanced
                    ? "Balance sheet is balanced."
                    : "Balance sheet needs adjustment."}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Add or adjust cash, owner capital, retained earnings, debt, or
                  liabilities until the equation balances.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {visualRows.map((row) => (
                <div key={row.label}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="text-sm font-bold text-white">{row.label}</p>
                    <p className="text-sm font-bold text-white">
                      {money(row.value)}
                    </p>
                  </div>

                  <div className="h-3 rounded-full bg-white/10">
                    <div
                      className={`h-3 rounded-full ${row.tone}`}
                      style={{
                        width: `${getBarWidth(
                          row.value,
                          balance.totals.maxVisualValue
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
            <div className="border-b border-white/10 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Balance Sheet Statement
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                Assets, Liabilities, and Equity
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

                <div className="grid grid-cols-[1fr_auto] gap-4 border-y border-emerald-400/30 bg-emerald-400/10 px-4 py-4 font-black text-white">
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

                <div className="grid grid-cols-[1fr_auto] gap-4 border-y border-white/10 bg-white/10 px-4 py-4 font-black text-white">
                  <p>Total Liabilities</p>
                  <p>{money(balance.totals.totalLiabilities)}</p>
                </div>

                <BalanceSection
                  title="Equity"
                  lines={balance.equityLines}
                  totalLabel="Total Equity"
                  totalValue={balance.totals.totalEquity}
                />

                <div className="grid grid-cols-[1fr_auto] gap-4 border-t border-emerald-400/30 bg-emerald-400/10 px-4 py-4 font-black text-white">
                  <p>Total Liabilities + Equity</p>
                  <p>{money(balance.totals.liabilitiesPlusEquity)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Balance Sheet Visuals
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                Assets vs. liabilities and equity.
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Current Assets
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {money(balance.totals.totalCurrentAssets)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Non-Current Assets
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {money(balance.totals.totalNonCurrentAssets)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Current Liabilities
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {money(balance.totals.totalCurrentLiabilities)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Long-Term Liabilities
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {money(balance.totals.totalLongTermLiabilities)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Recent Operating Activity
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                Expense rows that may affect assets or equity.
              </h2>

              <div className="mt-6 space-y-4">
                {balance.recentExpenseAssets.length ? (
                  balance.recentExpenseAssets.map((expense) => (
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
                        <p className="font-black text-white">
                          {moneyExact(expense.amount)}
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
                SitGuru Balance Sheet Notes
              </p>
              <p className="mt-3 text-sm leading-7 text-sky-50/90">
                Auto-estimated lines include Guru payouts payable, sales tax
                payable, refund obligations, and accounts receivable when enough
                booking data is available. Cash, owner capital, long-term debt,
                and retained earnings should usually be entered manually.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}