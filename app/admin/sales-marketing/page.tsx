import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Flag,
  Handshake,
  HeartHandshake,
  Megaphone,
  PlusCircle,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  getSalesMarketingDashboardData,
  type SalesMarketingRecentItem,
} from "@/lib/admin/sales-marketing/dashboard";

export const dynamic = "force-dynamic";

const routes = {
  dashboard: "/admin",
  hub: "/admin/sales-marketing",
  leadEntry: "/admin/sales-marketing/lead-entry",
  signupLeads: "/admin/sales-marketing/signup-leads",
  dailyTracker: "/admin/sales-marketing/daily-tracker",
  ceoReview: "/admin/sales-marketing/ceo-review",
  weeklyReview: "/admin/sales-marketing/weekly-review",
  monthlyReview: "/admin/sales-marketing/monthly-review",
  outreach: "/admin/sales-marketing/outreach",
  content: "/admin/sales-marketing/content",
  proofLibrary: "/admin/sales-marketing/proof-library",
  campaigns: "/admin/sales-marketing/campaigns",
  referrals: "/admin/referrals",
  partners: "/admin/partners",
  analytics: "/admin/analytics",
  launchSignups: "/admin/launch-signups",
  ambassadors: "/admin/ambassadors",
  ambassadorLeads: "/admin/ambassador-leads",
  programs: "/admin/programs",
  insights: "/admin/insights",
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
  items: SalesMarketingRecentItem[];
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

export default async function SalesMarketingAdminPage() {
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
            Sign in with an authorized SitGuru admin, sales, or marketing account
            to open Sales &amp; Marketing.
          </p>
        </div>
      </div>
    );
  }

  const data = await getSalesMarketingDashboardData();

  const modules: ModuleCard[] = [
    {
      eyebrow: "Intake",
      title: "Lead & Signup Entry",
      description:
        "Capture field leads, referrals, outreach contacts, and high-priority pet signals.",
      href: routes.leadEntry,
      wiring: "live",
      icon: <PlusCircle size={20} />,
    },
    {
      eyebrow: "Pipeline",
      title: "Signup Leads",
      description: "Review signup leads, pets, priorities, and invite readiness.",
      href: routes.signupLeads,
      wiring: "live",
      value: number(data.metrics.signupLeads),
      icon: <Users size={20} />,
    },
    {
      eyebrow: "Daily Ops",
      title: "Daily Tracker",
      description: "Marketing tasks, owners, blockers, and day-to-day execution.",
      href: routes.dailyTracker,
      wiring: "live",
      value: number(data.metrics.tasksTotal),
      icon: <ClipboardCheck size={20} />,
    },
    {
      eyebrow: "CEO Queue",
      title: "CEO Review",
      description: "Items waiting on CEO review, help, or follow-up decisions.",
      href: routes.ceoReview,
      wiring: "live",
      value: number(data.metrics.tasksAwaitingCeo),
      icon: <Flag size={20} />,
    },
    {
      eyebrow: "Outreach",
      title: "Outreach Contacts",
      description: "Local partners, campuses, orgs, and relationship tracking.",
      href: routes.outreach,
      wiring: "live",
      value: number(data.metrics.outreachContacts),
      icon: <Handshake size={20} />,
    },
    {
      eyebrow: "Content",
      title: "Content Planner",
      description: "Content calendar items for social, email, and launch stories.",
      href: routes.content,
      wiring: "live",
      value: number(data.metrics.contentItems),
      icon: <FileText size={20} />,
    },
    {
      eyebrow: "Campaigns",
      title: "Campaigns",
      description: "Campaign records for growth pushes and market launches.",
      href: routes.campaigns,
      wiring: "live",
      value: number(data.metrics.campaigns),
      icon: <Megaphone size={20} />,
    },
    {
      eyebrow: "Proof",
      title: "Proof Library",
      description: "Testimonials, photos, and permissioned social proof assets.",
      href: routes.proofLibrary,
      wiring: "live",
      value: number(data.metrics.proofItems),
      icon: <Sparkles size={20} />,
    },
    {
      eyebrow: "Cadence",
      title: "Weekly Review",
      description: "Weekly marketing reviews and operating rhythm.",
      href: routes.weeklyReview,
      wiring: "live",
      value: number(data.metrics.weeklyReviews),
      icon: <CalendarDays size={20} />,
    },
    {
      eyebrow: "Cadence",
      title: "Monthly Review",
      description: "Monthly performance reviews and roadmap check-ins.",
      href: routes.monthlyReview,
      wiring: "live",
      value: number(data.metrics.monthlyReviews),
      icon: <Target size={20} />,
    },
    {
      eyebrow: "Growth",
      title: "Growth & Referrals",
      description: "Referral codes, rewards, and growth ledger outside field CRM.",
      href: routes.referrals,
      wiring: "live",
      icon: <TrendingUp size={20} />,
    },
    {
      eyebrow: "Partners",
      title: "Partners Hub",
      description: "Partner applications, affiliates, and partner campaigns.",
      href: routes.partners,
      wiring: "live",
      value: number(data.metrics.partnerApplications),
      icon: <Handshake size={20} />,
    },
    {
      eyebrow: "Launch",
      title: "Launch Signups",
      description: "Launch waitlist and early market signup demand.",
      href: routes.launchSignups,
      wiring: "live",
      value: number(data.metrics.launchSignups),
      icon: <Rocket size={20} />,
    },
    {
      eyebrow: "Ambassadors",
      title: "Ambassador Leads",
      description: "Recruiting leads that feed Student / Community / Veterans hire.",
      href: routes.ambassadorLeads,
      wiring: "live",
      value: number(data.metrics.ambassadorLeads),
      icon: <HeartHandshake size={20} />,
    },
    {
      eyebrow: "Insights",
      title: "Analytics",
      description: "Growth analytics across bookings, referrals, and acquisition.",
      href: routes.analytics,
      wiring: "live",
      icon: <BarChart3 size={20} />,
    },
    {
      eyebrow: "Mutations",
      title: "Task Status Writes",
      description:
        "Confirm / follow-up / invite status buttons on review pages stay Next until wired.",
      href: routes.ceoReview,
      wiring: "next",
      icon: <ClipboardCheck size={20} />,
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
                  Sales &amp; Marketing
                </h1>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                  Growth Command Center
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
                Run field lead intake, outreach, content, campaigns, and CEO
                review from one hub — with deep links into Referrals, Partners,
                Launch Signups, Ambassadors, and Analytics.
              </p>

              <p className="mt-3 text-xs font-bold text-slate-500">
                Signed in as {actor.email} · Role {actor.role}
              </p>
            </div>

            <div className="grid w-full shrink-0 gap-3 sm:grid-cols-2 xl:w-auto xl:grid-cols-4">
              <Link
                href={routes.leadEntry}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900"
              >
                <PlusCircle size={17} />
                New Lead Entry
              </Link>
              <Link
                href={routes.ceoReview}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                <Flag size={17} />
                CEO Review
              </Link>
              <Link
                href={routes.dailyTracker}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                <ClipboardCheck size={17} />
                Daily Tracker
              </Link>
              <Link
                href={routes.referrals}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-100"
              >
                <TrendingUp size={17} />
                Referrals
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <MetricTile
            label="Signup Leads"
            value={number(data.metrics.signupLeads)}
            helper="Field + signup intake"
          />
          <MetricTile
            label="Referrals Logged"
            value={number(data.metrics.referrals)}
            helper="Marketing CRM referrals"
          />
          <MetricTile
            label="Outreach"
            value={number(data.metrics.outreachContacts)}
            helper="Contacts in pipeline"
          />
          <MetricTile
            label="Tasks"
            value={number(data.metrics.tasksTotal)}
            helper="Daily tracker rows"
          />
          <MetricTile
            label="CEO Review"
            value={number(data.metrics.tasksAwaitingCeo)}
            helper="Awaiting decision"
          />
          <MetricTile
            label="Blocked / Help"
            value={number(data.metrics.tasksBlockedOrHelp)}
            helper="Needs follow-up"
          />
          <MetricTile
            label="Campaigns"
            value={number(data.metrics.campaigns)}
            helper="Campaign records"
          />
          <MetricTile
            label="Launch Signups"
            value={number(data.metrics.launchSignups)}
            helper="Sibling growth demand"
          />
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                Manage growth from live modules
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Sales &amp; Marketing command center
              </h2>
            </div>
            <p className="text-sm font-semibold text-slate-500">
              Live = readable ops · Next = status write buttons
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
            title="Recent signup leads"
            subtitle="Newest field and signup intake."
            href={routes.signupLeads}
            items={data.recentLeads}
            emptyTitle="No signup leads yet"
            emptyDetail="Capture leads from Lead & Signup Entry."
          />
          <RecentList
            title="CEO / help queue"
            subtitle="Tasks needing review, help, or unblock."
            href={routes.ceoReview}
            items={data.reviewQueue}
            emptyTitle="Queue clear"
            emptyDetail="No CEO Review, blocked, or needs-help tasks right now."
          />
          <RecentList
            title="Recent outreach"
            subtitle="Newest outreach contacts."
            href={routes.outreach}
            items={data.recentOutreach}
            emptyTitle="No outreach contacts yet"
            emptyDetail="Add outreach contacts from Lead Entry or Outreach."
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black text-slate-950">Source health</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Hub reads live `admin_marketing_*` tables and sibling growth
              sources.
            </p>
            <div className="mt-4 grid gap-3">
              {data.sourceHealth.map((source) => (
                <div
                  key={source.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-slate-900">{source.label}</p>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                        source.ok
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-amber-200 bg-amber-50 text-amber-800"
                      }`}
                    >
                      {source.ok ? "Connected" : "Pending"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    {source.message}
                  </p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                    {number(source.rowCount)} rows
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-[#0D5C3A]">
              <Sparkles size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-950">
              How to manage Sales &amp; Marketing
            </h2>
            <ul className="mt-3 space-y-3 text-sm font-semibold leading-6 text-slate-600">
              <li>
                Use this hub for KPIs and routing. Capture leads in Lead Entry.
              </li>
              <li>
                Work Daily Tracker and CEO Review for execution. Keep Growth &amp;
                Referrals / Partners as sibling systems.
              </li>
              <li>
                Content, campaigns, and proof are live reads today — status write
                buttons remain Next.
              </li>
              <li>
                Ambassador recruiting stays in HR / Ambassador Leads; this hub
                owns field marketing CRM.
              </li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={routes.programs}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-900 transition hover:bg-emerald-100"
              >
                Hire Programs
              </Link>
              <Link
                href={routes.insights}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-800 transition hover:bg-slate-50"
              >
                Chat Insights
              </Link>
              <Link
                href={routes.ambassadors}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-800 transition hover:bg-slate-50"
              >
                Ambassadors
              </Link>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
