import { usePathname } from 'expo-router';
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

import { TAB_BAR_MOTION } from '@/constants/tab-bar-motion';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export type TabBarMotionApi = {
  compactProgress: SharedValue<number>;
  ingestScrollOffset: (offsetY: number) => void;
  beginDrag: (offsetY: number) => void;
  endDrag: () => void;
  beginMomentum: () => void;
  endMomentum: () => void;
  expandNow: () => void;
};

const TabBarMotionContext = createContext<TabBarMotionApi | null>(null);

export function TabBarMotionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const compactProgress = useSharedValue(0);

  const dragStartY = useRef(0);
  const dragging = useRef(false);
  const momentum = useRef(false);
  const compacted = useRef(false);
  const expandTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearExpandTimer = useCallback(() => {
    if (expandTimer.current) {
      clearTimeout(expandTimer.current);
      expandTimer.current = null;
    }
  }, []);

  const setCompact = useCallback(
    (next: number) => {
      compacted.current = next > 0.5;
      compactProgress.value = reduceMotion
        ? next
        : withSpring(next, TAB_BAR_MOTION.compactSpring);
    },
    [compactProgress, reduceMotion],
  );

  const expandNow = useCallback(() => {
    clearExpandTimer();
    setCompact(0);
  }, [clearExpandTimer, setCompact]);

  const scheduleExpand = useCallback(() => {
    clearExpandTimer();
    expandTimer.current = setTimeout(() => {
      expandTimer.current = null;
      if (dragging.current || momentum.current) return;
      setCompact(0);
    }, TAB_BAR_MOTION.expandDelayMs);
  }, [clearExpandTimer, setCompact]);

  const ingestScrollOffset = useCallback(
    (offsetY: number) => {
      if (offsetY < -8) return;
      if (!dragging.current && !momentum.current) return;

      const traveled = Math.abs(offsetY - dragStartY.current);
      if (traveled < TAB_BAR_MOTION.scrollThresholdPx) return;

      clearExpandTimer();
      if (!compacted.current) {
        setCompact(1);
      }
    },
    [clearExpandTimer, setCompact],
  );

  const beginDrag = useCallback(
    (offsetY: number) => {
      dragging.current = true;
      dragStartY.current = offsetY;
      clearExpandTimer();
    },
    [clearExpandTimer],
  );

  const endDrag = useCallback(() => {
    dragging.current = false;
    if (!momentum.current) {
      scheduleExpand();
    }
  }, [scheduleExpand]);

  const beginMomentum = useCallback(() => {
    momentum.current = true;
    clearExpandTimer();
  }, [clearExpandTimer]);

  const endMomentum = useCallback(() => {
    momentum.current = false;
    scheduleExpand();
  }, [scheduleExpand]);

  useEffect(() => {
    expandNow();
  }, [expandNow, pathname]);

  useEffect(() => {
    return () => {
      clearExpandTimer();
    };
  }, [clearExpandTimer]);

  const value = useMemo<TabBarMotionApi>(
    () => ({
      compactProgress,
      ingestScrollOffset,
      beginDrag,
      endDrag,
      beginMomentum,
      endMomentum,
      expandNow,
    }),
    [
      beginDrag,
      beginMomentum,
      compactProgress,
      endDrag,
      endMomentum,
      expandNow,
      ingestScrollOffset,
    ],
  );

  return (
    <TabBarMotionContext.Provider value={value}>
      {children}
    </TabBarMotionContext.Provider>
  );
}

export function useTabBarMotion(): TabBarMotionApi | null {
  return useContext(TabBarMotionContext);
}
