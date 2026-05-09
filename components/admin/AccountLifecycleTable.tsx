"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type LifecycleRole = "all" | "customer" | "guru" | "admin";

type AccountRecord = {
  id: string;
  email: string;
  role: string | null;
  account_status: string | null;
  guru_status: string | null;
  deactivated_at: string | null;
  suspended_at: string | null;
  suspension_reason: string | null;
  deletion_requested_at: string | null;
  deletion_reason: string | null;
  deletion_feedback: string | null;
  deleted_at: string | null;
  guru_cancelled_at: string | null;
  guru_cancellation_reason: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  auth_user_exists: boolean;
  latest_event?: {
    event_type: string;
    reason: string | null;
    feedback: string | null;
    performed_by_email: string | null;
    created_at: string;
  } | null;
};

type AccountLifecycleTableProps = {
  title?: string;
  description?: string;
  defaultRole?: LifecycleRole;
  lockedRole?: LifecycleRole;
};

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Deactivated", value: "deactivated" },
  { label: "Suspended", value: "suspended" },
  { label: "Deleted", value: "deleted" },
];

const roleOptions = [
  { label: "All", value: "all" },
  { label: "Customers", value: "customer" },
  { label: "Gurus", value: "guru" },
  { label: "Admins", value: "admin" },
];

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusBadgeClass(status?: string | null) {
  if (status === "active") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (status === "deactivated") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  if (status === "suspended") {
    return "bg-orange-50 text-orange-700 border-orange-200";
  }

  if (status === "deleted") {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }

  return "bg-slate-50 text-slate-600 border-slate-200";
}

export default function AccountLifecycleTable({
  title = "Account lifecycle",
  description = "Track active, deactivated, suspended, deleted, paused, and cancelled accounts across SitGuru.",
  defaultRole = "all",
  lockedRole,
}: AccountLifecycleTableProps) {
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState<LifecycleRole>(lockedRole || defaultRole);
  const [query, setQuery] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<AccountRecord | null>(
    null,
  );
  const [adminReason, setAdminReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState("");

  const filteredSummary = useMemo(() => {
    const total = accounts.length;
    const active = accounts.filter(
      (account) => account.account_status === "active",
    ).length;
    const deleted = accounts.filter(
      (account) => account.account_status === "deleted",
    ).length;
    const suspended = accounts.filter(
      (account) => account.account_status === "suspended",
    ).length;
    const deactivated = accounts.filter(
      (account) => account.account_status === "deactivated",
    ).length;
    const cancelledGurus = accounts.filter(
      (account) => account.guru_status === "cancelled",
    ).length;

    return {
      total,
      active,
      deleted,
      suspended,
      deactivated,
      cancelledGurus,
    };
  }, [accounts]);

  async function getAccessToken() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;

    if (!session?.access_token) {
      throw new Error("Please log in as an admin.");
    }

    return session.access_token;
  }

  async function loadAccounts() {
    setIsLoading(true);
    setMessage("");

    try {
      const accessToken = await getAccessToken();

      const params = new URLSearchParams({
        status,
        role: lockedRole || role,
        query,
      });

      const response = await fetch(`/api/admin/accounts?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load accounts.");
      }

      setAccounts(result.accounts || []);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load accounts.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function updateAccountStatus(payload: {
    userId: string;
    accountStatus?: string;
    guruStatus?: string | null;
  }) {
    setIsUpdating(true);
    setMessage("");

    try {
      const accessToken = await getAccessToken();

      const response = await fetch("/api/admin/accounts/status", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...payload,
          reason: adminReason,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to update account.");
      }

      setMessage("Account status updated.");
      setAdminReason("");
      await loadAccounts();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update account.",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  useEffect(() => {
    setRole(lockedRole || defaultRole);
  }, [defaultRole, lockedRole]);

  useEffect(() => {
    void loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, role, lockedRole]);

  const showGuruCancelledCard = (lockedRole || role) !== "customer";

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Admin tracking
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
            {title}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={loadAccounts}
          className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
        >
          Refresh
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
            Total
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {filteredSummary.total}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-400">
            Active
          </p>
          <p className="mt-2 text-2xl font-black text-emerald-700">
            {filteredSummary.active}
          </p>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-rose-400">
            Deleted
          </p>
          <p className="mt-2 text-2xl font-black text-rose-700">
            {filteredSummary.deleted}
          </p>
        </div>

        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-orange-400">
            Suspended
          </p>
          <p className="mt-2 text-2xl font-black text-orange-700">
            {filteredSummary.suspended}
          </p>
        </div>

        {showGuruCancelledCard ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
              Guru cancelled
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {filteredSummary.cancelledGurus}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-amber-400">
              Deactivated
            </p>
            <p className="mt-2 text-2xl font-black text-amber-700">
              {filteredSummary.deactivated}
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="input w-full"
          placeholder="Search by email, user ID, or reason"
        />

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="input w-full"
        >
          {statusOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          value={lockedRole || role}
          onChange={(event) => setRole(event.target.value as LifecycleRole)}
          className="input w-full"
          disabled={Boolean(lockedRole)}
        >
          {roleOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={loadAccounts}
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
        >
          Search
        </button>
      </div>

      {message ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          {message}
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-black text-slate-700">
                  Account
                </th>
                <th className="px-4 py-3 text-left font-black text-slate-700">
                  Role
                </th>
                <th className="px-4 py-3 text-left font-black text-slate-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-black text-slate-700">
                  Guru status
                </th>
                <th className="px-4 py-3 text-left font-black text-slate-700">
                  Latest activity
                </th>
                <th className="px-4 py-3 text-left font-black text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center font-semibold text-slate-500"
                  >
                    Loading accounts...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center font-semibold text-slate-500"
                  >
                    No accounts found.
                  </td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <tr key={account.id}>
                    <td className="px-4 py-4 align-top">
                      <p className="font-black text-slate-950">
                        {account.email || "Deleted auth user"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {account.id}
                      </p>
                      {!account.auth_user_exists ? (
                        <p className="mt-1 text-xs font-bold text-rose-600">
                          Auth user removed
                        </p>
                      ) : null}
                    </td>

                    <td className="px-4 py-4 align-top">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
                        {account.role || "—"}
                      </span>
                    </td>

                    <td className="px-4 py-4 align-top">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black ${statusBadgeClass(
                          account.account_status,
                        )}`}
                      >
                        {account.account_status || "unknown"}
                      </span>

                      {account.deletion_reason ? (
                        <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                          Reason: {account.deletion_reason}
                        </p>
                      ) : null}

                      {account.suspension_reason ? (
                        <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                          Suspension: {account.suspension_reason}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-4 py-4 align-top">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
                        {account.guru_status || "—"}
                      </span>

                      {account.guru_cancellation_reason ? (
                        <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                          {account.guru_cancellation_reason}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-4 py-4 align-top">
                      <p className="text-xs font-semibold text-slate-600">
                        Last sign in: {formatDate(account.last_sign_in_at)}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-600">
                        Deleted: {formatDate(account.deleted_at)}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-600">
                        Suspended: {formatDate(account.suspended_at)}
                      </p>
                      {account.latest_event ? (
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          Latest: {account.latest_event.event_type}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-4 py-4 align-top">
                      <button
                        type="button"
                        onClick={() => setSelectedAccount(account)}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAccount ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  Manage account
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
                  {selectedAccount.email || selectedAccount.id}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAccount(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-bold text-slate-800">
                Admin reason
              </label>
              <textarea
                value={adminReason}
                onChange={(event) => setAdminReason(event.target.value)}
                className="input min-h-24 w-full resize-y"
                placeholder="Reason for this account status change"
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={isUpdating}
                onClick={() =>
                  updateAccountStatus({
                    userId: selectedAccount.id,
                    accountStatus: "suspended",
                  })
                }
                className="rounded-full border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-black text-orange-700 disabled:opacity-50"
              >
                Suspend account
              </button>

              <button
                type="button"
                disabled={isUpdating}
                onClick={() =>
                  updateAccountStatus({
                    userId: selectedAccount.id,
                    accountStatus: "active",
                  })
                }
                className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 disabled:opacity-50"
              >
                Reactivate account
              </button>

              {selectedAccount.role === "guru" ? (
                <>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() =>
                      updateAccountStatus({
                        userId: selectedAccount.id,
                        guruStatus: "suspended",
                      })
                    }
                    className="rounded-full border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-black text-orange-700 disabled:opacity-50"
                  >
                    Suspend Guru services
                  </button>

                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() =>
                      updateAccountStatus({
                        userId: selectedAccount.id,
                        guruStatus: "cancelled",
                      })
                    }
                    className="rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-black text-slate-700 disabled:opacity-50"
                  >
                    Cancel Guru services
                  </button>

                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() =>
                      updateAccountStatus({
                        userId: selectedAccount.id,
                        guruStatus: "active",
                      })
                    }
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 disabled:opacity-50"
                  >
                    Reactivate Guru services
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}