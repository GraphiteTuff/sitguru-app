import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canBrowseAllPortals,
  canPreviewInternPortal,
  internshipActorKind,
  isPortalUserId,
} from "./manager-access";

const INTERN = "a79e6bb0-4439-421b-b24f-5fb8553f620c";

describe("admin read-only intern assignment preview authorization", () => {
  it("allows a verified super administrator to inspect interns without impersonation", () => {
    assert.equal(canBrowseAllPortals({
      actor: internshipActorKind({ isSuperUser: true, role: "admin" }),
      canAccessAdmin: true,
      growthOnly: false,
    }), true);
    assert.equal(isPortalUserId(INTERN), true);
  });

  it("does not grant interns or growth-only managers an all-intern preview", () => {
    assert.equal(canBrowseAllPortals({
      actor: "intern",
      canAccessAdmin: false,
      growthOnly: false,
    }), false);
    assert.equal(canBrowseAllPortals({
      actor: "manager",
      canAccessAdmin: true,
      growthOnly: true,
    }), false);
  });

  it("does not let a manager preview an intern assigned to another manager", () => {
    assert.equal(canPreviewInternPortal({
      actor: "manager",
      actorUserId: "manager-a",
      targetInternId: INTERN,
      managerUserId: "manager-b",
    }), false);
    assert.equal(canPreviewInternPortal({
      actor: "manager",
      actorUserId: "manager-a",
      targetInternId: INTERN,
      managerUserId: "manager-a",
    }), true);
  });

  it("rejects invalid intern identifiers", () => {
    for (const id of ["", "not-an-intern", "../admin", "https://example.com"]) {
      assert.equal(isPortalUserId(id), false);
    }
  });
});
