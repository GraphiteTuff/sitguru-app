import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import {
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

/** Vertical scroll delta before the capsule begins compacting. */
export const TAB_BAR_SCROLL_THRESHOLD = 8;

/** Delay after scroll/momentum ends before expanding again. */
export const TAB_BAR_EXPAND_DELAY_MS = 200;

export const TAB_BAR_COMPACT_SPRING = {
  damping: 22,
  mass: 0.78,
  stiffness: 260,
} as const;

export const TAB_BAR_EXPAND_SPRING = {
  damping: 20,
  mass: 0.82,
  stiffness: 220,
} as const;

type TabBarMotionContextValue = {
  /** 0 = expanded idle, 1 = compact while scrolling. */
  navCompactProgress: SharedValue<number>;
  reportScrollDelta: (deltaY: number) => void;
  reportScrollBegin: () => void;
  reportScrollEnd: () => void;
  resetCompact: () => void;
};

const TabBarMotionContext = createContext<TabBarMotionContextValue | null>(
  null,
);

/**
 * Shared scroll → floating-tab-bar motion bus.
 * Screens notify via useFloatingTabBarScroll; the bar reads navCompactProgress
 * on the UI thread without React re-renders per scroll event.
 */
export function TabBarMotionProvider({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const navCompactProgress = useSharedValue(0);
  const accumulatedDelta = useRef(0);
  const isCompact = useRef(false);
  const expandTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotionRef = useRef(reduceMotion);

  useEffect(() => {
    reduceMotionRef.current = reduceMotion;
  }, [reduceMotion]);

  const clearExpandTimer = useCallback(() => {
    if (expandTimer.current) {
      clearTimeout(expandTimer.current);
      expandTimer.current = null;
    }
  }, []);

  const setCompact = useCallback(
    (compact: boolean) => {
      if (isCompact.current === compact) return;
      isCompact.current = compact;

      if (reduceMotionRef.current) {
        navCompactProgress.value = compact ? 1 : 0;
        return;
      }

      navCompactProgress.value = withSpring(
        compact ? 1 : 0,
        compact ? TAB_BAR_COMPACT_SPRING : TAB_BAR_EXPAND_SPRING,
      );
    },
    [navCompactProgress],
  );

  const reportScrollBegin = useCallback(() => {
    clearExpandTimer();
    accumulatedDelta.current = 0;
  }, [clearExpandTimer]);

  const reportScrollDelta = useCallback(
    (deltaY: number) => {
      clearExpandTimer();
      accumulatedDelta.current += Math.abs(deltaY);

      if (accumulatedDelta.current >= TAB_BAR_SCROLL_THRESHOLD) {
        setCompact(true);
      }
    },
    [clearExpandTimer, setCompact],
  );

  const reportScrollEnd = useCallback(() => {
    clearExpandTimer();
    expandTimer.current = setTimeout(() => {
      accumulatedDelta.current = 0;
      setCompact(false);
      expandTimer.current = null;
    }, TAB_BAR_EXPAND_DELAY_MS);
  }, [clearExpandTimer, setCompact]);

  // Alias used by scroll bridge — same single-delay expand path.
  const scheduleExpand = reportScrollEnd;

  const resetCompact = useCallback(() => {
    clearExpandTimer();
    accumulatedDelta.current = 0;
    isCompact.current = false;
    navCompactProgress.value = 0;
  }, [clearExpandTimer, navCompactProgress]);

  useEffect(() => () => clearExpandTimer(), [clearExpandTimer]);

  const value = useMemo(
    () => ({
      navCompactProgress,
      reportScrollDelta,
      reportScrollBegin,
      reportScrollEnd,
      resetCompact,
    }),
    [
      navCompactProgress,
      reportScrollDelta,
      reportScrollBegin,
      reportScrollEnd,
      resetCompact,
    ],
  );

  return (
    <TabBarMotionContext.Provider value={value}>
      {children}
    </TabBarMotionContext.Provider>
  );
}

export function useTabBarMotion(): TabBarMotionContextValue {
  const context = useContext(TabBarMotionContext);
  if (!context) {
    throw new Error('useTabBarMotion must be used within TabBarMotionProvider');
  }
  return context;
}

/** Safe for screens that may render outside the provider (tests / previews). */
export function useOptionalTabBarMotion(): TabBarMotionContextValue | null {
  return useContext(TabBarMotionContext);
}
