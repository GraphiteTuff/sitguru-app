import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getAvailableDashboardSwitches,
  resolveAuthorizedRolesFromProfile,
  resolveDashboardRoleFromPath,
} from "./role-switch";

describe("founder personal marketplace roles", () => {
  it("gives jasongraff1978@gmail.com marketplace roles plus Manager Desk / Growth — not Admin", () => {
    const roles = resolveAuthorizedRolesFromProfile({
      email: "jasongraff1978@gmail.com",
    });
    assert.deepEqual(roles, [
      "parent",
      "guru",
      "ambassador",
      "intern",
      "manager",
      "growth",
    ]);
    assert.ok(!roles.includes("admin"));
    const switches = getAvailableDashboardSwitches({
      currentRole: "intern",
      authorizedRoles: roles,
    });
    assert.ok(switches.some((item) => item.id === "manager"));
    assert.ok(switches.some((item) => item.path === "/intern/manage"));
    assert.ok(switches.some((item) => item.id === "growth"));
  });

  it("lets the HQ login switch to Intern, Manager Desk, Growth, marketplace, and Admin", () => {
    const roles = resolveAuthorizedRolesFromProfile({
      email: "jason@sitguru.com",
    });
    assert.deepEqual(roles, [
      "parent",
      "guru",
      "ambassador",
      "intern",
      "manager",
      "growth",
      "admin",
    ]);
  });

  it("gives the Social & Growth Manager desk + growth workspace and not full Admin", () => {
    const roles = resolveAuthorizedRolesFromProfile({
      email: "growth.manager@sitguru.com",
      roleRows: ["social_community_manager"],
    });
    assert.deepEqual(roles, ["manager", "growth"]);
    const switches = getAvailableDashboardSwitches({
      currentRole: "parent",
      authorizedRoles: roles,
    });
    assert.equal(switches[0]?.shortLabel, "Manager Desk");
    assert.equal(switches[0]?.path, "/intern/manage");
    assert.equal(switches[1]?.shortLabel, "Social & Growth Manager");
    assert.equal(switches[1]?.path, "/admin/growth");
    assert.equal(resolveDashboardRoleFromPath("/intern/manage"), "manager");
    assert.equal(resolveDashboardRoleFromPath("/admin/growth"), "growth");
    assert.equal(resolveDashboardRoleFromPath("/admin/hr"), "admin");
  });

  it("adds Intern for assigned marketplace accounts without Admin", () => {
    const roles = resolveAuthorizedRolesFromProfile({
      email: "intern@example.edu",
      roleRows: ["customer", "guru"],
      hasInternRecord: true,
    });
    assert.deepEqual(roles, ["parent", "guru", "intern"]);
  });
});
