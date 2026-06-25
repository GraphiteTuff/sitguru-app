import { Pressable, StyleSheet, Text } from 'react-native';

import { SitGuruColors } from '@/constants/colors';

type SitGuruButtonProps = {
  accessibilityLabel?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  label: string;
  onPress?: () => void;
  size?: 'default' | 'compact';
  variant?: 'primary' | 'secondary' | 'ghost';
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
    minHeight: 42,
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
  ghostText: {
    color: SitGuruColors.primary,
  },
  disabledText: {
    color: SitGuruColors.textSoft,
  },
});
