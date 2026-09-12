import { type ReactNode, useEffect } from 'react';
import {
  Pressable,
  type PressableProps,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { playAppHaptic, type AppHaptic } from '@/lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type BubblePressableProps = Omit<PressableProps, 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** How far the control compresses while held. */
  scaleTo?: number;
  /** Renders an expanding tint behind the content, used by the tab bar. */
  bubble?: boolean;
  /** `glyph` is the App Store tab pop — a circle behind the icon only. */
  bubblePlacement?: 'fill' | 'glyph';
  bubbleColor?: string;
  bubbleStyle?: ViewStyle;
  active?: boolean;
  haptic?: AppHaptic;
};

const PRESS_SPRING = {
  damping: 14,
  mass: 0.5,
  stiffness: 320,
};

const RELEASE_SPRING = {
  damping: 9,
  mass: 0.5,
  stiffness: 300,
};

const BUBBLE_SPRING = {
  damping: 12,
  mass: 0.38,
  stiffness: 420,
};

/**
 * Tap target that compresses on press and springs back with a slight
 * overshoot, optionally revealing a tinted bubble behind its content.
 */
export default function BubblePressable({
  children,
  style,
  scaleTo = 0.94,
  bubble = false,
  bubblePlacement = 'fill',
  bubbleColor = 'rgba(13,92,58,0.12)',
  bubbleStyle,
  active = false,
  haptic = 'light',
  disabled,
  hitSlop,
  onPressIn,
  onPressOut,
  ...rest
}: BubblePressableProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const bubbleProgress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    bubbleProgress.set(
      reduceMotion
        ? active
          ? 1
          : 0
        : withSpring(active ? 1 : 0, BUBBLE_SPRING),
    );
  }, [active, bubbleProgress, reduceMotion]);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bubbleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 0.2 + bubbleProgress.value * 0.8,
    transform: [{ scale: 0.22 + bubbleProgress.value * 0.78 }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      hitSlop={hitSlop ?? 6}
      onPressIn={(event) => {
        if (!disabled) {
          playAppHaptic(haptic);
          scale.set(
            reduceMotion ? scaleTo : withSpring(scaleTo, PRESS_SPRING),
          );
          bubbleProgress.set(
            reduceMotion ? 1 : withSpring(1, BUBBLE_SPRING),
          );
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.set(reduceMotion ? 1 : withSpring(1, RELEASE_SPRING));
        if (!active) {
          bubbleProgress.set(
            reduceMotion ? 0 : withSpring(0, BUBBLE_SPRING),
          );
        }
        onPressOut?.(event);
      }}
      style={[
        style,
        contentStyle,
        bubble
          ? bubblePlacement === 'glyph'
            ? styles.clipVisible
            : styles.clipHidden
          : null,
      ]}
    >
      {bubble ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.bubble,
            bubblePlacement === 'glyph' ? styles.glyphBubble : styles.fillBubble,
            { backgroundColor: bubbleColor },
            bubbleStyle,
            bubbleAnimatedStyle,
          ]}
        />
      ) : null}

      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  clipVisible: {
    overflow: 'visible',
  },
  clipHidden: {
    overflow: 'hidden',
  },
  bubble: {
    position: 'absolute',
  },
  /** Wide CTAs: tint stays inside the button shape (not a floating circle). */
  fillBubble: {
    borderRadius: 0,
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  },
  glyphBubble: {
    alignSelf: 'center',
    borderRadius: 999,
    bottom: undefined,
    height: 46,
    left: '50%',
    marginLeft: -23,
    right: undefined,
    top: 0,
    width: 46,
  },
});
