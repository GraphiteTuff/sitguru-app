/**
 * Social media follower sync for SitGuru brand + AI personas (Rogue / Delilah).
 *
 * Priority when live Meta/X/TikTok tokens are missing or unauthorized:
 *   1) config/social-metrics.json (manual tracking)
 *   2) social_platform_metrics database rows
 *   3) hard-coded offline fallbacks
 *
 * Server-only — do not import from client components.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type SocialPlatform = "instagram" | "facebook" | "tiktok" | "x" | "youtube";

export type SocialEntityId = "brand" | "rogue" | "delilah" | (string & {});

export type SocialFollowerSnapshot = {
  entityId: SocialEntityId;
  platform: SocialPlatform;
  currentFollowers: number;
  baselineFollowers?: number;
  source: "live" | "config" | "fallback";
};

/** Default tracked handles / entities for baseline seeding and cron sync. */
export const SOCIAL_TRACKED_ENTITIES: readonly SocialEntityId[] = [
  "brand",
  "rogue",
  "delilah",
] as const;

export const SOCIAL_TRACKED_PLATFORMS: readonly SocialPlatform[] = [
  "instagram",
  "facebook",
  "tiktok",
  "x",
  "youtube",
] as const;

export const SOCIAL_METRICS_CONFIG_PATH = join(
  process.cwd(),
  "config",
  "social-metrics.json",
);

type JsonChannelMetrics = {
  baseline?: number;
  current?: number;
};

type SocialMetricsJsonFile = {
  updatedAt?: string;
  handle?: string;
  notes?: string;
  channels?: Record<string, JsonChannelMetrics>;
  /** Optional per-entity override map */
  entities?: Record<string, Record<string, JsonChannelMetrics>>;
};

/** Safe offline baselines when config + API tokens are absent. */
const FALLBACK_FOLLOWERS: Record<
  SocialEntityId,
  Partial<Record<SocialPlatform, number>>
> = {
  brand: {
    instagram: 0,
    facebook: 20,
    tiktok: 0,
    x: 0,
    youtube: 0,
  },
  rogue: {
    instagram: 0,
    facebook: 20,
    tiktok: 0,
    x: 0,
    youtube: 0,
  },
  delilah: {
    instagram: 0,
    facebook: 20,
    tiktok: 0,
    x: 0,
    youtube: 0,
  },
};

const PLACEHOLDER_TOKEN_HINTS = [
  "",
  "changeme",
  "replace_me",
  "your_token_here",
  "xxx",
  "todo",
  "placeholder",
];

function readEnv(name: string): string {
  return String(process.env[name] || "").trim();
}

function isUsableToken(value: string): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase();
  if (PLACEHOLDER_TOKEN_HINTS.includes(normalized)) return false;
  if (normalized.startsWith("your_") || normalized.includes("placeholder")) {
    return false;
  }
  return value.length >= 8;
}

export function hasMetaAccessToken(): boolean {
  return isUsableToken(readEnv("META_ACCESS_TOKEN"));
}

export function hasXBearerToken(): boolean {
  return isUsableToken(readEnv("X_BEARER_TOKEN"));
}

export function hasTikTokClientKey(): boolean {
  return isUsableToken(readEnv("TIKTOK_CLIENT_KEY"));
}

/** True when at least one live social API credential looks usable. */
export function hasUsableLiveSocialTokens(): boolean {
  return hasMetaAccessToken() || hasXBearerToken() || hasTikTokClientKey();
}

export function computeFollowerDelta(
  currentFollowers: number,
  baselineFollowers: number,
): number {
  const current = Number.isFinite(currentFollowers) ? currentFollowers : 0;
  const baseline = Number.isFinite(baselineFollowers) ? baselineFollowers : 0;
  return Math.trunc(current) - Math.trunc(baseline);
}

function asInt(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

/** Map config keys like `twitter` onto our canonical platform ids. */
export function normalizeSocialPlatformKey(
  raw: string,
): SocialPlatform | null {
  const key = String(raw || "")
    .trim()
    .toLowerCase();
  if (key === "facebook" || key === "fb") return "facebook";
  if (key === "instagram" || key === "ig") return "instagram";
  if (key === "tiktok" || key === "tt") return "tiktok";
  if (key === "twitter" || key === "x" || key === "tweet") return "x";
  if (key === "youtube" || key === "yt") return "youtube";
  return null;
}

function fallbackFollowers(
  entityId: SocialEntityId,
  platform: SocialPlatform,
): number {
  const byEntity = FALLBACK_FOLLOWERS[entityId];
  const value = byEntity?.[platform];
  if (typeof value === "number" && value >= 0) return value;
  return FALLBACK_FOLLOWERS.brand[platform] ?? 0;
}

/**
 * Load manual tracking from config/social-metrics.json.
 * Returns null when the file is missing or unreadable.
 */
export function loadSocialMetricsConfig(
  configPath: string = SOCIAL_METRICS_CONFIG_PATH,
): SocialMetricsJsonFile | null {
  try {
    if (!existsSync(configPath)) return null;
    const raw = readFileSync(configPath, "utf8");
    const parsed = JSON.parse(raw) as SocialMetricsJsonFile;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (error) {
    console.warn(
      "[socialMediaClient] failed to read config/social-metrics.json:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

function channelMetricsFromConfig(
  config: SocialMetricsJsonFile,
  entityId: SocialEntityId,
  platform: SocialPlatform,
): { baseline: number; current: number } | null {
  const entityMap = config.entities?.[String(entityId)];
  if (entityMap && typeof entityMap === "object") {
    for (const [rawKey, metrics] of Object.entries(entityMap)) {
      if (normalizeSocialPlatformKey(rawKey) !== platform) continue;
      return {
        baseline: asInt(metrics?.baseline),
        current: asInt(metrics?.current),
      };
    }
  }

  // Brand (and default) channels live at the top-level `channels` map.
  if (entityId === "brand" || entityId === "rogue" || entityId === "delilah") {
    const channels = config.channels || {};
    for (const [rawKey, metrics] of Object.entries(channels)) {
      if (normalizeSocialPlatformKey(rawKey) !== platform) continue;
      return {
        baseline: asInt(metrics?.baseline),
        current: asInt(metrics?.current),
      };
    }
  }

  return null;
}

/**
 * Build Rogue-ready rows directly from the JSON tracking file.
 */
export function rowsFromSocialMetricsConfig(
  opts?: { entityId?: string; configPath?: string },
): LiveSocialFollowerRow[] {
  const config = loadSocialMetricsConfig(opts?.configPath);
  if (!config) return [];

  const updatedAt = config.updatedAt ? String(config.updatedAt) : null;
  const filterEntity = String(opts?.entityId || "").trim();
  const entityIds: SocialEntityId[] = filterEntity
    ? [filterEntity]
    : ["brand"];

  const rows: LiveSocialFollowerRow[] = [];

  for (const entityId of entityIds) {
    const channels = config.channels || {};
    const seen = new Set<SocialPlatform>();

    for (const rawKey of Object.keys(channels)) {
      const platform = normalizeSocialPlatformKey(rawKey);
      if (!platform || seen.has(platform)) continue;
      seen.add(platform);

      const metrics = channelMetricsFromConfig(config, entityId, platform);
      if (!metrics) continue;

      rows.push({
        entityId,
        platform,
        currentFollowers: metrics.current,
        baselineFollowers: metrics.baseline,
        delta: computeFollowerDelta(metrics.current, metrics.baseline),
        updatedAt,
      });
    }

    // Also surface entity-specific platforms not listed in top-level channels.
    const entityMap = config.entities?.[String(entityId)] || {};
    for (const rawKey of Object.keys(entityMap)) {
      const platform = normalizeSocialPlatformKey(rawKey);
      if (!platform || seen.has(platform)) continue;
      seen.add(platform);
      const metrics = channelMetricsFromConfig(config, entityId, platform);
      if (!metrics) continue;
      rows.push({
        entityId,
        platform,
        currentFollowers: metrics.current,
        baselineFollowers: metrics.baseline,
        delta: computeFollowerDelta(metrics.current, metrics.baseline),
        updatedAt,
      });
    }
  }

  return rows.sort((a, b) =>
    `${a.entityId}:${a.platform}`.localeCompare(`${b.entityId}:${b.platform}`),
  );
}

function formatSocialDigest(
  rows: LiveSocialFollowerRow[],
  sourceLabel: string,
): string {
  if (!rows.length) {
    return "No social metrics rows available yet.";
  }
  return [
    `LIVE SOCIAL FOLLOWERS (from ${sourceLabel}):`,
    ...rows.map((row) => {
      const sign = row.delta > 0 ? "+" : "";
      return `- ${row.entityId} / ${row.platform}: current ${row.currentFollowers.toLocaleString()} · baseline ${row.baselineFollowers.toLocaleString()} · delta ${sign}${row.delta.toLocaleString()}`;
    }),
    "Authorized: report these exact numbers. Do not invent counts outside this digest.",
  ].join("\n");
}

/**
 * Mock-ready live fetch. When tokens are missing/unauthorized, prefer
 * config/social-metrics.json so Rogue can report manual counts (e.g. FB 20).
 */
export async function fetchLiveFollowerCount(params: {
  entityId: SocialEntityId;
  platform: SocialPlatform;
}): Promise<SocialFollowerSnapshot> {
  const { entityId, platform } = params;

  const metaReady = hasMetaAccessToken();
  const xReady = hasXBearerToken();
  const tiktokReady = hasTikTokClientKey();

  let canAttemptLive = false;
  if (platform === "instagram" || platform === "facebook") {
    canAttemptLive = metaReady;
  } else if (platform === "x") {
    canAttemptLive = xReady;
  } else if (platform === "tiktok") {
    canAttemptLive = tiktokReady;
  } else if (platform === "youtube") {
    canAttemptLive = metaReady;
  }

  // Live Graph calls are not available on Consumer apps / missing tokens.
  // Prefer the checked-in JSON tracker before hard-coded fallbacks.
  if (!canAttemptLive) {
    const config = loadSocialMetricsConfig();
    if (config) {
      const metrics = channelMetricsFromConfig(config, entityId, platform);
      if (metrics) {
        return {
          entityId,
          platform,
          currentFollowers: metrics.current,
          baselineFollowers: metrics.baseline,
          source: "config",
        };
      }
    }

    return {
      entityId,
      platform,
      currentFollowers: fallbackFollowers(entityId, platform),
      source: "fallback",
    };
  }

  // Token present but live Graph wiring still stubbed / unauthorized for
  // Consumer app types — fall through to JSON so numbers stay accurate.
  const config = loadSocialMetricsConfig();
  if (config) {
    const metrics = channelMetricsFromConfig(config, entityId, platform);
    if (metrics) {
      return {
        entityId,
        platform,
        currentFollowers: metrics.current,
        baselineFollowers: metrics.baseline,
        source: "config",
      };
    }
  }

  return {
    entityId,
    platform,
    currentFollowers: fallbackFollowers(entityId, platform),
    source: "fallback",
  };
}

export async function fetchAllTrackedSnapshots(): Promise<
  SocialFollowerSnapshot[]
> {
  const jobs: Array<Promise<SocialFollowerSnapshot>> = [];
  for (const entityId of SOCIAL_TRACKED_ENTITIES) {
    for (const platform of SOCIAL_TRACKED_PLATFORMS) {
      jobs.push(fetchLiveFollowerCount({ entityId, platform }));
    }
  }
  return Promise.all(jobs);
}

export type LiveSocialFollowerRow = {
  entityId: string;
  platform: string;
  currentFollowers: number;
  baselineFollowers: number;
  delta: number;
  updatedAt: string | null;
};

export type LiveSocialFollowersResult = {
  ok: boolean;
  source: "database" | "config" | "empty" | "error";
  rows: LiveSocialFollowerRow[];
  digest: string;
  error?: string;
};

type SocialMetricsSelectBuilder = {
  eq: (
    column: string,
    value: string,
  ) => PromiseLike<{
    data: Array<Record<string, unknown>> | null;
    error: { message?: string } | null;
  }>;
  order: (
    column: string,
    options?: { ascending?: boolean },
  ) => PromiseLike<{
    data: Array<Record<string, unknown>> | null;
    error: { message?: string } | null;
  }>;
};

type SocialMetricsReader = {
  from: (table: string) => {
    select: (columns: string) => SocialMetricsSelectBuilder;
  };
};

/**
 * Read follower metrics for Rogue / Delilah.
 * When live API tokens are missing/unauthorized (typical for Meta Consumer apps),
 * prioritize config/social-metrics.json so Facebook current=20 is reported exactly.
 */
export async function fetchLiveSocialFollowers(
  admin: SocialMetricsReader,
  opts?: { entityId?: string },
): Promise<LiveSocialFollowersResult> {
  const preferConfig = !hasUsableLiveSocialTokens();
  const configRows = rowsFromSocialMetricsConfig({
    entityId: opts?.entityId || (preferConfig ? "brand" : undefined),
  });

  if (preferConfig && configRows.length) {
    return {
      ok: true,
      source: "config",
      rows: configRows,
      digest: formatSocialDigest(configRows, "config/social-metrics.json"),
    };
  }

  try {
    const entityId = String(opts?.entityId || "").trim();
    const columns =
      "entity_id, platform, current_followers, baseline_followers, updated_at";
    const selected = admin.from("social_platform_metrics").select(columns);
    const { data, error } = entityId
      ? await selected.eq("entity_id", entityId)
      : await selected.order("entity_id", { ascending: true });

    if (error) {
      if (configRows.length) {
        return {
          ok: true,
          source: "config",
          rows: configRows,
          digest: formatSocialDigest(configRows, "config/social-metrics.json"),
        };
      }
      return {
        ok: false,
        source: "error",
        rows: [],
        digest:
          "Social metrics unavailable right now — table query failed. Ask them to retry shortly.",
        error: error.message || "query failed",
      };
    }

    const rows: LiveSocialFollowerRow[] = (data || [])
      .map((row) => {
        const currentFollowers = asInt(row.current_followers);
        const baselineFollowers = asInt(row.baseline_followers);
        return {
          entityId: String(row.entity_id || "").trim() || "brand",
          platform: String(row.platform || "").trim() || "unknown",
          currentFollowers,
          baselineFollowers,
          delta: computeFollowerDelta(currentFollowers, baselineFollowers),
          updatedAt: row.updated_at ? String(row.updated_at) : null,
        };
      })
      .sort((a, b) =>
        `${a.entityId}:${a.platform}`.localeCompare(
          `${b.entityId}:${b.platform}`,
        ),
      );

    if (!rows.length) {
      if (configRows.length) {
        return {
          ok: true,
          source: "config",
          rows: configRows,
          digest: formatSocialDigest(configRows, "config/social-metrics.json"),
        };
      }
      return {
        ok: true,
        source: "empty",
        rows: [],
        digest:
          "No social_platform_metrics rows yet. Update config/social-metrics.json or run npm run seed-social-baseline.",
      };
    }

    return {
      ok: true,
      source: "database",
      rows,
      digest: formatSocialDigest(rows, "social_platform_metrics"),
    };
  } catch (error) {
    if (configRows.length) {
      return {
        ok: true,
        source: "config",
        rows: configRows,
        digest: formatSocialDigest(configRows, "config/social-metrics.json"),
      };
    }
    return {
      ok: false,
      source: "error",
      rows: [],
      digest: "Social metrics lookup crashed safely — retry in a moment.",
      error: error instanceof Error ? error.message : "lookup failed",
    };
  }
}

export type BaselineSyncRowResult = {
  entityId: string;
  platform: string;
  currentFollowers: number;
  baselineFollowers: number;
  delta: number;
  source: "live" | "config" | "fallback";
  action: "upserted" | "skipped" | "error";
  error?: string;
};

export type BaselineSyncResult = {
  ok: boolean;
  ranAt: string;
  updated: number;
  results: BaselineSyncRowResult[];
};

type SocialMetricsAdmin = {
  from: (table: string) => {
    upsert: (
      values: Record<string, unknown> | Record<string, unknown>[],
      options?: { onConflict?: string },
    ) => PromiseLike<{ error: { message?: string } | null }>;
  };
};

/**
 * Pull current follower counts and lock them into `baseline_followers`
 * (also refreshing `current_followers` + `updated_at`).
 */
export async function syncSocialMetricsBaseline(
  admin: SocialMetricsAdmin,
): Promise<BaselineSyncResult> {
  const snapshots = await fetchAllTrackedSnapshots();
  const results: BaselineSyncRowResult[] = [];
  let updated = 0;

  for (const snapshot of snapshots) {
    const baseline =
      typeof snapshot.baselineFollowers === "number"
        ? snapshot.baselineFollowers
        : snapshot.currentFollowers;
    const payload = {
      entity_id: snapshot.entityId,
      platform: snapshot.platform,
      current_followers: snapshot.currentFollowers,
      baseline_followers: baseline,
      updated_at: new Date().toISOString(),
    };

    const { error } = await admin.from("social_platform_metrics").upsert(payload, {
      onConflict: "entity_id,platform",
    });

    if (error) {
      results.push({
        entityId: snapshot.entityId,
        platform: snapshot.platform,
        currentFollowers: snapshot.currentFollowers,
        baselineFollowers: baseline,
        delta: computeFollowerDelta(snapshot.currentFollowers, baseline),
        source: snapshot.source,
        action: "error",
        error: error.message || "upsert failed",
      });
      continue;
    }

    updated += 1;
    results.push({
      entityId: snapshot.entityId,
      platform: snapshot.platform,
      currentFollowers: snapshot.currentFollowers,
      baselineFollowers: baseline,
      delta: computeFollowerDelta(snapshot.currentFollowers, baseline),
      source: snapshot.source,
      action: "upserted",
    });
  }

  return {
    ok: results.every((row) => row.action !== "error"),
    ranAt: new Date().toISOString(),
    updated,
    results,
  };
}
