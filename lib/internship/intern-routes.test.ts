import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { INTERN_MENU_WIRED, INTERN_ROUTES, internLegacySectionRedirect } from "./intern-routes";

describe("intern flat routes", () => {
  it("lists every sidebar destination", () => {
    assert.equal(INTERN_MENU_WIRED.length >= 17, true);
    assert.equal(INTERN_ROUTES.results, "/intern/results");
    assert.equal(INTERN_ROUTES.calendar, "/intern/calendar");
    assert.equal(INTERN_ROUTES.metrics, "/intern/metrics");
    assert.equal(INTERN_ROUTES.settings, "/intern/settings");
  });

  it("redirects legacy buried tabs to flat pages", () => {
    assert.equal(
      internLegacySectionRedirect({ tab: "work", focus: "checkin" }),
      "/intern/check-ins",
    );
    assert.equal(internLegacySectionRedirect({ tab: "work" }), "/intern/assignments");
    assert.equal(internLegacySectionRedirect({ tab: "project" }), "/intern/milestones");
    assert.equal(internLegacySectionRedirect({ focus: "messages" }), "/intern/messages");
    assert.equal(internLegacySectionRedirect({ tool: "brand" }), "/intern/toolkit");
    assert.equal(internLegacySectionRedirect({ edit: "page" }), "/intern/settings");
  });
});
