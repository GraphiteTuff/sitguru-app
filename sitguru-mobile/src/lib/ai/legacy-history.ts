/**
 * Transition helpers for unscoped companion history (pre-user-keyed storage).
 * Keep in sync with web `lib/companions/legacy-history.ts`.
 */

export const LEGACY_MOBILE_STORAGE_PREFIX = 'sitguru:companion-chat:v1';
export const CURRENT_MOBILE_STORAGE_PREFIX = 'sitguru:companion-chat:v2';

export function isLegacyMobileCompanionKey(key: string): boolean {
  return key.startsWith(`${LEGACY_MOBILE_STORAGE_PREFIX}:`);
}

export function mayRestoreLocalCompanionHistory(opts: {
  storageKey: string;
  signedInUserId: string | null;
}): boolean {
  if (isLegacyMobileCompanionKey(opts.storageKey)) {
    return false;
  }
  if (!opts.signedInUserId) {
    return opts.storageKey.includes(':guest:');
  }
  return opts.storageKey.includes(`:${opts.signedInUserId}:`);
}

/** Remove only legacy unscoped companion keys from AsyncStorage. */
export async function discardLegacyCompanionCaches(
  getAllKeys: () => Promise<readonly string[]>,
  remove: (key: string) => Promise<void>,
): Promise<number> {
  const keys = await getAllKeys();
  const legacy = keys.filter((key) => isLegacyMobileCompanionKey(key));
  await Promise.all(legacy.map((key) => remove(key)));
  return legacy.length;
}
