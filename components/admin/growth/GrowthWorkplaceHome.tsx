import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Handshake,
  Megaphone,
  MousePointerClick,
  PawPrint,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { AdminThemeCard } from "@/components/admin/AdminThemeCard";
import { getPetParentSummary } from "@/lib/admin/customers/pet-parents";
import {
  getGrowthHomeStats,
  listGrowthCampaigns,
  listGrowthContent,
  listUpcomingGrowthEvents,
} from "@/lib/admin/growth/data";
import {
  documentationGrowthCampaigns,
  documentationGrowthContent,
  documentationGrowthHomeStats,
} from "@/lib/internship/documentation-fixture";
import { internDocumentationModeEnabled } from "@/lib/internship/documentation-mode";
import {
  growthHref,
  type GrowthWorkplaceAccess,
} from "@/lib/admin/growth/workplace";
import {
  GrowthPageFrame,
  StatusPill,
} from "@/components/admin/growth/GrowthPageFrame";
import GrowthCollapsibleSection from "@/components/admin/growth/GrowthCollapsibleSection";
import GrowthEmptyState from "@/components/admin/growth/GrowthEmptyState";
import GrowthQuickActions from "@/components/admin/growth/GrowthQuickActions";
import GrowthWeekBoard from "@/components/admin/growth/GrowthWeekBoard";

function startOfWeek(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() - next.getDay());
  return next;
}

function ymd(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatEventWhen(iso: string | null) {
  if (!iso) return "Date TBD";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Date TBD";
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function GrowthWorkplaceHome({
  workplace,
}: {
  workplace: GrowthWorkplaceAccess;
}) {
  const intern = workplace.kind === "intern";
  const base = workplace.basePath;
  const documentation = internDocumentationModeEnabled();

  const [stats, campaigns, content, parents, upcomingEvents] = documentation
    ? [
        documentationGrowthHomeStats(),
        documentationGrowthCampaigns(),
        documentationGrowthContent(),
        null,
        [],
      ]
    : await Promise.all([
        getGrowthHomeStats(),
        listGrowthCampaigns(),
        listGrowthContent(),
        intern ? Promise.resolve(null) : getPetParentSummary(),
        listUpcomingGrowthEvents(6),
      ]);

  const weekStart = startOfWeek();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return ymd(date);
  });
  const today = ymd(new Date());

  const calendarItems = new Map<
    string,
    { title: string; href: string; kind: string }[]
  >();
  for (const item of content) {
    const day = item.plannedDate?.slice(0, 10);
    if (!day) continue;
    const list = calendarItems.get(day) || [];
    list.push({
      title: item.title,
      href: growthHref(base, "/content"),
      kind: item.platform,
    });
    calendarItems.set(day, list);
  }

  const primaryKpis = [
    {
      label: "Pet Parents",
      value: String(stats.petParents),
      helper: "New this week",
      tone: "emerald" as const,
      icon: <PawPrint size={18} />,
      trend: stats.trends.petParents,
    },
    {
      label: "Gurus",
      value: String(stats.gurus),
      helper: "New this week",
      tone: "sky" as const,
      icon: <Users size={18} />,
      trend: stats.trends.gurus,
    },
    {
      label: "Ambassadors",
      value: String(stats.ambassadors),
      helper: "New this week",
      tone: "violet" as const,
      icon: <Handshake size={18} />,
      trend: stats.trends.ambassadors,
    },
    {
      label: "Referrals",
      value: String(stats.referrals),
      helper: "Links used",
      tone: "amber" as const,
      icon: <MousePointerClick size={18} />,
      trend: stats.trends.referrals,
    },
  ];

  const trendKpis = [
    {
      label: "Social visits",
      value: String(stats.visits),
      helper: "Clicks + views",
      tone: "sky" as const,
      icon: <Megaphone size={18} />,
      trend: stats.trends.visits,
    },
    {
      label: "Registrations",
      value: String(stats.signups),
      helper: "Attributed signups",
      tone: "emerald" as const,
      icon: <CheckCircle2 size={18} />,
      trend: stats.trends.signups,
    },
    {
      label: "Conversion",
      value: stats.conversion,
      helper: "Signups ÷ visits",
      tone: "slate" as const,
      icon: <BarChart3 size={18} />,
      trend: stats.trends.conversion,
    },
    {
      label: "Needs review",
      value: String(stats.pendingReview),
      helper: "Awaiting Ava / Jason",
      tone: "rose" as const,
      icon: <ClipboardCheck size={18} />,
      trend: stats.trends.pendingReview,
    },
  ];

  const desktopActions = [
    {
      href: growthHref(base, "/create"),
      label: "Create a post",
      detail: "Caption, tracking link, publish",
      icon: Plus,
      primary: true,
    },
    {
      href: growthHref(base, "/gurus"),
      label: "Promote a Guru",
      detail: "Put a sitter in front of Pet Parents",
      icon: Users,
    },
    {
      href: growthHref(base, "/events"),
      label: "Community & Events",
      detail: "Promote meetups and record day-of results",
      icon: CalendarDays,
    },
    {
      href: growthHref(base, "/campaigns"),
      label: "Campaigns",
      detail: "Copy tracking links",
      icon: Megaphone,
    },
    {
      href: growthHref(base, "/analytics"),
      label: "Growth Intelligence",
      detail: intern ? "Weekly check-in + scoreboard" : "Friday scoreboard",
      icon: BarChart3,
    },
    {
      href: intern ? "/intern" : "/intern/manage",
      label: intern ? "Intern portal" : "Team",
      detail: intern ? "Hours, tasks, check-in" : "Interns & upcoming reviews",
      icon: Sparkles,
    },
  ];

  const todayContent = content.filter(
    (item) => item.plannedDate?.slice(0, 10) === today,
  );
  const dueSoon = content.filter((item) => {
    const day = item.plannedDate?.slice(0, 10);
    return day && day >= today && day <= days[6];
  });

  const linkClass =
    "inline-flex min-h-11 items-center rounded-2xl px-3 text-sm font-black text-emerald-800";

  return (
    <GrowthPageFrame
      kicker={
        intern
          ? "Intern portal · Growth workplace"
          : workplace.actor.isSuperUser
            ? "Super Admin · Growth Workplace"
            : "Social & Community Workplace"
      }
      title="Turn SitGuru stories into Pet Parents."
      detail={
        intern
          ? "Drafts go to Ava first. No Admin HQ, passwords, or Pet Parent private records."
          : "This is the workbench. Create, post, and watch signups — not follower counts."
      }
      action={
        intern ? (
          <Link
            href="/intern"
            className="inline-flex min-h-11 items-center rounded-2xl bg-white px-4 text-sm font-black text-emerald-900"
          >
            Intern dashboard
          </Link>
        ) : (
          <Link
            href="/intern/manage"
            className="inline-flex min-h-11 items-center rounded-2xl bg-white px-4 text-sm font-black text-emerald-900"
          >
            Intern team
          </Link>
        )
      }
    >
      {!intern && parents && parents.new24h > 0 ? (
        workplace.actor.isSuperUser ? (
          <Link
            href="/admin/petparents#new"
            className="flex min-h-14 items-center justify-between gap-3 rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-4"
          >
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-800">
                New Pet Parents
              </p>
              <p className="mt-1 break-words text-sm font-black text-amber-950">
                {parents.new24h} registered in the last 24 hours
              </p>
            </div>
            <PawPrint className="h-6 w-6 shrink-0 text-amber-800" />
          </Link>
        ) : (
          <div className="flex min-h-14 items-center justify-between gap-3 rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-4">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-800">
                New Pet Parents
              </p>
              <p className="mt-1 break-words text-sm font-black text-amber-950">
                {parents.new24h} registered in the last 24 hours
              </p>
            </div>
            <PawPrint className="h-6 w-6 shrink-0 text-amber-800" />
          </div>
        )
      ) : null}

      {/*
        Mobile module order (CSS order):
        1 Overview KPIs → 2 Quick Actions → 3 Community & Events → 4 Campaigns
        → 5 Ambassador Growth → 6 Growth Intelligence → 7 Team → 8 Recent Activity
        Desktop uses multi-column grid without relying on that order.
      */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:gap-5">
        {/* 1. Growth Overview — primary KPIs */}
        <section className="order-1 min-w-0 space-y-3 lg:col-span-12 lg:order-none">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                Growth overview
              </p>
              <h2 className="text-lg font-black text-slate-950 sm:text-xl">
                This week at a glance
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            {primaryKpis.map((tile) => (
              <AdminThemeCard
                key={tile.label}
                label={tile.label}
                value={tile.value}
                helper={tile.helper}
                tone={tile.tone}
                icon={tile.icon}
                trend={tile.trend}
                className="min-w-0 break-words [&_p.text-3xl]:text-2xl sm:[&_p.text-3xl]:text-3xl"
              />
            ))}
          </div>
        </section>

        {/* 2. Mobile Quick Actions */}
        <div className="order-2 min-w-0 lg:hidden">
          <GrowthQuickActions workplace={workplace} />
        </div>

        {/* Growth trend / registrations */}
        <section className="order-3 min-w-0 space-y-3 lg:col-span-12 lg:order-none">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
            Growth trend / registrations
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            {trendKpis.map((tile) => (
              <AdminThemeCard
                key={tile.label}
                label={tile.label}
                value={tile.value}
                helper={tile.helper}
                tone={tile.tone}
                icon={tile.icon}
                trend={tile.trend}
                className="min-w-0 break-words [&_p.text-3xl]:text-2xl sm:[&_p.text-3xl]:text-3xl"
              />
            ))}
          </div>
        </section>

        {/* Desktop action strip (hidden on mobile — Quick Actions covers it) */}
        <section className="order-10 hidden min-w-0 gap-3 lg:order-none lg:col-span-12 lg:grid lg:grid-cols-2 xl:grid-cols-3">
          {desktopActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={
                  action.primary
                    ? "flex min-h-24 min-w-0 items-center gap-4 rounded-[1.6rem] px-5 py-4 text-white shadow-sm"
                    : "flex min-h-24 min-w-0 items-center gap-4 rounded-[1.6rem] border border-emerald-100 bg-white px-5 py-4 shadow-sm"
                }
                style={action.primary ? { background: "#0D5C3A" } : undefined}
              >
                <span
                  className={
                    action.primary
                      ? "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15"
                      : "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#0D5C3A]"
                  }
                >
                  <Icon size={26} />
                </span>
                <span className="min-w-0">
                  <span
                    className={`block break-words text-lg font-black ${
                      action.primary ? "!text-white" : "text-slate-950"
                    }`}
                  >
                    {action.label}
                  </span>
                  <span
                    className={`mt-1 block break-words text-sm font-semibold ${
                      action.primary ? "!text-white/85" : "text-slate-500"
                    }`}
                  >
                    {action.detail}
                  </span>
                </span>
              </Link>
            );
          })}
        </section>

        {/* 3. Community & Events */}
        <div className="order-4 min-w-0 lg:col-span-6 lg:order-none">
          <GrowthCollapsibleSection
            eyebrow="Main workspace"
            title="Community & Events"
            defaultOpen
            action={
              <Link href={growthHref(base, "/events")} className={linkClass}>
                All →
              </Link>
            }
          >
            <div className="space-y-3 pt-4">
              {upcomingEvents.slice(0, 4).map((event) => (
                <article
                  key={event.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-3"
                >
                  <p className="break-words font-black text-slate-950">
                    {event.name}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {formatEventWhen(event.startAt)}
                    {event.market ? ` · ${event.market}` : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`${growthHref(base, "/create")}?type=event&title=${encodeURIComponent(event.name)}&market=${encodeURIComponent(event.market)}&href=${encodeURIComponent(event.href)}`}
                      className="inline-flex min-h-11 items-center rounded-2xl px-3 text-sm font-black !text-white"
                      style={{ background: "#0D5C3A" }}
                    >
                      Promote
                    </Link>
                    {!intern ? (
                      <Link
                        href="/admin/sales-marketing/lead-entry"
                        className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 bg-white px-3 text-sm font-black text-emerald-900"
                      >
                        Record leads
                      </Link>
                    ) : null}
                    <Link
                      href={event.href}
                      className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 bg-white px-3 text-sm font-black text-emerald-900"
                    >
                      Open event
                    </Link>
                  </div>
                </article>
              ))}
              {upcomingEvents.length === 0 ? (
                <GrowthEmptyState
                  title="No upcoming events yet"
                  detail="Promote published community events or create an event post from Quick Actions."
                  action={
                    <Link
                      href={growthHref(base, "/events")}
                      className="inline-flex min-h-11 items-center rounded-2xl px-4 text-sm font-black !text-white"
                      style={{ background: "#0D5C3A" }}
                    >
                      Browse events
                    </Link>
                  }
                />
              ) : null}
            </div>
          </GrowthCollapsibleSection>
        </div>

        {/* 4. Campaigns */}
        <div className="order-5 min-w-0 lg:col-span-6 lg:order-none">
          <GrowthCollapsibleSection
            eyebrow="Main workspace"
            title="Campaigns"
            defaultOpen
            action={
              <Link href={growthHref(base, "/campaigns")} className={linkClass}>
                All →
              </Link>
            }
          >
            <div className="space-y-3 pt-4">
              {campaigns.slice(0, 4).map((campaign) => (
                <Link
                  key={campaign.id}
                  href={growthHref(base, `/campaigns/${campaign.id}`)}
                  className="block rounded-2xl border border-slate-100 bg-slate-50 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 break-words font-black text-slate-950">
                      {campaign.name}
                    </p>
                    <StatusPill value={campaign.status} />
                  </div>
                  <p className="mt-1 break-words text-xs font-semibold text-slate-500">
                    {campaign.channelLabel}
                    {campaign.market ? ` · ${campaign.market}` : ""}
                  </p>
                </Link>
              ))}
              {campaigns.length === 0 ? (
                <GrowthEmptyState
                  title="No campaigns yet"
                  detail="Create one and copy the tracking link before you post."
                  action={
                    <Link
                      href={growthHref(base, "/create")}
                      className="inline-flex min-h-11 items-center rounded-2xl px-4 text-sm font-black !text-white"
                      style={{ background: "#0D5C3A" }}
                    >
                      Add campaign
                    </Link>
                  }
                />
              ) : null}
            </div>
          </GrowthCollapsibleSection>
        </div>

        {/* 5. Ambassador Growth */}
        <div className="order-6 min-w-0 lg:col-span-6 lg:order-none">
          <GrowthCollapsibleSection
            eyebrow="Secondary workspace"
            title="Ambassador Growth"
            defaultOpen={false}
          >
            <div className="space-y-3 pt-4">
              <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-800">
                  New ambassadors this week
                </p>
                <p className="mt-1 text-3xl font-black text-slate-950">
                  {stats.ambassadors}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  Promote Ambassador stories and track referral link use from
                  this workplace.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={growthHref(base, "/create?type=ambassador")}
                  className="inline-flex min-h-11 items-center rounded-2xl px-4 text-sm font-black !text-white"
                  style={{ background: "#0D5C3A" }}
                >
                  Ambassador post
                </Link>
                {!intern ? (
                  <Link
                    href="/admin/ambassadors"
                    className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-900"
                  >
                    Ambassador CRM
                  </Link>
                ) : null}
              </div>
            </div>
          </GrowthCollapsibleSection>
        </div>

        {/* 6. Growth Intelligence */}
        <div className="order-7 min-w-0 lg:col-span-6 lg:order-none">
          <GrowthCollapsibleSection
            eyebrow="Secondary workspace"
            title="Growth Intelligence"
            defaultOpen={false}
            action={
              <Link href={growthHref(base, "/analytics")} className={linkClass}>
                Open →
              </Link>
            }
          >
            <div className="grid grid-cols-2 gap-2 pt-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                  Visits
                </p>
                <p className="mt-1 break-all text-xl font-black text-slate-950">
                  {stats.visits}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                  Signups
                </p>
                <p className="mt-1 break-all text-xl font-black text-slate-950">
                  {stats.signups}
                </p>
              </div>
              <div className="col-span-2 rounded-2xl bg-slate-50 p-3 sm:col-span-1">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                  Conversion
                </p>
                <p className="mt-1 break-all text-xl font-black text-slate-950">
                  {stats.conversion}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-600">
              Compact scoreboard for phones. Open Analytics for the full Friday
              note and campaign list.
            </p>
          </GrowthCollapsibleSection>
        </div>

        {/* 7. Team */}
        <div className="order-8 min-w-0 lg:col-span-6 lg:order-none">
          <GrowthCollapsibleSection
            eyebrow="Bottom workspace"
            title="Team"
            defaultOpen={false}
          >
            <div className="space-y-3 pt-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-black text-emerald-950">
                  {stats.pendingReview > 0
                    ? `${stats.pendingReview} posts waiting for review`
                    : "No posts waiting for review"}
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-900/80">
                  {intern
                    ? "Submit drafts to Ava from Content. Keep passwords with SitGuru."
                    : "Review intern drafts, hours, and weekly check-ins from the intern team desk."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={growthHref(base, "/content")}
                  className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-900"
                >
                  Content queue
                </Link>
                <Link
                  href={intern ? "/intern" : "/intern/manage"}
                  className="inline-flex min-h-11 items-center rounded-2xl px-4 text-sm font-black !text-white"
                  style={{ background: "#0D5C3A" }}
                >
                  {intern ? "Intern portal" : "View team"}
                </Link>
              </div>
            </div>
          </GrowthCollapsibleSection>
        </div>

        {/* 8. Upcoming Work / Recent Activity */}
        <div className="order-9 min-w-0 lg:col-span-6 lg:order-none">
          <GrowthCollapsibleSection
            eyebrow="Bottom workspace"
            title="Upcoming Work"
            defaultOpen={false}
          >
            <div className="space-y-3 pt-4">
              {todayContent.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-3"
                >
                  <p className="break-words font-black text-slate-950">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Today · {item.platform} · {item.status}
                  </p>
                </div>
              ))}
              {upcomingEvents.slice(0, 3).map((event) => (
                <div
                  key={`up-${event.id}`}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-3"
                >
                  <p className="break-words font-black text-slate-950">
                    {event.name}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Event · {formatEventWhen(event.startAt)}
                  </p>
                </div>
              ))}
              {todayContent.length === 0 && upcomingEvents.length === 0 ? (
                <GrowthEmptyState
                  title="Nothing due today"
                  detail="Promote a Guru or draft tomorrow’s caption from Create."
                />
              ) : null}
            </div>
          </GrowthCollapsibleSection>
        </div>

        {/* Content calendar — full width */}
        <div className="order-11 min-w-0 lg:col-span-12 lg:order-none">
          <GrowthCollapsibleSection
            eyebrow="This week"
            title="Content calendar"
            defaultOpen
            forceOpen
            action={
              <Link href={growthHref(base, "/content")} className={linkClass}>
                Open →
              </Link>
            }
          >
            <div className="pt-4">
              <GrowthWeekBoard
                days={days}
                today={today}
                calendarItems={calendarItems}
              />
              {dueSoon.length === 0 ? (
                <p className="mt-4 text-sm font-semibold text-slate-500">
                  Nothing scheduled this week. Create a post and pick a day.
                </p>
              ) : null}
            </div>
          </GrowthCollapsibleSection>
        </div>

        {/* Recent activity — today + review queue */}
        <div className="order-12 min-w-0 lg:col-span-12 lg:order-none">
          <GrowthCollapsibleSection
            eyebrow="Recent activity"
            title="Today’s board"
            defaultOpen={false}
          >
            <div className="grid gap-3 pt-4 md:grid-cols-2">
              <div className="space-y-3">
                {todayContent.map((item) => (
                  <div
                    key={`act-${item.id}`}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <p className="break-words font-black text-slate-950">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {item.platform} · {item.status}
                    </p>
                  </div>
                ))}
                {todayContent.length === 0 ? (
                  <p className="text-sm font-semibold text-slate-500">
                    No posts due today.
                  </p>
                ) : null}
              </div>
              <div>
                {stats.pendingReview > 0 ? (
                  <Link
                    href={growthHref(base, "/content")}
                    className="block min-h-14 rounded-2xl bg-amber-50 px-3 py-3 text-sm font-black text-amber-900"
                  >
                    {stats.pendingReview} posts waiting for review
                  </Link>
                ) : (
                  <p className="text-sm font-semibold text-slate-500">
                    Review queue is clear.
                  </p>
                )}
              </div>
            </div>
          </GrowthCollapsibleSection>
        </div>
      </div>
    </GrowthPageFrame>
  );
}
