import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { activityDate, buildActivityHeatmap } from "./activity-heatmap";

describe("manager activity heatmap", () => {
  it("aligns weeks and aggregates only submitted and approved actual work", () => {
    const result = buildActivityHeatmap({ today: "2026-11-09", weeks: 2, logs: [
      { workedOn: "2026-11-09", hours: 2.5, status: "submitted" },
      { workedOn: "2026-11-09", hours: 1.25, status: "ava_approved" },
      { workedOn: "2026-11-09", hours: 9, status: "draft" },
      { workedOn: "2026-11-10", hours: 5, status: "submitted" },
      { workedOn: "2026-01-01", hours: 4, status: "submitted" },
    ], submissions: [{ submittedAt: "2026-11-09T15:00:00Z" }, { submittedAt: null }] });
    assert.equal(result.days.length, 14);
    assert.equal(result.days[0].date, "2026-11-02");
    assert.equal(result.totalHours, 3.75);
    assert.equal(result.approvedHours, 1.25);
    assert.equal(result.submissions, 1);
    assert.equal(result.activeDays, 1);
  });
  it("assigns timestamped submissions to the New York business date", () => {
    assert.equal(activityDate("2026-11-09T01:00:00Z"), "2026-11-08");
    assert.equal(activityDate("bad"), "");
  });
  it("has an honest empty state and rejects invalid dates", () => {
    const result = buildActivityHeatmap({ today: "2026-11-09" });
    assert.equal(result.activeDays, 0);
    assert.equal(result.totalHours, 0);
    assert.throws(() => buildActivityHeatmap({ today: "bad" }));
  });
});
