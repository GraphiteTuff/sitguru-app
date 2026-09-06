import { createHash } from "node:crypto";
import { INTERNSHIP_PORTAL_PATH } from "@/lib/internship/constants";
import type { InternshipOnboarding } from "@/lib/internship/types";

export const INTERNSHIP_ONBOARDING_PATH = `${INTERNSHIP_PORTAL_PATH}/onboarding`;
export const INTERNSHIP_ONBOARDING_PRINT_PATH = `${INTERNSHIP_ONBOARDING_PATH}/print`;
export const INTERN_ONBOARDING_POLICY_VERSION = "2027-spring-v2";
export const INTERN_ONBOARDING_FULLY_EXECUTED = "fully_executed";
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
    blurb: "Print or photo the signed page, then upload it.",
  },
  {
    id: "submit",
    title: "Submit",
    blurb: "Email confirmation will be sent to your email on file.",
  },
] as const;

export type InternOnboardingStepId = (typeof INTERN_ONBOARDING_STEPS)[number]["id"];

export const INTERN_ACCESS_RULES = [
  "Use only the intern portal and Growth workplace assigned to this internship. Do not attempt Admin HQ, Pet Parent records, passwords, payments, or other SitGuru systems.",
  "Do not share SitGuru passwords, login links, session cookies, or other credentials. Do not let anyone else use this intern login.",
  "Do not enter, upload, paste, summarize, or otherwise disclose SitGuru confidential information into unapproved generative AI, chatbots, or other third-party tools.",
  "If a device is lost, an account is exposed, or confidential information is disclosed by accident, report it to SitGuru immediately.",
  "Store internship files only in the intern portal or another location SitGuru designates. Personal devices may be used only for assigned intern-portal work — not to keep SitGuru confidential files.",
  "Keep customer and Pet Parent personally identifiable information out of drafts, screenshots, campus work, and portfolio materials. Use aggregated or anonymized results.",
  "Do not count a growth result as attributable until the supervisor verifies it from an approved SitGuru source.",
  "University logos and marks stay off intern work unless SitGuru records that the school granted permission.",
  "Drafts wait for SitGuru approval. Do not publish, boost, or send SitGuru communications until they are approved. A sanitized portfolio version requires SitGuru written approval before publication.",
] as const;

export const INTERN_CONFIDENTIALITY_NOTICE = {
  title:
    "Confidentiality, Proprietary Information, Data Security & Intellectual Property Notice",
  employer: "Graff Enterprises LLC d/b/a SitGuru",
  subtitle: "Spring 2027 Social Media & Community Growth Internship — required onboarding",
  intro:
    "Access to the SitGuru intern portal is conditioned on reading this notice, signing it electronically, and completing SitGuru’s onboarding process. As SitGuru policy, the student must also print, wet-ink sign, and upload a signed copy. Pennsylvania recognizes electronic records and signatures and does not deny legal effect merely because a signature is electronic when the parties agree to transact electronically. SitGuru still requires the printed copy as an additional evidentiary safeguard — not because the law requires a wet-ink signature. This page is an onboarding condition for students in the SitGuru internship. It is not legal advice and does not replace a separate attorney-reviewed CDA or IP assignment if SitGuru later requires one.",
  sections: [
    {
      heading: "1. Protected information",
      body: "Protected information includes SitGuru and Graff Enterprises LLC trade secrets, unpublished product and growth plans, non-public analytics, credentials, customer or Pet Parent information, partner terms, intern personnel files, draft creative, and any other non-public business information the student receives because of this internship. Treat it as confidential whether it is labeled confidential or not. This notice does not treat as confidential information that is or becomes generally known other than through the student’s breach; that the student already knew before the internship without a confidentiality duty; that the student independently develops without using protected information; or that the student lawfully receives from another source that is not bound to keep it confidential for SitGuru.",
    },
    {
      heading: "2. Student duties",
      body: "Use protected information only for assigned internship work. Limit access to SitGuru-approved tools. Store files only in the intern portal or other locations SitGuru designates. Do not mix SitGuru confidential files into personal drives, group chats, or campus shared folders. Personal devices may be used only as needed to reach the intern portal for assigned work; they are not an approved place to keep SitGuru confidential files. Do not share SitGuru passwords, login links, session cookies, or other credentials, and do not allow anyone else to use this intern login. If a device is lost, an account is exposed, or confidential information is disclosed by accident, report it to SitGuru immediately.",
    },
    {
      heading: "3. Prohibited conduct",
      body: "Do not copy, screenshot, download, forward, post, or discuss protected information outside the internship. Do not use it for class projects, job applications, social media, or competing work unless SitGuru has approved a sanitized version in writing. Do not attempt to access accounts, data, or admin tools that are not assigned to this role. Do not enter, upload, paste, summarize, or otherwise disclose SitGuru confidential information, customer information, internal analytics, credentials, unpublished plans, or proprietary work product into any generative AI, chatbot, transcription service, external analytics service, or other third-party tool unless SitGuru has expressly approved that tool and use in writing.",
    },
    {
      heading: "4. Ownership and assignment of internship work product",
      body: "To the extent permitted by law, all work product created specifically for SitGuru within the scope of the internship, including campaign plans, copy, graphics, videos, reports, templates, research, tracking systems, documentation, SOPs, and related materials, is intended to be work made for hire for Graff Enterprises LLC d/b/a SitGuru. To the extent any such work does not qualify as work made for hire, the student hereby assigns to Graff Enterprises LLC all right, title, and interest the student may have in that work product, including copyright and other intellectual-property rights, effective upon creation. The student retains ownership of material created before the internship and not specifically created for SitGuru. If approved pre-existing material is incorporated into SitGuru work product, the student grants SitGuru a perpetual, worldwide, royalty-free license necessary to use, reproduce, modify, distribute, display, and otherwise use that material as part of the SitGuru work product. The student may keep a sanitized portfolio version of the Business Growth Report only after SitGuru approves that version in writing. Sanitized means no Pet Parent PII, no passwords, and no unpublished SitGuru internals.",
    },
    {
      heading: "5. Return, deletion, and offboarding certification",
      body: "When the internship ends, or sooner if SitGuru asks, return or delete SitGuru materials in the student’s possession, including downloads and drafts outside the portal. Portal records remain SitGuru records. The student must then certify to SitGuru that those materials have been returned or deleted. SitGuru may require that certification in writing, including through the intern portal.",
    },
    {
      heading: "6. Audit rights",
      body: "SitGuru may review intern portal activity, assigned-tool use, and uploaded internship files to protect the business, the internship, and other people. That review is limited to internship systems and assigned work — not a license to inspect unrelated personal accounts. SitGuru records the agreement version, intern identity, electronic-acceptance timestamps, and internal audit details such as IP address and session identifier for each onboarding step.",
    },
    {
      heading: "7. Consequences of a violation",
      body: "A violation can result in revoked portal access, ending the internship, preserving evidence, requiring return or deletion of materials, and notifying university personnel where appropriate. SitGuru may pursue civil remedies under applicable law, including Pennsylvania’s Uniform Trade Secrets Act (12 Pa.C.S. § 5301 et seq.) and the federal Defend Trade Secrets Act (18 U.S.C. § 1836). Those civil remedies can include injunctions, recovery of actual loss or unjust enrichment or a reasonable royalty, and in willful and malicious cases potentially enhanced damages and attorney fees. A violation is not automatically a crime. Federal trade-secret theft is not triggered merely because an intern violated a handbook rule; 18 U.S.C. § 1832 has specific elements involving a qualifying trade secret, unauthorized taking or use, intent, economic benefit to someone other than the owner, and intended or known injury to the owner. When those elements are met, an individual can face up to 10 years. SitGuru will not overstate that risk: criminal exposure depends on the facts and the law, not on this notice alone.",
    },
    {
      heading: "8. Whistleblower and immunity notice",
      body: "Nothing in this notice prohibits a disclosure protected by law. Under 18 U.S.C. § 1833(b), an individual shall not be held criminally or civilly liable under any federal or state trade secret law for the disclosure of a trade secret that is made in confidence to a federal, state, or local government official, either directly or indirectly, or to an attorney, solely for the purpose of reporting or investigating a suspected violation of law; or in a complaint or other document filed in a lawsuit or other proceeding, if such filing is made under seal. If the student files a lawsuit for retaliation by SitGuru for reporting a suspected violation of law, the student may disclose the trade secret to their attorney and use the trade secret information in the court proceeding if the student files any document containing the trade secret under seal and does not disclose the trade secret except pursuant to court order. For this federal immunity notice, “employee” includes contractors and consultants.",
    },
    {
      heading: "9. Acknowledgment",
      body: "By signing electronically, and by printing, wet-ink signing, and uploading a copy as SitGuru policy, the student confirms they have read this notice, understand that portal access depends on completing onboarding, and agree to follow it for the duration of the internship and afterward as to protected information and assigned SitGuru work product. SitGuru records the agreement version with the student’s name, university, academic program, and electronic-acceptance timestamps. The intern portal and Growth workplace unlock only after onboarding status is fully executed.",
    },
  ],
} as const;

const WET_INK_EXT = new Set(["pdf", "jpg", "jpeg", "png", "webp", "heic", "heif"]);
const WET_INK_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export function internOnboardingFileHash(bytes: Buffer | Uint8Array | ArrayBuffer) {
  const data = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  return createHash("sha256").update(data).digest("hex");
}

export function internOnboardingComplete(
  ack: Pick<
    InternshipOnboarding,
    | "policyVersion"
    | "typedLegalName"
    | "accessRulesAcceptedAt"
    | "electronicSignedAt"
    | "wetInkUploadedAt"
    | "wetInkStoragePath"
    | "wetInkFileHash"
    | "wetInkSubmittedAt"
    | "onboardingStatus"
  > | null | undefined,
) {
  return Boolean(
    ack &&
      ack.policyVersion === INTERN_ONBOARDING_POLICY_VERSION &&
      ack.onboardingStatus === INTERN_ONBOARDING_FULLY_EXECUTED &&
      ack.accessRulesAcceptedAt &&
      ack.electronicSignedAt &&
      String(ack.typedLegalName || "").trim() &&
      ack.wetInkUploadedAt &&
      String(ack.wetInkStoragePath || "").trim() &&
      String(ack.wetInkFileHash || "").trim() &&
      ack.wetInkSubmittedAt,
  );
}

export function internOnboardingStep(
  ack: InternshipOnboarding | null | undefined,
): InternOnboardingStepId {
  const currentPolicy = ack?.policyVersion === INTERN_ONBOARDING_POLICY_VERSION;
  if (!ack?.accessRulesAcceptedAt || !currentPolicy) return "access";
  if (!ack.electronicSignedAt || !String(ack.typedLegalName || "").trim()) return "esign";
  if (
    !ack.wetInkUploadedAt ||
    !String(ack.wetInkStoragePath || "").trim() ||
    !String(ack.wetInkFileHash || "").trim()
  ) {
    return "wetink";
  }
  if (!ack.wetInkSubmittedAt || ack.onboardingStatus !== INTERN_ONBOARDING_FULLY_EXECUTED) {
    return "submit";
  }
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
  return "Submit pending";
}

export function internOnboardingPublicState(ack: InternshipOnboarding | null | undefined) {
  const currentPolicy = ack?.policyVersion === INTERN_ONBOARDING_POLICY_VERSION;
  return {
    requiredPolicyVersion: INTERN_ONBOARDING_POLICY_VERSION,
    policyVersion: ack?.policyVersion || "",
    onboarded: internOnboardingComplete(ack),
    step: internOnboardingStep(ack),
    status: internOnboardingComplete(ack)
      ? INTERN_ONBOARDING_FULLY_EXECUTED
      : ack?.onboardingStatus || "pending",
    accessDone: Boolean(ack?.accessRulesAcceptedAt && currentPolicy),
    signed: Boolean(ack?.electronicSignedAt && currentPolicy),
    uploaded: Boolean(
      ack?.wetInkUploadedAt &&
        String(ack?.wetInkStoragePath || "").trim() &&
        String(ack?.wetInkFileHash || "").trim() &&
        currentPolicy,
    ),
    submitted: internOnboardingComplete(ack),
    steps: INTERN_ONBOARDING_STEPS.map((step) => ({ ...step })),
    accessRules: [...INTERN_ACCESS_RULES],
    notice: {
      title: INTERN_CONFIDENTIALITY_NOTICE.title,
      employer: INTERN_CONFIDENTIALITY_NOTICE.employer,
      subtitle: INTERN_CONFIDENTIALITY_NOTICE.subtitle,
      intro: INTERN_CONFIDENTIALITY_NOTICE.intro,
      sections: INTERN_CONFIDENTIALITY_NOTICE.sections.map((section) => ({ ...section })),
    },
  };
}
