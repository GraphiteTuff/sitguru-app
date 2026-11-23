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
  queue = "action",
}: {
  items: StudioContentRow[];
  summary: ReturnType<typeof studioSummary>;
  isSuperUser: boolean;
  notice?: string;
  error?: string;
  focusId?: string;
  queue?: "action" | "review" | "publish" | "published" | "all";
}) {
  const draftUploadPilotEnabled = process.env.TIKTOK_DRAFT_UPLOAD_ENABLED === "true";
  const actionFor = (item: StudioContentRow) => studioRowLabel(item).action;
  const counts = {
    action: items.filter(item => ["Review", "Publish", "CEO review"].includes(actionFor(item))).length,
    review: items.filter(item => actionFor(item) === "Review").length,
    publish: items.filter(item => actionFor(item) === "Publish").length,
    published: items.filter(item => Boolean(item.publishedUrl)).length,
    all: items.length,
  };
  const queueTabs = [
    {id:"action", label:"Needs action"},
    {id:"review", label:"Review drafts"},
    {id:"publish", label:"Ready to publish"},
    {id:"all", label:"All content"},
    {id:"published", label:"Published"},
  ] as const;
  const visibleItems = items.filter(item => {
    const next = actionFor(item);
    if (queue === "review") return next === "Review";
    if (queue === "publish") return next === "Publish";
    if (queue === "published") return Boolean(item.publishedUrl);
    if (queue === "action") return ["Review", "Publish", "CEO review"].includes(next);
    return true;
  }).sort((a,b) => {
    const priority = (action: string) =>
      action === "Review" ? 0 : action === "Publish" ? 1 : action === "CEO review" ? 2 : 3;
    return priority(actionFor(a)) - priority(actionFor(b));
  });
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
      {notice ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">{notice}</p> : null}
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{error}</p> : null}
      <div aria-label="One-click Content Studio actions"
        className="flex min-w-0 flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <Link href="/manager/campaigns-content?tool=create#create-own-post"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-black text-white hover:bg-[#1D4ED8]">
          + Create post
        </Link>
        <Link href="/manager/campaigns-content?tool=create#campaign-tools"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-900 hover:bg-emerald-100">
          New campaign
        </Link>
        <Link href="/manager/calendar" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-[#0F2744] hover:bg-slate-50">Calendar</Link>
        <Link href="/manager/toolkit/brand" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-[#0F2744] hover:bg-slate-50">Brand Kit</Link>
        <Link href="/manager/reads" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-[#0F2744] hover:bg-slate-50">Reads &amp; Media</Link>
      </div>
      <nav aria-label="Filter team Content Studio work" className="flex min-w-0 gap-2 overflow-x-auto pb-1">
        {queueTabs.map(tab => (
          <Link key={tab.id} href={"/manager/campaigns-content?queue=" + tab.id + "#review"}
            aria-current={queue === tab.id ? "page" : undefined}
            className={"inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-black sm:text-sm " +
              (queue === tab.id
                ? "border-[#0D5C3A] bg-[#0D5C3A] text-white"
                : "border-slate-200 bg-white text-[#0F2744] hover:bg-[#F0FDF4]")}>
            {tab.label} <span className="tabular-nums opacity-75">({counts[tab.id]})</span>
          </Link>
        ))}
      </nav>
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
      <section id="review" className="scroll-mt-44 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              {queue === "action" ? "Next steps for your team" :
                queue === "review" ? "Drafts waiting for review" :
                queue === "publish" ? "Approved posts ready to publish" :
                queue === "published" ? "Published content" : "All team content"}
            </h2>
            <p className="text-xs font-semibold text-slate-600">
              {visibleItems.length} item{visibleItems.length === 1 ? "" : "s"} ·
              Review and publishing actions are available directly on each card.
            </p>
          </div>
          <Link href="/manager/campaigns-content?queue=all#review"
            className="text-sm font-black text-blue-700 hover:underline">Show all content</Link>
        </div>
        {visibleItems.map((item) => {
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
        {!visibleItems.length ? (
          <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-4">
            <p className="text-sm font-bold text-[#0D5C3A]">
              {queue === "action" ? "You're all caught up — no reviews or publishing tasks are waiting." :
               "No content matches this filter yet."}
            </p>
            <Link href="/manager/campaigns-content?queue=all#review"
              className="mt-2 inline-flex min-h-10 items-center text-sm font-black text-blue-700 underline">
              Browse all content
            </Link>
          </div>
        ) : null}
      </section>
      <details className="rounded-2xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-black text-[#0F2744]">
          View Content Studio totals · {summary.pending} awaiting review · {summary.approved} approved
        </summary>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(([label, count, tone]) => {
            const accent = DESK_STAT[tone];
            return (
              <article key={label} className={`rounded-xl border p-3 ${accent.wrap}`}>
                <p className={`text-xl font-black tabular-nums ${accent.value}`}>{count}</p>
                <p className="text-xs font-bold text-[#0F2744]">{label}</p>
              </article>
            );
          })}
        </div>
      </details>
      <p className="text-xs font-semibold text-slate-500">
        Opening a social network or copying a caption does not mark a post published. Sending a TikTok video transfers it for draft processing; inbox delivery must be verified separately. It does not create a public post. SitGuru does not automatically publish to Facebook, Instagram, TikTok, X, or YouTube. Approving a post does not complete internship hours.
      </p>
    </div>
  );
}
