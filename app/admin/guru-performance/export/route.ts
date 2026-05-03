import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type GuruFinancialReportRow = {
  guru_id: string;
  guru_name: string;
  email: string;
  city: string;
  state: string;
  country: string;
  location: string;
  services: string;
  gross_revenue: number;
  completed_revenue: number;
  guru_payouts: number;
  sitguru_platform_revenue: number;
  refund_amount: number;
  dispute_amount: number;
  cancellation_loss: number;
  total_bookings: number;
  completed_bookings: number;
  paid_bookings: number;
  cancelled_bookings: number;
  repeat_customers: number;
  average_booking_value: number;
  last_booking_date: string;
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

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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
      console.warn(`Guru performance export skipped ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Guru performance export skipped ${label}:`, error);
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

function getPaymentGuruId(row: AnyRow) {
  return (
    getText(row, ["guru_id"]) ||
    getText(row, ["sitter_id"]) ||
    getText(row, ["provider_id"]) ||
    getText(row, ["caregiver_id"]) ||
    ""
  );
}

function getPayoutGuruId(row: AnyRow) {
  return (
    getText(row, ["guru_id"]) ||
    getText(row, ["sitter_id"]) ||
    getText(row, ["provider_id"]) ||
    getText(row, ["caregiver_id"]) ||
    getText(row, ["recipient_id"]) ||
    getText(row, ["user_id"]) ||
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
  return getText(guru, ["email"]) || getText(profile, ["email"]) || "";
}

function getGuruServices(guru: AnyRow) {
  const services = guru.services;

  if (Array.isArray(services) && services.length > 0) {
    return services
      .map((service) => String(service).trim())
      .filter(Boolean)
      .join(" | ");
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
    getText(row, [
      "state",
      "service_state",
      "customer_state",
      "booking_state",
      "state_code",
    ]) ||
    getText(profile, ["state", "state_code"]) ||
    ""
  );
}

function getCountry(row: AnyRow | undefined, profile?: AnyRow) {
  return (
    getText(row, [
      "country",
      "service_country",
      "customer_country",
      "booking_country",
    ]) ||
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
    ""
  );
}

function getMostRecentDate(values: string[]) {
  const validDates = values
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  return validDates[0]?.toISOString() || "";
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

function toCsv(rows: GuruFinancialReportRow[]) {
  const headers: Array<keyof GuruFinancialReportRow> = [
    "guru_id",
    "guru_name",
    "email",
    "city",
    "state",
    "country",
    "location",
    "services",
    "gross_revenue",
    "completed_revenue",
    "guru_payouts",
    "sitguru_platform_revenue",
    "refund_amount",
    "dispute_amount",
    "cancellation_loss",
    "total_bookings",
    "completed_bookings",
    "paid_bookings",
    "cancelled_bookings",
    "repeat_customers",
    "average_booking_value",
    "last_booking_date",
  ];

  const csvRows = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ];

  return csvRows.join("\n");
}

async function getGuruPerformanceReportRows() {
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

  const guruMap = new Map<string, GuruFinancialReportRow>();
  const customerBookingsByGuru = new Map<string, Map<string, number>>();

  for (const guru of gurus) {
    const profile = profileMap.get(getGuruProfileKey(guru));
    const guruId = getGuruId(guru);
    if (!guruId) continue;

    const city = getCity(guru, profile);
    const state = getState(guru, profile);
    const country = getCountry(guru, profile);

    guruMap.set(guruId, {
      guru_id: guruId,
      guru_name: getGuruName(guru, profile),
      email: getGuruEmail(guru, profile),
      city,
      state,
      country,
      location: getLocation(city, state, country),
      services: getGuruServices(guru),
      gross_revenue: 0,
      completed_revenue: 0,
      guru_payouts: 0,
      sitguru_platform_revenue: 0,
      refund_amount: 0,
      dispute_amount: 0,
      cancellation_loss: 0,
      total_bookings: 0,
      completed_bookings: 0,
      paid_bookings: 0,
      cancelled_bookings: 0,
      repeat_customers: 0,
      average_booking_value: 0,
      last_booking_date: "",
    });
  }

  for (const booking of bookings) {
    const guruId = getBookingGuruId(booking);
    if (!guruId) continue;

    const existing =
      guruMap.get(guruId) ||
      {
        guru_id: guruId,
        guru_name:
          getText(booking, ["guru_name", "sitter_name", "provider_name"]) ||
          "Guru",
        email:
          getText(booking, ["guru_email", "sitter_email", "provider_email"]) ||
          "",
        city: "",
        state: "",
        country: "",
        location: "Unknown",
        services: getText(
          booking,
          ["service", "service_name", "booking_type"],
          "Pet Care",
        ),
        gross_revenue: 0,
        completed_revenue: 0,
        guru_payouts: 0,
        sitguru_platform_revenue: 0,
        refund_amount: 0,
        dispute_amount: 0,
        cancellation_loss: 0,
        total_bookings: 0,
        completed_bookings: 0,
        paid_bookings: 0,
        cancelled_bookings: 0,
        repeat_customers: 0,
        average_booking_value: 0,
        last_booking_date: "",
      };

    const bookingId = getText(booking, ["id"]);
    const bookingAmount = getBookingAmount(booking);
    const bookingPayout = getBookingPayout(booking);
    const bookingPlatformRevenue = getPlatformRevenue(booking);
    const bookingDate = getBookingDate(booking);

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
        : getText(
            booking,
            ["service", "service_name", "booking_type"],
            existing.services,
          );

    existing.total_bookings += 1;
    existing.gross_revenue += grossAmount;
    existing.completed_revenue += completed || paid ? grossAmount : 0;
    existing.guru_payouts += completed || paid ? bookingPayout : 0;
    existing.sitguru_platform_revenue +=
      completed || paid ? bookingPlatformRevenue : 0;
    existing.completed_bookings += completed ? 1 : 0;
    existing.paid_bookings += paid ? 1 : 0;
    existing.cancelled_bookings += cancelled ? 1 : 0;
    existing.cancellation_loss += cancelled ? grossAmount : 0;
    existing.last_booking_date = getMostRecentDate([
      existing.last_booking_date,
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

    if (payoutAmount > 0 && existing.guru_payouts === 0) {
      existing.guru_payouts += payoutAmount;
    }
  }

  for (const refund of refunds) {
    const guruId = getPaymentGuruId(refund) || getBookingGuruId(refund);
    const existing = guruMap.get(guruId);

    if (!existing) continue;

    existing.refund_amount += getRefundAmount(refund);
  }

  for (const dispute of disputes) {
    const guruId = getPaymentGuruId(dispute) || getBookingGuruId(dispute);
    const existing = guruMap.get(guruId);

    if (!existing) continue;

    existing.dispute_amount += getDisputeAmount(dispute);
  }

  for (const [guruId, customerMap] of customerBookingsByGuru.entries()) {
    const existing = guruMap.get(guruId);
    if (!existing) continue;

    existing.repeat_customers = Array.from(customerMap.values()).filter(
      (count) => count >= 2,
    ).length;
  }

  return Array.from(guruMap.values())
    .map((row) => ({
      ...row,
      average_booking_value:
        row.completed_bookings > 0
          ? Number((row.completed_revenue / row.completed_bookings).toFixed(2))
          : 0,
    }))
    .sort((a, b) => b.completed_revenue - a.completed_revenue);
}

export async function GET() {
  const rows = await getGuruPerformanceReportRows();
  const csv = toCsv(rows);
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sitguru-guru-financial-performance-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}