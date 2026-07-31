// components/admin/ambassadors/AmbassadorPerformanceDashboard.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Landmark,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";
import type {
  AmbassadorNetworkKpis,
  AmbassadorPerformanceRow,
} from "@/lib/ambassador/ledger-types";

type SortKey =
  | "displayName"
  | "clicks"
  | "conversionRate"
  | "earningsPool"
  | "referrals";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function AmbassadorPerformanceDashboard() {
  const [kpis, setKpis] = useState<AmbassadorNetworkKpis | null>(null);
  const [rows, setRows] = useState<AmbassadorPerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("earningsPool");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/ambassadors/ledger");
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        kpis?: AmbassadorNetworkKpis;
        rows?: AmbassadorPerformanceRow[];
      };
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to load ledger.");
      }
      setKpis(json.kpis || null);
      setRows(json.rows || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc"
          ? av.localeCompare(bv)
          : bv.localeCompare(av);
      }
      return sortDir === "asc"
        ? Number(av) - Number(bv)
        : Number(bv) - Number(av);
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("desc");
  }

  async function runAction(
    ambassadorId: string,
    action: "approve_commissions" | "mark_batch_paid",
  ) {
    setBusyId(ambassadorId);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/ambassadors/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ambassadorId, action }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        updated?: number;
      };
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Action failed");
      }
      setMessage(
        action === "approve_commissions"
          ? `Approved ${json.updated || 0} commission row(s).`
          : `Marked ${json.updated || 0} row(s) paid via Stripe Connect batch.`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="space-y-6 text-slate-950">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
            Brand Ambassador · Performance ledger
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">
            Network control panel
          </h1>
          <p className="mt-1 max-w-2xl text-sm font-semibold text-slate-600">
            Audit referral traffic, conversions, and payout states for local
            marketing representatives.
          </p>
        </div>
        <Link
          href="/admin/ambassadors/roster"
          className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-900 shadow-sm hover:bg-emerald-50"
        >
          Full roster CRM
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Active Local Reps"
          value={String(kpis?.activeLocalReps ?? "—")}
          icon={<Users className="h-4 w-4" />}
        />
        <KpiCard
          label="Total Referrals Today"
          value={String(kpis?.totalReferralsToday ?? "—")}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <KpiCard
          label="Pending Payout Pool"
          value={kpis ? money(kpis.pendingPayoutPool) : "—"}
          icon={<Landmark className="h-4 w-4" />}
        />
        <KpiCard
          label="Top Performing Region"
          value={kpis?.topPerformingRegion || "—"}
          icon={<MapPin className="h-4 w-4" />}
        />
      </section>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
          {message}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-black uppercase tracking-[0.12em] text-slate-500">
            Main performance grid
          </h2>
          <button
            type="button"
            onClick={() => void load()}
            className="text-xs font-bold text-emerald-800 hover:underline"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-emerald-950 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-50">
                <tr>
                  <Th onClick={() => toggleSort("displayName")}>Rep Name</Th>
                  <th className="px-3 py-3">Custom Code Link</th>
                  <Th onClick={() => toggleSort("clicks")}>Traffic Clicks</Th>
                  <Th onClick={() => toggleSort("conversionRate")}>
                    Conversion %
                  </Th>
                  <Th onClick={() => toggleSort("earningsPool")}>
                    Earnings Pool
                  </Th>
                  <th className="px-3 py-3">Batch Action</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm font-semibold text-slate-500"
                    >
                      No ambassador ledger profiles yet. Apply the migration and
                      seed from the ambassadors table.
                    </td>
                  </tr>
                ) : (
                  sorted.map((row) => (
                    <tr
                      key={row.profileId}
                      className="border-t border-slate-100 hover:bg-emerald-50/40"
                    >
                      <td className="px-3 py-3">
                        <p className="font-black text-slate-950">
                          {row.displayName}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                          {row.region}
                          {!row.isActive ? " · inactive" : ""}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-black text-emerald-800">
                          {row.referralCode}
                        </p>
                        <a
                          href={row.referralLink}
                          className="break-all text-xs font-semibold text-slate-500 hover:text-emerald-800"
                        >
                          {row.referralLink.replace(/^https?:\/\//, "://")}
                        </a>
                      </td>
                      <td className="px-3 py-3 font-bold tabular-nums">
                        {row.clicks.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 font-bold tabular-nums">
                        {row.conversionRate.toFixed(1)}%
                        <span className="ml-1 text-xs font-semibold text-slate-400">
                          ({row.referrals})
                        </span>
                      </td>
                      <td className="px-3 py-3 font-black tabular-nums text-emerald-900">
                        {money(row.earningsPool)}
                      </td>
                      <td className="px-3 py-3">
                        <select
                          disabled={busyId === row.profileId}
                          defaultValue=""
                          onChange={(e) => {
                            const value = e.target.value as
                              | "approve_commissions"
                              | "mark_batch_paid"
                              | "";
                            e.target.value = "";
                            if (!value) return;
                            void runAction(row.profileId, value);
                          }}
                          className="w-full min-w-[200px] rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-800"
                        >
                          <option value="" disabled>
                            {busyId === row.profileId
                              ? "Working…"
                              : "Choose action…"}
                          </option>
                          <option value="approve_commissions">
                            Approve Commissions
                          </option>
                          <option value="mark_batch_paid">
                            Mark Batch as Paid via Stripe Connect
                          </option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/80 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
          {label}
        </p>
        <span className="text-emerald-700">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950">
        {value}
      </p>
    </div>
  );
}

function Th({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <th className="px-3 py-3">
      <button
        type="button"
        onClick={onClick}
        className="font-black uppercase tracking-[0.12em] hover:text-emerald-200"
      >
        {children}
      </button>
    </th>
  );
}
