"use client";

/**
 * Conversion funnel dashboard — visualizes signup→booking leak diagnostics.
 * Data: GET /api/admin/diagnostics/conversion-leak
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  Filter,
  RefreshCw,
  TrendingDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

/** Matches the conversion-leak diagnostic API UI contract. */
export interface FunnelStage {
  stage: string;
  count: number;
  dropOffCount: number;
  dropOffPercentage: number;
  retentionPercentage: number;
}

export interface DiagnosticSummary {
  totalLeakPercentage: number;
  highestDropOffStage: string;
  leakSummary: string;
  groundTruthSignups: number;
  groundTruthBookings: number;
  totalEventsSampled: number;
}

export interface DiagnosticData {
  summary: DiagnosticSummary;
  funnel: FunnelStage[];
  compiledAt: string;
  period: string;
  periodStart: string;
}

type PeriodKey = "daily" | "weekly" | "monthly" | "yearly";

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

function pct(value: number) {
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe % 1 === 0 ? safe.toFixed(0) : safe.toFixed(1)}%`;
}

async function getAdminBearer() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
}

export default function ConversionFunnelPage() {
  const [period, setPeriod] = useState<PeriodKey>("yearly");
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDiagnostics = useCallback(async (nextPeriod: PeriodKey) => {
    setLoading(true);
    setError("");
    try {
      const token = await getAdminBearer();
      const response = await fetch(
        `/api/admin/diagnostics/conversion-leak?period=${nextPeriod}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: "no-store",
        },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        data?: DiagnosticData;
        funnel?: FunnelStage[];
        summary?: DiagnosticSummary;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Failed to load conversion funnel.");
      }

      if (payload.data?.funnel && payload.data.summary) {
        setData(payload.data);
      } else if (payload.funnel && payload.summary) {
        setData({
          summary: payload.summary,
          funnel: payload.funnel,
          compiledAt: new Date().toISOString(),
          period: nextPeriod,
          periodStart: "",
        });
      } else {
        throw new Error("Diagnostic payload missing funnel stages.");
      }
    } catch (loadError) {
      setData(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load conversion funnel.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDiagnostics(period);
  }, [loadDiagnostics, period]);

  const bottleneck = data?.summary.highestDropOffStage || "";
  const leakPct = data?.summary.totalLeakPercentage ?? 0;

  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
          <Link href="/admin/analytics" className="hover:text-emerald-400">
            Analytics Hub
          </Link>
          <span>/</span>
          <span className="text-zinc-300">Conversion Funnel</span>
        </div>

        <header className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-400">
                <Filter size={12} />
                Funnel diagnostics
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Conversion Funnel
              </h1>
              <p className="mt-3 text-sm font-medium leading-6 text-zinc-400 sm:text-base">
                Unmasked PostgREST pipelines — live{" "}
                <span className="text-zinc-200">analytics_events</span>,{" "}
                <span className="text-zinc-200">launch_signups</span>, and{" "}
                <span className="text-zinc-200">bookings</span> staged into
                Traffic → Signup → Booking Initiated → Booking Completed so we
                can locate the signup→booking leak.
              </p>
            </div>

            <div className="flex flex-col items-end gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-black text-red-400">
                <TrendingDown size={16} />
                Leak {pct(leakPct)}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    ["daily", "Daily"],
                    ["weekly", "Weekly"],
                    ["monthly", "Monthly"],
                    ["yearly", "Yearly"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPeriod(value)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] transition ${
                      period === value
                        ? "bg-emerald-500 text-black"
                        : "border border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => void loadDiagnostics(period)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-zinc-300 transition hover:border-emerald-500/40 hover:text-emerald-300"
                >
                  <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {data ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                  Events sampled
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {number(data.summary.totalEventsSampled)}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                  Ground-truth signups
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {number(data.summary.groundTruthSignups)}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                  Completed bookings
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {number(data.summary.groundTruthBookings)}
                </p>
              </div>
            </div>
          ) : null}

          {data?.summary.leakSummary ? (
            <p className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm font-medium text-zinc-300">
              {data.summary.leakSummary}
            </p>
          ) : null}
        </header>

        {loading ? (
          <div className="mt-8 flex min-h-[280px] items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-950">
            <p className="animate-pulse text-sm font-semibold tracking-wide text-zinc-400">
              Loading conversion funnel from unmasked PostgREST diagnostics…
            </p>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="mt-8 rounded-3xl border border-red-500/40 bg-red-500/10 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 text-red-400" size={18} />
              <div>
                <p className="text-sm font-black text-red-300">
                  Diagnostics unavailable
                </p>
                <p className="mt-1 text-sm text-red-200/80">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadDiagnostics(period)}
                  className="mt-4 rounded-full border border-red-400/40 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-200 transition hover:bg-red-500/10"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {!loading && !error && data ? (
          <section className="mt-8 space-y-0">
            <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
              <Activity size={14} className="text-emerald-400" />
              Funnel stages
              {bottleneck ? (
                <span className="ml-2 rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[10px] text-red-300">
                  Bottleneck: {bottleneck}
                </span>
              ) : null}
            </div>

            {data.funnel.map((stage, index) => {
              const isBottleneck =
                Boolean(bottleneck) && stage.stage === bottleneck;
              const retentionWidth = Math.max(
                4,
                Math.min(100, stage.retentionPercentage || 0),
              );
              const previous = index > 0 ? data.funnel[index - 1] : null;

              return (
                <div key={`${stage.stage}-${index}`}>
                  {previous ? (
                    <div className="relative flex items-center justify-center py-3">
                      <div className="absolute inset-x-8 top-1/2 h-px bg-zinc-800" />
                      <div className="relative z-10 flex flex-wrap items-center justify-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-amber-300">
                          <ArrowDown size={12} />
                          Drop-off {number(stage.dropOffCount)}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-red-300">
                          −{pct(stage.dropOffPercentage)}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <article
                    className={`rounded-3xl border bg-zinc-950 p-5 sm:p-6 ${
                      isBottleneck
                        ? "border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.12)]"
                        : "border-zinc-800"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                            Stage {index + 1}
                          </p>
                          {isBottleneck ? (
                            <span className="rounded-full border border-red-500/50 bg-red-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-red-300">
                              Highest drop-off
                            </span>
                          ) : null}
                        </div>
                        <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                          {stage.stage}
                        </h2>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                          Absolute count
                        </p>
                        <p className="mt-1 text-4xl font-black tabular-nums text-white">
                          {number(stage.count)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="mb-2 flex items-end justify-between gap-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                            Retention
                          </p>
                          <p
                            className={`text-3xl font-black tabular-nums ${
                              isBottleneck ? "text-red-400" : "text-emerald-400"
                            }`}
                          >
                            {pct(stage.retentionPercentage)}
                          </p>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isBottleneck ? "bg-red-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${retentionWidth}%` }}
                          />
                        </div>
                      </div>
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                          Drop from previous
                        </p>
                        <p className="mt-2 text-xl font-black text-zinc-100">
                          {index === 0
                            ? "Top of funnel"
                            : `${number(stage.dropOffCount)} · ${pct(stage.dropOffPercentage)}`}
                        </p>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/admin/help/articles/new"
                className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-300 transition hover:bg-emerald-500/20"
              >
                Open friction Help briefs
              </Link>
              <Link
                href="/admin/analytics/overview"
                className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-300 transition hover:border-zinc-500"
              >
                Analytics overview
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
