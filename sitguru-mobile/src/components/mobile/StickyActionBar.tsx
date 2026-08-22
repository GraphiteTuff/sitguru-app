import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GlassChrome from '@/components/mobile/GlassChrome';
import {
  MobileSpace,
  ThumbZone,
  TOUCH_MIN,
} from '@/constants/mobile-layout';
import { useTheme } from '@/hooks/use-theme';

type StickyActionBarProps = {
  children: ReactNode;
  secondary?: ReactNode;
  style?: StyleProp<ViewStyle>;
  embedded?: boolean;
  aboveBottomNav?: boolean;
  bottomNavHeight?: number;
};

/**
 * One-handed thumb zone: full-width primary CTAs locked to the bottom
 * (with bottom tabs). Prefer this over top/left desktop-style actions.
 * pointerEvents="box-none" keeps scroll content interactive above the bar.
 */
export default function StickyActionBar({
  children,
  secondary,
  style,
  embedded = false,
  aboveBottomNav = false,
  bottomNavHeight = 64,
}: StickyActionBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const bottomPad = embedded
    ? MobileSpace.sm
    : Math.max(insets.bottom, MobileSpace.sm) +
      (aboveBottomNav ? bottomNavHeight : 0);

  return (
    <View
      collapsable={false}
      pointerEvents="box-none"
      style={[
        embedded ? styles.wrapEmbedded : styles.wrapAbsolute,
        { paddingBottom: bottomPad },
        style,
      ]}
    >
      <GlassChrome
        fallbackColor={theme.colors.elevatedCard}
        style={[styles.bar, { borderTopColor: theme.colors.divider }]}
        tintColor={theme.colors.elevatedCard}
      >
        <View pointerEvents="auto">
          {secondary ? <View style={styles.secondary}>{secondary}</View> : null}
          <View style={styles.primary}>{children}</View>
        </View>
      </GlassChrome>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapAbsolute: {
    backgroundColor: 'transparent',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 20,
  },
  wrapEmbedded: {
    backgroundColor: 'transparent',
    elevation: 14,
    width: '100%',
    zIndex: 20,
  },
  bar: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: MobileSpace.sm,
    minHeight: ThumbZone.stickyActionMinHeight,
    overflow: 'hidden',
    paddingHorizontal: MobileSpace.lg,
    paddingTop: MobileSpace.md,
  },
  primary: {
    gap: MobileSpace.sm,
    minHeight: TOUCH_MIN,
    width: '100%',
  },
  secondary: {
    gap: MobileSpace.sm,
    width: '100%',
  },
});
