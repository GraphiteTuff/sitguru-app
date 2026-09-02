import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  Megaphone,
  PawPrint,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { requireGrowthPortal } from "@/lib/admin/growth/access";
import { getPetParentSummary } from "@/lib/admin/customers/pet-parents";
import {
  getGrowthHomeStats,
  listGrowthCampaigns,
  listGrowthContent,
} from "@/lib/admin/growth/data";
import {
  GrowthCard,
  GrowthPageFrame,
  StatusPill,
} from "@/components/admin/growth/GrowthPageFrame";

export const dynamic = "force-dynamic";

function startOfWeek(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() - next.getDay());
  return next;
}

function ymd(date: Date) {
  return date.toISOString().slice(0, 10);
}

function prettyDay(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default async function AdminGrowthHomePage() {
  const access = await requireGrowthPortal();
  if (!access.ok) return access.ui;

  const [stats, campaigns, content, parents] = await Promise.all([
    getGrowthHomeStats(),
    listGrowthCampaigns(),
    listGrowthContent(),
    getPetParentSummary(),
  ]);

  const weekStart = startOfWeek();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return ymd(date);
  });
  const today = ymd(new Date());

  const calendarItems = new Map<string, { title: string; href: string; kind: string }[]>();
  for (const item of content) {
    const day = item.plannedDate?.slice(0, 10);
    if (!day) continue;
    const list = calendarItems.get(day) || [];
    list.push({ title: item.title, href: "/admin/growth/content", kind: item.platform });
    calendarItems.set(day, list);
  }
  const tiles = [
    { label: "Pet Parents +", value: String(stats.petParents), helper: "New this week" },
    { label: "Gurus +", value: String(stats.gurus), helper: "New this week" },
    { label: "Referral clicks", value: String(stats.referrals), helper: "Links used" },
    { label: "Social visits", value: String(stats.visits), helper: "Clicks + views" },
    { label: "Social signups", value: String(stats.signups), helper: "Attributed" },
    { label: "Conversion", value: stats.conversion, helper: "Signups ÷ visits" },
    { label: "Live campaigns", value: String(stats.campaigns), helper: "Ready to share" },
    { label: "Needs review", value: String(stats.pendingReview), helper: "Waiting on Jason" },
  ];

  const actions = [
    { href: "/admin/growth/create", label: "Create a post", detail: "Caption, tracking link, publish", icon: Plus, primary: true },
    { href: "/admin/growth/gurus", label: "Promote a Guru", detail: "Put a sitter in front of Pet Parents", icon: Users },
    { href: "/admin/growth/events", label: "Promote an event", detail: "Pack meetups and community", icon: CalendarDays },
    { href: "/admin/growth/campaigns", label: "Campaigns", detail: "Copy tracking links", icon: Megaphone },
    { href: "/admin/growth/content", label: "Content calendar", detail: "This week’s posts", icon: Sparkles },
    { href: "/admin/growth/analytics", label: "Friday report", detail: "Signups, not followers", icon: BarChart3 },
  ];

  const todayContent = content.filter((item) => item.plannedDate?.slice(0, 10) === today);
  const dueSoon = content.filter((item) => {
    const day = item.plannedDate?.slice(0, 10);
    return day && day >= today && day <= days[6];
  });

  return (
    <GrowthPageFrame
      kicker={access.actor.isSuperUser ? "Super Admin · Growth Workplace" : "Social & Community Workplace"}
      title="Turn SitGuru stories into Pet Parents."
      detail="This is the workbench. Create, post, and watch signups — not follower counts."
    >
      {parents.new24h > 0 ? (
        access.actor.isSuperUser ? (
          <Link
            href="/admin/customers#new"
            className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-4"
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-800">
                New Pet Parents
              </p>
              <p className="mt-1 text-sm font-black text-amber-950">
                {parents.new24h} registered in the last 24 hours
              </p>
            </div>
            <PawPrint className="h-6 w-6 text-amber-800" />
          </Link>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-800">
                New Pet Parents
              </p>
              <p className="mt-1 text-sm font-black text-amber-950">
                {parents.new24h} registered in the last 24 hours
              </p>
            </div>
            <PawPrint className="h-6 w-6 text-amber-800" />
          </div>
        )
      ) : null}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-[1.4rem] border border-emerald-100 bg-white p-4 shadow-sm"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
              {tile.label}
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">{tile.value}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{tile.helper}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={
                action.primary
                  ? "flex min-h-24 items-center gap-4 rounded-[1.6rem] px-5 py-4 text-white shadow-sm"
                  : "flex min-h-24 items-center gap-4 rounded-[1.6rem] border border-emerald-100 bg-white px-5 py-4 shadow-sm"
              }
              style={action.primary ? { background: "#0D5C3A" } : undefined}
            >
              <span
                className={
                  action.primary
                    ? "flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"
                    : "flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#0D5C3A]"
                }
              >
                <Icon size={26} />
              </span>
              <span>
                <span className={`block text-lg font-black ${action.primary ? "!text-white" : "text-slate-950"}`}>
                  {action.label}
                </span>
                <span className={`mt-1 block text-sm font-semibold ${action.primary ? "!text-white/85" : "text-slate-500"}`}>
                  {action.detail}
                </span>
              </span>
            </Link>
          );
        })}
      </section>

      <GrowthCard>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
              This week
            </p>
            <h2 className="text-lg font-black text-slate-950">Content calendar</h2>
          </div>
          <Link href="/admin/growth/content" className="text-sm font-black text-emerald-800">
            Open calendar →
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1">
          {days.map((day) => {
            const items = calendarItems.get(day) || [];
            const isToday = day === today;
            return (
              <div
                key={day}
                className={`min-h-[92px] rounded-xl border p-2 sm:min-h-[118px] ${
                  isToday
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-slate-100 bg-slate-50"
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                  {prettyDay(day).split(" ")[0]}
                </p>
                <p className="text-sm font-black text-slate-950">{Number(day.slice(8))}</p>
                <div className="mt-2 hidden space-y-1 sm:block">
                  {items.slice(0, 2).map((item) => (
                    <p key={`${day}-${item.title}`} className="truncate text-[10px] font-bold text-emerald-800">
                      {item.title}
                    </p>
                  ))}
                </div>
                {items.length ? (
                  <p className="mt-1 text-[10px] font-black text-emerald-700 sm:hidden">
                    {items.length}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
        {dueSoon.length === 0 ? (
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Nothing scheduled this week. Create a post and pick a day.
          </p>
        ) : null}
      </GrowthCard>

      <div className="grid gap-4 md:grid-cols-2">
        <GrowthCard>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">Today’s actions</h2>
            <StatusPill value={todayContent.length ? "On the board" : "Open"} />
          </div>
          <div className="mt-4 space-y-3">
            {todayContent.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <p className="font-black text-slate-950">{item.title}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {item.platform} · {item.status}
                </p>
              </div>
            ))}
            {stats.pendingReview > 0 ? (
              <Link
                href="/admin/growth/content"
                className="block rounded-2xl bg-amber-50 px-3 py-3 text-sm font-black text-amber-900"
              >
                {stats.pendingReview} posts waiting for review
              </Link>
            ) : null}
            {todayContent.length === 0 && stats.pendingReview === 0 ? (
              <p className="text-sm font-semibold text-slate-500">
                No posts due today. Promote a Guru or draft tomorrow’s caption.
              </p>
            ) : null}
          </div>
        </GrowthCard>

        <GrowthCard>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">Active campaigns</h2>
            <Link href="/admin/growth/campaigns" className="text-sm font-black text-emerald-800">
              All →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {campaigns.slice(0, 4).map((campaign) => (
              <Link
                key={campaign.id}
                href={`/admin/growth/campaigns/${campaign.id}`}
                className="block rounded-2xl border border-slate-100 bg-slate-50 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black text-slate-950">{campaign.name}</p>
                  <StatusPill value={campaign.status} />
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {campaign.channelLabel}
                  {campaign.market ? ` · ${campaign.market}` : ""}
                </p>
              </Link>
            ))}
            {campaigns.length === 0 ? (
              <p className="text-sm font-semibold text-slate-500">
                No campaigns yet. Create one and copy the tracking link.
              </p>
            ) : null}
          </div>
        </GrowthCard>
      </div>
    </GrowthPageFrame>
  );
}
