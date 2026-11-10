import assert from "node:assert/strict";
import { test } from "node:test";
import { graphRequest, type MicrosoftGraphConfig } from "./graph";

const config: MicrosoftGraphConfig = {
  configured: true, tenantId: "fixture-tenant", clientId: "fixture-app",
  clientSecret: "synthetic-only", teamId: "", planId: "", siteId: "",
  driveId: "", internsRootId: "", readyBucketId: "", channelIds: {},
};

test("unconfigured Graph and application-only Teams posting never contact a network", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("Unexpected network request"); };
  try {
    assert.equal((await graphRequest({ method: "GET", path: "/planner/tasks", config: { ...config, configured: false } })).ok, false);
    const result = await graphRequest({ method: "POST", path: "/teams/fixture/channels/fixture/messages", config });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "not_configured");
  } finally { globalThis.fetch = original; }
});

test("Graph transport preserves Planner concurrency and classifies access failures with mocked responses", async () => {
  const original = globalThis.fetch;
  let status = 200;
  let graphCalls = 0;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url === "https://login.microsoftonline.com/fixture-tenant/oauth2/v2.0/token") {
      assert.equal(new URLSearchParams(String(init?.body)).get("grant_type"), "client_credentials");
      return Response.json({ access_token: "synthetic-token" });
    }
    assert.equal(url, "https://graph.microsoft.com/v1.0/planner/tasks/fixture-task");
    assert.equal(new Headers(init?.headers).get("If-Match"), '"fixture-version"');
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer synthetic-token");
    graphCalls++;
    return Response.json({ id: "fixture-task" }, { status, headers: { etag: '"new-version"' } });
  };
  try {
    for (const [responseStatus, expected] of [[200, "success"], [409, "conflict"], [412, "conflict"], [403, "needs_access"], [404, "needs_access"], [500, "error"]] as const) {
      status = responseStatus;
      const result = await graphRequest<{ id: string }>({ method: "PATCH", path: "/planner/tasks/fixture-task", body: { title: "Synthetic assignment" }, etag: '"fixture-version"', config });
      assert.equal(result.ok ? "success" : result.code, expected);
      assert.equal(result.etag, '"new-version"');
    }
    assert.equal(graphCalls, 6);
  } finally { globalThis.fetch = original; }
});
