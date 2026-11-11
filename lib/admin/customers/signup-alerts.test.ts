import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { signupAlertFingerprint } from "./signup-alerts";

describe("signup alert fingerprints", () => {
  it("prefers subject user id over href variants", () => {
    assert.equal(
      signupAlertFingerprint({
        type: "guru_signup",
        userId: "72cbe4b4-a349-4348-b3ac-8918e2ef4e10",
        href: "/admin/gurus/abc",
      }),
      signupAlertFingerprint({
        type: "guru_signup",
        userId: "72cbe4b4-a349-4348-b3ac-8918e2ef4e10",
        href: "/admin/account-lifecycle/72cbe4b4-a349-4348-b3ac-8918e2ef4e10",
      }),
    );
  });

  it("falls back to email when no subject ids exist", () => {
    assert.equal(
      signupAlertFingerprint({
        type: "pet_parent_signup",
        email: "Parent@SitGuru.com",
      }),
      "pet_parent_signup:email:parent@sitguru.com",
    );
  });
});
