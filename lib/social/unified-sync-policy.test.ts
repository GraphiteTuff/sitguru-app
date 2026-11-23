import assert from "node:assert/strict";
import { test } from "node:test";
import { platformRefreshMode, recentlyRefreshed } from "./unified-sync-policy";

test("unified refresh includes configured Meta and production TikTok, but never billable X", () => {
  const ready = { metaEnabled: true, tiktokEnabled: true, tiktokProduction: true };
  assert.equal(platformRefreshMode("facebook", ready), "sync");
  assert.equal(platformRefreshMode("instagram", ready), "sync");
  assert.equal(platformRefreshMode("tiktok", ready), "sync");
  assert.equal(platformRefreshMode("x", ready), "manual-paid");
  assert.equal(platformRefreshMode("youtube", ready), "unavailable");
});

test("sandbox TikTok is not represented as verified production social followers", () => {
  const sandbox = { metaEnabled: true, tiktokEnabled: true, tiktokProduction: false };
  assert.equal(platformRefreshMode("tiktok", sandbox), "unavailable");
  assert.equal(platformRefreshMode("x", sandbox), "manual-paid");
  assert.equal(platformRefreshMode("facebook", { ...sandbox, metaEnabled: false }), "unavailable");
});

test("recently synced snapshots are not requested again during the cooldown", () => {
  const now = Date.parse("2026-11-23T12:00:00.000Z");
  assert.equal(recentlyRefreshed("2026-11-23T11:59:30.000Z", now), true);
  assert.equal(recentlyRefreshed("2026-11-23T11:57:00.000Z", now), false);
  assert.equal(recentlyRefreshed("2026-11-23T12:00:30.000Z", now), false);
  assert.equal(recentlyRefreshed(null, now), false);
  assert.equal(recentlyRefreshed("invalid", now), false);
});
