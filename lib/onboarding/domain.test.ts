import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  acknowledgmentUnlocked,
  adminSignatureTransition,
  assignPackage,
  canReadPersonnelFile,
  confirmReview,
  followSigningLink,
  layoutForWidth,
  normalizeProvider,
  onboardingProgress,
  openForReview,
  publishNextVersion,
  readinessForManager,
  referencedVersionSnapshot,
  userCanCompleteSignature,
  visiblePackageItems,
  type OnboardingItemState,
} from "./domain";

function item(
  partial: Partial<OnboardingItemState> & Pick<OnboardingItemState, "id" | "kind" | "status">,
): OnboardingItemState {
  return {
    title: partial.title || partial.id,
    requirement: partial.requirement || "required",
    versionId: partial.versionId || `${partial.id}-v1`,
    versionLabel: partial.versionLabel || "v1.0",
    ...partial,
  };
}

describe("remote onboarding", () => {
  it("assigns a reusable package only to the matching role", () => {
    assert.equal(
      assignPackage({
        templateRole: "social_community_manager",
        subjectRole: "social_community_manager",
      }).ok,
      true,
    );
    assert.equal(
      assignPackage({ templateRole: "social_community_manager", subjectRole: "intern" }).ok,
      false,
    );
  });

  it("does not treat opening a file as a review", () => {
    const opened = openForReview("assigned");
    assert.equal(opened.status, "opened");
    assert.equal(opened.reviewed, false);
    const confirmed = confirmReview("opened");
    assert.equal(confirmed.ok && confirmed.status, "reviewed");
    assert.equal(confirmReview("assigned").ok, false);
  });

  it("lets someone follow a signing link without completing it", () => {
    assert.equal(userCanCompleteSignature(), false);
    const followed = followSigningLink("sent_for_signature");
    assert.equal(followed.ok && followed.status, "viewed");
    assert.equal(followed.ok && followed.completed, false);
  });

  it("lets an admin verify the external signature and countersignature", () => {
    const waiting = adminSignatureTransition({ status: "viewed", action: "record_signed" });
    assert.equal(waiting.ok && waiting.status, "countersignature_pending");
    const verified = adminSignatureTransition({
      status: "countersignature_pending",
      action: "verify",
    });
    assert.equal(verified.ok && verified.status, "fully_executed");
  });

  it("keeps the prior version when a new one needs another review", () => {
    const next = publishNextVersion({
      previousVersionId: "v1",
      nextVersionId: "v2",
      reacknowledgmentRequired: true,
    });
    assert.equal(next.previousRemainsVisible, true);
    assert.equal(next.requiresNewAcknowledgment, true);
    assert.notEqual(next.previousVersionId, next.nextVersionId);
  });

  it("shows a manager the status and hides the personnel file", () => {
    const view = readinessForManager(
      item({
        id: "agreement",
        kind: "signature",
        status: "fully_executed",
        storageRef: "private/agreement.pdf",
        signingUrl: "https://sign.example/secret",
      }),
    );
    assert.equal(view.status, "Complete");
    assert.equal(view.fileHidden, true);
    assert.equal("storageRef" in view, false);
    assert.equal(canReadPersonnelFile("manager"), false);
    assert.equal(canReadPersonnelFile("team"), false);
    assert.equal(canReadPersonnelFile("subject"), true);
    assert.equal(canReadPersonnelFile("founder"), true);
  });

  it("is complete only after the agreement, reviews, and acknowledgment are done", () => {
    const open = [
      item({ id: "agreement", kind: "signature", status: "countersignature_pending" }),
      item({ id: "handbook", kind: "review", status: "reviewed" }),
      item({ id: "guide", kind: "review", status: "reviewed" }),
      item({ id: "policy", kind: "review", status: "reviewed" }),
      item({ id: "ack", kind: "acknowledgment", status: "sent_for_signature" }),
      item({ id: "extra", kind: "review", status: "assigned", requirement: "optional" }),
    ];
    assert.equal(acknowledgmentUnlocked(open), true);
    assert.equal(onboardingProgress(open).complete, false);
    const done = open.map((row) =>
      row.kind === "review" && row.requirement === "optional"
        ? row
        : { ...row, status: row.kind === "review" ? "reviewed" : "fully_executed" },
    );
    assert.equal(onboardingProgress(done).complete, true);
    assert.equal(onboardingProgress(done).percent, 100);
  });

  it("accepts another signature provider without a schema change", () => {
    const known = normalizeProvider("Adobe Sign");
    const future = normalizeProvider("future_approved_provider");
    assert.equal(known.ok && known.provider, "adobe_sign");
    assert.equal(future.ok && future.provider, "future_approved_provider");
  });

  it("records the exact versions covered by the acknowledgment", () => {
    const snapshot = referencedVersionSnapshot([
      item({
        id: "handbook",
        kind: "review",
        status: "reviewed",
        versionId: "h-1.3",
        versionLabel: "v1.3",
        title: "Growth Manager Onboarding Handbook",
      }),
      item({
        id: "guide",
        kind: "review",
        status: "reviewed",
        versionId: "g-1.1",
        versionLabel: "v1.1",
        title: "Intern Leadership Guide",
      }),
      item({
        id: "policy",
        kind: "review",
        status: "opened",
        versionId: "p-1",
        versionLabel: "v1.0",
        title: "Approved Systems & Software Policy",
      }),
    ]);
    assert.deepEqual(
      snapshot.map((row) => row.versionLabel),
      ["v1.3", "v1.1"],
    );
  });

  it("hides Timekeeper orientation until that feature is enabled", () => {
    const items = visiblePackageItems(
      [{ featureKey: null }, { featureKey: "timekeeper_orientation" }],
      { timekeeper_orientation: false },
    );
    assert.equal(items.length, 1);
    assert.equal(layoutForWidth(390), "cards");
    assert.equal(layoutForWidth(1280), "split");
  });
});
