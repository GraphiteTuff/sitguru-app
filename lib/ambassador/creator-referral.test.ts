import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  existingAccountRewardEligible,
  funnelRate,
  isCreatorAmbassadorType,
  isReservedReferralCode,
  normalizeReferralCode,
  publicReferralPath,
  resolveReferralAttribution,
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
});
