import Link from "next/link";
import PlaidTransactionCategoryControls from "@/components/admin/PlaidTransactionCategoryControls";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type PlaidAccount = {
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
  plaid_environment?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type PlaidItem = {
  item_id: string;
  institution_name?: string | null;
  plaid_environment?: string | null;
  transactions_last_synced_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type PlaidTransaction = {
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
  created_at?: string | null;
  sitguru_category?: string | null;
  sitguru_category_type?: string | null;
  sitguru_report_section?: string | null;
  sitguru_notes?: string | null;
  review_status?: string | null;
  is_excluded_from_reports?: boolean | null;
  manually_categorized?: boolean | null;
};

type AdminPlaidFinancialsPageProps = {
  searchParams?: Promise<{
    error?: string;
    status?: string;
  }>;
};

type BankingData = {
  accounts: PlaidAccount[];
  items: PlaidItem[];
  transactions: PlaidTransaction[];
  totalTransactions: number;
  lastSyncedAt: string | null;
  plaidEnvironment: string;
};

function getMessageText(value?: string) {
  if (!value) return "";

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function money(value?: number | null, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(Number(value)) ? Number(value) : 0);
}

function titleCase(value?: string | null) {
  if (!value) return "Unknown";

  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
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

function formatDateTime(value?: string | null) {
  if (!value) return "Not synced yet";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not synced yet";

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isBusinessCheckingOrSavings(account: PlaidAccount) {
  const name = `${account.name || ""} ${account.official_name || ""}`.toLowerCase();
  const subtype = String(account.subtype || "").toLowerCase();

  return (subtype === "checking" || subtype === "savings") && name.includes("business");
}

async function getCurrentAdminUserId() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return null;
  }

  return user.id;
}

async function getBankingData(): Promise<BankingData> {
  const userId = await getCurrentAdminUserId();

  if (!userId) {
    return {
      accounts: [],
      items: [],
      transactions: [],
      totalTransactions: 0,
      lastSyncedAt: null,
      plaidEnvironment: process.env.PLAID_ENV || "unknown",
    };
  }

  const currentEnvironment = process.env.PLAID_ENV || "production";

  const { data: accountRows, error: accountError } = await supabaseAdmin
    .from("admin_plaid_accounts")
    .select(
      "id, account_id, item_id, name, official_name, mask, type, subtype, current_balance, available_balance, iso_currency_code, plaid_environment, created_at, updated_at",
    )
    .eq("user_id", userId)
    .eq("plaid_environment", currentEnvironment)
    .order("created_at", { ascending: false });

  if (accountError) {
    console.error("Plaid accounts load error:", accountError);
  }

  const accounts = ((accountRows || []) as PlaidAccount[]).filter(
    isBusinessCheckingOrSavings,
  );

  const itemIds = Array.from(
    new Set(accounts.map((account) => account.item_id).filter(Boolean)),
  );

  let items: PlaidItem[] = [];

  if (itemIds.length) {
    const { data: itemRows, error: itemError } = await supabaseAdmin
      .from("admin_plaid_items")
      .select(
        "item_id, institution_name, plaid_environment, transactions_last_synced_at, created_at, updated_at",
      )
      .eq("user_id", userId)
      .eq("plaid_environment", currentEnvironment)
      .in("item_id", itemIds)
      .order("created_at", { ascending: false });

    if (itemError) {
      console.error("Plaid items load error:", itemError);
    }

    items = (itemRows || []) as PlaidItem[];
  }

  const accountIds = accounts.map((account) => account.account_id);

  let totalTransactions = 0;
  let transactions: PlaidTransaction[] = [];

  if (accountIds.length) {
    const { count, error: countError } = await supabaseAdmin
      .from("admin_plaid_transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("account_id", accountIds)
      .is("removed_at", null);

    if (countError) {
      console.error("Plaid transaction count error:", countError);
    }

    totalTransactions = count || 0;

    const { data: transactionRows, error: transactionError } =
      await supabaseAdmin
        .from("admin_plaid_transactions")
        .select(
          "id, transaction_id, item_id, account_id, name, merchant_name, amount, iso_currency_code, date, pending, payment_channel, created_at, sitguru_category, sitguru_category_type, sitguru_report_section, sitguru_notes, review_status, is_excluded_from_reports, manually_categorized",
        )
        .eq("user_id", userId)
        .in("account_id", accountIds)
        .is("removed_at", null)
        .order("date", { ascending: false })
        .limit(12);

    if (transactionError) {
      console.error("Plaid transactions load error:", transactionError);
    }

    transactions = (transactionRows || []) as PlaidTransaction[];
  }

  const lastSyncedAt =
    items
      .map((item) => item.transactions_last_synced_at)
      .filter(Boolean)
      .sort()
      .reverse()[0] || null;

  const plaidEnvironment =
    items.find((item) => item.plaid_environment)?.plaid_environment ||
    accounts.find((account) => account.plaid_environment)?.plaid_environment ||
    currentEnvironment ||
    "unknown";

  return {
    accounts,
    items,
    transactions,
    totalTransactions,
    lastSyncedAt,
    plaidEnvironment,
  };
}

export default async function AdminPlaidFinancialsPage({
  searchParams,
}: AdminPlaidFinancialsPageProps) {
  const params = await searchParams;
  const errorMessage = getMessageText(params?.error);
  const statusMessage = getMessageText(params?.status);

  const {
    accounts,
    items,
    transactions,
    totalTransactions,
    lastSyncedAt,
    plaidEnvironment,
  } = await getBankingData();

  const checkingAccount = accounts.find((account) => account.subtype === "checking");
  const savingsAccount = accounts.find((account) => account.subtype === "savings");

  const totalCurrentBalance = accounts.reduce(
    (total, account) => total + Number(account.current_balance || 0),
    0,
  );

  const totalAvailableBalance = accounts.reduce(
    (total, account) => total + Number(account.available_balance || 0),
    0,
  );

  const hasProductionConnection = plaidEnvironment === "production";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <Link
              href="/admin/financials"
              className="text-sm font-black text-emerald-700 hover:text-emerald-800"
            >
              ← Back to Financials
            </Link>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 xl:text-5xl">
              Plaid Bank Connections
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              Connect, sync, categorize, and review NFCU Business Checking and
              Business Savings activity. Category choices feed SitGuru financial
              reports.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/api/plaid/sync-transactions"
              className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-800"
            >
              Sync Transactions
            </Link>

            <Link
              href="/api/plaid/update-mode"
              className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
            >
              Authorize Transactions
            </Link>
          </div>
        </div>

        <section className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                NFCU Business Banking Active
              </p>

              <p className="mt-2 text-sm font-bold leading-6 text-emerald-950">
                SitGuru is connected to NFCU Business Checking and Business
                Savings. Personal and test accounts have been removed from the
                active banking view.
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${
                hasProductionConnection
                  ? "border-emerald-300 bg-white text-emerald-800"
                  : "border-amber-300 bg-amber-50 text-amber-800"
              }`}
            >
              {hasProductionConnection ? "Production Connected" : "Review Plaid Mode"}
            </span>
          </div>

          <div className="mt-4 grid gap-3 text-xs font-bold text-slate-700 md:grid-cols-4">
            <div className="rounded-2xl border border-emerald-200 bg-white p-3">
              <p className="text-slate-500">Plaid Mode</p>
              <p className="mt-1 text-slate-950">{titleCase(plaidEnvironment)}</p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white p-3">
              <p className="text-slate-500">Products</p>
              <p className="mt-1 text-slate-950">Auth + Transactions</p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white p-3">
              <p className="text-slate-500">Linked Items</p>
              <p className="mt-1 text-slate-950">{items.length}</p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white p-3">
              <p className="text-slate-500">Last Sync</p>
              <p className="mt-1 text-slate-950">{formatDateTime(lastSyncedAt)}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/api/plaid/link-token"
              className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-5 py-2.5 text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
            >
              Test Link Token JSON
            </Link>

            <Link
              href="/admin/financials/plaid"
              className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-5 py-2.5 text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
            >
              Refresh Page
            </Link>
          </div>
        </section>

        {errorMessage ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {statusMessage ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
            {statusMessage}
          </div>
        ) : null}

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Connected Accounts
            </p>
            <p className="mt-2 text-4xl font-black text-slate-950">
              {accounts.length}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Total Transactions
            </p>
            <p className="mt-2 text-4xl font-black text-slate-950">
              {totalTransactions}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Current Balance
            </p>
            <p className="mt-2 text-4xl font-black text-slate-950">
              {money(totalCurrentBalance)}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Available Balance
            </p>
            <p className="mt-2 text-4xl font-black text-slate-950">
              {money(totalAvailableBalance)}
            </p>
          </div>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Business Checking
            </p>

            {checkingAccount ? (
              <>
                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  {checkingAccount.name || "Business Checking"}
                </h2>

                <p className="mt-1 text-sm font-bold text-slate-500">
                  Mask:{" "}
                  {checkingAccount.mask ? `•••• ${checkingAccount.mask}` : "—"}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Current
                    </p>
                    <p className="mt-1 text-2xl font-black text-slate-950">
                      {money(
                        checkingAccount.current_balance,
                        checkingAccount.iso_currency_code || "USD",
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Available
                    </p>
                    <p className="mt-1 text-2xl font-black text-slate-950">
                      {money(
                        checkingAccount.available_balance,
                        checkingAccount.iso_currency_code || "USD",
                      )}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm font-bold text-slate-500">
                No Business Checking account is currently saved.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Business Savings
            </p>

            {savingsAccount ? (
              <>
                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  {savingsAccount.name || "Business Savings"}
                </h2>

                <p className="mt-1 text-sm font-bold text-slate-500">
                  Mask:{" "}
                  {savingsAccount.mask ? `•••• ${savingsAccount.mask}` : "—"}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Current
                    </p>
                    <p className="mt-1 text-2xl font-black text-slate-950">
                      {money(
                        savingsAccount.current_balance,
                        savingsAccount.iso_currency_code || "USD",
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Available
                    </p>
                    <p className="mt-1 text-2xl font-black text-slate-950">
                      {money(
                        savingsAccount.available_balance,
                        savingsAccount.iso_currency_code || "USD",
                      )}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm font-bold text-slate-500">
                No Business Savings account is currently saved.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-slate-500">
                Recent Activity
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Categorized business transactions
              </h2>

              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                Auto-categories feed SitGuru financial reports. Manual category
                changes are saved and will not be overwritten by future Plaid
                syncs. Bank Status shows whether NFCU/Plaid says the transaction
                is pending or posted.
              </p>
            </div>

            <Link
              href="/api/plaid/sync-transactions"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
            >
              Sync Now
            </Link>
          </div>

          {transactions.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wide text-slate-500">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Description</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Merchant</th>
                    <th className="pb-3">Channel</th>
                    <th className="pb-3">Bank Status</th>
                    <th className="pb-3 text-right">Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.transaction_id}
                      className="border-b border-slate-100 align-top last:border-0"
                    >
                      <td className="py-4 pr-4 font-bold text-slate-600">
                        {formatDate(transaction.date)}
                      </td>

                      <td className="max-w-[280px] py-4 pr-4">
                        <p className="font-black text-slate-950">
                          {transaction.name || "Transaction"}
                        </p>

                        {transaction.sitguru_category ? (
                          <p className="mt-2 text-xs font-black text-emerald-700">
                            Current: {transaction.sitguru_category}
                          </p>
                        ) : null}
                      </td>

                      <td className="py-4 pr-4">
                        <PlaidTransactionCategoryControls
                          transactionId={transaction.transaction_id}
                          currentCategory={transaction.sitguru_category}
                          currentCategoryType={transaction.sitguru_category_type}
                          currentReportSection={
                            transaction.sitguru_report_section
                          }
                          currentNotes={transaction.sitguru_notes}
                          isExcludedFromReports={
                            transaction.is_excluded_from_reports
                          }
                          reviewStatus={transaction.review_status}
                          manuallyCategorized={transaction.manually_categorized}
                        />
                      </td>

                      <td className="py-4 pr-4 font-bold text-slate-600">
                        {transaction.merchant_name || "—"}
                      </td>

                      <td className="py-4 pr-4 font-bold capitalize text-slate-600">
                        {transaction.payment_channel || "—"}
                      </td>

                      <td className="py-4 pr-4">
                        <span
                          className={
                            transaction.pending
                              ? "inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800"
                              : "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800"
                          }
                        >
                          {transaction.pending ? "Pending" : "Posted"}
                        </span>
                      </td>

                      <td className="py-4 text-right font-black text-slate-950">
                        {money(
                          transaction.amount,
                          transaction.iso_currency_code || "USD",
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-lg font-black text-slate-950">
                No transactions displayed yet.
              </p>

              <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-6 text-slate-600">
                Click “Authorize Transactions” first if Plaid says additional
                consent is required. Then click “Sync Transactions” to pull the
                latest NFCU Business Checking and Business Savings activity into
                SitGuru.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}