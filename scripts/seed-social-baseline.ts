/**
 * One-off local seed for public.social_platform_metrics.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/seed-social-baseline.ts
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional (live APIs — unused when missing/placeholder):
 *   META_ACCESS_TOKEN, X_BEARER_TOKEN, TIKTOK_CLIENT_KEY
 */

import { createClient } from "@supabase/supabase-js";
import {
  SOCIAL_TRACKED_ENTITIES,
  SOCIAL_TRACKED_PLATFORMS,
  computeFollowerDelta,
  fetchLiveFollowerCount,
  type SocialEntityId,
  type SocialPlatform,
} from "../services/socialMediaClient";

function requireEnv(name: string) {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

async function main() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const rows: Array<{
    entity_id: SocialEntityId;
    platform: SocialPlatform;
    current_followers: number;
    baseline_followers: number;
    updated_at: string;
  }> = [];

  for (const entityId of SOCIAL_TRACKED_ENTITIES) {
    for (const platform of SOCIAL_TRACKED_PLATFORMS) {
      const snapshot = await fetchLiveFollowerCount({ entityId, platform });
      rows.push({
        entity_id: entityId,
        platform,
        current_followers: snapshot.currentFollowers,
        baseline_followers: snapshot.currentFollowers,
        updated_at: new Date().toISOString(),
      });
    }
  }

  const { data, error } = await admin
    .from("social_platform_metrics")
    .upsert(rows, { onConflict: "entity_id,platform" })
    .select(
      "id, entity_id, platform, current_followers, baseline_followers, updated_at",
    );

  if (error) {
    throw new Error(
      `Failed to seed social_platform_metrics: ${error.message}. ` +
        "Apply supabase/migrations/20260802_social_metrics.sql first.",
    );
  }

  const seeded = data || [];
  console.log(
    JSON.stringify(
      {
        ok: true,
        seeded: seeded.length,
        rows: seeded.map((row) => ({
          ...row,
          delta: computeFollowerDelta(
            Number(row.current_followers),
            Number(row.baseline_followers),
          ),
        })),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "seed-social-baseline failed",
  );
  process.exit(1);
});
