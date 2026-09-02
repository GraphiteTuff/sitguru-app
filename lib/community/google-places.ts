import { createHash } from "crypto";
import { COMMUNITY_MARKET_SEEDS } from "@/lib/community/market-seed";
import { geocodeAddress } from "@/lib/geocoding/geocodeAddress";
import {
  LANE_SEARCH_QUERIES,
  buildPetFriendlyProfile,
  categoriesForLane,
  getPlaceCategory,
  googleTypesForDiscovery,
  isDedicatedDogPark,
  isInherentPetService,
  type LinkedCommunityEvent,
  type PetFriendlyPlace,
  type PlaceCategoryId,
  type PlaceLane,
} from "@/lib/community/places";

type GooglePlace = {
  id?: string;
  name?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  types?: string[];
  primaryType?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  nationalPhoneNumber?: string;
  allowsDogs?: boolean;
  outdoorSeating?: boolean;
  dineIn?: boolean;
  liveMusic?: boolean;
  servesBeer?: boolean;
  servesWine?: boolean;
  servesCocktails?: boolean;
  servesCoffee?: boolean;
  editorialSummary?: { text?: string };
  regularOpeningHours?: {
    weekdayDescriptions?: string[];
    openNow?: boolean;
  };
  currentOpeningHours?: {
    weekdayDescriptions?: string[];
    openNow?: boolean;
  };
  addressComponents?: Array<{
    longText?: string;
    shortText?: string;
    types?: string[];
  }>;
  photos?: Array<{
    name?: string;
    authorAttributions?: Array<{
      displayName?: string;
      uri?: string;
    }>;
  }>;
  businessStatus?: string;
};

type MappedPlace = PetFriendlyPlace & { photoName: string | null };

type CacheEntry = {
  expiresAt: number;
  places: PetFriendlyPlace[];
};

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000;
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.types",
  "places.primaryType",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.nationalPhoneNumber",
  "places.allowsDogs",
  "places.outdoorSeating",
  "places.dineIn",
  "places.liveMusic",
  "places.servesBeer",
  "places.servesWine",
  "places.servesCocktails",
  "places.servesCoffee",
  "places.editorialSummary",
  "places.regularOpeningHours",
  "places.currentOpeningHours",
  "places.addressComponents",
  "places.businessStatus",
  "places.photos",
].join(",");

const MAX_PLACE_PHOTOS = 32;
const PHOTO_FETCH_CONCURRENCY = 6;

const CONSERVATIVE_TYPES = [
  "restaurant",
  "cafe",
  "bar",
  "hotel",
  "motel",
  "lodging",
  "park",
  "beach",
  "campground",
  "pet_store",
  "veterinary_care",
];

export type DiscoverPlacesInput = {
  category?: PlaceCategoryId | "";
  lane?: PlaceLane;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  textQuery?: string;
  openNow?: boolean;
};

export type PlacesSearchInput = {
  q?: string;
  county?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  lane?: PlaceLane;
  category?: PlaceCategoryId | "";
  highlyFriendly?: boolean;
  dogsIndoors?: boolean;
  outdoor?: boolean;
  openNow?: boolean;
  linkedEvents?: LinkedCommunityEvent[];
};

export type PlacesErrorCode =
  | "missing_key"
  | "google_denied"
  | "google_invalid"
  | "google_quota"
  | "google_unavailable";

export class PlacesDiscoveryError extends Error {
  code: PlacesErrorCode;
  status: number;
  googleHttpStatus?: number;

  constructor(
    message: string,
    code: PlacesErrorCode,
    status: number,
    googleHttpStatus?: number,
  ) {
    super(message);
    this.name = "PlacesDiscoveryError";
    this.code = code;
    this.status = status;
    this.googleHttpStatus = googleHttpStatus;
  }
}

function placesApiKey() {
  return (process.env.GOOGLE_PLACES_API_KEY || "").trim();
}

function missingPlacesKeyError() {
  return new PlacesDiscoveryError(
    "Pet-friendly place search needs GOOGLE_PLACES_API_KEY with Places API (New) enabled. Geocoding continues to use GEOCODING_API_KEY.",
    "missing_key",
    503,
  );
}

function stripSecrets(value: string) {
  return value.replace(/AIza[0-9A-Za-z_-]+/g, "[redacted]");
}

function publicPlacesApiError(httpStatus: number, body: string) {
  let googleStatus = "";
  try {
    const parsed = JSON.parse(body) as {
      error?: { status?: string; message?: string };
    };
    googleStatus = parsed.error?.status || "";
  } catch {
    googleStatus = "";
  }

  if (
    httpStatus === 401 ||
    httpStatus === 403 ||
    googleStatus === "PERMISSION_DENIED" ||
    googleStatus === "UNAUTHENTICATED"
  ) {
    return new PlacesDiscoveryError(
      "Places API (New) rejected the server key. Confirm GOOGLE_PLACES_API_KEY is valid, restricted to Places API (New), and allowed for this server.",
      "google_denied",
      502,
      httpStatus,
    );
  }

  if (httpStatus === 429 || googleStatus === "RESOURCE_EXHAUSTED") {
    return new PlacesDiscoveryError(
      "Google Places is rate-limiting SitGuru right now. Try again in a moment.",
      "google_quota",
      502,
      httpStatus,
    );
  }

  if (httpStatus === 400 || googleStatus === "INVALID_ARGUMENT") {
    return new PlacesDiscoveryError(
      "Google Places could not run this search. Try another city or category.",
      "google_invalid",
      502,
      httpStatus,
    );
  }

  return new PlacesDiscoveryError(
    "Google Places is unavailable right now. Pet-Friendly Places will try again on the next search.",
    "google_unavailable",
    502,
    httpStatus,
  );
}

function hashKey(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

function componentText(
  components: GooglePlace["addressComponents"],
  type: string,
  short = false,
) {
  const hit = components?.find((component) => component.types?.includes(type));
  if (!hit) return "";
  return (short ? hit.shortText : hit.longText) || hit.longText || hit.shortText || "";
}

function hoursLabel(place: GooglePlace): string | null {
  const openNow =
    place.currentOpeningHours?.openNow ?? place.regularOpeningHours?.openNow;
  const today =
    place.currentOpeningHours?.weekdayDescriptions?.[0] ??
    place.regularOpeningHours?.weekdayDescriptions?.[0] ??
    null;
  if (openNow === true) return today ? `Open now · ${today}` : "Open now";
  if (openNow === false) return today ? `Closed · ${today}` : "Closed now";
  return today;
}

function isOpen24Hours(place: GooglePlace) {
  const descriptions = [
    ...(place.regularOpeningHours?.weekdayDescriptions || []),
    ...(place.currentOpeningHours?.weekdayDescriptions || []),
  ];
  return descriptions.some((line) => /24\s*hours|open 24/i.test(line));
}

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchLinkedEvent(
  placeName: string,
  events: LinkedCommunityEvent[] | undefined,
) {
  if (!events?.length) return null;
  const needle = normalizeName(placeName);
  if (needle.length < 4) return null;
  return (
    events.find((event) => {
      const hay = normalizeName(event.title);
      return hay.includes(needle) || needle.includes(hay);
    }) || null
  );
}

function placeTypes(place: GooglePlace) {
  return [...(place.types || []), place.primaryType || ""].filter(Boolean);
}

/**
 * Eat / Stay / generic parks must have allowsDogs === true.
 * Pet services and dedicated dog parks do not rely on that attribute.
 */
export function passesAllowsDogsGate(place: GooglePlace) {
  const types = placeTypes(place);
  const name = place.displayName?.text || "";
  const summary = place.editorialSummary?.text || "";

  if (place.allowsDogs === false) return false;
  if (isInherentPetService(types)) return true;
  if (isDedicatedDogPark(name, summary, types)) return true;
  return place.allowsDogs === true;
}

export async function resolvePlacesCenter(input: {
  county?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}) {
  const county = input.county?.trim();
  const city = input.city?.trim();
  const state = input.state?.trim().toUpperCase();
  const hasCoords =
    Number.isFinite(input.latitude) &&
    Number.isFinite(input.longitude) &&
    input.latitude !== 0 &&
    input.longitude !== 0;

  if (hasCoords) {
    return {
      latitude: input.latitude as number,
      longitude: input.longitude as number,
      label: [city, county, state].filter(Boolean).join(", ") || "Near me",
      radiusMeters: county && !city ? 35000 : 18000,
    };
  }

  const seed = COMMUNITY_MARKET_SEEDS.find((market) => {
    if (county && market.county_name.toLowerCase().includes(county.toLowerCase().replace(/ county$/i, ""))) {
      if (!state || market.state === state) return true;
    }
    if (city && market.city.toLowerCase() === city.toLowerCase()) {
      if (!state || market.state === state) return true;
    }
    return false;
  });

  if (seed) {
    return {
      latitude: seed.latitude,
      longitude: seed.longitude,
      label: [city || seed.city, county || seed.county_name, state || seed.state]
        .filter(Boolean)
        .join(", "),
      radiusMeters: county && !city ? 35000 : 18000,
    };
  }

  const query = [city, county, state].filter(Boolean).join(", ");
  if (query.length >= 3) {
    try {
      const geo = await geocodeAddress(query);
      return {
        latitude: geo.latitude,
        longitude: geo.longitude,
        label: geo.formatted_address || query,
        radiusMeters: county && !city ? 35000 : 16000,
      };
    } catch {
      // Geocoding stays on GEOCODING_API_KEY; discovery still needs a center.
    }
  }

  return null;
}

async function placesRequest(
  url: string,
  body: Record<string, unknown>,
) {
  const apiKey = placesApiKey();
  if (!apiKey) throw missingPlacesKeyError();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const error = publicPlacesApiError(response.status, detail);
    console.warn("SitGuru Places API error", {
      httpStatus: response.status,
      code: error.code,
      detail: stripSecrets(detail).slice(0, 180),
    });
    throw error;
  }

  const payload = (await response.json()) as { places?: GooglePlace[] };
  return payload.places || [];
}

function firstPhoto(place: GooglePlace) {
  const photo = place.photos?.[0];
  const name = photo?.name?.trim() || "";
  if (!name.startsWith("places/")) {
    return { photoName: null, photoAttribution: null };
  }
  return {
    photoName: name,
    photoAttribution: photo?.authorAttributions?.[0]?.displayName?.trim() || null,
  };
}

async function fetchPlacePhotoUri(photoName: string) {
  const apiKey = placesApiKey();
  if (!apiKey) return null;

  try {
    const url = new URL(`https://places.googleapis.com/v1/${photoName}/media`);
    url.searchParams.set("maxWidthPx", "400");
    url.searchParams.set("maxHeightPx", "400");
    url.searchParams.set("skipHttpRedirect", "true");

    const response = await fetch(url, {
      method: "GET",
      headers: { "X-Goog-Api-Key": apiKey },
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as { photoUri?: string };
    const photoUri = payload.photoUri?.trim() || "";
    return photoUri.startsWith("https://") ? photoUri : null;
  } catch {
    return null;
  }
}

async function attachPlacePhotos(places: MappedPlace[]): Promise<PetFriendlyPlace[]> {
  const targets = places
    .map((place, index) => ({ place, index }))
    .filter((item) => item.place.photoName)
    .slice(0, MAX_PLACE_PHOTOS);

  for (let i = 0; i < targets.length; i += PHOTO_FETCH_CONCURRENCY) {
    const batch = targets.slice(i, i + PHOTO_FETCH_CONCURRENCY);
    await Promise.all(
      batch.map(async ({ place }) => {
        place.photoUrl = place.photoName
          ? await fetchPlacePhotoUri(place.photoName)
          : null;
      }),
    );
  }

  return places.map(({ photoName: _photoName, ...place }) => place);
}

async function searchNearbyPlaces(opts: {
  includedTypes: string[];
  latitude: number;
  longitude: number;
  radiusMeters: number;
}) {
  const body: Record<string, unknown> = {
    includedTypes: opts.includedTypes,
    maxResultCount: 20,
    languageCode: "en",
    regionCode: "US",
    rankPreference: "POPULARITY",
    locationRestriction: {
      circle: {
        center: {
          latitude: opts.latitude,
          longitude: opts.longitude,
        },
        radius: Math.min(opts.radiusMeters, 50000),
      },
    },
  };

  try {
    return await placesRequest(
      "https://places.googleapis.com/v1/places:searchNearby",
      body,
    );
  } catch (error) {
    const googleHttpStatus =
      error instanceof PlacesDiscoveryError ? error.googleHttpStatus : undefined;
    if (googleHttpStatus !== 400) throw error;
    const fallbackTypes = opts.includedTypes.filter((type) =>
      CONSERVATIVE_TYPES.includes(type),
    );
    if (!fallbackTypes.length || fallbackTypes.length === opts.includedTypes.length) {
      throw error;
    }
    return placesRequest("https://places.googleapis.com/v1/places:searchNearby", {
      ...body,
      includedTypes: fallbackTypes,
    });
  }
}

async function searchTextPlaces(opts: {
  textQuery: string;
  includedType?: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  openNow?: boolean;
}) {
  const body: Record<string, unknown> = {
    textQuery: opts.textQuery,
    languageCode: "en",
    regionCode: "US",
    maxResultCount: 20,
    locationBias: {
      circle: {
        center: {
          latitude: opts.latitude,
          longitude: opts.longitude,
        },
        radius: Math.min(opts.radiusMeters, 50000),
      },
    },
  };

  if (opts.includedType) {
    body.includedType = opts.includedType;
    body.strictTypeFiltering = false;
  }
  if (opts.openNow) body.openNow = true;

  return placesRequest("https://places.googleapis.com/v1/places:searchText", body);
}

/**
 * One Google Places discovery entry point for every SitGuru place lane.
 * Category maps to Google types internally — do not add per-vertical APIs.
 */
export async function discoverPlaces(input: DiscoverPlacesInput) {
  const includedTypes = googleTypesForDiscovery(input.lane, input.category);
  const textQuery = input.textQuery?.trim();

  if (textQuery) {
    return searchTextPlaces({
      textQuery,
      includedType: null,
      latitude: input.latitude,
      longitude: input.longitude,
      radiusMeters: input.radiusMeters,
      openNow: input.openNow,
    });
  }

  if (!includedTypes.length) return [];

  return searchNearbyPlaces({
    includedTypes,
    latitude: input.latitude,
    longitude: input.longitude,
    radiusMeters: input.radiusMeters,
  });
}

function mapGooglePlace(
  place: GooglePlace,
  input: PlacesSearchInput,
): MappedPlace | null {
  const id = place.id;
  const name = place.displayName?.text || "";
  const latitude = place.location?.latitude;
  const longitude = place.location?.longitude;
  if (!id || !name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  if (place.businessStatus === "CLOSED_PERMANENTLY") return null;
  if (!passesAllowsDogsGate(place)) return null;

  const types = placeTypes(place);
  const summary = place.editorialSummary?.text || null;
  const dedicatedDogPark = isDedicatedDogPark(name, summary, types);

  if (input.category === "dog_park" && !dedicatedDogPark) return null;
  if (input.category === "park" && dedicatedDogPark) return null;

  const upcomingEvent = matchLinkedEvent(name, input.linkedEvents);
  const { photoName, photoAttribution } = firstPhoto(place);
  const hours = hoursLabel(place);
  const openNow =
    place.currentOpeningHours?.openNow ?? place.regularOpeningHours?.openNow ?? null;
  const profile = buildPetFriendlyProfile({
    types,
    name,
    editorialSummary: summary,
    allowsDogs: place.allowsDogs ?? null,
    outdoorSeating: place.outdoorSeating ?? null,
    dineIn: place.dineIn ?? null,
    servesBeer: place.servesBeer ?? null,
    servesWine: place.servesWine ?? null,
    servesCoffee: place.servesCoffee ?? null,
    hoursLabel: hours ?? null,
    openNow,
    open24Hours: isOpen24Hours(place),
    preferredCategory: input.category || null,
    upcomingEvent,
  });

  const categoryMeta = getPlaceCategory(profile.category);
  const reasons = [...profile.reasons];
  if (place.outdoorSeating && !reasons.some((item) => /outdoor|patio/i.test(item))) {
    reasons.push("Outdoor seating");
  }
  if (place.liveMusic) reasons.push("Live music");
  if (place.servesBeer) reasons.push("Serves beer");
  if (place.servesWine) reasons.push("Serves wine");
  if (place.servesCocktails) reasons.push("Serves cocktails");

  return {
    id: `place:${id}`,
    googlePlaceId: id,
    name,
    lane: profile.lane,
    category: profile.category,
    categoryLabel: categoryMeta?.label || "Place",
    city: componentText(place.addressComponents, "locality"),
    state: componentText(place.addressComponents, "administrative_area_level_1", true),
    county: componentText(place.addressComponents, "administrative_area_level_2"),
    address: place.formattedAddress || "",
    latitude: latitude as number,
    longitude: longitude as number,
    websiteUrl: place.websiteUri ?? null,
    googleMapsUrl: place.googleMapsUri ?? null,
    phone: place.nationalPhoneNumber ?? null,
    photoUrl: null,
    photoAttribution,
    photoName,
    editorialSummary: summary,
    hoursLabel: hours ?? null,
    allowsDogs: place.allowsDogs ?? null,
    outdoorSeating: place.outdoorSeating ?? null,
    access: profile.access,
    amenities: profile.amenities,
    stay: profile.stay,
    play: profile.play,
    care: profile.care,
    petFriendlyScore: profile.petFriendlyScore,
    petFriendlyLabel: profile.petFriendlyLabel,
    reasons: reasons.slice(0, 6),
    policyVerified: false,
    lastVerifiedAt: null,
    isPartner: false,
    upcomingEvent,
    source: "google",
  };
}

async function loadMappedPlaces(
  input: PlacesSearchInput,
  center: { latitude: number; longitude: number; radiusMeters: number },
  textQuery?: string,
) {
  const mapRaw = (
    raw: GooglePlace[],
    category: PlaceCategoryId | "" | undefined,
  ) =>
    raw
      .map((place) => mapGooglePlace(place, { ...input, category }))
      .filter((place): place is MappedPlace => Boolean(place));

  if (textQuery) {
    const raw = await discoverPlaces({
      category: input.category,
      lane: input.lane,
      latitude: center.latitude,
      longitude: center.longitude,
      radiusMeters: center.radiusMeters,
      textQuery,
      openNow: input.openNow,
    });
    return mapRaw(raw, input.category);
  }

  // Nearby Search returns at most 20 mixed results. Searching the whole Eat
  // lane at once lets restaurants crowd out cafés and breweries. All fans
  // out per category, then we merge.
  const categoryIds: Array<PlaceCategoryId | ""> = input.category
    ? [input.category]
    : categoriesForLane(input.lane || "eat").map((item) => item.id);

  const batches = await Promise.all(
    categoryIds.map(async (category) => {
      const raw = await discoverPlaces({
        category,
        lane: input.lane,
        latitude: center.latitude,
        longitude: center.longitude,
        radiusMeters: center.radiusMeters,
        openNow: input.openNow,
      });
      return mapRaw(raw, category);
    }),
  );

  return batches.flat();
}

export async function searchPetFriendlyPlaces(input: PlacesSearchInput) {
  const center = await resolvePlacesCenter(input);
  const freeText = input.q?.trim();
  if (!center) {
    return {
      places: [],
      center: null,
      source: "none" as const,
      query: freeText || LANE_SEARCH_QUERIES[input.lane || "eat"],
      needsLocation: true,
    };
  }

  const textQuery = freeText
    ? `${freeText} in ${center.label}`
    : undefined;
  const cacheKey = hashKey(
    JSON.stringify({
      q: input.q || "",
      county: input.county || "",
      city: input.city || "",
      state: input.state || "",
      latitude: input.latitude || "",
      longitude: input.longitude || "",
      lane: input.lane || "eat",
      category: input.category || "",
      openNow: Boolean(input.openNow),
    }),
  );

  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      places: applyPlaceFilters(cached.places, input),
      center,
      source: "cache" as const,
      query: textQuery || LANE_SEARCH_QUERIES[input.lane || "eat"],
    };
  }

  const mapped = await loadMappedPlaces(input, center, textQuery);

  const unique = new Map<string, MappedPlace>();
  for (const place of mapped) {
    if (!unique.has(place.googlePlaceId)) unique.set(place.googlePlaceId, place);
  }

  const ranked = [...unique.values()].sort((a, b) => {
    if (a.category === "vet_er" && b.category !== "vet_er") return -1;
    if (b.category === "vet_er" && a.category !== "vet_er") return 1;
    if (a.category === "dog_park" && b.category !== "dog_park") return -1;
    if (b.category === "dog_park" && a.category !== "dog_park") return 1;
    return b.petFriendlyScore - a.petFriendlyScore;
  });

  const places = await attachPlacePhotos(ranked);

  cache.set(cacheKey, { places, expiresAt: Date.now() + CACHE_TTL_MS });

  return {
    places: applyPlaceFilters(places, input),
    center,
    source: "google" as const,
    query: textQuery || LANE_SEARCH_QUERIES[input.lane || "eat"],
  };
}

function applyPlaceFilters(places: PetFriendlyPlace[], input: PlacesSearchInput) {
  return places.filter((place) => {
    if (input.lane && place.lane !== input.lane) {
      if (!input.q) return false;
    }
    if (input.category && place.category !== input.category) {
      if (!input.q) return false;
    }
    if (input.highlyFriendly && place.petFriendlyScore < 4) return false;
    if (input.dogsIndoors && place.access !== "indoor" && place.access !== "both") {
      return false;
    }
    if (input.outdoor && place.access !== "outdoor" && place.access !== "both") {
      if (!place.outdoorSeating) return false;
    }
    return true;
  });
}

export function placesSearchConfigured() {
  return Boolean(placesApiKey());
}
