import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type GuruRow = {
  [key: string]: unknown;
  id?: string | number | null;
  user_id?: string | null;
  email?: string | null;
  slug?: string | null;
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
  service_city?: string | null;
  service_state?: string | null;
  service_zip?: string | null;
  service_radius_miles?: number | string | null;
  service_latitude?: number | string | null;
  service_longitude?: number | string | null;
  reason?: string | null;
};

const SEARCH_SOURCE_TABLES = ["public_guru_search_profiles", "gurus"];

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

function cleanString(value: unknown) {
  return String(value || "").trim();
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
    status === "bookable"
  );
}

function isBookableSearchGuru(guru: GuruRow) {
  const status = normalizeStatus(guru.status);
  const applicationStatus = normalizeStatus(guru.application_status);

  if (!isPublicSearchGuru(guru)) return false;
  if (hasExplicitFalse(guru.is_bookable)) return false;
  if (hasExplicitFalse(guru.is_accepting_bookings)) return false;
  if (hasExplicitFalse(guru.accepting_bookings)) return false;

  return (
    guru.is_bookable === true ||
    hasPositiveValue(guru.is_accepting_bookings) ||
    hasPositiveValue(guru.accepting_bookings) ||
    applicationStatus === "bookable" ||
    status === "bookable"
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

function shouldDisplaySearchGuru(guru: GuruRow) {
  return isPublicSearchGuru(guru) || isDemoSearchGuru(guru);
}

function getGuruDedupeKey(guru: GuruRow) {
  const email = normalizeStatus(guru.email);
  if (email) return `email:${email}`;

  const userId = cleanString(guru.user_id);
  if (userId) return `user:${userId}`;

  return `id:${cleanString(guru.id)}`;
}

function dedupeGuruRows(gurus: GuruRow[]) {
  const seen = new Set<string>();

  return gurus.filter((guru) => {
    const key = getGuruDedupeKey(guru);
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
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
  fallbackValue?: string,
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
    search_source: "admin_visibility_override",
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
      return new Map<string, PublicSearchOverrideRow>();
    }

    console.warn("Public Guru search override table could not be read:", error.message);
    return new Map<string, PublicSearchOverrideRow>();
  }

  return buildOverrideMap((data || []) as PublicSearchOverrideRow[]);
}

function normalizeGuruForPublicSearch(guru: GuruRow) {
  const isDemo = isDemoSearchGuru(guru);
  const isBookable = isBookableSearchGuru(guru);
  const radius = readNumber(
    guru.service_radius_miles || guru.radius_miles,
    isDemo ? 50 : 25,
  );

  return {
    id: guru.id,
    user_id: guru.user_id,
    slug: guru.slug,
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
    status: isDemo ? "active" : guru.status || (isBookable ? "bookable" : "active"),
    application_status: isDemo
      ? "preview"
      : guru.application_status || (isBookable ? "bookable" : "public"),
    admin_status: guru.admin_status || (isDemo ? "demo" : "approved"),
    public_status: guru.public_status || "public",
    is_public: true,
    is_public_visible: true,
    is_active: isDemo ? true : guru.is_active ?? true,
    is_bookable: isDemo ? false : isBookable,
    is_accepting_bookings: isDemo ? false : isBookable,
    accepting_bookings: isDemo ? false : isBookable,
    service_area_enabled: guru.service_area_enabled ?? true,
    service_radius_miles: Math.max(Number(radius || 25), isDemo ? 50 : 1),
    radius_miles: Math.max(Number(radius || 25), isDemo ? 50 : 1),
    service_latitude: guru.service_latitude || guru.latitude || guru.lat || null,
    service_longitude: guru.service_longitude || guru.longitude || guru.lng || null,
    latitude: guru.latitude || guru.service_latitude || guru.lat || null,
    longitude: guru.longitude || guru.service_longitude || guru.lng || null,
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
    search_source: guru.search_source || (isDemo ? "demo_search_fallback" : "public_search"),
  };
}

async function loadGuruRowsFromTable(
  tableName: string,
  overrideMap: Map<string, PublicSearchOverrideRow>,
) {
  const { data, error } = await supabaseAdmin
    .from(tableName)
    .select("*")
    .limit(250);

  if (error) {
    console.warn(`Public Guru search could not read ${tableName}:`, error.message);
    return [];
  }

  return ((data || []) as GuruRow[])
    .map((guru) => applyOverrideToGuru(guru, overrideMap))
    .filter(shouldDisplaySearchGuru);
}

export async function GET() {
  try {
    const overrideMap = await loadPublicSearchOverrides();
    let gurus: GuruRow[] = [];

    for (const tableName of SEARCH_SOURCE_TABLES) {
      gurus = await loadGuruRowsFromTable(tableName, overrideMap);

      if (gurus.length > 0) break;
    }

    const normalizedGurus = dedupeGuruRows(gurus)
      .map(normalizeGuruForPublicSearch)
      .sort((a, b) =>
        String(a.display_name || "").localeCompare(String(b.display_name || "")),
      );

    return NextResponse.json(
      {
        gurus: normalizedGurus,
        count: normalizedGurus.length,
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
