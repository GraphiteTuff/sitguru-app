import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("storage", callback);
  };
}

/** Read a primitive browser value without changing the server's hydration snapshot. */
export function useBrowserSnapshot<T extends string | number | boolean | null>(
  read: () => T,
  fallback: T,
) {
  return useSyncExternalStore(subscribe, read, () => fallback);
}

function readSearch() {
  return window.location.search;
}

export function useBrowserSearch() {
  return useBrowserSnapshot(readSearch, "");
}
