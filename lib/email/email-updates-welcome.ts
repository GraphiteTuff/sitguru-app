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

export function buildEmailUpdatesWelcome(params: WelcomeEmailParams) {
  const baseUrl = getBaseUrl();
  const name = firstNameFrom(params.fullName, params.to);
  const safeName = escapeHtml(name);
  const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${encodeURIComponent(params.unsubscribeToken)}`;
  const petperksUrl = `${baseUrl}/petperks`;
  const programsUrl = `${baseUrl}/programs`;
  const searchUrl = `${baseUrl}/search`;
  const becomeGuruUrl = `${baseUrl}/become-a-guru`;
  const preferencesUrl = `${baseUrl}/customer/dashboard/profile/notifications`;

  const subject = "Welcome to the SitGuru pack — we’re so glad you’re here";

  const text = [
    `Hi ${name},`,
    "",
    "Welcome to SitGuru email updates — we’re genuinely happy you’re here.",
    "",
    "SitGuru is your pet-care community: trusted Gurus, warm local support, and ways to earn and save with the pack.",
    "",
    "Here’s what you can explore:",
    `- PawPerks rewards & savings: ${petperksUrl}`,
    `- SitGuru programs & community paths: ${programsUrl}`,
    `- Find trusted pet care near you: ${searchUrl}`,
    `- Become a Guru and share your care: ${becomeGuruUrl}`,
    "",
    "We’ll send news, offers, and announcements worth opening — never spam.",
    "",
    `Manage preferences: ${preferencesUrl}`,
    `Unsubscribe anytime: ${unsubscribeUrl}`,
    "",
    "With love from the SitGuru pack,",
    "Rogue & the SitGuru team",
    "@SitGuruOfficial",
  ].join("\n");

  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; background: #f4faf6; padding: 28px 16px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #d7eee0; border-radius: 20px; overflow: hidden;">
        <div style="background: #0D5C3A; color: #ffffff; padding: 28px 28px 24px;">
          <p style="margin: 0; font-family: Arial, sans-serif; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #d9f7e5;">SitGuru</p>
          <h1 style="margin: 10px 0 0; font-size: 28px; line-height: 1.25; color: #ffffff;">Welcome to the pack, ${safeName}.</h1>
          <p style="margin: 12px 0 0; font-family: Arial, sans-serif; font-size: 15px; line-height: 1.55; color: #e8fff3;">
            We’re so glad you signed up for email updates. SitGuru is built for pet parents and caregivers who want trusted care, real community, and a little more joy in every day.
          </p>
        </div>
        <div style="padding: 28px; color: #123524; font-family: Arial, sans-serif;">
          <p style="margin: 0; font-size: 15px; line-height: 1.65;">
            Think of this as your warm welcome hug from Rogue (our GSP mascot) and the SitGuru team. Here’s what waiting in the pack looks like:
          </p>
          <ul style="margin: 18px 0 0; padding-left: 18px; font-size: 15px; line-height: 1.7;">
            <li style="margin-bottom: 10px;"><strong>PawPerks</strong> — member rewards and savings that make caring for pets feel even better. <a href="${petperksUrl}" style="color: #0D5C3A; font-weight: 700;">Explore PawPerks</a></li>
            <li style="margin-bottom: 10px;"><strong>Programs</strong> — community paths, partnerships, and ways to grow with SitGuru. <a href="${programsUrl}" style="color: #0D5C3A; font-weight: 700;">See programs</a></li>
            <li style="margin-bottom: 10px;"><strong>Find care</strong> — match with trusted local Gurus for walks, sits, boarding, and more. <a href="${searchUrl}" style="color: #0D5C3A; font-weight: 700;">Find care near you</a></li>
            <li style="margin-bottom: 10px;"><strong>Become a Guru</strong> — share your love of pets and earn on your schedule. <a href="${becomeGuruUrl}" style="color: #0D5C3A; font-weight: 700;">Start becoming a Guru</a></li>
          </ul>
          <p style="margin: 22px 0 0; font-size: 15px; line-height: 1.65;">
            We’ll keep your inbox kind: news, exclusive offers, and announcements that help you care better and stay connected. Follow <strong>@SitGuruOfficial</strong> on Instagram, Facebook, TikTok, X, and YouTube for pack highlights too.
          </p>
          <p style="margin: 24px 0 0;">
            <a href="${searchUrl}" style="display: inline-block; background: #0D5C3A; color: #ffffff; text-decoration: none; padding: 14px 22px; border-radius: 999px; font-weight: 700;">Explore SitGuru</a>
          </p>
          <p style="margin: 28px 0 0; font-size: 13px; line-height: 1.6; color: #4b6356;">
            Manage preferences anytime in <a href="${preferencesUrl}" style="color: #0D5C3A;">My Account</a>, or
            <a href="${unsubscribeUrl}" style="color: #0D5C3A;">unsubscribe here</a>.
          </p>
          <p style="margin: 18px 0 0; font-size: 15px; line-height: 1.6;">
            With love from the SitGuru pack,<br />
            <strong>Rogue &amp; the SitGuru team</strong>
          </p>
        </div>
      </div>
    </div>
  `;

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
