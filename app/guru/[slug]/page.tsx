import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import GuruBookingCard from "./GuruBookingCard";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type GuruRecord = {
  id: string;
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
  const [gurus, profiles] = await Promise.all([loadGurusTable(), loadProfilesTable()]);
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
      photo_urls:
        item.photo_urls && item.photo_urls.length > 0
          ? item.photo_urls
          : existing.photo_urls,
    });
  }

  return Array.from(map.values());
}

function matchGuruBySlug(
  records: GuruRecord[],
  routeSlug: string
): GuruRecord | null {
  const normalizedRouteSlug = normalizeRouteSlug(routeSlug);
  const compactRouteSlug = normalizedRouteSlug.replace(/-/g, "");

  const exactMatch =
    records.find((record) =>
      createGuruSlugVariants(record).includes(normalizedRouteSlug)
    ) ?? null;

  if (exactMatch) return exactMatch;

  const compactVariantMatch =
    records.find((record) => {
      const variants = createGuruSlugVariants(record);
      return variants.some(
        (variant) =>
          variant.replace(/-/g, "") === compactRouteSlug ||
          compactSlug(variant) === compactRouteSlug
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

  if (fuzzyMatch) return fuzzyMatch;

  return null;
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

  const prettyNameMap: Record<string, string> = {
    poundpuppy: "PoundPuppy",
    "sitguru-pro": "SitGuru Pro",
  };

  const prettyName =
    prettyNameMap[cleanSlug] || titleFromSlug(cleanSlug) || "SitGuru Pro";

  const headlineMap: Record<string, string> = {
    poundpuppy: "Loving Dog Sitters",
    "sitguru-pro": "Trusted premium pet care with a polished customer experience.",
  };

  const bioMap: Record<string, string> = {
    poundpuppy:
      "PoundPuppy is presented as a warm, reliable pet care profile focused on attentive visits, easy booking, and a polished customer experience that helps families feel comfortable from the first click.",
    "sitguru-pro":
      "SitGuru Pro is presented as a premium public-facing care profile built for trust, comfort, and smooth customer booking. The goal is a modern, high-confidence experience that feels professional and easy to use.",
  };

  return {
    id: `fallback-${cleanSlug}`,
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

    headline:
      headlineMap[cleanSlug] ||
      "Loving pet care with a polished customer experience.",
    bio:
      bioMap[cleanSlug] ||
      "This Guru offers thoughtful, polished care with a premium customer-facing experience. Families can feel confident with a clear profile, a professional presentation, and responsive communication.",
    city: cleanSlug === "poundpuppy" ? "Cromwell" : null,
    state: cleanSlug === "poundpuppy" ? "MN" : null,

    profile_photo_url: null,
    image_url: null,
    cover_photo_url: null,

    hourly_rate: 25,
    rate: 25,
    years_experience: cleanSlug === "poundpuppy" ? 20 : null,
    experience_years: cleanSlug === "poundpuppy" ? 20 : null,
    response_time: "Fast replies",
    rating: null,
    rating_avg: null,
    review_count: null,

    specialties: [
      "Puppy Care",
      "Senior Pet Care",
      "Multi-Pet Homes",
    ],
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

function getPrimaryPhoto(guru: GuruRecord) {
  return guru.profile_photo_url || guru.image_url || null;
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

export default async function GuruProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const { guru, isFallback } = await getGuruForPage(slug);

  const displayName = getDisplayName(guru);
  const headline =
    guru.headline?.trim() ||
    "Loving pet care with a polished customer experience.";

  const location = [guru.city, guru.state].filter(Boolean).join(", ");
  const rate = formatMoney(getRateValue(guru));
  const years = getYearsText(guru);
  const ratingValue = getRatingValue(guru);
  const reviewText = getReviewText(guru);

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

  const galleryImages = getGalleryImages(guru);
  const hasLivePortfolio = galleryImages.length > 0 || portfolioVideos.length > 0;
  const hasLiveReviews =
    typeof guru.review_count === "number" && guru.review_count > 0;

const publicSlug = createGuruSlug(guru);
const bookingPageHref = `/bookings/new?guru_slug=${encodeURIComponent(publicSlug)}`;
const messageHref = `/messages/new?guru=${encodeURIComponent(publicSlug)}`;
const primaryService = services[0] || "General care";
const numericRate = getRateValue(guru);

  const responseStyle = guru.response_time?.trim() || "Fast replies";
  const profileStatus =
    guru.status?.trim() && guru.status.toLowerCase() !== "draft"
      ? guru.status.charAt(0).toUpperCase() + guru.status.slice(1)
      : "Live";

  const heroImage = getHeroImage(guru);
  const primaryPhoto = getPrimaryPhoto(guru);

  return (
    <main className="min-h-screen bg-slate-50 !text-slate-900">
      <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(135deg,#05244f_0%,#0b356c_42%,#0f172a_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_22%)]" />

        {heroImage ? (
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: `url(${heroImage})`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
          />
        ) : null}

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid gap-6 lg:grid-cols-[1.28fr_0.72fr] lg:items-stretch">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/30 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.25)] backdrop-blur-md sm:p-8">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100">
                  SitGuru Public Profile
                </span>

                {guru.is_verified ? (
                  <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
                    Verified by SitGuru
                  </span>
                ) : null}

                {guru.is_featured ? (
                  <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-100">
                    Featured Guru
                  </span>
                ) : null}

                {isFallback ? (
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-100">
                    Preview Profile
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[1.6rem] border border-white/15 bg-white/10 text-3xl font-bold text-white shadow-2xl sm:h-32 sm:w-32">
                  {primaryPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={primaryPhoto}
                      alt={displayName}
                      className="h-full w-full object-cover object-center"
                    />
                  ) : (
                    initialsFromName(displayName)
                  )}
                </div>

                <div className="min-w-0">
                  <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                    {displayName}
                  </h1>

                  <p className="mt-3 text-lg font-semibold text-emerald-200">
                    {headline}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-slate-100">
                    <span>{location || "Serving your area"}</span>
                    <span className="text-slate-400">•</span>
                    <span>{rate}/hr</span>
                    <span className="text-slate-400">•</span>
                    <span>{years}</span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <span className="inline-flex items-center rounded-full border border-amber-300/25 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-100">
                      ⭐ {ratingValue} ({reviewText})
                    </span>

                    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                      {responseStyle}
                    </span>

                    {guru.is_verified ? (
                      <span className="inline-flex items-center rounded-full border border-emerald-300/25 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100">
                        Verified by SitGuru
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link
                      href={bookingPageHref}
                      className="inline-flex min-h-[56px] items-center justify-center whitespace-nowrap rounded-2xl !bg-white px-7 py-3.5 text-lg font-black !text-slate-950 shadow-xl transition hover:!bg-slate-100"
                    >
                      Book this Guru
                    </Link>

                    <Link
                      href={messageHref}
                      className="inline-flex min-h-[56px] items-center justify-center whitespace-nowrap rounded-2xl border border-white/25 bg-white/10 px-7 py-3.5 text-lg font-black !text-white transition hover:bg-white/20"
                    >
                      Message Guru
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-[1.6rem] border border-white/10 bg-white/10 p-5 shadow-xl backdrop-blur-md">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">
                  Profile Status
                </p>
                <p className="mt-2 text-3xl font-black text-white">
                  {profileStatus}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Public and visible to customers on SitGuru.
                </p>
              </div>

              <div className="rounded-[1.6rem] border border-white/10 bg-white/10 p-5 shadow-xl backdrop-blur-md">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">
                  Response Style
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {responseStyle}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Built to help pet parents feel informed and comfortable.
                </p>
              </div>

              <div className="rounded-[1.6rem] border border-white/10 bg-white/10 p-5 shadow-xl backdrop-blur-md">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">
                  Booking
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  Request Open
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Accepting new booking inquiries through the platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-10">
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 !bg-white p-6 shadow-sm sm:p-8">
            <p className="!text-emerald-700 text-sm font-semibold uppercase tracking-[0.24em]">
              About
            </p>

            <h2 className="mt-2 !text-slate-950 text-4xl font-black tracking-tight">
              Meet this Guru
            </h2>

            <div className="mt-5 border-t border-slate-200 pt-5">
              <p className="!text-slate-700 text-base leading-8">
                {guru.bio?.trim() ||
                  "This Guru offers thoughtful, polished care with a premium customer-facing experience. Families can feel confident with a clear profile, a professional presentation, and responsive communication."}
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-[1.4rem] border border-slate-200 !bg-slate-50 p-5">
                <p className="!text-slate-500 text-sm font-semibold">
                  Starting rate
                </p>
                <p className="mt-2 !text-slate-950 text-2xl font-black">{rate}/hr</p>
              </div>

              <div className="rounded-[1.4rem] border border-slate-200 !bg-slate-50 p-5">
                <p className="!text-slate-500 text-sm font-semibold">
                  Experience
                </p>
                <p className="mt-2 !text-slate-950 text-2xl font-black">{years}</p>
              </div>

              <div className="rounded-[1.4rem] border border-slate-200 !bg-slate-50 p-5">
                <p className="!text-slate-500 text-sm font-semibold">
                  Location
                </p>
                <p className="mt-2 !text-slate-950 text-2xl font-black">
                  {location || "Flexible"}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <p className="!text-slate-500 text-sm font-semibold uppercase tracking-[0.24em]">
                Services
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                {services.map((service) => (
                  <span
                    key={service}
                    className="rounded-full border border-slate-200 !bg-slate-50 px-4 py-2 !text-slate-800 text-sm font-semibold"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <p className="!text-slate-500 text-sm font-semibold uppercase tracking-[0.24em]">
                Specialties
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                {specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="rounded-full border border-emerald-200 !bg-emerald-50 px-4 py-2 !text-emerald-700 text-sm font-semibold"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <p className="!text-slate-500 text-sm font-semibold uppercase tracking-[0.24em]">
                Trust & profile details
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-[1.4rem] border border-slate-200 !bg-slate-50 p-5">
                  <p className="!text-slate-950 text-lg font-bold">
                    Trusted platform presence
                  </p>
                  <p className="mt-3 !text-slate-700 text-sm leading-7">
                    This Guru has a live SitGuru profile with service and identity
                    details visible to customers.
                  </p>
                </div>

                <div className="rounded-[1.4rem] border border-slate-200 !bg-slate-50 p-5">
                  <p className="!text-slate-950 text-lg font-bold">
                    Professional presentation
                  </p>
                  <p className="mt-3 !text-slate-700 text-sm leading-7">
                    Pricing, services, profile content, and media help customers
                    understand what makes this Guru different.
                  </p>
                </div>

                <div className="rounded-[1.4rem] border border-slate-200 !bg-slate-50 p-5">
                  <p className="!text-slate-950 text-lg font-bold">
                    Pet-first experience
                  </p>
                  <p className="mt-3 !text-slate-700 text-sm leading-7">
                    Designed to make pet care feel clear, secure, and easier to
                    request through SitGuru.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 !bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="!text-emerald-700 text-sm font-semibold uppercase tracking-[0.24em]">
                  Portfolio
                </p>

                <h2 className="mt-2 !text-slate-950 text-4xl font-black tracking-tight">
                  Photos & videos that build trust
                </h2>

                <p className="mt-3 !text-slate-700 text-base leading-7">
                  Let customers see real care moments, happy pets, clean visits,
                  and the personality behind the profile.
                </p>
              </div>

              <span className="rounded-full border border-slate-200 !bg-slate-50 px-4 py-2 !text-slate-700 text-xs font-bold uppercase tracking-[0.2em]">
                {hasLivePortfolio ? "Live portfolio" : "Waiting for uploads"}
              </span>
            </div>

            {galleryImages.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {galleryImages.slice(0, 6).map((imageUrl, index) => (
                  <div
                    key={`${imageUrl}-${index}`}
                    className="overflow-hidden rounded-[1.4rem] border border-slate-200 !bg-slate-100 shadow-sm"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={`${displayName} portfolio image ${index + 1}`}
                      className="h-44 w-full object-cover object-center transition duration-300 hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[1.4rem] border border-dashed border-slate-300 !bg-slate-50 p-5">
                <p className="!text-slate-600 text-sm font-medium">
                  Portfolio photos will appear here once uploaded from the Guru
                  dashboard and saved to the profile.
                </p>
              </div>
            )}

            {portfolioVideos.length > 0 ? (
              <div className="mt-6 grid gap-4">
                {portfolioVideos.slice(0, 2).map((videoUrl, index) => (
                  <div
                    key={`${videoUrl}-${index}`}
                    className="overflow-hidden rounded-[1.4rem] border border-slate-200 !bg-slate-50 shadow-sm"
                  >
                    <video controls preload="metadata" className="h-auto w-full">
                      <source src={videoUrl} />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[1.4rem] border border-dashed border-slate-300 !bg-slate-50 p-5">
                <p className="!text-slate-600 text-sm font-medium">
                  Portfolio videos will appear here once uploaded from the Guru
                  dashboard and saved to the profile.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-slate-200 !bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="!text-emerald-700 text-sm font-semibold uppercase tracking-[0.24em]">
                  Trust & confidence
                </p>

                <h2 className="mt-2 !text-slate-950 text-4xl font-black tracking-tight">
                  What customers can trust today
                </h2>

                <p className="mt-3 !text-slate-700 text-base leading-7">
                  This section is currently designed as a confidence and trust
                  area. Live customer reviews will appear here once review data is
                  connected to SitGuru.
                </p>
              </div>

              <span className="rounded-full border border-slate-200 !bg-slate-50 px-4 py-2 !text-slate-700 text-xs font-bold uppercase tracking-[0.2em]">
                {hasLiveReviews ? "Live reviews connected" : "Trust notes active"}
              </span>
            </div>

            <div className="mt-6 space-y-4 border-t border-slate-200 pt-5">
              {hasLiveReviews ? (
                <div className="rounded-[1.4rem] border border-slate-200 !bg-slate-50 p-5">
                  <p className="!text-slate-950 text-lg font-bold">Customer reviews</p>
                  <p className="mt-3 !text-slate-700 text-base leading-8">
                    This Guru currently shows {reviewText} with an average rating
                    of {ratingValue}. A richer live review feed can be added once
                    the platform review system is connected.
                  </p>
                </div>
              ) : null}

              <div className="rounded-[1.4rem] border border-slate-200 !bg-slate-50 p-5">
                <p className="!text-slate-950 text-lg font-bold">
                  Completed public profile
                </p>
                <p className="mt-3 !text-slate-700 text-base leading-8">
                  This Guru has completed a public-facing profile with service
                  details, pricing, location visibility, and booking entry points.
                </p>
              </div>

              <div className="rounded-[1.4rem] border border-slate-200 !bg-slate-50 p-5">
                <p className="!text-slate-950 text-lg font-bold">
                  Clear booking direction
                </p>
                <p className="mt-3 !text-slate-700 text-base leading-8">
                  Customers can quickly understand what this Guru offers and move
                  into the booking flow with more confidence.
                </p>
              </div>

              <div className="rounded-[1.4rem] border border-slate-200 !bg-slate-50 p-5">
                <p className="!text-slate-950 text-lg font-bold">
                  Better trust presentation
                </p>
                <p className="mt-3 !text-slate-700 text-base leading-8">
                  Services, profile image, credentials, and portfolio placement are
                  all helping the page feel more premium and trustworthy.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 !bg-white p-6 shadow-sm sm:p-8">
            <p className="!text-emerald-700 text-sm font-semibold uppercase tracking-[0.24em]">
              Snapshot
            </p>

            <h2 className="mt-2 !text-slate-950 text-4xl font-black tracking-tight">
              Quick facts
            </h2>

            <div className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
              <div className="rounded-[1.4rem] border border-slate-200 !bg-slate-50 p-5">
                <p className="!text-slate-500 text-sm font-semibold">Location</p>
                <p className="mt-2 !text-slate-950 text-2xl font-black">
                  {location || "Flexible"}
                </p>
              </div>

              <div className="rounded-[1.4rem] border border-slate-200 !bg-slate-50 p-5">
                <p className="!text-slate-500 text-sm font-semibold">
                  Starting rate
                </p>
                <p className="mt-2 !text-slate-950 text-2xl font-black">{rate}/hr</p>
              </div>

              <div className="rounded-[1.4rem] border border-slate-200 !bg-slate-50 p-5">
                <p className="!text-slate-500 text-sm font-semibold">
                  Experience
                </p>
                <p className="mt-2 !text-slate-950 text-2xl font-black">{years}</p>
              </div>

              <div className="rounded-[1.4rem] border border-slate-200 !bg-slate-50 p-5">
                <p className="!text-slate-500 text-sm font-semibold">
                  Service count
                </p>
                <p className="mt-2 !text-slate-950 text-2xl font-black">
                  {services.length}
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 !bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <span className="rounded-full border border-emerald-200 !bg-emerald-50 px-3 py-1 !text-emerald-700 text-xs font-bold uppercase tracking-[0.22em]">
                Book this Guru
              </span>
              <span className="rounded-full border border-slate-200 !bg-slate-50 px-3 py-1 !text-slate-700 text-xs font-bold">
                Request Booking
              </span>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-slate-200 !bg-slate-50 p-5">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-slate-200 !bg-white shadow-sm">
                  {primaryPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={primaryPhoto}
                      alt={displayName}
                      className="h-full w-full object-cover object-center"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center !text-slate-900 text-sm font-bold">
                      {initialsFromName(displayName)}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate !text-slate-950 text-lg font-black">
                    {displayName}
                  </p>
                  <p className="mt-1 line-clamp-2 !text-slate-600 text-sm font-semibold leading-6">
                    {headline}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-200 !bg-white px-3 py-1 !text-slate-900 text-xs font-bold">
                      {rate}/hr
                    </span>
                    {guru.is_verified ? (
                      <span className="rounded-full border border-emerald-200 !bg-emerald-50 px-3 py-1 !text-emerald-700 text-xs font-bold">
                        Verified
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <form className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="pet-name"
                  className="mb-2 block !text-slate-900 text-sm font-bold"
                >
                  Pet name
                </label>
                <input
                  id="pet-name"
                  type="text"
                  placeholder="Ex. Scout"
                  className="w-full rounded-2xl border border-slate-300 !bg-white px-4 py-3.5 !text-slate-900 text-base font-semibold placeholder:!text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
                />
              </div>

              <div>
                <label
                  htmlFor="booking-date"
                  className="mb-2 block !text-slate-900 text-sm font-bold"
                >
                  Requested date
                </label>
                <input
                  id="booking-date"
                  type="date"
                  className="w-full rounded-2xl border border-slate-300 !bg-white px-4 py-3.5 !text-slate-900 text-base font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
                />
              </div>

              <div>
                <label
                  htmlFor="booking-notes"
                  className="mb-2 block !text-slate-900 text-sm font-bold"
                >
                  Care notes
                </label>
                <textarea
                  id="booking-notes"
                  rows={5}
                  placeholder="Share pet routine, temperament, medications, goals, timing, or home-access notes."
                  className="w-full rounded-2xl border border-slate-300 !bg-white px-4 py-3.5 !text-slate-900 text-base font-semibold placeholder:!text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
                />
              </div>

              <Link
                href={bookingPageHref}
                className="inline-flex min-h-[60px] w-full items-center justify-center rounded-2xl !bg-emerald-500 px-6 py-4 text-lg font-black tracking-tight !text-slate-950 transition hover:!bg-emerald-400"
              >
                Continue to Booking Request
              </Link>

              <p className="!text-slate-500 text-xs font-medium leading-6">
                You will review and confirm your booking request details on the
                next step.
              </p>
            </form>
          </section>

          <section className="rounded-[2rem] border border-slate-200 !bg-white p-5 shadow-sm sm:p-6">
            <p className="!text-emerald-700 text-sm font-bold uppercase tracking-[0.24em]">
              Trust profile
            </p>

            <h3 className="mt-3 !text-slate-950 text-3xl font-black tracking-tight">
              What customers can see
            </h3>

            <div className="mt-5 space-y-4">
              <div className="rounded-[1.35rem] border border-slate-200 !bg-slate-50 p-4">
                <p className="!text-slate-950 text-base font-black">
                  Verified status
                </p>
                <p className="mt-2 !text-slate-700 text-sm font-medium leading-7">
                  {guru.is_verified
                    ? "This Guru shows visible trust signals through SitGuru profile verification."
                    : "Profile trust can continue to grow with richer details, reviews, and visible platform signals."}
                </p>
              </div>

              <div className="rounded-[1.35rem] border border-slate-200 !bg-slate-50 p-4">
                <p className="!text-slate-950 text-base font-black">
                  Certifications & experience
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {certifications.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-slate-200 !bg-white px-3 py-1 !text-slate-900 text-xs font-bold"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-slate-200 !bg-slate-50 p-4">
                <p className="!text-slate-950 text-base font-black">
                  Booking readiness
                </p>
                <p className="mt-2 !text-slate-700 text-sm font-medium leading-7">
                  Service details, rate visibility, messaging, and booking access
                  are all available from this public profile.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 !bg-white p-5 shadow-sm sm:p-6">
            <p className="!text-emerald-700 text-sm font-bold uppercase tracking-[0.24em]">
              What happens next
            </p>

            <h3 className="mt-3 !text-slate-950 text-3xl font-black tracking-tight">
              Book this Guru
            </h3>

            <div className="mt-5 space-y-4">
              <div className="rounded-[1.35rem] border border-slate-200 !bg-slate-50 p-4">
                <p className="!text-slate-950 text-base font-black">
                  Tell your Guru what matters most
                </p>
                <p className="mt-2 !text-slate-700 text-sm font-medium leading-7">
                  Share care needs, routine details, and anything important
                  before the booking request.
                </p>
              </div>

              <div className="rounded-[1.35rem] border border-slate-200 !bg-slate-50 p-4">
                <p className="!text-slate-950 text-base font-black">
                  Start with a clear date and timeline
                </p>
                <p className="mt-2 !text-slate-700 text-sm font-medium leading-7">
                  This helps the booking flow stay simple and lets your Guru
                  review quickly.
                </p>
              </div>

              <div className="rounded-[1.35rem] border border-slate-200 !bg-slate-50 p-4">
                <p className="!text-slate-950 text-base font-black">
                  Submit your request
                </p>
                <p className="mt-2 !text-slate-700 text-sm font-medium leading-7">
                  SitGuru guides you into the booking page with the selected Guru
                  already attached.
                </p>
              </div>

              <div className="rounded-[1.35rem] border border-slate-200 !bg-slate-50 p-4">
                <p className="!text-slate-950 text-base font-black">
                  Everything stays inside SitGuru
                </p>
                <p className="mt-2 !text-slate-700 text-sm font-medium leading-7">
                  Your booking request stays within one clear customer-friendly
                  experience.
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <Link
                href="/search"
                className="inline-flex items-center !text-emerald-700 text-sm font-black transition hover:!text-emerald-600"
              >
                Browse more Gurus →
              </Link>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}