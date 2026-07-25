import { router } from 'expo-router';
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  Bell,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Home,
  Image as ImageIcon,
  Link2,
  MessageCircle,
  MousePointerClick,
  PawPrint,
  QrCode,
  RefreshCw,
  Share2,
  TrendingUp,
  UserRound,
  Users,
  WalletCards
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
  Alert,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import SitGuruWorkspaceSwitcher from '@/components/SitGuruWorkspaceSwitcher';
import { AppFonts } from '@/constants/fonts';
import { getAppTheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { resolveSupabaseStorageUrl } from '@/lib/storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type RecordRow = Record<string, unknown>;

type AmbassadorRecord = {
  id: string;
  user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  contact_email?: string | null;
  login_email?: string | null;
  referral_code?: string | null;
  status?: string | null;
};

type ReferralCodeRow = {
  id?: string | null;
  code?: string | null;
  slug?: string | null;
  ambassador_id?: string | null;
  status?: string | null;
};

type ReferralClickRow = {
  id?: string | null;
  referral_code_id?: string | null;
  landing_page?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  created_at?: string | null;
};

type AmbassadorReferralRow = {
  id?: string | null;
  ambassador_id?: string | null;
  referral_type?: string | null;
  status?: string | null;
  booking_status?: string | null;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  platform?: string | null;
  referral_source?: string | null;
  referral_medium?: string | null;
  referral_campaign?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  display_name?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  qualified_at?: string | null;
  signup_date?: string | null;
  completed_booking_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type RewardRow = {
  id?: string | null;
  amount?: number | string | null;
  reward_amount?: number | string | null;
  payout_amount?: number | string | null;
  status?: string | null;
  financial_status?: string | null;
  payout_status?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
};

type TrendPoint = {
  key: string;
  label: string;
  visits: number;
  signups: number;
};

type ChannelMetric = {
  key: string;
  label: string;
  visits: number;
  signups: number;
};

type RecentReferral = {
  id: string;
  name: string;
  type: string;
  status: string;
  channel: string;
  date: string;
};

type AnalyticsData = {
  ambassador: AmbassadorRecord | null;
  referralCode: ReferralCodeRow | null;
  clicks: ReferralClickRow[];
  referrals: AmbassadorReferralRow[];
  rewards: RewardRow[];
  warning: string;
};

type AnalyticsSummary = {
  visits: number;
  referrals: number;
  petParents: number;
  gurus: number;
  businesses: number;
  qualified: number;
  completedBookings: number;
  conversionRate: number;
  pendingRewards: number;
  approvedRewards: number;
  paidRewards: number;
  lifetimeRewards: number;
};

type Theme = ReturnType<typeof getAppTheme>;

const Fonts = {
  regular: AppFonts.regular,
  medium: AppFonts.medium,
  semiBold: AppFonts.semiBold,
  bold: AppFonts.bold,
  extraBold: AppFonts.extraBold,
} as const;

const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  x: 'X',
  twitter: 'X',
  youtube: 'YouTube',
  qr: 'QR Code',
  link: 'Direct Link',
  referral: 'Referral Link',
  unknown: 'Unattributed',
};

function asString(value: unknown) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

function asNumber(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[$,%\s,()]/g, ''));
    if (!Number.isFinite(parsed)) return 0;
    return value.includes('(') ? -parsed : parsed;
  }

  return 0;
}

function normalize(value: unknown) {
  return asString(value)
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = asString(value);
    if (text) return text;
  }

  return '';
}

function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function percent(value: number) {
  const clean = Number.isFinite(value) ? Math.max(0, value) : 0;
  return `${clean.toFixed(1)}%`;
}

function formatDate(value?: string | null) {
  const clean = asString(value);
  if (!clean) return 'Date unavailable';

  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) return 'Date unavailable';

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeReferralType(value?: string | null) {
  const type = normalize(value);

  if (
    ['pet parent', 'customer', 'pet owner', 'parent'].includes(type)
  ) {
    return 'pet_parent';
  }

  if (
    ['guru', 'provider', 'sitter', 'walker', 'future guru'].includes(
      type,
    )
  ) {
    return 'guru';
  }

  if (['business', 'partner', 'community'].includes(type)) {
    return 'business';
  }

  return type || 'referral';
}

function isQualified(row: AmbassadorReferralRow) {
  const status = normalize(row.status);
  const bookingStatus = normalize(row.booking_status);

  return Boolean(
    row.qualified_at ||
      row.completed_booking_at ||
      [
        'qualified',
        'approved',
        'active',
        'booking completed',
        'completed',
      ].includes(status) ||
      ['completed', 'booking completed'].includes(bookingStatus),
  );
}

function isCompletedBooking(row: AmbassadorReferralRow) {
  const bookingStatus = normalize(row.booking_status);
  const status = normalize(row.status);

  return Boolean(
    row.completed_booking_at ||
      ['booking completed', 'completed'].includes(bookingStatus) ||
      status === 'booking completed',
  );
}

function getReferralDate(row: AmbassadorReferralRow) {
  return firstText(
    row.completed_booking_at,
    row.qualified_at,
    row.signup_date,
    row.created_at,
    row.updated_at,
  );
}

function normalizeChannelValue(value: unknown) {
  const normalized = normalize(value);

  if (!normalized) return '';

  if (
    normalized === 'twitter' ||
    normalized === 'twitter x' ||
    normalized === 'x.com'
  ) {
    return 'x';
  }

  if (normalized.includes('facebook')) return 'facebook';
  if (normalized.includes('instagram')) return 'instagram';
  if (normalized.includes('tiktok')) return 'tiktok';
  if (normalized.includes('youtube')) return 'youtube';
  if (normalized === 'x') return 'x';
  if (normalized === 'qr') return 'qr';
  if (normalized.includes('link')) return 'link';
  if (normalized.includes('referral')) return 'referral';

  return normalized.replace(/\s+/g, '_');
}

function getClickChannel(row: ReferralClickRow) {
  const candidates = [
    row.utm_source,
    row.utm_campaign,
    row.utm_medium,
  ];

  for (const candidate of candidates) {
    const channel = normalizeChannelValue(candidate);
    if (channel && channel !== 'qr' && channel !== 'link') {
      return channel;
    }
  }

  const landingPage = asString(row.landing_page).toLowerCase();

  for (const key of [
    'facebook',
    'instagram',
    'tiktok',
    'youtube',
  ]) {
    if (landingPage.includes(`/${key}`)) return key;
  }

  if (landingPage.includes('/x')) return 'x';

  const medium = normalize(row.utm_medium);
  if (medium === 'qr' || landingPage.includes('via=qr')) {
    return 'qr';
  }

  return 'link';
}

function getReferralChannel(row: AmbassadorReferralRow) {
  const candidates = [
    row.platform,
    row.utm_source,
    row.source,
    row.referral_source,
    row.utm_campaign,
    row.campaign,
    row.referral_campaign,
    row.utm_medium,
    row.medium,
    row.referral_medium,
  ];

  for (const candidate of candidates) {
    const channel = normalizeChannelValue(candidate);
    if (channel) return channel;
  }

  return 'unknown';
}

function getChannelLabel(key: string) {
  return PLATFORM_LABELS[key] || titleCase(key);
}

function getRewardAmount(row: RewardRow) {
  return (
    asNumber(row.amount) ||
    asNumber(row.reward_amount) ||
    asNumber(row.payout_amount)
  );
}

function getRewardBucket(row: RewardRow) {
  const status = normalize(row.status);
  const financialStatus = normalize(row.financial_status);
  const payoutStatus = normalize(row.payout_status);

  const excluded = new Set([
    'rejected',
    'ineligible',
    'void',
    'voided',
    'cancelled',
    'canceled',
    'refunded',
    'chargeback',
    'reversed',
  ]);

  if (
    excluded.has(status) ||
    excluded.has(financialStatus) ||
    excluded.has(payoutStatus)
  ) {
    return 'excluded';
  }

  const paid = new Set([
    'paid',
    'payout paid',
    'payout completed',
    'settled',
  ]);

  if (
    asString(row.paid_at) ||
    paid.has(status) ||
    paid.has(financialStatus) ||
    paid.has(payoutStatus)
  ) {
    return 'paid';
  }

  const approved = new Set([
    'approved',
    'approved unpaid',
    'payable',
    'ready for payout',
    'queued for payout',
    'queued',
  ]);

  if (
    approved.has(status) ||
    approved.has(financialStatus) ||
    approved.has(payoutStatus)
  ) {
    return 'approved';
  }

  return 'pending';
}

function createTrend(
  clicks: ReferralClickRow[],
  referrals: AmbassadorReferralRow[],
  days = 14,
) {
  const now = new Date();
  const points: TrendPoint[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);

    const key = date.toISOString().slice(0, 10);

    points.push({
      key,
      label: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      visits: 0,
      signups: 0,
    });
  }

  const byDate = new Map(points.map((point) => [point.key, point]));

  clicks.forEach((row) => {
    const parsed = new Date(asString(row.created_at));
    if (Number.isNaN(parsed.getTime())) return;

    const point = byDate.get(parsed.toISOString().slice(0, 10));
    if (point) point.visits += 1;
  });

  referrals.forEach((row) => {
    const parsed = new Date(getReferralDate(row));
    if (Number.isNaN(parsed.getTime())) return;

    const point = byDate.get(parsed.toISOString().slice(0, 10));
    if (point) point.signups += 1;
  });

  return points;
}

function createChannelMetrics(
  clicks: ReferralClickRow[],
  referrals: AmbassadorReferralRow[],
) {
  const metrics = new Map<string, ChannelMetric>();

  function ensure(key: string) {
    const normalizedKey = key || 'unknown';
    const existing = metrics.get(normalizedKey);

    if (existing) return existing;

    const created: ChannelMetric = {
      key: normalizedKey,
      label: getChannelLabel(normalizedKey),
      visits: 0,
      signups: 0,
    };

    metrics.set(normalizedKey, created);
    return created;
  }

  clicks.forEach((row) => {
    ensure(getClickChannel(row)).visits += 1;
  });

  referrals.forEach((row) => {
    ensure(getReferralChannel(row)).signups += 1;
  });

  return [...metrics.values()]
    .sort(
      (left, right) =>
        right.signups +
        right.visits -
        (left.signups + left.visits),
    )
    .slice(0, 8);
}

function createRecentReferrals(rows: AmbassadorReferralRow[]) {
  return rows.slice(0, 10).map<RecentReferral>((row, index) => {
    const type = normalizeReferralType(row.referral_type);
    const status =
      firstText(row.booking_status, row.status) || 'Recorded';
    const location = [row.city, row.state]
      .map(asString)
      .filter(Boolean)
      .join(', ');

    return {
      id: asString(row.id) || `referral-${index}`,
      name:
        firstText(row.display_name, row.email) ||
        (type === 'guru'
          ? 'Future Guru'
          : type === 'business'
            ? 'Business Referral'
            : 'Pet Parent'),
      type:
        type === 'pet_parent'
          ? 'Pet Parent'
          : type === 'guru'
            ? 'Guru'
            : type === 'business'
              ? 'Business'
              : titleCase(type),
      status: titleCase(status),
      channel: `${getChannelLabel(getReferralChannel(row))}${
        location ? ` • ${location}` : ''
      }`,
      date: formatDate(getReferralDate(row)),
    };
  });
}

async function findAmbassador(
  userId: string,
  email?: string | null,
): Promise<AmbassadorRecord | null> {
  const byUser = await supabase
    .from('ambassadors')
    .select(
      'id, user_id, full_name, email, contact_email, login_email, referral_code, status',
    )
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (!byUser.error && byUser.data) {
    return byUser.data as AmbassadorRecord;
  }

  const cleanEmail = asString(email).toLowerCase();

  if (!cleanEmail) return null;

  for (const column of [
    'login_email',
    'contact_email',
    'email',
  ] as const) {
    const result = await supabase
      .from('ambassadors')
      .select(
        'id, user_id, full_name, email, contact_email, login_email, referral_code, status',
      )
      .eq(column, cleanEmail)
      .limit(1)
      .maybeSingle();

    if (!result.error && result.data) {
      return result.data as AmbassadorRecord;
    }
  }

  return null;
}

async function findReferralCode(
  ambassadorId: string,
  referralCode: string,
): Promise<ReferralCodeRow | null> {
  const byAmbassador = await supabase
    .from('referral_codes')
    .select('id, code, slug, ambassador_id, status')
    .eq('ambassador_id', ambassadorId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (!byAmbassador.error && byAmbassador.data) {
    return byAmbassador.data as ReferralCodeRow;
  }

  if (!referralCode) return null;

  const byCode = await supabase
    .from('referral_codes')
    .select('id, code, slug, ambassador_id, status')
    .ilike('code', referralCode)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (!byCode.error && byCode.data) {
    return byCode.data as ReferralCodeRow;
  }

  return null;
}

async function loadAnalytics(
  userId: string,
  email?: string | null,
): Promise<AnalyticsData> {
  const warnings: string[] = [];
  const ambassador = await findAmbassador(userId, email);

  if (!ambassador) {
    return {
      ambassador: null,
      referralCode: null,
      clicks: [],
      referrals: [],
      rewards: [],
      warning:
        'Your Ambassador record could not be matched to this account.',
    };
  }

  const referralCode = firstText(ambassador.referral_code);

  const [referralsResult, rewardsResult, referralCodeRow] =
    await Promise.all([
      supabase
        .from('ambassador_referrals')
        .select('*')
        .eq('ambassador_id', ambassador.id)
        .order('created_at', { ascending: false })
        .limit(5000),
      supabase
        .from('ambassador_rewards')
        .select('*')
        .eq('ambassador_id', ambassador.id)
        .order('created_at', { ascending: false })
        .limit(2000),
      findReferralCode(ambassador.id, referralCode),
    ]);

  if (referralsResult.error) {
    warnings.push('Verified referral totals could not be loaded.');
  }

  if (rewardsResult.error) {
    warnings.push('Reward totals could not be loaded.');
  }

  let clicks: ReferralClickRow[] = [];
  const referralCodeId = asString(referralCodeRow?.id);

  if (referralCodeId) {
    const clicksResult = await supabase
      .from('referral_clicks')
      .select('*')
      .eq('referral_code_id', referralCodeId)
      .order('created_at', { ascending: false })
      .limit(10000);

    if (clicksResult.error) {
      warnings.push('Tracked link and QR activity could not be loaded.');
    } else {
      clicks = (clicksResult.data || []) as ReferralClickRow[];
    }
  }

  return {
    ambassador,
    referralCode: referralCodeRow,
    clicks,
    referrals:
      (referralsResult.data || []) as AmbassadorReferralRow[],
    rewards: (rewardsResult.data || []) as RewardRow[],
    warning: warnings.join(' '),
  };
}

function SummaryTile({
  label,
  value,
  detail,
  icon,
  styles,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.summaryTile}>
      <View style={styles.summaryIcon}>{icon}</View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryDetail}>{detail}</Text>
    </View>
  );
}

function PhoneStatusBar({
  styles,
  theme,
}: {
  styles: ReturnType<typeof createStyles>;
  theme: Theme;
}) {
  return (
    <View style={styles.statusBar}>
      <Text style={styles.statusTime}>9:41</Text>

      <View style={styles.statusIcons}>
        <View style={styles.signalBars}>
          {[5, 7, 9].map((height) => (
            <View
              key={height}
              style={[
                styles.signalBar,
                {
                  height,
                  backgroundColor: theme.colors.text,
                },
              ]}
            />
          ))}
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

export default function AmbassadorReferralAnalyticsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = getAppTheme(isDark ? 'dark' : 'light');
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isWebPreview = Platform.OS === 'web';

  const { user, profile, roles, loading: authLoading } = useAuth();

  const [data, setData] = useState<AnalyticsData>({
    ambassador: null,
    referralCode: null,
    clicks: [],
    referrals: [],
    rewards: [],
    warning: '',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false);

  const hasAmbassadorRole = roles.includes('ambassador');

  const profileRecord = useMemo(
    () => (profile ?? {}) as RecordRow,
    [profile],
  );
  const metadata = (user?.user_metadata ?? {}) as RecordRow;

  const profileName =
    firstText(
      data.ambassador?.full_name,
      profileRecord.full_name,
      profileRecord.display_name,
      [profile?.first_name, profile?.last_name]
        .filter(Boolean)
        .join(' '),
      metadata.full_name,
      metadata.name,
      user?.email?.split('@')[0],
    ) || 'Ambassador';

  const firstName =
    profileName.split(/\s+/).filter(Boolean)[0] || 'Ambassador';

  const rawAvatar = firstText(
    profileRecord.avatar_url,
    profileRecord.photo_url,
    profileRecord.profile_photo_url,
    profileRecord.profile_image_url,
    metadata.avatar_url,
    metadata.picture,
  );

  const avatarUrl = rawAvatar
    ? resolveSupabaseStorageUrl(rawAvatar)
    : null;

  const refreshAnalytics = useCallback(
    async (showRefresh = false) => {
      if (!user?.id || !isSupabaseConfigured) {
        setLoading(false);
        setRefreshing(false);
        setLoadError(
          isSupabaseConfigured
            ? ''
            : 'SitGuru data is not configured on this device.',
        );
        return;
      }

      showRefresh ? setRefreshing(true) : setLoading(true);

      try {
        const nextData = await loadAnalytics(user.id, user.email);
        setData(nextData);
        setLoadError('');
      } catch {
        setLoadError(
          'Referral analytics could not be loaded. Pull down to try again.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.email, user?.id],
  );

  useEffect(() => {
    if (!authLoading) {
      void refreshAnalytics(false);
    }
  }, [authLoading, refreshAnalytics]);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured || authLoading) {
      return;
    }

    let effectActive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const refreshSoon = () => {
      if (!effectActive) return;

      if (timer) clearTimeout(timer);

      timer = setTimeout(() => {
        if (effectActive) {
          void refreshAnalytics(false);
        }
      }, 450);
    };

    const channel = supabase.channel(
      [
        'ambassador-referral-analytics',
        user.id,
        Date.now().toString(36),
        Math.random().toString(36).slice(2, 8),
      ].join('-'),
    );

    [
      'ambassadors',
      'referral_codes',
      'referral_clicks',
      'ambassador_referrals',
      'ambassador_rewards',
    ].forEach((table) => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        refreshSoon,
      );
    });

    channel.subscribe();

    return () => {
      effectActive = false;

      if (timer) clearTimeout(timer);

      void supabase.removeChannel(channel);
    };
  }, [authLoading, refreshAnalytics, user?.id]);

  const summary = useMemo<AnalyticsSummary>(() => {
    const referrals = data.referrals;
    const visits = data.clicks.length;
    const qualified = referrals.filter(isQualified).length;
    const completedBookings = referrals.filter(
      isCompletedBooking,
    ).length;

    const petParents = referrals.filter(
      (row) =>
        normalizeReferralType(row.referral_type) === 'pet_parent',
    ).length;
    const gurus = referrals.filter(
      (row) => normalizeReferralType(row.referral_type) === 'guru',
    ).length;
    const businesses = referrals.filter(
      (row) =>
        normalizeReferralType(row.referral_type) === 'business',
    ).length;

    let pendingRewards = 0;
    let approvedRewards = 0;
    let paidRewards = 0;

    data.rewards.forEach((reward) => {
      const amount = getRewardAmount(reward);
      const bucket = getRewardBucket(reward);

      if (bucket === 'pending') pendingRewards += amount;
      if (bucket === 'approved') approvedRewards += amount;
      if (bucket === 'paid') paidRewards += amount;
    });

    return {
      visits,
      referrals: referrals.length,
      petParents,
      gurus,
      businesses,
      qualified,
      completedBookings,
      conversionRate:
        visits > 0 ? (referrals.length / visits) * 100 : 0,
      pendingRewards,
      approvedRewards,
      paidRewards,
      lifetimeRewards:
        pendingRewards + approvedRewards + paidRewards,
    };
  }, [data.clicks.length, data.referrals, data.rewards]);

  const trend = useMemo(
    () => createTrend(data.clicks, data.referrals),
    [data.clicks, data.referrals],
  );
  const channels = useMemo(
    () => createChannelMetrics(data.clicks, data.referrals),
    [data.clicks, data.referrals],
  );
  const recentReferrals = useMemo(
    () => createRecentReferrals(data.referrals),
    [data.referrals],
  );

  const maxTrendValue = Math.max(
    1,
    ...trend.flatMap((point) => [point.visits, point.signups]),
  );

  const referralCode = firstText(
    data.referralCode?.code,
    data.ambassador?.referral_code,
  );
  const referralSlug = firstText(data.referralCode?.slug);
  const referralLink = referralCode
    ? referralSlug
      ? `https://www.sitguru.com/r/${encodeURIComponent(referralSlug)}`
      : `https://www.sitguru.com/signup?ref=${encodeURIComponent(referralCode)}`
    : '';

  function go(path: string) {
    router.push(path as never);
  }

  async function shareReferralLink() {
    if (!referralLink) {
      Alert.alert(
        'Referral code needed',
        'Your Ambassador referral code has not been assigned yet. Open Support for help.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Support', onPress: () => go('/support') },
        ],
      );
      return;
    }

    try {
      await Share.share({
        message: `Join SitGuru with my referral link: ${referralLink}`,
        title: 'Join SitGuru',
        url: referralLink,
      });
    } catch {
      Alert.alert(
        'Share unavailable',
        'The referral link could not be shared from this device.',
      );
    }
  }

  if (authLoading || loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          color={theme.colors.primary}
          size="large"
        />
        <Text style={styles.loadingTitle}>
          Loading Referral Analytics
        </Text>
        <Text style={styles.loadingBody}>
          Connecting your tracked visits, referrals, and rewards.
        </Text>
      </View>
    );
  }

  if (!user || !hasAmbassadorRole) {
    return (
      <View style={styles.loadingScreen}>
        <UserRound
          color={theme.colors.primary}
          size={38}
          strokeWidth={2.2}
        />
        <Text style={styles.loadingTitle}>
          Ambassador workspace required
        </Text>
        <Text style={styles.loadingBody}>
          Sign in with an Ambassador account to view referral analytics.
        </Text>
        <Pressable
          onPress={() => go(user ? '/account' : '/login')}
          style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>
            {user ? 'Open account' : 'Sign in'}
          </Text>
        </Pressable>
      </View>
    );
  }

  const body = (
    <View style={styles.screen}>
      {isWebPreview ? (
        <PhoneStatusBar styles={styles} theme={theme} />
      ) : null}

      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>
            {'Referral\nAnalytics'}
          </Text>
          <Text style={styles.welcomeText}>
            Welcome back, {firstName}! 👋
          </Text>
          <View style={styles.roleRow}>
            <View style={styles.liveDot} />
            <Text style={styles.roleText}>Ambassador • Live</Text>
          </View>

          <Pressable
            onPress={() => go('/ambassador-dashboard')}
            style={styles.dashboardButton}>
            <ArrowLeft
              color={theme.colors.primary}
              size={12}
              strokeWidth={2.6}
            />
            <Text style={styles.dashboardButtonText}>
              Dashboard
            </Text>
          </Pressable>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => go('/notifications')}
            style={styles.headerIconButton}>
            <Bell
              color={theme.colors.text}
              size={18}
              strokeWidth={2.3}
            />
          </Pressable>

          <Pressable
            accessibilityLabel="Switch workspace"
            accessibilityRole="button"
            onPress={() => setWorkspaceSwitcherOpen(true)}
            style={styles.avatar}>
            {avatarUrl && !avatarFailed ? (
              <Image
                source={{ uri: avatarUrl }}
                onError={() => setAvatarFailed(true)}
                resizeMode="cover"
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>
                {(firstName[0] || 'A').toUpperCase()}
              </Text>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refreshAnalytics(true)}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIcon}>
              <BarChart3
                color={theme.colors.primary}
                size={21}
                strokeWidth={2.4}
              />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>
                Your Referral Performance
              </Text>
              <Text style={styles.heroTitle}>
                See what is working.
              </Text>
            </View>
          </View>

          <Text style={styles.heroBody}>
            Track visits, verified referrals, completed bookings,
            channel performance, and reward status from one place.
          </Text>

          <View style={styles.codeRow}>
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>Referral code</Text>
              <Text style={styles.codeValue}>
                {firstText(
                  data.referralCode?.code,
                  data.ambassador?.referral_code,
                ) || 'Not assigned'}
              </Text>
            </View>

            <Pressable
              onPress={() => void shareReferralLink()}
              style={styles.referralCenterButton}>
              <QrCode
                color="#FFFFFF"
                size={17}
                strokeWidth={2.4}
              />
              <Text style={styles.referralCenterText}>
                Share link
              </Text>
            </Pressable>
          </View>
        </View>

        {loadError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{loadError}</Text>
            <Pressable
              onPress={() => void refreshAnalytics(false)}
              style={styles.retryButton}>
              <RefreshCw
                color={theme.colors.danger}
                size={15}
                strokeWidth={2.4}
              />
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {data.warning ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>{data.warning}</Text>
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.summaryRow}>
          <SummaryTile
            label="Visits"
            value={String(summary.visits)}
            detail="Tracked link and QR traffic"
            styles={styles}
            icon={
              <MousePointerClick
                color={theme.colors.primary}
                size={19}
                strokeWidth={2.3}
              />
            }
          />
          <SummaryTile
            label="Referrals"
            value={String(summary.referrals)}
            detail={`${summary.qualified} qualified`}
            styles={styles}
            icon={
              <Users
                color={theme.colors.primary}
                size={19}
                strokeWidth={2.3}
              />
            }
          />
          <SummaryTile
            label="Conversion"
            value={percent(summary.conversionRate)}
            detail="Visits converted to referrals"
            styles={styles}
            icon={
              <TrendingUp
                color={theme.colors.primary}
                size={19}
                strokeWidth={2.3}
              />
            }
          />
          <SummaryTile
            label="Bookings"
            value={String(summary.completedBookings)}
            detail="Completed referral bookings"
            styles={styles}
            icon={
              <PawPrint
                color={theme.colors.primary}
                size={19}
                strokeWidth={2.3}
              />
            }
          />
        </ScrollView>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.eyebrow}>Referral Mix</Text>
              <Text style={styles.sectionTitle}>
                Who you are bringing to SitGuru
              </Text>
            </View>
          </View>

          <View style={styles.mixGrid}>
            <View style={styles.mixCard}>
              <UserRound
                color={theme.colors.primary}
                size={19}
                strokeWidth={2.3}
              />
              <Text style={styles.mixValue}>
                {summary.petParents}
              </Text>
              <Text style={styles.mixLabel}>Pet Parents</Text>
            </View>

            <View style={styles.mixCard}>
              <PawPrint
                color={theme.colors.primary}
                size={19}
                strokeWidth={2.3}
              />
              <Text style={styles.mixValue}>{summary.gurus}</Text>
              <Text style={styles.mixLabel}>Gurus</Text>
            </View>

            <View style={styles.mixCard}>
              <ImageIcon
                color={theme.colors.primary}
                size={19}
                strokeWidth={2.3}
              />
              <Text style={styles.mixValue}>
                {summary.businesses}
              </Text>
              <Text style={styles.mixLabel}>Businesses</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.eyebrow}>14-Day Activity</Text>
              <Text style={styles.sectionTitle}>
                Visits and verified signups
              </Text>
            </View>

            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: theme.colors.primary },
                  ]}
                />
                <Text style={styles.legendText}>Visits</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: theme.colors.info },
                  ]}
                />
                <Text style={styles.legendText}>Signups</Text>
              </View>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chartRow}>
            {trend.map((point) => (
              <View key={point.key} style={styles.chartPoint}>
                <View style={styles.chartBars}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: Math.max(
                          point.visits > 0 ? 8 : 2,
                          Math.round(
                            (point.visits / maxTrendValue) * 82,
                          ),
                        ),
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: Math.max(
                          point.signups > 0 ? 8 : 2,
                          Math.round(
                            (point.signups / maxTrendValue) * 82,
                          ),
                        ),
                        backgroundColor: theme.colors.info,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.chartLabel}>{point.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.eyebrow}>Channel Performance</Text>
              <Text style={styles.sectionTitle}>
                Where your results come from
              </Text>
            </View>
          </View>

          <View style={styles.channelList}>
            {channels.length > 0 ? (
              channels.map((channel, index) => {
                const total = channel.visits + channel.signups;
                const bestTotal = Math.max(
                  1,
                  ...channels.map(
                    (item) => item.visits + item.signups,
                  ),
                );

                return (
                  <View key={channel.key} style={styles.channelRow}>
                    <View style={styles.channelRank}>
                      <Text style={styles.channelRankText}>
                        {index + 1}
                      </Text>
                    </View>

                    <View style={styles.channelCopy}>
                      <View style={styles.channelTopRow}>
                        <Text style={styles.channelName}>
                          {channel.label}
                        </Text>
                        <Text style={styles.channelResult}>
                          {channel.signups} signups
                        </Text>
                      </View>

                      <View style={styles.channelTrack}>
                        <View
                          style={[
                            styles.channelFill,
                            {
                              width: `${Math.max(
                                4,
                                (total / bestTotal) * 100,
                              )}%`,
                            },
                          ]}
                        />
                      </View>

                      <Text style={styles.channelDetail}>
                        {channel.visits} visits •{' '}
                        {channel.visits > 0
                          ? percent(
                              (channel.signups /
                                channel.visits) *
                                100,
                            )
                          : '0.0%'}{' '}
                        conversion
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Share2
                  color={theme.colors.primary}
                  size={28}
                  strokeWidth={2.2}
                />
                <Text style={styles.emptyTitle}>
                  No channel activity yet
                </Text>
                <Text style={styles.emptyBody}>
                  Share your tracked link and QR codes to begin
                  building channel analytics.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.eyebrow}>Rewards</Text>
              <Text style={styles.sectionTitle}>
                Eligibility and payout status
              </Text>
            </View>
            <WalletCards
              color={theme.colors.primary}
              size={21}
              strokeWidth={2.3}
            />
          </View>

          <View style={styles.rewardGrid}>
            <View style={styles.rewardCard}>
              <Clock3
                color={theme.colors.warning}
                size={18}
                strokeWidth={2.3}
              />
              <Text style={styles.rewardValue}>
                {money(summary.pendingRewards)}
              </Text>
              <Text style={styles.rewardLabel}>Pending review</Text>
            </View>

            <View style={styles.rewardCard}>
              <BadgeCheck
                color={theme.colors.info}
                size={18}
                strokeWidth={2.3}
              />
              <Text style={styles.rewardValue}>
                {money(summary.approvedRewards)}
              </Text>
              <Text style={styles.rewardLabel}>Approved</Text>
            </View>

            <View style={styles.rewardCard}>
              <CheckCircle2
                color={theme.colors.primary}
                size={18}
                strokeWidth={2.3}
              />
              <Text style={styles.rewardValue}>
                {money(summary.paidRewards)}
              </Text>
              <Text style={styles.rewardLabel}>Paid</Text>
            </View>
          </View>

          <View style={styles.lifetimeRow}>
            <View>
              <Text style={styles.lifetimeLabel}>
                Lifetime reward value
              </Text>
              <Text style={styles.lifetimeValue}>
                {money(summary.lifetimeRewards)}
              </Text>
            </View>

            <Pressable
              onPress={() => go('/payments')}
              style={styles.smallActionButton}>
              <CircleDollarSign
                color={theme.colors.primary}
                size={15}
                strokeWidth={2.3}
              />
              <Text style={styles.smallActionText}>
                Rewards
              </Text>
            </Pressable>
          </View>

          <Text style={styles.rewardNote}>
            Clicks, scans, and incomplete signups do not create a
            reward. Eligibility remains tied to SitGuru’s verified
            referral and booking rules.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.eyebrow}>Recent Referrals</Text>
              <Text style={styles.sectionTitle}>
                Latest attributed activity
              </Text>
            </View>
          </View>

          <View style={styles.recentList}>
            {recentReferrals.length > 0 ? (
              recentReferrals.map((referral) => (
                <View key={referral.id} style={styles.recentRow}>
                  <View style={styles.recentIcon}>
                    <UserRound
                      color={theme.colors.primary}
                      size={17}
                      strokeWidth={2.3}
                    />
                  </View>

                  <View style={styles.recentCopy}>
                    <Text style={styles.recentName}>
                      {referral.name}
                    </Text>
                    <Text style={styles.recentMeta}>
                      {referral.type} • {referral.channel}
                    </Text>
                    <Text style={styles.recentDate}>
                      {referral.date}
                    </Text>
                  </View>

                  <View style={styles.statusPill}>
                    <Text style={styles.statusText}>
                      {referral.status}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Users
                  color={theme.colors.primary}
                  size={28}
                  strokeWidth={2.2}
                />
                <Text style={styles.emptyTitle}>
                  No referrals recorded yet
                </Text>
                <Text style={styles.emptyBody}>
                  New attributed Pet Parent, Guru, and business
                  referrals will appear here.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <Pressable
          onPress={() => go('/ambassador-dashboard')}
          style={styles.navItem}>
          <Home
            color={theme.colors.textSecondary}
            size={20}
            strokeWidth={2.3}
          />
          <Text style={styles.navLabel}>Home</Text>
        </Pressable>

        <Pressable
          onPress={() => go('/ambassador-dashboard')}
          style={styles.navItem}>
          <Link2
            color={theme.colors.textSecondary}
            size={20}
            strokeWidth={2.3}
          />
          <Text style={styles.navLabel}>Referrals</Text>
        </Pressable>

        <Pressable style={styles.navItem}>
          <BarChart3
            color={theme.colors.primary}
            size={20}
            strokeWidth={2.4}
          />
          <Text style={[styles.navLabel, styles.navLabelActive]}>
            Analytics
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.push({
              pathname: '/messages',
              params: { role: 'ambassador' },
            })
          }
          style={styles.navItem}>
          <MessageCircle
            color={theme.colors.textSecondary}
            size={20}
            strokeWidth={2.3}
          />
          <Text style={styles.navLabel}>Messages</Text>
        </Pressable>

        <Pressable
          onPress={() => setWorkspaceSwitcherOpen(true)}
          style={styles.navItem}>
          <UserRound
            color={theme.colors.textSecondary}
            size={20}
            strokeWidth={2.3}
          />
          <Text style={styles.navLabel}>Profile</Text>
        </Pressable>
      </View>

      <SitGuruWorkspaceSwitcher
        currentRole="ambassador"
        onClose={() => setWorkspaceSwitcherOpen(false)}
        visible={workspaceSwitcherOpen}
      />
    </View>
  );

  if (!isWebPreview) {
    return body;
  }

  return (
    <View style={styles.previewCanvas}>
      <View style={styles.deviceFrame}>
        <View style={styles.deviceTopSpeaker} />
        <View style={styles.phoneShell}>{body}</View>
        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    previewCanvas: {
      alignItems: 'center',
      backgroundColor: theme.colors.screenAlt,
      flex: 1,
      justifyContent: 'flex-start',
      minHeight: 930,
      paddingHorizontal: 16,
      paddingVertical: 22,
      width: '100%',
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
    homeIndicator: {
      alignSelf: 'center',
      backgroundColor: '#F3F1EA',
      borderRadius: 999,
      height: 5,
      marginTop: 9,
      width: 116,
    },
    screen: {
      backgroundColor: theme.colors.screen,
      flex: 1,
      width: '100%',
    },
    loadingScreen: {
      alignItems: 'center',
      backgroundColor: theme.colors.screen,
      flex: 1,
      gap: 12,
      justifyContent: 'center',
      padding: 28,
    },
    loadingTitle: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 23,
      textAlign: 'center',
    },
    loadingBody: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.medium,
      fontSize: 14,
      lineHeight: 21,
      maxWidth: 340,
      textAlign: 'center',
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
    header: {
      alignItems: 'flex-start',
      backgroundColor: theme.colors.elevatedCard,
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 10,
      paddingBottom: 10,
      paddingHorizontal: 16,
      paddingTop: 6,
    },
    headerCopy: {
      flex: 1,
      minWidth: 0,
    },
    headerTitle: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 20,
      letterSpacing: -0.5,
      lineHeight: 22,
    },
    welcomeText: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.medium,
      fontSize: 9,
      marginTop: 3,
    },
    roleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 5,
      marginTop: 2,
    },
    liveDot: {
      backgroundColor: theme.colors.primary,
      borderRadius: 4,
      height: 6,
      width: 6,
    },
    roleText: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.medium,
      fontSize: 8,
    },
    dashboardButton: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 4,
      marginTop: 6,
      minHeight: 27,
      paddingHorizontal: 9,
      paddingVertical: 4,
    },
    dashboardButtonText: {
      color: theme.colors.primary,
      fontFamily: Fonts.extraBold,
      fontSize: 8,
    },
    headerActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 7,
      paddingTop: 3,
    },
    headerIconButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.softCard,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 38,
      justifyContent: 'center',
      width: 38,
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
      gap: 12,
      paddingHorizontal: 14,
      paddingTop: 14,
    },
    hero: {
      backgroundColor: theme.colors.heroBackground,
      borderColor: theme.colors.border,
      borderRadius: 24,
      borderWidth: 1,
      padding: 16,
    },
    heroTopRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    heroIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 15,
      borderWidth: 1,
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    heroCopy: {
      flex: 1,
    },
    eyebrow: {
      color: theme.colors.primary,
      fontFamily: Fonts.extraBold,
      fontSize: 8,
      letterSpacing: 0.9,
      textTransform: 'uppercase',
    },
    heroTitle: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 22,
      letterSpacing: -0.6,
      lineHeight: 27,
      marginTop: 2,
    },
    heroBody: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.semiBold,
      fontSize: 11,
      lineHeight: 18,
      marginTop: 10,
    },
    codeRow: {
      flexDirection: 'row',
      gap: 9,
      marginTop: 13,
    },
    codeCard: {
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 14,
      borderWidth: 1,
      flex: 1,
      paddingHorizontal: 11,
      paddingVertical: 9,
    },
    codeLabel: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.extraBold,
      fontSize: 7,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    codeValue: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 13,
      marginTop: 2,
    },
    referralCenterButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: 14,
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      paddingHorizontal: 12,
    },
    referralCenterText: {
      color: '#FFFFFF',
      fontFamily: Fonts.extraBold,
      fontSize: 9,
    },
    errorBanner: {
      backgroundColor: `${theme.colors.danger}14`,
      borderColor: theme.colors.danger,
      borderRadius: 15,
      borderWidth: 1,
      gap: 8,
      padding: 11,
    },
    errorText: {
      color: theme.colors.text,
      fontFamily: Fonts.bold,
      fontSize: 10,
      lineHeight: 16,
    },
    retryButton: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      flexDirection: 'row',
      gap: 5,
    },
    retryText: {
      color: theme.colors.danger,
      fontFamily: Fonts.extraBold,
      fontSize: 9,
    },
    warningBanner: {
      backgroundColor: `${theme.colors.warning}16`,
      borderColor: theme.colors.warning,
      borderRadius: 15,
      borderWidth: 1,
      padding: 11,
    },
    warningText: {
      color: theme.colors.text,
      fontFamily: Fonts.bold,
      fontSize: 10,
      lineHeight: 16,
    },
    summaryRow: {
      gap: 9,
      paddingRight: 14,
    },
    summaryTile: {
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 18,
      borderWidth: 1,
      minHeight: 132,
      padding: 12,
      width: 128,
    },
    summaryIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 12,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    summaryLabel: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.extraBold,
      fontSize: 8,
      letterSpacing: 0.7,
      marginTop: 10,
      textTransform: 'uppercase',
    },
    summaryValue: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 22,
      lineHeight: 27,
      marginTop: 3,
    },
    summaryDetail: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.medium,
      fontSize: 8,
      lineHeight: 13,
      marginTop: 2,
    },
    sectionCard: {
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 22,
      borderWidth: 1,
      padding: 14,
    },
    sectionHeader: {
      alignItems: 'flex-start',
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: 11,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 17,
      letterSpacing: -0.3,
      lineHeight: 22,
      marginTop: 3,
    },
    mixGrid: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    mixCard: {
      alignItems: 'center',
      backgroundColor: theme.colors.softCard,
      borderColor: theme.colors.border,
      borderRadius: 15,
      borderWidth: 1,
      flex: 1,
      paddingHorizontal: 6,
      paddingVertical: 12,
    },
    mixValue: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 20,
      marginTop: 6,
    },
    mixLabel: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.bold,
      fontSize: 8,
      marginTop: 2,
      textAlign: 'center',
    },
    legend: {
      gap: 4,
    },
    legendItem: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
    },
    legendDot: {
      borderRadius: 3,
      height: 6,
      width: 6,
    },
    legendText: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.bold,
      fontSize: 8,
    },
    chartRow: {
      alignItems: 'flex-end',
      gap: 7,
      minHeight: 126,
      paddingRight: 12,
      paddingTop: 14,
    },
    chartPoint: {
      alignItems: 'center',
      width: 30,
    },
    chartBars: {
      alignItems: 'flex-end',
      backgroundColor: theme.colors.softCard,
      borderRadius: 8,
      flexDirection: 'row',
      gap: 3,
      height: 92,
      justifyContent: 'center',
      paddingHorizontal: 4,
      paddingTop: 6,
      width: 28,
    },
    chartBar: {
      borderRadius: 3,
      width: 6,
    },
    chartLabel: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.bold,
      fontSize: 7,
      marginTop: 5,
      textAlign: 'center',
    },
    channelList: {
      gap: 11,
      paddingTop: 12,
    },
    channelRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    channelRank: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 12,
      height: 32,
      justifyContent: 'center',
      width: 32,
    },
    channelRankText: {
      color: theme.colors.primary,
      fontFamily: Fonts.extraBold,
      fontSize: 11,
    },
    channelCopy: {
      flex: 1,
    },
    channelTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    channelName: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 10,
    },
    channelResult: {
      color: theme.colors.primary,
      fontFamily: Fonts.extraBold,
      fontSize: 9,
    },
    channelTrack: {
      backgroundColor: theme.colors.softCard,
      borderRadius: 99,
      height: 7,
      marginTop: 5,
      overflow: 'hidden',
    },
    channelFill: {
      backgroundColor: theme.colors.primary,
      borderRadius: 99,
      height: '100%',
    },
    channelDetail: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.medium,
      fontSize: 8,
      marginTop: 4,
    },
    rewardGrid: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    rewardCard: {
      alignItems: 'center',
      backgroundColor: theme.colors.softCard,
      borderColor: theme.colors.border,
      borderRadius: 15,
      borderWidth: 1,
      flex: 1,
      paddingHorizontal: 5,
      paddingVertical: 11,
    },
    rewardValue: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 15,
      marginTop: 6,
    },
    rewardLabel: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.bold,
      fontSize: 7,
      marginTop: 2,
      textAlign: 'center',
    },
    lifetimeRow: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
      padding: 11,
    },
    lifetimeLabel: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.bold,
      fontSize: 8,
    },
    lifetimeValue: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 20,
      marginTop: 2,
    },
    smallActionButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    smallActionText: {
      color: theme.colors.primary,
      fontFamily: Fonts.extraBold,
      fontSize: 8,
    },
    rewardNote: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.medium,
      fontSize: 8,
      lineHeight: 13,
      marginTop: 9,
    },
    recentList: {
      gap: 9,
      paddingTop: 12,
    },
    recentRow: {
      alignItems: 'center',
      backgroundColor: theme.colors.softCard,
      borderColor: theme.colors.border,
      borderRadius: 15,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 9,
      padding: 10,
    },
    recentIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 12,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    recentCopy: {
      flex: 1,
      minWidth: 0,
    },
    recentName: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 10,
    },
    recentMeta: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.medium,
      fontSize: 8,
      marginTop: 2,
    },
    recentDate: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.medium,
      fontSize: 7,
      marginTop: 2,
    },
    statusPill: {
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 999,
      maxWidth: 86,
      paddingHorizontal: 7,
      paddingVertical: 5,
    },
    statusText: {
      color: theme.colors.primary,
      fontFamily: Fonts.extraBold,
      fontSize: 7,
      textAlign: 'center',
    },
    emptyState: {
      alignItems: 'center',
      borderColor: theme.colors.border,
      borderRadius: 17,
      borderStyle: 'dashed',
      borderWidth: 1,
      gap: 7,
      paddingHorizontal: 16,
      paddingVertical: 22,
    },
    emptyTitle: {
      color: theme.colors.text,
      fontFamily: Fonts.extraBold,
      fontSize: 13,
      textAlign: 'center',
    },
    emptyBody: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.medium,
      fontSize: 9,
      lineHeight: 15,
      textAlign: 'center',
    },
    bottomSpacer: {
      height: 94,
    },
    bottomNav: {
      alignItems: 'center',
      backgroundColor: theme.colors.tabBar,
      borderTopColor: theme.colors.tabBarBorder,
      borderTopWidth: 1,
      bottom: 0,
      flexDirection: 'row',
      justifyContent: 'space-around',
      left: 0,
      minHeight: 70,
      paddingBottom: Platform.OS === 'ios' ? 16 : 8,
      paddingHorizontal: 8,
      paddingTop: 8,
      position: 'absolute',
      right: 0,
    },
    navItem: {
      alignItems: 'center',
      gap: 3,
      justifyContent: 'center',
      minWidth: 52,
    },
    navLabel: {
      color: theme.colors.textSecondary,
      fontFamily: Fonts.bold,
      fontSize: 8,
    },
    navLabelActive: {
      color: theme.colors.primary,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 999,
      marginTop: 8,
      paddingHorizontal: 18,
      paddingVertical: 11,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontFamily: Fonts.extraBold,
      fontSize: 12,
    },
  });
}