import { supabaseAdmin } from "@/lib/supabase/admin";
import { OFFICIAL_META_ENTITY_ID } from "@/lib/meta/social-analytics";
import { OFFICIAL_TIKTOK_ENTITY_ID } from "@/lib/tiktok/social-analytics";
import { OFFICIAL_X_ENTITY_ID } from "@/lib/x/social-analytics";
import type { SocialConnectorStatus } from "./types";

const PLATFORMS = [
  { platform: "facebook" as const, label: "Facebook" },
  { platform: "instagram" as const, label: "Instagram" },
  { platform: "tiktok" as const, label: "TikTok" },
  { platform: "youtube" as const, label: "YouTube" },
  { platform: "x" as const, label: "X" },
];

type AnyRow = Record<string, unknown>;
const MAX_META_AGE_MS = 36 * 60 * 60 * 1000; // daily 06:00 UTC scheduled run + grace

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
function count(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

/**
 * Growth Center's official Meta follower source is a dedicated row named
 * brand_meta_official, never a legacy seed or a summed AI persona total.
 * If stale or unavailable, we display "unavailable" instead of made-up values.
 */
export async function loadSocialConnectorStatus(): Promise<SocialConnectorStatus[]> {
  let connectionRows: AnyRow[] = [];
  try {
    const { data, error } = await supabaseAdmin
      .from("growth_social_connections")
      .select("platform,status,account_label,last_synced_at,error_message,metadata")
      .limit(20);
    if (!error && Array.isArray(data)) connectionRows = data as AnyRow[];
  } catch {
    connectionRows = [];
  }

  let metricRows: AnyRow[] = [];
  try {
    // 'handle' is not part of the canonical social_platform_metrics migration.
    const { data, error } = await supabaseAdmin
      .from("social_platform_metrics")
      .select("entity_id,platform,current_followers,baseline_followers,updated_at")
      .in("entity_id", [OFFICIAL_META_ENTITY_ID, OFFICIAL_TIKTOK_ENTITY_ID, OFFICIAL_X_ENTITY_ID, "brand"])
      .limit(100);
    if (!error && Array.isArray(data)) metricRows = data as AnyRow[];
  } catch {
    metricRows = [];
  }

  return PLATFORMS.map((item): SocialConnectorStatus => {
    if (item.platform === "facebook" || item.platform === "instagram") {
      const verified = metricRows.find(
        (row) =>
          text(row.entity_id) === OFFICIAL_META_ENTITY_ID &&
          text(row.platform) === item.platform,
      );
      const lastSyncedAt = text(verified?.updated_at) || null;
      const syncDate = lastSyncedAt ? Date.parse(lastSyncedAt) : NaN;
      const age = Date.now() - syncDate;
      const fresh = Boolean(
        verified &&
        Number.isFinite(age) &&
        age >= -5 * 60 * 1000 &&
        age <= MAX_META_AGE_MS,
      );
      const followers = fresh ? count(verified?.current_followers) : null;
      const baselineFollowers = fresh ? count(verified?.baseline_followers) : null;
      const available = fresh && followers != null;
      return {
        platform: item.platform,
        label: item.label,
        status: !verified ? "not_configured" : available ? "connected" : "error",
        accountLabel: item.platform === "facebook" ? "SitGuru" : "@sitgurupetcare",
        lastSyncedAt,
        followers: available ? followers : null,
        baselineFollowers: available ? baselineFollowers : null,
        setupHint: !verified
          ? "Official Meta API sync is not active; historic seeded totals are excluded."
          : !available
            ? "Official Meta data is stale or invalid. Check the protected sync and token expiration."
            : "Verified Meta Graph API follower count, captured at the time shown.",
      };
    }

    if (item.platform === "tiktok") {
      const connection = connectionRows.find((row) => text(row.platform) === "tiktok");
      const metadata = connection?.metadata as { environment?: unknown } | null | undefined;
      const isProductionAuthorization = metadata?.environment === "production";
      const verified = metricRows.find(
        (row) => text(row.entity_id) === OFFICIAL_TIKTOK_ENTITY_ID && text(row.platform) === "tiktok",
      );
      const lastSyncedAt = isProductionAuthorization ? text(verified?.updated_at) || null : null;
      const age = lastSyncedAt ? Date.now() - Date.parse(lastSyncedAt) : NaN;
      const fresh = Boolean(
        verified && Number.isFinite(age) && age >= -5 * 60 * 1000 && age <= MAX_META_AGE_MS,
      );
      const followers = fresh && isProductionAuthorization ? count(verified?.current_followers) : null;
      const baselineFollowers = fresh && isProductionAuthorization ? count(verified?.baseline_followers) : null;
      const available = followers != null;
      return {
        platform: "tiktok",
        label: "TikTok",
        status: !isProductionAuthorization || !verified ? "not_configured" : available ? "connected" : "error",
        accountLabel: isProductionAuthorization ? "@sitguruofficial" : null,
        lastSyncedAt,
        followers: available ? followers : null,
        baselineFollowers: available ? baselineFollowers : null,
        setupHint: !isProductionAuthorization
          ? "TikTok sandbox is for testing only; public follower KPIs require approved production OAuth."
          : !available
            ? "TikTok API is not yet synchronized or the last verified snapshot is stale."
            : "Official TikTok API statistics, captured at the time shown.",
      };
    }

    if (item.platform === "x") {
      const conn = connectionRows.find((row) => text(row.platform) === "x");
      const metadata = conn?.metadata as { environment?: unknown } | null | undefined;
      const isProduction = metadata?.environment === "production";
      const verified = metricRows.find(
        (row) => text(row.entity_id) === OFFICIAL_X_ENTITY_ID && text(row.platform) === "x",
      );
      const lastSyncedAt = isProduction ? text(verified?.updated_at) || null : null;
      const age = lastSyncedAt ? Date.now() - Date.parse(lastSyncedAt) : NaN;
      const fresh = Boolean(
        verified && Number.isFinite(age) && age >= -5 * 60 * 1000 && age <= MAX_META_AGE_MS,
      );
      const followers = fresh && isProduction ? count(verified?.current_followers) : null;
      const baselineFollowers = fresh && isProduction ? count(verified?.baseline_followers) : null;
      const available = text(conn?.status) === "connected" && followers != null;
      return {
        platform: "x",
        label: "X",
        status: !isProduction || !verified ? "not_configured" : available ? "connected" : "error",
        accountLabel: isProduction ? "@SitGuruOfficial" : null,
        lastSyncedAt,
        followers: available ? followers : null,
        baselineFollowers: available ? baselineFollowers : null,
        setupHint: !isProduction
          ? "X OAuth has not been authorized in production. Staging data is not used for public KPIs."
          : !available
            ? "X API statistics are stale or unavailable; sync requires founder approval and API credits."
            : "Verified X API follower count, captured at the time shown.",
      };
    }

    // Other platforms are not connected to official APIs in this phase.
    // Historical seed rows are explicitly excluded from verified follower KPIs.
    const conn = connectionRows.find(
      (row) => text(row.platform).toLowerCase() === item.platform,
    );
    const manual = metricRows.some(
      (row) =>
        text(row.entity_id) === "brand" &&
        text(row.platform) === item.platform,
    );
    const connectionStatus = text(conn?.status).toLowerCase();
    const status: SocialConnectorStatus["status"] =
      connectionStatus === "error"
        ? "error"
        : manual || connectionStatus === "manual"
          ? "manual"
          : "not_configured";

    return {
      platform: item.platform,
      label: item.label,
      status,
      accountLabel: text(conn?.account_label) || null,
      lastSyncedAt: text(conn?.last_synced_at) || null,
      followers: null,
      baselineFollowers: null,
      setupHint: "Official API not verified. Seeded and manual follower values are excluded.",
    };
  });
}
