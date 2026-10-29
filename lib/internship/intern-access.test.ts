import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  INTERN_ACCESS_ROLE,
  canRequestInternAccess,
  internAccessGrantsStaffAdmin,
  nextInternAccessStatus,
} from "./intern-access";

describe("intern staff access requests", () => {
  it("starts at CEO review and keeps the portal off until the university is verified", () => {
    const ceo = nextInternAccessStatus({ status: "pending_ceo_review", action: "ceo_approve" });
    assert.equal(ceo.ok, true);
    if (ceo.ok) {
      assert.equal(ceo.status, "pending_university_approval");
      assert.equal(ceo.portalEnabled, false);
    }
    const early = nextInternAccessStatus({ status: "pending_ceo_review", action: "verify_university" });
    assert.equal(early.ok, false);
    const opened = nextInternAccessStatus({
      status: "pending_university_approval",
      action: "verify_university",
    });
    assert.equal(opened.ok, true);
    if (opened.ok) {
      assert.equal(opened.status, "approved");
      assert.equal(opened.portalEnabled, true);
    }
  });

  it("activates only after approval and can deny or complete without staff admin rights", () => {
    const active = nextInternAccessStatus({ status: "approved", action: "activate" });
    assert.equal(active.ok && active.status, "active");
    const denied = nextInternAccessStatus({ status: "active", action: "revoke" });
    assert.equal(denied.ok && denied.portalEnabled, false);
    const done = nextInternAccessStatus({ status: "active", action: "complete" });
    assert.equal(done.ok && done.status, "completed");
    assert.equal(internAccessGrantsStaffAdmin(), false);
    assert.equal(INTERN_ACCESS_ROLE.includes("admin"), false);
    assert.equal(canRequestInternAccess("denied"), true);
    assert.equal(canRequestInternAccess("pending_ceo_review"), false);
  });
});
