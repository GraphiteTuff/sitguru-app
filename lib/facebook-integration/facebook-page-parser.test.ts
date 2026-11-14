import assert from "node:assert/strict";
import test from "node:test";
import { parseFacebookPageDetails } from "./facebook-page-parser";

test("accepts verified Page metadata and follower count", () => {
  assert.deepEqual(
    parseFacebookPageDetails(
      { id: "123", name: "SitGuru", followers_count: 30, fan_count: 25 },
      "123",
    ),
    { id: "123", name: "SitGuru", followersCount: 30, likesCount: 25 },
  );
});

test("preserves a genuine zero and rejects missing counts as null", () => {
  assert.equal(
    parseFacebookPageDetails({ id: "123", name: "SitGuru", followers_count: 0 }, "123").followersCount,
    0,
  );
  assert.equal(
    parseFacebookPageDetails({ id: "123", name: "SitGuru" }, "123").followersCount,
    null,
  );
});

test("rejects a different Page or malformed data", () => {
  assert.throws(() => parseFacebookPageDetails({ id: "456", name: "Other" }, "123"));
  assert.throws(() => parseFacebookPageDetails(null, "123"));
});
