import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { currentSemesterDeliverable, internshipWeekNumber } from "./process";
import { SEMESTER_DELIVERABLES } from "./playbook";

describe("internship process sync", () => {
  it("maps weeks 1-2 to the Baseline deliverable both portals show", () => {
    const start = "2027-01-11";
    assert.equal(internshipWeekNumber(start, new Date("2027-01-12T12:00:00")), 1);
    assert.equal(currentSemesterDeliverable(start, new Date("2027-01-18T12:00:00")).id, "baseline");
    assert.equal(currentSemesterDeliverable(start, new Date("2027-04-28T12:00:00")).title, SEMESTER_DELIVERABLES[5].title);
  });
});
