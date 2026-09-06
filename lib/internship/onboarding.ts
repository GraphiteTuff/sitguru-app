import { INTERNSHIP_PORTAL_PATH } from "@/lib/internship/constants";
import type { InternshipOnboarding } from "@/lib/internship/types";

export const INTERNSHIP_ONBOARDING_PATH = `${INTERNSHIP_PORTAL_PATH}/onboarding`;
export const INTERNSHIP_ONBOARDING_PRINT_PATH = `${INTERNSHIP_ONBOARDING_PATH}/print`;
export const INTERN_ONBOARDING_POLICY_VERSION = "2027-spring-v1";
export const INTERNSHIP_CONFIDENTIAL_BUCKET = "internship-confidential";

export const INTERN_ONBOARDING_INBOX = "intern@sitguru.com";

export const INTERN_ONBOARDING_STEPS = [
  {
    id: "access",
    title: "Access rules",
    blurb: "Confirm intern-safe duties before SitGuru tools open.",
  },
  {
    id: "esign",
    title: "Electronic signature",
    blurb: "Read the confidentiality notice and sign electronically.",
  },
  {
    id: "wetink",
    title: "Print, sign, upload",
    blurb: "Print the one-page signature sheet, sign in ink, and upload it.",
  },
  {
    id: "submit",
    title: "Submit",
    blurb: "Send the signed page to intern@sitguru.com and unlock the portal.",
  },
] as const;

export type InternOnboardingStepId = (typeof INTERN_ONBOARDING_STEPS)[number]["id"];

export const INTERN_ACCESS_RULES = [
  "Use only the intern portal and Growth workplace assigned to this internship. Do not attempt Admin HQ, Pet Parent records, passwords, payments, or other SitGuru systems.",
  "Keep customer and Pet Parent personally identifiable information out of drafts, screenshots, campus work, and portfolio materials. Use aggregated or anonymized results.",
  "Do not count a growth result as attributable until the supervisor verifies it from an approved SitGuru source.",
  "University logos and marks stay off intern work unless SitGuru records that the school granted permission.",
  "Drafts wait for Jason. Do not publish, boost, or send SitGuru communications until they are approved.",
] as const;

export const INTERN_CONFIDENTIALITY_NOTICE = {
  title:
    "Confidentiality, Proprietary Information, Data Security & Intellectual Property Notice",
  employer: "Graff Enterprises LLC d/b/a SitGuru",
  subtitle: "Spring 2027 Social Media & Community Growth Internship — required onboarding",
  intro:
    "Access to the SitGuru intern portal is conditioned on reading, electronically signing, and returning a wet-ink signed copy of this notice. This page is an onboarding condition for students in the SitGuru internship. It is not legal advice and does not replace a separate attorney-reviewed CDA or IP assignment if SitGuru later requires one.",
  sections: [
    {
      heading: "1. Protected information",
      body: "Protected information includes SitGuru and Graff Enterprises LLC trade secrets, unpublished product and growth plans, non-public analytics, credentials, customer or Pet Parent information, partner terms, intern personnel files, draft creative, and any other non-public business information the student receives because of this internship. Treat it as confidential whether it is labeled confidential or not.",
    },
    {
      heading: "2. Student duties",
      body: "Use protected information only for assigned internship work. Limit access to SitGuru-approved tools. Store files only in the intern portal or other locations Jason designates. Do not mix SitGuru confidential files into personal drives, group chats, or campus shared folders. Report suspected loss or misuse to the site supervisor immediately.",
    },
    {
      heading: "3. Prohibited conduct",
      body: "Do not copy, screenshot, download, forward, post, or discuss protected information outside the internship. Do not use it for class projects, job applications, social media, or competing work unless Jason has approved a sanitized version in writing. Do not attempt to access accounts, data, or admin tools that are not assigned to this role.",
    },
    {
      heading: "4. Ownership and work product",
      body: "Work product created for SitGuru in this internship — including copy, designs, campaign plans, tracking links, reports, and related files — is SitGuru property. The student may keep a sanitized portfolio version of the Business Growth Report after supervisor review. Sanitized means no Pet Parent PII, no passwords, and no unpublished SitGuru internals.",
    },
    {
      heading: "5. Return and deletion",
      body: "When the internship ends, or sooner if SitGuru asks, return or delete SitGuru materials in the student’s possession, including downloads and drafts outside the portal. Confirm deletion if the supervisor requests it. Portal records remain SitGuru records.",
    },
    {
      heading: "6. Audit rights",
      body: "SitGuru may review intern portal activity, assigned-tool use, and uploaded internship files to protect the business, the internship, and other people. That review is limited to internship systems and assigned work — not a license to inspect unrelated personal accounts.",
    },
    {
      heading: "7. Consequences of a violation",
      body: "A violation can result in revoked portal access, ending the internship, preserving evidence, requiring return or deletion of materials, and notifying university personnel where appropriate. SitGuru may pursue civil remedies under applicable law, including Pennsylvania’s Uniform Trade Secrets Act (12 Pa.C.S. § 5301 et seq.) and the federal Defend Trade Secrets Act (18 U.S.C. § 1836). Those civil remedies can include injunctions, recovery of actual loss or unjust enrichment or a reasonable royalty, and in willful and malicious cases potentially enhanced damages and attorney fees. A violation is not automatically a crime. Qualifying theft of trade secrets can, in appropriate cases, carry federal criminal penalties of up to 10 years for an individual under 18 U.S.C. § 1832. SitGuru will not overstate that risk: criminal exposure depends on the facts and the law, not on this notice alone.",
    },
    {
      heading: "8. Whistleblower and immunity notice",
      body: "Nothing in this notice prohibits a disclosure protected by law. Under 18 U.S.C. § 1833(b), an individual shall not be held criminally or civilly liable under any federal or state trade secret law for the disclosure of a trade secret that is made in confidence to a federal, state, or local government official, either directly or indirectly, or to an attorney, solely for the purpose of reporting or investigating a suspected violation of law; or in a complaint or other document filed in a lawsuit or other proceeding, if such filing is made under seal. If the student files a lawsuit for retaliation by SitGuru for reporting a suspected violation of law, the student may disclose the trade secret to their attorney and use the trade secret information in the court proceeding if the student files any document containing the trade secret under seal and does not disclose the trade secret except pursuant to court order. For this federal immunity notice, “employee” includes contractors and consultants.",
    },
    {
      heading: "9. Acknowledgment",
      body: "By signing electronically and by signing and uploading a printed copy, the student confirms they have read this notice, understand that portal access depends on it, and agree to follow it for the duration of the internship and afterward as to protected information and SitGuru work product. Electronic signature and wet-ink upload are both required before the intern portal and Growth workplace unlock.",
    },
  ],
} as const;

const WET_INK_EXT = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);
const WET_INK_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function internOnboardingComplete(
  ack: Pick<
    InternshipOnboarding,
    | "policyVersion"
    | "typedLegalName"
    | "accessRulesAcceptedAt"
    | "electronicSignedAt"
    | "wetInkUploadedAt"
    | "wetInkStoragePath"
    | "wetInkSubmittedAt"
  > | null | undefined,
) {
  return Boolean(
    ack &&
      ack.policyVersion === INTERN_ONBOARDING_POLICY_VERSION &&
      ack.accessRulesAcceptedAt &&
      ack.electronicSignedAt &&
      String(ack.typedLegalName || "").trim() &&
      ack.wetInkUploadedAt &&
      String(ack.wetInkStoragePath || "").trim() &&
      ack.wetInkSubmittedAt,
  );
}

export function internOnboardingStep(
  ack: InternshipOnboarding | null | undefined,
): InternOnboardingStepId {
  if (!ack?.accessRulesAcceptedAt) return "access";
  if (!ack.electronicSignedAt || !String(ack.typedLegalName || "").trim()) return "esign";
  if (!ack.wetInkUploadedAt || !String(ack.wetInkStoragePath || "").trim()) {
    return "wetink";
  }
  if (!ack.wetInkSubmittedAt) return "submit";
  return "submit";
}

export function internNamesMatch(typed: string, legalName: string) {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const signed = normalize(typed);
  const expected = normalize(legalName);
  if (!signed || !expected) return false;
  if (signed === expected) return true;
  const signedParts = signed.split(/\s+/);
  const expectedParts = expected.split(/\s+/);
  if (signedParts.length < 2 || expectedParts.length < 2) return false;
  const signedSet = new Set(signedParts);
  const expectedSet = new Set(expectedParts);
  return (
    signedParts.every((part) => expectedSet.has(part)) ||
    expectedParts.every((part) => signedSet.has(part))
  );
}

export function internAllowedConfidentialUpload(file: {
  name?: string | null;
  type?: string | null;
  size?: number | null;
}) {
  const name = String(file.name || "");
  const mime = String(file.type || "").toLowerCase();
  const size = Number(file.size || 0);
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (size <= 0) return "Choose the signed PDF or photo.";
  if (size > 10 * 1024 * 1024) return "The signed page must be 10MB or smaller.";
  if (!WET_INK_EXT.has(ext) && !WET_INK_MIME.has(mime)) {
    return "Upload a PDF or photo of the signed page.";
  }
  return "";
}

export function internOnboardingStatusLabel(ack: InternshipOnboarding | null | undefined) {
  if (internOnboardingComplete(ack)) return "Complete";
  const step = internOnboardingStep(ack);
  if (step === "access") return "Access rules pending";
  if (step === "esign") return "Electronic signature pending";
  if (step === "wetink") return "Signed page upload pending";
  return "Submit to intern@sitguru.com pending";
}
