import { getEmailBaseUrl } from "@/lib/email/config";
import { sendSitGuruEmail } from "@/lib/email/resend";
import { contentReviewNotice, deliverableMailbox } from "@/lib/internship/content-studio";
import { publishLiveSignals } from "@/lib/realtime/publish-live-signal";
import { supabaseAdmin } from "@/lib/supabase/admin";

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (char) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char] || char
  ));
}

async function mailboxForUser(userId: string, fallback = "") {
  if (!userId) return deliverableMailbox(fallback);
  const { data } = await supabaseAdmin.from("profiles").select("email").eq("id", userId).maybeSingle();
  return deliverableMailbox(String(data?.email || ""), fallback);
}

export async function notifyContentReview(input: {
  kind: "submitted" | "changes" | "approved" | "escalated";
  contentId: string;
  title: string;
  recipientUserId: string;
  fallbackEmail?: string;
  actorUserId: string;
  eventStamp: string;
}) {
  if (!input.recipientUserId || input.recipientUserId === input.actorUserId) return;
  const path = input.kind === "submitted"
    ? `/manager/campaigns-content?content=${input.contentId}`
    : input.kind === "escalated"
      ? `/admin/growth/content?content=${input.contentId}`
      : `/intern/content?edit=${input.contentId}`;
  const href = `${getEmailBaseUrl()}${path}`;
  const notice = contentReviewNotice({ kind: input.kind, title: input.title, href });
  await publishLiveSignals({
    eventType: `content.studio.${input.kind}`,
    eventId: `${input.contentId}:${input.kind}:${input.eventStamp}`,
    recipientUserIds: [input.recipientUserId],
    actorUserId: input.actorUserId,
    resourceType: "internship_content",
    resourceId: input.contentId,
    notify: true,
    notifyTitle: notice.title,
    notifyBody: notice.body,
    notifyHref: path,
    paths: [path],
  });
  const email = await mailboxForUser(input.recipientUserId, input.fallbackEmail || "");
  if (!email) return;
  try {
    await sendSitGuruEmail({
      to: email,
      subject: notice.subject,
      text: notice.text,
      html: `<p>${escapeHtml(notice.body)}</p><p><a href="${escapeHtml(href)}">Open this content</a></p>`,
    });
  } catch (error) {
    console.warn("[content-studio] email", error instanceof Error ? error.message : "unavailable");
  }
}
