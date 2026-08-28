"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  MapPin,
  Pause,
  Pencil,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { CommunityMarketRow, CommunityMarketTier } from "@/lib/community/markets";
import {
  MARKET_HEALTH_LABELS,
  MARKET_TIER_LABELS,
  buildMarketRecommendations,
  computeMarketHealth,
  type SyncBudgetPlan,
} from "@/lib/community/market-intelligence";
import {
  pauseCommunityMarketAction,
  previewCommunityMarketSyncAction,
  saveCommunityMarketAction,
  syncCommunityMarketNowAction,
} from "@/app/admin/community/markets/actions";

function formatWhen(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function tierBadgeClass(tier: CommunityMarketTier) {
  switch (tier) {
    case "core":
      return "bg-[#0D5C3A] text-white";
    case "growth":
      return "bg-emerald-100 text-emerald-900";
    case "expansion":
      return "bg-sky-100 text-sky-900";
    case "seasonal":
      return "bg-amber-100 text-amber-900";
    case "paused":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function healthClass(health: string) {
  switch (health) {
    case "excellent":
      return "text-emerald-800";
    case "healthy":
      return "text-slate-800";
    case "low_yield":
      return "text-amber-800";
    case "needs_review":
    case "api_error":
      return "text-rose-800";
    case "budget_deferred":
      return "text-orange-800";
    case "paused":
      return "text-slate-500";
    default:
      return "text-slate-700";
  }
}

function syncStatusLabel(status: string | null) {
  if (!status) return null;
  if (status === "budget_deferred") return "Budget Deferred";
  return status.replace(/_/g, " ");
}

export default function AdminCommunityMarketsClient({
  markets: initialMarkets,
  usage,
  summary,
}: {
  markets: CommunityMarketRow[];
  usage: {
    usageDate: string;
    searchCount: number;
    cacheHitCount: number;
    marketsSynced: number;
    eventsUpserted: number;
    petRelevantUpserted: number;
    duplicatesPrevented: number;
    marketsDeferred: number;
  };
  summary: {
    partnerEvents: number;
    communityEventsToday: number;
    petRelevantToday: number;
    dailyBudget: number;
  };
}) {
  const [markets, setMarkets] = useState(initialMarkets);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [budgetConfirm, setBudgetConfirm] = useState<SyncBudgetPlan | null>(
    null,
  );

  const recommendations = useMemo(
    () => buildMarketRecommendations(markets),
    [markets],
  );

  const counts = useMemo(() => {
    const active = markets.filter((m) => m.enabled && m.market_tier !== "paused");
    return {
      active: active.length,
      core: markets.filter((m) => m.market_tier === "core").length,
      growth: markets.filter((m) => m.market_tier === "growth").length,
      expansion: markets.filter((m) => m.market_tier === "expansion").length,
    };
  }, [markets]);

  const remainingSearches = Math.max(
    0,
    summary.dailyBudget - usage.searchCount,
  );
  const budgetStatus =
    remainingSearches <= 0
      ? "Exhausted"
      : remainingSearches <= Math.ceil(summary.dailyBudget * 0.15)
        ? "Tight"
        : "Healthy";

  function updateLocal(marketId: string, patch: Partial<CommunityMarketRow>) {
    setMarkets((current) =>
      current.map((market) =>
        market.id === marketId ? { ...market, ...patch } : market,
      ),
    );
  }

  function saveMarket(market: CommunityMarketRow) {
    startTransition(async () => {
      const result = await saveCommunityMarketAction(market.id, {
        name: market.name,
        countyName: market.county_name,
        city: market.city,
        state: market.state,
        region: market.region,
        locationQuery: market.location_query,
        radiusMiles: market.radius_miles,
        searchTerms: market.search_terms,
        eventCategories: market.event_categories,
        cityAnchors: market.city_anchors,
        marketTier: market.market_tier,
        syncFrequencyHours: market.sync_frequency_hours,
        enabled: market.enabled,
        sortOrder: market.sort_order,
        serpCacheTtlHours: market.serp_cache_ttl_hours,
        maxQueriesPerSync: market.max_queries_per_sync,
      });

      if (!result.ok || !result.market) {
        setMessage(result.error || "Save failed");
        return;
      }

      updateLocal(market.id, result.market);
      setMessage(`Saved ${result.market.name}`);
      setEditingId(null);
    });
  }

  function pauseMarket(market: CommunityMarketRow) {
    startTransition(async () => {
      const result = await pauseCommunityMarketAction(market.id);
      if (!result.ok || !result.market) {
        setMessage(result.error || "Could not pause market");
        return;
      }
      updateLocal(market.id, result.market);
      setMessage(`${result.market.name} paused (no automatic SerpApi searches)`);
    });
  }

  function requestSyncAll() {
    startTransition(async () => {
      const preview = await previewCommunityMarketSyncAction();
      if (!("plan" in preview) || !preview.ok) {
        setMessage(preview.error || "Could not preview sync budget");
        return;
      }
      setBudgetConfirm(preview.plan);
    });
  }

  function confirmSyncAll() {
    setBudgetConfirm(null);
    syncMarket();
  }

  function syncMarket(marketId?: string) {
    startTransition(async () => {
      setMessage("");
      const result = await syncCommunityMarketNowAction(marketId);
      if (!("upserted" in result)) {
        setMessage(result.error || "Sync failed");
        return;
      }
      if (result.skipped) {
        setMessage(
          result.errors?.join(" ") ||
            "Sync skipped — configure SERPAPI_API_KEY in Vercel.",
        );
        return;
      }
      const deferred = Number(result.deferredCount || 0);
      setMessage(
        `Synced ${result.upserted} events across ${(result.markets || []).length} market(s)${
          deferred ? ` · ${deferred} budget deferred` : ""
        }. Partner events stay separate and keep homepage priority.`,
      );
      window.location.reload();
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {[
          { label: "Active Markets", value: counts.active },
          { label: "Core Markets", value: counts.core },
          { label: "Growth Markets", value: counts.growth },
          { label: "Expansion Markets", value: counts.expansion },
          {
            label: "Serp Searches Today",
            value: `${usage.searchCount} / ${summary.dailyBudget}`,
          },
          { label: "Remaining Searches", value: remainingSearches },
          {
            label: "Community Events Found Today",
            value: summary.communityEventsToday,
          },
          {
            label: "Pet-Relevant Events Found Today",
            value: summary.petRelevantToday || usage.petRelevantUpserted,
          },
          { label: "Partner Events", value: summary.partnerEvents },
          {
            label: "Duplicate Events Prevented",
            value: usage.duplicatesPrevented,
          },
          { label: "API Budget Status", value: budgetStatus },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
              {card.label}
            </p>
            <p className="mt-1.5 text-2xl font-black text-slate-950">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {recommendations.length ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-800">
            <Sparkles className="h-3.5 w-3.5" />
            Recommendations
          </p>
          <ul className="mt-2 space-y-1.5">
            {recommendations.slice(0, 5).map((rec) => (
              <li
                key={`${rec.marketId}-${rec.message.slice(0, 24)}`}
                className="text-sm font-semibold text-emerald-950"
              >
                {rec.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm font-semibold text-slate-600">
          Discovery markets power SerpApi only. SitGuru Partner Events stay
          separate and always keep visual priority on the homepage.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={requestSyncAll}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 text-sm font-black text-white disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
          Sync all enabled markets
        </button>
      </div>

      {budgetConfirm ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
          <p className="whitespace-pre-line text-sm font-semibold text-amber-950">
            {budgetConfirm.confirmationMessage}
          </p>
          <p className="mt-2 text-xs font-semibold text-amber-900">
            Queued: {budgetConfirm.marketsQueued.length} · Deferred:{" "}
            {budgetConfirm.marketsDeferred.length} · Manual reserve kept in mind:{" "}
            {budgetConfirm.manualReserve}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={confirmSyncAll}
              className="inline-flex min-h-10 items-center rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black text-white"
            >
              Confirm sync
            </button>
            <button
              type="button"
              onClick={() => setBudgetConfirm(null)}
              className="inline-flex min-h-10 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {message ? (
        <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          {message}
        </p>
      ) : null}

      <div className="space-y-3">
        {markets.map((market) => {
          const editing = editingId === market.id;
          const health = computeMarketHealth(market);
          const anchors =
            market.city_anchors?.length > 0
              ? market.city_anchors
              : market.city
                ? [market.city]
                : [];
          const yieldLabel =
            Number(market.last_pet_yield_per_search || market.avg_pet_yield_per_search) > 0
              ? `${Number(
                  market.last_pet_yield_per_search ||
                    market.avg_pet_yield_per_search,
                ).toFixed(1)} pet events/search`
              : "—";

          return (
            <article
              key={market.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-black text-slate-950 sm:text-xl">
                      {market.name}
                    </h2>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${tierBadgeClass(
                        market.market_tier,
                      )}`}
                    >
                      {MARKET_TIER_LABELS[market.market_tier]}
                    </span>
                    {market.last_sync_status === "budget_deferred" ? (
                      <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-orange-900">
                        Budget Deferred
                      </span>
                    ) : market.last_sync_status ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-700">
                        {syncStatusLabel(market.last_sync_status)}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {market.region || "Metro"} · Status:{" "}
                    <span className={`font-black ${healthClass(health)}`}>
                      {MARKET_HEALTH_LABELS[health]}
                    </span>
                  </p>

                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                    <MapPin className="h-4 w-4 text-emerald-700" />
                    Search radius: {market.radius_miles} mi
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                      City anchors
                    </span>
                    <span className="mt-1 block">
                      {anchors.length ? anchors.join(" · ") : "—"}
                    </span>
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                    <Metric
                      label="Events discovered"
                      value={market.events_discovered_count}
                    />
                    <Metric
                      label="Pet-relevant events"
                      value={market.pet_relevant_events_count}
                    />
                    <Metric
                      label="Last successful sync"
                      value={formatWhen(market.last_successful_sync_at)}
                    />
                    <Metric
                      label="Next scheduled sync"
                      value={formatWhen(market.next_scheduled_sync_at)}
                    />
                    <Metric label="Search yield" value={yieldLabel} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:max-w-[16rem] lg:justify-end">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => syncMarket(market.id)}
                    className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-emerald-700 px-3.5 text-sm font-black text-white disabled:opacity-60"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${pending ? "animate-spin" : ""}`}
                    />
                    Sync Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(editing ? null : market.id)}
                    className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-slate-200 px-3.5 text-sm font-black text-slate-800"
                  >
                    <Pencil className="h-4 w-4" />
                    {editing ? "Close" : "Edit"}
                  </button>
                  <button
                    type="button"
                    disabled={pending || market.market_tier === "paused"}
                    onClick={() => pauseMarket(market)}
                    className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-slate-200 px-3.5 text-sm font-black text-slate-800 disabled:opacity-50"
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </button>
                  <Link
                    href={`/admin/community/events?market=${encodeURIComponent(market.slug)}`}
                    className="inline-flex min-h-10 items-center rounded-2xl border border-slate-200 px-3.5 text-sm font-black text-slate-800"
                  >
                    View Events
                  </Link>
                </div>
              </div>

              {editing ? (
                <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                  <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Market name
                    <input
                      value={market.name}
                      onChange={(event) =>
                        updateLocal(market.id, { name: event.target.value })
                      }
                      className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-semibold text-slate-900"
                    />
                  </label>
                  <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Market tier
                    <select
                      value={market.market_tier}
                      onChange={(event) =>
                        updateLocal(market.id, {
                          market_tier: event.target
                            .value as CommunityMarketTier,
                        })
                      }
                      className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-semibold text-slate-900"
                    >
                      <option value="core">Core</option>
                      <option value="growth">Growth</option>
                      <option value="expansion">Expansion</option>
                      <option value="seasonal">Seasonal</option>
                      <option value="paused">Paused</option>
                    </select>
                  </label>
                  <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500 sm:col-span-2">
                    City anchors (comma-separated)
                    <input
                      value={(market.city_anchors || []).join(", ")}
                      onChange={(event) =>
                        updateLocal(market.id, {
                          city_anchors: event.target.value
                            .split(",")
                            .map((term) => term.trim())
                            .filter(Boolean),
                        })
                      }
                      className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-semibold text-slate-900"
                    />
                  </label>
                  <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Sync frequency (hours)
                    <input
                      type="number"
                      min={6}
                      max={720}
                      value={market.sync_frequency_hours}
                      onChange={(event) =>
                        updateLocal(market.id, {
                          sync_frequency_hours: Number(
                            event.target.value || 24,
                          ),
                        })
                      }
                      className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-semibold text-slate-900"
                    />
                  </label>
                  <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Max queries / sync
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={market.max_queries_per_sync}
                      onChange={(event) =>
                        updateLocal(market.id, {
                          max_queries_per_sync: Number(
                            event.target.value || 1,
                          ),
                        })
                      }
                      className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-semibold text-slate-900"
                    />
                  </label>
                  <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Radius (miles)
                    <input
                      type="number"
                      min={1}
                      max={150}
                      value={market.radius_miles}
                      onChange={(event) =>
                        updateLocal(market.id, {
                          radius_miles: Number(event.target.value || 35),
                        })
                      }
                      className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-semibold text-slate-900"
                    />
                  </label>
                  <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Cache TTL (hours)
                    <input
                      type="number"
                      min={1}
                      max={168}
                      value={market.serp_cache_ttl_hours}
                      onChange={(event) =>
                        updateLocal(market.id, {
                          serp_cache_ttl_hours: Number(
                            event.target.value || 20,
                          ),
                        })
                      }
                      className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-semibold text-slate-900"
                    />
                  </label>
                  <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500 sm:col-span-2">
                    Location query
                    <input
                      value={market.location_query}
                      onChange={(event) =>
                        updateLocal(market.id, {
                          location_query: event.target.value,
                        })
                      }
                      className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-semibold text-slate-900"
                    />
                  </label>
                  <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500 sm:col-span-2">
                    Search terms (comma-separated)
                    <input
                      value={market.search_terms.join(", ")}
                      onChange={(event) =>
                        updateLocal(market.id, {
                          search_terms: event.target.value
                            .split(",")
                            .map((term) => term.trim())
                            .filter(Boolean),
                        })
                      }
                      className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-semibold text-slate-900"
                    />
                  </label>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => saveMarket(market)}
                      className="inline-flex min-h-11 items-center rounded-2xl bg-[#0D5C3A] px-5 text-sm font-black text-white disabled:opacity-60"
                    >
                      Save market
                    </button>
                  </div>
                </div>
              ) : null}

              {market.last_sync_error ? (
                <p className="mt-3 text-xs font-semibold text-rose-700">
                  Last sync note: {market.last_sync_error}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}
