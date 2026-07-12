import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import {
  Appearance,
  type ColorSchemeName,
} from 'react-native';

export type SitGuruThemePreference =
  | 'light'
  | 'dark';

const STORAGE_KEY =
  'sitguru-theme-preference';

const listeners =
  new Set<() => void>();

let storedPreferenceLoaded = false;

function normalizeAppearance(
  value:
    | ColorSchemeName
    | null
    | undefined,
): SitGuruThemePreference {
  return value === 'dark'
    ? 'dark'
    : 'light';
}

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

let systemScheme:
  SitGuruThemePreference =
  normalizeAppearance(
    Appearance.getColorScheme(),
  );

let themePreference:
  SitGuruThemePreference =
  systemScheme;

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

void AsyncStorage.getItem(
  STORAGE_KEY,
)
  .then(
    (
      storedValue: string | null,
    ) => {
      const storedPreference =
        normalizeStoredPreference(
          storedValue,
        );

      if (storedPreference) {
        themePreference =
          storedPreference;
      }

      storedPreferenceLoaded =
        true;

      emitChange();
    },
  )
  .catch(() => {
    storedPreferenceLoaded =
      true;
  });

Appearance.addChangeListener(
  ({
    colorScheme,
  }: {
    colorScheme: ColorSchemeName;
  }) => {
    systemScheme =
      normalizeAppearance(
        colorScheme,
      );

    if (!storedPreferenceLoaded) {
      themePreference =
        systemScheme;

      emitChange();
    }
  },
);

export function setThemePreference(
  nextPreference:
    SitGuruThemePreference,
) {
  themePreference =
    nextPreference;

  storedPreferenceLoaded =
    true;

  emitChange();

  void AsyncStorage.setItem(
    STORAGE_KEY,
    nextPreference,
  );
}

export function useThemePreference():
  SitGuruThemePreference {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );
}

export function useColorScheme():
  SitGuruThemePreference {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );
}