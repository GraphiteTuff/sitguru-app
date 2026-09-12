import { Text, TextInput } from 'react-native';

/**
 * Dynamic Type / Android font-scale policy:
 * letters grow with the phone setting, but chrome stays on-screen.
 */
export const MAX_FONT_SIZE_MULTIPLIER = 1.35;
export const MAX_CHROME_FONT_MULTIPLIER = 1.22;

export const readableTextProps = {
  allowFontScaling: true,
  maxFontSizeMultiplier: MAX_FONT_SIZE_MULTIPLIER,
} as const;

type HostDefaults = {
  allowFontScaling?: boolean;
  maxFontSizeMultiplier?: number;
};

/**
 * RN 0.85 host component types no longer expose defaultProps.
 * The runtime still accepts them on Text / TextInput, which keeps Dynamic Type
 * capped app-wide without wrapping every screen.
 */
function patchHostDefaults(component: object, defaults: HostDefaults) {
  const host = component as { defaultProps?: HostDefaults | null };
  host.defaultProps = {
    ...(host.defaultProps ?? {}),
    ...defaults,
  };
}

/** Call once at app boot so every Text / TextInput follows the phone size. */
export function applyReadableTypeDefaults() {
  patchHostDefaults(Text, readableTextProps);
  patchHostDefaults(TextInput, readableTextProps);
}
