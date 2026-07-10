import { useMemo } from 'react';

import {
  AppThemeMode,
  Colors,
  DarkTheme,
  getAppTheme,
  LightTheme,
} from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();

  const themeMode: AppThemeMode = scheme === 'dark' ? 'dark' : 'light';

  return useMemo(() => getAppTheme(themeMode), [themeMode]);
}

export function useThemeMode(): AppThemeMode {
  const scheme = useColorScheme();

  return scheme === 'dark' ? 'dark' : 'light';
}

export function useIsDarkMode() {
  return useThemeMode() === 'dark';
}

export function useThemeColors() {
  const mode = useThemeMode();

  return Colors[mode] ?? Colors.light;
}

export { DarkTheme, LightTheme };
