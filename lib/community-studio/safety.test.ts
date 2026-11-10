import assert from "node:assert/strict";
import test from "node:test";
import { communityEnvironmentWriteError } from "./safety";

test("development and previews fail closed unless isolated infrastructure is explicitly selected", () => {
  assert.notEqual(communityEnvironmentWriteError({}), "");
  assert.notEqual(communityEnvironmentWriteError({ VERCEL_ENV: "preview" }), "");
  assert.notEqual(communityEnvironmentWriteError({ NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321" }), "");
  assert.equal(communityEnvironmentWriteError({ NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321", SITGURU_ISOLATED_BACKEND: "true" }), "");
});

test("an isolated flag cannot enable preview or local writes to the known production project", () => {
  const productionUrl = "https://mmtjhxnzuglbyumbsjhs.supabase.co";
  for (const VERCEL_ENV of [undefined, "development", "preview"]) {
    assert.match(communityEnvironmentWriteError({ VERCEL_ENV, NEXT_PUBLIC_SUPABASE_URL: productionUrl, SITGURU_ISOLATED_BACKEND: "true" }), /production database/);
  }
});
