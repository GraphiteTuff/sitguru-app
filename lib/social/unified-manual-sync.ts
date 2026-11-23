"use server";

import { revalidatePath } from "next/cache";
import { getAdminIdentity } from "@/lib/admin/access";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { syncOfficialMetaNow } from "@/lib/meta/manual-social-sync";
import { syncAuthorizedTikTok } from "@/lib/tiktok/social-analytics";
import { platformRefreshMode, recentlyRefreshed, type UnifiedPlatform } from "@/lib/social/unified-sync-policy";

export type UnifiedSocialSyncItem = {
  platform: UnifiedPlatform;
  status: "updated" | "fresh" | "skipped" | "failed" | "manual";
  followers: number | null;
  detail: string;
};
export type UnifiedSocialSyncResult = {
  ok: boolean;
  message: string;
  checkedAt: string;
  results: UnifiedSocialSyncItem[];
};

const FLAGS = () => ({
  metaEnabled: process.env.META_SOCIAL_SYNC_ENABLED === "true",
  tiktokEnabled: process.env.TIKTOK_SOCIAL_SYNC_ENABLED === "true",
  tiktokProduction: process.env.TIKTOK_OAUTH_MODE === "production" &&
    process.env.SITGURU_ISOLATED_STAGING !== "true",
});

/** Explicit founder-only sync. Never purchases X API credits or publishes posts.
 * Meta is supported; TikTok is included only after production authorization.
 * X remains an independent opt-in paid lookup. YouTube awaits an official API integration.
 */
export async function syncConnectedSocialNow(): Promise<UnifiedSocialSyncResult> {
  const actor = await getAdminIdentity();
  if (!actor?.isSuperUser) {
    return {
      ok: false,
      message: "Founder/admin authorization is required to sync social API followers.",
      checkedAt: new Date().toISOString(),
      results: [],
    };
  }

  const flags = FLAGS();
  const rows: UnifiedSocialSyncItem[] = [];
  if (platformRefreshMode("facebook", flags) === "sync") {
    try {
      const result = await syncOfficialMetaNow();
      for (const platform of ["facebook", "instagram"] as const) {
        const item = result.results.find((row) => row.platform === platform);
        rows.push({
          platform,
          status: item?.ok ? "updated" : "failed",
          followers: item?.followers ?? null,
          detail: item?.ok ? "Verified API snapshot available" :
            item?.error || "Official Meta API data could not be refreshed.",
        });
      }
    } catch {
      for (const platform of ["facebook", "instagram"] as const) {
        rows.push({
          platform, status: "failed", followers: null,
          detail: "Meta synchronization is unavailable; existing verified snapshots are preserved.",
        });
      }
    }
  } else {
    for (const platform of ["facebook", "instagram"] as const) {
      rows.push({
        platform, status: "skipped", followers: null,
        detail: "Official Meta synchronization is not enabled.",
      });
    }
  }

  if (platformRefreshMode("tiktok", flags) === "sync") {
    try {
      const { data, error } = await supabaseAdmin
        .from("growth_social_connections")
        .select("status,last_synced_at,metadata,token_ciphertext")
        .eq("platform", "tiktok")
        .maybeSingle();
      const metadata = data?.metadata as { environment?: unknown } | null | undefined;
      if (error) {
        rows.push({
          platform: "tiktok", status: "failed", followers: null,
          detail: "TikTok account connection could not be checked.",
        });
      } else if (data?.status !== "connected" || !data.token_ciphertext ||
        metadata?.environment !== "production") {
        rows.push({
          platform: "tiktok", status: "skipped", followers: null,
          detail: "Production TikTok analytics are not connected. Sandbox statistics are excluded.",
        });
      } else if (recentlyRefreshed(data.last_synced_at, Date.now())) {
        rows.push({
          platform: "tiktok", status: "fresh", followers: null,
          detail: "Production TikTok snapshot was recently updated; no duplicate request sent.",
        });
      } else {
        const snapshot = await syncAuthorizedTikTok();
        rows.push({
          platform: "tiktok", status: "updated", followers: snapshot.followers,
          detail: "Production TikTok follower snapshot verified.",
        });
      }
    } catch {
      rows.push({
        platform: "tiktok", status: "failed", followers: null,
        detail: "TikTok production authorization or statistics API requires attention.",
      });
    }
  } else {
    rows.push({
      platform: "tiktok", status: "skipped", followers: null,
      detail: "TikTok is not authorized for production follower statistics.",
    });
  }

  rows.push({
    platform: "x", status: "manual", followers: null,
    detail: "X refresh stays separate and requires approval because the API may charge credits.",
  });
  rows.push({
    platform: "youtube", status: "skipped", followers: null,
    detail: "YouTube verified follower statistics are not connected yet.",
  });

  for (const path of [
    "/manager/results", "/manager/metrics", "/manager/insights", "/manager/reports",
    "/admin/growth", "/admin/growth/reports",
  ]) {
    revalidatePath(path);
  }

  const attempted = rows.filter((row) => row.status === "updated" || row.status === "fresh" || row.status === "failed");
  const failed = attempted.filter((row) => row.status === "failed");
  const ok = attempted.length > 0 && failed.length === 0;
  const message = attempted.length === 0
    ? "No eligible production social API connections were available to sync."
    : failed.length > 0
      ? "Connected social snapshots were checked. Review the sources that need attention."
      : "Connected social snapshots are up to date. X remains a separate approved refresh.";

  return { ok, message, checkedAt: new Date().toISOString(), results: rows };
}
