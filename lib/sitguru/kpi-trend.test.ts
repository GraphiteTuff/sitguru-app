import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compareKpi, weekOverWeekTrend } from "./kpi-trend";

describe("compareKpi", () => {
  it("marks an increase green and a decrease red", () => {
    const up = compareKpi(8, 3);
    assert.equal(up.direction, "up");
    assert.equal(up.tone, "up");
    assert.equal(up.label, "+5");

    const down = compareKpi(1, 4);
    assert.equal(down.direction, "down");
    assert.equal(down.tone, "down");
    assert.equal(down.label, "−3");
  });

  it("turns an inverted increase red (worse queue / risk)", () => {
    const worse = compareKpi(6, 2, { invert: true });
    assert.equal(worse.direction, "up");
    assert.equal(worse.tone, "down");
  });
});

describe("weekOverWeekTrend", () => {
  it("counts this week versus the prior week", () => {
    const now = Date.parse("2026-09-04T18:00:00.000Z");
    const trend = weekOverWeekTrend(
      [
        "2026-09-03T12:00:00.000Z",
        "2026-09-02T12:00:00.000Z",
        "2026-08-26T12:00:00.000Z",
      ],
      { now },
    );
    assert.equal(trend.direction, "up");
    assert.equal(trend.label, "+1");
  });
});
