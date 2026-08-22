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
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type BubblePressableProps = Omit<PressableProps, 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** How far the control compresses while held. */
  scaleTo?: number;
  /** Renders an expanding tint behind the content, used by the tab bar. */
  bubble?: boolean;
  bubbleColor?: string;
  bubbleStyle?: ViewStyle;
  active?: boolean;
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

/**
 * Tap target that compresses on press and springs back with a slight
 * overshoot, optionally revealing a tinted bubble behind its content.
 */
export default function BubblePressable({
  children,
  style,
  scaleTo = 0.94,
  bubble = false,
  bubbleColor = 'rgba(13,92,58,0.12)',
  bubbleStyle,
  active = false,
  onPressIn,
  onPressOut,
  ...rest
}: BubblePressableProps) {
  const scale = useSharedValue(1);
  const bubbleProgress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    bubbleProgress.value = withTiming(active ? 1 : 0, { duration: 220 });
  }, [active, bubbleProgress]);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bubbleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bubbleProgress.value,
    transform: [{ scale: 0.6 + bubbleProgress.value * 0.4 }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(event) => {
        scale.value = withSpring(scaleTo, PRESS_SPRING);
        bubbleProgress.value = withTiming(1, { duration: 140 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, RELEASE_SPRING);
        if (!active) {
          bubbleProgress.value = withTiming(0, { duration: 220 });
        }
        onPressOut?.(event);
      }}
      style={[style, contentStyle]}
    >
      {bubble ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.bubble,
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
  bubble: {
    borderRadius: 999,
    bottom: -6,
    left: -6,
    position: 'absolute',
    right: -6,
    top: -6,
  },
});
