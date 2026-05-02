import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SupportRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type SupportCase = {
  id: string;
  intakeNumber: string;
  source: string;
  supportEmail: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  subject: string;
  messageBody: string;
  relatedBookingId: string;
  caseType: string;
  caseTypeLabel: string;
  priority: string;
  priorityLabel: string;
  status: string;
  statusLabel: string;
  convertToDispute: boolean;
  linkedDisputeId: string;
  notes: string;
  financialAction: string;
  financialActionLabel: string;
  financialAmount: number;
  financialNote: string;
  refundRequested: boolean;
  refundAmount: number;
  financialImpact: number;
  createdAt: string;
  updatedAt: string;
};

type SupportNotificationPayload = {
  to: string;
  senderName?: string;
  intakeNumber?: string;
  subject?: string;
  status?: string;
  message?: string;
  notificationType?: "created" | "updated" | "closed" | "converted";
  disputeNumber?: string;
};

const CASE_TYPE_LABELS: Record<string, string> = {
  general_support: "General Support",
  booking_help: "Booking Help",
  payment_help: "Payment Help",
  guru_support: "Guru Support",
  customer_support: "Customer Support",
  platform_issue: "Platform Issue",
  refund_request: "Refund Request",
  dispute_request: "Dispute Request",
  trust_safety: "Trust & Safety",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  in_review: "In Review",
  waiting_response: "Waiting Response",
  converted: "Converted",
  closed: "Closed",
};

const FINANCIAL_ACTION_LABELS: Record<string, string> = {
  none: "No Financial Action",
  customer_credit: "Customer Credit / Refund",
  customer_debit: "Customer Debit / Charge",
  guru_credit: "Guru Credit",
  guru_debit: "Guru Debit",
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(String(value || "").replace(/[^0-9.-]/g, ""));

  return Number.isFinite(parsed) ? parsed : 0;
}

function moneyExact(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(value));
}

function getFinancialActionLabel(value: string) {
  return (
    FINANCIAL_ACTION_LABELS[value] ||
    value.replace(/_/g, " ") ||
    "No Financial Action"
  );
}

function extractMoneyAmount(value: string) {
  const match = value.match(/\$\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/);

  if (!match?.[1]) {
    return 0;
  }

  const parsed = Number(match[1].replace(/,/g, ""));

  return Number.isFinite(parsed) ? parsed : 0;
}

function isRefundAction(action: string) {
  return action === "customer_credit";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function shouldSendEmail(formData: FormData) {
  return formData.get("sendEmail") === "on";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDateShort(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeShort(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function isToday(value?: string | null) {
  if (!value) return false;

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return false;

  const now = new Date();

  return (
    parsed.getFullYear() === now.getFullYear() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getDate() === now.getDate()
  );
}

function getCaseTypeLabel(value: string) {
  return CASE_TYPE_LABELS[value] || value.replace(/_/g, " ") || "General Support";
}

function getPriorityLabel(value: string) {
  return PRIORITY_LABELS[value] || value.replace(/_/g, " ") || "Normal";
}

function getStatusLabel(value: string) {
  return STATUS_LABELS[value] || value.replace(/_/g, " ") || "New";
}

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
  const status = getStatusLabel(payload.status || "updated");
  const subject = payload.subject || "Support request";
  const disputeNumber = payload.disputeNumber || "";
  const message = payload.message || "Our team will review the details and follow up as soon as possible.";

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
  const status = escapeHtml(getStatusLabel(payload.status || "updated"));
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
    <div style="margin:0; padding:0; background:#f6f8fb; font-family: Arial, Helvetica, sans-serif; color:#111827;">
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

async function sendSupportNotification(payload: SupportNotificationPayload) {
  "use server";

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
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from,
      to: payload.to,
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

function makeIntakeNumber() {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);

  return `SUP-${stamp}`;
}

function makeDisputeNumber() {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);

  return `DP-${stamp}`;
}

function mapCaseTypeToDisputeType(caseType: string) {
  if (caseType === "refund_request") return "refund_review";
  if (caseType === "trust_safety") return "trust_safety";
  if (caseType === "payment_help") return "payment_issue";
  if (caseType === "booking_help") return "booking_issue";
  if (caseType === "dispute_request") return "service_complaint";

  return "service_complaint";
}

function normalizeSupportCase(row: SupportRow, index: number): SupportCase {
  const caseType = asTrimmedString(row.case_type) || "general_support";
  const priority = asTrimmedString(row.priority) || "normal";
  const status = asTrimmedString(row.status) || "new";

  return {
    id: asTrimmedString(row.id),
    intakeNumber:
      asTrimmedString(row.intake_number) ||
      `SUP-${String(index + 1).padStart(4, "0")}`,
    source: asTrimmedString(row.source) || "support_email",
    supportEmail: asTrimmedString(row.support_email) || "support@sitguru.com",
    senderName: asTrimmedString(row.sender_name) || "Sender",
    senderEmail: asTrimmedString(row.sender_email),
    senderPhone: asTrimmedString(row.sender_phone),
    subject: asTrimmedString(row.subject) || "Support request",
    messageBody: asTrimmedString(row.message_body),
    relatedBookingId: asTrimmedString(row.related_booking_id),
    caseType,
    caseTypeLabel: getCaseTypeLabel(caseType),
    priority,
    priorityLabel: getPriorityLabel(priority),
    status,
    statusLabel: getStatusLabel(status),
    convertToDispute: Boolean(row.convert_to_dispute),
    linkedDisputeId: asTrimmedString(row.linked_dispute_id),
    notes: asTrimmedString(row.notes),
    financialAction: asTrimmedString(row.financial_action) || "none",
    financialActionLabel: getFinancialActionLabel(
      asTrimmedString(row.financial_action) || "none"
    ),
    financialAmount: toNumber(row.financial_amount),
    financialNote: asTrimmedString(row.financial_note),
    refundRequested: Boolean(row.refund_requested),
    refundAmount: toNumber(row.refund_amount),
    financialImpact: toNumber(row.financial_impact),
    createdAt: asTrimmedString(row.created_at),
    updatedAt: asTrimmedString(row.updated_at),
  };
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Support intake query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Support intake query skipped for ${label}:`, error);
    return [];
  }
}

async function addSupportIntakeCase(formData: FormData) {
  "use server";

  const intakeNumber = makeIntakeNumber();
  const senderName = String(formData.get("senderName") || "").trim();
  const senderEmail = String(formData.get("senderEmail") || "").trim();
  const senderPhone = String(formData.get("senderPhone") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const messageBody = String(formData.get("messageBody") || "").trim();
  const relatedBookingId = String(formData.get("relatedBookingId") || "").trim();
  const caseType = String(formData.get("caseType") || "general_support").trim();
  const priority = String(formData.get("priority") || "normal").trim();
  const notes = String(formData.get("notes") || "").trim();
  const financialAction = String(formData.get("financialAction") || "none").trim();
  const financialAmount = Math.max(0, toNumber(formData.get("financialAmount")));
  const financialNote = String(formData.get("financialNote") || "").trim();
  const refundRequested =
    caseType === "refund_request" || isRefundAction(financialAction);
  const refundAmount = isRefundAction(financialAction) ? financialAmount : 0;
  const financialImpact = financialAmount;

  if (!senderEmail && !subject && !messageBody) {
    return;
  }

  await supabaseAdmin.from("support_intake_cases").insert({
    intake_number: intakeNumber,
    source: "support_email",
    support_email: "support@sitguru.com",
    sender_name: senderName,
    sender_email: senderEmail,
    sender_phone: senderPhone,
    subject,
    message_body: messageBody,
    related_booking_id: isUuid(relatedBookingId) ? relatedBookingId : null,
    case_type: caseType,
    priority,
    status: "new",
    notes,
    financial_action: financialAction,
    financial_amount: financialAmount,
    financial_note: financialNote,
    refund_requested: refundRequested,
    refund_amount: refundAmount,
    financial_impact: financialImpact,
    updated_at: new Date().toISOString(),
  });

  let emailStatus = "not_requested";

  if (shouldSendEmail(formData) && senderEmail) {
    const emailResult = await sendSupportNotification({
      to: senderEmail,
      senderName,
      intakeNumber,
      subject,
      status: "new",
      notificationType: "created",
      message:
        "We received your message and created a SitGuru support case. Our team will review it and follow up as soon as possible.",
    });

    emailStatus = emailResult.ok ? "sent" : "failed";
  }

  revalidatePath("/admin/support");

  redirect(
    `/admin/support?updated=1&action=created&emailStatus=${emailStatus}&case=${encodeURIComponent(
      intakeNumber
    )}`
  );
}

async function updateSupportCaseStatus(formData: FormData) {
  "use server";

  const caseId = String(formData.get("caseId") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  const senderName = String(formData.get("senderName") || "").trim();
  const senderEmail = String(formData.get("senderEmail") || "").trim();
  const intakeNumber = String(formData.get("intakeNumber") || "").trim();
  const subject = String(formData.get("subject") || "").trim();

  if (!caseId || !status) {
    return;
  }

  const payload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (notes) {
    payload.notes = notes;
  }

  await supabaseAdmin.from("support_intake_cases").update(payload).eq("id", caseId);

  let emailStatus = "not_requested";

  if (shouldSendEmail(formData) && senderEmail) {
    const emailResult = await sendSupportNotification({
      to: senderEmail,
      senderName,
      intakeNumber,
      subject,
      status,
      notificationType: status === "closed" ? "closed" : "updated",
      message:
        notes ||
        `Your SitGuru support case status has been updated to ${getStatusLabel(
          status
        )}.`,
    });

    emailStatus = emailResult.ok ? "sent" : "failed";
  }

  revalidatePath("/admin/support");

  redirect(
    `/admin/support?updated=1&action=updated&emailStatus=${emailStatus}&case=${encodeURIComponent(
      intakeNumber || caseId
    )}`
  );
}

async function convertSupportCaseToDispute(formData: FormData) {
  "use server";

  const caseId = String(formData.get("caseId") || "").trim();
  const intakeNumber = String(formData.get("intakeNumber") || "").trim();
  const senderName = String(formData.get("senderName") || "").trim();
  const senderEmail = String(formData.get("senderEmail") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const messageBody = String(formData.get("messageBody") || "").trim();
  const relatedBookingId = String(formData.get("relatedBookingId") || "").trim();
  const caseType = String(formData.get("caseType") || "general_support").trim();
  const priority = String(formData.get("priority") || "normal").trim();
  const financialAction = String(formData.get("financialAction") || "none").trim();
  const financialAmountFromCase = Math.max(
    0,
    toNumber(formData.get("financialAmount"))
  );
  const financialNote = String(formData.get("financialNote") || "").trim();
  const detectedRefundAmount = Math.max(
    extractMoneyAmount(subject),
    extractMoneyAmount(messageBody)
  );
  const finalFinancialAction =
    financialAction !== "none"
      ? financialAction
      : caseType === "refund_request" || detectedRefundAmount > 0
        ? "customer_credit"
        : "none";
  const finalFinancialAmount = Math.max(
    financialAmountFromCase,
    detectedRefundAmount
  );
  const finalRefundRequested =
    caseType === "refund_request" || isRefundAction(finalFinancialAction);
  const finalRefundAmount = isRefundAction(finalFinancialAction)
    ? finalFinancialAmount
    : 0;
  const finalFinancialImpact = finalFinancialAmount;
  const disputeNumber = makeDisputeNumber();

  if (!caseId) {
    return;
  }

  const issueSummary = [
    subject,
    messageBody ? `Message: ${messageBody}` : "",
    finalFinancialAmount > 0
      ? `Financial action: ${getFinancialActionLabel(finalFinancialAction)} (${moneyExact(finalFinancialAmount)})`
      : "",
    financialNote ? `Financial note: ${financialNote}` : "",
    senderEmail ? `Sender email: ${senderEmail}` : "",
    intakeNumber ? `Support intake: ${intakeNumber}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const { data: dispute, error } = await supabaseAdmin
    .from("dispute_cases")
    .insert({
      dispute_number: disputeNumber,
      booking_id: isUuid(relatedBookingId) ? relatedBookingId : null,
      customer_name: senderName || senderEmail || "Support Sender",
      guru_name: "",
      issue_type: mapCaseTypeToDisputeType(caseType),
      issue_summary: issueSummary || "Converted from support intake.",
      status: "open",
      priority,
      refund_requested: finalRefundRequested,
      refund_amount: finalRefundAmount,
      financial_impact: finalFinancialImpact,
      financial_action: finalFinancialAction,
      financial_amount: finalFinancialAmount,
      financial_note: financialNote,
      accounting_posted: false,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (!error && dispute?.id) {
    await supabaseAdmin
      .from("support_intake_cases")
      .update({
        status: "converted",
        convert_to_dispute: true,
        linked_dispute_id: dispute.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", caseId);

    let emailStatus = "not_requested";

    if (shouldSendEmail(formData) && senderEmail) {
      const emailResult = await sendSupportNotification({
        to: senderEmail,
        senderName,
        intakeNumber,
        subject,
        status: "converted",
        notificationType: "converted",
        disputeNumber,
        message:
          "Your support case has been escalated to a dispute review. SitGuru will review the booking, payment, and service details before taking final action.",
      });

      emailStatus = emailResult.ok ? "sent" : "failed";
    }

    revalidatePath("/admin/support");
    revalidatePath("/admin/disputes");

    redirect(
      `/admin/support?updated=1&action=converted&emailStatus=${emailStatus}&case=${encodeURIComponent(
        intakeNumber || caseId
      )}`
    );
  }

  revalidatePath("/admin/support");
  revalidatePath("/admin/disputes");

  redirect(
    `/admin/support?updated=1&action=convert_failed&emailStatus=not_requested&case=${encodeURIComponent(
      intakeNumber || caseId
    )}`
  );
}

function EmailCheckbox({
  defaultChecked = false,
  label = "Send email notification to sender",
}: {
  defaultChecked?: boolean;
  label?: string;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-300">
      <input
        type="checkbox"
        name="sendEmail"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-white/20 bg-slate-950 accent-emerald-500"
      />
      {label}
    </label>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const normalized = priority.toLowerCase();

  const classes =
    normalized === "urgent"
      ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
      : normalized === "high"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
        : normalized === "low"
          ? "border-slate-400/20 bg-slate-400/10 text-slate-300"
          : "border-sky-400/20 bg-sky-400/10 text-sky-200";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${classes}`}>
      {getPriorityLabel(priority)}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  const classes =
    normalized === "converted"
      ? "border-violet-400/20 bg-violet-400/10 text-violet-200"
      : normalized === "closed"
        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
        : normalized === "waiting_response"
          ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
          : normalized === "in_review"
            ? "border-sky-400/20 bg-sky-400/10 text-sky-200"
            : "border-rose-400/20 bg-rose-400/10 text-rose-200";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${classes}`}>
      {getStatusLabel(status)}
    </span>
  );
}

function StatCard({
  label,
  value,
  detail,
  tone = "emerald",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "emerald" | "sky" | "violet" | "amber" | "rose";
}) {
  const toneClass = {
    emerald: "border-emerald-400/20 bg-emerald-400/10",
    sky: "border-sky-400/20 bg-sky-400/10",
    violet: "border-violet-400/20 bg-violet-400/10",
    amber: "border-amber-400/20 bg-amber-400/10",
    rose: "border-rose-400/20 bg-rose-400/10",
  }[tone];

  return (
    <div className={`rounded-3xl border p-5 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-white">
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  );
}

function ActionLink({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  if (primary) {
    return (
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:border-emerald-300/30 hover:bg-white/10"
    >
      {label}
    </Link>
  );
}

function QueueCard({
  title,
  description,
  count,
  href,
}: {
  title: string;
  description: string;
  count: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-300/30 hover:bg-white/10"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
        </div>

        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-white">
          {count}
        </span>
      </div>

      <p className="mt-4 text-sm font-bold text-emerald-300">Open queue →</p>
    </Link>
  );
}

function getSearchValue(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];

  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function SupportNotice({
  updated,
  action,
  emailStatus,
}: {
  updated: string;
  action: string;
  emailStatus: string;
}) {
  if (updated !== "1") {
    return null;
  }

  const actionLabel =
    action === "created"
      ? "Support case created"
      : action === "converted"
        ? "Support case converted to a dispute"
        : action === "convert_failed"
          ? "Support case could not be converted"
          : "Support case updated";

  const emailLabel =
    emailStatus === "sent"
      ? " and email sent to the sender."
      : emailStatus === "failed"
        ? ", but the email failed. Check the VS Code terminal or Resend logs."
        : ". No email was requested.";

  const message = `${actionLabel}${emailLabel}`;

  const classes =
    emailStatus === "sent"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
      : emailStatus === "failed" || action === "convert_failed"
        ? "border-rose-400/30 bg-rose-400/10 text-rose-100"
        : "border-sky-400/30 bg-sky-400/10 text-sky-100";

  return (
    <div className={`rounded-3xl border px-5 py-4 text-sm font-bold ${classes}`}>
      {message}
    </div>
  );
}

async function getSupportData() {
  const rows = await safeRows<SupportRow>(
    supabaseAdmin
      .from("support_intake_cases")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
    "support_intake_cases"
  );

  const cases = rows.map(normalizeSupportCase);

  const openCases = cases.filter(
    (item) => !["closed", "converted"].includes(item.status.toLowerCase())
  );

  const urgentCases = cases.filter((item) =>
    ["urgent", "high"].includes(item.priority.toLowerCase())
  );

  const resolvedToday = cases.filter(
    (item) => ["closed", "converted"].includes(item.status.toLowerCase()) && isToday(item.updatedAt)
  );

  const customerSupport = cases.filter((item) =>
    ["customer_support", "booking_help", "payment_help", "refund_request"].includes(item.caseType)
  );

  const guruSupport = cases.filter((item) => item.caseType === "guru_support");

  const platformIssues = cases.filter((item) => item.caseType === "platform_issue");

  const escalatedCases = cases.filter((item) =>
    ["dispute_request", "trust_safety", "refund_request"].includes(item.caseType)
  );

  return {
    cases,
    openCases,
    urgentCases,
    resolvedToday,
    customerSupport,
    guruSupport,
    platformIssues,
    escalatedCases,
    totals: {
      all: cases.length,
      open: openCases.length,
      urgent: urgentCases.length,
      resolvedToday: resolvedToday.length,
      converted: cases.filter((item) => item.status === "converted").length,
    },
  };
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const updated = getSearchValue(resolvedSearchParams, "updated");
  const action = getSearchValue(resolvedSearchParams, "action");
  const emailStatus = getSearchValue(resolvedSearchParams, "emailStatus");

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const data = await getSupportData();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_30%),radial-gradient(circle_at_right,_rgba(168,85,247,0.12),_transparent_28%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <SupportNotice updated={updated} action={action} emailStatus={emailStatus} />

        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-violet-500/10 p-6 shadow-[0_12px_60px_rgba(0,0,0,0.28)] lg:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                Admin / Support
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Support intake for support@sitguru.com.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Manually enter support emails, triage customer and Guru issues,
                send email notifications, and convert serious cases into
                SitGuru disputes.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionLink href="/admin/disputes" label="Disputes" />
              <ActionLink href="/admin/bookings" label="Bookings" />
              <ActionLink href="/admin/payments" label="Payments" primary />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Open Cases"
              value={data.totals.open.toLocaleString()}
              detail="Support emails awaiting review or resolution."
              tone="emerald"
            />
            <StatCard
              label="Urgent / High"
              value={data.totals.urgent.toLocaleString()}
              detail="High-priority cases needing faster action."
              tone="rose"
            />
            <StatCard
              label="Resolved Today"
              value={data.totals.resolvedToday.toLocaleString()}
              detail="Closed or converted support intakes today."
              tone="sky"
            />
            <StatCard
              label="Converted to Disputes"
              value={data.totals.converted.toLocaleString()}
              detail="Support emails escalated into dispute cases."
              tone="violet"
            />
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Add Support Email
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
              Manually enter support@sitguru.com emails.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Copy the email details into this form. Check the email box to send
              a confirmation to the sender.
            </p>

            <form action={addSupportIntakeCase} className="mt-6 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Sender Name
                  </label>
                  <input
                    name="senderName"
                    placeholder="Customer or Guru name"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Sender Email
                  </label>
                  <input
                    name="senderEmail"
                    type="email"
                    placeholder="sender@email.com"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/50"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Sender Phone
                  </label>
                  <input
                    name="senderPhone"
                    placeholder="Optional phone"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Related Booking ID
                  </label>
                  <input
                    name="relatedBookingId"
                    placeholder="Optional booking UUID"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Subject
                </label>
                <input
                  name="subject"
                  placeholder="Email subject"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Email / Message Body
                </label>
                <textarea
                  name="messageBody"
                  placeholder="Paste the support email message here..."
                  className="mt-2 min-h-32 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/50"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Case Type
                  </label>
                  <select
                    name="caseType"
                    defaultValue="general_support"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-emerald-300/50"
                  >
                    {Object.entries(CASE_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Priority
                  </label>
                  <select
                    name="priority"
                    defaultValue="normal"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-emerald-300/50"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Internal Notes
                  </label>
                  <input
                    name="notes"
                    placeholder="Optional"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/50"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  Financial Tracking
                </p>
                <p className="mt-2 text-sm leading-6 text-emerald-50/90">
                  Add a credit, debit, or refund amount now so it follows the case into disputes and financial reports.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_0.55fr]">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Financial Action
                    </label>
                    <select
                      name="financialAction"
                      defaultValue="none"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-emerald-300/50"
                    >
                      {Object.entries(FINANCIAL_ACTION_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Amount
                    </label>
                    <input
                      name="financialAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/50"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Financial Note
                  </label>
                  <input
                    name="financialNote"
                    placeholder="Example: Approved customer refund due to poor service"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/50"
                  />
                </div>
              </div>

              <EmailCheckbox defaultChecked />

              <button
                type="submit"
                className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
              >
                Create Support Case
              </button>
            </form>
          </div>

          <div className="space-y-8">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Support Queues
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                Live intake categories.
              </h2>

              <div className="mt-6 grid gap-4">
                <QueueCard
                  title="Customer Support"
                  description="Booking, payment, refund, and customer account questions."
                  count={data.customerSupport.length}
                  href="/admin/support?type=customer"
                />
                <QueueCard
                  title="Guru Support"
                  description="Guru onboarding, profile, booking, and payout questions."
                  count={data.guruSupport.length}
                  href="/admin/support?type=guru"
                />
                <QueueCard
                  title="Platform Issues"
                  description="Bug reports, broken flows, upload problems, and dashboard friction."
                  count={data.platformIssues.length}
                  href="/admin/support?type=platform"
                />
                <QueueCard
                  title="Escalated Cases"
                  description="Refund, dispute, trust, and safety-related intake cases."
                  count={data.escalatedCases.length}
                  href="/admin/disputes"
                />
              </div>
            </div>

            <div className="rounded-[32px] border border-sky-400/20 bg-sky-400/10 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
                Support Workflow
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-sky-50/90">
                <p>1. Copy the email from support@sitguru.com into the intake form.</p>
                <p>2. Check “Send email notification” to confirm with the sender.</p>
                <p>3. Triage the case by type, priority, and booking context.</p>
                <p>4. Add any credit, debit, or refund amount before escalation.</p>
                <p>5. Convert serious refund, service, or trust cases to disputes.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Support Intake Cases
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                Live support email intake.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                These rows come from the support_intake_cases table.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionLink href="/admin/disputes" label="Disputes" />
              <ActionLink href="/admin/bookings" label="Bookings" />
              <ActionLink href="/admin/payments" label="Payments" />
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Case
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Sender
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Type
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Financial
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Created
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10 bg-slate-950/40">
                  {data.cases.length ? (
                    data.cases.map((item) => (
                      <tr key={item.id} className="align-top transition hover:bg-white/5">
                        <td className="px-4 py-4">
                          <p className="font-black text-white">{item.intakeNumber}</p>
                          <div className="mt-2">
                            <PriorityBadge priority={item.priority} />
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-semibold text-white">{item.senderName}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.senderEmail || "No email"}
                          </p>
                          {item.senderPhone ? (
                            <p className="mt-1 text-xs text-slate-500">
                              {item.senderPhone}
                            </p>
                          ) : null}
                        </td>

                        <td className="px-4 py-4">
                          <p className="max-w-sm font-semibold text-white">
                            {item.subject}
                          </p>
                          <p className="mt-1 max-w-sm line-clamp-3 text-sm leading-6 text-slate-400">
                            {item.messageBody || "No message body entered."}
                          </p>
                          {item.relatedBookingId ? (
                            <Link
                              href={`/admin/bookings?booking=${item.relatedBookingId}`}
                              className="mt-2 inline-flex text-xs font-bold text-sky-200 hover:text-sky-100"
                            >
                              Related booking →
                            </Link>
                          ) : null}
                        </td>

                        <td className="px-4 py-4 text-slate-300">
                          {item.caseTypeLabel}
                        </td>

                        <td className="px-4 py-4">
                          {item.financialAmount > 0 ? (
                            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3">
                              <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-200">
                                {item.financialActionLabel}
                              </p>
                              <p className="mt-2 text-lg font-black text-white">
                                {moneyExact(item.financialAmount)}
                              </p>
                              {item.financialNote ? (
                                <p className="mt-1 max-w-[180px] text-xs leading-5 text-slate-300">
                                  {item.financialNote}
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <p className="text-slate-500">—</p>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge status={item.status} />
                          {item.linkedDisputeId ? (
                            <Link
                              href="/admin/disputes"
                              className="mt-2 block text-xs font-bold text-violet-200 hover:text-violet-100"
                            >
                              Linked dispute →
                            </Link>
                          ) : null}
                        </td>

                        <td className="px-4 py-4 text-slate-400">
                          <p>{formatDateShort(item.createdAt)}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatTimeShort(item.createdAt)}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex min-w-[260px] flex-col gap-3">
                            <form action={updateSupportCaseStatus} className="space-y-2">
                              <input type="hidden" name="caseId" value={item.id} />
                              <input type="hidden" name="senderName" value={item.senderName} />
                              <input type="hidden" name="senderEmail" value={item.senderEmail} />
                              <input type="hidden" name="intakeNumber" value={item.intakeNumber} />
                              <input type="hidden" name="subject" value={item.subject} />

                              <select
                                name="status"
                                defaultValue={item.status}
                                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-300/50"
                              >
                                <option value="new">New</option>
                                <option value="in_review">In Review</option>
                                <option value="waiting_response">
                                  Waiting Response
                                </option>
                                <option value="closed">Closed</option>
                              </select>

                              <input
                                name="notes"
                                placeholder="Optional message / internal note"
                                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-bold text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/50"
                              />

                              <EmailCheckbox label="Email sender about this update" />

                              <button
                                type="submit"
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white transition hover:bg-white/10"
                              >
                                Update
                              </button>
                            </form>

                            {!item.linkedDisputeId ? (
                              <form action={convertSupportCaseToDispute} className="space-y-2">
                                <input type="hidden" name="caseId" value={item.id} />
                                <input
                                  type="hidden"
                                  name="intakeNumber"
                                  value={item.intakeNumber}
                                />
                                <input
                                  type="hidden"
                                  name="senderName"
                                  value={item.senderName}
                                />
                                <input
                                  type="hidden"
                                  name="senderEmail"
                                  value={item.senderEmail}
                                />
                                <input
                                  type="hidden"
                                  name="subject"
                                  value={item.subject}
                                />
                                <input
                                  type="hidden"
                                  name="messageBody"
                                  value={item.messageBody}
                                />
                                <input
                                  type="hidden"
                                  name="relatedBookingId"
                                  value={item.relatedBookingId}
                                />
                                <input
                                  type="hidden"
                                  name="caseType"
                                  value={item.caseType}
                                />
                                <input
                                  type="hidden"
                                  name="priority"
                                  value={item.priority}
                                />
                                <input
                                  type="hidden"
                                  name="financialAction"
                                  value={item.financialAction}
                                />
                                <input
                                  type="hidden"
                                  name="financialAmount"
                                  value={item.financialAmount}
                                />
                                <input
                                  type="hidden"
                                  name="financialNote"
                                  value={item.financialNote}
                                />

                                <EmailCheckbox
                                  defaultChecked
                                  label="Email sender about dispute escalation"
                                />

                                <button
                                  type="submit"
                                  className="w-full rounded-2xl bg-rose-500 px-3 py-2 text-xs font-black text-white transition hover:bg-rose-400"
                                >
                                  Convert to Dispute
                                </button>
                              </form>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-slate-400"
                      >
                        No support intake cases found yet. Add a support email
                        above to start tracking support@sitguru.com messages.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
