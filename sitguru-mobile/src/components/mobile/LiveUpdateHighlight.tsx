import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { SitGuruColors } from '@/constants/colors';

type LiveUpdateHighlightProps = {
  /** Change this when network data refreshes (earnings, request count, etc.). */
  watchKey: string | number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Brief scale + green flash when live dashboard metrics update.
 */
export default function LiveUpdateHighlight({
  watchKey,
  children,
  style,
}: LiveUpdateHighlightProps) {
  const flash = useSharedValue(0);
  const scale = useSharedValue(1);
  const primed = useSharedValue(0);

  useEffect(() => {
    if (primed.value === 0) {
      primed.value = 1;
      return;
    }

    flash.value = withSequence(
      withTiming(1, { duration: 140 }),
      withTiming(0, { duration: 520 }),
    );
    scale.value = withSequence(
      withTiming(1.018, { duration: 140 }),
      withTiming(1, { duration: 420 }),
    );
  }, [flash, primed, scale, watchKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor:
      flash.value > 0.05 ? SitGuruColors.primary : SitGuruColors.border,
    shadowColor: SitGuruColors.primary,
    shadowOpacity: flash.value * 0.22,
    shadowRadius: 10 * flash.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.base, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    width: '100%',
  },
});
