/**
 * Official SitGuru X OAuth 2.0 integration (server-only).
 *
 * The authorization flow is founder-only and opt-in. Never put X secrets or
 * access tokens in browser props, logs, or NEXT_PUBLIC_* environment values.
 * We only accept an OAuth identity whose username is @SitGuruOfficial.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

const AUTHORIZATION_URL = "https://x.com/i/oauth2/authorize";
const TOKEN_URL = "https://api.x.com/2/oauth2/token";
const CURRENT_USER_URL = "https://api.x.com/2/users/me?user.fields=public_metrics";
const OFFICIAL_USERNAME = "sitguruofficial";
const SCOPES = ["tweet.read", "users.read", "offline.access"] as const;
export const OFFICIAL_X_ENTITY_ID = "brand_x_official";
const STAGING_X_ENTITY_ID = "brand_x_staging";

type XMode = "staging" | "production";
type XConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  mode: XMode;
  expectedUserId: string | null;
  encryptionKey: Buffer;
};
type TokenBundle = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  userId: string;
  scopes: string[];
};
type VerifiedUser = {
  id: string;
  username: string;
  followers: number;
  posts: number;
  capturedAt: string;
};

function required(value: string | undefined, label: string): string {
  if (!value?.trim()) throw new Error("X integration missing " + label + ".");
  return value.trim();
}

export function getXConfig(): XConfig {
  if (process.env.X_SOCIAL_SYNC_ENABLED !== "true") {
    throw new Error("X integration is disabled.");
  }
  const mode = process.env.X_OAUTH_MODE;
  if (mode !== "staging" && mode !== "production") {
    throw new Error("X_OAUTH_MODE must explicitly select staging or production.");
  }
  if (mode === "staging" && process.env.SITGURU_ISOLATED_STAGING !== "true") {
    throw new Error("X staging requires an isolated staging environment.");
  }
  const redirectUri = required(process.env.X_OAUTH_CALLBACK_URL, "X_OAUTH_CALLBACK_URL");
  const url = new URL(redirectUri);
  if (url.protocol !== "https:" || url.pathname !== "/api/integrations/x/callback" || url.search || url.hash || url.username || url.password) {
    throw new Error("Invalid X OAuth callback URL.");
  }
  if (mode === "staging" && (url.hostname === "sitguru.com" || url.hostname === "www.sitguru.com")) {
    throw new Error("X staging cannot use the live SitGuru callback.");
  }
  if (mode === "production" && url.origin !== "https://www.sitguru.com") {
    throw new Error("X production must use the official SitGuru callback.");
  }
  const rawKey = Buffer.from(required(process.env.X_TOKEN_ENCRYPTION_KEY, "X_TOKEN_ENCRYPTION_KEY"), "base64");
  if (rawKey.length !== 32) throw new Error("X encryption key must be 32 random bytes in base64.");
  return {
    clientId: required(process.env.X_OAUTH_CLIENT_ID, "X_OAUTH_CLIENT_ID"),
    clientSecret: required(process.env.X_OAUTH_CLIENT_SECRET, "X_OAUTH_CLIENT_SECRET"),
    redirectUri,
    mode,
    expectedUserId: process.env.X_EXPECTED_USER_ID?.trim() || null,
    encryptionKey: rawKey,
  };
}

export function makeXAuthorizationUrl(config: Pick<XConfig, "clientId" | "redirectUri">, state: string, verifier: string): string {
  const url = new URL(AUTHORIZATION_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", SCOPES.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", createHash("sha256").update(verifier).digest("base64url"));
  // RFC 7636 and X OAuth documentation specify uppercase S256.
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export function makeXVerifier(): string {
  return randomBytes(32).toString("base64url");
}

function seal(data: TokenBundle, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const value = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), value.toString("base64url")].join(".");
}

function unseal(value: string, key: Buffer): TokenBundle {
  const parts = value.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") throw new Error("Invalid X credential envelope.");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(parts[1], "base64url"));
  decipher.setAuthTag(Buffer.from(parts[2], "base64url"));
  const json = Buffer.concat([decipher.update(Buffer.from(parts[3], "base64url")), decipher.final()]).toString("utf8");
  const data = JSON.parse(json) as TokenBundle;
  if (!data?.accessToken || !data.refreshToken || !data.userId || !Array.isArray(data.scopes)) {
    throw new Error("Stored X authorization is invalid.");
  }
  return data;
}

function integer(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error("X API did not return verified " + name + ".");
  }
  return value;
}

async function requestTokens(form: URLSearchParams, config: XConfig, userId: string | null, existingScopes: readonly string[] = []): Promise<TokenBundle> {
  // X requires client_id in the form even when authenticating the confidential app via HTTP Basic.
  form.set("client_id", config.clientId);
  const basic = Buffer.from(config.clientId + ":" + config.clientSecret).toString("base64");
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { Authorization: "Basic " + basic, "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  // Error bodies can contain provider credentials; do not log or return them.
  if (!response.ok) throw new Error("X token exchange failed with HTTP " + response.status + ".");
  const data = (await response.json()) as Record<string, unknown>;
  if (typeof data.access_token !== "string" || typeof data.refresh_token !== "string" ||
      typeof data.expires_in !== "number" || data.expires_in <= 0) {
    throw new Error("X did not return a refreshable user access token.");
  }
  // X token responses can describe scopes using commas or spaces; refresh responses
  // may omit the scope field, in which case retain previously verified scopes.
  const scopes = typeof data.scope === "string"
    ? data.scope.split(/[\s,]+/).filter(Boolean)
    : [...existingScopes];
  if (!SCOPES.every((scope) => scopes.includes(scope))) {
    throw new Error("X did not grant all required account permissions.");
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    userId: userId || "",
    scopes,
  };
}

async function getVerifiedXUser(accessToken: string, config: XConfig): Promise<VerifiedUser> {
  const response = await fetch(CURRENT_USER_URL, {
    headers: { Authorization: "Bearer " + accessToken },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("X account lookup failed with HTTP " + response.status + ".");
  const payload = (await response.json()) as {
    data?: { id?: unknown; username?: unknown; public_metrics?: { followers_count?: unknown; tweet_count?: unknown; post_count?: unknown } };
  };
  const user = payload.data;
  if (!user || typeof user.id !== "string" || typeof user.username !== "string") {
    throw new Error("X returned an invalid account identity.");
  }
  if (user.username.toLowerCase() !== OFFICIAL_USERNAME) {
    throw new Error("Only the official @SitGuruOfficial account can be connected.");
  }
  if (config.expectedUserId && user.id !== config.expectedUserId) {
    throw new Error("X identity differs from the pinned SitGuru account.");
  }
  return {
    id: user.id,
    username: user.username,
    followers: integer(user.public_metrics?.followers_count, "followers"),
    posts: integer(user.public_metrics?.tweet_count ?? user.public_metrics?.post_count, "post count"),
    capturedAt: new Date().toISOString(),
  };
}

async function saveTokens(bundle: TokenBundle, config: XConfig, user: VerifiedUser) {
  const { error } = await supabaseAdmin.from("growth_social_connections").upsert({
    platform: "x",
    status: "connected",
    account_label: "@SitGuruOfficial",
    token_ciphertext: seal(bundle, config.encryptionKey),
    token_expires_at: bundle.expiresAt,
    scopes: bundle.scopes,
    last_synced_at: user.capturedAt,
    error_message: null,
    metadata: { environment: config.mode, x_user_id: user.id, post_count: user.posts },
    updated_at: user.capturedAt,
  }, { onConflict: "platform" });
  if (error) throw new Error("Could not securely store X account authorization.");
}

async function saveMetrics(user: VerifiedUser, config: XConfig) {
  const entityId = config.mode === "production" ? OFFICIAL_X_ENTITY_ID : STAGING_X_ENTITY_ID;
  const { data: existing, error: readError } = await supabaseAdmin
    .from("social_platform_metrics")
    .select("baseline_followers")
    .eq("entity_id", entityId)
    .eq("platform", "x")
    .maybeSingle();
  if (readError) throw new Error("Could not load X follower baseline.");
  const baseline = existing ? integer(existing.baseline_followers, "baseline") : user.followers;
  const { error } = await supabaseAdmin.from("social_platform_metrics").upsert({
    entity_id: entityId,
    platform: "x",
    current_followers: user.followers,
    baseline_followers: baseline,
    updated_at: user.capturedAt,
  }, { onConflict: "entity_id,platform" });
  if (error) throw new Error("Could not save verified X follower count.");
}

export async function connectXCode(code: string, verifier: string) {
  const config = getXConfig();
  const form = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    code_verifier: verifier,
  });
  const bundle = await requestTokens(form, config, null);
  const user = await getVerifiedXUser(bundle.accessToken, config);
  bundle.userId = user.id;
  await saveMetrics(user, config);
  await saveTokens(bundle, config, user);
  return { account: "@SitGuruOfficial", followers: user.followers, mode: config.mode };
}

/** Deliberate/manual sync: no polling and no automatic X API spend. */
export async function syncAuthorizedX() {
  const config = getXConfig();
  const { data, error } = await supabaseAdmin
    .from("growth_social_connections")
    .select("token_ciphertext,metadata")
    .eq("platform", "x")
    .maybeSingle();
  if (error || !data?.token_ciphertext) throw new Error("X account has not been authorized.");
  const metadata = data.metadata as { environment?: unknown; x_user_id?: unknown } | null;
  if (metadata?.environment !== config.mode) throw new Error("X authorization environment mismatch.");
  const bundle = unseal(data.token_ciphertext, config.encryptionKey);
  if (bundle.userId !== metadata?.x_user_id) throw new Error("X account identity mismatch.");

  if (Date.parse(bundle.expiresAt) <= Date.now() + 5 * 60 * 1000) {
    const refreshed = await requestTokens(
      new URLSearchParams({ grant_type: "refresh_token", refresh_token: bundle.refreshToken }),
      config,
      bundle.userId,
      bundle.scopes,
    );
    // Persist rotated refresh token before using the new access token.
    const refreshedUser = await getVerifiedXUser(refreshed.accessToken, config);
    if (refreshedUser.id !== bundle.userId) throw new Error("X refresh returned a different account.");
    await saveTokens(refreshed, config, refreshedUser);
    await saveMetrics(refreshedUser, config);
    return refreshedUser;
  }
  const user = await getVerifiedXUser(bundle.accessToken, config);
  if (user.id !== bundle.userId) throw new Error("X returned a different authorized account.");
  await saveMetrics(user, config);
  await saveTokens(bundle, config, user);
  return user;
}
