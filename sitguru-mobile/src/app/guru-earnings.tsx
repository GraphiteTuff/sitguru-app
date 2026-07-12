import { router } from 'expo-router';
import {
    AlertCircle,
    Banknote,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    ExternalLink,
    Home,
    MessageCircle,
    RefreshCw,
    ShieldCheck,
    TrendingUp,
    UserRound,
    WalletCards
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Linking,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { GuruHeaderActions } from '@/components/GuruHeaderActions';
import RoleGate from '@/components/RoleGate';
import SitGuruScreen from '@/components/SitGuruScreen';
import { AppFonts } from '@/constants/fonts';
import { useThemeMode } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
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

export default function GuruEarningsScreen() {
  const { user, profile } = useAuth();
  const themeMode = useThemeMode();
  const isDark = themeMode === 'dark';
  const isWebPreview = Platform.OS === 'web';
  const palette = getPalette(isDark);
  const styles = createStyles(isDark);

  const profileRecord = (profile ?? {}) as RecordRow;
  const [data, setData] = useState<EarningsData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openingStripe, setOpeningStripe] = useState(false);
  const [message, setMessage] = useState('');

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
        ]);

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
    [profileRecord, user?.id],
  );

  useEffect(() => {
    void loadEarnings(false);
  }, [loadEarnings]);

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

  async function openStripeFlow(mode: 'onboarding' | 'dashboard') {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to manage payouts.');
      return;
    }

    setOpeningStripe(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const endpoints =
        mode === 'onboarding'
          ? [
              '/api/stripe/connect/onboarding',
              '/api/stripe/connect/account-link',
              '/api/stripe/connect/create-account-link',
            ]
          : [
              '/api/stripe/connect/dashboard-link',
              '/api/stripe/connect/login-link',
            ];

      let stripeUrl = '';

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${SITE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              guruId: user.id,
              accountId: data.stripeAccountId || undefined,
              returnUrl: `${SITE_URL}/guru-dashboard`,
              refreshUrl: `${SITE_URL}/guru-earnings`,
            }),
          });

          if (!response.ok) continue;

          const payload = (await response.json()) as {
            url?: string;
            onboardingUrl?: string;
            dashboardUrl?: string;
            accountLink?: string;
          };

          stripeUrl =
            payload.url ||
            payload.onboardingUrl ||
            payload.dashboardUrl ||
            payload.accountLink ||
            '';

          if (stripeUrl) break;
        } catch {
          // Try the next supported SitGuru Stripe endpoint.
        }
      }

      if (!stripeUrl) {
        Alert.alert(
          'Stripe connection not available',
          'The Guru payout link endpoint is not connected in this build yet. Your current payout status is still shown safely.',
        );
        return;
      }

      const supported = await Linking.canOpenURL(stripeUrl);

      if (!supported) {
        throw new Error('Stripe URL cannot be opened.');
      }

      await Linking.openURL(stripeUrl);
    } catch {
      Alert.alert(
        'Unable to open Stripe',
        'SitGuru could not open the secure Stripe payout flow. Please try again or contact support.',
      );
    } finally {
      setOpeningStripe(false);
    }
  }

  const payoutState = getPayoutState(data);

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
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Back to Guru Dashboard"
                      onPress={() => router.push('/guru-dashboard')}
                      style={styles.headerIconButton}
                    >
                      <ChevronLeft
                        color={palette.title}
                        size={20}
                        strokeWidth={2.4}
                      />
                    </Pressable>

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
                        STRIPE PAYOUT STATUS
                      </Text>
                      <Text style={styles.payoutStatusTitle}>
                        {payoutState.title}
                      </Text>
                      <Text style={styles.payoutStatusText}>
                        {payoutState.text}
                      </Text>
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      disabled={openingStripe}
                      onPress={() =>
                        void openStripeFlow(
                          data.payoutsEnabled ? 'dashboard' : 'onboarding',
                        )
                      }
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
                    </Pressable>
                  </View>

                  {loading ? (
                    <View style={styles.loadingCard}>
                      <View style={styles.loadingLineLarge} />
                      <View style={styles.loadingLineMedium} />
                      <View style={styles.loadingLineSmall} />
                    </View>
                  ) : (
                    <>
                      <View style={styles.heroCard}>
                        <Text style={styles.heroEyebrow}>
                          EARNINGS THIS MONTH
                        </Text>
                        <Text style={styles.heroValue}>
                          {currency(data.earningsMonth)}
                        </Text>
                        <Text style={styles.heroMeta}>
                          {currency(data.earningsWeek)} earned this week
                        </Text>

                        <TrendChart values={trend} styles={styles} />

                        <View style={styles.heroMetricRow}>
                          <HeroMetric
                            label="Available"
                            value={currency(data.available)}
                            styles={styles}
                          />
                          <HeroMetric
                            label="Pending"
                            value={currency(data.pending)}
                            styles={styles}
                          />
                          <HeroMetric
                            label="Next payout"
                            value={shortDate(data.nextPayoutAt)}
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
                          label="Lifetime earnings"
                          value={currency(data.earningsLifetime)}
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
                          label="Paid out"
                          value={currency(data.paidOut)}
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
                          label="Referral rewards"
                          value={currency(data.referralRewards)}
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
                          label="Marketplace support"
                          value={currency(data.marketplaceSupport)}
                          styles={styles}
                        />
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
                          value={currency(data.available)}
                          styles={styles}
                        />
                        <BreakdownRow
                          label="Pending completion or processing"
                          value={currency(data.pending)}
                          styles={styles}
                        />
                        <BreakdownRow
                          label="Referral rewards"
                          value={currency(data.referralRewards)}
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
                              RECENT ACTIVITY
                            </Text>
                            <Text style={styles.cardTitle}>
                              Earnings history
                            </Text>
                          </View>

                          <Text style={styles.activityCount}>
                            {data.transactions.length} items
                          </Text>
                        </View>

                        {data.transactions.length ? (
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
                              Completed care, referral rewards, adjustments, and
                              payouts will appear here.
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
                        through Stripe. SitGuru does not display your full bank
                        or identity information.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actionStack}>
                    <Pressable
                      accessibilityRole="button"
                      disabled={openingStripe}
                      onPress={() =>
                        void openStripeFlow(
                          data.payoutsEnabled ? 'dashboard' : 'onboarding',
                        )
                      }
                      style={styles.primaryButton}
                    >
                      <Text style={styles.primaryButtonText}>
                        {data.payoutsEnabled
                          ? 'Manage Stripe Payout Account'
                          : 'Set Up Stripe Payouts'}
                      </Text>
                      <ExternalLink
                        color="#FFFFFF"
                        size={17}
                        strokeWidth={2.3}
                      />
                    </Pressable>

                    <Pressable
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
                    </Pressable>

                    <Pressable
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
                    </Pressable>
                  </View>
                </ScrollView>

                <View style={styles.bottomNav}>
                  <BottomNavItem
                    icon={
                      <Home
                        color={palette.navMuted}
                        size={21}
                        strokeWidth={2.3}
                      />
                    }
                    label="Dashboard"
                    onPress={() => router.push('/guru-dashboard')}
                    styles={styles}
                  />
                  <BottomNavItem
                    active
                    icon={
                      <WalletCards
                        color={palette.primary}
                        size={21}
                        strokeWidth={2.4}
                      />
                    }
                    label="Earnings"
                    onPress={() => undefined}
                    styles={styles}
                  />
                  <BottomNavItem
                    icon={
                      <CalendarDays
                        color={palette.navMuted}
                        size={21}
                        strokeWidth={2.3}
                      />
                    }
                    label="Bookings"
                    onPress={() => router.push('/guru-requests')}
                    styles={styles}
                  />
                  <BottomNavItem
                    icon={
                      <MessageCircle
                        color={palette.navMuted}
                        size={21}
                        strokeWidth={2.3}
                      />
                    }
                    label="Messages"
                    onPress={() =>
                      router.push({
                        pathname: '/messages',
                        params: { role: 'guru' },
                      })
                    }
                    styles={styles}
                  />
                  <BottomNavItem
                    icon={
                      <UserRound
                        color={palette.navMuted}
                        size={21}
                        strokeWidth={2.3}
                      />
                    }
                    label="Profile"
                    onPress={() => router.push('/guru-profile')}
                    styles={styles}
                  />
                </View>
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

function BottomNavItem({
  active = false,
  icon,
  label,
  onPress,
  styles,
}: {
  active?: boolean;
  icon: ReactNode;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={styles.navItem}
    >
      {icon}
      <Text style={active ? styles.navLabelActive : styles.navLabel}>
        {label}
      </Text>
    </Pressable>
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

function getPayoutState(data: EarningsData) {
  if (!data.connected) {
    return {
      tone: 'warning' as const,
      title: 'Payout setup needed',
      text: 'Connect Stripe before receiving Guru earnings.',
    };
  }

  if (data.actionRequired) {
    return {
      tone: 'warning' as const,
      title: 'Stripe needs attention',
      text:
        data.disabledReason ||
        'Complete the remaining verification requirements.',
    };
  }

  if (data.payoutsEnabled) {
    return {
      tone: 'success' as const,
      title: 'Payouts are active',
      text: 'Your verified Stripe account can receive Guru payouts.',
    };
  }

  return {
    tone: 'warning' as const,
    title: 'Payout setup in progress',
    text: 'Complete all Stripe onboarding and verification steps.',
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
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
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
      paddingBottom: 110,
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
    bottomNav: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 23,
      borderWidth: 1,
      bottom: 8,
      flexDirection: 'row',
      height: 72,
      left: 9,
      paddingBottom: 7,
      paddingHorizontal: 5,
      paddingTop: 7,
      position: 'absolute',
      right: 9,
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: -7 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 15,
    },
    navItem: {
      alignItems: 'center',
      flex: 1,
      gap: 3,
      justifyContent: 'center',
    },
    navLabelActive: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    navLabel: {
      color: palette.navMuted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
  });
}