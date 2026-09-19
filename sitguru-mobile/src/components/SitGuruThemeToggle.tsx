import { StyleSheet, View } from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import { SitGuruIcon } from '@/components/SitGuruIcon';
import { ButtonMetrics, SitGuruAccent } from '@/constants/button-tokens';
import {
  setThemePreference,
  useThemePreference,
} from '@/hooks/use-color-scheme';
import { useThemeMode } from '@/hooks/use-theme';

export default function SitGuruThemeToggle() {
  const themePreference = useThemePreference();
  const isDark = useThemeMode() === 'dark';
  const inactiveIcon = isDark ? '#C5D9CE' : '#5F7268';

  return (
    <View
      accessibilityLabel="Appearance"
      style={[styles.container, isDark && styles.containerDark]}
    >
      <BubblePressable
        accessibilityLabel="Use light mode"
        accessibilityRole="button"
        accessibilityState={{ selected: themePreference === 'light' }}
        onPress={() => setThemePreference('light')}
        scaleTo={0.88}
        style={[
          styles.option,
          themePreference === 'light' && styles.optionActive,
          themePreference === 'light' && isDark && styles.optionActiveDark,
        ]}
      >
        <SitGuruIcon
          color={themePreference === 'light' ? '#F3AA1F' : inactiveIcon}
          name="sun"
          size={16}
          strokeWidth={2.4}
        />
      </BubblePressable>

      <BubblePressable
        accessibilityLabel="Use dark mode"
        accessibilityRole="button"
        accessibilityState={{ selected: themePreference === 'dark' }}
        onPress={() => setThemePreference('dark')}
        scaleTo={0.88}
        style={[
          styles.option,
          themePreference === 'dark' && styles.optionActive,
          themePreference === 'dark' && isDark && styles.optionActiveDark,
        ]}
      >
        <SitGuruIcon
          color={
            themePreference === 'dark'
              ? isDark
                ? '#F0CF62'
                : '#765A1A'
              : inactiveIcon
          }
          name="moon"
          size={16}
          strokeWidth={2.4}
        />
      </BubblePressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FFFEFA',
    borderColor: SitGuruAccent.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: ButtonMetrics.iconButton,
    padding: 2,
  },
  containerDark: {
    backgroundColor: '#123528',
    borderColor: '#5CE09A',
  },
  option: {
    alignItems: 'center',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  optionActive: {
    backgroundColor: SitGuruAccent.selectedPill,
  },
  optionActiveDark: {
    backgroundColor: 'rgba(92, 224, 154, 0.28)',
  },
});
