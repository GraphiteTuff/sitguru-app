import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyPhoneCollision,
  decideNextAuthStep,
  duplicateReasonLabels,
  listAuthProviders,
  normalizeUsPhone,
  provisionOnce,
  resolveAmbassadorRole,
  resolveAuthenticatedAccount,
  resolveGuruRole,
  resolvePetParentRole,
  type ExistingAccount,
} from "./signup-identity";

const appleGuru = "0061a488-8444-45e9-a69e-32f830e40bbb";
const phoneGuru = "d4441a74-31f0-4dc5-bd33-77f528ecfa42";

function account(id: string, roles: ExistingAccount["roles"] = []): ExistingAccount {
  return { userId: id, roles };
}

describe("provider selection never creates a second auth user", () => {
  it("Apple first starts one OAuth user for a new Guru or Pet Parent", () => {
    assert.deepEqual(
      decideNextAuthStep({
        provider: "apple",
        hasVerifiedSession: false,
        phoneCodeSent: false,
        phoneVerified: false,
      }),
      { action: "start_oauth", provider: "apple" },
    );
  });

  it("phone first starts OTP, then provisions only after verification", () => {
    assert.equal(
      decideNextAuthStep({
        provider: "phone",
        hasVerifiedSession: false,
        phoneCodeSent: false,
        phoneVerified: false,
      }).action,
      "start_phone_otp",
    );
    const step = decideNextAuthStep({
      provider: "apple",
      hasVerifiedSession: false,
      phoneCodeSent: true,
      phoneVerified: false,
    });
    assert.equal(step.action, "require_phone_verification");
  });

  it("verified phone links Apple onto the current user", () => {
    assert.deepEqual(
      decideNextAuthStep({
        provider: "apple",
        hasVerifiedSession: true,
        phoneCodeSent: true,
        phoneVerified: true,
      }),
      { action: "link_identity", provider: "apple" },
    );
  });

  it("Apple session attaches a later phone instead of a new OTP user", () => {
    assert.equal(
      decideNextAuthStep({
        provider: "phone",
        hasVerifiedSession: true,
        phoneCodeSent: false,
        phoneVerified: false,
      }).action,
      "attach_phone_to_session",
    );
  });

  it("a second Apple login reuses the same auth id", () => {
    const first = resolveAuthenticatedAccount({
      authUser: { id: appleGuru, email: "8psrn7wt5v@privaterelay.appleid.com" },
    });
    const second = resolveAuthenticatedAccount({
      authUser: { id: appleGuru, email: "8psrn7wt5v@privaterelay.appleid.com" },
      existingByAuthId: account(appleGuru, ["guru"]),
    });
    assert.equal(first.userId, second.userId);
    assert.equal(second.reused, true);
  });

  it("Apple private relay stays on the same user when the name is missing later", () => {
    const again = resolveAuthenticatedAccount({
      authUser: { id: appleGuru, email: "8psrn7wt5v@privaterelay.appleid.com" },
      existingByAuthId: account(appleGuru, ["pet_parent"]),
    });
    assert.equal(again.reused, true);
    assert.equal(again.userId, appleGuru);
  });
});

describe("Guru and Pet Parent share one account", () => {
  it("Apple or phone creates one Guru", () => {
    const resolved = resolveGuruRole(account(appleGuru));
    assert.deepEqual(resolved.roles, ["guru"]);
    assert.equal(resolved.userId, appleGuru);
  });

  it("Apple or phone creates one Pet Parent", () => {
    const resolved = resolvePetParentRole(account(phoneGuru));
    assert.deepEqual(resolved.roles, ["pet_parent"]);
  });

  it("existing Guru adds Pet Parent without a new account", () => {
    const resolved = resolvePetParentRole(resolveGuruRole(account(appleGuru)));
    assert.deepEqual(resolved.roles, ["guru", "pet_parent"]);
    assert.equal(resolved.userId, appleGuru);
  });

  it("existing Pet Parent adds Guru without a new account", () => {
    const resolved = resolveGuruRole(resolvePetParentRole(account(appleGuru)));
    assert.deepEqual(resolved.roles, ["guru", "pet_parent"]);
  });

  it("ambassador is additive on the same user", () => {
    const resolved = resolveAmbassadorRole(
      resolvePetParentRole(account(appleGuru, ["guru"])),
    );
    assert.deepEqual(resolved.roles, ["guru", "pet_parent", "ambassador"]);
  });
});

describe("provisioning is idempotent", () => {
  it("two callbacks and two simultaneous requests provision once", () => {
    const seen: string[] = [];
    const first = provisionOnce({ authUserId: appleGuru, alreadyProvisionedUserIds: seen });
    if (first.created) seen.push(first.userId);
    const second = provisionOnce({ authUserId: appleGuru, alreadyProvisionedUserIds: seen });
    const third = provisionOnce({ authUserId: appleGuru, alreadyProvisionedUserIds: seen });
    assert.equal(first.created, true);
    assert.equal(second.created, false);
    assert.equal(third.created, false);
    assert.equal(second.userId, appleGuru);
  });
});

describe("cross-auth duplicates are review only", () => {
  it("same phone on two auth users is a cross-auth duplicate", () => {
    assert.equal(
      classifyPhoneCollision({
        currentAuthUserId: appleGuru,
        otherAuthUserId: phoneGuru,
        currentPhone: "+1 (616) 690-0889",
        otherPhone: "16166900889",
      }),
      "possible_cross_auth_duplicate",
    );
  });

  it("does not merge when Apple is already linked on another user", () => {
    const labels = duplicateReasonLabels([
      "phone:6166900889",
      "apple-phone:ashley",
      "namezip:ashley boelens|49505",
    ]);
    assert.equal(labels.includes("Possible Cross-Auth Duplicate"), true);
    assert.equal(labels.includes("AUTH IDENTITY DUPLICATE"), false);
  });

  it("normalizes phone formats", () => {
    assert.equal(normalizeUsPhone("16096197850"), "6096197850");
  });
});

describe("admin can see linked providers on one auth user", () => {
  it("lists apple and phone on a single identity", () => {
    assert.deepEqual(
      listAuthProviders({
        identities: [{ provider: "apple" }, { provider: "phone" }],
        email: "8psrn7wt5v@privaterelay.appleid.com",
        phone: "+16166900889",
      }),
      ["apple", "phone"],
    );
  });
});
