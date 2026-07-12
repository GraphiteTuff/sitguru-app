import { router } from 'expo-router';
import {
    ArrowLeft,
    Mail,
    ShieldCheck,
} from 'lucide-react-native';
import {
    useMemo,
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
import { SitGuruColors } from '@/constants/colors';
import { AppFonts } from '@/constants/fonts';
import {
    isSupabaseConfigured,
    supabase,
} from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const isWebPreview =
    Platform.OS === 'web';

  const [email, setEmail] =
    useState('');

  const [sending, setSending] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
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

  const canSubmit =
    isSupabaseConfigured &&
    emailLooksValid &&
    !sending;

  function clearMessages() {
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function handleResetPassword() {
    clearMessages();

    if (
      !isSupabaseConfigured
    ) {
      setErrorMessage(
        'Password recovery is unavailable because Supabase is not configured in this build.',
      );
      return;
    }

    if (!cleanEmail) {
      setErrorMessage(
        'Enter the email connected to your SitGuru account.',
      );
      return;
    }

    if (!emailLooksValid) {
      setErrorMessage(
        'Enter a valid email address.',
      );
      return;
    }

    setSending(true);

    const { error } =
      await supabase.auth
        .resetPasswordForEmail(
          cleanEmail,
        );

    setSending(false);

    if (error) {
      const normalized =
        error.message.toLowerCase();

      if (
        normalized.includes(
          'rate limit',
        ) ||
        normalized.includes(
          'too many',
        )
      ) {
        setErrorMessage(
          'Too many password-reset requests were made. Wait a moment, then try again.',
        );
        return;
      }

      if (
        normalized.includes(
          'network',
        ) ||
        normalized.includes(
          'fetch',
        )
      ) {
        setErrorMessage(
          'SitGuru could not connect securely. Check your internet connection and try again.',
        );
        return;
      }

      setErrorMessage(
        'SitGuru could not send the password-reset email. Please try again.',
      );
      return;
    }

    setSuccessMessage(
      'Password-reset instructions were sent. Check your email and follow the secure link.',
    );
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
                    accessibilityLabel="Return to Login"
                    accessibilityRole="button"
                    onPress={() =>
                      router.replace(
                        '/login',
                      )
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.backButton,
                      pressed &&
                        styles.buttonPressed,
                    ]}
                  >
                    <ArrowLeft
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
                      styles.eyebrow
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
                      Account recovery
                    </Text>
                  </View>

                  <Text
                    style={styles.title}
                  >
                    Reset your password.
                  </Text>

                  <Text
                    style={
                      styles.subtitle
                    }
                  >
                    Enter the email
                    connected to your
                    SitGuru account. We
                    will send secure
                    instructions for
                    creating a new
                    password.
                  </Text>
                </View>

                <View
                  style={styles.card}
                >
                  {!isSupabaseConfigured ? (
                    <View
                      style={
                        styles.warningCard
                      }
                    >
                      <Text
                        style={
                          styles.warningText
                        }
                      >
                        Password recovery
                        is temporarily
                        unavailable because
                        authentication is
                        not configured in
                        this build.
                      </Text>
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

                      <Text
                        style={
                          styles.successText
                        }
                      >
                        {successMessage}
                      </Text>
                    </View>
                  ) : null}

                  {errorMessage ? (
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
                        {errorMessage}
                      </Text>
                    </View>
                  ) : null}

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
                        autoCorrect={
                          false
                        }
                        editable={
                          !sending
                        }
                        keyboardType="email-address"
                        onChangeText={(
                          value,
                        ) => {
                          setEmail(
                            value,
                          );
                          clearMessages();
                        }}
                        onSubmitEditing={() =>
                          void handleResetPassword()
                        }
                        placeholder="you@example.com"
                        placeholderTextColor={
                          SitGuruColors.textSoft
                        }
                        returnKeyType="send"
                        style={
                          styles.input
                        }
                        textContentType="emailAddress"
                        value={email}
                      />
                    </View>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{
                      disabled:
                        !canSubmit,
                    }}
                    disabled={!canSubmit}
                    onPress={() =>
                      void handleResetPassword()
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.primaryButton,
                      !canSubmit &&
                        styles.primaryButtonDisabled,
                      pressed &&
                        canSubmit &&
                        styles.buttonPressed,
                    ]}
                  >
                    <Text
                      style={
                        styles.primaryButtonText
                      }
                    >
                      {sending
                        ? 'Sending instructions…'
                        : 'Send reset instructions'}
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      router.replace(
                        '/login',
                      )
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.secondaryButton,
                      pressed &&
                        styles.buttonPressed,
                    ]}
                  >
                    <Text
                      style={
                        styles.secondaryButtonText
                      }
                    >
                      Return to Login
                    </Text>
                  </Pressable>
                </View>

                <View
                  style={
                    styles.securityCard
                  }
                >
                  <ShieldCheck
                    color={
                      SitGuruColors.primary
                    }
                    size={18}
                    strokeWidth={2.4}
                  />

                  <View
                    style={
                      styles.securityCopy
                    }
                  >
                    <Text
                      style={
                        styles.securityTitle
                      }
                    >
                      Secure account
                      recovery
                    </Text>

                    <Text
                      style={
                        styles.securityText
                      }
                    >
                      SitGuru will never
                      ask for your
                      password or
                      verification code
                      by email.
                    </Text>
                  </View>
                </View>
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
    height: 760,
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
    gap: 17,
    paddingBottom: 28,
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
  eyebrow: {
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
    lineHeight: 39,
  },
  subtitle: {
    color:
      SitGuruColors.textMuted,
    fontFamily:
      AppFonts.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    backgroundColor:
      SitGuruColors.surface,
    borderColor:
      SitGuruColors.border,
    borderRadius: 27,
    borderWidth: 1,
    gap: 15,
    padding: 17,
  },
  fieldGroup: {
    gap: 7,
  },
  fieldLabel: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.bold,
    fontSize: 13,
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
  primaryButton: {
    alignItems: 'center',
    backgroundColor:
      SitGuruColors.primary,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily:
      AppFonts.extraBold,
    fontSize: 14,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor:
      SitGuruColors.surfaceSoft,
    borderColor:
      SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color:
      SitGuruColors.primary,
    fontFamily:
      AppFonts.extraBold,
    fontSize: 14,
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
  successText: {
    color: '#075A39',
    flex: 1,
    fontFamily: AppFonts.bold,
    fontSize: 12,
    lineHeight: 17,
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
  warningCard: {
    backgroundColor: '#FFF8E8',
    borderColor: '#EED18B',
    borderRadius: 16,
    borderWidth: 1,
    padding: 11,
  },
  warningText: {
    color: '#6E4700',
    fontFamily: AppFonts.bold,
    fontSize: 12,
    lineHeight: 17,
  },
  securityCard: {
    alignItems: 'center',
    backgroundColor:
      SitGuruColors.surface,
    borderColor:
      SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    padding: 14,
  },
  securityCopy: {
    flex: 1,
    gap: 3,
  },
  securityTitle: {
    color: SitGuruColors.text,
    fontFamily:
      AppFonts.extraBold,
    fontSize: 13,
  },
  securityText: {
    color:
      SitGuruColors.textMuted,
    fontFamily:
      AppFonts.medium,
    fontSize: 11,
    lineHeight: 16,
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