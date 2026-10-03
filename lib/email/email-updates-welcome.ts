import {
  marketingUnsubscribeHeadersForToken,
  sendSitGuruEmail,
} from "@/lib/email/resend";
import {
  SITGURU_EMAIL_FONT_FAMILY,
  SITGURU_EMAIL_FONT_HEAD,
} from "@/lib/email/brand-font";
import {
  getEmailBaseUrl,
  getMarketingFromEmail,
  getSupportReplyToEmail,
} from "@/lib/email/config";

type WelcomeEmailParams = {
  to: string;
  fullName?: string | null;
  unsubscribeToken: string;
};

/** Official SitGuru social profiles. Each icon is its own anchor — never a shared image. */
const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/SitGuruOfficial",
    mark: "f",
    color: "#1877F2",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/SitGuruOfficial",
    mark: "Ig",
    color: "#C13584",
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@SitGuruOfficial",
    mark: "Tt",
    color: "#111111",
  },
  {
    label: "X",
    href: "https://x.com/SitGuruOfficial",
    mark: "X",
    color: "#111111",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@SitGuruOfficial",
    mark: "▶",
    color: "#E11D2E",
  },
] as const;

const FEATURES = [
  {
    title: "Trusted Community",
    body: "Reviewed profiles and real pet lovers.",
  },
  {
    title: "Happier Pets",
    body: "Loving care while you’re away.",
  },
  {
    title: "A Supportive Network",
    body: "Tips, resources, and a growing local pet-care community.",
  },
] as const;

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

function webLink(href: string, label: string, style: string, className = "link") {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="${className}" style="${style}">${label}</a>`;
}

function featureCard(title: string, body: string) {
  return `
                    <td class="stack-column" width="33.33%" valign="top" style="width:33.33%;padding:0 6px 12px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-feature" bgcolor="#f3fbf6" style="background-color:#f3fbf6;border:1px solid #d5ebdd;border-radius:16px;">
                        <tr>
                          <td style="padding:16px 14px 18px;font-family:${SITGURU_EMAIL_FONT_FAMILY};">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td class="accent-bar" width="36" height="4" bgcolor="#0D5C3A" style="width:36px;height:4px;background-color:#0D5C3A;border-radius:99px;font-size:0;line-height:0;">&nbsp;</td>
                              </tr>
                            </table>
                            <p class="text-feature-title" style="margin:12px 0 6px;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:16px;line-height:1.35;font-weight:800;color:#0D5C3A;">${escapeHtml(title)}</p>
                            <p class="text-secondary" style="margin:0;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:15px;line-height:1.5;color:#1c3d30;">${escapeHtml(body)}</p>
                          </td>
                        </tr>
                      </table>
                    </td>`;
}

function socialLinkCell(link: (typeof SOCIAL_LINKS)[number]) {
  const markSize = link.mark.length > 1 ? "15px" : "18px";
  return `
                  <div class="social-item" style="display:inline-block;vertical-align:top;width:104px;max-width:20%;box-sizing:border-box;padding:8px 4px;">
                    <a href="${link.href}" target="_blank" rel="noopener noreferrer" class="link" title="${link.label}" aria-label="Follow SitGuru on ${link.label}" style="text-decoration:none;display:inline-block;">
                      <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td class="social-icon" align="center" valign="middle" width="44" height="44" bgcolor="${link.color}" style="width:44px;height:44px;background-color:${link.color};border-radius:22px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:${markSize};font-weight:700;line-height:44px;mso-line-height-rule:exactly;">
                            ${link.mark}
                          </td>
                        </tr>
                        <tr>
                          <td class="text-secondary" align="center" style="padding-top:8px;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:14px;line-height:1.3;font-weight:700;color:#1c3d30;">
                            ${link.label}
                          </td>
                        </tr>
                      </table>
                    </a>
                  </div>`;
}

/**
 * First subscription email for Email Updates signups.
 * Marketing only — do not reuse this template for auth, OTP, or transactional mail.
 */
export function buildEmailUpdatesWelcome(params: WelcomeEmailParams) {
  const baseUrl = getEmailBaseUrl();
  const name = firstNameFrom(params.fullName, params.to);
  const safeName = escapeHtml(name);
  const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${encodeURIComponent(params.unsubscribeToken)}`;
  const preferencesUrl = `${baseUrl}/customer/dashboard/profile/notifications`;
  const homeUrl = `${baseUrl}/`;
  const supportEmail = "support@sitguru.com";

  const logoLightUrl = `${baseUrl}/images/sitguru-logo-cropped.png`;
  const logoDarkUrl = `${baseUrl}/images/sitguru-logo-dark.png`;
  const heroPhotoUrl = `${baseUrl}/images/hero/sitguru-pet-care-signup-bandanas.jpg`;
  const rogueUrl = `${baseUrl}/images/rogue-avatar.png`;
  const markUrl = `${baseUrl}/images/sitguru-logo-mark.png`;

  const subject = "Welcome to the SitGuru community";
  const preheader =
    "Welcome to the SitGuru community — trusted pet care starts here.";

  const text = [
    "Welcome to the SitGuru community!",
    "",
    preheader,
    "",
    `Hi ${name} — we’re so happy to have you here.`,
    "",
    "SitGuru connects Pet Parents with trusted, caring Pet Gurus and a community that puts pets first.",
    "",
    "Trusted Community",
    "Reviewed profiles and real pet lovers.",
    "",
    "Happier Pets",
    "Loving care while you’re away.",
    "",
    "A Supportive Network",
    "Tips, resources, and a growing local pet-care community.",
    "",
    "Explore SitGuru:",
    homeUrl,
    "",
    "Thank you for joining us. We can’t wait to be part of your pet care journey and help you and your pets thrive!",
    "",
    "Woof and purrs,",
    "The SitGuru Team",
    "Trusted Pet Care. Simplified.",
    "",
    `Website: ${homeUrl}`,
    `Support: ${supportEmail}`,
    "",
    `Facebook: ${SOCIAL_LINKS[0].href}`,
    `Instagram: ${SOCIAL_LINKS[1].href}`,
    `TikTok: ${SOCIAL_LINKS[2].href}`,
    `X: ${SOCIAL_LINKS[3].href}`,
    `YouTube: ${SOCIAL_LINKS[4].href}`,
    "",
    `Manage preferences: ${preferencesUrl}`,
    `Unsubscribe anytime: ${unsubscribeUrl}`,
  ].join("\n");

  const linkStyle = `color:#0D5C3A;font-weight:700;text-decoration:underline;font-family:${SITGURU_EMAIL_FONT_FAMILY};`;
  const featuresHtml = FEATURES.map((feature) =>
    featureCard(feature.title, feature.body),
  ).join("");
  const socialHtml = SOCIAL_LINKS.map((link) => socialLinkCell(link)).join("");

  const html = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" style="color-scheme:light dark;supported-color-schemes:light dark;">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Welcome to the SitGuru community</title>
  ${SITGURU_EMAIL_FONT_HEAD}
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style>
    table, td { font-family: Arial, Helvetica, sans-serif; }
  </style>
  <![endif]-->
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; font-family: ${SITGURU_EMAIL_FONT_FAMILY} !important; }
    * { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; display: block; max-width: 100%; height: auto; }
    a { text-decoration: underline; }
    .email-container { width: 100% !important; max-width: 640px !important; }
    body, table, td, th, p, a, li, span, div, h1, h2, h3, h4, h5, h6 {
      font-family: ${SITGURU_EMAIL_FONT_FAMILY} !important;
    }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .outer-pad { padding: 12px 8px !important; }
      .stack-column { display: block !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; }
      .logo-pad { padding: 22px 16px 12px !important; }
      .logo-img { width: 176px !important; max-width: 176px !important; height: auto !important; }
      .hero-pad { padding: 22px 18px 20px !important; }
      .hero-title { font-size: 26px !important; line-height: 1.25 !important; }
      .body-pad { padding: 22px 16px 8px !important; }
      .footer-pad { padding: 18px 16px 22px !important; }
      .companion-img { width: 120px !important; max-width: 120px !important; height: auto !important; }
      .cta-btn { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
      .social-item { box-sizing: border-box !important; width: 33.33% !important; max-width: 33.33% !important; padding: 8px 2px !important; }
      .hero-photo { width: 100% !important; max-width: 100% !important; height: auto !important; }
    }
    @media (prefers-color-scheme: dark) {
      .bg-page { background-color: #07140f !important; }
      .bg-card { background-color: #10241c !important; border-color: #1d4a36 !important; }
      .bg-logo { background-color: #0e1c36 !important; }
      .bg-hero { background-color: #0D5C3A !important; }
      .bg-feature { background-color: #17362a !important; border-color: #1f5a40 !important; }
      .bg-footer { background-color: #0c1c16 !important; }
      .text-body { color: #f4fbf7 !important; }
      .text-secondary { color: #d7eee4 !important; }
      .text-hero, .text-hero-sub { color: #ffffff !important; }
      .text-feature-title { color: #d9f7e5 !important; }
      .link { color: #b6f3d4 !important; }
      .cta-btn { background-color: #0D5C3A !important; color: #ffffff !important; }
      .logo-light { display: none !important; max-height: 0 !important; overflow: hidden !important; }
      .logo-dark-wrap { display: block !important; max-height: none !important; overflow: visible !important; }
      .accent-bar { background-color: #8ee0b8 !important; }
    }
    [data-ogsc] .text-body { color: #f4fbf7 !important; }
    [data-ogsc] .text-secondary { color: #d7eee4 !important; }
    [data-ogsc] .text-hero, [data-ogsc] .text-hero-sub { color: #ffffff !important; }
    [data-ogsc] .text-feature-title { color: #d9f7e5 !important; }
    [data-ogsc] .link { color: #b6f3d4 !important; }
    [data-ogsc] .cta-btn { background-color: #0D5C3A !important; color: #ffffff !important; }
    [data-ogsb] .bg-page { background-color: #07140f !important; }
    [data-ogsb] .bg-card { background-color: #10241c !important; }
    [data-ogsb] .bg-logo { background-color: #0e1c36 !important; }
    [data-ogsb] .bg-hero { background-color: #0D5C3A !important; }
    [data-ogsb] .bg-feature { background-color: #17362a !important; }
    [data-ogsb] .bg-footer { background-color: #0c1c16 !important; }
  </style>
</head>
<body class="bg-page" style="margin:0;padding:0;background-color:#e6f5ec;width:100%;font-family:${SITGURU_EMAIL_FONT_FAMILY};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
    ${preheader}
    &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="bg-page" bgcolor="#e6f5ec" style="background-color:#e6f5ec;width:100%;">
    <tr>
      <td align="center" class="outer-pad" style="padding:24px 12px;">
        <!--[if mso]>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640"><tr><td>
        <![endif]-->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-container bg-card" bgcolor="#ffffff" style="width:100%;max-width:640px;background-color:#ffffff;border:1px solid #cfe8d9;border-radius:24px;overflow:hidden;">

          <tr>
            <td align="center" class="bg-logo logo-pad" bgcolor="#ffffff" style="background-color:#ffffff;padding:28px 24px 16px;">
              <a href="${homeUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
                <img class="logo-img logo-light" src="${logoLightUrl}" width="210" height="75" alt="SitGuru" style="display:block;border:0;width:210px;max-width:210px;height:auto;margin:0 auto;" />
              </a>
              <div class="logo-dark-wrap" style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
                <a href="${homeUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
                  <img class="logo-img logo-dark" src="${logoDarkUrl}" width="210" height="79" alt="SitGuru" style="display:block;border:0;width:210px;max-width:210px;height:auto;margin:0 auto;" />
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:0;font-size:0;line-height:0;">
              <img class="hero-photo" src="${heroPhotoUrl}" width="640" height="358" alt="A smiling caregiver outdoors with two dogs in SitGuru bandanas" style="display:block;border:0;width:100%;max-width:640px;height:auto;" />
            </td>
          </tr>

          <tr>
            <td class="bg-hero hero-pad" bgcolor="#0D5C3A" style="background-color:#0D5C3A;padding:28px 28px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="stack-column" width="68%" valign="middle" style="width:68%;padding:0 16px 0 0;">
                    <h1 class="hero-title text-hero" style="margin:0;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:32px;line-height:1.2;color:#ffffff;font-weight:800;">
                      Welcome to the SitGuru community!
                    </h1>
                    <p class="text-hero-sub" style="margin:14px 0 0;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:16px;line-height:1.55;color:#e8fff3;">
                      Hi ${safeName} — we’re so happy to have you here.
                    </p>
                  </td>
                  <td class="stack-column" width="32%" valign="middle" align="center" style="width:32%;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" bgcolor="#ffffff" style="background-color:#ffffff;border-radius:18px;">
                      <tr>
                        <td style="padding:6px;background-color:#ffffff;border-radius:18px;">
                          <img class="companion-img" src="${rogueUrl}" width="128" height="171" alt="Rogue, SitGuru’s German Shorthaired Pointer" style="display:block;border:0;width:128px;max-width:128px;height:auto;border-radius:14px;background-color:#ffffff;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="body-pad text-body" style="padding:28px 28px 8px;font-family:${SITGURU_EMAIL_FONT_FAMILY};color:#10233f;font-size:16px;line-height:1.65;">
              <p class="text-body" style="margin:0;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:16px;line-height:1.65;color:#10233f;">
                SitGuru connects Pet Parents with trusted, caring Pet Gurus and a community that puts pets first.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;">
                <tr>
                  ${featuresHtml}
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
                <tr>
                  <td align="center" style="padding:8px 0 6px;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${homeUrl}" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="16%" strokecolor="#0D5C3A" fillcolor="#0D5C3A">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;">Explore SitGuru</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${homeUrl}" target="_blank" rel="noopener noreferrer" class="cta-btn" style="display:inline-block;background-color:#0D5C3A;border:2px solid #08482d;color:#ffffff;text-decoration:none;padding:16px 36px;border-radius:14px;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:16px;font-weight:800;line-height:1.2;">Explore SitGuru</a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>

              <p class="text-body" style="margin:22px 0 0;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:16px;line-height:1.65;color:#10233f;">
                Thank you for joining us. We can’t wait to be part of your pet care journey and help you and your pets thrive!
              </p>
              <p class="text-body" style="margin:18px 0 0;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:16px;line-height:1.55;color:#10233f;">
                Woof and purrs,<br />
                <strong>The SitGuru Team</strong><br />
                <span class="text-secondary" style="color:#1c3d30;">Trusted Pet Care. Simplified.</span>
              </p>
            </td>
          </tr>

          <tr>
            <td class="bg-footer footer-pad" bgcolor="#f3fbf6" style="padding:8px 20px 26px;background-color:#f3fbf6;border-top:1px solid #e1f2e8;font-family:${SITGURU_EMAIL_FONT_FAMILY};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:12px 8px 4px;">
                    <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background-color:#ffffff;border-radius:22px;">
                      <tr>
                        <td align="center" valign="middle" width="44" height="44" bgcolor="#ffffff" style="width:44px;height:44px;background-color:#ffffff;border-radius:22px;">
                          <img src="${markUrl}" width="28" height="27" alt="SitGuru pet mark" style="display:block;border:0;width:28px;max-width:28px;height:auto;margin:0 auto;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" class="text-body" style="padding:8px 8px 0;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:15px;line-height:1.45;font-weight:800;color:#10233f;">
                    Follow @SitGuruOfficial
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:6px 0 4px;font-size:0;line-height:0;">
                    ${socialHtml}
                  </td>
                </tr>
                <tr>
                  <td align="center" class="text-secondary" style="padding:8px 8px 0;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:15px;line-height:1.6;color:#1c3d30;">
                    ${webLink(homeUrl, "Website", linkStyle)}
                    &nbsp;&nbsp;·&nbsp;&nbsp;
                    <a href="mailto:${supportEmail}" class="link" style="${linkStyle}">${supportEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" class="text-secondary" style="padding:14px 8px 0;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:14px;line-height:1.6;color:#1c3d30;">
                    You’re receiving this because you signed up for SitGuru email updates.<br />
                    ${webLink(preferencesUrl, "Manage preferences", linkStyle)}
                    &nbsp;&nbsp;·&nbsp;&nbsp;
                    ${webLink(unsubscribeUrl, "Unsubscribe anytime", linkStyle)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
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
    from: getMarketingFromEmail(),
    replyTo: getSupportReplyToEmail(),
    isMarketing: true,
    headers: marketingUnsubscribeHeadersForToken(params.unsubscribeToken),
  });
}
