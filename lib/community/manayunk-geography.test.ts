import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getEventCountyLabel } from "./format";
import { normalizeRequestedCounty } from "@/lib/companions/events-tools";

describe("Manayunk geography", () => {
  it("treats Manayunk as Philadelphia County", () => {
    const label = getEventCountyLabel({
      city: "Manayunk",
      featured_market_city: null,
    });
    assert.equal(label, "Philadelphia County");
  });

  it("does not treat Manayunk as outside Philadelphia for queries", () => {
    assert.equal(
      normalizeRequestedCounty({ city: "Manayunk" }),
      "Philadelphia County",
    );
    assert.equal(
      normalizeRequestedCounty({ city: "Philadelphia" }),
      "Philadelphia County",
    );
  });

  it("overrides a mis-stamped Montgomery featured_market_city for Manayunk venues", () => {
    const stamped = getEventCountyLabel({
      city: "Manayunk",
      featured_market_city: "Montgomery County",
    });
    assert.equal(stamped, "Philadelphia County");
  });
});

