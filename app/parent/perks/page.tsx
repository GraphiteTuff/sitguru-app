"use client";

/**
 * Gamified PawPerks vault for Pet Parents — badge levels, history, schedule CTA.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  formatPawPerks,
  PAWPERK_BADGE_LEVELS,
  pointsToUsd,
  type PawPerkTransactionRow,
} from "@/lib/pawperks/constants";
import { formatUsd } from "@/lib/billing/pricingCalculator";

type PerksApiResponse = {
  ok: boolean;
  error?: string;
  balance?: {
    pointsBalance: number;
    lifetimeEarned: number;
    usdValue: number;
    label: string;
  };
  badge?: {
    current: { id: string; label: string; emoji: string; blurb: string };
    next: { id: string; label: string; minLifetime: number } | null;
    progressPct: number;
    pointsToNext: number;
  };
  transactions?: PawPerkTransactionRow[];
};

function sourceLabel(source: string) {
  if (source === "GURU_REWARD") return "Guru reward";
  if (source === "BOOKING_REDEMPTION") return "Checkout redemption";
  if (source === "SIGNUP_BONUS") return "Signup bonus";
  if (source === "ADMIN_DEBIT") return "Admin debit";
  if (source === "ADMIN_CREDIT") return "Admin credit";
  return source;
}

export default function ParentPerksPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PerksApiResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/parent/perks");
      const json = (await res.json()) as PerksApiResponse;
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent("/parent/perks")}`);
        return;
      }
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Unable to load PawPerks.");
      }
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const milestoneBars = useMemo(() => {
    const lifetime = data?.balance?.lifetimeEarned || 0;
    return PAWPERK_BADGE_LEVELS.map((level) => {
      const unlocked = lifetime >= level.minLifetime;
      const width =
        level.maxLifetime == null
          ? unlocked
            ? 100
            : Math.min(100, Math.round((lifetime / level.minLifetime) * 100))
          : Math.min(
              100,
              Math.round(
                ((lifetime - level.minLifetime) /
                  Math.max(1, level.maxLifetime - level.minLifetime)) *
                  100,
              ),
            );
      return { level, unlocked, width: unlocked ? Math.max(width, 12) : width };
    });
  }, [data?.balance?.lifetimeEarned]);

  const balance = data?.balance;
  const badge = data?.badge;

  return (
    <main className="min-h-[100dvh] bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] text-slate-950">
      <div className="mx-auto w-full max-w-lg px-4 pb-16 pt-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
              SitGuru PawPerks
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
              Your vault
            </h1>
          </div>
          <Link
            href="/customer/dashboard"
            className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800"
          >
            Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="rounded-[1.75rem] border border-emerald-100 bg-white px-5 py-10 text-center text-sm font-semibold text-slate-500">
            Loading your PawPerks vault…
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800">
            {error}
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 block text-rose-900 underline"
            >
              Try again
            </button>
          </div>
        ) : null}

        {!loading && !error && balance && badge ? (
          <div className="space-y-5">
            <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-[0_18px_40px_rgba(6,78,59,0.08)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Active balance
                  </p>
                  <p className="mt-1 text-4xl font-black tabular-nums text-emerald-800">
                    {balance.pointsBalance.toLocaleString("en-US")}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-600">
                    {formatPawPerks(balance.pointsBalance)} ≈{" "}
                    {formatUsd(pointsToUsd(balance.pointsBalance))} at checkout
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-center">
                  <p className="text-2xl" aria-hidden>
                    {badge.current.emoji}
                  </p>
                  <p className="text-xs font-black text-emerald-900">
                    {badge.current.label}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Progress to {badge.next?.label || "max level"}</span>
                  <span>{badge.progressPct}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                    style={{ width: `${badge.progressPct}%` }}
                  />
                </div>
                {badge.next ? (
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {badge.pointsToNext} points to unlock {badge.next.label}.
                  </p>
                ) : (
                  <p className="mt-2 text-xs font-semibold text-emerald-700">
                    Legend status unlocked — keep the streak alive.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5">
              <h2 className="text-lg font-black text-slate-900">Badge matrix</h2>
              <p className="mt-1 text-sm text-slate-500">
                Lifetime earned: {balance.lifetimeEarned.toLocaleString("en-US")}{" "}
                pts
              </p>
              <ul className="mt-4 space-y-3">
                {milestoneBars.map(({ level, unlocked, width }) => (
                  <li key={level.id}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-800">
                        {level.emoji} {level.label}
                      </span>
                      <span
                        className={[
                          "text-[10px] font-black uppercase tracking-wide",
                          unlocked ? "text-emerald-700" : "text-slate-400",
                        ].join(" ")}
                      >
                        {unlocked ? "Unlocked" : `${level.minLifetime}+ pts`}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={[
                          "h-full rounded-full",
                          unlocked
                            ? "bg-emerald-500"
                            : "bg-slate-300",
                        ].join(" ")}
                        style={{ width: `${Math.max(0, width)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{level.blurb}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-[1.75rem] border border-violet-200 bg-gradient-to-br from-violet-50 to-emerald-50 p-5">
              <h2 className="text-lg font-black text-slate-900">
                Keep your streak alive
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Schedule your next walk so Gurus can keep celebrating great
                behavior — and stack more redeemable PawPerks.
              </p>
              <Link
                href="/bookings/new"
                className="mt-4 flex min-h-[56px] items-center justify-center rounded-2xl bg-[#065f46] px-4 text-sm font-black text-white shadow-lg shadow-emerald-900/20"
              >
                Schedule an upcoming walk
              </Link>
            </section>

            <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5">
              <h2 className="text-lg font-black text-slate-900">
                Reward history
              </h2>
              <ul className="mt-3 divide-y divide-emerald-50">
                {(data?.transactions || []).length === 0 ? (
                  <li className="py-6 text-center text-sm font-medium text-slate-500">
                    No PawPerks activity yet — your next walk is the starter pistol.
                  </li>
                ) : (
                  (data?.transactions || []).map((tx) => (
                    <li
                      key={tx.transaction_id}
                      className="flex items-start justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800">
                          {sourceLabel(tx.source_type)}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {tx.memo || "PawPerks ledger entry"}
                        </p>
                        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          {new Date(tx.created_at).toLocaleString()}
                        </p>
                      </div>
                      <p
                        className={[
                          "shrink-0 text-sm font-black tabular-nums",
                          tx.points_delta >= 0
                            ? "text-emerald-700"
                            : "text-violet-700",
                        ].join(" ")}
                      >
                        {tx.points_delta >= 0 ? "+" : ""}
                        {tx.points_delta}
                      </p>
                    </li>
                  ))
                )}
              </ul>
              <Link
                href="/customer/dashboard/pawperks"
                className="mt-3 block text-center text-xs font-bold text-emerald-700 underline"
              >
                Also see referral PawPerks credits
              </Link>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
