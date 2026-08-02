/**
 * AI-callable tool: fetchLiveSocialFollowers
 *
 * Rogue (scope: admin) → brand @SitGuruOfficial pack totals / new today.
 * Delilah (scope: ambassador) → individual influencer / ambassador handles.
 *
 * SERVER ONLY — registered on admin AI routes via Vercel AI SDK `tool()`.
 */

import { tool } from "ai";
import { z } from "zod";
import {
  getNewFollowersToday,
  SOCIAL_PLATFORMS,
  SITGURU_BRAND_ENTITY_ID,
  type NewFollowersTodayResult,
  type SocialPlatform,
} from "@/lib/services/socialMediaClient";
import { SITGURU_OFFICIAL_HANDLE } from "@/lib/chat/sitguru-social";
import { supabaseAdmin } from "@/lib/supabase/admin";

const platformSchema = z
  .enum(["instagram", "facebook", "tiktok", "x", "all"])
  .optional()
  .describe(
    "Social platform to query. Use 'all' (default) for a pack rollup across Instagram, Facebook, TikTok, and X.",
  );

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

function formatDeltaLine(row: NewFollowersTodayResult): string {
  const sign =
    row.newFollowersToday > 0
      ? `+${formatNumber(row.newFollowersToday)}`
      : formatNumber(row.newFollowersToday);
  const status =
    row.source === "live"
      ? "live"
      : row.source === "cached"
        ? "cached (live API unavailable)"
        : "unavailable";
  const err = row.error ? ` — note: ${row.error}` : "";
  return `- **${row.platform}** @${row.handle}: ${sign} new today · ${formatNumber(row.currentFollowers)} total (baseline ${formatNumber(row.baselineFollowersStartOfDay)}) [${status}]${err}`;
}

async function resolveAmbassadorEntity(opts: {
  ambassadorId?: string;
  handle?: string;
}): Promise<{ entityId: string; handle?: string; label: string }> {
  const ambassadorId = String(opts.ambassadorId || "").trim();
  const handle = String(opts.handle || "")
    .trim()
    .replace(/^@/, "");

  if (ambassadorId) {
    const { data } = await supabaseAdmin
      .from("ambassadors")
      .select("id,display_name,referral_code,email")
      .eq("id", ambassadorId)
      .maybeSingle();

    const display =
      (data as { display_name?: string | null } | null)?.display_name ||
      (data as { referral_code?: string | null } | null)?.referral_code ||
      ambassadorId;

    return {
      entityId: ambassadorId,
      handle: handle || undefined,
      label: String(display),
    };
  }

  if (handle) {
    // Prefer an existing metrics row keyed by this handle.
    const { data: metric } = await supabaseAdmin
      .from("social_platform_metrics")
      .select("entity_id,handle")
      .ilike("handle", handle)
      .limit(1)
      .maybeSingle();

    if (metric?.entity_id) {
      return {
        entityId: String(metric.entity_id),
        handle: String(metric.handle || handle),
        label: `@${handle}`,
      };
    }

    // Fall back to ambassador lead social_handle when present.
    try {
      const { data: lead } = await supabaseAdmin
        .from("ambassador_leads")
        .select("id,social_handle,full_name,first_name,last_name")
        .ilike("social_handle", `%${handle}%`)
        .limit(1)
        .maybeSingle();

      if (lead && typeof lead === "object" && "id" in lead) {
        const row = lead as {
          id: string;
          full_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          social_handle?: string | null;
        };
        const label =
          row.full_name ||
          [row.first_name, row.last_name].filter(Boolean).join(" ") ||
          `@${handle}`;
        return {
          entityId: `lead:${row.id}`,
          handle,
          label,
        };
      }
    } catch (error) {
      console.warn(
        "[fetchLiveSocialFollowers] lead lookup skipped:",
        error instanceof Error ? error.message : error,
      );
    }

    return {
      entityId: `handle:${handle.toLowerCase()}`,
      handle,
      label: `@${handle}`,
    };
  }

  return {
    entityId: SITGURU_BRAND_ENTITY_ID,
    handle: SITGURU_OFFICIAL_HANDLE.replace(/^@/, ""),
    label: SITGURU_OFFICIAL_HANDLE,
  };
}

async function collectResults(opts: {
  platforms: SocialPlatform[];
  handle?: string;
  entityId: string;
}): Promise<NewFollowersTodayResult[]> {
  const results: NewFollowersTodayResult[] = [];
  for (const platform of opts.platforms) {
    results.push(
      await getNewFollowersToday(platform, opts.handle, {
        entityId: opts.entityId,
      }),
    );
  }
  return results;
}

export async function executeFetchLiveSocialFollowers(params: {
  scope: "admin" | "ambassador";
  ambassadorId?: string;
  handle?: string;
  platform?: "instagram" | "facebook" | "tiktok" | "x" | "all";
}): Promise<string> {
  const scope = params.scope;
  const platformFilter = params.platform || "all";
  const platforms: SocialPlatform[] =
    platformFilter === "all"
      ? [...SOCIAL_PLATFORMS]
      : [platformFilter as SocialPlatform];

  if (scope === "admin") {
    const brandHandle = SITGURU_OFFICIAL_HANDLE.replace(/^@/, "");
    const rows = await collectResults({
      platforms,
      handle: brandHandle,
      entityId: SITGURU_BRAND_ENTITY_ID,
    });

    const totalNew = rows.reduce((sum, r) => sum + r.newFollowersToday, 0);
    const totalFollowers = rows.reduce((sum, r) => sum + r.currentFollowers, 0);
    const liveCount = rows.filter((r) => r.source === "live").length;

    return [
      `## Live social followers — SitGuru brand (${SITGURU_OFFICIAL_HANDLE})`,
      ``,
      `**New followers today (UTC):** ${formatNumber(totalNew)} across ${rows.length} platform(s)`,
      `**Combined current followers:** ${formatNumber(totalFollowers)}`,
      `**Live API coverage:** ${liveCount}/${rows.length}`,
      ``,
      `### Per platform`,
      ...rows.map(formatDeltaLine),
      ``,
      `_Source: fetchLiveSocialFollowers · scope=admin. Prefer live rows; cached means the API was unavailable and the last DB snapshot was used._`,
    ].join("\n");
  }

  // Ambassador / influencer scope (Delilah)
  const resolved = await resolveAmbassadorEntity({
    ambassadorId: params.ambassadorId,
    handle: params.handle,
  });

  if (!params.ambassadorId && !params.handle) {
    return [
      `## Ambassador social lookup needs a target`,
      ``,
      `Pass \`handle\` (e.g. influencer Instagram username) or \`ambassadorId\` so Delilah can fetch live new-follower deltas.`,
      `Brand pack totals use scope=admin instead.`,
    ].join("\n");
  }

  const rows = await collectResults({
    platforms,
    handle: resolved.handle,
    entityId: resolved.entityId,
  });

  const totalNew = rows.reduce((sum, r) => sum + r.newFollowersToday, 0);

  return [
    `## Live social followers — ambassador / influencer`,
    ``,
    `**Target:** ${resolved.label}${resolved.handle ? ` (@${resolved.handle})` : ""}`,
    `**Entity:** \`${resolved.entityId}\``,
    `**New followers today (UTC):** ${formatNumber(totalNew)}`,
    ``,
    `### Per platform`,
    ...rows.map(formatDeltaLine),
    ``,
    `_Source: fetchLiveSocialFollowers · scope=ambassador. Call again anytime for a fresh live sniff._`,
  ].join("\n");
}

export const fetchLiveSocialFollowersTool = tool({
  description:
    "Fetch LIVE social media follower counts and new-followers-today deltas. Use scope 'admin' for SitGuru brand @SitGuruOfficial (Rogue). Use scope 'ambassador' with handle or ambassadorId for individual influencer / Brand Ambassador tracking (Delilah). Call this whenever the user asks about new followers today, follower growth, Instagram/TikTok/Facebook/X counts — do NOT say social data is unavailable.",
  parameters: z.object({
    scope: z
      .enum(["admin", "ambassador"])
      .describe(
        "'admin' = brand SitGuruOfficial pack (Rogue). 'ambassador' = individual ambassador/influencer (Delilah).",
      ),
    ambassadorId: z
      .string()
      .optional()
      .describe("Optional ambassador UUID when filtering an individual account."),
    handle: z
      .string()
      .optional()
      .describe(
        "Optional social handle (with or without @). Required for most ambassador queries.",
      ),
    platform: platformSchema,
  }),
  execute: async (params) => executeFetchLiveSocialFollowers(params),
});
