/**
 * Admin Pet Parent welcome email.
 *
 * Always resolves the recipient from the stored profile / auth email for the
 * given customerId. Never accepts a free-typed To address from the form —
 * that is how the najiahassan53 typo bounce happened.
 */

import { sendSitGuruEmail } from "@/lib/email/resend";
import { getAppOrigin, SITE_CONFIG } from "@/lib/config/site";
import { supabaseAdmin } from "@/utils/supabase/admin";

export type PetParentWelcomeDelivery = {
  status: "sent" | "skipped" | "failed";
  to: string | null;
  providerMessageId: string | null;
  reason: string | null;
  subject: string | null;
};

type RecordLike = Record<string, unknown>;

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function firstNameFrom(fullName: string, email: string) {
  const first = fullName.trim().split(/\s+/).filter(Boolean)[0];
  if (first) return first;

  const emailName = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  return emailName?.split(/\s+/)[0] || "there";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Canonical stored contact email for a Pet Parent.
 * Preference order: profiles.email → auth.users.email → profiles.recovery_email.
 */
export async function resolvePetParentStoredEmail(customerId: string): Promise<{
  email: string;
  source: "profile" | "auth" | "recovery" | "missing";
  fullName: string;
  userId: string;
}> {
  const id = asTrimmedString(customerId);
  if (!id) {
    return { email: "", source: "missing", fullName: "", userId: "" };
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id,email,full_name,first_name,last_name,recovery_email")
    .eq("id", id)
    .maybeSingle();

  const profileRow = (profile || null) as RecordLike | null;
  const profileEmail = asTrimmedString(profileRow?.email);
  const recoveryEmail = asTrimmedString(profileRow?.recovery_email);

  let authEmail = "";
  let authFullName = "";
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
    if (!error && data?.user) {
      authEmail = asTrimmedString(data.user.email);
      const meta = (data.user.user_metadata || {}) as RecordLike;
      authFullName =
        asTrimmedString(meta.full_name) ||
        [asTrimmedString(meta.first_name), asTrimmedString(meta.last_name)]
          .filter(Boolean)
          .join(" ");
    }
  } catch {
    // Auth lookup is best-effort; profile email is enough to send.
  }

  const fullName =
    asTrimmedString(profileRow?.full_name) ||
    [asTrimmedString(profileRow?.first_name), asTrimmedString(profileRow?.last_name)]
      .filter(Boolean)
      .join(" ") ||
    authFullName;

  if (profileEmail && isValidEmail(profileEmail)) {
    return {
      email: profileEmail.toLowerCase(),
      source: "profile",
      fullName,
      userId: id,
    };
  }

  if (authEmail && isValidEmail(authEmail)) {
    return {
      email: authEmail.toLowerCase(),
      source: "auth",
      fullName,
      userId: id,
    };
  }

  if (recoveryEmail && isValidEmail(recoveryEmail)) {
    return {
      email: recoveryEmail.toLowerCase(),
      source: "recovery",
      userId: id,
      fullName,
    };
  }

  return { email: "", source: "missing", fullName, userId: id };
}

export function buildPetParentWelcomeMailto({
  email,
  fullName,
}: {
  email: string;
  fullName: string;
}) {
  const firstName = firstNameFrom(fullName, email);
  const subject = `Welcome to SitGuru — Pet Parent & Ambassador Community`;
  const body = [
    `Hi ${firstName},`,
    "",
    `Welcome to SitGuru! We're so glad you're here.`,
    "",
    `Your Pet Parent account is ready. You can explore trusted Gurus, book care, and join our community whenever you're ready:`,
    `${getAppOrigin()}/customer/dashboard`,
    "",
    `If you have any questions, just reply to this email or reach us at ${SITE_CONFIG.supportEmail}.`,
    "",
    `Woof and purrs,`,
    `The SitGuru Team`,
  ].join("\n");

  // Keep the address literal so Outlook/Gmail open the exact stored mailbox.
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function buildPetParentWelcomeEmail({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) {
  const firstName = firstNameFrom(fullName, email);
  const dashboardUrl = `${getAppOrigin()}/customer/dashboard`;
  const supportEmail = SITE_CONFIG.supportEmail;
  const subject = `Welcome to SitGuru — Pet Parent & Ambassador Community`;

  const text = [
    `Hi ${firstName},`,
    "",
    `Welcome to SitGuru — we're really happy to have you in our Pet Parent & Ambassador community.`,
    "",
    `Your account is ready. From your dashboard you can:`,
    `• Find trusted local Gurus for walks, drop-ins, and sitting`,
    `• Book care and stay connected with PawReports`,
    `• Explore Ambassador opportunities when you're ready`,
    "",
    `Open your dashboard: ${dashboardUrl}`,
    "",
    `Questions? Reply to this email or write ${supportEmail}.`,
    "",
    `Welcome to the pack, ${firstName}!`,
    `The SitGuru Team`,
    `Pet Care Starts Here`,
    getAppOrigin(),
  ].join("\n");

  const safeFirst = escapeHtml(firstName);
  const safeDashboard = escapeHtml(dashboardUrl);
  const safeSupport = escapeHtml(supportEmail);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f3faf5;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;color:#17351f;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3faf5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #d7ebe0;">
          <tr>
            <td style="background:#0D5C3A;padding:28px 28px 22px;color:#ffffff;">
              <p style="margin:0;font-size:12px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#d7ebe0;">SitGuru</p>
              <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;color:#ffffff;">Welcome, ${safeFirst}!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#334155;">
                Welcome to SitGuru — we're really happy to have you in our Pet Parent &amp; Ambassador community.
              </p>
              <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#334155;">
                Your account is ready. From your dashboard you can find trusted local Gurus, book care, stay connected with PawReports, and explore Ambassador opportunities when you're ready.
              </p>
              <p style="margin:24px 0;">
                <a href="${safeDashboard}" style="display:inline-block;background:#0D5C3A;color:#ffffff;text-decoration:none;font-weight:800;font-size:15px;padding:14px 22px;border-radius:999px;">
                  Open your dashboard →
                </a>
              </p>
              <p style="margin:0;font-size:14px;line-height:1.7;color:#64748b;">
                Questions? Reply to this email or write
                <a href="mailto:${safeSupport}" style="color:#0D5C3A;font-weight:700;text-decoration:none;">${safeSupport}</a>.
              </p>
              <p style="margin:24px 0 0;font-size:15px;line-height:1.7;color:#334155;">
                Welcome to the pack, ${safeFirst}!<br />
                <strong style="color:#0D5C3A;">The SitGuru Team</strong><br />
                Pet Care Starts Here
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  return { subject, text, html };
}

async function logEmailEvent(params: {
  userId: string;
  email: string;
  status: string;
  providerMessageId: string | null;
  metadata: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("email_events").insert({
      user_id: params.userId || null,
      email: params.email,
      event_type: "pet_parent_welcome",
      provider_message_id: params.providerMessageId,
      status: params.status,
      metadata: params.metadata,
    });
  } catch (error) {
    console.warn("[pet-parent-welcome] email_events log skipped:", error);
  }
}

/**
 * Send the Pet Parent welcome email using only the stored address for customerId.
 * Any `overrideTo` is intentionally unsupported.
 */
export async function sendAdminPetParentWelcome(params: {
  customerId: string;
  adminNote?: string;
}): Promise<PetParentWelcomeDelivery> {
  const resolved = await resolvePetParentStoredEmail(params.customerId);

  if (!resolved.email) {
    return {
      status: "skipped",
      to: null,
      providerMessageId: null,
      reason: "No stored email address on this Pet Parent record.",
      subject: null,
    };
  }

  const content = buildPetParentWelcomeEmail({
    fullName: resolved.fullName,
    email: resolved.email,
  });

  try {
    const result = await sendSitGuruEmail({
      to: resolved.email,
      subject: content.subject,
      html: content.html,
      text: content.text,
      replyTo: SITE_CONFIG.supportEmail,
    });

    await logEmailEvent({
      userId: resolved.userId,
      email: resolved.email,
      status: "sent",
      providerMessageId: result.id,
      metadata: {
        source: resolved.source,
        admin_note: params.adminNote || null,
        stream: "transactional",
      },
    });

    return {
      status: "sent",
      to: resolved.email,
      providerMessageId: result.id,
      reason: null,
      subject: content.subject,
    };
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Resend email delivery failed.";

    await logEmailEvent({
      userId: resolved.userId,
      email: resolved.email,
      status: "failed",
      providerMessageId: null,
      metadata: {
        source: resolved.source,
        error: reason,
        admin_note: params.adminNote || null,
      },
    });

    return {
      status: "failed",
      to: resolved.email,
      providerMessageId: null,
      reason,
      subject: content.subject,
    };
  }
}
