/**
 * Private, rate-limited import of posts from SitGuru's verified Facebook Page
 * and Instagram business account. Content published in Meta Business Suite is
 * imported even when no Content Studio publication record exists.
 */
import { supabaseAdmin } from "@/lib/supabase/admin";
import { syncProviderPosts, type ProviderSyncResult } from "./provider-sync";

type MetaPlatform = "facebook" | "instagram";
export type MetaSyncOutcome = {
  platform: MetaPlatform;
  status: "imported" | "unavailable" | "recent";
  posts: number;
  note: string;
};
const PLATFORMS: readonly MetaPlatform[] = ["facebook", "instagram"];
const MIN_INTERVAL_MS = 3 * 60 * 1000;
const AUTOMATED_INTERVAL_MS = 45 * 60 * 1000;

async function syncOne(platform: MetaPlatform, automated: boolean): Promise<MetaSyncOutcome> {
  const now = Date.now();
  const { data: previous, error: readError } = await supabaseAdmin
    .from("growth_social_meta_sync_status")
    .select("last_attempt_at,last_success_at,imported_posts,status")
    .eq("platform", platform)
    .maybeSingle();
  if (readError) {
    return { platform, status: "unavailable", posts: 0, note: "Meta sync status storage is unavailable." };
  }
  const elapsed = now - Date.parse(previous?.last_attempt_at || "");
  if (Number.isFinite(elapsed) && elapsed >= 0 &&
    elapsed < (automated ? AUTOMATED_INTERVAL_MS : MIN_INTERVAL_MS)) {
    return {
      platform, status: "recent",
      posts: Number(previous?.imported_posts || 0),
      note: previous?.status === "error"
        ? "A recent attempt was unsuccessful. Review Meta permissions and retry later."
        : "Recently refreshed. Existing published posts remain available.",
    };
  }

  const { error: beginError } = await supabaseAdmin.from("growth_social_meta_sync_status").upsert({
    platform, last_attempt_at: new Date(now).toISOString(), status: "attempted",
    updated_at: new Date(now).toISOString(),
  }, { onConflict: "platform" });
  if (beginError) return {
    platform, status: "unavailable", posts: 0,
    note: "Meta sync status could not be updated.",
  };

  try {
    const result: ProviderSyncResult = await syncProviderPosts(platform);
    const { error: saveError } = await supabaseAdmin.from("growth_social_meta_sync_status")
      .update({
        status: "success",
        imported_posts: result.posts,
        last_success_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("platform", platform);
    if (saveError) throw new Error("Meta sync status write failed.");
    return {
      platform, status: "imported", posts: result.posts,
      note: result.posts
        ? "Official SitGuru published posts and available post insights imported."
        : "No accessible published posts returned for this account.",
    };
  } catch (error) {
    // Provider Graph errors and auth headers must never be exposed to users.
    const safeCategory = error instanceof Error && error.message.startsWith("Facebook Page post permissions")
      ? "page_permissions"
      : error instanceof Error && error.message.startsWith("Facebook Page access token")
        ? "page_access_token"
        : error instanceof Error && error.message.startsWith("Facebook Page credential")
          ? "credential_revoked"
          : error instanceof Error && error.message.startsWith("Meta rate-limited")
            ? "rate_limited"
            : "provider_or_database";
    console.warn("Meta post import failed", platform, safeCategory);
    await supabaseAdmin.from("growth_social_meta_sync_status")
      .update({ status: "error", updated_at: new Date().toISOString() })
      .eq("platform", platform);
    const pageError = platform === "facebook" && error instanceof Error ? error.message : "";
    const safeFacebookMessage = pageError.startsWith("Facebook Page ") ||
      pageError.startsWith("Facebook published-") ||
      pageError.startsWith("Meta rate-limited") ||
      pageError.startsWith("The SitGuru Facebook Page ");
    return {
      platform, status: "unavailable", posts: 0,
      note: safeFacebookMessage
        ? pageError
        : "Meta could not supply this Page's post list. Check access scopes and connection.",
    };
  }
}

export async function syncOfficialMetaPosts(options: { automated?: boolean } = {}) {
  const results = await Promise.all(PLATFORMS.map((p) => syncOne(p, options.automated === true)));
  return { results, refreshed: results.some((r) => r.status === "imported") };
}
