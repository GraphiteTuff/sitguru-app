import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { previewEnvironmentError, deploymentEnvironmentError } from "./preview-policy.mjs";
const safe = {
  VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "feature/sitguru3-manager-community",
  SITGURU_ENABLE_SAFE_PREVIEW: "true", SITGURU_ISOLATED_BACKEND: "true",
  SITGURU_PREVIEW_SUPABASE_REF: "abcdefghijklmnopqrst",
  NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "isolated-test-key", SUPABASE_SERVICE_ROLE_KEY: "isolated-test-key",
};
test("isolated branch preview can build only after explicit opt-in", () => {
  assert.equal(previewEnvironmentError(safe), null);
  for (const key of ["SITGURU_ENABLE_SAFE_PREVIEW", "SITGURU_ISOLATED_BACKEND", "SUPABASE_SERVICE_ROLE_KEY"]) assert.ok(previewEnvironmentError({ ...safe, [key]: "" }));
});
test("production, other branches, and production backend remain blocked", () => {
  assert.ok(previewEnvironmentError({ ...safe, VERCEL_ENV: "production" }));
  assert.ok(previewEnvironmentError({ ...safe, VERCEL_GIT_COMMIT_REF: "sitguru-main" }));
  assert.ok(previewEnvironmentError({ ...safe, SITGURU_PREVIEW_SUPABASE_REF: "mmtjhxnzuglbyumbsjhs", NEXT_PUBLIC_SUPABASE_URL: "https://mmtjhxnzuglbyumbsjhs.supabase.co" }));
  assert.ok(previewEnvironmentError({ ...safe, NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co.attacker.example" }));
});
test("outbound service credentials fail closed without printing secrets", () => {
  for (const name of ["RESEND_API_KEY", "TWILIO_AUTH_TOKEN", "MICROSOFT_CLIENT_SECRET", "AZURE_CLIENT_SECRET", "STRIPE_SECRET_KEY", "PLAID_SECRET", "SITGURU_TEAMS_WORKFLOW_WEBHOOK_URL", "DATABASE_URL", "CRON_SECRET", "SUPABASE_ACCESS_TOKEN", "QUICKBOOKS_CLIENT_SECRET", "WAVE_CLIENT_SECRET", "ACCOUNTING_TOKEN_ENCRYPTION_KEY", "GOOGLE_PLACES_KEY", "NEXT_PUBLIC_GOOGLE_MAPS_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"]) {
    const error = previewEnvironmentError({ ...safe, [name]: "secret-value" });
    assert.ok(error);
    assert.equal(error.includes("secret-value"), false);
  }
});
test('root deployment rule preserves production and gates the exact feature branch', () => {
  assert.equal(deploymentEnvironmentError({VERCEL_ENV:'production',VERCEL_GIT_COMMIT_REF:'sitguru-main',RESEND_API_KEY:'existing-production-secret'}),null);
  assert.equal(deploymentEnvironmentError(safe),null);
  assert.ok(deploymentEnvironmentError({...safe,RESEND_API_KEY:'live-secret'}));
  assert.ok(deploymentEnvironmentError({...safe,SITGURU_ENABLE_SAFE_PREVIEW:''}));
  assert.ok(deploymentEnvironmentError({...safe,VERCEL_ENV:'production'}));
  assert.ok(deploymentEnvironmentError({...safe,VERCEL_GIT_COMMIT_REF:'unapproved-branch'}));
  assert.ok(deploymentEnvironmentError({VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'sitguru-main'}));
});
test('Vercel command exit codes skip unsafe previews and reject forced builds', () => {
  for (const [env, ignore, build] of [
    [{VERCEL_ENV:'production',VERCEL_GIT_COMMIT_REF:'sitguru-main'},1,0],
    [safe,1,0],
    [{...safe,RESEND_API_KEY:'synthetic-live-key'},0,1],
    [{...safe,SUPABASE_SERVICE_ROLE_KEY:''},0,1],
  ]) {
    assert.equal(spawnSync(process.execPath,['scripts/vercel-deployment-ignore.mjs'],{env,encoding:'utf8'}).status,ignore);
    assert.equal(spawnSync(process.execPath,['scripts/verify-deployment-environment.mjs'],{env,encoding:'utf8'}).status,build);
  }
});
test('a production backend hidden in an alternate environment URL is rejected',()=>{
  assert.ok(previewEnvironmentError({...safe,NEXT_PUBLIC_SUPABASE_PROJECT_URL:'https://mmtjhxnzuglbyumbsjhs.supabase.co'}));
});
