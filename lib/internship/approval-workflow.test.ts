import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  activeStatusNeedsReview,
  employerDecisionLabel,
  lifecycleDisplay,
  planEmployerApproval,
  planUniversityRecord,
  universityCountsAsVerified,
  universityDecisionLabel,
} from "./approval-workflow";

const lola = {
  status: "pending_university_approval",
  approvalStatus: "pending",
  portalEnabled: false,
  alreadyNotified: false,
};

describe("internship approval workflow", () => {
  it("approves employer acceptance without activating or verifying the university", () => {
    const plan = planEmployerApproval(lola);
    assert.equal(plan.ok, true);
    if (!plan.ok) return;
    assert.equal(plan.changed, true);
    assert.equal(plan.approvalStatus, "approved");
    assert.equal(plan.nextStatus, "awaiting_onboarding");
    assert.equal(plan.portalEnabled, false);
    assert.equal(plan.nextStatus === "active", false);
    assert.equal(universityCountsAsVerified("pending"), false);
    assert.equal(lifecycleDisplay({ status: plan.nextStatus, approvalStatus: "approved" }), "Approved / awaiting onboarding");
    assert.equal(employerDecisionLabel("approved"), "Approved");
  });

  it("does not send a second acceptance email after the first notification", () => {
    const again = planEmployerApproval({
      ...lola,
      status: "awaiting_onboarding",
      approvalStatus: "approved",
      alreadyNotified: true,
    });
    assert.equal(again.ok, true);
    if (!again.ok) return;
    assert.equal(again.changed, false);
    assert.equal(again.sendEmail, false);
  });

  it("keeps a student-reported university approval out of the verified count", () => {
    const recorded = planUniversityRecord({
      evidenceType: "student_confirmation",
      confirmVerified: true,
    });
    assert.equal(recorded.ok, true);
    if (!recorded.ok) return;
    assert.equal(recorded.status, "student_reported");
    assert.equal(recorded.countsAsVerified, false);
    assert.equal(universityCountsAsVerified(recorded.status), false);
    assert.match(universityDecisionLabel(recorded.status), /Student confirmation/);
  });

  it("counts only an explicitly verified university approval", () => {
    const verified = planUniversityRecord({
      evidenceType: "advisor_email",
      confirmVerified: true,
    });
    assert.equal(verified.ok, true);
    if (!verified.ok) return;
    assert.equal(verified.status, "verified");
    assert.equal(verified.countsAsVerified, true);
    const waiting = planUniversityRecord({
      evidenceType: "university_document",
      confirmVerified: false,
    });
    assert.equal(waiting.ok, true);
    if (!waiting.ok) return;
    assert.equal(waiting.status, "verification_pending");
    assert.equal(universityCountsAsVerified(waiting.status), false);
  });

  it("flags an active record that has not finished onboarding or reached its start date", () => {
    const note = activeStatusNeedsReview({
      status: "active",
      universityStatus: "pending",
      onboardingComplete: false,
      startDate: "2027-01-11",
      today: "2026-11-05",
    });
    assert.match(note, /Stored as Active/);
    assert.match(note, /onboarding/);
    assert.equal(
      activeStatusNeedsReview({
        status: "awaiting_onboarding",
        universityStatus: "pending",
        onboardingComplete: false,
        startDate: "2027-01-12",
        today: "2026-11-05",
      }),
      "",
    );
  });
});
