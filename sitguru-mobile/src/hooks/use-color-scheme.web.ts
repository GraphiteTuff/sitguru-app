import { useSyncExternalStore } from 'react';

export type SitGuruThemePreference =
  | 'light'
  | 'dark';

const STORAGE_KEY =
  'sitguru-theme-preference';

const listeners =
  new Set<() => void>();

let systemScheme:
  SitGuruThemePreference =
  'light';

let themePreference:
  SitGuruThemePreference =
  'light';

function normalizeStoredPreference(
  value: string | null,
): SitGuruThemePreference | null {
  if (value === 'light') {
    return 'light';
  }

  if (value === 'dark') {
    return 'dark';
  }

  return null;
}

function emitChange() {
  listeners.forEach(
    (listener) => {
      listener();
    },
  );
}

function subscribe(
  listener: () => void,
) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot():
  SitGuruThemePreference {
  return themePreference;
}

function getServerSnapshot():
  SitGuruThemePreference {
  return 'light';
}

if (
  typeof window !== 'undefined'
) {
  const mediaQuery =
    window.matchMedia(
      '(prefers-color-scheme: dark)',
    );

  systemScheme =
    mediaQuery.matches
      ? 'dark'
      : 'light';

  let storedPreference:
    SitGuruThemePreference | null =
    null;

  try {
    storedPreference =
      normalizeStoredPreference(
        window.localStorage.getItem(
          STORAGE_KEY,
        ),
      );
  } catch {
    storedPreference = null;
  }

  themePreference =
    storedPreference ??
    systemScheme;

  const handleSystemThemeChange = (
    event: MediaQueryListEvent,
  ) => {
    systemScheme =
      event.matches
        ? 'dark'
        : 'light';

    let hasStoredPreference =
      false;

    try {
      hasStoredPreference =
        Boolean(
          normalizeStoredPreference(
            window.localStorage.getItem(
              STORAGE_KEY,
            ),
          ),
        );
    } catch {
      hasStoredPreference =
        false;
    }

    if (!hasStoredPreference) {
      themePreference =
        systemScheme;

      emitChange();
    }
  };

  mediaQuery.addEventListener(
    'change',
    handleSystemThemeChange,
  );
}

export function setThemePreference(
  nextPreference:
    SitGuruThemePreference,
) {
  themePreference =
    nextPreference;

  if (
    typeof window !== 'undefined'
  ) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        nextPreference,
      );
    } catch {
      // Continue with the session-only preference.
    }
  }

  emitChange();
}

export function useThemePreference():
  SitGuruThemePreference {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
}

export function useColorScheme():
  SitGuruThemePreference {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
}