import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileSearch,
  FileText,
  ShieldCheck,
  Sparkles,
  Star,
  UserPlus,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import GuruRecordsTable from "./GuruRecordsTable";
import {
  CANONICAL_ROLE,
  PET_PARENT_DISPLAY_LABEL,
  avatarImageFallback,
  displayNameFallback,
  emailFallback,
  isSitGuruSuperUser,
  normalizeRoleAlias,
  phoneFallback,
} from "@/lib/sitguru/display";

export const dynamic = "force-dynamic";

type GuruRow = Record<string, unknown>;
type ProfileRow = Record<string, unknown>;
type BackgroundCheckRow = Record<string, unknown>;
type GuruLeadRow = Record<string, unknown>;

type AuthUserRow = {
  id: string;
  email?: string;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
};

type GuruLeadPipelineData = {
  total: number;
  new: number;
  contacted: number;
  interested: number;
  applicationSent: number;
  applied: number;
  approvedGuru: number;
  notMovingForward: number;
  referralLeads: number;
  topSource: string;
  topReferralCode: string;
  totalReferralCodes: number;
  hiddenReferralCodes: number;
  sourceChart: ChartItem[];
  referralCodeChart: ChartItem[];
};

type GuruOnboardingPacketAdminRow = {
  id: string;
  userId: string;
  legalName: string;
  status: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  adminNotes: string;
  documentCount: number;
  messageHref: string;
};

type GuruOnboardingPacketAdminData = {
  total: number;
  submitted: number;
  needsFix: number;
  approved: number;
  documents: number;
  latest: GuruOnboardingPacketAdminRow[];
};

type SearchParams = {
  status?: string;
  filter?: string;
  queue?: string;
  setupStep?: string;
  stuckBeforeStep?: string;
  guru?: string;
  q?: string;
};

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type ApplicationStatus =
  | "new"
  | "reviewing"
  | "needs_info"
  | "pre_approved"
  | "verification_pending"
  | "approved"
  | "bookable"
  | "rejected"
  | "suspended";

type GuruDisplayRow = {
  id: string;
  userId: string;
  guruUserId: string;
  messageHref: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  slug: string;
  services: string;
  location: string;
  experience: string;
  applicationStatus: ApplicationStatus;
  statusLabel: string;
  profileQuality: string;
  identityStatus: string;
  backgroundStatus: string;
  safetyStatus: string;
  bookable: boolean;
  approvedThisWeek: boolean;
  flaggedForReview: boolean;
  setupStep: number;
  setupStepLabel: string;
  joined: string;
  href: string;
  publicHref: string;
  inferredFromFallback: boolean;
  recordSourceLabel: string;
};

type ChartItem = {
  label: string;
  value: number;
  helper?: string;
};

type QueueConfig = {
  key: string;
  eyebrow: string;
  title: string;
  description: string;
};

type SetupStepConfig = {
  step: number;
  eyebrow: string;
  title: string;
  description: string;
};

const adminRoutes = {
  dashboard: "/admin",
  gurus: "/admin/gurus",
  guruLeads: "/admin/gurus/leads",
  guruOnboardingPackets: "/admin/gurus/onboarding-packets",
  guruExport: "/admin/gurus/export",
  newGuru: "/admin/gurus/new",
  approvals: "/admin/guru-approvals",
  performance: "/admin/guru-performance",
  backgroundChecks: "/admin/background-checks",
  analytics: "/admin/analytics",
};

const chartColors = [
  "#166534",
  "#16a34a",
  "#22c55e",
  "#84cc16",
  "#0f766e",
  "#0ea5e9",
  "#8b5cf6",
  "#f59e0b",
];

const queueConfigs: Record<string, QueueConfig> = {
  "pending-reviews": {
    key: "pending-reviews",
    eyebrow: "Guru Approval Queue",
    title: "Pending Reviews",
    description:
      "Focused Admin queue showing Gurus who are not bookable yet and still need review, verification, profile follow-up, approval, or a final bookable decision.",
  },
  "approved-this-week": {
    key: "approved-this-week",
    eyebrow: "Guru Approval Queue",
    title: "Approved This Week",
    description:
      "Focused Admin queue showing Gurus who were approved, activated, or made bookable within the last 7 days so Admin can review recent launch decisions and follow-up actions.",
  },
  "profile-updates": {
    key: "profile-updates",
    eyebrow: "Guru Approval Queue",
    title: "Need Profile Updates",
    description:
      "Focused Admin queue showing Gurus missing important public profile details such as name, bio, location, or services so Admin can request updates before approval.",
  },
  "flagged-review": {
    key: "flagged-review",
    eyebrow: "Guru Approval Queue",
    title: "Flagged for Review",
    description:
      "Focused Admin queue showing Gurus with flagged, suspended, rejected, failed, risk, or needs-review signals so Admin can investigate trust, safety, or quality concerns.",
  },
};

const setupStepConfigs: Record<string, SetupStepConfig> = {
  "1": {
    step: 1,
    eyebrow: "Guru Setup Funnel",
    title: "Step 1: Account / Profile Started",
    description:
      "Focused setup queue showing Gurus who have reached Step 1 or beyond. These Gurus have an account, profile link, email, or Guru record started.",
  },
  "2": {
    step: 2,
    eyebrow: "Guru Setup Funnel",
    title: "Step 2: Services / Area Added",
    description:
      "Focused setup queue showing Gurus who have reached Step 2 or beyond. These Gurus have service, location, radius, or pricing data started.",
  },
  "3": {
    step: 3,
    eyebrow: "Guru Setup Funnel",
    title: "Step 3: Profile Ready",
    description:
      "Focused setup queue showing Gurus who have reached Step 3 or beyond. These Gurus have stronger public profile readiness signals such as bio, experience, photo, and service information.",
  },
  "4": {
    step: 4,
    eyebrow: "Guru Setup Funnel",
    title: "Step 4: Checkr / Trust Started",
    description:
      "Focused setup queue showing Gurus who have reached Step 4 or beyond. These Gurus have Checkr package, invitation, candidate, report, or background status activity.",
  },
  "5": {
    step: 5,
    eyebrow: "Guru Setup Funnel",
    title: "Step 5: Approved / Bookable",
    description:
      "Focused setup queue showing Gurus who have reached Step 5. These Gurus are approved, active, or bookable.",
  },
};

const stuckBeforeStepConfigs: Record<string, SetupStepConfig> = {
  "1": {
    step: 1,
    eyebrow: "Guru Missing-Step Queue",
    title: "Missing Step 1: Account / Profile Started",
    description:
      "Focused Admin queue showing Gurus who have not reached Step 1 yet. This should usually be zero because every Guru row should have a basic account or profile record.",
  },
  "2": {
    step: 2,
    eyebrow: "Guru Missing-Step Queue",
    title: "Missing Step 2: Services / Area Added",
    description:
      "Focused Admin queue showing Gurus who have not added enough service, location, radius, or pricing data. These Gurus need help completing their service setup.",
  },
  "3": {
    step: 3,
    eyebrow: "Guru Missing-Step Queue",
    title: "Missing Step 3: Profile Ready",
    description:
      "Focused Admin queue showing Gurus whose public profile is not ready yet. These Gurus need stronger bio, experience, photo, services, or profile details.",
  },
  "4": {
    step: 4,
    eyebrow: "Guru Missing-Step Queue",
    title: "Missing Step 4: Checkr / Trust Started",
    description:
      "Focused Admin queue showing Gurus who have not started the Checkr or Trust & Safety workflow. These Gurus need background check payment, package, invite, or status follow-up.",
  },
  "5": {
    step: 5,
    eyebrow: "Guru Missing-Step Queue",
    title: "Missing Step 5: Approved / Bookable",
    description:
      "Focused Admin queue showing Gurus who are not approved, active, or bookable yet. These Gurus need final Admin review before becoming Pet Parent-visible.",
  },
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeForMatching(value: unknown) {
  return asTrimmedString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAnyNonEmptyValue(...values: unknown[]) {
  return values.some((value) => asTrimmedString(value).length > 0);
}

function normalizeProfileRole(profile: ProfileRow) {
  const canonicalRole = normalizeRoleAlias(asTrimmedString(profile.role));

  if (canonicalRole === CANONICAL_ROLE.PET_PARENT) {
    return PET_PARENT_DISPLAY_LABEL;
  }

  return canonicalRole || asTrimmedString(profile.role).toLowerCase();
}

function isGuruProfile(profile: ProfileRow) {
  return normalizeProfileRole(profile) === CANONICAL_ROLE.GURU;
}

const nonRealGuruNameMatchers = [
  "avery",
  "avery johnson",
  "caleb",
  "caleb brooks",
  "darius",
  "darius miller",
  "emma",
  "emma walsh",
  "maya",
  "maya reynolds",
  "nina",
  "nina patel",
  "olivia",
  "olivia chen",
  "sofia",
  "sofia martinez",
  "suzy",
  "suzy q",
  "suzyq",
];

const nonRealGuruTextFragments = [
  "test",
  "demo",
  "fake",
  "example",
  "bot",
  "deleted auth user",
  "joe1",
  "joesmith",
  "joe smith",
  "ml00plicsglqerez",
  "cnwsz kzpncpzipvqcn",
];

function isNonRealGuruRecord(guru: GuruRow, profile?: ProfileRow) {
  const name = normalizeForMatching(
    getGuruName(guru, profile) ||
      guru.display_name ||
      guru.full_name ||
      guru.name ||
      profile?.full_name ||
      profile?.name,
  );
  const displayEmail = getGuruEmail(guru, profile);
  const email = normalizeForMatching(displayEmail);

  if (isSitGuruSuperUser(displayEmail)) {
    return true;
  }
  const slug = normalizeForMatching(guru.slug || profile?.slug);
  const id = normalizeForMatching(guru.id || guru.user_id || guru.profile_id);
  const source = normalizeForMatching(guru.source || profile?.source);
  const avatar = asTrimmedString(
    guru.avatar_url ||
      guru.profile_photo_url ||
      guru.photo_url ||
      guru.image_url ||
      profile?.avatar_url ||
      profile?.profile_photo_url ||
      profile?.photo_url ||
      profile?.image_url,
  ).toLowerCase();

  const comparableValues = [name, email, slug, id, source].filter(Boolean);

  if (
    comparableValues.some((value) => nonRealGuruNameMatchers.includes(value))
  ) {
    return true;
  }

  if (
    comparableValues.some((value) =>
      nonRealGuruTextFragments.some((fragment) => value.includes(fragment)),
    )
  ) {
    return true;
  }

  if (avatar.includes("/images/demo/") || avatar.includes("/demo/")) {
    return true;
  }

  return false;
}

function mergeGuruRecords(existing: GuruRow, incoming: GuruRow) {
  const merged: GuruRow = { ...existing };

  for (const [key, incomingValue] of Object.entries(incoming)) {
    const existingValue = merged[key];

    if (Array.isArray(existingValue)) {
      if (!existingValue.length && Array.isArray(incomingValue)) {
        merged[key] = incomingValue;
      }
      continue;
    }

    if (
      !hasAnyNonEmptyValue(existingValue) &&
      (Array.isArray(incomingValue)
        ? incomingValue.length > 0
        : hasAnyNonEmptyValue(incomingValue))
    ) {
      merged[key] = incomingValue;
    }
  }

  return merged;
}

function addGuruRecordToMap(map: Map<string, GuruRow>, guru: GuruRow) {
  const incomingKeys = getGuruRecordIdentityKeys(guru);
  const primaryKey = incomingKeys[0];

  if (!primaryKey) return;

  const matchedKey = incomingKeys.find((key) => map.has(key));

  if (matchedKey) {
    const existing = map.get(matchedKey) || {};
    const merged = mergeGuruRecords(existing, guru);
    const mergedKeys = Array.from(
      new Set([
        ...getGuruRecordIdentityKeys(existing),
        ...incomingKeys,
        ...getGuruRecordIdentityKeys(merged),
      ]),
    );

    for (const key of mergedKeys) {
      map.set(key, merged);
    }

    return;
  }

  for (const key of incomingKeys) {
    map.set(key, guru);
  }
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "yes" || normalized === "1";
  }

  return Boolean(value);
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

function formatDateShort(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isWithinLastDays(value: unknown, days: number) {
  const dateValue = asTrimmedString(value);

  if (!dateValue) return false;

  const parsed = new Date(dateValue);

  if (Number.isNaN(parsed.getTime())) return false;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return parsed >= cutoff;
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Admin gurus query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Admin gurus query skipped for ${label}:`, error);
    return [];
  }
}

function getGuruId(guru: GuruRow) {
  return (
    asTrimmedString(guru.id) ||
    asTrimmedString(guru.user_id) ||
    asTrimmedString(guru.profile_id) ||
    asTrimmedString(guru.email).toLowerCase()
  );
}

function getProfileIdentityKeys(profile: ProfileRow) {
  return [
    asTrimmedString(profile.id),
    asTrimmedString(profile.user_id),
    asTrimmedString(profile.profile_id),
    asTrimmedString(profile.email).toLowerCase(),
  ].filter(Boolean);
}

function getGuruProfileKey(guru: GuruRow) {
  return (
    asTrimmedString(guru.user_id) ||
    asTrimmedString(guru.profile_id) ||
    asTrimmedString(guru.id) ||
    asTrimmedString(guru.email).toLowerCase()
  );
}

function getGuruUserId(guru: GuruRow, profile?: ProfileRow) {
  return (
    asTrimmedString(guru.user_id) ||
    asTrimmedString(guru.profile_id) ||
    asTrimmedString(profile?.id) ||
    asTrimmedString(profile?.user_id) ||
    asTrimmedString(profile?.profile_id)
  );
}

function getGuruAdminMessageHref({
  guru,
  profile,
  guruId,
  name,
  email,
}: {
  guru: GuruRow;
  profile?: ProfileRow;
  guruId: string;
  name: string;
  email: string;
}) {
  const params = new URLSearchParams();
  const recipientId = getGuruUserId(guru, profile);
  const cleanName = asTrimmedString(name);
  const cleanEmail = asTrimmedString(email).toLowerCase();

  params.set("threadType", "direct_guru");
  params.set("recipientRole", "guru");
  params.set("source", "admin-gurus");

  if (recipientId) {
    params.set("recipientId", recipientId);
  }

  if (cleanName) {
    params.set("recipientName", cleanName);
  }

  if (cleanEmail && cleanEmail !== "—") {
    params.set("recipientEmail", cleanEmail);
  }

  if (guruId) {
    params.set("guruId", guruId);
  }

  return `/admin/messages?${params.toString()}`;
}

function getCleanEmailNameFallback(email: string) {
  const localPart = asTrimmedString(email).split("@")[0];

  if (!localPart) return "";

  const cleaned = localPart
    .replace(/[._-]+/g, " ")
    .replace(/\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "";

  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getGuruName(guru: GuruRow, profile?: ProfileRow) {
  const firstName =
    asTrimmedString(guru.first_name) || asTrimmedString(profile?.first_name);
  const lastName =
    asTrimmedString(guru.last_name) || asTrimmedString(profile?.last_name);
  const combinedName = `${firstName} ${lastName}`.trim();
  const preferredName =
    asTrimmedString(guru.display_name) ||
    asTrimmedString(guru.full_name) ||
    asTrimmedString(guru.name) ||
    asTrimmedString(profile?.display_name) ||
    asTrimmedString(profile?.full_name) ||
    asTrimmedString(profile?.name) ||
    combinedName ||
    getCleanEmailNameFallback(asTrimmedString(guru.email)) ||
    getCleanEmailNameFallback(asTrimmedString(profile?.email));

  return displayNameFallback(preferredName, "Guru");
}

function getGuruEmail(guru: GuruRow, profile?: ProfileRow) {
  return emailFallback(
    asTrimmedString(guru.email) || asTrimmedString(profile?.email),
    "—",
  );
}

function getGuruPhone(guru: GuruRow, profile?: ProfileRow) {
  return phoneFallback(
    asTrimmedString(guru.phone) ||
      asTrimmedString(guru.phone_number) ||
      asTrimmedString(profile?.phone) ||
      asTrimmedString(profile?.phone_number),
    "No phone on file",
  );
}

function getGuruAvatarUrl(guru: GuruRow, profile?: ProfileRow) {
  const profileAvatarUrl = asTrimmedString(profile?.avatar_url);
  const guruImageUrl =
    asTrimmedString(guru.avatar_url) ||
    asTrimmedString(guru.profile_photo_url) ||
    asTrimmedString(guru.photo_url) ||
    asTrimmedString(guru.image_url) ||
    asTrimmedString(guru.headshot_url);
  const profileFallbackImageUrl =
    asTrimmedString(profile?.profile_photo_url) ||
    asTrimmedString(profile?.photo_url) ||
    asTrimmedString(profile?.image_url);

  return avatarImageFallback(
    profileAvatarUrl || guruImageUrl || profileFallbackImageUrl,
    "",
  );
}

function getGuruSlug(guru: GuruRow, profile?: ProfileRow) {
  return (
    asTrimmedString(guru.slug) ||
    asTrimmedString(guru.public_slug) ||
    asTrimmedString(guru.profile_slug) ||
    asTrimmedString(guru.username) ||
    asTrimmedString(profile?.slug) ||
    asTrimmedString(profile?.public_slug) ||
    asTrimmedString(profile?.profile_slug) ||
    asTrimmedString(profile?.username)
  );
}

function slugifyGuruName(value: string) {
  return asTrimmedString(value)
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getGuruPublicIdentifier({
  guru,
  profile,
  id,
  userId,
  name,
  email,
}: {
  guru: GuruRow;
  profile?: ProfileRow;
  id: string;
  userId: string;
  name: string;
  email: string;
}) {
  return (
    getGuruSlug(guru, profile) ||
    asTrimmedString(guru.public_id) ||
    asTrimmedString(profile?.public_id) ||
    asTrimmedString(userId) ||
    asTrimmedString(id) ||
    slugifyGuruName(name) ||
    slugifyGuruName(email.split("@")[0] || "")
  );
}

function getGuruServices(guru: GuruRow) {
  const services = guru.services;

  if (Array.isArray(services) && services.length > 0) {
    return services
      .map((service) => String(service).trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(" • ");
  }

  return (
    asTrimmedString(guru.service) ||
    asTrimmedString(guru.service_name) ||
    asTrimmedString(guru.specialty) ||
    asTrimmedString(guru.title) ||
    "Pet Care"
  );
}

function getGuruLocation(guru: GuruRow, profile?: ProfileRow) {
  const city =
    asTrimmedString(guru.city) ||
    asTrimmedString(profile?.city) ||
    asTrimmedString(guru.service_city);

  const state =
    asTrimmedString(guru.state) ||
    asTrimmedString(profile?.state) ||
    asTrimmedString(guru.service_state) ||
    asTrimmedString(guru.state_code) ||
    asTrimmedString(profile?.state_code);

  return [city, state].filter(Boolean).join(", ") || "Location not listed";
}

function getGuruCityState(row: GuruDisplayRow) {
  return row.location && row.location !== "Location not listed"
    ? row.location
    : "Unknown";
}

function getGuruExperience(guru: GuruRow) {
  const years =
    toNumber(guru.experience_years) ||
    toNumber(guru.years_experience) ||
    toNumber(guru.years_of_experience);

  if (years > 0) {
    return `${years} year${years === 1 ? "" : "s"}`;
  }

  return "Not listed";
}

function getExperienceBucket(value: string) {
  const match = value.match(/\d+/);
  const years = match ? Number(match[0]) : 0;

  if (!years) return "Not Listed";
  if (years <= 1) return "0-1 Years";
  if (years <= 3) return "2-3 Years";
  if (years <= 5) return "4-5 Years";
  return "6+ Years";
}

function getCredentialStatus(value: unknown) {
  const normalized = asTrimmedString(value).toLowerCase();

  if (!normalized) return "Not Started";

  if (normalized === "not_started") return "Not Started";
  if (normalized === "in_progress") return "In Progress";
  if (normalized === "pending") return "Pending";
  if (normalized === "verified") return "Verified";
  if (normalized === "clear") return "Clear";
  if (normalized === "cleared") return "Cleared";
  if (normalized === "approved") return "Approved";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "failed") return "Failed";
  if (normalized === "consider") return "Needs Review";
  if (normalized === "suspended") return "Suspended";
  if (normalized === "canceled") return "Canceled";

  return normalized
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isReadyTrustStatus(value: string) {
  const normalized = value.toLowerCase();

  return (
    normalized === "verified" ||
    normalized === "clear" ||
    normalized === "cleared" ||
    normalized === "approved"
  );
}

function isPendingTrustStatus(value: string) {
  const normalized = value.toLowerCase();

  return (
    normalized === "pending" ||
    normalized === "in progress" ||
    normalized === "not started"
  );
}

function isRiskTrustStatus(value: string) {
  const normalized = value.toLowerCase();

  return (
    normalized === "needs review" ||
    normalized === "consider" ||
    normalized === "failed" ||
    normalized === "rejected" ||
    normalized === "suspended" ||
    normalized === "canceled"
  );
}

function isGuruFlagged(guru: GuruRow) {
  const status = (
    asTrimmedString(guru.status) ||
    asTrimmedString(guru.approval_status) ||
    asTrimmedString(guru.application_status) ||
    asTrimmedString(guru.risk_level)
  ).toLowerCase();

  return (
    Boolean(guru.flagged || guru.is_flagged || guru.needs_review) ||
    status.includes("flag") ||
    status.includes("suspend") ||
    status.includes("reject") ||
    status.includes("failed") ||
    status.includes("risk") ||
    status.includes("consider")
  );
}

function isGuruBookable(guru: GuruRow) {
  const status = asTrimmedString(guru.status).toLowerCase();
  const applicationStatus = asTrimmedString(
    guru.application_status,
  ).toLowerCase();

  return (
    toBoolean(guru.is_bookable) ||
    applicationStatus === "bookable" ||
    status === "active"
  );
}

function isGuruApproved(guru: GuruRow) {
  const status = (
    asTrimmedString(guru.status) ||
    asTrimmedString(guru.approval_status) ||
    asTrimmedString(guru.application_status)
  ).toLowerCase();

  return (
    Boolean(guru.is_approved || guru.approved) ||
    status === "approved" ||
    status === "active" ||
    status === "bookable"
  );
}

function isGuruApprovedThisWeek(guru: GuruRow) {
  return (
    isGuruApproved(guru) &&
    (isWithinLastDays(guru.approved_at, 7) ||
      isWithinLastDays(guru.bookable_at, 7) ||
      isWithinLastDays(guru.updated_at, 7) ||
      isWithinLastDays(guru.created_at, 7))
  );
}

function needsProfileUpdate(guru: GuruRow) {
  const hasName = Boolean(
    asTrimmedString(guru.display_name) ||
    asTrimmedString(guru.full_name) ||
    asTrimmedString(guru.name),
  );

  const hasBio = Boolean(asTrimmedString(guru.bio));
  const hasLocation = Boolean(
    asTrimmedString(guru.city) || asTrimmedString(guru.state),
  );

  const hasServices =
    Array.isArray(guru.services) && guru.services.length > 0
      ? true
      : Boolean(
          asTrimmedString(guru.service) ||
          asTrimmedString(guru.service_name) ||
          asTrimmedString(guru.specialty),
        );

  return !hasName || !hasBio || !hasLocation || !hasServices;
}

function hasGuruProfileStarted(guru: GuruRow, profile?: ProfileRow) {
  return Boolean(
    getGuruId(guru) ||
    getGuruEmail(guru, profile) !== "—" ||
    asTrimmedString(guru.created_at) ||
    asTrimmedString(guru.user_id) ||
    asTrimmedString(guru.profile_id),
  );
}

function hasGuruServiceData(guru: GuruRow) {
  const services = guru.services;

  const hasServices =
    Array.isArray(services) && services.length > 0
      ? true
      : Boolean(
          asTrimmedString(guru.service) ||
          asTrimmedString(guru.service_name) ||
          asTrimmedString(guru.specialty) ||
          asTrimmedString(guru.title),
        );

  const hasLocation = Boolean(
    asTrimmedString(guru.city) ||
    asTrimmedString(guru.state) ||
    asTrimmedString(guru.service_city) ||
    asTrimmedString(guru.service_state),
  );

  const hasRadius = Boolean(
    toNumber(guru.service_radius_miles) ||
    toNumber(guru.radius_miles) ||
    toNumber(guru.travel_radius) ||
    toNumber(guru.max_travel_miles),
  );

  const hasRates = Boolean(
    toNumber(guru.hourly_rate) ||
    toNumber(guru.rate) ||
    toNumber(guru.price) ||
    toNumber(guru.base_rate),
  );

  return hasServices && hasLocation && (hasRadius || hasRates);
}

function hasGuruProfileReady(guru: GuruRow, profile?: ProfileRow) {
  const hasName = Boolean(getGuruName(guru, profile));
  const hasBio = Boolean(
    asTrimmedString(guru.bio) || asTrimmedString(profile?.bio),
  );
  const hasExperience = getGuruExperience(guru) !== "Not listed";
  const hasPhoto = Boolean(
    asTrimmedString(guru.avatar_url) ||
    asTrimmedString(guru.profile_photo_url) ||
    asTrimmedString(guru.photo_url) ||
    asTrimmedString(guru.image_url) ||
    asTrimmedString(profile?.avatar_url) ||
    asTrimmedString(profile?.profile_photo_url),
  );

  return (
    hasName && hasBio && hasExperience && hasPhoto && hasGuruServiceData(guru)
  );
}

function hasGuruCheckrStarted(guru: GuruRow, check?: BackgroundCheckRow) {
  const status = asTrimmedString(
    guru.background_check_status || check?.status,
  ).toLowerCase();

  return Boolean(
    (status && status !== "not_started") ||
    asTrimmedString(guru.checkr_package_slug) ||
    asTrimmedString(check?.package_slug) ||
    asTrimmedString(guru.checkr_candidate_id) ||
    asTrimmedString(check?.checkr_candidate_id) ||
    asTrimmedString(guru.checkr_invitation_id) ||
    asTrimmedString(check?.checkr_invitation_id) ||
    asTrimmedString(guru.checkr_report_id) ||
    asTrimmedString(check?.checkr_report_id) ||
    asTrimmedString(guru.checkr_invitation_url) ||
    asTrimmedString(check?.invitation_url),
  );
}

function getSetupStepLabel(step: number) {
  switch (step) {
    case 5:
      return "Step 5: Approved / Bookable";
    case 4:
      return "Step 4: Checkr / Trust Started";
    case 3:
      return "Step 3: Profile Ready";
    case 2:
      return "Step 2: Services / Area Added";
    case 1:
      return "Step 1: Account / Profile Started";
    default:
      return "Not Started";
  }
}

function getGuruSetupStep({
  guru,
  profile,
  check,
}: {
  guru: GuruRow;
  profile?: ProfileRow;
  check?: BackgroundCheckRow;
}) {
  if (isGuruBookable(guru) || isGuruApproved(guru)) return 5;
  if (hasGuruCheckrStarted(guru, check)) return 4;
  if (hasGuruProfileReady(guru, profile)) return 3;
  if (hasGuruServiceData(guru)) return 2;
  if (hasGuruProfileStarted(guru, profile)) return 1;

  return 0;
}

function getProfileQuality(guru: GuruRow) {
  if (needsProfileUpdate(guru)) return "Needs Update";
  return "Complete";
}

function normalizeApplicationStatus(guru: GuruRow): ApplicationStatus {
  const rawStatus = (
    asTrimmedString(guru.application_status) ||
    asTrimmedString(guru.approval_status) ||
    asTrimmedString(guru.status)
  ).toLowerCase();

  if (isGuruFlagged(guru)) return "suspended";
  if (rawStatus === "suspended" || rawStatus.includes("suspend")) {
    return "suspended";
  }
  if (rawStatus === "rejected" || rawStatus.includes("reject")) {
    return "rejected";
  }
  if (isGuruBookable(guru)) return "bookable";

  if (
    rawStatus === "verification_pending" ||
    rawStatus.includes("verification")
  ) {
    return "verification_pending";
  }

  if (
    rawStatus === "pre_approved" ||
    rawStatus === "pre-approved" ||
    rawStatus.includes("pre")
  ) {
    return "pre_approved";
  }

  if (
    rawStatus === "needs_info" ||
    rawStatus === "needs-info" ||
    rawStatus.includes("needs info") ||
    rawStatus.includes("profile update")
  ) {
    return "needs_info";
  }

  if (rawStatus === "reviewing" || rawStatus.includes("review")) {
    return "reviewing";
  }

  if (rawStatus === "approved" || isGuruApproved(guru)) {
    return "approved";
  }

  if (rawStatus === "new") return "new";
  if (rawStatus === "pending") return "new";

  if (needsProfileUpdate(guru)) return "needs_info";

  return "new";
}

function getApplicationStatusLabel(status: ApplicationStatus) {
  switch (status) {
    case "new":
      return "Application Received";
    case "reviewing":
      return "Profile Under Review";
    case "needs_info":
      return "More Info Needed";
    case "pre_approved":
      return "Pre-Approved";
    case "verification_pending":
      return "Verification Needed";
    case "approved":
      return "Approved";
    case "bookable":
      return "Bookable";
    case "rejected":
      return "Not Approved";
    case "suspended":
      return "Paused";
    default:
      return "Application Received";
  }
}

function normalizeQuery(value?: string) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getActiveQueue(searchParams: SearchParams) {
  const queue = normalizeQuery(searchParams.queue);

  return queueConfigs[queue] || null;
}

function getActiveSetupStep(searchParams: SearchParams) {
  const setupStep = normalizeQuery(searchParams.setupStep);

  return setupStepConfigs[setupStep] || null;
}

function getActiveStuckBeforeStep(searchParams: SearchParams) {
  const stuckBeforeStep = normalizeQuery(searchParams.stuckBeforeStep);

  return stuckBeforeStepConfigs[stuckBeforeStep] || null;
}

function isPendingReviewRow(row: GuruDisplayRow) {
  return !["bookable", "rejected", "suspended"].includes(row.applicationStatus);
}

function isProfileUpdateRow(row: GuruDisplayRow) {
  return row.profileQuality.toLowerCase() === "needs update";
}

function isFlaggedReviewRow(row: GuruDisplayRow) {
  return row.flaggedForReview;
}

function filterGuruRows(rows: GuruDisplayRow[], searchParams: SearchParams) {
  const status = normalizeQuery(searchParams.status);
  const filter = normalizeQuery(searchParams.filter);
  const queue = normalizeQuery(searchParams.queue);
  const setupStep = normalizeQuery(searchParams.setupStep);
  const stuckBeforeStep = normalizeQuery(searchParams.stuckBeforeStep);
  const guru = normalizeQuery(searchParams.guru);
  const query = normalizeQuery(searchParams.q);

  return rows.filter((row) => {
    const rowStatus = row.applicationStatus;
    const rowStatusLabel = row.statusLabel.toLowerCase();
    const rowId = row.id.toLowerCase();
    const rowName = row.name.toLowerCase();

    const searchableText = [
      row.id,
      row.name,
      row.email,
      row.services,
      row.location,
      row.experience,
      row.statusLabel,
      row.profileQuality,
      row.identityStatus,
      row.backgroundStatus,
      row.safetyStatus,
      row.setupStepLabel,
    ]
      .join(" ")
      .toLowerCase();

    if (guru && rowId !== guru && !rowName.includes(guru)) {
      return false;
    }

    if (query && !searchableText.includes(query)) {
      return false;
    }

    if (stuckBeforeStep) {
      const stepNumber = Number(stuckBeforeStep);

      if (Number.isFinite(stepNumber) && stepNumber >= 1 && stepNumber <= 5) {
        return row.setupStep < stepNumber;
      }
    }

    if (setupStep) {
      const stepNumber = Number(setupStep);

      if (Number.isFinite(stepNumber) && stepNumber >= 1 && stepNumber <= 5) {
        return row.setupStep >= stepNumber;
      }

      if (stepNumber === 0) {
        return row.setupStep === 0;
      }
    }

    if (queue) {
      if (queue === "pending-reviews") {
        return isPendingReviewRow(row);
      }

      if (queue === "approved-this-week") {
        return row.approvedThisWeek;
      }

      if (queue === "profile-updates") {
        return isProfileUpdateRow(row);
      }

      if (queue === "flagged-review") {
        return isFlaggedReviewRow(row);
      }
    }

    if (status) {
      if (status === "pending") {
        return isPendingReviewRow(row);
      }

      if (status === "new") return rowStatus === "new";
      if (status === "reviewing") return rowStatus === "reviewing";
      if (status === "needs-info") return rowStatus === "needs_info";
      if (status === "pre-approved") return rowStatus === "pre_approved";
      if (status === "verification")
        return rowStatus === "verification_pending";
      if (status === "approved") return rowStatus === "approved";
      if (status === "bookable") return rowStatus === "bookable";
      if (status === "rejected") return rowStatus === "rejected";
      if (status === "suspended" || status === "flagged") {
        return rowStatus === "suspended";
      }

      if (status === "ready") {
        return rowStatus === "approved" || rowStatus === "bookable";
      }

      if (status === "credential-review") {
        return (
          rowStatus === "pre_approved" ||
          rowStatus === "verification_pending" ||
          rowStatusLabel.includes("verification")
        );
      }
    }

    if (filter) {
      if (filter === "profile-quality" || filter === "profile-updates") {
        return isProfileUpdateRow(row);
      }

      if (filter === "quality-review") {
        return isProfileUpdateRow(row) || rowStatus === "reviewing";
      }

      if (filter === "flagged-review") {
        return isFlaggedReviewRow(row);
      }

      if (filter === "not-bookable") {
        return !row.bookable;
      }
    }

    return true;
  });
}

function countByLabel<T>(
  rows: T[],
  getLabel: (row: T) => string,
  getHelper?: (row: T[]) => string,
) {
  const groupMap = new Map<string, T[]>();

  for (const row of rows) {
    const label = getLabel(row) || "Unknown";
    const existing = groupMap.get(label) || [];
    existing.push(row);
    groupMap.set(label, existing);
  }

  return Array.from(groupMap.entries())
    .map(([label, group]) => ({
      label,
      value: group.length,
      helper: getHelper ? getHelper(group) : `${number(group.length)} Gurus`,
    }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, 8);
}

function buildTrustChartRows(rows: GuruDisplayRow[]) {
  const identityReady = rows.filter((row) =>
    isReadyTrustStatus(row.identityStatus),
  ).length;
  const backgroundReady = rows.filter((row) =>
    isReadyTrustStatus(row.backgroundStatus),
  ).length;
  const safetyReady = rows.filter((row) =>
    isReadyTrustStatus(row.safetyStatus),
  ).length;

  const identityPending = rows.filter((row) =>
    isPendingTrustStatus(row.identityStatus),
  ).length;
  const backgroundPending = rows.filter((row) =>
    isPendingTrustStatus(row.backgroundStatus),
  ).length;
  const safetyPending = rows.filter((row) =>
    isPendingTrustStatus(row.safetyStatus),
  ).length;

  return [
    {
      label: "Identity Ready",
      value: identityReady,
      helper: `${number(identityPending)} pending`,
    },
    {
      label: "Background Ready",
      value: backgroundReady,
      helper: `${number(backgroundPending)} pending`,
    },
    {
      label: "Safety Ready",
      value: safetyReady,
      helper: `${number(safetyPending)} pending`,
    },
  ];
}

function getLeadStatusCount(leads: GuruLeadRow[], status: string) {
  return leads.filter((lead) => asTrimmedString(lead.status) === status).length;
}

function getLeadLabelCounts(
  leads: GuruLeadRow[],
  getLabel: (lead: GuruLeadRow) => string,
  limit = 8,
) {
  const groupMap = new Map<string, GuruLeadRow[]>();

  for (const lead of leads) {
    const label = getLabel(lead) || "Not Added";
    const existing = groupMap.get(label) || [];
    existing.push(lead);
    groupMap.set(label, existing);
  }

  return Array.from(groupMap.entries())
    .map(([label, group]) => ({
      label,
      value: group.length,
      helper: `${number(group.length)} Leads`,
    }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, limit);
}

async function getGuruLeadPipelineData(): Promise<GuruLeadPipelineData> {
  const leads = await safeRows<GuruLeadRow>(
    supabaseAdmin
      .from("guru_leads")
      .select(
        "id,status,lead_source,referral_code,referred_by_email,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(1000),
    "guru_leads",
  );

  const sourceChart = getLeadLabelCounts(leads, (lead) =>
    asTrimmedString(lead.lead_source),
  );

  const allReferralCodeChart = getLeadLabelCounts(
    leads.filter((lead) => Boolean(asTrimmedString(lead.referral_code))),
    (lead) => asTrimmedString(lead.referral_code).toUpperCase(),
    1000,
  );

  const referralCodeChart = allReferralCodeChart.slice(0, 5);

  const topSource = sourceChart.length > 0 ? sourceChart[0].label : "None yet";
  const topReferralCode =
    allReferralCodeChart.length > 0
      ? allReferralCodeChart[0].label
      : "None yet";

  return {
    total: leads.length,
    new: getLeadStatusCount(leads, "New"),
    contacted: getLeadStatusCount(leads, "Contacted"),
    interested: getLeadStatusCount(leads, "Interested"),
    applicationSent: getLeadStatusCount(leads, "Application Sent"),
    applied: getLeadStatusCount(leads, "Applied"),
    approvedGuru: getLeadStatusCount(leads, "Approved Guru"),
    notMovingForward: getLeadStatusCount(leads, "Not Moving Forward"),
    referralLeads: leads.filter(
      (lead) =>
        asTrimmedString(lead.lead_source) === "Referral" ||
        Boolean(asTrimmedString(lead.referral_code)),
    ).length,
    topSource,
    topReferralCode,
    totalReferralCodes: allReferralCodeChart.length,
    hiddenReferralCodes: Math.max(
      allReferralCodeChart.length - referralCodeChart.length,
      0,
    ),
    sourceChart,
    referralCodeChart,
  };
}

async function getGuruOnboardingPacketAdminData(): Promise<GuruOnboardingPacketAdminData> {
  const packets = await safeRows<Record<string, unknown>>(
    supabaseAdmin
      .from("guru_onboarding_packets")
      .select(
        "id,user_id,legal_name,status,submitted_at,reviewed_at,admin_notes",
      )
      .order("submitted_at", { ascending: false })
      .limit(50),
    "guru_onboarding_packets",
  );

  const packetIds = packets
    .map((packet) => asTrimmedString(packet.id))
    .filter(Boolean);

  const documents = packetIds.length
    ? await safeRows<Record<string, unknown>>(
        supabaseAdmin
          .from("guru_onboarding_documents")
          .select(
            "id,packet_id,user_id,document_type,file_name,status,submitted_at",
          )
          .in("packet_id", packetIds)
          .order("submitted_at", { ascending: false }),
        "guru_onboarding_documents",
      )
    : [];

  const documentCountByPacket = new Map<string, number>();

  documents.forEach((document) => {
    const packetId = asTrimmedString(document.packet_id);
    if (!packetId) return;
    documentCountByPacket.set(
      packetId,
      (documentCountByPacket.get(packetId) || 0) + 1,
    );
  });

  const latest = packets.slice(0, 6).map((packet) => {
    const id = asTrimmedString(packet.id);
    const userId = asTrimmedString(packet.user_id);
    const legalName = asTrimmedString(packet.legal_name) || "Guru";
    const status = asTrimmedString(packet.status) || "submitted";

    const params = new URLSearchParams();
    params.set("threadType", "direct_guru");
    params.set("recipientRole", "guru");
    params.set("source", "guru-onboarding-packet");
    if (userId) params.set("recipientId", userId);
    if (legalName) params.set("recipientName", legalName);

    return {
      id,
      userId,
      legalName,
      status,
      submittedAt: asTrimmedString(packet.submitted_at) || null,
      reviewedAt: asTrimmedString(packet.reviewed_at) || null,
      adminNotes: asTrimmedString(packet.admin_notes),
      documentCount: documentCountByPacket.get(id) || 0,
      messageHref: `/admin/messages?${params.toString()}`,
    };
  });

  const normalizedStatuses = packets.map((packet) =>
    asTrimmedString(packet.status).toLowerCase(),
  );

  return {
    total: packets.length,
    submitted: normalizedStatuses.filter((status) =>
      ["submitted", "pending_review", "in_review"].includes(status),
    ).length,
    needsFix: normalizedStatuses.filter((status) =>
      ["needs_fix", "needs_action"].includes(status),
    ).length,
    approved: normalizedStatuses.filter((status) =>
      ["approved", "complete", "completed"].includes(status),
    ).length,
    documents: documents.length,
    latest,
  };
}

function getMetadataString(
  source: Record<string, unknown> | null | undefined,
  key: string,
) {
  return asTrimmedString(source?.[key]);
}

function getAuthUserRole(user: AuthUserRow) {
  const role =
    getMetadataString(user.user_metadata, "role") ||
    getMetadataString(user.user_metadata, "user_role") ||
    getMetadataString(user.user_metadata, "account_role") ||
    getMetadataString(user.app_metadata, "role") ||
    getMetadataString(user.app_metadata, "user_role") ||
    getMetadataString(user.app_metadata, "account_role");

  const canonicalRole = normalizeRoleAlias(role);

  return canonicalRole || role.toLowerCase();
}

function isGuruAuthUser(user: AuthUserRow) {
  const role = getAuthUserRole(user);

  return role === CANONICAL_ROLE.GURU;
}

function buildGuruRecordFromAuthUser(user: AuthUserRow): GuruRow {
  const firstName =
    getMetadataString(user.user_metadata, "first_name") ||
    getMetadataString(user.app_metadata, "first_name");
  const lastName =
    getMetadataString(user.user_metadata, "last_name") ||
    getMetadataString(user.app_metadata, "last_name");

  const fullName =
    getMetadataString(user.user_metadata, "full_name") ||
    getMetadataString(user.user_metadata, "display_name") ||
    getMetadataString(user.user_metadata, "name") ||
    getMetadataString(user.app_metadata, "full_name") ||
    getMetadataString(user.app_metadata, "display_name") ||
    getMetadataString(user.app_metadata, "name") ||
    `${firstName} ${lastName}`.trim() ||
    getCleanEmailNameFallback(user.email || "");

  return {
    id: user.id,
    user_id: user.id,
    profile_id: user.id,
    email: user.email || "",
    display_name: fullName,
    full_name: fullName,
    first_name: firstName,
    last_name: lastName,
    name: fullName,
    role: "guru",
    status: "new",
    approval_status: "new",
    application_status: "new",
    service: "Pet Care",
    services: [],
    avatar_url:
      getMetadataString(user.user_metadata, "avatar_url") ||
      getMetadataString(user.user_metadata, "picture") ||
      getMetadataString(user.app_metadata, "avatar_url") ||
      getMetadataString(user.app_metadata, "picture"),
    profile_photo_url:
      getMetadataString(user.user_metadata, "picture") ||
      getMetadataString(user.user_metadata, "avatar_url") ||
      getMetadataString(user.app_metadata, "picture") ||
      getMetadataString(user.app_metadata, "avatar_url"),
    created_at: user.created_at || "",
    updated_at: user.last_sign_in_at || user.created_at || "",
    source: "auth.users",
  };
}

async function getAllAuthUsersForAdminGurus() {
  const users: AuthUserRow[] = [];
  let page = 1;
  const perPage = 1000;

  try {
    while (page <= 10) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        console.warn("Admin gurus auth user query skipped:", error);
        break;
      }

      const pageUsers = Array.isArray(data?.users) ? data.users : [];
      users.push(...(pageUsers as AuthUserRow[]));

      if (pageUsers.length < perPage) break;

      page += 1;
    }
  } catch (error) {
    console.warn("Admin gurus auth user query skipped:", error);
  }

  return users;
}

function getGuruRecordIdentityKeys(guru: GuruRow) {
  return [
    asTrimmedString(guru.id),
    asTrimmedString(guru.user_id),
    asTrimmedString(guru.profile_id),
    asTrimmedString(guru.email).toLowerCase(),
  ].filter(Boolean);
}

function buildGuruRecordFromProfile(profile: ProfileRow): GuruRow {
  const id =
    asTrimmedString(profile.id) ||
    asTrimmedString(profile.user_id) ||
    asTrimmedString(profile.profile_id);

  const firstName = asTrimmedString(profile.first_name);
  const lastName = asTrimmedString(profile.last_name);
  const fullName =
    asTrimmedString(profile.full_name) ||
    asTrimmedString(profile.display_name) ||
    asTrimmedString(profile.name) ||
    `${firstName} ${lastName}`.trim() ||
    getCleanEmailNameFallback(asTrimmedString(profile.email));

  const approvalStatus =
    asTrimmedString(profile.approval_status) ||
    asTrimmedString(profile.account_status) ||
    "new";

  return {
    id,
    user_id: id,
    profile_id: id,
    email: asTrimmedString(profile.email),
    display_name: fullName,
    full_name: fullName,
    first_name: firstName,
    last_name: lastName,
    name: fullName,
    role: "guru",
    status: asTrimmedString(profile.account_status) || "new",
    approval_status: approvalStatus,
    application_status:
      approvalStatus === "active" ||
      approvalStatus === "approved" ||
      approvalStatus === "bookable"
        ? "approved"
        : "new",
    avatar_url: asTrimmedString(profile.avatar_url),
    profile_photo_url: asTrimmedString(profile.profile_photo_url),
    photo_url: asTrimmedString(profile.photo_url),
    image_url: asTrimmedString(profile.image_url),
    bio: asTrimmedString(profile.bio),
    city:
      asTrimmedString(profile.city) || asTrimmedString(profile.service_city),
    state:
      asTrimmedString(profile.state) || asTrimmedString(profile.service_state),
    service_city: asTrimmedString(profile.service_city),
    service_state: asTrimmedString(profile.service_state),
    service_zip: asTrimmedString(profile.service_zip),
    service_zip_code: asTrimmedString(profile.service_zip_code),
    zip_code: asTrimmedString(profile.zip_code),
    services: Array.isArray(profile.services) ? profile.services : [],
    service: asTrimmedString(profile.service) || "Pet Care",
    created_at: asTrimmedString(profile.created_at),
    updated_at: asTrimmedString(profile.updated_at),
    source: "profiles",
  };
}

async function getGuruManagementData(searchParams: SearchParams) {
  const [gurus, profiles, backgroundChecks, authUsers] = await Promise.all([
    safeRows<GuruRow>(
      supabaseAdmin
        .from("gurus")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "gurus",
    ),
    safeRows<ProfileRow>(
      supabaseAdmin
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "profiles",
    ),
    safeRows<BackgroundCheckRow>(
      supabaseAdmin
        .from("guru_background_checks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "guru_background_checks",
    ),
    getAllAuthUsersForAdminGurus(),
  ]);

  const profileMap = new Map<string, ProfileRow>();

  for (const profile of profiles) {
    for (const key of getProfileIdentityKeys(profile)) {
      profileMap.set(key, profile);
    }
  }

  const backgroundCheckMap = new Map<string, BackgroundCheckRow>();

  for (const check of backgroundChecks) {
    const guruId = asTrimmedString(check.guru_id);

    if (guruId) {
      backgroundCheckMap.set(guruId, check);
    }
  }

  const realGuruMap = new Map<string, GuruRow>();

  for (const guru of gurus) {
    const profile = profileMap.get(getGuruProfileKey(guru));

    if (!isNonRealGuruRecord(guru, profile)) {
      addGuruRecordToMap(realGuruMap, guru);
    }
  }

  for (const profile of profiles.filter((profile) => isGuruProfile(profile))) {
    const profileGuru = buildGuruRecordFromProfile(profile);

    if (!isNonRealGuruRecord(profileGuru, profile)) {
      addGuruRecordToMap(realGuruMap, profileGuru);
    }
  }

  for (const authUser of authUsers.filter((authUser) =>
    isGuruAuthUser(authUser),
  )) {
    const authGuru = buildGuruRecordFromAuthUser(authUser);
    const profile = profileMap.get(getGuruProfileKey(authGuru));

    if (!isNonRealGuruRecord(authGuru, profile)) {
      addGuruRecordToMap(realGuruMap, authGuru);
    }
  }

  const seenGuruObjects = new Set<GuruRow>();
  const liveGuruRows = Array.from(realGuruMap.values()).filter((guru) => {
    if (seenGuruObjects.has(guru)) return false;
    seenGuruObjects.add(guru);
    return true;
  });

  const rows: GuruDisplayRow[] = liveGuruRows.map((guru) => {
    const profile = profileMap.get(getGuruProfileKey(guru));
    const id = getGuruId(guru);
    const check = backgroundCheckMap.get(id);
    const slug = getGuruSlug(guru, profile);
    const applicationStatus = normalizeApplicationStatus(guru);
    const backgroundStatus = getCredentialStatus(guru.background_check_status);
    const identityStatus = getCredentialStatus(
      guru.stripe_identity_status || guru.identity_status,
    );
    const safetyStatus = getCredentialStatus(guru.safety_cert_status);
    const setupStep = getGuruSetupStep({ guru, profile, check });
    const flaggedForReview =
      applicationStatus === "suspended" ||
      applicationStatus === "rejected" ||
      isRiskTrustStatus(backgroundStatus) ||
      isRiskTrustStatus(identityStatus) ||
      isRiskTrustStatus(safetyStatus) ||
      isGuruFlagged(guru);

    const name = getGuruName(guru, profile);
    const email = getGuruEmail(guru, profile);
    const phone = getGuruPhone(guru, profile);
    const guruUserId = getGuruUserId(guru, profile);
    const publicIdentifier = getGuruPublicIdentifier({
      guru,
      profile,
      id,
      userId: guruUserId,
      name,
      email,
    });
    const publicHref = publicIdentifier
      ? `/guru/${encodeURIComponent(publicIdentifier)}`
      : "/search";

    return {
      id,
      userId: guruUserId,
      guruUserId,
      messageHref: getGuruAdminMessageHref({
        guru,
        profile,
        guruId: id,
        name,
        email,
      }),
      name,
      email,
      phone,
      avatarUrl: getGuruAvatarUrl(guru, profile),
      slug,
      services: getGuruServices(guru),
      location: getGuruLocation(guru, profile),
      experience: getGuruExperience(guru),
      applicationStatus,
      statusLabel: getApplicationStatusLabel(applicationStatus),
      profileQuality: getProfileQuality(guru),
      identityStatus,
      backgroundStatus,
      safetyStatus,
      bookable: isGuruBookable(guru),
      approvedThisWeek: isGuruApprovedThisWeek(guru),
      flaggedForReview,
      setupStep,
      setupStepLabel: getSetupStepLabel(setupStep),
      joined: formatDateShort(asTrimmedString(guru.created_at)),
      href: id ? `/admin/gurus/${encodeURIComponent(id)}` : "/admin/gurus",
      publicHref,
      inferredFromFallback:
        guru.source === "profiles" || guru.source === "auth.users",
      recordSourceLabel:
        guru.source === "auth.users"
          ? "Auth fallback"
          : guru.source === "profiles"
            ? "Profile fallback"
            : "Canonical gurus row",
    };
  });

  const filteredRows = filterGuruRows(rows, searchParams);

  const statusChart = countByLabel(rows, (row) => row.statusLabel);
  const profileChart = countByLabel(rows, (row) => row.profileQuality);
  const locationChart = countByLabel(rows, (row) => getGuruCityState(row));
  const experienceChart = countByLabel(rows, (row) =>
    getExperienceBucket(row.experience),
  );
  const serviceChart = countByLabel(
    rows,
    (row) => row.services.split(" • ")[0],
  );
  const trustChart = buildTrustChartRows(rows);
  const setupChart = countByLabel(rows, (row) => row.setupStepLabel);

  return {
    rows: filteredRows,
    allRows: rows,
    chartData: {
      statusChart,
      profileChart,
      locationChart,
      experienceChart,
      serviceChart,
      trustChart,
      setupChart,
      visibilityChart: [
        {
          label: "Bookable",
          value: rows.filter((row) => row.bookable).length,
          helper: "Visible to customers",
        },
        {
          label: "Not Bookable",
          value: rows.filter((row) => !row.bookable).length,
          helper: "Hidden from search",
        },
      ],
    },
    totals: {
      all: rows.length,
      shown: filteredRows.length,
      pending: rows.filter((row) => isPendingReviewRow(row)).length,
      approvedThisWeek: rows.filter((row) => row.approvedThisWeek).length,
      profileUpdates: rows.filter((row) => isProfileUpdateRow(row)).length,
      flaggedReview: rows.filter((row) => isFlaggedReviewRow(row)).length,
      setupStep1: rows.filter((row) => row.setupStep >= 1).length,
      setupStep2: rows.filter((row) => row.setupStep >= 2).length,
      setupStep3: rows.filter((row) => row.setupStep >= 3).length,
      setupStep4: rows.filter((row) => row.setupStep >= 4).length,
      setupStep5: rows.filter((row) => row.setupStep >= 5).length,
      missingStep1: rows.filter((row) => row.setupStep < 1).length,
      missingStep2: rows.filter((row) => row.setupStep < 2).length,
      missingStep3: rows.filter((row) => row.setupStep < 3).length,
      missingStep4: rows.filter((row) => row.setupStep < 4).length,
      missingStep5: rows.filter((row) => row.setupStep < 5).length,
      new: rows.filter((row) => row.applicationStatus === "new").length,
      reviewing: rows.filter((row) => row.applicationStatus === "reviewing")
        .length,
      needsInfo: rows.filter((row) => row.applicationStatus === "needs_info")
        .length,
      preApproved: rows.filter(
        (row) => row.applicationStatus === "pre_approved",
      ).length,
      verification: rows.filter(
        (row) => row.applicationStatus === "verification_pending",
      ).length,
      approved: rows.filter((row) => row.applicationStatus === "approved")
        .length,
      bookable: rows.filter((row) => row.applicationStatus === "bookable")
        .length,
      paused: rows.filter(
        (row) =>
          row.applicationStatus === "suspended" ||
          row.applicationStatus === "rejected",
      ).length,
    },
  };
}

function DashboardCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      {children}
    </div>
  );
}

function QueueBanner({ queue, shown }: { queue: QueueConfig; shown: number }) {
  return (
    <section className="rounded-[30px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            {queue.eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-emerald-950">
            {queue.title}
          </h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-7 text-emerald-800">
            {queue.description}
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-white px-5 py-4 text-center">
          <p className="text-3xl font-black text-emerald-950">
            {number(shown)}
          </p>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
            Gurus in queue
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/admin/guru-approvals"
          className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-100"
        >
          ← Back to Approvals Hub
        </Link>

        <Link
          href="/admin/gurus"
          className="inline-flex items-center justify-center rounded-2xl bg-emerald-700 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
        >
          Clear queue filter
        </Link>
      </div>
    </section>
  );
}

function SetupStepBanner({
  step,
  shown,
}: {
  step: SetupStepConfig;
  shown: number;
}) {
  return (
    <section className="rounded-[30px] border border-sky-200 bg-sky-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">
            {step.eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-sky-950">
            {step.title}
          </h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-7 text-sky-800">
            {step.description}
          </p>
        </div>

        <div className="rounded-3xl border border-sky-200 bg-white px-5 py-4 text-center">
          <p className="text-3xl font-black text-sky-950">{number(shown)}</p>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">
            Gurus shown
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/admin/guru-approvals"
          className="inline-flex items-center justify-center rounded-2xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-black text-sky-800 shadow-sm transition hover:bg-sky-100"
        >
          ← Back to Guru Approvals
        </Link>

        <Link
          href="/admin/gurus"
          className="inline-flex items-center justify-center rounded-2xl bg-sky-700 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-sky-800"
        >
          Clear step filter
        </Link>
      </div>
    </section>
  );
}

function MissingStepBanner({
  step,
  shown,
}: {
  step: SetupStepConfig;
  shown: number;
}) {
  return (
    <section className="rounded-[30px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
            {step.eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-amber-950">
            {step.title}
          </h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-7 text-amber-800">
            {step.description}
          </p>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-white px-5 py-4 text-center">
          <p className="text-3xl font-black text-amber-950">{number(shown)}</p>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">
            Gurus missing
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/admin/guru-approvals"
          className="inline-flex items-center justify-center rounded-2xl border border-amber-200 bg-white px-4 py-2.5 text-sm font-black text-amber-800 shadow-sm transition hover:bg-amber-100"
        >
          ← Back to Guru Approvals
        </Link>

        <Link
          href="/admin/gurus"
          className="inline-flex items-center justify-center rounded-2xl bg-amber-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-amber-700"
        >
          Clear missing-step filter
        </Link>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-800 transition group-hover:bg-green-800 group-hover:text-white">
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-500">{detail}</p>
    </Link>
  );
}

function MiniMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#edf3ee] bg-white p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function DonutChart({
  title,
  total,
  items,
}: {
  title: string;
  total: number;
  items: ChartItem[];
}) {
  const safeTotal = items.reduce((sum, item) => sum + item.value, 0);
  let start = 0;

  const gradient =
    safeTotal > 0
      ? items
          .map((item, index) => {
            const size = (item.value / safeTotal) * 360;
            const end = start + size;
            const segment = `${chartColors[index % chartColors.length]} ${start}deg ${end}deg`;
            start = end;
            return segment;
          })
          .join(", ")
      : "#e5e7eb 0deg 360deg";

  return (
    <div className="grid items-center gap-5 sm:grid-cols-[180px_1fr] xl:grid-cols-1 2xl:grid-cols-[180px_1fr]">
      <div className="relative mx-auto h-[180px] w-[180px]">
        <div
          className="h-full w-full rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
        />
        <div className="absolute inset-[34px] flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
          <span className="text-3xl font-black text-slate-950">
            {number(total)}
          </span>
          <span className="text-xs font-bold text-slate-500">{title}</span>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 text-sm font-bold"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{
                  backgroundColor: chartColors[index % chartColors.length],
                }}
              />
              <span className="truncate text-slate-700">{item.label}</span>
            </div>
            <span className="shrink-0 text-slate-950">
              {number(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBarChart({
  title,
  valueLabel,
  items,
  emptyLabel = "No chart data found yet.",
}: {
  title: string;
  valueLabel: string;
  items: ChartItem[];
  emptyLabel?: string;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 0);

  return (
    <div className="rounded-[24px] border border-[#edf3ee] bg-[#fbfcf9] p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-base font-black text-slate-950">{title}</h3>
        <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
          {valueLabel}
        </span>
      </div>

      <div className="space-y-4">
        {items.length ? (
          items.map((item, index) => {
            const width = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

            return (
              <div key={`${item.label}-${index}`}>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">
                      {item.label}
                    </p>
                    {item.helper ? (
                      <p className="truncate text-xs font-bold text-slate-500">
                        {item.helper}
                      </p>
                    ) : null}
                  </div>

                  <p className="shrink-0 text-sm font-black text-green-800">
                    {number(item.value)}
                  </p>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-green-800"
                    style={{ width: `${Math.max(3, width)}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-white bg-white p-4 text-sm font-bold text-slate-500">
            {emptyLabel}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickLinkCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-800 text-white">
        {icon}
      </div>

      <h3 className="text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
        {description}
      </p>

      <p className="mt-4 text-sm font-black text-green-800">
        Open page{" "}
        <span className="transition group-hover:translate-x-1">→</span>
      </p>
    </Link>
  );
}

function GuruLeadPipelineCard({
  pipeline,
}: {
  pipeline: GuruLeadPipelineData;
}) {
  const statusItems: ChartItem[] = [
    { label: "New", value: pipeline.new, helper: "Fresh leads" },
    {
      label: "Contacted",
      value: pipeline.contacted,
      helper: "Follow-up started",
    },
    {
      label: "Interested",
      value: pipeline.interested,
      helper: "Warm prospects",
    },
    {
      label: "Application Sent",
      value: pipeline.applicationSent,
      helper: "Packet sent",
    },
    {
      label: "Applied",
      value: pipeline.applied,
      helper: "Application submitted",
    },
    {
      label: "Approved",
      value: pipeline.approvedGuru,
      helper: "Converted Gurus",
    },
  ].filter((item) => item.value > 0 || item.label === "New");

  const topSources = pipeline.sourceChart.slice(0, 3);
  const topReferralCodes = pipeline.referralCodeChart.slice(0, 4);

  return (
    <DashboardCard>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
            Guru Recruiting Pipeline
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
            Lead Snapshot
          </h2>
          <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
            Compact view of Guru leads, source performance, and referral
            activity.
          </p>
        </div>

        <Link
          href={adminRoutes.guruLeads}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
        >
          <UserPlus size={17} />
          Manage Leads
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniMetric
          icon={<Users size={18} />}
          label="Total Leads"
          value={number(pipeline.total)}
        />
        <MiniMetric
          icon={<FileSearch size={18} />}
          label="Contacted"
          value={number(pipeline.contacted)}
        />
        <MiniMetric
          icon={<BadgeCheck size={18} />}
          label="Applied"
          value={number(pipeline.applied)}
        />
        <MiniMetric
          icon={<Star size={18} />}
          label="Referral Leads"
          value={number(pipeline.referralLeads)}
        />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <HorizontalBarChart
          title="Lead Status"
          valueLabel="Leads"
          items={statusItems}
          emptyLabel="No Guru Lead status data found yet."
        />

        <div className="grid gap-4">
          <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                  Top Source
                </p>
                <p className="mt-1 text-xl font-black text-emerald-950">
                  {pipeline.topSource}
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-800 ring-1 ring-emerald-200">
                {number(topSources[0]?.value || 0)} leads
              </span>
            </div>

            <div className="mt-4 grid gap-2">
              {topSources.length ? (
                topSources.map((source) => (
                  <div
                    key={source.label}
                    className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-800 ring-1 ring-emerald-100"
                  >
                    <span>{source.label}</span>
                    <span>{number(source.value)}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-500 ring-1 ring-emerald-100">
                  No source data yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-purple-100 bg-purple-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-purple-700">
                  Top Referral Codes
                </p>
                <p className="mt-1 text-xl font-black text-purple-950">
                  {pipeline.topReferralCode}
                </p>
              </div>
              <Link
                href={adminRoutes.guruLeads}
                className="rounded-full bg-white px-3 py-1 text-xs font-black text-purple-800 ring-1 ring-purple-200 transition hover:bg-purple-100"
              >
                View All
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {topReferralCodes.length ? (
                topReferralCodes.map((code) => (
                  <span
                    key={code.label}
                    className="rounded-full bg-white px-3 py-2 text-xs font-black text-purple-900 ring-1 ring-purple-100"
                  >
                    {code.label}: {number(code.value)}
                  </span>
                ))
              ) : (
                <span className="rounded-full bg-white px-3 py-2 text-xs font-bold text-purple-700 ring-1 ring-purple-100">
                  No referral code data yet
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

function GuruOnboardingPacketReviewCard({
  data,
}: {
  data: GuruOnboardingPacketAdminData;
}) {
  return (
    <DashboardCard>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
            Step 5 Review Queue
          </p>
          <h2 className="mt-1 text-xl font-black text-slate-950">
            Guru Onboarding Packets
          </h2>
          <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-slate-500">
            Review submitted Guru onboarding packets, approve Step 5, request
            fixes, and confirm any uploaded documents before marking the packet
            complete.
          </p>
        </div>

        <Link
          href={adminRoutes.guruOnboardingPackets}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-amber-700"
        >
          <FileText size={17} />
          Review Packets
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniMetric
          icon={<FileText size={18} />}
          label="Total Packets"
          value={number(data.total)}
        />
        <MiniMetric
          icon={<ClipboardCheck size={18} />}
          label="Submitted"
          value={number(data.submitted)}
        />
        <MiniMetric
          icon={<AlertTriangleIcon />}
          label="Needs Fix"
          value={number(data.needsFix)}
        />
        <MiniMetric
          icon={<CheckCircle2 size={18} />}
          label="Approved"
          value={number(data.approved)}
        />
      </div>

      <div className="mt-5 rounded-[24px] border border-amber-100 bg-amber-50 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-base font-black text-amber-950">
            Latest submissions
          </h3>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-800 ring-1 ring-amber-200">
            {number(data.documents)} documents
          </span>
        </div>

        <div className="grid gap-3">
          {data.latest.length ? (
            data.latest.map((packet) => (
              <div
                key={packet.id}
                className="rounded-2xl border border-amber-100 bg-white p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      {packet.legalName}
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      {packet.status} • Submitted{" "}
                      {formatDateShort(packet.submittedAt)} •{" "}
                      {packet.documentCount} document
                      {packet.documentCount === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={adminRoutes.guruOnboardingPackets}
                      className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-black text-white transition hover:bg-amber-700"
                    >
                      Review
                    </Link>
                    <Link
                      href={packet.messageHref}
                      className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-black text-amber-800 transition hover:bg-amber-50"
                    >
                      Message
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white bg-white p-4 text-sm font-bold text-slate-500">
              No Guru onboarding packets have been submitted yet.
            </div>
          )}
        </div>
      </div>
    </DashboardCard>
  );
}

function GuruCompactSnapshot({
  guruData,
}: {
  guruData: Awaited<ReturnType<typeof getGuruManagementData>>;
}) {
  const topLocations = guruData.chartData.locationChart.slice(0, 5);
  const topServices = guruData.chartData.serviceChart.slice(0, 5);

  return (
    <section className="grid gap-5 xl:grid-cols-3">
      <DashboardCard>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
          Guru KPI Snapshot
        </p>
        <h2 className="mt-1 text-xl font-black text-slate-950">
          Review Workload
        </h2>
        <div className="mt-4 grid gap-3">
          <WorkflowTile
            href="/admin/gurus?status=pending"
            label="Pending Admin Action"
            value={guruData.totals.pending}
            detail="Needs review or follow-up"
          />
          <WorkflowTile
            href="/admin/gurus?filter=profile-updates"
            label="Profile Updates"
            value={guruData.totals.profileUpdates}
            detail="Needs profile cleanup"
          />
          <WorkflowTile
            href="/admin/gurus?queue=flagged-review"
            label="Flagged Review"
            value={guruData.totals.flaggedReview}
            detail="Trust or risk review"
          />
        </div>
      </DashboardCard>

      <DashboardCard>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
          Readiness
        </p>
        <h2 className="mt-1 text-xl font-black text-slate-950">
          Bookable Status
        </h2>
        <div className="mt-4 grid gap-3">
          <WorkflowTile
            href="/admin/gurus?status=bookable"
            label="Bookable"
            value={guruData.totals.bookable}
            detail="Visible / ready"
          />
          <WorkflowTile
            href="/admin/gurus?status=approved"
            label="Approved"
            value={guruData.totals.approved}
            detail="Approved, not bookable"
          />
          <WorkflowTile
            href="/admin/gurus?status=new"
            label="New"
            value={guruData.totals.new}
            detail="Fresh applicants"
          />
        </div>
      </DashboardCard>

      <DashboardCard>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
          Supply
        </p>
        <h2 className="mt-1 text-xl font-black text-slate-950">
          Top Markets & Services
        </h2>
        <div className="mt-4 grid gap-4">
          <HorizontalBarChart
            title="Top Locations"
            valueLabel="Gurus"
            items={topLocations}
          />
          <HorizontalBarChart
            title="Top Services"
            valueLabel="Gurus"
            items={topServices}
          />
        </div>
      </DashboardCard>
    </section>
  );
}

function AlertTriangleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px]"
      aria-hidden="true"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function WorkflowTile({
  href,
  label,
  value,
  detail,
}: {
  href: string;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4 transition hover:border-green-200 hover:bg-green-50"
    >
      <p className="text-sm font-black text-slate-950">{label}</p>
      <p className="mt-2 text-3xl font-black text-green-950">{number(value)}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{detail}</p>
    </Link>
  );
}

export default async function AdminGurusPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const [guruData, guruLeadPipeline, guruOnboardingPackets] = await Promise.all(
    [
      getGuruManagementData(resolvedSearchParams),
      getGuruLeadPipelineData(),
      getGuruOnboardingPacketAdminData(),
    ],
  );
  const activeQueue = getActiveQueue(resolvedSearchParams);
  const activeSetupStep = getActiveSetupStep(resolvedSearchParams);
  const activeStuckBeforeStep = getActiveStuckBeforeStep(resolvedSearchParams);
  const hasFocusedQueue = Boolean(
    activeQueue || activeSetupStep || activeStuckBeforeStep,
  );

  return (
    <main className="min-h-screen bg-[#f9faf5] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="flex flex-col justify-between gap-4 rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm lg:flex-row lg:items-end">
          <div>
            <Link
              href={
                hasFocusedQueue ? adminRoutes.approvals : adminRoutes.dashboard
              }
              className="mb-4 inline-flex items-center gap-2 text-sm font-black text-green-800 transition hover:text-green-950"
            >
              <ArrowLeft size={17} />
              {hasFocusedQueue
                ? "Back to Guru Approvals"
                : "Back to Admin Dashboard"}
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-800 text-white">
                <Users size={26} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
                  {activeQueue
                    ? activeQueue.eyebrow
                    : activeSetupStep
                      ? activeSetupStep.eyebrow
                      : activeStuckBeforeStep
                        ? activeStuckBeforeStep.eyebrow
                        : "Admin / Guru Management"}
                </p>
                <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-4xl">
                  {activeQueue
                    ? activeQueue.title
                    : activeSetupStep
                      ? activeSetupStep.title
                      : activeStuckBeforeStep
                        ? activeStuckBeforeStep.title
                        : "Guru Management"}
                </h1>
                <p className="mt-1 max-w-4xl text-base font-semibold text-slate-600">
                  {activeQueue
                    ? activeQueue.description
                    : activeSetupStep
                      ? activeSetupStep.description
                      : activeStuckBeforeStep
                        ? activeStuckBeforeStep.description
                        : "Review Guru applications, profile readiness, verification progress, trust checks, bookable visibility, and exportable Guru reporting."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={adminRoutes.guruExport}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <Download size={17} />
              Export CSV Report
            </Link>

            <Link
              href={adminRoutes.approvals}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <ClipboardCheck size={17} />
              Approvals Hub
            </Link>

            <Link
              href={adminRoutes.newGuru}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
            >
              <UserPlus size={18} />
              Add Guru
            </Link>
          </div>
        </div>

        {activeQueue ? (
          <QueueBanner queue={activeQueue} shown={guruData.totals.shown} />
        ) : null}

        {activeSetupStep ? (
          <SetupStepBanner
            step={activeSetupStep}
            shown={guruData.totals.shown}
          />
        ) : null}

        {activeStuckBeforeStep ? (
          <MissingStepBanner
            step={activeStuckBeforeStep}
            shown={guruData.totals.shown}
          />
        ) : null}

        {!hasFocusedQueue ? (
          <>
            <GuruLeadPipelineCard pipeline={guruLeadPipeline} />
            <GuruOnboardingPacketReviewCard data={guruOnboardingPackets} />
          </>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <StatCard
            icon={<Users size={22} />}
            label="Total Gurus"
            value={number(guruData.totals.all)}
            detail={`${number(guruData.totals.shown)} visible with current filters`}
            href={adminRoutes.gurus}
          />

          <StatCard
            icon={<FileSearch size={22} />}
            label="Step 1 Started"
            value={number(guruData.totals.setupStep1)}
            detail={`${number(guruData.totals.missingStep1)} missing this step`}
            href="/admin/gurus?setupStep=1"
          />

          <StatCard
            icon={<Sparkles size={22} />}
            label="Step 2 Services"
            value={number(guruData.totals.setupStep2)}
            detail={`${number(guruData.totals.missingStep2)} missing this step`}
            href="/admin/gurus?setupStep=2"
          />

          <StatCard
            icon={<ClipboardCheck size={22} />}
            label="Step 3 Profile"
            value={number(guruData.totals.setupStep3)}
            detail={`${number(guruData.totals.missingStep3)} missing this step`}
            href="/admin/gurus?setupStep=3"
          />

          <StatCard
            icon={<ShieldCheck size={22} />}
            label="Step 4 Checkr"
            value={number(guruData.totals.setupStep4)}
            detail={`${number(guruData.totals.missingStep4)} missing this step`}
            href="/admin/gurus?setupStep=4"
          />

          <StatCard
            icon={<BadgeCheck size={22} />}
            label="Step 5 Bookable"
            value={number(guruData.totals.setupStep5)}
            detail={`${number(guruData.totals.missingStep5)} missing this step`}
            href="/admin/gurus?setupStep=5"
          />
        </section>

        {!hasFocusedQueue ? <GuruCompactSnapshot guruData={guruData} /> : null}

        <section>
          <DashboardCard>
            <GuruRecordsTable
              gurus={guruData.rows}
              exportHref={adminRoutes.guruExport}
            />
          </DashboardCard>
        </section>
        <div className="rounded-[26px] border border-green-100 bg-white p-4 text-sm font-semibold text-slate-500 shadow-sm">
          <span className="font-black text-green-900">Admin note:</span> This
          simplified Guru page keeps the key KPIs, onboarding packet review, and
          Guru Records table visible without the extra scroll-heavy dashboard
          sections.
        </div>
      </div>
    </main>
  );
}
