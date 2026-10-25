import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isGrowthAllowedAdminPath, isGrowthOnlyRole } from "./growth-paths";

describe("Growth Manager admin boundary", () => {
  it("keeps the Social Media & Community Growth Manager on growth systems", () => {
    assert.equal(isGrowthOnlyRole("social_community_manager"), true);
    assert.equal(isGrowthAllowedAdminPath("/admin/growth"), true);
    assert.equal(isGrowthAllowedAdminPath("/admin/growth/campaigns"), true);
    assert.equal(isGrowthAllowedAdminPath("/admin/community/events"), true);
    assert.equal(isGrowthAllowedAdminPath("/admin/partners"), true);
  });

  it("keeps HR, internship records, financials, and full HQ off that login", () => {
    assert.equal(isGrowthAllowedAdminPath("/admin"), false);
    assert.equal(isGrowthAllowedAdminPath("/admin/hr"), false);
    assert.equal(isGrowthAllowedAdminPath("/admin/hr/growth-hire"), false);
    assert.equal(isGrowthAllowedAdminPath("/admin/internship"), false);
    assert.equal(isGrowthAllowedAdminPath("/admin/internship/interns"), false);
    assert.equal(isGrowthAllowedAdminPath("/admin/financials"), false);
    assert.equal(isGrowthAllowedAdminPath("/admin/users"), false);
    assert.equal(isGrowthAllowedAdminPath("/admin/settings"), false);
    assert.equal(isGrowthOnlyRole("admin"), false);
    assert.equal(isGrowthOnlyRole("intern"), false);
  });
});
