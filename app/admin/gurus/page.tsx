import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type GuruRow = Record<string, unknown>;
type ProfileRow = Record<string, unknown>;

type SearchParams = {
  status?: string;
  filter?: string;
  guru?: string;
};

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

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

type GuruDisplayRow = {
  id: string;
  name: string;
  email: string;
  slug: string;
  services: string;
  location: string;
  experience: string;
  applicationStatus: ApplicationStatus;
  statusLabel: string;
  profileQuality: string;
  identityStatus: string;
  backgroundStatus: string;
  safetyStatus: string;
  bookable: boolean;
  joined: string;
  href: string;
  publicHref: string;
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

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Admin gurus query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Admin gurus query skipped for ${label}:`, error);
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
    "Guru"
  );
}

function getGuruEmail(guru: GuruRow, profile?: ProfileRow) {
  return asTrimmedString(guru.email) || asTrimmedString(profile?.email) || "—";
}

function getGuruSlug(guru: GuruRow) {
  return asTrimmedString(guru.slug);
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

function getGuruLocation(guru: GuruRow, profile?: ProfileRow) {
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
    status.includes("suspend")
  );
}

function isGuruBookable(guru: GuruRow) {
  const status = asTrimmedString(guru.status).toLowerCase();
  const applicationStatus = asTrimmedString(
    guru.application_status
  ).toLowerCase();

  return (
    toBoolean(guru.is_bookable) ||
    applicationStatus === "bookable" ||
    status === "active"
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
    status === "approved" ||
    status === "active" ||
    status === "bookable"
  );
}

function needsProfileUpdate(guru: GuruRow) {
  const hasName = Boolean(
    asTrimmedString(guru.display_name) ||
      asTrimmedString(guru.full_name) ||
      asTrimmedString(guru.name)
  );

  const hasBio = Boolean(asTrimmedString(guru.bio));
  const hasLocation = Boolean(
    asTrimmedString(guru.city) || asTrimmedString(guru.state)
  );

  const hasServices =
    Array.isArray(guru.services) && guru.services.length > 0
      ? true
      : Boolean(
          asTrimmedString(guru.service) ||
            asTrimmedString(guru.service_name) ||
            asTrimmedString(guru.specialty)
        );

  return !hasName || !hasBio || !hasLocation || !hasServices;
}

function getProfileQuality(guru: GuruRow) {
  if (needsProfileUpdate(guru)) return "Needs Update";
  return "Complete";
}

function normalizeApplicationStatus(guru: GuruRow): ApplicationStatus {
  const rawStatus = (
    asTrimmedString(guru.application_status) ||
    asTrimmedString(guru.approval_status) ||
    asTrimmedString(guru.status)
  ).toLowerCase();

  if (isGuruFlagged(guru)) return "suspended";
  if (rawStatus === "suspended" || rawStatus.includes("suspend")) {
    return "suspended";
  }
  if (rawStatus === "rejected" || rawStatus.includes("reject")) {
    return "rejected";
  }
  if (isGuruBookable(guru)) return "bookable";

  if (
    rawStatus === "verification_pending" ||
    rawStatus.includes("verification")
  ) {
    return "verification_pending";
  }

  if (
    rawStatus === "pre_approved" ||
    rawStatus === "pre-approved" ||
    rawStatus.includes("pre")
  ) {
    return "pre_approved";
  }

  if (
    rawStatus === "needs_info" ||
    rawStatus === "needs-info" ||
    rawStatus.includes("needs info") ||
    rawStatus.includes("profile update")
  ) {
    return "needs_info";
  }

  if (rawStatus === "reviewing" || rawStatus.includes("review")) {
    return "reviewing";
  }

  if (rawStatus === "approved" || isGuruApproved(guru)) {
    return "approved";
  }

  if (rawStatus === "new") return "new";
  if (rawStatus === "pending") return "new";

  if (needsProfileUpdate(guru)) return "needs_info";

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

function applicationStatusClasses(status: ApplicationStatus) {
  switch (status) {
    case "bookable":
    case "approved":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
    case "pre_approved":
    case "verification_pending":
      return "border-sky-400/20 bg-sky-400/10 text-sky-200";
    case "reviewing":
      return "border-violet-400/20 bg-violet-400/10 text-violet-200";
    case "needs_info":
    case "new":
      return "border-amber-400/20 bg-amber-400/10 text-amber-200";
    case "rejected":
    case "suspended":
      return "border-rose-400/20 bg-rose-400/10 text-rose-200";
    default:
      return "border-white/10 bg-white/5 text-slate-200";
  }
}

function qualityClasses(quality: string) {
  if (quality === "Complete") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  }

  return "border-amber-400/20 bg-amber-400/10 text-amber-200";
}

function credentialClasses(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized === "verified" ||
    normalized === "clear" ||
    normalized === "cleared" ||
    normalized === "approved"
  ) {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  }

  if (normalized === "pending" || normalized === "in progress") {
    return "border-sky-400/20 bg-sky-400/10 text-sky-200";
  }

  if (normalized === "rejected" || normalized === "failed") {
    return "border-rose-400/20 bg-rose-400/10 text-rose-200";
  }

  return "border-white/10 bg-white/5 text-slate-300";
}

function normalizeQuery(value?: string) {
  return String(value || "").trim().toLowerCase();
}

function filterGuruRows(rows: GuruDisplayRow[], searchParams: SearchParams) {
  const status = normalizeQuery(searchParams.status);
  const filter = normalizeQuery(searchParams.filter);
  const guru = normalizeQuery(searchParams.guru);

  return rows.filter((row) => {
    const rowStatus = row.applicationStatus;
    const rowStatusLabel = row.statusLabel.toLowerCase();
    const rowQuality = row.profileQuality.toLowerCase();
    const rowId = row.id.toLowerCase();
    const rowName = row.name.toLowerCase();

    if (guru && rowId !== guru && !rowName.includes(guru)) {
      return false;
    }

    if (status) {
      if (status === "pending") {
        return !["bookable", "rejected", "suspended"].includes(rowStatus);
      }

      if (status === "new") return rowStatus === "new";
      if (status === "reviewing") return rowStatus === "reviewing";
      if (status === "needs-info") return rowStatus === "needs_info";
      if (status === "pre-approved") return rowStatus === "pre_approved";
      if (status === "verification") return rowStatus === "verification_pending";
      if (status === "approved") return rowStatus === "approved";
      if (status === "bookable") return rowStatus === "bookable";
      if (status === "rejected") return rowStatus === "rejected";
      if (status === "suspended" || status === "flagged") {
        return rowStatus === "suspended";
      }

      if (status === "ready") {
        return rowStatus === "approved" || rowStatus === "bookable";
      }

      if (status === "credential-review") {
        return (
          rowStatus === "pre_approved" ||
          rowStatus === "verification_pending" ||
          rowStatusLabel.includes("verification")
        );
      }
    }

    if (filter) {
      if (filter === "profile-quality" || filter === "profile-updates") {
        return rowQuality === "needs update";
      }

      if (filter === "quality-review") {
        return rowQuality === "needs update" || rowStatus === "reviewing";
      }

      if (filter === "not-bookable") {
        return !row.bookable;
      }
    }

    return true;
  });
}

async function getGuruManagementData(searchParams: SearchParams) {
  const [gurus, profiles] = await Promise.all([
    safeRows<GuruRow>(
      supabaseAdmin
        .from("gurus")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "gurus"
    ),
    safeRows<ProfileRow>(
      supabaseAdmin
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "profiles"
    ),
  ]);

  const profileMap = new Map<string, ProfileRow>();

  for (const profile of profiles) {
    const key = getProfileKey(profile);

    if (key) {
      profileMap.set(key, profile);
    }
  }

  const rows: GuruDisplayRow[] = gurus.map((guru) => {
    const profile = profileMap.get(getGuruProfileKey(guru));
    const id = getGuruId(guru);
    const slug = getGuruSlug(guru);
    const applicationStatus = normalizeApplicationStatus(guru);
    const publicHref = slug ? `/guru/${slug}` : "/search";

    return {
      id,
      name: getGuruName(guru, profile),
      email: getGuruEmail(guru, profile),
      slug,
      services: getGuruServices(guru),
      location: getGuruLocation(guru, profile),
      experience: getGuruExperience(guru),
      applicationStatus,
      statusLabel: getApplicationStatusLabel(applicationStatus),
      profileQuality: getProfileQuality(guru),
      identityStatus: getCredentialStatus(
        guru.stripe_identity_status || guru.identity_status
      ),
      backgroundStatus: getCredentialStatus(guru.background_check_status),
      safetyStatus: getCredentialStatus(guru.safety_cert_status),
      bookable: isGuruBookable(guru),
      joined: formatDateShort(asTrimmedString(guru.created_at)),
      href: id ? `/admin/gurus/${encodeURIComponent(id)}` : "/admin/gurus",
      publicHref,
    };
  });

  const filteredRows = filterGuruRows(rows, searchParams);

  return {
    rows: filteredRows,
    totals: {
      all: rows.length,
      shown: filteredRows.length,
      pending: rows.filter(
        (row) =>
          !["bookable", "rejected", "suspended"].includes(row.applicationStatus)
      ).length,
      new: rows.filter((row) => row.applicationStatus === "new").length,
      reviewing: rows.filter((row) => row.applicationStatus === "reviewing")
        .length,
      needsInfo: rows.filter((row) => row.applicationStatus === "needs_info")
        .length,
      preApproved: rows.filter((row) => row.applicationStatus === "pre_approved")
        .length,
      verification: rows.filter(
        (row) => row.applicationStatus === "verification_pending"
      ).length,
      approved: rows.filter((row) => row.applicationStatus === "approved").length,
      bookable: rows.filter((row) => row.applicationStatus === "bookable").length,
      profileUpdates: rows.filter((row) => row.profileQuality === "Needs Update")
        .length,
      paused: rows.filter(
        (row) =>
          row.applicationStatus === "suspended" ||
          row.applicationStatus === "rejected"
      ).length,
    },
  };
}

function ActionLink({
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
        className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
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
        Use these shortcuts to move between the Guru review center, filtered
        application lists, and the main Admin dashboard.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <AdminNavButton href="/admin" label="Admin Home" />
        <AdminNavButton href="/admin/guru-approvals" label="Guru Approvals" />
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
        <AdminNavButton
          href="/admin/gurus?status=bookable"
          label="Bookable Gurus"
          primary
        />
      </div>
    </section>
  );
}

export default async function AdminGurusPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const guruData = await getGuruManagementData(resolvedSearchParams);

  const activeFilter =
    resolvedSearchParams.status || resolvedSearchParams.filter || "all";

  return (
    <main className="space-y-8">
      <AdminNavigationPanel />

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_24%),linear-gradient(180deg,#0f172a_0%,#020617_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Guru Approval Center
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Review, approve, and launch trusted SitGuru providers.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              This page is wired to live Guru records. Use it to monitor new
              applications, profile readiness, verification progress, and who is
              ready to become bookable.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ActionLink href="/admin/guru-approvals" label="Approvals Hub" />
            <ActionLink href="/admin/gurus?status=pending" label="Pending" />
            <ActionLink href="/admin/gurus?status=bookable" label="Bookable" />
            <ActionLink href="/admin/analytics" label="Analytics" primary />
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/admin/gurus?status=pending"
            className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-300/30 hover:bg-white/10"
          >
            <p className="text-sm font-medium text-slate-400">Pending Reviews</p>
            <p className="mt-3 text-3xl font-black text-white">
              {guruData.totals.pending.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Not bookable and awaiting Admin action
            </p>
          </Link>

          <Link
            href="/admin/gurus?status=needs-info"
            className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-300/30 hover:bg-white/10"
          >
            <p className="text-sm font-medium text-slate-400">
              Need Profile Updates
            </p>
            <p className="mt-3 text-3xl font-black text-white">
              {guruData.totals.profileUpdates.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Missing public profile info
            </p>
          </Link>

          <Link
            href="/admin/gurus?status=verification"
            className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-300/30 hover:bg-white/10"
          >
            <p className="text-sm font-medium text-slate-400">
              Verification Needed
            </p>
            <p className="mt-3 text-3xl font-black text-white">
              {guruData.totals.verification.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Identity or background steps pending
            </p>
          </Link>

          <Link
            href="/admin/gurus?status=bookable"
            className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-300/30 hover:bg-white/10"
          >
            <p className="text-sm font-medium text-slate-400">Bookable Gurus</p>
            <p className="mt-3 text-3xl font-black text-white">
              {guruData.totals.bookable.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Visible for customer booking
            </p>
          </Link>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Approval Pipeline
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
            Application stages
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Move Gurus from free application to bookable profile only after
            Admin review and trust checks.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/admin/gurus?status=new"
              className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-white">New Applications</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Fresh Gurus who applied free.
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
                  {guruData.totals.new}
                </span>
              </div>
            </Link>

            <Link
              href="/admin/gurus?status=reviewing"
              className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-white">Under Review</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Applications currently being checked.
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
                  {guruData.totals.reviewing}
                </span>
              </div>
            </Link>

            <Link
              href="/admin/gurus?status=pre-approved"
              className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-white">Pre-Approved</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Ready for Stripe, identity, or Checkr steps.
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
                  {guruData.totals.preApproved}
                </span>
              </div>
            </Link>

            <Link
              href="/admin/gurus?status=approved"
              className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-white">Approved</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Approved but not yet made bookable.
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
                  {guruData.totals.approved}
                </span>
              </div>
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Admin Review Checklist
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
            Before making a Guru bookable
          </h2>

          <div className="mt-6 space-y-3">
            {[
              "Confirm profile quality and public-facing presentation",
              "Validate city, state, services, pricing, and availability",
              "Review pet care experience, specialties, and bio clarity",
              "Confirm Stripe Connect or payout readiness when enabled",
              "Confirm identity verification status",
              "Confirm Checkr background check status",
              "Approve only Gurus ready to build customer trust",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-emerald-400/15 bg-emerald-400/10 p-5">
            <p className="text-sm font-bold text-emerald-200">
              Bookable is the final switch
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Customers should only see Gurus where{" "}
              <span className="font-semibold text-emerald-200">
                is_bookable = true
              </span>
              . Keep new, reviewing, and verification-pending Gurus hidden from
              search until Admin makes them bookable.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Guru Records
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
              Showing {guruData.totals.shown.toLocaleString()} of{" "}
              {guruData.totals.all.toLocaleString()} Guru records
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Active filter:{" "}
              <span className="font-semibold text-emerald-300">
                {activeFilter}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ActionLink href="/admin/gurus" label="All" />
            <ActionLink href="/admin/gurus?status=pending" label="Pending" />
            <ActionLink
              href="/admin/gurus?status=needs-info"
              label="Needs Info"
            />
            <ActionLink
              href="/admin/gurus?status=verification"
              label="Verification"
            />
            <ActionLink
              href="/admin/gurus?status=bookable"
              label="Bookable"
              primary
            />
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Guru
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Services
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Location
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Experience
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Application
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Trust Checks
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Profile
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Joined
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10 bg-slate-950/40">
                {guruData.rows.length ? (
                  guruData.rows.map((guru) => (
                    <tr
                      key={`${guru.id}-${guru.applicationStatus}`}
                      className="hover:bg-white/5"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={guru.href}
                          className="font-semibold text-white transition hover:text-emerald-300"
                        >
                          {guru.name}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">
                          {guru.email}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-300">
                        {guru.services}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-400">
                        {guru.location}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-400">
                        {guru.experience}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${applicationStatusClasses(
                            guru.applicationStatus
                          )}`}
                        >
                          {guru.statusLabel}
                        </span>

                        {guru.bookable ? (
                          <p className="mt-2 text-xs font-semibold text-emerald-300">
                            Visible to customers
                          </p>
                        ) : (
                          <p className="mt-2 text-xs text-slate-500">
                            Hidden from customer search
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5">
                          <span
                            className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold ${credentialClasses(
                              guru.identityStatus
                            )}`}
                          >
                            ID: {guru.identityStatus}
                          </span>
                          <span
                            className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold ${credentialClasses(
                              guru.backgroundStatus
                            )}`}
                          >
                            BG: {guru.backgroundStatus}
                          </span>
                          <span
                            className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold ${credentialClasses(
                              guru.safetyStatus
                            )}`}
                          >
                            Safety: {guru.safetyStatus}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${qualityClasses(
                            guru.profileQuality
                          )}`}
                        >
                          {guru.profileQuality}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-400">
                        {guru.joined}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={guru.href}
                            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
                          >
                            Review
                          </Link>

                          {guru.bookable ? (
                            <Link
                              href={guru.publicHref}
                              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400"
                            >
                              Public
                            </Link>
                          ) : (
                            <Link
                              href={guru.href}
                              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400"
                            >
                              Decide
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-8 text-center text-sm text-slate-400"
                    >
                      No Guru records match this filter yet.
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