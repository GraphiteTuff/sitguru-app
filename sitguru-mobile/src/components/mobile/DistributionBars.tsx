import { useEffect, useState } from 'react';
import {
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { SitGuruColors } from '@/constants/colors';
import { AppFonts } from '@/constants/fonts';
import { MobileSpace, MobileType, TOUCH_MIN } from '@/constants/mobile-layout';

export type DistributionBarItem = {
  id: string;
  label: string;
  value: number;
  helper?: string;
};

type DistributionBarsProps = {
  items: DistributionBarItem[];
  maxValue?: number;
  emptyLabel?: string;
  style?: StyleProp<ViewStyle>;
};

function AnimatedFill({
  widthPct,
  delayMs,
}: {
  widthPct: number;
  delayMs: number;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const width = useSharedValue(0);

  useEffect(() => {
    if (trackWidth <= 0) return;
    const target = Math.max(4, (widthPct / 100) * trackWidth);
    width.value = 0;
    width.value = withTiming(target, {
      duration: 480 + delayMs,
      easing: Easing.linear,
    });
  }, [delayMs, trackWidth, width, widthPct]);

  const fillStyle = useAnimatedStyle(() => ({
    width: width.value,
  }));

  function onTrackLayout(event: LayoutChangeEvent) {
    setTrackWidth(event.nativeEvent.layout.width);
  }

  return (
    <View style={styles.track} onLayout={onTrackLayout}>
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

/**
 * Horizontal StyleSheet distribution bars — width opens via linear interpolation.
 */
export default function DistributionBars({
  items,
  maxValue,
  emptyLabel = 'No activity in this window yet.',
  style,
}: DistributionBarsProps) {
  const peak = Math.max(
    maxValue ?? 0,
    ...items.map((item) => item.value),
    0,
  );

  if (!items.length || peak <= 0) {
    return (
      <View style={[styles.wrap, style]}>
        <Text style={styles.empty}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      {items.map((item, index) => {
        const widthPct = Math.max(6, Math.round((item.value / peak) * 100));

        return (
          <View key={item.id} style={styles.row}>
            <View style={styles.copy}>
              <Text style={styles.label}>{item.label}</Text>
              {item.helper ? (
                <Text style={styles.helper}>{item.helper}</Text>
              ) : null}
            </View>
            <AnimatedFill widthPct={widthPct} delayMs={index * 40} />
            <Text style={styles.value}>{item.value}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: MobileSpace.md,
    width: '100%',
  },
  empty: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.regular,
    fontSize: MobileType.body,
    lineHeight: 21,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: MobileSpace.sm,
    minHeight: TOUCH_MIN - 4,
  },
  copy: {
    flexBasis: 112,
    flexGrow: 0,
    flexShrink: 0,
    gap: 2,
  },
  label: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.semiBold,
    fontSize: MobileType.caption,
  },
  helper: {
    color: SitGuruColors.textSoft,
    fontFamily: AppFonts.regular,
    fontSize: MobileType.micro,
  },
  track: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 999,
    flex: 1,
    height: 12,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    height: '100%',
  },
  value: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.bold,
    fontSize: MobileType.caption,
    minWidth: 28,
    textAlign: 'right',
  },
});
