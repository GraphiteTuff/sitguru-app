import { sendSitGuruEmail } from "@/lib/email/resend";

type WelcomeEmailParams = {
  to: string;
  fullName?: string | null;
  unsubscribeToken: string;
};

function getBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://www.sitguru.com";
  return raw.replace(/\/$/, "");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function firstNameFrom(fullName?: string | null, email?: string) {
  const cleaned = String(fullName || "").trim();
  if (cleaned) return cleaned.split(/\s+/)[0];
  const local = String(email || "").split("@")[0] || "";
  if (local.length >= 2) {
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return "friend";
}

/**
 * First subscription email for Email Updates signups.
 * Approved community copy + responsive HTML with brand imagery.
 */
export function buildEmailUpdatesWelcome(params: WelcomeEmailParams) {
  const baseUrl = getBaseUrl();
  const name = firstNameFrom(params.fullName, params.to);
  const safeName = escapeHtml(name);
  const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${encodeURIComponent(params.unsubscribeToken)}`;
  const preferencesUrl = `${baseUrl}/customer/dashboard/profile/notifications`;
  const homeUrl = `${baseUrl}/`;
  const searchUrl = `${baseUrl}/search`;
  const petperksUrl = `${baseUrl}/petperks`;
  const becomeGuruUrl = `${baseUrl}/become-a-guru`;
  const ambassadorsUrl = `${baseUrl}/ambassadors`;

  const logoUrl = `${baseUrl}/images/sitguru-logo-cropped.png`;
  const rogueAvatar = `${baseUrl}/images/rogue-avatar.png`;
  const scoutAvatar = `${baseUrl}/images/scout-avatar.png`;
  const tacoAvatar = `${baseUrl}/images/taco-avatar.png`;
  // Hero: Rogue as the pack welcome face
  const heroImage = rogueAvatar;

  const subject = "Welcome to the SitGuru community";

  const text = [
    `Hi ${name},`,
    "",
    "Welcome to the SitGuru community! 🐾",
    "",
    "You’re officially signed up to receive SitGuru email updates. We’ll keep you informed about:",
    "",
    "• New SitGuru features and services",
    "• Helpful pet-care news and tips",
    "• Special offers and announcements",
    "• Opportunities for Pet Parents, Gurus, and Ambassadors",
    "• Updates as the SitGuru community grows",
    "",
    "SitGuru was built by Pet Parents to make finding and providing trusted pet care easier, more personal, and more connected.",
    "",
    "In the meantime, you can explore SitGuru at:",
    homeUrl,
    "",
    `Find care: ${searchUrl}`,
    `PawPerks: ${petperksUrl}`,
    `Become a Guru: ${becomeGuruUrl}`,
    `Ambassadors: ${ambassadorsUrl}`,
    "",
    "You’re always in control of your emails. You can update your preferences through your SitGuru account or unsubscribe using the link included at the bottom of any email.",
    "",
    `Manage preferences: ${preferencesUrl}`,
    `Unsubscribe anytime: ${unsubscribeUrl}`,
    "",
    "Thank you for joining us. We’re happy to have you here! 💚",
    "",
    "The SitGuru Team",
    "Pet Care Starts Here",
    homeUrl,
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
  <title>Welcome to the SitGuru community</title>
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
    html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    * { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    a { text-decoration: none; }
    .email-container { width: 100% !important; max-width: 640px !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .stack-column { display: block !important; width: 100% !important; max-width: 100% !important; }
      .stack-column-pad { padding-left: 0 !important; padding-right: 0 !important; padding-bottom: 12px !important; }
      .hero-pad { padding: 22px 18px 18px !important; }
      .body-pad { padding: 22px 18px 10px !important; }
      .footer-pad { padding: 16px 18px 22px !important; }
      .hero-title { font-size: 26px !important; line-height: 1.25 !important; }
      .companion-img { width: 48px !important; height: 48px !important; }
      .cta-btn { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
      .hide-mobile { display: none !important; max-height: 0 !important; overflow: hidden !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#e8f4ec;width:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
    Welcome to the SitGuru community, ${safeName} — you’re signed up for email updates.
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#e8f4ec;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" class="email-container" style="width:100%;max-width:640px;background:#ffffff;border:1px solid #cfe8d9;border-radius:24px;overflow:hidden;">

          <!-- Brand bar -->
          <tr>
            <td class="hero-pad" style="background:#0D5C3A;padding:26px 28px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle" style="width:70%;">
                    <img src="${logoUrl}" width="140" alt="SitGuru" style="display:block;border:0;height:auto;max-width:140px;" />
                  </td>
                  <td valign="middle" align="right" style="width:30%;">
                    <img src="${heroImage}" width="64" height="64" alt="Rogue, SitGuru mascot" style="display:inline-block;border:0;border-radius:999px;background:#ffffff;width:64px;height:64px;object-fit:cover;" />
                  </td>
                </tr>
              </table>
              <p style="margin:18px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#d9f7e5;font-weight:700;">
                Email updates
              </p>
              <h1 class="hero-title" style="margin:10px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.22;color:#ffffff;font-weight:700;">
                Welcome to the SitGuru community!
              </h1>
              <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#e8fff3;">
                Hi ${safeName} — we’re happy to have you here.
              </p>
            </td>
          </tr>

          <!-- Body copy -->
          <tr>
            <td class="body-pad" style="padding:28px 28px 8px;font-family:Arial,Helvetica,sans-serif;color:#123524;font-size:15px;line-height:1.7;">
              <p style="margin:0;">
                You’re officially signed up to receive SitGuru email updates. We’ll keep you informed about:
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 0;border:1px solid #d7eee0;border-radius:16px;background:#f7fbf8;">
                <tr>
                  <td style="padding:16px 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#123524;">
                    <p style="margin:0 0 8px;">• New SitGuru features and services</p>
                    <p style="margin:0 0 8px;">• Helpful pet-care news and tips</p>
                    <p style="margin:0 0 8px;">• Special offers and announcements</p>
                    <p style="margin:0 0 8px;">• Opportunities for Pet Parents, Gurus, and Ambassadors</p>
                    <p style="margin:0;">• Updates as the SitGuru community grows</p>
                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0;">
                SitGuru was built by Pet Parents to make finding and providing trusted pet care easier, more personal, and more connected.
              </p>

              <!-- Companions row -->
              <p style="margin:26px 0 10px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#0D5C3A;font-weight:800;">
                Meet the pack
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="stack-column stack-column-pad" width="33.33%" valign="top" style="padding:0 6px 0 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #d7eee0;border-radius:16px;background:#ffffff;">
                      <tr>
                        <td align="center" style="padding:16px 10px;">
                          <img class="companion-img" src="${rogueAvatar}" width="56" height="56" alt="Rogue" style="display:block;border:0;border-radius:999px;background:#fff;width:56px;height:56px;object-fit:cover;" />
                          <p style="margin:10px 0 0;font-size:14px;font-weight:800;color:#0D5C3A;">Rogue</p>
                          <p style="margin:4px 0 0;font-size:12px;line-height:1.4;color:#4b6356;">Pet Parent companion</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td class="stack-column stack-column-pad" width="33.33%" valign="top" style="padding:0 3px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #d7eee0;border-radius:16px;background:#ffffff;">
                      <tr>
                        <td align="center" style="padding:16px 10px;">
                          <img class="companion-img" src="${scoutAvatar}" width="56" height="56" alt="Scout" style="display:block;border:0;border-radius:999px;background:#fff;width:56px;height:56px;object-fit:cover;" />
                          <p style="margin:10px 0 0;font-size:14px;font-weight:800;color:#047857;">Scout</p>
                          <p style="margin:4px 0 0;font-size:12px;line-height:1.4;color:#4b6356;">Guru companion</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td class="stack-column" width="33.33%" valign="top" style="padding:0 0 0 6px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #d7eee0;border-radius:16px;background:#ffffff;">
                      <tr>
                        <td align="center" style="padding:16px 10px;">
                          <img class="companion-img" src="${tacoAvatar}" width="56" height="56" alt="Taco" style="display:block;border:0;border-radius:999px;background:#fff;width:56px;height:56px;object-fit:cover;" />
                          <p style="margin:10px 0 0;font-size:14px;font-weight:800;color:#0D5C3A;">Taco</p>
                          <p style="margin:4px 0 0;font-size:12px;line-height:1.4;color:#4b6356;">Ambassador companion</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:22px 0 12px;">
                In the meantime, you can explore SitGuru:
              </p>

              <!-- CTA cards -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:0 0 10px;">
                    <a href="${homeUrl}" class="cta-btn" style="display:block;background:#0D5C3A;color:#ffffff;text-decoration:none;padding:14px 20px;border-radius:14px;font-weight:800;font-size:15px;text-align:center;">
                      Visit sitguru.com
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 10px;">
                    <a href="${searchUrl}" style="display:block;text-decoration:none;border:1px solid #d7eee0;border-radius:14px;padding:14px 16px;background:#f7fbf8;">
                      <span style="display:block;font-size:14px;font-weight:800;color:#0D5C3A;">Find care near you</span>
                      <span style="display:block;margin-top:3px;font-size:13px;line-height:1.45;color:#4b6356;">Trusted local Gurus for walks, sits, boarding, and more.</span>
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 10px;">
                    <a href="${petperksUrl}" style="display:block;text-decoration:none;border:1px solid #d7eee0;border-radius:14px;padding:14px 16px;background:#ffffff;">
                      <span style="display:block;font-size:14px;font-weight:800;color:#0D5C3A;">Explore PawPerks</span>
                      <span style="display:block;margin-top:3px;font-size:13px;line-height:1.45;color:#4b6356;">Rewards and savings for the SitGuru community.</span>
                    </a>
                  </td>
                </tr>
                <tr>
                  <td class="stack-column stack-column-pad" width="50%" valign="top" style="padding:0 5px 10px 0;">
                    <a href="${becomeGuruUrl}" style="display:block;text-decoration:none;border:1px solid #d7eee0;border-radius:14px;padding:14px 16px;background:#ffffff;">
                      <span style="display:block;font-size:14px;font-weight:800;color:#047857;">Become a Guru</span>
                      <span style="display:block;margin-top:3px;font-size:12px;line-height:1.45;color:#4b6356;">Care for pets on your schedule.</span>
                    </a>
                  </td>
                  <td class="stack-column" width="50%" valign="top" style="padding:0 0 10px 5px;">
                    <a href="${ambassadorsUrl}" style="display:block;text-decoration:none;border:1px solid #d7eee0;border-radius:14px;padding:14px 16px;background:#ffffff;">
                      <span style="display:block;font-size:14px;font-weight:800;color:#0D5C3A;">Join Ambassadors</span>
                      <span style="display:block;margin-top:3px;font-size:12px;line-height:1.45;color:#4b6356;">Help grow the pack.</span>
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:14px 0 0;font-size:14px;line-height:1.65;color:#4b6356;">
                You’re always in control of your emails. You can update your preferences through your SitGuru account or unsubscribe using the link included at the bottom of any email.
              </p>

              <p style="margin:20px 0 0;">
                Thank you for joining us. We’re happy to have you here!
              </p>

              <p style="margin:22px 0 8px;">
                The SitGuru Team<br />
                <strong>Pet Care Starts Here</strong><br />
                <a href="${homeUrl}" style="color:#0D5C3A;font-weight:700;">https://www.sitguru.com</a><br />
                @SitGuruOfficial
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer-pad" style="padding:16px 28px 26px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#6b7f74;border-top:1px solid #e6f3eb;">
              You’re receiving this because you signed up for SitGuru email updates.<br />
              <a href="${preferencesUrl}" style="color:#0D5C3A;font-weight:700;">Manage preferences</a>
              &nbsp;·&nbsp;
              <a href="${unsubscribeUrl}" style="color:#0D5C3A;font-weight:700;">Unsubscribe anytime</a>
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

export async function sendEmailUpdatesWelcome(params: WelcomeEmailParams) {
  const content = buildEmailUpdatesWelcome(params);
  return sendSitGuruEmail({
    to: params.to,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });
}
