import type { ReactNode } from "react";
import Link from "next/link";
import {
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
  type?: string | null;
  breed?: string | null;
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

function formatDate(value?: string | null) {
  if (!value) return "Not available";

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "Not available";
  }
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

function getDisplayName(row: AnyRow, fallback = "Customer") {
  const fullName = getText(row, [
    "full_name",
    "display_name",
    "name",
    "customer_name",
    "pet_parent_name",
    "owner_name",
  ]);

  if (fullName) return fullName;

  const firstName = getText(row, ["first_name"]);
  const lastName = getText(row, ["last_name"]);
  const combinedName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return combinedName || fallback;
}

function getRole(row: AnyRow) {
  return getText(row, ["role", "user_role", "account_type", "type"]).toLowerCase();
}

function isCustomerProfile(profile: ProfileRow) {
  const role = getRole(profile as AnyRow);

  if (!role) return true;

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

  return validDates
    .sort((a, b) => b.getTime() - a.getTime())[0]
    .toISOString();
}

function getOldestDate(values: Array<string | null>) {
  const validDates = values
    .filter(Boolean)
    .map((value) => new Date(value as string))
    .filter((date) => Number.isFinite(date.getTime()));

  if (!validDates.length) return null;

  return validDates
    .sort((a, b) => a.getTime() - b.getTime())[0]
    .toISOString();
}

function getCustomerSegment(customer: CustomerInsight) {
  if (customer.totalSpend >= 1000 || customer.bookingCount >= 8) return "VIP";
  if (customer.bookingCount >= 3) return "Repeat";
  if (customer.bookingCount >= 1) return "New";

  return "Lead";
}

function getCity(row: AnyRow) {
  return getText(row, ["city", "customer_city", "location_city"]);
}

function getState(row: AnyRow) {
  return getText(row, ["state", "State", "state_code", "customer_state"]);
}

function getCountry(row: AnyRow) {
  return getText(row, ["country", "customer_country"], "US");
}

function getZipCode(row: AnyRow) {
  return getText(row, [
    "zip",
    "zipcode",
    "zip_code",
    "postal_code",
    "customer_zip",
    "customer_zip_code",
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
    helper: `${number(row.customers)} customers · ${number(row.bookings)} bookings`,
  }));
}

function toChartItemsFromSources(rows: SourceInsight[]) {
  return rows.map((row) => ({
    label: row.label,
    value: row.revenue,
    helper: `${number(row.customers)} customers · ${number(row.signups)} signups`,
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

  const hiddenCustomerIds = new Set(
    rawProfiles
      .filter((profile) => isDemoLikeRow(profile as AnyRow))
      .map((profile) => profile.id)
      .filter(Boolean),
  );

  const profiles = rawProfiles.filter(
    (profile) =>
      isCustomerProfile(profile) &&
      !isDemoLikeRow(profile as AnyRow) &&
      !hiddenCustomerIds.has(profile.id),
  );
  const bookings = rawBookings.filter(
    (booking) =>
      !isDemoLikeRow(booking as AnyRow) &&
      !hasHiddenCustomerReference(booking as AnyRow, hiddenCustomerIds),
  );
  const pets = rawPets.filter(
    (pet) =>
      !isDemoLikeRow(pet as AnyRow) &&
      !hasHiddenCustomerReference(pet as AnyRow, hiddenCustomerIds),
  );
  const messages = rawMessages.filter(
    (message) =>
      !isDemoLikeRow(message as AnyRow) &&
      !hasHiddenCustomerReference(message as AnyRow, hiddenCustomerIds),
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

  const signupRows = [...launchSignups, ...launchWaitlist];
  const clickRows = [...referralClicks, ...networkClicks];
  const conversionRows = referralConversions;
  const campaignRows = [...signupRows, ...clickRows, ...conversionRows, ...partnerCampaigns];

  const customerMap = new Map<string, CustomerInsight>();

  for (const profile of profiles) {
    if (!profile.id) continue;

    const source = normalizeSource(getSource(profile as AnyRow));

    customerMap.set(profile.id, {
      id: profile.id,
      name: getDisplayName(profile as AnyRow, "Customer"),
      email: profile.email || "",
      avatarUrl: profile.avatar_url || "",
      city: getCity(profile as AnyRow),
      state: getState(profile as AnyRow),
      country: getCountry(profile as AnyRow),
      zipCode: getZipCode(profile as AnyRow),
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

    const existing =
      customerMap.get(fallbackId) ||
      {
        id: fallbackId,
        name: getDisplayName(booking as AnyRow, "Customer"),
        email: booking.customer_email || "",
        avatarUrl: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
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
      };

    const bookingDate = getBookingDate(booking);

    existing.city = existing.city || getCity(booking as AnyRow);
    existing.state = existing.state || getState(booking as AnyRow);
    existing.country = existing.country || getCountry(booking as AnyRow);
    existing.zipCode = existing.zipCode || getZipCode(booking as AnyRow);
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

  const customers = Array.from(customerMap.values()).map((customer) => {
    const averageBookingValue =
      customer.bookingCount > 0 ? customer.totalSpend / customer.bookingCount : 0;

    const enriched = {
      ...customer,
      averageBookingValue,
    };

    return {
      ...enriched,
      segment: getCustomerSegment(enriched),
    };
  });

  const sortedCustomers = customers.sort((a, b) => b.totalSpend - a.totalSpend);

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
    },
  };
}

function getCustomerProfileHref(customerId: string) {
  return `/admin/customers/${encodeURIComponent(customerId)}`;
}

function getCustomerStatus(customer: CustomerInsight) {
  if (customer.completedBookingCount > 0) return "Active Pet Parent";
  if (customer.bookingCount > 0) return "Booking Started";
  if (customer.petCount > 0) return "Pet Profile Added";
  if (customer.messageCount > 0) return "Messaging";
  return "Registered";
}

function getCustomerLocationLabel(customer: CustomerInsight) {
  const cityState = [customer.city, customer.state].filter(Boolean).join(", ");

  if (cityState && customer.zipCode) {
    return `${cityState} ${customer.zipCode}`;
  }

  return cityState || customer.zipCode || "Location not added yet";
}

function CustomerRegistryPanel({ customers }: { customers: CustomerInsight[] }) {
  const recentCustomers = [...customers]
    .sort((a, b) => {
      const aTime = a.firstSeenDate ? new Date(a.firstSeenDate).getTime() : 0;
      const bTime = b.firstSeenDate ? new Date(b.firstSeenDate).getTime() : 0;

      return bTime - aTime;
    })
    .slice(0, 12);

  return (
    <DashboardCard>
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
            Super Admin Pet Parent Registry
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">
            Click a Pet Parent to open the full profile
          </h2>
          <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-slate-500">
            This gives Super Admin a simple front-door list of real customer /
            Pet Parent records before the deeper charts and reporting sections.
          </p>
        </div>

        <Link
          href={adminRoutes.customers}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
        >
          <Users size={17} />
          Open Customers
        </Link>
      </div>

      {recentCustomers.length ? (
        <div className="overflow-hidden rounded-[24px] border border-[#edf3ee] bg-[#fbfcf9]">
          <div className="hidden grid-cols-[1.45fr_1fr_0.8fr_0.8fr_0.8fr_0.75fr] gap-3 border-b border-[#e3ece5] bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400 lg:grid">
            <span>Pet Parent</span>
            <span>Location</span>
            <span>Status</span>
            <span>Bookings</span>
            <span>Spend</span>
            <span className="text-right">Profile</span>
          </div>

          <div className="divide-y divide-[#e3ece5]">
            {recentCustomers.map((customer) => (
              <Link
                key={customer.id}
                href={getCustomerProfileHref(customer.id)}
                className="grid gap-3 bg-white px-4 py-4 transition hover:bg-green-50/60 lg:grid-cols-[1.45fr_1fr_0.8fr_0.8fr_0.8fr_0.75fr] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-green-800 text-sm font-black text-white">
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
                        {customer.email || "No email on profile yet"}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-sm font-bold text-slate-600">
                  {getCustomerLocationLabel(customer)}
                </p>

                <div>
                  <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-800">
                    {getCustomerStatus(customer)}
                  </span>
                </div>

                <p className="text-sm font-black text-slate-950">
                  {number(customer.bookingCount)}
                  <span className="ml-1 text-xs font-bold text-slate-400">
                    total
                  </span>
                </p>

                <p className="text-sm font-black text-green-800">
                  {money(customer.totalSpend)}
                </p>

                <div className="flex justify-start lg:justify-end">
                  <span className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-2 text-xs font-black text-white shadow-sm">
                    View Profile
                    <MousePointerClick size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-green-200 bg-green-50/60 p-6 text-sm font-bold leading-6 text-green-900">
          No visible Pet Parent profiles were found yet. New Google/email/phone
          signups should appear here once their `profiles` row is created with
          the customer/Pet Parent role.
        </div>
      )}
    </DashboardCard>
  );
}

export default async function AdminCustomerIntelligencePage() {
  const data = await getCustomerIntelligenceData();

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
                  Admin / Customer Intelligence
                </p>
                <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-4xl">
                  Customer Intelligence
                </h1>
                <p className="mt-1 max-w-4xl text-base font-semibold text-slate-600">
                  Live Supabase insights for real Pet Parent value, repeat
                  behavior, location demand, source attribution, social growth,
                  and exportable reporting with demo/test rows filtered out.
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
            label="Customers"
            value={number(data.metrics.totalCustomers)}
            detail="Real Pet Parent profiles plus customer IDs found in bookings"
          />

          <StatCard
            icon={<CircleDollarSign size={22} />}
            label="Lifetime Value"
            value={money(data.metrics.averageLifetimeValue)}
            detail={`${money(data.metrics.totalRevenue)} total customer spend`}
          />

          <StatCard
            icon={<Repeat2 size={22} />}
            label="Repeat Rate"
            value={`${data.metrics.repeatRate.toFixed(1)}%`}
            detail={`${number(data.metrics.repeatCustomers)} repeat customers`}
          />

          <StatCard
            icon={<TrendingUp size={22} />}
            label="Active Last 30 Days"
            value={number(data.metrics.activeCustomersLast30)}
            detail={`${data.metrics.averageBookingsPerCustomer.toFixed(
              1,
            )} avg bookings per customer`}
          />

          <StatCard
            icon={<Search size={22} />}
            label="Demo Rows Hidden"
            value={number(data.metrics.hiddenDemoRows)}
            detail="Filtered from live customer, booking, pet, message, and growth KPIs"
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={<Share2 size={22} />}
            label="Social Signups"
            value={number(data.metrics.socialSignups)}
            detail="Launch signups or waitlist rows from social"
          />

          <StatCard
            icon={<Users size={22} />}
            label="Social Customers"
            value={number(data.metrics.socialCustomers)}
            detail="Customers attributed to social sources"
          />

          <StatCard
            icon={<CalendarDays size={22} />}
            label="Social Bookings"
            value={number(data.metrics.socialBookings)}
            detail="Bookings from social-attributed customers"
          />

          <StatCard
            icon={<CircleDollarSign size={22} />}
            label="Social Revenue"
            value={money(data.metrics.socialRevenue)}
            detail="Customer spend attributed to social"
          />

          <StatCard
            icon={<MousePointerClick size={22} />}
            label="Social Clicks"
            value={number(data.metrics.socialClicks)}
            detail={`Top platform: ${data.metrics.topSocialPlatform}`}
          />
        </section>

        <section>
          <CustomerRegistryPanel customers={data.customers} />
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-12">
          <div className="xl:col-span-4">
            <DashboardCard>
              <div className="mb-5">
                <h2 className="text-xl font-black text-slate-950">
                  Customer Segment Chart
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Segments are calculated from booking count and lifetime spend.
                </p>
              </div>

              <DonutChart
                title="Customers"
                total={data.metrics.totalCustomers}
                items={data.chartData.segments}
              />

              <div className="mt-5 space-y-3">
                <SegmentRow
                  label="VIP Customers"
                  value={data.metrics.segments.vip}
                  detail="$1,000+ spend or 8+ bookings"
                  tone="green"
                />
                <SegmentRow
                  label="Repeat Customers"
                  value={data.metrics.segments.repeat}
                  detail="3+ bookings"
                  tone="blue"
                />
                <SegmentRow
                  label="New Customers"
                  value={data.metrics.segments.new}
                  detail="1 booking"
                  tone="orange"
                />
                <SegmentRow
                  label="Leads"
                  value={data.metrics.segments.lead}
                  detail="Profile or customer record without booking"
                  tone="slate"
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <MiniMetric
                  icon={<PawPrint size={18} />}
                  label="Customers with pets"
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
                    Revenue, customers, and signups grouped by source and social
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
                  Visual view of your strongest local customer markets.
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

        <section className="grid gap-5 lg:grid-cols-3">
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
            description="Review referral clicks, conversions, source behavior, and customer acquisition quality."
          />

          <QuickLinkCard
            href={adminRoutes.partners}
            icon={<Globe2 size={22} />}
            title="Partner Campaigns"
            description="Review partner, affiliate, and campaign activity connected to growth reporting."
          />
        </section>

        <section>
          <DashboardCard>
            <CustomerInsightsTable
              customers={data.customers}
              exportHref={adminRoutes.customerExport}
              usersHref={adminRoutes.users}
            />
          </DashboardCard>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <QuickLinkCard
            href={adminRoutes.bookings}
            icon={<CalendarDays size={22} />}
            title="Review Bookings"
            description="Open the admin booking manager to review the customer booking history behind these numbers."
          />

          <QuickLinkCard
            href={adminRoutes.petAnalytics}
            icon={<PawPrint size={22} />}
            title="Pet Analytics"
            description="Review pet-related behavior, pet profiles, and demand signals from customer accounts."
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
          data are calculated from live rows.
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
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm">
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

  let currentOffset = 0;
  const segments = activeItems.map((item, index) => {
    const percent = activeTotal > 0 ? (item.value / activeTotal) * 100 : 0;
    const segment = `${chartColors[index % chartColors.length]} ${currentOffset}% ${
      currentOffset + percent
    }%`;

    currentOffset += percent;
    return segment;
  });

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
                    {number(row.customers)} customers · {number(row.bookings)}{" "}
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