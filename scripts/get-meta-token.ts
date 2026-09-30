/**
 * Exchange a short-lived Meta User token (Graph API Explorer) for a
 * long-lived User token, then print permanent Page access tokens for
 * linked SitGuru pages — without using Meta Business Suite System Users.
 *
 * Usage (from repo root):
 *   META_USER_TOKEN="EAAB..." META_APP_SECRET="..." \
 *     npx tsx scripts/get-meta-token.ts
 *
 * Or with .env.local:
 *   npx tsx --env-file=.env.local scripts/get-meta-token.ts
 *
 * Env / CLI:
 *   META_USER_TOKEN   Short-lived User access token from Graph API Explorer
 *   META_APP_ID       Meta App ID (default: SitGuru 2034451593479426)
 *   META_APP_SECRET   Meta App Secret (App Dashboard → Settings → Basic)
 *   META_GRAPH_VERSION Optional Graph API version (default: v22.0)
 *
 * Optional positional args:
 *   npx tsx scripts/get-meta-token.ts <USER_TOKEN> [APP_SECRET] [APP_ID]
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_APP_ID = "2034451593479426";
const DEFAULT_GRAPH_VERSION = "v22.0";

type TokenExchangeResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: { message?: string; type?: string; code?: number };
};

type PageAccount = {
  id?: string;
  name?: string;
  access_token?: string;
  category?: string;
  tasks?: string[];
};

type AccountsResponse = {
  data?: PageAccount[];
  error?: { message?: string; type?: string; code?: number };
};

type DebugTokenResponse = {
  data?: {
    app_id?: string;
    type?: string;
    is_valid?: boolean;
    expires_at?: number;
    data_access_expires_at?: number;
    scopes?: string[];
    profile_id?: string;
    user_id?: string;
  };
  error?: { message?: string };
};

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const raw = readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function bootstrapEnv() {
  const cwd = process.cwd();
  loadEnvFile(resolve(cwd, ".env.local"));
  loadEnvFile(resolve(cwd, ".env"));
}

function requireValue(name: string, value: string | undefined) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    throw new Error(
      `Missing ${name}.\n` +
        `Example:\n` +
        `  META_USER_TOKEN="EAAB..." META_APP_SECRET="..." npx tsx scripts/get-meta-token.ts`,
    );
  }
  return trimmed;
}

function graphBase(version: string) {
  return `https://graph.facebook.com/${version}`;
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const body = (await response.json().catch(() => ({}))) as T;
  if (!response.ok) {
    const err = body as { error?: { message?: string } };
    throw new Error(
      err?.error?.message ||
        `Meta Graph request failed (${response.status}) for ${url.split("?")[0]}`,
    );
  }
  return body;
}

function formatExpiry(expiresInSeconds?: number) {
  if (!expiresInSeconds || expiresInSeconds <= 0) {
    return "unknown / possibly non-expiring";
  }
  const days = Math.round(expiresInSeconds / 86400);
  return `${expiresInSeconds}s (~${days} day${days === 1 ? "" : "s"})`;
}

function formatUnixExpiry(unixSeconds?: number) {
  if (!unixSeconds || unixSeconds <= 0) return "does not expire (0 / never)";
  return new Date(unixSeconds * 1000).toISOString();
}

async function main() {
  bootstrapEnv();

  const [, , argToken, argSecret, argAppId] = process.argv;

  const userToken = requireValue(
    "META_USER_TOKEN",
    argToken || process.env.META_USER_TOKEN || process.env.META_SHORT_LIVED_TOKEN,
  );
  const appSecret = requireValue(
    "META_APP_SECRET",
    argSecret || process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET,
  );
  const appId = String(
    argAppId ||
      process.env.META_APP_ID ||
      process.env.FACEBOOK_APP_ID ||
      DEFAULT_APP_ID,
  ).trim();
  const version = String(
    process.env.META_GRAPH_VERSION || DEFAULT_GRAPH_VERSION,
  ).trim();

  console.log("SitGuru Meta token exchange");
  console.log(`  App ID: ${appId}`);
  console.log(`  Graph:  ${version}`);
  console.log("");

  // 1) Short-lived User token → long-lived User token (~60 days)
  const exchangeUrl =
    `${graphBase(version)}/oauth/access_token` +
    `?grant_type=fb_exchange_token` +
    `&client_id=${encodeURIComponent(appId)}` +
    `&client_secret=${encodeURIComponent(appSecret)}` +
    `&fb_exchange_token=${encodeURIComponent(userToken)}`;

  console.log("1) Extending short-lived User token → long-lived User token…");
  const exchanged = await getJson<TokenExchangeResponse>(exchangeUrl);
  if (exchanged.error?.message) {
    throw new Error(exchanged.error.message);
  }
  const longLivedUserToken = String(exchanged.access_token || "").trim();
  if (!longLivedUserToken) {
    throw new Error("Meta did not return a long-lived access_token.");
  }

  console.log("   ✓ Long-lived User token received");
  console.log(`   expires_in: ${formatExpiry(exchanged.expires_in)}`);
  console.log("");

  // Optional debug (appsecret_proof not required for this debug endpoint shape)
  try {
    const debugUrl =
      `${graphBase(version)}/debug_token` +
      `?input_token=${encodeURIComponent(longLivedUserToken)}` +
      `&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`;
    const debug = await getJson<DebugTokenResponse>(debugUrl);
    if (debug.data) {
      console.log("   Token debug:");
      console.log(`     type: ${debug.data.type || "n/a"}`);
      console.log(`     is_valid: ${String(debug.data.is_valid)}`);
      console.log(`     expires_at: ${formatUnixExpiry(debug.data.expires_at)}`);
      console.log(
        `     scopes: ${(debug.data.scopes || []).join(", ") || "(none listed)"}`,
      );
      console.log("");
    }
  } catch (error) {
    console.warn(
      `   (debug_token skipped: ${error instanceof Error ? error.message : "unknown"})`,
    );
    console.log("");
  }

  // 2) List Pages / linked accounts — Page tokens from a long-lived User token
  //    are effectively permanent (do not expire with the User token).
  console.log("2) Fetching linked Page accounts (me/accounts)…");
  const accountsUrl =
    `${graphBase(version)}/me/accounts` +
    `?fields=${encodeURIComponent("id,name,access_token,category,tasks")}` +
    `&limit=100` +
    `&access_token=${encodeURIComponent(longLivedUserToken)}`;

  const accounts = await getJson<AccountsResponse>(accountsUrl);
  if (accounts.error?.message) {
    throw new Error(accounts.error.message);
  }

  const pages = Array.isArray(accounts.data) ? accounts.data : [];
  if (!pages.length) {
    throw new Error(
      "No Pages returned from /me/accounts. Confirm the Explorer token user " +
        "is an admin of the SitGuru Facebook Page and requested pages_show_list " +
        "+ pages_read_engagement (and pages_manage_metadata if needed).",
    );
  }

  console.log(`   ✓ Found ${pages.length} linked Page(s)\n`);
  console.log("=".repeat(72));
  console.log("PERMANENT PAGE ACCESS TOKEN(S) — paste into Vercel as META_ACCESS_TOKEN");
  console.log("=".repeat(72));

  for (const page of pages) {
    const name = page.name || "(unnamed page)";
    const id = page.id || "(no id)";
    const token = String(page.access_token || "").trim();
    console.log("");
    console.log(`Page: ${name}`);
    console.log(`  id:       ${id}`);
    console.log(`  category: ${page.category || "n/a"}`);
    console.log(`  tasks:    ${(page.tasks || []).join(", ") || "n/a"}`);
    if (!token) {
      console.log("  token:    (missing — check Page role / permissions)");
      continue;
    }
    console.log(`  token:    ${token}`);
  }

  console.log("");
  console.log("=".repeat(72));
  console.log("Also keep the long-lived USER token if you need /me calls:");
  console.log(longLivedUserToken);
  console.log("=".repeat(72));
  console.log("");
  console.log("Vercel tip:");
  console.log("  Set META_ACCESS_TOKEN to the SitGuru Page token above, then redeploy.");
  console.log("  Page tokens obtained this way do not expire with the User token.");
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "get-meta-token failed",
  );
  process.exit(1);
});
