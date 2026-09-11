import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import { ButtonMetrics, SitGuruAccent } from '@/constants/button-tokens';
import { AppFonts } from '@/constants/fonts';
import { useThemeMode } from '@/hooks/use-theme';

type SitGuruChipProps = {
  accessibilityLabel?: string;
  badge?: string | number | null;
  icon?: ReactNode;
  label: string;
  onPress: () => void;
  selected?: boolean;
};

export default function SitGuruChip({
  accessibilityLabel,
  badge,
  icon,
  label,
  onPress,
  selected = false,
}: SitGuruChipProps) {
  const isDark = useThemeMode() === 'dark';
  const showBadge = badge != null && badge !== '';

  return (
    <BubblePressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      scaleTo={0.92}
      style={[
        styles.chip,
        isDark && styles.chipDark,
        selected && styles.selected,
        selected && isDark && styles.selectedDark,
      ]}
    >
      {icon}
      <Text
        numberOfLines={1}
        style={[
          styles.text,
          isDark && styles.textDark,
          selected && styles.selectedText,
          selected && isDark && styles.selectedTextDark,
        ]}
      >
        {label}
      </Text>
      {showBadge ? (
        <View style={[styles.badge, isDark && styles.badgeDark]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </BubblePressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: SitGuruAccent.border,
    borderRadius: ButtonMetrics.chipRadius,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: ButtonMetrics.chipHeight,
    paddingHorizontal: ButtonMetrics.chipPadX,
  },
  chipDark: {
    backgroundColor: '#0B2118',
    borderColor: '#3A6B52',
  },
  selected: {
    backgroundColor: SitGuruAccent.selectedPill,
    borderColor: SitGuruAccent.primary,
  },
  selectedDark: {
    backgroundColor: 'rgba(47, 163, 107, 0.22)',
    borderColor: SitGuruAccent.primary,
  },
  text: {
    color: SitGuruAccent.text,
    fontFamily: AppFonts.semiBold,
    fontSize: ButtonMetrics.chipFont,
  },
  textDark: {
    color: '#C5D4CB',
  },
  selectedText: {
    color: SitGuruAccent.text,
    fontFamily: AppFonts.bold,
  },
  selectedTextDark: {
    color: '#E8F5ED',
  },
  badge: {
    alignItems: 'center',
    backgroundColor: SitGuruAccent.primary,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 18,
    minWidth: 18,
    paddingHorizontal: 5,
  },
  badgeDark: {
    backgroundColor: SitGuruAccent.primary,
  },
  badgeText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.extraBold,
    fontSize: 10,
  },
});
