import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  nextScheduledSyncAt,
  type CommunityMarketHealth,
  type CommunityMarketRow,
  type CommunityMarketTier,
  type CommunityMarketUpdateInput,
} from "@/lib/community/markets";
import {
  computeMarketHealth,
  suggestSyncFrequencyHours,
} from "@/lib/community/market-intelligence";

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function asTier(value: unknown): CommunityMarketTier {
  const v = String(value || "expansion");
  if (
    v === "core" ||
    v === "growth" ||
    v === "expansion" ||
    v === "seasonal" ||
    v === "paused"
  ) {
    return v;
  }
  return "expansion";
}

function asHealth(value: unknown): CommunityMarketHealth {
  const v = String(value || "healthy");
  if (
    v === "excellent" ||
    v === "healthy" ||
    v === "low_yield" ||
    v === "needs_review" ||
    v === "budget_deferred" ||
    v === "api_error" ||
    v === "paused"
  ) {
    return v;
  }
  return "healthy";
}

export function mapMarket(row: Record<string, unknown>): CommunityMarketRow {
  const mapped: CommunityMarketRow = {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    county_name: row.county_name ? String(row.county_name) : null,
    city: row.city ? String(row.city) : null,
    state: String(row.state || "PA"),
    region: row.region ? String(row.region) : null,
    location_query: String(row.location_query || ""),
    latitude:
      typeof row.latitude === "number"
        ? row.latitude
        : row.latitude != null
          ? Number(row.latitude)
          : null,
    longitude:
      typeof row.longitude === "number"
        ? row.longitude
        : row.longitude != null
          ? Number(row.longitude)
          : null,
    radius_miles: Number(row.radius_miles || 35),
    search_terms: asStringArray(row.search_terms),
    event_categories: asStringArray(row.event_categories),
    enabled: Boolean(row.enabled),
    sort_order: Number(row.sort_order || 100),
    market_tier: asTier(row.market_tier),
    city_anchors: asStringArray(row.city_anchors),
    city_anchor_index: Number(row.city_anchor_index || 0),
    sync_frequency_hours: Number(row.sync_frequency_hours || 24),
    market_health: asHealth(row.market_health),
    searches_performed_total: Number(row.searches_performed_total || 0),
    events_discovered_total: Number(row.events_discovered_total || 0),
    pet_relevant_events_total: Number(row.pet_relevant_events_total || 0),
    events_rejected_total: Number(row.events_rejected_total || 0),
    events_inserted_total: Number(row.events_inserted_total || 0),
    events_updated_total: Number(row.events_updated_total || 0),
    duplicates_detected_total: Number(row.duplicates_detected_total || 0),
    zero_result_searches_total: Number(row.zero_result_searches_total || 0),
    consecutive_zero_yield_syncs: Number(row.consecutive_zero_yield_syncs || 0),
    last_pet_yield_per_search: Number(row.last_pet_yield_per_search || 0),
    avg_pet_yield_per_search: Number(row.avg_pet_yield_per_search || 0),
    pet_relevant_events_count: Number(row.pet_relevant_events_count || 0),
    last_successful_sync_at: row.last_successful_sync_at
      ? String(row.last_successful_sync_at)
      : null,
    last_sync_attempt_at: row.last_sync_attempt_at
      ? String(row.last_sync_attempt_at)
      : null,
    last_sync_status:
      (row.last_sync_status as CommunityMarketRow["last_sync_status"]) || null,
    last_sync_error: row.last_sync_error ? String(row.last_sync_error) : null,
    last_sync_upserted: Number(row.last_sync_upserted || 0),
    events_discovered_count: Number(row.events_discovered_count || 0),
    next_scheduled_sync_at: row.next_scheduled_sync_at
      ? String(row.next_scheduled_sync_at)
      : null,
    serp_cache_ttl_hours: Number(row.serp_cache_ttl_hours || 20),
    max_queries_per_sync: Number(row.max_queries_per_sync || 1),
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || new Date().toISOString()),
  };

  // Prefer computed health when columns are present
  mapped.market_health = computeMarketHealth(mapped);
  return mapped;
}

export async function listCommunityMarkets(opts?: {
  enabledOnly?: boolean;
}) {
  let query = supabaseAdmin
    .from("community_markets")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (opts?.enabledOnly) {
    query = query.eq("enabled", true);
  }

  const { data, error } = await query;
  if (error) {
    console.warn("listCommunityMarkets:", error.message);
    return [] as CommunityMarketRow[];
  }

  return (data || []).map((row) => mapMarket(row as Record<string, unknown>));
}

/**
 * Upsert the canonical PA/NJ market catalog so SerpApi has markets to sync into.
 * Safe to call repeatedly — does not delete existing markets.
 */
export async function ensureCommunityMarketsSeeded() {
  const existing = await listCommunityMarkets();
  if (existing.length > 0) {
    return { ok: true as const, seeded: 0, total: existing.length, error: null };
  }

  const { COMMUNITY_MARKET_SEEDS } = await import(
    "@/lib/community/market-seed"
  );
  const now = new Date().toISOString();
  const rows = COMMUNITY_MARKET_SEEDS.map((seed) => ({
    ...seed,
    enabled: true,
    event_categories: [
      "Adoption",
      "Social",
      "Rescue",
      "Festival",
      "Community",
    ],
    city_anchor_index: 0,
    market_health: "healthy",
    next_scheduled_sync_at: now,
    serp_cache_ttl_hours: 20,
    updated_at: now,
  }));

  const { error } = await supabaseAdmin.from("community_markets").upsert(rows, {
    onConflict: "slug",
  });

  if (error) {
    // Retry without smart-growth columns if migration not applied yet
    const legacyRows = COMMUNITY_MARKET_SEEDS.map((seed) => ({
      slug: seed.slug,
      name: seed.name,
      county_name: seed.county_name,
      city: seed.city,
      state: seed.state,
      region: seed.region,
      location_query: seed.location_query,
      latitude: seed.latitude,
      longitude: seed.longitude,
      radius_miles: seed.radius_miles,
      search_terms: seed.search_terms,
      event_categories: [
        "Adoption",
        "Social",
        "Rescue",
        "Festival",
        "Community",
      ],
      enabled: true,
      sort_order: seed.sort_order,
      max_queries_per_sync: seed.max_queries_per_sync,
      serp_cache_ttl_hours: 20,
      next_scheduled_sync_at: now,
      updated_at: now,
    }));

    const fallback = await supabaseAdmin
      .from("community_markets")
      .upsert(legacyRows, { onConflict: "slug" });

    if (fallback.error) {
      console.warn("ensureCommunityMarketsSeeded:", fallback.error.message);
      return {
        ok: false as const,
        seeded: 0,
        total: 0,
        error: fallback.error.message,
      };
    }
  }

  const after = await listCommunityMarkets();
  return {
    ok: true as const,
    seeded: rows.length,
    total: after.length,
    error: null,
  };
}

export async function getCommunityMarketById(marketId: string) {
  const { data, error } = await supabaseAdmin
    .from("community_markets")
    .select("*")
    .eq("id", marketId)
    .maybeSingle();

  if (error || !data) return null;
  return mapMarket(data as Record<string, unknown>);
}

export async function updateCommunityMarket(
  marketId: string,
  input: CommunityMarketUpdateInput,
) {
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof input.name === "string") patch.name = input.name.trim();
  if (input.countyName !== undefined) {
    patch.county_name = input.countyName?.trim() || null;
  }
  if (input.city !== undefined) patch.city = input.city?.trim() || null;
  if (typeof input.state === "string") patch.state = input.state.trim().toUpperCase();
  if (input.region !== undefined) patch.region = input.region?.trim() || null;
  if (typeof input.locationQuery === "string") {
    patch.location_query = input.locationQuery.trim();
  }
  if (input.latitude !== undefined) patch.latitude = input.latitude;
  if (input.longitude !== undefined) patch.longitude = input.longitude;
  if (typeof input.radiusMiles === "number") {
    patch.radius_miles = Math.min(150, Math.max(1, Math.round(input.radiusMiles)));
  }
  if (input.searchTerms) {
    patch.search_terms = input.searchTerms
      .map((term) => term.trim())
      .filter(Boolean)
      .slice(0, 16);
  }
  if (input.eventCategories) {
    patch.event_categories = input.eventCategories
      .map((term) => term.trim())
      .filter(Boolean)
      .slice(0, 12);
  }
  if (input.cityAnchors) {
    patch.city_anchors = input.cityAnchors
      .map((term) => term.trim())
      .filter(Boolean)
      .slice(0, 24);
    patch.city_anchor_index = 0;
  }
  if (input.marketTier) {
    patch.market_tier = input.marketTier;
    if (input.marketTier === "paused") {
      patch.market_health = "paused";
    }
  }
  if (typeof input.syncFrequencyHours === "number") {
    patch.sync_frequency_hours = Math.min(
      24 * 30,
      Math.max(6, Math.round(input.syncFrequencyHours)),
    );
  }
  if (typeof input.enabled === "boolean") patch.enabled = input.enabled;
  if (typeof input.sortOrder === "number") {
    patch.sort_order = Math.round(input.sortOrder);
  }
  if (typeof input.serpCacheTtlHours === "number") {
    patch.serp_cache_ttl_hours = Math.min(
      168,
      Math.max(1, Math.round(input.serpCacheTtlHours)),
    );
  }
  if (typeof input.maxQueriesPerSync === "number") {
    patch.max_queries_per_sync = Math.min(
      8,
      Math.max(1, Math.round(input.maxQueriesPerSync)),
    );
  }

  const { data, error } = await supabaseAdmin
    .from("community_markets")
    .update(patch)
    .eq("id", marketId)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false as const,
      error: error?.message || "Could not update market.",
      market: null,
    };
  }

  return {
    ok: true as const,
    error: null,
    market: mapMarket(data as Record<string, unknown>),
  };
}

export async function countActiveDiscoveriesForMarket(marketId: string) {
  const now = new Date().toISOString();

  const { data: links } = await supabaseAdmin
    .from("community_event_discovery_markets")
    .select("discovery_id")
    .eq("market_id", marketId);

  const linkedIds = (links || []).map((row) => row.discovery_id).filter(Boolean);
  if (linkedIds.length) {
    const { count, error } = await supabaseAdmin
      .from("community_event_discoveries")
      .select("id", { count: "exact", head: true })
      .in("id", linkedIds)
      .eq("status", "active")
      .gte("start_at", now);
    if (!error) return count || 0;
  }

  const { count, error } = await supabaseAdmin
    .from("community_event_discoveries")
    .select("id", { count: "exact", head: true })
    .eq("market_id", marketId)
    .eq("status", "active")
    .gte("start_at", now);

  if (error) {
    console.warn("countActiveDiscoveriesForMarket:", error.message);
    return 0;
  }

  return count || 0;
}

export async function countPetRelevantDiscoveriesForMarket(marketId: string) {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("community_event_discoveries")
    .select("id, pet_relevance_score, pet_relevance_override")
    .eq("market_id", marketId)
    .eq("status", "active")
    .gte("start_at", now);

  if (error) {
    console.warn("countPetRelevantDiscoveriesForMarket:", error.message);
    return 0;
  }

  return (data || []).filter((row) => {
    const override = row.pet_relevance_override;
    const score =
      typeof override === "number" ? override : Number(row.pet_relevance_score || 0);
    return score >= 70;
  }).length;
}

export async function refreshMarketDiscoveryCount(marketId: string) {
  const [count, petCount] = await Promise.all([
    countActiveDiscoveriesForMarket(marketId),
    countPetRelevantDiscoveriesForMarket(marketId),
  ]);

  await supabaseAdmin
    .from("community_markets")
    .update({
      events_discovered_count: count,
      pet_relevant_events_count: petCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", marketId);
  return { count, petCount };
}

export type MarketSyncYieldPatch = {
  searches: number;
  discovered: number;
  petRelevant: number;
  rejected: number;
  inserted: number;
  updated: number;
  duplicates: number;
  zeroResultSearches: number;
  cityAnchorIndex: number;
};

export async function markMarketSyncResult(opts: {
  marketId: string;
  status: CommunityMarketRow["last_sync_status"];
  upserted: number;
  error?: string | null;
  successful?: boolean;
  yieldStats?: MarketSyncYieldPatch;
  marketSnapshot?: CommunityMarketRow;
}) {
  const now = new Date().toISOString();
  const counts = await refreshMarketDiscoveryCount(opts.marketId);
  const existing =
    opts.marketSnapshot || (await getCommunityMarketById(opts.marketId));

  const patch: Record<string, unknown> = {
    last_sync_attempt_at: now,
    last_sync_status: opts.status,
    last_sync_error: opts.error || null,
    last_sync_upserted: opts.upserted,
    events_discovered_count: counts.count,
    pet_relevant_events_count: counts.petCount,
    updated_at: now,
  };

  if (opts.yieldStats && existing) {
    const y = opts.yieldStats;
    const searchesTotal = existing.searches_performed_total + y.searches;
    const petTotal = existing.pet_relevant_events_total + y.petRelevant;
    const lastYield =
      y.searches > 0 ? Number((y.petRelevant / y.searches).toFixed(2)) : 0;
    const avgYield =
      searchesTotal > 0
        ? Number((petTotal / searchesTotal).toFixed(2))
        : existing.avg_pet_yield_per_search;

    const consecutiveZeros =
      y.petRelevant === 0 && y.searches > 0
        ? existing.consecutive_zero_yield_syncs + 1
        : y.petRelevant > 0
          ? 0
          : existing.consecutive_zero_yield_syncs;

    patch.searches_performed_total = searchesTotal;
    patch.events_discovered_total =
      existing.events_discovered_total + y.discovered;
    patch.pet_relevant_events_total = petTotal;
    patch.events_rejected_total = existing.events_rejected_total + y.rejected;
    patch.events_inserted_total = existing.events_inserted_total + y.inserted;
    patch.events_updated_total = existing.events_updated_total + y.updated;
    patch.duplicates_detected_total =
      existing.duplicates_detected_total + y.duplicates;
    patch.zero_result_searches_total =
      existing.zero_result_searches_total + y.zeroResultSearches;
    patch.consecutive_zero_yield_syncs = consecutiveZeros;
    patch.last_pet_yield_per_search = lastYield;
    patch.avg_pet_yield_per_search = avgYield;
    patch.city_anchor_index = y.cityAnchorIndex;

    const snapshotForSchedule = {
      ...existing,
      consecutive_zero_yield_syncs: consecutiveZeros,
      avg_pet_yield_per_search: avgYield,
    };
    const suggested = suggestSyncFrequencyHours(snapshotForSchedule);
    patch.sync_frequency_hours = suggested;
    patch.next_scheduled_sync_at = nextScheduledSyncAt(
      { ...snapshotForSchedule, sync_frequency_hours: suggested },
      new Date(now),
    );
    patch.market_health = computeMarketHealth({
      ...snapshotForSchedule,
      last_sync_status: opts.status,
      sync_frequency_hours: suggested,
    });
  } else if (existing) {
    patch.next_scheduled_sync_at = nextScheduledSyncAt(existing, new Date(now));
    patch.market_health = computeMarketHealth({
      ...existing,
      last_sync_status: opts.status,
    });
  }

  if (opts.status === "budget_deferred") {
    patch.market_health = "budget_deferred";
  }

  if (opts.successful) {
    patch.last_successful_sync_at = now;
  }

  await supabaseAdmin
    .from("community_markets")
    .update(patch)
    .eq("id", opts.marketId);

  return counts.count;
}

export async function getSerpUsageToday() {
  const usageDate = new Date().toISOString().slice(0, 10);
  const { data } = await supabaseAdmin
    .from("community_serp_usage_daily")
    .select("*")
    .eq("usage_date", usageDate)
    .maybeSingle();

  return {
    usageDate,
    searchCount: Number(data?.search_count || 0),
    cacheHitCount: Number(data?.cache_hit_count || 0),
    marketsSynced: Number(data?.markets_synced || 0),
    eventsUpserted: Number(data?.events_upserted || 0),
    petRelevantUpserted: Number(data?.pet_relevant_upserted || 0),
    duplicatesPrevented: Number(data?.duplicates_prevented || 0),
    marketsDeferred: Number(data?.markets_deferred || 0),
  };
}

export async function incrementSerpUsage(opts: {
  searches?: number;
  cacheHits?: number;
  marketsSynced?: number;
  eventsUpserted?: number;
  petRelevantUpserted?: number;
  duplicatesPrevented?: number;
  marketsDeferred?: number;
}) {
  const usageDate = new Date().toISOString().slice(0, 10);
  const current = await getSerpUsageToday();

  const base = {
    usage_date: usageDate,
    search_count: current.searchCount + (opts.searches || 0),
    cache_hit_count: current.cacheHitCount + (opts.cacheHits || 0),
    markets_synced: current.marketsSynced + (opts.marketsSynced || 0),
    events_upserted: current.eventsUpserted + (opts.eventsUpserted || 0),
    updated_at: new Date().toISOString(),
  };

  const withExtras = {
    ...base,
    pet_relevant_upserted:
      current.petRelevantUpserted + (opts.petRelevantUpserted || 0),
    duplicates_prevented:
      current.duplicatesPrevented + (opts.duplicatesPrevented || 0),
    markets_deferred: current.marketsDeferred + (opts.marketsDeferred || 0),
  };

  const { error } = await supabaseAdmin
    .from("community_serp_usage_daily")
    .upsert(withExtras, { onConflict: "usage_date" });

  if (error) {
    await supabaseAdmin
      .from("community_serp_usage_daily")
      .upsert(base, { onConflict: "usage_date" });
  }
}

export async function countPartnerEventsPublished() {
  const now = new Date().toISOString();
  const { count, error } = await supabaseAdmin
    .from("community_events")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .gte("start_at", now);

  if (error) return 0;
  return count || 0;
}

export async function countDiscoveriesFoundToday() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const { count } = await supabaseAdmin
    .from("community_event_discoveries")
    .select("id", { count: "exact", head: true })
    .gte("synced_at", start.toISOString());
  return count || 0;
}

export async function countPetRelevantFoundToday() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const { data } = await supabaseAdmin
    .from("community_event_discoveries")
    .select("pet_relevance_score, pet_relevance_override")
    .gte("synced_at", start.toISOString());

  return (data || []).filter((row) => {
    const score =
      typeof row.pet_relevance_override === "number"
        ? row.pet_relevance_override
        : Number(row.pet_relevance_score || 0);
    return score >= 70;
  }).length;
}
