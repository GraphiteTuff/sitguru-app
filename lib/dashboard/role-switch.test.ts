import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  defaultWorkspaceForLoginRoles,
  getAvailableDashboardSwitches,
  resolveAuthorizedRolesFromProfile,
  resolveDashboardRoleFromPath,
} from "./role-switch";

describe("founder personal marketplace roles", () => {
  it("gives jasongraff1978@gmail.com marketplace roles plus Intern Team Desk / Manager Portal — not Admin", () => {
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
    assert.equal(switches.some((item) => item.path === "/intern/manage"), false);
    assert.ok(switches.some((item) => item.shortLabel === "Manager Portal" && item.path === "/manager"));
    assert.ok(switches.some((item) => item.shortLabel === "Pet Parent"));
    assert.ok(switches.some((item) => item.shortLabel === "Intern") === false);
  });

  it("lets the HQ login switch to Intern, Intern Team Desk, Manager Portal, marketplace, and Admin", () => {
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

  it("opens Ava on the Manager Portal and keeps Pet Parent and Ambassador on the switcher", () => {
    const roles = resolveAuthorizedRolesFromProfile({
      email: "ava@sitguru.com",
      profile: {
        role: "ambassador",
        account_type: "ambassador",
        signup_role: "social_community_manager",
      },
      roleRows: ["ambassador", "customer", "social_community_manager"],
    });
    assert.deepEqual(roles, ["parent", "ambassador", "manager", "growth"]);
    assert.equal(
      defaultWorkspaceForLoginRoles([
        "ambassador",
        "customer",
        "social_community_manager",
      ]),
      "/manager",
    );
    const switches = getAvailableDashboardSwitches({
      currentRole: "growth",
      authorizedRoles: roles,
    });
    assert.deepEqual(
      switches.map((item) => item.shortLabel),
      ["Pet Parent", "Ambassador"],
    );
    assert.equal(switches.some((item) => item.path === "/admin"), false);
    assert.equal(switches.some((item) => item.shortLabel === "Intern"), false);
  });

  it("shows Manager Portal once and keeps Intern Team out of the switcher", () => {
    const roles = resolveAuthorizedRolesFromProfile({
      email: "growth.manager@sitguru.com",
      roleRows: ["social_community_manager"],
    });
    assert.deepEqual(roles, ["parent", "ambassador", "manager", "growth"]);
    const switches = getAvailableDashboardSwitches({
      currentRole: "parent",
      authorizedRoles: roles,
    });
    assert.ok(switches.some((item) => item.shortLabel === "Ambassador"));
    assert.ok(switches.some((item) => item.shortLabel === "Manager Portal" && item.path === "/manager"));
    assert.equal(switches.some((item) => item.shortLabel === "Pet Parent"), false);
    assert.equal(switches.some((item) => item.path === "/admin"), false);
    assert.equal(switches.some((item) => item.shortLabel === "Guru"), false);
    assert.equal(resolveDashboardRoleFromPath("/intern/manage"), "manager");
    assert.equal(resolveDashboardRoleFromPath("/manager"), "growth");
    assert.equal(resolveDashboardRoleFromPath("/admin/growth"), "growth");
    assert.equal(resolveDashboardRoleFromPath("/admin/hr"), "admin");
  });

  it("does not open a switcher for a single workspace", () => {
    assert.deepEqual(getAvailableDashboardSwitches({
      currentRole: "parent",
      authorizedRoles: ["parent"],
    }), []);
    assert.deepEqual(getAvailableDashboardSwitches({
      currentRole: "growth",
      authorizedRoles: ["manager", "growth"],
    }), []);
  });

  it("ignores staff roles planted in editable auth metadata", () => {
    const roles = resolveAuthorizedRolesFromProfile({
      email: "parent@example.com",
      metadata: { role: "social_community_manager", authorizedRoles: ["admin", "intern"] },
      roleRows: ["customer"],
    });
    assert.deepEqual(roles, ["parent"]);
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
