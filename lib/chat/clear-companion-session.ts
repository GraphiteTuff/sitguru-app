/**
 * Clear companion identity + chat persistence when a visitor logs out.
 * Guests must not keep a prior signed-in name (or returning greeting).
 */

import { clearRogueOpeningGreetingSession } from "@/lib/chat/rogue-greetings";

export const COMPANION_NAME_STORAGE_KEY = "sitguru_client_first_name";
export const COMPANION_CHAT_STORAGE_KEY = "sitguru-homepage-lead-chat";
export const COMPANION_CHAT_LEGACY_KEY = "sitguru_chat_history";
export const COMPANION_USER_TYPE_STORAGE_KEY = "sitguru_rogue_user_type";

/** Fired after companion storage is wiped so open chat UIs can reset. */
export const COMPANION_SESSION_CLEARED_EVENT = "sitguru:companion-session-cleared";

function removeKey(storage: Storage, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    // ignore quota / private mode
  }
}

/** Wipe name, audience type, and homepage chat transcript from browser storage. */
export function clearCompanionIdentityStorage() {
  if (typeof window === "undefined") return;

  removeKey(window.localStorage, COMPANION_NAME_STORAGE_KEY);
  removeKey(window.sessionStorage, COMPANION_NAME_STORAGE_KEY);
  removeKey(window.localStorage, COMPANION_USER_TYPE_STORAGE_KEY);
  removeKey(window.sessionStorage, COMPANION_USER_TYPE_STORAGE_KEY);
  removeKey(window.sessionStorage, COMPANION_CHAT_STORAGE_KEY);
  removeKey(window.localStorage, COMPANION_CHAT_LEGACY_KEY);
  removeKey(window.sessionStorage, COMPANION_CHAT_LEGACY_KEY);
  clearRogueOpeningGreetingSession();
}

/** Full logout reset: clear storage and notify any mounted companion UIs. */
export function clearCompanionSessionOnLogout() {
  clearCompanionIdentityStorage();
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(COMPANION_SESSION_CLEARED_EVENT));
  } catch {
    // ignore
  }
}
