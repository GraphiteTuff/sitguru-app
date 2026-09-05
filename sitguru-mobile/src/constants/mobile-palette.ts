import { BrandColors } from '@/constants/theme';
import { SitGuruBrand } from '@/constants/role-palettes';

/**
 * Shared light/dark chrome for mobile screens that still use local getPalette().
 * Prefer this over hardcoded #087449 / #0D5C3A on buttons and chips.
 */
export function getMobileChromePalette(isDark: boolean) {
  return {
    background: isDark ? '#06140F' : BrandColors.warmWhite,
    surface: isDark ? '#0B2118' : BrandColors.white,
    surfaceSoft: isDark ? '#102D21' : BrandColors.cream,
    surfaceGreen: isDark ? '#123E2A' : BrandColors.greenMist,
    border: isDark ? '#234B38' : BrandColors.border,
    title: isDark ? '#FFF5E8' : BrandColors.ink,
    text: isDark ? '#E8EEE9' : BrandColors.charcoal,
    muted: isDark ? '#9DB0A5' : BrandColors.slate,
    placeholder: isDark ? '#809187' : BrandColors.muted,
    primary: isDark ? '#4CD98A' : SitGuruBrand.petParent,
    guruPrimary: isDark ? '#5CE09A' : SitGuruBrand.guru,
    primaryDark: isDark ? '#1C9F5E' : BrandColors.greenDark,
    primarySoft: isDark ? '#123E2A' : BrandColors.greenSoft,
    onPrimary: isDark ? '#06140F' : BrandColors.white,
    marketing: SitGuruBrand.marketing,
    orange: BrandColors.coral,
    orangeSoft: isDark ? '#3A1A12' : BrandColors.coralSoft,
    gold: BrandColors.gold,
    danger: isDark ? '#FF8F7A' : BrandColors.danger,
    warning: isDark ? '#F4C76A' : BrandColors.warning,
    avatarBg: isDark ? '#173527' : BrandColors.greenMist,
    avatarBorder: isDark ? '#2E6C4B' : BrandColors.white,
    navMuted: isDark ? '#9BAAA1' : BrandColors.slate,
  } as const;
}

export type MobileChromePalette = ReturnType<typeof getMobileChromePalette>;
