import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  ClipboardCheck,
  Download,
  FileSearch,
  HeartHandshake,
  ShieldCheck,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import GuruRecordsTable from "./GuruRecordsTable";
import { validateGuruProfileForBookability } from "@/lib/guruProfileValidation";
import {
  CANONICAL_ROLE,
  PET_PARENT_DISPLAY_LABEL,
  avatarImageFallback,
  displayNameFallback,
  emailFallback,
  normalizeRoleAlias,
  phoneFallback,
} from "@/lib/sitguru/display";

export const dynamic = "force-dynamic";

type GuruRow = Record<string, unknown>;
type ProfileRow = Record<string, unknown>;
type BackgroundCheckRow = Record<string, unknown>;
type UserRoleRow = Record<string, unknown>;
type AmbassadorRow = Record<string, unknown>;

type AccountMergeAliasRow = {
  duplicate_user_id?: string | null;
  canonical_user_id?: string | null;
  status?: string | null;
};

type AuthUserRow = {
  id: string;
  email?: string | null;
  phone?: string | null;
  email_confirmed_at?: string | null;
  phone_confirmed_at?: string | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
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

type RecordCategory =
  | "real_guru"
  | "needs_identity"
  | "account_repair"
  | "possible_duplicate"
  | "placeholder"
  | "internal"
  | "archived";

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
  isPublicVisible: boolean;
  adminStatus: string;
  profileQualityStatus: string;
  qualityClassification: string;
  missingRequirements: string[];
  approvedThisWeek: boolean;
  flaggedForReview: boolean;
  setupStep: number;
  setupStepLabel: string;
  joined: string;
  lastActivity: string;
  href: string;
  publicHref: string;
  inferredFromFallback: boolean;
  recordSourceLabel: string;
  roles: string[];
  contactMethod: string;
  nextAction: string;
  completionPercentage: number;
  recordCategory: RecordCategory;
  possibleDuplicate: boolean;
  readyForReview: boolean;
};

type QueueConfig = {
  key: string;
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
};

const queueConfigs: Record<string, QueueConfig> = {
  "pending-reviews": {
    key: "pending-reviews",
    title: "Pending Reviews",
    description:
      "Real Guru accounts that are not bookable yet and need a clear next step from Admin or the Guru.",
  },
  "ready-review": {
    key: "ready-review",
    title: "Ready for Admin Review",
    description:
      "Profiles that are mostly complete and ready for Jason or Danette to review before approval or activation.",
  },
  "needs-setup": {
    key: "needs-setup",
    title: "Needs Profile Setup",
    description:
      "Real Guru accounts that still need profile details, services, rates, availability, or location information.",
  },
  bookable: {
    key: "bookable",
    title: "Bookable Gurus",
    description:
      "Real Guru profiles currently marked public and bookable for Pet Parents.",
  },
  "account-repair": {
    key: "account-repair",
    title: "Account Repair",
    description:
      "People with a Guru role or Guru profile signal but no canonical Guru workspace. These records are kept out of normal review totals.",
  },
  "needs-identity": {
    key: "needs-identity",
    title: "Needs Identity Details",
    description:
      "Phone-first or incomplete Guru accounts that need a real name or at least one usable contact method confirmed.",
  },
  duplicates: {
    key: "duplicates",
    title: "Possible Duplicates",
    description:
      "Accounts that may belong to the same person. Review before merging or archiving anything.",
  },
  "multi-role": {
    key: "multi-role",
    title: "Multi-Role Gurus",
    description:
      "Guru accounts that also have a Pet Parent and/or Ambassador workspace.",
  },
  "flagged-review": {
    key: "flagged-review",
    title: "Flagged Review",
    description:
      "Guru accounts with trust, safety, suspension, rejection, or risk signals requiring Admin attention.",
  },
  "approved-this-week": {
    key: "approved-this-week",
    title: "Approved This Week",
    description:
      "Guru accounts approved, activated, or made bookable during the last seven days.",
  },
  "profile-updates": {
    key: "profile-updates",
    title: "Needs Profile Setup",
    description:
      "Real Guru accounts that still need profile details, services, rates, availability, or location information.",
  },
};

const knownPlaceholderNames = new Set([
  "avery johnson",
  "caleb brooks",
  "darius miller",
  "emma walsh",
  "maya reynolds",
  "nina patel",
  "olivia chen",
  "sofia martinez",
  "suzy q",
]);

/** Default / generic labels that must never create name-only duplicate matches. */
const genericDuplicateNames = new Set([
  "guru",
  "member",
  "user",
  "sitguru",
  "sitguru member",
  "sitguru user",
  "sitguru guru",
  "pet parent",
  "customer",
  "test",
  "test user",
  "demo",
  "demo user",
  "admin",
  "new user",
  "unknown",
]);

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeText(value: unknown) {
  return asTrimmedString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
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

function hasExplicitFalse(value: unknown) {
  return value === false || asTrimmedString(value).toLowerCase() === "false";
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
  const raw = asTrimmedString(value);
  if (!raw) return false;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return false;

  return parsed.getTime() >= Date.now() - days * 24 * 60 * 60 * 1000;
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Admin Guru query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Admin Guru query skipped for ${label}:`, error);
    return [];
  }
}

function getProfileIdentityKeys(profile: ProfileRow) {
  return [
    asTrimmedString(profile.id),
    asTrimmedString(profile.user_id),
    asTrimmedString(profile.profile_id),
    asTrimmedString(profile.email).toLowerCase(),
  ].filter(Boolean);
}

function getGuruId(guru: GuruRow) {
  return (
    asTrimmedString(guru.id) ||
    asTrimmedString(guru.user_id) ||
    asTrimmedString(guru.profile_id) ||
    asTrimmedString(guru.email).toLowerCase()
  );
}

function getGuruUserId(guru: GuruRow, profile?: ProfileRow) {
  return (
    asTrimmedString(guru.user_id) ||
    asTrimmedString(guru.profile_id) ||
    asTrimmedString(profile?.user_id) ||
    asTrimmedString(profile?.id) ||
    asTrimmedString(guru.id)
  );
}

function getCleanEmailNameFallback(email: string) {
  const localPart = asTrimmedString(email).split("@")[0];
  if (!localPart) return "";

  return localPart
    .replace(/[._-]+/g, " ")
    .replace(/\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getGuruName(guru: GuruRow, profile?: ProfileRow, authUser?: AuthUserRow) {
  const metadata = authUser?.user_metadata || {};
  const firstName =
    asTrimmedString(guru.first_name) ||
    asTrimmedString(profile?.first_name) ||
    asTrimmedString(metadata.first_name);
  const lastName =
    asTrimmedString(guru.last_name) ||
    asTrimmedString(profile?.last_name) ||
    asTrimmedString(metadata.last_name);

  const preferredName =
    asTrimmedString(guru.display_name) ||
    asTrimmedString(guru.full_name) ||
    asTrimmedString(guru.name) ||
    asTrimmedString(profile?.display_name) ||
    asTrimmedString(profile?.full_name) ||
    asTrimmedString(profile?.name) ||
    asTrimmedString(metadata.full_name) ||
    asTrimmedString(metadata.display_name) ||
    asTrimmedString(metadata.name) ||
    `${firstName} ${lastName}`.trim() ||
    getCleanEmailNameFallback(asTrimmedString(guru.email)) ||
    getCleanEmailNameFallback(asTrimmedString(profile?.email)) ||
    getCleanEmailNameFallback(asTrimmedString(authUser?.email));

  return displayNameFallback(preferredName, "Guru");
}

function getGuruEmail(guru: GuruRow, profile?: ProfileRow, authUser?: AuthUserRow) {
  return emailFallback(
    asTrimmedString(guru.email) ||
      asTrimmedString(profile?.email) ||
      asTrimmedString(authUser?.email),
    "—",
  );
}

function getGuruPhone(guru: GuruRow, profile?: ProfileRow, authUser?: AuthUserRow) {
  return phoneFallback(
    asTrimmedString(guru.phone) ||
      asTrimmedString(guru.phone_number) ||
      asTrimmedString(profile?.phone) ||
      asTrimmedString(profile?.phone_number) ||
      asTrimmedString(authUser?.phone),
    "No phone on file",
  );
}

function getGuruAvatarUrl(guru: GuruRow, profile?: ProfileRow, authUser?: AuthUserRow) {
  const metadata = authUser?.user_metadata || {};

  return avatarImageFallback(
    asTrimmedString(guru.avatar_url) ||
      asTrimmedString(guru.profile_photo_url) ||
      asTrimmedString(guru.photo_url) ||
      asTrimmedString(guru.image_url) ||
      asTrimmedString(profile?.avatar_url) ||
      asTrimmedString(profile?.profile_photo_url) ||
      asTrimmedString(profile?.photo_url) ||
      asTrimmedString(profile?.image_url) ||
      asTrimmedString(metadata.avatar_url) ||
      asTrimmedString(metadata.picture),
    "",
  );
}

function getGuruSlug(guru: GuruRow, profile?: ProfileRow) {
  return (
    asTrimmedString(guru.slug) ||
    asTrimmedString(guru.public_slug) ||
    asTrimmedString(guru.profile_slug) ||
    asTrimmedString(profile?.slug) ||
    asTrimmedString(profile?.public_slug)
  );
}

function slugify(value: string) {
  return normalizeText(value).replace(/\s+/g, "-") || "guru";
}

function getGuruServices(guru: GuruRow, profile?: ProfileRow) {
  const value = Array.isArray(guru.services)
    ? guru.services
    : Array.isArray(profile?.services)
      ? profile.services
      : [];

  const services = value
    .map((service) => asTrimmedString(service))
    .filter(Boolean)
    .slice(0, 4);

  if (services.length) return services.join(" • ");

  return (
    asTrimmedString(guru.service) ||
    asTrimmedString(guru.service_name) ||
    asTrimmedString(guru.specialty) ||
    asTrimmedString(profile?.service) ||
    "Services not added"
  );
}

function getGuruLocation(guru: GuruRow, profile?: ProfileRow) {
  const city =
    asTrimmedString(guru.service_city) ||
    asTrimmedString(guru.city) ||
    asTrimmedString(profile?.service_city) ||
    asTrimmedString(profile?.city);
  const state =
    asTrimmedString(guru.service_state) ||
    asTrimmedString(guru.state) ||
    asTrimmedString(profile?.service_state) ||
    asTrimmedString(profile?.state);
  const zip =
    asTrimmedString(guru.service_zip) ||
    asTrimmedString(guru.zip_code) ||
    asTrimmedString(profile?.service_zip) ||
    asTrimmedString(profile?.zip_code);

  const cityState = [city, state].filter(Boolean).join(", ");
  return [cityState, zip].filter(Boolean).join(" ") || "Location not listed";
}

function getGuruExperience(guru: GuruRow, profile?: ProfileRow) {
  const years =
    toNumber(guru.experience_years) ||
    toNumber(guru.years_experience) ||
    toNumber(profile?.experience_years);

  if (years > 0) return `${years} year${years === 1 ? "" : "s"}`;
  return "Not listed";
}

function normalizeApplicationStatus(guru: GuruRow): ApplicationStatus {
  const raw = (
    asTrimmedString(guru.application_status) ||
    asTrimmedString(guru.approval_status) ||
    asTrimmedString(guru.status)
  ).toLowerCase();

  if (raw.includes("suspend") || raw.includes("pause")) return "suspended";
  if (raw.includes("reject")) return "rejected";
  if (toBoolean(guru.is_bookable) || raw === "bookable" || raw === "active") {
    return "bookable";
  }
  if (raw.includes("verification")) return "verification_pending";
  if (raw === "pre_approved" || raw === "pre-approved") return "pre_approved";
  if (raw.includes("needs") || raw.includes("setup")) return "needs_info";
  if (raw.includes("review")) return "reviewing";
  if (raw === "approved") return "approved";
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
  }
}

function getCredentialStatus(value: unknown) {
  const normalized = asTrimmedString(value).toLowerCase();
  if (!normalized) return "Not Started";

  return normalized
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isReadyTrustStatus(value: string) {
  return ["verified", "clear", "cleared", "approved"].includes(
    value.toLowerCase(),
  );
}

function isRiskTrustStatus(value: string) {
  return ["needs review", "consider", "failed", "rejected", "suspended"].includes(
    value.toLowerCase(),
  );
}

function getSetupStep({
  guru,
  profile,
  backgroundCheck,
}: {
  guru: GuruRow;
  profile?: ProfileRow;
  backgroundCheck?: BackgroundCheckRow;
}) {
  const applicationStatus = normalizeApplicationStatus(guru);
  if (applicationStatus === "bookable" || applicationStatus === "approved") return 5;

  const backgroundStatus = asTrimmedString(
    guru.background_check_status || backgroundCheck?.status,
  ).toLowerCase();
  if (backgroundStatus && backgroundStatus !== "not_started") return 4;

  const hasPhoto = Boolean(getGuruAvatarUrl(guru, profile));
  const hasBio = Boolean(asTrimmedString(guru.bio) || asTrimmedString(profile?.bio));
  const hasServices = getGuruServices(guru, profile) !== "Services not added";
  const hasLocation = getGuruLocation(guru, profile) !== "Location not listed";
  const hasRate = Boolean(
    toNumber(guru.hourly_rate) ||
      toNumber(guru.rate) ||
      toNumber(guru.base_rate) ||
      toNumber(profile?.hourly_rate),
  );

  if (hasPhoto && hasBio && hasServices && hasLocation && hasRate) return 3;
  if (hasServices && hasLocation) return 2;
  return 1;
}

function getSetupStepLabel(step: number) {
  switch (step) {
    case 5:
      return "Step 5: Approved / Bookable";
    case 4:
      return "Step 4: Trust Review Started";
    case 3:
      return "Step 3: Profile Ready";
    case 2:
      return "Step 2: Services / Area Added";
    default:
      return "Step 1: Account Created";
  }
}

function hasUsableEmail(value: string) {
  return value !== "—" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hasUsablePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && !/^0+$/.test(digits) && !value.includes("XXX");
}

function getContactMethod(email: string, phone: string) {
  const emailReady = hasUsableEmail(email);
  const phoneReady = hasUsablePhone(phone);

  if (emailReady && phoneReady) return "Email + phone";
  if (phoneReady) return "Phone only";
  if (emailReady) return "Email only";
  return "No usable contact";
}

function normalizeRoleLabel(value: unknown) {
  const normalized = normalizeRoleAlias(asTrimmedString(value));

  if (normalized === CANONICAL_ROLE.GURU) return "Guru";
  if (normalized === "ambassador") return "Ambassador";
  if (normalized === CANONICAL_ROLE.PET_PARENT) return PET_PARENT_DISPLAY_LABEL;

  const raw = asTrimmedString(value).toLowerCase();
  if (["customer", "parent", "petparent", "pet_parent"].includes(raw)) {
    return PET_PARENT_DISPLAY_LABEL;
  }
  if (["ambassador", "partner", "community_ambassador"].includes(raw)) {
    return "Ambassador";
  }
  if (["guru", "sitter", "provider", "walker"].includes(raw)) return "Guru";
  return "";
}

function getRoleBadges({
  userId,
  profile,
  roleMap,
  ambassadorUserIds,
  hasGuruWorkspace,
}: {
  userId: string;
  profile?: ProfileRow;
  roleMap: Map<string, Set<string>>;
  ambassadorUserIds: Set<string>;
  hasGuruWorkspace: boolean;
}) {
  const roles = new Set<string>();
  if (hasGuruWorkspace) roles.add("Guru");

  for (const role of roleMap.get(userId) || []) {
    const label = normalizeRoleLabel(role);
    if (label) roles.add(label);
  }

  const profileRole = normalizeRoleLabel(profile?.role || profile?.account_type);
  if (profileRole) roles.add(profileRole);
  if (ambassadorUserIds.has(userId)) roles.add("Ambassador");

  const order = ["Guru", PET_PARENT_DISPLAY_LABEL, "Ambassador"];
  return Array.from(roles).sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

function isPlaceholderGuru(guru: GuruRow, name: string, email: string, phone: string) {
  const normalizedName = normalizeText(name);
  const normalizedEmail = email.toLowerCase();
  const source = normalizeText(guru.source);

  return (
    knownPlaceholderNames.has(normalizedName) ||
    normalizedEmail.endsWith("@placeholder.sitguru.local") ||
    phone.replace(/\D/g, "") === "0000000000" ||
    source.includes("demo") ||
    source.includes("seed") ||
    toBoolean(guru.is_test_account)
  );
}

function isArchivedGuru(guru: GuruRow) {
  const status = `${asTrimmedString(guru.status)} ${asTrimmedString(
    guru.admin_status,
  )}`.toLowerCase();

  return toBoolean(guru.is_archived) || status.includes("archived");
}

function removeFlexibleContactFalsePositives(
  missingRequirements: string[],
  email: string,
  phone: string,
) {
  const hasContact = hasUsableEmail(email) || hasUsablePhone(phone);

  return missingRequirements.filter((requirement) => {
    const normalized = requirement.toLowerCase();

    if (hasContact && normalized.includes("valid email")) return false;
    if (hasContact && normalized.includes("email address")) return false;
    if (hasContact && normalized.includes("phone number")) return false;
    return true;
  });
}

function getCompletionPercentage(missingRequirements: string[], bookable: boolean) {
  if (bookable) return 100;
  const totalChecks = 12;
  const remaining = Math.min(totalChecks, missingRequirements.length);
  return Math.max(8, Math.round(((totalChecks - remaining) / totalChecks) * 100));
}

function getNextAction({
  category,
  applicationStatus,
  missingRequirements,
  readyForReview,
  flaggedForReview,
  bookable,
}: {
  category: RecordCategory;
  applicationStatus: ApplicationStatus;
  missingRequirements: string[];
  readyForReview: boolean;
  flaggedForReview: boolean;
  bookable: boolean;
}) {
  if (category === "account_repair") return "Create or repair Guru workspace";
  if (category === "possible_duplicate") {
    return "Review possible duplicates by shared email, phone, or real name";
  }
  if (category === "needs_identity") return "Confirm name and contact details";
  if (category === "placeholder") return "Keep out of live Guru totals";
  if (category === "internal") return "Review internal role assignment";
  if (category === "archived") return "No action unless restoring";
  if (flaggedForReview) return "Review trust or safety concern";
  if (bookable) return "Monitor active profile";
  if (readyForReview) return "Complete Admin review";
  if (applicationStatus === "approved") return "Complete final bookable review";
  if (applicationStatus === "verification_pending") return "Check verification progress";
  if (missingRequirements.length) return "Send friendly setup reminder";
  return "Open Guru review";
}

function getMessageHref({
  userId,
  guruId,
  name,
  email,
}: {
  userId: string;
  guruId: string;
  name: string;
  email: string;
}) {
  const params = new URLSearchParams({
    threadType: "direct_guru",
    recipientRole: "guru",
    source: "admin-gurus",
  });

  if (userId) params.set("recipientId", userId);
  if (guruId) params.set("guruId", guruId);
  if (name && name !== "Guru") params.set("recipientName", name);
  if (hasUsableEmail(email)) params.set("recipientEmail", email);

  return `/admin/messages?${params.toString()}`;
}

async function getAllAuthUsers() {
  const users: AuthUserRow[] = [];
  let page = 1;

  try {
    while (page <= 10) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 1000,
      });

      if (error) {
        console.warn("Admin Guru auth-user query skipped:", error);
        break;
      }

      const pageUsers = Array.isArray(data?.users)
        ? (data.users as AuthUserRow[])
        : [];
      users.push(...pageUsers);
      if (pageUsers.length < 1000) break;
      page += 1;
    }
  } catch (error) {
    console.warn("Admin Guru auth-user query skipped:", error);
  }

  return users;
}

function findProfileForGuru(guru: GuruRow, profileMap: Map<string, ProfileRow>) {
  const keys = [
    asTrimmedString(guru.user_id),
    asTrimmedString(guru.profile_id),
    asTrimmedString(guru.id),
    asTrimmedString(guru.email).toLowerCase(),
  ].filter(Boolean);

  for (const key of keys) {
    const profile = profileMap.get(key);
    if (profile) return profile;
  }

  return undefined;
}

function isGenericDuplicateName(name: string) {
  const normalized = normalizeText(name);
  if (!normalized) return true;
  if (genericDuplicateNames.has(normalized)) return true;
  if (knownPlaceholderNames.has(normalized)) return true;
  if (normalized.startsWith("sitguru ")) return true;
  if (normalized.endsWith(" member") && normalized.split(" ").length <= 2) {
    return true;
  }
  return false;
}

function isStrongPersonalName(name: string) {
  const normalized = normalizeText(name);
  if (!normalized || isGenericDuplicateName(normalized)) return false;

  const parts = normalized.split(" ").filter(Boolean);
  // Require first + last style names so single-token defaults never cluster.
  return parts.length >= 2 && parts.every((part) => part.length >= 2);
}

function getNormalizedDuplicateKeys(name: string, email: string, phone: string) {
  const keys: string[] = [];
  const normalizedEmail = email.toLowerCase();
  const normalizedPhone = phone.replace(/\D/g, "");

  if (hasUsableEmail(email)) keys.push(`email:${normalizedEmail}`);
  if (hasUsablePhone(phone)) keys.push(`phone:${normalizedPhone}`);
  // Name-only collisions on defaults like "SitGuru Member" caused false positives.
  if (isStrongPersonalName(name)) {
    keys.push(`name:${normalizeText(name)}`);
  }

  return keys;
}

function describeDuplicateMatch(keys: string[]) {
  const reasons = Array.from(
    new Set(
      keys
        .map((key) => {
          if (key.startsWith("email:")) return "shared email";
          if (key.startsWith("phone:")) return "shared phone";
          if (key.startsWith("name:")) return "shared real name";
          return "";
        })
        .filter(Boolean),
    ),
  );

  if (!reasons.length) return "Review possible duplicate accounts";
  return `Review possible duplicates (${reasons.join(", ")})`;
}

function getActiveQueue(searchParams: SearchParams) {
  const requested = asTrimmedString(searchParams.queue || searchParams.filter).toLowerCase();

  if (requested === "profile-updates") return queueConfigs["needs-setup"];
  if (requested === "orphaned-fallback") return queueConfigs["account-repair"];
  if (requested === "cleanup-review") return queueConfigs.duplicates;
  if (requested === "applications-received") return queueConfigs["pending-reviews"];

  return queueConfigs[requested] || null;
}

function filterRows(rows: GuruDisplayRow[], searchParams: SearchParams) {
  const queue = getActiveQueue(searchParams)?.key || "";
  const status = asTrimmedString(searchParams.status).toLowerCase();
  const requestedGuru = normalizeText(searchParams.guru);
  const query = normalizeText(searchParams.q);
  const setupStep = Number(searchParams.setupStep || 0);
  const stuckBeforeStep = Number(searchParams.stuckBeforeStep || 0);

  return rows.filter((row) => {
    const searchText = normalizeText(
      [
        row.id,
        row.userId,
        row.name,
        row.email,
        row.phone,
        row.location,
        row.services,
        row.statusLabel,
        row.nextAction,
        row.roles.join(" "),
        row.missingRequirements.join(" "),
      ].join(" "),
    );

    if (requestedGuru && !searchText.includes(requestedGuru)) return false;
    if (query && !searchText.includes(query)) return false;
    if (setupStep >= 1 && row.setupStep < setupStep) return false;
    if (stuckBeforeStep >= 1 && row.setupStep >= stuckBeforeStep) return false;

    if (queue === "pending-reviews") {
      return (
        ["real_guru", "needs_identity", "possible_duplicate"].includes(
          row.recordCategory,
        ) &&
        !row.bookable &&
        !["rejected", "suspended"].includes(row.applicationStatus)
      );
    }
    if (queue === "ready-review") return row.readyForReview;
    if (queue === "needs-setup") {
      return (
        ["real_guru", "needs_identity"].includes(row.recordCategory) &&
        !row.bookable &&
        row.missingRequirements.length > 0
      );
    }
    if (queue === "bookable") return row.bookable;
    if (queue === "account-repair") return row.recordCategory === "account_repair";
    if (queue === "needs-identity") return row.recordCategory === "needs_identity";
    if (queue === "duplicates") return row.possibleDuplicate;
    if (queue === "multi-role") return row.roles.length > 1;
    if (queue === "flagged-review") return row.flaggedForReview;
    if (queue === "approved-this-week") return row.approvedThisWeek;

    if (status === "pending") return !row.bookable;
    if (status === "bookable") return row.bookable;
    if (status === "approved") return row.applicationStatus === "approved";
    if (status === "new") return row.applicationStatus === "new";
    if (status === "needs-info") return row.applicationStatus === "needs_info";
    if (status === "reviewing") return row.applicationStatus === "reviewing";
    if (status === "verification") {
      return row.applicationStatus === "verification_pending";
    }

    return ["real_guru", "needs_identity", "possible_duplicate"].includes(
      row.recordCategory,
    );
  });
}

async function getGuruManagementData(searchParams: SearchParams) {
  const [
    gurus,
    profiles,
    backgroundChecks,
    userRoles,
    ambassadors,
    mergeAliases,
    authUsers,
  ] = await Promise.all([
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
        .limit(2000),
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
    safeRows<UserRoleRow>(
      supabaseAdmin.from("user_roles").select("*").limit(5000),
      "user_roles",
    ),
    safeRows<AmbassadorRow>(
      supabaseAdmin.from("ambassadors").select("*").limit(2000),
      "ambassadors",
    ),
    safeRows<AccountMergeAliasRow>(
      supabaseAdmin
        .from("account_merge_aliases")
        .select("duplicate_user_id, canonical_user_id, status")
        .eq("status", "active")
        .limit(5000),
      "account_merge_aliases",
    ),
    getAllAuthUsers(),
  ]);

  const retiredDuplicateUserIds = new Set(
    mergeAliases
      .map((row) => asTrimmedString(row.duplicate_user_id))
      .filter(Boolean),
  );

  const profileMap = new Map<string, ProfileRow>();
  for (const profile of profiles) {
    for (const key of getProfileIdentityKeys(profile)) profileMap.set(key, profile);
  }

  const activeGurus = gurus.filter((guru) => {
    const profile = findProfileForGuru(guru, profileMap);
    const userId = getGuruUserId(guru, profile);
    return !retiredDuplicateUserIds.has(userId);
  });

  const authMap = new Map(authUsers.map((user) => [user.id, user]));
  const backgroundMap = new Map<string, BackgroundCheckRow>();
  for (const check of backgroundChecks) {
    const keys = [
      asTrimmedString(check.guru_id),
      asTrimmedString(check.user_id),
      asTrimmedString(check.profile_id),
    ].filter(Boolean);
    for (const key of keys) backgroundMap.set(key, check);
  }

  const roleMap = new Map<string, Set<string>>();
  for (const roleRow of userRoles) {
    const userId = asTrimmedString(roleRow.user_id);
    const role = asTrimmedString(roleRow.role);
    if (!userId || !role) continue;
    const roles = roleMap.get(userId) || new Set<string>();
    roles.add(role);
    roleMap.set(userId, roles);
  }

  const ambassadorUserIds = new Set(
    ambassadors
      .map((row) => asTrimmedString(row.user_id || row.profile_id || row.id))
      .filter(Boolean),
  );

  const canonicalGuruUserIds = new Set<string>();
  for (const guru of activeGurus) {
    const userId = getGuruUserId(guru, findProfileForGuru(guru, profileMap));
    if (userId) canonicalGuruUserIds.add(userId);
  }

  const duplicateCounts = new Map<string, number>();
  for (const guru of activeGurus) {
    const profile = findProfileForGuru(guru, profileMap);
    const userId = getGuruUserId(guru, profile);
    const authUser = authMap.get(userId);
    const name = getGuruName(guru, profile, authUser);
    const email = getGuruEmail(guru, profile, authUser);
    const phone = getGuruPhone(guru, profile, authUser);

    for (const key of getNormalizedDuplicateKeys(name, email, phone)) {
      duplicateCounts.set(key, (duplicateCounts.get(key) || 0) + 1);
    }
  }

  const canonicalRows: GuruDisplayRow[] = activeGurus.map((guru) => {
    const profile = findProfileForGuru(guru, profileMap);
    const id = getGuruId(guru);
    const userId = getGuruUserId(guru, profile);
    const authUser = authMap.get(userId);
    const backgroundCheck = backgroundMap.get(id) || backgroundMap.get(userId);
    const name = getGuruName(guru, profile, authUser);
    const email = getGuruEmail(guru, profile, authUser);
    const phone = getGuruPhone(guru, profile, authUser);
    const roles = getRoleBadges({
      userId,
      profile,
      roleMap,
      ambassadorUserIds,
      hasGuruWorkspace: true,
    });
    const contactMethod = getContactMethod(email, phone);
    const applicationStatus = normalizeApplicationStatus(guru);
    const identityStatus = getCredentialStatus(
      guru.stripe_identity_status || guru.identity_status,
    );
    const backgroundStatus = getCredentialStatus(
      guru.background_check_status || backgroundCheck?.status,
    );
    const safetyStatus = getCredentialStatus(guru.safety_cert_status);
    const isPublicVisible =
      !hasExplicitFalse(guru.is_public_visible) &&
      !hasExplicitFalse(guru.is_public) &&
      (toBoolean(guru.is_public_visible) || toBoolean(guru.is_public));
    const operationalBookable =
      (toBoolean(guru.is_bookable) || applicationStatus === "bookable") &&
      !hasExplicitFalse(guru.is_public_visible) &&
      !hasExplicitFalse(guru.is_public);
    const duplicateKeys = getNormalizedDuplicateKeys(name, email, phone);
    const matchedDuplicateKeys = duplicateKeys.filter(
      (key) => (duplicateCounts.get(key) || 0) > 1,
    );
    const duplicate = matchedDuplicateKeys.length > 0;
    const quality = validateGuruProfileForBookability({
      guru,
      profile,
      duplicateCandidate: duplicate,
      source: "gurus",
    });
    const missingRequirements = removeFlexibleContactFalsePositives(
      Array.from(new Set(quality.missingRequirements || [])),
      email,
      phone,
    );
    const placeholder = isPlaceholderGuru(guru, name, email, phone);
    const archived = isArchivedGuru(guru);
    const internal =
      normalizeRoleLabel(profile?.role || profile?.account_type) === "" &&
      ["admin", "super_admin"].includes(
        asTrimmedString(profile?.role || profile?.account_type).toLowerCase(),
      );
    const needsIdentity =
      normalizeText(name) === "guru" ||
      contactMethod === "No usable contact" ||
      (!hasUsableEmail(email) && !hasUsablePhone(phone));
    const flaggedForReview =
      ["suspended", "rejected"].includes(applicationStatus) ||
      isRiskTrustStatus(identityStatus) ||
      isRiskTrustStatus(backgroundStatus) ||
      isRiskTrustStatus(safetyStatus) ||
      toBoolean(guru.flagged) ||
      toBoolean(guru.is_flagged) ||
      toBoolean(guru.needs_review);

    let recordCategory: RecordCategory = "real_guru";
    if (placeholder) recordCategory = "placeholder";
    else if (archived) recordCategory = "archived";
    else if (internal) recordCategory = "internal";
    else if (duplicate) recordCategory = "possible_duplicate";
    else if (needsIdentity) recordCategory = "needs_identity";

    const completionPercentage = getCompletionPercentage(
      missingRequirements,
      operationalBookable,
    );
    const readyForReview =
      recordCategory === "real_guru" &&
      !operationalBookable &&
      completionPercentage >= 75 &&
      !flaggedForReview;
    const nextAction =
      recordCategory === "possible_duplicate"
        ? describeDuplicateMatch(matchedDuplicateKeys)
        : getNextAction({
            category: recordCategory,
            applicationStatus,
            missingRequirements,
            readyForReview,
            flaggedForReview,
            bookable: operationalBookable,
          });
    const setupStep = getSetupStep({ guru, profile, backgroundCheck });
    const slug = getGuruSlug(guru, profile) || slugify(name || id);
    const publicIdentifier = slug || userId || id;
    const lastActivityRaw =
      asTrimmedString(guru.updated_at) ||
      asTrimmedString(profile?.updated_at) ||
      asTrimmedString(authUser?.last_sign_in_at) ||
      asTrimmedString(guru.created_at);

    return {
      id,
      userId,
      guruUserId: userId,
      messageHref: getMessageHref({ userId, guruId: id, name, email }),
      name,
      email,
      phone,
      avatarUrl: getGuruAvatarUrl(guru, profile, authUser),
      slug,
      services: getGuruServices(guru, profile),
      location: getGuruLocation(guru, profile),
      experience: getGuruExperience(guru, profile),
      applicationStatus,
      statusLabel: getApplicationStatusLabel(applicationStatus),
      profileQuality: quality.profileQualityStatus,
      identityStatus,
      backgroundStatus,
      safetyStatus,
      bookable: operationalBookable,
      isPublicVisible,
      adminStatus: quality.adminStatus,
      profileQualityStatus: quality.profileQualityStatus,
      qualityClassification: quality.classification,
      missingRequirements,
      approvedThisWeek:
        operationalBookable &&
        [guru.approved_at, guru.bookable_at, guru.updated_at].some((value) =>
          isWithinLastDays(value, 7),
        ),
      flaggedForReview,
      setupStep,
      setupStepLabel: getSetupStepLabel(setupStep),
      joined: formatDateShort(asTrimmedString(guru.created_at)),
      lastActivity: formatDateShort(lastActivityRaw),
      href: id ? `/admin/gurus/${encodeURIComponent(id)}` : "/admin/gurus",
      publicHref: publicIdentifier
        ? `/guru/${encodeURIComponent(publicIdentifier)}`
        : "/search",
      inferredFromFallback: false,
      recordSourceLabel: "Guru workspace",
      roles,
      contactMethod,
      nextAction,
      completionPercentage,
      recordCategory,
      possibleDuplicate: duplicate,
      readyForReview,
    };
  });

  const repairUserIds = new Set<string>();

  for (const [userId, roles] of roleMap.entries()) {
    if (retiredDuplicateUserIds.has(userId)) continue;

    const hasGuruRole = Array.from(roles).some(
      (role) => normalizeRoleLabel(role) === "Guru",
    );
    if (hasGuruRole && !canonicalGuruUserIds.has(userId)) repairUserIds.add(userId);
  }

  for (const profile of profiles) {
    const userId =
      asTrimmedString(profile.user_id) ||
      asTrimmedString(profile.id) ||
      asTrimmedString(profile.profile_id);

    if (!userId || retiredDuplicateUserIds.has(userId)) continue;

    const profileRole = normalizeRoleLabel(profile.role || profile.account_type);
    const hasIdentity = Boolean(
      getGuruName({}, profile, authMap.get(userId)) !== "Guru" ||
        hasUsableEmail(getGuruEmail({}, profile, authMap.get(userId))) ||
        hasUsablePhone(getGuruPhone({}, profile, authMap.get(userId))),
    );

    if (
      userId &&
      profileRole === "Guru" &&
      !canonicalGuruUserIds.has(userId) &&
      (roleMap.get(userId)?.size || hasIdentity)
    ) {
      repairUserIds.add(userId);
    }
  }

  for (const retiredUserId of retiredDuplicateUserIds) {
    repairUserIds.delete(retiredUserId);
  }

  const repairRows: GuruDisplayRow[] = Array.from(repairUserIds).map((userId) => {
    const profile = profileMap.get(userId);
    const authUser = authMap.get(userId);
    const pseudoGuru: GuruRow = {
      id: userId,
      user_id: userId,
      profile_id: userId,
      source: "account_repair",
    };
    const name = getGuruName(pseudoGuru, profile, authUser);
    const email = getGuruEmail(pseudoGuru, profile, authUser);
    const phone = getGuruPhone(pseudoGuru, profile, authUser);
    const roles = getRoleBadges({
      userId,
      profile,
      roleMap,
      ambassadorUserIds,
      hasGuruWorkspace: false,
    });
    if (!roles.includes("Guru")) roles.unshift("Guru");

    return {
      id: userId,
      userId,
      guruUserId: userId,
      messageHref: getMessageHref({
        userId,
        guruId: userId,
        name,
        email,
      }),
      name,
      email,
      phone,
      avatarUrl: getGuruAvatarUrl(pseudoGuru, profile, authUser),
      slug: slugify(name),
      services: "Guru workspace missing",
      location: getGuruLocation(pseudoGuru, profile),
      experience: "Not listed",
      applicationStatus: "needs_info",
      statusLabel: "Account Repair Needed",
      profileQuality: "Needs Repair",
      identityStatus: "Not Started",
      backgroundStatus: "Not Started",
      safetyStatus: "Not Started",
      bookable: false,
      isPublicVisible: false,
      adminStatus: "needs_repair",
      profileQualityStatus: "needs_repair",
      qualityClassification: "orphaned_profile",
      missingRequirements: ["Guru workspace"],
      approvedThisWeek: false,
      flaggedForReview: false,
      setupStep: 1,
      setupStepLabel: "Step 1: Account Created",
      joined: formatDateShort(authUser?.created_at || asTrimmedString(profile?.created_at)),
      lastActivity: formatDateShort(
        authUser?.last_sign_in_at || asTrimmedString(profile?.updated_at),
      ),
      href: `/admin/account-lifecycle?query=${encodeURIComponent(userId)}`,
      publicHref: "/search",
      inferredFromFallback: true,
      recordSourceLabel: "Guru role without workspace",
      roles,
      contactMethod: getContactMethod(email, phone),
      nextAction: "Create or repair Guru workspace",
      completionPercentage: 15,
      recordCategory: "account_repair",
      possibleDuplicate: false,
      readyForReview: false,
    };
  });

  const allRows = [...canonicalRows, ...repairRows];
  const operationalRows = allRows.filter((row) =>
    ["real_guru", "needs_identity", "possible_duplicate"].includes(
      row.recordCategory,
    ),
  );
  const filteredRows = filterRows(allRows, searchParams);

  return {
    rows: filteredRows,
    totals: {
      realGurus: operationalRows.length,
      shown: filteredRows.length,
      pending: operationalRows.filter(
        (row) =>
          !row.bookable &&
          !["rejected", "suspended"].includes(row.applicationStatus),
      ).length,
      readyForReview: operationalRows.filter((row) => row.readyForReview).length,
      needsSetup: operationalRows.filter(
        (row) => !row.bookable && row.missingRequirements.length > 0,
      ).length,
      bookable: operationalRows.filter((row) => row.bookable).length,
      accountRepair: repairRows.length,
      needsIdentity: operationalRows.filter(
        (row) => row.recordCategory === "needs_identity",
      ).length,
      duplicates: operationalRows.filter((row) => row.possibleDuplicate).length,
      multiRole: operationalRows.filter((row) => row.roles.length > 1).length,
      flagged: operationalRows.filter((row) => row.flaggedForReview).length,
      placeholders: canonicalRows.filter(
        (row) => row.recordCategory === "placeholder",
      ).length,
      internal: canonicalRows.filter((row) => row.recordCategory === "internal").length,
      archived: canonicalRows.filter((row) => row.recordCategory === "archived").length,
      mergedDuplicates: retiredDuplicateUserIds.size,
    },
  };
}

function MetricCard({
  href,
  icon,
  label,
  value,
  detail,
  accent = "green",
}: {
  href: string;
  icon: ReactNode;
  label: string;
  value: number;
  detail: string;
  accent?: "green" | "amber" | "sky" | "rose";
}) {
  const styles = {
    green: "border-emerald-100 bg-emerald-50 text-emerald-800",
    amber: "border-amber-100 bg-amber-50 text-amber-800",
    sky: "border-sky-100 bg-sky-50 text-sky-800",
    rose: "border-rose-100 bg-rose-50 text-rose-800",
  }[accent];

  return (
    <Link
      href={href}
      className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${styles}`}>
        {icon}
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
        {new Intl.NumberFormat("en-US").format(value)}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{detail}</p>
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

  if (error || !user) return null;

  const guruData = await getGuruManagementData(resolvedSearchParams);
  const activeQueue = getActiveQueue(resolvedSearchParams);

  return (
    <main className="min-h-screen bg-[#f7faf7] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <section className="rounded-[30px] border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <Link
                href={adminRoutes.dashboard}
                className="text-sm font-black text-emerald-800 transition hover:text-emerald-950"
              >
                ← Back to Admin Dashboard
              </Link>
              <div className="mt-5 flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white">
                  <Users size={26} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Admin / Guru Review
                  </p>
                  <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    {activeQueue?.title || "Guru Management"}
                  </h1>
                  <p className="mt-2 max-w-4xl text-sm font-semibold leading-7 text-slate-600 sm:text-base">
                    {activeQueue?.description ||
                      "One clear place for Jason and Danette to review real Guru people, see their other SitGuru roles, understand what is missing, and take the next best action."}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={adminRoutes.approvals}
                className="rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
              >
                Approvals Hub
              </Link>
              <Link
                href={adminRoutes.guruLeads}
                className="rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
              >
                Guru Leads
              </Link>
              <Link
                href={adminRoutes.guruOnboardingPackets}
                className="rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
              >
                Onboarding Packets
              </Link>
              <Link
                href={adminRoutes.guruExport}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                <Download size={16} /> Export
              </Link>
              <Link
                href={adminRoutes.newGuru}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-800"
              >
                <UserPlus size={16} /> Add Guru
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[26px] border border-sky-200 bg-sky-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <HeartHandshake className="mt-0.5 shrink-0 text-sky-700" size={22} />
            <div>
              <h2 className="font-black text-sky-950">What the totals mean</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-sky-800">
                “Real Guru People” counts canonical Guru workspaces only. A person may also be a Pet Parent or Ambassador and still counts once here. Placeholder, archived, internal, and repair-only records do not inflate the main Guru total.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            href="/admin/gurus"
            icon={<Users size={20} />}
            label="Real Guru People"
            value={guruData.totals.realGurus}
            detail="Canonical Guru workspaces, counted once per account"
          />
          <MetricCard
            href="/admin/gurus?queue=pending-reviews"
            icon={<ClipboardCheck size={20} />}
            label="Pending Reviews"
            value={guruData.totals.pending}
            detail="Real Gurus not bookable yet"
            accent="amber"
          />
          <MetricCard
            href="/admin/gurus?queue=ready-review"
            icon={<FileSearch size={20} />}
            label="Ready for Review"
            value={guruData.totals.readyForReview}
            detail="Mostly complete and ready for Admin"
            accent="sky"
          />
          <MetricCard
            href="/admin/gurus?queue=bookable"
            icon={<BadgeCheck size={20} />}
            label="Bookable Gurus"
            value={guruData.totals.bookable}
            detail="Public and ready for Pet Parents"
          />
          <MetricCard
            href="/admin/gurus?queue=needs-setup"
            icon={<ClipboardCheck size={20} />}
            label="Needs Profile Setup"
            value={guruData.totals.needsSetup}
            detail="Waiting on profile or service details"
            accent="amber"
          />
          <MetricCard
            href="/admin/gurus?queue=multi-role"
            icon={<HeartHandshake size={20} />}
            label="Multi-Role Gurus"
            value={guruData.totals.multiRole}
            detail="Also Pet Parent and/or Ambassador"
            accent="sky"
          />
          <MetricCard
            href="/admin/gurus?queue=account-repair"
            icon={<Wrench size={20} />}
            label="Account Repair"
            value={guruData.totals.accountRepair}
            detail="Guru role present but workspace missing"
            accent="rose"
          />
          <MetricCard
            href="/admin/gurus?queue=duplicates"
            icon={<AlertTriangle size={20} />}
            label="Possible Duplicates"
            value={guruData.totals.duplicates}
            detail="Review before merging or archiving"
            accent="rose"
          />
        </section>

        <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/gurus" className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-black text-white">
              All Real Gurus
            </Link>
            <Link href="/admin/gurus?queue=pending-reviews" className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-200">
              Pending
            </Link>
            <Link href="/admin/gurus?queue=ready-review" className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-200">
              Ready for Review
            </Link>
            <Link href="/admin/gurus?queue=needs-identity" className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-200">
              Needs Identity ({guruData.totals.needsIdentity})
            </Link>
            <Link href="/admin/gurus?queue=flagged-review" className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-200">
              Flagged ({guruData.totals.flagged})
            </Link>
            <Link href="/admin/gurus?queue=account-repair" className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-200">
              Repair Queue
            </Link>
          </div>
        </section>

        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <GuruRecordsTable
            gurus={guruData.rows}
            exportHref={adminRoutes.guruExport}
          />
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-600 shadow-sm">
          <span className="font-black text-slate-900">Excluded from the main Guru total:</span>{" "}
          {guruData.totals.placeholders} placeholder/demo, {guruData.totals.archived} archived/test, {guruData.totals.internal} internal records, and {guruData.totals.mergedDuplicates} merged duplicate aliases. These are preserved in the database but no longer clutter the daily Admin review queue.
        </section>
      </div>
    </main>
  );
}