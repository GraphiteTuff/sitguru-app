import {
    StyleSheet,
    View,
} from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import { SitGuruIcon } from '@/components/SitGuruIcon';
import {
    setThemePreference,
    useThemePreference,
} from '@/hooks/use-color-scheme';
import { useThemeMode } from '@/hooks/use-theme';

export default function SitGuruThemeToggle() {
  const themePreference =
    useThemePreference();

  const themeMode =
    useThemeMode();

  const isDark =
    themeMode === 'dark';

  const styles =
    createStyles(isDark);

  return (
    <View
      accessibilityLabel="Appearance"
      style={styles.container}
    >
      <BubblePressable
        accessibilityLabel="Use light mode"
        accessibilityRole="button"
        accessibilityState={{
          selected:
            themePreference === 'light',
        }}
        onPress={() =>
          setThemePreference('light')
        }
        scaleTo={0.88}
        style={[
          styles.option,
          themePreference === 'light' &&
            styles.optionActive,
        ]}
      >
        <SitGuruIcon
          color={
            themePreference === 'light'
              ? '#F3AA1F'
              : styles.iconInactive.color
          }
          name="sun"
          size={15}
          strokeWidth={2.4}
        />
      </BubblePressable>

      <BubblePressable
        accessibilityLabel="Use dark mode"
        accessibilityRole="button"
        accessibilityState={{
          selected:
            themePreference === 'dark',
        }}
        onPress={() =>
          setThemePreference('dark')
        }
        scaleTo={0.88}
        style={[
          styles.option,
          themePreference === 'dark' &&
            styles.optionActive,
        ]}
      >
        <SitGuruIcon
          color={
            themePreference === 'dark'
              ? isDark
                ? '#F0CF62'
                : '#765A1A'
              : styles.iconInactive.color
          }
          name="moon"
          size={15}
          strokeWidth={2.4}
        />
      </BubblePressable>
    </View>
  );
}

function createStyles(
  isDark: boolean,
) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      backgroundColor: isDark
        ? '#0B2118'
        : '#FFFEFA',
      borderColor: isDark
        ? '#B9831B'
        : '#F2822E',
      borderRadius: 13,
      borderWidth: 1.2,
      flexDirection: 'row',
      gap: 2,
      padding: 2,
    },
    option: {
      alignItems: 'center',
      borderRadius: 10,
      height: 28,
      justifyContent: 'center',
      width: 31,
    },
    optionActive: {
      backgroundColor: isDark
        ? 'rgba(226, 170, 45, 0.18)'
        : '#FFF4D8',
    },
    iconInactive: {
      color: isDark
        ? '#9DB0A5'
        : '#738078',
    },
  });
}