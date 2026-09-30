import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  shouldAttemptMobileAcquisition,
  shouldClearStoredReferral,
  shouldReplaceStoredReferralSeal,
} from "./referral-storage-policy";

describe("expo referral storage policy", () => {
  it("keeps a sealed code and replaces a different code", () => {
    assert.equal(
      shouldReplaceStoredReferralSeal({
        existingCode: "QAAMBASSADOR1",
        incomingCode: "qaambassador1",
        existingCapturedAt: "2026-09-30T12:00:00.000Z",
        existingMac: "abc",
      }),
      false,
    );
    assert.equal(
      shouldReplaceStoredReferralSeal({
        existingCode: "QAAMBASSADOR1",
        incomingCode: "QAAMBASSADOR2",
        existingCapturedAt: "2026-09-30T12:00:00.000Z",
        existingMac: "abc",
      }),
      true,
    );
  });

  it("refreshes a same code that has no server seal", () => {
    assert.equal(
      shouldReplaceStoredReferralSeal({
        existingCode: "QAAMBASSADOR1",
        incomingCode: "QAAMBASSADOR1",
        existingCapturedAt: "",
        existingMac: "",
      }),
      true,
    );
  });

  it("rejects an account created before the sealed capture", () => {
    assert.equal(
      shouldAttemptMobileAcquisition({
        createdAt: "2026-09-30T11:00:00.000Z",
        capturedAt: "2026-09-30T12:00:00.000Z",
      }),
      false,
    );
    assert.equal(
      shouldAttemptMobileAcquisition({
        createdAt: "2026-09-30T12:00:10.000Z",
        capturedAt: "2026-09-30T12:00:00.000Z",
      }),
      true,
    );
  });

  it("keeps storage unless the server applied or already locked the code", () => {
    assert.equal(shouldClearStoredReferral({ applied: true, status: "applied" }), true);
    assert.equal(
      shouldClearStoredReferral({ applied: false, status: "already_locked" }),
      true,
    );
    assert.equal(
      shouldClearStoredReferral({ applied: false, status: "existing_account" }),
      false,
    );
    assert.equal(
      shouldClearStoredReferral({ applied: false, status: "self_referral" }),
      false,
    );
    assert.equal(shouldClearStoredReferral({}), false);
  });
});
