import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import { ButtonMetrics, SitGuruAccent } from '@/constants/button-tokens';
import { AppFonts } from '@/constants/fonts';
import { useThemeMode } from '@/hooks/use-theme';

export type SitGuruSegmentOption<T extends string> = {
  icon?: ReactNode;
  label: string;
  value: T;
};

type SitGuruSegmentedControlProps<T extends string> = {
  disabled?: boolean;
  onChange: (value: T) => void;
  options: SitGuruSegmentOption<T>[];
  value: T;
};

export default function SitGuruSegmentedControl<T extends string>({
  disabled = false,
  onChange,
  options,
  value,
}: SitGuruSegmentedControlProps<T>) {
  const isDark = useThemeMode() === 'dark';

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <BubblePressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            scaleTo={disabled ? 1 : 0.94}
            style={[
              styles.option,
              selected && styles.optionSelected,
              selected && isDark && styles.optionSelectedDark,
            ]}
          >
            {option.icon}
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                isDark && styles.labelDark,
                selected && styles.labelSelected,
                selected && isDark && styles.labelSelectedDark,
              ]}
            >
              {option.label}
            </Text>
          </BubblePressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F4F7F4',
    borderColor: SitGuruAccent.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    minHeight: ButtonMetrics.ctaCompactHeight,
    padding: 4,
  },
  containerDark: {
    backgroundColor: '#0B2118',
    borderColor: '#3A6B52',
  },
  option: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 6,
  },
  optionSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: SitGuruAccent.border,
    borderWidth: 1,
  },
  optionSelectedDark: {
    backgroundColor: 'rgba(47, 163, 107, 0.22)',
    borderColor: '#3A6B52',
  },
  label: {
    color: '#738078',
    fontFamily: AppFonts.bold,
    fontSize: 13,
  },
  labelDark: {
    color: '#A8B8AE',
  },
  labelSelected: {
    color: SitGuruAccent.text,
  },
  labelSelectedDark: {
    color: '#E8F5ED',
  },
});
