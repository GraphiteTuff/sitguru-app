import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
} from 'react-native';

import SocialAuthBrandIcon from '@/components/SocialAuthBrandIcon';
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
    <Pressable
      accessibilityLabel={actionLabel}
      accessibilityRole="button"
      accessibilityState={{
        disabled,
        busy: loading,
      }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isApple && styles.appleButton,
        disabled && styles.disabled,
        pressed &&
          !disabled &&
          styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={isApple ? '#FFFFFF' : '#087449'}
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E0DA',
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    justifyContent: 'center',
    minHeight: 53,
    paddingHorizontal: 16,
  },
  appleButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  label: {
    color: '#142019',
    fontFamily: AppFonts.extraBold,
    fontSize: 14,
  },
  appleLabel: {
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.48,
  },
  pressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },
});