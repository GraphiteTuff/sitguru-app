import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  BarChart3,
  CalendarCheck,
  CircleDollarSign,
  Download,
  Globe2,
  MapPin,
  PawPrint,
  ReceiptText,
  RefreshCcw,
  Search,
  ShieldAlert,
  Star,
  TrendingUp,
  UserRoundCheck,
  Users,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type SearchParams = {
  q?: string;
  city?: string;
  state?: string;
  country?: string;
  sort?: string;
  order?: string;
};

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

type GuruFinancialRow = {
  guruId: string;
  guruName: string;
  email: string;
  avatarUrl: string;
  city: string;
  state: string;
  country: string;
  location: string;
  services: string;
  grossRevenue: number;
  completedRevenue: number;
  guruPayouts: number;
  platformRevenue: number;
  refundAmount: number;
  disputeAmount: number;
  cancellationLoss: number;
  bookingCount: number;
  completedBookings: number;
  cancelledBookings: number;
  paidBookings: number;
  repeatCustomerCount: number;
  averageBookingValue: number;
  lastBookingDate: string | null;
  href: string;
};

type ChartItem = {
  label: string;
  value: number;
  helper?: string;
  href?: string;
};

const adminRoutes = {
  dashboard: "/admin",
  gurus: "/admin/gurus",
  guruPerformance: "/admin/guru-performance",
  guruPerformanceExport: "/admin/guru-performance/export",
  bookings: "/admin/bookings",
  financials: "/admin/financials",
  payouts: "/admin/payouts",
  payments: "/admin/payments",
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

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
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

function getText(row: AnyRow | undefined, keys: string[], fallback = "") {
  if (!row) return fallback;

  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }

  return fallback;
}

function getAmount(row: AnyRow | undefined, keys: string[]) {
  if (!row) return 0;

  for (const key of keys) {
    const value = asNumber(row[key]);
    if (value > 0) return value;
  }

  return 0;
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Guru financial performance query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Guru financial performance query skipped for ${label}:`, error);
    return [];
  }
}

function getProfileKey(profile: AnyRow) {
  return (
    getText(profile, ["id"]) ||
    getText(profile, ["user_id"]) ||
    getText(profile, ["profile_id"]) ||
    getText(profile, ["email"]).toLowerCase()
  );
}

function getGuruId(guru: AnyRow) {
  return (
    getText(guru, ["id"]) ||
    getText(guru, ["user_id"]) ||
    getText(guru, ["profile_id"]) ||
    getText(guru, ["email"]).toLowerCase()
  );
}

function getGuruProfileKey(guru: AnyRow) {
  return (
    getText(guru, ["user_id"]) ||
    getText(guru, ["profile_id"]) ||
    getText(guru, ["id"]) ||
    getText(guru, ["email"]).toLowerCase()
  );
}

function getBookingGuruId(booking: AnyRow) {
  return (
    getText(booking, ["guru_id"]) ||
    getText(booking, ["sitter_id"]) ||
    getText(booking, ["provider_id"]) ||
    getText(booking, ["caregiver_id"]) ||
    getText(booking, ["assigned_guru_id"]) ||
    getText(booking, ["user_id"]) ||
    ""
  );
}

function getPaymentGuruId(payment: AnyRow) {
  return (
    getText(payment, ["guru_id"]) ||
    getText(payment, ["sitter_id"]) ||
    getText(payment, ["provider_id"]) ||
    getText(payment, ["caregiver_id"]) ||
    ""
  );
}

function getPayoutGuruId(payout: AnyRow) {
  return (
    getText(payout, ["guru_id"]) ||
    getText(payout, ["sitter_id"]) ||
    getText(payout, ["provider_id"]) ||
    getText(payout, ["caregiver_id"]) ||
    getText(payout, ["recipient_id"]) ||
    getText(payout, ["user_id"]) ||
    ""
  );
}

function getCustomerId(booking: AnyRow) {
  return (
    getText(booking, ["customer_id"]) ||
    getText(booking, ["pet_owner_id"]) ||
    getText(booking, ["client_id"]) ||
    getText(booking, ["owner_id"]) ||
    getText(booking, ["customer_email"]) ||
    ""
  );
}

function getDisplayName(row: AnyRow | undefined, fallback = "Guru") {
  const firstName = getText(row, ["first_name", "firstName"]);
  const lastName = getText(row, ["last_name", "lastName"]);

  if (firstName || lastName) return `${firstName} ${lastName}`.trim();

  return (
    getText(row, ["display_name", "full_name", "name", "guru_name", "email"]) ||
    fallback
  );
}

function getGuruName(guru: AnyRow, profile?: AnyRow) {
  return (
    getDisplayName(guru, "") ||
    getDisplayName(profile, "") ||
    getText(guru, ["email"]).split("@")[0] ||
    getText(profile, ["email"]).split("@")[0] ||
    "Guru"
  );
}

function getGuruEmail(guru: AnyRow, profile?: AnyRow) {
  return getText(guru, ["email"]) || getText(profile, ["email"]) || "—";
}

function getGuruAvatarUrl(guru: AnyRow, profile?: AnyRow) {
  return (
    getText(guru, ["avatar_url", "profile_photo_url", "photo_url", "image_url", "headshot_url"]) ||
    getText(profile, ["avatar_url", "profile_photo_url", "photo_url", "image_url"]) ||
    ""
  );
}

function getGuruServices(guru: AnyRow) {
  const services = guru.services;

  if (Array.isArray(services) && services.length > 0) {
    return services
      .map((service) => String(service).trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(" • ");
  }

  return (
    getText(guru, ["service", "service_name", "specialty", "title"]) ||
    "Pet Care"
  );
}

function getCity(row: AnyRow | undefined, profile?: AnyRow) {
  return (
    getText(row, ["city", "service_city", "customer_city", "booking_city"]) ||
    getText(profile, ["city"]) ||
    ""
  );
}

function getState(row: AnyRow | undefined, profile?: AnyRow) {
  return (
    getText(row, ["state", "service_state", "customer_state", "booking_state", "state_code"]) ||
    getText(profile, ["state", "state_code"]) ||
    ""
  );
}

function getCountry(row: AnyRow | undefined, profile?: AnyRow) {
  return (
    getText(row, ["country", "service_country", "customer_country", "booking_country"]) ||
    getText(profile, ["country"]) ||
    ""
  );
}

function getLocation(city: string, state: string, country: string) {
  return [city, state, country].filter(Boolean).join(", ") || "Unknown";
}

function getBookingAmount(booking: AnyRow) {
  return getAmount(booking, [
    "total_customer_paid",
    "total_amount",
    "booking_total",
    "amount",
    "price",
    "subtotal",
  ]);
}

function getBookingPayout(booking: AnyRow) {
  return getAmount(booking, [
    "guru_payout",
    "payout_amount",
    "sitter_payout",
    "provider_payout",
    "caregiver_payout",
    "earnings_amount",
  ]);
}

function getPlatformRevenue(booking: AnyRow) {
  const explicitPlatformRevenue = getAmount(booking, [
    "platform_fee",
    "commission_amount",
    "sitguru_fee",
    "service_fee",
    "admin_fee",
  ]);

  if (explicitPlatformRevenue > 0) return explicitPlatformRevenue;

  const bookingAmount = getBookingAmount(booking);
  const guruPayout = getBookingPayout(booking);

  if (bookingAmount > 0 && guruPayout > 0 && bookingAmount >= guruPayout) {
    return bookingAmount - guruPayout;
  }

  return 0;
}

function getRefundAmount(row: AnyRow) {
  return getAmount(row, [
    "refund_amount",
    "amount_refunded",
    "total_refunded",
    "amount",
    "total_amount",
  ]);
}

function getDisputeAmount(row: AnyRow) {
  return getAmount(row, [
    "dispute_amount",
    "amount_disputed",
    "chargeback_amount",
    "amount",
    "total_amount",
  ]);
}

function getPayoutAmount(row: AnyRow) {
  return getAmount(row, [
    "payout_amount",
    "amount",
    "net_amount",
    "guru_payout",
    "total_amount",
  ]);
}

function getBookingStatus(booking: AnyRow) {
  return getText(booking, ["status", "booking_status"], "").toLowerCase();
}

function getPaymentStatus(row: AnyRow) {
  return getText(row, ["payment_status", "status"], "").toLowerCase();
}

function isPaidBooking(booking: AnyRow) {
  const paymentStatus = getPaymentStatus(booking);
  const bookingStatus = getBookingStatus(booking);

  return (
    paymentStatus === "paid" ||
    paymentStatus === "succeeded" ||
    paymentStatus === "complete" ||
    bookingStatus.includes("paid") ||
    bookingStatus.includes("complete")
  );
}

function isCompletedBooking(booking: AnyRow) {
  const status = getBookingStatus(booking);
  return status.includes("complete") || status.includes("paid");
}

function isCancelledBooking(booking: AnyRow) {
  const status = getBookingStatus(booking);
  return status.includes("cancel") || status.includes("void");
}

function getBookingDate(booking: AnyRow) {
  return (
    getText(booking, ["booking_date"]) ||
    getText(booking, ["start_time"]) ||
    getText(booking, ["created_at"]) ||
    getText(booking, ["updated_at"]) ||
    null
  );
}

function getMostRecentDate(values: Array<string | null>) {
  const validDates = values
    .filter(Boolean)
    .map((value) => new Date(value as string))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  return validDates[0]?.toISOString() || null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function normalizeQuery(value?: string) {
  return String(value || "").trim().toLowerCase();
}

function buildChartRows(
  rows: GuruFinancialRow[],
  getLabel: (row: GuruFinancialRow) => string,
  getHref?: (label: string) => string,
) {
  const map = new Map<
    string,
    {
      label: string;
      value: number;
      bookings: number;
      gurus: Set<string>;
      href?: string;
    }
  >();

  for (const row of rows) {
    const label = getLabel(row) || "Unknown";
    const existing =
      map.get(label) ||
      {
        label,
        value: 0,
        bookings: 0,
        gurus: new Set<string>(),
        href: getHref?.(label),
      };

    existing.value += row.completedRevenue;
    existing.bookings += row.completedBookings;
    existing.gurus.add(row.guruId);

    map.set(label, existing);
  }

  return Array.from(map.values())
    .map((item) => ({
      label: item.label,
      value: item.value,
      helper: `${number(item.gurus.size)} Gurus · ${number(item.bookings)} bookings`,
      href: item.href,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

function buildPayoutChartRows(rows: GuruFinancialRow[]) {
  const payoutTotal = rows.reduce((sum, row) => sum + row.guruPayouts, 0);
  const platformTotal = rows.reduce((sum, row) => sum + row.platformRevenue, 0);

  return [
    {
      label: "Guru Payouts",
      value: payoutTotal,
      helper: "Paid or owed to Gurus",
    },
    {
      label: "SitGuru Revenue",
      value: platformTotal,
      helper: "Platform fee / commission",
    },
  ];
}

function sortRows(rows: GuruFinancialRow[], sort = "completedRevenue", order = "desc") {
  const direction = order === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    if (sort === "guru") return a.guruName.localeCompare(b.guruName) * direction;
    if (sort === "city") return a.city.localeCompare(b.city) * direction;
    if (sort === "state") return a.state.localeCompare(b.state) * direction;
    if (sort === "country") return a.country.localeCompare(b.country) * direction;
    if (sort === "bookings") return (a.completedBookings - b.completedBookings) * direction;
    if (sort === "payouts") return (a.guruPayouts - b.guruPayouts) * direction;
    if (sort === "platform") return (a.platformRevenue - b.platformRevenue) * direction;
    if (sort === "average") return (a.averageBookingValue - b.averageBookingValue) * direction;
    if (sort === "lastBooking") {
      const aDate = a.lastBookingDate ? new Date(a.lastBookingDate).getTime() : 0;
      const bDate = b.lastBookingDate ? new Date(b.lastBookingDate).getTime() : 0;
      return (aDate - bDate) * direction;
    }

    return (a.completedRevenue - b.completedRevenue) * direction;
  });
}

function sortHref(searchParams: SearchParams, sort: string) {
  const nextOrder =
    searchParams.sort === sort && searchParams.order !== "asc" ? "asc" : "desc";

  const params = new URLSearchParams();

  if (searchParams.q) params.set("q", searchParams.q);
  if (searchParams.city) params.set("city", searchParams.city);
  if (searchParams.state) params.set("state", searchParams.state);
  if (searchParams.country) params.set("country", searchParams.country);

  params.set("sort", sort);
  params.set("order", nextOrder);

  return `/admin/guru-performance?${params.toString()}`;
}

async function getGuruFinancialPerformanceData(searchParams: SearchParams) {
  const [gurus, profiles, bookings, payments, payouts, refunds, disputes] =
    await Promise.all([
      safeRows<AnyRow>(
        supabaseAdmin
          .from("gurus")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5000),
        "gurus",
      ),
      safeRows<AnyRow>(
        supabaseAdmin
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5000),
        "profiles",
      ),
      safeRows<AnyRow>(
        supabaseAdmin
          .from("bookings")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5000),
        "bookings",
      ),
      safeRows<AnyRow>(
        supabaseAdmin
          .from("payments")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5000),
        "payments",
      ),
      safeRows<AnyRow>(
        supabaseAdmin
          .from("payouts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5000),
        "payouts",
      ),
      safeRows<AnyRow>(
        supabaseAdmin
          .from("refunds")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5000),
        "refunds",
      ),
      safeRows<AnyRow>(
        supabaseAdmin
          .from("disputes")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5000),
        "disputes",
      ),
    ]);

  const profileMap = new Map<string, AnyRow>();

  for (const profile of profiles) {
    const key = getProfileKey(profile);
    const email = getText(profile, ["email"]).toLowerCase();

    if (key) profileMap.set(key, profile);
    if (email) profileMap.set(email, profile);
  }

  const paymentByBookingId = new Map<string, AnyRow[]>();

  for (const payment of payments) {
    const bookingId = getText(payment, ["booking_id", "reservation_id"]);
    if (!bookingId) continue;

    const existing = paymentByBookingId.get(bookingId) || [];
    existing.push(payment);
    paymentByBookingId.set(bookingId, existing);
  }

  const guruMap = new Map<string, GuruFinancialRow>();

  for (const guru of gurus) {
    const profile = profileMap.get(getGuruProfileKey(guru));
    const guruId = getGuruId(guru);
    if (!guruId) continue;

    const city = getCity(guru, profile);
    const state = getState(guru, profile);
    const country = getCountry(guru, profile);

    guruMap.set(guruId, {
      guruId,
      guruName: getGuruName(guru, profile),
      email: getGuruEmail(guru, profile),
      avatarUrl: getGuruAvatarUrl(guru, profile),
      city,
      state,
      country,
      location: getLocation(city, state, country),
      services: getGuruServices(guru),
      grossRevenue: 0,
      completedRevenue: 0,
      guruPayouts: 0,
      platformRevenue: 0,
      refundAmount: 0,
      disputeAmount: 0,
      cancellationLoss: 0,
      bookingCount: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      paidBookings: 0,
      repeatCustomerCount: 0,
      averageBookingValue: 0,
      lastBookingDate: null,
      href: `/admin/gurus/${encodeURIComponent(guruId)}`,
    });
  }

  const customerBookingsByGuru = new Map<string, Map<string, number>>();

  for (const booking of bookings) {
    const guruId = getBookingGuruId(booking);
    if (!guruId) continue;

    const existing =
      guruMap.get(guruId) ||
      {
        guruId,
        guruName:
          getText(booking, ["guru_name", "sitter_name", "provider_name"]) ||
          "Guru",
        email: getText(booking, ["guru_email", "sitter_email", "provider_email"]) || "—",
        avatarUrl: "",
        city: "",
        state: "",
        country: "",
        location: "Unknown",
        services: getText(booking, ["service", "service_name", "booking_type"], "Pet Care"),
        grossRevenue: 0,
        completedRevenue: 0,
        guruPayouts: 0,
        platformRevenue: 0,
        refundAmount: 0,
        disputeAmount: 0,
        cancellationLoss: 0,
        bookingCount: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        paidBookings: 0,
        repeatCustomerCount: 0,
        averageBookingValue: 0,
        lastBookingDate: null,
        href: `/admin/gurus/${encodeURIComponent(guruId)}`,
      };

    const bookingAmount = getBookingAmount(booking);
    const bookingPayout = getBookingPayout(booking);
    const bookingPlatformRevenue = getPlatformRevenue(booking);
    const bookingDate = getBookingDate(booking);
    const bookingId = getText(booking, ["id"]);

    let paidAmountFromPayment = 0;

    for (const payment of paymentByBookingId.get(bookingId) || []) {
      paidAmountFromPayment += getAmount(payment, [
        "amount",
        "total_amount",
        "payment_amount",
        "gross_amount",
      ]);
    }

    const grossAmount = bookingAmount || paidAmountFromPayment;
    const completed = isCompletedBooking(booking);
    const paid = isPaidBooking(booking);
    const cancelled = isCancelledBooking(booking);

    existing.city = existing.city || getCity(booking);
    existing.state = existing.state || getState(booking);
    existing.country = existing.country || getCountry(booking);
    existing.location = getLocation(existing.city, existing.state, existing.country);
    existing.services =
      existing.services && existing.services !== "Pet Care"
        ? existing.services
        : getText(booking, ["service", "service_name", "booking_type"], existing.services);

    existing.bookingCount += 1;
    existing.grossRevenue += grossAmount;
    existing.completedRevenue += completed || paid ? grossAmount : 0;
    existing.guruPayouts += completed || paid ? bookingPayout : 0;
    existing.platformRevenue += completed || paid ? bookingPlatformRevenue : 0;
    existing.completedBookings += completed ? 1 : 0;
    existing.paidBookings += paid ? 1 : 0;
    existing.cancelledBookings += cancelled ? 1 : 0;
    existing.cancellationLoss += cancelled ? grossAmount : 0;
    existing.lastBookingDate = getMostRecentDate([
      existing.lastBookingDate,
      bookingDate,
    ]);

    const customerId = getCustomerId(booking);
    if (customerId) {
      const customerMap =
        customerBookingsByGuru.get(guruId) || new Map<string, number>();
      customerMap.set(customerId, (customerMap.get(customerId) || 0) + 1);
      customerBookingsByGuru.set(guruId, customerMap);
    }

    guruMap.set(guruId, existing);
  }

  for (const payout of payouts) {
    const guruId = getPayoutGuruId(payout);
    const existing = guruMap.get(guruId);

    if (!existing) continue;

    const payoutAmount = getPayoutAmount(payout);

    if (payoutAmount > 0 && existing.guruPayouts === 0) {
      existing.guruPayouts += payoutAmount;
    }
  }

  for (const refund of refunds) {
    const guruId =
      getPaymentGuruId(refund) ||
      getBookingGuruId(refund);

    const existing = guruMap.get(guruId);
    if (!existing) continue;

    existing.refundAmount += getRefundAmount(refund);
  }

  for (const dispute of disputes) {
    const guruId =
      getPaymentGuruId(dispute) ||
      getBookingGuruId(dispute);

    const existing = guruMap.get(guruId);
    if (!existing) continue;

    existing.disputeAmount += getDisputeAmount(dispute);
  }

  for (const [guruId, customerMap] of customerBookingsByGuru.entries()) {
    const existing = guruMap.get(guruId);
    if (!existing) continue;

    existing.repeatCustomerCount = Array.from(customerMap.values()).filter(
      (count) => count >= 2,
    ).length;
  }

  const allRows = Array.from(guruMap.values()).map((row) => ({
    ...row,
    averageBookingValue:
      row.completedBookings > 0 ? row.completedRevenue / row.completedBookings : 0,
  }));

  const query = normalizeQuery(searchParams.q);
  const city = normalizeQuery(searchParams.city);
  const state = normalizeQuery(searchParams.state);
  const country = normalizeQuery(searchParams.country);

  const filteredRows = allRows.filter((row) => {
    const searchableText = [
      row.guruName,
      row.email,
      row.city,
      row.state,
      row.country,
      row.location,
      row.services,
    ]
      .join(" ")
      .toLowerCase();

    if (query && !searchableText.includes(query)) return false;
    if (city && row.city.toLowerCase() !== city) return false;
    if (state && row.state.toLowerCase() !== state) return false;
    if (country && row.country.toLowerCase() !== country) return false;

    return true;
  });

  const sortedRows = sortRows(filteredRows, searchParams.sort, searchParams.order);

  const totalGrossRevenue = allRows.reduce((sum, row) => sum + row.grossRevenue, 0);
  const totalCompletedRevenue = allRows.reduce(
    (sum, row) => sum + row.completedRevenue,
    0,
  );
  const totalGuruPayouts = allRows.reduce((sum, row) => sum + row.guruPayouts, 0);
  const totalPlatformRevenue = allRows.reduce(
    (sum, row) => sum + row.platformRevenue,
    0,
  );
  const totalRefunds = allRows.reduce((sum, row) => sum + row.refundAmount, 0);
  const totalDisputes = allRows.reduce((sum, row) => sum + row.disputeAmount, 0);
  const totalCancellationLoss = allRows.reduce(
    (sum, row) => sum + row.cancellationLoss,
    0,
  );
  const totalCompletedBookings = allRows.reduce(
    (sum, row) => sum + row.completedBookings,
    0,
  );
  const activeRevenueGurus = allRows.filter((row) => row.completedRevenue > 0).length;
  const averageRevenuePerGuru =
    activeRevenueGurus > 0 ? totalCompletedRevenue / activeRevenueGurus : 0;
  const averageBookingValue =
    totalCompletedBookings > 0
      ? totalCompletedRevenue / totalCompletedBookings
      : 0;

  const topGuru = [...allRows].sort(
    (a, b) => b.completedRevenue - a.completedRevenue,
  )[0];

  const topCity = buildChartRows(allRows, (row) => row.city || "Unknown")[0];
  const topState = buildChartRows(allRows, (row) => row.state || "Unknown")[0];
  const topCountry = buildChartRows(allRows, (row) => row.country || "Unknown")[0];

  const chartData = {
    topGurus: allRows
      .filter((row) => row.completedRevenue > 0)
      .sort((a, b) => b.completedRevenue - a.completedRevenue)
      .slice(0, 8)
      .map((row) => ({
        label: row.guruName,
        value: row.completedRevenue,
        helper: `${number(row.completedBookings)} completed bookings`,
        href: row.href,
      })),
    cities: buildChartRows(
      allRows,
      (row) => row.city || "Unknown",
      (label) => `/admin/guru-performance?city=${encodeURIComponent(label)}`,
    ),
    states: buildChartRows(
      allRows,
      (row) => row.state || "Unknown",
      (label) => `/admin/guru-performance?state=${encodeURIComponent(label)}`,
    ),
    countries: buildChartRows(
      allRows,
      (row) => row.country || "Unknown",
      (label) => `/admin/guru-performance?country=${encodeURIComponent(label)}`,
    ),
    services: buildChartRows(allRows, (row) => row.services.split(" • ")[0]),
    payoutMix: buildPayoutChartRows(allRows),
  };

  return {
    rows: sortedRows,
    allRows,
    chartData,
    metrics: {
      totalGurus: allRows.length,
      visibleGurus: sortedRows.length,
      activeRevenueGurus,
      totalGrossRevenue,
      totalCompletedRevenue,
      totalGuruPayouts,
      totalPlatformRevenue,
      totalRefunds,
      totalDisputes,
      totalCancellationLoss,
      totalCompletedBookings,
      averageRevenuePerGuru,
      averageBookingValue,
      topGuruName: topGuru?.guruName || "None yet",
      topGuruRevenue: topGuru?.completedRevenue || 0,
      topCity: topCity?.label || "None yet",
      topState: topState?.label || "None yet",
      topCountry: topCountry?.label || "None yet",
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
  href?: string;
}) {
  const content = (
    <>
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
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="group rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      {content}
    </div>
  );
}

function Avatar({ name, src }: { name: string; src?: string }) {
  if (src) {
    return (
      <img
        alt={name}
        src={src}
        className="h-11 w-11 shrink-0 rounded-full border border-green-100 object-cover shadow-sm"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-green-100 bg-green-50 text-sm font-black text-green-800 shadow-sm">
      {getInitials(name) || "SG"}
    </div>
  );
}

function HorizontalBarChart({
  title,
  valueLabel,
  items,
  valueFormatter = money,
  emptyLabel = "No chart data found yet.",
}: {
  title: string;
  valueLabel: string;
  items: ChartItem[];
  valueFormatter?: (value: number) => string;
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
            const bar = (
              <>
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
                    style={{
                      width: `${Math.max(3, width)}%`,
                      backgroundColor: chartColors[index % chartColors.length],
                    }}
                  />
                </div>
              </>
            );

            if (item.href) {
              return (
                <Link
                  key={`${item.label}-${index}`}
                  href={item.href}
                  className="block rounded-2xl border border-transparent p-2 transition hover:border-green-100 hover:bg-white hover:shadow-sm"
                >
                  {bar}
                </Link>
              );
            }

            return <div key={`${item.label}-${index}`}>{bar}</div>;
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

function PayoutMixCard({ items }: { items: ChartItem[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let start = 0;

  const gradient =
    total > 0
      ? items
          .map((item, index) => {
            const size = (item.value / total) * 360;
            const end = start + size;
            const segment = `${chartColors[index % chartColors.length]} ${start}deg ${end}deg`;
            start = end;
            return segment;
          })
          .join(", ")
      : "#e5e7eb 0deg 360deg";

  return (
    <div className="rounded-[24px] border border-[#edf3ee] bg-[#fbfcf9] p-4">
      <div className="mb-4">
        <h3 className="text-base font-black text-slate-950">
          Guru Payouts vs Platform Revenue
        </h3>
        <p className="mt-1 text-xs font-bold text-slate-500">
          Based on explicit payout, fee, and commission fields where available.
        </p>
      </div>

      <div className="grid items-center gap-5 sm:grid-cols-[160px_1fr]">
        <div className="relative mx-auto h-[160px] w-[160px]">
          <div
            className="h-full w-full rounded-full"
            style={{ background: `conic-gradient(${gradient})` }}
          />
          <div className="absolute inset-[32px] flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
            <span className="text-2xl font-black text-slate-950">
              {money(total)}
            </span>
            <span className="text-xs font-bold text-slate-500">Tracked</span>
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
                <div className="min-w-0">
                  <p className="truncate text-slate-800">{item.label}</p>
                  <p className="truncate text-xs text-slate-500">
                    {item.helper}
                  </p>
                </div>
              </div>

              <span className="shrink-0 font-black text-green-800">
                {money(item.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SortLink({
  label,
  sort,
  searchParams,
}: {
  label: string;
  sort: string;
  searchParams: SearchParams;
}) {
  const active = searchParams.sort === sort;

  return (
    <Link
      href={sortHref(searchParams, sort)}
      className={`inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.12em] transition ${
        active ? "text-green-800" : "text-slate-500 hover:text-green-800"
      }`}
    >
      {label}
      {active ? (searchParams.order === "asc" ? "↑" : "↓") : null}
    </Link>
  );
}

function GuruFinancialTable({
  rows,
  searchParams,
}: {
  rows: GuruFinancialRow[];
  searchParams: SearchParams;
}) {
  return (
    <DashboardCard>
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <h2 className="text-xl font-black text-slate-950">
            Guru Financial Records
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Revenue, payouts, platform revenue, refunds, disputes, bookings, and
            location performance by Guru.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="rounded-2xl border border-green-100 bg-[#f7faf4] px-4 py-3 text-sm font-black text-green-900">
            {number(rows.length)} visible Gurus
          </div>

          <Link
            href={adminRoutes.guruPerformanceExport}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
          >
            <Download size={16} />
            Export CSV
          </Link>
        </div>
      </div>

      <div className="mb-5 rounded-[24px] border border-[#edf3ee] bg-[#fbfcf9] p-4">
        <form
          action={adminRoutes.guruPerformance}
          className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
        >
          <label className="relative">
            <span className="sr-only">Search Guru financial records</span>
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              name="q"
              defaultValue={searchParams.q || ""}
              placeholder="Search Guru, email, service, city, state..."
              className="h-12 w-full rounded-2xl border border-green-100 bg-white pl-11 pr-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-green-300 focus:ring-4 focus:ring-green-100"
            />
          </label>

          <input
            name="city"
            defaultValue={searchParams.city || ""}
            placeholder="City"
            className="h-12 w-full rounded-2xl border border-green-100 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-green-300 focus:ring-4 focus:ring-green-100"
          />

          <input
            name="state"
            defaultValue={searchParams.state || ""}
            placeholder="State"
            className="h-12 w-full rounded-2xl border border-green-100 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-green-300 focus:ring-4 focus:ring-green-100"
          />

          <input
            name="country"
            defaultValue={searchParams.country || ""}
            placeholder="Country"
            className="h-12 w-full rounded-2xl border border-green-100 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-green-300 focus:ring-4 focus:ring-green-100"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-green-800 px-5 text-sm font-black text-white transition hover:bg-green-900"
            >
              Filter
            </button>

            <Link
              href={adminRoutes.guruPerformance}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-green-200 bg-white px-4 text-sm font-black text-green-900 transition hover:bg-green-50"
            >
              Reset
            </Link>
          </div>
        </form>
      </div>

      <div className="hidden overflow-hidden rounded-[24px] border border-[#edf3ee] lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1600px]">
            <thead className="bg-[#f7faf4]">
              <tr>
                <th className="px-5 py-4 text-left">
                  <SortLink label="Guru" sort="guru" searchParams={searchParams} />
                </th>
                <th className="px-5 py-4 text-left">
                  <SortLink label="Location" sort="city" searchParams={searchParams} />
                </th>
                <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Services
                </th>
                <th className="px-5 py-4 text-left">
                  <SortLink label="Revenue" sort="completedRevenue" searchParams={searchParams} />
                </th>
                <th className="px-5 py-4 text-left">
                  <SortLink label="Payouts" sort="payouts" searchParams={searchParams} />
                </th>
                <th className="px-5 py-4 text-left">
                  <SortLink label="Platform" sort="platform" searchParams={searchParams} />
                </th>
                <th className="px-5 py-4 text-left">
                  <SortLink label="Bookings" sort="bookings" searchParams={searchParams} />
                </th>
                <th className="px-5 py-4 text-left">
                  <SortLink label="Avg. Booking" sort="average" searchParams={searchParams} />
                </th>
                <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Repeat
                </th>
                <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Refunds / Disputes
                </th>
                <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Cancel Loss
                </th>
                <th className="px-5 py-4 text-left">
                  <SortLink label="Last Booking" sort="lastBooking" searchParams={searchParams} />
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.length ? (
                rows.map((row) => (
                  <tr
                    key={row.guruId}
                    className="border-t border-[#edf3ee] transition hover:bg-[#fbfcf9]"
                  >
                    <td className="px-5 py-4">
                      <Link href={row.href} className="flex items-center gap-3">
                        <Avatar name={row.guruName} src={row.avatarUrl} />
                        <div className="min-w-0">
                          <p className="max-w-[220px] truncate text-sm font-black text-slate-950">
                            {row.guruName}
                          </p>
                          <p className="max-w-[220px] truncate text-xs font-bold text-slate-500">
                            {row.email}
                          </p>
                        </div>
                      </Link>
                    </td>

                    <td className="px-5 py-4 text-sm font-bold text-slate-600">
                      {row.location}
                    </td>

                    <td className="px-5 py-4 text-sm font-bold text-slate-600">
                      <span className="line-clamp-2 max-w-[180px]">
                        {row.services}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm font-black text-slate-950">
                      {money(row.completedRevenue)}
                      <span className="block text-xs font-bold text-slate-400">
                        {money(row.grossRevenue)} gross
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm font-bold text-slate-600">
                      {money(row.guruPayouts)}
                    </td>

                    <td className="px-5 py-4 text-sm font-bold text-green-800">
                      {money(row.platformRevenue)}
                    </td>

                    <td className="px-5 py-4 text-sm font-bold text-slate-600">
                      {number(row.completedBookings)}
                      <span className="block text-xs font-bold text-slate-400">
                        {number(row.bookingCount)} total
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm font-bold text-slate-600">
                      {money(row.averageBookingValue)}
                    </td>

                    <td className="px-5 py-4 text-sm font-bold text-slate-600">
                      {number(row.repeatCustomerCount)}
                    </td>

                    <td className="px-5 py-4 text-sm font-bold text-slate-600">
                      {money(row.refundAmount)}
                      <span className="block text-xs font-bold text-slate-400">
                        {money(row.disputeAmount)} disputed
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm font-bold text-rose-700">
                      {money(row.cancellationLoss)}
                    </td>

                    <td className="px-5 py-4 text-sm font-bold text-slate-600">
                      {formatDate(row.lastBookingDate)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={12}
                    className="px-6 py-14 text-center text-base font-bold text-slate-500"
                  >
                    <Search className="mx-auto mb-3 text-slate-400" size={34} />
                    <p className="text-base font-black text-slate-950">
                      No Guru financial records match these filters.
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Try clearing filters or searching another Guru, city,
                      state, country, or service.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {rows.map((row) => (
          <Link
            key={row.guruId}
            href={row.href}
            className="block rounded-[24px] border border-[#e3ece5] bg-white p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <Avatar name={row.guruName} src={row.avatarUrl} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-black text-slate-950">
                  {row.guruName}
                </p>
                <p className="truncate text-xs font-bold text-slate-500">
                  {row.email}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-[#f8fbf6] p-4 text-sm">
                  <MobileMetric label="Revenue" value={money(row.completedRevenue)} />
                  <MobileMetric label="Payouts" value={money(row.guruPayouts)} />
                  <MobileMetric label="Bookings" value={number(row.completedBookings)} />
                  <MobileMetric label="Location" value={row.location} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </DashboardCard>
  );
}

function MobileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-black text-slate-950">{value}</p>
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

export default async function AdminGuruPerformancePage({
  searchParams,
}: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const data = await getGuruFinancialPerformanceData(resolvedSearchParams);

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
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-800 text-white">
                <BarChart3 size={26} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
                  Admin / Guru Financial Performance
                </p>
                <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-4xl">
                  Guru Financial Performance
                </h1>
                <p className="mt-1 max-w-4xl text-base font-semibold text-slate-600">
                  Track Guru revenue, payouts, SitGuru platform revenue,
                  completed bookings, refunds, disputes, cancellation loss, and
                  local market performance.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={adminRoutes.guruPerformanceExport}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <Download size={17} />
              Export CSV Report
            </Link>

            <Link
              href={adminRoutes.gurus}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <Users size={17} />
              Guru Records
            </Link>

            <Link
              href={adminRoutes.payouts}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
            >
              <Wallet size={18} />
              Payouts
            </Link>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<CircleDollarSign size={22} />}
            label="Completed Revenue"
            value={money(data.metrics.totalCompletedRevenue)}
            detail={`${money(data.metrics.totalGrossRevenue)} gross tracked revenue`}
          />

          <StatCard
            icon={<Wallet size={22} />}
            label="Guru Payouts"
            value={money(data.metrics.totalGuruPayouts)}
            detail="Paid or owed to Gurus from tracked fields"
            href={adminRoutes.payouts}
          />

          <StatCard
            icon={<Banknote size={22} />}
            label="SitGuru Revenue"
            value={money(data.metrics.totalPlatformRevenue)}
            detail="Platform fees and commissions found"
            href={adminRoutes.financials}
          />

          <StatCard
            icon={<CalendarCheck size={22} />}
            label="Completed Bookings"
            value={number(data.metrics.totalCompletedBookings)}
            detail={`${money(data.metrics.averageBookingValue)} average booking value`}
            href={adminRoutes.bookings}
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<UserRoundCheck size={22} />}
            label="Revenue Gurus"
            value={number(data.metrics.activeRevenueGurus)}
            detail={`${money(data.metrics.averageRevenuePerGuru)} avg revenue per active Guru`}
            href={adminRoutes.gurus}
          />

          <StatCard
            icon={<TrendingUp size={22} />}
            label="Top Guru"
            value={data.metrics.topGuruName}
            detail={`${money(data.metrics.topGuruRevenue)} completed revenue`}
          />

          <StatCard
            icon={<MapPin size={22} />}
            label="Top City"
            value={data.metrics.topCity}
            detail="Highest completed revenue city"
          />

          <StatCard
            icon={<ShieldAlert size={22} />}
            label="Refunds / Disputes"
            value={money(data.metrics.totalRefunds + data.metrics.totalDisputes)}
            detail={`${money(data.metrics.totalCancellationLoss)} cancellation loss`}
          />
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <DashboardCard>
              <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Guru Revenue Charts
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Visualize which Gurus and services are driving completed
                    revenue.
                  </p>
                </div>

                <Link
                  href={adminRoutes.guruPerformanceExport}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white transition hover:bg-green-900"
                >
                  <Download size={16} />
                  Export
                </Link>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <HorizontalBarChart
                  title="Top Gurus by Revenue"
                  valueLabel="Revenue"
                  items={data.chartData.topGurus}
                />

                <HorizontalBarChart
                  title="Revenue by Service Type"
                  valueLabel="Revenue"
                  items={data.chartData.services}
                />
              </div>
            </DashboardCard>
          </div>

          <div className="xl:col-span-4">
            <PayoutMixCard items={data.chartData.payoutMix} />
          </div>
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-3">
          <DashboardCard>
            <div className="mb-5 flex items-center gap-3">
              <MapPin className="text-green-800" size={22} />
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Cities by Revenue
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Drill into local Guru markets.
                </p>
              </div>
            </div>

            <HorizontalBarChart
              title="Top Cities"
              valueLabel="Revenue"
              items={data.chartData.cities}
            />
          </DashboardCard>

          <DashboardCard>
            <div className="mb-5 flex items-center gap-3">
              <Globe2 className="text-green-800" size={22} />
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  States by Revenue
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Understand state-level performance.
                </p>
              </div>
            </div>

            <HorizontalBarChart
              title="Top States"
              valueLabel="Revenue"
              items={data.chartData.states}
            />
          </DashboardCard>

          <DashboardCard>
            <div className="mb-5 flex items-center gap-3">
              <Globe2 className="text-green-800" size={22} />
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Countries by Revenue
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Useful for future expansion tracking.
                </p>
              </div>
            </div>

            <HorizontalBarChart
              title="Top Countries"
              valueLabel="Revenue"
              items={data.chartData.countries}
            />
          </DashboardCard>
        </section>

        <section>
          <GuruFinancialTable
            rows={data.rows}
            searchParams={resolvedSearchParams}
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <QuickLinkCard
            href={adminRoutes.gurus}
            icon={<Users size={22} />}
            title="Guru Management"
            description="Review Guru records, profile quality, trust checks, and bookable readiness."
          />

          <QuickLinkCard
            href={adminRoutes.payouts}
            icon={<Wallet size={22} />}
            title="Guru Payouts"
            description="Review payout status, payout amounts, and Guru payment readiness."
          />

          <QuickLinkCard
            href={adminRoutes.financials}
            icon={<ReceiptText size={22} />}
            title="Financial Overview"
            description="Open the broader SitGuru financial dashboard for platform reporting."
          />
        </section>

        <div className="rounded-[26px] border border-green-100 bg-white p-4 text-sm font-semibold text-slate-500 shadow-sm">
          <span className="font-black text-green-900">
            Supabase coordination:
          </span>{" "}
          this page reads `gurus`, `profiles`, `bookings`, `payments`,
          `payouts`, `refunds`, and `disputes`. Guru financial KPIs, revenue
          charts, city/state/country performance, payouts, platform revenue,
          refunds, disputes, cancellation loss, table filters, and sorting are
          calculated from live rows when those tables and fields exist.
        </div>
      </div>
    </main>
  );
}