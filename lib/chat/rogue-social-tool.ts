/**
 * Rogue tool: fetch social follower metrics + deltas.
 * Prefers config/social-metrics.json when Meta/X/TikTok tokens are missing
 * or unauthorized (Consumer app restriction bypass).
 * SERVER ONLY — do not import from client components.
 */

import { tool } from "ai";
import { z } from "zod";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { fetchLiveSocialFollowers } from "@/services/socialMediaClient";

type SocialToolParams = {
  entityId?: string;
};

async function runFetchLiveSocialFollowers(
  params: SocialToolParams,
): Promise<string> {
  // Cast avoids Proxy/SupabaseClient type recursion through the AI SDK tool generics.
  const result = await fetchLiveSocialFollowers(supabaseAdmin as never, {
    entityId: params.entityId,
  });
  return result.digest;
}

export const fetchLiveSocialFollowersTool = tool({
  description:
    "Fetch SitGuru social follower metrics (brand / rogue / delilah × Instagram, Facebook, TikTok, X/Twitter, YouTube). Reads config/social-metrics.json when live Meta tokens are unavailable, otherwise social_platform_metrics. Returns current_followers, baseline_followers, and delta (current - baseline). Facebook is currently tracked at 20 followers in the JSON config. Use whenever someone asks about follower counts, social growth, or pack social performance. You are fully authorized to report these exact numbers.",
  parameters: z.object({
    entityId: z
      .string()
      .optional()
      .describe(
        "Optional entity filter: brand | rogue | delilah | ambassador id. Omit for brand channels from config/social-metrics.json.",
      ),
  }),
  execute: async (params: SocialToolParams) =>
    runFetchLiveSocialFollowers(params),
});
