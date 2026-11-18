import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { connectXCode, getXConfig, makeXAuthorizationUrl, makeXVerifier } from "./social-analytics";

const TEST_ENV: Record<string, string> = {
  X_SOCIAL_SYNC_ENABLED: "true",
  X_OAUTH_MODE: "staging",
  SITGURU_ISOLATED_STAGING: "true",
  X_OAUTH_CLIENT_ID: "test-client-id",
  X_OAUTH_CLIENT_SECRET: "test-client-secret",
  X_OAUTH_CALLBACK_URL: "https://sitguru-tiktok-staging-jason-graffs-projects.vercel.app/api/integrations/x/callback",
  X_TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
};

async function withTestConfig(run: () => Promise<void> | void, updates: Record<string, string | undefined> = {}) {
  const keys = [...new Set([...Object.keys(TEST_ENV), ...Object.keys(updates)])];
  const prior = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) {
    const value = Object.prototype.hasOwnProperty.call(updates, key) ? updates[key] : TEST_ENV[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    await run();
  } finally {
    for (const key of keys) {
      if (prior[key] === undefined) delete process.env[key];
      else process.env[key] = prior[key];
    }
  }
}

test("X OAuth URL requests minimal scopes with random S256 PKCE challenge", async () => {
  await withTestConfig(() => {
    const verifier = makeXVerifier();
    assert.match(verifier, /^[A-Za-z0-9_-]{43,128}$/);
    const config = getXConfig();
    const url = new URL(makeXAuthorizationUrl(config, "test-random-state", verifier));
    assert.equal(url.origin, "https://x.com");
    assert.equal(url.pathname, "/i/oauth2/authorize");
    assert.equal(url.searchParams.get("response_type"), "code");
    assert.equal(url.searchParams.get("client_id"), TEST_ENV.X_OAUTH_CLIENT_ID);
    assert.equal(url.searchParams.get("redirect_uri"), config.redirectUri);
    assert.equal(url.searchParams.get("scope"), "tweet.read tweet.write users.read offline.access");
    assert.equal(url.searchParams.get("state"), "test-random-state");
    assert.equal(url.searchParams.get("code_challenge_method"), "s256");
    assert.equal(url.searchParams.get("code_challenge"), createHash("sha256").update(verifier).digest("base64url"));
    assert.ok(!url.toString().includes("test-client-secret"));
    assert.ok(!url.toString().includes(verifier));
  });
});

test("X requires an explicit enabled flag, isolated staging, and official production origin", async () => {
  await withTestConfig(() => {
    assert.throws(() => getXConfig(), /disabled/);
  }, { X_SOCIAL_SYNC_ENABLED: undefined });
  await withTestConfig(() => {
    assert.throws(() => getXConfig(), /isolated staging environment/);
  }, { SITGURU_ISOLATED_STAGING: "false" });
  await withTestConfig(() => {
    assert.throws(() => getXConfig(), /cannot use the live SitGuru callback/);
  }, { X_OAUTH_CALLBACK_URL: "https://www.sitguru.com/api/integrations/x/callback" });
  await withTestConfig(() => {
    assert.throws(() => getXConfig(), /official SitGuru callback/);
  }, {
    X_OAUTH_MODE: "production",
    X_OAUTH_CALLBACK_URL: "https://sitguru-tiktok-staging-jason-graffs-projects.vercel.app/api/integrations/x/callback",
  });
});

test("X token request contains client_id and does not trust unapproved scopes", async () => {
  await withTestConfig(async () => {
    const previous = global.fetch;
    let hits = 0;
    global.fetch = (async (_input, init) => {
      hits += 1;
      const form = init?.body as URLSearchParams;
      assert.equal(form.get("client_id"), TEST_ENV.X_OAUTH_CLIENT_ID);
      assert.equal(form.get("grant_type"), "authorization_code");
      assert.equal(form.get("code"), "fake-code");
      assert.equal(form.get("code_verifier"), "fake-verifier");
      assert.ok(String(new Headers(init?.headers).get("authorization")).startsWith("Basic "));
      return new Response(JSON.stringify({
        access_token: "test-access",
        refresh_token: "test-refresh",
        expires_in: 7200,
        scope: "tweet.read,users.read,offline.access",
      }), { status: 200 });
    }) as typeof fetch;
    try {
      await assert.rejects(connectXCode("fake-code", "fake-verifier"), /required account permissions/);
      assert.equal(hits, 1); // Reject before profile lookup / DB write.
    } finally {
      global.fetch = previous;
    }
  });
});

test("X refuses authorization of an account other than @SitGuruOfficial", async () => {
  await withTestConfig(async () => {
    const previous = global.fetch;
    let hits = 0;
    global.fetch = (async (input) => {
      hits += 1;
      if (String(input).includes("/oauth2/token")) {
        return new Response(JSON.stringify({
          access_token: "test-access",
          refresh_token: "test-refresh",
          expires_in: 7200,
          scope: "tweet.read,tweet.write,users.read,offline.access",
        }), { status: 200 });
      }
      return new Response(JSON.stringify({
        data: { id: "999", username: "another_account", public_metrics: { followers_count: 20, tweet_count: 3 } },
      }), { status: 200 });
    }) as typeof fetch;
    try {
      await assert.rejects(connectXCode("fake-code", "fake-verifier"), /Only the official @SitGuruOfficial account/);
      assert.equal(hits, 2); // Reject before DB write.
    } finally {
      global.fetch = previous;
    }
  });
});

test("X refuses malformed follower counts even for the official username", async () => {
  await withTestConfig(async () => {
    const previous = global.fetch;
    global.fetch = (async (input) => {
      if (String(input).includes("/oauth2/token")) {
        return new Response(JSON.stringify({
          access_token: "test-access",
          refresh_token: "test-refresh",
          expires_in: 7200,
          scope: "tweet.read tweet.write users.read offline.access",
        }), { status: 200 });
      }
      return new Response(JSON.stringify({
        data: { id: "42", username: "SitGuruOfficial", public_metrics: { followers_count: -1, tweet_count: 3 } },
      }), { status: 200 });
    }) as typeof fetch;
    try {
      await assert.rejects(connectXCode("fake-code", "fake-verifier"), /did not return verified followers/);
    } finally {
      global.fetch = previous;
    }
  });
});
