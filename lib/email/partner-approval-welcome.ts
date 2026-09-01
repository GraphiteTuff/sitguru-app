import { sendSitGuruEmail } from "@/lib/email/resend";
import {
  SITGURU_EMAIL_FONT_FAMILY,
  SITGURU_EMAIL_FONT_HEAD,
} from "@/lib/email/brand-font";

export type PartnerWelcomeProgram =
  | "local_partner"
  | "national_partner"
  | "affiliate"
  | "ambassador";

export type PartnerWelcomeEmailInput = {
  to: string;
  contactName: string;
  businessName: string;
  program: PartnerWelcomeProgram;
  locationLabel: string;
  referralCode: string;
  partnerPageUrl: string;
};

function getEmailSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://www.sitguru.com";
  const cleaned = raw.replace(/\/$/, "");

  if (cleaned.includes("localhost") || cleaned.includes("127.0.0.1")) {
    return "https://www.sitguru.com";
  }

  return cleaned;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function addresseeName(contactName: string, email: string) {
  const cleaned = contactName.trim().replace(/\s+/g, " ");
  if (cleaned) return cleaned;

  const local = String(email || "").split("@")[0] || "";
  if (local.length >= 2) {
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return "there";
}

export function formatNamedEmailAddress(name: string, email: string) {
  const safeName = name.replace(/[<>]/g, "").trim();
  const safeEmail = email.trim();
  if (!safeName) return safeEmail;
  return `${safeName} <${safeEmail}>`;
}

export function programLabel(program: PartnerWelcomeProgram) {
  switch (program) {
    case "national_partner":
      return "National Partner";
    case "affiliate":
      return "Growth Affiliate";
    case "ambassador":
      return "Ambassador";
    default:
      return "Local Partner";
  }
}

export function buildPartnerPageUrl(slug: string | null, referralCode: string) {
  const base = getEmailSiteUrl();
  if (slug) return `${base}/p/${encodeURIComponent(slug)}`;
  return `${base}/partners?ref=${encodeURIComponent(referralCode)}`;
}

export function buildPartnerQrCodeUrl(pageUrl: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=512x512&margin=12&data=${encodeURIComponent(
    pageUrl,
  )}`;
}

function programCopy(program: PartnerWelcomeProgram) {
  if (program === "ambassador") {
    return {
      eyebrow: "Ambassador welcome",
      headline: "You’re officially a SitGuru Ambassador.",
      role:
        "You’re part of the SitGuru pack now — helping Pet Parents find trusted local Gurus while you grow with us.",
      howTitle: "How to use your Ambassador kit",
    };
  }

  if (program === "affiliate") {
    return {
      eyebrow: "Affiliate welcome",
      headline: "You’re officially a SitGuru Growth Affiliate.",
      role:
        "Share SitGuru with your audience. Pet Parents book trusted Gurus on SitGuru, and your unique link gives you credit.",
      howTitle: "How to use your Affiliate kit",
    };
  }

  return {
    eyebrow: "Partner Network welcome",
    headline: "You’re officially a SitGuru Local Partner.",
    role:
      "You’re a SitGuru Partner, not a pet sitter. Pet Parents still book walks, sits, and boarding with SitGuru Gurus. You help them find SitGuru — and we send that love back to your business.",
    howTitle: "How to use your Partner kit",
  };
}

export function buildPartnerApprovalWelcome(params: PartnerWelcomeEmailInput) {
  const baseUrl = getEmailSiteUrl();
  const name = addresseeName(params.contactName, params.to);
  const safeName = escapeHtml(name);
  const business = params.businessName.trim() || "your business";
  const safeBusiness = escapeHtml(business);
  const programName = programLabel(params.program);
  const safeProgram = escapeHtml(programName);
  const location = params.locationLabel.trim() || "your city";
  const safeLocation = escapeHtml(location);
  const safeCode = escapeHtml(params.referralCode);
  const partnerPageUrl = params.partnerPageUrl;
  const qrCodeUrl = buildPartnerQrCodeUrl(partnerPageUrl);
  const dashboardUrl = `${baseUrl}/partners/dashboard`;
  const signupUrl = `${baseUrl}/signup`;
  const eventsUrl = `${baseUrl}/partners/dashboard/community/events`;
  const searchUrl = `${baseUrl}/search`;
  const copy = programCopy(params.program);
  const logoUrl = `${baseUrl}/images/sitguru-logo-cropped.png`;
  const rogueAvatar = `${baseUrl}/images/rogue-avatar.png`;

  const subject = `${business} is in — welcome to the SitGuru Partner Network`;

  const text = [
    `Hi ${name},`,
    "",
    `Great news: ${business} is approved as a SitGuru ${programName}.`,
    "",
    copy.role,
    "",
    `Market: ${location}`,
    "",
    "Your Partner kit",
    `Referral code: ${params.referralCode}`,
    `Partner page: ${partnerPageUrl}`,
    `QR code: ${qrCodeUrl}`,
    "",
    "Put the QR on your front desk, add the link to Instagram, and share it with Pet Parents who need trusted local care.",
    "",
    `Create or open your SitGuru account with this same email: ${signupUrl}`,
    `Partner dashboard: ${dashboardUrl}`,
    `List a Pet Event: ${eventsUrl}`,
    `Find SitGuru Gurus: ${searchUrl}`,
    "",
    "Reply to this email anytime — we’d love to collaborate.",
    "",
    "The SitGuru Team",
    "Pet Care Starts Here",
    baseUrl,
    "@SitGuruOfficial",
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(subject)}</title>
  ${SITGURU_EMAIL_FONT_HEAD}
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: ${SITGURU_EMAIL_FONT_FAMILY} !important; }
    * { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    a { text-decoration: none; }
    .email-container { width: 100% !important; max-width: 640px !important; }
    body, table, td, th, p, a, li, span, div, h1, h2, h3, h4, h5, h6 {
      font-family: ${SITGURU_EMAIL_FONT_FAMILY} !important;
    }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .hero-pad { padding: 22px 18px 18px !important; }
      .body-pad { padding: 22px 18px 10px !important; }
      .footer-pad { padding: 16px 18px 22px !important; }
      .hero-title { font-size: 26px !important; line-height: 1.25 !important; }
      .cta-btn { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#e8f4ec;width:100%;font-family:${SITGURU_EMAIL_FONT_FAMILY};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
    ${safeBusiness} is approved. Your SitGuru partner page, referral code, and QR kit are ready.
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#e8f4ec;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" class="email-container" style="width:100%;max-width:640px;background:#ffffff;border:1px solid #cfe8d9;border-radius:24px;overflow:hidden;">

          <tr>
            <td class="hero-pad" data-brand-green="true" style="background:#0D5C3A;padding:26px 28px 22px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle" style="width:70%;">
                    <img src="${logoUrl}" width="140" alt="SitGuru" style="display:block;border:0;height:auto;max-width:140px;mix-blend-mode:multiply;" />
                  </td>
                  <td valign="middle" align="right" style="width:30%;">
                    <img src="${rogueAvatar}" width="64" height="64" alt="Rogue, SitGuru mascot" style="display:inline-block;border:0;border-radius:999px;background:#ffffff;width:64px;height:64px;object-fit:cover;" />
                  </td>
                </tr>
              </table>
              <p style="margin:18px 0 0;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#d9f7e5;font-weight:700;">
                ${escapeHtml(copy.eyebrow)}
              </p>
              <h1 class="hero-title" style="margin:10px 0 0;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:30px;line-height:1.22;color:#ffffff;font-weight:800;">
                ${escapeHtml(copy.headline)}
              </h1>
              <p style="margin:12px 0 0;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:15px;line-height:1.55;color:#e8fff3;">
                Hi ${safeName} — ${safeBusiness} is in.
              </p>
            </td>
          </tr>

          <tr>
            <td class="body-pad" style="padding:28px 28px 8px;font-family:${SITGURU_EMAIL_FONT_FAMILY};color:#123524;font-size:15px;line-height:1.7;">
              <p style="margin:0;">
                ${escapeHtml(copy.role)}
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 0;border:1px solid #d7eee0;border-radius:16px;background:#f7fbf8;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#0D5C3A;font-weight:800;">Program</p>
                    <p style="margin:0;font-size:16px;font-weight:800;color:#123524;">${safeProgram}</p>
                    <p style="margin:10px 0 0;font-size:14px;color:#4b6356;">${safeLocation}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:26px 0 10px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#0D5C3A;font-weight:800;">
                Your Partner kit
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #d7eee0;border-radius:18px;overflow:hidden;">
                <tr>
                  <td style="padding:18px;background:#ffffff;">
                    <p style="margin:0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#0D5C3A;font-weight:800;">Referral code</p>
                    <p style="margin:8px 0 0;font-size:22px;letter-spacing:0.04em;font-weight:800;color:#0D5C3A;">${safeCode}</p>
                    <p style="margin:16px 0 0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#0D5C3A;font-weight:800;">Partner page</p>
                    <p style="margin:8px 0 0;font-size:14px;line-height:1.5;word-break:break-word;">
                      <a href="${partnerPageUrl}" style="color:#0D5C3A;font-weight:700;">${escapeHtml(partnerPageUrl)}</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:8px 18px 22px;background:#f7fbf8;">
                    <img src="${qrCodeUrl}" width="180" height="180" alt="SitGuru partner QR code" style="display:block;border:0;width:180px;height:180px;background:#ffffff;border-radius:16px;" />
                    <p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:#4b6356;">
                      Print this QR for your front desk, flyers, and Instagram.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:22px 0 0;font-weight:800;color:#0D5C3A;">
                ${escapeHtml(copy.howTitle)}
              </p>
              <p style="margin:8px 0 0;color:#4b6356;">
                1. Put the QR at checkout or the front desk.<br />
                2. Add your partner page to Instagram, Google, and your website.<br />
                3. Tell Pet Parents SitGuru is where they book trusted local Gurus.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0;">
                <tr>
                  <td style="padding:0 0 10px;">
                    <a href="${partnerPageUrl}" class="cta-btn" style="display:block;background:#0D5C3A;color:#ffffff;text-decoration:none;padding:14px 20px;border-radius:14px;font-weight:800;font-size:15px;text-align:center;">
                      Open your partner page
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 10px;">
                    <a href="${signupUrl}" style="display:block;text-decoration:none;border:1px solid #d7eee0;border-radius:14px;padding:14px 16px;background:#f7fbf8;">
                      <span style="display:block;font-size:14px;font-weight:800;color:#0D5C3A;">Create your SitGuru login</span>
                      <span style="display:block;margin-top:3px;font-size:13px;line-height:1.45;color:#4b6356;">Use this same email so we can connect your partner dashboard.</span>
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 10px;">
                    <a href="${eventsUrl}" style="display:block;text-decoration:none;border:1px solid #d7eee0;border-radius:14px;padding:14px 16px;background:#ffffff;">
                      <span style="display:block;font-size:14px;font-weight:800;color:#0D5C3A;">Host a SitGuru Pet Event</span>
                      <span style="display:block;margin-top:3px;font-size:13px;line-height:1.45;color:#4b6356;">Clinic nights, open houses, and pack gathers in ${safeLocation}.</span>
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:18px 0 0;font-size:14px;line-height:1.65;color:#4b6356;">
                Reply to this email anytime. We’d love to collaborate with ${safeBusiness}.
              </p>

              <p style="margin:22px 0 8px;">
                The SitGuru Team<br />
                <strong>Pet Care Starts Here</strong><br />
                <a href="${baseUrl}" style="color:#0D5C3A;font-weight:700;">${baseUrl}</a><br />
                @SitGuruOfficial
              </p>
            </td>
          </tr>

          <tr>
            <td class="footer-pad" style="padding:16px 28px 26px;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:12px;line-height:1.6;color:#6b7f74;border-top:1px solid #e6f3eb;">
              You’re receiving this because SitGuru approved ${safeBusiness} for the Partner Network.<br />
              Questions? Reply to this email or write pack@sitguru.com.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  return { subject, html, text };
}

export async function sendPartnerApprovalWelcome(
  params: PartnerWelcomeEmailInput,
) {
  const content = buildPartnerApprovalWelcome(params);
  const namedTo = formatNamedEmailAddress(params.contactName, params.to);
  const recipientEmail = params.to.trim().toLowerCase();
  const bcc =
    recipientEmail === "jason@sitguru.com" ? undefined : ["jason@sitguru.com"];

  return sendSitGuruEmail({
    to: namedTo,
    subject: content.subject,
    html: content.html,
    text: content.text,
    replyTo: process.env.RESEND_REPLY_TO_EMAIL || "jason@sitguru.com",
    bcc,
  });
}
