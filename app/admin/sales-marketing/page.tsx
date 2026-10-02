import Link from "next/link";
import {
  CalendarDays,
  ClipboardCheck,
  FileText,
  Flag,
  Handshake,
  Library,
  Megaphone,
  PlusCircle,
  Rocket,
  TrendingUp,
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
  emailUpdates: "/admin/email-updates",
  ambassadors: "/admin/ambassadors",
  ambassadorLeads: "/admin/ambassador-leads",
  programs: "/admin/programs",
  insights: "/admin/insights",
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
  items: SalesMarketingRecentItem[];
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
        <Link href={href} className="text-sm font-black text-emerald-800">
          Open →
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="block rounded-2xl border border-slate-100 bg-slate-50 p-3 transition hover:border-emerald-200 hover:bg-emerald-50/40"
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

function DeskChip({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900"
    >
      {label}
    </Link>
  );
}

export default async function SalesMarketingAdminPage() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessAdmin) {
    return (
      <AdminWorkplaceDenied detail="Sign in with an authorized SitGuru admin, sales, or marketing account to open Sales & Marketing." />
    );
  }

  const data = await getSalesMarketingDashboardData();
  const healthy = data.sourceHealth.filter((source) => source.ok).length;
  const needsCeoAttention =
    data.metrics.tasksAwaitingCeo > 0 || data.metrics.tasksBlockedOrHelp > 0;

  const tiles = [
    {
      label: "Signup leads",
      value: number(data.metrics.signupLeads),
      helper: "Field + signup intake",
      tone: "emerald" as const,
      icon: <Users size={18} />,
      trend: data.trends.signupLeads,
      href: routes.signupLeads,
    },
    {
      label: "Referrals logged",
      value: number(data.metrics.referrals),
      helper: "Marketing CRM referrals",
      tone: "violet" as const,
      icon: <TrendingUp size={18} />,
      trend: data.trends.referrals,
      href: routes.referrals,
    },
    {
      label: "Outreach",
      value: number(data.metrics.outreachContacts),
      helper: "Contacts in pipeline",
      tone: "sky" as const,
      icon: <Handshake size={18} />,
      trend: data.trends.outreachContacts,
      href: routes.outreach,
    },
    {
      label: "Tasks",
      value: number(data.metrics.tasksTotal),
      helper: "Daily tracker rows",
      tone: "slate" as const,
      icon: <ClipboardCheck size={18} />,
      trend: data.trends.tasksTotal,
      href: routes.dailyTracker,
    },
    {
      label: "CEO review",
      value: number(data.metrics.tasksAwaitingCeo),
      helper: "Awaiting decision",
      tone: "amber" as const,
      icon: <Flag size={18} />,
      trend: data.trends.tasksAwaitingCeo,
      href: routes.ceoReview,
    },
    {
      label: "Blocked / help",
      value: number(data.metrics.tasksBlockedOrHelp),
      helper: "Needs follow-up",
      tone: "rose" as const,
      icon: <Flag size={18} />,
      trend: data.trends.tasksBlockedOrHelp,
      href: routes.ceoReview,
    },
    {
      label: "Campaigns",
      value: number(data.metrics.campaigns),
      helper: "Campaign records",
      tone: "emerald" as const,
      icon: <Megaphone size={18} />,
      trend: data.trends.campaigns,
      href: routes.campaigns,
    },
    {
      label: "Launch signups",
      value: number(data.metrics.launchSignups),
      helper: "Sibling growth demand",
      tone: "sky" as const,
      icon: <Rocket size={18} />,
      trend: data.trends.launchSignups,
      href: routes.launchSignups,
    },
  ];

  const actions = [
    {
      href: routes.leadEntry,
      label: "New lead",
      detail: "Capture a field or signup lead",
      icon: PlusCircle,
    },
    {
      href: routes.signupLeads,
      label: "Signup leads",
      detail: `${number(data.metrics.signupLeads)} in the pipeline`,
      icon: Users,
    },
    {
      href: routes.dailyTracker,
      label: "Daily tracker",
      detail: `${number(data.metrics.tasksTotal)} tasks`,
      icon: ClipboardCheck,
    },
    {
      href: routes.ceoReview,
      label: "CEO review",
      detail: `${number(data.metrics.tasksAwaitingCeo)} awaiting decision`,
      icon: Flag,
      primary: needsCeoAttention,
    },
    {
      href: routes.outreach,
      label: "Outreach",
      detail: `${number(data.metrics.outreachContacts)} contacts`,
      icon: Handshake,
    },
    {
      href: routes.campaigns,
      label: "Campaigns",
      detail: `${number(data.metrics.campaigns)} campaigns`,
      icon: Megaphone,
    },
  ];

  return (
    <GrowthPageFrame
      kicker="Sales & Marketing Workplace"
      title="Turn field leads into SitGuru signups."
      detail="Capture field leads, work the CEO queue, then push outreach, content, and campaigns."
      action={
        <Link
          href={routes.leadEntry}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-green-950"
        >
          <PlusCircle size={17} />
          New lead
        </Link>
      }
    >
      <div className="flex flex-wrap gap-2">
        <Link
          href={routes.dashboard}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800"
        >
          Admin Portal
        </Link>
        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
          {actor.email}
        </span>
        <span className="rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800">
          {data.isLive ? "Live sources" : "Preview sources"}
        </span>
      </div>

      {needsCeoAttention ? (
        <GrowthCard className="min-w-0 border-amber-200 bg-amber-50/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-black text-amber-950">
                Queue needs attention
              </p>
              <p className="mt-1 text-sm font-semibold text-amber-900/80">
                {number(data.metrics.tasksAwaitingCeo)} awaiting CEO ·{" "}
                {number(data.metrics.tasksBlockedOrHelp)} blocked or need help
              </p>
            </div>
            <Link
              href={routes.ceoReview}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-amber-700 px-4 text-sm font-black !text-white transition hover:bg-amber-800"
            >
              Open CEO review
            </Link>
          </div>
        </GrowthCard>
      ) : null}

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
            href={tile.href}
          />
        ))}
      </section>

      <AdminWorkplaceActions actions={actions} />

      <GrowthCard className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-950">More desks</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Reviews, content, and sibling growth tools.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <DeskChip href={routes.weeklyReview} label="Weekly review" />
          <DeskChip href={routes.monthlyReview} label="Monthly review" />
          <DeskChip href={routes.content} label="Content planner" />
          <DeskChip href={routes.proofLibrary} label="Proof library" />
          <DeskChip href={routes.referrals} label="Referrals" />
          <DeskChip href={routes.partners} label="Partners" />
          <DeskChip href={routes.launchSignups} label="Launch signups" />
          <DeskChip href={routes.emailUpdates} label="Email updates" />
          <DeskChip href={routes.ambassadorLeads} label="Ambassador leads" />
          <DeskChip href={routes.analytics} label="Analytics" />
        </div>
        <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-3">
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="flex items-center gap-2 text-sm font-black text-slate-950">
              <CalendarDays size={16} className="text-emerald-700" />
              Reviews
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              {number(data.metrics.weeklyReviews)} weekly ·{" "}
              {number(data.metrics.monthlyReviews)} monthly
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="flex items-center gap-2 text-sm font-black text-slate-950">
              <FileText size={16} className="text-emerald-700" />
              Content
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              {number(data.metrics.contentItems)} planner items
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="flex items-center gap-2 text-sm font-black text-slate-950">
              <Library size={16} className="text-emerald-700" />
              Proof
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              {number(data.metrics.proofItems)} library items
            </p>
          </div>
        </div>
      </GrowthCard>

      <section className="grid min-w-0 gap-4 xl:grid-cols-3">
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

      <GrowthCard className="min-w-0">
        <h2 className="text-lg font-black text-slate-950">How to work this desk</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Use the hub for routing. Keep execution short.
        </p>
        <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-3">
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-950">Capture, then convert</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              New lead feeds Signup leads. Invite readiness stays on that desk.
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-950">Work the queue</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              Daily tracker and CEO review own blockers, help, and follow-up.
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-950">Keep siblings separate</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              Referrals, Partners, and hire programs stay next door. This hub
              owns field CRM.
            </p>
          </div>
        </div>
      </GrowthCard>

      <AdminWorkplaceHealth
        sources={data.sourceHealth}
        helper={
          data.isLive
            ? `${healthy} of ${data.sourceHealth.length} live`
            : "Preview sources"
        }
        links={
          <>
            <Link
              href={routes.programs}
              className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900"
            >
              Hire Programs
            </Link>
            <Link
              href={routes.insights}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800"
            >
              Chat Insights
            </Link>
            <Link
              href={routes.ambassadors}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800"
            >
              Ambassadors
            </Link>
            <Link
              href={routes.launchSignups}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800"
            >
              Launch Signups
            </Link>
          </>
        }
      />
    </GrowthPageFrame>
  );
}
