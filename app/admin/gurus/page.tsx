import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileSearch,
  Globe2,
  ShieldCheck,
  Sparkles,
  Star,
  UserPlus,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import GuruRecordsTable from "./GuruRecordsTable";

export const dynamic = "force-dynamic";

type GuruRow = Record<string, unknown>;
type ProfileRow = Record<string, unknown>;

type SearchParams = {
  status?: string;
  filter?: string;
  guru?: string;
  q?: string;
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
  avatarUrl: string;
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

type ChartItem = {
  label: string;
  value: number;
  helper?: string;
};

const adminRoutes = {
  dashboard: "/admin",
  gurus: "/admin/gurus",
  guruExport: "/admin/gurus/export",
  newGuru: "/admin/gurus/new",
  approvals: "/admin/guru-approvals",
  performance: "/admin/guru-performance",
  backgroundChecks: "/admin/background-checks",
  analytics: "/admin/analytics",
};

const chartColors = [
  "#166534",
  "#16a34a",
  "#22c55e",
  "#84cc16",
  "#0f766e",
  "#0ea5e9",
  "#8b5cf6",
  "#f59e0b",
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

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
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
  label: string,
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

function getGuruAvatarUrl(guru: GuruRow, profile?: ProfileRow) {
  return (
    asTrimmedString(guru.avatar_url) ||
    asTrimmedString(guru.profile_photo_url) ||
    asTrimmedString(guru.photo_url) ||
    asTrimmedString(guru.image_url) ||
    asTrimmedString(guru.headshot_url) ||
    asTrimmedString(profile?.avatar_url) ||
    asTrimmedString(profile?.profile_photo_url) ||
    asTrimmedString(profile?.photo_url) ||
    asTrimmedString(profile?.image_url) ||
    ""
  );
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

function getGuruCityState(row: GuruDisplayRow) {
  return row.location && row.location !== "Location not listed"
    ? row.location
    : "Unknown";
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

function getExperienceBucket(value: string) {
  const match = value.match(/\d+/);
  const years = match ? Number(match[0]) : 0;

  if (!years) return "Not Listed";
  if (years <= 1) return "0-1 Years";
  if (years <= 3) return "2-3 Years";
  if (years <= 5) return "4-5 Years";
  return "6+ Years";
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

function isReadyTrustStatus(value: string) {
  const normalized = value.toLowerCase();

  return (
    normalized === "verified" ||
    normalized === "clear" ||
    normalized === "cleared" ||
    normalized === "approved"
  );
}

function isPendingTrustStatus(value: string) {
  const normalized = value.toLowerCase();

  return (
    normalized === "pending" ||
    normalized === "in progress" ||
    normalized === "not started"
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
    status.includes("suspend")
  );
}

function isGuruBookable(guru: GuruRow) {
  const status = asTrimmedString(guru.status).toLowerCase();
  const applicationStatus = asTrimmedString(
    guru.application_status,
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

function normalizeQuery(value?: string) {
  return String(value || "").trim().toLowerCase();
}

function filterGuruRows(rows: GuruDisplayRow[], searchParams: SearchParams) {
  const status = normalizeQuery(searchParams.status);
  const filter = normalizeQuery(searchParams.filter);
  const guru = normalizeQuery(searchParams.guru);
  const query = normalizeQuery(searchParams.q);

  return rows.filter((row) => {
    const rowStatus = row.applicationStatus;
    const rowStatusLabel = row.statusLabel.toLowerCase();
    const rowQuality = row.profileQuality.toLowerCase();
    const rowId = row.id.toLowerCase();
    const rowName = row.name.toLowerCase();

    const searchableText = [
      row.id,
      row.name,
      row.email,
      row.services,
      row.location,
      row.experience,
      row.statusLabel,
      row.profileQuality,
      row.identityStatus,
      row.backgroundStatus,
      row.safetyStatus,
    ]
      .join(" ")
      .toLowerCase();

    if (guru && rowId !== guru && !rowName.includes(guru)) {
      return false;
    }

    if (query && !searchableText.includes(query)) {
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

function countByLabel<T>(
  rows: T[],
  getLabel: (row: T) => string,
  getHelper?: (row: T[]) => string,
) {
  const groupMap = new Map<string, T[]>();

  for (const row of rows) {
    const label = getLabel(row) || "Unknown";
    const existing = groupMap.get(label) || [];
    existing.push(row);
    groupMap.set(label, existing);
  }

  return Array.from(groupMap.entries())
    .map(([label, group]) => ({
      label,
      value: group.length,
      helper: getHelper ? getHelper(group) : `${number(group.length)} Gurus`,
    }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, 8);
}

function buildTrustChartRows(rows: GuruDisplayRow[]) {
  const identityReady = rows.filter((row) =>
    isReadyTrustStatus(row.identityStatus),
  ).length;
  const backgroundReady = rows.filter((row) =>
    isReadyTrustStatus(row.backgroundStatus),
  ).length;
  const safetyReady = rows.filter((row) =>
    isReadyTrustStatus(row.safetyStatus),
  ).length;

  const identityPending = rows.filter((row) =>
    isPendingTrustStatus(row.identityStatus),
  ).length;
  const backgroundPending = rows.filter((row) =>
    isPendingTrustStatus(row.backgroundStatus),
  ).length;
  const safetyPending = rows.filter((row) =>
    isPendingTrustStatus(row.safetyStatus),
  ).length;

  return [
    {
      label: "Identity Ready",
      value: identityReady,
      helper: `${number(identityPending)} pending`,
    },
    {
      label: "Background Ready",
      value: backgroundReady,
      helper: `${number(backgroundPending)} pending`,
    },
    {
      label: "Safety Ready",
      value: safetyReady,
      helper: `${number(safetyPending)} pending`,
    },
  ];
}

async function getGuruManagementData(searchParams: SearchParams) {
  const [gurus, profiles] = await Promise.all([
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
  ]);

  const profileMap = new Map<string, ProfileRow>();

  for (const profile of profiles) {
    const key = getProfileKey(profile);
    const email = asTrimmedString(profile.email).toLowerCase();

    if (key) profileMap.set(key, profile);
    if (email) profileMap.set(email, profile);
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
      avatarUrl: getGuruAvatarUrl(guru, profile),
      slug,
      services: getGuruServices(guru),
      location: getGuruLocation(guru, profile),
      experience: getGuruExperience(guru),
      applicationStatus,
      statusLabel: getApplicationStatusLabel(applicationStatus),
      profileQuality: getProfileQuality(guru),
      identityStatus: getCredentialStatus(
        guru.stripe_identity_status || guru.identity_status,
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

  const statusChart = countByLabel(rows, (row) => row.statusLabel);
  const profileChart = countByLabel(rows, (row) => row.profileQuality);
  const locationChart = countByLabel(rows, (row) => getGuruCityState(row));
  const experienceChart = countByLabel(rows, (row) =>
    getExperienceBucket(row.experience),
  );
  const serviceChart = countByLabel(rows, (row) => row.services.split(" • ")[0]);
  const trustChart = buildTrustChartRows(rows);

  return {
    rows: filteredRows,
    allRows: rows,
    chartData: {
      statusChart,
      profileChart,
      locationChart,
      experienceChart,
      serviceChart,
      trustChart,
      visibilityChart: [
        {
          label: "Bookable",
          value: rows.filter((row) => row.bookable).length,
          helper: "Visible to customers",
        },
        {
          label: "Not Bookable",
          value: rows.filter((row) => !row.bookable).length,
          helper: "Hidden from search",
        },
      ],
    },
    totals: {
      all: rows.length,
      shown: filteredRows.length,
      pending: rows.filter(
        (row) =>
          !["bookable", "rejected", "suspended"].includes(row.applicationStatus),
      ).length,
      new: rows.filter((row) => row.applicationStatus === "new").length,
      reviewing: rows.filter((row) => row.applicationStatus === "reviewing")
        .length,
      needsInfo: rows.filter((row) => row.applicationStatus === "needs_info")
        .length,
      preApproved: rows.filter((row) => row.applicationStatus === "pre_approved")
        .length,
      verification: rows.filter(
        (row) => row.applicationStatus === "verification_pending",
      ).length,
      approved: rows.filter((row) => row.applicationStatus === "approved").length,
      bookable: rows.filter((row) => row.applicationStatus === "bookable").length,
      profileUpdates: rows.filter((row) => row.profileQuality === "Needs Update")
        .length,
      paused: rows.filter(
        (row) =>
          row.applicationStatus === "suspended" ||
          row.applicationStatus === "rejected",
      ).length,
    },
  };
}

function DashboardCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      {children}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-800 transition group-hover:bg-green-800 group-hover:text-white">
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-500">{detail}</p>
    </Link>
  );
}

function MiniMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#edf3ee] bg-white p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function DonutChart({
  title,
  total,
  items,
}: {
  title: string;
  total: number;
  items: ChartItem[];
}) {
  const safeTotal = items.reduce((sum, item) => sum + item.value, 0);
  let start = 0;

  const gradient =
    safeTotal > 0
      ? items
          .map((item, index) => {
            const size = (item.value / safeTotal) * 360;
            const end = start + size;
            const segment = `${chartColors[index % chartColors.length]} ${start}deg ${end}deg`;
            start = end;
            return segment;
          })
          .join(", ")
      : "#e5e7eb 0deg 360deg";

  return (
    <div className="grid items-center gap-5 sm:grid-cols-[180px_1fr] xl:grid-cols-1 2xl:grid-cols-[180px_1fr]">
      <div className="relative mx-auto h-[180px] w-[180px]">
        <div
          className="h-full w-full rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
        />
        <div className="absolute inset-[34px] flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
          <span className="text-3xl font-black text-slate-950">
            {number(total)}
          </span>
          <span className="text-xs font-bold text-slate-500">{title}</span>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 text-sm font-bold"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{
                  backgroundColor: chartColors[index % chartColors.length],
                }}
              />
              <span className="truncate text-slate-700">{item.label}</span>
            </div>
            <span className="shrink-0 text-slate-950">
              {number(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBarChart({
  title,
  valueLabel,
  items,
  emptyLabel = "No chart data found yet.",
}: {
  title: string;
  valueLabel: string;
  items: ChartItem[];
  emptyLabel?: string;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 0);

  return (
    <div className="rounded-[24px] border border-[#edf3ee] bg-[#fbfcf9] p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-base font-black text-slate-950">{title}</h3>
        <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
          {valueLabel}
        </span>
      </div>

      <div className="space-y-4">
        {items.length ? (
          items.map((item, index) => {
            const width = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

            return (
              <div key={`${item.label}-${index}`}>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">
                      {item.label}
                    </p>
                    {item.helper ? (
                      <p className="truncate text-xs font-bold text-slate-500">
                        {item.helper}
                      </p>
                    ) : null}
                  </div>

                  <p className="shrink-0 text-sm font-black text-green-800">
                    {number(item.value)}
                  </p>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-green-800"
                    style={{ width: `${Math.max(3, width)}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-white bg-white p-4 text-sm font-bold text-slate-500">
            {emptyLabel}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickLinkCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-800 text-white">
        {icon}
      </div>

      <h3 className="text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
        {description}
      </p>

      <p className="mt-4 text-sm font-black text-green-800">
        Open page <span className="transition group-hover:translate-x-1">→</span>
      </p>
    </Link>
  );
}

function WorkflowTile({
  href,
  label,
  value,
  detail,
}: {
  href: string;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4 transition hover:border-green-200 hover:bg-green-50"
    >
      <p className="text-sm font-black text-slate-950">{label}</p>
      <p className="mt-2 text-3xl font-black text-green-950">{number(value)}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{detail}</p>
    </Link>
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

  return (
    <main className="min-h-screen bg-[#f9faf5] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="flex flex-col justify-between gap-4 rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm lg:flex-row lg:items-end">
          <div>
            <Link
              href={adminRoutes.dashboard}
              className="mb-4 inline-flex items-center gap-2 text-sm font-black text-green-800 transition hover:text-green-950"
            >
              <ArrowLeft size={17} />
              Back to Admin Dashboard
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-800 text-white">
                <Users size={26} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
                  Admin / Guru Management
                </p>
                <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-4xl">
                  Guru Management
                </h1>
                <p className="mt-1 max-w-4xl text-base font-semibold text-slate-600">
                  Review Guru applications, profile readiness, verification
                  progress, trust checks, bookable visibility, and exportable
                  Guru reporting.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={adminRoutes.guruExport}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <Download size={17} />
              Export CSV Report
            </Link>

            <Link
              href={adminRoutes.approvals}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <ClipboardCheck size={17} />
              Approvals Hub
            </Link>

            <Link
              href={adminRoutes.newGuru}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
            >
              <UserPlus size={18} />
              Add Guru
            </Link>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={<Users size={22} />}
            label="Total Gurus"
            value={number(guruData.totals.all)}
            detail={`${number(guruData.totals.shown)} visible with current filters`}
            href={adminRoutes.gurus}
          />

          <StatCard
            icon={<FileSearch size={22} />}
            label="Pending Reviews"
            value={number(guruData.totals.pending)}
            detail="Not bookable and awaiting admin action"
            href="/admin/gurus?status=pending"
          />

          <StatCard
            icon={<Sparkles size={22} />}
            label="Profile Updates"
            value={number(guruData.totals.profileUpdates)}
            detail="Missing public profile information"
            href="/admin/gurus?filter=profile-updates"
          />

          <StatCard
            icon={<ShieldCheck size={22} />}
            label="Verification"
            value={number(guruData.totals.verification)}
            detail="Identity or background steps pending"
            href="/admin/gurus?status=verification"
          />

          <StatCard
            icon={<BadgeCheck size={22} />}
            label="Bookable Gurus"
            value={number(guruData.totals.bookable)}
            detail="Visible to customers when search is live"
            href="/admin/gurus?status=bookable"
          />
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-12">
          <div className="xl:col-span-4">
            <DashboardCard>
              <div className="mb-5">
                <h2 className="text-xl font-black text-slate-950">
                  Guru Status Chart
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Application and readiness distribution from live Guru rows.
                </p>
              </div>

              <DonutChart
                title="Gurus"
                total={guruData.totals.all}
                items={guruData.chartData.statusChart}
              />

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <MiniMetric
                  icon={<BadgeCheck size={18} />}
                  label="Bookable"
                  value={number(guruData.totals.bookable)}
                />
                <MiniMetric
                  icon={<Sparkles size={18} />}
                  label="Profile Updates"
                  value={number(guruData.totals.profileUpdates)}
                />
              </div>
            </DashboardCard>
          </div>

          <div className="xl:col-span-8">
            <DashboardCard>
              <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Guru Readiness Charts
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Visualize bookable visibility, profile quality, and trust
                    check readiness.
                  </p>
                </div>

                <Link
                  href={adminRoutes.guruExport}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white transition hover:bg-green-900"
                >
                  <Download size={16} />
                  Export
                </Link>
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                <HorizontalBarChart
                  title="Bookable Visibility"
                  valueLabel="Gurus"
                  items={guruData.chartData.visibilityChart}
                />

                <HorizontalBarChart
                  title="Profile Quality"
                  valueLabel="Gurus"
                  items={guruData.chartData.profileChart}
                />

                <HorizontalBarChart
                  title="Trust Checks"
                  valueLabel="Ready"
                  items={guruData.chartData.trustChart}
                />
              </div>
            </DashboardCard>
          </div>
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <DashboardCard>
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Guru Review Workflow
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Move Gurus through application, profile, verification, and
                    bookable readiness.
                  </p>
                </div>

                <span className="rounded-2xl border border-green-100 bg-[#f7faf4] px-4 py-3 text-sm font-black text-green-900">
                  {number(guruData.totals.pending)} pending admin action
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <WorkflowTile
                  href="/admin/gurus?status=new"
                  label="New Applications"
                  value={guruData.totals.new}
                  detail="Fresh applicants"
                />
                <WorkflowTile
                  href="/admin/gurus?status=reviewing"
                  label="Under Review"
                  value={guruData.totals.reviewing}
                  detail="Admin review needed"
                />
                <WorkflowTile
                  href="/admin/gurus?status=pre-approved"
                  label="Pre-Approved"
                  value={guruData.totals.preApproved}
                  detail="Ready for next checks"
                />
                <WorkflowTile
                  href="/admin/gurus?status=approved"
                  label="Approved"
                  value={guruData.totals.approved}
                  detail="Approved but not bookable"
                />
              </div>
            </DashboardCard>
          </div>

          <div className="xl:col-span-4">
            <DashboardCard>
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-800 text-white">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Bookable Checklist
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Gurus should only be customer-visible after these checks.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  "Public profile is complete and customer-ready",
                  "City, state, services, pricing, and availability are valid",
                  "Experience, specialties, and bio are clear",
                  "Payout readiness is confirmed when enabled",
                  "Identity verification is approved",
                  "Background check is clear or approved",
                  "Admin has made the Guru bookable",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] px-4 py-3 text-sm font-bold text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </DashboardCard>
          </div>
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <DashboardCard>
              <div className="mb-5">
                <h2 className="text-xl font-black text-slate-950">
                  Guru Supply Charts
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Visualize where Gurus are located and which services are most
                  represented.
                </p>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <HorizontalBarChart
                  title="Top Guru Locations"
                  valueLabel="Gurus"
                  items={guruData.chartData.locationChart}
                />

                <HorizontalBarChart
                  title="Top Guru Services"
                  valueLabel="Gurus"
                  items={guruData.chartData.serviceChart}
                />
              </div>
            </DashboardCard>
          </div>

          <div className="xl:col-span-5">
            <DashboardCard>
              <div className="mb-5">
                <h2 className="text-xl font-black text-slate-950">
                  Experience Mix
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Distribution of Guru experience levels.
                </p>
              </div>

              <HorizontalBarChart
                title="Experience Buckets"
                valueLabel="Gurus"
                items={guruData.chartData.experienceChart}
              />
            </DashboardCard>
          </div>
        </section>

        <section>
          <DashboardCard>
            <GuruRecordsTable
              gurus={guruData.rows}
              exportHref={adminRoutes.guruExport}
            />
          </DashboardCard>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <QuickLinkCard
            href={adminRoutes.approvals}
            icon={<ClipboardCheck size={22} />}
            title="Guru Approvals"
            description="Review the full approval workflow for new Guru applicants and profile readiness."
          />

          <QuickLinkCard
            href={adminRoutes.backgroundChecks}
            icon={<ShieldCheck size={22} />}
            title="Background Checks"
            description="Monitor identity, Checkr, safety, and trust verification before making Gurus bookable."
          />

          <QuickLinkCard
            href={adminRoutes.performance}
            icon={<Star size={22} />}
            title="Guru Performance"
            description="Review ratings, bookings, customer feedback, and operational performance."
          />
        </section>

        <div className="rounded-[26px] border border-green-100 bg-white p-4 text-sm font-semibold text-slate-500 shadow-sm">
          <span className="font-black text-green-900">
            Supabase coordination:
          </span>{" "}
          this page reads `gurus` and `profiles`. Guru avatars, application
          status, profile quality, identity status, background status, safety
          status, bookable visibility, services, location, experience, joined
          dates, charts, filters, sorting, and CSV export are calculated from
          live rows.
        </div>
      </div>
    </main>
  );
}