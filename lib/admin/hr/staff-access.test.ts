import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isForbiddenStaffRole, staffAccessPath } from "./staff-access";

describe("staff access routes", () => {
  it("builds a dedicated staff access path from the verified user id", () => {
    assert.equal(
      staffAccessPath("023ef25a-44a5-4732-a96e-e67430ee8798"),
      "/admin/hr/staff/023ef25a-44a5-4732-a96e-e67430ee8798/access",
    );
  });

  it("blocks Super Admin and finance roles from staff manager grants", () => {
    assert.equal(isForbiddenStaffRole("super_admin"), true);
    assert.equal(isForbiddenStaffRole("finance_admin"), true);
    assert.equal(isForbiddenStaffRole("social_community_manager"), false);
    assert.equal(isForbiddenStaffRole("ambassador"), false);
  });
});
