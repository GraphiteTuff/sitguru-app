import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { internPortalDestination, internSafeNext } from "./intern-growth";
import { internConfirmationEmails } from "./onboarding-mail";
import {
  internAllowedConfidentialUpload,
  internNamesMatch,
  internOnboardingComplete,
  internOnboardingStep,
  internOnboardingStatusLabel,
  INTERN_ONBOARDING_POLICY_VERSION,
  INTERNSHIP_ONBOARDING_PATH,
} from "./onboarding";
import type { InternshipOnboarding } from "./types";

function ack(overrides: Partial<InternshipOnboarding> = {}): InternshipOnboarding {
  return {
    internId: "intern-1",
    policyVersion: INTERN_ONBOARDING_POLICY_VERSION,
    typedLegalName: "Alex Rivera",
    accessRulesAcceptedAt: "2026-09-06T12:00:00.000Z",
    electronicSignedAt: "2026-09-06T12:05:00.000Z",
    signerEmail: "alex@test.edu",
    wetInkFileName: "signed.pdf",
    wetInkStoragePath: "interns/intern-1/confidentiality/signed.pdf",
    wetInkMimeType: "application/pdf",
    wetInkFileSize: 1200,
    wetInkUploadedAt: "2026-09-06T12:10:00.000Z",
    wetInkSubmittedAt: "2026-09-06T12:12:00.000Z",
    wetInkEmailedAt: "2026-09-06T12:12:00.000Z",
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
    assert.equal(
      internOnboardingComplete(ack({ policyVersion: "old" })),
      false,
    );
    assert.equal(internOnboardingComplete(ack()), true);
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
      internOnboardingStep(ack({ wetInkSubmittedAt: null })),
      "submit",
    );
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
