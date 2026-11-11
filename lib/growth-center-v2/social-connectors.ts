import { supabaseAdmin } from "@/lib/supabase/admin";
import type { SocialConnectorStatus } from "./types";

const PLATFORMS = [
  {
    platform: "facebook" as const,
    label: "Facebook",
    setupHint:
      "Connect via Meta Graph API with an approved SitGuru Business app, or import CSV metrics until OAuth is authorized.",
  },
  {
    platform: "instagram" as const,
    label: "Instagram",
    setupHint:
      "Requires Meta Instagram Graph permissions. Manual follower baselines remain available from social_platform_metrics.",
  },
  {
    platform: "tiktok" as const,
    label: "TikTok",
    setupHint:
      "TikTok Marketing / Display API credentials are not configured. Use manual CSV import for post-level stats.",
  },
  {
    platform: "youtube" as const,
    label: "YouTube",
    setupHint:
      "YouTube Analytics API OAuth is not configured. Channel follower baselines can be stored manually.",
  },
  {
    platform: "x" as const,
    label: "X",
    setupHint:
      "X API access is not configured. Do not invent engagement numbers — connect or import first.",
  },
];

type AnyRow = Record<string, unknown>;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function num(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Honest connector status. Never claims OAuth is live without a connection row.
 * Falls back to social_platform_metrics as manual/seeded follower data.
 */
export async function loadSocialConnectorStatus(): Promise<SocialConnectorStatus[]> {
  let connectionRows: AnyRow[] = [];
  try {
    const { data, error } = await supabaseAdmin
      .from("growth_social_connections")
      .select("platform,status,account_label,last_synced_at,error_message")
      .limit(20);
    if (!error && Array.isArray(data)) connectionRows = data as AnyRow[];
  } catch {
    connectionRows = [];
  }

  let metricRows: AnyRow[] = [];
  try {
    const { data, error } = await supabaseAdmin
      .from("social_platform_metrics")
      .select(
        "entity_id,platform,handle,current_followers,baseline_followers,updated_at",
      )
      .limit(100);
    if (!error && Array.isArray(data)) metricRows = data as AnyRow[];
  } catch {
    metricRows = [];
  }

  return PLATFORMS.map((item) => {
    const conn = connectionRows.find(
      (row) => text(row.platform).toLowerCase() === item.platform,
    );
    const metrics = metricRows.filter(
      (row) => text(row.platform).toLowerCase() === item.platform,
    );
    const followers = metrics.reduce((sum, row) => sum + (num(row.current_followers) || 0), 0);
    const baseline = metrics.reduce(
      (sum, row) => sum + (num(row.baseline_followers) || 0),
      0,
    );
    const latestSync = metrics
      .map((row) => text(row.updated_at))
      .filter(Boolean)
      .sort()
      .at(-1) || null;

    if (conn) {
      const statusRaw = text(conn.status).toLowerCase();
      const status =
        statusRaw === "connected"
          ? "connected"
          : statusRaw === "error"
            ? "error"
            : statusRaw === "manual"
              ? "manual"
              : "not_configured";
      return {
        platform: item.platform,
        label: item.label,
        status,
        accountLabel: text(conn.account_label) || null,
        lastSyncedAt: text(conn.last_synced_at) || latestSync,
        followers: followers || null,
        baselineFollowers: baseline || null,
        setupHint: text(conn.error_message) || item.setupHint,
      };
    }

    if (metrics.length) {
      return {
        platform: item.platform,
        label: item.label,
        status: "manual" as const,
        accountLabel:
          metrics.map((row) => text(row.handle)).filter(Boolean).join(", ") ||
          "Manual / seeded metrics",
        lastSyncedAt: latestSync,
        followers: followers || null,
        baselineFollowers: baseline || null,
        setupHint:
          "Showing seeded social_platform_metrics only — official API not connected.",
      };
    }

    return {
      platform: item.platform,
      label: item.label,
      status: "not_configured" as const,
      accountLabel: null,
      lastSyncedAt: null,
      followers: null,
      baselineFollowers: null,
      setupHint: item.setupHint,
    };
  });
}
