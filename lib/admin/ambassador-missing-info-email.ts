/**
 * Admin → Ambassador missing-info email.
 * Always sends to the stored ambassadors.email (never a typed To field).
 */

import { sendSitGuruEmail } from "@/lib/email/resend";
import { getAppOrigin, SITE_CONFIG } from "@/lib/config/site";
import { supabaseAdmin } from "@/utils/supabase/admin";

export type AmbassadorMissingInfoDelivery = {
  status: "sent" | "skipped" | "failed";
  to: string | null;
  providerMessageId: string | null;
  reason: string | null;
  missingFields: string[];
};

type AmbassadorContact = {
  id: string;
  user_id: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  full_name: string | null;
  display_name: string | null;
  referral_code: string | null;
  ambassador_photo_url: string | null;
  ambassador_photo_path: string | null;
};

function asTrimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function firstNameFrom(fullName: string, email: string) {
  const first = fullName.trim().split(/\s+/).filter(Boolean)[0];
  if (first) return first;
  const local = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  return local?.split(/\s+/)[0] || "there";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function listAmbassadorMissingFields(ambassador: {
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  ambassador_photo_url?: string | null;
  ambassador_photo_path?: string | null;
}) {
  const missing: string[] = [];

  if (!asTrimmed(ambassador.phone)) {
    missing.push("mobile phone number");
  }

  if (!asTrimmed(ambassador.city) || !asTrimmed(ambassador.state)) {
    missing.push("city and state");
  }

  if (
    !asTrimmed(ambassador.ambassador_photo_url) &&
    !asTrimmed(ambassador.ambassador_photo_path)
  ) {
    missing.push("Ambassador profile photo");
  }

  return missing;
}

export function buildAmbassadorMissingInfoEmail({
  fullName,
  email,
  missingFields,
  referralCode,
}: {
  fullName: string;
  email: string;
  missingFields: string[];
  referralCode: string;
}) {
  const firstName = firstNameFrom(fullName, email);
  const dashboardUrl = `${getAppOrigin()}/ambassador/dashboard`;
  const supportEmail = SITE_CONFIG.supportEmail;
  const subject = "Quick SitGuru Ambassador setup — we just need a couple things";

  const missingListText = missingFields.map((item) => `• ${item}`).join("\n");
  const missingListHtml = missingFields
    .map((item) => `<li style="margin:0 0 8px;">${escapeHtml(item)}</li>`)
    .join("");

  const referralLine = referralCode
    ? `Your referral link is already live: ${getAppOrigin()}/r/${encodeURIComponent(referralCode)}/pet-parent`
    : "";

  const text = [
    `Hi ${firstName},`,
    "",
    `Welcome to the SitGuru Ambassador community — we're excited to have you.`,
    "",
    `Your Ambassador account is set up and your referral code is ready. To finish the last pieces of onboarding, please reply with (or add in your dashboard):`,
    "",
    missingListText || "• any remaining profile details",
    "",
    referralLine,
    "",
    `Ambassador dashboard: ${dashboardUrl}`,
    "",
    `Once we have these, you're fully set to start referring Pet Parents and Gurus.`,
    "",
    `Questions? Just reply to this email or write ${supportEmail}.`,
    "",
    `Woof and purrs,`,
    `The SitGuru Team`,
  ]
    .filter((line, index, arr) => !(line === "" && arr[index - 1] === ""))
    .join("\n");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f3faf5;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;color:#17351f;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3faf5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #d7ebe0;">
          <tr>
            <td style="background:#0D5C3A;padding:28px 28px 22px;color:#ffffff;">
              <p style="margin:0;font-size:12px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#d7ebe0;">SitGuru Ambassadors</p>
              <h1 style="margin:10px 0 0;font-size:26px;line-height:1.25;color:#ffffff;">Almost there, ${escapeHtml(firstName)}!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#334155;">
                Your Ambassador account is ready and your referral code is live. We just need a couple details to finish onboarding:
              </p>
              <ul style="margin:0 0 18px;padding-left:20px;font-size:16px;line-height:1.7;color:#17351f;font-weight:600;">
                ${missingListHtml || "<li>any remaining profile details</li>"}
              </ul>
              ${
                referralCode
                  ? `<p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#475569;">Your Pet Parent referral link:<br /><a href="${escapeHtml(`${getAppOrigin()}/r/${encodeURIComponent(referralCode)}/pet-parent`)}" style="color:#0D5C3A;font-weight:800;word-break:break-all;">${escapeHtml(`${getAppOrigin()}/r/${encodeURIComponent(referralCode)}/pet-parent`)}</a></p>`
                  : ""
              }
              <p style="margin:0 0 18px;">
                <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background:#0D5C3A;color:#ffffff;text-decoration:none;font-weight:800;font-size:15px;padding:14px 22px;border-radius:999px;">
                  Open Ambassador dashboard →
                </a>
              </p>
              <p style="margin:0;font-size:14px;line-height:1.7;color:#64748b;">
                Easiest path: reply to this email with your phone number and a clear headshot photo.
                Or reach us at <a href="mailto:${escapeHtml(supportEmail)}" style="color:#0D5C3A;font-weight:700;text-decoration:none;">${escapeHtml(supportEmail)}</a>.
              </p>
              <p style="margin:24px 0 0;font-size:15px;line-height:1.7;color:#334155;">
                Woof and purrs,<br />
                <strong style="color:#0D5C3A;">The SitGuru Team</strong>
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

export async function sendAmbassadorMissingInfoEmail(params: {
  ambassadorId: string;
}): Promise<AmbassadorMissingInfoDelivery> {
  const { data, error } = await supabaseAdmin
    .from("ambassadors")
    .select(
      "id,user_id,email,phone,city,state,full_name,display_name,referral_code,ambassador_photo_url,ambassador_photo_path",
    )
    .eq("id", params.ambassadorId)
    .maybeSingle();

  if (error || !data) {
    return {
      status: "failed",
      to: null,
      providerMessageId: null,
      reason: error?.message || "Ambassador record not found.",
      missingFields: [],
    };
  }

  const ambassador = data as AmbassadorContact;
  const email = asTrimmed(ambassador.email).toLowerCase();
  const missingFields = listAmbassadorMissingFields(ambassador);

  if (!email) {
    return {
      status: "skipped",
      to: null,
      providerMessageId: null,
      reason: "No stored email on this Ambassador record.",
      missingFields,
    };
  }

  if (missingFields.length === 0) {
    return {
      status: "skipped",
      to: email,
      providerMessageId: null,
      reason: "No missing onboarding fields to request.",
      missingFields,
    };
  }

  const fullName =
    asTrimmed(ambassador.display_name) ||
    asTrimmed(ambassador.full_name) ||
    email;
  const content = buildAmbassadorMissingInfoEmail({
    fullName,
    email,
    missingFields,
    referralCode: asTrimmed(ambassador.referral_code),
  });

  try {
    const result = await sendSitGuruEmail({
      to: email,
      subject: content.subject,
      html: content.html,
      text: content.text,
      replyTo: SITE_CONFIG.supportEmail,
    });

    try {
      await supabaseAdmin.from("email_events").insert({
        user_id: ambassador.user_id,
        email,
        event_type: "ambassador_missing_info",
        provider_message_id: result.id,
        status: "sent",
        metadata: {
          ambassador_id: ambassador.id,
          missing_fields: missingFields,
        },
      });
    } catch {
      // Logging is best-effort.
    }

    try {
      await supabaseAdmin.from("ambassador_activity_log").insert({
        ambassador_id: ambassador.id,
        activity_type: "missing_info_email",
        activity_title: "Missing-info email sent",
        activity_notes: `Requested: ${missingFields.join(", ")}.`,
      });
    } catch {
      // Activity log is best-effort.
    }

    return {
      status: "sent",
      to: email,
      providerMessageId: result.id,
      reason: null,
      missingFields,
    };
  } catch (sendError) {
    const reason =
      sendError instanceof Error
        ? sendError.message
        : "Resend email delivery failed.";

    return {
      status: "failed",
      to: email,
      providerMessageId: null,
      reason,
      missingFields,
    };
  }
}
