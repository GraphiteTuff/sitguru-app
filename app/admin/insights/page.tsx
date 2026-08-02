import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BookOpenCheck,
  ExternalLink,
  FileText,
  Handshake,
  HeartHandshake,
  MessageCircle,
  MessageCircleQuestion,
  PawPrint,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  getInsightsDashboardData,
  type InsightsRecentItem,
} from "@/lib/admin/insights/dashboard";

export const dynamic = "force-dynamic";

const routes = {
  dashboard: "/admin",
  hub: "/admin/insights",
  chat: "/admin/insights/chat",
  analytics: "/admin/analytics",
  analyticsOverview: "/admin/analytics/overview",
  customerIntelligence: "/admin/customer-intelligence",
  petAnalytics: "/admin/pet-analytics",
  guruPerformance: "/admin/guru-performance",
  messages: "/admin/messages",
  support: "/admin/support",
  moderation: "/admin/moderation",
  help: "/help",
  helpInsights: "/help/insights",
  salesMarketing: "/admin/sales-marketing",
  programs: "/admin/programs",
  referrals: "/admin/referrals",
  exports: "/admin/exports",
  auditTrail: "/admin/audit-trail",
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
  items: InsightsRecentItem[];
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
                  <p className="line-clamp-2 font-black text-slate-950">
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

export default async function AdminInsightsHubPage() {
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
            Sign in with an authorized SitGuru admin account to open Insights.
          </p>
        </div>
      </div>
    );
  }

  const data = await getInsightsDashboardData();

  const modules: ModuleCard[] = [
    {
      eyebrow: "Ledger",
      title: "Chat Insights Ledger",
      description:
        "Omnichannel question ledger with convert-to-Help-Center workflow.",
      href: routes.chat,
      wiring: "live",
      value: number(data.metrics.insightRows),
      icon: <MessageCircleQuestion size={20} />,
    },
    {
      eyebrow: "Help",
      title: "Help Center",
      description: "Publish friction answers as customer-facing help articles.",
      href: routes.help,
      wiring: "live",
      value: number(data.metrics.helpArticles),
      icon: <BookOpenCheck size={20} />,
    },
    {
      eyebrow: "Inbox",
      title: "Messages",
      description: "Live marketplace conversations feeding support and insights.",
      href: routes.messages,
      wiring: "live",
      value: number(data.metrics.messages),
      icon: <MessageCircle size={20} />,
    },
    {
      eyebrow: "Cases",
      title: "Support Desk",
      description: "support@sitguru.com intake cases and follow-up queue.",
      href: routes.support,
      wiring: "live",
      value: number(data.metrics.supportCases),
      icon: <Handshake size={20} />,
    },
    {
      eyebrow: "Trust",
      title: "Moderation",
      description: "Content and community moderation tied to trust signals.",
      href: routes.moderation,
      wiring: "live",
      icon: <ShieldAlert size={20} />,
    },
    {
      eyebrow: "Measure",
      title: "Analytics Hub",
      description: "Platform growth, bookings, pets, and campaign measurement.",
      href: routes.analytics,
      wiring: "live",
      icon: <Activity size={20} />,
    },
    {
      eyebrow: "Customers",
      title: "Customer Intelligence",
      description: "Pet Parent cohorts, retention, and booking behavior.",
      href: routes.customerIntelligence,
      wiring: "live",
      icon: <Users size={20} />,
    },
    {
      eyebrow: "Pets",
      title: "Pet Analytics",
      description: "Species mix and care demand signals across the pack.",
      href: routes.petAnalytics,
      wiring: "live",
      icon: <PawPrint size={20} />,
    },
    {
      eyebrow: "Supply",
      title: "Guru Performance",
      description: "Guru quality and readiness that shape support volume.",
      href: routes.guruPerformance,
      wiring: "live",
      icon: <Sparkles size={20} />,
    },
    {
      eyebrow: "Growth",
      title: "Sales & Marketing",
      description: "Field CRM and campaign context for acquisition questions.",
      href: routes.salesMarketing,
      wiring: "live",
      icon: <HeartHandshake size={20} />,
    },
    {
      eyebrow: "Audit",
      title: "Audit Trail",
      description: "Admin action history around support and insight changes.",
      href: routes.auditTrail,
      wiring: "live",
      icon: <FileText size={20} />,
    },
    {
      eyebrow: "Export",
      title: "Export Center",
      description: "CSV and package exports for insight and support reporting.",
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
                  Insights
                </h1>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                  Communications Command Center
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
                Turn omnichannel friction into Help Center answers — with deep
                links into chat ledger, messages, support cases, analytics, and
                customer intelligence.
              </p>

              <p className="mt-3 text-xs font-bold text-slate-500">
                Signed in as {actor.email} · Role {actor.role}
              </p>
            </div>

            <div className="grid w-full shrink-0 gap-3 sm:grid-cols-2 xl:w-auto xl:grid-cols-4">
              <Link
                href={routes.chat}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900"
              >
                <MessageCircleQuestion size={17} />
                Open Chat Ledger
              </Link>
              <Link
                href={routes.help}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                <BookOpenCheck size={17} />
                Help Center
              </Link>
              <Link
                href={routes.messages}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                <MessageCircle size={17} />
                Messages
              </Link>
              <Link
                href={routes.support}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-100"
              >
                <AlertTriangle size={17} />
                Support Desk
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <MetricTile
            label="Communications"
            value={number(data.metrics.communications)}
            helper="Weighted question tally"
          />
          <MetricTile
            label="Friction Flags"
            value={number(data.metrics.frictionFlags)}
            helper="Conversion risk signals"
          />
          <MetricTile
            label="Leak Vectors"
            value={number(data.metrics.openLeakVectors)}
            helper="Unconverted · 2×+"
          />
          <MetricTile
            label="Converted"
            value={number(data.metrics.convertedArticles)}
            helper="Promoted to Help Center"
          />
          <MetricTile
            label="Homepage"
            value={number(data.metrics.homepageChannel)}
            helper="Homepage lead channel"
          />
          <MetricTile
            label="Active Walk"
            value={number(data.metrics.activeWalkChannel)}
            helper="In-walk chat channel"
          />
          <MetricTile
            label="Admin Support"
            value={number(data.metrics.adminSupportChannel)}
            helper="Support chat channel"
          />
          <MetricTile
            label="Top Category"
            value={data.topCategory === "—" ? "—" : number(data.topCategoryCount)}
            helper={data.topCategory}
          />
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                Manage communications from live modules
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Insights command center
              </h2>
            </div>
            <p className="text-sm font-semibold text-slate-500">
              Live = readable ops · Convert writes stay on Chat Ledger
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
            title="Top friction"
            subtitle="Highest-tally friction or demand questions."
            href={routes.chat}
            items={data.topFriction}
            emptyTitle="No friction signals yet"
            emptyDetail="Homepage, walk, and support questions will land here."
          />
          <RecentList
            title="Conversion leak queue"
            subtitle="Unconverted questions seen 2× or more."
            href={routes.chat}
            items={data.leakQueue}
            emptyTitle="Leak queue clear"
            emptyDetail="No open high-frequency leak vectors right now."
          />
          <RecentList
            title="Recently converted"
            subtitle="Insights promoted into Help Center articles."
            href={routes.help}
            items={data.recentConverted}
            emptyTitle="No conversions yet"
            emptyDetail="Use Convert on the Chat Ledger to publish answers."
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black text-slate-950">Source health</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Hub reads live chat insight ledgers, help articles, support cases,
              and messages.
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
              Insights operating notes
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Keep the loop tight: detect friction → publish answer → reduce
              repeat support load.
            </p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-black text-slate-950">Friction first</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  Prioritize friction-flagged questions before vanity FAQ
                  volume.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-black text-slate-950">Convert with consent tone</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  Help articles should be clear, calm, and brand-green — no
                  overpromising bookings or earnings.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-black text-slate-950">Close the loop in support</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  After publishing, update support macros and message replies so
                  teams reuse the same answer.
                </p>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
