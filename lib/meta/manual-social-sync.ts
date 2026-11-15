"use server";

import { revalidatePath } from "next/cache";
import { getAdminIdentity } from "@/lib/admin/access";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { loadSocialConnectorStatus } from "@/lib/growth-center-v2/social-connectors";
import {
  fetchOfficialMetaSnapshot,
  persistOfficialMetaSnapshot,
  type MetaPlatform,
} from "@/lib/meta/social-analytics";

export type MetaManualSyncResult = {
  ok: boolean;
  message: string;
  results: Array<{
    platform: MetaPlatform;
    ok: boolean;
    followers: number | null;
    updatedAt: string | null;
    error: string | null;
  }>;
};

const META_PLATFORMS: readonly MetaPlatform[] = ["facebook", "instagram"];

function failureLabel(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const http = message.match(/Meta (?:facebook|instagram) API returned HTTP (\d{3})/);
  if (http) return `Meta API HTTP ${http[1]}. Check account permissions or token validity.`;
  if (message.includes("credential")) return "A server-side Meta credential is missing.";
  if (message.includes("Cannot read") || message.includes("Cannot save")) {
    return "Supabase could not read or write verified social metrics. Check the social metrics migration.";
  }
  if (message.includes("unexpected") || message.includes("expected SitGuru account")) {
    return "Meta returned an unexpected account. Verify the connected SitGuru identity.";
  }
  if (message.includes("invalid")) return "Meta returned an invalid response or follower count.";
  return "Synchronization failed. Check the Vercel function logs.";
}

/** Founder-only first-sync/refresh; no credentials or raw Meta responses enter the browser. */
export async function syncOfficialMetaNow(): Promise<MetaManualSyncResult> {
  const actor = await getAdminIdentity();
  if (!actor?.isSuperUser) {
    return { ok: false, message: "SitGuru super-admin access is required.", results: [] };
  }
  if (process.env.META_SOCIAL_SYNC_ENABLED !== "true") {
    return { ok: false, message: "Meta synchronization is disabled in production.", results: [] };
  }

  // Avoid needless repeat API calls from accidental double-clicks or refreshes.
  const current = await loadSocialConnectorStatus();
  const now = Date.now();
  const recentlySynced = META_PLATFORMS.every((platform) => {
    const source = current.find((item) => item.platform === platform);
    const age = now - Date.parse(source?.lastSyncedAt || "");
    return source?.status === "connected" && Number.isFinite(age) && age >= 0 && age < 60_000;
  });
  if (recentlySynced) {
    return {
      ok: true,
      message: "Both platforms were verified within the last minute. Displaying their latest snapshots.",
      results: META_PLATFORMS.map((platform) => {
        const source = current.find((item) => item.platform === platform);
        return {
          platform,
          ok: true,
          followers: source?.followers ?? null,
          updatedAt: source?.lastSyncedAt ?? null,
          error: null,
        };
      }),
    };
  }

  const attempted = await Promise.all(
    META_PLATFORMS.map(async (platform) => {
      try {
        const fetched = await fetchOfficialMetaSnapshot(platform);
        const saved = await persistOfficialMetaSnapshot(supabaseAdmin, fetched);
        return {
          platform,
          ok: true,
          followers: saved.followers,
          updatedAt: saved.updatedAt,
          error: null,
        };
      } catch (error) {
        // The fetcher never emits tokens or raw Meta error bodies.
        console.error(`Owner-triggered Meta sync (${platform}) failed:`,
          error instanceof Error ? error.message : "Unknown error");
        return {
          platform,
          ok: false,
          followers: null,
          updatedAt: null,
          error: failureLabel(error),
        };
      }
    }),
  );

  for (const path of [
    "/manager/results",
    "/manager/metrics",
    "/manager/reports",
    "/manager/insights",
    "/admin/growth/reports",
    "/admin/growth",
  ]) {
    revalidatePath(path);
  }

  // Confirm that the exact verified source consumed by all cards can read the saved rows.
  const verified = await loadSocialConnectorStatus();
  const results = attempted.map((attempt) => {
    const source = verified.find((row) => row.platform === attempt.platform);
    if (attempt.ok && (source?.status !== "connected" || source.followers == null)) {
      return {
        ...attempt,
        ok: false,
        error: "Meta returned data, but the dashboard cannot read its verified Supabase snapshot.",
      };
    }
    return attempt;
  });
  const ok = results.every((result) => result.ok);
  return {
    ok,
    message: ok
      ? "Facebook and Instagram follower snapshots are verified and ready on the existing cards."
      : "One or more platforms still need attention. No unverified values were displayed.",
    results,
  };
}
