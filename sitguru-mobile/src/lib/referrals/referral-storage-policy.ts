const CAPTURE_SKEW_MS = 15 * 1000;
const NEW_ACCOUNT_MS = 15 * 60 * 1000;

function normalizeCode(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");
}

export function isNewAcquisitionAccount(
  createdAt?: string | null,
  now = Date.now(),
) {
  const created = Date.parse(String(createdAt || ""));
  if (!Number.isFinite(created)) return false;
  return now >= created && now - created <= NEW_ACCOUNT_MS;
}

/**
 * Same code with a server seal stays put.
 * A different code replaces the pending seal before signup.
 */
export function shouldReplaceStoredReferralSeal(input: {
  existingCode?: string | null;
  incomingCode?: string | null;
  existingCapturedAt?: string | null;
  existingMac?: string | null;
}) {
  const incoming = normalizeCode(input.incomingCode);
  if (!incoming) return false;
  const existing = normalizeCode(input.existingCode);
  if (existing === incoming && input.existingCapturedAt && input.existingMac) {
    return false;
  }
  return true;
}

/**
 * A sealed capture uses auth.users.created_at against that time.
 * Without a seal, the 15-minute window is only the local fallback.
 * The server still applies the capture rule.
 */
export function shouldAttemptMobileAcquisition(input: {
  createdAt?: string | null;
  capturedAt?: string | null;
  now?: number;
}) {
  const created = Date.parse(String(input.createdAt || ""));
  const captured = Date.parse(String(input.capturedAt || ""));
  if (Number.isFinite(captured)) {
    return Number.isFinite(created) && created + CAPTURE_SKEW_MS >= captured;
  }
  return isNewAcquisitionAccount(input.createdAt, input.now);
}

/** Matches web shouldClearPendingReferral. Failed locks keep storage. */
export function shouldClearStoredReferral(input: {
  applied?: boolean;
  status?: string | null;
}) {
  return input.applied === true || input.status === "already_locked";
}
