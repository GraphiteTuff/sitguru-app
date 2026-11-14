import assert from "node:assert/strict";
import test from "node:test";
import { getGrowthReportPeriod, growthReportCronPeriods, growthReportFilters } from "./report-periods";
import { EMPTY_REPORT_REVIEW, normalizedReportReview } from "./report-document";

test("weekly reporting runs Monday through Sunday, including partial preview weeks", () => {
  const report = getGrowthReportPeriod({ cadence: "weekly", now: new Date("2026-11-14T22:00:00.000Z") });
  assert.equal(report.startDate, "2026-11-09");
  assert.equal(report.endDate, "2026-11-15");
  assert.equal(report.weekEnding, "2026-11-15");
  assert.equal(report.completed, false);
  assert.equal(report.folderSegments.join("/"),
    "Analytics and Results/01 Weekly Reports/2026/Week Ending 2026-11-15");
});

test("Monday job writes yesterday and the completed week", () => {
  const periods = growthReportCronPeriods(new Date("2026-11-16T06:15:00.000Z"));
  assert.deepEqual(periods.map((p) => [p.cadence, p.endDate]),
    [["daily", "2026-11-15"], ["weekly", "2026-11-15"]]);
  assert.ok(periods.every((p) => p.completed));
  assert.equal(periods[0].folderSegments.at(-1), "Daily Snapshots");
});

test("first of the month archives the full prior calendar month", () => {
  const periods = growthReportCronPeriods(new Date("2026-12-01T06:15:00.000Z"));
  assert.deepEqual(periods.map((p) => [p.cadence, p.endDate]),
    [["daily", "2026-11-30"], ["monthly", "2026-11-30"]]);
  const month = periods[1];
  assert.equal(month.startDate, "2026-11-01");
  assert.deepEqual(month.folderSegments, [
    "Analytics and Results", "07 Monthly Reports", "2026", "Month Ending 2026-11-30",
  ]);
});

test("period filters use exact Eastern-midnight boundaries at spring DST transition", () => {
  const period = getGrowthReportPeriod({
    cadence: "weekly",
    end: "2026-03-08",
    now: new Date("2026-03-10T12:00:00.000Z"),
  });
  assert.equal(period.startIso, "2026-03-02T05:00:00.000Z");
  assert.equal(period.endIso, "2026-03-09T04:00:00.000Z");
  const filters = growthReportFilters(period);
  assert.equal(filters.priorEndIso, filters.startIso);
});

test("review normalization limits manager text and preserves empty review", () => {
  assert.equal(normalizedReportReview(null).worked, EMPTY_REPORT_REVIEW.worked);
  assert.equal(normalizedReportReview({ worked: "  Progress  " }).worked, "Progress");
  assert.equal(normalizedReportReview({ learned: "x".repeat(7000) }).learned.length, 6000);
});
