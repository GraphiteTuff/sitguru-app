/**
 * Pure Guru performance analytics reducers — used by useGuruEarnings
 * and deep-dive screens without re-querying Supabase.
 */

import { startOfWeek } from '@/lib/data/money';

export type PerformanceActivityItem = {
  parentId?: string;
  parentName?: string;
  serviceLabel: string;
  netAmount: number;
  completedAt: Date | null;
  startedAt?: Date | null;
  isWalk?: boolean;
  source?: string;
};

export type PeakActivityWindow = {
  id: string;
  label: string;
  hourStart: number;
  hourEnd: number;
  count: number;
  share: number;
};

export type ServiceCategoryBucket = {
  id: string;
  category: string;
  count: number;
  netTotal: number;
  share: number;
};

export type GuruPerformanceAnalytics = {
  retentionRateWow: number | null;
  retentionRepeatParents: number;
  retentionPriorParents: number;
  averageServicePayout: number;
  completedCareCount: number;
  peakActivityWindows: PeakActivityWindow[];
  topPeakWindow: PeakActivityWindow | null;
  activityDistribution30d: ServiceCategoryBucket[];
};

const EMPTY_ANALYTICS: GuruPerformanceAnalytics = {
  retentionRateWow: null,
  retentionRepeatParents: 0,
  retentionPriorParents: 0,
  averageServicePayout: 0,
  completedCareCount: 0,
  peakActivityWindows: [],
  topPeakWindow: null,
  activityDistribution30d: [],
};

const PEAK_WINDOWS: Array<{
  id: string;
  label: string;
  hourStart: number;
  hourEnd: number;
}> = [
  { id: 'morning', label: 'Morning (6–11)', hourStart: 6, hourEnd: 11 },
  { id: 'midday', label: 'Midday (11–14)', hourStart: 11, hourEnd: 14 },
  { id: 'afternoon', label: 'Afternoon (14–18)', hourStart: 14, hourEnd: 18 },
  { id: 'evening', label: 'Evening (18–22)', hourStart: 18, hourEnd: 22 },
  { id: 'night', label: 'Night / early', hourStart: 22, hourEnd: 6 },
];

function isCareItem(item: PerformanceActivityItem) {
  return item.source !== 'guru_payout';
}

function parentKey(item: PerformanceActivityItem) {
  const id = (item.parentId || '').trim();
  if (id) return `id:${id}`;
  const name = (item.parentName || '').trim().toLowerCase();
  if (name && name !== 'pet parent') return `name:${name}`;
  return '';
}

function activityTime(item: PerformanceActivityItem) {
  return item.startedAt ?? item.completedAt;
}

export function categorizeService(label: string) {
  const value = label.trim().toLowerCase();
  if (!value) return 'Other';
  if (/walk|walking/.test(value)) return 'Walks';
  if (/drop[- ]?in|visit|check[- ]?in/.test(value)) return 'Drop-ins';
  if (/board|overnight|house.?sit|sitting/.test(value)) return 'Sitting';
  if (/daycare|day care/.test(value)) return 'Daycare';
  if (/groom/.test(value)) return 'Grooming';
  return 'Other';
}

function inPeakWindow(hour: number, window: (typeof PEAK_WINDOWS)[number]) {
  if (window.hourStart < window.hourEnd) {
    return hour >= window.hourStart && hour < window.hourEnd;
  }
  return hour >= window.hourStart || hour < window.hourEnd;
}

/** Repeat pet parents this week ÷ unique parents last week. */
export function computeRetentionRateWow(
  items: PerformanceActivityItem[],
  now = new Date(),
) {
  const thisWeekStart = startOfWeek(now).getTime();
  const lastWeekStart = thisWeekStart - 7 * 24 * 60 * 60 * 1000;
  const care = items.filter(isCareItem);

  const thisWeek = new Set<string>();
  const lastWeek = new Set<string>();

  for (const item of care) {
    const key = parentKey(item);
    if (!key) continue;
    const at = item.completedAt?.getTime() ?? activityTime(item)?.getTime() ?? 0;
    if (!at) continue;
    if (at >= thisWeekStart) thisWeek.add(key);
    else if (at >= lastWeekStart && at < thisWeekStart) lastWeek.add(key);
  }

  if (lastWeek.size === 0) {
    return {
      retentionRateWow: null as number | null,
      retentionRepeatParents: 0,
      retentionPriorParents: 0,
    };
  }

  let repeats = 0;
  for (const key of thisWeek) {
    if (lastWeek.has(key)) repeats += 1;
  }

  return {
    retentionRateWow: Math.round((repeats / lastWeek.size) * 1000) / 10,
    retentionRepeatParents: repeats,
    retentionPriorParents: lastWeek.size,
  };
}

/** Total care earnings ÷ completed care visits. */
export function computeAverageServicePayout(items: PerformanceActivityItem[]) {
  const care = items.filter(isCareItem);
  const total = care.reduce((sum, item) => sum + Math.max(0, item.netAmount), 0);
  const count = care.length;
  return {
    averageServicePayout: count > 0 ? total / count : 0,
    completedCareCount: count,
  };
}

/** Booking-density windows by hour-of-day. */
export function computePeakActivityWindows(items: PerformanceActivityItem[]) {
  const care = items.filter(isCareItem);
  const counts = PEAK_WINDOWS.map((window) => ({ ...window, count: 0 }));

  for (const item of care) {
    const at = activityTime(item);
    if (!at) continue;
    const hour = at.getHours();
    const match = counts.find((window) => inPeakWindow(hour, window));
    if (match) match.count += 1;
  }

  const total = counts.reduce((sum, window) => sum + window.count, 0);
  const windows: PeakActivityWindow[] = counts
    .map((window) => ({
      id: window.id,
      label: window.label,
      hourStart: window.hourStart,
      hourEnd: window.hourEnd,
      count: window.count,
      share: total > 0 ? window.count / total : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    peakActivityWindows: windows,
    topPeakWindow: windows.find((window) => window.count > 0) ?? null,
  };
}

/** Trailing 30-day service category distribution. */
export function computeActivityDistribution30d(
  items: PerformanceActivityItem[],
  now = new Date(),
) {
  const cutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const care = items.filter((item) => {
    if (!isCareItem(item)) return false;
    const at = item.completedAt?.getTime() ?? activityTime(item)?.getTime() ?? 0;
    return at >= cutoff;
  });

  const map = new Map<string, { count: number; netTotal: number }>();
  for (const item of care) {
    const category = categorizeService(item.serviceLabel);
    const current = map.get(category) ?? { count: 0, netTotal: 0 };
    current.count += 1;
    current.netTotal += Math.max(0, item.netAmount);
    map.set(category, current);
  }

  const totalCount = care.length;
  const buckets: ServiceCategoryBucket[] = [...map.entries()]
    .map(([category, value]) => ({
      id: category.toLowerCase().replace(/\s+/g, '-'),
      category,
      count: value.count,
      netTotal: value.netTotal,
      share: totalCount > 0 ? value.count / totalCount : 0,
    }))
    .sort((a, b) => b.count - a.count || b.netTotal - a.netTotal);

  return { activityDistribution30d: buckets };
}

export function computeGuruPerformanceAnalytics(
  items: PerformanceActivityItem[],
  now = new Date(),
): GuruPerformanceAnalytics {
  if (!items.length) return { ...EMPTY_ANALYTICS };

  const retention = computeRetentionRateWow(items, now);
  const averages = computeAverageServicePayout(items);
  const peaks = computePeakActivityWindows(items);
  const distribution = computeActivityDistribution30d(items, now);

  return {
    ...retention,
    ...averages,
    ...peaks,
    ...distribution,
  };
}

export { EMPTY_ANALYTICS };
