import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pendingRequestGrantsAccess, requestableTeamRole, staffRequestOnCooldown } from "./policy";

describe("staff access requests", () => {
  it("allowlists manager and intern requests only", () => {
    assert.equal(requestableTeamRole("social_community_manager")?.label, "Social Media & Community Growth Manager");
    assert.equal(requestableTeamRole("social_media_community_growth_intern")?.label, "Social Media & Community Growth Intern");
    assert.equal(requestableTeamRole("super_admin"), null);
    assert.equal(requestableTeamRole("finance_admin"), null);
  });

  it("treats a pending request as zero access and slows repeat submissions", () => {
    assert.equal(pendingRequestGrantsAccess(), false);
    const now = Date.parse("2027-03-02T12:00:00Z");
    assert.equal(staffRequestOnCooldown("2027-03-02T01:00:00Z", now), true);
    assert.equal(staffRequestOnCooldown("2027-03-01T01:00:00Z", now), false);
    assert.equal(staffRequestOnCooldown(null, now), false);
  });
});
