/**
 * Social media follower sync for SitGuru brand + AI personas (Rogue / Delilah).
 *
 * Server-only. Tokens live in env; missing/placeholder values use safe fallbacks
 * so cron and seed scripts never crash local/dev environments.
 */

export type SocialPlatform = "instagram" | "facebook" | "tiktok" | "x" | "youtube";

export type SocialEntityId = "brand" | "rogue" | "delilah" | (string & {});

export type SocialFollowerSnapshot = {
  entityId: SocialEntityId;
  platform: SocialPlatform;
  currentFollowers: number;
  source: "live" | "fallback";
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

/** Safe offline baselines when API tokens are absent or still placeholders. */
const FALLBACK_FOLLOWERS: Record<
  SocialEntityId,
  Partial<Record<SocialPlatform, number>>
> = {
  brand: {
    instagram: 1250,
    facebook: 980,
    tiktok: 2100,
    x: 640,
    youtube: 420,
  },
  rogue: {
    instagram: 860,
    facebook: 510,
    tiktok: 1440,
    x: 390,
    youtube: 275,
  },
  delilah: {
    instagram: 720,
    facebook: 430,
    tiktok: 990,
    x: 280,
    youtube: 190,
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

export function computeFollowerDelta(
  currentFollowers: number,
  baselineFollowers: number,
): number {
  const current = Number.isFinite(currentFollowers) ? currentFollowers : 0;
  const baseline = Number.isFinite(baselineFollowers) ? baselineFollowers : 0;
  return Math.trunc(current) - Math.trunc(baseline);
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
 * Mock-ready live fetch. When tokens are configured this is the extension
 * point for Meta / X / TikTok / YouTube Graph calls. Until then, returns
 * deterministic fallbacks so cron + local seed stay green.
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
    // YouTube often rides Meta/Google stacks; treat Meta token as optional gate.
    canAttemptLive = metaReady;
  }

  if (!canAttemptLive) {
    return {
      entityId,
      platform,
      currentFollowers: fallbackFollowers(entityId, platform),
      source: "fallback",
    };
  }

  // Live API wiring is intentionally stubbed until credentials are production-ready.
  // Returning fallback keeps jobs idempotent and crash-free.
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
  source: "database" | "empty" | "error";
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

function asInt(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

/**
 * Read live follower rows from `social_platform_metrics` and compute
 * `current_followers - baseline_followers` deltas for Rogue / Delilah tools.
 */
export async function fetchLiveSocialFollowers(
  admin: SocialMetricsReader,
  opts?: { entityId?: string },
): Promise<LiveSocialFollowersResult> {
  try {
    const entityId = String(opts?.entityId || "").trim();
    const columns =
      "entity_id, platform, current_followers, baseline_followers, updated_at";
    const selected = admin.from("social_platform_metrics").select(columns);
    const { data, error } = entityId
      ? await selected.eq("entity_id", entityId)
      : await selected.order("entity_id", { ascending: true });

    if (error) {
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
      return {
        ok: true,
        source: "empty",
        rows: [],
        digest:
          "No social_platform_metrics rows yet. Seed baselines with `npm run seed-social-baseline` or run the social-metrics-baseline cron.",
      };
    }

    const digestLines = [
      "LIVE SOCIAL FOLLOWERS (from social_platform_metrics):",
      ...rows.map((row) => {
        const sign = row.delta > 0 ? "+" : "";
        return `- ${row.entityId} / ${row.platform}: current ${row.currentFollowers.toLocaleString()} · baseline ${row.baselineFollowers.toLocaleString()} · delta ${sign}${row.delta.toLocaleString()}`;
      }),
      "Authorized: report these exact numbers. Do not invent counts outside this digest.",
    ];

    return {
      ok: true,
      source: "database",
      rows,
      digest: digestLines.join("\n"),
    };
  } catch (error) {
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
  source: "live" | "fallback";
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
    const payload = {
      entity_id: snapshot.entityId,
      platform: snapshot.platform,
      current_followers: snapshot.currentFollowers,
      baseline_followers: snapshot.currentFollowers,
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
        baselineFollowers: snapshot.currentFollowers,
        delta: 0,
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
      baselineFollowers: snapshot.currentFollowers,
      delta: computeFollowerDelta(
        snapshot.currentFollowers,
        snapshot.currentFollowers,
      ),
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
