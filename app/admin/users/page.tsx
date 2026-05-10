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
  messageHref: string;
  profileHref: string;
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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
  label: string,
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
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status.includes("Pending") || status.includes("Review")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status.includes("Suspended")) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function riskStyle(risk: string) {
  if (risk === "High") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (risk === "Medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function statToneClasses(tone: Tone) {
  if (tone === "emerald") {
    return {
      card: "border-emerald-100 bg-emerald-50",
      icon: "bg-emerald-100 text-emerald-800",
      accent: "text-emerald-700",
    };
  }

  if (tone === "sky") {
    return {
      card: "border-sky-100 bg-sky-50",
      icon: "bg-sky-100 text-sky-800",
      accent: "text-sky-700",
    };
  }

  if (tone === "violet") {
    return {
      card: "border-violet-100 bg-violet-50",
      icon: "bg-violet-100 text-violet-800",
      accent: "text-violet-700",
    };
  }

  if (tone === "amber") {
    return {
      card: "border-amber-100 bg-amber-50",
      icon: "bg-amber-100 text-amber-800",
      accent: "text-amber-700",
    };
  }

  return {
    card: "border-rose-100 bg-rose-50",
    icon: "bg-rose-100 text-rose-800",
    accent: "text-rose-700",
  };
}

function getMessageHref(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  source: string;
}) {
  const params = new URLSearchParams({
    threadType: "internal",
    recipientId: user.id,
    recipientEmail: user.email,
    recipientName: user.name,
    recipientRole: user.role,
    source: user.source,
  });

  return `/admin/messages?${params.toString()}`;
}

function getDepartmentMessageHref(params: {
  department: string;
  label: string;
}) {
  const query = new URLSearchParams({
    threadType: "internal_department",
    department: params.department,
    departmentLabel: params.label,
  });

  return `/admin/messages?${query.toString()}`;
}

function getProfileHref(user: {
  id: string;
  email: string;
  role: string;
  source: string;
}) {
  if (user.role === "Guru") {
    return `/admin/gurus?guru=${encodeURIComponent(user.id)}`;
  }

  if (user.role.includes("Pet Parent")) {
    return `/admin/customers?user=${encodeURIComponent(user.id)}`;
  }

  if (user.source === "Launch") {
    return `/admin/launch-signups?email=${encodeURIComponent(user.email)}`;
  }

  return `/admin/users?user=${encodeURIComponent(user.id)}`;
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
        className="inline-flex items-center justify-center rounded-2xl bg-emerald-700 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-800"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
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
      "profiles",
    ),
    safeRows<GuruRow>(
      supabaseAdmin
        .from("gurus")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "gurus",
    ),
    safeRows<BookingRow>(
      supabaseAdmin
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "bookings",
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
  ]);

  const launchRows = mergeLaunchRows(launchSignups, launchWaitlist);
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
    const email = getProfileEmail(profile);
    const name = getProfileName(profile);
    const source = "Profile";

    const baseUser = {
      id: id || email,
      email,
      name,
      role,
      source,
    };

    return {
      ...baseUser,
      status: role === "Guru" ? "Active" : getProfileStatus(profile),
      risk: getRiskLabel(profile),
      joined: formatDateShort(asTrimmedString(profile.created_at)),
      messageHref: getMessageHref(baseUser),
      profileHref: getProfileHref(baseUser),
    };
  });

  const knownUserKeys = new Set(
    profileRows.flatMap((row) => [
      row.id.toLowerCase(),
      row.email.toLowerCase(),
    ]),
  );

  const guruRows: UserDisplayRow[] = gurus
    .filter((guru) => {
      const id = getGuruId(guru).toLowerCase();
      const email = asTrimmedString(guru.email).toLowerCase();

      return !knownUserKeys.has(id) && !knownUserKeys.has(email);
    })
    .map((guru) => {
      const id = getGuruId(guru) || asTrimmedString(guru.slug) || "guru";
      const email = asTrimmedString(guru.email) || "—";
      const name =
        asTrimmedString(guru.display_name) ||
        asTrimmedString(guru.full_name) ||
        asTrimmedString(guru.name) ||
        "Guru";
      const source = "Guru";
      const role = "Guru";

      const baseUser = {
        id,
        email,
        name,
        role,
        source,
      };

      return {
        ...baseUser,
        status: getGuruStatus(guru),
        risk: getRiskLabel(guru),
        joined: formatDateShort(asTrimmedString(guru.created_at)),
        messageHref: getMessageHref(baseUser),
        profileHref: getProfileHref(baseUser),
      };
    });

  const knownAfterGurus = new Set(
    [...profileRows, ...guruRows].flatMap((row) => [
      row.id.toLowerCase(),
      row.email.toLowerCase(),
    ]),
  );

  const launchDisplayRows: UserDisplayRow[] = launchRows
    .filter((row) => {
      const id = getLaunchIdentity(row).toLowerCase();
      const email = asTrimmedString(row.email).toLowerCase();

      return !knownAfterGurus.has(id) && !knownAfterGurus.has(email);
    })
    .slice(0, 250)
    .map((row) => {
      const id = getLaunchIdentity(row) || asTrimmedString(row.email) || "launch";
      const email = asTrimmedString(row.email) || "—";
      const name = getLaunchName(row);
      const role = getLaunchRole(row);
      const source =
        asTrimmedString(row.source) ||
        asTrimmedString(row.utm_source) ||
        "Launch";

      const baseUser = {
        id,
        email,
        name,
        role,
        source,
      };

      return {
        ...baseUser,
        status: "Lead",
        risk: "Low",
        joined: formatDateShort(asTrimmedString(row.created_at)),
        messageHref: getMessageHref(baseUser),
        profileHref: getProfileHref(baseUser),
      };
    });

  const users = [...profileRows, ...guruRows, ...launchDisplayRows];

  const totalUsers = users.length;
  const newThisWeek =
    profiles.filter((row) => isWithinLastDays(row.created_at, 7)).length +
    gurus.filter((row) => isWithinLastDays(row.created_at, 7)).length +
    launchRows.filter((row) => isWithinLastDays(row.created_at, 7)).length;

  const verifiedGurus = gurus.filter(
    (guru) =>
      Boolean(guru.is_verified || guru.verified) ||
      getGuruStatus(guru) === "Verified",
  ).length;

  const flaggedAccounts = users.filter(
    (user) => user.risk === "High" || user.status === "Suspended",
  ).length;

  const roleCounts = {
    petParents: users.filter(
      (user) =>
        user.role === "Pet Parent" ||
        user.role === "Pet Parent Lead" ||
        user.role === "Customer + Guru Lead",
    ).length,
    gurus: users.filter(
      (user) =>
        user.role === "Guru" ||
        user.role === "Future Guru Lead" ||
        user.role === "Customer + Guru Lead",
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
          Math.min(100, Math.round(100 - (flaggedAccounts / totalUsers) * 100)),
        );

  return {
    users: users.slice(0, 75),
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
      messageHref: getDepartmentMessageHref({
        department: "customer_service",
        label: "Pet Parents / Customer Service",
      }),
    },
    {
      title: "Gurus",
      value: data.roleCounts.gurus,
      href: "/admin/gurus",
      messageHref: getDepartmentMessageHref({
        department: "trust_safety",
        label: "Gurus / Trust & Safety",
      }),
    },
    {
      title: "Vendors",
      value: data.roleCounts.vendors,
      href: "/admin/vendor-approvals",
      messageHref: getDepartmentMessageHref({
        department: "partners",
        label: "Vendors / Partners",
      }),
    },
    {
      title: "Educators",
      value: data.roleCounts.educators,
      href: "/admin/users/educators",
      messageHref: getDepartmentMessageHref({
        department: "programs",
        label: "Educators / Programs",
      }),
    },
    {
      title: "Medical Pros",
      value: data.roleCounts.medical,
      href: "/admin/users/medical",
      messageHref: getDepartmentMessageHref({
        department: "trust_safety",
        label: "Medical Pros / Trust & Safety",
      }),
    },
    {
      title: "Admins",
      value: data.roleCounts.admins,
      href: "/admin/users/admins",
      messageHref: getDepartmentMessageHref({
        department: "executive",
        label: "Admins / Executive",
      }),
    },
  ];

  const departmentLinks = [
    {
      title: "Executive / Founder",
      description: "CEO, founders, owners, and super user communication.",
      href: getDepartmentMessageHref({
        department: "executive",
        label: "Executive / Founder",
      }),
    },
    {
      title: "Billing & Finance",
      description:
        "Financial statements, Stripe, payouts, NFCU, Plaid, and reconciliation.",
      href: getDepartmentMessageHref({
        department: "billing_finance",
        label: "Billing & Finance",
      }),
    },
    {
      title: "Customer Service",
      description: "Pet Parents, Gurus, bookings, support issues, and messages.",
      href: getDepartmentMessageHref({
        department: "customer_service",
        label: "Customer Service",
      }),
    },
    {
      title: "Trust & Safety",
      description:
        "Guru approvals, Checkr, screening, profile readiness, and bookable status.",
      href: getDepartmentMessageHref({
        department: "trust_safety",
        label: "Trust & Safety",
      }),
    },
    {
      title: "Tech Support",
      description: "Login issues, MFA, bugs, integrations, webhooks, and system health.",
      href: getDepartmentMessageHref({
        department: "tech_support",
        label: "Tech Support",
      }),
    },
    {
      title: "Sales & Marketing",
      description: "Partners, affiliates, referrals, campaigns, and growth programs.",
      href: getDepartmentMessageHref({
        department: "sales_marketing",
        label: "Sales & Marketing",
      }),
    },
  ];

  return (
    <main className="min-h-screen bg-[#f9faf5] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1640px] space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.13),transparent_32%),linear-gradient(135deg,#ffffff_0%,#ecfdf5_56%,#f8fafc_100%)] p-6 shadow-sm sm:p-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                User Directory / Internal Communications
              </p>

              <h1 className="mt-3 max-w-5xl text-4xl font-black leading-[0.96] tracking-tight text-slate-950 sm:text-5xl">
                Live SitGuru users, roles, trust signals, and messaging.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-semibold leading-7 text-slate-700 sm:text-base">
                This page is wired to SitGuru profiles, Gurus, bookings, and
                launch signups. It connects directly into the Admin Message
                Center so HQ teams can message users, departments, and role
                groups from one clean directory.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 xl:justify-end">
              <ActionLink href="/admin" label="Overview" />
              <ActionLink href="/admin/messages" label="Open Message Center" />
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
                  className={`rounded-[1.5rem] border p-5 shadow-sm ${tone.card}`}
                >
                  <div className={`mb-4 h-2 w-14 rounded-full ${tone.icon}`} />
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">
                    {stat.value}
                  </p>
                  <p className={`mt-3 text-sm font-black ${tone.accent}`}>
                    {stat.sub}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                HQ Department Messaging
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Message internal teams from the directory.
              </h2>
              <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
                Start department-level internal threads with Finance, Tech
                Support, Customer Service, Trust & Safety, leadership, and Sales
                & Marketing.
              </p>
            </div>

            <ActionLink href="/admin/settings" label="Manage HQ Access" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {departmentLinks.map((department) => (
              <Link
                key={department.title}
                href={department.href}
                className="group rounded-[1.5rem] border border-slate-200 bg-[#fbfefd] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50"
              >
                <h3 className="text-lg font-black text-slate-950">
                  {department.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {department.description}
                </p>
                <p className="mt-4 text-sm font-black text-emerald-700">
                  Message department →
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                  Recent Accounts
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  Live user activity and trust signals.
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Each row includes message and review actions for internal
                  SitGuru support, customer care, Trust & Safety, and Tech
                  Support.
                </p>
              </div>

              <ActionLink href="/admin/users" label="Refresh" />
            </div>

            <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-[1180px] text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.18em]">
                        Name
                      </th>
                      <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.18em]">
                        Email
                      </th>
                      <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.18em]">
                        Role
                      </th>
                      <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.18em]">
                        Status
                      </th>
                      <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.18em]">
                        Risk
                      </th>
                      <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.18em]">
                        Source
                      </th>
                      <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.18em]">
                        Joined
                      </th>
                      <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.18em]">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {data.users.length ? (
                      data.users.map((sitGuruUser) => (
                        <tr
                          key={`${sitGuruUser.id}-${sitGuruUser.email}-${sitGuruUser.source}`}
                          className="transition hover:bg-emerald-50/40"
                        >
                          <td className="px-5 py-4">
                            <div className="font-black text-slate-950">
                              {sitGuruUser.name}
                            </div>
                            <div className="mt-1 max-w-[260px] break-all text-xs font-semibold text-slate-400">
                              {sitGuruUser.id}
                            </div>
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-600">
                            {sitGuruUser.email}
                          </td>
                          <td className="px-5 py-4 font-black text-slate-700">
                            {sitGuruUser.role}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusStyle(
                                sitGuruUser.status,
                              )}`}
                            >
                              {sitGuruUser.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${riskStyle(
                                sitGuruUser.risk,
                              )}`}
                            >
                              {sitGuruUser.risk}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-500">
                            {sitGuruUser.source}
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-500">
                            {sitGuruUser.joined}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex min-w-[190px] flex-col gap-2">
                              <Link
                                href={sitGuruUser.messageHref}
                                className="inline-flex items-center justify-center rounded-2xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800"
                              >
                                Message
                              </Link>
                              <Link
                                href={sitGuruUser.profileHref}
                                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                              >
                                Review
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-5 py-12 text-center text-slate-500"
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

          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                Communication Actions
              </p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                Directory-powered messaging.
              </h3>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                Route issues between Customer Service, Trust & Safety, Finance,
                Tech Support, and leadership without leaving the Admin portal.
              </p>

              <div className="mt-5 space-y-3">
                <Link
                  href="/admin/messages?threadType=internal"
                  className="flex w-full items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
                >
                  Start Internal Message
                </Link>

                <Link
                  href={getDepartmentMessageHref({
                    department: "tech_support",
                    label: "Tech Support",
                  })}
                  className="flex w-full items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-black text-sky-800 transition hover:bg-sky-100"
                >
                  Message Tech Support
                </Link>

                <Link
                  href={getDepartmentMessageHref({
                    department: "customer_service",
                    label: "Customer Service",
                  })}
                  className="flex w-full items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-black text-violet-800 transition hover:bg-violet-100"
                >
                  Message Customer Service
                </Link>

                <Link
                  href={getDepartmentMessageHref({
                    department: "billing_finance",
                    label: "Billing & Finance",
                  })}
                  className="flex w-full items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-800 transition hover:bg-amber-100"
                >
                  Message Billing & Finance
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                Moderation
              </p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                Account actions.
              </h3>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                Use linked Admin areas to review Gurus, support users, and
                monitor account health.
              </p>

              <div className="mt-5 space-y-3">
                <Link
                  href="/admin/guru-approvals"
                  className="flex w-full items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-800 transition hover:bg-amber-100"
                >
                  Review Guru Applications
                </Link>

                <Link
                  href="/admin/messages"
                  className="flex w-full items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-black text-sky-800 transition hover:bg-sky-100"
                >
                  Open Message Center
                </Link>

                <Link
                  href="/admin/fraud"
                  className="flex w-full items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-800 transition hover:bg-rose-100"
                >
                  Fraud / Trust Review
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                User Health Score
              </p>
              <p className="mt-3 text-5xl font-black tracking-tight text-slate-950">
                {data.totals.healthScore}%
              </p>
              <p className="mt-3 text-sm font-semibold leading-7 text-emerald-800">
                Based on total live users compared with high-risk or suspended
                accounts detected in available SitGuru account fields.
              </p>
            </div>
          </aside>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                Role Navigation
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Manage and message live SitGuru user groups.
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Counts are calculated from profiles, Guru records, bookings, and
                launch lead data.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roleLinks.map((role) => (
              <div
                key={role.title}
                className="rounded-[1.5rem] border border-slate-200 bg-[#fbfefd] p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-black text-slate-950">
                      {role.title}
                    </h4>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      {role.value.toLocaleString()} live record
                      {role.value === 1 ? "" : "s"} detected.
                    </p>
                  </div>

                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                    {role.value.toLocaleString()}
                  </span>
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <Link
                    href={role.href}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                  >
                    Manage
                  </Link>
                  <Link
                    href={role.messageHref}
                    className="inline-flex items-center justify-center rounded-2xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-800"
                  >
                    Message
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-sky-100 bg-sky-50 p-5 shadow-sm sm:p-6 lg:p-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-700">
            User Directory Messaging Notes
          </p>
          <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
            Message links pass recipient, role, source, thread type, and
            department details into `/admin/messages`. The Message Center can
            now read those values and create internal HQ threads.
          </p>
        </section>
      </div>
    </main>
  );
}
