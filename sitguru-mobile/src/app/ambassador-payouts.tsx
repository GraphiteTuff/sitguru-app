import { router } from 'expo-router';
import {
    ArrowLeft,
    Bell,
    BriefcaseBusiness,
    Check,
    CheckCircle2,
    ChevronRight,
    CreditCard,
    LockKeyhole,
    RefreshCw,
    ShieldCheck,
    Smartphone,
    Wallet,
} from 'lucide-react-native';
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Linking,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View,
    type TextStyle,
} from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import { SitGuruIcon } from '@/components/SitGuruIcon';
import SitGuruScreen from '@/components/SitGuruScreen';
import SitGuruTabBar from '@/components/SitGuruTabBar';
import { getAppTheme } from '@/constants/theme';
import {
    setThemePreference,
    useThemePreference,
    type SitGuruThemePreference,
} from '@/hooks/use-color-scheme';
import { useThemeMode } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { resolveSupabaseStorageUrl } from '@/lib/storage';

type Theme = ReturnType<typeof getAppTheme>;

type AmbassadorPayoutProvider =
  | 'stripe'
  | 'paypal'
  | 'venmo'
  | 'set_up_later';

type DestinationType =
  | 'email'
  | 'paypal_id'
  | 'mobile_number'
  | 'venmo_account';

type AmbassadorPayoutAccount = {
  id?: string | null;
  provider?: 'stripe' | 'paypal' | 'venmo' | null;
  providerAccountId?: string | null;
  providerEmail?: string | null;
  providerPhone?: string | null;
  onboardingStatus?: string | null;
  accountStatus?: string | null;
  payoutsEnabled?: boolean;
  isDefault?: boolean;
  isLive?: boolean;
  verifiedAt?: string | null;
};

type AmbassadorPayoutSetup = {
  role?: 'ambassador';
  selectedProvider?: AmbassadorPayoutProvider;
  setupComplete?: boolean;
  nextAction?: string | null;
  readyAccount?: AmbassadorPayoutAccount | null;
  accounts?: AmbassadorPayoutAccount[];
  warnings?: string[];
  blockers?: {
    receiveRewardPayout?: boolean;
  };
  messaging?: {
    headline?: string;
    description?: string;
    readyMessage?: string;
    blockedMessage?: string;
  };
};

type AmbassadorPayoutResponse = {
  success: boolean;
  message?: string;
  error?: string;
  setup?: AmbassadorPayoutSetup;
  onboardingUrl?: string;
  redirectUrl?: string;
  url?: string;
};

type Feedback = {
  tone: 'success' | 'error' | 'info';
  message: string;
} | null;

type ProviderChoice = {
  provider: Exclude<AmbassadorPayoutProvider, 'set_up_later'>;
  label: string;
  shortLabel: string;
  description: string;
  helper: string;
  badge?: string;
  icon: ReactNode;
};

const Fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
} as const;

const THEME_OPTIONS: Array<{
  icon: 'sun' | 'moon';
  label: string;
  value: SitGuruThemePreference;
}> = [
  { icon: 'sun', label: 'Light', value: 'light' },
  { icon: 'moon', label: 'Dark', value: 'dark' },
];

const API_BASE_CANDIDATES = Array.from(
  new Set(
    [
      process.env.EXPO_PUBLIC_SITGURU_API_URL,
      Platform.OS === 'web' ? 'http://localhost:3000' : '',
      Platform.OS === 'web' ? 'http://127.0.0.1:3000' : '',
      process.env.EXPO_PUBLIC_SITGURU_WEB_URL,
      'https://www.sitguru.com',
    ]
      .map((value) => (value || '').trim().replace(/\/+$/, ''))
      .filter(Boolean),
  ),
);

function safeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeProvider(
  value: unknown,
): AmbassadorPayoutProvider {
  const normalized = safeString(value).toLowerCase();

  if (normalized === 'stripe') return 'stripe';
  if (normalized === 'paypal') return 'paypal';
  if (normalized === 'venmo') return 'venmo';

  return 'set_up_later';
}

function providerLabel(provider: AmbassadorPayoutProvider) {
  if (provider === 'stripe') return 'Bank or debit card';
  if (provider === 'paypal') return 'PayPal';
  if (provider === 'venmo') return 'Venmo';
  return 'Not picked yet';
}

function providerShortLabel(provider: AmbassadorPayoutProvider) {
  if (provider === 'stripe') return 'Bank or card';
  if (provider === 'paypal') return 'PayPal';
  if (provider === 'venmo') return 'Venmo';
  return 'Pick a payout';
}

function readyDestination(account?: AmbassadorPayoutAccount | null) {
  if (!account) return 'Connected account';

  return (
    account.providerEmail ||
    account.providerPhone ||
    account.providerAccountId ||
    (account.provider === 'stripe'
      ? 'Connected securely with Stripe'
      : 'Connected account')
  );
}

function friendlyPayoutMessage(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes('preference record') ||
    normalized.includes('reward payout record') ||
    normalized.includes('destination could not be read') ||
    normalized.includes('could not be initialized')
  ) {
    return 'We couldn’t load your saved payout choice. Your rewards are safe. Pick an option below or refresh.';
  }

  if (
    normalized.includes('temporarily unavailable') ||
    normalized.includes('could not load your payout setup')
  ) {
    return 'Payout setup is taking a moment. Your rewards are safe. Refresh or pick an option below.';
  }

  return message;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizeUsMobile(value: string) {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;

  return null;
}

async function readPayoutResponse(
  response: Response,
): Promise<AmbassadorPayoutResponse> {
  const raw = await response.text();

  if (!raw.trim()) {
    return {
      success: false,
      error: `SitGuru returned an empty payout response (${response.status}).`,
    };
  }

  try {
    return JSON.parse(raw) as AmbassadorPayoutResponse;
  } catch {
    return {
      success: false,
      error:
        response.status === 404
          ? 'Reward payout setup is not available at this address yet.'
          : `SitGuru returned an unreadable payout response (${response.status}).`,
    };
  }
}

function Button({
  label,
  onPress,
  styles,
  theme,
  icon,
  primary = false,
  disabled = false,
  fullWidth = true,
}: {
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  theme: Theme;
  icon?: ReactNode;
  primary?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <BubblePressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        fullWidth ? styles.buttonFullWidth : null,
        primary ? styles.buttonPrimary : styles.buttonSecondary,
        disabled ? styles.disabled : null,
      ]}>
      {icon}
      <Text
        style={[
          styles.buttonText,
          primary
            ? styles.buttonTextPrimary
            : { color: theme.colors.primary },
        ]}>
        {label}
      </Text>
    </BubblePressable>
  );
}

function SegmentedChoice({
  value,
  options,
  onChange,
  styles,
}: {
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option.value === value;

        return (
          <BubblePressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            scaleTo={0.88}
            style={[
              styles.segmentedButton,
              active ? styles.segmentedButtonActive : null,
            ]}>
            <Text
              style={[
                styles.segmentedText,
                active ? styles.segmentedTextActive : null,
              ]}>
              {option.label}
            </Text>
          </BubblePressable>
        );
      })}
    </View>
  );
}

function ProviderBadge({
  provider,
  styles,
  theme,
}: {
  provider: Exclude<AmbassadorPayoutProvider, 'set_up_later'>;
  styles: ReturnType<typeof createStyles>;
  theme: Theme;
}) {
  if (provider === 'stripe') {
    return (
      <View style={styles.providerBadge}>
        <CreditCard
          color={theme.colors.primary}
          size={24}
          strokeWidth={2.3}
        />
      </View>
    );
  }

  return (
    <View style={styles.providerBadge}>
      <Text style={styles.providerBadgeText}>
        {provider === 'paypal' ? 'P' : 'V'}
      </Text>
    </View>
  );
}

function ProviderCard({
  choice,
  selected,
  ready,
  wide,
  children,
  onSelect,
  styles,
  theme,
}: {
  choice: ProviderChoice;
  selected: boolean;
  ready: boolean;
  wide: boolean;
  children?: ReactNode;
  onSelect: () => void;
  styles: ReturnType<typeof createStyles>;
  theme: Theme;
}) {
  return (
    <View
      style={[
        styles.providerCard,
        wide ? styles.providerCardWide : null,
        selected ? styles.providerCardSelected : null,
        ready ? styles.providerCardReady : null,
      ]}>
      <BubblePressable
        accessibilityLabel={`Choose ${choice.label}`}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={onSelect}
        scaleTo={0.97}
        style={[styles.providerCardHeader]}>
        <ProviderBadge
          provider={choice.provider}
          styles={styles}
          theme={theme}
        />

        <View style={styles.providerCopy}>
          <View style={styles.providerTitleRow}>
            <Text style={styles.providerTitle}>{choice.label}</Text>

            {ready ? (
              <View style={styles.readyBadge}>
                <CheckCircle2
                  color={theme.colors.primary}
                  size={13}
                  strokeWidth={2.6}
                />
                <Text style={styles.readyBadgeText}>Ready</Text>
              </View>
            ) : selected ? (
              <View style={styles.selectedBadge}>
                <Check color="#FFFFFF" size={12} strokeWidth={2.8} />
                <Text style={styles.selectedBadgeText}>Picked</Text>
              </View>
            ) : choice.badge ? (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>{choice.badge}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.providerDescription}>
            {choice.description}
          </Text>

          <Text style={styles.providerHelper}>{choice.helper}</Text>
        </View>

        <ChevronRight
          color={theme.colors.primary}
          size={18}
          strokeWidth={2.4}
        />
      </BubblePressable>

      {children ? (
        <View style={styles.providerForm}>{children}</View>
      ) : null}
    </View>
  );
}

function PhoneStatusBar({
  styles,
}: {
  styles: ReturnType<typeof createStyles>;
}) {
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

        <View style={styles.batteryWrap}>
          <View style={styles.batteryBody}>
            <View style={styles.batteryFill} />
          </View>
          <View style={styles.batteryCap} />
        </View>
      </View>
    </View>
  );
}

export default function AmbassadorPayoutsScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const themeMode = useThemeMode();
  const themePreference = useThemePreference();
  const isDark = themeMode === 'dark';
  const theme = getAppTheme(isDark ? 'dark' : 'light');
  const styles = useMemo(() => createStyles(theme), [theme]);

  const isWebPreview = Platform.OS === 'web';
  const isTablet = Platform.OS !== 'web' && windowWidth >= 768;
  const useWideGrid = Platform.OS !== 'web' && windowWidth >= 900;

  const {
    session,
    user,
    profile,
    roles,
    loading: authLoading,
  } = useAuth();

  const [setup, setSetup] = useState<AmbassadorPayoutSetup | null>(null);
  const [selectedProvider, setSelectedProvider] =
    useState<AmbassadorPayoutProvider>('set_up_later');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingProvider, setSavingProvider] =
    useState<AmbassadorPayoutProvider | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [secureSetupUrl, setSecureSetupUrl] = useState('');
  const [avatarImageFailed, setAvatarImageFailed] = useState(false);

  const [paypalType, setPaypalType] =
    useState<'email' | 'paypal_id'>('email');
  const [paypalValue, setPaypalValue] = useState('');

  const [venmoType, setVenmoType] =
    useState<'mobile_number' | 'venmo_account'>('mobile_number');
  const [venmoValue, setVenmoValue] = useState('');

  const token = session?.access_token || '';
  const hasAmbassadorRole = roles.includes('ambassador');

  const apiFetch = useCallback(
    async (path: string, options?: RequestInit) => {
      const requestHeaders = new Headers(options?.headers || {});

      if (token) {
        requestHeaders.set('Authorization', `Bearer ${token}`);
      }

      if (options?.body) {
        requestHeaders.set('Content-Type', 'application/json');
      }

      let lastResponse: Response | null = null;

      for (const baseUrl of API_BASE_CANDIDATES) {
        try {
          const response = await fetch(`${baseUrl}${path}`, {
            ...options,
            headers: requestHeaders,
          });

          lastResponse = response;

          if (response.status === 404) {
            continue;
          }

          return response;
        } catch {
          // Try the next configured SitGuru API address.
        }
      }

      if (lastResponse) return lastResponse;

      throw new Error(
        isWebPreview
          ? 'SitGuru could not connect. Keep the main web server running at http://localhost:3000, then refresh.'
          : 'SitGuru could not connect. Check your internet connection and try again.',
      );
    },
    [isWebPreview, token],
  );

  const loadSetup = useCallback(
    async (quiet = false) => {
      if (!token) {
        setLoading(false);
        return;
      }

      quiet ? setRefreshing(true) : setLoading(true);

      try {
        const response = await apiFetch(
          '/api/payouts/setup?role=ambassador',
          {
            method: 'GET',
            cache: 'no-store',
          },
        );

        const payload = await readPayoutResponse(response);

        if (!response.ok || !payload.success) {
          throw new Error(
            payload.error || 'SitGuru could not load your payout setup.',
          );
        }

        const nextSetup = payload.setup || null;
        const nextProvider = normalizeProvider(
          nextSetup?.readyAccount?.provider ||
            nextSetup?.selectedProvider,
        );

        setSetup(nextSetup);
        setSelectedProvider(nextProvider);
        setFeedback(null);

        const warnings = nextSetup?.warnings || [];
        if (warnings.length > 0) {
          setFeedback({
            tone: 'info',
            message: warnings.join(' '),
          });
        }
      } catch (error) {
        setFeedback({
          tone: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'SitGuru could not load your payout setup.',
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [apiFetch, token],
  );

  useEffect(() => {
    if (!authLoading) {
      void loadSetup();
    }
  }, [authLoading, loadSetup]);

  const providerChoices = useMemo<ProviderChoice[]>(
    () => [
      {
        provider: 'venmo',
        label: 'Venmo',
        shortLabel: 'Venmo',
        description: 'Get approved rewards through Venmo.',
        helper: 'Connect an eligible U.S. mobile number.',
        badge: 'Popular',
        icon: (
          <Smartphone
            color={theme.colors.primary}
            size={24}
            strokeWidth={2.3}
          />
        ),
      },
      {
        provider: 'stripe',
        label: 'Bank or debit card',
        shortLabel: 'Bank or card',
        description: 'Send rewards to your bank or eligible debit card.',
        helper: 'Powered securely by Stripe.',
        badge: 'Most flexible',
        icon: (
          <CreditCard
            color={theme.colors.primary}
            size={24}
            strokeWidth={2.3}
          />
        ),
      },
      {
        provider: 'paypal',
        label: 'PayPal',
        shortLabel: 'PayPal',
        description: 'Send approved rewards to your PayPal.',
        helper: 'Use the PayPal account you already have.',
        icon: (
          <Wallet
            color={theme.colors.primary}
            size={24}
            strokeWidth={2.3}
          />
        ),
      },
    ],
    [theme.colors.primary],
  );

  const setupComplete = Boolean(setup?.setupComplete);
  const readyAccount = setup?.readyAccount || null;
  const readyProvider = normalizeProvider(
    readyAccount?.provider || setup?.selectedProvider,
  );

  async function saveProvider(
    provider: AmbassadorPayoutProvider,
  ) {
    if (!token || savingProvider) return;

    const body: Record<string, unknown> = {
      role: 'ambassador',
      preferredProvider: provider,
    };

    if (provider === 'paypal') {
      const cleanValue = paypalValue.trim();

      if (!cleanValue) {
        setFeedback({
          tone: 'error',
          message:
            paypalType === 'email'
              ? 'Enter the email on your PayPal account.'
              : 'Enter your PayPal ID.',
        });
        return;
      }

      if (paypalType === 'email' && !isValidEmail(cleanValue)) {
        setFeedback({
          tone: 'error',
          message: 'Enter a valid PayPal email.',
        });
        return;
      }

      body.destinationType = paypalType;
      body.destinationValue =
        paypalType === 'email'
          ? cleanValue.toLowerCase()
          : cleanValue;
    }

    if (provider === 'venmo') {
      const cleanValue = venmoValue.trim();

      if (!cleanValue) {
        setFeedback({
          tone: 'error',
          message:
            venmoType === 'mobile_number'
              ? 'Enter the U.S. mobile number on your Venmo.'
              : 'Enter your Venmo account.',
        });
        return;
      }

      if (venmoType === 'mobile_number') {
        const mobile = normalizeUsMobile(cleanValue);

        if (!mobile) {
          setFeedback({
            tone: 'error',
            message: 'Enter a valid U.S. mobile number.',
          });
          return;
        }

        body.destinationType = venmoType;
        body.destinationValue = mobile;
      } else {
        body.destinationType = venmoType;
        body.destinationValue = cleanValue;
      }
    }

    setSavingProvider(provider);
    setFeedback(null);

    try {
      const response = await apiFetch(
        '/api/payouts/setup?role=ambassador',
        {
          method: 'PATCH',
          body: JSON.stringify(body),
        },
      );

      const payload = await readPayoutResponse(response);

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.error || 'SitGuru could not save that payout choice.',
        );
      }

      const nextSetup = payload.setup || null;
      const nextProvider = normalizeProvider(
        nextSetup?.readyAccount?.provider ||
          nextSetup?.selectedProvider ||
          provider,
      );

      setSetup(nextSetup);
      setSelectedProvider(nextProvider);

      const returnedUrl =
        safeString(payload.onboardingUrl) ||
        safeString(payload.redirectUrl) ||
        safeString(payload.url);

      if (returnedUrl) {
        setSecureSetupUrl(returnedUrl);
      } else if (provider === 'stripe') {
        const fallbackBase =
          API_BASE_CANDIDATES.find((value) =>
            value.startsWith('https://'),
          ) || 'https://www.sitguru.com';

        setSecureSetupUrl(
          `${fallbackBase}/ambassador/dashboard/payouts?provider=stripe`,
        );
      }

      setFeedback({
        tone: 'success',
        message:
          provider === 'set_up_later'
            ? 'Saved. You can finish payout setup later.'
            : provider === 'stripe'
              ? 'Bank or card is now your payout choice. Continue the secure Stripe setup.'
              : payload.message ||
                `${providerLabel(provider)} was saved. SitGuru will verify it before your first payment.`,
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'SitGuru could not save that payout choice.',
      });
    } finally {
      setSavingProvider(null);
    }
  }

  async function openSecureStripeSetup() {
    const target =
      secureSetupUrl ||
      `${
        API_BASE_CANDIDATES.find((value) =>
          value.startsWith('https://'),
        ) || 'https://www.sitguru.com'
      }/ambassador/dashboard/payouts?provider=stripe`;

    try {
      const supported = await Linking.canOpenURL(target);

      if (!supported) {
        throw new Error('This secure setup link could not be opened.');
      }

      await Linking.openURL(target);
    } catch (error) {
      setFeedback({
        tone: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'SitGuru could not open secure Stripe setup.',
      });
    }
  }

  function goBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/ambassador-command-center' as never);
  }

  function openRewardsHome() {
    router.replace('/ambassador-command-center' as never);
  }

  if (authLoading || loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
        />
        <Text style={styles.centerTitle}>Loading payout setup</Text>
        <Text style={styles.centerBody}>
          Getting your saved reward payment choice.
        </Text>
      </View>
    );
  }

  if (!user || !session) {
    return (
      <View style={styles.centerScreen}>
        <Wallet
          color={theme.colors.primary}
          size={40}
          strokeWidth={2.2}
        />
        <Text style={styles.centerTitle}>Sign in to continue</Text>
        <Text style={styles.centerBody}>
          Sign in to choose how you receive Ambassador rewards.
        </Text>
        <Button
          label="Open sign in"
          primary
          onPress={() => router.replace('/login' as never)}
          styles={styles}
          theme={theme}
        />
      </View>
    );
  }

  if (!hasAmbassadorRole) {
    return (
      <View style={styles.centerScreen}>
        <ShieldCheck
          color={theme.colors.primary}
          size={40}
          strokeWidth={2.2}
        />
        <Text style={styles.centerTitle}>
          Ambassador workspace required
        </Text>
        <Text style={styles.centerBody}>
          This account does not currently have an Ambassador workspace.
        </Text>
        <Button
          label="Return to account"
          onPress={() => router.replace('/account' as never)}
          styles={styles}
          theme={theme}
        />
      </View>
    );
  }

  const profileRecord = (profile ?? {}) as Record<string, unknown>;
  const userMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;

  const firstName =
    profile?.first_name ||
    profile?.full_name?.split(' ')[0] ||
    (typeof userMetadata.full_name === 'string'
      ? userMetadata.full_name.split(' ')[0]
      : '') ||
    'Ambassador';

  const rawAvatar = [
    profileRecord.avatar_url,
    profileRecord.photo_url,
    profileRecord.profile_photo_url,
    profileRecord.profile_image_url,
    userMetadata.avatar_url,
    userMetadata.picture,
  ].find(
    (value): value is string =>
      typeof value === 'string' && value.trim().length > 0,
  );

  const avatarUrl = rawAvatar
    ? resolveSupabaseStorageUrl(rawAvatar)
    : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <SitGuruScreen
        center={isWebPreview || isTablet}
        maxWidth={isWebPreview ? 620 : useWideGrid ? 1040 : isTablet ? 860 : 620}>
        <View
          style={[
            styles.previewCanvas,
            !isWebPreview ? styles.previewCanvasNative : null,
          ]}>
          <View
            style={[
              styles.deviceFrame,
              !isWebPreview ? styles.deviceFrameNative : null,
            ]}>
            {isWebPreview ? <View style={styles.deviceTopSpeaker} /> : null}

            <View
              style={[
                styles.phoneShell,
                !isWebPreview ? styles.phoneShellNative : null,
              ]}>
              <View style={styles.appScreen}>
                {isWebPreview ? <PhoneStatusBar styles={styles} /> : null}

                <View
                  style={[
                    styles.page,
                    isTablet ? styles.pageTablet : null,
                  ]}>
          <View style={styles.header}>
            <BubblePressable
              accessibilityLabel="Back"
              accessibilityHint="Returns to the previous Ambassador screen."
              accessibilityRole="button"
              onPress={goBack}
              scaleTo={0.88}
              style={[styles.backButton]}>
              <ArrowLeft
                color={theme.colors.primary}
                size={19}
                strokeWidth={2.7}
              />
            </BubblePressable>

            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>
                {'Ambassador\nDashboard'}
              </Text>

              <Text numberOfLines={1} style={styles.welcomeText}>
                Welcome back, {firstName}! <Text style={styles.wave}>👋</Text>
              </Text>

              <View style={styles.roleStatusRow}>
                <View style={styles.roleStatusDot} />
                <Text style={styles.roleStatusText}>Ambassador • Live</Text>
              </View>

              <BubblePressable
                accessibilityLabel="Open Ambassador Portal"
                accessibilityRole="button"
                onPress={() =>
                  router.push('/ambassador-command-center' as never)
                }
                scaleTo={0.88}
                style={[styles.portalButton]}>
                <BriefcaseBusiness
                  color={theme.colors.primary}
                  size={13}
                  strokeWidth={2.5}
                />
                <Text style={styles.portalButtonText}>Portal</Text>
                <ChevronRight
                  color={theme.colors.primary}
                  size={13}
                  strokeWidth={2.5}
                />
              </BubblePressable>
            </View>

            <View style={styles.headerActions}>
              <BubblePressable
                accessibilityLabel="Open notifications"
                accessibilityRole="button"
                onPress={() => router.push('/notifications' as never)}
                scaleTo={0.88}
                style={[styles.headerIconButton]}>
                <Bell
                  color={theme.colors.text}
                  size={18}
                  strokeWidth={2.3}
                />
              </BubblePressable>

              <View style={styles.modeToggle}>
                {THEME_OPTIONS.map((option) => {
                  const active = themePreference === option.value;

                  return (
                    <BubblePressable
                      key={option.value}
                      accessibilityLabel={`Switch to ${option.label} mode`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => setThemePreference(option.value)}
                      scaleTo={0.88}
                      style={[
                        styles.modeButton,
                        active ? styles.modeButtonActive : null,
                      ]}>
                      <SitGuruIcon
                        color={
                          active
                            ? option.value === 'light'
                              ? '#F3AA1F'
                              : isDark
                                ? '#F0CF62'
                                : theme.colors.primary
                            : theme.colors.textSecondary
                        }
                        name={option.icon}
                        size={15}
                        strokeWidth={2.4}
                      />
                    </BubblePressable>
                  );
                })}
              </View>

              <BubblePressable
                accessibilityLabel="Open profile and workspace switcher"
                accessibilityRole="button"
                onPress={() => router.push('/account' as never)}
                scaleTo={0.88}
                style={[styles.avatar]}>
                {avatarUrl && !avatarImageFailed ? (
                  <Image
                    onError={() => setAvatarImageFailed(true)}
                    resizeMode="cover"
                    source={{ uri: avatarUrl }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {(firstName[0] || 'A').toUpperCase()}
                  </Text>
                )}
              </BubblePressable>
            </View>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void loadSetup(true)}
                tintColor={theme.colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}>
            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <Wallet
                  color={theme.colors.primary}
                  size={26}
                  strokeWidth={2.3}
                />
              </View>

              <Text style={styles.heroEyebrow}>Reward payments</Text>

              <Text style={styles.heroTitle}>
                {setupComplete
                  ? 'You’re ready to get paid'
                  : 'Pick how you get paid'}
              </Text>

              <Text style={styles.heroBody}>
                {setupComplete
                  ? `${providerLabel(readyProvider)} is connected. You can switch later.`
                  : 'Choose one now. Switch anytime.'}
              </Text>
            </View>

            {feedback ? (
              <View
                style={[
                  styles.feedback,
                  feedback.tone === 'success'
                    ? styles.feedbackSuccess
                    : feedback.tone === 'error'
                      ? styles.feedbackError
                      : styles.feedbackInfo,
                ]}>
                <View style={styles.feedbackIcon}>
                  {feedback.tone === 'success' ? (
                    <CheckCircle2
                      color={theme.colors.primary}
                      size={19}
                      strokeWidth={2.5}
                    />
                  ) : feedback.tone === 'error' ? (
                    <ShieldCheck
                      color={theme.colors.danger}
                      size={19}
                      strokeWidth={2.5}
                    />
                  ) : (
                    <Wallet
                      color={theme.colors.info}
                      size={19}
                      strokeWidth={2.4}
                    />
                  )}
                </View>

                <View style={styles.feedbackCopy}>
                  <Text style={styles.feedbackText}>
                    {friendlyPayoutMessage(feedback.message)}
                  </Text>

                  {feedback.tone !== 'success' ? (
                    <View style={styles.feedbackActions}>
                      <BubblePressable
                        accessibilityRole="button"
                        onPress={() => void loadSetup(true)}
                        scaleTo={0.88}
                        style={[styles.feedbackAction]}>
                        <RefreshCw
                          color={theme.colors.primary}
                          size={14}
                          strokeWidth={2.5}
                        />
                        <Text style={styles.feedbackActionText}>Refresh</Text>
                      </BubblePressable>

                      <BubblePressable
                        accessibilityRole="button"
                        onPress={() => router.push('/support' as never)}
                        scaleTo={0.88}
                        style={[styles.feedbackAction]}>
                        <ShieldCheck
                          color={theme.colors.primary}
                          size={14}
                          strokeWidth={2.5}
                        />
                        <Text style={styles.feedbackActionText}>Get help</Text>
                      </BubblePressable>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            {setupComplete && readyAccount ? (
              <View style={styles.readySummary}>
                <View style={styles.readySummaryTop}>
                  <View style={styles.readySummaryIcon}>
                    <CheckCircle2
                      color={theme.colors.primary}
                      size={24}
                      strokeWidth={2.5}
                    />
                  </View>

                  <View style={styles.readySummaryCopy}>
                    <Text style={styles.readySummaryEyebrow}>
                      Ready
                    </Text>
                    <Text style={styles.readySummaryTitle}>
                      {providerLabel(readyProvider)}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={styles.readySummaryDetail}>
                      {readyDestination(readyAccount)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.readySummaryBody}>
                  Approved rewards can be sent to this payout method.
                </Text>

                <Button
                  label="Switch payout method"
                  onPress={() => {
                    setSetup((current) =>
                      current
                        ? {
                            ...current,
                            setupComplete: false,
                          }
                        : current,
                    );
                    setSelectedProvider('set_up_later');
                  }}
                  styles={styles}
                  theme={theme}
                />
              </View>
            ) : null}

            {!setupComplete ? (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionEyebrow}>Choose one</Text>
                  <Text style={styles.sectionTitle}>Your payout options</Text>
                  <Text style={styles.sectionBody}>
                    Tap one. Only that setup opens.
                  </Text>
                </View>

                <View
                  style={[
                    styles.providerGrid,
                    useWideGrid ? styles.providerGridWide : null,
                  ]}>
                  {providerChoices.map((choice) => {
                    const selected =
                      selectedProvider === choice.provider;

                    return (
                      <ProviderCard
                        key={choice.provider}
                        choice={choice}
                        selected={selected}
                        ready={false}
                        wide={useWideGrid}
                        onSelect={() =>
                          setSelectedProvider((current) =>
                            current === choice.provider
                              ? 'set_up_later'
                              : choice.provider,
                          )
                        }
                        styles={styles}
                        theme={theme}>
                        {selected && choice.provider === 'stripe' ? (
                          <View style={styles.providerActionBlock}>
                            <Text style={styles.providerFormText}>
                              Connect your bank or eligible debit card through
                              Stripe’s secure setup.
                            </Text>

                            <View style={styles.walletNote}>
                              <Text style={styles.walletNoteTitle}>
                                Use Cash App or Apple Wallet?
                              </Text>
                              <Text style={styles.walletNoteBody}>
                                Choose Bank or debit card, then connect an
                                eligible account or debit card during secure setup.
                              </Text>
                            </View>

                            <Button
                              label={
                                savingProvider === 'stripe'
                                  ? 'Saving...'
                                  : 'Continue bank or card'
                              }
                              primary
                              disabled={savingProvider !== null}
                              onPress={() => void saveProvider('stripe')}
                              styles={styles}
                              theme={theme}
                              icon={
                                savingProvider === 'stripe' ? (
                                  <ActivityIndicator
                                    color="#FFFFFF"
                                    size="small"
                                  />
                                ) : (
                                  <CreditCard
                                    color="#FFFFFF"
                                    size={17}
                                    strokeWidth={2.4}
                                  />
                                )
                              }
                            />

                            {secureSetupUrl ? (
                              <Button
                                label="Open secure Stripe setup"
                                onPress={() =>
                                  void openSecureStripeSetup()
                                }
                                styles={styles}
                                theme={theme}
                                icon={
                                  <LockKeyhole
                                    color={theme.colors.primary}
                                    size={17}
                                    strokeWidth={2.4}
                                  />
                                }
                              />
                            ) : null}
                          </View>
                        ) : null}

                        {selected && choice.provider === 'paypal' ? (
                          <View style={styles.providerActionBlock}>
                            <SegmentedChoice
                              value={paypalType}
                              options={[
                                {
                                  label: 'Email',
                                  value: 'email',
                                },
                                {
                                  label: 'PayPal ID',
                                  value: 'paypal_id',
                                },
                              ]}
                              onChange={(value) =>
                                setPaypalType(
                                  value as 'email' | 'paypal_id',
                                )
                              }
                              styles={styles}
                            />

                            <TextInput
                              autoCapitalize="none"
                              autoCorrect={false}
                              keyboardType={
                                paypalType === 'email'
                                  ? 'email-address'
                                  : 'default'
                              }
                              onChangeText={setPaypalValue}
                              placeholder={
                                paypalType === 'email'
                                  ? 'PayPal email'
                                  : 'PayPal ID'
                              }
                              placeholderTextColor={
                                theme.colors.inputPlaceholder
                              }
                              style={styles.input}
                              value={paypalValue}
                            />

                            <Button
                              label={
                                savingProvider === 'paypal'
                                  ? 'Saving...'
                                  : 'Save PayPal'
                              }
                              primary
                              disabled={savingProvider !== null}
                              onPress={() => void saveProvider('paypal')}
                              styles={styles}
                              theme={theme}
                              icon={
                                savingProvider === 'paypal' ? (
                                  <ActivityIndicator
                                    color="#FFFFFF"
                                    size="small"
                                  />
                                ) : (
                                  <Wallet
                                    color="#FFFFFF"
                                    size={17}
                                    strokeWidth={2.4}
                                  />
                                )
                              }
                            />
                          </View>
                        ) : null}

                        {selected && choice.provider === 'venmo' ? (
                          <View style={styles.providerActionBlock}>
                            <SegmentedChoice
                              value={venmoType}
                              options={[
                                {
                                  label: 'Mobile',
                                  value: 'mobile_number',
                                },
                                {
                                  label: 'Venmo account',
                                  value: 'venmo_account',
                                },
                              ]}
                              onChange={(value) =>
                                setVenmoType(
                                  value as
                                    | 'mobile_number'
                                    | 'venmo_account',
                                )
                              }
                              styles={styles}
                            />

                            <TextInput
                              autoCapitalize="none"
                              autoCorrect={false}
                              keyboardType={
                                venmoType === 'mobile_number'
                                  ? 'phone-pad'
                                  : 'default'
                              }
                              onChangeText={setVenmoValue}
                              placeholder={
                                venmoType === 'mobile_number'
                                  ? 'U.S. mobile number'
                                  : 'Venmo account'
                              }
                              placeholderTextColor={
                                theme.colors.inputPlaceholder
                              }
                              style={styles.input}
                              value={venmoValue}
                            />

                            <Button
                              label={
                                savingProvider === 'venmo'
                                  ? 'Saving...'
                                  : 'Save Venmo'
                              }
                              primary
                              disabled={savingProvider !== null}
                              onPress={() => void saveProvider('venmo')}
                              styles={styles}
                              theme={theme}
                              icon={
                                savingProvider === 'venmo' ? (
                                  <ActivityIndicator
                                    color="#FFFFFF"
                                    size="small"
                                  />
                                ) : (
                                  <Smartphone
                                    color="#FFFFFF"
                                    size={17}
                                    strokeWidth={2.4}
                                  />
                                )
                              }
                            />
                          </View>
                        ) : null}
                      </ProviderCard>
                    );
                  })}
                </View>

                <View style={styles.quickSteps}>
                  <Text style={styles.quickStepsTitle}>
                    Three quick steps
                  </Text>

                  {[
                    ['1', 'Pick a way', 'Choose the option you already use.'],
                    ['2', 'Connect it', 'Finish the secure provider setup.'],
                    ['3', 'Get paid', 'Approved rewards go to your choice.'],
                  ].map(([step, title, detail]) => (
                    <View key={step} style={styles.quickStepRow}>
                      <View style={styles.quickStepNumber}>
                        <Text style={styles.quickStepNumberText}>
                          {step}
                        </Text>
                      </View>

                      <View style={styles.quickStepCopy}>
                        <Text style={styles.quickStepTitle}>{title}</Text>
                        <Text style={styles.quickStepDetail}>{detail}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.laterCard}>
                  <View style={styles.laterCopy}>
                    <Text style={styles.laterTitle}>Not ready yet?</Text>
                    <Text style={styles.laterBody}>
                      Keep earning. Finish this before your first approved reward
                      is sent.
                    </Text>
                  </View>

                  <Button
                    label={
                      savingProvider === 'set_up_later'
                        ? 'Saving...'
                        : 'Do this later'
                    }
                    disabled={savingProvider !== null}
                    fullWidth={!isTablet}
                    onPress={() =>
                      void saveProvider('set_up_later')
                    }
                    styles={styles}
                    theme={theme}
                    icon={
                      savingProvider === 'set_up_later' ? (
                        <ActivityIndicator
                          color={theme.colors.primary}
                          size="small"
                        />
                      ) : undefined
                    }
                  />
                </View>
              </>
            ) : null}

            <View style={styles.securityCard}>
              <ShieldCheck
                color={theme.colors.primary}
                size={21}
                strokeWidth={2.4}
              />

              <View style={styles.securityCopy}>
                <Text style={styles.securityTitle}>
                  Your login stays private
                </Text>
                <Text style={styles.securityBody}>
                  SitGuru never asks for your bank, PayPal, Venmo, or Stripe
                  password.
                </Text>
              </View>
            </View>

            <Button
              label="Back to rewards"
              onPress={openRewardsHome}
              styles={styles}
              theme={theme}
              icon={
                <ArrowLeft
                  color={theme.colors.primary}
                  size={17}
                  strokeWidth={2.4}
                />
              }
            />

            <View style={styles.bottomSpacer} />
          </ScrollView>
                </View>

                <SitGuruTabBar active="payouts" role="ambassador" />
              </View>
            </View>

            {isWebPreview ? <View style={styles.homeIndicator} /> : null}
          </View>
        </View>
      </SitGuruScreen>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    screen: {
      backgroundColor: theme.colors.screen,
      flex: 1,
      position: 'relative',
    },
    previewCanvas: {
      alignItems: 'center',
      justifyContent: 'flex-start',
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
      overflow: 'visible',
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
      backgroundColor: theme.colors.screen,
      borderColor: theme.colors.border,
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
    appScreen: {
      backgroundColor: theme.colors.screen,
      flex: 1,
      width: '100%',
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
      color: theme.colors.text,
      fontFamily: Fonts.bold,
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
      backgroundColor: theme.colors.text,
      borderRadius: 2,
      width: 3,
    },
    wifiText: {
      color: theme.colors.text,
      fontFamily: Fonts.bold,
      fontSize: 11,
    },
    batteryWrap: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 2,
    },
    batteryBody: {
      borderColor: theme.colors.text,
      borderRadius: 3,
      borderWidth: 1,
      height: 9,
      padding: 1,
      width: 17,
    },
    batteryFill: {
      backgroundColor: theme.colors.text,
      borderRadius: 2,
      flex: 1,
    },
    batteryCap: {
      backgroundColor: theme.colors.text,
      height: 4,
      width: 2,
    },
    page: {
      backgroundColor: theme.colors.screen,
      flex: 1,
      minHeight: 0,
      width: '100%',
    },
    pageTablet: {
      alignSelf: 'center',
      borderColor: theme.colors.border,
      borderRadius: Platform.OS === 'web' ? 28 : 0,
      borderWidth: Platform.OS === 'web' ? 1 : 0,
      maxWidth: 1040,
      overflow: 'hidden',
    },
    centerScreen: {
      alignItems: 'center',
      backgroundColor: theme.colors.screen,
      flex: 1,
      gap: 12,
      justifyContent: 'center',
      padding: 28,
    },
    centerTitle: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 24,
      textAlign: 'center',
    },
    centerBody: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.medium,
      fontSize: 14,
      lineHeight: 21,
      maxWidth: 420,
      textAlign: 'center',
    },
    header: {
      alignItems: 'center',
      backgroundColor: theme.colors.screen,
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 7,
      minHeight: 112,
      paddingBottom: 10,
      paddingHorizontal: 12,
      paddingTop: 10,
    },
    backButton: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 38,
      justifyContent: 'center',
      marginTop: 2,
      width: 38,
    },
    headerCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
      paddingRight: 2,
    },
    headerTitle: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 19,
      letterSpacing: -0.35,
      lineHeight: 23,
    },
    welcomeText: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.medium,
      fontSize: 10,
      lineHeight: 14,
    },
    wave: {
      fontSize: 10,
    },
    roleStatusRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 5,
    },
    roleStatusDot: {
      backgroundColor: theme.colors.primary,
      borderRadius: 999,
      height: 7,
      width: 7,
    },
    roleStatusText: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.medium,
      fontSize: 9,
      lineHeight: 13,
    },
    portalButton: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 4,
      justifyContent: 'center',
      marginTop: 4,
      minHeight: 30,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    portalButtonText: {
      color: theme.colors.primary,
      fontFamily: Fonts.extraBold,
      fontSize: 9,
      lineHeight: 12,
    },
    headerActions: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      flexDirection: 'row',
      gap: 5,
      paddingTop: 2,
    },
    headerIconButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    modeToggle: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.warning,
      borderRadius: 13,
      borderWidth: 1.2,
      flexDirection: 'row',
      gap: 2,
      padding: 2,
    },
    modeButton: {
      alignItems: 'center',
      borderRadius: 10,
      height: 32,
      justifyContent: 'center',
      width: 31,
    },
    modeButtonActive: {
      backgroundColor: `${theme.colors.warning}18`,
    },
    avatar: {
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.elevatedCard,
      borderRadius: 20,
      borderWidth: 2,
      height: 40,
      justifyContent: 'center',
      overflow: 'hidden',
      width: 40,
    },
    avatarImage: {
      height: '100%',
      width: '100%',
    },
    avatarText: {
      color: '#FFFFFF',
      fontFamily: Fonts.extraBold,
      fontSize: 15,
    },
    content: {
      gap: 14,
      padding: 14,
    },
    hero: {
      backgroundColor: theme.colors.heroBackground,
      borderColor: theme.colors.borderStrong,
      borderRadius: 24,
      borderWidth: 1,
      padding: 15,
    },
    heroIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 18,
      borderWidth: 1,
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    heroEyebrow: {
      color: theme.colors.primary,
      fontFamily: Fonts.extraBold,
      fontSize: 9,
      letterSpacing: 1,
      marginTop: 13,
      textTransform: 'uppercase',
    },
    heroTitle: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 28,
      letterSpacing: -0.8,
      lineHeight: 34,
      marginTop: 9,
    },
    heroBody: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.semiBold,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 7,
    },
    feedback: {
      alignItems: 'flex-start',
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      padding: 13,
    },
    feedbackSuccess: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
    },
    feedbackError: {
      backgroundColor: `${theme.colors.danger}18`,
      borderColor: theme.colors.danger,
    },
    feedbackInfo: {
      backgroundColor: `${theme.colors.info}18`,
      borderColor: theme.colors.info,
    },
    feedbackIcon: {
      paddingTop: 1,
    },
    feedbackCopy: {
      flex: 1,
      gap: 9,
      minWidth: 0,
    },
    feedbackText: {
      color: theme.colors.text,
      fontFamily: Fonts.bold,
      fontSize: 11,
      lineHeight: 17,
    },
    feedbackActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    feedbackAction: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 5,
      minHeight: 36,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    feedbackActionText: {
      color: theme.colors.primary,
      fontFamily: Fonts.extraBold,
      fontSize: 9,
    },
    readySummary: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
      borderRadius: 22,
      borderWidth: 1,
      gap: 12,
      padding: 15,
    },
    readySummaryTop: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 11,
    },
    readySummaryIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 17,
      borderWidth: 1,
      height: 48,
      justifyContent: 'center',
      width: 48,
    },
    readySummaryCopy: {
      flex: 1,
      minWidth: 0,
    },
    readySummaryEyebrow: {
      color: theme.colors.primary,
      fontFamily: Fonts.extraBold,
      fontSize: 8,
      letterSpacing: 0.9,
      textTransform: 'uppercase',
    },
    readySummaryTitle: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 18,
      marginTop: 2,
    },
    readySummaryDetail: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.bold,
      fontSize: 10,
      marginTop: 2,
    },
    readySummaryBody: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.semiBold,
      fontSize: 11,
      lineHeight: 17,
    },
    sectionHeader: {
      paddingHorizontal: 2,
      paddingTop: 4,
    },
    sectionEyebrow: {
      color: theme.colors.primary,
      fontFamily: Fonts.extraBold,
      fontSize: 8,
      letterSpacing: 0.9,
      textTransform: 'uppercase',
    },
    sectionTitle: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 23,
      lineHeight: 29,
      marginTop: 3,
    },
    sectionBody: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.medium,
      fontSize: 11,
      lineHeight: 17,
      marginTop: 3,
    },
    providerGrid: {
      gap: 12,
    },
    providerGridWide: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    providerCard: {
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 22,
      borderWidth: 1,
      overflow: 'hidden',
    },
    providerCardWide: {
      flexBasis: 290,
      flexGrow: 1,
      minWidth: 280,
    },
    providerCardSelected: {
      borderColor: theme.colors.primary,
      borderWidth: 1.5,
    },
    providerCardReady: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
    },
    providerCardHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 11,
      minHeight: 112,
      padding: 14,
    },
    providerBadge: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.border,
      borderRadius: 16,
      borderWidth: 1,
      height: 46,
      justifyContent: 'center',
      width: 46,
    },
    providerBadgeText: {
      color: theme.colors.primary,
      fontFamily: Fonts.extraBold,
      fontSize: 20,
    },
    providerCopy: {
      flex: 1,
      minWidth: 0,
    },
    providerTitleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },
    providerTitle: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 16,
      lineHeight: 21,
    },
    providerDescription: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.semiBold,
      fontSize: 10,
      lineHeight: 16,
      marginTop: 5,
    },
    providerHelper: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.bold,
      fontSize: 9,
      lineHeight: 14,
      marginTop: 3,
    },
    popularBadge: {
      alignItems: 'center',
      backgroundColor: `${theme.colors.warning}18`,
      borderColor: theme.colors.warning,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    popularBadgeText: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 8,
      textTransform: 'uppercase',
    },
    selectedBadge: {
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    selectedBadgeText: {
      color: '#FFFFFF',
      fontFamily: Fonts.extraBold,
      fontSize: 8,
      textTransform: 'uppercase',
    },
    readyBadge: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.primary,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    readyBadgeText: {
      color: theme.colors.primary,
      fontFamily: Fonts.extraBold,
      fontSize: 8,
      textTransform: 'uppercase',
    },
    providerForm: {
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      padding: 14,
    },
    providerActionBlock: {
      gap: 10,
    },
    providerFormText: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.medium,
      fontSize: 10,
      lineHeight: 16,
    },
    walletNote: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.border,
      borderRadius: 15,
      borderWidth: 1,
      padding: 11,
    },
    walletNoteTitle: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 10,
    },
    walletNoteBody: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.medium,
      fontSize: 9,
      lineHeight: 14,
      marginTop: 3,
    },
    segmented: {
      backgroundColor: theme.colors.softCard,
      borderColor: theme.colors.border,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: 'row',
      padding: 3,
    },
    segmentedButton: {
      alignItems: 'center',
      borderRadius: 11,
      flex: 1,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 8,
    },
    segmentedButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    segmentedText: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.bold,
      fontSize: 9,
      textAlign: 'center',
    },
    segmentedTextActive: {
      color: '#FFFFFF',
    },
    input: {
      backgroundColor: theme.colors.input,
      borderColor: theme.colors.border,
      borderRadius: 14,
      borderWidth: 1,
      color: theme.colors.inputText,
      fontFamily: Fonts.semiBold,
      fontSize: 12,
      minHeight: 50,
      paddingHorizontal: 13,
      paddingVertical: 11,
    },
    button: {
      alignItems: 'center',
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 7,
      justifyContent: 'center',
      minHeight: 50,
      paddingHorizontal: 16,
      paddingVertical: 11,
    },
    buttonFullWidth: {
      width: '100%',
    },
    buttonPrimary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    buttonSecondary: {
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.borderStrong,
    },
    buttonText: {
      fontFamily: Fonts.extraBold,
      fontSize: 11,
    },
    buttonTextPrimary: {
      color: '#FFFFFF',
    },
    disabled: {
      opacity: 0.55,
    },
    quickSteps: {
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 22,
      borderWidth: 1,
      gap: 10,
      padding: 15,
    },
    quickStepsTitle: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 16,
    },
    quickStepRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    quickStepNumber: {
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: 999,
      height: 30,
      justifyContent: 'center',
      width: 30,
    },
    quickStepNumberText: {
      color: '#FFFFFF',
      fontFamily: Fonts.extraBold,
      fontSize: 10,
    },
    quickStepCopy: {
      flex: 1,
      minWidth: 0,
    },
    quickStepTitle: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 11,
    },
    quickStepDetail: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.medium,
      fontSize: 9,
      lineHeight: 14,
      marginTop: 2,
    },
    laterCard: {
      alignItems: 'stretch',
      backgroundColor: theme.colors.softCard,
      borderColor: theme.colors.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 12,
      padding: 14,
    },
    laterCopy: {
      flex: 1,
    },
    laterTitle: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 14,
    },
    laterBody: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.medium,
      fontSize: 10,
      lineHeight: 16,
      marginTop: 3,
    },
    securityCard: {
      alignItems: 'flex-start',
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.border,
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      padding: 14,
    },
    securityCopy: {
      flex: 1,
      minWidth: 0,
    },
    securityTitle: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 13,
    },
    securityBody: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.medium,
      fontSize: 10,
      lineHeight: 16,
      marginTop: 3,
    },
    bottomSpacer: {
      height: 28,
    },
    placeholder: {
      color: theme.colors.inputPlaceholder,
    } as TextStyle,
  });
}