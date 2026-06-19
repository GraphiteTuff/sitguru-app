import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  PawPrint,
  ShieldCheck,
} from "lucide-react";

import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type AnyRow = Record<string, unknown>;

type PetParentRegistrationHealthRow = {
  profile_id: string;
  full_name?: string | null;
  profile_email?: string | null;
  profile_phone?: string | null;
  auth_email?: string | null;
  auth_phone?: string | null;
  role?: string | null;
  admin_status?: string | null;
  admin_notes?: string | null;
  registration_health_status?: string | null;
  profile_created_at?: string | null;
  auth_created_at?: string | null;
  auth_last_sign_in_at?: string | null;
};


function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}


function normalizeRegistrationHealthStatus(value: unknown) {
  return asString(value).toLowerCase().replace(/[\s-]+/g, "_");
}

function getRegistrationHealthLabel(value: unknown) {
  const status = normalizeRegistrationHealthStatus(value);

  if (status === "active_pet_parent") return "Active Pet Parent";
  if (status === "phone_only_incomplete_signup") return "Phone-only Incomplete Signup";
  if (status === "registered_pet_parent_needs_profile") return "Needs Profile Completion";
  if (status === "incomplete_signup") return "Incomplete Signup";
  if (status === "signup_log_without_auth") return "Signup Log / Missing Auth";
  if (status === "likely_test_or_spam") return "Likely Test / Spam";
  if (status === "archived") return "Archived";

  return "Not checked";
}

function getRegistrationHealthDescription(value: unknown) {
  const status = normalizeRegistrationHealthStatus(value);

  if (status === "active_pet_parent") {
    return "This profile is safe to preview as a normal Pet Parent public profile.";
  }

  if (status === "phone_only_incomplete_signup") {
    return "This is a phone-only signup with no completed Pet Parent profile yet. Keep it out of active/public Pet Parent views.";
  }

  if (status === "registered_pet_parent_needs_profile") {
    return "This Pet Parent has started registration but still needs profile completion before the public profile should look complete.";
  }

  if (status === "incomplete_signup") {
    return "This Pet Parent signup is incomplete and should not be treated as a finished public profile.";
  }

  if (status === "signup_log_without_auth") {
    return "A signup log exists, but no matching Supabase auth user was found.";
  }

  if (status === "likely_test_or_spam") {
    return "This record is likely test/spam and should not be surfaced as a normal Pet Parent.";
  }

  if (status === "archived") {
    return "This record is archived and should not be treated as an active Pet Parent.";
  }

  return "No registration health status was found for this record.";
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

function formatMonthYear(value: unknown) {
  const text = asString(value);
  if (!text) return "";

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
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

function getPublicFirstName(name: string) {
  const cleanName = name.replace(/@.*/, "").trim();

  if (!cleanName || cleanName === "Pet Parent") return "this Pet Parent";

  return cleanName.split(/\s+/)[0] || cleanName;
}

function getPossessiveName(firstName: string) {
  if (!firstName || firstName === "this Pet Parent") {
    return "this Pet Parent's";
  }

  return firstName.toLowerCase().endsWith("s")
    ? `${firstName}'`
    : `${firstName}'s`;
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

function getLocation(row: AnyRow | null | undefined) {
  const city = getText(row, ["city", "customer_city", "location_city"]);
  const state = getText(row, ["state", "state_code", "customer_state"]);

  return [city, state].filter(Boolean).join(", ");
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

function getPetParentBio(row: AnyRow | null | undefined) {
  return getText(
    row,
    [
      "bio",
      "about",
      "about_me",
      "profile_bio",
      "public_bio",
      "pet_parent_bio",
      "household_intro",
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
  return [
    getText(row, ["type", "species", "pet_type"]),
    getText(row, ["breed"]),
    getText(row, ["age"]),
  ]
    .filter(Boolean)
    .join(" • ");
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

function getCertifiedPetParent(
  profile: AnyRow | null | undefined,
  authUser: AnyRow | null | undefined,
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

function buildPetIdFilters(customerId: string) {
  return [
    `owner_profile_id.eq.${customerId}`,
    `owner_id.eq.${customerId}`,
    `customer_id.eq.${customerId}`,
    `pet_parent_id.eq.${customerId}`,
    `user_id.eq.${customerId}`,
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


async function getRegistrationHealthByLookupKey(
  lookupKey: string,
): Promise<PetParentRegistrationHealthRow | null> {
  try {
    if (isUuid(lookupKey)) {
      const { data, error } = await supabaseAdmin
        .from("admin_pet_parent_registration_health")
        .select("*")
        .eq("profile_id", lookupKey)
        .maybeSingle();

      if (error) return null;
      return (data ?? null) as PetParentRegistrationHealthRow | null;
    }

    if (lookupKey.includes("@")) {
      const cleanEmail = lookupKey.trim().toLowerCase();
      const { data, error } = await supabaseAdmin
        .from("admin_pet_parent_registration_health")
        .select("*")
        .or(`profile_email.eq.${cleanEmail},auth_email.eq.${cleanEmail}`)
        .maybeSingle();

      if (error) return null;
      return (data ?? null) as PetParentRegistrationHealthRow | null;
    }

    return null;
  } catch {
    return null;
  }
}


export default async function AdminCustomerPublicProfilePreviewPage({
  params,
}: PageProps) {
  const resolvedParams = await params;
  const lookupKey = decodeURIComponent(resolvedParams.id || "").trim();

  const [profile, authUserByLookup, registrationHealthByLookup] = await Promise.all([
    getProfileByLookupKey(lookupKey),
    getAuthUserByLookupKey(lookupKey),
    getRegistrationHealthByLookupKey(lookupKey),
  ]);

  const authUser =
    authUserByLookup ||
    (profile?.id ? await getAuthUserById(String(profile.id)) : null);

  const registrationHealth =
    registrationHealthByLookup ||
    (profile?.id ? await getRegistrationHealthByLookupKey(String(profile.id)) : null);
  const registrationHealthStatus = normalizeRegistrationHealthStatus(
    registrationHealth?.registration_health_status,
  );
  const publicProfileReady = registrationHealthStatus === "active_pet_parent";

  const relatedCustomerId = getRelatedRecordId({
    lookupKey,
    profile,
    authUser,
  });

  const canLoadRelatedRows = Boolean(
    relatedCustomerId && isUuid(relatedCustomerId),
  );

  const pets = canLoadRelatedRows
    ? await safeSelect("pets", "*", (query) =>
        query.or(buildPetIdFilters(relatedCustomerId)).order("created_at", {
          ascending: false,
        }),
      )
    : [];

  const name = getDisplayName(profile, authUser);
  const firstName = getPublicFirstName(name);
  const location = getLocation(profile);
  const carePreferences = getCarePreferences(profile);
  const petParentBio = getPetParentBio(profile);
  const avatarUrl = getAvatarUrl(profile, authUser);
  const certifiedPetParent = getCertifiedPetParent(profile, authUser);
  const possessiveFirstName = getPossessiveName(firstName);
  const memberSince =
    formatMonthYear(profile?.created_at) ||
    formatMonthYear(authUser?.created_at);
  const publicBio = publicProfileReady
    ? petParentBio ||
      `${firstName} is part of the SitGuru pet care community and uses SitGuru to connect with trusted local pet care providers.`
    : "This Pet Parent profile is not public-ready yet. It is visible here only for Super Admin review.";

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
            <h1 className="text-3xl font-black">
              Public profile preview unavailable
            </h1>
            <p className="mt-2 text-sm font-semibold text-red-800">
              No matching Supabase Auth user or profile row was found for this
              ID or email.
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
      <section className="mx-auto max-w-6xl space-y-5">
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
              Pet Parent Public Profile Preview
            </p>
            <p className="mt-1 text-sm font-semibold leading-6 text-emerald-950">
              This preview shows the Pet Parent public profile without exposing
              email, phone, full address, internal metrics, or completion
              status.
            </p>
          </div>
        </div>

        {!publicProfileReady ? (
          <div className="rounded-[2rem] border border-orange-200 bg-orange-50 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-700">
              Admin-only public profile safety check
            </p>
            <h2 className="mt-1 text-2xl font-black text-orange-950">
              {getRegistrationHealthLabel(registrationHealthStatus)}
            </h2>
            <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-orange-900">
              {getRegistrationHealthDescription(registrationHealthStatus)}
            </p>
          </div>
        ) : null}

        <section className="overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 bg-[radial-gradient(circle_at_78%_20%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#d8fff2_0%,#bff7ea_48%,#eaf7ff_100%)] px-6 py-8 md:px-10 md:py-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-white/40 blur-xl" />
                <div className="relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-[8px] border-white bg-gradient-to-br from-emerald-50 to-white text-5xl font-extrabold text-emerald-700 shadow-2xl md:h-52 md:w-52">
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
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-900/70 md:text-sm">
                SitGuru Pet Parent
              </p>

              <h1 className="mt-4 max-w-4xl text-4xl font-extrabold tracking-[-0.045em] text-slate-950 md:text-6xl">
                {publicProfileReady ? `Meet ${firstName}` : "Profile not public-ready yet"}
              </h1>

              {location ? (
                <p className="mt-4 flex flex-wrap items-center gap-2 text-base font-black text-slate-900/80">
                  <MapPin className="h-5 w-5" />
                  {location}
                </p>
              ) : null}

              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-900/75 md:text-lg">
                {publicProfileReady
                  ? `${firstName} is a SitGuru Pet Parent connected to the SitGuru pet care community.`
                  : "This signup should stay in admin review until registration, contact, and profile details are complete."}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <ProfilePill icon={<PawPrint className="h-4 w-4" />}>
                  Pet Parent
                </ProfilePill>

                {memberSince ? (
                  <ProfilePill icon={<CalendarDays className="h-4 w-4" />}>
                    Joined SitGuru {memberSince}
                  </ProfilePill>
                ) : null}

                {certifiedPetParent ? (
                  <ProfilePill icon={<ShieldCheck className="h-4 w-4" />}>
                    Certified Pet Parent
                  </ProfilePill>
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
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeader
            eyebrow="Pet Family"
            title={`About ${possessiveFirstName} Pet Family`}
          />

          <div className="mt-5 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
            <p className="whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-700 md:text-base">
              {publicBio}
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FriendlyFactCard
              icon={<PawPrint className="h-5 w-5" />}
              label="Pet Parent"
              value="SitGuru community member"
            />

            {location ? (
              <FriendlyFactCard
                icon={<MapPin className="h-5 w-5" />}
                label="General Area"
                value={location}
              />
            ) : null}

            {memberSince ? (
              <FriendlyFactCard
                icon={<CalendarDays className="h-5 w-5" />}
                label="Member Since"
                value={memberSince}
              />
            ) : null}
          </div>
        </section>

        {pets.length > 0 ? (
          <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader
              eyebrow="Pets"
              title={`${possessiveFirstName} Pets`}
            />

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pets.map((pet) => {
                const petDescription = getPetDescription(pet);
                const petNotes = getPetNotes(pet);
                const petPhoto = getPetPhoto(pet);

                return (
                  <article
                    key={String(pet.id || getPetName(pet))}
                    className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50"
                  >
                    <div className="flex h-44 items-center justify-center overflow-hidden bg-emerald-50">
                      {petPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={petPhoto}
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

                      {petDescription ? (
                        <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
                          {petDescription}
                        </p>
                      ) : null}

                      {petNotes ? (
                        <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-white p-3 text-sm font-semibold leading-6 text-slate-600">
                          {petNotes}
                        </p>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {carePreferences ? (
          <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader
              eyebrow="Care Notes"
              title={`Care Notes for ${possessiveFirstName} Pets`}
            />

            <div className="mt-5 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
              <p className="whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-700">
                {carePreferences}
              </p>
            </div>
          </section>
        ) : null}

        {certifiedPetParent ? (
          <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader
              eyebrow="SitGuru University"
              title={`${possessiveFirstName} SitGuru Achievements`}
            />

            <div className="mt-5 rounded-[1.6rem] border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 ring-1 ring-emerald-100">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base font-black text-emerald-950">
                    Certified Pet Parent
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-emerald-900">
                    {firstName} completed the Pet Parent Academy through SitGuru
                    University.
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <details>
            <summary className="cursor-pointer text-sm font-black text-slate-700">
              Super Admin record details
            </summary>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MiniBox label="Lookup Value" value={lookupKey} />
              <MiniBox label="Resolved ID" value={relatedCustomerId || "—"} />
              <MiniBox
                label="Auth User"
                value={authUser ? "Found" : "Missing"}
              />
              <MiniBox
                label="Profile Row"
                value={profile ? "Found" : "Missing"}
              />
              <MiniBox
                label="Registration Health"
                value={getRegistrationHealthLabel(registrationHealthStatus)}
              />
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
          </details>
        </section>
      </section>
    </main>
  );
}

function ProfilePill({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-xs font-extrabold text-slate-800 shadow-sm ring-1 ring-white/70">
      {icon}
      {children}
    </span>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {title}
      </h2>
    </div>
  );
}

function FriendlyFactCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/60 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100">
          {icon}
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
            {label}
          </p>
          <p className="mt-1 text-sm font-black leading-6 text-slate-900">
            {value}
          </p>
        </div>
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
