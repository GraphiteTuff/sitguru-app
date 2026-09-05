import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveAuthorizedRolesFromProfile } from "./role-switch";

describe("founder personal marketplace roles", () => {
  it("gives jasongraff1978@gmail.com Pet Parent, Guru, Ambassador, and Intern — not Admin", () => {
    const roles = resolveAuthorizedRolesFromProfile({
      email: "jasongraff1978@gmail.com",
    });
    assert.deepEqual(roles, ["parent", "guru", "ambassador", "intern"]);
  });

  it("keeps jason@sitguru.com as HQ with Admin included and Intern only when assigned", () => {
    const roles = resolveAuthorizedRolesFromProfile({
      email: "jason@sitguru.com",
    });
    assert.deepEqual(roles, ["parent", "guru", "ambassador", "admin"]);

    const assigned = resolveAuthorizedRolesFromProfile({
      email: "jason@sitguru.com",
      hasInternRecord: true,
    });
    assert.deepEqual(assigned, [
      "parent",
      "guru",
      "ambassador",
      "intern",
      "admin",
    ]);
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
