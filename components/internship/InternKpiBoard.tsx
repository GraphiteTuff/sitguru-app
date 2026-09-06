"use client";

import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import type { InternKpiCard } from "@/lib/internship/intern-kpis";
import { INTERN_GROWTH_KPIS } from "@/lib/internship/intern-kpis";
import { snapshotInternKpiBaseline } from "@/lib/internship/actions";
import { internPrimaryBtnClass } from "@/lib/internship/intern-ui";

const TONE: Record<InternKpiCard["tone"], string> = {
  emerald: "border-emerald-200 bg-emerald-50",
  sky: "border-sky-200 bg-sky-50",
  violet: "border-violet-200 bg-violet-50",
  rose: "border-rose-200 bg-rose-50",
  slate: "border-slate-200 bg-slate-50",
};

function impactClass(impact: number | null) {
  if (impact == null) return "text-slate-500";
  if (impact > 0) return "text-emerald-800";
  if (impact < 0) return "text-rose-800";
  return "text-slate-600";
}

function impactLabel(impact: number | null) {
  if (impact == null) return "Starting number not set yet";
  if (impact > 0) return `+${impact.toLocaleString()}`;
  return impact.toLocaleString();
}

function KpiCard({ card }: { card: InternKpiCard }) {
  return (
    <article className={`rounded-[1.4rem] border p-4 shadow-sm ${TONE[card.tone]}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">
        {card.label}
      </p>
      <p className="mt-2 text-3xl font-black leading-none text-slate-950">
        {card.current.toLocaleString()}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold">
        <div>
          <p className="uppercase tracking-[0.12em] text-slate-500">Baseline</p>
          <p className="mt-0.5 text-slate-950">
            {card.baseline == null ? "—" : card.baseline.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="uppercase tracking-[0.12em] text-slate-500">Impact</p>
          <p className={`mt-0.5 text-base font-black ${impactClass(card.impact)}`}>
            {impactLabel(card.impact)}
          </p>
        </div>
      </div>
      <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-600">{card.helper}</p>
    </article>
  );
}

export default function InternKpiBoard({
  internId,
  capture = false,
}: {
  internId: string;
  capture?: boolean;
}) {
  const [board, setBoard] = useState<InternKpiCard[]>([]);
  const [liveAt, setLiveAt] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    async function load() {
      try {
        const response = await fetch(
          `/api/internship/kpis?internId=${encodeURIComponent(internId)}&live=1`,
          { credentials: "include", cache: "no-store" },
        );
        const payload = (await response.json()) as {
          board?: InternKpiCard[];
          liveAt?: string;
          error?: string;
        };
        if (cancelled) return;
        if (!response.ok) {
          setError(payload.error || "Could not load live numbers.");
          return;
        }
        setError("");
        setBoard(payload.board || []);
        setLiveAt(payload.liveAt || new Date().toISOString());
      } catch {
        if (!cancelled) setError("Live numbers paused. Trying again…");
      }
    }

    function schedule() {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void load().then(schedule);
      }, 10000);
    }

    function onVisible() {
      if (document.visibilityState === "visible") void load();
    }

    void load().then(schedule);
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [internId]);

  const people = board.filter((card) => card.group === "people");
  const social = board.filter((card) => card.group === "social");
  const stamp = liveAt
    ? new Date(liveAt).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      })
    : "connecting";

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
            Live SitGuru results
          </p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Growth vs starting numbers</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Live totals for people and social. No customer names.
          </p>
        </div>
        <p className="inline-flex min-h-10 items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 text-xs font-black text-emerald-800">
          <Radio size={14} className="animate-pulse" />
          Live · {stamp}
        </p>
      </div>
      {error ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          {error}
        </p>
      ) : null}
      {capture ? (
        <form
          action={snapshotInternKpiBaseline}
          className="rounded-[1.4rem] border border-emerald-100 bg-white p-4"
        >
          <input type="hidden" name="internId" value={internId} />
          <h3 className="font-black text-slate-950">Set starting numbers</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Saves today’s live SitGuru counts as the intern’s starting line. Leave
            boxes blank to use live numbers.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {INTERN_GROWTH_KPIS.map((kpi) => {
              const current = board.find((card) => card.key === kpi.key)?.current;
              return (
                <label key={kpi.key} className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">
                    {kpi.label}
                  </span>
                  <input
                    name={kpi.key}
                    type="number"
                    placeholder={current == null ? "Live" : String(current)}
                    className="mt-1 min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
                  />
                </label>
              );
            })}
          </div>
          <button className={`${internPrimaryBtnClass} mt-3 w-full sm:w-auto sm:px-6`}>
            Save starting numbers
          </button>
        </form>
      ) : null}
      <div>
        <h3 className="mb-2 text-sm font-black text-slate-950">People</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {people.map((card) => (
            <KpiCard key={card.key} card={card} />
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-black text-slate-950">Social</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {social.map((card) => (
            <KpiCard key={card.key} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
