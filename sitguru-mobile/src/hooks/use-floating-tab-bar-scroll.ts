import { useCallback, useEffect, useMemo, useRef } from 'react';
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollViewProps,
} from 'react-native';

import {
  TAB_BAR_EXPAND_DELAY_MS,
  useOptionalTabBarMotion,
} from '@/context/TabBarMotionContext';

export type FloatingTabBarScrollHandlers = Pick<
  ScrollViewProps,
  | 'onScroll'
  | 'onScrollBeginDrag'
  | 'onScrollEndDrag'
  | 'onMomentumScrollBegin'
  | 'onMomentumScrollEnd'
  | 'scrollEventThrottle'
>;

type ScrollHandler = (
  event: NativeSyntheticEvent<NativeScrollEvent>,
) => void;

function chainScrollHandlers(
  primary?: ScrollHandler | null,
  secondary?: ScrollHandler | null,
): ScrollHandler | undefined {
  if (!primary && !secondary) return undefined;
  if (!primary) return secondary ?? undefined;
  if (!secondary) return primary;

  return (event) => {
    primary(event);
    secondary(event);
  };
}

/**
 * Reusable scroll → floating tab bar bridge.
 * Writes only to shared motion state — no React setState on scroll.
 * Also debounces expand for mouse-wheel / web scrolls that never emit
 * drag or momentum end events.
 */
export function useFloatingTabBarScroll(
  existing?: Partial<FloatingTabBarScrollHandlers>,
): FloatingTabBarScrollHandlers {
  const motion = useOptionalTabBarMotion();
  const lastOffsetY = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearIdleTimer = useCallback(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
  }, []);

  const scheduleExpand = useCallback(() => {
    clearIdleTimer();
    idleTimer.current = setTimeout(() => {
      motion?.reportScrollEnd();
      idleTimer.current = null;
    }, TAB_BAR_EXPAND_DELAY_MS);
  }, [clearIdleTimer, motion]);

  useEffect(() => () => clearIdleTimer(), [clearIdleTimer]);

  const onScrollBeginDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      clearIdleTimer();
      lastOffsetY.current = event.nativeEvent.contentOffset.y;
      motion?.reportScrollBegin();
    },
    [clearIdleTimer, motion],
  );

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      const delta = y - lastOffsetY.current;
      lastOffsetY.current = y;

      if (Math.abs(delta) > 0) {
        motion?.reportScrollDelta(delta);
        // Wheel / trackpad scrolls often skip end-drag + momentum events.
        scheduleExpand();
      }
    },
    [motion, scheduleExpand],
  );

  const onScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      lastOffsetY.current = event.nativeEvent.contentOffset.y;
      const velocity = event.nativeEvent.velocity?.y ?? 0;
      if (Math.abs(velocity) < 0.05) {
        scheduleExpand();
      }
    },
    [scheduleExpand],
  );

  const onMomentumScrollBegin = useCallback(() => {
    clearIdleTimer();
    motion?.reportScrollBegin();
  }, [clearIdleTimer, motion]);

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      lastOffsetY.current = event.nativeEvent.contentOffset.y;
      scheduleExpand();
    },
    [scheduleExpand],
  );

  return useMemo(
    () => ({
      scrollEventThrottle: existing?.scrollEventThrottle ?? 16,
      onScroll: chainScrollHandlers(onScroll, existing?.onScroll ?? null),
      onScrollBeginDrag: chainScrollHandlers(
        onScrollBeginDrag,
        existing?.onScrollBeginDrag ?? null,
      ),
      onScrollEndDrag: chainScrollHandlers(
        onScrollEndDrag,
        existing?.onScrollEndDrag ?? null,
      ),
      onMomentumScrollBegin: chainScrollHandlers(
        onMomentumScrollBegin,
        existing?.onMomentumScrollBegin ?? null,
      ),
      onMomentumScrollEnd: chainScrollHandlers(
        onMomentumScrollEnd,
        existing?.onMomentumScrollEnd ?? null,
      ),
    }),
    [
      existing?.onMomentumScrollBegin,
      existing?.onMomentumScrollEnd,
      existing?.onScroll,
      existing?.onScrollBeginDrag,
      existing?.onScrollEndDrag,
      existing?.scrollEventThrottle,
      onMomentumScrollBegin,
      onMomentumScrollEnd,
      onScroll,
      onScrollBeginDrag,
      onScrollEndDrag,
    ],
  );
}
