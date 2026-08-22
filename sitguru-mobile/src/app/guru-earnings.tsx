import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
    AlertCircle,
    Banknote,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    Clock3,
    ExternalLink,
    RefreshCw,
    ShieldCheck,
    TrendingUp,
    Users,
    WalletCards
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import DistributionBars from '@/components/mobile/DistributionBars';
import StickyActionBar from '@/components/mobile/StickyActionBar';
import { GuruHeaderActions } from '@/components/GuruHeaderActions';
import RoleGate from '@/components/RoleGate';
import SitGuruButton from '@/components/SitGuruButton';
import SitGuruScreen from '@/components/SitGuruScreen';
import SitGuruTabBar from '@/components/SitGuruTabBar';
import { AppFonts } from '@/constants/fonts';
import { useGuruEarnings } from '@/hooks/data/useGuruEarnings';
import { useThemeMode } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { getSitGuruApiBaseUrl, sitguruApiFetch } from '@/lib/data/api';
import { formatUsd } from '@/lib/data/money';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type RecordRow = Record<string, unknown>;

type Transaction = {
  id: string;
  type: 'booking' | 'referral' | 'payout' | 'adjustment';
  label: string;
  detail: string;
  amount: number;
  createdAt: Date | null;
  status: string;
};

type EarningsData = {
  stripeAccountId: string;
  connected: boolean;
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  actionRequired: boolean;
  disabledReason: string;
  available: number;
  pending: number;
  nextPayoutAt: Date | null;
  earningsMonth: number;
  earningsWeek: number;
  earningsLifetime: number;
  paidOut: number;
  marketplaceSupport: number;
  referralRewards: number;
  transactions: Transaction[];
};

const EMPTY_DATA: EarningsData = {
  stripeAccountId: '',
  connected: false,
  detailsSubmitted: false,
  payoutsEnabled: false,
  chargesEnabled: false,
  actionRequired: false,
  disabledReason: '',
  available: 0,
  pending: 0,
  nextPayoutAt: null,
  earningsMonth: 0,
  earningsWeek: 0,
  earningsLifetime: 0,
  paidOut: 0,
  marketplaceSupport: 0,
  referralRewards: 0,
  transactions: [],
};

const PAYOUT_TABLES = [
  'guru_payout_accounts',
  'stripe_connected_accounts',
  'connected_accounts',
  'payout_accounts',
];

const TRANSACTION_TABLES = [
  'guru_earnings',
  'payout_transactions',
  'booking_payments',
  'payouts',
  'transactions',
  'bookings',
];

const OWNER_FIELDS = [
  'guru_id',
  'provider_id',
  'user_id',
  'profile_id',
  'owner_id',
  'connected_account_owner_id',
];

const SITE_URL =
  process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/+$/, '') ||
  'https://www.sitguru.com';

/** Payout routes that actually exist on the SitGuru web app. */
const PAYOUT_SETUP_PATH = '/api/payouts/setup';
const STRIPE_CONNECT_PATH = '/api/stripe/connect';
const STRIPE_ONBOARD_PATH = '/api/stripe/connect/onboard?role=guru';
const PAYPAL_ONBOARDING_PATH = '/api/paypal/onboarding';

type PayoutProvider = 'stripe' | 'paypal';

type PayoutSetupAccount = {
  provider?: string | null;
  onboardingStatus?: string | null;
  accountStatus?: string | null;
  detailsSubmitted?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  requirementsCurrentlyDue?: unknown[];
};

type PayoutSetupResponse = {
  success?: boolean;
  setup?: {
    selectedProvider?: string | null;
    setupComplete?: boolean;
    nextAction?: string | null;
    readyAccount?: PayoutSetupAccount | null;
    accounts?: PayoutSetupAccount[];
    warnings?: string[];
    messaging?: {
      headline?: string;
      readyMessage?: string;
      blockedMessage?: string;
    };
  };
  error?: string;
};

type StripeConnectResponse = {
  ok?: boolean;
  url?: string;
  error?: string;
};

type PayPalOnboardingResponse = {
  success?: boolean;
  alreadyConnected?: boolean;
  onboardingUrl?: string;
  message?: string;
  error?: string;
};

/** Payout readiness as reported by `/api/payouts/setup?role=guru`. */
type GuruPayoutStatus = {
  loaded: boolean;
  provider: string;
  setupComplete: boolean;
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
  requirements: string[];
  headline: string;
  message: string;
};

const EMPTY_PAYOUT_STATUS: GuruPayoutStatus = {
  loaded: false,
  provider: '',
  setupComplete: false,
  detailsSubmitted: false,
  payoutsEnabled: false,
  requirements: [],
  headline: '',
  message: '',
};

function providerLabel(provider: string) {
  if (provider === 'stripe') return 'Stripe';
  if (provider === 'paypal') return 'PayPal';
  return '';
}

async function loadGuruPayoutStatus(): Promise<GuruPayoutStatus> {
  const result = await sitguruApiFetch<PayoutSetupResponse>(
    `${PAYOUT_SETUP_PATH}?role=guru`,
    { method: 'GET' },
  );

  const setup = result.data?.setup;

  if (result.error || !setup) {
    return EMPTY_PAYOUT_STATUS;
  }

  const account =
    setup.readyAccount ||
    setup.accounts?.find((item) => item.payoutsEnabled) ||
    setup.accounts?.[0] ||
    null;

  const provider =
    (account?.provider ?? '') || (setup.selectedProvider ?? '') || '';

  const requirements = Array.isArray(account?.requirementsCurrentlyDue)
    ? account.requirementsCurrentlyDue
        .map((item) => (typeof item === 'string' ? item : ''))
        .filter(Boolean)
    : [];

  return {
    loaded: true,
    provider: provider === 'set_up_later' ? '' : provider,
    setupComplete: setup.setupComplete === true,
    detailsSubmitted: account?.detailsSubmitted === true,
    payoutsEnabled: account?.payoutsEnabled === true,
    requirements,
    headline: setup.messaging?.headline ?? '',
    message:
      (setup.setupComplete
        ? setup.messaging?.readyMessage
        : setup.messaging?.blockedMessage) ?? '',
  };
}

export default function GuruEarningsScreen() {
  const params = useLocalSearchParams<{ focus?: string }>();
  const focus =
    typeof params.focus === 'string' ? params.focus : '';

  const { user, profile } = useAuth();
  const themeMode = useThemeMode();
  const isDark = themeMode === 'dark';
  const isWebPreview = Platform.OS === 'web';
  const palette = getPalette(isDark);
  const styles = createStyles(isDark);
  const {
    summary,
    analytics,
    items: ledgerItems,
    payoutSetup,
    loading: ledgerLoading,
    error: ledgerError,
    refresh: refreshLedger,
  } = useGuruEarnings();

  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});

  const profileRecord = (profile ?? {}) as RecordRow;
  const [data, setData] = useState<EarningsData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openingStripe, setOpeningStripe] = useState(false);
  const [message, setMessage] = useState('');
  const [payoutStatus, setPayoutStatus] =
    useState<GuruPayoutStatus>(EMPTY_PAYOUT_STATUS);

  const apiBaseUrl = getSitGuruApiBaseUrl() || SITE_URL;

  const refreshPayoutStatus = useCallback(async () => {
    const next = await loadGuruPayoutStatus();
    setPayoutStatus(next);
    return next;
  }, []);

  const loadEarnings = useCallback(
    async (showRefresh = false) => {
      if (!user?.id || !isSupabaseConfigured) {
        setData(mapEarningsData([], [], profileRecord));
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const [payoutRows, transactionRows] = await Promise.all([
          queryRows(PAYOUT_TABLES, OWNER_FIELDS, user.id, 10),
          queryRows(TRANSACTION_TABLES, OWNER_FIELDS, user.id, 200),
          refreshPayoutStatus(),
        ]);

        await refreshLedger();

        setData(
          mapEarningsData(payoutRows, transactionRows, profileRecord),
        );
        setMessage('');
      } catch {
        setMessage(
          'Some earnings or payout details could not be loaded. Pull down to refresh.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [profileRecord, refreshLedger, refreshPayoutStatus, user?.id],
  );

  const weekNetTotal =
    summary.weekNetTotal > 0 ? summary.weekNetTotal : data.earningsWeek;
  const pendingClearedBalance =
    summary.pendingClearedBalance > 0
      ? summary.pendingClearedBalance
      : payoutSetup.pending > 0
        ? payoutSetup.pending
        : data.pending;
  const completedCareWalks = summary.completedCareWalks;
  const displayLoading = loading || ledgerLoading;

  const distributionBars = useMemo(
    () =>
      analytics.activityDistribution30d.map((bucket) => ({
        id: bucket.id,
        label: bucket.category,
        value: bucket.count,
        helper: `${formatUsd(bucket.netTotal)} · ${Math.round(bucket.share * 100)}%`,
      })),
    [analytics.activityDistribution30d],
  );

  const peakBars = useMemo(
    () =>
      analytics.peakActivityWindows.map((window) => ({
        id: window.id,
        label: window.label,
        value: window.count,
        helper: `${Math.round(window.share * 100)}% of visits`,
      })),
    [analytics.peakActivityWindows],
  );

  useEffect(() => {
    void loadEarnings(false);
  }, [loadEarnings]);

  useEffect(() => {
    if (!focus || displayLoading) return;

    const timer = setTimeout(() => {
      const y = sectionOffsets.current[focus];
      if (typeof y === 'number') {
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [displayLoading, focus]);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const refreshSoon = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void loadEarnings(false), 500);
    };

    let channel = supabase.channel(`guru-earnings-${user.id}`);

    [...PAYOUT_TABLES, ...TRANSACTION_TABLES].forEach((table) => {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        refreshSoon,
      );
    });

    channel.subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [loadEarnings, user?.id]);

  const trend = useMemo(() => {
    const monthTransactions = data.transactions
      .filter(
        (item) =>
          item.type === 'booking' &&
          item.createdAt &&
          item.createdAt.getTime() >= monthStart(new Date()).getTime(),
      )
      .sort(
        (a, b) =>
          (a.createdAt?.getTime() ?? 0) -
          (b.createdAt?.getTime() ?? 0),
      );

    const weeklyBuckets = [0, 0, 0, 0];

    monthTransactions.forEach((item) => {
      const day = item.createdAt?.getDate() ?? 1;
      const bucket = Math.min(3, Math.floor((day - 1) / 7));
      weeklyBuckets[bucket] += Math.max(0, item.amount);
    });

    return weeklyBuckets;
  }, [data.transactions]);

  /**
   * Stripe Account Links and PayPal Partner Referrals are hosted redirects,
   * so they have to complete in a browser session rather than natively.
   */
  async function openPayoutProvider(provider: PayoutProvider) {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to manage payouts.');
      return;
    }

    setOpeningStripe(true);

    try {
      // Record the choice first so payout readiness reflects it either way.
      await sitguruApiFetch(PAYOUT_SETUP_PATH, {
        method: 'PATCH',
        body: { role: 'guru', provider },
      });

      let hostedUrl = '';

      if (provider === 'stripe') {
        const connect = await sitguruApiFetch<StripeConnectResponse>(
          STRIPE_CONNECT_PATH,
          { method: 'POST', body: {} },
        );

        /*
          POST /api/stripe/connect authenticates from web cookies only, so a
          bearer-token call can be rejected. The hosted onboarding redirect
          handles its own sign-in, so it is the reliable mobile fallback.
        */
        hostedUrl =
          (typeof connect.data?.url === 'string' ? connect.data.url : '') ||
          `${apiBaseUrl}${STRIPE_ONBOARD_PATH}`;
      } else {
        const paypal = await sitguruApiFetch<PayPalOnboardingResponse>(
          PAYPAL_ONBOARDING_PATH,
          { method: 'POST', body: {} },
        );

        if (paypal.data?.alreadyConnected) {
          setMessage(
            paypal.data.message ||
              'PayPal is already connected and ready for eligible SitGuru payouts.',
          );
          await refreshPayoutStatus();
          return;
        }

        if (paypal.error || !paypal.data?.onboardingUrl) {
          Alert.alert(
            'PayPal payout setup unavailable',
            paypal.error ||
              'SitGuru could not start PayPal payout setup right now. Your current payout status is unchanged.',
          );
          return;
        }

        hostedUrl = paypal.data.onboardingUrl;
      }

      const returnUrl = Linking.createURL('/guru-earnings');
      const result = await WebBrowser.openAuthSessionAsync(
        hostedUrl,
        returnUrl,
      );

      if (result.type === 'cancel') {
        setMessage(
          `${providerLabel(provider)} payout setup was closed before finishing. Your progress is saved and you can pick it back up anytime.`,
        );
        await refreshPayoutStatus();
        return;
      }

      /*
        Neither provider returns to a mobile deep link, so a completed run
        cannot be confirmed from the browser result. Re-read payout readiness
        from SitGuru instead of assuming success.
      */
      const nextStatus = await refreshPayoutStatus();

      setMessage(
        nextStatus.payoutsEnabled
          ? `${providerLabel(nextStatus.provider) || providerLabel(provider)} payouts are confirmed and ready.`
          : `SitGuru could not confirm ${providerLabel(provider)} payout setup yet. Pull down to refresh, or reopen setup to finish any remaining steps.`,
      );
    } catch (error) {
      Alert.alert(
        `Unable to open ${providerLabel(provider)}`,
        error instanceof Error
          ? error.message
          : `SitGuru could not open the secure ${providerLabel(provider)} payout flow. Please try again or contact support.`,
      );
    } finally {
      setOpeningStripe(false);
    }
  }

  const payoutState = getPayoutState(data, payoutStatus);

  const payoutsReady = payoutStatus.loaded
    ? payoutStatus.payoutsEnabled
    : data.payoutsEnabled;

  const activeProvider: PayoutProvider =
    payoutStatus.provider === 'paypal' ? 'paypal' : 'stripe';

  return (
    <SitGuruScreen center={isWebPreview} maxWidth={620}>
      <RoleGate requiredRole="guru">
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
              <View style={styles.screen}>
                {isWebPreview ? <PhoneStatusBar styles={styles} /> : null}

                <ScrollView
                  ref={scrollRef}
                  contentContainerStyle={styles.scrollContent}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={() => void loadEarnings(true)}
                      tintColor={palette.primary}
                      colors={[palette.primary]}
                    />
                  }
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.header}>
                    <BubblePressable
                      accessibilityRole="button"
                      accessibilityLabel="Back to Guru Dashboard"
                      onPress={() => router.push('/guru-dashboard')}
                      scaleTo={0.88}
                      style={styles.headerIconButton}
                    >
                      <ChevronLeft
                        color={palette.title}
                        size={20}
                        strokeWidth={2.4}
                      />
                    </BubblePressable>

                    <View style={styles.headerCopy}>
                      <Text numberOfLines={1} style={styles.title}>Earnings & Payouts</Text>
                      <Text numberOfLines={1} style={styles.subtitle}>
                        Track care income, rewards, and Stripe payouts.
                      </Text>
                    </View>

                    <GuruHeaderActions avatarSize={38} />
                  </View>

                  {message ? (
                    <View style={styles.notice}>
                      <Text style={styles.noticeText}>{message}</Text>
                    </View>
                  ) : null}

                  <View
                    style={[
                      styles.payoutStatusCard,
                      payoutState.tone === 'warning' &&
                        styles.payoutStatusCardWarning,
                    ]}
                  >
                    <View
                      style={[
                        styles.payoutStatusIcon,
                        payoutState.tone === 'warning' &&
                          styles.payoutStatusIconWarning,
                      ]}
                    >
                      {payoutState.tone === 'success' ? (
                        <CheckCircle2
                          color={palette.primary}
                          size={22}
                          strokeWidth={2.4}
                        />
                      ) : (
                        <AlertCircle
                          color={palette.orange}
                          size={22}
                          strokeWidth={2.4}
                        />
                      )}
                    </View>

                    <View style={styles.payoutStatusCopy}>
                      <Text style={styles.payoutStatusEyebrow}>
                        PAYOUT STATUS
                      </Text>
                      <Text style={styles.payoutStatusTitle}>
                        {payoutState.title}
                      </Text>
                      <Text style={styles.payoutStatusText}>
                        {payoutState.text}
                      </Text>
                    </View>

                    <BubblePressable
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${providerLabel(activeProvider)} payout setup`}
                      disabled={openingStripe}
                      onPress={() => void openPayoutProvider(activeProvider)}
                      scaleTo={0.88}
                      style={styles.payoutStatusButton}
                    >
                      {openingStripe ? (
                        <RefreshCw
                          color="#FFFFFF"
                          size={17}
                          strokeWidth={2.3}
                        />
                      ) : (
                        <ExternalLink
                          color="#FFFFFF"
                          size={17}
                          strokeWidth={2.3}
                        />
                      )}
                    </BubblePressable>
                  </View>

                  {displayLoading ? (
                    <View style={styles.loadingCard}>
                      <View style={styles.loadingLineLarge} />
                      <View style={styles.loadingLineMedium} />
                      <View style={styles.loadingLineSmall} />
                    </View>
                  ) : (
                    <>
                      <View style={styles.heroCard}>
                        <Text style={styles.heroEyebrow}>
                          THIS WEEK&apos;S NET TOTAL
                        </Text>
                        <Text style={styles.heroValue}>
                          {formatUsd(weekNetTotal)}
                        </Text>
                        <Text style={styles.heroMeta}>
                          {formatUsd(
                            summary.monthNetTotal > 0
                              ? summary.monthNetTotal
                              : data.earningsMonth,
                          )}{' '}
                          earned this month
                        </Text>

                        <TrendChart values={trend} styles={styles} />

                        <View style={styles.heroMetricRow}>
                          <HeroMetric
                            label="Pending cleared"
                            value={formatUsd(pendingClearedBalance)}
                            styles={styles}
                          />
                          <HeroMetric
                            label="Care walks"
                            value={String(completedCareWalks)}
                            styles={styles}
                          />
                          <HeroMetric
                            label="Completed care"
                            value={String(
                              summary.completedCareTotal ||
                                data.transactions.filter(
                                  (item) => item.type === 'booking',
                                ).length,
                            )}
                            styles={styles}
                          />
                        </View>
                      </View>

                      <View style={styles.metricGrid}>
                        <MetricCard
                          icon={
                            <TrendingUp
                              color={palette.primary}
                              size={18}
                              strokeWidth={2.3}
                            />
                          }
                          label="This week's net total"
                          value={formatUsd(weekNetTotal)}
                          styles={styles}
                        />
                        <MetricCard
                          icon={
                            <Banknote
                              color={palette.primary}
                              size={18}
                              strokeWidth={2.3}
                            />
                          }
                          label="Pending cleared balance"
                          value={formatUsd(pendingClearedBalance)}
                          styles={styles}
                        />
                        <MetricCard
                          icon={
                            <CircleDollarSign
                              color={palette.primary}
                              size={18}
                              strokeWidth={2.3}
                            />
                          }
                          label="Total completed care walks"
                          value={String(completedCareWalks)}
                          styles={styles}
                        />
                        <MetricCard
                          icon={
                            <ShieldCheck
                              color={palette.primary}
                              size={18}
                              strokeWidth={2.3}
                            />
                          }
                          label="Lifetime earnings"
                          value={formatUsd(
                            summary.lifetimeNetTotal > 0
                              ? summary.lifetimeNetTotal
                              : data.earningsLifetime,
                          )}
                          styles={styles}
                        />
                      </View>

                      <View
                        style={styles.performanceCard}
                        onLayout={(event) => {
                          const y = event.nativeEvent.layout.y;
                          sectionOffsets.current['retention'] = y;
                          sectionOffsets.current['avg-payout'] = y;
                          sectionOffsets.current['peak'] = y;
                          sectionOffsets.current['distribution'] = y;
                          sectionOffsets.current['analytics'] = y;
                        }}
                      >
                        <Text style={styles.cardEyebrow}>
                          PERFORMANCE ANALYTICS
                        </Text>
                        <Text style={styles.cardTitle}>
                          Business metrics
                        </Text>
                        <Text style={styles.performanceHelper}>
                          Retention, average payout, peak windows, and 30-day
                          service mix from your completed care ledger.
                        </Text>

                        <View style={styles.performanceMetricRow}>
                          <View
                            style={[
                              styles.performanceMetric,
                              focus === 'retention'
                                ? styles.performanceMetricActive
                                : null,
                            ]}
                          >
                            <Users
                              color={palette.primary}
                              size={18}
                              strokeWidth={2.3}
                            />
                            <Text style={styles.performanceMetricLabel}>
                              Customer retention
                            </Text>
                            <Text style={styles.performanceMetricValue}>
                              {analytics.retentionRateWow != null
                                ? `${analytics.retentionRateWow}%`
                                : '—'}
                            </Text>
                            <Text style={styles.performanceMetricHelper}>
                              {analytics.retentionPriorParents > 0
                                ? `${analytics.retentionRepeatParents}/${analytics.retentionPriorParents} parents returned week over week`
                                : 'Needs two weeks of parent history'}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.performanceMetric,
                              focus === 'avg-payout'
                                ? styles.performanceMetricActive
                                : null,
                            ]}
                          >
                            <CircleDollarSign
                              color={palette.primary}
                              size={18}
                              strokeWidth={2.3}
                            />
                            <Text style={styles.performanceMetricLabel}>
                              Avg service payout
                            </Text>
                            <Text style={styles.performanceMetricValue}>
                              {formatUsd(analytics.averageServicePayout)}
                            </Text>
                            <Text style={styles.performanceMetricHelper}>
                              Across {analytics.completedCareCount} completed
                              visits
                            </Text>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.performanceSection,
                            focus === 'peak'
                              ? styles.performanceMetricActive
                              : null,
                          ]}
                        >
                          <View style={styles.performanceSectionHeader}>
                            <Clock3
                              color={palette.primary}
                              size={18}
                              strokeWidth={2.3}
                            />
                            <Text style={styles.performanceSectionTitle}>
                              Peak activity windows
                            </Text>
                          </View>
                          <Text style={styles.performanceMetricHelper}>
                            {analytics.topPeakWindow
                              ? `Highest density: ${analytics.topPeakWindow.label}`
                              : 'Peak windows appear after visit timestamps load.'}
                          </Text>
                          <DistributionBars
                            items={peakBars}
                            emptyLabel="No peak activity data yet."
                          />
                        </View>

                        <View
                          style={[
                            styles.performanceSection,
                            focus === 'distribution'
                              ? styles.performanceMetricActive
                              : null,
                          ]}
                        >
                          <View style={styles.performanceSectionHeader}>
                            <TrendingUp
                              color={palette.primary}
                              size={18}
                              strokeWidth={2.3}
                            />
                            <Text style={styles.performanceSectionTitle}>
                              30-day service mix
                            </Text>
                          </View>
                          <Text style={styles.performanceMetricHelper}>
                            Historical distribution by service category.
                          </Text>
                          <DistributionBars
                            items={distributionBars}
                            emptyLabel="No completed care in the last 30 days."
                          />
                        </View>
                      </View>

                      <View style={styles.breakdownCard}>
                        <Text style={styles.cardEyebrow}>
                          PAYOUT BREAKDOWN
                        </Text>
                        <Text style={styles.cardTitle}>
                          Where your money is
                        </Text>

                        <BreakdownRow
                          label="Available for payout"
                          value={formatUsd(
                            payoutSetup.available > 0
                              ? payoutSetup.available
                              : data.available,
                          )}
                          styles={styles}
                        />
                        <BreakdownRow
                          label="Pending cleared balance"
                          value={formatUsd(pendingClearedBalance)}
                          styles={styles}
                        />
                        <BreakdownRow
                          label="Referral rewards"
                          value={formatUsd(data.referralRewards)}
                          styles={styles}
                        />
                        <BreakdownRow
                          label="Next scheduled payout"
                          value={shortDate(data.nextPayoutAt)}
                          styles={styles}
                          last
                        />
                      </View>

                      <View style={styles.activityCard}>
                        <View style={styles.cardHeader}>
                          <View>
                            <Text style={styles.cardEyebrow}>
                              ITEMIZED CARE PAYOUTS
                            </Text>
                            <Text style={styles.cardTitle}>
                              Earnings history
                            </Text>
                          </View>

                          <Text style={styles.activityCount}>
                            {ledgerItems.length || data.transactions.length}{' '}
                            items
                          </Text>
                        </View>

                        {ledgerItems.length ? (
                          ledgerItems.slice(0, 12).map((item, index) => (
                            <TransactionRow
                              key={item.id}
                              item={{
                                id: item.id,
                                type: 'booking',
                                label: item.serviceLabel,
                                detail: [
                                  item.petName,
                                  item.parentName,
                                  item.status,
                                ]
                                  .filter(Boolean)
                                  .join(' · '),
                                amount: item.netAmount,
                                createdAt: item.completedAt,
                                status: item.status,
                              }}
                              last={
                                index ===
                                Math.min(ledgerItems.length, 12) - 1
                              }
                              palette={palette}
                              styles={styles}
                            />
                          ))
                        ) : data.transactions.length ? (
                          data.transactions.slice(0, 12).map((item, index) => (
                            <TransactionRow
                              key={item.id}
                              item={item}
                              last={
                                index ===
                                Math.min(data.transactions.length, 12) - 1
                              }
                              palette={palette}
                              styles={styles}
                            />
                          ))
                        ) : (
                          <View style={styles.emptyActivity}>
                            <Text style={styles.emptyActivityTitle}>
                              No earnings activity yet
                            </Text>
                            <Text style={styles.emptyActivityText}>
                              Completed care payouts will land here with net
                              totals for each booking.
                            </Text>
                          </View>
                        )}
                      </View>
                    </>
                  )}

                  <View style={styles.stripeCard}>
                    <View style={styles.stripeIcon}>
                      <WalletCards
                        color={palette.primary}
                        size={22}
                        strokeWidth={2.3}
                      />
                    </View>

                    <View style={styles.stripeCopy}>
                      <Text style={styles.stripeTitle}>
                        Secure payout management
                      </Text>
                      <Text style={styles.stripeText}>
                        Identity, tax, and bank details are completed directly
                        with Stripe or PayPal. SitGuru does not display your
                        full bank or identity information.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actionStack}>
                    <BubblePressable
                      accessibilityRole="button"
                      disabled={openingStripe}
                      onPress={() => void openPayoutProvider('stripe')}
                      style={styles.primaryButton}
                    >
                      <Text style={styles.primaryButtonText}>
                        {payoutsReady && activeProvider === 'stripe'
                          ? 'Update Stripe Payout Details'
                          : 'Set Up Stripe Payouts'}
                      </Text>
                      <ExternalLink
                        color="#FFFFFF"
                        size={17}
                        strokeWidth={2.3}
                      />
                    </BubblePressable>

                    <BubblePressable
                      accessibilityRole="button"
                      disabled={openingStripe}
                      onPress={() => void openPayoutProvider('paypal')}
                      style={styles.secondaryButton}
                    >
                      <Text style={styles.secondaryButtonText}>
                        {payoutsReady && activeProvider === 'paypal'
                          ? 'Update PayPal Payout Details'
                          : 'Get Paid With PayPal Instead'}
                      </Text>
                      <ExternalLink
                        color={palette.primary}
                        size={17}
                        strokeWidth={2.3}
                      />
                    </BubblePressable>

                    <BubblePressable
                      accessibilityRole="button"
                      onPress={() => router.push('/guru-referrals')}
                      style={styles.secondaryButton}
                    >
                      <Text style={styles.secondaryButtonText}>
                        View Referral Rewards
                      </Text>
                      <ChevronRight
                        color={palette.primary}
                        size={17}
                        strokeWidth={2.3}
                      />
                    </BubblePressable>

                    <BubblePressable
                      accessibilityRole="button"
                      onPress={() => router.push('/support')}
                      style={styles.secondaryButton}
                    >
                      <Text style={styles.secondaryButtonText}>
                        Get Payment or Payout Help
                      </Text>
                      <ChevronRight
                        color={palette.primary}
                        size={17}
                        strokeWidth={2.3}
                      />
                    </BubblePressable>
                  </View>
                </ScrollView>

                <StickyActionBar embedded aboveBottomNav>
                  <SitGuruButton
                    label={
                      openingStripe
                        ? `Opening ${providerLabel(activeProvider)}…`
                        : payoutsReady
                          ? `Update ${providerLabel(activeProvider)} payout details`
                          : 'Set up payouts'
                    }
                    disabled={openingStripe}
                    onPress={() => void openPayoutProvider(activeProvider)}
                  />
                  <SitGuruButton
                    label="Back to dashboard"
                    variant="secondary"
                    onPress={() => router.push('/guru-dashboard')}
                  />
                </StickyActionBar>

                <SitGuruTabBar active="home" role="guru" />
              </View>
            </View>

            {isWebPreview ? <View style={styles.homeIndicator} /> : null}
          </View>
        </View>
      </RoleGate>
    </SitGuruScreen>
  );
}

function TrendChart({
  styles,
  values,
}: {
  styles: ReturnType<typeof createStyles>;
  values: number[];
}) {
  const max = Math.max(...values, 1);

  return (
    <View style={styles.trendChart}>
      {values.map((value, index) => (
        <View key={`${index}-${value}`} style={styles.trendColumn}>
          <View
            style={[
              styles.trendBar,
              { height: Math.max(7, Math.round((value / max) * 54)) },
            ]}
          />
          <Text style={styles.trendLabel}>W{index + 1}</Text>
        </View>
      ))}
    </View>
  );
}

function HeroMetric({
  label,
  styles,
  value,
}: {
  label: string;
  styles: ReturnType<typeof createStyles>;
  value: string;
}) {
  return (
    <View style={styles.heroMetric}>
      <Text style={styles.heroMetricValue}>{value}</Text>
      <Text style={styles.heroMetricLabel}>{label}</Text>
    </View>
  );
}

function MetricCard({
  icon,
  label,
  styles,
  value,
}: {
  icon: ReactNode;
  label: string;
  styles: ReturnType<typeof createStyles>;
  value: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>{icon}</View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function BreakdownRow({
  label,
  last = false,
  styles,
  value,
}: {
  label: string;
  last?: boolean;
  styles: ReturnType<typeof createStyles>;
  value: string;
}) {
  return (
    <View style={[styles.breakdownRow, last && styles.breakdownRowLast]}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={styles.breakdownValue}>{value}</Text>
    </View>
  );
}

function TransactionRow({
  item,
  last,
  palette,
  styles,
}: {
  item: Transaction;
  last: boolean;
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
}) {
  const positive = item.amount >= 0;

  return (
    <View style={[styles.transactionRow, last && styles.transactionRowLast]}>
      <View style={styles.transactionIcon}>
        {item.type === 'payout' ? (
          <Banknote
            color={palette.primary}
            size={18}
            strokeWidth={2.3}
          />
        ) : item.type === 'referral' ? (
          <CircleDollarSign
            color={palette.primary}
            size={18}
            strokeWidth={2.3}
          />
        ) : item.type === 'adjustment' ? (
          <RefreshCw
            color={palette.primary}
            size={18}
            strokeWidth={2.3}
          />
        ) : (
          <CalendarDays
            color={palette.primary}
            size={18}
            strokeWidth={2.3}
          />
        )}
      </View>

      <View style={styles.transactionCopy}>
        <Text style={styles.transactionTitle}>{item.label}</Text>
        <Text style={styles.transactionDetail}>
          {item.detail} • {shortDate(item.createdAt)}
        </Text>
      </View>

      <View style={styles.transactionAmountWrap}>
        <Text
          style={[
            styles.transactionAmount,
            !positive && styles.transactionAmountNegative,
          ]}
        >
          {positive ? '+' : ''}
          {currency(item.amount)}
        </Text>
        <Text style={styles.transactionStatus}>{item.status}</Text>
      </View>
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
        <View style={styles.batteryBody}>
          <View style={styles.batteryFill} />
        </View>
      </View>
    </View>
  );
}

async function queryRows(
  tables: string[],
  ownerFields: string[],
  userId: string,
  limit: number,
) {
  const rows: RecordRow[] = [];

  for (const table of tables) {
    for (const ownerField of ownerFields) {
      const result = await supabase
        .from(table)
        .select('*')
        .eq(ownerField, userId)
        .limit(limit);

      if (!result.error && result.data?.length) {
        rows.push(...(result.data as RecordRow[]));
        break;
      }
    }
  }

  return rows;
}

function mapEarningsData(
  payoutRows: RecordRow[],
  transactionRows: RecordRow[],
  profile: RecordRow,
): EarningsData {
  const payoutRecord = { ...profile, ...(payoutRows[0] ?? {}) };

  const stripeAccountId = firstString(payoutRecord, [
    'stripe_account_id',
    'stripe_connected_account_id',
    'connected_account_id',
  ]);

  const detailsSubmitted = firstBoolean(payoutRecord, [
    'stripe_details_submitted',
    'details_submitted',
  ]);

  const payoutsEnabled = firstBoolean(payoutRecord, [
    'stripe_payouts_enabled',
    'payouts_enabled',
  ]);

  const chargesEnabled = firstBoolean(payoutRecord, [
    'stripe_charges_enabled',
    'charges_enabled',
  ]);

  const disabledReason = firstString(payoutRecord, [
    'stripe_disabled_reason',
    'disabled_reason',
    'requirements_due',
  ]);

  const transactions = transactionRows
    .map((row, index) => mapTransaction(row, index))
    .filter((item): item is Transaction => Boolean(item))
    .sort(
      (a, b) =>
        (b.createdAt?.getTime() ?? 0) -
        (a.createdAt?.getTime() ?? 0),
    );

  const now = new Date();
  const month = monthStart(now);
  const week = weekStart(now);

  const bookingIncome = transactions.filter(
    (item) => item.type === 'booking' && item.amount > 0,
  );

  const referralIncome = transactions.filter(
    (item) => item.type === 'referral' && item.amount > 0,
  );

  const paidOutTransactions = transactions.filter(
    (item) => item.type === 'payout' && item.amount > 0,
  );

  const feeTransactions = transactions.filter(
    (item) =>
      item.type === 'adjustment' &&
      item.label.toLowerCase().includes('fee'),
  );

  return {
    stripeAccountId,
    connected: Boolean(stripeAccountId),
    detailsSubmitted,
    payoutsEnabled,
    chargesEnabled,
    actionRequired:
      Boolean(stripeAccountId) &&
      (!detailsSubmitted ||
        !payoutsEnabled ||
        !chargesEnabled ||
        Boolean(disabledReason)),
    disabledReason,
    available:
      firstNumber(payoutRecord, [
        'available_balance',
        'available_amount',
        'payout_available',
      ]) ?? 0,
    pending:
      firstNumber(payoutRecord, [
        'pending_balance',
        'pending_amount',
        'payout_pending',
      ]) ?? 0,
    nextPayoutAt: firstDate(payoutRecord, [
      'next_payout_at',
      'next_payout_date',
      'scheduled_payout_at',
    ]),
    earningsMonth: bookingIncome
      .filter(
        (item) =>
          item.createdAt &&
          item.createdAt.getTime() >= month.getTime(),
      )
      .reduce((total, item) => total + item.amount, 0),
    earningsWeek: bookingIncome
      .filter(
        (item) =>
          item.createdAt &&
          item.createdAt.getTime() >= week.getTime(),
      )
      .reduce((total, item) => total + item.amount, 0),
    earningsLifetime: bookingIncome.reduce(
      (total, item) => total + item.amount,
      0,
    ),
    paidOut: paidOutTransactions.reduce(
      (total, item) => total + item.amount,
      0,
    ),
    marketplaceSupport: Math.abs(
      feeTransactions.reduce((total, item) => total + item.amount, 0),
    ),
    referralRewards: referralIncome.reduce(
      (total, item) => total + item.amount,
      0,
    ),
    transactions,
  };
}

function mapTransaction(
  row: RecordRow,
  index: number,
): Transaction | null {
  const rawType = firstString(row, [
    'transaction_type',
    'type',
    'category',
    'source_type',
  ]).toLowerCase();

  const status =
    firstString(row, ['status', 'payment_status', 'payout_status']) ||
    'Recorded';

  const amount =
    firstNumber(row, [
      'guru_earnings',
      'net_amount',
      'amount',
      'payout_amount',
      'reward_amount',
      'fee_amount',
    ]) ?? 0;

  const type: Transaction['type'] = rawType.includes('referral')
    ? 'referral'
    : rawType.includes('payout')
      ? 'payout'
      : rawType.includes('adjust') ||
          rawType.includes('refund') ||
          rawType.includes('fee')
        ? 'adjustment'
        : 'booking';

  const label =
    firstString(row, [
      'label',
      'description',
      'service_name',
      'service_type',
      'title',
    ]) ||
    (type === 'booking'
      ? 'Care booking'
      : type === 'referral'
        ? 'Guru referral reward'
        : type === 'payout'
          ? 'Stripe payout'
          : 'Account adjustment');

  const detail =
    firstString(row, [
      'pet_name',
      'booking_reference',
      'payout_reference',
      'notes',
      'reference',
    ]) || status;

  return {
    id:
      firstString(row, [
        'id',
        'transaction_id',
        'payout_id',
        'booking_id',
      ]) || `transaction-${index}`,
    type,
    label,
    detail,
    amount,
    createdAt: firstDate(row, [
      'created_at',
      'paid_at',
      'completed_at',
      'updated_at',
      'booking_date',
    ]),
    status,
  };
}

/** SitGuru's payout API is authoritative; table scans are only a fallback. */
function getPayoutState(data: EarningsData, status: GuruPayoutStatus) {
  if (status.loaded) {
    const label = providerLabel(status.provider) || 'a payout provider';

    if (status.payoutsEnabled) {
      return {
        tone: 'success' as const,
        title: 'Payouts are active',
        text:
          status.message ||
          `Your verified ${label} account can receive Guru payouts.`,
      };
    }

    if (!status.provider) {
      return {
        tone: 'warning' as const,
        title: 'Choose how you get paid',
        text:
          status.message ||
          'Pick Stripe or PayPal before your first paid SitGuru booking.',
      };
    }

    return {
      tone: 'warning' as const,
      title: `${label} setup in progress`,
      text: status.requirements.length
        ? `Still needed: ${status.requirements
            .map((item) => item.replace(/_/g, ' '))
            .join(', ')}.`
        : status.message ||
          `Finish the remaining ${label} steps before payouts can be released.`,
    };
  }

  if (!data.connected) {
    return {
      tone: 'warning' as const,
      title: 'Payout setup needed',
      text: 'Connect Stripe or PayPal before receiving Guru earnings.',
    };
  }

  if (data.actionRequired) {
    return {
      tone: 'warning' as const,
      title: 'Payout account needs attention',
      text:
        data.disabledReason ||
        'Complete the remaining verification requirements.',
    };
  }

  if (data.payoutsEnabled) {
    return {
      tone: 'success' as const,
      title: 'Payouts are active',
      text: 'Your verified payout account can receive Guru payouts.',
    };
  }

  return {
    tone: 'warning' as const,
    title: 'Payout setup in progress',
    text: 'Complete all payout onboarding and verification steps.',
  };
}

function firstString(record: RecordRow, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function firstNumber(record: RecordRow, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function firstBoolean(record: RecordRow, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') return value;
    if (value === true || value === 'true' || value === 1 || value === '1') {
      return true;
    }
  }
  return false;
}

function firstDate(record: RecordRow, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date;
    }
  }
  return null;
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function weekStart(date: Date) {
  const result = new Date(date);
  result.setDate(result.getDate() - result.getDay());
  result.setHours(0, 0, 0, 0);
  return result;
}

function currency(value: number) {
  return formatUsd(value);
}

function shortDate(date: Date | null) {
  if (!date) return 'Not scheduled';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function getPalette(isDark: boolean) {
  return {
    background: isDark ? '#06140F' : '#FFF9F1',
    surface: isDark ? '#0B2118' : '#FFFEFA',
    surfaceSoft: isDark ? '#102D21' : '#FFF6E9',
    border: isDark ? '#234B38' : '#EADDCB',
    title: isDark ? '#FFF5E8' : '#123F31',
    text: isDark ? '#E8EEE9' : '#27483E',
    muted: isDark ? '#9DB0A5' : '#738078',
    primary: isDark ? '#39D982' : '#087449',
    primarySoft: isDark ? '#123E2A' : '#E4F5E9',
    orange: '#F15A3A',
    navMuted: isDark ? '#9BAAA1' : '#748079',
    shadow: '#000000',
  };
}

function createStyles(isDark: boolean) {
  const palette = getPalette(isDark);

  return StyleSheet.create({
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
      backgroundColor: palette.background,
      borderColor: palette.border,
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
    screen: { backgroundColor: palette.background, flex: 1 },
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
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 12,
    },
    statusIcons: { alignItems: 'center', flexDirection: 'row', gap: 6 },
    signalBars: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      gap: 2,
    },
    signalBar: {
      backgroundColor: palette.title,
      borderRadius: 2,
      width: 3,
    },
    wifiText: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    batteryBody: {
      borderColor: palette.title,
      borderRadius: 3,
      borderWidth: 1,
      height: 9,
      padding: 1,
      width: 17,
    },
    batteryFill: {
      backgroundColor: palette.title,
      borderRadius: 2,
      flex: 1,
    },
    scrollContent: {
      gap: 13,
      paddingBottom: 16,
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 9,
    },
    headerCopy: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 20,
      letterSpacing: -0.4,
    },
    subtitle: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      marginTop: 2,
    },
    headerIconButton: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    modeToggle: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: isDark ? '#B9831B' : '#F2822E',
      borderRadius: 13,
      borderWidth: 1.2,
      flexDirection: 'row',
      gap: 2,
      padding: 2,
    },
    modeButton: {
      alignItems: 'center',
      borderRadius: 10,
      height: 28,
      justifyContent: 'center',
      width: 31,
    },
    modeButtonActive: {
      backgroundColor: isDark
        ? 'rgba(226,170,45,0.18)'
        : '#FFF4D8',
    },
    notice: {
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.border,
      borderRadius: 14,
      borderWidth: 1,
      padding: 10,
    },
    noticeText: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 9,
    },
    payoutStatusCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      padding: 12,
    },
    payoutStatusCardWarning: {
      borderColor: isDark ? '#75513D' : '#F1C8AD',
    },
    payoutStatusIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 13,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    payoutStatusIconWarning: {
      backgroundColor: isDark ? '#3A251D' : '#FFF0E7',
    },
    payoutStatusCopy: { flex: 1, gap: 2 },
    payoutStatusEyebrow: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 7,
      letterSpacing: 0.7,
    },
    payoutStatusTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
    },
    payoutStatusText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
    },
    payoutStatusButton: {
      alignItems: 'center',
      backgroundColor: palette.primary,
      borderRadius: 999,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    loadingCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 8,
      padding: 14,
    },
    loadingLineLarge: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 11,
      width: '54%',
    },
    loadingLineMedium: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 8,
      width: '82%',
    },
    loadingLineSmall: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 8,
      width: '38%',
    },
    heroCard: {
      backgroundColor: isDark ? '#087A4C' : '#087F50',
      borderRadius: 22,
      gap: 8,
      padding: 15,
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 9 },
      shadowOpacity: isDark ? 0.26 : 0.13,
      shadowRadius: 17,
    },
    heroEyebrow: {
      color: 'rgba(255,255,255,0.76)',
      fontFamily: AppFonts.bold,
      fontSize: 7,
      letterSpacing: 0.75,
    },
    heroValue: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 31,
      letterSpacing: -0.6,
    },
    heroMeta: {
      color: 'rgba(255,255,255,0.84)',
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
    trendChart: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      gap: 12,
      height: 70,
      marginTop: 3,
    },
    trendColumn: {
      alignItems: 'center',
      flex: 1,
      gap: 3,
      justifyContent: 'flex-end',
    },
    trendBar: {
      backgroundColor: 'rgba(255,255,255,0.85)',
      borderRadius: 999,
      width: '52%',
    },
    trendLabel: {
      color: 'rgba(255,255,255,0.66)',
      fontFamily: AppFonts.bold,
      fontSize: 6,
    },
    heroMetricRow: {
      borderTopColor: 'rgba(255,255,255,0.20)',
      borderTopWidth: 1,
      flexDirection: 'row',
      paddingTop: 10,
    },
    heroMetric: { flex: 1, gap: 2 },
    heroMetricValue: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
    },
    heroMetricLabel: {
      color: 'rgba(255,255,255,0.68)',
      fontFamily: AppFonts.medium,
      fontSize: 6,
    },
    metricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    metricCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 17,
      borderWidth: 1,
      flexBasis: '47%',
      flexGrow: 1,
      gap: 3,
      minHeight: 93,
      padding: 11,
    },
    metricIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 10,
      height: 32,
      justifyContent: 'center',
      width: 32,
    },
    metricValue: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 16,
      marginTop: 4,
    },
    metricLabel: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
    breakdownCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 4,
      padding: 13,
    },
    performanceCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 14,
      padding: 13,
    },
    performanceHelper: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 14,
      marginTop: -4,
    },
    performanceMetricRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    performanceMetric: {
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.border,
      borderRadius: 16,
      borderWidth: 1,
      flexBasis: '47%',
      flexGrow: 1,
      gap: 6,
      minWidth: 140,
      padding: 12,
    },
    performanceMetricActive: {
      borderColor: palette.primary,
      borderWidth: 1.5,
    },
    performanceMetricLabel: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 8,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    performanceMetricValue: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 18,
    },
    performanceMetricHelper: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
    },
    performanceSection: {
      borderColor: palette.border,
      borderRadius: 16,
      borderWidth: 1,
      gap: 10,
      padding: 12,
    },
    performanceSectionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    performanceSectionTitle: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 12,
    },
    cardEyebrow: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 7,
      letterSpacing: 0.75,
    },
    cardTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 14,
      marginBottom: 5,
      marginTop: 2,
    },
    breakdownRow: {
      alignItems: 'center',
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 39,
    },
    breakdownRowLast: { borderBottomWidth: 0 },
    breakdownLabel: {
      color: palette.text,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
    breakdownValue: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    activityCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      overflow: 'hidden',
      paddingTop: 13,
    },
    cardHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 13,
      paddingBottom: 7,
    },
    activityCount: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
    transactionRow: {
      alignItems: 'center',
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 9,
      paddingHorizontal: 13,
      paddingVertical: 10,
    },
    transactionRowLast: { borderBottomWidth: 0 },
    transactionIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 11,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    transactionCopy: { flex: 1, gap: 2 },
    transactionTitle: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 10,
    },
    transactionDetail: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 7,
    },
    transactionAmountWrap: {
      alignItems: 'flex-end',
      gap: 2,
    },
    transactionAmount: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
    },
    transactionAmountNegative: { color: palette.orange },
    transactionStatus: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 7,
    },
    emptyActivity: {
      gap: 4,
      paddingHorizontal: 13,
      paddingVertical: 22,
    },
    emptyActivityTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
      textAlign: 'center',
    },
    emptyActivityText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
      textAlign: 'center',
    },
    stripeCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      padding: 12,
    },
    stripeIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 13,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    stripeCopy: { flex: 1, gap: 2 },
    stripeTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
    },
    stripeText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
    },
    actionStack: { gap: 8 },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: palette.primary,
      borderRadius: 999,
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 43,
      paddingHorizontal: 14,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    secondaryButton: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.primary,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 43,
      paddingHorizontal: 14,
    },
    secondaryButtonText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
  });
}