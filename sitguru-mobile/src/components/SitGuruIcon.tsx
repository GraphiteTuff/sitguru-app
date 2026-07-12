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

  trusted: ShieldCheck,
  rewards: PawPrint,

  home: Home,
  explore: Search,
  profile: User,

  sun: Sun,
  moon: Moon,
  send: Send,
};

function PetWalkIcon({
  size,
  color,
  strokeWidth,
}: Required<Pick<SitGuruIconProps, 'size' | 'color' | 'strokeWidth'>>) {
  const leashWidth = Math.max(1.5, strokeWidth - 0.2);

  return (
    <View style={[styles.customIcon, { height: size, width: size }]}>
      <Dog
        size={size * 0.9}
        color={color}
        strokeWidth={strokeWidth}
        style={{
          left: -size * 0.02,
          position: 'absolute',
          top: size * 0.04,
        }}
      />

      <View
        style={[
          styles.walkLeashLine,
          {
            borderColor: color,
            borderTopWidth: leashWidth,
            right: size * 0.03,
            top: size * 0.26,
            width: size * 0.35,
          },
        ]}
      />

      <View
        style={[
          styles.walkLeashLoop,
          {
            borderColor: color,
            borderWidth: leashWidth,
            height: size * 0.26,
            right: -size * 0.01,
            top: size * 0.35,
            width: size * 0.18,
          },
        ]}
      />
    </View>
  );
}

function DropInIcon({
  size,
  color,
  strokeWidth,
}: Required<Pick<SitGuruIconProps, 'size' | 'color' | 'strokeWidth'>>) {
  return (
    <View style={[styles.customIcon, { height: size, width: size }]}>
      <House
        size={size * 0.92}
        color={color}
        strokeWidth={strokeWidth}
        style={{
          left: size * 0.02,
          position: 'absolute',
          top: size * 0.03,
        }}
      />

      <PawPrint
        size={size * 0.34}
        color={color}
        strokeWidth={strokeWidth + 0.15}
        style={{
          left: size * 0.34,
          position: 'absolute',
          top: size * 0.43,
        }}
      />

      <ClipboardCheck
        size={size * 0.34}
        color={color}
        strokeWidth={strokeWidth}
        style={{
          position: 'absolute',
          right: -size * 0.05,
          top: -size * 0.03,
        }}
      />
    </View>
  );
}

function SittingIcon({
  size,
  color,
  strokeWidth,
}: Required<Pick<SitGuruIconProps, 'size' | 'color' | 'strokeWidth'>>) {
  return (
    <View style={[styles.customIcon, { height: size, width: size }]}>
      <Heart
        size={size * 0.92}
        color={color}
        strokeWidth={strokeWidth}
        style={{
          left: size * 0.04,
          position: 'absolute',
          top: size * 0.08,
        }}
      />

      <PawPrint
        size={size * 0.44}
        color={color}
        strokeWidth={strokeWidth + 0.25}
        style={{
          left: size * 0.28,
          position: 'absolute',
          top: size * 0.31,
        }}
      />
    </View>
  );
}

function BoardingIcon({
  size,
  color,
  strokeWidth,
}: Required<Pick<SitGuruIconProps, 'size' | 'color' | 'strokeWidth'>>) {
  return (
    <View style={[styles.customIcon, { height: size, width: size }]}>
      <House
        size={size * 0.94}
        color={color}
        strokeWidth={strokeWidth}
        style={{
          left: size * 0.03,
          position: 'absolute',
          top: size * 0.08,
        }}
      />

      <PawPrint
        size={size * 0.33}
        color={color}
        strokeWidth={strokeWidth + 0.2}
        style={{
          left: size * 0.34,
          position: 'absolute',
          top: size * 0.48,
        }}
      />

      <Moon
        size={size * 0.3}
        color={color}
        strokeWidth={strokeWidth}
        style={{
          position: 'absolute',
          right: -size * 0.03,
          top: -size * 0.02,
        }}
      />
    </View>
  );
}

function BookingIcon({
  size,
  color,
  strokeWidth,
}: Required<Pick<SitGuruIconProps, 'size' | 'color' | 'strokeWidth'>>) {
  return (
    <View style={[styles.customIcon, { height: size, width: size }]}>
      <CalendarDays
        size={size * 0.9}
        color={color}
        strokeWidth={strokeWidth}
        style={{
          left: size * 0.05,
          position: 'absolute',
          top: size * 0.04,
        }}
      />

      <PawPrint
        size={size * 0.28}
        color={color}
        strokeWidth={strokeWidth + 0.1}
        style={{
          left: size * 0.36,
          position: 'absolute',
          top: size * 0.48,
        }}
      />
    </View>
  );
}

function MessagePetIcon({
  size,
  color,
  strokeWidth,
}: Required<Pick<SitGuruIconProps, 'size' | 'color' | 'strokeWidth'>>) {
  return (
    <View style={[styles.customIcon, { height: size, width: size }]}>
      <MessageCircle
        size={size * 0.92}
        color={color}
        strokeWidth={strokeWidth}
        style={{
          left: size * 0.04,
          position: 'absolute',
          top: size * 0.04,
        }}
      />

      <PawPrint
        size={size * 0.28}
        color={color}
        strokeWidth={strokeWidth + 0.1}
        style={{
          left: size * 0.36,
          position: 'absolute',
          top: size * 0.34,
        }}
      />
    </View>
  );
}

export function SitGuruIcon({
  name,
  size = 22,
  color,
  strokeWidth = 2.3,
}: SitGuruIconProps) {
  const theme = useTheme();
  const iconColor = color ?? theme.colors.icon;

  if (name === 'walks') {
    return <PetWalkIcon size={size} color={iconColor} strokeWidth={strokeWidth} />;
  }

  if (name === 'dropIns') {
    return <DropInIcon size={size} color={iconColor} strokeWidth={strokeWidth} />;
  }

  if (name === 'sitting') {
    return <SittingIcon size={size} color={iconColor} strokeWidth={strokeWidth} />;
  }

  if (name === 'boarding') {
    return <BoardingIcon size={size} color={iconColor} strokeWidth={strokeWidth} />;
  }

  if (name === 'bookings') {
    return <BookingIcon size={size} color={iconColor} strokeWidth={strokeWidth} />;
  }

  if (name === 'messages') {
    return <MessagePetIcon size={size} color={iconColor} strokeWidth={strokeWidth} />;
  }

  const IconComponent = iconMap[name];

  return (
    <IconComponent
      size={size}
      color={iconColor}
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
  customIcon: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    overflow: 'visible',
    position: 'relative',
  },
  walkLeashLine: {
    borderRadius: 999,
    position: 'absolute',
    transform: [{ rotate: '28deg' }],
  },
  walkLeashLoop: {
    borderRadius: 999,
    position: 'absolute',
    transform: [{ rotate: '-18deg' }],
  },
});