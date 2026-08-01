// app/customer/dashboard/page.tsx
"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  GraduationCap,
  HeartHandshake,
  LockKeyhole,
  MessageCircle,
  Receipt,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import { PawIcon } from "@/components/ui/PawIcon";
import MultiPetProfileCenter from "@/components/customer/MultiPetProfileCenter";
import { normalizeCanonicalPet } from "@/lib/pets/canonical";

type CustomerProfile = {
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  service_address: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  emergency_contact: string | null;
  care_preferences: string | null;
  avatar_url: string | null;
};

type CustomerProfileForm = {
  full_name: string;
  phone: string;
  service_address: string;
  emergency_contact: string;
  care_preferences: string;
};

type RawProfileRow = {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  name?: string | null;
  phone?: string | null;
  phone_number?: string | null;
  service_address?: string | null;
  street_address?: string | null;
  address?: string | null;
  home_address?: string | null;
  service_city?: string | null;
  city?: string | null;
  home_city?: string | null;
  service_state?: string | null;
  state?: string | null;
  home_state?: string | null;
  service_zip?: string | null;
  zip?: string | null;
  zip_code?: string | null;
  zipcode?: string | null;
  postal_code?: string | null;
  emergency_contact?: string | null;
  emergency_contact_name?: string | null;
  care_preferences?: string | null;
  preferences?: string | null;
  notes?: string | null;
  avatar_url?: string | null;
  profile_photo_url?: string | null;
  photo_url?: string | null;
  image_url?: string | null;
};

type SupabaseUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

type Pet = {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  age: string | null;
  size: string | null;
  weight: string | null;
  temperament: string | null;
  medical_notes: string | null;
  /** @deprecated Prefer medical_notes — kept for legacy UI badges. */
  medications: string | null;
  notes: string | null;
  photo_url: string | null;
  video_url: string | null;
};

type ReferralProfile = {
  id: string;
  user_id: string;
  role: string;
  referral_code: string;
  referral_link: string | null;
  total_invites: number;
  completed_referrals: number;
  pending_rewards: number;
  earned_rewards: number;
  paid_rewards: number;
  available_credit: number;
};

type UniversityProgress = {
  totalSteps: number;
  completedSteps: number;
  totalMaterials: number;
  acknowledgedMaterials: number;
  requiredMaterials: number;
  progressPercent: number;
  isStarted: boolean;
  isComplete: boolean;
  certificationLabel: string;
  badgeStatus: string;
  progressHelper: string;
  universityTileHelper: string;
  academyButtonLabel: string;
};

type Booking = {
  id: string;
  status: string;
  payment_status: string;
  payout_status: string | null;
  start_time: string;
  booking_date: string | null;
  requested_date: string | null;
  service_type: string | null;
  service_key: string | null;
  pet_name: string | null;
  guru_name: string | null;
  guru_id: string | null;
  guru_avatar_url: string | null;
  pet_id: string | null;
  notes: string | null;
  time_window: string | null;
  visit_length: string | null;
  care_city: string | null;
  care_state: string | null;
  care_zip_code: string | null;
  subtotal_amount: number;
  marketplace_fee_percent: number;
  marketplace_fee_amount: number;
  tip_amount: number;
  guru_payout_amount: number;
  total_customer_paid: number;
  stripe_session_id: string | null;
  created_at: string | null;
};

type PawReportSummary = {
  booking_id: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  final_note: string | null;
  update_count: number;
  photo_count: number;
  potty_count: number;
  food_water_count: number;
  note_count: number;
  latest_update_type: string | null;
  latest_update_note: string | null;
  latest_update_at: string | null;
  active_walk_status: string | null;
  active_walk_started_at: string | null;
  active_walk_ended_at: string | null;
  active_walk_distance_meters: number;
  active_walk_duration_seconds: number;
};

type RawBookingRow = {
  id?: string | number | null;
  customer_id?: string | number | null;
  pet_owner_id?: string | number | null;
  user_id?: string | number | null;
  customer_email?: string | null;
  email?: string | null;
  status?: string | null;
  payment_status?: string | null;
  payout_status?: string | null;
  start_time?: string | null;
  booking_date?: string | null;
  requested_date?: string | null;
  date?: string | null;
  service_type?: string | null;
  service_key?: string | null;
  pet_name?: string | null;
  guru_name?: string | null;
  sitter_name?: string | null;
  provider_name?: string | null;
  guru_id?: string | number | null;
  guru_avatar_url?: string | null;
  guru_photo_url?: string | null;
  sitter_avatar_url?: string | null;
  sitter_photo_url?: string | null;
  provider_avatar_url?: string | null;
  provider_photo_url?: string | null;
  pet_id?: string | number | null;
  notes?: string | null;
  time_window?: string | null;
  visit_length?: string | null;
  care_city?: string | null;
  care_state?: string | null;
  care_zip_code?: string | null;
  subtotal_amount?: number | string | null;
  service_price?: number | string | null;
  total_amount?: number | string | null;
  marketplace_fee_percent?: number | string | null;
  marketplace_fee_amount?: number | string | null;
  sitguru_fee_amount?: number | string | null;
  tip_amount?: number | string | null;
  guru_tip_amount?: number | string | null;
  guru_payout_amount?: number | string | null;
  guru_estimated_total_payout?: number | string | null;
  total_customer_paid?: number | string | null;
  customer_total_amount?: number | string | null;
  amount_total?: number | string | null;
  stripe_session_id?: string | null;
  stripe_checkout_session_id?: string | null;
  created_at?: string | null;
};

type RawPetRow = {
  id?: string | number | null;
  name?: string | null;
  species?: string | null;
  pet_type?: string | null;
  breed?: string | null;
  age?: string | null;
  size?: string | null;
  size_category?: string | null;
  weight?: string | null;
  temperament?: string | null;
  medical_notes?: string | null;
  medications?: string | null;
  notes?: string | null;
  photo_url?: string | null;
  video_url?: string | null;
  user_id?: string | null;
  owner_id?: string | null;
  feeding_routine?: string | null;
  potty_routine?: string | null;
};

type RawReferralProfileRow = {
  id?: string | null;
  user_id?: string | null;
  role?: string | null;
  referral_code?: string | null;
  referral_link?: string | null;
  total_invites?: number | null;
  completed_referrals?: number | null;
  pending_rewards?: number | null;
  earned_rewards?: number | null;
  paid_rewards?: number | null;
  available_credit?: number | null;
};

type RawGuruRow = {
  id?: string | number | null;
  user_id?: string | null;
  slug?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  name?: string | null;
  title?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  service_latitude?: number | string | null;
  service_longitude?: number | string | null;
  service_radius_miles?: number | string | null;
  service_area_enabled?: boolean | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  hourly_rate?: number | string | null;
  rate?: number | string | null;
  experience_years?: number | string | null;
  is_verified?: boolean | null;
  is_active?: boolean | null;
  is_public?: boolean | null;
  is_accepting_bookings?: boolean | null;
  accepting_bookings?: boolean | null;
  services?: string[] | null;
  rating_avg?: number | string | null;
  rating?: number | string | null;
  review_count?: number | string | null;
  profile_photo_url?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
};

type NearbyGuru = {
  id: string;
  slug: string | null;
  name: string;
  role: string;
  location: string;
  image_url: string | null;
  rating: number | null;
  review_count: number;
  rate: number | null;
  services: string[];
  distance_miles: number;
  service_radius_miles: number;
  is_verified: boolean;
  href: string;
};

type ZipLookupLocation = {
  zip: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
};

type PetMediaKind = "photo" | "video";

type UploadingPetMedia = {
  petId: string;
  kind: PetMediaKind;
};

type ConfettiPiece = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  rotate: number;
  color: string;
};

const initialPetForm = {
  name: "",
  species: "",
  breed: "",
  age: "",
  weight: "",
  temperament: "",
  medications: "",
  notes: "",
  photo_url: "",
  video_url: "",
};

const initialProfileForm: CustomerProfileForm = {
  full_name: "",
  phone: "",
  service_address: "",
  emergency_contact: "",
  care_preferences: "",
};

const routes = {
  home: "/",
  dashboard: "/customer/dashboard",
  university: "/customer/dashboard/university",
  findGuru: "/search",
  bookGuru: "/bookings/new",
  bookings: "/customer/dashboard/bookings",
  allBookings: "/customer/dashboard/bookings",
  messages: "/customer/dashboard/messages",
  adminMessages: "/customer/dashboard/messages?support=admin",
  pets: "/customer/dashboard#multi-pet-center",
  profile: "/customer/dashboard/profile",
  accountSecurity: "/customer/dashboard/account-security",
  pawPerks: "/customer/dashboard/pawperks",
  search: "/search",
  login: "/login",
};

const CUSTOMER_PROFILE_PHOTO_SRC = "/images/customer-profile-photo.jpg";
const PAWPERKS_PREVIEW_DOG_SRC =
  "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=80";
const PAWPERKS_PREVIEW_CAT_SRC =
  "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=900&q=80";

const PROFILE_PHOTO_BUCKETS = ["profile-photos", "avatars"];
const PET_PHOTO_BUCKETS = ["pet-photos", "pets"];
const PET_VIDEO_BUCKETS = ["pet-videos", "pets"];
const MAX_PROFILE_PHOTO_SIZE = 5 * 1024 * 1024;
const MAX_PET_PHOTO_SIZE = 8 * 1024 * 1024;
const MAX_PET_VIDEO_SIZE = 75 * 1024 * 1024;

const confettiColors = [
  "#10b981",
  "#34d399",
  "#38bdf8",
  "#facc15",
  "#fb7185",
  "#a78bfa",
];

const GURU_SELECT_ATTEMPTS = [
  "id,user_id,slug,display_name,full_name,name,title,bio,city,state,zip_code,service_latitude,service_longitude,service_radius_miles,service_area_enabled,latitude,longitude,lat,lng,hourly_rate,rate,experience_years,is_verified,is_active,is_public,is_accepting_bookings,accepting_bookings,services,rating_avg,rating,review_count,profile_photo_url,photo_url,avatar_url,image_url",
  "id,user_id,slug,display_name,full_name,name,title,bio,city,state,zip_code,service_latitude,service_longitude,service_radius_miles,service_area_enabled,hourly_rate,rate,experience_years,is_verified,is_active,is_public,is_accepting_bookings,accepting_bookings,services,rating_avg,rating,review_count,profile_photo_url,photo_url,avatar_url,image_url",
  "id,user_id,slug,display_name,full_name,name,title,bio,city,state,zip_code,latitude,longitude,hourly_rate,rate,experience_years,is_verified,is_active,is_public,is_accepting_bookings,accepting_bookings,services,rating_avg,rating,review_count,profile_photo_url,photo_url,avatar_url,image_url",
  "id,user_id,slug,display_name,full_name,name,title,bio,city,state,zip_code,hourly_rate,rate,experience_years,is_verified,is_active,is_public,services,rating_avg,rating,review_count,profile_photo_url,photo_url,avatar_url,image_url",
];

const ZIP_FALLBACK_LOCATIONS: Record<string, ZipLookupLocation> = {
  "08030": {
    zip: "08030",
    city: "Camden",
    state: "NJ",
    latitude: 39.8912,
    longitude: -75.1163,
  },
  "18018": {
    zip: "18018",
    city: "Bethlehem",
    state: "PA",
    latitude: 40.6259,
    longitude: -75.3705,
  },
  "18101": {
    zip: "18101",
    city: "Allentown",
    state: "PA",
    latitude: 40.6023,
    longitude: -75.4714,
  },
  "18951": {
    zip: "18951",
    city: "Quakertown",
    state: "PA",
    latitude: 40.4418,
    longitude: -75.3416,
  },
  "19103": {
    zip: "19103",
    city: "Philadelphia",
    state: "PA",
    latitude: 39.9526,
    longitude: -75.1746,
  },
};

const defaultUniversityProgress: UniversityProgress = {
  totalSteps: 9,
  completedSteps: 0,
  totalMaterials: 0,
  acknowledgedMaterials: 0,
  requiredMaterials: 0,
  progressPercent: 0,
  isStarted: false,
  isComplete: false,
  certificationLabel: "Certified Pet Parent: Not started",
  badgeStatus: "Locked",
  progressHelper: "Start the academy to begin tracking",
  universityTileHelper: "Start academy",
  academyButtonLabel: "Start Pet Parent Academy",
};

function createConfettiPieces() {
  return Array.from({ length: 90 }, (_, index) => ({
    id: index,
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 2.8 + Math.random() * 2.2,
    size: 7 + Math.random() * 9,
    rotate: Math.random() * 360,
    color: confettiColors[index % confettiColors.length],
  }));
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function cleanZipCode(value?: string | null) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 5);
}

function extractZipCode(value?: string | null) {
  const match = String(value || "").match(/\b\d{5}(?:-\d{4})?\b/);
  return cleanZipCode(match?.[0] || "");
}

function normalizeStateCode(value?: string | null) {
  const state = readString(value);
  if (!state) return "";

  const normalized = state.toUpperCase();

  const stateMap: Record<string, string> = {
    PENNSYLVANIA: "PA",
    "NEW JERSEY": "NJ",
    DELAWARE: "DE",
    MARYLAND: "MD",
    "NEW YORK": "NY",
  };

  return stateMap[normalized] || normalized.slice(0, 2);
}

function buildAddressFromParts({
  street,
  city,
  state,
  zipCode,
}: {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
}) {
  const streetValue = readString(street);
  const cityValue = readString(city);
  const stateValue = readString(state);
  const zipValue = cleanZipCode(zipCode);
  const cityStateZip = [
    cityValue,
    [stateValue, zipValue].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  return [streetValue, cityStateZip].filter(Boolean).join(", ") || null;
}

function getCustomerCareZip(profile: CustomerProfile | null) {
  return (
    cleanZipCode(profile?.zip_code) ||
    extractZipCode(profile?.service_address) ||
    ""
  );
}

function getCustomerLocationLabel(profile: CustomerProfile | null) {
  const city = readString(profile?.city);
  const state = normalizeStateCode(profile?.state);
  const zipCode = getCustomerCareZip(profile);

  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state && zipCode) return `${state} ${zipCode}`;
  if (zipCode) return `ZIP ${zipCode}`;
  return "";
}

function locationsMatchByText(guru: RawGuruRow, location: ZipLookupLocation) {
  const guruZip = cleanZipCode(guru.zip_code);

  if (guruZip && guruZip === location.zip) return true;

  const guruCity = readString(guru.city)?.toLowerCase();
  const guruState = normalizeStateCode(guru.state);
  const locationCity = location.city.trim().toLowerCase();
  const locationState = normalizeStateCode(location.state);

  return Boolean(
    guruCity &&
    locationCity &&
    guruCity === locationCity &&
    (!guruState || !locationState || guruState === locationState),
  );
}

function parseCoordinate(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function calculateDistanceMilesLocal(
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

function getGuruLatitude(guru: RawGuruRow) {
  return parseCoordinate(guru.service_latitude ?? guru.latitude ?? guru.lat);
}

function getGuruLongitude(guru: RawGuruRow) {
  return parseCoordinate(guru.service_longitude ?? guru.longitude ?? guru.lng);
}

function getGuruRadius(guru: RawGuruRow) {
  const parsed = readNumber(guru.service_radius_miles, 25);
  return parsed > 0 ? parsed : 25;
}

function getGuruDisplayName(guru: RawGuruRow) {
  return (
    readString(guru.display_name) ||
    readString(guru.full_name) ||
    readString(guru.name) ||
    "SitGuru Care Guru"
  );
}

function getGuruImageUrl(guru: RawGuruRow) {
  return (
    readString(guru.profile_photo_url) ||
    readString(guru.photo_url) ||
    readString(guru.avatar_url) ||
    readString(guru.image_url)
  );
}

function getGuruLocationLabel(guru: RawGuruRow) {
  return (
    [guru.city, guru.state].filter(Boolean).join(", ") ||
    "Location listed on profile"
  );
}

function getGuruSearchHref(guru: NearbyGuru, careZip?: string | null) {
  const params = new URLSearchParams();
  const cleanCareZip = cleanZipCode(careZip);

  if (cleanCareZip) {
    params.set("zip", cleanCareZip);
  }

  params.set("guru", guru.id);

  if (guru.slug) {
    params.set("slug", guru.slug);
  }

  const queryString = params.toString();

  return queryString ? `${routes.findGuru}?${queryString}` : routes.findGuru;
}

function getGuruHref(guru: RawGuruRow) {
  return routes.findGuru;
}

function normalizeNearbyGuru(
  guru: RawGuruRow,
  distanceMiles: number,
): NearbyGuru {
  const rating = readNumber(guru.rating_avg ?? guru.rating, Number.NaN);
  const rate = readNumber(guru.hourly_rate ?? guru.rate, Number.NaN);

  return {
    id: String(guru.id ?? guru.slug ?? crypto.randomUUID()),
    slug: guru.slug || null,
    name: getGuruDisplayName(guru),
    role: readString(guru.title) || "Pet Care Guru",
    location: getGuruLocationLabel(guru),
    image_url: getGuruImageUrl(guru),
    rating: Number.isFinite(rating) ? rating : null,
    review_count: readNumber(guru.review_count, 0),
    rate: Number.isFinite(rate) ? rate : null,
    services: Array.isArray(guru.services) ? guru.services.filter(Boolean) : [],
    distance_miles: distanceMiles,
    service_radius_miles: getGuruRadius(guru),
    is_verified: Boolean(guru.is_verified),
    href: getGuruHref(guru),
  };
}

function getLatestCareZip(
  bookings: Booking[],
  profile: CustomerProfile | null,
) {
  const upcomingZip = bookings
    .filter(isUpcomingBooking)
    .map((booking) => cleanZipCode(booking.care_zip_code))
    .find((zip) => zip.length === 5);

  if (upcomingZip) return upcomingZip;

  const recentCareZip = bookings
    .map((booking) => cleanZipCode(booking.care_zip_code))
    .find((zip) => zip.length === 5);

  if (recentCareZip) return recentCareZip;

  return getCustomerCareZip(profile);
}

async function lookupCareZipLocation(
  zipCode: string,
): Promise<ZipLookupLocation | null> {
  const cleanZip = cleanZipCode(zipCode);

  if (cleanZip.length !== 5) return null;

  if (ZIP_FALLBACK_LOCATIONS[cleanZip]) {
    return ZIP_FALLBACK_LOCATIONS[cleanZip];
  }

  try {
    const response = await fetch(`https://api.zippopotam.us/us/${cleanZip}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return null;

    const payload = await response.json();
    const place = payload?.places?.[0];
    const latitude = parseCoordinate(place?.latitude);
    const longitude = parseCoordinate(place?.longitude);

    if (latitude === null || longitude === null) return null;

    return {
      zip: cleanZip,
      city: String(place?.["place name"] || ""),
      state: String(place?.["state abbreviation"] || place?.state || ""),
      latitude,
      longitude,
    };
  } catch {
    return null;
  }
}

async function fetchNearbyGurusForCareLocation(zipCode: string) {
  const customerLocation = await lookupCareZipLocation(zipCode);

  if (!customerLocation) {
    return {
      gurus: [] as NearbyGuru[],
      location: null as ZipLookupLocation | null,
      message: "Enter a valid 5-digit care ZIP code to see nearby Gurus.",
    };
  }

  let guruRows: RawGuruRow[] = [];
  let lastError = "";

  for (const selectColumns of GURU_SELECT_ATTEMPTS) {
    const { data, error } = await supabase
      .from("gurus")
      .select(selectColumns)
      .limit(80);

    if (!error) {
      guruRows = (data || []) as RawGuruRow[];
      lastError = "";
      break;
    }

    lastError = error.message || lastError;
  }

  if (lastError) {
    return {
      gurus: [] as NearbyGuru[],
      location: customerLocation,
      message:
        "We could not load nearby Gurus right now. Please try the main search page.",
    };
  }

  const nearbyGurus = guruRows
    .filter((guru) => guru.is_active !== false)
    .filter((guru) => guru.is_public !== false)
    .filter((guru) => guru.is_accepting_bookings !== false)
    .filter((guru) => guru.accepting_bookings !== false)
    .map((guru) => {
      const guruLatitude = getGuruLatitude(guru);
      const guruLongitude = getGuruLongitude(guru);
      const textLocationMatches = locationsMatchByText(guru, customerLocation);

      if (guru.service_area_enabled === false) return null;

      if (guruLatitude === null || guruLongitude === null) {
        return textLocationMatches ? normalizeNearbyGuru(guru, 0) : null;
      }

      const distanceMiles = calculateDistanceMilesLocal(
        customerLocation.latitude,
        customerLocation.longitude,
        guruLatitude,
        guruLongitude,
      );

      if (distanceMiles > getGuruRadius(guru) && !textLocationMatches)
        return null;

      return normalizeNearbyGuru(guru, textLocationMatches ? 0 : distanceMiles);
    })
    .filter((guru): guru is NearbyGuru => Boolean(guru))
    .sort((a, b) => a.distance_miles - b.distance_miles)
    .slice(0, 10);

  return {
    gurus: nearbyGurus,
    location: customerLocation,
    message:
      nearbyGurus.length > 0
        ? ""
        : "No available Gurus are inside their service radius for this care ZIP yet.",
  };
}

function parseMoneyFromText(
  source: string | null | undefined,
  patterns: RegExp[],
) {
  if (!source) return 0;

  for (const pattern of patterns) {
    const match = source.match(pattern);
    const rawValue = match?.[1]?.replace(/,/g, "");

    if (rawValue) {
      const parsed = Number(rawValue);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return 0;
}

function readBookingMoney(
  row: RawBookingRow,
  keys: Array<keyof RawBookingRow>,
  fallback = 0,
) {
  for (const key of keys) {
    const parsed = readNumber(row[key], Number.NaN);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return fallback;
}

function getBestBookingTip(row: RawBookingRow) {
  const directTip = readBookingMoney(row, ["tip_amount", "guru_tip_amount"], 0);
  if (directTip > 0) return directTip;

  return parseMoneyFromText(row.notes, [
    /guru\s+tip\s+selected[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
    /tip\s+selected[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
    /tip\s+amount[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
  ]);
}

function getBestBookingFee(row: RawBookingRow) {
  const directFee = readBookingMoney(
    row,
    ["marketplace_fee_amount", "sitguru_fee_amount"],
    0,
  );
  if (directFee > 0) return directFee;

  return parseMoneyFromText(row.notes, [
    /marketplace\s+fee\s+amount[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
    /sitguru\s+marketplace\s+fee\s+amount[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
  ]);
}

function getBestBookingPayout(row: RawBookingRow) {
  const directPayout = readBookingMoney(
    row,
    ["guru_payout_amount", "guru_estimated_total_payout"],
    0,
  );

  if (directPayout > 0) return directPayout;

  return parseMoneyFromText(row.notes, [
    /estimated\s+guru\s+payout[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
  ]);
}

function getBestCustomerTotal(row: RawBookingRow) {
  const directTotal = readBookingMoney(
    row,
    [
      "total_customer_paid",
      "customer_total_amount",
      "amount_total",
      "total_amount",
      "service_price",
      "subtotal_amount",
    ],
    0,
  );

  if (directTotal > 0) return directTotal;

  const servicePrice = parseMoneyFromText(row.notes, [
    /service(?:\s+price|\s+amount)?[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
    /subtotal[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
  ]);
  const fee = getBestBookingFee(row);
  const tip = getBestBookingTip(row);
  const payout = getBestBookingPayout(row);

  if (servicePrice > 0 || fee > 0 || tip > 0) {
    return servicePrice + fee + tip;
  }

  if (payout > 0 || fee > 0) {
    return payout + fee;
  }

  return 0;
}

function readMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  keys: string[],
) {
  for (const key of keys) {
    const value = readString(metadata?.[key]);
    if (value) return value;
  }

  return null;
}

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMoney(value: number, cents = false) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents ? 2 : 0,
  }).format(value || 0);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date pending";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date pending";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return "No upcoming booking";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date pending";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(value: string | null | undefined) {
  if (!value) return "Flexible";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Flexible";

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusClasses(status: string) {
  const normalized = status.toLowerCase();

  if (
    ["pending", "requested", "checkout_started", "unpaid"].includes(normalized)
  ) {
    return "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
  }

  if (["confirmed", "paid", "completed", "succeeded"].includes(normalized)) {
    return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";
  }

  if (["in_progress", "processing"].includes(normalized)) {
    return "bg-sky-50 text-sky-800 ring-1 ring-sky-200";
  }

  if (["cancelled", "canceled", "failed", "refunded"].includes(normalized)) {
    return "bg-rose-50 text-rose-800 ring-1 ring-rose-200";
  }

  return "bg-slate-50 text-slate-700 ring-1 ring-slate-200";
}

function getBookingDisplayDate(booking: Booking) {
  return (
    booking.start_time ||
    booking.booking_date ||
    booking.requested_date ||
    booking.created_at
  );
}

function isUpcomingBooking(booking: Booking) {
  const rawDate = getBookingDisplayDate(booking);
  if (!rawDate) return false;

  const date = new Date(rawDate).getTime();

  if (!Number.isFinite(date)) return false;

  const status = booking.status.toLowerCase();
  const payment = booking.payment_status.toLowerCase();

  return (
    date >= Date.now() - 24 * 60 * 60 * 1000 &&
    !["cancelled", "canceled", "completed"].includes(status) &&
    !["refunded", "failed"].includes(payment)
  );
}

function getBookingDetailHref(bookingId: string) {
  return `/customer/dashboard/bookings/${encodeURIComponent(bookingId)}`;
}

function getBookingPawReportHref(bookingId: string) {
  return `/customer/dashboard/bookings/${encodeURIComponent(bookingId)}/visit-updates`;
}

function normalizePawReportStatus(status?: string | null) {
  const clean = String(status || "").toLowerCase();

  if (clean === "completed") return "PawReport complete";
  if (clean === "in_progress") return "PawReport live";
  if (clean === "not_started") return "PawReport ready";

  return "PawReport ready";
}

function getLatestPawReportLabel(summary?: PawReportSummary | null) {
  if (!summary) return "Waiting for Guru updates";

  const type = String(summary.latest_update_type || "").toLowerCase();

  if (summary.active_walk_status === "in_progress")
    return "Live walk in progress";
  if (type === "visit_started") return "Guru started the PawReport";
  if (type === "visit_ended") return "Guru completed the PawReport";
  if (type === "pee") return "Potty update added";
  if (type === "poop") return "Potty update added";
  if (type === "water") return "Water update added";
  if (type === "food") return "Food update added";
  if (type === "photo") return "Photo added";
  if (type === "medication") return "Medication update added";
  if (type === "walk") return "Walk update added";
  if (type === "play") return "Play update added";
  if (type === "mood") return "Mood update added";
  if (type === "note") return "Care note added";

  if (summary.status === "completed") return "PawReport completed";
  if (summary.status === "in_progress") return "PawReport in progress";

  return "Waiting for Guru updates";
}

function formatPawReportDistance(meters: number) {
  if (!meters || meters <= 0) return "Not tracked yet";

  const miles = meters / 1609.344;

  if (miles < 0.1) return `${Math.round(meters)} m`;

  return `${miles.toFixed(2)} mi`;
}

function formatPawReportDuration(seconds: number) {
  if (!seconds || seconds <= 0) return "In progress";

  const minutes = Math.max(1, Math.round(seconds / 60));

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  return remaining ? `${hours} hr ${remaining} min` : `${hours} hr`;
}

function formatLiveUpdateTime(value?: string | null) {
  if (!value) return "No updates yet";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "Recently updated";

  return parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

async function fetchCustomerPawReportSummaries() {
  try {
    const response = await fetch("/api/customer/pawreports", {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) return [] as PawReportSummary[];

    const payload = (await response.json()) as {
      summaries?: PawReportSummary[];
    };

    return Array.isArray(payload.summaries) ? payload.summaries : [];
  } catch (error) {
    console.warn("Unable to load live PawReports:", error);
    return [] as PawReportSummary[];
  }
}

function getBookingLocation(booking: Booking) {
  return [booking.care_city, booking.care_state, booking.care_zip_code]
    .filter(Boolean)
    .join(", ");
}

function findPetForBooking(booking: Booking, pets: Pet[]) {
  const bookingPetId = booking.pet_id?.trim();
  const bookingPetName = booking.pet_name?.trim().toLowerCase();

  return (
    pets.find((pet) => (bookingPetId ? pet.id === bookingPetId : false)) ||
    pets.find((pet) =>
      bookingPetName ? pet.name.trim().toLowerCase() === bookingPetName : false,
    ) ||
    (pets.length === 1 ? pets[0] : null)
  );
}

function getBookingCareSummary(booking: Booking) {
  const service = booking.service_type || "Pet care";
  const petName = booking.pet_name || "your pet";
  const guruName = booking.guru_name?.trim();

  if (guruName) {
    return `${service} with ${guruName} for ${petName}`;
  }

  return `${service} arranged for ${petName}`;
}

function getBookingNextStep(booking: Booking) {
  const status = booking.status.toLowerCase();
  const payment = booking.payment_status.toLowerCase();

  if (["pending", "requested"].includes(status)) {
    return "Request sent. Watch here for updates.";
  }

  if (["checkout_started", "unpaid"].includes(payment)) {
    return "Finish payment to confirm care.";
  }

  if (
    ["confirmed", "paid", "succeeded"].includes(payment) ||
    status === "confirmed"
  ) {
    return "You’re all set.";
  }

  if (status === "completed") {
    return "Care complete. View the PawReport or book again.";
  }

  return "Open the booking for the latest details.";
}

function buildCustomerProfile(
  row: RawProfileRow | null,
  user: SupabaseUserLike,
): CustomerProfile {
  const metadata = user.user_metadata ?? null;

  const firstName =
    readString(row?.first_name) ||
    readMetadataString(metadata, ["first_name", "given_name"]) ||
    null;

  const lastName =
    readString(row?.last_name) ||
    readMetadataString(metadata, ["last_name", "family_name"]) ||
    null;

  const fullName =
    readString(row?.full_name) ||
    readString(row?.name) ||
    readMetadataString(metadata, ["full_name", "name"]) ||
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    null;

  const resolvedFirstName = firstName || fullName?.split(" ")[0] || null;

  const streetAddress =
    readString(row?.street_address) ||
    readString(row?.address) ||
    readString(row?.home_address) ||
    readMetadataString(metadata, [
      "street_address",
      "street",
      "streetAddress",
      "address",
      "home_address",
      "service_address",
    ]) ||
    null;

  const city =
    readString(row?.service_city) ||
    readString(row?.city) ||
    readString(row?.home_city) ||
    readMetadataString(metadata, ["service_city", "city", "home_city"]) ||
    null;

  const state =
    readString(row?.service_state) ||
    readString(row?.state) ||
    readString(row?.home_state) ||
    readMetadataString(metadata, ["service_state", "state", "home_state"]) ||
    null;

  const zipCode =
    cleanZipCode(row?.service_zip) ||
    cleanZipCode(row?.zip) ||
    cleanZipCode(row?.zip_code) ||
    cleanZipCode(row?.zipcode) ||
    cleanZipCode(row?.postal_code) ||
    cleanZipCode(
      readMetadataString(metadata, [
        "service_zip",
        "zip",
        "zip_code",
        "zipcode",
        "postal_code",
      ]),
    ) ||
    null;

  const directAddress =
    readString(row?.service_address) ||
    readString(row?.address) ||
    readString(row?.home_address) ||
    readMetadataString(metadata, [
      "service_address",
      "address",
      "home_address",
    ]) ||
    null;

  const serviceAddress =
    directAddress ||
    buildAddressFromParts({
      street: streetAddress,
      city,
      state,
      zipCode,
    });

  return {
    first_name: resolvedFirstName,
    last_name: lastName,
    full_name: fullName,
    email: user.email ?? null,
    phone:
      readString(row?.phone) ||
      readString(row?.phone_number) ||
      readMetadataString(metadata, ["phone", "phone_number"]) ||
      null,
    service_address: serviceAddress,
    street_address: streetAddress,
    city,
    state,
    zip_code: zipCode || extractZipCode(serviceAddress),
    emergency_contact:
      readString(row?.emergency_contact) ||
      readString(row?.emergency_contact_name) ||
      readMetadataString(metadata, [
        "emergency_contact",
        "emergency_contact_name",
      ]) ||
      null,
    care_preferences:
      readString(row?.care_preferences) ||
      readString(row?.preferences) ||
      readString(row?.notes) ||
      readMetadataString(metadata, [
        "care_preferences",
        "preferences",
        "notes",
      ]) ||
      null,
    avatar_url:
      readString(row?.avatar_url) ||
      readString(row?.profile_photo_url) ||
      readString(row?.photo_url) ||
      readString(row?.image_url) ||
      readMetadataString(metadata, [
        "avatar_url",
        "profile_photo_url",
        "photo_url",
        "picture",
        "avatar",
      ]) ||
      null,
  };
}

function customerProfileToForm(
  profile: CustomerProfile | null,
): CustomerProfileForm {
  return {
    full_name: profile?.full_name || profile?.first_name || "",
    phone: profile?.phone || "",
    service_address: profile?.service_address || "",
    emergency_contact: profile?.emergency_contact || "",
    care_preferences: profile?.care_preferences || "",
  };
}

function getSafeFirstName(
  profile: CustomerProfile | null,
  email?: string | null,
) {
  if (profile?.first_name?.trim()) return profile.first_name.trim();
  if (profile?.full_name?.trim())
    return profile.full_name.trim().split(" ")[0] || "there";

  if (email?.trim()) {
    const emailPrefix = email.trim().split("@")[0];
    if (emailPrefix)
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  }

  return "there";
}

function getCustomerInitials(profile: CustomerProfile | null) {
  const name =
    profile?.full_name || profile?.first_name || profile?.email || "Pet Parent";
  const parts = name
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);

  const firstInitial = parts[0]?.charAt(0) || "C";
  const secondInitial = parts[1]?.charAt(0) || "U";

  return `${firstInitial}${secondInitial}`.toUpperCase();
}

function getDisplayValue(value: string | null | undefined) {
  return value?.trim() || "Can be added when ready";
}

function normalizeBookingRow(row: RawBookingRow): Booking {
  const subtotal = readNumber(
    row.subtotal_amount ?? row.service_price ?? row.total_amount,
    0,
  );
  const marketplaceFee = getBestBookingFee(row);
  const tip = getBestBookingTip(row);
  const customerTotal = getBestCustomerTotal(row);
  const guruPayout =
    getBestBookingPayout(row) || Math.max(0, customerTotal - marketplaceFee);

  return {
    id: String(row.id ?? crypto.randomUUID()),
    status: row.status?.trim() || "pending",
    payment_status: row.payment_status?.trim() || "unpaid",
    payout_status: row.payout_status?.trim() || null,
    start_time:
      row.start_time?.trim() ||
      row.booking_date?.trim() ||
      row.requested_date?.trim() ||
      row.date?.trim() ||
      row.created_at?.trim() ||
      new Date(0).toISOString(),
    booking_date: row.booking_date ?? null,
    requested_date: row.requested_date ?? row.date ?? null,
    service_type: row.service_type ?? "Pet Care",
    service_key: row.service_key ?? null,
    pet_name: row.pet_name ?? "Pet",
    guru_name: row.guru_name ?? row.sitter_name ?? row.provider_name ?? null,
    guru_id: row.guru_id ? String(row.guru_id) : null,
    guru_avatar_url:
      row.guru_avatar_url ??
      row.guru_photo_url ??
      row.sitter_avatar_url ??
      row.sitter_photo_url ??
      row.provider_avatar_url ??
      row.provider_photo_url ??
      null,
    pet_id: row.pet_id ? String(row.pet_id) : null,
    notes: row.notes ?? null,
    time_window: row.time_window ?? null,
    visit_length: row.visit_length ?? null,
    care_city: row.care_city ?? null,
    care_state: row.care_state ?? null,
    care_zip_code: row.care_zip_code ?? null,
    subtotal_amount: subtotal,
    marketplace_fee_percent: readNumber(row.marketplace_fee_percent, 15),
    marketplace_fee_amount: marketplaceFee,
    tip_amount: tip,
    guru_payout_amount: guruPayout,
    total_customer_paid: customerTotal || subtotal + tip,
    stripe_session_id:
      row.stripe_session_id ?? row.stripe_checkout_session_id ?? null,
    created_at: row.created_at ?? null,
  };
}

function normalizePetRow(row: RawPetRow): Pet {
  const canonical = normalizeCanonicalPet(row as Record<string, unknown>);
  if (canonical) {
    return {
      id: canonical.id,
      name: canonical.name,
      species: canonical.species,
      breed: canonical.breed,
      age: canonical.age,
      size: canonical.size,
      weight: canonical.weight,
      temperament: canonical.temperament,
      medical_notes: canonical.medical_notes,
      medications: canonical.medical_notes,
      notes: canonical.notes,
      photo_url: canonical.photo_url,
      video_url: canonical.video_url,
    };
  }

  return {
    id: String(row.id ?? crypto.randomUUID()),
    name: row.name?.trim() || "Pet",
    species: row.species ?? null,
    breed: row.breed ?? null,
    age: row.age ?? null,
    size: null,
    weight: row.weight ?? null,
    temperament: row.temperament ?? null,
    medical_notes: row.medications ?? null,
    medications: row.medications ?? null,
    notes: row.notes ?? null,
    photo_url: row.photo_url ?? null,
    video_url: row.video_url ?? null,
  };
}

function normalizeReferralProfileRow(
  row: RawReferralProfileRow,
): ReferralProfile {
  return {
    id: row.id ?? crypto.randomUUID(),
    user_id: row.user_id ?? "",
    role: row.role ?? "customer",
    referral_code: row.referral_code ?? "",
    referral_link: row.referral_link ?? null,
    total_invites: Number(row.total_invites ?? 0),
    completed_referrals: Number(row.completed_referrals ?? 0),
    pending_rewards: Number(row.pending_rewards ?? 0),
    earned_rewards: Number(row.earned_rewards ?? 0),
    paid_rewards: Number(row.paid_rewards ?? 0),
    available_credit: Number(row.available_credit ?? 0),
  };
}

function generateCustomerReferralCode(userId: string) {
  const cleanId = userId.replace(/-/g, "").slice(0, 10).toUpperCase();
  return `CUST-${cleanId}`;
}

function buildCustomerReferralLink(referralCode: string) {
  return `https://sitguru.com/signup?ref=${encodeURIComponent(referralCode)}&type=customer`;
}

function buildGuruReferralLink(referralCode: string) {
  return `https://sitguru.com/become-a-guru?ref=${encodeURIComponent(referralCode)}&type=guru`;
}

function buildPetMessageHref(pet: Pet) {
  const intro = `Hi! I would like to talk about care for ${pet.name}.`;
  return `/messages?pet=${encodeURIComponent(pet.id)}&petName=${encodeURIComponent(
    pet.name,
  )}&message=${encodeURIComponent(intro)}`;
}

function buildPetAdminHref(pet: Pet) {
  return `/messages/admin?pet=${encodeURIComponent(pet.id)}&petName=${encodeURIComponent(
    pet.name,
  )}`;
}

function buildPetBookingHref(pet: Pet) {
  return `/search?pet=${encodeURIComponent(pet.id)}&petName=${encodeURIComponent(pet.name)}`;
}

async function fetchCustomerProfile(user: SupabaseUserLike) {
  const profileSelectAttempts = [
    "first_name, full_name, phone, service_address, service_city, service_state, service_zip, emergency_contact, care_preferences, email_notifications, push_notifications, text_notifications, avatar_url",
    "first_name, last_name, full_name, name, phone, phone_number, service_address, service_city, service_state, service_zip, emergency_contact, emergency_contact_name, care_preferences, preferences, notes, avatar_url, profile_photo_url, photo_url, image_url",
    "first_name, last_name, full_name, name, phone, phone_number, street_address, address, service_address, home_address, service_city, city, home_city, service_state, state, home_state, service_zip, zip, zip_code, zipcode, postal_code, emergency_contact, emergency_contact_name, care_preferences, preferences, notes, avatar_url, profile_photo_url, photo_url, image_url",
    "first_name, last_name, full_name, name, phone, phone_number, street_address, address, service_address, service_city, city, service_state, state, service_zip, zip, zip_code, zipcode, postal_code, emergency_contact, care_preferences, avatar_url, profile_photo_url, photo_url, image_url",
    "first_name, last_name, full_name, name, phone, street_address, service_city, city, service_state, state, service_zip, zip_code, emergency_contact, care_preferences, avatar_url",
    "first_name, last_name, full_name, name, phone, address, service_city, city, service_state, state, service_zip, zip_code, emergency_contact, care_preferences, avatar_url",
    "first_name, last_name, full_name, name, phone, service_address, emergency_contact, care_preferences, avatar_url",
    "first_name, last_name, full_name, name, phone, address, emergency_contact, care_preferences, avatar_url",
    "first_name, last_name, full_name, name, phone, street_address, city, state, zip_code",
    "first_name, last_name, full_name, name, phone, address, city, state, zip_code",
    "first_name, last_name, full_name, name, phone, service_address",
    "first_name, last_name, full_name, name, avatar_url, profile_photo_url, photo_url, image_url",
    "first_name, last_name, full_name, name",
  ];

  const tableAttempts: Array<{
    table: string;
    column: string;
    value: string;
  }> = [
    { table: "profiles", column: "id", value: user.id },
    { table: "profiles", column: "user_id", value: user.id },
    { table: "customer_profiles", column: "user_id", value: user.id },
    { table: "customer_profiles", column: "id", value: user.id },
    { table: "customers", column: "user_id", value: user.id },
    { table: "customers", column: "id", value: user.id },
  ];

  for (const tableAttempt of tableAttempts) {
    for (const selectColumns of profileSelectAttempts) {
      const { data, error } = await supabase
        .from(tableAttempt.table)
        .select(selectColumns)
        .eq(tableAttempt.column, tableAttempt.value)
        .maybeSingle();

      if (!error && data) {
        return buildCustomerProfile(data as RawProfileRow, user);
      }
    }
  }

  return buildCustomerProfile(null, user);
}

async function saveCustomerProfile(userId: string, form: CustomerProfileForm) {
  const fullName = form.full_name.trim();
  const firstName = fullName.split(" ")[0] || fullName || null;

  const saveAttempts: Array<{
    label: "full" | "contact" | "basic";
    payload: Record<string, string | null>;
  }> = [
    {
      label: "full",
      payload: {
        id: userId,
        role: "customer",
        full_name: fullName || null,
        first_name: firstName,
        phone: form.phone.trim() || null,
        service_address: form.service_address.trim() || null,
        emergency_contact: form.emergency_contact.trim() || null,
        care_preferences: form.care_preferences.trim() || null,
      },
    },
    {
      label: "full",
      payload: {
        id: userId,
        role: "customer",
        full_name: fullName || null,
        first_name: firstName,
        phone: form.phone.trim() || null,
        address: form.service_address.trim() || null,
        emergency_contact: form.emergency_contact.trim() || null,
        care_preferences: form.care_preferences.trim() || null,
      },
    },
    {
      label: "contact",
      payload: {
        id: userId,
        role: "customer",
        full_name: fullName || null,
        first_name: firstName,
        phone: form.phone.trim() || null,
        service_address: form.service_address.trim() || null,
      },
    },
    {
      label: "contact",
      payload: {
        id: userId,
        role: "customer",
        full_name: fullName || null,
        first_name: firstName,
        phone: form.phone.trim() || null,
        address: form.service_address.trim() || null,
      },
    },
    {
      label: "basic",
      payload: {
        id: userId,
        role: "customer",
        full_name: fullName || null,
        first_name: firstName,
      },
    },
  ];

  let lastError = "We could not save your profile right now.";

  for (const attempt of saveAttempts) {
    const { error } = await supabase
      .from("profiles")
      .upsert(attempt.payload, { onConflict: "id" });

    if (!error) return attempt.label;

    lastError = error.message || lastError;
  }

  throw new Error(lastError);
}

function getProfilePhotoExtension(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/jpeg") return "jpg";

  const fileNameExtension = file.name.split(".").pop()?.toLowerCase();
  return fileNameExtension === "png" ? "png" : "jpg";
}

async function uploadCustomerProfilePhoto(userId: string, file: File) {
  if (!["image/jpeg", "image/png"].includes(file.type)) {
    throw new Error("Please upload a JPG or PNG profile picture.");
  }

  if (file.size > MAX_PROFILE_PHOTO_SIZE) {
    throw new Error("Please upload a profile picture under 5MB.");
  }

  const extension = getProfilePhotoExtension(file);
  const filePath = `${userId}/customer-avatar-${Date.now()}.${extension}`;
  let lastError = "We could not upload your profile picture right now.";

  for (const bucket of PROFILE_PHOTO_BUCKETS) {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: true,
      });

    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

      if (data.publicUrl) return data.publicUrl;
    }

    lastError =
      error?.message ||
      `We could not upload your profile picture to the ${bucket} bucket.`;
  }

  throw new Error(
    `${lastError} Make sure Supabase Storage has a public bucket named profile-photos or avatars.`,
  );
}

async function saveCustomerProfilePhotoUrl(userId: string, avatarUrl: string) {
  const saveAttempts = [
    { id: userId, role: "customer", avatar_url: avatarUrl },
    { id: userId, role: "customer", profile_photo_url: avatarUrl },
    { id: userId, role: "customer", photo_url: avatarUrl },
  ];

  let lastError =
    "The photo uploaded, but we could not connect it to your profile.";

  for (const payload of saveAttempts) {
    const { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    if (!error) return;

    lastError = error.message || lastError;
  }

  throw new Error(lastError);
}

function getPetMediaExtension(file: File, kind: PetMediaKind) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (kind === "photo") {
    if (file.type === "image/png") return "png";
    if (file.type === "image/jpeg") return "jpg";
    return extension === "png" ? "png" : "jpg";
  }

  if (file.type === "video/quicktime") return "mov";
  if (file.type === "video/webm") return "webm";

  return extension && ["mp4", "mov", "webm"].includes(extension)
    ? extension
    : "mp4";
}

function validatePetMediaFile(file: File, kind: PetMediaKind) {
  if (kind === "photo") {
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      throw new Error("Please upload a JPG or PNG pet photo.");
    }

    if (file.size > MAX_PET_PHOTO_SIZE) {
      throw new Error("Please upload a pet photo under 8MB.");
    }

    return;
  }

  if (!["video/mp4", "video/quicktime", "video/webm"].includes(file.type)) {
    throw new Error("Please upload an MP4, MOV, or WEBM pet video.");
  }

  if (file.size > MAX_PET_VIDEO_SIZE) {
    throw new Error("Please upload a pet video under 75MB.");
  }
}

async function uploadPetMedia(
  userId: string,
  petId: string,
  file: File,
  kind: PetMediaKind,
) {
  validatePetMediaFile(file, kind);

  const extension = getPetMediaExtension(file, kind);
  const safePetId = petId.replace(/[^a-zA-Z0-9_-]/g, "");
  const filePath = `${userId}/${safePetId}/${kind}-${Date.now()}.${extension}`;
  const buckets = kind === "photo" ? PET_PHOTO_BUCKETS : PET_VIDEO_BUCKETS;
  let lastError = `We could not upload your pet ${kind} right now.`;

  for (const bucket of buckets) {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: true,
      });

    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

      if (data.publicUrl) return data.publicUrl;
    }

    lastError =
      error?.message || `We could not upload to the ${bucket} bucket.`;
  }

  throw new Error(
    `${lastError} Make sure Supabase Storage has public buckets named pet-photos and pet-videos.`,
  );
}

async function savePetMediaUrl(
  petId: string,
  kind: PetMediaKind,
  publicUrl: string,
) {
  const payload =
    kind === "photo" ? { photo_url: publicUrl } : { video_url: publicUrl };

  const { error } = await supabase.from("pets").update(payload).eq("id", petId);

  if (error) {
    throw new Error(
      error.message ||
        `The ${kind} uploaded, but we could not connect it to the pet profile.`,
    );
  }
}

async function fetchBookingsForUser(userId: string, userEmail?: string | null) {
  const richSelect =
    "id,status,payment_status,payout_status,start_time,booking_date,requested_date,service_type,service_key,pet_name,guru_name,sitter_name,provider_name,guru_id,guru_avatar_url,guru_photo_url,sitter_avatar_url,sitter_photo_url,provider_avatar_url,provider_photo_url,pet_id,notes,time_window,visit_length,care_city,care_state,care_zip_code,subtotal_amount,service_price,total_amount,marketplace_fee_percent,marketplace_fee_amount,sitguru_fee_amount,tip_amount,guru_tip_amount,guru_payout_amount,guru_estimated_total_payout,total_customer_paid,customer_total_amount,amount_total,stripe_session_id,stripe_checkout_session_id,created_at";

  const fallbackSelect =
    "id,status,start_time,booking_date,requested_date,notes,created_at";
  const normalizedEmail = userEmail?.trim().toLowerCase() || null;
  let firstSuccessfulEmptyResult: Booking[] | null = null;

  const idAttempts: Array<{
    matchColumn: string;
    matchValue: string;
    dateColumn: "start_time" | "booking_date" | "requested_date" | "created_at";
    selectColumns: string;
  }> = [
    {
      matchColumn: "pet_owner_id",
      matchValue: userId,
      dateColumn: "start_time",
      selectColumns: richSelect,
    },
    {
      matchColumn: "customer_id",
      matchValue: userId,
      dateColumn: "start_time",
      selectColumns: richSelect,
    },
    {
      matchColumn: "user_id",
      matchValue: userId,
      dateColumn: "start_time",
      selectColumns: richSelect,
    },
    {
      matchColumn: "pet_owner_id",
      matchValue: userId,
      dateColumn: "booking_date",
      selectColumns: richSelect,
    },
    {
      matchColumn: "customer_id",
      matchValue: userId,
      dateColumn: "booking_date",
      selectColumns: richSelect,
    },
    {
      matchColumn: "user_id",
      matchValue: userId,
      dateColumn: "booking_date",
      selectColumns: richSelect,
    },
    {
      matchColumn: "pet_owner_id",
      matchValue: userId,
      dateColumn: "created_at",
      selectColumns: fallbackSelect,
    },
    {
      matchColumn: "customer_id",
      matchValue: userId,
      dateColumn: "created_at",
      selectColumns: fallbackSelect,
    },
    {
      matchColumn: "user_id",
      matchValue: userId,
      dateColumn: "created_at",
      selectColumns: fallbackSelect,
    },
  ];

  const emailAttempts: Array<{
    matchColumn: string;
    matchValue: string;
    dateColumn: "start_time" | "booking_date" | "requested_date" | "created_at";
    selectColumns: string;
  }> = normalizedEmail
    ? [
        {
          matchColumn: "customer_email",
          matchValue: normalizedEmail,
          dateColumn: "start_time",
          selectColumns: richSelect,
        },
        {
          matchColumn: "email",
          matchValue: normalizedEmail,
          dateColumn: "start_time",
          selectColumns: richSelect,
        },
        {
          matchColumn: "customer_email",
          matchValue: normalizedEmail,
          dateColumn: "booking_date",
          selectColumns: richSelect,
        },
        {
          matchColumn: "email",
          matchValue: normalizedEmail,
          dateColumn: "booking_date",
          selectColumns: richSelect,
        },
        {
          matchColumn: "customer_email",
          matchValue: normalizedEmail,
          dateColumn: "created_at",
          selectColumns: fallbackSelect,
        },
        {
          matchColumn: "email",
          matchValue: normalizedEmail,
          dateColumn: "created_at",
          selectColumns: fallbackSelect,
        },
      ]
    : [];

  for (const attempt of [...idAttempts, ...emailAttempts]) {
    const { data, error } = await supabase
      .from("bookings")
      .select(attempt.selectColumns)
      .eq(attempt.matchColumn, attempt.matchValue)
      .order(attempt.dateColumn, { ascending: false })
      .limit(12);

    if (error) continue;

    const normalizedRows =
      (data as RawBookingRow[] | null)?.map(normalizeBookingRow) || [];

    if (normalizedRows.length > 0) {
      return normalizedRows;
    }

    if (!firstSuccessfulEmptyResult) {
      firstSuccessfulEmptyResult = normalizedRows;
    }
  }

  return firstSuccessfulEmptyResult || [];
}

async function fetchPetsForUser(userId: string) {
  const attempts: Array<{ matchColumn: string; orderByCreatedAt: boolean }> = [
    { matchColumn: "owner_id", orderByCreatedAt: true },
    { matchColumn: "user_id", orderByCreatedAt: true },
    { matchColumn: "owner_id", orderByCreatedAt: false },
    { matchColumn: "user_id", orderByCreatedAt: false },
  ];

  for (const attempt of attempts) {
    let query = supabase
      .from("pets")
      .select(
        "id, name, species, pet_type, breed, age, size, size_category, weight, temperament, medical_notes, medications, notes, photo_url, video_url, user_id, owner_id, feeding_routine, potty_routine",
      )
      .eq(attempt.matchColumn, userId);

    if (attempt.orderByCreatedAt) {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (!error) return (data as RawPetRow[] | null)?.map(normalizePetRow) || [];
  }

  return [] as Pet[];
}

async function getOrCreateReferralProfile(userId: string) {
  const referralProfileSelect =
    "id, user_id, role, referral_code, referral_link, total_invites, completed_referrals, pending_rewards, earned_rewards, paid_rewards, available_credit";

  const { data, error } = await supabase
    .from("referral_profiles")
    .select(referralProfileSelect)
    .eq("user_id", userId)
    .maybeSingle();

  if (!error && data)
    return normalizeReferralProfileRow(data as RawReferralProfileRow);

  const referralCode = generateCustomerReferralCode(userId);
  const referralLink = buildCustomerReferralLink(referralCode);

  const { data: createdProfile, error: createError } = await supabase
    .from("referral_profiles")
    .insert({
      user_id: userId,
      role: "customer",
      referral_code: referralCode,
      referral_link: referralLink,
      total_invites: 0,
      completed_referrals: 0,
      pending_rewards: 0,
      earned_rewards: 0,
      paid_rewards: 0,
      available_credit: 0,
    })
    .select(referralProfileSelect)
    .maybeSingle();

  if (!createError && createdProfile) {
    return normalizeReferralProfileRow(createdProfile as RawReferralProfileRow);
  }

  if (createError?.code === "23505") {
    const { data: recoveredProfile, error: recoveryError } = await supabase
      .from("referral_profiles")
      .select(referralProfileSelect)
      .eq("user_id", userId)
      .maybeSingle();

    if (!recoveryError && recoveredProfile) {
      return normalizeReferralProfileRow(
        recoveredProfile as RawReferralProfileRow,
      );
    }

    console.error("Referral profile recovery error:", recoveryError);
    return null;
  }

  console.error("Referral profile error:", createError);
  return null;
}

async function fetchCustomerUniversityProgress(): Promise<UniversityProgress> {
  try {
    const response = await fetch("/api/customer/university-progress", {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn(
        "Unable to load Pet Parent Academy progress:",
        response.status,
      );
      return defaultUniversityProgress;
    }

    const payload = await response.json();
    const progress = payload?.progress as
      Partial<UniversityProgress> | undefined;

    if (!progress) return defaultUniversityProgress;

    return {
      totalSteps: Number(
        progress.totalSteps ?? defaultUniversityProgress.totalSteps,
      ),
      completedSteps: Number(progress.completedSteps ?? 0),
      totalMaterials: Number(progress.totalMaterials ?? 0),
      acknowledgedMaterials: Number(progress.acknowledgedMaterials ?? 0),
      requiredMaterials: Number(progress.requiredMaterials ?? 0),
      progressPercent: Number(progress.progressPercent ?? 0),
      isStarted: Boolean(progress.isStarted),
      isComplete: Boolean(progress.isComplete),
      certificationLabel:
        progress.certificationLabel ||
        defaultUniversityProgress.certificationLabel,
      badgeStatus:
        progress.badgeStatus || defaultUniversityProgress.badgeStatus,
      progressHelper:
        progress.progressHelper || defaultUniversityProgress.progressHelper,
      universityTileHelper:
        progress.universityTileHelper ||
        defaultUniversityProgress.universityTileHelper,
      academyButtonLabel:
        progress.academyButtonLabel ||
        defaultUniversityProgress.academyButtonLabel,
    };
  } catch (error) {
    console.warn("Unable to load Pet Parent Academy progress:", error);
    return defaultUniversityProgress;
  }
}

function NearbyGurusCarousel({
  gurus,
  careZip,
  careLocationLabel,
  careZipInput,
  loading,
  message,
  onCareZipInputChange,
  onCareZipSubmit,
}: {
  gurus: NearbyGuru[];
  careZip: string;
  careLocationLabel: string;
  careZipInput: string;
  loading: boolean;
  message: string;
  onCareZipInputChange: (value: string) => void;
  onCareZipSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="mt-4 overflow-hidden rounded-[2rem] border border-emerald-200 bg-white shadow-sm">
      <div className="bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_54%,#dff7ef_100%)] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700">
              Nearby Gurus
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Gurus Near Me
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-700">
              Trusted care around {careLocationLabel || (careZip ? `ZIP ${careZip}` : "your area")}.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-800 ring-1 ring-emerald-100">
                Care ZIP: {careZip || "Not set"}
              </span>

              {careLocationLabel ? (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                  {careLocationLabel}
                </span>
              ) : null}
            </div>
          </div>

          <form
            onSubmit={onCareZipSubmit}
            className="flex w-full flex-col gap-2 rounded-[1.4rem] bg-white p-3 shadow-sm ring-1 ring-emerald-100 sm:w-auto sm:min-w-[320px] sm:flex-row"
          >
            <input
              value={careZipInput}
              onChange={(event) => onCareZipInputChange(event.target.value)}
              inputMode="numeric"
              maxLength={5}
              placeholder="Care ZIP"
              className="min-h-[46px] flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white"
            />

            <button
              type="submit"
              disabled={loading}
              className="min-h-[46px] rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Checking..." : "Update"}
            </button>
          </form>
        </div>

        {message ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-800">
            {message}
          </div>
        ) : null}

        {gurus.length > 0 ? (
          <div className="mt-6 flex gap-4 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {gurus.map((guru) => (
              <article
                key={guru.id}
                className="min-w-[280px] max-w-[280px] overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl sm:min-w-[320px] sm:max-w-[320px]"
              >
                <Link href={getGuruSearchHref(guru, careZip)} className="block">
                  <div className="relative h-48 overflow-hidden bg-emerald-50">
                    {guru.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={guru.image_url}
                        alt={guru.name}
                        className="h-full w-full object-cover object-center"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-5xl">
                        🐾
                      </div>
                    )}

                    <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                      {guru.is_verified ? (
                        <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-black text-emerald-700 shadow-sm">
                          Verified
                        </span>
                      ) : null}

                      <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                        {guru.distance_miles.toFixed(1)} mi
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={getGuruSearchHref(guru, careZip)}>
                        <h3 className="truncate text-lg font-black text-slate-950 transition hover:text-emerald-700">
                          {guru.name}
                        </h3>
                      </Link>

                      <p className="mt-1 text-sm font-bold text-emerald-700">
                        {guru.role}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 ring-1 ring-emerald-100">
                      {guru.rating ? guru.rating.toFixed(1) : "New"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    {guru.location}
                  </p>

                  <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
                    {Math.round(guru.service_radius_miles)}-mile service radius
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                      Accepts care within{" "}
                      {Math.round(guru.service_radius_miles)} mi
                    </span>

                    {guru.rate ? (
                      <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                        {formatMoney(guru.rate)}/hr
                      </span>
                    ) : null}
                  </div>

                  {guru.services.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {guru.services.slice(0, 3).map((service) => (
                        <span
                          key={service}
                          className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-800"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <Link
                      href={getGuruSearchHref(guru, careZip)}
                      className="inline-flex min-h-[42px] items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white transition hover:bg-emerald-700"
                    >
                      Select Guru
                    </Link>

                    <Link
                      href={`${routes.bookGuru}?guru=${encodeURIComponent(guru.id)}&zip=${encodeURIComponent(careZip)}`}
                      className="inline-flex min-h-[42px] items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
                    >
                      Book
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-emerald-200 bg-white/70 p-6 text-center">
            <Sparkles className="mx-auto h-9 w-9 text-emerald-600" />
            <p className="mt-3 text-base font-black text-slate-950">
              Personalized Guru matches will appear here.
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Add a care ZIP to see available Gurus.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function BookingCard({
  booking,
  featured = false,
  petPhotoUrl = null,
  pawReportSummary = null,
}: {
  booking: Booking;
  featured?: boolean;
  petPhotoUrl?: string | null;
  pawReportSummary?: PawReportSummary | null;
}) {
  const displayDate = getBookingDisplayDate(booking);
  const location = getBookingLocation(booking);
  const totalAmount = booking.total_customer_paid || booking.subtotal_amount;
  const hasPawReportActivity = Boolean(
    pawReportSummary &&
    (pawReportSummary.status === "in_progress" ||
      pawReportSummary.status === "completed" ||
      pawReportSummary.update_count > 0 ||
      pawReportSummary.active_walk_status === "in_progress"),
  );

  return (
    <article
      className={[
        "overflow-hidden rounded-[1.9rem] border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl",
        featured
          ? "border-emerald-200 ring-4 ring-emerald-50"
          : "border-slate-200",
      ].join(" ")}
    >
      <div
        className={[
          "relative overflow-hidden p-5 sm:p-6",
          featured
            ? "bg-gradient-to-br from-emerald-50 via-white to-sky-50"
            : "bg-gradient-to-br from-slate-50 via-white to-white",
        ].join(" ")}
      >
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-100/60 blur-2xl" />

        <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px] xl:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-800">
                Trusted care
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClasses(booking.status)}`}
              >
                {formatStatus(booking.status)}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClasses(booking.payment_status)}`}
              >
                {formatStatus(booking.payment_status)}
              </span>
            </div>

            <div className="mt-4 flex min-w-0 items-start gap-4">
              <div className="relative shrink-0">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.4rem] bg-white text-3xl shadow-sm ring-1 ring-slate-200">
                  {petPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={petPhotoUrl}
                      alt={booking.pet_name || "Pet"}
                      className="h-full w-full object-cover object-center"
                    />
                  ) : (
                    <PawIcon
                      className="h-7 w-7 text-emerald-600"
                      size={28}
                      contrast="light"
                      solid
                    />
                  )}
                </div>

                {booking.guru_avatar_url ? (
                  <div className="absolute -bottom-2 -right-2 h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-white shadow-sm ring-1 ring-emerald-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={booking.guru_avatar_url}
                      alt={booking.guru_name || "Guru"}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                  {booking.pet_name || "Your pet"}
                </h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  {getBookingCareSummary(booking)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl bg-white/90 p-3 ring-1 ring-slate-200">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Date
                </p>
                <p className="mt-1 inline-flex items-center gap-2 text-sm font-black text-slate-950">
                  <CalendarDays className="h-4 w-4 text-emerald-600" />
                  {formatDate(displayDate)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/90 p-3 ring-1 ring-slate-200">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Time
                </p>
                <p className="mt-1 inline-flex items-center gap-2 text-sm font-black text-slate-950">
                  <Clock3 className="h-4 w-4 text-emerald-600" />
                  {booking.time_window || formatTime(displayDate)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/90 p-3 ring-1 ring-slate-200 md:col-span-2 xl:col-span-1">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Location
                </p>
                <p className="mt-1 text-sm font-black leading-5 text-slate-950 break-words">
                  {location || "Location details ready in booking view"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Total
                </p>
                <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                  {formatMoney(totalAmount, true)}
                </p>
              </div>

              <ShieldCheck className="h-9 w-9 text-emerald-600" />
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {getBookingNextStep(booking)}
            </p>

            {hasPawReportActivity ? (
              <div className="mt-3 rounded-2xl border border-sky-200 bg-sky-50 px-3 py-3 text-xs font-bold leading-5 text-sky-900">
                <div className="flex items-center justify-between gap-3">
                  <span>{getLatestPawReportLabel(pawReportSummary)}</span>
                  <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-sky-800 ring-1 ring-sky-100">
                    {formatLiveUpdateTime(pawReportSummary?.latest_update_at)}
                  </span>
                </div>
                {pawReportSummary?.active_walk_status === "in_progress" ? (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <span className="rounded-xl bg-white px-2 py-1 text-slate-800 ring-1 ring-sky-100">
                      Walk:{" "}
                      {formatPawReportDistance(
                        pawReportSummary.active_walk_distance_meters,
                      )}
                    </span>
                    <span className="rounded-xl bg-white px-2 py-1 text-slate-800 ring-1 ring-sky-100">
                      {formatPawReportDuration(
                        pawReportSummary.active_walk_duration_seconds,
                      )}
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold leading-5 text-emerald-800">
              Need a change? Message your Guru or SitGuru support.
            </div>

            {booking.tip_amount > 0 ? (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">
                Includes {formatMoney(booking.tip_amount, true)} tip for your
                Guru
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-t border-slate-100 p-5 sm:grid-cols-2 xl:grid-cols-5">
        <Link
          href={getBookingDetailHref(booking.id)}
          className="inline-flex min-h-[46px] items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
        >
          View Details
        </Link>

        <Link
          href={getBookingPawReportHref(booking.id)}
          className="inline-flex min-h-[46px] items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-black text-sky-900 transition hover:bg-sky-100"
        >
          View Live PawReport
        </Link>

        <Link
          href={routes.messages}
          className="inline-flex min-h-[46px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
        >
          Message Guru
        </Link>

        <Link
          href={routes.findGuru}
          className="inline-flex min-h-[46px] items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
        >
          Rebook
        </Link>

        <Link
          href={routes.adminMessages}
          className="inline-flex min-h-[46px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
        >
          Get Help
        </Link>
      </div>
    </article>
  );
}

export default function CustomerDashboardPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pawReportSummaries, setPawReportSummaries] = useState<
    PawReportSummary[]
  >([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [authUserId, setAuthUserId] = useState("");
  const [referralProfile, setReferralProfile] =
    useState<ReferralProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("there");
  const [customerProfile, setCustomerProfile] =
    useState<CustomerProfile | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] =
    useState<CustomerProfileForm>(initialProfileForm);
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [showPetForm, setShowPetForm] = useState(false);
  const [savingPet, setSavingPet] = useState(false);
  const [petForm, setPetForm] = useState(initialPetForm);
  const [formError, setFormError] = useState("");
  const [referralMessage, setReferralMessage] = useState("");
  const [showBookingCelebration, setShowBookingCelebration] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [customerPhotoFailed, setCustomerPhotoFailed] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarMessage, setAvatarMessage] = useState("");
  const [uploadingPetMedia, setUploadingPetMedia] =
    useState<UploadingPetMedia | null>(null);
  const [petMediaError, setPetMediaError] = useState("");
  const [petMediaMessage, setPetMediaMessage] = useState("");
  const [nearbyGurus, setNearbyGurus] = useState<NearbyGuru[]>([]);
  const [careZip, setCareZip] = useState("");
  const [careZipInput, setCareZipInput] = useState("");
  const [careLocationLabel, setCareLocationLabel] = useState("");
  const [nearbyGuruMessage, setNearbyGuruMessage] = useState("");
  const [loadingNearbyGurus, setLoadingNearbyGurus] = useState(false);
  const [universityProgress, setUniversityProgress] =
    useState<UniversityProgress>(defaultUniversityProgress);

  const customerAvatarSrc =
    customerProfile?.avatar_url?.trim() || CUSTOMER_PROFILE_PHOTO_SRC;

  const showCustomerProfilePhoto =
    Boolean(customerAvatarSrc) && !customerPhotoFailed;

  const customerReferralLink = useMemo(() => {
    if (!referralProfile?.referral_code) return "https://sitguru.com/signup";
    return buildCustomerReferralLink(referralProfile.referral_code);
  }, [referralProfile]);

  const guruReferralLink = useMemo(() => {
    if (!referralProfile?.referral_code)
      return "https://sitguru.com/become-a-guru";
    return buildGuruReferralLink(referralProfile.referral_code);
  }, [referralProfile]);

  const referralCode = referralProfile?.referral_code || "COMMUNITY";

  const profileCompletion = useMemo(() => {
    const fields = [
      customerProfile?.full_name || customerProfile?.first_name,
      customerProfile?.email,
      customerProfile?.phone,
      customerProfile?.service_address,
      customerProfile?.emergency_contact,
      customerProfile?.care_preferences,
    ];

    const completedFields = fields.filter((field) => field?.trim()).length;
    return Math.round((completedFields / fields.length) * 100);
  }, [customerProfile]);

  const loadDashboard = useCallback(async () => {
    setFormError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace(routes.login);
      return;
    }

    const [
      profileData,
      bookingsData,
      petsData,
      referralData,
      universityProgressData,
      pawReportSummaryData,
    ] = await Promise.all([
      fetchCustomerProfile(user),
      fetchBookingsForUser(user.id, user.email),
      fetchPetsForUser(user.id),
      getOrCreateReferralProfile(user.id),
      fetchCustomerUniversityProgress(),
      fetchCustomerPawReportSummaries(),
    ]);

    const dashboardCareZip = getLatestCareZip(bookingsData, profileData);

    setCustomerProfile(profileData);
    setProfileForm(customerProfileToForm(profileData));
    setFirstName(getSafeFirstName(profileData, user.email));
    setAuthUserId(user.id);
    setBookings(bookingsData);
    setPawReportSummaries(pawReportSummaryData);
    setPets(petsData);
    setReferralProfile(referralData);
    setUniversityProgress(universityProgressData);
    setCareZip(dashboardCareZip);
    setCareZipInput(dashboardCareZip);

    if (dashboardCareZip) {
      setLoadingNearbyGurus(true);
      const nearbyResult =
        await fetchNearbyGurusForCareLocation(dashboardCareZip);

      setNearbyGurus(nearbyResult.gurus);
      setCareLocationLabel(
        nearbyResult.location
          ? `${nearbyResult.location.city}, ${nearbyResult.location.state}`
          : "",
      );
      setNearbyGuruMessage(nearbyResult.message);
      setLoadingNearbyGurus(false);
    } else {
      setNearbyGurus([]);
      setCareLocationLabel("");
      setNearbyGuruMessage(
        "Add a ZIP code to your service address or enter a care ZIP below to see Gurus near that location.",
      );
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        await loadDashboard();
      } finally {
        if (!active) return;
      }
    }

    run();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace(routes.login);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadDashboard, router]);

  useEffect(() => {
    setCustomerPhotoFailed(false);
  }, [customerAvatarSrc]);

  useEffect(() => {
    if (loading) return;

    let active = true;

    async function refreshLiveCare() {
      const summaries = await fetchCustomerPawReportSummaries();

      if (!active) return;

      setPawReportSummaries(summaries);
    }

    refreshLiveCare();

    const interval = window.setInterval(refreshLiveCare, 10000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [loading]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookingStatus = params.get("booking");

    if (bookingStatus !== "confirmed" && bookingStatus !== "created") return;

    const bookingId =
      params.get("booking_id") || params.get("session_id") || "recent";
    const celebrationKey = `sitguru-booking-celebration-${bookingId}`;

    if (window.sessionStorage.getItem(celebrationKey)) return;

    window.sessionStorage.setItem(celebrationKey, "shown");
    setConfettiPieces(createConfettiPieces());
    setShowBookingCelebration(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

    const hideTimer = window.setTimeout(() => {
      setShowBookingCelebration(false);
    }, 6500);

    return () => {
      window.clearTimeout(hideTimer);
    };
  }, []);

  const upcomingBookings = useMemo(
    () =>
      bookings
        .filter(isUpcomingBooking)
        .sort(
          (a, b) =>
            new Date(getBookingDisplayDate(a) || 0).getTime() -
            new Date(getBookingDisplayDate(b) || 0).getTime(),
        ),
    [bookings],
  );

  const recentBookings = useMemo(
    () =>
      bookings
        .slice()
        .sort(
          (a, b) =>
            new Date(getBookingDisplayDate(b) || 0).getTime() -
            new Date(getBookingDisplayDate(a) || 0).getTime(),
        ),
    [bookings],
  );

  const latestBooking = recentBookings[0] || null;

  const pawReportMap = useMemo(() => {
    return new Map(
      pawReportSummaries.map((summary) => [summary.booking_id, summary]),
    );
  }, [pawReportSummaries]);

  const liveCareBookings = useMemo(() => {
    return recentBookings
      .filter((booking) => {
        const summary = pawReportMap.get(booking.id);

        return Boolean(
          summary &&
          (summary.status === "in_progress" ||
            summary.active_walk_status === "in_progress" ||
            summary.update_count > 0),
        );
      })
      .slice(0, 3);
  }, [pawReportMap, recentBookings]);

  const stats = useMemo(() => {
    const pending = bookings.filter((booking) =>
      ["pending", "requested"].includes(booking.status.toLowerCase()),
    ).length;

    const confirmed = bookings.filter(
      (booking) =>
        ["confirmed", "paid", "checkout_started"].includes(
          booking.status.toLowerCase(),
        ) ||
        ["paid", "checkout_started"].includes(
          booking.payment_status.toLowerCase(),
        ),
    ).length;

    const totalTips = bookings.reduce(
      (sum, booking) => sum + booking.tip_amount,
      0,
    );
    const totalSpent = bookings.reduce(
      (sum, booking) =>
        sum + (booking.total_customer_paid || booking.subtotal_amount || 0),
      0,
    );

    return {
      total: bookings.length,
      upcoming: upcomingBookings.length,
      pending,
      confirmed,
      pets: pets.length,
      totalTips,
      totalSpent,
      nextBooking: upcomingBookings[0],
    };
  }, [bookings, pets, upcomingBookings]);

  const nextBookingLabel = useMemo(() => {
    if (!stats.nextBooking) return "No upcoming booking";
    return formatShortDate(getBookingDisplayDate(stats.nextBooking));
  }, [stats.nextBooking]);

  async function refreshNearbyGurusForZip(nextZip: string) {
    const cleanZip = cleanZipCode(nextZip);

    setCareZipInput(cleanZip);

    if (cleanZip.length !== 5) {
      setCareZip(cleanZip);
      setNearbyGurus([]);
      setCareLocationLabel("");
      setNearbyGuruMessage(
        "Enter a valid 5-digit care ZIP code to see nearby Gurus.",
      );
      return;
    }

    setLoadingNearbyGurus(true);
    setNearbyGuruMessage("");

    const nearbyResult = await fetchNearbyGurusForCareLocation(cleanZip);

    setCareZip(cleanZip);
    setNearbyGurus(nearbyResult.gurus);
    setCareLocationLabel(
      nearbyResult.location
        ? `${nearbyResult.location.city}, ${nearbyResult.location.state}`
        : "",
    );
    setNearbyGuruMessage(nearbyResult.message);
    setLoadingNearbyGurus(false);
  }

  async function handleCareZipSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await refreshNearbyGurusForZip(careZipInput);
  }

  async function handleCustomerAvatarUpload(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploadingAvatar(true);
    setAvatarError("");
    setAvatarMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace(routes.login);
      return;
    }

    try {
      const publicUrl = await uploadCustomerProfilePhoto(user.id, file);
      await saveCustomerProfilePhotoUrl(user.id, publicUrl);

      const refreshedProfile = await fetchCustomerProfile(user);
      const profileWithPhoto = refreshedProfile.avatar_url
        ? refreshedProfile
        : { ...refreshedProfile, avatar_url: publicUrl };

      setCustomerProfile(profileWithPhoto);
      setProfileForm(customerProfileToForm(profileWithPhoto));
      setFirstName(getSafeFirstName(profileWithPhoto, user.email));
      setCustomerPhotoFailed(false);
      setAvatarMessage("Profile picture updated.");
    } catch (error) {
      setAvatarError(
        error instanceof Error
          ? error.message
          : "We could not upload your profile picture right now.",
      );
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  }

  async function handlePetMediaUpload(
    event: ChangeEvent<HTMLInputElement>,
    pet: Pet,
    kind: PetMediaKind,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploadingPetMedia({ petId: pet.id, kind });
    setPetMediaError("");
    setPetMediaMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace(routes.login);
      return;
    }

    try {
      const publicUrl = await uploadPetMedia(user.id, pet.id, file, kind);
      await savePetMediaUrl(pet.id, kind, publicUrl);

      setPets((currentPets) =>
        currentPets.map((currentPet) =>
          currentPet.id === pet.id
            ? {
                ...currentPet,
                photo_url: kind === "photo" ? publicUrl : currentPet.photo_url,
                video_url: kind === "video" ? publicUrl : currentPet.video_url,
              }
            : currentPet,
        ),
      );

      setPetMediaMessage(
        `${pet.name}'s ${kind === "photo" ? "photo" : "video"} was uploaded.`,
      );
    } catch (error) {
      setPetMediaError(
        error instanceof Error
          ? error.message
          : `We could not upload ${pet.name}'s ${kind} right now.`,
      );
    } finally {
      setUploadingPetMedia(null);
      event.target.value = "";
    }
  }

  async function handleSaveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError("");
    setProfileMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace(routes.login);
      return;
    }

    try {
      const savedLevel = await saveCustomerProfile(user.id, profileForm);
      const refreshedProfile = await fetchCustomerProfile(user);

      setCustomerProfile(refreshedProfile);
      setProfileForm(customerProfileToForm(refreshedProfile));
      setFirstName(getSafeFirstName(refreshedProfile, user.email));
      setShowProfileForm(false);
      setProfileMessage(
        savedLevel === "basic"
          ? "Basic profile saved. Contact and preference fields will appear once your profiles table includes those columns."
          : "Pet Parent profile saved.",
      );
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : "We could not save your profile right now.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function copyReferralLink(link: string, label: string) {
    setReferralMessage("");

    try {
      await navigator.clipboard.writeText(link);
      setReferralMessage(`${label} copied. Share it with your community.`);
    } catch {
      setReferralMessage(
        "We could not copy the link. Please copy it manually.",
      );
    }
  }

  async function handleAddPet(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingPet(true);
    setFormError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace(routes.login);
      return;
    }

    if (!petForm.name.trim()) {
      setFormError("Pet name is required.");
      setSavingPet(false);
      return;
    }

    const ownerPayload = {
      owner_id: user.id,
      name: petForm.name.trim(),
      species: petForm.species.trim() || null,
      breed: petForm.breed.trim() || null,
      age: petForm.age.trim() || null,
      weight: petForm.weight.trim() || null,
      temperament: petForm.temperament.trim() || null,
      medications: petForm.medications.trim() || null,
      notes: petForm.notes.trim() || null,
      photo_url: petForm.photo_url.trim() || null,
      video_url: petForm.video_url.trim() || null,
    };

    const { error: ownerError } = await supabase
      .from("pets")
      .insert(ownerPayload);

    if (ownerError) {
      const userPayload = {
        user_id: user.id,
        name: petForm.name.trim(),
        species: petForm.species.trim() || null,
        breed: petForm.breed.trim() || null,
        age: petForm.age.trim() || null,
        weight: petForm.weight.trim() || null,
        temperament: petForm.temperament.trim() || null,
        medications: petForm.medications.trim() || null,
        notes: petForm.notes.trim() || null,
        photo_url: petForm.photo_url.trim() || null,
        video_url: petForm.video_url.trim() || null,
      };

      const { error: userIdError } = await supabase
        .from("pets")
        .insert(userPayload);

      if (userIdError) {
        setFormError(
          userIdError.message || "We could not save your pet profile.",
        );
        setSavingPet(false);
        return;
      }
    }

    setPetForm(initialPetForm);
    setShowPetForm(false);
    await loadDashboard();
    setSavingPet(false);
  }

  const customerDisplayName = useMemo(() => {
    return (
      customerProfile?.full_name?.trim() ||
      customerProfile?.first_name?.trim() ||
      firstName
    );
  }, [customerProfile, firstName]);

  const customerInitials = useMemo(
    () => getCustomerInitials(customerProfile),
    [customerProfile],
  );

  const featuredCareBooking =
    liveCareBookings[0] || stats.nextBooking || latestBooking || null;

  const featuredPawReport = featuredCareBooking
    ? pawReportMap.get(featuredCareBooking.id) || null
    : null;

  const isCareLive = Boolean(
    featuredPawReport &&
      (featuredPawReport.status === "in_progress" ||
        featuredPawReport.active_walk_status === "in_progress"),
  );

  const dashboardUpdates = useMemo(() => {
    const updates: Array<{
      label: string;
      detail: string;
      href: string;
      tone: "emerald" | "sky" | "amber" | "slate";
    }> = [];

    const activeBooking = liveCareBookings[0];
    const activeSummary = activeBooking
      ? pawReportMap.get(activeBooking.id) || null
      : null;

    if (activeBooking && activeSummary) {
      updates.push({
        label: getLatestPawReportLabel(activeSummary),
        detail: `${activeBooking.pet_name || "Your pet"} • ${formatLiveUpdateTime(
          activeSummary.latest_update_at,
        )}`,
        href: getBookingPawReportHref(activeBooking.id),
        tone: "sky",
      });
    }

    if (stats.nextBooking) {
      updates.push({
        label: "Next care",
        detail: `${stats.nextBooking.pet_name || "Pet care"} • ${formatShortDate(
          getBookingDisplayDate(stats.nextBooking),
        )}`,
        href: getBookingDetailHref(stats.nextBooking.id),
        tone: "emerald",
      });
    }

    if ((referralProfile?.pending_rewards ?? 0) > 0) {
      updates.push({
        label: "PawPerks pending",
        detail: `${formatMoney(
          referralProfile?.pending_rewards ?? 0,
          true,
        )} pending`,
        href: routes.pawPerks,
        tone: "amber",
      });
    }

    if (profileCompletion < 100) {
      updates.push({
        label: "Profile update",
        detail: `${profileCompletion}% complete`,
        href: routes.profile,
        tone: "slate",
      });
    }

    if (!universityProgress.isComplete) {
      updates.push({
        label: "Academy progress",
        detail: `${universityProgress.completedSteps}/${universityProgress.totalSteps} steps`,
        href: routes.university,
        tone: "slate",
      });
    }

    if (updates.length === 0) {
      updates.push({
        label: "You are all caught up",
        detail: "Nothing needs attention right now.",
        href: routes.dashboard,
        tone: "emerald",
      });
    }

    return updates.slice(0, 3);
  }, [
    liveCareBookings,
    pawReportMap,
    stats.nextBooking,
    referralProfile?.pending_rewards,
    profileCompletion,
    universityProgress.completedSteps,
    universityProgress.isComplete,
    universityProgress.totalSteps,
  ]);

  if (loading) {
    return (
      <main
        className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f7fffb_45%,#ecfdf5_100%)] px-4 py-10 md:px-6 lg:px-8"
      >
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
          <div className="w-full max-w-md rounded-[2rem] border border-emerald-100 bg-white p-7 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-emerald-50 text-3xl ring-1 ring-emerald-100">
              🐾
            </div>
            <p className="mt-5 text-lg font-black text-slate-950">
              Getting your pet care hub ready
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Loading pets, bookings, PawReports, Gurus, and PawPerks.
            </p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-emerald-50">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      {showBookingCelebration ? (
        <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
          <style>{`
            @keyframes sitguru-confetti-fall {
              0% { transform: translate3d(0, -20vh, 0) rotate(0deg); opacity: 1; }
              70% { opacity: 1; }
              100% { transform: translate3d(0, 110vh, 0) rotate(720deg); opacity: 0; }
            }
            @keyframes sitguru-success-pop {
              0% { transform: translateY(-18px) scale(0.96); opacity: 0; }
              100% { transform: translateY(0) scale(1); opacity: 1; }
            }
          `}</style>

          {confettiPieces.map((piece) => (
            <span
              key={piece.id}
              className="absolute top-0 rounded-sm"
              style={{
                left: `${piece.left}%`,
                width: `${piece.size}px`,
                height: `${piece.size * 1.5}px`,
                backgroundColor: piece.color,
                transform: `rotate(${piece.rotate}deg)`,
                animation: `sitguru-confetti-fall ${piece.duration}s linear ${piece.delay}s forwards`,
              }}
            />
          ))}

          <div className="absolute left-1/2 top-6 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-[2rem] border border-emerald-200 bg-white/95 p-5 text-center shadow-2xl backdrop-blur">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-3xl shadow-lg"
              style={{
                animation: "sitguru-success-pop 0.35s ease-out forwards",
              }}
            >
              🎉
            </div>
            <p className="mt-3 text-xl font-black tracking-tight text-slate-950">
              Booking confirmed!
            </p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              Your booking and care updates are now organized here.
            </p>
          </div>
        </div>
      ) : null}

      <main
        className="min-h-screen bg-[linear-gradient(180deg,#fffdf8_0%,#ffffff_34%,#f2fff8_100%)] pb-24 text-slate-950 md:pb-10"
      >
        <Header />

        <div className="mx-auto max-w-7xl px-3 py-4 sm:px-5 md:py-6 lg:px-8">
          <section className="relative overflow-hidden rounded-[2rem] border border-emerald-200 bg-white shadow-[0_20px_70px_rgba(15,118,110,0.10)] sm:rounded-[2.4rem]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(52,211,153,0.22),transparent_30%),radial-gradient(circle_at_92%_12%,rgba(251,191,36,0.18),transparent_26%),linear-gradient(135deg,#ecfdf5_0%,#ffffff_54%,#fff7ed_100%)]" />
            <div className="relative grid gap-5 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-center lg:px-10 lg:py-9">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800 ring-1 ring-emerald-200">
                    Pet Parent Home
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[11px] font-black text-emerald-800 ring-1 ring-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Updates live
                  </span>
                </div>

                <h1 className="mt-4 text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">
                  Hey, {firstName} <span aria-hidden="true">👋</span>
                </h1>
                <p className="mt-3 max-w-2xl text-base font-bold leading-7 text-slate-700 sm:text-lg">
                  Care, updates, pets, and rewards—one tap away.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
                  <Link
                    href={routes.findGuru}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700"
                  >
                    Find Care
                  </Link>
                  <Link
                    href={routes.bookings}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                  >
                    My Bookings
                  </Link>
                  <Link
                    href={routes.messages}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-50"
                  >
                    My Messages
                  </Link>
                  <Link
                    href={routes.pets}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-50"
                  >
                    My Pets
                  </Link>
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-white bg-white/90 p-4 shadow-xl ring-1 ring-emerald-100 backdrop-blur sm:p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] bg-emerald-50 text-2xl font-black text-emerald-700 ring-1 ring-emerald-100">
                    {showCustomerProfilePhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={customerAvatarSrc}
                        alt={`${customerDisplayName} profile photo`}
                        onError={() => setCustomerPhotoFailed(true)}
                        className="h-full w-full object-cover object-center"
                      />
                    ) : (
                      customerInitials
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xl font-black text-slate-950">
                      {customerDisplayName}
                    </p>
                    <p className="mt-1 text-sm font-bold text-emerald-700">
                      Pet Parent • {profileCompletion}% ready
                    </p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                      {getCustomerLocationLabel(customerProfile) || "Add care location"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <Link
                    href={routes.pets}
                    className="rounded-2xl bg-emerald-50 p-3 text-center ring-1 ring-emerald-100 transition hover:bg-emerald-100"
                  >
                    <p className="text-xl font-black text-slate-950">{pets.length}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">Pets</p>
                  </Link>
                  <Link
                    href={routes.bookings}
                    className="rounded-2xl bg-sky-50 p-3 text-center ring-1 ring-sky-100 transition hover:bg-sky-100"
                  >
                    <p className="text-xl font-black text-slate-950">{upcomingBookings.length}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-sky-700">Upcoming</p>
                  </Link>
                  <Link
                    href={routes.pawPerks}
                    className="rounded-2xl bg-amber-100 p-3 text-center ring-1 ring-amber-200 transition hover:bg-amber-200"
                  >
                    <p className="text-xl font-black text-slate-950">
                      {formatMoney(referralProfile?.available_credit ?? 0)}
                    </p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-amber-800">PawPerks</p>
                  </Link>
                </div>
              </div>
            </div>
          </section>
          <NearbyGurusCarousel
            gurus={nearbyGurus}
            careZip={careZip}
            careLocationLabel={careLocationLabel}
            careZipInput={careZipInput}
            loading={loadingNearbyGurus}
            message={nearbyGuruMessage}
            onCareZipInputChange={(value) =>
              setCareZipInput(cleanZipCode(value))
            }
            onCareZipSubmit={handleCareZipSubmit}
          />

          <section className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <article className="overflow-hidden rounded-[2rem] border border-sky-100 bg-white shadow-sm">
              <div className="grid gap-5 bg-[radial-gradient(circle_at_92%_4%,rgba(125,211,252,0.28),transparent_28%),linear-gradient(135deg,#f0f9ff_0%,#ffffff_52%,#ecfdf5_100%)] p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-sky-800">
                      Care Pulse
                    </span>
                    {isCareLive ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-rose-700 ring-1 ring-rose-100">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
                        Live now
                      </span>
                    ) : null}
                  </div>

                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    {isCareLive
                      ? "Care is live now"
                      : stats.nextBooking
                        ? "Next care is ready"
                        : latestBooking
                          ? "Recent care at a glance"
                          : "Ready for care"}
                  </h2>

                  {featuredCareBooking ? (
                    <>
                      <p className="mt-3 text-base font-bold leading-7 text-slate-700">
                        {getBookingCareSummary(featuredCareBooking)}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
                        <span className="rounded-full bg-white px-3 py-2 text-slate-700 ring-1 ring-slate-200">
                          {formatDate(getBookingDisplayDate(featuredCareBooking))}
                        </span>
                        <span className="rounded-full bg-white px-3 py-2 text-slate-700 ring-1 ring-slate-200">
                          {featuredCareBooking.time_window ||
                            formatTime(getBookingDisplayDate(featuredCareBooking))}
                        </span>
                        <span className="rounded-full bg-white px-3 py-2 text-slate-700 ring-1 ring-slate-200">
                          {formatStatus(featuredCareBooking.status)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-600 sm:text-base">
                      Find a trusted Guru when your pet needs care.
                    </p>
                  )}

                  {featuredPawReport ? (
                    <div className="mt-5 grid gap-2 sm:grid-cols-4">
                      <div className="rounded-2xl bg-white p-3 ring-1 ring-sky-100">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-sky-700">
                          Updates
                        </p>
                        <p className="mt-1 text-lg font-black text-slate-950">
                          {featuredPawReport.update_count}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white p-3 ring-1 ring-sky-100">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-sky-700">
                          Photos
                        </p>
                        <p className="mt-1 text-lg font-black text-slate-950">
                          {featuredPawReport.photo_count}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white p-3 ring-1 ring-sky-100">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-sky-700">
                          Walk
                        </p>
                        <p className="mt-1 text-lg font-black text-slate-950">
                          {formatPawReportDistance(
                            featuredPawReport.active_walk_distance_meters,
                          )}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white p-3 ring-1 ring-sky-100">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-sky-700">
                          Latest
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-950">
                          {formatLiveUpdateTime(
                            featuredPawReport.latest_update_at,
                          )}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-3">
                    {featuredCareBooking ? (
                      <>
                        <Link
                          href={getBookingPawReportHref(featuredCareBooking.id)}
                          className="inline-flex min-h-[46px] items-center justify-center rounded-2xl bg-sky-600 px-5 text-sm font-black text-white transition hover:bg-sky-700"
                        >
                          {isCareLive ? "Follow Live PawReport" : "View PawReport"}
                        </Link>
                        <Link
                          href={getBookingDetailHref(featuredCareBooking.id)}
                          className="inline-flex min-h-[46px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-900 transition hover:bg-slate-50"
                        >
                          Booking Details
                        </Link>
                        <Link
                          href={routes.messages}
                          className="inline-flex min-h-[46px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-900 transition hover:bg-slate-50"
                        >
                          Message Guru
                        </Link>
                      </>
                    ) : (
                      <Link
                        href={routes.findGuru}
                        className="inline-flex min-h-[46px] items-center justify-center rounded-2xl bg-emerald-600 px-6 text-sm font-black text-white transition hover:bg-emerald-700"
                      >
                        Find Care
                      </Link>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-white bg-white/90 p-4 shadow-sm ring-1 ring-sky-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
                      {featuredCareBooking
                        ? (() => {
                            const matchedPet = findPetForBooking(
                              featuredCareBooking,
                              pets,
                            );
                            return matchedPet?.photo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={matchedPet.photo_url}
                                alt={matchedPet.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <PawIcon className="h-6 w-6 text-emerald-600" />
                            );
                          })()
                        : <PawIcon className="h-6 w-6 text-emerald-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {featuredCareBooking?.pet_name || "Your pet care hub"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {featuredCareBooking?.guru_name
                          ? `With ${featuredCareBooking.guru_name}`
                          : "Care in one place"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                      Next best action
                    </p>
                    <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                      {isCareLive
                        ? "Follow live updates."
                        : stats.nextBooking
                          ? "Review details before care."
                          : latestBooking
                            ? "View the PawReport or book again."
                            : "Find a Guru when you need care."}
                    </p>
                  </div>
                </div>
              </div>
            </article>

            <article className="overflow-hidden rounded-[2rem] border border-amber-200 bg-white shadow-sm">
              <div className="relative h-full bg-[radial-gradient(circle_at_88%_0%,rgba(251,191,36,0.28),transparent_34%),linear-gradient(145deg,#fffbeb_0%,#ffffff_56%,#ecfdf5_100%)] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                      PawPerks
                    </p>
                    <p className="mt-2 text-5xl font-black tracking-tight text-slate-950">
                      {formatMoney(referralProfile?.available_credit ?? 0, true)}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-600">
                      Available credit
                    </p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-200 text-2xl shadow-sm ring-1 ring-amber-300">
                    🎁
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-white p-3 ring-1 ring-amber-100">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">Pending</p>
                    <p className="mt-1 text-xl font-black text-slate-950">
                      {formatMoney(referralProfile?.pending_rewards ?? 0, true)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-3 ring-1 ring-emerald-100">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">Referrals</p>
                    <p className="mt-1 text-xl font-black text-slate-950">
                      {referralProfile?.completed_referrals ?? 0}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-white p-3 ring-1 ring-amber-100">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">Your code</p>
                  <p className="mt-1 break-all text-base font-black text-slate-950">{referralCode}</p>
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <Link
                    href={routes.pawPerks}
                    className="inline-flex min-h-[46px] items-center justify-center rounded-2xl bg-amber-300 px-4 text-sm font-black text-slate-950 transition hover:bg-amber-200"
                  >
                    View Rewards
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      copyReferralLink(customerReferralLink, "Pet Parent referral link")
                    }
                    className="inline-flex min-h-[46px] items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
                  >
                    Invite Friends
                  </button>
                </div>

                {referralMessage ? (
                  <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-bold leading-5 text-emerald-800 ring-1 ring-emerald-100">
                    {referralMessage}
                  </div>
                ) : null}
              </div>
            </article>
          </section>

          <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              {
                label: "Find Care",
                helper: "Nearby Gurus",
                href: routes.findGuru,
                icon: <PawIcon className="h-5 w-5" />,
              },
              {
                label: "My Bookings",
                helper: `${stats.upcoming} upcoming`,
                href: routes.bookings,
                icon: <CalendarDays className="h-5 w-5" />,
              },
              {
                label: "My Messages",
                helper: "Open inbox",
                href: routes.messages,
                icon: <MessageCircle className="h-5 w-5" />,
              },
              {
                label: "My Pets",
                helper: `${pets.length} pets`,
                href: routes.pets,
                icon: <PawIcon className="h-5 w-5" />,
              },
              {
                label: "My PawPerks",
                helper: formatMoney(referralProfile?.available_credit ?? 0),
                href: routes.pawPerks,
                icon: <Star className="h-5 w-5" />,
              },
              {
                label: "My Profile",
                helper: `${profileCompletion}% ready`,
                href: routes.profile,
                icon: <ShieldCheck className="h-5 w-5" />,
              },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 transition group-hover:bg-emerald-100">
                  {action.icon}
                </div>
                <p className="mt-3 text-sm font-black text-slate-950">
                  {action.label}
                </p>
                <p className="mt-1 text-[11px] font-bold text-slate-500">
                  {action.helper}
                </p>
              </Link>
            ))}
          </section>

          {authUserId ? (
            <section className="mt-4">
              <MultiPetProfileCenter
                parent={{
                  userId: authUserId,
                  displayName: customerDisplayName,
                  email: customerProfile?.email ?? null,
                  phone: customerProfile?.phone ?? null,
                  zip: careZip || null,
                  profileCompletion,
                }}
                onPetsChange={(rows) => {
                  setPets(
                    rows.map((pet) => ({
                      id: pet.id,
                      name: pet.name,
                      species: pet.species,
                      breed: pet.breed,
                      age: pet.age,
                      size: pet.size,
                      weight: pet.weight,
                      temperament: pet.temperament,
                      medical_notes: pet.medical_notes,
                      medications: pet.medical_notes,
                      notes: pet.notes,
                      photo_url: pet.photo_url,
                      video_url: pet.video_url,
                    })),
                  );
                }}
              />
            </section>
          ) : null}

          <section className="mt-4 grid gap-4 lg:grid-cols-1">
            <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">
                    Updates
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                    My Updates
                  </h2>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-sky-700 ring-1 ring-sky-100">
                  Live
                </span>
              </div>

              <div className="mt-5 grid gap-3">
                {dashboardUpdates.map((update) => {
                  const toneClasses = {
                    emerald:
                      "border-emerald-100 bg-emerald-50 text-emerald-700",
                    sky: "border-sky-100 bg-sky-50 text-sky-700",
                    amber: "border-amber-100 bg-amber-50 text-amber-700",
                    slate: "border-slate-200 bg-slate-50 text-slate-700",
                  }[update.tone];

                  return (
                    <Link
                      key={`${update.label}-${update.detail}`}
                      href={update.href}
                      className={`group rounded-[1.35rem] border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${toneClasses}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 ring-1 ring-black/5">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-slate-950">
                            {update.label}
                          </p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                            {update.detail}
                          </p>
                        </div>
                        <span className="text-sm font-black transition group-hover:translate-x-0.5">
                          →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <Link
                  href={routes.messages}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-slate-950 px-4 text-xs font-black text-white transition hover:bg-slate-800"
                >
                  Messages
                </Link>
                <Link
                  href={routes.adminMessages}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-800 transition hover:bg-slate-50"
                >
                  Support
                </Link>
              </div>
            </article>
          </section>

          <section className="mt-4 rounded-[2rem] border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  Care schedule
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  My Upcoming Care
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Everything for the next visit, in one place.
                </p>
              </div>
              <Link
                href={routes.findGuru}
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700"
              >
                Find Care
              </Link>
            </div>

            {upcomingBookings.length === 0 ? (
              <div className="mt-5 rounded-[1.7rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-7 text-center">
                <Sparkles className="mx-auto h-9 w-9 text-emerald-600" />
                <p className="mt-3 text-lg font-black text-slate-950">
                  No upcoming bookings yet
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  New bookings will appear here.
                </p>
                <Link
                  href={routes.findGuru}
                  className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  Find a Guru
                </Link>
              </div>
            ) : (
              <div className="mt-5 grid gap-4">
                {upcomingBookings.slice(0, 3).map((booking, index) => {
                  const matchedPet = findPetForBooking(booking, pets);
                  return (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      featured={index === 0}
                      petPhotoUrl={matchedPet?.photo_url || null}
                      pawReportSummary={pawReportMap.get(booking.id) || null}
                    />
                  );
                })}
              </div>
            )}
          </section>


          <section className="mt-4 grid gap-4 lg:grid-cols-2">
            <article className="rounded-[2rem] border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    My Profile
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                    My Profile · {profileCompletion}% ready
                  </h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    Keep contact and care details current.
                  </p>
                </div>
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.3rem] bg-emerald-50 text-lg font-black text-emerald-700 ring-1 ring-emerald-100">
                  {showCustomerProfilePhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={customerAvatarSrc}
                      alt={`${customerDisplayName} profile photo`}
                      onError={() => setCustomerPhotoFailed(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    customerInitials
                  )}
                </div>
              </div>

              <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-emerald-50 ring-1 ring-emerald-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>

              {profileMessage ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                  {profileMessage}
                </div>
              ) : null}
              {profileError ? (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {profileError}
                </div>
              ) : null}
              {avatarMessage ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                  {avatarMessage}
                </div>
              ) : null}
              {avatarError ? (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {avatarError}
                </div>
              ) : null}

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {[
                  ["Phone", getDisplayValue(customerProfile?.phone)],
                  [
                    "Service location",
                    getDisplayValue(customerProfile?.service_address),
                  ],
                  [
                    "Emergency contact",
                    getDisplayValue(customerProfile?.emergency_contact),
                  ],
                  [
                    "Care preferences",
                    getDisplayValue(customerProfile?.care_preferences),
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                      {label}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-800">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setProfileError("");
                    setProfileMessage("");
                    setProfileForm(customerProfileToForm(customerProfile));
                    setShowProfileForm((value) => !value);
                  }}
                  className="inline-flex min-h-[42px] items-center justify-center rounded-2xl bg-emerald-600 px-4 text-xs font-black text-white transition hover:bg-emerald-700"
                >
                  {showProfileForm ? "Close Form" : "Edit Profile"}
                </button>
                <label className="inline-flex min-h-[42px] cursor-pointer items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-black text-emerald-800 transition hover:bg-emerald-100">
                  {uploadingAvatar ? "Uploading..." : "Update Photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    disabled={uploadingAvatar}
                    onChange={handleCustomerAvatarUpload}
                    className="sr-only"
                  />
                </label>
                <Link
                  href={routes.accountSecurity}
                  className="inline-flex min-h-[42px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-800 transition hover:bg-slate-50"
                >
                  Account Security
                </Link>
              </div>

              {showProfileForm ? (
                <form
                  onSubmit={handleSaveProfile}
                  className="mt-5 grid gap-3 rounded-[1.6rem] bg-slate-50 p-4 ring-1 ring-slate-200"
                >
                  <input
                    type="text"
                    placeholder="Full name"
                    value={profileForm.full_name}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        full_name: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-500"
                  />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, phone: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Home or service address"
                    value={profileForm.service_address}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        service_address: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Emergency contact"
                    value={profileForm.emergency_contact}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        emergency_contact: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-500"
                  />
                  <textarea
                    placeholder="Care preferences, access notes, or communication preferences"
                    rows={4}
                    value={profileForm.care_preferences}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        care_preferences: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex min-h-[46px] items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {savingProfile ? "Saving profile..." : "Save Pet Parent Profile"}
                  </button>
                </form>
              ) : null}
            </article>

            <article className="overflow-hidden rounded-[2rem] border border-sky-100 bg-white shadow-sm">
              <div className="h-full bg-[radial-gradient(circle_at_90%_0%,rgba(56,189,248,0.24),transparent_28%),linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#ecfdf5_100%)] p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg">
                    <GraduationCap className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">
                      My Academy
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                      My Academy
                    </h2>
                  </div>
                </div>

                <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
                  Quick lessons for safer, smoother bookings.
                </p>

                <div className="mt-5 rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-sky-100">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-sky-700">
                        Progress
                      </p>
                      <p className="mt-1 text-3xl font-black text-slate-950">
                        {universityProgress.progressPercent}%
                      </p>
                    </div>
                    <p className="text-right text-xs font-bold text-slate-500">
                      {universityProgress.completedSteps} of {universityProgress.totalSteps} steps
                    </p>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-sky-50">
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{ width: `${universityProgress.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Link
                    href={routes.university}
                    className="inline-flex min-h-[46px] items-center justify-center rounded-2xl bg-slate-950 px-4 text-xs font-black text-white transition hover:bg-slate-800"
                  >
                    {universityProgress.academyButtonLabel}
                  </Link>
                  <Link
                    href={routes.adminMessages}
                    className="inline-flex min-h-[46px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-800 transition hover:bg-slate-50"
                  >
                    Ask Support
                  </Link>
                </div>
              </div>
            </article>
          </section>

          <section className="mt-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Recent activity
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  My Recent Care
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Bookings, payments, and tips.
                </p>
              </div>
              <Link
                href={routes.bookings}
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
              >
                My Bookings
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="mt-5 rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50 p-7 text-center">
                <p className="text-lg font-black text-slate-950">No bookings yet</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Your bookings will appear here.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {recentBookings.slice(0, 6).map((booking) => {
                  const matchedPet = findPetForBooking(booking, pets);
                  return (
                    <Link
                      key={booking.id}
                      href={getBookingDetailHref(booking.id)}
                      className="group rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                          {matchedPet?.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={matchedPet.photo_url}
                              alt={matchedPet.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <PawIcon className="h-6 w-6 text-emerald-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-black text-slate-950">
                              {booking.pet_name || "Pet Care"} • {booking.service_type || "Booking"}
                            </p>
                            <span className={`rounded-full px-2.5 py-1 text-[9px] font-black ${getStatusClasses(booking.status)}`}>
                              {formatStatus(booking.status)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            {formatDate(getBookingDisplayDate(booking))}
                          </p>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <span className="text-xs font-black text-emerald-700">
                              {formatStatus(booking.payment_status)}
                            </span>
                            <span className="text-sm font-black text-slate-950">
                              {formatMoney(
                                booking.total_customer_paid || booking.subtotal_amount,
                                true,
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-[1.5rem] border border-slate-200 bg-white/95 p-2 shadow-[0_18px_60px_rgba(15,23,42,0.2)] backdrop-blur md:hidden">
          {[
            { label: "Home", href: routes.dashboard, icon: <PawIcon className="h-5 w-5" /> },
            { label: "Find", href: routes.findGuru, icon: <Sparkles className="h-5 w-5" /> },
            { label: "Care", href: routes.bookings, icon: <CalendarDays className="h-5 w-5" /> },
            { label: "Messages", href: routes.messages, icon: <MessageCircle className="h-5 w-5" /> },
            { label: "Profile", href: routes.profile, icon: <ShieldCheck className="h-5 w-5" /> },
          ].map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-black ${
                index === 0
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-500"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </main>
    </>
  );
}