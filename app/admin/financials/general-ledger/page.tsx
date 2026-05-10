import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
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
  status: string;
  reconciliationStatus: string;
  taxTreatment: string;
};

type AdminIdentity = {
  id: string;
  email: string;
  role: string;
  canAccessFinancials: boolean;
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

const SOURCE_TABLES: LedgerSource[] = [
  "financial_ledger_entries",
  "trust_safety_financial_events",
  "guru_trust_safety_plan_purchases",
  "booking_trust_safety_deductions",
  "expense_ledger",
  "stripe_transactions",
  "stripe_balance_transactions",
  "bank_transactions",
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

function getDateValue(row: AnyRow) {
  return (
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
  const metadata = row.metadata;

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "";
  }

  const meta = metadata as AnyRow;

  return (
    asTrimmedString(meta.description) ||
    asTrimmedString(meta.memo) ||
    asTrimmedString(meta.note) ||
    asTrimmedString(meta.payment_option) ||
    asTrimmedString(meta.action) ||
    ""
  );
}

function getStatus(row: AnyRow) {
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
    ]) || "recorded"
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
    normalized.includes("collected")
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
        taxTreatment: "Installment receivable for financed Trust & Safety plan; CPA review.",
      };
    }

    if (planKey === "book_and_bark_plan") {
      return {
        account: "Trust & Safety Receivable - Book & Bark",
        quickBooksAccount: "Accounts Receivable: Trust & Safety Booking Deductions",
        taxTreatment: "Booking-deduction receivable for financed Trust & Safety plan; CPA review.",
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
      quickBooksAccount: "Accounts Receivable: Trust & Safety Booking Deductions",
      taxTreatment: "Recovery of Book & Bark balance from completed booking payouts; CPA review.",
    };
  }

  if (text.includes("checkr") || eventType === "checkr_vendor_cost") {
    return {
      account: "Checkr Vendor Costs",
      quickBooksAccount: "Cost of Services: Background Checks",
      taxTreatment: "Vendor cost of revenue for Trust & Safety screening; CPA review.",
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

function deriveAccountFromText(text: string, source: LedgerSource, row?: AnyRow) {
  if (
    source === "trust_safety_financial_events" ||
    source === "guru_trust_safety_plan_purchases" ||
    source === "booking_trust_safety_deductions"
  ) {
    return deriveTrustSafetyAccount(row || {}, source);
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
    normalized.includes("affiliate")
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
    normalized.includes("navy")
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

    if (eventType === "stripe_fee" || eventType === "checkr_vendor_cost" || eventType === "sitguru_fronted_cost" || eventType === "refund") {
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
    `${asTrimmedString(row.plan_name) || "Trust & Safety"} ${asTrimmedString(row.event_type) || "event"}`.trim()
  );
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
  const isTrustSafetySource =
    source === "trust_safety_financial_events" ||
    source === "guru_trust_safety_plan_purchases" ||
    source === "booking_trust_safety_deductions";

  const description = isTrustSafetySource
    ? getTrustSafetyDescription(row, source)
    : getText(row, [
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
      sourceLabel(source);

  const accountInfo = isTrustSafetySource
    ? deriveTrustSafetyAccount(row, source)
    : asTrimmedString(row.account_name) ||
        asTrimmedString(row.account) ||
        asTrimmedString(row.category)
      ? {
          account:
            asTrimmedString(row.account_name) ||
            asTrimmedString(row.account) ||
            asTrimmedString(row.category),
          quickBooksAccount:
            asTrimmedString(row.quickbooks_account) ||
            asTrimmedString(row.qb_account) ||
            asTrimmedString(row.account_name) ||
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
      getText(row, ["notes", "note", "memo", "metadata_summary"]) ||
      getMetadataText(row) ||
      "Imported from SitGuru financial data source.",
    debit,
    credit,
    amount: debit - credit,
    status: getStatus(row),
    reconciliationStatus:
      getText(row, ["reconciliation_status", "reconciled_status"]) ||
      (source === "bank_transactions" ||
      source === "stripe_balance_transactions" ||
      source === "trust_safety_financial_events"
        ? "Needs reconciliation review"
        : "Not reconciled"),
    taxTreatment: accountInfo.taxTreatment,
  };
}

async function getSourceRows(source: LedgerSource) {
  return safeRows<AnyRow>(
    supabaseAdmin
      .from(source)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(750),
    source,
  );
}

async function getGeneralLedgerData() {
  const sourceResults = await Promise.all(
    SOURCE_TABLES.map(async (source) => ({
      source,
      rows: await getSourceRows(source),
    })),
  );

  const entries = sourceResults
    .flatMap(({ source, rows }) =>
      rows.map((row, index) => normalizeLedgerEntry(row, source, index)),
    )
    .sort((a, b) => {
      const aTime = new Date(a.date || "").getTime() || 0;
      const bTime = new Date(b.date || "").getTime() || 0;
      return bTime - aTime;
    });

  const totalDebits = entries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredits = entries.reduce((sum, entry) => sum + entry.credit, 0);
  const difference = totalDebits - totalCredits;
  const trustSafetyEntries = entries.filter((entry) =>
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

  const sourceCounts = sourceResults.map(({ source, rows }) => ({
    source,
    label: sourceLabel(source),
    count: rows.length,
  }));
  const needsReview = entries.filter(
    (entry) =>
      entry.account === "Uncategorized Ledger Activity" ||
      entry.quickBooksAccount === "Ask My Accountant" ||
      entry.reconciliationStatus.toLowerCase().includes("needs"),
  ).length;

  const accountSummary = Array.from(
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

  return {
    entries,
    sourceCounts,
    accountSummary,
    trustSafetyEntries,
    totals: {
      totalDebits,
      totalCredits,
      difference,
      isBalanced: Math.abs(difference) < 0.01,
      needsReview,
      rowCount: entries.length,
      trustSafetyRows: trustSafetyEntries.length,
      trustSafetyDebits,
      trustSafetyCredits,
      trustSafetyNet: trustSafetyDebits - trustSafetyCredits,
    },
  };
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
  tone = "emerald",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "emerald" | "blue" | "amber" | "rose" | "slate";
}) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50",
    blue: "border-blue-100 bg-blue-50",
    amber: "border-amber-100 bg-amber-50",
    rose: "border-rose-100 bg-rose-50",
    slate: "border-slate-100 bg-slate-50",
  };

  return (
    <div className={`rounded-[1.5rem] border p-5 ${tones[tone]}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-600">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
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
        No ledger entries loaded yet.
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        Connect Stripe, Navy Federal bank activity, Trust & Safety records,
        payment records, payout records, commissions, expenses, or financial
        ledger entries to populate the General Ledger.
      </p>
    </div>
  );
}

function LedgerTable({ entries }: { entries: LedgerEntry[] }) {
  if (!entries.length) return <EmptyLedgerState />;

  return (
    <div className="overflow-x-auto rounded-[1.5rem] border border-slate-100">
      <table className="min-w-[1200px] divide-y divide-slate-100">
        <thead className="bg-slate-50">
          <tr>
            {[
              "Date",
              "Account",
              "Description",
              "Source",
              "Status",
              "Debit",
              "Credit",
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
          {entries.slice(0, 175).map((entry) => (
            <tr key={entry.id} className="align-top">
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
              <td className="max-w-[280px] px-4 py-4">
                <p className="text-sm font-bold leading-6 text-slate-700">
                  {entry.description}
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  {entry.memo}
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
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-black text-emerald-800">
                {entry.debit > 0 ? money(entry.debit) : "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-black text-rose-800">
                {entry.credit > 0 ? money(entry.credit) : "—"}
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
  );
}

export default async function AdminGeneralLedgerPage() {
  const actor = await requireFinancialAdmin();

  if (!actor) {
    return null;
  }

  const ledger = await getGeneralLedgerData();

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1700px] space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-5xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                Financials / General Ledger
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                General Ledger.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-semibold leading-7 text-slate-600 sm:text-base">
                CPA-ready ledger view for SitGuru financial activity. This page
                combines financial ledger entries, Trust & Safety events,
                Trust & Safety plan purchases, Book & Bark deductions, Stripe
                activity, Navy Federal bank activity, payments, payouts,
                commissions, and expenses into account-mapped debit and credit
                rows for QuickBooks handoff.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/financials/exports"
                className="rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                Reports & Exports
              </Link>
              <Link
                href="/admin/financials/cash-flow"
                className="rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                Cash Flow
              </Link>
              <Link
                href="/admin/background-checks"
                className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-100"
              >
                Trust & Safety
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
              detail="Combined rows from ledger, Trust & Safety, Stripe, bank, payments, payouts, commissions, and expenses."
              tone="emerald"
            />
            <StatCard
              label="Total Debits"
              value={money(ledger.totals.totalDebits)}
              detail="Debit-side activity available for accounting review."
              tone="blue"
            />
            <StatCard
              label="Total Credits"
              value={money(ledger.totals.totalCredits)}
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
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Trust & Safety Rows"
            value={ledger.totals.trustSafetyRows.toLocaleString()}
            detail="Plan purchases, financial events, and Book & Bark deductions in the ledger."
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

        <section className="grid gap-6 xl:grid-cols-[1fr_0.45fr]">
          <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <SectionHeader
              eyebrow="Ledger Entries"
              title="Debit / Credit Activity"
              description="Review the newest imported ledger rows. Uncategorized and unreconciled rows are surfaced so your CPA or bookkeeper can classify them before month-end close."
            />

            <div className="mt-6">
              <LedgerTable entries={ledger.entries} />
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeader
                eyebrow="Sources"
                title="Connected Tables"
                description="Rows are safely loaded only from tables that exist and are accessible."
              />

              <div className="mt-5 space-y-3">
                {ledger.sourceCounts.map((source) => (
                  <div
                    key={source.source}
                    className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4"
                  >
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {source.label}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {source.source}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                      {source.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeader
                eyebrow="Account Summary"
                title="Top Accounts"
                description="Largest ledger balances by account."
              />

              <div className="mt-5 space-y-3">
                {ledger.accountSummary.slice(0, 10).map((account) => (
                  <div
                    key={account.account}
                    className="rounded-[1.25rem] border border-slate-100 bg-[#fbfefd] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-slate-950">
                          {account.account}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {account.count.toLocaleString()} rows
                        </p>
                      </div>
                      <p className="text-right text-sm font-black text-slate-950">
                        {money(account.net)}
                      </p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-slate-500">
                      <p>Debit: {money(account.debit)}</p>
                      <p>Credit: {money(account.credit)}</p>
                    </div>
                  </div>
                ))}

                {ledger.accountSummary.length === 0 ? (
                  <p className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
                    No account summary available yet.
                  </p>
                ) : null}
              </div>
            </section>

            <section className="rounded-[2rem] border border-amber-100 bg-amber-50 p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-800">
                CPA Close Notes
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Month-End Review
              </h2>
              <div className="mt-5 space-y-3">
                {[
                  "Confirm Trust & Safety Stripe payments match Stripe payout and Navy Federal deposits.",
                  "Confirm Pawstep and Book & Bark balances agree to receivables on the Balance Sheet.",
                  "Classify Checkr vendor costs and Trust & Safety Stripe fees consistently as cost of revenue.",
                  "Classify uncategorized ledger activity before exporting to QuickBooks.",
                  "Export statements and attach this ledger support to the CPA package.",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex gap-3 rounded-[1.25rem] border border-amber-100 bg-white/70 p-4"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm font-bold leading-6 text-slate-700">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>

        {ledger.trustSafetyEntries.length > 0 ? (
          <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <SectionHeader
              eyebrow="Trust & Safety Ledger Support"
              title="Trust & Safety event detail"
              description="These are the Trust & Safety plan purchases, finance events, and Book & Bark deductions feeding revenue, costs, receivables, cash flow, and reconciliation."
            />

            <div className="mt-6">
              <LedgerTable entries={ledger.trustSafetyEntries} />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
