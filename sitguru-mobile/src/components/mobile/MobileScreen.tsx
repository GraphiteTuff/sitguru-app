import type { ReactNode } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MobileSpace } from '@/constants/mobile-layout';
import { SitGuruColors } from '@/constants/colors';

type MobileScreenProps = {
  children: ReactNode;
  /** Sticky footer (StickyActionBar and/or bottom nav). */
  footer?: ReactNode;
  /** Extra bottom padding inside the scroll so the last items breathe. */
  scrollBottomInset?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  refreshColor?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Mobile-first screen shell: vertical scroll only, flex footer for thumb-zone
 * actions, no horizontal overflow. Prefer this over phone-chrome frames.
 */
export default function MobileScreen({
  children,
  footer,
  scrollBottomInset = MobileSpace.xxl,
  refreshing = false,
  onRefresh,
  refreshColor = SitGuruColors.primary,
  style,
  contentStyle,
}: MobileScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.safe, style]} edges={['top', 'left', 'right']}>
      <View style={styles.shell}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: scrollBottomInset },
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          horizontal={false}
          bounces
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={refreshColor}
                colors={[refreshColor]}
              />
            ) : undefined
          }
        >
          <View style={styles.inner}>{children}</View>
        </ScrollView>

        {footer ? (
          <View
            style={[
              styles.footerSlot,
              { paddingBottom: Math.max(insets.bottom, MobileSpace.xs) },
            ]}
          >
            {footer}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: SitGuruColors.background,
    flex: 1,
    overflow: 'hidden',
  },
  shell: {
    flex: 1,
    overflow: 'hidden',
    width: '100%',
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: MobileSpace.lg,
    paddingTop: MobileSpace.md,
    width: '100%',
  },
  inner: {
    gap: MobileSpace.md,
    maxWidth: '100%',
    overflow: 'hidden',
    width: '100%',
  },
  footerSlot: {
    backgroundColor: SitGuruColors.surface,
    borderTopColor: SitGuruColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
