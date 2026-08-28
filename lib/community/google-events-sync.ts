import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type GoogleDiscoveryCounty = "bucks" | "montgomery";

type SerpEventResult = {
  title?: string;
  date?: {
    start_date?: string;
    when?: string;
  };
  address?: string[];
  link?: string;
  thumbnail?: string;
  description?: string;
};

type ParsedDiscovery = {
  external_id: string;
  county: GoogleDiscoveryCounty;
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

const MARKET_QUERIES: Array<{ county: GoogleDiscoveryCounty; q: string }> = [
  { county: "bucks", q: "pet friendly events Bucks County Pennsylvania" },
  { county: "bucks", q: "dog adoption events Doylestown PA" },
  { county: "montgomery", q: "pet events Montgomery County Pennsylvania" },
  { county: "montgomery", q: "dog friendly events King of Prussia PA" },
];

function hashExternalId(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 40);
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

function parseLocation(addressParts: string[] | undefined) {
  const joined = (addressParts || []).filter(Boolean).join(", ");
  const venue = addressParts?.[0]?.trim() || null;
  const cityState = addressParts?.[addressParts.length - 1] || joined;
  const cityMatch = cityState.match(/^([^,]+),\s*([A-Z]{2})$/i);

  return {
    venue_name: venue,
    address_line: joined || null,
    city: cityMatch?.[1]?.trim() || null,
    state: cityMatch?.[2]?.toUpperCase() || "PA",
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

function normalizeSerpEvent(
  event: SerpEventResult,
  county: GoogleDiscoveryCounty,
  searchQuery: string,
): ParsedDiscovery | null {
  const title = String(event.title || "").trim();
  const eventUrl = String(event.link || "").trim();
  if (!title || !eventUrl) return null;

  const description = String(event.description || "").trim();
  if (!inferPetFriendly(title, description)) return null;

  const location = parseLocation(event.address);
  const startAt = parseEventStartAt(event.date?.when, event.date?.start_date);
  const external_id = hashExternalId(`${eventUrl}|${title}|${startAt}`);

  return {
    external_id,
    county,
    search_query: searchQuery,
    title,
    short_description: description || null,
    venue_name: location.venue_name,
    address_line: location.address_line,
    city: location.city,
    state: location.state,
    start_at: startAt,
    end_at: parseEventEndAt(startAt, event.date?.when),
    image_url: event.thumbnail || null,
    event_url: eventUrl,
    is_free: inferIsFree(title, description),
    raw_payload: event as Record<string, unknown>,
  };
}

async function fetchSerpGoogleEvents(query: string) {
  const apiKey = process.env.SERPAPI_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false as const,
      skipped: true,
      events: [] as SerpEventResult[],
      error: "SERPAPI_API_KEY is not configured.",
    };
  }

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_events");
  url.searchParams.set("q", query);
  url.searchParams.set("hl", "en");
  url.searchParams.set("gl", "us");
  url.searchParams.set("api_key", apiKey);

  const response = await fetch(url.toString(), {
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    return {
      ok: false as const,
      skipped: false,
      events: [] as SerpEventResult[],
      error: `SerpAPI request failed (${response.status}).`,
    };
  }

  const payload = (await response.json()) as {
    events_results?: SerpEventResult[];
    error?: string;
  };

  if (payload.error) {
    return {
      ok: false as const,
      skipped: false,
      events: [] as SerpEventResult[],
      error: payload.error,
    };
  }

  return {
    ok: true as const,
    skipped: false,
    events: Array.isArray(payload.events_results) ? payload.events_results : [],
    error: null,
  };
}

export async function syncGoogleCommunityEventDiscoveries() {
  const syncedAt = new Date().toISOString();
  const deduped = new Map<string, ParsedDiscovery>();
  const errors: string[] = [];
  let skippedApi = false;

  for (const { county, q } of MARKET_QUERIES) {
    const result = await fetchSerpGoogleEvents(q);
    if (result.skipped) {
      skippedApi = true;
      errors.push(result.error || "SerpAPI skipped.");
      break;
    }

    if (!result.ok) {
      errors.push(`${county}: ${result.error}`);
      continue;
    }

    for (const event of result.events) {
      const parsed = normalizeSerpEvent(event, county, q);
      if (!parsed) continue;
      deduped.set(parsed.external_id, parsed);
    }
  }

  if (skippedApi) {
    return {
      ok: false,
      skipped: true,
      syncedAt,
      upserted: 0,
      errors,
    };
  }

  const rows = Array.from(deduped.values()).map((row) => ({
    ...row,
    source: "google",
    pet_friendly: true,
    timezone: "America/New_York",
    last_seen_at: syncedAt,
    synced_at: syncedAt,
    updated_at: syncedAt,
  }));

  if (rows.length) {
    const { error } = await supabaseAdmin
      .from("community_event_discoveries")
      .upsert(rows, { onConflict: "source,external_id" });

    if (error) {
      errors.push(error.message);
    }
  }

  await supabaseAdmin
    .from("community_event_discoveries")
    .delete()
    .lt("start_at", new Date(Date.now() - 7 * 86_400_000).toISOString());

  return {
    ok: errors.length === 0,
    skipped: false,
    syncedAt,
    upserted: rows.length,
    errors,
  };
}
