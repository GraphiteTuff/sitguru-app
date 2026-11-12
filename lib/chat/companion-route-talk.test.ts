import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stripCompanionRouteTalk } from "./companion-auth";

describe("stripCompanionRouteTalk", () => {
  it("preserves canonical Ambassador and PetPerks paths", () => {
    const text =
      "Apply at **/programs/ambassadors/apply**. See **/petperks**. Email support@sitguru.com.";
    const out = stripCompanionRouteTalk(text);
    assert.match(out, /\/programs\/ambassadors\/apply/);
    assert.match(out, /\/petperks/);
    assert.match(out, /support@sitguru\.com/);
  });

  it("still strips invented deep links", () => {
    const out = stripCompanionRouteTalk(
      "Open /secret/admin/panel and /fake/dashboard/now please.",
    );
    assert.doesNotMatch(out, /\/secret\/admin\/panel/);
    assert.doesNotMatch(out, /\/fake\/dashboard\/now/);
  });
});
