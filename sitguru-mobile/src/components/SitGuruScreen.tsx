import { ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SitGuruColors } from '@/constants/colors';

type SitGuruScreenProps = {
  children: ReactNode;
  center?: boolean;
  maxWidth?: number;
  scroll?: boolean;
};

export default function SitGuruScreen({
  children,
  center = true,
  maxWidth = 560,
  scroll = false,
}: SitGuruScreenProps) {
  const { width } = useWindowDimensions();
  const horizontalPadding = width < 390 ? 16 : 20;
  const contentStyle = [
    styles.inner,
    {
      maxWidth,
    },
  ];

  if (scroll) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: horizontalPadding,
            },
            center ? styles.centered : styles.topAligned,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={contentStyle}>{children}</View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View
        style={[
          styles.content,
          {
            paddingHorizontal: horizontalPadding,
          },
          center ? styles.centered : styles.topAligned,
        ]}
      >
        <View style={contentStyle}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SitGuruColors.background,
  },
  content: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 28,
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: 28,
    alignItems: 'center',
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
});
