/**
 * SitGuru Pet-Friendly Guide — places live on the Community map,
 * not a separate hub. Google can say dogs are allowed; SitGuru
 * explains how welcome they actually are.
 */

export const PLACE_LANES = [
  { id: "eat", label: "Eat & Drink", hint: "Restaurants · Cafés · Breweries · Pubs · Bars" },
  { id: "stay", label: "Stay", hint: "Hotels · Motels" },
  { id: "play", label: "Play", hint: "Dog Parks · Parks · Beaches · Campgrounds" },
  { id: "services", label: "Pet Services", hint: "Veterinarians · Hospitals · ER · Pet Stores · Boarding" },
] as const;

export type PlaceLane = (typeof PLACE_LANES)[number]["id"];

export const PLACE_CATEGORIES = [
  {
    id: "restaurant",
    lane: "eat",
    label: "Restaurants",
    googleTypes: ["restaurant"],
    query: "dog friendly restaurant",
  },
  {
    id: "cafe",
    lane: "eat",
    label: "Cafés",
    googleTypes: ["cafe", "coffee_shop", "dog_cafe"],
    query: "dog friendly cafe coffee shop",
  },
  {
    id: "brewery",
    lane: "eat",
    label: "Breweries",
    googleTypes: ["brewery", "brewpub", "beer_garden"],
    query: "dog friendly brewery",
  },
  {
    id: "bar",
    lane: "eat",
    label: "Bars & Pubs",
    googleTypes: ["bar", "bar_and_grill", "wine_bar"],
    query: "dog friendly bar pub",
  },
  {
    id: "hotel",
    lane: "stay",
    label: "Hotels",
    googleTypes: [
      "hotel",
      "lodging",
      "extended_stay_hotel",
      "resort_hotel",
      "inn",
      "bed_and_breakfast",
    ],
    query: "pet friendly hotel",
  },
  {
    id: "motel",
    lane: "stay",
    label: "Motels",
    googleTypes: ["motel"],
    query: "pet friendly motel",
  },
  {
    id: "dog_park",
    lane: "play",
    label: "Dog Parks",
    googleTypes: ["park", "state_park", "nature_preserve"],
    query: "dog park off leash bark park",
  },
  {
    id: "park",
    lane: "play",
    label: "Parks",
    googleTypes: ["park", "state_park", "nature_preserve"],
    query: "dog friendly park",
  },
  {
    id: "beach",
    lane: "play",
    label: "Beaches",
    googleTypes: ["beach"],
    query: "dog friendly beach",
  },
  {
    id: "campground",
    lane: "play",
    label: "Campgrounds",
    googleTypes: ["campground", "rv_park"],
    query: "pet friendly campground",
  },
  {
    id: "veterinarian",
    lane: "services",
    label: "Veterinarians",
    googleTypes: ["veterinary_care"],
    query: "veterinarian",
  },
  {
    id: "pet_hospital",
    lane: "services",
    label: "Pet Hospitals",
    googleTypes: ["veterinary_care"],
    query: "pet hospital animal hospital",
  },
  {
    id: "vet_er",
    lane: "services",
    label: "Emergency / ER",
    googleTypes: ["veterinary_care"],
    query: "emergency vet 24 hour animal hospital ER",
  },
  {
    id: "pet_store",
    lane: "services",
    label: "Pet Stores",
    googleTypes: ["pet_store"],
    query: "pet store",
  },
  {
    id: "pet_care",
    lane: "services",
    label: "Boarding & Pet Care",
    googleTypes: ["pet_care", "pet_boarding_service"],
    query: "pet boarding daycare grooming",
  },
] as const;

export type PlaceCategoryId = (typeof PLACE_CATEGORIES)[number]["id"];

export type AmenityStatus = "yes" | "no" | "unknown";

export type PlaceAmenity = {
  id: string;
  label: string;
  status: AmenityStatus;
};

export type StayPolicy = {
  petFee: string | null;
  petsAllowed: string | null;
  weightLimit: string | null;
  breedRestrictions: string | null;
  unattendedPets: string | null;
  grassWalkingArea: AmenityStatus;
  dogReliefStation: AmenityStatus;
  nearbyDogPark: string | null;
};

export type PlayDetails = {
  fenced: AmenityStatus;
  separateSmallDogArea: AmenityStatus;
  water: AmenityStatus;
  benches: AmenityStatus;
  shade: AmenityStatus;
  lighting: AmenityStatus;
  parking: AmenityStatus;
  wasteStations: AmenityStatus;
  agility: AmenityStatus;
  surfaceType: string | null;
  hours: string | null;
};

export type CareDetails = {
  emergency: AmenityStatus;
  open24Hours: AmenityStatus;
  openNow: AmenityStatus;
  hours: string | null;
  walkIns: AmenityStatus;
};

export type LinkedCommunityEvent = {
  id: string;
  title: string;
  slug: string;
  href: string;
  whenLabel: string;
};

export type PetFriendlyPlace = {
  id: string;
  googlePlaceId: string;
  name: string;
  lane: PlaceLane;
  category: PlaceCategoryId;
  categoryLabel: string;
  city: string;
  state: string;
  county: string;
  address: string;
  latitude: number;
  longitude: number;
  websiteUrl: string | null;
  googleMapsUrl: string | null;
  phone: string | null;
  editorialSummary: string | null;
  hoursLabel: string | null;
  allowsDogs: boolean | null;
  outdoorSeating: boolean | null;
  access: "indoor" | "outdoor" | "both" | "unknown";
  amenities: PlaceAmenity[];
  stay: StayPolicy | null;
  play: PlayDetails | null;
  care: CareDetails | null;
  petFriendlyScore: number;
  petFriendlyLabel: string;
  reasons: string[];
  policyVerified: boolean;
  lastVerifiedAt: string | null;
  isPartner: boolean;
  upcomingEvent: LinkedCommunityEvent | null;
  source: "google";
};

export const LANE_SEARCH_QUERIES: Record<PlaceLane, string> = {
  eat: "dog friendly restaurants bars cafes breweries",
  stay: "pet friendly hotels motels",
  play: "dog parks beaches campgrounds",
  services: "veterinarian pet hospital emergency vet pet store boarding",
};

export const LANE_SEARCH_PLACEHOLDERS: Record<PlaceLane, string> = {
  eat: "Dog friendly patio in Doylestown…",
  stay: "Pet friendly hotel near me…",
  play: "Dog parks, beaches, campgrounds…",
  services: "Emergency vet, pet hospital, pet store…",
};

export function parsePlaceLane(value?: string | null): PlaceLane {
  if (value === "care" || value === "shop") return "services";
  if (PLACE_LANES.some((lane) => lane.id === value)) {
    return value as PlaceLane;
  }
  return "eat";
}

export function googleTypesForDiscovery(
  lane?: PlaceLane,
  category?: PlaceCategoryId | "",
) {
  const types = new Set<string>();
  const categories = category
    ? PLACE_CATEGORIES.filter((item) => item.id === category)
    : lane
      ? categoriesForLane(lane)
      : PLACE_CATEGORIES;
  for (const item of categories) {
    for (const type of item.googleTypes) types.add(type);
  }
  return [...types];
}

/** A fenced/off-leash dog park — not a regular park that merely allows dogs. */
export function isDedicatedDogPark(
  name: string,
  description?: string | null,
  types: string[] = [],
) {
  if (types.includes("dog_park")) return true;
  const hay = `${name} ${description || ""}`.toLowerCase();
  return /dog park|bark park|off[-\s]?leash|dog run|off leash/.test(hay);
}

export function isInherentPetService(types: string[]) {
  return types.some((type) =>
    [
      "veterinary_care",
      "pet_store",
      "pet_care",
      "pet_boarding_service",
      "dog_cafe",
    ].includes(type),
  );
}

export function categoriesForLane(lane: PlaceLane) {
  return PLACE_CATEGORIES.filter((category) => category.lane === lane);
}

export function getPlaceCategory(id: string) {
  return PLACE_CATEGORIES.find((category) => category.id === id) || null;
}

export function formatPetFriendlyScore(score: number) {
  return (Math.round(score * 10) / 10).toFixed(1);
}

export function pawCount(score: number) {
  return Math.max(0, Math.min(5, Math.round(score * 2) / 2));
}

export function claimPlaceHref(place: Pick<PetFriendlyPlace, "name" | "googlePlaceId" | "city" | "state">) {
  const params = new URLSearchParams({
    intent: "pet_friendly_place",
    source: "community_places",
    placeName: place.name,
    googlePlaceId: place.googlePlaceId,
  });
  if (place.city) params.set("city", place.city);
  if (place.state) params.set("state", place.state);
  return `/partners/apply?${params.toString()}`;
}

export function nearbyGurusHref(place: Pick<PetFriendlyPlace, "city" | "state">) {
  const params = new URLSearchParams();
  if (place.city) params.set("city", place.city);
  if (place.state) params.set("state", place.state);
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

function amenity(
  id: string,
  label: string,
  value: boolean | null | undefined,
): PlaceAmenity {
  return {
    id,
    label,
    status: value === true ? "yes" : value === false ? "no" : "unknown",
  };
}

function clampScore(value: number) {
  return Math.max(1, Math.min(5, Math.round(value * 10) / 10));
}

function textHaystack(...parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

export function inferPlaceCategory(
  types: string[],
  name: string,
  preferred?: PlaceCategoryId | null,
  description?: string | null,
): PlaceCategoryId {
  const set = new Set(types);
  const lower = name.toLowerCase();

  if (
    set.has("veterinary_care") ||
    /veterinar|animal hospital|pet hospital|emergency vet|vet clinic/.test(lower)
  ) {
    if (/emergency|24\s*hour|urgent|\ber\b/.test(lower)) return "vet_er";
    if (/hospital/.test(lower)) return "pet_hospital";
    return "veterinarian";
  }
  if (set.has("pet_store")) return "pet_store";
  if (set.has("pet_care") || set.has("pet_boarding_service")) return "pet_care";
  if (isDedicatedDogPark(name, description, types)) return "dog_park";
  if (set.has("motel") || /\bmotel\b/.test(lower)) return "motel";
  if (
    set.has("hotel") ||
    set.has("extended_stay_hotel") ||
    set.has("resort_hotel") ||
    set.has("inn") ||
    set.has("bed_and_breakfast")
  ) {
    return "hotel";
  }
  if (set.has("lodging")) return "hotel";
  if (set.has("dog_cafe") || set.has("cafe") || set.has("coffee_shop")) return "cafe";
  if (
    set.has("brewery") ||
    set.has("brewpub") ||
    set.has("beer_garden") ||
    /brewery|brewing|taproom/.test(lower)
  ) {
    return "brewery";
  }
  if (
    set.has("bar") ||
    set.has("bar_and_grill") ||
    set.has("wine_bar") ||
    set.has("pub") ||
    set.has("night_club")
  ) {
    return "bar";
  }
  if (set.has("beach")) return "beach";
  if (set.has("campground") || set.has("rv_park")) return "campground";
  if (set.has("park") || set.has("state_park") || set.has("nature_preserve") || set.has("national_park")) {
    return "park";
  }
  if (set.has("restaurant") || set.has("meal_takeaway") || set.has("bakery")) {
    return "restaurant";
  }
  if (preferred && getPlaceCategory(preferred)) return preferred;
  return "restaurant";
}

export function laneForCategory(category: PlaceCategoryId): PlaceLane {
  return getPlaceCategory(category)?.lane || "eat";
}

export function buildPetFriendlyProfile(input: {
  types: string[];
  name: string;
  editorialSummary?: string | null;
  allowsDogs?: boolean | null;
  outdoorSeating?: boolean | null;
  dineIn?: boolean | null;
  servesBeer?: boolean | null;
  servesWine?: boolean | null;
  servesCoffee?: boolean | null;
  hoursLabel?: string | null;
  openNow?: boolean | null;
  open24Hours?: boolean | null;
  preferredCategory?: PlaceCategoryId | null;
  upcomingEvent?: LinkedCommunityEvent | null;
  isPartner?: boolean;
}): {
  category: PlaceCategoryId;
  lane: PlaceLane;
  access: PetFriendlyPlace["access"];
  amenities: PlaceAmenity[];
  stay: StayPolicy | null;
  play: PlayDetails | null;
  care: CareDetails | null;
  petFriendlyScore: number;
  petFriendlyLabel: string;
  reasons: string[];
} {
  const category = inferPlaceCategory(
    input.types,
    input.name,
    input.preferredCategory,
    input.editorialSummary,
  );
  const lane = laneForCategory(category);
  const hay = textHaystack(input.name, input.editorialSummary);
  const dogPark = category === "dog_park";
  const stay = lane === "stay";
  const services = lane === "services";
  const vet =
    category === "veterinarian" ||
    category === "pet_hospital" ||
    category === "vet_er";
  const emergency = category === "vet_er" || /emergency|urgent|\ber\b/.test(hay);
  const mentionsWater = /water bowl|dog bowl|water fountain/.test(hay);
  const mentionsDogMenu = /dog menu|pup cup|dog treat/.test(hay);
  const mentionsIndoor = /dogs welcome inside|indoor dogs|dogs allowed inside/.test(hay);
  const mentionsPatio = /patio|outdoor seating|beer garden/.test(hay);

  let access: PetFriendlyPlace["access"] = "unknown";
  if (services) {
    access = "indoor";
  } else if (dogPark || category === "beach" || category === "park" || category === "campground") {
    access = "outdoor";
  } else if (stay && input.allowsDogs) {
    access = "indoor";
  } else if (input.outdoorSeating && (input.dineIn || mentionsIndoor)) {
    access = "both";
  } else if (input.outdoorSeating || mentionsPatio) {
    access = "outdoor";
  } else if (mentionsIndoor || input.allowsDogs === true) {
    access = "indoor";
  }

  const amenities: PlaceAmenity[] = [
    amenity("dogs_allowed", "Dogs allowed", dogPark || services ? true : input.allowsDogs),
    amenity(
      "indoor",
      "Dogs indoors",
      access === "indoor" || access === "both" ? true : access === "outdoor" ? false : null,
    ),
    amenity(
      "outdoor",
      "Outdoor seating / access",
      access === "outdoor" || access === "both" || input.outdoorSeating === true
        ? true
        : input.outdoorSeating === false
          ? false
          : null,
    ),
    amenity("water", "Water available", mentionsWater ? true : null),
    amenity("dog_menu", "Dog menu", mentionsDogMenu ? true : null),
  ];

  const stayPolicy: StayPolicy | null = stay
    ? {
        petFee: null,
        petsAllowed: input.allowsDogs ? "Pets accepted — details unverified" : null,
        weightLimit: null,
        breedRestrictions: null,
        unattendedPets: null,
        grassWalkingArea: "unknown",
        dogReliefStation: "unknown",
        nearbyDogPark: null,
      }
    : null;

  const playDetails: PlayDetails | null =
    lane === "play"
      ? {
          fenced: "unknown",
          separateSmallDogArea: "unknown",
          water: mentionsWater ? "yes" : "unknown",
          benches: "unknown",
          shade: "unknown",
          lighting: "unknown",
          parking: "unknown",
          wasteStations: "unknown",
          agility: "unknown",
          surfaceType: null,
          hours: input.hoursLabel ?? null,
        }
      : null;

  const careDetails: CareDetails | null = vet
    ? {
        emergency: emergency ? "yes" : "unknown",
        open24Hours: input.open24Hours === true ? "yes" : "unknown",
        openNow: input.openNow === true ? "yes" : input.openNow === false ? "no" : "unknown",
        hours: input.hoursLabel ?? null,
        walkIns: "unknown",
      }
    : null;

  const reasons: string[] = [];
  let score = 2.2;

  if (category === "vet_er") {
    score = 4.6;
    reasons.push("Emergency / ER veterinary care");
  } else if (category === "pet_hospital") {
    score = 4.3;
    reasons.push("Pet hospital");
  } else if (category === "veterinarian") {
    score = 4.1;
    reasons.push("Veterinary care");
  } else if (category === "pet_store" || category === "pet_care") {
    score = 4.0;
    reasons.push("Pet service");
  } else if (dogPark) {
    score = 4.2;
    reasons.push("Dedicated dog park");
  } else if (input.allowsDogs === true) {
    score = 3.4;
    reasons.push("Google lists dogs as allowed");
  } else if (input.allowsDogs == null) {
    score = 2.4;
    reasons.push("Pet policy not confirmed yet");
  }

  if (services && !vet) {
    // Pet stores / boarding are already scored as pet services.
  } else if (vet) {
    // Veterinary places are already scored as care, not dining access.
  } else if (access === "indoor" || access === "both") {
    score += 0.5;
    reasons.push("Dogs welcome indoors");
  } else if (access === "outdoor" && lane === "eat") {
    score += 0.25;
    reasons.push("Outdoor / patio access");
  }

  if (input.outdoorSeating) {
    score += 0.2;
    if (!reasons.includes("Outdoor / patio access") && lane === "eat") {
      reasons.push("Outdoor seating");
    }
  }

  if (stay && input.allowsDogs) {
    score += 0.4;
    reasons.push("Pets can stay overnight");
  }

  if (vet && input.open24Hours) {
    score += 0.2;
    reasons.push("Open 24 hours");
  } else if (vet && input.openNow) {
    reasons.push("Open now");
  }

  if (mentionsWater) {
    score += 0.3;
    reasons.push("Water bowls mentioned");
  }
  if (mentionsDogMenu) {
    score += 0.4;
    reasons.push("Dog menu or treats");
  }
  if (input.upcomingEvent) {
    score += 0.3;
    reasons.push(`Upcoming: ${input.upcomingEvent.title}`);
  }
  if (input.isPartner) {
    score += 0.5;
    reasons.push("SitGuru Partner");
  }

  score = clampScore(score);

  let petFriendlyLabel = "Pet policy unverified";
  if (category === "vet_er") petFriendlyLabel = "Emergency pet care";
  else if (services) petFriendlyLabel = "Built for pets";
  else if (dogPark) petFriendlyLabel = "Dedicated dog park";
  else if (input.allowsDogs === true && category === "park") {
    petFriendlyLabel = "Dogs permitted in park";
  }
  else if (score >= 4.5) petFriendlyLabel = "Exceptionally pet friendly";
  else if (score >= 4) petFriendlyLabel = "Highly pet friendly";
  else if (score >= 3.4) petFriendlyLabel = "Pets welcome";
  else if (input.allowsDogs === true) petFriendlyLabel = "Pets accepted";

  return {
    category,
    lane,
    access,
    amenities,
    stay: stayPolicy,
    play: playDetails,
    care: careDetails,
    petFriendlyScore: score,
    petFriendlyLabel,
    reasons: reasons.slice(0, 6),
  };
}

export function amenityStatusLabel(status: AmenityStatus) {
  if (status === "yes") return "Yes";
  if (status === "no") return "No";
  return "Not listed yet";
}
