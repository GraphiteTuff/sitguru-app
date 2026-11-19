/**
 * TikTok Content Posting API: founder-initiated, read-only delivery status
 * for a previously uploaded inbox draft. This never creates another upload,
 * publishes a post, or exposes access tokens / transfer IDs to the browser.
 *
 * Docs: https://developers.tiktok.com/docs/en/content-posting-api-reference-get-video-status
 */
const FETCH_STATUS_URL = "https://open.tiktokapis.com/v2/post/publish/status/fetch/";

const TIKTOK_DELIVERY_STATES = [
  "PROCESSING_UPLOAD",
  "PROCESSING_DOWNLOAD",
  "SEND_TO_USER_INBOX",
  "PUBLISH_COMPLETE",
  "FAILED",
] as const;

export type TikTokDeliveryState = (typeof TIKTOK_DELIVERY_STATES)[number];

export type TikTokDeliveryResult = {
  status: TikTokDeliveryState;
  failReason: string | null;
  uploadedBytes: number | null;
};

const VALID_ID = /^v_inbox_file~v2\.[A-Za-z0-9._~-]{1,128}$/;
const VALID_REASON = /^[a-z0-9_]{1,100}$/;

export function extractTikTokDraftPublishId(auditComment: string): string | null {
  // Never send the identifier to the client or present it as a public post URL.
  const match = auditComment.match(/\(transfer ID: ([A-Za-z0-9._~-]+)\)/);
  return match && VALID_ID.test(match[1]) ? match[1] : null;
}

export function deliveryStateFromAudit(comment: string): TikTokDeliveryState | null {
  const match = comment.match(/^TikTok delivery check: ([A-Z_]+)(?:[.]|$)/);
  const candidate = match?.[1];
  return candidate && TIKTOK_DELIVERY_STATES.includes(candidate as TikTokDeliveryState)
    ? candidate as TikTokDeliveryState
    : null;
}

export async function fetchTikTokDraftDeliveryStatus(
  accessToken: string,
  publishId: string,
): Promise<TikTokDeliveryResult> {
  if (!accessToken || !VALID_ID.test(publishId)) {
    throw new Error("The TikTok transfer identifier or account authorization is invalid.");
  }

  const response = await fetch(FETCH_STATUS_URL, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({ publish_id: publishId }),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(12000),
  });
  // Provider response bodies can contain sensitive values. Do not log them.
  if (!response.ok) throw new Error("TikTok status lookup returned HTTP " + response.status + ".");
  const payload = (await response.json()) as {
    data?: { status?: unknown; fail_reason?: unknown; uploaded_bytes?: unknown };
    error?: { code?: unknown };
  };
  if (payload.error?.code !== "ok") {
    const code = payload.error?.code;
    const safeCode = typeof code === "string" && VALID_REASON.test(code) ? code : "unknown";
    throw new Error("TikTok could not verify this transfer (" + safeCode + ").");
  }
  const value = payload.data?.status;
  if (typeof value !== "string" || !TIKTOK_DELIVERY_STATES.includes(value as TikTokDeliveryState)) {
    throw new Error("TikTok returned an unrecognized draft-delivery status.");
  }
  const reason = payload.data?.fail_reason;
  const failReason = typeof reason === "string" && VALID_REASON.test(reason) ? reason : null;
  const bytes = payload.data?.uploaded_bytes;
  const uploadedBytes = typeof bytes === "number" && Number.isSafeInteger(bytes) && bytes >= 0 ? bytes : null;
  return { status: value as TikTokDeliveryState, failReason, uploadedBytes };
}

export function describeTikTokDraftDelivery(result: TikTokDeliveryResult): {
  kind: "ok" | "error";
  message: string;
} {
  switch (result.status) {
    case "PROCESSING_UPLOAD":
    case "PROCESSING_DOWNLOAD":
      return {
        kind: "ok",
        message: "TikTok is still processing this transfer. Do not send the video again; check delivery status later.",
      };
    case "SEND_TO_USER_INBOX":
      return {
        kind: "ok",
        message: "TikTok reports the creator-inbox notification was sent. Open TikTok on the authorized account to complete editing. Nothing has been publicly posted.",
      };
    case "PUBLISH_COMPLETE":
      return {
        kind: "ok",
        message: "TikTok reports the post was completed. Check the profile and record the live TikTok link in SitGuru; SitGuru will not mark this content published automatically.",
      };
    case "FAILED":
      return {
        kind: "error",
        message: "TikTok reports this draft transfer FAILED" +
          (result.failReason ? " (" + result.failReason.replaceAll("_", " ") + ")" : "") +
          ". Resolve the reason before retrying; SitGuru did not publish it.",
      };
  }
}
