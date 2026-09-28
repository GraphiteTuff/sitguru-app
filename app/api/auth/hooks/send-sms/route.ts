import { NextResponse } from "next/server";
import { verifyStandardWebhookPayload } from "@/lib/auth/standard-webhook";
import { sendSms } from "@/lib/services/twilio";

export const runtime = "nodejs";

type SendSmsHookPayload = {
  user?: {
    id?: string;
    phone?: string;
  };
  sms?: {
    otp?: string;
  };
};

function jsonError(status: number, message: string, retryable = false) {
  return NextResponse.json(
    {
      error: {
        http_code: status,
        message,
      },
    },
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...(retryable ? { "retry-after": "true" } : {}),
      },
    },
  );
}

function normalizePhone(value: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed.replace(/[^\d+]/g, "");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  return `+${digits}`;
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `***${digits.slice(-4)}`;
}

/**
 * Supabase Auth Send SMS Hook.
 * Configure in Dashboard → Authentication → Hooks → Send SMS:
 *   URL: https://www.sitguru.com/api/auth/hooks/send-sms
 *   Secret: SEND_SMS_HOOK_SECRETS (v1,whsec_...)
 *
 * Uses the app Twilio Messaging Service (A2P) so login codes match
 * transactional SMS deliverability instead of a bare From number.
 */
export async function POST(request: Request) {
  const secrets = String(process.env.SEND_SMS_HOOK_SECRETS || "").trim();

  if (!secrets) {
    console.error("[auth/send-sms-hook] SEND_SMS_HOOK_SECRETS is missing");
    return jsonError(503, "SitGuru SMS hook secret is not configured.", true);
  }

  const payloadText = await request.text();

  let event: SendSmsHookPayload;

  try {
    event = verifyStandardWebhookPayload<SendSmsHookPayload>({
      payload: payloadText,
      headers: request.headers,
      secrets,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid webhook signature.";
    console.warn("[auth/send-sms-hook] signature rejected:", message);
    return jsonError(401, message);
  }

  const otp = String(event.sms?.otp || "")
    .replace(/\D/g, "")
    .slice(0, 8);
  const phone = normalizePhone(String(event.user?.phone || ""));

  if (!otp || otp.length < 4) {
    return jsonError(400, "SMS hook payload was missing a valid OTP.");
  }

  if (!phone) {
    return jsonError(400, "SMS hook payload was missing a phone number.");
  }

  const body = `SitGuru code: ${otp}. Use this newest code to continue. Do not share it.`;

  const result = await sendSms(phone, body);

  if (!result.ok) {
    const retryable =
      Boolean(result.skipped) ||
      /timeout|temporar|unavailable|429|503/i.test(result.error || "");

    console.error("[auth/send-sms-hook] Twilio send failed:", {
      userId: event.user?.id || null,
      phone: maskPhone(phone),
      error: result.error || "unknown",
      status: result.status || null,
      sid: result.sid || null,
    });

    return jsonError(
      retryable ? 503 : 500,
      result.error || "SitGuru could not deliver the login SMS.",
      retryable,
    );
  }

  console.info("[auth/send-sms-hook] queued:", {
    userId: event.user?.id || null,
    phone: maskPhone(phone),
    sid: result.sid || null,
    status: result.status || null,
  });

  return NextResponse.json(
    {},
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    hook: "send_sms",
    configuredSecret: Boolean(
      String(process.env.SEND_SMS_HOOK_SECRETS || "").trim(),
    ),
    twilioConfigured: Boolean(
      String(process.env.TWILIO_ACCOUNT_SID || "").trim() &&
        String(process.env.TWILIO_AUTH_TOKEN || "").trim() &&
        (String(process.env.TWILIO_MESSAGING_SERVICE_SID || "").trim() ||
          String(process.env.TWILIO_PHONE_NUMBER || "").trim() ||
          String(process.env.TWILIO_FROM_NUMBER || "").trim()),
    ),
  });
}
