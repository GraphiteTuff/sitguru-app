import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isFounderPersonalMarketplaceEmail,
  isHardcodedSuperUserEmail,
  skipNameOnlyDuplicateMatch,
} from "./super-users";

describe("founder HQ vs personal identity", () => {
  it("treats jason@sitguru.com as HQ Super Admin, not the personal Gmail account", () => {
    assert.equal(isHardcodedSuperUserEmail("Jason@SitGuru.com"), true);
    assert.equal(isHardcodedSuperUserEmail("jasongraff1978@gmail.com"), false);
    assert.equal(
      isFounderPersonalMarketplaceEmail("jasongraff1978@gmail.com"),
      true,
    );
  });

  it("does not name-cluster the founder HQ and personal logins as duplicates", () => {
    assert.equal(skipNameOnlyDuplicateMatch("jason@sitguru.com"), true);
    assert.equal(
      skipNameOnlyDuplicateMatch("jasongraff1978@gmail.com"),
      true,
    );
    assert.equal(skipNameOnlyDuplicateMatch("parent@example.com"), false);
  });
});
