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
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BubblePressable from '@/components/BubblePressable';
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

export default function SitGuruTabBar({
  active,
  role,
  badges,
}: SitGuruTabBarProps) {
  const insets = useSafeAreaInsets();
  const isDark = useThemeMode() === 'dark';
  const { primaryRole } = useAuth();

  const resolvedRole = role ?? toTabRole(primaryRole);

  const palette = isDark
    ? {
        background: '#081C14',
        border: '#1E3B2B',
        activeColor: '#58D58A',
        mutedColor: '#8FA096',
        bubble: 'rgba(88,213,138,0.16)',
      }
    : {
        background: '#FFFFFF',
        border: '#E5DFD4',
        activeColor: '#1A4E37',
        mutedColor: '#79857B',
        bubble: 'rgba(26,78,55,0.10)',
      };

  const tabs = TAB_SETS[resolvedRole];

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          backgroundColor: palette.background,
          borderTopColor: palette.border,
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
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
            bubbleStyle={styles.bubble}
            onPress={() => {
              if (!isActive) {
                router.navigate(tab.href as never);
              }
            }}
            style={styles.tab}
          >
            <View>
              <Icon color={color} size={22} strokeWidth={isActive ? 2.6 : 2.2} />

              {badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {badge > 9 ? '9+' : badge}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={[styles.label, { color }]} numberOfLines={1}>
              {tab.label}
            </Text>
          </BubblePressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingTop: 10,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  bubble: {
    borderRadius: 18,
    bottom: 2,
    left: 8,
    right: 8,
    top: -2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
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
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 13,
  },
});
