import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyPhoneCollision,
  duplicateReasonLabels,
  normalizeUsPhone,
  resolveAuthenticatedAccount,
} from "./signup-identity";

describe("signup identity", () => {
  it("normalizes US phone formats to 10 digits", () => {
    assert.equal(normalizeUsPhone("16166900889"), "6166900889");
    assert.equal(normalizeUsPhone("+1 616-690-0889"), "6166900889");
    assert.equal(normalizeUsPhone("(616) 690-0889"), "6166900889");
  });

  it("reuses the account for the same auth.users.id", () => {
    const resolved = resolveAuthenticatedAccount({
      authUser: { id: "0061a488-8444-45e9-a69e-32f830e40bbb" },
      existingByAuthId: {
        userId: "0061a488-8444-45e9-a69e-32f830e40bbb",
        guruId: "8f48b506-b6c2-410c-8ab9-13e69e6ba6c9",
      },
    });
    assert.equal(resolved.reused, true);
    assert.equal(resolved.guruId, "8f48b506-b6c2-410c-8ab9-13e69e6ba6c9");
  });

  it("does not invent a second user id after Apple auth", () => {
    const resolved = resolveAuthenticatedAccount({
      authUser: {
        id: "82ef1673-785c-41c6-b943-94aecc9ee9a8",
        email: "krzjrgzjb8@privaterelay.appleid.com",
      },
    });
    assert.equal(resolved.userId, "82ef1673-785c-41c6-b943-94aecc9ee9a8");
    assert.equal(resolved.reused, false);
  });

  it("flags two authenticated users who share a phone for review only", () => {
    assert.equal(
      classifyPhoneCollision({
        currentAuthUserId: "0061a488-8444-45e9-a69e-32f830e40bbb",
        otherAuthUserId: "d4441a74-31f0-4dc5-bd33-77f528ecfa42",
        currentPhone: "+16166900889",
        otherPhone: "16166900889",
      }),
      "possible_duplicate_review",
    );
  });

  it("labels auth-id collisions as integrity duplicates", () => {
    assert.deepEqual(
      duplicateReasonLabels(["auth:0061a488", "namezip:ashley boelens|49505"]),
      ["AUTH IDENTITY DUPLICATE", "Same name + ZIP"],
    );
  });
});
