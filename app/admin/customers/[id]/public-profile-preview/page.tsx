import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  HeartHandshake,
  Mail,
  MapPin,
  MessageSquare,
  PawPrint,
  ShieldCheck,
  Sparkles,
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

function getText(row: AnyRow | null | undefined, keys: string[], fallback = "") {
  if (!row) return fallback;

  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }

  return fallback;
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

function getRawDisplayName(row: AnyRow | null | undefined, authUser?: AnyRow | null) {
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

function getDisplayName(row: AnyRow | null | undefined, authUser?: AnyRow | null) {
  const rawName = getRawDisplayName(row, authUser);

  if (rawName) return rawName;

  const profileEmail = getText(row, ["email", "customer_email", "pet_parent_email"]);
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

function getAvatarUrl(row: AnyRow | null | undefined, authUser?: AnyRow | null) {
  const metadata = getAuthMetadata(authUser);

  return (
    getText(row, ["avatar_url", "profile_photo_url", "photo_url", "image_url"]) ||
    getText(metadata, ["avatar_url", "profile_photo_url", "photo_url", "picture"]) ||
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
  return getText(row, ["notes", "care_notes", "temperament", "medications"], "");
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
  return getText(row, ["booking_date", "start_time", "start_date", "created_at", "updated_at"]);
}

function getBookingStatus(row: AnyRow) {
  return getText(row, ["status", "booking_status", "payment_status"], "Unknown");
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
  return [
    `recipient_id.eq.${customerId}`,
    `to_user_id.eq.${customerId}`,
  ].join(",");
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
  try {
    if (isUuid(lookupKey)) {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", lookupKey)
        .maybeSingle();

      if (error) return null;

      return (data ?? null) as AnyRow | null;
    }

    if (lookupKey.includes("@")) {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("email", lookupKey)
        .maybeSingle();

      if (error) return null;

      return (data ?? null) as AnyRow | null;
    }

    return null;
  } catch {
    return null;
  }
}

function getProfileCompleteness({
  profile,
  petsCount,
}: {
  profile: AnyRow | null;
  petsCount: number;
}) {
  const fields = [
    getDisplayName(profile),
    getEmail(profile),
    getPhone(profile),
    getLocation(profile),
    getServiceAddress(profile),
    getCarePreferences(profile),
    petsCount > 0 ? "pets" : "",
  ];

  const completed = fields.filter((field) => {
    const value = String(field || "").trim();
    return (
      value &&
      value !== "No email found" &&
      value !== "No phone found" &&
      value !== "Location not added yet"
    );
  }).length;

  return Math.round((completed / fields.length) * 100);
}

function getTrustReadiness({
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
  const emailConfirmed = Boolean(
    getText(authUser, ["email_confirmed_at", "confirmed_at"]),
  );
  const phoneConfirmed = Boolean(getText(authUser, ["phone_confirmed_at"]));
  const hasPhoto = Boolean(getAvatarUrl(profile, authUser));
  const hasPets = petsCount > 0;
  const hasCarePreferences = Boolean(getCarePreferences(profile));
  const hasActivity = bookingsCount > 0 || messagesCount > 0;

  const checks = [
    {
      label: "Contact verified",
      complete: emailConfirmed || phoneConfirmed,
      detail: emailConfirmed
        ? "Email verified"
        : phoneConfirmed
          ? "Phone verified"
          : "Verification not found",
    },
    {
      label: "Profile photo",
      complete: hasPhoto,
      detail: hasPhoto ? "Photo added" : "No photo yet",
    },
    {
      label: "Pet profiles",
      complete: hasPets,
      detail: hasPets ? `${petsCount} pet profile${petsCount === 1 ? "" : "s"}` : "No pets yet",
    },
    {
      label: "Care preferences",
      complete: hasCarePreferences,
      detail: hasCarePreferences ? "Added" : "Not added yet",
    },
    {
      label: "Platform activity",
      complete: hasActivity,
      detail:
        bookingsCount > 0
          ? `${bookingsCount} booking${bookingsCount === 1 ? "" : "s"}`
          : messagesCount > 0
            ? `${messagesCount} message${messagesCount === 1 ? "" : "s"}`
            : "No activity yet",
    },
  ];

  return checks;
}

export default async function AdminCustomerPublicProfilePreviewPage({
  params,
}: PageProps) {
  const resolvedParams = await params;
  const lookupKey = decodeURIComponent(resolvedParams.id || "").trim();

  const [profile, authUserByLookup] = await Promise.all([
    getProfileByLookupKey(lookupKey),
    getAuthUserByLookupKey(lookupKey),
  ]);

  const authUser =
    authUserByLookup ||
    (profile?.id ? await getAuthUserById(String(profile.id)) : null);

  const relatedCustomerId = getRelatedRecordId({
    lookupKey,
    profile,
    authUser,
  });

  const canLoadRelatedRows = Boolean(relatedCustomerId && isUuid(relatedCustomerId));

  const [bookings, pets, sentMessages, receivedMessages] = canLoadRelatedRows
    ? await Promise.all([
        safeSelect("bookings", "*", (query) =>
          query.or(buildRelatedIdFilters(relatedCustomerId)).order("created_at", {
            ascending: false,
          }),
        ),
        safeSelect("pets", "*", (query) =>
          query.or(buildPetIdFilters(relatedCustomerId)).order("created_at", {
            ascending: false,
          }),
        ),
        safeSelect("messages", "*", (query) =>
          query.or(buildMessageSenderFilters(relatedCustomerId)).order("created_at", {
            ascending: false,
          }),
        ),
        safeSelect("messages", "*", (query) =>
          query.or(buildMessageRecipientFilters(relatedCustomerId)).order("created_at", {
            ascending: false,
          }),
        ),
      ])
    : [[], [], [], []];

  const messages = [...sentMessages, ...receivedMessages].sort((a, b) => {
    const aTime = new Date(getText(a, ["created_at"])).getTime() || 0;
    const bTime = new Date(getText(b, ["created_at"])).getTime() || 0;

    return bTime - aTime;
  });

  const name = getDisplayName(profile, authUser);
  const email = getEmail(profile, authUser);
  const phone = getPhone(profile, authUser);
  const location = getLocation(profile);
  const serviceAddress = getServiceAddress(profile);
  const carePreferences = getCarePreferences(profile);
  const avatarUrl = getAvatarUrl(profile, authUser);
  const profileCompletion = getProfileCompleteness({
    profile,
    petsCount: pets.length,
  });
  const trustChecks = getTrustReadiness({
    profile,
    authUser,
    petsCount: pets.length,
    bookingsCount: bookings.length,
    messagesCount: messages.length,
  });

  const totalSpend = bookings.reduce(
    (sum, booking) => sum + getBookingAmount(booking),
    0,
  );
  const completedBookings = bookings.filter((booking) =>
    ["completed", "complete", "finished", "closed"].includes(
      getBookingStatus(booking).toLowerCase(),
    ),
  ).length;
  const latestBooking = bookings[0] ?? null;

  const certifiedPetParent = false;

  if (!profile && !authUser) {
    return (
      <main className="min-h-screen bg-[#f7fbf7] px-4 py-6 text-[#062f2b] sm:px-6 lg:px-8">
        <section className="mx-auto max-w-6xl rounded-[2rem] border border-red-100 bg-white p-6 shadow-sm">
          <Link
            href="/admin/customers"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-emerald-800 hover:text-emerald-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Pet Parents
          </Link>

          <div className="mt-6 rounded-3xl border border-red-100 bg-red-50 p-5">
            <h1 className="text-3xl font-black">Public profile preview unavailable</h1>
            <p className="mt-2 text-sm font-semibold text-red-800">
              No matching Supabase Auth user or profile row was found for this ID or email.
            </p>
            <p className="mt-3 break-all text-xs font-black text-red-900">
              Lookup: {lookupKey || "Missing route value"}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7fbf7] px-4 py-6 text-[#062f2b] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/admin/customers/${encodeURIComponent(relatedCustomerId || lookupKey)}`}
              className="inline-flex items-center gap-2 text-sm font-extrabold text-emerald-800 hover:text-emerald-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin Profile
            </Link>

            <Link
              href="/admin/customers"
              className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-600 hover:text-slate-950"
            >
              Back to Pet Parents
            </Link>
          </div>

          <div className="mt-5 rounded-[2rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              Super Admin Preview
            </p>
            <p className="mt-1 text-sm font-semibold leading-6 text-emerald-950">
              This is a read-only preview of what a Guru or internal reviewer
              should understand about this Pet Parent. It does not impersonate
              the user and does not change their account.
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 bg-[radial-gradient(circle_at_78%_20%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#00d69f_0%,#66e3c7_48%,#b8e5ff_100%)] px-6 py-8 md:px-10 md:py-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-900/80 md:text-sm">
                SitGuru Pet Parent Public Profile Preview
              </p>

              <h1 className="mt-4 max-w-4xl text-4xl font-extrabold tracking-[-0.045em] text-slate-950 md:text-6xl">
                {name}
              </h1>

              <p className="mt-4 flex flex-wrap items-center gap-2 text-base font-black text-slate-900/80">
                <MapPin className="h-5 w-5" />
                {location}
              </p>

              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-900/75 md:text-lg">
                This Pet Parent profile helps Gurus understand booking readiness,
                pet profile quality, care preferences, communication history, and
                SitGuru trust signals before accepting or supporting care.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <TrustBadge
                  icon={<PawPrint className="h-4 w-4" />}
                  label="Pet Parent"
                  tone="emerald"
                />

                <TrustBadge
                  icon={<Star className="h-4 w-4" />}
                  label={`${profileCompletion}% profile ready`}
                  tone="white"
                />

                {certifiedPetParent ? (
                  <TrustBadge
                    icon={<ShieldCheck className="h-4 w-4" />}
                    label="Certified Pet Parent"
                    tone="emerald"
                  />
                ) : (
                  <TrustBadge
                    icon={<ShieldCheck className="h-4 w-4" />}
                    label="Certified Pet Parent: Not completed"
                    tone="white"
                  />
                )}

                {latestBooking ? (
                  <TrustBadge
                    icon={<CalendarDays className="h-4 w-4" />}
                    label={`Last booking: ${formatDate(getBookingDate(latestBooking))}`}
                    tone="white"
                  />
                ) : null}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/admin/customers/${encodeURIComponent(relatedCustomerId || lookupKey)}`}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-700 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
                >
                  Open Admin Record
                </Link>

                <Link
                  href={`/admin/customers/${encodeURIComponent(relatedCustomerId || lookupKey)}/dashboard-preview`}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:bg-emerald-50"
                >
                  View Dashboard Preview
                </Link>
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

              <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-950">
                {name}
              </h2>
              <p className="mt-2 text-lg font-semibold text-slate-700">
                SitGuru Pet Parent
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                {pets.length > 0
                  ? `${pets.length} pet profile${pets.length === 1 ? "" : "s"} ready for review`
                  : "No pet profiles added yet"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 bg-white px-6 py-6 md:grid-cols-2 lg:grid-cols-4 md:px-8">
            <PublicStatCard
              icon={<PawPrint className="h-5 w-5" />}
              label="Pets"
              value={String(pets.length)}
              detail="Pet profiles connected"
            />
            <PublicStatCard
              icon={<CalendarDays className="h-5 w-5" />}
              label="Bookings"
              value={String(bookings.length)}
              detail={`${completedBookings} completed`}
            />
            <PublicStatCard
              icon={<MessageSquare className="h-5 w-5" />}
              label="Messages"
              value={String(messages.length)}
              detail="Communication activity"
            />
            <PublicStatCard
              icon={<HeartHandshake className="h-5 w-5" />}
              label="Spend"
              value={formatMoney(totalSpend)}
              detail="Lifetime customer spend"
            />
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <PreviewCard>
              <SectionHeader
                eyebrow="Public Contact Snapshot"
                title="Pet Parent details"
                description="Information a Guru or internal reviewer may use to understand the Pet Parent before care."
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

            <PreviewCard>
              <SectionHeader
                eyebrow="Care Location"
                title="Service address and preferences"
                description="Use this as a readiness preview only. Public display can be limited later for privacy."
              />

              <div className="mt-5 space-y-3">
                <InfoBox
                  label="Service address"
                  value={serviceAddress || "Service address not added yet"}
                />
                <InfoBox
                  label="Care preferences"
                  value={carePreferences || "Care preferences not added yet"}
                />
              </div>
            </PreviewCard>
          </div>

          <div className="space-y-5">
            <PreviewCard>
              <SectionHeader
                eyebrow="Trust Readiness"
                title="Profile quality and safety signals"
                description="These checks help decide whether the Pet Parent is ready for smooth bookings with Gurus."
              />

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-700"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {trustChecks.map((check) => (
                  <div
                    key={check.label}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-black text-slate-900">
                        {check.label}
                      </p>
                      {check.complete ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" />
                      ) : (
                        <Sparkles className="h-5 w-5 shrink-0 text-amber-600" />
                      )}
                    </div>
                    <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                      {check.detail}
                    </p>
                  </div>
                ))}
              </div>
            </PreviewCard>

            <PreviewCard>
              <SectionHeader
                eyebrow="SitGuru University"
                title="Certified Pet Parent badge"
                description="This will auto-populate once Pet Parent Academy completion and user badges are wired."
              />

              <div className="mt-5 rounded-[1.6rem] border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-700 ring-1 ring-amber-100">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-base font-black text-amber-950">
                      Certified Pet Parent: Not completed
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-amber-900">
                      After the 9-step Pet Parent Academy is completed, this
                      area should show the Certified Pet Parent badge,
                      certificate ID, and completion date.
                    </p>
                  </div>
                </div>
              </div>
            </PreviewCard>
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
          <SectionHeader
            eyebrow="Pet Profiles"
            title="Pets connected to this Pet Parent"
            description="These are the pet profiles Gurus should be able to review before care."
          />

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pets.length ? (
              pets.map((pet) => (
                <article
                  key={String(pet.id)}
                  className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50"
                >
                  <div className="flex h-44 items-center justify-center overflow-hidden bg-emerald-50">
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

                  <div className="p-5">
                    <h3 className="text-xl font-black text-slate-950">
                      {getPetName(pet)}
                    </h3>
                    <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
                      {getPetDescription(pet)}
                    </p>

                    {getPetNotes(pet) ? (
                      <p className="mt-3 line-clamp-4 rounded-2xl bg-white p-3 text-sm font-semibold leading-6 text-slate-600">
                        {getPetNotes(pet)}
                      </p>
                    ) : (
                      <p className="mt-3 rounded-2xl bg-white p-3 text-sm font-semibold leading-6 text-slate-500">
                        No care notes added yet.
                      </p>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm font-bold leading-6 text-slate-600 md:col-span-2 xl:col-span-3">
                No pet profiles found for this Pet Parent yet.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
          <SectionHeader
            eyebrow="Booking Activity"
            title="Recent booking signals"
            description="Read-only summary of booking history connected to this Pet Parent."
          />

          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-100">
            {bookings.length === 0 ? (
              <div className="bg-slate-50 p-5 text-sm font-bold text-slate-600">
                No bookings found for this Pet Parent.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Pet</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {bookings.slice(0, 12).map((booking) => (
                      <tr key={String(booking.id)}>
                        <td className="px-4 py-3 font-bold">
                          {formatDate(getBookingDate(booking))}
                        </td>
                        <td className="px-4 py-3 font-bold">
                          {getBookingStatus(booking)}
                        </td>
                        <td className="px-4 py-3 font-bold">
                          {getText(booking, ["pet_name", "animal_name"], "—")}
                        </td>
                        <td className="px-4 py-3 text-right font-black">
                          {formatMoney(getBookingAmount(booking))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
          <SectionHeader
            eyebrow="Record Source"
            title="Admin-only technical details"
            description="Visible to Super Admin only. This confirms which account record this preview is using."
          />

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MiniBox label="Lookup Value" value={lookupKey} />
            <MiniBox label="Resolved ID" value={relatedCustomerId || "—"} />
            <MiniBox label="Auth User" value={authUser ? "Found" : "Missing"} />
            <MiniBox label="Profile Row" value={profile ? "Found" : "Missing"} />
            <MiniBox label="Auth Provider" value={getAuthProvider(authUser)} />
            <MiniBox label="Auth Created" value={formatDateTime(authUser?.created_at)} />
            <MiniBox label="Profile Created" value={formatDateTime(profile?.created_at)} />
            <MiniBox label="Profile Updated" value={formatDateTime(profile?.updated_at)} />
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

function PublicStatCard({
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

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm font-black leading-6 text-slate-900">
        {value || "—"}
      </p>
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