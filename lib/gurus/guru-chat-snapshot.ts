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
  /** Return the full public directory (optionally still filtered by location). */
  listAll?: boolean;
};

export type GuruDirectoryGroup = {
  stateCode: string;
  stateLabel: string;
  zip: string;
  count: number;
  names: string[];
};

export type LookupGurusResult = {
  query: LookupGurusParams;
  count: number;
  gurus: GuruChatSnapshot[];
  groups: GuruDirectoryGroup[];
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
  // Keep full card fields — server appends markers, so photo/services length is fine.
  const photo =
    guru.photoUrl && guru.photoUrl.length <= 900 ? guru.photoUrl : null;
  return {
    i: guru.id,
    n: guru.name,
    s: guru.slug,
    p: photo,
    v: guru.services.slice(0, 4),
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

/** Abbreviation keyed by lowercase name or 2-letter code. */
const US_STATE_ALIASES: Record<string, string> = {
  al: "AL",
  alabama: "AL",
  ak: "AK",
  alaska: "AK",
  az: "AZ",
  arizona: "AZ",
  ar: "AR",
  arkansas: "AR",
  ca: "CA",
  california: "CA",
  co: "CO",
  colorado: "CO",
  ct: "CT",
  connecticut: "CT",
  de: "DE",
  delaware: "DE",
  fl: "FL",
  florida: "FL",
  ga: "GA",
  georgia: "GA",
  hi: "HI",
  hawaii: "HI",
  id: "ID",
  idaho: "ID",
  il: "IL",
  illinois: "IL",
  in: "IN",
  indiana: "IN",
  ia: "IA",
  iowa: "IA",
  ks: "KS",
  kansas: "KS",
  ky: "KY",
  kentucky: "KY",
  la: "LA",
  louisiana: "LA",
  me: "ME",
  maine: "ME",
  md: "MD",
  maryland: "MD",
  ma: "MA",
  massachusetts: "MA",
  mi: "MI",
  michigan: "MI",
  mn: "MN",
  minnesota: "MN",
  ms: "MS",
  mississippi: "MS",
  mo: "MO",
  missouri: "MO",
  mt: "MT",
  montana: "MT",
  ne: "NE",
  nebraska: "NE",
  nv: "NV",
  nevada: "NV",
  nh: "NH",
  newhampshire: "NH",
  "new hampshire": "NH",
  nj: "NJ",
  newjersey: "NJ",
  "new jersey": "NJ",
  nm: "NM",
  newmexico: "NM",
  "new mexico": "NM",
  ny: "NY",
  newyork: "NY",
  "new york": "NY",
  nc: "NC",
  northcarolina: "NC",
  "north carolina": "NC",
  nd: "ND",
  northdakota: "ND",
  "north dakota": "ND",
  oh: "OH",
  ohio: "OH",
  ok: "OK",
  oklahoma: "OK",
  or: "OR",
  oregon: "OR",
  pa: "PA",
  pennsylvania: "PA",
  ri: "RI",
  rhodeisland: "RI",
  "rhode island": "RI",
  sc: "SC",
  southcarolina: "SC",
  "south carolina": "SC",
  sd: "SD",
  southdakota: "SD",
  "south dakota": "SD",
  tn: "TN",
  tennessee: "TN",
  tx: "TX",
  texas: "TX",
  ut: "UT",
  utah: "UT",
  vt: "VT",
  vermont: "VT",
  va: "VA",
  virginia: "VA",
  wa: "WA",
  washington: "WA",
  wv: "WV",
  westvirginia: "WV",
  "west virginia": "WV",
  wi: "WI",
  wisconsin: "WI",
  wy: "WY",
  wyoming: "WY",
  dc: "DC",
  "washington dc": "DC",
  "washington d c": "DC",
};

const STATE_NAME_BY_ABBR: Record<string, string> = {
  AL: "alabama",
  AK: "alaska",
  AZ: "arizona",
  AR: "arkansas",
  CA: "california",
  CO: "colorado",
  CT: "connecticut",
  DE: "delaware",
  FL: "florida",
  GA: "georgia",
  HI: "hawaii",
  ID: "idaho",
  IL: "illinois",
  IN: "indiana",
  IA: "iowa",
  KS: "kansas",
  KY: "kentucky",
  LA: "louisiana",
  ME: "maine",
  MD: "maryland",
  MA: "massachusetts",
  MI: "michigan",
  MN: "minnesota",
  MS: "mississippi",
  MO: "missouri",
  MT: "montana",
  NE: "nebraska",
  NV: "nevada",
  NH: "new hampshire",
  NJ: "new jersey",
  NM: "new mexico",
  NY: "new york",
  NC: "north carolina",
  ND: "north dakota",
  OH: "ohio",
  OK: "oklahoma",
  OR: "oregon",
  PA: "pennsylvania",
  RI: "rhode island",
  SC: "south carolina",
  SD: "south dakota",
  TN: "tennessee",
  TX: "texas",
  UT: "utah",
  VT: "vermont",
  VA: "virginia",
  WA: "washington",
  WV: "west virginia",
  WI: "wisconsin",
  WY: "wyoming",
  DC: "district of columbia",
};

const GENERIC_NAME_TOKENS = new Set([
  "a",
  "any",
  "available",
  "care",
  "guru",
  "gurus",
  "local",
  "me",
  "my",
  "nearby",
  "near",
  "pet",
  "pets",
  "sitter",
  "sitters",
  "some",
  "the",
  "walker",
  "walkers",
]);

const LOCATION_NOISE_TOKENS = new Set([
  "morning",
  "midday",
  "afternoon",
  "evening",
  "overnight",
  "flexible",
  "today",
  "tomorrow",
  "tonight",
  "walks",
  "walking",
  "visits",
  "boarding",
  "sitting",
  "training",
  "medication",
  "puppy",
  "matching",
]);

function looksLikePlaceName(value?: string | null) {
  const place = clean(value).toLowerCase();
  if (!place || place.length < 2) return false;
  if (LOCATION_NOISE_TOKENS.has(place)) return false;
  if (GENERIC_NAME_TOKENS.has(place)) return false;
  const last = place.split(/\s+/).pop() || "";
  return !LOCATION_NOISE_TOKENS.has(last) && !GENERIC_NAME_TOKENS.has(last);
}

/** Care / role words that must never become part of a city name. */
const PLACE_CITY_NOISE_RE =
  /\b(dogs?|pets?|cats?|houses?|drop[- ]?ins?|walks?|walkers?|walking|sitters?|sitting|gurus?|boarding|boards?|overnight|day\s*cares?|daycares?|training|trainers?|looking|needed?|find(?:ing)?|book(?:ing)?|want(?:ing)?|care|visits?|inns?|stays?|also|matching|please|thanks|thank|you)\b/gi;

function scrubCityNoise(city?: string | null): string {
  return clean(city)
    .replace(PLACE_CITY_NOISE_RE, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Common US city nicknames / initials → canonical city (+ default state).
 * "LA" means Los Angeles (use "Louisiana" for the state). "NYC", "Philly", "SF", etc.
 */
const US_CITY_NICKNAMES: Record<string, { city: string; state?: string }> = {
  la: { city: "Los Angeles", state: "CA" },
  "l a": { city: "Los Angeles", state: "CA" },
  nyc: { city: "New York", state: "NY" },
  "new york city": { city: "New York", state: "NY" },
  philly: { city: "Philadelphia", state: "PA" },
  philadephia: { city: "Philadelphia", state: "PA" }, // common typo
  philadelphia: { city: "Philadelphia", state: "PA" },
  sf: { city: "San Francisco", state: "CA" },
  "san fran": { city: "San Francisco", state: "CA" },
  "san francisco": { city: "San Francisco", state: "CA" },
  sd: { city: "San Diego", state: "CA" }, // when used as city token ("SD CA"); bare SD stays state
  "san diego": { city: "San Diego", state: "CA" },
  dc: { city: "Washington", state: "DC" },
  "washington dc": { city: "Washington", state: "DC" },
  "washington d c": { city: "Washington", state: "DC" },
  atl: { city: "Atlanta", state: "GA" },
  atlanta: { city: "Atlanta", state: "GA" },
  chi: { city: "Chicago", state: "IL" },
  "chi town": { city: "Chicago", state: "IL" },
  chitown: { city: "Chicago", state: "IL" },
  chicago: { city: "Chicago", state: "IL" },
  nola: { city: "New Orleans", state: "LA" },
  "new orleans": { city: "New Orleans", state: "LA" },
  vegas: { city: "Las Vegas", state: "NV" },
  "las vegas": { city: "Las Vegas", state: "NV" },
  okc: { city: "Oklahoma City", state: "OK" },
  kc: { city: "Kansas City", state: "MO" },
  "kansas city": { city: "Kansas City", state: "MO" },
  stl: { city: "St Louis", state: "MO" },
  "st louis": { city: "St Louis", state: "MO" },
  "st. louis": { city: "St Louis", state: "MO" },
  indy: { city: "Indianapolis", state: "IN" },
  jax: { city: "Jacksonville", state: "FL" },
  bmore: { city: "Baltimore", state: "MD" },
  baltimore: { city: "Baltimore", state: "MD" },
  houston: { city: "Houston", state: "TX" },
  dallas: { city: "Dallas", state: "TX" },
  austin: { city: "Austin", state: "TX" },
  miami: { city: "Miami", state: "FL" },
  seattle: { city: "Seattle", state: "WA" },
  denver: { city: "Denver", state: "CO" },
  boston: { city: "Boston", state: "MA" },
  phoenix: { city: "Phoenix", state: "AZ" },
  portland: { city: "Portland", state: "OR" },
  minneapolis: { city: "Minneapolis", state: "MN" },
  detroit: { city: "Detroit", state: "MI" },
  "san antonio": { city: "San Antonio", state: "TX" },
  satx: { city: "San Antonio", state: "TX" },
};

/** Nicknames that collide with US state abbreviations — prefer city in care chat. */
const STATE_ABBR_CITY_NICKNAMES = new Set(["la", "dc"]);

function cityNicknameKey(value?: string | null) {
  return clean(value)
    .toLowerCase()
    .replace(/[.]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function lookupCityNickname(value?: string | null) {
  const key = cityNicknameKey(value);
  if (!key) return null;
  return (
    US_CITY_NICKNAMES[key] ||
    US_CITY_NICKNAMES[key.replace(/\s+/g, "")] ||
    null
  );
}

/**
 * Expand city nicknames (LA, NYC, Philly…) and keep explicit state when provided.
 * "LA CA" → Los Angeles, CA; "NYC" → New York, NY; "Trenton NJ" stays Trenton, NJ.
 */
export function resolveUsCityState(
  cityInput?: string | null,
  stateInput?: string | null,
): { city?: string; state?: string } {
  const rawCity = scrubCityNoise(cityInput);
  const explicitState = normalizeUsState(stateInput) || undefined;
  const nick = lookupCityNickname(rawCity);

  if (nick) {
    return {
      city: nick.city,
      state: explicitState || nick.state,
    };
  }

  // Whole token was a nickname with no separate state ("NYC", "Philly", "LA").
  if (!rawCity && !explicitState) {
    return {};
  }

  if (!rawCity && explicitState) {
    // Ambiguous bare state abbr that is also a famous city nick (LA / NY / SD / DC).
    const abbrNick = lookupCityNickname(explicitState);
    if (abbrNick && STATE_ABBR_CITY_NICKNAMES.has(explicitState.toLowerCase())) {
      return { city: abbrNick.city, state: abbrNick.state };
    }
    return { state: explicitState };
  }

  return {
    city: rawCity ? titleCasePlace(rawCity) : undefined,
    state: explicitState,
  };
}

/**
 * True when free text is (or clearly ends as) a US place reply:
 * ZIP, "City ST", "City, State", etc. Used so chat never treats places as names.
 */
export function looksLikeUsLocationReply(rawText?: string | null): boolean {
  const text = clean(rawText);
  if (!text) return false;
  if (/^\d{5}(?:-\d{4})?$/.test(text)) return true;

  // Bare city nicknames: NYC, Philly, LA, SF, etc.
  const compactNick = text
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\b(near|in|around|at|please|thanks|thank you)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (lookupCityNickname(compactNick)) return true;

  // Bare state initials / names: PA, NJ, Texas, etc.
  if (compactNick.split(/\s+/).length <= 3 && isUsStateToken(compactNick)) {
    return true;
  }

  const inferred = inferLookupParamsFromChat(text);
  if (inferred?.zip && /^\d{5}$/.test(inferred.zip)) {
    // Pure ZIP or ZIP-dominant short replies
    if (text.replace(/\D/g, "").slice(0, 5) === inferred.zip && text.length <= 12) {
      return true;
    }
  }
  if (inferred?.city && inferred?.state) {
    // Whole message is basically the place (optional near/in)
    const compact = compactNick;
    const placeCompact = `${inferred.city} ${inferred.state}`.toLowerCase();
    const placeFull = `${inferred.city} ${usStateDisplayName(inferred.state)}`.toLowerCase();
    if (
      compact === placeCompact ||
      compact === placeFull ||
      compact === `${inferred.city}, ${inferred.state}`.toLowerCase()
    ) {
      return true;
    }
    // Short replies that parse cleanly as city+state (≤ 5 tokens)
    if (
      compact.split(" ").length <= 5 &&
      !/\b(need|looking|find|book|want|walk|sit|board)\b/i.test(compact)
    ) {
      return Boolean(scrubCityNoise(inferred.city));
    }
  }
  if (inferred?.state && !inferred?.city && compactNick.split(/\s+/).length <= 3) {
    return true;
  }
  return false;
}

/** Map free-text care phrasing onto a canonical SitGuru service label. */
export function detectCareServiceLabel(rawText?: string | null): string | null {
  const lower = clean(rawText).toLowerCase();
  if (!lower) return null;
  if (/\bdrop[- ]?ins?\b|\bdrop\s*inns?\b|\bvisits?\b/.test(lower)) {
    return "Drop-In Visits";
  }
  if (
    /\b(dog\s*)?walk(er|ers|ing|s)?\b/.test(lower) ||
    /\bneed (a )?walk\b/.test(lower)
  ) {
    return "Dog Walking";
  }
  if (/\bovernight\b|\bhouse\s*sits?\b|\bhouse\s*sitting\b/.test(lower)) {
    return "House Sitting";
  }
  if (/\bboards?\b|\bboarding\b/.test(lower)) return "Boarding";
  if (/\bday\s*care\b|\bdaycare\b|\bdoggy\s*day\b/.test(lower)) {
    return "Doggy Day Care";
  }
  if (/\btrains?\b|\btrainer\b|\btraining\b/.test(lower)) {
    return "Training Support";
  }
  if (
    /\bpet\s+sitting\b|\bpet\s+sitters?\b|\bdog\s+sitters?\b|\bcat\s+sitters?\b|\bsitters?\b|\bsitting\b/.test(
      lower,
    )
  ) {
    return "Pet Sitting";
  }
  return null;
}

function stateAliasKey(value?: string | null) {
  return clean(value)
    .toLowerCase()
    .replace(/[.]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** `PA`, `pa`, and `Pennsylvania` all become `PA`. */
export function normalizeUsState(value?: string | null): string {
  const key = stateAliasKey(value);
  if (!key) return "";
  return (
    US_STATE_ALIASES[key] ||
    US_STATE_ALIASES[key.replace(/\s+/g, "")] ||
    ""
  );
}

export function isUsStateToken(value?: string | null) {
  return Boolean(normalizeUsState(value));
}

export function usStateSearchTokens(value?: string | null): string[] {
  const abbr = normalizeUsState(value);
  if (!abbr) return [];
  const full = STATE_NAME_BY_ABBR[abbr] || "";
  return [abbr.toLowerCase(), full].filter(Boolean);
}

export function usStateDisplayName(value?: string | null): string {
  const abbr = normalizeUsState(value);
  if (!abbr) return clean(value);
  const full = STATE_NAME_BY_ABBR[abbr] || "";
  if (!full) return abbr;
  const spaced = full
    .replace(/^(new|north|south|west|rhode)\s*/i, "$1 ")
    .replace(/\s+/g, " ")
    .trim();
  return spaced.replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

function splitCityState(raw: string): { city?: string; state?: string } {
  const cleaned = clean(raw)
    .replace(/\b(zip|area|my|the|please|thanks|thank you|gurus?|sitters?)\b/gi, " ")
    .replace(/[.,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return {};

  // Famous city nicknames first (LA, NYC, Philly, SF…) so they aren't eaten as states.
  const wholeNick = lookupCityNickname(cleaned);
  if (wholeNick) {
    return { city: wholeNick.city, state: wholeNick.state };
  }

  if (isUsStateToken(cleaned)) {
    // Bare "LA" / "DC" → city nick; other abbrs stay as state (PA, NJ, TX…).
    if (STATE_ABBR_CITY_NICKNAMES.has(stateAliasKey(cleaned))) {
      const nick = lookupCityNickname(cleaned);
      if (nick) return { city: nick.city, state: nick.state };
    }
    return { state: normalizeUsState(cleaned) };
  }

  const words = cleaned.split(" ");
  if (words.length >= 2) {
    const lastTwo = words.slice(-2).join(" ");
    if (isUsStateToken(lastTwo)) {
      const city = words.slice(0, -2).join(" ").trim();
      return {
        city: city || undefined,
        state: normalizeUsState(lastTwo),
      };
    }
  }

  const last = words[words.length - 1];
  if (isUsStateToken(last)) {
    const city = words.slice(0, -1).join(" ").trim();
    return {
      city: city || undefined,
      state: normalizeUsState(last),
    };
  }

  return { city: cleaned };
}

function looksLikeGuruName(value?: string | null) {
  const name = clean(value);
  if (!name || name.length < 2 || name.length > 40) return false;
  const tokens = name.toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return false;
  if (tokens.some((token) => GENERIC_NAME_TOKENS.has(token))) return false;
  if (isUsStateToken(name)) return false;
  return !/\b(in|near|around|zip|find|any|gurus?)\b/i.test(name);
}

const BECOME_GURU_INTENT =
  /\b(become|apply as|sign up as|start my|free to apply|guru profile|how do i (become|apply)|is it free)\b/i;

/** True when the visitor wants a live Guru directory (all / by state / by ZIP). */
export function looksLikeGuruDirectoryQuery(rawText?: string | null): boolean {
  const text = clean(rawText);
  if (!text) return false;
  const lowerText = text.toLowerCase();
  const hasLocationCue =
    Boolean(text.match(/\b\d{5}\b/)) ||
    /\b(in|near|around|by state|by zip|zip code)\b/i.test(text) ||
    Boolean(normalizeUsState(text));

  if (BECOME_GURU_INTENT.test(lowerText) && !hasLocationCue) return false;

  if (
    /\b((list|show|see|who are|which|all|any|find|search|browse).{0,48}gurus?|gurus?.{0,40}(in|near|around|by (state|zip)|listed|nearby)|local gurus?|every guru)\b/i.test(
      text,
    )
  ) {
    return true;
  }

  const inferred = inferLookupParamsFromChat(text);
  if (inferred?.listAll) return true;
  if (
    inferred &&
    (inferred.state || inferred.zip || inferred.city) &&
    /\b(gurus?|sitters?|walkers?|care|sitguru|book)\b/i.test(lowerText)
  ) {
    return true;
  }

  return false;
}

function cleanPlaceCapture(raw: string): string {
  return clean(raw)
    .replace(
      /\b(please|thanks|thank you|asap|today|tomorrow|tonight|this weekend|next week|morning|afternoon|evening|night|for\b.*)$/i,
      "",
    )
    .replace(/^(near|in|around|at|the|a|an)\s+/i, "")
    .replace(/[.,!?;:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const TIME_WINDOW_PLACE_NOISE =
  /^(the\s+)?(morning|afternoon|evening|night|midday|noon|tonight|today|tomorrow|weekend|flexible)s?$/i;

/** Full US state names for city+state parsing (longest-first). */
const US_STATE_FULL_NAME_PATTERN =
  "new hampshire|new jersey|new mexico|new york|north carolina|north dakota|rhode island|south carolina|south dakota|west virginia|washington dc|district of columbia|alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|ohio|oklahoma|oregon|pennsylvania|tennessee|texas|utah|vermont|virginia|washington|wisconsin|wyoming";

function isUsablePlacePhrase(cleaned: string): boolean {
  if (!cleaned || cleaned.length < 2) return false;
  if (TIME_WINDOW_PLACE_NOISE.test(cleaned)) return false;
  if (/^(the|a|an|my|our|this|that|care|need)$/i.test(cleaned)) return false;
  const parsed = splitCityState(cleaned);
  const city = scrubCityNoise(parsed.city);
  if (parsed.state && city && looksLikePlaceName(city)) return true;
  if (parsed.state && !city) return true;
  if (city && looksLikePlaceName(city) && city.length >= 2) return true;
  return false;
}

/**
 * Prefer the **most recent** city/state or ZIP in the thread so a new place
 * overrides an earlier one (Boston → New York keeps New York).
 * Ignores time phrases like "in the Morning" so they don't wipe a prior city.
 * Scrubs care words so "dog walker Quakertown PA" → Quakertown, PA.
 */
function extractPlacePhrase(text: string): string {
  const nearRe =
    /(?<![\w-])(?:near|in|around|at)\s+([A-Za-z][A-Za-z .',-]{1,80})/gi;
  const nearHits: string[] = [];
  for (const match of text.matchAll(nearRe)) {
    const cleaned = cleanPlaceCapture(match[1] || "");
    if (!isUsablePlacePhrase(cleaned)) continue;
    const parsed = splitCityState(cleaned);
    const city = scrubCityNoise(parsed.city);
    if (parsed.state && city) {
      nearHits.push(`${city} ${parsed.state}`);
    } else if (parsed.state) {
      nearHits.push(parsed.state);
    } else if (city) {
      nearHits.push(city);
    }
  }
  if (nearHits.length) return nearHits[nearHits.length - 1]!;

  // Abbreviation states: "Quakertown PA" / "Austin, TX"
  // Full names: "Los Angeles, California" — only real state tokens (never "Los Angeles" as state).
  const cityStateRe = new RegExp(
    String.raw`\b([A-Za-z][A-Za-z.'-]+(?:\s+[A-Za-z][A-Za-z.'-]+){0,3}),?\s+([A-Za-z]{2}|${US_STATE_FULL_NAME_PATTERN})\b`,
    "gi",
  );
  const cityStateHits: string[] = [];
  for (const match of text.matchAll(cityStateRe)) {
    const rawCity = cleanPlaceCapture(match[1] || "");
    const statePart = clean(match[2] || "");
    if (!rawCity || !statePart || !isUsStateToken(statePart)) continue;
    if (TIME_WINDOW_PLACE_NOISE.test(rawCity)) continue;
    const city = scrubCityNoise(rawCity);
    if (!city || !looksLikePlaceName(city)) continue;
    cityStateHits.push(`${city} ${statePart}`);
  }
  if (cityStateHits.length) return cityStateHits[cityStateHits.length - 1]!;

  // Bare nicknames: "NYC", "Philly", "LA", "SF" (optionally after near/in).
  const nickRe =
    /\b(nyc|philly|philadephia|sf|san\s*fran|nola|atl|chi(?:\s*town)?|chitown|vegas|okc|stl|indy|jax|bmore|satx|l\.?\s*a\.?|dc)\b/gi;
  const nickHits: string[] = [];
  for (const match of text.matchAll(nickRe)) {
    const nick = lookupCityNickname(match[1] || "");
    if (nick?.city && nick.state) {
      nickHits.push(`${nick.city} ${nick.state}`);
    }
  }
  if (nickHits.length) return nickHits[nickHits.length - 1]!;

  return "";
}

function titleCasePlace(value?: string | null) {
  const place = clean(value);
  if (!place) return "";
  return place
    .split(/\s+/)
    .map((word) => {
      if (/^[A-Za-z]{2}$/.test(word) && isUsStateToken(word)) {
        return normalizeUsState(word);
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/** Heuristic parse of free-text chat into lookup filters (simulation / hints). */
export function inferLookupParamsFromChat(
  rawText?: string | null,
): LookupGurusParams | null {
  const text = clean(rawText);
  if (!text) return null;
  const lowerText = text.toLowerCase();

  const listAll = /\b(all gurus?|list (the |all )?gurus?|every guru|show (me )?(the |all )?gurus?|who are (the |all )?gurus?|which gurus?)\b/i.test(
    text,
  );

  const zipMatches = [...text.matchAll(/\b(\d{5})(?:-\d{4})?\b/g)];
  // Most recent ZIP wins when the visitor updates location mid-thread.
  let zip = zipMatches.length
    ? zipMatches[zipMatches.length - 1]?.[1]
    : undefined;
  const lastZipIndex =
    zipMatches.length > 0
      ? zipMatches[zipMatches.length - 1]!.index ?? -1
      : -1;

  const namedMatch = text.match(
    /\b(?:guru|sitter|walker|trainer)\s+(?:named|called)\s+([A-Za-z][A-Za-z' -]{1,40})/i,
  );
  const findNameMatch = text.match(
    /\bfind\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/,
  );
  const name = [namedMatch?.[1], findNameMatch?.[1]]
    .map((value) => clean(value))
    .find(looksLikeGuruName);

  let city: string | undefined;
  let state: string | undefined;
  const placePhrase = extractPlacePhrase(text);
  let lastPlaceIndex = -1;
  if (placePhrase) {
    const parsed = splitCityState(placePhrase);
    const resolved = resolveUsCityState(
      scrubCityNoise(parsed.city) || parsed.city,
      parsed.state,
    );
    city = resolved.city;
    state = resolved.state;
    const cityNeedle = (city || placePhrase).toLowerCase();
    lastPlaceIndex = text.toLowerCase().lastIndexOf(cityNeedle);
    if (lastPlaceIndex < 0) {
      // Nickname forms: search the original token (nyc, la, philly…)
      const nickMatch = text.match(
        /\b(nyc|philly|sf|nola|atl|chi|vegas|okc|stl|indy|jax|bmore|satx|l\.?\s*a\.?|dc)\b/i,
      );
      if (nickMatch?.index != null) lastPlaceIndex = nickMatch.index;
    }
  } else if (!zip) {
    // Only use bare "City ST" fallback when no ZIP (avoids "drop in" → Drop, IN).
    const cityStateRe =
      /\b([A-Za-z][A-Za-z.'-]+(?:\s+[A-Za-z][A-Za-z.'-]+){0,3}),?\s+([A-Za-z]{2})\b/g;
    let lastCity = "";
    let lastState = "";
    for (const match of text.matchAll(cityStateRe)) {
      const cityPart = scrubCityNoise(cleanPlaceCapture(match[1] || ""));
      const statePart = clean(match[2] || "");
      if (
        cityPart &&
        statePart &&
        isUsStateToken(statePart) &&
        looksLikePlaceName(cityPart)
      ) {
        lastCity = cityPart;
        lastState = statePart;
        lastPlaceIndex = match.index ?? lastPlaceIndex;
      }
    }
    if (lastCity && lastState) {
      const resolved = resolveUsCityState(lastCity, lastState);
      city = resolved.city;
      state = resolved.state;
    }
  }
  if (!state && !city) {
    const bareState = text.match(
      /\b(alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming)\b/i,
    );
    const maybeBare = normalizeUsState(bareState?.[1]);
    if (maybeBare) state = maybeBare;
  }
  // Bare 2-letter state reply: "PA", "NJ", "TX" (whole message or last line/token).
  if (!state && !city && !zip) {
    const lines = text
      .split(/\n+/)
      .map((line) =>
        line
          .replace(/[.,!?]/g, " ")
          .replace(/\b(near|in|around|at|please|thanks|thank you)\b/gi, " ")
          .replace(/\s+/g, " ")
          .trim(),
      )
      .filter(Boolean);
    const candidates = [
      ...lines.slice(-1),
      lines[lines.length - 1]?.split(/\s+/).slice(-1)[0] || "",
    ].filter(Boolean);

    for (const only of candidates) {
      if (lookupCityNickname(only) && STATE_ABBR_CITY_NICKNAMES.has(stateAliasKey(only))) {
        const nick = lookupCityNickname(only);
        if (nick) {
          city = nick.city;
          state = nick.state;
          break;
        }
      }
      if (only && isUsStateToken(only) && !lookupCityNickname(only)) {
        state = normalizeUsState(only) || undefined;
        break;
      }
      if (only && STATE_ABBR_CITY_NICKNAMES.has(stateAliasKey(only))) {
        const nick = lookupCityNickname(only);
        if (nick) {
          city = nick.city;
          state = nick.state;
          break;
        }
      }
    }
  }

  // If both ZIP and city/state appear, keep only the most recently mentioned one.
  if (zip && city && state) {
    if (lastPlaceIndex > lastZipIndex) {
      zip = undefined;
    } else if (lastZipIndex > lastPlaceIndex) {
      city = undefined;
      state = undefined;
    }
  }

  let service: string | undefined;
  const detectedService = detectCareServiceLabel(text);
  if (detectedService) service = detectedService;

  if (!service && !city && !state && !zip && !name && !listAll) return null;
  return {
    service,
    city,
    state,
    zip,
    name,
    listAll,
    limit: name ? 8 : 60,
  };
}
