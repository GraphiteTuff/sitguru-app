import {
  CircleDollarSign,
  Gift,
  LayoutDashboard,
  MapPin,
  Megaphone,
  PawPrint,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  type LucideIcon,
} from 'lucide-react-native';

import { PET_PARENT_EXPERIENCES } from '@/constants/mobile-experiences';
import { TAB_BAR_MOTION } from '@/constants/tab-bar-motion';
import type { SitGuruTabKey, SitGuruTabRole } from '@/components/SitGuruTabBar';

/** Matches UIKit: overflow control is a trailing-edge affordance, not a tab. */
export const OVERFLOW_CONTROL_WIDTH = 48;
export const MIN_TAB_SLOT = 58;
export const MIN_VISIBLE_TABS = 3;

export type ToolbarVisibilityPriority = 'high' | 'automatic' | 'low';

export type ToolbarOverflowItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string;
  params?: Record<string, string>;
  /** UIKit additionalOverflowItems — always in the menu, never a visible tab. */
  source: 'additional' | 'unfitted';
};

type OverflowDestination = Omit<ToolbarOverflowItem, 'source'>;

const TAB_PRIORITY: Record<SitGuruTabKey, ToolbarVisibilityPriority> = {
  home: 'high',
  profile: 'high',
  explore: 'automatic',
  bookings: 'automatic',
  messages: 'automatic',
  careMap: 'automatic',
  referrals: 'low',
  payouts: 'low',
  events: 'low',
};

const PRIORITY_RANK: Record<ToolbarVisibilityPriority, number> = {
  high: 2,
  automatic: 1,
  low: 0,
};

/**
 * additionalOverflowItems — secondary SitGuru destinations that always live
 * in the overflow menu, even when the bar has room.
 */
export const ADDITIONAL_OVERFLOW_ITEMS: Record<
  SitGuruTabRole,
  OverflowDestination[]
> = {
  visitor: [
    {
      key: 'delilah',
      label: 'Pet Events AI',
      icon: Sparkles,
      href: '/ai-companion',
      params: { id: 'delilah' },
    },
  ],
  petParent: PET_PARENT_EXPERIENCES.map((item) => ({
    key: item.id,
    label: item.label,
    icon:
      item.icon === 'events'
        ? MapPin
        : item.icon === 'passports'
          ? PawPrint
          : item.icon === 'pawperks'
            ? Gift
            : Sparkles,
    href: item.href,
    params: item.params,
  })),
  guru: [
    {
      key: 'earnings',
      label: 'Earnings',
      icon: CircleDollarSign,
      href: '/guru-earnings',
    },
    {
      key: 'pricing',
      label: 'Pricing',
      icon: SlidersHorizontal,
      href: '/guru-pricing',
    },
    {
      key: 'success',
      label: 'Success Center',
      icon: Trophy,
      href: '/guru-success-center',
    },
    {
      key: 'referrals',
      label: 'Referrals',
      icon: Share2,
      href: '/guru-referrals',
    },
    {
      key: 'events',
      label: 'Pet Events',
      icon: MapPin,
      href: '/community-events',
    },
    {
      key: 'rogue',
      label: 'Ask Rogue',
      icon: Sparkles,
      href: '/ai-companion',
      params: { id: 'rogue' },
    },
  ],
  ambassador: [
    {
      key: 'social',
      label: 'Social',
      icon: Megaphone,
      href: '/ambassador-social',
    },
    {
      key: 'command',
      label: 'Command Center',
      icon: LayoutDashboard,
      href: '/ambassador-command-center',
    },
    {
      key: 'events',
      label: 'Pet Events',
      icon: MapPin,
      href: '/community-events',
    },
  ],
};

type SplittableTab = {
  key: SitGuruTabKey;
  label: string;
  icon: LucideIcon;
  href: string;
  params?: Record<string, string>;
};

export function toolbarCapsuleWidth(windowWidth: number) {
  return Math.round(windowWidth * TAB_BAR_MOTION.expandedWidthPct);
}

/**
 * UIKit-style split: keep high-priority + active tabs visible, move the rest
 * into overflow when slots would drop below MIN_TAB_SLOT.
 */
export function splitToolbarTabs<T extends SplittableTab>(
  tabs: T[],
  activeKey: SitGuruTabKey,
  windowWidth: number,
  additional: OverflowDestination[],
): {
  visibleTabs: T[];
  overflowItems: ToolbarOverflowItem[];
  showOverflowButton: boolean;
} {
  const additionalItems = additional.map((item) => ({
    ...item,
    source: 'additional' as const,
  }));

  const showOverflowButton = additionalItems.length > 0;
  const capsule = toolbarCapsuleWidth(windowWidth);
  const tabBudget = showOverflowButton
    ? capsule - OVERFLOW_CONTROL_WIDTH
    : capsule;
  const maxVisible = Math.max(
    MIN_VISIBLE_TABS,
    Math.floor(tabBudget / MIN_TAB_SLOT),
  );

  if (tabs.length <= maxVisible) {
    return {
      visibleTabs: tabs,
      overflowItems: excludeVisibleHrefs(additionalItems, tabs),
      showOverflowButton,
    };
  }

  const keep = new Set<SitGuruTabKey>();
  keep.add(activeKey);

  for (const tab of tabs) {
    if (TAB_PRIORITY[tab.key] === 'high') keep.add(tab.key);
  }

  const ranked = [...tabs].sort((a, b) => {
    if (a.key === activeKey) return -1;
    if (b.key === activeKey) return 1;
    return PRIORITY_RANK[TAB_PRIORITY[b.key]] - PRIORITY_RANK[TAB_PRIORITY[a.key]];
  });

  for (const tab of ranked) {
    if (keep.size >= maxVisible) break;
    keep.add(tab.key);
  }

  const visibleTabs = tabs.filter((tab) => keep.has(tab.key));
  const unfitted = tabs
    .filter((tab) => !keep.has(tab.key))
    .map((tab) => ({
      key: `tab:${tab.key}`,
      label: tab.label,
      icon: tab.icon,
      href: tab.href,
      params: tab.params,
      source: 'unfitted' as const,
    }));

  return {
    visibleTabs,
    overflowItems: [
      ...unfitted,
      ...excludeVisibleHrefs(additionalItems, visibleTabs),
    ],
    showOverflowButton: true,
  };
}

function destinationHref(item: { href: string; params?: Record<string, string> }) {
  const query = item.params
    ? Object.entries(item.params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&')
    : '';
  return query ? `${item.href}?${query}` : item.href;
}

function excludeVisibleHrefs<T extends { href: string; params?: Record<string, string> }>(
  items: T[],
  visible: { href: string; params?: Record<string, string> }[],
) {
  const visibleHrefs = new Set(visible.map(destinationHref));
  return items.filter((item) => !visibleHrefs.has(destinationHref(item)));
}

export function overflowItemIsActive(
  pathname: string,
  item: { href: string; params?: Record<string, string> },
  routeParams?: Record<string, string | string[] | undefined>,
) {
  const normalized = pathname.replace(/\/$/, '') || '/';
  const href = item.href.replace(/\/$/, '') || '/';
  const pathMatch = normalized === href || normalized.startsWith(`${href}/`);
  if (!pathMatch) return false;
  if (!item.params) return true;

  return Object.entries(item.params).every(([key, value]) => {
    const current = routeParams?.[key];
    const resolved = Array.isArray(current) ? current[0] : current;
    return resolved === value;
  });
}
