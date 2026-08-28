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
 * Prefer county-level "in …" phrasing (broader events block hits).
 * Put the precise place in SerpApi `location`, not state abbreviations in `q`.
 * (Google's dedicated Events vertical was retired Aug 2026; we use engine=google.)
 */
export function buildMarketSearchQueries(market: CommunityMarketRow) {
  const county = market.county_name?.trim() || null;
  const city = market.city?.trim() || null;
  const fallbackPlace =
    market.location_query
      .replace(/,\s*(PA|Pennsylvania)\b/gi, "")
      .trim() || market.name;

  const primaryPlace = county || city || fallbackPlace;
  const secondaryPlace =
    city && county && city.toLowerCase() !== county.toLowerCase()
      ? city
      : null;

  const maxQueries = Math.max(1, market.max_queries_per_sync || 2);
  const terms = (market.search_terms || [])
    .map((term) => term.trim())
    .filter(Boolean);
  const effectiveTerms = terms.length
    ? terms
    : ["pet friendly events", "dog adoption events"];

  const queries: string[] = [];
  const push = (q: string) => {
    if (queries.length >= maxQueries) return;
    if (!queries.includes(q)) queries.push(q);
  };

  // Slot 1: broad county / primary
  push(
    /\bin\b|\bnear\b/i.test(effectiveTerms[0])
      ? effectiveTerms[0]
      : `${effectiveTerms[0]} in ${primaryPlace}`,
  );

  // Slot 2+: mix city "near" (better local hits) then remaining terms
  if (secondaryPlace) {
    const term = effectiveTerms[1] || effectiveTerms[0];
    push(`${term} near ${secondaryPlace}`);
  }

  for (const term of effectiveTerms.slice(secondaryPlace ? 2 : 1)) {
    push(/\bin\b|\bnear\b/i.test(term) ? term : `${term} in ${primaryPlace}`);
  }

  return queries.length ? queries : [`pet friendly events in ${primaryPlace}`];
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
