import type {
  CommunityMarketHealth,
  CommunityMarketRow,
  CommunityMarketTier,
} from "@/lib/community/markets";

export const MARKET_TIER_LABELS: Record<CommunityMarketTier, string> = {
  core: "CORE MARKET",
  growth: "GROWTH MARKET",
  expansion: "EXPANSION MARKET",
  seasonal: "SEASONAL MARKET",
  paused: "PAUSED",
};

export const MARKET_HEALTH_LABELS: Record<CommunityMarketHealth, string> = {
  excellent: "Excellent",
  healthy: "Healthy",
  low_yield: "Low Yield",
  needs_review: "Needs Review",
  budget_deferred: "Budget Deferred",
  api_error: "API Error",
  paused: "Paused",
};

/** Budget share of daily SerpApi searches by tier (manual reserve separate). */
export const TIER_BUDGET_SHARE: Record<
  Exclude<CommunityMarketTier, "paused">,
  number
> = {
  core: 0.5,
  growth: 0.3,
  expansion: 0.15,
  seasonal: 0.0, // seasonal draws from remaining after core/growth/expansion
};

export const MANUAL_BUDGET_RESERVE_SHARE = 0.05;

export function tierSortRank(tier: CommunityMarketTier) {
  switch (tier) {
    case "core":
      return 0;
    case "growth":
      return 1;
    case "expansion":
      return 2;
    case "seasonal":
      return 3;
    case "paused":
      return 9;
    default:
      return 5;
  }
}

export function sortMarketsByDiscoveryPriority(markets: CommunityMarketRow[]) {
  return [...markets].sort((a, b) => {
    const tierDiff = tierSortRank(a.market_tier) - tierSortRank(b.market_tier);
    if (tierDiff !== 0) return tierDiff;
    return (a.sort_order || 100) - (b.sort_order || 100);
  });
}

export function defaultSyncFrequencyHours(tier: CommunityMarketTier) {
  switch (tier) {
    case "core":
      return 24;
    case "growth":
      return 24;
    case "expansion":
      return 60;
    case "seasonal":
      return 168;
    case "paused":
      return 24 * 365;
    default:
      return 48;
  }
}

/**
 * Auto-adjust frequency from yield — never auto-disables the market.
 * Growth can stretch to 48h on weak yield; expansion/seasonal slow further.
 */
export function suggestSyncFrequencyHours(market: CommunityMarketRow): number {
  if (market.market_tier === "paused") {
    return defaultSyncFrequencyHours("paused");
  }

  const base =
    market.sync_frequency_hours || defaultSyncFrequencyHours(market.market_tier);
  const zeros = market.consecutive_zero_yield_syncs || 0;
  const yieldAvg = Number(market.avg_pet_yield_per_search || 0);

  if (market.market_tier === "core") {
    if (zeros >= 5) return Math.max(base, 48);
    return 24;
  }

  if (market.market_tier === "growth") {
    if (zeros >= 3 || yieldAvg < 0.5) return 48;
    return 24;
  }

  if (market.market_tier === "expansion") {
    if (zeros >= 3) return Math.max(base, 96);
    if (zeros >= 5) return Math.max(base, 168);
    return Math.max(base, 60);
  }

  // seasonal
  if (zeros >= 3) return Math.max(base, 240);
  return Math.max(base, 168);
}

export function computeMarketHealth(
  market: CommunityMarketRow,
): CommunityMarketHealth {
  if (market.market_tier === "paused" || !market.enabled) return "paused";
  if (market.last_sync_status === "budget_deferred") return "budget_deferred";
  if (market.last_sync_status === "failed") return "api_error";

  const zeros = market.consecutive_zero_yield_syncs || 0;
  const yieldAvg = Number(market.avg_pet_yield_per_search || 0);
  const searches = market.searches_performed_total || 0;

  if (searches === 0) return "healthy";
  if (zeros >= 5) return "needs_review";
  if (zeros >= 3 || (searches >= 4 && yieldAvg < 0.4)) return "low_yield";
  if (yieldAvg >= 3 || (market.pet_relevant_events_count || 0) >= 8) {
    return "excellent";
  }
  return "healthy";
}

export type MarketRecommendation = {
  marketId: string;
  marketName: string;
  message: string;
  severity: "info" | "success" | "warn";
};

export function buildMarketRecommendations(
  markets: CommunityMarketRow[],
): MarketRecommendation[] {
  const out: MarketRecommendation[] = [];

  for (const market of markets) {
    const yieldAvg = Number(market.avg_pet_yield_per_search || 0);
    const zeros = market.consecutive_zero_yield_syncs || 0;
    const anchors = market.city_anchors || [];
    const nextAnchor =
      anchors.length > 0
        ? anchors[(market.city_anchor_index || 0) % anchors.length]
        : market.city;

    if (yieldAvg >= 3 && (market.searches_performed_total || 0) >= 2) {
      out.push({
        marketId: market.id,
        marketName: market.name,
        severity: "success",
        message: `${market.name} is producing strong pet-event results. Maintain ${
          market.market_tier === "core" ? "daily" : "current"
        } discovery.`,
      });
    }

    if (
      market.market_tier === "expansion" &&
      yieldAvg >= 2.5 &&
      (market.pet_relevant_events_count || 0) >= 6
    ) {
      out.push({
        marketId: market.id,
        marketName: market.name,
        severity: "info",
        message: `${market.name} is producing strong event discovery and may be ready for Growth Market status.`,
      });
    }

    if (zeros >= 3 && zeros < 5) {
      out.push({
        marketId: market.id,
        marketName: market.name,
        severity: "warn",
        message: `${market.name} returned zero relevant results in ${zeros} searches. Try rotating to ${
          nextAnchor || "another"
        } city anchor.`,
      });
    }

    if (zeros >= 5) {
      out.push({
        marketId: market.id,
        marketName: market.name,
        severity: "warn",
        message: `${market.name} has returned zero relevant events in ${zeros} searches. Consider reducing discovery to weekly.`,
      });
    }
  }

  return out.slice(0, 12);
}

export type SyncBudgetPlan = {
  dailyBudget: number;
  searchesUsed: number;
  searchesRemaining: number;
  manualReserve: number;
  allocatable: number;
  searchesRequired: number;
  marketsSelected: number;
  marketsQueued: Array<{
    id: string;
    name: string;
    tier: CommunityMarketTier;
    queries: number;
  }>;
  marketsDeferred: Array<{
    id: string;
    name: string;
    tier: CommunityMarketTier;
    reason: string;
  }>;
  canSyncAllSelected: boolean;
  confirmationMessage: string;
};

export function planSyncBudget(opts: {
  markets: CommunityMarketRow[];
  searchesUsedToday: number;
  dailyBudget: number;
  forceRefresh?: boolean;
}): SyncBudgetPlan {
  const dailyBudget = Math.max(1, opts.dailyBudget);
  const searchesUsed = Math.max(0, opts.searchesUsedToday);
  const searchesRemaining = Math.max(0, dailyBudget - searchesUsed);
  const manualReserve = Math.max(
    1,
    Math.floor(dailyBudget * MANUAL_BUDGET_RESERVE_SHARE),
  );
  // Admin Sync All may use reserve; leave a soft note in messaging
  const allocatable = searchesRemaining;

  const eligible = sortMarketsByDiscoveryPriority(
    opts.markets.filter(
      (m) =>
        m.enabled &&
        m.market_tier !== "paused" &&
        (opts.forceRefresh || isMarketDueForSync(m)),
    ),
  );

  const marketsQueued: SyncBudgetPlan["marketsQueued"] = [];
  const marketsDeferred: SyncBudgetPlan["marketsDeferred"] = [];
  let remaining = allocatable;
  let searchesRequired = 0;

  for (const market of eligible) {
    const queries = Math.max(1, market.max_queries_per_sync || 1);
    searchesRequired += queries;
    if (queries <= remaining) {
      marketsQueued.push({
        id: market.id,
        name: market.name,
        tier: market.market_tier,
        queries,
      });
      remaining -= queries;
    } else {
      marketsDeferred.push({
        id: market.id,
        name: market.name,
        tier: market.market_tier,
        reason: "Daily SerpApi budget",
      });
    }
  }

  const canSyncAllSelected = marketsDeferred.length === 0;
  const confirmationMessage = canSyncAllSelected
    ? `${searchesRequired} SerpApi searches required.\n${searchesRemaining} searches remain today.\nAll selected markets can be synced.`
    : `${searchesRequired} searches required.\n${searchesRemaining} remain today.\nHighest-priority markets will sync first and remaining markets will be deferred.`;

  return {
    dailyBudget,
    searchesUsed,
    searchesRemaining,
    manualReserve,
    allocatable,
    searchesRequired,
    marketsSelected: eligible.length,
    marketsQueued,
    marketsDeferred,
    canSyncAllSelected,
    confirmationMessage,
  };
}

export function isMarketDueForSync(market: CommunityMarketRow, now = new Date()) {
  if (!market.enabled || market.market_tier === "paused") return false;
  if (!market.next_scheduled_sync_at) return true;
  const next = new Date(market.next_scheduled_sync_at);
  if (Number.isNaN(next.getTime())) return true;
  return next.getTime() <= now.getTime();
}

export function formatSyncBudgetConfirm(plan: SyncBudgetPlan) {
  return plan.confirmationMessage;
}
