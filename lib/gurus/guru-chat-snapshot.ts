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
  if (!place || place.length < 3) return false;
  if (LOCATION_NOISE_TOKENS.has(place)) return false;
  if (GENERIC_NAME_TOKENS.has(place)) return false;
  const last = place.split(/\s+/).pop() || "";
  return !LOCATION_NOISE_TOKENS.has(last) && !GENERIC_NAME_TOKENS.has(last);
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
    .replace(/\b(zip|area|my|the|please|thanks|gurus?|sitters?)\b/gi, " ")
    .replace(/[.,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return {};

  if (isUsStateToken(cleaned)) {
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

  const zipMatch = text.match(/\b(\d{5})(?:-\d{4})?\b/);
  const zip = zipMatch?.[1];

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
  const nearMatch = text.match(
    /\b(?:near|in|around|at)\s+([A-Za-z][A-Za-z .'-]{2,40}?)(?:,?\s*([A-Za-z]{2})\b)?/i,
  );
  if (nearMatch?.[1]) {
    const parsed = splitCityState(
      [nearMatch[1], nearMatch[2]].filter(Boolean).join(" "),
    );
    city = parsed.city && looksLikePlaceName(parsed.city) ? parsed.city : undefined;
    state = parsed.state;
  }
  if (!state) {
    const stateOnly = text.match(
      /\b(?:in|near|around)\s+([A-Za-z]{2}|[A-Za-z][A-Za-z ]{2,20})\b/i,
    );
    const maybeState = normalizeUsState(stateOnly?.[1]);
    if (maybeState) state = maybeState;
  }
  if (!state) {
    const bareState = text.match(
      /\b(alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming)\b/i,
    );
    const maybeBare = normalizeUsState(bareState?.[1]);
    if (maybeBare) state = maybeBare;
  }

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
