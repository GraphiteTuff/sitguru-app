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
};

type PetRow = {
  id: string;
  owner_id?: string | null;
  customer_id?: string | null;
  user_id?: string | null;
  pet_owner_id?: string | null;
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

function getDisplayName(row: AnyRow, fallback = "Customer") {
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
    role.includes("owner")
  );
}

function getCustomerId(booking: BookingRow) {
  return (
    booking.customer_id ||
    booking.pet_owner_id ||
    booking.client_id ||
    booking.user_id ||
    null
  );
}

function getPetOwnerId(pet: PetRow) {
  return pet.owner_id || pet.customer_id || pet.user_id || pet.pet_owner_id || null;
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

  const profiles = ((profilesResult.data || []) as ProfileRow[]).filter(Boolean);
  const bookings = ((bookingsResult.data || []) as BookingRow[]).filter(Boolean);
  const pets = ((petsResult.data || []) as PetRow[]).filter(Boolean);
  const messages = ((messagesResult.data || []) as MessageRow[]).filter(Boolean);
  const launchSignups = ((launchSignupsResult.data || []) as AnyRow[]).filter(Boolean);
  const launchWaitlist = ((launchWaitlistResult.data || []) as AnyRow[]).filter(Boolean);
  const referralClicks = ((referralClicksResult.data || []) as AnyRow[]).filter(Boolean);
  const referralConversions = ((referralConversionsResult.data || []) as AnyRow[]).filter(Boolean);
  const networkClicks = ((networkClicksResult.data || []) as AnyRow[]).filter(Boolean);
  const partnerCampaigns = ((partnerCampaignsResult.data || []) as AnyRow[]).filter(Boolean);

  const signupRows = [...launchSignups, ...launchWaitlist];
  const clickRows = [...referralClicks, ...networkClicks];
  const conversionRows = referralConversions;
  const campaignRows = [...signupRows, ...clickRows, ...conversionRows, ...partnerCampaigns];

  const customerMap = new Map<string, CustomerInsight>();

  for (const profile of profiles) {
    if (!profile.id) continue;
    if (!isCustomerProfile(profile)) continue;

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
    },
  };
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
                  Real Supabase insights for customer value, repeat behavior,
                  location demand, source attribution, social growth, and
                  exportable reporting.
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Users size={22} />}
            label="Customers"
            value={number(data.metrics.totalCustomers)}
            detail="Profiles plus customer IDs found in bookings"
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
          `partner_campaigns`. Customer KPIs, social attribution, source charts,
          location charts, and exportable report data are calculated from live
          rows.
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