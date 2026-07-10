/**
 * SitGuru color scheme controller for native.
 *
 * Supports:
 * - Light Mode
 * - Dark Mode
 * - System Mode
 *
 * This gives the homepage toggle a clean way to switch the whole app theme
 * without touching booking, messaging, auth, Supabase, or Stripe logic.
 */

import { useEffect, useSyncExternalStore } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

export type SitGuruThemePreference = 'light' | 'dark' | 'system';

let themePreference: SitGuruThemePreference = 'system';
let systemScheme: ColorSchemeName = Appearance.getColorScheme();

const listeners = new Set<() => void>();

function emitThemeChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ColorSchemeName {
  if (themePreference === 'light') return 'light';
  if (themePreference === 'dark') return 'dark';

  return systemScheme ?? 'light';
}

export function getThemePreference() {
  return themePreference;
}

export function setThemePreference(preference: SitGuruThemePreference) {
  themePreference = preference;
  emitThemeChange();
}

export function toggleThemePreference() {
  themePreference = getSnapshot() === 'dark' ? 'light' : 'dark';
  emitThemeChange();
}

export function useThemePreference() {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return themePreference;
}

export function useColorScheme(): NonNullable<ColorSchemeName> {
  const scheme = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      systemScheme = colorScheme;
      emitThemeChange();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return scheme ?? 'light';
}

export function useIsDarkColorScheme() {
  return useColorScheme() === 'dark';
}