import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyResendSuppressionEvent,
  normalizeSuppressionEmail,
} from "./suppression";

describe("resend suppression classification", () => {
  it("suppresses hard bounce, complaint, and provider suppressed", () => {
    assert.equal(classifyResendSuppressionEvent("email.bounced"), "hard_bounce");
    assert.equal(classifyResendSuppressionEvent("email.complained"), "complaint");
    assert.equal(
      classifyResendSuppressionEvent("email.suppressed"),
      "provider_suppressed",
    );
  });

  it("does not suppress delivered, delayed, opened, or auth-unrelated events", () => {
    for (const type of [
      "email.delivered",
      "email.delivery_delayed",
      "email.opened",
      "email.clicked",
      "email.sent",
      "email.failed",
    ]) {
      assert.equal(classifyResendSuppressionEvent(type), null);
    }
  });

  it("normalizes recipient emails for suppression keys", () => {
    assert.equal(
      normalizeSuppressionEmail("  Parent@SitGuru.com "),
      "parent@sitguru.com",
    );
  });
});
