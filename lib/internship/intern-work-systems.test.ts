import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  INTERN_WORK_SYSTEMS,
  INTERN_WORK_SYSTEMS_IMPORTANT,
  INTERN_WORKFLOW_STEPS,
} from "./intern-work-systems";

describe("intern work systems", () => {
  it("keeps Intern Portal as the official system of record", () => {
    assert.equal(INTERN_WORK_SYSTEMS[0]?.id, "intern-portal");
    assert.match(INTERN_WORK_SYSTEMS[0]?.role || "", /system of record/i);
  });

  it("lists workflow steps and OneNote restriction", () => {
    assert.equal(INTERN_WORKFLOW_STEPS.length, 8);
    assert.match(INTERN_WORK_SYSTEMS_IMPORTANT, /OneNote/i);
    assert.match(INTERN_WORK_SYSTEMS_IMPORTANT, /Intern Portal/i);
  });
});
