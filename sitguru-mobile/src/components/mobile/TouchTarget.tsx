import type { ReactNode } from 'react';
import {
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import { TOUCH_MIN } from '@/constants/mobile-layout';

type TouchTargetProps = Omit<PressableProps, 'style'> & {
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
    <BubblePressable
      {...rest}
      hitSlop={rest.hitSlop ?? 4}
      style={[
        styles.base,
        {
          minHeight: minSize,
          minWidth: minSize,
        },
        style,
      ]}
    >
      {children}
    </BubblePressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
