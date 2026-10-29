import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildInternHoursDashboard, internHoursCsv, weekNumberForDate } from "./hours-dashboard";
import type { DashboardEntry } from "./hours-dashboard";

const today = new Date(2027, 0, 28);

function entry(partial: Partial<DashboardEntry> & Pick<DashboardEntry, "id" | "workedOn" | "hours" | "status">): DashboardEntry {
  return {
    categorySlug: "content-social",
    categoryName: "Content & Social",
    description: "Campaign work",
    weekNumber: null,
    ...partial,
  };
}

describe("intern hours dashboard", () => {
  it("counts approved hours toward completion and keeps drafts in the week log", () => {
    const dashboard = buildInternHoursDashboard({
      today,
      startDate: "2027-01-12",
      requiredHours: 150,
      weeks: 15,
      weeklyTarget: 10,
      currentWeek: 3,
      requirementPending: false,
      entries: [
        entry({ id: "a", workedOn: "2027-01-26", hours: 2, status: "founder_approved", weekNumber: 3 }),
        entry({ id: "b", workedOn: "2027-01-28", hours: 2, status: "draft", weekNumber: 3, categorySlug: "analytics", categoryName: "Analytics" }),
        entry({ id: "c", workedOn: "2027-01-19", hours: 8, status: "locked", weekNumber: 2 }),
        entry({ id: "d", workedOn: "2027-01-28", hours: 0, status: "running" }),
      ],
    });

    assert.equal(dashboard.credit, 10);
    assert.equal(dashboard.logged, 12);
    assert.equal(dashboard.completedPercent, 7);
    assert.equal(dashboard.hoursThisWeek, 4);
    assert.equal(dashboard.remaining, 140);
    assert.equal(dashboard.paceTitle, "Recovery pace");
    assert.equal(dashboard.draftsThisWeek, 1);
    assert.equal(dashboard.weekDays[0].key, "2027-01-25");
    assert.equal(dashboard.weekDays[6].key, "2027-01-31");
    assert.equal(dashboard.chartWeeks[1].hours, 8);
    assert.equal(dashboard.chartWeeks[2].hours, 4);
    assert.equal(dashboard.categories[0].name, "Content & Social");
    assert.equal(dashboard.recent[0].id, "b");
  });

  it("does not invent a 150-hour requirement while university hours are pending", () => {
    const dashboard = buildInternHoursDashboard({
      today,
      startDate: null,
      requiredHours: 0,
      weeks: 15,
      weeklyTarget: 10,
      currentWeek: 0,
      requirementPending: true,
      entries: [],
    });

    assert.equal(dashboard.requirementPending, true);
    assert.equal(dashboard.paceTitle, "Requirement pending");
    assert.equal(dashboard.paceStatus, "pending");
    assert.equal(dashboard.remaining, null);
    assert.equal(dashboard.completedPercent, 0);
    assert.equal(dashboard.credit, 0);
    assert.equal(dashboard.chartWeeks.length, 6);
    assert.equal(dashboard.recent.length, 0);
  });

  it("places a worked day in the internship week that contains it", () => {
    assert.equal(weekNumberForDate("2027-01-12", "2027-01-28"), 3);
    assert.equal(weekNumberForDate("2027-01-12", "2027-01-11"), 0);
    assert.equal(weekNumberForDate(null, "2027-01-28"), 0);
  });

  it("exports logged rows and only accumulates founder-approved hours", () => {
    const csv = internHoursCsv([
      entry({ id: "a", workedOn: "2027-01-26", hours: 2, status: "founder_approved", weekNumber: 3, description: "Plan posts" }),
      entry({ id: "b", workedOn: "2027-01-28", hours: 1.5, status: "draft", weekNumber: 3, description: "Reel, with notes" }),
    ]);
    assert.match(csv, /date,week,hours/);
    assert.match(csv, /2027-01-26,Week 3,2,Content & Social,Plan posts,,Recommended,Approved,2/);
    assert.match(csv, /"Reel, with notes",,,,2/);
  });
});
