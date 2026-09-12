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
  withSequence,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

import { ButtonMetrics } from '@/constants/button-tokens';
import { TAB_BAR_MOTION } from '@/constants/tab-bar-motion';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export function tabSlotPillWidth(rowWidth: number, slotCount: number) {
  const slot = rowWidth / Math.max(slotCount, 1);
  // Keep the pill inside one slot so it cannot cover the neighboring label
  // (e.g. Home's bubble overlapping "Find Care").
  return Math.min(ButtonMetrics.tabPillWidth, Math.max(40, slot - 16));
}

export function tabSlotX(
  rowWidth: number,
  index: number,
  slotCount: number,
  pillWidth: number,
) {
  const slot = rowWidth / Math.max(slotCount, 1);
  return index * slot + (slot - pillWidth) / 2;
}

export type TabBarMotionApi = {
  compactProgress: SharedValue<number>;
  bubbleX: SharedValue<number>;
  bubbleWidth: SharedValue<number>;
  bubbleStretchX: SharedValue<number>;
  bubbleStretchY: SharedValue<number>;
  ingestScrollOffset: (offsetY: number) => void;
  beginDrag: (offsetY: number) => void;
  endDrag: () => void;
  beginMomentum: () => void;
  endMomentum: () => void;
  expandNow: () => void;
  moveBubbleTo: (params: {
    width: number;
    index: number;
    slotCount: number;
    animate: boolean;
  }) => void;
};

const TabBarMotionContext = createContext<TabBarMotionApi | null>(null);

export function TabBarMotionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const compactProgress = useSharedValue(0);
  const bubbleX = useSharedValue(0);
  const bubbleWidth = useSharedValue<number>(ButtonMetrics.tabPillWidth);
  const bubbleStretchX = useSharedValue(1);
  const bubbleStretchY = useSharedValue(1);
  const primed = useRef(false);

  const lastY = useRef(0);
  const dragging = useRef(false);
  const momentum = useRef(false);
  const compacted = useRef(false);

  const setCompact = useCallback(
    (next: number) => {
      compacted.current = next > 0.5;
      compactProgress.set(
        reduceMotion ? next : withSpring(next, TAB_BAR_MOTION.compactSpring),
      );
    },
    [compactProgress, reduceMotion],
  );

  const expandNow = useCallback(() => {
    setCompact(0);
  }, [setCompact]);

  const moveBubbleTo = useCallback(
    ({
      width,
      index,
      slotCount,
      animate,
    }: {
      width: number;
      index: number;
      slotCount: number;
      animate: boolean;
    }) => {
      if (width <= 0 || slotCount <= 0) return;

      const pillWidth = tabSlotPillWidth(width, slotCount);
      const nextX = tabSlotX(width, index, slotCount, pillWidth);
      const travel = Math.abs(nextX - bubbleX.get());

      bubbleWidth.set(pillWidth);

      if (!animate || !primed.current || reduceMotion || travel < 1) {
        bubbleX.set(nextX);
        bubbleStretchX.set(1);
        bubbleStretchY.set(1);
        primed.current = true;
        return;
      }

      const slot = width / slotCount;
      // Keep travel stretch modest so the pill never reads as a second
      // circle over the neighboring tab (Home covering Find Care).
      const stretch =
        1 + Math.min(0.06, 0.02 + (travel / Math.max(slot, 1)) * 0.03);

      bubbleX.set(withSpring(nextX, TAB_BAR_MOTION.slideSpring));
      bubbleStretchX.set(
        withSequence(
          withSpring(stretch, TAB_BAR_MOTION.stretchSpring),
          withSpring(1, TAB_BAR_MOTION.settleSpring),
        ),
      );
      bubbleStretchY.set(
        withSequence(
          withSpring(0.96, TAB_BAR_MOTION.stretchSpring),
          withSpring(1, TAB_BAR_MOTION.settleSpring),
        ),
      );
      primed.current = true;
    },
    [bubbleStretchX, bubbleStretchY, bubbleWidth, bubbleX, reduceMotion],
  );

  const ingestScrollOffset = useCallback(
    (offsetY: number) => {
      const delta = offsetY - lastY.current;
      lastY.current = offsetY;

      if (!dragging.current && !momentum.current) return;

      if (offsetY <= 8) {
        if (compacted.current) setCompact(0);
        return;
      }

      if (Math.abs(delta) < TAB_BAR_MOTION.scrollThresholdPx) return;

      if (delta > 0) {
        if (!compacted.current) setCompact(1);
        return;
      }

      if (compacted.current) setCompact(0);
    },
    [setCompact],
  );

  const beginDrag = useCallback((offsetY: number) => {
    dragging.current = true;
    lastY.current = offsetY;
  }, []);

  const endDrag = useCallback(() => {
    dragging.current = false;
  }, []);

  const beginMomentum = useCallback(() => {
    momentum.current = true;
  }, []);

  const endMomentum = useCallback(() => {
    momentum.current = false;
  }, []);

  useEffect(() => {
    expandNow();
  }, [expandNow, pathname]);

  const value = useMemo<TabBarMotionApi>(
    () => ({
      compactProgress,
      bubbleX,
      bubbleWidth,
      bubbleStretchX,
      bubbleStretchY,
      ingestScrollOffset,
      beginDrag,
      endDrag,
      beginMomentum,
      endMomentum,
      expandNow,
      moveBubbleTo,
    }),
    [
      beginDrag,
      beginMomentum,
      bubbleStretchX,
      bubbleStretchY,
      bubbleWidth,
      bubbleX,
      compactProgress,
      endDrag,
      endMomentum,
      expandNow,
      ingestScrollOffset,
      moveBubbleTo,
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
