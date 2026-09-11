import { Ellipsis } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
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
import ToolbarOverflowMenu, {
  type ToolbarOverflowMenuItem,
} from '@/components/navigation/ToolbarOverflowMenu';
import { AppFonts } from '@/constants/fonts';
import { ButtonMetrics } from '@/constants/button-tokens';
import { TOUCH_MIN } from '@/constants/mobile-layout';
import type { TabChromePalette } from '@/constants/role-palettes';
import { TAB_BAR_MOTION } from '@/constants/tab-bar-motion';
import { useTabBarMotion } from '@/context/TabBarMotionContext';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { MAX_CHROME_FONT_MULTIPLIER } from '@/lib/a11y/type-scale';
import { playAppHaptic } from '@/lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type FloatingBubbleTab = {
  key: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

export type FloatingBubbleTabBarProps = {
  tabs: FloatingBubbleTab[];
  activeKey: string;
  palette: TabChromePalette;
  onTabPress: (tab: FloatingBubbleTab) => void;
  floating?: boolean;
  /**
   * UIKit additionalOverflowItems: assigning items shows a trailing
   * overflow button even when the menu list is still resolving.
   */
  additionalOverflowItems?: ToolbarOverflowMenuItem[];
  onOverflowItemPress?: (item: ToolbarOverflowMenuItem) => void;
};

const MORE_TAB_KEY = '__more';
const PILL_WIDTH = ButtonMetrics.tabPillWidth;
const PILL_HEIGHT = ButtonMetrics.tabPillHeight;
const IDLE_BAR_HEIGHT = ButtonMetrics.tabHeight;

export default function FloatingBubbleTabBar({
  tabs,
  activeKey,
  palette,
  onTabPress,
  floating = true,
  additionalOverflowItems,
  onOverflowItemPress,
}: FloatingBubbleTabBarProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const motion = useTabBarMotion();
  const compactProgress = motion?.compactProgress;
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowItems = additionalOverflowItems ?? [];
  const showOverflowButton = additionalOverflowItems != null;
  const overflowSelected = overflowItems.some((item) => item.selected);
  const overflowBadge = overflowItems.reduce(
    (sum, item) => sum + (item.badge ?? 0),
    0,
  );

  const bubbleX = useSharedValue(0);
  const bubbleStretchX = useSharedValue(1);
  const bubbleStretchY = useSharedValue(1);
  const fallbackCompact = useSharedValue(0);
  const compact = compactProgress ?? fallbackCompact;

  const rowWidthRef = useRef(0);
  const bubbleXRef = useRef(0);

  const slotCount = tabs.length + (showOverflowButton ? 1 : 0);
  const tabActiveIndex = tabs.findIndex((tab) => tab.key === activeKey);
  const activeIndex =
    overflowSelected && showOverflowButton
      ? slotCount - 1
      : Math.max(0, tabActiveIndex);

  function slotMetrics(width: number, index: number) {
    const count = Math.max(slotCount, 1);
    const slot = width / count;
    const x = index * slot + (slot - PILL_WIDTH) / 2;
    return { x };
  }

  function handleRowLayout(event: LayoutChangeEvent) {
    const width = event.nativeEvent.layout.width;
    if (width <= 0) return;

    const changed = Math.abs(width - rowWidthRef.current) > 0.5;
    rowWidthRef.current = width;

    const next = slotMetrics(width, activeIndex);

    if (changed) {
      bubbleX.value = next.x;
      bubbleXRef.current = next.x;
      bubbleStretchX.value = 1;
      bubbleStretchY.value = 1;
    }
  }

  useEffect(() => {
    const width = rowWidthRef.current;
    if (width <= 0) return;

    const next = slotMetrics(width, activeIndex);

    const travel = Math.abs(next.x - bubbleXRef.current);
    bubbleXRef.current = next.x;

    if (reduceMotion || travel < 1) {
      bubbleX.value = next.x;
      bubbleStretchX.value = 1;
      bubbleStretchY.value = 1;
      return;
    }

    const slot = width / Math.max(slotCount, 1);
    const stretch = 1 + Math.min(0.22, 0.08 + (travel / Math.max(slot, 1)) * 0.12);

    bubbleX.value = withSpring(next.x, TAB_BAR_MOTION.slideSpring);
    bubbleStretchX.value = withSequence(
      withSpring(stretch, TAB_BAR_MOTION.stretchSpring),
      withSpring(1, TAB_BAR_MOTION.settleSpring),
    );
    bubbleStretchY.value = withSequence(
      withSpring(0.92, TAB_BAR_MOTION.stretchSpring),
      withSpring(1, TAB_BAR_MOTION.settleSpring),
    );
  }, [
    activeIndex,
    activeKey,
    bubbleStretchX,
    bubbleStretchY,
    bubbleX,
    overflowSelected,
    reduceMotion,
    slotCount,
  ]);

  useEffect(() => {
    setOverflowOpen(false);
  }, [activeKey]);

  const capsuleStyle = useAnimatedStyle(() => {
    const progress = compact.value;
    if (reduceMotion) {
      return {
        transform: [{ translateY: 0 }, { scaleX: 1 }, { scaleY: 1 }],
      };
    }

    return {
      transform: [
        {
          translateY: interpolate(
            progress,
            [0, 1],
            [0, TAB_BAR_MOTION.compactTranslateY],
            Extrapolation.CLAMP,
          ),
        },
        {
          scaleX: interpolate(
            progress,
            [0, 1],
            [1, TAB_BAR_MOTION.compactScaleX],
            Extrapolation.CLAMP,
          ),
        },
        {
          scaleY: interpolate(
            progress,
            [0, 1],
            [1, TAB_BAR_MOTION.compactScaleY],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  const bubbleStyle = useAnimatedStyle(() => {
    const compactScale = reduceMotion
      ? 1
      : interpolate(
          compact.value,
          [0, 1],
          [1, TAB_BAR_MOTION.compactBubbleScale],
          Extrapolation.CLAMP,
        );

    return {
      width: PILL_WIDTH,
      height: PILL_HEIGHT,
      transform: [
        { translateX: bubbleX.value },
        { scaleX: bubbleStretchX.value * compactScale },
        { scaleY: bubbleStretchY.value * compactScale },
      ],
    };
  });

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.shell,
        floating && styles.shellFloating,
        {
          paddingBottom: Math.max(insets.bottom, floating ? 8 : 10),
        },
      ]}
    >
      <Animated.View
        collapsable={false}
        style={[
          styles.capsuleWrap,
          floating && styles.capsuleWrapFloating,
          capsuleStyle,
        ]}
      >
        <GlassChrome
          fallbackColor={palette.fallback}
          style={[
            styles.bar,
            floating && styles.barFloating,
            floating
              ? { borderColor: palette.border }
              : { borderTopColor: palette.border },
          ]}
          tintColor={palette.tint}
        >
          <View
            accessibilityRole="tablist"
            onLayout={handleRowLayout}
            style={styles.row}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.bubble,
                { backgroundColor: palette.bubble },
                bubbleStyle,
              ]}
            />

            {tabs.map((tab) => (
              <FloatingTabItem
                key={tab.key}
                active={!overflowSelected && tab.key === activeKey}
                compact={compact}
                mutedColor={palette.mutedColor}
                onPress={() => {
                  if (tab.key === activeKey) return;
                  playAppHaptic('selection');
                  onTabPress(tab);
                }}
                reduceMotion={reduceMotion}
                tab={tab}
                tintColor={palette.activeColor}
              />
            ))}

            {showOverflowButton ? (
              <FloatingTabItem
                active={overflowSelected}
                compact={compact}
                mutedColor={palette.mutedColor}
                onPress={() => {
                  playAppHaptic('selection');
                  motion?.expandNow();
                  setOverflowOpen(true);
                }}
                reduceMotion={reduceMotion}
                tab={{
                  key: MORE_TAB_KEY,
                  label: 'More',
                  icon: Ellipsis,
                  badge: overflowBadge || undefined,
                }}
                tintColor={palette.activeColor}
              />
            ) : null}
          </View>
        </GlassChrome>
      </Animated.View>

      <ToolbarOverflowMenu
        items={overflowItems}
        onClose={() => setOverflowOpen(false)}
        onItemPress={(item) => {
          setOverflowOpen(false);
          onOverflowItemPress?.(item);
        }}
        palette={palette}
        visible={overflowOpen}
      />
    </View>
  );
}

function FloatingTabItem({
  tab,
  active,
  compact,
  reduceMotion,
  tintColor,
  mutedColor,
  onPress,
}: {
  tab: FloatingBubbleTab;
  active: boolean;
  compact: SharedValue<number>;
  reduceMotion: boolean;
  tintColor: string;
  mutedColor: string;
  onPress: () => void;
}) {
  const pressScale = useSharedValue(1);
  const emphasis = useSharedValue(active ? 1 : 0);
  const Icon = tab.icon;
  const color = active ? tintColor : mutedColor;

  useEffect(() => {
    emphasis.value = reduceMotion
      ? active
        ? 1
        : 0
      : withSpring(active ? 1 : 0, TAB_BAR_MOTION.iconSpring);
  }, [active, emphasis, reduceMotion]);

  const itemStyle = useAnimatedStyle(() => {
    const compactScale = reduceMotion
      ? 1
      : interpolate(compact.value, [0, 1], [1, 0.96], Extrapolation.CLAMP);
    const focusScale = interpolate(
      emphasis.value,
      [0, 1],
      [1, 1.04],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      emphasis.value,
      [0, 1],
      [0.72, 1],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      transform: [{ scale: pressScale.value * focusScale * compactScale }],
    };
  });

  return (
    <AnimatedPressable
      accessibilityLabel={tab.label}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      hitSlop={10}
      onPress={onPress}
      onPressIn={() => {
        pressScale.value = reduceMotion
          ? 0.96
          : withSpring(0.94, TAB_BAR_MOTION.iconSpring);
      }}
      onPressOut={() => {
        pressScale.value = reduceMotion
          ? 1
          : withSpring(1, TAB_BAR_MOTION.settleSpring);
      }}
      style={[styles.tab, itemStyle]}
    >
      <View style={styles.iconWell}>
        <Icon
          color={color}
          size={ButtonMetrics.tabIcon}
          strokeWidth={active ? 2.4 : 2.1}
        />

        {tab.badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {tab.badge > 9 ? '9+' : tab.badge}
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        adjustsFontSizeToFit
        allowFontScaling
        maxFontSizeMultiplier={MAX_CHROME_FONT_MULTIPLIER}
        minimumFontScale={0.88}
        numberOfLines={1}
        style={[styles.label, { color }]}
      >
        {tab.label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
  },
  shellFloating: {
    paddingHorizontal: 0,
    paddingTop: 6,
  },
  capsuleWrap: {
    width: '100%',
  },
  capsuleWrapFloating: {
    alignSelf: 'center',
    width: `${TAB_BAR_MOTION.expandedWidthPct * 100}%`,
    ...Platform.select({
      ios: {
        shadowColor: '#18211C',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: IDLE_BAR_HEIGHT,
  },
  barFloating: {
    borderRadius: 999,
    borderTopWidth: 0,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: IDLE_BAR_HEIGHT,
    paddingHorizontal: 4,
    position: 'relative',
  },
  bubble: {
    borderRadius: 999,
    height: PILL_HEIGHT,
    left: 0,
    position: 'absolute',
    top: (IDLE_BAR_HEIGHT - PILL_HEIGHT) / 2,
    width: PILL_WIDTH,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    gap: ButtonMetrics.tabGap,
    justifyContent: 'center',
    minHeight: TOUCH_MIN,
    paddingHorizontal: 2,
    paddingVertical: 4,
    zIndex: 1,
  },
  iconWell: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    overflow: 'visible',
    width: 36,
  },
  label: {
    fontFamily: AppFonts.bold,
    fontSize: ButtonMetrics.tabLabel,
    paddingHorizontal: 2,
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
    top: -3,
    zIndex: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.extraBold,
    fontSize: 10,
    lineHeight: 13,
  },
});
