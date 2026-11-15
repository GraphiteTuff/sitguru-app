import test from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchOfficialMetaSnapshot,
  persistOfficialMetaSnapshot,
  OFFICIAL_META_ENTITY_ID,
  type OfficialMetaSnapshot,
} from "./social-analytics";

test("Facebook fetch uses Bearer header, checks ID and accepts verified followers", async () => {
  let requestUrl = "";
  let authorization = "";
  const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
    requestUrl = String(input);
    authorization = new Headers(init?.headers).get("authorization") || "";
    return new Response(
      JSON.stringify({
        id: "1115780798285628",
        name: "SitGuru",
        followers_count: 30,
      }),
      { status: 200 },
    );
  };
  const result = await fetchOfficialMetaSnapshot("facebook", {
    token: "private-test-token",
    fetcher: fetcher as typeof fetch,
  });
  assert.equal(result.followers, 30);
  assert.equal(result.accountLabel, "SitGuru");
  assert.equal(authorization, "Bearer private-test-token");
  assert.equal(requestUrl.includes("private-test-token"), false);
  assert.equal(requestUrl.includes("followers_count"), true);
});

test("Instagram fetch returns a verified one-follower, zero-post account", async () => {
  const fetcher = async () =>
    new Response(
      JSON.stringify({
        id: "17841475074314025",
        username: "sitgurupetcare",
        followers_count: 1,
        media_count: 0,
      }),
      { status: 200 },
    );
  const result = await fetchOfficialMetaSnapshot("instagram", {
    token: "test-credential",
    fetcher: fetcher as typeof fetch,
  });
  assert.equal(result.followers, 1);
  assert.equal(result.mediaCount, 0);
});

test("Instagram Login uses graph.instagram.com/me and validates the expected username", async () => {
  let requestedUrl = "";
  let authHeader = "";
  const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(input);
    authHeader = new Headers(init?.headers).get("authorization") || "";
    return new Response(JSON.stringify({
      id: "12345678901234567",
      username: "sitgurupetcare",
      followers_count: 1,
      media_count: 0,
    }));
  };
  const result = await fetchOfficialMetaSnapshot("instagram", {
    token: "instagram-login-secret",
    authMode: "instagram_login",
    fetcher: fetcher as typeof fetch,
  });
  assert.equal(new URL(requestedUrl).host, "graph.instagram.com");
  assert.equal(new URL(requestedUrl).pathname, "/v27.0/me");
  assert.equal(requestedUrl.includes("instagram-login-secret"), false);
  assert.equal(authHeader, "Bearer instagram-login-secret");
  assert.equal(result.accountId, "12345678901234567");
  assert.equal(result.followers, 1);

  const wrongUsername = async () => new Response(JSON.stringify({
    id: "12345678901234567",
    username: "someone_else",
    followers_count: 1,
    media_count: 0,
  }));
  await assert.rejects(
    fetchOfficialMetaSnapshot("instagram", {
      token: "test",
      authMode: "instagram_login",
      fetcher: wrongUsername as typeof fetch,
    }),
    /unexpected Instagram username/,
  );
});

test("Instagram 401 retries the pinned Facebook Graph asset with system-user token", async () => {
  const previousInstagram = process.env.META_INSTAGRAM_ACCESS_TOKEN;
  const previousSystem = process.env.META_SYSTEM_USER_ACCESS_TOKEN;
  const seen: Array<{ url: string; authorization: string }> = [];
  process.env.META_INSTAGRAM_ACCESS_TOKEN = "expired-ig-token";
  process.env.META_SYSTEM_USER_ACCESS_TOKEN = "authorized-system-token";
  try {
    const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const authorization = new Headers(init?.headers).get("authorization") || "";
      seen.push({ url, authorization });
      if (seen.length === 1) return new Response("unauthorized", { status: 401 });
      return new Response(JSON.stringify({
        id: "17841475074314025",
        username: "sitgurupetcare",
        followers_count: 1,
        media_count: 0,
      }));
    };
    const result = await fetchOfficialMetaSnapshot("instagram", {
      fetcher: fetcher as typeof fetch,
    });
    assert.equal(result.followers, 1);
    assert.equal(seen.length, 2);
    assert.equal(new URL(seen[0].url).host, "graph.instagram.com");
    assert.equal(new URL(seen[1].url).host, "graph.facebook.com");
    assert.equal(new URL(seen[1].url).pathname, "/v27.0/17841475074314025");
    assert.equal(seen[0].authorization, "Bearer expired-ig-token");
    assert.equal(seen[1].authorization, "Bearer authorized-system-token");
    assert.ok(seen.every((item) => !item.url.includes("token")));
  } finally {
    if (previousInstagram === undefined) delete process.env.META_INSTAGRAM_ACCESS_TOKEN;
    else process.env.META_INSTAGRAM_ACCESS_TOKEN = previousInstagram;
    if (previousSystem === undefined) delete process.env.META_SYSTEM_USER_ACCESS_TOKEN;
    else process.env.META_SYSTEM_USER_ACCESS_TOKEN = previousSystem;
  }
});

test("Rejects wrong account and malformed follower counts", async () => {
  const wrongAccount = async () =>
    new Response(
      JSON.stringify({
        id: "17841475074314025",
        username: "not_sitguru",
        followers_count: 1,
        media_count: 0,
      }),
    );
  await assert.rejects(
    fetchOfficialMetaSnapshot("instagram", {
      token: "test",
      fetcher: wrongAccount as typeof fetch,
    }),
    /unexpected Instagram username/,
  );

  const fakeCount = async () =>
    new Response(
      JSON.stringify({
        id: "1115780798285628",
        name: "SitGuru",
        followers_count: "980",
      }),
    );
  await assert.rejects(
    fetchOfficialMetaSnapshot("facebook", {
      token: "test",
      fetcher: fakeCount as typeof fetch,
    }),
    /invalid followers_count/,
  );
});

test("Meta HTTP errors do not echo credentials", async () => {
  const errorResponse = async () =>
    new Response(JSON.stringify({ error: { message: "test-secret" } }), {
      status: 403,
    });
  await assert.rejects(
    fetchOfficialMetaSnapshot("facebook", {
      token: "test-secret",
      fetcher: errorResponse as typeof fetch,
    }),
    (error: unknown) => {
      assert.equal(error instanceof Error, true);
      assert.match((error as Error).message, /HTTP 403/);
      assert.equal((error as Error).message.includes("test-secret"), false);
      return true;
    },
  );
});

function makeStore(previousBaseline: number | null) {
  const writes: Record<string, unknown>[] = [];
  const store = {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: previousBaseline == null ? null : { baseline_followers: previousBaseline },
              error: null,
            }),
          }),
        }),
      }),
      upsert: async (row: Record<string, unknown>) => {
        writes.push(row);
        return { error: null };
      },
    }),
  };
  return { admin: store as unknown as SupabaseClient, writes };
}

const snapshot: OfficialMetaSnapshot = {
  platform: "facebook",
  accountId: "1115780798285628",
  accountLabel: "SitGuru",
  followers: 30,
  mediaCount: null,
  capturedAt: "2026-11-15T06:00:00.000Z",
};

test("First official sync establishes a verified baseline", async () => {
  const { admin, writes } = makeStore(null);
  await persistOfficialMetaSnapshot(admin, snapshot);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].entity_id, OFFICIAL_META_ENTITY_ID);
  assert.equal(writes[0].current_followers, 30);
  assert.equal(writes[0].baseline_followers, 30);
});

test("Later sync preserves original growth baseline", async () => {
  const { admin, writes } = makeStore(12);
  await persistOfficialMetaSnapshot(admin, snapshot);
  assert.equal(writes[0].current_followers, 30);
  assert.equal(writes[0].baseline_followers, 12);
});
