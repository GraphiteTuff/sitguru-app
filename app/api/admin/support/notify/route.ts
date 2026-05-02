import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

type NotifyPayload = {
  to?: string;
  senderName?: string;
  intakeNumber?: string;
  subject?: string;
  status?: string;
  message?: string;
  notificationType?: "created" | "updated" | "closed" | "converted";
  disputeNumber?: string;
};

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    new: "New",
    in_review: "In Review",
    waiting_response: "Waiting Response",
    converted: "Converted to Dispute",
    closed: "Closed",
  };

  return labels[status] || status || "Updated";
}

function getEmailSubject(payload: NotifyPayload) {
  const intakeNumber = safeString(payload.intakeNumber) || "SitGuru Support Case";

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

function getEmailHtml(payload: NotifyPayload) {
  const senderName = safeString(payload.senderName) || "there";
  const intakeNumber = safeString(payload.intakeNumber) || "your support case";
  const status = getStatusLabel(safeString(payload.status));
  const message = safeString(payload.message);
  const subject = safeString(payload.subject);
  const disputeNumber = safeString(payload.disputeNumber);

  const intro =
    payload.notificationType === "created"
      ? `We received your message and created support case <strong>${intakeNumber}</strong>.`
      : payload.notificationType === "converted"
        ? `Your support case <strong>${intakeNumber}</strong> has been escalated for dispute review.`
        : payload.notificationType === "closed"
          ? `Your support case <strong>${intakeNumber}</strong> has been marked closed.`
          : `Your support case <strong>${intakeNumber}</strong> has been updated.`;

  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <div style="max-width: 640px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden;">
        <div style="background: #020617; color: white; padding: 24px;">
          <h1 style="margin: 0; font-size: 28px;">SitGuru Support</h1>
          <p style="margin: 8px 0 0; color: #a7f3d0;">Trusted Pet Care. Simplified.</p>
        </div>

        <div style="padding: 24px;">
          <p>Hi ${senderName},</p>

          <p>${intro}</p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Case:</strong> ${intakeNumber}</p>
            <p style="margin: 8px 0 0;"><strong>Status:</strong> ${status}</p>
            ${subject ? `<p style="margin: 8px 0 0;"><strong>Subject:</strong> ${subject}</p>` : ""}
            ${disputeNumber ? `<p style="margin: 8px 0 0;"><strong>Dispute:</strong> ${disputeNumber}</p>` : ""}
          </div>

          ${
            message
              ? `<p><strong>Message from SitGuru:</strong></p><p>${message.replace(/\n/g, "<br />")}</p>`
              : `<p>Our team will review the details and follow up as soon as possible.</p>`
          }

          <p>Thank you,<br />SitGuru Support</p>
        </div>

        <div style="background: #f8fafc; color: #64748b; font-size: 12px; padding: 16px 24px;">
          <p style="margin: 0;">SitGuru.com</p>
          <p style="margin: 4px 0 0;">This message was sent from the SitGuru support system.</p>
        </div>
      </div>
    </div>
  `;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const from =
      process.env.SITGURU_SUPPORT_FROM ||
      "SitGuru Support <support@sitguru.com>";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing RESEND_API_KEY." },
        { status: 500 }
      );
    }

    const payload = (await req.json().catch(() => null)) as NotifyPayload | null;

    if (!payload) {
      return NextResponse.json(
        { error: "Missing request body." },
        { status: 400 }
      );
    }

    const to = safeString(payload.to);

    if (!to) {
      return NextResponse.json(
        { error: "Recipient email is required." },
        { status: 400 }
      );
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: getEmailSubject(payload),
      html: getEmailHtml(payload),
      replyTo: process.env.SITGURU_SUPPORT_EMAIL || "support@sitguru.com",
    });

    if (error) {
      console.error("Support email send failed:", error);

      return NextResponse.json(
        { error: "Failed to send support email." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      emailId: data?.id || null,
    });
  } catch (error) {
    console.error("Support notify route error:", error);

    return NextResponse.json(
      { error: "Failed to send support notification." },
      { status: 500 }
    );
  }
}
