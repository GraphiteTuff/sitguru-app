import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildManagerLoginInstructions } from "./manager-login-mail";

describe("manager login instructions", () => {
  it("tells Ava how to set a password and open the Manager Portal", () => {
    const mail = buildManagerLoginInstructions({
      fullName: "Ava Venezia",
      email: "ava@sitguru.com",
      setPasswordUrl: "https://example.test/set",
      loginUrl: "https://www.sitguru.com/login?mode=email&next=%2Fmanager",
      portalUrl: "https://www.sitguru.com/manager",
    });
    assert.match(mail.subject, /Manager Portal/);
    assert.match(mail.text, /ava@sitguru.com/);
    assert.match(mail.text, /https:\/\/www\.sitguru\.com\/manager/);
    assert.match(mail.html, /Set your SitGuru password/);
    assert.doesNotMatch(mail.text, /temporary password/i);
    assert.doesNotMatch(mail.html, /Admin HQ login is/);
  });
});
