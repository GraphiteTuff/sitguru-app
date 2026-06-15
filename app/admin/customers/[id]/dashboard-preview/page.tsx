import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  GraduationCap,
  HeartHandshake,
  Mail,
  MapPin,
  PawPrint,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";

import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type AnyRow = Record<string, unknown>;

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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function getText(
  row: AnyRow | null | undefined,
  keys: string[],
  fallback = "",
) {
  if (!row) return fallback;

  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }

  return fallback;
}

function getBoolean(row: AnyRow | null | undefined, keys: string[]) {
  if (!row) return false;

  for (const key of keys) {
    const value = row[key];

    if (typeof value === "boolean") return value;

    if (typeof value === "string") {
      const cleanValue = value.trim().toLowerCase();
      if (
        ["true", "yes", "complete", "completed", "earned"].includes(cleanValue)
      ) {
        return true;
      }
    }
  }

  return false;
}

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return value;
}
function getAmount(row: AnyRow | null | undefined, keys: string[]) {
  if (!row) return 0;

  for (const key of keys) {
    const value = asNumber(row[key]);
    if (value > 0) return value;
  }

  return 0;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value: unknown) {
  const text = asString(value);
  if (!text) return "Not available";

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "Not available";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: unknown) {
  const text = asString(value);
  if (!text) return "Not available";

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "Not available";

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getAuthMetadata(authUser: AnyRow | null | undefined) {
  const userMetadata = authUser?.user_metadata;
  const rawUserMetadata = authUser?.raw_user_meta_data;

  if (userMetadata && typeof userMetadata === "object") {
    return userMetadata as AnyRow;
  }

  if (rawUserMetadata && typeof rawUserMetadata === "object") {
    return rawUserMetadata as AnyRow;
  }

  return null;
}

function getAuthName(authUser: AnyRow | null | undefined) {
  const metadata = getAuthMetadata(authUser);

  return getText(metadata, ["full_name", "name", "display_name"], "");
}

function getRawDisplayName(
  row: AnyRow | null | undefined,
  authUser?: AnyRow | null,
) {
  const firstName = getText(row, ["first_name", "firstName"]);
  const lastName = getText(row, ["last_name", "lastName"]);

  if (firstName || lastName) return `${firstName} ${lastName}`.trim();

  const profileName = getText(
    row,
    [
      "full_name",
      "display_name",
      "name",
      "customer_name",
      "pet_parent_name",
      "owner_name",
    ],
    "",
  );

  if (profileName) return profileName;

  const authName = getAuthName(authUser);
  if (authName) return authName;

  return "";
}

function getDisplayName(
  row: AnyRow | null | undefined,
  authUser?: AnyRow | null,
) {
  const rawName = getRawDisplayName(row, authUser);

  if (rawName) return rawName;

  const profileEmail = getText(row, [
    "email",
    "customer_email",
    "pet_parent_email",
  ]);
  const authEmail = getText(authUser, ["email"]);

  return profileEmail || authEmail || "Pet Parent";
}

function getInitials(name: string) {
  const parts = name
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);

  const firstInitial = parts[0]?.charAt(0) || "P";
  const secondInitial = parts[1]?.charAt(0) || "P";

  return `${firstInitial}${secondInitial}`.toUpperCase();
}

function getEmail(row: AnyRow | null | undefined, authUser?: AnyRow | null) {
  return (
    getText(row, ["email", "customer_email", "pet_parent_email"]) ||
    getText(authUser, ["email"]) ||
    "No email found"
  );
}

function getPhone(row: AnyRow | null | undefined, authUser?: AnyRow | null) {
  return (
    getText(row, ["phone", "phone_number", "mobile", "mobile_phone"]) ||
    getText(authUser, ["phone"]) ||
    "No phone found"
  );
}

function getLocation(row: AnyRow | null | undefined) {
  const city = getText(row, ["city", "customer_city", "location_city"]);
  const state = getText(row, ["state", "state_code", "customer_state"]);
  const zip = getText(row, ["zip", "zipcode", "zip_code", "postal_code"]);

  const cityState = [city, state].filter(Boolean).join(", ");
  const location = [cityState, zip].filter(Boolean).join(" ");

  return location || "Location not added yet";
}

function getCityStateLocation(row: AnyRow | null | undefined) {
  const city = getText(row, [
    "city",
    "customer_city",
    "location_city",
    "service_city",
    "home_city",
  ]);
  const state = getText(row, [
    "state",
    "state_code",
    "customer_state",
    "service_state",
    "home_state",
  ]);

  return [city, state].filter(Boolean).join(", ");
}

function getFirstNameFromDisplayName(name: string) {
  const firstName = name.trim().split(/\s+/)[0];
  return firstName || "there";
}

function generateReferralCode(userId: string, name: string) {
  const cleanName = getFirstNameFromDisplayName(name)
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  const cleanId = userId
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8)
    .toUpperCase();

  return `${cleanName || "SITGURU"}-${cleanId || "COMMUNITY"}`;
}

function buildCustomerReferralLink(referralCode: string) {
  return `/signup?ref=${encodeURIComponent(referralCode)}&type=customer&source=pawperks`;
}

function buildGuruReferralLink(referralCode: string) {
  return `/become-a-guru?ref=${encodeURIComponent(referralCode)}&type=guru&source=pawperks`;
}
function getServiceAddress(row: AnyRow | null | undefined) {
  return getText(
    row,
    [
      "service_address",
      "street_address",
      "address",
      "home_address",
      "customer_address",
    ],
    "",
  );
}

function getCarePreferences(row: AnyRow | null | undefined) {
  return getText(
    row,
    [
      "care_preferences",
      "preferences",
      "notes",
      "household_notes",
      "care_notes",
    ],
    "",
  );
}

function getAvatarUrl(
  row: AnyRow | null | undefined,
  authUser?: AnyRow | null,
) {
  const metadata = getAuthMetadata(authUser);

  return (
    getText(row, [
      "avatar_url",
      "profile_photo_url",
      "photo_url",
      "image_url",
    ]) ||
    getText(metadata, [
      "avatar_url",
      "profile_photo_url",
      "photo_url",
      "picture",
    ]) ||
    ""
  );
}

function getPetName(row: AnyRow) {
  return getText(row, ["name", "pet_name", "animal_name"], "Pet");
}

function getPetDescription(row: AnyRow) {
  return (
    [
      getText(row, ["type", "species", "pet_type"]),
      getText(row, ["breed"]),
      getText(row, ["age"]),
      getText(row, ["weight"]),
    ]
      .filter(Boolean)
      .join(" • ") || "Pet details not completed yet"
  );
}

function getPetNotes(row: AnyRow) {
  return getText(
    row,
    ["notes", "care_notes", "temperament", "medications"],
    "",
  );
}

function getPetPhoto(row: AnyRow) {
  return getText(row, ["photo_url", "image_url", "avatar_url"], "");
}

function getBookingAmount(row: AnyRow) {
  return getAmount(row, [
    "total_customer_paid",
    "customer_total_amount",
    "total_amount",
    "amount",
    "price",
    "subtotal",
    "service_total",
    "total_paid",
  ]);
}

function getBookingDate(row: AnyRow) {
  return getText(row, [
    "booking_date",
    "start_time",
    "start_date",
    "created_at",
    "updated_at",
  ]);
}

function getBookingStatus(row: AnyRow) {
  return getText(
    row,
    ["status", "booking_status", "payment_status"],
    "Unknown",
  );
}

function getAuthProvider(authUser: AnyRow | null) {
  const appMetadata = authUser?.app_metadata as AnyRow | undefined;
  const metadata = getAuthMetadata(authUser);

  const provider =
    getText(appMetadata, ["provider"]) ||
    getText(metadata, ["provider"]) ||
    getText(authUser, ["provider"]);

  const providers = Array.isArray(appMetadata?.providers)
    ? appMetadata.providers.filter(Boolean).join(", ")
    : "";

  return provider || providers || "Unknown";
}

function getRelatedRecordId({
  lookupKey,
  profile,
  authUser,
}: {
  lookupKey: string;
  profile: AnyRow | null;
  authUser: AnyRow | null;
}) {
  return (
    getText(profile, ["id"]) ||
    getText(authUser, ["id"]) ||
    (isUuid(lookupKey) ? lookupKey : "")
  );
}

function buildRelatedIdFilters(customerId: string) {
  return [
    `customer_id.eq.${customerId}`,
    `pet_owner_id.eq.${customerId}`,
    `user_id.eq.${customerId}`,
    `pet_parent_id.eq.${customerId}`,
  ].join(",");
}

function buildPetIdFilters(customerId: string) {
  return [
    `owner_profile_id.eq.${customerId}`,
    `owner_id.eq.${customerId}`,
    `customer_id.eq.${customerId}`,
    `pet_parent_id.eq.${customerId}`,
    `user_id.eq.${customerId}`,
  ].join(",");
}

function buildMessageSenderFilters(customerId: string) {
  return [
    `sender_id.eq.${customerId}`,
    `from_user_id.eq.${customerId}`,
    `customer_id.eq.${customerId}`,
    `user_id.eq.${customerId}`,
  ].join(",");
}

function buildMessageRecipientFilters(customerId: string) {
  return [`recipient_id.eq.${customerId}`, `to_user_id.eq.${customerId}`].join(
    ",",
  );
}

async function safeSelect(
  table: string,
  select: string,
  filter: (query: any) => any,
) {
  try {
    const query = supabaseAdmin.from(table).select(select);
    const result = await filter(query);

    if (result.error) return [];

    return Array.isArray(result.data) ? (result.data as AnyRow[]) : [];
  } catch {
    return [];
  }
}

async function safeProfileLookup(column: string, value: string) {
  if (!value) return null;

  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq(column, value)
      .maybeSingle();

    if (error || !data) return null;

    return data as AnyRow;
  } catch {
    return null;
  }
}

async function getAuthUserById(userId: string) {
  if (!isUuid(userId)) return null;

  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (error || !data?.user) return null;

    return data.user as unknown as AnyRow;
  } catch {
    return null;
  }
}

async function getAuthUserByEmail(email: string) {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes("@")) return null;

  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error || !data?.users?.length) return null;

    const match = data.users.find(
      (user) => user.email?.trim().toLowerCase() === cleanEmail,
    );

    return match ? (match as unknown as AnyRow) : null;
  } catch {
    return null;
  }
}

async function getAuthUserByLookupKey(lookupKey: string) {
  if (isUuid(lookupKey)) return getAuthUserById(lookupKey);

  return getAuthUserByEmail(lookupKey);
}

async function getProfileByLookupKey(lookupKey: string) {
  const cleanLookup = lookupKey.trim();

  if (!cleanLookup) return null;

  const directProfile =
    (isUuid(cleanLookup) ? await safeProfileLookup("id", cleanLookup) : null) ||
    (cleanLookup.includes("@")
      ? await safeProfileLookup("email", cleanLookup.toLowerCase())
      : null);

  if (directProfile) return directProfile;

  if (isUuid(cleanLookup)) {
    const fallbackColumns = [
      "user_id",
      "auth_user_id",
      "customer_id",
      "pet_parent_id",
      "profile_id",
    ];

    for (const column of fallbackColumns) {
      const match = await safeProfileLookup(column, cleanLookup);
      if (match) return match;
    }
  }

  return null;
}

async function resolvePetParentRecord(lookupKey: string) {
  let profile = await getProfileByLookupKey(lookupKey);
  let authUser = await getAuthUserByLookupKey(lookupKey);

  if (!authUser && profile?.id && isUuid(String(profile.id))) {
    authUser = await getAuthUserById(String(profile.id));
  }

  if (!authUser) {
    const profileEmail = getText(profile, [
      "email",
      "customer_email",
      "pet_parent_email",
    ]);

    if (profileEmail) {
      authUser = await getAuthUserByEmail(profileEmail);
    }
  }

  if (!profile && authUser?.id) {
    profile = await getProfileByLookupKey(String(authUser.id));
  }

  if (!profile) {
    const authEmail = getText(authUser, ["email"]);

    if (authEmail) {
      profile = await getProfileByLookupKey(authEmail);
    }
  }

  if (profile && !authUser) {
    const profileEmail = getText(profile, [
      "email",
      "customer_email",
      "pet_parent_email",
    ]);

    if (profileEmail) {
      authUser = await getAuthUserByEmail(profileEmail);
    }
  }

  if (authUser && !profile) {
    const authEmail = getText(authUser, ["email"]);

    if (authEmail) {
      profile = await getProfileByLookupKey(authEmail);
    }
  }

  return {
    profile,
    authUser,
  };
}

function getVerifiedFields(profile: AnyRow | null, authUser: AnyRow | null) {
  const hasEmail = Boolean(getEmail(profile, authUser) !== "No email found");
  const hasPhone = Boolean(getPhone(profile, authUser) !== "No phone found");
  const hasConfirmedEmail = Boolean(
    getText(authUser, ["email_confirmed_at", "confirmed_at"]),
  );
  const hasConfirmedPhone = Boolean(getText(authUser, ["phone_confirmed_at"]));

  return {
    hasEmail,
    hasPhone,
    hasConfirmedEmail,
    hasConfirmedPhone,
  };
}

function getCertifiedPetParent(
  profile: AnyRow | null,
  authUser: AnyRow | null,
) {
  const metadata = getAuthMetadata(authUser);
  const certifiedKeys = [
    "certified_pet_parent",
    "pet_parent_certified",
    "pet_parent_academy_completed",
    "academy_completed",
    "is_certified_pet_parent",
    "completed_pet_parent_academy",
  ];

  return (
    getBoolean(profile, certifiedKeys) || getBoolean(metadata, certifiedKeys)
  );
}
function hasRealName(profile: AnyRow | null, authUser: AnyRow | null) {
  const name = getRawDisplayName(profile, authUser).trim().toLowerCase();

  if (!name) return false;

  return ![
    "customer",
    "pet parent",
    "petparent",
    "unknown",
    "unknown customer",
    "unknown pet parent",
    "incomplete pet parent preview",
    "test",
    "demo",
    "fake",
    "sample",
  ].includes(name);
}

function hasLocation(profile: AnyRow | null) {
  return getLocation(profile) !== "Location not added yet";
}

function getProfileCompletion({
  profile,
  authUser,
  petsCount,
  bookingsCount,
  messagesCount,
}: {
  profile: AnyRow | null;
  authUser: AnyRow | null;
  petsCount: number;
  bookingsCount: number;
  messagesCount: number;
}) {
  const verified = getVerifiedFields(profile, authUser);
  const checks = [
    Boolean(profile),
    hasRealName(profile, authUser),
    verified.hasEmail,
    verified.hasConfirmedEmail || verified.hasConfirmedPhone,
    verified.hasPhone,
    hasLocation(profile),
    petsCount > 0,
    bookingsCount > 0 || messagesCount > 0,
  ];

  const completed = checks.filter(Boolean).length;

  return Math.round((completed / checks.length) * 100);
}

function getNextBooking(bookings: AnyRow[]) {
  const now = Date.now();

  return (
    bookings
      .filter((booking) => {
        const rawDate = getBookingDate(booking);
        if (!rawDate) return false;

        const date = new Date(rawDate).getTime();
        if (!Number.isFinite(date)) return false;

        const status = getBookingStatus(booking).toLowerCase();

        return (
          date >= now - 24 * 60 * 60 * 1000 &&
          !["cancelled", "canceled", "completed", "complete"].includes(status)
        );
      })
      .sort(
        (a, b) =>
          new Date(getBookingDate(a)).getTime() -
          new Date(getBookingDate(b)).getTime(),
      )[0] || null
  );
}

export default async function AdminCustomerDashboardPreviewPage({
  params,
}: PageProps) {
  const resolvedParams = await params;
  const lookupKey = decodeURIComponent(resolvedParams.id || "").trim();

  const { profile, authUser } = await resolvePetParentRecord(lookupKey);

  const relatedCustomerId = getRelatedRecordId({
    lookupKey,
    profile,
    authUser,
  });

  const canLoadRelatedRows = Boolean(
    relatedCustomerId && isUuid(relatedCustomerId),
  );

  const [bookings, pets, sentMessages, receivedMessages, referralProfiles] =
    canLoadRelatedRows
      ? await Promise.all([
          safeSelect("bookings", "*", (query) =>
            query
              .or(buildRelatedIdFilters(relatedCustomerId))
              .order("created_at", { ascending: false }),
          ),
          safeSelect("pets", "*", (query) =>
            query
              .or(buildPetIdFilters(relatedCustomerId))
              .order("created_at", { ascending: false }),
          ),
          safeSelect("messages", "*", (query) =>
            query
              .or(buildMessageSenderFilters(relatedCustomerId))
              .order("created_at", { ascending: false }),
          ),
          safeSelect("messages", "*", (query) =>
            query
              .or(buildMessageRecipientFilters(relatedCustomerId))
              .order("created_at", { ascending: false }),
          ),
          safeSelect("referral_profiles", "*", (query) =>
            query.eq("user_id", relatedCustomerId).limit(1),
          ),
        ])
      : [[], [], [], [], []];

  const messages = [...sentMessages, ...receivedMessages].sort((a, b) => {
    const aTime = new Date(getText(a, ["created_at"])).getTime() || 0;
    const bTime = new Date(getText(b, ["created_at"])).getTime() || 0;

    return bTime - aTime;
  });

  const hasAnyPreviewData = Boolean(
    profile ||
    authUser ||
    bookings.length > 0 ||
    pets.length > 0 ||
    messages.length > 0,
  );
  const previewIsIncomplete = !profile || !authUser;

  const name = hasAnyPreviewData
    ? getDisplayName(profile, authUser)
    : "Incomplete Pet Parent Preview";
  const firstName = getFirstNameFromDisplayName(name);
  const email = hasAnyPreviewData
    ? getEmail(profile, authUser)
    : "No email found";
  const phone = hasAnyPreviewData
    ? formatPhoneNumber(getPhone(profile, authUser))
    : "No phone found";
  const location = hasAnyPreviewData
    ? getLocation(profile)
    : "Location not added yet";
  const cityStateLocation = hasAnyPreviewData
    ? getCityStateLocation(profile)
    : "";
  const avatarUrl = getAvatarUrl(profile, authUser);
  const nextBooking = getNextBooking(bookings);
  const certifiedPetParent = getCertifiedPetParent(profile, authUser);
  const referralProfile = Array.isArray(referralProfiles)
    ? referralProfiles[0]
    : null;
  const referralCode =
    getText(referralProfile, ["referral_code"]) ||
    (relatedCustomerId
      ? generateReferralCode(relatedCustomerId, name)
      : "COMMUNITY");
  const customerReferralLink = buildCustomerReferralLink(referralCode);
  const guruReferralLink = buildGuruReferralLink(referralCode);
  const availableCredit = getAmount(referralProfile, [
    "available_credit",
    "credit",
    "available_rewards",
  ]);
  const completedReferrals = getAmount(referralProfile, [
    "completed_referrals",
    "completed",
    "referrals_completed",
  ]);

  return (
    <main className="min-h-screen bg-[#f7fbf7] px-4 py-6 text-[#062f2b] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/admin/customers/${encodeURIComponent(
                relatedCustomerId || lookupKey,
              )}`}
              className="inline-flex items-center gap-2 text-sm font-extrabold text-emerald-800 hover:text-emerald-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin Profile
            </Link>

            <Link
              href={`/admin/customers/${encodeURIComponent(
                relatedCustomerId || lookupKey,
              )}/public-profile-preview`}
              className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-600 hover:text-slate-950"
            >
              Public Profile Preview
            </Link>
          </div>

          <div className="mt-5 rounded-[2rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              Super Admin Pet Parent Dashboard Preview
            </p>
            <p className="mt-1 text-sm font-semibold leading-6 text-emerald-950">
              This is a read-only Super Admin preview of the Pet Parent
              dashboard data. It does not impersonate the user and does not
              modify their account.
            </p>
          </div>

          {previewIsIncomplete ? (
            <div className="mt-4 rounded-[2rem] border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                Incomplete Pet Parent Record
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 text-amber-950">
                This preview is using the available Pet Parent lookup value and
                any related pets, bookings, or messages that can be found. The
                Supabase profile row or Auth user may still need cleanup,
                linking, or completion.
              </p>
              <p className="mt-2 break-all text-xs font-black text-amber-900">
                Lookup: {lookupKey}
              </p>
            </div>
          ) : null}
        </div>

        <section className="overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 bg-[radial-gradient(circle_at_78%_20%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#00d69f_0%,#66e3c7_48%,#b8e5ff_100%)] px-6 py-8 md:px-10 md:py-12 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-900/80 md:text-sm">
                SitGuru Pet Parent Dashboard Preview
              </p>

              <h1 className="mt-4 max-w-4xl text-4xl font-extrabold tracking-[-0.045em] text-slate-950 md:text-6xl lg:text-7xl">
                Welcome back, {firstName} <span aria-hidden="true">👋</span>
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-900/75 md:text-xl">
                This preview mirrors the updated Pet Parent dashboard
                experience: pets, bookings, PawPerks rewards, referrals,
                messages, and SitGuru University.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <TrustBadge
                  icon={<PawPrint className="h-4 w-4" />}
                  label="Pet Parent"
                  tone="emerald"
                />

                <TrustBadge
                  icon={<Star className="h-4 w-4" />}
                  label={`PawPerks code: ${referralCode}`}
                  tone="white"
                />

                {certifiedPetParent ? (
                  <TrustBadge
                    icon={<ShieldCheck className="h-4 w-4" />}
                    label="Certified Pet Parent"
                    tone="white"
                  />
                ) : null}

                {nextBooking ? (
                  <TrustBadge
                    icon={<CalendarDays className="h-4 w-4" />}
                    label={`Next booking: ${formatDate(
                      getBookingDate(nextBooking),
                    )}`}
                    tone="white"
                  />
                ) : null}
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-white/30 blur-xl" />
                <div className="relative flex h-44 w-44 items-center justify-center overflow-hidden rounded-full border-[8px] border-white bg-gradient-to-br from-emerald-50 to-white text-5xl font-extrabold text-emerald-700 shadow-2xl md:h-56 md:w-56">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={`${name} profile photo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(name)
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-emerald-500 text-2xl shadow-lg">
                  🐾
                </div>
              </div>

              <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
                {name}
              </h2>
              <p className="mt-2 text-lg font-semibold text-slate-700">
                SitGuru Pet Parent
              </p>
              {cityStateLocation ? (
                <p className="mt-1 text-base font-black text-slate-800">
                  {cityStateLocation}
                </p>
              ) : null}
              <p className="mt-1 max-w-xs text-sm font-semibold leading-6 text-slate-600">
                {pets.length > 0
                  ? `${pets.length} pet profile${
                      pets.length === 1 ? "" : "s"
                    } ready for care`
                  : "Pet profiles can be added anytime"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 bg-white px-6 py-6 md:grid-cols-2 lg:grid-cols-6 md:px-8">
            <DashboardStatCard
              icon={<CalendarDays className="h-5 w-5" />}
              label="Upcoming Booking"
              value={
                nextBooking ? formatDate(getBookingDate(nextBooking)) : "None"
              }
              detail={nextBooking ? "View care details" : "Book care"}
            />

            <DashboardStatCard
              icon={<PawPrint className="h-5 w-5" />}
              label="My Pets"
              value={`${pets.length} ${pets.length === 1 ? "Pet" : "Pets"}`}
              detail="Manage pets"
            />

            <DashboardStatCard
              icon={<ShieldCheck className="h-5 w-5" />}
              label="Bookings"
              value={String(bookings.length)}
              detail="View history"
            />

            <DashboardStatCard
              icon={<Star className="h-5 w-5" />}
              label="PawPerks"
              value={formatMoney(availableCredit)}
              detail="Invite friends"
            />

            <DashboardStatCard
              icon={<HeartHandshake className="h-5 w-5" />}
              label="Referrals"
              value={String(completedReferrals)}
              detail="Completed"
            />

            <DashboardStatCard
              icon={<GraduationCap className="h-5 w-5" />}
              label="University"
              value={certifiedPetParent ? "Certified" : "Start"}
              detail={
                certifiedPetParent
                  ? "Certified Pet Parent"
                  : "Earn certification"
              }
            />
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <PreviewCard>
            <SectionHeader
              eyebrow="PawPerks Rewards"
              title="Share SitGuru and earn rewards"
              description={`Admin preview of ${firstName}'s Pet Parent referral center.`}
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <MiniBox label="Referral Code" value={referralCode} />
              <MiniBox
                label="Available Credit"
                value={formatMoney(availableCredit)}
              />
              <MiniBox
                label="Completed Referrals"
                value={String(completedReferrals)}
              />
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm font-black text-emerald-950">
                Pet Parent invite
              </p>
              <p className="mt-2 break-all text-sm font-bold leading-6 text-emerald-800">
                {customerReferralLink}
              </p>
              <p className="mt-4 text-sm font-black text-emerald-950">
                Guru invite
              </p>
              <p className="mt-2 break-all text-sm font-bold leading-6 text-emerald-800">
                {guruReferralLink}
              </p>
            </div>
          </PreviewCard>

          <PreviewCard>
            <SectionHeader
              eyebrow="Pet Parent Academy"
              title="SitGuru University"
              description="Pet Parents can review short lessons and earn their Certified Pet Parent badge."
            />

            <div className="mt-5 rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 ring-1 ring-emerald-100">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base font-black text-emerald-950">
                    {certifiedPetParent
                      ? "Certified Pet Parent"
                      : "Pet Parent Academy available"}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-emerald-900">
                    {certifiedPetParent
                      ? `${firstName} has completed the Pet Parent Academy.`
                      : `${firstName} can complete Pet Parent Academy anytime to learn SitGuru best practices.`}
                  </p>
                </div>
              </div>
            </div>
          </PreviewCard>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-5">
            <PreviewCard>
              <SectionHeader
                eyebrow="Pet Parent Profile"
                title="Pet Parent profile details"
                description="Admin-only account fields connected to this Pet Parent."
              />

              <div className="mt-5 space-y-3">
                <InfoRow
                  icon={<UserRound className="h-5 w-5 text-emerald-700" />}
                  label="Display name"
                  value={name}
                />
                <InfoRow
                  icon={<Mail className="h-5 w-5 text-emerald-700" />}
                  label="Email"
                  value={email}
                />
                <InfoRow
                  icon={<UserRound className="h-5 w-5 text-emerald-700" />}
                  label="Phone"
                  value={phone}
                />
                <InfoRow
                  icon={<MapPin className="h-5 w-5 text-emerald-700" />}
                  label="Location"
                  value={location}
                />
              </div>
            </PreviewCard>
          </div>

          <div className="space-y-5">
            <PreviewCard>
              <SectionHeader
                eyebrow="Care Activity"
                title="Upcoming and recent bookings"
                description="Upcoming and recent care activity connected to this Pet Parent."
              />

              <div className="mt-5 space-y-3">
                {bookings.length ? (
                  bookings.slice(0, 6).map((booking) => (
                    <div
                      key={String(booking.id)}
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-base font-black text-slate-950">
                            {getText(
                              booking,
                              ["pet_name", "animal_name"],
                              "Pet Care",
                            )}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-600">
                            {formatDate(getBookingDate(booking))} •{" "}
                            {getBookingStatus(booking)}
                          </p>
                        </div>
                        <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-800 ring-1 ring-emerald-100">
                          {formatMoney(getBookingAmount(booking))}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-bold leading-6 text-slate-600">
                    No bookings yet. Care activity will appear here once this
                    Pet Parent books a Guru.
                  </div>
                )}
              </div>
            </PreviewCard>

            <PreviewCard>
              <SectionHeader
                eyebrow="Pets"
                title="Pet profiles"
                description={`Pets connected to ${firstName}'s Pet Parent dashboard preview.`}
              />

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {pets.length ? (
                  pets.slice(0, 4).map((pet) => (
                    <article
                      key={String(pet.id)}
                      className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50"
                    >
                      <div className="flex h-40 items-center justify-center overflow-hidden bg-emerald-50">
                        {getPetPhoto(pet) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getPetPhoto(pet)}
                            alt={getPetName(pet)}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <PawPrint className="h-12 w-12 text-emerald-600" />
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="text-lg font-black text-slate-950">
                          {getPetName(pet)}
                        </h3>
                        <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
                          {getPetDescription(pet)}
                        </p>
                        {getPetNotes(pet) ? (
                          <p className="mt-3 line-clamp-3 rounded-2xl bg-white p-3 text-sm font-semibold leading-6 text-slate-600">
                            {getPetNotes(pet)}
                          </p>
                        ) : null}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-bold leading-6 text-slate-600 md:col-span-2">
                    Pet profiles will appear here once added.
                  </div>
                )}
              </div>
            </PreviewCard>
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
          <SectionHeader
            eyebrow="Messages"
            title="Message activity"
            description="Recent message activity connected to this Pet Parent."
          />

          <div className="mt-5 space-y-3">
            {messages.length ? (
              messages.slice(0, 8).map((message) => (
                <div
                  key={String(message.id)}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <p className="text-sm font-black text-slate-950">
                      {getText(message, ["subject", "title"], "Message")}
                    </p>
                    <p className="text-xs font-bold text-slate-500">
                      {formatDateTime(message.created_at)}
                    </p>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">
                    {getText(
                      message,
                      ["body", "message", "content", "snippet"],
                      "No message preview available.",
                    )}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-bold leading-6 text-slate-600">
                No messages yet. Message activity will appear here when this Pet
                Parent connects with Gurus or support.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
          <SectionHeader
            eyebrow="Record Source"
            title="Admin-only technical details"
            description="Visible to Super Admin only. Confirms which account record this preview is using."
          />

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MiniBox label="Lookup Value" value={lookupKey} />
            <MiniBox label="Resolved ID" value={relatedCustomerId || "—"} />
            <MiniBox label="Auth User" value={authUser ? "Found" : "Missing"} />
            <MiniBox
              label="Profile Row"
              value={profile ? "Found" : "Missing"}
            />
            <MiniBox label="Auth Provider" value={getAuthProvider(authUser)} />
            <MiniBox
              label="Auth Created"
              value={formatDateTime(authUser?.created_at)}
            />
            <MiniBox
              label="Profile Created"
              value={formatDateTime(profile?.created_at)}
            />
            <MiniBox
              label="Profile Updated"
              value={formatDateTime(profile?.updated_at)}
            />
          </div>
        </section>
      </section>
    </main>
  );
}

function TrustBadge({
  icon,
  label,
  tone,
}: {
  icon: ReactNode;
  label: string;
  tone: "emerald" | "white";
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold shadow-sm ring-1",
        tone === "emerald"
          ? "bg-emerald-700 text-white ring-emerald-600/20"
          : "bg-white/85 text-slate-800 ring-white/70",
      ].join(" ")}
    >
      {icon}
      {label}
    </span>
  );
}

function DashboardStatCard({
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
    <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 truncate text-2xl font-extrabold text-slate-950">
            {value}
          </p>
          <p className="mt-3 text-sm font-bold text-emerald-700">{detail}</p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          {icon}
        </div>
      </div>
    </div>
  );
}

function PreviewCard({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
      {children}
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      {icon}
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          {label}
        </p>
        <p className="break-words text-sm font-black">{value || "—"}</p>
      </div>
    </div>
  );
}

function MiniBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black">{value || "—"}</p>
    </div>
  );
}
