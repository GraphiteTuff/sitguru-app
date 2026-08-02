/**
 * One-off local seed for public.social_platform_metrics.
 *
 * Self-contained (no local relative service imports) to avoid ERR_MODULE_NOT_FOUND
 * when run via npx tsx from different working directories.
 *
 * Usage (from repo root):
 *   npm run seed-social-baseline
 *   npx tsx --env-file=.env.local scripts/seed-social-baseline.ts
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type SocialPlatform = "instagram" | "facebook" | "tiktok" | "x" | "youtube";
type SocialEntityId = "brand" | "rogue" | "delilah";

const ENTITIES: readonly SocialEntityId[] = ["brand", "rogue", "delilah"];
const PLATFORMS: readonly SocialPlatform[] = [
  "instagram",
  "facebook",
  "tiktok",
  "x",
  "youtube",
];

const FALLBACK_FOLLOWERS: Record<
  SocialEntityId,
  Record<SocialPlatform, number>
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
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function bootstrapEnv() {
  const cwd = process.cwd();
  // Prefer .env.local, then .env; do not overwrite already-exported vars.
  loadEnvFile(resolve(cwd, ".env.local"));
  loadEnvFile(resolve(cwd, ".env"));
  // Also try repo-root relative to this script when cwd is nested.
  loadEnvFile(resolve(cwd, "..", ".env.local"));
  loadEnvFile(resolve(cwd, "..", ".env"));
}

function requireEnv(name: string) {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    throw new Error(
      `Missing ${name}. Set it in .env.local or export it before running:\n` +
        `  NEXT_PUBLIC_SUPABASE_URL=...\n` +
        `  SUPABASE_SERVICE_ROLE_KEY=...\n` +
        `Then: npm run seed-social-baseline`,
    );
  }
  return value;
}

function computeFollowerDelta(current: number, baseline: number) {
  return Math.trunc(current) - Math.trunc(baseline);
}

async function main() {
  bootstrapEnv();

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = new Date().toISOString();
  const rows = ENTITIES.flatMap((entityId) =>
    PLATFORMS.map((platform) => {
      const followers = FALLBACK_FOLLOWERS[entityId][platform];
      return {
        entity_id: entityId,
        platform,
        current_followers: followers,
        baseline_followers: followers,
        updated_at: now,
      };
    }),
  );

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
