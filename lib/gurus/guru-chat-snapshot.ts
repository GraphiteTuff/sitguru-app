/**
 * Client-safe Guru chat snapshot types + [[guru_card:]] encode/decode.
 * Do NOT import supabaseAdmin / service-role clients from here.
 */

export type GuruChatSnapshot = {
  id: string;
  name: string;
  slug: string;
  photoUrl: string | null;
  services: string[];
  rate: number | null;
  location: string;
  rating: number | null;
  reviewCount: number;
  canBook: boolean;
  profileUrl: string;
  bookingUrl: string | null;
  blurb: string | null;
};

export type LookupGurusParams = {
  service?: string;
  city?: string;
  state?: string;
  zip?: string;
  name?: string;
  limit?: number;
};

export type LookupGurusResult = {
  query: LookupGurusParams;
  count: number;
  gurus: GuruChatSnapshot[];
  searchUrl: string;
  note?: string;
};

/** Matches complete + slightly messy model-emitted guru card markers.
 *  Allow any chars (incl. newlines) until closing ]] — long base64 often wraps. */
export const GURU_CARD_MARKER_PATTERN =
  /(?:`{1,3})?\[\[\s*guru_card\s*:\s*([\s\S]*?)\]\](?:`{1,3})?/gi;

/** Incomplete / truncated markers (no closing brackets) — strip from UI. */
const GURU_CARD_ORPHAN_PATTERN =
  /(?:`{1,3})?\[\[\s*guru_card\s*:[^\[]{8,}?(?=$|\n\n|\[\[)/gi;

/** Catch leftover base64 crumbs after a broken orphan strip. */
const GURU_CARD_CRUMB_PATTERN =
  /(?:^|\s)(?:eyJ|ewog)[A-Za-z0-9_+\/= \t\r\n-]{20,}(?:\]\])?/g;

function sanitizeCardPayload(payload: string) {
  return String(payload || "").replace(/[^A-Za-z0-9_+\/=-]/g, "");
}

function toBase64Url(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(payload: string) {
  const cleaned = String(payload || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const pad =
    cleaned.length % 4 === 0 ? "" : "=".repeat(4 - (cleaned.length % 4));
  const binary = atob(cleaned + pad);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Compact wire format — keeps markers short so models don't truncate mid-token. */
type CompactGuruCard = {
  i?: string;
  n: string;
  s: string;
  p?: string | null;
  v?: string[];
  r?: number | null;
  l?: string;
  a?: number | null;
  c?: number;
  b?: boolean;
  u?: string;
  k?: string | null;
};

function toCompact(guru: GuruChatSnapshot): CompactGuruCard {
  // Keep photo URLs when present — chat UI appends markers server-side so
  // length is fine (model copy-paste is no longer the only path).
  const photo =
    guru.photoUrl && guru.photoUrl.length <= 480 ? guru.photoUrl : null;
  return {
    i: guru.id,
    n: guru.name,
    s: guru.slug,
    p: photo,
    v: guru.services.slice(0, 3),
    r: guru.rate,
    l: guru.location,
    a: guru.rating,
    c: guru.reviewCount,
    b: guru.canBook,
    u: guru.profileUrl || `/guru/${guru.slug}`,
    k: guru.bookingUrl,
  };
}

function fromCompact(
  raw: CompactGuruCard | GuruChatSnapshot,
): GuruChatSnapshot | null {
  // Support both compact wire format and legacy full snapshots.
  if ("slug" in raw && "name" in raw && raw.slug && raw.name) {
    const full = raw as GuruChatSnapshot;
    return {
      id: full.id || full.slug,
      name: full.name,
      slug: full.slug,
      photoUrl: full.photoUrl ?? null,
      services: Array.isArray(full.services) ? full.services : [],
      rate: full.rate ?? null,
      location: full.location || "Local area",
      rating: full.rating ?? null,
      reviewCount: full.reviewCount || 0,
      canBook: Boolean(full.canBook),
      profileUrl: full.profileUrl || `/guru/${full.slug}`,
      bookingUrl: full.bookingUrl ?? null,
      blurb: full.blurb ?? null,
    };
  }

  const compact = raw as CompactGuruCard;
  const slug = String(compact.s || "").trim();
  const name = String(compact.n || "").trim();
  if (!slug || !name) return null;

  return {
    id: String(compact.i || slug),
    name,
    slug,
    photoUrl: compact.p ?? null,
    services: Array.isArray(compact.v) ? compact.v : [],
    rate: compact.r ?? null,
    location: compact.l || "Local area",
    rating: compact.a ?? null,
    reviewCount: compact.c || 0,
    canBook: Boolean(compact.b),
    profileUrl: compact.u || `/guru/${slug}`,
    bookingUrl: compact.k ?? null,
    blurb: null,
  };
}

/** Encode snapshot for chat marker parsing. */
export function encodeGuruCardMarker(guru: GuruChatSnapshot): string {
  const payload = toBase64Url(JSON.stringify(toCompact(guru)));
  return `[[guru_card:${payload}]]`;
}

export function decodeGuruCardMarker(payload: string): GuruChatSnapshot | null {
  try {
    const parsed = JSON.parse(fromBase64Url(payload)) as
      | CompactGuruCard
      | GuruChatSnapshot;
    return fromCompact(parsed);
  } catch {
    return null;
  }
}

/**
 * Pull every [[guru_card:...]] out of assistant text, decode cards, and
 * return cleaned copy with markers fully removed (including truncated ones).
 */
export function extractGuruCardsFromText(raw: string): {
  text: string;
  cards: GuruChatSnapshot[];
} {
  let text = String(raw || "");
  const cards: GuruChatSnapshot[] = [];
  const seen = new Set<string>();

  text = text.replace(GURU_CARD_MARKER_PATTERN, (_full, payload: string) => {
    const card = decodeGuruCardMarker(sanitizeCardPayload(payload));
    if (card && !seen.has(card.slug)) {
      seen.add(card.slug);
      cards.push(card);
    }
    return " ";
  });
  GURU_CARD_MARKER_PATTERN.lastIndex = 0;

  // Never leave raw token fragments in the bubble.
  text = text.replace(GURU_CARD_ORPHAN_PATTERN, " ");
  GURU_CARD_ORPHAN_PATTERN.lastIndex = 0;
  text = text.replace(GURU_CARD_CRUMB_PATTERN, " ");
  GURU_CARD_CRUMB_PATTERN.lastIndex = 0;
  text = text.replace(/\bmarker\s*:\s*/gi, " ");

  text = text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return { text, cards };
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

/** Heuristic parse of free-text chat into lookup filters (simulation / hints). */
export function inferLookupParamsFromChat(
  rawText?: string | null,
): LookupGurusParams | null {
  const text = clean(rawText);
  if (!text) return null;
  const lowerText = text.toLowerCase();

  const zipMatch = text.match(/\b(\d{5})(?:-\d{4})?\b/);
  const zip = zipMatch?.[1];

  const nameMatch =
    text.match(
      /\b(?:guru|sitter|walker|trainer)\s+(?:named|called)\s+([A-Za-z][A-Za-z' -]{1,40})/i,
    ) ||
    text.match(/\bfind\s+([A-Za-z][A-Za-z' -]{1,40})\b/i);
  const name = nameMatch?.[1]?.trim();

  let city: string | undefined;
  let state: string | undefined;
  const nearMatch = text.match(
    /\b(?:near|in|around|at)\s+([A-Za-z][A-Za-z .'-]{1,40}?)(?:,?\s*([A-Z]{2})\b)?/i,
  );
  if (nearMatch?.[1]) {
    const maybe = clean(nearMatch[1])
      .replace(/\b(zip|area|my|the)\b/gi, "")
      .trim();
    if (
      maybe &&
      !/^(dog|pet|walks?|drop|overnight|boarding|care|home|town)$/i.test(maybe)
    ) {
      city = maybe;
    }
    if (nearMatch[2]) state = nearMatch[2].toUpperCase();
  }
  const stateOnly = text.match(/\b(?:in|near)\s+([A-Z]{2})\b/);
  if (!state && stateOnly?.[1]) state = stateOnly[1];

  let service: string | undefined;
  if (/\bwalk/.test(lowerText)) service = "Dog Walking";
  else if (/\bdrop[- ]?in|\bvisit/.test(lowerText)) service = "Drop-In Visits";
  else if (/\bovernight|\bhouse\s*sit/.test(lowerText)) {
    service = "House Sitting";
  } else if (/\bboard/.test(lowerText)) service = "Boarding";
  else if (/\btrain/.test(lowerText)) service = "Training Support";
  else if (/\bday\s*care|\bdaycare/.test(lowerText)) {
    service = "Doggy Day Care";
  }

  if (!service && !city && !state && !zip && !name) return null;
  return { service, city, state, zip, name, limit: 3 };
}
