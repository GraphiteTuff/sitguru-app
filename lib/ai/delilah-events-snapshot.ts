/**
 * Live current + upcoming Pet Events snapshot for Delilah (Pet Event Coordinator).
 * Server-only — uses supabaseAdmin via community query helpers.
 */

import type { CommunityEventCompanionContext } from "@/lib/ai/community-events-faqs";
import { buildCuratedBucksMontgomeryEventsMarkdown } from "@/lib/community/homepage-demo-events";
import { fetchDiscoveredHomepageEvents } from "@/lib/community/discovered-events";
import { isGoogleDiscoveryEvent } from "@/lib/community/event-preview";
import {
  formatEventDateRange,
  formatEventLocationInline,
} from "@/lib/community/format";
import {
  fetchPublicEventBySlug,
  fetchPublicEvents,
} from "@/lib/community/queries";
import type { CommunityEventWithPartner } from "@/lib/community/types";

export type DelilahEventsSnapshotOpts = {
  city?: string;
  state?: string;
  limit?: number;
  /** Prefer highlighting this event (detail page / chat seed). */
  focus?: CommunityEventCompanionContext;
};

function mergeUniqueEvents(
  primary: CommunityEventWithPartner[],
  secondary: CommunityEventWithPartner[],
  limit: number,
) {
  const seen = new Set<string>();
  const merged: CommunityEventWithPartner[] = [];

  for (const event of [...primary, ...secondary]) {
    const key = `${event.title}|${event.start_at}|${event.city || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(event);
    if (merged.length >= limit) break;
  }

  return merged;
}

function eventKindLabel(event: CommunityEventWithPartner) {
  return isGoogleDiscoveryEvent(event)
    ? "Pet Event (discovery)"
    : "SitGuru Partner Event";
}

function eventPath(event: CommunityEventWithPartner) {
  if (isGoogleDiscoveryEvent(event)) {
    return event.event_url || "/events";
  }
  return `/events/${event.slug}`;
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
    `- SitGuru path: ${eventPath(event)}`,
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
  const limit = Math.min(Math.max(opts.limit ?? 24, 6), 40);

  const [partnerEvents, discovered] = await Promise.all([
    fetchPublicEvents({
      limit: Math.max(limit, 40),
      city: opts.city,
      state: opts.state,
    }).catch(() => [] as CommunityEventWithPartner[]),
    fetchDiscoveredHomepageEvents({
      limit: Math.max(Math.floor(limit / 2), 12),
      city: opts.city,
      state: opts.state,
      homepageEligibleOnly: true,
    }).catch(() => ({ events: [] as CommunityEventWithPartner[] })),
  ]);

  const upcoming = mergeUniqueEvents(
    partnerEvents,
    discovered.events || [],
    limit,
  );

  let focusEvent: CommunityEventWithPartner | null = null;
  const focusSlug = opts.focus?.slug?.trim();
  if (focusSlug) {
    focusEvent =
      upcoming.find((e) => e.slug === focusSlug) ||
      (await fetchPublicEventBySlug(focusSlug).catch(() => null));
  }

  const lines: string[] = [
    "# LIVE CURRENT & UPCOMING PET EVENTS (authoritative listing digest)",
    `_Generated for Delilah. Quote these details when guests ask what's on / what's near them / details for a named event. Never invent venues, times, or prices outside this digest + FAQ._`,
    `- Focus city filter: ${opts.city || "any"}`,
    `- Focus state filter: ${opts.state || "any"}`,
    `- Upcoming listed: ${upcoming.length}`,
    "",
    "RULES:",
    "- Partner Events always lead; discoveries fill gaps.",
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

  lines.push("# UPCOMING LISTINGS (chronological)");
  if (!upcoming.length) {
    lines.push("_No upcoming published Pet Events in this snapshot right now._");
  } else {
    for (const event of upcoming) {
      lines.push(...formatEventDetailLines(event));
      lines.push("");
    }
  }

  lines.push("");
  lines.push(buildCuratedBucksMontgomeryEventsMarkdown());

  return {
    markdownContext: lines.join("\n").trim(),
    count: upcoming.length,
  };
}
