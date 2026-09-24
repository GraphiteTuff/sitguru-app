import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFloatingTabBarScroll } from '@/hooks/useFloatingTabBarScroll';
import { useTheme } from '@/hooks/use-theme';

type SitGuruScreenProps = {
  children: ReactNode;
  center?: boolean;
  maxWidth?: number;
  scroll?: boolean;
  /** Full-bleed layouts (homepage hero video) — no side padding / cream chrome. */
  edgeToEdge?: boolean;
  /**
   * Skip the extra SafeArea wrapper. Use when a child (MobileScreen) already
   * owns insets so the page is not double-padded.
   */
  inset?: boolean;
  /**
   * Wrap non-scroll content in KeyboardAvoidingView.
   * Set false when the screen owns its own keyboard handling (e.g. login).
   */
  keyboardAvoiding?: boolean;
};

export default function SitGuruScreen({
  children,
  center = true,
  maxWidth = 560,
  scroll = false,
  edgeToEdge = false,
  inset = true,
  keyboardAvoiding = true,
}: SitGuruScreenProps) {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const tabBarScroll = useFloatingTabBarScroll({ enabled: scroll });
  const isNativeApp = Platform.OS !== 'web';
  const fillNative = isNativeApp && !edgeToEdge;
  const horizontalPadding = edgeToEdge || fillNative ? 0 : width < 390 ? 16 : 20;
  const backgroundStyle = { backgroundColor: theme.colors.screen };
  const widthStyle =
    edgeToEdge || fillNative ? styles.innerFullWidth : { maxWidth };
  const alignStyle =
    fillNative || !center ? styles.topAligned : styles.centered;
  const chromePadding = fillNative || edgeToEdge ? 0 : undefined;

  const contentStyle = scroll
    ? [styles.inner, widthStyle]
    : [styles.inner, styles.innerFlexible, widthStyle];

  const body = scroll ? (
    <ScrollView
      {...tabBarScroll}
      contentContainerStyle={[
        styles.scrollContent,
        edgeToEdge && styles.scrollContentEdgeToEdge,
        fillNative && styles.scrollContentNative,
        {
          paddingHorizontal: horizontalPadding,
          ...(chromePadding === 0
            ? { paddingTop: 0, paddingBottom: 0 }
            : null),
        },
        alignStyle,
      ]}
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode={
        Platform.OS === 'ios' ? 'interactive' : 'on-drag'
      }
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={contentStyle}>{children}</View>
    </ScrollView>
  ) : keyboardAvoiding ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}
    >
      <View
        style={[
          styles.content,
          edgeToEdge && styles.contentEdgeToEdge,
          fillNative && styles.contentNative,
          {
            paddingHorizontal: horizontalPadding,
            ...(chromePadding === 0
              ? { paddingTop: 0, paddingBottom: 0 }
              : null),
          },
          alignStyle,
        ]}
      >
        <View style={contentStyle}>{children}</View>
      </View>
    </KeyboardAvoidingView>
  ) : (
    <View
      style={[
        styles.keyboardView,
        styles.content,
        edgeToEdge && styles.contentEdgeToEdge,
        fillNative && styles.contentNative,
        {
          paddingHorizontal: horizontalPadding,
          ...(chromePadding === 0
            ? { paddingTop: 0, paddingBottom: 0 }
            : null),
        },
        alignStyle,
      ]}
    >
      <View style={contentStyle}>{children}</View>
    </View>
  );

  if (!inset || edgeToEdge) {
    return (
      <View
        style={[
          styles.safeArea,
          backgroundStyle,
          edgeToEdge && styles.safeAreaEdgeToEdge,
        ]}
      >
        {body}
      </View>
    );
  }

  return (
    <SafeAreaView
      edges={undefined}
      style={[styles.safeArea, backgroundStyle]}
    >
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    width: '100%',
  },
  safeAreaEdgeToEdge: {
    backgroundColor: '#020807',
  },
  content: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 28,
    alignItems: 'center',
  },
  contentEdgeToEdge: {
    paddingBottom: 0,
    paddingTop: 0,
  },
  contentNative: {
    alignItems: 'stretch',
    paddingBottom: 0,
    paddingTop: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: 28,
    alignItems: 'center',
  },
  scrollContentEdgeToEdge: {
    paddingBottom: 0,
    paddingTop: 0,
  },
  scrollContentNative: {
    alignItems: 'stretch',
    paddingBottom: 0,
    paddingTop: 0,
  },
  centered: {
    justifyContent: 'center',
  },
  topAligned: {
    justifyContent: 'flex-start',
  },
  inner: {
    width: '100%',
  },
  innerFlexible: {
    flex: 1,
  },
  innerFullWidth: {
    maxWidth: '100%',
  },
});
