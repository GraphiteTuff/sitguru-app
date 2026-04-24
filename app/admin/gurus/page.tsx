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

type GuruDisplayRow = {
  id: string;
  name: string;
  email: string;
  slug: string;
  services: string;
  location: string;
  experience: string;
  status: string;
  profileQuality: string;
  joined: string;
  href: string;
};

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
  return (
    asTrimmedString(guru.email) ||
    asTrimmedString(profile?.email) ||
    "—"
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
    asTrimmedString(guru.service_state);

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
    status.includes("verified")
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

function getGuruStatus(guru: GuruRow) {
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
  if (rawStatus.includes("pending")) return "Pending";
  if (rawStatus.includes("review")) return "Credential Review";
  if (isGuruActive(guru)) return "Active";

  return "New";
}

function statusClasses(status: string) {
  switch (status) {
    case "Ready":
    case "Active":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
    case "Credential Review":
      return "border-sky-400/20 bg-sky-400/10 text-sky-200";
    case "Profile Update Needed":
    case "Pending":
      return "border-amber-400/20 bg-amber-400/10 text-amber-200";
    case "Flagged":
      return "border-rose-400/20 bg-rose-400/10 text-rose-200";
    case "New":
      return "border-violet-400/20 bg-violet-400/10 text-violet-200";
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

function normalizeQuery(value?: string) {
  return String(value || "").trim().toLowerCase();
}

function filterGuruRows(rows: GuruDisplayRow[], searchParams: SearchParams) {
  const status = normalizeQuery(searchParams.status);
  const filter = normalizeQuery(searchParams.filter);
  const guru = normalizeQuery(searchParams.guru);

  return rows.filter((row) => {
    const rowStatus = row.status.toLowerCase();
    const rowQuality = row.profileQuality.toLowerCase();
    const rowId = row.id.toLowerCase();
    const rowName = row.name.toLowerCase();

    if (guru && rowId !== guru && !rowName.includes(guru)) {
      return false;
    }

    if (status) {
      if (status === "pending") {
        return ["pending", "new", "credential review", "profile update needed"].includes(
          rowStatus
        );
      }

      if (status === "new") {
        return rowStatus === "new";
      }

      if (status === "approved" || status === "ready") {
        return rowStatus === "ready" || rowStatus === "active";
      }

      if (status === "credential-review") {
        return rowStatus === "credential review";
      }

      if (status === "flagged") {
        return rowStatus === "flagged";
      }
    }

    if (filter) {
      if (filter === "profile-quality" || filter === "profile-updates") {
        return rowQuality === "needs update";
      }

      if (filter === "quality-review") {
        return rowQuality === "needs update" || rowStatus === "credential review";
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
    const status = getGuruStatus(guru);

    return {
      id,
      name: getGuruName(guru, profile),
      email: getGuruEmail(guru, profile),
      slug,
      services: getGuruServices(guru),
      location: getGuruLocation(guru, profile),
      experience: getGuruExperience(guru),
      status,
      profileQuality: getProfileQuality(guru),
      joined: formatDateShort(asTrimmedString(guru.created_at)),
      href: slug ? `/guru/${slug}` : "/admin/guru-approvals",
    };
  });

  const filteredRows = filterGuruRows(rows, searchParams);

  return {
    rows: filteredRows,
    totals: {
      all: rows.length,
      shown: filteredRows.length,
      pending: rows.filter((row) =>
        ["Pending", "New", "Credential Review", "Profile Update Needed"].includes(
          row.status
        )
      ).length,
      ready: rows.filter((row) => row.status === "Ready" || row.status === "Active")
        .length,
      profileUpdates: rows.filter((row) => row.profileQuality === "Needs Update")
        .length,
      flagged: rows.filter((row) => row.status === "Flagged").length,
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
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_24%),linear-gradient(180deg,#0f172a_0%,#020617_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Guru Management
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Live SitGuru Guru records and approval filters.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              This page powers the Guru Approval cards. Use it to review pending,
              ready, flagged, credential review, and profile-quality Guru records.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ActionLink href="/admin/guru-approvals" label="Approvals" />
            <ActionLink href="/admin/users" label="Users" />
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
            <p className="mt-2 text-sm text-slate-400">Needs admin review</p>
          </Link>

          <Link
            href="/admin/gurus?status=ready"
            className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-300/30 hover:bg-white/10"
          >
            <p className="text-sm font-medium text-slate-400">Ready / Active</p>
            <p className="mt-3 text-3xl font-black text-white">
              {guruData.totals.ready.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-slate-400">Launch-ready Gurus</p>
          </Link>

          <Link
            href="/admin/gurus?filter=profile-quality"
            className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-300/30 hover:bg-white/10"
          >
            <p className="text-sm font-medium text-slate-400">
              Profile Updates
            </p>
            <p className="mt-3 text-3xl font-black text-white">
              {guruData.totals.profileUpdates.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-slate-400">Missing public info</p>
          </Link>

          <Link
            href="/admin/gurus?status=flagged"
            className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-300/30 hover:bg-white/10"
          >
            <p className="text-sm font-medium text-slate-400">Flagged</p>
            <p className="mt-3 text-3xl font-black text-white">
              {guruData.totals.flagged.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-slate-400">Needs trust review</p>
          </Link>
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
              href="/admin/gurus?status=credential-review"
              label="Credentials"
            />
            <ActionLink
              href="/admin/gurus?filter=profile-quality"
              label="Profile Quality"
            />
            <ActionLink href="/admin/gurus?status=ready" label="Ready" primary />
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
                    Status
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Profile
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Joined
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10 bg-slate-950/40">
                {guruData.rows.length ? (
                  guruData.rows.map((guru) => (
                    <tr key={`${guru.id}-${guru.status}`} className="hover:bg-white/5">
                      <td className="px-5 py-4">
                        <Link
                          href={guru.href}
                          className="font-semibold text-white transition hover:text-emerald-300"
                        >
                          {guru.name}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">{guru.email}</p>
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
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(
                            guru.status
                          )}`}
                        >
                          {guru.status}
                        </span>
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
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
    </main>
  );
}