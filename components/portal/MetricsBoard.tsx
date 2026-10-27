import Link from "next/link";
import { BarChart3, CalendarDays, FileText, Heart, LineChart, PawPrint, Users } from "lucide-react";
import DeskPageHero from "@/components/manager/DeskPageHero";
import { DESK_UI } from "@/lib/portal/desk-ui";
import type { GrowthHomeStats } from "@/lib/admin/growth/data";

function trendLabel(label?: string | null) {
  if (!label || label === "even") return "even vs last week";
  return `${label} vs last week`;
}

export default function MetricsBoard({
  stats,
  audience,
  content,
}: {
  stats: GrowthHomeStats;
  audience: "manager" | "intern";
  content: Array<{ title: string; detail: string }>;
}) {
  const manager = audience === "manager";
  const reportHref = manager ? "/manager/reports" : "/intern/growth";
  const cards = [
    { label: "Website Visits", value: stats.visits, trend: trendLabel(stats.trends.visits.label), tone: "bg-[#EFF6FF] text-[#1D4ED8]", icon: Users },
    { label: "Social Engagements", value: stats.referrals, trend: trendLabel(stats.trends.referrals.label), tone: "bg-[#FFF1F2] text-[#BE123C]", icon: Heart },
    { label: "New Signups", value: stats.signups, trend: trendLabel(stats.trends.signups.label), tone: "bg-[#FFF7ED] text-[#C2410C]", icon: Users },
    { label: "Event Views", value: stats.campaigns, trend: trendLabel(stats.trends.campaigns.label), tone: "bg-[#F5F3FF] text-[#6D28D9]", icon: CalendarDays },
    { label: "Bookings Started", value: stats.petParents, trend: trendLabel(stats.trends.petParents.label), tone: "bg-[#ECFDF5] text-[#047857]", icon: PawPrint },
  ];
  const max = Math.max(stats.visits, stats.referrals, stats.signups, stats.campaigns, 1);
  const channels = [
    ["Website", stats.visits, "#2563EB"],
    ["Instagram", stats.referrals, "#EC4899"],
    ["Signups", stats.signups, "#F59E0B"],
    ["Events", stats.campaigns, "#8B5CF6"],
  ] as const;

  return (
    <div className="space-y-4 pb-28 lg:pb-8">
      <DeskPageHero
        icon={<BarChart3 size={22} />}
        title="Metrics"
        subtitle="Track your impact, see your progress, and help grow the SitGuru community."
        banner={manager ? "manager" : "intern"}
        quote={"Learn. Create.\nMake an impact.\nHappier pets.\nBrighter communities."}
      />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <article key={card.label} className={`rounded-2xl p-4 ${card.tone}`}>
            <card.icon size={18} />
            <p className="mt-2 text-3xl font-black text-[#0F2744]">{card.value.toLocaleString("en-US")}</p>
            <p className="text-sm font-black">{card.label}</p>
            <p className="text-xs font-semibold text-[#16A34A]">{card.trend}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <article className={`${DESK_UI.card} p-4`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-[#0F2744]">Performance Overview</h2>
            <span className="text-xs font-bold text-slate-400">This week</span>
          </div>
          <svg viewBox="0 0 320 140" className="mt-4 h-44 w-full">
            {cards.slice(0, 4).map((card, index) => {
              const y = 120 - (card.value / max) * 100;
              const x = 30 + index * 70;
              return <circle key={card.label} cx={x} cy={y} r="5" fill={index === 0 ? "#2563EB" : index === 1 ? "#EC4899" : index === 2 ? "#F59E0B" : "#8B5CF6"} />;
            })}
            <path d={cards.slice(0, 4).map((card, index) => `${index ? "L" : "M"}${30 + index * 70} ${120 - (card.value / max) * 100}`).join(" ")} fill="none" stroke="#2563EB" strokeWidth="3" />
          </svg>
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Metrics by Channel</h2>
          <div className="mt-4 flex h-44 items-end gap-4">
            {channels.map(([label, value, color]) => (
              <div key={label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-32 w-full items-end">
                  <div className="w-full rounded-t-lg" style={{ height: `${Math.max(6, (value / max) * 100)}%`, background: color }} />
                </div>
                <span className="text-[10px] font-bold text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <article className={`${DESK_UI.card} p-4`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-[#0F2744]">Top Performing Content</h2>
            <Link href={manager ? "/manager/content" : "/intern/work"} className="text-xs font-bold text-[#2563EB]">View All →</Link>
          </div>
          <ul className="mt-3 space-y-3">
            {(content.length ? content : [{ title: "No published posts yet", detail: "Content you publish will show here." }]).map((item, index) => (
              <li key={item.title} className="flex items-center justify-between gap-3">
                <span className="font-bold text-[#0F2744]">{index + 1}. {item.title}</span>
                <span className="text-xs font-medium text-slate-500">{item.detail}</span>
              </li>
            ))}
          </ul>
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Audience Growth</h2>
          <p className="mt-2 text-4xl font-black text-[#0F2744]">{stats.visits.toLocaleString("en-US")}</p>
          <p className="text-sm font-semibold text-[#16A34A]">{trendLabel(stats.trends.visits.label)}</p>
          <p className="mt-2 text-xs font-medium text-slate-500">Visits recorded this week. Channel splits appear when each network is connected.</p>
        </article>
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Goals Progress</h2>
          {[
            ["Grow visits", stats.visits, Math.max(stats.visits, 10)],
            ["New signups", stats.signups, Math.max(stats.signups, 5)],
            ["Active campaigns", stats.campaigns, Math.max(stats.campaigns, 1)],
          ].map(([label, value, goal]) => {
            const pct = Math.min(100, Math.round((Number(value) / Number(goal)) * 100));
            return (
              <div key={String(label)} className="mt-3">
                <div className="flex justify-between text-sm font-bold text-[#0F2744]"><span>{label}</span><span>{pct}%</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#22C55E]" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">This Week vs Last</h2>
          <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
            <li>Pet parents {trendLabel(stats.trends.petParents.label)}</li>
            <li>Gurus {trendLabel(stats.trends.gurus.label)}</li>
            <li>Ambassadors {trendLabel(stats.trends.ambassadors.label)}</li>
            <li>Conversion {stats.conversion}</li>
          </ul>
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Quick Actions</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href={reportHref} className="rounded-2xl bg-[#ECFDF5] px-3 py-3 text-center text-sm font-bold text-[#047857]"><FileText size={14} className="mx-auto" />View Business Growth Report</Link>
            <Link href={manager ? "/manager/results" : "/intern/results"} className="rounded-2xl bg-[#EFF6FF] px-3 py-3 text-center text-sm font-bold text-[#1D4ED8]"><LineChart size={14} className="mx-auto" />Live Results</Link>
            <Link href={manager ? "/manager" : "/intern"} className="rounded-2xl bg-[#F5F3FF] px-3 py-3 text-center text-sm font-bold text-[#6D28D9]">Track Goals</Link>
            <Link href={manager ? "/manager/content" : "/intern/work"} className="rounded-2xl bg-[#FFF7ED] px-3 py-3 text-center text-sm font-bold text-[#C2410C]">See Top Content</Link>
          </div>
        </article>
      </section>
    </div>
  );
}
