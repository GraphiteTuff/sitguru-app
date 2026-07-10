import {
    CalendarDays,
    ClipboardCheck,
    Dog,
    Heart,
    Home,
    House,
    Megaphone,
    MessageCircle,
    Moon,
    PawPrint,
    Search,
    Send,
    ShieldCheck,
    Sun,
    User,
} from 'lucide-react-native';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme, useThemeMode } from '@/hooks/use-theme';

export type SitGuruIconName =
  | 'findGuru'
  | 'becomeGuru'
  | 'ambassador'
  | 'walks'
  | 'dropIns'
  | 'sitting'
  | 'boarding'
  | 'trusted'
  | 'rewards'
  | 'home'
  | 'explore'
  | 'bookings'
  | 'messages'
  | 'profile'
  | 'sun'
  | 'moon'
  | 'send';

type SitGuruIconProps = {
  name: SitGuruIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

type SitGuruIconBadgeProps = SitGuruIconProps & {
  variant?: 'soft' | 'solid' | 'gold' | 'plain';
  badgeSize?: number;
  style?: ViewStyle;
};

const iconMap = {
  findGuru: Search,
  becomeGuru: Heart,
  ambassador: Megaphone,

  walks: Dog,
  dropIns: ClipboardCheck,
  sitting: PawPrint,
  boarding: House,

  trusted: ShieldCheck,
  rewards: PawPrint,

  home: Home,
  explore: Search,
  bookings: CalendarDays,
  messages: MessageCircle,
  profile: User,

  sun: Sun,
  moon: Moon,
  send: Send,
};

export function SitGuruIcon({
  name,
  size = 22,
  color,
  strokeWidth = 2.3,
}: SitGuruIconProps) {
  const theme = useTheme();
  const IconComponent = iconMap[name];

  return (
    <IconComponent
      size={size}
      color={color ?? theme.colors.icon}
      strokeWidth={strokeWidth}
    />
  );
}

export function SitGuruIconBadge({
  name,
  size = 22,
  badgeSize = 48,
  color,
  strokeWidth = 2.3,
  variant = 'soft',
  style,
}: SitGuruIconBadgeProps) {
  const theme = useTheme();
  const themeMode = useThemeMode();
  const isDark = themeMode === 'dark';

  const badgeStyle =
    variant === 'solid'
      ? {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        }
      : variant === 'gold'
        ? {
            backgroundColor: theme.colors.highlightSoft,
            borderColor: theme.colors.highlight,
          }
        : variant === 'plain'
          ? {
              backgroundColor: 'transparent',
              borderColor: 'transparent',
            }
          : {
              backgroundColor: theme.colors.softCard,
              borderColor: theme.colors.border,
            };

  const iconColor =
    color ??
    (variant === 'solid'
      ? isDark
        ? '#08110D'
        : '#FFFFFF'
      : variant === 'gold'
        ? '#0D1A14'
        : theme.colors.icon);

  return (
    <View
      style={[
        styles.badge,
        badgeStyle,
        {
          height: badgeSize,
          width: badgeSize,
          borderRadius: badgeSize / 2,
        },
        style,
      ]}
    >
      <SitGuruIcon
        name={name}
        size={size}
        color={iconColor}
        strokeWidth={strokeWidth}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
  },
});