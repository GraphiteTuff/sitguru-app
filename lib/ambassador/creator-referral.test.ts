import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  existingAccountRewardEligible,
  funnelRate,
  incomingAmbassadorCode,
  isCreatorAmbassadorType,
  isQualifiedCreatorConversion,
  isReservedReferralCode,
  normalizeReferralCode,
  shouldClearPendingReferral,
  publicReferralPath,
  resolveReferralAttribution,
  shouldLockAcquisition,
} from "./creator-referral";

describe("creator referral codes", () => {
  it("treats ziggy and ZIGGY as the same code", () => {
    assert.equal(normalizeReferralCode(" ziggy "), "ZIGGY");
    assert.equal(normalizeReferralCode("Zi-ggy"), "ZI-GGY");
  });

  it("blocks route collisions and empty codes", () => {
    assert.equal(isReservedReferralCode("admin"), true);
    assert.equal(isReservedReferralCode("signup"), true);
    assert.equal(isReservedReferralCode("a"), true);
    assert.equal(isReservedReferralCode("ziggy"), false);
  });

  it("builds a public short path and not an internal id", () => {
    assert.equal(publicReferralPath("ziggy"), "/r/ZIGGY");
  });

  it("recognizes the creator subtype without a new login role", () => {
    assert.equal(isCreatorAmbassadorType("creator_ambassador"), true);
    assert.equal(isCreatorAmbassadorType("community_ambassador"), false);
  });
});

describe("creator attribution", () => {
  it("lets a newer click replace the code before registration", () => {
    const next = resolveReferralAttribution({
      lockedCode: "",
      incomingCode: "TOAD",
    });
    assert.equal(next.code, "TOAD");
    assert.equal(next.locked, false);
  });

  it("keeps the code locked after registration", () => {
    const next = resolveReferralAttribution({
      lockedCode: "ZIGGY",
      incomingCode: "TOAD",
    });
    assert.equal(next.code, "ZIGGY");
    assert.equal(next.locked, true);
  });

  it("does not reward an existing account for a later click", () => {
    assert.equal(
      existingAccountRewardEligible({
        accountCreatedAt: "2026-01-01T00:00:00.000Z",
        referralCapturedAt: "2026-09-01T00:00:00.000Z",
      }),
      false,
    );
  });

  it("keeps a referral captured with the new account reward-eligible", () => {
    assert.equal(
      existingAccountRewardEligible({
        accountCreatedAt: "2026-09-01T00:05:00.000Z",
        referralCapturedAt: "2026-09-01T00:00:00.000Z",
      }),
      true,
    );
  });

  it("returns zero conversion when a step has no traffic", () => {
    assert.equal(funnelRate(0, 0), 0);
    assert.equal(funnelRate(1, 4), 25);
  });

  it("reads the ambassador cookie when the OAuth redirect has no ref query", () => {
    const code = incomingAmbassadorCode({
      queryCode: "",
      cookieHeader: "sitguru_ambassador_code=ziggy; other=1",
      metadataCode: "old",
    });
    assert.equal(code, "ZIGGY");
  });

  it("keeps an explicit link ahead of an older cookie", () => {
    const code = incomingAmbassadorCode({
      queryCode: "toad",
      cookieHeader: "sitguru_ambassador_code=ZIGGY",
    });
    assert.equal(code, "TOAD");
  });

  it("keeps a short fresh-session window for OAuth workspace setup only", () => {
    const now = Date.parse("2026-09-30T12:00:00.000Z");
    assert.equal(
      shouldLockAcquisition("2026-09-30T11:50:00.000Z", now),
      true,
    );
    assert.equal(
      shouldLockAcquisition("2026-01-01T00:00:00.000Z", now),
      false,
    );
  });

  it("qualifies only the first completed paid booking", () => {
    const base = {
      hasLockedReferral: true,
      isNewAccount: true,
      isSelfReferral: false,
      isFirstQualifyingBooking: true,
      bookingStatus: "completed",
      paymentStatus: "paid",
    };
    assert.equal(isQualifiedCreatorConversion(base), true);
    assert.equal(
      isQualifiedCreatorConversion({ ...base, isSelfReferral: true }),
      false,
    );
    assert.equal(
      isQualifiedCreatorConversion({ ...base, isNewAccount: false }),
      false,
    );
    assert.equal(
      isQualifiedCreatorConversion({ ...base, bookingStatus: "canceled" }),
      false,
    );
    assert.equal(
      isQualifiedCreatorConversion({ ...base, paymentStatus: "refunded" }),
      false,
    );
    assert.equal(
      isQualifiedCreatorConversion({ ...base, paymentStatus: "unpaid" }),
      false,
    );
    assert.equal(
      isQualifiedCreatorConversion({
        ...base,
        paymentStatus: "partially_refunded",
      }),
      false,
    );
    assert.equal(
      isQualifiedCreatorConversion({ ...base, bookingStatus: "confirmed" }),
      false,
    );
    assert.equal(
      isQualifiedCreatorConversion({
        ...base,
        isFirstQualifyingBooking: false,
      }),
      false,
    );
  });

  it("clears a pending referral only after a permanent lock", () => {
    assert.equal(shouldClearPendingReferral({ applied: true, status: "applied" }), true);
    assert.equal(
      shouldClearPendingReferral({ applied: false, status: "already_locked" }),
      true,
    );
    assert.equal(
      shouldClearPendingReferral({ applied: false, status: "existing_account" }),
      false,
    );
    assert.equal(
      shouldClearPendingReferral({ applied: false, status: "self_referral" }),
      false,
    );
    assert.equal(
      shouldClearPendingReferral({ applied: false, status: "recording_warning" }),
      false,
    );
  });
});
