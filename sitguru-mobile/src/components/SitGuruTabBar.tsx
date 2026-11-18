import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  CalendarDays,
  Home,
  type LucideIcon,
  Map,
  MessageCircle,
  Search,
  Share2,
  User,
  Wallet,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  type LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BubblePressable from '@/components/BubblePressable';
import GlassChrome from '@/components/mobile/GlassChrome';
import { AppFonts } from '@/constants/fonts';
import { TOUCH_MIN } from '@/constants/mobile-layout';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useThemeMode } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import type { AppRole } from '@/types/auth';

export type SitGuruTabRole = 'petParent' | 'guru' | 'ambassador';

export type SitGuruTabKey =
  | 'home'
  | 'explore'
  | 'bookings'
  | 'messages'
  | 'profile'
  | 'careMap'
  | 'referrals'
  | 'payouts';

type TabDefinition = {
  key: SitGuruTabKey;
  label: string;
  icon: LucideIcon;
  href: string;
};

/*
 * Each role gets its own destinations, matching the design mockups:
 * pet parents browse, Gurus run jobs, ambassadors track referrals.
 */
const TAB_SETS: Record<SitGuruTabRole, TabDefinition[]> = {
  petParent: [
    { key: 'home', label: 'Home', icon: Home, href: '/pet-parent-dashboard' },
    { key: 'explore', label: 'Explore', icon: Search, href: '/find-care' },
    {
      key: 'bookings',
      label: 'Bookings',
      icon: CalendarDays,
      href: '/bookings',
    },
    {
      key: 'messages',
      label: 'Messages',
      icon: MessageCircle,
      href: '/messages',
    },
    { key: 'profile', label: 'Profile', icon: User, href: '/account' },
  ],
  guru: [
    { key: 'home', label: 'Dashboard', icon: Home, href: '/guru-dashboard' },
    { key: 'careMap', label: 'Care Map', icon: Map, href: '/guru-care-map' },
    {
      key: 'bookings',
      label: 'Bookings',
      icon: CalendarDays,
      href: '/guru-requests',
    },
    {
      key: 'messages',
      label: 'Messages',
      icon: MessageCircle,
      href: '/messages',
    },
    { key: 'profile', label: 'Profile', icon: User, href: '/guru-profile' },
  ],
  ambassador: [
    { key: 'home', label: 'Home', icon: Home, href: '/ambassador-dashboard' },
    {
      key: 'referrals',
      label: 'Referrals',
      icon: Share2,
      href: '/ambassador-referral-analytics',
    },
    {
      key: 'payouts',
      label: 'Payouts',
      icon: Wallet,
      href: '/ambassador-payouts',
    },
    {
      key: 'messages',
      label: 'Messages',
      icon: MessageCircle,
      href: '/messages',
    },
    { key: 'profile', label: 'Profile', icon: User, href: '/account' },
  ],
};

const SLIDE_SPRING = {
  damping: 18,
  mass: 0.55,
  stiffness: 280,
};

const BUBBLE_SIZE = 46;

function toTabRole(role: AppRole | null): SitGuruTabRole {
  if (role === 'guru') return 'guru';
  if (role === 'ambassador') return 'ambassador';
  return 'petParent';
}

type SitGuruTabBarProps = {
  active: SitGuruTabKey;
  /** Defaults to the signed-in user's primary role. */
  role?: SitGuruTabRole;
  badges?: Partial<Record<SitGuruTabKey, number>>;
};

/**
 * Floating Instagram-style glass pill tab bar:
 * dark translucent dock, sliding active bubble, press bubble + slide.
 */
export default function SitGuruTabBar({
  active,
  role,
  badges,
}: SitGuruTabBarProps) {
  const insets = useSafeAreaInsets();
  const isDark = useThemeMode() === 'dark';
  const reduceMotion = useReducedMotion();
  const { primaryRole, profile } = useAuth();

  const resolvedRole = role ?? toTabRole(primaryRole);
  const tabs = TAB_SETS[resolvedRole];
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.key === active),
  );

  const [tabWidth, setTabWidth] = useState(0);
  const slideX = useSharedValue(0);

  const avatarUrl = profile?.avatar_url?.trim() || '';
  const profileBadgeCount = badges?.profile ?? 0;

  const palette = useMemo(
    () =>
      isDark
        ? {
            fallback: 'rgba(18,18,18,0.92)',
            border: 'rgba(255,255,255,0.12)',
            activeColor: '#FFFFFF',
            mutedColor: 'rgba(255,255,255,0.62)',
            pressBubble: 'rgba(255,255,255,0.22)',
            slide: 'rgba(255,255,255,0.16)',
            tint: '#121212',
          }
        : {
            fallback: 'rgba(18,22,20,0.88)',
            border: 'rgba(255,255,255,0.1)',
            activeColor: '#FFFFFF',
            mutedColor: 'rgba(255,255,255,0.62)',
            pressBubble: 'rgba(255,255,255,0.22)',
            slide: 'rgba(255,255,255,0.16)',
            tint: '#121612',
          },
    [isDark],
  );

  useEffect(() => {
    if (!tabWidth) return;
    const next = activeIndex * tabWidth + (tabWidth - BUBBLE_SIZE) / 2;
    slideX.value = reduceMotion
      ? next
      : withSpring(next, SLIDE_SPRING);
  }, [activeIndex, reduceMotion, slideX, tabWidth]);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  function onRowLayout(event: LayoutChangeEvent) {
    const width = event.nativeEvent.layout.width;
    if (width <= 0) return;
    const next = width / tabs.length;
    setTabWidth((current) =>
      Math.abs(current - next) < 0.5 ? current : next,
    );
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      <GlassChrome
        fallbackColor={palette.fallback}
        style={[styles.dock, { borderColor: palette.border }]}
        tintColor={palette.tint}
      >
        <View
          accessibilityRole="tablist"
          onLayout={onRowLayout}
          style={styles.row}
        >
          {tabWidth > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.slideBubble,
                { backgroundColor: palette.slide },
                slideStyle,
              ]}
            />
          ) : null}

          {tabs.map((tab) => {
            const isActive = tab.key === active;
            const color = isActive ? palette.activeColor : palette.mutedColor;
            const badge = badges?.[tab.key];
            const Icon = tab.icon;
            const isProfile = tab.key === 'profile';
            const showDot =
              isProfile && (profileBadgeCount > 0 || Boolean(badge));

            return (
              <BubblePressable
                key={tab.key}
                accessibilityLabel={tab.label}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                active={isActive}
                bubble
                bubbleColor={palette.pressBubble}
                bubblePlacement="glyph"
                haptic="selection"
                onPress={() => {
                  if (!isActive) {
                    router.navigate(tab.href as never);
                  }
                }}
                scaleTo={0.84}
                style={styles.tab}
              >
                <View style={styles.iconWell}>
                  {isProfile && avatarUrl ? (
                    <View style={styles.avatarRing}>
                      <Image
                        accessibilityIgnoresInvertColors
                        contentFit="cover"
                        source={{ uri: avatarUrl }}
                        style={styles.avatar}
                      />
                    </View>
                  ) : (
                    <Icon
                      color={color}
                      size={24}
                      strokeWidth={isActive ? 2.6 : 2.15}
                    />
                  )}

                  {showDot ? (
                    <View
                      style={[
                        styles.badge,
                        !badge || isProfile ? styles.dotOnly : null,
                      ]}
                    >
                      {badge && badge > 0 && !isProfile ? (
                        <Text style={styles.badgeText}>
                          {badge > 9 ? '9+' : badge}
                        </Text>
                      ) : null}
                    </View>
                  ) : badge && badge > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {badge > 9 ? '9+' : badge}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </BubblePressable>
            );
          })}
        </View>
      </GlassChrome>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 14,
    paddingTop: 4,
    width: '100%',
  },
  dock: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingVertical: 6,
    position: 'relative',
  },
  slideBubble: {
    borderRadius: 16,
    height: BUBBLE_SIZE,
    left: 4,
    position: 'absolute',
    top: 6,
    width: BUBBLE_SIZE,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: TOUCH_MIN,
    paddingVertical: 2,
  },
  iconWell: {
    alignItems: 'center',
    height: BUBBLE_SIZE,
    justifyContent: 'center',
    width: BUBBLE_SIZE,
  },
  avatarRing: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    height: 28,
    overflow: 'hidden',
    width: 28,
  },
  avatar: {
    height: '100%',
    width: '100%',
  },
  badge: {
    alignItems: 'center',
    backgroundColor: '#E5484D',
    borderColor: 'rgba(18,18,18,0.9)',
    borderRadius: 999,
    borderWidth: 2,
    height: 16,
    justifyContent: 'center',
    minWidth: 16,
    paddingHorizontal: 3,
    position: 'absolute',
    right: -2,
    top: 2,
  },
  dotOnly: {
    bottom: 4,
    height: 10,
    minWidth: 10,
    paddingHorizontal: 0,
    right: 2,
    top: undefined,
    width: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.extraBold,
    fontSize: 10,
    lineHeight: 12,
  },
});
