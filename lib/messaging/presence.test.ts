import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PRESENCE_OFFLINE_MS, presenceRowIsOnline } from "./presence";

describe("presenceRowIsOnline", () => {
  it("marks a fresh heartbeat online and a stale one offline", () => {
    const now = Date.parse("2026-11-08T20:00:00.000Z");
    assert.equal(
      presenceRowIsOnline(
        { last_seen_at: new Date(now - 30_000).toISOString(), is_online: true },
        now,
      ),
      true,
    );
    assert.equal(
      presenceRowIsOnline(
        { last_seen_at: new Date(now - PRESENCE_OFFLINE_MS - 1).toISOString(), is_online: true },
        now,
      ),
      false,
    );
    assert.equal(
      presenceRowIsOnline(
        { last_seen_at: new Date(now).toISOString(), is_online: false },
        now,
      ),
      false,
    );
  });
});
