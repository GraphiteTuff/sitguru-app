/**
 * Compact Guru lookup for Rogue chat — filter public catalog by
 * care type, city/state/zip, or name and return chat-ready snapshots.
 */

import { supabaseAdmin } from "@/utils/supabase/admin";

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

type RawGuru = Record<string, unknown>;

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function lower(value: unknown) {
  return clean(value).toLowerCase();
}

function asNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => clean(v)).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => clean(v)).filter(Boolean);
      }
    } catch {
      return value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function normalizeServiceKey(value: string) {
  return lower(value)
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Map chat / marketing labels onto search service names. */
export function canonicalizeCareService(raw?: string | null): string | null {
  const key = normalizeServiceKey(raw || "");
  if (!key) return null;
  if (key.includes("walk")) return "Dog Walking";
  if (key.includes("drop") || key.includes("visit")) return "Drop-In Visits";
  if (key.includes("overnight") || key.includes("house_sit")) {
    return "House Sitting";
  }
  if (key.includes("board")) return "Boarding";
  if (key.includes("day_care") || key.includes("daycare")) {
    return "Doggy Day Care";
  }
  if (key.includes("train")) return "Training Support";
  if (key.includes("sit") && !key.includes("house")) return "Pet Sitting";
  if (key.includes("medication")) return "Medication Help";
  return clean(raw);
}

function getServiceAliases(value: string) {
  const normalized = normalizeServiceKey(value);
  const aliases = new Set([normalized]);
  if (normalized.includes("walk")) aliases.add("dog_walking");
  if (normalized.includes("drop") || normalized.includes("visit")) {
    aliases.add("drop_in_visit");
    aliases.add("drop_in_visits");
  }
  if (normalized.includes("overnight")) {
    aliases.add("house_sitting");
    aliases.add("boarding");
  }
  if (normalized.includes("house")) aliases.add("house_sitting");
  if (normalized.includes("board")) aliases.add("boarding");
  if (normalized.includes("pet_sitting") || normalized === "sitting") {
    aliases.add("pet_sitting");
  }
  if (normalized.includes("train")) aliases.add("training_support");
  return aliases;
}

function matchesService(guru: RawGuru, selectedService: string) {
  if (!selectedService) return true;
  const services = asStringArray(guru.services);
  if (!services.length) return false;
  const selected = getServiceAliases(selectedService);
  return services.some((service) => {
    const aliases = getServiceAliases(service);
    return Array.from(selected).some((alias) => aliases.has(alias));
  });
}

function matchesLocation(
  guru: RawGuru,
  params: { city?: string; state?: string; zip?: string },
) {
  const zip = clean(params.zip).replace(/\D/g, "").slice(0, 5);
  const city = lower(params.city);
  const state = lower(params.state);

  const guruZip = clean(
    guru.service_zip || guru.service_zip_code || guru.zip_code,
  ).replace(/\D/g, "");
  const guruCity = lower(guru.service_city || guru.city);
  const guruState = lower(guru.service_state || guru.state);
  const hay = [
    guruCity,
    guruState,
    guruZip,
    lower(guru.location_display),
    lower(guru.service_area),
  ].join(" ");

  if (zip) {
    if (guruZip.startsWith(zip) || hay.includes(zip)) return true;
    // keep soft match if city/state also provided
    if (!city && !state) return false;
  }
  if (city && !hay.includes(city) && guruCity !== city) return false;
  if (state) {
    const stateOk =
      guruState === state ||
      guruState.startsWith(state) ||
      hay.includes(state);
    if (!stateOk) return false;
  }
  if (!zip && !city && !state) return true;
  if (city || state) return true;
  return Boolean(zip && (guruZip.startsWith(zip) || hay.includes(zip)));
}

function matchesName(guru: RawGuru, name: string) {
  const q = lower(name);
  if (!q) return true;
  const hay = [
    guru.display_name,
    guru.full_name,
    guru.name,
    guru.slug,
    guru.public_slug,
    guru.title,
  ]
    .map(lower)
    .join(" ");
  return hay.includes(q);
}

function buildLocation(guru: RawGuru) {
  const city = clean(guru.service_city || guru.city);
  const state = clean(guru.service_state || guru.state);
  const zip = clean(guru.service_zip || guru.service_zip_code || guru.zip_code);
  const parts = [city, state].filter(Boolean).join(", ");
  return [parts, zip].filter(Boolean).join(" ") || "Local area";
}

function truncate(value: string, max = 120) {
  const text = clean(value);
  if (text.length <= max) return text || null;
  return `${text.slice(0, max - 1)}…`;
}

function toSnapshot(guru: RawGuru): GuruChatSnapshot | null {
  const slug = clean(guru.public_slug || guru.slug);
  const name = clean(guru.display_name || guru.full_name || guru.name);
  if (!slug || !name) return null;

  const canBook = Boolean(
    guru.can_book === true ||
      guru.is_bookable === true ||
      lower(guru.booking_status) === "bookable",
  );
  const profileUrl = clean(guru.profile_url) || `/guru/${slug}`;
  const bookingUrl =
    clean(guru.booking_url) || (canBook ? `/book/${slug}` : null);

  return {
    id: clean(guru.id || guru.guru_id || guru.user_id || slug),
    name,
    slug,
    photoUrl:
      clean(
        guru.profile_photo_url ||
          guru.photo_url ||
          guru.avatar_url ||
          guru.image_url,
      ) || null,
    services: asStringArray(guru.services).slice(0, 4),
    rate: asNumber(guru.hourly_rate ?? guru.rate),
    location: buildLocation(guru),
    rating: asNumber(guru.rating_avg ?? guru.rating),
    reviewCount: asNumber(guru.review_count) || 0,
    canBook,
    profileUrl,
    bookingUrl,
    blurb: truncate(clean(guru.bio || guru.title || "")),
  };
}

function buildSearchUrl(params: LookupGurusParams) {
  const qs = new URLSearchParams();
  const service = canonicalizeCareService(params.service || "") || "";
  if (service) qs.set("service", service);
  if (params.city) qs.set("city", clean(params.city));
  if (params.state) qs.set("state", clean(params.state));
  if (params.zip) qs.set("zip", clean(params.zip).replace(/\D/g, "").slice(0, 5));
  const query = qs.toString();
  return query ? `/search?${query}` : "/search";
}

async function loadPublicGuruRows(): Promise<RawGuru[]> {
  const { data, error } = await supabaseAdmin
    .from("public_guru_search_profiles")
    .select("*")
    .limit(400);

  if (!error && Array.isArray(data) && data.length > 0) {
    return data as RawGuru[];
  }

  const fallback = await supabaseAdmin.from("gurus").select("*").limit(400);
  if (fallback.error || !Array.isArray(fallback.data)) {
    console.warn(
      "[lookup-gurus] catalog load failed:",
      error?.message || fallback.error?.message,
    );
    return [];
  }
  return fallback.data as RawGuru[];
}

export async function lookupGurusForChat(
  params: LookupGurusParams,
): Promise<LookupGurusResult> {
  const limit = Math.min(Math.max(Number(params.limit) || 3, 1), 5);
  const service = canonicalizeCareService(params.service || "") || undefined;
  const city = clean(params.city) || undefined;
  const state = clean(params.state) || undefined;
  const zip = clean(params.zip).replace(/\D/g, "").slice(0, 5) || undefined;
  const name = clean(params.name) || undefined;

  const query: LookupGurusParams = {
    service,
    city,
    state,
    zip,
    name,
    limit,
  };

  if (!service && !city && !state && !zip && !name) {
    return {
      query,
      count: 0,
      gurus: [],
      searchUrl: "/search",
      note: "Ask for a care type and a city, state, or ZIP — or a Guru name — so I can fetch live matches.",
    };
  }

  const rows = await loadPublicGuruRows();
  const matched = rows
    .filter((guru) => matchesService(guru, service || ""))
    .filter((guru) => matchesLocation(guru, { city, state, zip }))
    .filter((guru) => matchesName(guru, name || ""))
    .map(toSnapshot)
    .filter((row): row is GuruChatSnapshot => Boolean(row))
    .slice(0, limit);

  return {
    query,
    count: matched.length,
    gurus: matched,
    searchUrl: buildSearchUrl(query),
    note:
      matched.length === 0
        ? "No public Guru matches for that filter yet — suggest browsing /search or widening the area."
        : undefined,
  };
}

function toBase64Url(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(payload: string) {
  const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
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
    const maybe = clean(nearMatch[1]).replace(/\b(zip|area|my|the)\b/gi, "").trim();
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
  else if (/\bovernight|\bhouse\s*sit/.test(lowerText)) service = "House Sitting";
  else if (/\bboard/.test(lowerText)) service = "Boarding";
  else if (/\btrain/.test(lowerText)) service = "Training Support";
  else if (/\bday\s*care|\bdaycare/.test(lowerText)) service = "Doggy Day Care";

  if (!service && !city && !state && !zip && !name) return null;
  return { service, city, state, zip, name, limit: 3 };
}

export function formatGuruLookupForPrompt(result: LookupGurusResult): string {
  if (!result.gurus.length) {
    return [
      "# LIVE GURU LOOKUP RESULT",
      `Query: ${JSON.stringify(result.query)}`,
      result.note || "No matches.",
      `Browse: ${result.searchUrl}`,
    ].join("\n");
  }

  return [
    "# LIVE GURU LOOKUP RESULT (authoritative for this turn)",
    `Query: ${JSON.stringify(result.query)}`,
    `Browse more: ${result.searchUrl}`,
    "Recommend 1–3 matches. Keep under 3 sentences, stress they book through SitGuru and can find/rebook their favorite Guru anytime, then append one [[guru_card:...]] marker per recommended Guru (use the exact marker strings below) plus [[cta:parent]] when they want to book.",
    ...result.gurus.map((guru, index) => {
      const marker = encodeGuruCardMarker(guru);
      return [
        `${index + 1}. ${guru.name} (${guru.location})`,
        `   services: ${guru.services.join(", ") || "Pet care"}`,
        `   rate: ${guru.rate != null ? `$${guru.rate}` : "see profile"}`,
        `   rating: ${guru.rating != null ? `${guru.rating} (${guru.reviewCount} reviews)` : "new"}`,
        `   profile: ${guru.profileUrl}`,
        `   marker: ${marker}`,
      ].join("\n");
    }),
  ].join("\n");
}
