import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAdminRole, isSuperUserRole } from "./access";
import { isHardcodedSuperUserEmail } from "./super-users";

describe("admin authorization model", () => {
  it("treats Super Admin aliases as admin access", () => {
    for (const role of [
      "super_admin",
      "SUPER_ADMIN",
      "super-admin",
      "superadmin",
      "owner",
      "founder",
    ]) {
      assert.equal(isAdminRole(role), true, role);
      assert.equal(isSuperUserRole(role), true, role);
    }
  });

  it("treats standard admin as admin access, not Super Admin", () => {
    assert.equal(isAdminRole("admin"), true);
    assert.equal(isAdminRole("Admin"), true);
    assert.equal(isSuperUserRole("admin"), false);
  });

  it("denies marketplace roles", () => {
    for (const role of ["customer", "guru", "ambassador", "pet_parent", ""]) {
      assert.equal(isAdminRole(role), false, role);
      assert.equal(isSuperUserRole(role), false, role);
    }
  });

  it("grants HQ Super Admin by email even when profiles.role is customer", () => {
    assert.equal(isHardcodedSuperUserEmail("jason@sitguru.com"), true);
    assert.equal(isAdminRole("customer"), false);
  });
});
