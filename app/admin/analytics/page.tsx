import Link from "next/link";
import {
  Activity,
  FileText,
  Handshake,
  HeartHandshake,
  LineChart,
  Megaphone,
  MessageCircleQuestion,
  PawPrint,
  Sparkles,
  Users,
} from "lucide-react";
import { AdminThemeCard } from "@/components/admin/AdminThemeCard";
import {
  AdminWorkplaceActions,
  AdminWorkplaceDenied,
  AdminWorkplaceHealth,
  GrowthCard,
  GrowthPageFrame,
  StatusPill,
} from "@/components/admin/growth/GrowthPageFrame";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  getAnalyticsDashboardData,
  type AnalyticsRecentItem,
} from "@/lib/admin/analytics/dashboard";

export const dynamic = "force-dynamic";

const routes = {
  dashboard: "/admin",
  overview: "/admin/analytics/overview",
  petAnalytics: "/admin/pet-analytics",
  insights: "/admin/insights",
  reports: "/admin/reports",
  customerIntelligence: "/admin/petparents",
  guruPerformance: "/admin/guru-performance",
  bookings: "/admin/bookings",
  referrals: "/admin/referrals",
  programs: "/admin/programs",
  ambassadorLeads: "/admin/ambassador-leads",
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
    <GrowthCard className="min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>
        <Link
          href={href}
          className="text-sm font-black text-emerald-800"
        >
          Open →
        </Link>
      </div>
      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item) => (
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
                {item.subtitle} · {formatDate(item.date)}
              </p>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
            <p className="font-black text-slate-950">{emptyTitle}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {emptyDetail}
            </p>
          </div>
        )}
      </div>
    </GrowthCard>
  );
}

export default async function AdminAnalyticsHubPage() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessAdmin) {
    return (
      <AdminWorkplaceDenied detail="Sign in with an authorized SitGuru admin account to open Analytics." />
    );
  }

  const data = await getAnalyticsDashboardData();

  const tiles = [
    {
      label: "Tracked events",
      value: number(data.metrics.events),
      helper: "Live event stream",
      tone: "emerald" as const,
      icon: <Activity size={18} />,
      trend: data.trends.events,
    },
    {
      label: "Bookings",
      value: number(data.metrics.bookings),
      helper: `${number(data.metrics.completedBookings)} completed`,
      tone: "sky" as const,
      icon: <Sparkles size={18} />,
      trend: data.trends.bookings,
    },
    {
      label: "Gurus",
      value: number(data.metrics.gurus),
      helper: "Supply network",
      tone: "violet" as const,
      icon: <LineChart size={18} />,
      trend: data.trends.gurus,
    },
    {
      label: "Pets",
      value: number(data.metrics.pets),
      helper: "Pet analytics base",
      tone: "emerald" as const,
      icon: <PawPrint size={18} />,
      trend: data.trends.pets,
    },
    {
      label: "Chat insights",
      value: number(data.metrics.chatInsights),
      helper: "Friction + FAQ demand",
      tone: "amber" as const,
      icon: <MessageCircleQuestion size={18} />,
      trend: data.trends.chatInsights,
    },
    {
      label: "Launch signups",
      value: number(data.metrics.launchSignups),
      helper: "Early demand",
      tone: "rose" as const,
      icon: <Sparkles size={18} />,
      trend: data.trends.launchSignups,
    },
    {
      label: "Ambassador leads",
      value: number(data.metrics.ambassadorLeads),
      helper: "Growth recruiting",
      tone: "violet" as const,
      icon: <Users size={18} />,
      trend: data.trends.ambassadorLeads,
    },
    {
      label: "Campaigns",
      value: number(data.metrics.growthCampaigns),
      helper: "Growth campaign rows",
      tone: "slate" as const,
      icon: <Megaphone size={18} />,
      trend: data.trends.growthCampaigns,
    },
  ];

  const actions = [
    {
      href: routes.overview,
      label: "Overview",
      detail: `${number(data.metrics.events)} tracked events`,
      icon: Activity,
      primary: true,
    },
    {
      href: routes.petAnalytics,
      label: "Pet analytics",
      detail: `${number(data.metrics.pets)} pet profiles`,
      icon: PawPrint,
    },
    {
      href: routes.insights,
      label: "Chat insights",
      detail: `${number(data.metrics.chatInsights)} friction flags`,
      icon: MessageCircleQuestion,
    },
    {
      href: routes.customerIntelligence,
      label: "Pet Parents",
      detail: "Cohorts and booking behavior",
      icon: Users,
    },
    {
      href: routes.guruPerformance,
      label: "Guru performance",
      detail: `${number(data.metrics.gurus)} in the network`,
      icon: LineChart,
    },
    {
      href: routes.reports,
      label: "Reports",
      detail: "Daily and weekly ops packs",
      icon: FileText,
    },
    {
      href: routes.bookings,
      label: "Bookings",
      detail: `${number(data.metrics.completedBookings)} completed`,
      icon: Sparkles,
    },
    {
      href: routes.referrals,
      label: "Referrals",
      detail: `${number(data.metrics.referralCodes)} live codes`,
      icon: HeartHandshake,
    },
    {
      href: routes.programs,
      label: "Programs",
      detail: `${number(data.metrics.programApplications)} applications`,
      icon: Handshake,
    },
  ];

  return (
    <GrowthPageFrame
      kicker="Analytics Workplace"
      title="Measure bookings, pets, and real growth."
      detail="Watch the booking chain, pet demand, and Guru supply — then jump into the desk that can act on it."
      action={
        <Link
          href={routes.overview}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-green-950"
        >
          <Activity size={17} />
          Platform overview
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
        <span className="rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800">
          {data.isLive ? "Live sources" : "Preview sources"}
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
            trend={tile.trend}
          />
        ))}
      </section>

      <AdminWorkplaceActions actions={actions} />

      <section className="grid min-w-0 gap-4 xl:grid-cols-3">
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

      <GrowthCard className="min-w-0">
        <div className="min-w-0">
          <h2 className="text-lg font-black text-slate-950">Operating notes</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Keep measurement tied to marketplace outcomes, not vanity traffic.
          </p>
        </div>
        <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-3">
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-950">
              Event → booking chain
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              Homepage, search, and Guru views only matter if they become
              completed bookings.
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-950">
              Growth channel ROI
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              Judge CareerLink, referral, and paid traffic by booked sits, not
              campaign row counts.
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-950">Friction to FAQ</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              Chat flags should become help articles and product fixes, not
              another dashboard.
            </p>
          </div>
        </div>
      </GrowthCard>

      <AdminWorkplaceHealth
        sources={data.sourceHealth}
        helper={
          data.isLive
            ? `${data.sourceHealth.filter((source) => source.ok).length} of ${data.sourceHealth.length} live`
            : "Preview sources — connect live event, booking, and growth tables."
        }
        links={
          <>
            <Link
              href={routes.reports}
              className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900"
            >
              Reports
            </Link>
            <Link
              href={routes.bookings}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800"
            >
              Bookings
            </Link>
            <Link
              href={routes.referrals}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800"
            >
              Referrals
            </Link>
          </>
        }
      />
    </GrowthPageFrame>
  );
}
