import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  nextDailySyncAt,
  type CommunityMarketRow,
  type CommunityMarketUpdateInput,
} from "@/lib/community/markets";

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function mapMarket(row: Record<string, unknown>): CommunityMarketRow {
  return {
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
    last_successful_sync_at: row.last_successful_sync_at
      ? String(row.last_successful_sync_at)
      : null,
    last_sync_attempt_at: row.last_sync_attempt_at
      ? String(row.last_sync_attempt_at)
      : null,
    last_sync_status: (row.last_sync_status as CommunityMarketRow["last_sync_status"]) || null,
    last_sync_error: row.last_sync_error ? String(row.last_sync_error) : null,
    last_sync_upserted: Number(row.last_sync_upserted || 0),
    events_discovered_count: Number(row.events_discovered_count || 0),
    next_scheduled_sync_at: row.next_scheduled_sync_at
      ? String(row.next_scheduled_sync_at)
      : null,
    serp_cache_ttl_hours: Number(row.serp_cache_ttl_hours || 20),
    max_queries_per_sync: Number(row.max_queries_per_sync || 2),
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || new Date().toISOString()),
  };
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
      .slice(0, 8);
  }
  if (input.eventCategories) {
    patch.event_categories = input.eventCategories
      .map((term) => term.trim())
      .filter(Boolean)
      .slice(0, 12);
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

export async function refreshMarketDiscoveryCount(marketId: string) {
  const count = await countActiveDiscoveriesForMarket(marketId);
  await supabaseAdmin
    .from("community_markets")
    .update({
      events_discovered_count: count,
      updated_at: new Date().toISOString(),
    })
    .eq("id", marketId);
  return count;
}

export async function markMarketSyncResult(opts: {
  marketId: string;
  status: CommunityMarketRow["last_sync_status"];
  upserted: number;
  error?: string | null;
  successful?: boolean;
}) {
  const now = new Date().toISOString();
  const count = await countActiveDiscoveriesForMarket(opts.marketId);

  const patch: Record<string, unknown> = {
    last_sync_attempt_at: now,
    last_sync_status: opts.status,
    last_sync_error: opts.error || null,
    last_sync_upserted: opts.upserted,
    events_discovered_count: count,
    next_scheduled_sync_at: nextDailySyncAt(new Date(now)),
    updated_at: now,
  };

  if (opts.successful) {
    patch.last_successful_sync_at = now;
  }

  await supabaseAdmin
    .from("community_markets")
    .update(patch)
    .eq("id", opts.marketId);

  return count;
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
  };
}

export async function incrementSerpUsage(opts: {
  searches?: number;
  cacheHits?: number;
  marketsSynced?: number;
  eventsUpserted?: number;
}) {
  const usageDate = new Date().toISOString().slice(0, 10);
  const current = await getSerpUsageToday();

  await supabaseAdmin.from("community_serp_usage_daily").upsert(
    {
      usage_date: usageDate,
      search_count: current.searchCount + (opts.searches || 0),
      cache_hit_count: current.cacheHitCount + (opts.cacheHits || 0),
      markets_synced: current.marketsSynced + (opts.marketsSynced || 0),
      events_upserted: current.eventsUpserted + (opts.eventsUpserted || 0),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "usage_date" },
  );
}
