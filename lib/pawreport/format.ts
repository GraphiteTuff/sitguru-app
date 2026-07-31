// lib/pawreport/format.ts
/** Display helpers for walk metrics shown on PawReport Live cards. */

export function metersToMilesLabel(meters: number) {
  const safe = Number.isFinite(meters) ? Math.max(0, meters) : 0;
  const miles = safe / 1609.344;
  return `${miles.toFixed(1)} mi`;
}

export function secondsToDurationLabel(seconds: number) {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0;
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;

  if (mins < 60) {
    return secs > 0 && mins < 10 ? `${mins} min ${secs}s` : `${mins} min`;
  }

  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}

export function calculateDurationSeconds(
  startedAt?: string | null,
  endedAt?: string | null,
) {
  if (!startedAt) return 0;

  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0;

  return Math.round((end - start) / 1000);
}
