"use client";

import { ExternalLink, MessageSquareText, Camera, RefreshCw, Video } from "lucide-react";
import type { MetaPublishedSync, SocialPost } from "@/lib/social-intelligence/types";

function compact(value: number | null) {
  return value == null ? "—" : value.toLocaleString("en-US");
}

export default function MetaPublishedContentPanel({
  posts, sync, canRefresh, refreshing, feedback, onRefresh, onOpen,
}: {
  posts: SocialPost[];
  sync: MetaPublishedSync[];
  canRefresh: boolean;
  refreshing: boolean;
  feedback: string | null;
  onRefresh: () => void;
  onOpen: (id: string) => void;
}) {
  const latest = posts.filter((p) => p.channel === "facebook" || p.channel === "instagram")
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""))
    .slice(0, 6);
  const label = (platform: "facebook" | "instagram") => platform === "facebook" ? "Facebook" : "Instagram";
  const mappedStatus = (platform: "facebook" | "instagram") =>
    sync.find((entry) => entry.platform === platform);
  return (
    <section className="overflow-hidden rounded-2xl border border-[#DBEAFE] bg-white shadow-[0_10px_32px_rgba(15,39,68,0.07)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DBEAFE] bg-gradient-to-r from-[#EFF6FF] via-white to-[#FDF2F8] px-4 py-4 sm:px-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#2563EB]">Meta Business Suite · Official SitGuru accounts</p>
          <h2 className="mt-1 text-lg font-black text-[#0F2744]">Recently published on Facebook &amp; Instagram</h2>
          <p className="mt-1 max-w-xl text-xs font-medium text-slate-600">
            Posts published directly through Meta appear here after a verified account import.
          </p>
        </div>
        {canRefresh ? (
          <button type="button" onClick={onRefresh} disabled={refreshing}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-[#1D4ED8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] disabled:cursor-wait disabled:opacity-60">
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} aria-hidden="true" />
            {refreshing ? "Importing published posts…" : "Sync Meta posts"}
          </button>
        ) : null}
      </div>
      <div className="grid gap-2 border-b border-slate-100 bg-white p-4 sm:grid-cols-2 sm:px-5">
        {(["facebook", "instagram"] as const).map((platform) => {
          const status = mappedStatus(platform);
          const fb = platform === "facebook";
          return (
            <div key={platform} className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${fb
              ? "border-[#DBEAFE] bg-[#EFF6FF]" : "border-[#F5D0FE] bg-[#FDF4FF]"}`}>
              <div className="flex min-w-0 items-center gap-2.5">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${fb ? "bg-[#2563EB] text-white" : "bg-[#9333EA] text-white"}`}>
                  {fb ? <MessageSquareText size={18} aria-hidden="true" /> : <Camera size={18} aria-hidden="true" />}
                </div>
                <div>
                  <p className="text-sm font-black text-[#0F2744]">{label(platform)}</p>
                  <p className="text-xs font-semibold text-slate-600">{status?.importedPosts || 0} posts cataloged</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${status?.status === "success"
                ? "bg-[#DCFCE7] text-[#166534]"
                : status?.status === "error"
                  ? "bg-[#FFF1F2] text-[#BE123C]"
                  : "bg-white text-[#475569]"}`}>
                {status?.status === "success" ? "Imported" : status?.status === "error" ? "Needs access" : "Awaiting sync"}
              </span>
            </div>
          );
        })}
      </div>
      {feedback ? <p role="status" className="mx-4 mt-4 rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] p-3 text-xs font-semibold text-[#0F2744] sm:mx-5">{feedback}</p> : null}
      {latest.length ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3 sm:p-5">
          {latest.map((post) => {
            const fb = post.channel === "facebook";
            return (
              <article key={post.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_20px_rgba(15,39,68,0.045)]">
                <div className={`relative h-32 overflow-hidden ${fb ? "bg-gradient-to-br from-[#DBEAFE] to-[#EFF6FF]" : "bg-gradient-to-br from-[#F5D0FE] to-[#FDF2F8]"}`}>
                  {post.thumbnailUrl?.startsWith("https://") ? (
                    <img src={post.thumbnailUrl} alt="" loading="lazy" referrerPolicy="no-referrer"
                      className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      {fb ? <MessageSquareText className="text-[#2563EB]" size={38} aria-hidden="true" />
                        : <Camera className="text-[#9333EA]" size={38} aria-hidden="true" />}
                    </div>
                  )}
                  <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-black shadow-sm ${fb
                    ? "bg-[#2563EB] text-white" : "bg-[#9333EA] text-white"}`}>
                    {fb ? "Facebook" : "Instagram"}
                  </span>
                </div>
                <div className="space-y-3 p-4">
                  <h3 className="line-clamp-2 min-h-10 text-sm font-black text-[#0F2744]">{post.title}</h3>
                  <p className="text-xs font-semibold text-slate-500">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Date unavailable"}</p>
                  <div className="flex gap-3 border-t border-slate-100 pt-3 text-xs font-bold text-[#0F2744]">
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
          <p className="text-sm font-black text-[#0F2744]">No published Meta posts imported for this reporting period yet.</p>
          <p className="mt-1 text-sm text-slate-600">Use Sync Meta posts to retrieve posts published on SitGuru's official accounts. Change the reporting period to 28 or 90 days for older content. A dash means a provider metric was not supplied.</p>
        </div>
      )}
      <p className="border-t border-slate-100 bg-[#F8FAFC] px-4 py-3 text-xs font-medium text-slate-600 sm:px-5">
        Meta confirms the publishing account, not the individual author. Content created by Ava is attributed to her only when linked to a SitGuru Content Studio record.
      </p>
    </section>
  );
}
