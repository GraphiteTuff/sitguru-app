import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import UserDirectoryActionPanels from "@/components/admin/users/UserDirectoryActionPanels";
import UsersDirectoryList from "@/components/admin/users/UsersDirectoryList";
import UsersFilterBar from "@/components/admin/users/UsersFilterBar";
import UsersPagination from "@/components/admin/users/UsersPagination";
import {
  buildDepartmentComposeHref,
  type AdminDepartmentKey,
  type DirectoryUserContext,
} from "@/lib/admin/user-directory-actions";
import {
  buildDirectoryHref,
  firstSearchParam,
  parseDirectoryFilters,
} from "@/lib/admin/users/normalize";
import { getAdminUsersDirectory } from "@/lib/admin/users/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type Tone = "emerald" | "sky" | "violet" | "amber" | "rose";

function getDepartmentMessageHref(params: {
  department: string;
  label: string;
  user?: DirectoryUserContext | null;
}) {
  return buildDepartmentComposeHref({
    department: params.department as AdminDepartmentKey | string,
    departmentLabel: params.label,
    user: params.user,
  });
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
      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
    >
      {label}
    </Link>
  );
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

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const params = searchParams ? await searchParams : {};

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const filters = parseDirectoryFilters(params);
  const selectedUserId = firstSearchParam(params.user);
  const selectedEmail = firstSearchParam(params.email);
  const selectedName = firstSearchParam(params.name);
  const selectedRole = firstSearchParam(params.scopedRole);

  let selectedUser: DirectoryUserContext | null = null;

  if (selectedUserId || selectedEmail) {
    selectedUser = {
      id: selectedUserId || null,
      email: selectedEmail || null,
      name: selectedName || null,
      role: selectedRole || null,
      source: "directory",
    };

    if (selectedUserId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, display_name, name, role")
        .eq("id", selectedUserId)
        .maybeSingle();

      if (profile) {
        selectedUser = {
          id: String(profile.id),
          email: String(profile.email || selectedEmail || "") || null,
          name:
            String(
              profile.full_name ||
                profile.display_name ||
                profile.name ||
                selectedName ||
                "",
            ) || null,
          role: String(profile.role || selectedRole || "") || null,
          source: "profile",
        };
      }
    }
  }

  const data = await getAdminUsersDirectory(filters);
  const preserve = {
    user: selectedUser?.id || undefined,
    email: selectedUser?.email || undefined,
    name: selectedUser?.name || undefined,
    scopedRole: selectedUser?.role || undefined,
  };

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
      sub: "Recent profiles and leads",
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
      href: buildDirectoryHref({ role: "pet_parent" }),
      messageHref: getDepartmentMessageHref({
        department: "customer_service",
        label: "Pet Parents / Customer Service",
        user: selectedUser,
      }),
    },
    {
      title: "Gurus",
      value: data.roleCounts.gurus,
      href: buildDirectoryHref({ role: "guru" }),
      messageHref: getDepartmentMessageHref({
        department: "trust_safety",
        label: "Gurus / Trust & Safety",
        user: selectedUser,
      }),
    },
    {
      title: "Vendors",
      value: data.roleCounts.vendors,
      href: buildDirectoryHref({ role: "vendor" }),
      messageHref: getDepartmentMessageHref({
        department: "sales_marketing",
        label: "Vendors / Partners",
        user: selectedUser,
      }),
    },
    {
      title: "Educators",
      value: data.roleCounts.educators,
      href: buildDirectoryHref({ role: "educator" }),
      messageHref: getDepartmentMessageHref({
        department: "sales_marketing",
        label: "Educators / Programs",
        user: selectedUser,
      }),
    },
    {
      title: "Medical Pros",
      value: data.roleCounts.medical,
      href: buildDirectoryHref({ role: "medical" }),
      messageHref: getDepartmentMessageHref({
        department: "trust_safety",
        label: "Medical Pros / Trust & Safety",
        user: selectedUser,
      }),
    },
    {
      title: "Admins",
      value: data.roleCounts.admins,
      href: buildDirectoryHref({ role: "admin" }),
      messageHref: getDepartmentMessageHref({
        department: "executive",
        label: "Admins / Executive",
        user: selectedUser,
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
        user: selectedUser,
      }),
    },
    {
      title: "Billing & Finance",
      description:
        "Financial statements, Stripe, payouts, NFCU, Plaid, and reconciliation.",
      href: getDepartmentMessageHref({
        department: "billing_finance",
        label: "Billing & Finance",
        user: selectedUser,
      }),
    },
    {
      title: "Customer Service",
      description: "Pet Parents, Gurus, bookings, support issues, and messages.",
      href: getDepartmentMessageHref({
        department: "customer_service",
        label: "Customer Service",
        user: selectedUser,
      }),
    },
    {
      title: "Trust & Safety",
      description:
        "Guru approvals, Checkr, screening, profile readiness, and bookable status.",
      href: getDepartmentMessageHref({
        department: "trust_safety",
        label: "Trust & Safety",
        user: selectedUser,
      }),
    },
    {
      title: "Tech Support",
      description:
        "Login issues, MFA, bugs, integrations, webhooks, and system health.",
      href: getDepartmentMessageHref({
        department: "tech_support",
        label: "Tech Support",
        user: selectedUser,
      }),
    },
    {
      title: "Sales & Marketing",
      description: "Partners, affiliates, referrals, campaigns, and growth programs.",
      href: getDepartmentMessageHref({
        department: "sales_marketing",
        label: "Sales & Marketing",
        user: selectedUser,
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
                Search, filter, and page through profiles and launch leads without
                loading the full directory at once. Communication and moderation
                actions stay scoped to the selected user across desktop and mobile.
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
                Admin Department Messaging
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
            <ActionLink href="/admin/settings" label="Manage Admin Access" />
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
          <div className="order-2 space-y-4 rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8 xl:order-1">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                  Directory
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  Searchable user activity and trust signals.
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Server-side search, role/status filters, and pagination keep the
                  directory fast on desktop, webapp, and mobile.
                  {selectedUser ? (
                    <>
                      {" "}
                      Actions are scoped to{" "}
                      <span className="font-black text-slate-900">
                        {selectedUser.name ||
                          selectedUser.email ||
                          selectedUser.id}
                      </span>
                      .
                    </>
                  ) : null}
                </p>
              </div>
              <ActionLink href={buildDirectoryHref({})} label="Clear filters" />
            </div>

            <UsersFilterBar
              filters={data.filters}
              filteredTotal={data.totals.filteredTotal}
              preserve={preserve}
            />

            <UsersDirectoryList users={data.users} />

            <UsersPagination
              filters={data.filters}
              pageCount={data.pageCount}
              filteredTotal={data.totals.filteredTotal}
              preserve={preserve}
            />
          </div>

          <aside className="order-1 space-y-5 xl:order-2">
            <UserDirectoryActionPanels selectedUser={selectedUser} />

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
                Role cards now filter this directory instead of linking to missing
                sub-routes.
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
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                  >
                    Filter
                  </Link>
                  <Link
                    href={role.messageHref}
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-800"
                  >
                    Message
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
