import { router, usePathname } from 'expo-router';
import {
  CalendarDays,
  Home,
  type LucideIcon,
  Map,
  MapPin,
  MessageCircle,
  Search,
  Share2,
  Sparkles,
  User,
  Wallet,
} from 'lucide-react-native';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BubblePressable from '@/components/BubblePressable';
import GlassChrome from '@/components/mobile/GlassChrome';
import { AppFonts } from '@/constants/fonts';
import { TOUCH_MIN } from '@/constants/mobile-layout';
import { getTabChromePalette } from '@/constants/role-palettes';
import { MAX_CHROME_FONT_MULTIPLIER } from '@/lib/a11y/type-scale';
import { useThemeMode } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import type { AppRole } from '@/types/auth';

export type SitGuruTabRole = 'petParent' | 'guru' | 'ambassador' | 'visitor';

export type SitGuruTabKey =
  | 'home'
  | 'explore'
  | 'bookings'
  | 'messages'
  | 'profile'
  | 'careMap'
  | 'referrals'
  | 'payouts'
  | 'events';

type TabDefinition = {
  key: SitGuruTabKey;
  label: string;
  icon: LucideIcon;
  href: string;
  params?: Record<string, string>;
};

const TAB_SETS: Record<SitGuruTabRole, TabDefinition[]> = {
  visitor: [
    { key: 'home', label: 'Home', icon: Home, href: '/' },
    { key: 'explore', label: 'Explore', icon: Search, href: '/find-care' },
    {
      key: 'profile',
      label: 'Join',
      icon: User,
      href: '/signup',
      params: { role: 'parent' },
    },
    {
      key: 'events',
      label: 'Events',
      icon: MapPin,
      href: '/community-events',
    },
    {
      key: 'messages',
      label: 'Ask Rogue',
      icon: Sparkles,
      href: '/ai-companion',
      params: { id: 'rogue' },
    },
  ],
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

function toTabRole(role: AppRole | null): SitGuruTabRole {
  if (role === 'guru') return 'guru';
  if (role === 'ambassador') return 'ambassador';
  return 'petParent';
}

function resolveActiveTab(
  pathname: string,
  tabs: TabDefinition[],
  explicit?: SitGuruTabKey,
): SitGuruTabKey {
  if (explicit) return explicit;

  const normalized = pathname.replace(/\/$/, '') || '/';

  for (const tab of tabs) {
    const href = tab.href.replace(/\/$/, '') || '/';
    if (normalized === href || normalized.startsWith(`${href}/`)) {
      return tab.key;
    }
  }

  return tabs[0]?.key ?? 'home';
}

type SitGuruTabBarProps = {
  active?: SitGuruTabKey;
  /** Defaults to the signed-in user's primary role. Use `visitor` on marketing home. */
  role?: SitGuruTabRole;
  badges?: Partial<Record<SitGuruTabKey, number>>;
  /** App Store–style floating dock instead of edge-to-edge bar. */
  floating?: boolean;
};

export default function SitGuruTabBar({
  active,
  role,
  badges,
  floating = true,
}: SitGuruTabBarProps) {
  const insets = useSafeAreaInsets();
  const isDark = useThemeMode() === 'dark';
  const pathname = usePathname();
  const { primaryRole } = useAuth();

  const resolvedRole = role ?? toTabRole(primaryRole);
  const palette = getTabChromePalette(resolvedRole, isDark);
  const tabs = TAB_SETS[resolvedRole];
  const activeKey = resolveActiveTab(pathname, tabs, active);

  return (
    <View
      style={[
        styles.shell,
        floating && styles.shellFloating,
        {
          paddingBottom: Math.max(insets.bottom, floating ? 6 : 10),
        },
      ]}
    >
      <GlassChrome
        fallbackColor={palette.fallback}
        style={[
          styles.bar,
          floating && styles.barFloating,
          floating && { borderColor: palette.border },
          !floating && { borderTopColor: palette.border },
        ]}
        tintColor={palette.tint}
      >
        <View accessibilityRole="tablist" style={styles.row}>
          {tabs.map((tab) => {
            const isActive = tab.key === activeKey;
            const color = isActive ? palette.activeColor : palette.mutedColor;
            const badge = badges?.[tab.key];
            const Icon = tab.icon;

            return (
              <BubblePressable
                key={tab.key}
                accessibilityLabel={tab.label}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                active={isActive}
                bubble
                bubbleColor={palette.bubble}
                bubblePlacement="glyph"
                haptic="selection"
                onPress={() => {
                  if (isActive) return;

                  if (tab.params) {
                    router.push({
                      pathname: tab.href as never,
                      params: tab.params,
                    });
                    return;
                  }

                  router.navigate(tab.href as never);
                }}
                scaleTo={0.84}
                style={styles.tab}
              >
                <View style={styles.iconWell}>
                  <Icon
                    color={color}
                    size={24}
                    strokeWidth={isActive ? 2.6 : 2.15}
                  />

                  {badge ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {badge > 9 ? '9+' : badge}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Text
                  adjustsFontSizeToFit
                  allowFontScaling
                  maxFontSizeMultiplier={MAX_CHROME_FONT_MULTIPLIER}
                  minimumFontScale={0.88}
                  numberOfLines={1}
                  style={[styles.label, { color }]}
                >
                  {tab.label}
                </Text>
              </BubblePressable>
            );
          })}
        </View>
      </GlassChrome>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
  },
  shellFloating: {
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  barFloating: {
    borderRadius: 24,
    borderTopWidth: 0,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#18211C',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },
  row: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 2,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
    justifyContent: 'flex-start',
    minHeight: TOUCH_MIN,
    paddingTop: 2,
    paddingVertical: 2,
  },
  iconWell: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    width: 46,
  },
  label: {
    fontFamily: AppFonts.bold,
    fontSize: 11,
    paddingHorizontal: 2,
    textAlign: 'center',
    width: '100%',
  },
  badge: {
    alignItems: 'center',
    backgroundColor: '#E5484D',
    borderRadius: 999,
    height: 16,
    justifyContent: 'center',
    minWidth: 16,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -8,
    top: -5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.extraBold,
    fontSize: 10,
    lineHeight: 13,
  },
});
