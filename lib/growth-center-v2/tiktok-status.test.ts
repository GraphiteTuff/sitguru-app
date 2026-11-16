import assert from "node:assert/strict";
import { test } from "node:test";
import { deriveTikTokSocialStatus } from "./tiktok-status";

const NOW = Date.parse("2026-11-16T04:00:00.000Z");
const sandbox = { entity_id: "brand_tiktok_sandbox", platform: "tiktok", current_followers: 3, updated_at: "2026-11-16T03:52:13Z" };
const official = { entity_id: "brand_tiktok_official", platform: "tiktok", current_followers: 450, baseline_followers: 420, updated_at: "2026-11-16T03:52:13Z" };

test("real sandbox snapshot is clearly labeled and excluded from verified production counts", () => {
  const status = deriveTikTokSocialStatus({
    connection: { status: "connected", metadata: { environment: "sandbox" } },
    sandboxMetric: sandbox,
    productionMetric: official,
    now: NOW,
  });
  assert.equal(status.status, "sandbox_connected");
  assert.equal(status.sandboxFollowers, 3);
  assert.equal(status.followers, null);
  assert.equal(status.baselineFollowers, null);
  assert.equal(status.lastSyncedAt, null);
  assert.equal(status.accountLabel, "@sitguruofficial");
});

test("production approval selects only official production metrics", () => {
  const status = deriveTikTokSocialStatus({
    connection: { status: "connected", metadata: { environment: "production" } },
    productionMetric: official,
    sandboxMetric: { ...sandbox, current_followers: 999 },
    now: NOW,
  });
  assert.equal(status.status, "connected");
  assert.equal(status.followers, 450);
  assert.equal(status.baselineFollowers, 420);
  assert.equal(status.sandboxFollowers, null);
});

test("stale or missing sandbox data may not be labeled current", () => {
  const old = { ...sandbox, updated_at: "2026-11-13T00:00:00Z" };
  const status = deriveTikTokSocialStatus({
    connection: { status: "connected", metadata: { environment: "sandbox" } },
    sandboxMetric: old,
    now: NOW,
  });
  assert.equal(status.status, "error");
  assert.equal(status.sandboxFollowers, null);
});

test("missing authorization cannot display old official or sandbox metrics", () => {
  const status = deriveTikTokSocialStatus({
    productionMetric: official,
    sandboxMetric: sandbox,
    now: NOW,
  });
  assert.equal(status.status, "not_configured");
  assert.equal(status.followers, null);
  assert.equal(status.sandboxFollowers, null);
});

test("invalid or missing follower count is never fabricated as zero", () => {
  const status = deriveTikTokSocialStatus({
    connection: { status: "connected", metadata: { environment: "sandbox" } },
    sandboxMetric: { ...sandbox, current_followers: null },
    now: NOW,
  });
  assert.equal(status.status, "error");
  assert.equal(status.sandboxFollowers, null);
});