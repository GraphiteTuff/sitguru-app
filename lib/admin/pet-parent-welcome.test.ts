import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildPetParentWelcomeEmail,
  buildPetParentWelcomeMailto,
} from "@/lib/admin/pet-parent-welcome";

describe("pet-parent-welcome", () => {
  it("builds a welcome subject matching the Pet Parent & Ambassador stream", () => {
    const content = buildPetParentWelcomeEmail({
      fullName: "Najia Whitesell",
      email: "najiahasan53@yahoo.com",
    });

    assert.equal(
      content.subject,
      "Welcome to SitGuru — Pet Parent & Ambassador Community",
    );
    assert.match(content.text, /Hi Najia/);
    assert.match(content.html, /Welcome, Najia!/);
    assert.match(content.html, /Pet Parent/);
    assert.doesNotMatch(content.html, /najiahassan53/);
    assert.match(content.text, /dashboard/i);
  });

  it("builds a mailto that uses only the provided stored address", () => {
    const href = buildPetParentWelcomeMailto({
      email: "najiahasan53@yahoo.com",
      fullName: "Najia Whitesell",
    });

    assert.match(href, /^mailto:najiahasan53@yahoo\.com\?/);
    assert.match(href, /Welcome%20to%20SitGuru/);
    assert.doesNotMatch(href, /najiahassan53/);
  });
});
