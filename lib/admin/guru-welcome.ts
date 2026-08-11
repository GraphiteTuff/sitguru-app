import { supabaseAdmin } from "@/lib/supabase/admin";

type GuruWelcomeChannelStatus = "sent" | "skipped" | "failed";

type GuruWelcomeDelivery = {
  status: GuruWelcomeChannelStatus;
  providerMessageId: string | null;
  reason: string | null;
};

export type SendAdminGuruWelcomeInput = {
  adminUserId: string;
  guruId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  missingFields?: string[];
};

export type SendAdminGuruWelcomeResult = {
  email: GuruWelcomeDelivery;
  sms: GuruWelcomeDelivery;
  missingFields: string[];
};

type RecordLike = Record<string, unknown>;

const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.APP_URL ||
  "https://www.sitguru.com"
).replace(/\/$/, "");

const SUPPORT_EMAIL = process.env.SITGURU_SUPPORT_EMAIL || "support@sitguru.com";
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  process.env.SITGURU_FROM_EMAIL ||
  "SitGuru <support@sitguru.com>";

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown): RecordLike {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : {};
}

function firstNameFrom(fullName: string, email: string) {
  const first = fullName.trim().split(/\s+/).filter(Boolean)[0];
  if (first) return first;

  const emailName = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  return emailName?.split(/\s+/)[0] || "there";
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (value.startsWith("+") && digits.length >= 10) return `+${digits}`;

  return "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function boolValue(record: RecordLike, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "boolean") return value;
    if (value === 1 || value === "1" || value === "true") return true;
    if (value === 0 || value === "0" || value === "false") return false;
  }

  return false;
}

function stringValue(record: RecordLike, keys: string[]) {
  for (const key of keys) {
    const value = asTrimmedString(record[key]);
    if (value) return value;
  }

  return "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function loadContactPreferences(userId: string) {
  const [preferencesResult, profileResult, guruResult, authResult] =
    await Promise.all([
      supabaseAdmin
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      supabaseAdmin.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabaseAdmin.from("gurus").select("*").eq("user_id", userId).maybeSingle(),
      supabaseAdmin.auth.admin.getUserById(userId),
    ]);

  const preferences = asRecord(preferencesResult.data);
  const profile = asRecord(profileResult.data);
  const guru = asRecord(guruResult.data);
  const authUser = authResult.data?.user;

  const emailVerified = Boolean(authUser?.email_confirmed_at);
  const phoneVerified = Boolean(authUser?.phone_confirmed_at);

  const smsConsent =
    preferences.sms_enabled === true ||
    boolValue(profile, [
      "transactional_sms_opt_in",
      "sms_opt_in",
      "sms_consent",
      "phone_notifications_enabled",
      "sms_notifications_enabled",
    ]) ||
    boolValue(guru, [
      "transactional_sms_opt_in",
      "sms_opt_in",
      "sms_consent",
      "phone_notifications_enabled",
      "sms_notifications_enabled",
    ]);

  const smsConsentAt =
    stringValue(preferences, ["sms_consent_at"]) ||
    stringValue(profile, [
      "sms_consent_at",
      "transactional_sms_opt_in_at",
      "sms_opt_in_at",
      "phone_notifications_enabled_at",
    ]) ||
    stringValue(guru, [
      "sms_consent_at",
      "transactional_sms_opt_in_at",
      "sms_opt_in_at",
      "phone_notifications_enabled_at",
    ]);

  return {
    emailVerified,
    phoneVerified,
    emailEnabled:
      preferences.email_enabled !== false && !preferences.email_opted_out_at,
    smsEnabled:
      smsConsent &&
      Boolean(smsConsentAt || preferences.sms_enabled === true) &&
      !preferences.sms_opted_out_at,
  };
}

function buildWelcomeMessage({
  fullName,
  email,
  missingFields,
}: {
  fullName: string;
  email: string;
  missingFields: string[];
}) {
  const firstName = firstNameFrom(fullName, email);
  const setupUrl = `${SITE_URL}/guru/dashboard/profile?setup=1`;
  const dashboardUrl = `${SITE_URL}/guru/dashboard`;
  const successCenterUrl = `${SITE_URL}/guru-success-center`;
  const normalizedMissing = Array.from(
    new Set(missingFields.map((item) => item.trim()).filter(Boolean)),
  );

  const nextStepsText = normalizedMissing.length
    ? normalizedMissing.map((item) => `• ${item}`).join("\n")
    : "• Review your profile and keep your availability, services, and pricing current.";

  const subject = `Welcome to SitGuru, ${firstName}! 🐾 Let’s get your Guru profile ready`;

  const text = `Hi ${firstName}! 👋🐾

Welcome to SitGuru — we’re really happy to have you joining our Guru community!

Your progress is saved. There’s no pressure to finish everything at once, but completing the remaining parts of your Guru profile helps Pet Parents understand who you are, what care you provide, and when they can book you.

Your next easy wins:
${nextStepsText}

As a SitGuru Guru, your workspace is built to help you run and grow your pet-care business. You can:

• Be discovered by Pet Parents searching for care in your area
• Set and manage your services, pricing, care radius, and availability
• Receive and manage booking requests
• Message Pet Parents directly
• Review important pet and care information before and during bookings
• Use PawReports and care updates to keep Pet Parents connected
• Track upcoming and completed care
• Track earnings and payout readiness
• Build reviews and your SitGuru reputation
• Use the Guru Success Center for guidance and growth
• Build ongoing relationships with local Pet Parents

Continue your Guru setup:
${setupUrl}

Open your Guru dashboard:
${dashboardUrl}

Guru Success Center:
${successCenterUrl}

Need a hand? We’re here. Reach us anytime at ${SUPPORT_EMAIL}.

Welcome to the community, ${firstName}! 🎉🐶🐱

The SitGuru Team
Great care starts with the right connection.
SitGuru.com
@SitGuruOfficial`;

  const missingItemsHtml = normalizedMissing.length
    ? normalizedMissing
        .slice(0, 8)
        .map((item) => `<li style="margin:0 0 8px 0;">${escapeHtml(item)}</li>`)
        .join("")
    : `<li style="margin:0 0 8px 0;">Review your profile and keep your availability, services, and pricing current.</li>`;

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f7fbf8;font-family:Arial,Helvetica,sans-serif;color:#17351f;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px;background:#f7fbf8;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border:1px solid #dbe8d5;border-radius:28px;overflow:hidden;">
            <tr>
              <td style="padding:30px;background:linear-gradient(135deg,#08b881 0%,#78ded0 50%,#b8e5ff 100%);">
                <div style="font-size:12px;font-weight:900;letter-spacing:1.7px;text-transform:uppercase;color:#073b33;">SitGuru</div>
                <h1 style="margin:10px 0 0 0;font-size:32px;line-height:1.12;color:#061329;">Welcome, ${escapeHtml(firstName)}! 🐾</h1>
                <p style="margin:12px 0 0 0;font-size:16px;line-height:1.6;color:#12312b;font-weight:700;">Your Guru space is ready, and your progress is saved.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:30px;">
                <p style="margin:0;font-size:16px;line-height:1.75;color:#475569;">We’re really happy to have you joining the SitGuru Guru community. There’s no pressure to finish everything at once, but a complete profile helps Pet Parents get to know you, understand your care, and feel comfortable reaching out and booking.</p>

                <div style="margin-top:22px;border:1px solid #bbf7d0;background:#f0fdf4;border-radius:20px;padding:20px;">
                  <div style="font-size:12px;font-weight:900;letter-spacing:1.3px;text-transform:uppercase;color:#087449;">Your next easy wins</div>
                  <ul style="margin:14px 0 0 0;padding-left:22px;color:#334155;line-height:1.65;">${missingItemsHtml}</ul>
                </div>

                <div style="margin-top:24px;">
                  <h2 style="margin:0;font-size:22px;color:#17351f;">Your SitGuru Guru workspace can help you</h2>
                  <ul style="margin:14px 0 0 0;padding-left:22px;color:#475569;line-height:1.75;">
                    <li>Be discovered by Pet Parents searching for local care</li>
                    <li>Manage services, pricing, care radius, and availability</li>
                    <li>Receive bookings and message Pet Parents directly</li>
                    <li>Review pet and care information for each booking</li>
                    <li>Share PawReports and care updates during service</li>
                    <li>Track care, earnings, payouts, reviews, and reputation</li>
                    <li>Use the Guru Success Center to learn and grow</li>
                    <li>Build ongoing relationships with local Pet Parents</li>
                  </ul>
                </div>

                <div style="text-align:center;padding:28px 0 8px 0;">
                  <a href="${escapeHtml(setupUrl)}" style="display:inline-block;background:#087449;color:#ffffff;text-decoration:none;border-radius:999px;padding:15px 26px;font-size:15px;font-weight:900;">Continue my Guru setup</a>
                </div>

                <div style="margin-top:18px;border-radius:18px;background:#f8fafc;padding:16px 18px;color:#64748b;font-size:14px;line-height:1.7;">
                  Need a hand? We’re here. Reach us anytime at <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}" style="color:#087449;font-weight:800;text-decoration:none;">${escapeHtml(SUPPORT_EMAIL)}</a>.
                </div>

                <p style="margin:24px 0 0 0;font-size:15px;line-height:1.7;color:#475569;">Welcome to the community, ${escapeHtml(firstName)}! 🎉🐶🐱<br /><strong style="color:#17351f;">The SitGuru Team</strong><br />Great care starts with the right connection.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const missingPreview = normalizedMissing.slice(0, 4).join(", ");
  const sms = `Hey ${firstName}! 👋🐾 Welcome to SitGuru! Your Guru profile is taking shape and your progress is saved. 💚${
    missingPreview ? ` Next up: ${missingPreview}.` : ""
  } Use your Guru workspace for bookings, messages, availability, PawReports, earnings, payouts and the Guru Success Center. Continue here: ${setupUrl} Need a hand? We’re here! — SitGuru. Reply STOP to opt out.`;

  return { subject, text, html, sms };
}

async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<GuruWelcomeDelivery> {
  if (!isValidEmail(to)) {
    return {
      status: "skipped",
      providerMessageId: null,
      reason: "A valid Guru email address is not available.",
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      status: "failed",
      providerMessageId: null,
      reason: "RESEND_API_KEY is missing.",
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        reply_to: SUPPORT_EMAIL,
        bcc: ["jason@sitguru.com", "nette@sitguru.com", "support@sitguru.com"],
        subject,
        text,
        html,
      }),
    });

    const payload = (await response.json().catch(() => null)) as RecordLike | null;

    if (!response.ok) {
      return {
        status: "failed",
        providerMessageId: null,
        reason: String(payload?.message || payload?.error || "Resend email delivery failed."),
      };
    }

    return {
      status: "sent",
      providerMessageId: asTrimmedString(payload?.id) || null,
      reason: null,
    };
  } catch (error) {
    return {
      status: "failed",
      providerMessageId: null,
      reason: error instanceof Error ? error.message : "Resend email delivery failed.",
    };
  }
}

async function sendSms({ to, body }: { to: string; body: string }): Promise<GuruWelcomeDelivery> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const from = process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_FROM_PHONE_NUMBER;
  const normalizedTo = normalizePhone(to);

  if (!normalizedTo) {
    return {
      status: "skipped",
      providerMessageId: null,
      reason: "A valid Guru phone number is not available.",
    };
  }

  if (!accountSid || !authToken || (!messagingServiceSid && !from)) {
    return {
      status: "failed",
      providerMessageId: null,
      reason: "Twilio SMS credentials or sender configuration are missing.",
    };
  }

  try {
    const form = new URLSearchParams({
      To: normalizedTo,
      Body: body.slice(0, 1500),
      ...(messagingServiceSid
        ? { MessagingServiceSid: messagingServiceSid }
        : { From: from as string }),
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      },
    );

    const payload = (await response.json().catch(() => null)) as RecordLike | null;

    if (!response.ok) {
      return {
        status: "failed",
        providerMessageId: null,
        reason: String(payload?.message || "Twilio SMS delivery failed."),
      };
    }

    return {
      status: "sent",
      providerMessageId: asTrimmedString(payload?.sid) || null,
      reason: null,
    };
  } catch (error) {
    return {
      status: "failed",
      providerMessageId: null,
      reason: error instanceof Error ? error.message : "Twilio SMS delivery failed.",
    };
  }
}

async function logDelivery({
  input,
  channel,
  delivery,
  subject,
  body,
}: {
  input: SendAdminGuruWelcomeInput;
  channel: "email" | "sms";
  delivery: GuruWelcomeDelivery;
  subject: string;
  body: string;
}) {
  try {
    await supabaseAdmin.from("communication_logs").insert({
      user_id: input.userId,
      role_context: "guru",
      channel,
      direction: "outbound",
      subject,
      body,
      status: delivery.status,
      provider_message_id: delivery.providerMessageId,
      error_message: delivery.reason,
      related_profile_completion_status:
        input.missingFields && input.missingFields.length > 0 ? "incomplete" : "complete",
      related_missing_fields: input.missingFields || [],
      automation_key: `admin_guru_welcome:${input.userId}:${Date.now()}:${channel}`,
      metadata: {
        guru_id: input.guruId,
        admin_user_id: input.adminUserId,
        manual_admin_welcome: true,
      },
      sent_at: delivery.status === "sent" ? new Date().toISOString() : null,
    });
  } catch (error) {
    console.warn("Guru welcome communication log skipped:", error);
  }
}

export async function sendAdminGuruWelcome(
  input: SendAdminGuruWelcomeInput,
): Promise<SendAdminGuruWelcomeResult> {
  const missingFields = Array.from(
    new Set((input.missingFields || []).map((item) => item.trim()).filter(Boolean)),
  );
  const message = buildWelcomeMessage({
    fullName: input.fullName,
    email: input.email,
    missingFields,
  });
  const preferences = await loadContactPreferences(input.userId);

  const emailDelivery =
    preferences.emailVerified && preferences.emailEnabled
      ? await sendEmail({
          to: input.email,
          subject: message.subject,
          text: message.text,
          html: message.html,
        })
      : {
          status: "skipped" as const,
          providerMessageId: null,
          reason: !preferences.emailVerified
            ? "The Guru email address is not verified."
            : "Email notifications are disabled or opted out.",
        };

  const smsDelivery =
    preferences.phoneVerified && preferences.smsEnabled
      ? await sendSms({ to: input.phone, body: message.sms })
      : {
          status: "skipped" as const,
          providerMessageId: null,
          reason: !preferences.phoneVerified
            ? "The Guru phone number is not verified."
            : "SMS consent is not available or SMS notifications are opted out.",
        };

  await Promise.all([
    logDelivery({
      input: { ...input, missingFields },
      channel: "email",
      delivery: emailDelivery,
      subject: message.subject,
      body: message.text,
    }),
    logDelivery({
      input: { ...input, missingFields },
      channel: "sms",
      delivery: smsDelivery,
      subject: "SitGuru Guru welcome",
      body: message.sms,
    }),
  ]);

  return {
    email: emailDelivery,
    sms: smsDelivery,
    missingFields,
  };
}
