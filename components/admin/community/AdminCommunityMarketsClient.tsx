"use client";

import { useMemo, useState, useTransition } from "react";
import { MapPin, RefreshCw, ToggleLeft, ToggleRight } from "lucide-react";
import type { CommunityMarketRow } from "@/lib/community/markets";
import {
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

export default function AdminCommunityMarketsClient({
  markets: initialMarkets,
  usage,
}: {
  markets: CommunityMarketRow[];
  usage: {
    usageDate: string;
    searchCount: number;
    cacheHitCount: number;
    marketsSynced: number;
    eventsUpserted: number;
  };
}) {
  const [markets, setMarkets] = useState(initialMarkets);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);

  const enabledCount = useMemo(
    () => markets.filter((market) => market.enabled).length,
    [markets],
  );

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

  function toggleEnabled(market: CommunityMarketRow) {
    const nextEnabled = !market.enabled;
    updateLocal(market.id, { enabled: nextEnabled });
    startTransition(async () => {
      const result = await saveCommunityMarketAction(market.id, {
        enabled: nextEnabled,
      });
      if (!result.ok || !result.market) {
        updateLocal(market.id, { enabled: market.enabled });
        setMessage(result.error || "Could not update enabled status");
        return;
      }
      updateLocal(market.id, result.market);
      setMessage(
        `${result.market.name} ${result.market.enabled ? "enabled" : "disabled"}`,
      );
    });
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
      if (!result.ok) {
        setMessage(result.errors?.join(" ") || "Sync failed");
        return;
      }
      setMessage(
        `Synced ${result.upserted} events across ${(result.markets || []).length} market(s). Cache hits counted toward usage controls.`,
      );
      window.location.reload();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            Enabled markets
          </p>
          <p className="mt-2 text-3xl font-black text-slate-950">
            {enabledCount}/{markets.length}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            Serp searches today
          </p>
          <p className="mt-2 text-3xl font-black text-slate-950">
            {usage.searchCount}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            Cache hits today
          </p>
          <p className="mt-2 text-3xl font-black text-slate-950">
            {usage.cacheHitCount}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            Events upserted today
          </p>
          <p className="mt-2 text-3xl font-black text-slate-950">
            {usage.eventsUpserted}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600">
          SerpApi Google Search (events block) runs server-side only. Partner-published
          SitGuru events stay separate and keep homepage priority.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => syncMarket()}
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 text-sm font-black text-white disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
          Sync all enabled markets
        </button>
      </div>

      {message ? (
        <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          {message}
        </p>
      ) : null}

      <div className="space-y-4">
        {markets.map((market) => {
          const editing = editingId === market.id;
          return (
            <article
              key={market.id}
              className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-slate-950">{market.name}</h2>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                        market.enabled
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {market.enabled ? "Enabled" : "Disabled"}
                    </span>
                    {market.last_sync_status ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-700">
                        {market.last_sync_status}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                    <MapPin className="h-4 w-4 text-emerald-700" />
                    {market.location_query} · {market.radius_miles} mi
                    {market.region ? ` · ${market.region}` : ""}
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                        Events discovered
                      </p>
                      <p className="mt-1 text-lg font-black text-slate-950">
                        {market.events_discovered_count}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                        Last successful sync
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-950">
                        {formatWhen(market.last_successful_sync_at)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                        Next scheduled sync
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-950">
                        {formatWhen(market.next_scheduled_sync_at)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                        Last upsert
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-950">
                        {market.last_sync_upserted}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => toggleEnabled(market)}
                    className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-800"
                  >
                    {market.enabled ? (
                      <ToggleRight className="h-4 w-4 text-emerald-700" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-slate-400" />
                    )}
                    {market.enabled ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => syncMarket(market.id)}
                    className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-emerald-700 px-4 text-sm font-black text-white disabled:opacity-60"
                  >
                    <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
                    Sync now
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(editing ? null : market.id)}
                    className="inline-flex min-h-10 items-center rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-800"
                  >
                    {editing ? "Close" : "Edit"}
                  </button>
                </div>
              </div>

              {editing ? (
                <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2">
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
                    County
                    <input
                      value={market.county_name || ""}
                      onChange={(event) =>
                        updateLocal(market.id, { county_name: event.target.value })
                      }
                      className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-semibold text-slate-900"
                    />
                  </label>
                  <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    City
                    <input
                      value={market.city || ""}
                      onChange={(event) =>
                        updateLocal(market.id, { city: event.target.value })
                      }
                      className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-semibold text-slate-900"
                    />
                  </label>
                  <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    State
                    <input
                      value={market.state}
                      onChange={(event) =>
                        updateLocal(market.id, { state: event.target.value })
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
                          serp_cache_ttl_hours: Number(event.target.value || 20),
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
                  <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500 sm:col-span-2">
                    Event categories (comma-separated)
                    <input
                      value={market.event_categories.join(", ")}
                      onChange={(event) =>
                        updateLocal(market.id, {
                          event_categories: event.target.value
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
                <p className="mt-4 text-xs font-semibold text-rose-700">
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
