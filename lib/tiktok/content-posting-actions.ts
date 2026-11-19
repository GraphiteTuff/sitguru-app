"use server";

import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  CONTENT_DRAFT_BUCKET,
  contentCreativeOwned,
  creativeBytesMatch,
} from "@/lib/internship/content-creative";
import {
  contentCreativeKey,
} from "@/lib/internship/content-studio";
import { isOfficialReviewStage, legacyStatusToStage } from "@/lib/internship/review-flow";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getTikTokDraftUploadAccessToken } from "@/lib/tiktok/social-analytics";
import { uploadApprovedVideoToTikTokDraft, TIKTOK_DRAFT_VIDEO_LIMIT } from "@/lib/tiktok/content-posting";
import {
  describeTikTokDraftDelivery,
  deliveryStateFromAudit,
  extractTikTokDraftPublishId,
  fetchTikTokDraftDeliveryStatus,
} from "@/lib/tiktok/content-posting-status";

function returnToStudio(kind: "ok" | "error", message: string, contentId = ""): never {
  const params = new URLSearchParams({ [kind]: message });
  if (contentId) params.set("content", contentId);
  redirect(`/manager/campaigns-content?${params.toString()}`);
}

/**
 * Founder-only pilot: takes a single already-approved intern creative from
 * SitGuru's private draft bucket, and uploads it to TikTok's inbox as a DRAFT.
 * Never changes content's approved/published status, and never posts publicly.
 */
export async function sendApprovedTikTokVideoDraft(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const identity = await getAdminIdentity();
  if (!user || !identity?.isSuperUser) {
    returnToStudio("error", "Founder authorization is required to send TikTok drafts.");
  }
  if (process.env.TIKTOK_DRAFT_UPLOAD_ENABLED !== "true") {
    returnToStudio("error", "TikTok draft transfer has not been enabled for sandbox testing.");
  }
  if (String(formData.get("confirm") || "") !== "yes") {
    returnToStudio("error", "Confirm permission to reuse this video on TikTok.");
  }
  const contentId = String(formData.get("contentId") || "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(contentId)) {
    returnToStudio("error", "Select an approved Content Studio item.");
  }

  const { data: row, error: rowError } = await supabaseAdmin
    .from("internship_content")
    .select("id,intern_id,review_stage,status,platform,caption,draft_url,approved_snapshot,creative_path,creative_mime,creative_name,published_url")
    .eq("id", contentId)
    .maybeSingle();
  if (rowError || !row) returnToStudio("error", "Content Studio item was not found.", contentId);
  const stage = legacyStatusToStage(String(row.status || ""), String(row.review_stage || ""));
  if (!isOfficialReviewStage(stage) || row.published_url) {
    returnToStudio("error", "Only approved, unpublished videos can be transferred.", contentId);
  }
  if (row.platform !== "TikTok" || !["video/mp4", "video/webm", "video/quicktime"].includes(String(row.creative_mime))) {
    returnToStudio("error", "This approved item must contain a TikTok video.", contentId);
  }
  // A TikTok 201 response is only a transport acknowledgment. Prevent
  // double submission while TikTok processes an earlier inbox transfer.
  const { data: existingTransfer, error: existingTransferError } = await supabaseAdmin
    .from("internship_review_events")
    .select("created_at")
    .eq("target_type", "content")
    .eq("target_id", contentId)
    .eq("status", "tiktok_draft_uploaded")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingTransferError) {
    returnToStudio("error", "Could not check the existing TikTok transfer history. No new video was sent.", contentId);
  }
  if (existingTransfer) {
    returnToStudio("error", "This video was already transferred to TikTok. Use Check TikTok delivery instead of sending it again.", contentId);
  }

  if (!contentCreativeOwned(String(row.intern_id), String(row.creative_path))) {
    returnToStudio("error", "This creative is not associated with the approved intern.", contentId);
  }
  const { data: links, error: linksError } = await supabaseAdmin
    .from("internship_content_assets").select("asset_id").eq("content_id", contentId);
  if (linksError) returnToStudio("error", "Could not verify the approved creative.", contentId);
  const actualSnapshot = contentCreativeKey({
    caption: String(row.caption || ""),
    draftUrl: String(row.draft_url || ""),
    platform: String(row.platform || ""),
    assetIds: (links || []).map((value) => String(value.asset_id)),
    creativePath: String(row.creative_path || ""),
  });
  if (!row.approved_snapshot || row.approved_snapshot !== actualSnapshot) {
    returnToStudio("error", "Creative changed after approval; submit it for manager review again.", contentId);
  }

  const downloaded = await supabaseAdmin.storage
    .from(CONTENT_DRAFT_BUCKET)
    .download(String(row.creative_path));
  if (downloaded.error || !downloaded.data) {
    returnToStudio("error", "The approved video could not be retrieved.", contentId);
  }
  if (downloaded.data.size < 12 || downloaded.data.size > TIKTOK_DRAFT_VIDEO_LIMIT) {
    returnToStudio("error", "The approved video must be 25 MB or smaller.", contentId);
  }
  const videoBytes = new Uint8Array(await downloaded.data.arrayBuffer());
  const mime = String(row.creative_mime);
  if (!creativeBytesMatch(mime, videoBytes)) {
    returnToStudio("error", "The stored video did not match its approved file type.", contentId);
  }

  let publishId: string;
  try {
    const accessToken = await getTikTokDraftUploadAccessToken();
    const result = await uploadApprovedVideoToTikTokDraft({
      accessToken, bytes: videoBytes, mime,
    });
    publishId = result.publishId;
  } catch (error) {
    const message = error instanceof Error ? error.message : "TikTok could not receive this draft.";
    // Safe error messages are generated locally; provider responses, tokens,
    // private files, and ephemeral TikTok upload URLs are never logged.
    returnToStudio("error", message, contentId);
  }

  await supabaseAdmin.from("internship_review_events").insert({
    intern_id: row.intern_id,
    target_type: "content",
    target_id: contentId,
    reviewer_id: user.id,
    reviewer_role: "supervisor",
    review_stage: stage,
    status: "tiktok_draft_uploaded",
    comment: `Sent approved video to TikTok inbox as a draft (transfer ID: ${publishId}). Final editing and publication happen in TikTok.`,
  });
  returnToStudio("ok", "TikTok accepted the approved video transfer. Inbox delivery is not yet verified; use Check TikTok delivery before trying again. SitGuru did not publish it.", contentId);
}


/**
 * Founder-only, on-demand status lookup for the LAST saved approved upload.
 * Uses the existing server-side encrypted TikTok token and saved transfer ID.
 * Does not initiate another upload, auto-publish or change the intern's
 * approval/publication status. No browser-provided publish_id is accepted.
 */
export async function checkTikTokDraftDeliveryStatus(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const identity = await getAdminIdentity();
  if (!user || !identity?.isSuperUser) {
    returnToStudio("error", "Founder authorization is required to check TikTok delivery.");
  }
  if (process.env.TIKTOK_DRAFT_UPLOAD_ENABLED !== "true") {
    returnToStudio("error", "TikTok draft status checks are not enabled.");
  }
  const contentId = String(formData.get("contentId") || "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(contentId)) {
    returnToStudio("error", "Select an approved Content Studio item.");
  }
  const { data: item, error: itemError } = await supabaseAdmin
    .from("internship_content")
    .select("id,intern_id,platform,review_stage,status,published_url")
    .eq("id", contentId)
    .maybeSingle();
  if (itemError || !item || item.platform !== "TikTok") {
    returnToStudio("error", "The approved TikTok video could not be found.", contentId);
  }

  const { data: transfer, error: transferError } = await supabaseAdmin
    .from("internship_review_events")
    .select("comment,created_at")
    .eq("target_type", "content")
    .eq("target_id", contentId)
    .eq("status", "tiktok_draft_uploaded")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const publishId = transfer && extractTikTokDraftPublishId(String(transfer.comment || ""));
  if (transferError || !publishId) {
    returnToStudio("error", "No verified TikTok draft-transfer record was found; no new video was sent.", contentId);
  }

  // Avoid accidental rapid paid/rate-limited API requests on repeated clicks.
  const { data: lastCheck, error: checkError } = await supabaseAdmin
    .from("internship_review_events")
    .select("comment,created_at")
    .eq("target_type", "content")
    .eq("target_id", contentId)
    .eq("status", "tiktok_delivery_checked")
    .gte("created_at", String(transfer.created_at))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (checkError) {
    returnToStudio("error", "Could not check the last TikTok delivery result. No new request was made.", contentId);
  }
  if (lastCheck && Date.now() - Date.parse(String(lastCheck.created_at)) < 60_000) {
    const previous = deliveryStateFromAudit(String(lastCheck.comment || ""));
    if (previous) {
      returnToStudio("ok", "The last TikTok delivery check was less than a minute ago (" +
        previous.replaceAll("_", " ").toLowerCase() +
        "). No duplicate API request was sent.", contentId);
    }
  }

  let verdict: ReturnType<typeof describeTikTokDraftDelivery>;
  try {
    const token = await getTikTokDraftUploadAccessToken();
    const delivery = await fetchTikTokDraftDeliveryStatus(token, publishId);
    const { error: auditError } = await supabaseAdmin.from("internship_review_events").insert({
      intern_id: item.intern_id,
      target_type: "content",
      target_id: contentId,
      reviewer_id: user.id,
      reviewer_role: "supervisor",
      review_stage: String(item.review_stage || item.status || "ava_approved"),
      status: "tiktok_delivery_checked",
      comment: "TikTok delivery check: " + delivery.status + "." +
        (delivery.failReason ? " Reason: " + delivery.failReason + "." : "") +
        " No new upload or public post created.",
    });
    if (auditError) {
      throw new Error("TikTok delivery was checked but the audit record could not be saved. No new video was sent.");
    }
    verdict = describeTikTokDraftDelivery(delivery);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "TikTok status could not be checked.";
    // All errors from this module are constructed locally, without provider
    // response bodies, bearer tokens, upload URLs or transfer identifiers.
    returnToStudio("error", detail, contentId);
  }
  // Next.js redirect() throws internally; never call it within the catch above.
  returnToStudio(verdict.kind, verdict.message, contentId);
}
