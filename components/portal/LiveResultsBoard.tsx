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
import { DESK_UI } from "@/lib/portal/desk-ui";

const PEOPLE = [
  {
    label: "Pet Parents",
    value: "36",
    delta: "+12%",
    baseline: "Greater Philadelphia",
    impact: "+36 new Pet Parents",
    bars: [8, 10, 12, 14, 18, 22, 28, 36],
    color: "#22C55E",
    wrap: "border-emerald-100 bg-[#F0FDF4]",
    icon: <Users size={18} />,
  },
  {
    label: "Gurus",
    value: "80",
    delta: "+25%",
    baseline: "64 can take bookings",
    impact: "+80 new Gurus",
    bars: [12, 18, 24, 30, 40, 52, 66, 80],
    color: "#3B82F6",
    wrap: "border-sky-100 bg-[#EFF6FF]",
    icon: <PawPrint size={18} />,
  },
  {
    label: "Ambassadors",
    value: "9",
    delta: "+18%",
    baseline: "Greater Philadelphia",
    impact: "+9 new Ambassadors",
    bars: [2, 3, 3, 4, 5, 6, 7, 9],
    color: "#A855F7",
    wrap: "border-violet-100 bg-[#F5F3FF]",
    icon: <Megaphone size={18} />,
  },
] as const;

const SOCIAL = [
  { label: "Facebook", value: "2,150", delta: "+32%", color: "#2563EB", bars: [20, 28, 36, 48, 60, 78, 96, 120] },
  { label: "Instagram", value: "3,480", delta: "+28%", color: "#EC4899", bars: [24, 36, 48, 70, 90, 120, 150, 180] },
  { label: "TikTok", value: "6,210", delta: "+45%", color: "#0F2744", bars: [18, 40, 70, 100, 140, 180, 220, 260] },
  { label: "X", value: "420", delta: "+18%", color: "#111827", bars: [8, 10, 12, 14, 16, 18, 20, 24] },
  { label: "YouTube", value: "190", delta: "+22%", color: "#DC2626", bars: [4, 6, 8, 10, 12, 14, 16, 19] },
] as const;

const CONTENT = [
  { title: "Howl-ween Lifestyle Reel", detail: "6.2K views · 420 likes · 85 shares", mark: "TT" },
  { title: "Community Event Announcement", detail: "3.1K reach · 210 likes · 28 shares", mark: "IG" },
  { title: "Pet Parent Tips Video", detail: "2.8K reach · 190 likes · 34 shares", mark: "IG" },
] as const;

export default function LiveResultsBoard({ audience }: { audience: "manager" | "intern" }) {
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
      <DeskPageHero
        icon={<LineChart size={22} />}
        title="Live Results"
        subtitle={
          manager
            ? "Track live SitGuru growth from content, campaigns, and community work."
            : "Track real SitGuru results from your content, campaigns, and community growth."
        }
        quote={"Same people.\nHappier pets.\nBigger impact.®"}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-emerald-100 bg-[#F0FDF4] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#166534]">This week</p>
          <p className="mt-2 flex items-center gap-2 text-lg font-black text-[#166534]">
            <CheckCircle2 size={18} /> {manager ? "Review" : "Due"}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-600">
            {manager ? "Check-ins waiting on you" : "Complete your weekly check-in"}
          </p>
          <Link href={`${base}/check-ins`} className="mt-2 inline-flex text-xs font-bold text-[#166534]">
            {manager ? "Review now →" : "Open check-in →"}
          </Link>
        </article>
        <article className="rounded-2xl border border-violet-100 bg-[#F5F3FF] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#6D28D9]">This week</p>
          <p className="mt-2 flex items-center gap-2 text-3xl font-black text-[#6D28D9]">
            <ClipboardList size={18} /> 0
          </p>
          <p className="mt-1 text-sm font-medium text-slate-600">2 upcoming · 19 later</p>
        </article>
        <article className="rounded-2xl border border-amber-100 bg-[#FFFBEB] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#B45309]">Total reach</p>
          <p className="mt-2 text-3xl font-black text-[#0F2744]">
            12,450 <span className="text-sm font-bold text-[#16A34A]">+28%</span>
          </p>
          <p className="mt-1 text-sm font-medium text-slate-600">Across all platforms this month</p>
        </article>
        <article className="rounded-2xl border border-rose-100 bg-[#FFF1F2] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#BE123C]">Total posts</p>
          <p className="mt-2 flex items-center gap-2 text-3xl font-black text-[#0F2744]">
            <Share2 size={18} className="text-[#E11D48]" /> 28{" "}
            <span className="text-sm font-bold text-[#16A34A]">+12%</span>
          </p>
          <p className="mt-1 text-sm font-medium text-slate-600">Posts created or scheduled</p>
        </article>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-[#2563EB]">Live SitGuru Results</p>
            <h2 className="text-2xl font-black text-[#0F2744]">Growth vs Starting Numbers</h2>
            <p className="text-sm font-medium text-slate-500">Live totals for people and social. No customer names.</p>
          </div>
          <LiveResultsClock />
        </div>
        <h3 className="text-sm font-black text-[#0F2744]">People</h3>
        <div className="grid gap-3 lg:grid-cols-3">
          {PEOPLE.map((card) => (
            <article key={card.label} className={`rounded-2xl border p-4 ${card.wrap}`}>
              <div className="flex items-center justify-between">
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                  {card.icon}
                  {card.label}
                </p>
                <span className="text-xs font-bold text-[#16A34A]">{card.delta}</span>
              </div>
              <p className="mt-2 text-4xl font-black text-[#0F2744]">{card.value}</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Baseline</p>
                  <p className="text-xs font-semibold text-slate-600">{card.baseline}</p>
                  <p className="mt-2 text-xs font-bold text-[#0F2744]">{card.impact}</p>
                </div>
                <Bars values={card.bars} color={card.color} />
              </div>
            </article>
          ))}
        </div>
        <h3 className="text-sm font-black text-[#0F2744]">Social</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {SOCIAL.map((card) => (
            <article key={card.label} className={`${DESK_UI.card} p-4`}>
              <p className="text-xs font-black uppercase tracking-wide" style={{ color: card.color }}>
                {card.label}
              </p>
              <p className="mt-1 text-2xl font-black text-[#0F2744]">
                {card.value} <span className="text-xs font-bold text-[#16A34A]">{card.delta}</span>
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase text-slate-400">Baseline</p>
              <Bars values={card.bars} color={card.color} />
              <p className="mt-2 text-[11px] font-medium text-slate-500">Public visits and QR scans</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(220px,0.7fr)]">
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-[#0F2744]">Audience Growth Trend</h2>
            <Link href={`${base}/metrics`} className="text-xs font-bold text-[#2563EB]">
              View Details →
            </Link>
          </div>
          <div className="mt-2 flex gap-4 text-xs font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#22C55E]" /> Pet Parents</span>
            <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#3B82F6]" /> Gurus</span>
            <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#A855F7]" /> Ambassadors</span>
          </div>
          <TrendChart />
        </article>
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-[#0F2744]">Top Performing Content</h2>
            <Link href={manager ? "/manager/content" : "/intern/work"} className="text-xs font-bold text-[#2563EB]">
              View All →
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {CONTENT.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-xs font-black text-[#3730A3]">
                  {item.mark}
                </span>
                <span>
                  <span className="block text-sm font-bold text-[#0F2744]">{item.title}</span>
                  <span className="text-xs font-medium text-slate-500">{item.detail}</span>
                </span>
              </li>
            ))}
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
          style={{ height: `${Math.max(12, (value / max) * 100)}%`, background: color }}
        />
      ))}
    </span>
  );
}

function TrendChart() {
  const parents = [18, 24, 30, 40, 52, 64, 78, 96];
  const gurus = [22, 30, 38, 48, 58, 70, 84, 100];
  const ambassadors = [8, 12, 16, 22, 28, 36, 44, 52];
  const labels = ["Jan 12", "Jan 26", "Feb 9", "Feb 23", "Mar 9", "Mar 23", "Apr 6", "Apr 20"];
  const line = (points: number[], color: string) => {
    const d = points
      .map((value, index) => {
        const x = (index / (points.length - 1)) * 300 + 8;
        const y = 110 - value;
        return `${index === 0 ? "M" : "L"}${x} ${y}`;
      })
      .join(" ");
    return <path d={d} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />;
  };
  return (
    <div className="mt-4">
      <svg viewBox="0 0 320 130" className="h-44 w-full">
        {[20, 50, 80, 110].map((y) => (
          <line key={y} x1="8" x2="312" y1={y} y2={y} stroke="#E2E8F0" />
        ))}
        {line(parents, "#22C55E")}
        {line(gurus, "#3B82F6")}
        {line(ambassadors, "#A855F7")}
      </svg>
      <div className="grid grid-cols-8 text-center text-[10px] font-semibold text-slate-400">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}
