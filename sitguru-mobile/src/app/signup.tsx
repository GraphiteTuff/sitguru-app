import { Link, router } from 'expo-router';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserPlus,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
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
import { SitGuruColors } from '@/constants/colors';
import { AppFonts } from '@/constants/fonts';
import { useAuth } from '@/hooks/useAuth';

type SignupIntent =
  | 'pet-parent'
  | 'guru'
  | 'ambassador'
  | 'multiple';

const intentOptions: Array<{
  id: SignupIntent;
  label: string;
  short: string;
}> = [
  { id: 'pet-parent', label: 'Pet Parent', short: 'Find trusted pet care' },
  { id: 'guru', label: 'Pet Guru', short: 'Offer pet care services' },
  { id: 'ambassador', label: 'Ambassador', short: 'Grow the SitGuru community' },
  { id: 'multiple', label: 'Multiple roles', short: 'Use more than one path' },
];

function normalizeSignupError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes('already registered')) {
    return 'An account already exists with this email. Log in instead.';
  }

  if (
    normalized.includes('password') &&
    normalized.includes('weak')
  ) {
    return 'Create a stronger password with at least 8 characters.';
  }

  if (
    normalized.includes('network') ||
    normalized.includes('fetch') ||
    normalized.includes('connection')
  ) {
    return 'SitGuru could not connect securely. Check your internet connection and try again.';
  }

  if (
    normalized.includes('rate limit') ||
    normalized.includes('too many')
  ) {
    return 'There were too many signup attempts. Wait a moment and try again.';
  }

  return 'SitGuru could not create your account. Please try again.';
}

export default function SignupScreen() {
  const isWebPreview = Platform.OS === 'web';
  const { signUp, loading, isConfigured, authError } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [signupIntent, setSignupIntent] =
    useState<SignupIntent>('pet-parent');
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const cleanEmail = email.trim().toLowerCase();

  const emailLooksValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail),
    [cleanEmail],
  );

  const canSubmit =
    isConfigured &&
    !loading &&
    firstName.trim().length >= 2 &&
    emailLooksValid &&
    password.length >= 8;

  async function handleSignup() {
    if (loading) return;

    setMessage(null);
    setSuccess(null);

    if (firstName.trim().length < 2) {
      setMessage('Enter your first name.');
      return;
    }

    if (!emailLooksValid) {
      setMessage('Enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setMessage('Create a password with at least 8 characters.');
      return;
    }

    const result = await signUp(cleanEmail, password, {
      first_name: firstName.trim(),
      signup_intent: signupIntent,
    });

    if (result.error) {
      setMessage(normalizeSignupError(result.error));
      return;
    }

    if (result.needsEmailConfirmation) {
      setSuccess(
        'Check your email to confirm your account, then return to log in.',
      );
      return;
    }

    setSuccess('Account created. Opening your SitGuru setup…');

    setTimeout(() => {
      router.replace('/role-selection');
    }, 350);
  }

  return (
    <SitGuruScreen center={isWebPreview} maxWidth={620}>
      <View
        style={[
          styles.previewCanvas,
          !isWebPreview && styles.previewCanvasNative,
        ]}
      >
        <View
          style={[
            styles.deviceFrame,
            !isWebPreview && styles.deviceFrameNative,
          ]}
        >
          {isWebPreview ? <View style={styles.deviceTopSpeaker} /> : null}

          <View
            style={[
              styles.phoneShell,
              !isWebPreview && styles.phoneShellNative,
            ]}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.keyboardView}
            >
              {isWebPreview ? <PhoneStatusBar /> : null}

              <ScrollView
                contentContainerStyle={styles.page}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.topBar}>
                  <Pressable
                    accessibilityLabel="Return home"
                    accessibilityRole="button"
                    onPress={() => router.replace('/')}
                    style={styles.backButton}
                  >
                    <ChevronLeft
                      color={SitGuruColors.text}
                      size={20}
                      strokeWidth={2.4}
                    />
                  </Pressable>

                  <SitGuruLogo size="small" variant="symbol" />

                  <Link href="/login" style={styles.loginLink}>
                    Log In
                  </Link>
                </View>

                <View style={styles.intro}>
                  <View style={styles.eyebrowPill}>
                    <UserPlus
                      color={SitGuruColors.primary}
                      size={15}
                      strokeWidth={2.4}
                    />
                    <Text style={styles.eyebrowText}>Create account</Text>
                  </View>

                  <Text style={styles.title}>Join SitGuru.</Text>

                  <Text style={styles.subtitle}>
                    Create one account for pet care, Guru services,
                    Ambassador referrals, or multiple roles.
                  </Text>
                </View>

                <View style={styles.signupCard}>
                  {!isConfigured ? (
                    <View style={styles.warningCard}>
                      <LockKeyhole
                        color="#9A5B00"
                        size={20}
                        strokeWidth={2.4}
                      />
                      <View style={styles.warningCopy}>
                        <Text style={styles.warningTitle}>
                          Signup is temporarily unavailable
                        </Text>
                        <Text style={styles.warningText}>
                          SitGuru authentication is not configured in this build.
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {success ? (
                    <View style={styles.successCard}>
                      <ShieldCheck
                        color={SitGuruColors.primary}
                        size={20}
                        strokeWidth={2.5}
                      />
                      <Text style={styles.successText}>{success}</Text>
                    </View>
                  ) : null}

                  {message || authError ? (
                    <View style={styles.errorCard}>
                      <Text style={styles.errorText}>
                        {message ??
                          normalizeSignupError(authError ?? '')}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>First name</Text>
                    <View style={styles.inputShell}>
                      <UserPlus
                        color={SitGuruColors.textSoft}
                        size={19}
                        strokeWidth={2.2}
                      />
                      <TextInput
                        autoCapitalize="words"
                        autoComplete="name-given"
                        onChangeText={(value) => {
                          setFirstName(value);
                          setMessage(null);
                          setSuccess(null);
                        }}
                        placeholder="Jane"
                        placeholderTextColor={SitGuruColors.textSoft}
                        returnKeyType="next"
                        style={styles.input}
                        textContentType="givenName"
                        value={firstName}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Email address</Text>
                    <View style={styles.inputShell}>
                      <Mail
                        color={SitGuruColors.textSoft}
                        size={19}
                        strokeWidth={2.2}
                      />
                      <TextInput
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect={false}
                        keyboardType="email-address"
                        onChangeText={(value) => {
                          setEmail(value);
                          setMessage(null);
                          setSuccess(null);
                        }}
                        placeholder="you@example.com"
                        placeholderTextColor={SitGuruColors.textSoft}
                        returnKeyType="next"
                        style={styles.input}
                        textContentType="emailAddress"
                        value={email}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Password</Text>
                    <View style={styles.inputShell}>
                      <LockKeyhole
                        color={SitGuruColors.textSoft}
                        size={19}
                        strokeWidth={2.2}
                      />

                      <TextInput
                        autoCapitalize="none"
                        autoComplete="new-password"
                        autoCorrect={false}
                        onChangeText={(value) => {
                          setPassword(value);
                          setMessage(null);
                          setSuccess(null);
                        }}
                        onSubmitEditing={() => void handleSignup()}
                        placeholder="At least 8 characters"
                        placeholderTextColor={SitGuruColors.textSoft}
                        returnKeyType="go"
                        secureTextEntry={!passwordVisible}
                        style={styles.input}
                        textContentType="newPassword"
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
                          setPasswordVisible((current) => !current)
                        }
                        style={styles.eyeButton}
                      >
                        {passwordVisible ? (
                          <EyeOff
                            color={SitGuruColors.textMuted}
                            size={19}
                            strokeWidth={2.2}
                          />
                        ) : (
                          <Eye
                            color={SitGuruColors.textMuted}
                            size={19}
                            strokeWidth={2.2}
                          />
                        )}
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.roleSection}>
                    <Text style={styles.fieldLabel}>I want to start as</Text>

                    <View style={styles.intentGrid}>
                      {intentOptions.map((option) => {
                        const active = signupIntent === option.id;

                        return (
                          <Pressable
                            key={option.id}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            onPress={() => setSignupIntent(option.id)}
                            style={[
                              styles.intentCard,
                              active && styles.intentCardActive,
                            ]}
                          >
                            <View
                              style={[
                                styles.intentCheck,
                                active && styles.intentCheckActive,
                              ]}
                            >
                              {active ? (
                                <Check
                                  color="#FFFFFF"
                                  size={13}
                                  strokeWidth={2.7}
                                />
                              ) : null}
                            </View>

                            <View style={styles.intentCopy}>
                              <Text
                                style={[
                                  styles.intentTitle,
                                  active && styles.intentTitleActive,
                                ]}
                              >
                                {option.label}
                              </Text>
                              <Text style={styles.intentText}>
                                {option.short}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !canSubmit }}
                    disabled={!canSubmit}
                    onPress={() => void handleSignup()}
                    style={({ pressed }) => [
                      styles.createAccountButton,
                      !canSubmit &&
                        styles.createAccountButtonDisabled,
                      pressed &&
                        canSubmit &&
                        styles.createAccountButtonPressed,
                    ]}
                  >
                    <Text style={styles.createAccountText}>
                      {loading ? 'Creating account…' : 'Create account'}
                    </Text>

                    {!loading ? (
                      <ArrowRight
                        color="#FFFFFF"
                        size={19}
                        strokeWidth={2.5}
                      />
                    ) : null}
                  </Pressable>

                  <View style={styles.securityRow}>
                    <ShieldCheck
                      color={SitGuruColors.primary}
                      size={16}
                      strokeWidth={2.3}
                    />
                    <Text style={styles.securityText}>
                      Your account is protected through SitGuru’s secure
                      authentication provider.
                    </Text>
                  </View>
                </View>

                <View style={styles.loginCard}>
                  <Text style={styles.loginCardText}>
                    Already have an account?
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.replace('/login')}
                    style={styles.loginCardButton}
                  >
                    <Text style={styles.loginCardButtonText}>Log In</Text>
                  </Pressable>
                </View>

                <Text style={styles.legalText}>
                  By creating an account, you agree to SitGuru’s Terms and
                  Privacy Policy.
                </Text>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>

          {isWebPreview ? <View style={styles.homeIndicator} /> : null}
        </View>
      </View>
    </SitGuruScreen>
  );
}

function PhoneStatusBar() {
  return (
    <View style={styles.statusBar}>
      <Text style={styles.statusTime}>9:41</Text>

      <View style={styles.statusIcons}>
        <View style={styles.signalBars}>
          <View style={[styles.signalBar, { height: 5 }]} />
          <View style={[styles.signalBar, { height: 7 }]} />
          <View style={[styles.signalBar, { height: 9 }]} />
        </View>

        <Text style={styles.wifiText}>⌁</Text>

        <View style={styles.batteryBody}>
          <View style={styles.batteryFill} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  previewCanvas: {
    alignItems: 'center',
    minHeight: 930,
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
    shadowOffset: { width: 0, height: 20 },
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
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
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
    justifyContent: 'space-between',
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
    backgroundColor: SitGuruColors.text,
    borderRadius: 2,
    width: 3,
  },
  wifiText: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.bold,
    fontSize: 11,
  },
  batteryBody: {
    borderColor: SitGuruColors.text,
    borderRadius: 3,
    borderWidth: 1,
    height: 9,
    padding: 1,
    width: 17,
  },
  batteryFill: {
    backgroundColor: SitGuruColors.text,
    borderRadius: 2,
    flex: 1,
  },
  page: {
    gap: 15,
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  loginLink: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.extraBold,
    fontSize: 12,
    minWidth: 40,
    textAlign: 'right',
  },
  intro: {
    gap: 8,
  },
  eyebrowPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  eyebrowText: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.bold,
    fontSize: 11,
  },
  title: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.extraBold,
    fontSize: 34,
    letterSpacing: -0.9,
    lineHeight: 38,
  },
  subtitle: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  signupCard: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 26,
    borderWidth: 1,
    gap: 13,
    padding: 16,
  },
  warningCard: {
    alignItems: 'center',
    backgroundColor: '#FFF8E8',
    borderColor: '#EED18B',
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    padding: 11,
  },
  warningCopy: {
    flex: 1,
    gap: 2,
  },
  warningTitle: {
    color: '#6E4700',
    fontFamily: AppFonts.extraBold,
    fontSize: 12,
  },
  warningText: {
    color: '#7B6430',
    fontFamily: AppFonts.medium,
    fontSize: 10,
    lineHeight: 14,
  },
  successCard: {
    alignItems: 'center',
    backgroundColor: '#ECF9F0',
    borderColor: '#A9DEBA',
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    padding: 11,
  },
  successText: {
    color: '#075A39',
    flex: 1,
    fontFamily: AppFonts.bold,
    fontSize: 11,
    lineHeight: 16,
  },
  errorCard: {
    backgroundColor: '#FFF0ED',
    borderColor: '#F1B8AE',
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
  },
  errorText: {
    color: SitGuruColors.danger,
    fontFamily: AppFonts.bold,
    fontSize: 11,
    lineHeight: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.bold,
    fontSize: 12,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    minHeight: 52,
    paddingHorizontal: 13,
  },
  input: {
    color: SitGuruColors.text,
    flex: 1,
    fontFamily: AppFonts.medium,
    fontSize: 14,
    paddingVertical: 0,
  },
  eyeButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 32,
  },
  roleSection: {
    gap: 8,
  },
  intentGrid: {
    gap: 7,
  },
  intentCard: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  intentCardActive: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primary,
  },
  intentCheck: {
    alignItems: 'center',
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  intentCheckActive: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  intentCopy: {
    flex: 1,
    gap: 1,
  },
  intentTitle: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.extraBold,
    fontSize: 11,
  },
  intentTitleActive: {
    color: SitGuruColors.primary,
  },
  intentText: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.medium,
    fontSize: 9,
  },
  createAccountButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 17,
  },
  createAccountButtonDisabled: {
    opacity: 0.45,
  },
  createAccountButtonPressed: {
    transform: [{ scale: 0.99 }],
  },
  createAccountText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.extraBold,
    fontSize: 14,
  },
  securityRow: {
    alignItems: 'flex-start',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 15,
    flexDirection: 'row',
    gap: 8,
    padding: 10,
  },
  securityText: {
    color: SitGuruColors.textMuted,
    flex: 1,
    fontFamily: AppFonts.medium,
    fontSize: 10,
    lineHeight: 15,
  },
  loginCard: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 21,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    padding: 13,
  },
  loginCardText: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.bold,
    fontSize: 12,
  },
  loginCardButton: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  loginCardButtonText: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.extraBold,
    fontSize: 12,
  },
  legalText: {
    color: SitGuruColors.textSoft,
    fontFamily: AppFonts.medium,
    fontSize: 9,
    lineHeight: 14,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
});