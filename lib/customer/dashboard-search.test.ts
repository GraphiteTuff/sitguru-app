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

  it("changes the service and chosen date", () => {
    const href = buildDashboardSearchHref({
      service: "Drop-In Visits",
      location: "18951",
      timing: "dates",
      chosenDate: "2026-11-02",
      now,
    });
    assert.match(href, /service=Drop-In\+Visits/);
    assert.match(href, /date=2026-11-02/);
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
