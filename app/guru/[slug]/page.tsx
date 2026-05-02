import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import GuruProfileAnalytics from "./GuruProfileAnalytics";
import BookThisGuruButton from "./BookThisGuruButton";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    service?: string;
  }>;
};

type GuruRecord = {
  id: string;
  user_id: string | null;
  slug: string | null;
  role: string | null;
  status: string | null;

  full_name: string | null;
  first_name: string | null;
  display_name: string | null;
  business_name: string | null;
  username: string | null;
  public_name: string | null;
  name: string | null;
  email: string | null;
  title: string | null;

  headline: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;

  profile_photo_url: string | null;
  image_url: string | null;
  photo_url: string | null;
  avatar_url: string | null;
  cover_photo_url: string | null;

  hourly_rate: number | null;
  rate: number | null;
  years_experience: number | null;
  experience_years: number | null;
  response_time: string | null;
  rating: number | null;
  rating_avg: number | null;
  review_count: number | null;

  specialties: string[] | null;
  services: string[] | null;
  certifications: string[] | null;

  is_featured: boolean | null;
  is_verified: boolean | null;
  is_public: boolean | null;
  is_active: boolean | null;

  portfolio_images: string[] | null;
  portfolio_videos: string[] | null;
  gallery_images: string[] | null;
  photo_urls: string[] | null;
};

type ServiceKey =
  | "all_services"
  | "drop_in_visit"
  | "house_sitting"
  | "doggy_day_care"
  | "dog_walking";

type PublicAvailabilitySettings = {
  publish_availability: boolean;
  same_day_booking: boolean;
  instant_booking: boolean;
  buffer_minutes: number;
  max_bookings_per_day: number;
};

type PublicWeeklyAvailability = {
  day_key: string;
  day_label: string;
  day_short_label: string;
  enabled: boolean;
  start_time: string;
  end_time: string;
};

type PublicBlackoutDate = {
  blackout_date: string;
  service_key: ServiceKey;
  note: string;
};

type PublicServiceOption = {
  key: ServiceKey;
  label: string;
};

type PublicCalendarCell = {
  iso: string;
  dayNumber: number;
  inMonth: boolean;
  status: "available" | "unavailable" | "closed";
  note?: string;
};

const publicServiceOptions: PublicServiceOption[] = [
  { key: "drop_in_visit", label: "Drop-In Visits" },
  { key: "house_sitting", label: "House Sitting" },
  { key: "doggy_day_care", label: "In-Home Dog Day Care" },
  { key: "dog_walking", label: "Dog Walking" },
];

const publicDefaultWeeklyAvailability: PublicWeeklyAvailability[] = [
  {
    day_key: "monday",
    day_label: "Monday",
    day_short_label: "Mon",
    enabled: true,
    start_time: "09:00",
    end_time: "17:00",
  },
  {
    day_key: "tuesday",
    day_label: "Tuesday",
    day_short_label: "Tue",
    enabled: true,
    start_time: "09:00",
    end_time: "17:00",
  },
  {
    day_key: "wednesday",
    day_label: "Wednesday",
    day_short_label: "Wed",
    enabled: true,
    start_time: "09:00",
    end_time: "17:00",
  },
  {
    day_key: "thursday",
    day_label: "Thursday",
    day_short_label: "Thu",
    enabled: true,
    start_time: "09:00",
    end_time: "17:00",
  },
  {
    day_key: "friday",
    day_label: "Friday",
    day_short_label: "Fri",
    enabled: true,
    start_time: "09:00",
    end_time: "17:00",
  },
  {
    day_key: "saturday",
    day_label: "Saturday",
    day_short_label: "Sat",
    enabled: true,
    start_time: "10:00",
    end_time: "14:00",
  },
  {
    day_key: "sunday",
    day_label: "Sunday",
    day_short_label: "Sun",
    enabled: false,
    start_time: "10:00",
    end_time: "14:00",
  },
];

function formatMoney(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "$25";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function normalizeMediaArray(value: unknown): string[] {
  return normalizeStringArray(value).filter((item) => {
    const lower = item.toLowerCase();

    return (
      lower.startsWith("http://") ||
      lower.startsWith("https://") ||
      lower.startsWith("/")
    );
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function compactSlug(value: string) {
  return slugify(value).replace(/-/g, "");
}

function normalizeRouteSlug(routeSlug: string) {
  return routeSlug.toLowerCase().trim();
}

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getEmailHandle(email: string | null | undefined) {
  if (!email) return null;

  const handle = email.split("@")[0]?.trim();

  return handle || null;
}

function getCandidateNames(guru: Partial<GuruRecord>) {
  return [
    guru.display_name,
    guru.public_name,
    guru.business_name,
    guru.full_name,
    guru.first_name,
    guru.username,
    guru.name,
    guru.title,
    getEmailHandle(guru.email),
  ]
    .map((value) => value?.trim())
    .filter(Boolean) as string[];
}

function getDisplayName(guru: Partial<GuruRecord>) {
  return getCandidateNames(guru)[0] || "SitGuru Pro";
}

function createGuruSlug(guru: Partial<GuruRecord> & { id: string }) {
  if (guru.slug?.trim()) return slugify(guru.slug);

  const primaryName = getCandidateNames(guru)[0] || `guru-${guru.id}`;

  return slugify(primaryName);
}

function createGuruSlugVariants(guru: Partial<GuruRecord> & { id: string }) {
  const values = new Set<string>();

  if (guru.slug?.trim()) {
    values.add(slugify(guru.slug));
    values.add(compactSlug(guru.slug));
  }

  for (const name of getCandidateNames(guru)) {
    const dashed = slugify(name);
    const compact = compactSlug(name);

    if (dashed) values.add(dashed);
    if (compact) values.add(compact);
  }

  values.add(guru.id.toLowerCase());
  values.add(slugify(`guru-${guru.id}`));
  values.add(compactSlug(`guru-${guru.id}`));

  return Array.from(values).filter(Boolean);
}

function looksLikeGuruRecord(item: Record<string, unknown>) {
  const role = String(item.role ?? "").toLowerCase().trim();

  const hasProviderRole =
    role === "guru" ||
    role === "sitter" ||
    role === "provider" ||
    role === "trainer";

  const hasPublicFacingName =
    Boolean(item.full_name) ||
    Boolean(item.first_name) ||
    Boolean(item.display_name) ||
    Boolean(item.business_name) ||
    Boolean(item.public_name) ||
    Boolean(item.username) ||
    Boolean(item.name) ||
    Boolean(item.email) ||
    Boolean(item.title);

  return hasProviderRole || hasPublicFacingName;
}

function toNumber(value: unknown): number | null {
  return typeof value === "number" && !Number.isNaN(value) ? value : null;
}

function normalizeRecord(item: Record<string, unknown>): GuruRecord {
  return {
    id: String(item.id ?? ""),
    user_id: typeof item.user_id === "string" ? item.user_id : null,
    slug: typeof item.slug === "string" ? item.slug : null,
    role: typeof item.role === "string" ? item.role : null,
    status: typeof item.status === "string" ? item.status : null,

    full_name: typeof item.full_name === "string" ? item.full_name : null,
    first_name: typeof item.first_name === "string" ? item.first_name : null,
    display_name:
      typeof item.display_name === "string" ? item.display_name : null,
    business_name:
      typeof item.business_name === "string" ? item.business_name : null,
    username: typeof item.username === "string" ? item.username : null,
    public_name: typeof item.public_name === "string" ? item.public_name : null,
    name: typeof item.name === "string" ? item.name : null,
    email: typeof item.email === "string" ? item.email : null,
    title: typeof item.title === "string" ? item.title : null,

    headline: typeof item.headline === "string" ? item.headline : null,
    bio: typeof item.bio === "string" ? item.bio : null,
    city: typeof item.city === "string" ? item.city : null,
    state: typeof item.state === "string" ? item.state : null,

    profile_photo_url:
      typeof item.profile_photo_url === "string" ? item.profile_photo_url : null,
    image_url: typeof item.image_url === "string" ? item.image_url : null,
    photo_url: typeof item.photo_url === "string" ? item.photo_url : null,
    avatar_url: typeof item.avatar_url === "string" ? item.avatar_url : null,
    cover_photo_url:
      typeof item.cover_photo_url === "string" ? item.cover_photo_url : null,

    hourly_rate: toNumber(item.hourly_rate),
    rate: toNumber(item.rate),
    years_experience: toNumber(item.years_experience),
    experience_years: toNumber(item.experience_years),
    response_time:
      typeof item.response_time === "string" ? item.response_time : null,
    rating: toNumber(item.rating),
    rating_avg: toNumber(item.rating_avg),
    review_count: toNumber(item.review_count),

    specialties: normalizeStringArray(item.specialties),
    services: normalizeStringArray(item.services),
    certifications: normalizeStringArray(item.certifications),

    is_featured: Boolean(item.is_featured),
    is_verified: Boolean(item.is_verified),
    is_public: Boolean(item.is_public),
    is_active: Boolean(item.is_active),

    portfolio_images: normalizeMediaArray(item.portfolio_images),
    portfolio_videos: normalizeMediaArray(item.portfolio_videos),
    gallery_images: normalizeMediaArray(item.gallery_images),
    photo_urls: normalizeMediaArray(item.photo_urls),
  };
}

async function loadProfilesTable(): Promise<GuruRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("profiles").select("*");

  if (error) {
    console.error("Error loading profiles:", error.message);
    return [];
  }

  return (data ?? [])
    .filter((item) => looksLikeGuruRecord(item as Record<string, unknown>))
    .map((item) => normalizeRecord(item as Record<string, unknown>));
}

async function loadGurusTable(): Promise<GuruRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("gurus").select("*");

  if (error) {
    console.error("Error loading gurus:", error.message);
    return [];
  }

  return (data ?? [])
    .filter((item) => looksLikeGuruRecord(item as Record<string, unknown>))
    .map((item) => normalizeRecord(item as Record<string, unknown>));
}

async function getAllGuruRecords(): Promise<GuruRecord[]> {
  const [gurus, profiles] = await Promise.all([
    loadGurusTable(),
    loadProfilesTable(),
  ]);

  const merged = [...gurus, ...profiles];
  const map = new Map<string, GuruRecord>();

  for (const item of merged) {
    if (!item.id) continue;

    const existing = map.get(item.id);

    if (!existing) {
      map.set(item.id, item);
      continue;
    }

    map.set(item.id, {
      ...existing,
      ...item,
      services:
        item.services && item.services.length > 0
          ? item.services
          : existing.services,
      specialties:
        item.specialties && item.specialties.length > 0
          ? item.specialties
          : existing.specialties,
      certifications:
        item.certifications && item.certifications.length > 0
          ? item.certifications
          : existing.certifications,
      portfolio_images:
        item.portfolio_images && item.portfolio_images.length > 0
          ? item.portfolio_images
          : existing.portfolio_images,
      portfolio_videos:
        item.portfolio_videos && item.portfolio_videos.length > 0
          ? item.portfolio_videos
          : existing.portfolio_videos,
      gallery_images:
        item.gallery_images && item.gallery_images.length > 0
          ? item.gallery_images
          : existing.gallery_images,
      profile_photo_url: item.profile_photo_url || existing.profile_photo_url,
      image_url: item.image_url || existing.image_url,
      photo_url: item.photo_url || existing.photo_url,
      avatar_url: item.avatar_url || existing.avatar_url,
      cover_photo_url: item.cover_photo_url || existing.cover_photo_url,
      photo_urls:
        item.photo_urls && item.photo_urls.length > 0
          ? item.photo_urls
          : existing.photo_urls,
    });
  }

  return Array.from(map.values());
}

function matchGuruBySlug(records: GuruRecord[], routeSlug: string) {
  const normalizedRouteSlug = normalizeRouteSlug(routeSlug);
  const compactRouteSlug = normalizedRouteSlug.replace(/-/g, "");

  const exactMatch =
    records.find((record) =>
      createGuruSlugVariants(record).includes(normalizedRouteSlug),
    ) ?? null;

  if (exactMatch) return exactMatch;

  const compactVariantMatch =
    records.find((record) => {
      const variants = createGuruSlugVariants(record);

      return variants.some(
        (variant) =>
          variant.replace(/-/g, "") === compactRouteSlug ||
          compactSlug(variant) === compactRouteSlug,
      );
    }) ?? null;

  if (compactVariantMatch) return compactVariantMatch;

  const fuzzyMatch =
    records.find((record) => {
      const variants = createGuruSlugVariants(record);

      return variants.some((variant) => {
        const compactVariant = variant.replace(/-/g, "");

        return (
          compactVariant.includes(compactRouteSlug) ||
          compactRouteSlug.includes(compactVariant)
        );
      });
    }) ?? null;

  return fuzzyMatch;
}

async function getGuruBySlug(routeSlug: string): Promise<GuruRecord | null> {
  const records = await getAllGuruRecords();

  const activeRecords = records.filter((record) => {
    if (record.status?.toLowerCase() === "suspended") return false;
    if (record.is_active === false) return false;

    return true;
  });

  return matchGuruBySlug(activeRecords, routeSlug);
}

function createFallbackGuruFromSlug(routeSlug: string): GuruRecord {
  const cleanSlug = normalizeRouteSlug(routeSlug);
  const prettyName = titleFromSlug(cleanSlug) || "SitGuru Pro";

  return {
    id: `fallback-${cleanSlug}`,
    user_id: null,
    slug: cleanSlug,
    role: "guru",
    status: "live",

    full_name: prettyName,
    first_name: prettyName.split(" ")[0] ?? prettyName,
    display_name: prettyName,
    business_name: prettyName,
    username: cleanSlug,
    public_name: prettyName,
    name: prettyName,
    email: null,
    title: "Pet Care Guru",

    headline: "Loving pet care with a polished customer experience.",
    bio: "This Guru offers thoughtful, polished care with a premium customer-facing experience. Families can feel confident with a clear profile, professional presentation, and responsive communication.",
    city: null,
    state: null,

    profile_photo_url: null,
    image_url: null,
    photo_url: null,
    avatar_url: null,
    cover_photo_url: null,

    hourly_rate: 25,
    rate: 25,
    years_experience: null,
    experience_years: null,
    response_time: "Fast replies",
    rating: null,
    rating_avg: null,
    review_count: null,

    specialties: ["Puppy Care", "Senior Pet Care", "Multi-Pet Homes"],
    services: ["Dog Walking", "Pet Sitting", "Cat Care", "Drop-In Visits"],
    certifications: ["Background checked", "SitGuru reviewed"],

    is_featured: true,
    is_verified: true,
    is_public: true,
    is_active: true,

    portfolio_images: [],
    portfolio_videos: [],
    gallery_images: [],
    photo_urls: [],
  };
}

async function getGuruForPage(routeSlug: string): Promise<{
  guru: GuruRecord;
  isFallback: boolean;
}> {
  const matched = await getGuruBySlug(routeSlug);

  if (matched) {
    return {
      guru: matched,
      isFallback: false,
    };
  }

  return {
    guru: createFallbackGuruFromSlug(routeSlug),
    isFallback: true,
  };
}

function getImageCandidates(guru: GuruRecord) {
  return [
    guru.profile_photo_url,
    guru.image_url,
    guru.photo_url,
    guru.avatar_url,
    guru.cover_photo_url,
    ...(guru.portfolio_images || []),
    ...(guru.gallery_images || []),
    ...(guru.photo_urls || []),
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

function getPrimaryPhoto(guru: GuruRecord) {
  return (
    guru.profile_photo_url ||
    guru.image_url ||
    guru.photo_url ||
    guru.avatar_url ||
    null
  );
}

function getHeroImage(guru: GuruRecord) {
  return (
    guru.cover_photo_url ||
    getPrimaryPhoto(guru) ||
    guru.portfolio_images?.[0] ||
    guru.gallery_images?.[0] ||
    guru.photo_urls?.[0] ||
    null
  );
}

function getGalleryImages(guru: GuruRecord) {
  const candidates = [
    getPrimaryPhoto(guru),
    guru.cover_photo_url,
    ...(guru.portfolio_images || []),
    ...(guru.gallery_images || []),
    ...(guru.photo_urls || []),
  ].filter(Boolean) as string[];

  return Array.from(new Set(candidates)).slice(0, 8);
}

async function isReachableImageUrl(url: string) {
  if (!url) return false;
  if (url.startsWith("/")) return true;

  try {
    const headResponse = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
    });

    const contentType = headResponse.headers.get("content-type") || "";

    if (headResponse.ok && contentType.toLowerCase().startsWith("image/")) {
      return true;
    }
  } catch {
    // Some storage/CDN setups block HEAD. Try a tiny GET below.
  }

  try {
    const getResponse = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Range: "bytes=0-1",
      },
    });

    const contentType = getResponse.headers.get("content-type") || "";

    return getResponse.ok && contentType.toLowerCase().startsWith("image/");
  } catch {
    return false;
  }
}

async function getFirstReachableImageUrl(candidates: Array<string | null | undefined>) {
  const uniqueCandidates = Array.from(
    new Set(candidates.map((value) => String(value || "").trim()).filter(Boolean)),
  );

  for (const candidate of uniqueCandidates) {
    if (await isReachableImageUrl(candidate)) {
      return candidate;
    }
  }

  return null;
}

function GuruImageFallback({
  displayName,
  className = "",
  initialsClassName = "",
}: {
  displayName: string;
  className?: string;
  initialsClassName?: string;
}) {
  return (
    <div
      className={[
        "flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#ecfdf5_0%,#dbeafe_100%)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={[
          "flex h-36 w-36 items-center justify-center rounded-full bg-white text-5xl font-black !text-emerald-700 shadow-xl ring-8 ring-white/60",
          initialsClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {initialsFromName(displayName)}
      </div>
    </div>
  );
}

function getYearsText(guru: GuruRecord) {
  const years = guru.years_experience ?? guru.experience_years;

  if (typeof years === "number" && years > 0) return `${years}+ years`;

  return "Experienced";
}

function getRateValue(guru: GuruRecord) {
  return guru.hourly_rate ?? guru.rate ?? 25;
}

function getRatingValue(guru: GuruRecord) {
  const rating = guru.rating ?? guru.rating_avg;

  if (typeof rating === "number" && rating > 0) return rating.toFixed(1);

  return "New";
}

function getReviewText(guru: GuruRecord) {
  if (typeof guru.review_count === "number" && guru.review_count > 0) {
    return `${guru.review_count} reviews`;
  }

  return "Building reviews";
}

function normalizeTimeForDisplay(value: string | null | undefined) {
  if (!value) return "09:00";

  return value.slice(0, 5);
}

function normalizeAvailabilityServiceKey(
  value: string | null | undefined,
): ServiceKey {
  const cleaned = String(value || "").toLowerCase().trim();

  if (cleaned === "all_services") return "all_services";
  if (cleaned === "drop_in_visit") return "drop_in_visit";
  if (cleaned === "house_sitting") return "house_sitting";
  if (cleaned === "doggy_day_care") return "doggy_day_care";
  if (cleaned === "dog_walking") return "dog_walking";

  return "drop_in_visit";
}

function serviceNameToKey(service: string): ServiceKey | null {
  const value = service.toLowerCase().trim();

  if (value.includes("walk")) return "dog_walking";
  if (value.includes("drop")) return "drop_in_visit";
  if (value.includes("visit")) return "drop_in_visit";
  if (value.includes("house")) return "house_sitting";
  if (value.includes("sitting")) return "house_sitting";
  if (value.includes("overnight")) return "house_sitting";
  if (value.includes("day care")) return "doggy_day_care";
  if (value.includes("daycare")) return "doggy_day_care";
  if (value.includes("doggy")) return "doggy_day_care";

  return null;
}

function getCustomerServiceOptions(services: string[]): PublicServiceOption[] {
  const map = new Map<ServiceKey, string>();

  for (const service of services) {
    const key = serviceNameToKey(service);

    if (key && !map.has(key)) map.set(key, service);
  }

  for (const option of publicServiceOptions) {
    if (!map.has(option.key)) map.set(option.key, option.label);
  }

  return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
}

function dayKeyFromPublicDate(date: Date) {
  return [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ][date.getDay()];
}

function toPublicISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatPublicDisplayDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function createPublicCalendarCells({
  monthDate,
  weeklyAvailability,
  blackoutDates,
  selectedServiceKey,
}: {
  monthDate: Date;
  weeklyAvailability: PublicWeeklyAvailability[];
  blackoutDates: PublicBlackoutDate[];
  selectedServiceKey: ServiceKey;
}): PublicCalendarCell[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(year, month, 1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);

    date.setDate(startDate.getDate() + index);

    const iso = toPublicISODate(date);
    const weeklyDay = weeklyAvailability.find(
      (day) => day.day_key === dayKeyFromPublicDate(date),
    );

    const matchingBlackout = blackoutDates.find(
      (blackout) =>
        blackout.blackout_date === iso &&
        (blackout.service_key === "all_services" ||
          blackout.service_key === selectedServiceKey),
    );

    let status: PublicCalendarCell["status"] = weeklyDay?.enabled
      ? "available"
      : "closed";

    if (matchingBlackout) status = "unavailable";

    return {
      iso,
      dayNumber: date.getDate(),
      inMonth: date.getMonth() === month,
      status,
      note: matchingBlackout?.note,
    };
  });
}

function getPublicCalendarCellClass(cell: PublicCalendarCell) {
  const base =
    "relative flex h-10 items-center justify-center overflow-hidden rounded-xl border text-sm font-black";

  if (!cell.inMonth) {
    return `${base} border-slate-200 bg-slate-50 opacity-40`;
  }

  if (cell.status === "unavailable") {
    return `${base} border-rose-200 bg-rose-50`;
  }

  if (cell.status === "available") {
    return `${base} border-emerald-200 bg-emerald-50`;
  }

  return `${base} border-slate-200 bg-slate-50`;
}

function getPublicCalendarCellTextClass(cell: PublicCalendarCell) {
  if (!cell.inMonth) return "!text-slate-400";
  if (cell.status === "unavailable") return "!text-rose-700";
  if (cell.status === "available") return "!text-emerald-800";

  return "!text-slate-500";
}

function CustomerCalendarCrossout() {
  return (
    <>
      <span className="pointer-events-none absolute left-1/2 top-1/2 h-[1.5px] w-7 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-rose-500/85" />
      <span className="pointer-events-none absolute left-1/2 top-1/2 h-[1.5px] w-7 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-rose-500/85" />
    </>
  );
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

async function loadPublicAvailability(userId: string | null) {
  if (!userId || userId.startsWith("fallback-")) {
    return {
      settings: null as PublicAvailabilitySettings | null,
      weeklyAvailability: publicDefaultWeeklyAvailability,
      blackoutDates: [] as PublicBlackoutDate[],
    };
  }

  const supabase = await createClient();

  const [settingsResponse, weeklyResponse, blackoutResponse] =
    await Promise.all([
      supabase
        .from("guru_availability_settings")
        .select(
          "publish_availability, same_day_booking, instant_booking, buffer_minutes, max_bookings_per_day",
        )
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("guru_weekly_availability")
        .select("day_key, day_label, day_short_label, enabled, start_time, end_time")
        .eq("user_id", userId),
      supabase
        .from("guru_blackout_dates")
        .select("blackout_date, service_key, note")
        .eq("user_id", userId)
        .order("blackout_date", { ascending: true }),
    ]);

  const settingsData = settingsResponse.data as {
    publish_availability?: boolean | null;
    same_day_booking?: boolean | null;
    instant_booking?: boolean | null;
    buffer_minutes?: number | null;
    max_bookings_per_day?: number | null;
  } | null;

  const weeklyRows = (weeklyResponse.data || []) as Array<{
    day_key?: string | null;
    day_label?: string | null;
    day_short_label?: string | null;
    enabled?: boolean | null;
    start_time?: string | null;
    end_time?: string | null;
  }>;

  const blackoutRows = (blackoutResponse.data || []) as Array<{
    blackout_date?: string | null;
    service_key?: string | null;
    note?: string | null;
  }>;

  const weeklyAvailability = publicDefaultWeeklyAvailability.map(
    (defaultDay) => {
      const row = weeklyRows.find(
        (item) => item.day_key === defaultDay.day_key,
      );

      if (!row) return defaultDay;

      return {
        day_key: defaultDay.day_key,
        day_label: row.day_label || defaultDay.day_label,
        day_short_label: row.day_short_label || defaultDay.day_short_label,
        enabled: Boolean(row.enabled),
        start_time: normalizeTimeForDisplay(
          row.start_time || defaultDay.start_time,
        ),
        end_time: normalizeTimeForDisplay(row.end_time || defaultDay.end_time),
      };
    },
  );

  const blackoutDates = blackoutRows
    .map((row) => ({
      blackout_date: row.blackout_date || "",
      service_key: normalizeAvailabilityServiceKey(row.service_key),
      note: row.note || "Unavailable",
    }))
    .filter((row) => row.blackout_date);

  return {
    settings: settingsData
      ? {
          publish_availability: settingsData.publish_availability !== false,
          same_day_booking: settingsData.same_day_booking !== false,
          instant_booking: Boolean(settingsData.instant_booking),
          buffer_minutes: settingsData.buffer_minutes ?? 30,
          max_bookings_per_day: settingsData.max_bookings_per_day ?? 4,
        }
      : null,
    weeklyAvailability,
    blackoutDates,
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { guru } = await getGuruForPage(slug);

  const name = getDisplayName(guru);
  const headline =
    guru.headline?.trim() ||
    "Trusted, premium pet care and in-home support through SitGuru.";

  return {
    title: `${name} | SitGuru`,
    description: headline,
  };
}

export default async function GuruProfilePage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const { guru, isFallback } = await getGuruForPage(slug);

  const displayName = getDisplayName(guru);
  const firstName = displayName.split(" ")[0] || "this Guru";
  const publicSlug = createGuruSlug(guru);
  const bookingHref = `/book/${publicSlug}`;
  const messageHref = `/messages/new?guru=${encodeURIComponent(publicSlug)}`;

  const headline =
    guru.headline?.trim() ||
    "Loving, reliable pet care with a polished customer experience.";

  const location = [guru.city, guru.state].filter(Boolean).join(", ");
  const numericRate = getRateValue(guru);
  const rate = formatMoney(numericRate);
  const years = getYearsText(guru);
  const ratingValue = getRatingValue(guru);
  const reviewText = getReviewText(guru);
  const responseStyle = guru.response_time?.trim() || "Fast replies";

  const services =
    guru.services && guru.services.length > 0
      ? guru.services
      : ["Dog Walking", "Pet Sitting", "Cat Care", "Drop-In Visits"];

  const specialties =
    guru.specialties && guru.specialties.length > 0
      ? guru.specialties
      : ["Puppy Care", "Senior Pet Care", "Multi-Pet Homes"];

  const certifications =
    guru.certifications && guru.certifications.length > 0
      ? guru.certifications
      : ["Profile reviewed", "Service details listed"];

  const portfolioVideos =
    guru.portfolio_videos && guru.portfolio_videos.length > 0
      ? guru.portfolio_videos
      : [];

  const rawGalleryImages = getGalleryImages(guru);
  const primaryPhoto = await getFirstReachableImageUrl([
    guru.profile_photo_url,
    guru.image_url,
    guru.photo_url,
    guru.avatar_url,
  ]);
  const heroImage = await getFirstReachableImageUrl([
    getHeroImage(guru),
    primaryPhoto,
    guru.cover_photo_url,
    ...rawGalleryImages,
  ]);
  const galleryImages = (
    await Promise.all(rawGalleryImages.map((imageUrl) => isReachableImageUrl(imageUrl)))
  )
    .map((isReachable, index) => (isReachable ? rawGalleryImages[index] : null))
    .filter(Boolean) as string[];
  const hasLivePortfolio = galleryImages.length > 0 || portfolioVideos.length > 0;

  const primaryService = services[0] || "General care";
  const bookingServices = Array.from(
    new Set([primaryService, ...services, "General care"]),
  );
  const customerServiceOptions = getCustomerServiceOptions(bookingServices);
  const requestedServiceKey = normalizeAvailabilityServiceKey(
    resolvedSearchParams.service,
  );
  const selectedCustomerService =
    customerServiceOptions.find((option) => option.key === requestedServiceKey) ||
    customerServiceOptions[0] ||
    publicServiceOptions[0];

  const availabilityUserId = guru.user_id || guru.id;
  const { settings, weeklyAvailability, blackoutDates } =
    await loadPublicAvailability(availabilityUserId);

  const showAvailabilityCalendar = settings?.publish_availability !== false;
  const today = new Date();
  const publicCalendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const publicCalendarCells = createPublicCalendarCells({
    monthDate: publicCalendarMonth,
    weeklyAvailability,
    blackoutDates,
    selectedServiceKey: selectedCustomerService.key,
  });

  const upcomingUnavailableDates = blackoutDates
    .filter(
      (blackout) =>
        blackout.service_key === "all_services" ||
        blackout.service_key === selectedCustomerService.key,
    )
    .slice(0, 4);

  const activeWeeklyDays = weeklyAvailability.filter((day) => day.enabled);
  const availabilitySummary =
    activeWeeklyDays.length > 0
      ? `Generally available ${activeWeeklyDays
          .map((day) => day.day_short_label)
          .join(", ")}`
      : "Availability is limited right now";

  const profileStatus =
    guru.status?.trim() && guru.status.toLowerCase() !== "draft"
      ? guru.status.charAt(0).toUpperCase() + guru.status.slice(1)
      : "Live";

  const trustSignals = [
    guru.is_verified ? "Verified profile" : "Profile reviewed",
    profileStatus,
    ...certifications.slice(0, 4),
  ];

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_45%,#eefdf6_100%)] pb-24 !text-slate-950 antialiased sm:pb-0 [&&_h1]:!text-slate-950 [&&_h2]:!text-slate-950 [&&_h3]:!text-slate-950 [&&_h4]:!text-slate-950 [&&_p]:!text-slate-800">
      <GuruProfileAnalytics
        guruId={guru.id}
        guruSlug={publicSlug}
        guruName={displayName}
        guruLocation={location || "Serving your area"}
        primaryService={primaryService}
        hourlyRate={numericRate}
        isFallback={isFallback}
      />

      <section className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold !text-slate-700">
            <Link href="/search" className="transition hover:!text-emerald-700">
              Find a Guru
            </Link>
            <span aria-hidden="true">›</span>
            <span>{primaryService}</span>
            {location ? (
              <>
                <span aria-hidden="true">›</span>
                <span>{location}</span>
              </>
            ) : null}
            <span aria-hidden="true">›</span>
            <span className="!text-slate-900">{displayName}</span>
          </nav>

          <Link
            href="/search"
            className="inline-flex min-h-[46px] w-fit items-center justify-center rounded-full border border-emerald-200 bg-white px-5 py-2.5 text-sm font-black !text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md"
          >
            ← Back to Find a Guru
          </Link>
        </div>

        <div className="grid gap-7 xl:grid-cols-[1fr_430px]">
          <div className="space-y-7">
            <section className="overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <div className="grid min-h-[520px] lg:grid-cols-[0.9fr_1.1fr]">
                <div className="relative min-h-[360px] overflow-hidden bg-slate-100">
                  {heroImage ? (
                    <img
                      src={heroImage}
                      alt={displayName}
                      className="h-full min-h-[360px] w-full object-cover object-center"
                    />
                  ) : (
                    <GuruImageFallback displayName={displayName} className="min-h-[360px]" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />

                  <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-4 py-2 text-sm font-black !text-slate-950 shadow-lg">
                      ⭐ {guru.is_featured ? "Featured Guru" : "Trusted Guru"}
                    </span>

                    {guru.is_verified ? (
                      <span className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-lg">
                        🛡️ Verified
                      </span>
                    ) : (
                      <span className="rounded-full bg-white px-4 py-2 text-sm font-black !text-slate-950 shadow-lg">
                        Profile reviewed
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black uppercase tracking-[0.16em] !text-emerald-700 ring-1 ring-emerald-100">
                        {profileStatus}
                      </span>

                      {isFallback ? (
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-black !text-amber-700 ring-1 ring-amber-100">
                          Preview Profile
                        </span>
                      ) : null}

                      <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-black !text-sky-700 ring-1 ring-sky-100">
                        SitGuru Care Profile
                      </span>
                    </div>

                    <h1 className="mt-5 text-5xl font-black tracking-[-0.055em] !text-slate-950 sm:text-6xl lg:text-7xl">
                      {displayName}
                    </h1>

                    <p className="mt-4 max-w-3xl text-xl font-semibold leading-8 !text-slate-800 sm:text-2xl">
                      {headline}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold !text-slate-800">
                      <span>📍 {location || "Serving your area"}</span>
                      <span className="hidden !text-slate-400 sm:inline">|</span>
                      <span>{rate}/hr starting rate</span>
                      <span className="hidden !text-slate-400 sm:inline">|</span>
                      <span>{years} experience</span>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      {[
                        {
                          label: "Rating",
                          value: ratingValue,
                          detail: reviewText,
                        },
                        {
                          label: "Response",
                          value: responseStyle,
                          detail: "Clear communication",
                        },
                        {
                          label: "Trust",
                          value: guru.is_verified ? "Verified" : "Reviewed",
                          detail: "SitGuru profile",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4"
                        >
                          <p className="text-xs font-black uppercase tracking-[0.14em] !text-slate-500">
                            {item.label}
                          </p>
                          <p className="mt-1 text-2xl font-black !text-slate-950">
                            {item.value}
                          </p>
                          <p className="mt-1 text-sm font-semibold !text-slate-600">
                            {item.detail}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {services.slice(0, 6).map((service) => (
                        <span
                          key={service}
                          className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold !text-emerald-700 ring-1 ring-emerald-100"
                        >
                          {service}
                        </span>
                      ))}

                      {services.length > 6 ? (
                        <span className="rounded-full bg-slate-50 px-3 py-1.5 text-sm font-bold !text-slate-800 ring-1 ring-slate-200">
                          +{services.length - 6} more
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <BookThisGuruButton
                      href={bookingHref}
                      className="inline-flex min-h-[58px] min-w-[190px] items-center justify-center rounded-full bg-emerald-600 px-8 py-3 text-base font-black text-white shadow-[0_14px_34px_rgba(5,150,105,0.24)] transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_18px_42px_rgba(5,150,105,0.3)]"
                    />

                    <Link
                      href={messageHref}
                      className="inline-flex min-h-[58px] min-w-[170px] items-center justify-center rounded-full border border-slate-200 bg-white px-8 py-3 text-base font-black !text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:!text-emerald-700 hover:shadow-md"
                    >
                      Message Guru
                    </Link>

                    <Link
                      href={`/search?service=${encodeURIComponent(primaryService)}`}
                      className="inline-flex h-[58px] w-[58px] items-center justify-center rounded-full border border-slate-200 bg-white text-2xl font-black !text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:!text-emerald-700 hover:shadow-md"
                      aria-label="Browse similar Gurus"
                    >
                      ↗
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.22em] !text-emerald-700">
                About this Guru
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight !text-slate-950 sm:text-4xl">
                Meet {displayName}
              </h2>

              <p className="mt-5 max-w-4xl text-lg font-medium leading-8 !text-slate-800">
                {guru.bio?.trim() ||
                  "This Guru offers thoughtful, polished care with a premium customer-facing experience. Families can feel confident with a clear profile, professional presentation, and responsive communication."}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "Starting rate",
                    value: `${rate}/hr`,
                  },
                  {
                    label: "Experience",
                    value: years,
                  },
                  {
                    label: "Response style",
                    value: responseStyle,
                  },
                  {
                    label: "Location",
                    value: location || "Location pending",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-5"
                  >
                    <p className="text-sm font-bold !text-slate-700">
                      {item.label}
                    </p>
                    <p className="mt-2 text-xl font-black !text-slate-950">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.22em] !text-emerald-700">
                    Services & specialties
                  </p>

                  <h2 className="mt-2 text-3xl font-black tracking-tight !text-slate-950">
                    Care options that fit your pet
                  </h2>
                </div>

                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black !text-emerald-700">
                  {services.length} services listed
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <div
                    key={service}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 !text-emerald-700 ring-1 ring-emerald-100">
                      🐾
                    </span>
                    <span className="text-sm font-bold !text-slate-800">
                      {service}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black !text-emerald-700"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </section>

            {showAvailabilityCalendar ? (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.22em] !text-emerald-700">
                      Availability
                    </p>

                    <h2 className="mt-2 text-3xl font-black tracking-tight !text-slate-950">
                      Check general availability
                    </h2>

                    <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 !text-slate-800">
                      This calendar gives a quick look at typical availability.
                      Final booking details are confirmed in the booking request.
                    </p>
                  </div>

                  <Link
                    href={bookingHref}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    Start Booking
                  </Link>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xl font-black !text-slate-950">
                          {monthLabel(publicCalendarMonth)}
                        </p>
                        <p className="mt-1 text-sm font-bold !text-slate-700">
                          {availabilitySummary}
                        </p>
                      </div>

                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black !text-slate-700 ring-1 ring-slate-200">
                        {settings?.same_day_booking === false
                          ? "No same-day"
                          : "Same-day requests"}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {customerServiceOptions.map((option) => {
                        const active = option.key === selectedCustomerService.key;

                        return (
                          <Link
                            key={option.key}
                            href={`/guru/${publicSlug}?service=${option.key}`}
                            className={[
                              "rounded-full border px-3 py-1.5 text-xs font-black transition",
                              active
                                ? "border-emerald-500 bg-emerald-600 text-white"
                                : "border-slate-200 bg-white !text-slate-800 hover:border-emerald-200 hover:bg-emerald-50 hover:!text-emerald-700",
                            ].join(" ")}
                          >
                            {option.label}
                          </Link>
                        );
                      })}
                    </div>

                    <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[11px] font-black uppercase tracking-[0.06em] !text-slate-600">
                      {["S", "M", "T", "W", "T", "F", "S"].map(
                        (day, index) => (
                          <div key={`${day}-${index}`}>{day}</div>
                        ),
                      )}
                    </div>

                    <div className="mt-2 grid grid-cols-7 gap-1">
                      {publicCalendarCells.map((cell) => (
                        <div
                          key={`${selectedCustomerService.key}-${cell.iso}`}
                          className={getPublicCalendarCellClass(cell)}
                          title={cell.note || undefined}
                        >
                          {cell.inMonth && cell.status === "unavailable" ? (
                            <CustomerCalendarCrossout />
                          ) : null}

                          <span className={getPublicCalendarCellTextClass(cell)}>
                            {cell.dayNumber}
                          </span>

                          {cell.inMonth && cell.status === "available" ? (
                            <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          ) : null}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold !text-slate-700">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-200" />
                        Available
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 rounded bg-rose-100 ring-1 ring-rose-200" />
                        Unavailable
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 rounded bg-slate-100 ring-1 ring-slate-200" />
                        Outside month
                      </span>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                    <p className="text-lg font-black !text-slate-950">
                      Schedule notes
                    </p>

                    {upcomingUnavailableDates.length > 0 ? (
                      <div className="mt-4 space-y-2">
                        {upcomingUnavailableDates.map((blackout) => (
                          <div
                            key={`${blackout.blackout_date}-${blackout.service_key}`}
                            className="rounded-2xl bg-rose-50 px-3 py-3 ring-1 ring-rose-100"
                          >
                            <p className="text-sm font-black !text-slate-950">
                              {formatPublicDisplayDate(blackout.blackout_date)}
                            </p>
                            <p className="mt-1 text-xs font-bold !text-rose-700">
                              {blackout.note}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold leading-6 !text-emerald-800">
                        No blackout dates are listed for{" "}
                        {selectedCustomerService.label}.
                      </div>
                    )}

                    <p className="mt-4 text-sm font-semibold leading-6 !text-slate-700">
                      The booking form will let you choose your pet, service,
                      care location, and preferred timing.
                    </p>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.22em] !text-emerald-700">
                    Photos & videos
                  </p>

                  <h2 className="mt-2 text-3xl font-black tracking-tight !text-slate-950">
                    Real care moments that build trust
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 !text-slate-800">
                    Pet parents can get a feel for this Guru’s care style,
                    personality, and environment.
                  </p>
                </div>

                <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black uppercase tracking-[0.16em] !text-slate-800">
                  {hasLivePortfolio ? "Live portfolio" : "Waiting for uploads"}
                </span>
              </div>

              {galleryImages.length > 0 ? (
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {galleryImages.slice(0, 5).map((imageUrl, index) => (
                    <div
                      key={`${imageUrl}-${index}`}
                      className="group relative overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-100 shadow-sm"
                    >
                      <img
                        src={imageUrl}
                        alt={`${displayName} portfolio image ${index + 1}`}
                        className="h-40 w-full object-cover object-center transition duration-300 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 p-5">
                  <p className="text-sm font-semibold !text-slate-800">
                    Portfolio photos will appear here once uploaded from the Guru
                    dashboard and saved to the profile.
                  </p>
                </div>
              )}

              {portfolioVideos.length > 0 ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {portfolioVideos.slice(0, 2).map((videoUrl, index) => (
                    <div
                      key={`${videoUrl}-${index}`}
                      className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-slate-50 shadow-sm"
                    >
                      <video controls preload="metadata" className="h-auto w-full">
                        <source src={videoUrl} />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_100%)] p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.22em] !text-emerald-700">
                Why pet parents trust {firstName}
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: "Clear profile",
                    copy: "Services, pricing, location, and trust signals are easy to review.",
                    icon: "🧾",
                  },
                  {
                    title: "Pet-first care",
                    copy: "The booking request collects pet details and special instructions.",
                    icon: "🐾",
                  },
                  {
                    title: "SitGuru support",
                    copy: "Booking stays inside the SitGuru experience with support when needed.",
                    icon: "💚",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[1.5rem] bg-white/85 p-5 ring-1 ring-emerald-100"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-2xl ring-1 ring-emerald-100">
                      {item.icon}
                    </span>
                    <p className="mt-4 text-lg font-black !text-slate-950">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-7 !text-slate-800">
                      {item.copy}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
            <section className="overflow-hidden rounded-[2rem] border border-emerald-200 bg-white shadow-[0_22px_65px_rgba(15,118,110,0.12)]">
              <div className="bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_100%)] p-6">
                <p className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-sm font-black uppercase tracking-[0.22em] !text-emerald-700">
                  Ready to book?
                </p>

                <h2 className="mt-4 text-3xl font-black tracking-tight !text-slate-950">
                  Book care with {firstName}
                </h2>

                <p className="mt-3 text-sm font-semibold leading-7 !text-slate-700">
                  Choose your pet, requested date, care details, and notes in
                  the secure booking request flow.
                </p>
              </div>

              <div className="p-6">
                <div className="flex gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-3xl bg-emerald-50 ring-1 ring-emerald-100">
                    {primaryPhoto ? (
                      <img
                        src={primaryPhoto}
                        alt={displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-black !text-emerald-700">
                        {initialsFromName(displayName)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xl font-black !text-slate-950">
                      {displayName}
                    </p>
                    <p className="mt-1 text-sm font-bold !text-slate-700">
                      {primaryService}
                    </p>
                    <p className="mt-1 text-sm font-bold !text-emerald-700">
                      {rate}/hr starting rate
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Rating",
                      value: ratingValue,
                    },
                    {
                      label: "Reviews",
                      value: reviewText,
                    },
                    {
                      label: "Experience",
                      value: years,
                    },
                    {
                      label: "Response",
                      value: responseStyle,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="text-xs font-black uppercase tracking-[0.12em] !text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-1 text-base font-black !text-slate-950">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <BookThisGuruButton
                  href={bookingHref}
                  label="Book this Guru"
                  className="mt-6 inline-flex min-h-[60px] w-full items-center justify-center rounded-2xl bg-emerald-600 px-6 py-4 text-base font-black text-white shadow-[0_14px_34px_rgba(5,150,105,0.24)] transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_18px_42px_rgba(5,150,105,0.3)]"
                />

                <Link
                  href={messageHref}
                  className="mt-3 inline-flex min-h-[56px] w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 text-base font-black !text-slate-950 transition hover:border-emerald-200 hover:bg-emerald-50 hover:!text-emerald-700"
                >
                  Message Guru
                </Link>

                <p className="mt-4 text-center text-xs font-bold leading-5 !text-slate-600">
                  You will review the request before checkout. You are not
                  charged from this profile page.
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.22em] !text-emerald-700">
                What happens next
              </p>

              <h3 className="mt-3 text-2xl font-black tracking-tight !text-slate-950">
                Simple booking flow
              </h3>

              <div className="mt-5 space-y-4">
                {[
                  {
                    step: "1",
                    title: "Submit your request",
                    copy: "Tell us about your pet, service, location, and care needs.",
                  },
                  {
                    step: "2",
                    title: "Guru reviews",
                    copy: "This Guru reviews the request and availability.",
                  },
                  {
                    step: "3",
                    title: "Care is confirmed",
                    copy: "You review details and complete secure checkout.",
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex gap-3 rounded-[1.35rem] bg-slate-50 p-4 ring-1 ring-slate-200"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">
                      {item.step}
                    </span>

                    <div>
                      <p className="text-sm font-black !text-slate-950">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 !text-slate-800">
                        {item.copy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.22em] !text-emerald-700">
                Trust & credentials
              </p>

              <h3 className="mt-3 text-2xl font-black tracking-tight !text-slate-950">
                Confidence signals
              </h3>

              <div className="mt-5 grid gap-3">
                {trustSignals.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 !text-emerald-700 ring-1 ring-emerald-100">
                      ✓
                    </span>
                    <span className="text-sm font-bold !text-slate-700">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl !text-emerald-700 ring-1 ring-emerald-100">
                  🔒
                </div>

                <div>
                  <h3 className="text-xl font-black tracking-tight !text-slate-950">
                    Secure & private
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-7 !text-slate-700">
                    Your request is private and only shared with this Guru and
                    SitGuru support when needed.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-7 grid gap-4 rounded-[2rem] border border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_100%)] p-5 shadow-sm md:grid-cols-4">
          {[
            {
              title: "Trusted pet care",
              copy: "Every Guru profile is built around clear trust signals.",
              icon: "🛡️",
            },
            {
              title: "Personalized matches",
              copy: "Customers can compare care by service, location, and fit.",
              icon: "🐾",
            },
            {
              title: "Secure payments",
              copy: "Booking stays inside the SitGuru experience.",
              icon: "🔒",
            },
            {
              title: "Support when needed",
              copy: "SitGuru support is available for care questions.",
              icon: "🎧",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex gap-3 rounded-[1.5rem] bg-white/80 p-4 ring-1 ring-emerald-100"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xl ring-1 ring-emerald-100">
                {item.icon}
              </span>

              <div>
                <p className="font-black !text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm font-semibold leading-6 !text-slate-800">
                  {item.copy}
                </p>
              </div>
            </div>
          ))}
        </section>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100 bg-white/95 px-4 py-3 shadow-[0_-16px_40px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-7xl gap-3">
          <BookThisGuruButton
            href={bookingHref}
            label="Book Guru"
            className="flex min-h-[52px] flex-1 items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white"
          />

          <Link
            href={messageHref}
            className="flex min-h-[52px] flex-1 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-black !text-emerald-700"
          >
            Message
          </Link>
        </div>
      </div>
    </main>
  );
}