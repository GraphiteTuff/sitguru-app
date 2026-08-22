/**
 * SitGuru mobile reliability contract.
 * Miss the warning column and search, chat, and launch start to feel broken.
 */

export const PERF_BASELINES = {
  warmLaunchMs: { target: 1_000, warn: 2_500 },
  apiLatencyMs: { target: 200, warn: 500 },
  uiFrameRate: { target: 60, preferred: 120 },
  batteryPercentPerActiveHour: { target: 1.5 },
} as const;

export function markPerf(label: string, startedAt: number, warnAfterMs: number) {
  const elapsed = Date.now() - startedAt;
  if (!__DEV__ || elapsed < warnAfterMs) return elapsed;
  console.warn(`[sitguru-perf] ${label} ${elapsed}ms (warn > ${warnAfterMs}ms)`);
  return elapsed;
}
