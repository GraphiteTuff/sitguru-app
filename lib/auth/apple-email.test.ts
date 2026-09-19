import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applePrivateRelayLabel,
  isApplePrivateRelayEmail,
  normalizeEmail,
  resolveAuthProvider,
} from "./apple-email";
import {
  resolveAccountEmails,
  resolvePreferredContactEmail,
  shouldBackfillAuthEmail,
  shouldWriteContactEmail,
} from "./account-email";

describe("isApplePrivateRelayEmail", () => {
  it("recognizes @privaterelay.appleid.com", () => {
    assert.equal(
      isApplePrivateRelayEmail("8psrn7wt5v@privaterelay.appleid.com"),
      true,
    );
  });

  it("recognizes @private.icloud.com case-insensitively", () => {
    assert.equal(
      isApplePrivateRelayEmail("Someone@Private.iCloud.COM"),
      true,
    );
  });

  it("handles null/empty safely", () => {
    assert.equal(isApplePrivateRelayEmail(null), false);
    assert.equal(isApplePrivateRelayEmail(undefined), false);
    assert.equal(isApplePrivateRelayEmail(""), false);
    assert.equal(isApplePrivateRelayEmail("   "), false);
  });

  it("does not flag normal emails", () => {
    assert.equal(isApplePrivateRelayEmail("ashley@example.com"), false);
    assert.equal(isApplePrivateRelayEmail("user@gmail.com"), false);
  });
});

describe("resolveAccountEmails", () => {
  it("CASE 1: Apple relay auth email fills missing profile/admin email", () => {
    const resolved = resolveAccountEmails({
      authEmail: "x@privaterelay.appleid.com",
      profileEmail: null,
      guruEmail: null,
      provider: "apple",
    });

    assert.equal(resolved.authEmail, "x@privaterelay.appleid.com");
    assert.equal(resolved.displayEmail, "x@privaterelay.appleid.com");
    assert.equal(resolved.isPrivateRelay, true);
    assert.equal(resolved.authProvider, "apple");
    assert.equal(applePrivateRelayLabel(resolved.authEmail), "Apple Private Relay");
  });

  it("CASE 2: private.icloud.com is Apple Private Relay", () => {
    const resolved = resolveAccountEmails({
      authEmail: "x@private.icloud.com",
      provider: "apple",
    });
    assert.equal(resolved.isPrivateRelay, true);
  });

  it("CASE 3: contact email stays distinct from auth relay email", () => {
    const resolved = resolveAccountEmails({
      authEmail: "relay@privaterelay.appleid.com",
      contactEmail: "ashley@example.com",
      profileEmail: "relay@privaterelay.appleid.com",
      provider: "apple",
    });

    assert.equal(resolved.authEmail, "relay@privaterelay.appleid.com");
    assert.equal(resolved.contactEmail, "ashley@example.com");
    assert.equal(resolved.displayEmail, "ashley@example.com");
    assert.equal(resolved.isPrivateRelay, true);
  });

  it("CASE 4: Google user unchanged", () => {
    const resolved = resolveAccountEmails({
      authEmail: "person@gmail.com",
      profileEmail: "person@gmail.com",
      provider: "google",
    });
    assert.equal(resolved.authEmail, "person@gmail.com");
    assert.equal(resolved.contactEmail, null);
    assert.equal(resolved.isPrivateRelay, false);
    assert.equal(resolved.authProvider, "google");
  });

  it("CASE 5: email/password user unchanged", () => {
    const resolved = resolveAccountEmails({
      authEmail: "parent@sitguru.com",
      profileEmail: "parent@sitguru.com",
      provider: "email",
    });
    assert.equal(resolved.authProvider, "email");
    assert.equal(resolved.isPrivateRelay, false);
  });

  it("CASE 9: admin falls back to auth when application email null", () => {
    const resolved = resolveAccountEmails({
      guruEmail: null,
      profileEmail: null,
      authEmail: "8psrn7wt5v@privaterelay.appleid.com",
    });
    assert.equal(resolved.displayEmail, "8psrn7wt5v@privaterelay.appleid.com");
  });

  it("CASE 10: backfill does not overwrite existing contact email", () => {
    assert.equal(
      shouldWriteContactEmail({
        existingContactEmail: "ashley@example.com",
        nextContactEmail: "relay@privaterelay.appleid.com",
        authEmail: "relay@privaterelay.appleid.com",
      }),
      false,
    );
  });
});

describe("shouldBackfillAuthEmail", () => {
  it("backfills only when profile email empty and auth exists", () => {
    assert.equal(
      shouldBackfillAuthEmail({
        existingEmail: null,
        authEmail: "x@privaterelay.appleid.com",
      }),
      true,
    );
    assert.equal(
      shouldBackfillAuthEmail({
        existingEmail: "already@example.com",
        authEmail: "x@privaterelay.appleid.com",
      }),
      false,
    );
    assert.equal(
      shouldBackfillAuthEmail({
        existingEmail: null,
        authEmail: null,
      }),
      false,
    );
  });
});

describe("resolvePreferredContactEmail", () => {
  it("prefers contact email for Stripe when present", () => {
    assert.equal(
      resolvePreferredContactEmail({
        contactEmail: "ashley@example.com",
        authEmail: "x@privaterelay.appleid.com",
      }),
      "ashley@example.com",
    );
  });

  it("falls back to Apple relay auth email for Stripe", () => {
    assert.equal(
      resolvePreferredContactEmail({
        contactEmail: null,
        authEmail: "x@privaterelay.appleid.com",
      }),
      "x@privaterelay.appleid.com",
    );
  });
});

describe("normalizeEmail / resolveAuthProvider", () => {
  it("normalizes case and whitespace", () => {
    assert.equal(normalizeEmail("  A@B.COM "), "a@b.com");
  });

  it("detects apple from identities", () => {
    assert.equal(
      resolveAuthProvider({
        identities: [{ provider: "apple" }],
      }),
      "apple",
    );
  });
});
