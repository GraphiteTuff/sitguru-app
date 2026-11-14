import assert from "node:assert/strict";
import { test } from "node:test";
import { INTERN_RECORD_TABS, internRecordTabFromHash } from "./intern-record-tabs";

test("all five admin intern record sections have unique hashes", () => {
  assert.equal(INTERN_RECORD_TABS.length, 5);
  assert.equal(new Set(INTERN_RECORD_TABS.map((item) => item.id)).size, 5);
  assert.equal(new Set(INTERN_RECORD_TABS.map((item) => item.hash)).size, 5);
});

test("old profile, approval and onboarding deep links remain supported", () => {
  assert.equal(internRecordTabFromHash("#profile"), "overview");
  assert.equal(internRecordTabFromHash("#approvals"), "overview");
  assert.equal(internRecordTabFromHash("#onboarding"), "onboarding");
  assert.equal(internRecordTabFromHash("#academic"), "academic");
  assert.equal(internRecordTabFromHash("#work"), "work");
  assert.equal(internRecordTabFromHash("#results"), "results");
  assert.equal(internRecordTabFromHash("#unknown"), "overview");
  assert.equal(internRecordTabFromHash(""), "overview");
});
