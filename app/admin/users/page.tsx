import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Tone = "emerald" | "sky" | "violet" | "amber" | "rose";

type ProfileRow = Record<string, unknown>;
type GuruRow = Record<string, unknown>;
type BookingRow = Record<string, unknown>;
type LaunchSignupRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type UserDisplayRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  risk: string;
  joined: string;
  source: string;
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
  label: string
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Admin users query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Admin users query skipped for ${label}:`, error);
    return [];
  }
}

function getProfileId(profile: ProfileRow) {
  return (
    asTrimmedString(profile.id) ||
    asTrimmedString(profile.user_id) ||
    asTrimmedString(profile.profile_id) ||
    asTrimmedString(profile.email).toLowerCase()
  );
}

function getProfileName(profile: ProfileRow) {
  return (
    asTrimmedString(profile.full_name) ||
    asTrimmedString(profile.display_name) ||
    asTrimmedString(profile.name) ||
    asTrimmedString(profile.email).split("@")[0] ||
    "SitGuru User"
  );
}

function getProfileEmail(profile: ProfileRow) {
  return asTrimmedString(profile.email) || "—";
}

function getProfileRole(profile: ProfileRow) {
  const rawRole = (
    asTrimmedString(profile.role) ||
    asTrimmedString(profile.user_role) ||
    asTrimmedString(profile.account_type) ||
    asTrimmedString(profile.user_type) ||
    asTrimmedString(profile.type) ||
    "customer"
  ).toLowerCase();

  if (rawRole.includes("admin")) return "Admin";
  if (rawRole.includes("guru") || rawRole.includes("sitter")) return "Guru";
  if (rawRole.includes("vendor")) return "Vendor";
  if (rawRole.includes("educator")) return "Educator";
  if (rawRole.includes("medical") || rawRole.includes("vet")) return "Medical Pro";
  if (rawRole.includes("customer") || rawRole.includes("parent")) {
    return "Pet Parent";
  }

  return "Pet Parent";
}

function getProfileStatus(profile: ProfileRow) {
  const rawStatus = (
    asTrimmedString(profile.status) ||
    asTrimmedString(profile.account_status) ||
    asTrimmedString(profile.approval_status) ||
    ""
  ).toLowerCase();

  const isVerified = Boolean(profile.is_verified || profile.verified);
  const isActive = profile.is_active !== false && profile.active !== false;
  const isSuspended = Boolean(profile.is_suspended || profile.suspended);

  if (isSuspended || rawStatus.includes("suspend") || rawStatus.includes("ban")) {
    return "Suspended";
  }

  if (rawStatus.includes("pending")) return "Pending Approval";
  if (rawStatus.includes("review")) return "Under Review";
  if (isVerified || rawStatus.includes("verified")) return "Verified";
  if (isActive || rawStatus.includes("active")) return "Active";

  return "Active";
}

function getRiskLabel(row: Record<string, unknown>) {
  const rawRisk = (
    asTrimmedString(row.risk) ||
    asTrimmedString(row.risk_level) ||
    asTrimmedString(row.trust_risk) ||
    ""
  ).toLowerCase();

  const flagged = Boolean(row.flagged || row.is_flagged || row.account_flagged);
  const suspended = Boolean(row.suspended || row.is_suspended);

  if (suspended || rawRisk.includes("high")) return "High";
  if (flagged || rawRisk.includes("medium") || rawRisk.includes("review")) {
    return "Medium";
  }

  return "Low";
}

function getGuruId(guru: GuruRow) {
  return (
    asTrimmedString(guru.user_id) ||
    asTrimmedString(guru.profile_id) ||
    asTrimmedString(guru.id) ||
    asTrimmedString(guru.email).toLowerCase()
  );
}

function getGuruStatus(guru: GuruRow) {
  const rawStatus = (
    asTrimmedString(guru.status) ||
    asTrimmedString(guru.approval_status) ||
    ""
  ).toLowerCase();

  const isVerified = Boolean(guru.is_verified || guru.verified);
  const isActive = guru.is_active !== false && guru.active !== false;

  if (rawStatus.includes("pending")) return "Pending Approval";
  if (rawStatus.includes("review")) return "Under Review";
  if (isVerified) return "Verified";
  if (isActive) return "Active";

  return "Under Review";
}

function getLaunchIdentity(row: LaunchSignupRow) {
  return (
    asTrimmedString(row.id) ||
    asTrimmedString(row.email).toLowerCase() ||
    asTrimmedString(row.user_id) ||
    asTrimmedString(row.created_at)
  );
}

function getLaunchRole(row: LaunchSignupRow) {
  const rawRole = (
    asTrimmedString(row.role) ||
    asTrimmedString(row.interest_type) ||
    asTrimmedString(row.interestType) ||
    asTrimmedString(row.joining_as) ||
    asTrimmedString(row.user_type) ||
    asTrimmedString(row.segment) ||
    "customer"
  ).toLowerCase();

  if (rawRole.includes("both")) return "Customer + Guru Lead";
  if (rawRole.includes("guru")) return "Future Guru Lead";
  return "Pet Parent Lead";
}

function getLaunchName(row: LaunchSignupRow) {
  return (
    asTrimmedString(row.name) ||
    asTrimmedString(row.full_name) ||
    asTrimmedString(row.fullName) ||
    asTrimmedString(row.email).split("@")[0] ||
    "Launch Signup"
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

  return merged.sort((a, b) => {
    const aDate = new Date(asTrimmedString(a.created_at)).getTime();
    const bDate = new Date(asTrimmedString(b.created_at)).getTime();

    return (
      (Number.isFinite(bDate) ? bDate : 0) -
      (Number.isFinite(aDate) ? aDate : 0)
    );
  });
}

function statusStyle(status: string) {
  if (status.includes("Active") || status.includes("Verified")) {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  }

  if (status.includes("Pending") || status.includes("Review")) {
    return "border-amber-400/20 bg-amber-400/10 text-amber-200";
  }

  if (status.includes("Suspended")) {
    return "border-rose-400/20 bg-rose-400/10 text-rose-200";
  }

  return "border-slate-500/30 bg-slate-500/10 text-slate-200";
}

function riskStyle(risk: string) {
  if (risk === "High") {
    return "border-rose-400/20 bg-rose-400/10 text-rose-200";
  }

  if (risk === "Medium") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-200";
  }

  return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
}

function statToneClasses(tone: Tone) {
  if (tone === "emerald") {
    return {
      card: "border-emerald-400/20 bg-emerald-400/10",
      badge: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    };
  }

  if (tone === "sky") {
    return {
      card: "border-sky-400/20 bg-sky-400/10",
      badge: "border-sky-400/20 bg-sky-400/10 text-sky-200",
    };
  }

  if (tone === "violet") {
    return {
      card: "border-violet-400/20 bg-violet-400/10",
      badge: "border-violet-400/20 bg-violet-400/10 text-violet-200",
    };
  }

  if (tone === "amber") {
    return {
      card: "border-amber-400/20 bg-amber-400/10",
      badge: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    };
  }

  return {
    card: "border-rose-400/20 bg-rose-400/10",
    badge: "border-rose-400/20 bg-rose-400/10 text-rose-200",
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
        className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:border-emerald-300/30 hover:bg-white/10"
    >
      {label}
    </Link>
  );
}

async function getAdminUsersData() {
  const [
    profiles,
    gurus,
    bookings,
    launchSignups,
    launchWaitlist,
  ] = await Promise.all([
    safeRows<ProfileRow>(
      supabaseAdmin
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "profiles"
    ),
    safeRows<GuruRow>(
      supabaseAdmin
        .from("gurus")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "gurus"
    ),
    safeRows<BookingRow>(
      supabaseAdmin
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "bookings"
    ),
    safeRows<LaunchSignupRow>(
      supabaseAdmin
        .from("launch_signups")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "launch_signups"
    ),
    safeRows<LaunchSignupRow>(
      supabaseAdmin
        .from("launch_waitlist")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "launch_waitlist"
    ),
  ]);

  const launchRows = mergeLaunchRows(launchSignups, launchWaitlist);

  const profileMap = new Map<string, ProfileRow>();

  for (const profile of profiles) {
    const id = getProfileId(profile);

    if (id) {
      profileMap.set(id, profile);
    }
  }

  const guruIdSet = new Set<string>();

  for (const guru of gurus) {
    const id = getGuruId(guru);

    if (id) {
      guruIdSet.add(id);
    }
  }

  const customerIds = new Set<string>();

  for (const booking of bookings) {
    const customerId =
      asTrimmedString(booking.customer_id) ||
      asTrimmedString(booking.pet_owner_id) ||
      asTrimmedString(booking.user_id);

    if (customerId) {
      customerIds.add(customerId);
    }
  }

  const profileRows: UserDisplayRow[] = profiles.map((profile) => {
    const id = getProfileId(profile);
    const role = guruIdSet.has(id) ? "Guru" : getProfileRole(profile);

    return {
      id: id || getProfileEmail(profile),
      name: getProfileName(profile),
      email: getProfileEmail(profile),
      role,
      status: role === "Guru" ? "Active" : getProfileStatus(profile),
      risk: getRiskLabel(profile),
      joined: formatDateShort(asTrimmedString(profile.created_at)),
      source: "Profile",
    };
  });

  const knownUserKeys = new Set(
    profileRows.flatMap((row) => [
      row.id.toLowerCase(),
      row.email.toLowerCase(),
    ])
  );

  const guruRows: UserDisplayRow[] = gurus
    .filter((guru) => {
      const id = getGuruId(guru).toLowerCase();
      const email = asTrimmedString(guru.email).toLowerCase();

      return !knownUserKeys.has(id) && !knownUserKeys.has(email);
    })
    .map((guru) => ({
      id: getGuruId(guru) || asTrimmedString(guru.slug) || "guru",
      name:
        asTrimmedString(guru.display_name) ||
        asTrimmedString(guru.full_name) ||
        asTrimmedString(guru.name) ||
        "Guru",
      email: asTrimmedString(guru.email) || "—",
      role: "Guru",
      status: getGuruStatus(guru),
      risk: getRiskLabel(guru),
      joined: formatDateShort(asTrimmedString(guru.created_at)),
      source: "Guru",
    }));

  const knownAfterGurus = new Set(
    [...profileRows, ...guruRows].flatMap((row) => [
      row.id.toLowerCase(),
      row.email.toLowerCase(),
    ])
  );

  const launchDisplayRows: UserDisplayRow[] = launchRows
    .filter((row) => {
      const id = getLaunchIdentity(row).toLowerCase();
      const email = asTrimmedString(row.email).toLowerCase();

      return !knownAfterGurus.has(id) && !knownAfterGurus.has(email);
    })
    .slice(0, 250)
    .map((row) => ({
      id: getLaunchIdentity(row) || asTrimmedString(row.email) || "launch",
      name: getLaunchName(row),
      email: asTrimmedString(row.email) || "—",
      role: getLaunchRole(row),
      status: "Lead",
      risk: "Low",
      joined: formatDateShort(asTrimmedString(row.created_at)),
      source:
        asTrimmedString(row.source) ||
        asTrimmedString(row.utm_source) ||
        "Launch",
    }));

  const users = [...profileRows, ...guruRows, ...launchDisplayRows].sort(
    (a, b) => {
      const aDate = new Date(a.joined).getTime();
      const bDate = new Date(b.joined).getTime();

      return (
        (Number.isFinite(bDate) ? bDate : 0) -
        (Number.isFinite(aDate) ? aDate : 0)
      );
    }
  );

  const totalUsers = users.length;
  const newThisWeek =
    profiles.filter((row) => isWithinLastDays(row.created_at, 7)).length +
    gurus.filter((row) => isWithinLastDays(row.created_at, 7)).length +
    launchRows.filter((row) => isWithinLastDays(row.created_at, 7)).length;

  const verifiedGurus = gurus.filter(
    (guru) =>
      Boolean(guru.is_verified || guru.verified) ||
      getGuruStatus(guru) === "Verified"
  ).length;

  const flaggedAccounts = users.filter(
    (user) => user.risk === "High" || user.status === "Suspended"
  ).length;

  const roleCounts = {
    petParents: users.filter(
      (user) =>
        user.role === "Pet Parent" ||
        user.role === "Pet Parent Lead" ||
        user.role === "Customer + Guru Lead"
    ).length,
    gurus: users.filter(
      (user) =>
        user.role === "Guru" ||
        user.role === "Future Guru Lead" ||
        user.role === "Customer + Guru Lead"
    ).length,
    vendors: users.filter((user) => user.role === "Vendor").length,
    educators: users.filter((user) => user.role === "Educator").length,
    medical: users.filter((user) => user.role === "Medical Pro").length,
    admins: users.filter((user) => user.role === "Admin").length,
  };

  const healthScore =
    totalUsers === 0
      ? 0
      : Math.max(
          0,
          Math.min(100, Math.round(100 - (flaggedAccounts / totalUsers) * 100))
        );

  return {
    users: users.slice(0, 25),
    totals: {
      totalUsers,
      newThisWeek,
      verifiedGurus,
      flaggedAccounts,
      healthScore,
      launchLeads: launchRows.length,
      customerIds: customerIds.size,
      profileCount: profiles.length,
      guruCount: gurus.length,
    },
    roleCounts,
  };
}

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const data = await getAdminUsersData();

  const stats = [
    {
      label: "Total Users",
      value: data.totals.totalUsers.toLocaleString(),
      sub: `${data.totals.profileCount.toLocaleString()} profiles + ${data.totals.launchLeads.toLocaleString()} launch leads`,
      tone: "emerald" as Tone,
    },
    {
      label: "New This Week",
      value: data.totals.newThisWeek.toLocaleString(),
      sub: "Recent profiles, Gurus, and leads",
      tone: "sky" as Tone,
    },
    {
      label: "Verified Gurus",
      value: data.totals.verifiedGurus.toLocaleString(),
      sub: `${data.totals.guruCount.toLocaleString()} Guru records`,
      tone: "violet" as Tone,
    },
    {
      label: "Accounts Flagged",
      value: data.totals.flaggedAccounts.toLocaleString(),
      sub: "High-risk or suspended accounts",
      tone: "rose" as Tone,
    },
  ];

  const roleLinks = [
    {
      title: "Pet Parents",
      value: data.roleCounts.petParents,
      href: "/admin/users/pet-owners",
    },
    {
      title: "Gurus",
      value: data.roleCounts.gurus,
      href: "/admin/gurus",
    },
    {
      title: "Vendors",
      value: data.roleCounts.vendors,
      href: "/admin/vendor-approvals",
    },
    {
      title: "Educators",
      value: data.roleCounts.educators,
      href: "/admin/users/educators",
    },
    {
      title: "Medical Pros",
      value: data.roleCounts.medical,
      href: "/admin/users/medical",
    },
    {
      title: "Admins",
      value: data.roleCounts.admins,
      href: "/admin/users/admins",
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_30%),radial-gradient(circle_at_right,_rgba(14,165,233,0.10),_transparent_28%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-sky-500/10 p-6 shadow-[0_12px_60px_rgba(0,0,0,0.28)] lg:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                User Management
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Live SitGuru users, roles, trust signals, and account oversight.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                This page is now wired to SitGuru data from profiles, Gurus,
                bookings, and launch signups so admin user counts match the live
                platform instead of static sample content.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionLink href="/admin" label="Overview" />
              <ActionLink href="/admin/guru-approvals" label="Review Gurus" />
              <ActionLink href="/admin/launch-signups" label="Launch Leads" />
              <ActionLink href="/admin/exports" label="Export Users" primary />
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const tone = statToneClasses(stat.tone);

              return (
                <div
                  key={stat.label}
                  className={`rounded-3xl border p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] ${tone.card}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-4xl font-black tracking-tight text-white">
                    {stat.value}
                  </p>
                  <div
                    className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${tone.badge}`}
                  >
                    {stat.sub}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                  Recent Accounts
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                  Live user activity and trust signals
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Recent rows from SitGuru profiles, Guru records, and launch
                  lead submissions.
                </p>
              </div>

              <ActionLink href="/admin/users" label="Refresh" />
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white/5 text-slate-400">
                    <tr>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em]">
                        Name
                      </th>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em]">
                        Email
                      </th>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em]">
                        Role
                      </th>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em]">
                        Status
                      </th>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em]">
                        Risk
                      </th>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em]">
                        Source
                      </th>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em]">
                        Joined
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/10 bg-slate-950/40">
                    {data.users.length ? (
                      data.users.map((sitGuruUser) => (
                        <tr
                          key={`${sitGuruUser.id}-${sitGuruUser.email}-${sitGuruUser.source}`}
                          className="transition hover:bg-white/5"
                        >
                          <td className="px-5 py-4">
                            <div className="font-bold text-white">
                              {sitGuruUser.name}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              SitGuru account
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {sitGuruUser.email}
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {sitGuruUser.role}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusStyle(
                                sitGuruUser.status
                              )}`}
                            >
                              {sitGuruUser.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${riskStyle(
                                sitGuruUser.risk
                              )}`}
                            >
                              {sitGuruUser.risk}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-400">
                            {sitGuruUser.source}
                          </td>
                          <td className="px-5 py-4 text-slate-400">
                            {sitGuruUser.joined}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-8 text-center text-slate-400"
                        >
                          No SitGuru users found yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Moderation
              </p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-white">
                Account actions
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                Use the linked admin areas to review Gurus, support users, and
                monitor account health.
              </p>

              <div className="mt-5 space-y-3">
                <Link
                  href="/admin/guru-approvals"
                  className="flex w-full items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-100 transition hover:bg-amber-400/15"
                >
                  Review Guru Applications
                </Link>

                <Link
                  href="/admin/messages"
                  className="flex w-full items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm font-bold text-sky-100 transition hover:bg-sky-400/15"
                >
                  Open Message Center
                </Link>

                <Link
                  href="/admin/fraud"
                  className="flex w-full items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-bold text-rose-100 transition hover:bg-rose-400/15"
                >
                  Fraud / Trust Review
                </Link>
              </div>
            </div>

            <div className="rounded-[32px] border border-emerald-400/20 bg-emerald-400/10 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                User Health Score
              </p>
              <p className="mt-3 text-5xl font-black tracking-tight text-white">
                {data.totals.healthScore}%
              </p>
              <p className="mt-3 text-sm leading-7 text-emerald-50/90">
                Based on total live users compared with high-risk or suspended
                accounts detected in available SitGuru account fields.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Role Navigation
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                Manage live SitGuru user groups
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Counts below are calculated from profiles, Guru records, bookings,
                and launch lead data.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roleLinks.map((role) => (
              <Link
                key={role.title}
                href={role.href}
                className="group rounded-3xl border border-white/10 bg-slate-950/40 p-5 transition hover:border-emerald-300/30 hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-black text-white">
                      {role.title}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {role.value.toLocaleString()} live record
                      {role.value === 1 ? "" : "s"} detected.
                    </p>
                  </div>

                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-emerald-300 transition group-hover:bg-emerald-400/10">
                    Manage →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
