import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type GuruRow = {
  [key: string]: unknown;
  id?: string | number | null;
  user_id?: string | null;
  email?: string | null;
  role?: string | null;
  user_role?: string | null;
  account_type?: string | null;
  slug?: string | null;
  public_slug?: string | null;
  profile_id?: string | null;
  guru_id?: string | number | null;
  name?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  title?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  service_city?: string | null;
  service_state?: string | null;
  service_zip?: string | null;
  service_zip_code?: string | null;
  status?: string | null;
  application_status?: string | null;
  admin_status?: string | null;
  public_status?: string | null;
  profile_quality_status?: string | null;
  booking_status?: string | null;
  source?: string | null;
  profile_source?: string | null;
  search_source?: string | null;
  is_public?: boolean | null;
  is_public_visible?: boolean | null;
  is_active?: boolean | null;
  is_bookable?: boolean | null;
  is_accepting_bookings?: boolean | null;
  accepting_bookings?: boolean | null;
  service_area_enabled?: boolean | null;
  service_radius_miles?: number | string | null;
  radius_miles?: number | string | null;
  service_latitude?: number | string | null;
  service_longitude?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  services?: string[] | null;
  hourly_rate?: number | null;
  rate?: number | null;
  experience_years?: number | null;
  is_verified?: boolean | null;
  rating_avg?: number | null;
  rating?: number | null;
  review_count?: number | null;
  profile_photo_url?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
};

type PublicSearchOverrideRow = {
  [key: string]: unknown;
  target_role?: string | null;
  email?: string | null;
  user_id?: string | null;
  source_id?: string | null;
  slug?: string | null;
  display_name?: string | null;
  is_public_visible?: boolean | null;
  is_bookable?: boolean | null;
  is_active?: boolean | null;
  is_accepting_bookings?: boolean | null;
  accepting_bookings?: boolean | null;
  admin_status?: string | null;
  public_status?: string | null;
  status?: string | null;
  application_status?: string | null;
  booking_status?: string | null;
  service_city?: string | null;
  service_state?: string | null;
  service_zip?: string | null;
  service_radius_miles?: number | string | null;
  service_latitude?: number | string | null;
  service_longitude?: number | string | null;
  services?: string[] | null;
  reason?: string | null;
};

type SourceLoadResult = {
  tableName: string;
  loaded: number;
  displayed: number;
  error?: string;
};

const SEARCH_SOURCE_TABLES = [
  "public_guru_search_profiles",
  "gurus",
  "profiles",
];

const PERMANENTLY_BLOCKED_GURU_IDS = new Set([
  "5d132f82-6899-42cf-9690-446a25320fc6",
  "b6c07540-0dc4-4307-91b6-46c8f5b3b816",
  "727cc66b-24b2-477b-b2f8-0fc9911fea1c",
  "7c6592d5-c43b-4a7d-8dbf-e3afc9c7858a",
  "81408cd6-6d90-4b2a-a21b-236417676907",
]);

const DEMO_GURU_NAMES = new Set([
  "avery johnson",
  "caleb brooks",
  "darius miller",
  "emma walsh",
  "jordan taylor",
  "marcus bennett",
  "maya reynolds",
  "nina patel",
  "olivia chen",
  "sofia martinez",
  "suzy q",
]);


const PLACEHOLDER_EMAIL_DOMAIN = "@placeholder.sitguru.local";

const FALLBACK_LOCATION_COORDINATES: Record<
  string,
  { latitude: number; longitude: number }
> = {
  "zip:18951": { latitude: 40.4418, longitude: -75.3416 },
  "city:quakertown:pa": { latitude: 40.4418, longitude: -75.3416 },
  "zip:19512": { latitude: 40.3337, longitude: -75.6374 },
  "city:boyertown:pa": { latitude: 40.3337, longitude: -75.6374 },
  "zip:18944": { latitude: 40.372, longitude: -75.2927 },
  "city:perkasie:pa": { latitude: 40.372, longitude: -75.2927 },
  "zip:18901": { latitude: 40.3101, longitude: -75.1299 },
  "city:doylestown:pa": { latitude: 40.3101, longitude: -75.1299 },
  "zip:18917": { latitude: 40.3718, longitude: -75.2016 },
  "city:dublin:pa": { latitude: 40.3718, longitude: -75.2016 },
  "zip:18960": { latitude: 40.3537, longitude: -75.3049 },
  "city:sellersville:pa": { latitude: 40.3537, longitude: -75.3049 },
  "zip:18018": { latitude: 40.6259, longitude: -75.3705 },
  "zip:18020": { latitude: 40.6595, longitude: -75.3096 },
  "city:bethlehem:pa": { latitude: 40.6259, longitude: -75.3705 },
  "zip:18101": { latitude: 40.6023, longitude: -75.4714 },
  "zip:18102": { latitude: 40.6084, longitude: -75.4812 },
  "zip:18103": { latitude: 40.5773, longitude: -75.4547 },
  "zip:18104": { latitude: 40.6115, longitude: -75.5343 },
  "city:allentown:pa": { latitude: 40.6023, longitude: -75.4714 },
  "zip:18042": { latitude: 40.6884, longitude: -75.2207 },
  "city:easton:pa": { latitude: 40.6884, longitude: -75.2207 },
  "zip:19464": { latitude: 40.2454, longitude: -75.6496 },
  "city:pottstown:pa": { latitude: 40.2454, longitude: -75.6496 },
  "zip:19446": { latitude: 40.2415, longitude: -75.2838 },
  "city:lansdale:pa": { latitude: 40.2415, longitude: -75.2838 },
  "zip:19401": { latitude: 40.1215, longitude: -75.3399 },
  "city:norristown:pa": { latitude: 40.1215, longitude: -75.3399 },
  "zip:19440": { latitude: 40.2798, longitude: -75.2993 },
  "city:hatfield:pa": { latitude: 40.2798, longitude: -75.2993 },
  "zip:18964": { latitude: 40.3118, longitude: -75.3252 },
  "city:souderton:pa": { latitude: 40.3118, longitude: -75.3252 },
  "zip:18036": { latitude: 40.5115, longitude: -75.3905 },
  "city:coopersburg:pa": { latitude: 40.5115, longitude: -75.3905 },
  "zip:18049": { latitude: 40.5395, longitude: -75.4969 },
  "city:emmaus:pa": { latitude: 40.5395, longitude: -75.4969 },
  "city:philadelphia:pa": { latitude: 39.9526, longitude: -75.1652 },
};

function cleanString(value: unknown) {
  return String(value || "").trim();
}

function cleanZip(value: unknown) {
  return cleanString(value).replace(/\D/g, "").slice(0, 5);
}

function normalizeText(value: unknown) {
  return cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeStatus(value: unknown) {
  return cleanString(value).toLowerCase();
}

function slugify(value: unknown) {
  const slug = normalizeText(value).replace(/\s+/g, "-");
  return slug || "guru";
}

function isNegativeGuruStatus(value: unknown) {
  return [
    "inactive",
    "suspended",
    "rejected",
    "paused",
    "deleted",
    "archived",
    "not_approved",
    "not approved",
  ].includes(normalizeStatus(value));
}

function hasExplicitFalse(value: unknown) {
  return value === false || normalizeStatus(value) === "false";
}

function hasPositiveValue(value: unknown) {
  return (
    value === true ||
    [
      "true",
      "yes",
      "active",
      "approved",
      "bookable",
      "public",
      "visible",
    ].includes(normalizeStatus(value))
  );
}

function isValidEmail(value: unknown) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanString(value));
}

function getGuruName(guru: GuruRow) {
  return cleanString(guru.display_name || guru.full_name || guru.name || "Guru");
}

function getGuruCity(guru: GuruRow) {
  return cleanString(guru.service_city || guru.city);
}

function getGuruState(guru: GuruRow) {
  return cleanString(guru.service_state || guru.state);
}

function getGuruRole(guru: GuruRow) {
  return normalizeStatus(guru.role || guru.user_role || guru.account_type);
}

function sourceRowLooksLikeGuru(tableName: string, guru: GuruRow) {
  if (tableName === "public_guru_search_profiles" || tableName === "gurus") {
    return true;
  }

  const role = getGuruRole(guru);
  const source = normalizeStatus(
    guru.source || guru.profile_source || guru.search_source,
  );

  return (
    role === "guru" ||
    role === "sitter" ||
    role.includes("guru") ||
    source.includes("guru") ||
    source.includes("sitter")
  );
}

function isSearchSuppressedGuru(guru: GuruRow) {
  const status = normalizeStatus(guru.status);
  const applicationStatus = normalizeStatus(guru.application_status);

  if (hasExplicitFalse(guru.is_public)) return true;
  if (hasExplicitFalse(guru.is_public_visible)) return true;
  if (hasExplicitFalse(guru.is_active)) return true;

  return isNegativeGuruStatus(status) || isNegativeGuruStatus(applicationStatus);
}

function isPublicSearchGuru(guru: GuruRow) {
  const status = normalizeStatus(guru.status);
  const applicationStatus = normalizeStatus(guru.application_status);
  const adminStatus = normalizeStatus(guru.admin_status);
  const publicStatus = normalizeStatus(guru.public_status);

  if (isSearchSuppressedGuru(guru)) return false;

  return (
    guru.is_public === true ||
    guru.is_public_visible === true ||
    publicStatus === "public" ||
    publicStatus === "visible" ||
    adminStatus === "approved" ||
    applicationStatus === "public" ||
    applicationStatus === "visible" ||
    applicationStatus === "bookable" ||
    status === "public" ||
    status === "visible" ||
    status === "bookable" ||
    status === "active"
  );
}

function isBookableSearchGuru(guru: GuruRow) {
  const status = normalizeStatus(guru.status);
  const applicationStatus = normalizeStatus(guru.application_status);
  const bookingStatus = normalizeStatus(guru.booking_status);
  const adminStatus = normalizeStatus(guru.admin_status);
  const qualityStatus = normalizeStatus(guru.profile_quality_status);

  if (!isPublicSearchGuru(guru)) return false;
  if (isPlaceholderSearchGuru(guru)) return false;
  if (bookingStatus === "listed_only" || bookingStatus === "not_listed") return false;
  if (adminStatus === "placeholder" || qualityStatus === "placeholder") return false;
  if (hasExplicitFalse(guru.is_bookable)) return false;
  if (hasExplicitFalse(guru.is_accepting_bookings)) return false;
  if (hasExplicitFalse(guru.accepting_bookings)) return false;

  return (
    guru.is_bookable === true ||
    hasPositiveValue(guru.is_accepting_bookings) ||
    hasPositiveValue(guru.accepting_bookings) ||
    bookingStatus === "bookable" ||
    bookingStatus === "requestable" ||
    applicationStatus === "bookable" ||
    status === "bookable" ||
    (adminStatus === "approved" && qualityStatus === "bookable")
  );
}

function isDemoSearchGuru(guru: GuruRow) {
  const normalizedName = normalizeText(getGuruName(guru));

  if (!DEMO_GURU_NAMES.has(normalizedName)) return false;
  if (!getGuruCity(guru) || !getGuruState(guru)) return false;

  const email = normalizeStatus(guru.email);
  const qualityStatus = normalizeStatus(guru.profile_quality_status);
  const source = normalizeStatus(
    guru.source || guru.profile_source || guru.search_source,
  );

  return (
    !isValidEmail(email) ||
    email.endsWith("@example.com") ||
    email === "suzyq@gmail.com" ||
    qualityStatus.includes("demo") ||
    qualityStatus.includes("seed") ||
    qualityStatus.includes("fallback") ||
    source.includes("seed") ||
    source.includes("demo") ||
    source.includes("canonical")
  );
}

function isPlaceholderSearchGuru(guru: GuruRow) {
  const normalizedName = normalizeText(getGuruName(guru));
  const email = normalizeStatus(guru.email);
  const adminStatus = normalizeStatus(guru.admin_status);
  const publicStatus = normalizeStatus(guru.public_status);
  const qualityStatus = normalizeStatus(guru.profile_quality_status);
  const bookingStatus = normalizeStatus(guru.booking_status);
  const source = normalizeStatus(
    guru.source || guru.profile_source || guru.search_source,
  );

  return (
    DEMO_GURU_NAMES.has(normalizedName) ||
    email.endsWith(PLACEHOLDER_EMAIL_DOMAIN) ||
    adminStatus === "placeholder" ||
    publicStatus === "visible_placeholder" ||
    qualityStatus === "placeholder" ||
    qualityStatus.includes("demo") ||
    qualityStatus.includes("seed") ||
    bookingStatus === "listed_only" ||
    source.includes("seed") ||
    source.includes("demo")
  );
}

function shouldDisplaySearchGuru(guru: GuruRow) {
  if (isBlockedGuruAccount(guru)) return false;
  if (!hasBasicLocationSignal(guru)) return false;

  return isPublicSearchGuru(guru) || isDemoSearchGuru(guru);
}

function getGuruZip(guru: GuruRow) {
  return cleanZip(guru.service_zip || guru.service_zip_code || guru.zip_code);
}

function getGuruPhotoUrl(guru: GuruRow) {
  return cleanString(
    guru.profile_photo_url || guru.photo_url || guru.avatar_url || guru.image_url,
  );
}

function getGuruIdentityValues(guru: GuruRow) {
  return [
    guru.id,
    guru.user_id,
    guru.profile_id,
    guru.guru_id,
    guru.slug,
    guru.email,
  ]
    .map((value) => cleanString(value).toLowerCase())
    .filter(Boolean);
}

function isBlockedGuruAccount(guru: GuruRow) {
  return getGuruIdentityValues(guru).some((value) =>
    PERMANENTLY_BLOCKED_GURU_IDS.has(value),
  );
}

function hasBasicLocationSignal(guru: GuruRow) {
  return Boolean(
    getGuruZip(guru) ||
      (getGuruCity(guru) && getGuruState(guru)) ||
      hasCoordinates(guru),
  );
}

function hasCoordinates(guru: GuruRow) {
  const latitude = Number(guru.service_latitude || guru.latitude || guru.lat);
  const longitude = Number(guru.service_longitude || guru.longitude || guru.lng);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude !== 0 &&
    longitude !== 0
  );
}

function isGenericGuruName(value: unknown) {
  const normalized = normalizeText(value);

  return !normalized || ["guru", "pet care guru", "sitter", "pet sitter"].includes(normalized);
}

function getGuruDedupeKeys(guru: GuruRow) {
  const keys = new Set<string>();
  const email = normalizeStatus(guru.email);
  const userId = cleanString(guru.user_id);
  const slug = normalizeText(guru.slug);
  const name = normalizeText(getGuruName(guru));
  const city = normalizeText(getGuruCity(guru));
  const state = normalizeStatus(getGuruState(guru));
  const zip = getGuruZip(guru);
  const photo = normalizeText(getGuruPhotoUrl(guru));
  const source = normalizeStatus(guru.source || guru.profile_source || guru.search_source);
  const qualityStatus = normalizeStatus(guru.profile_quality_status);
  const shouldUseNameOnlyKey =
    source.includes("fallback") ||
    source.includes("orphan") ||
    qualityStatus.includes("fallback") ||
    qualityStatus.includes("orphan") ||
    !city ||
    !state ||
    !zip;

  if (isValidEmail(email)) keys.add(`email:${email}`);
  if (userId) keys.add(`user:${userId}`);
  if (slug && !isGenericGuruName(slug)) keys.add(`slug:${slug}`);

  if (name && !isGenericGuruName(name)) {
    if (city && state) keys.add(`name-location:${name}:${city}:${state}`);
    if (zip) keys.add(`name-zip:${name}:${zip}`);
    if (photo) keys.add(`name-photo:${name}:${photo}`);
    if (shouldUseNameOnlyKey) keys.add(`name:${name}`);
  }

  if (!keys.size && cleanString(guru.id)) keys.add(`id:${cleanString(guru.id)}`);

  return Array.from(keys);
}

function getGuruQualityScore(guru: GuruRow) {
  const source = normalizeStatus(guru.source || guru.profile_source || guru.search_source);
  const qualityStatus = normalizeStatus(guru.profile_quality_status);
  const radius = readNumber(guru.service_radius_miles || guru.radius_miles, 0) || 0;

  let score = 0;

  if (isBookableSearchGuru(guru)) score += 80;
  if (isPublicSearchGuru(guru)) score += 50;
  if (isValidEmail(guru.email)) score += 18;
  if (!isGenericGuruName(getGuruName(guru))) score += 12;
  if (getGuruZip(guru)) score += 10;
  if (getGuruCity(guru)) score += 8;
  if (getGuruState(guru)) score += 8;
  if (!hasBasicLocationSignal(guru)) score -= 40;
  if (getGuruPhotoUrl(guru)) score += 12;
  if (cleanString(guru.bio)) score += 12;
  if (Array.isArray(guru.services) && guru.services.length > 0) score += guru.services.length;
  if (readNumber(guru.hourly_rate || guru.rate, null) !== null) score += 8;
  if (radius > 0) score += 4;
  if (hasCoordinates(guru)) score += 8;
  if (guru.is_verified) score += 6;
  if (readNumber(guru.review_count, 0)) score += 4;
  if (source.includes("public_search") || source.includes("override")) score += 8;
  if (source.includes("profile fallback") || source.includes("fallback")) score -= 18;
  if (qualityStatus.includes("orphan")) score -= 25;
  if (qualityStatus.includes("fallback")) score -= 12;

  return score;
}

function chooseTextValue(primary: unknown, secondary: unknown) {
  const primaryText = cleanString(primary);
  if (primaryText) return primary;

  const secondaryText = cleanString(secondary);
  return secondaryText ? secondary : primary;
}

function chooseNumberValue(primary: unknown, secondary: unknown) {
  const primaryNumber = Number(primary);
  if (Number.isFinite(primaryNumber) && primaryNumber > 0) return primary;

  const secondaryNumber = Number(secondary);
  return Number.isFinite(secondaryNumber) && secondaryNumber > 0
    ? secondary
    : primary;
}

function chooseSearchBoolean(primary: unknown, secondary: unknown): boolean | null | undefined {
  if (primary === true || secondary === true) return true;
  if (primary === false && secondary === false) return false;
  if (typeof primary === "boolean") return primary;
  if (typeof secondary === "boolean") return secondary;
  return undefined;
}

function mergeServices(primary?: string[] | null, secondary?: string[] | null) {
  const services = [...(primary || []), ...(secondary || [])]
    .map((service) => cleanString(service))
    .filter(Boolean);

  return Array.from(new Set(services));
}

function mergeDuplicateGuruRows(current: GuruRow, incoming: GuruRow): GuruRow {
  const currentScore = getGuruQualityScore(current);
  const incomingScore = getGuruQualityScore(incoming);
  const primary = incomingScore > currentScore ? incoming : current;
  const secondary = incomingScore > currentScore ? current : incoming;

  return {
    ...secondary,
    ...primary,
    id: chooseTextValue(primary.id, secondary.id) as string | number,
    user_id: chooseTextValue(primary.user_id, secondary.user_id) as string | null,
    email: chooseTextValue(primary.email, secondary.email) as string | null,
    slug: chooseTextValue(primary.slug, secondary.slug) as string | null,
    display_name: chooseTextValue(primary.display_name, secondary.display_name) as string | null,
    full_name: chooseTextValue(primary.full_name, secondary.full_name) as string | null,
    name: chooseTextValue(primary.name, secondary.name) as string | null,
    title: chooseTextValue(primary.title, secondary.title) as string | null,
    bio: chooseTextValue(primary.bio, secondary.bio) as string | null,
    city: chooseTextValue(primary.city, secondary.city) as string | null,
    state: chooseTextValue(primary.state, secondary.state) as string | null,
    zip_code: chooseTextValue(primary.zip_code, secondary.zip_code) as string | null,
    service_city: chooseTextValue(primary.service_city, secondary.service_city) as string | null,
    service_state: chooseTextValue(primary.service_state, secondary.service_state) as string | null,
    service_zip: chooseTextValue(primary.service_zip, secondary.service_zip) as string | null,
    service_zip_code: chooseTextValue(primary.service_zip_code, secondary.service_zip_code) as string | null,
    profile_photo_url: chooseTextValue(primary.profile_photo_url, secondary.profile_photo_url) as string | null,
    photo_url: chooseTextValue(primary.photo_url, secondary.photo_url) as string | null,
    avatar_url: chooseTextValue(primary.avatar_url, secondary.avatar_url) as string | null,
    image_url: chooseTextValue(primary.image_url, secondary.image_url) as string | null,
    hourly_rate: chooseNumberValue(primary.hourly_rate, secondary.hourly_rate) as number | null,
    rate: chooseNumberValue(primary.rate, secondary.rate) as number | null,
    service_radius_miles: chooseNumberValue(primary.service_radius_miles, secondary.service_radius_miles) as string | number | null,
    radius_miles: chooseNumberValue(primary.radius_miles, secondary.radius_miles) as string | number | null,
    service_latitude: chooseNumberValue(primary.service_latitude, secondary.service_latitude) as string | number | null,
    service_longitude: chooseNumberValue(primary.service_longitude, secondary.service_longitude) as string | number | null,
    latitude: chooseNumberValue(primary.latitude, secondary.latitude) as string | number | null,
    longitude: chooseNumberValue(primary.longitude, secondary.longitude) as string | number | null,
    is_public: chooseSearchBoolean(primary.is_public, secondary.is_public),
    is_public_visible: chooseSearchBoolean(primary.is_public_visible, secondary.is_public_visible),
    is_active: chooseSearchBoolean(primary.is_active, secondary.is_active),
    is_bookable: chooseSearchBoolean(primary.is_bookable, secondary.is_bookable),
    is_accepting_bookings: chooseSearchBoolean(
      primary.is_accepting_bookings,
      secondary.is_accepting_bookings,
    ),
    accepting_bookings: chooseSearchBoolean(
      primary.accepting_bookings,
      secondary.accepting_bookings,
    ),
    services: mergeServices(primary.services, secondary.services),
  };
}

function dedupeGuruRows(gurus: GuruRow[]) {
  const mergedRows: GuruRow[] = [];
  const keyToIndex = new Map<string, number>();

  gurus.forEach((guru) => {
    const keys = getGuruDedupeKeys(guru);
    const existingIndex = keys
      .map((key) => keyToIndex.get(key))
      .find((index): index is number => typeof index === "number");

    if (existingIndex === undefined) {
      const nextIndex = mergedRows.length;
      mergedRows.push(guru);
      keys.forEach((key) => keyToIndex.set(key, nextIndex));
      return;
    }

    mergedRows[existingIndex] = mergeDuplicateGuruRows(
      mergedRows[existingIndex],
      guru,
    );

    getGuruDedupeKeys(mergedRows[existingIndex]).forEach((key) =>
      keyToIndex.set(key, existingIndex),
    );
  });

  return mergedRows;
}

function readNumber(value: unknown, fallback: number | null = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getOverrideKeysForGuru(guru: GuruRow) {
  return [
    normalizeStatus(guru.email) ? `email:${normalizeStatus(guru.email)}` : "",
    cleanString(guru.user_id) ? `user:${cleanString(guru.user_id)}` : "",
    cleanString(guru.id) ? `id:${cleanString(guru.id)}` : "",
  ].filter(Boolean);
}

function getOverrideKeysForRow(override: PublicSearchOverrideRow) {
  return [
    normalizeStatus(override.email)
      ? `email:${normalizeStatus(override.email)}`
      : "",
    cleanString(override.user_id) ? `user:${cleanString(override.user_id)}` : "",
    cleanString(override.source_id)
      ? `id:${cleanString(override.source_id)}`
      : "",
  ].filter(Boolean);
}

function buildOverrideMap(overrides: PublicSearchOverrideRow[]) {
  const overrideMap = new Map<string, PublicSearchOverrideRow>();

  overrides.forEach((override) => {
    getOverrideKeysForRow(override).forEach((key) => {
      overrideMap.set(key, override);
    });
  });

  return overrideMap;
}

function findOverrideForGuru(
  guru: GuruRow,
  overrideMap: Map<string, PublicSearchOverrideRow>,
) {
  for (const key of getOverrideKeysForGuru(guru)) {
    const override = overrideMap.get(key);
    if (override) return override;
  }

  return null;
}

function chooseOverrideString(
  overrideValue: unknown,
  currentValue: unknown,
  fallbackValue?: string | null,
) {
  const overrideText = cleanString(overrideValue);
  if (overrideText) return overrideText;

  const currentText = cleanString(currentValue);
  if (currentText) return currentText;

  return fallbackValue || null;
}

function applyOverrideToGuru(
  guru: GuruRow,
  overrideMap: Map<string, PublicSearchOverrideRow>,
): GuruRow {
  const override = findOverrideForGuru(guru, overrideMap);

  if (!override) return guru;

  const publicVisible =
    typeof override.is_public_visible === "boolean"
      ? override.is_public_visible
      : undefined;
  const bookable =
    typeof override.is_bookable === "boolean" ? override.is_bookable : undefined;
  const active =
    typeof override.is_active === "boolean" ? override.is_active : undefined;

  const acceptingBookings =
    typeof override.is_accepting_bookings === "boolean"
      ? override.is_accepting_bookings
      : typeof override.accepting_bookings === "boolean"
        ? override.accepting_bookings
        : bookable;

  return {
    ...guru,
    display_name: chooseOverrideString(override.display_name, guru.display_name),
    full_name: chooseOverrideString(
      override.display_name,
      guru.full_name,
      getGuruName(guru),
    ),
    slug: chooseOverrideString(override.slug, guru.slug),
    is_public: publicVisible ?? guru.is_public,
    is_public_visible: publicVisible ?? guru.is_public_visible,
    is_active: active ?? guru.is_active,
    is_bookable: bookable ?? guru.is_bookable,
    is_accepting_bookings: acceptingBookings ?? guru.is_accepting_bookings,
    accepting_bookings: acceptingBookings ?? guru.accepting_bookings,
    admin_status: chooseOverrideString(override.admin_status, guru.admin_status),
    public_status: chooseOverrideString(
      override.public_status,
      guru.public_status,
      publicVisible === true ? "public" : undefined,
    ),
    status: chooseOverrideString(
      override.status,
      guru.status,
      bookable === true ? "bookable" : publicVisible === true ? "active" : undefined,
    ),
    application_status: chooseOverrideString(
      override.application_status,
      guru.application_status,
      bookable === true ? "bookable" : publicVisible === true ? "public" : undefined,
    ),
    booking_status: chooseOverrideString(
      override.booking_status,
      guru.booking_status,
      bookable === true ? "bookable" : undefined,
    ),
    service_city: chooseOverrideString(override.service_city, guru.service_city),
    service_state: chooseOverrideString(override.service_state, guru.service_state),
    service_zip: chooseOverrideString(override.service_zip, guru.service_zip),
    service_zip_code: chooseOverrideString(
      override.service_zip,
      guru.service_zip_code,
    ),
    service_radius_miles:
      override.service_radius_miles ?? guru.service_radius_miles,
    radius_miles: override.service_radius_miles ?? guru.radius_miles,
    service_latitude: override.service_latitude ?? guru.service_latitude,
    service_longitude: override.service_longitude ?? guru.service_longitude,
    latitude: override.service_latitude ?? guru.latitude,
    longitude: override.service_longitude ?? guru.longitude,
    services:
      Array.isArray(override.services) && override.services.length > 0
        ? override.services
        : guru.services,
    search_source: "admin_visibility_override",
  };
}

function overrideToStandaloneGuru(override: PublicSearchOverrideRow): GuruRow {
  const displayName = cleanString(override.display_name || "Guru");
  const email = normalizeStatus(override.email);
  const fallbackId = email
    ? `override-${email.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`
    : `override-${slugify(displayName)}`;
  const bookable = override.is_bookable === true;
  const publicVisible = override.is_public_visible !== false;

  return {
    id: cleanString(override.source_id) || cleanString(override.user_id) || fallbackId,
    user_id: cleanString(override.user_id) || null,
    email: email || null,
    role: "guru",
    slug: cleanString(override.slug) || slugify(displayName),
    display_name: displayName,
    full_name: displayName,
    name: displayName,
    title: "Pet Care Guru",
    city: cleanString(override.service_city) || null,
    state: cleanString(override.service_state) || null,
    zip_code: cleanZip(override.service_zip) || null,
    service_city: cleanString(override.service_city) || null,
    service_state: cleanString(override.service_state) || null,
    service_zip: cleanZip(override.service_zip) || null,
    service_zip_code: cleanZip(override.service_zip) || null,
    status: cleanString(override.status) || (bookable ? "bookable" : "active"),
    application_status:
      cleanString(override.application_status) || (bookable ? "bookable" : "public"),
    booking_status: cleanString(override.booking_status) || (bookable ? "bookable" : "listed_only"),
    admin_status: cleanString(override.admin_status) || "approved",
    public_status: cleanString(override.public_status) || "public",
    is_public: publicVisible,
    is_public_visible: publicVisible,
    is_active: override.is_active !== false,
    is_bookable: bookable,
    is_accepting_bookings:
      override.is_accepting_bookings ?? override.accepting_bookings ?? bookable,
    accepting_bookings:
      override.accepting_bookings ?? override.is_accepting_bookings ?? bookable,
    service_area_enabled: true,
    service_radius_miles: override.service_radius_miles || 25,
    radius_miles: override.service_radius_miles || 25,
    service_latitude: override.service_latitude || null,
    service_longitude: override.service_longitude || null,
    latitude: override.service_latitude || null,
    longitude: override.service_longitude || null,
    services:
      Array.isArray(override.services) && override.services.length > 0
        ? override.services
        : ["Dog Walking", "Pet Sitting", "Drop-In Visits"],
    search_source: "admin_override_standalone",
  };
}

async function loadPublicSearchOverrides() {
  const { data, error } = await supabaseAdmin
    .from("sitguru_public_search_overrides")
    .select("*")
    .eq("target_role", "guru")
    .limit(500);

  if (error) {
    if (
      error.code === "42P01" ||
      error.message.toLowerCase().includes("does not exist")
    ) {
      return [] as PublicSearchOverrideRow[];
    }

    console.warn("Public Guru search override table could not be read:", error.message);
    return [] as PublicSearchOverrideRow[];
  }

  return (data || []) as PublicSearchOverrideRow[];
}

function getGuruPublicSlug(guru: GuruRow) {
  return slugify(
    guru.public_slug ||
      guru.slug ||
      guru.display_name ||
      guru.full_name ||
      guru.name ||
      guru.email ||
      guru.id,
  );
}

function getGuruPublicIdentifier(guru: GuruRow) {
  return encodeURIComponent(getGuruPublicSlug(guru));
}

function getGuruProfileUrl(guru: GuruRow) {
  return `/guru/${getGuruPublicIdentifier(guru)}`;
}

function getGuruBookingUrl(guru: GuruRow, canBook: boolean) {
  return canBook ? `/book/${getGuruPublicIdentifier(guru)}` : null;
}

function getFallbackCoordinatesForGuru(guru: GuruRow) {
  const zip = getGuruZip(guru);
  if (zip && FALLBACK_LOCATION_COORDINATES[`zip:${zip}`]) {
    return FALLBACK_LOCATION_COORDINATES[`zip:${zip}`];
  }

  const city = normalizeText(getGuruCity(guru));
  const state = normalizeStatus(getGuruState(guru));
  if (city && state && FALLBACK_LOCATION_COORDINATES[`city:${city}:${state}`]) {
    return FALLBACK_LOCATION_COORDINATES[`city:${city}:${state}`];
  }

  return null;
}

function getGuruCoordinates(guru: GuruRow) {
  const latitude = Number(guru.service_latitude || guru.latitude || guru.lat);
  const longitude = Number(guru.service_longitude || guru.longitude || guru.lng);

  if (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude !== 0 &&
    longitude !== 0
  ) {
    return { latitude, longitude };
  }

  return getFallbackCoordinatesForGuru(guru);
}

function getDisplayStatus(canBook: boolean, isPlaceholder: boolean) {
  if (canBook) return "Bookable";
  if (isPlaceholder) return "Profile Preview";
  return "Profile Preview";
}

function normalizeGuruForPublicSearch(guru: GuruRow) {
  const isPlaceholder = isPlaceholderSearchGuru(guru) || isDemoSearchGuru(guru);
  const canBook = isBookableSearchGuru(guru);
  const radius = readNumber(
    guru.service_radius_miles || guru.radius_miles,
    isPlaceholder ? 50 : 25,
  );
  const coordinates = getGuruCoordinates(guru);
  const publicSlug = getGuruPublicSlug(guru);
  const profileUrl = getGuruProfileUrl(guru);
  const bookingUrl = getGuruBookingUrl(guru, canBook);

  return {
    id: guru.id,
    user_id: guru.user_id,
    profile_id: guru.profile_id,
    guru_id: guru.guru_id,
    slug: guru.slug || publicSlug,
    public_slug: guru.public_slug || publicSlug,
    display_name: guru.display_name || guru.full_name || guru.name || "Guru",
    full_name: guru.full_name || guru.display_name || guru.name || "Guru",
    title: guru.title || "Pet Care Guru",
    bio: guru.bio || null,
    city: guru.city || guru.service_city || null,
    state: guru.state || guru.service_state || null,
    zip_code: guru.zip_code || guru.service_zip || guru.service_zip_code || null,
    service_city: guru.service_city || guru.city || null,
    service_state: guru.service_state || guru.state || null,
    service_zip: guru.service_zip || guru.service_zip_code || guru.zip_code || null,
    service_zip_code: guru.service_zip_code || guru.service_zip || guru.zip_code || null,
    status: isPlaceholder ? "active" : guru.status || (canBook ? "bookable" : "active"),
    application_status: isPlaceholder
      ? "preview"
      : guru.application_status || (canBook ? "bookable" : "public"),
    booking_status: isPlaceholder
      ? "listed_only"
      : guru.booking_status || (canBook ? "bookable" : "listed_only"),
    admin_status: guru.admin_status || (isPlaceholder ? "placeholder" : "approved"),
    public_status: guru.public_status || "public",
    profile_quality_status:
      guru.profile_quality_status || (isPlaceholder ? "placeholder" : canBook ? "bookable" : "public"),
    is_public: true,
    is_public_visible: true,
    is_active: isPlaceholder ? true : guru.is_active ?? true,
    is_bookable: canBook,
    is_accepting_bookings: canBook,
    accepting_bookings: canBook,
    can_show_in_search: true,
    can_view_profile: true,
    can_book: canBook,
    is_placeholder: isPlaceholder,
    profile_url: profileUrl,
    booking_url: bookingUrl,
    display_status: getDisplayStatus(canBook, isPlaceholder),
    service_area_enabled: guru.service_area_enabled ?? true,
    service_radius_miles: Math.max(Number(radius || 25), isPlaceholder ? 50 : 1),
    radius_miles: Math.max(Number(radius || 25), isPlaceholder ? 50 : 1),
    service_latitude: coordinates?.latitude ?? guru.service_latitude ?? guru.latitude ?? guru.lat ?? null,
    service_longitude: coordinates?.longitude ?? guru.service_longitude ?? guru.longitude ?? guru.lng ?? null,
    latitude: coordinates?.latitude ?? guru.latitude ?? guru.service_latitude ?? guru.lat ?? null,
    longitude: coordinates?.longitude ?? guru.longitude ?? guru.service_longitude ?? guru.lng ?? null,
    lat: coordinates?.latitude ?? guru.lat ?? guru.latitude ?? guru.service_latitude ?? null,
    lng: coordinates?.longitude ?? guru.lng ?? guru.longitude ?? guru.service_longitude ?? null,
    map_latitude: coordinates?.latitude ?? null,
    map_longitude: coordinates?.longitude ?? null,
    hourly_rate: guru.hourly_rate || guru.rate || null,
    rate: guru.rate || guru.hourly_rate || null,
    experience_years: guru.experience_years || null,
    is_verified: Boolean(guru.is_verified),
    rating_avg: guru.rating_avg || guru.rating || null,
    rating: guru.rating || guru.rating_avg || null,
    review_count: guru.review_count || 0,
    profile_photo_url:
      guru.profile_photo_url || guru.photo_url || guru.avatar_url || guru.image_url || null,
    photo_url: guru.photo_url || guru.profile_photo_url || guru.avatar_url || guru.image_url || null,
    avatar_url: guru.avatar_url || guru.profile_photo_url || guru.photo_url || null,
    image_url: guru.image_url || guru.profile_photo_url || guru.photo_url || null,
    services: Array.isArray(guru.services) && guru.services.length > 0
      ? guru.services
      : ["Dog Walking", "Pet Sitting", "Drop-In Visits"],
    search_source: guru.search_source || (isPlaceholder ? "placeholder_search" : "public_search"),
  };
}

async function loadGuruRowsFromTable(
  tableName: string,
  overrideMap: Map<string, PublicSearchOverrideRow>,
): Promise<{ rows: GuruRow[]; result: SourceLoadResult }> {
  const { data, error } = await supabaseAdmin
    .from(tableName)
    .select("*")
    .limit(500);

  if (error) {
    const message = error.message || `Could not read ${tableName}`;
    console.warn(`Public Guru search could not read ${tableName}:`, message);
    return {
      rows: [],
      result: {
        tableName,
        loaded: 0,
        displayed: 0,
        error: message,
      },
    };
  }

  const loadedRows = ((data || []) as GuruRow[])
    .filter((guru) => sourceRowLooksLikeGuru(tableName, guru))
    .map((guru) => applyOverrideToGuru(guru, overrideMap));
  const displayRows = loadedRows.filter(shouldDisplaySearchGuru);

  return {
    rows: displayRows,
    result: {
      tableName,
      loaded: loadedRows.length,
      displayed: displayRows.length,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const debug = url.searchParams.get("debug") === "1";
    const overrides = await loadPublicSearchOverrides();
    const overrideMap = buildOverrideMap(overrides);
    const sourceResults: SourceLoadResult[] = [];
    let guruRows: GuruRow[] = [];

    for (const tableName of SEARCH_SOURCE_TABLES) {
      const { rows, result } = await loadGuruRowsFromTable(tableName, overrideMap);
      sourceResults.push(result);
      guruRows = [...guruRows, ...rows];
    }

    const standaloneOverrideRows = overrides
      .map(overrideToStandaloneGuru)
      .map((guru) => applyOverrideToGuru(guru, overrideMap))
      .filter(shouldDisplaySearchGuru);

    guruRows = [...guruRows, ...standaloneOverrideRows];

    const normalizedGurus = dedupeGuruRows(guruRows)
      .map(normalizeGuruForPublicSearch)
      .sort((a, b) =>
        String(a.display_name || "").localeCompare(String(b.display_name || "")),
      );

    return NextResponse.json(
      {
        gurus: normalizedGurus,
        count: normalizedGurus.length,
        ...(debug
          ? {
              debug: {
                overrides_loaded: overrides.length,
                standalone_overrides_displayed: standaloneOverrideRows.length,
                can_book_count: normalizedGurus.filter((guru) => guru.can_book).length,
                placeholder_count: normalizedGurus.filter((guru) => guru.is_placeholder).length,
                mapped_count: normalizedGurus.filter((guru) => guru.map_latitude && guru.map_longitude).length,
                source_results: sourceResults,
              },
            }
          : {}),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("Public Guru search route failed:", error);

    return NextResponse.json(
      {
        gurus: [],
        count: 0,
        error: "Could not load Guru search results.",
      },
      { status: 500 },
    );
  }
}
