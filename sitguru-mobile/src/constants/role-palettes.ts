/**
 * Role-aware greens — warmer pet-parent cream surfaces vs fresher guru mint.
 * Canonical marketing brand remains #0D5C3A; UI surfaces use these tokens.
 */
export const SitGuruBrand = {
  marketing: '#0D5C3A',
  petParent: '#1B7A52',
  guru: '#2A9D6A',
} as const;

export type DashboardRole = 'pet_parent' | 'guru';

export type DashboardPalette = {
  background: string;
  surface: string;
  surfaceSoft: string;
  surfaceGreen: string;
  border: string;
  borderStrong: string;
  title: string;
  text: string;
  muted: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  orange: string;
  gold: string;
  white: string;
  avatarBg: string;
  avatarBorder: string;
  routeBg: string;
  routeStreet: string;
  shadow: string;
  navMuted: string;
};

export function getDashboardPalette(
  role: DashboardRole,
  isDark: boolean,
): DashboardPalette {
  if (role === 'guru') {
    return isDark
      ? {
          background: '#0A1612',
          surface: '#101F19',
          surfaceSoft: '#152A22',
          surfaceGreen: '#1A3D2E',
          border: '#2A4F3D',
          borderStrong: '#3A6B52',
          title: '#F2FAF5',
          text: '#D8E8DF',
          muted: '#9BB5A8',
          primary: '#4CD98A',
          primaryDark: '#2DB87A',
          primarySoft: '#1A3D2E',
          orange: '#F15A3A',
          gold: '#F4B93E',
          white: '#FFFFFF',
          avatarBg: '#1A3D2E',
          avatarBorder: '#3A6B52',
          routeBg: '#152A22',
          routeStreet: '#2A4F3D',
          shadow: '#000000',
          navMuted: '#9BB5A8',
        }
      : {
          background: '#F4FAF6',
          surface: '#FFFFFF',
          surfaceSoft: '#EEF8F2',
          surfaceGreen: '#E2F5EA',
          border: '#D4E8DC',
          borderStrong: '#B8D9C8',
          title: '#0F3D2A',
          text: '#2A5C45',
          muted: '#6B8A78',
          primary: '#2A9D6A',
          primaryDark: '#1F7A52',
          primarySoft: '#DFF4E8',
          orange: '#F15A3A',
          gold: '#F4B93E',
          white: '#FFFFFF',
          avatarBg: '#E8F5EC',
          avatarBorder: '#FFFFFF',
          routeBg: '#E8F2EC',
          routeStreet: '#C8DED0',
          shadow: '#000000',
          navMuted: '#6B8A78',
        };
  }

  return isDark
    ? {
        background: '#0C1814',
        surface: '#12241C',
        surfaceSoft: '#1A3026',
        surfaceGreen: '#1A3D2E',
        border: '#2D5542',
        borderStrong: '#3D6B54',
        title: '#FFF5E8',
        text: '#E8EEE9',
        muted: '#9DB0A5',
        primary: '#4CD98A',
        primaryDark: '#2DB87A',
        primarySoft: '#1A3D2E',
        orange: '#F15A3A',
        gold: '#F4B93E',
        white: '#FFFFFF',
        avatarBg: '#1A3D2E',
        avatarBorder: '#3D6B54',
        routeBg: '#1A3026',
        routeStreet: '#2D5542',
        shadow: '#000000',
        navMuted: '#9DB0A5',
      }
    : {
        background: '#FFFCF7',
        surface: '#FFFFFF',
        surfaceSoft: '#FFF6E9',
        surfaceGreen: '#EEF8E8',
        border: '#E8DDD0',
        borderStrong: '#D8C7B0',
        title: '#123F31',
        text: '#27483E',
        muted: '#738078',
        primary: '#1B7A52',
        primaryDark: '#0F5C3A',
        primarySoft: '#E4F5E9',
        orange: '#F15A3A',
        gold: '#F4B93E',
        white: '#FFFFFF',
        avatarBg: '#EEF5EE',
        avatarBorder: '#FFFFFF',
        routeBg: '#EDF3EE',
        routeStreet: '#D8E1DA',
        shadow: '#000000',
        navMuted: '#748079',
      };
}

export type TabChromePalette = {
  fallback: string;
  border: string;
  activeColor: string;
  mutedColor: string;
  bubble: string;
  tint: string;
};

export function getTabChromePalette(
  role: 'petParent' | 'guru' | 'ambassador' | 'visitor',
  isDark: boolean,
): TabChromePalette {
  if (role === 'guru') {
    return isDark
      ? {
          fallback: '#0E1A15',
          border: 'rgba(74,155,118,0.35)',
          activeColor: '#5CE09A',
          mutedColor: '#8FA89A',
          bubble: 'rgba(74,200,130,0.28)',
          tint: '#0E1A15',
        }
      : {
          fallback: '#FFFFFF',
          border: 'rgba(200,230,210,0.9)',
          activeColor: '#2A9D6A',
          mutedColor: '#7A9488',
          bubble: 'rgba(42,157,106,0.18)',
          tint: '#F8FCF9',
        };
  }

  if (role === 'visitor') {
    return isDark
      ? {
          fallback: '#101A16',
          border: 'rgba(40,70,55,0.6)',
          activeColor: '#58D58A',
          mutedColor: '#8FA096',
          bubble: 'rgba(88,213,138,0.24)',
          tint: '#101A16',
        }
      : {
          fallback: '#FFFFFF',
          border: 'rgba(229,223,212,0.85)',
          activeColor: '#1B7A52',
          mutedColor: '#79857B',
          bubble: 'rgba(27,122,82,0.16)',
          tint: '#FFFCF7',
        };
  }

  return isDark
    ? {
        fallback: '#101A16',
        border: 'rgba(30,59,43,0.7)',
        activeColor: '#58D58A',
        mutedColor: '#8FA096',
        bubble: 'rgba(88,213,138,0.28)',
        tint: '#101A16',
      }
    : {
        fallback: '#FFFFFF',
        border: 'rgba(229,223,212,0.85)',
        activeColor: '#1B7A52',
        mutedColor: '#79857B',
        bubble: 'rgba(27,122,82,0.16)',
        tint: '#FFFCF7',
      };
}
