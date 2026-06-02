import type { ReactNode } from "react";
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
  | "needs_review"
  | "likely_test_spam"
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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
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

function isPlaceholderName(value: string) {
  const normalized = value.trim().toLowerCase();

  if (!normalized) return true;

  return [
    "customer",
    "pet parent",
    "petparent",
    "unknown",
    "unknown customer",
    "unknown pet parent",
    "test",
    "demo",
    "fake",
    "sample",
    "asdf",
    "asdasd",
    "n/a",
    "na",
    "none",
  ].includes(normalized);
}

function looksLikeRandomToken(value: string) {
  const compact = value.replace(/[^a-zA-Z0-9]/g, "");

  if (compact.length < 10) return false;
  if (/^[0-9a-f]{16,}$/i.test(compact)) return true;

  const hasLower = /[a-z]/.test(compact);
  const hasUpper = /[A-Z]/.test(compact);
  const hasNumber = /\d/.test(compact);
  const hasVowel = /[aeiou]/i.test(compact);
  const hasSuspiciousCamelMix = hasLower && hasUpper && compact.length >= 12;
  const hasLongConsonantRun = /[bcdfghjklmnpqrstvwxyz]{5,}/i.test(compact);

  return (hasSuspiciousCamelMix && !value.includes(" ")) || (hasNumber && !hasVowel) || hasLongConsonantRun;
}

function looksLikeSuspiciousEmail(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) return false;

  const [localPart, domain = ""] = normalized.split("@");
  const localWithoutDots = localPart.replace(/\./g, "");

  const hasManySingleLetterSegments = localPart.split(".").filter((part) => part.length === 1).length >= 4;
  const hasDisposableDomain = [
    "example.com",
    "test.com",
    "demo.com",
    "mailinator.com",
    "tempmail.com",
    "10minutemail.com",
  ].includes(domain);

  return (
    hasManySingleLetterSegments ||
    hasDisposableDomain ||
    looksLikeRandomToken(localWithoutDots) ||
    ["test", "demo", "fake", "sample", "asdf", "asdasd"].some((keyword) =>
      normalized.includes(keyword),
    )
  );
}

function isTrustworthyDisplayName(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return false;
  if (trimmed.includes("@")) return false;
  if (isPlaceholderName(trimmed)) return false;
  if (looksLikeRandomToken(trimmed)) return false;

  return /[a-zA-Z]/.test(trimmed);
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

function getDisplayNameSource(row: AnyRow | null | undefined, authUser?: AnyRow | null) {
  const rawName = getRawDisplayName(row, authUser);

  if (rawName && isTrustworthyDisplayName(rawName)) return "profile name";
  if (rawName) return "untrusted signup metadata";

  const authEmail = getText(authUser, ["email"]);
  const profileEmail = getText(row, ["email", "customer_email", "pet_parent_email"]);
  const email = profileEmail || authEmail;

  if (email) return "email fallback";

  return "missing";
}

function getDisplayName(row: AnyRow | null | undefined, authUser?: AnyRow | null) {
  const rawName = getRawDisplayName(row, authUser);

  if (rawName && isTrustworthyDisplayName(rawName)) return rawName;

  const authEmail = getText(authUser, ["email"]);
  const profileEmail = getText(row, ["email", "customer_email", "pet_parent_email"]);
  const email = profileEmail || authEmail;

  if (email && !looksLikeSuspiciousEmail(email)) return email;

  if (rawName) return "Pet Parent Signup Review";

  return "Pet Parent";
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

  if (parts.length === 0) return "P";
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
  const userMetadata = getAuthMetadata(authUser) || undefined;

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
  const userMetadata = getAuthMetadata(authUser);

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
  const verifiedFields = getVerifiedFields(profile, authUser);
  const rawName = getRawDisplayName(profile, authUser);
  const trustedName = isTrustworthyDisplayName(rawName);
  const email = getEmail(profile, authUser);
  const phone = getPhone(profile, authUser);
  const location = getLocation(profile);

  const checks = [
    {
      label: "Profile row",
      complete: Boolean(profile),
      detail: profile ? "Found" : "Missing",
    },
    {
      label: "Real name",
      complete: trustedName,
      detail: trustedName ? "Looks usable" : rawName ? "Needs review" : "Missing",
    },
    {
      label: "Email",
      complete: email !== "No email found" && !looksLikeSuspiciousEmail(email),
      detail:
        email === "No email found"
          ? "Missing"
          : looksLikeSuspiciousEmail(email)
            ? "Suspicious"
            : "Found",
    },
    {
      label: "Phone",
      complete: phone !== "No phone found",
      detail: phone !== "No phone found" ? "Found" : "Missing",
    },
    {
      label: "Verified contact",
      complete: verifiedFields.hasConfirmedEmail || verifiedFields.hasConfirmedPhone,
      detail:
        verifiedFields.hasConfirmedEmail || verifiedFields.hasConfirmedPhone
          ? "Verified"
          : "Not verified",
    },
    {
      label: "Location",
      complete: location !== "Unknown",
      detail: location !== "Unknown" ? "Found" : "Missing",
    },
    {
      label: "Pet profile",
      complete: petsCount > 0,
      detail: petsCount > 0 ? `${petsCount} found` : "Missing",
    },
    {
      label: "Platform activity",
      complete: bookingsCount > 0 || messagesCount > 0,
      detail:
        bookingsCount > 0 || messagesCount > 0
          ? `${bookingsCount} bookings / ${messagesCount} messages`
          : "Missing",
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

function getSignupRiskAssessment({
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
  const rawName = getRawDisplayName(profile, authUser);
  const email = getEmail(profile, authUser);
  const phone = getPhone(profile, authUser);
  const hasActivity = bookingsCount > 0 || petsCount > 0 || messagesCount > 0 || paidBookings > 0;
  const hasVerifiedContact = verifiedFields.hasConfirmedEmail || verifiedFields.hasConfirmedPhone;
  const suspiciousReasons: string[] = [];

  if (rawName && !isTrustworthyDisplayName(rawName)) {
    suspiciousReasons.push("Name looks like placeholder, test, or random signup metadata");
  }

  if (email !== "No email found" && looksLikeSuspiciousEmail(email)) {
    suspiciousReasons.push("Email pattern looks suspicious or test-like");
  }

  if (!hasVerifiedContact) {
    suspiciousReasons.push("No verified email or phone");
  }

  if (petsCount === 0) suspiciousReasons.push("No pet profile added");
  if (bookingsCount === 0) suspiciousReasons.push("No bookings found");
  if (messagesCount === 0) suspiciousReasons.push("No messages found");
  if (phone === "No phone found" && email === "No email found") suspiciousReasons.push("No usable contact field");

  const likelyTestOrSpam =
    !hasActivity &&
    !hasVerifiedContact &&
    (Boolean(rawName && !isTrustworthyDisplayName(rawName)) || looksLikeSuspiciousEmail(email));

  const needsReview =
    !likelyTestOrSpam &&
    !hasActivity &&
    (!hasVerifiedContact || !isTrustworthyDisplayName(rawName) || petsCount === 0);

  return {
    likelyTestOrSpam,
    needsReview,
    hasActivity,
    hasVerifiedContact,
    rawName: rawName || "—",
    displayNameSource: getDisplayNameSource(profile, authUser),
    suspiciousReasons,
  };
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
  if (isUuid(lookupKey)) {
    return getAuthUserById(lookupKey);
  }

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
  const riskAssessment = getSignupRiskAssessment({
    profile,
    authUser,
    bookingsCount,
    petsCount,
    messagesCount,
    paidBookings,
  });
  const hasActivity = bookingsCount > 0 || petsCount > 0 || messagesCount > 0 || paidBookings > 0;
  const hasContact = verifiedFields.hasEmail || verifiedFields.hasPhone;
  const hasVerifiedContact = verifiedFields.hasConfirmedEmail || verifiedFields.hasConfirmedPhone;

  if (!profile && !authUser) {
    return {
      status: "missing" as VerificationStatus,
      label: "Missing Record",
      description: "No matching profile or Supabase auth user was found for this ID or email.",
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
      description: "This record has pets, bookings, or messages, so keep it. Verify contact details before cleanup.",
    };
  }

  if (riskAssessment.likelyTestOrSpam) {
    return {
      status: "likely_test_spam" as VerificationStatus,
      label: "Likely Test / Spam Signup",
      description:
        "This record only has signup/auth data, no verified contact, no pets, no bookings, no messages, and suspicious name or email patterns. Review before deleting or archiving.",
    };
  }

  if (riskAssessment.needsReview) {
    return {
      status: "needs_review" as VerificationStatus,
      label: "Incomplete Signup / Needs Review",
      description:
        "This person started signup, but the Pet Parent setup is not complete. Review contact quality, verification, location, and pet setup before treating them as a real active Pet Parent.",
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

  if (status === "needs_review") {
    return {
      card: "border-orange-200 bg-orange-50",
      icon: "bg-orange-600 text-white",
      title: "text-orange-950",
      badge: "border-orange-200 bg-white text-orange-800",
    };
  }

  if (status === "likely_test_spam") {
    return {
      card: "border-rose-200 bg-rose-50",
      icon: "bg-rose-700 text-white",
      title: "text-rose-950",
      badge: "border-rose-200 bg-white text-rose-800",
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


function buildCustomerDirectMessageHref({
  customerId,
  name,
  email,
  phone,
}: {
  customerId: string;
  name: string;
  email: string;
  phone: string;
}) {
  const query = new URLSearchParams({
    threadType: "direct_customer",
    messageCategory: "direct",
    source: "admin_customer_detail",
    recipientRole: "customer",
    recipientName: name || "Pet Parent",
  });

  if (customerId) query.set("recipientId", customerId);
  if (email && email !== "No email found") query.set("recipientEmail", email);
  if (phone && phone !== "No phone found") query.set("recipientPhone", phone);

  return `/admin/messages?${query.toString()}`;
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

async function deleteIncompletePetParentAction(formData: FormData) {
  "use server";

  const customerId = String(formData.get("customerId") || "");

  if (!isUuid(customerId)) {
    redirect("/admin/customers?cleanup=invalid-id");
  }

  const [profile, authUser, bookings, pets, sentMessages, receivedMessages] = await Promise.all([
    getProfileByLookupKey(customerId),
    getAuthUserById(customerId),
    safeSelect("bookings", "id,total_customer_paid,customer_total_amount,total_amount,amount,price,subtotal,service_total,total_paid", (query) =>
      query.or(buildRelatedIdFilters(customerId)),
    ),
    safeSelect("pets", "id", (query) =>
      query.or(buildPetIdFilters(customerId)),
    ),
    safeSelect("messages", "id", (query) =>
      query.or(buildMessageSenderFilters(customerId)),
    ),
    safeSelect("messages", "id", (query) =>
      query.or(buildMessageRecipientFilters(customerId)),
    ),
  ]);

  const paidBookings = bookings.filter((booking) => getBookingAmount(booking) > 0).length;
  const messages = [...sentMessages, ...receivedMessages];
  const verifiedFields = getVerifiedFields(profile, authUser);

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
          query.or(buildRelatedIdFilters(relatedCustomerId)).order("created_at", { ascending: false }),
        ),
        safeSelect("pets", "*", (query) =>
          query.or(buildPetIdFilters(relatedCustomerId)).order("created_at", { ascending: false }),
        ),
        safeSelect("messages", "*", (query) =>
          query.or(buildMessageSenderFilters(relatedCustomerId)).order("created_at", { ascending: false }),
        ),
        safeSelect("messages", "*", (query) =>
          query.or(buildMessageRecipientFilters(relatedCustomerId)).order("created_at", { ascending: false }),
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
  const customerDirectMessageHref = buildCustomerDirectMessageHref({
    customerId: relatedCustomerId || (isUuid(lookupKey) ? lookupKey : ""),
    name,
    email,
    phone,
  });
  const customerMessageSearchHref = `/admin/messages?q=${encodeURIComponent(
    name || email || phone || relatedCustomerId || lookupKey,
  )}`;
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
    getAuthProvider(authUser) === "Unknown" ? "sitguru" : getAuthProvider(authUser),
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
  const riskAssessment = getSignupRiskAssessment({
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
            <h1 className="text-3xl font-black">Pet Parent record not available</h1>
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
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/customers"
              className="inline-flex items-center gap-2 text-sm font-extrabold text-emerald-800 hover:text-emerald-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Pet Parents
            </Link>

            <Link
              href="/admin/customer-intelligence"
              className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-600 hover:text-slate-950"
            >
              Back to Customer Intelligence
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
                  Full SitGuru Pet Parent profile with Supabase Auth identity,
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
                    Auth: {authUser ? "Found" : "Missing"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    Profile: {profile ? "Found" : "Missing"}
                  </span>
                  <span className="break-all rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    ID: {relatedCustomerId || lookupKey}
                  </span>
                  <span className={["rounded-full border px-3 py-1 text-xs font-black", statusStyles.badge].join(" ")}>
                    {verification.label}
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
                href={customerMessageSearchHref}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-800 shadow-sm hover:bg-emerald-50"
              >
                <MessageSquare className="h-4 w-4" />
                View Messages
              </Link>

              <Link
                href={customerDirectMessageHref}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-emerald-800"
              >
                <MessageSquare className="h-4 w-4" />
                Start Message
              </Link>
            </div>
          </div>
        </div>

        {!profile && authUser ? (
          <div className="mt-5 rounded-[2rem] border border-amber-100 bg-amber-50 p-5 shadow-sm">
            <h2 className="text-2xl font-black">Profile row is missing or incomplete</h2>
            <p className="mt-2 text-sm font-semibold text-amber-900">
              The Supabase Auth user was found, so this is a real signup record.
              However, there is no matching `profiles` row yet. The page is
              showing the Auth name, email, provider, created date, confirmation,
              and sign-in details so Super Admin can still review the Pet Parent.
            </p>
          </div>
        ) : null}

        {riskAssessment.likelyTestOrSpam || riskAssessment.needsReview ? (
          <div className="mt-5 rounded-[2rem] border border-orange-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-700">
                  Super Admin Signup Quality Review
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Do not treat this as a completed Pet Parent yet
                </h2>
                <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
                  The account exists in Supabase, but the profile does not have the normal trust signals for a completed SitGuru Pet Parent. Keep it in review, archive it, or clean it up after confirming it is not a real person.
                </p>
              </div>

              <div className="rounded-3xl border border-orange-100 bg-orange-50 p-4 lg:min-w-[280px]">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-700">
                  Display name source
                </p>
                <p className="mt-1 text-sm font-black text-orange-950">
                  {riskAssessment.displayNameSource}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {riskAssessment.suspiciousReasons.map((reason) => (
                <div
                  key={reason}
                  className="rounded-2xl border border-orange-100 bg-orange-50 px-3 py-2 text-xs font-black text-orange-900"
                >
                  {reason}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <section className={["mt-5 rounded-[2rem] border p-5 shadow-sm", statusStyles.card].join(" ")}>
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex gap-4">
              <div className={["flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", statusStyles.icon].join(" ")}>
                {verification.status === "verified" || verification.status === "active" ? (
                  <ShieldCheck className="h-6 w-6" />
                ) : verification.status === "pending" || verification.status === "needs_review" ? (
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
                Hard delete is only enabled for records with no contact info, no
                pets, no bookings, no messages, and no verified auth contact.
                Real Pet Parents should be kept or reviewed manually.
              </p>

              {safeToDelete && relatedCustomerId ? (
                <form action={deleteIncompletePetParentAction} className="mt-4">
                  <input type="hidden" name="customerId" value={relatedCustomerId} />
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
                    Delete is locked because this record has contact data, auth
                    data, or activity. Keep it for review unless you add a
                    separate archive workflow.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={<CircleDollarSign className="h-5 w-5" />}
            label="Lifetime Spend"
            value={formatMoney(totalSpend)}
            detail={`${paidBookings} paid bookings`}
          />

          <SummaryCard
            icon={<CalendarDays className="h-5 w-5" />}
            label="Bookings"
            value={String(bookings.length)}
            detail={`Avg. ${formatMoney(averageBookingValue)}`}
          />

          <SummaryCard
            icon={<PawPrint className="h-5 w-5" />}
            label="Pets"
            value={String(pets.length)}
            detail="Live pet profile records"
          />

          <SummaryCard
            icon={<MessageSquare className="h-5 w-5" />}
            label="Messages"
            value={String(messages.length)}
            detail="Sent and received messages"
          />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-black">Pet Parent Profile</h2>

            <div className="mt-5 space-y-3">
              <ProfileInfoRow
                icon={<UserRound className="mt-0.5 h-5 w-5 text-emerald-700" />}
                label="Display Name"
                value={name}
                detail={`Source: ${riskAssessment.displayNameSource}`}
              />

              <ProfileInfoRow
                icon={<UserRound className="mt-0.5 h-5 w-5 text-emerald-700" />}
                label="Raw Signup Name"
                value={riskAssessment.rawName}
                detail={
                  isTrustworthyDisplayName(riskAssessment.rawName)
                    ? "Looks usable"
                    : "Needs review before treating as a real name"
                }
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
                <ProfileMiniBox label="Auth Created" value={formatDate(authUser?.created_at)} />
                <ProfileMiniBox label="Profile Created" value={formatDate(profile?.created_at)} />
                <ProfileMiniBox label="Profile Updated" value={formatDate(profile?.updated_at)} />
                <ProfileMiniBox label="Last Sign In" value={formatDateTime(verifiedFields.lastSignInAt)} />
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
                    {check.detail}
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
            <ProfileMiniBox label="Lookup Value" value={lookupKey} />
            <ProfileMiniBox label="Resolved ID" value={relatedCustomerId || "—"} />
            <ProfileMiniBox label="Profile row found" value={profile ? "Yes" : "No"} />
            <ProfileMiniBox label="Auth user found" value={authUser ? "Yes" : "No"} />
            <ProfileMiniBox label="Auth email" value={getText(authUser, ["email"], "—")} />
            <ProfileMiniBox label="Email confirmed" value={verifiedFields.emailConfirmedAt ? formatDateTime(verifiedFields.emailConfirmedAt) : "No"} />
            <ProfileMiniBox label="Phone confirmed" value={verifiedFields.phoneConfirmedAt ? formatDateTime(verifiedFields.phoneConfirmedAt) : "No"} />
            <ProfileMiniBox label="Provider" value={getAuthProvider(authUser)} />
            <ProfileMiniBox label="Auth created" value={formatDateTime(authUser?.created_at)} />
            <ProfileMiniBox label="Profile created" value={formatDateTime(profile?.created_at)} />
            <ProfileMiniBox label="Profile updated" value={formatDateTime(profile?.updated_at)} />
            <ProfileMiniBox label="Last sign in" value={formatDateTime(verifiedFields.lastSignInAt)} />
          </div>
        </section>
      </section>
    </main>
  );
}

function SummaryCard({
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
    <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
        {icon}
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-600">{detail}</p>
    </div>
  );
}

function ProfileInfoRow({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
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