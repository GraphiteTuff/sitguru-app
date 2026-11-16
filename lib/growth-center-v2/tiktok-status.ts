import type { SocialConnectorStatus } from "./types";

/**
 * A single account's authoritative social status for every SitGuru portal.
 * TikTok Sandbox responses may describe a real test account, but must NEVER
 * be passed to official production followers, totals, KPIs, or exports.
 */
type SourceRow = Record<string, unknown> | null | undefined;
const MAX_AGE_MS = 36 * 60 * 60 * 1000;

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function validCount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}

function freshMetric(row: SourceRow, now: number): boolean {
  const time = Date.parse(str(row?.updated_at));
  const age = now - time;
  return Boolean(row && Number.isFinite(time) && age >= -5 * 60 * 1000 && age <= MAX_AGE_MS);
}

export function deriveTikTokSocialStatus(input: {
  connection?: SourceRow;
  productionMetric?: SourceRow;
  sandboxMetric?: SourceRow;
  now?: number;
}): SocialConnectorStatus {
  const { connection, productionMetric, sandboxMetric, now = Date.now() } = input;
  const metadata = connection?.metadata;
  const environment =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? str((metadata as Record<string, unknown>).environment)
      : "";
  const connectionStatus = str(connection?.status);
  const authorized = connectionStatus === "connected";
  const accountLabel = authorized ? "@sitguruofficial" : null;

  if (environment === "sandbox") {
    const sandboxAt = str(sandboxMetric?.updated_at) || null;
    const followers =
      authorized && freshMetric(sandboxMetric, now)
        ? validCount(sandboxMetric?.current_followers)
        : null;
    const isConnected = followers !== null;
    return {
      platform: "tiktok",
      label: "TikTok",
      status: isConnected ? "sandbox_connected" : "error",
      accountLabel,
      lastSyncedAt: null,
      followers: null,
      baselineFollowers: null,
      sandboxFollowers: followers,
      sandboxLastSyncedAt: sandboxAt,
      setupHint: isConnected
        ? "Sandbox API connected; figures are for integration testing and excluded from official follower totals. Production approval is required for live KPI reporting."
        : "TikTok Sandbox authorization exists, but the last test snapshot is unavailable, invalid, or stale. Reconnect or resync the test account.",
    };
  }

  if (environment === "production") {
    const productionAt = str(productionMetric?.updated_at) || null;
    const followers =
      authorized && freshMetric(productionMetric, now)
        ? validCount(productionMetric?.current_followers)
        : null;
    const baseline =
      followers !== null ? validCount(productionMetric?.baseline_followers) : null;
    return {
      platform: "tiktok",
      label: "TikTok",
      status: followers !== null ? "connected" : "error",
      accountLabel,
      lastSyncedAt: productionAt,
      followers,
      baselineFollowers: baseline,
      sandboxFollowers: null,
      sandboxLastSyncedAt: null,
      setupHint:
        followers !== null
          ? "Verified TikTok production API follower count, captured at the time shown."
          : "TikTok production account data is unavailable or stale. Check authorization, token refresh, and the scheduled sync.",
    };
  }

  return {
    platform: "tiktok",
    label: "TikTok",
    status: "not_configured",
    accountLabel: null,
    lastSyncedAt: null,
    followers: null,
    baselineFollowers: null,
    sandboxFollowers: null,
    sandboxLastSyncedAt: null,
    setupHint:
      "TikTok is not authorized. Connect the sandbox for testing; verified production figures require approved production OAuth.",
  };
}