import type { ReactNode } from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Database,
  Eye,
  Mail,
  PawPrint,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type AdminStatus =
  | "active"
  | "needs_review"
  | "incomplete_signup"
  | "likely_spam"
  | "archived";

type ArchiveCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  adminStatus: AdminStatus;
  adminNotes: string;
  archivedAt: string;
  createdAt: string;
  updatedAt: string;
  source: string;
  bookingCount: number;
  paidBookingCount: number;
  petCount: number;
  messageCount: number;
  totalSpend: number;
  emailConfirmed: boolean;
  phoneConfirmed: boolean;
  safeToDelete: boolean;
  deleteBlockReasons: string[];
};

const archiveStatuses: AdminStatus[] = [
  "archived",
  "likely_spam",
  "incomplete_signup",
  "needs_review",
];

const statusSections: {
  status: AdminStatus;
  title: string;
  description: string;
  tone: string;
  icon: ReactNode;
}[] = [
  {
    status: "likely_spam",
    title: "Likely Spam",
    description:
      "Suspicious signups that should not count toward active Pet Parent stats.",
    tone: "border-rose-200 bg-rose-50 text-rose-950",
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  {
    status: "archived",
    title: "Archived",
    description:
      "Records hidden from the active Pet Parent registry but preserved for audit history.",
    tone: "border-slate-200 bg-slate-50 text-slate-950",
    icon: <Archive className="h-5 w-5" />,
  },
  {
    status: "incomplete_signup",
    title: "Incomplete Signups",
    description:
      "People who started signup but have not completed enough setup to count as real Pet Parents.",
    tone: "border-orange-200 bg-orange-50 text-orange-950",
    icon: <Clock3 className="h-5 w-5" />,
  },
  {
    status: "needs_review",
    title: "Needs Review",
    description:
      "Potentially real Pet Parents that need admin review before being treated as complete.",
    tone: "border-amber-200 bg-amber-50 text-amber-950",
    icon: <Eye className="h-5 w-5" />,
  },
];

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

function normalizeAdminStatus(value: unknown): AdminStatus {
  const normalized = asString(value).toLowerCase();

  if (
    normalized === "needs_review" ||
    normalized === "incomplete_signup" ||
    normalized === "likely_spam" ||
    normalized === "archived"
  ) {
    return normalized;
  }

  if (
    normalized === "spam" ||
    normalized === "likely_test_spam" ||
    normalized === "test_spam" ||
    normalized === "blocked"
  ) {
    return "likely_spam";
  }

  if (normalized === "hidden" || normalized === "inactive") {
    return "archived";
  }

  return "active";
}

function getAdminStatusLabel(status: AdminStatus) {
  if (status === "needs_review") return "Needs Review";
  if (status === "incomplete_signup") return "Incomplete Signup";
  if (status === "likely_spam") return "Likely Spam";
  if (status === "archived") return "Archived";

  return "Active";
}

function getAdminStatusBadgeClasses(status: AdminStatus) {
  if (status === "needs_review") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "incomplete_signup") return "border-orange-200 bg-orange-50 text-orange-800";
  if (status === "likely_spam") return "border-rose-200 bg-rose-50 text-rose-800";
  if (status === "archived") return "border-slate-200 bg-slate-100 text-slate-800";

  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function getAdminStatusIcon(status: AdminStatus) {
  if (status === "archived") return <Archive className="h-4 w-4" />;
  if (status === "active") return <RotateCcw className="h-4 w-4" />;

  return <AlertTriangle className="h-4 w-4" />;
}

function getRawDisplayName(row: AnyRow | null | undefined) {
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
    ],
    "",
  );
}

function getDisplayName(row: AnyRow | null | undefined) {
  const rawName = getRawDisplayName(row);
  if (rawName) return rawName;

  return getText(row, ["email", "customer_email", "pet_parent_email"], "Signup Review");
}

function getEmail(row: AnyRow | null | undefined) {
  return getText(row, ["email", "customer_email", "pet_parent_email"], "No email found");
}

function getPhone(row: AnyRow | null | undefined) {
  return getText(row, ["phone", "phone_number", "mobile", "mobile_phone"], "No phone found");
}

function getSource(row: AnyRow | null | undefined) {
  return getText(
    row,
    [
      "source",
      "signup_source",
      "referral_source",
      "lead_source",
      "acquisition_source",
      "utm_source",
      "provider",
    ],
    "sitguru",
  );
}

function getInitials(name: string) {
  const parts = name
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);

  const firstInitial = parts[0]?.charAt(0) || "P";
  const secondInitial = parts[1]?.charAt(0) || "";

  return `${firstInitial}${secondInitial}`.toUpperCase();
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

function getCustomerIdFromBooking(row: AnyRow) {
  return getText(row, ["customer_id", "pet_owner_id", "user_id", "pet_parent_id"]);
}

function getPetOwnerId(row: AnyRow) {
  return getText(row, [
    "owner_profile_id",
    "owner_id",
    "customer_id",
    "pet_parent_id",
    "user_id",
  ]);
}

function getMessageParticipantIds(row: AnyRow) {
  return [
    getText(row, ["sender_id"]),
    getText(row, ["from_user_id"]),
    getText(row, ["recipient_id"]),
    getText(row, ["to_user_id"]),
    getText(row, ["customer_id"]),
    getText(row, ["user_id"]),
  ].filter(Boolean);
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

async function safeAdminQuery(
  query: PromiseLike<{ data: unknown; error: unknown }>,
  label: string,
) {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Admin archive query skipped for ${label}:`, result.error);
      return [] as AnyRow[];
    }

    return Array.isArray(result.data) ? (result.data as AnyRow[]) : [];
  } catch (error) {
    console.warn(`Admin archive query skipped for ${label}:`, error);
    return [] as AnyRow[];
  }
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

function getVerifiedFields(authUser: AnyRow | null) {
  const emailConfirmedAt = getText(authUser, ["email_confirmed_at", "confirmed_at"]);
  const phoneConfirmedAt = getText(authUser, ["phone_confirmed_at"]);

  return {
    emailConfirmedAt,
    phoneConfirmedAt,
    hasConfirmedEmail: Boolean(emailConfirmedAt),
    hasConfirmedPhone: Boolean(phoneConfirmedAt),
  };
}

function getSafeDeleteState({
  bookingCount,
  paidBookingCount,
  petCount,
  messageCount,
  emailConfirmed,
  phoneConfirmed,
}: {
  bookingCount: number;
  paidBookingCount: number;
  petCount: number;
  messageCount: number;
  emailConfirmed: boolean;
  phoneConfirmed: boolean;
}) {
  const blockReasons: string[] = [];

  if (bookingCount > 0) blockReasons.push("booking history exists");
  if (paidBookingCount > 0) blockReasons.push("paid booking history exists");
  if (petCount > 0) blockReasons.push("pet profile exists");
  if (messageCount > 0) blockReasons.push("message activity exists");
  if (emailConfirmed) blockReasons.push("email is verified");
  if (phoneConfirmed) blockReasons.push("phone is verified");

  return {
    safeToDelete: blockReasons.length === 0,
    deleteBlockReasons: blockReasons,
  };
}

async function updatePetParentArchiveStatusAction(formData: FormData) {
  "use server";

  const customerId = String(formData.get("customerId") || "").trim();
  const requestedStatus = String(formData.get("adminStatus") || "").trim();
  const adminNotes = String(formData.get("adminNotes") || "").trim();

  const allowedStatuses: AdminStatus[] = [
    "active",
    "needs_review",
    "incomplete_signup",
    "likely_spam",
    "archived",
  ];

  if (!isUuid(customerId)) {
    redirect("/admin/customers/archive?status=invalid-id");
  }

  if (!allowedStatuses.includes(requestedStatus as AdminStatus)) {
    redirect("/admin/customers/archive?status=invalid-status");
  }

  const now = new Date().toISOString();
  const adminStatus = requestedStatus as AdminStatus;

  const updatePayload: AnyRow = {
    admin_status: adminStatus,
    admin_notes: adminNotes || null,
    archived_at: adminStatus === "archived" ? now : null,
    updated_at: now,
  };

  const { error } = await supabaseAdmin
    .from("profiles")
    .update(updatePayload)
    .eq("id", customerId);

  if (error) {
    console.warn("Could not update Pet Parent archive status:", error);
    redirect("/admin/customers/archive?status=update-failed");
  }

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/customers/archive");
  revalidatePath("/admin/customer-intelligence");

  redirect("/admin/customers/archive?status=updated");
}

async function permanentlyDeleteArchivedPetParentAction(formData: FormData) {
  "use server";

  const customerId = String(formData.get("customerId") || "").trim();

  if (!isUuid(customerId)) {
    redirect("/admin/customers/archive?delete=invalid-id");
  }

  const [authUser, bookings, pets, sentMessages, receivedMessages] = await Promise.all([
    getAuthUserById(customerId),
    safeSelect(
      "bookings",
      "id,total_customer_paid,customer_total_amount,total_amount,amount,price,subtotal,service_total,total_paid",
      (query) => query.or(buildRelatedIdFilters(customerId)),
    ),
    safeSelect("pets", "id", (query) => query.or(buildPetIdFilters(customerId))),
    safeSelect("messages", "id", (query) =>
      query.or(buildMessageSenderFilters(customerId)),
    ),
    safeSelect("messages", "id", (query) =>
      query.or(buildMessageRecipientFilters(customerId)),
    ),
  ]);

  const messages = [...sentMessages, ...receivedMessages];
  const paidBookingCount = bookings.filter((booking) => getBookingAmount(booking) > 0).length;
  const verified = getVerifiedFields(authUser);
  const deleteState = getSafeDeleteState({
    bookingCount: bookings.length,
    paidBookingCount,
    petCount: pets.length,
    messageCount: messages.length,
    emailConfirmed: verified.hasConfirmedEmail,
    phoneConfirmed: verified.hasConfirmedPhone,
  });

  if (!deleteState.safeToDelete) {
    redirect("/admin/customers/archive?delete=blocked");
  }

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .delete()
    .eq("id", customerId);

  if (profileError) {
    console.warn("Could not permanently delete archived Pet Parent profile:", profileError);
    redirect("/admin/customers/archive?delete=profile-failed");
  }

  if (authUser) {
    try {
      await supabaseAdmin.auth.admin.deleteUser(customerId);
    } catch (error) {
      console.warn("Profile deleted, but Auth user could not be deleted:", error);
      redirect("/admin/customers/archive?delete=auth-failed-profile-deleted");
    }
  }

  revalidatePath("/admin/customers");
  revalidatePath("/admin/customers/archive");
  revalidatePath("/admin/customer-intelligence");

  redirect("/admin/customers/archive?delete=permanently-deleted");
}

async function getArchiveCustomers() {
  const [profiles, bookings, pets, messages] = await Promise.all([
    safeAdminQuery(
      supabaseAdmin
        .from("profiles")
        .select("*")
        .or(
          "admin_status.in.(archived,likely_spam,incomplete_signup,needs_review),archived_at.not.is.null",
        )
        .order("updated_at", { ascending: false })
        .limit(1000),
      "profiles archive rows",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000),
      "bookings",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("pets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000),
      "pets",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000),
      "messages",
    ),
  ]);

  const bookingCountByCustomerId = new Map<string, number>();
  const paidBookingCountByCustomerId = new Map<string, number>();
  const spendByCustomerId = new Map<string, number>();
  const petCountByCustomerId = new Map<string, number>();
  const messageCountByCustomerId = new Map<string, number>();

  for (const booking of bookings) {
    const customerId = getCustomerIdFromBooking(booking);
    if (!customerId) continue;

    const amount = getBookingAmount(booking);
    bookingCountByCustomerId.set(customerId, (bookingCountByCustomerId.get(customerId) || 0) + 1);
    spendByCustomerId.set(customerId, (spendByCustomerId.get(customerId) || 0) + amount);

    if (amount > 0) {
      paidBookingCountByCustomerId.set(
        customerId,
        (paidBookingCountByCustomerId.get(customerId) || 0) + 1,
      );
    }
  }

  for (const pet of pets) {
    const ownerId = getPetOwnerId(pet);
    if (!ownerId) continue;

    petCountByCustomerId.set(ownerId, (petCountByCustomerId.get(ownerId) || 0) + 1);
  }

  for (const message of messages) {
    for (const participantId of getMessageParticipantIds(message)) {
      messageCountByCustomerId.set(
        participantId,
        (messageCountByCustomerId.get(participantId) || 0) + 1,
      );
    }
  }

  const rows: ArchiveCustomer[] = [];

  for (const profile of profiles) {
    const id = getText(profile, ["id"]);
    if (!id) continue;

    const adminStatus = normalizeAdminStatus(profile.admin_status || (profile.archived_at ? "archived" : "needs_review"));
    const bookingCount = bookingCountByCustomerId.get(id) || 0;
    const paidBookingCount = paidBookingCountByCustomerId.get(id) || 0;
    const petCount = petCountByCustomerId.get(id) || 0;
    const messageCount = messageCountByCustomerId.get(id) || 0;
    const totalSpend = spendByCustomerId.get(id) || 0;
    const authUser = await getAuthUserById(id);
    const verified = getVerifiedFields(authUser);
    const deleteState = getSafeDeleteState({
      bookingCount,
      paidBookingCount,
      petCount,
      messageCount,
      emailConfirmed: verified.hasConfirmedEmail,
      phoneConfirmed: verified.hasConfirmedPhone,
    });

    rows.push({
      id,
      name: getDisplayName(profile),
      email: getEmail(profile),
      phone: getPhone(profile),
      adminStatus,
      adminNotes: getText(profile, ["admin_notes"]),
      archivedAt: getText(profile, ["archived_at"]),
      createdAt: getText(profile, ["created_at"]),
      updatedAt: getText(profile, ["updated_at"]),
      source: getSource(profile),
      bookingCount,
      paidBookingCount,
      petCount,
      messageCount,
      totalSpend,
      emailConfirmed: verified.hasConfirmedEmail,
      phoneConfirmed: verified.hasConfirmedPhone,
      safeToDelete: deleteState.safeToDelete,
      deleteBlockReasons: deleteState.deleteBlockReasons,
    });
  }

  return rows;
}

export default async function AdminCustomerArchivePage() {
  const customers = await getArchiveCustomers();

  const likelySpamCount = customers.filter((row) => row.adminStatus === "likely_spam").length;
  const archivedCount = customers.filter((row) => row.adminStatus === "archived").length;
  const incompleteCount = customers.filter((row) => row.adminStatus === "incomplete_signup").length;
  const needsReviewCount = customers.filter((row) => row.adminStatus === "needs_review").length;
  const safeDeleteCount = customers.filter((row) => row.safeToDelete).length;

  return (
    <main className="min-h-screen bg-[#f7fbf7] px-4 py-6 text-[#062f2b] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-5">
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
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">
                Super Admin / Pet Parent Cleanup
              </p>
              <h1 className="mt-1 text-4xl font-black tracking-tight sm:text-5xl">
                Archive & Spam Manager
              </h1>
              <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-700">
                Separate archived, likely spam, incomplete, and review-needed
                signups from real Pet Parent stats. Restore valid users or
                permanently delete only records with no protected customer data.
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 lg:min-w-[310px]">
              <p className="flex items-center gap-2 text-sm font-black text-emerald-950">
                <ShieldCheck className="h-4 w-4" />
                Protected delete rule
              </p>
              <p className="mt-2 text-xs font-semibold leading-5 text-emerald-900">
                Permanent delete is enabled only when there are no bookings,
                paid bookings, pets, messages, verified email, or verified phone.
              </p>
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            icon={<AlertTriangle className="h-5 w-5" />}
            label="Likely Spam"
            value={String(likelySpamCount)}
            detail="Excluded from active stats"
          />
          <SummaryCard
            icon={<Archive className="h-5 w-5" />}
            label="Archived"
            value={String(archivedCount)}
            detail="Hidden from registry"
          />
          <SummaryCard
            icon={<Clock3 className="h-5 w-5" />}
            label="Incomplete"
            value={String(incompleteCount)}
            detail="Signup not complete"
          />
          <SummaryCard
            icon={<Eye className="h-5 w-5" />}
            label="Needs Review"
            value={String(needsReviewCount)}
            detail="Possible real users"
          />
          <SummaryCard
            icon={<Trash2 className="h-5 w-5" />}
            label="Safe Delete"
            value={String(safeDeleteCount)}
            detail="No protected activity"
          />
        </section>

        {customers.length === 0 ? (
          <section className="rounded-[2rem] border border-dashed border-emerald-200 bg-white p-8 text-center shadow-sm">
            <Archive className="mx-auto h-10 w-10 text-emerald-700" />
            <h2 className="mt-4 text-2xl font-black text-slate-950">
              No archived or spam Pet Parent records yet
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              Records marked likely spam, archived, incomplete signup, or needs
              review will appear here for cleanup.
            </p>
          </section>
        ) : null}

        {statusSections.map((section) => {
          const rows = customers.filter((customer) => customer.adminStatus === section.status);

          if (rows.length === 0) return null;

          return (
            <section
              key={section.status}
              className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm"
            >
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div
                    className={[
                      "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-black",
                      section.tone,
                    ].join(" ")}
                  >
                    {section.icon}
                    {section.title}
                  </div>
                  <h2 className="mt-3 text-2xl font-black text-slate-950">
                    {section.title} Records
                  </h2>
                  <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                    {section.description}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-800">
                  {rows.length} record{rows.length === 1 ? "" : "s"}
                </div>
              </div>

              <div className="space-y-3">
                {rows.map((customer) => (
                  <ArchiveCustomerCard key={customer.id} customer={customer} />
                ))}
              </div>
            </section>
          );
        })}
      </section>
    </main>
  );
}

function ArchiveCustomerCard({ customer }: { customer: ArchiveCustomer }) {
  return (
    <article className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-4 shadow-sm">
      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr_1fr_1.35fr] xl:items-start">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-800 text-sm font-black text-white">
            {getInitials(customer.name)}
          </div>

          <div className="min-w-0">
            <p className="truncate text-lg font-black text-slate-950">
              {customer.name}
            </p>
            <p className="truncate text-xs font-bold text-slate-500">
              {customer.email}
            </p>
            <p className="mt-1 truncate text-xs font-bold text-slate-500">
              Source: {customer.source}
            </p>
            <span
              className={[
                "mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black",
                getAdminStatusBadgeClasses(customer.adminStatus),
              ].join(" ")}
            >
              {getAdminStatusIcon(customer.adminStatus)}
              {getAdminStatusLabel(customer.adminStatus)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-black text-slate-700 sm:grid-cols-4 xl:grid-cols-2">
          <MetricBox label="Spend" value={formatMoney(customer.totalSpend)} />
          <MetricBox label="Bookings" value={String(customer.bookingCount)} />
          <MetricBox label="Pets" value={String(customer.petCount)} />
          <MetricBox label="Messages" value={String(customer.messageCount)} />
        </div>

        <div className="space-y-2 text-xs font-bold text-slate-600">
          <InfoLine label="Phone" value={customer.phone} />
          <InfoLine
            label="Verified email"
            value={customer.emailConfirmed ? "Yes" : "No"}
          />
          <InfoLine
            label="Verified phone"
            value={customer.phoneConfirmed ? "Yes" : "No"}
          />
          <InfoLine label="Archived" value={formatDateTime(customer.archivedAt)} />
          <InfoLine label="Updated" value={formatDateTime(customer.updatedAt)} />
          {customer.adminNotes ? (
            <p className="rounded-2xl bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-600">
              Notes: {customer.adminNotes}
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            <Link
              href={`/admin/customers/${encodeURIComponent(customer.id)}`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
            >
              <Database className="h-4 w-4" />
              Admin Record
            </Link>

            <form action={updatePetParentArchiveStatusAction}>
              <input type="hidden" name="customerId" value={customer.id} />
              <input type="hidden" name="adminStatus" value="active" />
              <input
                type="hidden"
                name="adminNotes"
                value="Restored to active from Archive & Spam Manager."
              />
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800 shadow-sm transition hover:bg-emerald-100"
              >
                <RotateCcw className="h-4 w-4" />
                Restore Active
              </button>
            </form>

            <form action={updatePetParentArchiveStatusAction}>
              <input type="hidden" name="customerId" value={customer.id} />
              <input type="hidden" name="adminStatus" value="likely_spam" />
              <input
                type="hidden"
                name="adminNotes"
                value="Marked likely spam from Archive & Spam Manager."
              />
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-800 shadow-sm transition hover:bg-rose-100"
              >
                <AlertTriangle className="h-4 w-4" />
                Mark Spam
              </button>
            </form>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <form action={updatePetParentArchiveStatusAction}>
              <input type="hidden" name="customerId" value={customer.id} />
              <input type="hidden" name="adminStatus" value="archived" />
              <input
                type="hidden"
                name="adminNotes"
                value="Archived from Archive & Spam Manager."
              />
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800 shadow-sm transition hover:bg-slate-100"
              >
                <Archive className="h-4 w-4" />
                Archive
              </button>
            </form>

            {customer.safeToDelete ? (
              <form action={permanentlyDeleteArchivedPetParentAction}>
                <input type="hidden" name="customerId" value={customer.id} />
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-700 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-rose-800"
                >
                  <Trash2 className="h-4 w-4" />
                  Permanent Delete
                </button>
              </form>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-600">
                <span className="inline-flex items-center gap-1 font-black text-slate-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  Delete locked
                </span>
                <span className="mt-1 block">
                  {customer.deleteBlockReasons.join(", ") || "Protected record"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
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

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl bg-white px-3 py-2">
      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </span>
      <span className="max-w-[180px] break-words text-right text-xs font-black text-slate-700">
        {value || "—"}
      </span>
    </div>
  );
}
