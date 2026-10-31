/**
 * Live current + upcoming Pet Events snapshot for Delilah (Pet Event Coordinator).
 * Server-only — uses supabaseAdmin via community query helpers.
 */

import type { CommunityEventCompanionContext } from "@/lib/ai/community-events-faqs";
import { buildCuratedBucksMontgomeryEventsMarkdown } from "@/lib/community/homepage-demo-events";
import { mergeUniqueCommunityEvents } from "@/lib/community/dedupe-events";
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

  let nearbyScope: "city" | "state" | "all" = opts.city ? "city" : opts.state ? "state" : "all";
  let upcoming = mergeUniqueCommunityEvents(
    partnerEvents,
    discovered.events || [],
    limit,
  );

  if (!upcoming.length && opts.city && opts.state) {
    const [statePartners, stateDiscovered] = await Promise.all([
      fetchPublicEvents({
        limit: Math.max(limit, 40),
        state: opts.state,
      }).catch(() => [] as CommunityEventWithPartner[]),
      fetchDiscoveredHomepageEvents({
        limit: Math.max(Math.floor(limit / 2), 12),
        state: opts.state,
        homepageEligibleOnly: true,
      }).catch(() => ({ events: [] as CommunityEventWithPartner[] })),
    ]);
    upcoming = mergeUniqueCommunityEvents(
      statePartners,
      stateDiscovered.events || [],
      limit,
    );
    nearbyScope = upcoming.length ? "state" : "city";
  }

  upcoming = [...upcoming].sort(
    (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
  );
  if (nearbyScope === "all") upcoming = upcoming.slice(0, 6);

  let focusEvent: CommunityEventWithPartner | null = null;
  const focusSlug = opts.focus?.slug?.trim();
  if (focusSlug) {
    focusEvent =
      upcoming.find((e) => e.slug === focusSlug) ||
      (await fetchPublicEventBySlug(focusSlug).catch(() => null));
  }

  const lines: string[] = [
    "# LIVE CURRENT & UPCOMING PET EVENTS (authoritative listing digest)",
    `_Generated for Delilah. Recommend these when guests ask what's on or what's near them. Never invent venues, times, or prices outside this digest + FAQ._`,
    `- Guest city: ${opts.city || "not given yet"}`,
    `- Guest state: ${opts.state || "not given yet"}`,
    `- Match scope: ${nearbyScope === "city" ? "this city" : nearbyScope === "state" ? "same state, because this city has no listing yet" : "upcoming SitGuru events"}`,
    `- Upcoming listed: ${upcoming.length}`,
    "",
    "RECOMMEND:",
    opts.city || opts.state
      ? "- Name 1–3 events from this digest that fit their area. Invite them to RSVP Yes / Maybe / No and bring a pet. If the city has none, say so and offer same-state events or hosting."
      : "- They have not named a city yet. Ask for city and state, then recommend. You may mention that SitGuru Pet Events are local.",
    "- If this digest is empty, encourage them to host a Partner Event at /events/host and browse /events. Do not invent a listing.",
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

  const guestState = (opts.state || "").toUpperCase();
  const showBucksMontgomery =
    !guestState || guestState === "PA" || guestState === "PENNSYLVANIA";
  if (showBucksMontgomery) {
    lines.push("");
    lines.push(buildCuratedBucksMontgomeryEventsMarkdown());
  }

  return {
    markdownContext: lines.join("\n").trim(),
    count: upcoming.length,
  };
}
