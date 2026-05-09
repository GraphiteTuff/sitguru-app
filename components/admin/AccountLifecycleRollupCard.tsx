"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CirclePause,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type AccountRecord = {
  id: string;
  email: string;
  role: string | null;
  account_status: string | null;
  guru_status: string | null;
};

type AccountLifecycleRollupCardProps = {
  title?: string;
  description?: string;
  href?: string;
};

function countByRole(accounts: AccountRecord[], role: string) {
  return accounts.filter((account) => account.role === role).length;
}

function countByRoleAndStatus(
  accounts: AccountRecord[],
  role: string,
  status: string,
) {
  return accounts.filter(
    (account) => account.role === role && account.account_status === status,
  ).length;
}

export default function AccountLifecycleRollupCard({
  title = "Account lifecycle",
  description = "Track account health by role, including deleted, suspended, deactivated, and cancelled Guru accounts.",
  href = "/admin/accounts",
}: AccountLifecycleRollupCardProps) {
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const totals = useMemo(() => {
    const customers = countByRole(accounts, "customer");
    const gurus = countByRole(accounts, "guru");
    const admins = countByRole(accounts, "admin");

    return {
      total: accounts.length,
      active: accounts.filter((account) => account.account_status === "active")
        .length,
      deleted: accounts.filter((account) => account.account_status === "deleted")
        .length,
      suspended: accounts.filter(
        (account) => account.account_status === "suspended",
      ).length,
      deactivated: accounts.filter(
        (account) => account.account_status === "deactivated",
      ).length,
      guruCancelled: accounts.filter(
        (account) => account.guru_status === "cancelled",
      ).length,

      roles: {
        customers,
        gurus,
        admins,
      },

      customerLifecycle: {
        active: countByRoleAndStatus(accounts, "customer", "active"),
        deleted: countByRoleAndStatus(accounts, "customer", "deleted"),
        suspended: countByRoleAndStatus(accounts, "customer", "suspended"),
        deactivated: countByRoleAndStatus(accounts, "customer", "deactivated"),
      },

      guruLifecycle: {
        active: countByRoleAndStatus(accounts, "guru", "active"),
        deleted: countByRoleAndStatus(accounts, "guru", "deleted"),
        suspended: countByRoleAndStatus(accounts, "guru", "suspended"),
        deactivated: countByRoleAndStatus(accounts, "guru", "deactivated"),
        cancelled: accounts.filter(
          (account) =>
            account.role === "guru" && account.guru_status === "cancelled",
        ).length,
      },

      adminLifecycle: {
        active: countByRoleAndStatus(accounts, "admin", "active"),
        deleted: countByRoleAndStatus(accounts, "admin", "deleted"),
        suspended: countByRoleAndStatus(accounts, "admin", "suspended"),
        deactivated: countByRoleAndStatus(accounts, "admin", "deactivated"),
      },
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

      const response = await fetch("/api/admin/accounts?status=all&role=all", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load lifecycle totals.");
      }

      setAccounts(result.accounts || []);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load lifecycle totals.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAccounts();
  }, []);

  return (
    <section className="rounded-[28px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Platform health
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
            {title}
          </h2>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            {description}
          </p>
        </div>

        <Link
          href={href}
          className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
        >
          View all
        </Link>
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {message}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck size={16} />
            <p className="text-xs font-black uppercase tracking-[0.12em]">
              Total
            </p>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {isLoading ? "—" : totals.total}
          </p>
        </div>

        <Link
          href="/admin/accounts?status=deleted"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 transition hover:bg-rose-100"
        >
          <div className="flex items-center gap-2 text-rose-500">
            <Trash2 size={16} />
            <p className="text-xs font-black uppercase tracking-[0.12em]">
              Deleted
            </p>
          </div>
          <p className="mt-2 text-2xl font-black text-rose-700">
            {isLoading ? "—" : totals.deleted}
          </p>
        </Link>

        <Link
          href="/admin/accounts?status=suspended"
          className="rounded-2xl border border-orange-200 bg-orange-50 p-4 transition hover:bg-orange-100"
        >
          <div className="flex items-center gap-2 text-orange-500">
            <Ban size={16} />
            <p className="text-xs font-black uppercase tracking-[0.12em]">
              Suspended
            </p>
          </div>
          <p className="mt-2 text-2xl font-black text-orange-700">
            {isLoading ? "—" : totals.suspended}
          </p>
        </Link>

        <Link
          href="/admin/accounts?status=deactivated"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 transition hover:bg-amber-100"
        >
          <div className="flex items-center gap-2 text-amber-500">
            <CirclePause size={16} />
            <p className="text-xs font-black uppercase tracking-[0.12em]">
              Deactivated
            </p>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-700">
            {isLoading ? "—" : totals.deactivated}
          </p>
        </Link>

        <Link
          href="/admin/gurus/account-lifecycle"
          className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100"
        >
          <div className="flex items-center gap-2 text-slate-500">
            <AlertTriangle size={16} />
            <p className="text-xs font-black uppercase tracking-[0.12em]">
              Guru cancelled
            </p>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {isLoading ? "—" : totals.guruCancelled}
          </p>
        </Link>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <Link
          href="/admin/customers/account-lifecycle"
          className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 transition hover:bg-emerald-100"
        >
          <div className="flex items-center gap-2 text-emerald-700">
            <Users size={16} />
            <p className="text-xs font-black uppercase tracking-[0.12em]">
              Customers
            </p>
          </div>

          <p className="mt-2 text-2xl font-black text-emerald-900">
            {isLoading ? "—" : totals.roles.customers}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-emerald-800">
            <p>Active: {isLoading ? "—" : totals.customerLifecycle.active}</p>
            <p>Deleted: {isLoading ? "—" : totals.customerLifecycle.deleted}</p>
            <p>
              Suspended:{" "}
              {isLoading ? "—" : totals.customerLifecycle.suspended}
            </p>
            <p>
              Deactivated:{" "}
              {isLoading ? "—" : totals.customerLifecycle.deactivated}
            </p>
          </div>
        </Link>

        <Link
          href="/admin/gurus/account-lifecycle"
          className="rounded-2xl border border-sky-100 bg-sky-50 p-4 transition hover:bg-sky-100"
        >
          <div className="flex items-center gap-2 text-sky-700">
            <Users size={16} />
            <p className="text-xs font-black uppercase tracking-[0.12em]">
              Gurus
            </p>
          </div>

          <p className="mt-2 text-2xl font-black text-sky-900">
            {isLoading ? "—" : totals.roles.gurus}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-sky-800">
            <p>Active: {isLoading ? "—" : totals.guruLifecycle.active}</p>
            <p>Deleted: {isLoading ? "—" : totals.guruLifecycle.deleted}</p>
            <p>Suspended: {isLoading ? "—" : totals.guruLifecycle.suspended}</p>
            <p>Cancelled: {isLoading ? "—" : totals.guruLifecycle.cancelled}</p>
          </div>
        </Link>

        <Link
          href="/admin/accounts?role=admin"
          className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100"
        >
          <div className="flex items-center gap-2 text-slate-600">
            <Users size={16} />
            <p className="text-xs font-black uppercase tracking-[0.12em]">
              Admins
            </p>
          </div>

          <p className="mt-2 text-2xl font-black text-slate-950">
            {isLoading ? "—" : totals.roles.admins}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-slate-700">
            <p>Active: {isLoading ? "—" : totals.adminLifecycle.active}</p>
            <p>Deleted: {isLoading ? "—" : totals.adminLifecycle.deleted}</p>
            <p>
              Suspended: {isLoading ? "—" : totals.adminLifecycle.suspended}
            </p>
            <p>
              Deactivated:{" "}
              {isLoading ? "—" : totals.adminLifecycle.deactivated}
            </p>
          </div>
        </Link>
      </div>
    </section>
  );
}