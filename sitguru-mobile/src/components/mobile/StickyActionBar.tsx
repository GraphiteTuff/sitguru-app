import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  MobileSpace,
  ThumbZone,
  TOUCH_MIN,
} from '@/constants/mobile-layout';
import { SitGuruColors } from '@/constants/colors';

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
  const bottomPad = embedded
    ? MobileSpace.sm
    : Math.max(insets.bottom, MobileSpace.sm) +
      (aboveBottomNav ? bottomNavHeight : 0);

  return (
    <View
      pointerEvents="box-none"
      style={[
        embedded ? styles.wrapEmbedded : styles.wrapAbsolute,
        { paddingBottom: bottomPad },
        style,
      ]}
    >
      <View style={styles.bar}>
        {secondary ? <View style={styles.secondary}>{secondary}</View> : null}
        <View style={styles.primary}>{children}</View>
      </View>
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
    width: '100%',
  },
  bar: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    elevation: 12,
    gap: MobileSpace.sm,
    minHeight: ThumbZone.stickyActionMinHeight,
    paddingHorizontal: MobileSpace.lg,
    paddingTop: MobileSpace.md,
    shadowColor: '#0B3D28',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
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
