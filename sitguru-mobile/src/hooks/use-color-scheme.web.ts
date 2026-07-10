/**
 * SitGuru color scheme controller for web.
 *
 * Supports:
 * - Light Mode
 * - Dark Mode
 * - System Mode
 *
 * Uses localStorage on web so the homepage theme toggle remembers the user's
 * choice across refreshes. Falls back safely to light mode during static render.
 */

import { useEffect, useSyncExternalStore } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

export type SitGuruThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'sitguru-theme-preference';

let themePreference: SitGuruThemePreference = 'system';
let systemScheme: ColorSchemeName = Appearance.getColorScheme();

const listeners = new Set<() => void>();

function canUseDOM() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function readStoredPreference(): SitGuruThemePreference {
  if (!canUseDOM()) return 'system';

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }

  return 'system';
}

function writeStoredPreference(preference: SitGuruThemePreference) {
  if (!canUseDOM()) return;

  window.localStorage.setItem(STORAGE_KEY, preference);
}

function applyDocumentTheme(scheme: NonNullable<ColorSchemeName>) {
  if (!canUseDOM()) return;

  document.documentElement.dataset.theme = scheme;
  document.documentElement.style.colorScheme = scheme;
}

function emitThemeChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function resolveScheme(): NonNullable<ColorSchemeName> {
  if (themePreference === 'light') return 'light';
  if (themePreference === 'dark') return 'dark';

  return systemScheme ?? 'light';
}

function getSnapshot(): NonNullable<ColorSchemeName> {
  return resolveScheme();
}

function hydratePreferenceFromStorage() {
  themePreference = readStoredPreference();
  applyDocumentTheme(resolveScheme());
}

export function getThemePreference() {
  return themePreference;
}

export function setThemePreference(preference: SitGuruThemePreference) {
  themePreference = preference;
  writeStoredPreference(preference);
  applyDocumentTheme(resolveScheme());
  emitThemeChange();
}

export function toggleThemePreference() {
  const nextPreference: SitGuruThemePreference =
    resolveScheme() === 'dark' ? 'light' : 'dark';

  setThemePreference(nextPreference);
}

export function useThemePreference() {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    hydratePreferenceFromStorage();
    emitThemeChange();

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      systemScheme = colorScheme;
      applyDocumentTheme(resolveScheme());
      emitThemeChange();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return themePreference;
}

export function useColorScheme(): NonNullable<ColorSchemeName> {
  const scheme = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    hydratePreferenceFromStorage();
    emitThemeChange();

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      systemScheme = colorScheme;
      applyDocumentTheme(resolveScheme());
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