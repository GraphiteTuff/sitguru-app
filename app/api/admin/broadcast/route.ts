import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { requireAdminUser } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/* =========================================
   SitGuru Admin Broadcast
   Internal announcement email to the team.
   Auth: requireAdminUser (Bearer + admin role)
   Mail: Resend via RESEND_* env map
========================================= */

type BroadcastPayload = {
  subject?: string;
  message?: string;
  /** Optional override. Defaults to the configured team inbox list. */
  to?: string | string[];
};

type BroadcastResult = {
  ok: true;
  id: string | null;
  recipientCount: number;
  subject: string;
};

/* -----------------------------------------
   Helpers — clean parsing & safe strings
----------------------------------------- */

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function splitEmailList(value?: string | null) {
  if (!value) return [];

  return value
    .split(/[,;\n]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function uniqueEmails(emails: string[]) {
  return Array.from(new Set(emails.map((email) => email.trim().toLowerCase())))
    .filter(isValidEmail);
}

/**
 * Resolve team recipients from the SitGuru .env map.
 * Prefer broadcast-specific lists, then fall back to shared admin alerts.
 */
function getDefaultTeamEmails() {
  const configured =
    safeString(process.env.SITGURU_BROADCAST_EMAILS) ||
    safeString(process.env.ADMIN_EMAILS) ||
    safeString(process.env.SITGURU_ADMIN_ALERT_EMAILS) ||
    safeString(process.env.ADMIN_ALERT_EMAILS) ||
    safeString(process.env.SITGURU_ADMIN_EMAIL) ||
    safeString(process.env.ADMIN_EMAIL) ||
    "";

  return uniqueEmails(splitEmailList(configured));
}

function getResendFromEmail() {
  return (
    safeString(process.env.RESEND_FROM_EMAIL) ||
    safeString(process.env.SITGURU_ALERT_FROM_EMAIL) ||
    "SitGuru <alerts@sitguru.com>"
  );
}

function getResendReplyToEmail() {
  return (
    safeString(process.env.RESEND_REPLY_TO_EMAIL) ||
    safeString(process.env.SITGURU_SUPPORT_EMAIL) ||
    "support@sitguru.com"
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMessageAsHtml(message: string) {
  return escapeHtml(message).replaceAll("\n", "<br />");
}

function resolveRecipients(payload: BroadcastPayload) {
  if (Array.isArray(payload.to)) {
    return uniqueEmails(payload.to.map((item) => safeString(item)));
  }

  const singleOrList = safeString(payload.to);
  if (singleOrList) {
    return uniqueEmails(splitEmailList(singleOrList));
  }

  return getDefaultTeamEmails();
}

function mapAuthErrorStatus(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("missing authorization") ||
    normalized.includes("unable to verify your account")
  ) {
    return 401;
  }

  if (
    normalized.includes("admin access required") ||
    normalized.includes("not active") ||
    normalized.includes("unable to verify admin profile")
  ) {
    return 403;
  }

  return 401;
}

/* -----------------------------------------
   Email templates — Plus Jakarta Sans stack
   Matches SitGuru master typography lock.
----------------------------------------- */

const EMAIL_FONT_STACK =
  "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function buildBroadcastText({
  subject,
  message,
  senderLabel,
}: {
  subject: string;
  message: string;
  senderLabel: string;
}) {
  return [
    "SitGuru Team Broadcast",
    "",
    subject,
    "",
    message,
    "",
    `Sent by: ${senderLabel}`,
    "—",
    "SitGuru Admin · Internal announcement",
  ].join("\n");
}

function buildBroadcastHtml({
  subject,
  message,
  senderLabel,
}: {
  subject: string;
  message: string;
  senderLabel: string;
}) {
  const safeSubject = escapeHtml(subject);
  const safeMessage = formatMessageAsHtml(message);
  const safeSender = escapeHtml(senderLabel);

  return `
    <div style="margin:0;padding:24px;background:#f8fcfd;font-family:${EMAIL_FONT_STACK};color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;overflow:hidden;border:1px solid #dbe8ef;border-radius:28px;background:#ffffff;box-shadow:0 18px 48px rgba(15,23,42,0.06);">
        <div style="padding:28px 28px 20px;background:linear-gradient(135deg,#064e3b 0%,#047857 55%,#10d8a6 140%);color:#ffffff;">
          <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#a7f3d0;">
            SitGuru Team Broadcast
          </p>
          <h1 style="margin:12px 0 0;font-size:28px;line-height:1.15;font-weight:800;letter-spacing:-0.04em;">
            ${safeSubject}
          </h1>
        </div>

        <div style="padding:28px;">
          <p style="margin:0;font-size:15px;line-height:1.7;font-weight:600;color:#334155;">
            ${safeMessage}
          </p>

          <div style="margin-top:24px;padding:16px 18px;border:1px solid #d1fae5;border-radius:18px;background:#ecfdf5;">
            <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#047857;">
              Sent by
            </p>
            <p style="margin:6px 0 0;font-size:14px;font-weight:800;color:#0f172a;">
              ${safeSender}
            </p>
          </div>
        </div>

        <div style="padding:16px 28px 22px;border-top:1px solid #eef7f8;background:#f8fcfd;">
          <p style="margin:0;font-size:12px;font-weight:600;color:#64748b;">
            SitGuru Admin · Internal announcement only
          </p>
        </div>
      </div>
    </div>
  `;
}

/* -----------------------------------------
   POST /api/admin/broadcast
----------------------------------------- */

export async function POST(request: NextRequest) {
  try {
    const { adminUser } = await requireAdminUser(request);

    const apiKey = safeString(process.env.RESEND_API_KEY);
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing RESEND_API_KEY. Broadcast email cannot be sent." },
        { status: 500 },
      );
    }

    const payload = (await request.json().catch(() => null)) as
      | BroadcastPayload
      | null;

    if (!payload) {
      return NextResponse.json(
        { error: "Missing request body." },
        { status: 400 },
      );
    }

    const subject = safeString(payload.subject);
    const message = safeString(payload.message);

    if (!subject) {
      return NextResponse.json(
        { error: "Announcement subject is required." },
        { status: 400 },
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Announcement message is required." },
        { status: 400 },
      );
    }

    if (subject.length > 180) {
      return NextResponse.json(
        { error: "Subject must be 180 characters or fewer." },
        { status: 400 },
      );
    }

    if (message.length > 8000) {
      return NextResponse.json(
        { error: "Message must be 8000 characters or fewer." },
        { status: 400 },
      );
    }

    const recipients = resolveRecipients(payload);

    if (recipients.length === 0) {
      return NextResponse.json(
        {
          error:
            "No team recipients found. Set SITGURU_BROADCAST_EMAILS or ADMIN_EMAILS, or pass a valid `to` list.",
        },
        { status: 400 },
      );
    }

    const senderLabel =
      safeString(adminUser.email) ||
      safeString(adminUser.id) ||
      "SitGuru Admin";

    const emailSubject = `SitGuru Broadcast: ${subject}`;
    const html = buildBroadcastHtml({
      subject,
      message,
      senderLabel,
    });
    const text = buildBroadcastText({
      subject,
      message,
      senderLabel,
    });

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: getResendFromEmail(),
      to: recipients,
      replyTo: getResendReplyToEmail(),
      subject: emailSubject,
      html,
      text,
    });

    if (error) {
      console.error("Admin broadcast email failed:", error);

      return NextResponse.json(
        {
          error:
            safeString((error as { message?: string }).message) ||
            "Broadcast email could not be sent.",
        },
        { status: 502 },
      );
    }

    const result: BroadcastResult = {
      ok: true,
      id: data?.id || null,
      recipientCount: recipients.length,
      subject: emailSubject,
    };

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected broadcast error.";

    console.error("Admin broadcast route error:", message);

    return NextResponse.json(
      { error: message },
      { status: mapAuthErrorStatus(message) },
    );
  }
}
