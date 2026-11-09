import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isTestDirectoryPerson, isTestInboxThread } from "./staff-directory";

describe("staff directory test filters", () => {
  it("drops Test inbox threads and placeholder seats", () => {
    assert.equal(isTestInboxThread({ name: "Test", preview: "Test Message" }), true);
    assert.equal(isTestInboxThread({ subject: "Test message", preview: "Test" }), true);
    assert.equal(isTestInboxThread({ name: "Lola", preview: "Hi Lola" }), false);
    assert.equal(isTestDirectoryPerson({ firstName: "Test", email: null }), true);
    assert.equal(isTestDirectoryPerson({ firstName: "Ava", email: "ava@sitguru.com" }), false);
    assert.equal(isTestDirectoryPerson({ firstName: "Ryan", email: "rjm7578@psu.edu" }), false);
  });
});
