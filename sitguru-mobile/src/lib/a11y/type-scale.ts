import { Text, TextInput } from 'react-native';

/**
 * Dynamic Type / Android font-scale policy:
 * letters grow with the phone setting, but chrome stays on-screen.
 */
export const MAX_FONT_SIZE_MULTIPLIER = 1.35;
export const MAX_CHROME_FONT_MULTIPLIER = 1.22;

type HostDefaults = {
  allowFontScaling?: boolean;
  maxFontSizeMultiplier?: number;
};

function patchHostDefaults(
  component: { defaultProps?: HostDefaults | null },
  defaults: HostDefaults,
) {
  component.defaultProps = {
    ...(component.defaultProps ?? {}),
    ...defaults,
  };
}

/** Call once at app boot so every Text / TextInput follows the phone size. */
export function applyReadableTypeDefaults() {
  const defaults = {
    allowFontScaling: true,
    maxFontSizeMultiplier: MAX_FONT_SIZE_MULTIPLIER,
  } as const;

  patchHostDefaults(Text, defaults);
  patchHostDefaults(TextInput, defaults);
}
