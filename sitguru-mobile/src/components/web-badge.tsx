import { Image } from 'expo-image';
import { version } from 'expo/package.json';
import { StyleSheet, useColorScheme } from 'react-native';

import expoBadgeWhite from '@/assets/images/expo-badge-white.png';
import expoBadge from '@/assets/images/expo-badge.png';
import { Spacing } from '@/constants/theme';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export function WebBadge() {
  const scheme = useColorScheme();
  const badgeSource = scheme === 'dark' ? expoBadgeWhite : expoBadge;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="code" themeColor="textSecondary" style={styles.versionText}>
        v{version}
      </ThemedText>

      <Image
        accessibilityLabel="Expo badge"
        alt="Expo badge"
        source={badgeSource}
        style={styles.badgeImage}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
  versionText: {
    textAlign: 'center',
  },
  badgeImage: {
    width: 123,
    aspectRatio: 123 / 24,
  },
});