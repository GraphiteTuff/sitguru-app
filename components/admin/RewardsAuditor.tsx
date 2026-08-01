"use client";

/**
 * Admin Rewards Auditor — PetPerks ↔ PawPerks telemetry for widescreen monitoring.
 */

import { Gift, ShieldAlert, Trophy, Link2 } from "lucide-react";

export type SharedLinkStat = {
  code: string;
  ownerName: string;
  ownerEmail: string;
  programType: string;
  linksGenerated: number;
  conversions: number;
  conversionRate: number;
};

export type FraudAuditRow = {
  id: string;
  signal: string;
  detail: string;
  ipOrFingerprint: string;
  paymentHint: string;
  status: string;
  createdAt: string;
};

export type LeaderboardRow = {
  rank: number;
  name: string;
  email: string;
  code: string;
  conversions: number;
  clicks: number;
  conversionRate: number;
  revenue: number;
};

type Props = {
  sharedLinksGenerated: number;
  sharedLinkRows: SharedLinkStat[];
  fraudRows: FraudAuditRow[];
  leaderboard: LeaderboardRow[];
};

function formatPct(value: number) {
  return `${Math.round((Number(value) || 0) * 1000) / 10}%`;
}

function formatMoney(value: number) {
  return (Number(value) || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatWhen(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function RewardsAuditor({
  sharedLinksGenerated,
  sharedLinkRows,
  fraudRows,
  leaderboard,
}: Props) {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white">
              <Link2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
                Shared links generated
              </p>
              <p className="mt-1 text-3xl font-black tabular-nums text-slate-950">
                {sharedLinksGenerated.toLocaleString()}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-500">
            Viral expansion volume across PetPerks / PawPerks referral codes.
          </p>
        </article>

        <article className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-600 text-white">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-rose-700">
                Fraud flags
              </p>
              <p className="mt-1 text-3xl font-black tabular-nums text-slate-950">
                {fraudRows.length.toLocaleString()}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-500">
            Same IP / payment method redeem attempts needing review.
          </p>
        </article>

        <article className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500 text-white">
              <Trophy className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-800">
                Star ambassadors
              </p>
              <p className="mt-1 text-3xl font-black tabular-nums text-slate-950">
                {leaderboard.length.toLocaleString()}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-500">
            Top conversion-rate referrers on the leaderboard matrix.
          </p>
        </article>
      </div>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <Gift className="h-4 w-4 text-emerald-700" />
          <h2 className="text-sm font-black text-slate-950">
            Shared link volume ledger
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-black text-slate-600">Code</th>
                <th className="px-4 py-3 font-black text-slate-600">Owner</th>
                <th className="px-4 py-3 font-black text-slate-600">Program</th>
                <th className="px-4 py-3 font-black text-slate-600">Links</th>
                <th className="px-4 py-3 font-black text-slate-600">Conversions</th>
                <th className="px-4 py-3 font-black text-slate-600">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sharedLinkRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm font-semibold text-slate-500"
                  >
                    No shared link rows yet.
                  </td>
                </tr>
              ) : (
                sharedLinkRows.map((row) => (
                  <tr key={row.code} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900">
                      {row.code}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{row.ownerName}</p>
                      <p className="text-xs text-slate-500">{row.ownerEmail}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {row.programType}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-black text-slate-950">
                      {row.linksGenerated.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-bold text-slate-800">
                      {row.conversions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-bold text-emerald-700">
                      {formatPct(row.conversionRate)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>

      <article className="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-rose-100 px-5 py-4">
          <ShieldAlert className="h-4 w-4 text-rose-700" />
          <h2 className="text-sm font-black text-slate-950">
            Fraud prevention audit ledger
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-rose-50/60">
              <tr>
                <th className="px-4 py-3 font-black text-slate-600">Signal</th>
                <th className="px-4 py-3 font-black text-slate-600">Detail</th>
                <th className="px-4 py-3 font-black text-slate-600">IP / device</th>
                <th className="px-4 py-3 font-black text-slate-600">Payment</th>
                <th className="px-4 py-3 font-black text-slate-600">Status</th>
                <th className="px-4 py-3 font-black text-slate-600">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {fraudRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm font-semibold text-slate-500"
                  >
                    No duplicate IP / payment redeem flags in the current window.
                  </td>
                </tr>
              ) : (
                fraudRows.map((row) => (
                  <tr key={row.id} className="hover:bg-rose-50/40">
                    <td className="px-4 py-3 font-black text-rose-800">
                      {row.signal}
                    </td>
                    <td className="max-w-xs px-4 py-3 font-semibold text-slate-700">
                      {row.detail}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      {row.ipOrFingerprint || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      {row.paymentHint || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-rose-800">
                        {row.status || "review"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-500">
                      {formatWhen(row.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>

      <article className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-amber-100 px-5 py-4">
          <Trophy className="h-4 w-4 text-amber-700" />
          <h2 className="text-sm font-black text-slate-950">
            Leaderboard matrix — highest referral conversion
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-amber-50/70">
              <tr>
                <th className="px-4 py-3 font-black text-slate-600">Rank</th>
                <th className="px-4 py-3 font-black text-slate-600">Ambassador</th>
                <th className="px-4 py-3 font-black text-slate-600">Code</th>
                <th className="px-4 py-3 font-black text-slate-600">Clicks</th>
                <th className="px-4 py-3 font-black text-slate-600">Conversions</th>
                <th className="px-4 py-3 font-black text-slate-600">Rate</th>
                <th className="px-4 py-3 font-black text-slate-600">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {leaderboard.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm font-semibold text-slate-500"
                  >
                    Leaderboard will populate as PetPerks referrals convert.
                  </td>
                </tr>
              ) : (
                leaderboard.map((row) => (
                  <tr key={`${row.rank}-${row.code}`} className="hover:bg-amber-50/40">
                    <td className="px-4 py-3 font-black tabular-nums text-slate-950">
                      #{row.rank}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{row.name}</p>
                      <p className="text-xs text-slate-500">{row.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800">
                      {row.code}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-slate-700">
                      {row.clicks.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-bold text-slate-900">
                      {row.conversions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-black text-emerald-700">
                      {formatPct(row.conversionRate)}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-bold text-slate-900">
                      {formatMoney(row.revenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
