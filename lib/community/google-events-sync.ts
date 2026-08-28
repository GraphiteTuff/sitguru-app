import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  buildMarketSearchQueries,
  buildMarketSerpLocation,
  type CommunityMarketRow,
} from "@/lib/community/markets";
import {
  getCommunityMarketById,
  incrementSerpUsage,
  listCommunityMarkets,
  markMarketSyncResult,
  refreshMarketDiscoveryCount,
  getSerpUsageToday,
} from "@/lib/community/market-queries";

type SerpEventResult = {
  title?: string;
  /** Legacy google_events shape or Google Search events_results object/string. */
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
  description?: string;
  source?: string;
  venue?: { name?: string } | string;
};

type ParsedDiscovery = {
  external_id: string;
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
  raw_payload: Record<string, unknown>;
};

const DEFAULT_DAILY_SERP_BUDGET = 40;

function dailySerpBudget() {
  const configured = Number(process.env.SERPAPI_DAILY_BUDGET || DEFAULT_DAILY_SERP_BUDGET);
  return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : DEFAULT_DAILY_SERP_BUDGET;
}

function hashExternalId(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 40);
}

function hashQuery(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 40);
}

function inferPetFriendly(title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase();
  return /pet|dog|puppy|cat|adoption|bark|paw|animal|rescue|canine|feline/.test(
    text,
  );
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
    when: event.date?.when || [event.date?.start_date, event.time].filter(Boolean).join(", "),
  };
}

function eventVenueName(event: SerpEventResult) {
  if (typeof event.venue === "string") return event.venue.trim() || null;
  return event.venue?.name?.trim() || null;
}

function fallbackEventUrl(title: string, market: CommunityMarketRow, venue?: string | null) {
  const q = [title, venue, market.city || market.county_name || market.name]
    .filter(Boolean)
    .join(" ");
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

function normalizeSerpEvent(
  event: SerpEventResult,
  market: CommunityMarketRow,
  searchQuery: string,
): ParsedDiscovery | null {
  const title = String(event.title || "").trim();
  if (!title) return null;

  const description = String(event.description || "").trim();
  // Prefer pet/rescue signals; still keep clearly local event cards with empty descriptions.
  if (description && !inferPetFriendly(title, description) && !inferPetFriendly(title, searchQuery)) {
    return null;
  }
  if (!description && !inferPetFriendly(title, searchQuery)) {
    // Search query already includes pet terms — keep titled cards from those queries.
    if (!/pet|dog|cat|adoption|animal|rescue|paw/i.test(searchQuery)) {
      return null;
    }
  }

  const venueHint = eventVenueName(event);
  const location = parseLocation(event.address, market.state, venueHint);
  const { startDate, when } = eventDateParts(event);
  const startAt = parseEventStartAt(when, startDate);
  const eventUrl = String(event.link || "").trim() || fallbackEventUrl(title, market, location.venue_name);
  const external_id = hashExternalId(`${eventUrl}|${title}|${startAt}|${market.id}`);

  return {
    external_id,
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
    image_url: event.thumbnail || null,
    event_url: eventUrl,
    is_free: inferIsFree(title, description),
    raw_payload: event as Record<string, unknown>,
  };
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

  const parsed = Date.parse(text);
  if (!Number.isNaN(parsed) && parsed > now.getTime() - 86_400_000) {
    return new Date(parsed).toISOString();
  }

  const monthDay = text.match(
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})/i,
  );
  if (monthDay) {
    const candidate = Date.parse(`${monthDay[0]} ${now.getFullYear()}`);
    const date = new Date(candidate);
    if (date.getTime() < now.getTime()) {
      date.setFullYear(date.getFullYear() + 1);
    }
    date.setHours(11, 0, 0, 0);
    return date.toISOString();
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

async function fetchSerpGoogleEvents(
  query: string,
  location: string,
) {
  // Strip accidental quotes/whitespace from Vercel env paste.
  const apiKey = process.env.SERPAPI_API_KEY?.trim().replace(/^["']|["']$/g, "");
  if (!apiKey) {
    return {
      ok: false as const,
      skipped: true,
      events: [] as SerpEventResult[],
      error: "SERPAPI_API_KEY is not configured.",
    };
  }

  // Google retired the dedicated Events vertical (ibp=htl;events) in Aug 2026.
  // Use standard Google Search and read the events_results block instead.
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("location", location);
  url.searchParams.set("hl", "en");
  url.searchParams.set("gl", "us");
  url.searchParams.set("google_domain", "google.com");
  url.searchParams.set("api_key", apiKey);

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  let payload: {
    events_results?: SerpEventResult[];
    error?: string;
    search_information?: { events_results_state?: string };
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
      error:
        payload.error ||
        `SerpAPI request failed (${response.status}).`,
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
  await supabaseAdmin
    .from("community_event_discoveries")
    .update({
      status: "expired",
      updated_at: new Date().toISOString(),
    })
    .lt("start_at", cutoff)
    .neq("status", "expired");

  // Hard-delete very old rows to keep table lean
  await supabaseAdmin
    .from("community_event_discoveries")
    .delete()
    .lt("start_at", new Date(Date.now() - 30 * 86_400_000).toISOString());
}

async function syncOneMarket(
  market: CommunityMarketRow,
  opts?: { forceRefresh?: boolean },
) {
  const syncedAt = new Date().toISOString();
  const queries = buildMarketSearchQueries(market);
  const serpLocation = buildMarketSerpLocation(market);
  const deduped = new Map<string, ParsedDiscovery>();
  const errors: string[] = [];
  let cacheHits = 0;
  let liveSearches = 0;
  let skippedApi = false;

  const usage = await getSerpUsageToday();
  const budget = dailySerpBudget();

  for (const q of queries) {
    const queryHash = hashQuery(`${q}|${serpLocation}`);

    if (!opts?.forceRefresh) {
      const cached = await readSerpCache(market.id, queryHash);
      if (cached) {
        cacheHits += 1;
        for (const event of cached.events_results || []) {
          const parsed = normalizeSerpEvent(event, market, q);
          if (parsed) deduped.set(parsed.external_id, parsed);
        }
        continue;
      }
    }

    if (usage.searchCount + liveSearches >= budget) {
      errors.push(
        `${market.slug}: daily SerpApi budget reached (${budget}). Using cache only.`,
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

    for (const event of result.events) {
      const parsed = normalizeSerpEvent(event, market, q);
      if (parsed) deduped.set(parsed.external_id, parsed);
    }
  }

  if (skippedApi && deduped.size === 0) {
    await markMarketSyncResult({
      marketId: market.id,
      status: "skipped",
      upserted: 0,
      error: errors.join(" ") || "SERPAPI_API_KEY missing",
      successful: false,
    });
    return {
      ok: false,
      skipped: true,
      marketId: market.id,
      marketSlug: market.slug,
      upserted: 0,
      cacheHits,
      liveSearches,
      errors,
    };
  }

  const rows = Array.from(deduped.values()).map((row) => ({
    ...row,
    source: "google",
    pet_friendly: true,
    timezone: "America/New_York",
    status: "active",
    last_seen_at: syncedAt,
    synced_at: syncedAt,
    updated_at: syncedAt,
  }));

  let upserted = 0;
  if (rows.length) {
    const { error } = await supabaseAdmin
      .from("community_event_discoveries")
      .upsert(rows, { onConflict: "source,external_id" });

    if (error) {
      errors.push(error.message);
    } else {
      upserted = rows.length;
    }
  }

  await incrementSerpUsage({
    searches: liveSearches,
    cacheHits,
    marketsSynced: 1,
    eventsUpserted: upserted,
  });

  const status =
    errors.length === 0
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
    successful: status === "success" || status === "cached" || status === "partial",
  });

  return {
    ok: errors.length === 0 || upserted > 0,
    skipped: false,
    marketId: market.id,
    marketSlug: market.slug,
    upserted,
    cacheHits,
    liveSearches,
    errors,
  };
}

export async function syncGoogleCommunityEventDiscoveries(opts?: {
  marketId?: string;
  forceRefresh?: boolean;
}) {
  await expirePastDiscoveries();

  const markets = opts?.marketId
    ? ([await getCommunityMarketById(opts.marketId)].filter(Boolean) as CommunityMarketRow[])
    : await listCommunityMarkets({ enabledOnly: true });

  if (!markets.length) {
    return {
      ok: false,
      skipped: true,
      syncedAt: new Date().toISOString(),
      upserted: 0,
      markets: [] as Array<Record<string, unknown>>,
      errors: ["No enabled community markets configured."],
    };
  }

  const results = [];
  let upserted = 0;
  const errors: string[] = [];
  let skippedAll = true;

  for (const market of markets) {
    if (!market.enabled && !opts?.marketId) continue;

    const result = await syncOneMarket(market, {
      forceRefresh: opts?.forceRefresh,
    });
    results.push(result);
    upserted += result.upserted;
    errors.push(...result.errors);
    if (!result.skipped) skippedAll = false;
  }

  // Refresh counts for all touched markets
  for (const market of markets) {
    await refreshMarketDiscoveryCount(market.id);
  }

  return {
    ok: errors.length === 0 || upserted > 0,
    skipped: skippedAll,
    syncedAt: new Date().toISOString(),
    upserted,
    markets: results,
    errors,
    usage: await getSerpUsageToday(),
  };
}

/** @deprecated Use syncGoogleCommunityEventDiscoveries — kept for cron compatibility. */
export { syncGoogleCommunityEventDiscoveries as syncAllEnabledMarkets };
