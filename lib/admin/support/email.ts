import { escapeHtml, getStatusDetailLabel } from "@/lib/admin/support/utils";
import { mergeAdminBcc } from "@/lib/email/admin-bcc";
import type { SupportNotificationPayload } from "@/lib/admin/support/types";

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://sitguru.com"
  ).replace(/\/$/, "");
}

function getLogoUrl() {
  return `${getSiteUrl()}/images/sitguru-logo-cropped.png`;
}

function formatEmailDate(value = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(value);
}

function getEmailSubject(payload: SupportNotificationPayload) {
  const intakeNumber = payload.intakeNumber || "SitGuru Support Case";

  if (payload.notificationType === "created") {
    return `SitGuru Support Case Received — ${intakeNumber}`;
  }

  if (payload.notificationType === "converted") {
    return `SitGuru Support Case Escalated — ${intakeNumber}`;
  }

  if (payload.notificationType === "closed") {
    return `SitGuru Support Case Closed — ${intakeNumber}`;
  }

  return `SitGuru Support Case Updated — ${intakeNumber}`;
}

function getSupportHeading(payload: SupportNotificationPayload) {
  if (payload.notificationType === "created") {
    return "We received your SitGuru support request.";
  }

  if (payload.notificationType === "converted") {
    return "Your SitGuru case has been escalated.";
  }

  if (payload.notificationType === "closed") {
    return "Your SitGuru support case has been closed.";
  }

  return "Your SitGuru support case has been updated.";
}

function getSupportIntro(payload: SupportNotificationPayload) {
  if (payload.notificationType === "created") {
    return "Thank you for contacting SitGuru Support. We created a support case and our team will review your message.";
  }

  if (payload.notificationType === "converted") {
    return "Your support case has been escalated for dispute review. SitGuru will review the booking, payment, and service details before taking final action.";
  }

  if (payload.notificationType === "closed") {
    return "Your support case has been marked closed. You can reply to this email if you still need help.";
  }

  return "Your support case has been updated. The latest details are below.";
}

function getEmailText(payload: SupportNotificationPayload) {
  const senderName = payload.senderName || "there";
  const intakeNumber = payload.intakeNumber || "your support case";
  const status = getStatusDetailLabel(payload.status || "updated");
  const subject = payload.subject || "Support request";
  const disputeNumber = payload.disputeNumber || "";
  const message =
    payload.message ||
    "Our team will review the details and follow up as soon as possible.";

  return `Hi ${senderName},

${getSupportIntro(payload)}

Case number: ${intakeNumber}
Current status: ${status}
Subject: ${subject}${disputeNumber ? `\nDispute number: ${disputeNumber}` : ""}
Updated: ${formatEmailDate()}

Message from SitGuru:
${message}

Need help? Reply to this email or contact support@sitguru.com.

Thank you,
SitGuru Support
https://sitguru.com`;
}

function getEmailHtml(payload: SupportNotificationPayload) {
  const senderName = escapeHtml(payload.senderName || "there");
  const intakeNumber = escapeHtml(payload.intakeNumber || "your support case");
  const status = escapeHtml(getStatusDetailLabel(payload.status || "updated"));
  const subject = escapeHtml(payload.subject || "Support request");
  const disputeNumber = escapeHtml(payload.disputeNumber || "");
  const message = escapeHtml(
    payload.message ||
      "Our team will review the details and follow up as soon as possible."
  );
  const logoUrl = getLogoUrl();
  const heading = escapeHtml(getSupportHeading(payload));
  const intro = escapeHtml(getSupportIntro(payload));
  const updatedAt = escapeHtml(formatEmailDate());
  const siteUrl = getSiteUrl();

  return `
    <div style="margin:0; padding:0; background:#f6f8fb; font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; color:#111827;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f8fb; padding:32px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; overflow:hidden; border-radius:24px; border:1px solid #e5e7eb; background:#ffffff;">
              <tr>
                <td style="background:#020617; padding:28px 32px 24px;">
                  <img src="${logoUrl}" alt="SitGuru" width="150" style="display:block; width:150px; max-width:150px; height:auto; margin:0 0 22px; border:0;" />
                  <p style="margin:0 0 10px; color:#fda4af; font-size:12px; font-weight:800; letter-spacing:4px; text-transform:uppercase;">
                    Support Update
                  </p>
                  <h1 style="margin:0; color:#ffffff; font-size:28px; line-height:1.18; font-weight:900;">
                    ${heading}
                  </h1>
                </td>
              </tr>

              <tr>
                <td style="padding:32px;">
                  <p style="margin:0 0 18px; color:#111827; font-size:16px; line-height:1.6;">Hi ${senderName},</p>
                  <p style="margin:0 0 24px; color:#374151; font-size:16px; line-height:1.7;">${intro}</p>

                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate; border-spacing:0; border:1px solid #e5e7eb; border-radius:18px; overflow:hidden; background:#f9fafb;">
                    <tr>
                      <td style="width:40%; padding:16px 18px; border-bottom:1px solid #e5e7eb; color:#6b7280; font-size:12px; font-weight:900; letter-spacing:1px; text-transform:uppercase;">Case Number</td>
                      <td style="padding:16px 18px; border-bottom:1px solid #e5e7eb; color:#111827; font-size:15px; font-weight:800;">${intakeNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding:16px 18px; border-bottom:1px solid #e5e7eb; color:#6b7280; font-size:12px; font-weight:900; letter-spacing:1px; text-transform:uppercase;">Current Status</td>
                      <td style="padding:16px 18px; border-bottom:1px solid #e5e7eb; color:#111827; font-size:15px; font-weight:800;">${status}</td>
                    </tr>
                    <tr>
                      <td style="padding:16px 18px; border-bottom:1px solid #e5e7eb; color:#6b7280; font-size:12px; font-weight:900; letter-spacing:1px; text-transform:uppercase;">Subject</td>
                      <td style="padding:16px 18px; border-bottom:1px solid #e5e7eb; color:#111827; font-size:15px; font-weight:800;">${subject}</td>
                    </tr>
                    ${
                      disputeNumber
                        ? `<tr>
                            <td style="padding:16px 18px; border-bottom:1px solid #e5e7eb; color:#6b7280; font-size:12px; font-weight:900; letter-spacing:1px; text-transform:uppercase;">Dispute Number</td>
                            <td style="padding:16px 18px; border-bottom:1px solid #e5e7eb; color:#111827; font-size:15px; font-weight:800;">${disputeNumber}</td>
                          </tr>`
                        : ""
                    }
                    <tr>
                      <td style="padding:16px 18px; border-bottom:1px solid #e5e7eb; color:#6b7280; font-size:12px; font-weight:900; letter-spacing:1px; text-transform:uppercase;">Updated</td>
                      <td style="padding:16px 18px; border-bottom:1px solid #e5e7eb; color:#111827; font-size:15px; font-weight:800;">${updatedAt}</td>
                    </tr>
                    <tr>
                      <td style="padding:16px 18px; color:#6b7280; font-size:12px; font-weight:900; letter-spacing:1px; text-transform:uppercase; vertical-align:top;">Message</td>
                      <td style="padding:16px 18px; color:#111827; font-size:15px; font-weight:700; line-height:1.6;">${message.replace(/\n/g, "<br />")}</td>
                    </tr>
                  </table>

                  <p style="margin:24px 0 0; color:#374151; font-size:15px; line-height:1.7;">
                    Our support team will follow up if more information is needed.
                  </p>

                  <div style="margin:26px 0; padding:16px 18px; border:1px solid #fecdd3; border-radius:16px; background:#fff1f2; color:#be123c; font-size:14px; font-weight:800; line-height:1.5;">
                    Need help? Reply to this email or contact support@sitguru.com.
                  </div>

                  <p style="margin:0; color:#374151; font-size:15px; line-height:1.6;">
                    Thank you,<br />
                    <strong>SitGuru Support</strong>
                  </p>
                </td>
              </tr>

              <tr>
                <td style="background:#f3f4f6; padding:20px 32px; color:#6b7280; font-size:12px; line-height:1.6;">
                  <p style="margin:0 0 8px;">SitGuru.com support notification</p>
                  <p style="margin:0;">
                    <a href="${siteUrl}" style="color:#111827; font-weight:800; text-decoration:none;">${siteUrl}</a>
                    &nbsp;•&nbsp;
                    <a href="mailto:support@sitguru.com" style="color:#111827; font-weight:800; text-decoration:none;">support@sitguru.com</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export async function sendSupportNotification(
  payload: SupportNotificationPayload
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.SITGURU_SUPPORT_FROM ||
    "SitGuru Support <support@sitguru.com>";
  const replyTo = process.env.SITGURU_SUPPORT_EMAIL || "support@sitguru.com";

  if (!apiKey) {
    console.warn("Support email skipped: Missing RESEND_API_KEY.");
    return {
      ok: false,
      message: "Missing RESEND_API_KEY.",
    };
  }

  if (!payload.to) {
    console.warn("Support email skipped: Missing recipient.");
    return {
      ok: false,
      message: "Missing recipient.",
    };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from,
      to: payload.to,
      bcc: mergeAdminBcc(payload.to),
      subject: getEmailSubject(payload),
      html: getEmailHtml(payload),
      text: getEmailText(payload),
      replyTo,
    });

    if (error) {
      console.warn("Support email send failed:", error);
      return {
        ok: false,
        message: "Resend rejected the email.",
      };
    }

    console.log("Support email sent:", data);

    return {
      ok: true,
      message: "Email sent.",
    };
  } catch (error) {
    console.warn("Support email send skipped:", error);

    return {
      ok: false,
      message: "Email send failed.",
    };
  }
}
