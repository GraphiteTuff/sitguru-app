/**
 * Transition helpers for unscoped companion history (pre-user-keyed storage).
 *
 * Never attribute guest / shared-device transcripts to the next signed-in account.
 */

export const LEGACY_MOBILE_STORAGE_PREFIX = "sitguru:companion-chat:v1";
export const CURRENT_MOBILE_STORAGE_PREFIX = "sitguru:companion-chat:v2";

export const LEGACY_WEB_STORAGE_KEYS = [
  "sitguru-homepage-lead-chat",
  "sitguru_chat_history",
] as const;

/** True when a key is the old unscoped mobile format. */
export function isLegacyMobileCompanionKey(key: string): boolean {
  return key.startsWith(`${LEGACY_MOBILE_STORAGE_PREFIX}:`);
}

/**
 * Decide whether local transcript bytes may be shown for the active account.
 * Legacy unscoped keys are never reusable after authentication.
 */
export function mayRestoreLocalCompanionHistory(opts: {
  storageKey: string;
  signedInUserId: string | null;
}): boolean {
  if (isLegacyMobileCompanionKey(opts.storageKey)) {
    return false;
  }
  if (!opts.signedInUserId) {
    // Guests may keep guest-scoped v2 keys only.
    return opts.storageKey.includes(":guest:");
  }
  return opts.storageKey.includes(`:${opts.signedInUserId}:`);
}
