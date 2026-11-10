import assert from "node:assert/strict";
import { test } from "node:test";
import { currentCommunityWeek } from "./editions";

test("Pet of the Week rolls over on Monday in New York, including the fall clock change", () => {
  assert.equal(currentCommunityWeek(new Date("2026-11-09T04:59:59Z")), "2026-11-02");
  assert.equal(currentCommunityWeek(new Date("2026-11-09T05:00:00Z")), "2026-11-09");
  assert.equal(currentCommunityWeek(new Date("2026-11-01T07:00:00Z")), "2026-10-26");
});
