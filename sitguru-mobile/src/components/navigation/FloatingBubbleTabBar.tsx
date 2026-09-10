import type { LucideIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GlassChrome from '@/components/mobile/GlassChrome';
import { AppFonts } from '@/constants/fonts';
import { TOUCH_MIN } from '@/constants/mobile-layout';
import { useOptionalTabBarMotion } from '@/context/TabBarMotionContext';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useThemeMode } from '@/hooks/use-theme';
import { MAX_CHROME_FONT_MULTIPLIER } from '@/lib/a11y/type-scale';
import { playAppHaptic } from '@/lib/haptics';

export type FloatingTabItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  accessibilityLabel?: string;
};

export type FloatingBubbleTabBarProps = {
  tabs: FloatingTabItem[];
  activeKey: string;
  badges?: Partial<Record<string, number>>;
  onTabPress: (tab: FloatingTabItem) => void;
};

const BUBBLE_MOVE_SPRING = {
  damping: 24,
  mass: 0.72,
  stiffness: 290,
} as const;

const BUBBLE_STRETCH_SPRING = {
  damping: 18,
  mass: 0.55,
  stiffness: 340,
} as const;

const ICON_SPRING = {
  damping: 16,
  mass: 0.45,
  stiffness: 320,
} as const;

const EXPANDED_WIDTH_RATIO = 0.91;
const COMPACT_WIDTH_RATIO = 0.8;
const EXPANDED_HEIGHT = 66;
const COMPACT_HEIGHT = 54;
const BUBBLE_H_PAD = 4;
const BUBBLE_V_PAD = 4;

type Palette = {
  fallback: string;
  border: string;
  activeColor: string;
  mutedColor: string;
  bubble: string;
  tint: string;
  shadow: string;
};

function usePalette(isDark: boolean): Palette {
  return useMemo(
    () =>
      isDark
        ? {
            fallback: 'rgba(8, 28, 20, 0.92)',
            border: 'rgba(88, 213, 138, 0.22)',
            activeColor: '#58D58A',
            mutedColor: '#8FA096',
            bubble: 'rgba(88, 213, 138, 0.28)',
            tint: '#081C14',
            shadow: '#000000',
          }
        : {
            fallback: 'rgba(255, 252, 247, 0.94)',
            border: 'rgba(26, 78, 55, 0.12)',
            activeColor: '#1A4E37',
            mutedColor: '#79857B',
            bubble: 'rgba(26, 78, 55, 0.14)',
            tint: '#FFFCF7',
            shadow: '#0D5C3A',
          },
    [isDark],
  );
}

/**
 * SitGuru floating glass capsule tab bar with one persistent sliding
 * selection bubble and scroll-reactive compact/expand motion.
 */
export default function FloatingBubbleTabBar({
  tabs,
  activeKey,
  badges,
  onTabPress,
}: FloatingBubbleTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isDark = useThemeMode() === 'dark';
  const palette = usePalette(isDark);
  const reduceMotion = useReducedMotion();
  const motion = useOptionalTabBarMotion();

  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.key === activeKey),
  );

  const [trackWidth, setTrackWidth] = useState(0);
  const trackPadding = 4;
  const contentWidth = Math.max(trackWidth - trackPadding * 2, 0);
  const slotWidth =
    tabs.length > 0 && contentWidth > 0 ? contentWidth / tabs.length : 0;

  const activeBubbleX = useSharedValue(0);
  const bubbleScaleX = useSharedValue(1);
  const bubbleScaleY = useSharedValue(1);
  const activeIndexSV = useSharedValue(activeIndex);
  const fallbackCompact = useSharedValue(0);
  const navCompactProgress = motion?.navCompactProgress ?? fallbackCompact;

  const bubbleWidth = Math.max(slotWidth - BUBBLE_H_PAD * 2, 0);
  const bubbleHeight = EXPANDED_HEIGHT - BUBBLE_V_PAD * 2 - 2;

  const settleBubble = useCallback(
    (index: number, width: number, animated: boolean) => {
      if (width <= 0 || tabs.length === 0) return;

      const usable = Math.max(width - trackPadding * 2, 0);
      const slot = usable / tabs.length;
      const targetX = trackPadding + slot * index + BUBBLE_H_PAD;
      const travel = Math.abs(targetX - activeBubbleX.value);
      const stretch = Math.min(1.32, 1 + travel / Math.max(usable, 1));

      activeIndexSV.value = index;

      if (!animated || reduceMotion) {
        activeBubbleX.value = targetX;
        bubbleScaleX.value = 1;
        bubbleScaleY.value = 1;
        return;
      }

      bubbleScaleX.value = withSequence(
        withSpring(stretch, BUBBLE_STRETCH_SPRING),
        withSpring(1, BUBBLE_MOVE_SPRING),
      );
      bubbleScaleY.value = withSequence(
        withSpring(0.92, BUBBLE_STRETCH_SPRING),
        withSpring(1, BUBBLE_MOVE_SPRING),
      );
      activeBubbleX.value = withSpring(targetX, BUBBLE_MOVE_SPRING);
    },
    [
      activeBubbleX,
      activeIndexSV,
      bubbleScaleX,
      bubbleScaleY,
      reduceMotion,
      tabs.length,
      trackPadding,
    ],
  );

  useEffect(() => {
    settleBubble(activeIndex, trackWidth, true);
  }, [activeIndex, settleBubble, trackWidth]);

  const onTrackLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const next = Math.round(event.nativeEvent.layout.width);
      if (next === trackWidth) return;
      setTrackWidth(next);
      settleBubble(activeIndex, next, false);
    },
    [activeIndex, settleBubble, trackWidth],
  );

  const capsuleStyle = useAnimatedStyle(() => {
    const progress = navCompactProgress.value;
    const widthRatio = interpolate(
      progress,
      [0, 1],
      [EXPANDED_WIDTH_RATIO, COMPACT_WIDTH_RATIO],
      Extrapolation.CLAMP,
    );
    const height = interpolate(
      progress,
      [0, 1],
      [EXPANDED_HEIGHT, COMPACT_HEIGHT],
      Extrapolation.CLAMP,
    );
    const translateY = interpolate(progress, [0, 1], [0, 6], Extrapolation.CLAMP);
    const horizontalPad = ((1 - widthRatio) / 2) * windowWidth;

    return {
      height,
      marginHorizontal: horizontalPad,
      transform: [{ translateY }],
    };
  }, [windowWidth]);

  const bubbleStyle = useAnimatedStyle(() => {
    const progress = navCompactProgress.value;
    const height = interpolate(
      progress,
      [0, 1],
      [bubbleHeight, Math.max(bubbleHeight - 10, 40)],
      Extrapolation.CLAMP,
    );
    const widthScale = interpolate(progress, [0, 1], [1, 0.92], Extrapolation.CLAMP);

    return {
      height,
      opacity: interpolate(progress, [0, 1], [1, 0.92], Extrapolation.CLAMP),
      transform: [
        { translateX: activeBubbleX.value },
        { scaleX: bubbleScaleX.value * widthScale },
        { scaleY: bubbleScaleY.value },
      ],
      width: Math.max(bubbleWidth, 0),
    };
  }, [bubbleHeight, bubbleWidth]);

  const bottomPad = Math.max(insets.bottom, 8) + 6;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.outer, { paddingBottom: bottomPad }]}
    >
      <Animated.View style={[styles.capsuleShadowWrap, capsuleStyle]}>
        <View
          style={[
            styles.shadow,
            {
              shadowColor: palette.shadow,
              ...(Platform.OS === 'android'
                ? { elevation: 10 }
                : {
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: isDark ? 0.45 : 0.16,
                    shadowRadius: 18,
                  }),
            },
          ]}
        >
          <GlassChrome
            fallbackColor={palette.fallback}
            style={[styles.capsule, { borderColor: palette.border }]}
            tintColor={palette.tint}
          >
            <View
              accessibilityRole="tablist"
              onLayout={onTrackLayout}
              style={styles.track}
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.activeBubble,
                  { backgroundColor: palette.bubble },
                  bubbleStyle,
                ]}
              />

              {tabs.map((tab, index) => (
                <TabButton
                  key={tab.key}
                  activeColor={palette.activeColor}
                  activeIndexSV={activeIndexSV}
                  badge={badges?.[tab.key]}
                  compactProgress={navCompactProgress}
                  index={index}
                  isActive={index === activeIndex}
                  mutedColor={palette.mutedColor}
                  reduceMotion={reduceMotion}
                  tab={tab}
                  onPress={() => {
                    if (tab.key !== activeKey) {
                      playAppHaptic('selection');
                    }
                    onTabPress(tab);
                  }}
                />
              ))}
            </View>
          </GlassChrome>
        </View>
      </Animated.View>
    </View>
  );
}

function TabButton({
  tab,
  index,
  isActive,
  badge,
  activeColor,
  mutedColor,
  activeIndexSV,
  compactProgress,
  reduceMotion,
  onPress,
}: {
  tab: FloatingTabItem;
  index: number;
  isActive: boolean;
  badge?: number;
  activeColor: string;
  mutedColor: string;
  activeIndexSV: SharedValue<number>;
  compactProgress: SharedValue<number>;
  reduceMotion: boolean;
  onPress: () => void;
}) {
  const Icon = tab.icon;
  const emphasis = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      emphasis.value = isActive ? 1 : 0;
      return;
    }
    emphasis.value = withSpring(isActive ? 1 : 0, ICON_SPRING);
  }, [emphasis, isActive, reduceMotion]);

  const iconWrapStyle = useAnimatedStyle(() => {
    const selected =
      Math.round(activeIndexSV.value) === index ? 1 : emphasis.value;
    const compact = compactProgress.value;
    const baseScale = interpolate(selected, [0, 1], [0.96, 1.08]);
    const compactScale = interpolate(compact, [0, 1], [1, selected ? 0.96 : 0.9]);

    return {
      opacity: interpolate(selected, [0, 1], [0.72, 1]),
      transform: [{ scale: baseScale * compactScale }],
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    const compact = compactProgress.value;
    return {
      opacity: interpolate(compact, [0, 1], [1, 0.75], Extrapolation.CLAMP),
      transform: [
        {
          scale: interpolate(compact, [0, 1], [1, 0.92], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const color = isActive ? activeColor : mutedColor;

  return (
    <Pressable
      accessibilityLabel={tab.accessibilityLabel ?? tab.label}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      onPress={onPress}
      style={styles.tab}
    >
      <Animated.View style={[styles.iconWell, iconWrapStyle]}>
        <Icon color={color} size={22} strokeWidth={isActive ? 2.6 : 2.15} />
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        ) : null}
      </Animated.View>

      <Animated.Text
        adjustsFontSizeToFit
        allowFontScaling
        maxFontSizeMultiplier={MAX_CHROME_FONT_MULTIPLIER}
        minimumFontScale={0.86}
        numberOfLines={1}
        style={[styles.label, { color }, labelStyle]}
      >
        {tab.label}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: 'transparent',
    overflow: 'visible',
    width: '100%',
  },
  capsuleShadowWrap: {
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  shadow: {
    borderRadius: 999,
    flex: 1,
  },
  capsule: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    overflow: 'hidden',
  },
  track: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    height: '100%',
    paddingHorizontal: 4,
    position: 'relative',
  },
  activeBubble: {
    borderRadius: 999,
    left: 0,
    position: 'absolute',
    top: BUBBLE_V_PAD,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    gap: 1,
    height: '100%',
    justifyContent: 'center',
    minHeight: TOUCH_MIN,
    paddingHorizontal: 2,
    zIndex: 2,
  },
  iconWell: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
    overflow: 'visible',
    width: 44,
  },
  label: {
    fontFamily: AppFonts.bold,
    fontSize: 10,
    paddingHorizontal: 1,
    textAlign: 'center',
    width: '100%',
  },
  badge: {
    alignItems: 'center',
    backgroundColor: '#E5484D',
    borderRadius: 999,
    height: 16,
    justifyContent: 'center',
    minWidth: 16,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -6,
    top: -4,
    zIndex: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.extraBold,
    fontSize: 10,
    lineHeight: 13,
  },
});
