"use client";

import { Camera, ExternalLink, MessageSquareText, Music2, RefreshCw, Video, Youtube } from "lucide-react";
import type { SocialConnectorStatus } from "@/lib/growth-center-v2/types";
import type { MetaPublishedSync, SocialChannel, SocialPost } from "@/lib/social-intelligence/types";

const CHANNELS = [
  { id: "facebook", label: "Facebook", icon: MessageSquareText, tint: "border-[#DBEAFE] bg-[#EFF6FF]", iconTone: "bg-[#2563EB]", chip: "bg-[#2563EB]" },
  { id: "instagram", label: "Instagram", icon: Camera, tint: "border-[#F5D0FE] bg-[#FDF4FF]", iconTone: "bg-[#9333EA]", chip: "bg-[#9333EA]" },
  { id: "tiktok", label: "TikTok", icon: Music2, tint: "border-[#D7F5EE] bg-[#F0FDFA]", iconTone: "bg-[#102D38]", chip: "bg-[#102D38]" },
  { id: "x", label: "X", icon: null, tint: "border-slate-200 bg-[#F8FAFC]", iconTone: "bg-[#111827]", chip: "bg-[#111827]" },
  { id: "youtube", label: "YouTube", icon: Youtube, tint: "border-[#FECACA] bg-[#FFF5F5]", iconTone: "bg-[#DC2626]", chip: "bg-[#DC2626]" },
] as const;

function compact(value: number | null) {
  return value == null ? "—" : value.toLocaleString("en-US");
}

function postStatus(
  channel: SocialChannel,
  sync: MetaPublishedSync[],
  connections: SocialConnectorStatus[],
  count: number,
): { text: string; tone: "good" | "warning" | "neutral"; detail: string } {
  if (channel === "facebook" || channel === "instagram") {
    const state = sync.find((entry) => entry.platform === channel);
    if (state?.status === "success") return {
      text: "Meta imported", tone: "good", detail: "Official Meta posts imported. Counts are limited to the selected period.",
    };
    if (state?.status === "error") return {
      text: "Import needs access", tone: "warning",
      detail: "A recent Meta post import failed. Follower access does not guarantee Page or media post permissions.",
    };
    return {
      text: state?.status === "attempted" ? "Import attempted" : "Awaiting import",
      tone: "neutral", detail: "Use Sync Meta posts when official post permissions are available.",
    };
  }

  const connector = connections.find((entry) => entry.platform === channel);
  if (count > 0) return {
    text: "Posts cataloged", tone: "good",
    detail: "Published SitGuru content is recorded. Individual provider metrics appear only when verified.",
  };
  if (connector?.status === "connected") return {
    text: "Account metrics live", tone: "neutral",
    detail: "Account-level connection is available, but no published posts are cataloged for this period.",
  };
  if (connector?.status === "error") return {
    text: "Connection needs review", tone: "warning",
    detail: "Connection data is unavailable or stale. Post importing is not verified.",
  };
  if (connector?.status === "manual") return {
    text: "Manual reporting", tone: "neutral",
    detail: "Only manually recorded activity is available. Post-level provider import is not verified.",
  };
  return {
    text: "Post import unavailable", tone: "neutral",
    detail: "This channel stays visible. Verified published links will appear when they are recorded.",
  };
}

const STATUS_TONES = {
  good: "bg-[#DCFCE7] text-[#166534]",
  warning: "bg-[#FFF1F2] text-[#BE123C]",
  neutral: "bg-white text-[#475569]",
} as const;

export default function MetaPublishedContentPanel({
  posts, sync, connections, publishedChannelCounts, selectedPlatform,
  canRefresh, refreshing, feedback, onRefresh, onSelectPlatform, onOpen,
}: {
  posts: SocialPost[];
  sync: MetaPublishedSync[];
  connections: SocialConnectorStatus[];
  publishedChannelCounts: Record<SocialChannel, number>;
  selectedPlatform: string;
  canRefresh: boolean;
  refreshing: boolean;
  feedback: string | null;
  onRefresh: () => void;
  onSelectPlatform: (platform: SocialChannel | "all") => void;
  onOpen: (id: string) => void;
}) {
  const latest = [...posts]
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""))
    .slice(0, 9);
  const channelById = (channel: SocialChannel) =>
    CHANNELS.find((definition) => definition.id === channel) || CHANNELS[0];

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-[#DBEAFE] bg-white shadow-[0_10px_32px_rgba(15,39,68,0.07)]"
      aria-label="Published content across all official SitGuru social channels">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DBEAFE] bg-gradient-to-r from-[#EFF6FF] via-white to-[#FDF2F8] px-4 py-4 sm:px-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#2563EB]">SitGuru Social Studio · Official social channels</p>
          <h2 className="mt-1 text-xl font-black text-[#0F2744] sm:text-2xl">Recently published across SitGuru social media</h2>
          <p className="mt-1 max-w-3xl text-xs font-medium leading-5 text-slate-600">
            Facebook, Instagram, TikTok, X and YouTube in one view. See imported official posts and published Content Studio links,
            with each channel's actual connection and post-data status.
          </p>
        </div>
        {canRefresh ? (
          <button type="button" onClick={onRefresh} disabled={refreshing}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-[#1D4ED8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] disabled:cursor-wait disabled:opacity-60">
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} aria-hidden="true" />
            {refreshing ? "Importing Meta posts…" : "Sync Facebook & Instagram"}
          </button>
        ) : null}
      </div>
      <div className="grid gap-2 border-b border-slate-100 bg-white p-4 sm:grid-cols-2 xl:grid-cols-5 sm:px-5">
        {CHANNELS.map((platform) => {
          const channel = platform.id;
          const count = publishedChannelCounts[channel] ?? 0;
          const status = postStatus(channel, sync, connections, count);
          const Icon = platform.icon;
          const selected = selectedPlatform === channel;
          return (
            <button type="button" key={channel} onClick={() => onSelectPlatform(selected ? "all" : channel)}
              aria-pressed={selected}
              aria-label={platform.label + ": " + count + " published posts in selected period. " + status.text + ". Filter to " + platform.label}
              className={[
                "flex min-w-0 flex-col items-start gap-2 rounded-xl border p-3 text-left transition hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]",
                platform.tint, selected ? "ring-2 ring-[#2563EB]" : "",
              ].join(" ")}>
              <div className="flex w-full min-w-0 items-center gap-2.5">
                <div className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white " + platform.iconTone}>
                  {Icon ? <Icon size={19} aria-hidden="true" /> : <span className="text-xl font-black" aria-hidden="true">𝕏</span>}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-[#0F2744]">{platform.label}</p>
                  <p className="text-xs font-semibold text-slate-600">{count} {count === 1 ? "post" : "posts"} in period</p>
                </div>
              </div>
              <span className={"rounded-full px-2.5 py-1 text-[11px] font-bold " + STATUS_TONES[status.tone]}>
                {status.text}
              </span>
              <p className="text-[11px] leading-4 text-slate-600">{status.detail}</p>
              <span className="mt-auto text-xs font-black text-[#2563EB]">{selected ? "Show all networks" : "View channel posts"}</span>
            </button>
          );
        })}
      </div>
      {feedback ? (
        <p role="status" className="mx-4 mt-4 rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] p-3 text-xs font-semibold text-[#0F2744] sm:mx-5">
          {feedback}
        </p>
      ) : null}
      {latest.length ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3 sm:p-5">
          {latest.map((post) => {
            const platform = channelById(post.channel);
            const Icon = platform.icon;
            return (
              <article key={post.id} className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_20px_rgba(15,39,68,0.045)]">
                <div className={"relative h-32 overflow-hidden bg-gradient-to-br from-white to-slate-100 " + platform.tint}>
                  {post.thumbnailUrl?.startsWith("https://") ? (
                    <img src={post.thumbnailUrl} alt="" loading="lazy" referrerPolicy="no-referrer"
                      className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      {Icon ? <Icon className="text-[#0F2744]" size={38} aria-hidden="true" /> : <span className="text-4xl font-black" aria-hidden="true">𝕏</span>}
                    </div>
                  )}
                  <span className={"absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-black text-white shadow-sm " + platform.chip}>
                    {platform.label}
                  </span>
                </div>
                <div className="space-y-3 p-4">
                  <h3 className="line-clamp-2 min-h-10 text-sm font-black text-[#0F2744]">{post.title}</h3>
                  <p className="text-xs font-semibold text-slate-500">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    }) : "Date unavailable"}
                  </p>
                  <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-3 text-xs font-bold text-[#0F2744]">
                    <span className="inline-flex items-center gap-1"><Video size={13} aria-hidden="true" /> {compact(post.metrics.views)} views</span>
                    <span>{compact(post.metrics.likes)} likes</span>
                    <span>{compact(post.metrics.comments)} comments</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => onOpen(post.id)}
                      className="inline-flex min-h-10 items-center rounded-xl border border-[#D1EADD] bg-[#F0FDF4] px-3 py-2 text-xs font-black text-[#0D5C3A] hover:bg-[#DCFCE7]">
                      View insights
                    </button>
                    {post.publishedUrl.startsWith("https://") ? (
                      <a href={post.publishedUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-[#EEF2F6] px-3 py-2 text-xs font-bold text-[#0F2744] hover:bg-[#DBEAFE]">
                        Open post <ExternalLink size={13} aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="p-5 sm:p-7">
          <p className="text-sm font-black text-[#0F2744]">No published posts cataloged for these filters yet.</p>
          <p className="mt-1 text-sm text-slate-600">
            Select All networks or choose 28 or 90 days to explore older posts. The Meta button syncs Facebook and Instagram only.
            Other channels show posts as verified imports or published Content Studio links become available.
          </p>
        </div>
      )}
      <p className="border-t border-slate-100 bg-[#F8FAFC] px-4 py-3 text-xs font-medium leading-5 text-slate-600 sm:px-5">
        Meta sync covers Facebook and Instagram only. TikTok direct post imports require approved production video access;
        X post polling and YouTube Analytics are not yet verified for this feed. A connected account does not necessarily provide
        post insights. A dash means the provider did not supply that metric. Content authorship is attributed only when linked to an approved SitGuru Content Studio record.
      </p>
    </section>
  );
}
