import { router } from 'expo-router';
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Gift,
  GraduationCap,
  Handshake,
  Home,
  Link2,
  MapPin,
  Megaphone,
  MessageCircle,
  QrCode,
  Sparkles,
  Store,
  Target,
  Trophy,
  UserRound,
  UsersRound,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import RoleGate from '@/components/RoleGate';
import { SitGuruIcon } from '@/components/SitGuruIcon';
import SitGuruRoleStatus from '@/components/SitGuruRoleStatus';
import SitGuruScreen from '@/components/SitGuruScreen';
import SitGuruWorkspaceSwitcher from '@/components/SitGuruWorkspaceSwitcher';
import { AppFonts } from '@/constants/fonts';
import {
  setThemePreference,
  type SitGuruThemePreference,
  useThemePreference,
} from '@/hooks/use-color-scheme';
import { useThemeMode } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { resolveSupabaseStorageUrl } from '@/lib/storage';
import {
  isSupabaseConfigured,
  supabase,
} from '@/lib/supabase';

type RecordRow = Record<string, unknown>;

type ThemeOption = {
  icon: 'sun' | 'moon';
  label: string;
  value: SitGuruThemePreference;
};

type LeadStage =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'applied'
  | 'active';

type AmbassadorLead = {
  id: string;
  stage: LeadStage;
};

type AmbassadorData = {
  ambassadorStatus: string;
  approved: number;
  businessSignups: number;
  clicks: number;
  completedBookings: number;
  earned: number;
  guruSignups: number;
  leads: AmbassadorLead[];
  onboardingLabel: string;
  onboardingStatus: 'complete' | 'pending' | 'needs_action';
  paid: number;
  partnerLeads: number;
  payoutCompleted: number;
  payoutReady: boolean;
  payoutStatus: string;
  payoutTotal: number;
  pending: number;
  petParentSignups: number;
  qualified: number;
  ready: number;
  referralCode: string;
  signups: number;
  socialSignups: number;
  trainingCompleted: number;
  trainingLabel: string;
  trainingPercent: number;
  trainingRequired: number;
  unreadMessages: number;
  unreadNotifications: number;
};

const EMPTY_DATA: AmbassadorData = {
  ambassadorStatus: 'Active',
  approved: 0,
  businessSignups: 0,
  clicks: 0,
  completedBookings: 0,
  earned: 0,
  guruSignups: 0,
  leads: [],
  onboardingLabel: 'Needs Action',
  onboardingStatus: 'needs_action',
  paid: 0,
  partnerLeads: 0,
  payoutCompleted: 0,
  payoutReady: false,
  payoutStatus: 'Setup incomplete',
  payoutTotal: 6,
  pending: 0,
  petParentSignups: 0,
  qualified: 0,
  ready: 0,
  referralCode: '',
  signups: 0,
  socialSignups: 0,
  trainingCompleted: 0,
  trainingLabel: 'Not Started',
  trainingPercent: 0,
  trainingRequired: 0,
  unreadMessages: 0,
  unreadNotifications: 0,
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    icon: 'sun',
    label: 'Light',
    value: 'light',
  },
  {
    icon: 'moon',
    label: 'Dark',
    value: 'dark',
  },
];

const REFERRAL_TABLES = [
  'referral_performance',
  'referral_stats',
  'ambassador_referrals',
  'referrals',
];

const REFERRAL_OWNER_FIELDS = [
  'ambassador_id',
  'referrer_id',
  'user_id',
  'owner_id',
];

const LEAD_TABLES = [
  'ambassador_leads',
  'partner_leads',
  'community_leads',
  'leads',
];

const LEAD_OWNER_FIELDS = [
  'ambassador_id',
  'referrer_id',
  'created_by',
  'user_id',
  'owner_id',
];

const CONVERSATION_TABLES = [
  'conversations',
  'message_threads',
];

const CONVERSATION_OWNER_FIELDS = [
  'ambassador_id',
  'participant_id',
  'user_id',
];

const NOTIFICATION_TABLES = [
  'notifications',
  'user_notifications',
];

const NOTIFICATION_OWNER_FIELDS = [
  'user_id',
  'recipient_id',
  'profile_id',
  'ambassador_id',
];

const REALTIME_TABLES = [
  'referral_performance',
  'referral_stats',
  'ambassador_referrals',
  'referral_clicks',
  'ambassador_rewards',
  'referrals',
  'ambassador_leads',
  'ambassador_activity_log',
  'ambassador_marketing_efforts',
  'ambassador_onboarding_packets',
  'ambassador_training_progress',
  'partner_leads',
  'community_leads',
  'leads',
  'conversations',
  'messages',
  'notifications',
];

export default function AmbassadorDashboardScreen() {
  const { width } = useWindowDimensions();
  const { user, profile } = useAuth();
  const isWebPreview = Platform.OS === 'web';
  const isTablet = Platform.OS !== 'web' && width >= 768;
  const themeMode = useThemeMode();
  const themePreference = useThemePreference();
  const isDark = themeMode === 'dark';
  const palette = getPalette(isDark);
  const styles = createStyles(isDark);

  const profileRecord = useMemo(
    () => (profile ?? {}) as RecordRow,
    [profile],
  );

  const [data, setData] = useState<AmbassadorData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadMessage, setLoadMessage] = useState('');
  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false);

  const metadata = (user?.user_metadata ?? {}) as RecordRow;

  const profileName =
    firstString(profileRecord, ['full_name', 'display_name']) ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    firstString(metadata, ['full_name', 'name']) ||
    user?.email?.split('@')[0] ||
    'Ambassador';

  const firstName =
    profileName.split(/\s+/).filter(Boolean)[0] || 'Ambassador';

  const rawAvatar =
    firstString(profileRecord, [
      'avatar_url',
      'photo_url',
      'profile_photo_url',
      'profile_image_url',
    ]) || firstString(metadata, ['avatar_url', 'picture']);

  const avatarUrl = rawAvatar
    ? resolveSupabaseStorageUrl(rawAvatar)
    : null;

  const location = getProfileLocation(profileRecord);

  const referralCode =
    data.referralCode ||
    firstString(profileRecord, [
      'referral_code',
      'ambassador_code',
      'invite_code',
      'partner_code',
    ]);

  const referralLink = referralCode
    ? `https://www.sitguru.com/signup?ref=${encodeURIComponent(referralCode)}`
    : '';

  const points = Math.max(
    0,
    Math.round(
      firstNumber(profileRecord, [
        'ambassador_points',
        'growth_points',
        'rank_points',
        'points_balance',
      ]) ?? 0,
    ),
  );

  const rank = getRank(points);

  const refreshDashboard = useCallback(
    async (showRefresh = false) => {
      if (!user?.id || !isSupabaseConfigured) {
        setData(EMPTY_DATA);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        setData(await loadAmbassadorDashboard(user.id, user.email));
        setLoadMessage('');
      } catch {
        setLoadMessage(
          'Some updates didn’t load. Pull down to retry.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.email, user?.id],
  );

  useEffect(() => {
    void refreshDashboard(false);
  }, [refreshDashboard]);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) {
      return;
    }

    let effectActive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const refreshSoon = () => {
      if (!effectActive) {
        return;
      }

      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        if (effectActive) {
          void refreshDashboard(false);
        }
      }, 450);
    };

    const channelName = [
      'ambassador-dashboard',
      user.id,
      Date.now().toString(36),
      Math.random().toString(36).slice(2, 8),
    ].join('-');

    const channel = supabase.channel(channelName);

    REALTIME_TABLES.forEach((table) => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
        },
        refreshSoon,
      );
    });

    channel.subscribe();

    return () => {
      effectActive = false;

      if (timer) {
        clearTimeout(timer);
      }

      void supabase.removeChannel(channel);
    };
  }, [refreshDashboard, user?.id]);

  const leadCounts = useMemo(
    () => ({
      active: countLeadStage(data.leads, 'active'),
      applied: countLeadStage(data.leads, 'applied'),
      contacted: countLeadStage(data.leads, 'contacted'),
      interested: countLeadStage(data.leads, 'interested'),
      new: countLeadStage(data.leads, 'new'),
    }),
    [data.leads],
  );

  async function shareReferralLink() {
    if (!referralLink) {
      Alert.alert(
        'Your share code isn’t ready yet',
        'SitGuru Support can help get it set up.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Get help',
            onPress: () => router.push('/support'),
          },
        ],
      );
      return;
    }

    try {
      await Share.share({
        message: `Check out SitGuru with my link: ${referralLink}`,
        title: 'Share SitGuru',
        url: referralLink,
      });
    } catch {
      Alert.alert(
        'Sharing didn’t open',
        'Try again or open your QR code instead.',
      );
    }
  }

  function openPortal(
    view?:
      | 'today'
      | 'calendar'
      | 'activities'
      | 'marketing'
      | 'leads'
      | 'rewards',
  ) {
    router.push(
      {
        pathname: '/ambassador-command-center',
        params: view ? { view } : {},
      } as never,
    );
  }

  function openMessages() {
    router.push({
      pathname: '/messages',
      params: { role: 'ambassador' },
    } as never);
  }

  function openReferralAnalytics() {
    router.push('/ambassador-referral-analytics' as never);
  }

  function openSupport() {
    router.push('/support' as never);
  }

  function openRewards() {
    openPortal('rewards');
  }

  function openPayouts() {
    router.push('/ambassador-payouts' as never);
  }

  return (
    <SitGuruScreen
      center={isWebPreview || isTablet}
      maxWidth={isTablet ? 920 : 620}
    >
      <RoleGate requiredRole="ambassador">
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
                  contentContainerStyle={[
                    styles.scrollContent,
                    isTablet && styles.scrollContentTablet,
                  ]}
                  refreshControl={
                    <RefreshControl
                      colors={[palette.accent]}
                      onRefresh={() => void refreshDashboard(true)}
                      refreshing={refreshing}
                      tintColor={palette.accent}
                    />
                  }
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.header}>
                    <View style={styles.headerCopy}>
                      <Text style={styles.dashboardTitle}>
                        Ambassador Dashboard
                      </Text>

                      <Text style={styles.welcomeText}>
                        Welcome back, {firstName}!{' '}
                        <Text style={styles.wave}>👋</Text>
                      </Text>

                      <SitGuruRoleStatus role="ambassador" />

                      {location ? (
                        <View style={styles.locationRow}>
                          <MapPin
                            color={palette.accent}
                            size={12}
                            strokeWidth={2.3}
                          />
                          <Text style={styles.locationText}>{location}</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.headerActions}>
                      <Pressable
                        accessibilityLabel="Open notifications"
                        accessibilityRole="button"
                        onPress={() => router.push('/notifications')}
                        style={styles.headerIconButton}
                      >
                        <Bell
                          color={palette.title}
                          size={18}
                          strokeWidth={2.3}
                        />

                        {data.unreadNotifications > 0 ? (
                          <View style={styles.headerBadge}>
                            <Text style={styles.headerBadgeText}>
                              {formatBadge(data.unreadNotifications)}
                            </Text>
                          </View>
                        ) : null}
                      </Pressable>

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
                                        : palette.accent
                                    : palette.muted
                                }
                                name={option.icon}
                                size={15}
                                strokeWidth={2.4}
                              />
                            </Pressable>
                          );
                        })}
                      </View>

                      <Pressable
                        accessibilityLabel="Switch workspace"
                        accessibilityRole="button"
                        onPress={() => setWorkspaceSwitcherOpen(true)}
                        style={styles.profileButton}
                      >
                        <Avatar
                          fallback={initials(profileName)}
                          imageUrl={avatarUrl}
                          palette={palette}
                          size={42}
                        />
                      </Pressable>
                    </View>
                  </View>

                  {loadMessage ? (
                    <View style={styles.loadNotice}>
                      <Text style={styles.loadNoticeText}>{loadMessage}</Text>
                    </View>
                  ) : null}

                  <View style={styles.workspaceHero}>
                    <Text style={styles.workspaceEyebrow}>
                      SHARE • TRACK • EARN
                    </Text>

                    <Text style={styles.workspaceTitle}>
                      Make moves. Grow your impact.
                    </Text>

                    <Text style={styles.workspaceSubtitle}>
                      Your links, people, progress, and rewards—all in one spot.
                    </Text>

                    <View style={styles.statusPillRow}>
                      <View style={styles.statusPill}>
                        <Text style={styles.statusPillText}>
                          {data.ambassadorStatus || 'Active'}
                        </Text>
                      </View>
                      <View style={styles.statusPill}>
                        <Text style={styles.statusPillText}>
                          {data.onboardingLabel}
                        </Text>
                      </View>
                      <View style={styles.statusPill}>
                        <Text style={styles.statusPillText}>
                          {data.trainingLabel}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.codeCard}>
                      <View style={styles.codeCopy}>
                        <Text style={styles.codeLabel}>YOUR SHARE CODE</Text>
                        <Text style={styles.codeValue}>
                          {referralCode || 'Not assigned'}
                        </Text>
                      </View>
                      <Text style={styles.codeDetail}>
                        Drop it in texts, socials, QR flyers, campus events,
                        and local meetups.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.sectionBlock}>
                    <View style={styles.sectionHeaderRow}>
                      <View>
                        <Text style={styles.sectionEyebrow}>QUICK MOVES</Text>
                        <Text style={styles.sectionTitle}>What do you want to do?</Text>
                      </View>
                    </View>

                    <View style={styles.toolGrid}>
                      <ToolkitAction
                        icon={<Home color={palette.accent} size={20} />}
                        label="My day"
                        onPress={() => openPortal('today')}
                        styles={styles}
                      />
                      <ToolkitAction
                        icon={<BarChart3 color={palette.accent} size={20} />}
                        label="Link stats"
                        onPress={openReferralAnalytics}
                        styles={styles}
                      />
                      <ToolkitAction
                        icon={<UsersRound color={palette.accent} size={20} />}
                        label="Referrals"
                        onPress={openReferralAnalytics}
                        styles={styles}
                      />
                      <ToolkitAction
                        icon={<Megaphone color={palette.accent} size={20} />}
                        label="Post & track"
                        onPress={() => openPortal('marketing')}
                        styles={styles}
                      />
                      <ToolkitAction
                        icon={<CircleDollarSign color={palette.accent} size={20} />}
                        label="Get paid"
                        onPress={openRewards}
                        styles={styles}
                      />
                      <ToolkitAction
                        icon={<GraduationCap color={palette.accent} size={20} />}
                        label="Level up"
                        onPress={openSupport}
                        styles={styles}
                      />
                    </View>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void shareReferralLink()}
                    style={({ pressed }) => [
                      styles.primaryActionCard,
                      pressed && styles.primaryPressed,
                    ]}
                  >
                    <View style={styles.primaryActionCopy}>
                      <Text style={styles.primaryActionEyebrow}>
                        YOUR NEXT MOVE
                      </Text>
                      <Text style={styles.primaryActionTitle}>
                        Share your link
                      </Text>
                      <Text style={styles.primaryActionText}>
                        Send it to friends, classmates, pet parents, and local businesses.
                      </Text>
                    </View>

                    <View style={styles.primaryActionIcon}>
                      <Megaphone
                        color="#FFFFFF"
                        size={22}
                        strokeWidth={2.4}
                      />
                    </View>

                    <ChevronRight
                      color="#FFFFFF"
                      size={21}
                      strokeWidth={2.5}
                    />
                  </Pressable>

                  {loading ? (
                    <LoadingCard styles={styles} />
                  ) : (
                    <View style={styles.impactCard}>
                      <View style={styles.sectionHeaderRow}>
                        <View>
                          <Text style={styles.sectionEyebrow}>WHAT’S GROWING</Text>
                          <Text style={styles.sectionTitle}>Your stats</Text>
                        </View>

                        <View style={styles.rankPill}>
                          <Trophy
                            color={palette.accent}
                            size={14}
                            strokeWidth={2.3}
                          />
                          <Text style={styles.rankPillText}>{rank.label}</Text>
                        </View>
                      </View>

                      <View style={styles.impactGrid}>
                        <ImpactMetric
                          label="Pet parents"
                          styles={styles}
                          value={formatNumber(data.petParentSignups)}
                        />
                        <ImpactMetric
                          label="Gurus"
                          styles={styles}
                          value={formatNumber(data.guruSignups)}
                        />
                        <ImpactMetric
                          label="Social"
                          styles={styles}
                          value={formatNumber(data.socialSignups)}
                        />
                        <ImpactMetric
                          label="Bookings"
                          styles={styles}
                          value={formatNumber(data.completedBookings)}
                        />
                        <ImpactMetric
                          label="Ready"
                          styles={styles}
                          value={currency(data.approved + data.ready)}
                        />
                        <ImpactMetric
                          label="Paid"
                          styles={styles}
                          value={currency(data.paid)}
                        />
                      </View>

                      <View style={styles.impactFooter}>
                        <Text style={styles.impactFooterText}>
                          {formatNumber(data.clicks)} visits
                        </Text>
                        <Text style={styles.impactFooterText}>
                          {formatNumber(data.signups)} signups
                        </Text>
                        <Text style={styles.impactFooterText}>
                          {currency(data.pending)} being checked
                        </Text>
                      </View>

                      <Pressable
                        accessibilityHint="Opens detailed referral visits, conversions, channels, and reward analytics."
                        accessibilityLabel="View referral analytics"
                        accessibilityRole="button"
                        onPress={openReferralAnalytics}
                        style={({ pressed }) => [
                          styles.analyticsButton,
                          pressed && styles.pressed,
                        ]}
                      >
                        <View style={styles.analyticsButtonIcon}>
                          <BarChart3
                            color={palette.accent}
                            size={18}
                            strokeWidth={2.4}
                          />
                        </View>

                        <View style={styles.analyticsButtonCopy}>
                          <Text style={styles.analyticsButtonTitle}>
                            Open link stats
                          </Text>
                          <Text style={styles.analyticsButtonText}>
                            See visits, signups, bookings, and rewards.
                          </Text>
                        </View>

                        <ChevronRight
                          color={palette.accent}
                          size={18}
                          strokeWidth={2.4}
                        />
                      </Pressable>
                    </View>
                  )}

                  <View style={styles.readinessCard}>
                    <View style={styles.sectionHeaderRow}>
                      <View>
                        <Text style={styles.sectionEyebrow}>STAY READY</Text>
                        <Text style={styles.sectionTitle}>Your setup</Text>
                      </View>
                    </View>

                    <ReadinessRow
                      detail={
                        data.onboardingStatus === 'complete'
                          ? 'Your profile setup is complete.'
                          : data.onboardingStatus === 'pending'
                            ? 'Your setup is being reviewed.'
                            : 'Finish the basics so everything is ready.'
                      }
                      icon={<ClipboardList color={palette.accent} size={18} />}
                      label="Onboarding"
                      onPress={openSupport}
                      status={data.onboardingLabel}
                      styles={styles}
                    />

                    <ReadinessRow
                      detail={
                        data.trainingRequired > 0
                          ? `${data.trainingCompleted} of ${data.trainingRequired} steps done`
                          : 'Quick training appears when it’s assigned.'
                      }
                      icon={<GraduationCap color={palette.accent} size={18} />}
                      label="Quick training"
                      onPress={openSupport}
                      progress={data.trainingPercent}
                      status={data.trainingLabel}
                      styles={styles}
                    />

                    <ReadinessRow
                      detail={`${data.payoutCompleted} of ${data.payoutTotal} payout steps done`}
                      icon={<CircleDollarSign color={palette.accent} size={18} />}
                      label="Get paid"
                      last
                      onPress={openPayouts}
                      progress={
                        data.payoutTotal > 0
                          ? Math.round(
                              (data.payoutCompleted / data.payoutTotal) * 100,
                            )
                          : 0
                      }
                      status={data.payoutReady ? 'Ready' : data.payoutStatus}
                      styles={styles}
                    />
                  </View>

                  <View style={styles.quickActions}>
                    <QuickAction
                      icon={
                        <Link2
                          color={palette.accent}
                          size={20}
                          strokeWidth={2.3}
                        />
                      }
                      label="Share link"
                      onPress={() => void shareReferralLink()}
                      styles={styles}
                    />

                    <QuickAction
                      icon={
                        <QrCode
                          color={palette.accent}
                          size={20}
                          strokeWidth={2.3}
                        />
                      }
                      label="My QR"
                      onPress={openReferralAnalytics}
                      styles={styles}
                    />

                    <QuickAction
                      icon={
                        <ClipboardList
                          color={palette.accent}
                          size={20}
                          strokeWidth={2.3}
                        />
                      }
                      label="Add lead"
                      onPress={() => openPortal('leads')}
                      styles={styles}
                    />

                    <QuickAction
                      badgeCount={data.unreadMessages}
                      icon={
                        <MessageCircle
                          color={palette.accent}
                          size={20}
                          strokeWidth={2.3}
                        />
                      }
                      label="Messages"
                      onPress={openMessages}
                      styles={styles}
                    />
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    onPress={openReferralAnalytics}
                    style={({ pressed }) => [
                      styles.analyticsStrip,
                      pressed && styles.pressed,
                    ]}
                  >
                    <BarChart3
                      color={palette.accent}
                      size={18}
                      strokeWidth={2.4}
                    />
                    <View style={styles.analyticsStripCopy}>
                      <Text style={styles.analyticsStripTitle}>
                        See what’s working
                      </Text>
                      <Text style={styles.analyticsStripText}>
                        Visits, signups, bookings, and rewards
                      </Text>
                    </View>
                    <ChevronRight
                      color={palette.accent}
                      size={17}
                      strokeWidth={2.4}
                    />
                  </Pressable>

                  <View style={styles.pipelineCard}>
                    <View style={styles.sectionHeaderRow}>
                      <View>
                        <Text style={styles.sectionEyebrow}>YOUR PEOPLE</Text>
                        <Text style={styles.sectionTitle}>Lead follow-up</Text>
                      </View>

                      <Pressable
                        accessibilityRole="button"
                        onPress={() => openPortal('leads')}
                      >
                        <Text style={styles.sectionLink}>Manage</Text>
                      </Pressable>
                    </View>

                    <PipelineRow
                      count={leadCounts.new}
                      icon={<Target color={palette.accent} size={17} />}
                      label="New"
                      onPress={() => openPortal('leads')}
                      palette={palette}
                      styles={styles}
                    />
                    <PipelineRow
                      count={leadCounts.contacted}
                      icon={<MessageCircle color={palette.accent} size={17} />}
                      label="Reached out"
                      onPress={() => openPortal('leads')}
                      palette={palette}
                      styles={styles}
                    />
                    <PipelineRow
                      count={leadCounts.interested}
                      icon={<Sparkles color={palette.accent} size={17} />}
                      label="Interested"
                      onPress={() => openPortal('leads')}
                      palette={palette}
                      styles={styles}
                    />
                    <PipelineRow
                      count={leadCounts.applied}
                      icon={<ClipboardList color={palette.accent} size={17} />}
                      label="Applied"
                      onPress={() => openPortal('leads')}
                      palette={palette}
                      styles={styles}
                    />
                    <PipelineRow
                      count={leadCounts.active}
                      icon={<Handshake color={palette.accent} size={17} />}
                      label="Active"
                      last
                      onPress={() => openPortal('leads')}
                      palette={palette}
                      styles={styles}
                    />
                  </View>

                  <View style={styles.sectionBlock}>
                    <View style={styles.sectionHeaderRow}>
                      <View>
                        <Text style={styles.sectionEyebrow}>
                          WAYS TO EARN
                        </Text>
                        <Text style={styles.sectionTitle}>Reward drops</Text>
                      </View>

                      <Pressable
                        accessibilityRole="button"
                        onPress={openRewards}
                      >
                        <Text style={styles.sectionLink}>View rewards</Text>
                      </Pressable>
                    </View>

                    <View style={styles.earnCard}>
                      <EarnRow
                        amount="$15–$25"
                        icon={<Gift color={palette.accent} size={18} />}
                        label="First booking"
                        text="Earn when a referred Pet Parent books their first completed service."
                        styles={styles}
                      />
                      <EarnRow
                        amount="$25–$50"
                        icon={<UserRound color={palette.accent} size={18} />}
                        label="Approved Guru"
                        text="Earn when a referred Guru is approved and completes training."
                        styles={styles}
                      />
                      <EarnRow
                        amount="$50–$100"
                        icon={<Store color={palette.accent} size={18} />}
                        label="New partner"
                        text="Earn when a referred business becomes an approved SitGuru partner."
                        styles={styles}
                      />
                      <EarnRow
                        amount="$100+"
                        icon={<Trophy color={palette.accent} size={18} />}
                        label="Activation bonus"
                        last
                        text="Bonus eligibility begins after a referred partner completes activation."
                        styles={styles}
                      />
                    </View>
                  </View>

                  <View style={styles.sectionBlock}>
                    <View style={styles.sectionHeaderRow}>
                      <View>
                        <Text style={styles.sectionEyebrow}>
                          CREATOR KIT
                        </Text>
                        <Text style={styles.sectionTitle}>Ready-to-share tools</Text>
                      </View>
                    </View>

                    <View style={styles.toolGrid}>
                      <ToolkitAction
                        icon={<Link2 color={palette.accent} size={20} />}
                        label="My link"
                        onPress={() => void shareReferralLink()}
                        styles={styles}
                      />
                      <ToolkitAction
                        icon={<QrCode color={palette.accent} size={20} />}
                        label="QR kit"
                        onPress={openReferralAnalytics}
                        styles={styles}
                      />
                      <ToolkitAction
                        icon={<BookOpen color={palette.accent} size={20} />}
                        label="What to say"
                        onPress={openSupport}
                        styles={styles}
                      />
                      <ToolkitAction
                        icon={<Trophy color={palette.accent} size={20} />}
                        label="Leaderboard"
                        onPress={openReferralAnalytics}
                        styles={styles}
                      />
                      <ToolkitAction
                        icon={<CircleDollarSign color={palette.accent} size={20} />}
                        label="Rewards"
                        onPress={openRewards}
                        styles={styles}
                      />
                      <ToolkitAction
                        icon={<GraduationCap color={palette.accent} size={20} />}
                        label="Training"
                        onPress={openSupport}
                        styles={styles}
                      />
                    </View>
                  </View>

                  <View style={styles.progressCard}>
                    <View style={styles.sectionHeaderRow}>
                      <View>
                        <Text style={styles.sectionEyebrow}>
                          LEVEL UP
                        </Text>
                        <Text style={styles.sectionTitle}>{rank.label}</Text>
                      </View>

                      <Text style={styles.pointsValue}>{points} pts</Text>
                    </View>

                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${rank.progress}%` },
                        ]}
                      />
                    </View>

                    <View style={styles.rankRow}>
                      {['Bronze', 'Silver', 'Gold', 'City Captain'].map(
                        (label) => (
                          <View key={label} style={styles.rankStep}>
                            <View
                              style={[
                                styles.rankDot,
                                label === rank.label && styles.rankDotActive,
                              ]}
                            />
                            <Text
                              style={[
                                styles.rankLabel,
                                label === rank.label && styles.rankLabelActive,
                              ]}
                            >
                              {label}
                            </Text>
                          </View>
                        ),
                      )}
                    </View>

                    <Text style={styles.progressText}>{rank.helper}</Text>
                  </View>

                  <View style={styles.sectionBlock}>
                    <View style={styles.sectionHeaderRow}>
                      <View>
                        <Text style={styles.sectionEyebrow}>
                          FIND YOUR LANE
                        </Text>
                        <Text style={styles.sectionTitle}>Pick your path</Text>
                      </View>
                    </View>

                    <View style={styles.programCard}>
                      <ProgramRow
                        icon={<UsersRound color={palette.accent} size={18} />}
                        label="Community"
                        styles={styles}
                        text="Refer Pet Parents and help spread the word about trusted local care."
                      />
                      <ProgramRow
                        icon={<Store color={palette.accent} size={18} />}
                        label="Local partners"
                        styles={styles}
                        text="Introduce and onboard local pet businesses to partner with SitGuru."
                      />
                      <ProgramRow
                        icon={<Trophy color={palette.accent} size={18} />}
                        label="City Captain"
                        styles={styles}
                        text="Lead and grow a network of Ambassadors and partners in your city."
                      />
                      <ProgramRow
                        icon={<Megaphone color={palette.accent} size={18} />}
                        label="Campus & neighborhood"
                        last
                        styles={styles}
                        text="Inspire your campus or neighborhood to choose trusted pet care."
                      />
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.bottomNav}>
                  <BottomNavItem
                    active
                    icon={
                      <Home
                        color={palette.accent}
                        size={21}
                        strokeWidth={2.4}
                      />
                    }
                    label="Dashboard"
                    onPress={() => undefined}
                    styles={styles}
                  />

                  <BottomNavItem
                    icon={
                      <BarChart3
                        color={palette.navMuted}
                        size={21}
                        strokeWidth={2.3}
                      />
                    }
                    label="Referrals"
                    onPress={openReferralAnalytics}
                    styles={styles}
                  />

                  <BottomNavItem
                    icon={
                      <ClipboardList
                        color={palette.navMuted}
                        size={21}
                        strokeWidth={2.3}
                      />
                    }
                    label="Leads"
                    onPress={() => openPortal('leads')}
                    styles={styles}
                  />

                  <BottomNavItem
                    badgeCount={data.unreadMessages}
                    icon={
                      <MessageCircle
                        color={palette.navMuted}
                        size={21}
                        strokeWidth={2.3}
                      />
                    }
                    label="Messages"
                    onPress={openMessages}
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
                    onPress={() => setWorkspaceSwitcherOpen(true)}
                    styles={styles}
                  />
                </View>

                <SitGuruWorkspaceSwitcher
                  currentRole="ambassador"
                  onClose={() => setWorkspaceSwitcherOpen(false)}
                  visible={workspaceSwitcherOpen}
                />
              </View>
            </View>

            {isWebPreview ? <View style={styles.homeIndicator} /> : null}
          </View>
        </View>
      </RoleGate>
    </SitGuruScreen>
  );
}

function LoadingCard({
  styles,
}: {
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.loadingCard}>
      <View style={styles.loadingBarLarge} />
      <View style={styles.loadingBarMedium} />
      <View style={styles.loadingBarSmall} />
    </View>
  );
}

function ImpactMetric({
  label,
  styles,
  value,
}: {
  label: string;
  styles: ReturnType<typeof createStyles>;
  value: string;
}) {
  return (
    <View style={styles.impactMetric}>
      <Text style={styles.impactValue}>{value}</Text>
      <Text style={styles.impactLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({
  badgeCount = 0,
  icon,
  label,
  onPress,
  styles,
}: {
  badgeCount?: number;
  icon: ReactNode;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.quickActionIcon}>
        {icon}

        {badgeCount > 0 ? (
          <View style={styles.quickActionBadge}>
            <Text style={styles.quickActionBadgeText}>
              {formatBadge(badgeCount)}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

function PipelineRow({
  count,
  icon,
  label,
  last = false,
  onPress,
  palette,
  styles,
}: {
  count: number;
  icon: ReactNode;
  label: string;
  last?: boolean;
  onPress: () => void;
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.pipelineRow,
        last && styles.pipelineRowLast,
      ]}
    >
      <View style={styles.pipelineIcon}>{icon}</View>
      <Text style={styles.pipelineLabel}>{label}</Text>
      <View style={styles.pipelineCount}>
        <Text style={styles.pipelineCountText}>{count}</Text>
      </View>
      <ChevronRight
        color={palette.muted}
        size={17}
        strokeWidth={2.3}
      />
    </Pressable>
  );
}

function ReadinessRow({
  detail,
  icon,
  label,
  last = false,
  onPress,
  progress,
  status,
  styles,
}: {
  detail: string;
  icon: ReactNode;
  label: string;
  last?: boolean;
  onPress: () => void;
  progress?: number;
  status: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityLabel={`Open ${label}`}
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.readinessRow,
        last && styles.readinessRowLast,
      ]}>
      <View style={styles.readinessIcon}>{icon}</View>

      <View style={styles.readinessCopy}>
        <View style={styles.readinessTitleRow}>
          <Text style={styles.readinessLabel}>{label}</Text>
          <Text style={styles.readinessStatus}>{status}</Text>
        </View>

        <Text style={styles.readinessDetail}>{detail}</Text>

        {typeof progress === 'number' ? (
          <View style={styles.readinessTrack}>
            <View
              style={[
                styles.readinessFill,
                {
                  width: `${Math.max(0, Math.min(100, progress))}%`,
                },
              ]}
            />
          </View>
        ) : null}
      </View>

      <ChevronRight
        color={styles.readinessChevron.color}
        size={17}
        strokeWidth={2.3}
      />
    </Pressable>
  );
}

function EarnRow({
  amount,
  icon,
  label,
  last = false,
  styles,
  text,
}: {
  amount: string;
  icon: ReactNode;
  label: string;
  last?: boolean;
  styles: ReturnType<typeof createStyles>;
  text: string;
}) {
  return (
    <View style={[styles.earnRow, last && styles.earnRowLast]}>
      <View style={styles.earnIcon}>{icon}</View>
      <View style={styles.earnCopy}>
        <Text style={styles.earnLabel}>{label}</Text>
        <Text style={styles.earnText}>{text}</Text>
      </View>
      <Text style={styles.earnAmount}>{amount}</Text>
    </View>
  );
}

function ToolkitAction({
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
      style={({ pressed }) => [
        styles.toolAction,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.toolActionIcon}>{icon}</View>
      <Text style={styles.toolActionLabel}>{label}</Text>
    </Pressable>
  );
}

function ProgramRow({
  icon,
  label,
  last = false,
  styles,
  text,
}: {
  icon: ReactNode;
  label: string;
  last?: boolean;
  styles: ReturnType<typeof createStyles>;
  text: string;
}) {
  return (
    <View style={[styles.programRow, last && styles.programRowLast]}>
      <View style={styles.programIcon}>{icon}</View>
      <View style={styles.programCopy}>
        <Text style={styles.programLabel}>{label}</Text>
        <Text style={styles.programText}>{text}</Text>
      </View>
    </View>
  );
}

function BottomNavItem({
  active = false,
  badgeCount = 0,
  icon,
  label,
  onPress,
  styles,
}: {
  active?: boolean;
  badgeCount?: number;
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
      <View style={styles.navIconWrap}>
        {icon}
        {badgeCount > 0 ? <View style={styles.navBadge} /> : null}
      </View>
      <Text style={active ? styles.navLabelActive : styles.navLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

function Avatar({
  fallback,
  imageUrl,
  palette,
  size,
}: {
  fallback: string;
  imageUrl: string | null;
  palette: ReturnType<typeof getPalette>;
  size: number;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: palette.avatarBg,
        borderColor: palette.avatarBorder,
        borderRadius: size / 2,
        borderWidth: 2,
        height: size,
        justifyContent: 'center',
        overflow: 'hidden',
        width: size,
      }}
    >
      {showImage ? (
        <Image
          onError={() => setImageFailed(true)}
          resizeMode="cover"
          source={{ uri: imageUrl as string }}
          style={{ height: '100%', width: '100%' }}
        />
      ) : (
        <Text
          style={{
            color: palette.accent,
            fontFamily: AppFonts.extraBold,
            fontSize: Math.max(11, size * 0.28),
          }}
        >
          {fallback}
        </Text>
      )}
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

async function loadAmbassadorDashboard(
  userId: string,
  email?: string | null,
): Promise<AmbassadorData> {
  const ambassador = await findAmbassadorRecord(userId, email);
  const ambassadorId = firstString(ambassador, ['id']);
  const referralCode = firstString(ambassador, ['referral_code']);

  const [
    canonicalReferralRows,
    rewardRows,
    canonicalLeadRows,
    conversationRows,
    notificationRows,
    onboardingRows,
    trainingSteps,
    trainingProgressRows,
    referralCodeRows,
  ] = await Promise.all([
    ambassadorId
      ? safeRows('ambassador_referrals', 'ambassador_id', ambassadorId, 5000)
      : Promise.resolve([]),
    ambassadorId
      ? safeRows('ambassador_rewards', 'ambassador_id', ambassadorId, 2000)
      : Promise.resolve([]),
    ambassadorId
      ? safeRows('ambassador_leads', 'ambassador_id', ambassadorId, 1000)
      : Promise.resolve([]),
    queryFirstAvailableRows(
      CONVERSATION_TABLES,
      CONVERSATION_OWNER_FIELDS,
      userId,
      80,
    ),
    queryFirstAvailableRows(
      NOTIFICATION_TABLES,
      NOTIFICATION_OWNER_FIELDS,
      userId,
      80,
    ),
    ambassadorId
      ? safeRows(
          'ambassador_onboarding_packets',
          'ambassador_id',
          ambassadorId,
          5,
        )
      : Promise.resolve([]),
    safeActiveTrainingSteps(),
    ambassadorId
      ? safeRows(
          'ambassador_training_progress',
          'ambassador_id',
          ambassadorId,
          500,
        )
      : Promise.resolve([]),
    ambassadorId
      ? safeRows('referral_codes', 'ambassador_id', ambassadorId, 10)
      : Promise.resolve([]),
  ]);

  const referralCodeId = firstString(referralCodeRows[0] || {}, ['id']);
  const clickRows = referralCodeId
    ? await safeRows('referral_clicks', 'referral_code_id', referralCodeId, 10000)
    : [];

  let referralRows = canonicalReferralRows;
  let leadRows = canonicalLeadRows;

  if (!referralRows.length) {
    referralRows = await queryFirstAvailableRows(
      REFERRAL_TABLES,
      REFERRAL_OWNER_FIELDS,
      userId,
      500,
    );
  }

  if (!leadRows.length) {
    leadRows = await queryFirstAvailableRows(
      LEAD_TABLES,
      LEAD_OWNER_FIELDS,
      userId,
      500,
    );
  }

  const typeFor = (row: RecordRow) =>
    firstString(row, [
      'referral_type',
      'lead_type',
      'type',
      'category',
    ])
      .toLowerCase()
      .replace(/[\s-]+/g, '_');

  const statusFor = (row: RecordRow) =>
    firstString(row, ['status', 'referral_status'])
      .toLowerCase()
      .replace(/[\s-]+/g, '_');

  const bookingStatusFor = (row: RecordRow) =>
    firstString(row, ['booking_status'])
      .toLowerCase()
      .replace(/[\s-]+/g, '_');

  const petParentSignups = referralRows.filter((row) =>
    ['pet_parent', 'customer', 'pet_owner', 'parent'].includes(typeFor(row)),
  ).length;

  const guruSignups = referralRows.filter((row) =>
    ['guru', 'future_guru', 'provider', 'sitter', 'walker'].includes(typeFor(row)),
  ).length;

  const businessSignups = referralRows.filter((row) =>
    ['business', 'partner', 'community_partner'].includes(typeFor(row)),
  ).length;

  const completedBookings = referralRows.filter((row) => {
    const bookingStatus = bookingStatusFor(row);
    const status = statusFor(row);

    return Boolean(
      firstString(row, ['completed_booking_at']) ||
        ['booking_completed', 'completed'].includes(bookingStatus) ||
        status === 'booking_completed',
    );
  }).length;

  const qualified = referralRows.filter((row) => {
    const status = statusFor(row);

    return Boolean(
      firstString(row, ['qualified_at']) ||
        firstBoolean(row, ['qualified', 'is_qualified', 'approved']) ||
        ['qualified', 'approved', 'active', 'completed'].includes(status),
    );
  }).length;

  const socialSignups = referralRows.filter((row) => {
    const source = [
      firstString(row, ['platform']),
      firstString(row, ['source']),
      firstString(row, ['medium']),
      firstString(row, ['campaign']),
      firstString(row, ['utm_source']),
    ]
      .join(' ')
      .toLowerCase();

    return ['facebook', 'instagram', 'tiktok', 'youtube', 'twitter', ' x '].some(
      (platform) => source.includes(platform.trim()),
    );
  }).length;

  const partnerLeads = [...referralRows, ...leadRows].filter((row) => {
    const type = typeFor(row);
    return type.includes('partner') || type.includes('business');
  }).length;

  const signups =
    canonicalReferralRows.length > 0
      ? referralRows.length
      : referralRows.reduce(
          (total, row) =>
            total +
            Math.max(
              0,
              Math.round(
                firstNumber(row, [
                  'signups',
                  'signup_count',
                  'registered_count',
                ]) ?? 1,
              ),
            ),
          0,
        );

  const clicks =
    clickRows.length > 0
      ? clickRows.length
      : referralRows.reduce(
          (total, row) =>
            total +
            Math.max(
              0,
              Math.round(
                firstNumber(row, [
                  'clicks',
                  'link_clicks',
                  'click_count',
                ]) ?? 0,
              ),
            ),
          0,
        );

  let pending = 0;
  let approved = 0;
  let ready = 0;
  let paid = 0;

  rewardRows.forEach((row) => {
    const amount = Math.max(
      0,
      firstNumber(row, [
        'amount',
        'reward_amount',
        'payout_amount',
      ]) ?? 0,
    );
    const statuses = [
      firstString(row, ['status']),
      firstString(row, ['financial_status']),
      firstString(row, ['payout_status']),
    ].map((value) => value.toLowerCase().replace(/[\s-]+/g, '_'));

    if (
      firstString(row, ['paid_at']) ||
      statuses.some((status) =>
        ['paid', 'payout_paid', 'payout_completed', 'settled'].includes(status),
      )
    ) {
      paid += amount;
      return;
    }

    if (
      statuses.some((status) =>
        ['ready_for_payout', 'queued_for_payout', 'queued'].includes(status),
      )
    ) {
      ready += amount;
      return;
    }

    if (statuses.some((status) => status === 'approved')) {
      approved += amount;
      return;
    }

    if (
      !statuses.some((status) =>
        [
          'rejected',
          'ineligible',
          'void',
          'voided',
          'cancelled',
          'canceled',
          'refunded',
          'chargeback',
          'reversed',
        ].includes(status),
      )
    ) {
      pending += amount;
    }
  });

  if (!rewardRows.length) {
    pending = referralRows.reduce(
      (sum, row) =>
        sum +
        Math.max(
          0,
          firstNumber(row, [
            'pending_amount',
            'reward_pending',
            'pending_reward',
          ]) ?? 0,
        ),
      0,
    );
    paid = referralRows.reduce(
      (sum, row) =>
        sum +
        Math.max(
          0,
          firstNumber(row, [
            'paid_amount',
            'reward_paid',
            'total_paid',
          ]) ?? 0,
        ),
      0,
    );
  }

  const leads = leadRows.map((row, index) => ({
    id: firstString(row, ['id', 'lead_id']) || `lead-${index}`,
    stage: normalizeLeadStage(
      firstString(row, [
        'stage',
        'status',
        'lead_status',
        'pipeline_stage',
      ]),
    ),
  }));

  const unreadMessages = conversationRows.reduce((total, row) => {
    const count =
      firstNumber(row, [
        'unread_count',
        'ambassador_unread_count',
        'participant_unread_count',
      ]) ?? (firstBoolean(row, ['is_unread', 'unread']) ? 1 : 0);

    return total + Math.max(0, Math.round(count));
  }, 0);

  const unreadNotifications = notificationRows.reduce((total, row) => {
    if (firstBoolean(row, ['is_unread', 'unread'])) return total + 1;
    if (!firstBoolean(row, ['is_read', 'read', 'seen'])) return total + 1;
    return total;
  }, 0);

  const onboarding = getOnboardingSummary(
    onboardingRows[0] || {},
    firstString(ambassador, ['onboarding_status']),
  );

  const training = getTrainingSummary(
    trainingSteps,
    trainingProgressRows,
    firstString(ambassador, ['training_status']),
  );

  const payout = getPayoutSummary(ambassador);

  return {
    ambassadorStatus:
      formatStatus(firstString(ambassador, ['status'])) || 'Active',
    approved,
    businessSignups,
    clicks,
    completedBookings,
    earned: pending + approved + ready + paid,
    guruSignups,
    leads,
    onboardingLabel: onboarding.label,
    onboardingStatus: onboarding.status,
    paid,
    partnerLeads,
    payoutCompleted: payout.completed,
    payoutReady: payout.ready,
    payoutStatus: payout.label,
    payoutTotal: payout.total,
    pending,
    petParentSignups,
    qualified,
    ready,
    referralCode,
    signups,
    socialSignups,
    trainingCompleted: training.completed,
    trainingLabel: training.label,
    trainingPercent: training.percent,
    trainingRequired: training.required,
    unreadMessages,
    unreadNotifications,
  };
}

async function findAmbassadorRecord(
  userId: string,
  email?: string | null,
): Promise<RecordRow> {
  const byUser = await supabase
    .from('ambassadors')
    .select('*')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (!byUser.error && byUser.data) {
    return byUser.data as RecordRow;
  }

  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanEmail) return {};

  for (const field of ['login_email', 'contact_email', 'email']) {
    const result = await supabase
      .from('ambassadors')
      .select('*')
      .eq(field, cleanEmail)
      .limit(1)
      .maybeSingle();

    if (!result.error && result.data) {
      return result.data as RecordRow;
    }
  }

  return {};
}

async function safeRows(
  table: string,
  field: string,
  value: string,
  limit: number,
): Promise<RecordRow[]> {
  if (!isSupabaseConfigured || !value) return [];

  const result = await supabase
    .from(table)
    .select('*')
    .eq(field, value)
    .limit(limit);

  if (result.error || !result.data) return [];
  return result.data as RecordRow[];
}

async function safeActiveTrainingSteps(): Promise<RecordRow[]> {
  if (!isSupabaseConfigured) return [];

  const result = await supabase
    .from('ambassador_training_steps')
    .select('*')
    .eq('is_active', true)
    .limit(500);

  if (result.error || !result.data) return [];
  return result.data as RecordRow[];
}

function getOnboardingSummary(
  packet: RecordRow,
  fallbackStatus: string,
): {
  label: string;
  status: 'complete' | 'pending' | 'needs_action';
} {
  const status = (
    firstString(packet, ['status']) || fallbackStatus
  )
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (['approved', 'complete', 'completed'].includes(status)) {
    return { label: 'Complete', status: 'complete' };
  }

  if (['submitted', 'pending_review', 'in_review'].includes(status)) {
    return { label: 'Submitted', status: 'pending' };
  }

  if (['needs_fix', 'needs_action'].includes(status)) {
    return { label: 'Needs Fix', status: 'needs_action' };
  }

  return { label: 'Needs Action', status: 'needs_action' };
}

function getTrainingSummary(
  steps: RecordRow[],
  progressRows: RecordRow[],
  fallbackStatus: string,
) {
  const requiredSteps = steps.filter(
    (step) => step.is_required !== false,
  );
  const completedStepIds = new Set(
    progressRows
      .filter((row) => {
        const status = firstString(row, ['status'])
          .toLowerCase()
          .replace(/[\s-]+/g, '_');

        return Boolean(
          firstString(row, ['completed_at']) ||
            ['complete', 'completed', 'approved'].includes(status),
        );
      })
      .map((row) => firstString(row, ['training_step_id']))
      .filter(Boolean),
  );

  const completed = requiredSteps.filter((step) =>
    completedStepIds.has(firstString(step, ['id'])),
  ).length;
  const required = requiredSteps.length;

  if (required > 0) {
    const percent = Math.round((completed / required) * 100);
    return {
      completed,
      label:
        completed >= required
          ? 'Complete'
          : progressRows.length
            ? `In Progress (${percent}%)`
            : 'Not Started',
      percent,
      required,
    };
  }

  const fallback = formatStatus(fallbackStatus) || 'Not Started';
  const complete = fallback.toLowerCase().includes('complete');

  return {
    completed: complete ? 1 : 0,
    label: fallback,
    percent: complete ? 100 : 0,
    required: complete ? 1 : 0,
  };
}

function getPayoutSummary(ambassador: RecordRow) {
  const taxStatus = firstString(ambassador, ['tax_info_status'])
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  const checks = [
    Boolean(firstString(ambassador, ['terms_accepted_at'])),
    Boolean(firstString(ambassador, ['stripe_account_id'])),
    firstBoolean(ambassador, ['stripe_onboarding_complete']),
    firstBoolean(ambassador, ['stripe_payouts_enabled']),
    Boolean(taxStatus && taxStatus !== 'not_started'),
    Boolean(firstString(ambassador, ['payout_method'])),
  ];

  const completed = checks.filter(Boolean).length;
  const total = checks.length;
  const ready = total > 0 && completed === total;

  return {
    completed,
    label:
      formatStatus(firstString(ambassador, ['payout_status'])) ||
      (ready ? 'Ready for payout' : 'Setup incomplete'),
    ready,
    total,
  };
}

function formatStatus(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function queryFirstAvailableRows(
  tables: string[],
  ownerFields: string[],
  userId: string,
  limit: number,
): Promise<RecordRow[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  for (const table of tables) {
    for (const ownerField of ownerFields) {
      const result = await supabase
        .from(table)
        .select('*')
        .eq(ownerField, userId)
        .limit(limit);

      if (!result.error && result.data?.length) {
        return result.data as RecordRow[];
      }
    }
  }

  return [];
}

function firstString(record: RecordRow, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function firstNumber(record: RecordRow, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function firstBoolean(record: RecordRow, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'boolean') {
      return value;
    }

    if (value === 1 || value === '1' || value === 'true') {
      return true;
    }
  }

  return false;
}

function normalizeLeadStage(value: string): LeadStage {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');

  if (['active', 'approved', 'converted', 'complete', 'completed'].includes(normalized)) {
    return 'active';
  }

  if (['applied', 'application_submitted', 'submitted'].includes(normalized)) {
    return 'applied';
  }

  if (['interested', 'qualified', 'warm', 'considering'].includes(normalized)) {
    return 'interested';
  }

  if (['contacted', 'follow_up', 'followed_up', 'replied'].includes(normalized)) {
    return 'contacted';
  }

  return 'new';
}

function countLeadStage(leads: AmbassadorLead[], stage: LeadStage) {
  return leads.filter((lead) => lead.stage === stage).length;
}

function getProfileLocation(profile: RecordRow) {
  const city = firstString(profile, ['city', 'home_city', 'service_city']);
  const state = firstString(profile, ['state', 'home_state', 'service_state']);
  return [city, state].filter(Boolean).join(', ');
}

function getRank(points: number) {
  if (points >= 100) {
    return {
      helper: 'City Captain level reached.',
      label: 'City Captain',
      progress: 100,
    };
  }

  if (points >= 50) {
    return {
      helper: `${100 - points} points until City Captain.`,
      label: 'Gold',
      progress: Math.min(99, 66 + ((points - 50) / 50) * 34),
    };
  }

  if (points >= 20) {
    return {
      helper: `${50 - points} points until Gold.`,
      label: 'Silver',
      progress: 33 + ((points - 20) / 30) * 33,
    };
  }

  return {
    helper: `${20 - points} points until Silver.`,
    label: 'Bronze',
    progress: Math.max(4, (points / 20) * 33),
  };
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'AM';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatBadge(value: number) {
  return value > 99 ? '99+' : String(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(value);
}

function currency(value: number) {
  return new Intl.NumberFormat(undefined, {
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    style: 'currency',
  }).format(value);
}

function getPalette(isDark: boolean) {
  return {
    accent: isDark ? '#39D982' : '#087449',
    accentDark: isDark ? '#1C9F5E' : '#075D3B',
    accentSoft: isDark ? '#123E2A' : '#E4F5E9',
    avatarBg: isDark ? '#173527' : '#EEF5EE',
    avatarBorder: isDark ? '#2E6C4B' : '#FFFFFF',
    background: isDark ? '#06140F' : '#FFF9F1',
    border: isDark ? '#234B38' : '#EADDCB',
    muted: isDark ? '#9DB0A5' : '#738078',
    navMuted: isDark ? '#9BAAA1' : '#748079',
    orange: '#F15A3A',
    primary: isDark ? '#39D982' : '#087449',
    shadow: '#000000',
    surface: isDark ? '#0B2118' : '#FFFEFA',
    surfaceSoft: isDark ? '#102D21' : '#FFF6E9',
    text: isDark ? '#E8EEE9' : '#27483E',
    title: isDark ? '#FFF5E8' : '#123F31',
  };
}

function createStyles(isDark: boolean) {
  const palette = getPalette(isDark);

  return StyleSheet.create({
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
    screen: {
      backgroundColor: palette.background,
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
      color: palette.title,
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
      backgroundColor: palette.title,
      borderRadius: 2,
      width: 3,
    },
    wifiText: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    batteryWrap: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 2,
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
    batteryCap: {
      backgroundColor: palette.title,
      height: 4,
      width: 2,
    },
    scrollContent: {
      gap: 13,
      paddingBottom: 112,
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    scrollContentTablet: {
      alignSelf: 'center',
      maxWidth: 880,
      paddingHorizontal: 24,
      width: '100%',
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    headerCopy: {
      flex: 1,
      gap: 2,
      paddingRight: 8,
    },
    dashboardTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 20,
      letterSpacing: -0.4,
    },
    welcomeText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 11,
    },
    wave: {
      fontSize: 11,
    },
    locationRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
      marginTop: 2,
    },
    locationText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
    },
    headerActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    headerIconButton: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 38,
      justifyContent: 'center',
      position: 'relative',
      width: 38,
    },
    headerBadge: {
      alignItems: 'center',
      backgroundColor: palette.orange,
      borderColor: palette.surface,
      borderRadius: 999,
      borderWidth: 1.5,
      justifyContent: 'center',
      minHeight: 17,
      minWidth: 17,
      paddingHorizontal: 4,
      position: 'absolute',
      right: -2,
      top: -4,
    },
    headerBadgeText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
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
      backgroundColor: isDark ? 'rgba(226,170,45,0.18)' : '#FFF4D8',
    },
    profileButton: {
      borderRadius: 999,
    },
    loadNotice: {
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.border,
      borderRadius: 14,
      borderWidth: 1,
      padding: 10,
    },
    loadNoticeText: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 14,
    },
    workspaceHero: {
      backgroundColor: isDark ? '#0D2B20' : '#ECF8EE',
      borderColor: isDark ? '#2D6548' : '#CFE8D5',
      borderRadius: 24,
      borderWidth: 1,
      gap: 10,
      padding: 16,
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.2 : 0.07,
      shadowRadius: 16,
    },
    workspaceEyebrow: {
      color: palette.accent,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
      letterSpacing: 0.9,
    },
    workspaceTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 24,
      letterSpacing: -0.65,
      lineHeight: 29,
    },
    workspaceSubtitle: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 16,
    },
    statusPillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    statusPill: {
      backgroundColor: palette.accentSoft,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },
    statusPillText: {
      color: palette.accent,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    codeCard: {
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.border,
      borderRadius: 16,
      borderWidth: 1,
      gap: 8,
      padding: 11,
    },
    codeCopy: {
      gap: 2,
    },
    codeLabel: {
      color: palette.accent,
      fontFamily: AppFonts.extraBold,
      fontSize: 7,
      letterSpacing: 0.8,
    },
    codeValue: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 22,
      letterSpacing: -0.4,
    },
    codeDetail: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 13,
    },
    readinessCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      overflow: 'hidden',
      paddingTop: 12,
    },
    readinessRow: {
      alignItems: 'center',
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 9,
      minHeight: 76,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    readinessRowLast: {
      borderBottomWidth: 0,
    },
    readinessIcon: {
      alignItems: 'center',
      backgroundColor: palette.accentSoft,
      borderRadius: 12,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    readinessCopy: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    readinessTitleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    readinessLabel: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
    },
    readinessStatus: {
      color: palette.accent,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
      maxWidth: '52%',
      textAlign: 'right',
    },
    readinessDetail: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
    },
    readinessTrack: {
      backgroundColor: palette.accentSoft,
      borderRadius: 999,
      height: 5,
      overflow: 'hidden',
    },
    readinessFill: {
      backgroundColor: palette.accent,
      borderRadius: 999,
      height: '100%',
    },
    readinessChevron: {
      color: palette.muted,
    },
    primaryActionCard: {
      alignItems: 'center',
      backgroundColor: isDark ? '#087A4C' : '#087F50',
      borderRadius: 21,
      flexDirection: 'row',
      gap: 10,
      minHeight: 94,
      padding: 14,
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 9 },
      shadowOpacity: isDark ? 0.28 : 0.14,
      shadowRadius: 17,
    },
    primaryActionCopy: {
      flex: 1,
      gap: 2,
    },
    primaryActionEyebrow: {
      color: 'rgba(255,255,255,0.78)',
      fontFamily: AppFonts.bold,
      fontSize: 8,
      letterSpacing: 0.8,
    },
    primaryActionTitle: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 18,
    },
    primaryActionText: {
      color: 'rgba(255,255,255,0.84)',
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 14,
    },
    primaryActionIcon: {
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderRadius: 999,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    primaryPressed: {
      opacity: 0.86,
      transform: [{ scale: 0.99 }],
    },
    loadingCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 10,
      padding: 14,
    },
    loadingBarLarge: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 15,
      width: '52%',
    },
    loadingBarMedium: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 11,
      width: '76%',
    },
    loadingBarSmall: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 10,
      width: '34%',
    },
    impactCard: {
      backgroundColor: palette.surface,
      borderColor: isDark ? '#2D6548' : '#DCE9D4',
      borderRadius: 20,
      borderWidth: 1,
      gap: 11,
      padding: 13,
    },
    sectionBlock: {
      gap: 9,
    },
    sectionHeaderRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    sectionEyebrow: {
      color: palette.accent,
      fontFamily: AppFonts.bold,
      fontSize: 8,
      letterSpacing: 0.85,
    },
    sectionTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 16,
      marginTop: 2,
    },
    sectionLink: {
      color: palette.accent,
      fontFamily: AppFonts.bold,
      fontSize: 9,
    },
    rankPill: {
      alignItems: 'center',
      backgroundColor: palette.accentSoft,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },
    rankPillText: {
      color: palette.accent,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    impactGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    impactMetric: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 14,
      flexBasis: '47%',
      flexGrow: 1,
      gap: 2,
      padding: 10,
    },
    impactValue: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 18,
    },
    impactLabel: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
    impactFooter: {
      borderTopColor: palette.border,
      borderTopWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 9,
    },
    impactFooterText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
    analyticsButton: {
      alignItems: 'center',
      backgroundColor: palette.accentSoft,
      borderColor: palette.border,
      borderRadius: 15,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 9,
      marginTop: 1,
      paddingHorizontal: 10,
      paddingVertical: 9,
    },
    analyticsButtonIcon: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderRadius: 11,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    analyticsButtonCopy: {
      flex: 1,
      gap: 1,
      minWidth: 0,
    },
    analyticsButtonTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
    },
    analyticsButtonText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
    },
    quickActions: {
      flexDirection: 'row',
      gap: 8,
    },
    quickAction: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 17,
      borderWidth: 1,
      flex: 1,
      gap: 6,
      justifyContent: 'center',
      minHeight: 78,
      paddingHorizontal: 5,
      paddingVertical: 9,
    },
    quickActionIcon: {
      alignItems: 'center',
      backgroundColor: palette.accentSoft,
      borderRadius: 999,
      height: 37,
      justifyContent: 'center',
      position: 'relative',
      width: 37,
    },
    quickActionBadge: {
      alignItems: 'center',
      backgroundColor: palette.orange,
      borderColor: palette.surface,
      borderRadius: 999,
      borderWidth: 1.5,
      justifyContent: 'center',
      minHeight: 17,
      minWidth: 17,
      paddingHorizontal: 4,
      position: 'absolute',
      right: -5,
      top: -5,
    },
    quickActionBadgeText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 7,
    },
    quickActionLabel: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 9,
      textAlign: 'center',
    },
    analyticsStrip: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 9,
      minHeight: 54,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    analyticsStripCopy: {
      flex: 1,
      gap: 1,
    },
    analyticsStripTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
    },
    analyticsStripText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
    pressed: {
      opacity: 0.72,
      transform: [{ scale: 0.985 }],
    },
    pipelineCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      overflow: 'hidden',
      paddingTop: 12,
    },
    pipelineRow: {
      alignItems: 'center',
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 9,
      minHeight: 56,
      paddingHorizontal: 13,
      paddingVertical: 8,
    },
    pipelineRowLast: {
      borderBottomWidth: 0,
    },
    pipelineIcon: {
      alignItems: 'center',
      backgroundColor: palette.accentSoft,
      borderRadius: 10,
      height: 31,
      justifyContent: 'center',
      width: 31,
    },
    pipelineLabel: {
      color: palette.title,
      flex: 1,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    pipelineCount: {
      alignItems: 'center',
      backgroundColor: palette.accentSoft,
      borderRadius: 999,
      justifyContent: 'center',
      minHeight: 22,
      minWidth: 22,
      paddingHorizontal: 6,
    },
    pipelineCountText: {
      color: palette.accent,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    earnCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      overflow: 'hidden',
    },
    earnRow: {
      alignItems: 'center',
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 9,
      minHeight: 74,
      padding: 11,
    },
    earnRowLast: {
      borderBottomWidth: 0,
    },
    earnIcon: {
      alignItems: 'center',
      backgroundColor: palette.accentSoft,
      borderRadius: 12,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    earnCopy: {
      flex: 1,
      gap: 2,
    },
    earnLabel: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 10,
    },
    earnText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
    },
    earnAmount: {
      color: palette.accent,
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
    },
    toolGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    toolAction: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 16,
      borderWidth: 1,
      flexBasis: '31%',
      flexGrow: 1,
      gap: 6,
      minHeight: 82,
      padding: 9,
    },
    toolActionIcon: {
      alignItems: 'center',
      backgroundColor: palette.accentSoft,
      borderRadius: 999,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    toolActionLabel: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 9,
      textAlign: 'center',
    },
    progressCard: {
      backgroundColor: palette.surface,
      borderColor: isDark ? '#2D6548' : '#DCE9D4',
      borderRadius: 20,
      borderWidth: 1,
      gap: 10,
      padding: 13,
    },
    pointsValue: {
      color: palette.accent,
      fontFamily: AppFonts.extraBold,
      fontSize: 15,
    },
    progressTrack: {
      backgroundColor: palette.accentSoft,
      borderRadius: 999,
      height: 8,
      overflow: 'hidden',
    },
    progressFill: {
      backgroundColor: palette.accent,
      borderRadius: 999,
      height: '100%',
    },
    rankRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    rankStep: {
      alignItems: 'center',
      flex: 1,
      gap: 3,
    },
    rankDot: {
      backgroundColor: palette.border,
      borderRadius: 999,
      height: 8,
      width: 8,
    },
    rankDotActive: {
      backgroundColor: palette.accent,
      height: 10,
      width: 10,
    },
    rankLabel: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 7,
      textAlign: 'center',
    },
    rankLabelActive: {
      color: palette.accent,
      fontFamily: AppFonts.extraBold,
    },
    progressText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      textAlign: 'center',
    },
    programCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      overflow: 'hidden',
    },
    programRow: {
      alignItems: 'center',
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 10,
      minHeight: 76,
      padding: 11,
    },
    programRowLast: {
      borderBottomWidth: 0,
    },
    programIcon: {
      alignItems: 'center',
      backgroundColor: palette.accentSoft,
      borderRadius: 12,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    programCopy: {
      flex: 1,
      gap: 2,
    },
    programLabel: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 10,
    },
    programText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
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
      justifyContent: 'space-around',
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
    navIconWrap: {
      position: 'relative',
    },
    navBadge: {
      backgroundColor: palette.orange,
      borderColor: palette.surface,
      borderRadius: 999,
      borderWidth: 1.5,
      height: 8,
      position: 'absolute',
      right: -2,
      top: -2,
      width: 8,
    },
    navLabelActive: {
      color: palette.accent,
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