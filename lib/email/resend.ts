import {
  getEmailBaseUrl,
  getTransactionalFromEmail,
  isProtectedPersonalFrom,
} from "@/lib/email/config";
import {
  buildMarketingUnsubscribeHeaders,
  isProbablyValidEmail,
  normalizeEmailAddress,
  sanitizeEmailHeaderValue,
} from "@/lib/email/headers";
import { isEmailSuppressedForMarketing } from "@/lib/email/suppression";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  /** Optional extra headers (e.g. List-Unsubscribe for marketing only). */
  headers?: Record<string, string>;
  /**
   * When true, require marketing unsubscribe headers to be present.
   * Auth/security mail must leave this false/undefined.
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
  headers,
  isMarketing,
  from: fromOverride,
}: SendEmailParams) {
  const apiKey = getRequiredEnv("RESEND_API_KEY");
  const from =
    sanitizeEmailHeaderValue(fromOverride || "") ||
    getRequiredEnv("RESEND_FROM_EMAIL") ||
    getTransactionalFromEmail();
  const resolvedReplyTo = sanitizeEmailHeaderValue(
    replyTo || process.env.RESEND_REPLY_TO_EMAIL || "",
  );
  const safeTo = normalizeEmailAddress(to);
  const safeSubject = sanitizeEmailHeaderValue(subject);

  if (!isProbablyValidEmail(safeTo)) {
    throw new Error("Invalid recipient email address.");
  }

  if (isProtectedPersonalFrom(from)) {
    throw new Error(
      "Refusing to send automated mail From a protected personal mailbox (jason@sitguru.com).",
    );
  }

  const resolvedHeaders = sanitizeHeaders(headers);
  if (isMarketing) {
    if (!resolvedHeaders?.["List-Unsubscribe"]) {
      throw new Error(
        "Marketing email requires List-Unsubscribe headers.",
      );
    }
    if (await isEmailSuppressedForMarketing(safeTo)) {
      throw new Error(
        "Recipient is suppressed for marketing email (bounce/complaint).",
      );
    }
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: safeTo,
      subject: safeSubject,
      html,
      text,
      ...(resolvedReplyTo ? { reply_to: resolvedReplyTo } : {}),
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
 * Helper for marketing sends that always attach one-click unsubscribe headers.
 * Uses the API route (not the HTML page) so List-Unsubscribe-Post one-click works.
 */
export function marketingUnsubscribeHeadersForToken(unsubscribeToken: string) {
  const base = getEmailBaseUrl();
  const unsubscribeUrl = `${base}/api/email-updates/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
  return buildMarketingUnsubscribeHeaders({ unsubscribeUrl });
}

export { getEmailBaseUrl, getTransactionalFromEmail };
