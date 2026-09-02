import { mergeAdminBcc } from "@/lib/email/admin-bcc";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  bcc?: string | string[];
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

export async function sendSitGuruEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  bcc,
}: SendEmailParams) {
  const apiKey = getRequiredEnv("RESEND_API_KEY");
  const from = getRequiredEnv("RESEND_FROM_EMAIL");
  const resolvedReplyTo = replyTo || process.env.RESEND_REPLY_TO_EMAIL;
  const resolvedBcc = mergeAdminBcc(to, bcc);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
      reply_to: resolvedReplyTo,
      ...(resolvedBcc.length > 0 ? { bcc: resolvedBcc } : {}),
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