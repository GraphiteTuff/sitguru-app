import { mergeAdminBcc } from "@/lib/email/admin-bcc";
import { getEmailBaseUrl, isProtectedPersonalFrom } from "@/lib/email/config";
import {
  buildMarketingUnsubscribeHeaders,
  isProbablyValidEmail,
  normalizeEmailAddress,
  sanitizeEmailHeaderValue,
} from "@/lib/email/headers";
import { isEmailSuppressedForMarketing } from "@/lib/email/suppression";

type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
  }>;
  /** Optional extra headers (for example List-Unsubscribe on marketing mail). */
  headers?: Record<string, string>;
  /**
   * When true, require marketing unsubscribe headers and honor suppressions.
   * Auth, security, and OTP mail must leave this false.
   */
  isMarketing?: boolean;
  from?: string;
};

type ResendSendResponse = {
  id?: string;
  error?: {
    message?: string;
    name?: string;
  };
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }

  return value;
}

function sanitizeHeaders(
  headers: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!headers) return undefined;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const safeKey = sanitizeEmailHeaderValue(key);
    const safeValue = sanitizeEmailHeaderValue(value);
    if (safeKey && safeValue) out[safeKey] = safeValue;
  }
  return Object.keys(out).length ? out : undefined;
}

export async function sendSitGuruEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  bcc,
  attachments,
  headers,
  isMarketing,
  from: fromOverride,
}: SendEmailParams) {
  const apiKey = getRequiredEnv("RESEND_API_KEY");
  const from =
    sanitizeEmailHeaderValue(fromOverride || "") ||
    getRequiredEnv("RESEND_FROM_EMAIL");
  const resolvedReplyTo = sanitizeEmailHeaderValue(
    replyTo || process.env.RESEND_REPLY_TO_EMAIL || "",
  );
  const resolvedBcc = mergeAdminBcc(to, bcc);
  const safeSubject = sanitizeEmailHeaderValue(subject);

  if (isProtectedPersonalFrom(from)) {
    throw new Error(
      "Refusing to send automated mail From a protected personal mailbox (jason@sitguru.com).",
    );
  }

  const resolvedHeaders = sanitizeHeaders(headers);
  let resolvedTo: string | string[] = to;

  if (isMarketing) {
    if (Array.isArray(to)) {
      throw new Error("Marketing email requires a single recipient.");
    }
    const safeTo = normalizeEmailAddress(to);
    if (!isProbablyValidEmail(safeTo)) {
      throw new Error("Invalid recipient email address.");
    }
    if (!resolvedHeaders?.["List-Unsubscribe"]) {
      throw new Error("Marketing email requires List-Unsubscribe headers.");
    }
    if (await isEmailSuppressedForMarketing(safeTo)) {
      throw new Error(
        "Recipient is suppressed for marketing email (bounce/complaint).",
      );
    }
    resolvedTo = safeTo;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: resolvedTo,
      subject: safeSubject,
      html,
      text,
      ...(resolvedReplyTo ? { reply_to: resolvedReplyTo } : {}),
      ...(resolvedBcc.length > 0 ? { bcc: resolvedBcc } : {}),
      ...(attachments?.length
        ? {
            attachments: attachments.map((file) => ({
              filename: file.filename,
              content: file.content,
              content_type: file.contentType,
            })),
          }
        : {}),
      ...(resolvedHeaders ? { headers: resolvedHeaders } : {}),
    }),
  });

  const data = (await response.json().catch(() => ({}))) as ResendSendResponse;

  if (!response.ok || data.error) {
    throw new Error(
      data.error?.message || `Resend email failed with status ${response.status}`,
    );
  }

  return {
    id: data.id || null,
  };
}

/**
 * One-click unsubscribe headers for marketing sends.
 * The URL hits the API route so List-Unsubscribe-Post can unsubscribe without a page load.
 */
export function marketingUnsubscribeHeadersForToken(unsubscribeToken: string) {
  const base = getEmailBaseUrl();
  const unsubscribeUrl = `${base}/api/email-updates/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
  return buildMarketingUnsubscribeHeaders({ unsubscribeUrl });
}

export { getEmailBaseUrl };
