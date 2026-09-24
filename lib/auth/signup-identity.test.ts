import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyPhoneCollision,
  decideNextAuthStep,
  duplicateReasonLabels,
  listAuthProviders,
  normalizeUsPhone,
  provisionOnce,
  reconcileVerifiedPhone,
  resolveAmbassadorRole,
  resolveAuthenticatedAccount,
  resolveGuruRole,
  resolvePetParentRole,
  shouldProvisionRolesOnCallback,
  type ExistingAccount,
} from "./signup-identity";
import {
  mergeOwnedRoles,
  switchActiveRole,
} from "../dashboard/role-switch";

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

describe("logged-out Apple does not provision a second role", () => {
  const phoneGuru = "d4441a74-31f0-4dc5-bd33-77f528ecfa42";
  const appleAttempt = "11111111-1111-1111-1111-111111111111";
  const phoneParent = "7b9625f5-2bbc-4b12-837c-bc33bce223ed";

  it("existing phone Guru, logout, Apple, same verified phone: no second Guru", () => {
    const decision = reconcileVerifiedPhone({
      authUserId: appleAttempt,
      verifiedPhone: "16166900889",
      existingAccounts: [{ userId: phoneGuru, phone: "+1 (616) 690-0889" }],
    });
    assert.equal(decision.action, "reconciliation_required");
    if (decision.action === "reconciliation_required") {
      assert.equal(decision.existingUserId, phoneGuru);
    }
    const provisioned = decision.action === "provision";
    assert.equal(provisioned, false);
  });

  it("existing phone Ambassador, logout, Apple, same verified phone: no second Ambassador", () => {
    const decision = reconcileVerifiedPhone({
      authUserId: appleAttempt,
      verifiedPhone: "+1 253-555-0199",
      existingAccounts: [
        { userId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", phone: "2535550199" },
      ],
    });
    assert.equal(decision.action, "reconciliation_required");
    assert.equal(
      decision.action === "reconciliation_required"
        ? decision.existingUserId
        : "",
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    );
  });

  it("existing phone Pet Parent, logout, Apple, same verified phone: no second Parent", () => {
    const decision = reconcileVerifiedPhone({
      authUserId: appleAttempt,
      verifiedPhone: "16096197850",
      existingAccounts: [{ userId: phoneParent, phone: "6096197850" }],
    });
    assert.equal(decision.action, "reconciliation_required");
  });

  it("Apple phone owned by an unrelated account requires reconciliation and does not merge", () => {
    const decision = reconcileVerifiedPhone({
      authUserId: appleAttempt,
      verifiedPhone: "+17167158691",
      existingAccounts: [
        { userId: "fd5f92f3-ea4d-430c-b23c-2b8a45506177", phone: "7167158691" },
      ],
    });
    assert.equal(decision.action, "reconciliation_required");
    assert.notEqual(
      decision.action === "reconciliation_required"
        ? decision.existingUserId
        : "",
      appleAttempt,
    );
  });

  it("Apple user with an unused verified phone provisions normally", () => {
    const decision = reconcileVerifiedPhone({
      authUserId: appleAttempt,
      verifiedPhone: "6165550100",
      existingAccounts: [{ userId: phoneGuru, phone: "6166900889" }],
    });
    assert.deepEqual(decision, { action: "provision", userId: appleAttempt });
  });
});

describe("multi-role accounts stay intact when providers change", () => {
  it("Pet Parent add Guru keeps the parent role", () => {
    assert.deepEqual(mergeOwnedRoles(["parent"], "guru"), ["parent", "guru"]);
  });

  it("Guru add Pet Parent keeps the Guru role", () => {
    assert.deepEqual(mergeOwnedRoles(["guru"], "pet_parent"), ["parent", "guru"]);
  });

  it("Guru + Parent add Ambassador keeps all three", () => {
    assert.deepEqual(mergeOwnedRoles(["guru", "parent"], "ambassador"), [
      "parent",
      "guru",
      "ambassador",
    ]);
  });

  it("linking Apple on an existing account does not provision roles again", () => {
    assert.equal(
      shouldProvisionRolesOnCallback({
        hasExistingAccount: true,
        urlRequestedRole: false,
      }),
      false,
    );
  });

  it("Become a Guru still provisions because the URL requested that role", () => {
    assert.equal(
      shouldProvisionRolesOnCallback({
        hasExistingAccount: true,
        urlRequestedRole: true,
      }),
      true,
    );
  });

  it("linking Apple does not change owned roles", () => {
    const before = mergeOwnedRoles(["guru", "parent"], null);
    const afterLink = mergeOwnedRoles(before, null);
    assert.deepEqual(afterLink, ["parent", "guru"]);
  });

  it("linking Google does not change Guru, Parent, and Ambassador", () => {
    const owned = ["parent", "guru", "ambassador"] as const;
    assert.deepEqual(mergeOwnedRoles(owned, null), [
      "parent",
      "guru",
      "ambassador",
    ]);
  });

  it("switching the active role does not change owned roles", () => {
    const owned = ["parent", "guru", "ambassador"] as const;
    const toGuru = switchActiveRole({ owned, next: "guru" });
    const toParent = switchActiveRole({ owned: toGuru.owned, next: "parent" });
    const toAmbassador = switchActiveRole({
      owned: toParent.owned,
      next: "ambassador",
    });
    assert.equal(toGuru.active, "guru");
    assert.equal(toParent.active, "parent");
    assert.equal(toAmbassador.active, "ambassador");
    assert.deepEqual(toAmbassador.owned, ["parent", "guru", "ambassador"]);
  });

  it("resolveGuruRole twice yields one Guru", () => {
    const once = resolveGuruRole(account(appleGuru, ["pet_parent"]));
    const twice = resolveGuruRole(once);
    assert.deepEqual(twice.roles, ["guru", "pet_parent"]);
    assert.equal(twice.roles?.filter((role) => role === "guru").length, 1);
  });

  it("resolvePetParentRole twice yields one Pet Parent", () => {
    const once = resolvePetParentRole(account(appleGuru, ["guru"]));
    const twice = resolvePetParentRole(once);
    assert.equal(
      twice.roles?.filter((role) => role === "pet_parent").length,
      1,
    );
  });

  it("resolveAmbassadorRole twice yields one Ambassador", () => {
    const once = resolveAmbassadorRole(account(appleGuru, ["guru", "pet_parent"]));
    const twice = resolveAmbassadorRole(once);
    assert.equal(
      twice.roles?.filter((role) => role === "ambassador").length,
      1,
    );
  });

  it("Super Admin plus three roles stays one account", () => {
    const owned = mergeOwnedRoles(
      ["admin", "parent", "guru", "ambassador"],
      "guru",
    );
    assert.deepEqual(owned, ["parent", "guru", "ambassador", "admin"]);
    assert.equal(new Set(owned).size, owned.length);
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
