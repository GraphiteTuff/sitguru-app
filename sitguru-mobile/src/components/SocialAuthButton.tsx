import {
    ActivityIndicator,
    StyleSheet,
    Text,
} from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import SocialAuthBrandIcon from '@/components/SocialAuthBrandIcon';
import { SitGuruColors } from '@/constants/colors';
import { AppFonts } from '@/constants/fonts';

type SocialAuthButtonProps = {
  provider: 'google' | 'apple';
  loading?: boolean;
  disabled?: boolean;
  mode?: 'login' | 'signup';
  onPress: () => void;
};

export default function SocialAuthButton({
  provider,
  loading = false,
  disabled = false,
  mode = 'login',
  onPress,
}: SocialAuthButtonProps) {
  const isApple = provider === 'apple';

  const providerLabel =
    provider === 'google'
      ? 'Google'
      : 'Apple';

  const loadingLabel =
    provider === 'google'
      ? 'Connecting to Google…'
      : 'Connecting to Apple…';

  const actionLabel =
    mode === 'signup'
      ? `Sign up with ${providerLabel}`
      : `Continue with ${providerLabel}`;

  return (
    <BubblePressable
      accessibilityLabel={actionLabel}
      accessibilityRole="button"
      accessibilityState={{
        disabled,
        busy: loading,
      }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        isApple && styles.appleButton,
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={isApple ? '#FFFFFF' : SitGuruColors.primary}
          size="small"
        />
      ) : (
        <SocialAuthBrandIcon
          color="#FFFFFF"
          provider={provider}
          size={22}
        />
      )}

      <Text
        style={[
          styles.label,
          isApple && styles.appleLabel,
        ]}
      >
        {loading
          ? loadingLabel
          : actionLabel}
      </Text>
    </BubblePressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: SitGuruColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 18,
  },
  appleButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  label: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.extraBold,
    fontSize: 16,
  },
  appleLabel: {
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.48,
  },
});