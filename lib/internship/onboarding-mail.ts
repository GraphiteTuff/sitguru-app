import { sendSitGuruEmail } from "@/lib/email/resend";
import {
  INTERN_ONBOARDING_INBOX,
  INTERNSHIP_ONBOARDING_PATH,
} from "@/lib/internship/onboarding";
import { internPortalFirstName } from "@/lib/internship/portal";
import type { InternshipIntern, InternshipOnboarding } from "@/lib/internship/types";

function escapeHtml(value: string) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function internConfirmationEmails(intern: Pick<InternshipIntern, "email" | "studentEmail">) {
  const emails = [intern.email, intern.studentEmail]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter((value) => value.includes("@"));
  return [...new Set(emails)];
}

export async function sendInternConfidentialityReceipts(input: {
  intern: InternshipIntern;
  onboarding: InternshipOnboarding;
  fileName: string;
  fileBytes: Buffer;
  contentType?: string;
}) {
  const name = internPortalFirstName(input.intern) || input.intern.fullName || "Intern";
  const legalName = input.onboarding.typedLegalName || input.intern.fullName;
  const internEmails = internConfirmationEmails(input.intern);
  const portalUrl = `https://www.sitguru.com${INTERNSHIP_ONBOARDING_PATH.replace("/onboarding", "")}`;
  const attachment = {
    filename: input.fileName || "signed-confidentiality-page.pdf",
    content: input.fileBytes.toString("base64"),
    contentType: input.contentType || "application/pdf",
  };

  await sendSitGuruEmail({
    to: INTERN_ONBOARDING_INBOX,
    replyTo: internEmails[0],
    subject: `Signed confidentiality page — ${legalName}`,
    text: [
      `${legalName} submitted a signed SitGuru internship confidentiality page.`,
      `Intern email: ${internEmails.join(", ") || "not on file"}`,
      `File: ${attachment.filename}`,
      "The intern portal is unlocked after this submit.",
    ].join("\n"),
    html: `<p style="font-family:Arial,sans-serif;color:#0f172a"><strong>${escapeHtml(legalName)}</strong> submitted a signed SitGuru internship confidentiality page.</p><p style="font-family:Arial,sans-serif;color:#334155">Intern email: ${escapeHtml(internEmails.join(", ") || "not on file")}<br/>File: ${escapeHtml(attachment.filename)}</p>`,
    attachments: [attachment],
  });

  if (!internEmails.length) {
    return { internEmailed: false };
  }

  const internTo = internEmails.filter((email) => email !== INTERN_ONBOARDING_INBOX);
  if (!internTo.length) return { internEmailed: true };

  await sendSitGuruEmail({
    to: internTo.length === 1 ? internTo[0] : internTo,
    replyTo: INTERN_ONBOARDING_INBOX,
    subject: "Your SitGuru internship confidentiality page is on file",
    text: [
      `Hi ${name},`,
      "",
      "Your signed SitGuru internship confidentiality page is on file.",
      "SitGuru keeps the signed page in SitGuru-controlled storage.",
      "Your intern portal is now open.",
      "",
      `Open the intern portal: ${portalUrl}`,
      "",
      "SitGuru Internship Program",
    ].join("\n"),
    html: `<div style="font-family:Arial,sans-serif;color:#0f172a"><p>Hi ${escapeHtml(name)},</p><p>Your signed SitGuru internship confidentiality page is <strong>on file</strong>.</p><p>SitGuru keeps the signed page in SitGuru-controlled storage. Your intern portal is now open.</p><p><a href="${portalUrl}" style="color:#0D5C3A;font-weight:700">Open the intern portal</a></p><p style="color:#64748b">SitGuru Internship Program</p></div>`,
  });

  return { internEmailed: true };
}
