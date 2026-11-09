import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildScreeningWaiverPayload,
  isScreeningRequirementSatisfied,
  isScreeningVerifiedBadge,
  isScreeningWaivedByAdmin,
  SCREENING_WAIVED_BY_ADMIN,
  screeningDisplayLabel,
} from "./screening-waiver";

describe("guru screening admin waiver", () => {
  it("stores waived_by_admin without pretending screening was verified", () => {
    const built = buildScreeningWaiverPayload({
      adminUserId: "admin-1",
      reason: "Spring 2027 intern activation authorized by owner",
    });
    assert.equal(built.ok, true);
    if (!built.ok) return;
    assert.equal(built.guruUpdate.background_check_status, SCREENING_WAIVED_BY_ADMIN);
    assert.equal(built.audit.metadata.verified_screening, false);
    assert.equal(isScreeningWaivedByAdmin(SCREENING_WAIVED_BY_ADMIN), true);
    assert.equal(isScreeningVerifiedBadge(SCREENING_WAIVED_BY_ADMIN), false);
    assert.equal(isScreeningVerifiedBadge("clear"), true);
    assert.equal(screeningDisplayLabel(SCREENING_WAIVED_BY_ADMIN), "Waived by Admin");
    assert.equal(
      isScreeningRequirementSatisfied({
        backgroundCheckStatus: SCREENING_WAIVED_BY_ADMIN,
      }),
      true,
    );
  });

  it("rejects a waiver without an admin or usable reason", () => {
    assert.equal(buildScreeningWaiverPayload({ adminUserId: "", reason: "enough text" }).ok, false);
    assert.equal(
      buildScreeningWaiverPayload({ adminUserId: "admin-1", reason: "short" }).ok,
      false,
    );
  });
});
