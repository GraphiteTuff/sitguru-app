/**
 * SitGuru's official TikTok account integration. Server-only.
 *
 * Sandbox snapshots remain separate from production follower KPIs.
 * Tokens are AES-256-GCM encrypted before storage in the existing
 * service-role-only growth_social_connections table.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const TIKTOK_REDIRECT_URI =
  "https://www.sitguru.com/api/integrations/tiktok/callback";
export const OFFICIAL_TIKTOK_ENTITY_ID = "brand_tiktok_official";
export const TIKTOK_SANDBOX_ENTITY_ID = "brand_tiktok_sandbox";
const TIKTOK_ACCOUNT_LABEL = "@sitguruofficial";
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const USER_INFO_URL = "https://open.tiktokapis.com/v2/user/info/";
const REQUIRED_SCOPES = ["user.info.basic", "user.info.stats"] as const;
const TIKTOK_UPLOAD_SCOPE = "video.upload";

type Environment = "sandbox" | "production";
type TikTokConfig = {
  clientKey: string;
  clientSecret: string;
  encryptionKey: Buffer;
  environment: Environment;
  expectedOpenId: string | null;
};
type TokenBundle = {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: string;
  refreshExpiresAt: string;
  openId: string;
  scopes: string[];
};
export type TikTokSnapshot = {
  openId: string;
  followers: number;
  following: number;
  likes: number;
  videos: number;
  capturedAt: string;
};

function required(value: string | undefined, name: string): string {
  if (!value?.trim()) throw new Error("TikTok integration missing " + name + ".");
  return value.trim();
}

/**
 * Explicit opt-in. Sandbox uses only TikTok's registered target users.
 * Production requires a separately confirmed account open_id.
 */
export function getTikTokConfig(): TikTokConfig {
  if (process.env.TIKTOK_SOCIAL_SYNC_ENABLED !== "true") {
    throw new Error("TikTok integration is not enabled.");
  }
  const environment = process.env.TIKTOK_OAUTH_MODE;
  if (environment !== "sandbox" && environment !== "production") {
    throw new Error("TikTok OAuth mode must be sandbox or production.");
  }
  const expectedOpenId = process.env.TIKTOK_EXPECTED_OPEN_ID?.trim() || null;
  if (environment === "production" && !expectedOpenId) {
    throw new Error("TikTok production account identity must be pinned before activation.");
  }
  const rawKey = required(
    process.env.TIKTOK_TOKEN_ENCRYPTION_KEY,
    "TIKTOK_TOKEN_ENCRYPTION_KEY",
  );
  const encryptionKey = Buffer.from(rawKey, "base64");
  if (encryptionKey.length !== 32) {
    throw new Error("TikTok encryption key must contain 32 random bytes in base64.");
  }
  return {
    environment,
    expectedOpenId,
    encryptionKey,
    clientKey: required(process.env.TIKTOK_CLIENT_KEY, "TIKTOK_CLIENT_KEY"),
    clientSecret: required(process.env.TIKTOK_CLIENT_SECRET, "TIKTOK_CLIENT_SECRET"),
  };
}

export function makeTikTokAuthorizationUrl(clientKey: string, state: string, includeUpload = false): string {
  const url = new URL("https://www.tiktok.com/v2/auth/authorize/");
  url.searchParams.set("client_key", clientKey);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", [...REQUIRED_SCOPES, ...(includeUpload ? [TIKTOK_UPLOAD_SCOPE] : [])].join(","));
  url.searchParams.set("redirect_uri", TIKTOK_REDIRECT_URI);
  url.searchParams.set("state", state);
  return url.toString();
}

function seal(bundle: TokenBundle, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(bundle), "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

function unseal(encrypted: string, key: Buffer): TokenBundle {
  const parts = encrypted.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Invalid TikTok credential envelope.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(parts[1], "base64url"),
  );
  decipher.setAuthTag(Buffer.from(parts[2], "base64url"));
  const json = Buffer.concat([
    decipher.update(Buffer.from(parts[3], "base64url")),
    decipher.final(),
  ]).toString("utf8");
  const bundle = JSON.parse(json) as TokenBundle;
  if (
    !bundle ||
    !bundle.accessToken ||
    !bundle.refreshToken ||
    !bundle.openId ||
    !Array.isArray(bundle.scopes)
  ) {
    throw new Error("Invalid stored TikTok tokens.");
  }
  return bundle;
}

function positiveSeconds(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error("TikTok returned invalid " + field + ".");
  }
  return value;
}

async function tokenRequest(form: URLSearchParams): Promise<TokenBundle> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-store",
    },
    body: form,
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  // Never log response bodies: provider errors can contain sensitive details.
  if (!response.ok) {
    throw new Error("TikTok token API returned HTTP " + response.status + ".");
  }
  const row = (await response.json()) as Record<string, unknown>;
  if (
    typeof row.access_token !== "string" ||
    typeof row.refresh_token !== "string" ||
    typeof row.open_id !== "string" ||
    typeof row.scope !== "string"
  ) {
    throw new Error("TikTok token API returned an invalid credential response.");
  }
  const scopes = row.scope.split(",").map((s) => s.trim()).filter(Boolean);
  if (!REQUIRED_SCOPES.every((scope) => scopes.includes(scope))) {
    throw new Error("TikTok did not grant the required account statistics permissions.");
  }
  const now = Date.now();
  return {
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    openId: row.open_id,
    scopes,
    accessExpiresAt: new Date(now + positiveSeconds(row.expires_in, "expires_in") * 1000).toISOString(),
    refreshExpiresAt: new Date(now + positiveSeconds(row.refresh_expires_in, "refresh_expires_in") * 1000).toISOString(),
  };
}

export async function exchangeTikTokCode(code: string, config: TikTokConfig) {
  const form = new URLSearchParams({
    client_key: config.clientKey,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: TIKTOK_REDIRECT_URI,
  });
  const bundle = await tokenRequest(form);
  if (config.expectedOpenId && bundle.openId !== config.expectedOpenId) {
    throw new Error("TikTok authorized an account other than the approved SitGuru account.");
  }
  return bundle;
}

async function refreshTikTokTokens(bundle: TokenBundle, config: TikTokConfig) {
  if (Date.parse(bundle.refreshExpiresAt) <= Date.now()) {
    throw new Error("TikTok authorization has expired; reconnect the official account.");
  }
  const refreshed = await tokenRequest(
    new URLSearchParams({
      client_key: config.clientKey,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
      refresh_token: bundle.refreshToken,
    }),
  );
  if (refreshed.openId !== bundle.openId) {
    throw new Error("TikTok refresh returned a different account identity.");
  }
  return refreshed;
}

function nonnegativeCount(value: unknown, name: string): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > 2147483647
  ) {
    throw new Error("TikTok API returned invalid " + name + "; refusing unverified totals.");
  }
  return value;
}

export async function fetchTikTokSnapshot(bundle: TokenBundle): Promise<TikTokSnapshot> {
  const url = new URL(USER_INFO_URL);
  url.searchParams.set(
    "fields",
    "open_id,display_name,follower_count,following_count,likes_count,video_count",
  );
  const response = await fetch(url.toString(), {
    headers: { Authorization: "Bearer " + bundle.accessToken },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("TikTok user info API returned HTTP " + response.status + ".");
  const payload = (await response.json()) as {
    data?: { user?: Record<string, unknown> };
    error?: { code?: unknown };
  };
  if (payload.error?.code !== "ok" || !payload.data?.user) {
    throw new Error("TikTok did not return an authenticated account snapshot.");
  }
  const user = payload.data.user;
  if (user.open_id !== bundle.openId) {
    throw new Error("TikTok user info does not match the authorized account.");
  }
  return {
    openId: bundle.openId,
    followers: nonnegativeCount(user.follower_count, "follower_count"),
    following: nonnegativeCount(user.following_count, "following_count"),
    likes: nonnegativeCount(user.likes_count, "likes_count"),
    videos: nonnegativeCount(user.video_count, "video_count"),
    capturedAt: new Date().toISOString(),
  };
}

async function persistCredentials(bundle: TokenBundle, config: TikTokConfig) {
  const { error } = await supabaseAdmin
    .from("growth_social_connections")
    .upsert(
      {
        platform: "tiktok",
        status: "connected",
        account_label: TIKTOK_ACCOUNT_LABEL,
        token_ciphertext: seal(bundle, config.encryptionKey),
        token_expires_at: bundle.accessExpiresAt,
        scopes: bundle.scopes,
        error_message: null,
        metadata: {
          environment: config.environment,
          open_id: bundle.openId,
          refresh_expires_at: bundle.refreshExpiresAt,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "platform" },
    );
  if (error) throw new Error("Could not securely save TikTok authorization: " + error.code);
}

async function persistSnapshot(snapshot: TikTokSnapshot, config: TikTokConfig) {
  // Sandbox statistics must never replace production follower totals.
  const entityId =
    config.environment === "sandbox"
      ? TIKTOK_SANDBOX_ENTITY_ID
      : OFFICIAL_TIKTOK_ENTITY_ID;
  const { data: existing, error: readError } = await supabaseAdmin
    .from("social_platform_metrics")
    .select("baseline_followers")
    .eq("entity_id", entityId)
    .eq("platform", "tiktok")
    .maybeSingle();
  if (readError) throw new Error("Could not read TikTok baseline.");
  const baseline =
    existing == null
      ? snapshot.followers
      : nonnegativeCount(existing.baseline_followers, "stored baseline");
  const { error: writeError } = await supabaseAdmin
    .from("social_platform_metrics")
    .upsert(
      {
        entity_id: entityId,
        platform: "tiktok",
        handle: "sitguruofficial",
        current_followers: snapshot.followers,
        baseline_followers: baseline,
        updated_at: snapshot.capturedAt,
      },
      { onConflict: "entity_id,platform" },
    );
  if (writeError) throw new Error("Could not save TikTok verified statistics.");
  const { error: connectionError } = await supabaseAdmin
    .from("growth_social_connections")
    .update({
      status: "connected",
      last_synced_at: snapshot.capturedAt,
      error_message: null,
      updated_at: snapshot.capturedAt,
    })
    .eq("platform", "tiktok");
  if (connectionError) throw new Error("Could not update TikTok sync status.");
  return {
    account: TIKTOK_ACCOUNT_LABEL,
    environment: config.environment,
    followers: snapshot.followers,
    baselineFollowers: baseline,
    updatedAt: snapshot.capturedAt,
  };
}

export async function connectTikTokCode(code: string, requireUpload = false) {
  const config = getTikTokConfig();
  const bundle = await exchangeTikTokCode(code, config);
  if (requireUpload && !bundle.scopes.includes(TIKTOK_UPLOAD_SCOPE)) {
    throw new Error("TikTok did not grant the draft-upload permission.");
  }
  const snapshot = await fetchTikTokSnapshot(bundle);
  await persistCredentials(bundle, config);
  return persistSnapshot(snapshot, config);
}

export async function syncAuthorizedTikTok() {
  const config = getTikTokConfig();
  const { data, error } = await supabaseAdmin
    .from("growth_social_connections")
    .select("token_ciphertext,metadata")
    .eq("platform", "tiktok")
    .maybeSingle();
  if (error || !data?.token_ciphertext) {
    throw new Error("SitGuru TikTok account has not been authorized.");
  }
  const metadata = data.metadata as { environment?: unknown } | null;
  if (metadata?.environment !== config.environment) {
    throw new Error("TikTok account was authorized in a different environment.");
  }
  let bundle = unseal(data.token_ciphertext, config.encryptionKey);
  if (config.expectedOpenId && bundle.openId !== config.expectedOpenId) {
    throw new Error("Saved TikTok account does not match approved identity.");
  }
  if (Date.parse(bundle.accessExpiresAt) <= Date.now() + 5 * 60 * 1000) {
    bundle = await refreshTikTokTokens(bundle, config);
    // Persist the rotated refresh token BEFORE fetching metrics.
    await persistCredentials(bundle, config);
  }
  const snapshot = await fetchTikTokSnapshot(bundle);
  return persistSnapshot(snapshot, config);
}
/**
 * Server-only access for founder-approved draft transfers. Never return this
 * value to a browser, log, React component, or untrusted caller.
 */
export async function getTikTokDraftUploadAccessToken(): Promise<string> {
  const config = getTikTokConfig();
  const { data, error } = await supabaseAdmin
    .from("growth_social_connections")
    .select("token_ciphertext,metadata")
    .eq("platform", "tiktok")
    .maybeSingle();
  if (error || !data?.token_ciphertext) throw new Error("Reconnect the SitGuru TikTok account.");
  const metadata = data.metadata as { environment?: unknown } | null;
  if (metadata?.environment !== config.environment) {
    throw new Error("TikTok account was connected in a different environment.");
  }
  let bundle = unseal(data.token_ciphertext, config.encryptionKey);
  if (config.expectedOpenId && bundle.openId !== config.expectedOpenId) {
    throw new Error("TikTok identity does not match the official account.");
  }
  if (!bundle.scopes.includes(TIKTOK_UPLOAD_SCOPE)) {
    throw new Error("Reconnect TikTok with draft-upload permission.");
  }
  if (Date.parse(bundle.accessExpiresAt) <= Date.now() + 5 * 60 * 1000) {
    bundle = await refreshTikTokTokens(bundle, config);
    if (!bundle.scopes.includes(TIKTOK_UPLOAD_SCOPE)) {
      throw new Error("TikTok upload permission expired. Reconnect the account.");
    }
    await persistCredentials(bundle, config);
  }
  return bundle.accessToken;
}
