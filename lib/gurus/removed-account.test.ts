import assert from "node:assert/strict";
import test from "node:test";
import {
  isRemovedGuruAccount,
  isRemovedGuruProfileIdentifier,
} from "./removed-account";

const removedUserId = "b583515d-df26-4495-a559-223e664d2ea3";
const removedGuruId = "e691e4a4-60c9-49ce-9d68-ee82c630a0cc";

test("confirmed removed account ids are blocked, case insensitive", () => {
  assert.equal(isRemovedGuruProfileIdentifier(removedUserId.toUpperCase()), true);
  assert.equal(isRemovedGuruAccount({ id: removedGuruId }), true);
  assert.equal(isRemovedGuruAccount({ user_id: removedUserId }), true);
  assert.equal(isRemovedGuruAccount({ profile_id: removedUserId }), true);
  assert.equal(isRemovedGuruAccount({ guru_id: removedGuruId }), true);
  assert.equal(isRemovedGuruAccount({ source_id: removedUserId }), true);
});

test("deleted account search projections cannot survive by email or slug", () => {
  assert.equal(isRemovedGuruAccount({ email: "LA.KURTYCZ@GMAIL.COM" }), true);
  assert.equal(isRemovedGuruAccount({ public_slug: "laura-kurtycz-b583515d" }), true);
  assert.equal(isRemovedGuruProfileIdentifier("laura-kurtycz-b583515d"), true);
  assert.equal(isRemovedGuruProfileIdentifier("laura-kurtycz"), true);
});

test("orphaned public search row matches known name AND location", () => {
  assert.equal(isRemovedGuruAccount({
    full_name: "Laura Kurtycz",
    service_city: "Grand Rapids",
    service_state: "MI",
  }), true);
  assert.equal(isRemovedGuruAccount({
    display_name: "Laura Kurtycz",
    service_zip: "49505",
  }), true);
});

test("other Gurus and same-name people in other locations remain visible", () => {
  assert.equal(isRemovedGuruAccount({
    id: "fd2a8ce2-38a9-4777-8de9-9d10192be630",
    full_name: "Laura Kurtycz",
    service_city: "Allentown",
    service_state: "PA",
  }), false);
  assert.equal(isRemovedGuruAccount({ display_name: "Laura", service_city: "Grand Rapids", service_state: "MI" }), false);
  assert.equal(isRemovedGuruAccount({ user_id: "b583515d-aaaaaaaa-bbbb-cccc-ffffffffffff" }), false);
  assert.equal(isRemovedGuruAccount(null), false);
});
