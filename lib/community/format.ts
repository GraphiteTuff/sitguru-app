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

/** County (or city fallback), State — shown under event titles on cards. */
export function formatEventCountyState(
  event: Pick<
    CommunityEventRow,
    "city" | "state" | "featured_market_city" | "featured_market_state"
  > & {
    partners?: { city?: string | null; state?: string | null } | null;
  },
) {
  const countyOrCity =
    event.featured_market_city?.trim() ||
    event.partners?.city?.trim() ||
    event.city?.trim() ||
    null;
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
