import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  gateResendWebhookSecret,
  gateSvixSignatureHeaders,
  verifyResendWebhookOrFail,
} from "./resend-webhook-auth";
import {
  classifyResendSuppressionEvent,
  normalizeSuppressionEmail,
} from "./suppression";
import { normalizeEmailAddress, sanitizeEmailHeaderValue } from "./headers";

describe("resend webhook auth gates", () => {
  it("fails closed when webhook secret is missing", () => {
    const result = gateResendWebhookSecret("");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 503);
      assert.match(result.error, /not configured/i);
    }
  });

  it("fails closed when Svix signature headers are missing", () => {
    const result = gateSvixSignatureHeaders({});
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 400);
      assert.match(result.error, /Missing signature/i);
    }
  });

  it("fails closed on invalid signature", () => {
    const result = verifyResendWebhookOrFail({
      secret: "whsec_test_not_a_real_secret",
      payload: JSON.stringify({ type: "email.bounced", data: { to: ["a@b.com"] } }),
      id: "msg_test",
      timestamp: "1710000000",
      signature: "v1,definitely-invalid",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 400);
      assert.match(result.error, /Invalid signature/i);
    }
  });
});

describe("resend suppression classification", () => {
  it("maps bounce, complaint, and suppressed events", () => {
    assert.equal(classifyResendSuppressionEvent("email.bounced"), "hard_bounce");
    assert.equal(classifyResendSuppressionEvent("email.complained"), "complaint");
    assert.equal(
      classifyResendSuppressionEvent("email.suppressed"),
      "provider_suppressed",
    );
  });

  it("does not suppress delivered/delayed/opened/sent/failed", () => {
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

  it("normalizes recipient emails for idempotent upsert keys", () => {
    assert.equal(
      normalizeSuppressionEmail("  Parent@SitGuru.com "),
      "parent@sitguru.com",
    );
    assert.equal(
      normalizeEmailAddress("A@B.COM"),
      normalizeSuppressionEmail("a@b.com"),
    );
  });

  it("strips CR/LF from normalization inputs", () => {
    assert.equal(
      sanitizeEmailHeaderValue("user@sitguru.com\r\nBcc: evil@x.com"),
      "user@sitguru.com Bcc: evil@x.com",
    );
  });
});
