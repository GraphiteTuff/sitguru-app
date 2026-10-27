import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Handshake,
  Lightbulb,
  Megaphone,
  MousePointerClick,
  PawPrint,
  Sparkles,
  Users,
} from "lucide-react";
import { AdminThemeCard } from "@/components/admin/AdminThemeCard";
import { getPetParentSummary } from "@/lib/admin/customers/pet-parents";
import {
  getGrowthHomeStats,
  listGrowthCampaigns,
  listUpcomingGrowthEvents,
} from "@/lib/admin/growth/data";
import {
  listGrowthEventResults,
  listGrowthInitiatives,
  listGrowthIntelligence,
} from "@/lib/admin/growth/outcomes";
import { listGrowthTeamSummary } from "@/lib/admin/growth/team-summary";
import { getGrowthResourceLinks } from "@/lib/admin/growth/operating-model";
import {
  documentationGrowthCampaigns,
  documentationGrowthHomeStats,
} from "@/lib/internship/documentation-fixture";
import GrowthOperatingGuide from "@/components/admin/growth/GrowthOperatingGuide";
import AdminPortalDirectory from "@/components/admin/AdminPortalDirectory";
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
import GrowthResourcesPanel from "@/components/admin/growth/GrowthResourcesPanel";
import GrowthTeamPanel from "@/components/admin/growth/GrowthTeamPanel";
import ManagerHomeTimeCards from "@/components/admin/growth/ManagerHomeTimeCards";
import { loadManagerHomeExtras } from "@/lib/staff-time/home-summary";

function formatEventWhen(iso: string | null) {
  if (!iso) return "Date TBD";
  const date = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "Date TBD";
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
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

  const [
    stats,
    campaigns,
    parents,
    upcomingEvents,
    eventResults,
    intelligence,
    initiatives,
    team,
    managerExtras,
  ] = documentation
    ? [
        documentationGrowthHomeStats(),
        documentationGrowthCampaigns(),
        null,
        [],
        [],
        [],
        [],
        [],
        { myTime: null, needsAttention: [] },
      ]
    : await Promise.all([
        getGrowthHomeStats(),
        listGrowthCampaigns(),
        intern ? Promise.resolve(null) : getPetParentSummary(),
        listUpcomingGrowthEvents(6),
        listGrowthEventResults(6),
        listGrowthIntelligence(6),
        listGrowthInitiatives(6),
        intern
          ? Promise.resolve([])
          : listGrowthTeamSummary({
              actorUserId: workplace.actor.id,
              isSuperUser: workplace.actor.isSuperUser,
            }),
        intern
          ? Promise.resolve({ myTime: null, needsAttention: [] })
          : loadManagerHomeExtras({
              userId: workplace.actor.id,
              email: workplace.actor.email,
              isSuperUser: workplace.actor.isSuperUser,
              basePath: base,
            }),
      ]);

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
      label: "Live campaigns",
      value: String(stats.campaigns),
      helper: "Outcome tracking",
      tone: "emerald" as const,
      icon: <Sparkles size={18} />,
      trend: stats.trends.campaigns,
    },
  ];

  const desktopActions = [
    {
      href: growthHref(base, "/events"),
      label: "Community & Events",
      detail: "Upcoming activations + event-day results",
      icon: CalendarDays,
      primary: true,
    },
    {
      href: growthHref(base, "/campaigns"),
      label: "Campaign outcomes",
      detail: "Target vs result — production stays in Planner",
      icon: Megaphone,
    },
    {
      href: growthHref(base, "/intelligence"),
      label: "Growth Intelligence",
      detail: "Surveys, polls, tests, recommendations",
      icon: Lightbulb,
    },
    {
      href: growthHref(base, "/analytics"),
      label: "Analytics / Results",
      detail: "Business performance and trends",
      icon: BarChart3,
    },
    {
      href: intern ? "/intern" : "/intern/manage",
      label: intern ? "Intern Portal" : "Intern Team Desk",
      detail: intern
        ? "Hours & university record"
        : "Formal intern oversight",
      icon: Users,
    },
    ...(!intern
      ? [
          {
            href: growthHref(base, "/my-time"),
            label: "My Time",
            detail: "Log hours and current payment period",
            icon: ClipboardList,
          },
          {
            href: growthHref(base, "/payments"),
            label: "My Payments",
            detail: "Payment history and status",
            icon: CheckCircle2,
          },
        ]
      : []),
    {
      href: growthHref(base, "/create"),
      label: "Tracking link",
      detail: "Campaign destination for measurable signups",
      icon: ClipboardList,
    },
  ];

  const linkClass =
    "inline-flex min-h-11 items-center rounded-2xl px-3 text-sm font-black text-emerald-800";
  const resourceLinks = getGrowthResourceLinks({
    intern,
    email: workplace.actor.email,
    includeChannels: false,
  });

  return (
    <GrowthPageFrame
      kicker={
        intern
          ? "Intern portal · Growth measurement"
          : workplace.actor.isSuperUser
            ? "Super Admin · Growth Workspace"
            : "Social & Community Growth Workspace"
      }
      title="Measure SitGuru growth. Decide what to do next."
      detail={
        intern
          ? "Outcomes and learning live here. Planner owns assignments. Intern Portal owns hours and university requirements."
          : "Teams communicates. Planner manages work. This workspace records results — Messages, My Time, and Intern Team Desk stay one tap away."
      }
      action={
        intern ? (
          <Link
            href="/intern"
            className="inline-flex min-h-11 items-center rounded-2xl bg-white px-4 text-sm font-black text-emerald-900"
          >
            Intern Portal
          </Link>
        ) : (
          <Link
            href="/intern/manage"
            className="inline-flex min-h-11 items-center rounded-2xl bg-white px-4 text-sm font-black text-emerald-900"
          >
            Intern Team Desk
          </Link>
        )
      }
    >
      <div className="rounded-[1.4rem] border border-emerald-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
        <span className="font-black text-emerald-900">Operating model:</span>{" "}
        Founder direction → Growth strategy → Teams discussion → Planner
        execution → Growth Workspace measures results → learning → next
        experiment. Routine work does not wait on Founder approval.
      </div>

      {!intern ? (
        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            [growthHref(base, "/messages"), "Messages"],
            ["/intern/manage", "Intern team"],
            [growthHref(base, "/my-time"), "My Time"],
            [growthHref(base, "/payments"), "My Payments"],
            [growthHref(base, "/onboarding"), "Onboarding"],
            ...(workplace.actor.isSuperUser
              ? [
                  ["/admin/internship/time", "Approve hours"],
                  ["/admin/hr/people", "People"],
                  ["/admin/hr/people/payments", "Team Payments"],
                  ["/admin/messages/moderation", "Reports"],
                ]
              : []),
          ].map(([href, label]) => (
            <Link key={href} href={href} className="flex min-h-16 items-center justify-center rounded-2xl border border-emerald-100 bg-white px-3 text-center text-sm font-black text-emerald-950">
              {label}
            </Link>
          ))}
        </section>
      ) : null}
      {!intern ? <AdminPortalDirectory /> : null}
      {!intern ? <GrowthOperatingGuide /> : null}
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

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:gap-5">
        {!intern ? (
          <ManagerHomeTimeCards extras={managerExtras} basePath={base} />
        ) : null}

        {/* Overview */}
        <section className="order-2 min-w-0 space-y-3 lg:col-span-12">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
              Overview
            </p>
            <h2 className="text-lg font-black text-slate-950 sm:text-xl">
              Business growth this week
            </h2>
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
                className="min-w-0 break-words"
              />
            ))}
          </div>
        </section>

        <div className="order-2 min-w-0 lg:hidden">
          <GrowthQuickActions workplace={workplace} />
        </div>

        <section className="order-3 min-w-0 space-y-3 lg:col-span-12">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
            Analytics / Results
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
                className="min-w-0 break-words"
              />
            ))}
          </div>
        </section>

        <section className="order-10 hidden min-w-0 gap-3 lg:col-span-12 lg:grid lg:grid-cols-2 xl:grid-cols-3">
          {desktopActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={`${action.href}-${action.label}`}
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

        {/* Current Initiatives — high-level only */}
        <div className="order-4 min-w-0 lg:col-span-12">
          <GrowthCollapsibleSection
            eyebrow="Current initiatives"
            title="High-level growth initiatives"
            defaultOpen={false}
          >
            <div className="space-y-3 pt-4">
              <p className="text-sm font-semibold text-slate-600">
                Initiatives describe business themes (for example November Pet
                Parent Acquisition). Production tasks, owners, and review stages
                belong in Microsoft Planner — not here.
              </p>
              {initiatives.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="min-w-0 break-words font-black text-slate-950">
                      {item.name}
                    </p>
                    <StatusPill value={item.status} />
                  </div>
                  {item.purpose ? (
                    <p className="mt-1 break-words text-sm font-semibold text-slate-600">
                      {item.purpose}
                    </p>
                  ) : null}
                  {item.market ? (
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
                      {item.market}
                    </p>
                  ) : null}
                </article>
              ))}
              {initiatives.length === 0 ? (
                <GrowthEmptyState
                  title="No initiatives recorded yet"
                  detail="Add a high-level initiative when a strategy becomes an active growth theme. Executable work still goes to Planner."
                />
              ) : null}
            </div>
          </GrowthCollapsibleSection>
        </div>

        {/* Community & Events */}
        <div className="order-5 min-w-0 lg:col-span-6">
          <GrowthCollapsibleSection
            eyebrow="Community & Events"
            title="Event activation & results"
            defaultOpen
            action={
              <Link href={growthHref(base, "/events")} className={linkClass}>
                Open →
              </Link>
            }
          >
            <div className="space-y-3 pt-4">
              {upcomingEvents.slice(0, 3).map((event) => (
                <article
                  key={event.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-3"
                >
                  <p className="break-words font-black text-slate-950">
                    {event.name}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Upcoming · {formatEventWhen(event.startAt)}
                    {event.market ? ` · ${event.market}` : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!intern ? (
                      <Link
                        href={`${growthHref(base, "/events")}#record-results`}
                        className="inline-flex min-h-11 items-center rounded-2xl px-3 text-sm font-black !text-white"
                        style={{ background: "#0D5C3A" }}
                      >
                        Record results
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
              {eventResults.slice(0, 3).map((result) => (
                <article
                  key={result.id}
                  className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3"
                >
                  <p className="break-words font-black text-slate-950">
                    {result.eventName}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-600">
                    Results · {formatEventWhen(result.eventDate)} ·{" "}
                    {result.totalLeads} leads · {result.totalRegistrations} regs
                    · {result.conversionRate}
                  </p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">
                    Leads {result.leadsMetricSource} · Regs{" "}
                    {result.registrationsMetricSource} · QR{" "}
                    {result.qrScansMetricSource}
                  </p>
                  {result.lessonsLearned ? (
                    <p className="mt-2 break-words text-sm font-semibold text-slate-700">
                      {result.lessonsLearned}
                    </p>
                  ) : null}
                </article>
              ))}
              {upcomingEvents.length === 0 && eventResults.length === 0 ? (
                <GrowthEmptyState
                  title="No event outcomes yet"
                  detail="Planner covers tent prep. SitGuru records leads, QR scans, registrations, and lessons learned."
                  action={
                    !intern ? (
                      <Link
                        href={`${growthHref(base, "/events")}#record-results`}
                        className="inline-flex min-h-11 items-center rounded-2xl px-4 text-sm font-black !text-white"
                        style={{ background: "#0D5C3A" }}
                      >
                        Record event results
                      </Link>
                    ) : undefined
                  }
                />
              ) : null}
            </div>
          </GrowthCollapsibleSection>
        </div>

        {/* Campaigns */}
        <div className="order-6 min-w-0 lg:col-span-6">
          <GrowthCollapsibleSection
            eyebrow="Campaigns"
            title="Campaign performance"
            defaultOpen
            action={
              <Link href={growthHref(base, "/campaigns")} className={linkClass}>
                Open →
              </Link>
            }
          >
            <div className="space-y-3 pt-4">
              <p className="text-sm font-semibold text-slate-600">
                Track destinations, status, and acquisition impact. Creative
                review and production checklists stay in Planner.
              </p>
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
                  title="No campaign outcomes yet"
                  detail="Create a tracking link when a campaign needs measurable signups."
                />
              ) : null}
            </div>
          </GrowthCollapsibleSection>
        </div>

        {/* Ambassador Growth */}
        <div className="order-7 min-w-0 lg:col-span-6">
          <GrowthCollapsibleSection
            eyebrow="Ambassador Growth"
            title="Ambassador outcomes"
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
                  Hybrid model: in-person / person-to-person and remote /
                  digital. Program planning stays in Teams + Planner.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                    Referral clicks
                  </p>
                  <p className="mt-1 text-xl font-black text-slate-950">
                    {stats.referrals}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                    Attributed regs
                  </p>
                  <p className="mt-1 text-xl font-black text-slate-950">
                    {stats.signups}
                  </p>
                </div>
              </div>
            </div>
          </GrowthCollapsibleSection>
        </div>

        {/* Growth Intelligence */}
        <div className="order-8 min-w-0 lg:col-span-6">
          <GrowthCollapsibleSection
            eyebrow="Growth Intelligence"
            title="Tests, surveys & learning"
            defaultOpen={false}
            action={
              <Link
                href={growthHref(base, "/intelligence")}
                className={linkClass}
              >
                Open →
              </Link>
            }
          >
            <div className="space-y-3 pt-4">
              <p className="text-sm font-semibold text-slate-600">
                Test → Learn → Recommend → Act → Measure. Discussion of findings
                can continue in the Teams Analytics and Results channel.
              </p>
              {intelligence.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-3"
                >
                  <p className="break-words font-black text-slate-950">
                    {entry.title}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {entry.studyType}
                    {entry.responseCount
                      ? ` · ${entry.responseCount} responses`
                      : ""}
                  </p>
                  {entry.keyFinding ? (
                    <p className="mt-2 break-words text-sm font-semibold text-slate-700">
                      {entry.keyFinding}
                    </p>
                  ) : null}
                  {entry.recommendation ? (
                    <p className="mt-1 break-words text-sm font-semibold text-emerald-900">
                      Recommend: {entry.recommendation}
                    </p>
                  ) : null}
                </article>
              ))}
              {intelligence.length === 0 ? (
                <GrowthEmptyState
                  title="No market learning recorded yet"
                  detail="Draft surveys in Planner. Capture findings and recommendations here."
                  action={
                    <Link
                      href={growthHref(base, "/intelligence")}
                      className="inline-flex min-h-11 items-center rounded-2xl px-4 text-sm font-black !text-white"
                      style={{ background: "#0D5C3A" }}
                    >
                      Record insight
                    </Link>
                  }
                />
              ) : null}
            </div>
          </GrowthCollapsibleSection>
        </div>

        {/* Team */}
        <div className="order-9 min-w-0 lg:col-span-6">
          <GrowthCollapsibleSection
            eyebrow="Team"
            title="Assigned interns"
            defaultOpen={false}
          >
            <GrowthTeamPanel members={team} intern={intern} />
          </GrowthCollapsibleSection>
        </div>

        {/* Resources */}
        <div className="order-11 min-w-0 lg:col-span-6">
          <GrowthCollapsibleSection
            eyebrow="Resources"
            title="External work systems"
            defaultOpen={false}
          >
            <GrowthResourcesPanel
              intern={intern}
              email={workplace.actor.email}
              links={resourceLinks}
            />
          </GrowthCollapsibleSection>
        </div>

        {/* Results & Learning bridge */}
        <div className="order-12 min-w-0 lg:col-span-12">
          <GrowthCollapsibleSection
            eyebrow="Results & Learning"
            title="Bridge from Planner execution"
            defaultOpen={false}
            forceOpen
          >
            <div className="space-y-3 pt-4 text-sm font-semibold leading-6 text-slate-600">
              <p>
                Planner’s{" "}
                <span className="font-black text-slate-950">
                  Results & Learning
                </span>{" "}
                bucket closes production work. SitGuru stores the business
                outcome: leads, registrations, conversion, follow-ups, lessons,
                and recommended next action.
              </p>
              <p>
                Founder approval remains reserved for substantial spend, paid
                ads, contracts, legal/policy, compensation, and high-risk brand
                decisions — not routine organic growth execution.
              </p>
            </div>
          </GrowthCollapsibleSection>
        </div>
      </div>
    </GrowthPageFrame>
  );
}
