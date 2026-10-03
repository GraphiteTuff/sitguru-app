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

const SOCIAL_LINKS = [
  {
    id: "instagram",
    alt: "Instagram",
    href: "https://www.instagram.com/SitGuruOfficial",
    label: "instagram.com/<br>SitGuruOfficial",
  },
  {
    id: "facebook",
    alt: "Facebook",
    href: "https://www.facebook.com/SitGuruOfficial",
    label: "facebook.com/<br>SitGuruOfficial",
  },
  {
    id: "x",
    alt: "X",
    href: "https://x.com/SitGuruOfficial",
    label: "x.com/<br>SitGuruOfficial",
  },
  {
    id: "youtube",
    alt: "YouTube",
    href: "https://www.youtube.com/@SitGuruOfficial",
    label: "youtube.com/<br>@SitGuruOfficial",
  },
  {
    id: "tiktok",
    alt: "TikTok",
    href: "https://www.tiktok.com/@SitGuruOfficial",
    label: "tiktok.com/<br>@SitGuruOfficial",
  },
] as const;

const FEATURES = [
  {
    title: "Trusted Community",
    body: "Verified sitters and real pet lovers.",
    icon: "shield",
    alt: "Trusted community",
  },
  {
    title: "Happier Pets",
    body: "Loving care while you’re away.",
    icon: "heart",
    alt: "Happier pets",
  },
  {
    title: "A Supportive Network",
    body: "Tips, resources, and fellow pet parents.",
    icon: "people",
    alt: "Supportive network",
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

function themePair(options: {
  lightSrc: string;
  darkSrc: string;
  width: number;
  height: number;
  alt: string;
  imgClass: string;
  imgStyle: string;
}) {
  const img = (src: string, extraClass: string) =>
    `<img class="${options.imgClass} ${extraClass}" src="${src}" width="${options.width}" height="${options.height}" alt="${escapeHtml(options.alt)}" style="${options.imgStyle}" />`;
  return `${img(options.lightSrc, "theme-light")}
    <div class="theme-dark-wrap" style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:0;line-height:0;">
      ${img(options.darkSrc, "theme-dark")}
    </div>`;
}

/**
 * Email Updates welcome. Marketing only.
 * Visual source: approved light/dark welcome mockup.
 * The approved design does not greet by first name.
 */
export function buildEmailUpdatesWelcome(params: WelcomeEmailParams) {
  const baseUrl = getEmailBaseUrl();
  const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${encodeURIComponent(params.unsubscribeToken)}`;
  const preferencesUrl = `${baseUrl}/customer/dashboard/profile/notifications`;
  const homeUrl = `${baseUrl}/`;
  const supportEmail = "support@sitguru.com";
  const asset = (path: string) => `${baseUrl}/images/email/${path}`;

  const subject = "Welcome to the SitGuru community";
  const preheader =
    "Welcome to the SitGuru community — trusted pet care starts here.";

  const text = [
    "Welcome to the SitGuru community!",
    "",
    preheader,
    "",
    "We’re so happy to have you here! SitGuru connects pet parents with trusted, caring sitters and a community that puts pets first.",
    "",
    "Trusted Community",
    "Verified sitters and real pet lovers.",
    "",
    "Happier Pets",
    "Loving care while you’re away.",
    "",
    "A Supportive Network",
    "Tips, resources, and fellow pet parents.",
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
    ...SOCIAL_LINKS.map((link) => `${link.alt}: ${link.href}`),
    "",
    `Manage preferences: ${preferencesUrl}`,
    `Unsubscribe anytime: ${unsubscribeUrl}`,
  ].join("\n");

  const logo = themePair({
    lightSrc: `${baseUrl}/images/sitguru-logo-cropped.png`,
    darkSrc: asset("sitguru-logo-on-dark.png"),
    width: 320,
    height: 114,
    alt: "SitGuru — Trusted Pet Care. Simplified.",
    imgClass: "logo-img",
    imgStyle:
      "display:block;border:0;width:320px;max-width:320px;height:auto;margin:0 auto;",
  });

  const pets = themePair({
    lightSrc: asset("welcome-pets-light.png"),
    darkSrc: asset("welcome-pets-dark.png"),
    width: 600,
    height: 286,
    alt: "A golden retriever, tabby cat, and small dog together on a pet bed",
    imgClass: "pets-img",
    imgStyle:
      "display:block;border:0;width:100%;max-width:600px;height:auto;margin:0 auto;",
  });

  const paw = (width: number) =>
    themePair({
      lightSrc: asset("icons/paw.png"),
      darkSrc: asset("icons/paw-dark.png"),
      width,
      height: width,
      alt: "Paw print",
      imgClass: "accent-img",
      imgStyle: `display:block;border:0;width:${width}px;max-width:${width}px;height:auto;`,
    });

  const heartAccent = themePair({
    lightSrc: asset("icons/heart-outline.png"),
    darkSrc: asset("icons/heart-outline-dark.png"),
    width: 28,
    height: 28,
    alt: "Heart",
    imgClass: "accent-img",
    imgStyle: "display:block;border:0;width:28px;max-width:28px;height:auto;",
  });

  const featureCells = FEATURES.map((feature) => {
    const icon = themePair({
      lightSrc: asset(`icons/${feature.icon}.png`),
      darkSrc: asset(`icons/${feature.icon}-dark.png`),
      width: 34,
      height: 34,
      alt: feature.alt,
      imgClass: "feature-icon",
      imgStyle: "display:block;border:0;width:34px;max-width:34px;height:auto;margin:0 auto;",
    });
    return `
      <td class="feature-col" width="33.33%" valign="top" align="center" style="width:33.33%;padding:8px 6px 4px;">
        <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td class="icon-bubble" align="center" valign="middle" width="52" height="52" bgcolor="#E7F8F1" style="width:52px;height:52px;background-color:#E7F8F1;border-radius:26px;">
              ${icon}
            </td>
          </tr>
        </table>
        <p class="text-feature-title" style="margin:10px 0 4px;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:15px;line-height:1.3;font-weight:800;color:#10233f;">${escapeHtml(feature.title)}</p>
        <p class="text-secondary" style="margin:0;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:14px;line-height:1.4;color:#3e5164;">${escapeHtml(feature.body)}</p>
      </td>`;
  }).join("");

  const socialCells = SOCIAL_LINKS.map(
    (link) => `
      <div class="social-cell" align="center" style="display:inline-block;width:104px;max-width:104px;min-width:0;box-sizing:border-box;padding:4px 2px;vertical-align:top;text-align:center;">
        <a href="${link.href}" target="_blank" rel="noopener noreferrer" class="link" title="${link.alt}" aria-label="SitGuru on ${link.alt}" style="text-decoration:none;display:inline-block;">
          <img class="social-icon" src="${asset(`social/${link.id}.png`)}" width="32" height="32" alt="${link.alt}" style="display:block;border:0;width:32px;height:32px;max-width:32px;margin:0 auto;" />
          <span class="social-label text-secondary" style="display:block;margin-top:6px;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:11px;line-height:1.25;font-weight:600;color:#3e5164;">${link.label}</span>
        </a>
      </div>`,
  ).join("");

  const linkStyle = `color:#017a45;font-weight:700;text-decoration:underline;font-family:${SITGURU_EMAIL_FONT_FAMILY};`;

  const globe = themePair({
    lightSrc: asset("icons/globe.png"),
    darkSrc: asset("icons/globe-dark.png"),
    width: 16,
    height: 16,
    alt: "Website",
    imgClass: "mini-icon",
    imgStyle: "display:block;border:0;width:16px;max-width:16px;height:auto;",
  });
  const mail = themePair({
    lightSrc: asset("icons/mail.png"),
    darkSrc: asset("icons/mail-dark.png"),
    width: 16,
    height: 16,
    alt: "Email",
    imgClass: "mini-icon",
    imgStyle: "display:block;border:0;width:16px;max-width:16px;height:auto;",
  });

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
  <![endif]-->
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    * { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    a { text-decoration: underline; }
    .email-container { width: 100% !important; max-width: 600px !important; }
    body, table, td, p, a, span, div, h1 {
      font-family: ${SITGURU_EMAIL_FONT_FAMILY} !important;
    }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .outer-pad { padding: 8px 0 !important; }
      .logo-pad { padding: 22px 16px 6px !important; }
      .logo-img { width: 230px !important; max-width: 82% !important; height: auto !important; }
      .headline-pad { padding: 8px 18px 0 !important; }
      .hero-title { font-size: 28px !important; line-height: 1.15 !important; }
      .intro-pad { padding: 10px 22px 0 !important; }
      .feature-pad { padding: 8px 12px 0 !important; }
      .feature-col { padding-left: 4px !important; padding-right: 4px !important; }
      .cta-wrap { padding: 16px 16px 6px !important; }
      .cta-btn { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
      .hide-narrow { display: none !important; max-height: 0 !important; overflow: hidden !important; }
      .close-pad { padding: 12px 18px 0 !important; }
      .footer-pad { padding: 16px 10px 22px !important; }
      .social-cell { display: inline-block !important; width: 33.33% !important; max-width: 33.33% !important; min-width: 0 !important; box-sizing: border-box !important; }
      .social-label { font-size: 11px !important; }
      .contact-item { display: block !important; width: 100% !important; text-align: center !important; padding: 4px 0 !important; }
      .contact-sep { display: none !important; max-height: 0 !important; overflow: hidden !important; }
      .pets-img { width: 100% !important; max-width: 100% !important; height: auto !important; }
    }
    @media (prefers-color-scheme: dark) {
      .bg-page { background-color: #031018 !important; }
      .bg-card, .bg-hero, .bg-footer { background-color: #041820 !important; }
      .bg-feature { background-color: #071e28 !important; border-color: #134840 !important; }
      .icon-bubble { background-color: #0d3330 !important; }
      .text-body, .text-navy, .text-hero { color: #f4fbf8 !important; }
      .text-secondary, .social-label { color: #d5ebe4 !important; }
      .text-brand, .text-signature { color: #00f0b8 !important; }
      .text-feature-title { color: #f7fffc !important; }
      .link { color: #7ddec4 !important; }
      .cta-btn { background-color: #00c98a !important; border-color: #00c98a !important; color: #ffffff !important; }
      .theme-light { display: none !important; max-height: 0 !important; overflow: hidden !important; }
      .theme-dark-wrap { display: block !important; max-height: none !important; overflow: visible !important; height: auto !important; }
    }
    [data-ogsc] .text-body, [data-ogsc] .text-navy, [data-ogsc] .text-hero { color: #f4fbf8 !important; }
    [data-ogsc] .text-secondary, [data-ogsc] .social-label { color: #d5ebe4 !important; }
    [data-ogsc] .text-brand, [data-ogsc] .text-signature { color: #00f0b8 !important; }
    [data-ogsc] .text-feature-title { color: #f7fffc !important; }
    [data-ogsc] .link { color: #7ddec4 !important; }
    [data-ogsc] .cta-btn { background-color: #00c98a !important; color: #ffffff !important; }
    [data-ogsb] .bg-page, [data-ogsb] .bg-card, [data-ogsb] .bg-hero, [data-ogsb] .bg-footer { background-color: #041820 !important; }
    [data-ogsb] .bg-feature { background-color: #071e28 !important; }
    [data-ogsb] .icon-bubble { background-color: #0d3330 !important; }
  </style>
</head>
<body class="bg-page" style="margin:0;padding:0;background-color:#e7f6f0;width:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
    ${preheader}
    &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-page" bgcolor="#e7f6f0" style="background-color:#e7f6f0;width:100%;">
    <tr>
      <td align="center" class="outer-pad" style="padding:16px 10px;">
        <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-container bg-card" bgcolor="#f6fdfb" style="width:100%;max-width:600px;background-color:#f6fdfb;border-radius:28px;overflow:hidden;">
          <tr>
            <td align="center" class="bg-hero logo-pad" bgcolor="#f6fdfb" style="background-color:#f6fdfb;padding:28px 24px 4px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="36" valign="top" align="left" style="width:36px;">${paw(26)}</td>
                  <td align="center">
                    <a href="${homeUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">${logo}</a>
                  </td>
                  <td width="36" valign="top" align="right" style="width:36px;">${paw(30)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" class="bg-hero headline-pad" bgcolor="#f6fdfb" style="background-color:#f6fdfb;padding:8px 28px 0;">
              <h1 class="hero-title text-hero" style="margin:0;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:34px;line-height:1.12;font-weight:800;color:#10233f;">
                <span class="text-navy" style="color:#10233f;">Welcome to the</span><br />
                <span class="text-brand" style="color:#017a45;">SitGuru</span> <span class="text-navy" style="color:#10233f;">community!</span>
              </h1>
            </td>
          </tr>
          <tr>
            <td align="center" class="bg-card intro-pad text-body" bgcolor="#f6fdfb" style="background-color:#f6fdfb;padding:12px 36px 4px;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:16px;line-height:1.5;color:#243246;">
              <p class="text-body" style="margin:0;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:16px;line-height:1.5;color:#243246;">
                We’re so happy to have you here! SitGuru connects pet parents with trusted, caring sitters and a community that puts pets first.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" class="bg-hero" bgcolor="#f6fdfb" style="background-color:#f6fdfb;padding:8px 0 0;font-size:0;line-height:0;">
              ${pets}
            </td>
          </tr>
          <tr>
            <td class="bg-card feature-pad" bgcolor="#f6fdfb" style="background-color:#f6fdfb;padding:6px 18px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-feature" bgcolor="#ffffff" style="width:100%;background-color:#ffffff;border:1px solid #e3f3ec;border-radius:26px;">
                <tr>
                  ${featureCells}
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" class="bg-card cta-wrap" bgcolor="#f6fdfb" style="background-color:#f6fdfb;padding:18px 28px 4px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%">
                <tr>
                  <td class="hide-narrow" width="28" valign="middle" align="center">${paw(18)}</td>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${homeUrl}" style="height:54px;v-text-anchor:middle;width:320px;" arcsize="50%" strokecolor="#017a45" fillcolor="#017a45">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:18px;font-weight:bold;">Explore SitGuru →</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${homeUrl}" target="_blank" rel="noopener noreferrer" class="cta-btn" style="display:inline-block;background-color:#017a45;border:2px solid #017a45;color:#ffffff;text-decoration:none;padding:16px 42px;border-radius:999px;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:18px;font-weight:800;line-height:1.2;">Explore SitGuru →</a>
                    <!--<![endif]-->
                  </td>
                  <td class="hide-narrow" width="28" valign="middle" align="center">${paw(18)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" class="bg-card close-pad text-body" bgcolor="#f6fdfb" style="background-color:#f6fdfb;padding:16px 32px 0;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:16px;line-height:1.5;color:#243246;">
              <p class="text-body" style="margin:0;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:16px;line-height:1.5;color:#243246;">
                Thank you for joining us. We can’t wait to be part of your pet care journey and help you and your pets thrive!
              </p>
              <p class="text-body" style="margin:14px 0 0;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:16px;line-height:1.45;color:#243246;">
                Woof and purrs,<br />
                <strong class="text-signature" style="color:#017a45;font-size:18px;">The SitGuru Team</strong>
              </p>
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
                <tr>
                  <td style="padding:0 8px;">${heartAccent}</td>
                  <td style="padding:0 8px;">${paw(26)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" class="bg-footer footer-pad" bgcolor="#f6fdfb" style="background-color:#f6fdfb;padding:18px 12px 26px;">
              <p class="text-secondary" style="margin:0 0 12px;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:12px;line-height:1.4;letter-spacing:0.14em;font-weight:800;color:#5d7384;text-transform:uppercase;">
                Trusted Pet Care. Simplified.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="font-size:0;line-height:0;">
                    ${socialCells}
                  </td>
                </tr>
              </table>
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" class="contact-table" style="margin-top:14px;">
                <tr>
                  <td class="contact-item" align="center" valign="middle" style="padding:0 8px;">
                    <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle" style="padding:0 6px 0 0;">${globe}</td>
                        <td valign="middle" class="text-secondary" style="font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:14px;line-height:1.4;color:#243246;">
                          <a href="${homeUrl}" target="_blank" rel="noopener noreferrer" class="link" style="${linkStyle}">www.sitguru.com</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td class="contact-sep" valign="middle" style="padding:0 8px;color:#c5ddd4;">|</td>
                  <td class="contact-item" align="center" valign="middle" style="padding:0 8px;">
                    <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle" style="padding:0 6px 0 0;">${mail}</td>
                        <td valign="middle" class="text-secondary" style="font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:14px;line-height:1.4;color:#243246;">
                          <a href="mailto:${supportEmail}" class="link" style="${linkStyle}">${supportEmail}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p class="text-secondary" style="margin:14px 0 0;font-family:${SITGURU_EMAIL_FONT_FAMILY};font-size:13px;line-height:1.5;color:#3e5164;">
                <a href="${preferencesUrl}" target="_blank" rel="noopener noreferrer" class="link" style="${linkStyle}">Manage preferences</a>
                &nbsp;&nbsp;·&nbsp;&nbsp;
                <a href="${unsubscribeUrl}" target="_blank" rel="noopener noreferrer" class="link" style="${linkStyle}">Unsubscribe anytime</a>
              </p>
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
