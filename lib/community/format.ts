import { COMMUNITY_MARKET_SEEDS } from "@/lib/community/market-seed";
import type { CommunityEventRow } from "@/lib/community/types";

export function formatEventDateRange(
  startAt: string,
  endAt: string | null,
  timezone?: string | null,
) {
  const start = new Date(startAt);
  const end = endAt ? new Date(endAt) : null;

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: timezone || undefined,
  });

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone || undefined,
  });

  const dateLabel = dateFormatter.format(start);
  const startTime = timeFormatter.format(start);
  const endTime = end ? timeFormatter.format(end) : null;

  return {
    dateLabel,
    timeLabel: endTime ? `${startTime} – ${endTime}` : startTime,
    compactDate: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      timeZone: timezone || undefined,
    }).format(start),
    bannerDate: new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: timezone || undefined,
    }).format(start),
    badgeMonth: new Intl.DateTimeFormat("en-US", {
      month: "short",
      timeZone: timezone || undefined,
    })
      .format(start)
      .toUpperCase(),
    badgeDay: new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      timeZone: timezone || undefined,
    }).format(start),
  };
}

/** Local calendar YYYY-MM-DD for date inputs / day comparisons. */
export function toLocalDateInputValue(value: string | Date | null | undefined) {
  const date = value instanceof Date ? value : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Match an event when its start day falls within optional From/To (inclusive).
 * Empty bounds are ignored.
 */
export function eventMatchesDateRange(
  event: Pick<CommunityEventRow, "start_at" | "end_at">,
  dateFrom?: string | null,
  dateTo?: string | null,
) {
  const from = String(dateFrom || "").trim();
  const to = String(dateTo || "").trim();
  if (!from && !to) return true;

  const startDay = toLocalDateInputValue(event.start_at);
  if (!startDay) return false;

  if (from && startDay < from) return false;
  if (to && startDay > to) return false;
  return true;
}

export function formatEventLocation(event: Pick<
  CommunityEventRow,
  "venue_name" | "city" | "state" | "address_line_1"
>) {
  const cityState = [event.city, event.state].filter(Boolean).join(", ");
  const venue = event.venue_name?.trim();

  if (venue && cityState) return `${venue}\n${cityState}`;
  return venue || cityState || event.address_line_1 || "Location TBA";
}

export function formatEventLocationInline(event: Pick<
  CommunityEventRow,
  "venue_name" | "city" | "state"
>) {
  const cityState = [event.city, event.state].filter(Boolean).join(", ");
  const venue = event.venue_name?.trim();

  if (venue && cityState) return `${venue}, ${cityState}`;
  return venue || cityState || "Location TBA";
}

/** Normalize "Bucks County" / "bucks" for matching. */
export function normalizeCountyQuery(value: string) {
  return value
    .toLowerCase()
    .replace(/\bcounty\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveCountyFromCity(city: string | null | undefined) {
  const needle = city?.trim().toLowerCase();
  if (!needle) return null;
  const seed = COMMUNITY_MARKET_SEEDS.find(
    (market) =>
      market.city.toLowerCase() === needle ||
      market.city_anchors.some((anchor) => anchor.toLowerCase() === needle),
  );
  return seed?.county_name || null;
}

/** County label stamped on discoveries (`featured_market_city`) or city→county map. */
export function getEventCountyLabel(
  event: Pick<
    CommunityEventRow,
    "city" | "featured_market_city"
  > & {
    partners?: { city?: string | null } | null;
  },
) {
  const stamped = event.featured_market_city?.trim();
  if (stamped && /county/i.test(stamped)) return stamped;
  if (stamped) {
    return resolveCountyFromCity(stamped) || stamped;
  }
  return (
    resolveCountyFromCity(event.city) ||
    resolveCountyFromCity(event.partners?.city) ||
    event.city?.trim() ||
    event.partners?.city?.trim() ||
    null
  );
}

export function eventMatchesCounty(
  event: Pick<
    CommunityEventRow,
    "city" | "featured_market_city"
  > & {
    partners?: { city?: string | null } | null;
  },
  countyQuery: string,
) {
  const needle = normalizeCountyQuery(countyQuery);
  if (!needle) return true;

  const haystacks = [
    getEventCountyLabel(event),
    event.featured_market_city,
    event.partners?.city,
    event.city,
  ]
    .filter(Boolean)
    .map((value) => normalizeCountyQuery(String(value)));

  return haystacks.some(
    (haystack) =>
      haystack.includes(needle) ||
      needle.includes(haystack) ||
      haystack.startsWith(needle),
  );
}

/** County (or city fallback), State — shown under event titles on cards. */
export function formatEventCountyState(
  event: Pick<
    CommunityEventRow,
    "city" | "state" | "featured_market_city" | "featured_market_state"
  > & {
    partners?: { city?: string | null; state?: string | null } | null;
  },
) {
  const countyOrCity = getEventCountyLabel(event);
  const state =
    event.featured_market_state?.trim() ||
    event.partners?.state?.trim() ||
    event.state?.trim() ||
    null;

  if (countyOrCity && state) return `${countyOrCity}, ${state}`;
  return countyOrCity || state || "Location TBA";
}

export function isUpcomingEvent(event: Pick<CommunityEventRow, "start_at" | "status" | "cancelled_at">) {
  if (event.status === "cancelled" || event.cancelled_at) return false;
  return new Date(event.start_at).getTime() >= Date.now() - 6 * 60 * 60 * 1000;
}

export function isPastEvent(event: Pick<CommunityEventRow, "start_at">) {
  return new Date(event.start_at).getTime() < Date.now() - 6 * 60 * 60 * 1000;
}

export function getEventCardImage(event: Pick<
  CommunityEventRow,
  "image_card_url" | "image_hero_url" | "image_original_url" | "image_mobile_url"
>) {
  return (
    event.image_card_url ||
    event.image_hero_url ||
    event.image_mobile_url ||
    event.image_original_url ||
    null
  );
}

export function getEventHeroImage(event: Pick<
  CommunityEventRow,
  "image_hero_url" | "image_original_url" | "image_mobile_url" | "image_card_url"
>) {
  return (
    event.image_hero_url ||
    event.image_original_url ||
    event.image_mobile_url ||
    event.image_card_url ||
    null
  );
}
