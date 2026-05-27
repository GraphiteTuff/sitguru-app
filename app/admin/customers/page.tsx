import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
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
  ShieldCheck,
  Trash2,
  TrendingUp,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import { supabaseAdmin } from "@/utils/supabase/admin";

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
  phone?: string | null;
  phone_number?: string | null;
  mobile_phone?: string | null;
  email_confirmed_at?: string | null;
  phone_confirmed_at?: string | null;
  confirmed_at?: string | null;
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
  created_at?: string | null;
  updated_at?: string | null;
};

type BookingRow = {
  id: string;
  customer_id?: string | null;
  pet_owner_id?: string | null;
  client_id?: string | null;
  user_id?: string | null;
  pet_parent_id?: string | null;
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
  country?: string | null;
  zip?: string | null;
  zipcode?: string | null;
  zip_code?: string | null;
  postal_code?: string | null;
  service_city?: string | null;
  service_state?: string | null;
  service_country?: string | null;
  service_zip?: string | null;
  service_zip_code?: string | null;
  customer_city?: string | null;
  customer_state?: string | null;
  customer_country?: string | null;
  customer_zip?: string | null;
  customer_zip_code?: string | null;
  customer_postal_code?: string | null;
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
  amount?: number | string | null;
  price?: number | string | null;
  total_amount?: number | string | null;
  booking_total?: number | string | null;
  total_customer_paid?: number | string | null;
  customer_total_amount?: number | string | null;
};

type PetRow = {
  id: string;
  owner_id?: string | null;
  owner_profile_id?: string | null;
  customer_id?: string | null;
  user_id?: string | null;
  pet_owner_id?: string | null;
  pet_parent_id?: string | null;
  name?: string | null;
  pet_name?: string | null;
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

type SetupStep = {
  label: string;
  complete: boolean;
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
  hasVerifiedContact: boolean;
  hasProfileInfo: boolean;
  hasPhone: boolean;
  hasLocation: boolean;
  hasPet: boolean;
  hasStartedBooking: boolean;
  hasCompletedBooking: boolean;
  setupSteps: SetupStep[];
  setupPercent: number;
  currentStep: string;
  setupStatus: string;
  needsReview: boolean;
};

type CleanupCustomerRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  sourceTable: string;
  issue: string;
  reason: string;
  bookingCount: number;
  petCount: number;
  messageCount: number;
  totalSpend: number;
  createdAt: string | null;
  safeToDelete: boolean;
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
  customers: "/admin/customers",
  customerIntelligence: "/admin/customer-intelligence",
  customerExport: "/admin/customer-intelligence/export",
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
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

function getDisplayName(row: AnyRow, fallback = "Pet Parent") {
  const firstName = getText(row, ["first_name", "firstName"]);
  const lastName = getText(row, ["last_name", "lastName"]);

  if (firstName || lastName) return `${firstName} ${lastName}`.trim();

  return getText(
    row,
    [
      "full_name",
      "display_name",
      "name",
      "customer_name",
      "pet_parent_name",
      "owner_name",
      "email",
    ],
    fallback,
  );
}

function getRole(row: AnyRow) {
  return getText(
    row,
    ["role", "user_role", "account_type", "type", "segment"],
    "",
  ).toLowerCase();
}

function isCustomerProfile(profile: ProfileRow) {
  const role = getRole(profile as AnyRow);

  if (!role) return true;

  return (
    role.includes("customer") ||
    role.includes("parent") ||
    role.includes("client") ||
    role.includes("owner") ||
    role.includes("both")
  );
}

function getPhone(row: AnyRow) {
  return getText(row, ["phone", "phone_number", "mobile_phone", "mobile"], "");
}

function hasVerifiedContact(row: AnyRow) {
  return Boolean(
    asString(row.email_confirmed_at) ||
      asString(row.phone_confirmed_at) ||
      asString(row.confirmed_at),
  );
}

function hasProfileLocation(profile: ProfileRow) {
  return Boolean(
    getCity(profile as AnyRow) ||
      getState(profile as AnyRow) ||
      getZipCode(profile as AnyRow),
  );
}

function getCleanupReason({
  profile,
  bookingCount,
  petCount,
  messageCount,
  totalSpend,
}: {
  profile?: ProfileRow | null;
  bookingCount: number;
  petCount: number;
  messageCount: number;
  totalSpend: number;
}) {
  const reasons: string[] = [];

  if (!profile) {
    reasons.push("No matching profile row");
  } else {
    if (!asString(profile.email)) reasons.push("No email");
    if (!getPhone(profile as AnyRow)) reasons.push("No phone");
    if (!hasVerifiedContact(profile as AnyRow)) reasons.push("No verified contact");
  }

  if (bookingCount === 0) reasons.push("0 bookings");
  if (petCount === 0) reasons.push("0 pets");
  if (messageCount === 0) reasons.push("0 messages");
  if (totalSpend === 0) reasons.push("$0 spend");

  return reasons.join(" · ");
}

function getRowBoolean(row: AnyRow, keys: string[]) {
  return keys.some((key) => {
    const value = row[key];

    if (typeof value === "boolean") return value;

    if (typeof value === "number") return value === 1;

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      return ["true", "yes", "y", "1"].includes(normalized);
    }

    return false;
  });
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
    /\bdemo\b/,
    /\bfake\b/,
    /\btest\b/,
    /\btester\b/,
    /\bsample\b/,
    /\bseed\b/,
    /\bseeded\b/,
    /\bdummy\b/,
    /\bmock\b/,
    /\bsandbox\b/,
    /\bplaceholder\b/,
    /\blorem\b/,
  ].some((pattern) => pattern.test(normalized));
}

function isDemoEmail(value: string) {
  const email = value.trim().toLowerCase();

  if (!email) return false;

  const domain = email.includes("@") ? email.split("@").pop() || "" : "";

  return (
    email.includes("+test@") ||
    email.includes("+demo@") ||
    email.includes("+fake@") ||
    email.includes("demo+") ||
    email.includes("test+") ||
    [
      "example.com",
      "example.org",
      "example.net",
      "test.com",
      "demo.com",
      "fake.com",
      "mailinator.com",
      "localhost",
    ].includes(domain)
  );
}

function isDemoLikeRow(row: AnyRow) {
  const deletedAt = asString(row.deleted_at || row.archived_at || row.removed_at);
  if (deletedAt) return true;

  if (
    getRowBoolean(row, [
      "is_demo",
      "demo",
      "is_test",
      "test_account",
      "is_fake",
      "fake",
      "sandbox",
      "seeded",
      "is_seed",
      "sample",
      "archived",
      "is_archived",
    ])
  ) {
    return true;
  }

  const emailText = getRowSearchText(row, [
    "email",
    "customer_email",
    "pet_parent_email",
    "owner_email",
    "sender_email",
    "recipient_email",
  ]);

  if (emailText.split(/\s+/).some(isDemoEmail)) return true;

  const identifierText = getRowSearchText(row, [
    "id",
    "user_id",
    "customer_id",
    "pet_owner_id",
    "client_id",
    "owner_id",
    "sender_id",
    "recipient_id",
    "from_user_id",
    "to_user_id",
  ]);

  if (hasDemoKeyword(identifierText)) return true;

  const visibleText = getRowSearchText(row, [
    "full_name",
    "display_name",
    "first_name",
    "last_name",
    "name",
    "customer_name",
    "pet_parent_name",
    "owner_name",
    "pet_name",
    "source",
    "signup_source",
    "referral_source",
    "lead_source",
    "acquisition_source",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "campaign",
    "campaign_name",
    "notes",
    "description",
  ]);

  return hasDemoKeyword(visibleText);
}

function hasHiddenCustomerReference(row: AnyRow, hiddenCustomerIds: Set<string>) {
  if (!hiddenCustomerIds.size) return false;

  const possibleIds = [
    row.id,
    row.user_id,
    row.customer_id,
    row.pet_owner_id,
    row.client_id,
    row.pet_parent_id,
    row.owner_id,
    row.owner_profile_id,
    row.sender_id,
    row.recipient_id,
    row.from_user_id,
    row.to_user_id,
  ]
    .map((value) => asString(value))
    .filter(Boolean);

  return possibleIds.some((id) => hiddenCustomerIds.has(id));
}

function getCustomerId(booking: BookingRow) {
  return (
    booking.customer_id ||
    booking.pet_owner_id ||
    booking.pet_parent_id ||
    booking.client_id ||
    booking.user_id ||
    null
  );
}

function getPetOwnerId(pet: PetRow) {
  return (
    pet.owner_profile_id ||
    pet.owner_id ||
    pet.customer_id ||
    pet.pet_parent_id ||
    pet.user_id ||
    pet.pet_owner_id ||
    null
  );
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
    "total_customer_paid",
    "customer_total_amount",
    "total_amount",
    "booking_total",
    "amount",
    "price",
  ]);
}

function getBookingStatus(booking: BookingRow) {
  return asString(booking.status || booking.booking_status).toLowerCase();
}

function getPaymentStatus(booking: BookingRow) {
  return asString(booking.payment_status).toLowerCase();
}

function isPaidBooking(booking: BookingRow) {
  const paymentStatus = getPaymentStatus(booking);
  const bookingStatus = getBookingStatus(booking);

  return (
    paymentStatus === "paid" ||
    paymentStatus === "succeeded" ||
    bookingStatus.includes("paid") ||
    bookingStatus.includes("complete")
  );
}

function isCompletedBooking(booking: BookingRow) {
  const status = getBookingStatus(booking);
  return status.includes("complete") || status.includes("paid");
}

function isUnreadMessage(message: MessageRow) {
  const readAt = asString(message.read_at);
  const status = asString(message.status).toLowerCase();

  if (message.is_read === false) return true;
  if (!readAt && status !== "read" && status !== "archived") return true;

  return false;
}

function getMessageParticipantIds(message: MessageRow) {
  return [
    message.sender_id,
    message.recipient_id,
    message.customer_id,
    message.user_id,
    message.from_user_id,
    message.to_user_id,
  ].filter(Boolean) as string[];
}

function isWithinLastDays(value: string | null, days: number) {
  if (!value) return false;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return parsed >= cutoff;
}

function getMostRecentDate(values: Array<string | null>) {
  const validDates = values
    .filter(Boolean)
    .map((value) => new Date(value as string))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  return validDates[0]?.toISOString() || null;
}

function getOldestDate(values: Array<string | null>) {
  const validDates = values
    .filter(Boolean)
    .map((value) => new Date(value as string))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  return validDates[0]?.toISOString() || null;
}

function getCustomerSegment(customer: CustomerInsight) {
  if (customer.totalSpend >= 1000 || customer.bookingCount >= 8) {
    return "VIP";
  }

  if (customer.bookingCount >= 3) {
    return "Repeat";
  }

  if (customer.bookingCount === 1) {
    return "New";
  }

  return "Lead";
}

function getCity(row: AnyRow) {
  return getText(row, ["city", "service_city", "customer_city"], "");
}

function getState(row: AnyRow) {
  return getText(row, ["state", "service_state", "customer_state"], "");
}

function getCountry(row: AnyRow) {
  return getText(row, ["country", "service_country", "customer_country"], "");
}

function getZipCode(row: AnyRow) {
  return getText(
    row,
    [
      "zip_code",
      "zipcode",
      "zip",
      "postal_code",
      "service_zip_code",
      "service_zip",
      "customer_zip_code",
      "customer_zip",
      "customer_postal_code",
    ],
    "",
  );
}

function getSource(row: AnyRow) {
  return getText(
    row,
    [
      "utm_source",
      "source",
      "signup_source",
      "referral_source",
      "lead_source",
      "acquisition_source",
    ],
    "Direct",
  );
}

function getCampaign(row: AnyRow) {
  return getText(
    row,
    [
      "utm_campaign",
      "campaign",
      "campaign_name",
      "source_campaign",
      "referral_campaign",
    ],
    "",
  );
}

function normalizeSource(value: string) {
  const source = value.toLowerCase();

  if (source.includes("instagram") || source === "ig") return "Instagram";
  if (source.includes("facebook") || source.includes("meta")) return "Facebook";
  if (source.includes("tiktok") || source.includes("tik tok")) return "TikTok";
  if (source.includes("youtube")) return "YouTube";
  if (source.includes("linkedin")) return "LinkedIn";
  if (source === "x" || source.includes("twitter")) return "X / Twitter";
  if (source.includes("google")) return "Google";
  if (source.includes("referral") || source.includes("refer")) return "Referral";
  if (source.includes("partner") || source.includes("affiliate")) return "Partner";
  if (source.includes("email")) return "Email";
  if (source.includes("direct") || !source) return "Direct";

  return value;
}

function isSocialSource(value: string) {
  return socialPlatforms.includes(normalizeSource(value));
}

function getPetParentSetup({
  profile,
  petCount,
  bookingCount,
  completedBookingCount,
}: {
  profile: ProfileRow;
  petCount: number;
  bookingCount: number;
  completedBookingCount: number;
}) {
  const email = asString(profile.email);
  const phone = getPhone(profile as AnyRow);
  const hasName = getDisplayName(profile as AnyRow, "") !== "";
  const hasEmail = Boolean(email);
  const hasPhone = Boolean(phone);
  const hasLocation = hasProfileLocation(profile);
  const verified = hasVerifiedContact(profile as AnyRow);
  const hasPet = petCount > 0;
  const hasStartedBooking = bookingCount > 0;
  const hasCompletedBooking = completedBookingCount > 0;
  const hasProfileInfo = hasName && hasEmail;

  const steps: SetupStep[] = [
    {
      label: "Account Created",
      complete: Boolean(profile.id),
    },
    {
      label: "Email / Google Verified",
      complete: verified || hasEmail,
    },
    {
      label: "Profile Info Added",
      complete: hasProfileInfo,
    },
    {
      label: "Phone Added",
      complete: hasPhone,
    },
    {
      label: "Location Added",
      complete: hasLocation,
    },
    {
      label: "Pet Added",
      complete: hasPet,
    },
    {
      label: "First Booking Started",
      complete: hasStartedBooking,
    },
    {
      label: "First Booking Completed",
      complete: hasCompletedBooking,
    },
  ];

  const completedSteps = steps.filter((step) => step.complete).length;
  const setupPercent = Math.round((completedSteps / steps.length) * 100);
  const nextStep = steps.find((step) => !step.complete);

  let setupStatus = "New Signup";

  if (hasCompletedBooking) {
    setupStatus = "Active Pet Parent";
  } else if (hasStartedBooking) {
    setupStatus = "Booking Started";
  } else if (hasProfileInfo && hasPhone && hasLocation && hasPet) {
    setupStatus = "Ready to Book";
  } else if (!hasProfileInfo) {
    setupStatus = "Needs Profile Info";
  } else if (!hasPhone) {
    setupStatus = "Needs Phone";
  } else if (!hasLocation) {
    setupStatus = "Needs Location";
  } else if (!hasPet) {
    setupStatus = "Needs Pet Added";
  }

  const needsReview =
    !hasEmail ||
    !hasProfileInfo ||
    !hasPhone ||
    !hasLocation ||
    !hasPet;

  return {
    hasVerifiedContact: verified,
    hasProfileInfo,
    hasPhone,
    hasLocation,
    hasPet,
    hasStartedBooking,
    hasCompletedBooking,
    setupSteps: steps,
    setupPercent,
    currentStep: nextStep?.label || "Complete",
    setupStatus,
    needsReview,
  };
}

function buildLocationInsights(
  customers: CustomerInsight[],
  key: "zipCode" | "city" | "state" | "country",
) {
  const locationMap = new Map<string, LocationInsight>();

  for (const customer of customers) {
    const label = customer[key] || "Unknown";

    const existing =
      locationMap.get(label) ||
      {
        label,
        customers: 0,
        bookings: 0,
        revenue: 0,
      };

    existing.customers += 1;
    existing.bookings += customer.bookingCount;
    existing.revenue += customer.totalSpend;

    locationMap.set(label, existing);
  }

  return Array.from(locationMap.values())
    .sort((a, b) => b.revenue - a.revenue || b.customers - a.customers)
    .slice(0, 5);
}

function buildSourceInsights(
  customers: CustomerInsight[],
  signupRows: AnyRow[],
  conversionRows: AnyRow[],
) {
  const sourceMap = new Map<string, SourceInsight>();

  function ensure(label: string) {
    const normalized = normalizeSource(label || "Direct");

    if (!sourceMap.has(normalized)) {
      sourceMap.set(normalized, {
        label: normalized,
        signups: 0,
        customers: 0,
        bookings: 0,
        revenue: 0,
      });
    }

    return sourceMap.get(normalized)!;
  }

  for (const signup of signupRows) {
    const row = ensure(getSource(signup));
    row.signups += 1;
  }

  for (const customer of customers) {
    const row = ensure(customer.source);
    row.customers += 1;
    row.bookings += customer.bookingCount;
    row.revenue += customer.totalSpend;
  }

  for (const conversion of conversionRows) {
    const row = ensure(getSource(conversion));
    row.customers += 1;
  }

  return Array.from(sourceMap.values())
    .sort((a, b) => b.revenue - a.revenue || b.customers - a.customers)
    .slice(0, 8);
}

function buildCampaignInsights(rows: AnyRow[]) {
  const campaignMap = new Map<string, CampaignInsight>();

  for (const row of rows) {
    const label = getCampaign(row) || "Untracked Campaign";

    const existing =
      campaignMap.get(label) ||
      {
        label,
        count: 0,
      };

    existing.count += 1;
    campaignMap.set(label, existing);
  }

  return Array.from(campaignMap.values())
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
        `Admin Pet Parents query skipped for ${label}:`,
        result.error,
      );
      return { data: [], error: null };
    }

    return result;
  } catch (error) {
    console.warn(`Admin Pet Parents query skipped for ${label}:`, error);
    return { data: [], error: null };
  }
}

async function getPetParentsData() {
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
  ]);

  const rawProfiles = ((profilesResult.data || []) as ProfileRow[]).filter(Boolean);
  const rawBookings = ((bookingsResult.data || []) as BookingRow[]).filter(Boolean);
  const rawPets = ((petsResult.data || []) as PetRow[]).filter(Boolean);
  const rawMessages = ((messagesResult.data || []) as MessageRow[]).filter(Boolean);
  const rawLaunchSignups = ((launchSignupsResult.data || []) as AnyRow[]).filter(Boolean);
  const rawLaunchWaitlist = ((launchWaitlistResult.data || []) as AnyRow[]).filter(Boolean);
  const rawReferralClicks = ((referralClicksResult.data || []) as AnyRow[]).filter(Boolean);
  const rawReferralConversions = ((referralConversionsResult.data || []) as AnyRow[]).filter(Boolean);
  const rawNetworkClicks = ((networkClicksResult.data || []) as AnyRow[]).filter(Boolean);
  const rawPartnerCampaigns = ((partnerCampaignsResult.data || []) as AnyRow[]).filter(Boolean);

  const demoProfileIds = new Set(
    rawProfiles
      .filter((profile) => isDemoLikeRow(profile as AnyRow))
      .map((profile) => profile.id)
      .filter(Boolean),
  );

  const profiles = rawProfiles.filter(
    (profile) =>
      Boolean(profile.id) &&
      isCustomerProfile(profile) &&
      !isDemoLikeRow(profile as AnyRow) &&
      !demoProfileIds.has(profile.id),
  );

  const profileIds = new Set(profiles.map((profile) => profile.id).filter(Boolean));

  const profileIdsByEmail = new Map(
    profiles
      .map((profile) => [asString(profile.email).toLowerCase(), profile.id] as const)
      .filter(([email, id]) => Boolean(email) && Boolean(id)),
  );

  function getProfileBookingCustomerId(booking: BookingRow) {
    const possibleIds = [
      booking.customer_id,
      booking.pet_owner_id,
      booking.pet_parent_id,
      booking.client_id,
      booking.user_id,
    ]
      .map((value) => asString(value))
      .filter(Boolean);

    const matchedId = possibleIds.find((id) => profileIds.has(id));
    if (matchedId) return matchedId;

    const matchedEmail = profileIdsByEmail.get(
      asString(booking.customer_email).toLowerCase(),
    );

    return matchedEmail || null;
  }

  function getProfilePetOwnerId(pet: PetRow) {
    const possibleIds = [
      pet.owner_profile_id,
      pet.owner_id,
      pet.customer_id,
      pet.pet_parent_id,
      pet.user_id,
      pet.pet_owner_id,
    ]
      .map((value) => asString(value))
      .filter(Boolean);

    return possibleIds.find((id) => profileIds.has(id)) || null;
  }

  function hasProfileMessageParticipant(message: MessageRow) {
    return getMessageParticipantIds(message).some((id) => profileIds.has(id));
  }

  const nonDemoBookings = rawBookings.filter(
    (booking) =>
      !isDemoLikeRow(booking as AnyRow) &&
      !hasHiddenCustomerReference(booking as AnyRow, demoProfileIds),
  );
  const nonDemoPets = rawPets.filter(
    (pet) =>
      !isDemoLikeRow(pet as AnyRow) &&
      !hasHiddenCustomerReference(pet as AnyRow, demoProfileIds),
  );
  const nonDemoMessages = rawMessages.filter(
    (message) =>
      !isDemoLikeRow(message as AnyRow) &&
      !hasHiddenCustomerReference(message as AnyRow, demoProfileIds),
  );

  const bookings = nonDemoBookings.filter((booking) =>
    Boolean(getProfileBookingCustomerId(booking)),
  );
  const pets = nonDemoPets.filter((pet) => Boolean(getProfilePetOwnerId(pet)));
  const messages = nonDemoMessages.filter((message) =>
    hasProfileMessageParticipant(message),
  );

  const bookingStatsByProfileId = new Map<
    string,
    {
      bookingCount: number;
      paidBookingCount: number;
      completedBookingCount: number;
      totalSpend: number;
      lastBookingDate: string | null;
      firstBookingDate: string | null;
    }
  >();

  for (const booking of bookings) {
    const customerId = getProfileBookingCustomerId(booking);
    if (!customerId) continue;

    const current =
      bookingStatsByProfileId.get(customerId) || {
        bookingCount: 0,
        paidBookingCount: 0,
        completedBookingCount: 0,
        totalSpend: 0,
        lastBookingDate: null,
        firstBookingDate: null,
      };

    const bookingDate = getBookingDate(booking);

    current.bookingCount += 1;
    current.paidBookingCount += isPaidBooking(booking) ? 1 : 0;
    current.completedBookingCount += isCompletedBooking(booking) ? 1 : 0;
    current.totalSpend += getBookingAmount(booking);
    current.lastBookingDate = getMostRecentDate([
      current.lastBookingDate,
      bookingDate,
    ]);
    current.firstBookingDate = getOldestDate([
      current.firstBookingDate,
      booking.created_at || null,
      bookingDate,
    ]);

    bookingStatsByProfileId.set(customerId, current);
  }

  const petCountByProfileId = new Map<string, number>();

  for (const pet of pets) {
    const ownerId = getProfilePetOwnerId(pet);
    if (!ownerId) continue;

    petCountByProfileId.set(ownerId, (petCountByProfileId.get(ownerId) || 0) + 1);
  }

  const messageCountByProfileId = new Map<string, number>();

  for (const message of messages) {
    for (const participantId of getMessageParticipantIds(message)) {
      if (!profileIds.has(participantId)) continue;

      messageCountByProfileId.set(
        participantId,
        (messageCountByProfileId.get(participantId) || 0) + 1,
      );
    }
  }

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
    nonDemoBookings.length +
    rawPets.length -
    nonDemoPets.length +
    rawMessages.length -
    nonDemoMessages.length +
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

  const customerMap = new Map<string, CustomerInsight>();

  for (const profile of profiles) {
    if (!profile.id) continue;

    const bookingStats = bookingStatsByProfileId.get(profile.id);
    const bookingCount = bookingStats?.bookingCount || 0;
    const paidBookingCount = bookingStats?.paidBookingCount || 0;
    const completedBookingCount = bookingStats?.completedBookingCount || 0;
    const totalSpend = bookingStats?.totalSpend || 0;
    const petCount = petCountByProfileId.get(profile.id) || 0;
    const messageCount = messageCountByProfileId.get(profile.id) || 0;

    const setup = getPetParentSetup({
      profile,
      petCount,
      bookingCount,
      completedBookingCount,
    });

    const averageBookingValue = bookingCount > 0 ? totalSpend / bookingCount : 0;
    const source = normalizeSource(getSource(profile as AnyRow));

    const customer: CustomerInsight = {
      id: profile.id,
      name: getDisplayName(profile as AnyRow, "Pet Parent"),
      email: profile.email || "",
      avatarUrl: profile.avatar_url || "",
      city: getCity(profile as AnyRow),
      state: getState(profile as AnyRow),
      country: getCountry(profile as AnyRow),
      zipCode: getZipCode(profile as AnyRow),
      phone: getPhone(profile as AnyRow),
      source,
      campaign: getCampaign(profile as AnyRow),
      bookingCount,
      paidBookingCount,
      completedBookingCount,
      totalSpend,
      averageBookingValue,
      petCount,
      messageCount,
      lastBookingDate: bookingStats?.lastBookingDate || null,
      firstSeenDate: profile.created_at || profile.updated_at || null,
      segment: "Lead",
      ...setup,
    };

    customerMap.set(profile.id, {
      ...customer,
      segment: getCustomerSegment(customer),
    });
  }

  const customers = Array.from(customerMap.values()).sort((a, b) => {
    const aTime = new Date(a.firstSeenDate || 0).getTime();
    const bTime = new Date(b.firstSeenDate || 0).getTime();

    return bTime - aTime || b.setupPercent - a.setupPercent;
  });

  const customersBySpend = [...customers].sort(
    (a, b) => b.totalSpend - a.totalSpend,
  );

  const cleanupRecords: CleanupCustomerRecord[] = [];
  const orphanCustomerMap = new Map<string, CleanupCustomerRecord>();

  function upsertOrphanRecord({
    id,
    sourceTable,
    name,
    email,
    createdAt,
    bookingAmount = 0,
    bookingCount = 0,
    petCount = 0,
    messageCount = 0,
  }: {
    id: string;
    sourceTable: string;
    name?: string;
    email?: string;
    createdAt?: string | null;
    bookingAmount?: number;
    bookingCount?: number;
    petCount?: number;
    messageCount?: number;
  }) {
    if (!id || profileIds.has(id)) return;
    if (demoProfileIds.has(id)) return;

    const current =
      orphanCustomerMap.get(id) ||
      {
        id,
        name: name || "Orphaned Pet Parent ID",
        email: email || "",
        phone: "",
        sourceTable,
        issue: "Orphaned Pet Parent reference",
        reason: "No matching profile row",
        bookingCount: 0,
        petCount: 0,
        messageCount: 0,
        totalSpend: 0,
        createdAt: createdAt || null,
        safeToDelete: false,
      };

    current.sourceTable = current.sourceTable.includes(sourceTable)
      ? current.sourceTable
      : `${current.sourceTable}, ${sourceTable}`;
    current.name =
      current.name === "Orphaned Pet Parent ID" && name ? name : current.name;
    current.email = current.email || email || "";
    current.bookingCount += bookingCount;
    current.petCount += petCount;
    current.messageCount += messageCount;
    current.totalSpend += bookingAmount;
    current.createdAt = getOldestDate([current.createdAt, createdAt || null]);
    current.reason = getCleanupReason({
      profile: null,
      bookingCount: current.bookingCount,
      petCount: current.petCount,
      messageCount: current.messageCount,
      totalSpend: current.totalSpend,
    });
    current.safeToDelete =
      !current.email &&
      current.bookingCount === 0 &&
      current.petCount === 0 &&
      current.messageCount === 0 &&
      current.totalSpend === 0;

    orphanCustomerMap.set(id, current);
  }

  for (const booking of nonDemoBookings) {
    const directIds = [
      booking.customer_id,
      booking.pet_owner_id,
      booking.pet_parent_id,
      booking.client_id,
      booking.user_id,
    ]
      .map((value) => asString(value))
      .filter(Boolean);

    for (const id of directIds) {
      upsertOrphanRecord({
        id,
        sourceTable: "bookings",
        name: getDisplayName(booking as AnyRow, "Orphaned booking Pet Parent"),
        email: asString(booking.customer_email),
        createdAt: booking.created_at || getBookingDate(booking),
        bookingAmount: getBookingAmount(booking),
        bookingCount: 1,
      });
    }
  }

  for (const pet of nonDemoPets) {
    const directIds = [
      pet.owner_profile_id,
      pet.owner_id,
      pet.customer_id,
      pet.pet_parent_id,
      pet.user_id,
      pet.pet_owner_id,
    ]
      .map((value) => asString(value))
      .filter(Boolean);

    for (const id of directIds) {
      upsertOrphanRecord({
        id,
        sourceTable: "pets",
        name: getDisplayName(pet as AnyRow, "Orphaned pet owner"),
        createdAt: pet.created_at || null,
        petCount: 1,
      });
    }
  }

  for (const message of nonDemoMessages) {
    for (const id of getMessageParticipantIds(message)) {
      upsertOrphanRecord({
        id,
        sourceTable: "messages",
        createdAt: message.created_at || null,
        messageCount: 1,
      });
    }
  }

  cleanupRecords.push(
    ...Array.from(orphanCustomerMap.values())
      .sort((a, b) => {
        if (a.safeToDelete !== b.safeToDelete) return a.safeToDelete ? -1 : 1;
        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      })
      .slice(0, 25),
  );

  const signupRows = [...launchSignups, ...launchWaitlist];
  const clickRows = [...referralClicks, ...networkClicks];
  const conversionRows = referralConversions;
  const campaignRows = [
    ...signupRows,
    ...clickRows,
    ...conversionRows,
    ...partnerCampaigns,
  ];

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

  const setupMetrics = {
    newSignups: customers.filter((customer) =>
      isWithinLastDays(customer.firstSeenDate, 30),
    ).length,
    profileStarted: customers.filter((customer) => customer.hasProfileInfo).length,
    contactVerified: customers.filter((customer) => customer.hasVerifiedContact).length,
    phoneAdded: customers.filter((customer) => customer.hasPhone).length,
    locationAdded: customers.filter((customer) => customer.hasLocation).length,
    petsAdded: customers.filter((customer) => customer.hasPet).length,
    readyToBook: customers.filter(
      (customer) => customer.setupStatus === "Ready to Book",
    ).length,
    bookingsStarted: customers.filter((customer) => customer.hasStartedBooking)
      .length,
    bookingsCompleted: customers.filter((customer) => customer.hasCompletedBooking)
      .length,
    needsReview: customers.filter((customer) => customer.needsReview).length,
  };

  const locationInsights = {
    zipCodes: buildLocationInsights(customersBySpend, "zipCode"),
    cities: buildLocationInsights(customersBySpend, "city"),
    states: buildLocationInsights(customersBySpend, "state"),
    countries: buildLocationInsights(customersBySpend, "country"),
  };

  const sourceInsights = buildSourceInsights(
    customersBySpend,
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
        helper: "Signup/profile created but no completed booking yet",
      },
    ],
    setup: [
      {
        label: "Profile Started",
        value: setupMetrics.profileStarted,
        helper: "Name and email found",
      },
      {
        label: "Phone Added",
        value: setupMetrics.phoneAdded,
        helper: "Phone number available",
      },
      {
        label: "Location Added",
        value: setupMetrics.locationAdded,
        helper: "City, state, or ZIP found",
      },
      {
        label: "Pet Added",
        value: setupMetrics.petsAdded,
        helper: "At least one pet profile",
      },
      {
        label: "Booking Started",
        value: setupMetrics.bookingsStarted,
        helper: "At least one booking record",
      },
      {
        label: "Booking Completed",
        value: setupMetrics.bookingsCompleted,
        helper: "Completed or paid booking",
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
    customers,
    customersBySpend,
    cleanupRecords,
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
      setupMetrics,
      socialSignups: socialSignupRows.length,
      socialCustomers: socialCustomers.length,
      socialBookings,
      socialRevenue,
      socialClicks,
      topSocialPlatform: socialSourceInsights[0]?.label || "None yet",
      hiddenDemoRows,
      cleanupRecords: cleanupRecords.length,
      safeDeleteCandidates: cleanupRecords.filter((record) => record.safeToDelete)
        .length,
    },
  };
}

export default async function AdminPetParentsPage() {
  const data = await getPetParentsData();

  return (
    <main className="min-h-screen bg-[#f9faf5] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1700px] space-y-5">
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
                <p className="mt-1 max-w-5xl text-base font-semibold text-slate-600">
                  All-in-one Super Admin view for Pet Parent signups, profile
                  setup progress, contact status, pets, bookings, spend, source
                  attribution, messages, and records that need review.
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
            label="Total Pet Parents"
            value={number(data.metrics.totalCustomers)}
            detail="All real Pet Parent profile rows found in Supabase"
          />

          <StatCard
            icon={<UserCheck size={22} />}
            label="New Signups"
            value={number(data.metrics.setupMetrics.newSignups)}
            detail="Pet Parents created within the last 30 days"
          />

          <StatCard
            icon={<ShieldCheck size={22} />}
            label="Ready to Book"
            value={number(data.metrics.setupMetrics.readyToBook)}
            detail="Profile, phone, location, and pet are completed"
          />

          <StatCard
            icon={<AlertTriangle size={22} />}
            label="Needs Review"
            value={number(data.metrics.setupMetrics.needsReview)}
            detail="Missing profile, phone, location, or pet setup"
          />

          <StatCard
            icon={<TrendingUp size={22} />}
            label="Active Last 30 Days"
            value={number(data.metrics.activeCustomersLast30)}
            detail={`${data.metrics.averageBookingsPerCustomer.toFixed(
              1,
            )} avg bookings per Pet Parent`}
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={<Mail size={22} />}
            label="Profile Started"
            value={number(data.metrics.setupMetrics.profileStarted)}
            detail="Name and email information found"
          />

          <StatCard
            icon={<UserRound size={22} />}
            label="Phone Added"
            value={number(data.metrics.setupMetrics.phoneAdded)}
            detail="Phone number is available on profile"
          />

          <StatCard
            icon={<MapPin size={22} />}
            label="Location Added"
            value={number(data.metrics.setupMetrics.locationAdded)}
            detail="City, state, or ZIP is available"
          />

          <StatCard
            icon={<PawPrint size={22} />}
            label="Pets Added"
            value={number(data.metrics.setupMetrics.petsAdded)}
            detail="At least one pet profile is attached"
          />

          <StatCard
            icon={<CalendarDays size={22} />}
            label="Bookings Started"
            value={number(data.metrics.setupMetrics.bookingsStarted)}
            detail={`${number(
              data.metrics.setupMetrics.bookingsCompleted,
            )} completed or paid`}
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={<CircleDollarSign size={22} />}
            label="Lifetime Value"
            value={money(data.metrics.averageLifetimeValue)}
            detail={`${money(data.metrics.totalRevenue)} total Pet Parent spend`}
          />

          <StatCard
            icon={<Repeat2 size={22} />}
            label="Repeat Rate"
            value={`${data.metrics.repeatRate.toFixed(1)}%`}
            detail={`${number(data.metrics.repeatCustomers)} repeat Pet Parents`}
          />

          <StatCard
            icon={<Share2 size={22} />}
            label="Social Signups"
            value={number(data.metrics.socialSignups)}
            detail="Launch signups or waitlist rows from social"
          />

          <StatCard
            icon={<MousePointerClick size={22} />}
            label="Social Clicks"
            value={number(data.metrics.socialClicks)}
            detail={`Top platform: ${data.metrics.topSocialPlatform}`}
          />

          <StatCard
            icon={<Trash2 size={22} />}
            label="Cleanup Review"
            value={number(data.metrics.cleanupRecords)}
            detail={`${number(
              data.metrics.safeDeleteCandidates,
            )} safe-delete candidates · ${number(
              data.metrics.hiddenDemoRows,
            )} demo/test rows hidden`}
          />
        </section>

        <PetParentRegistryPanel customers={data.customers} />

        <section className="grid items-start gap-5 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <DashboardCard>
              <div className="mb-5">
                <h2 className="text-xl font-black text-slate-950">
                  Setup Progress
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Step-by-step view of where Pet Parents are in signup and
                  profile setup.
                </p>
              </div>

              <div className="space-y-4">
                {data.chartData.setup.map((item) => (
                  <SetupMetricRow key={item.label} item={item} />
                ))}
              </div>
            </DashboardCard>
          </div>

          <div className="xl:col-span-3">
            <DashboardCard>
              <div className="mb-5">
                <h2 className="text-xl font-black text-slate-950">
                  Pet Parent Segments
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
                  detail="Signup/profile created but no booking yet"
                  tone="slate"
                />
              </div>
            </DashboardCard>
          </div>

          <div className="xl:col-span-4">
            <DashboardCard>
              <div className="mb-5">
                <h2 className="text-xl font-black text-slate-950">
                  Acquisition Sources
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Revenue, Pet Parents, and signups grouped by source.
                </p>
              </div>

              <HorizontalBarChart
                title="Top Acquisition Sources"
                valueLabel="Revenue"
                items={data.chartData.topSources}
                valueFormatter={money}
              />

              <div className="mt-5">
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
                  Pet Parent Locations
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Ranked by Pet Parent spend from profile and booking location
                  fields.
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
                  Location Revenue
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

        {data.cleanupRecords.length ? (
          <CleanupReviewPanel records={data.cleanupRecords} />
        ) : null}

        <section className="grid gap-5 lg:grid-cols-3">
          <QuickLinkCard
            href={adminRoutes.launchSignups}
            icon={<Megaphone size={22} />}
            title="Launch Signups"
            description="Review waitlist, launch, and acquisition-source rows that feed Pet Parent reporting."
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
            description="Open the admin booking manager to review Pet Parent booking history behind these numbers."
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
            title="Pet Parent Messages"
            description="Jump into Pet Parent and Guru conversations that may need admin attention."
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
          deleted rows are filtered in-memory before Pet Parent KPIs, setup
          progress, source charts, location charts, and review queues are
          calculated from live rows.
        </div>
      </div>
    </main>
  );
}

function getCustomerProfileHref(customerId: string) {
  return `/admin/customers/${encodeURIComponent(customerId)}`;
}

function getLocationLabel(customer: CustomerInsight) {
  const cityState = [customer.city, customer.state].filter(Boolean).join(", ");

  if (cityState && customer.zipCode) return `${cityState} ${customer.zipCode}`;
  return cityState || customer.zipCode || "Location not added";
}

function getLastActivity(customer: CustomerInsight) {
  return getMostRecentDate([customer.lastBookingDate, customer.firstSeenDate]);
}

function PetParentRegistryPanel({ customers }: { customers: CustomerInsight[] }) {
  return (
    <DashboardCard>
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
            Super Admin Pet Parent Registry
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">
            Pet Parent signup and profile setup tracker
          </h2>
          <p className="mt-1 max-w-5xl text-sm font-semibold leading-6 text-slate-500">
            Click any Pet Parent to open the full Super Admin profile. This
            table shows where each person is in the signup process, what is
            complete, and what still needs attention.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={adminRoutes.customerExport}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
          >
            <Download size={16} />
            Export
          </Link>

          <Link
            href={adminRoutes.messages}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-green-900"
          >
            <Mail size={16} />
            Messages
          </Link>
        </div>
      </div>

      {customers.length ? (
        <div className="overflow-hidden rounded-[26px] border border-[#e3ece5] bg-white">
          <div className="hidden grid-cols-[1.35fr_0.85fr_0.9fr_1.35fr_0.75fr_0.75fr_0.8fr_0.75fr] gap-3 border-b border-[#e3ece5] bg-[#fbfcf9] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400 xl:grid">
            <span>Pet Parent</span>
            <span>Contact</span>
            <span>Location</span>
            <span>Setup Progress</span>
            <span>Pets</span>
            <span>Bookings</span>
            <span>Spend</span>
            <span className="text-right">Action</span>
          </div>

          <div className="divide-y divide-[#e3ece5]">
            {customers.map((customer) => (
              <Link
                key={customer.id}
                href={getCustomerProfileHref(customer.id)}
                className="grid gap-4 px-4 py-4 transition hover:bg-green-50/70 xl:grid-cols-[1.35fr_0.85fr_0.9fr_1.35fr_0.75fr_0.75fr_0.8fr_0.75fr] xl:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-green-800 text-sm font-black text-white">
                      {customer.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={customer.avatarUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        customer.name.slice(0, 1).toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">
                        {customer.name}
                      </p>
                      <p className="truncate text-xs font-bold text-slate-500">
                        Signed up {formatDate(customer.firstSeenDate)}
                      </p>
                      <p className="mt-1 truncate text-xs font-bold text-green-700">
                        Source: {customer.source}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="truncate text-xs font-black text-slate-950">
                    {customer.email || "No email"}
                  </p>
                  <p className="truncate text-xs font-bold text-slate-500">
                    {customer.phone || "No phone"}
                  </p>
                </div>

                <p className="text-sm font-bold text-slate-600">
                  {getLocationLabel(customer)}
                </p>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-black",
                        customer.needsReview
                          ? "bg-amber-100 text-amber-900"
                          : "bg-green-100 text-green-800",
                      ].join(" ")}
                    >
                      {customer.setupStatus}
                    </span>
                    <span className="text-xs font-black text-slate-500">
                      {customer.setupPercent}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-green-800"
                      style={{ width: `${customer.setupPercent}%` }}
                    />
                  </div>

                  <p className="mt-2 text-xs font-bold text-slate-500">
                    Current step: {customer.currentStep}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {customer.setupSteps.slice(0, 6).map((step) => (
                      <span
                        key={step.label}
                        title={step.label}
                        className={[
                          "h-2.5 w-2.5 rounded-full",
                          step.complete ? "bg-green-700" : "bg-slate-200",
                        ].join(" ")}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-sm font-black text-slate-950">
                  {number(customer.petCount)}
                </p>

                <div>
                  <p className="text-sm font-black text-slate-950">
                    {number(customer.bookingCount)}
                  </p>
                  <p className="text-xs font-bold text-slate-500">
                    {number(customer.completedBookingCount)} completed
                  </p>
                </div>

                <div>
                  <p className="text-sm font-black text-green-800">
                    {money(customer.totalSpend)}
                  </p>
                  <p className="text-xs font-bold text-slate-500">
                    Last: {formatDate(getLastActivity(customer))}
                  </p>
                </div>

                <div className="flex justify-start xl:justify-end">
                  <span className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-2 text-xs font-black text-white shadow-sm">
                    View
                    <MousePointerClick size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-green-200 bg-green-50/60 p-8 text-center">
          <Search className="mx-auto h-8 w-8 text-green-800" />
          <h3 className="mt-3 text-xl font-black text-slate-950">
            No Pet Parent profiles found yet
          </h3>
          <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
            New Pet Parent signups should appear here once the signup flow
            creates a `profiles` row with customer, Pet Parent, or both role
            mapping.
          </p>
        </div>
      )}
    </DashboardCard>
  );
}

function escapeSqlValue(value: string) {
  return value.replace(/'/g, "''");
}

function buildCleanupReviewSql(record: CleanupCustomerRecord) {
  const id = escapeSqlValue(record.id);

  return [
    "-- 1) Check whether this ID exists as a Pet Parent profile",
    "select id, email, phone, full_name, role, created_at, updated_at",
    "from profiles",
    `where id = '${id}';`,
    "",
    "-- 2) Check whether this ID exists as a Supabase Auth user",
    "select id, email, phone, email_confirmed_at, phone_confirmed_at, created_at, last_sign_in_at",
    "from auth.users",
    `where id = '${id}';`,
    "",
    "-- 3) Check related pet records",
    "select id, name, owner_id, owner_profile_id, customer_id, pet_parent_id, user_id, pet_owner_id, created_at",
    "from pets",
    `where owner_id = '${id}'`,
    `   or owner_profile_id = '${id}'`,
    `   or customer_id = '${id}'`,
    `   or pet_parent_id = '${id}'`,
    `   or user_id = '${id}'`,
    `   or pet_owner_id = '${id}'`,
    "order by created_at desc;",
    "",
    "-- 4) Check related booking/payment records",
    "select id, customer_id, pet_owner_id, pet_parent_id, client_id, user_id, customer_email, status, payment_status, total_amount, customer_total_amount, created_at",
    "from bookings",
    `where customer_id = '${id}'`,
    `   or pet_owner_id = '${id}'`,
    `   or pet_parent_id = '${id}'`,
    `   or client_id = '${id}'`,
    `   or user_id = '${id}'`,
    "order by created_at desc;",
    "",
    "-- 5) Check related message records",
    "select id, sender_id, recipient_id, customer_id, user_id, from_user_id, to_user_id, status, is_read, created_at",
    "from messages",
    `where sender_id = '${id}'`,
    `   or recipient_id = '${id}'`,
    `   or customer_id = '${id}'`,
    `   or user_id = '${id}'`,
    `   or from_user_id = '${id}'`,
    `   or to_user_id = '${id}'`,
    "order by created_at desc;",
  ].join("\n");
}

function buildCleanupDeleteSql(record: CleanupCustomerRecord) {
  const id = escapeSqlValue(record.id);

  if (!record.safeToDelete) {
    return [
      "-- This record is protected because it still has related activity.",
      "-- Review attached pets, messages, bookings, and auth/profile rows first.",
      "-- Do not hard-delete protected Pet Parent activity from a live system until confirmed fake/test.",
    ].join("\n");
  }

  return [
    "-- Safe-delete candidate cleanup SQL.",
    "-- Run the review SQL first. Only run this if the review confirms it is fake/test/empty.",
    "begin;",
    "",
    "delete from messages",
    `where sender_id = '${id}'`,
    `   or recipient_id = '${id}'`,
    `   or customer_id = '${id}'`,
    `   or user_id = '${id}'`,
    `   or from_user_id = '${id}'`,
    `   or to_user_id = '${id}';`,
    "",
    "delete from pets",
    `where owner_id = '${id}'`,
    `   or owner_profile_id = '${id}'`,
    `   or customer_id = '${id}'`,
    `   or pet_parent_id = '${id}'`,
    `   or user_id = '${id}'`,
    `   or pet_owner_id = '${id}';`,
    "",
    "delete from bookings",
    `where customer_id = '${id}'`,
    `   or pet_owner_id = '${id}'`,
    `   or pet_parent_id = '${id}'`,
    `   or client_id = '${id}'`,
    `   or user_id = '${id}';`,
    "",
    "delete from profiles",
    `where id = '${id}';`,
    "",
    "commit;",
  ].join("\n");
}

function getCleanupDecision(record: CleanupCustomerRecord) {
  if (record.safeToDelete) {
    return "Safe-delete candidate because there is no contact information, no pets, no bookings, no messages, and no spend.";
  }

  if (record.bookingCount > 0 || record.totalSpend > 0) {
    return "Protected. This record has booking or payment activity. Archive/reconcile only after confirming it is fake or test data.";
  }

  if (record.petCount > 0) {
    return "Protected. This record has pet records attached. Review pet names and owner references before deleting.";
  }

  if (record.messageCount > 0) {
    return "Protected. This record has messages attached. Review the message thread before deleting.";
  }

  return "Protected for review. Confirm whether this is a partial signup, orphan reference, or test data before deleting.";
}

function DashboardCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      {children}
    </div>
  );
}

function CleanupReviewPanel({ records }: { records: CleanupCustomerRecord[] }) {
  const safeDeleteCount = records.filter((record) => record.safeToDelete).length;
  const protectedCount = records.length - safeDeleteCount;

  return (
    <section className="rounded-[30px] border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-amber-800">
            <AlertTriangle size={15} />
            Pet Parent Cleanup Queue
          </div>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
            Orphaned records are hidden from visible Pet Parents.
          </h2>

          <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-700">
            These records do not count as live Pet Parents. Use the review panel
            on each row to confirm whether it is a real partial signup, an old
            test record, or an orphaned reference from pets/messages/bookings.
            Protected records should not be hard-deleted until the attached
            activity is reviewed.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-black text-amber-900">
          {number(safeDeleteCount)} safe to delete · {number(protectedCount)} protected · {number(records.length)} total review records
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-amber-200 bg-white">
        <div className="grid gap-3 border-b border-amber-100 bg-amber-100/70 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-amber-900 md:grid-cols-[1.25fr_0.85fr_1.3fr_0.7fr]">
          <div>Record</div>
          <div>Status</div>
          <div>Reason</div>
          <div>Action</div>
        </div>

        <div className="divide-y divide-amber-100">
          {records.map((record) => {
            const reviewSql = buildCleanupReviewSql(record);
            const deleteSql = buildCleanupDeleteSql(record);
            const decision = getCleanupDecision(record);

            return (
              <details
                key={`${record.sourceTable}-${record.id}`}
                className="group"
              >
                <summary className="grid cursor-pointer list-none gap-3 px-4 py-4 text-sm transition hover:bg-amber-50 md:grid-cols-[1.25fr_0.85fr_1.3fr_0.7fr] md:items-center">
                  <div className="min-w-0">
                    <p className="truncate font-black text-slate-950">
                      {record.name}
                    </p>
                    <p className="mt-1 truncate text-xs font-bold text-slate-500">
                      {record.email || record.phone || record.id}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-400">
                      Source: {record.sourceTable} · Created {formatDate(record.createdAt)}
                    </p>
                  </div>

                  <div>
                    <span
                      className={[
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black",
                        record.safeToDelete
                          ? "border-rose-200 bg-rose-50 text-rose-800"
                          : "border-sky-200 bg-sky-50 text-sky-800",
                      ].join(" ")}
                    >
                      {record.safeToDelete ? (
                        <Trash2 size={14} />
                      ) : (
                        <ShieldCheck size={14} />
                      )}
                      {record.safeToDelete ? "Safe Delete Candidate" : "Review / Protect"}
                    </span>
                  </div>

                  <div>
                    <p className="font-bold leading-6 text-slate-700">
                      {record.reason}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {number(record.bookingCount)} bookings · {number(record.petCount)} pets · {number(record.messageCount)} messages · {money(record.totalSpend)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span
                      className={[
                        "inline-flex items-center justify-center rounded-2xl border px-3 py-2 text-xs font-black transition",
                        record.safeToDelete
                          ? "border-rose-200 bg-rose-50 text-rose-800 group-open:bg-rose-100"
                          : "border-sky-200 bg-sky-50 text-sky-800 group-open:bg-sky-100",
                      ].join(" ")}
                    >
                      Review Details
                    </span>
                  </div>
                </summary>

                <div className="border-t border-amber-100 bg-[#fffaf0] px-4 py-5">
                  <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-amber-200 bg-white p-4">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-900">
                          Admin Decision Guide
                        </p>
                        <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                          {decision}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                          Record Signals
                        </p>

                        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="font-black text-slate-500">ID</dt>
                            <dd className="mt-1 break-all font-bold text-slate-900">
                              {record.id}
                            </dd>
                          </div>

                          <div>
                            <dt className="font-black text-slate-500">Source Table</dt>
                            <dd className="mt-1 font-bold text-slate-900">
                              {record.sourceTable}
                            </dd>
                          </div>

                          <div>
                            <dt className="font-black text-slate-500">Email</dt>
                            <dd className="mt-1 font-bold text-slate-900">
                              {record.email || "None found"}
                            </dd>
                          </div>

                          <div>
                            <dt className="font-black text-slate-500">Phone</dt>
                            <dd className="mt-1 font-bold text-slate-900">
                              {record.phone || "None found"}
                            </dd>
                          </div>

                          <div>
                            <dt className="font-black text-slate-500">Bookings</dt>
                            <dd className="mt-1 font-bold text-slate-900">
                              {number(record.bookingCount)}
                            </dd>
                          </div>

                          <div>
                            <dt className="font-black text-slate-500">Pets</dt>
                            <dd className="mt-1 font-bold text-slate-900">
                              {number(record.petCount)}
                            </dd>
                          </div>

                          <div>
                            <dt className="font-black text-slate-500">Messages</dt>
                            <dd className="mt-1 font-bold text-slate-900">
                              {number(record.messageCount)}
                            </dd>
                          </div>

                          <div>
                            <dt className="font-black text-slate-500">Spend</dt>
                            <dd className="mt-1 font-bold text-slate-900">
                              {money(record.totalSpend)}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                          Supabase Review SQL
                        </p>
                        <pre className="mt-3 max-h-[420px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs font-semibold leading-6 text-slate-100">
                          <code>{reviewSql}</code>
                        </pre>
                      </div>

                      <div
                        className={[
                          "rounded-2xl border bg-white p-4",
                          record.safeToDelete
                            ? "border-rose-200"
                            : "border-sky-200",
                        ].join(" ")}
                      >
                        <p
                          className={[
                            "text-xs font-black uppercase tracking-[0.12em]",
                            record.safeToDelete
                              ? "text-rose-900"
                              : "text-sky-900",
                          ].join(" ")}
                        >
                          {record.safeToDelete ? "Safe Delete SQL" : "Protected Delete Block"}
                        </p>
                        <pre className="mt-3 max-h-[300px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs font-semibold leading-6 text-slate-100">
                          <code>{deleteSql}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-500">{detail}</p>
    </div>
  );
}

function SetupMetricRow({ item }: { item: ChartItem }) {
  return (
    <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-950">{item.label}</p>
          {item.helper ? (
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {item.helper}
            </p>
          ) : null}
        </div>

        <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-black text-green-800">
          {number(item.value)}
        </span>
      </div>
    </div>
  );
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
    green: "bg-emerald-100 text-emerald-900",
    blue: "bg-sky-100 text-sky-900",
    orange: "bg-amber-100 text-amber-900",
    slate: "bg-slate-100 text-slate-800",
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
      <div>
        <p className="text-sm font-black text-slate-950">{label}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
      </div>

      <span
        className={`rounded-full px-4 py-2 text-sm font-black ${toneClasses[tone]}`}
      >
        {number(value)}
      </span>
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
    <div className="grid items-center gap-5">
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
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{
                  backgroundColor: chartColors[index % chartColors.length],
                }}
              />
              <span className="text-slate-700">{item.label}</span>
            </div>
            <span className="text-slate-950">{number(item.value)}</span>
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