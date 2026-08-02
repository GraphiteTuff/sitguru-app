/**
 * Rogue tool: fetch live social follower metrics + deltas from Supabase.
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
    "Fetch live SitGuru social follower metrics from social_platform_metrics (brand, rogue, delilah × Instagram/Facebook/TikTok/X/YouTube). Returns current_followers, baseline_followers, and delta (current - baseline). Use whenever someone asks about follower counts, social growth, Instagram/TikTok/YouTube/X/Facebook stats, Rogue or Delilah social reach, or pack social media performance. You are fully authorized to report these numbers.",
  parameters: z.object({
    entityId: z
      .string()
      .optional()
      .describe(
        "Optional entity filter: brand | rogue | delilah | ambassador id. Omit for all tracked entities.",
      ),
  }),
  execute: async (params: SocialToolParams) =>
    runFetchLiveSocialFollowers(params),
});
