// lib/services/twilio.ts
/**
 * Official Twilio connector for SitGuru SMS.
 * Prefers TWILIO_MESSAGING_SERVICE_SID (A2P / 10DLC) over a raw From number.
 * Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
 *      TWILIO_MESSAGING_SERVICE_SID and/or TWILIO_PHONE_NUMBER
 */

import twilio from "twilio";

export type SendSmsResult = {
  ok: boolean;
  skipped?: boolean;
  sid?: string | null;
  status?: string | null;
  error?: string;
};

function normalizeE164(phone: string) {
  const trimmed = String(phone || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed.replace(/[^\d+]/g, "");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits ? `+${digits}` : "";
}

function getTwilioClient() {
  const accountSid = String(process.env.TWILIO_ACCOUNT_SID || "").trim();
  const authToken = String(process.env.TWILIO_AUTH_TOKEN || "").trim();

  if (!accountSid || !authToken) return null;
  return twilio(accountSid, authToken);
}

function getTwilioFromNumber() {
  return (
    String(process.env.TWILIO_PHONE_NUMBER || "").trim() ||
    String(process.env.TWILIO_FROM_NUMBER || "").trim() ||
    String(process.env.TWILIO_FROM_PHONE_NUMBER || "").trim()
  );
}

function getTwilioMessagingServiceSid() {
  return String(process.env.TWILIO_MESSAGING_SERVICE_SID || "").trim();
}

export function isTwilioConfigured() {
  return Boolean(
    String(process.env.TWILIO_ACCOUNT_SID || "").trim() &&
      String(process.env.TWILIO_AUTH_TOKEN || "").trim() &&
      (getTwilioMessagingServiceSid() || getTwilioFromNumber()),
  );
}

/**
 * Robust SMS wrapper — never throws to callers of the dispatcher.
 * Prefers Messaging Service SID so US A2P / 10DLC traffic is registered.
 */
export async function sendSms(
  to: string,
  message: string,
): Promise<SendSmsResult> {
  try {
    const client = getTwilioClient();
    const messagingServiceSid = getTwilioMessagingServiceSid();
    const from = getTwilioFromNumber();
    const normalizedTo = normalizeE164(to);
    const body = String(message || "").trim().slice(0, 1500);

    if (process.env.SIMULATE_WALK === "1") {
      console.log("[SIMULATE_WALK][twilio] payload", {
        to: normalizedTo || to,
        messagingServiceSid: messagingServiceSid || null,
        from: from || null,
        body,
      });
    }

    if (!client || (!messagingServiceSid && !from)) {
      console.info("[twilio] skipped — credentials not configured");
      return {
        ok: false,
        skipped: true,
        error: "Twilio is not configured.",
      };
    }

    if (!normalizedTo) {
      return {
        ok: false,
        skipped: true,
        error: "A valid destination phone number is required.",
      };
    }

    if (!body) {
      return { ok: false, skipped: true, error: "SMS message is empty." };
    }

    const createParams: {
      to: string;
      body: string;
      messagingServiceSid?: string;
      from?: string;
    } = {
      to: normalizedTo,
      body,
    };

    if (messagingServiceSid) {
      createParams.messagingServiceSid = messagingServiceSid;
    } else {
      createParams.from = from;
    }

    const result = await client.messages.create(createParams);

    const status = String(result.status || "").trim() || null;
    const failedStatuses = new Set([
      "failed",
      "undelivered",
      "canceled",
      "cancelled",
    ]);

    if (status && failedStatuses.has(status.toLowerCase())) {
      return {
        ok: false,
        sid: result.sid || null,
        status,
        error: `Twilio message status was ${status}.`,
      };
    }

    return { ok: true, sid: result.sid || null, status };
  } catch (error) {
    const messageText =
      error instanceof Error ? error.message : "Twilio SMS failed.";
    console.error("[twilio] sendSms error:", messageText);
    return { ok: false, sid: null, status: null, error: messageText };
  }
}

/** @deprecated Prefer sendSms(to, message) */
export async function sendTwilioSms(params: {
  to: string;
  body: string;
}): Promise<SendSmsResult> {
  return sendSms(params.to, params.body);
}
