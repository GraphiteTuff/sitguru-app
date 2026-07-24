import { Link, router } from 'expo-router';
import {
  ArrowRight,
  ChevronLeft,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserPlus,
} from 'lucide-react-native';
import {
  createElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SitGuruIcon } from '@/components/SitGuruIcon';
import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruScreen from '@/components/SitGuruScreen';
import SocialAuthButton from '@/components/SocialAuthButton';
import { AppFonts } from '@/constants/fonts';
import {
  setThemePreference,
  type SitGuruThemePreference,
  useThemePreference,
} from '@/hooks/use-color-scheme';
import { useThemeMode } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';

type SocialProvider =
  | 'google'
  | 'apple';

type LoginMethod =
  | 'password'
  | 'email_code'
  | 'sms_code';

type ThemeOption = {
  icon: 'sun' | 'moon';
  label: string;
  value: SitGuruThemePreference;
};

const THEME_OPTIONS: ThemeOption[] = [
  { icon: 'sun', label: 'Light', value: 'light' },
  { icon: 'moon', label: 'Dark', value: 'dark' },
];

function normalizeLoginError(
  message: string,
) {
  const normalized =
    message.toLowerCase();

  if (
    normalized.includes(
      'invalid login credentials',
    ) ||
    normalized.includes(
      'invalid credentials',
    )
  ) {
    return 'We could not sign you in with that email and password. Check your information and try again.';
  }

  if (
    normalized.includes(
      'email not confirmed',
    )
  ) {
    return 'Confirm your email address before signing in.';
  }

  if (
    normalized.includes(
      'phone not confirmed',
    )
  ) {
    return 'Confirm your mobile number before using text-message login.';
  }

  if (
    normalized.includes(
      'invalid phone',
    ) ||
    normalized.includes(
      'phone number is invalid',
    )
  ) {
    return 'Enter a valid mobile number and try again.';
  }

  if (
    normalized.includes(
      'provider is not enabled',
    ) ||
    normalized.includes(
      'unsupported provider',
    )
  ) {
    return 'That sign-in option is not available yet. Use another sign-in method.';
  }

  if (
    normalized.includes(
      'token has expired',
    ) ||
    normalized.includes(
      'otp expired',
    ) ||
    normalized.includes(
      'expired otp',
    )
  ) {
    return 'That six-digit code has expired. Request a new code and try again.';
  }

  if (
    normalized.includes(
      'invalid token',
    ) ||
    normalized.includes(
      'invalid otp',
    ) ||
    normalized.includes(
      'token is invalid',
    )
  ) {
    return 'That six-digit code is not valid. Check the email and enter the newest code.';
  }

  if (
    normalized.includes(
      'signups not allowed',
    ) ||
    normalized.includes(
      'user not found',
    )
  ) {
    return 'No existing SitGuru account could use that email code. Check the address or create an account.';
  }

  if (
    normalized.includes('network') ||
    normalized.includes('fetch') ||
    normalized.includes(
      'connection',
    )
  ) {
    return 'SitGuru could not connect securely. Check your internet connection and try again.';
  }

  if (
    normalized.includes(
      'too many',
    ) ||
    normalized.includes(
      'rate limit',
    )
  ) {
    return 'There were too many sign-in attempts. Wait a moment, then try again.';
  }

  if (
    normalized.includes(
      'no existing sitguru account',
    ) ||
    normalized.includes(
      'six-digit code',
    ) ||
    normalized.includes(
      'supabase is not configured',
    )
  ) {
    return message;
  }

  return 'SitGuru could not sign you in. Please try again.';
}

function providerName(
  provider: SocialProvider,
) {
  return provider === 'google'
    ? 'Google'
    : 'Apple';
}

function normalizePhoneNumber(
  value: string,
) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');

  if (
    trimmed.startsWith('+') &&
    digits.length >= 8 &&
    digits.length <= 15
  ) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (
    digits.length === 11 &&
    digits.startsWith('1')
  ) {
    return `+${digits}`;
  }

  return '';
}

function formatPhoneInput(
  value: string,
) {
  const hasPlus =
    value.trim().startsWith('+');
  const digits =
    value.replace(/\D/g, '').slice(0, 15);

  if (hasPlus) {
    return digits
      ? `+${digits}`
      : '+';
  }

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return `+${digits}`;
}

function maskPhoneNumber(
  phone: string,
) {
  const digits = phone.replace(/\D/g, '');

  if (digits.length < 4) {
    return phone;
  }

  return `Text ending in ${digits.slice(-4)}`;
}

export default function LoginScreen() {
  const isWebPreview =
    Platform.OS === 'web';

  const themeMode = useThemeMode();
  const themePreference = useThemePreference();
  const isDark = themeMode === 'dark';
  const colors = getPalette(isDark);
  const styles = createStyles(isDark);

  const {
    signIn,
    sendLoginCode,
    verifyLoginCode,
    sendSmsLoginCode,
    verifySmsLoginCode,
    signInWithGoogle,
    signInWithApple,
    loading,
    socialLoading,
    isConfigured,
    authError,
  } = useAuth();

  const [loginMethod, setLoginMethod] =
    useState<LoginMethod>('password');

  const [email, setEmail] =
    useState('');

  const [phone, setPhone] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [
    passwordVisible,
    setPasswordVisible,
  ] = useState(false);

  const [codeSent, setCodeSent] =
    useState(false);

  const [codeDigits, setCodeDigits] =
    useState<string[]>([
      '',
      '',
      '',
      '',
      '',
      '',
    ]);

  const [
    resendSeconds,
    setResendSeconds,
  ] = useState(0);

  const codeInputRefs =
    useRef<Array<TextInput | null>>([]);

  const [message, setMessage] =
    useState<string | null>(
      null,
    );

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string | null>(
    null,
  );

  const cleanEmail =
    email.trim().toLowerCase();

  const emailLooksValid =
    useMemo(
      () =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          cleanEmail,
        ),
      [cleanEmail],
    );

  const cleanPhone =
    useMemo(
      () =>
        normalizePhoneNumber(
          phone,
        ),
      [phone],
    );

  const phoneLooksValid =
    Boolean(cleanPhone);

  const code =
    codeDigits.join('');

  const authBusy =
    loading ||
    Boolean(socialLoading);

  const destinationLooksValid =
    loginMethod === 'sms_code'
      ? phoneLooksValid
      : emailLooksValid;

  const canSubmit =
    isConfigured &&
    !authBusy &&
    destinationLooksValid &&
    (loginMethod === 'password'
      ? password.length >= 6
      : codeSent
        ? code.length === 6
        : true);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setResendSeconds((current) =>
        Math.max(0, current - 1),
      );
    }, 1_000);

    return () => clearTimeout(timer);
  }, [resendSeconds]);

  function clearNotices() {
    setMessage(null);
    setSuccessMessage(null);
  }

  function resetCodeEntry() {
    setCodeDigits([
      '',
      '',
      '',
      '',
      '',
      '',
    ]);
  }

  function changeLoginMethod(
    method: LoginMethod,
  ) {
    if (authBusy) {
      return;
    }

    setLoginMethod(method);
    clearNotices();

    resetCodeEntry();
    setCodeSent(false);
    setResendSeconds(0);
  }

  function handleEmailChange(
    value: string,
  ) {
    setEmail(value);
    clearNotices();

    if (
      codeSent &&
      loginMethod ===
        'email_code'
    ) {
      setCodeSent(false);
      setResendSeconds(0);
      resetCodeEntry();
    }
  }

  function handlePhoneChange(
    value: string,
  ) {
    setPhone(
      formatPhoneInput(value),
    );
    clearNotices();

    if (
      codeSent &&
      loginMethod ===
        'sms_code'
    ) {
      setCodeSent(false);
      setResendSeconds(0);
      resetCodeEntry();
    }
  }

  async function handleLogin() {
    if (authBusy) {
      return;
    }

    clearNotices();

    if (
      !cleanEmail ||
      !password
    ) {
      setMessage(
        'Enter your email and password.',
      );
      return;
    }

    if (!emailLooksValid) {
      setMessage(
        'Enter a valid email address.',
      );
      return;
    }

    if (
      password.length < 6
    ) {
      setMessage(
        'Enter your complete password.',
      );
      return;
    }

    const result =
      await signIn(
        cleanEmail,
        password,
      );

    if (result.error) {
      setMessage(
        normalizeLoginError(
          result.error,
        ),
      );
      return;
    }

    setSuccessMessage(
      'Login successful. Opening your SitGuru account…',
    );

    setTimeout(() => {
      router.replace(
        '/role-selection',
      );
    }, 300);
  }

  async function handleSendCode() {
    if (authBusy) {
      return;
    }

    clearNotices();

    if (
      loginMethod ===
      'email_code'
    ) {
      if (!emailLooksValid) {
        setMessage(
          'Enter the email address connected to your SitGuru account.',
        );
        return;
      }

      const result =
        await sendLoginCode(
          cleanEmail,
        );

      if (result.error) {
        setMessage(
          normalizeLoginError(
            result.error,
          ),
        );
        return;
      }

      setSuccessMessage(
        `A six-digit login code was emailed to ${cleanEmail}.`,
      );
    } else if (
      loginMethod ===
      'sms_code'
    ) {
      if (!phoneLooksValid) {
        setMessage(
          'Enter a valid mobile number, including the country code when outside the United States.',
        );
        return;
      }

      const result =
        await sendSmsLoginCode(
          cleanPhone,
        );

      if (result.error) {
        setMessage(
          normalizeLoginError(
            result.error,
          ),
        );
        return;
      }

      setSuccessMessage(
        `A six-digit login code was texted to the phone ending in ${cleanPhone.slice(-4)}.`,
      );
    } else {
      return;
    }

    resetCodeEntry();
    setCodeSent(true);
    setResendSeconds(60);

    setTimeout(() => {
      codeInputRefs.current[0]?.focus();
    }, 150);
  }

  async function handleVerifyCode() {
    if (authBusy) {
      return;
    }

    clearNotices();

    if (
      loginMethod ===
        'email_code' &&
      !emailLooksValid
    ) {
      setMessage(
        'Enter a valid email address.',
      );
      return;
    }

    if (
      loginMethod ===
        'sms_code' &&
      !phoneLooksValid
    ) {
      setMessage(
        'Enter a valid mobile number.',
      );
      return;
    }

    if (code.length !== 6) {
      setMessage(
        'Enter the complete six-digit code.',
      );
      return;
    }

    const result =
      loginMethod ===
      'sms_code'
        ? await verifySmsLoginCode(
            cleanPhone,
            code,
          )
        : await verifyLoginCode(
            cleanEmail,
            code,
          );

    if (result.error) {
      setMessage(
        normalizeLoginError(
          result.error,
        ),
      );
      return;
    }

    setSuccessMessage(
      'Code verified. Opening your SitGuru account…',
    );

    setTimeout(() => {
      router.replace(
        '/role-selection',
      );
    }, 300);
  }

  function handleCodeChange(
    index: number,
    value: string,
  ) {
    const digits =
      value.replace(/\D/g, '');

    const next = [
      ...codeDigits,
    ];

    if (!digits) {
      next[index] = '';
      setCodeDigits(next);
      clearNotices();
      return;
    }

    digits
      .slice(0, 6 - index)
      .split('')
      .forEach((digit, offset) => {
        next[index + offset] = digit;
      });

    setCodeDigits(next);
    clearNotices();

    const nextIndex =
      index +
      Math.min(
        digits.length,
        6 - index,
      );

    if (nextIndex < 6) {
      codeInputRefs.current[
        nextIndex
      ]?.focus();
    } else {
      codeInputRefs.current[5]?.blur();
    }
  }

  function handleCodeKeyPress(
    index: number,
    key: string,
  ) {
    if (
      key === 'Backspace' &&
      !codeDigits[index] &&
      index > 0
    ) {
      codeInputRefs.current[
        index - 1
      ]?.focus();
    }
  }

  async function handlePrimaryAction() {
    if (loginMethod === 'password') {
      await handleLogin();
      return;
    }

    if (!codeSent) {
      await handleSendCode();
      return;
    }

    await handleVerifyCode();
  }

  async function handleSocialLogin(
    provider: SocialProvider,
  ) {
    if (
      authBusy ||
      !isConfigured
    ) {
      return;
    }

    clearNotices();

    const result =
      provider === 'google'
        ? await signInWithGoogle()
        : await signInWithApple();

    if (result.cancelled) {
      setMessage(
        `${providerName(
          provider,
        )} sign-in was canceled.`,
      );
      return;
    }

    if (result.error) {
      setMessage(
        normalizeLoginError(
          result.error,
        ),
      );
      return;
    }

    if (Platform.OS === 'web') {
      return;
    }

    setSuccessMessage(
      `${providerName(
        provider,
      )} sign-in successful. Opening your SitGuru account…`,
    );

    setTimeout(() => {
      router.replace(
        '/role-selection',
      );
    }, 300);
  }

  return (
    <SitGuruScreen
      center={isWebPreview}
      maxWidth={620}
    >
      <View
        style={[
          styles.previewCanvas,
          !isWebPreview &&
            styles.previewCanvasNative,
        ]}
      >
        <View
          style={[
            styles.deviceFrame,
            !isWebPreview &&
              styles.deviceFrameNative,
          ]}
        >
          {isWebPreview ? (
            <View
              style={
                styles.deviceTopSpeaker
              }
            />
          ) : null}

          <View
            style={[
              styles.phoneShell,
              !isWebPreview &&
                styles.phoneShellNative,
            ]}
          >
            {isWebPreview
              ? createElement('style', {
                  dangerouslySetInnerHTML: {
                    __html: `
                      input:-webkit-autofill,
                      input:-webkit-autofill:hover,
                      input:-webkit-autofill:focus,
                      input:-webkit-autofill:active {
                        -webkit-text-fill-color: ${colors.text} !important;
                        caret-color: ${colors.text} !important;
                        -webkit-box-shadow: 0 0 0 1000px ${colors.inputSurface} inset !important;
                        box-shadow: 0 0 0 1000px ${colors.inputSurface} inset !important;
                        transition: background-color 9999s ease-out 0s;
                      }
                    `,
                  },
                })
              : null}

            <KeyboardAvoidingView
              behavior={
                Platform.OS === 'ios'
                  ? 'padding'
                  : undefined
              }
              style={
                styles.keyboardView
              }
            >
              {isWebPreview ? (
                <PhoneStatusBar styles={styles} colors={colors} />
              ) : null}

              <ScrollView
                contentContainerStyle={
                  styles.page
                }
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={
                  false
                }
              >
                <View
                  style={styles.topBar}
                >
                  <Pressable
                    accessibilityLabel="Return home"
                    accessibilityRole="button"
                    onPress={() =>
                      router.replace('/')
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.backButton,
                      pressed &&
                        styles.buttonPressed,
                    ]}
                  >
                    <ChevronLeft
                      color={
                        colors.text
                      }
                      size={20}
                      strokeWidth={2.4}
                    />
                  </Pressable>

                  <SitGuruLogo
                    size="small"
                    variant="symbol"
                  />

                  <View style={styles.modeToggle}>
                    {THEME_OPTIONS.map((option) => {
                      const active = themePreference === option.value;

                      return (
                        <Pressable
                          key={option.value}
                          accessibilityLabel={`Switch to ${option.label} mode`}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          onPress={() => setThemePreference(option.value)}
                          style={[
                            styles.modeButton,
                            active && styles.modeButtonActive,
                          ]}
                        >
                          <SitGuruIcon
                            color={
                              active
                                ? option.value === 'light'
                                  ? '#F3AA1F'
                                  : isDark
                                    ? '#F0CF62'
                                    : colors.primary
                                : colors.textSoft
                            }
                            name={option.icon}
                            size={16}
                            strokeWidth={2.4}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View
                  style={styles.intro}
                >
                  <View
                    style={
                      styles.eyebrowPill
                    }
                  >
                    <ShieldCheck
                      color={
                        colors.primary
                      }
                      size={15}
                      strokeWidth={2.4}
                    />

                    <Text
                      style={
                        styles.eyebrowText
                      }
                    >
                      Secure sign-in
                    </Text>
                  </View>

                  <Text
                    style={styles.title}
                  >
                    Welcome back.
                  </Text>

                  <Text
                    style={
                      styles.subtitle
                    }
                  >
                    Get back to your
                    bookings, messages,
                    pets, earnings,
                    referrals, and
                    SitGuru dashboards.
                  </Text>
                </View>

                <View
                  style={
                    styles.loginCard
                  }
                >
                  {!isConfigured ? (
                    <View
                      style={
                        styles.warningCard
                      }
                    >
                      <LockKeyhole
                        color="#9A5B00"
                        size={20}
                        strokeWidth={2.4}
                      />

                      <View
                        style={
                          styles.noticeCopy
                        }
                      >
                        <Text
                          style={
                            styles.warningTitle
                          }
                        >
                          Sign-in is
                          temporarily
                          unavailable
                        </Text>

                        <Text
                          style={
                            styles.warningText
                          }
                        >
                          SitGuru
                          authentication is
                          not configured in
                          this build.
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {successMessage ? (
                    <View
                      style={
                        styles.successCard
                      }
                    >
                      <ShieldCheck
                        color="#087A4D"
                        size={20}
                        strokeWidth={2.5}
                      />

                      <View
                        style={
                          styles.noticeCopy
                        }
                      >
                        <Text
                          style={
                            styles.successTitle
                          }
                        >
                          Welcome back
                        </Text>

                        <Text
                          style={
                            styles.successText
                          }
                        >
                          {
                            successMessage
                          }
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {message ||
                  authError ? (
                    <View
                      style={
                        styles.errorCard
                      }
                    >
                      <Text
                        style={
                          styles.errorText
                        }
                      >
                        {message ??
                          normalizeLoginError(
                            authError ??
                              '',
                          )}
                      </Text>
                    </View>
                  ) : null}

                  <View
                    style={
                      styles.socialSection
                    }
                  >
                    <SocialAuthButton
                      disabled={
                        authBusy ||
                        !isConfigured
                      }
                      loading={
                        socialLoading ===
                        'google'
                      }
                      onPress={() =>
                        void handleSocialLogin(
                          'google',
                        )
                      }
                      provider="google"
                    />

                    <SocialAuthButton
                      disabled={
                        authBusy ||
                        !isConfigured
                      }
                      loading={
                        socialLoading ===
                        'apple'
                      }
                      onPress={() =>
                        void handleSocialLogin(
                          'apple',
                        )
                      }
                      provider="apple"
                    />
                  </View>

                  <View
                    style={
                      styles.dividerRow
                    }
                  >
                    <View
                      style={
                        styles.dividerLine
                      }
                    />

                    <Text
                      style={
                        styles.dividerText
                      }
                    >
                      or choose a sign-in
                      method
                    </Text>

                    <View
                      style={
                        styles.dividerLine
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.methodToggle
                    }
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{
                        selected:
                          loginMethod ===
                          'password',
                      }}
                      disabled={authBusy}
                      onPress={() =>
                        changeLoginMethod(
                          'password',
                        )
                      }
                      style={[
                        styles.methodButton,
                        loginMethod ===
                          'password' &&
                          styles.methodButtonActive,
                      ]}
                    >
                      <LockKeyhole
                        color={
                          loginMethod ===
                          'password'
                            ? colors.primary
                            : colors.textSoft
                        }
                        size={15}
                        strokeWidth={2.3}
                      />

                      <Text
                        style={[
                          styles.methodButtonText,
                          loginMethod ===
                            'password' &&
                            styles.methodButtonTextActive,
                        ]}
                      >
                        Password
                      </Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{
                        selected:
                          loginMethod ===
                          'email_code',
                      }}
                      disabled={authBusy}
                      onPress={() =>
                        changeLoginMethod(
                          'email_code',
                        )
                      }
                      style={[
                        styles.methodButton,
                        loginMethod ===
                          'email_code' &&
                          styles.methodButtonActive,
                      ]}
                    >
                      <Mail
                        color={
                          loginMethod ===
                          'email_code'
                            ? colors.primary
                            : colors.textSoft
                        }
                        size={15}
                        strokeWidth={2.3}
                      />

                      <Text
                        style={[
                          styles.methodButtonText,
                          loginMethod ===
                            'email_code' &&
                            styles.methodButtonTextActive,
                        ]}
                      >
                        Email code
                      </Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{
                        selected:
                          loginMethod ===
                          'sms_code',
                      }}
                      disabled={authBusy}
                      onPress={() =>
                        changeLoginMethod(
                          'sms_code',
                        )
                      }
                      style={[
                        styles.methodButton,
                        loginMethod ===
                          'sms_code' &&
                          styles.methodButtonActive,
                      ]}
                    >
                      <Phone
                        color={
                          loginMethod ===
                          'sms_code'
                            ? colors.primary
                            : colors.textSoft
                        }
                        size={15}
                        strokeWidth={2.3}
                      />

                      <Text
                        style={[
                          styles.methodButtonText,
                          loginMethod ===
                            'sms_code' &&
                            styles.methodButtonTextActive,
                        ]}
                      >
                        Text code
                      </Text>
                    </Pressable>
                  </View>

                  <Text
                    style={
                      styles.methodHelper
                    }
                  >
                    {loginMethod ===
                    'password'
                      ? 'Use the email and password connected to your SitGuru account.'
                      : loginMethod ===
                          'email_code'
                        ? 'Receive a one-time six-digit code by email.'
                        : 'Receive a one-time six-digit code by text message.'}
                  </Text>

                  {loginMethod ===
                  'sms_code' ? (
                    <View
                      style={
                        styles.fieldGroup
                      }
                    >
                      <Text
                        style={
                          styles.fieldLabel
                        }
                      >
                        Mobile number
                      </Text>

                      <View
                        style={
                          styles.inputShell
                        }
                      >
                        <Phone
                          color={
                            colors.textSoft
                          }
                          size={19}
                          strokeWidth={2.2}
                        />

                        <TextInput
                          autoComplete="tel"
                          autoCorrect={false}
                          editable={!authBusy}
                          keyboardType="phone-pad"
                          onChangeText={
                            handlePhoneChange
                          }
                          onSubmitEditing={() => {
                            if (!codeSent) {
                              void handleSendCode();
                            }
                          }}
                          placeholder="(215) 555-1234"
                          placeholderTextColor={
                            colors.textSoft
                          }
                          returnKeyType={
                            codeSent
                              ? 'next'
                              : 'send'
                          }
                          style={
                            styles.input
                          }
                          textContentType="telephoneNumber"
                          value={phone}
                        />
                      </View>
                    </View>
                  ) : (
                    <View
                      style={
                        styles.fieldGroup
                      }
                    >
                      <Text
                        style={
                          styles.fieldLabel
                        }
                      >
                        Email address
                      </Text>

                      <View
                        style={
                          styles.inputShell
                        }
                      >
                        <Mail
                          color={
                            colors.textSoft
                          }
                          size={19}
                          strokeWidth={2.2}
                        />

                        <TextInput
                          autoCapitalize="none"
                          autoComplete="email"
                          autoCorrect={false}
                          editable={!authBusy}
                          keyboardType="email-address"
                          onChangeText={
                            handleEmailChange
                          }
                          onSubmitEditing={() => {
                            if (
                              loginMethod ===
                                'email_code' &&
                              !codeSent
                            ) {
                              void handleSendCode();
                            }
                          }}
                          placeholder="you@example.com"
                          placeholderTextColor={
                            colors.textSoft
                          }
                          returnKeyType={
                            loginMethod ===
                              'email_code' &&
                            !codeSent
                              ? 'send'
                              : 'next'
                          }
                          style={
                            styles.input
                          }
                          textContentType="emailAddress"
                          value={email}
                        />
                      </View>
                    </View>
                  )}

                  {loginMethod ===
                  'password' ? (
                    <View
                      style={
                        styles.fieldGroup
                      }
                    >
                      <View
                        style={
                          styles.passwordLabelRow
                        }
                      >
                        <Text
                          style={
                            styles.fieldLabel
                          }
                        >
                          Password
                        </Text>

                        <Link
                          href="/forgot-password"
                          style={
                            styles.forgotLink
                          }
                        >
                          Forgot password?
                        </Link>
                      </View>

                      <View
                        style={
                          styles.inputShell
                        }
                      >
                        <LockKeyhole
                          color={
                            colors.textSoft
                          }
                          size={19}
                          strokeWidth={2.2}
                        />

                        <TextInput
                          autoCapitalize="none"
                          autoComplete="password"
                          autoCorrect={
                            false
                          }
                          editable={
                            !authBusy
                          }
                          onChangeText={(
                            value,
                          ) => {
                            setPassword(
                              value,
                            );
                            clearNotices();
                          }}
                          onSubmitEditing={() =>
                            void handleLogin()
                          }
                          placeholder="Enter your password"
                          placeholderTextColor={
                            colors.textSoft
                          }
                          returnKeyType="go"
                          secureTextEntry={
                            !passwordVisible
                          }
                          style={
                            styles.input
                          }
                          textContentType="password"
                          value={password}
                        />

                        <Pressable
                          accessibilityLabel={
                            passwordVisible
                              ? 'Hide password'
                              : 'Show password'
                          }
                          accessibilityRole="button"
                          hitSlop={10}
                          onPress={() =>
                            setPasswordVisible(
                              (current) =>
                                !current,
                            )
                          }
                          style={
                            styles.eyeButton
                          }
                        >
                          {passwordVisible ? (
                            <EyeOff
                              color={
                                colors.textMuted
                              }
                              size={19}
                              strokeWidth={2.2}
                            />
                          ) : (
                            <Eye
                              color={
                                colors.textMuted
                              }
                              size={19}
                              strokeWidth={2.2}
                            />
                          )}
                        </Pressable>
                      </View>
                    </View>
                  ) : codeSent ? (
                    <View
                      style={
                        styles.codeSection
                      }
                    >
                      <View
                        style={
                          styles.codeLabelRow
                        }
                      >
                        <Text
                          style={
                            styles.fieldLabel
                          }
                        >
                          Enter your code
                        </Text>

                        <Text
                          style={
                            styles.codeEmail
                          }
                          numberOfLines={1}
                        >
                          {loginMethod ===
                          'sms_code'
                            ? maskPhoneNumber(
                                cleanPhone,
                              )
                            : cleanEmail}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.codeRow
                        }
                      >
                        {codeDigits.map(
                          (digit, index) => (
                            <TextInput
                              key={index}
                              ref={(input) => {
                                codeInputRefs.current[
                                  index
                                ] = input;
                              }}
                              accessibilityLabel={`Digit ${
                                index + 1
                              } of six-digit login code`}
                              autoCapitalize="none"
                              autoCorrect={false}
                              editable={!authBusy}
                              keyboardType="number-pad"
                              maxLength={6}
                              onChangeText={(value) =>
                                handleCodeChange(
                                  index,
                                  value,
                                )
                              }
                              onKeyPress={({
                                nativeEvent,
                              }) =>
                                handleCodeKeyPress(
                                  index,
                                  nativeEvent.key,
                                )
                              }
                              onSubmitEditing={() => {
                                if (
                                  code.length ===
                                  6
                                ) {
                                  void handleVerifyCode();
                                }
                              }}
                              returnKeyType={
                                index === 5
                                  ? 'go'
                                  : 'next'
                              }
                              selectTextOnFocus
                              style={[
                                styles.codeInput,
                                digit &&
                                  styles.codeInputFilled,
                              ]}
                              textContentType={
                                index === 0
                                  ? 'oneTimeCode'
                                  : 'none'
                              }
                              value={digit}
                            />
                          ),
                        )}
                      </View>

                      <View
                        style={
                          styles.resendRow
                        }
                      >
                        <Text
                          style={
                            styles.resendText
                          }
                        >
                          Didn’t receive it?
                        </Text>

                        <Pressable
                          accessibilityRole="button"
                          disabled={
                            authBusy ||
                            resendSeconds > 0
                          }
                          onPress={() =>
                            void handleSendCode()
                          }
                          style={
                            styles.resendButton
                          }
                        >
                          <Text
                            style={[
                              styles.resendButtonText,
                              (authBusy ||
                                resendSeconds >
                                  0) &&
                                styles.resendButtonTextDisabled,
                            ]}
                          >
                            {resendSeconds > 0
                              ? `Resend in ${resendSeconds}s`
                              : 'Resend code'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <View
                      style={
                        styles.codeReadyCard
                      }
                    >
                      <View
                        style={
                          styles.codeReadyIcon
                        }
                      >
                        <KeyRound
                          color={
                            colors.primary
                          }
                          size={20}
                          strokeWidth={2.4}
                        />
                      </View>

                      <View
                        style={
                          styles.codeReadyCopy
                        }
                      >
                        <Text
                          style={
                            styles.codeReadyTitle
                          }
                        >
                          Password-free login
                        </Text>

                        <Text
                          style={
                            styles.codeReadyText
                          }
                        >
                          {loginMethod === 'sms_code'
                            ? 'Tap Send Code and check your phone for a one-time six-digit text message.'
                            : 'Tap Send Code and check your email for a one-time six-digit number.'}
                        </Text>
                      </View>
                    </View>
                  )}

                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{
                      disabled:
                        !canSubmit,
                    }}
                    disabled={!canSubmit}
                    onPress={() =>
                      void handlePrimaryAction()
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.loginButton,
                      !canSubmit &&
                        styles.loginButtonDisabled,
                      pressed &&
                        canSubmit &&
                        styles.buttonPressed,
                    ]}
                  >
                    <Text
                      style={
                        styles.loginButtonText
                      }
                    >
                      {loading
                        ? loginMethod ===
                          'password'
                          ? 'Signing in…'
                          : codeSent
                            ? 'Verifying…'
                            : 'Sending code…'
                        : loginMethod ===
                            'password'
                          ? 'Log In'
                          : codeSent
                            ? 'Verify & Log In'
                            : loginMethod ===
                                'sms_code'
                              ? 'Text 6-Digit Code'
                              : 'Email 6-Digit Code'}
                    </Text>

                    {!loading ? (
                      <ArrowRight
                        color="#FFFFFF"
                        size={19}
                        strokeWidth={2.5}
                      />
                    ) : null}
                  </Pressable>

                  <View
                    style={
                      styles.securityRow
                    }
                  >
                    <ShieldCheck
                      color={
                        colors.primary
                      }
                      size={16}
                      strokeWidth={2.3}
                    />

                    <Text
                      style={
                        styles.securityText
                      }
                    >
                      Use your password, an email code, a text-message code, Google, or Apple. Secure sessions keep you signed in after login.
                    </Text>
                  </View>
                </View>

                <View
                  style={
                    styles.signupCard
                  }
                >
                  <View
                    style={
                      styles.signupIcon
                    }
                  >
                    <UserPlus
                      color={
                        colors.primary
                      }
                      size={21}
                      strokeWidth={2.3}
                    />
                  </View>

                  <View
                    style={
                      styles.signupCopy
                    }
                  >
                    <Text
                      style={
                        styles.signupTitle
                      }
                    >
                      New to SitGuru?
                    </Text>

                    <Text
                      style={
                        styles.signupText
                      }
                    >
                      Create one account
                      for Pet Parent, Guru,
                      Ambassador, or
                      multiple roles.
                    </Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      router.push(
                        '/signup',
                      )
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.createButton,
                      pressed &&
                        styles.buttonPressed,
                    ]}
                  >
                    <Text
                      style={
                        styles.createButtonText
                      }
                    >
                      Create
                    </Text>
                  </Pressable>
                </View>

                <Text
                  style={
                    styles.legalText
                  }
                >
                  By continuing, you agree
                  to SitGuru’s Terms and
                  Privacy Policy.
                </Text>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>

          {isWebPreview ? (
            <View
              style={
                styles.homeIndicator
              }
            />
          ) : null}
        </View>
      </View>
    </SitGuruScreen>
  );
}

function PhoneStatusBar({
  styles,
  colors,
}: {
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof getPalette>;
}) {
  return (
    <View style={styles.statusBar}>
      <Text
        style={styles.statusTime}
      >
        9:41
      </Text>

      <View
        style={
          styles.statusIcons
        }
      >
        <View
          style={
            styles.signalBars
          }
        >
          <View
            style={[
              styles.signalBar,
              {
                height: 5,
              },
            ]}
          />

          <View
            style={[
              styles.signalBar,
              {
                height: 7,
              },
            ]}
          />

          <View
            style={[
              styles.signalBar,
              {
                height: 9,
              },
            ]}
          />
        </View>

        <Text
          style={styles.wifiText}
        >
          ⌁
        </Text>

        <View
          style={
            styles.batteryBody
          }
        >
          <View
            style={
              styles.batteryFill
            }
          />
        </View>
      </View>
    </View>
  );
}

function getPalette(isDark: boolean) {
  return {
    background: isDark ? '#06140F' : '#F5FAF6',
    border: isDark ? '#244B39' : '#D6E8DB',
    danger: isDark ? '#FF9B87' : '#B33A2E',
    primary: isDark ? '#43D98A' : '#117A4B',
    primaryLight: isDark ? '#2C674A' : '#CFEAD8',
    inputBorder: isDark ? '#2B6248' : '#D6E8DB',
    inputSurface: isDark ? '#071B13' : '#F5FAF6',
    surface: isDark ? '#0B2118' : '#FFFFFF',
    surfaceSoft: isDark ? '#123427' : '#EAF7EE',
    text: isDark ? '#FFF5E8' : '#123B2D',
    textMuted: isDark ? '#B8C6BE' : '#5F756A',
    textSoft: isDark ? '#8FA49A' : '#71847A',
  };
}

function createStyles(isDark: boolean) {
  const colors = getPalette(isDark);

  return StyleSheet.create({
  previewCanvas: {
    alignItems: 'center',
    minHeight: 960,
    paddingHorizontal: 16,
    paddingVertical: 22,
    width: '100%',
  },
  previewCanvasNative: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  deviceFrame: {
    backgroundColor: '#111713',
    borderColor: '#2E3631',
    borderRadius: 42,
    borderWidth: 2,
    maxWidth: 430,
    overflow: 'hidden',
    paddingBottom: 15,
    paddingHorizontal: 8,
    paddingTop: 10,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.27,
    shadowRadius: 28,
    width: '100%',
  },
  deviceFrameNative: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    flex: 1,
    maxWidth: '100%',
    paddingBottom: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
    shadowOpacity: 0,
  },
  deviceTopSpeaker: {
    alignSelf: 'center',
    backgroundColor: '#303832',
    borderRadius: 999,
    height: 6,
    marginBottom: 9,
    width: 86,
  },
  phoneShell: {
    backgroundColor:
      colors.background,
    borderColor:
      colors.border,
    borderRadius: 34,
    borderWidth: 1,
    height: 844,
    overflow: 'hidden',
    width: '100%',
  },
  phoneShellNative: {
    borderRadius: 0,
    borderWidth: 0,
    flex: 1,
    height: '100%',
  },
  keyboardView: {
    flex: 1,
  },
  homeIndicator: {
    alignSelf: 'center',
    backgroundColor: '#F3F1EA',
    borderRadius: 999,
    height: 5,
    marginTop: 9,
    width: 116,
  },
  statusBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent:
      'space-between',
    minHeight: 31,
    paddingHorizontal: 16,
    paddingTop: 7,
  },
  statusTime: {
    color: colors.text,
    fontFamily: AppFonts.bold,
    fontSize: 12,
  },
  statusIcons: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  signalBars: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 2,
  },
  signalBar: {
    backgroundColor:
      colors.text,
    borderRadius: 2,
    width: 3,
  },
  wifiText: {
    color: colors.text,
    fontFamily: AppFonts.bold,
    fontSize: 11,
  },
  batteryBody: {
    borderColor:
      colors.text,
    borderRadius: 3,
    borderWidth: 1,
    height: 9,
    padding: 1,
    width: 17,
  },
  batteryFill: {
    backgroundColor:
      colors.text,
    borderRadius: 2,
    flex: 1,
  },
  page: {
    gap: 15,
    paddingBottom: 26,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent:
      'space-between',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor:
      colors.surface,
    borderColor:
      colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  modeToggle: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: isDark ? '#A97D20' : '#F2822E',
    borderRadius: 14,
    borderWidth: 1.2,
    flexDirection: 'row',
    gap: 2,
    padding: 3,
  },
  modeButton: {
    alignItems: 'center',
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    width: 36,
  },
  modeButtonActive: {
    backgroundColor: isDark
      ? 'rgba(226,170,45,0.18)'
      : '#FFF4D8',
  },
  intro: {
    gap: 9,
    paddingHorizontal: 3,
  },
  eyebrowPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor:
      colors.surfaceSoft,
    borderColor:
      colors.primaryLight,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  eyebrowText: {
    color:
      colors.primary,
    fontFamily: AppFonts.bold,
    fontSize: 12,
  },
  title: {
    color: colors.text,
    fontFamily:
      AppFonts.extraBold,
    fontSize: 34,
    letterSpacing: -1,
    lineHeight: 38,
  },
  subtitle: {
    color:
      colors.textMuted,
    fontFamily:
      AppFonts.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  loginCard: {
    backgroundColor:
      colors.surface,
    borderColor:
      colors.border,
    borderRadius: 27,
    borderWidth: 1,
    elevation: 3,
    gap: 14,
    padding: 17,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: isDark ? 0.22 : 0.06,
    shadowRadius: 18,
  },
  warningCard: {
    alignItems: 'center',
    backgroundColor: isDark ? '#3A2C10' : '#FFF8E8',
    borderColor: isDark ? '#7C6428' : '#EED18B',
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  warningTitle: {
    color: isDark ? '#F7D67F' : '#6E4700',
    fontFamily:
      AppFonts.extraBold,
    fontSize: 13,
  },
  warningText: {
    color: isDark ? '#D8C99A' : '#7B6430',
    fontFamily:
      AppFonts.medium,
    fontSize: 11,
    lineHeight: 16,
  },
  successCard: {
    alignItems: 'center',
    backgroundColor: isDark ? '#103C29' : '#ECF9F0',
    borderColor: isDark ? '#2C7551' : '#A9DEBA',
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  successTitle: {
    color: isDark ? '#79E8AC' : '#075A39',
    fontFamily:
      AppFonts.extraBold,
    fontSize: 13,
  },
  successText: {
    color: isDark ? '#BCE2CC' : '#3C6855',
    fontFamily:
      AppFonts.medium,
    fontSize: 11,
    lineHeight: 16,
  },
  noticeCopy: {
    flex: 1,
    gap: 2,
  },
  errorCard: {
    backgroundColor: isDark ? '#3A1E19' : '#FFF0ED',
    borderColor: isDark ? '#7B3C32' : '#F1B8AE',
    borderRadius: 16,
    borderWidth: 1,
    padding: 11,
  },
  errorText: {
    color:
      colors.danger,
    fontFamily: AppFonts.bold,
    fontSize: 12,
    lineHeight: 17,
  },
  socialSection: {
    gap: 10,
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  dividerLine: {
    backgroundColor:
      colors.border,
    flex: 1,
    height: 1,
  },
  dividerText: {
    color:
      colors.textSoft,
    fontFamily: AppFonts.bold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  methodToggle: {
    backgroundColor:
      colors.background,
    borderColor:
      colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
  },
  methodButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 4,
  },
  methodButtonActive: {
    backgroundColor:
      colors.surface,
    borderColor:
      colors.primaryLight,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: isDark ? 0.18 : 0.05,
    shadowRadius: 5,
  },
  methodButtonText: {
    color:
      colors.textSoft,
    fontFamily: AppFonts.bold,
    fontSize: 9,
    textAlign: 'center',
  },
  methodButtonTextActive: {
    color:
      colors.primary,
  },
  methodHelper: {
    color:
      colors.textMuted,
    fontFamily:
      AppFonts.medium,
    fontSize: 11,
    lineHeight: 16,
    marginTop: -5,
  },
  fieldGroup: {
    gap: 7,
  },
  passwordLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent:
      'space-between',
  },
  fieldLabel: {
    color: colors.text,
    fontFamily: AppFonts.bold,
    fontSize: 13,
  },
  forgotLink: {
    color:
      colors.primary,
    fontFamily: AppFonts.bold,
    fontSize: 12,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor:
      colors.inputSurface,
    borderColor:
      colors.inputBorder,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 14,
  },
  input: {
    backgroundColor: 'transparent',
    color: colors.text,
    flex: 1,
    fontFamily:
      AppFonts.medium,
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  eyeButton: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 34,
  },
  codeSection: {
    gap: 9,
  },
  codeLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent:
      'space-between',
  },
  codeEmail: {
    color:
      colors.textMuted,
    flex: 1,
    fontFamily:
      AppFonts.medium,
    fontSize: 10,
    textAlign: 'right',
  },
  codeRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent:
      'space-between',
  },
  codeInput: {
    backgroundColor:
      colors.inputSurface,
    borderColor:
      colors.inputBorder,
    borderRadius: 13,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontFamily:
      AppFonts.extraBold,
    fontSize: 21,
    height: 52,
    maxWidth: 48,
    minWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    textAlign: 'center',
  },
  codeInputFilled: {
    backgroundColor:
      colors.surfaceSoft,
    borderColor:
      colors.primary,
  },
  resendRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent:
      'space-between',
  },
  resendText: {
    color:
      colors.textMuted,
    fontFamily:
      AppFonts.medium,
    fontSize: 11,
  },
  resendButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  resendButtonText: {
    color:
      colors.primary,
    fontFamily: AppFonts.bold,
    fontSize: 11,
  },
  resendButtonTextDisabled: {
    color:
      colors.textSoft,
  },
  codeReadyCard: {
    alignItems: 'center',
    backgroundColor:
      colors.surfaceSoft,
    borderColor:
      colors.primaryLight,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 11,
  },
  codeReadyIcon: {
    alignItems: 'center',
    backgroundColor:
      colors.surface,
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  codeReadyCopy: {
    flex: 1,
    gap: 2,
  },
  codeReadyTitle: {
    color: colors.text,
    fontFamily:
      AppFonts.extraBold,
    fontSize: 12,
  },
  codeReadyText: {
    color:
      colors.textMuted,
    fontFamily:
      AppFonts.medium,
    fontSize: 10,
    lineHeight: 15,
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor:
      colors.primary,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
  },
  loginButtonDisabled: {
    opacity: 0.45,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontFamily:
      AppFonts.extraBold,
    fontSize: 15,
  },
  securityRow: {
    alignItems: 'flex-start',
    backgroundColor:
      colors.surfaceSoft,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    padding: 11,
  },
  securityText: {
    color:
      colors.textMuted,
    flex: 1,
    fontFamily:
      AppFonts.medium,
    fontSize: 11,
    lineHeight: 16,
  },
  signupCard: {
    alignItems: 'center',
    backgroundColor:
      colors.surface,
    borderColor:
      colors.border,
    borderRadius: 23,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    padding: 14,
  },
  signupIcon: {
    alignItems: 'center',
    backgroundColor:
      colors.surfaceSoft,
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  signupCopy: {
    flex: 1,
    gap: 2,
  },
  signupTitle: {
    color: colors.text,
    fontFamily:
      AppFonts.extraBold,
    fontSize: 14,
  },
  signupText: {
    color:
      colors.textMuted,
    fontFamily:
      AppFonts.medium,
    fontSize: 10,
    lineHeight: 15,
  },
  createButton: {
    backgroundColor:
      colors.surfaceSoft,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  createButtonText: {
    color:
      colors.primary,
    fontFamily:
      AppFonts.extraBold,
    fontSize: 12,
  },
  legalText: {
    color:
      colors.textSoft,
    fontFamily:
      AppFonts.medium,
    fontSize: 10,
    lineHeight: 15,
    paddingHorizontal: 18,
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },
  });
}