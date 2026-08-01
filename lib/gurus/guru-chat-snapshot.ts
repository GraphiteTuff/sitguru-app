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
  const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
  const pad =
    padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Encode snapshot for chat marker parsing. */
export function encodeGuruCardMarker(guru: GuruChatSnapshot): string {
  const payload = toBase64Url(JSON.stringify(guru));
  return `[[guru_card:${payload}]]`;
}

export function decodeGuruCardMarker(payload: string): GuruChatSnapshot | null {
  try {
    const parsed = JSON.parse(fromBase64Url(payload)) as GuruChatSnapshot;
    if (!parsed?.slug || !parsed?.name) return null;
    return parsed;
  } catch {
    return null;
  }
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
