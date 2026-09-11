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
          color={themePreference === 'light' ? '#F3AA1F' : styles.iconInactive.color}
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
              : styles.iconInactive.color
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
    backgroundColor: '#0B2118',
    borderColor: '#3A6B52',
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
    backgroundColor: 'rgba(47, 163, 107, 0.22)',
  },
  iconInactive: {
    color: '#738078',
  },
});
