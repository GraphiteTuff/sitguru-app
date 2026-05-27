import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Database,
  Mail,
  MapPin,
  MessageSquare,
  PawPrint,
  ShieldCheck,
  Trash2,
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

type VerificationStatus =
  | "verified"
  | "active"
  | "pending"
  | "incomplete"
  | "missing";

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
  if (!text) return "—";

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: unknown) {
  const text = asString(value);
  if (!text) return "—";

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDisplayName(row: AnyRow | null | undefined, authUser?: AnyRow | null) {
  if (!row && !authUser) return "Customer";

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
      "email",
    ],
    "",
  );

  if (profileName) return profileName;

  const authEmail = getText(authUser, ["email"]);
  return authEmail || "Customer";
}

function getEmail(row: AnyRow | null | undefined, authUser?: AnyRow | null) {
  const profileEmail = getText(row, ["email", "customer_email", "pet_parent_email"]);
  const authEmail = getText(authUser, ["email"]);

  return profileEmail || authEmail || "No email found";
}

function getPhone(row: AnyRow | null | undefined, authUser?: AnyRow | null) {
  const profilePhone = getText(row, ["phone", "phone_number", "mobile", "mobile_phone"]);
  const authPhone = getText(authUser, ["phone"]);

  return profilePhone || authPhone || "No phone found";
}

function getLocation(row: AnyRow | null | undefined) {
  const city = getText(row, ["city", "customer_city", "location_city"]);
  const state = getText(row, ["state", "state_code", "customer_state", "location_state"]);
  const zip = getText(row, ["zip", "zipcode", "zip_code", "postal_code"]);

  const cityState = [city, state].filter(Boolean).join(", ");
  const location = [cityState, zip].filter(Boolean).join(" ");

  return location || "Unknown";
}

function getInitials(name: string) {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

function getBookingDate(row: AnyRow) {
  return getText(row, ["booking_date", "start_time", "start_date", "created_at", "updated_at"]);
}

function getBookingStatus(row: AnyRow) {
  return getText(row, ["status", "booking_status", "payment_status"], "Unknown");
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

function getPetName(row: AnyRow) {
  return getText(row, ["name", "pet_name", "animal_name"], "Pet");
}

function getPetDescription(row: AnyRow) {
  return (
    [
      getText(row, ["type", "species", "pet_type"]),
      getText(row, ["breed"]),
      getText(row, ["birthday", "birth_month_year", "date_of_birth"]),
    ]
      .filter(Boolean)
      .join(" • ") || "Pet details not completed"
  );
}

function getAuthProvider(authUser: AnyRow | null) {
  const appMetadata = authUser?.app_metadata as AnyRow | undefined;
  const userMetadata = authUser?.user_metadata as AnyRow | undefined;

  const provider =
    getText(appMetadata, ["provider"]) ||
    getText(userMetadata, ["provider"]) ||
    getText(authUser, ["provider"]);

  const providers = Array.isArray(appMetadata?.providers)
    ? appMetadata?.providers.filter(Boolean).join(", ")
    : "";

  return provider || providers || "Unknown";
}

function getMetadataName(authUser: AnyRow | null) {
  const userMetadata = authUser?.user_metadata as AnyRow | undefined;

  return getText(userMetadata, ["full_name", "name", "display_name"], "—");
}

function getProfileCompleteness({
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
  const checks = [
    {
      label: "Profile row",
      complete: Boolean(profile),
    },
    {
      label: "Name",
      complete: getDisplayName(profile, authUser) !== "Customer",
    },
    {
      label: "Email",
      complete: getEmail(profile, authUser) !== "No email found",
    },
    {
      label: "Phone",
      complete: getPhone(profile, authUser) !== "No phone found",
    },
    {
      label: "Location",
      complete: getLocation(profile) !== "Unknown",
    },
    {
      label: "Pet profile",
      complete: petsCount > 0,
    },
    {
      label: "Booking activity",
      complete: bookingsCount > 0,
    },
    {
      label: "Message activity",
      complete: messagesCount > 0,
    },
  ];

  const completed = checks.filter((check) => check.complete).length;
  const percentage = Math.round((completed / checks.length) * 100);

  return {
    checks,
    completed,
    total: checks.length,
    percentage,
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(
    value,
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

    if (result.error) {
      return [];
    }

    return Array.isArray(result.data) ? (result.data as AnyRow[]) : [];
  } catch {
    return [];
  }
}

async function getAuthUser(customerId: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(customerId);

    if (error || !data?.user) return null;

    return data.user as unknown as AnyRow;
  } catch {
    return null;
  }
}

function getVerifiedFields(profile: AnyRow | null, authUser: AnyRow | null) {
  const profileEmail = getText(profile, ["email", "customer_email", "pet_parent_email"]);
  const authEmail = getText(authUser, ["email"]);
  const profilePhone = getText(profile, ["phone", "phone_number", "mobile", "mobile_phone"]);
  const authPhone = getText(authUser, ["phone"]);

  const emailConfirmedAt = getText(authUser, ["email_confirmed_at", "confirmed_at"]);
  const phoneConfirmedAt = getText(authUser, ["phone_confirmed_at"]);
  const lastSignInAt = getText(authUser, ["last_sign_in_at"]);

  return {
    hasEmail: Boolean(profileEmail || authEmail),
    hasPhone: Boolean(profilePhone || authPhone),
    emailConfirmedAt,
    phoneConfirmedAt,
    lastSignInAt,
    hasConfirmedEmail: Boolean(emailConfirmedAt),
    hasConfirmedPhone: Boolean(phoneConfirmedAt),
    hasAuthUser: Boolean(authUser),
  };
}

function getVerificationStatus({
  profile,
  authUser,
  bookingsCount,
  petsCount,
  messagesCount,
  paidBookings,
}: {
  profile: AnyRow | null;
  authUser: AnyRow | null;
  bookingsCount: number;
  petsCount: number;
  messagesCount: number;
  paidBookings: number;
}) {
  const verifiedFields = getVerifiedFields(profile, authUser);
  const hasActivity = bookingsCount > 0 || petsCount > 0 || messagesCount > 0 || paidBookings > 0;
  const hasContact = verifiedFields.hasEmail || verifiedFields.hasPhone;
  const hasVerifiedContact = verifiedFields.hasConfirmedEmail || verifiedFields.hasConfirmedPhone;

  if (!profile && !authUser) {
    return {
      status: "missing" as VerificationStatus,
      label: "Missing Record",
      description: "No matching profile or Supabase auth user was found for this ID.",
    };
  }

  if (hasVerifiedContact && hasActivity) {
    return {
      status: "verified" as VerificationStatus,
      label: "Verified Pet Parent",
      description: "This Pet Parent has verified contact information and real platform activity.",
    };
  }

  if (hasActivity) {
    return {
      status: "active" as VerificationStatus,
      label: "Active / Needs Verification Review",
      description: "This record has activity, so it should not be hard-deleted. Verify contact details before cleanup.",
    };
  }

  if (hasContact || verifiedFields.hasAuthUser) {
    return {
      status: "pending" as VerificationStatus,
      label: "Pending Signup",
      description: "This person started signup or has an auth identity, but has not added pets, messages, or bookings yet.",
    };
  }

  return {
    status: "incomplete" as VerificationStatus,
    label: "Incomplete / Unverified",
    description: "No usable contact information or activity was found. This record is safe to review for deletion.",
  };
}

function getStatusStyles(status: VerificationStatus) {
  if (status === "verified") {
    return {
      card: "border-emerald-200 bg-emerald-50",
      icon: "bg-emerald-700 text-white",
      title: "text-emerald-950",
      badge: "border-emerald-200 bg-white text-emerald-800",
    };
  }

  if (status === "active") {
    return {
      card: "border-sky-200 bg-sky-50",
      icon: "bg-sky-700 text-white",
      title: "text-sky-950",
      badge: "border-sky-200 bg-white text-sky-800",
    };
  }

  if (status === "pending") {
    return {
      card: "border-amber-200 bg-amber-50",
      icon: "bg-amber-600 text-white",
      title: "text-amber-950",
      badge: "border-amber-200 bg-white text-amber-800",
    };
  }

  if (status === "missing") {
    return {
      card: "border-slate-200 bg-slate-50",
      icon: "bg-slate-700 text-white",
      title: "text-slate-950",
      badge: "border-slate-200 bg-white text-slate-700",
    };
  }

  return {
    card: "border-rose-200 bg-rose-50",
    icon: "bg-rose-700 text-white",
    title: "text-rose-950",
    badge: "border-rose-200 bg-white text-rose-800",
  };
}

async function deleteIncompletePetParentAction(formData: FormData) {
  "use server";

  const customerId = String(formData.get("customerId") || "");

  if (!isUuid(customerId)) {
    redirect("/admin/customers?cleanup=invalid-id");
  }

  const [{ data: profile }, authUser, bookings, pets, sentMessages, receivedMessages] = await Promise.all([
    supabaseAdmin.from("profiles").select("*").eq("id", customerId).maybeSingle(),
    getAuthUser(customerId),
    safeSelect("bookings", "id,total_customer_paid,customer_total_amount,total_amount,amount,price,subtotal,service_total,total_paid", (query) =>
      query.or(
        [
          `customer_id.eq.${customerId}`,
          `pet_owner_id.eq.${customerId}`,
          `user_id.eq.${customerId}`,
          `pet_parent_id.eq.${customerId}`,
        ].join(","),
      ),
    ),
    safeSelect("pets", "id", (query) =>
      query.or(
        [
          `owner_profile_id.eq.${customerId}`,
          `owner_id.eq.${customerId}`,
          `customer_id.eq.${customerId}`,
          `pet_parent_id.eq.${customerId}`,
          `user_id.eq.${customerId}`,
        ].join(","),
      ),
    ),
    safeSelect("messages", "id", (query) => query.eq("sender_id", customerId)),
    safeSelect("messages", "id", (query) => query.eq("recipient_id", customerId)),
  ]);

  const profileRow = (profile ?? null) as AnyRow | null;
  const paidBookings = bookings.filter((booking) => getBookingAmount(booking) > 0).length;
  const messages = [...sentMessages, ...receivedMessages];
  const verifiedFields = getVerifiedFields(profileRow, authUser);

  const safeToDelete =
    Boolean(profileRow) &&
    bookings.length === 0 &&
    pets.length === 0 &&
    messages.length === 0 &&
    paidBookings === 0 &&
    !verifiedFields.hasEmail &&
    !verifiedFields.hasPhone &&
    !verifiedFields.hasConfirmedEmail &&
    !verifiedFields.hasConfirmedPhone;

  if (!safeToDelete) {
    redirect(`/admin/customers/${customerId}?cleanup=blocked`);
  }

  await supabaseAdmin.from("profiles").delete().eq("id", customerId);

  if (authUser && !verifiedFields.hasEmail && !verifiedFields.hasPhone) {
    try {
      await supabaseAdmin.auth.admin.deleteUser(customerId);
    } catch {
      // If the auth user cannot be deleted, keep the admin flow moving. The profile was the visible admin record.
    }
  }

  revalidatePath("/admin/customers");
  revalidatePath("/admin/customer-intelligence");
  revalidatePath("/admin/customers/customer-intelligence");
  redirect("/admin/customers?cleanup=deleted-incomplete-pet-parent");
}

export default async function AdminCustomerDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const customerId = resolvedParams.id;

  if (!isUuid(customerId)) {
    return (
      <main className="min-h-screen bg-[#f7fbf7] px-4 py-6 text-[#062f2b] sm:px-6 lg:px-8">
        <section className="mx-auto max-w-6xl rounded-[2rem] border border-red-100 bg-white p-6 shadow-sm">
          <Link
            href="/admin/customer-intelligence"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-emerald-800 hover:text-emerald-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Customer Intelligence
          </Link>

          <div className="mt-6 rounded-3xl border border-red-100 bg-red-50 p-5">
            <h1 className="text-3xl font-black">Customer record not available</h1>
            <p className="mt-2 text-sm font-semibold text-red-800">
              This customer link is not using a valid Supabase profile ID.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const [profileResult, authUser] = await Promise.all([
    supabaseAdmin.from("profiles").select("*").eq("id", customerId).maybeSingle(),
    getAuthUser(customerId),
  ]);

  const profile = (profileResult.data ?? null) as AnyRow | null;

  const [bookings, pets, sentMessages, receivedMessages] = await Promise.all([
    safeSelect("bookings", "*", (query) =>
      query
        .or(
          [
            `customer_id.eq.${customerId}`,
            `pet_owner_id.eq.${customerId}`,
            `user_id.eq.${customerId}`,
            `pet_parent_id.eq.${customerId}`,
          ].join(","),
        )
        .order("created_at", { ascending: false }),
    ),
    safeSelect("pets", "*", (query) =>
      query
        .or(
          [
            `owner_profile_id.eq.${customerId}`,
            `owner_id.eq.${customerId}`,
            `customer_id.eq.${customerId}`,
            `pet_parent_id.eq.${customerId}`,
            `user_id.eq.${customerId}`,
          ].join(","),
        )
        .order("created_at", { ascending: false }),
    ),
    safeSelect("messages", "*", (query) =>
      query.eq("sender_id", customerId).order("created_at", { ascending: false }),
    ),
    safeSelect("messages", "*", (query) =>
      query.eq("recipient_id", customerId).order("created_at", { ascending: false }),
    ),
  ]);

  const messages = [...sentMessages, ...receivedMessages].sort((a, b) => {
    const aTime = new Date(getText(a, ["created_at"])).getTime() || 0;
    const bTime = new Date(getText(b, ["created_at"])).getTime() || 0;

    return bTime - aTime;
  });

  const name = getDisplayName(profile, authUser);
  const email = getEmail(profile, authUser);
  const phone = getPhone(profile, authUser);
  const location = getLocation(profile);
  const role = getText(profile, ["role", "user_role", "account_type"], "customer");
  const source = getText(
    profile,
    [
      "source",
      "signup_source",
      "referral_source",
      "lead_source",
      "acquisition_source",
      "utm_source",
    ],
    "sitguru",
  );

  const totalSpend = bookings.reduce((sum, booking) => sum + getBookingAmount(booking), 0);
  const paidBookings = bookings.filter((booking) => getBookingAmount(booking) > 0).length;
  const averageBookingValue = bookings.length > 0 ? totalSpend / bookings.length : 0;
  const lastBooking = bookings[0] ?? null;
  const verifiedFields = getVerifiedFields(profile, authUser);
  const verification = getVerificationStatus({
    profile,
    authUser,
    bookingsCount: bookings.length,
    petsCount: pets.length,
    messagesCount: messages.length,
    paidBookings,
  });
  const statusStyles = getStatusStyles(verification.status);
  const profileCompleteness = getProfileCompleteness({
    profile,
    authUser,
    petsCount: pets.length,
    bookingsCount: bookings.length,
    messagesCount: messages.length,
  });

  const cleanupReasons = [
    verifiedFields.hasAuthUser ? "Supabase auth identity found" : "No Supabase auth identity found",
    verifiedFields.hasEmail ? "Email available" : "No email found",
    verifiedFields.hasPhone ? "Phone available" : "No phone found",
    verifiedFields.hasConfirmedEmail ? "Email verified" : "Email not verified",
    verifiedFields.hasConfirmedPhone ? "Phone verified" : "Phone not verified",
    bookings.length > 0 ? `${bookings.length} booking record(s)` : "No bookings",
    pets.length > 0 ? `${pets.length} pet profile record(s)` : "No pets",
    messages.length > 0 ? `${messages.length} message record(s)` : "No messages",
  ];

  const safeToDelete =
    Boolean(profile) &&
    bookings.length === 0 &&
    pets.length === 0 &&
    messages.length === 0 &&
    paidBookings === 0 &&
    !verifiedFields.hasEmail &&
    !verifiedFields.hasPhone &&
    !verifiedFields.hasConfirmedEmail &&
    !verifiedFields.hasConfirmedPhone;

  return (
    <main className="min-h-screen bg-[#f7fbf7] px-4 py-6 text-[#062f2b] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/customer-intelligence"
              className="inline-flex items-center gap-2 text-sm font-extrabold text-emerald-800 hover:text-emerald-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Customer Intelligence
            </Link>

            <Link
              href="/admin/customers"
              className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-600 hover:text-slate-950"
            >
              Back to Customers
            </Link>
          </div>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-emerald-100 text-xl font-black text-emerald-900">
                {getInitials(name)}
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">
                  Super Admin / Pet Parent Detail
                </p>
                <h1 className="mt-1 text-4xl font-black tracking-tight sm:text-5xl">
                  {name}
                </h1>
                <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-700">
                  Full SitGuru Pet Parent profile with Supabase auth identity,
                  customer profile data, verification status, pets, bookings,
                  message activity, and protected cleanup controls.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                    {role}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    Source: {source}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    ID: {customerId}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/bookings"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-800 shadow-sm hover:bg-emerald-50"
              >
                <CalendarDays className="h-4 w-4" />
                View Bookings
              </Link>

              <Link
                href="/admin/messages"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-emerald-800"
              >
                <MessageSquare className="h-4 w-4" />
                View Messages
              </Link>
            </div>
          </div>
        </div>

        {!profile ? (
          <div className="mt-5 rounded-[2rem] border border-amber-100 bg-amber-50 p-5 shadow-sm">
            <h2 className="text-2xl font-black">Pet Parent profile not found</h2>
            <p className="mt-2 text-sm font-semibold text-amber-900">
              This route is working, so it will not 404 anymore. However, the profile ID does
              not currently exist in the live Supabase `profiles` table. If a Supabase Auth
              identity is still found below, the signup likely needs the profile repair/upsert
              flow from the auth callback.
            </p>
          </div>
        ) : null}

        <section className={["mt-5 rounded-[2rem] border p-5 shadow-sm", statusStyles.card].join(" ")}>
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex gap-4">
              <div className={["flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", statusStyles.icon].join(" ")}>
                {verification.status === "verified" || verification.status === "active" ? (
                  <ShieldCheck className="h-6 w-6" />
                ) : verification.status === "pending" ? (
                  <Clock3 className="h-6 w-6" />
                ) : (
                  <AlertTriangle className="h-6 w-6" />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className={["text-2xl font-black", statusStyles.title].join(" ")}>
                    Pet Parent Verification
                  </h2>
                  <span className={["rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em]", statusStyles.badge].join(" ")}>
                    {verification.label}
                  </span>
                </div>
                <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-700">
                  {verification.description}
                </p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {cleanupReasons.map((reason) => (
                    <div key={reason} className="rounded-2xl border border-white/70 bg-white/75 px-3 py-2 text-xs font-black text-slate-700 shadow-sm">
                      {reason}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full rounded-3xl border border-white/70 bg-white/80 p-4 shadow-sm xl:max-w-sm">
              <p className="flex items-center gap-2 text-sm font-black text-slate-950">
                <Database className="h-4 w-4 text-emerald-700" />
                Admin cleanup controls
              </p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                Hard delete is only enabled for records with no contact info, no pets, no
                bookings, no messages, and no verified auth contact. Real Pet Parents should
                be kept or reviewed manually.
              </p>

              {safeToDelete ? (
                <form action={deleteIncompletePetParentAction} className="mt-4">
                  <input type="hidden" name="customerId" value={customerId} />
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-700 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-rose-800"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete incomplete record
                  </button>
                </form>
              ) : (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="flex items-start gap-2 text-xs font-bold leading-5 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                    Delete is locked because this record has contact data, auth data, or
                    activity. Keep it for review unless you add a separate archive workflow.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              <CircleDollarSign className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Lifetime Spend
            </p>
            <p className="mt-1 text-3xl font-black">{formatMoney(totalSpend)}</p>
            <p className="mt-1 text-xs font-bold text-slate-600">
              {paidBookings} paid bookings
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              <CalendarDays className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Bookings
            </p>
            <p className="mt-1 text-3xl font-black">{bookings.length}</p>
            <p className="mt-1 text-xs font-bold text-slate-600">
              Avg. {formatMoney(averageBookingValue)}
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              <PawPrint className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Pets
            </p>
            <p className="mt-1 text-3xl font-black">{pets.length}</p>
            <p className="mt-1 text-xs font-bold text-slate-600">
              Live pet profile records
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              <MessageSquare className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Messages
            </p>
            <p className="mt-1 text-3xl font-black">{messages.length}</p>
            <p className="mt-1 text-xs font-bold text-slate-600">
              Sent and received messages
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-black">Pet Parent Profile</h2>

            <div className="mt-5 space-y-3">
              <ProfileInfoRow
                icon={<UserRound className="mt-0.5 h-5 w-5 text-emerald-700" />}
                label="Name"
                value={name}
              />

              <ProfileInfoRow
                icon={<Mail className="mt-0.5 h-5 w-5 text-emerald-700" />}
                label="Email"
                value={email}
                detail={verifiedFields.hasConfirmedEmail ? "Email verified" : "Email not verified"}
              />

              <ProfileInfoRow
                icon={<UserRound className="mt-0.5 h-5 w-5 text-emerald-700" />}
                label="Phone"
                value={phone}
                detail={verifiedFields.hasConfirmedPhone ? "Phone verified" : "Phone not verified"}
              />

              <ProfileInfoRow
                icon={<MapPin className="mt-0.5 h-5 w-5 text-emerald-700" />}
                label="Location"
                value={location}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <ProfileMiniBox label="Role" value={role} />
                <ProfileMiniBox label="Source" value={source} />
                <ProfileMiniBox label="Created" value={formatDate(profile?.created_at || authUser?.created_at)} />
                <ProfileMiniBox label="Updated" value={formatDate(profile?.updated_at)} />
                <ProfileMiniBox label="Last Sign In" value={formatDateTime(verifiedFields.lastSignInAt)} />
                <ProfileMiniBox label="Last Booking" value={formatDate(lastBooking ? getBookingDate(lastBooking) : null)} />
                <ProfileMiniBox label="Auth Identity" value={verifiedFields.hasAuthUser ? "Found" : "Not found"} />
                <ProfileMiniBox label="Auth Provider" value={getAuthProvider(authUser)} />
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <h2 className="text-2xl font-black">Profile Completion</h2>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  Simple Super Admin checklist showing what this Pet Parent has completed.
                </p>
              </div>

              <div className="rounded-3xl bg-emerald-100 px-5 py-3 text-center">
                <p className="text-3xl font-black text-emerald-900">
                  {profileCompleteness.percentage}%
                </p>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">
                  Complete
                </p>
              </div>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-700"
                style={{ width: `${profileCompleteness.percentage}%` }}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {profileCompleteness.checks.map((check) => (
                <div
                  key={check.label}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <p className="text-sm font-black text-slate-800">{check.label}</p>
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-black",
                      check.complete
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800",
                    ].join(" ")}
                  >
                    {check.complete ? "Found" : "Missing"}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Auth metadata name
              </p>
              <p className="mt-1 text-sm font-black text-slate-950">
                {getMetadataName(authUser)}
              </p>
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black">Booking History</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Live records matched by customer_id, pet_owner_id, user_id, or pet_parent_id.
          </p>

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
                      <th className="px-4 py-3">Booking ID</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {bookings.slice(0, 20).map((booking) => (
                      <tr key={String(booking.id)}>
                        <td className="px-4 py-3 font-bold">
                          {formatDate(getBookingDate(booking))}
                        </td>
                        <td className="px-4 py-3 font-bold">{getBookingStatus(booking)}</td>
                        <td className="px-4 py-3 font-bold">
                          {getText(booking, ["pet_name", "animal_name"], "—")}
                        </td>
                        <td className="max-w-[180px] truncate px-4 py-3 text-xs font-bold text-slate-500">
                          {String(booking.id || "—")}
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

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-black">Pets</h2>

            <div className="mt-5 space-y-3">
              {pets.length === 0 ? (
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 text-sm font-bold text-slate-600">
                  No pet profiles found for this Pet Parent.
                </div>
              ) : (
                pets.map((pet) => (
                  <div
                    key={String(pet.id)}
                    className="rounded-3xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <p className="text-lg font-black">{getPetName(pet)}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {getPetDescription(pet)}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <p className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-600">
                        Pet ID: {String(pet.id || "—")}
                      </p>
                      <p className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-600">
                        Created: {formatDate(pet.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-black">Message Activity</h2>

            <div className="mt-5 space-y-3">
              {messages.length === 0 ? (
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 text-sm font-bold text-slate-600">
                  No messages found for this Pet Parent.
                </div>
              ) : (
                messages.slice(0, 12).map((message) => (
                  <div
                    key={String(message.id)}
                    className="rounded-3xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black">
                        {getText(message, ["subject", "title"], "Message")}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        {formatDateTime(message.created_at)}
                      </p>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-600">
                      {getText(
                        message,
                        ["body", "message", "content", "snippet"],
                        "No message preview available.",
                      )}
                    </p>
                    <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-500">
                      Message ID: {String(message.id || "—")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black">Super Admin Record Details</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Quick audit fields for confirming whether the Auth user and profile row are connected correctly.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <ProfileMiniBox label="Profile ID" value={customerId} />
            <ProfileMiniBox label="Auth user found" value={authUser ? "Yes" : "No"} />
            <ProfileMiniBox label="Email confirmed" value={verifiedFields.emailConfirmedAt ? formatDateTime(verifiedFields.emailConfirmedAt) : "No"} />
            <ProfileMiniBox label="Phone confirmed" value={verifiedFields.phoneConfirmedAt ? formatDateTime(verifiedFields.phoneConfirmedAt) : "No"} />
            <ProfileMiniBox label="Provider" value={getAuthProvider(authUser)} />
            <ProfileMiniBox label="Profile created" value={formatDateTime(profile?.created_at)} />
            <ProfileMiniBox label="Profile updated" value={formatDateTime(profile?.updated_at)} />
            <ProfileMiniBox label="Last sign in" value={formatDateTime(verifiedFields.lastSignInAt)} />
          </div>
        </section>
      </section>
    </main>
  );
}

function ProfileInfoRow({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      {icon}
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          {label}
        </p>
        <p className="break-words text-sm font-black">{value}</p>
        {detail ? (
          <p className="mt-1 text-xs font-bold text-slate-500">{detail}</p>
        ) : null}
      </div>
    </div>
  );
}

function ProfileMiniBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black">{value || "—"}</p>
    </div>
  );
}