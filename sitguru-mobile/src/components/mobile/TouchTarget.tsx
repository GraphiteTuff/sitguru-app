import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { TOUCH_MIN } from '@/constants/mobile-layout';

type TouchTargetProps = PressableProps & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Defaults to 48×48dp. */
  minSize?: number;
};

/**
 * Guarantees a fluid ≥48×48dp hit area without forcing oversized visuals.
 */
export default function TouchTarget({
  children,
  style,
  minSize = TOUCH_MIN,
  ...rest
}: TouchTargetProps) {
  return (
    <Pressable
      {...rest}
      hitSlop={rest.hitSlop ?? 4}
      style={(state) => [
        styles.base,
        {
          minHeight: minSize,
          minWidth: minSize,
        },
        typeof style === 'function' ? style(state) : style,
        state.pressed ? styles.pressed : null,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
  },
});
