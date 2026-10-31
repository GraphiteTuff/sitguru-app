function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildManagerLoginInstructions(input: {
  fullName: string;
  email: string;
  setPasswordUrl: string;
  loginUrl: string;
  portalUrl: string;
}) {
  const name = input.fullName.trim() || "there";
  const email = input.email.trim().toLowerCase();
  const subject = "Your SitGuru Manager Portal login";
  const text = [
    `Hi ${name},`,
    "",
    "Your SitGuru Manager Portal login is ready.",
    "",
    `Work email: ${email}`,
    "",
    "1. Set your password with this secure link. It expires, and it does not change your password until you open it:",
    input.setPasswordUrl,
    "",
    "2. Sign in with Email Login (not a phone code):",
    input.loginUrl,
    "",
    "3. That sign-in opens the Manager Portal:",
    input.portalUrl,
    "",
    "This login is for the Manager Portal. It is not an Admin HQ login and it is not an intern student account.",
    "If the set-password link expires, open the sign-in page and choose Forgot password with this same work email.",
    "",
    "SitGuru",
  ].join("\n");

  const html = `<div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5">
<p>Hi ${escapeHtml(name)},</p>
<p>Your SitGuru Manager Portal login is ready.</p>
<p><strong>Work email:</strong> ${escapeHtml(email)}</p>
<ol>
<li>Set your password with this secure link. It expires, and it does not change your password until you open it.<br/><a href="${escapeHtml(input.setPasswordUrl)}" style="color:#0D5C3A;font-weight:700">Set your SitGuru password</a></li>
<li>Sign in with Email Login, not a phone code.<br/><a href="${escapeHtml(input.loginUrl)}" style="color:#0D5C3A;font-weight:700">Sign in to SitGuru</a></li>
<li>That sign-in opens the Manager Portal.<br/><a href="${escapeHtml(input.portalUrl)}" style="color:#0D5C3A;font-weight:700">Open the Manager Portal</a></li>
</ol>
<p>This login is for the Manager Portal. It is not an Admin HQ login and it is not an intern student account.</p>
<p>If the set-password link expires, open the sign-in page and choose Forgot password with this same work email.</p>
<p style="color:#64748b">SitGuru</p>
</div>`;

  return { subject, html, text };
}
