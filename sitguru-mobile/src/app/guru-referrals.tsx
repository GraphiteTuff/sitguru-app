import { router } from 'expo-router';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Copy,
    Gift,
    Home,
    Link2,
    MessageCircle,
    QrCode,
    Share2,
    TrendingUp,
    UserRound,
    Users,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    Share,
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

type ReferralActivity = {
  id: string;
  name: string;
  createdAt: Date | null;
  status: string;
  reward: number;
  rewardStatus: string;
};

type ReferralData = {
  clicks: number;
  signups: number;
  applications: number;
  approved: number;
  qualified: number;
  completedFirstBooking: number;
  earned: number;
  pending: number;
  activities: ReferralActivity[];
};

const EMPTY_DATA: ReferralData = {
  clicks: 0,
  signups: 0,
  applications: 0,
  approved: 0,
  qualified: 0,
  completedFirstBooking: 0,
  earned: 0,
  pending: 0,
  activities: [],
};

const TABLES = [
  'guru_referrals',
  'referrals',
  'referral_performance',
  'referral_stats',
];

const OWNER_FIELDS = ['referrer_id', 'guru_id', 'user_id', 'owner_id'];

export default function GuruReferralsScreen() {
  const { user, profile } = useAuth();
  const themeMode = useThemeMode();
  const isDark = themeMode === 'dark';
  const isWebPreview = Platform.OS === 'web';
  const palette = getPalette(isDark);
  const styles = createStyles(isDark);

  const profileRecord = (profile ?? {}) as RecordRow;
  const [data, setData] = useState<ReferralData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  const referralCode =
    firstString(profileRecord, [
      'guru_referral_code',
      'referral_code',
      'invite_code',
    ]) || buildFallbackCode(profileRecord, user?.email);

  const referralLink =
    firstString(profileRecord, [
      'guru_referral_url',
      'referral_url',
      'referral_link',
    ]) || `https://www.sitguru.com/signup?ref=${encodeURIComponent(referralCode)}`;

  const loadReferrals = useCallback(
    async (showRefresh = false) => {
      if (!user?.id || !isSupabaseConfigured) {
        setData(EMPTY_DATA);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const rows = await queryRows(user.id);
        setData(mapReferralData(rows));
        setMessage('');
      } catch {
        setMessage(
          'Referral activity could not be loaded. Pull down to refresh.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    void loadReferrals(false);
  }, [loadReferrals]);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const refreshSoon = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void loadReferrals(false), 450);
    };

    let channel = supabase.channel(`guru-referrals-${user.id}`);

    TABLES.forEach((table) => {
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
  }, [loadReferrals, user?.id]);

  const conversionRate = data.clicks
    ? Math.round((data.signups / data.clicks) * 100)
    : 0;

  const funnel = useMemo(
    () => [
      { label: 'Link clicks', value: data.clicks },
      { label: 'Signups', value: data.signups },
      { label: 'Applications', value: data.applications },
      { label: 'Approved Gurus', value: data.approved },
      { label: 'Qualified', value: data.qualified },
      {
        label: 'First bookings',
        value: data.completedFirstBooking,
      },
    ],
    [data],
  );

  async function copyValue(value: string, label: string) {
    try {
      const clipboard = (
        globalThis as unknown as {
          navigator?: {
            clipboard?: {
              writeText: (text: string) => Promise<void>;
            };
          };
        }
      ).navigator?.clipboard;

      if (Platform.OS === 'web' && clipboard) {
        await clipboard.writeText(value);
        Alert.alert('Copied', `${label} copied to your clipboard.`);
        return;
      }

      await Share.share({ message: value });
    } catch {
      Alert.alert(
        'Unable to share',
        'SitGuru could not open the sharing options on this device.',
      );
    }
  }

  async function shareReferral() {
    try {
      await Share.share({
        title: 'Join me on SitGuru',
        message: `Become a SitGuru Pet Care Guru with my referral code ${referralCode}: ${referralLink}`,
        url: referralLink,
      });
    } catch {
      Alert.alert(
        'Unable to share',
        'SitGuru could not open the sharing options on this device.',
      );
    }
  }

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
                      onRefresh={() => void loadReferrals(true)}
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
                      <Text style={styles.title}>Referrals & Rewards</Text>
                      <Text style={styles.subtitle}>
                        Share SitGuru and track your Guru growth.
                      </Text>
                    </View>

                    <GuruHeaderActions />
                  </View>

                  {message ? (
                    <View style={styles.notice}>
                      <Text style={styles.noticeText}>{message}</Text>
                    </View>
                  ) : null}

                  <View style={styles.heroCard}>
                    <View style={styles.heroTop}>
                      <View style={styles.heroIcon}>
                        <Gift color="#FFFFFF" size={24} strokeWidth={2.4} />
                      </View>

                      <View style={styles.heroCopy}>
                        <Text style={styles.heroEyebrow}>
                          YOUR GURU REFERRAL CODE
                        </Text>
                        <Text style={styles.heroCode} selectable>
                          {referralCode}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.heroText}>
                      Invite trusted pet care professionals to build their own
                      SitGuru business.
                    </Text>

                    <View style={styles.heroActions}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() =>
                          void copyValue(referralCode, 'Referral code')
                        }
                        style={styles.heroSecondaryButton}
                      >
                        <Copy color="#FFFFFF" size={16} strokeWidth={2.3} />
                        <Text style={styles.heroSecondaryText}>Copy Code</Text>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        onPress={() => void shareReferral()}
                        style={styles.heroPrimaryButton}
                      >
                        <Share2
                          color={palette.primary}
                          size={16}
                          strokeWidth={2.3}
                        />
                        <Text style={styles.heroPrimaryText}>Share Link</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.linkCard}>
                    <View style={styles.linkIcon}>
                      <Link2
                        color={palette.primary}
                        size={19}
                        strokeWidth={2.3}
                      />
                    </View>

                    <View style={styles.linkCopy}>
                      <Text style={styles.linkLabel}>Your referral link</Text>
                      <Text style={styles.linkValue} numberOfLines={1} selectable>
                        {referralLink}
                      </Text>
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Copy referral link"
                      onPress={() =>
                        void copyValue(referralLink, 'Referral link')
                      }
                      style={styles.copyButton}
                    >
                      <Copy
                        color={palette.primary}
                        size={17}
                        strokeWidth={2.3}
                      />
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
                      <View style={styles.metricGrid}>
                        <MetricCard
                          icon={
                            <TrendingUp
                              color={palette.primary}
                              size={18}
                              strokeWidth={2.3}
                            />
                          }
                          label="Link clicks"
                          value={String(data.clicks)}
                          styles={styles}
                        />
                        <MetricCard
                          icon={
                            <Users
                              color={palette.primary}
                              size={18}
                              strokeWidth={2.3}
                            />
                          }
                          label="Signups"
                          value={String(data.signups)}
                          styles={styles}
                        />
                        <MetricCard
                          icon={
                            <UserRound
                              color={palette.primary}
                              size={18}
                              strokeWidth={2.3}
                            />
                          }
                          label="Qualified"
                          value={String(data.qualified)}
                          styles={styles}
                        />
                        <MetricCard
                          icon={
                            <Gift
                              color={palette.primary}
                              size={18}
                              strokeWidth={2.3}
                            />
                          }
                          label="Earned"
                          value={currency(data.earned)}
                          styles={styles}
                        />
                      </View>

                      <View style={styles.performanceCard}>
                        <View style={styles.cardHeader}>
                          <View>
                            <Text style={styles.cardEyebrow}>
                              REFERRAL PERFORMANCE
                            </Text>
                            <Text style={styles.cardTitle}>
                              Your conversion funnel
                            </Text>
                          </View>

                          <View style={styles.conversionPill}>
                            <Text style={styles.conversionValue}>
                              {conversionRate}%
                            </Text>
                            <Text style={styles.conversionLabel}>
                              click to signup
                            </Text>
                          </View>
                        </View>

                        <Funnel
                          items={funnel}
                          palette={palette}
                          styles={styles}
                        />
                      </View>

                      <View style={styles.rewardCard}>
                        <View>
                          <Text style={styles.cardEyebrow}>REWARDS</Text>
                          <Text style={styles.cardTitle}>
                            Referral earnings
                          </Text>
                        </View>

                        <View style={styles.rewardRows}>
                          <RewardRow
                            label="Earned rewards"
                            value={currency(data.earned)}
                            styles={styles}
                          />
                          <RewardRow
                            label="Pending rewards"
                            value={currency(data.pending)}
                            styles={styles}
                          />
                          <RewardRow
                            label="Qualified Gurus"
                            value={String(data.qualified)}
                            styles={styles}
                          />
                        </View>

                        <Pressable
                          accessibilityRole="button"
                          onPress={() => router.push('/guru-earnings')}
                          style={styles.primaryButton}
                        >
                          <Text style={styles.primaryButtonText}>
                            View Earnings & Payouts
                          </Text>
                          <ChevronRight
                            color="#FFFFFF"
                            size={17}
                            strokeWidth={2.3}
                          />
                        </Pressable>
                      </View>

                      <View style={styles.activityCard}>
                        <View style={styles.cardHeader}>
                          <View>
                            <Text style={styles.cardEyebrow}>
                              RECENT ACTIVITY
                            </Text>
                            <Text style={styles.cardTitle}>
                              Referral progress
                            </Text>
                          </View>
                        </View>

                        {data.activities.length ? (
                          data.activities.slice(0, 8).map((activity, index) => (
                            <ActivityRow
                              key={activity.id}
                              activity={activity}
                              last={index === Math.min(data.activities.length, 8) - 1}
                              styles={styles}
                            />
                          ))
                        ) : (
                          <View style={styles.emptyActivity}>
                            <Text style={styles.emptyActivityTitle}>
                              No referral activity yet
                            </Text>
                            <Text style={styles.emptyActivityText}>
                              Share your code or link to start building your
                              Guru referral network.
                            </Text>
                          </View>
                        )}
                      </View>
                    </>
                  )}

                  <View style={styles.shareToolsCard}>
                    <Text style={styles.cardEyebrow}>SHARE TOOLS</Text>
                    <Text style={styles.cardTitle}>
                      Make inviting easy
                    </Text>

                    <View style={styles.shareToolsGrid}>
                      <ShareTool
                        icon={
                          <Share2
                            color={palette.primary}
                            size={20}
                            strokeWidth={2.3}
                          />
                        }
                        label="Share"
                        onPress={() => void shareReferral()}
                        styles={styles}
                      />
                      <ShareTool
                        icon={
                          <Copy
                            color={palette.primary}
                            size={20}
                            strokeWidth={2.3}
                          />
                        }
                        label="Copy link"
                        onPress={() =>
                          void copyValue(referralLink, 'Referral link')
                        }
                        styles={styles}
                      />
                      <ShareTool
                        icon={
                          <QrCode
                            color={palette.primary}
                            size={20}
                            strokeWidth={2.3}
                          />
                        }
                        label="QR code"
                        onPress={() =>
                          Alert.alert(
                            'Referral QR code',
                            `Use this referral link to create or display your QR code:\n\n${referralLink}`,
                          )
                        }
                        styles={styles}
                      />
                    </View>
                  </View>

                  <View style={styles.rulesCard}>
                    <Text style={styles.cardEyebrow}>PROGRAM GUIDELINES</Text>
                    <Text style={styles.cardTitle}>How rewards qualify</Text>

                    {[
                      'The referred person must join through your code or link.',
                      'A Guru must complete required profile and approval steps.',
                      'Qualification may require a completed first paid booking.',
                      'Self-referrals, duplicate accounts, and fraudulent activity do not qualify.',
                      'Pending rewards are paid only after all program requirements are met.',
                    ].map((rule, index) => (
                      <View key={rule} style={styles.ruleRow}>
                        <View style={styles.ruleNumber}>
                          <Text style={styles.ruleNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.ruleText}>{rule}</Text>
                      </View>
                    ))}

                    <Pressable
                      accessibilityRole="button"
                      onPress={() => router.push('/guru-success-center')}
                      style={styles.secondaryButton}
                    >
                      <Text style={styles.secondaryButtonText}>
                        Learn referral best practices
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
                    icon={
                      <Gift
                        color={palette.primary}
                        size={21}
                        strokeWidth={2.4}
                      />
                    }
                    active
                    label="Referrals"
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

function Funnel({
  items,
  palette,
  styles,
}: {
  items: Array<{ label: string; value: number }>;
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <View style={styles.funnel}>
      {items.map((item) => {
        const width = `${Math.max(12, Math.round((item.value / max) * 100))}%`;

        return (
          <View key={item.label} style={styles.funnelRow}>
            <View style={styles.funnelLabelRow}>
              <Text style={styles.funnelLabel}>{item.label}</Text>
              <Text style={styles.funnelValue}>{item.value}</Text>
            </View>

            <View style={styles.funnelTrack}>
              <View
                style={[
                  styles.funnelFill,
                  { width: width as `${number}%` },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function RewardRow({
  label,
  styles,
  value,
}: {
  label: string;
  styles: ReturnType<typeof createStyles>;
  value: string;
}) {
  return (
    <View style={styles.rewardRow}>
      <Text style={styles.rewardLabel}>{label}</Text>
      <Text style={styles.rewardValue}>{value}</Text>
    </View>
  );
}

function ActivityRow({
  activity,
  last,
  styles,
}: {
  activity: ReferralActivity;
  last: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={[styles.activityRow, last && styles.activityRowLast]}>
      <View style={styles.activityAvatar}>
        <Text style={styles.activityAvatarText}>
          {initials(activity.name || 'Guru')}
        </Text>
      </View>

      <View style={styles.activityCopy}>
        <Text style={styles.activityName}>{activity.name}</Text>
        <Text style={styles.activityMeta}>
          {activity.status} • {shortDate(activity.createdAt)}
        </Text>
      </View>

      <View style={styles.activityReward}>
        <Text style={styles.activityRewardValue}>
          {activity.reward ? currency(activity.reward) : '—'}
        </Text>
        <Text style={styles.activityRewardStatus}>
          {activity.rewardStatus}
        </Text>
      </View>
    </View>
  );
}

function ShareTool({
  icon,
  label,
  onPress,
  styles,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.shareTool}
    >
      <View style={styles.shareToolIcon}>{icon}</View>
      <Text style={styles.shareToolLabel}>{label}</Text>
    </Pressable>
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

async function queryRows(userId: string) {
  const rows: RecordRow[] = [];

  for (const table of TABLES) {
    for (const ownerField of OWNER_FIELDS) {
      const result = await supabase
        .from(table)
        .select('*')
        .eq(ownerField, userId)
        .limit(150);

      if (!result.error && result.data?.length) {
        rows.push(...(result.data as RecordRow[]));
        break;
      }
    }
  }

  return rows;
}

function mapReferralData(rows: RecordRow[]): ReferralData {
  const activities = rows
    .map((row, index) => ({
      id: firstString(row, ['id', 'referral_id']) || `referral-${index}`,
      name:
        firstString(row, [
          'referred_name',
          'full_name',
          'name',
          'referred_email',
        ]) || 'New Guru referral',
      createdAt: firstDate(row, [
        'created_at',
        'signup_at',
        'referred_at',
      ]),
      status:
        firstString(row, [
          'qualification_status',
          'status',
          'referral_status',
        ]) || 'Started',
      reward:
        firstNumber(row, [
          'reward_amount',
          'earned_amount',
          'reward_earned',
        ]) ?? 0,
      rewardStatus:
        firstString(row, [
          'reward_status',
          'payout_status',
          'payment_status',
        ]) || 'Pending',
    }))
    .sort(
      (a, b) =>
        (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
    );

  const eventCount = (row: RecordRow, eventNames: string[]) => {
    const event = firstString(row, ['event_type', 'type']).toLowerCase();
    return eventNames.some((name) => event.includes(name)) ? 1 : 0;
  };

  return {
    clicks: sumMetric(rows, ['clicks', 'link_clicks', 'click_count'], [
      'click',
    ]),
    signups: sumMetric(rows, ['signups', 'signup_count'], ['signup']),
    applications: sumMetric(
      rows,
      ['applications', 'application_count', 'applications_started'],
      ['application'],
    ),
    approved: sumMetric(
      rows,
      ['approved', 'approved_count'],
      ['approved', 'approval'],
    ),
    qualified: rows.reduce(
      (total, row) =>
        total +
        Math.max(
          0,
          Math.round(
            firstNumber(row, [
              'qualified_gurus',
              'qualified_count',
            ]) ??
              (firstBoolean(row, [
                'is_qualified',
                'qualified',
              ])
                ? 1
                : eventCount(row, ['qualified'])),
          ),
        ),
      0,
    ),
    completedFirstBooking: sumMetric(
      rows,
      ['first_bookings', 'completed_first_booking_count'],
      ['first_booking'],
    ),
    earned: rows.reduce(
      (total, row) =>
        total +
        Math.max(
          0,
          firstNumber(row, [
            'reward_earned',
            'earned_amount',
            'reward_amount',
          ]) ?? 0,
        ),
      0,
    ),
    pending: rows.reduce(
      (total, row) =>
        total +
        Math.max(
          0,
          firstNumber(row, [
            'pending_reward',
            'pending_amount',
            'reward_pending',
          ]) ?? 0,
        ),
      0,
    ),
    activities,
  };
}

function sumMetric(
  rows: RecordRow[],
  fields: string[],
  eventNames: string[],
) {
  return rows.reduce((total, row) => {
    const fieldValue = firstNumber(row, fields);

    if (fieldValue !== null) {
      return total + Math.max(0, Math.round(fieldValue));
    }

    const event = firstString(row, ['event_type', 'type']).toLowerCase();

    return (
      total +
      (eventNames.some((name) => event.includes(name)) ? 1 : 0)
    );
  }, 0);
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

function buildFallbackCode(profile: RecordRow, email?: string | null) {
  const name =
    firstString(profile, ['first_name', 'full_name', 'display_name']) ||
    email?.split('@')[0] ||
    'GURU';

  return `${name.replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()}-GURU`;
}

function currency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function shortDate(date: Date | null) {
  if (!date) return 'Recently';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (!parts.length) return 'GR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
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
    headerCopy: { flex: 1 },
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
    heroCard: {
      backgroundColor: isDark ? '#087A4C' : '#087F50',
      borderRadius: 22,
      gap: 11,
      padding: 15,
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 9 },
      shadowOpacity: isDark ? 0.26 : 0.13,
      shadowRadius: 17,
    },
    heroTop: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    heroIcon: {
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderRadius: 14,
      height: 48,
      justifyContent: 'center',
      width: 48,
    },
    heroCopy: { flex: 1, gap: 2 },
    heroEyebrow: {
      color: 'rgba(255,255,255,0.76)',
      fontFamily: AppFonts.bold,
      fontSize: 7,
      letterSpacing: 0.75,
    },
    heroCode: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 22,
      letterSpacing: 1,
    },
    heroText: {
      color: 'rgba(255,255,255,0.84)',
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 14,
    },
    heroActions: { flexDirection: 'row', gap: 8 },
    heroSecondaryButton: {
      alignItems: 'center',
      borderColor: 'rgba(255,255,255,0.55)',
      borderRadius: 999,
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      minHeight: 40,
    },
    heroSecondaryText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    heroPrimaryButton: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 999,
      flex: 1,
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      minHeight: 40,
    },
    heroPrimaryText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    linkCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 9,
      padding: 11,
    },
    linkIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 11,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    linkCopy: { flex: 1, gap: 2 },
    linkLabel: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 9,
    },
    linkValue: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 7,
    },
    copyButton: {
      alignItems: 'center',
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 34,
      justifyContent: 'center',
      width: 34,
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
      minHeight: 92,
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
      fontSize: 18,
      marginTop: 4,
    },
    metricLabel: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
    performanceCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 12,
      padding: 13,
    },
    cardHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
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
      marginTop: 2,
    },
    conversionPill: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 12,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },
    conversionValue: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
    },
    conversionLabel: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 6,
    },
    funnel: { gap: 9 },
    funnelRow: { gap: 4 },
    funnelLabelRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    funnelLabel: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
    funnelValue: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    funnelTrack: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 7,
      overflow: 'hidden',
    },
    funnelFill: {
      backgroundColor: palette.primary,
      borderRadius: 999,
      height: '100%',
    },
    rewardCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 11,
      padding: 13,
    },
    rewardRows: { gap: 7 },
    rewardRow: {
      alignItems: 'center',
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: 7,
    },
    rewardLabel: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 9,
    },
    rewardValue: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: palette.primary,
      borderRadius: 999,
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 40,
      paddingHorizontal: 13,
    },
    primaryButtonText: {
      color: '#FFFFFF',
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
    activityRow: {
      alignItems: 'center',
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 9,
      paddingHorizontal: 13,
      paddingVertical: 10,
    },
    activityRowLast: { borderBottomWidth: 0 },
    activityAvatar: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    activityAvatarText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
    },
    activityCopy: { flex: 1, gap: 2 },
    activityName: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 10,
    },
    activityMeta: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 7,
    },
    activityReward: {
      alignItems: 'flex-end',
      gap: 2,
    },
    activityRewardValue: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    activityRewardStatus: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
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
    shareToolsCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 10,
      padding: 13,
    },
    shareToolsGrid: { flexDirection: 'row', gap: 8 },
    shareTool: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderRadius: 14,
      flex: 1,
      gap: 6,
      justifyContent: 'center',
      minHeight: 75,
      padding: 8,
    },
    shareToolIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    shareToolLabel: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 8,
    },
    rulesCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 10,
      padding: 13,
    },
    ruleRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 8,
    },
    ruleNumber: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      height: 22,
      justifyContent: 'center',
      width: 22,
    },
    ruleNumberText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    ruleText: {
      color: palette.text,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
    },
    secondaryButton: {
      alignItems: 'center',
      borderColor: palette.primary,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 40,
      paddingHorizontal: 13,
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