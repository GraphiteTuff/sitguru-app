import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveAuthorizedRolesFromProfile } from "./role-switch";

describe("founder personal marketplace roles", () => {
  it("gives jasongraff1978@gmail.com Pet Parent, Guru, and Ambassador — not Admin", () => {
    const roles = resolveAuthorizedRolesFromProfile({
      email: "jasongraff1978@gmail.com",
    });
    assert.deepEqual(roles, ["parent", "guru", "ambassador"]);
  });

  it("keeps jason@sitguru.com as HQ with Admin included", () => {
    const roles = resolveAuthorizedRolesFromProfile({
      email: "jason@sitguru.com",
    });
    assert.deepEqual(roles, ["parent", "guru", "ambassador", "admin"]);
  });
});
