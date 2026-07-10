import { Platform } from 'react-native';

export type AppThemeMode = 'light' | 'dark';

export const BrandColors = {
  green: '#176B4C',
  greenDark: '#0F4D38',
  greenSoft: '#DCEFE6',
  greenMist: '#EEF8F2',

  cream: '#FFF8EF',
  warmWhite: '#FFFCF7',
  sand: '#F4E7D3',

  coral: '#F2785C',
  coralSoft: '#FFE2D8',

  gold: '#F4B740',
  goldSoft: '#FFF1C7',

  sage: '#A9C7B2',
  sageSoft: '#EAF3ED',

  ink: '#18211C',
  charcoal: '#29332D',
  slate: '#66736B',
  muted: '#8A958E',

  border: '#E6DED2',
  borderStrong: '#D7CDBF',

  success: '#1F8A5B',
  warning: '#C98217',
  danger: '#C2412D',
  info: '#2F6FB2',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export const Colors = {
  light: {
    text: BrandColors.ink,
    background: BrandColors.warmWhite,
    backgroundElement: BrandColors.cream,
    backgroundSelected: BrandColors.greenSoft,
    textSecondary: BrandColors.slate,

    primary: BrandColors.green,
    primaryDark: BrandColors.greenDark,
    primarySoft: BrandColors.greenSoft,

    accent: BrandColors.coral,
    accentSoft: BrandColors.coralSoft,

    highlight: BrandColors.gold,
    highlightSoft: BrandColors.goldSoft,

    card: BrandColors.white,
    cardWarm: BrandColors.cream,

    border: BrandColors.border,
    borderStrong: BrandColors.borderStrong,

    muted: BrandColors.muted,

    success: BrandColors.success,
    warning: BrandColors.warning,
    danger: BrandColors.danger,
    info: BrandColors.info,
  },
  dark: {
    text: '#F7FAF8',
    background: '#08110D',
    backgroundElement: '#0D1A14',
    backgroundSelected: '#1E3B2B',
    textSecondary: '#B8C5BD',

    primary: '#75C69A',
    primaryDark: '#A4E3BC',
    primarySoft: '#1E3B2B',

    accent: '#FF987F',
    accentSoft: '#3D211B',

    highlight: '#FFD166',
    highlightSoft: '#3B2D12',

    card: '#101D17',
    cardWarm: '#172A20',

    border: '#23372C',
    borderStrong: '#405247',

    muted: '#93A299',

    success: '#75C69A',
    warning: '#FFD166',
    danger: '#FF806D',
    info: '#8ABCF2',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 10,
  medium: 16,
  large: 22,
  xlarge: 30,
  pill: 999,
} as const;

export const Shadows = {
  soft: {
    shadowColor: BrandColors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  card: {
    shadowColor: BrandColors.ink,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  button: {
    shadowColor: BrandColors.greenDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

export const Typography = {
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
  },
  heading: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
  },
  subheading: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyStrong: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  small: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;

export const MaxContentWidth = 800;

const common = {
  fonts: Fonts,
  spacing: Spacing,
  radius: Radius,
  shadows: Shadows,
  typography: Typography,
  bottomTabInset: BottomTabInset,
  maxContentWidth: MaxContentWidth,
};

export const LightTheme = {
  mode: 'light' as const,

  colors: {
    ...Colors.light,

    logo: BrandColors.green,
    logoText: BrandColors.greenDark,

    screen: BrandColors.warmWhite,
    screenAlt: BrandColors.cream,

    heroBackground: BrandColors.cream,
    heroAccent: BrandColors.greenMist,

    elevatedCard: BrandColors.white,
    softCard: BrandColors.cream,

    tabBar: BrandColors.white,
    tabBarBorder: BrandColors.border,

    input: '#F6EFE4',
    inputText: BrandColors.ink,
    inputPlaceholder: '#8A7F70',

    chip: '#F4EDE2',
    chipActive: BrandColors.green,
    chipText: BrandColors.charcoal,
    chipActiveText: BrandColors.white,

    icon: BrandColors.green,
    iconMuted: BrandColors.muted,

    badge: BrandColors.gold,
    badgeText: BrandColors.greenDark,

    divider: BrandColors.border,

    overlay: 'rgba(24, 33, 28, 0.42)',

    toggleTrack: '#F5EADC',
    toggleTrackActive: BrandColors.green,
    toggleThumb: BrandColors.white,

    profileOverlay: '#101814',
  },

  gradients: {
    hero: [BrandColors.warmWhite, BrandColors.cream],
    card: [BrandColors.white, BrandColors.cream],
    profile: ['rgba(16, 24, 20, 0)', 'rgba(16, 24, 20, 0.96)'],
  },

  ...common,
};

export const DarkTheme = {
  mode: 'dark' as const,

  colors: {
    ...Colors.dark,

    logo: '#A6DDBB',
    logoText: '#DDF7E6',

    screen: '#08110D',
    screenAlt: '#0D1A14',

    heroBackground: '#0D1A14',
    heroAccent: '#143325',

    elevatedCard: '#14241C',
    softCard: '#172A20',

    tabBar: '#0B1510',
    tabBarBorder: '#23372C',

    input: '#13231B',
    inputText: '#F7FAF8',
    inputPlaceholder: '#93A299',

    chip: '#16251D',
    chipActive: '#75C69A',
    chipText: '#D6E7DD',
    chipActiveText: '#0D1A14',

    icon: '#A6DDBB',
    iconMuted: '#93A299',

    badge: '#F4B740',
    badgeText: '#0D1A14',

    divider: '#23372C',

    overlay: 'rgba(0, 0, 0, 0.52)',

    toggleTrack: '#14241C',
    toggleTrackActive: '#75C69A',
    toggleThumb: '#F7FAF8',

    profileOverlay: '#08110D',
  },

  gradients: {
    hero: ['#08110D', '#0D1A14'],
    card: ['#101D17', '#172A20'],
    profile: ['rgba(8, 17, 13, 0)', 'rgba(8, 17, 13, 0.98)'],
  },

  ...common,
};

export type AppTheme = typeof LightTheme;

export const AppThemes = {
  light: LightTheme,
  dark: DarkTheme,
} as const;

export function getAppTheme(mode: AppThemeMode = 'light') {
  return mode === 'dark' ? DarkTheme : LightTheme;
}

export const appStyles = {
  screenPadding: 20,
  sectionGap: 18,
  cardGap: 12,

  headerHeight: 64,
  bottomNavHeight: Platform.select({ ios: 86, android: 78, default: 78 }) ?? 78,

  touchTarget: 44,

  primaryButtonHeight: 52,
  secondaryButtonHeight: 48,

  avatarSmall: 36,
  avatarMedium: 52,
  avatarLarge: 76,

  heroImageHeight: 178,
  guruCardImageHeight: 210,
} as const;

export const SitGuruMockupCopy = {
  tagline: 'Local pet care. Trusted people.',
  heroTitle: 'Local pet care that feels personal.',
  heroSubtitle: 'Book trusted Gurus for walks, drop-ins, sitting, and more.',
  lightModeLabel: 'Light Mode',
  darkModeLabel: 'Dark Mode',
  trustedLocalCare: 'Trusted local care',
  verifiedGurus: 'Verified Gurus',
  backgroundChecked: 'Background Checked',
  securePayments: 'Secure Payments',
  rewards: 'PawPoints Rewards',
} as const;