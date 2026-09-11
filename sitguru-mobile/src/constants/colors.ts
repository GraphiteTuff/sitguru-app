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

  primary: '#2FA36B',
  guruPrimary: '#2FA36B',
  primaryDark: '#214C35',
  primaryLight: '#CFE5D7',

  text: '#214C35',
  textMuted: '#465349',
  textSoft: '#79857B',

  border: BrandColors.border,
  danger: BrandColors.danger,
  warning: BrandColors.warning,
};
