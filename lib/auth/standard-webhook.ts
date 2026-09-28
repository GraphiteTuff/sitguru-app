import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verify a Supabase Auth HTTP Hook payload (Standard Webhooks).
 * Secret format: `v1,whsec_<base64>` (or just the base64 body).
 */
export function verifyStandardWebhookPayload<T = unknown>(params: {
  payload: string;
  headers: Headers;
  secrets: string;
}): T {
  const webhookId = params.headers.get("webhook-id") || "";
  const webhookTimestamp = params.headers.get("webhook-timestamp") || "";
  const webhookSignature = params.headers.get("webhook-signature") || "";

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    throw new Error("Missing Standard Webhooks signature headers.");
  }

  const timestampSeconds = Number(webhookTimestamp);
  if (!Number.isFinite(timestampSeconds)) {
    throw new Error("Invalid webhook timestamp.");
  }

  // Reject stale signatures (5 minute skew window).
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > 300) {
    throw new Error("Webhook timestamp is outside the allowed window.");
  }

  const signedContent = `${webhookId}.${webhookTimestamp}.${params.payload}`;
  const presentedSignatures = webhookSignature
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [, value = ""] = part.split(",", 2);
      return value.trim();
    })
    .filter(Boolean);

  if (presentedSignatures.length === 0) {
    throw new Error("Webhook signature header was empty.");
  }

  const secretCandidates = String(params.secrets || "")
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => value.replace(/^v1,whsec_/i, "").trim())
    .filter(Boolean);

  if (secretCandidates.length === 0) {
    throw new Error("SEND_SMS_HOOK_SECRETS is not configured.");
  }

  let matched = false;

  for (const secret of secretCandidates) {
    const key = Buffer.from(secret, "base64");
    const expected = createHmac("sha256", key)
      .update(signedContent, "utf8")
      .digest("base64");
    const expectedBuffer = Buffer.from(expected);

    for (const presented of presentedSignatures) {
      const presentedBuffer = Buffer.from(presented);
      if (
        expectedBuffer.length === presentedBuffer.length &&
        timingSafeEqual(expectedBuffer, presentedBuffer)
      ) {
        matched = true;
        break;
      }
    }

    if (matched) break;
  }

  if (!matched) {
    throw new Error("Webhook signature verification failed.");
  }

  return JSON.parse(params.payload) as T;
}
