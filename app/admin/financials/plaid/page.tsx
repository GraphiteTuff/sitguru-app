"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  PlaidLinkOnExit,
  PlaidLinkOnSuccess,
  usePlaidLink,
} from "react-plaid-link";

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

type ApiErrorPayload = {
  error?: string;
  details?: string;
};

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

function normalizeApiError(payload: ApiErrorPayload | null, fallback: string) {
  if (!payload) return fallback;

  if (payload.details) {
    return `${payload.error || fallback}: ${payload.details}`;
  }

  return payload.error || fallback;
}

export default function AdminPlaidFinancialsPage() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [loadingToken, setLoadingToken] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tokenStatus, setTokenStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");

  async function loadAccounts() {
    setLoadingAccounts(true);

    try {
      const response = await fetch("/api/plaid/accounts", {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => null)) as
        | ApiErrorPayload
        | { accounts?: PlaidAccount[] }
        | null;

      if (!response.ok) {
        setError(
          normalizeApiError(
            payload as ApiErrorPayload | null,
            "Unable to load connected accounts.",
          ),
        );
        setLoadingAccounts(false);
        return;
      }

      setAccounts(
        Array.isArray((payload as { accounts?: PlaidAccount[] })?.accounts)
          ? ((payload as { accounts?: PlaidAccount[] }).accounts as PlaidAccount[])
          : [],
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load connected accounts.",
      );
    } finally {
      setLoadingAccounts(false);
    }
  }

  async function createLinkToken() {
    setLoadingToken(true);
    setTokenStatus("loading");
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/plaid/create-link-token", {
        method: "POST",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => null)) as
        | ApiErrorPayload
        | { link_token?: string }
        | null;

      if (!response.ok) {
        setLinkToken(null);
        setTokenStatus("error");
        setError(
          normalizeApiError(
            payload as ApiErrorPayload | null,
            "Unable to create Plaid Link token.",
          ),
        );
        setLoadingToken(false);
        return;
      }

      const token = (payload as { link_token?: string } | null)?.link_token;

      if (!token) {
        setLinkToken(null);
        setTokenStatus("error");
        setError("Plaid Link token response did not include a link_token.");
        setLoadingToken(false);
        return;
      }

      setLinkToken(token);
      setTokenStatus("ready");
    } catch (tokenError) {
      setLinkToken(null);
      setTokenStatus("error");
      setError(
        tokenError instanceof Error
          ? tokenError.message
          : "Unable to create Plaid Link token.",
      );
    } finally {
      setLoadingToken(false);
    }
  }

  useEffect(() => {
    void createLinkToken();
    void loadAccounts();
  }, []);

  const onSuccess = useCallback<PlaidLinkOnSuccess>(
    async (publicToken, metadata) => {
      setBusy(true);
      setError("");
      setMessage("");

      try {
        const response = await fetch("/api/plaid/exchange-public-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            public_token: publicToken,
            metadata,
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | ApiErrorPayload
          | null;

        if (!response.ok) {
          setError(
            normalizeApiError(payload, "Unable to connect bank account."),
          );
          setBusy(false);
          return;
        }

        setMessage("Bank account connected successfully.");
        await loadAccounts();
        await createLinkToken();
      } catch (exchangeError) {
        setError(
          exchangeError instanceof Error
            ? exchangeError.message
            : "Unable to connect bank account.",
        );
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const onExit = useCallback<PlaidLinkOnExit>((exitError) => {
    if (exitError) {
      setError(
        exitError.display_message ||
          exitError.error_message ||
          "Plaid Link was closed.",
      );
    }
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit,
  });

  const canOpenPlaid = Boolean(ready && linkToken && !loadingToken && !busy);

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
              Connect and manage admin financial accounts through Plaid Link.
              Use Sandbox for testing before switching to production.
            </p>
          </div>

          <button
            type="button"
            disabled={!canOpenPlaid}
            onClick={() => open()}
            className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingToken
              ? "Preparing Plaid..."
              : busy
                ? "Connecting..."
                : "Connect Bank Account"}
          </button>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
            {message}
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
            <p className="mt-2 text-4xl font-black text-slate-950">Sandbox</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Product
            </p>
            <p className="mt-2 text-4xl font-black text-slate-950">Auth</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Link Token
            </p>
            <p
              className={`mt-2 text-4xl font-black ${
                tokenStatus === "ready"
                  ? "text-emerald-700"
                  : tokenStatus === "error"
                    ? "text-red-600"
                    : "text-slate-950"
              }`}
            >
              {tokenStatus === "ready"
                ? "Ready"
                : tokenStatus === "error"
                  ? "Error"
                  : "Loading"}
            </p>
          </div>
        </section>

        {tokenStatus === "error" ? (
          <section className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
              Plaid Setup Check
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              The page is wired, but Plaid cannot create a Link token yet.
            </h2>

            <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
              Confirm your root <code>.env.local</code> has the Sandbox Plaid
              credentials, then restart the dev server.
            </p>

            <pre className="mt-4 overflow-x-auto rounded-2xl border border-amber-200 bg-white p-4 text-xs font-bold text-slate-800">
{`PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_sandbox_secret
PLAID_ENV=sandbox
PLAID_PRODUCTS=auth
PLAID_COUNTRY_CODES=US`}
            </pre>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={createLinkToken}
                className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-800"
              >
                Retry Link Token
              </button>

              <Link
                href="/admin/financials"
                className="inline-flex items-center justify-center rounded-full border border-amber-200 bg-white px-5 py-2.5 text-sm font-black text-amber-800 transition hover:bg-amber-100"
              >
                Back to Financials
              </Link>
            </div>
          </section>
        ) : null}

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

            <button
              type="button"
              onClick={loadAccounts}
              disabled={loadingAccounts}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingAccounts ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {loadingAccounts ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm font-bold text-slate-500">
              Loading connected accounts...
            </div>
          ) : accounts.length ? (
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
                Click “Connect Bank Account” to open Plaid Link and connect a
                sandbox bank account for testing.
              </p>

              <div className="mx-auto mt-5 max-w-md rounded-2xl border border-slate-200 bg-white p-4 text-left">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Sandbox Credentials
                </p>

                <p className="mt-2 text-sm font-bold text-slate-700">
                  Username: <span className="font-black">user_good</span>
                </p>

                <p className="mt-1 text-sm font-bold text-slate-700">
                  Password: <span className="font-black">pass_good</span>
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}