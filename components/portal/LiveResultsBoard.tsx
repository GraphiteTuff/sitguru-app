import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileDown,
  LineChart,
  Megaphone,
  PawPrint,
  PenLine,
  Share2,
  Users,
  type LucideIcon,
} from "lucide-react";
import DeskPageHero from "@/components/manager/DeskPageHero";
import LiveResultsClock from "@/components/portal/LiveResultsClock";
import LiveSocialAutoRefresh from "@/components/portal/LiveSocialAutoRefresh";
import MetaSocialSyncControl from "@/components/portal/MetaSocialSyncControl";
import { DESK_UI } from "@/lib/portal/desk-ui";
import type { LiveResultsData } from "@/lib/admin/growth/live-results";

const PEOPLE_META = [
  {
    color: "#22C55E",
    wrap: "border-emerald-100 bg-[#F0FDF4]",
    icon: <Users size={18} />,
  },
  {
    color: "#3B82F6",
    wrap: "border-sky-100 bg-[#EFF6FF]",
    icon: <PawPrint size={18} />,
  },
  {
    color: "#A855F7",
    wrap: "border-violet-100 bg-[#F5F3FF]",
    icon: <Megaphone size={18} />,
  },
] as const;

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

export default function LiveResultsBoard({
  audience,
  data,
  canSyncMeta = false,
}: {
  audience: "manager" | "intern";
  data: LiveResultsData;
  canSyncMeta?: boolean;
}) {
  const manager = audience === "manager";
  const base = manager ? "/manager" : "/intern";
  const actions: Array<{ href: string; label: string; tone: string; icon: LucideIcon }> = manager
    ? [
        { href: "/manager/content", label: "Create a Post", tone: "bg-[#ECFDF5] text-[#047857]", icon: PenLine },
        { href: "/manager/calendar", label: "View Calendar", tone: "bg-[#EFF6FF] text-[#1D4ED8]", icon: CalendarDays },
        { href: "/manager/metrics", label: "View Metrics", tone: "bg-[#F5F3FF] text-[#6D28D9]", icon: BarChart3 },
        { href: "/manager/analytics", label: "Export Report", tone: "bg-[#FFF7ED] text-[#C2410C]", icon: FileDown },
      ]
    : [
        { href: "/intern/work", label: "Create a Post", tone: "bg-[#ECFDF5] text-[#047857]", icon: PenLine },
        { href: "/intern/calendar", label: "View Calendar", tone: "bg-[#EFF6FF] text-[#1D4ED8]", icon: CalendarDays },
        { href: "/intern/metrics", label: "View Metrics", tone: "bg-[#F5F3FF] text-[#6D28D9]", icon: BarChart3 },
        { href: "/intern/growth", label: "Export Report", tone: "bg-[#FFF7ED] text-[#C2410C]", icon: FileDown },
      ];

  return (
    <div className="space-y-4 pb-28 lg:pb-8">
      <LiveSocialAutoRefresh intervalMs={60_000} />
      <DeskPageHero
        icon={<LineChart size={22} />}
        title="Live Results"
        subtitle={
          manager
            ? "People totals, public visits, and posts from SitGuru records."
            : "The same live people and visit totals, without customer names."
        }
        banner={manager ? "manager" : "intern"}
        quote={"Learn. Create.\nMake an impact.\nHappier pets.\nBrighter communities."}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-emerald-100 bg-[#F0FDF4] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#166534]">This week</p>
          <p className="mt-2 flex items-center gap-2 text-lg font-black text-[#166534]">
            <CheckCircle2 size={18} /> {manager ? formatCount(data.reviewCount) : "Due"}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-600">
            {manager ? "Posts waiting on review" : "Complete your weekly check-in"}
          </p>
          <Link href={manager ? "/manager/content" : `${base}/check-ins`} className="mt-2 inline-flex text-xs font-bold text-[#166534]">
            {manager ? "Open content →" : "Open check-in →"}
          </Link>
        </article>
        <article className="rounded-2xl border border-violet-100 bg-[#F5F3FF] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#6D28D9]">Upcoming</p>
          <p className="mt-2 flex items-center gap-2 text-3xl font-black text-[#6D28D9]">
            <ClipboardList size={18} /> {formatCount(data.upcomingEvents)}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-600">
            {formatCount(data.laterPosts)} posts dated ahead
          </p>
        </article>
        <article className="rounded-2xl border border-amber-100 bg-[#FFFBEB] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#B45309]">Tracked visits</p>
          <p className="mt-2 text-3xl font-black text-[#0F2744]">{formatCount(data.reach)}</p>
          <p className="mt-1 text-sm font-medium text-slate-600">
            {formatCount(data.reachThisWeek)} public visits and QR scans this week
          </p>
        </article>
        <article className="rounded-2xl border border-rose-100 bg-[#FFF1F2] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#BE123C]">Content posts</p>
          <p className="mt-2 flex items-center gap-2 text-3xl font-black text-[#0F2744]">
            <Share2 size={18} className="text-[#E11D48]" /> {formatCount(data.posts)}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-600">
            {formatCount(data.postsThisWeek)} added this week
          </p>
        </article>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-[#2563EB]">Live SitGuru Results</p>
            <h2 className="text-2xl font-black text-[#0F2744]">People and social visits</h2>
            <p className="text-sm font-medium text-slate-500">
              People totals come from SitGuru. Social cards show verified API followers when connected, with website visits and QR scans listed separately.
            </p>
          </div>
          <LiveResultsClock />
        </div>
        <h3 className="text-sm font-black text-[#0F2744]">People</h3>
        <div className="grid gap-3 lg:grid-cols-3">
          {data.people.map((card, index) => {
            const meta = PEOPLE_META[index];
            return (
              <article key={card.label} className={`rounded-2xl border p-4 ${meta?.wrap || ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                    {meta?.icon}
                    {card.label}
                  </p>
                  <span className={`text-xs font-bold ${card.tone === "up" ? "text-[#16A34A]" : "text-slate-500"}`}>
                    {card.badge}
                  </span>
                </div>
                <p className="mt-2 text-4xl font-black text-[#0F2744]">{formatCount(card.value)}</p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Baseline</p>
                    <p className="text-xs font-semibold text-slate-600">{card.baseline}</p>
                    <p className="mt-2 text-xs font-bold text-[#0F2744]">{card.impact}</p>
                  </div>
                  <Bars values={card.weekly} color={card.color} />
                </div>
              </article>
            );
          })}
        </div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-sm font-black text-[#0F2744]">Social</h3>
          {canSyncMeta && manager ? <MetaSocialSyncControl /> : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {data.social.map((card) => {
            const verified = card.verifiedStatus === "connected" && card.verifiedFollowers !== null;
            const statusLabel = verified
              ? "Verified API"
              : card.verifiedStatus === "error"
                ? "Stale data"
                : card.verifiedStatus === "manual"
                  ? "Not verified"
                  : "Not connected";
            const updatedAt = card.verifiedAt ? Date.parse(card.verifiedAt) : NaN;
            return (
              <article key={card.label} className={`${DESK_UI.card} p-4`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-black uppercase tracking-wide" style={{ color: card.color }}>
                    {card.label}
                  </p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    verified ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    {statusLabel}
                  </span>
                </div>
                <p className="mt-3 text-[10px] font-black uppercase tracking-wide text-slate-400">Followers</p>
                <p className="mt-1 text-3xl font-black tabular-nums text-[#0F2744]">
                  {verified && card.verifiedFollowers !== null ? formatCount(card.verifiedFollowers) : "—"}
                </p>
                <p className="mt-1 min-h-8 text-[11px] font-semibold text-slate-500">
                  {verified
                    ? card.verifiedFollowerDelta === null
                      ? "Verified by official social API"
                      : `${card.verifiedFollowerDelta >= 0 ? "+" : ""}${formatCount(card.verifiedFollowerDelta)} since first verified sync`
                    : card.verifiedStatus === "error"
                      ? "The last verified sync is stale"
                      : "Official follower count unavailable"}
                </p>
                {card.accountLabel && (
                  <p className="truncate text-[11px] font-semibold text-slate-500">{card.accountLabel}</p>
                )}
                {verified && Number.isFinite(updatedAt) && (
                  <p className="mt-1 text-[10px] text-slate-400">
                    Synced {new Date(updatedAt).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "short", timeStyle: "short" })} ET
                  </p>
                )}
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-1">
                    <p className="text-[11px] font-bold text-slate-700">
                      {formatCount(card.value)} SitGuru visits / QR scans
                    </p>
                    <p className={`text-[10px] font-bold ${card.tone === "up" ? "text-[#16A34A]" : "text-slate-500"}`}>
                      {card.badge}
                    </p>
                  </div>
                  <Bars values={card.weekly} color={card.color} />
                  <p className="mt-1 text-[10px] font-medium text-slate-400">Public referrals, not platform impressions</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(220px,0.7fr)]">
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-[#0F2744]">New this week</h2>
            <Link href={`${base}/metrics`} className="text-xs font-bold text-[#2563EB]">
              View Details →
            </Link>
          </div>
          <div className="mt-2 flex gap-4 text-xs font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#22C55E]" /> Pet Parents</span>
            <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#3B82F6]" /> Gurus</span>
            <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#A855F7]" /> Ambassadors</span>
          </div>
          <WeekChart data={data} />
        </article>
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-[#0F2744]">Latest content</h2>
            <Link href={manager ? "/manager/content" : "/intern/work"} className="text-xs font-bold text-[#2563EB]">
              View All →
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {data.content.length ? (
              data.content.map((item) => (
                <li key={`${item.title}-${item.detail}`} className="flex gap-3">
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-xs font-black text-[#3730A3]">
                    {item.mark}
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-[#0F2744]">{item.title}</span>
                    <span className="text-xs font-medium text-slate-500">{item.detail}</span>
                  </span>
                </li>
              ))
            ) : (
              <li className="text-sm font-medium text-slate-500">No posts are on the content calendar yet.</li>
            )}
          </ul>
        </article>
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Quick Actions</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {actions.map((action) => (
              <Link key={action.label} href={action.href} className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl text-center text-sm font-bold ${action.tone}`}>
                <action.icon size={18} />
                {action.label}
              </Link>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function Bars({ values, color }: { values: readonly number[]; color: string }) {
  const max = Math.max(...values, 1);
  return (
    <span className="flex h-10 items-end gap-1" aria-hidden>
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className="w-1.5 rounded-sm"
          title={index === 0 ? `Last week ${value}` : `This week ${value}`}
          style={{ height: `${Math.max(12, (value / max) * 100)}%`, background: color }}
        />
      ))}
    </span>
  );
}

function WeekChart({ data }: { data: LiveResultsData }) {
  const series = [
    { color: "#22C55E", values: data.weeklyNew.petParents },
    { color: "#3B82F6", values: data.weeklyNew.gurus },
    { color: "#A855F7", values: data.weeklyNew.ambassadors },
  ];
  const max = Math.max(...series.flatMap((item) => [...item.values]), 1);
  const line = (points: readonly number[], color: string) => {
    const d = points
      .map((value, index) => {
        const x = points.length === 1 ? 160 : (index / (points.length - 1)) * 300 + 8;
        const y = 110 - (value / max) * 90;
        return `${index === 0 ? "M" : "L"}${x} ${y}`;
      })
      .join(" ");
    return <path d={d} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />;
  };
  return (
    <div className="mt-4">
      <svg viewBox="0 0 320 130" className="h-44 w-full" role="img" aria-label="New people last week and this week">
        {[20, 50, 80, 110].map((y) => (
          <line key={y} x1="8" x2="312" y1={y} y2={y} stroke="#E2E8F0" />
        ))}
        {series.map((item) => (
          <g key={item.color}>{line(item.values, item.color)}</g>
        ))}
      </svg>
      <div className="grid grid-cols-2 text-center text-[10px] font-semibold text-slate-400">
        <span>Last week</span>
        <span>This week</span>
      </div>
    </div>
  );
}
