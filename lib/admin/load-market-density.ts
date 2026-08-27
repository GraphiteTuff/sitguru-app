import { supabaseAdmin } from "@/lib/supabase/admin";
import { cleanZipCode, lookupZipLocation } from "@/lib/location/zip-lookup";
import {
  buildMarketDensityMarket,
  sortMarkets,
  summarizeMarkets,
  type MarketDensityMarket,
  type MarketDensitySummary,
} from "@/lib/admin/market-density";

type AnyRow = Record<string, unknown>;

type MarketBucket = {
  key: string;
  city: string;
  state: string;
  zip: string;
  guruCount: number;
  bookableCount: number;
  petParentCount: number;
  ambassadorCount: number;
  bookingCount: number;
  latitude: number | null;
  longitude: number | null;
};

const PET_PARENT_ROLES = [
  "customer",
  "pet_parent",
  "pet-parent",
  "pet parent",
  "parent",
  "client",
  "pet_owner",
];

function text(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function numberOrNull(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = Number(row[key]);
    if (Number.isFinite(value) && Math.abs(value) > 0.1) return value;
  }
  return null;
}

function isTrue(value: unknown) {
  return value === true || value === "true";
}

function normalizeRole(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isPetParentRow(row: AnyRow) {
  const role = normalizeRole(row.role);
  const accountType = normalizeRole(row.account_type);
  return (
    PET_PARENT_ROLES.includes(role) || PET_PARENT_ROLES.includes(accountType)
  );
}

function isActiveAmbassador(row: AnyRow) {
  const status = normalizeRole(row.status);
  return !status || status === "active" || status === "approved";
}

function marketKey(zip: string, city: string, state: string) {
  if (zip) return `zip:${zip}`;
  const place = [city, state]
    .filter(Boolean)
    .join(", ")
    .toLowerCase();
  return place ? `city:${place}` : "";
}

function readLocation(row: AnyRow) {
  const zip = cleanZipCode(
    text(row, [
      "service_zip",
      "service_zip_code",
      "care_zip_code",
      "zip_code",
      "base_zip_code",
      "zip",
      "postal_code",
    ]),
  );
  const city = text(row, [
    "service_city",
    "care_city",
    "city",
    "home_city",
  ]);
  const state = text(row, [
    "service_state",
    "care_state",
    "state",
    "home_state",
  ]);
  const latitude = numberOrNull(row, [
    "service_latitude",
    "care_latitude",
    "latitude",
    "sit_latitude_at_booking",
  ]);
  const longitude = numberOrNull(row, [
    "service_longitude",
    "care_longitude",
    "longitude",
    "sit_longitude_at_booking",
  ]);

  return { zip, city, state, latitude, longitude };
}

async function safeSelect(table: string, columns: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select(columns)
      .limit(4000);

    if (error) {
      console.warn(`Market density ${table} query failed:`, error.message);
      return [] as AnyRow[];
    }

    return Array.isArray(data) ? (data as AnyRow[]) : [];
  } catch (error) {
    console.warn(`Market density ${table} query crashed:`, error);
    return [] as AnyRow[];
  }
}

function getOrCreateBucket(
  buckets: Map<string, MarketBucket>,
  location: ReturnType<typeof readLocation>,
) {
  const key = marketKey(location.zip, location.city, location.state);
  if (!key) return null;

  const existing = buckets.get(key);
  if (existing) {
    if (!existing.city && location.city) existing.city = location.city;
    if (!existing.state && location.state) existing.state = location.state;
    if (!existing.zip && location.zip) existing.zip = location.zip;
    if (existing.latitude == null && location.latitude != null) {
      existing.latitude = location.latitude;
    }
    if (existing.longitude == null && location.longitude != null) {
      existing.longitude = location.longitude;
    }
    return existing;
  }

  const created: MarketBucket = {
    key,
    city: location.city,
    state: location.state,
    zip: location.zip,
    guruCount: 0,
    bookableCount: 0,
    petParentCount: 0,
    ambassadorCount: 0,
    bookingCount: 0,
    latitude: location.latitude,
    longitude: location.longitude,
  };
  buckets.set(key, created);
  return created;
}

export type MarketDensityPayload = {
  markets: MarketDensityMarket[];
  summary: MarketDensitySummary;
};

export async function loadMarketDensity(): Promise<MarketDensityPayload> {
  const [gurus, profiles, ambassadors, bookings] = await Promise.all([
    safeSelect(
      "gurus",
      "id, is_bookable, is_public, city, state, zip_code, service_city, service_state, service_zip, service_zip_code, latitude, longitude, service_latitude",
    ),
    safeSelect(
      "profiles",
      "id, role, account_type, city, state, zip_code, service_city, service_state, service_zip, service_zip_code",
    ),
    safeSelect(
      "ambassadors",
      "id, status, city, state, zip_code, base_zip_code",
    ),
    safeSelect(
      "bookings",
      "id, city, state, care_zip_code, care_city, care_state, care_latitude, sit_latitude_at_booking",
    ),
  ]);

  const buckets = new Map<string, MarketBucket>();

  for (const guru of gurus) {
    const bucket = getOrCreateBucket(buckets, readLocation(guru));
    if (!bucket) continue;
    bucket.guruCount += 1;
    if (isTrue(guru.is_bookable)) bucket.bookableCount += 1;
  }

  for (const profile of profiles) {
    if (!isPetParentRow(profile)) continue;
    const bucket = getOrCreateBucket(buckets, readLocation(profile));
    if (!bucket) continue;
    bucket.petParentCount += 1;
  }

  for (const ambassador of ambassadors) {
    if (!isActiveAmbassador(ambassador)) continue;
    const bucket = getOrCreateBucket(buckets, readLocation(ambassador));
    if (!bucket) continue;
    bucket.ambassadorCount += 1;
  }

  for (const booking of bookings) {
    const bucket = getOrCreateBucket(buckets, readLocation(booking));
    if (!bucket) continue;
    bucket.bookingCount += 1;
  }

  const uniqueZips = Array.from(
    new Set(
      Array.from(buckets.values())
        .filter((bucket) => bucket.zip.length === 5 && bucket.latitude == null)
        .map((bucket) => bucket.zip),
    ),
  ).slice(0, 80);

  const lookups = await Promise.all(
    uniqueZips.map(async (zip) => [zip, await lookupZipLocation(zip)] as const),
  );

  for (const [zip, location] of lookups) {
    if (!location) continue;
    for (const bucket of buckets.values()) {
      if (bucket.zip !== zip) continue;
      if (!bucket.city) bucket.city = location.city;
      if (!bucket.state) bucket.state = location.state;
      if (bucket.latitude == null) bucket.latitude = location.latitude ?? null;
      if (bucket.longitude == null) {
        bucket.longitude = location.longitude ?? null;
      }
    }
  }

  const markets = sortMarkets(
    Array.from(buckets.values()).map((bucket) =>
      buildMarketDensityMarket(bucket),
    ),
  );

  return {
    markets,
    summary: summarizeMarkets(markets),
  };
}
