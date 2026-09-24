import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  contactChannelLabel,
  emailForBlankProfile,
  formatLoginAndContact,
  resolveCanonicalContactEmail,
} from "./contact-email";

describe("canonical contact email", () => {
  it("keeps a stored profile email ahead of a different auth email", () => {
    assert.equal(
      resolveCanonicalContactEmail({
        profileEmail: "preferred@example.com",
        authEmail: "other@example.com",
      }),
      "preferred@example.com",
    );
    assert.equal(emailForBlankProfile("preferred@example.com", "other@example.com"), null);
  });

  it("fills a blank profile from auth email, including Apple Private Relay", () => {
    const relay = "8psrn7wt5v@privaterelay.appleid.com";
    assert.equal(
      resolveCanonicalContactEmail({ profileEmail: "", authEmail: relay }),
      relay,
    );
    assert.equal(emailForBlankProfile("  ", relay), relay);
  });

  it("uses signup metadata email when auth.users.email is empty", () => {
    assert.equal(
      resolveCanonicalContactEmail({
        profileEmail: null,
        authEmail: "",
        metadataEmail: "payne1018@gmail.com",
      }),
      "payne1018@gmail.com",
    );
  });

  it("does not call a phone login Phone only when a contact email exists", () => {
    assert.equal(
      formatLoginAndContact({
        providers: ["phone"],
        email: "payne1018@gmail.com",
        phone: "16109316006",
      }),
      "Login: Phone · Contact: Email + phone",
    );
    assert.equal(contactChannelLabel("", "16109316006"), "Phone only");
  });
});
