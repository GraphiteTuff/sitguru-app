/**
 * SitGuru Social Media Sync Client
 *
 * Fetches live follower counts from Meta (Instagram / Facebook), TikTok, and X,
 * then computes "new followers today" against the midnight baseline in
 * `social_platform_metrics`.
 *
 * SERVER ONLY — never import from `"use client"` modules.
 *
 * Env (optional per platform — missing credentials degrade gracefully):
 * - META_ACCESS_TOKEN, META_GRAPH_API_VERSION, META_IG_USER_ID, META_FB_PAGE_ID
 * - TIKTOK_ACCESS_TOKEN, TIKTOK_OPEN_API_BASE (optional)
 * - X_BEARER_TOKEN (or TWITTER_BEARER_TOKEN), X_USER_ID / X_USERNAME
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { SITGURU_OFFICIAL_HANDLE } from "@/lib/chat/sitguru-social";

export type SocialPlatform = "instagram" | "facebook" | "tiktok" | "x";

export const SOCIAL_PLATFORMS: readonly SocialPlatform[] = [
  "instagram",
  "facebook",
  "tiktok",
  "x",
] as const;

/** Canonical brand entity id for @SitGuruOfficial metrics rows. */
export const SITGURU_BRAND_ENTITY_ID = "sitguru-brand";

export type FollowerCountResult = {
  platform: SocialPlatform;
  handle: string;
  followers: number;
  source: "live" | "cached" | "unavailable";
  error?: string;
};

export type NewFollowersTodayResult = {
  platform: SocialPlatform;
  handle: string;
  entityId: string;
  currentFollowers: number;
  baselineFollowersStartOfDay: number;
  newFollowersToday: number;
  updatedAt: string;
  source: "live" | "cached" | "unavailable";
  error?: string;
};

export type SocialMediaClientErrorCode =
  | "rate_limited"
  | "unauthorized"
  | "not_configured"
  | "not_found"
  | "upstream"
  | "network";

export class SocialMediaClientError extends Error {
  readonly code: SocialMediaClientErrorCode;
  readonly status?: number;
  readonly retryAfterMs?: number;

  constructor(
    message: string,
    code: SocialMediaClientErrorCode,
    opts?: { status?: number; retryAfterMs?: number },
  ) {
    super(message);
    this.name = "SocialMediaClientError";
    this.code = code;
    this.status = opts?.status;
    this.retryAfterMs = opts?.retryAfterMs;
  }
}

function env(name: string): string {
  return String(process.env[name] || "").trim();
}

function normalizeHandle(handle?: string | null): string {
  const raw = String(handle || "").trim();
  if (!raw) return SITGURU_OFFICIAL_HANDLE.replace(/^@/, "");
  return raw.replace(/^@/, "").replace(/^https?:\/\/(www\.)?/i, "").split(/[/?#]/)[0] || raw;
}

function normalizePlatform(platform: string): SocialPlatform | null {
  const p = String(platform || "")
    .trim()
    .toLowerCase();
  if (p === "twitter" || p === "x.com") return "x";
  if (p === "ig" || p === "insta") return "instagram";
  if (p === "fb" || p === "meta") return "facebook";
  if (SOCIAL_PLATFORMS.includes(p as SocialPlatform)) {
    return p as SocialPlatform;
  }
  return null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(header: string | null): number | undefined {
  if (!header) return undefined;
  const asSeconds = Number(header);
  if (Number.isFinite(asSeconds) && asSeconds >= 0) {
    return Math.min(asSeconds * 1000, 60_000);
  }
  const asDate = Date.parse(header);
  if (!Number.isNaN(asDate)) {
    return Math.max(0, Math.min(asDate - Date.now(), 60_000));
  }
  return undefined;
}

/**
 * Fetch with exponential backoff on 429 / transient 5xx.
 * Caps at 3 attempts so tool calls stay within Vercel function budgets.
 */
async function fetchWithRateLimitRetry(
  url: string,
  init: RequestInit,
  label: string,
): Promise<Response> {
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        cache: "no-store",
      });

      if (response.status !== 429 && response.status < 500) {
        return response;
      }

      const retryAfterMs =
        parseRetryAfterMs(response.headers.get("retry-after")) ??
        Math.min(1000 * 2 ** (attempt - 1), 8000);

      if (attempt === maxAttempts) {
        throw new SocialMediaClientError(
          `${label} rate limited or unavailable (HTTP ${response.status}).`,
          response.status === 429 ? "rate_limited" : "upstream",
          { status: response.status, retryAfterMs },
        );
      }

      console.warn(
        `[socialMediaClient] ${label} HTTP ${response.status}; retry ${attempt}/${maxAttempts} in ${retryAfterMs}ms`,
      );
      await sleep(retryAfterMs);
    } catch (error) {
      lastError = error;
      if (error instanceof SocialMediaClientError) throw error;
      if (attempt === maxAttempts) {
        throw new SocialMediaClientError(
          `${label} network failure: ${error instanceof Error ? error.message : "unknown"}`,
          "network",
        );
      }
      await sleep(Math.min(1000 * 2 ** (attempt - 1), 8000));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new SocialMediaClientError(`${label} failed.`, "upstream");
}

// ─── Platform API clients ───────────────────────────────────────────────────

async function fetchInstagramFollowers(handle?: string): Promise<number> {
  const token = env("META_ACCESS_TOKEN");
  const igUserId = env("META_IG_USER_ID");
  const version = env("META_GRAPH_API_VERSION") || "v21.0";

  if (!token || !igUserId) {
    throw new SocialMediaClientError(
      "Instagram Graph API is not configured (META_ACCESS_TOKEN / META_IG_USER_ID).",
      "not_configured",
    );
  }

  // Brand account: direct IG user insights. Handle override uses business discovery when set.
  const targetHandle = normalizeHandle(handle);
  const brandHandle = normalizeHandle(SITGURU_OFFICIAL_HANDLE);
  const isBrand = !handle || targetHandle.toLowerCase() === brandHandle.toLowerCase();

  const url = isBrand
    ? `https://graph.facebook.com/${version}/${igUserId}?fields=followers_count,username&access_token=${encodeURIComponent(token)}`
    : `https://graph.facebook.com/${version}/${igUserId}?fields=business_discovery.username(${encodeURIComponent(targetHandle)}){followers_count,username}&access_token=${encodeURIComponent(token)}`;

  const response = await fetchWithRateLimitRetry(
    url,
    { method: "GET", headers: { Accept: "application/json" } },
    "Instagram",
  );

  if (response.status === 401 || response.status === 403) {
    throw new SocialMediaClientError(
      "Instagram Graph API unauthorized — check META_ACCESS_TOKEN scopes.",
      "unauthorized",
      { status: response.status },
    );
  }

  const payload = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    const message =
      typeof (payload as { error?: { message?: string } }).error?.message ===
      "string"
        ? (payload as { error: { message: string } }).error.message
        : `Instagram HTTP ${response.status}`;
    throw new SocialMediaClientError(message, "upstream", {
      status: response.status,
    });
  }

  if (isBrand) {
    const count = Number(payload.followers_count);
    if (!Number.isFinite(count)) {
      throw new SocialMediaClientError(
        "Instagram response missing followers_count.",
        "upstream",
      );
    }
    return Math.max(0, Math.floor(count));
  }

  const discovery = payload.business_discovery as
    | { followers_count?: number }
    | undefined;
  const count = Number(discovery?.followers_count);
  if (!Number.isFinite(count)) {
    throw new SocialMediaClientError(
      `Instagram business discovery failed for @${targetHandle}.`,
      "not_found",
    );
  }
  return Math.max(0, Math.floor(count));
}

async function fetchFacebookFollowers(handle?: string): Promise<number> {
  const token = env("META_ACCESS_TOKEN");
  const pageId = env("META_FB_PAGE_ID");
  const version = env("META_GRAPH_API_VERSION") || "v21.0";

  if (!token || !pageId) {
    throw new SocialMediaClientError(
      "Facebook Graph API is not configured (META_ACCESS_TOKEN / META_FB_PAGE_ID).",
      "not_configured",
    );
  }

  // Page fan_count is the follower/like metric for brand Pages.
  // Handle overrides still resolve against the configured Page id unless a
  // dedicated page username lookup is provided via META_FB_PAGE_ID.
  void handle;
  const url = `https://graph.facebook.com/${version}/${pageId}?fields=fan_count,followers_count,name,username&access_token=${encodeURIComponent(token)}`;

  const response = await fetchWithRateLimitRetry(
    url,
    { method: "GET", headers: { Accept: "application/json" } },
    "Facebook",
  );

  if (response.status === 401 || response.status === 403) {
    throw new SocialMediaClientError(
      "Facebook Graph API unauthorized — check META_ACCESS_TOKEN page scopes.",
      "unauthorized",
      { status: response.status },
    );
  }

  const payload = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    const message =
      typeof (payload as { error?: { message?: string } }).error?.message ===
      "string"
        ? (payload as { error: { message: string } }).error.message
        : `Facebook HTTP ${response.status}`;
    throw new SocialMediaClientError(message, "upstream", {
      status: response.status,
    });
  }

  const count = Number(
    payload.followers_count ?? payload.fan_count ?? Number.NaN,
  );
  if (!Number.isFinite(count)) {
    throw new SocialMediaClientError(
      "Facebook response missing followers_count / fan_count.",
      "upstream",
    );
  }
  return Math.max(0, Math.floor(count));
}

async function fetchTikTokFollowers(handle?: string): Promise<number> {
  const token = env("TIKTOK_ACCESS_TOKEN");
  const base =
    env("TIKTOK_OPEN_API_BASE") || "https://open.tiktokapis.com/v2";

  if (!token) {
    throw new SocialMediaClientError(
      "TikTok Open API is not configured (TIKTOK_ACCESS_TOKEN).",
      "not_configured",
    );
  }

  // User info endpoint returns follower_count for the authorized account.
  // Handle overrides require Research API / Business API access; when a
  // non-brand handle is requested without that capability we surface not_found.
  const targetHandle = normalizeHandle(handle);
  const brandHandle = normalizeHandle(SITGURU_OFFICIAL_HANDLE);
  const isBrand = !handle || targetHandle.toLowerCase() === brandHandle.toLowerCase();

  if (!isBrand && !env("TIKTOK_ALLOW_HANDLE_LOOKUP")) {
    throw new SocialMediaClientError(
      `TikTok handle lookup for @${targetHandle} requires TIKTOK_ALLOW_HANDLE_LOOKUP + Research/Business API access.`,
      "not_configured",
    );
  }

  const url = `${base.replace(/\/$/, "")}/user/info/?fields=follower_count,display_name,username`;
  const response = await fetchWithRateLimitRetry(
    url,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
    "TikTok",
  );

  if (response.status === 401 || response.status === 403) {
    throw new SocialMediaClientError(
      "TikTok Open API unauthorized — check TIKTOK_ACCESS_TOKEN.",
      "unauthorized",
      { status: response.status },
    );
  }

  const payload = (await response.json().catch(() => ({}))) as {
    data?: { user?: { follower_count?: number } };
    error?: { message?: string; code?: string };
  };

  if (!response.ok) {
    throw new SocialMediaClientError(
      payload.error?.message || `TikTok HTTP ${response.status}`,
      "upstream",
      { status: response.status },
    );
  }

  const count = Number(payload.data?.user?.follower_count);
  if (!Number.isFinite(count)) {
    throw new SocialMediaClientError(
      "TikTok response missing follower_count.",
      "upstream",
    );
  }
  return Math.max(0, Math.floor(count));
}

async function fetchXFollowers(handle?: string): Promise<number> {
  const token = env("X_BEARER_TOKEN") || env("TWITTER_BEARER_TOKEN");
  if (!token) {
    throw new SocialMediaClientError(
      "X API is not configured (X_BEARER_TOKEN).",
      "not_configured",
    );
  }

  const targetHandle = normalizeHandle(
    handle || env("X_USERNAME") || SITGURU_OFFICIAL_HANDLE,
  );
  const userId = !handle ? env("X_USER_ID") : "";

  const url = userId
    ? `https://api.x.com/2/users/${encodeURIComponent(userId)}?user.fields=public_metrics`
    : `https://api.x.com/2/users/by/username/${encodeURIComponent(targetHandle)}?user.fields=public_metrics`;

  const response = await fetchWithRateLimitRetry(
    url,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
    "X",
  );

  if (response.status === 401 || response.status === 403) {
    throw new SocialMediaClientError(
      "X API unauthorized — check X_BEARER_TOKEN app permissions.",
      "unauthorized",
      { status: response.status },
    );
  }

  if (response.status === 404) {
    throw new SocialMediaClientError(
      `X user @${targetHandle} not found.`,
      "not_found",
      { status: 404 },
    );
  }

  const payload = (await response.json().catch(() => ({}))) as {
    data?: { public_metrics?: { followers_count?: number } };
    errors?: Array<{ detail?: string; title?: string }>;
  };

  if (!response.ok) {
    const detail =
      payload.errors?.[0]?.detail ||
      payload.errors?.[0]?.title ||
      `X HTTP ${response.status}`;
    throw new SocialMediaClientError(detail, "upstream", {
      status: response.status,
    });
  }

  const count = Number(payload.data?.public_metrics?.followers_count);
  if (!Number.isFinite(count)) {
    throw new SocialMediaClientError(
      "X response missing public_metrics.followers_count.",
      "upstream",
    );
  }
  return Math.max(0, Math.floor(count));
}

/** Live follower count for one platform (+ optional handle). */
export async function fetchLiveFollowerCount(
  platformInput: string,
  handle?: string,
): Promise<FollowerCountResult> {
  const platform = normalizePlatform(platformInput);
  if (!platform) {
    return {
      platform: "instagram",
      handle: normalizeHandle(handle),
      followers: 0,
      source: "unavailable",
      error: `Unsupported platform: ${platformInput}`,
    };
  }

  const resolvedHandle = normalizeHandle(
    handle ||
      (platform === "x"
        ? env("X_USERNAME") || SITGURU_OFFICIAL_HANDLE
        : SITGURU_OFFICIAL_HANDLE),
  );

  try {
    let followers = 0;
    switch (platform) {
      case "instagram":
        followers = await fetchInstagramFollowers(handle);
        break;
      case "facebook":
        followers = await fetchFacebookFollowers(handle);
        break;
      case "tiktok":
        followers = await fetchTikTokFollowers(handle);
        break;
      case "x":
        followers = await fetchXFollowers(handle);
        break;
    }

    return {
      platform,
      handle: resolvedHandle,
      followers,
      source: "live",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown social API error";
    console.warn(`[socialMediaClient] ${platform} fetch failed:`, message);
    return {
      platform,
      handle: resolvedHandle,
      followers: 0,
      source: "unavailable",
      error: message,
    };
  }
}

// ─── DB baseline helpers ────────────────────────────────────────────────────

type MetricsRow = {
  id: string;
  entity_id: string;
  platform: string;
  handle: string | null;
  current_followers: number | null;
  baseline_followers_start_of_day: number | null;
  baseline_date: string | null;
  updated_at: string | null;
};

function utcDateString(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

async function loadMetricsRow(opts: {
  entityId: string;
  platform: SocialPlatform;
  handle?: string;
}): Promise<MetricsRow | null> {
  const handle = normalizeHandle(opts.handle);
  let query = supabaseAdmin
    .from("social_platform_metrics")
    .select(
      "id,entity_id,platform,handle,current_followers,baseline_followers_start_of_day,baseline_date,updated_at",
    )
    .eq("entity_id", opts.entityId)
    .eq("platform", opts.platform)
    .limit(1);

  if (opts.handle) {
    query = query.ilike("handle", handle);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.warn("[socialMediaClient] metrics read failed:", error.message);
    return null;
  }
  return (data as MetricsRow | null) || null;
}

/**
 * Upsert the latest live count. Rolls baseline forward when the UTC day changes.
 */
export async function upsertSocialMetrics(opts: {
  entityId: string;
  platform: SocialPlatform;
  handle?: string;
  currentFollowers: number;
}): Promise<MetricsRow | null> {
  const handle = normalizeHandle(opts.handle);
  const today = utcDateString();
  const existing = await loadMetricsRow({
    entityId: opts.entityId,
    platform: opts.platform,
    handle: opts.handle,
  });

  const baselineDate = existing?.baseline_date || null;
  const needsBaselineReset = !baselineDate || baselineDate !== today;
  const baseline = needsBaselineReset
    ? opts.currentFollowers
    : Number(existing?.baseline_followers_start_of_day ?? opts.currentFollowers);

  const payload = {
    entity_id: opts.entityId,
    platform: opts.platform,
    handle,
    current_followers: opts.currentFollowers,
    baseline_followers_start_of_day: Math.max(0, Math.floor(baseline)),
    baseline_date: today,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("social_platform_metrics")
    .upsert(payload, { onConflict: "entity_id,platform,handle" })
    .select(
      "id,entity_id,platform,handle,current_followers,baseline_followers_start_of_day,baseline_date,updated_at",
    )
    .maybeSingle();

  if (error) {
    console.warn("[socialMediaClient] metrics upsert failed:", error.message);
    return existing;
  }

  return (data as MetricsRow | null) || existing;
}

/**
 * Compare live follower count against the midnight UTC baseline.
 * Persists the latest count so subsequent asks stay consistent within the day.
 */
export async function getNewFollowersToday(
  platformInput: string,
  handle?: string,
  opts?: { entityId?: string },
): Promise<NewFollowersTodayResult> {
  const platform = normalizePlatform(platformInput);
  const resolvedHandle = normalizeHandle(handle || SITGURU_OFFICIAL_HANDLE);
  const entityId =
    opts?.entityId ||
    (handle &&
    normalizeHandle(handle).toLowerCase() !==
      normalizeHandle(SITGURU_OFFICIAL_HANDLE).toLowerCase()
      ? `handle:${resolvedHandle.toLowerCase()}`
      : SITGURU_BRAND_ENTITY_ID);

  if (!platform) {
    return {
      platform: "instagram",
      handle: resolvedHandle,
      entityId,
      currentFollowers: 0,
      baselineFollowersStartOfDay: 0,
      newFollowersToday: 0,
      updatedAt: new Date().toISOString(),
      source: "unavailable",
      error: `Unsupported platform: ${platformInput}`,
    };
  }

  const live = await fetchLiveFollowerCount(platform, handle);
  const cached = await loadMetricsRow({
    entityId,
    platform,
    handle: resolvedHandle,
  });

  if (live.source === "live") {
    const saved = await upsertSocialMetrics({
      entityId,
      platform,
      handle: resolvedHandle,
      currentFollowers: live.followers,
    });

    const baseline = Number(
      saved?.baseline_followers_start_of_day ?? live.followers,
    );
    const current = Number(saved?.current_followers ?? live.followers);

    return {
      platform,
      handle: resolvedHandle,
      entityId,
      currentFollowers: current,
      baselineFollowersStartOfDay: baseline,
      newFollowersToday: Math.max(0, current - baseline),
      updatedAt: saved?.updated_at || new Date().toISOString(),
      source: "live",
    };
  }

  // Fall back to last cached row when the live API is unavailable.
  if (cached) {
    const baseline = Number(cached.baseline_followers_start_of_day ?? 0);
    const current = Number(cached.current_followers ?? 0);
    return {
      platform,
      handle: resolvedHandle,
      entityId,
      currentFollowers: current,
      baselineFollowersStartOfDay: baseline,
      newFollowersToday: Math.max(0, current - baseline),
      updatedAt: cached.updated_at || new Date().toISOString(),
      source: "cached",
      error: live.error,
    };
  }

  return {
    platform,
    handle: resolvedHandle,
    entityId,
    currentFollowers: 0,
    baselineFollowersStartOfDay: 0,
    newFollowersToday: 0,
    updatedAt: new Date().toISOString(),
    source: "unavailable",
    error: live.error || "No live or cached social metrics available.",
  };
}

/** Sync brand accounts across all platforms (cron / admin trigger). */
export async function syncBrandSocialMetrics(): Promise<
  NewFollowersTodayResult[]
> {
  const results: NewFollowersTodayResult[] = [];
  for (const platform of SOCIAL_PLATFORMS) {
    results.push(
      await getNewFollowersToday(platform, SITGURU_OFFICIAL_HANDLE, {
        entityId: SITGURU_BRAND_ENTITY_ID,
      }),
    );
  }
  return results;
}

/**
 * Reset baselines to the current follower count (midnight cron).
 * Keeps `current_followers` intact and stamps today's UTC baseline_date.
 */
export async function resetDailyBaselines(): Promise<{
  updated: number;
  errors: string[];
}> {
  const today = utcDateString();
  const { data, error } = await supabaseAdmin
    .from("social_platform_metrics")
    .select(
      "id,entity_id,platform,handle,current_followers,baseline_followers_start_of_day,baseline_date",
    )
    .limit(2000);

  if (error) {
    return { updated: 0, errors: [error.message] };
  }

  const rows = (data || []) as MetricsRow[];
  const errors: string[] = [];
  let updated = 0;

  for (const row of rows) {
    if (row.baseline_date === today) continue;
    const current = Math.max(0, Math.floor(Number(row.current_followers ?? 0)));
    const { error: updateError } = await supabaseAdmin
      .from("social_platform_metrics")
      .update({
        baseline_followers_start_of_day: current,
        baseline_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (updateError) {
      errors.push(`${row.platform}/${row.handle}: ${updateError.message}`);
    } else {
      updated += 1;
    }
  }

  return { updated, errors };
}
