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
import { trackEvent } from "@/lib/analytics/track";
import { supabase } from "@/lib/supabase";

type GuruRow = {
  [key: string]: unknown;
  id: number;
  user_id?: string | null;
  slug?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  title?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
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

type ZipLookupResult = {
  zip: string;
  city: string;
  state: string;
  stateName?: string;
  latitude: number | null;
  longitude: number | null;
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

const CITY_COORDINATES: Record<string, [number, number]> = {
  "philadelphia,pa": [39.9526, -75.1652],
  "philadelphia,pennsylvania": [39.9526, -75.1652],
  "pittsburgh,pa": [40.4406, -79.9959],
  "pittsburgh,pennsylvania": [40.4406, -79.9959],
  "quakertown,pa": [40.4418, -75.3416],
  "quakertown,pennsylvania": [40.4418, -75.3416],
  "cromwell,mn": [46.6766, -92.8802],
  "cromwell,minnesota": [46.6766, -92.8802],
};

const GURU_SELECT_ATTEMPTS = ["*"];

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

function formatRate(rate?: number | null) {
  if (typeof rate !== "number") return "Rate not listed";
  return `$${rate}/hr`;
}

function getGuruName(guru: GuruRow) {
  return guru.display_name || guru.full_name || "Guru";
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

function getGuruHref(guru: GuruRow) {
  if (guru.slug) return `/guru/${guru.slug}`;
  return `/guru/${guru.id}`;
}

function getBookGuruHref(guru: GuruRow) {
  if (guru.slug) return `/book/${guru.slug}`;
  return getGuruHref(guru);
}

function getGuruRating(guru: GuruRow) {
  if (typeof guru.rating_avg === "number") return guru.rating_avg;
  if (typeof guru.rating === "number") return guru.rating;
  return 0;
}

function getGuruRate(guru: GuruRow) {
  if (typeof guru.hourly_rate === "number") return guru.hourly_rate;
  if (typeof guru.rate === "number") return guru.rate;
  return null;
}

function getGuruAnalyticsId(guru: GuruRow) {
  return String(guru.user_id || guru.id || "");
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
    FLORIDA: "FL",
    CALIFORNIA: "CA",
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

function normalizeText(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

function locationsMatchByText(guru: GuruRow, location: ZipLookupResult | null) {
  if (!location) return false;

  const guruZip = cleanZip(guru.zip_code);

  if (guruZip && guruZip === location.zip) return true;

  const guruCity = normalizeText(guru.city);
  const guruState = normalizeStateCode(guru.state);
  const locationCity = normalizeText(location.city);
  const locationState = normalizeStateCode(
    location.state || location.stateName,
  );

  return Boolean(
    guruCity &&
      locationCity &&
      guruCity === locationCity &&
      (!guruState || !locationState || guruState === locationState),
  );
}

function getGuruSearchCoordinates(guru: GuruRow): [number, number] | null {
  const latitude = getGuruLatitude(guru);
  const longitude = getGuruLongitude(guru);

  if (latitude !== null && longitude !== null) {
    return [latitude, longitude];
  }

  return getGuruFallbackCoordinates(guru);
}

function getDistanceFromSearchLocation(
  guru: GuruRow,
  searchLocation: ZipLookupResult | null,
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

  const coordinates = getGuruSearchCoordinates(guru);

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
) {
  const zip = cleanZip(zipFilter);

  if (!zip) return true;

  if (guru.service_area_enabled === false) return false;

  const textLocationMatches = locationsMatchByText(guru, searchLocation);

  if (textLocationMatches) return true;

  const distanceMiles = getDistanceFromSearchLocation(guru, searchLocation);

  if (distanceMiles === null) {
    return cleanZip(guru.zip_code) === zip;
  }

  return distanceMiles <= getGuruRadius(guru);
}

function enrichGuruWithDistance(
  guru: GuruRow,
  searchLocation: ZipLookupResult | null,
): GuruRow {
  const textLocationMatches = locationsMatchByText(guru, searchLocation);
  const distanceMiles = textLocationMatches
    ? 0
    : getDistanceFromSearchLocation(guru, searchLocation);

  const normalizedServiceRadiusMiles = getGuruRadius(guru);

  return {
    ...guru,
    service_radius_miles: normalizedServiceRadiusMiles,
    service_radius_display: normalizedServiceRadiusMiles,
    distance_miles: distanceMiles,
  };
}

function GuruResultPhoto({
  photoUrl,
  guruName,
}: {
  photoUrl: string;
  guruName: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showPhoto = Boolean(photoUrl) && !imageFailed;

  return (
    <div className="h-56 w-full shrink-0 overflow-hidden bg-slate-100 md:h-full md:w-[220px] lg:w-[240px]">
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
  return CITY_COORDINATES[normalizeLocationKey(guru.city, guru.state)] || null;
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
    return [
      getGuruLatitude(firstExactGuru)!,
      getGuruLongitude(firstExactGuru)!,
    ];
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

function getSearchAreaLabel({
  zipLookup,
  zipFilter,
  cityFilter,
  stateFilter,
}: {
  zipLookup: ZipLookupResult | null;
  zipFilter: string;
  cityFilter: string;
  stateFilter: string;
}) {
  if (zipLookup?.zip) return zipLookup.zip;
  if (cleanZip(zipFilter)) return cleanZip(zipFilter);

  const city = cityFilter.trim();
  const state = stateFilter.trim();

  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;

  return "your area";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [serviceFilter, setServiceFilter] = useState(initialService);
  const [zipFilter, setZipFilter] = useState(initialZip);
  const [cityFilter, setCityFilter] = useState(initialCity);
  const [stateFilter, setStateFilter] = useState(initialState);
  const [searchTerm, setSearchTerm] = useState("");

  const [zipLookup, setZipLookup] = useState<ZipLookupResult | null>(null);
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

      for (const selectColumns of GURU_SELECT_ATTEMPTS) {
        const { data, error: gurusError } = await supabase
          .from("gurus")
          .select(selectColumns)
          .or("is_public.eq.true,is_active.eq.true")
          .order("is_verified", { ascending: false })
          .order("rating_avg", { ascending: false, nullsFirst: false });

        if (!gurusError) {
          guruRows = ((data || []) as unknown) as GuruRow[];
          gurusErrorMessage = "";
          break;
        }

        gurusErrorMessage = gurusError.message || gurusErrorMessage;
      }

      if (gurusErrorMessage) {
        setError(gurusErrorMessage);
        setLoading(false);

        trackEvent({
          eventName: "search_gurus_load_failed",
          eventType: "system",
          source: detectSourceFromUrl(),
          metadata: {
            error: gurusErrorMessage,
          },
        });

        return;
      }

      setGurus(guruRows);
      setLoading(false);

      trackEvent({
        eventName: "search_gurus_loaded",
        eventType: "system",
        source: detectSourceFromUrl(),
        metadata: {
          guru_count: guruRows.length,
          guru_count_with_map_location: guruRows.filter(hasMapLocation).length,
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
      .filter((guru) => guru.is_active !== false)
      .filter((guru) => guru.is_public !== false)
      .filter((guru) => guru.is_accepting_bookings !== false)
      .filter((guru) => guru.accepting_bookings !== false)
      .filter((guru) => {
        const guruName = normalizeText(getGuruName(guru));
        const guruCity = normalizeText(guru.city);
        const guruState = normalizeText(guru.state);
        const guruZip = cleanZip(guru.zip_code);
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
      .map((guru) => enrichGuruWithDistance(guru, zipLookup))
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
    selectedGuruId,
    selectedGuruSlug,
  ]);

  const mapReadyGuruCount = useMemo(
    () => filteredGurus.filter(hasMapLocation).length,
    [filteredGurus],
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

  const searchAreaLabel = getSearchAreaLabel({
    zipLookup,
    zipFilter,
    cityFilter,
    stateFilter,
  });

  const hasSearchArea = Boolean(
    cleanZip(zipFilter) || cityFilter.trim() || stateFilter.trim(),
  );

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
        guru_city: guru.city || "",
        guru_state: guru.state || "",
        guru_zip: guru.zip_code || "",
        guru_has_map_location: hasMapLocation(guru),
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
        guru_city: guru.city || "",
        guru_state: guru.state || "",
        guru_zip: guru.zip_code || "",
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
    <main className="min-h-screen bg-[#f7fbfc] text-slate-900">
      <section className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7fbfc_100%)]">
        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
          <Card className="overflow-hidden border-slate-200 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.1fr_0.9fr_0.85fr_0.85fr_1.15fr_auto]">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    ZIP code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    value={zipFilter}
                    onChange={(event) => handleZipChange(event.target.value)}
                    placeholder="ZIP code or address"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    Service type
                  </label>
                  <select
                    value={serviceFilter}
                    onChange={(event) => setServiceFilter(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="">Any Service</option>
                    {SERVICE_OPTIONS.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    City
                  </label>
                  <input
                    type="text"
                    value={cityFilter}
                    onChange={(event) => setCityFilter(event.target.value)}
                    placeholder="City"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    State
                  </label>
                  <input
                    type="text"
                    value={stateFilter}
                    onChange={(event) => setStateFilter(event.target.value)}
                    placeholder="State"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    Search profiles
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Name, bio, title, services"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => clearFilters("top_filter_bar")}
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 xl:w-auto"
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                {filteredGurus.length} Guru
                {filteredGurus.length === 1 ? "" : "s"} found
              </span>

              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                {mapReadyGuruCount} map pin{mapReadyGuruCount === 1 ? "" : "s"} ready
              </span>

              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
              </span>

              {cleanZip(zipFilter) ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  Radius-matched care area
                </span>
              ) : null}

              {zipLookupStatus === "loading" ? (
                <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                  Looking up ZIP...
                </span>
              ) : null}

              {zipLookupStatus === "found" && zipLookup ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  ZIP found: {zipLookup.city}, {zipLookup.state}
                </span>
              ) : null}

              {zipLookupStatus === "not_found" ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                  ZIP not found
                </span>
              ) : null}
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
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
          <>
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  {filteredGurus.length} Guru{filteredGurus.length === 1 ? "" : "s"}{" "}
                  found{hasSearchArea ? ` near ${searchAreaLabel}` : ""}
                </h1>

                <p className="mt-1 text-sm font-medium text-slate-600">
                  {cleanZip(zipFilter)
                    ? `Showing Gurus whose saved service radius covers ${searchAreaLabel}.`
                    : "Browse trusted SitGuru pet care providers and hover any card to zoom the map to that Guru."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                  {mapReadyGuruCount} map pin{mapReadyGuruCount === 1 ? "" : "s"}
                </span>

                {mapMissingLocationCount > 0 ? (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">
                    {mapMissingLocationCount} missing location
                    {mapMissingLocationCount === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="space-y-4">
                {filteredGurus.length === 0 ? (
                  <Card className="p-7">
                    <h2 className="text-xl font-bold text-slate-900">
                      No Gurus found
                    </h2>

                    <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
                      Try changing the ZIP code, service, or profile search. ZIP
                      searches only show Gurus whose service radius covers that
                      care area.
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
                    const guruRate = getGuruRate(guru);
                    const guruRating = getGuruRating(guru);
                    const services = guru.services || [];
                    const visibleServices = services.slice(0, 4);
                    const extraServiceCount = Math.max(
                      services.length - visibleServices.length,
                      0,
                    );
                    const guruHasMapLocation = hasMapLocation(guru);
                    const guruRadius = Math.round(
                      guru.service_radius_display || getGuruRadius(guru),
                    );
                    const guruDistance =
                      typeof guru.distance_miles === "number"
                        ? `${guru.distance_miles.toFixed(1)} mi away`
                        : "Distance based on service area";
                    const isSelectedGuru = Boolean(
                      (selectedGuruId && String(guru.id) === selectedGuruId) ||
                        (selectedGuruSlug &&
                          String(guru.slug || "").toLowerCase() ===
                            selectedGuruSlug.toLowerCase()),
                    );

                    return (
                      <Card
                        key={guru.id}
                        className={`overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
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
                        <div className="flex flex-col md:min-h-[238px] md:flex-row">
                          <GuruResultPhoto
                            photoUrl={photoUrl}
                            guruName={guruName}
                          />

                          <div className="flex min-w-0 flex-1 flex-col p-4 md:p-5">
                            <div className="flex min-w-0 flex-1 flex-col">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="truncate text-2xl font-black leading-tight tracking-tight text-slate-950 md:text-[2rem]">
                                      {guruName}
                                    </h2>

                                    {isSelectedGuru ? (
                                      <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white">
                                        Selected
                                      </span>
                                    ) : null}

                                    {guru.is_verified ? (
                                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                        Trusted
                                      </span>
                                    ) : (
                                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                                        Trusted
                                      </span>
                                    )}

                                    {guruHasMapLocation ? (
                                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">
                                        Map ready
                                      </span>
                                    ) : (
                                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                                        Location pending
                                      </span>
                                    )}
                                  </div>

                                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                                    <span className="font-bold text-amber-500">
                                      ★{" "}
                                      <span className="text-slate-900">
                                        {guruRating > 0
                                          ? guruRating.toFixed(1)
                                          : "New"}
                                      </span>
                                    </span>

                                    <span className="font-medium text-slate-500">
                                      ({guru.review_count || 0} review
                                      {(guru.review_count || 0) === 1 ? "" : "s"})
                                    </span>
                                  </div>

                                  <p className="mt-1 text-sm font-medium text-slate-600">
                                    {formatLocation(guru.city, guru.state)}
                                    {cleanZip(guru.zip_code) ? (
                                      <>
                                        {" "}
                                        · {cleanZip(guru.zip_code)}
                                      </>
                                    ) : null}
                                    {cleanZip(zipFilter) ? (
                                      <>
                                        {" "}
                                        · {guruDistance}
                                      </>
                                    ) : null}
                                  </p>

                                  <p className="mt-1 text-sm font-medium text-slate-600">
                                    {guru.title || "Pet Care Guru"}
                                  </p>

                                  <div className="mt-3">
                                    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                                      {guruRadius}-mile service radius
                                    </span>
                                  </div>
                                </div>

                                <div className="shrink-0">
                                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
                                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                      Rate
                                    </div>
                                    <div className="mt-1 text-base font-black text-slate-950">
                                      {formatRate(guruRate)}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700">
                                  {guru.experience_years
                                    ? `${guru.experience_years}+ years experience`
                                    : "Experience not listed"}
                                </span>

                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-bold text-emerald-800">
                                  Accepts care within {guruRadius} mi
                                </span>
                              </div>

                              {services.length > 0 ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {visibleServices.map((service) => (
                                    <span
                                      key={service}
                                      className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700"
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

                              <div className="mt-3">
                                {guru.bio ? (
                                  <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                                    {guru.bio}
                                  </p>
                                ) : (
                                  <p className="line-clamp-2 text-sm leading-6 text-slate-500">
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
                                className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                              >
                                View Guru Profile
                              </Link>

                              <Link
                                href={getBookGuruHref(guru)}
                                onClick={() => {
                                  trackBookingCtaClick(guru);
                                }}
                                className="inline-flex flex-1 items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                              >
                                Book This Guru
                              </Link>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>

              <div className="xl:sticky xl:top-28 xl:self-start">
                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-950">
                          Gurus near {searchAreaLabel}
                        </h2>

                        <p className="mt-1 text-sm text-slate-600">
                          Hover over a Guru card to highlight and zoom toward
                          that service area.
                        </p>
                      </div>

                      {hasSearchArea ? (
                        <button
                          type="button"
                          onClick={() => setHighlightedGuruId(undefined)}
                          className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Reset hover view
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        {mapReadyGuruCount} map pin
                        {mapReadyGuruCount === 1 ? "" : "s"}
                      </span>

                      {hasSearchArea ? (
                        <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                          Search area ready
                        </span>
                      ) : (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                          U.S. overview
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="min-h-[420px] bg-slate-50 sm:min-h-[520px] xl:min-h-[760px]">
                    <ProviderMap
                      markers={
                        filteredGurus as unknown as Record<string, unknown>[]
                      }
                      center={hasSearchArea ? mapCenter : undefined}
                      highlightedMarkerId={highlightedGuruId}
                    />
                  </div>

                  <div className="border-t border-slate-200 px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="max-w-2xl text-sm leading-6 text-slate-600">
                        Map pins mirror the Guru cards shown on the page and
                        honor each Guru&apos;s saved service ZIP/city and service
                        radius before they appear on the map.
                      </p>

                      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                        Locations ready
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function SearchPageFallback() {
  return (
    <main className="min-h-screen bg-[#f7fbfc] text-slate-900">
      <section className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7fbfc_100%)]">
        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
          <Card className="overflow-hidden border-slate-200 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <div className="grid grid-cols-1 gap-3 px-4 py-4 xl:grid-cols-[1.1fr_0.9fr_0.85fr_0.85fr_1.15fr_auto] sm:px-5">
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

      <section className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5">
          <div className="h-8 w-72 rounded-xl bg-slate-100" />
          <div className="mt-2 h-5 w-[34rem] max-w-full rounded-xl bg-slate-100" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="flex flex-col md:min-h-[238px] md:flex-row">
                <div className="h-56 bg-slate-100 md:h-auto md:w-[220px] lg:w-[240px]" />
                <div className="flex-1 p-5">
                  <div className="h-7 w-56 rounded-xl bg-slate-100" />
                  <div className="mt-3 h-5 w-40 rounded-xl bg-slate-100" />
                  <div className="mt-3 h-5 w-52 rounded-xl bg-slate-100" />
                  <div className="mt-3 h-5 w-full rounded-xl bg-slate-100" />
                  <div className="mt-5 flex gap-3">
                    <div className="h-11 flex-1 rounded-full bg-slate-100" />
                    <div className="h-11 flex-1 rounded-full bg-slate-100" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="flex flex-col md:min-h-[238px] md:flex-row">
                <div className="h-56 bg-slate-100 md:h-auto md:w-[220px] lg:w-[240px]" />
                <div className="flex-1 p-5">
                  <div className="h-7 w-48 rounded-xl bg-slate-100" />
                  <div className="mt-3 h-5 w-36 rounded-xl bg-slate-100" />
                  <div className="mt-3 h-5 w-56 rounded-xl bg-slate-100" />
                  <div className="mt-3 h-5 w-full rounded-xl bg-slate-100" />
                  <div className="mt-5 flex gap-3">
                    <div className="h-11 flex-1 rounded-full bg-slate-100" />
                    <div className="h-11 flex-1 rounded-full bg-slate-100" />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="xl:sticky xl:top-28 xl:self-start">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="h-8 w-56 rounded-xl bg-slate-100" />
                <div className="mt-2 h-5 w-80 max-w-full rounded-xl bg-slate-100" />
              </div>

              <div className="min-h-[420px] bg-slate-100 sm:min-h-[520px] xl:min-h-[760px]" />

              <div className="border-t border-slate-200 px-5 py-4">
                <div className="h-5 w-full rounded-xl bg-slate-100" />
              </div>
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