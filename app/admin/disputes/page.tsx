import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type DisputeRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type DisputeCase = {
  id: string;
  disputeNumber: string;
  bookingId: string;
  customerId: string;
  guruId: string;
  customerName: string;
  guruName: string;
  senderEmail: string;
  issueType: string;
  issueLabel: string;
  issueSummary: string;
  status: string;
  statusLabel: string;
  priority: string;
  refundRequested: boolean;
  refundAmount: number;
  financialImpact: number;
  resolutionNotes: string;
  accountingPosted: boolean;
  resolvedAt: string;
  createdAt: string;
  updatedAt: string;
};

const ISSUE_LABELS: Record<string, string> = {
  service_complaint: "Service Complaint",
  refund_review: "Refund Review",
  no_show_cancellation: "No-Show / Cancellation",
  trust_safety: "Trust & Safety",
  payment_issue: "Payment Issue",
  booking_issue: "Booking Issue",
  other: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  investigating: "Investigating",
  pending_response: "Pending Response",
  refund_review: "Refund Review",
  resolved: "Resolved",
  closed: "Closed",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.abs(value));

  return value < 0 ? `(${formatted})` : formatted;
}

function moneyExact(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(value));

  return value < 0 ? `(${formatted})` : formatted;
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

function isThisWeek(value?: string | null) {
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);

  return date >= monday && date < nextMonday;
}

function isOpenStatus(status: string) {
  return !["resolved", "closed"].includes(status.toLowerCase());
}

function getIssueLabel(value: string) {
  return ISSUE_LABELS[value] || value.replace(/_/g, " ") || "Other";
}

function getStatusLabel(value: string) {
  return STATUS_LABELS[value] || value.replace(/_/g, " ") || "Open";
}

function getPriorityLabel(value: string) {
  return PRIORITY_LABELS[value] || value.replace(/_/g, " ") || "Normal";
}

function extractEmailFromText(value: string) {
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0]?.trim() || "";
}

function getBestDisputeEmail(row: DisputeRow) {
  return (
    asTrimmedString(row.sender_email) ||
    asTrimmedString(row.customer_email) ||
    asTrimmedString(row.email) ||
    extractEmailFromText(asTrimmedString(row.issue_summary))
  );
}

function normalizeDispute(row: DisputeRow, index: number): DisputeCase {
  const id = asTrimmedString(row.id);
  const issueType = asTrimmedString(row.issue_type) || "service_complaint";
  const status = asTrimmedString(row.status) || "open";
  const priority = asTrimmedString(row.priority) || "normal";
  const issueSummary =
    asTrimmedString(row.issue_summary) || "Dispute opened for admin review.";

  return {
    id,
    disputeNumber:
      asTrimmedString(row.dispute_number) ||
      `DP-${String(index + 1).padStart(4, "0")}`,
    bookingId: asTrimmedString(row.booking_id),
    customerId: asTrimmedString(row.customer_id),
    guruId: asTrimmedString(row.guru_id),
    customerName: asTrimmedString(row.customer_name) || "Customer",
    guruName: asTrimmedString(row.guru_name) || "Guru",
    senderEmail: getBestDisputeEmail({ ...row, issue_summary: issueSummary }),
    issueType,
    issueLabel: getIssueLabel(issueType),
    issueSummary,
    status,
    statusLabel: getStatusLabel(status),
    priority,
    refundRequested: Boolean(row.refund_requested),
    refundAmount: toNumber(row.refund_amount),
    financialImpact: toNumber(row.financial_impact),
    resolutionNotes: asTrimmedString(row.resolution_notes),
    accountingPosted: Boolean(row.accounting_posted),
    resolvedAt: asTrimmedString(row.resolved_at),
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
      console.warn(`Disputes query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Disputes query skipped for ${label}:`, error);
    return [];
  }
}

function getSupportFromEmail() {
  return (
    process.env.SITGURU_SUPPORT_FROM ||
    process.env.SUPPORT_FROM_EMAIL ||
    "SitGuru Support <support@sitguru.com>"
  );
}

function getSupportReplyEmail() {
  return (
    process.env.SITGURU_SUPPORT_EMAIL ||
    process.env.SUPPORT_TO_EMAIL ||
    "support@sitguru.com"
  );
}

function getSiteUrl() {
  const rawUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITGURU_SITE_URL ||
    "https://sitguru.com";

  return rawUrl.replace(/\/$/, "");
}

function getEmailLogoUrl() {
  return `${getSiteUrl()}/images/sitguru-logo-cropped.png`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatEmailDate(value = new Date()) {
  return value.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function buildDisputeUpdateText({
  customerName,
  disputeNumber,
  statusLabel,
  note,
  updatedAt,
}: {
  customerName: string;
  disputeNumber: string;
  statusLabel: string;
  note: string;
  updatedAt: string;
}) {
  const supportEmail = getSupportReplyEmail();
  const siteUrl = getSiteUrl();

  return `Hi ${customerName},

Your SitGuru dispute case has been updated.

Dispute number: ${disputeNumber}
Current status: ${statusLabel}
Update note: ${note}
Updated: ${updatedAt}

Our support team will continue reviewing the case and will follow up if more information is needed.

Need help? Reply to this email or contact ${supportEmail}.

Thank you,
SitGuru Support
${supportEmail}
${siteUrl}`;
}

function buildDisputeUpdateHtml({
  customerName,
  disputeNumber,
  statusLabel,
  note,
  updatedAt,
}: {
  customerName: string;
  disputeNumber: string;
  statusLabel: string;
  note: string;
  updatedAt: string;
}) {
  const logoUrl = getEmailLogoUrl();
  const siteUrl = getSiteUrl();
  const supportEmail = getSupportReplyEmail();

  const safeCustomerName = escapeHtml(customerName);
  const safeDisputeNumber = escapeHtml(disputeNumber);
  const safeStatusLabel = escapeHtml(statusLabel);
  const safeNote = escapeHtml(note);
  const safeUpdatedAt = escapeHtml(updatedAt);
  const safeSupportEmail = escapeHtml(supportEmail);
  const safeSiteUrl = escapeHtml(siteUrl);

  return `
    <!doctype html>
    <html>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>SitGuru dispute update</title>
      </head>
      <body style="margin:0; padding:0; background:#f8fafc; font-family:Arial, Helvetica, sans-serif; color:#111827;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc; margin:0; padding:28px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; background:#ffffff; border:1px solid #e5e7eb; border-radius:24px; overflow:hidden; box-shadow:0 16px 40px rgba(15,23,42,0.08);">
                <tr>
                  <td style="background:#020617; padding:28px 32px; text-align:left;">
                    <img src="${logoUrl}" width="150" alt="SitGuru" style="display:block; width:150px; max-width:150px; height:auto; margin:0 0 22px 0;" />
                    <div style="font-size:12px; line-height:16px; color:#fda4af; font-weight:700; letter-spacing:2.5px; text-transform:uppercase;">
                      Dispute Update
                    </div>
                    <h1 style="margin:10px 0 0 0; font-size:28px; line-height:34px; color:#ffffff; font-weight:800; letter-spacing:-0.4px;">
                      Your SitGuru case has been updated.
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 16px 0; font-size:16px; line-height:26px; color:#111827;">
                      Hi ${safeCustomerName},
                    </p>
                    <p style="margin:0 0 24px 0; font-size:16px; line-height:26px; color:#374151;">
                      Your SitGuru dispute case has been updated. The latest details are below.
                    </p>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate; border-spacing:0; background:#f9fafb; border:1px solid #e5e7eb; border-radius:18px; overflow:hidden; margin:0 0 24px 0;">
                      <tr>
                        <td style="padding:16px 18px; width:38%; border-bottom:1px solid #e5e7eb; color:#6b7280; font-size:13px; line-height:20px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px;">
                          Dispute number
                        </td>
                        <td style="padding:16px 18px; border-bottom:1px solid #e5e7eb; color:#111827; font-size:15px; line-height:22px; font-weight:700;">
                          ${safeDisputeNumber}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px 18px; width:38%; border-bottom:1px solid #e5e7eb; color:#6b7280; font-size:13px; line-height:20px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px;">
                          Current status
                        </td>
                        <td style="padding:16px 18px; border-bottom:1px solid #e5e7eb; color:#111827; font-size:15px; line-height:22px; font-weight:700;">
                          ${safeStatusLabel}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px 18px; width:38%; border-bottom:1px solid #e5e7eb; color:#6b7280; font-size:13px; line-height:20px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; vertical-align:top;">
                          Update note
                        </td>
                        <td style="padding:16px 18px; border-bottom:1px solid #e5e7eb; color:#111827; font-size:15px; line-height:24px; font-weight:600;">
                          ${safeNote}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px 18px; width:38%; color:#6b7280; font-size:13px; line-height:20px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px;">
                          Updated
                        </td>
                        <td style="padding:16px 18px; color:#111827; font-size:15px; line-height:22px; font-weight:700;">
                          ${safeUpdatedAt}
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 18px 0; font-size:15px; line-height:25px; color:#374151;">
                      Our support team will continue reviewing the case and will follow up if more information is needed.
                    </p>

                    <div style="margin:24px 0; padding:18px; border-radius:18px; background:#fff1f2; border:1px solid #fecdd3; color:#9f1239; font-size:14px; line-height:22px; font-weight:700;">
                      Need help? Reply to this email or contact
                      <a href="mailto:${safeSupportEmail}" style="color:#be123c; text-decoration:none;">${safeSupportEmail}</a>.
                    </div>

                    <p style="margin:0; font-size:15px; line-height:24px; color:#374151;">
                      Thank you,<br />
                      <strong>SitGuru Support</strong>
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:22px 32px; background:#f3f4f6; border-top:1px solid #e5e7eb;">
                    <p style="margin:0 0 8px 0; font-size:12px; line-height:18px; color:#6b7280;">
                      SitGuru.com support notification
                    </p>
                    <p style="margin:0; font-size:12px; line-height:18px; color:#6b7280;">
                      <a href="${safeSiteUrl}" style="color:#0f172a; text-decoration:none; font-weight:700;">${safeSiteUrl}</a>
                      &nbsp;•&nbsp;
                      <a href="mailto:${safeSupportEmail}" style="color:#0f172a; text-decoration:none; font-weight:700;">${safeSupportEmail}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
async function sendDisputeEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = getSupportFromEmail();

  if (!apiKey) {
    console.warn("Dispute email skipped: Missing RESEND_API_KEY.");
    return {
      ok: false,
      message: "Missing RESEND_API_KEY.",
    };
  }

  if (!to) {
    console.warn("Dispute email skipped: Missing recipient email.");
    return {
      ok: false,
      message: "Missing recipient email.",
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
        from,
        to,
        subject,
        html,
        text,
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      console.warn("Dispute email send failed:", result);

      return {
        ok: false,
        message: "Resend rejected the email.",
      };
    }

    console.log("Dispute email sent:", result);

    return {
      ok: true,
      message: "Email sent.",
    };
  } catch (error) {
    console.warn("Dispute email send failed:", error);

    return {
      ok: false,
      message: "Email send failed.",
    };
  }
}

async function updateDisputeStatus(formData: FormData) {
  "use server";

  const disputeId = String(formData.get("disputeId") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const resolutionNotes = String(formData.get("resolutionNotes") || "").trim();
  const emailSender = String(formData.get("emailSender") || "") === "on";

  if (!disputeId || !status) {
    return;
  }

  const { data: existingDispute } = await supabaseAdmin
    .from("dispute_cases")
    .select("*")
    .eq("id", disputeId)
    .maybeSingle();

  const payload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (resolutionNotes) {
    payload.resolution_notes = resolutionNotes;
  }

  if (status === "resolved" || status === "closed") {
    payload.resolved_at = new Date().toISOString();
  }

  await supabaseAdmin.from("dispute_cases").update(payload).eq("id", disputeId);

  let emailStatus = "not_requested";

  if (emailSender && existingDispute) {
    const row = existingDispute as DisputeRow;
    const recipientEmail = getBestDisputeEmail(row);
    const disputeNumber = asTrimmedString(row.dispute_number) || disputeId;
    const customerName = asTrimmedString(row.customer_name) || "there";
    const statusLabel = getStatusLabel(status);
    const note =
      resolutionNotes ||
      "Your dispute case has been updated by the SitGuru support team.";

    const updatedAt = formatEmailDate();

    const emailResult = await sendDisputeEmail({
      to: recipientEmail,
      subject: `SitGuru dispute update: ${disputeNumber}`,
      text: buildDisputeUpdateText({
        customerName,
        disputeNumber,
        statusLabel,
        note,
        updatedAt,
      }),
      html: buildDisputeUpdateHtml({
        customerName,
        disputeNumber,
        statusLabel,
        note,
        updatedAt,
      }),
    });
    emailStatus = emailResult.ok ? "sent" : "failed";
  }

  revalidatePath("/admin/disputes");

  redirect(
    `/admin/disputes?updated=1&emailStatus=${emailStatus}&case=${encodeURIComponent(
      disputeId
    )}`
  );
}

async function postDisputeToFinancials(formData: FormData) {
  "use server";

  const disputeId = String(formData.get("disputeId") || "").trim();
  const disputeNumber = String(formData.get("disputeNumber") || "").trim();
  const refundAmount = Number(formData.get("refundAmount") || 0);
  const financialImpact = Number(formData.get("financialImpact") || 0);
  const issueSummary = String(formData.get("issueSummary") || "").trim();

  if (!disputeId) {
    return;
  }

  const amount = Math.max(refundAmount, financialImpact, 0);

  if (amount <= 0) {
    await supabaseAdmin
      .from("dispute_cases")
      .update({
        accounting_posted: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", disputeId);

    revalidatePath("/admin/disputes");

    redirect(
      `/admin/disputes?updated=1&emailStatus=financials_posted&case=${encodeURIComponent(
        disputeId
      )}`
    );
  }

  const entryDate = new Date().toISOString().slice(0, 10);
  const memo = `Dispute ${disputeNumber || disputeId}: ${
    issueSummary || "refund / customer credit"
  }`;

  try {
    await supabaseAdmin.from("financial_ledger_entries").insert([
      {
        source_type: "dispute_case",
        source_id: disputeId,
        entry_date: entryDate,
        account_name: "Refunds / Customer Credits",
        debit: amount,
        credit: 0,
        memo,
      },
      {
        source_type: "dispute_case",
        source_id: disputeId,
        entry_date: entryDate,
        account_name: "Cash",
        debit: 0,
        credit: amount,
        memo,
      },
    ]);
  } catch (error) {
    console.warn("Dispute ledger posting skipped:", error);
  }

  try {
    await supabaseAdmin.from("expense_ledger").insert({
      name: `Dispute ${disputeNumber || disputeId}`,
      description: issueSummary || "Dispute financial impact",
      category: "customer_credits",
      amount,
    });
  } catch (error) {
    console.warn("Dispute expense ledger posting skipped:", error);
  }

  await supabaseAdmin
    .from("dispute_cases")
    .update({
      accounting_posted: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", disputeId);

  revalidatePath("/admin/disputes");

  redirect(
    `/admin/disputes?updated=1&emailStatus=financials_posted&case=${encodeURIComponent(
      disputeId
    )}`
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  const classes =
    normalized === "urgent"
      ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
      : normalized === "high"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
        : normalized === "resolved" || normalized === "closed"
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
          : normalized === "refund_review"
            ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-200"
            : "border-sky-400/20 bg-sky-400/10 text-sky-200";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${classes}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const normalized = priority.toLowerCase();

  const classes =
    normalized === "urgent"
      ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
      : normalized === "high"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
        : "border-white/10 bg-white/5 text-slate-300";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${classes}`}
    >
      {getPriorityLabel(priority)}
    </span>
  );
}

function StatCard({
  label,
  value,
  detail,
  tone = "rose",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "rose" | "amber" | "emerald" | "sky" | "violet";
}) {
  const toneClass = {
    rose: "border-rose-400/20 bg-rose-400/10",
    amber: "border-amber-400/20 bg-amber-400/10",
    emerald: "border-emerald-400/20 bg-emerald-400/10",
    sky: "border-sky-400/20 bg-sky-400/10",
    violet: "border-violet-400/20 bg-violet-400/10",
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
        className="inline-flex items-center justify-center rounded-2xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition hover:bg-rose-400"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:border-rose-300/30 hover:bg-white/10"
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
      className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-rose-300/30 hover:bg-white/10"
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

      <p className="mt-4 text-sm font-bold text-rose-200">Open queue →</p>
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

function UpdateNotice({
  updated,
  emailStatus,
}: {
  updated: string;
  emailStatus: string;
}) {
  if (updated !== "1") {
    return null;
  }

  const message =
    emailStatus === "sent"
      ? "Dispute updated and email sent to the sender."
      : emailStatus === "failed"
        ? "Dispute updated, but the email failed. Check the VS Code terminal for the Resend error."
        : emailStatus === "financials_posted"
          ? "Dispute posted to financials."
          : "Dispute updated. No email was requested.";

  const classes =
    emailStatus === "sent"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
      : emailStatus === "failed"
        ? "border-rose-400/30 bg-rose-400/10 text-rose-100"
        : emailStatus === "financials_posted"
          ? "border-violet-400/30 bg-violet-400/10 text-violet-100"
          : "border-sky-400/30 bg-sky-400/10 text-sky-100";

  return (
    <div className={`rounded-3xl border px-5 py-4 text-sm font-bold ${classes}`}>
      {message}
    </div>
  );
}

async function getDisputesData() {
  const rows = await safeRows<DisputeRow>(
    supabaseAdmin
      .from("dispute_cases")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
    "dispute_cases"
  );

  const disputes = rows.map(normalizeDispute);

  const openDisputes = disputes.filter((item) => isOpenStatus(item.status));
  const refundRequests = disputes.filter(
    (item) =>
      item.refundRequested ||
      item.refundAmount > 0 ||
      item.issueType === "refund_review"
  );
  const resolvedThisWeek = disputes.filter(
    (item) =>
      ["resolved", "closed"].includes(item.status.toLowerCase()) &&
      isThisWeek(item.resolvedAt || item.updatedAt)
  );
  const urgentEscalations = disputes.filter(
    (item) =>
      item.priority.toLowerCase() === "urgent" ||
      item.priority.toLowerCase() === "high"
  );

  const serviceComplaints = disputes.filter(
    (item) => item.issueType === "service_complaint"
  );
  const noShowCases = disputes.filter(
    (item) => item.issueType === "no_show_cancellation"
  );
  const trustSafetyCases = disputes.filter(
    (item) => item.issueType === "trust_safety"
  );

  const totalRefundExposure = disputes.reduce(
    (sum, item) => sum + item.refundAmount,
    0
  );

  const totalFinancialImpact = disputes.reduce(
    (sum, item) => sum + item.financialImpact,
    0
  );

  const unpostedFinancialImpact = disputes
    .filter((item) => !item.accountingPosted)
    .reduce(
      (sum, item) => sum + Math.max(item.refundAmount, item.financialImpact),
      0
    );

  const activeTableRows = openDisputes.slice(0, 50);

  return {
    disputes,
    openDisputes,
    refundRequests,
    resolvedThisWeek,
    urgentEscalations,
    serviceComplaints,
    noShowCases,
    trustSafetyCases,
    activeTableRows,
    totals: {
      all: disputes.length,
      open: openDisputes.length,
      refunds: refundRequests.length,
      resolvedThisWeek: resolvedThisWeek.length,
      urgent: urgentEscalations.length,
      totalRefundExposure,
      totalFinancialImpact,
      unpostedFinancialImpact,
    },
  };
}

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const updated = getSearchValue(resolvedSearchParams, "updated");
  const emailStatus = getSearchValue(resolvedSearchParams, "emailStatus");

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const data = await getDisputesData();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(244,63,94,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_30%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <UpdateNotice updated={updated} emailStatus={emailStatus} />

        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-rose-500/15 via-slate-950 to-sky-500/10 p-6 shadow-[0_12px_60px_rgba(0,0,0,0.28)] lg:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-300">
                Disputes
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Resolve platform issues with trust and speed.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Review booking issues, refund requests, service complaints, and
                trust-related escalations from one SitGuru dispute center.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionLink href="/admin/bookings" label="Bookings" />
              <ActionLink href="/admin/payments" label="Payments" />
              <ActionLink href="/admin/support" label="Support queue" primary />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Open Disputes"
              value={data.totals.open.toLocaleString()}
              detail="Cases currently under HQ review."
              tone="rose"
            />
            <StatCard
              label="Refund Requests"
              value={data.totals.refunds.toLocaleString()}
              detail={`${money(data.totals.totalRefundExposure)} refund exposure.`}
              tone="amber"
            />
            <StatCard
              label="Resolved This Week"
              value={data.totals.resolvedThisWeek.toLocaleString()}
              detail="Closed cases with final outcomes this week."
              tone="emerald"
            />
            <StatCard
              label="Urgent Escalations"
              value={data.totals.urgent.toLocaleString()}
              detail="High priority trust or service issues."
              tone="violet"
            />
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-300">
              Dispute Queues
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
              Live case categories.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Organized by dispute type, urgency, refund impact, and trust
              outcome path.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <QueueCard
                title="Service Complaints"
                description="Customer concerns related to care quality, missed expectations, or service delivery."
                count={data.serviceComplaints.length}
                href="/admin/disputes?type=service_complaint"
              />
              <QueueCard
                title="Refund Reviews"
                description="Cases tied to payment reversals, partial refunds, or booking-related financial review."
                count={data.refundRequests.length}
                href="/admin/disputes?type=refund_review"
              />
              <QueueCard
                title="No-Show / Cancellation Issues"
                description="Late cancellations, missed services, or no-show activity needing final review."
                count={data.noShowCases.length}
                href="/admin/disputes?type=no_show_cancellation"
              />
              <QueueCard
                title="Trust & Safety Escalations"
                description="Higher-risk incidents involving platform trust, abuse reports, or unusual case handling."
                count={data.trustSafetyCases.length}
                href="/admin/disputes?type=trust_safety"
              />
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-300">
              Resolution Checklist
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
              Handle disputes cleanly.
            </h2>

            <div className="mt-6 space-y-3">
              {[
                "Verify booking, payment, and message history before action.",
                "Review both customer and Guru account context.",
                "Assess refund eligibility and service outcome evidence.",
                "Escalate trust or abuse concerns immediately.",
                "Close cases with a clear outcome and support follow-up.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-slate-300"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4">
              <p className="text-sm font-black text-rose-100">
                Financial impact
              </p>
              <p className="mt-2 text-sm leading-6 text-rose-50/90">
                {money(data.totals.unpostedFinancialImpact)} in unposted
                dispute impact can be posted into SitGuru financials from the
                active case table.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-3">
          <StatCard
            label="Refund Exposure"
            value={money(data.totals.totalRefundExposure)}
            detail="Total refund amount across dispute cases."
            tone="amber"
          />
          <StatCard
            label="Financial Impact"
            value={money(data.totals.totalFinancialImpact)}
            detail="Total dispute financial impact currently tracked."
            tone="rose"
          />
          <StatCard
            label="Accounting Not Posted"
            value={money(data.totals.unpostedFinancialImpact)}
            detail="Refunds or credits not yet posted to financial ledger."
            tone="violet"
          />
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-300">
                Active Dispute Cases
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                Live dispute case list.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Snapshot of current booking, payment, refund, and trust-related
                issues from Supabase.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionLink href="/admin/payments" label="Payments" />
              <ActionLink href="/admin/financials/profit-loss" label="P&L" />
              <ActionLink href="/admin/financials/cash-flow" label="Cash Flow" />
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Dispute
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Booking
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Guru
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Issue
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Impact
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Opened
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10 bg-slate-950/40">
                  {data.activeTableRows.length ? (
                    data.activeTableRows.map((item) => (
                      <tr
                        key={item.id}
                        className="align-top transition hover:bg-white/5"
                      >
                        <td className="px-4 py-4">
                          <p className="font-black text-white">
                            {item.disputeNumber}
                          </p>
                          <div className="mt-2">
                            <PriorityBadge priority={item.priority} />
                          </div>
                        </td>

                        <td className="px-4 py-4 text-slate-300">
                          {item.bookingId ? (
                            <Link
                              href={`/admin/bookings?booking=${item.bookingId}`}
                              className="font-semibold text-sky-200 hover:text-sky-100"
                            >
                              View booking
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="px-4 py-4 font-semibold text-white">
                          <div>{item.customerName}</div>
                          {item.senderEmail ? (
                            <p className="mt-1 text-xs font-medium text-slate-400">
                              {item.senderEmail}
                            </p>
                          ) : null}
                        </td>

                        <td className="px-4 py-4 font-semibold text-white">
                          {item.guruName}
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-bold text-white">
                            {item.issueLabel}
                          </p>
                          <p className="mt-1 max-w-xs whitespace-pre-line text-sm leading-6 text-slate-400">
                            {item.issueSummary}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge status={item.status} />
                          <p className="mt-2 text-xs text-slate-500">
                            {item.accountingPosted
                              ? "Posted to financials"
                              : "Not posted"}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-black text-white">
                            {moneyExact(
                              Math.max(item.refundAmount, item.financialImpact)
                            )}
                          </p>
                          {item.refundRequested ? (
                            <p className="mt-1 text-xs font-bold text-amber-200">
                              Refund requested
                            </p>
                          ) : null}
                        </td>

                        <td className="px-4 py-4 text-slate-400">
                          {formatDateShort(item.createdAt)}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex min-w-[220px] flex-col gap-3">
                            <form
                              action={updateDisputeStatus}
                              className="space-y-2"
                            >
                              <input
                                type="hidden"
                                name="disputeId"
                                value={item.id}
                              />

                              <select
                                name="status"
                                defaultValue={item.status}
                                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-bold text-white outline-none transition focus:border-rose-300/50"
                              >
                                <option value="open">Open</option>
                                <option value="investigating">
                                  Investigating
                                </option>
                                <option value="pending_response">
                                  Pending Response
                                </option>
                                <option value="refund_review">
                                  Refund Review
                                </option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                              </select>

                              <input
                                name="resolutionNotes"
                                placeholder="Optional resolution note"
                                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-bold text-white outline-none placeholder:text-slate-600 focus:border-rose-300/50"
                              />

                              <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-300">
                                <input
                                  type="checkbox"
                                  name="emailSender"
                                  className="h-4 w-4 rounded border-white/20 bg-slate-950 accent-rose-500"
                                  disabled={!item.senderEmail}
                                />
                                Email sender this update
                              </label>

                              {!item.senderEmail ? (
                                <p className="text-[11px] font-semibold text-amber-200">
                                  No sender email found for this case.
                                </p>
                              ) : null}

                              <button
                                type="submit"
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white transition hover:bg-white/10"
                              >
                                Update
                              </button>
                            </form>

                            {!item.accountingPosted ? (
                              <form action={postDisputeToFinancials}>
                                <input
                                  type="hidden"
                                  name="disputeId"
                                  value={item.id}
                                />
                                <input
                                  type="hidden"
                                  name="disputeNumber"
                                  value={item.disputeNumber}
                                />
                                <input
                                  type="hidden"
                                  name="refundAmount"
                                  value={item.refundAmount}
                                />
                                <input
                                  type="hidden"
                                  name="financialImpact"
                                  value={item.financialImpact}
                                />
                                <input
                                  type="hidden"
                                  name="issueSummary"
                                  value={item.issueSummary}
                                />

                                <button
                                  type="submit"
                                  className="w-full rounded-2xl bg-rose-500 px-3 py-2 text-xs font-black text-white transition hover:bg-rose-400"
                                >
                                  Post to Financials
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
                        colSpan={9}
                        className="px-4 py-10 text-center text-slate-400"
                      >
                        No active dispute cases found. New cases will appear
                        here when added to the dispute_cases table.
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
