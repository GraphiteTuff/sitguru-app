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

import { useTheme } from '@/hooks/use-theme';

type SitGuruScreenProps = {
  children: ReactNode;
  center?: boolean;
  maxWidth?: number;
  scroll?: boolean;
  /** Full-bleed layouts (homepage hero video) — no side padding / cream chrome. */
  edgeToEdge?: boolean;
};

export default function SitGuruScreen({
  children,
  center = true,
  maxWidth = 560,
  scroll = false,
  edgeToEdge = false,
}: SitGuruScreenProps) {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const horizontalPadding = edgeToEdge ? 0 : width < 390 ? 16 : 20;
  const backgroundStyle = { backgroundColor: theme.colors.screen };
  const widthStyle = edgeToEdge ? styles.innerFullWidth : { maxWidth };

  /*
   * Non-scrolling screens nest canvases that use flex: 1. Without a flexible
   * wrapper the wrapper height stays auto and those children collapse to zero,
   * which renders as a blank screen on device.
   */
  const contentStyle = scroll
    ? [styles.inner, widthStyle]
    : [styles.inner, styles.innerFlexible, widthStyle];

  if (scroll) {
    return (
      <SafeAreaView
        edges={edgeToEdge ? [] : undefined}
        style={[
          styles.safeArea,
          backgroundStyle,
          edgeToEdge && styles.safeAreaEdgeToEdge,
        ]}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            edgeToEdge && styles.scrollContentEdgeToEdge,
            {
              paddingHorizontal: horizontalPadding,
            },
            center ? styles.centered : styles.topAligned,
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={edgeToEdge ? [] : undefined}
      style={[
        styles.safeArea,
        backgroundStyle,
        edgeToEdge && styles.safeAreaEdgeToEdge,
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View
          style={[
            styles.content,
            edgeToEdge && styles.contentEdgeToEdge,
            {
              paddingHorizontal: horizontalPadding,
            },
            center ? styles.centered : styles.topAligned,
          ]}
        >
          <View style={contentStyle}>{children}</View>
        </View>
      </KeyboardAvoidingView>
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
