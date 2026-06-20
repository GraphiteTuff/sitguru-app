import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import GuruMediaUploader from "@/components/guru/GuruMediaUploader";
import AcademyGraduateBadge from "@/components/university/AcademyGraduateBadge";

export const dynamic = "force-dynamic";

const SITE_FONT_STYLE = {
  fontFamily:
    '"Open Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 300,
};

const FILL_IN_GURU_NAMES = new Set([
  "avery",
  "caleb",
  "darius",
  "emma",
  "jason",
  "maya",
  "nina",
  "olivia",
  "sofia",
  "suzy",
]);

type GuruProfile = {
  [key: string]: unknown;
  id?: string | number | null;
  user_id?: string | null;
  email?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  title?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  service_city?: string | null;
  service_state?: string | null;
  slug?: string | null;
  public_slug?: string | null;
  profile_id?: string | null;
  headline?: string | null;
  zip_code?: string | null;
  postal_code?: string | null;
  service_radius_miles?: number | null;
  service_radius?: number | null;
  radius_miles?: number | null;
  image_url?: string | null;
  avatar_url?: string | null;
  photo_url?: string | null;
  profile_photo_url?: string | null;
  video_url?: string | null;
  profile_video_url?: string | null;
  intro_video_url?: string | null;
  rate?: number | null;
  hourly_rate?: number | null;
  price?: number | null;
  services?: string[] | string | null;
  application_status?: string | null;
  status?: string | null;
  role?: string | null;
  account_type?: string | null;
  is_public?: boolean | null;
  is_active?: boolean | null;
  is_bookable?: boolean | null;
  is_verified?: boolean | null;
  stripe_account_id?: string | null;
  stripe_onboarding_complete?: boolean | null;
  payouts_enabled?: boolean | null;
  charges_enabled?: boolean | null;
  background_check_status?: string | null;
  background_check_fee_status?: string | null;
  background_check_fee_payment_option?: string | null;
  background_check_payment_plan_status?: string | null;
  background_check_reimbursement_status?: string | null;
  checkr_status?: string | null;
  checkr_invitation_id?: string | null;
  checkr_candidate_id?: string | null;
  profile_completion?: number | null;
  rating_avg?: number | null;
  rating?: number | null;
  review_count?: number | null;
  experience_years?: number | null;
};

type GuruServiceRateRow = {
  id?: string | null;
  guru_id?: string | number | null;
  service_key?: string | null;
  service_label?: string | null;
  is_enabled?: boolean | null;
  rate_amount?: number | string | null;
  rate_unit?: string | null;
  duration_minutes?: number | string | null;
  notes?: string | null;
};

type BookingRow = {
  id?: string | number | null;
  customer_id?: string | null;
  sitter_id?: string | number | null;
  guru_id?: string | number | null;
  status?: string | null;
  booking_status?: string | null;
  payment_status?: string | null;
  service?: string | null;
  service_type?: string | null;
  booking_type?: string | null;
  pet_name?: string | null;
  customer_name?: string | null;
  pet_parent_name?: string | null;
  start_time?: string | null;
  start_date?: string | null;
  booking_date?: string | null;
  created_at?: string | null;
};

type ConversationRow = {
  id: string;
  customer_id?: string | null;
  guru_id?: string | null;
  subject?: string | null;
  status?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  last_message_at?: string | null;
  last_message_preview?: string | null;
};

type MessageRow = {
  id: string;
  conversation_id?: string | null;
  sender_id?: string | null;
  recipient_id?: string | null;
  content?: string | null;
  body?: string | null;
  created_at?: string | null;
};

type ProfileRow = {
  id: string;
  full_name?: string | null;
  display_name?: string | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  role?: string | null;
  account_type?: string | null;
  profile_photo_url?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
};

type DashboardConversation = {
  id: string;
  name: string;
  role: string;
  subject: string;
  preview: string;
  lastActivity: string | null;
  href: string;
};

type GuruTier = {
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  stars: number;
  badgeClassName: string;
  cardClassName: string;
};

type GuruUniversityProgress = {
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
  academyButtonLabel: string;
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type ActiveUser = {
  id: string;
  email?: string | null;
};

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

function normalizeRole(value?: string | null) {
  const role = String(value || "")
    .trim()
    .toLowerCase();
  if (role === "provider" || role === "sitter") return "guru";
  return role;
}

function cleanIdentifier(value?: string | null) {
  return decodeURIComponent(String(value || "").trim());
}

function slugifyPublicIdentifier(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function compactPublicIdentifier(value?: string | null) {
  return slugifyPublicIdentifier(value).replace(/-/g, "");
}

function getIdentifierTokens(value?: string | null) {
  return slugifyPublicIdentifier(value)
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean);
}

function getSmallEditDistance(left: string, right: string, maxDistance = 2) {
  const a = compactPublicIdentifier(left);
  const b = compactPublicIdentifier(right);

  if (!a || !b) return Number.POSITIVE_INFINITY;
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > maxDistance) {
    return Number.POSITIVE_INFINITY;
  }

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let rowMinimum = current[0];

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost,
      );

      current[j] = value;
      rowMinimum = Math.min(rowMinimum, value);
    }

    if (rowMinimum > maxDistance) {
      return Number.POSITIVE_INFINITY;
    }

    for (let j = 0; j < current.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
}

function getGuruSlugCandidates(profile: GuruProfile | null) {
  if (!profile) return [];

  const firstName = String(profile.first_name || "").trim();
  const lastName = String(profile.last_name || "").trim();
  const combinedName = `${firstName} ${lastName}`.trim();
  const emailUser = profile.email?.split("@")[0] || "";

  const values = [
    profile.slug,
    profile.public_slug,
    profile.id != null ? String(profile.id) : null,
    profile.user_id,
    profile.profile_id,
    profile.full_name,
    profile.display_name,
    profile.name,
    combinedName,
    firstName && lastName ? `${lastName} ${firstName}` : null,
    emailUser,
    emailUser.replace(/[._-]+/g, " "),
  ];

  return Array.from(
    new Set(
      values
        .map((value) => slugifyPublicIdentifier(value))
        .filter(Boolean),
    ),
  );
}

function isIdentifierMatchForGuru(profile: GuruProfile | null, identifier: string) {
  const cleanedIdentifier = cleanIdentifier(identifier);
  const requestedSlug = slugifyPublicIdentifier(cleanedIdentifier);
  const requestedCompact = compactPublicIdentifier(cleanedIdentifier);
  const requestedTokens = getIdentifierTokens(cleanedIdentifier);
  const candidates = getGuruSlugCandidates(profile);

  if (!requestedSlug || !requestedCompact || !candidates.length) return false;

  if (
    candidates.some(
      (candidate) =>
        candidate === requestedSlug ||
        compactPublicIdentifier(candidate) === requestedCompact,
    )
  ) {
    return true;
  }

  const requestedLastToken = requestedTokens[requestedTokens.length - 1] || "";

  return candidates.some((candidate) => {
    const candidateTokens = getIdentifierTokens(candidate);
    const candidateLastToken = candidateTokens[candidateTokens.length - 1] || "";

    if (
      requestedLastToken &&
      candidateLastToken &&
      requestedLastToken !== candidateLastToken
    ) {
      return false;
    }

    return getSmallEditDistance(candidate, requestedSlug, 2) <= 2;
  });
}

function normalizeFillInMatchValue(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

function getFillInNameCandidates(profile: GuruProfile | null) {
  const values = [
    profile?.display_name,
    profile?.full_name,
    profile?.name,
    profile?.slug,
    profile?.email?.split("@")[0],
  ];

  return values
    .map((value) => normalizeFillInMatchValue(value))
    .filter(Boolean)
    .flatMap((value) => {
      const firstName = value.split(" ")[0] || "";
      const compact = value.replace(/\s+/g, "");
      return [value, firstName, compact].filter(Boolean);
    });
}

function isFillInGuruProfile(profile: GuruProfile | null) {
  return getFillInNameCandidates(profile).some((candidate) => {
    if (FILL_IN_GURU_NAMES.has(candidate)) return true;

    return Array.from(FILL_IN_GURU_NAMES).some((name) =>
      candidate.startsWith(name),
    );
  });
}

function isLikelyUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isLikelyNumericId(value: string) {
  return /^\d+$/.test(value);
}

function getDisplayNameFromEmail(email?: string | null) {
  if (!email) return "Guru";

  const cleaned = email
    .split("@")[0]
    .replace(/\d+/g, " ")
    .split(/[._\-\s]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

  return cleaned || "Guru";
}

function getFirstName(name?: string | null) {
  return (
    String(name || "Guru")
      .trim()
      .split(/\s+/)[0] || "Guru"
  );
}

function getInitials(name?: string | null) {
  const parts = String(name || "SitGuru")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "SG";

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getProfileName(profile?: ProfileRow | null) {
  if (!profile) return "SitGuru User";

  const candidate =
    profile.full_name ||
    profile.display_name ||
    profile.name ||
    (profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : null) ||
    profile.first_name ||
    profile.last_name ||
    profile.email?.split("@")[0] ||
    "SitGuru User";

  return String(candidate).trim() || "SitGuru User";
}

function getGuruName(
  profile: GuruProfile | null,
  fallbackEmail?: string | null,
) {
  const firstName = String(profile?.first_name || "").trim();
  const lastName = String(profile?.last_name || "").trim();
  const combinedName = `${firstName} ${lastName}`.trim();

  return (
    profile?.full_name ||
    profile?.display_name ||
    profile?.name ||
    combinedName ||
    getDisplayNameFromEmail(profile?.email || fallbackEmail)
  );
}

function getGuruTitle(profile: GuruProfile | null) {
  return profile?.title || profile?.headline || "Trusted Pet Care Guru";
}

function getGuruLocation(profile: GuruProfile | null) {
  const city = String(profile?.city || profile?.service_city || "").trim();
  const state = String(profile?.state || profile?.service_state || "").trim();

  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;

  return "Service area pending";
}

function getGuruImage(profile: GuruProfile | null) {
  return (
    profile?.profile_photo_url ||
    profile?.avatar_url ||
    profile?.image_url ||
    profile?.photo_url ||
    null
  );
}

function normalizeServices(value: GuruProfile["services"]) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeApplicationStatus(profile: GuruProfile | null) {
  const raw = String(profile?.application_status || profile?.status || "")
    .trim()
    .toLowerCase();

  if (profile?.is_bookable || raw === "bookable" || raw === "active") {
    return "Bookable";
  }

  if (raw === "approved") return "Approved";
  if (raw === "reviewing") return "Under Review";
  if (raw === "submitted") return "Submitted";
  if (raw === "needs_info" || raw === "needs-info") return "Needs Info";
  if (raw === "rejected") return "Not Approved";
  if (raw === "suspended" || raw === "paused") return "Paused";

  return "Profile Setup";
}

function isBookable(profile: GuruProfile | null) {
  const status = normalizeApplicationStatus(profile).toLowerCase();
  return Boolean(profile?.is_bookable) || status === "bookable";
}

function calculateProfileCompletion(profile: GuruProfile | null) {
  if (!profile) return 10;

  if (
    typeof profile.profile_completion === "number" &&
    profile.profile_completion > 0
  ) {
    return Math.max(0, Math.min(100, profile.profile_completion));
  }

  const checks = [
    Boolean(profile.full_name || profile.display_name || profile.name),
    Boolean(profile.title || profile.headline),
    Boolean(profile.bio),
    Boolean(profile.city || profile.state),
    Boolean(getGuruImage(profile)),
    Boolean(profile.rate || profile.hourly_rate || profile.price),
    normalizeServices(profile.services).length > 0,
  ];

  return Math.max(
    10,
    Math.round((checks.filter(Boolean).length / checks.length) * 100),
  );
}

function getBookingStatus(booking: BookingRow) {
  return String(
    booking.status ||
      booking.booking_status ||
      booking.payment_status ||
      "pending",
  );
}

function getBookingService(booking: BookingRow) {
  return String(
    booking.service ||
      booking.service_type ||
      booking.booking_type ||
      "Pet Care",
  );
}

function getPetName(booking: BookingRow) {
  return String(booking.pet_name || "Pet");
}

function getCustomerName(booking: BookingRow) {
  return String(
    booking.customer_name || booking.pet_parent_name || "Pet Parent",
  );
}

function getBookingDate(booking: BookingRow) {
  const value =
    booking.start_time ||
    booking.start_date ||
    booking.booking_date ||
    booking.created_at ||
    null;

  if (!value) return "Date pending";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Date pending";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatActivity(value?: string | null) {
  if (!value) return "No recent activity";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No recent activity";

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getMessagePreview(message?: MessageRow | null) {
  return String(message?.content || message?.body || "").trim();
}

function readNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function formatCurrencyAmount(value: number | string | null | undefined) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) return "";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function getBaseRate(profile: GuruProfile | null) {
  if (!profile) return "";

  return formatCurrencyAmount(
    profile.hourly_rate ?? profile.rate ?? profile.price,
  );
}

function getGuruRating(profile: GuruProfile | null) {
  return readNumber(profile?.rating_avg ?? profile?.rating, 0);
}

function getReviewCount(profile: GuruProfile | null) {
  return readNumber(profile?.review_count, 0);
}

function getExperienceYears(profile: GuruProfile | null) {
  return readNumber(profile?.experience_years, 0);
}

function getGuruRadius(profile: GuruProfile | null) {
  if (!profile) return 25;

  const radius = [
    profile.service_radius_miles,
    profile.service_radius,
    profile.radius_miles,
  ]
    .map((value) => readNumber(value, Number.NaN))
    .find((value) => Number.isFinite(value) && value > 0);

  if (typeof radius === "number") {
    return Math.min(Math.round(radius), 100);
  }

  return 25;
}

function getPublicIdentifier(profile: GuruProfile | null, fallback: string) {
  const identifier =
    profile?.slug ||
    profile?.public_slug ||
    slugifyPublicIdentifier(getGuruName(profile)) ||
    profile?.id ||
    fallback;

  return encodeURIComponent(String(identifier));
}

function getBookHref(profile: GuruProfile | null, fallback: string) {
  return `/book/${getPublicIdentifier(profile, fallback)}`;
}

function getMessageHref(profile: GuruProfile | null, fallback: string) {
  const identifier = String(
    profile?.slug ||
      profile?.public_slug ||
      slugifyPublicIdentifier(getGuruName(profile)) ||
      profile?.id ||
      fallback,
  );

  return `/login?next=${encodeURIComponent(`/messages/new?guru=${identifier}`)}`;
}

function formatServiceRate(rate: GuruServiceRateRow) {
  const rateUnit = String(rate.rate_unit || "visit")
    .trim()
    .toLowerCase();

  const unit = RATE_UNIT_LABELS[rateUnit] || "visit";

  if (rateUnit === "custom") {
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

function getGuruTier(
  completedBookingsCount: number,
  profileCompletion: number,
  bookable: boolean,
  certifiedGuru: boolean,
): GuruTier {
  if (
    completedBookingsCount >= 25 &&
    profileCompletion >= 90 &&
    bookable &&
    certifiedGuru
  ) {
    return {
      label: "Elite Guru",
      shortLabel: "Elite",
      description:
        "You are in the top SitGuru pack — a polished, highly active Guru trusted by pet families for reliable, loving care.",
      icon: "🏆",
      stars: 5,
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-800",
      cardClassName:
        "border-amber-200 bg-[linear-gradient(180deg,#fffaf0_0%,#ffffff_100%)]",
    };
  }

  if (certifiedGuru && bookable) {
    return {
      label: "Certified Guru",
      shortLabel: "Certified",
      description:
        "You completed Guru Academy and are ready to build trust with Pet Parents through professional, reliable pet care.",
      icon: "🎓",
      stars: 4,
      badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-800",
      cardClassName:
        "border-emerald-200 bg-[linear-gradient(180deg,#f2fffb_0%,#ffffff_100%)]",
    };
  }

  if (completedBookingsCount >= 10 && profileCompletion >= 75 && bookable) {
    return {
      label: "Super Guru",
      shortLabel: "Super",
      description:
        "You are building a strong SitGuru reputation with more completed care, a stronger profile, and growing trust from pet families.",
      icon: "⭐",
      stars: 4,
      badgeClassName: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800",
      cardClassName:
        "border-fuchsia-200 bg-[linear-gradient(180deg,#fff7ff_0%,#ffffff_100%)]",
    };
  }

  if (bookable) {
    return {
      label: "Trusted Guru",
      shortLabel: "Trusted",
      description:
        "You are approved, bookable, and ready to help pets feel safe, loved, and cared for through SitGuru.",
      icon: "🛡️",
      stars: 3,
      badgeClassName: "border-cyan-200 bg-cyan-50 text-cyan-800",
      cardClassName:
        "border-cyan-200 bg-[linear-gradient(180deg,#f3fbff_0%,#ffffff_100%)]",
    };
  }

  return {
    label: "Rising Guru",
    shortLabel: "Rising",
    description:
      "You are on the path to becoming bookable. Finish your profile, complete Guru Academy, and keep building trust so pet families can choose you with confidence.",
    icon: "🐾",
    stars: 2,
    badgeClassName: "border-cyan-200 bg-cyan-50 text-cyan-800",
    cardClassName:
      "border-cyan-200 bg-[linear-gradient(180deg,#f3fbff_0%,#ffffff_100%)]",
  };
}

function getEliteProgress({
  completedBookingsCount,
  profileCompletion,
  bookable,
}: {
  completedBookingsCount: number;
  profileCompletion: number;
  bookable: boolean;
}) {
  const bookingProgress = Math.min(
    100,
    Math.round((completedBookingsCount / 25) * 100),
  );

  const profileProgress = Math.min(
    100,
    Math.round((profileCompletion / 90) * 100),
  );

  const bookableProgress = bookable ? 100 : 0;
  return Math.round((bookingProgress + profileProgress + bookableProgress) / 3);
}

function isGuruRole(value?: string | null) {
  return normalizeRole(value) === "guru";
}

function buildGuruProfileFromProfileRow(profile: Record<string, any>): GuruProfile {
  const firstName = String(profile.first_name || "").trim();
  const lastName = String(profile.last_name || "").trim();
  const fullName =
    String(
      profile.full_name ||
        profile.display_name ||
        profile.name ||
        `${firstName} ${lastName}`.trim() ||
        getDisplayNameFromEmail(profile.email),
    ).trim() || "Guru";

  return {
    id: profile.id,
    user_id: profile.user_id || profile.id,
    email: profile.email || null,
    full_name: fullName,
    display_name: profile.display_name || fullName,
    name: profile.name || fullName,
    first_name: firstName || null,
    last_name: lastName || null,
    title: profile.title || profile.headline || "Trusted Pet Care Guru",
    headline: profile.headline || profile.title || "Trusted Pet Care Guru",
    bio:
      profile.bio ||
      "This Guru is building their SitGuru profile. More details about their care style, experience, and pet preferences will appear here soon.",
    city: profile.city || profile.service_city || null,
    state: profile.state || profile.service_state || null,
    service_city: profile.service_city || profile.city || null,
    service_state: profile.service_state || profile.state || null,
    slug: profile.slug || null,
    public_slug: profile.public_slug || profile.slug || null,
    profile_id: profile.profile_id || profile.id || null,
    zip_code: profile.zip_code || profile.service_zip || profile.postal_code || null,
    postal_code: profile.postal_code || profile.zip_code || profile.service_zip || null,
    service_radius_miles:
      profile.service_radius_miles ||
      profile.service_radius ||
      profile.radius_miles ||
      25,
    service_radius: profile.service_radius || profile.service_radius_miles || 25,
    radius_miles: profile.radius_miles || profile.service_radius_miles || 25,
    image_url: profile.image_url || profile.profile_photo_url || profile.avatar_url || null,
    avatar_url: profile.avatar_url || profile.profile_photo_url || profile.image_url || null,
    photo_url: profile.photo_url || profile.profile_photo_url || profile.avatar_url || null,
    profile_photo_url:
      profile.profile_photo_url || profile.avatar_url || profile.image_url || null,
    rate: profile.rate || null,
    hourly_rate: profile.hourly_rate || null,
    price: profile.price || null,
    services: Array.isArray(profile.services) ? profile.services : null,
    application_status:
      profile.approval_status ||
      profile.application_status ||
      profile.account_status ||
      "profile_incomplete",
    status:
      profile.account_status ||
      profile.status ||
      profile.approval_status ||
      "profile_incomplete",
    role: "guru",
    account_type: "guru",
    is_public: true,
    is_active: profile.account_status === "suspended" ? false : true,
    is_bookable: false,
    is_verified: false,
    profile_completion: null,
    rating_avg: 0,
    rating: 0,
    review_count: 0,
    experience_years: profile.experience_years || null,
  };
}

function getImageUrlFromRecord(record: Record<string, any> | null) {
  if (!record) return null;

  const candidates = [
    record.profile_photo_url,
    record.avatar_url,
    record.image_url,
    record.photo_url,
    record.public_url,
    record.url,
    record.file_url,
    record.media_url,
    record.picture_url,
    record.profile_image_url,
    record.headshot_url,
  ];

  const imageUrl = candidates
    .map((value) => String(value || "").trim())
    .find((value) => Boolean(value));

  return imageUrl || null;
}

function mergeGuruProfilePhoto(
  guruProfile: GuruProfile,
  imageUrl: string | null,
): GuruProfile {
  if (!imageUrl) return guruProfile;

  return {
    ...guruProfile,
    profile_photo_url: guruProfile.profile_photo_url || imageUrl,
    avatar_url: guruProfile.avatar_url || imageUrl,
    image_url: guruProfile.image_url || imageUrl,
    photo_url: guruProfile.photo_url || imageUrl,
  };
}

function isSameGuruIdentity(
  left: GuruProfile | null,
  right: GuruProfile | null,
  identifier?: string | null,
) {
  if (!left || !right) return false;

  const leftValues = [
    left.id != null ? String(left.id) : "",
    left.user_id || "",
    left.profile_id || "",
    left.email || "",
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);

  const rightValues = [
    right.id != null ? String(right.id) : "",
    right.user_id || "",
    right.profile_id || "",
    right.email || "",
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);

  if (leftValues.some((value) => rightValues.includes(value))) return true;

  if (identifier && isIdentifierMatchForGuru(right, identifier)) return true;

  const leftName = slugifyPublicIdentifier(getGuruName(left));
  const rightName = slugifyPublicIdentifier(getGuruName(right));

  return Boolean(leftName && rightName && leftName === rightName);
}

async function findGuruUploadedPhotoFromSitGuruRows(
  guruProfile: GuruProfile,
  identifier?: string | null,
) {
  try {
    const { data, error } = await supabaseAdmin.from("gurus").select("*");

    if (error || !Array.isArray(data)) return null;

    const matches = (data as GuruProfile[])
      .filter((candidate) =>
        isSameGuruIdentity(guruProfile, candidate, identifier),
      )
      .map((candidate) => ({
        candidate,
        imageUrl: getImageUrlFromRecord(candidate as Record<string, any>),
      }))
      .filter((candidate) => Boolean(candidate.imageUrl));

    if (!matches.length) return null;

    const exactSlug = slugifyPublicIdentifier(identifier || "");

    matches.sort((left, right) => {
      const leftExact =
        exactSlug && isIdentifierMatchForGuru(left.candidate, exactSlug) ? 1 : 0;
      const rightExact =
        exactSlug && isIdentifierMatchForGuru(right.candidate, exactSlug) ? 1 : 0;
      const leftBookable = isBookable(left.candidate) ? 1 : 0;
      const rightBookable = isBookable(right.candidate) ? 1 : 0;

      return rightExact - leftExact || rightBookable - leftBookable;
    });

    return matches[0]?.imageUrl || null;
  } catch {
    return null;
  }
}

async function findGuruUploadedPhotoFromMediaTables(guruProfile: GuruProfile) {
  const guruIds = Array.from(
    new Set(
      [guruProfile.id, guruProfile.user_id, guruProfile.profile_id]
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );

  if (!guruIds.length) return null;

  const mediaTables = [
    "guru_media",
    "guru_photos",
    "guru_profile_photos",
    "profile_media",
    "user_media",
  ];

  const idColumns = ["guru_id", "user_id", "profile_id"];

  for (const table of mediaTables) {
    for (const column of idColumns) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select("*")
          .in(column, guruIds)
          .limit(25);

        if (error || !Array.isArray(data)) continue;

        const imageRow = (data as Record<string, any>[]).find((row) => {
          const typeText = String(
            row.media_type || row.type || row.kind || row.category || "",
          ).toLowerCase();

          const hasImageType =
            !typeText ||
            typeText.includes("image") ||
            typeText.includes("photo") ||
            typeText.includes("avatar") ||
            typeText.includes("profile");

          return hasImageType && Boolean(getImageUrlFromRecord(row));
        });

        const imageUrl = getImageUrlFromRecord(imageRow || null);
        if (imageUrl) return imageUrl;
      } catch {
        // Continue through optional media-table fallbacks.
      }
    }
  }

  return null;
}

async function findGuruPhotoFromProfiles(guruProfile: GuruProfile) {
  const profileSelect =
    "id, user_id, email, profile_photo_url, avatar_url, image_url, full_name, display_name, name, first_name, last_name";

  const profileLookups = [
    guruProfile.user_id
      ? supabaseAdmin
          .from("profiles")
          .select(profileSelect)
          .eq("id", guruProfile.user_id)
          .maybeSingle()
      : null,
    guruProfile.profile_id
      ? supabaseAdmin
          .from("profiles")
          .select(profileSelect)
          .eq("id", guruProfile.profile_id)
          .maybeSingle()
      : null,
    guruProfile.email
      ? supabaseAdmin
          .from("profiles")
          .select(profileSelect)
          .eq("email", guruProfile.email)
          .maybeSingle()
      : null,
    guruProfile.id != null
      ? supabaseAdmin
          .from("profiles")
          .select(profileSelect)
          .eq("id", String(guruProfile.id))
          .maybeSingle()
      : null,
  ];

  for (const lookup of profileLookups) {
    if (!lookup) continue;

    try {
      const result = await lookup;

      if (!result.error && result.data) {
        const profile = result.data as Record<string, any>;
        const imageUrl = getImageUrlFromRecord(profile);

        return {
          profile,
          imageUrl,
        };
      }
    } catch {
      // Continue through profile fallback lookups.
    }
  }

  return {
    profile: null,
    imageUrl: null,
  };
}

async function hydrateGuruProfilePhotoFields(
  guruProfile: GuruProfile | null,
  identifier?: string | null,
): Promise<GuruProfile | null> {
  if (!guruProfile) return null;

  const sitGuruPageImage = getGuruImage(guruProfile);
  if (sitGuruPageImage) {
    return mergeGuruProfilePhoto(guruProfile, sitGuruPageImage);
  }

  const sitGuruDuplicateRowImage = await findGuruUploadedPhotoFromSitGuruRows(
    guruProfile,
    identifier,
  );

  if (sitGuruDuplicateRowImage) {
    return mergeGuruProfilePhoto(guruProfile, sitGuruDuplicateRowImage);
  }

  const sitGuruMediaImage = await findGuruUploadedPhotoFromMediaTables(
    guruProfile,
  );

  if (sitGuruMediaImage) {
    return mergeGuruProfilePhoto(guruProfile, sitGuruMediaImage);
  }

  const profileFallback = await findGuruPhotoFromProfiles(guruProfile);

  if (profileFallback.profile) {
    const profile = profileFallback.profile;

    return mergeGuruProfilePhoto(
      {
        ...guruProfile,
        full_name:
          guruProfile.full_name ||
          profile.full_name ||
          profile.display_name ||
          profile.name ||
          null,
        display_name:
          guruProfile.display_name ||
          profile.display_name ||
          profile.full_name ||
          profile.name ||
          null,
        name:
          guruProfile.name ||
          profile.name ||
          profile.full_name ||
          profile.display_name ||
          null,
        first_name: guruProfile.first_name || profile.first_name || null,
        last_name: guruProfile.last_name || profile.last_name || null,
      },
      profileFallback.imageUrl,
    );
  }

  return guruProfile;
}


async function getProfileGuruByIdentifier(identifier: string) {
  const cleanedIdentifier = cleanIdentifier(identifier);
  if (!cleanedIdentifier) return null;

  const profileQueries = [
    supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", cleanedIdentifier)
      .maybeSingle(),
    supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", cleanedIdentifier)
      .maybeSingle(),
    supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("email", cleanedIdentifier)
      .maybeSingle(),
  ];

  for (const query of profileQueries) {
    try {
      const result = await query;

      if (!result.error && result.data) {
        const profile = result.data as Record<string, any>;
        const role = normalizeRole(profile.role || profile.account_type);

        if (role === "guru") {
          return buildGuruProfileFromProfileRow(profile);
        }
      }
    } catch {
      // Continue through fallback lookups.
    }
  }

  const allProfiles = await supabaseAdmin.from("profiles").select("*");

  if (!allProfiles.error && Array.isArray(allProfiles.data)) {
    const match = (allProfiles.data as Record<string, any>[]).find((profile) => {
      const role = normalizeRole(profile.role || profile.account_type);
      if (role !== "guru") return false;

      const candidateProfile = buildGuruProfileFromProfileRow(profile);
      return isIdentifierMatchForGuru(candidateProfile, cleanedIdentifier);
    });

    if (match) {
      return buildGuruProfileFromProfileRow(match);
    }
  }

  return null;
}



function titleFromPublicSlug(value?: string | null) {
  return String(value || "")
    .trim()
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizeGuruProfileFromBookingLookupRow(
  row: Record<string, any>,
): GuruProfile | null {
  const id = String(row.id || "").trim();

  if (!id) return null;

  const firstName = String(row.first_name || "").trim();
  const lastName = String(row.last_name || "").trim();
  const fullName = String(
    row.full_name ||
      row.display_name ||
      row.name ||
      `${firstName} ${lastName}`.trim() ||
      getDisplayNameFromEmail(row.email),
  ).trim();

  return {
    ...row,
    id,
    user_id: row.user_id || row.profile_id || null,
    email: row.email || null,
    full_name: fullName || "Guru",
    display_name: row.display_name || fullName || "Guru",
    name: row.name || fullName || "Guru",
    first_name: firstName || null,
    last_name: lastName || null,
    title: row.title || row.headline || "Trusted Pet Care Guru",
    headline: row.headline || row.title || "Trusted Pet Care Guru",
    bio: row.bio || null,
    city: row.city || row.service_city || null,
    state: row.state || row.service_state || null,
    service_city: row.service_city || row.city || null,
    service_state: row.service_state || row.state || null,
    slug: row.slug || null,
    public_slug: row.public_slug || row.slug || null,
    profile_id: row.profile_id || row.user_id || null,
    zip_code: row.zip_code || row.service_zip || row.postal_code || null,
    postal_code: row.postal_code || row.zip_code || row.service_zip || null,
    service_radius_miles:
      row.service_radius_miles ||
      row.service_radius ||
      row.radius_miles ||
      row.radius ||
      25,
    service_radius: row.service_radius || row.service_radius_miles || 25,
    radius_miles: row.radius_miles || row.service_radius_miles || 25,
    profile_photo_url:
      row.profile_photo_url || row.photo_url || row.avatar_url || row.image_url || null,
    photo_url: row.photo_url || row.profile_photo_url || row.avatar_url || row.image_url || null,
    avatar_url: row.avatar_url || row.profile_photo_url || row.photo_url || row.image_url || null,
    image_url: row.image_url || row.profile_photo_url || row.photo_url || row.avatar_url || null,
    rate: row.rate || null,
    hourly_rate: row.hourly_rate || null,
    price: row.price || null,
    services: Array.isArray(row.services) ? row.services : null,
    application_status:
      row.application_status || row.approval_status || row.status || null,
    status: row.status || row.application_status || row.approval_status || null,
    role: "guru",
    account_type: "guru",
    is_public: row.is_public !== false,
    is_active: row.is_active !== false,
    is_bookable: row.is_bookable !== false,
    is_verified: Boolean(row.is_verified),
    stripe_account_id: row.stripe_account_id || null,
    stripe_onboarding_complete: row.stripe_onboarding_complete || null,
    payouts_enabled: row.payouts_enabled || null,
    charges_enabled: row.charges_enabled || null,
    background_check_status: row.background_check_status || null,
    background_check_fee_status: row.background_check_fee_status || null,
    background_check_fee_payment_option:
      row.background_check_fee_payment_option || null,
    background_check_payment_plan_status:
      row.background_check_payment_plan_status || null,
    background_check_reimbursement_status:
      row.background_check_reimbursement_status || null,
    checkr_status: row.checkr_status || null,
    checkr_invitation_id: row.checkr_invitation_id || null,
    checkr_candidate_id: row.checkr_candidate_id || null,
    profile_completion: row.profile_completion || null,
    rating_avg: row.rating_avg || row.rating || 0,
    rating: row.rating || row.rating_avg || 0,
    review_count: row.review_count || 0,
    experience_years: row.experience_years || row.years_experience || null,
  };
}

function scoreGuruProfileForPublicDisplay(guru: GuruProfile, identifier: string) {
  let score = 0;

  if (getGuruImage(guru)) score += 1000;
  if (isIdentifierMatchForGuru(guru, identifier)) score += 300;
  if (String(guru.slug || "").trim()) score += 50;
  if (String(guru.email || "").trim()) score += 25;
  if (String(guru.bio || "").trim()) score += 25;
  if (normalizeServices(guru.services).length > 0) score += 20;
  if (isBookable(guru)) score += 20;
  if (guru.is_public !== false) score += 10;
  if (guru.is_active !== false) score += 10;

  return score;
}

function selectBestGuruProfileForPublicDisplay(
  gurus: GuruProfile[],
  identifier: string,
) {
  return [...gurus].sort(
    (left, right) =>
      scoreGuruProfileForPublicDisplay(right, identifier) -
      scoreGuruProfileForPublicDisplay(left, identifier),
  )[0] || null;
}

async function getPublicGuruProfileFromBookingLookup(
  identifier: string,
): Promise<GuruProfile | null> {
  const cleanedIdentifier = cleanIdentifier(identifier);
  if (!cleanedIdentifier) return null;

  const normalizedIdentifier = slugifyPublicIdentifier(cleanedIdentifier);
  const displayNameFromSlug = titleFromPublicSlug(cleanedIdentifier);

  const lookupQueries = [
    supabaseAdmin
      .from("gurus")
      .select("*")
      .ilike("slug", cleanedIdentifier)
      .limit(10),
    supabaseAdmin
      .from("gurus")
      .select("*")
      .ilike("slug", normalizedIdentifier)
      .limit(10),
    supabaseAdmin
      .from("gurus")
      .select("*")
      .ilike("public_slug", cleanedIdentifier)
      .limit(10),
    supabaseAdmin
      .from("gurus")
      .select("*")
      .ilike("public_slug", normalizedIdentifier)
      .limit(10),
    supabaseAdmin
      .from("gurus")
      .select("*")
      .ilike("display_name", displayNameFromSlug)
      .limit(10),
    supabaseAdmin
      .from("gurus")
      .select("*")
      .ilike("full_name", displayNameFromSlug)
      .limit(10),
  ];

  const directMatches: GuruProfile[] = [];

  for (const query of lookupQueries) {
    try {
      const result = await query;

      if (!result.error && Array.isArray(result.data)) {
        result.data.forEach((row) => {
          const guru = normalizeGuruProfileFromBookingLookupRow(
            row as Record<string, any>,
          );

          if (guru && isIdentifierMatchForGuru(guru, cleanedIdentifier)) {
            directMatches.push(guru);
          }
        });
      }
    } catch {
      // Continue through booking-style public profile lookups.
    }
  }

  if (directMatches.length) {
    return hydrateGuruProfilePhotoFields(
      selectBestGuruProfileForPublicDisplay(directMatches, cleanedIdentifier),
      cleanedIdentifier,
    );
  }

  try {
    const allGurusResult = await supabaseAdmin.from("gurus").select("*").limit(1000);

    if (!allGurusResult.error && Array.isArray(allGurusResult.data)) {
      const matches = allGurusResult.data
        .map((row) =>
          normalizeGuruProfileFromBookingLookupRow(row as Record<string, any>),
        )
        .filter((guru): guru is GuruProfile =>
          Boolean(guru && isIdentifierMatchForGuru(guru, cleanedIdentifier)),
        );

      if (matches.length) {
        return hydrateGuruProfilePhotoFields(
          selectBestGuruProfileForPublicDisplay(matches, cleanedIdentifier),
          cleanedIdentifier,
        );
      }
    }
  } catch {
    // Continue to remaining public profile lookup fallbacks.
  }

  return null;
}

async function getPublicSearchApiBaseUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SITE_URL ||
    "";

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  try {
    const requestHeaders = await headers();
    const host =
      requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "";

    if (!host) return "";

    const forwardedProtocol = requestHeaders.get("x-forwarded-proto");
    const protocol = forwardedProtocol || (host.includes("localhost") ? "http" : "https");

    return `${protocol}://${host}`;
  } catch {
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }

    return "";
  }
}

function buildGuruProfileFromPublicSearchRow(row: Record<string, any>): GuruProfile {
  const firstName = String(row.first_name || "").trim();
  const lastName = String(row.last_name || "").trim();
  const fullName = String(
    row.full_name ||
      row.display_name ||
      row.name ||
      `${firstName} ${lastName}`.trim() ||
      getDisplayNameFromEmail(row.email),
  ).trim();

  return {
    ...row,
    id: row.id,
    user_id: row.user_id || row.guru_user_id || row.profile_id || null,
    email: row.email || null,
    full_name: fullName || "Guru",
    display_name: row.display_name || fullName || "Guru",
    name: row.name || fullName || "Guru",
    first_name: firstName || null,
    last_name: lastName || null,
    title: row.title || row.headline || "Trusted Pet Care Guru",
    headline: row.headline || row.title || "Trusted Pet Care Guru",
    bio: row.bio || null,
    city: row.city || row.service_city || null,
    state: row.state || row.service_state || null,
    service_city: row.service_city || row.city || null,
    service_state: row.service_state || row.state || null,
    slug: row.slug || null,
    public_slug: row.public_slug || row.slug || null,
    profile_id: row.profile_id || row.user_id || null,
    zip_code: row.zip_code || row.service_zip || row.postal_code || null,
    postal_code: row.postal_code || row.zip_code || row.service_zip || null,
    service_radius_miles:
      row.service_radius_miles ||
      row.service_radius ||
      row.radius_miles ||
      row.radius ||
      25,
    service_radius: row.service_radius || row.service_radius_miles || 25,
    radius_miles: row.radius_miles || row.service_radius_miles || 25,
    image_url: row.image_url || row.profile_photo_url || row.photo_url || row.avatar_url || null,
    avatar_url: row.avatar_url || row.profile_photo_url || row.photo_url || row.image_url || null,
    photo_url: row.photo_url || row.profile_photo_url || row.avatar_url || row.image_url || null,
    profile_photo_url:
      row.profile_photo_url || row.photo_url || row.avatar_url || row.image_url || null,
    rate: row.rate || null,
    hourly_rate: row.hourly_rate || null,
    price: row.price || null,
    services: Array.isArray(row.services) ? row.services : null,
    application_status:
      row.application_status || row.approval_status || row.status || null,
    status: row.status || row.application_status || row.approval_status || null,
    role: "guru",
    account_type: "guru",
    is_public: row.is_public !== false,
    is_active: row.is_active !== false,
    is_bookable: Boolean(row.is_bookable),
    is_verified: Boolean(row.is_verified),
    profile_completion: row.profile_completion || null,
    rating_avg: row.rating_avg || 0,
    rating: row.rating || 0,
    review_count: row.review_count || 0,
    experience_years: row.experience_years || null,
  };
}

async function getPublicSearchGuruProfileByIdentifier(
  identifier: string,
): Promise<GuruProfile | null> {
  const cleanedIdentifier = cleanIdentifier(identifier);
  if (!cleanedIdentifier) return null;

  try {
    const baseUrl = await getPublicSearchApiBaseUrl();
    if (!baseUrl) return null;

    const response = await fetch(`${baseUrl}/api/gurus/public-search`, {
      cache: "no-store",
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as { gurus?: Record<string, any>[] };
    const guruRows = Array.isArray(payload.gurus) ? payload.gurus : [];

    const match = guruRows
      .map((row) => buildGuruProfileFromPublicSearchRow(row))
      .find((guru) => isIdentifierMatchForGuru(guru, cleanedIdentifier));

    if (!match) return null;

    return hydrateGuruProfilePhotoFields(match, cleanedIdentifier);
  } catch (error) {
    console.warn("Unable to load public Guru profile from public-search API:", error);
    return null;
  }
}

async function getPublicGuruProfile(
  identifier: string,
): Promise<GuruProfile | null> {
  const cleanedIdentifier = cleanIdentifier(identifier);
  if (!cleanedIdentifier) return null;

  const bookingLookupProfile =
    await getPublicGuruProfileFromBookingLookup(cleanedIdentifier);

  if (bookingLookupProfile) {
    return bookingLookupProfile;
  }

  const publicSearchProfile =
    await getPublicSearchGuruProfileByIdentifier(cleanedIdentifier);

  if (publicSearchProfile && getGuruImage(publicSearchProfile)) {
    return publicSearchProfile;
  }

  const guruQueries = [
    supabaseAdmin.from("gurus").select("*").eq("id", cleanedIdentifier).maybeSingle(),
    supabaseAdmin
      .from("gurus")
      .select("*")
      .eq("user_id", cleanedIdentifier)
      .maybeSingle(),
    supabaseAdmin
      .from("gurus")
      .select("*")
      .eq("profile_id", cleanedIdentifier)
      .maybeSingle(),
    supabaseAdmin
      .from("gurus")
      .select("*")
      .eq("slug", cleanedIdentifier)
      .maybeSingle(),
    supabaseAdmin
      .from("gurus")
      .select("*")
      .eq("public_slug", cleanedIdentifier)
      .maybeSingle(),
    supabaseAdmin
      .from("gurus")
      .select("*")
      .eq("email", cleanedIdentifier)
      .maybeSingle(),
  ];

  for (const query of guruQueries) {
    try {
      const result = await query;

      if (!result.error && result.data) {
        return hydrateGuruProfilePhotoFields(
          result.data as GuruProfile,
          cleanedIdentifier,
        );
      }
    } catch {
      // Continue through fallback lookups.
    }
  }

  const allGurus = await supabaseAdmin.from("gurus").select("*");

  if (!allGurus.error && Array.isArray(allGurus.data)) {
    const match = (allGurus.data as GuruProfile[]).find((guru) =>
      isIdentifierMatchForGuru(guru, cleanedIdentifier),
    );

    if (match) {
      return hydrateGuruProfilePhotoFields(match, cleanedIdentifier);
    }
  }

  const profileFallback = await getProfileGuruByIdentifier(cleanedIdentifier);
  return hydrateGuruProfilePhotoFields(profileFallback, cleanedIdentifier);
}

async function getGuruProfile(
  userId: string,
  email?: string | null,
): Promise<GuruProfile | null> {
  const byUserId = await supabaseAdmin
    .from("gurus")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!byUserId.error && byUserId.data) {
    return hydrateGuruProfilePhotoFields(
      byUserId.data as GuruProfile,
      userId,
    );
  }

  if (email) {
    const byEmail = await supabaseAdmin
      .from("gurus")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (!byEmail.error && byEmail.data) {
      return hydrateGuruProfilePhotoFields(
        byEmail.data as GuruProfile,
        userId,
      );
    }
  }

  const profileFallback = await supabaseAdmin
    .from("profiles")
    .select(
      "id, full_name, display_name, name, email, role, account_type, profile_photo_url, avatar_url, image_url",
    )
    .eq("id", userId)
    .maybeSingle();

  if (!profileFallback.error && profileFallback.data) {
    const role = normalizeRole(
      profileFallback.data.role || profileFallback.data.account_type,
    );

    if (role === "guru") {
      return {
        id: profileFallback.data.id,
        user_id: userId,
        email: profileFallback.data.email || email,
        full_name:
          profileFallback.data.full_name ||
          profileFallback.data.display_name ||
          profileFallback.data.name,
        profile_photo_url: profileFallback.data.profile_photo_url,
        avatar_url: profileFallback.data.avatar_url,
        image_url: profileFallback.data.image_url,
        services: null,
        rate: null,
        hourly_rate: null,
        price: null,
        profile_completion: null,
        application_status: "profile_incomplete",
        status: "profile_incomplete",
        is_bookable: false,
        is_public: false,
      };
    }
  }

  return null;
}

async function getGuruBookings(
  guruProfile: GuruProfile | null,
  userId: string,
) {
  const guruIds = Array.from(
    new Set(
      [guruProfile?.id, guruProfile?.user_id, userId]
        .map((value) => String(value ?? "").trim())
        .filter(Boolean),
    ),
  );

  if (!guruIds.length) return [] as BookingRow[];

  const bySitter = await supabaseAdmin
    .from("bookings")
    .select("*")
    .in("sitter_id", guruIds)
    .order("created_at", { ascending: false })
    .limit(25);

  if (!bySitter.error && bySitter.data) {
    return bySitter.data as BookingRow[];
  }

  const byGuru = await supabaseAdmin
    .from("bookings")
    .select("*")
    .in("guru_id", guruIds)
    .order("created_at", { ascending: false })
    .limit(25);

  if (!byGuru.error && byGuru.data) {
    return byGuru.data as BookingRow[];
  }

  return [] as BookingRow[];
}

async function getGuruConversations(
  guruProfile: GuruProfile | null,
  userId: string,
) {
  const guruIds = Array.from(
    new Set(
      [guruProfile?.id, guruProfile?.user_id, userId]
        .map((value) => String(value ?? "").trim())
        .filter(Boolean),
    ),
  );

  if (!guruIds.length) return [] as DashboardConversation[];

  const { data: conversations } = await supabaseAdmin
    .from("conversations")
    .select("*")
    .in("guru_id", guruIds)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(12);

  const safeConversations = (conversations || []) as ConversationRow[];
  if (!safeConversations.length) return [] as DashboardConversation[];

  const conversationIds = safeConversations.map(
    (conversation) => conversation.id,
  );

  const { data: messages } = await supabaseAdmin
    .from("messages")
    .select("*")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  const safeMessages = (messages || []) as MessageRow[];
  const latestMessageByConversation = new Map<string, MessageRow>();

  safeMessages.forEach((message) => {
    const conversationId = String(message.conversation_id || "").trim();
    if (conversationId && !latestMessageByConversation.has(conversationId)) {
      latestMessageByConversation.set(conversationId, message);
    }
  });

  const profileIds = Array.from(
    new Set(
      safeConversations
        .flatMap((conversation) => [
          conversation.customer_id || "",
          ...safeMessages
            .filter((message) => message.conversation_id === conversation.id)
            .flatMap((message) => [
              message.sender_id || "",
              message.recipient_id || "",
            ]),
        ])
        .filter(Boolean)
        .filter((id) => !guruIds.includes(id)),
    ),
  );

  const { data: profiles } = profileIds.length
    ? await supabaseAdmin
        .from("profiles")
        .select(
          "id, full_name, display_name, name, first_name, last_name, email, role, account_type, profile_photo_url, avatar_url, image_url",
        )
        .in("id", profileIds)
    : { data: [] as ProfileRow[] };

  const profileMap = new Map<string, ProfileRow>();
  ((profiles || []) as ProfileRow[]).forEach((profile) => {
    profileMap.set(profile.id, profile);
  });

  return safeConversations.map((conversation) => {
    const latestMessage = latestMessageByConversation.get(conversation.id);
    const otherUserId =
      conversation.customer_id ||
      latestMessage?.sender_id ||
      latestMessage?.recipient_id ||
      "";

    const otherProfile = profileMap.get(otherUserId) || null;
    const role = normalizeRole(
      otherProfile?.role || otherProfile?.account_type || "customer",
    );

    return {
      id: conversation.id,
      name: getProfileName(otherProfile),
      role:
        role === "admin" ? "Admin" : role === "guru" ? "Guru" : "Pet Parent",
      subject: conversation.subject || "Care conversation",
      preview:
        conversation.last_message_preview ||
        getMessagePreview(latestMessage) ||
        "Open this thread to review the details.",
      lastActivity:
        conversation.last_message_at ||
        latestMessage?.created_at ||
        conversation.updated_at ||
        conversation.created_at ||
        null,
      href: `/guru/dashboard/messages/${conversation.id}`,
    };
  });
}

async function getGuruServiceRates(guruProfile: GuruProfile | null) {
  const guruId = String(guruProfile?.id ?? "").trim();
  if (!guruId) return [] as GuruServiceRateRow[];

  const { data, error } = await supabaseAdmin
    .from("guru_service_rates")
    .select("*")
    .eq("guru_id", guruId);

  if (error || !data) return [] as GuruServiceRateRow[];
  return data as GuruServiceRateRow[];
}

function isServiceRatePriced(rate: GuruServiceRateRow) {
  const rateUnit = String(rate.rate_unit || "")
    .trim()
    .toLowerCase();
  const rateAmount = String(rate.rate_amount ?? "").trim();

  if (!rate.is_enabled) return false;
  if (rateUnit === "custom") return true;
  return rateAmount.length > 0 && !Number.isNaN(Number(rateAmount));
}

function hasEnabledPricedServiceRates(serviceRates: GuruServiceRateRow[]) {
  return serviceRates.some((rate) => isServiceRatePriced(rate));
}

function isTrustSafetyFeeWaivedThrough2026() {
  return new Date().getTime() < new Date("2027-01-01T00:00:00.000Z").getTime();
}

function getBackgroundCheckDisplay(profile: GuruProfile | null) {
  const statusValues = [
    profile?.background_check_status,
    profile?.background_check_fee_status,
    profile?.background_check_fee_payment_option,
    profile?.background_check_payment_plan_status,
    profile?.background_check_reimbursement_status,
    profile?.checkr_status,
  ]
    .map((value) =>
      String(value || "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);

  const combinedStatus = statusValues.join(" ");
  const hasLaunchWaiverStatus = statusValues.some((status) =>
    [
      "waived",
      "waived_2026",
      "launch_waived",
      "launch_year_2026_waiver",
      "deferred_launch",
    ].includes(status),
  );

  if (isTrustSafetyFeeWaivedThrough2026() || hasLaunchWaiverStatus) {
    return {
      label: "Waived Through 2026",
      status: "complete" as const,
      href: "/guru/dashboard/background-check?screening_payment=waived_2026",
    };
  }

  if (
    combinedStatus.includes("clear") ||
    combinedStatus.includes("complete") ||
    combinedStatus.includes("approved") ||
    combinedStatus.includes("passed") ||
    combinedStatus.includes("paid")
  ) {
    return {
      label: "Complete",
      status: "complete" as const,
      href: "/guru/dashboard/background-check",
    };
  }

  if (
    combinedStatus.includes("pending") ||
    combinedStatus.includes("invited") ||
    combinedStatus.includes("created") ||
    combinedStatus.includes("review") ||
    Boolean(profile?.checkr_invitation_id || profile?.checkr_candidate_id)
  ) {
    return {
      label: "Pending",
      status: "pending" as const,
      href: "/guru/dashboard/background-check",
    };
  }

  return {
    label: "Needs Action",
    status: "needs_action" as const,
    href: "/guru/dashboard/background-check",
  };
}

function isPayoutConnected(profile: GuruProfile | null) {
  return Boolean(
    profile?.stripe_account_id &&
      profile?.stripe_onboarding_complete === true &&
      profile?.charges_enabled === true &&
      profile?.payouts_enabled === true,
  );
}

function getGuruOnboardingPacketDisplay() {
  const packetUrl =
    process.env.NEXT_PUBLIC_GURU_ONBOARDING_PACKET_URL ||
    "/guru/dashboard/onboarding-packet";

  return {
    label: "Needs Action",
    status: "needs_action" as const,
    href: packetUrl,
  };
}

function isCompletedStep(row: Record<string, unknown>) {
  const status = String(row.status || "")
    .trim()
    .toLowerCase();
  return Boolean(
    row.completed_at ||
      status === "completed" ||
      status === "complete" ||
      status === "done",
  );
}

async function getGuruUniversityProgress(
  userId: string,
): Promise<GuruUniversityProgress> {
  const defaultProgress: GuruUniversityProgress = {
    totalSteps: 1,
    completedSteps: 0,
    totalMaterials: 0,
    acknowledgedMaterials: 0,
    requiredMaterials: 0,
    progressPercent: 0,
    isStarted: false,
    isComplete: false,
    certificationLabel: "Certified Guru: Not started",
    badgeStatus: "Locked",
    progressHelper:
      "Watch the Guru intro video, review the Guru Success Guide, and acknowledge completion.",
    academyButtonLabel: "Start Guru Academy",
  };

  try {
    const academyType = "guru";

    const [
      certificationResult,
      stepsResult,
      materialsResult,
      materialProgressResult,
      stepProgressResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("academy_certifications")
        .select("badge_status, certificate_status, issued_at")
        .eq("academy_type", academyType)
        .eq("user_id", userId)
        .maybeSingle(),

      supabaseAdmin
        .from("ambassador_training_steps")
        .select("id, step_number, title, is_active")
        .eq("academy_type", academyType)
        .eq("is_active", true)
        .order("step_number", { ascending: true }),

      supabaseAdmin
        .from("academy_step_materials")
        .select(
          "id, training_step_id, title, content_type, is_required, is_active",
        )
        .eq("academy_type", academyType)
        .eq("is_active", true),

      supabaseAdmin
        .from("academy_material_progress")
        .select("material_id, training_step_id, acknowledged_at")
        .eq("academy_type", academyType)
        .eq("user_id", userId)
        .not("acknowledged_at", "is", null),

      supabaseAdmin
        .from("academy_step_progress")
        .select("training_step_id, status, completed_at")
        .eq("academy_type", academyType)
        .eq("user_id", userId),
    ]);

    if (stepsResult.error) throw stepsResult.error;
    if (materialsResult.error) throw materialsResult.error;
    if (materialProgressResult.error) throw materialProgressResult.error;
    if (stepProgressResult.error) throw stepProgressResult.error;

    const activeSteps = Array.isArray(stepsResult.data) ? stepsResult.data : [];
    const firstActiveStep = activeSteps[0] || null;
    const orientationStepId = String(firstActiveStep?.id || "");

    const activeMaterials = Array.isArray(materialsResult.data)
      ? materialsResult.data
      : [];
    const orientationMaterials = orientationStepId
      ? activeMaterials.filter(
          (material) =>
            String(material.training_step_id || "") === orientationStepId,
        )
      : activeMaterials;

    const requiredMaterials = orientationMaterials.filter(
      (material) => material.is_required !== false,
    );

    const visibleMaterialIds = new Set(
      orientationMaterials
        .map((material) => String(material.id))
        .filter(Boolean),
    );

    const materialProgress = Array.isArray(materialProgressResult.data)
      ? materialProgressResult.data
      : [];

    const acknowledgedMaterials = materialProgress.filter(
      (row) =>
        Boolean(row.acknowledged_at) &&
        visibleMaterialIds.has(String(row.material_id || "")),
    ).length;

    const stepProgress = Array.isArray(stepProgressResult.data)
      ? stepProgressResult.data
      : [];

    const completedSteps = stepProgress.filter((row) => {
      if (!isCompletedStep(row)) return false;
      if (!orientationStepId) return true;
      return String(row.training_step_id || "") === orientationStepId;
    }).length;

    const certification = certificationResult.error
      ? null
      : certificationResult.data;
    const certificationBadgeIssued =
      String(certification?.badge_status || "").toLowerCase() === "issued";

    const totalSteps = 1;
    const normalizedCompletedSteps =
      completedSteps > 0 || certificationBadgeIssued ? 1 : 0;
    const isComplete =
      normalizedCompletedSteps >= totalSteps || certificationBadgeIssued;
    const isStarted = isComplete || acknowledgedMaterials > 0;
    const progressPercent = Math.round(
      (normalizedCompletedSteps / totalSteps) * 100,
    );
    const normalizedRequiredMaterials =
      requiredMaterials.length || orientationMaterials.length;

    return {
      totalSteps,
      completedSteps: normalizedCompletedSteps,
      totalMaterials: orientationMaterials.length,
      acknowledgedMaterials,
      requiredMaterials: normalizedRequiredMaterials,
      progressPercent,
      isStarted,
      isComplete,
      certificationLabel: isComplete
        ? "Certified Guru: Completed"
        : isStarted
          ? "Certified Guru: In progress"
          : "Certified Guru: Not started",
      badgeStatus: isComplete
        ? "Certified Guru"
        : isStarted
          ? "In progress"
          : "Locked",
      progressHelper: isComplete
        ? "Certified Guru badge issued"
        : isStarted
          ? `${acknowledgedMaterials} of ${normalizedRequiredMaterials} required materials acknowledged`
          : "Watch the Guru intro video, review the Guru Success Guide, and acknowledge completion.",
      academyButtonLabel: isComplete
        ? "Review Guru Academy"
        : isStarted
          ? "Continue Guru Academy"
          : "Start Guru Academy",
    };
  } catch (error) {
    console.warn("Unable to load Guru Academy dashboard progress:", error);
    return defaultProgress;
  }
}

function GuruAvatar({
  name,
  imageUrl,
  isAcademyGraduate = false,
}: {
  name: string;
  imageUrl?: string | null;
  isAcademyGraduate?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {imageUrl ? (
          <div className="h-40 w-40 overflow-hidden rounded-full border-[7px] border-white bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)] lg:h-48 lg:w-48">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover object-center"
            />
          </div>
        ) : (
          <div className="flex h-40 w-40 items-center justify-center rounded-full border-[7px] border-white bg-[linear-gradient(135deg,#dbfff3_0%,#dcebff_100%)] text-6xl font-black text-slate-900 shadow-[0_18px_40px_rgba(15,23,42,0.16)] lg:h-48 lg:w-48">
            {getFirstName(name).charAt(0).toUpperCase()}
          </div>
        )}

        {isAcademyGraduate ? (
          <div className="absolute -left-3 top-3 z-10 hidden sm:block">
            <AcademyGraduateBadge academyType="guru" variant="mini" />
          </div>
        ) : null}
      </div>

      {isAcademyGraduate ? (
        <AcademyGraduateBadge
          academyType="guru"
          variant="photo-strip"
          className="mt-3"
        />
      ) : null}
    </div>
  );
}

function PublicGuruHeroImage({
  name,
  imageUrl,
  isAcademyGraduate = false,
}: {
  name: string;
  imageUrl?: string | null;
  isAcademyGraduate?: boolean;
}) {
  if (imageUrl) {
    return (
      <div className="relative h-[360px] w-full overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_18px_40px_rgba(15,23,42,0.14)] sm:h-[420px] lg:h-[520px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover object-center"
        />

        {isAcademyGraduate ? (
          <>
            <div className="absolute left-4 top-4 z-10 hidden sm:block">
              <AcademyGraduateBadge
                academyType="guru"
                variant="photo-overlay"
              />
            </div>

            <div className="absolute bottom-4 left-4 z-10 hidden sm:block">
              <AcademyGraduateBadge academyType="guru" variant="photo-strip" />
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative flex h-[360px] w-full items-center justify-center rounded-[2rem] border border-white bg-[linear-gradient(135deg,#dbfff3_0%,#dcebff_100%)] text-7xl font-black text-slate-900 shadow-[0_18px_40px_rgba(15,23,42,0.14)] sm:h-[420px] lg:h-[520px]">
      {getInitials(name)}

      {isAcademyGraduate ? (
        <>
          <div className="absolute left-4 top-4 z-10 hidden sm:block">
            <AcademyGraduateBadge
              academyType="guru"
              variant="photo-overlay"
            />
          </div>

          <div className="absolute bottom-4 left-4 z-10 hidden sm:block">
            <AcademyGraduateBadge academyType="guru" variant="photo-strip" />
          </div>
        </>
      ) : null}
    </div>
  );
}

function GuruPawCrest({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 96 108"
        className="h-full w-full drop-shadow-[0_9px_16px_rgba(5,150,105,0.22)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M48 4.8C57.4 13.7 71.2 17.5 84.5 18.3C86.8 18.4 88.7 20.2 88.8 22.5C91.1 61.2 77.3 88.2 50.1 103.2C48.8 103.9 47.2 103.9 45.9 103.2C18.7 88.2 4.9 61.2 7.2 22.5C7.3 20.2 9.2 18.4 11.5 18.3C24.8 17.5 38.6 13.7 48 4.8Z"
          fill="url(#guruShieldGradient)"
        />
        <path
          d="M48 12.8C56 19.2 67.1 22.7 80.1 23.8C81.2 55.7 70.4 80.2 48 93.9C25.6 80.2 14.8 55.7 15.9 23.8C28.9 22.7 40 19.2 48 12.8Z"
          fill="url(#guruInnerGradient)"
          stroke="rgba(255,255,255,0.72)"
          strokeWidth="4"
        />
        <path
          d="M48 48.5C40.4 48.5 34.3 54.6 34.3 62.1C34.3 69.4 40 74.7 48 74.7C56 74.7 61.7 69.4 61.7 62.1C61.7 54.6 55.6 48.5 48 48.5Z"
          fill="white"
        />
        <path
          d="M32.4 45.4C35.8 44.5 37.7 40.2 36.7 35.9C35.7 31.6 32.1 28.8 28.7 29.7C25.3 30.6 23.4 34.9 24.4 39.2C25.4 43.5 29 46.3 32.4 45.4Z"
          fill="white"
        />
        <path
          d="M43.1 41.5C46.7 41.1 49.1 37 48.6 32.4C48.1 27.8 44.8 24.4 41.2 24.8C37.6 25.2 35.2 29.3 35.7 33.9C36.2 38.5 39.5 41.9 43.1 41.5Z"
          fill="white"
        />
        <path
          d="M52.9 41.5C56.5 41.9 59.8 38.5 60.3 33.9C60.8 29.3 58.4 25.2 54.8 24.8C51.2 24.4 47.9 27.8 47.4 32.4C46.9 37 49.3 41.1 52.9 41.5Z"
          fill="white"
        />
        <path
          d="M63.6 45.4C67 46.3 70.6 43.5 71.6 39.2C72.6 34.9 70.7 30.6 67.3 29.7C63.9 28.8 60.3 31.6 59.3 35.9C58.3 40.2 60.2 44.5 63.6 45.4Z"
          fill="white"
        />
        <defs>
          <linearGradient
            id="guruShieldGradient"
            x1="7"
            y1="4"
            x2="90"
            y2="104"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#01D59B" />
            <stop offset="0.54" stopColor="#27C6B7" />
            <stop offset="1" stopColor="#78C7FF" />
          </linearGradient>
          <linearGradient
            id="guruInnerGradient"
            x1="18"
            y1="15"
            x2="82"
            y2="93"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#0B1534" />
            <stop offset="1" stopColor="#10B981" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}

function TierStars({ stars }: { stars: number }) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${stars} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={`text-base ${
            index < stars ? "text-amber-400" : "text-slate-300"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: string;
}) {
  return (
    <div className="rounded-[1.65rem] border border-slate-200 bg-white px-6 py-5 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black !text-slate-800">{label}</p>
          <p className="mt-2 text-5xl font-black tracking-tight !text-slate-900">
            {value}
          </p>
        </div>
        {icon ? (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-50 text-2xl ring-1 ring-cyan-100">
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BookingCard({ booking }: { booking: BookingRow }) {
  const status = getBookingStatus(booking);

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] !text-slate-700">
            {getBookingService(booking)}
          </p>
          <h3 className="mt-2 text-xl font-black !text-slate-900">
            {getPetName(booking)}
          </h3>
          <p className="mt-1 text-sm font-bold !text-slate-700">
            {getCustomerName(booking)}
          </p>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase !text-emerald-800">
          {status}
        </span>
      </div>
      <p className="mt-4 text-sm font-bold !text-slate-700">
        {getBookingDate(booking)}
      </p>
    </div>
  );
}

function ConversationCard({
  conversation,
}: {
  conversation: DashboardConversation;
}) {
  return (
    <Link
      href={conversation.href}
      className="block rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black !text-slate-900">
            {conversation.name}
          </p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] !text-slate-700">
            {conversation.role}
          </p>
        </div>
        <span className="text-xs font-bold !text-slate-700">
          {formatActivity(conversation.lastActivity)}
        </span>
      </div>
      <p className="mt-3 text-sm font-black !text-slate-900">
        {conversation.subject}
      </p>
      <p className="mt-2 line-clamp-2 text-sm font-bold leading-6 !text-slate-700">
        {conversation.preview}
      </p>
    </Link>
  );
}

function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <h3 className="text-xl font-black !text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm font-bold leading-6 !text-slate-700">
        {body}
      </p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex rounded-full bg-emerald-500 px-6 py-3 text-sm font-black !text-white transition hover:bg-emerald-600"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

function EliteProgressRow({
  label,
  value,
  goal,
  percent,
  icon,
}: {
  label: string;
  value: string;
  goal: string;
  percent: number;
  icon: string;
}) {
  return (
    <div className="rounded-[1rem] border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black !text-slate-900">
            {icon} {label}
          </p>
          <p className="mt-1 text-xs font-bold !text-slate-600">
            Current: {value}
          </p>
        </div>
        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black !text-slate-900 ring-1 ring-cyan-100">
          Goal: {goal}
        </span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#39c8b4_0%,#49aaf0_100%)]"
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
      </div>
    </div>
  );
}

function GuruSetupChecklist({
  profile,
  profileCompletion,
  serviceRatesReady,
}: {
  profile: GuruProfile | null;
  profileCompletion: number;
  serviceRatesReady: boolean;
}) {
  const background = getBackgroundCheckDisplay(profile);
  const onboardingPacket = getGuruOnboardingPacketDisplay();
  const payoutConnected = isPayoutConnected(profile);
  const hasProfile = profileCompletion >= 70;
  const hasServiceArea = Boolean(
    profile?.city ||
      profile?.state ||
      profile?.zip_code ||
      profile?.postal_code,
  );
  const hasServices =
    normalizeServices(profile?.services).length > 0 || serviceRatesReady;

  const steps = [
    {
      number: 1,
      title: "Complete your profile",
      body: "Add your name, bio, profile photo, and experience so Pet Parents know who you are.",
      status: hasProfile ? "complete" : "needs_action",
      statusLabel: hasProfile ? "Complete" : "Needs Action",
      href: "/guru/dashboard/profile?step=1",
    },
    {
      number: 2,
      title: "Set your service area",
      body: "Add your city, state, ZIP/address, and travel radius so local Pet Parents can find you.",
      status: hasServiceArea ? "complete" : "needs_action",
      statusLabel: hasServiceArea ? "Complete" : "Needs Action",
      href: "/guru/dashboard/profile?step=2",
    },
    {
      number: 3,
      title: "Add services, pricing, and public request",
      body: "Choose your care services, confirm your rates, and request public visibility after your setup is ready.",
      status: hasServices ? "complete" : "needs_action",
      statusLabel: hasServices ? "Complete" : "Needs Action",
      href: "/guru/dashboard/profile?step=3",
    },
    {
      number: 4,
      title: "Complete Trust & Safety Screening",
      body: "Your Trust & Safety Screening fee is waived through December 31, 2026 during SitGuru's launch year.",
      status: background.status,
      statusLabel: background.label,
      href: background.href,
    },
    {
      number: 5,
      title: "Complete Guru Onboarding Packet",
      body: "Review and sign your SitGuru Guru Onboarding Packet so your contractor setup, W-9 acknowledgment, safety policies, and onboarding requirements are documented.",
      status: onboardingPacket.status,
      statusLabel: onboardingPacket.label,
      href: onboardingPacket.href,
    },
    {
      number: 6,
      title: "Connect payouts",
      body: "Connect Stripe payouts so SitGuru can pay you after completed bookings.",
      status: payoutConnected ? "complete" : "needs_action",
      statusLabel: payoutConnected ? "Complete" : "Needs Action",
      href: "/api/stripe/connect/onboard?role=guru",
    },
  ];

  const completedSteps = steps.filter(
    (step) => step.status === "complete",
  ).length;
  const allComplete = completedSteps === steps.length;
  const nextStep =
    steps.find((step) => step.status !== "complete") || steps[steps.length - 1];

  const getStepClassName = (status: string) => {
    if (status === "complete") {
      return "border-emerald-400 bg-[linear-gradient(135deg,#10b981_0%,#05a877_100%)] text-white shadow-[0_18px_36px_rgba(5,150,105,0.24)]";
    }
    if (status === "pending") {
      return "border-amber-400 bg-[linear-gradient(135deg,#d97706_0%,#f59e0b_100%)] text-white shadow-[0_18px_36px_rgba(217,119,6,0.22)]";
    }
    return "border-rose-400 bg-[linear-gradient(135deg,#dc2626_0%,#f43f5e_100%)] text-white shadow-[0_18px_36px_rgba(220,38,38,0.24)]";
  };

  const cardClassName = allComplete
    ? "mt-8 overflow-hidden rounded-[2.25rem] border border-emerald-300 bg-white shadow-[0_24px_60px_rgba(5,150,105,0.14)]"
    : "mt-8 overflow-hidden rounded-[2.25rem] border border-rose-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.10)]";

  const headerClassName = allComplete
    ? "bg-[linear-gradient(135deg,#064e3b_0%,#059669_45%,#10b981_100%)] p-6 sm:p-8"
    : "bg-[linear-gradient(135deg,#7f1d1d_0%,#dc2626_45%,#f97316_100%)] p-6 sm:p-8";

  return (
    <section className={cardClassName}>
      <div className={headerClassName}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] !text-white/85">
              {allComplete ? "Onboarding Complete" : "Action Required"}
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.04em] !text-white sm:text-5xl">
              {allComplete
                ? "Your Guru onboarding is complete"
                : "Complete your Guru onboarding"}
            </h2>
            <p className="mt-3 max-w-4xl text-lg font-bold leading-8 !text-white/90">
              {allComplete
                ? "Great work. Your Guru onboarding steps are complete. SitGuru will review your profile before it becomes fully bookable."
                : "Complete these steps so Pet Parents can find you, trust you, book your services, and SitGuru can support your payouts and approval process."}
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-white/15 p-5 text-center ring-1 ring-white/30 backdrop-blur">
            <p className="text-sm font-black uppercase tracking-[0.18em] !text-white/80">
              Onboarding Progress
            </p>
            <p className="mt-1 text-5xl font-black !text-white">
              {completedSteps}/{steps.length}
            </p>
            <p className="mt-1 text-sm font-bold !text-white/85">
              {allComplete ? "all steps complete" : "steps complete"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 lg:p-8">
        <div
          className={`mb-5 flex flex-col gap-3 rounded-[1.5rem] border p-5 sm:flex-row sm:items-center sm:justify-between ${
            allComplete
              ? "border-emerald-200 bg-emerald-50"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <div>
            <p
              className={`text-sm font-black uppercase tracking-[0.18em] ${
                allComplete ? "!text-emerald-700" : "!text-slate-700"
              }`}
            >
              {allComplete ? "All done" : "Next best step"}
            </p>
            <p className="mt-1 text-2xl font-black !text-slate-950">
              {allComplete
                ? `✓ All ${steps.length} onboarding steps are complete`
                : `Step ${nextStep.number} → ${nextStep.title}`}
            </p>
          </div>

          {nextStep.number === 6 && !allComplete ? (
            <a
              href={nextStep.href}
              className="inline-flex min-h-[54px] items-center justify-center rounded-[1rem] bg-[#07132f] px-7 py-3 text-base font-black !text-white shadow-[0_12px_26px_rgba(7,19,47,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0b1436]"
            >
              Continue Onboarding →
            </a>
          ) : (
            <Link
              href={allComplete ? "/guru/dashboard/profile" : nextStep.href}
              className={`inline-flex min-h-[54px] items-center justify-center rounded-[1rem] px-7 py-3 text-base font-black !text-white shadow-[0_12px_26px_rgba(7,19,47,0.18)] transition hover:-translate-y-0.5 ${
                allComplete
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-[#07132f] hover:bg-[#0b1436]"
              }`}
            >
              {allComplete ? "View Profile ✓" : "Continue Onboarding →"}
            </Link>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {steps.map((step) => {
            const isComplete = step.status === "complete";
            const isPending = step.status === "pending";

            const stepCardClassName = `group flex min-h-[230px] flex-col justify-between rounded-[1.45rem] border p-5 transition hover:-translate-y-1 hover:shadow-xl ${getStepClassName(step.status)}`;

            const stepCardContent = (
              <>
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl font-black !text-white ring-1 ring-white/35">
                      {isComplete ? "✓" : step.number}
                    </span>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] !text-white ring-1 ring-white/30">
                      {step.statusLabel}
                    </span>
                  </div>
                  <p className="mt-5 text-lg font-black leading-6 !text-white">
                    Step {step.number} {isComplete ? "✓" : "→"} {step.title}
                  </p>
                  <p className="mt-3 text-sm font-bold leading-6 !text-white/90">
                    {step.body}
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="text-sm font-black !text-white">
                    {step.number === 4
                      ? isComplete
                        ? step.statusLabel.includes("Waived")
                          ? "View waiver"
                          : "View screening"
                        : isPending
                          ? "Check screening status"
                          : "Start screening"
                      : step.number === 5
                        ? isComplete
                          ? "View packet"
                          : "Open packet"
                        : step.number === 6
                          ? isComplete
                            ? "View payouts"
                            : "Set up payouts"
                          : isComplete
                            ? "View details"
                            : isPending
                              ? "Check status"
                              : "Click to complete"}
                  </span>
                  <span className="text-2xl font-black !text-white transition group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </>
            );

            if (step.number === 6 && !isComplete) {
              return (
                <a
                  key={step.number}
                  href={step.href}
                  className={stepCardClassName}
                >
                  {stepCardContent}
                </a>
              );
            }

            return (
              <Link
                key={step.number}
                href={step.href}
                prefetch={step.href.startsWith("/api/") ? false : undefined}
                className={stepCardClassName}
              >
                {stepCardContent}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function GuruAcademyCard({ progress }: { progress: GuruUniversityProgress }) {
  return (
    <section className="mt-8 overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
      <div className="grid gap-6 bg-[radial-gradient(circle_at_88%_20%,rgba(255,255,255,0.88),transparent_20%),linear-gradient(110deg,#ecfdf5_0%,#e8fff7_48%,#e8f7ff_100%)] p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.26em] !text-emerald-800">
            SitGuru University
          </p>
          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.045em] !text-[#07132f] sm:text-5xl">
            Guru Academy
          </h2>
          <p className="mt-3 max-w-3xl text-base font-bold leading-7 !text-slate-700">
            Learn SitGuru. Easy as 1, 2, 3. Watch the Guru intro video, review
            the Guru Success Guide, then acknowledge completion to earn your
            Certified Guru badge.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.25rem] border border-emerald-100 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] !text-emerald-700">
                Progress
              </p>
              <p className="mt-2 text-2xl font-black !text-slate-950">
                {progress.completedSteps} of {progress.totalSteps}
              </p>
              <p className="mt-1 text-xs font-bold !text-slate-600">
                {progress.progressHelper}
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-emerald-100 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] !text-emerald-700">
                Badge
              </p>
              <p className="mt-2 text-2xl font-black !text-slate-950">
                {progress.badgeStatus}
              </p>
              <p className="mt-1 text-xs font-bold !text-slate-600">
                {progress.isComplete
                  ? "Certified Guru badge issued"
                  : "Issued after academy completion"}
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-emerald-100 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] !text-emerald-700">
                Estimated Time
              </p>
              <p className="mt-2 text-2xl font-black !text-slate-950">
                10–15 min
              </p>
              <p className="mt-1 text-xs font-bold !text-slate-600">
                Mobile-friendly training
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/guru/dashboard/university"
              className="inline-flex min-h-[52px] items-center justify-center rounded-[1rem] bg-emerald-600 px-7 py-3 text-base font-black !text-white shadow-[0_12px_26px_rgba(5,150,105,0.18)] transition hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              {progress.academyButtonLabel}
            </Link>
            <Link
              href="/guru/dashboard/profile?step=1"
              className="inline-flex min-h-[52px] items-center justify-center rounded-[1rem] border border-emerald-200 bg-white px-7 py-3 text-base font-black !text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
            >
              Review My Profile
            </Link>
            <Link
              href="/guru/dashboard/earnings"
              className="inline-flex min-h-[52px] items-center justify-center rounded-[1rem] border border-emerald-200 bg-white px-7 py-3 text-base font-black !text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
            >
              Review Payouts
            </Link>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-emerald-100 bg-white/90 p-5 shadow-sm">
          <p className="text-sm font-black !text-slate-950">
            What you will learn
          </p>
          <div className="mt-4 grid gap-3">
            {[
              "Complete and polish your Guru profile",
              "Manage bookings, messages, care details, and reviews",
              "Follow SitGuru trust, safety, and pet care standards",
              "Understand Stripe payouts, earnings, and tax reminders",
              "Use the Guru Success Center to keep growing",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black !text-emerald-900"
              >
                ✓ {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PublicBookButton({
  disabled,
  href,
  className,
}: {
  disabled: boolean;
  href: string;
  className: string;
}) {
  if (disabled) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className={`${className} cursor-not-allowed opacity-55`}
      >
        Book This Guru
      </button>
    );
  }

  return (
    <Link href={href} className={className}>
      Book This Guru
    </Link>
  );
}

function PublicGuruProfilePage({
  guruProfile,
  serviceRates,
  identifier,
  universityProgress,
}: {
  guruProfile: GuruProfile;
  serviceRates: GuruServiceRateRow[];
  identifier: string;
  universityProgress: GuruUniversityProgress;
}) {
  const name = getGuruName(guruProfile);
  const firstName = getFirstName(name);
  const imageUrl = getGuruImage(guruProfile);
  const location = getGuruLocation(guruProfile);
  const services = normalizeServices(guruProfile.services);
  const baseRate = getBaseRate(guruProfile);
  const rating = getGuruRating(guruProfile);
  const reviewCount = getReviewCount(guruProfile);
  const experienceYears = getExperienceYears(guruProfile);
  const serviceRadius = getGuruRadius(guruProfile);
  const bookHref = getBookHref(guruProfile, identifier);
  const messageHref = getMessageHref(guruProfile, identifier);
  const bookable = isBookable(guruProfile);
  const isFillInGuru = isFillInGuruProfile(guruProfile);
  const disableBooking = isFillInGuru;
  const isAcademyGraduate = universityProgress.isComplete;

  return (
    <main
      className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_40%,#ecfdf5_100%)] font-light text-slate-900"
      style={SITE_FONT_STYLE}
    >
      <section className="mx-auto max-w-[1440px] px-5 py-8 sm:px-6 lg:px-8">
        <Link
          href="/search"
          className="mb-6 inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-black !text-emerald-800 shadow-sm transition hover:bg-emerald-50"
        >
          ← Back to Find Care
        </Link>

        <section className="overflow-hidden rounded-[2.3rem] border border-white bg-[radial-gradient(circle_at_18%_15%,rgba(255,255,255,0.42)_0%,transparent_28%),linear-gradient(105deg,#03d39c_0%,#72dec5_45%,#b9e3ff_100%)] shadow-[0_24px_52px_rgba(15,23,42,0.12)]">
          <div className="grid gap-8 p-8 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:p-10">
            <PublicGuruHeroImage
              name={name}
              imageUrl={imageUrl}
              isAcademyGraduate={isAcademyGraduate}
            />

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.34em] !text-[#07132f]">
                SitGuru Public Guru Profile
              </p>

              <h1 className="mt-4 text-5xl font-extrabold leading-[0.98] tracking-[-0.055em] !text-[#07132f] sm:text-6xl lg:text-7xl">
                Meet {firstName} 🐾
              </h1>

              <p className="mt-5 max-w-3xl text-xl font-light leading-9 !text-slate-700">
                {getGuruTitle(guruProfile)}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm font-black !text-emerald-800 shadow-sm">
                  <GuruPawCrest className="h-6 w-6" />
                  {guruProfile.is_verified ? "Verified Guru" : "Trusted Guru"}
                </div>

                {isAcademyGraduate ? (
                  <AcademyGraduateBadge academyType="guru" variant="chip" />
                ) : null}

                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm font-black !text-slate-900 shadow-sm">
                  📍 {location}
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm font-black !text-slate-900 shadow-sm">
                  🗺️ {serviceRadius}-mile service area
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm font-black !text-slate-900 shadow-sm">
                  {bookable && !disableBooking ? "✅ Bookable" : "📝 Profile setup"}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <PublicBookButton
                  disabled={disableBooking}
                  href={bookHref}
                  className="rounded-[1.2rem] bg-[#07132f] px-7 py-4 text-base font-extrabold !text-white shadow-[0_12px_28px_rgba(7,19,47,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0b1436]"
                />

                <Link
                  href={messageHref}
                  className="rounded-[1.2rem] bg-white/90 px-7 py-4 text-base font-extrabold !text-slate-900 shadow-[0_10px_22px_rgba(15,23,42,0.08)] ring-1 ring-white/70 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Message Guru
                </Link>

                <Link
                  href="/signup"
                  className="rounded-[1.2rem] bg-emerald-700 px-7 py-4 text-base font-extrabold !text-white shadow-[0_12px_28px_rgba(5,150,105,0.18)] transition hover:-translate-y-0.5 hover:bg-emerald-800"
                >
                  Sign Up Free
                </Link>
              </div>

              <p className="mt-4 max-w-2xl text-sm font-bold leading-6 !text-slate-700">
                You can view Guru profiles without signing in. Booking or
                messaging may ask Pet Parents to sign in so SitGuru can protect
                both sides of the care request.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Rating"
            value={rating > 0 ? rating.toFixed(1) : "New"}
            icon="⭐"
          />
          <StatCard label="Reviews" value={reviewCount} icon="💬" />
          <StatCard
            label="Experience"
            value={experienceYears > 0 ? `${experienceYears}+` : "Listed"}
            icon="🐕"
          />
          <StatCard label="Rate" value={baseRate || "By service"} icon="💚" />
          <StatCard label="Service Area" value={`${serviceRadius} mi`} icon="📍" />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_42px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-black uppercase tracking-[0.28em] !text-[#07132f]">
              About This Guru
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] !text-[#07132f]">
              {name}
            </h2>

            <p className="mt-4 whitespace-pre-line text-base font-bold leading-8 !text-slate-700">
              {guruProfile.bio ||
                "This Guru is building their SitGuru profile. More details about their care style, experience, and pet preferences will appear here soon."}
            </p>
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_42px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-black uppercase tracking-[0.28em] !text-[#07132f]">
              Services
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] !text-[#07132f]">
              Care offered
            </h2>

            <div className="mt-5 grid gap-3">
              {services.length ? (
                services.map((service) => (
                  <span
                    key={service}
                    className="rounded-full bg-emerald-50 px-4 py-3 text-sm font-black !text-emerald-800 ring-1 ring-emerald-100"
                  >
                    {service}
                  </span>
                ))
              ) : (
                <span className="rounded-full bg-amber-50 px-4 py-3 text-sm font-black !text-amber-800 ring-1 ring-amber-100">
                  Services pending
                </span>
              )}
            </div>
          </aside>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_42px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] !text-[#07132f]">
                Service Rates
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] !text-[#07132f]">
                Pricing details
              </h2>
            </div>

            <p className="text-sm font-bold !text-slate-600">
              Final care details are confirmed during booking.
            </p>
          </div>

          {serviceRates.length ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {serviceRates
                .filter((rate) => rate.is_enabled !== false)
                .map((rate) => {
                  const formatted = formatServiceRate(rate);

                  return (
                    <div
                      key={String(
                        rate.id || `${rate.guru_id}-${rate.service_key}`,
                      )}
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm"
                    >
                      <p className="text-lg font-black !text-slate-900">
                        {rate.service_label || "Pet care service"}
                      </p>

                      <p className="mt-2 text-3xl font-black !text-emerald-700">
                        {formatted.primary}
                        <span className="ml-1 text-sm font-bold !text-slate-600">
                          {formatted.detail}
                        </span>
                      </p>

                      {rate.notes ? (
                        <p className="mt-3 text-sm font-bold leading-6 !text-slate-600">
                          {rate.notes}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <h3 className="text-xl font-black !text-slate-900">
                Rates are being finalized
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm font-bold leading-6 !text-slate-700">
                Profile details are available while booking setup is finalized.
              </p>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[2rem] border border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_100%)] p-6 shadow-[0_16px_42px_rgba(15,23,42,0.08)]">
          <div className="grid gap-5 lg:grid-cols-[1fr_260px_260px] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] !text-emerald-800">
                Ready to connect?
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] !text-[#07132f]">
                View trusted local pet care with {firstName}
              </h2>

              <p className="mt-2 text-sm font-bold leading-6 !text-slate-700">
                View the profile, check services, and search more local Gurus
                when you are ready.
              </p>
            </div>

            <PublicBookButton
              disabled={disableBooking}
              href={bookHref}
              className="flex min-h-[58px] items-center justify-center rounded-[1rem] bg-[#07132f] px-6 py-4 text-base font-black !text-white shadow-[0_12px_28px_rgba(7,19,47,0.18)] hover:bg-[#0b1436]"
            />

            <Link
              href="/search"
              className="flex min-h-[58px] items-center justify-center rounded-[1rem] border border-emerald-200 bg-white px-6 py-4 text-base font-black !text-emerald-800 shadow-sm hover:bg-emerald-50"
            >
              Search More Gurus
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}

async function GuruDashboardView({
  user,
  guruProfile,
}: {
  user: ActiveUser;
  guruProfile: GuruProfile;
}) {
  const [bookings, conversations, serviceRates, universityProgress] =
    await Promise.all([
      getGuruBookings(guruProfile, user.id),
      getGuruConversations(guruProfile, user.id),
      getGuruServiceRates(guruProfile),
      getGuruUniversityProgress(user.id),
    ]);

  const name = getGuruName(guruProfile, user.email);
  const welcomeName = getFirstName(name);
  const imageUrl = getGuruImage(guruProfile);
  const location = getGuruLocation(guruProfile);
  const profileCompletion = calculateProfileCompletion(guruProfile);
  const bookable = isBookable(guruProfile);
  const completedBookings = bookings.filter(
    (booking) => getBookingStatus(booking).toLowerCase() === "completed",
  );
  const upcomingBookings = bookings.filter((booking) => {
    const status = getBookingStatus(booking).toLowerCase();
    return !["completed", "complete", "cancelled", "canceled"].includes(status);
  });
  const guruTier = getGuruTier(
    completedBookings.length,
    profileCompletion,
    bookable,
    universityProgress.isComplete,
  );
  const eliteProgress = getEliteProgress({
    completedBookingsCount: completedBookings.length,
    profileCompletion,
    bookable,
  });

  return (
    <main
      className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_40%,#ecfdf5_100%)] font-light text-slate-900"
      style={SITE_FONT_STYLE}
    >
      <section className="mx-auto max-w-[1440px] px-5 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2.3rem] border border-white bg-[radial-gradient(circle_at_18%_15%,rgba(255,255,255,0.42)_0%,transparent_28%),linear-gradient(105deg,#03d39c_0%,#72dec5_45%,#b9e3ff_100%)] shadow-[0_24px_52px_rgba(15,23,42,0.12)]">
          <div className="grid gap-8 p-8 lg:grid-cols-[1.15fr_340px] lg:items-center lg:p-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.34em] !text-[#07132f]">
                SitGuru Guru Portal
              </p>
              <h1 className="mt-4 text-5xl font-extrabold leading-[0.98] tracking-[-0.055em] !text-[#07132f] sm:text-6xl lg:text-7xl">
                Welcome back, {welcomeName} 👋
              </h1>
              <p className="mt-5 max-w-3xl text-xl font-light leading-9 !text-slate-700">
                Manage bookings, messages, availability, earnings, academy
                training, and profile photos — all in one polished Guru
                workspace.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black ${guruTier.badgeClassName}`}
                >
                  <GuruPawCrest className="h-6 w-6" />
                  <span>{guruTier.label}</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2">
                  {universityProgress.isComplete ? (
                    <AcademyGraduateBadge academyType="guru" variant="mini" />
                  ) : (
                    <GuruPawCrest className="h-6 w-6" />
                  )}
                  <span className="text-sm font-black !text-slate-900">
                    {universityProgress.isComplete
                      ? "Guru Academy Graduate"
                      : universityProgress.certificationLabel}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2">
                  <TierStars stars={guruTier.stars} />
                  <span className="text-sm font-black !text-slate-900">
                    {eliteProgress}% to Elite Guru
                  </span>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/guru/dashboard/bookings"
                  className="rounded-[1.2rem] bg-[#07132f] px-7 py-4 text-base font-extrabold !text-white shadow-[0_12px_28px_rgba(7,19,47,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0b1436]"
                >
                  My Bookings
                </Link>
                <Link
                  href="/guru/dashboard/messages"
                  className="rounded-[1.2rem] bg-white/90 px-7 py-4 text-base font-extrabold !text-slate-900 shadow-[0_10px_22px_rgba(15,23,42,0.08)] ring-1 ring-white/70 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Open Messages
                </Link>
                <Link
                  href="/guru/dashboard/availability"
                  className="rounded-[1.2rem] bg-white/90 px-7 py-4 text-base font-extrabold !text-slate-900 shadow-[0_10px_22px_rgba(15,23,42,0.08)] ring-1 ring-white/70 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Availability
                </Link>
                <Link
                  href="/guru/dashboard/profile"
                  className="rounded-[1.2rem] bg-white/90 px-7 py-4 text-base font-extrabold !text-slate-900 shadow-[0_10px_22px_rgba(15,23,42,0.08)] ring-1 ring-white/70 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  My Profile
                </Link>
                <Link
                  href="/guru/dashboard/earnings"
                  className="rounded-[1.2rem] bg-white/90 px-7 py-4 text-base font-extrabold !text-slate-900 shadow-[0_10px_22px_rgba(15,23,42,0.08)] ring-1 ring-white/70 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Earnings
                </Link>
                <Link
                  href="/guru/dashboard/university"
                  className="rounded-[1.2rem] bg-emerald-700 px-7 py-4 text-base font-extrabold !text-white shadow-[0_12px_28px_rgba(5,150,105,0.18)] transition hover:-translate-y-0.5 hover:bg-emerald-800"
                >
                  Guru Academy
                </Link>
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <GuruAvatar
                name={name}
                imageUrl={imageUrl}
                isAcademyGraduate={universityProgress.isComplete}
              />
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] !text-[#07132f]">
                {name}
              </h2>
              <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-4 py-2 text-sm font-black !text-emerald-800 shadow-sm">
                <GuruPawCrest className="h-6 w-6" />
                {guruTier.label}
              </div>
              <div className="mt-2 flex flex-col items-center gap-1">
                <TierStars stars={guruTier.stars} />
                <p className="text-sm font-semibold !text-slate-700">
                  {getGuruTitle(guruProfile)}
                </p>
                <p className="text-sm font-semibold !text-slate-700">
                  {location}
                </p>
              </div>
              <div className="mt-5 w-full max-w-[300px] rounded-[1.4rem] bg-white/90 p-4 text-left shadow-[0_12px_28px_rgba(15,23,42,0.10)] ring-1 ring-white/70">
                <GuruMediaUploader
                  userId={user.id}
                  guruProfileId={String(guruProfile.id ?? "")}
                  displayName={name}
                  initialPhotoUrl={imageUrl}
                />
              </div>
            </div>
          </div>
        </section>

        <GuruSetupChecklist
          profile={guruProfile}
          profileCompletion={profileCompletion}
          serviceRatesReady={hasEnabledPricedServiceRates(serviceRates)}
        />

        <GuruAcademyCard progress={universityProgress} />

        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Bookings" value={bookings.length} icon="🗓️" />
          <StatCard
            label="Upcoming"
            value={upcomingBookings.length}
            icon="⏱️"
          />
          <StatCard
            label="Completed"
            value={completedBookings.length}
            icon="✅"
          />
          <StatCard label="Unread" value={0} icon="💬" />
          <StatCard label="Profile" value={`${profileCompletion}%`} icon="⭐" />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_42px_rgba(15,23,42,0.08)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] !text-[#07132f]">
                  Bookings
                </p>
                <h2 className="text-2xl font-black !text-[#07132f]">
                  Your care schedule
                </h2>
              </div>
              <Link
                href="/guru/dashboard/bookings"
                className="rounded-full border border-cyan-200 px-4 py-2 text-sm font-black !text-[#07132f] hover:bg-cyan-50"
              >
                View all bookings
              </Link>
            </div>
            <div className="grid gap-4">
              {upcomingBookings.length ? (
                upcomingBookings
                  .slice(0, 3)
                  .map((booking) => (
                    <BookingCard
                      key={String(booking.id || Math.random())}
                      booking={booking}
                    />
                  ))
              ) : (
                <EmptyState
                  title="No upcoming bookings yet"
                  body="Once customers book you, upcoming care will appear here."
                />
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_42px_rgba(15,23,42,0.08)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] !text-[#07132f]">
                  Messages
                </p>
                <h2 className="text-2xl font-black !text-[#07132f]">
                  Inbox activity
                </h2>
              </div>
              <Link
                href="/guru/dashboard/messages"
                className="rounded-full border border-cyan-200 px-4 py-2 text-sm font-black !text-[#07132f] hover:bg-cyan-50"
              >
                Open inbox
              </Link>
            </div>
            <div className="grid gap-4">
              {conversations.length ? (
                conversations
                  .slice(0, 3)
                  .map((conversation) => (
                    <ConversationCard
                      key={conversation.id}
                      conversation={conversation}
                    />
                  ))
              ) : (
                <EmptyState
                  title="No messages yet"
                  body="Customer and Admin messages will appear here."
                />
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div
            className={`rounded-[2rem] border p-6 shadow-[0_16px_42px_rgba(15,23,42,0.08)] ${guruTier.cardClassName}`}
          >
            <p className="text-xs font-black uppercase tracking-[0.28em] !text-[#07132f]">
              Guru Recognition
            </p>
            <h2 className="mt-1 text-3xl font-black tracking-[-0.035em] !text-[#07132f]">
              {universityProgress.isComplete
                ? "Guru Academy Graduate badge issued"
                : "Become a Guru Academy Graduate"}
            </h2>
            <p className="mt-2 max-w-4xl text-sm font-bold leading-7 !text-slate-700">
              {universityProgress.isComplete
                ? "Your Guru Academy Graduate badge is active. Keep your profile polished, respond quickly, and deliver trusted care to move toward Elite Guru."
                : "Complete Guru Academy to unlock your Guru Academy Graduate badge. This badge helps Pet Parents understand that you completed SitGuru University onboarding."}
            </p>

            <div className="mt-6 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div className="rounded-[1.5rem] border border-cyan-200 bg-white/70 p-5 text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-cyan-50 ring-1 ring-cyan-100">
                  {universityProgress.isComplete ? (
                    <AcademyGraduateBadge academyType="guru" variant="mini" />
                  ) : (
                    <span className="text-4xl">🛡️</span>
                  )}
                </div>
                <p className="mt-4 text-xl font-black !text-[#07132f]">
                  Current crest: {guruTier.label}
                </p>
                <p className="mt-2 text-sm font-bold leading-6 !text-slate-700">
                  {guruTier.description}
                </p>
              </div>

              <div className="grid gap-4">
                <EliteProgressRow
                  label="Complete happy pet care bookings"
                  value={`${completedBookings.length} completed`}
                  goal="25 completed"
                  percent={Math.min(
                    100,
                    Math.round((completedBookings.length / 25) * 100),
                  )}
                  icon="🐕"
                />
                <EliteProgressRow
                  label="Keep your Guru profile polished"
                  value={`${profileCompletion}% complete`}
                  goal="90% complete"
                  percent={Math.min(
                    100,
                    Math.round((profileCompletion / 90) * 100),
                  )}
                  icon="🧹"
                />
                <EliteProgressRow
                  label="Complete Guru Academy"
                  value={
                    universityProgress.isComplete
                      ? "Graduate"
                      : "Not certified yet"
                  }
                  goal="Guru Academy Graduate"
                  percent={
                    universityProgress.isComplete
                      ? 100
                      : universityProgress.progressPercent
                  }
                  icon="🛡️"
                />
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_42px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-black uppercase tracking-[0.28em] !text-[#07132f]">
              Public Profile
            </p>
            <h2 className="mt-1 text-2xl font-black !text-[#07132f]">
              {profileCompletion}% complete
            </h2>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#39c8b4_0%,#49aaf0_100%)]"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
            <div className="mt-5 grid gap-3">
              {normalizeServices(guruProfile.services)
                .slice(0, 4)
                .map((service) => (
                  <span
                    key={service}
                    className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-black !text-emerald-800 ring-1 ring-emerald-100"
                  >
                    {service}
                  </span>
                ))}
              {!normalizeServices(guruProfile.services).length ? (
                <span className="rounded-full bg-amber-50 px-3 py-2 text-sm font-black !text-amber-800 ring-1 ring-amber-100">
                  Services pending
                </span>
              ) : null}
            </div>
            <div className="mt-5 rounded-[1rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] !text-slate-700">
                Current Booking Status
              </p>
              <p className="mt-1 text-lg font-black !text-slate-900">
                {bookable ? "Bookable" : "Profile setup"}
              </p>
            </div>
            <Link
              href="/guru/dashboard/profile"
              className="mt-5 flex min-h-[54px] items-center justify-center rounded-[1rem] bg-[#07132f] px-6 py-3 text-base font-black !text-white hover:bg-[#0b1436]"
            >
              Update Profile
            </Link>
          </aside>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_42px_rgba(15,23,42,0.08)]">
          <div className="grid gap-5 lg:grid-cols-[1fr_280px_280px] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] !text-[#07132f]">
                Availability & Earnings
              </p>
              <h2 className="text-2xl font-black !text-[#07132f]">
                Stay ready to book
              </h2>
              <p className="mt-2 text-sm font-bold leading-6 !text-slate-700">
                Keep your calendar current, finish Guru Academy, and make it
                easy for Pet Parents to trust and choose you.
              </p>
            </div>
            <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] !text-slate-700">
                Availability
              </p>
              <p className="mt-1 text-lg font-black !text-slate-900">
                Keep your schedule updated
              </p>
              <Link
                href="/guru/dashboard/availability"
                className="mt-4 flex rounded-xl bg-cyan-500 px-5 py-3 text-sm font-black !text-white hover:bg-cyan-600"
              >
                Manage Availability
              </Link>
            </div>
            <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] !text-slate-700">
                Rate
              </p>
              <p className="mt-1 text-lg font-black !text-slate-900">
                {guruProfile.rate ||
                guruProfile.hourly_rate ||
                guruProfile.price
                  ? "Rate ready"
                  : "Rate pending"}
              </p>
              <Link
                href="/guru/dashboard/earnings"
                className="mt-4 flex rounded-xl border border-cyan-200 px-5 py-3 text-sm font-black !text-[#07132f] hover:bg-cyan-50"
              >
                View Earnings
              </Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

export default async function GuruSlugPage({ params }: PageProps) {
  const resolvedParams = await params;
  const identifier = cleanIdentifier(resolvedParams.slug);

  const publicGuruProfile = await getPublicGuruProfile(identifier);

  if (!publicGuruProfile || publicGuruProfile.is_active === false) {
    notFound();
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isViewingOwnGuruProfile =
    Boolean(user?.id) &&
    Boolean(publicGuruProfile.user_id) &&
    user?.id === publicGuruProfile.user_id;

  if (isViewingOwnGuruProfile && user) {
    const guruProfile = await getGuruProfile(user.id, user.email);

    if (!guruProfile) {
      redirect("/guru/application");
    }

    return (
      <GuruDashboardView
        user={{
          id: user.id,
          email: user.email,
        }}
        guruProfile={guruProfile}
      />
    );
  }

  const [serviceRates, universityProgress] = await Promise.all([
    getGuruServiceRates(publicGuruProfile),
    publicGuruProfile.user_id
      ? getGuruUniversityProgress(publicGuruProfile.user_id)
      : Promise.resolve({
          totalSteps: 1,
          completedSteps: 0,
          totalMaterials: 0,
          acknowledgedMaterials: 0,
          requiredMaterials: 0,
          progressPercent: 0,
          isStarted: false,
          isComplete: false,
          certificationLabel: "Certified Guru: Not started",
          badgeStatus: "Locked",
          progressHelper:
            "Watch the Guru intro video, review the Guru Success Guide, and acknowledge completion.",
          academyButtonLabel: "Start Guru Academy",
        } satisfies GuruUniversityProgress),
  ]);

  return (
    <PublicGuruProfilePage
      guruProfile={publicGuruProfile}
      serviceRates={serviceRates}
      identifier={identifier}
      universityProgress={universityProgress}
    />
  );
}