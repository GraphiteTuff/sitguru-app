import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import GuruProfileAnalytics from "./GuruProfileAnalytics";
import GuruQuickBookingForm from "./GuruQuickBookingForm";
import BookThisGuruButton from "./BookThisGuruButton";

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
    "sitguru-pro":
      "Trusted premium pet care with a polished customer experience.",
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

function getTodayInputValue() {
  return new Date().toISOString().split("T")[0];
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
  const messageHref = `/messages/new?guru=${encodeURIComponent(publicSlug)}`;
  const primaryService = services[0] || "General care";
  const bookingServices = Array.from(
    new Set([primaryService, ...services, "General care"])
  );
  const numericRate = getRateValue(guru);
  const responseStyle = guru.response_time?.trim() || "Fast replies";
  const profileStatus =
    guru.status?.trim() && guru.status.toLowerCase() !== "draft"
      ? guru.status.charAt(0).toUpperCase() + guru.status.slice(1)
      : "Live";

  const heroImage = getHeroImage(guru);
  const primaryPhoto = getPrimaryPhoto(guru);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_45%,#eefdf6_100%)] pb-24 !text-slate-950 antialiased sm:pb-0 [&&_h1]:!text-slate-950 [&&_h2]:!text-slate-950 [&&_h3]:!text-slate-950 [&&_h4]:!text-slate-950 [&&_p]:!text-slate-800 [&&_label]:!text-slate-950 [&&_input]:!text-slate-950 [&&_select]:!text-slate-950 [&&_textarea]:!text-slate-950 [&&_option]:!text-slate-950 [&&_input::placeholder]:!text-slate-500 [&&_textarea::placeholder]:!text-slate-500">
      <GuruProfileAnalytics
        guruId={guru.id}
        guruSlug={publicSlug}
        guruName={displayName}
        guruLocation={location || "Serving your area"}
        primaryService={primaryService}
        hourlyRate={numericRate}
        isFallback={isFallback}
      />

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
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
        <div className="grid gap-6 lg:grid-cols-[1fr_390px] xl:grid-cols-[1fr_430px]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
              <div className="grid gap-0 lg:grid-cols-[260px_1fr]">
                <div className="relative min-h-[260px] bg-slate-100 lg:min-h-full">
                  {primaryPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={primaryPhoto}
                      alt={displayName}
                      className="h-full min-h-[260px] w-full object-cover object-center"
                    />
                  ) : (
                    <div className="flex h-full min-h-[260px] w-full items-center justify-center bg-slate-100 text-4xl font-black !text-slate-600">
                      {initialsFromName(displayName)}
                    </div>
                  )}

                  <div className="absolute bottom-4 left-4 rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-lg">
                    ⭐ {guru.is_featured ? "Featured Guru" : "Trusted Guru"}
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black uppercase tracking-[0.16em] !text-emerald-700 ring-1 ring-emerald-100">
                      {profileStatus}
                    </span>

                    {guru.is_verified ? (
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-black !text-sky-700 ring-1 ring-sky-100">
                        🛡️ Verified Guru
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-50 px-3 py-1 text-sm font-black !text-slate-800 ring-1 ring-slate-200">
                        Profile reviewed
                      </span>
                    )}

                    {isFallback ? (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-black !text-amber-700 ring-1 ring-amber-100">
                        Preview Profile
                      </span>
                    ) : null}
                  </div>

                  <h1 className="mt-4 text-5xl font-black tracking-[-0.045em] !text-slate-950 sm:text-6xl">
                    {displayName}
                  </h1>

                  <p className="mt-2 text-2xl font-semibold !text-slate-800">
                    {headline}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold !text-slate-800">
                    <span>📍 {location || "Serving your area"}</span>
                    <span className="hidden !text-slate-500 sm:inline">|</span>
                    <span>{rate === "Rate pending" ? rate : `${rate}/hr`}</span>
                    <span className="hidden !text-slate-500 sm:inline">|</span>
                    <span>{years}</span>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-4 py-2 text-sm font-black !text-amber-700 ring-1 ring-amber-100">
                      ⭐ {ratingValue} ({reviewText})
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-50 px-4 py-2 text-sm font-black !text-slate-700 ring-1 ring-slate-200">
                      {responseStyle}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-black !text-emerald-700 ring-1 ring-emerald-100">
                      {years} experience
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
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

                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <BookThisGuruButton />

                    <Link
                      href={messageHref}
                      className="inline-flex min-h-[56px] min-w-[172px] items-center justify-center rounded-full border border-slate-200 bg-white px-8 py-3 text-base font-black !text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:!text-emerald-700 hover:shadow-md"
                    >
                      Message Guru
                    </Link>

                    <Link
                      href="/search"
                      className="inline-flex h-[56px] w-[56px] items-center justify-center rounded-full border border-slate-200 bg-white text-2xl font-black !text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:!text-emerald-700 hover:shadow-md"
                      aria-label="Save Guru"
                    >
                      ♡
                    </Link>

                    <Link
                      href={`/search?service=${encodeURIComponent(primaryService)}`}
                      className="inline-flex h-[56px] w-[56px] items-center justify-center rounded-full border border-slate-200 bg-white text-2xl font-black !text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:!text-emerald-700 hover:shadow-md"
                      aria-label="Share or browse related Gurus"
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

              <p className="mt-5 max-w-3xl text-lg font-medium leading-8 !text-slate-800">
                {guru.bio?.trim() ||
                  "This Guru offers thoughtful, polished care with a premium customer-facing experience. Families can feel confident with a clear profile, a professional presentation, and responsive communication."}
              </p>

              <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Starting rate", value: rate === "Rate pending" ? rate : `${rate}/hr` },
                  { label: "Experience", value: years },
                  { label: "Response style", value: responseStyle },
                  { label: "Location", value: location || "Location pending" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-5"
                  >
                    <p className="text-sm font-bold !text-slate-700">{item.label}</p>
                    <p className="mt-2 text-xl font-black !text-slate-950">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <p className="text-sm font-black uppercase tracking-[0.22em] !text-slate-700">
                  Services
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((service) => (
                    <div key={service} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 !text-emerald-700 ring-1 ring-emerald-100">
                        🐾
                      </span>
                      <span className="text-sm font-bold !text-slate-800">{service}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <p className="text-sm font-black uppercase tracking-[0.22em] !text-slate-700">
                  Specialties
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black !text-emerald-700"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <p className="text-sm font-black uppercase tracking-[0.22em] !text-slate-700">
                  Why Pet Parents trust {displayName}
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {[
                    {
                      title: "Verified & trusted",
                      copy: guru.is_verified
                        ? "This Guru shows visible trust signals through SitGuru profile verification."
                        : "Profile trust can continue to grow with richer details, reviews, and platform signals.",
                      icon: "🛡️",
                    },
                    {
                      title: "Professional care",
                      copy: "Services, pricing, profile content, and media help customers understand what makes this Guru different.",
                      icon: "⭐",
                    },
                    {
                      title: "Happy pets",
                      copy: "Designed to make pet care feel clear, secure, and easier to request through SitGuru.",
                      icon: "💚",
                    },
                  ].map((item) => (
                    <div key={item.title} className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-xl ring-1 ring-emerald-100">
                        {item.icon}
                      </div>
                      <p className="mt-4 text-base font-black !text-slate-950">{item.title}</p>
                      <p className="mt-2 text-sm font-semibold leading-7 !text-slate-800">{item.copy}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

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
                    Let customers see happy pets, clean visits, and the personality behind the profile.
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
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
                    Portfolio photos will appear here once uploaded from the Guru dashboard and saved to the profile.
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
              ) : (
                <div className="mt-4 rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 p-5">
                  <p className="text-sm font-semibold !text-slate-800">
                    Portfolio videos will appear here once uploaded from the Guru dashboard and saved to the profile.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.22em] !text-emerald-700">
                Quick facts
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight !text-slate-950">
                Snapshot
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "Location", value: location || "Location pending", icon: "📍" },
                  { label: "Experience", value: years, icon: "📅" },
                  { label: "Starting rate", value: rate === "Rate pending" ? rate : `${rate}/hr`, icon: "💳" },
                  { label: "Service count", value: String(services.length), icon: "🐾" },
                  { label: "Response time", value: responseStyle, icon: "💬" },
                  { label: "Reviews", value: reviewText, icon: "⭐" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4 rounded-[1.35rem] border border-slate-200 bg-slate-50 p-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl ring-1 ring-slate-200">
                      {item.icon}
                    </span>
                    <div>
                      <p className="text-sm font-bold !text-slate-700">{item.label}</p>
                      <p className="mt-1 text-lg font-black !text-slate-950">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <section
              id="booking-panel"
              tabIndex={-1}
              className="scroll-mt-28 overflow-hidden rounded-[2rem] border border-emerald-200 bg-white shadow-[0_22px_65px_rgba(15,118,110,0.12)] outline-none transition-all duration-300"
            >
              <div className="border-b border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_100%)] p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-sm font-black uppercase tracking-[0.22em] !text-emerald-700">
                    Step 1 of 3
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-bold !text-slate-700">
                    Request Booking
                  </span>
                </div>
                <h2 className="mt-4 text-3xl font-black tracking-tight !text-slate-950 sm:text-4xl">
                  Request care with {displayName}
                </h2>
                <p className="mt-2 text-sm font-semibold leading-7 !text-slate-700">
                  Add the care basics now. You will review the full request before checkout.
                </p>
              </div>

              <div className="[&&_h1]:!text-slate-950 [&&_h2]:!text-slate-950 [&&_h3]:!text-slate-950 [&&_p]:!text-slate-800 [&&_label]:!text-slate-950 [&&_input]:!text-slate-950 [&&_select]:!text-slate-950 [&&_textarea]:!text-slate-950 [&&_option]:!text-slate-950 [&&_input::placeholder]:!text-slate-500 [&&_textarea::placeholder]:!text-slate-500">
                <GuruQuickBookingForm
                  guruId={guru.id}
                  guruSlug={publicSlug}
                  guruName={displayName}
                  guruHeadline={headline}
                  guruPhotoUrl={primaryPhoto}
                  serviceOptions={bookingServices}
                  primaryService={primaryService}
                  hourlyRate={numericRate}
                  defaultCity={guru.city || ""}
                  defaultState={guru.state || ""}
                />
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl !text-emerald-700 ring-1 ring-emerald-100">
                  🔒
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight !text-slate-950">
                    Secure & private
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-7 !text-slate-700">
                    Your request is private and only shared with this Guru and SitGuru support when needed.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-sm font-black uppercase tracking-[0.22em] !text-emerald-700">
                Trust & credentials
              </p>
              <h3 className="mt-3 text-2xl font-black tracking-tight !text-slate-950">
                Confidence signals
              </h3>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {[
                  guru.is_verified ? "Verified profile" : "Profile reviewed",
                  profileStatus,
                  ...certifications.slice(0, 4),
                ].map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="flex items-center gap-2 text-sm font-bold !text-slate-700"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 !text-emerald-700 ring-1 ring-emerald-100">
                      ✓
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-sm font-black uppercase tracking-[0.22em] !text-emerald-700">
                What happens next
              </p>
              <h3 className="mt-3 text-2xl font-black tracking-tight !text-slate-950">
                Book this Guru
              </h3>

              <div className="mt-5 space-y-4">
                {[
                  {
                    step: "1",
                    title: "Submit your request",
                    copy: "Tell us about your pet and care needs.",
                  },
                  {
                    step: "2",
                    title: "Guru confirms",
                    copy: "This Guru will review availability and details.",
                  },
                  {
                    step: "3",
                    title: "You are all set",
                    copy: "Relax while your pet gets clear, loving care.",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3 rounded-[1.35rem] bg-slate-50 p-4 ring-1 ring-slate-200">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">
                      {item.step}
                    </span>
                    <div>
                      <p className="text-sm font-black !text-slate-950">{item.title}</p>
                      <p className="mt-1 text-sm font-semibold leading-6 !text-slate-800">{item.copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-6 grid gap-4 rounded-[2rem] border border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_100%)] p-5 shadow-sm md:grid-cols-4">
          {[
            { title: "Trusted pet care", copy: "Every Guru is presented with clear trust signals." , icon: "🛡️"},
            { title: "Personalized matches", copy: "Customers can find care based on pets, services, and location." , icon: "🐾"},
            { title: "Secure payments", copy: "Booking stays inside the SitGuru experience." , icon: "🔒"},
            { title: "Support when needed", copy: "SitGuru support is available for care questions." , icon: "🎧"},
          ].map((item) => (
            <div key={item.title} className="flex gap-3 rounded-[1.5rem] bg-white/80 p-4 ring-1 ring-emerald-100">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xl ring-1 ring-emerald-100">
                {item.icon}
              </span>
              <div>
                <p className="font-black !text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm font-semibold leading-6 !text-slate-800">{item.copy}</p>
              </div>
            </div>
          ))}
        </section>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100 bg-white/95 px-4 py-3 shadow-[0_-16px_40px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-7xl gap-3">
          <BookThisGuruButton
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