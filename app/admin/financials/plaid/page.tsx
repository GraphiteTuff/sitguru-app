import Link from "next/link";
import PlaidTransactionCategoryControls from "@/components/admin/PlaidTransactionCategoryControls";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type TransactionFilter =
  | "all"
  | "needs_review"
  | "auto_categorized"
  | "manual"
  | "pending"
  | "posted"
  | "transfers"
  | "income"
  | "expenses";

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
    filter?: string;
  }>;
};

type BankingData = {
  accounts: PlaidAccount[];
  items: PlaidItem[];
  transactions: PlaidTransaction[];
  totalTransactions: number;
  postedTransactions: number;
  pendingTransactions: number;
  needsReviewTransactions: number;
  autoCategorizedTransactions: number;
  manualCategorizedTransactions: number;
  transferTransactions: number;
  incomeTransactions: number;
  expenseTransactions: number;
  lastSyncedAt: string | null;
  plaidEnvironment: string;
};

const transactionFilters: Array<{
  label: string;
  value: TransactionFilter;
  description: string;
}> = [
  {
    label: "All",
    value: "all",
    description: "All business banking transactions.",
  },
  {
    label: "Needs Review",
    value: "needs_review",
    description: "Uncategorized or review-needed transactions.",
  },
  {
    label: "Auto Categorized",
    value: "auto_categorized",
    description: "Transactions categorized by SitGuru rules.",
  },
  {
    label: "Manual",
    value: "manual",
    description: "Transactions manually reviewed by admin.",
  },
  {
    label: "Pending",
    value: "pending",
    description: "Pending NFCU/Plaid transactions.",
  },
  {
    label: "Posted",
    value: "posted",
    description: "Posted NFCU/Plaid transactions.",
  },
  {
    label: "Transfers",
    value: "transfers",
    description: "Internal checking/savings transfers.",
  },
  {
    label: "Income",
    value: "income",
    description: "Bank transactions categorized as income.",
  },
  {
    label: "Expenses",
    value: "expenses",
    description: "Bank transactions categorized as expenses.",
  },
];

function getMessageText(value?: string) {
  if (!value) return "";

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeFilter(value?: string): TransactionFilter {
  const allowed = transactionFilters.map((filter) => filter.value);

  if (value && allowed.includes(value as TransactionFilter)) {
    return value as TransactionFilter;
  }

  return "all";
}

function getFilterLabel(filterValue: TransactionFilter) {
  return (
    transactionFilters.find((filter) => filter.value === filterValue)?.label ||
    "All"
  );
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
  const name =
    `${account.name || ""} ${account.official_name || ""}`.toLowerCase();
  const subtype = String(account.subtype || "").toLowerCase();

  return (
    (subtype === "checking" || subtype === "savings") &&
    name.includes("business")
  );
}

function transactionMatchesFilter(
  transaction: PlaidTransaction,
  filter: TransactionFilter,
) {
  const categoryType = String(
    transaction.sitguru_category_type || "",
  ).toLowerCase();
  const reviewStatus = String(transaction.review_status || "").toLowerCase();

  if (filter === "all") return true;
  if (filter === "needs_review") {
    return (
      reviewStatus === "needs_review" ||
      !transaction.sitguru_category ||
      transaction.sitguru_category === "Uncategorized"
    );
  }
  if (filter === "auto_categorized") return reviewStatus === "auto_categorized";
  if (filter === "manual") return Boolean(transaction.manually_categorized);
  if (filter === "pending") return Boolean(transaction.pending);
  if (filter === "posted") return !transaction.pending;
  if (filter === "transfers") return categoryType === "transfer";
  if (filter === "income") return categoryType === "income";
  if (filter === "expenses") return categoryType === "expense";

  return true;
}

function getTransactionTone(transaction: PlaidTransaction) {
  const categoryType = String(
    transaction.sitguru_category_type || "",
  ).toLowerCase();

  if (categoryType === "income") {
    return "text-emerald-700";
  }

  if (categoryType === "transfer") {
    return "text-blue-700";
  }

  if (categoryType === "expense") {
    return "text-slate-950";
  }

  return "text-slate-950";
}

function getAmountDisplay(transaction: PlaidTransaction) {
  const amount = Number(transaction.amount || 0);
  const categoryType = String(
    transaction.sitguru_category_type || "",
  ).toLowerCase();

  /*
    Plaid uses positive amounts for money leaving an account and negative amounts
    for money entering an account. For admin readability, income is displayed as
    positive cash-in and expenses stay positive cash-out.
  */
  if (categoryType === "income" && amount < 0) {
    return `+${money(Math.abs(amount), transaction.iso_currency_code || "USD")}`;
  }

  if (categoryType === "transfer") {
    return money(Math.abs(amount), transaction.iso_currency_code || "USD");
  }

  return money(amount, transaction.iso_currency_code || "USD");
}

function categoryBadgeClasses(transaction: PlaidTransaction) {
  const reviewStatus = String(transaction.review_status || "").toLowerCase();

  if (transaction.manually_categorized) {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  if (reviewStatus === "auto_categorized") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (reviewStatus === "needs_review") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
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

async function getBankingData(
  selectedFilter: TransactionFilter,
): Promise<BankingData> {
  const userId = await getCurrentAdminUserId();

  if (!userId) {
    return {
      accounts: [],
      items: [],
      transactions: [],
      totalTransactions: 0,
      postedTransactions: 0,
      pendingTransactions: 0,
      needsReviewTransactions: 0,
      autoCategorizedTransactions: 0,
      manualCategorizedTransactions: 0,
      transferTransactions: 0,
      incomeTransactions: 0,
      expenseTransactions: 0,
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

  let allTransactions: PlaidTransaction[] = [];

  if (accountIds.length) {
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
        .limit(150);

    if (transactionError) {
      console.error("Plaid transactions load error:", transactionError);
    }

    allTransactions = (transactionRows || []) as PlaidTransaction[];
  }

  const totalTransactions = allTransactions.length;
  const postedTransactions = allTransactions.filter(
    (transaction) => !transaction.pending,
  ).length;
  const pendingTransactions = allTransactions.filter(
    (transaction) => transaction.pending,
  ).length;
  const needsReviewTransactions = allTransactions.filter((transaction) =>
    transactionMatchesFilter(transaction, "needs_review"),
  ).length;
  const autoCategorizedTransactions = allTransactions.filter((transaction) =>
    transactionMatchesFilter(transaction, "auto_categorized"),
  ).length;
  const manualCategorizedTransactions = allTransactions.filter((transaction) =>
    transactionMatchesFilter(transaction, "manual"),
  ).length;
  const transferTransactions = allTransactions.filter((transaction) =>
    transactionMatchesFilter(transaction, "transfers"),
  ).length;
  const incomeTransactions = allTransactions.filter((transaction) =>
    transactionMatchesFilter(transaction, "income"),
  ).length;
  const expenseTransactions = allTransactions.filter((transaction) =>
    transactionMatchesFilter(transaction, "expenses"),
  ).length;

  const transactions = allTransactions
    .filter((transaction) => transactionMatchesFilter(transaction, selectedFilter))
    .slice(0, 30);

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
    postedTransactions,
    pendingTransactions,
    needsReviewTransactions,
    autoCategorizedTransactions,
    manualCategorizedTransactions,
    transferTransactions,
    incomeTransactions,
    expenseTransactions,
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
  const selectedFilter = normalizeFilter(params?.filter);

  const {
    accounts,
    items,
    transactions,
    totalTransactions,
    postedTransactions,
    pendingTransactions,
    needsReviewTransactions,
    autoCategorizedTransactions,
    manualCategorizedTransactions,
    transferTransactions,
    incomeTransactions,
    expenseTransactions,
    lastSyncedAt,
    plaidEnvironment,
  } = await getBankingData(selectedFilter);

  const checkingAccount = accounts.find(
    (account) => account.subtype === "checking",
  );
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

  const metricCards = [
    {
      label: "Connected Accounts",
      value: accounts.length.toLocaleString(),
      helper: "Business checking + savings only",
    },
    {
      label: "Total Transactions",
      value: totalTransactions.toLocaleString(),
      helper: `${postedTransactions} posted · ${pendingTransactions} pending`,
    },
    {
      label: "Needs Review",
      value: needsReviewTransactions.toLocaleString(),
      helper: "Uncategorized or review queue",
    },
    {
      label: "Auto Categorized",
      value: autoCategorizedTransactions.toLocaleString(),
      helper: `${manualCategorizedTransactions} manually categorized`,
    },
    {
      label: "Current Balance",
      value: money(totalCurrentBalance),
      helper: "NFCU current cash balance",
    },
    {
      label: "Available Balance",
      value: money(totalAvailableBalance),
      helper: "Cash available for operations",
    },
  ];

  const filterCounts: Record<TransactionFilter, number> = {
    all: totalTransactions,
    needs_review: needsReviewTransactions,
    auto_categorized: autoCategorizedTransactions,
    manual: manualCategorizedTransactions,
    pending: pendingTransactions,
    posted: postedTransactions,
    transfers: transferTransactions,
    income: incomeTransactions,
    expenses: expenseTransactions,
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1680px]">
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

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
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

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {metricCards.map((card) => (
            <div
              key={card.label}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {card.value}
              </p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                {card.helper}
              </p>
            </div>
          ))}
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

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-slate-500">
                Recent Activity
              </p>

              <h2 className="mt-2 text-3xl font-black text-slate-950">
                Categorized business transactions
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                Auto-categories feed SitGuru financial reports. Manual category
                changes are saved and will not be overwritten by future Plaid
                syncs. Transfers should stay marked as transfers so they do not
                inflate revenue or operating expense reporting.
              </p>
            </div>

            <Link
              href="/api/plaid/sync-transactions"
              className="inline-flex w-fit items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
            >
              Sync Now
            </Link>
          </div>

          <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap gap-2">
              {transactionFilters.map((filter) => {
                const isActive = selectedFilter === filter.value;

                return (
                  <Link
                    key={filter.value}
                    href={
                      filter.value === "all"
                        ? "/admin/financials/plaid"
                        : `/admin/financials/plaid?filter=${filter.value}`
                    }
                    title={filter.description}
                    className={`rounded-full border px-4 py-2 text-xs font-black transition ${
                      isActive
                        ? "border-emerald-700 bg-emerald-700 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                    }`}
                  >
                    {filter.label}
                    <span className="ml-2 opacity-75">
                      {filterCounts[filter.value].toLocaleString()}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {transactions.length ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[1480px] text-left text-sm">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Category Controls</th>
                    <th className="px-4 py-3">Merchant</th>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3">Bank Status</th>
                    <th className="px-4 py-3">Review</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>

                <tbody className="bg-white">
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.transaction_id}
                      className="border-b border-slate-100 align-top last:border-0"
                    >
                      <td className="px-4 py-5 font-bold text-slate-600">
                        {formatDate(transaction.date)}
                      </td>

                      <td className="w-[340px] max-w-[340px] px-4 py-5">
                        <p className="font-black leading-5 text-slate-950">
                          {transaction.name || "Transaction"}
                        </p>

                        {transaction.sitguru_category ? (
                          <p className="mt-2 text-xs font-black text-emerald-700">
                            Current: {transaction.sitguru_category}
                          </p>
                        ) : (
                          <p className="mt-2 text-xs font-black text-amber-700">
                            Current: Uncategorized
                          </p>
                        )}

                        {transaction.is_excluded_from_reports ? (
                          <p className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">
                            Excluded from reports
                          </p>
                        ) : null}
                      </td>

                      <td className="w-[420px] px-4 py-5">
                        <div className="max-w-[390px]">
                          <PlaidTransactionCategoryControls
                            transactionId={transaction.transaction_id}
                            currentCategory={transaction.sitguru_category}
                            currentCategoryType={
                              transaction.sitguru_category_type
                            }
                            currentReportSection={
                              transaction.sitguru_report_section
                            }
                            currentNotes={transaction.sitguru_notes}
                            isExcludedFromReports={
                              transaction.is_excluded_from_reports
                            }
                            reviewStatus={transaction.review_status}
                            manuallyCategorized={
                              transaction.manually_categorized
                            }
                          />
                        </div>
                      </td>

                      <td className="px-4 py-5 font-bold text-slate-600">
                        {transaction.merchant_name || "—"}
                      </td>

                      <td className="px-4 py-5 font-bold capitalize text-slate-600">
                        {transaction.payment_channel || "—"}
                      </td>

                      <td className="px-4 py-5">
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

                      <td className="px-4 py-5">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${categoryBadgeClasses(
                            transaction,
                          )}`}
                        >
                          {transaction.manually_categorized
                            ? "Manual"
                            : titleCase(transaction.review_status || "Needs Review")}
                        </span>
                      </td>

                      <td
                        className={`px-4 py-5 text-right font-black ${getTransactionTone(
                          transaction,
                        )}`}
                      >
                        {getAmountDisplay(transaction)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-lg font-black text-slate-950">
                No transactions displayed for {getFilterLabel(selectedFilter)}.
              </p>

              <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-6 text-slate-600">
                Try another filter, click “Authorize Transactions” if Plaid says
                additional consent is required, or click “Sync Transactions” to
                pull the latest NFCU Business Checking and Business Savings
                activity into SitGuru.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}