import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type GuruRow = Record<string, unknown>;
type ProfileRow = Record<string, unknown>;
type LaunchSignupRow = Record<string, unknown>;
type BackgroundCheckRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type GuruApplicationRow = {
  id: string;
  name: string;
  specialty: string;
  location: string;
  experience: string;
  status: string;
  joined: string;
  href: string;
  backgroundCheckStatus: string;
  backgroundCheckLabel: string;
  checkrCandidateId: string;
  checkrInvitationId: string;
  checkrReportId: string;
  checkrInvitationUrl: string;
  checkrLastWebhookAt: string;
};

type GuruOnboardingStep = {
  step: number;
  title: string;
  count: number;
  total: number;
  percent: number;
  missingCount: number;
  description: string;
  reachedHref: string;
  missingHref: string;
};

const BACKGROUND_CHECK_STATUS_OPTIONS = [
  "not_started",
  "invited",
  "pending",
  "clear",
  "consider",
  "suspended",
  "canceled",
  "failed",
];

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

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

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function formatDateShort(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTimeShort(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isWithinLastDays(value: unknown, days: number) {
  const dateValue = asTrimmedString(value);

  if (!dateValue) return false;

  const parsed = new Date(dateValue);

  if (Number.isNaN(parsed.getTime())) return false;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return parsed >= cutoff;
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Guru approvals query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Guru approvals query skipped for ${label}:`, error);
    return [];
  }
}

function getGuruId(guru: GuruRow) {
  return (
    asTrimmedString(guru.id) ||
    asTrimmedString(guru.user_id) ||
    asTrimmedString(guru.profile_id) ||
    asTrimmedString(guru.email).toLowerCase()
  );
}

function getGuruName(guru: GuruRow, profile?: ProfileRow) {
  return (
    asTrimmedString(guru.display_name) ||
    asTrimmedString(guru.full_name) ||
    asTrimmedString(guru.name) ||
    asTrimmedString(profile?.display_name) ||
    asTrimmedString(profile?.full_name) ||
    asTrimmedString(profile?.name) ||
    asTrimmedString(guru.email).split("@")[0] ||
    asTrimmedString(profile?.email).split("@")[0] ||
    "Guru Applicant"
  );
}

function getGuruEmail(guru: GuruRow, profile?: ProfileRow) {
  return asTrimmedString(guru.email) || asTrimmedString(profile?.email) || "";
}

function getGuruLocation(guru: GuruRow, profile?: ProfileRow) {
  const city =
    asTrimmedString(guru.city) ||
    asTrimmedString(profile?.city) ||
    asTrimmedString(guru.service_city);

  const state =
    asTrimmedString(guru.state) ||
    asTrimmedString(profile?.state) ||
    asTrimmedString(guru.service_state);

  return [city, state].filter(Boolean).join(", ") || "Location not listed";
}

function getGuruServices(guru: GuruRow) {
  const services = guru.services;

  if (Array.isArray(services) && services.length > 0) {
    return services
      .map((service) => String(service).trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(" • ");
  }

  return (
    asTrimmedString(guru.service) ||
    asTrimmedString(guru.service_name) ||
    asTrimmedString(guru.specialty) ||
    asTrimmedString(guru.title) ||
    "Pet Care"
  );
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

function hasGuruServiceData(guru: GuruRow) {
  const services = guru.services;

  const hasServices =
    Array.isArray(services) && services.length > 0
      ? true
      : Boolean(
          asTrimmedString(guru.service) ||
            asTrimmedString(guru.service_name) ||
            asTrimmedString(guru.specialty) ||
            asTrimmedString(guru.title),
        );

  const hasLocation = Boolean(
    asTrimmedString(guru.city) ||
      asTrimmedString(guru.state) ||
      asTrimmedString(guru.service_city) ||
      asTrimmedString(guru.service_state),
  );

  const hasRadius = Boolean(
    toNumber(guru.service_radius_miles) ||
      toNumber(guru.radius_miles) ||
      toNumber(guru.travel_radius) ||
      toNumber(guru.max_travel_miles),
  );

  const hasRates = Boolean(
    toNumber(guru.hourly_rate) ||
      toNumber(guru.rate) ||
      toNumber(guru.price) ||
      toNumber(guru.base_rate),
  );

  return hasServices && hasLocation && (hasRadius || hasRates);
}

function hasGuruProfileStarted(guru: GuruRow, profile?: ProfileRow) {
  return Boolean(
    getGuruEmail(guru, profile) ||
      asTrimmedString(guru.created_at) ||
      asTrimmedString(guru.user_id) ||
      asTrimmedString(guru.profile_id) ||
      getGuruId(guru),
  );
}

function hasGuruProfileReady(guru: GuruRow, profile?: ProfileRow) {
  const hasName = Boolean(getGuruName(guru, profile));
  const hasBio = Boolean(
    asTrimmedString(guru.bio) || asTrimmedString(profile?.bio),
  );
  const hasExperience = getGuruExperience(guru) !== "Not listed";
  const hasPhoto = Boolean(
    asTrimmedString(guru.avatar_url) ||
      asTrimmedString(guru.profile_photo_url) ||
      asTrimmedString(guru.photo_url) ||
      asTrimmedString(guru.image_url) ||
      asTrimmedString(profile?.avatar_url) ||
      asTrimmedString(profile?.profile_photo_url),
  );

  return hasName && hasBio && hasExperience && hasPhoto && hasGuruServiceData(guru);
}

function getBackgroundCheckStatus(guru: GuruRow, check?: BackgroundCheckRow) {
  return (
    asTrimmedString(guru.background_check_status) ||
    asTrimmedString(check?.status) ||
    "not_started"
  );
}

function hasGuruCheckrStarted(guru: GuruRow, check?: BackgroundCheckRow) {
  const status = getBackgroundCheckStatus(guru, check);

  return Boolean(
    status !== "not_started" ||
      asTrimmedString(guru.checkr_package_slug) ||
      asTrimmedString(check?.package_slug) ||
      asTrimmedString(guru.checkr_candidate_id) ||
      asTrimmedString(check?.checkr_candidate_id) ||
      asTrimmedString(guru.checkr_invitation_id) ||
      asTrimmedString(check?.checkr_invitation_id) ||
      asTrimmedString(guru.checkr_report_id) ||
      asTrimmedString(check?.checkr_report_id) ||
      asTrimmedString(guru.checkr_invitation_url) ||
      asTrimmedString(check?.invitation_url),
  );
}

function isGuruApproved(guru: GuruRow) {
  const status = (
    asTrimmedString(guru.status) ||
    asTrimmedString(guru.approval_status) ||
    asTrimmedString(guru.application_status)
  ).toLowerCase();

  return (
    Boolean(guru.is_approved || guru.approved) ||
    status.includes("approved") ||
    status.includes("active") ||
    status.includes("verified") ||
    status.includes("bookable")
  );
}

function isGuruVerified(guru: GuruRow) {
  return Boolean(guru.is_verified || guru.verified);
}

function isGuruPublic(guru: GuruRow) {
  return Boolean(guru.is_public || guru.public);
}

function isGuruActive(guru: GuruRow) {
  return guru.is_active !== false && guru.active !== false;
}

function isGuruBookable(guru: GuruRow) {
  const status = (
    asTrimmedString(guru.status) ||
    asTrimmedString(guru.application_status)
  ).toLowerCase();

  return (
    toBoolean(guru.is_bookable) ||
    status === "bookable" ||
    status === "active"
  );
}

function isGuruFlagged(guru: GuruRow) {
  const status = (
    asTrimmedString(guru.status) ||
    asTrimmedString(guru.approval_status) ||
    asTrimmedString(guru.application_status) ||
    asTrimmedString(guru.risk_level)
  ).toLowerCase();

  return (
    Boolean(guru.flagged || guru.is_flagged || guru.needs_review) ||
    status.includes("flag") ||
    status.includes("suspend") ||
    status.includes("reject")
  );
}

function needsProfileUpdate(guru: GuruRow) {
  const hasName = Boolean(
    asTrimmedString(guru.display_name) ||
      asTrimmedString(guru.full_name) ||
      asTrimmedString(guru.name),
  );

  const hasBio = Boolean(asTrimmedString(guru.bio));
  const hasLocation = Boolean(
    asTrimmedString(guru.city) || asTrimmedString(guru.state),
  );
  const hasServices =
    Array.isArray(guru.services) && guru.services.length > 0
      ? true
      : Boolean(
          asTrimmedString(guru.service) ||
            asTrimmedString(guru.service_name) ||
            asTrimmedString(guru.specialty),
        );

  return !hasName || !hasBio || !hasLocation || !hasServices;
}

function getGuruApprovalStatus(guru: GuruRow) {
  const rawStatus = (
    asTrimmedString(guru.approval_status) ||
    asTrimmedString(guru.application_status) ||
    asTrimmedString(guru.status)
  ).toLowerCase();

  if (isGuruFlagged(guru)) return "Flagged";
  if (rawStatus.includes("credential")) return "Credential Review";
  if (needsProfileUpdate(guru)) return "Profile Update Needed";
  if (isGuruApproved(guru) || isGuruVerified(guru) || isGuruPublic(guru)) {
    return "Ready";
  }
  if (rawStatus.includes("pending")) return "New Application";
  if (rawStatus.includes("review")) return "Credential Review";

  return "New Application";
}

function getBackgroundCheckLabel(status: string) {
  switch (status) {
    case "clear":
      return "Clear";
    case "consider":
      return "Needs Review";
    case "invited":
      return "Invited";
    case "pending":
      return "Pending";
    case "suspended":
      return "Suspended";
    case "canceled":
      return "Canceled";
    case "failed":
      return "Failed";
    default:
      return "Not Started";
  }
}

function backgroundCheckClasses(status: string) {
  switch (status) {
    case "clear":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "consider":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "invited":
    case "pending":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "suspended":
    case "canceled":
    case "failed":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getProfileKey(profile: ProfileRow) {
  return (
    asTrimmedString(profile.id) ||
    asTrimmedString(profile.user_id) ||
    asTrimmedString(profile.profile_id) ||
    asTrimmedString(profile.email).toLowerCase()
  );
}

function getGuruProfileKey(guru: GuruRow) {
  return (
    asTrimmedString(guru.user_id) ||
    asTrimmedString(guru.profile_id) ||
    asTrimmedString(guru.id) ||
    asTrimmedString(guru.email).toLowerCase()
  );
}

function getLaunchRole(row: LaunchSignupRow) {
  return (
    asTrimmedString(row.role) ||
    asTrimmedString(row.interest_type) ||
    asTrimmedString(row.interestType) ||
    asTrimmedString(row.joining_as) ||
    asTrimmedString(row.user_type) ||
    asTrimmedString(row.segment)
  ).toLowerCase();
}

function getLaunchIdentity(row: LaunchSignupRow) {
  return (
    asTrimmedString(row.id) ||
    asTrimmedString(row.email).toLowerCase() ||
    asTrimmedString(row.user_id) ||
    asTrimmedString(row.created_at)
  );
}

function mergeLaunchRows(...groups: LaunchSignupRow[][]) {
  const seen = new Set<string>();
  const merged: LaunchSignupRow[] = [];

  for (const group of groups) {
    for (const row of group) {
      const key = getLaunchIdentity(row);

      if (key && seen.has(key)) continue;
      if (key) seen.add(key);

      merged.push(row);
    }
  }

  return merged;
}

function adminGuruHref(params: Record<string, string>) {
  const search = new URLSearchParams(params);
  return `/admin/gurus?${search.toString()}`;
}

function adminGuruReviewHref(id: string) {
  return id ? `/admin/gurus/${encodeURIComponent(id)}` : "/admin/gurus";
}

function statusClasses(status: string) {
  switch (status) {
    case "Ready":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Credential Review":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "Profile Update Needed":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Flagged":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "New Application":
      return "border-violet-200 bg-violet-50 text-violet-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getSiteUrl() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";

  if (siteUrl.startsWith("http://") || siteUrl.startsWith("https://")) {
    return siteUrl;
  }

  return `https://${siteUrl}`;
}

async function startCheckrInvite(formData: FormData) {
  "use server";

  const guruId = String(formData.get("guruId") || "");

  if (!guruId) return;

  try {
    await fetch(`${getSiteUrl()}/api/checkr/create-invitation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ guruId }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("Failed to start Checkr invite from admin:", error);
  }

  revalidatePath("/admin/guru-approvals");
  revalidatePath("/admin/gurus");
  revalidatePath("/admin/background-checks");
}

async function updateBackgroundCheckStatus(formData: FormData) {
  "use server";

  const guruId = String(formData.get("guruId") || "");
  const status = String(formData.get("backgroundCheckStatus") || "");

  if (!guruId || !BACKGROUND_CHECK_STATUS_OPTIONS.includes(status)) return;

  const now = new Date().toISOString();

  const completedAt =
    status === "clear" ||
    status === "consider" ||
    status === "failed" ||
    status === "canceled"
      ? now
      : null;

  await supabaseAdmin
    .from("gurus")
    .update({
      background_check_status: status,
      background_check_completed_at: completedAt,
      checkr_last_webhook_at: now,
    })
    .eq("id", guruId);

  await supabaseAdmin.from("guru_background_checks").upsert(
    {
      guru_id: guruId,
      status,
      completed_at: completedAt,
      last_webhook_at: now,
    },
    {
      onConflict: "guru_id",
    },
  );

  revalidatePath("/admin/guru-approvals");
  revalidatePath("/admin/gurus");
  revalidatePath("/admin/background-checks");
}

function AdminNavButton({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  if (primary) {
    return (
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
    >
      {label}
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
        Use these shortcuts to move between Guru reviews, Checkr background
        checks, filtered application lists, and the main Admin dashboard.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <AdminNavButton href="/admin" label="Admin Home" />
        <AdminNavButton href="/admin/guru-approvals" label="Guru Approvals" />
        <AdminNavButton
          href="/admin/background-checks"
          label="Background Checks"
          primary
        />
        <AdminNavButton href="/admin/gurus" label="All Guru Records" />
        <AdminNavButton
          href="/admin/gurus?queue=pending-reviews"
          label="Pending Reviews"
        />
        <AdminNavButton
          href="/admin/gurus?queue=approved-this-week"
          label="Approved This Week"
        />
        <AdminNavButton
          href="/admin/gurus?queue=profile-updates"
          label="Need Profile Updates"
        />
        <AdminNavButton
          href="/admin/gurus?queue=flagged-review"
          label="Flagged Review"
        />
        <AdminNavButton
          href="/admin/gurus?status=bookable"
          label="Bookable Gurus"
        />
      </div>
    </section>
  );
}

function GuruOnboardingProgressSection({
  steps,
}: {
  steps: GuruOnboardingStep[];
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
            Guru Onboarding Progress
          </p>

          <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
            Rollup by 5-step Guru setup funnel
          </h3>

          <p className="mt-2 max-w-4xl text-sm font-semibold leading-7 text-slate-600">
            See each step as a conversion percentage out of total Gurus, then use
            the missing-step queue to identify exactly who needs Admin follow-up
            to move forward.
          </p>
        </div>

        <Link
          href="/admin/gurus"
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
        >
          Open all Guru records
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {steps.map((step) => (
          <div
            key={step.step}
            className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                Step {step.step}
              </span>

              <span className="text-3xl font-black tracking-tight text-slate-950">
                {step.percent}%
              </span>
            </div>

            <h4 className="mt-4 text-lg font-black text-slate-950">
              {step.title}
            </h4>

            <div className="mt-4 rounded-2xl border border-white bg-white p-4">
              <p className="text-2xl font-black text-slate-950">
                {step.count.toLocaleString()} / {step.total.toLocaleString()}
              </p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                {step.percent}% complete
              </p>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.max(3, step.percent)}%` }}
                />
              </div>
            </div>

            <p className="mt-4 min-h-[72px] text-sm font-semibold leading-6 text-slate-600">
              {step.description}
            </p>

            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-black text-amber-800">
                {step.missingCount.toLocaleString()} Guru
                {step.missingCount === 1 ? "" : "s"} missing this step
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-amber-700">
                Use this to see who needs to be moved along.
              </p>
            </div>

            <div className="mt-4 grid gap-2">
              <Link
                href={step.reachedHref}
                className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
              >
                View reached step →
              </Link>

              <Link
                href={step.missingHref}
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700"
              >
                View missing this step →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

async function getGuruApprovalData() {
  const [gurus, profiles, launchSignups, launchWaitlist, backgroundChecks] =
    await Promise.all([
      safeRows<GuruRow>(
        supabaseAdmin
          .from("gurus")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1000),
        "gurus",
      ),
      safeRows<ProfileRow>(
        supabaseAdmin
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1000),
        "profiles",
      ),
      safeRows<LaunchSignupRow>(
        supabaseAdmin
          .from("launch_signups")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1000),
        "launch_signups",
      ),
      safeRows<LaunchSignupRow>(
        supabaseAdmin
          .from("launch_waitlist")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1000),
        "launch_waitlist",
      ),
      safeRows<BackgroundCheckRow>(
        supabaseAdmin
          .from("guru_background_checks")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1000),
        "guru_background_checks",
      ),
    ]);

  const profileMap = new Map<string, ProfileRow>();

  for (const profile of profiles) {
    const key = getProfileKey(profile);

    if (key) {
      profileMap.set(key, profile);
    }
  }

  const backgroundCheckMap = new Map<string, BackgroundCheckRow>();

  for (const check of backgroundChecks) {
    const guruId = asTrimmedString(check.guru_id);

    if (guruId) {
      backgroundCheckMap.set(guruId, check);
    }
  }

  const guruLaunchLeads = mergeLaunchRows(launchSignups, launchWaitlist).filter(
    (row) => {
      const role = getLaunchRole(row);
      return role.includes("guru") || role.includes("both");
    },
  );

  const applications: GuruApplicationRow[] = gurus.map((guru) => {
    const id = getGuruId(guru);
    const profile = profileMap.get(getGuruProfileKey(guru));
    const check = backgroundCheckMap.get(id);
    const status = getGuruApprovalStatus(guru);
    const backgroundCheckStatus = getBackgroundCheckStatus(guru, check);

    return {
      id: id || "guru",
      name: getGuruName(guru, profile),
      specialty: getGuruServices(guru),
      location: getGuruLocation(guru, profile),
      experience: getGuruExperience(guru),
      status,
      joined: formatDateShort(asTrimmedString(guru.created_at)),
      href: adminGuruReviewHref(id),
      backgroundCheckStatus,
      backgroundCheckLabel: getBackgroundCheckLabel(backgroundCheckStatus),
      checkrCandidateId:
        asTrimmedString(guru.checkr_candidate_id) ||
        asTrimmedString(check?.checkr_candidate_id),
      checkrInvitationId:
        asTrimmedString(guru.checkr_invitation_id) ||
        asTrimmedString(check?.checkr_invitation_id),
      checkrReportId:
        asTrimmedString(guru.checkr_report_id) ||
        asTrimmedString(check?.checkr_report_id),
      checkrInvitationUrl:
        asTrimmedString(guru.checkr_invitation_url) ||
        asTrimmedString(check?.invitation_url),
      checkrLastWebhookAt:
        asTrimmedString(guru.checkr_last_webhook_at) ||
        asTrimmedString(check?.last_webhook_at),
    };
  });

  const step1Started = gurus.filter((guru) => {
    const profile = profileMap.get(getGuruProfileKey(guru));
    return hasGuruProfileStarted(guru, profile);
  });

  const step2Services = gurus.filter((guru) => hasGuruServiceData(guru));

  const step3ProfileReady = gurus.filter((guru) => {
    const profile = profileMap.get(getGuruProfileKey(guru));
    return hasGuruProfileReady(guru, profile);
  });

  const step4CheckrStarted = gurus.filter((guru) => {
    const id = getGuruId(guru);
    const check = backgroundCheckMap.get(id);
    return hasGuruCheckrStarted(guru, check);
  });

  const step5Bookable = gurus.filter((guru) => {
    return isGuruBookable(guru) || getGuruApprovalStatus(guru) === "Ready";
  });

  const totalGurus = gurus.length;

  const buildStep = ({
    step,
    title,
    count,
    description,
  }: {
    step: number;
    title: string;
    count: number;
    description: string;
  }): GuruOnboardingStep => {
    const missingCount = Math.max(0, totalGurus - count);

    return {
      step,
      title,
      count,
      total: totalGurus,
      percent: percent(count, totalGurus),
      missingCount,
      description,
      reachedHref: adminGuruHref({ setupStep: String(step) }),
      missingHref:
        step === 1
          ? adminGuruHref({ setupStep: "0" })
          : adminGuruHref({ stuckBeforeStep: String(step) }),
    };
  };

  const pendingApplications = applications.filter(
    (application) => application.status !== "Ready",
  );

  const readyApplications = applications.filter(
    (application) => application.status === "Ready",
  );

  const credentialReview = applications.filter(
    (application) => application.status === "Credential Review",
  );

  const profileUpdates = applications.filter(
    (application) => application.status === "Profile Update Needed",
  );

  const flagged = applications.filter(
    (application) => application.status === "Flagged",
  );

  const newApplications = applications.filter(
    (application) => application.status === "New Application",
  );

  const backgroundNotStarted = applications.filter(
    (application) => application.backgroundCheckStatus === "not_started",
  );

  const backgroundInvitedOrPending = applications.filter(
    (application) =>
      application.backgroundCheckStatus === "invited" ||
      application.backgroundCheckStatus === "pending",
  );

  const backgroundClear = applications.filter(
    (application) => application.backgroundCheckStatus === "clear",
  );

  const backgroundNeedsReview = applications.filter(
    (application) =>
      application.backgroundCheckStatus === "consider" ||
      application.backgroundCheckStatus === "suspended" ||
      application.backgroundCheckStatus === "failed" ||
      application.backgroundCheckStatus === "canceled",
  );

  const approvedThisWeek = gurus.filter(
    (guru) =>
      isGuruApproved(guru) &&
      (isWithinLastDays(guru.approved_at, 7) ||
        isWithinLastDays(guru.bookable_at, 7) ||
        isWithinLastDays(guru.updated_at, 7) ||
        isWithinLastDays(guru.created_at, 7)),
  );

  const pendingReviews =
    pendingApplications.length ||
    Math.max(0, gurus.length - readyApplications.length);

  const tableRows =
    pendingApplications.length > 0
      ? pendingApplications
      : applications.slice(0, 12);

  return {
    onboardingSteps: [
      buildStep({
        step: 1,
        title: "Account / Profile Started",
        count: step1Started.length,
        description:
          "Guru record exists with account identity, email, or profile linkage started.",
      }),
      buildStep({
        step: 2,
        title: "Services / Area Added",
        count: step2Services.length,
        description:
          "Guru has service, location, radius, or pricing information needed for care setup.",
      }),
      buildStep({
        step: 3,
        title: "Profile Ready",
        count: step3ProfileReady.length,
        description:
          "Guru has stronger public profile details including bio, experience, photo, and services.",
      }),
      buildStep({
        step: 4,
        title: "Checkr / Trust Started",
        count: step4CheckrStarted.length,
        description:
          "Guru has started the Trust & Safety background check workflow or has Checkr data.",
      }),
      buildStep({
        step: 5,
        title: "Approved / Bookable",
        count: step5Bookable.length,
        description:
          "Guru is approved, ready, active, or bookable for customer-facing care flow.",
      }),
    ],
    stats: [
      {
        label: "Pending Reviews",
        value: pendingReviews.toLocaleString(),
        detail: "Guru records waiting on approval or review",
        href: adminGuruHref({ queue: "pending-reviews" }),
      },
      {
        label: "Approved This Week",
        value: approvedThisWeek.length.toLocaleString(),
        detail: "New Gurus cleared or updated recently",
        href: adminGuruHref({ queue: "approved-this-week" }),
      },
      {
        label: "Need Profile Updates",
        value: profileUpdates.length.toLocaleString(),
        detail: "Applicants missing key public profile info",
        href: adminGuruHref({ queue: "profile-updates" }),
      },
      {
        label: "Flagged for Review",
        value: flagged.length.toLocaleString(),
        detail: "Requires trust or quality follow-up",
        href: adminGuruHref({ queue: "flagged-review" }),
      },
    ],
    backgroundStats: [
      {
        label: "Not Started",
        value: backgroundNotStarted.length.toLocaleString(),
        detail: "Gurus who still need a Checkr invite",
        href: "/admin/background-checks?status=not_started",
      },
      {
        label: "Invited / Pending",
        value: backgroundInvitedOrPending.length.toLocaleString(),
        detail: "Checkr invite sent or report processing",
        href: "/admin/background-checks?status=pending",
      },
      {
        label: "Clear",
        value: backgroundClear.length.toLocaleString(),
        detail: "Gurus cleared by Checkr",
        href: "/admin/background-checks?status=clear",
      },
      {
        label: "Needs Review",
        value: backgroundNeedsReview.length.toLocaleString(),
        detail: "Checkr status requires Admin attention",
        href: "/admin/background-checks?status=review",
      },
    ],
    pipelineCards: [
      {
        title: "New Applications",
        count: newApplications.length,
        description:
          "Fresh Guru records that need initial review, identity checks, and profile validation.",
        href: adminGuruHref({ status: "new" }),
      },
      {
        title: "Credential Review",
        count: credentialReview.length,
        description:
          "Applications awaiting experience, expertise, certification, or care background review.",
        href: adminGuruHref({ status: "credential-review" }),
      },
      {
        title: "Profile Quality",
        count: profileUpdates.length,
        description:
          "Profiles that need better service descriptions, location, bio, pricing, or public presentation.",
        href: adminGuruHref({ filter: "profile-quality" }),
      },
      {
        title: "Ready to Approve",
        count: readyApplications.length,
        description:
          "Guru profiles that look launch-ready and can move live after final approval.",
        href: adminGuruHref({ status: "ready" }),
      },
    ],
    tableRows,
    totals: {
      gurus: gurus.length,
      launchGuruLeads: guruLaunchLeads.length,
      ready: readyApplications.length,
      active: gurus.filter(isGuruActive).length,
      backgroundNotStarted: backgroundNotStarted.length,
      backgroundInvitedOrPending: backgroundInvitedOrPending.length,
      backgroundClear: backgroundClear.length,
      backgroundNeedsReview: backgroundNeedsReview.length,
    },
  };
}

const reviewChecklist = [
  "Confirm profile quality and public-facing presentation",
  "Validate services, pricing, and availability setup",
  "Review specialties, expertise, and bio clarity",
  "Start or review Checkr background check status",
  "Approve only profiles ready to convert customer trust",
];

export default async function AdminGuruApprovalsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const approvalData = await getGuruApprovalData();

  return (
    <main className="space-y-8">
      <AdminNavigationPanel />

      <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.13),transparent_28%),linear-gradient(135deg,#ecfdf5_0%,#ffffff_52%,#f8fafc_100%)] p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
              Guru Approvals
            </span>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Review, background check, and launch trusted SitGuru experts
            </h2>

            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-700 sm:text-base">
              This page is wired to live SitGuru Guru records, profiles,
              Guru-interest launch leads, and Checkr background check tracking
              so Admin can control the full approval workflow.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/gurus"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
            >
              All Guru Records
            </Link>

            <Link
              href="/admin/background-checks"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
            >
              Checkr Control
            </Link>

            <Link
              href="/admin/gurus?status=bookable"
              className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
            >
              Bookable Gurus
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {approvalData.stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
            >
              <p className="text-sm font-black text-slate-500">{stat.label}</p>
              <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                {stat.value}
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                {stat.detail}
              </p>
              <p className="mt-4 text-sm font-black text-emerald-700">
                Open queue →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <GuruOnboardingProgressSection steps={approvalData.onboardingSteps} />

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
              Checkr Control
            </p>

            <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
              Background check command center
            </h3>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-slate-600">
              Start Checkr invitations directly from the approval table, monitor
              pending reports, and manually override status when Admin review is
              required.
            </p>
          </div>

          <Link
            href="/admin/background-checks"
            className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
          >
            Open Full Background Check Page
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {approvalData.backgroundStats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-emerald-200 hover:bg-emerald-50"
            >
              <p className="text-sm font-black text-slate-500">{stat.label}</p>
              <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                {stat.value}
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                {stat.detail}
              </p>
              <p className="mt-4 text-sm font-black text-emerald-700">
                Manage Checkr →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.25fr_0.85fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black tracking-tight text-slate-950">
                Approval pipeline
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                Organize Guru reviews by readiness and quality stage.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {approvalData.pipelineCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                <div className="flex items-start justify-between gap-4">
                  <h4 className="text-lg font-black text-slate-950">
                    {card.title}
                  </h4>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">
                    {card.count.toLocaleString()}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                  {card.description}
                </p>
                <div className="mt-5 text-sm font-black text-emerald-700">
                  Open SitGuru records →
                </div>
              </Link>
            ))}
          </div>

          <Link
            href="/admin/launch-signups?filter=guru"
            className="mt-6 block rounded-3xl border border-sky-200 bg-sky-50 p-5 transition hover:border-sky-300 hover:bg-sky-100"
          >
            <p className="text-sm font-black text-sky-800">
              Launch lead signal
            </p>
            <p className="mt-2 text-sm font-semibold leading-7 text-sky-700">
              {approvalData.totals.launchGuruLeads.toLocaleString()} launch
              signup lead
              {approvalData.totals.launchGuruLeads === 1 ? "" : "s"} indicated
              interest in becoming a Guru or selected both customer and Guru.
            </p>
            <p className="mt-4 text-sm font-black text-sky-800">
              Open Guru-interest leads →
            </p>
          </Link>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-2xl font-black tracking-tight text-slate-950">
            Review checklist
          </h3>
          <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">
            Keep Guru approvals aligned with quality, trust, background checks,
            and conversion.
          </p>

          <div className="mt-6 space-y-3">
            {reviewChecklist.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm font-semibold leading-6 text-slate-700">
                  {item}
                </p>
              </div>
            ))}
          </div>

          <Link
            href="/admin/background-checks"
            className="mt-6 block rounded-3xl border border-emerald-200 bg-emerald-50 p-5 transition hover:bg-emerald-100"
          >
            <p className="text-sm font-black text-emerald-800">
              Background checks now live here
            </p>
            <p className="mt-2 text-sm font-semibold leading-7 text-emerald-700">
              Admin can start Checkr invites, monitor webhook status, review
              consider reports, and keep Gurus from becoming bookable until
              their background check status is clear.
            </p>
            <p className="mt-4 text-sm font-black text-emerald-800">
              Open Checkr control →
            </p>
          </Link>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-slate-950">
              Pending Guru applications
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              Prioritize approval decisions based on readiness, trust, and Checkr
              background check status.
            </p>
          </div>

          <Link
            href="/admin/gurus?queue=pending-reviews"
            className="text-sm font-black text-emerald-700 transition hover:text-emerald-800 hover:underline"
          >
            View pending queue →
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Guru
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Services
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Location
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Experience
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Application
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Background
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Checkr
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Joined
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {approvalData.tableRows.length ? (
                  approvalData.tableRows.map((application) => (
                    <tr
                      key={`${application.id}-${application.name}`}
                      className="transition hover:bg-emerald-50/40"
                    >
                      <td className="px-5 py-5 align-top">
                        <div className="font-black text-slate-950">
                          {application.name}
                        </div>
                        <div className="mt-1 break-all text-xs font-semibold text-slate-500">
                          {application.id}
                        </div>
                      </td>

                      <td className="px-5 py-5 align-top font-semibold text-slate-700">
                        {application.specialty}
                      </td>

                      <td className="px-5 py-5 align-top font-semibold text-slate-700">
                        {application.location}
                      </td>

                      <td className="px-5 py-5 align-top font-semibold text-slate-700">
                        {application.experience}
                      </td>

                      <td className="px-5 py-5 align-top">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClasses(
                            application.status,
                          )}`}
                        >
                          {application.status}
                        </span>
                      </td>

                      <td className="px-5 py-5 align-top">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${backgroundCheckClasses(
                            application.backgroundCheckStatus,
                          )}`}
                        >
                          {application.backgroundCheckLabel}
                        </span>

                        {application.checkrLastWebhookAt ? (
                          <p className="mt-2 text-xs font-semibold text-slate-500">
                            Last webhook:{" "}
                            {formatDateTimeShort(
                              application.checkrLastWebhookAt,
                            )}
                          </p>
                        ) : null}
                      </td>

                      <td className="px-5 py-5 align-top">
                        <div className="flex flex-col gap-3">
                          <form action={startCheckrInvite}>
                            <input
                              type="hidden"
                              name="guruId"
                              value={application.id}
                            />
                            <button
                              type="submit"
                              className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-700"
                            >
                              Start Checkr
                            </button>
                          </form>

                          {application.checkrInvitationUrl ? (
                            <Link
                              href={application.checkrInvitationUrl}
                              className="inline-flex w-full items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs font-black text-sky-700 transition hover:bg-sky-100"
                            >
                              Open Invite
                            </Link>
                          ) : null}

                          <form action={updateBackgroundCheckStatus}>
                            <input
                              type="hidden"
                              name="guruId"
                              value={application.id}
                            />
                            <select
                              name="backgroundCheckStatus"
                              defaultValue={application.backgroundCheckStatus}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                            >
                              {BACKGROUND_CHECK_STATUS_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {getBackgroundCheckLabel(option)}
                                </option>
                              ))}
                            </select>

                            <button
                              type="submit"
                              className="mt-2 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                            >
                              Save Status
                            </button>
                          </form>
                        </div>
                      </td>

                      <td className="px-5 py-5 align-top font-semibold text-slate-700">
                        {application.joined}
                      </td>

                      <td className="px-5 py-5 align-top text-right">
                        <Link
                          href={application.href}
                          className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-10 text-center text-sm font-semibold text-slate-500"
                    >
                      No Guru applications found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}