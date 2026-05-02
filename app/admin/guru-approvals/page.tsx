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

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

function getBackgroundCheckStatus(guru: GuruRow, check?: BackgroundCheckRow) {
  return (
    asTrimmedString(guru.background_check_status) ||
    asTrimmedString(check?.status) ||
    "not_started"
  );
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
      return "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20";
    case "consider":
      return "bg-amber-400/10 text-amber-300 ring-amber-400/20";
    case "invited":
    case "pending":
      return "bg-blue-400/10 text-blue-300 ring-blue-400/20";
    case "suspended":
    case "canceled":
    case "failed":
      return "bg-rose-400/10 text-rose-300 ring-rose-400/20";
    default:
      return "bg-slate-400/10 text-slate-300 ring-slate-400/20";
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
      return "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20";
    case "Credential Review":
      return "bg-blue-400/10 text-blue-300 ring-blue-400/20";
    case "Profile Update Needed":
      return "bg-amber-400/10 text-amber-300 ring-amber-400/20";
    case "Flagged":
      return "bg-rose-400/10 text-rose-300 ring-rose-400/20";
    case "New Application":
      return "bg-violet-400/10 text-violet-300 ring-violet-400/20";
    default:
      return "bg-slate-400/10 text-slate-300 ring-slate-400/20";
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

  const guruPatch: Record<string, unknown> = {
    background_check_status: status,
    background_check_completed_at: completedAt,
    checkr_last_webhook_at: now,
  };

  await supabaseAdmin.from("gurus").update(guruPatch).eq("id", guruId);

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
        className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
    >
      {label}
    </Link>
  );
}

function AdminNavigationPanel() {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
        Admin Navigation
      </p>

      <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
        Move between Guru approval pages
      </h2>

      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
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
        <AdminNavButton href="/admin/gurus?status=new" label="New Applications" />
        <AdminNavButton
          href="/admin/gurus?status=pending"
          label="Pending Reviews"
        />
        <AdminNavButton href="/admin/gurus?status=needs-info" label="Needs Info" />
        <AdminNavButton
          href="/admin/gurus?status=verification"
          label="Verification"
        />
        <AdminNavButton href="/admin/gurus?status=bookable" label="Bookable Gurus" />
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
    stats: [
      {
        label: "Pending Reviews",
        value: pendingReviews.toLocaleString(),
        detail: "Guru records waiting on approval or review",
        href: adminGuruHref({ status: "pending" }),
      },
      {
        label: "Approved This Week",
        value: approvedThisWeek.length.toLocaleString(),
        detail: "New Gurus cleared or updated recently",
        href: adminGuruHref({ status: "approved", range: "week" }),
      },
      {
        label: "Need Profile Updates",
        value: profileUpdates.length.toLocaleString(),
        detail: "Applicants missing key public profile info",
        href: adminGuruHref({ filter: "profile-updates" }),
      },
      {
        label: "Flagged for Review",
        value: flagged.length.toLocaleString(),
        detail: "Requires trust or quality follow-up",
        href: "/admin/moderation?type=guru&status=flagged",
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
        detail: "Checkr status requires admin attention",
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

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_24%),linear-gradient(180deg,#0f172a_0%,#020617_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Guru Approvals
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Review, background check, and launch trusted SitGuru experts
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              This page is wired to live SitGuru Guru records, profiles,
              Guru-interest launch leads, and Checkr background check tracking
              so admin can control the full approval workflow.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/gurus"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              All Guru Records
            </Link>
            <Link
              href="/admin/background-checks"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Checkr Control
            </Link>
            <Link
              href="/admin/gurus?status=bookable"
              className="rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
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
              className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-400/30 hover:bg-white/10"
            >
              <p className="text-sm font-medium text-slate-400">{stat.label}</p>
              <p className="mt-3 text-3xl font-black tracking-tight text-white">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-slate-400">{stat.detail}</p>
              <p className="mt-4 text-sm font-semibold text-emerald-300">
                Open SitGuru records →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Checkr Control
            </p>
            <h3 className="mt-3 text-2xl font-black tracking-tight text-white">
              Background check command center
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
              Start Checkr invitations directly from the approval table, monitor
              pending reports, and manually override status when admin review is
              required.
            </p>
          </div>

          <Link
            href="/admin/background-checks"
            className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
          >
            Open Full Background Check Page
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {approvalData.backgroundStats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-400/30 hover:bg-white/10"
            >
              <p className="text-sm font-medium text-slate-400">{stat.label}</p>
              <p className="mt-3 text-3xl font-black tracking-tight text-white">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-slate-400">{stat.detail}</p>
              <p className="mt-4 text-sm font-semibold text-emerald-300">
                Manage Checkr →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.25fr_0.85fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-white">
                Approval pipeline
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Organize Guru reviews by readiness and quality stage.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {approvalData.pipelineCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-400/30 hover:bg-white/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <h4 className="text-lg font-bold text-white">{card.title}</h4>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-bold text-white ring-1 ring-white/10">
                    {card.count.toLocaleString()}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400 group-hover:text-slate-300">
                  {card.description}
                </p>
                <div className="mt-5 text-sm font-semibold text-emerald-300">
                  Open SitGuru records →
                </div>
              </Link>
            ))}
          </div>

          <Link
            href="/admin/launch-signups?filter=guru"
            className="mt-6 block rounded-3xl border border-sky-400/20 bg-sky-400/10 p-5 transition hover:border-sky-300/40 hover:bg-sky-400/15"
          >
            <p className="text-sm font-semibold text-sky-100">
              Launch lead signal
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              {approvalData.totals.launchGuruLeads.toLocaleString()} launch
              signup lead{approvalData.totals.launchGuruLeads === 1 ? "" : "s"}{" "}
              indicated interest in becoming a Guru or selected both customer and
              Guru.
            </p>
            <p className="mt-4 text-sm font-semibold text-sky-200">
              Open Guru-interest leads →
            </p>
          </Link>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
          <h3 className="text-2xl font-bold tracking-tight text-white">
            Review checklist
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Keep Guru approvals aligned with quality, trust, background checks,
            and conversion.
          </p>

          <div className="mt-6 space-y-3">
            {reviewChecklist.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <p className="text-sm leading-6 text-slate-200">{item}</p>
              </div>
            ))}
          </div>

          <Link
            href="/admin/background-checks"
            className="mt-6 block rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5 transition hover:border-emerald-300/40 hover:bg-emerald-400/15"
          >
            <p className="text-sm font-semibold text-white">
              Background checks now live here
            </p>
            <p className="mt-2 text-sm leading-7 text-emerald-50/90">
              Admin can start Checkr invites, monitor webhook status, review
              consider reports, and keep Gurus from becoming bookable until
              their background check status is clear.
            </p>
            <p className="mt-4 text-sm font-semibold text-emerald-200">
              Open Checkr control →
            </p>
          </Link>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              Pending Guru applications
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Prioritize approval decisions based on readiness, trust, and Checkr
              background check status.
            </p>
          </div>

          <Link
            href="/admin/gurus"
            className="text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
          >
            View all Guru records →
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Applicant
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Specialty
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Location
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Experience
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Approval
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Checkr
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Joined
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Admin Control
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-slate-950/40">
                {approvalData.tableRows.length ? (
                  approvalData.tableRows.map((application) => (
                    <tr
                      key={`${application.id}-${application.status}`}
                      className="hover:bg-white/5"
                    >
                      <td className="px-5 py-4 text-sm font-semibold text-white">
                        <Link
                          href={application.href}
                          className="transition hover:text-emerald-300"
                        >
                          {application.name}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-300">
                        {application.specialty}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-400">
                        {application.location}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-400">
                        {application.experience}
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <Link
                          href={adminGuruHref({
                            status: application.status
                              .toLowerCase()
                              .replace(/\s+/g, "-"),
                          })}
                          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition hover:opacity-80 ${statusClasses(
                            application.status,
                          )}`}
                        >
                          {application.status}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <div className="min-w-56 space-y-2">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${backgroundCheckClasses(
                              application.backgroundCheckStatus,
                            )}`}
                          >
                            {application.backgroundCheckLabel}
                          </span>

                          <div className="space-y-1 text-xs text-slate-500">
                            <p>
                              Candidate:{" "}
                              <span className="text-slate-300">
                                {application.checkrCandidateId || "—"}
                              </span>
                            </p>
                            <p>
                              Report:{" "}
                              <span className="text-slate-300">
                                {application.checkrReportId || "—"}
                              </span>
                            </p>
                            <p>
                              Last webhook:{" "}
                              <span className="text-slate-300">
                                {formatDateTimeShort(
                                  application.checkrLastWebhookAt,
                                )}
                              </span>
                            </p>
                          </div>

                          {application.checkrInvitationUrl ? (
                            <a
                              href={application.checkrInvitationUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
                            >
                              Open Invite
                            </a>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-400">
                        {application.joined}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex min-w-72 flex-col gap-3">
                          <form action={startCheckrInvite}>
                            <input
                              type="hidden"
                              name="guruId"
                              value={application.id}
                            />
                            <button
                              type="submit"
                              className="w-full rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400"
                            >
                              {application.backgroundCheckStatus === "not_started"
                                ? "Start Checkr"
                                : "Resend Checkr"}
                            </button>
                          </form>

                          <form
                            action={updateBackgroundCheckStatus}
                            className="flex gap-2"
                          >
                            <input
                              type="hidden"
                              name="guruId"
                              value={application.id}
                            />

                            <select
                              name="backgroundCheckStatus"
                              defaultValue={application.backgroundCheckStatus}
                              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-semibold text-white outline-none transition focus:border-emerald-400"
                            >
                              {BACKGROUND_CHECK_STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>
                                  {status.replaceAll("_", " ")}
                                </option>
                              ))}
                            </select>

                            <button
                              type="submit"
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
                            >
                              Save
                            </button>
                          </form>

                          <Link
                            href={application.href}
                            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
                          >
                            Review Guru
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-8 text-center text-sm text-slate-400"
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

      <AdminNavigationPanel />
    </main>
  );
}
