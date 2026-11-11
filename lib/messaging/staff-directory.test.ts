import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AVA_STAFF_EMAIL,
  AVA_STAFF_USER_ID,
  DANETTE_STAFF_EMAIL,
  DANETTE_STAFF_USER_ID,
  JASON_STAFF_EMAIL,
  JASON_STAFF_USER_ID,
  KNOWN_STAFF_CHAT_SEATS,
  staffAvatarFallback,
} from "./staff-avatars";
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

  it("keeps Jason, Danette, and Ava as known Staff chat seats with avatars", () => {
    assert.equal(KNOWN_STAFF_CHAT_SEATS.some((seat) => seat.id === JASON_STAFF_USER_ID), true);
    assert.equal(KNOWN_STAFF_CHAT_SEATS.some((seat) => seat.id === DANETTE_STAFF_USER_ID), true);
    assert.equal(KNOWN_STAFF_CHAT_SEATS.some((seat) => seat.id === AVA_STAFF_USER_ID), true);
    assert.equal(staffAvatarFallback({ email: AVA_STAFF_EMAIL }), "/images/staff/ava-venezia.svg");
    assert.equal(staffAvatarFallback({ userId: AVA_STAFF_USER_ID }), "/images/staff/ava-venezia.svg");
    assert.equal(staffAvatarFallback({ email: JASON_STAFF_EMAIL }), "/images/sitguru-admin-avatar.jpg");
    assert.equal(staffAvatarFallback({ userId: DANETTE_STAFF_USER_ID }), "/images/sitguru-admin-avatar.jpg");
    assert.equal(staffAvatarFallback({ email: DANETTE_STAFF_EMAIL }), "/images/sitguru-admin-avatar.jpg");
  });
});
