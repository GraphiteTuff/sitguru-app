import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { internPortalDestination, internSafeNext } from "./intern-growth";
import { internConfirmationEmails } from "./onboarding-mail";
import {
  internAllowedConfidentialUpload,
  internNamesMatch,
  internOnboardingComplete,
  internOnboardingFileHash,
  internOnboardingPublicState,
  internOnboardingStep,
  internOnboardingStatusLabel,
  INTERN_CONFIDENTIALITY_NOTICE,
  INTERN_ONBOARDING_FULLY_EXECUTED,
  INTERN_ONBOARDING_POLICY_VERSION,
  INTERNSHIP_ONBOARDING_PATH,
} from "./onboarding";
import type { InternshipOnboarding } from "./types";

function ack(overrides: Partial<InternshipOnboarding> = {}): InternshipOnboarding {
  return {
    internId: "intern-1",
    policyVersion: INTERN_ONBOARDING_POLICY_VERSION,
    onboardingStatus: INTERN_ONBOARDING_FULLY_EXECUTED,
    typedLegalName: "Alex Rivera",
    internNameSnapshot: "Alex Rivera",
    internUniversitySnapshot: "Test University",
    internProgramSnapshot: "Marketing",
    internEmailSnapshot: "alex@test.edu",
    accessRulesAcceptedAt: "2026-09-06T12:00:00.000Z",
    accessRulesAcceptedIp: "203.0.113.10",
    accessRulesSessionId: "sess-1",
    electronicSignedAt: "2026-09-06T12:05:00.000Z",
    electronicSignedIp: "203.0.113.10",
    electronicSignedSessionId: "sess-1",
    signerEmail: "alex@test.edu",
    wetInkFileName: "signed.pdf",
    wetInkStoragePath: "interns/intern-1/confidentiality/signed.pdf",
    wetInkFileHash: internOnboardingFileHash(Buffer.from("signed-page")),
    wetInkMimeType: "application/pdf",
    wetInkFileSize: 1200,
    wetInkUploadedAt: "2026-09-06T12:10:00.000Z",
    wetInkUploadedIp: "203.0.113.10",
    wetInkUploadedSessionId: "sess-1",
    wetInkSubmittedAt: "2026-09-06T12:12:00.000Z",
    wetInkSubmittedIp: "203.0.113.10",
    wetInkSubmittedSessionId: "sess-1",
    wetInkEmailedAt: "2026-09-06T12:12:00.000Z",
    offboardingCertifiedAt: null,
    ...overrides,
  };
}

describe("intern onboarding gate", () => {
  it("keeps the portal locked until access rules, e-sign, upload, and submit are done", () => {
    assert.equal(internOnboardingComplete(null), false);
    assert.equal(internOnboardingComplete(ack({ wetInkUploadedAt: null })), false);
    assert.equal(internOnboardingComplete(ack({ wetInkSubmittedAt: null })), false);
    assert.equal(internOnboardingComplete(ack({ electronicSignedAt: null })), false);
    assert.equal(internOnboardingComplete(ack({ accessRulesAcceptedAt: null })), false);
    assert.equal(internOnboardingComplete(ack({ wetInkFileHash: "" })), false);
    assert.equal(internOnboardingComplete(ack({ onboardingStatus: "pending" })), false);
    assert.equal(
      internOnboardingComplete(ack({ policyVersion: "old" })),
      false,
    );
    assert.equal(internOnboardingComplete(ack()), true);
    const state = internOnboardingPublicState(ack({ policyVersion: "old" }));
    assert.equal(state.onboarded, false);
    assert.equal(state.requiredPolicyVersion, INTERN_ONBOARDING_POLICY_VERSION);
    assert.equal(state.step, "access");
    const ownership = state.notice.sections.find((section) =>
      section.heading.includes("Ownership and assignment"),
    );
    assert.ok(ownership);
  });

  it("walks access rules, then e-sign, then upload, then submit", () => {
    assert.equal(internOnboardingStep(null), "access");
    assert.equal(
      internOnboardingStep(ack({ electronicSignedAt: null, wetInkUploadedAt: null, wetInkSubmittedAt: null })),
      "esign",
    );
    assert.equal(
      internOnboardingStep(ack({ wetInkUploadedAt: null, wetInkStoragePath: "", wetInkSubmittedAt: null })),
      "wetink",
    );
    assert.equal(
      internOnboardingStep(ack({ wetInkSubmittedAt: null, onboardingStatus: "pending" })),
      "submit",
    );
    assert.equal(internOnboardingStep(ack({ policyVersion: "old" })), "access");
  });

  it("assigns internship work product and bars unapproved AI tools", () => {
    const ownership = INTERN_CONFIDENTIALITY_NOTICE.sections.find((section) =>
      section.heading.includes("Ownership and assignment"),
    );
    const prohibited = INTERN_CONFIDENTIALITY_NOTICE.sections.find((section) =>
      section.heading.startsWith("3."),
    );
    assert.match(String(ownership?.body || ""), /work made for hire/);
    assert.match(String(ownership?.body || ""), /hereby assigns/);
    assert.match(String(prohibited?.body || ""), /generative AI/);
    assert.match(INTERN_CONFIDENTIALITY_NOTICE.intro, /SitGuru policy/);
  });

  it("uses a limited information-use clause, not a named-company job ban", () => {
    const limited = INTERN_CONFIDENTIALITY_NOTICE.sections.find((section) =>
      section.heading.includes("Limited protection"),
    );
    const text = [
      INTERN_CONFIDENTIALITY_NOTICE.title,
      INTERN_CONFIDENTIALITY_NOTICE.intro,
      ...INTERN_CONFIDENTIALITY_NOTICE.sections.map((section) => `${section.heading} ${section.body}`),
    ].join("\n");
    assert.match(String(limited?.body || ""), /directly competing pet care marketplace/);
    assert.match(String(limited?.body || ""), /does not prohibit the intern from working for another pet care company/);
    assert.match(INTERN_CONFIDENTIALITY_NOTICE.intro, /not a traditional non-compete/);
    assert.match(INTERN_CONFIDENTIALITY_NOTICE.subtitle, /separate from the syllabus/);
    assert.doesNotMatch(text, /\bRover\b/i);
    assert.doesNotMatch(text, /\bWag\b/i);
  });

  it("requires the typed name to match the intern record", () => {
    assert.equal(internNamesMatch("Alex Rivera", "Alex Rivera"), true);
    assert.equal(internNamesMatch("alex rivera", "Alex Rivera"), true);
    assert.equal(internNamesMatch("Alex M Rivera", "Alex Rivera"), true);
    assert.equal(internNamesMatch("Alex", "Alex Rivera"), false);
    assert.equal(internNamesMatch("Taylor", "Alex Rivera"), false);
  });

  it("only accepts a PDF or photo of the signed page", () => {
    assert.equal(
      internAllowedConfidentialUpload({
        name: "signed.pdf",
        type: "application/pdf",
        size: 20,
      }),
      "",
    );
    assert.match(
      internAllowedConfidentialUpload({
        name: "notes.docx",
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size: 20,
      }),
      /PDF or photo/,
    );
  });

  it("routes unsigned interns to onboarding even when a workplace link was requested", () => {
    assert.equal(
      internPortalDestination("/intern/growth", false),
      INTERNSHIP_ONBOARDING_PATH,
    );
    assert.equal(internPortalDestination("/intern/growth", true), "/intern/growth");
    assert.equal(
      internPortalDestination("/intern/onboarding/print", false),
      "/intern/onboarding/print",
    );
    assert.equal(internSafeNext("/intern/onboarding"), "/intern/onboarding");
    assert.equal(internOnboardingStatusLabel(null), "Access rules pending");
    assert.equal(
      internOnboardingStatusLabel(ack({ wetInkSubmittedAt: null })),
      "Submit pending",
    );
    assert.equal(internOnboardingStatusLabel(ack()), "Complete");
  });

  it("confirms to the intern email and student email, without duplicates", () => {
    assert.deepEqual(
      internConfirmationEmails({
        email: "alex@sitguru.com",
        studentEmail: "alex@test.edu",
      }),
      ["alex@sitguru.com", "alex@test.edu"],
    );
    assert.deepEqual(
      internConfirmationEmails({
        email: "alex@test.edu",
        studentEmail: "alex@test.edu",
      }),
      ["alex@test.edu"],
    );
  });
});
