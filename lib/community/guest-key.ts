const GUEST_KEY_STORAGE = "sitguru_event_guest_key";

function createGuestKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

/** Stable browser guest id for Attending? without sign-in. */
export function getOrCreateEventGuestKey(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(GUEST_KEY_STORAGE);
    if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) return existing;
    const next = createGuestKey().slice(0, 64);
    window.localStorage.setItem(GUEST_KEY_STORAGE, next);
    return next;
  } catch {
    return createGuestKey().slice(0, 64);
  }
}
