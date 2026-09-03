import Link from "next/link";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  Download,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Medal,
  ShieldCheck,
  Sparkles,
  Users,
  UsersRound,
} from "lucide-react";
import { AdminThemeCard } from "@/components/admin/AdminThemeCard";
import {
  AdminWorkplaceActions,
  GrowthCard,
  GrowthPageFrame,
  StatusPill,
} from "@/components/admin/growth/GrowthPageFrame";
import { getAdminIdentity } from "@/lib/admin/access";
import { getProgramsDashboardData } from "@/lib/admin/programs/dashboard";
import { VETERANS_MILITARY_FAMILIES_PROGRAM } from "@/lib/programs/veterans-military-families";

export const dynamic = "force-dynamic";

const routes = {
  dashboard: "/admin",
  overview: "/admin/programs/overview",
  applications: "/admin/program-applications",
  studentHire: "/admin/programs/student-hire",
  communityHire: "/admin/programs/community-hire",
  militaryHire: "/admin/programs/military-hire",
  skillbridge: "/admin/programs/skillbridge-interest",
  ambassadors: "/admin/ambassadors",
  ambassadorLeads: "/admin/ambassador-leads",
  partners: "/admin/partners",
  referrals: "/admin/referrals",
  hr: "/admin/hr",
  exports: "/admin/exports",
  gurus: "/admin/gurus",
  backgroundChecks: "/admin/background-checks",
};

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

function formatWhen(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function AdminProgramsHubPage() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessAdmin) {
    return (
      <div className="min-h-screen bg-[#f7fbf8] px-6 py-10 text-slate-950">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-100 bg-white p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-700">
            Access Restricted
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
            Admin access required.
          </h1>
        </div>
      </div>
    );
  }

  const data = await getProgramsDashboardData();
  const healthy = data.sourceHealth.filter((source) => source.ok).length;
  const queueCount =
    data.metrics.pendingApplications + data.metrics.ambassadorLeads;
  const latest = [...data.recentApplications, ...data.recentAmbassadorLeads]
    .sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 6);

  const tiles = [
    {
      label: "Applications",
      value: number(data.metrics.applications),
      helper: `${number(data.metrics.pendingApplications)} pending`,
      tone: "emerald" as const,
      icon: <ClipboardList size={18} />,
    },
    {
      label: "Pending review",
      value: number(data.metrics.pendingApplications),
      helper: "Needs a decision",
      tone: "amber" as const,
      icon: <ClipboardList size={18} />,
    },
    {
      label: "Approved",
      value: number(data.metrics.approvedApplications),
      helper: "Ready to onboard",
      tone: "sky" as const,
      icon: <BadgeCheck size={18} />,
    },
    {
      label: "Ambassador leads",
      value: number(data.metrics.ambassadorLeads),
      helper: "Recruiting pipeline",
      tone: "violet" as const,
      icon: <UsersRound size={18} />,
    },
    {
      label: "Ambassadors",
      value: number(data.metrics.ambassadors),
      helper: "Active growth network",
      tone: "emerald" as const,
      icon: <HeartHandshake size={18} />,
    },
    {
      label: "Partners",
      value: number(data.metrics.partnerApplications),
      helper: "Clinic and community",
      tone: "slate" as const,
      icon: <Handshake size={18} />,
    },
    {
      label: "SkillBridge",
      value: number(data.metrics.skillbridgeInterest),
      helper: "Interest only",
      tone: "rose" as const,
      icon: <ShieldCheck size={18} />,
    },
    {
      label: "Sources live",
      value: `${healthy}/${data.sourceHealth.length}`,
      helper: "Applications and leads",
      tone: "sky" as const,
      icon: <Sparkles size={18} />,
    },
  ];

  const actions = [
    {
      href: routes.applications,
      label: "Review applications",
      detail: `${number(data.metrics.pendingApplications)} waiting`,
      icon: ClipboardList,
      primary: data.metrics.pendingApplications > 0,
    },
    {
      href: routes.ambassadorLeads,
      label: "Ambassador leads",
      detail: `${number(data.metrics.ambassadorLeads)} in the pipeline`,
      icon: UsersRound,
    },
    {
      href: routes.studentHire,
      label: "Student Hire",
      detail: `${number(data.metrics.studentHire)} campus applicants`,
      icon: GraduationCap,
    },
    {
      href: routes.communityHire,
      label: "Community Hire",
      detail: `${number(data.metrics.communityHire)} workforce applicants`,
      icon: Building2,
    },
    {
      href: routes.militaryHire,
      label: "Veterans pathway",
      detail: VETERANS_MILITARY_FAMILIES_PROGRAM.shortName,
      icon: Medal,
    },
    {
      href: routes.skillbridge,
      label: "SkillBridge interest",
      detail: "Track interest, no placement promise",
      icon: ShieldCheck,
    },
    {
      href: routes.ambassadors,
      label: "Ambassadors",
      detail: `${number(data.metrics.ambassadors)} live accounts`,
      icon: HeartHandshake,
    },
    {
      href: routes.partners,
      label: "Partners",
      detail: "Clinics and community sources",
      icon: Handshake,
    },
    {
      href: routes.overview,
      label: "Programs overview",
      detail: "Definitions and readiness",
      icon: BriefcaseBusiness,
    },
  ];

  const pathways = [
    {
      href: routes.studentHire,
      label: "Student Hire",
      value: data.metrics.studentHire,
      helper: "Earn with the Pack",
      tone: "sky" as const,
      icon: <GraduationCap size={18} />,
    },
    {
      href: routes.communityHire,
      label: "Community Hire",
      value: data.metrics.communityHire,
      helper: "Work with the Pack",
      tone: "emerald" as const,
      icon: <Building2 size={18} />,
    },
    {
      href: routes.militaryHire,
      label: "Veterans",
      value: data.metrics.militaryHire,
      helper: "Serve with the Pack",
      tone: "violet" as const,
      icon: <Medal size={18} />,
    },
    {
      href: routes.skillbridge,
      label: "SkillBridge",
      value: data.metrics.skillbridgeInterest,
      helper: "Interest list only",
      tone: "amber" as const,
      icon: <ShieldCheck size={18} />,
    },
  ];

  return (
    <GrowthPageFrame
      kicker="Growth Programs Workplace"
      title="Turn applications into Gurus, Ambassadors, and partners."
      detail="Review who applied, walk each hire pathway, then send people on to Checkr, HR, or the Ambassador desk."
      action={
        <Link
          href={routes.applications}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-green-950"
        >
          <ClipboardList size={17} />
          Review applications
        </Link>
      }
    >
      <div className="flex flex-wrap gap-2">
        <Link
          href={routes.dashboard}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800"
        >
          Admin HQ
        </Link>
        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
          {actor.email}
        </span>
      </div>

      <section className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((tile) => (
          <AdminThemeCard
            key={tile.label}
            label={tile.label}
            value={tile.value}
            helper={tile.helper}
            tone={tile.tone}
            icon={tile.icon}
          />
        ))}
      </section>

      <AdminWorkplaceActions actions={actions} />

      <section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {pathways.map((pathway) => (
          <Link key={pathway.href} href={pathway.href} className="min-w-0">
            <AdminThemeCard
              label={pathway.label}
              value={number(pathway.value)}
              helper={pathway.helper}
              tone={pathway.tone}
              icon={pathway.icon}
            />
          </Link>
        ))}
      </section>

      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <GrowthCard className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">Today’s queue</h2>
            <StatusPill value={queueCount > 0 ? "Review" : "Ready"} />
          </div>
          <div className="mt-4 space-y-3">
            {data.metrics.pendingApplications > 0 ? (
              <Link
                href={routes.applications}
                className="block rounded-2xl bg-amber-50 px-3 py-3 text-sm font-black text-amber-900"
              >
                {number(data.metrics.pendingApplications)} applications waiting
                for review
              </Link>
            ) : null}
            {data.metrics.ambassadorLeads > 0 ? (
              <Link
                href={routes.ambassadorLeads}
                className="block rounded-2xl bg-violet-50 px-3 py-3 text-sm font-black text-violet-900"
              >
                {number(data.metrics.ambassadorLeads)} ambassador leads to work
              </Link>
            ) : null}
            {data.metrics.skillbridgeInterest > 0 ? (
              <Link
                href={routes.skillbridge}
                className="block rounded-2xl bg-rose-50 px-3 py-3 text-sm font-black text-rose-900"
              >
                {number(data.metrics.skillbridgeInterest)} SkillBridge interest
                notes
              </Link>
            ) : null}
            {data.pendingQueue.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="block rounded-2xl border border-slate-100 bg-slate-50 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-black text-slate-950">
                    {item.title}
                  </p>
                  <StatusPill value={item.status} />
                </div>
                <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                  {item.subtitle} · {formatWhen(item.date)}
                </p>
              </Link>
            ))}
            {data.metrics.pendingApplications === 0 &&
            data.metrics.ambassadorLeads === 0 ? (
              <p className="text-sm font-semibold text-slate-500">
                Queue is clear. Open overview or check a hire pathway.
              </p>
            ) : null}
          </div>
        </GrowthCard>

        <GrowthCard className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">Latest activity</h2>
            <Link
              href={routes.applications}
              className="text-sm font-black text-emerald-800"
            >
              Applications →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {latest.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="block rounded-2xl border border-slate-100 bg-slate-50 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-black text-slate-950">
                    {item.title}
                  </p>
                  <StatusPill value={item.status} />
                </div>
                <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                  {item.subtitle} · {formatWhen(item.date)}
                </p>
              </Link>
            ))}
            {latest.length === 0 ? (
              <p className="text-sm font-semibold text-slate-500">
                No applications or leads yet. Public apply forms land here.
              </p>
            ) : null}
          </div>
        </GrowthCard>
      </div>

      <GrowthCard className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-950">
              Pathway notes
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Keep public promises aligned with contractor marketplace reality.
            </p>
          </div>
        </div>
        <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-3">
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-950">
              Independent contractors
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              A program does not guarantee employment, bookings, or full Guru
              status.
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-950">Fair Checkr review</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              Community Hire uses role-related background review guided by EEOC
              principles.
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-950">
              SkillBridge interest only
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              This stays an interest list unless SitGuru later creates an
              approved training program.
            </p>
          </div>
        </div>
      </GrowthCard>

      <GrowthCard className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-950">Source health</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {healthy} of {data.sourceHealth.length} live
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={routes.referrals}
              className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900"
            >
              <Sparkles size={13} className="mr-1 inline" />
              Referrals
            </Link>
            <Link
              href={routes.hr}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800"
            >
              <Users size={13} className="mr-1 inline" />
              HR
            </Link>
            <Link
              href={routes.backgroundChecks}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800"
            >
              <BadgeCheck size={13} className="mr-1 inline" />
              Checkr
            </Link>
            <Link
              href={routes.gurus}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800"
            >
              Gurus
            </Link>
            <Link
              href={routes.exports}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800"
            >
              <Download size={13} className="mr-1 inline" />
              Export
            </Link>
          </div>
        </div>
        <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {data.sourceHealth.map((source) => (
            <div
              key={source.id}
              className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-black text-slate-950">
                  {source.label}
                </p>
                <StatusPill value={source.ok ? "Connected" : "Pending"} />
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {number(source.rowCount)} rows
              </p>
            </div>
          ))}
        </div>
      </GrowthCard>
    </GrowthPageFrame>
  );
}
