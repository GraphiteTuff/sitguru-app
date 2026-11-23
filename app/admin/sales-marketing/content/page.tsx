import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  FileText,
  ImageIcon,
  Megaphone,
  PawPrint,
  ShieldCheck,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";

import { getAdminIdentity } from "@/lib/admin/access";
import { canUseGrowthPortal } from "@/lib/admin/growth/access";
import { loadManagerContentStudio } from "@/lib/internship/content-studio-actions";
import { studioRowLabel, studioSummary } from "@/lib/internship/content-studio";
import { resolveDateRange } from "@/lib/growth-center-v2/date-range";
import { loadSocialIntelligenceSnapshot } from "@/lib/social-intelligence/dashboard";
import type { SocialPost } from "@/lib/social-intelligence/types";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type LegacyContent = {
  id: string;
  title: string | null;
  platform: string | null;
  audience: string | null;
  campaign: string | null;
  status: string | null;
  planned_date: string | null;
  caption_direction: string | null;
  asset_needed: string | null;
  ceo_review: string | null;
  performance_note: string | null;
  owner_name: string | null;
  updated_at: string | null;
};

type Tone = "blue" | "amber" | "green" | "violet" | "teal" | "slate";

const toneStyles: Record<Tone, { surface: string; number: string; icon: string }> = {
  blue: {
    surface: "border-[#DBEAFE] bg-[#EFF6FF]",
    number: "text-[#1D4ED8]",
    icon: "bg-[#DBEAFE] text-[#1D4ED8]",
  },
  amber: {
    surface: "border-[#FFEDD5] bg-[#FFF4ED]",
    number: "text-[#C2410C]",
    icon: "bg-[#FFEDD5] text-[#C2410C]",
  },
  green: {
    surface: "border-[#DCFCE7] bg-[#F0FDF4]",
    number: "text-[#166534]",
    icon: "bg-[#DCFCE7] text-[#166534]",
  },
  violet: {
    surface: "border-[#EDE9FE] bg-[#F5F3FF]",
    number: "text-[#6D28D9]",
    icon: "bg-[#EDE9FE] text-[#6D28D9]",
  },
  teal: {
    surface: "border-[#CCFBF1] bg-[#F0FDFA]",
    number: "text-[#0F766E]",
    icon: "bg-[#CCFBF1] text-[#0F766E]",
  },
  slate: {
    surface: "border-[#E2E8F0] bg-[#F8FAFC]",
    number: "text-[#0F2744]",
    icon: "bg-[#E2E8F0] text-[#0F2744]",
  },
};

function MetricTile({
  title, value, detail, icon: Icon, tone,
}: {
  title: string;
  value: number;
  detail: string;
  icon: LucideIcon;
  tone: Tone;
}) {
  const visual = toneStyles[tone];
  return (
    <article className={"min-w-0 rounded-2xl border p-4 shadow-[0_6px_20px_rgba(15,39,68,0.04)] " + visual.surface}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-wide text-[#0F2744]">{title}</p>
        <span className={"inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full " + visual.icon}>
          <Icon size={17} aria-hidden="true" />
        </span>
      </div>
      <p className={"mt-2 text-3xl font-black tabular-nums " + visual.number}>
        {value.toLocaleString("en-US")}
      </p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
    </article>
  );
}

function labelDate(value: string | null | undefined) {
  if (!value) return "Date not recorded";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Date not recorded";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function numberOrDash(value: number | null | undefined) {
  return value == null ? "—" : value.toLocaleString("en-US");
}

function trustedSocialHref(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    if (
      url.protocol === "https:" &&
      ["facebook.com", "instagram.com", "m.facebook.com"].includes(hostname)
    ) {
      return url.toString();
    }
  } catch {
    // Refuse invalid or untrusted destinations from provider metadata.
  }
  return null;
}

function FeedPost({ post }: { post: SocialPost }) {
  const facebook = post.channel === "facebook";
  const externalUrl = trustedSocialHref(post.publishedUrl);
  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_6px_20px_rgba(15,39,68,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={"rounded-full px-3 py-1 text-xs font-black " +
          (facebook ? "bg-[#EFF6FF] text-[#1D4ED8]" : "bg-[#F5F3FF] text-[#6D28D9]")}>
          {facebook ? "Facebook" : "Instagram"}
        </span>
        <span className="text-xs font-semibold text-slate-500">{labelDate(post.publishedAt)}</span>
      </div>
      <h3 className="mt-3 line-clamp-2 text-sm font-black text-[#0F2744]">{post.title || "Published SitGuru content"}</h3>
      <p className="mt-1 text-xs text-slate-600">
        {post.studioContentId ? "Linked to Content Studio" : "Published through Meta · not linked to a creator"}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-[#F8FAFC] p-3 text-center">
        <div>
          <p className="text-lg font-black tabular-nums text-[#0F2744]">{numberOrDash(post.metrics.views)}</p>
          <p className="text-[11px] font-semibold text-slate-600">Views</p>
        </div>
        <div>
          <p className="text-lg font-black tabular-nums text-[#0F2744]">{numberOrDash(post.metrics.likes)}</p>
          <p className="text-[11px] font-semibold text-slate-600">Likes</p>
        </div>
        <div>
          <p className="text-lg font-black tabular-nums text-[#0F2744]">{numberOrDash(post.metrics.comments)}</p>
          <p className="text-[11px] font-semibold text-slate-600">Comments</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={"/admin/growth/social-intelligence?preset=last_90&post=" + encodeURIComponent(post.id)}
          className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-[#D1EADD] bg-[#F0FDF4] px-3 py-2 text-xs font-black text-[#0D5C3A] hover:bg-[#DCFCE7]"
        >
          Insights <BarChart3 size={14} aria-hidden="true" />
        </Link>
        {externalUrl ? (
          <a href={externalUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-[#EEF2F6] px-3 py-2 text-xs font-bold text-[#0F2744] hover:bg-[#DBEAFE]">
            Open post <ExternalLink size={13} aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </article>
  );
}

function DestinationCard({
  href, title, description, icon: Icon, featured = false,
}: {
  href: string; title: string; description: string;
  icon: LucideIcon; featured?: boolean;
}) {
  return (
    <Link href={href} className={
      "group flex min-w-0 gap-3 rounded-2xl border p-4 shadow-[0_5px_18px_rgba(15,39,68,0.04)] transition hover:-translate-y-0.5 hover:shadow-md " +
      (featured ? "border-[#DBEAFE] bg-[#EFF6FF]" : "border-slate-200 bg-white")
    }>
      <span className={"inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " +
        (featured ? "bg-[#2563EB] text-white" : "bg-[#F0FDF4] text-[#0D5C3A]")}>
        <Icon size={19} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-black text-[#0F2744]">{title}</p>
        <p className="mt-1 text-xs font-medium leading-5 text-slate-600">{description}</p>
      </div>
      <ArrowUpRight size={16} className="shrink-0 text-[#2563EB] group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}

export default async function SalesMarketingContentPage() {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) redirect("/admin/login");
  // A general Admin HQ login does not grant access to Sales & Marketing content.
  if (!actor.isSuperUser && !actor.modules.growth_marketing && !actor.modules.social_media) {
    redirect("/admin");
  }

  // Admin content is an oversight surface, never a third approval pipeline.
  // Manager/intern content remains governed by the existing assignment rules.
  const canSeeStudio = canUseGrowthPortal(actor);
  const [legacyResult, studio, social] = await Promise.all([
    supabaseAdmin.from("admin_marketing_content_calendar")
      .select("id,title,platform,audience,campaign,status,planned_date,caption_direction,asset_needed,ceo_review,performance_note,owner_name,updated_at")
      .order("updated_at", { ascending: false })
      .limit(30),
    canSeeStudio ? loadManagerContentStudio(actor.id, actor.isSuperUser) : Promise.resolve(null),
    actor.isSuperUser
      ? loadSocialIntelligenceSnapshot({ filters: resolveDateRange({ preset: "last_90" }) })
      : Promise.resolve(null),
  ]);

  const legacy = (legacyResult.data || []) as LegacyContent[];
  const summary = studio?.summary || studioSummary([]);
  const studioItems = studio?.items || [];
  const importedPosts = (social?.posts || []).filter(
    (post) => post.channel === "facebook" || post.channel === "instagram",
  ).sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || "")).slice(0, 6);
  const facebook = social?.metaSync.find((entry) => entry.platform === "facebook");
  const instagram = social?.metaSync.find((entry) => entry.platform === "instagram");
  const faceFollower = social?.channels.find((entry) => entry.channel === "facebook");

  return (
    <main className="min-h-screen min-w-0 bg-[#F4F7FB] px-3 py-5 text-[#0F2744] sm:px-5 lg:px-7">
      <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-5">
        <div role="banner" className="on-dark-surface rounded-[1.6rem] p-5 shadow-[0_12px_32px_rgba(15,39,68,0.14)] sm:p-7"
          style={{ background: "linear-gradient(112deg,#0F2744 0%,#164B61 48%,#0D5C3A 100%)", color: "#FFFFFF" }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] !text-emerald-100">
                <PawPrint size={16} aria-hidden="true" /> SitGuru · Admin HQ · Sales & Marketing
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight !text-white sm:text-4xl">
                Content Hub
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold !text-emerald-50 sm:text-base">
                One view of content planning, Ava's review workflow, published posts, and measurable growth.
              </p>
            </div>
            <span className="rounded-full border border-white/25 bg-white/15 px-3 py-2 text-xs font-black !text-white">
              Read-only administration
            </span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/admin/sales-marketing"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-black text-[#0F2744] hover:bg-[#EFF6FF]">
              <ArrowLeft size={15} aria-hidden="true" /> Sales & Marketing
            </Link>
            {canSeeStudio ? (
              <Link href="/admin/growth/content"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-3 py-2 text-sm font-black !text-white hover:bg-white/25">
                Open approvals <ClipboardCheck size={15} aria-hidden="true" />
              </Link>
            ) : null}
            {actor.isSuperUser ? (
              <Link href="/admin/growth/social-intelligence?preset=last_90"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-3 py-2 text-sm font-black !text-white hover:bg-white/25">
                Social Intelligence <BarChart3 size={15} aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </div>

        <section aria-labelledby="hub-metrics-title" className="space-y-3">
          <div>
            <h2 id="hub-metrics-title" className="text-xl font-black text-[#0F2744]">Content operations overview</h2>
            <p className="mt-1 text-sm text-slate-600">Live records from existing SitGuru systems. Scheduled and approved statuses may overlap.</p>
          </div>
          {canSeeStudio ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <MetricTile title="Studio drafts" value={summary.drafts} detail="Intern-created, not submitted" icon={FileText} tone="blue" />
              <MetricTile title="Ava review" value={summary.pending} detail="Awaiting manager review" icon={Clock3} tone="amber" />
              <MetricTile title="CEO escalations" value={summary.escalated} detail="Need leadership decision" icon={ShieldCheck} tone="violet" />
              <MetricTile title="Scheduled" value={summary.scheduled} detail="Approved with planned date" icon={CalendarDays} tone="teal" />
              <MetricTile title="Published links" value={summary.published} detail="Recorded in Content Studio" icon={CheckCircle2} tone="green" />
              {social ? (
                <MetricTile title="Meta imports" value={(facebook?.importedPosts || 0) + (instagram?.importedPosts || 0)}
                  detail="Provider posts, not new Studio drafts" icon={Video} tone="slate" />
              ) : (
                <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-[#0F2744]">Meta performance</p>
                  <p className="mt-2 text-sm font-semibold text-slate-600">Open authorized Manager Insights for your post metrics.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              Content Studio metrics are restricted to the assigned growth team and super administrators. The historical planning notes remain available below.
            </div>
          )}
        </section>

        <section aria-labelledby="hub-workflows-title" className="space-y-3">
          <h2 id="hub-workflows-title" className="text-xl font-black text-[#0F2744]">Your connected workspaces</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {canSeeStudio ? (
              <>
                <DestinationCard href="/admin/growth/content" title="Content approvals"
                  description="Review intern drafts, manager approvals and CEO escalations. Uses the existing workflow." icon={ClipboardCheck} featured />
                <DestinationCard href="/manager/campaigns-content" title="Manager Content Studio"
                  description="Ava's existing publishing and approval workspace; no duplicate workflow." icon={Users} />
              </>
            ) : null}
            {actor.isSuperUser ? (
              <DestinationCard href="/admin/growth/social-intelligence?preset=last_90" title="Social Intelligence"
                description="Verified Facebook and Instagram content, rankings, link clicks, and attributed events." icon={BarChart3} featured />
            ) : canSeeStudio ? (
              <DestinationCard href="/manager/metrics?view=social-intelligence&preset=last_90" title="Manager Social Intelligence"
                description="Open your authorized team social performance, recent posts and growth results." icon={BarChart3} featured />
            ) : null}
            {actor.isSuperUser ? (
              <DestinationCard href="/admin/growth/guru-match" title="Guru Match & Share"
                description="See Guru outreach, unique QR scans, profile clicks and manually reported shares." icon={PawPrint} featured />
            ) : canSeeStudio ? (
              <DestinationCard href="/manager/community-studio/guru-match" title="Guru Match & Share"
                description="Match local Gurus and prepare approved social reply cards." icon={PawPrint} featured />
            ) : null}
            <DestinationCard href="/admin/growth/reads" title="Reads & Media"
              description="SitGuru community stories, media and approved editorial resources." icon={ImageIcon} />
          </div>
        </section>

        {canSeeStudio ? (
          <section aria-labelledby="hub-review-title" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="hub-review-title" className="text-lg font-black text-[#0F2744]">Latest Content Studio activity</h2>
                <p className="mt-1 text-xs font-medium text-slate-600">Live assigned-team items. Actions and notifications remain in Content Studio.</p>
              </div>
              <Link href="/admin/growth/content"
                className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-black text-white hover:bg-[#1D4ED8]">
                Review queue <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-4 divide-y divide-slate-100">
              {studioItems.slice(0, 6).map((item) => {
                const labels = studioRowLabel(item);
                return (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-[#0F2744]">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-600">{item.internName} · {item.platform || "Platform not selected"} · {labels.status}</p>
                    </div>
                    <Link href={"/admin/growth/content?content=" + encodeURIComponent(item.id)}
                      className="inline-flex min-h-10 items-center rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-2 text-xs font-black text-[#1D4ED8] hover:bg-[#DBEAFE]">
                      View record
                    </Link>
                  </div>
                );
              })}
              {!studioItems.length ? (
                <p className="py-4 text-sm text-slate-600">No assigned Content Studio submissions yet. New intern submissions will appear here automatically.</p>
              ) : null}
            </div>
          </section>
        ) : null}

        {actor.isSuperUser && social ? (
          <section aria-labelledby="hub-meta-title" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="hub-meta-title" className="text-xl font-black text-[#0F2744]">Published Facebook &amp; Instagram content</h2>
                <p className="mt-1 text-sm text-slate-600">Verified official-account imports for the last 90 days, not duplicated into the approval queue.</p>
              </div>
              <Link href="/admin/growth/social-intelligence?preset=last_90"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-black text-white hover:bg-[#1D4ED8]">
                Open analytics &amp; sync posts <BarChart3 size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-[#DBEAFE] bg-[#EFF6FF] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-[#0F2744]">Facebook · SitGuru Page</p>
                  <span className={"rounded-full px-3 py-1 text-xs font-black " +
                    (facebook?.status === "success" ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FFF0DF] text-[#9A3412]")}>
                    {facebook?.status === "success" ? "Posts imported" : "Post import needs attention"}
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold text-slate-700">
                  {numberOrDash(faceFollower?.followers)} followers (latest available) · {facebook?.importedPosts || 0} imported posts
                </p>
                <p className="mt-1 text-xs text-slate-600">Follower reporting and published-post API access are separate. An active follower feed does not confirm post permissions.</p>
              </div>
              <div className="rounded-2xl border border-[#EDE9FE] bg-[#F5F3FF] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-[#0F2744]">Instagram · SitGuru</p>
                  <span className={"rounded-full px-3 py-1 text-xs font-black " +
                    (instagram?.status === "success" ? "bg-[#DCFCE7] text-[#166534]" : "bg-white text-[#475569]")}>
                    {instagram?.status === "success" ? "Posts imported" : "Awaiting import"}
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold text-slate-700">{instagram?.importedPosts || 0} imported posts</p>
                <p className="mt-1 text-xs text-slate-600">Content published through Meta is displayed here, but individual creator attribution requires a linked Studio record.</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {importedPosts.map((post) => <FeedPost key={post.id} post={post} />)}
            </div>
            {!importedPosts.length ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                No imported posts fall within the last 90 days. Use Social Intelligence to sync official accounts or choose a different date range.
              </div>
            ) : null}
            <p className="text-xs font-medium text-slate-500">
              Unavailable provider metrics show a dash, not a zero. Tracked signup/booking events are not proof of paid bookings or revenue.
            </p>
          </section>
        ) : null}

        <section id="historical-planner" aria-labelledby="legacy-title" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0D5C3A]">Reference only</p>
              <h2 id="legacy-title" className="mt-1 text-lg font-black text-[#0F2744]">Historical marketing calendar</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">
                Existing planning notes from the earlier Sales & Marketing calendar are preserved here. New approvals, publishing and results belong in the connected workspaces above.
              </p>
            </div>
            <Link href="/admin/sales-marketing/proof-library"
              className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-xs font-bold text-[#0F2744] hover:bg-[#EFF6FF]">
              Proof Library
            </Link>
          </div>
          {legacyResult.error ? (
            <p className="mt-4 rounded-xl border border-[#FFEDD5] bg-[#FFF4ED] p-3 text-sm font-semibold text-[#9A3412]">
              Historical records could not be loaded. Existing content and social analytics are separate and unaffected.
            </p>
          ) : legacy.length ? (
            <div className="mt-4 space-y-3">
              {legacy.map((entry) => (
                <article key={entry.id} className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#E2E8F0] px-2.5 py-1 text-xs font-black text-[#0F2744]">{entry.status || "Uncategorized"}</span>
                    <span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-xs font-bold text-[#1D4ED8]">{entry.platform || "Platform not set"}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-black text-[#0F2744]">{entry.title || "Untitled planning note"}</h3>
                  <p className="mt-1 text-xs text-slate-600">
                    {entry.owner_name || "Unassigned"} · {entry.campaign || "No campaign"} · Last updated {labelDate(entry.updated_at)}
                  </p>
                  <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                    <div><dt className="font-black text-slate-700">Audience</dt><dd className="mt-1 text-slate-600">{entry.audience || "Not set"}</dd></div>
                    <div><dt className="font-black text-slate-700">Planned date</dt><dd className="mt-1 text-slate-600">{entry.planned_date || "Not scheduled"}</dd></div>
                    {entry.caption_direction ? <div><dt className="font-black text-slate-700">Caption direction</dt><dd className="mt-1 text-slate-600">{entry.caption_direction}</dd></div> : null}
                    {entry.asset_needed ? <div><dt className="font-black text-slate-700">Asset needed</dt><dd className="mt-1 text-slate-600">{entry.asset_needed}</dd></div> : null}
                    {entry.ceo_review ? <div><dt className="font-black text-slate-700">CEO note</dt><dd className="mt-1 text-slate-600">{entry.ceo_review}</dd></div> : null}
                    {entry.performance_note ? <div><dt className="font-black text-slate-700">Performance note</dt><dd className="mt-1 text-slate-600">{entry.performance_note}</dd></div> : null}
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">No historical planning entries are recorded.</p>
          )}
        </section>
        <div className="flex flex-wrap items-center gap-2 pb-5 text-xs font-medium text-slate-600">
          <Megaphone size={15} className="text-[#0D5C3A]" aria-hidden="true" />
          SitGuru Admin Content Hub · Live source data, existing approval permissions, no duplicated content workflow.
        </div>
      </div>
    </main>
  );
}
