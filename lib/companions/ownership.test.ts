import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertCompanionDashboardAccess } from "./identity";
import type { CompanionActor } from "./identity";

function actor(partial: Partial<CompanionActor>): CompanionActor {
  return {
    userId: "user-a",
    email: "a@example.com",
    authSource: "bearer",
    displayName: "A",
    firstName: "A",
    roles: ["pet_parent"],
    primaryRole: "pet_parent",
    isAdmin: false,
    isGuru: false,
    isAmbassador: false,
    isPartner: false,
    isPetParent: true,
    guruId: null,
    ambassadorId: null,
    partnerId: null,
    partnerBusinessName: null,
    ...partial,
  };
}

describe("companion dashboard access", () => {
  it("blocks pet parents from Taco dashboard", () => {
    const result = assertCompanionDashboardAccess(
      "taco",
      actor({ isPetParent: true, isAmbassador: false }),
    );
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.status, 403);
  });

  it("allows ambassadors on Taco dashboard", () => {
    const result = assertCompanionDashboardAccess(
      "taco",
      actor({
        isAmbassador: true,
        isPetParent: false,
        primaryRole: "ambassador",
        roles: ["ambassador"],
      }),
    );
    assert.equal(result.ok, true);
  });

  it("blocks ambassadors from Scout dashboard", () => {
    const result = assertCompanionDashboardAccess(
      "scout",
      actor({
        isAmbassador: true,
        isGuru: false,
        primaryRole: "ambassador",
        roles: ["ambassador"],
      }),
    );
    assert.equal(result.ok, false);
  });

  it("allows gurus on Scout dashboard", () => {
    const result = assertCompanionDashboardAccess(
      "scout",
      actor({
        isGuru: true,
        isPetParent: false,
        primaryRole: "guru",
        roles: ["guru"],
        guruId: "guru-1",
      }),
    );
    assert.equal(result.ok, true);
  });

  it("does not grant extra permissions when switching to Rogue", () => {
    // Rogue has no dashboard gate — selecting Rogue never upgrades roles.
    const parent = actor({ isPetParent: true });
    assert.equal(assertCompanionDashboardAccess("rogue", parent).ok, true);
    assert.equal(parent.isGuru, false);
    assert.equal(parent.isAmbassador, false);
  });
});
