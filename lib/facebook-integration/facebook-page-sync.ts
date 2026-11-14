import { supabaseAdmin } from "@/lib/supabase/admin";
import { fetchFacebookPageDetails } from "./facebook-page-client";

export async function syncFacebookPageMetrics() {
  const page = await fetchFacebookPageDetails();
  const now = new Date().toISOString();
  const { data: previous, error: previousError } = await supabaseAdmin
    .from("growth_social_connections")
    .select("metadata")
    .eq("platform", "facebook")
    .maybeSingle();
  if (previousError) throw new Error("Unable to read Facebook connection metadata.");
  const previousMeta =
    previous?.metadata && typeof previous.metadata === "object" && !Array.isArray(previous.metadata)
      ? (previous.metadata as Record<string, unknown>)
      : {};
  const verifiedBefore = previousMeta.verified_source === "meta_graph_api" &&
    previousMeta.page_id === page.id;

  if (page.followersCount !== null) {
    const { data: priorMetric, error: priorError } = await supabaseAdmin
      .from("social_platform_metrics")
      .select("baseline_followers")
      .eq("entity_id", "brand")
      .eq("platform", "facebook")
      .maybeSingle();
    if (priorError) throw new Error("Unable to read Facebook follower baseline.");
    const baseline =
      verifiedBefore &&
      typeof priorMetric?.baseline_followers === "number" &&
      Number.isSafeInteger(priorMetric.baseline_followers) &&
      priorMetric.baseline_followers >= 0
        ? priorMetric.baseline_followers
        : page.followersCount;
    const { error: metricError } = await supabaseAdmin
      .from("social_platform_metrics")
      .upsert({
        entity_id: "brand",
        platform: "facebook",
        current_followers: page.followersCount,
        baseline_followers: baseline,
        updated_at: now,
      }, { onConflict: "entity_id,platform" });
    if (metricError) throw new Error("Unable to store verified Facebook follower data.");
  }

  const { error: connectionError } = await supabaseAdmin
    .from("growth_social_connections")
    .upsert({
      platform: "facebook",
      status: "connected",
      account_label: page.name,
      last_synced_at: now,
      error_message: null,
      metadata: {
        ...previousMeta,
        verified_source: "meta_graph_api",
        page_id: page.id,
        follower_count_available: page.followersCount !== null,
        page_likes: page.likesCount,
        read_only: true,
      },
      updated_at: now,
    }, { onConflict: "platform" });
  if (connectionError) throw new Error("Unable to update Facebook connection status.");

  return {
    platform: "facebook" as const,
    status: "connected" as const,
    pageName: page.name,
    pageId: page.id,
    followers: page.followersCount,
    likes: page.likesCount,
    syncedAt: now,
    source: "meta_graph_api" as const,
  };
}
