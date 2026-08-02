import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  ExternalLink,
  FileText,
  Filter,
  Handshake,
  HeartHandshake,
  LineChart,
  Megaphone,
  MessageCircleQuestion,
  PawPrint,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  getAnalyticsDashboardData,
  type AnalyticsRecentItem,
} from "@/lib/admin/analytics/dashboard";

export const dynamic = "force-dynamic";

const routes = {
  dashboard: "/admin",
  hub: "/admin/analytics",
  overview: "/admin/analytics/overview",
  funnel: "/admin/analytics/funnel",
  petAnalytics: "/admin/pet-analytics",
  insights: "/admin/insights",
  reports: "/admin/reports",
  customerIntelligence: "/admin/customer-intelligence",
  guruPerformance: "/admin/guru-performance",
  bookings: "/admin/bookings",
  financials: "/admin/financials",
  dailyFinancialReport: "/admin/financials/reports/daily",
  weeklyFinancialReport: "/admin/financials/reports/weekly",
  payoutAnalytics: "/admin/financials/payout-analytics",
  salesMarketing: "/admin/sales-marketing",
  referrals: "/admin/referrals",
  programs: "/admin/programs",
  launchSignups: "/admin/launch-signups",
  ambassadorLeads: "/admin/ambassador-leads",
  auditTrail: "/admin/audit-trail",
  exports: "/admin/exports",
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
  items: AnalyticsRecentItem[];
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

export default async function AdminAnalyticsHubPage() {
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
            Sign in with an authorized SitGuru admin account to open Analytics.
          </p>
        </div>
      </div>
    );
  }

  const data = await getAnalyticsDashboardData();

  const modules: ModuleCard[] = [
    {
      eyebrow: "Core",
      title: "Platform Overview",
      description:
        "Growth, conversion, booking health, traffic, and network strength.",
      href: routes.overview,
      wiring: "live",
      value: number(data.metrics.events),
      icon: <Activity size={20} />,
    },
    {
      eyebrow: "Conversion",
      title: "Conversion Funnel",
      description:
        "Traffic → signup → booking leak diagnostics from unmasked PostgREST pipelines.",
      href: routes.funnel,
      wiring: "live",
      value: number(data.metrics.completedBookings),
      icon: <Filter size={20} />,
    },
    {
      eyebrow: "Pets",
      title: "Pet Analytics",
      description: "Pet profiles, species mix, and care demand signals.",
      href: routes.petAnalytics,
      wiring: "live",
      value: number(data.metrics.pets),
      icon: <PawPrint size={20} />,
    },
    {
      eyebrow: "Chat",
      title: "Chat Insights",
      description: "Friction flags, FAQ demand, and article conversion opportunities.",
      href: routes.insights,
      wiring: "live",
      value: number(data.metrics.chatInsights),
      icon: <MessageCircleQuestion size={20} />,
    },
    {
      eyebrow: "Customers",
      title: "Customer Intelligence",
      description: "Pet Parent cohorts, retention signals, and booking behavior.",
      href: routes.customerIntelligence,
      wiring: "live",
      icon: <Users size={20} />,
    },
    {
      eyebrow: "Supply",
      title: "Guru Performance",
      description: "Guru readiness, booking volume, and quality performance.",
      href: routes.guruPerformance,
      wiring: "live",
      value: number(data.metrics.gurus),
      icon: <LineChart size={20} />,
    },
    {
      eyebrow: "Reports",
      title: "Admin Reports",
      description: "Daily and weekly operating report generation and history.",
      href: routes.reports,
      wiring: "live",
      icon: <FileText size={20} />,
    },
    {
      eyebrow: "Finance",
      title: "Daily Finance Report",
      description: "Last-24-hour finance and ops report package.",
      href: routes.dailyFinancialReport,
      wiring: "live",
      icon: <CalendarDays size={20} />,
    },
    {
      eyebrow: "Finance",
      title: "Weekly Finance Report",
      description: "Leadership weekly finance and growth report package.",
      href: routes.weeklyFinancialReport,
      wiring: "live",
      icon: <BarChart3 size={20} />,
    },
    {
      eyebrow: "Payouts",
      title: "Payout Analytics",
      description: "Guru and partner payout distribution analytics.",
      href: routes.payoutAnalytics,
      wiring: "live",
      icon: <TrendingUp size={20} />,
    },
    {
      eyebrow: "Bookings",
      title: "Bookings Desk",
      description: "Marketplace booking queue and completion status.",
      href: routes.bookings,
      wiring: "live",
      value: number(data.metrics.completedBookings),
      icon: <Sparkles size={20} />,
    },
    {
      eyebrow: "Growth",
      title: "Sales & Marketing",
      description: "Field CRM, campaigns, and CEO review cadence.",
      href: routes.salesMarketing,
      wiring: "live",
      value: number(data.metrics.growthCampaigns),
      icon: <Megaphone size={20} />,
    },
    {
      eyebrow: "Referrals",
      title: "Growth & Referrals",
      description: "Referral codes, rewards, and attribution health.",
      href: routes.referrals,
      wiring: "live",
      value: number(data.metrics.referralCodes),
      icon: <HeartHandshake size={20} />,
    },
    {
      eyebrow: "Pathways",
      title: "Growth Programs",
      description: "Student, community, veterans, and ambassador pathways.",
      href: routes.programs,
      wiring: "live",
      value: number(data.metrics.programApplications),
      icon: <Handshake size={20} />,
    },
    {
      eyebrow: "Launch",
      title: "Launch Signups",
      description: "Launch waitlist and early market demand.",
      href: routes.launchSignups,
      wiring: "live",
      value: number(data.metrics.launchSignups),
      icon: <Sparkles size={20} />,
    },
    {
      eyebrow: "Audit",
      title: "Audit Trail",
      description: "Admin action history and tracked event forensics.",
      href: routes.auditTrail,
      wiring: "live",
      icon: <Activity size={20} />,
    },
    {
      eyebrow: "Export",
      title: "Export Center",
      description: "CSV and package exports for analytics and ops reporting.",
      href: routes.exports,
      wiring: "live",
      icon: <FileText size={20} />,
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
                  Analytics
                </h1>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                  Insights Command Center
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
                Measure growth, bookings, pets, chat friction, Guru performance,
                and finance reports from one hub — with deep links into
                referrals, programs, and marketplace ops.
              </p>

              <p className="mt-3 text-xs font-bold text-slate-500">
                Signed in as {actor.email} · Role {actor.role}
              </p>
            </div>

            <div className="grid w-full shrink-0 gap-3 sm:grid-cols-2 xl:w-auto xl:grid-cols-4">
              <Link
                href={routes.overview}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900"
              >
                <Activity size={17} />
                Platform Overview
              </Link>
              <Link
                href={routes.petAnalytics}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                <PawPrint size={17} />
                Pet Analytics
              </Link>
              <Link
                href={routes.insights}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                <MessageCircleQuestion size={17} />
                Chat Insights
              </Link>
              <Link
                href={routes.reports}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-100"
              >
                <FileText size={17} />
                Reports
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <MetricTile
            label="Tracked Events"
            value={number(data.metrics.events)}
            helper="analytics_events"
          />
          <MetricTile
            label="Bookings"
            value={number(data.metrics.bookings)}
            helper={`${number(data.metrics.completedBookings)} completed`}
          />
          <MetricTile
            label="Gurus"
            value={number(data.metrics.gurus)}
            helper="Supply network"
          />
          <MetricTile
            label="Pets"
            value={number(data.metrics.pets)}
            helper="Pet analytics base"
          />
          <MetricTile
            label="Chat Insights"
            value={number(data.metrics.chatInsights)}
            helper="Friction + FAQ demand"
          />
          <MetricTile
            label="Launch Signups"
            value={number(data.metrics.launchSignups)}
            helper="Early demand"
          />
          <MetricTile
            label="Ambassador Leads"
            value={number(data.metrics.ambassadorLeads)}
            helper="Growth recruiting"
          />
          <MetricTile
            label="Campaigns"
            value={number(data.metrics.growthCampaigns)}
            helper="Growth campaign rows"
          />
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                Manage insights from live modules
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Analytics command center
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
            title="Recent tracked events"
            subtitle="Newest analytics_events rows."
            href={routes.overview}
            items={data.recentEvents}
            emptyTitle="No tracked events yet"
            emptyDetail="Homepage, search, and profile events will appear here."
          />
          <RecentList
            title="Recent bookings"
            subtitle="Newest marketplace booking signals."
            href={routes.bookings}
            items={data.recentBookings}
            emptyTitle="No bookings yet"
            emptyDetail="Completed and pending bookings will land here."
          />
          <RecentList
            title="Recent growth leads"
            subtitle="Newest ambassador / pathway leads."
            href={routes.ambassadorLeads}
            items={data.recentLeads}
            emptyTitle="No leads yet"
            emptyDetail="Ambassador and pathway leads will appear as they arrive."
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black text-slate-950">Source health</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Hub reads live event, booking, pet, chat, campaign, and growth
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
              Analytics operating notes
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Keep measurement tied to marketplace outcomes, not vanity traffic.
            </p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-black text-slate-950">Event → booking chain</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  Track homepage visits, searches, Guru views, and launch
                  completions against completed bookings.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-black text-slate-950">Growth channel ROI</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  Use overview campaign mix plus Sales &amp; Marketing to judge
                  CareerLink, referral, and paid channel quality.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-black text-slate-950">Friction to FAQ</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  Chat Insights friction flags should convert into help articles
                  and product fixes, not just dashboards.
                </p>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
