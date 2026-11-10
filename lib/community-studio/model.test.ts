import assert from "node:assert/strict";
import test from "node:test";
import {
  communityEditable, communityOwnedPath, communityPublishTime, communityReviewDecision,
  communityVisible, communityWeek,
} from "./model";

const now = new Date("2026-11-09T12:00:00Z");

test("public visibility requires consent, approval, an eligible stage, and a due publication time", () => {
  const item = { status: "scheduled", consent: true, approvedAt: "2026-11-09T10:00:00Z", publishAt: "2026-11-09T12:00:00Z" };
  assert.equal(communityVisible(item, now), true);
  for (const change of [
    { status: "approved" }, { status: "archived" }, { consent: false }, { approvedAt: "" },
    { publishAt: "2026-11-09T12:00:01Z" }, { publishAt: "invalid" },
  ]) assert.equal(communityVisible({ ...item, ...change }, now), false);
});

test("review requires pending submissions and actionable feedback on returns or rejection", () => {
  assert.equal(communityReviewDecision({ status: "draft", kind: "pack", action: "approve", feedback: "" }, now).ok, false);
  assert.equal(communityReviewDecision({ status: "pending", kind: "pack", action: "reject", feedback: "" }, now).ok, false);
  assert.deepEqual(communityReviewDecision({ status: "pending", kind: "pack", action: "request_changes", feedback: "Please confirm the pet's name." }, now), { ok: true, status: "changes_requested", publishAt: null });
  assert.deepEqual(communityReviewDecision({ status: "pending", kind: "pack", action: "approve", feedback: "" }, now), { ok: true, status: "approved", publishAt: null });
});

test("publishing and scheduling cannot bypass approval", () => {
  for (const status of ["draft", "pending", "rejected", "changes_requested", "archived"] as const) {
    for (const action of ["publish", "schedule"]) assert.equal(communityReviewDecision({ status, action, kind: "gallery", feedback: "", publishAt: "2026-11-10T12:00" }, now).ok, false);
  }
  assert.deepEqual(communityReviewDecision({ status: "approved", action: "publish", kind: "gallery", feedback: "" }, now), { ok: true, status: "published", publishAt: now.toISOString() });
  assert.equal(communityReviewDecision({ status: "approved", action: "schedule", kind: "gallery", feedback: "", publishAt: "2026-11-09T11:59" }, now).ok, false);
});

test("Pet of the Week requires a valid Monday edition", () => {
  assert.equal(communityWeek("2026-11-09"), true);
  assert.equal(communityWeek("2026-11-10"), false);
  assert.equal(communityWeek("2026-02-30"), false);
  assert.equal(communityReviewDecision({ status: "approved", action: "publish", kind: "pet_of_week", feedback: "" }, now).ok, false);
  assert.equal(communityReviewDecision({ status: "approved", action: "publish", kind: "pet_of_week", feedback: "", weekOf: "2026-11-09" }, now).ok, true);
});

test("scheduler accepts explicit UTC and rejects ambiguous or impossible dates", () => {
  assert.equal(communityPublishTime("2026-11-10T15:30"), "2026-11-10T15:30:00.000Z");
  assert.equal(communityPublishTime("2026-11-10T15:30:00.000Z"), "2026-11-10T15:30:00.000Z");
  for (const value of ["tomorrow", "11/10/2026", "2026-02-30T12:00", "2026-11-10T15:30-05:00"]) assert.equal(communityPublishTime(value), "");
});

test("submitted and published entries are immutable to their submitter", () => {
  assert.equal(communityEditable("draft"), true);
  assert.equal(communityEditable("changes_requested"), true);
  for (const status of ["pending", "approved", "scheduled", "published", "archived"]) assert.equal(communityEditable(status), false);
});

test("private upload ownership rejects path traversal and other submitters", () => {
  const owner = "11cfcfcb-00c0-445e-98be-5dcedaeccedd";
  assert.equal(communityOwnedPath(owner, `${owner}/11cfcfcb-00c0-445e-98be-5dcedaeccedd.jpg`), true);
  for (const path of [`other/file.jpg`, `${owner}/../file.jpg`, `${owner}\\file.jpg`, `${owner}/file.svg`]) assert.equal(communityOwnedPath(owner, path), false);
});
