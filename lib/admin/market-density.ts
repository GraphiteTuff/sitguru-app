export const MARKET_SCORE_ORDER = [
  "launch_ready",
  "needs_pet_parents",
  "needs_gurus",
  "no_density",
] as const;

export type MarketScore = (typeof MARKET_SCORE_ORDER)[number];

export type MarketDensityCounts = {
  guruCount: number;
  bookableCount: number;
  petParentCount: number;
  ambassadorCount: number;
  bookingCount: number;
};

export type MarketDensityMarket = MarketDensityCounts & {
  key: string;
  label: string;
  city: string;
  state: string;
  zip: string;
  score: MarketScore;
  scoreLabel: string;
  spendHint: string;
  latitude: number | null;
  longitude: number | null;
};

export type MarketDensitySummary = {
  marketCount: number;
  launchReady: number;
  needsPetParents: number;
  needsGurus: number;
  noDensity: number;
  mappedCount: number;
};

const SCORE_COPY: Record<
  MarketScore,
  { label: string; spendHint: string }
> = {
  launch_ready: {
    label: "Launch Ready",
    spendHint: "Spend here. Convert Pet Parents and fill Guru calendars.",
  },
  needs_pet_parents: {
    label: "Needs Pet Parents",
    spendHint: "Gurus are waiting. Put Pet Parent acquisition dollars here.",
  },
  needs_gurus: {
    label: "Needs Gurus",
    spendHint: "Demand exists. Recruit and make Gurus bookable here.",
  },
  no_density: {
    label: "No marketplace density",
    spendHint: "Do not spend yet. Build one side of the market first.",
  },
};

export function scoreMarket(counts: MarketDensityCounts): MarketScore {
  const bookable = Math.max(0, counts.bookableCount);
  const parents = Math.max(0, counts.petParentCount);

  if (bookable >= 2 && parents >= 5) return "launch_ready";
  if (bookable >= 2 && parents < 5) return "needs_pet_parents";
  if (parents >= 5 && bookable < 2) return "needs_gurus";
  return "no_density";
}

export function describeMarketScore(score: MarketScore) {
  return SCORE_COPY[score];
}

export function buildMarketDensityMarket(
  input: {
    key: string;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } & MarketDensityCounts,
): MarketDensityMarket {
  const score = scoreMarket(input);
  const copy = describeMarketScore(score);
  const city = String(input.city || "").trim();
  const state = String(input.state || "").trim();
  const zip = String(input.zip || "").trim();

  return {
    key: input.key,
    city,
    state,
    zip,
    label: formatMarketLabel(city, zip, state),
    guruCount: Math.max(0, input.guruCount),
    bookableCount: Math.max(0, input.bookableCount),
    petParentCount: Math.max(0, input.petParentCount),
    ambassadorCount: Math.max(0, input.ambassadorCount),
    bookingCount: Math.max(0, input.bookingCount),
    score,
    scoreLabel: copy.label,
    spendHint: copy.spendHint,
    latitude: Number.isFinite(input.latitude) ? Number(input.latitude) : null,
    longitude: Number.isFinite(input.longitude)
      ? Number(input.longitude)
      : null,
  };
}

export function summarizeMarkets(
  markets: MarketDensityMarket[],
): MarketDensitySummary {
  return {
    marketCount: markets.length,
    launchReady: markets.filter((market) => market.score === "launch_ready")
      .length,
    needsPetParents: markets.filter(
      (market) => market.score === "needs_pet_parents",
    ).length,
    needsGurus: markets.filter((market) => market.score === "needs_gurus")
      .length,
    noDensity: markets.filter((market) => market.score === "no_density")
      .length,
    mappedCount: markets.filter(
      (market) => market.latitude != null && market.longitude != null,
    ).length,
  };
}

export function sortMarkets(markets: MarketDensityMarket[]) {
  const rank = Object.fromEntries(
    MARKET_SCORE_ORDER.map((score, index) => [score, index]),
  ) as Record<MarketScore, number>;

  return [...markets].sort((left, right) => {
    const scoreDelta = rank[left.score] - rank[right.score];
    if (scoreDelta !== 0) return scoreDelta;

    const rightWeight =
      right.bookableCount * 4 +
      right.petParentCount * 2 +
      right.bookingCount * 3 +
      right.ambassadorCount;
    const leftWeight =
      left.bookableCount * 4 +
      left.petParentCount * 2 +
      left.bookingCount * 3 +
      left.ambassadorCount;

    return rightWeight - leftWeight;
  });
}

export function formatMarketLabel(
  city?: string | null,
  zip?: string | null,
  state?: string | null,
) {
  const cleanCity = String(city || "").trim();
  const cleanZip = String(zip || "").trim();
  const cleanState = String(state || "").trim();

  if (cleanCity && cleanZip) return `${cleanCity} / ${cleanZip}`;
  if (cleanCity && cleanState) return `${cleanCity}, ${cleanState}`;
  if (cleanCity) return cleanCity;
  if (cleanZip) return cleanZip;
  return "Unknown market";
}
