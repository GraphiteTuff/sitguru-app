import { router, useLocalSearchParams, usePathname } from 'expo-router';
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
import { useMemo } from 'react';

import FloatingBubbleTabBar from '@/components/navigation/FloatingBubbleTabBar';
import { getTabChromePalette } from '@/constants/role-palettes';
import {
  ADDITIONAL_OVERFLOW_ITEMS,
  overflowItemIsActive,
} from '@/constants/toolbar-overflow';
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
    { key: 'explore', label: 'Find Care', icon: Search, href: '/find-care' },
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
    { key: 'explore', label: 'Find Care', icon: Search, href: '/find-care' },
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

function navigateOverflowHref(
  href: string,
  params?: Record<string, string>,
) {
  if (params) {
    router.push({
      pathname: href as never,
      params,
    });
    return;
  }

  router.navigate(href as never);
}

/** Tap a tab to move. The bubble slides; sections are never swipe-paged. */
export default function SitGuruTabBar({
  active,
  role,
  badges,
  floating = true,
}: SitGuruTabBarProps) {
  const isDark = useThemeMode() === 'dark';
  const pathname = usePathname();
  const routeParams = useLocalSearchParams();
  const { primaryRole } = useAuth();

  const resolvedRole = role ?? toTabRole(primaryRole);
  const palette = getTabChromePalette(resolvedRole, isDark);
  const tabs = TAB_SETS[resolvedRole];
  const activeKey = resolveActiveTab(pathname, tabs, active);

  const overflowItems = useMemo(
    () => ADDITIONAL_OVERFLOW_ITEMS[resolvedRole],
    [resolvedRole],
  );

  return (
    <FloatingBubbleTabBar
      activeKey={activeKey}
      additionalOverflowItems={overflowItems.map((item) => ({
        key: item.key,
        label: item.label,
        icon: item.icon,
        selected: overflowItemIsActive(pathname, item, routeParams),
      }))}
      floating={floating}
      onOverflowItemPress={(item) => {
        const destination = overflowItems.find((entry) => entry.key === item.key);
        if (!destination) return;
        navigateOverflowHref(destination.href, destination.params);
      }}
      onTabPress={(tab) => {
        const definition = tabs.find((item) => item.key === tab.key);
        if (!definition || definition.key === activeKey) return;
        navigateOverflowHref(definition.href, definition.params);
      }}
      palette={palette}
      tabs={tabs.map((tab) => ({
        key: tab.key,
        label: tab.label,
        icon: tab.icon,
        badge: badges?.[tab.key],
      }))}
    />
  );
}
