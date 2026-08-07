/**
 * Compact Customer Intelligence payload for Rogue reports + admin tools.
 * SERVER ONLY — do not import from client components.
 */

import { supabaseAdmin } from "@/utils/supabase/admin";
import {
  buildCustomerIntelligenceDigest,
  filterCustomersForMetric,
  isSocialAttributionSource,
  parseCustomerIntelligenceMetric,
  type CustomerIntelligenceMetricCustomer,
  type CustomerIntelligenceMetricId,
} from "@/lib/admin/customer-intelligence/metrics";

type AnyRow = Record<string, unknown>;

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

function getText(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }
  return "";
}

function normalizeSource(value: string) {
  const lower = value.trim().toLowerCase();
  if (!lower) return "Direct";
  if (lower.includes("facebook") || lower === "fb") return "Facebook";
  if (lower.includes("instagram") || lower === "ig") return "Instagram";
  if (lower.includes("tiktok")) return "TikTok";
  if (lower.includes("youtube")) return "YouTube";
  if (lower.includes("linkedin")) return "LinkedIn";
  if (lower.includes("twitter") || lower === "x") return "X / Twitter";
  return value.trim() || "Direct";
}

function isCustomerRole(row: AnyRow) {
  const role = getText(row, ["role", "account_type", "user_role"]).toLowerCase();
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

function isDemoLike(row: AnyRow) {
  const hay = [
    getText(row, ["full_name", "display_name", "name", "email"]),
  ]
    .join(" ")
    .toLowerCase();
  return ["demo", "fake", "test", "sample", "sandbox", "dummy"].some((token) =>
    hay.includes(token),
  );
}

function isWithinLastDays(value: string | null, days: number) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() >= Date.now() - days * 24 * 60 * 60 * 1000;
}

async function safeRows(table: string, columns: string, limit = 1000) {
  try {
    const result = await supabaseAdmin
      .from(table)
      .select(columns)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (result.error) return [] as AnyRow[];
    return ((result.data || []) as unknown as AnyRow[]).filter(Boolean);
  } catch {
    return [] as AnyRow[];
  }
}

export async function getCustomerIntelligenceReportDigest(options?: {
  metric?: string | null;
}) {
  const metric = parseCustomerIntelligenceMetric(options?.metric || null);

  const [profiles, bookings, launchSignups, launchWaitlist, referralClicks, networkClicks] =
    await Promise.all([
      safeRows(
        "profiles",
        "id,full_name,display_name,name,email,phone,role,account_type,city,state,service_city,service_state,zip_code,service_zip,source,signup_source,utm_source,admin_status,created_at,updated_at",
        1000,
      ),
      safeRows(
        "bookings",
        "id,customer_id,user_id,customer_email,customer_name,status,payment_status,total_amount,amount,subtotal_amount,source,utm_source,created_at,updated_at,start_time,booking_date",
        1000,
      ),
      safeRows("launch_signups", "id,source,utm_source,platform,created_at", 1000),
      safeRows("launch_waitlist", "id,source,utm_source,platform,created_at", 1000),
      safeRows("referral_clicks", "id,source,utm_source,platform,created_at", 1000),
      safeRows("network_click_events", "id,source,utm_source,platform,created_at", 1000),
    ]);

  const customerMap = new Map<string, CustomerIntelligenceMetricCustomer>();

  for (const profile of profiles) {
    const id = getText(profile, ["id"]);
    if (!id || !isCustomerRole(profile) || isDemoLike(profile)) continue;
    const adminStatus = getText(profile, ["admin_status"]).toLowerCase();
    if (
      ["archived", "spam", "likely_spam", "deleted", "test"].some((status) =>
        adminStatus.includes(status),
      )
    ) {
      continue;
    }

    customerMap.set(id, {
      id,
      name:
        getText(profile, ["full_name", "display_name", "name"]) || "Pet Parent",
      email: getText(profile, ["email"]),
      phone: getText(profile, ["phone", "phone_number"]),
      city: getText(profile, ["city", "service_city"]),
      state: getText(profile, ["state", "service_state"]),
      zipCode: getText(profile, ["zip_code", "service_zip", "zip"]),
      source: normalizeSource(
        getText(profile, ["source", "signup_source", "utm_source", "platform"]),
      ),
      bookingCount: 0,
      totalSpend: 0,
      lastBookingDate: null,
    });
  }

  for (const booking of bookings) {
    const customerId =
      getText(booking, ["customer_id", "user_id"]) ||
      getText(booking, ["customer_email"]);
    if (!customerId) continue;

    const existing =
      customerMap.get(customerId) ||
      ({
        id: customerId,
        name: getText(booking, ["customer_name"]) || "Pet Parent",
        email: getText(booking, ["customer_email"]),
        city: "",
        state: "",
        zipCode: "",
        source: normalizeSource(
          getText(booking, ["source", "utm_source", "platform"]),
        ),
        bookingCount: 0,
        totalSpend: 0,
        lastBookingDate: null,
      } as CustomerIntelligenceMetricCustomer);

    existing.bookingCount += 1;
    existing.totalSpend +=
      asNumber(booking.total_amount) ||
      asNumber(booking.amount) ||
      asNumber(booking.subtotal_amount);
    const bookingDate =
      getText(booking, ["start_time", "booking_date", "created_at"]) || null;
    if (
      bookingDate &&
      (!existing.lastBookingDate ||
        new Date(bookingDate).getTime() >
          new Date(existing.lastBookingDate).getTime())
    ) {
      existing.lastBookingDate = bookingDate;
    }
    if (existing.source === "Direct") {
      existing.source = normalizeSource(
        getText(booking, ["source", "utm_source", "platform"]),
      );
    }
    customerMap.set(customerId, existing);
  }

  const customers = Array.from(customerMap.values());
  const totalRevenue = customers.reduce((sum, row) => sum + row.totalSpend, 0);
  const totalBookings = customers.reduce(
    (sum, row) => sum + row.bookingCount,
    0,
  );
  const repeatCustomers = customers.filter((row) => row.bookingCount >= 2).length;
  const activeCustomersLast30 = customers.filter((row) =>
    isWithinLastDays(row.lastBookingDate, 30),
  ).length;
  const socialCustomers = customers.filter((row) =>
    isSocialAttributionSource(row.source),
  );
  const socialBookings = socialCustomers.reduce(
    (sum, row) => sum + row.bookingCount,
    0,
  );
  const socialRevenue = socialCustomers.reduce(
    (sum, row) => sum + row.totalSpend,
    0,
  );

  const socialSignupRows = [...launchSignups, ...launchWaitlist].filter((row) =>
    isSocialAttributionSource(
      normalizeSource(getText(row, ["source", "utm_source", "platform"])),
    ),
  );
  const socialClickRows = [...referralClicks, ...networkClicks].filter((row) =>
    isSocialAttributionSource(
      normalizeSource(getText(row, ["source", "utm_source", "platform"])),
    ),
  );

  const platformMap = new Map<
    string,
    { label: string; customers: number; bookings: number; revenue: number; signups: number }
  >();

  for (const customer of socialCustomers) {
    const label = customer.source || "Social";
    const current = platformMap.get(label) || {
      label,
      customers: 0,
      bookings: 0,
      revenue: 0,
      signups: 0,
    };
    current.customers += 1;
    current.bookings += customer.bookingCount;
    current.revenue += customer.totalSpend;
    platformMap.set(label, current);
  }

  for (const row of socialSignupRows) {
    const label = normalizeSource(
      getText(row, ["source", "utm_source", "platform"]),
    );
    const current = platformMap.get(label) || {
      label,
      customers: 0,
      bookings: 0,
      revenue: 0,
      signups: 0,
    };
    current.signups += 1;
    platformMap.set(label, current);
  }

  const socialSources = Array.from(platformMap.values()).sort(
    (a, b) => b.customers + b.signups - (a.customers + a.signups),
  );

  const metrics = {
    totalCustomers: customers.length,
    totalRevenue,
    averageLifetimeValue:
      customers.length > 0 ? totalRevenue / customers.length : 0,
    repeatCustomers,
    repeatRate:
      customers.length > 0 ? (repeatCustomers / customers.length) * 100 : 0,
    activeCustomersLast30,
    averageBookingsPerCustomer:
      customers.length > 0 ? totalBookings / customers.length : 0,
    socialSignups: socialSignupRows.length,
    socialCustomers: socialCustomers.length,
    socialBookings,
    socialRevenue,
    socialClicks: socialClickRows.length,
    topSocialPlatform: socialSources[0]?.label || "None yet",
    hiddenDemoRows: profiles.filter((row) => isDemoLike(row)).length,
    separatedAdminRows: profiles.filter((row) => {
      const status = getText(row, ["admin_status"]).toLowerCase();
      return ["archived", "spam", "deleted", "test"].some((token) =>
        status.includes(token),
      );
    }).length,
    reviewQueueRows: customers.filter(
      (row) => row.bookingCount === 0 && row.totalSpend === 0,
    ).length,
  };

  return {
    metric,
    metrics,
    customers: filterCustomersForMetric(customers, metric),
    socialSources,
    digest: buildCustomerIntelligenceDigest({
      metrics,
      customers,
      socialSources,
      metric,
    }),
  };
}
