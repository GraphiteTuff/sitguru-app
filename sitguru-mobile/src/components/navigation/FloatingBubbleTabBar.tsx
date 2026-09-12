import { Ellipsis } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
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
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BubblePressable from '@/components/BubblePressable';
import GlassChrome from '@/components/mobile/GlassChrome';
import ToolbarOverflowMenu, {
  type ToolbarOverflowMenuItem,
} from '@/components/navigation/ToolbarOverflowMenu';
import { AppFonts } from '@/constants/fonts';
import { ButtonMetrics } from '@/constants/button-tokens';
import { TOUCH_MIN } from '@/constants/mobile-layout';
import type { TabChromePalette } from '@/constants/role-palettes';
import { SitGuruAccent } from '@/constants/button-tokens';
import { TAB_BAR_MOTION } from '@/constants/tab-bar-motion';
import { useTabBarMotion } from '@/context/TabBarMotionContext';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { MAX_CHROME_FONT_MULTIPLIER } from '@/lib/a11y/type-scale';

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
  const [overflowForKey, setOverflowForKey] = useState(activeKey);

  if (overflowForKey !== activeKey) {
    setOverflowForKey(activeKey);
    setOverflowOpen(false);
  }
  const overflowItems = additionalOverflowItems ?? [];
  const showOverflowButton = additionalOverflowItems != null;
  const overflowSelected = overflowItems.some((item) => item.selected);
  const overflowBadge = overflowItems.reduce(
    (sum, item) => sum + (item.badge ?? 0),
    0,
  );

  const fallbackCompact = useSharedValue(0);
  const fallbackBubbleX = useSharedValue(0);
  const fallbackBubbleWidth = useSharedValue(PILL_WIDTH);
  const fallbackStretchX = useSharedValue(1);
  const fallbackStretchY = useSharedValue(1);
  const compact = compactProgress ?? fallbackCompact;
  const bubbleX = motion?.bubbleX ?? fallbackBubbleX;
  const bubbleWidth = motion?.bubbleWidth ?? fallbackBubbleWidth;
  const bubbleStretchX = motion?.bubbleStretchX ?? fallbackStretchX;
  const bubbleStretchY = motion?.bubbleStretchY ?? fallbackStretchY;

  const rowWidthRef = useRef(0);

  const slotCount = tabs.length + (showOverflowButton ? 1 : 0);
  const tabActiveIndex = tabs.findIndex((tab) => tab.key === activeKey);
  const activeIndex =
    overflowSelected && showOverflowButton
      ? slotCount - 1
      : Math.max(0, tabActiveIndex);

  const moveSelection = useCallback(
    (index: number, animate: boolean) => {
      const width = rowWidthRef.current;
      if (width <= 0) return;
      motion?.moveBubbleTo({
        width,
        index,
        slotCount,
        animate,
      });
    },
    [motion, slotCount],
  );

  function handleRowLayout(event: LayoutChangeEvent) {
    const width = event.nativeEvent.layout.width;
    if (width <= 0) return;

    const firstLayout = rowWidthRef.current <= 0;
    rowWidthRef.current = width;
    moveSelection(activeIndex, !firstLayout);
  }

  useEffect(() => {
    moveSelection(activeIndex, true);
  }, [activeIndex, activeKey, moveSelection, overflowSelected, slotCount]);

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
      width: bubbleWidth.value,
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

            {tabs.map((tab, index) => (
              <FloatingTabItem
                key={tab.key}
                active={!overflowSelected && tab.key === activeKey}
                compact={compact}
                mutedColor={palette.mutedColor}
                onPress={() => {
                  if (tab.key === activeKey) return;
                  onTabPress(tab);
                }}
                onThumbDown={() => {
                  motion?.expandNow();
                  moveSelection(index, true);
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
                  motion?.expandNow();
                  setOverflowOpen(true);
                }}
                onThumbDown={() => {
                  motion?.expandNow();
                  moveSelection(slotCount - 1, true);
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
  onThumbDown,
}: {
  tab: FloatingBubbleTab;
  active: boolean;
  compact: SharedValue<number>;
  reduceMotion: boolean;
  tintColor: string;
  mutedColor: string;
  onPress: () => void;
  onThumbDown: () => void;
}) {
  const emphasis = useSharedValue(active ? 1 : 0);
  const Icon = tab.icon;
  const color = active ? tintColor : mutedColor;

  useEffect(() => {
    emphasis.set(
      reduceMotion
        ? active
          ? 1
          : 0
        : withSpring(active ? 1 : 0, TAB_BAR_MOTION.iconSpring),
    );
  }, [active, emphasis, reduceMotion]);

  const wrapStyle = useAnimatedStyle(() => {
    const compactScale = reduceMotion
      ? 1
      : interpolate(compact.value, [0, 1], [1, 0.96], Extrapolation.CLAMP);
    const focusScale = interpolate(
      emphasis.value,
      [0, 1],
      [1, 1.06],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      emphasis.value,
      [0, 1],
      [0.7, 1],
      Extrapolation.CLAMP,
    );

    return {
      flex: 1,
      flexBasis: 0,
      opacity,
      transform: [{ scale: focusScale * compactScale }],
    };
  });

  return (
    <Animated.View style={wrapStyle}>
      <BubblePressable
        accessibilityLabel={`${tab.label} tab`}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        active={active}
        bubble
        bubbleColor={SitGuruAccent.soft}
        bubblePlacement="glyph"
        haptic="selection"
        hitSlop={10}
        onPress={onPress}
        onPressIn={onThumbDown}
        scaleTo={0.9}
        style={styles.tab}
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
      </BubblePressable>
    </Animated.View>
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
    overflow: 'visible',
    paddingHorizontal: 2,
    paddingVertical: 4,
    width: '100%',
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
