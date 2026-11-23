import Link from "next/link";
import { CopyTextButton } from "@/components/manager/CopyTextButton";
import { getPublicSiteUrl } from "@/lib/admin/growth/constants";
import {
  recordStudioPublication,
  reviewStudioContent,
  type StudioContentRow,
} from "@/lib/internship/content-studio-actions";
import { studioRowLabel, studioSummary } from "@/lib/internship/content-studio";
import { DESK_STAT, DESK_UI } from "@/lib/portal/desk-ui";
import { checkTikTokDraftDeliveryStatus, sendApprovedTikTokVideoDraft } from "@/lib/tiktok/content-posting-actions";

const PLATFORM_LINKS: Record<string, string> = {
  Facebook: "https://www.facebook.com/",
  Instagram: "https://www.instagram.com/",
  TikTok: "https://www.tiktok.com/",
  X: "https://x.com/",
  YouTube: "https://www.youtube.com/",
};

function CreativePreview({ item }: { item: StudioContentRow }) {
  if (!item.creativePath) return null;
  const src = `/api/content-studio/${item.id}/file`;
  if (item.creativeMime.startsWith("video/")) {
    return <video src={src} controls className="mt-3 max-h-80 w-full rounded-xl bg-slate-950" />;
  }
  return <img src={src} alt="" className="mt-3 max-h-80 w-full rounded-xl object-contain bg-slate-50" />;
}

export function ContentStudioBoard({
  items,
  summary,
  isSuperUser,
  notice,
  error,
  focusId = "",
}: {
  items: StudioContentRow[];
  summary: ReturnType<typeof studioSummary>;
  isSuperUser: boolean;
  notice?: string;
  error?: string;
  focusId?: string;
}) {
  const draftUploadPilotEnabled = process.env.TIKTOK_DRAFT_UPLOAD_ENABLED === "true";
  const cards = [
    ["Drafts", summary.drafts, "sky"],
    ["Pending my approval", summary.pending, "amber"],
    ["Changes requested", summary.changes, "peach"],
    ["Approved", summary.approved, "green"],
    ["Scheduled", summary.scheduled, "violet"],
    ["Published", summary.published, "teal"],
  ] as const;

  return (
    <div className="space-y-4">
      <header className="rounded-[1.5rem] bg-gradient-to-r from-[#0F2744] via-[#104951] to-[#0D5C3A] p-5 shadow-[0_12px_32px_rgba(15,39,68,0.14)] public-dark-section" data-brand-green>
        <p className="text-xs font-black uppercase tracking-[0.16em] !text-emerald-100">SitGuru · Manager's Desk</p>
        <h2 className="mt-1 text-2xl font-black !text-white">Content Studio</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold !text-emerald-50">Create, review, approve and measure what grows our community.</p>
      </header>
      {notice ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">{notice}</p> : null}
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{error}</p> : null}
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <Link href="/manager/create" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#2563EB] px-4 py-3 text-sm font-black !text-white shadow-sm hover:bg-[#1D4ED8] focus-visible:ring-2 focus-visible:ring-[#2563EB]/30">Create content</Link>
        <Link href="/manager/reads" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#D1EADD] bg-[#F0FDF4] px-4 py-3 text-sm font-black text-[#0D5C3A] hover:bg-[#DCFCE7]">Reads &amp; Media</Link>
        <Link href="/manager/toolkit/brand" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-[#0F2744] hover:bg-[#EEF2F6]">Brand Kit</Link>
        <a href="#review" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-[#0F2744] hover:bg-[#EEF2F6]">Review queue</a>
        <Link href="/manager/calendar" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-[#0F2744] hover:bg-[#EEF2F6]">Content calendar</Link>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, count, tone]) => {
          const accent = DESK_STAT[tone];
          return (
            <article key={label} className={`rounded-2xl border p-4 shadow-[0_8px_24px_rgba(15,39,68,0.05)] ${accent.wrap}`}>
              <p className={`text-2xl font-black tabular-nums ${accent.value}`}>{count}</p>
              <p className="text-sm font-bold text-[#0F2744]">{label}</p>
            </article>
          );
        })}
      </div>
      {isSuperUser && draftUploadPilotEnabled ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <p className="text-sm font-bold text-sky-950">TikTok draft-upload pilot</p>
          <p className="mt-1 text-sm text-sky-900">Authorize @sitguruofficial to send approved video to TikTok drafts. This is separate from follower analytics and never publishes a public TikTok post.</p>
          <Link href="/api/integrations/tiktok/start?upload=1" className="mt-3 inline-flex min-h-11 items-center rounded-full bg-[#2563EB] px-4 text-sm font-black !text-white">Connect TikTok for draft uploads</Link>
        </div>
      ) : null}
      {isSuperUser ? (
        <p className="text-sm font-semibold text-slate-600">
          {summary.escalated} escalation{summary.escalated === 1 ? "" : "s"} waiting for Admin. Routine posts stay with the assigned manager.
        </p>
      ) : null}
      <section id="review" className="space-y-3">
        <h3 className="text-lg font-black text-slate-950">My team&apos;s content</h3>
        {items.map((item) => {
          const labels = studioRowLabel(item);
          const platformHref = PLATFORM_LINKS[item.platform] || "";
          return (
            <article id={`content-${item.id}`} key={item.id} className={`${DESK_UI.card} p-4 ${focusId === item.id ? "ring-2 ring-[#2563EB]" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h4 className="text-lg font-black text-slate-950">{item.title}</h4>
                  <p className="text-sm font-semibold text-slate-600">
                    Intern: {item.internName} · {item.platform || "No platform"} · {labels.status}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{labels.action}</span>
              </div>
              <CreativePreview item={item} />
              {item.caption ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.caption}</p> : null}
              {item.draftUrl ? <p className="mt-2 break-all text-sm font-semibold text-[#1D4ED8]">{item.draftUrl}</p> : null}
              <p className="mt-2 text-xs font-semibold text-slate-500">
                {item.assetIds.length} brand asset{item.assetIds.length === 1 ? "" : "s"}
                {item.plannedAt ? ` · Planned ${item.plannedAt.slice(0, 16).replace("T", " ")}` : ""}
                {item.publishedUrl ? " · Live link recorded" : ""}
              </p>
              {item.feedback ? <p className="mt-2 text-sm font-semibold text-amber-900">Last note: {item.feedback}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {item.caption ? <CopyTextButton text={item.caption} label="Copy caption" /> : null}
                {labels.action === "Publish" || item.publishedUrl ? (
                  item.platform === "Multiple" ? (
                    ["Facebook", "Instagram", "TikTok", "X", "YouTube"].map((network) => (
                      <CopyTextButton key={network} label={`Copy ${network} tracking link`}
                        text={`${getPublicSiteUrl()}/go/post/${item.id}?platform=${network.toLowerCase()}`} />
                    ))
                  ) : (
                    <CopyTextButton label="Copy SitGuru tracking link"
                      text={`${getPublicSiteUrl()}/go/post/${item.id}?platform=${item.platform.toLowerCase()}`} />
                  )
                ) : null}
                {platformHref ? (
                  <a href={platformHref} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-full border border-slate-200 px-3 text-xs font-black text-slate-700">
                    Open {item.platform}
                  </a>
                ) : null}
              </div>
              {labels.action === "Review" ? (
                <form action={reviewStudioContent} className="mt-3 grid gap-2">
                  <input type="hidden" name="contentId" value={item.id} />
                  <input type="hidden" name="internId" value={item.internId} />
                  <textarea name="comment" rows={2} placeholder="Feedback for the intern, or the reason for an escalation" className="min-h-16 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  <div className="flex flex-wrap gap-2">
                    <button name="reviewAction" value="approve" className="min-h-11 rounded-full bg-[#0D5C3A] px-4 text-sm font-black !text-white">Approve content</button>
                    <button name="reviewAction" value="request_changes" className="min-h-11 rounded-full border border-amber-300 px-4 text-sm font-black text-amber-950">Request changes</button>
                    <button name="reviewAction" value="comment" className="min-h-11 rounded-full border border-slate-300 px-4 text-sm font-black text-slate-800">Comment</button>
                    <button name="reviewAction" value="escalate" className="min-h-11 rounded-full border border-slate-300 px-4 text-sm font-black text-slate-800">Escalate to Admin</button>
                  </div>
                </form>
              ) : null}
              {labels.action === "CEO review" && isSuperUser ? (
                <form action={reviewStudioContent} className="mt-3 grid gap-2">
                  <input type="hidden" name="contentId" value={item.id} />
                  <input type="hidden" name="internId" value={item.internId} />
                  <textarea name="comment" rows={2} placeholder="Leadership note" className="min-h-16 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  <div className="flex flex-wrap gap-2">
                    <button name="reviewAction" value="ceo_approve" className="min-h-11 rounded-full bg-[#0D5C3A] px-4 text-sm font-black !text-white">CEO approve</button>
                    <button name="reviewAction" value="ceo_request_changes" className="min-h-11 rounded-full border border-amber-300 px-4 text-sm font-black text-amber-950">Send back</button>
                  </div>
                </form>
              ) : null}
              {labels.action === "CEO review" && !isSuperUser ? (
                <p className="mt-3 text-sm font-semibold text-slate-600">Escalated to Admin. Routine approval stays with the assigned manager.</p>
              ) : null}
              {isSuperUser && draftUploadPilotEnabled && item.platform === "TikTok" && item.creativePath && item.creativeMime.startsWith("video/") && !item.publishedUrl && !item.tiktokTransferAt && ["Manager approved", "CEO Approved", "Approved / Complete"].includes(labels.status) ? (
                <form action={sendApprovedTikTokVideoDraft} className="mt-3 space-y-3 rounded-xl border border-sky-200 bg-sky-50 p-3">
                  <input type="hidden" name="contentId" value={item.id} />
                  <p className="text-sm font-bold text-sky-950">Send approved video to TikTok drafts</p>
                  <label className="flex items-start gap-2 text-xs font-semibold text-sky-900">
                    <input type="checkbox" name="confirm" value="yes" required className="mt-1" />
                    I confirm this is the approved video and SitGuru has permission to share it on TikTok. Final editing and publication happen inside TikTok.
                  </label>
                  <button type="submit" className="min-h-11 rounded-full bg-[#2563EB] px-4 text-sm font-black !text-white">Send to TikTok inbox as draft</button>
                </form>
              ) : null}
              {item.platform === "TikTok" && item.tiktokTransferAt && !item.publishedUrl ? (
                <div className="mt-3 space-y-2 rounded-xl border border-sky-200 bg-sky-50 p-3">
                  <p className="text-sm font-bold text-sky-950">TikTok draft transfer recorded</p>
                  <p className="text-xs font-semibold text-sky-900">
                    TikTok accepted the video bytes. The transfer does not prove an inbox notification or public post was delivered.
                    Do not send this video again until the status is verified.
                  </p>
                  <p className="text-xs font-semibold text-sky-900">
                    Delivery status: <strong>{item.tiktokDeliveryStatus ? item.tiktokDeliveryStatus.replaceAll("_", " ").toLowerCase() : "Not checked yet"}</strong>
                    {item.tiktokDeliveryCheckedAt ? " · Last checked " + item.tiktokDeliveryCheckedAt.replace("T", " ").slice(0, 16) + " UTC" : ""}
                  </p>
                  {isSuperUser && draftUploadPilotEnabled ? (
                    <form action={checkTikTokDraftDeliveryStatus} className="pt-1">
                      <input type="hidden" name="contentId" value={item.id} />
                      <button type="submit" className="min-h-10 rounded-full bg-[#2563EB] px-4 text-sm font-black !text-white">
                        Check TikTok delivery
                      </button>
                    </form>
                  ) : (
                    <p className="text-xs text-sky-900">Only SitGuru's founder can check the authenticated TikTok delivery status.</p>
                  )}
                </div>
              ) : null}
              {labels.status !== "Published" && (labels.action === "Publish" || labels.status === "Manager approved" || labels.status === "CEO Approved") ? (
                <form action={recordStudioPublication} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input type="hidden" name="contentId" value={item.id} />
                  <input type="hidden" name="internId" value={item.internId} />
                  <input name="publishedUrl" required placeholder="https:// link of the live post" className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm" />
                  <button className="min-h-11 rounded-full bg-[#2563EB] px-4 text-sm font-black !text-white">Record published link</button>
                </form>
              ) : null}
            </article>
          );
        })}
        {!items.length ? (
          <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-500">
            No intern content is waiting. New drafts show up here after an intern submits them.
          </p>
        ) : null}
      </section>
      <p className="text-xs font-semibold text-slate-500">
        Opening a social network or copying a caption does not mark a post published. Sending a TikTok video transfers it for draft processing; inbox delivery must be verified separately. It does not create a public post. SitGuru does not automatically publish to Facebook, Instagram, TikTok, X, or YouTube. Approving a post does not complete internship hours.
      </p>
    </div>
  );
}
