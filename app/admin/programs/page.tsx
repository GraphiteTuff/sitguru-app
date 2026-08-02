import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  Download,
  ExternalLink,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Medal,
  ShieldCheck,
  Sparkles,
  Users,
  UsersRound,
} from "lucide-react";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  getProgramsDashboardData,
  type ProgramsRecentItem,
} from "@/lib/admin/programs/dashboard";
import { VETERANS_MILITARY_FAMILIES_PROGRAM } from "@/lib/programs/veterans-military-families";

export const dynamic = "force-dynamic";

const routes = {
  dashboard: "/admin",
  hub: "/admin/programs",
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
  salesMarketing: "/admin/sales-marketing",
  hr: "/admin/hr",
  exports: "/admin/exports",
  gurus: "/admin/gurus",
  backgroundChecks: "/admin/background-checks",
};

type ModuleCard = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  wiring: "live" | "next";
  value?: string;
  icon: ReactNode;
};

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MetricTile({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-emerald-100 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
    </div>
  );
}

function ModuleLinkCard({ card }: { card: ModuleCard }) {
  return (
    <Link
      href={card.href}
      className="group flex h-full flex-col rounded-[1.6rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-[#0D5C3A]">
          {card.icon}
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
            card.wiring === "live"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {card.wiring === "live" ? "Live" : "Next"}
        </span>
      </div>
      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
        {card.eyebrow}
      </p>
      <h3 className="mt-1 text-lg font-black text-slate-950">{card.title}</h3>
      {card.value ? (
        <p className="mt-2 text-2xl font-black text-[#0D5C3A]">{card.value}</p>
      ) : null}
      <p className="mt-2 flex-1 text-sm font-semibold leading-6 text-slate-600">
        {card.description}
      </p>
      <span className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-800">
        Open
        <ExternalLink
          size={14}
          className="transition group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}

function RecentList({
  title,
  subtitle,
  href,
  items,
  emptyTitle,
  emptyDetail,
}: {
  title: string;
  subtitle: string;
  href: string;
  items: ProgramsRecentItem[];
  emptyTitle: string;
  emptyDetail: string;
}) {
  return (
    <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>
        <Link
          href={href}
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-900 transition hover:bg-emerald-100"
        >
          Open
        </Link>
      </div>
      <div className="mt-4 grid gap-3">
        {items.length ? (
          items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-black text-slate-950">
                    {item.title}
                  </p>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                    {item.subtitle}
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                  {item.status}
                </span>
              </div>
              <p className="mt-3 text-xs font-bold text-slate-500">
                {formatDate(item.date)}
              </p>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
            <p className="font-black text-slate-950">{emptyTitle}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {emptyDetail}
            </p>
          </div>
        )}
      </div>
    </section>
  );
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
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Sign in with an authorized SitGuru admin account to open Growth
            Programs.
          </p>
        </div>
      </div>
    );
  }

  const data = await getProgramsDashboardData();

  const modules: ModuleCard[] = [
    {
      eyebrow: "Catalog",
      title: "Programs Overview",
      description:
        "Pathway definitions, readiness scores, and full program metrics.",
      href: routes.overview,
      wiring: "live",
      value: number(data.metrics.applications),
      icon: <BriefcaseBusiness size={20} />,
    },
    {
      eyebrow: "Intake",
      title: "Program Applications",
      description:
        "Review Student, Community, Veterans, and Ambassador applications.",
      href: routes.applications,
      wiring: "live",
      value: number(data.metrics.pendingApplications),
      icon: <ClipboardList size={20} />,
    },
    {
      eyebrow: "Earn",
      title: "Student Hire Ops",
      description: "Campus and student applicant queue for flexible Guru work.",
      href: routes.studentHire,
      wiring: "live",
      value: number(data.metrics.studentHire),
      icon: <GraduationCap size={20} />,
    },
    {
      eyebrow: "Work",
      title: "Community Hire Ops",
      description:
        "Workforce and nonprofit referral pathway with fair Checkr review.",
      href: routes.communityHire,
      wiring: "live",
      value: number(data.metrics.communityHire),
      icon: <Building2 size={20} />,
    },
    {
      eyebrow: "Serve",
      title: VETERANS_MILITARY_FAMILIES_PROGRAM.shortName,
      description:
        "Veterans, military families, and transition pathway ops desk.",
      href: routes.militaryHire,
      wiring: "live",
      value: number(data.metrics.militaryHire),
      icon: <Medal size={20} />,
    },
    {
      eyebrow: "Interest",
      title: "SkillBridge Interest",
      description:
        "Track SkillBridge interest without promising placement or enrollment.",
      href: routes.skillbridge,
      wiring: "live",
      value: number(data.metrics.skillbridgeInterest),
      icon: <ShieldCheck size={20} />,
    },
    {
      eyebrow: "Lead",
      title: "Ambassadors",
      description: "Active Ambassador dashboards, Pack Leaders, and referral growth.",
      href: routes.ambassadors,
      wiring: "live",
      value: number(data.metrics.ambassadors),
      icon: <HeartHandshake size={20} />,
    },
    {
      eyebrow: "Recruit",
      title: "Ambassador Leads",
      description: "Recruiting pipeline feeding hire pathways and Pack growth.",
      href: routes.ambassadorLeads,
      wiring: "live",
      value: number(data.metrics.ambassadorLeads),
      icon: <UsersRound size={20} />,
    },
    {
      eyebrow: "Partners",
      title: "Partners Hub",
      description: "Partner applications and community growth sources.",
      href: routes.partners,
      wiring: "live",
      value: number(data.metrics.partnerApplications),
      icon: <Handshake size={20} />,
    },
    {
      eyebrow: "Growth",
      title: "Growth & Referrals",
      description: "Referral codes, PawPerks, and reward attribution.",
      href: routes.referrals,
      wiring: "live",
      icon: <Sparkles size={20} />,
    },
    {
      eyebrow: "People",
      title: "Hiring & People Ops",
      description: "HR desk for leads, Guru approvals, and Trust & Safety.",
      href: routes.hr,
      wiring: "live",
      icon: <Users size={20} />,
    },
    {
      eyebrow: "Trust",
      title: "Background Checks",
      description: "Checkr and Trust & Safety status across hire pathways.",
      href: routes.backgroundChecks,
      wiring: "live",
      icon: <BadgeCheck size={20} />,
    },
    {
      eyebrow: "Export",
      title: "Export Center",
      description: "CSV and ops exports for program and growth reporting.",
      href: routes.exports,
      wiring: "live",
      icon: <Download size={20} />,
    },
    {
      eyebrow: "Gurus",
      title: "Guru Directory",
      description: "Approved and onboarding Gurus coming out of program pathways.",
      href: routes.gurus,
      wiring: "live",
      icon: <Users size={20} />,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-3 py-4 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1640px] space-y-6">
        <section className="rounded-[2rem] border border-emerald-100 bg-[radial-gradient(circle_at_top_left,rgba(13,92,58,0.12),transparent_34%),linear-gradient(135deg,#ffffff_0%,#ecfdf5_55%,#f8fafc_100%)] p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <Link
                href={routes.dashboard}
                className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
              >
                <ArrowLeft size={16} />
                Back to Admin
              </Link>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl xl:text-5xl">
                  Growth Programs
                </h1>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                  Pathways Command Center
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                    data.isLive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  {data.isLive ? "Live Sources" : "Preview Sources"}
                </span>
              </div>

              <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
                Run Student Hire, Community Hire,{" "}
                {VETERANS_MILITARY_FAMILIES_PROGRAM.shortName}, SkillBridge
                interest, and Ambassador growth from one hub — with deep links
                into applications, partners, referrals, and Trust &amp; Safety.
              </p>

              <p className="mt-3 text-xs font-bold text-slate-500">
                Signed in as {actor.email} · Role {actor.role}
              </p>
            </div>

            <div className="grid w-full shrink-0 gap-3 sm:grid-cols-2 xl:w-auto xl:grid-cols-4">
              <Link
                href={routes.applications}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900"
              >
                <ClipboardList size={17} />
                Review Applications
              </Link>
              <Link
                href={routes.overview}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                <BriefcaseBusiness size={17} />
                Overview
              </Link>
              <Link
                href={routes.ambassadorLeads}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                <UsersRound size={17} />
                Ambassador Leads
              </Link>
              <Link
                href={routes.exports}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-100"
              >
                <Download size={17} />
                Export Center
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <MetricTile
            label="Applications"
            value={number(data.metrics.applications)}
            helper="All program applications"
          />
          <MetricTile
            label="Pending Review"
            value={number(data.metrics.pendingApplications)}
            helper="Needs ops follow-up"
          />
          <MetricTile
            label="Approved"
            value={number(data.metrics.approvedApplications)}
            helper="Approved / active signals"
          />
          <MetricTile
            label="Student Hire"
            value={number(data.metrics.studentHire)}
            helper="Earn with the Pack"
          />
          <MetricTile
            label="Community Hire"
            value={number(data.metrics.communityHire)}
            helper="Work with the Pack"
          />
          <MetricTile
            label="Veterans Pathway"
            value={number(data.metrics.militaryHire)}
            helper="Serve with the Pack"
          />
          <MetricTile
            label="Ambassador Leads"
            value={number(data.metrics.ambassadorLeads)}
            helper="Recruiting pipeline"
          />
          <MetricTile
            label="Ambassadors"
            value={number(data.metrics.ambassadors)}
            helper="Active growth network"
          />
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                Manage pathways from live modules
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Growth Programs command center
              </h2>
            </div>
            <p className="text-sm font-semibold text-slate-500">
              Live = readable ops · Next = deferred write surfaces
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {modules.map((card) => (
              <ModuleLinkCard key={card.title} card={card} />
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <RecentList
            title="Recent applications"
            subtitle="Newest pathway applicants."
            href={routes.applications}
            items={data.recentApplications}
            emptyTitle="No applications yet"
            emptyDetail="Public program apply forms and partner referrals will land here."
          />
          <RecentList
            title="Pending review queue"
            subtitle="Applications waiting on ops."
            href={routes.applications}
            items={data.pendingQueue}
            emptyTitle="Queue clear"
            emptyDetail="No pending program applications right now."
          />
          <RecentList
            title="Recent ambassador leads"
            subtitle="Recruiting leads feeding hire pathways."
            href={routes.ambassadorLeads}
            items={data.recentAmbassadorLeads}
            emptyTitle="No ambassador leads yet"
            emptyDetail="Capture leads from sales, partners, or CareerLink outreach."
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black text-slate-950">Source health</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Hub reads live applications, ambassadors, partners, and programs
              tables.
            </p>
            <div className="mt-4 grid gap-3">
              {data.sourceHealth.map((source) => (
                <div
                  key={source.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="min-w-0">
                    <p className="font-black text-slate-950">{source.label}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                      {source.message}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                        source.ok
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-amber-200 bg-amber-50 text-amber-800"
                      }`}
                    >
                      {source.ok ? "Live" : "Next"}
                    </span>
                    <p className="mt-2 text-sm font-black text-slate-700">
                      {number(source.rowCount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black text-slate-950">
              Pathway operating notes
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Keep public program promises aligned with contractor marketplace
              reality.
            </p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-black text-slate-950">Independent contractors</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  Program participation does not guarantee employment, placement,
                  bookings, commissions, or full Guru status.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-black text-slate-950">Fair Checkr review</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  Community Hire and related pathways use role-related background
                  review guided by EEOC principles.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-black text-slate-950">SkillBridge interest only</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  SkillBridge remains an interest list unless SitGuru later
                  creates a formally approved training program.
                </p>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
