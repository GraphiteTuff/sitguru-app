import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MANAGER_MENU_WIRED, MANAGER_ROUTES } from "./manager-routes";
import { MANAGER_PORTAL_SIDEBAR } from "./manager-portal";

describe("manager flat routes", () => {
  it("places the new standalone features immediately after their existing peers", () => {
    const labels = MANAGER_PORTAL_SIDEBAR.map(item => item.label);
    assert.equal(labels[labels.indexOf("Content Studio") + 1], "Community Studio");
    assert.equal(labels[labels.indexOf("Campus Growth") + 1], "Market Density");
    assert.equal(MANAGER_ROUTES.communityStudio, "/manager/community-studio");
    assert.equal(MANAGER_ROUTES.marketDensity, "/manager/market-density");
  });
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
