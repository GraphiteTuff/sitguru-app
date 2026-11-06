import { internOnboardingComplete } from "@/lib/internship/onboarding";
import type { InternshipOnboarding } from "@/lib/internship/types";

export const EMPLOYER_APPROVED = new Set(["approved", "accepted"]);
export const UNIVERSITY_VERIFIED = new Set(["verified", "confirmed", "university_verified"]);
const PORTAL_LIFECYCLE = new Set(["active", "approved", "accepted"]);
const CLOSED_EMPLOYER = new Set(["declined", "denied", "withdrawn", "revoked"]);

export const UNIVERSITY_EVIDENCE_TYPES = [
  "student_confirmation",
  "advisor_email",
  "university_document",
  "verified_requirements",
  "rejected",
] as const;

export type UniversityEvidenceType = (typeof UNIVERSITY_EVIDENCE_TYPES)[number];

export const SPRING_2027_SCHEDULE_NOTE =
  "The cohort record runs January 12, 2027 through May 7, 2027. The 15-week delivery plan and the April 30, 2027 final-report milestone sit inside that window. Fifteen weeks from January 12 lands near April 26, so May 7 is later than a strict 15-week count. Each school still confirms its own academic end date. These dates were left as stored.";

export function employerDecision(status: string | null | undefined) {
  const value = String(status || "").trim().toLowerCase();
  if (EMPLOYER_APPROVED.has(value)) return "approved" as const;
  if (value === "declined" || value === "denied") return "declined" as const;
  if (value === "withdrawn" || value === "revoked") return "withdrawn" as const;
  return "pending" as const;
}

export function employerDecisionLabel(status: string | null | undefined) {
  const decision = employerDecision(status);
  if (decision === "approved") return "Approved";
  if (decision === "declined") return "Declined";
  if (decision === "withdrawn") return "Withdrawn";
  return "Pending";
}

export function universityDecision(status: string | null | undefined) {
  const value = String(status || "").trim().toLowerCase();
  if (value === "student_reported") return "student_reported" as const;
  if (value === "verification_pending" || value === "needs_information") {
    return "verification_pending" as const;
  }
  if (UNIVERSITY_VERIFIED.has(value)) return "verified" as const;
  if (value === "rejected" || value === "declined" || value === "not_approved") {
    return "rejected" as const;
  }
  return "not_confirmed" as const;
}

export function universityDecisionLabel(status: string | null | undefined) {
  const decision = universityDecision(status);
  if (decision === "student_reported") return "Student confirmation received / verification pending";
  if (decision === "verification_pending") return "Verification pending";
  if (decision === "verified") return "Verified";
  if (decision === "rejected") return "Not approved";
  return "Not confirmed";
}

export function universityCountsAsVerified(status: string | null | undefined) {
  return universityDecision(status) === "verified";
}

export function onboardingStage(
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
  if (!ack) return "not_started" as const;
  if (internOnboardingComplete(ack)) return "fully_executed" as const;
  if (ack.accessRulesAcceptedAt && !ack.electronicSignedAt) return "awaiting_signature" as const;
  if (ack.electronicSignedAt && !ack.wetInkSubmittedAt) return "awaiting_signature" as const;
  return "in_progress" as const;
}

export function onboardingStageLabel(stage: ReturnType<typeof onboardingStage>) {
  if (stage === "fully_executed") return "Fully executed";
  if (stage === "awaiting_signature") return "Awaiting signature or documentation";
  if (stage === "in_progress") return "In progress";
  return "Not started";
}

export function lifecycleDisplay(input: { status: string; approvalStatus?: string | null }) {
  const status = String(input.status || "").toLowerCase();
  const employer = employerDecision(input.approvalStatus);
  if (status === "active") return "Active";
  if (status === "completed") return "Completed";
  if (status === "withdrawn" || status === "archived") return "Withdrawn";
  if (status === "prospective") return "Prospective / pending confirmation";
  if (status === "awaiting_onboarding" || (employer === "approved" && !PORTAL_LIFECYCLE.has(status))) {
    return "Approved / awaiting onboarding";
  }
  if (status === "onboarding") return "Onboarding";
  if (employer === "declined") return "Declined";
  if (employer === "withdrawn") return "Withdrawn";
  return "Employer decision pending";
}

export function activationLabel(input: { status: string; reviewNote: string }) {
  if (input.status.toLowerCase() !== "active") return "Not active";
  if (input.reviewNote) return "Stored active — needs review";
  return "Active";
}

export function activeStatusNeedsReview(input: {
  status: string;
  universityStatus?: string | null;
  onboardingComplete: boolean;
  startDate?: string | null;
  today: string;
}) {
  if (String(input.status || "").toLowerCase() !== "active") return "";
  const reasons: string[] = [];
  if (!universityCountsAsVerified(input.universityStatus)) {
    reasons.push("university approval is not verified");
  }
  if (!input.onboardingComplete) reasons.push("onboarding is not fully executed");
  if (input.startDate && input.startDate > input.today) {
    reasons.push("the start date has not arrived");
  }
  if (!reasons.length) return "";
  return `Stored as Active. Review this record: ${reasons.join("; ")}.`;
}

export function nextApprovalAction(input: {
  approvalStatus?: string | null;
  universityStatus?: string | null;
  onboardingStage: ReturnType<typeof onboardingStage>;
  status: string;
}) {
  if (employerDecision(input.approvalStatus) === "pending") return "Approve the internship.";
  const university = universityDecision(input.universityStatus);
  if (university === "not_confirmed" || university === "student_reported" || university === "verification_pending") {
    return "Record university evidence. Student confirmation is not formal verification.";
  }
  if (input.onboardingStage !== "fully_executed") return "Finish onboarding before activation.";
  if (String(input.status || "").toLowerCase() !== "active") return "Activation stays closed until the start conditions are met.";
  return "No approval action is waiting.";
}

export function planEmployerApproval(input: {
  status: string;
  approvalStatus?: string | null;
  portalEnabled: boolean;
  alreadyNotified: boolean;
}) {
  const decision = employerDecision(input.approvalStatus);
  if (decision === "declined" || decision === "withdrawn" || CLOSED_EMPLOYER.has(String(input.approvalStatus || "").toLowerCase())) {
    if (decision !== "approved") {
      return {
        ok: false as const,
        error: "This internship is already closed. Approval was not changed.",
      };
    }
  }
  if (decision === "approved") {
    return {
      ok: true as const,
      changed: false,
      sendEmail: !input.alreadyNotified,
      nextStatus: input.status,
      portalEnabled: input.portalEnabled,
      approvalStatus: "approved",
    };
  }
  const status = String(input.status || "").toLowerCase();
  const keepLifecycle =
    PORTAL_LIFECYCLE.has(status) || status === "completed" || status === "withdrawn" || status === "archived";
  return {
    ok: true as const,
    changed: true,
    sendEmail: !input.alreadyNotified,
    nextStatus: keepLifecycle ? input.status : "awaiting_onboarding",
    portalEnabled: keepLifecycle ? input.portalEnabled : false,
    approvalStatus: "approved",
  };
}

export function planUniversityRecord(input: {
  evidenceType: string;
  confirmVerified: boolean;
}) {
  if (!UNIVERSITY_EVIDENCE_TYPES.includes(input.evidenceType as UniversityEvidenceType)) {
    return { ok: false as const, error: "Choose an evidence type." };
  }
  if (input.evidenceType === "student_confirmation") {
    return {
      ok: true as const,
      status: "student_reported",
      countsAsVerified: false,
    };
  }
  if (input.evidenceType === "rejected") {
    return { ok: true as const, status: "rejected", countsAsVerified: false };
  }
  if (input.confirmVerified) {
    return { ok: true as const, status: "verified", countsAsVerified: true };
  }
  return { ok: true as const, status: "verification_pending", countsAsVerified: false };
}

export function readApprovalSnapshot(snapshot: Record<string, unknown> | null | undefined) {
  const bag = snapshot && typeof snapshot === "object" ? snapshot : {};
  const evidence =
    bag.universityApproval && typeof bag.universityApproval === "object"
      ? (bag.universityApproval as Record<string, unknown>)
      : {};
  return {
    employerNotifiedAt: typeof bag.employerApprovalNotifiedAt === "string" ? bag.employerApprovalNotifiedAt : "",
    evidence,
  };
}
