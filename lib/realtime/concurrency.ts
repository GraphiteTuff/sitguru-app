/**
 * Lightweight concurrency helpers (req 100).
 * Prefer status/version guards on writes; surface stale opens in the UI.
 */

export type RecordVersionInput = {
  openedAt?: string | null;
  currentUpdatedAt?: string | null;
  expectedStatus?: string | null;
  currentStatus?: string | null;
};

export type RecordVersionResult =
  | { ok: true }
  | { ok: false; reason: "stale_version" | "status_changed"; message: string };

export const STALE_RECORD_MESSAGE =
  "This record changed since you opened it.";

export function checkRecordVersion(
  input: RecordVersionInput,
): RecordVersionResult {
  if (
    input.expectedStatus &&
    input.currentStatus &&
    input.expectedStatus !== input.currentStatus
  ) {
    return {
      ok: false,
      reason: "status_changed",
      message: STALE_RECORD_MESSAGE,
    };
  }

  if (input.openedAt && input.currentUpdatedAt) {
    const opened = Date.parse(input.openedAt);
    const current = Date.parse(input.currentUpdatedAt);
    if (
      Number.isFinite(opened) &&
      Number.isFinite(current) &&
      current > opened
    ) {
      return {
        ok: false,
        reason: "stale_version",
        message: STALE_RECORD_MESSAGE,
      };
    }
  }

  return { ok: true };
}
