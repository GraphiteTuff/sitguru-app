"use client";

import Link from "next/link";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import ProviderMap from "@/components/ProviderMap";
import AcademyGraduateBadge from "@/components/university/AcademyGraduateBadge";
import { trackEvent } from "@/lib/analytics/track";
import { supabase } from "@/lib/supabase";

type GuruRow = {
  [key: string]: unknown;
  id: string | number;
  user_id?: string | null;
  email?: string | null;
  name?: string | null;
  source?: string | null;
  profile_source?: string | null;
  search_source?: string | null;
  admin_status?: string | null;
  profile_quality_status?: string | null;
  is_public_visible?: boolean | null;
  public_status?: string | null;
  slug?: string | null;
  public_slug?: string | null;
  profile_id?: string | null;
  guru_id?: string | number | null;
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
  is_bookable?: boolean | null;
  service_latitude?: number | string | null;
  service_longitude?: number | string | null;
  service_radius_miles?: number | string | null;
  service_radius?: number | string | null;
  radius_miles?: number | string | null;
  radius?: number | string | null;
  travel_radius_miles?: number | string | null;
  travel_radius?: number | string | null;
  service_area_enabled?: boolean | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  lat?: number | string | null;
  lng?: number | string | null;
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
  is_public?: boolean | null;
  is_active?: boolean | null;
  is_accepting_bookings?: boolean | null;
  accepting_bookings?: boolean | null;
  services?: string[] | null;
  distance_miles?: number | null;
  service_radius_display?: number | null;
};

type GuruServiceRate = {
  id?: string | null;
  guru_id: string;
  service_key: string;
  service_label: string;
  is_enabled: boolean;
  rate_amount: number | string | null;
  rate_unit: string | null;
  duration_minutes?: number | string | null;
  notes?: string | null;
};

type GuruRateDisplay = {
  eyebrow: string;
  primary: string;
  detail: string;
  serviceLabel: string;
  isFallback: boolean;
};

type ZipLookupResult = {
  zip: string;
  city: string;
  state: string;
  stateName?: string;
  latitude: number | null;
  longitude: number | null;
};

type AcademyCertificationRow = {
  user_id: string | null;
  badge_status?: string | null;
  certificate_status?: string | null;
  issued_at?: string | null;
};

const SERVICE_OPTIONS = [
  "Dog Walking",
  "Pet Sitting",
  "Boarding",
  "Doggy Day Care",
  "Drop-In Visits",
  "House Sitting",
  "Training Support",
  "Medication Help",
  "Custom Care",
];

const DEFAULT_MAP_CENTER: [number, number] = [39.9526, -75.1652];

const PERMANENTLY_BLOCKED_GURU_IDS = new Set([
  "5d132f82-6899-42cf-9690-446a25320fc6",
  "b6c07540-0dc4-4307-91b6-46c8f5b3b816",
  "727cc66b-24b2-477b-b2f8-0fc9911fea1c",
  "7c6592d5-c43b-4a7d-8dbf-e3afc9c7858a",
  "81408cd6-6d90-4b2a-a21b-236417676907",
]);

const CITY_COORDINATES: Record<string, [number, number]> = {
  "philadelphia,pa": [39.9526, -75.1652],
  "philadelphia,pennsylvania": [39.9526, -75.1652],
  "pittsburgh,pa": [40.4406, -79.9959],
  "pittsburgh,pennsylvania": [40.4406, -79.9959],
  "quakertown,pa": [40.4418, -75.3416],
  "quakertown,pennsylvania": [40.4418, -75.3416],
  "boyertown,pa": [40.3337, -75.6374],
  "boyertown,pennsylvania": [40.3337, -75.6374],
  "pennsburg,pa": [40.3909, -75.4921],
  "pennsburg,pennsylvania": [40.3909, -75.4921],
  "souderton,pa": [40.3118, -75.3252],
  "souderton,pennsylvania": [40.3118, -75.3252],
  "allentown,pa": [40.6023, -75.4714],
  "allentown,pennsylvania": [40.6023, -75.4714],
  "williamsport,pa": [41.2412, -77.0011],
  "williamsport,pennsylvania": [41.2412, -77.0011],
  "kingofprussia,pa": [40.1013, -75.3836],
  "kingofprussia,pennsylvania": [40.1013, -75.3836],
  "levittown,pa": [40.1551, -74.8288],
  "levittown,pennsylvania": [40.1551, -74.8288],
  "cherryhill,nj": [39.9268, -75.0246],
  "cherryhill,newjersey": [39.9268, -75.0246],
  "austin,tx": [30.2672, -97.7431],
  "austin,texas": [30.2672, -97.7431],
  "denver,co": [39.7392, -104.9903],
  "denver,colorado": [39.7392, -104.9903],
  "atlanta,ga": [33.7490, -84.3880],
  "atlanta,georgia": [33.7490, -84.3880],
  "boston,ma": [42.3601, -71.0589],
  "boston,massachusetts": [42.3601, -71.0589],
  "sandiego,ca": [32.7157, -117.1611],
  "sandiego,california": [32.7157, -117.1611],
  "seattle,wa": [47.6062, -122.3321],
  "seattle,washington": [47.6062, -122.3321],
  "cromwell,mn": [46.6766, -92.8802],
  "cromwell,minnesota": [46.6766, -92.8802],
};

const GURU_SELECT_ATTEMPTS = ["*"];

const PUBLIC_GURU_PROFILE_BASE_PATH = "/guru";
const BOOK_GURU_BASE_PATH = "/book";

const DEMO_GURU_NAMES = new Set([
  "avery",
  "caleb",
  "darius",
  "emma",
  "jordan",
  "marcus",
  "maya",
  "nina",
  "olivia",
  "sofia",
  "suzy",
]);

const PUBLIC_SEARCH_FALLBACK_TABLES = [
  "public_guru_search_profiles",
  "gurus",
];

function Card({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[28px] border border-slate-200 bg-white shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

function formatLocation(city?: string | null, state?: string | null) {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return "Location not listed";
}

const RATE_UNIT_LABELS: Record<string, string> = {
  hour: "hour",
  visit: "visit",
  walk: "walk",
  session: "session",
  day: "day",
  night: "night",
  stay: "stay",
  pet: "pet",
  add_on: "add-on",
  custom: "custom quote",
};

function formatCurrencyAmount(value: number | string | null | undefined) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) return "";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function normalizeServiceKey(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getServiceAliases(value: string) {
  const normalized = normalizeServiceKey(value);
  const aliases = new Set([normalized]);

  if (normalized.includes("walk")) aliases.add("dog_walking");
  if (normalized.includes("drop") || normalized.includes("visit")) {
    aliases.add("drop_in_visit");
    aliases.add("drop_in_visits");
    aliases.add("drop_in_care");
  }
  if (normalized.includes("pet_sitting") || normalized === "sitting") {
    aliases.add("pet_sitting");
  }
  if (normalized.includes("house")) aliases.add("house_sitting");
  if (normalized.includes("board")) aliases.add("boarding");
  if (normalized.includes("day_care") || normalized.includes("daycare")) {
    aliases.add("doggy_day_care");
    aliases.add("dog_day_care");
  }
  if (normalized.includes("train")) aliases.add("training_support");
  if (normalized.includes("medication")) aliases.add("medication_help");
  if (normalized.includes("taxi")) aliases.add("pet_taxi");
  if (normalized.includes("custom")) aliases.add("custom_care");

  return aliases;
}

function serviceRateMatches(rate: GuruServiceRate, selectedService: string) {
  if (!selectedService) return false;

  const selectedAliases = getServiceAliases(selectedService);
  const rateAliases = new Set([
    ...getServiceAliases(rate.service_key || ""),
    ...getServiceAliases(rate.service_label || ""),
  ]);

  return Array.from(selectedAliases).some((alias) => rateAliases.has(alias));
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
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
}

function isBlockedGuruAccount(guru: GuruRow) {
  return getGuruIdentityValues(guru).some((value) =>
    PERMANENTLY_BLOCKED_GURU_IDS.has(value),
  );
}

function getGuruRateLookupIds(guru: GuruRow) {
  return Array.from(
    new Set(
      [
        guru.id,
        guru.guru_id,
        guru.user_id,
        guru.profile_id,
      ]
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );
}

function getEnabledGuruRates(
  guru: GuruRow,
  serviceRatesByGuru: Record<string, GuruServiceRate[]>,
) {
  const ratesByIdentity = getGuruRateLookupIds(guru).flatMap(
    (id) => serviceRatesByGuru[id] || [],
  );
  const seenRates = new Set<string>();

  return ratesByIdentity
    .filter((rate) => {
      const rateKey = String(
        rate.id || `${rate.guru_id}-${rate.service_key}-${rate.service_label}`,
      );

      if (seenRates.has(rateKey)) return false;
      seenRates.add(rateKey);
      return true;
    })
    .filter((rate) => rate.is_enabled !== false)
    .filter(
      (rate) => rate.rate_unit === "custom" || Number(rate.rate_amount) >= 0,
    );
}

function formatServiceRate(rate: GuruServiceRate) {
  const unit = RATE_UNIT_LABELS[String(rate.rate_unit || "visit")] || "visit";

  if (rate.rate_unit === "custom") {
    return {
      primary: "Custom quote",
      detail: rate.service_label || "Rates by service",
    };
  }

  const amount = formatCurrencyAmount(rate.rate_amount);

  if (!amount) {
    return {
      primary: "Rate pending",
      detail: rate.service_label || "Rates by service",
    };
  }

  return {
    primary: amount,
    detail: `/${unit}${rate.duration_minutes ? ` · ${rate.duration_minutes} min` : ""}`,
  };
}

function getLowestPricedRate(rates: GuruServiceRate[]) {
  const customRate = rates.find((rate) => rate.rate_unit === "custom");
  const pricedRates = rates
    .filter((rate) => rate.rate_unit !== "custom")
    .map((rate) => ({ rate, amount: Number(rate.rate_amount) }))
    .filter((item) => Number.isFinite(item.amount) && item.amount >= 0)
    .sort((a, b) => a.amount - b.amount);

  return pricedRates[0]?.rate || customRate || null;
}

function getGuruRateDisplay(
  guru: GuruRow,
  selectedService: string,
  serviceRatesByGuru: Record<string, GuruServiceRate[]>,
): GuruRateDisplay {
  const enabledRates = getEnabledGuruRates(guru, serviceRatesByGuru);

  if (enabledRates.length > 0) {
    const selectedRate = selectedService
      ? enabledRates.find((rate) => serviceRateMatches(rate, selectedService))
      : null;
    const fallbackRate = selectedRate || getLowestPricedRate(enabledRates);

    if (fallbackRate) {
      const formatted = formatServiceRate(fallbackRate);

      return {
        eyebrow: selectedRate ? "Rate" : "From",
        primary: formatted.primary,
        detail: selectedRate
          ? `${fallbackRate.service_label || selectedService} ${formatted.detail}`
          : `Rates by service ${formatted.detail}`,
        serviceLabel:
          fallbackRate.service_label || selectedService || "Rates by service",
        isFallback: false,
      };
    }
  }

  const fallbackRate = getGuruRate(guru);

  return {
    eyebrow: "Rate",
    primary: fallbackRate === null ? "Rate pending" : `$${fallbackRate}`,
    detail: fallbackRate === null ? "Rates not listed" : "/hr",
    serviceLabel: "Base hourly rate",
    isFallback: true,
  };
}

function getGuruName(guru: GuruRow) {
  return guru.display_name || guru.full_name || guru.name || "Guru";
}

function getGuruCity(guru: GuruRow) {
  return String(guru.service_city || guru.city || "").trim();
}

function getGuruState(guru: GuruRow) {
  return String(guru.service_state || guru.state || "").trim();
}

function getGuruZip(guru: GuruRow) {
  return cleanZip(guru.service_zip || guru.service_zip_code || guru.zip_code || "");
}

function isNegativeGuruStatus(value?: string | null) {
  const normalized = String(value || "").trim().toLowerCase();

  return [
    "inactive",
    "suspended",
    "rejected",
    "paused",
    "deleted",
    "archived",
    "not_approved",
    "not approved",
  ].includes(normalized);
}

function hasExplicitFalse(value: unknown) {
  return value === false || String(value || "").trim().toLowerCase() === "false";
}

function hasPositiveValue(value: unknown) {
  const normalized = String(value || "").trim().toLowerCase();

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
    ].includes(normalized)
  );
}

function isValidEmail(value?: string | null) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function isSearchSuppressedGuru(guru: GuruRow) {
  const status = String(guru.status || "").trim().toLowerCase();
  const applicationStatus = String(guru.application_status || "")
    .trim()
    .toLowerCase();

  if (hasExplicitFalse(guru.is_public)) return true;
  if (hasExplicitFalse(guru.is_public_visible)) return true;
  if (hasExplicitFalse(guru.is_active)) return true;

  return isNegativeGuruStatus(status) || isNegativeGuruStatus(applicationStatus);
}

function isPublicSearchGuru(guru: GuruRow) {
  const status = String(guru.status || "").trim().toLowerCase();
  const applicationStatus = String(guru.application_status || "")
    .trim()
    .toLowerCase();
  const adminStatus = String(guru.admin_status || "").trim().toLowerCase();
  const publicStatus = String(guru.public_status || "").trim().toLowerCase();

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
  const status = String(guru.status || "").trim().toLowerCase();
  const applicationStatus = String(guru.application_status || "")
    .trim()
    .toLowerCase();

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

function normalizeFillInMatchValue(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

function getGuruCandidateNameValues(guru: GuruRow) {
  return [
    guru.display_name,
    guru.full_name,
    guru.name,
    guru.slug,
    typeof guru.email === "string" ? guru.email.split("@")[0] : "",
  ]
    .map((value) => normalizeFillInMatchValue(value))
    .filter(Boolean)
    .flatMap((value) => {
      const firstName = value.split(" ")[0] || "";
      const compact = value.replace(/\s+/g, "");
      return [value, firstName, compact].filter(Boolean);
    });
}

function isDemoSearchGuru(guru: GuruRow) {
  const candidates = getGuruCandidateNameValues(guru);
  const hasDemoName = candidates.some((candidate) => {
    if (DEMO_GURU_NAMES.has(candidate)) return true;

    return Array.from(DEMO_GURU_NAMES).some((name) =>
      candidate.startsWith(name),
    );
  });

  if (!hasDemoName) return false;
  if (!getGuruCity(guru) || !getGuruState(guru)) return false;

  const qualityStatus = String(guru.profile_quality_status || "")
    .trim()
    .toLowerCase();
  const source = String(guru.source || guru.profile_source || guru.search_source || "")
    .trim()
    .toLowerCase();
  const email = String(guru.email || "").trim().toLowerCase();

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

function isDisplayOnlySearchGuru(guru: GuruRow) {
  return !isBookableSearchGuru(guru) || isDemoSearchGuru(guru);
}

function getGuruPhotoUrl(guru: GuruRow) {
  return (
    guru.profile_photo_url ||
    guru.photo_url ||
    guru.avatar_url ||
    guru.image_url ||
    ""
  );
}

function getGuruPublicIdentifier(guru: GuruRow) {
  return encodeURIComponent(String(guru.slug || guru.id));
}

function getGuruHref(guru: GuruRow) {
  return `${PUBLIC_GURU_PROFILE_BASE_PATH}/${getGuruPublicIdentifier(guru)}`;
}

function getBookGuruHref(guru: GuruRow) {
  return `${BOOK_GURU_BASE_PATH}/${getGuruPublicIdentifier(guru)}`;
}

function getGuruRating(guru: GuruRow) {
  if (typeof guru.rating_avg === "number") return guru.rating_avg;
  if (typeof guru.rating === "number") return guru.rating;
  return 0;
}

function getGuruRate(guru: GuruRow) {
  const hourlyRate = Number(guru.hourly_rate);
  const baseRate = Number(guru.rate);

  if (Number.isFinite(hourlyRate) && hourlyRate > 0) return hourlyRate;
  if (Number.isFinite(baseRate) && baseRate > 0) return baseRate;

  return null;
}

function getGuruAnalyticsId(guru: GuruRow) {
  return String(guru.user_id || guru.id || "");
}

function getGuruCertificationUserId(guru: GuruRow) {
  return String(guru.user_id || "").trim();
}

function certificationStatusMeansComplete(value?: string | null) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  return [
    "issued",
    "complete",
    "completed",
    "done",
    "approved",
    "certified",
    "graduate",
    "graduated",
  ].includes(normalized);
}

function certificationRowMeansComplete(row: AcademyCertificationRow) {
  return Boolean(
    row.issued_at ||
      certificationStatusMeansComplete(row.badge_status) ||
      certificationStatusMeansComplete(row.certificate_status),
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "SG";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function cleanZip(value?: string | null) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 5);
}

function readNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeStateCode(value?: string | null) {
  const state = String(value || "").trim();

  if (!state) return "";

  const normalized = state.toUpperCase();
  const stateMap: Record<string, string> = {
    PENNSYLVANIA: "PA",
    "NEW JERSEY": "NJ",
    DELAWARE: "DE",
    MARYLAND: "MD",
    "NEW YORK": "NY",
    MINNESOTA: "MN",
  };

  return stateMap[normalized] || normalized.slice(0, 2);
}

function parseCoordinate(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getGuruLatitude(guru: GuruRow) {
  return parseCoordinate(guru.service_latitude ?? guru.latitude ?? guru.lat);
}

function getGuruLongitude(guru: GuruRow) {
  return parseCoordinate(guru.service_longitude ?? guru.longitude ?? guru.lng);
}

function getGuruRadius(guru: GuruRow) {
  const radiusCandidateKeys = [
    "service_radius_miles",
    "serviceRadiusMiles",
    "service_area_radius_miles",
    "serviceAreaRadiusMiles",
    "service_area_radius",
    "serviceAreaRadius",
    "travel_radius_miles",
    "travelRadiusMiles",
    "travel_radius",
    "travelRadius",
    "willing_to_travel_miles",
    "willingToTravelMiles",
    "willing_to_travel",
    "willingToTravel",
    "max_travel_miles",
    "maxTravelMiles",
    "max_travel_distance_miles",
    "maxTravelDistanceMiles",
    "max_distance_miles",
    "maxDistanceMiles",
    "service_distance_miles",
    "serviceDistanceMiles",
    "coverage_radius_miles",
    "coverageRadiusMiles",
    "radius_miles",
    "radiusMiles",
    "service_radius",
    "serviceRadius",
    "radius",
  ];

  const explicitRadius = radiusCandidateKeys
    .map((key) => readNumber(guru[key], Number.NaN))
    .find((value) => Number.isFinite(value) && value > 0);

  if (typeof explicitRadius === "number") {
    return Math.min(Math.round(explicitRadius), 100);
  }

  const discoveredRadius = Object.entries(guru)
    .filter(([key]) => {
      const normalizedKey = key.toLowerCase();
      return (
        normalizedKey.includes("radius") ||
        normalizedKey.includes("travel") ||
        normalizedKey.includes("distance")
      );
    })
    .map(([, value]) => readNumber(value, Number.NaN))
    .find((value) => Number.isFinite(value) && value > 0 && value <= 100);

  if (typeof discoveredRadius === "number") {
    return Math.min(Math.round(discoveredRadius), 100);
  }

  return 25;
}

function calculateDistanceMiles(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number,
) {
  const earthRadiusMiles = 3958.8;
  const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const latitudeDifference = degreesToRadians(toLatitude - fromLatitude);
  const longitudeDifference = degreesToRadians(toLongitude - fromLongitude);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(degreesToRadians(fromLatitude)) *
      Math.cos(degreesToRadians(toLatitude)) *
      Math.sin(longitudeDifference / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMiles * c;
}

function locationsMatchByText(guru: GuruRow, location: ZipLookupResult | null) {
  if (!location) return false;

  const guruZip = getGuruZip(guru);

  if (guruZip && guruZip === location.zip) return true;

  const guruCity = normalizeText(getGuruCity(guru));
  const guruState = normalizeStateCode(getGuruState(guru));
  const locationCity = normalizeText(location.city);
  const locationState = normalizeStateCode(location.state || location.stateName);

  return Boolean(
    guruCity &&
      locationCity &&
      guruCity === locationCity &&
      (!guruState || !locationState || guruState === locationState),
  );
}

function getGuruZipFallbackCoordinates(
  guru: GuruRow,
  guruZipLookupsByZip: Record<string, ZipLookupResult> = {},
): [number, number] | null {
  const zip = getGuruZip(guru);
  const zipLookup = zip ? guruZipLookupsByZip[zip] : null;

  if (
    zipLookup &&
    typeof zipLookup.latitude === "number" &&
    typeof zipLookup.longitude === "number" &&
    Number.isFinite(zipLookup.latitude) &&
    Number.isFinite(zipLookup.longitude)
  ) {
    return [zipLookup.latitude, zipLookup.longitude];
  }

  return null;
}

function getGuruSearchCoordinates(
  guru: GuruRow,
  guruZipLookupsByZip: Record<string, ZipLookupResult> = {},
): [number, number] | null {
  const latitude = getGuruLatitude(guru);
  const longitude = getGuruLongitude(guru);

  if (latitude !== null && longitude !== null) {
    return [latitude, longitude];
  }

  return (
    getGuruZipFallbackCoordinates(guru, guruZipLookupsByZip) ||
    getGuruFallbackCoordinates(guru)
  );
}

function getDistanceFromSearchLocation(
  guru: GuruRow,
  searchLocation: ZipLookupResult | null,
  guruZipLookupsByZip: Record<string, ZipLookupResult> = {},
) {
  if (
    !searchLocation ||
    typeof searchLocation.latitude !== "number" ||
    typeof searchLocation.longitude !== "number" ||
    !Number.isFinite(searchLocation.latitude) ||
    !Number.isFinite(searchLocation.longitude)
  ) {
    return null;
  }

  const coordinates = getGuruSearchCoordinates(guru, guruZipLookupsByZip);

  if (!coordinates) return null;

  return calculateDistanceMiles(
    searchLocation.latitude,
    searchLocation.longitude,
    coordinates[0],
    coordinates[1],
  );
}

function guruServesSearchLocation(
  guru: GuruRow,
  searchLocation: ZipLookupResult | null,
  zipFilter: string,
  guruZipLookupsByZip: Record<string, ZipLookupResult> = {},
) {
  const zip = cleanZip(zipFilter);

  if (!zip) return true;

  if (guru.service_area_enabled === false) return false;

  const textLocationMatches = locationsMatchByText(guru, searchLocation);

  if (textLocationMatches) return true;

  const distanceMiles = getDistanceFromSearchLocation(
    guru,
    searchLocation,
    guruZipLookupsByZip,
  );

  if (distanceMiles === null) {
    return cleanZip(guru.zip_code) === zip;
  }

  return distanceMiles <= getGuruRadius(guru);
}

function enrichGuruWithDistance(
  guru: GuruRow,
  searchLocation: ZipLookupResult | null,
  guruZipLookupsByZip: Record<string, ZipLookupResult> = {},
): GuruRow {
  const textLocationMatches = locationsMatchByText(guru, searchLocation);
  const distanceMiles = textLocationMatches
    ? 0
    : getDistanceFromSearchLocation(
        guru,
        searchLocation,
        guruZipLookupsByZip,
      );

  const normalizedServiceRadiusMiles = getGuruRadius(guru);
  const zipFallbackCoordinates = getGuruZipFallbackCoordinates(
    guru,
    guruZipLookupsByZip,
  );

  return {
    ...guru,
    service_latitude:
      getGuruLatitude(guru) ?? zipFallbackCoordinates?.[0] ?? guru.service_latitude,
    service_longitude:
      getGuruLongitude(guru) ??
      zipFallbackCoordinates?.[1] ??
      guru.service_longitude,
    service_radius_miles: normalizedServiceRadiusMiles,
    service_radius_display: normalizedServiceRadiusMiles,
    distance_miles: distanceMiles,
  };
}

function GuruResultPhoto({
  photoUrl,
  guruName,
  isAcademyCertified,
}: {
  photoUrl: string;
  guruName: string;
  isAcademyCertified: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showPhoto = Boolean(photoUrl) && !imageFailed;

  return (
    <div className="relative h-80 w-full shrink-0 overflow-hidden bg-slate-100 md:h-full md:min-h-0 md:w-[300px] md:self-stretch xl:w-[320px]">
      {isAcademyCertified ? (
        <AcademyGraduateBadge
          academyType="guru"
          variant="photo-overlay"
          className="absolute left-5 top-5 z-10 h-[74px] w-[74px] md:h-[86px] md:w-[86px]"
        />
      ) : null}

      {showPhoto ? (
        <img
          src={photoUrl}
          alt={guruName}
          className="h-full w-full object-cover object-center"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="flex h-full min-h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-100">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-emerald-200 bg-white text-2xl font-black text-emerald-700 shadow-sm">
            {getInitials(guruName)}
          </div>
        </div>
      )}
    </div>
  );
}

function matchesService(guru: GuruRow, selectedService: string) {
  if (!selectedService) return true;

  const services = guru.services || [];
  if (!services.length) return false;

  return services.some(
    (service) => service.toLowerCase() === selectedService.toLowerCase(),
  );
}

function normalizeText(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

function normalizeLocationKey(city?: string | null, state?: string | null) {
  return `${city || ""},${state || ""}`.toLowerCase().replace(/\s+/g, "");
}

function hasValidCoordinates(guru: GuruRow) {
  const latitude = getGuruLatitude(guru);
  const longitude = getGuruLongitude(guru);

  return Boolean(
    latitude !== null &&
      longitude !== null &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180 &&
      latitude !== 0 &&
      longitude !== 0,
  );
}

function getGuruFallbackCoordinates(guru: GuruRow) {
  return CITY_COORDINATES[normalizeLocationKey(getGuruCity(guru), getGuruState(guru))] || null;
}

function hasMapLocation(guru: GuruRow) {
  return hasValidCoordinates(guru) || Boolean(getGuruFallbackCoordinates(guru));
}

function getSearchMapCenter({
  filteredGurus,
  cityFilter,
  stateFilter,
  zipLookup,
}: {
  filteredGurus: GuruRow[];
  cityFilter: string;
  stateFilter: string;
  zipLookup: ZipLookupResult | null;
}): [number, number] {
  if (
    typeof zipLookup?.latitude === "number" &&
    typeof zipLookup?.longitude === "number" &&
    Number.isFinite(zipLookup.latitude) &&
    Number.isFinite(zipLookup.longitude)
  ) {
    return [zipLookup.latitude, zipLookup.longitude];
  }

  const searchedLocation =
    CITY_COORDINATES[normalizeLocationKey(cityFilter, stateFilter)];

  if (searchedLocation) return searchedLocation;

  const firstExactGuru = filteredGurus.find(hasValidCoordinates);

  if (
    firstExactGuru &&
    getGuruLatitude(firstExactGuru) !== null &&
    getGuruLongitude(firstExactGuru) !== null
  ) {
    return [getGuruLatitude(firstExactGuru)!, getGuruLongitude(firstExactGuru)!];
  }

  const firstFallbackGuru = filteredGurus.find((guru) =>
    Boolean(getGuruFallbackCoordinates(guru)),
  );

  if (firstFallbackGuru) {
    const fallback = getGuruFallbackCoordinates(firstFallbackGuru);

    if (fallback) return fallback;
  }

  return DEFAULT_MAP_CENTER;
}

function detectSourceFromUrl() {
  if (typeof window === "undefined") return "direct";

  const params = new URLSearchParams(window.location.search);
  const sourceParam =
    params.get("source") || params.get("utm_source") || params.get("ref") || "";

  const normalized = sourceParam.trim().toLowerCase();

  if (!normalized) return "direct";
  if (normalized.includes("instagram") || normalized === "ig")
    return "instagram";
  if (normalized.includes("facebook") || normalized === "fb") return "facebook";
  if (normalized.includes("tiktok") || normalized === "tt") return "tiktok";
  if (normalized.includes("referral")) return "referral";
  if (normalized.includes("email")) return "email";

  return normalized;
}

function normalizeDedupeValue(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isGenericGuruName(value?: string | null) {
  const normalized = normalizeDedupeValue(value);

  return !normalized || ["guru", "pet care guru", "sitter", "pet sitter"].includes(normalized);
}

function getGuruDedupeKeys(guru: GuruRow) {
  const keys = new Set<string>();
  const email = String(guru.email || "").trim().toLowerCase();
  const userId = String(guru.user_id || "").trim();
  const slug = normalizeDedupeValue(guru.slug);
  const name = normalizeDedupeValue(getGuruName(guru));
  const city = normalizeDedupeValue(getGuruCity(guru));
  const state = normalizeStateCode(getGuruState(guru));
  const zip = getGuruZip(guru);
  const photo = String(getGuruPhotoUrl(guru) || "").trim().toLowerCase();
  const source = String(guru.source || guru.profile_source || guru.search_source || "")
    .trim()
    .toLowerCase();
  const qualityStatus = String(guru.profile_quality_status || "")
    .trim()
    .toLowerCase();
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

  if (!keys.size && guru.id) keys.add(`id:${String(guru.id)}`);

  return Array.from(keys);
}

function getGuruQualityScore(guru: GuruRow) {
  const source = String(guru.source || guru.profile_source || guru.search_source || "")
    .trim()
    .toLowerCase();
  const qualityStatus = String(guru.profile_quality_status || "")
    .trim()
    .toLowerCase();
  const radius = getGuruRadius(guru);

  let score = 0;

  if (isBookableSearchGuru(guru)) score += 80;
  if (isPublicSearchGuru(guru)) score += 50;
  if (isValidEmail(guru.email)) score += 18;
  if (!isGenericGuruName(getGuruName(guru))) score += 12;
  if (getGuruZip(guru)) score += 10;
  if (getGuruCity(guru)) score += 8;
  if (getGuruState(guru)) score += 8;
  if (!getGuruZip(guru) && (!getGuruCity(guru) || !getGuruState(guru))) score -= 40;
  if (getGuruPhotoUrl(guru)) score += 12;
  if (String(guru.bio || "").trim()) score += 12;
  if (Array.isArray(guru.services) && guru.services.length) score += guru.services.length;
  if (getGuruRate(guru) !== null) score += 8;
  if (radius > 0) score += 4;
  if (hasValidCoordinates(guru)) score += 8;
  if (guru.is_verified) score += 6;
  if (typeof guru.review_count === "number" && guru.review_count > 0) score += 4;
  if (source.includes("public_search") || source.includes("override")) score += 8;
  if (source.includes("profile fallback") || source.includes("fallback")) score -= 18;
  if (qualityStatus.includes("orphan")) score -= 25;
  if (qualityStatus.includes("fallback")) score -= 12;

  return score;
}

function chooseTextValue(primary: unknown, secondary: unknown) {
  const primaryText = String(primary || "").trim();
  if (primaryText) return primary;

  const secondaryText = String(secondary || "").trim();
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

function chooseSearchBoolean(
  primary: unknown,
  secondary: unknown,
): boolean | null | undefined {
  if (primary === true || secondary === true) return true;
  if (primary === false && secondary === false) return false;
  if (typeof primary === "boolean") return primary;
  if (typeof secondary === "boolean") return secondary;
  return undefined;
}

function mergeServices(primary?: string[] | null, secondary?: string[] | null) {
  const services = [...(primary || []), ...(secondary || [])]
    .map((service) => String(service || "").trim())
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

function dedupeGuruRows(guruRows: GuruRow[]) {
  const mergedRows: GuruRow[] = [];
  const keyToIndex = new Map<string, number>();

  guruRows.forEach((guru) => {
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

async function loadSearchRowsFromFallbackTables() {
  for (const tableName of PUBLIC_SEARCH_FALLBACK_TABLES) {
    for (const selectColumns of GURU_SELECT_ATTEMPTS) {
      const { data, error: tableError } = await supabase
        .from(tableName)
        .select(selectColumns)
        .limit(250);

      if (!tableError) {
        return (((data || []) as unknown) as GuruRow[])
          .filter(shouldDisplaySearchGuru)
          .filter((guru) => !isBlockedGuruAccount(guru));
      }

      console.warn(
        `Could not load fallback Guru search rows from ${tableName}:`,
        tableError.message,
      );
    }
  }

  return [];
}

function SearchPageContent() {
  const searchParams = useSearchParams();

  const initialService = searchParams.get("service") || "";
  const initialCity = searchParams.get("city") || "";
  const initialState = searchParams.get("state") || "";
  const initialZip = cleanZip(searchParams.get("zip") || "");
  const selectedGuruId =
    searchParams.get("guru") || searchParams.get("guruId") || "";
  const selectedGuruSlug = searchParams.get("slug") || "";

  const [gurus, setGurus] = useState<GuruRow[]>([]);
  const [certifiedGuruUserIds, setCertifiedGuruUserIds] = useState<Set<string>>(
    new Set(),
  );
  const [serviceRatesByGuru, setServiceRatesByGuru] = useState<
    Record<string, GuruServiceRate[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [serviceFilter, setServiceFilter] = useState(initialService);
  const [zipFilter, setZipFilter] = useState(initialZip);
  const [cityFilter, setCityFilter] = useState(initialCity);
  const [stateFilter, setStateFilter] = useState(initialState);
  const [searchTerm, setSearchTerm] = useState("");

  const [zipLookup, setZipLookup] = useState<ZipLookupResult | null>(null);
  const [guruZipLookupsByZip, setGuruZipLookupsByZip] = useState<
    Record<string, ZipLookupResult>
  >({});
  const [zipLookupStatus, setZipLookupStatus] = useState<
    "idle" | "loading" | "found" | "not_found"
  >("idle");

  const [highlightedGuruId, setHighlightedGuruId] = useState<
    string | undefined
  >(undefined);

  const hasTrackedSearchPageVisit = useRef(false);
  const lastTrackedSearchKey = useRef("");
  const hoveredGuruIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (hasTrackedSearchPageVisit.current) return;

    hasTrackedSearchPageVisit.current = true;

    trackEvent({
      eventName: "search_page_visit",
      eventType: "traffic",
      source: detectSourceFromUrl(),
      metadata: {
        referrer: document.referrer || "",
        url: window.location.href,
        search: window.location.search,
        pathname: window.location.pathname,
        initial_service: initialService,
        initial_zip: initialZip,
        initial_city: initialCity,
        initial_state: initialState,
        selected_guru_id: selectedGuruId,
        selected_guru_slug: selectedGuruSlug,
      },
    });
  }, [
    initialService,
    initialZip,
    initialCity,
    initialState,
    selectedGuruId,
    selectedGuruSlug,
  ]);

  useEffect(() => {
    async function loadGurus() {
      setLoading(true);
      setError("");

      let guruRows: GuruRow[] = [];
      let gurusErrorMessage = "";

      try {
        const response = await fetch("/api/gurus/public-search", {
          cache: "no-store",
        });

        if (response.ok) {
          const payload = (await response.json()) as { gurus?: GuruRow[] };
          guruRows = Array.isArray(payload.gurus) ? payload.gurus : [];
        } else {
          gurusErrorMessage = `Public Guru API returned ${response.status}`;
        }
      } catch (apiError) {
        gurusErrorMessage =
          apiError instanceof Error
            ? apiError.message
            : "Public Guru API could not be reached.";
      }

      guruRows = guruRows
        .filter(shouldDisplaySearchGuru)
        .filter((guru) => !isBlockedGuruAccount(guru));

      if (gurusErrorMessage || guruRows.length === 0) {
        const fallbackGuruRows = await loadSearchRowsFromFallbackTables();

        if (fallbackGuruRows.length > 0) {
          guruRows = fallbackGuruRows;
          gurusErrorMessage = "";
        }
      }

      guruRows = dedupeGuruRows(guruRows);

      const guruIds = Array.from(
        new Set(guruRows.flatMap((guru) => getGuruRateLookupIds(guru))),
      );

      const guruUserIds = Array.from(
        new Set(
          guruRows
            .map((guru) => getGuruCertificationUserId(guru))
            .filter(Boolean),
        ),
      );

      if (guruIds.length > 0) {
        const { data: serviceRateRows, error: serviceRatesError } =
          await supabase
            .from("guru_service_rates")
            .select(
              "id, guru_id, service_key, service_label, is_enabled, rate_amount, rate_unit, duration_minutes, notes",
            )
            .in("guru_id", guruIds)
            .eq("is_enabled", true);

        if (serviceRatesError) {
          console.warn(
            "Could not load guru service rates for search cards:",
            serviceRatesError.message,
          );
          setServiceRatesByGuru({});
        } else {
          const groupedRates = ((serviceRateRows || []) as GuruServiceRate[]).reduce<
            Record<string, GuruServiceRate[]>
          >((accumulator, rate) => {
            const guruId = String(rate.guru_id || "");
            if (!guruId) return accumulator;

            accumulator[guruId] = [...(accumulator[guruId] || []), rate];
            return accumulator;
          }, {});

          setServiceRatesByGuru(groupedRates);
        }
      } else {
        setServiceRatesByGuru({});
      }

      let loadedCertifiedGuruUserIds = new Set<string>();

      if (guruUserIds.length > 0) {
        const { data: certificationRows, error: certificationsError } =
          await supabase
            .from("academy_certifications")
            .select("user_id, badge_status, certificate_status, issued_at")
            .eq("academy_type", "guru")
            .in("user_id", guruUserIds);

        if (certificationsError) {
          console.warn(
            "Could not load Guru Academy certifications for search cards:",
            certificationsError.message,
          );
          setCertifiedGuruUserIds(new Set());
        } else {
          const completedUserIds = new Set(
            ((certificationRows || []) as AcademyCertificationRow[])
              .filter(certificationRowMeansComplete)
              .map((row) => String(row.user_id || "").trim())
              .filter(Boolean),
          );

          loadedCertifiedGuruUserIds = completedUserIds;
          setCertifiedGuruUserIds(completedUserIds);
        }
      } else {
        setCertifiedGuruUserIds(new Set());
      }

      setGurus(guruRows);
      setLoading(false);

      trackEvent({
        eventName: "search_gurus_loaded",
        eventType: "system",
        source: detectSourceFromUrl(),
        metadata: {
          guru_count: guruRows.length,
          guru_count_with_map_location: guruRows.filter((guru) => Boolean(getGuruSearchCoordinates(guru))).length,
          guru_count_with_academy_badge: guruRows.filter((guru) =>
            loadedCertifiedGuruUserIds.has(getGuruCertificationUserId(guru)),
          ).length,
          has_initial_service: Boolean(initialService),
          has_initial_zip: Boolean(initialZip),
          has_initial_city: Boolean(initialCity),
          has_initial_state: Boolean(initialState),
        },
      });
    }

    loadGurus();
  }, [initialService, initialZip, initialCity, initialState]);

  useEffect(() => {
    const cleanedZip = cleanZip(zipFilter);

    if (!cleanedZip) {
      setZipLookup(null);
      setZipLookupStatus("idle");
      setCityFilter("");
      setStateFilter("");
      return;
    }

    if (cleanedZip.length !== 5) {
      setZipLookup(null);
      setZipLookupStatus("idle");
      setCityFilter("");
      setStateFilter("");
      return;
    }

    let cancelled = false;

    async function lookupZip() {
      try {
        setZipLookupStatus("loading");

        const response = await fetch(`/api/geo/zip?zip=${cleanedZip}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) {
            setZipLookup(null);
            setZipLookupStatus("not_found");
            setCityFilter("");
            setStateFilter("");
          }

          return;
        }

        const data = (await response.json()) as ZipLookupResult;

        if (cancelled) return;

        setZipLookup(data);
        setZipLookupStatus("found");
        setCityFilter(data.city || "");
        setStateFilter(data.state || data.stateName || "");

        trackEvent({
          eventName: "search_zip_autofilled",
          eventType: "search",
          source: detectSourceFromUrl(),
          role: "customer",
          metadata: {
            zip: data.zip,
            city: data.city,
            state: data.state,
            latitude: data.latitude,
            longitude: data.longitude,
          },
        });
      } catch (lookupError) {
        console.error("Find a Guru ZIP lookup failed:", lookupError);

        if (!cancelled) {
          setZipLookup(null);
          setZipLookupStatus("not_found");
          setCityFilter("");
          setStateFilter("");
        }
      }
    }

    const timer = window.setTimeout(() => {
      lookupZip();
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [zipFilter]);

  useEffect(() => {
    if (!gurus.length) {
      setGuruZipLookupsByZip((currentLookups) =>
        Object.keys(currentLookups).length ? {} : currentLookups,
      );
      return;
    }

    const uniqueGuruZips = Array.from(
      new Set(
        gurus
          .map((guru) => getGuruZip(guru))
          .filter((zip) => zip.length === 5),
      ),
    );

    const missingZips = uniqueGuruZips.filter(
      (zip) => !guruZipLookupsByZip[zip],
    );

    if (!missingZips.length) return;

    let cancelled = false;

    async function lookupGuruZips() {
      const lookupResults = await Promise.all(
        missingZips.map(async (zip) => {
          try {
            const response = await fetch(`/api/geo/zip?zip=${zip}`, {
              cache: "no-store",
            });

            if (!response.ok) return null;

            const data = (await response.json()) as ZipLookupResult;

            if (
              typeof data.latitude !== "number" ||
              typeof data.longitude !== "number" ||
              !Number.isFinite(data.latitude) ||
              !Number.isFinite(data.longitude)
            ) {
              return null;
            }

            return [zip, data] as const;
          } catch (lookupError) {
            console.warn(`Could not auto-map Guru ZIP ${zip}:`, lookupError);
            return null;
          }
        }),
      );

      if (cancelled) return;

      const nextLookupResults = lookupResults.filter(
        (result): result is readonly [string, ZipLookupResult] =>
          Boolean(result),
      );

      if (!nextLookupResults.length) return;

      setGuruZipLookupsByZip((currentLookups) => ({
        ...currentLookups,
        ...Object.fromEntries(nextLookupResults),
      }));
    }

    lookupGuruZips();

    return () => {
      cancelled = true;
    };
  }, [gurus, guruZipLookupsByZip]);

  const filteredGurus = useMemo(() => {
    const query = normalizeText(searchTerm);
    const city = normalizeText(cityFilter);
    const state = normalizeText(stateFilter);
    const zip = cleanZip(zipFilter);
    const selectedId = String(selectedGuruId || "").trim();
    const selectedSlug = String(selectedGuruSlug || "")
      .trim()
      .toLowerCase();

    return gurus
      .filter(shouldDisplaySearchGuru)
      .filter((guru) => !isBlockedGuruAccount(guru))
      .filter((guru) => {
        const guruName = normalizeText(getGuruName(guru));
        const guruCity = normalizeText(getGuruCity(guru));
        const guruState = normalizeText(getGuruState(guru));
        const guruZip = getGuruZip(guru);
        const guruBio = normalizeText(guru.bio);
        const guruTitle = normalizeText(guru.title);
        const guruServices = (guru.services || []).join(" ").toLowerCase();

        const matchesText =
          !query ||
          [
            guruName,
            guruCity,
            guruState,
            guruZip,
            guruBio,
            guruTitle,
            guruServices,
          ]
            .join(" ")
            .includes(query);

        const matchesCareRadius = guruServesSearchLocation(
          guru,
          zipLookup,
          zip,
          guruZipLookupsByZip,
        );
        const matchesManualCityFilter = zip
          ? true
          : !city || guruCity.includes(city);
        const matchesManualStateFilter = zip
          ? true
          : !state || guruState.includes(state);
        const matchesSelectedService = matchesService(guru, serviceFilter);

        return (
          matchesText &&
          matchesCareRadius &&
          matchesManualCityFilter &&
          matchesManualStateFilter &&
          matchesSelectedService
        );
      })
      .map((guru) =>
        enrichGuruWithDistance(guru, zipLookup, guruZipLookupsByZip),
      )
      .filter((guru) =>
        Boolean(getGuruSearchCoordinates(guru, guruZipLookupsByZip)),
      )
      .sort((a, b) => {
        const aSelected =
          (selectedId && String(a.id) === selectedId) ||
          (selectedSlug && String(a.slug || "").toLowerCase() === selectedSlug);
        const bSelected =
          (selectedId && String(b.id) === selectedId) ||
          (selectedSlug && String(b.slug || "").toLowerCase() === selectedSlug);

        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;

        const aDistance =
          typeof a.distance_miles === "number"
            ? a.distance_miles
            : Number.POSITIVE_INFINITY;
        const bDistance =
          typeof b.distance_miles === "number"
            ? b.distance_miles
            : Number.POSITIVE_INFINITY;

        if (aDistance !== bDistance) return aDistance - bDistance;

        return getGuruName(a).localeCompare(getGuruName(b));
      });
  }, [
    gurus,
    searchTerm,
    zipFilter,
    cityFilter,
    stateFilter,
    serviceFilter,
    zipLookup,
    guruZipLookupsByZip,
    selectedGuruId,
    selectedGuruSlug,
  ]);

  const mapReadyGuruCount = useMemo(
    () =>
      filteredGurus.filter((guru) =>
        Boolean(getGuruSearchCoordinates(guru, guruZipLookupsByZip)),
      ).length,
    [filteredGurus, guruZipLookupsByZip],
  );

  const mapMissingLocationCount = filteredGurus.length - mapReadyGuruCount;

  useEffect(() => {
    if (loading) return;

    const searchKey = JSON.stringify({
      serviceFilter,
      zipFilter: cleanZip(zipFilter),
      cityFilter: cityFilter.trim(),
      stateFilter: stateFilter.trim(),
      searchTerm: searchTerm.trim(),
      resultCount: filteredGurus.length,
    });

    const hasSearchInput =
      Boolean(serviceFilter) ||
      Boolean(cleanZip(zipFilter)) ||
      Boolean(cityFilter.trim()) ||
      Boolean(stateFilter.trim()) ||
      Boolean(searchTerm.trim());

    if (!hasSearchInput) return;
    if (lastTrackedSearchKey.current === searchKey) return;

    const timer = window.setTimeout(() => {
      lastTrackedSearchKey.current = searchKey;

      trackEvent({
        eventName: "search_started",
        eventType: "search",
        source: detectSourceFromUrl(),
        role: "customer",
        metadata: {
          location: "search_page",
          service: serviceFilter,
          zip: cleanZip(zipFilter),
          city: cityFilter.trim(),
          state: stateFilter.trim(),
          query: searchTerm.trim(),
          result_count: filteredGurus.length,
          map_ready_result_count: mapReadyGuruCount,
          total_gurus_loaded: gurus.length,
        },
      });
    }, 700);

    return () => window.clearTimeout(timer);
  }, [
    loading,
    serviceFilter,
    zipFilter,
    cityFilter,
    stateFilter,
    searchTerm,
    filteredGurus.length,
    mapReadyGuruCount,
    gurus.length,
  ]);

  const mapCenter = useMemo(
    () =>
      getSearchMapCenter({
        filteredGurus,
        cityFilter,
        stateFilter,
        zipLookup,
      }),
    [filteredGurus, cityFilter, stateFilter, zipLookup],
  );

  const activeFilterCount = [
    serviceFilter,
    cleanZip(zipFilter),
    cityFilter.trim(),
    stateFilter.trim(),
    searchTerm.trim(),
  ].filter(Boolean).length;

  function handleZipChange(value: string) {
    const cleanedZip = cleanZip(value);

    setZipFilter(cleanedZip);

    if (!cleanedZip) {
      setZipLookup(null);
      setZipLookupStatus("idle");
      setCityFilter("");
      setStateFilter("");
    }
  }

  function clearFilters(location: string) {
    trackEvent({
      eventName: "search_filters_cleared",
      eventType: "search",
      source: detectSourceFromUrl(),
      role: "customer",
      metadata: {
        location,
        previous_service: serviceFilter,
        previous_zip: cleanZip(zipFilter),
        previous_city: cityFilter.trim(),
        previous_state: stateFilter.trim(),
        previous_query: searchTerm.trim(),
        previous_result_count: filteredGurus.length,
      },
    });

    setServiceFilter("");
    setZipFilter("");
    setZipLookup(null);
    setZipLookupStatus("idle");
    setCityFilter("");
    setStateFilter("");
    setSearchTerm("");
  }

  function trackGuruHover(guru: GuruRow) {
    const guruId = String(guru.id);

    if (hoveredGuruIds.current.has(guruId)) return;

    hoveredGuruIds.current.add(guruId);

    trackEvent({
      eventName: "search_result_hovered",
      eventType: "engagement",
      source: detectSourceFromUrl(),
      guruId: getGuruAnalyticsId(guru),
      metadata: {
        location: "search_results",
        guru_id: guru.id,
        guru_name: getGuruName(guru),
        guru_city: getGuruCity(guru),
        guru_state: getGuruState(guru),
        guru_zip: getGuruZip(guru),
        guru_has_map_location: Boolean(
          getGuruSearchCoordinates(guru, guruZipLookupsByZip),
        ),
        selected_service: serviceFilter,
        result_count: filteredGurus.length,
      },
    });
  }

  function trackGuruProfileClick(guru: GuruRow, label: string) {
    trackEvent({
      eventName: "search_result_clicked",
      eventType: "profile",
      source: detectSourceFromUrl(),
      role: "customer",
      guruId: getGuruAnalyticsId(guru),
      metadata: {
        label,
        location: "search_results",
        destination: getGuruHref(guru),
        guru_id: guru.id,
        guru_name: getGuruName(guru),
        guru_city: getGuruCity(guru),
        guru_state: getGuruState(guru),
        guru_zip: getGuruZip(guru),
        selected_service: serviceFilter,
        zip_filter: cleanZip(zipFilter),
        city_filter: cityFilter.trim(),
        state_filter: stateFilter.trim(),
        query: searchTerm.trim(),
        result_count: filteredGurus.length,
      },
    });

    trackEvent({
      eventName: "guru_profile_view_clicked",
      eventType: "profile",
      source: detectSourceFromUrl(),
      role: "customer",
      guruId: getGuruAnalyticsId(guru),
      metadata: {
        location: "search_results",
        destination: getGuruHref(guru),
        guru_name: getGuruName(guru),
      },
    });
  }

  function trackBookingCtaClick(guru: GuruRow) {
    trackEvent({
      eventName: "booking_cta_clicked",
      eventType: "booking",
      source: detectSourceFromUrl(),
      role: "customer",
      guruId: getGuruAnalyticsId(guru),
      metadata: {
        location: "search_results",
        destination: getBookGuruHref(guru),
        guru_id: guru.id,
        guru_name: getGuruName(guru),
        selected_service: serviceFilter,
        zip_filter: cleanZip(zipFilter),
        city_filter: cityFilter.trim(),
        state_filter: stateFilter.trim(),
        query: searchTerm.trim(),
        result_count: filteredGurus.length,
      },
    });
  }

  return (
    <main className="min-h-screen bg-[#f8fcfd] text-slate-900">
      <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_34%),linear-gradient(135deg,#ffffff_0%,#f8fcfd_48%,#ecfdf5_100%)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-slate-200/40 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-[1500px] px-5 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Find a Guru
            </p>

            <h1 className="mt-3 max-w-5xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Search trusted local pet care by ZIP code
            </h1>

            <p className="mt-4 max-w-4xl text-base leading-7 text-slate-700 sm:text-lg">
              Enter your care ZIP code to find SitGuru providers who accept
              bookings inside their service radius. City and state will
              auto-fill and the map will center around your search area.
            </p>
          </div>

          <Card className="mt-8 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.85fr_1fr_0.85fr_1.15fr_auto]">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Service
                </label>
                <select
                  value={serviceFilter}
                  onChange={(event) => setServiceFilter(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="">All services</option>
                  {SERVICE_OPTIONS.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  ZIP Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={zipFilter}
                  onChange={(event) => handleZipChange(event.target.value)}
                  placeholder="18951"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  City
                </label>
                <input
                  type="text"
                  value={cityFilter}
                  onChange={(event) => setCityFilter(event.target.value)}
                  placeholder="Quakertown"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  State
                </label>
                <input
                  type="text"
                  value={stateFilter}
                  onChange={(event) => setStateFilter(event.target.value)}
                  placeholder="PA"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Search profile details
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Name, bio, title, services"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => clearFilters("top_filter_bar")}
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 xl:w-auto"
                >
                  Clear filters
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
                {filteredGurus.length} Guru
                {filteredGurus.length === 1 ? "" : "s"} found
              </span>

              {cleanZip(zipFilter) ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                  Radius-matched care area
                </span>
              ) : null}

              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
                {mapReadyGuruCount} map pin
                {mapReadyGuruCount === 1 ? "" : "s"} ready
              </span>

              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
                {activeFilterCount} active filter
                {activeFilterCount === 1 ? "" : "s"}
              </span>

              {zipLookupStatus === "loading" ? (
                <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-medium text-sky-700">
                  Looking up ZIP...
                </span>
              ) : null}

              {zipLookupStatus === "found" && zipLookup ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                  ZIP found: {zipLookup.city}, {zipLookup.state}
                </span>
              ) : null}

              {zipLookupStatus === "not_found" ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-amber-700">
                  ZIP not found
                </span>
              ) : null}
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
        {error ? (
          <Card className="mb-6 p-6">
            <p className="font-medium text-red-600">{error}</p>
          </Card>
        ) : null}

        {loading ? (
          <Card className="p-6">
            <p className="text-slate-600">Loading Gurus...</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
            <div className="space-y-5">
              {filteredGurus.length === 0 ? (
                <Card className="p-7">
                  <h2 className="text-xl font-bold text-slate-900">
                    No Gurus found
                  </h2>

                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
                    Try changing the ZIP code, service, or profile search. ZIP
                    searches now show only Gurus who accept care inside their
                    service radius for that location.
                  </p>

                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => clearFilters("no_results_reset")}
                      className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Reset Search
                    </button>
                  </div>
                </Card>
              ) : (
                filteredGurus.map((guru) => {
                  const photoUrl = getGuruPhotoUrl(guru);
                  const guruName = getGuruName(guru);
                  const guruRateDisplay = getGuruRateDisplay(
                    guru,
                    serviceFilter,
                    serviceRatesByGuru,
                  );
                  const guruRating = getGuruRating(guru);
                  const services = guru.services || [];
                  const visibleServices = services.slice(0, 4);
                  const extraServiceCount = Math.max(
                    services.length - visibleServices.length,
                    0,
                  );
                  const guruHasMapLocation = Boolean(
                    getGuruSearchCoordinates(guru, guruZipLookupsByZip),
                  );
                  const guruRadius = Math.round(
                    guru.service_radius_display || getGuruRadius(guru),
                  );
                  const guruDistance =
                    typeof guru.distance_miles === "number"
                      ? `${guru.distance_miles.toFixed(1)} mi away`
                      : "Distance calculated by service area";
                  const isSelectedGuru = Boolean(
                    (selectedGuruId && String(guru.id) === selectedGuruId) ||
                      (selectedGuruSlug &&
                        String(guru.slug || "").toLowerCase() ===
                          selectedGuruSlug.toLowerCase()),
                  );
                  const bookingDisabled = isDisplayOnlySearchGuru(guru);
                  const isAcademyCertified = certifiedGuruUserIds.has(
                    getGuruCertificationUserId(guru),
                  );

                  return (
                    <Card
                      key={guru.id}
                      className={`overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-md md:h-[380px] ${
                        isSelectedGuru
                          ? "border-emerald-400 ring-4 ring-emerald-100"
                          : ""
                      }`}
                      onMouseEnter={() => {
                        setHighlightedGuruId(String(guru.id));
                        trackGuruHover(guru);
                      }}
                      onMouseLeave={() => setHighlightedGuruId(undefined)}
                    >
                      <div className="flex min-h-[380px] flex-col md:h-full md:min-h-0 md:flex-row md:items-stretch">
                        <GuruResultPhoto
                          photoUrl={photoUrl}
                          guruName={guruName}
                          isAcademyCertified={isAcademyCertified}
                        />

                        <div className="flex min-w-0 flex-1 flex-col p-5 md:h-full md:min-h-0 lg:p-6">
                          <div className="min-h-0 flex-1 overflow-hidden">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h2 className="line-clamp-2 text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">
                                    {guruName}
                                  </h2>

                                  {isSelectedGuru ? (
                                    <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                                      Selected
                                    </span>
                                  ) : null}

                                  {guru.is_verified ? (
                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                      Verified
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                      Trusted
                                    </span>
                                  )}

                                  {isAcademyCertified ? (
                                    <AcademyGraduateBadge
                                      academyType="guru"
                                      variant="mini"
                                    />
                                  ) : null}

                                  {guruHasMapLocation ? (
                                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                      Map ready
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                      Location pending
                                    </span>
                                  )}
                                </div>

                                <p className="mt-1 line-clamp-1 text-sm text-slate-600 sm:text-base">
                                  {guru.title || "Pet Care Guru"}
                                </p>

                                <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                                  {formatLocation(getGuruCity(guru), getGuruState(guru))}
                                  {getGuruZip(guru) ? ` · ${getGuruZip(guru)}` : ""}
                                </p>

                                <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
                                  {guruRadius}-mile service radius
                                </p>

                                {cleanZip(zipFilter) ? (
                                  <p className="mt-1 text-xs font-bold text-slate-500">
                                    {guruDistance}
                                  </p>
                                ) : null}
                              </div>

                              <div className="grid shrink-0 grid-cols-2 gap-2 sm:min-w-[160px]">
                                <div className="rounded-2xl bg-slate-50 px-3 py-2.5 text-center">
                                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Rating
                                  </div>
                                  <div className="mt-1 text-lg font-bold text-slate-900">
                                    {guruRating > 0
                                      ? guruRating.toFixed(1)
                                      : "New"}
                                  </div>
                                </div>

                                <div className="rounded-2xl bg-slate-50 px-3 py-2.5 text-center">
                                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Reviews
                                  </div>
                                  <div className="mt-1 text-lg font-bold text-slate-900">
                                    {guru.review_count || 0}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex max-h-[66px] flex-wrap gap-2 overflow-hidden text-sm text-slate-700">
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-bold text-emerald-800">
                                {guruRateDisplay.primary}
                                <span className="ml-1 font-semibold text-emerald-700">
                                  {guruRateDisplay.detail}
                                </span>
                              </span>

                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium">
                                {guru.experience_years
                                  ? `${guru.experience_years}+ years experience`
                                  : "Experience not listed"}
                              </span>

                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-bold text-emerald-800">
                                Accepts care within {guruRadius} mi
                              </span>
                            </div>

                            {services.length > 0 ? (
                              <div className="mt-4 flex max-h-[62px] flex-wrap gap-2 overflow-hidden">
                                {visibleServices.map((service) => (
                                  <span
                                    key={service}
                                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                                  >
                                    {service}
                                  </span>
                                ))}

                                {extraServiceCount > 0 ? (
                                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                                    +{extraServiceCount} more
                                  </span>
                                ) : null}
                              </div>
                            ) : null}

                            <div className="mt-4">
                              {guru.bio ? (
                                <p className="line-clamp-2 text-sm leading-6 text-slate-600 sm:text-base">
                                  {guru.bio}
                                </p>
                              ) : (
                                <p className="line-clamp-2 text-sm leading-6 text-slate-500 sm:text-base">
                                  This Guru has not added a bio yet.
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                            <Link
                              href={getGuruHref(guru)}
                              onClick={() =>
                                trackGuruProfileClick(guru, "View Guru Profile")
                              }
                              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                            >
                              View Guru Profile
                            </Link>

                            {bookingDisabled ? (
                              <button
                                type="button"
                                disabled
                                aria-disabled="true"
                                className="inline-flex cursor-not-allowed items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white opacity-55"
                              >
                                Profile Preview
                              </button>
                            ) : (
                              <Link
                                href={getBookGuruHref(guru)}
                                onClick={() => {
                                  trackBookingCtaClick(guru);
                                }}
                                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                              >
                                Book This Guru
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            <div className="xl:sticky xl:top-28 xl:self-start">
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_8px_26px_rgba(15,23,42,0.05)]">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h2 className="text-lg font-bold text-slate-900">Map view</h2>

                  <p className="mt-1 text-sm text-slate-600">
                    Enter a ZIP code or hover over a Guru card to highlight
                    nearby care.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      {mapReadyGuruCount} map pin
                      {mapReadyGuruCount === 1 ? "" : "s"}
                    </span>

                    {zipLookupStatus === "found" && zipLookup ? (
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                        Centered on {zipLookup.zip}
                      </span>
                    ) : null}

                    {mapMissingLocationCount > 0 ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                        {mapMissingLocationCount} missing location
                        {mapMissingLocationCount === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="h-[420px] sm:h-[520px] xl:h-[calc(100vh-9rem)] xl:min-h-[520px] xl:max-h-[720px]">
                  <ProviderMap
                    markers={filteredGurus as unknown as Record<string, unknown>[]}
                    center={
                      cleanZip(zipFilter) ||
                      cityFilter.trim() ||
                      stateFilter.trim()
                        ? mapCenter
                        : undefined
                    }
                    highlightedMarkerId={highlightedGuruId}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-[1500px] px-5 pb-10 sm:px-6 lg:px-8">
        <Card className="border-emerald-100 bg-gradient-to-r from-white via-emerald-50/60 to-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                SitGuru Community
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Want to help SitGuru grow locally?
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                SitGuru Ambassadors help Pet Parents, Gurus, partners, students,
                and local communities learn how to get started. Ambassador
                profiles stay on the Ambassador page so search remains focused
                on finding and booking care.
              </p>
            </div>

            <Link
              href="/ambassadors"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-emerald-700 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
            >
              Learn About Ambassadors
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}

function SearchPageFallback() {
  return (
    <main className="min-h-screen bg-[#f8fcfd] text-slate-900">
      <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_34%),linear-gradient(135deg,#ffffff_0%,#f8fcfd_48%,#ecfdf5_100%)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-slate-200/40 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-[1500px] px-5 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Find a Guru
            </p>

            <h1 className="mt-3 max-w-5xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Search trusted local pet care by ZIP code
            </h1>

            <p className="mt-4 max-w-4xl text-base leading-7 text-slate-700 sm:text-lg">
              Enter your care ZIP code to find SitGuru providers who accept
              bookings inside their service radius. City and state will
              auto-fill and the map will center around your search area.
            </p>
          </div>

          <Card className="mt-8 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.85fr_1fr_0.85fr_1.15fr_auto]">
              <div className="h-[72px] rounded-2xl bg-slate-100" />
              <div className="h-[72px] rounded-2xl bg-slate-100" />
              <div className="h-[72px] rounded-2xl bg-slate-100" />
              <div className="h-[72px] rounded-2xl bg-slate-100" />
              <div className="h-[72px] rounded-2xl bg-slate-100" />
              <div className="h-[72px] rounded-2xl bg-slate-100" />
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
          <div className="space-y-5">
            <Card className="p-7">
              <p className="text-slate-600">Loading Gurus...</p>
            </Card>
          </div>

          <div className="xl:sticky xl:top-28 xl:self-start">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_8px_26px_rgba(15,23,42,0.05)]">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-lg font-bold text-slate-900">Map view</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Loading locations...
                </p>
              </div>

              <div className="h-[420px] bg-slate-100 sm:h-[520px] xl:h-[calc(100vh-9rem)] xl:min-h-[520px] xl:max-h-[720px]" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchPageContent />
    </Suspense>
  );
}