import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type SafeAdminQueryResponse = {
  data: unknown;
  error: unknown;
};

type CustomerReportRow = {
  customer_id: string;
  customer_name: string;
  email: string;
  segment: string;
  source: string;
  campaign: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  booking_count: number;
  paid_booking_count: number;
  completed_booking_count: number;
  total_spend: number;
  average_booking_value: number;
  pet_count: number;
  message_count: number;
  first_seen_date: string;
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

  return 0;
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

function isCustomerProfile(profile: AnyRow) {
  const role = getRole(profile);

  if (!role) return true;

  return (
    role.includes("customer") ||
    role.includes("parent") ||
    role.includes("client") ||
    role.includes("owner")
  );
}

function getCustomerId(booking: AnyRow) {
  return getText(
    booking,
    ["customer_id", "pet_owner_id", "client_id", "user_id"],
    "",
  );
}

function getPetOwnerId(pet: AnyRow) {
  return getText(
    pet,
    ["owner_id", "customer_id", "user_id", "pet_owner_id"],
    "",
  );
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

function getBookingAmount(booking: AnyRow) {
  return getAmount(booking, [
    "total_customer_paid",
    "total_amount",
    "booking_total",
    "amount",
    "price",
  ]);
}

function getBookingStatus(booking: AnyRow) {
  return getText(booking, ["status", "booking_status"], "").toLowerCase();
}

function getPaymentStatus(booking: AnyRow) {
  return getText(booking, ["payment_status"], "").toLowerCase();
}

function isPaidBooking(booking: AnyRow) {
  const paymentStatus = getPaymentStatus(booking);
  const bookingStatus = getBookingStatus(booking);

  return (
    paymentStatus === "paid" ||
    paymentStatus === "succeeded" ||
    bookingStatus.includes("paid") ||
    bookingStatus.includes("complete")
  );
}

function isCompletedBooking(booking: AnyRow) {
  const status = getBookingStatus(booking);
  return status.includes("complete") || status.includes("paid");
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

function getMostRecentDate(values: string[]) {
  const validDates = values
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  return validDates[0]?.toISOString() || "";
}

function getOldestDate(values: string[]) {
  const validDates = values
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  return validDates[0]?.toISOString() || "";
}

function getCustomerSegment(customer: CustomerReportRow) {
  if (customer.total_spend >= 1000 || customer.booking_count >= 8) {
    return "VIP";
  }

  if (customer.booking_count >= 3) {
    return "Repeat";
  }

  if (customer.booking_count === 1) {
    return "New";
  }

  return "Lead";
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

function toCsv(rows: CustomerReportRow[]) {
  const headers: Array<keyof CustomerReportRow> = [
    "customer_id",
    "customer_name",
    "email",
    "segment",
    "source",
    "campaign",
    "city",
    "state",
    "country",
    "zip_code",
    "booking_count",
    "paid_booking_count",
    "completed_booking_count",
    "total_spend",
    "average_booking_value",
    "pet_count",
    "message_count",
    "first_seen_date",
    "last_booking_date",
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
      console.warn(`Customer intelligence export skipped ${label}:`, result.error);
      return { data: [], error: null };
    }

    return result;
  } catch (error) {
    console.warn(`Customer intelligence export skipped ${label}:`, error);
    return { data: [], error: null };
  }
}

async function getReportRows() {
  const [profilesResult, bookingsResult, petsResult, messagesResult] =
    await Promise.all([
      safeAdminQuery(
        supabaseAdmin
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5000),
        "profiles",
      ),
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
          .from("pets")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5000),
        "pets",
      ),
      safeAdminQuery(
        supabaseAdmin
          .from("messages")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5000),
        "messages",
      ),
    ]);

  const profiles = ((profilesResult.data || []) as AnyRow[]).filter(Boolean);
  const bookings = ((bookingsResult.data || []) as AnyRow[]).filter(Boolean);
  const pets = ((petsResult.data || []) as AnyRow[]).filter(Boolean);
  const messages = ((messagesResult.data || []) as AnyRow[]).filter(Boolean);

  const customerMap = new Map<string, CustomerReportRow>();

  for (const profile of profiles) {
    const profileId = getText(profile, ["id"]);
    if (!profileId) continue;
    if (!isCustomerProfile(profile)) continue;

    customerMap.set(profileId, {
      customer_id: profileId,
      customer_name: getDisplayName(profile, "Customer"),
      email: getText(profile, ["email"]),
      segment: "Lead",
      source: normalizeSource(getSource(profile)),
      campaign: getCampaign(profile),
      city: getCity(profile),
      state: getState(profile),
      country: getCountry(profile),
      zip_code: getZipCode(profile),
      booking_count: 0,
      paid_booking_count: 0,
      completed_booking_count: 0,
      total_spend: 0,
      average_booking_value: 0,
      pet_count: 0,
      message_count: 0,
      first_seen_date: getText(profile, ["created_at", "updated_at"]),
      last_booking_date: "",
    });
  }

  for (const booking of bookings) {
    const customerId =
      getCustomerId(booking) ||
      getText(booking, ["customer_email"]) ||
      getText(booking, ["customer_name"]) ||
      getText(booking, ["pet_parent_name"]) ||
      getText(booking, ["owner_name"]) ||
      getText(booking, ["id"]);

    if (!customerId) continue;

    const bookingSource = normalizeSource(getSource(booking));

    const existing =
      customerMap.get(customerId) ||
      {
        customer_id: customerId,
        customer_name: getDisplayName(booking, "Customer"),
        email: getText(booking, ["customer_email"]),
        segment: "Lead",
        source: bookingSource,
        campaign: getCampaign(booking),
        city: "",
        state: "",
        country: "",
        zip_code: "",
        booking_count: 0,
        paid_booking_count: 0,
        completed_booking_count: 0,
        total_spend: 0,
        average_booking_value: 0,
        pet_count: 0,
        message_count: 0,
        first_seen_date: getText(booking, ["created_at", "updated_at"]),
        last_booking_date: "",
      };

    existing.city = existing.city || getCity(booking);
    existing.state = existing.state || getState(booking);
    existing.country = existing.country || getCountry(booking);
    existing.zip_code = existing.zip_code || getZipCode(booking);
    existing.source =
      existing.source && existing.source !== "Direct"
        ? existing.source
        : bookingSource;
    existing.campaign = existing.campaign || getCampaign(booking);
    existing.booking_count += 1;
    existing.paid_booking_count += isPaidBooking(booking) ? 1 : 0;
    existing.completed_booking_count += isCompletedBooking(booking) ? 1 : 0;
    existing.total_spend += getBookingAmount(booking);
    existing.last_booking_date = getMostRecentDate([
      existing.last_booking_date,
      getBookingDate(booking),
    ]);
    existing.first_seen_date = getOldestDate([
      existing.first_seen_date,
      getText(booking, ["created_at", "updated_at"]),
      getBookingDate(booking),
    ]);

    customerMap.set(customerId, existing);
  }

  const petOwnerCountMap = new Map<string, number>();

  for (const pet of pets) {
    const ownerId = getPetOwnerId(pet);
    if (!ownerId) continue;

    petOwnerCountMap.set(ownerId, (petOwnerCountMap.get(ownerId) || 0) + 1);
  }

  for (const [customerId, petCount] of petOwnerCountMap.entries()) {
    const existing = customerMap.get(customerId);
    if (existing) existing.pet_count = petCount;
  }

  const messageCountMap = new Map<string, number>();

  for (const message of messages) {
    const participantIds = [
      getText(message, ["sender_id"]),
      getText(message, ["recipient_id"]),
      getText(message, ["customer_id"]),
      getText(message, ["user_id"]),
      getText(message, ["from_user_id"]),
      getText(message, ["to_user_id"]),
    ].filter(Boolean);

    for (const participantId of participantIds) {
      messageCountMap.set(
        participantId,
        (messageCountMap.get(participantId) || 0) + 1,
      );
    }
  }

  for (const [customerId, messageCount] of messageCountMap.entries()) {
    const existing = customerMap.get(customerId);
    if (existing) existing.message_count = messageCount;
  }

  return Array.from(customerMap.values())
    .map((customer) => {
      const averageBookingValue =
        customer.booking_count > 0
          ? customer.total_spend / customer.booking_count
          : 0;

      const enriched = {
        ...customer,
        average_booking_value: Number(averageBookingValue.toFixed(2)),
      };

      return {
        ...enriched,
        segment: getCustomerSegment(enriched),
      };
    })
    .sort((a, b) => b.total_spend - a.total_spend);
}

export async function GET() {
  const rows = await getReportRows();
  const csv = toCsv(rows);
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sitguru-customer-intelligence-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}