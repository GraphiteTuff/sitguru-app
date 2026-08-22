/**
 * Compact Guru lookup for Rogue chat — filter public catalog by
 * care type, city/state/zip, or name and return chat-ready snapshots.
 *
 * SERVER-ONLY: uses supabaseAdmin (service role). Never import this
 * module from `"use client"` components — use `@/lib/gurus/guru-chat-snapshot`
 * for encode/decode on the client.
 */

import { supabaseAdmin } from "@/utils/supabase/admin";
import {
  encodeGuruCardMarker,
  isUsStateToken,
  normalizeUsState,
  usStateSearchTokens,
  type GuruChatSnapshot,
  type LookupGurusParams,
  type LookupGurusResult,
} from "@/lib/gurus/guru-chat-snapshot";

export type {
  GuruChatSnapshot,
  LookupGurusParams,
  LookupGurusResult,
} from "@/lib/gurus/guru-chat-snapshot";
export {
  decodeGuruCardMarker,
  encodeGuruCardMarker,
  inferLookupParamsFromChat,
} from "@/lib/gurus/guru-chat-snapshot";

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
  const rawCity = lower(params.city);
  const city = rawCity && !isUsStateToken(rawCity) ? rawCity : "";
  const queryState = normalizeUsState(params.state || rawCity);
  const stateTokens = usStateSearchTokens(queryState);

  const guruZip = clean(
    guru.service_zip || guru.service_zip_code || guru.zip_code,
  ).replace(/\D/g, "");
  const guruCity = lower(guru.service_city || guru.city);
  const guruState = normalizeUsState(guru.service_state || guru.state);
  const hay = [
    guruCity,
    lower(guru.service_state || guru.state),
    guruState.toLowerCase(),
    guruZip,
    lower(guru.location_display),
    lower(guru.service_area),
  ].join(" ");

  if (zip) {
    if (guruZip.startsWith(zip) || hay.includes(zip)) return true;
    if (!city && !queryState) return false;
  }

  if (queryState) {
    const stateOk =
      guruState === queryState ||
      stateTokens.some((token) => token && hay.includes(token));
    if (!stateOk) return false;
  }

  if (city && !hay.includes(city) && guruCity !== city) return false;

  if (!zip && !city && !queryState) return true;
  if (city || queryState) return true;
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

function slugifyName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toSnapshot(guru: RawGuru): GuruChatSnapshot | null {
  const name = clean(guru.display_name || guru.full_name || guru.name);
  const slug = clean(guru.public_slug || guru.slug) || slugifyName(name);
  if (!name || !slug) return null;

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
  const cityRaw = clean(params.city);
  const state = normalizeUsState(params.state || cityRaw) || undefined;
  const city =
    cityRaw && !isUsStateToken(cityRaw) ? cityRaw : undefined;
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
        ? "No public Guru matches for that filter yet — say SitGuru is growing there, then send them to Explore /search or a nearby ZIP. Append [[cta:parent]]."
        : undefined,
  };
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
    "Recommend 1–3 matches in under 3 sentences. Stress they book through SitGuru and can rebook their favorite Guru anytime.",
    "REQUIRED: After your short prose, append EVERY marker line below EXACTLY (copy-paste) — one [[guru_card:...]] per Guru — then [[cta:parent]]. Never invent markers.",
    ...result.gurus.map((guru, index) => {
      const marker = encodeGuruCardMarker(guru);
      return [
        `${index + 1}. ${guru.name} (${guru.location})`,
        `   services: ${guru.services.join(", ") || "Pet care"}`,
        `   rate: ${guru.rate != null ? `$${guru.rate}` : "see profile"}`,
        `   rating: ${guru.rating != null ? `${guru.rating} (${guru.reviewCount} reviews)` : "new"}`,
        `   profile: ${guru.profileUrl}`,
        `   COPY THIS MARKER EXACTLY: ${marker}`,
      ].join("\n");
    }),
  ].join("\n");
}
