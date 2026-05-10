import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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

type GenericRow = Record<string, unknown>;

type ReconciliationItem = {
  id: string;
  source: string;
  label: string;
  amount: number;
  status: string;
  date: string;
  reference: string;
  category: string;
};

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Reconciliation query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Reconciliation query skipped for ${label}:`, error);
    return [];
  }
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(value));

  return value < 0 ? `(${formatted})` : formatted;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
    safeRows<GenericRow>(
      supabaseAdmin
        .from("admin_users")
        .select("role,email,is_active,can_access_financials")
        .eq("user_id", user.id)
        .limit(1),
      "admin_users_reconciliation_access",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("profiles")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "profiles_reconciliation_access",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("users")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "users_reconciliation_access",
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

function getBankAmount(row: GenericRow) {
  return (
    toNumber(row.amount) ||
    toNumber(row.transaction_amount) ||
    toNumber(row.net_amount) ||
    toNumber(row.value) ||
    toNumber(row.credit) - toNumber(row.debit)
  );
}

function getStripeAmount(row: GenericRow) {
  return (
    toNumber(row.net) ||
    toNumber(row.net_amount) ||
    toNumber(row.amount) ||
    toNumber(row.gross_amount) ||
    toNumber(row.balance_amount)
  );
}

function getTrustSafetyAmount(row: GenericRow) {
  return (
    toNumber(row.net_amount_cents) / 100 ||
    toNumber(row.gross_amount_cents) / 100 ||
    0
  );
}

function getBankLabel(row: GenericRow) {
  return (
    asTrimmedString(row.name) ||
    asTrimmedString(row.description) ||
    asTrimmedString(row.merchant_name) ||
    asTrimmedString(row.memo) ||
    "Bank Transaction"
  );
}

function getStripeLabel(row: GenericRow) {
  return (
    asTrimmedString(row.description) ||
    asTrimmedString(row.reporting_category) ||
    asTrimmedString(row.type) ||
    "Stripe Balance Transaction"
  );
}

function getTrustSafetyLabel(row: GenericRow) {
  return (
    asTrimmedString(row.description) ||
    asTrimmedString(row.plan_name) ||
    asTrimmedString(row.event_type) ||
    "Trust & Safety Event"
  );
}

function getStatus(row: GenericRow) {
  return (
    asTrimmedString(row.reconciliation_status) ||
    asTrimmedString(row.status) ||
    (row.reconciled_at ? "reconciled" : "unmatched")
  );
}

function isReconciled(row: GenericRow) {
  return Boolean(
    row.reconciled_at ||
      row.reconciliation_id ||
      row.matched_transaction_id ||
      asTrimmedString(row.reconciliation_status).toLowerCase() === "reconciled" ||
      asTrimmedString(row.status).toLowerCase() === "reconciled",
  );
}

function statusClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("reconciled") || normalized.includes("matched")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized.includes("pending") || normalized.includes("review")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

async function getReconciliationData() {
  const [
    bankTransactions,
    stripeTransactions,
    trustSafetyEvents,
    financialLedgerEntries,
  ] = await Promise.all([
    safeRows<GenericRow>(
      supabaseAdmin
        .from("bank_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3000),
      "bank_transactions",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("stripe_balance_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3000),
      "stripe_balance_transactions",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("trust_safety_financial_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3000),
      "trust_safety_financial_events",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("financial_ledger_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3000),
      "financial_ledger_entries",
    ),
  ]);

  const bankItems: ReconciliationItem[] = bankTransactions.map((row, index) => ({
    id:
      asTrimmedString(row.id) ||
      asTrimmedString(row.transaction_id) ||
      `bank-${index}`,
    source: "NFCU / Bank",
    label: getBankLabel(row),
    amount: getBankAmount(row),
    status: getStatus(row),
    date: formatDate(
      asTrimmedString(row.date) ||
        asTrimmedString(row.transaction_date) ||
        asTrimmedString(row.posted_at) ||
        asTrimmedString(row.created_at),
    ),
    reference:
      asTrimmedString(row.transaction_id) ||
      asTrimmedString(row.bank_transaction_id) ||
      asTrimmedString(row.plaid_transaction_id) ||
      "—",
    category: "Bank",
  }));

  const stripeItems: ReconciliationItem[] = stripeTransactions.map(
    (row, index) => ({
      id:
        asTrimmedString(row.id) ||
        asTrimmedString(row.balance_transaction_id) ||
        `stripe-${index}`,
      source: "Stripe",
      label: getStripeLabel(row),
      amount: getStripeAmount(row),
      status: getStatus(row),
      date: formatDate(
        asTrimmedString(row.available_on) ||
          asTrimmedString(row.created_at) ||
          asTrimmedString(row.date),
      ),
      reference:
        asTrimmedString(row.balance_transaction_id) ||
        asTrimmedString(row.stripe_balance_transaction_id) ||
        asTrimmedString(row.source) ||
        "—",
      category: "Stripe",
    }),
  );

  const trustSafetyItems: ReconciliationItem[] = trustSafetyEvents.map(
    (row, index) => ({
      id: asTrimmedString(row.id) || `trust-safety-${index}`,
      source: "Trust & Safety",
      label: getTrustSafetyLabel(row),
      amount: getTrustSafetyAmount(row),
      status: getStatus(row),
      date: formatDate(asTrimmedString(row.occurred_at) || asTrimmedString(row.created_at)),
      reference:
        asTrimmedString(row.stripe_payment_intent_id) ||
        asTrimmedString(row.stripe_charge_id) ||
        asTrimmedString(row.stripe_checkout_session_id) ||
        asTrimmedString(row.bank_transaction_id) ||
        "—",
      category: asTrimmedString(row.event_type) || "Trust & Safety",
    }),
  );

  const items = [...trustSafetyItems, ...stripeItems, ...bankItems].sort(
    (a, b) => Math.abs(b.amount) - Math.abs(a.amount),
  );

  const reconciledCount =
    bankTransactions.filter(isReconciled).length +
    stripeTransactions.filter(isReconciled).length +
    trustSafetyEvents.filter(isReconciled).length +
    financialLedgerEntries.filter(isReconciled).length;

  const totalRows =
    bankTransactions.length +
    stripeTransactions.length +
    trustSafetyEvents.length +
    financialLedgerEntries.length;

  const unmatchedItems = items.filter(
    (item) =>
      !item.status.toLowerCase().includes("reconciled") &&
      !item.status.toLowerCase().includes("matched"),
  );

  const trustSafetyCash = trustSafetyItems.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  const stripeCash = stripeItems.reduce((sum, item) => sum + item.amount, 0);
  const bankCash = bankItems.reduce((sum, item) => sum + item.amount, 0);

  return {
    items: items.slice(0, 250),
    unmatchedItems: unmatchedItems.slice(0, 25),
    totals: {
      totalRows,
      reconciledCount,
      unmatchedCount: Math.max(0, totalRows - reconciledCount),
      bankRows: bankTransactions.length,
      stripeRows: stripeTransactions.length,
      trustSafetyRows: trustSafetyEvents.length,
      ledgerRows: financialLedgerEntries.length,
      trustSafetyCash,
      stripeCash,
      bankCash,
      reconciliationRate:
        totalRows > 0 ? Math.round((reconciledCount / totalRows) * 100) : 0,
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

function ReconciliationTable({ items }: { items: ReconciliationItem[] }) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.18em]">
                Source
              </th>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.18em]">
                Activity
              </th>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.18em]">
                Amount
              </th>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.18em]">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.18em]">
                Date
              </th>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.18em]">
                Reference
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {items.length ? (
              items.map((item) => (
                <tr key={`${item.source}-${item.id}`} className="transition hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <p className="font-black text-slate-950">{item.source}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {item.category}
                    </p>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-700">
                    {item.label}
                  </td>
                  <td
                    className={`px-4 py-4 font-black ${
                      item.amount < 0 ? "text-rose-700" : "text-slate-950"
                    }`}
                  >
                    {money(item.amount)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClass(
                        item.status,
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{item.date}</td>
                  <td className="max-w-[220px] truncate px-4 py-4 text-xs font-semibold text-slate-500">
                    {item.reference}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No reconciliation rows found yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function AdminFinancialReconciliationPage() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessFinancials) {
    return null;
  }

  const reconciliation = await getReconciliationData();

  return (
    <div className="min-h-screen bg-[#f7fbf8] px-3 py-4 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1640px] space-y-5 sm:space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(420px,620px)] 2xl:items-start">
            <div className="max-w-5xl self-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                Admin / Financials / Reconciliation
              </p>

              <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                SitGuru Financial Reconciliation.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                Match Stripe activity, NFCU/Plaid bank activity, financial
                ledger rows, and Trust & Safety events so SitGuru can verify
                deposits, payouts, Stripe fees, Checkr costs, refunds, and
                booking deduction recoveries without double counting.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-emerald-100 bg-[#fbfefd] p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Reconciliation Actions
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <ActionLink href="/admin/financials" label="Financials" />
                <ActionLink href="/admin/financials/profit-loss" label="P&L" />
                <ActionLink
                  href="/admin/financials/balance-sheet"
                  label="Balance Sheet"
                />
                <ActionLink
                  href="/admin/financials/cash-flow"
                  label="Cash Flow"
                  primary
                />
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Reconciliation Rate"
              value={`${reconciliation.totals.reconciliationRate}%`}
              detail={`${reconciliation.totals.reconciledCount.toLocaleString()} reconciled rows out of ${reconciliation.totals.totalRows.toLocaleString()} total rows.`}
              tone={
                reconciliation.totals.reconciliationRate >= 80
                  ? "emerald"
                  : "amber"
              }
            />
            <StatCard
              label="Unmatched Rows"
              value={reconciliation.totals.unmatchedCount.toLocaleString()}
              detail="Rows still needing a Stripe, NFCU/Plaid, ledger, or Trust & Safety match."
              tone={
                reconciliation.totals.unmatchedCount === 0 ? "emerald" : "rose"
              }
            />
            <StatCard
              label="Trust & Safety Rows"
              value={reconciliation.totals.trustSafetyRows.toLocaleString()}
              detail={`${money(reconciliation.totals.trustSafetyCash)} net Trust & Safety activity included.`}
              tone="violet"
            />
            <StatCard
              label="Bank + Stripe Rows"
              value={(
                reconciliation.totals.bankRows + reconciliation.totals.stripeRows
              ).toLocaleString()}
              detail={`${reconciliation.totals.bankRows.toLocaleString()} bank rows and ${reconciliation.totals.stripeRows.toLocaleString()} Stripe rows found.`}
              tone="sky"
            />
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Unmatched / Review Queue
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Items that need reconciliation review.
              </h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                This queue highlights the highest-priority unmatched activity
                across Trust & Safety, Stripe, and NFCU/Plaid bank rows.
              </p>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-black text-amber-800">
              {reconciliation.unmatchedItems.length.toLocaleString()} shown
            </div>
          </div>

          <div className="mt-6">
            <ReconciliationTable items={reconciliation.unmatchedItems} />
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                All Reconciliation Support
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Trust & Safety, Stripe, and bank activity.
              </h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                Use this table to compare Trust & Safety payments and deductions
                against Stripe charges, Stripe payouts, NFCU/Plaid bank deposits,
                refunds, fees, and reconciliation references.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-[#fbfefd] px-4 py-3 text-sm font-black text-slate-700">
              {reconciliation.items.length.toLocaleString()} rows shown
            </div>
          </div>

          <div className="mt-6">
            <ReconciliationTable items={reconciliation.items} />
          </div>
        </section>

        <section className="rounded-[2rem] border border-sky-100 bg-sky-50 p-5 shadow-sm sm:p-6 lg:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
            Reconciliation Notes
          </p>
          <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
            Trust & Safety events should reconcile to Stripe checkout sessions,
            payment intents, charges, refunds, and Stripe payouts. Stripe payouts
            should then reconcile to NFCU/Plaid bank deposits. Book & Bark
            booking deduction recoveries should reconcile to completed booking
            payout adjustments and the remaining deduction balance.
          </p>
        </section>
      </div>
    </div>
  );
}