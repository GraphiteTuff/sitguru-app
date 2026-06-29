import { Pressable, StyleSheet, Text } from 'react-native';

import { SitGuruColors } from '@/constants/colors';

type SitGuruButtonProps = {
  accessibilityLabel?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  label: string;
  onPress?: () => void;
  size?: 'default' | 'compact';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
};

export default function SitGuruButton({
  accessibilityLabel,
  disabled = false,
  fullWidth = true,
  label,
  onPress,
  size = 'default',
  variant = 'primary',
}: SitGuruButtonProps) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isDanger = variant === 'danger';

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        fullWidth ? styles.fullWidth : null,
        size === 'compact' ? styles.compactButton : styles.defaultButton,
        isPrimary ? styles.primaryButton : null,
        isSecondary ? styles.secondaryButton : null,
        isDanger ? styles.dangerButton : null,
        variant === 'ghost' ? styles.ghostButton : null,
        disabled ? styles.disabledButton : null,
        pressed && !disabled ? styles.pressedButton : null,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          size === 'compact' ? styles.compactText : null,
          isPrimary ? styles.primaryText : null,
          isSecondary ? styles.secondaryText : null,
          isDanger ? styles.dangerText : null,
          variant === 'ghost' ? styles.ghostText : null,
          disabled ? styles.disabledText : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  fullWidth: {
    width: '100%',
  },
  defaultButton: {
    paddingVertical: 17,
    paddingHorizontal: 22,
    borderRadius: 18,
  },
  compactButton: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: SitGuruColors.primary,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: SitGuruColors.surface,
    borderWidth: 1,
    borderColor: SitGuruColors.primaryLight,
    elevation: 1,
  },
  dangerButton: {
    backgroundColor: '#FFF1F0',
    borderColor: 'rgba(180, 35, 24, 0.24)',
    borderWidth: 1,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  disabledButton: {
    opacity: 0.55,
  },
  pressedButton: {
    opacity: 0.86,
    transform: [
      {
        translateY: 1,
      },
    ],
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
    textAlign: 'center',
  },
  compactText: {
    fontSize: 14,
    lineHeight: 18,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: SitGuruColors.primary,
  },
  dangerText: {
    color: SitGuruColors.danger,
  },
  ghostText: {
    color: SitGuruColors.primary,
  },
  disabledText: {
    color: SitGuruColors.textSoft,
  },
});
