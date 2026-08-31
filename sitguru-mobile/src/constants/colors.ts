import { BrandColors } from '@/constants/theme';

/**
 * Static light palette for components that predate the themed tokens.
 * Derived from BrandColors so these screens match the design system instead
 * of drifting toward a cooler, greyer green.
 */
export const SitGuruColors = {
  background: '#FAF6EE',
  surface: BrandColors.white,
  surfaceSoft: BrandColors.greenSoft,

  primary: '#1B7A52',
  guruPrimary: '#2A9D6A',
  primaryDark: BrandColors.ink,
  primaryLight: '#C9DDD1',

  text: '#14291F',
  textMuted: '#465349',
  textSoft: '#79857B',

  border: BrandColors.border,
  danger: BrandColors.danger,
  warning: BrandColors.warning,
};
