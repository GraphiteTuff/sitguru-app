import assert from "node:assert/strict";
import test from "node:test";
import { isOutreachStage, normalizeOutreachState, outreachIsClosed, validOutreachInterests } from "./outreach-crm";

test("field intake uses real workflow statuses, not invented approvals", () => {
  assert.equal(isOutreachStage("Assigned"), true);
  assert.equal(isOutreachStage("Partner enrolled"), true);
  assert.equal(isOutreachStage("Approved as Guru"), false);
});

test("closed prospects stop follow-up alerts", () => {
  assert.equal(outreachIsClosed("Not interested"), true);
  assert.equal(outreachIsClosed("Closed"), true);
  assert.equal(outreachIsClosed("Contacted"), false);
});

test("location and interests normalize safely", () => {
  assert.equal(normalizeOutreachState(" fl "), "FL");
  assert.deepEqual(
    validOutreachInterests(["SitGuru Partner", "SitGuru Partner", "Other", "Community spotlight"]),
    ["SitGuru Partner", "Community spotlight"]
  );
});
