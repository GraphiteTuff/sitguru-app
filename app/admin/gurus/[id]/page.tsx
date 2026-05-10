import type { ReactNode } from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    saved?: string;
    error?: string;
  }>;
};

type GuruRow = Record<string, unknown>;
type ProfileRow = Record<string, unknown>;

type ApplicationStatus =
  | "new"
  | "reviewing"
  | "needs_info"
  | "pre_approved"
  | "verification_pending"
  | "approved"
  | "bookable"
  | "rejected"
  | "suspended";

type AdminAction =
  | "reviewing"
  | "needs_info"
  | "pre_approved"
  | "verification_pending"
  | "approved"
  | "bookable"
  | "rejected"
  | "suspended";

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "yes" || normalized === "1";
  }

  return Boolean(value);
}

function formatDate(value?: unknown) {
  const raw = asTrimmedString(value);

  if (!raw) return "—";

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortDate(value?: unknown) {
  const raw = asTrimmedString(value);

  if (!raw) return "—";

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getMissingColumnFromError(message?: string) {
  if (!message) return "";

  const match = message.match(/Could not find the '([^']+)' column/i);
  return match?.[1] || "";
}

async function updateWithColumnFallback({
  table,
  idColumn,
  idValue,
  payload,
  requiredColumns = [],
}: {
  table: string;
  idColumn: string;
  idValue: string;
  payload: Record<string, unknown>;
  requiredColumns?: string[];
}) {
  const workingPayload = { ...payload };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const { error } = await supabaseAdmin
      .from(table)
      .update(workingPayload)
      .eq(idColumn, idValue);

    if (!error) {
      if (removedColumns.length > 0) {
        console.warn(
          `${table} update succeeded after removing missing optional columns:`,
          removedColumns,
        );
      }

      return null;
    }

    const missingColumn = getMissingColumnFromError(error.message);

    if (
      missingColumn &&
      Object.prototype.hasOwnProperty.call(workingPayload, missingColumn) &&
      !requiredColumns.includes(missingColumn)
    ) {
      delete workingPayload[missingColumn];
      removedColumns.push(missingColumn);
      continue;
    }

    return error;
  }

  return {
    message: `Unable to update ${table} record after removing optional missing columns.`,
  };
}

async function insertEventSafely(payload: Record<string, unknown>) {
  try {
    const { error } = await supabaseAdmin
      .from("guru_application_events")
      .insert(payload);

    if (error) {
      console.warn("Guru application event insert skipped:", error);
    }
  } catch (error) {
    console.warn("Guru application event insert skipped:", error);
  }
}

function normalizeApplicationStatus(guru: GuruRow): ApplicationStatus {
  const rawStatus = (
    asTrimmedString(guru.application_status) ||
    asTrimmedString(guru.approval_status) ||
    asTrimmedString(guru.status)
  ).toLowerCase();

  if (rawStatus === "bookable" || toBoolean(guru.is_bookable)) {
    return "bookable";
  }

  if (rawStatus === "active") return "bookable";
  if (rawStatus === "approved") return "approved";
  if (rawStatus === "verification_pending") return "verification_pending";
  if (rawStatus === "pre_approved" || rawStatus === "pre-approved") {
    return "pre_approved";
  }
  if (rawStatus === "needs_info" || rawStatus === "needs-info") {
    return "needs_info";
  }
  if (rawStatus === "reviewing") return "reviewing";
  if (rawStatus === "rejected") return "rejected";
  if (rawStatus === "suspended") return "suspended";
  if (rawStatus === "paused") return "suspended";
  if (rawStatus === "new") return "new";
  if (rawStatus === "pending") return "new";

  return "new";
}

function getApplicationStatusLabel(status: ApplicationStatus) {
  switch (status) {
    case "new":
      return "Application Received";
    case "reviewing":
      return "Profile Under Review";
    case "needs_info":
      return "More Info Needed";
    case "pre_approved":
      return "Pre-Approved";
    case "verification_pending":
      return "Verification Needed";
    case "approved":
      return "Approved";
    case "bookable":
      return "Bookable";
    case "rejected":
      return "Not Approved";
    case "suspended":
      return "Paused";
    default:
      return "Application Received";
  }
}

function statusClasses(status: ApplicationStatus) {
  switch (status) {
    case "bookable":
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "pre_approved":
    case "verification_pending":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "reviewing":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "needs_info":
    case "new":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "rejected":
    case "suspended":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getCredentialStatus(value: unknown) {
  const normalized = asTrimmedString(value).toLowerCase();

  if (!normalized) return "Not Started";
  if (normalized === "not_started") return "Not Started";
  if (normalized === "in_progress") return "In Progress";
  if (normalized === "pending") return "Pending";
  if (normalized === "verified") return "Verified";
  if (normalized === "clear") return "Clear";
  if (normalized === "cleared") return "Cleared";
  if (normalized === "approved") return "Approved";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "failed") return "Failed";

  return normalized
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function credentialClasses(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized === "verified" ||
    normalized === "clear" ||
    normalized === "cleared" ||
    normalized === "approved"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "pending" || normalized === "in progress") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (normalized === "rejected" || normalized === "failed") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getGuruId(guru: GuruRow) {
  return (
    asTrimmedString(guru.id) ||
    asTrimmedString(guru.user_id) ||
    asTrimmedString(guru.profile_id) ||
    asTrimmedString(guru.email).toLowerCase()
  );
}

function getGuruUserId(guru: GuruRow) {
  return asTrimmedString(guru.user_id) || asTrimmedString(guru.profile_id);
}

function getGuruName(guru: GuruRow, profile?: ProfileRow | null) {
  return (
    asTrimmedString(guru.display_name) ||
    asTrimmedString(guru.full_name) ||
    asTrimmedString(guru.name) ||
    asTrimmedString(profile?.display_name) ||
    asTrimmedString(profile?.full_name) ||
    asTrimmedString(profile?.name) ||
    asTrimmedString(guru.email).split("@")[0] ||
    asTrimmedString(profile?.email).split("@")[0] ||
    "Guru"
  );
}

function getGuruEmail(guru: GuruRow, profile?: ProfileRow | null) {
  return asTrimmedString(guru.email) || asTrimmedString(profile?.email) || "—";
}

function getGuruPhone(guru: GuruRow, profile?: ProfileRow | null) {
  return (
    asTrimmedString(guru.phone) ||
    asTrimmedString(guru.phone_number) ||
    asTrimmedString(profile?.phone) ||
    asTrimmedString(profile?.phone_number) ||
    "—"
  );
}

function getGuruLocation(guru: GuruRow, profile?: ProfileRow | null) {
  const city =
    asTrimmedString(guru.city) ||
    asTrimmedString(profile?.city) ||
    asTrimmedString(guru.service_city);

  const state =
    asTrimmedString(guru.state) ||
    asTrimmedString(profile?.state) ||
    asTrimmedString(guru.service_state) ||
    asTrimmedString(guru.state_code) ||
    asTrimmedString(profile?.state_code);

  return [city, state].filter(Boolean).join(", ") || "Location not listed";
}

function getGuruServices(guru: GuruRow) {
  const services = guru.services;

  if (Array.isArray(services) && services.length > 0) {
    return services
      .map((service) => String(service).trim())
      .filter(Boolean)
      .slice(0, 6);
  }

  const fallback =
    asTrimmedString(guru.service) ||
    asTrimmedString(guru.service_name) ||
    asTrimmedString(guru.specialty) ||
    asTrimmedString(guru.title) ||
    "Pet Care";

  return [fallback];
}

function getGuruExperience(guru: GuruRow) {
  const years =
    toNumber(guru.experience_years) ||
    toNumber(guru.years_experience) ||
    toNumber(guru.years_of_experience);

  if (years > 0) {
    return `${years} year${years === 1 ? "" : "s"}`;
  }

  return "Not listed";
}

function getProfileCompletion(guru: GuruRow) {
  const direct = toNumber(guru.profile_completion);

  if (direct > 0) return Math.min(100, Math.max(0, direct));

  const checks = [
    Boolean(
      asTrimmedString(guru.display_name) ||
        asTrimmedString(guru.full_name) ||
        asTrimmedString(guru.name),
    ),
    Boolean(asTrimmedString(guru.bio)),
    Boolean(asTrimmedString(guru.city) || asTrimmedString(guru.state)),
    getGuruServices(guru).length > 0,
    Boolean(
      asTrimmedString(guru.avatar_url) ||
        asTrimmedString(guru.photo_url) ||
        asTrimmedString(guru.image_url) ||
        asTrimmedString(guru.profile_photo_url),
    ),
    toNumber(guru.hourly_rate) > 0 || toNumber(guru.price) > 0,
  ];

  const complete = checks.filter(Boolean).length;
  return Math.round((complete / checks.length) * 100);
}

function getPublicHref(guru: GuruRow) {
  const slug = asTrimmedString(guru.slug);
  return slug ? `/guru/${slug}` : "/search";
}

function getActionLabel(action: AdminAction) {
  switch (action) {
    case "reviewing":
      return "Start Review";
    case "needs_info":
      return "Request More Info";
    case "pre_approved":
      return "Pre-Approve";
    case "verification_pending":
      return "Start Verification";
    case "approved":
      return "Approve";
    case "bookable":
      return "Make Bookable";
    case "rejected":
      return "Reject";
    case "suspended":
      return "Suspend";
    default:
      return "Update";
  }
}

function getActionDescription(action: AdminAction) {
  switch (action) {
    case "reviewing":
      return "Moves this Guru into Admin review.";
    case "needs_info":
      return "Asks the Guru to update missing profile or application details.";
    case "pre_approved":
      return "Pre-approves the Guru before verification steps.";
    case "verification_pending":
      return "Moves the Guru into identity/background verification.";
    case "approved":
      return "Approves the Guru but does not make them visible yet.";
    case "bookable":
      return "Final switch. Makes Guru active and visible to customers.";
    case "rejected":
      return "Rejects this application and keeps it hidden.";
    case "suspended":
      return "Pauses the Guru and removes booking visibility.";
    default:
      return "Updates Guru application status.";
  }
}

function getActionButtonClasses(action: AdminAction) {
  if (action === "bookable") {
    return "bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700";
  }

  if (action === "rejected" || action === "suspended") {
    return "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100";
  }

  if (action === "approved" || action === "pre_approved") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
  }

  if (action === "verification_pending") {
    return "border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100";
  }

  return "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
}

function buildStatusPayload({
  action,
  adminUserId,
  note,
}: {
  action: AdminAction;
  adminUserId: string;
  note: string;
}) {
  const now = new Date().toISOString();

  const basePayload: Record<string, unknown> = {
    application_status: action,
    updated_at: now,
  };

  if (action === "reviewing") {
    return {
      ...basePayload,
      status: "pending",
      reviewed_by: adminUserId,
      reviewed_at: now,
      admin_notes: note || null,
    };
  }

  if (action === "needs_info") {
    return {
      ...basePayload,
      status: "pending",
      needs_info_message:
        note ||
        "Please complete missing profile details so SitGuru can continue your review.",
      admin_notes: note || null,
      is_bookable: false,
    };
  }

  if (action === "pre_approved") {
    return {
      ...basePayload,
      status: "pending",
      reviewed_by: adminUserId,
      reviewed_at: now,
      pre_approved_at: now,
      admin_notes: note || null,
      is_bookable: false,
    };
  }

  if (action === "verification_pending") {
    return {
      ...basePayload,
      status: "pending",
      reviewed_by: adminUserId,
      reviewed_at: now,
      admin_notes: note || null,
      is_bookable: false,
    };
  }

  if (action === "approved") {
    return {
      ...basePayload,
      status: "approved",
      reviewed_by: adminUserId,
      reviewed_at: now,
      approved_at: now,
      admin_notes: note || null,
      is_bookable: false,
    };
  }

  if (action === "bookable") {
    return {
      ...basePayload,
      status: "active",
      reviewed_by: adminUserId,
      reviewed_at: now,
      approved_at: now,
      bookable_at: now,
      admin_notes: note || null,
      is_bookable: true,
    };
  }

  if (action === "rejected") {
    return {
      ...basePayload,
      status: "rejected",
      reviewed_by: adminUserId,
      reviewed_at: now,
      rejected_at: now,
      rejection_reason: note || "Application was not approved by SitGuru.",
      admin_notes: note || null,
      is_bookable: false,
    };
  }

  if (action === "suspended") {
    return {
      ...basePayload,
      status: "suspended",
      reviewed_by: adminUserId,
      reviewed_at: now,
      admin_notes: note || null,
      is_bookable: false,
    };
  }

  return basePayload;
}

async function getGuruById(id: string) {
  const cleanId = decodeURIComponent(id).trim();

  if (!cleanId) return null;

  const queries = [
    supabaseAdmin.from("gurus").select("*").eq("id", cleanId).maybeSingle(),
    supabaseAdmin.from("gurus").select("*").eq("user_id", cleanId).maybeSingle(),
    supabaseAdmin.from("gurus").select("*").eq("email", cleanId).maybeSingle(),
  ];

  for (const query of queries) {
    try {
      const result = (await query) as SafeQueryResponse;

      if (!result.error && result.data) {
        return result.data as GuruRow;
      }
    } catch {
      // Keep trying fallback lookups.
    }
  }

  return null;
}

async function getProfileForGuru(guru: GuruRow) {
  const userId = asTrimmedString(guru.user_id) || asTrimmedString(guru.profile_id);
  const email = getGuruEmail(guru);

  const queries = [
    userId
      ? supabaseAdmin.from("profiles").select("*").eq("id", userId).maybeSingle()
      : null,
    userId
      ? supabaseAdmin
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle()
      : null,
    email && email !== "—"
      ? supabaseAdmin.from("profiles").select("*").eq("email", email).maybeSingle()
      : null,
  ].filter(Boolean);

  for (const query of queries) {
    try {
      const result = (await query) as SafeQueryResponse;

      if (!result.error && result.data) {
        return result.data as ProfileRow;
      }
    } catch {
      // Keep trying fallback lookups.
    }
  }

  return null;
}

async function getApplicationEvents(guruId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("guru_application_events")
      .select("*")
      .eq("guru_id", guruId)
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      console.warn("Guru events query skipped:", error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("Guru events query skipped:", error);
    return [];
  }
}

async function updateGuruStatusAction(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/admin/login");
  }

  const guruId = String(formData.get("guruId") || "").trim();
  const action = String(formData.get("action") || "").trim() as AdminAction;
  const note = String(formData.get("note") || "").trim();

  const allowedActions: AdminAction[] = [
    "reviewing",
    "needs_info",
    "pre_approved",
    "verification_pending",
    "approved",
    "bookable",
    "rejected",
    "suspended",
  ];

  if (!guruId || !allowedActions.includes(action)) {
    redirect(
      `/admin/gurus/${encodeURIComponent(guruId || "missing")}?error=${encodeURIComponent(
        "Invalid Admin action.",
      )}`,
    );
  }

  const guru = await getGuruById(guruId);

  if (!guru) {
    redirect(
      `/admin/gurus?error=${encodeURIComponent(
        "Guru record could not be found.",
      )}`,
    );
  }

  const realGuruId = getGuruId(guru);
  const oldStatus = normalizeApplicationStatus(guru);
  const payload = buildStatusPayload({
    action,
    adminUserId: user.id,
    note,
  });

  const updateError = await updateWithColumnFallback({
    table: "gurus",
    idColumn: "id",
    idValue: realGuruId,
    payload,
    requiredColumns: [],
  });

  if (updateError) {
    redirect(
      `/admin/gurus/${encodeURIComponent(realGuruId)}?error=${encodeURIComponent(
        updateError.message || "Unable to update Guru status.",
      )}`,
    );
  }

  await insertEventSafely({
    guru_id: realGuruId,
    admin_user_id: user.id,
    event_type: action,
    old_status: oldStatus,
    new_status: action,
    note: note || null,
    created_at: new Date().toISOString(),
  });

  revalidatePath("/admin");
  revalidatePath("/admin/guru-approvals");
  revalidatePath("/admin/gurus");
  revalidatePath(`/admin/gurus/${realGuruId}`);
  revalidatePath("/search");
  revalidatePath("/", "layout");

  redirect(`/admin/gurus/${encodeURIComponent(realGuruId)}?saved=1`);
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black text-slate-950">
        {value || "—"}
      </p>
    </div>
  );
}

function CredentialPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${credentialClasses(value)}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80">
        {label}
      </p>
      <p className="mt-2 text-sm font-black">{value}</p>
    </div>
  );
}

function AdminNavButton({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
}) {
  if (primary) {
    return (
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
    >
      {children}
    </Link>
  );
}

function AdminNavigationPanel() {
  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
        Admin Navigation
      </p>

      <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
        Move between Guru approval pages
      </h2>

      <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-600">
        Use these shortcuts to move between the Guru review center, filtered
        application lists, and the main Admin dashboard.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <AdminNavButton href="/admin">Admin Home</AdminNavButton>
        <AdminNavButton href="/admin/guru-approvals">
          Guru Approvals
        </AdminNavButton>
        <AdminNavButton href="/admin/gurus">All Guru Records</AdminNavButton>
        <AdminNavButton href="/admin/gurus?status=new">
          New Applications
        </AdminNavButton>
        <AdminNavButton href="/admin/gurus?status=pending">
          Pending Reviews
        </AdminNavButton>
        <AdminNavButton href="/admin/gurus?status=needs-info">
          Needs Info
        </AdminNavButton>
        <AdminNavButton href="/admin/gurus?status=verification">
          Verification
        </AdminNavButton>
        <AdminNavButton href="/admin/gurus?status=bookable" primary>
          Bookable Gurus
        </AdminNavButton>
      </div>
    </section>
  );
}

function AdminActionCard({
  action,
  guruId,
}: {
  action: AdminAction;
  guruId: string;
}) {
  return (
    <form
      action={updateGuruStatusAction}
      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <input type="hidden" name="guruId" value={guruId} />
      <input type="hidden" name="action" value={action} />

      <div className="flex min-h-[92px] flex-col justify-between gap-4">
        <div>
          <p className="font-black text-slate-950">{getActionLabel(action)}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            {getActionDescription(action)}
          </p>
        </div>

        {(action === "needs_info" || action === "rejected") && (
          <textarea
            name="note"
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            placeholder={
              action === "needs_info"
                ? "Tell the Guru what they need to update..."
                : "Add rejection reason or internal notes..."
            }
            required
          />
        )}

        <button
          type="submit"
          className={`inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-black shadow-sm transition ${getActionButtonClasses(
            action,
          )}`}
        >
          {getActionLabel(action)}
        </button>
      </div>
    </form>
  );
}

export default async function AdminGuruDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/admin/login");
  }

  const guru = await getGuruById(id);

  if (!guru) {
    notFound();
  }

  const profile = await getProfileForGuru(guru);
  const guruId = getGuruId(guru);
  const userId = getGuruUserId(guru);
  const name = getGuruName(guru, profile);
  const email = getGuruEmail(guru, profile);
  const phone = getGuruPhone(guru, profile);
  const location = getGuruLocation(guru, profile);
  const services = getGuruServices(guru);
  const experience = getGuruExperience(guru);
  const status = normalizeApplicationStatus(guru);
  const statusLabel = getApplicationStatusLabel(status);
  const profileCompletion = getProfileCompletion(guru);
  const publicHref = getPublicHref(guru);
  const events = await getApplicationEvents(guruId);

  const identityStatus = getCredentialStatus(
    guru.stripe_identity_status || guru.identity_status,
  );
  const backgroundStatus = getCredentialStatus(guru.background_check_status);
  const safetyStatus = getCredentialStatus(guru.safety_cert_status);
  const stripeConnectStatus = getCredentialStatus(guru.stripe_connect_status);

  return (
    <main className="space-y-8">
      <AdminNavigationPanel />

      <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.13),transparent_28%),linear-gradient(135deg,#ecfdf5_0%,#ffffff_52%,#f8fafc_100%)] p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/gurus"
                className="inline-flex rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50"
              >
                ← Back to Guru Records
              </Link>

              <Link
                href="/admin/guru-approvals"
                className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Guru Approvals
              </Link>

              <Link
                href="/admin/gurus?status=new"
                className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                New Applications
              </Link>

              <Link
                href="/admin/gurus?status=bookable"
                className="inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
              >
                Bookable Gurus
              </Link>

              <Link
                href="/admin"
                className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Admin Home
              </Link>
            </div>

            <div className="mt-6">
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                Guru Application Review
              </span>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                {name}
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-700 sm:text-base">
                Review this Guru’s application, profile readiness, trust checks,
                and Admin status. Only make a Guru bookable when they are ready
                to appear in customer search.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:min-w-[320px]">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
              Current Status
            </p>

            <div
              className={`mt-3 inline-flex rounded-full border px-4 py-2 text-sm font-black ${statusClasses(
                status,
              )}`}
            >
              {statusLabel}
            </div>

            <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
              {toBoolean(guru.is_bookable) || status === "bookable"
                ? "This Guru is visible to customers if search is filtering by is_bookable."
                : "This Guru should remain hidden from customer search until made bookable."}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={publicHref}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                View Public
              </Link>

              <Link
                href="/admin/gurus?status=pending"
                className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-700"
              >
                Pending List
              </Link>
            </div>
          </div>
        </div>

        {resolvedSearchParams.saved ? (
          <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">
            Guru status updated successfully.
          </div>
        ) : null}

        {resolvedSearchParams.error ? (
          <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-black text-rose-700">
            {resolvedSearchParams.error}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
            Applicant Details
          </p>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
            Profile and application snapshot
          </h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <DetailItem label="Name" value={name} />
            <DetailItem label="Email" value={email} />
            <DetailItem label="Phone" value={phone} />
            <DetailItem label="Location" value={location} />
            <DetailItem label="Experience" value={experience} />
            <DetailItem label="Joined" value={formatShortDate(guru.created_at)} />
            <DetailItem label="Guru ID" value={guruId} />
            <DetailItem label="User ID" value={userId || "—"} />
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
              Services
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {services.map((service) => (
                <span
                  key={service}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
              Bio / Notes
            </p>

            <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-700">
              {asTrimmedString(guru.bio) ||
                asTrimmedString(profile?.bio) ||
                "No bio listed yet."}
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
            Trust & Safety
          </p>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
            Approval readiness
          </h2>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black text-slate-950">
                  Profile Completion
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  Stronger profiles convert better and reduce customer doubt.
                </p>
              </div>

              <p className="text-2xl font-black text-slate-950">
                {profileCompletion}%
              </p>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <CredentialPill label="Stripe Connect" value={stripeConnectStatus} />
            <CredentialPill label="Identity" value={identityStatus} />
            <CredentialPill label="Background" value={backgroundStatus} />
            <CredentialPill label="Safety Cert" value={safetyStatus} />
          </div>

          <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-black text-emerald-800">
              Bookable is the final switch
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-emerald-700">
              Make a Guru bookable only after SitGuru is comfortable with their
              public profile, verification progress, and customer trust
              readiness.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
            Admin Decision
          </p>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
            Update Guru application status
          </h2>

          <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
            Use these actions to move a Guru through review. The final bookable
            action should only be used when profile, payout, and trust readiness
            are complete.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              "reviewing",
              "needs_info",
              "pre_approved",
              "verification_pending",
              "approved",
              "bookable",
              "rejected",
              "suspended",
            ].map((action) => (
              <AdminActionCard
                key={action}
                action={action as AdminAction}
                guruId={guruId}
              />
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
            Review Timeline
          </p>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
            Recent Admin activity
          </h2>

          <div className="mt-6 space-y-3">
            {events.length > 0 ? (
              events.map((event) => {
                const eventRow = event as Record<string, unknown>;
                const eventType = asTrimmedString(eventRow.event_type);
                const note = asTrimmedString(eventRow.note);
                const createdAt = asTrimmedString(eventRow.created_at);

                return (
                  <div
                    key={`${eventType}-${createdAt}-${note}`}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">
                          {eventType || "Guru event"}
                        </p>
                        {note ? (
                          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                            {note}
                          </p>
                        ) : null}
                      </div>

                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-500">
                        {formatDate(createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm font-semibold leading-7 text-slate-600">
                No review events have been recorded yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}