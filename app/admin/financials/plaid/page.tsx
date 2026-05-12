import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type PlaidAccount = {
  id: string;
  account_id: string;
  institution_name?: string | null;
  name?: string | null;
  official_name?: string | null;
  mask?: string | null;
  type?: string | null;
  subtype?: string | null;
  verification_status?: string | null;
  current_balance?: number | null;
  available_balance?: number | null;
  iso_currency_code?: string | null;
  created_at?: string | null;
};

type AdminPlaidFinancialsPageProps = {
  searchParams?: Promise<{
    error?: string;
    status?: string;
  }>;
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

async function getConnectedAccounts() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("admin_plaid_accounts")
    .select(
      "id, account_id, institution_name, name, official_name, mask, type, subtype, verification_status, current_balance, available_balance, iso_currency_code, created_at",
    )
    .eq("admin_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Plaid accounts load error:", error);
    return [];
  }

  return (data || []) as PlaidAccount[];
}

export default async function AdminPlaidFinancialsPage({
  searchParams,
}: AdminPlaidFinancialsPageProps) {
  const params = await searchParams;
  const errorMessage = getMessageText(params?.error);
  const statusMessage = getMessageText(params?.status);
  const accounts = await getConnectedAccounts();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin/financials"
              className="text-sm font-black text-emerald-700 hover:text-emerald-800"
            >
              ← Back to Financials
            </Link>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
              Plaid Bank Connections
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              Connect and manage SitGuru admin financial accounts through Plaid
              Link. Development mode is being used to connect and verify real
              bank accounts before switching fully to Production.
            </p>
          </div>

          <Link
            href="/api/plaid/start"
            className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-800"
          >
            Open Plaid Secure Link
          </Link>
        </div>

        <section className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
            Plaid Server Launch Active
          </p>

          <p className="mt-2 text-sm font-bold leading-6 text-amber-950">
            This page now uses a normal server link to start Plaid. It does not
            depend on the stuck React button handler.
          </p>

          <div className="mt-4 grid gap-3 text-xs font-bold text-slate-700 md:grid-cols-3">
            <div className="rounded-2xl border border-amber-200 bg-white p-3">
              <p className="text-slate-500">Plaid Mode</p>
              <p className="mt-1 text-slate-950">Development</p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-white p-3">
              <p className="text-slate-500">Current Product</p>
              <p className="mt-1 text-slate-950">Transactions</p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-white p-3">
              <p className="text-slate-500">Auth Status</p>
              <p className="mt-1 text-slate-950">Requested / Pending</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/api/plaid/create-link-token"
              className="inline-flex items-center justify-center rounded-full border border-amber-200 bg-white px-5 py-2.5 text-sm font-black text-amber-800 transition hover:bg-amber-100"
            >
              Test Link Token JSON
            </Link>

            <Link
              href="/admin/financials/plaid"
              className="inline-flex items-center justify-center rounded-full border border-amber-200 bg-white px-5 py-2.5 text-sm font-black text-amber-800 transition hover:bg-amber-100"
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
              Plaid Mode
            </p>
            <p className="mt-2 text-4xl font-black text-slate-950">
              Development
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Product
            </p>
            <p className="mt-2 text-4xl font-black text-slate-950">
              Transactions
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Auth
            </p>
            <p className="mt-2 text-4xl font-black text-amber-700">Pending</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-slate-500">
                Accounts
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Connected bank accounts
              </h2>
            </div>

            <Link
              href="/admin/financials/plaid"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
            >
              Refresh
            </Link>
          </div>

          {accounts.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wide text-slate-500">
                    <th className="pb-3">Account</th>
                    <th className="pb-3">Mask</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Available</th>
                    <th className="pb-3">Current</th>
                    <th className="pb-3">Connected</th>
                  </tr>
                </thead>

                <tbody>
                  {accounts.map((account) => (
                    <tr
                      key={account.account_id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-4 pr-4">
                        <p className="font-black text-slate-950">
                          {account.name || "Bank Account"}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {account.official_name || "Plaid-linked account"}
                        </p>

                        {account.institution_name ? (
                          <p className="mt-1 text-xs font-semibold text-emerald-700">
                            {account.institution_name}
                          </p>
                        ) : null}
                      </td>

                      <td className="py-4 pr-4 font-bold text-slate-600">
                        {account.mask ? `•••• ${account.mask}` : "—"}
                      </td>

                      <td className="py-4 pr-4 font-bold text-slate-600">
                        {[account.type, account.subtype]
                          .filter(Boolean)
                          .join(" / ") || "—"}
                      </td>

                      <td className="py-4 pr-4 font-bold text-slate-600">
                        {money(
                          account.available_balance,
                          account.iso_currency_code || "USD",
                        )}
                      </td>

                      <td className="py-4 pr-4 font-bold text-slate-600">
                        {money(
                          account.current_balance,
                          account.iso_currency_code || "USD",
                        )}
                      </td>

                      <td className="py-4 font-bold text-slate-600">
                        {formatDate(account.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-lg font-black text-slate-950">
                No Plaid accounts connected yet.
              </p>

              <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-6 text-slate-600">
                Click “Open Plaid Secure Link” to create a Plaid Link token and
                connect a real bank account in Plaid Development.
              </p>

              <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-slate-200 bg-white p-4 text-left">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Development Testing Reminder
                </p>

                <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                  Use the ngrok URL when testing:{" "}
                  <span className="font-black text-slate-950">
                    https://twentieth-turban-silver.ngrok-free.dev
                  </span>
                </p>

                <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                  Plaid connects and verifies the bank. Stripe handles actual
                  payments and payouts.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}