/**
 * Live current + upcoming Pet Events snapshot for Delilah (Pet Event Coordinator).
 * Server-only — uses supabaseAdmin via community query helpers.
 */

import type { CommunityEventCompanionContext } from "@/lib/ai/community-events-faqs";
import { fetchDiscoveredHomepageEvents } from "@/lib/community/discovered-events";
import { lookupCityLocation } from "@/lib/location/zip-lookup";
import { isGoogleDiscoveryEvent } from "@/lib/community/event-preview";
import {
  formatEventDateRange,
  formatEventLocationInline,
} from "@/lib/community/format";
import { fetchPublicEventBySlug } from "@/lib/community/queries";
import type { CommunityEventWithPartner } from "@/lib/community/types";

export type DelilahEventsSnapshotOpts = {
  city?: string;
  state?: string;
  limit?: number;
  /** Prefer highlighting this event (detail page / chat seed). */
  focus?: CommunityEventCompanionContext;
};

function milesBetween(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
) {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(toLat - fromLat);
  const dLng = toRad(toLng - fromLng);
  const lat1 = toRad(fromLat);
  const lat2 = toRad(toLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function eventKindLabel(event: CommunityEventWithPartner) {
  return isGoogleDiscoveryEvent(event)
    ? "Pet Event (discovery)"
    : "SitGuru Partner Event";
}

function formatEventDetailLines(event: CommunityEventWithPartner): string[] {
  const { dateLabel, timeLabel } = formatEventDateRange(
    event.start_at,
    event.end_at,
    event.timezone,
  );
  const location = formatEventLocationInline(event);
  const partnerName = event.partners?.business_name?.trim();
  const freeLabel =
    event.is_free === true
      ? "Free"
      : event.is_free === false
        ? "Tickets / registration may apply"
        : "Price TBA";
  const flags = [
    event.pet_friendly ? "Pet friendly" : null,
    event.family_friendly ? "Family friendly" : null,
    event.outdoor ? "Outdoor" : null,
  ].filter(Boolean);

  const lines = [
    `### ${event.title}`,
    `- Type: ${eventKindLabel(event)}`,
    `- When: ${dateLabel} · ${timeLabel}${event.timezone ? ` (${event.timezone})` : ""}`,
    `- Where: ${location}`,
    partnerName && !isGoogleDiscoveryEvent(event)
      ? `- Host / partner: ${partnerName}`
      : null,
    `- Cost: ${freeLabel}`,
    flags.length ? `- Flags: ${flags.join(", ")}` : null,
    event.categories?.length
      ? `- Categories: ${event.categories.join(", ")}`
      : null,
    event.event_type && !isGoogleDiscoveryEvent(event)
      ? `- Event type: ${event.event_type}`
      : null,
    event.short_description
      ? `- Summary: ${event.short_description.trim()}`
      : null,
    event.ticket_url ? `- Tickets / registration: ${event.ticket_url}` : null,
    event.event_url && isGoogleDiscoveryEvent(event)
      ? `- External listing: ${event.event_url}`
      : null,
    `- Open it from Pet Events by the event name. Do not paste a link or path.`,
    `- Event id: ${event.id}`,
  ].filter(Boolean) as string[];

  return lines;
}

/**
 * Compile a markdown digest of current + upcoming published Pet Events
 * for Delilah's system prompt. Prefer Partner Events first, then discoveries.
 */
export async function compileDelilahEventsSnapshot(
  opts: DelilahEventsSnapshotOpts = {},
): Promise<{ markdownContext: string; count: number }> {
  const limit = Math.min(Math.max(opts.limit ?? 24, 12), 40);

  const scraped = await fetchDiscoveredHomepageEvents({
    limit: 80,
    homepageEligibleOnly: false,
  }).catch(() => ({ events: [] as CommunityEventWithPartner[], lastSyncedAt: null }));

  const pool = (scraped.events || []).filter((event) => event.pet_friendly !== false);

  const origin =
    opts.city && opts.state
      ? await lookupCityLocation(opts.city, opts.state).catch(() => null)
      : null;

  const ranked = pool
    .map((event) => {
      const lat = event.latitude;
      const lng = event.longitude;
      const miles =
        origin?.latitude != null &&
        origin.longitude != null &&
        lat != null &&
        lng != null
          ? milesBetween(origin.latitude, origin.longitude, lat, lng)
          : null;
      const sameCity = Boolean(
        opts.city && event.city?.toLowerCase() === opts.city.toLowerCase(),
      );
      const sameState = Boolean(
        opts.state && event.state?.toUpperCase() === opts.state.toUpperCase(),
      );
      return { event, miles, sameCity, sameState };
    })
    .sort((a, b) => {
      if (a.miles != null && b.miles != null && Math.abs(a.miles - b.miles) > 5) {
        return a.miles - b.miles;
      }
      if (a.sameCity !== b.sameCity) return a.sameCity ? -1 : 1;
      if (a.sameState !== b.sameState) return a.sameState ? -1 : 1;
      if (a.miles != null && b.miles != null) return a.miles - b.miles;
      return new Date(a.event.start_at).getTime() - new Date(b.event.start_at).getTime();
    })
    .slice(0, limit);

  const upcoming = ranked.map((row) => row.event);
  const milesById = new Map(ranked.map((row) => [row.event.id, row.miles]));
  const nearbyScope: "nearest" | "upcoming" = origin ? "nearest" : "upcoming";

  let focusEvent: CommunityEventWithPartner | null = null;
  const focusSlug = opts.focus?.slug?.trim();
  if (focusSlug) {
    focusEvent =
      upcoming.find((e) => e.slug === focusSlug) ||
      (await fetchPublicEventBySlug(focusSlug).catch(() => null));
  }

  const lines: string[] = [
    "# HOMEPAGE EVENT SCRAPER — ALL NEAREST PET-FRIENDLY PLACES AND DATES",
    `_Every pet-friendly listing below is from the homepage event scraper, not only Bucks or Montgomery County. Include each place, date, and time. Never invent venues, times, or prices._`,
    `- Guest city: ${opts.city || "not given yet"}`,
    `- Guest state: ${opts.state || "not given yet"}`,
    `- Rank: ${nearbyScope === "nearest" ? "nearest to the guest, then soonest date" : "soonest upcoming, any county, until they name a city"}`,
    `- Upcoming listed: ${upcoming.length}`,
    "",
    "RECOMMEND:",
    opts.city || opts.state
      ? "- List every event in this digest, nearest first. For each one say the place, city, date, time, and miles when a distance is listed. Invite them to open the SitGuru path and RSVP. Do not narrow the answer to Bucks County or Montgomery County unless those rows are actually the nearest."
      : "- They have not named a city yet. Ask for city and state before you call a list nearby. These rows are scraped pet-friendly events from every county in the feed.",
    "- If this digest is empty, say the scraper has no upcoming pet-friendly events to recommend and point them to /events and /events/host. Do not invent a listing.",
    "",
    "RULES:",
    "- Use the full scraper feed. Bucks and Montgomery are only included when they are actually near the guest.",
    "- If an event is missing here, say to browse /events or check back soon — do not invent it.",
    "- For discovery listings, send guests to the external listing URL when they need tickets or host rules.",
    "",
  ];

  if (focusEvent) {
    lines.push("# CURRENT EVENT ON THIS PAGE (full detail)");
    lines.push(...formatEventDetailLines(focusEvent));
    lines.push("");
  } else if (opts.focus?.title || opts.focus?.slug) {
    lines.push("# CURRENT EVENT ON THIS PAGE");
    if (opts.focus.title) lines.push(`- Title: ${opts.focus.title}`);
    if (opts.focus.slug) lines.push(`- Slug: ${opts.focus.slug}`);
    if (opts.focus.eventId) lines.push(`- Id: ${opts.focus.eventId}`);
    if (opts.focus.city || opts.focus.state) {
      lines.push(
        `- Area: ${[opts.focus.city, opts.focus.state].filter(Boolean).join(", ")}`,
      );
    }
    lines.push(
      "- Full row not found in live published feed — use FAQ guidance and /events.",
    );
    lines.push("");
  }

  lines.push("# NEAREST UPCOMING SCRAPED EVENTS");
  if (!upcoming.length) {
    lines.push("_The homepage event scraper has no upcoming events in this snapshot._");
  } else {
    for (const event of upcoming) {
      const detail = formatEventDetailLines(event);
      const miles = milesById.get(event.id);
      if (miles != null) {
        detail.splice(3, 0, `- About ${Math.round(miles)} miles from the guest`);
      }
      lines.push(...detail);
      lines.push("");
    }
  }

  return {
    markdownContext: lines.join("\n").trim(),
    count: upcoming.length,
  };
}
