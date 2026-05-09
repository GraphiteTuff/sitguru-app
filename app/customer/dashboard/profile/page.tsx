"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CircleAlert,
  Gift,
  Heart,
  Loader2,
  MapPin,
  Megaphone,
  Search,
  ShieldCheck,
  Star,
  User,
  UserPlus,
} from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

type CustomerProfile = {
  id: string;
  first_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  service_address: string | null;
  service_city: string | null;
  service_state: string | null;
  service_zip: string | null;
  emergency_contact: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  care_preferences: string | null;
  email_notifications: boolean;
  push_notifications: boolean;
  text_notifications: boolean;
  avatar_url: string | null;
};

type RawProfileRow = Record<string, unknown>;

type SupabaseUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

type SetupStepStatus = "complete" | "required" | "recommended";

type PetParentSetupStep = {
  number: number;
  title: string;
  body: string;
  status: SetupStepStatus;
  statusLabel: string;
  actionLabel: string;
  actionHref: string;
  icon: string;
  feeds: string;
};

const routes = {
  dashboard: "/customer/dashboard",
  basicInfo: "/customer/dashboard/profile/basic-info",
  serviceLocation: "/customer/dashboard/profile/service-location",
  pets: "/customer/pets",
  careNotes: "/customer/dashboard/profile/care-notes",
  emergencyContact: "/customer/dashboard/profile/emergency-contact",
  notifications: "/customer/dashboard/profile/notifications",
  search: "/search",
  pawPerks: "/customer/dashboard/pawperks",
  referrals: "/referrals",
  guruApplication: "/guru/application",
  bookings: "/customer/dashboard/bookings",
  login: "/login",
};

const fallbackAvatar = "/images/customer-profile-photo.jpg";

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function normalizePhotoUrl(value: string | null) {
  if (!value) return null;

  const cleanValue = value.trim();

  if (!cleanValue) return null;
  if (cleanValue.startsWith("http://")) return cleanValue;
  if (cleanValue.startsWith("https://")) return cleanValue;
  if (cleanValue.startsWith("/")) return cleanValue;
  if (cleanValue.startsWith("data:image")) return cleanValue;

  return `/${cleanValue}`;
}

function readFirstString(row: RawProfileRow | null, keys: string[]) {
  for (const key of keys) {
    const value = readString(row?.[key]);

    if (value) return value;
  }

  return null;
}

function readMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  keys: string[],
) {
  for (const key of keys) {
    const value = readString(metadata?.[key]);

    if (value) return value;
  }

  return null;
}

function formatAddressLine(profile: CustomerProfile | null) {
  const street = profile?.service_address?.trim();
  const city = profile?.service_city?.trim();
  const state = profile?.service_state?.trim();
  const zip = profile?.service_zip?.trim();

  const cityState = [city, state].filter(Boolean).join(", ");
  const cityStateZip = [cityState, zip].filter(Boolean).join(" ");

  if (street && cityStateZip) return `${street}, ${cityStateZip}`;

  return street || cityStateZip || "Not added yet";
}

function buildCustomerProfile(
  row: RawProfileRow | null,
  user: SupabaseUserLike,
): CustomerProfile {
  const metadata = user.user_metadata ?? null;

  const fullName =
    readFirstString(row, ["full_name", "name", "display_name"]) ||
    readMetadataString(metadata, ["full_name", "name", "display_name"]) ||
    null;

  const firstName =
    readFirstString(row, ["first_name", "given_name"]) ||
    readMetadataString(metadata, ["first_name", "given_name"]) ||
    fullName?.split(" ")[0] ||
    null;

  const avatarUrl =
    normalizePhotoUrl(
      readFirstString(row, [
        "avatar_url",
        "profile_photo_url",
        "photo_url",
        "image_url",
        "picture",
      ]),
    ) ||
    normalizePhotoUrl(
      readMetadataString(metadata, [
        "avatar_url",
        "profile_photo_url",
        "photo_url",
        "image_url",
        "picture",
        "avatar",
      ]),
    );

  return {
    id: user.id,
    first_name: firstName,
    full_name: fullName,
    email: user.email ?? readString(row?.email) ?? null,
    phone:
      readFirstString(row, ["phone", "phone_number", "mobile_phone"]) ||
      readMetadataString(metadata, ["phone", "phone_number", "mobile_phone"]) ||
      null,
    service_address:
      readFirstString(row, [
        "service_address",
        "address",
        "home_address",
        "street_address",
      ]) ||
      readMetadataString(metadata, [
        "service_address",
        "address",
        "home_address",
        "street_address",
      ]) ||
      null,
    service_city:
      readFirstString(row, ["service_city", "city", "home_city"]) ||
      readMetadataString(metadata, ["service_city", "city", "home_city"]) ||
      null,
    service_state:
      readFirstString(row, ["service_state", "state", "home_state"]) ||
      readMetadataString(metadata, ["service_state", "state", "home_state"]) ||
      null,
    service_zip:
      readFirstString(row, [
        "service_zip",
        "zip",
        "zip_code",
        "zipcode",
        "postal_code",
      ]) ||
      readMetadataString(metadata, [
        "service_zip",
        "zip",
        "zip_code",
        "zipcode",
        "postal_code",
      ]) ||
      null,
    emergency_contact:
      readFirstString(row, ["emergency_contact"]) ||
      readMetadataString(metadata, ["emergency_contact"]) ||
      null,
    emergency_contact_name:
      readFirstString(row, ["emergency_contact_name"]) ||
      readMetadataString(metadata, ["emergency_contact_name"]) ||
      null,
    emergency_contact_phone:
      readFirstString(row, ["emergency_contact_phone"]) ||
      readMetadataString(metadata, ["emergency_contact_phone"]) ||
      null,
    care_preferences:
      readFirstString(row, [
        "care_preferences",
        "care_notes",
        "preferences",
        "notes",
        "home_notes",
        "routine_notes",
      ]) ||
      readMetadataString(metadata, [
        "care_preferences",
        "care_notes",
        "preferences",
        "notes",
        "home_notes",
        "routine_notes",
      ]) ||
      null,
    email_notifications: readBoolean(row?.email_notifications),
    push_notifications: readBoolean(row?.push_notifications),
    text_notifications: readBoolean(row?.text_notifications),
    avatar_url: avatarUrl,
  };
}

async function fetchCustomerProfile(user: SupabaseUserLike) {
  const attempts = [
    { table: "profiles", column: "id", value: user.id },
    { table: "profiles", column: "user_id", value: user.id },
    { table: "customer_profiles", column: "user_id", value: user.id },
    { table: "customer_profiles", column: "id", value: user.id },
    { table: "customers", column: "user_id", value: user.id },
    { table: "customers", column: "id", value: user.id },
  ];

  for (const attempt of attempts) {
    const { data, error } = await supabase
      .from(attempt.table)
      .select("*")
      .eq(attempt.column, attempt.value)
      .maybeSingle();

    if (!error && data) {
      return buildCustomerProfile(data as RawProfileRow, user);
    }
  }

  return buildCustomerProfile(null, user);
}

async function fetchPetCount(userId: string) {
  const attempts = ["owner_id", "user_id", "customer_id", "pet_parent_id"];

  for (const column of attempts) {
    const { count, error } = await supabase
      .from("pets")
      .select("id", { count: "exact", head: true })
      .eq(column, userId);

    if (!error) return count ?? 0;
  }

  return 0;
}

async function fetchBookingStats(userId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select("id,status")
    .or(`customer_id.eq.${userId},pet_owner_id.eq.${userId},user_id.eq.${userId}`)
    .limit(100);

  if (error) {
    return {
      total: 0,
      completed: 0,
    };
  }

  const bookings = data || [];

  return {
    total: bookings.length,
    completed: bookings.filter((booking) =>
      ["completed", "complete", "finished"].includes(
        String(booking.status || "").toLowerCase(),
      ),
    ).length,
  };
}

function getCustomerDisplayName(profile: CustomerProfile | null) {
  return (
    profile?.full_name?.trim() ||
    profile?.first_name?.trim() ||
    profile?.email?.split("@")[0] ||
    "Pet Parent"
  );
}

function getCustomerInitials(profile: CustomerProfile | null) {
  const name = getCustomerDisplayName(profile);
  const parts = name
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);

  const firstInitial = parts[0]?.charAt(0) || "P";
  const secondInitial = parts[1]?.charAt(0) || "P";

  return `${firstInitial}${secondInitial}`.toUpperCase();
}

function getStatusClassName(status: SetupStepStatus) {
  if (status === "complete") {
    return "border-emerald-300 bg-emerald-50 text-emerald-800";
  }

  if (status === "required") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}

function getCompletionStatus(complete: boolean, required = true) {
  if (complete) {
    return {
      status: "complete" as const,
      label: "Complete",
    };
  }

  return {
    status: required ? ("required" as const) : ("recommended" as const),
    label: required ? "Required" : "Recommended",
  };
}

function SetupCard({ step }: { step: PetParentSetupStep }) {
  const isComplete = step.status === "complete";

  return (
    <Link
      href={step.actionHref}
      className={`group flex min-h-[315px] flex-col rounded-[1.75rem] border p-5 transition hover:-translate-y-1 hover:shadow-xl ${getStatusClassName(
        step.status,
      )}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl shadow-sm ring-1 ring-white/80">
          {isComplete ? "✓" : step.number}
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
            isComplete
              ? "border-emerald-200 bg-emerald-100 text-emerald-800"
              : step.status === "required"
                ? "border-red-200 bg-red-100 text-red-700"
                : "border-amber-200 bg-amber-100 text-amber-800"
          }`}
        >
          {step.statusLabel}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
          Step {step.number}
        </p>

        <h3 className="mt-2 text-2xl font-black leading-tight text-slate-950">
          <span className="mr-2" aria-hidden="true">
            {step.icon}
          </span>
          {step.title}
        </h3>

        <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
          {step.body}
        </p>
      </div>

      <div className="mt-5 rounded-2xl bg-white/75 p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
          Feeds SitGuru
        </p>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
          {step.feeds}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-white/80 pt-5">
        <span className="text-sm font-black text-emerald-700">
          {step.actionLabel}
        </span>
        <ArrowRight className="h-4 w-4 text-emerald-700 transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function OptionalActionCard({
  icon,
  eyebrow,
  title,
  body,
  href,
  action,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  action: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
        {icon}
      </div>

      <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
        {eyebrow}
      </p>

      <h3 className="mt-2 text-2xl font-black leading-tight text-slate-950">
        {title}
      </h3>

      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        {body}
      </p>

      <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition group-hover:bg-emerald-700">
        {action}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export default function CustomerProfileSetupPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [petCount, setPetCount] = useState(0);
  const [bookingStats, setBookingStats] = useState({
    total: 0,
    completed: 0,
  });
  const [errorMessage, setErrorMessage] = useState("");

  const loadPage = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace(routes.login);
      return;
    }

    try {
      const [profileData, petsTotal, bookingsTotal] = await Promise.all([
        fetchCustomerProfile(user),
        fetchPetCount(user.id),
        fetchBookingStats(user.id),
      ]);

      setProfile(profileData);
      setPetCount(petsTotal);
      setBookingStats(bookingsTotal);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not load your Pet Parent setup profile.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadPage();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace(routes.login);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadPage, router]);

  const setupBooleans = useMemo(() => {
    const basicInfoComplete = Boolean(
      (profile?.full_name || profile?.first_name) &&
        profile?.email &&
        profile?.phone,
    );

    const serviceLocationComplete = Boolean(
      profile?.service_address &&
        profile?.service_city &&
        profile?.service_state &&
        profile?.service_zip,
    );

    const petPassportsComplete = petCount > 0;
    const careNotesComplete = Boolean(profile?.care_preferences);
    const emergencyContactComplete = Boolean(
      profile?.emergency_contact ||
        (profile?.emergency_contact_name && profile?.emergency_contact_phone),
    );
    const notificationsComplete = Boolean(
      profile?.email_notifications ||
        profile?.push_notifications ||
        profile?.text_notifications,
    );

    return {
      basicInfoComplete,
      serviceLocationComplete,
      petPassportsComplete,
      careNotesComplete,
      emergencyContactComplete,
      notificationsComplete,
    };
  }, [profile, petCount]);

  const setupSteps = useMemo<PetParentSetupStep[]>(() => {
    const basic = getCompletionStatus(setupBooleans.basicInfoComplete);
    const location = getCompletionStatus(setupBooleans.serviceLocationComplete);
    const pets = getCompletionStatus(setupBooleans.petPassportsComplete);
    const careNotes = getCompletionStatus(setupBooleans.careNotesComplete);
    const emergency = getCompletionStatus(
      setupBooleans.emergencyContactComplete,
    );
    const notifications = getCompletionStatus(
      setupBooleans.notificationsComplete,
    );

    return [
      {
        number: 1,
        title: "Basic Info",
        body: "Add your name, login email, phone number, and profile photo so SitGuru and your Guru can contact you about care.",
        status: basic.status,
        statusLabel: basic.label,
        actionLabel: setupBooleans.basicInfoComplete
          ? "Review Basic Info"
          : "Complete Basic Info",
        actionHref: routes.basicInfo,
        icon: "👤",
        feeds:
          "Bookings, messages, admin dashboard, profile hero, support, and Guru booking context.",
      },
      {
        number: 2,
        title: "Service Location",
        body: "Add your street address, city, state, and ZIP so SitGuru can match you with Gurus who serve your area.",
        status: location.status,
        statusLabel: location.label,
        actionLabel: setupBooleans.serviceLocationComplete
          ? "Review Location"
          : "Add Service Location",
        actionHref: routes.serviceLocation,
        icon: "📍",
        feeds:
          "Find Care, Guru radius filtering, maps, search results, booking location, and local matching.",
      },
      {
        number: 3,
        title: "Pet Passports",
        body: "Create at least one Pet Passport so Gurus understand who they are caring for before a booking starts.",
        status: pets.status,
        statusLabel: pets.label,
        actionLabel: setupBooleans.petPassportsComplete
          ? "Manage Pet Passports"
          : "Create Pet Passport",
        actionHref: routes.pets,
        icon: "🐶",
        feeds:
          "Booking requests, Guru preparation, care details, messages, and Pet Parent dashboard.",
      },
      {
        number: 4,
        title: "Care Notes",
        body: "Share routines, feeding notes, medication details, anxiety triggers, access notes, and anything your Guru should know.",
        status: careNotes.status,
        statusLabel: careNotes.label,
        actionLabel: setupBooleans.careNotesComplete
          ? "Review Care Notes"
          : "Add Care Notes",
        actionHref: routes.careNotes,
        icon: "📝",
        feeds:
          "Booking details, Guru booking view, care instructions, messages, and admin support context.",
      },
      {
        number: 5,
        title: "Emergency Contact",
        body: "Add a backup contact so SitGuru and your Guru have another way to help if something urgent comes up.",
        status: emergency.status,
        statusLabel: emergency.label,
        actionLabel: setupBooleans.emergencyContactComplete
          ? "Review Emergency Contact"
          : "Add Emergency Contact",
        actionHref: routes.emergencyContact,
        icon: "🛟",
        feeds:
          "Safety workflows, booking support, emergency context, admin support, and Guru confidence.",
      },
      {
        number: 6,
        title: "Notifications",
        body: "Choose email, text, or push updates so you do not miss booking messages, reminders, or care updates.",
        status: notifications.status,
        statusLabel: notifications.label,
        actionLabel: setupBooleans.notificationsComplete
          ? "Review Notifications"
          : "Set Notifications",
        actionHref: routes.notifications,
        icon: "🔔",
        feeds:
          "Booking reminders, care updates, support alerts, message notifications, and account communication.",
      },
    ];
  }, [setupBooleans]);

  const completedSteps = setupSteps.filter(
    (step) => step.status === "complete",
  ).length;

  const completionPercent = Math.round(
    (completedSteps / setupSteps.length) * 100,
  );

  const isBookingReady =
    setupBooleans.basicInfoComplete &&
    setupBooleans.serviceLocationComplete &&
    setupBooleans.petPassportsComplete;

  const avatarSrc = profile?.avatar_url || fallbackAvatar;
  const displayName = getCustomerDisplayName(profile);

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] text-slate-950">
        <Header />

        <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-16">
          <div className="rounded-[2rem] border border-emerald-100 bg-white px-8 py-7 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
            <p className="mt-3 text-base font-bold text-slate-700">
              Loading your Pet Parent setup hub...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] text-slate-950">
      <Header />

      <section className="mx-auto max-w-[1350px] px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        {errorMessage ? (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            {errorMessage}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="h-2 bg-emerald-500" />

          <div className="p-5 sm:p-6 lg:p-8">
            <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="grid gap-6 lg:grid-cols-[1.05fr_1.35fr] lg:items-center">
                <div className="flex items-center gap-5">
                  <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-emerald-100 bg-emerald-50 text-3xl font-black text-emerald-700">
                    {avatarSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarSrc}
                        alt={`${displayName} profile`}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      getCustomerInitials(profile)
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h1 className="truncate text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-5xl">
                        {displayName}
                      </h1>
                      <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                    </div>

                    <p className="mt-2 text-sm font-bold text-slate-600">
                      {profile?.email || "Email not added"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                        🐾 Pet Parent
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          isBookingReady
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isBookingReady ? "Booking Ready" : "Setup Needed"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 lg:border-l lg:border-emerald-100 lg:pl-8">
                  <div className="rounded-[1.5rem] bg-emerald-50 p-5 text-center">
                    <Heart className="mx-auto h-7 w-7 text-emerald-700" />
                    <p className="mt-3 text-3xl font-black text-slate-950">0</p>
                    <p className="mt-1 text-sm font-black text-slate-600">
                      Saved Gurus
                    </p>
                  </div>

                  <Link
                    href={routes.bookings}
                    className="rounded-[1.5rem] bg-emerald-50 p-5 text-center transition hover:bg-emerald-100"
                  >
                    <CalendarDays className="mx-auto h-7 w-7 text-emerald-700" />
                    <p className="mt-3 text-3xl font-black text-slate-950">
                      {bookingStats.total}
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-600">
                      Bookings
                    </p>
                  </Link>

                  <div className="rounded-[1.5rem] bg-emerald-50 p-5 text-center">
                    <Star className="mx-auto h-7 w-7 text-emerald-700" />
                    <p className="mt-3 text-3xl font-black text-slate-950">
                      {bookingStats.completed}
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-600">
                      Completed
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <section className="mt-6 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#047857_0%,#059669_42%,#10b981_100%)] text-white shadow-[0_22px_60px_rgba(5,150,105,0.24)]">
              <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1fr_190px] lg:items-center">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.26em] text-emerald-100">
                    Pet Parent Setup Hub
                  </p>

                  <h2 className="mt-3 text-4xl font-black tracking-[-0.055em] md:text-5xl">
                    Complete your 6-step care profile
                  </h2>

                  <p className="mt-3 max-w-4xl text-base font-semibold leading-7 text-emerald-50">
                    Each step captures information SitGuru uses throughout the
                    platform: matching, bookings, maps, Guru preparation, safety,
                    messaging, reminders, and rebooking.
                  </p>
                </div>

                <div className="rounded-[1.75rem] border border-white/20 bg-white/15 p-5 text-center shadow-sm backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-50">
                    Setup Progress
                  </p>
                  <p className="mt-2 text-5xl font-black">
                    {completedSteps}/6
                  </p>
                  <p className="mt-1 text-sm font-black text-emerald-50">
                    {completionPercent}% complete
                  </p>
                </div>
              </div>

              <div className="px-6 pb-7 md:px-8">
                <div className="h-3 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
                    Booking Readiness
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-slate-950">
                    {isBookingReady
                      ? "You are ready to book trusted care"
                      : "Finish the required setup steps"}
                  </h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                    {isBookingReady
                      ? "Your required Pet Parent details are in place. You can still improve your profile by completing recommended steps."
                      : "Complete Basic Info, Service Location, and Pet Passports so SitGuru can support matching and booking."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={routes.search}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700"
                  >
                    Find Gurus
                  </Link>

                  <Link
                    href={routes.pets}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                  >
                    Manage Pet Passports
                  </Link>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {setupSteps.map((step) => (
                <SetupCard key={step.number} step={step} />
              ))}
            </section>

            <section className="mt-8 rounded-[2rem] border border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_52%,#f0fdf4_100%)] p-5 shadow-sm md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">
                    Optional Next Steps
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
                    Explore more with SitGuru
                  </h2>
                  <p className="mt-2 max-w-4xl text-sm font-semibold leading-7 text-slate-600">
                    These actions are not required for profile completion. Use
                    them to find trusted Gurus, view PawPerks, invite more Pet
                    Parents, or start earning as a Guru.
                  </p>
                </div>

                <div className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                  PawPerks is automatic
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <OptionalActionCard
                  icon={<Search className="h-6 w-6" />}
                  eyebrow="Find care"
                  title="Find & Save Gurus"
                  body="Search local Gurus, compare fit, save favorites, and come back to trusted care providers again."
                  href={routes.search}
                  action="Find a Guru"
                />

                <OptionalActionCard
                  icon={<Gift className="h-6 w-6" />}
                  eyebrow="PawPerks"
                  title="View PawPerks"
                  body="All Pet Parents are automatically enrolled. View rewards, referral credit, and community growth options."
                  href={routes.pawPerks}
                  action="View PawPerks"
                />

                <OptionalActionCard
                  icon={<Megaphone className="h-6 w-6" />}
                  eyebrow="Grow SitGuru"
                  title="Invite Pet Parents"
                  body="Share SitGuru with friends, family, neighbors, coworkers, and local pet lovers who need trusted care."
                  href={routes.referrals}
                  action="Invite Pet Parents"
                />

                <OptionalActionCard
                  icon={<UserPlus className="h-6 w-6" />}
                  eyebrow="Earn with SitGuru"
                  title="Become a Guru"
                  body="Interested in earning? Start your Guru application and offer pet care services through SitGuru."
                  href={routes.guruApplication}
                  action="Become a Guru"
                />
              </div>
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                <User className="h-7 w-7 text-emerald-700" />
                <h3 className="mt-4 text-xl font-black text-slate-950">
                  Your contact details
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {profile?.phone || "Phone not added yet"}
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                <MapPin className="h-7 w-7 text-emerald-700" />
                <h3 className="mt-4 text-xl font-black text-slate-950">
                  Your service location
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {formatAddressLine(profile)}
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                <ShieldCheck className="h-7 w-7 text-emerald-700" />
                <h3 className="mt-4 text-xl font-black text-slate-950">
                  Safety and alerts
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {setupBooleans.emergencyContactComplete
                    ? "Emergency contact is ready."
                    : "Emergency contact still needs attention."}
                </p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  {setupBooleans.notificationsComplete
                    ? "Notifications are enabled."
                    : "Choose at least one notification channel."}
                </p>
              </div>
            </section>

            <section className="mt-6 rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
                    Setup Summary
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-slate-950">
                    {completionPercent === 100
                      ? "Your 6-step Pet Parent profile is complete."
                      : "Keep going to complete your 6-step profile."}
                  </h3>
                  <p className="mt-2 max-w-4xl text-sm font-semibold leading-7 text-slate-600">
                    Saved Gurus, PawPerks, invites, and becoming a Guru are
                    optional growth actions. They should not reduce your Pet
                    Parent setup completion score.
                  </p>
                </div>

                <Link
                  href={routes.dashboard}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  Back to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}