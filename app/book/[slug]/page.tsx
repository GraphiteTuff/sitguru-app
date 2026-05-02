import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import BookGuruClient from "./BookGuruClient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type GuruCalendarRow = {
  guru_slug?: string | null;
  guru_name?: string | null;
  cal_username?: string | null;
  cal_event_type_slug?: string | null;
  active?: boolean | null;
};

type GuruRow = {
  id: string;
  user_id?: string | null;
  slug?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  profile_photo_url?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
  rating_avg?: number | null;
  review_count?: number | null;
  hourly_rate?: number | null;
  rate?: number | null;
  years_experience?: number | null;
  completed_bookings?: number | null;
  response_rate?: number | null;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function asNullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function compactSlug(value: string) {
  return normalizeSlug(value).replace(/-/g, "");
}

function titleFromSlug(slug: string) {
  return slug
    .trim()
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function createNameSlug(value?: string | null) {
  return normalizeSlug(value || "");
}

function createFallbackCalendarUsername(slug: string) {
  return normalizeSlug(slug || "sitguru-booking");
}

function normalizeGuruRow(row: Record<string, unknown>): GuruRow | null {
  const id = asString(row.id);

  if (!id) return null;

  return {
    id,
    user_id: asNullableString(row.user_id),
    slug: asNullableString(row.slug),
    display_name: asNullableString(row.display_name),
    full_name: asNullableString(row.full_name),
    bio: asNullableString(row.bio),
    city: asNullableString(row.city),
    state: asNullableString(row.state),
    zip_code: asNullableString(row.zip_code),
    profile_photo_url: asNullableString(row.profile_photo_url),
    photo_url: asNullableString(row.photo_url),
    avatar_url: asNullableString(row.avatar_url),
    image_url: asNullableString(row.image_url),
    rating_avg: asNullableNumber(row.rating_avg),
    review_count: asNullableNumber(row.review_count),
    hourly_rate: asNullableNumber(row.hourly_rate),
    rate: asNullableNumber(row.rate),
    years_experience: asNullableNumber(row.years_experience),
    completed_bookings: asNullableNumber(row.completed_bookings),
    response_rate: asNullableNumber(row.response_rate),
  };
}

function getGuruPhotoUrl(guru: GuruRow | null) {
  return (
    guru?.profile_photo_url ||
    guru?.photo_url ||
    guru?.avatar_url ||
    guru?.image_url ||
    ""
  );
}

function guruMatchesSlug(guru: GuruRow, requestedSlug: string) {
  const requestedSlugNormal = normalizeSlug(requestedSlug);
  const requestedSlugCompact = compactSlug(requestedSlug);
  const requestedName = titleFromSlug(requestedSlug);

  const candidates = [
    guru.slug,
    guru.display_name,
    guru.full_name,
    createNameSlug(guru.display_name),
    createNameSlug(guru.full_name),
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return candidates.some((candidate) => {
    const candidateNormal = normalizeSlug(candidate);
    const candidateCompact = compactSlug(candidate);
    const candidateName = candidate.toLowerCase().trim();

    return (
      candidateNormal === requestedSlugNormal ||
      candidateCompact === requestedSlugCompact ||
      candidateName === requestedName
    );
  });
}

async function findGuruBySlugOrName(slug: string) {
  const cleanedSlug = slug.trim();
  const cleanedSlugNormal = normalizeSlug(cleanedSlug);
  const cleanedSlugCompact = compactSlug(cleanedSlug);
  const nameFromSlug = titleFromSlug(cleanedSlug);

  const directSlugResult = await supabaseAdmin
    .from("gurus")
    .select("*")
    .ilike("slug", cleanedSlug)
    .limit(1);

  if (directSlugResult.error) {
    console.error("Book Guru direct slug lookup failed:", {
      slug: cleanedSlug,
      error: directSlugResult.error,
    });
  }

  const directSlugGuru = normalizeGuruRow(
    (directSlugResult.data?.[0] || {}) as Record<string, unknown>,
  );

  if (directSlugGuru?.id) return directSlugGuru;

  const normalizedSlugResult = await supabaseAdmin
    .from("gurus")
    .select("*")
    .ilike("slug", cleanedSlugNormal)
    .limit(1);

  if (normalizedSlugResult.error) {
    console.error("Book Guru normalized slug lookup failed:", {
      slug: cleanedSlugNormal,
      error: normalizedSlugResult.error,
    });
  }

  const normalizedSlugGuru = normalizeGuruRow(
    (normalizedSlugResult.data?.[0] || {}) as Record<string, unknown>,
  );

  if (normalizedSlugGuru?.id) return normalizedSlugGuru;

  const displayNameResult = await supabaseAdmin
    .from("gurus")
    .select("*")
    .ilike("display_name", nameFromSlug)
    .limit(1);

  if (displayNameResult.error) {
    console.error("Book Guru display name lookup failed:", {
      nameFromSlug,
      error: displayNameResult.error,
    });
  }

  const displayNameGuru = normalizeGuruRow(
    (displayNameResult.data?.[0] || {}) as Record<string, unknown>,
  );

  if (displayNameGuru?.id) return displayNameGuru;

  const fullNameResult = await supabaseAdmin
    .from("gurus")
    .select("*")
    .ilike("full_name", nameFromSlug)
    .limit(1);

  if (fullNameResult.error) {
    console.error("Book Guru full name lookup failed:", {
      nameFromSlug,
      error: fullNameResult.error,
    });
  }

  const fullNameGuru = normalizeGuruRow(
    (fullNameResult.data?.[0] || {}) as Record<string, unknown>,
  );

  if (fullNameGuru?.id) return fullNameGuru;

  const allGurusResult = await supabaseAdmin
    .from("gurus")
    .select("*")
    .limit(1000);

  if (allGurusResult.error) {
    console.error("Book Guru fallback all-gurus lookup failed:", {
      slug: cleanedSlug,
      error: allGurusResult.error,
    });

    return null;
  }

  const allGurus = (allGurusResult.data || [])
    .map((row) => normalizeGuruRow(row as Record<string, unknown>))
    .filter(Boolean) as GuruRow[];

  return (
    allGurus.find((guru) => guruMatchesSlug(guru, cleanedSlug)) ||
    allGurus.find((guru) => compactSlug(guru.slug || "") === cleanedSlugCompact) ||
    null
  );
}

async function findCalendarSettings(slug: string, fallbackName: string) {
  const normalizedSlug = normalizeSlug(slug);

  const calendarBySlug = await supabaseAdmin
    .from("guru_calendar_settings")
    .select("*")
    .ilike("guru_slug", slug)
    .eq("active", true)
    .limit(1);

  if (calendarBySlug.error) {
    console.error("Book Guru calendar slug lookup failed:", {
      slug,
      error: calendarBySlug.error,
    });
  }

  if (calendarBySlug.data?.[0]) {
    return calendarBySlug.data[0] as GuruCalendarRow;
  }

  const calendarByNormalizedSlug = await supabaseAdmin
    .from("guru_calendar_settings")
    .select("*")
    .ilike("guru_slug", normalizedSlug)
    .eq("active", true)
    .limit(1);

  if (calendarByNormalizedSlug.error) {
    console.error("Book Guru normalized calendar slug lookup failed:", {
      normalizedSlug,
      error: calendarByNormalizedSlug.error,
    });
  }

  if (calendarByNormalizedSlug.data?.[0]) {
    return calendarByNormalizedSlug.data[0] as GuruCalendarRow;
  }

  const calendarByName = await supabaseAdmin
    .from("guru_calendar_settings")
    .select("*")
    .ilike("guru_name", fallbackName)
    .eq("active", true)
    .limit(1);

  if (calendarByName.error) {
    console.error("Book Guru calendar name lookup failed:", {
      fallbackName,
      error: calendarByName.error,
    });
  }

  return (calendarByName.data?.[0] || null) as GuruCalendarRow | null;
}

export default async function BookGuruPage({ params }: PageProps) {
  const { slug } = await params;

  const guruProfile = await findGuruBySlugOrName(slug);

  if (!guruProfile?.id) {
    console.error("Book Guru page could not find matching Guru profile:", {
      slug,
    });

    notFound();
  }

  const guruName = guruProfile.display_name || guruProfile.full_name || "SitGuru";
  const resolvedGuruSlug = guruProfile.slug || normalizeSlug(guruName) || slug;

  const calendarGuru = await findCalendarSettings(resolvedGuruSlug, guruName);

  const finalGuruSlug =
    calendarGuru?.guru_slug || guruProfile.slug || resolvedGuruSlug || slug;

  const resolvedCalendarUsername =
    calendarGuru?.cal_username || createFallbackCalendarUsername(finalGuruSlug);

  const resolvedCalendarEventTypeSlug =
    calendarGuru?.cal_event_type_slug || "sitguru-booking-request";

  return (
    <BookGuruClient
      guruId={guruProfile.id}
      guruSlug={finalGuruSlug}
      guruName={guruName}
      calUsername={resolvedCalendarUsername}
      calEventTypeSlug={resolvedCalendarEventTypeSlug}
      initialGuruPhotoUrl={getGuruPhotoUrl(guruProfile)}
      initialGuruBio={guruProfile.bio || ""}
      initialGuruCity={guruProfile.city || ""}
      initialGuruState={guruProfile.state || ""}
      initialGuruRatingAvg={guruProfile.rating_avg ?? null}
      initialGuruReviewCount={guruProfile.review_count ?? null}
      initialGuruHourlyRate={guruProfile.hourly_rate ?? guruProfile.rate ?? null}
      initialGuruYearsExperience={guruProfile.years_experience ?? null}
      initialGuruCompletedBookings={guruProfile.completed_bookings ?? null}
      initialGuruResponseRate={guruProfile.response_rate ?? null}
    />
  );
}