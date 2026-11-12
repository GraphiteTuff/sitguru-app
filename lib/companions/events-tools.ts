/**
 * Live Pet Events query tools for Delilah.
 * Prefer county-filtered DB queries over truncated prompt digests.
 */

import {
  eventMatchesCounty,
  formatEventDateRange,
  formatEventLocationInline,
  getEventCountyLabel,
} from "@/lib/community/format";
import { fetchDiscoveredHomepageEvents } from "@/lib/community/discovered-events";
import { fetchPublicEvents } from "@/lib/community/queries";
import { mergeUniqueCommunityEvents } from "@/lib/community/dedupe-events";
import { isGoogleDiscoveryEvent } from "@/lib/community/event-preview";
import type { CommunityEventWithPartner } from "@/lib/community/types";
import { EVENTS_PATH } from "@/lib/companions/canonical";

export type EventQueryInput = {
  city?: string | null;
  state?: string | null;
  county?: string | null;
  /** ISO date YYYY-MM-DD optional lower bound */
  dateFrom?: string | null;
  /** ISO date YYYY-MM-DD optional upper bound */
  dateTo?: string | null;
  limit?: number;
  offset?: number;
};

export type EventQueryCard = {
  id: string;
  title: string;
  path: string;
  when: string;
  where: string;
  county: string;
  miles: number | null;
  isPartner: boolean;
};

export type EventQueryResult = {
  total: number;
  returned: number;
  offset: number;
  countyLabel: string | null;
  cards: EventQueryCard[];
  createEventPath: string;
  browsePath: string;
};

/** Neighborhoods that are inside Philadelphia County (never Montgomery). */
const PHILADELPHIA_NEIGHBORHOODS = new Set(
  [
    "manayunk",
    "fishtown",
    "south philly",
    "south philadelphia",
    "university city",
    "center city",
    "northern liberties",
    "kensington",
    "roxborough",
    "chestnut hill",
    "germantown",
    "mount airy",
  ].map((s) => s.toLowerCase()),
);

export function normalizeRequestedCounty(input: {
  city?: string | null;
  county?: string | null;
}): string | null {
  const county = String(input.county || "").trim();
  if (county) return county;
  const city = String(input.city || "").trim().toLowerCase();
  if (!city) return null;
  if (
    city === "philadelphia" ||
    city === "philly" ||
    PHILADELPHIA_NEIGHBORHOODS.has(city)
  ) {
    return "Philadelphia County";
  }
  return null;
}

/** Straight-line miles from geocoded coordinates only. */
export function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function eventPath(event: CommunityEventWithPartner) {
  if (isGoogleDiscoveryEvent(event)) {
    return event.event_url || EVENTS_PATH;
  }
  return `/events/${event.slug}`;
}

function inDateWindow(
  event: CommunityEventWithPartner,
  dateFrom?: string | null,
  dateTo?: string | null,
) {
  const start = new Date(event.start_at).getTime();
  if (Number.isNaN(start)) return false;
  if (dateFrom) {
    const from = new Date(`${dateFrom}T00:00:00`).getTime();
    if (!Number.isNaN(from) && start < from) return false;
  }
  if (dateTo) {
    const to = new Date(`${dateTo}T23:59:59`).getTime();
    if (!Number.isNaN(to) && start > to) return false;
  }
  return true;
}

/**
 * Query the full live events corpus (partner + discovery), filter by county
 * first, then paginate. Never silently substitutes nearby counties.
 */
export async function queryLivePetEvents(
  input: EventQueryInput = {},
): Promise<EventQueryResult> {
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
  const offset = Math.max(input.offset ?? 0, 0);
  const countyLabel = normalizeRequestedCounty({
    city: input.city,
    county: input.county,
  });

  const [partner, discovered] = await Promise.all([
    fetchPublicEvents({
      city: input.city || undefined,
      state: input.state || undefined,
      limit: 200,
      from: input.dateFrom
        ? new Date(`${input.dateFrom}T00:00:00`).toISOString()
        : new Date().toISOString(),
    }).catch(() => [] as CommunityEventWithPartner[]),
    fetchDiscoveredHomepageEvents({
      limit: 200,
      homepageEligibleOnly: false,
    })
      .then((res) => res.events || [])
      .catch(() => [] as CommunityEventWithPartner[]),
  ]);

  let pool = mergeUniqueCommunityEvents([
    ...(partner || []),
    ...(discovered || []),
  ]);

  pool = pool.filter((event) =>
    inDateWindow(event, input.dateFrom, input.dateTo),
  );

  if (countyLabel) {
    const matched = pool.filter((event) => eventMatchesCounty(event, countyLabel));
    // Also treat Manayunk / Philly neighborhoods as Philadelphia County even if
    // a source row was mis-stamped Montgomery.
    const neighborhoodBoost = pool.filter((event) => {
      const city = String(event.city || "").trim().toLowerCase();
      return (
        countyLabel.toLowerCase().includes("philadelphia") &&
        PHILADELPHIA_NEIGHBORHOODS.has(city)
      );
    });
    const byId = new Map<string, CommunityEventWithPartner>();
    for (const event of [...matched, ...neighborhoodBoost]) {
      byId.set(event.id, event);
    }
    pool = Array.from(byId.values());
  }

  pool.sort(
    (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
  );

  const total = pool.length;
  const page = pool.slice(offset, offset + limit);

  const cards: EventQueryCard[] = page.map((event) => {
    const { dateLabel, timeLabel } = formatEventDateRange(
      event.start_at,
      event.end_at,
      event.timezone,
    );
    return {
      id: event.id,
      title: event.title,
      path: eventPath(event),
      when: `${dateLabel} · ${timeLabel}`,
      where: formatEventLocationInline(event),
      county: getEventCountyLabel(event) || "County TBA",
      miles: null,
      isPartner: !isGoogleDiscoveryEvent(event),
    };
  });

  return {
    total,
    returned: cards.length,
    offset,
    countyLabel,
    cards,
    createEventPath: "/events/host",
    browsePath: EVENTS_PATH,
  };
}

export function formatEventQueryForReply(result: EventQueryResult): string {
  if (!result.total) {
    const where = result.countyLabel
      ? ` in **${result.countyLabel}**`
      : "";
    return `I found **0** upcoming Pet Events${where} in the live SitGuru catalog. Browse **${result.browsePath}** or create one at **${result.createEventPath}**. I won't invent nearby-county substitutes.`;
  }

  const header = result.countyLabel
    ? `Here are **${result.total}** upcoming Pet Events in **${result.countyLabel}** (showing ${result.returned}):`
    : `Here are **${result.total}** upcoming Pet Events (showing ${result.returned}):`;

  const lines = result.cards.map(
    (card, index) =>
      `${index + 1}. **${card.title}** — ${card.when} · ${card.where} · ${card.path}`,
  );

  return [
    header,
    ...lines,
    `Browse all: **${result.browsePath}** · Host/create: **${result.createEventPath}**`,
  ].join("\n");
}
