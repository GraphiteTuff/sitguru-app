import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserRound,
  UserCog,
  StickyNote,
  Wrench,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { calculateSitGuruProfileCompletion } from "@/lib/profileCompletion";
import { asAnyRows } from "@/lib/supabase/as-rows";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, unknown>;

type PageProps = {
  searchParams?: Promise<{
    query?: string;
    refresh?: string;
  }>;
};

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  actorType: string;
  source: string;
  createdAt: string;
  changedFields: string[];
  beforeData: unknown;
  afterData: unknown;
  tone: "green" | "amber" | "slate" | "sky";
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asBoolean(value: unknown) {
  if (typeof value === "boolean") return value;

  const normalized = asString(value).toLowerCase();
  return ["true", "1", "yes", "active", "bookable", "approved"].includes(
    normalized,
  );
}

function yesNo(value: unknown) {
  return value ? "Yes" : "No";
}

function firstNonEmpty(...values: unknown[]) {
  return values.map(asString).find(Boolean) || "";
}

function formatDateTime(value: unknown) {
  const raw = asString(value);
  if (!raw) return "Time not recorded";

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function latestTimestamp(...values: unknown[]) {
  const candidates = values
    .map(asString)
    .filter(Boolean)
    .map((value) => ({ value, time: new Date(value).getTime() }))
    .filter((item) => !Number.isNaN(item.time))
    .sort((a, b) => b.time - a.time);

  return candidates[0]?.value || "";
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => asString(item)).filter(Boolean)
    : [];
}

function jsonPreview(value: unknown) {
  if (!value) return "";

  try {
    const output = JSON.stringify(value, null, 2);
    return output.length > 6000 ? `${output.slice(0, 6000)}\n…` : output;
  } catch {
    return String(value);
  }
}

async function findAuthUser(userId: string) {
  try {
    const { data, error } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (error) {
      console.warn("Account lifecycle Auth lookup failed:", error);
      return null;
    }

    return (data?.user || null) as unknown as AnyRow | null;
  } catch (error) {
    console.warn("Account lifecycle Auth lookup failed:", error);
    return null;
  }
}

function getStatusClasses(status: string) {
  const normalized = status.toLowerCase();

  if (
    ["sent", "delivered", "read", "complete", "completed", "success"].some(
      (value) => normalized.includes(value),
    )
  ) {
    return "bg-emerald-100 text-emerald-800";
  }

  if (
    ["failed", "error", "rejected", "blocked", "undelivered"].some((value) =>
      normalized.includes(value),
    )
  ) {
    return "bg-rose-100 text-rose-800";
  }

  if (
    ["queued", "pending", "processing", "scheduled"].some((value) =>
      normalized.includes(value),
    )
  ) {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-slate-100 text-slate-700";
}

function getIssueClasses(issue: string) {
  if (issue === "complete" || issue === "account_live") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (issue.includes("missing") || issue.includes("repair")) {
    return "border-rose-200 bg-rose-50 text-rose-900";
  }

  return "border-amber-200 bg-amber-50 text-amber-950";
}

function Field({
  label,
  value,
  helper,
}: {
  label: string;
  value: unknown;
  helper?: string;
}) {
  const displayedValue =
    value === false || value === 0
      ? String(value)
      : String(value || "Not provided");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-black leading-5 text-slate-950">
        {displayedValue}
      </dd>
      {helper ? (
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
  tone = "slate",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  tone?: "green" | "amber" | "rose" | "sky" | "slate";
}) {
  const toneClasses = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    sky: "border-sky-200 bg-sky-50 text-sky-800",
    slate: "border-slate-200 bg-white text-slate-700",
  };

  return (
    <div
      className={[
        "rounded-2xl border p-4 shadow-sm",
        toneClasses[tone],
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 ring-1 ring-black/5">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] opacity-75">
            {label}
          </p>
          <p className="mt-0.5 truncate text-lg font-black">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-xs font-semibold leading-5 opacity-80">
        {detail}
      </p>
    </div>
  );
}

async function safeRows(
  query: PromiseLike<{ data: unknown; error: unknown }>,
  label: string,
) {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Account lifecycle query skipped for ${label}:`, result.error);
      return [] as AnyRow[];
    }

    return asAnyRows(result.data);
  } catch (error) {
    console.warn(`Account lifecycle query skipped for ${label}:`, error);
    return [] as AnyRow[];
  }
}

async function findProfile(query: string) {
  const clean = query.trim();
  if (!clean) return null;

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      clean,
    );

  let request = supabaseAdmin.from("profiles").select("*").limit(1);

  if (isUuid) {
    request = request.eq("id", clean);
  } else {
    request = request.or(
      `email.ilike.%${clean}%,full_name.ilike.%${clean}%,first_name.ilike.%${clean}%,last_name.ilike.%${clean}%,phone.ilike.%${clean}%`,
    );
  }

  const { data, error } = await request;

  if (error) {
    console.warn("Account lifecycle profile lookup failed:", error);
    return null;
  }

  return ((data || [])[0] || null) as AnyRow | null;
}

function buildDerivedActivity({
  authUser,
  profile,
  guru,
  ambassador,
  referral,
  lifecycleEvents,
}: {
  authUser: AnyRow | null;
  profile: AnyRow;
  guru: AnyRow | null;
  ambassador: AnyRow | null;
  referral: AnyRow | null;
  lifecycleEvents: AnyRow[];
}) {
  const items: ActivityItem[] = lifecycleEvents.map((event, index) => ({
    id:
      asString(event.id) ||
      `event-${asString(event.created_at) || index.toString()}`,
    title:
      firstNonEmpty(
        event.action_label,
        event.title,
        event.event_type,
        event.action,
      ) || "Account activity recorded",
    description:
      firstNonEmpty(
        event.description,
        event.details,
        event.message,
        event.summary,
      ) || "An account lifecycle event was recorded.",
    actorName:
      firstNonEmpty(
        event.actor_name,
        event.admin_name,
        event.performed_by_name,
      ) || "System / database",
    actorEmail: firstNonEmpty(event.actor_email, event.admin_email),
    actorRole:
      firstNonEmpty(event.actor_role, event.admin_role) ||
      (asString(event.actor_type) === "admin" ? "Admin" : "System"),
    actorType: firstNonEmpty(event.actor_type) || "system",
    source:
      firstNonEmpty(event.source, event.source_page, event.origin) ||
      "Account lifecycle",
    createdAt:
      firstNonEmpty(
        event.created_at,
        event.occurred_at,
        event.updated_at,
      ) || "",
    changedFields: asStringArray(event.changed_fields),
    beforeData: event.before_data,
    afterData: event.after_data,
    tone:
      asString(event.actor_type) === "admin"
        ? "green"
        : asString(event.event_type).includes("communication")
          ? "sky"
          : "slate",
  }));

  const pushDerived = (
    id: string,
    title: string,
    description: string,
    createdAt: unknown,
    tone: ActivityItem["tone"],
  ) => {
    const date = asString(createdAt);
    if (!date) return;

    items.push({
      id,
      title,
      description,
      actorName: "System / database",
      actorEmail: "",
      actorRole: "System",
      actorType: "system",
      source: "Current account records",
      createdAt: date,
      changedFields: [],
      beforeData: null,
      afterData: null,
      tone,
    });
  };

  if (authUser) {
    pushDerived(
      `auth-created-${asString(authUser.id)}`,
      "SitGuru account created",
      "The Supabase Auth account was created.",
      authUser.created_at,
      "slate",
    );

    if (asString(authUser.last_sign_in_at)) {
      pushDerived(
        `auth-login-${asString(authUser.id)}-${asString(
          authUser.last_sign_in_at,
        )}`,
        "Last successful login",
        "The user successfully signed in to SitGuru.",
        authUser.last_sign_in_at,
        "green",
      );
    }
  }

  pushDerived(
    `profile-created-${asString(profile.id)}`,
    "Public profile created",
    "The core SitGuru profile row was created.",
    profile.created_at,
    "slate",
  );

  if (
    asString(profile.updated_at) &&
    asString(profile.updated_at) !== asString(profile.created_at)
  ) {
    pushDerived(
      `profile-updated-${asString(profile.id)}`,
      "Public profile updated",
      "The core SitGuru profile was updated.",
      profile.updated_at,
      "slate",
    );
  }

  if (guru) {
    pushDerived(
      `guru-created-${asString(guru.id)}`,
      "Guru workspace created",
      `A canonical Guru workspace now exists. Current status: ${
        firstNonEmpty(guru.status, guru.application_status) || "pending"
      }.`,
      guru.created_at,
      "green",
    );

    if (
      asString(guru.updated_at) &&
      asString(guru.updated_at) !== asString(guru.created_at)
    ) {
      pushDerived(
        `guru-updated-${asString(guru.id)}`,
        "Guru workspace updated",
        `The Guru workspace was updated. Bookable: ${
          asBoolean(guru.is_bookable) ? "Yes" : "No"
        }. Public: ${
          asBoolean(guru.is_public_visible) ? "Yes" : "No"
        }.`,
        guru.updated_at,
        "green",
      );
    }
  }

  if (referral) {
    pushDerived(
      `referral-created-${asString(referral.id) || asString(referral.code)}`,
      "Referral code created",
      `Referral code: ${asString(referral.code) || "Generated"}.`,
      referral.created_at || referral.updated_at,
      "sky",
    );
  }

  if (ambassador) {
    pushDerived(
      `ambassador-created-${asString(ambassador.id)}`,
      "Ambassador workspace created",
      "An Ambassador workspace exists for this account.",
      ambassador.created_at,
      "sky",
    );
  }

  const seen = new Set<string>();

  return items
    .filter((item) => {
      const key = [
        item.title.toLowerCase(),
        item.createdAt,
        item.description.toLowerCase(),
      ].join("|");

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();

      if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
      if (Number.isNaN(aTime)) return 1;
      if (Number.isNaN(bTime)) return -1;

      return bTime - aTime;
    });
}

function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  const toneClasses = {
    green: "bg-emerald-600",
    amber: "bg-amber-500",
    slate: "bg-slate-500",
    sky: "bg-sky-500",
  };

  return (
    <div className="space-y-3">
      {items.length ? (
        items.map((item, index) => (
          <div
            key={item.id}
            className="relative rounded-2xl border border-slate-200 bg-white p-4 pl-12 shadow-sm"
          >
            <div
              className={[
                "absolute left-4 top-5 h-4 w-4 rounded-full ring-4 ring-white",
                toneClasses[item.tone],
              ].join(" ")}
            />
            {index < items.length - 1 ? (
              <div className="absolute bottom-[-14px] left-[23px] top-9 w-px bg-slate-200" />
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-black text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
              <span className="shrink-0 text-xs font-bold text-slate-500">
                {formatDateTime(item.createdAt)}
              </span>
            </div>

            <div className="mt-3 grid gap-2 text-xs font-bold text-slate-500 sm:flex sm:flex-wrap">
              <span className="rounded-full bg-slate-100 px-3 py-1">
                By: {item.actorName}
              </span>
              {item.actorEmail ? (
                <span className="break-all rounded-full bg-slate-100 px-3 py-1">
                  {item.actorEmail}
                </span>
              ) : null}
              <span className="rounded-full bg-slate-100 px-3 py-1">
                Role: {item.actorRole}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1">
                Source: {item.source}
              </span>
            </div>

            {item.changedFields.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {item.changedFields.slice(0, 12).map((field) => (
                  <span
                    key={field}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-800 ring-1 ring-emerald-100"
                  >
                    {field.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            ) : null}

            {item.beforeData || item.afterData ? (
              <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50">
                <summary className="cursor-pointer px-4 py-3 text-xs font-black text-slate-700">
                  View before and after values
                </summary>
                <div className="grid gap-3 border-t border-slate-200 p-4 lg:grid-cols-2">
                  <div>
                    <p className="mb-2 text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">
                      Before
                    </p>
                    <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-white p-3 text-[11px] leading-5 text-slate-700">
                      {jsonPreview(item.beforeData) || "No previous values recorded."}
                    </pre>
                  </div>
                  <div>
                    <p className="mb-2 text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">
                      After
                    </p>
                    <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-white p-3 text-[11px] leading-5 text-slate-700">
                      {jsonPreview(item.afterData) || "No new values recorded."}
                    </pre>
                  </div>
                </div>
              </details>
            ) : null}
          </div>
        ))
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-600">
          No account activity has been recorded yet.
        </div>
      )}
    </div>
  );
}

export default async function AccountLifecyclePage({
  searchParams,
}: PageProps) {
  const params = searchParams ? await searchParams : {};
  const query = params.query || "";

  const supabase = await createClient();
  const {
    data: { user: signedInAdmin },
  } = await supabase.auth.getUser();

  const profile = await findProfile(query);
  const userId = asString(profile?.id);
  const authUser = userId ? await findAuthUser(userId) : null;

  const [
    rolesRows,
    guruRows,
    ambassadorRows,
    referralRows,
    communicationLogs,
    lifecycleEvents,
    assignmentRows,
    adminNotes,
  ] = userId
    ? await Promise.all([
        safeRows(
          supabaseAdmin
            .from("user_roles")
            .select("*")
            .eq("user_id", userId),
          "user_roles",
        ),
        safeRows(
          supabaseAdmin
            .from("gurus")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(10),
          "gurus",
        ),
        safeRows(
          supabaseAdmin
            .from("ambassadors")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(10),
          "ambassadors",
        ),
        safeRows(
          supabaseAdmin
            .from("pawperks_account_referral_codes")
            .select("*")
            .eq("account_id", userId)
            .order("created_at", { ascending: false })
            .limit(10),
          "pawperks_account_referral_codes",
        ),
        safeRows(
          supabaseAdmin
            .from("communication_logs")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(25),
          "communication_logs",
        ),
        safeRows(
          supabaseAdmin
            .from("account_lifecycle_events")
            .select("*")
            .or(`user_id.eq.${userId},target_user_id.eq.${userId}`)
            .order("created_at", { ascending: false })
            .limit(100),
          "account_lifecycle_events",
        ),
        safeRows(
          supabaseAdmin
            .from("account_management_assignments")
            .select("*")
            .eq("target_user_id", userId)
            .order("updated_at", { ascending: false })
            .limit(25),
          "account_management_assignments",
        ),
        safeRows(
          supabaseAdmin
            .from("account_admin_notes")
            .select("*")
            .eq("target_user_id", userId)
            .order("created_at", { ascending: false })
            .limit(50),
          "account_admin_notes",
        ),
      ])
    : [[], [], [], [], [], [], [], []];

  const roles = rolesRows
    .map((row) => asString(row.role))
    .filter(Boolean);

  const guru = guruRows[0] || null;
  const ambassador = ambassadorRows[0] || null;
  const referral = referralRows[0] || null;

  const currentAdminId = signedInAdmin?.id || "";
  const currentAdminPermissionRows = currentAdminId
    ? await safeRows(
        supabaseAdmin
          .from("admin_account_permissions")
          .select("*")
          .eq("user_id", currentAdminId)
          .limit(1),
        "current_admin_permission",
      )
    : [];
  const currentAdminPermission = currentAdminPermissionRows[0] || null;

  const activeAssignment =
    assignmentRows.find(
      (row) =>
        !["completed", "unassigned"].includes(
          asString(row.status).toLowerCase(),
        ),
    ) || null;

  const assignedAdminId = asString(activeAssignment?.assigned_admin_user_id);
  const assignedAdminPermissionRows = assignedAdminId
    ? await safeRows(
        supabaseAdmin
          .from("admin_account_permissions")
          .select("*")
          .eq("user_id", assignedAdminId)
          .limit(1),
        "assigned_admin_permission",
      )
    : [];
  const assignedAdminPermission = assignedAdminPermissionRows[0] || null;
  const assignedAdminAuth = assignedAdminId
    ? await findAuthUser(assignedAdminId)
    : null;

  const referralCode =
    asString(referral?.code) ||
    asString(profile?.referral_code) ||
    asString(ambassador?.referral_code);

  const completion = profile
    ? calculateSitGuruProfileCompletion({
        userId,
        email: asString(profile.email),
        roles,
        profile: { ...profile, referral_code: referralCode },
        guru,
        ambassador,
      })
    : null;

  const guruRolePresent =
    roles.includes("guru") ||
    asString(profile?.role).toLowerCase() === "guru" ||
    asString(profile?.account_type).toLowerCase() === "guru";

  const likelyIssueType =
    guruRolePresent && !guru
      ? "role_profile_missing"
      : guru && (completion?.completion_percentage || 0) < 100
        ? "incomplete_setup"
        : completion?.likely_issue_type || "unknown";

  const profileName =
    firstNonEmpty(
      profile?.full_name,
      `${asString(profile?.first_name)} ${asString(profile?.last_name)}`.trim(),
      guru?.display_name,
      guru?.full_name,
      guru?.name,
    ) || "Unnamed account";

  const profileEmail = firstNonEmpty(profile?.email, guru?.email);
  const profilePhone = firstNonEmpty(
    profile?.phone,
    profile?.phone_number,
    guru?.phone,
    guru?.phone_number,
  );

  const guruId = asString(guru?.id);
  const guruHref = guruId
    ? `/admin/gurus/${encodeURIComponent(guruId)}`
    : "/admin/gurus";

  const refreshHref = query
    ? `/admin/account-lifecycle?query=${encodeURIComponent(
        query,
      )}&refresh=${Date.now()}`
    : "/admin/account-lifecycle";

  const activityItems = profile
    ? buildDerivedActivity({
        authUser,
        profile,
        guru,
        ambassador,
        referral,
        lifecycleEvents,
      })
    : [];

  const isPublicVisible = asBoolean(guru?.is_public_visible);
  const isBookable = asBoolean(guru?.is_bookable);
  const bestContact = profilePhone
    ? profileEmail
      ? "Email + phone"
      : "Phone"
    : profileEmail
      ? "Email"
      : "No contact";

  const lastLoginAt = asString(authUser?.last_sign_in_at);
  const recordedAppActivityAt = firstNonEmpty(
    profile?.last_seen_at,
    profile?.last_active_at,
    profile?.last_activity_at,
    guru?.last_seen_at,
    guru?.last_active_at,
    guru?.last_activity_at,
  );
  const lastUsedAt =
    recordedAppActivityAt ||
    lastLoginAt ||
    latestTimestamp(
      profile?.updated_at,
      guru?.updated_at,
      ambassador?.updated_at,
    );
  const lastUsedSource = recordedAppActivityAt
    ? "Recorded app activity"
    : lastLoginAt
      ? "Last successful login"
      : "Latest account update";
  const signInProvider =
    firstNonEmpty(
      (authUser?.app_metadata as AnyRow | undefined)?.provider,
      (authUser?.app_metadata as AnyRow | undefined)?.providers &&
        Array.isArray(
          (authUser?.app_metadata as AnyRow | undefined)?.providers,
        )
        ? String(
            ((authUser?.app_metadata as AnyRow).providers as unknown[])[0] ||
              "",
          )
        : "",
    ) || "Not recorded";

  const currentAdminName =
    firstNonEmpty(
      currentAdminPermission?.display_name,
      signedInAdmin?.user_metadata?.full_name,
      signedInAdmin?.user_metadata?.display_name,
      signedInAdmin?.user_metadata?.name,
      signedInAdmin?.email,
    ) || "Signed-in Admin";
  const currentAdminEmail =
    firstNonEmpty(currentAdminPermission?.email, signedInAdmin?.email) ||
    "Email not available";
  const currentAdminRole =
    firstNonEmpty(currentAdminPermission?.access_level) || "admin";

  const assignedAdminName =
    firstNonEmpty(
      assignedAdminPermission?.display_name,
      assignedAdminAuth?.user_metadata &&
        (assignedAdminAuth.user_metadata as AnyRow).full_name,
      assignedAdminAuth?.user_metadata &&
        (assignedAdminAuth.user_metadata as AnyRow).display_name,
      assignedAdminPermission?.email,
      assignedAdminAuth?.email,
    ) || "Unassigned";
  const assignedAdminEmail =
    firstNonEmpty(assignedAdminPermission?.email, assignedAdminAuth?.email);
  const assignedAdminRole =
    firstNonEmpty(assignedAdminPermission?.access_level) ||
    (assignedAdminId ? "Admin" : "Not assigned");

  const lastAdminEvent = lifecycleEvents.find(
    (event) =>
      asString(event.actor_type).toLowerCase() === "admin" &&
      Boolean(firstNonEmpty(event.actor_name, event.actor_email)),
  );
  const lastWorkedByName =
    firstNonEmpty(lastAdminEvent?.actor_name, lastAdminEvent?.actor_email) ||
    "No Admin action recorded";
  const lastWorkedByEmail = firstNonEmpty(lastAdminEvent?.actor_email);
  const lastWorkedByRole =
    firstNonEmpty(lastAdminEvent?.actor_role) || "Not recorded";
  const lastWorkedAt = firstNonEmpty(lastAdminEvent?.created_at);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f8faf7] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-5 sm:space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="grid gap-2 sm:flex sm:flex-wrap">
                <Link
                  href="/admin/gurus"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                >
                  <ArrowLeft size={16} />
                  Back to Guru Management
                </Link>

                {profile ? (
                  <Link
                    href={guruHref}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-800 transition hover:bg-emerald-100 sm:w-auto"
                  >
                    <UserRound size={16} />
                    {guru ? "Open Guru Record" : "Open Guru Management"}
                  </Link>
                ) : null}

                <Link
                  href={refreshHref}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-black text-white transition hover:bg-emerald-800 sm:w-auto"
                >
                  <RefreshCw size={16} />
                  Refresh Diagnosis
                </Link>
              </div>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                Admin account support
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Account lifecycle diagnostics
              </h1>
              <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
                Find an account, understand what exists, see what is missing,
                review recent work, and confirm whether communication was sent.
              </p>
            </div>

            <div className="grid w-full gap-3 xl:w-auto xl:min-w-[360px]">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
                  Signed in as
                </p>
                <p className="mt-1 text-lg font-black text-emerald-950">
                  {currentAdminName}
                </p>
                <p className="mt-1 break-all text-xs font-semibold text-emerald-800">
                  {currentAdminEmail}
                </p>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-emerald-700">
                  {currentAdminRole.replace(/_/g, " ")}
                </p>
              </div>

              {profile ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Current account
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-950">
                    {profileName}
                  </p>
                  <p className="mt-1 break-all text-xs font-semibold text-slate-500">
                    {userId}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <form className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              name="query"
              defaultValue={query}
              placeholder="UUID, email, name, or phone"
              className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
            <button className="h-12 w-full rounded-2xl bg-emerald-700 px-7 text-sm font-black text-white transition hover:bg-emerald-800 sm:w-auto">
              Search
            </button>
          </form>
        </section>

        {!query ? (
          <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center">
            <UserRound className="mx-auto text-slate-400" size={34} />
            <h2 className="mt-3 text-xl font-black text-slate-950">
              Search for an account
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Enter a UUID, email, name, or phone number above.
            </p>
          </section>
        ) : !profile ? (
          <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="mt-0.5 shrink-0 text-rose-700"
                size={22}
              />
              <div>
                <h2 className="text-lg font-black text-rose-950">
                  No public profile row was found
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-rose-800">
                  An Auth-only signup or profile-creation issue may exist. Check
                  Supabase Auth or search using the exact UUID.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section
              className={[
                "rounded-[2rem] border p-5 shadow-sm sm:p-6",
                getIssueClasses(likelyIssueType),
              ].join(" ")}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.15em] opacity-70">
                    Current diagnosis
                  </p>
                  <h2 className="mt-1 text-2xl font-black">
                    {likelyIssueType.replace(/_/g, " ")}
                  </h2>
                  <p className="mt-2 max-w-4xl text-sm font-semibold leading-6">
                    Completion: {completion?.completion_percentage || 0}%
                    {completion?.missing_required_fields?.length
                      ? ` — Missing: ${completion.missing_required_fields.join(
                          ", ",
                        )}`
                      : " — No required items are currently missing."}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/80 px-5 py-4 text-center ring-1 ring-black/5">
                  <p className="text-3xl font-black">
                    {completion?.completion_percentage || 0}%
                  </p>
                  <p className="text-xs font-black uppercase tracking-[0.12em] opacity-70">
                    Complete
                  </p>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-3">
                <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-700">
                  At a glance
                </p>
                <h2 className="text-2xl font-black text-slate-950">
                  Current account state
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <SummaryCard
                  icon={<CheckCircle2 size={19} />}
                  label="Profile"
                  value="Exists"
                  detail="A public profile row is present."
                  tone="green"
                />
                <SummaryCard
                  icon={guru ? <CheckCircle2 size={19} /> : <Wrench size={19} />}
                  label="Guru workspace"
                  value={guru ? "Exists" : "Missing"}
                  detail={
                    guru
                      ? "A canonical Guru record is available."
                      : "This account needs a Guru workspace repair."
                  }
                  tone={guru ? "green" : "rose"}
                />
                <SummaryCard
                  icon={<ShieldCheck size={19} />}
                  label="Visibility"
                  value={isPublicVisible ? "Public" : "Hidden"}
                  detail={
                    isPublicVisible
                      ? "The profile may appear to Pet Parents."
                      : "The profile is currently hidden from public search."
                  }
                  tone={isPublicVisible ? "green" : "amber"}
                />
                <SummaryCard
                  icon={<Activity size={19} />}
                  label="Bookability"
                  value={isBookable ? "Bookable" : "Not bookable"}
                  detail={
                    isBookable
                      ? "The Guru may receive booking requests."
                      : "The Guru cannot receive booking requests yet."
                  }
                  tone={isBookable ? "green" : "amber"}
                />
                <SummaryCard
                  icon={
                    bestContact === "No contact" ? (
                      <AlertTriangle size={19} />
                    ) : (
                      <MessageSquare size={19} />
                    )
                  }
                  label="Best contact"
                  value={bestContact}
                  detail={
                    bestContact === "No contact"
                      ? "No usable email or phone is currently available."
                      : "Use the available channel for profile follow-up."
                  }
                  tone={bestContact === "No contact" ? "rose" : "sky"}
                />
                <SummaryCard
                  icon={<Clock3 size={19} />}
                  label="Last login"
                  value={
                    lastLoginAt
                      ? formatDateTime(lastLoginAt)
                      : "No login recorded"
                  }
                  detail="Pulled directly from the Supabase Auth account."
                  tone={lastLoginAt ? "green" : "slate"}
                />
                <SummaryCard
                  icon={<Activity size={19} />}
                  label="Last used SitGuru"
                  value={
                    lastUsedAt
                      ? formatDateTime(lastUsedAt)
                      : "No activity recorded"
                  }
                  detail={`Source: ${lastUsedSource}.`}
                  tone={lastUsedAt ? "sky" : "slate"}
                />
                <SummaryCard
                  icon={<UserCog size={19} />}
                  label="Assigned manager"
                  value={assignedAdminName}
                  detail={
                    assignedAdminEmail
                      ? `${assignedAdminEmail} · ${assignedAdminRole.replace(
                          /_/g,
                          " ",
                        )}`
                      : "No active account manager is assigned."
                  }
                  tone={assignedAdminId ? "green" : "slate"}
                />
                <SummaryCard
                  icon={<Clock3 size={19} />}
                  label="Last worked by"
                  value={lastWorkedByName}
                  detail={
                    lastWorkedAt
                      ? `${lastWorkedByEmail || lastWorkedByRole} · ${formatDateTime(
                          lastWorkedAt,
                        )}`
                      : "No attributed Admin action has been recorded yet."
                  }
                  tone={lastWorkedAt ? "sky" : "slate"}
                />
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <UserCog size={21} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-700">
                    Account management
                  </p>
                  <h2 className="text-2xl font-black text-slate-950">
                    Ownership and follow-up
                  </h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                    See who owns this account, who last changed it, and when the
                    next follow-up is due.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Field
                  label="Assigned account manager"
                  value={assignedAdminName}
                  helper={
                    assignedAdminEmail
                      ? `${assignedAdminEmail} · ${assignedAdminRole.replace(
                          /_/g,
                          " ",
                        )}`
                      : "No active assignment."
                  }
                />
                <Field
                  label="Assignment status"
                  value={asString(activeAssignment?.status) || "Unassigned"}
                  helper={`Priority: ${
                    asString(activeAssignment?.priority) || "normal"
                  }`}
                />
                <Field
                  label="Next follow-up"
                  value={
                    asString(activeAssignment?.next_follow_up_at)
                      ? formatDateTime(activeAssignment?.next_follow_up_at)
                      : "Not scheduled"
                  }
                  helper={
                    asString(activeAssignment?.assignment_note) ||
                    "No assignment note."
                  }
                />
                <Field
                  label="Last Admin action"
                  value={lastWorkedByName}
                  helper={
                    lastWorkedAt
                      ? `${lastWorkedByEmail || lastWorkedByRole} · ${formatDateTime(
                          lastWorkedAt,
                        )}`
                      : "No attributed Admin event yet."
                  }
                />
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4">
                <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-700">
                  Account details
                </p>
                <h2 className="text-2xl font-black text-slate-950">
                  What currently exists
                </h2>
              </div>

              <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <Field label="Auth user ID / profile ID" value={userId} />
                <Field label="Profile row exists" value={yesNo(profile)} />
                <Field
                  label="Public profile role"
                  value={
                    asString(profile.role) ||
                    asString(profile.account_type) ||
                    "Not assigned"
                  }
                />
                <Field
                  label="All roles"
                  value={
                    completion?.roles?.length
                      ? completion.roles.join(", ")
                      : "No role rows"
                  }
                />
                <Field label="Profile name" value={profileName} />
                <Field label="Profile email" value={profileEmail} />
                <Field label="Profile phone" value={profilePhone} />
                <Field
                  label="Profile picture exists"
                  value={yesNo(
                    asString(profile.avatar_url) ||
                      asString(profile.profile_photo_url) ||
                      asString(profile.photo_url) ||
                      asString(profile.image_url),
                  )}
                />
                <Field
                  label="ZIP code exists"
                  value={yesNo(
                    asString(profile.zip_code) ||
                      asString(profile.zip) ||
                      asString(profile.postal_code),
                  )}
                />
                <Field
                  label="Service area exists"
                  value={yesNo(
                    asString(profile.service_area) ||
                      asString(profile.local_area) ||
                      asString(profile.city) ||
                      asString(guru?.service_area) ||
                      asString(guru?.city),
                  )}
                />
                <Field
                  label="Referral code"
                  value={referralCode || "Not created"}
                />
                <Field
                  label="Guru profile exists"
                  value={yesNo(Boolean(guru))}
                  helper={
                    guruRows.length > 1
                      ? `${guruRows.length} Guru rows found — review for duplicates.`
                      : undefined
                  }
                />
                <Field
                  label="Ambassador profile exists"
                  value={yesNo(Boolean(ambassador))}
                />
                <Field
                  label="Guru status"
                  value={
                    firstNonEmpty(guru?.status, guru?.application_status) ||
                    "No Guru workspace"
                  }
                />
                <Field
                  label="Account created"
                  value={formatDateTime(authUser?.created_at)}
                />
                <Field
                  label="Last successful login"
                  value={
                    lastLoginAt
                      ? formatDateTime(lastLoginAt)
                      : "No successful login recorded"
                  }
                  helper="Supabase Auth last_sign_in_at."
                />
                <Field
                  label="Last used SitGuru"
                  value={
                    lastUsedAt
                      ? formatDateTime(lastUsedAt)
                      : "No activity recorded"
                  }
                  helper={`Source: ${lastUsedSource}.`}
                />
                <Field
                  label="Sign-in method"
                  value={signInProvider}
                />
                <Field
                  label="Last profile update"
                  value={formatDateTime(profile.updated_at)}
                />
                <Field
                  label="Last Guru update"
                  value={
                    guru
                      ? formatDateTime(guru.updated_at || guru.created_at)
                      : "No Guru workspace"
                  }
                />
              </dl>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-700">
                    Admin actions
                  </p>
                  <h2 className="text-2xl font-black text-slate-950">
                    Contact or continue the review
                  </h2>
                </div>

                <div className="grid gap-2 sm:flex sm:flex-wrap">
                  <Link
                    href={`/messages/new?to=${encodeURIComponent(userId)}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-800 sm:w-auto"
                  >
                    <MessageSquare size={16} />
                    Message in SitGuru
                  </Link>

                  {profileEmail ? (
                    <a
                      href={`mailto:${profileEmail}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-black text-sky-800 transition hover:bg-sky-100 sm:w-auto"
                    >
                      <Mail size={16} />
                      Email
                    </a>
                  ) : null}

                  {profilePhone ? (
                    <a
                      href={`tel:${profilePhone}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                    >
                      <Phone size={16} />
                      Call / Text
                    </a>
                  ) : null}

                  <Link
                    href={completion?.dashboard_url || "/admin"}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                  >
                    <ExternalLink size={16} />
                    User Dashboard
                  </Link>

                  {guru ? (
                    <Link
                      href={guruHref}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-800 transition hover:bg-emerald-100 sm:w-auto"
                    >
                      <UserRound size={16} />
                      Open Guru Record
                    </Link>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                  <StickyNote size={21} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-amber-700">
                    Internal record
                  </p>
                  <h2 className="text-2xl font-black text-slate-950">
                    Admin notes
                  </h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                    Notes are visible to authorized SitGuru staff and identify
                    who wrote them.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {adminNotes.length ? (
                  adminNotes.map((note, index) => (
                    <div
                      key={asString(note.id) || `admin-note-${index}`}
                      className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-amber-800 ring-1 ring-amber-200">
                              {asString(note.note_type).replace(/_/g, " ") ||
                                "general"}
                            </span>
                            {asBoolean(note.is_pinned) ? (
                              <span className="rounded-full bg-amber-600 px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-white">
                                Pinned
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                            {asString(note.note) || "No note text."}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-bold text-slate-500">
                          {formatDateTime(note.created_at)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-amber-100">
                          By:{" "}
                          {firstNonEmpty(
                            note.created_by_name,
                            note.created_by_email,
                          ) || "Unknown Admin"}
                        </span>
                        {asString(note.created_by_email) ? (
                          <span className="break-all rounded-full bg-white px-3 py-1 ring-1 ring-amber-100">
                            {asString(note.created_by_email)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                    <p className="font-black text-slate-800">
                      No Admin notes yet
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                      Notes added through the Admin account-management workflow
                      will appear here with the staff member’s name, email, and
                      time.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <Clock3 size={21} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-700">
                    Audit trail
                  </p>
                  <h2 className="text-2xl font-black text-slate-950">
                    Account activity
                  </h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                    See what changed, when it changed, and who or what recorded
                    the action.
                  </p>
                </div>
              </div>

              <ActivityTimeline items={activityItems} />

              {!lifecycleEvents.length ? (
                <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-semibold leading-5 text-slate-500">
                  Detailed administrator attribution is not available for older
                  actions unless they were written to{" "}
                  <span className="font-black">
                    account_lifecycle_events
                  </span>
                  . The timeline above is safely reconstructed from current
                  profile, Guru, Ambassador, and referral timestamps.
                </p>
              ) : null}
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-800">
                  <MessageSquare size={21} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-sky-700">
                    Outreach record
                  </p>
                  <h2 className="text-2xl font-black text-slate-950">
                    Communication history
                  </h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                    Review the channel, sender, recipient, delivery status, and
                    time for each message.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {communicationLogs.length ? (
                  communicationLogs.map((log, index) => {
                    const channel =
                      firstNonEmpty(log.channel, log.delivery_channel) ||
                      "Message";
                    const status =
                      firstNonEmpty(log.status, log.delivery_status) ||
                      "Recorded";
                    const sender =
                      firstNonEmpty(
                        log.sent_by_name,
                        log.sender_name,
                        log.actor_name,
                        log.sent_by_email,
                        log.sender_email,
                      ) || "SitGuru system";
                    const recipient =
                      firstNonEmpty(
                        log.recipient,
                        log.recipient_email,
                        log.to_email,
                        log.to_phone,
                      ) ||
                      profileEmail ||
                      profilePhone ||
                      "Recipient not recorded";
                    const createdAt =
                      firstNonEmpty(
                        log.sent_at,
                        log.delivered_at,
                        log.created_at,
                      ) || "";
                    const preview =
                      firstNonEmpty(
                        log.preview,
                        log.message_preview,
                        log.body,
                        log.message,
                      ) || "";

                    return (
                      <div
                        key={asString(log.id) || `communication-${index}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-black text-slate-950">
                                {channel}
                              </span>
                              <span
                                className={[
                                  "rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em]",
                                  getStatusClasses(status),
                                ].join(" ")}
                              >
                                {status}
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-black text-slate-900">
                              {firstNonEmpty(log.subject, log.title) ||
                                "No subject"}
                            </p>
                            {preview ? (
                              <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">
                                {preview}
                              </p>
                            ) : null}
                          </div>

                          <p className="shrink-0 text-xs font-bold text-slate-500">
                            {formatDateTime(createdAt)}
                          </p>
                        </div>

                        <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-500 sm:grid-cols-2">
                          <p>
                            <span className="font-black text-slate-700">
                              Sent by:
                            </span>{" "}
                            {sender}
                          </p>
                          <p className="break-words">
                            <span className="font-black text-slate-700">
                              Sent to:
                            </span>{" "}
                            {recipient}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                    <p className="font-black text-slate-800">
                      No communication logs yet
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                      Email, SMS, and SitGuru messages will appear here when the
                      sending workflow records them in communication_logs.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}