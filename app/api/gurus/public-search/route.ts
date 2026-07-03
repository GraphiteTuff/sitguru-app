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

function isBookableSearchGuru(guru: GuruRow) {
  const status = normalizeStatus(guru.status);
  const applicationStatus = normalizeStatus(guru.application_status);
  const adminStatus = normalizeStatus(guru.admin_status);
  const publicStatus = normalizeStatus(guru.public_status);

  if (hasExplicitFalse(guru.is_public)) return false;
  if (hasExplicitFalse(guru.is_public_visible)) return false;
  if (hasExplicitFalse(guru.is_active)) return false;
  if (hasExplicitFalse(guru.is_bookable)) return false;
  if (hasExplicitFalse(guru.is_accepting_bookings)) return false;
  if (hasExplicitFalse(guru.accepting_bookings)) return false;
  if (isNegativeGuruStatus(status) || isNegativeGuruStatus(applicationStatus)) {
    return false;
  }

  const hasPublicSignal =
    guru.is_public === true ||
    guru.is_public_visible === true ||
    publicStatus === "public" ||
    publicStatus === "visible" ||
    adminStatus === "approved";

  const hasBookableSignal =
    guru.is_bookable === true ||
    hasPositiveValue(guru.is_accepting_bookings) ||
    hasPositiveValue(guru.accepting_bookings) ||
    applicationStatus === "bookable" ||
    status === "bookable" ||
    status === "active";

  return hasPublicSignal && hasBookableSignal;
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
  return isBookableSearchGuru(guru) || isDemoSearchGuru(guru);
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

function normalizeGuruForPublicSearch(guru: GuruRow) {
  const radius = readNumber(
    guru.service_radius_miles || guru.radius_miles,
    isDemoSearchGuru(guru) ? 50 : 25,
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
    status: isDemoSearchGuru(guru) ? "active" : guru.status || "active",
    application_status: isDemoSearchGuru(guru)
      ? "preview"
      : guru.application_status || "bookable",
    is_public: isDemoSearchGuru(guru) ? true : guru.is_public ?? true,
    is_public_visible: isDemoSearchGuru(guru)
      ? true
      : guru.is_public_visible ?? guru.is_public ?? true,
    is_active: isDemoSearchGuru(guru) ? true : guru.is_active ?? true,
    is_bookable: isDemoSearchGuru(guru) ? false : guru.is_bookable ?? true,
    is_accepting_bookings: isDemoSearchGuru(guru)
      ? false
      : guru.is_accepting_bookings ?? guru.accepting_bookings ?? true,
    accepting_bookings: isDemoSearchGuru(guru)
      ? false
      : guru.accepting_bookings ?? guru.is_accepting_bookings ?? true,
    service_area_enabled: guru.service_area_enabled ?? true,
    service_radius_miles: Math.max(Number(radius || 25), isDemoSearchGuru(guru) ? 50 : 1),
    radius_miles: Math.max(Number(radius || 25), isDemoSearchGuru(guru) ? 50 : 1),
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
    search_source: isDemoSearchGuru(guru) ? "demo_search_fallback" : "public_search",
  };
}

async function loadGuruRowsFromTable(tableName: string) {
  const { data, error } = await supabaseAdmin
    .from(tableName)
    .select("*")
    .limit(250);

  if (error) {
    console.warn(`Public Guru search could not read ${tableName}:`, error.message);
    return [];
  }

  return ((data || []) as GuruRow[]).filter(shouldDisplaySearchGuru);
}

export async function GET() {
  try {
    let gurus: GuruRow[] = [];

    for (const tableName of SEARCH_SOURCE_TABLES) {
      gurus = await loadGuruRowsFromTable(tableName);

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
