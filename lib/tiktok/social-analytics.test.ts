import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TIKTOK_REDIRECT_URI,
  makeTikTokAuthorizationUrl,
  getTikTokConfig,
  fetchTikTokSnapshot,
  exchangeTikTokCode,
} from "./social-analytics";

test("TikTok authorization uses only approved minimal scopes and exact callback", () => {
  const url = new URL(makeTikTokAuthorizationUrl("test-client", "secure-nonce"));
  assert.equal(url.origin, "https://www.tiktok.com");
  assert.equal(url.pathname, "/v2/auth/authorize/");
  assert.equal(url.searchParams.get("client_key"), "test-client");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("scope"), "user.info.basic,user.info.stats");
  assert.equal(url.searchParams.get("state"), "secure-nonce");
  assert.equal(url.searchParams.get("redirect_uri"), TIKTOK_REDIRECT_URI);
});

test("TikTok integration is disabled without an explicit flag", () => {
  const previous = process.env.TIKTOK_SOCIAL_SYNC_ENABLED;
  delete process.env.TIKTOK_SOCIAL_SYNC_ENABLED;
  try {
    assert.throws(() => getTikTokConfig(), /not enabled/);
  } finally {
    if (previous === undefined) delete process.env.TIKTOK_SOCIAL_SYNC_ENABLED;
    else process.env.TIKTOK_SOCIAL_SYNC_ENABLED = previous;
  }
});

test("TikTok rejects statistics belonging to a different authorized account", async () => {
  const oldFetch = global.fetch;
  global.fetch = (async () =>
    new Response(
      JSON.stringify({
        data: {
          user: {
            open_id: "other-user",
            follower_count: 100,
            following_count: 5,
            likes_count: 10,
            video_count: 2,
          },
        },
        error: { code: "ok" },
      }),
      { status: 200 },
    )) as typeof fetch;
  try {
    await assert.rejects(
      fetchTikTokSnapshot({
        openId: "sitguru",
        accessToken: "test",
        refreshToken: "test",
        scopes: ["user.info.basic", "user.info.stats"],
        accessExpiresAt: new Date(Date.now() + 3600000).toISOString(),
        refreshExpiresAt: new Date(Date.now() + 86400000).toISOString(),
      }),
      /does not match the authorized account/,
    );
  } finally {
    global.fetch = oldFetch;
  }
});

test("TikTok refuses OAuth grants that omit statistics permission", async () => {
  const oldFetch = global.fetch;
  global.fetch = (async () =>
    new Response(
      JSON.stringify({
        access_token: "access",
        refresh_token: "refresh",
        open_id: "sitguru",
        expires_in: 7200,
        refresh_expires_in: 86400,
        scope: "user.info.basic",
      }),
      { status: 200 },
    )) as typeof fetch;
  try {
    await assert.rejects(
      exchangeTikTokCode("test-code", {
        clientKey: "test-key",
        clientSecret: "test-secret",
        encryptionKey: Buffer.alloc(32),
        environment: "sandbox",
        expectedOpenId: null,
      }),
      /required account statistics permissions/,
    );
  } finally {
    global.fetch = oldFetch;
  }
});