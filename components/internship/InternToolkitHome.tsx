import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  Link2,
  Megaphone,
  Palette,
  Plus,
  Users,
  Wrench,
} from "lucide-react";
import InternHelpSearchBar from "@/components/internship/InternHelpSearchBar";
import InternHeroBanner from "@/components/internship/InternHeroBanner";
import type { GrowthCampaign } from "@/lib/admin/growth/data";
import type { GrowthHomeStats } from "@/lib/admin/growth/data";
import type { GrowthInitiative, GrowthIntelligenceEntry } from "@/lib/admin/growth/outcomes";
import { INTERN_HOME_TOOLS, type InternPromoteEvent } from "@/lib/internship/intern-tools";
import { DESK_UI } from "@/lib/portal/desk-ui";

const TOOL_META = {
  brand: { icon: Palette, wrap: "bg-[#FFF1F2]", iconWrap: "bg-[#FFE4E6] text-[#E11D48]" },
  tracking: { icon: Link2, wrap: "bg-[#EFF6FF]", iconWrap: "bg-[#DBEAFE] text-[#2563EB]" },
  snapshot: { icon: BarChart3, wrap: "bg-[#F0FDF4]", iconWrap: "bg-[#DCFCE7] text-[#16A34A]" },
  events: { icon: CalendarDays, wrap: "bg-[#FFF7ED]", iconWrap: "bg-[#FFEDD5] text-[#EA580C]" },
  social: { icon: Megaphone, wrap: "bg-[#F5F3FF]", iconWrap: "bg-[#EDE9FE] text-[#7C3AED]" },
} as const;

function trendLine(label: string, suffix: string) {
  const even = label.toLowerCase() === "even";
  return (
    <p className={`mt-1 text-xs font-bold ${even ? "text-slate-500" : label.startsWith("+") ? "text-[#16A34A]" : "text-[#C2410C]"}`}>
      {even ? "— Even" : label} {suffix}
    </p>
  );
}

export default function InternToolkitHome({
  stats,
  weekLabel,
  events,
  campaigns,
  initiatives,
  insight,
}: {
  stats: GrowthHomeStats;
  weekLabel: string;
  events: InternPromoteEvent[];
  campaigns: GrowthCampaign[];
  initiatives: GrowthInitiative[];
  insight: GrowthIntelligenceEntry | null;
}) {
  const nextEvent = events[0] || null;
  const liveCampaigns = campaigns.filter((item) => item.status === "active");
  const shownCampaign = liveCampaigns[0] || campaigns[0] || null;

  return (
    <div className="space-y-4 pb-28 xl:pb-6">
      <InternHeroBanner
        title="Intern Toolkit"
        subtitle="Quick tools, resources, and everything you need to be successful."
        icon={<Wrench size={22} />}
      />

      <section aria-label="Quick tools" className={`${DESK_UI.card} p-4`}>
        <p className="text-sm font-black text-[#0F2744]">Quick tools</p>
        <p className="text-xs font-medium text-slate-500">Tap a card to open it</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {INTERN_HOME_TOOLS.map((tool) => {
            const meta = TOOL_META[tool.id];
            const Icon = meta.icon;
            return (
              <Link
                key={tool.id}
                href={`/intern/toolkit?tool=${tool.id}`}
                className={`rounded-2xl p-4 ${meta.wrap}`}
              >
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${meta.iconWrap}`}>
                  <Icon size={18} />
                </span>
                <p className="mt-3 text-sm font-black text-[#0F2744]">{tool.label}</p>
                <p className="mt-1 text-xs font-medium text-slate-600">{tool.blurb}</p>
                <p className="mt-3 text-xs font-bold text-[#2563EB]">Open →</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-sky-100 bg-[#EFF6FF] p-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="px-2 text-sm font-black text-[#0F2744]">Intern help</p>
          <p className="px-2 text-xs font-medium text-slate-600">Search how to check in, log hours, and use tracking links</p>
          <div className="mt-2">
            <InternHelpSearchBar variant="header" />
          </div>
        </div>
        <Link href="/intern/help" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#2563EB] px-4 text-sm font-bold !text-white">
          Open →
        </Link>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className={`${DESK_UI.card} p-4 xl:col-span-2`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-black text-[#0F2744]">Business Growth This Week</h2>
            <p className="text-xs font-bold text-slate-500">{weekLabel}</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Pet Parents", stats.petParents, stats.trends.petParents.label, "New this week", "bg-[#F0FDF4]"],
              ["Gurus", stats.gurus, stats.trends.gurus.label, "New this week", "bg-[#EFF6FF]"],
              ["Ambassadors", stats.ambassadors, stats.trends.ambassadors.label, "New this week", "bg-[#F5F3FF]"],
              ["Referrals", stats.referrals, stats.trends.referrals.label, "Links used", "bg-[#FFFBEB]"],
            ].map(([label, value, trend, suffix, wrap]) => (
              <div key={String(label)} className={`rounded-2xl p-3 ${wrap}`}>
                <p className="text-xs font-bold text-slate-600">{label}</p>
                <p className="mt-1 text-3xl font-black text-[#0F2744]">{value}</p>
                {trendLine(String(trend), String(suffix))}
              </div>
            ))}
          </div>
        </article>

        <article className={`${DESK_UI.card} p-4`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-black text-[#0F2744]">Community & Events</h2>
            <Link href="/intern/growth/events" className="text-sm font-bold text-[#2563EB]">Open →</Link>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500">Upcoming activations and event-day results</p>
          {nextEvent ? (
            <Link href={nextEvent.href} className="mt-4 block rounded-2xl bg-[#EFF6FF] p-4">
              <p className="font-black text-[#0F2744]">{nextEvent.title}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{nextEvent.when}</p>
              <p className="text-sm font-medium text-slate-500">{nextEvent.place}</p>
            </Link>
          ) : (
            <div className="mt-4 rounded-2xl bg-[#F8FAFC] p-4">
              <p className="font-black text-[#0F2744]">No event outcomes yet</p>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                Planner covers tent prep. SitGuru records leads, QR scans, registrations, and lessons learned.
              </p>
            </div>
          )}
        </article>

        <article className={`${DESK_UI.card} p-4 xl:col-span-2`}>
          <h2 className="text-lg font-black text-[#0F2744]">Analytics / Results</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Social visits", stats.visits, stats.trends.visits.label, "Clicks + views", "bg-[#EFF6FF]"],
              ["Registrations", stats.signups, stats.trends.signups.label, "Attributed signups", "bg-[#FFF1F2]"],
              ["Conversion", stats.conversion, stats.trends.conversion?.label || "even", "Signups + visits", "bg-[#F5F3FF]"],
              ["Live campaigns", stats.campaigns, stats.trends.campaigns.label, "Outcome tracking", "bg-[#F0FDF4]"],
            ].map(([label, value, trend, suffix, wrap]) => (
              <div key={String(label)} className={`rounded-2xl p-3 ${wrap}`}>
                <p className="text-xs font-bold text-slate-600">{label}</p>
                <p className="mt-1 text-2xl font-black text-[#0F2744]">{value}</p>
                {trendLine(String(trend), String(suffix))}
              </div>
            ))}
          </div>
        </article>

        <article className={`${DESK_UI.card} p-4`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-black text-[#0F2744]">Campaigns</h2>
            <Link href="/intern/growth/campaigns" className="text-sm font-bold text-[#2563EB]">Open →</Link>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500">Campaign performance</p>
          {shownCampaign ? (
            <div className="mt-4 rounded-2xl bg-[#F8FAFC] p-4">
              <p className="font-black text-[#0F2744]">{shownCampaign.name}</p>
              <p className="mt-1 text-sm font-semibold capitalize text-slate-600">{shownCampaign.status.replaceAll("_", " ")}</p>
              <p className="text-sm font-medium text-slate-500">{shownCampaign.channelLabel}</p>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl bg-[#F8FAFC] p-4">
              <p className="font-black text-[#0F2744]">No campaign outcomes yet</p>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                Track destinations, status, and acquisition impact. Creative review and production checklists stay in Planner.
              </p>
            </div>
          )}
          <Link href="/intern/toolkit?tool=tracking" className="mt-3 inline-flex min-h-10 items-center text-sm font-bold text-[#2563EB]">
            + Create Tracking Link
          </Link>
        </article>

        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Current Initiatives</h2>
          <p className="mt-1 text-xs font-medium text-slate-500">High-level growth themes. Executable work stays in Planner.</p>
          {initiatives[0] ? (
            <div className="mt-4 rounded-2xl bg-[#F8FAFC] p-4">
              <p className="font-black text-[#0F2744]">{initiatives[0].name}</p>
              <p className="mt-1 text-sm font-medium text-slate-600">{initiatives[0].purpose || initiatives[0].status}</p>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl bg-[#F8FAFC] p-4">
              <p className="font-black text-[#0F2744]">No initiatives recorded yet</p>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                A high-level initiative starts when a strategy becomes an active growth theme.
              </p>
            </div>
          )}
          <Link href="/intern/growth/create" className="mt-3 inline-flex min-h-11 items-center rounded-full bg-[#2563EB] px-4 text-sm font-bold !text-white">
            <Plus size={16} className="mr-1" /> Add Initiative
          </Link>
        </article>

        <article className={`${DESK_UI.card} p-4`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-black text-[#0F2744]">Ambassador Growth</h2>
            <Link href="/intern/growth/analytics" className="text-sm font-bold text-[#2563EB]">Open →</Link>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500">Ambassador outcomes</p>
          <div className="mt-4 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#EDE9FE] text-[#7C3AED]">
              <Users size={18} />
            </span>
            <div>
              <p className="text-3xl font-black text-[#0F2744]">{stats.ambassadors}</p>
              <p className="text-xs font-bold text-slate-600">New ambassadors this week</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs font-medium text-slate-500">Referral clicks</p>
              <p className="text-xl font-black text-[#0F2744]">{stats.referrals}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Attributed regs</p>
              <p className="text-xl font-black text-[#0F2744]">{stats.signups}</p>
            </div>
          </div>
          <p className="mt-3 text-xs font-medium leading-5 text-slate-500">
            Hybrid model: in-person and remote. Program planning stays in Teams and Planner.
          </p>
        </article>

        <article className={`${DESK_UI.card} p-4`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-black text-[#0F2744]">Growth Intelligence</h2>
            <Link href="/intern/growth/intelligence" className="text-sm font-bold text-[#2563EB]">Open →</Link>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500">Tests, surveys, and learning</p>
          {insight ? (
            <div className="mt-4 rounded-2xl bg-[#F8FAFC] p-4">
              <p className="font-black text-[#0F2744]">{insight.title}</p>
              <p className="mt-1 text-sm font-medium text-slate-600">{insight.keyFinding || insight.objective}</p>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl bg-[#F8FAFC] p-4">
              <p className="font-black text-[#0F2744]">No market learning recorded yet</p>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                Test, learn, recommend, act, measure. Discussion can continue in Teams. Analytics and findings stay here.
              </p>
            </div>
          )}
          <Link href="/intern/growth/intelligence" className="mt-3 inline-flex min-h-11 items-center rounded-full bg-[#16A34A] px-4 text-sm font-bold !text-white">
            <Plus size={16} className="mr-1" /> Record Insight
          </Link>
        </article>
      </section>
    </div>
  );
}
