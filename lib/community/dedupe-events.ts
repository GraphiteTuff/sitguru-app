import type { CommunityEventWithPartner } from "@/lib/community/types";

function normalizeDedupePart(value: string | null | undefined) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^(the|a|an)\s+/, "");
}

function stem(value: string, length = 32) {
  return value.slice(0, length);
}

function eventDayKey(startAt: string | null | undefined) {
  const iso = String(startAt || "");
  if (iso.length >= 10) return iso.slice(0, 10);
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return "";
  return new Date(parsed).toISOString().slice(0, 10);
}

function stableEventUrlKey(eventUrl: string | null | undefined) {
  try {
    if (!eventUrl) return "";
    const url = new URL(eventUrl);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const path = url.pathname.replace(/\/+$/, "").toLowerCase();
    if (host === "google.com" && path === "/search") return "";
    return `${host}${path}`;
  } catch {
    return "";
  }
}

type DedupeEventShape = {
  title?: string | null;
  start_at?: string | null;
  venue_name?: string | null;
  address_line_1?: string | null;
  event_url?: string | null;
  slug?: string | null;
};

/** Same physical event across overlapping counties/markets. */
export function communityEventDedupeKeys(event: DedupeEventShape) {
  const title = normalizeDedupePart(event.title);
  const day = eventDayKey(event.start_at);
  const venueStem = stem(normalizeDedupePart(event.venue_name));
  const addressStem = stem(normalizeDedupePart(event.address_line_1));
  const url = stableEventUrlKey(event.event_url);
  const keys: string[] = [];

  if (title && day && venueStem) keys.push(`venue:${title}|${day}|${venueStem}`);
  if (title && day && addressStem) {
    keys.push(`address:${title}|${day}|${addressStem}`);
  }
  if (title && day && url) keys.push(`url:${title}|${day}|${url}`);

  if (!keys.length) {
    keys.push(`slug:${title}|${day}|${normalizeDedupePart(event.slug)}`);
  }

  return keys;
}

export function communityEventDedupeKey(event: DedupeEventShape) {
  return communityEventDedupeKeys(event)[0] || "";
}

export function mergeUniqueCommunityEvents(
  primary: CommunityEventWithPartner[],
  secondary: CommunityEventWithPartner[] = [],
  limit = 48,
) {
  const seen = new Set<string>();
  const merged: CommunityEventWithPartner[] = [];

  for (const event of [...primary, ...secondary]) {
    const keys = communityEventDedupeKeys(event);
    if (keys.some((key) => seen.has(key))) continue;
    for (const key of keys) seen.add(key);
    merged.push(event);
    if (merged.length >= limit) break;
  }

  return merged;
}
