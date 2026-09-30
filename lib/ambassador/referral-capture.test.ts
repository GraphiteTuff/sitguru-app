import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isReferralAcquisition,
  referralCaptureTimestamp,
  signReferralCapture,
  verifyReferralCapture,
} from "./referral-capture";

const SECRET = "test-capture-secret";

describe("referral acquisition timing", () => {
  it("treats an account created after the referral as a new acquisition", () => {
    assert.equal(
      isReferralAcquisition({
        accountCreatedAt: "2026-09-30T12:05:00.000Z",
        referralCapturedAt: "2026-09-30T12:00:00.000Z",
      }),
      true,
    );
  });

  it("does not acquire an account that already existed when the link was opened", () => {
    assert.equal(
      isReferralAcquisition({
        accountCreatedAt: "2026-01-01T00:00:00.000Z",
        referralCapturedAt: "2026-09-30T12:00:00.000Z",
      }),
      false,
    );
  });

  it("allows a few seconds of clock skew and no more", () => {
    assert.equal(
      isReferralAcquisition({
        accountCreatedAt: "2026-09-30T11:59:50.000Z",
        referralCapturedAt: "2026-09-30T12:00:00.000Z",
      }),
      true,
    );
    assert.equal(
      isReferralAcquisition({
        accountCreatedAt: "2026-09-30T11:50:00.000Z",
        referralCapturedAt: "2026-09-30T12:00:00.000Z",
      }),
      false,
    );
  });

  it("rejects a missing capture time instead of guessing from account age", () => {
    assert.equal(
      isReferralAcquisition({
        accountCreatedAt: new Date().toISOString(),
        referralCapturedAt: "",
      }),
      false,
    );
  });
});

describe("referral capture timestamp", () => {
  it("keeps the original time for the same code and replaces it for a new code", () => {
    assert.equal(
      referralCaptureTimestamp({
        incomingCode: "jason",
        existingCode: "JASON",
        existingCapturedAt: "2026-09-30T12:00:00.000Z",
        existingTrusted: true,
        now: "2026-09-30T12:30:00.000Z",
      }),
      "2026-09-30T12:00:00.000Z",
    );
    assert.equal(
      referralCaptureTimestamp({
        incomingCode: "TOAD",
        existingCode: "JASON",
        existingCapturedAt: "2026-09-30T12:00:00.000Z",
        existingTrusted: true,
        now: "2026-09-30T12:30:00.000Z",
      }),
      "2026-09-30T12:30:00.000Z",
    );
    assert.equal(
      referralCaptureTimestamp({
        incomingCode: "JASON",
        existingCode: "JASON",
        existingCapturedAt: "2020-01-01T00:00:00.000Z",
        existingTrusted: false,
        now: "2026-09-30T12:30:00.000Z",
      }),
      "2026-09-30T12:30:00.000Z",
    );
  });
});

describe("referral capture signature", () => {
  it("accepts a server seal and rejects a backdated timestamp", async () => {
    const capturedAt = "2026-09-30T12:00:00.000Z";
    const mac = await signReferralCapture("JASON", capturedAt, SECRET);
    assert.equal(
      await verifyReferralCapture({
        code: "jason",
        capturedAt,
        mac,
        secret: SECRET,
      }),
      true,
    );
    assert.equal(
      await verifyReferralCapture({
        code: "JASON",
        capturedAt: "2020-01-01T00:00:00.000Z",
        mac,
        secret: SECRET,
      }),
      false,
    );
    assert.equal(
      await verifyReferralCapture({
        code: "OTHER",
        capturedAt,
        mac,
        secret: SECRET,
      }),
      false,
    );
  });
});
