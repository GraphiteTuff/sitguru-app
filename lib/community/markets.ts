export type CommunityMarketSyncStatus =
  | "success"
  | "partial"
  | "failed"
  | "skipped"
  | "cached";

export type CommunityMarketRow = {
  id: string;
  slug: string;
  name: string;
  county_name: string | null;
  city: string | null;
  state: string;
  region: string | null;
  location_query: string;
  latitude: number | null;
  longitude: number | null;
  radius_miles: number;
  search_terms: string[];
  event_categories: string[];
  enabled: boolean;
  sort_order: number;
  last_successful_sync_at: string | null;
  last_sync_attempt_at: string | null;
  last_sync_status: CommunityMarketSyncStatus | null;
  last_sync_error: string | null;
  last_sync_upserted: number;
  events_discovered_count: number;
  next_scheduled_sync_at: string | null;
  serp_cache_ttl_hours: number;
  max_queries_per_sync: number;
  created_at: string;
  updated_at: string;
};

export type CommunityMarketUpdateInput = {
  name?: string;
  countyName?: string | null;
  city?: string | null;
  state?: string;
  region?: string | null;
  locationQuery?: string;
  latitude?: number | null;
  longitude?: number | null;
  radiusMiles?: number;
  searchTerms?: string[];
  eventCategories?: string[];
  enabled?: boolean;
  sortOrder?: number;
  serpCacheTtlHours?: number;
  maxQueriesPerSync?: number;
};

/**
 * Build SerpApi Google Search queries for a market.
 * Prefer "term in City" / "term in County" without state in `q` —
 * put the precise place in the SerpApi `location` parameter instead.
 * (Google's dedicated Events vertical was retired Aug 2026; we use engine=google.)
 */
export function buildMarketSearchQueries(market: CommunityMarketRow) {
  const place =
    market.city?.trim() ||
    market.county_name?.trim() ||
    market.location_query
      .replace(/,\s*(PA|Pennsylvania)\b/gi, "")
      .trim() ||
    market.name;

  const terms = (market.search_terms || [])
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, Math.max(1, market.max_queries_per_sync || 2));

  if (!terms.length) {
    return [`pet friendly events in ${place}`];
  }

  return terms.map((term) =>
    /\bin\b/i.test(term) ? term : `${term} in ${place}`,
  );
}

/** SerpApi `location` value — city/county level, United States. */
export function buildMarketSerpLocation(market: CommunityMarketRow) {
  const raw = market.location_query?.trim() || market.name;
  if (/united states/i.test(raw)) return raw;
  return `${raw}, United States`;
}

export function nextDailySyncAt(from = new Date()) {
  const next = new Date(from);
  // Daily cron is 06:30 UTC — schedule next day at that time.
  next.setUTCDate(next.getUTCDate() + 1);
  next.setUTCHours(6, 30, 0, 0);
  return next.toISOString();
}
