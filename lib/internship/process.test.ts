import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { currentSemesterDeliverable, internshipWeekNumber } from "./process";

describe("internship process sync", () => {
  it("maps week 1 research to the Market Analysis starting point both portals show", () => {
    const start = "2027-01-11";
    assert.equal(internshipWeekNumber(start, new Date("2027-01-12T12:00:00")), 1);
    assert.equal(currentSemesterDeliverable(start, new Date("2027-01-12T12:00:00")).id, "market_analysis");
    assert.match(
      currentSemesterDeliverable(start, new Date("2027-04-28T12:00:00")).demonstrates,
      /Business Growth Report/,
    );
  });
});
