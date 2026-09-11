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
import { useEffect } from 'react';

import FloatingBubbleTabBar from '@/components/navigation/FloatingBubbleTabBar';
import { useOptionalTabBarMotion } from '@/context/TabBarMotionContext';
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

/**
 * Role-aware SitGuru bottom navigation. Visual chrome lives in
 * FloatingBubbleTabBar; this shell owns workspace tab sets + routing.
 */
export default function SitGuruTabBar({
  active,
  role,
  badges,
}: SitGuruTabBarProps) {
  const { primaryRole } = useAuth();
  const motion = useOptionalTabBarMotion();
  const resolvedRole = role ?? toTabRole(primaryRole);
  const tabs = TAB_SETS[resolvedRole];

  useEffect(() => {
    motion?.resetCompact();
  }, [active, motion, resolvedRole]);

  return (
    <FloatingBubbleTabBar
      activeKey={active}
      badges={badges}
      tabs={tabs}
      onTabPress={(tab) => {
        if (tab.key === active) return;
        const match = tabs.find((item) => item.key === tab.key);
        if (match) {
          router.navigate(match.href as never);
        }
      }}
    />
  );
}
