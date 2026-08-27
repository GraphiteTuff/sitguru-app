"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type {
  MarketDensityMarket,
  MarketDensitySummary,
  MarketScore,
} from "@/lib/admin/market-density";

const MapWithNoSSR = dynamic(() => import("./MarketDensityLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] items-center justify-center rounded-[1.75rem] border border-emerald-100 bg-slate-100 text-sm font-black text-slate-500">
      Loading market map...
    </div>
  ),
});

const SCORE_STYLES: Record<
  MarketScore,
  { chip: string; card: string; emoji: string }
> = {
  launch_ready: {
    emoji: "🟢",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-800",
    card: "border-emerald-100 bg-white",
  },
  needs_pet_parents: {
    emoji: "🟡",
    chip: "border-amber-200 bg-amber-50 text-amber-800",
    card: "border-amber-100 bg-white",
  },
  needs_gurus: {
    emoji: "🟠",
    chip: "border-orange-200 bg-orange-50 text-orange-800",
    card: "border-orange-100 bg-white",
  },
  no_density: {
    emoji: "🔴",
    chip: "border-rose-200 bg-rose-50 text-rose-800",
    card: "border-rose-100 bg-white",
  },
};

type FilterId = "all" | MarketScore;

export default function MarketGrowthBoard({
  markets,
  summary,
  compact = false,
}: {
  markets: MarketDensityMarket[];
  summary: MarketDensitySummary;
  compact?: boolean;
}) {
  const [filter, setFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return markets.filter((market) => {
      if (filter !== "all" && market.score !== filter) return false;
      if (!needle) return true;
      return (
        market.label.toLowerCase().includes(needle) ||
        market.city.toLowerCase().includes(needle) ||
        market.zip.includes(needle) ||
        market.state.toLowerCase().includes(needle)
      );
    });
  }, [filter, markets, query]);

  const shown = compact ? visible.slice(0, 8) : visible;

  const filters: Array<{ id: FilterId; label: string; count: number }> = [
    { id: "all", label: "All markets", count: summary.marketCount },
    {
      id: "launch_ready",
      label: "Launch Ready",
      count: summary.launchReady,
    },
    {
      id: "needs_pet_parents",
      label: "Needs Pet Parents",
      count: summary.needsPetParents,
    },
    { id: "needs_gurus", label: "Needs Gurus", count: summary.needsGurus },
    {
      id: "no_density",
      label: "No density",
      count: summary.noDensity,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile
          emoji="🟢"
          label="Launch Ready"
          value={summary.launchReady}
          helper="Spend and convert"
        />
        <SummaryTile
          emoji="🟡"
          label="Needs Pet Parents"
          value={summary.needsPetParents}
          helper="Acquire demand"
        />
        <SummaryTile
          emoji="🟠"
          label="Needs Gurus"
          value={summary.needsGurus}
          helper="Recruit supply"
        />
        <SummaryTile
          emoji="🔴"
          label="No density"
          value={summary.noDensity}
          helper="Do not spend yet"
        />
      </div>

      {summary.mappedCount > 0 ? <MapWithNoSSR markets={visible} /> : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-black transition ${
                filter === item.id
                  ? "border-emerald-700 bg-[#0D5C3A] text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200"
              }`}
            >
              {item.label} · {item.count}
            </button>
          ))}
        </div>

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search city or ZIP"
          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none ring-emerald-100 placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 lg:max-w-xs"
        />
      </div>

      {shown.length === 0 ? (
        <p className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm font-semibold text-slate-600">
          No markets match that filter yet. Add ZIP on Guru, Pet Parent, and
          Ambassador profiles to populate density.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((market) => {
            const style = SCORE_STYLES[market.score];
            return (
              <article
                key={market.key}
                className={`rounded-[1.75rem] border p-5 shadow-sm ${style.card}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-slate-950">
                      {market.label}
                    </h3>
                    {market.state ? (
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        {market.state}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] font-black ${style.chip}`}
                  >
                    {style.emoji} {market.scoreLabel}
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-2 text-sm font-semibold text-slate-700">
                  <Stat label="Gurus" value={market.guruCount} />
                  <Stat label="Bookable" value={market.bookableCount} />
                  <Stat label="Pet Parents" value={market.petParentCount} />
                  <Stat label="Ambassadors" value={market.ambassadorCount} />
                </dl>

                <p className="mt-3 text-sm font-black text-slate-950">
                  {market.bookingCount} booking
                  {market.bookingCount === 1 ? "" : "s"}
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {market.spendHint}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryTile({
  emoji,
  label,
  value,
  helper,
}: {
  emoji: string;
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {emoji} {label}
      </p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-600">{helper}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2">
      <dt className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-black text-slate-950">{value}</dd>
    </div>
  );
}
