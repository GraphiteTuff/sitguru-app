import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMAIL_ENV_VAR_NAMES,
  isProtectedPersonalFrom,
  PROTECTED_PERSONAL_MAILBOXES,
  RECOMMENDED_SENDER_ARCHITECTURE,
} from "./config";
import {
  buildMarketingUnsubscribeHeaders,
  buildSafeFromHeader,
  isProbablyValidEmail,
  normalizeEmailAddress,
  sanitizeEmailHeaderValue,
} from "./headers";

describe("email header hygiene", () => {
  it("strips CR/LF from header values", () => {
    assert.equal(
      sanitizeEmailHeaderValue("Hello\r\nBcc: evil@example.com"),
      "Hello Bcc: evil@example.com",
    );
  });

  it("builds a safe From header without trusting display-name angle brackets", () => {
    assert.equal(
      buildSafeFromHeader('Jason <evil@x.com>', "support@sitguru.com"),
      "Jason evil@x.com <support@sitguru.com>",
    );
  });

  it("accepts Apple Private Relay style addresses", () => {
    assert.equal(
      isProbablyValidEmail("abc123@privaterelay.appleid.com"),
      true,
    );
  });

  it("normalizes email casing and whitespace", () => {
    assert.equal(
      normalizeEmailAddress("  Jason@SitGuru.com "),
      "jason@sitguru.com",
    );
  });
});

describe("marketing unsubscribe headers", () => {
  it("emits List-Unsubscribe and One-Click Post headers for https URLs", () => {
    const headers = buildMarketingUnsubscribeHeaders({
      unsubscribeUrl: "https://www.sitguru.com/unsubscribe?token=abc",
    });
    assert.equal(
      headers["List-Unsubscribe"],
      "<https://www.sitguru.com/unsubscribe?token=abc>",
    );
    assert.equal(
      headers["List-Unsubscribe-Post"],
      "List-Unsubscribe=One-Click",
    );
  });

  it("rejects non-https unsubscribe URLs", () => {
    assert.throws(() =>
      buildMarketingUnsubscribeHeaders({
        unsubscribeUrl: "http://sitguru.com/unsubscribe?token=abc",
      }),
    );
  });
});

describe("personal mailbox protection", () => {
  it("flags jason@sitguru.com as protected personal From", () => {
    assert.ok(PROTECTED_PERSONAL_MAILBOXES.includes("jason@sitguru.com"));
    assert.equal(
      isProtectedPersonalFrom("Jason Graff <jason@sitguru.com>"),
      true,
    );
    assert.equal(isProtectedPersonalFrom("jason@sitguru.com"), true);
    assert.equal(
      isProtectedPersonalFrom("Jason Graff <Jason@SitGuru.com>"),
      true,
    );
    assert.equal(
      isProtectedPersonalFrom("SitGuru Support <support@sitguru.com>"),
      false,
    );
    assert.equal(
      isProtectedPersonalFrom("SitGuru <alerts@sitguru.com>"),
      false,
    );
  });

  it("documents recommended streams without requiring subdomain invention", () => {
    assert.match(RECOMMENDED_SENDER_ARCHITECTURE.personal, /jason@sitguru\.com/);
    assert.match(RECOMMENDED_SENDER_ARCHITECTURE.support, /support@sitguru\.com/);
    assert.ok(EMAIL_ENV_VAR_NAMES.includes("RESEND_API_KEY"));
    assert.ok(EMAIL_ENV_VAR_NAMES.includes("RESEND_FROM_EMAIL"));
    assert.ok(EMAIL_ENV_VAR_NAMES.includes("RESEND_WEBHOOK_SECRET"));
  });
});

describe("marketing vs transactional header rules", () => {
  it("builds marketing unsubscribe headers and keeps auth-style https only", () => {
    const headers = buildMarketingUnsubscribeHeaders({
      unsubscribeUrl:
        "https://www.sitguru.com/api/email-updates/unsubscribe?token=abc",
    });
    assert.match(headers["List-Unsubscribe"], /^<https:\/\//);
    assert.equal(
      headers["List-Unsubscribe-Post"],
      "List-Unsubscribe=One-Click",
    );
  });
});