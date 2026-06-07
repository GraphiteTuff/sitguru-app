import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileSearch,
  ShieldCheck,
  Sparkles,
  Star,
  UserPlus,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import GuruRecordsTable from "./GuruRecordsTable";

export const dynamic = "force-dynamic";

type GuruRow = Record<string, unknown>;
type ProfileRow = Record<string, unknown>;
type BackgroundCheckRow = Record<string, unknown>;
type GuruLeadRow = Record<string, unknown>;

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
  sourceChart: ChartItem[];
  referralCodeChart: ChartItem[];
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
      "Focused Admin queue showing Gurus who are not approved, active, or bookable yet. These Gurus need final Admin review before becoming customer-visible.",
  },
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

function getProfileKey(profile: ProfileRow) {
  return (
    asTrimmedString(profile.id) ||
    asTrimmedString(profile.user_id) ||
    asTrimmedString(profile.profile_id) ||
    asTrimmedString(profile.email).toLowerCase()
  );
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

function getGuruName(guru: GuruRow, profile?: ProfileRow) {
  return (
    asTrimmedString(guru.display_name) ||
    asTrimmedString(guru.full_name) ||
    asTrimmedString(guru.name) ||
    asTrimmedString(profile?.display_name) ||
    asTrimmedString(profile?.full_name) ||
    asTrimmedString(profile?.name) ||
    asTrimmedString(guru.email).split("@")[0] ||
    asTrimmedString(profile?.email).split("@")[0] ||
    "Guru"
  );
}

function getGuruEmail(guru: GuruRow, profile?: ProfileRow) {
  return asTrimmedString(guru.email) || asTrimmedString(profile?.email) || "—";
}

function getGuruAvatarUrl(guru: GuruRow, profile?: ProfileRow) {
  return (
    asTrimmedString(guru.avatar_url) ||
    asTrimmedString(guru.profile_photo_url) ||
    asTrimmedString(guru.photo_url) ||
    asTrimmedString(guru.image_url) ||
    asTrimmedString(guru.headshot_url) ||
    asTrimmedString(profile?.avatar_url) ||
    asTrimmedString(profile?.profile_photo_url) ||
    asTrimmedString(profile?.photo_url) ||
    asTrimmedString(profile?.image_url) ||
    ""
  );
}

function getGuruSlug(guru: GuruRow) {
  return asTrimmedString(guru.slug);
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

  return hasName && hasBio && hasExperience && hasPhoto && hasGuruServiceData(guru);
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
  return String(value || "").trim().toLowerCase();
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
  return !["bookable", "rejected", "suspended"].includes(
    row.applicationStatus,
  );
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
      if (status === "verification") return rowStatus === "verification_pending";
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
    .slice(0, 8);
}

async function getGuruLeadPipelineData(): Promise<GuruLeadPipelineData> {
  const leads = await safeRows<GuruLeadRow>(
    supabaseAdmin
      .from("guru_leads")
      .select("id,status,lead_source,referral_code,referred_by_email,created_at")
      .order("created_at", { ascending: false })
      .limit(1000),
    "guru_leads",
  );

  const sourceChart = getLeadLabelCounts(leads, (lead) =>
    asTrimmedString(lead.lead_source),
  );

  const referralCodeChart = getLeadLabelCounts(
    leads.filter((lead) => Boolean(asTrimmedString(lead.referral_code))),
    (lead) => asTrimmedString(lead.referral_code).toUpperCase(),
  );

  const topSource = sourceChart.length > 0 ? sourceChart[0].label : "None yet";
  const topReferralCode =
    referralCodeChart.length > 0 ? referralCodeChart[0].label : "None yet";

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
    sourceChart,
    referralCodeChart,
  };
}

async function getGuruManagementData(searchParams: SearchParams) {
  const [gurus, profiles, backgroundChecks] = await Promise.all([
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
  ]);

  const profileMap = new Map<string, ProfileRow>();

  for (const profile of profiles) {
    const key = getProfileKey(profile);
    const email = asTrimmedString(profile.email).toLowerCase();

    if (key) profileMap.set(key, profile);
    if (email) profileMap.set(email, profile);
  }

  const backgroundCheckMap = new Map<string, BackgroundCheckRow>();

  for (const check of backgroundChecks) {
    const guruId = asTrimmedString(check.guru_id);

    if (guruId) {
      backgroundCheckMap.set(guruId, check);
    }
  }

  const rows: GuruDisplayRow[] = gurus.map((guru) => {
    const profile = profileMap.get(getGuruProfileKey(guru));
    const id = getGuruId(guru);
    const check = backgroundCheckMap.get(id);
    const slug = getGuruSlug(guru);
    const applicationStatus = normalizeApplicationStatus(guru);
    const backgroundStatus = getCredentialStatus(guru.background_check_status);
    const identityStatus = getCredentialStatus(
      guru.stripe_identity_status || guru.identity_status,
    );
    const safetyStatus = getCredentialStatus(guru.safety_cert_status);
    const setupStep = getGuruSetupStep({ guru, profile, check });
    const publicHref = slug ? `/guru/${slug}` : "/search";
    const flaggedForReview =
      applicationStatus === "suspended" ||
      applicationStatus === "rejected" ||
      isRiskTrustStatus(backgroundStatus) ||
      isRiskTrustStatus(identityStatus) ||
      isRiskTrustStatus(safetyStatus) ||
      isGuruFlagged(guru);

    const name = getGuruName(guru, profile);
    const email = getGuruEmail(guru, profile);
    const guruUserId = getGuruUserId(guru, profile);

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
    };
  });

  const filteredRows = filterGuruRows(rows, searchParams);

  const statusChart = countByLabel(rows, (row) => row.statusLabel);
  const profileChart = countByLabel(rows, (row) => row.profileQuality);
  const locationChart = countByLabel(rows, (row) => getGuruCityState(row));
  const experienceChart = countByLabel(rows, (row) =>
    getExperienceBucket(row.experience),
  );
  const serviceChart = countByLabel(rows, (row) => row.services.split(" • ")[0]);
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
      preApproved: rows.filter((row) => row.applicationStatus === "pre_approved")
        .length,
      verification: rows.filter(
        (row) => row.applicationStatus === "verification_pending",
      ).length,
      approved: rows.filter((row) => row.applicationStatus === "approved").length,
      bookable: rows.filter((row) => row.applicationStatus === "bookable").length,
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

function QueueBanner({
  queue,
  shown,
}: {
  queue: QueueConfig;
  shown: number;
}) {
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
        Open page <span className="transition group-hover:translate-x-1">→</span>
      </p>
    </Link>
  );
}

function GuruLeadPipelineCard({
  pipeline,
}: {
  pipeline: GuruLeadPipelineData;
}) {
  return (
    <DashboardCard>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
            Guru Recruiting Pipeline
          </p>
          <h2 className="mt-1 text-xl font-black text-slate-950">
            Guru Lead Pipeline
          </h2>
          <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-slate-500">
            Live Guru Lead data from `guru_leads`, including where prospects are
            coming from and which referral codes are creating future Guru opportunities.
          </p>
        </div>

        <Link
          href={adminRoutes.guruLeads}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
        >
          <UserPlus size={17} />
          Manage Guru Leads
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        <MiniMetric
          icon={<Users size={18} />}
          label="Total Leads"
          value={number(pipeline.total)}
        />
        <MiniMetric
          icon={<UserPlus size={18} />}
          label="New"
          value={number(pipeline.new)}
        />
        <MiniMetric
          icon={<FileSearch size={18} />}
          label="Contacted"
          value={number(pipeline.contacted)}
        />
        <MiniMetric
          icon={<Sparkles size={18} />}
          label="Interested"
          value={number(pipeline.interested)}
        />
        <MiniMetric
          icon={<ClipboardCheck size={18} />}
          label="Application Sent"
          value={number(pipeline.applicationSent)}
        />
        <MiniMetric
          icon={<BadgeCheck size={18} />}
          label="Applied"
          value={number(pipeline.applied)}
        />
        <MiniMetric
          icon={<CheckCircle2 size={18} />}
          label="Approved Guru"
          value={number(pipeline.approvedGuru)}
        />
        <MiniMetric
          icon={<Star size={18} />}
          label="Referral Leads"
          value={number(pipeline.referralLeads)}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
              Top Lead Source
            </p>
            <p className="mt-2 text-2xl font-black text-emerald-950">
              {pipeline.topSource}
            </p>
            <p className="mt-3 text-sm font-semibold leading-6 text-emerald-800">
              Use this to see whether Facebook groups, events, referrals, partners,
              job boards, or website traffic are producing the most Guru interest.
            </p>
          </div>

          <div className="mt-4 rounded-[24px] border border-purple-100 bg-purple-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-purple-700">
              Top Referral Code
            </p>
            <p className="mt-2 text-2xl font-black text-purple-950">
              {pipeline.topReferralCode}
            </p>
            <p className="mt-3 text-sm font-semibold leading-6 text-purple-800">
              Referral codes help SitGuru credit people and campaigns that are
              bringing future Gurus into the platform.
            </p>
          </div>
        </div>

        <div className="xl:col-span-4">
          <HorizontalBarChart
            title="Guru Lead Sources"
            valueLabel="Leads"
            items={pipeline.sourceChart}
            emptyLabel="No Guru Lead source data found yet."
          />
        </div>

        <div className="xl:col-span-4">
          <HorizontalBarChart
            title="Referral Codes"
            valueLabel="Leads"
            items={pipeline.referralCodeChart}
            emptyLabel="No Guru Lead referral code data found yet."
          />
        </div>
      </div>
    </DashboardCard>
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

  const [guruData, guruLeadPipeline] = await Promise.all([
    getGuruManagementData(resolvedSearchParams),
    getGuruLeadPipelineData(),
  ]);
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
              href={hasFocusedQueue ? adminRoutes.approvals : adminRoutes.dashboard}
              className="mb-4 inline-flex items-center gap-2 text-sm font-black text-green-800 transition hover:text-green-950"
            >
              <ArrowLeft size={17} />
              {hasFocusedQueue ? "Back to Guru Approvals" : "Back to Admin Dashboard"}
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

        {!hasFocusedQueue ? <GuruLeadPipelineCard pipeline={guruLeadPipeline} /> : null}

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

        <section className="grid items-start gap-5 xl:grid-cols-12">
          <div className="xl:col-span-4">
            <DashboardCard>
              <div className="mb-5">
                <h2 className="text-xl font-black text-slate-950">
                  Guru Setup Chart
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Setup step distribution from live Guru rows.
                </p>
              </div>

              <DonutChart
                title="Gurus"
                total={guruData.totals.all}
                items={guruData.chartData.setupChart}
              />

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <MiniMetric
                  icon={<BadgeCheck size={18} />}
                  label="Profile Updates"
                  value={number(guruData.totals.profileUpdates)}
                />
                <MiniMetric
                  icon={<Sparkles size={18} />}
                  label="Flagged Review"
                  value={number(guruData.totals.flaggedReview)}
                />
              </div>
            </DashboardCard>
          </div>

          <div className="xl:col-span-8">
            <DashboardCard>
              <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Guru Readiness Charts
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Visualize bookable visibility, profile quality, and trust
                    check readiness.
                  </p>
                </div>

                <Link
                  href={adminRoutes.guruExport}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white transition hover:bg-green-900"
                >
                  <Download size={16} />
                  Export
                </Link>
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                <HorizontalBarChart
                  title="Bookable Visibility"
                  valueLabel="Gurus"
                  items={guruData.chartData.visibilityChart}
                />

                <HorizontalBarChart
                  title="Profile Quality"
                  valueLabel="Gurus"
                  items={guruData.chartData.profileChart}
                />

                <HorizontalBarChart
                  title="Trust Checks"
                  valueLabel="Ready"
                  items={guruData.chartData.trustChart}
                />
              </div>
            </DashboardCard>
          </div>
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <DashboardCard>
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Guru Review Workflow
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Move Gurus through application, profile, verification, and
                    bookable readiness.
                  </p>
                </div>

                <span className="rounded-2xl border border-green-100 bg-[#f7faf4] px-4 py-3 text-sm font-black text-green-900">
                  {number(guruData.totals.pending)} pending admin action
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <WorkflowTile
                  href="/admin/gurus?status=new"
                  label="New Applications"
                  value={guruData.totals.new}
                  detail="Fresh applicants"
                />
                <WorkflowTile
                  href="/admin/gurus?status=reviewing"
                  label="Under Review"
                  value={guruData.totals.reviewing}
                  detail="Admin review needed"
                />
                <WorkflowTile
                  href="/admin/gurus?status=pre-approved"
                  label="Pre-Approved"
                  value={guruData.totals.preApproved}
                  detail="Ready for next checks"
                />
                <WorkflowTile
                  href="/admin/gurus?status=approved"
                  label="Approved"
                  value={guruData.totals.approved}
                  detail="Approved but not bookable"
                />
              </div>
            </DashboardCard>
          </div>

          <div className="xl:col-span-4">
            <DashboardCard>
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-800 text-white">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Bookable Checklist
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Gurus should only be customer-visible after these checks.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  "Public profile is complete and customer-ready",
                  "City, state, services, pricing, and availability are valid",
                  "Experience, specialties, and bio are clear",
                  "Payout readiness is confirmed when enabled",
                  "Identity verification is approved",
                  "Background check is clear or approved",
                  "Admin has made the Guru bookable",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] px-4 py-3 text-sm font-bold text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </DashboardCard>
          </div>
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <DashboardCard>
              <div className="mb-5">
                <h2 className="text-xl font-black text-slate-950">
                  Guru Supply Charts
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Visualize where Gurus are located and which services are most
                  represented.
                </p>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <HorizontalBarChart
                  title="Top Guru Locations"
                  valueLabel="Gurus"
                  items={guruData.chartData.locationChart}
                />

                <HorizontalBarChart
                  title="Top Guru Services"
                  valueLabel="Gurus"
                  items={guruData.chartData.serviceChart}
                />
              </div>
            </DashboardCard>
          </div>

          <div className="xl:col-span-5">
            <DashboardCard>
              <div className="mb-5">
                <h2 className="text-xl font-black text-slate-950">
                  Experience Mix
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Distribution of Guru experience levels.
                </p>
              </div>

              <HorizontalBarChart
                title="Experience Buckets"
                valueLabel="Gurus"
                items={guruData.chartData.experienceChart}
              />
            </DashboardCard>
          </div>
        </section>

        <section>
          <DashboardCard>
            <GuruRecordsTable
              gurus={guruData.rows}
              exportHref={adminRoutes.guruExport}
            />
          </DashboardCard>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <QuickLinkCard
            href={adminRoutes.approvals}
            icon={<ClipboardCheck size={22} />}
            title="Guru Approvals"
            description="Review the full approval workflow for new Guru applicants and profile readiness."
          />

          <QuickLinkCard
            href={adminRoutes.backgroundChecks}
            icon={<ShieldCheck size={22} />}
            title="Background Checks"
            description="Monitor identity, Checkr, safety, and trust verification before making Gurus bookable."
          />

          <QuickLinkCard
            href={adminRoutes.performance}
            icon={<Star size={22} />}
            title="Guru Performance"
            description="Review ratings, bookings, customer feedback, and operational performance."
          />
        </section>

        <div className="rounded-[26px] border border-green-100 bg-white p-4 text-sm font-semibold text-slate-500 shadow-sm">
          <span className="font-black text-green-900">
            Supabase coordination:
          </span>{" "}
          this page reads `gurus`, `profiles`, and `guru_background_checks`.
          Guru avatars, setup step, missing-step queues, application status,
          profile quality, identity status, background status, safety status,
          bookable visibility, services, location, experience, joined dates,
          charts, filters, sorting, and CSV export are calculated from live rows.
        </div>
      </div>
    </main>
  );
}