import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MANAGER_MENU_WIRED, MANAGER_ROUTES } from "./manager-routes";

describe("manager flat routes", () => {
  it("includes Live Results and peer intern surfaces", () => {
    const labels = MANAGER_MENU_WIRED.map((item) => item.label);
    for (const label of [
      "Live Results",
      "Calendar",
      "Metrics",
      "Manager Toolkit",
      "Training",
      "Resources",
      "Business Growth Report",
      "Messaging",
    ]) {
      assert.equal(labels.includes(label), true, `missing ${label}`);
    }
    assert.equal(MANAGER_ROUTES.results, "/manager/results");
    assert.equal(MANAGER_ROUTES.calendar, "/manager/calendar");
    assert.equal(MANAGER_ROUTES.metrics, "/manager/metrics");
    assert.equal(MANAGER_ROUTES.toolkit, "/manager/toolkit");
  });
});
