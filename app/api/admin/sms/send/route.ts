import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SmsPurpose = "test" | "transactional" | "support";

type SendSmsPayload = {
  to?: unknown;
  message?: unknown;
  purpose?: unknown;
  confirm?: unknown;
  consentConfirmed?: unknown;
  recipientName?: unknown;
  userId?: unknown;
  source?: unknown;
};

type AuthorizedActor = {
  mode: "admin" | "integration";
  id: string;
  email: string;
};

type TwilioConfiguration = {
  accountSid: string;
  authToken: string;
  messagingServiceSid: string;
  fromNumber: string;
};

type TwilioSendResult = {
  sid: string;
  status: string;
  to: string;
  from: string;
  messagingServiceSid: string;
};

const SUPER_USER_EMAILS = new Set([
  "jason@sitguru.com",
  "nette@sitguru.com",
]);

const MAX_MESSAGE_LENGTH = 1500;
const MIN_INTEGRATION_KEY_LENGTH = 32;

class SmsRouteError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code = "sms_request_failed") {
    super(message);
    this.name = "SmsRouteError";
    this.status = status;
    this.code = code;
  }
}

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeEmail(value: unknown) {
  return safeString(value).toLowerCase();
}

function normalizePhoneNumber(value: unknown) {
  const original = safeString(value);
  if (!original) return "";

  const digits = original.replace(/\D/g, "");

  let normalized = "";

  if (original.startsWith("+")) {
    normalized = `+${digits}`;
  } else if (digits.length === 10) {
    normalized = `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith("1")) {
    normalized = `+${digits}`;
  }

  return /^\+[1-9]\d{7,14}$/.test(normalized) ? normalized : "";
}

function maskPhoneNumber(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");

  if (digits.length < 4) return "hidden";
  return `***-***-${digits.slice(-4)}`;
}

function normalizePurpose(value: unknown): SmsPurpose {
  const normalized = safeString(value).toLowerCase();

  if (normalized === "test") return "test";
  if (normalized === "support") return "support";
  return "transactional";
}

function constantTimeSecretMatch(provided: string, configured: string) {
  const providedBuffer = Buffer.from(provided, "utf8");
  const configuredBuffer = Buffer.from(configured, "utf8");

  if (providedBuffer.length !== configuredBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, configuredBuffer);
}

function mapAdminAuthErrorStatus(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("missing authorization") ||
    normalized.includes("unable to verify your account")
  ) {
    return 401;
  }

  if (
    normalized.includes("admin access required") ||
    normalized.includes("admin account is not active") ||
    normalized.includes("unable to verify admin profile") ||
    normalized.includes("super user access required")
  ) {
    return 403;
  }

  return 401;
}

function getTwilioConfiguration(): TwilioConfiguration {
  const accountSid = safeString(process.env.TWILIO_ACCOUNT_SID);
  const authToken = safeString(process.env.TWILIO_AUTH_TOKEN);
  const messagingServiceSid = safeString(
    process.env.TWILIO_MESSAGING_SERVICE_SID,
  );
  const fromNumber =
    safeString(process.env.TWILIO_FROM_NUMBER) ||
    safeString(process.env.TWILIO_FROM_PHONE_NUMBER);

  if (!accountSid) {
    throw new SmsRouteError(
      500,
      "TWILIO_ACCOUNT_SID is not configured.",
      "twilio_account_sid_missing",
    );
  }

  if (!authToken) {
    throw new SmsRouteError(
      500,
      "TWILIO_AUTH_TOKEN is not configured.",
      "twilio_auth_token_missing",
    );
  }

  if (!messagingServiceSid && !fromNumber) {
    throw new SmsRouteError(
      500,
      "A Twilio Messaging Service SID or sender phone number is required.",
      "twilio_sender_missing",
    );
  }

  return {
    accountSid,
    authToken,
    messagingServiceSid,
    fromNumber,
  };
}

async function authorizeRequest(
  request: NextRequest,
): Promise<AuthorizedActor> {
  const suppliedIntegrationKey = safeString(
    request.headers.get("x-sitguru-integration-key"),
  );

  if (suppliedIntegrationKey) {
    const integrationEnabled =
      safeString(process.env.SITGURU_SMS_INTEGRATION_ENABLED).toLowerCase() ===
      "true";

    if (!integrationEnabled) {
      throw new SmsRouteError(
        403,
        "The SitGuru SMS integration is not enabled.",
        "sms_integration_disabled",
      );
    }

    const configuredIntegrationKey = safeString(
      process.env.SITGURU_SMS_INTEGRATION_KEY,
    );

    if (
      configuredIntegrationKey.length < MIN_INTEGRATION_KEY_LENGTH ||
      !constantTimeSecretMatch(
        suppliedIntegrationKey,
        configuredIntegrationKey,
      )
    ) {
      throw new SmsRouteError(
        401,
        "Invalid SitGuru SMS integration credentials.",
        "invalid_integration_credentials",
      );
    }

    return {
      mode: "integration",
      id: "sitguru-sms-integration",
      email: "sms-integration@sitguru.internal",
    };
  }

  try {
    const { adminUser } = await requireAdminUser(request);
    const adminEmail = normalizeEmail(adminUser.email);

    if (!SUPER_USER_EMAILS.has(adminEmail)) {
      throw new SmsRouteError(
        403,
        "Super User access required.",
        "super_user_required",
      );
    }

    return {
      mode: "admin",
      id: adminUser.id,
      email: adminEmail,
    };
  } catch (error) {
    if (error instanceof SmsRouteError) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "Unable to authorize request.";

    throw new SmsRouteError(
      mapAdminAuthErrorStatus(message),
      message,
      "admin_authorization_failed",
    );
  }
}

async function sendThroughTwilio({
  to,
  message,
  configuration,
}: {
  to: string;
  message: string;
  configuration: TwilioConfiguration;
}): Promise<TwilioSendResult> {
  const form = new URLSearchParams({
    To: to,
    Body: message,
  });

  if (configuration.messagingServiceSid) {
    form.set(
      "MessagingServiceSid",
      configuration.messagingServiceSid,
    );
  } else {
    form.set("From", configuration.fromNumber);
  }

  const credentials = Buffer.from(
    `${configuration.accountSid}:${configuration.authToken}`,
  ).toString("base64");

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(
      configuration.accountSid,
    )}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
      cache: "no-store",
    },
  );

  const payload = asRecord(await response.json().catch(() => null));

  if (!response.ok) {
    const providerMessage =
      safeString(payload.message) || "Twilio could not send the SMS message.";

    const providerCode = safeString(payload.code);

    console.error("SitGuru Twilio SMS provider error:", {
      status: response.status,
      code: providerCode || null,
      message: providerMessage,
      recipient: maskPhoneNumber(to),
    });

    throw new SmsRouteError(
      502,
      providerMessage,
      providerCode
        ? `twilio_${providerCode}`
        : "twilio_delivery_failed",
    );
  }

  const sid = safeString(payload.sid);

  if (!sid) {
    throw new SmsRouteError(
      502,
      "Twilio accepted the request but did not return a Message SID.",
      "twilio_message_sid_missing",
    );
  }

  return {
    sid,
    status: safeString(payload.status) || "queued",
    to: safeString(payload.to) || to,
    from: safeString(payload.from),
    messagingServiceSid:
      safeString(payload.messaging_service_sid) ||
      configuration.messagingServiceSid,
  };
}

function validatePayload(payload: SendSmsPayload) {
  const to = normalizePhoneNumber(payload.to);
  const message = safeString(payload.message);
  const purpose = normalizePurpose(payload.purpose);
  const recipientName = safeString(payload.recipientName).slice(0, 120);
  const userId = safeString(payload.userId).slice(0, 120);
  const source = safeString(payload.source).slice(0, 120);

  if (payload.confirm !== true) {
    throw new SmsRouteError(
      400,
      "SMS delivery must be explicitly confirmed.",
      "confirmation_required",
    );
  }

  if (!to) {
    throw new SmsRouteError(
      400,
      "Enter a valid phone number in E.164 or U.S. 10-digit format.",
      "invalid_phone_number",
    );
  }

  if (!message) {
    throw new SmsRouteError(
      400,
      "SMS message text is required.",
      "message_required",
    );
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new SmsRouteError(
      400,
      `SMS messages must be ${MAX_MESSAGE_LENGTH} characters or fewer.`,
      "message_too_long",
    );
  }

  if (purpose !== "test" && payload.consentConfirmed !== true) {
    throw new SmsRouteError(
      400,
      "Recipient SMS consent must be confirmed before sending this message.",
      "sms_consent_required",
    );
  }

  return {
    to,
    message,
    purpose,
    recipientName,
    userId,
    source,
    consentConfirmed:
      purpose === "test" ? false : payload.consentConfirmed === true,
  };
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();

  try {
    const actor = await authorizeRequest(request);

    const requestPayload = (await request.json().catch(() => null)) as
      | SendSmsPayload
      | null;

    if (!requestPayload) {
      throw new SmsRouteError(
        400,
        "A valid JSON request body is required.",
        "request_body_required",
      );
    }

    const payload = validatePayload(requestPayload);
    const configuration = getTwilioConfiguration();

    const twilioResult = await sendThroughTwilio({
      to: payload.to,
      message: payload.message,
      configuration,
    });

    console.info("SitGuru admin SMS sent:", {
      requestId,
      actorMode: actor.mode,
      actorId: actor.id,
      actorEmail: actor.email,
      recipient: maskPhoneNumber(payload.to),
      recipientName: payload.recipientName || null,
      userId: payload.userId || null,
      purpose: payload.purpose,
      source: payload.source || actor.mode,
      messageSid: twilioResult.sid,
      status: twilioResult.status,
    });

    return NextResponse.json({
      ok: true,
      requestId,
      messageSid: twilioResult.sid,
      status: twilioResult.status,
      recipient: twilioResult.to,
      sender: twilioResult.from || null,
      messagingServiceSid: twilioResult.messagingServiceSid || null,
      purpose: payload.purpose,
      messageLength: payload.message.length,
    });
  } catch (error) {
    const status = error instanceof SmsRouteError ? error.status : 500;
    const code =
      error instanceof SmsRouteError
        ? error.code
        : "unexpected_sms_route_error";
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected SMS delivery error occurred.";

    console.error("SitGuru admin SMS route error:", {
      requestId,
      status,
      code,
      message,
    });

    return NextResponse.json(
      {
        ok: false,
        requestId,
        code,
        error: message,
      },
      { status },
    );
  }
}