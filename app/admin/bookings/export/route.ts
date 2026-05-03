import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type SafeAdminQueryResponse = {
  data: unknown;
  error: unknown;
};

type BookingExportRow = {
  booking_id: string;
  pet_id: string;
  pet_name: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  guru_id: string;
  guru_name: string;
  service: string;
  city: string;
  state: string;
  country: string;
  location: string;
  booking_status: string;
  payment_status: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  created_at: string;
  total_booking_value: number;
  platform_revenue: number;
  guru_payout: number;
};

type BookingRow = {
  id?: string | null;
  pet_id?: string | null;
  pet_name?: string | null;
  status?: string | null;
  booking_status?: string | null;
  payment_status?: string | null;
  booking_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  service?: string | null;
  service_type?: string | null;
  booking_type?: string | null;
  customer_id?: string | null;
  pet_owner_id?: string | null;
  client_id?: string | null;
  user_id?: string | null;
  customer_name?: string | null;
  pet_parent_name?: string | null;
  owner_name?: string | null;
  customer_email?: string | null;
  guru_id?: string | null;
  sitter_id?: string | null;
  provider_id?: string | null;
  guru_name?: string | null;
  sitter_name?: string | null;
  provider_name?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  service_city?: string | null;
  service_state?: string | null;
  service_country?: string | null;
  price?: number | string | null;
  amount?: number | string | null;
  total_amount?: number | string | null;
  booking_total?: number | string | null;
  total_customer_paid?: number | string | null;
  platform_fee?: number | string | null;
  commission_amount?: number | string | null;
  sitguru_fee?: number | string | null;
  service_fee?: number | string | null;
  admin_fee?: number | string | null;
  guru_payout?: number | string | null;
  payout_amount?: number | string | null;
  sitter_payout?: number | string | null;
  provider_payout?: number | string | null;
};

type ProfileRow = {
  id?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

type GuruRow = {
  id?: string | null;
  user_id?: string | null;
  profile_id?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

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

function getDisplayName(row: AnyRow | undefined, fallback: string) {
  if (!row) return fallback;

  const firstName = getText(row, ["first_name", "firstName"]);
  const lastName = getText(row, ["last_name", "lastName"]);

  if (firstName || lastName) return `${firstName} ${lastName}`.trim();

  return getText(
    row,
    ["full_name", "display_name", "name", "email"],
    fallback,
  );
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

function getGuruId(booking: BookingRow) {
  return booking.guru_id || booking.sitter_id || booking.provider_id || "";
}

function getServiceLabel(booking: BookingRow) {
  return (
    booking.service ||
    booking.service_type ||
    booking.booking_type ||
    "Not set"
  );
}

function getBookingCity(booking: BookingRow) {
  return booking.service_city || booking.city || "";
}

function getBookingState(booking: BookingRow) {
  return booking.service_state || booking.state || "";
}

function getBookingCountry(booking: BookingRow) {
  return booking.service_country || booking.country || "";
}

function getLocation(city: string, state: string, country: string) {
  return [city, state, country].filter(Boolean).join(", ") || "Unknown";
}

function normalizeStatus(status?: string | null) {
  if (!status) return "Pending";

  const clean = status.toLowerCase();

  if (clean.includes("confirm")) return "Confirmed";
  if (clean.includes("pending")) return "Pending";
  if (clean.includes("cancel")) return "Canceled";
  if (clean.includes("complete")) return "Completed";
  if (clean.includes("paid")) return "Completed";
  if (clean.includes("active")) return "Confirmed";

  return status;
}

function normalizePayment(payment?: string | null) {
  if (!payment) return "unpaid";
  return payment.toLowerCase();
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

function getGuruPayout(booking: BookingRow) {
  return getAmount(booking as AnyRow, [
    "guru_payout",
    "payout_amount",
    "sitter_payout",
    "provider_payout",
  ]);
}

function getPlatformRevenue(booking: BookingRow) {
  const explicitFee = getAmount(booking as AnyRow, [
    "platform_fee",
    "commission_amount",
    "sitguru_fee",
    "service_fee",
    "admin_fee",
  ]);

  if (explicitFee > 0) return explicitFee;

  const total = getBookingAmount(booking);
  const payout = getGuruPayout(booking);

  if (total > 0 && payout > 0 && total >= payout) {
    return total - payout;
  }

  return total > 0 ? total * 0.08 : 0;
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  const escaped = text.replaceAll('"', '""');

  if (
    escaped.includes(",") ||
    escaped.includes("\n") ||
    escaped.includes("\r") ||
    escaped.includes('"')
  ) {
    return `"${escaped}"`;
  }

  return escaped;
}

function toCsv(rows: BookingExportRow[]) {
  const headers: Array<keyof BookingExportRow> = [
    "booking_id",
    "pet_id",
    "pet_name",
    "customer_id",
    "customer_name",
    "customer_email",
    "guru_id",
    "guru_name",
    "service",
    "city",
    "state",
    "country",
    "location",
    "booking_status",
    "payment_status",
    "booking_date",
    "start_time",
    "end_time",
    "created_at",
    "total_booking_value",
    "platform_revenue",
    "guru_payout",
  ];

  const csvRows = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ];

  return csvRows.join("\n");
}

async function safeAdminQuery(
  query: PromiseLike<SafeAdminQueryResponse>,
  label: string,
): Promise<SafeAdminQueryResponse> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Booking export query skipped for ${label}:`, result.error);
      return { data: [], error: null };
    }

    return result;
  } catch (error) {
    console.warn(`Booking export query skipped for ${label}:`, error);
    return { data: [], error: null };
  }
}

async function getBookingExportRows() {
  const [bookingsResult, profilesResult, gurusResult] = await Promise.all([
    safeAdminQuery(
      supabaseAdmin
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "bookings",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, display_name, first_name, last_name, email")
        .limit(5000),
      "profiles",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("gurus")
        .select("id, user_id, profile_id, full_name, display_name, first_name, last_name, email")
        .limit(5000),
      "gurus",
    ),
  ]);

  const bookings = ((bookingsResult.data || []) as BookingRow[]).filter(Boolean);
  const profiles = ((profilesResult.data || []) as ProfileRow[]).filter(Boolean);
  const gurus = ((gurusResult.data || []) as GuruRow[]).filter(Boolean);

  const profilesMap = new Map<string, ProfileRow>();
  const gurusMap = new Map<string, GuruRow>();

  for (const profile of profiles) {
    if (profile.id) profilesMap.set(profile.id, profile);
  }

  for (const guru of gurus) {
    if (guru.id) gurusMap.set(guru.id, guru);
    if (guru.user_id) gurusMap.set(guru.user_id, guru);
    if (guru.profile_id) gurusMap.set(guru.profile_id, guru);
  }

  return bookings.map((booking) => {
    const customerId = getCustomerId(booking);
    const guruId = getGuruId(booking);
    const customerProfile = profilesMap.get(customerId);
    const guruRow = gurusMap.get(guruId);
    const guruProfile = profilesMap.get(guruId);
    const city = getBookingCity(booking);
    const state = getBookingState(booking);
    const country = getBookingCountry(booking);

    return {
      booking_id: booking.id || "",
      pet_id: booking.pet_id || "",
      pet_name: booking.pet_name || "",
      customer_id: customerId,
      customer_name:
        getDisplayName(customerProfile as AnyRow | undefined, "") ||
        booking.customer_name ||
        booking.pet_parent_name ||
        booking.owner_name ||
        booking.customer_email ||
        "Customer",
      customer_email:
        customerProfile?.email ||
        booking.customer_email ||
        "",
      guru_id: guruId,
      guru_name:
        getDisplayName(guruRow as AnyRow | undefined, "") ||
        getDisplayName(guruProfile as AnyRow | undefined, "") ||
        booking.guru_name ||
        booking.sitter_name ||
        booking.provider_name ||
        "Unassigned",
      service: getServiceLabel(booking),
      city,
      state,
      country,
      location: getLocation(city, state, country),
      booking_status: normalizeStatus(booking.status || booking.booking_status),
      payment_status: normalizePayment(booking.payment_status),
      booking_date: booking.booking_date || "",
      start_time: booking.start_time || "",
      end_time: booking.end_time || "",
      created_at: booking.created_at || "",
      total_booking_value: getBookingAmount(booking),
      platform_revenue: getPlatformRevenue(booking),
      guru_payout: getGuruPayout(booking),
    };
  });
}

export async function GET() {
  const rows = await getBookingExportRows();
  const csv = toCsv(rows);
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sitguru-bookings-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}