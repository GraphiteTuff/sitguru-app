import { useCallback } from 'react';
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';

import { useTabBarMotion } from '@/context/TabBarMotionContext';

type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>;

type UseFloatingTabBarScrollOptions = {
  onScroll?: (event: ScrollEvent) => void;
  enabled?: boolean;
};

export type FloatingTabBarScrollProps = {
  onScroll: (event: ScrollEvent) => void;
  onScrollBeginDrag: (event: ScrollEvent) => void;
  onScrollEndDrag: (event: ScrollEvent) => void;
  onMomentumScrollBegin: (event: ScrollEvent) => void;
  onMomentumScrollEnd: (event: ScrollEvent) => void;
  scrollEventThrottle: 16;
};

/**
 * Attach to ScrollView / FlatList / SectionList so the floating tab bar
 * can compact and expand. Updates Reanimated shared values only — no
 * React state on scroll.
 */
export function useFloatingTabBarScroll(
  options: UseFloatingTabBarScrollOptions = {},
): FloatingTabBarScrollProps {
  const motion = useTabBarMotion();
  const enabled = options.enabled !== false;
  const extraOnScroll = options.onScroll;

  const onScroll = useCallback(
    (event: ScrollEvent) => {
      if (enabled) {
        motion?.ingestScrollOffset(event.nativeEvent.contentOffset.y);
      }
      extraOnScroll?.(event);
    },
    [enabled, extraOnScroll, motion],
  );

  const onScrollBeginDrag = useCallback(
    (event: ScrollEvent) => {
      if (!enabled) return;
      motion?.beginDrag(event.nativeEvent.contentOffset.y);
    },
    [enabled, motion],
  );

  const onScrollEndDrag = useCallback(
    (event: ScrollEvent) => {
      if (!enabled) return;
      motion?.ingestScrollOffset(event.nativeEvent.contentOffset.y);
      motion?.endDrag();
    },
    [enabled, motion],
  );

  const onMomentumScrollBegin = useCallback(
    (_event: ScrollEvent) => {
      if (!enabled) return;
      motion?.beginMomentum();
    },
    [enabled, motion],
  );

  const onMomentumScrollEnd = useCallback(
    (_event: ScrollEvent) => {
      if (!enabled) return;
      motion?.endMomentum();
    },
    [enabled, motion],
  );

  return {
    onScroll,
    onScrollBeginDrag,
    onScrollEndDrag,
    onMomentumScrollBegin,
    onMomentumScrollEnd,
    scrollEventThrottle: 16,
  };
}
