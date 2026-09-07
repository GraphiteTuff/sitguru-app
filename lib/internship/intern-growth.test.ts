import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { INTERNSHIP_PORTAL_PATH } from "./constants";
import { internSafeNext, internPortalDestination, INTERNSHIP_GROWTH_PATH } from "./intern-growth";
import { INTERNSHIP_ONBOARDING_PATH } from "./onboarding";

describe("intern growth workplace path", () => {
  it("lives on the intern portal, not Admin HQ", () => {
    assert.equal(INTERNSHIP_GROWTH_PATH, "/intern/growth");
    assert.equal(INTERNSHIP_GROWTH_PATH.startsWith(INTERNSHIP_PORTAL_PATH), true);
    assert.equal(INTERNSHIP_GROWTH_PATH.startsWith("/admin"), false);
  });

  it("keeps login next links inside the intern portal", () => {
    assert.equal(internSafeNext("/intern/growth/create"), "/intern/growth/create");
    assert.equal(internSafeNext("/admin/growth"), INTERNSHIP_PORTAL_PATH);
    assert.equal(internSafeNext("https://evil.example/intern"), INTERNSHIP_PORTAL_PATH);
    assert.equal(internSafeNext("//intern/growth"), INTERNSHIP_PORTAL_PATH);
    assert.equal(
      internPortalDestination("/intern/growth/create", false),
      INTERNSHIP_ONBOARDING_PATH,
    );
    assert.equal(internPortalDestination("/intern/growth/create", true), "/intern/growth/create");
    assert.equal(internPortalDestination("/intern/help", false), "/intern/help");
  });
});
