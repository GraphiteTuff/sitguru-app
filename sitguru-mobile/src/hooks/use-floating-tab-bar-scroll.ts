import { useCallback, useMemo, useRef } from 'react';
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollViewProps,
} from 'react-native';

import { useOptionalTabBarMotion } from '@/context/TabBarMotionContext';

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
 */
export function useFloatingTabBarScroll(
  existing?: Partial<FloatingTabBarScrollHandlers>,
): FloatingTabBarScrollHandlers {
  const motion = useOptionalTabBarMotion();
  const lastOffsetY = useRef(0);
  const dragging = useRef(false);

  const onScrollBeginDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      dragging.current = true;
      lastOffsetY.current = event.nativeEvent.contentOffset.y;
      motion?.reportScrollBegin();
    },
    [motion],
  );

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      const delta = y - lastOffsetY.current;
      lastOffsetY.current = y;

      if (Math.abs(delta) > 0) {
        motion?.reportScrollDelta(delta);
      }
    },
    [motion],
  );

  const onScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      dragging.current = false;
      lastOffsetY.current = event.nativeEvent.contentOffset.y;
      const velocity = event.nativeEvent.velocity?.y ?? 0;
      // Momentum will continue — wait for momentum end before expanding.
      if (Math.abs(velocity) < 0.05) {
        motion?.reportScrollEnd();
      }
    },
    [motion],
  );

  const onMomentumScrollBegin = useCallback(() => {
    motion?.reportScrollBegin();
  }, [motion]);

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      lastOffsetY.current = event.nativeEvent.contentOffset.y;
      motion?.reportScrollEnd();
    },
    [motion],
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
