import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MobileSpace } from '@/constants/mobile-layout';
import { useTheme } from '@/hooks/use-theme';

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
 * Mobile-first screen shell: vertical scroll only, glass footer over content,
 * no horizontal overflow. Prefer this over phone-chrome frames.
 */
export default function MobileScreen({
  children,
  footer,
  scrollBottomInset = MobileSpace.xxl,
  refreshing = false,
  onRefresh,
  refreshColor,
  style,
  contentStyle,
}: MobileScreenProps) {
  const theme = useTheme();
  const [footerHeight, setFooterHeight] = useState(0);
  const bottomPad = footer
    ? Math.max(footerHeight, scrollBottomInset) + MobileSpace.sm
    : scrollBottomInset;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safe, { backgroundColor: theme.colors.screen }, style]}
    >
      <View style={styles.shell}>
        <ScrollView
          automaticallyAdjustKeyboardInsets
          bounces
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottomPad },
            contentStyle,
          ]}
          horizontal={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                colors={[refreshColor ?? theme.colors.primary]}
                onRefresh={onRefresh}
                refreshing={refreshing}
                tintColor={refreshColor ?? theme.colors.primary}
              />
            ) : undefined
          }
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <View style={styles.inner}>{children}</View>
        </ScrollView>

        {footer ? (
          <View
            onLayout={(event) => {
              const next = Math.ceil(event.nativeEvent.layout.height);
              setFooterHeight((current) => (current === next ? current : next));
            }}
            pointerEvents="box-none"
            style={styles.footerOverlay}
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
  footerOverlay: {
    backgroundColor: 'transparent',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    width: '100%',
  },
});
