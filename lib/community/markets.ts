import { DEFAULT_PET_SEARCH_INTENTS } from "@/lib/community/pet-relevance";

export type CommunityMarketSyncStatus =
  | "success"
  | "partial"
  | "failed"
  | "skipped"
  | "cached"
  | "budget_deferred";

export type CommunityMarketTier =
  | "core"
  | "growth"
  | "expansion"
  | "seasonal"
  | "paused";

export type CommunityMarketHealth =
  | "excellent"
  | "healthy"
  | "low_yield"
  | "needs_review"
  | "budget_deferred"
  | "api_error"
  | "paused";

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
  market_tier: CommunityMarketTier;
  city_anchors: string[];
  city_anchor_index: number;
  sync_frequency_hours: number;
  market_health: CommunityMarketHealth;
  searches_performed_total: number;
  events_discovered_total: number;
  pet_relevant_events_total: number;
  events_rejected_total: number;
  events_inserted_total: number;
  events_updated_total: number;
  duplicates_detected_total: number;
  zero_result_searches_total: number;
  consecutive_zero_yield_syncs: number;
  last_pet_yield_per_search: number;
  avg_pet_yield_per_search: number;
  pet_relevant_events_count: number;
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
  cityAnchors?: string[];
  marketTier?: CommunityMarketTier;
  syncFrequencyHours?: number;
  enabled?: boolean;
  sortOrder?: number;
  serpCacheTtlHours?: number;
  maxQueriesPerSync?: number;
};

/**
 * Build SerpApi Google Search queries for a market.
 * Rotate city anchors + pet intents rather than blasting every city each sync.
 */
export function buildMarketSearchQueries(market: CommunityMarketRow) {
  const county = market.county_name?.trim() || null;
  const anchors = (market.city_anchors || [])
    .map((a) => a.trim())
    .filter(Boolean);
  const fallbackCity = market.city?.trim() || null;
  const anchorIndex = Math.max(0, market.city_anchor_index || 0);

  const activeAnchor =
    anchors.length > 0
      ? anchors[anchorIndex % anchors.length]
      : fallbackCity;

  const primaryPlace = county || activeAnchor || market.name;
  const maxQueries = Math.max(1, market.max_queries_per_sync || 1);

  const customTerms = (market.search_terms || [])
    .map((term) => term.trim())
    .filter(Boolean);
  const intentPool =
    customTerms.length > 0
      ? customTerms
      : [...DEFAULT_PET_SEARCH_INTENTS];

  // Rotate intents with anchor index so consecutive syncs diversify.
  const rotatedIntents = rotateArray(intentPool, anchorIndex);

  const queries: string[] = [];
  const push = (q: string) => {
    if (queries.length >= maxQueries) return;
    if (!queries.includes(q)) queries.push(q);
  };

  const first = rotatedIntents[0] || "pet events";
  if (activeAnchor && county) {
    push(
      /\bin\b|\bnear\b/i.test(first)
        ? first
        : `${first} near ${activeAnchor}`,
    );
    if (maxQueries > 1) {
      const second = rotatedIntents[1] || first;
      push(`${second} in ${county}`);
    }
  } else {
    push(
      /\bin\b|\bnear\b/i.test(first)
        ? first
        : `${first} in ${primaryPlace}`,
    );
  }

  for (const term of rotatedIntents.slice(queries.length)) {
    if (queries.length >= maxQueries) break;
    const place = activeAnchor || primaryPlace;
    push(/\bin\b|\bnear\b/i.test(term) ? term : `${term} near ${place}`);
  }

  return queries.length
    ? queries
    : [`pet events in ${primaryPlace}`];
}

function rotateArray<T>(items: T[], offset: number) {
  if (!items.length) return items;
  const start = ((offset % items.length) + items.length) % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
}

/** Advance city anchor rotation after a sync attempt. */
export function nextCityAnchorIndex(market: CommunityMarketRow) {
  const anchors = (market.city_anchors || []).filter((a) => a.trim());
  if (anchors.length <= 1) return 0;
  return ((market.city_anchor_index || 0) + 1) % anchors.length;
}

/** SerpApi `location` value — city/county level, United States. */
export function buildMarketSerpLocation(market: CommunityMarketRow) {
  const anchors = (market.city_anchors || [])
    .map((a) => a.trim())
    .filter(Boolean);
  const activeAnchor =
    anchors.length > 0
      ? anchors[(market.city_anchor_index || 0) % anchors.length]
      : market.city?.trim() || null;

  if (activeAnchor) {
    const stateName =
      market.state === "NJ"
        ? "New Jersey"
        : market.state === "PA"
          ? "Pennsylvania"
          : market.state;
    return `${activeAnchor}, ${stateName}, United States`;
  }

  const raw = market.location_query?.trim() || market.name;
  if (/united states/i.test(raw)) return raw;
  return `${raw}, United States`;
}

export function nextScheduledSyncAt(
  market: Pick<CommunityMarketRow, "market_tier" | "sync_frequency_hours">,
  from = new Date(),
) {
  if (market.market_tier === "paused") {
    const far = new Date(from);
    far.setUTCFullYear(far.getUTCFullYear() + 1);
    return far.toISOString();
  }

  const hours = Math.max(6, market.sync_frequency_hours || 24);
  const next = new Date(from.getTime() + hours * 3_600_000);
  return next.toISOString();
}

/** @deprecated Prefer nextScheduledSyncAt — kept for older callers. */
export function nextDailySyncAt(from = new Date()) {
  const next = new Date(from);
  next.setUTCDate(next.getUTCDate() + 1);
  next.setUTCHours(6, 30, 0, 0);
  return next.toISOString();
}

export function dailySerpBudget() {
  const configured = Number(process.env.SERPAPI_DAILY_BUDGET || 40);
  return Number.isFinite(configured) && configured > 0
    ? Math.floor(configured)
    : 40;
}
