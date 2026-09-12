import type { ReactNode } from 'react';
import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import { ButtonMetrics, SitGuruAccent } from '@/constants/button-tokens';
import { Colors } from '@/constants/theme';
import { AppFonts } from '@/constants/fonts';
import { useThemeMode } from '@/hooks/use-theme';
import { MAX_FONT_SIZE_MULTIPLIER } from '@/lib/a11y/type-scale';

type SitGuruButtonProps = {
  accessibilityLabel?: string;
  disabled?: boolean;
  flex?: boolean;
  fullWidth?: boolean;
  label: string;
  onPress?: () => void;
  size?: 'default' | 'compact';
  style?: StyleProp<ViewStyle>;
  trailing?: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
};

export default function SitGuruButton({
  accessibilityLabel,
  disabled = false,
  flex = false,
  fullWidth = true,
  label,
  onPress,
  size = 'default',
  style,
  trailing,
  variant = 'primary',
}: SitGuruButtonProps) {
  const isDark = useThemeMode() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isDanger = variant === 'danger';

  return (
    <BubblePressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      bubble={!disabled}
      bubbleColor={
        isPrimary ? 'rgba(255,255,255,0.22)' : SitGuruAccent.soft
      }
      disabled={disabled}
      onPress={onPress}
      scaleTo={disabled ? 1 : 0.94}
      style={[
        styles.button,
        flex ? styles.flex : null,
        fullWidth && !flex ? styles.fullWidth : null,
        size === 'compact' ? styles.compactButton : styles.defaultButton,
        isPrimary ? styles.primaryButton : null,
        isSecondary
          ? {
              backgroundColor: theme.card,
              borderColor: isDark ? theme.borderStrong : SitGuruAccent.border,
              borderWidth: 1,
            }
          : null,
        isDanger
          ? {
              backgroundColor: isDark ? '#3A1A16' : '#FFF1F0',
              borderColor: isDark
                ? 'rgba(255, 128, 109, 0.35)'
                : 'rgba(180, 35, 24, 0.24)',
              borderWidth: 1,
            }
          : null,
        variant === 'ghost' ? styles.ghostButton : null,
        disabled ? styles.disabledButton : null,
        style,
      ]}
    >
      <Text
        allowFontScaling
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        style={[
          styles.buttonText,
          size === 'compact' ? styles.compactText : null,
          isPrimary ? styles.primaryText : null,
          isSecondary ? { color: isDark ? theme.primary : SitGuruAccent.text } : null,
          isDanger ? { color: theme.danger } : null,
          variant === 'ghost' ? { color: isDark ? theme.primary : SitGuruAccent.text } : null,
          disabled ? { color: theme.muted } : null,
        ]}
      >
        {label}
      </Text>
      {trailing}
    </BubblePressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: ButtonMetrics.ctaHeight,
  },
  flex: {
    flex: 1,
  },
  fullWidth: {
    width: '100%',
  },
  defaultButton: {
    paddingVertical: 14,
    paddingHorizontal: ButtonMetrics.ctaPadX,
    borderRadius: ButtonMetrics.ctaRadius,
  },
  compactButton: {
    minHeight: ButtonMetrics.ctaCompactHeight,
    minWidth: ButtonMetrics.ctaCompactHeight,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  primaryButton: {
    backgroundColor: SitGuruAccent.primary,
    elevation: 4,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: AppFonts.extraBold,
    fontSize: ButtonMetrics.ctaFont,
    textAlign: 'center',
  },
  compactText: {
    fontSize: 16,
  },
  primaryText: {
    color: '#FFFFFF',
  },
});
