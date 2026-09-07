import { createHash } from "node:crypto";
import { INTERNSHIP_PORTAL_PATH } from "@/lib/internship/constants";
import { INTERN_CONFIDENTIALITY_NOTICE } from "@/lib/internship/intern-agreement";
import type { InternshipOnboarding } from "@/lib/internship/types";

export { INTERN_CONFIDENTIALITY_NOTICE } from "@/lib/internship/intern-agreement";

export const INTERNSHIP_ONBOARDING_PATH = `${INTERNSHIP_PORTAL_PATH}/onboarding`;
export const INTERNSHIP_ONBOARDING_PRINT_PATH = `${INTERNSHIP_ONBOARDING_PATH}/print`;
export const INTERN_ONBOARDING_POLICY_VERSION = "2027-spring-v3";
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
    blurb: "Read the intern agreement and sign electronically.",
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
  "When the internship ends, return or delete SitGuru credentials and internal data. Do not keep intern logins, tracking dashboards, or confidential files.",
] as const;

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
  const view = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
  return createHash("sha256").update(view).digest("hex");
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
