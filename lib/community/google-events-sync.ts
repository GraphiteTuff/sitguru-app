import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  buildMarketSearchQueries,
  buildMarketSerpLocation,
  dailySerpBudget,
  nextCityAnchorIndex,
  type CommunityMarketRow,
} from "@/lib/community/markets";
import {
  isMarketDueForSync,
  planSyncBudget,
  sortMarketsByDiscoveryPriority,
} from "@/lib/community/market-intelligence";
import {
  getCommunityMarketById,
  incrementSerpUsage,
  listCommunityMarkets,
  markMarketSyncResult,
  refreshMarketDiscoveryCount,
  getSerpUsageToday,
} from "@/lib/community/market-queries";
import {
  isQualifyingPetEvent,
  scorePetRelevance,
  shouldAcceptDiscoveredEvent,
} from "@/lib/community/pet-relevance";

type SerpEventResult = {
  title?: string;
  date?:
    | {
        start_date?: string;
        when?: string;
      }
    | string;
  time?: string;
  address?: string[] | string;
  link?: string;
  thumbnail?: string;
  image?: string;
  description?: string;
  source?: string;
  venue?: { name?: string } | string;
};

type ParsedDiscovery = {
  external_id: string;
  content_fingerprint: string;
  market_id: string;
  county: string;
  search_query: string;
  title: string;
  short_description: string | null;
  venue_name: string | null;
  address_line: string | null;
  city: string | null;
  state: string;
  start_at: string;
  end_at: string | null;
  image_url: string | null;
  event_url: string;
  is_free: boolean;
  pet_relevance_score: number;
  qualifying_pet_event: boolean;
  pet_friendly: boolean;
  raw_payload: Record<string, unknown>;
};

function hashExternalId(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 40);
}

function hashQuery(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 40);
}

function normalizeKeyPart(value: string | null | undefined) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Cross-market duplicate key: title + date + venue/city/url — NOT market id. */
export function buildContentFingerprint(input: {
  title: string;
  startAt: string;
  venueName?: string | null;
  city?: string | null;
  addressLine?: string | null;
  eventUrl?: string | null;
}) {
  const day = input.startAt.slice(0, 10);
  const urlHostPath = (() => {
    try {
      if (!input.eventUrl) return "";
      const u = new URL(input.eventUrl);
      return `${u.hostname}${u.pathname}`.toLowerCase();
    } catch {
      return normalizeKeyPart(input.eventUrl);
    }
  })();

  const raw = [
    normalizeKeyPart(input.title),
    day,
    normalizeKeyPart(input.venueName),
    normalizeKeyPart(input.city),
    normalizeKeyPart(input.addressLine).slice(0, 80),
    urlHostPath,
  ].join("|");

  return hashExternalId(`fp:${raw}`);
}

function inferIsFree(title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase();
  if (/ticket|admission|\$\d|paid|fee required/.test(text)) return false;
  if (/free/.test(text)) return true;
  return true;
}

function parseLocation(
  addressParts: string[] | string | undefined,
  fallbackState: string,
  venueHint?: string | null,
) {
  const parts = Array.isArray(addressParts)
    ? addressParts.filter(Boolean)
    : String(addressParts || "")
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
  const joined = parts.join(", ");
  const venue = venueHint || parts[0]?.trim() || null;
  const cityState = parts[parts.length - 1] || joined;
  const cityMatch = cityState.match(/^([^,]+),\s*([A-Z]{2})$/i);

  return {
    venue_name: venue,
    address_line: joined || null,
    city: cityMatch?.[1]?.trim() || null,
    state: cityMatch?.[2]?.toUpperCase() || fallbackState || "PA",
  };
}

function eventDateParts(event: SerpEventResult) {
  if (typeof event.date === "string") {
    const when = [event.date, event.time].filter(Boolean).join(", ");
    return { startDate: event.date, when };
  }
  return {
    startDate: event.date?.start_date,
    when:
      event.date?.when ||
      [event.date?.start_date, event.time].filter(Boolean).join(", "),
  };
}

function eventVenueName(event: SerpEventResult) {
  if (typeof event.venue === "string") return event.venue.trim() || null;
  return event.venue?.name?.trim() || null;
}

function fallbackEventUrl(
  title: string,
  market: CommunityMarketRow,
  venue?: string | null,
) {
  const q = [title, venue, market.city || market.county_name || market.name]
    .filter(Boolean)
    .join(" ");
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

function normalizeSerpEvent(
  event: SerpEventResult,
  market: CommunityMarketRow,
  searchQuery: string,
): { parsed: ParsedDiscovery | null; rejected: boolean; score: number } {
  const title = String(event.title || "").trim();
  if (!title) return { parsed: null, rejected: true, score: 0 };

  const description = String(event.description || "").trim();
  const venueHint = eventVenueName(event);
  const location = parseLocation(event.address, market.state, venueHint);
  const { startDate, when } = eventDateParts(event);
  const startAt = parseEventStartAt(when, startDate);
  const eventUrl =
    String(event.link || "").trim() ||
    fallbackEventUrl(title, market, location.venue_name);

  const score = scorePetRelevance({
    title,
    description,
    searchQuery,
    venueName: location.venue_name,
  });

  if (!shouldAcceptDiscoveredEvent(score)) {
    return { parsed: null, rejected: true, score };
  }

  const fingerprint = buildContentFingerprint({
    title,
    startAt,
    venueName: location.venue_name,
    city: location.city || market.city,
    addressLine: location.address_line,
    eventUrl,
  });

  // Stable across markets — one physical event, one row
  const external_id = fingerprint;

  return {
    rejected: false,
    score,
    parsed: {
      external_id,
      content_fingerprint: fingerprint,
      market_id: market.id,
      county: market.slug,
      search_query: searchQuery,
      title,
      short_description: description || null,
      venue_name: location.venue_name,
      address_line: location.address_line,
      city: location.city || market.city,
      state: location.state || market.state,
      start_at: startAt,
      end_at: parseEventEndAt(startAt, when),
      image_url: event.image || event.thumbnail || null,
      event_url: eventUrl,
      is_free: inferIsFree(title, description),
      pet_relevance_score: score,
      qualifying_pet_event: isQualifyingPetEvent(score),
      pet_friendly: score >= 40,
      raw_payload: event as Record<string, unknown>,
    },
  };
}

const MAX_EVENT_HORIZON_MS = 400 * 86_400_000;

function clampEventStart(date: Date, now = new Date()) {
  const min = now.getTime() - 86_400_000;
  const max = now.getTime() + MAX_EVENT_HORIZON_MS;
  let t = date.getTime();
  if (Number.isNaN(t)) {
    const fallback = new Date(now);
    fallback.setDate(fallback.getDate() + 14);
    fallback.setHours(11, 0, 0, 0);
    return fallback;
  }
  while (t > max) {
    date.setFullYear(date.getFullYear() - 1);
    t = date.getTime();
  }
  while (t < min) {
    date.setFullYear(date.getFullYear() + 1);
    t = date.getTime();
    if (t > max) {
      const fallback = new Date(now);
      fallback.setDate(fallback.getDate() + 21);
      fallback.setHours(11, 0, 0, 0);
      return fallback;
    }
  }
  return date;
}

function parseEventStartAt(when?: string, startDate?: string) {
  const now = new Date();
  const text = `${when || ""} ${startDate || ""}`.trim();

  if (!text) {
    const fallback = new Date(now);
    fallback.setDate(fallback.getDate() + 14);
    fallback.setHours(11, 0, 0, 0);
    return fallback.toISOString();
  }

  const monthDay = text.match(
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})/i,
  );

  if (monthDay) {
    const yearMatch = text.match(/\b(20\d{2})\b/);
    let year = yearMatch ? Number(yearMatch[1]) : now.getFullYear();
    if (year > now.getFullYear() + 1) year = now.getFullYear();

    let date = new Date(Date.parse(`${monthDay[0]} ${year}`));
    if (Number.isNaN(date.getTime())) {
      date = new Date(now);
      date.setDate(date.getDate() + 14);
    }
    if (!yearMatch && date.getTime() < now.getTime() - 86_400_000) {
      date.setFullYear(date.getFullYear() + 1);
    }
    date.setHours(11, 0, 0, 0);
    return clampEventStart(date, now).toISOString();
  }

  const parsed = Date.parse(text);
  if (!Number.isNaN(parsed)) {
    return clampEventStart(new Date(parsed), now).toISOString();
  }

  const fallback = new Date(now);
  fallback.setDate(fallback.getDate() + 21);
  fallback.setHours(11, 0, 0, 0);
  return fallback.toISOString();
}

function parseEventEndAt(startAt: string, when?: string) {
  const start = new Date(startAt);
  const range = when?.match(
    /(\d{1,2}:\d{2}\s*[AP]M)\s*[–-]\s*(\d{1,2}:\d{2}\s*[AP]M)/i,
  );

  if (range) {
    const end = Date.parse(`${range[2]}`);
    if (!Number.isNaN(end)) {
      const endDate = new Date(start);
      const parsedEnd = new Date(end);
      endDate.setHours(parsedEnd.getHours(), parsedEnd.getMinutes(), 0, 0);
      if (endDate.getTime() > start.getTime()) {
        return endDate.toISOString();
      }
    }
  }

  const end = new Date(start);
  end.setHours(end.getHours() + 3);
  return end.toISOString();
}

async function readSerpCache(marketId: string, queryHash: string) {
  const now = new Date().toISOString();
  const { data } = await supabaseAdmin
    .from("community_market_serp_cache")
    .select("response_payload, expires_at, event_count")
    .eq("market_id", marketId)
    .eq("query_hash", queryHash)
    .gt("expires_at", now)
    .maybeSingle();

  if (!data?.response_payload) return null;
  return data.response_payload as { events_results?: SerpEventResult[] };
}

async function writeSerpCache(opts: {
  marketId: string;
  queryHash: string;
  searchQuery: string;
  payload: { events_results?: SerpEventResult[] };
  ttlHours: number;
}) {
  const fetchedAt = new Date();
  const expiresAt = new Date(fetchedAt.getTime() + opts.ttlHours * 3_600_000);

  await supabaseAdmin.from("community_market_serp_cache").upsert(
    {
      market_id: opts.marketId,
      query_hash: opts.queryHash,
      search_query: opts.searchQuery,
      response_payload: opts.payload,
      event_count: opts.payload.events_results?.length || 0,
      fetched_at: fetchedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: "market_id,query_hash" },
  );
}

async function fetchSerpGoogleEvents(query: string, location: string) {
  const apiKey = process.env.SERPAPI_API_KEY?.trim().replace(/^["']|["']$/g, "");
  if (!apiKey) {
    return {
      ok: false as const,
      skipped: true,
      events: [] as SerpEventResult[],
      error: "SERPAPI_API_KEY is not configured.",
    };
  }

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("location", location);
  url.searchParams.set("hl", "en");
  url.searchParams.set("gl", "us");
  url.searchParams.set("google_domain", "google.com");
  url.searchParams.set("api_key", apiKey);

  const response = await fetch(url.toString(), { cache: "no-store" });

  let payload: {
    events_results?: SerpEventResult[];
    error?: string;
  } = {};

  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    return {
      ok: false as const,
      skipped: false,
      events: [] as SerpEventResult[],
      error: `SerpAPI returned non-JSON (${response.status}).`,
    };
  }

  if (!response.ok || payload.error) {
    return {
      ok: false as const,
      skipped: false,
      events: [] as SerpEventResult[],
      error: payload.error || `SerpAPI request failed (${response.status}).`,
    };
  }

  return {
    ok: true as const,
    skipped: false,
    events: Array.isArray(payload.events_results) ? payload.events_results : [],
    error: null,
    payload,
  };
}

async function expirePastDiscoveries() {
  const cutoff = new Date(Date.now() - 24 * 86_400_000).toISOString();
  const tooFar = new Date(Date.now() + MAX_EVENT_HORIZON_MS).toISOString();

  await supabaseAdmin
    .from("community_event_discoveries")
    .update({
      status: "expired",
      updated_at: new Date().toISOString(),
    })
    .lt("start_at", cutoff)
    .neq("status", "expired");

  await supabaseAdmin
    .from("community_event_discoveries")
    .update({
      status: "expired",
      updated_at: new Date().toISOString(),
    })
    .gt("start_at", tooFar)
    .neq("status", "expired");

  await supabaseAdmin
    .from("community_event_discoveries")
    .delete()
    .lt("start_at", new Date(Date.now() - 30 * 86_400_000).toISOString());
}

async function findDiscoveryByFingerprint(fingerprint: string) {
  const { data } = await supabaseAdmin
    .from("community_event_discoveries")
    .select("id, external_id, content_fingerprint, market_id")
    .or(
      `content_fingerprint.eq.${fingerprint},external_id.eq.${fingerprint}`,
    )
    .limit(1)
    .maybeSingle();
  return data;
}

async function linkDiscoveryToMarket(discoveryId: string, marketId: string) {
  await supabaseAdmin.from("community_event_discovery_markets").upsert(
    {
      discovery_id: discoveryId,
      market_id: marketId,
      linked_at: new Date().toISOString(),
    },
    { onConflict: "discovery_id,market_id" },
  );
}

async function upsertDiscoveriesForMarket(
  market: CommunityMarketRow,
  parsedRows: ParsedDiscovery[],
  syncedAt: string,
) {
  let inserted = 0;
  let updated = 0;
  let duplicates = 0;
  let petRelevant = 0;

  for (const row of parsedRows) {
    if (row.qualifying_pet_event) petRelevant += 1;

    const existing = await findDiscoveryByFingerprint(row.content_fingerprint);
    if (existing?.id) {
      duplicates += 1;
      await linkDiscoveryToMarket(existing.id, market.id);

      // Refresh last_seen; keep higher pet score unless admin override exists
      await supabaseAdmin
        .from("community_event_discoveries")
        .update({
          last_seen_at: syncedAt,
          synced_at: syncedAt,
          updated_at: syncedAt,
          status: "active",
          pet_relevance_score: row.pet_relevance_score,
          qualifying_pet_event: row.qualifying_pet_event,
          pet_friendly: row.pet_friendly,
          image_url: row.image_url,
          short_description: row.short_description,
        })
        .eq("id", existing.id)
        .is("pet_relevance_override", null);

      updated += 1;
      continue;
    }

    const { data, error } = await supabaseAdmin
      .from("community_event_discoveries")
      .upsert(
        {
          ...row,
          source: "google",
          timezone: "America/New_York",
          status: "active",
          last_seen_at: syncedAt,
          synced_at: syncedAt,
          updated_at: syncedAt,
        },
        { onConflict: "source,external_id" },
      )
      .select("id")
      .maybeSingle();

    if (error) {
      // Race: another market inserted first
      const raced = await findDiscoveryByFingerprint(row.content_fingerprint);
      if (raced?.id) {
        duplicates += 1;
        await linkDiscoveryToMarket(raced.id, market.id);
        updated += 1;
        continue;
      }
      throw new Error(error.message);
    }

    if (data?.id) {
      inserted += 1;
      await linkDiscoveryToMarket(data.id, market.id);
    }
  }

  return { inserted, updated, duplicates, petRelevant };
}

async function syncOneMarket(
  market: CommunityMarketRow,
  opts?: {
    forceRefresh?: boolean;
    budgetRemaining?: number;
  },
) {
  const syncedAt = new Date().toISOString();
  const queries = buildMarketSearchQueries(market);
  const serpLocation = buildMarketSerpLocation(market);
  const deduped = new Map<string, ParsedDiscovery>();
  const errors: string[] = [];
  let cacheHits = 0;
  let liveSearches = 0;
  let skippedApi = false;
  let budgetDeferred = false;
  let rejected = 0;
  let zeroResultSearches = 0;
  let discoveredRaw = 0;

  const budgetCap =
    typeof opts?.budgetRemaining === "number"
      ? opts.budgetRemaining
      : dailySerpBudget();

  for (const q of queries) {
    const queryHash = hashQuery(`${q}|${serpLocation}`);

    if (!opts?.forceRefresh) {
      const cached = await readSerpCache(market.id, queryHash);
      if (cached) {
        cacheHits += 1;
        const events = cached.events_results || [];
        if (!events.length) zeroResultSearches += 1;
        for (const event of events) {
          discoveredRaw += 1;
          const result = normalizeSerpEvent(event, market, q);
          if (result.rejected || !result.parsed) {
            rejected += 1;
            continue;
          }
          deduped.set(result.parsed.external_id, result.parsed);
        }
        continue;
      }
    }

    if (liveSearches >= budgetCap) {
      budgetDeferred = true;
      errors.push(
        `${market.name}: daily SerpApi budget reached. Remaining markets deferred.`,
      );
      break;
    }

    const result = await fetchSerpGoogleEvents(q, serpLocation);
    if (result.skipped) {
      skippedApi = true;
      errors.push(result.error || "SerpAPI skipped.");
      break;
    }

    if (!result.ok) {
      errors.push(`${market.slug}: ${result.error}`);
      continue;
    }

    liveSearches += 1;
    await writeSerpCache({
      marketId: market.id,
      queryHash,
      searchQuery: q,
      payload: { events_results: result.events },
      ttlHours: market.serp_cache_ttl_hours || 20,
    });

    if (!result.events.length) zeroResultSearches += 1;

    for (const event of result.events) {
      discoveredRaw += 1;
      const normalized = normalizeSerpEvent(event, market, q);
      if (normalized.rejected || !normalized.parsed) {
        rejected += 1;
        continue;
      }
      deduped.set(normalized.parsed.external_id, normalized.parsed);
    }
  }

  if (budgetDeferred && deduped.size === 0 && liveSearches === 0 && cacheHits === 0) {
    await markMarketSyncResult({
      marketId: market.id,
      status: "budget_deferred",
      upserted: 0,
      error: errors.join(" ") || "Budget deferred",
      successful: false,
      marketSnapshot: market,
      yieldStats: {
        searches: 0,
        discovered: 0,
        petRelevant: 0,
        rejected: 0,
        inserted: 0,
        updated: 0,
        duplicates: 0,
        zeroResultSearches: 0,
        cityAnchorIndex: market.city_anchor_index || 0,
      },
    });
    return {
      ok: true,
      skipped: false,
      budgetDeferred: true,
      marketId: market.id,
      marketSlug: market.slug,
      marketName: market.name,
      upserted: 0,
      cacheHits,
      liveSearches,
      petRelevant: 0,
      duplicates: 0,
      errors,
    };
  }

  if (skippedApi && deduped.size === 0) {
    await markMarketSyncResult({
      marketId: market.id,
      status: "skipped",
      upserted: 0,
      error: errors.join(" ") || "SERPAPI_API_KEY missing",
      successful: false,
      marketSnapshot: market,
    });
    return {
      ok: false,
      skipped: true,
      budgetDeferred: false,
      marketId: market.id,
      marketSlug: market.slug,
      marketName: market.name,
      upserted: 0,
      cacheHits,
      liveSearches,
      petRelevant: 0,
      duplicates: 0,
      errors,
    };
  }

  let inserted = 0;
  let updated = 0;
  let duplicates = 0;
  let petRelevant = 0;
  let upserted = 0;

  try {
    const stats = await upsertDiscoveriesForMarket(
      market,
      Array.from(deduped.values()),
      syncedAt,
    );
    inserted = stats.inserted;
    updated = stats.updated;
    duplicates = stats.duplicates;
    petRelevant = stats.petRelevant;
    upserted = inserted + updated;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Upsert failed");
  }

  await incrementSerpUsage({
    searches: liveSearches,
    cacheHits,
    marketsSynced: liveSearches > 0 || cacheHits > 0 ? 1 : 0,
    eventsUpserted: upserted,
    petRelevantUpserted: petRelevant,
    duplicatesPrevented: duplicates,
    marketsDeferred: budgetDeferred ? 1 : 0,
  });

  const status = budgetDeferred
    ? liveSearches > 0 || upserted > 0
      ? "partial"
      : "budget_deferred"
    : errors.length === 0
      ? liveSearches === 0 && cacheHits > 0
        ? "cached"
        : "success"
      : upserted > 0
        ? "partial"
        : "failed";

  await markMarketSyncResult({
    marketId: market.id,
    status,
    upserted,
    error: errors.length ? errors.join(" ") : null,
    successful:
      status === "success" || status === "cached" || status === "partial",
    marketSnapshot: market,
    yieldStats: {
      searches: liveSearches,
      discovered: discoveredRaw,
      petRelevant,
      rejected,
      inserted,
      updated,
      duplicates,
      zeroResultSearches,
      cityAnchorIndex: nextCityAnchorIndex(market),
    },
  });

  return {
    ok: errors.length === 0 || upserted > 0 || status === "budget_deferred",
    skipped: false,
    budgetDeferred,
    marketId: market.id,
    marketSlug: market.slug,
    marketName: market.name,
    upserted,
    cacheHits,
    liveSearches,
    petRelevant,
    duplicates,
    errors,
  };
}

export async function previewCommunityMarketSync(opts?: {
  marketId?: string;
  forceRefresh?: boolean;
}) {
  const usage = await getSerpUsageToday();
  const budget = dailySerpBudget();
  const markets = opts?.marketId
    ? ([await getCommunityMarketById(opts.marketId)].filter(
        Boolean,
      ) as CommunityMarketRow[])
    : await listCommunityMarkets({ enabledOnly: true });

  return planSyncBudget({
    markets,
    searchesUsedToday: usage.searchCount,
    dailyBudget: budget,
    forceRefresh: opts?.forceRefresh ?? true,
  });
}

export async function syncGoogleCommunityEventDiscoveries(opts?: {
  marketId?: string;
  forceRefresh?: boolean;
  /** When true, sync due markets only (cron). */
  respectSchedule?: boolean;
}) {
  await expirePastDiscoveries();

  const allMarkets = opts?.marketId
    ? ([await getCommunityMarketById(opts.marketId)].filter(
        Boolean,
      ) as CommunityMarketRow[])
    : await listCommunityMarkets({ enabledOnly: true });

  let markets = sortMarketsByDiscoveryPriority(
    allMarkets.filter((m) => m.market_tier !== "paused" || Boolean(opts?.marketId)),
  );

  if (opts?.respectSchedule && !opts?.marketId) {
    markets = markets.filter((m) => isMarketDueForSync(m));
  }

  if (!markets.length) {
    return {
      ok: false,
      skipped: true,
      syncedAt: new Date().toISOString(),
      upserted: 0,
      markets: [] as Array<Record<string, unknown>>,
      errors: ["No enabled community markets configured."],
      budgetPlan: await previewCommunityMarketSync(opts),
    };
  }

  const results = [];
  let upserted = 0;
  const errors: string[] = [];
  let skippedAll = true;
  let deferredCount = 0;

  for (const market of markets) {
    if (!market.enabled && !opts?.marketId) continue;
    if (market.market_tier === "paused" && !opts?.marketId) continue;

    const usage = await getSerpUsageToday();
    const budget = dailySerpBudget();
    const remaining = Math.max(0, budget - usage.searchCount);
    const needed = Math.max(1, market.max_queries_per_sync || 1);

    if (remaining < 1 && opts?.forceRefresh) {
      // Still allow cache-only path inside syncOneMarket with budgetRemaining 0
    } else if (remaining < needed && !opts?.marketId) {
      deferredCount += 1;
      await markMarketSyncResult({
        marketId: market.id,
        status: "budget_deferred",
        upserted: 0,
        error: `Budget deferred. Next eligible after daily SerpApi reset.`,
        successful: false,
        marketSnapshot: market,
        yieldStats: {
          searches: 0,
          discovered: 0,
          petRelevant: 0,
          rejected: 0,
          inserted: 0,
          updated: 0,
          duplicates: 0,
          zeroResultSearches: 0,
          cityAnchorIndex: market.city_anchor_index || 0,
        },
      });
      results.push({
        ok: true,
        skipped: false,
        budgetDeferred: true,
        marketId: market.id,
        marketSlug: market.slug,
        marketName: market.name,
        upserted: 0,
        cacheHits: 0,
        liveSearches: 0,
        petRelevant: 0,
        duplicates: 0,
        errors: ["Budget deferred"],
      });
      continue;
    }

    const result = await syncOneMarket(market, {
      forceRefresh: opts?.forceRefresh,
      budgetRemaining: remaining,
    });
    results.push(result);
    upserted += result.upserted;
    errors.push(...result.errors);
    if (result.budgetDeferred) deferredCount += 1;
    if (!result.skipped) skippedAll = false;
  }

  if (deferredCount > 0) {
    await incrementSerpUsage({ marketsDeferred: 0 }); // already counted per market
  }

  for (const market of markets) {
    await refreshMarketDiscoveryCount(market.id);
  }

  return {
    ok: errors.length === 0 || upserted > 0 || deferredCount > 0,
    skipped: skippedAll,
    syncedAt: new Date().toISOString(),
    upserted,
    markets: results,
    deferredCount,
    errors,
    usage: await getSerpUsageToday(),
    budgetPlan: await previewCommunityMarketSync(opts),
  };
}

/** @deprecated Use syncGoogleCommunityEventDiscoveries — kept for cron compatibility. */
export { syncGoogleCommunityEventDiscoveries as syncAllEnabledMarkets };
