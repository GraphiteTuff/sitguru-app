import assert from "node:assert/strict";
import test from "node:test";
import { GET, POST } from "./route";
import { GET as media } from "./media/[id]/route";

test("unconfigured community endpoints fail safely without contacting external infrastructure", async (t) => {
  const names = ["VERCEL_ENV", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY", "SITGURU_ISOLATED_BACKEND"];
  const previous = names.map((name) => process.env[name]);
  for (const name of names) delete process.env[name];
  t.after(() => names.forEach((name, index) => { if (previous[index] === undefined) delete process.env[name]; else process.env[name] = previous[index]; }));
  let outbound = 0;
  t.mock.method(globalThis, "fetch", async () => { outbound += 1; throw new Error("External I/O forbidden in this test"); });

  const publicFeed = await GET(new Request("http://localhost/api/community-studio?mode=public"));
  assert.equal(publicFeed.status, 200);
  assert.deepEqual(await publicFeed.json(), { items: [] });
  const workspace = await GET(new Request("http://localhost/api/community-studio?mode=manager"));
  assert.equal(workspace.status, 503);
  const submission = await POST(new Request("http://localhost/api/community-studio", { method: "POST", body: new FormData() }));
  assert.equal(submission.status, 503);
  assert.equal((await submission.json()).ok, false);
  const photo = await media(new Request("http://localhost/api/community-studio/media/unknown"), { params: Promise.resolve({ id: "unknown" }) });
  assert.equal(photo.status, 404);
  assert.equal(outbound, 0);
});
