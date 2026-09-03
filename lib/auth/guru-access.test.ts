import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  authorizedRolesForPetParentGuru,
  hasGuruAccessFromSignals,
  isEligibleGuruProfile,
  isGuruDashboardApplicationLoop,
  isGuruRoleValue,
  resolveGuruApplicationPath,
  shouldRepairMissingGuruRole,
} from "./guru-access";

describe("guru access is additive", () => {
  it("does not treat a Pet Parent-only account as a Guru", () => {
    assert.equal(
      hasGuruAccessFromSignals({
        roles: ["customer", "pet_parent"],
        hasEligibleGuruProfile: false,
      }),
      false,
    );
  });

  it("grants Guru access when a Pet Parent later has an eligible guru profile", () => {
    assert.equal(
      hasGuruAccessFromSignals({
        roles: ["customer"],
        hasEligibleGuruProfile: true,
      }),
      true,
    );
    assert.equal(
      shouldRepairMissingGuruRole({
        hasGuruRole: false,
        hasEligibleGuruProfile: true,
      }),
      true,
    );
    assert.deepEqual(authorizedRolesForPetParentGuru(["parent"]), [
      "parent",
      "guru",
    ]);
  });

  it("keeps Pet Parent after Guru is added", () => {
    const roles = authorizedRolesForPetParentGuru(["parent"]);
    assert.ok(roles.includes("parent"));
    assert.ok(roles.includes("guru"));
    assert.equal(isGuruRoleValue("customer"), false);
  });
});

describe("eligible guru profile", () => {
  it("treats a bookable/active guru row as eligible", () => {
    assert.equal(
      isEligibleGuruProfile({
        id: "guru-1",
        user_id: "user-1",
        status: "active",
        application_status: "bookable",
        is_bookable: true,
        is_public: true,
      }),
      true,
    );
  });

  it("does not treat a merged or rejected guru as eligible", () => {
    assert.equal(
      isEligibleGuruProfile({
        id: "guru-2",
        status: "merged_duplicate",
      }),
      false,
    );
  });
});

describe("guru application / dashboard loop protection", () => {
  it("never sends a customer-only dashboard bounce back to the dashboard", () => {
    const path = resolveGuruApplicationPath({
      hasGuruAccess: false,
      from: "guru-dashboard",
      reason: "customer-only",
    });

    assert.equal(path.startsWith("/become-a-sitter"), true);
    assert.equal(
      isGuruDashboardApplicationLoop({
        from: "guru-dashboard",
        reason: "customer-only",
        destination: path,
      }),
      false,
    );
  });

  it("sends an eligible Guru from /guru/application to the dashboard", () => {
    assert.equal(
      resolveGuruApplicationPath({
        hasGuruAccess: true,
        from: "guru-dashboard",
        reason: "customer-only",
      }),
      "/guru/dashboard",
    );
  });

  it("does not create an application ↔ dashboard cycle", () => {
    const customerOnly = resolveGuruApplicationPath({
      hasGuruAccess: false,
      from: "guru-dashboard",
      reason: "customer-only",
    });
    const alreadyGuru = resolveGuruApplicationPath({
      hasGuruAccess: true,
      from: "guru-dashboard",
      reason: "customer-only",
    });

    assert.notEqual(customerOnly.startsWith("/guru/dashboard"), true);
    assert.equal(alreadyGuru, "/guru/dashboard");
    assert.notEqual(alreadyGuru.includes("reason=customer-only"), true);
  });
});
