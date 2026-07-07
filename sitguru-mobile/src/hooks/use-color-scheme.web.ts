import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Web-safe color scheme hook.
 *
 * Expo Router static rendering can render before the browser fully hydrates.
 * Returning light as the fallback keeps the app stable during web/static rendering.
 */
export function useColorScheme() {
  return useRNColorScheme() ?? 'light';
}