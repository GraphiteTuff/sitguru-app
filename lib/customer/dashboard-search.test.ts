import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDashboardSearchHref, withBookingSelections } from "./dashboard-search";

const now = new Date("2026-10-29T16:00:00.000Z");

describe("pet parent dashboard search", () => {
  it("books dog walking from a saved ZIP for today", () => {
    const href = buildDashboardSearchHref({
      service: "Dog Walking",
      location: "18951",
      timing: "today",
      now,
    });
    assert.match(href, /service=Dog\+Walking/);
    assert.match(href, /zip=18951/);
    assert.match(href, /date=2026-10-29/);
  });

  it("lets a first search start without a saved location", () => {
    const href = buildDashboardSearchHref({
      service: "Pet Sitting",
      location: "",
      timing: "flexible",
      now,
    });
    assert.equal(href.includes("zip="), false);
    assert.equal(href.includes("date="), false);
    assert.match(href, /service=Pet\+Sitting/);
  });

  it("omits a date for flexible discovery", () => {
    const href = buildDashboardSearchHref({
      service: "Boarding",
      location: "18951 Quakertown",
      timing: "flexible",
      now,
    });
    assert.match(href, /zip=18951/);
    assert.equal(href.includes("date="), false);
  });

  it("keeps several walking dates", () => {
    const href = buildDashboardSearchHref({
      service: "Dog Walking",
      location: "19103",
      timing: "dates",
      dates: ["2026-11-07", "2026-11-03", "2026-11-05"],
      now,
    });
    assert.match(href, /zip=19103/);
    assert.match(href, /date=2026-11-03/);
    assert.match(href, /dates=2026-11-03%2C2026-11-05%2C2026-11-07/);
  });

  it("sends boarding as a check-in and check-out range", () => {
    const href = buildDashboardSearchHref({
      service: "Boarding",
      location: "19103",
      timing: "dates",
      rangeStart: "2026-11-05",
      rangeEnd: "2026-11-08",
      now,
    });
    assert.match(href, /date=2026-11-05/);
    assert.match(href, /end=2026-11-08/);
    assert.equal(href.includes("dates="), false);
  });

  it("searches a new ZIP without requiring the saved one", () => {
    const href = buildDashboardSearchHref({
      service: "Dog Walking",
      location: "19103",
      timing: "flexible",
      now,
    });
    assert.match(href, /zip=19103/);
    assert.equal(href.includes("18951"), false);
  });

  it("keeps the Guru, service, and ZIP on Book Now", () => {
    const href = withBookingSelections("/book/carol?express=1", {
      service: "Dog Walking",
      location: "18951",
      timing: "tomorrow",
      now,
    });
    assert.match(href, /^\/book\/carol/);
    assert.match(href, /service=Dog\+Walking/);
    assert.match(href, /zip=18951/);
    assert.match(href, /date=2026-10-30/);
  });
});
