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
import CustomerProfileView, { type ProfilePet, type ProfileRole } from "@/components/customer/CustomerProfileView";
import { supabase } from "@/lib/supabase";
import { getPetParentReadiness } from "@/lib/pet-parent-readiness";
import { resolvePetParentAvatarUrl } from "@/lib/pet-parent-avatar";

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
  account_role: string | null;
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
  pets: "/customer/dashboard#new-pet-passport",
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

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
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
    resolvePetParentAvatarUrl(row, metadata) || null;

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
    account_role:
      readFirstString(row, ["role", "account_type", "signup_role"]) ||
      readMetadataString(metadata, ["role", "account_type", "signup_role"]),
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

async function fetchHouseholdPets(userId: string): Promise<ProfilePet[]> {
  const columns = ["owner_id", "user_id", "customer_id", "pet_parent_id"];
  for (const column of columns) {
    const { data, error } = await supabase
      .from("pets")
      .select("id,name,species,pet_type,breed,age,photo_url")
      .eq(column, userId)
      .limit(6);
    if (error || !data) continue;
    return data.map((pet) => ({
      id: String(pet.id),
      name: String(pet.name || "Pet"),
      detail: [pet.breed || pet.species || pet.pet_type, pet.age ? `${pet.age}` : ""].filter(Boolean).join(" · ") || "Pet",
      photo: String(pet.photo_url || ""),
    }));
  }
  return [];
}

async function fetchRoleNames(userId: string) {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error || !data) return [];
  return data.map((row) => String(row.role || "").toLowerCase()).filter(Boolean);
}

async function fetchBookingStats(userId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select("id,status")
    .or(
      `customer_id.eq.${userId},pet_owner_id.eq.${userId},user_id.eq.${userId}`,
    )
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

function buildProfileRoles(roleNames: string[]): ProfileRole[] {
  const blob = roleNames.join(" ").toLowerCase();
  const has = (...needles: string[]) => needles.some((needle) => blob.includes(needle));
  const manager = has("social_community_manager", "growth_manager", "intern_manager", "marketing_admin");
  const intern = has("intern") && !manager;
  const guru = has("guru");
  return [
    {
      id: "parent",
      title: "Pet Parent",
      detail: "Book and manage care. Preferences on this page stay with this role.",
      active: true,
      href: "/customer/dashboard",
    },
    {
      id: "guru",
      title: "Guru",
      detail: "Professional pet care. Guru details stay on the Guru profile.",
      active: guru,
      href: guru ? "/guru/dashboard" : "/guru/application",
    },
    {
      id: "intern",
      title: "Intern",
      detail: "Opens only after an internship is approved.",
      active: intern,
      href: intern ? "/intern" : "/account/staff-access",
    },
    {
      id: "manager",
      title: "Manager",
      detail: "Opens only for an approved manager role.",
      active: manager,
      href: manager ? "/manager" : "/account/staff-access",
    },
  ];
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
      className={`group flex min-h-[280px] flex-col rounded-[1.75rem] border p-5 transition hover:-translate-y-1 hover:shadow-xl sm:min-h-[315px] ${getStatusClassName(
        step.status,
      )}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl shadow-sm ring-1 ring-white/80">
          {isComplete ? "✓" : step.number}
        </div>

        <span
          className={`rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] ${
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

      <div className="mt-auto flex min-h-[52px] items-center justify-between border-t border-white/80 pt-5">
        <span className="text-base font-black text-emerald-700">
          {step.actionLabel}
        </span>
        <ArrowRight className="h-5 w-5 text-emerald-700 transition group-hover:translate-x-1" />
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
  const [avatarImageFailed, setAvatarImageFailed] = useState(false);
  const [pets, setPets] = useState<ProfilePet[]>([]);
  const [roles, setRoles] = useState<string[]>([]);

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
      const [profileData, petsTotal, household, roleRows, bookingsTotal] = await Promise.all([
        fetchCustomerProfile(user),
        fetchPetCount(user.id),
        fetchHouseholdPets(user.id),
        fetchRoleNames(user.id),
        fetchBookingStats(user.id),
      ]);

      setProfile(profileData);
      setPetCount(petsTotal);
      setPets(household);
      setRoles(roleRows);
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

  const readiness = useMemo(
    () =>
      getPetParentReadiness({
        ...(profile ?? {}),
        petCount,
      }),
    [profile, petCount],
  );

  const setupBooleans = useMemo(
    () => ({
      basicInfoComplete: readiness.basicInfoComplete,
      serviceLocationComplete: readiness.serviceLocationComplete,
      petPassportsComplete: readiness.petPassportsComplete,
      careNotesComplete: readiness.careNotesComplete,
      emergencyContactComplete: readiness.emergencyContactComplete,
      notificationsComplete: readiness.notificationsComplete,
    }),
    [readiness],
  );

  const setupSteps = useMemo<PetParentSetupStep[]>(() => {
    const basic = getCompletionStatus(setupBooleans.basicInfoComplete, true);
    const location = getCompletionStatus(
      setupBooleans.serviceLocationComplete,
      true,
    );
    const pets = getCompletionStatus(setupBooleans.petPassportsComplete, true);
    const careNotes = getCompletionStatus(
      setupBooleans.careNotesComplete,
      false,
    );
    const emergency = getCompletionStatus(
      setupBooleans.emergencyContactComplete,
      false,
    );
    const notifications = getCompletionStatus(
      setupBooleans.notificationsComplete,
      false,
    );

    return [
      {
        number: 1,
        title: "Basic Info",
        body: "Add your name so SitGuru can greet you. Phone and photo help your Guru reach you, but they are not required to book.",
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
        body: "A care ZIP is enough to find nearby Gurus. Street address helps your Guru arrive — add it when you can.",
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
        body: "Add one pet name and whether they are a dog or cat. Extra passport details help your Guru prepare.",
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
        body: "Recommended: share routines, feeding, meds, and house notes so your Guru is ready. Not required to book.",
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
        body: "Recommended: add a backup contact so SitGuru and your Guru can help if something urgent comes up.",
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
        body: "Recommended: choose email, text, or push so you do not miss booking messages. You can book without this step.",
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

  const requiredSteps = setupSteps.filter((step) => step.number <= 3);
  const recommendedSteps = setupSteps.filter((step) => step.number > 3);
  const completedRecommended = recommendedSteps.filter(
    (step) => step.status === "complete",
  ).length;

  const isBookingReady = readiness.readyToBook;

  const nextIncompleteStep = setupSteps.find(
    (step) => step.status !== "complete",
  );

  const avatarSrc = profile?.avatar_url || "";
  const displayName = getCustomerDisplayName(profile);
  const avatarInitials = getCustomerInitials(profile);
  const showAvatarImage = Boolean(avatarSrc) && !avatarImageFailed;

  useEffect(() => {
    setAvatarImageFailed(false);
  }, [avatarSrc]);

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

        <CustomerProfileView
          name={displayName}
          email={profile?.email || "Email not added"}
          phone={profile?.phone || "Phone not added"}
          place={formatAddressLine(profile)}
          avatarSrc={showAvatarImage ? avatarSrc : ""}
          completion={Math.round((setupSteps.filter((step) => step.status === "complete").length / Math.max(setupSteps.length, 1)) * 100)}
          pets={pets}
          roles={buildProfileRoles([...(roles || []), profile?.account_role || ""])}
          careNotes={profile?.care_preferences || ""}
          emergency={profile?.emergency_contact_name || profile?.emergency_contact || "Not added yet"}
          notifications={{
            booking: Boolean(profile?.email_notifications),
            messages: Boolean(profile?.text_notifications || profile?.push_notifications),
            offers: Boolean(profile?.email_notifications),
          }}
          nextHref={nextIncompleteStep?.actionHref || routes.basicInfo}
          bookingReady={isBookingReady}
        />
      </section>
    </main>
  );
}
