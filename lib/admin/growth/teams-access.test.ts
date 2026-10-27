import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isSitGuruWorkEmail } from "./teams-access";

describe("isSitGuruWorkEmail", () => {
  it("allows SitGuru work mailboxes", () => {
    assert.equal(isSitGuruWorkEmail("jason@sitguru.com"), true);
    assert.equal(isSitGuruWorkEmail("ava@sitguru.com"), true);
    assert.equal(isSitGuruWorkEmail("  Ava@SitGuru.com "), true);
  });

  it("rejects school, personal, and empty addresses", () => {
    assert.equal(isSitGuruWorkEmail("student@university.edu"), false);
    assert.equal(isSitGuruWorkEmail("jasongraff1978@gmail.com"), false);
    assert.equal(isSitGuruWorkEmail("ava@sitgur.com"), false);
    assert.equal(isSitGuruWorkEmail(""), false);
    assert.equal(isSitGuruWorkEmail(null), false);
  });
});
