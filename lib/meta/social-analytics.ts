/**
 * Official SitGuru Meta follower snapshots. Server-only: never expose tokens to
 * browser components, logs, query strings, or public API responses.
 *
 * Business/Page asset IDs were verified in Graph API Explorer on 2026-11-15.
 * Keep them explicit so a token cannot silently select a different Page.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type MetaPlatform = "facebook" | "instagram";

export type OfficialMetaSnapshot = {
  platform: MetaPlatform;
  accountId: string;
  accountLabel: string;
  followers: number;
  mediaCount: number | null;
  capturedAt: string;
};

const META_GRAPH_VERSION = "v27.0";
const VERIFIED_IDS: Record<MetaPlatform, string> = {
  facebook: "1115780798285628",
  instagram: "17841475074314025",
};
const VERIFIED_LABELS: Record<MetaPlatform, string> = {
  facebook: "SitGuru",
  instagram: "@sitgurupetcare",
};

/** Distinct from historical, manually seeded 'brand' follower rows. */
export const OFFICIAL_META_ENTITY_ID = "brand_meta_official";

function configuredToken(platform: MetaPlatform) {
  if (platform === "instagram") {
    return (
      process.env.META_INSTAGRAM_ACCESS_TOKEN ||
      process.env.META_SYSTEM_USER_ACCESS_TOKEN ||
      ""
    ).trim();
  }
  return (process.env.META_SYSTEM_USER_ACCESS_TOKEN || "").trim();
}

function nonnegativeInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Meta returned invalid ${label}; refusing to store unverified data.`);
  }
  return value;
}

export async function fetchOfficialMetaSnapshot(
  platform: MetaPlatform,
  options: { token?: string; fetcher?: typeof fetch } = {},
): Promise<OfficialMetaSnapshot> {
  const token = options.token?.trim() || configuredToken(platform);
  if (!token) {
    throw new Error(`Missing server-only Meta credential for ${platform}.`);
  }

  const accountId = VERIFIED_IDS[platform];
  const accountLabel = VERIFIED_LABELS[platform];
  const fields =
    platform === "facebook"
      ? "id,name,followers_count"
      : "id,username,followers_count,media_count";

  const url = new URL(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${accountId}`,
  );
  url.searchParams.set("fields", fields);

  // Keep access tokens in Authorization headers, not URLs, logs or analytics.
  const response = await (options.fetcher || fetch)(url.toString(), {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });

  // Never log Meta's raw error body: it can contain sensitive context.
  if (!response.ok) {
    throw new Error(`Meta ${platform} API returned HTTP ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error(`Meta ${platform} API returned an invalid response.`);
  }
  const row = payload as Record<string, unknown>;
  if (row.error || String(row.id || "") !== accountId) {
    throw new Error(`Meta ${platform} API did not return the expected SitGuru account.`);
  }
  if (platform === "instagram" && row.username !== "sitgurupetcare") {
    throw new Error("Meta returned an unexpected Instagram username.");
  }
  if (platform === "facebook" && row.name !== "SitGuru") {
    throw new Error("Meta returned an unexpected Facebook Page.");
  }

  return {
    platform,
    accountId,
    accountLabel,
    followers: nonnegativeInteger(row.followers_count, "followers_count"),
    mediaCount:
      platform === "instagram"
        ? nonnegativeInteger(row.media_count, "media_count")
        : null,
    capturedAt: new Date().toISOString(),
  };
}

/**
 * Upsert only authenticated Meta snapshots. Initialize the growth baseline
 * once, then preserve it forever; never overwrite it on the next cron run.
 * No extra schema or migration is required beyond social_platform_metrics.
 */
export async function persistOfficialMetaSnapshot(
  admin: SupabaseClient,
  snapshot: OfficialMetaSnapshot,
) {
  const { data: existing, error: readError } = await admin
    .from("social_platform_metrics")
    .select("baseline_followers")
    .eq("entity_id", OFFICIAL_META_ENTITY_ID)
    .eq("platform", snapshot.platform)
    .maybeSingle();

  if (readError) {
    throw new Error(`Cannot read ${snapshot.platform} follower baseline: ${readError.message}`);
  }

  const baseline =
    existing == null
      ? snapshot.followers
      : nonnegativeInteger(existing.baseline_followers, "stored baseline");

  const { error: writeError } = await admin
    .from("social_platform_metrics")
    .upsert(
      {
        entity_id: OFFICIAL_META_ENTITY_ID,
        platform: snapshot.platform,
        current_followers: snapshot.followers,
        baseline_followers: baseline,
        updated_at: snapshot.capturedAt,
      },
      { onConflict: "entity_id,platform" },
    );

  if (writeError) {
    throw new Error(`Cannot save official ${snapshot.platform} metric: ${writeError.message}`);
  }

  return {
    platform: snapshot.platform,
    followers: snapshot.followers,
    baselineFollowers: baseline,
    updatedAt: snapshot.capturedAt,
  };
}
