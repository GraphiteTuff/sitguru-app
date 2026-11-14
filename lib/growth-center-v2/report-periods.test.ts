import assert from "node:assert/strict";
import test from "node:test";
import { getGrowthReportPeriod, growthReportCronPeriods, growthReportFilters } from "./report-periods";
import { EMPTY_REPORT_REVIEW, emptyWeeklyPulse, normalizedReportReview, weeklyPulseMarkdown } from "./report-document";

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


test("pulse retains true zero separately from missing social metrics", () => {
  const input = emptyWeeklyPulse();
  input.platforms.instagram = {
    followers: "1,250",
    netGrowth: "+20",
    reach: "0",
    impressions: "",
    linkClicks: "14",
    evidenceLink: "https://instagram.com/",
  };
  input.platforms.nextdoor = {
    followers: "",
    netGrowth: "",
    reach: "",
    impressions: "",
    linkClicks: "",
    evidenceLink: "",
  };
  input.topAssetWhy = "Local student reach";
  input.communitySentiment = "mixed";
  const clean = normalizedReportReview({ weeklyPulse: input }).weeklyPulse;
  assert.equal(clean.platforms.instagram.followers, "1250");
  assert.equal(clean.platforms.instagram.netGrowth, "20");
  assert.equal(clean.platforms.instagram.reach, "0");
  assert.equal(clean.platforms.instagram.impressions, "");
  assert.equal(clean.platforms.nextdoor.followers, "");
  assert.equal(clean.communitySentiment, "mixed");
  const markdown = weeklyPulseMarkdown(clean);
  assert.match(markdown, /Instagram/);
  assert.match(markdown, /Nextdoor/);
  assert.match(markdown, /Not supplied/);
  assert.match(markdown, /Top performing asset of the week/);
  assert.match(markdown, /Coaching hub/);
  assert.match(markdown, /Sum of supplied platform counts/);
  assert.ok(markdown.indexOf("### Platform source references") > markdown.indexOf("Sum of supplied platform counts"));
});

test("pulse rejects invalid numeric manual metrics without converting missing values to zero", () => {
  const input = emptyWeeklyPulse();
  input.platforms.tiktok.netGrowth = "-13";
  input.platforms.tiktok.followers = "unknown";
  input.platforms.facebook.impressions = "-2";
  const clean = normalizedReportReview({ weeklyPulse: input }).weeklyPulse;
  assert.equal(clean.platforms.tiktok.netGrowth, "-13");
  assert.equal(clean.platforms.tiktok.followers, "");
  assert.equal(clean.platforms.facebook.impressions, "");
});
