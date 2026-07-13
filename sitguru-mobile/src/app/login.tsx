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

import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruScreen from '@/components/SitGuruScreen';
import SocialAuthButton from '@/components/SocialAuthButton';
import { SitGuruColors } from '@/constants/colors';
import { AppFonts } from '@/constants/fonts';
import { useAuth } from '@/hooks/useAuth';

type SocialProvider =
  | 'google'
  | 'apple';

type LoginMethod =
  | 'password'
  | 'email_code'
  | 'sms_code';

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
                <PhoneStatusBar />
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
                        SitGuruColors.text
                      }
                      size={20}
                      strokeWidth={2.4}
                    />
                  </Pressable>

                  <SitGuruLogo
                    size="small"
                    variant="symbol"
                  />

                  <View
                    style={
                      styles.topSpacer
                    }
                  />
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
                        SitGuruColors.primary
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
                            ? SitGuruColors.primary
                            : SitGuruColors.textSoft
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
                            ? SitGuruColors.primary
                            : SitGuruColors.textSoft
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
                            ? SitGuruColors.primary
                            : SitGuruColors.textSoft
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
                            SitGuruColors.textSoft
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
                            SitGuruColors.textSoft
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
                            SitGuruColors.textSoft
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
                            SitGuruColors.textSoft
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
                            SitGuruColors.textSoft
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
                            SitGuruColors.textSoft
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
                                SitGuruColors.textMuted
                              }
                              size={19}
                              strokeWidth={2.2}
                            />
                          ) : (
                            <Eye
                              color={
                                SitGuruColors.textMuted
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
                            SitGuruColors.primary
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
                        SitGuruColors.primary
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
                        SitGuruColors.primary
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

function PhoneStatusBar() {
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

const styles = StyleSheet.create({
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
      SitGuruColors.background,
    borderColor:
      SitGuruColors.border,
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
    color: SitGuruColors.text,
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
      SitGuruColors.text,
    borderRadius: 2,
    width: 3,
  },
  wifiText: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.bold,
    fontSize: 11,
  },
  batteryBody: {
    borderColor:
      SitGuruColors.text,
    borderRadius: 3,
    borderWidth: 1,
    height: 9,
    padding: 1,
    width: 17,
  },
  batteryFill: {
    backgroundColor:
      SitGuruColors.text,
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
      SitGuruColors.surface,
    borderColor:
      SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  topSpacer: {
    height: 42,
    width: 42,
  },
  intro: {
    gap: 9,
    paddingHorizontal: 3,
  },
  eyebrowPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor:
      SitGuruColors.surfaceSoft,
    borderColor:
      SitGuruColors.primaryLight,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  eyebrowText: {
    color:
      SitGuruColors.primary,
    fontFamily: AppFonts.bold,
    fontSize: 12,
  },
  title: {
    color: SitGuruColors.text,
    fontFamily:
      AppFonts.extraBold,
    fontSize: 34,
    letterSpacing: -1,
    lineHeight: 38,
  },
  subtitle: {
    color:
      SitGuruColors.textMuted,
    fontFamily:
      AppFonts.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  loginCard: {
    backgroundColor:
      SitGuruColors.surface,
    borderColor:
      SitGuruColors.border,
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
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
  warningCard: {
    alignItems: 'center',
    backgroundColor: '#FFF8E8',
    borderColor: '#EED18B',
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  warningTitle: {
    color: '#6E4700',
    fontFamily:
      AppFonts.extraBold,
    fontSize: 13,
  },
  warningText: {
    color: '#7B6430',
    fontFamily:
      AppFonts.medium,
    fontSize: 11,
    lineHeight: 16,
  },
  successCard: {
    alignItems: 'center',
    backgroundColor: '#ECF9F0',
    borderColor: '#A9DEBA',
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  successTitle: {
    color: '#075A39',
    fontFamily:
      AppFonts.extraBold,
    fontSize: 13,
  },
  successText: {
    color: '#3C6855',
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
    backgroundColor: '#FFF0ED',
    borderColor: '#F1B8AE',
    borderRadius: 16,
    borderWidth: 1,
    padding: 11,
  },
  errorText: {
    color:
      SitGuruColors.danger,
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
      SitGuruColors.border,
    flex: 1,
    height: 1,
  },
  dividerText: {
    color:
      SitGuruColors.textSoft,
    fontFamily: AppFonts.bold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  methodToggle: {
    backgroundColor:
      SitGuruColors.background,
    borderColor:
      SitGuruColors.border,
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
      SitGuruColors.surface,
    borderColor:
      SitGuruColors.primaryLight,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  methodButtonText: {
    color:
      SitGuruColors.textSoft,
    fontFamily: AppFonts.bold,
    fontSize: 9,
    textAlign: 'center',
  },
  methodButtonTextActive: {
    color:
      SitGuruColors.primary,
  },
  methodHelper: {
    color:
      SitGuruColors.textMuted,
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
    color: SitGuruColors.text,
    fontFamily: AppFonts.bold,
    fontSize: 13,
  },
  forgotLink: {
    color:
      SitGuruColors.primary,
    fontFamily: AppFonts.bold,
    fontSize: 12,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor:
      SitGuruColors.background,
    borderColor:
      SitGuruColors.border,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 14,
  },
  input: {
    color: SitGuruColors.text,
    flex: 1,
    fontFamily:
      AppFonts.medium,
    fontSize: 15,
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
      SitGuruColors.textMuted,
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
      SitGuruColors.background,
    borderColor:
      SitGuruColors.border,
    borderRadius: 13,
    borderWidth: 1,
    color: SitGuruColors.text,
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
      SitGuruColors.surfaceSoft,
    borderColor:
      SitGuruColors.primary,
  },
  resendRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent:
      'space-between',
  },
  resendText: {
    color:
      SitGuruColors.textMuted,
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
      SitGuruColors.primary,
    fontFamily: AppFonts.bold,
    fontSize: 11,
  },
  resendButtonTextDisabled: {
    color:
      SitGuruColors.textSoft,
  },
  codeReadyCard: {
    alignItems: 'center',
    backgroundColor:
      SitGuruColors.surfaceSoft,
    borderColor:
      SitGuruColors.primaryLight,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 11,
  },
  codeReadyIcon: {
    alignItems: 'center',
    backgroundColor:
      SitGuruColors.surface,
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
    color: SitGuruColors.text,
    fontFamily:
      AppFonts.extraBold,
    fontSize: 12,
  },
  codeReadyText: {
    color:
      SitGuruColors.textMuted,
    fontFamily:
      AppFonts.medium,
    fontSize: 10,
    lineHeight: 15,
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor:
      SitGuruColors.primary,
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
      SitGuruColors.surfaceSoft,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    padding: 11,
  },
  securityText: {
    color:
      SitGuruColors.textMuted,
    flex: 1,
    fontFamily:
      AppFonts.medium,
    fontSize: 11,
    lineHeight: 16,
  },
  signupCard: {
    alignItems: 'center',
    backgroundColor:
      SitGuruColors.surface,
    borderColor:
      SitGuruColors.border,
    borderRadius: 23,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    padding: 14,
  },
  signupIcon: {
    alignItems: 'center',
    backgroundColor:
      SitGuruColors.surfaceSoft,
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
    color: SitGuruColors.text,
    fontFamily:
      AppFonts.extraBold,
    fontSize: 14,
  },
  signupText: {
    color:
      SitGuruColors.textMuted,
    fontFamily:
      AppFonts.medium,
    fontSize: 10,
    lineHeight: 15,
  },
  createButton: {
    backgroundColor:
      SitGuruColors.surfaceSoft,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  createButtonText: {
    color:
      SitGuruColors.primary,
    fontFamily:
      AppFonts.extraBold,
    fontSize: 12,
  },
  legalText: {
    color:
      SitGuruColors.textSoft,
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