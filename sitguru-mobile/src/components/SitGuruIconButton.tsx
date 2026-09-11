import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import { ButtonMetrics, SitGuruAccent } from '@/constants/button-tokens';
import { AppFonts } from '@/constants/fonts';
import { useThemeMode } from '@/hooks/use-theme';

type SitGuruIconButtonProps = {
  accessibilityHint?: string;
  accessibilityLabel: string;
  badge?: string | number | null;
  children: ReactNode;
  disabled?: boolean;
  onPress: () => void;
  variant?: 'plain' | 'accent';
};

export default function SitGuruIconButton({
  accessibilityHint,
  accessibilityLabel,
  badge,
  children,
  disabled = false,
  onPress,
  variant = 'plain',
}: SitGuruIconButtonProps) {
  const isDark = useThemeMode() === 'dark';
  const showBadge = badge != null && badge !== '';

  return (
    <BubblePressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      scaleTo={disabled ? 1 : 0.88}
      style={[
        styles.button,
        isDark && styles.buttonDark,
        variant === 'accent' && styles.accent,
        disabled && styles.disabled,
      ]}
    >
      {children}
      {showBadge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </BubblePressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: SitGuruAccent.border,
    borderRadius: 16,
    borderWidth: 1,
    height: ButtonMetrics.iconButton,
    justifyContent: 'center',
    position: 'relative',
    width: ButtonMetrics.iconButton,
  },
  buttonDark: {
    backgroundColor: '#0B2118',
    borderColor: '#3A6B52',
  },
  accent: {
    backgroundColor: SitGuruAccent.primary,
    borderColor: SitGuruAccent.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: '#E26A3A',
    borderColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: 18,
    minWidth: 18,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -4,
    top: -4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.extraBold,
    fontSize: 9,
  },
});
