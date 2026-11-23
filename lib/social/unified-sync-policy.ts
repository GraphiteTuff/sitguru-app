/** Unified SitGuru social refresh policy.
 * A dashboard refresh reads existing snapshots. Only an explicit owner action
 * can contact social APIs; X never runs from the shared button or a cron.
 */
export type UnifiedPlatform = "facebook" | "instagram" | "tiktok" | "x" | "youtube";

export function platformRefreshMode(
  platform: UnifiedPlatform,
  flags: { metaEnabled: boolean; tiktokEnabled: boolean; tiktokProduction: boolean },
): "sync" | "manual-paid" | "unavailable" {
  if (platform === "x") return "manual-paid";
  if (platform === "youtube") return "unavailable";
  if (platform === "tiktok") {
    return flags.tiktokEnabled && flags.tiktokProduction ? "sync" : "unavailable";
  }
  return flags.metaEnabled ? "sync" : "unavailable";
}

/** Short cooldown avoids duplicate requests when multiple refreshes overlap. */
export function recentlyRefreshed(
  timestamp: string | null | undefined,
  now = Date.now(),
  intervalMs = 120_000,
): boolean {
  const parsed = timestamp ? Date.parse(timestamp) : NaN;
  const age = now - parsed;
  return Number.isFinite(age) && age >= 0 && age < intervalMs;
}
