import assert from "node:assert/strict";
import { test } from "node:test";
import { communityCalendarEvent } from "./calendar";

test("calendar downloads use UTC and escape multiline data without invitations", () => {
  const result = communityCalendarEvent({ id: "abc", title: "Milo, the star;\nGuest", publishAt: "2026-11-16T15:00:00Z", url: "https://example.test/manager/community-studio" }, new Date("2026-11-09T00:00:00Z"));
  assert.ok(result.includes("DTSTART:20261116T150000Z\r\n"));
  assert.ok(result.includes("DTEND:20261116T151500Z\r\n"));
  assert.ok(result.includes("Milo\\, the star\\;\\nGuest"));
  assert.ok(!result.includes("ATTENDEE"));
  assert.ok(!result.includes("METHOD:REQUEST"));
});

test("calendar rejects invalid dates and folds multibyte content safely", () => {
  assert.equal(communityCalendarEvent({ id: "abc", title: "Pet", publishAt: "bad", url: "https://example.test" }), "");
  const result = communityCalendarEvent({ id: "abc", title: "🐾".repeat(80), publishAt: "2026-11-16T15:00:00Z", url: "https://example.test" });
  assert.ok(result.split("\r\n").every(line => new TextEncoder().encode(line).length <= 75));
  assert.ok(!result.includes("�"));
});
