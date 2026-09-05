import type { ReactNode } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  Download,
  Globe2,
  Mail,
  MapPin,
  Megaphone,
  MousePointerClick,
  PawPrint,
  Repeat2,
  Search,
  Share2,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { avatarImageFallback } from "@/lib/sitguru/display";
import { resolveLocationParts } from "@/lib/location/zip-lookup";
import {
  filterCustomersForMetric,
  getCustomerIntelligenceMetricHref,
  getCustomerIntelligenceMetricMeta,
  parseCustomerIntelligenceMetric,
  type CustomerIntelligenceMetricId,
} from "@/lib/admin/customer-intelligence/metrics";
import { getPetParentReadiness } from "@/lib/pet-parent-readiness";
import {
  isFounderPersonalMarketplaceEmail,
  isHardcodedSuperUserEmail,
  skipNameOnlyDuplicateMatch,
} from "@/lib/admin/super-users";
import CustomerInsightsTable from "./CustomerInsightsTable";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type SafeAdminQueryResponse = {
  data: unknown;
  error: unknown;
};

type ProfileRow = {
  id: string;
  full_name?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  role?: string | null;
  user_role?: string | null;
  account_type?: string | null;
  type?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zip?: string | null;
  zipcode?: string | null;
  zip_code?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  phone_number?: string | null;
  source?: string | null;
  signup_source?: string | null;
  referral_source?: string | null;
  lead_source?: string | null;
  acquisition_source?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  campaign?: string | null;
  campaign_name?: string | null;
  admin_status?: string | null;
  archived_at?: string | null;
  archive_reason?: string | null;
  deleted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type BookingRow = {
  id: string;
  customer_id?: string | null;
  pet_owner_id?: string | null;
  client_id?: string | null;
  user_id?: string | null;
  customer_name?: string | null;
  pet_parent_name?: string | null;
  owner_name?: string | null;
  customer_email?: string | null;
  pet_name?: string | null;
  status?: string | null;
  booking_status?: string | null;
  payment_status?: string | null;
  booking_date?: string | null;
  start_time?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  zipcode?: string | null;
  zip_code?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  phone_number?: string | null;
  source?: string | null;
  signup_source?: string | null;
  referral_source?: string | null;
  lead_source?: string | null;
  acquisition_source?: string | null;
  utm_source?: string | null;
  total_amount?: number | string | null;
  amount?: number | string | null;
  price?: number | string | null;
  subtotal?: number | string | null;
  service_total?: number | string | null;
  grand_total?: number | string | null;
};

type PetRow = {
  id: string;
  owner_id?: string | null;
  customer_id?: string | null;
  pet_parent_id?: string | null;
  user_id?: string | null;
  name?: string | null;
  pet_name?: string | null;
  species?: string | null;
  type?: string | null;
  pet_type?: string | null;
  breed?: string | null;
  size?: string | null;
  size_category?: string | null;
  medical_notes?: string | null;
  medications?: string | null;
  feeding_routine?: string | null;
  potty_routine?: string | null;
  created_at?: string | null;
};

type MessageRow = {
  id: string;
  sender_id?: string | null;
  recipient_id?: string | null;
  customer_id?: string | null;
  user_id?: string | null;
  from_user_id?: string | null;
  to_user_id?: string | null;
  created_at?: string | null;
  read_at?: string | null;
  is_read?: boolean | null;
  status?: string | null;
};

type CustomerInsight = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone: string;
  nameSource: string;
  emailSource: string;
  photoSource: string;
  locationSource: string;
  source: string;
  campaign: string;
  bookingCount: number;
  paidBookingCount: number;
  completedBookingCount: number;
  totalSpend: number;
  averageBookingValue: number;
  petCount: number;
  messageCount: number;
  lastBookingDate: string | null;
  firstSeenDate: string | null;
  segment: string;
  signupQuality: "active" | "incomplete" | "needs_review" | "likely_test_spam";
  signupQualityLabel: string;
  adminStatus: string;
  adminStatusLabel: string;
  archivedAt: string | null;
  profileCompletion: number;
  roles?: string[];
  contactMethod?: string;
  missingRequirements?: string[];
  flaggedForReview?: boolean;
  possibleDuplicate?: boolean;
  nextAction?: string;
  lastActivity?: string;
  lastLogin?: string;
  lastLoginAt?: string | null;
  recordSourceLabel?: string;
};


type PetParentRegistrationHealthRow = {
  profile_id: string;
  full_name?: string | null;
  profile_email?: string | null;
  profile_phone?: string | null;
  auth_email?: string | null;
  auth_phone?: string | null;
  auth_avatar_url?: string | null;
  auth_picture?: string | null;
  raw_user_meta_data?: Record<string, unknown> | null;
  role?: string | null;
  admin_status?: string | null;
  admin_notes?: string | null;
  registration_health_status?: string | null;
  profile_created_at?: string | null;
  auth_created_at?: string | null;
  auth_last_sign_in_at?: string | null;
};

type LocationInsight = {
  label: string;
  customers: number;
  bookings: number;
  revenue: number;
};

type SourceInsight = {
  label: string;
  signups: number;
  customers: number;
  bookings: number;
  revenue: number;
};

type CampaignInsight = {
  label: string;
  count: number;
};

type ChartItem = {
  label: string;
  value: number;
  helper?: string;
};

const adminRoutes = {
  dashboard: "/admin",
  bookings: "/admin/bookings",
  customers: "/admin/petparents",
  customerArchive: "/admin/petparents/archive",
  customerIntelligence: "/admin/petparents",
  customerExport: "/admin/petparents/export",
  messages: "/admin/messages",
  petAnalytics: "/admin/pet-analytics",
  users: "/admin/users",
  launchSignups: "/admin/launch-signups",
  referrals: "/admin/referrals",
  partners: "/admin/partners",
};

const socialPlatforms = [
  "Instagram",
  "Facebook",
  "TikTok",
  "YouTube",
  "LinkedIn",
  "X / Twitter",
];

const chartColors = [
  "#166534",
  "#16a34a",
  "#22c55e",
  "#84cc16",
  "#0f766e",
  "#0ea5e9",
];

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getText(row: AnyRow, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }

  return fallback;
}

function getAmount(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = asNumber(row[key]);
    if (value > 0) return value;
  }

  return 0;
}

function getRawDisplayName(row: AnyRow) {
  const firstName = getText(row, ["first_name", "firstName"]);
  const lastName = getText(row, ["last_name", "lastName"]);
  const combinedName = [firstName, lastName].filter(Boolean).join(" ").trim();

  if (combinedName) return combinedName;

  return getText(row, [
    "full_name",
    "display_name",
    "name",
    "customer_name",
    "pet_parent_name",
    "owner_name",
  ]);
}

function isPlaceholderName(value: string) {
  const normalized = value.trim().toLowerCase();

  if (!normalized) return true;

  return [
    "customer",
    "pet parent",
    "petparent",
    "unknown",
    "unknown customer",
    "unknown pet parent",
    "test",
    "demo",
    "fake",
    "sample",
    "asdf",
    "asdasd",
    "n/a",
    "na",
    "none",
  ].includes(normalized);
}

function looksLikeRandomToken(value: string) {
  const compact = value.replace(/[^a-zA-Z0-9]/g, "");

  if (compact.length < 10) return false;
  if (/^[0-9a-f]{16,}$/i.test(compact)) return true;

  const hasLower = /[a-z]/.test(compact);
  const hasUpper = /[A-Z]/.test(compact);
  const hasNumber = /\d/.test(compact);
  const hasVowel = /[aeiou]/i.test(compact);
  const hasSuspiciousCamelMix = hasLower && hasUpper && compact.length >= 12;
  const hasLongConsonantRun = /[bcdfghjklmnpqrstvwxyz]{5,}/i.test(compact);

  return (
    (hasSuspiciousCamelMix && !value.includes(" ")) ||
    (hasNumber && !hasVowel) ||
    hasLongConsonantRun
  );
}

function looksLikeSuspiciousEmail(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) return false;

  const [localPart, domain = ""] = normalized.split("@");
  const localWithoutDots = localPart.replace(/\./g, "");
  const hasManySingleLetterSegments =
    localPart.split(".").filter((part) => part.length === 1).length >= 4;
  const hasDisposableDomain = [
    "example.com",
    "test.com",
    "demo.com",
    "mailinator.com",
    "tempmail.com",
    "10minutemail.com",
  ].includes(domain);

  return (
    hasManySingleLetterSegments ||
    hasDisposableDomain ||
    looksLikeRandomToken(localWithoutDots) ||
    ["test", "demo", "fake", "sample", "asdf", "asdasd"].some((keyword) =>
      normalized.includes(keyword),
    )
  );
}

function isTrustworthyDisplayName(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return false;
  if (trimmed.includes("@")) return false;
  if (isPlaceholderName(trimmed)) return false;
  if (looksLikeRandomToken(trimmed)) return false;

  return /[a-zA-Z]/.test(trimmed);
}

function getAccountDisplayName(row: AnyRow, fallback = "Pet Parent") {
  const rawName = getRawDisplayName(row);
  const accountEmail = getText(row, ["email", "auth_email", "profile_email"]);

  if (rawName && isTrustworthyDisplayName(rawName)) return rawName;
  if (accountEmail && !looksLikeSuspiciousEmail(accountEmail)) return accountEmail;
  if (rawName || accountEmail) return "Signup Review Needed";

  return fallback;
}

function getDisplaySourceLabel(value: string, source: "profile" | "account" | "legacy" | "missing") {
  if (!value) return "Missing";
  if (source === "profile") return "Profile";
  if (source === "account") return "Account";
  if (source === "legacy") return "Fallback / legacy";

  return "Missing";
}

function getAccountEmail(row: AnyRow) {
  return getText(row, ["email", "profile_email", "auth_email"]);
}

function getAccountDisplaySource(row: AnyRow) {
  const rawName = getRawDisplayName(row);

  if (rawName && isTrustworthyDisplayName(rawName)) {
    return getText(row, ["full_name", "display_name", "first_name", "last_name"])
      ? "Profile"
      : "Fallback / legacy";
  }

  return getDisplaySourceLabel(getAccountEmail(row), "account");
}

function getEmailSource(row: AnyRow) {
  const profileEmail = getText(row, ["email", "profile_email"]);
  if (profileEmail) return "Profile";

  const authEmail = getText(row, ["auth_email"]);
  if (authEmail) return "Account";

  const legacyEmail = getText(row, ["customer_email", "pet_parent_email"]);
  if (legacyEmail) return "Fallback / legacy";

  return "Missing";
}

function getPhotoSource(row: AnyRow) {
  if (getText(row, ["avatar_url"])) return "Profile avatar";
  if (getText(row, ["profile_photo_url", "photo_url", "image_url", "picture"])) {
    return "Fallback / legacy photo";
  }
  if (
    getText(row, ["auth_avatar_url", "auth_picture"]) ||
    getAuthMetadataPhoto(row)
  ) {
    return "Account photo";
  }

  return "Missing";
}

function getAuthMetadataPhoto(row: AnyRow | null | undefined) {
  if (!row) return "";

  const metadata = row.raw_user_meta_data;
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return getText(metadata as AnyRow, [
      "avatar_url",
      "picture",
      "photo_url",
      "profile_photo_url",
      "image_url",
    ]);
  }

  return "";
}

function sanitizeCustomerAvatarUrl(value: string) {
  const photoUrl = String(value || "").trim();
  if (!photoUrl) return "";

  const lower = photoUrl.toLowerCase();
  if (
    lower.includes("sitguru-logo") ||
    lower.includes("sitguru-admin-avatar") ||
    lower.includes("sitguru-message-avatar") ||
    lower.includes("avatar-placeholder") ||
    lower.includes("/images/demo/")
  ) {
    return "";
  }

  return photoUrl;
}

function getProfileAvatarUrl(row: AnyRow) {
  return sanitizeCustomerAvatarUrl(
    avatarImageFallback(
      getText(row, [
        "avatar_url",
        "profile_photo_url",
        "photo_url",
        "image_url",
        "picture",
        "auth_avatar_url",
        "auth_picture",
      ]) || getAuthMetadataPhoto(row),
      "",
    ),
  );
}

function getLocationSource(row: AnyRow) {
  if (
    getText(row, [
      "city",
      "service_city",
      "home_city",
      "state",
      "service_state",
      "home_state",
      "zip",
      "zipcode",
      "zip_code",
      "service_zip",
      "service_zip_code",
      "postal_code",
    ])
  ) {
    return "Profile";
  }

  if (
    getText(row, [
      "customer_city",
      "location_city",
      "customer_state",
      "care_city",
      "care_state",
      "customer_zip",
      "customer_zip_code",
      "care_zip_code",
    ])
  ) {
    return "Fallback / legacy";
  }

  return "Missing";
}

function getCustomerSignupQuality(customer: CustomerInsight) {
  const hasActivity =
    customer.bookingCount > 0 ||
    customer.petCount > 0 ||
    customer.messageCount > 0 ||
    customer.totalSpend > 0;
  const hasRealName =
    customer.name !== "Signup Review Needed" && customer.name !== "Pet Parent" && customer.name !== "Customer";
  const hasEmail = Boolean(customer.email);
  const suspiciousEmail = customer.email
    ? looksLikeSuspiciousEmail(customer.email)
    : false;
  const hasLocation = Boolean(customer.city || customer.state || customer.zipCode);

  if (hasActivity) {
    return {
      signupQuality: "active" as const,
      signupQualityLabel: getCustomerSegment(customer),
    };
  }

  if ((!hasRealName || suspiciousEmail) && !hasLocation) {
    return {
      signupQuality: "likely_test_spam" as const,
      signupQualityLabel: "Likely Test / Spam",
    };
  }

  if (!hasEmail || !hasLocation) {
    return {
      signupQuality: "needs_review" as const,
      signupQualityLabel: "Incomplete Signup",
    };
  }

  return {
    signupQuality: "incomplete" as const,
    signupQualityLabel: "Registered",
  };
}

function hasUsableCustomerName(customer: CustomerInsight) {
  return Boolean(
    customer.name &&
      customer.name !== "Signup Review Needed" &&
      customer.name !== "Pet Parent" &&
      customer.name !== "Customer",
  );
}

function hasCustomerLocation(customer: CustomerInsight) {
  return Boolean(customer.city || customer.state || customer.zipCode);
}

function getCustomerProfileCompletion(customer: CustomerInsight) {
  return getPetParentReadiness({
    name: customer.name,
    email: customer.email,
    city: customer.city,
    state: customer.state,
    zipCode: customer.zipCode,
    petCount: customer.petCount,
  }).bookingReadyPercent;
}

function normalizeAdminStatus(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (!normalized) return "active";
  if (["spam", "likely_test_spam", "test_spam", "likely_spam_signup"].includes(normalized)) {
    return "likely_spam";
  }
  if (["incomplete", "partial_signup", "incomplete_pet_parent"].includes(normalized)) {
    return "incomplete_signup";
  }
  if (["review", "needs_admin_review"].includes(normalized)) return "needs_review";
  if (["archive", "archived", "hidden"].includes(normalized)) return "archived";
  if (["deleted", "trash", "permanently_deleted"].includes(normalized)) return "deleted";

  return normalized;
}

function getAdminStatus(row: AnyRow) {
  return normalizeAdminStatus(
    getText(row, [
      "admin_status",
      "customer_admin_status",
      "pet_parent_admin_status",
      "cleanup_status",
      "moderation_status",
    ]),
  );
}

function getArchivedAt(row: AnyRow) {
  return getText(row, ["archived_at", "archive_at", "hidden_at", "deleted_at"]) || null;
}

function isSeparatedAdminStatus(status: string) {
  return ["archived", "likely_spam", "deleted"].includes(
    normalizeAdminStatus(status),
  );
}

function getAdminStatusLabel(status: string) {
  const normalized = normalizeAdminStatus(status);

  if (normalized === "active") return "Active";
  if (normalized === "needs_review") return "Needs Review";
  if (normalized === "incomplete_signup") return "Incomplete Signup";
  if (normalized === "likely_spam") return "Likely Spam";
  if (normalized === "archived") return "Archived";
  if (normalized === "deleted") return "Deleted";

  return normalized
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getSeparatedStatusCounts(rows: ProfileRow[]) {
  return rows.reduce(
    (counts, row) => {
      const status = getAdminStatus(row as AnyRow);

      if (status === "archived") counts.archived += 1;
      if (status === "likely_spam") counts.likelySpam += 1;
      if (status === "incomplete_signup") counts.incompleteSignup += 1;
      if (status === "deleted") counts.deleted += 1;
      if (status === "needs_review") counts.needsReview += 1;

      return counts;
    },
    {
      archived: 0,
      likelySpam: 0,
      incompleteSignup: 0,
      deleted: 0,
      needsReview: 0,
    },
  );
}

function getRole(row: AnyRow) {
  return getText(row, ["role", "user_role", "account_type", "type"]).toLowerCase();
}

function isCustomerProfile(profile: ProfileRow) {
  const role = getRole(profile as AnyRow);
  if (["guru", "admin", "ambassador"].includes(role)) return false;
  return [
    "customer",
    "pet_parent",
    "pet-parent",
    "pet parent",
    "parent",
    "client",
    "both",
  ].includes(role);
}

function hasUsableCustomerEmail(value: string) {
  return Boolean(value) && value !== "—" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hasUsableCustomerPhone(value: string) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length >= 10 && !/^0+$/.test(digits) && !value.includes("XXX");
}

function getCustomerContactMethod(email: string, phone: string) {
  const emailReady = hasUsableCustomerEmail(email);
  const phoneReady = hasUsableCustomerPhone(phone);

  if (emailReady && phoneReady) return "Email + phone";
  if (phoneReady) return "Phone only";
  if (emailReady) return "Email only";
  return "No usable contact";
}

function normalizeCustomerDuplicateText(value: unknown) {
  return asString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const genericCustomerDuplicateNames = new Set([
  "customer",
  "pet parent",
  "member",
  "user",
  "sitguru",
  "sitguru member",
  "test",
  "demo",
  "unknown",
  "signup review needed",
]);

function isStrongCustomerDuplicateName(name: string) {
  const normalized = normalizeCustomerDuplicateText(name);
  if (!normalized || genericCustomerDuplicateNames.has(normalized)) return false;
  if (normalized.startsWith("sitguru ")) return false;

  const parts = normalized.split(" ").filter(Boolean);
  return parts.length >= 2 && parts.every((part) => part.length >= 2);
}

function getNormalizedCustomerDuplicateKeys(
  name: string,
  email: string,
  phone: string,
) {
  const keys: string[] = [];
  const normalizedEmail = email.toLowerCase();
  const normalizedPhone = phone.replace(/\D/g, "");

  if (hasUsableCustomerEmail(email)) keys.push(`email:${normalizedEmail}`);
  if (hasUsableCustomerPhone(phone)) keys.push(`phone:${normalizedPhone}`);
  if (isStrongCustomerDuplicateName(name) && !skipNameOnlyDuplicateMatch(email)) {
    keys.push(`name:${normalizeCustomerDuplicateText(name)}`);
  }

  return keys;
}

function describeCustomerDuplicateMatch(keys: string[]) {
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

function getCustomerRoleBadges({
  role,
  hasGuruWorkspace,
  email,
}: {
  role: string;
  hasGuruWorkspace: boolean;
  email?: string;
}) {
  const roles = new Set<string>(["Pet Parent"]);
  const normalized = role.toLowerCase().replace(/[\s-]+/g, "_");

  if (
    hasGuruWorkspace ||
    ["guru", "sitter", "both", "guru_and_pet_parent", "dual"].includes(normalized)
  ) {
    roles.add("Guru");
  }

  if (
    ["ambassador", "partner", "community_ambassador"].includes(normalized) ||
    normalized.includes("ambassador")
  ) {
    roles.add("Ambassador");
  }

  if (isHardcodedSuperUserEmail(email)) {
    roles.add("Super Admin");
  }
  if (isFounderPersonalMarketplaceEmail(email)) {
    roles.add("Ambassador");
  }

  return Array.from(roles);
}

function getCustomerMissingRequirements(customer: CustomerInsight) {
  const missing: string[] = [];

  if (!hasUsableCustomerName(customer)) missing.push("Full name");
  if (!hasUsableCustomerEmail(customer.email)) missing.push("Email");
  if (!hasCustomerLocation(customer)) missing.push("Location");
  if (customer.petCount <= 0) missing.push("Pet profile");

  return missing;
}

function formatCustomerActivityDate(value?: string | null) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

function getCustomerNextAction(customer: CustomerInsight) {
  if (customer.possibleDuplicate) {
    return customer.nextAction || "Review possible duplicate accounts";
  }

  const status = `${customer.signupQualityLabel || ""} ${customer.segment || ""}`.toLowerCase();
  const completion = customer.profileCompletion || 0;

  if (
    customer.signupQuality === "likely_test_spam" ||
    status.includes("spam") ||
    status.includes("test")
  ) {
    return "Review for archive / cleanup";
  }
  if (
    customer.flaggedForReview ||
    customer.signupQuality === "needs_review" ||
    status.includes("needs")
  ) {
    return "Complete profile details";
  }
  if (customer.petCount === 0) return "Ask for pet profile setup";
  if (completion < 100) return "Add ZIP or name to finish booking-ready setup";
  if (customer.bookingCount === 0) return "Encourage first booking";
  if (customer.paidBookingCount === 0) return "Review unpaid booking activity";
  return "Open Pet Parent review";
}

function getRowBoolean(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "boolean") return value;

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "yes", "1"].includes(normalized)) return true;
    }
  }

  return false;
}

function getRowSearchText(row: AnyRow, keys: string[]) {
  return keys
    .map((key) => asString(row[key]))
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function hasDemoKeyword(value: string) {
  const normalized = value.toLowerCase();

  return [
    "demo",
    "fake",
    "test",
    "sample",
    "sandbox",
    "dummy",
    "placeholder",
    "delete",
    "remove",
  ].some((keyword) => normalized.includes(keyword));
}

function isDemoEmail(value: string) {
  const normalized = value.toLowerCase();

  return (
    hasDemoKeyword(normalized) ||
    normalized.endsWith("@example.com") ||
    normalized.endsWith("@test.com") ||
    normalized.endsWith("@demo.com") ||
    normalized.includes("+test") ||
    normalized.includes("+demo") ||
    normalized.includes("+fake")
  );
}

function isDemoLikeRow(row: AnyRow) {
  const explicitDemo =
    getRowBoolean(row, [
      "is_demo",
      "demo",
      "is_test",
      "test",
      "is_sample",
      "sample",
      "sandbox",
      "archived",
      "is_archived",
      "deleted",
      "is_deleted",
    ]) ||
    ["demo", "test", "sample", "sandbox", "archived", "deleted"].includes(
      getText(row, ["status", "record_status", "visibility"]).toLowerCase(),
    );

  if (explicitDemo) return true;

  const email = getText(row, [
    "email",
    "customer_email",
    "pet_parent_email",
    "owner_email",
    "referred_email",
  ]);

  if (email && isDemoEmail(email)) return true;

  const searchText = getRowSearchText(row, [
    "full_name",
    "display_name",
    "name",
    "customer_name",
    "pet_parent_name",
    "owner_name",
    "pet_name",
    "campaign",
    "campaign_name",
    "source",
    "signup_source",
    "referral_source",
    "lead_source",
    "acquisition_source",
    "notes",
    "internal_notes",
  ]);

  return hasDemoKeyword(searchText);
}

function hasHiddenCustomerReference(row: AnyRow, hiddenCustomerIds: Set<string>) {
  const possibleIds = [
    "customer_id",
    "pet_owner_id",
    "owner_id",
    "client_id",
    "user_id",
    "profile_id",
    "pet_parent_id",
    "sender_id",
    "recipient_id",
    "from_user_id",
    "to_user_id",
  ]
    .map((key) => asString(row[key]))
    .filter(Boolean);

  return possibleIds.some((id) => hiddenCustomerIds.has(id));
}

function getCustomerId(booking: BookingRow) {
  return (
    booking.customer_id ||
    booking.pet_owner_id ||
    booking.client_id ||
    booking.user_id ||
    ""
  );
}

function getPetOwnerId(pet: PetRow) {
  return pet.owner_id || pet.customer_id || pet.pet_parent_id || pet.user_id || "";
}

function getBookingDate(booking: BookingRow) {
  return (
    booking.booking_date ||
    booking.start_time ||
    booking.created_at ||
    booking.updated_at ||
    null
  );
}

function getBookingAmount(booking: BookingRow) {
  return getAmount(booking as AnyRow, [
    "total_amount",
    "grand_total",
    "service_total",
    "subtotal",
    "amount",
    "price",
  ]);
}

function getBookingStatus(booking: BookingRow) {
  return getText(booking as AnyRow, ["status", "booking_status"]).toLowerCase();
}

function getPaymentStatus(booking: BookingRow) {
  return getText(booking as AnyRow, ["payment_status"]).toLowerCase();
}

function isPaidBooking(booking: BookingRow) {
  const status = getPaymentStatus(booking);

  return ["paid", "succeeded", "complete", "completed", "captured"].includes(
    status,
  );
}

function isCompletedBooking(booking: BookingRow) {
  const status = getBookingStatus(booking);

  return ["completed", "complete", "finished", "closed"].includes(status);
}

function isUnreadMessage(message: MessageRow) {
  if (typeof message.is_read === "boolean") return !message.is_read;
  if (message.read_at) return false;

  const status = getText(message as AnyRow, ["status"]).toLowerCase();

  return status === "unread" || status === "new";
}

function getMessageParticipantIds(message: MessageRow) {
  return [
    message.customer_id,
    message.user_id,
    message.sender_id,
    message.recipient_id,
    message.from_user_id,
    message.to_user_id,
  ].filter(Boolean) as string[];
}

function isWithinLastDays(value: string | null, days: number) {
  if (!value) return false;

  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) return false;

  return Date.now() - timestamp <= days * 24 * 60 * 60 * 1000;
}

function getMostRecentDate(values: Array<string | null>) {
  const validDates = values
    .filter(Boolean)
    .map((value) => new Date(value as string))
    .filter((date) => Number.isFinite(date.getTime()));

  if (!validDates.length) return null;

  return validDates.sort((a, b) => b.getTime() - a.getTime())[0].toISOString();
}

function getOldestDate(values: Array<string | null>) {
  const validDates = values
    .filter(Boolean)
    .map((value) => new Date(value as string))
    .filter((date) => Number.isFinite(date.getTime()));

  if (!validDates.length) return null;

  return validDates.sort((a, b) => a.getTime() - b.getTime())[0].toISOString();
}

function getCustomerSegment(customer: CustomerInsight) {
  if (customer.totalSpend >= 1000 || customer.bookingCount >= 8) return "VIP";
  if (customer.bookingCount >= 3) return "Repeat";
  if (customer.bookingCount >= 1) return "New";

  return "Lead";
}

function getCity(row: AnyRow) {
  return getText(row, [
    "city",
    "service_city",
    "home_city",
    "customer_city",
    "location_city",
    "care_city",
  ]);
}

function getState(row: AnyRow) {
  return getText(row, [
    "state",
    "State",
    "state_code",
    "service_state",
    "home_state",
    "customer_state",
    "care_state",
  ]);
}

function getCountry(row: AnyRow) {
  return getText(row, ["country", "customer_country"], "US");
}

function getZipCode(row: AnyRow) {
  return getText(row, [
    "zip",
    "zipcode",
    "zip_code",
    "service_zip",
    "service_zip_code",
    "postal_code",
    "customer_zip",
    "customer_zip_code",
    "care_zip_code",
  ]);
}

function getSource(row: AnyRow) {
  return getText(row, [
    "source",
    "signup_source",
    "referral_source",
    "lead_source",
    "acquisition_source",
    "utm_source",
    "platform",
  ]);
}

function getCampaign(row: AnyRow) {
  return getText(row, [
    "campaign",
    "campaign_name",
    "utm_campaign",
    "ad_campaign",
    "partner_campaign",
  ]);
}

function normalizeSource(value: string) {
  const normalized = value.trim();

  if (!normalized) return "Direct";

  const lower = normalized.toLowerCase();

  if (lower.includes("facebook") || lower === "fb") return "Facebook";
  if (lower.includes("instagram") || lower === "ig") return "Instagram";
  if (lower.includes("tiktok")) return "TikTok";
  if (lower.includes("youtube")) return "YouTube";
  if (lower.includes("linkedin")) return "LinkedIn";
  if (lower.includes("twitter") || lower === "x") return "X / Twitter";
  if (lower.includes("google")) return "Google";
  if (lower.includes("ambassador")) return "Ambassador";
  if (lower.includes("referral")) return "Referral";
  if (lower.includes("partner")) return "Partner";
  if (lower.includes("nextdoor")) return "Nextdoor";
  if (lower.includes("email")) return "Email";
  if (lower.includes("organic")) return "Organic";

  return normalized;
}

function isSocialSource(value: string) {
  const normalized = value.toLowerCase();

  return socialPlatforms.some((platform) =>
    normalized.includes(platform.toLowerCase().split(" ")[0]),
  );
}

function buildLocationInsights(
  customers: CustomerInsight[],
  key: "zipCode" | "city" | "state" | "country",
): LocationInsight[] {
  const map = new Map<string, LocationInsight>();

  for (const customer of customers) {
    const label = customer[key] || "Unknown";

    const existing =
      map.get(label) ||
      ({
        label,
        customers: 0,
        bookings: 0,
        revenue: 0,
      } satisfies LocationInsight);

    existing.customers += 1;
    existing.bookings += customer.bookingCount;
    existing.revenue += customer.totalSpend;

    map.set(label, existing);
  }

  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue || b.customers - a.customers)
    .slice(0, 8);
}

function buildSourceInsights(
  customers: CustomerInsight[],
  signupRows: AnyRow[],
  conversionRows: AnyRow[],
): SourceInsight[] {
  const map = new Map<string, SourceInsight>();

  function ensure(label: string) {
    const normalized = normalizeSource(label);

    if (!map.has(normalized)) {
      map.set(normalized, {
        label: normalized,
        signups: 0,
        customers: 0,
        bookings: 0,
        revenue: 0,
      });
    }

    return map.get(normalized) as SourceInsight;
  }

  for (const row of signupRows) {
    ensure(getSource(row)).signups += 1;
  }

  for (const row of conversionRows) {
    ensure(getSource(row)).signups += 1;
  }

  for (const customer of customers) {
    const source = ensure(customer.source);
    source.customers += 1;
    source.bookings += customer.bookingCount;
    source.revenue += customer.totalSpend;
  }

  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue || b.customers - a.customers)
    .slice(0, 10);
}

function buildCampaignInsights(rows: AnyRow[]) {
  const map = new Map<string, CampaignInsight>();

  for (const row of rows) {
    const label = getCampaign(row) || "Unassigned";

    const existing =
      map.get(label) ||
      ({
        label,
        count: 0,
      } satisfies CampaignInsight);

    existing.count += 1;
    map.set(label, existing);
  }

  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function toChartItemsFromLocations(rows: LocationInsight[]) {
  return rows.map((row) => ({
    label: row.label,
    value: row.revenue,
    helper: `${number(row.customers)} Pet Parents · ${number(row.bookings)} bookings`,
  }));
}

function toChartItemsFromSources(rows: SourceInsight[]) {
  return rows.map((row) => ({
    label: row.label,
    value: row.revenue,
    helper: `${number(row.customers)} Pet Parents · ${number(row.signups)} signups`,
  }));
}

async function safeAdminQuery(
  query: PromiseLike<SafeAdminQueryResponse>,
  label: string,
): Promise<SafeAdminQueryResponse> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(
        `Admin customer intelligence query skipped for ${label}:`,
        result.error,
      );
      return { data: [], error: null };
    }

    return result;
  } catch (error) {
    console.warn(
      `Admin customer intelligence query skipped for ${label}:`,
      error,
    );
    return { data: [], error: null };
  }
}


function normalizeRegistrationHealthStatus(value: unknown) {
  return asString(value).toLowerCase().replace(/[\s-]+/g, "_");
}

function isCleanupPetParentHealth(row: PetParentRegistrationHealthRow | undefined) {
  const status = normalizeRegistrationHealthStatus(row?.registration_health_status);

  return status === "archived" || status === "likely_test_or_spam";
}

function mapRegistrationHealthToSignupQuality(
  row: PetParentRegistrationHealthRow | undefined,
): CustomerInsight["signupQuality"] | null {
  const status = normalizeRegistrationHealthStatus(row?.registration_health_status);

  if (!status) return null;
  if (status === "active_pet_parent") return "active";
  if (status === "phone_only_incomplete_signup") return "needs_review";
  if (status === "registered_pet_parent_needs_profile") return "needs_review";
  if (status === "incomplete_signup") return "needs_review";
  if (status === "signup_log_without_auth") return "needs_review";
  if (status === "likely_test_or_spam") return "likely_test_spam";
  if (status === "archived") return "likely_test_spam";

  return "needs_review";
}

function getRegistrationHealthLabel(row: PetParentRegistrationHealthRow | undefined) {
  const status = normalizeRegistrationHealthStatus(row?.registration_health_status);

  if (status === "active_pet_parent") return "Active Pet Parent";
  if (status === "phone_only_incomplete_signup") return "Missing Profile Info";
  if (status === "registered_pet_parent_needs_profile") return "Needs Profile Info";
  if (status === "incomplete_signup") return "Incomplete Signup";
  if (status === "signup_log_without_auth") return "Signup / No Auth";
  if (status === "likely_test_or_spam") return "Likely Test / Spam";
  if (status === "archived") return "Archived";

  return "";
}

function getReviewSignupQualityLabel(
  customer: CustomerInsight,
  healthLabel: string,
  fallbackLabel: string,
) {
  if (customer.signupQuality === "active") return fallbackLabel;
  if (customer.signupQuality === "likely_test_spam") return fallbackLabel;

  const hasProfileName = hasUsableCustomerName(customer);
  const hasEmail = Boolean(customer.email);
  const hasPhone = Boolean(customer.phone);
  const hasLocation = hasCustomerLocation(customer);

  if (healthLabel === "Needs Profile Info") return "Needs Profile Info";
  if (healthLabel === "Missing Profile Info") return "Needs Profile Info";
  if (!hasProfileName || !hasEmail) return "Incomplete Signup";
  if (!hasLocation) return "Missing Location";
  if (!hasPhone) return "Missing Phone";

  return fallbackLabel || "Needs Review";
}

function mapRegistrationHealthToAdminStatus(row: PetParentRegistrationHealthRow | undefined) {
  const status = normalizeRegistrationHealthStatus(row?.registration_health_status);

  if (status === "active_pet_parent") return "active";
  if (status === "archived") return "archived";
  if (status === "likely_test_or_spam") return "likely_spam";
  if (
    status === "phone_only_incomplete_signup" ||
    status === "registered_pet_parent_needs_profile" ||
    status === "incomplete_signup"
  ) {
    return "incomplete_signup";
  }
  if (status === "signup_log_without_auth") return "needs_review";

  return "";
}


async function getAllAuthUsers() {
  const users: { id: string; last_sign_in_at?: string | null }[] = [];
  let page = 1;

  try {
    while (page <= 10) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 1000,
      });

      if (error) {
        console.warn(
          "Admin customer intelligence auth-user query skipped:",
          error,
        );
        break;
      }

      const pageUsers = Array.isArray(data?.users) ? data.users : [];
      users.push(
        ...pageUsers.map((user) => ({
          id: user.id,
          last_sign_in_at: user.last_sign_in_at || null,
        })),
      );
      if (pageUsers.length < 1000) break;
      page += 1;
    }
  } catch (error) {
    console.warn(
      "Admin customer intelligence auth-user query skipped:",
      error,
    );
  }

  return users;
}

async function getCustomerIntelligenceData() {
  const [
    profilesResult,
    bookingsResult,
    petsResult,
    messagesResult,
    launchSignupsResult,
    launchWaitlistResult,
    referralClicksResult,
    referralConversionsResult,
    networkClicksResult,
    partnerCampaignsResult,
    registrationHealthResult,
    gurusResult,
    authUsers,
  ] = await Promise.all([
    safeAdminQuery(
      supabaseAdmin
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "profiles",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "bookings",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("pets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "pets",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "messages",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("launch_signups")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "launch_signups",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("launch_waitlist")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "launch_waitlist",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("referral_clicks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "referral_clicks",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("referral_conversions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "referral_conversions",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("network_click_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "network_click_events",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("partner_campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "partner_campaigns",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("admin_pet_parent_registration_health")
        .select("*")
        .order("profile_created_at", { ascending: false })
        .limit(1000),
      "admin_pet_parent_registration_health",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("gurus")
        .select(
          "user_id, profile_id, city, state, service_city, service_state, zip_code, service_zip, service_zip_code, postal_code",
        )
        .order("created_at", { ascending: false })
        .limit(2000),
      "gurus",
    ),
    getAllAuthUsers(),
  ]);

  const rawProfiles = ((profilesResult.data || []) as ProfileRow[]).filter(Boolean);
  const rawBookings = ((bookingsResult.data || []) as BookingRow[]).filter(Boolean);
  const rawPets = ((petsResult.data || []) as PetRow[]).filter(Boolean);
  const rawMessages = ((messagesResult.data || []) as MessageRow[]).filter(Boolean);
  const rawLaunchSignups = ((launchSignupsResult.data || []) as AnyRow[]).filter(Boolean);
  const rawLaunchWaitlist = ((launchWaitlistResult.data || []) as AnyRow[]).filter(Boolean);
  const rawReferralClicks = ((referralClicksResult.data || []) as AnyRow[]).filter(Boolean);
  const rawReferralConversions = ((referralConversionsResult.data || []) as AnyRow[]).filter(Boolean);
  const rawGurus = ((gurusResult.data || []) as AnyRow[]).filter(Boolean);
  const guruLocationByUserId = new Map<string, AnyRow>();
  for (const guru of rawGurus) {
    const keys = [
      asString(guru.user_id),
      asString(guru.profile_id),
    ].filter(Boolean);
    for (const key of keys) {
      if (!guruLocationByUserId.has(key)) {
        guruLocationByUserId.set(key, guru);
      }
    }
  }
  const rawNetworkClicks = ((networkClicksResult.data || []) as AnyRow[]).filter(Boolean);
  const rawPartnerCampaigns = ((partnerCampaignsResult.data || []) as AnyRow[]).filter(Boolean);
  const rawRegistrationHealth = (
    (registrationHealthResult.data || []) as PetParentRegistrationHealthRow[]
  ).filter(Boolean);

  const authLastSignInByUserId = new Map(
    authUsers
      .filter((user) => Boolean(user.id && user.last_sign_in_at))
      .map((user) => [user.id, user.last_sign_in_at || null] as const),
  );
  const registrationHealthByProfileId = new Map(
    rawRegistrationHealth
      .map((row) => [String(row.profile_id || ""), row] as const)
      .filter(([profileId]) => Boolean(profileId)),
  );
  const healthExcludedCustomerIds = new Set(
    rawRegistrationHealth
      .filter((row) => isCleanupPetParentHealth(row))
      .map((row) => row.profile_id)
      .filter(Boolean),
  );
  const hiddenCustomerIds = new Set(
    rawProfiles
      .filter((profile) => isDemoLikeRow(profile as AnyRow))
      .map((profile) => profile.id)
      .filter(Boolean),
  );

  const separatedStatusCounts = getSeparatedStatusCounts(rawProfiles);

  const separatedCustomerIds = new Set(
    rawProfiles
      .filter((profile) => isSeparatedAdminStatus(getAdminStatus(profile as AnyRow)))
      .map((profile) => profile.id)
      .filter(Boolean),
  );

  const excludedCustomerIds = new Set([
    ...Array.from(hiddenCustomerIds),
    ...Array.from(separatedCustomerIds),
    ...Array.from(healthExcludedCustomerIds),
  ]);

  const profiles = rawProfiles.filter((profile) => {
    return (
      isCustomerProfile(profile) &&
      !isDemoLikeRow(profile as AnyRow) &&
      !hiddenCustomerIds.has(profile.id) &&
      !separatedCustomerIds.has(profile.id) &&
      !healthExcludedCustomerIds.has(profile.id)
    );
  });
  const bookings = rawBookings.filter(
    (booking) =>
      !isDemoLikeRow(booking as AnyRow) &&
      !hasHiddenCustomerReference(booking as AnyRow, excludedCustomerIds),
  );
  const pets = rawPets.filter(
    (pet) =>
      !isDemoLikeRow(pet as AnyRow) &&
      !hasHiddenCustomerReference(pet as AnyRow, excludedCustomerIds),
  );
  const messages = rawMessages.filter(
    (message) =>
      !isDemoLikeRow(message as AnyRow) &&
      !hasHiddenCustomerReference(message as AnyRow, excludedCustomerIds),
  );
  const launchSignups = rawLaunchSignups.filter((row) => !isDemoLikeRow(row));
  const launchWaitlist = rawLaunchWaitlist.filter((row) => !isDemoLikeRow(row));
  const referralClicks = rawReferralClicks.filter((row) => !isDemoLikeRow(row));
  const referralConversions = rawReferralConversions.filter(
    (row) => !isDemoLikeRow(row),
  );
  const networkClicks = rawNetworkClicks.filter((row) => !isDemoLikeRow(row));
  const partnerCampaigns = rawPartnerCampaigns.filter(
    (row) => !isDemoLikeRow(row),
  );

  const hiddenDemoRows =
    rawProfiles.length -
    profiles.length +
    rawBookings.length -
    bookings.length +
    rawPets.length -
    pets.length +
    rawMessages.length -
    messages.length +
    rawLaunchSignups.length -
    launchSignups.length +
    rawLaunchWaitlist.length -
    launchWaitlist.length +
    rawReferralClicks.length -
    referralClicks.length +
    rawReferralConversions.length -
    referralConversions.length +
    rawNetworkClicks.length -
    networkClicks.length +
    rawPartnerCampaigns.length -
    partnerCampaigns.length;

  const separatedAdminRows =
    separatedStatusCounts.archived +
    separatedStatusCounts.likelySpam +
    separatedStatusCounts.deleted +
    healthExcludedCustomerIds.size;

  const signupRows = [...launchSignups, ...launchWaitlist];
  const clickRows = [...referralClicks, ...networkClicks];
  const conversionRows = referralConversions;
  const campaignRows = [...signupRows, ...clickRows, ...conversionRows, ...partnerCampaigns];

  const customerMap = new Map<string, CustomerInsight>();
  const profileRoleById = new Map<string, string>();

  for (const profile of profiles) {
    if (!profile.id) continue;

    const source = normalizeSource(getSource(profile as AnyRow));
    const health = registrationHealthByProfileId.get(profile.id);
    const guruLocation = guruLocationByUserId.get(profile.id);
    const profileRole = getRole(profile as AnyRow) || asString(health?.role).toLowerCase();
    profileRoleById.set(profile.id, profileRole);
    const displayRow = {
      ...(profile as AnyRow),
      profile_email: asString(health?.profile_email),
      auth_email: asString(health?.auth_email),
    };

    const profileCity = getCity(profile as AnyRow);
    const profileState = getState(profile as AnyRow);
    const profileZip = getZipCode(profile as AnyRow);
    const sharedCity = profileCity || (guruLocation ? getCity(guruLocation) : "");
    const sharedState = profileState || (guruLocation ? getState(guruLocation) : "");
    const sharedZip = profileZip || (guruLocation ? getZipCode(guruLocation) : "");
    const usedGuruLocationFallback = Boolean(
      guruLocation &&
        ((!profileCity && sharedCity) ||
          (!profileState && sharedState) ||
          (!profileZip && sharedZip)),
    );
    const phone = getText(displayRow, [
      "phone",
      "phone_number",
      "profile_phone",
      "auth_phone",
    ]);
    const email = getAccountEmail(displayRow);
    const roles = getCustomerRoleBadges({
      role: profileRole,
      hasGuruWorkspace: guruLocationByUserId.has(profile.id),
      email,
    });

    customerMap.set(profile.id, {
      id: profile.id,
      name: getAccountDisplayName(displayRow, "Pet Parent"),
      email,
      phone,
      avatarUrl: getProfileAvatarUrl({
        ...(profile as AnyRow),
        auth_avatar_url: asString(health?.auth_avatar_url),
        auth_picture: asString(health?.auth_picture),
        raw_user_meta_data: health?.raw_user_meta_data || null,
      }),
      city: sharedCity,
      state: sharedState,
      country: getCountry(profile as AnyRow),
      zipCode: sharedZip,
      nameSource: getAccountDisplaySource(displayRow),
      emailSource: getEmailSource(displayRow),
      photoSource: getPhotoSource({
        ...(profile as AnyRow),
        auth_avatar_url: asString(health?.auth_avatar_url),
        auth_picture: asString(health?.auth_picture),
        raw_user_meta_data: health?.raw_user_meta_data || null,
      }),
      locationSource: usedGuruLocationFallback
        ? "Shared Guru workspace"
        : getLocationSource(profile as AnyRow),
      source,
      campaign: getCampaign(profile as AnyRow),
      bookingCount: 0,
      paidBookingCount: 0,
      completedBookingCount: 0,
      totalSpend: 0,
      averageBookingValue: 0,
      petCount: 0,
      messageCount: 0,
      lastBookingDate: null,
      firstSeenDate: profile.created_at || profile.updated_at || null,
      segment: "Lead",
      signupQuality: "incomplete",
      signupQualityLabel: "Registered",
      adminStatus:
        mapRegistrationHealthToAdminStatus(health) || getAdminStatus(profile as AnyRow),
      adminStatusLabel: getAdminStatusLabel(
        mapRegistrationHealthToAdminStatus(health) || getAdminStatus(profile as AnyRow),
      ),
      archivedAt: getArchivedAt(profile as AnyRow),
      profileCompletion: 0,
      roles,
      contactMethod: getCustomerContactMethod(email, phone),
      recordSourceLabel: source,
      lastLoginAt:
        authLastSignInByUserId.get(profile.id) ||
        health?.auth_last_sign_in_at ||
        null,
    });
  }

  for (const booking of bookings) {
    const customerId = getCustomerId(booking);
    const fallbackId =
      customerId ||
      booking.customer_email ||
      booking.customer_name ||
      booking.pet_parent_name ||
      booking.owner_name ||
      booking.id;

    if (!fallbackId) continue;

    const bookingSource = normalizeSource(getSource(booking as AnyRow));

    const bookingEmail = booking.customer_email || "";
    const bookingPhone = getText(booking as AnyRow, ["phone", "phone_number"]);
    const existing =
      customerMap.get(fallbackId) ||
      {
        id: fallbackId,
        name: getAccountDisplayName(booking as AnyRow, "Pet Parent"),
        email: bookingEmail,
        phone: bookingPhone,
        avatarUrl: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
        nameSource: getAccountDisplaySource(booking as AnyRow),
        emailSource: getEmailSource(booking as AnyRow),
        photoSource: "Missing",
        locationSource: getLocationSource(booking as AnyRow),
        source: bookingSource,
        campaign: getCampaign(booking as AnyRow),
        bookingCount: 0,
        paidBookingCount: 0,
        completedBookingCount: 0,
        totalSpend: 0,
        averageBookingValue: 0,
        petCount: 0,
        messageCount: 0,
        lastBookingDate: null,
        firstSeenDate: booking.created_at || booking.updated_at || null,
        segment: "Lead",
        signupQuality: "incomplete",
        signupQualityLabel: "Registered",
        adminStatus: "active",
        adminStatusLabel: "Active",
        archivedAt: null,
        profileCompletion: 0,
        roles: ["Pet Parent"],
        contactMethod: getCustomerContactMethod(bookingEmail, bookingPhone),
        recordSourceLabel: bookingSource,
        lastLoginAt: null,
      };

    const bookingDate = getBookingDate(booking);

    if (!existing.city && getCity(booking as AnyRow)) {
      existing.city = getCity(booking as AnyRow);
      existing.locationSource = "Fallback / legacy";
    }
    if (!existing.state && getState(booking as AnyRow)) {
      existing.state = getState(booking as AnyRow);
      existing.locationSource = "Fallback / legacy";
    }
    existing.country = existing.country || getCountry(booking as AnyRow);
    if (!existing.zipCode && getZipCode(booking as AnyRow)) {
      existing.zipCode = getZipCode(booking as AnyRow);
      existing.locationSource = "Fallback / legacy";
    }
    existing.source =
      existing.source && existing.source !== "Direct"
        ? existing.source
        : bookingSource;
    existing.campaign = existing.campaign || getCampaign(booking as AnyRow);
    existing.bookingCount += 1;
    existing.totalSpend += getBookingAmount(booking);
    existing.paidBookingCount += isPaidBooking(booking) ? 1 : 0;
    existing.completedBookingCount += isCompletedBooking(booking) ? 1 : 0;
    existing.lastBookingDate = getMostRecentDate([
      existing.lastBookingDate,
      bookingDate,
    ]);
    existing.firstSeenDate = getOldestDate([
      existing.firstSeenDate,
      booking.created_at || null,
      bookingDate,
    ]);

    customerMap.set(fallbackId, existing);
  }

  const petOwnerCountMap = new Map<string, number>();

  for (const pet of pets) {
    const ownerId = getPetOwnerId(pet);
    if (!ownerId) continue;

    petOwnerCountMap.set(ownerId, (petOwnerCountMap.get(ownerId) || 0) + 1);
  }

  for (const [customerId, petCount] of petOwnerCountMap.entries()) {
    const existing = customerMap.get(customerId);
    if (existing) existing.petCount = petCount;
  }

  const messageCountMap = new Map<string, number>();

  for (const message of messages) {
    for (const participantId of getMessageParticipantIds(message)) {
      messageCountMap.set(
        participantId,
        (messageCountMap.get(participantId) || 0) + 1,
      );
    }
  }

  for (const [customerId, messageCount] of messageCountMap.entries()) {
    const existing = customerMap.get(customerId);
    if (existing) existing.messageCount = messageCount;
  }

  const customers = await Promise.all(
    Array.from(customerMap.values()).map(async (customer) => {
      const averageBookingValue =
        customer.bookingCount > 0 ? customer.totalSpend / customer.bookingCount : 0;

      let city = customer.city;
      let state = customer.state;
      let zipCode = customer.zipCode;
      let locationSource = customer.locationSource;

      if ((!city || !state) && zipCode) {
        const resolved = await resolveLocationParts({
          city,
          state,
          zip: zipCode,
        });

        if (resolved.city || resolved.state) {
          city = city || resolved.city;
          state = state || resolved.state;
          zipCode = zipCode || resolved.zip;
          if (resolved.resolvedFromZip) {
            locationSource = "ZIP lookup";
          }
        }
      }

      const enriched = {
        ...customer,
        city,
        state,
        zipCode,
        locationSource,
        averageBookingValue,
      };

      const segment = getCustomerSegment(enriched);
      const registrationHealth = registrationHealthByProfileId.get(customer.id);
      const healthSignupQuality = mapRegistrationHealthToSignupQuality(registrationHealth);
      const healthLabel = getRegistrationHealthLabel(registrationHealth);
      const calculatedSignupQuality = getCustomerSignupQuality({
        ...enriched,
        segment,
        signupQuality: "incomplete",
        signupQualityLabel: "Registered",
        profileCompletion: 0,
      });
      const signupQuality = healthSignupQuality
        ? {
            signupQuality: healthSignupQuality,
            signupQualityLabel: getReviewSignupQualityLabel(
              enriched,
              healthLabel,
              healthLabel || calculatedSignupQuality.signupQualityLabel,
            ),
          }
        : calculatedSignupQuality;

      const profileCompletion = getCustomerProfileCompletion({
        ...enriched,
        segment,
        ...signupQuality,
        profileCompletion: 0,
      });

      const roles =
        enriched.roles?.length
          ? enriched.roles
          : getCustomerRoleBadges({
              role: profileRoleById.get(customer.id) || "",
              hasGuruWorkspace: guruLocationByUserId.has(customer.id),
              email: customer.email,
            });
      const contactMethod =
        enriched.contactMethod ||
        getCustomerContactMethod(enriched.email, enriched.phone);
      const flaggedForReview =
        signupQuality.signupQuality === "likely_test_spam" ||
        signupQuality.signupQuality === "needs_review" ||
        ["needs_review", "incomplete_signup", "likely_spam"].includes(
          enriched.adminStatus,
        );

      return {
        ...enriched,
        segment,
        ...signupQuality,
        profileCompletion,
        roles,
        contactMethod,
        flaggedForReview,
        recordSourceLabel: enriched.recordSourceLabel || enriched.source || "Direct",
      };
    }),
  );

  const duplicateCounts = new Map<string, number>();
  for (const customer of customers) {
    for (const key of getNormalizedCustomerDuplicateKeys(
      customer.name,
      customer.email,
      customer.phone,
    )) {
      duplicateCounts.set(key, (duplicateCounts.get(key) || 0) + 1);
    }
  }

  const enrichedCustomers = customers.map((customer) => {
    const duplicateKeys = getNormalizedCustomerDuplicateKeys(
      customer.name,
      customer.email,
      customer.phone,
    );
    const matchedDuplicateKeys = duplicateKeys.filter(
      (key) => (duplicateCounts.get(key) || 0) > 1,
    );
    const possibleDuplicate = matchedDuplicateKeys.length > 0;
    const missingRequirements = getCustomerMissingRequirements(customer);
    const lastActivity = formatCustomerActivityDate(
      customer.lastBookingDate || customer.firstSeenDate,
    );
    const lastLogin = formatCustomerActivityDate(customer.lastLoginAt);
    const withDuplicate = {
      ...customer,
      possibleDuplicate,
      flaggedForReview: Boolean(customer.flaggedForReview) || possibleDuplicate,
      missingRequirements,
      lastActivity,
      lastLogin,
      nextAction: possibleDuplicate
        ? describeCustomerDuplicateMatch(matchedDuplicateKeys)
        : undefined,
    };

    return {
      ...withDuplicate,
      nextAction: getCustomerNextAction(withDuplicate),
    };
  });

  const sortedCustomers = enrichedCustomers.sort(
    (a, b) => b.totalSpend - a.totalSpend,
  );

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce(
    (sum, customer) => sum + customer.totalSpend,
    0,
  );
  const totalBookings = customers.reduce(
    (sum, customer) => sum + customer.bookingCount,
    0,
  );
  const repeatCustomers = customers.filter(
    (customer) => customer.bookingCount >= 2,
  ).length;
  const activeCustomersLast30 = customers.filter((customer) =>
    isWithinLastDays(customer.lastBookingDate, 30),
  ).length;
  const customersWithPets = customers.filter(
    (customer) => customer.petCount > 0,
  ).length;
  const unreadMessages = messages.filter(isUnreadMessage).length;

  const socialSignupRows = signupRows.filter((row) => isSocialSource(getSource(row)));
  const socialCustomers = customers.filter((customer) =>
    isSocialSource(customer.source),
  );
  const socialRevenue = socialCustomers.reduce(
    (sum, customer) => sum + customer.totalSpend,
    0,
  );
  const socialBookings = socialCustomers.reduce(
    (sum, customer) => sum + customer.bookingCount,
    0,
  );
  const socialClicks = clickRows.filter((row) => isSocialSource(getSource(row))).length;

  const averageLifetimeValue =
    totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
  const averageBookingsPerCustomer =
    totalCustomers > 0 ? totalBookings / totalCustomers : 0;
  const repeatRate =
    totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

  const segments = {
    vip: customers.filter((customer) => customer.segment === "VIP").length,
    repeat: customers.filter((customer) => customer.segment === "Repeat").length,
    new: customers.filter((customer) => customer.segment === "New").length,
    lead: customers.filter((customer) => customer.segment === "Lead").length,
  };

  const locationInsights = {
    zipCodes: buildLocationInsights(sortedCustomers, "zipCode"),
    cities: buildLocationInsights(sortedCustomers, "city"),
    states: buildLocationInsights(sortedCustomers, "state"),
    countries: buildLocationInsights(sortedCustomers, "country"),
  };

  const sourceInsights = buildSourceInsights(
    sortedCustomers,
    signupRows,
    conversionRows,
  );

  const socialSourceInsights = sourceInsights.filter((source) =>
    isSocialSource(source.label),
  );

  const campaignInsights = buildCampaignInsights(campaignRows);

  const chartData = {
    segments: [
      {
        label: "VIP",
        value: segments.vip,
        helper: "$1,000+ spend or 8+ bookings",
      },
      {
        label: "Repeat",
        value: segments.repeat,
        helper: "3+ bookings",
      },
      {
        label: "New",
        value: segments.new,
        helper: "1 booking",
      },
      {
        label: "Lead",
        value: segments.lead,
        helper: "No booking yet",
      },
    ],
    topCities: toChartItemsFromLocations(locationInsights.cities),
    topZipCodes: toChartItemsFromLocations(locationInsights.zipCodes),
    topSources: toChartItemsFromSources(sourceInsights),
    socialSources: toChartItemsFromSources(socialSourceInsights),
  };

  return {
    profiles,
    bookings,
    pets,
    messages,
    customers: sortedCustomers,
    locationInsights,
    sourceInsights,
    socialSourceInsights,
    campaignInsights,
    chartData,
    metrics: {
      totalCustomers,
      totalRevenue,
      totalBookings,
      repeatCustomers,
      activeCustomersLast30,
      customersWithPets,
      unreadMessages,
      averageLifetimeValue,
      averageBookingsPerCustomer,
      repeatRate,
      segments,
      socialSignups: socialSignupRows.length,
      socialCustomers: socialCustomers.length,
      socialBookings,
      socialRevenue,
      socialClicks,
      topSocialPlatform: socialSourceInsights[0]?.label || "None yet",
      hiddenDemoRows,
      separatedAdminRows,
      reviewQueueRows: customers.filter((customer) => customer.signupQuality === "needs_review" || customer.signupQuality === "incomplete").length,
      archivedRows: separatedStatusCounts.archived,
      likelySpamRows: separatedStatusCounts.likelySpam,
      incompleteSignupRows: separatedStatusCounts.incompleteSignup,
      deletedRows: separatedStatusCounts.deleted,
      needsReviewRows: separatedStatusCounts.needsReview,
    },
  };
}

export default async function AdminCustomerIntelligencePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const activeMetric = parseCustomerIntelligenceMetric(params.metric);
  const data = await getCustomerIntelligenceData();
  const drilledCustomers = filterCustomersForMetric(
    data.customers,
    activeMetric,
  );
  const metricMeta = activeMetric
    ? getCustomerIntelligenceMetricMeta(activeMetric)
    : null;

  return (
    <main className="min-h-screen bg-[#f9faf5] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="flex flex-col justify-between gap-4 rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm lg:flex-row lg:items-end">
          <div>
            <Link
              href={adminRoutes.dashboard}
              className="mb-4 inline-flex items-center gap-2 text-sm font-black text-green-800 transition hover:text-green-950"
            >
              <ArrowLeft size={17} />
              Back to Admin Dashboard
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-green-800 text-white">
                <Users size={26} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
                  Admin / Pet Parents
                </p>
                <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-4xl">
                  Pet Parents
                </h1>
                <p className="mt-1 max-w-4xl text-base font-semibold text-slate-600">
                  Live Supabase insights for real Pet Parent value, repeat
                  behavior, location demand, source attribution, social growth,
                  and exportable reporting with demo/test rows filtered out.
                  Click any metric card to drill down. Rogue can pull the same
                  pack stats into admin reports.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={adminRoutes.customerExport}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <Download size={17} />
              Export CSV Report
            </Link>

            <Link
              href={adminRoutes.bookings}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <CalendarDays size={17} />
              View Bookings
            </Link>

            <Link
              href={adminRoutes.customerArchive}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black text-amber-900 shadow-sm transition hover:bg-amber-100"
            >
              <Archive size={17} />
              Archive / Spam
            </Link>

            <Link
              href={adminRoutes.users}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
            >
              <UserRound size={18} />
              View Users
            </Link>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={<Users size={22} />}
            label="Pet Parents"
            value={number(data.metrics.totalCustomers)}
            detail="Real Pet Parents, including incomplete profiles for admin follow-up"
            href={getCustomerIntelligenceMetricHref("pet_parents")}
            active={activeMetric === "pet_parents"}
          />

          <StatCard
            icon={<CircleDollarSign size={22} />}
            label="Lifetime Value"
            value={money(data.metrics.averageLifetimeValue)}
            detail={`${money(data.metrics.totalRevenue)} total Pet Parent spend`}
            href={getCustomerIntelligenceMetricHref("lifetime_value")}
            active={activeMetric === "lifetime_value"}
          />

          <StatCard
            icon={<Repeat2 size={22} />}
            label="Repeat Rate"
            value={`${data.metrics.repeatRate.toFixed(1)}%`}
            detail={`${number(data.metrics.repeatCustomers)} repeat Pet Parents`}
            href={getCustomerIntelligenceMetricHref("repeat_rate")}
            active={activeMetric === "repeat_rate"}
          />

          <StatCard
            icon={<TrendingUp size={22} />}
            label="Active Last 30 Days"
            value={number(data.metrics.activeCustomersLast30)}
            detail={`${data.metrics.averageBookingsPerCustomer.toFixed(
              1,
            )} avg bookings per Pet Parent`}
            href={getCustomerIntelligenceMetricHref("active_30d")}
            active={activeMetric === "active_30d"}
          />

          <StatCard
            icon={<Search size={22} />}
            label="Rows Excluded"
            value={number(data.metrics.hiddenDemoRows)}
            detail={`${number(data.metrics.separatedAdminRows)} archived/spam/deleted cleanup rows removed; ${number(data.metrics.reviewQueueRows)} incomplete or needs-review Pet Parents remain visible`}
            href={getCustomerIntelligenceMetricHref("rows_excluded")}
            active={activeMetric === "rows_excluded"}
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={<Share2 size={22} />}
            label="Social Signups"
            value={number(data.metrics.socialSignups)}
            detail="Launch signups or waitlist rows from social"
            href={getCustomerIntelligenceMetricHref("social_signups")}
            active={activeMetric === "social_signups"}
          />

          <StatCard
            icon={<Users size={22} />}
            label="Social Pet Parents"
            value={number(data.metrics.socialCustomers)}
            detail="Pet Parents attributed to social sources"
            href={getCustomerIntelligenceMetricHref("social_customers")}
            active={activeMetric === "social_customers"}
          />

          <StatCard
            icon={<CalendarDays size={22} />}
            label="Social Bookings"
            value={number(data.metrics.socialBookings)}
            detail="Bookings from social-attributed Pet Parents"
            href={getCustomerIntelligenceMetricHref("social_bookings")}
            active={activeMetric === "social_bookings"}
          />

          <StatCard
            icon={<CircleDollarSign size={22} />}
            label="Social Revenue"
            value={money(data.metrics.socialRevenue)}
            detail="Customer spend attributed to social"
            href={getCustomerIntelligenceMetricHref("social_revenue")}
            active={activeMetric === "social_revenue"}
          />

          <StatCard
            icon={<MousePointerClick size={22} />}
            label="Social Clicks"
            value={number(data.metrics.socialClicks)}
            detail={`Top platform: ${data.metrics.topSocialPlatform}`}
            href={getCustomerIntelligenceMetricHref("social_clicks")}
            active={activeMetric === "social_clicks"}
          />
        </section>

        {metricMeta ? (
          <section
            id="ci-drill-down"
            className="rounded-[26px] border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm"
          >
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                  Active drill-down
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  {metricMeta.label}
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {metricMeta.description} Showing{" "}
                  {number(
                    activeMetric === "social_signups"
                      ? data.metrics.socialSignups
                      : activeMetric === "social_clicks"
                        ? data.metrics.socialClicks
                        : drilledCustomers.length,
                  )}{" "}
                  matching records.
                </p>
              </div>
              <Link
                href="/admin/petparents"
                className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-black text-emerald-900 transition hover:bg-emerald-50"
              >
                Clear filter
              </Link>
            </div>

            {activeMetric === "social_clicks" ||
            activeMetric === "social_signups" ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {(data.socialSourceInsights.length
                  ? data.socialSourceInsights
                  : data.sourceInsights
                )
                  .slice(0, 9)
                  .map((row) => (
                    <div
                      key={row.label}
                      className="rounded-2xl border border-emerald-100 bg-white p-4"
                    >
                      <p className="text-sm font-black text-slate-950">
                        {row.label}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {number(row.customers || row.signups || 0)} people ·{" "}
                        {number(row.bookings || 0)} bookings ·{" "}
                        {money(row.revenue || 0)}
                      </p>
                    </div>
                  ))}
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <CustomerInsightsTable
            customers={
              activeMetric &&
              activeMetric !== "social_signups" &&
              activeMetric !== "social_clicks" &&
              activeMetric !== "rows_excluded"
                ? drilledCustomers
                : data.customers
            }
            exportHref={adminRoutes.customerExport}
            usersHref={adminRoutes.users}
          />
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-12">
          <div className="xl:col-span-4">
            <DashboardCard>
              <div className="mb-5">
                  <h2 className="text-xl font-black text-slate-950">
                  Pet Parent Segment Chart
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Segments are calculated from booking count and lifetime spend.
                </p>
              </div>

              <DonutChart
                title="Pet Parents"
                total={data.metrics.totalCustomers}
                items={data.chartData.segments}
              />

              <div className="mt-5 space-y-3">
                <SegmentRow
                  label="VIP Pet Parents"
                  value={data.metrics.segments.vip}
                  detail="$1,000+ spend or 8+ bookings"
                  tone="green"
                />
                <SegmentRow
                  label="Repeat Pet Parents"
                  value={data.metrics.segments.repeat}
                  detail="3+ bookings"
                  tone="blue"
                />
                <SegmentRow
                  label="New Pet Parents"
                  value={data.metrics.segments.new}
                  detail="1 booking"
                  tone="orange"
                />
                <SegmentRow
                  label="Leads"
                  value={data.metrics.segments.lead}
                  detail="Profile or Pet Parent record without booking"
                  tone="slate"
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <MiniMetric
                  icon={<PawPrint size={18} />}
                  label="Pet Parents with pets"
                  value={number(data.metrics.customersWithPets)}
                />
                <MiniMetric
                  icon={<Mail size={18} />}
                  label="Unread messages"
                  value={number(data.metrics.unreadMessages)}
                />
              </div>
            </DashboardCard>
          </div>

          <div className="xl:col-span-8">
            <DashboardCard>
              <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Acquisition Source Charts
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Revenue, Pet Parents, and signups grouped by source and social
                    platform.
                  </p>
                </div>

                <Link
                  href={adminRoutes.customerExport}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white transition hover:bg-green-900"
                >
                  <Download size={16} />
                  Export
                </Link>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <HorizontalBarChart
                  title="Top Acquisition Sources"
                  valueLabel="Revenue"
                  items={data.chartData.topSources}
                  valueFormatter={money}
                />

                <HorizontalBarChart
                  title="Top Social Platforms"
                  valueLabel="Revenue"
                  items={data.chartData.socialSources}
                  valueFormatter={money}
                  emptyLabel="No social attribution data found yet."
                />
              </div>
            </DashboardCard>
          </div>
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <DashboardCard>
              <div className="mb-5">
                <h2 className="text-xl font-black text-slate-950">
                  Top Customer Locations
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Ranked by real customer spend from profile and booking
                  location fields.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <LocationInsightCard
                  icon={<MapPin size={18} />}
                  title="Top ZIP Codes"
                  rows={data.locationInsights.zipCodes}
                />

                <LocationInsightCard
                  icon={<MapPin size={18} />}
                  title="Top Cities"
                  rows={data.locationInsights.cities}
                />

                <LocationInsightCard
                  icon={<MapPin size={18} />}
                  title="Top States"
                  rows={data.locationInsights.states}
                />

                <LocationInsightCard
                  icon={<Globe2 size={18} />}
                  title="Top Countries"
                  rows={data.locationInsights.countries}
                />
              </div>
            </DashboardCard>
          </div>

          <div className="xl:col-span-5">
            <DashboardCard>
              <div className="mb-5">
                <h2 className="text-xl font-black text-slate-950">
                  Location Revenue Charts
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Visual view of your strongest local Pet Parent markets.
                </p>
              </div>

              <div className="space-y-5">
                <HorizontalBarChart
                  title="Top Cities by Revenue"
                  valueLabel="Revenue"
                  items={data.chartData.topCities}
                  valueFormatter={money}
                />

                <HorizontalBarChart
                  title="Top ZIP Codes by Revenue"
                  valueLabel="Revenue"
                  items={data.chartData.topZipCodes}
                  valueFormatter={money}
                />
              </div>
            </DashboardCard>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-4">
          <QuickLinkCard
            href={adminRoutes.customerArchive}
            icon={<Archive size={22} />}
            title="Archive & Spam Manager"
            description={`Review ${number(data.metrics.archivedRows)} archived and ${number(data.metrics.likelySpamRows)} likely spam cleanup records outside active Pet Parent stats. ${number(data.metrics.incompleteSignupRows + data.metrics.needsReviewRows)} incomplete or needs-review Pet Parents remain visible in the registry.`}
          />

          <QuickLinkCard
            href={adminRoutes.launchSignups}
            icon={<Megaphone size={22} />}
            title="Launch Signups"
            description="Review waitlist, launch, and acquisition-source rows that feed social signup reporting."
          />

          <QuickLinkCard
            href={adminRoutes.referrals}
            icon={<Share2 size={22} />}
            title="Referral Tracking"
            description="Review referral clicks, conversions, source behavior, and Pet Parent acquisition quality."
          />

          <QuickLinkCard
            href={adminRoutes.partners}
            icon={<Globe2 size={22} />}
            title="Partner Campaigns"
            description="Review partner, affiliate, and campaign activity connected to growth reporting."
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <QuickLinkCard
            href={adminRoutes.bookings}
            icon={<CalendarDays size={22} />}
            title="Review Bookings"
            description="Open the admin booking manager to review the Pet Parent booking history behind these numbers."
          />

          <QuickLinkCard
            href={adminRoutes.petAnalytics}
            icon={<PawPrint size={22} />}
            title="Pet Analytics"
            description="Review pet-related behavior, pet profiles, and demand signals from Pet Parent accounts."
          />

          <QuickLinkCard
            href={adminRoutes.messages}
            icon={<Mail size={22} />}
            title="Customer Messages"
            description="Jump into customer and guru conversations that may need admin attention."
          />
        </section>

        <div className="rounded-[26px] border border-green-100 bg-white p-4 text-sm font-semibold text-slate-500 shadow-sm">
          <span className="font-black text-green-900">
            Supabase coordination:
          </span>{" "}
          this page reads `profiles`, `bookings`, `pets`, `messages`,
          `launch_signups`, `launch_waitlist`, `referral_clicks`,
          `referral_conversions`, `network_click_events`, and
          `partner_campaigns`. Demo, fake, test, sample, sandbox, archived, and
          deleted rows are filtered in-memory before Customer KPIs, social
          attribution, source charts, location charts, and exportable report
          data are calculated from live rows. Records marked archived, likely
          spam, or deleted by Admin Cleanup Controls are excluded from active
          Pet Parent stats and should be managed from the Archive & Spam
          Manager. Incomplete and needs-review Pet Parents remain visible as
          follow-up records in the registry.
        </div>
      </div>
    </main>
  );
}

function DashboardCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      {children}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
  href,
  active = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  href?: string;
  active?: boolean;
}) {
  const className = [
    "rounded-[26px] border bg-white p-5 shadow-sm transition",
    active
      ? "border-emerald-400 ring-2 ring-emerald-100"
      : "border-[#e3ece5] hover:border-emerald-200 hover:shadow-md",
    href ? "block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const body = (
    <>
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-green-800 text-white">
        {icon}
      </div>

      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm font-semibold leading-5 text-slate-500">
        {detail}
      </p>
      {href ? (
        <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
          {active ? "Viewing drill-down" : "Click to drill down"}
        </p>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}

function SegmentRow({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  tone: "green" | "blue" | "orange" | "slate";
}) {
  const toneClasses = {
    green: "bg-green-100 text-green-800",
    blue: "bg-sky-100 text-sky-800",
    orange: "bg-amber-100 text-amber-800",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-3">
      <div>
        <p className="text-sm font-black text-slate-950">{label}</p>
        <p className="text-xs font-bold text-slate-500">{detail}</p>
      </div>

      <span
        className={`rounded-full px-3 py-1 text-sm font-black ${toneClasses[tone]}`}
      >
        {number(value)}
      </span>
    </div>
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
    <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-green-800">
        {icon}
      </div>

      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
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
  const activeItems = items.filter((item) => item.value > 0);
  const activeTotal = activeItems.reduce((sum, item) => sum + item.value, 0);

  const segments = activeItems.reduce<{ offset: number; segments: string[] }>(
    (state, item, index) => {
      const percent = activeTotal > 0 ? (item.value / activeTotal) * 100 : 0;
      const nextOffset = state.offset + percent;

      return {
        offset: nextOffset,
        segments: [
          ...state.segments,
          `${chartColors[index % chartColors.length]} ${state.offset}% ${nextOffset}%`,
        ],
      };
    },
    { offset: 0, segments: [] },
  ).segments;

  const background =
    segments.length > 0
      ? `conic-gradient(${segments.join(", ")})`
      : "conic-gradient(#e2e8f0 0% 100%)";

  return (
    <div className="rounded-[24px] border border-[#edf3ee] bg-[#fbfcf9] p-5">
      <div className="flex flex-col items-center gap-5 md:flex-row">
        <div
          className="relative h-52 w-52 shrink-0 rounded-full"
          style={{ background }}
        >
          <div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              {title}
            </p>
            <p className="mt-1 text-3xl font-black text-slate-950">
              {number(total)}
            </p>
          </div>
        </div>

        <div className="w-full space-y-3">
          {items.map((item, index) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: chartColors[index % chartColors.length],
                  }}
                />
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
              </div>

              <p className="text-sm font-black text-green-800">
                {number(item.value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HorizontalBarChart({
  title,
  valueLabel,
  items,
  valueFormatter,
  emptyLabel = "No chart data found yet.",
}: {
  title: string;
  valueLabel: string;
  items: ChartItem[];
  valueFormatter: (value: number) => string;
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
                    {valueFormatter(item.value)}
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

function LocationInsightCard({
  icon,
  title,
  rows,
}: {
  icon: ReactNode;
  title: string;
  rows: LocationInsight[];
}) {
  return (
    <div className="rounded-[24px] border border-[#edf3ee] bg-[#fbfcf9] p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-800 text-white">
          {icon}
        </div>
        <h3 className="text-base font-black text-slate-950">{title}</h3>
      </div>

      <div className="space-y-2.5">
        {rows.length ? (
          rows.map((row) => (
            <div
              key={row.label}
              className="rounded-2xl border border-white bg-white p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">
                    {row.label}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {number(row.customers)} Pet Parents · {number(row.bookings)}{" "}
                    bookings
                  </p>
                </div>

                <p className="shrink-0 text-sm font-black text-green-800">
                  {money(row.revenue)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-white bg-white p-4 text-sm font-bold text-slate-500">
            No location data found yet.
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