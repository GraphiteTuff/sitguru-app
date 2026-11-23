"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, ArrowUpRight, BarChart3, CalendarDays, CheckCircle2,
  ExternalLink, FileDown, MousePointerClick, RefreshCw,
  TrendingUp, Users, Video,
} from "lucide-react";
import type { SocialIntelligenceSnapshot, SocialPost } from "@/lib/social-intelligence/types";

type SeriesMetric = "pageViews" | "linkClicks" | "signupEvents" | "bookingEvents";
const TIME_WINDOWS = [
  ["last_7", "7 days"], ["last_28", "28 days"], ["last_90", "90 days"],
  ["this_month", "This month"], ["last_month", "Last month"],
];
const SOURCES = [
  ["all", "All networks"], ["facebook", "Facebook"], ["instagram", "Instagram"],
  ["tiktok", "TikTok"], ["x", "X"], ["youtube", "YouTube"],
];
const METRICS: Array<{ key: SeriesMetric; label: string }> = [
  { key: "pageViews", label: "Site visits" },
  { key: "linkClicks", label: "Clicks" },
  { key: "signupEvents", label: "Signup events" },
  { key: "bookingEvents", label: "Booking events" },
];
function fmt(value: number | null, unit = "") {
  if (value == null) return "—";
  return value.toLocaleString("en-US", { maximumFractionDigits: 1 }) + unit;
}
function changeLabel(current: number, prior: number) {
  if (!prior) return current ? "New activity" : "No change";
  const delta = ((current - prior) / prior) * 100;
  return (delta > 0 ? "+" : "") + delta.toFixed(1) + "% vs prior";
}
function graphPath(points: number[], width: number, height: number) {
  if (!points.length) return "";
  const limit = Math.max(...points, 1);
  return points.map((value, index) =>
    (index ? "L" : "M") + (12 + (width - 24) * index / Math.max(points.length - 1, 1)).toFixed(1) +
    " " + (height - 12 - (height - 30) * value / limit).toFixed(1)
  ).join(" ");
}
function LineChart({ values, caption }: { values: number[]; caption: string }) {
  const width = 650;
  const height = 176;
  return (
    <div role="img" aria-label={caption} className="w-full">
      <svg viewBox="0 0 650 176" preserveAspectRatio="none" className="h-40 w-full" aria-hidden="true">
        {[36, 90, 144].map((y) => (
          <line key={y} x1="12" x2="638" y1={y} y2={y} stroke="#CBD5E1" strokeDasharray="5 7" />
        ))}
        {values.length > 1 ? (
          <path d={graphPath(values, width, height)} stroke="#0D5C3A" fill="none" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        ) : values.length === 1 ? (
          <circle cx="12" cy={height - 12} r="5" fill="#0D5C3A" />
        ) : null}
      </svg>
    </div>
  );
}
function StatCard({
  label, value, detail, icon: Icon, href,
}: { label: string; value: string; detail: string; icon: typeof BarChart3; href?: string }) {
  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <Icon aria-hidden="true" size={18} className="shrink-0 text-emerald-800" />
      </div>
      <p className="mt-2 text-2xl font-black tabular-nums text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
      {href ? <Link href={href} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-700">Details <ArrowUpRight size={13} /></Link> : null}
    </article>
  );
}
function PostDetail({ post, onBack }: { post: SocialPost; onBack: () => void }) {
  const actions = [
    ["Views", fmt(post.metrics.views)], ["Reach", fmt(post.metrics.reach)],
    ["Likes", fmt(post.metrics.likes)], ["Comments", fmt(post.metrics.comments)],
    ["Shares", fmt(post.metrics.shares)], ["Saves", fmt(post.metrics.saves)],
    ["Follows", fmt(post.metrics.follows)], ["Hook rate", fmt(post.metrics.hookRate, "%")],
    ["Average watch", fmt(post.metrics.averageWatchSeconds, " sec")],
  ];
  return (
    <section className="space-y-4">
      <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900">
        <ArrowLeft size={17} /> All content
      </button>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-black uppercase tracking-wide text-emerald-800">{post.channel} · Published content</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">{post.title}</h2>
        <p className="mt-2 text-xs text-slate-500">Published: {post.publishedAt ? new Date(post.publishedAt).toLocaleString() : "Unknown"} · Metrics: {post.metrics.capturedAt ? new Date(post.metrics.capturedAt).toLocaleString() : "Not yet synced"}</p>
        {post.publishedUrl.startsWith("https://") ? (
          <a href={post.publishedUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-blue-700">View original post <ExternalLink size={14}/></a>
        ) : null}
      </div>
      <h3 className="text-lg font-black text-slate-950">Native platform insights</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {actions.map(([label, value]) => (
          <article key={label} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-bold text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
          </article>
        ))}
      </div>
      <article className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-black text-slate-900">Views across collected snapshots</h3>
        <p className="text-xs text-slate-500">A time series appears once the provider authorizes post insights and verified snapshots are recorded.</p>
        <LineChart values={post.daily.map((point) => point.views || 0)} caption="Verified platform view snapshots by collection date" />
        {post.daily.length ? <p className="text-xs text-slate-500">{post.daily.length} verified samples</p> : <p className="text-sm text-slate-600">Awaiting verified post-level analytics.</p>}
      </article>
      <h3 className="text-lg font-black text-slate-950">Business impact from this post</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="Site visits" value={fmt(post.impact.pageViews)} detail="Post-tagged page views" icon={BarChart3}/>
        <StatCard label="Link clicks" value={fmt(post.impact.linkClicks)} detail="Post-tagged clicks" icon={MousePointerClick}/>
        <StatCard label="Signups" value={fmt(post.impact.signupEvents)} detail="Attributed events" icon={Users}/>
        <StatCard label="Bookings" value={fmt(post.impact.bookingEvents)} detail="Tracked events, not paid" icon={CalendarDays}/>
      </div>
      <p className="text-sm text-slate-600">Individual post attribution requires a unique tracking key. When no matching tagged traffic exists, zeros mean no matched events—not proof that this post had no impact. Paid revenue remains unavailable until bookings and payments can be verified against the same attribution.</p>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/manager/campaigns-content" className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-800">Content Studio</Link>
        <Link href="/manager/insights" className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-800">Growth Center Insights</Link>
      </div>
    </section>
  );
}

export default function SocialIntelligenceBoard({ snapshot }: { snapshot: SocialIntelligenceSnapshot }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedMetric, setSelectedMetric] = useState<SeriesMetric>("pageViews");
  type LeaderboardKey = "views" | "clicks" | "shares" | "saves" | "engagement" | "follows" | "visits" | "signups" | "bookings";
  const [sort, setSort] = useState<LeaderboardKey>("views");
  const [limit, setLimit] = useState<10 | 25 | 0>(10);
  const LEADERBOARDS: Array<{ key: LeaderboardKey; label: string }> = [
    { key: "views", label: "Most watched" },
    { key: "clicks", label: "Most clicked" },
    { key: "shares", label: "Most shared" },
    { key: "saves", label: "Most saved" },
    { key: "engagement", label: "Most engaged" },
    { key: "follows", label: "Most follows" },
    { key: "visits", label: "Most site visits" },
    { key: "signups", label: "Most signups" },
    { key: "bookings", label: "Most booking events" },
  ];
  const score = (post: SocialPost, key: LeaderboardKey): number | null => {
    if (key === "views") return post.metrics.views;
    if (key === "shares") return post.metrics.shares;
    if (key === "saves") return post.metrics.saves;
    if (key === "follows") return post.metrics.follows;
    if (key === "clicks") return post.trackingKey ? post.impact.linkClicks : null;
    if (key === "visits") return post.trackingKey ? post.impact.pageViews : null;
    if (key === "signups") return post.trackingKey ? post.impact.signupEvents : null;
    if (key === "bookings") return post.trackingKey ? post.impact.bookingEvents : null;
    const values = [post.metrics.likes, post.metrics.comments, post.metrics.shares, post.metrics.saves];
    return values.every((value) => value == null) ? null : values.reduce<number>((sum, value) => sum + (value || 0), 0);
  };
  const [loading, transition] = useTransition();
  const selected = useMemo(() => snapshot.posts.find((post) => post.id === searchParams.get("post")), [snapshot.posts, searchParams]);

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", "social-intelligence");
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    if (key !== "post") params.delete("post");
    transition(() => router.push(pathname + "?" + params.toString()));
  }
  function makeExportUrl() {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("view");
    p.delete("post");
    return "/api/social-intelligence/export?" + p.toString();
  }
  const sorted = [...snapshot.posts].sort((a, b) => {
    const left = score(a, sort);
    const right = score(b, sort);
    return (right ?? -1) - (left ?? -1);
  });
  const leaderboardRows = limit ? sorted.slice(0, limit) : sorted;
  const leaderboardTitle = LEADERBOARDS.find((item) => item.key === sort)?.label || "Content performance";

  return (
    <main className="space-y-5 pb-10">
      <header className="rounded-2xl bg-[#0D5C3A] p-5 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">SitGuru · Growth Center Insights</p>
        <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">Social Intelligence</h1>
        <p className="mt-1 max-w-3xl text-sm text-emerald-50">Meta-style content performance, first-party site activity, and campaign-level business attribution in one dashboard.</p>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap gap-2">
          <Link href="/manager/metrics" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800">Growth Center overview</Link>
          <Link href="/manager/campaigns-content" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800">Content Studio</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={makeExportUrl()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800"><FileDown size={16} /> Export CSV</a>
          <button type="button" onClick={() => router.refresh()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0D5C3A] px-3 py-2 text-sm font-bold text-white"><RefreshCw size={16}/> Refresh</button>
        </div>
      </div>
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <label className="space-y-1 text-xs font-black text-slate-600">Reporting period
          <select value={snapshot.preset} onChange={(event) => setFilter("preset", event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900">
            {TIME_WINDOWS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-xs font-black text-slate-600">Social platform
          <select value={snapshot.platform} onChange={(event) => setFilter("platform", event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900">
            {SOURCES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-xs font-black text-slate-600">Audience
          <select value={snapshot.audience} onChange={(event) => setFilter("audience", event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900">
            {[["all","All audiences"],["guru","Gurus"],["pet_parent","Pet Parents"],["ambassador","Ambassadors"],["community","Community"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>
      <p className="text-xs font-semibold text-slate-500">{snapshot.rangeLabel} · Latest SitGuru snapshot: {new Date(snapshot.capturedAt).toLocaleString()} · Social metrics are provider snapshots; site metrics are first-party activity.</p>

      {selected ? <PostDetail post={selected} onBack={() => setFilter("post","")}/> : (
        <>
          <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
            <StatCard label="Post views" value={fmt(snapshot.postViews)} detail={snapshot.postMetricsAt ? "Last synced " + new Date(snapshot.postMetricsAt).toLocaleDateString() : "Provider insights not synced"} icon={Video}/>
            <StatCard label="Site visits" value={fmt(snapshot.total.pageViews)} detail={changeLabel(snapshot.total.pageViews, snapshot.prior.pageViews)} icon={BarChart3}/>
            <StatCard label="Link clicks" value={fmt(snapshot.total.linkClicks)} detail={changeLabel(snapshot.total.linkClicks, snapshot.prior.linkClicks)} icon={MousePointerClick}/>
            <StatCard label="Signup events" value={fmt(snapshot.total.signupEvents)} detail={changeLabel(snapshot.total.signupEvents, snapshot.prior.signupEvents)} icon={Users}/>
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-2">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Content-to-SitGuru activity</h2>
                  <p className="text-xs text-slate-500">Date-filtered first-party events. Not social-platform views.</p>
                </div>
                <select value={selectedMetric} onChange={(event) => setSelectedMetric(event.target.value as SeriesMetric)} aria-label="Chart metric" className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900">
                  {METRICS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
              </div>
              <LineChart values={snapshot.daily.map((item) => item[selectedMetric])} caption="Daily SitGuru tracked " />
              <div className="flex justify-between text-xs text-slate-500">
                <span>{snapshot.daily[0]?.date || "Start"}</span>
                <span>{snapshot.daily.at(-1)?.date || "End"}</span>
              </div>
            </section>
            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-black text-slate-900">Business impact</h2>
              <div><p className="text-xs text-slate-500">Tracked booking events</p><p className="text-3xl font-black text-slate-950">{fmt(snapshot.total.bookingEvents)}</p></div>
              <div><p className="text-xs text-slate-500">Verified paid bookings</p><p className="text-2xl font-black text-slate-950">—</p></div>
              <div><p className="text-xs text-slate-500">Attributed net revenue</p><p className="text-2xl font-black text-slate-950">—</p></div>
              <p className="text-xs text-slate-500">Revenue and verified bookings will populate after attributed post, booking, and payment IDs are connected. No estimates are shown as facts.</p>
            </section>
          </div>
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-black text-slate-900">Connected channels</h2>
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
              {snapshot.channels.map((item) => (
                <button type="button" onClick={() => setFilter("platform",item.channel)} key={item.channel} className="min-h-24 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-emerald-400">
                  <p className="font-black capitalize text-slate-900">{item.channel}</p>
                  <p className="text-xs font-semibold text-slate-600">Followers: {fmt(item.followers)}</p>
                  <p className="text-xs text-slate-500">{item.status.replaceAll("_"," ")} · {item.impact.pageViews} site views</p>
                </button>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><h2 className="text-lg font-black text-slate-900">Content leaderboards · {leaderboardTitle}</h2><p className="text-xs text-slate-500">Rank verified content results, then open each post for a detailed performance history and attributable SitGuru activity.</p></div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600">Show
                <select value={limit} onChange={(event) => setLimit(Number(event.target.value) as 10 | 25 | 0)} className="min-h-10 rounded-xl border border-slate-200 px-2 text-sm">
                  <option value="10">Top 10</option><option value="25">Top 25</option><option value="0">All posts</option>
                </select>
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Choose content ranking">
              {LEADERBOARDS.map((board) => (
                <button type="button" key={board.key} onClick={() => setSort(board.key)} aria-pressed={sort === board.key}
                  className={`min-h-10 rounded-xl border px-3 py-2 text-xs font-bold ${sort === board.key ? "border-emerald-800 bg-[#0D5C3A] text-white" : "border-slate-200 bg-white text-slate-700"}`}>
                  {board.label}
                </button>
              ))}
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead><tr className="border-b border-slate-200 text-xs uppercase text-slate-500"><th className="p-3">Rank</th><th className="p-3">Post</th><th className="p-3">Platform</th><th className="p-3">{leaderboardTitle}</th><th className="p-3">Views</th><th className="p-3">Site visits</th><th className="p-3">Published</th><th className="p-3">Details</th></tr></thead>
                <tbody>{leaderboardRows.map((post, index) => (
                  <tr key={post.id} className="border-b border-slate-100">
                    <td className="p-3 text-slate-500">{index + 1}</td>
                    <td className="max-w-[220px] truncate p-3 font-semibold text-slate-900">{post.title}</td>
                    <td className="p-3 capitalize text-slate-700">{post.channel}</td>
                    <td className="p-3 font-black tabular-nums text-emerald-900">{fmt(score(post, sort))}</td>
                    <td className="p-3 tabular-nums">{fmt(post.metrics.views)}</td>
                    <td className="p-3 tabular-nums">{post.trackingKey ? fmt(post.impact.pageViews) : "—"}</td>
                    <td className="p-3 text-xs text-slate-600">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "—"}</td>
                    <td className="p-3"><button type="button" onClick={() => setFilter("post",post.id)} className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-3 py-2 text-xs font-bold text-emerald-900">Open <ArrowUpRight size={14}/></button></td>
                  </tr>
                ))}</tbody>
              </table>
              {!sorted.length ? <p className="py-6 text-center text-sm text-slate-600">No published posts are cataloged for these filters yet. Once SitGuru publishes or connects its official post IDs, performance will appear here.</p> : null}
              {sorted.length && sorted.every((post) => score(post, sort) == null) ? <p className="py-3 text-xs font-semibold text-amber-800">No verified {leaderboardTitle.toLowerCase()} data yet. A dash means unavailable, not zero. Provider permissions or tracked post links may be required.</p> : null}
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-black text-slate-900">Campaign drill-downs</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setFilter("campaign","")} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold">All campaigns</button>
              {snapshot.campaigns.map((campaign) => (
                <button type="button" key={campaign.slug} onClick={() => setFilter("campaign",campaign.slug)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">{campaign.label} · {campaign.impact.pageViews} site views</button>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-black text-slate-900">Data coverage and accuracy</h2>
            <p className="mt-1 text-xs text-slate-500">Tracked events loaded: {snapshot.sourceCoverage.eventsLoaded.toLocaleString()} · Matched post events: {snapshot.sourceCoverage.matchedPostEvents} · Provider metric freshness: {snapshot.postMetricsAt || "Unavailable"}</p>
            {snapshot.notices.length ? <div className="mt-3 space-y-2">{snapshot.notices.map((notice) => <p key={notice} className="rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-600">{notice}</p>)}</div> : (
              <p className="mt-3 flex items-center gap-2 text-sm text-emerald-800"><CheckCircle2 size={16}/> All verified sources are current.</p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
