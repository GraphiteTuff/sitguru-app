import { router, type Href } from 'expo-router';
import {
  Activity,
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Headphones,
  HeartHandshake,
  Home,
  LifeBuoy,
  LockKeyhole,
  MessageCircle,
  PawPrint,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Star,
  UserRound,
  UserRoundCog,
  WalletCards,
} from 'lucide-react-native';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native';

import { SitGuruIcon } from '@/components/SitGuruIcon';
import SitGuruRoleStatus from '@/components/SitGuruRoleStatus';
import SitGuruScreen from '@/components/SitGuruScreen';
import SitGuruWorkspaceSwitcher from '@/components/SitGuruWorkspaceSwitcher';
import { AppFonts } from '@/constants/fonts';
import { getAppTheme } from '@/constants/theme';
import {
  setThemePreference,
  useColorScheme,
  useThemePreference,
  type SitGuruThemePreference,
} from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { resolveSupabaseStorageUrl } from '@/lib/storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { roleLabel, type AppRole } from '@/types/auth';

type SupportTopic =
  | 'Booking'
  | 'Messages'
  | 'Payment'
  | 'Payout'
  | 'PawReport'
  | 'Reviews'
  | 'Referral'
  | 'Safety'
  | 'Account'
  | 'Notifications'
  | 'Other';

type SupportPriority = 'normal' | 'urgent';

type SupportFeedback = {
  tone: 'success' | 'warning' | 'error';
  title: string;
  message: string;
};

type SupportRequestRow = Record<string, unknown>;

type SupportRequestView = {
  id: string;
  topic: string;
  subject: string;
  details: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
};

type SupportInsertResult = {
  ok: boolean;
  table: string | null;
  row: SupportRequestRow | null;
  error: string;
};

type SupportLoadResult = {
  table: string | null;
  rows: SupportRequestRow[];
  error: string;
};

type SupportIcon = ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

type HelpCategory = {
  key: string;
  icon: SupportIcon;
  title: string;
  description: string;
  actionLabel: string;
  href: Href;
  roles?: AppRole[];
};

const SUPPORT_TABLES = ['support_requests', 'support_tickets'] as const;

const THEME_OPTIONS: {
  icon: 'sun' | 'moon';
  label: string;
  value: SitGuruThemePreference;
}[] = [
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

const commonCategories: HelpCategory[] = [
  {
    key: 'booking',
    icon: CalendarDays,
    title: 'Booking help',
    description:
      'Review booking status, schedule details, care notes, cancellation questions, and next steps.',
    actionLabel: 'Open booking details',
    href: '/booking-details',
  },
  {
    key: 'messages',
    icon: MessageCircle,
    title: 'Messaging help',
    description:
      'Open your SitGuru conversations and keep booking, care, and support communication in one place.',
    actionLabel: 'Open messages',
    href: '/conversation',
  },
  {
    key: 'account',
    icon: LockKeyhole,
    title: 'Account & security',
    description:
      'Get help with signing in, account access, roles, profile information, privacy, and security.',
    actionLabel: 'Open account settings',
    href: '/account',
  },
  {
    key: 'notifications',
    icon: Bell,
    title: 'Notifications',
    description:
      'Review booking, message, PawReport, payment, payout, review, and referral alerts.',
    actionLabel: 'Open notifications',
    href: '/notifications',
  },
  {
    key: 'payments',
    icon: CreditCard,
    title: 'Payments & payouts',
    description:
      'Review payment methods, booking charges, receipts, refunds, Guru payouts, and Ambassador rewards.',
    actionLabel: 'Open payments',
    href: '/payments',
  },
  {
    key: 'reviews',
    icon: Star,
    title: 'Reviews',
    description:
      'Review completed care, verified-booking feedback, responses, and review reporting.',
    actionLabel: 'Open reviews',
    href: '/reviews',
  },
];

const roleCategories: HelpCategory[] = [
  {
    key: 'pet-passports',
    icon: PawPrint,
    title: 'Pet Passport help',
    description:
      'Keep feeding, medication, routine, comfort, access, and safety instructions ready for care.',
    actionLabel: 'Open Pet Passports',
    href: '/pet-passports',
    roles: ['pet_parent'],
  },
  {
    key: 'pawreport',
    icon: Activity,
    title: 'PawReport Live',
    description:
      'Understand active-care updates, visit timelines, photos, notes, and live tracking.',
    actionLabel: 'Open PawReport Live',
    href: '/pawreport-live',
    roles: ['pet_parent', 'guru'],
  },
  {
    key: 'guru-requests',
    icon: CalendarDays,
    title: 'Guru requests',
    description:
      'Review new requests, booking acceptance, care preparation, and Pet Parent details.',
    actionLabel: 'Open Guru requests',
    href: '/guru-requests',
    roles: ['guru'],
  },
  {
    key: 'guru-pricing',
    icon: WalletCards,
    title: 'Guru pricing & payout setup',
    description:
      'Review rates, availability, marketplace support, Stripe readiness, and payout blockers.',
    actionLabel: 'Open Guru pricing',
    href: '/guru-pricing',
    roles: ['guru'],
  },
  {
    key: 'ambassador',
    icon: HeartHandshake,
    title: 'Ambassador referrals',
    description:
      'Review referral codes, QR links, signups, rewards, training, commissions, and payout readiness.',
    actionLabel: 'Open Ambassador dashboard',
    href: '/ambassador-dashboard',
    roles: ['ambassador'],
  },
  {
    key: 'admin',
    icon: UserRoundCog,
    title: 'Admin operations',
    description:
      'Open the SitGuru operations workspace for account, booking, payment, referral, and support oversight.',
    actionLabel: 'Open Admin operations',
    href: '/admin-operations',
    roles: ['admin'],
  },
];

const supportTopics: Array<{
  key: SupportTopic;
  icon: SupportIcon;
}> = [
  { key: 'Booking', icon: CalendarDays },
  { key: 'Messages', icon: MessageCircle },
  { key: 'Payment', icon: CreditCard },
  { key: 'Payout', icon: CircleDollarSign },
  { key: 'PawReport', icon: PawPrint },
  { key: 'Reviews', icon: Star },
  { key: 'Referral', icon: HeartHandshake },
  { key: 'Safety', icon: ShieldAlert },
  { key: 'Account', icon: LockKeyhole },
  { key: 'Notifications', icon: Bell },
  { key: 'Other', icon: LifeBuoy },
];

const faqs = [
  {
    question: 'How do bookings work?',
    answer:
      'Pet Parents request care, Gurus review the request, and Booking Details becomes the shared care hub once the booking is accepted.',
  },
  {
    question: 'When is a Pet Parent charged?',
    answer:
      'The final booking amount should be reviewed before payment. Payment status, receipts, refunds, and disputes stay connected to the booking inside SitGuru.',
  },
  {
    question: 'How are Gurus paid?',
    answer:
      'Guru earnings remain separate from SitGuru marketplace support. A payout is not shown as paid until the connected payment record confirms it.',
  },
  {
    question: 'How does PawReport Live work?',
    answer:
      'PawReport Live is available during active booked care and keeps visit progress, care notes, photos, and updates connected to the booking.',
  },
  {
    question: 'How do verified reviews work?',
    answer:
      'A review should be tied to an eligible completed booking so the same booking cannot create duplicate reviews.',
  },
  {
    question: 'How do referral rewards work?',
    answer:
      'A code, link visit, or QR scan creates attribution. Rewards are evaluated separately after the required verified activity is completed.',
  },
];

function asText(value: unknown) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function firstText(row: SupportRequestRow, keys: string[]) {
  for (const key of keys) {
    const value = asText(row[key]);
    if (value) return value;
  }

  return '';
}

function normalizeStatus(value: unknown) {
  const status = asText(value)
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return status || 'open';
}

function titleCase(value: unknown) {
  const text = normalizeStatus(value);
  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: unknown) {
  const text = asText(value);
  if (!text) return 'Date unavailable';

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return 'Date unavailable';

  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function supportRequestFromRow(
  row: SupportRequestRow,
  index: number,
): SupportRequestView {
  return {
    id:
      firstText(row, ['id', 'ticket_id', 'request_id']) ||
      `support-${index}`,
    topic:
      firstText(row, ['category', 'topic', 'request_type', 'type']) ||
      'Support',
    subject:
      firstText(row, ['subject', 'title', 'summary']) ||
      'SitGuru support request',
    details:
      firstText(row, ['description', 'message', 'details', 'body']) ||
      '',
    status: normalizeStatus(
      firstText(row, ['status', 'ticket_status', 'request_status']),
    ),
    priority:
      firstText(row, ['priority', 'urgency', 'severity']) || 'normal',
    createdAt:
      firstText(row, ['created_at', 'submitted_at', 'opened_at']) || '',
    updatedAt:
      firstText(row, ['updated_at', 'last_activity_at', 'created_at']) || '',
  };
}

function getMissingColumn(message: string) {
  const patterns = [
    /Could not find the '([^']+)' column/i,
    /column ["']?([a-zA-Z0-9_]+)["']? does not exist/i,
    /record ["']?[^"']+["']? has no field ["']?([a-zA-Z0-9_]+)["']?/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) return match[1];
  }

  return '';
}

function isMissingTable(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes('could not find the table') ||
    normalized.includes('relation') && normalized.includes('does not exist') ||
    normalized.includes('schema cache')
  );
}

function isMissingColumn(message: string) {
  return Boolean(getMissingColumn(message));
}

function cleanPayload(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
}

async function insertSupportRequest(
  payload: Record<string, unknown>,
): Promise<SupportInsertResult> {
  let lastError = '';

  for (const table of SUPPORT_TABLES) {
    const workingPayload = cleanPayload(payload);

    for (let attempt = 0; attempt < 40; attempt += 1) {
      const { data, error } = await supabase
        .from(table)
        .insert(workingPayload)
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!error) {
        return {
          ok: true,
          table,
          row: (data || null) as SupportRequestRow | null,
          error: '',
        };
      }

      lastError = error.message;

      if (isMissingTable(error.message)) {
        break;
      }

      const missingColumn = getMissingColumn(error.message);

      if (
        missingColumn &&
        Object.prototype.hasOwnProperty.call(workingPayload, missingColumn)
      ) {
        delete workingPayload[missingColumn];
        continue;
      }

      return {
        ok: false,
        table,
        row: null,
        error: error.message,
      };
    }
  }

  return {
    ok: false,
    table: null,
    row: null,
    error:
      lastError ||
      'SitGuru support request storage is not available yet.',
  };
}

async function loadSupportRequests(userId: string): Promise<SupportLoadResult> {
  let lastError = '';

  for (const table of SUPPORT_TABLES) {
    const userColumns = [
      'user_id',
      'requester_user_id',
      'created_by',
      'customer_user_id',
    ];

    for (const userColumn of userColumns) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq(userColumn, userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error) {
        return {
          table,
          rows: (data || []) as SupportRequestRow[],
          error: '',
        };
      }

      lastError = error.message;

      if (isMissingTable(error.message)) {
        break;
      }

      if (isMissingColumn(error.message)) {
        continue;
      }

      return {
        table,
        rows: [],
        error: error.message,
      };
    }
  }

  return {
    table: null,
    rows: [],
    error:
      lastError &&
      !isMissingTable(lastError)
        ? lastError
        : '',
  };
}

function defaultTopicForRole(role: AppRole | null): SupportTopic {
  if (role === 'guru') return 'Payout';
  if (role === 'ambassador') return 'Referral';
  if (role === 'admin') return 'Account';
  return 'Booking';
}

function statusTone(status: string) {
  const normalized = normalizeStatus(status);

  if (['resolved', 'closed', 'completed'].includes(normalized)) {
    return 'success';
  }

  if (
    ['waiting on member', 'needs information', 'pending member'].includes(
      normalized,
    )
  ) {
    return 'warning';
  }

  return 'open';
}

function ActionButton({
  label,
  icon,
  onPress,
  primary = false,
  disabled = false,
  styles,
}: {
  label: string;
  icon?: ReactNode;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        primary && styles.actionButtonPrimary,
        disabled && styles.disabledButton,
        pressed && !disabled ? styles.pressed : null,
      ]}>
      {icon}
      <Text
        style={[
          styles.actionButtonText,
          primary && styles.actionButtonTextPrimary,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function SupportScreen() {
  const colorScheme = useColorScheme();
  const themePreference = useThemePreference();
  const theme = getAppTheme(colorScheme === 'dark' ? 'dark' : 'light');
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width } = useWindowDimensions();
  const isWebPreview = Platform.OS === 'web';

  const {
    user,
    profile,
    roles,
    primaryRole,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const [topic, setTopic] = useState<SupportTopic>(
    defaultTopicForRole(primaryRole),
  );
  const [priority, setPriority] = useState<SupportPriority>('normal');
  const [reference, setReference] = useState('');
  const [details, setDetails] = useState('');
  const [feedback, setFeedback] = useState<SupportFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [requestRows, setRequestRows] = useState<SupportRequestRow[]>([]);
  const [requestTable, setRequestTable] = useState<string | null>(null);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestLoadError, setRequestLoadError] = useState('');
  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false);

  const activeRole: AppRole = primaryRole || roles[0] || 'pet_parent';
  const profileRecord = (profile ?? {}) as SupportRequestRow;
  const metadata = (user?.user_metadata ?? {}) as SupportRequestRow;

  const displayName =
    profile?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    user?.email?.split('@')[0] ||
    'SitGuru member';

  const firstName = displayName.split(/\s+/).filter(Boolean)[0] || 'Member';

  const rawAvatar =
    firstText(profileRecord, [
      'avatar_url',
      'photo_url',
      'profile_photo_url',
      'profile_image_url',
    ]) || firstText(metadata, ['avatar_url', 'picture']);

  const avatarUrl = rawAvatar
    ? resolveSupabaseStorageUrl(rawAvatar)
    : null;

  const roleText = roles.length
    ? roles.map(roleLabel).join(', ')
    : primaryRole
      ? roleLabel(primaryRole)
      : 'Member';

  const categories = useMemo(() => {
    const currentRoles = roles.length
      ? roles
      : primaryRole
        ? [primaryRole]
        : [];

    const availableRoleCategories = roleCategories.filter((category) => {
      if (!category.roles?.length) return true;
      return category.roles.some((role) => currentRoles.includes(role));
    });

    return [...commonCategories, ...availableRoleCategories];
  }, [primaryRole, roles]);

  const recentRequests = useMemo(
    () => requestRows.map(supportRequestFromRow),
    [requestRows],
  );

  const compactGrid = width < 390;

  const refreshRequests = useCallback(async () => {
    if (!user?.id || !isSupabaseConfigured) {
      setRequestRows([]);
      setRequestTable(null);
      setRequestLoadError('');
      return;
    }

    setLoadingRequests(true);

    const result = await loadSupportRequests(user.id);

    setRequestRows(result.rows);
    setRequestTable(result.table);
    setRequestLoadError(result.error);
    setLoadingRequests(false);
  }, [user?.id]);

  useEffect(() => {
    setTopic((current) =>
      current === 'Booking'
        ? defaultTopicForRole(primaryRole)
        : current,
    );
  }, [primaryRole]);

  useEffect(() => {
    void refreshRequests();
  }, [refreshRequests]);

  async function submitSupportRequest() {
    setFeedback(null);

    const cleanDetails = details.trim();
    const cleanReference = reference.trim();

    if (!isSupabaseConfigured) {
      setFeedback({
        tone: 'error',
        title: 'Support request not sent',
        message:
          'The mobile app is not connected to Supabase in this environment.',
      });
      return;
    }

    if (!isAuthenticated || !user?.id) {
      setFeedback({
        tone: 'warning',
        title: 'Sign in required',
        message:
          'Sign in to create a trackable SitGuru support request and receive status updates.',
      });
      return;
    }

    if (cleanDetails.length < 15) {
      setFeedback({
        tone: 'warning',
        title: 'Add a little more detail',
        message:
          'Please enter at least 15 characters so SitGuru support can understand what happened.',
      });
      return;
    }

    setSubmitting(true);

    const now = new Date().toISOString();
    const subject = cleanReference
      ? `${topic}: ${cleanReference}`
      : `${topic} support request`;

    const payload = {
      user_id: user.id,
      requester_user_id: user.id,
      customer_user_id: user.id,
      profile_id: profile?.id || user.id,
      requester_profile_id: profile?.id || user.id,

      requester_name: displayName,
      full_name: displayName,
      requester_email: user.email || profile?.email || null,
      email: user.email || profile?.email || null,
      requester_role: primaryRole || roles[0] || 'pet_parent',
      role: primaryRole || roles[0] || 'pet_parent',

      category: topic.toLowerCase(),
      topic,
      request_type: topic.toLowerCase(),

      subject,
      title: subject,
      summary: subject,

      description: cleanDetails,
      message: cleanDetails,
      details: cleanDetails,
      body: cleanDetails,

      reference: cleanReference || null,
      booking_reference: topic === 'Booking' ? cleanReference || null : null,

      status: 'open',
      ticket_status: 'open',
      request_status: 'open',

      priority,
      urgency: priority,
      severity: priority === 'urgent' ? 'high' : 'normal',

      source: 'sitguru_mobile_app',
      platform: Platform.OS,
      app_surface: 'support_center',
      metadata: {
        app: 'sitguru-mobile',
        platform: Platform.OS,
        roles,
        primaryRole,
        reference: cleanReference || null,
      },

      submitted_at: now,
      opened_at: now,
      created_at: now,
      updated_at: now,
    };

    const result = await insertSupportRequest(payload);

    setSubmitting(false);

    if (!result.ok) {
      setFeedback({
        tone: 'error',
        title: 'Support request not sent',
        message:
          result.error ||
          'SitGuru could not save your support request. Please try again.',
      });
      return;
    }

    setDetails('');
    setReference('');
    setPriority('normal');
    setRequestTable(result.table);

    setFeedback({
      tone: 'success',
      title: 'Support request sent',
      message:
        'SitGuru saved your request. You can follow its status below.',
    });

    await refreshRequests();
  }

  function reportSafetyConcern() {
    setTopic('Safety');
    setPriority('urgent');
    setFeedback({
      tone: 'warning',
      title: 'Safety support selected',
      message:
        'Describe the concern below. For an immediate emergency, contact local emergency services first.',
    });
  }

  const supportContent = (
    <>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Support Center</Text>

          <Text style={styles.headerWelcome}>
            Welcome back, {firstName}!{' '}
            <Text style={styles.wave}>👋</Text>
          </Text>

          <SitGuruRoleStatus role={activeRole} />
        </View>

        <View style={styles.headerActions}>
          <Pressable
            accessibilityLabel="Open notifications"
            accessibilityRole="button"
            onPress={() => router.push('/notifications')}
            style={styles.headerIconButton}>
            <Bell
              color={theme.colors.text}
              size={18}
              strokeWidth={2.3}
            />
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
                    active ? styles.modeButtonActive : null,
                  ]}>
                  <SitGuruIcon
                    color={
                      active
                        ? option.value === 'light'
                          ? '#F3AA1F'
                          : theme.mode === 'dark'
                            ? '#F0CF62'
                            : theme.colors.primary
                        : theme.colors.muted
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
            style={styles.profileButton}>
            <HeaderAvatar
              fallback={initials(displayName)}
              imageUrl={avatarUrl}
              styles={styles}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Headphones color="#FFFFFF" size={25} strokeWidth={2.4} />
        </View>
        <Text style={styles.heroEyebrow}>SITGURU SUPPORT</Text>
        <Text style={styles.heroTitle}>How can we help?</Text>
        <Text style={styles.heroSubtitle}>
          Fast help for bookings, care, messages, payments, payouts, reviews,
          referrals, account access, and safety.
        </Text>

        <View style={styles.identityStrip}>
          <View style={styles.identityCopy}>
            <Text style={styles.identityName}>{displayName}</Text>
            <Text style={styles.identityRole}>{roleText}</Text>
          </View>

          <View style={styles.signedInPill}>
            <View style={styles.onlineDot} />
            <Text style={styles.signedInText}>
              {isAuthenticated ? 'Signed in' : 'Guest'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.urgentCard}>
        <View style={styles.urgentHeading}>
          <View style={styles.urgentIcon}>
            <AlertTriangle
              color={theme.colors.warning}
              size={21}
              strokeWidth={2.4}
            />
          </View>
          <View style={styles.urgentCopy}>
            <Text style={styles.urgentTitle}>Need urgent help?</Text>
            <Text style={styles.urgentText}>
              For an immediate emergency, contact local emergency services
              first. SitGuru handles booking, account, care, conduct, payment,
              and safety follow-up.
            </Text>
          </View>
        </View>

        <View style={styles.buttonStack}>
          <ActionButton
            label="Message support"
            icon={
              <MessageCircle color="#FFFFFF" size={17} strokeWidth={2.4} />
            }
            onPress={() => router.push('/conversation')}
            primary
            styles={styles}
          />
          <ActionButton
            label="Report safety concern"
            icon={
              <ShieldAlert
                color={theme.colors.primary}
                size={17}
                strokeWidth={2.4}
              />
            }
            onPress={reportSafetyConcern}
            styles={styles}
          />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>QUICK DESTINATIONS</Text>
          <Text style={styles.sectionTitle}>Get to the right place</Text>
        </View>
        <Text style={styles.sectionMeta}>{categories.length}</Text>
      </View>

      <View style={styles.categoryGrid}>
        {categories.map((category) => {
          const Icon = category.icon;

          return (
            <Pressable
              key={category.key}
              accessibilityRole="button"
              onPress={() => router.push(category.href)}
              style={({ pressed }) => [
                styles.categoryCard,
                compactGrid ? styles.categoryCardCompact : null,
                pressed ? styles.pressedCard : null,
              ]}>
              <View style={styles.categoryIcon}>
                <Icon
                  color={theme.colors.primary}
                  size={21}
                  strokeWidth={2.3}
                />
              </View>

              <View style={styles.categoryCopy}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categoryDescription} numberOfLines={3}>
                  {category.description}
                </Text>
                <View style={styles.categoryAction}>
                  <Text style={styles.categoryActionText}>
                    {category.actionLabel}
                  </Text>
                  <ChevronRight
                    color={theme.colors.primary}
                    size={15}
                    strokeWidth={2.5}
                  />
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.formCard}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>TRACKABLE ASSISTANCE</Text>
            <Text style={styles.sectionTitle}>Create a request</Text>
          </View>
          <LifeBuoy
            color={theme.colors.primary}
            size={23}
            strokeWidth={2.3}
          />
        </View>

        <Text style={styles.body}>
          Choose a topic and tell SitGuru what happened. Requests are saved to
          your account and visible to authorized support staff.
        </Text>

        {!isAuthenticated && !authLoading ? (
          <View style={styles.signInNotice}>
            <Text style={styles.signInNoticeTitle}>Sign in to submit</Text>
            <Text style={styles.signInNoticeText}>
              Guest users can browse help, but a signed-in account is required
              for a trackable support request.
            </Text>
            <ActionButton
              label="Sign in"
              onPress={() => router.push('/login')}
              primary
              styles={styles}
            />
          </View>
        ) : null}

        <Text style={styles.fieldLabel}>Topic</Text>
        <View style={styles.topicGrid}>
          {supportTopics.map((item) => {
            const Icon = item.icon;
            const active = item.key === topic;

            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setTopic(item.key)}
                style={({ pressed }) => [
                  styles.topicChip,
                  active ? styles.topicChipActive : null,
                  pressed ? styles.pressed : null,
                ]}>
                <Icon
                  color={
                    active
                      ? theme.colors.chipActiveText
                      : theme.colors.textSecondary
                  }
                  size={14}
                  strokeWidth={2.4}
                />
                <Text
                  style={[
                    styles.topicChipText,
                    active ? styles.topicChipTextActive : null,
                  ]}>
                  {item.key}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>Priority</Text>
        <View style={styles.priorityRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: priority === 'normal' }}
            onPress={() => setPriority('normal')}
            style={[
              styles.priorityButton,
              priority === 'normal' ? styles.priorityButtonActive : null,
            ]}>
            <Clock3
              color={
                priority === 'normal'
                  ? theme.colors.chipActiveText
                  : theme.colors.textSecondary
              }
              size={16}
              strokeWidth={2.4}
            />
            <Text
              style={[
                styles.priorityText,
                priority === 'normal' ? styles.priorityTextActive : null,
              ]}>
              Standard
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: priority === 'urgent' }}
            onPress={() => setPriority('urgent')}
            style={[
              styles.priorityButton,
              priority === 'urgent' ? styles.priorityButtonUrgent : null,
            ]}>
            <AlertTriangle
              color={
                priority === 'urgent'
                  ? '#FFFFFF'
                  : theme.colors.textSecondary
              }
              size={16}
              strokeWidth={2.4}
            />
            <Text
              style={[
                styles.priorityText,
                priority === 'urgent' ? styles.priorityTextUrgent : null,
              ]}>
              Urgent
            </Text>
          </Pressable>
        </View>

        <Text style={styles.fieldLabel}>Reference number</Text>
        <TextInput
          value={reference}
          onChangeText={setReference}
          placeholder="Optional booking, payment, or payout reference"
          placeholderTextColor={theme.colors.inputPlaceholder}
          autoCapitalize="characters"
          style={styles.input}
        />

        <View style={styles.fieldHeadingRow}>
          <Text style={styles.fieldLabel}>What happened?</Text>
          <Text style={styles.characterCount}>
            {details.trim().length}/3000
          </Text>
        </View>

        <TextInput
          multiline
          value={details}
          onChangeText={setDetails}
          placeholder="Tell SitGuru what happened, what you already tried, and what help you need."
          placeholderTextColor={theme.colors.inputPlaceholder}
          style={styles.textArea}
          textAlignVertical="top"
          maxLength={3000}
        />

        {feedback ? (
          <View
            style={[
              styles.feedbackCard,
              feedback.tone === 'success'
                ? styles.feedbackSuccess
                : feedback.tone === 'warning'
                  ? styles.feedbackWarning
                  : styles.feedbackError,
            ]}>
            {feedback.tone === 'success' ? (
              <CheckCircle2
                color={theme.colors.success}
                size={20}
                strokeWidth={2.5}
              />
            ) : (
              <AlertTriangle
                color={
                  feedback.tone === 'warning'
                    ? theme.colors.warning
                    : theme.colors.danger
                }
                size={20}
                strokeWidth={2.5}
              />
            )}
            <View style={styles.feedbackCopy}>
              <Text style={styles.feedbackTitle}>{feedback.title}</Text>
              <Text style={styles.feedbackMessage}>{feedback.message}</Text>
            </View>
          </View>
        ) : null}

        <ActionButton
          label={submitting ? 'Sending request…' : 'Submit support request'}
          icon={
            submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Send color="#FFFFFF" size={17} strokeWidth={2.4} />
            )
          }
          onPress={() => void submitSupportRequest()}
          primary
          disabled={submitting || authLoading}
          styles={styles}
        />

        <Text style={styles.formFootnote}>
          A request is labeled sent only after SitGuru confirms it was saved.
        </Text>
      </View>

      <View style={styles.requestsCard}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>YOUR ACCOUNT</Text>
            <Text style={styles.sectionTitle}>Recent requests</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => void refreshRequests()}
            disabled={loadingRequests}
            style={({ pressed }) => [
              styles.refreshButton,
              pressed ? styles.pressed : null,
            ]}>
            {loadingRequests ? (
              <ActivityIndicator
                color={theme.colors.primary}
                size="small"
              />
            ) : (
              <RefreshCw
                color={theme.colors.primary}
                size={17}
                strokeWidth={2.4}
              />
            )}
          </Pressable>
        </View>

        {requestLoadError ? (
          <View style={styles.inlineError}>
            <AlertTriangle
              color={theme.colors.danger}
              size={19}
              strokeWidth={2.4}
            />
            <Text style={styles.inlineErrorText}>{requestLoadError}</Text>
          </View>
        ) : null}

        {!isAuthenticated ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Sign in to view requests</Text>
            <Text style={styles.emptyText}>
              Your open and completed support requests are connected to your
              SitGuru account.
            </Text>
          </View>
        ) : loadingRequests ? (
          <View style={styles.loadingState}>
            <ActivityIndicator
              color={theme.colors.primary}
              size="small"
            />
            <Text style={styles.emptyText}>Loading requests…</Text>
          </View>
        ) : recentRequests.length ? (
          <View style={styles.requestList}>
            {recentRequests.map((request) => {
              const tone = statusTone(request.status);

              return (
                <View key={request.id} style={styles.requestItem}>
                  <View style={styles.requestTopRow}>
                    <View style={styles.requestTitleCopy}>
                      <Text style={styles.requestTopic}>
                        {titleCase(request.topic)}
                      </Text>
                      <Text style={styles.requestSubject}>
                        {request.subject}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        tone === 'success'
                          ? styles.statusBadgeSuccess
                          : tone === 'warning'
                            ? styles.statusBadgeWarning
                            : styles.statusBadgeOpen,
                      ]}>
                      <Text style={styles.statusBadgeText}>
                        {titleCase(request.status)}
                      </Text>
                    </View>
                  </View>

                  {request.details ? (
                    <Text style={styles.requestDetails} numberOfLines={3}>
                      {request.details}
                    </Text>
                  ) : null}

                  <View style={styles.requestMetaRow}>
                    <Text style={styles.requestMeta}>
                      {titleCase(request.priority)}
                    </Text>
                    <Text style={styles.requestMeta}>
                      {formatDate(request.updatedAt || request.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No support requests yet</Text>
            <Text style={styles.emptyText}>
              Submitted requests appear here after SitGuru confirms the save.
            </Text>
            {requestTable ? (
              <Text style={styles.storageText}>
                Connected to {requestTable}
              </Text>
            ) : null}
          </View>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>COMMON QUESTIONS</Text>
          <Text style={styles.sectionTitle}>Support FAQ</Text>
        </View>
      </View>

      <View style={styles.faqList}>
        {faqs.map((faq) => (
          <View key={faq.question} style={styles.faqCard}>
            <Text style={styles.faqQuestion}>{faq.question}</Text>
            <Text style={styles.body}>{faq.answer}</Text>
          </View>
        ))}
      </View>

      <View style={styles.safetyCard}>
        <ShieldAlert
          color={theme.colors.primary}
          size={23}
          strokeWidth={2.3}
        />
        <View style={styles.safetyCopy}>
          <Text style={styles.safetyTitle}>Safety & privacy</Text>
          <Text style={styles.body}>
            Keep messages, booking details, care updates, reviews, and
            payments inside SitGuru. Share only what support needs.
          </Text>
        </View>
      </View>

      <View style={styles.scrollBottomSpace} />
    </>
  );

  return (
    <>
      <SitGuruScreen center={isWebPreview} maxWidth={620}>
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
            <View style={styles.screen}>
              {isWebPreview ? (
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
              ) : null}

              <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                {supportContent}
              </ScrollView>

              <View style={styles.bottomNav}>
                <BottomNavItem
                  label="Home"
                  icon={
                    <Home
                      color={theme.colors.textSecondary}
                      size={20}
                      strokeWidth={2.3}
                    />
                  }
                  onPress={() =>
                    router.push(
                      primaryRole === 'guru'
                        ? '/guru-dashboard'
                        : primaryRole === 'ambassador'
                          ? '/ambassador-dashboard'
                          : primaryRole === 'admin'
                            ? '/admin-dashboard'
                            : '/pet-parent-dashboard',
                    )
                  }
                  styles={styles}
                />
                <BottomNavItem
                  label="Explore"
                  icon={
                    <Search
                      color={theme.colors.textSecondary}
                      size={20}
                      strokeWidth={2.3}
                    />
                  }
                  onPress={() => router.push('/find-care')}
                  styles={styles}
                />
                <BottomNavItem
                  label="Bookings"
                  icon={
                    <CalendarDays
                      color={theme.colors.textSecondary}
                      size={20}
                      strokeWidth={2.3}
                    />
                  }
                  onPress={() => router.push('/booking-details')}
                  styles={styles}
                />
                <BottomNavItem
                  label="Messages"
                  icon={
                    <MessageCircle
                      color={theme.colors.textSecondary}
                      size={20}
                      strokeWidth={2.3}
                    />
                  }
                  onPress={() => router.push('/conversation')}
                  styles={styles}
                />
                <BottomNavItem
                  active
                  label="Profile"
                  icon={
                    <UserRound
                      color={theme.colors.primary}
                      size={20}
                      strokeWidth={2.4}
                    />
                  }
                  onPress={() => router.push('/account')}
                  styles={styles}
                />
              </View>

              {isWebPreview ? <View style={styles.homeIndicator} /> : null}
            </View>
          </View>
        </View>
      </View>
      </SitGuruScreen>

      <SitGuruWorkspaceSwitcher
        currentRole={activeRole}
        onClose={() => setWorkspaceSwitcherOpen(false)}
        profileHref="/account"
        profileLabel="Manage account"
        visible={workspaceSwitcherOpen}
      />
    </>
  );
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'SG';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function HeaderAvatar({
  fallback,
  imageUrl,
  styles,
}: {
  fallback: string;
  imageUrl: string | null;
  styles: ReturnType<typeof createStyles>;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <View style={styles.avatarFrame}>
      {showImage ? (
        <Image
          onError={() => setImageFailed(true)}
          resizeMode="cover"
          source={{ uri: imageUrl as string }}
          style={styles.avatarImage}
        />
      ) : (
        <Text style={styles.avatarInitials}>{fallback}</Text>
      )}
    </View>
  );
}

function BottomNavItem({
  label,
  icon,
  onPress,
  styles,
  active = false,
}: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.bottomNavItem,
        pressed ? styles.pressed : null,
      ]}>
      {icon}
      <Text
        style={[
          styles.bottomNavText,
          active ? styles.bottomNavTextActive : null,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof getAppTheme>) {
  const dark = theme.mode === 'dark';
  const screenBackground = dark ? '#0D1712' : '#FFF9F1';
  const phoneBackground = dark ? '#101A15' : '#F8FCF9';

  return StyleSheet.create({
    previewCanvas: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 930,
      paddingVertical: 12,
      width: '100%',
    },
    previewCanvasNative: {
      minHeight: undefined,
      paddingVertical: 0,
    },
    deviceFrame: {
      backgroundColor: '#111814',
      borderColor: '#26322C',
      borderRadius: 48,
      borderWidth: 2,
      maxWidth: 470,
      padding: 10,
      position: 'relative',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      width: '100%',
    },
    deviceFrameNative: {
      backgroundColor: 'transparent',
      borderRadius: 0,
      borderWidth: 0,
      maxWidth: undefined,
      padding: 0,
      shadowOpacity: 0,
    },
    deviceTopSpeaker: {
      alignSelf: 'center',
      backgroundColor: '#34403A',
      borderRadius: 999,
      height: 6,
      marginBottom: 8,
      width: 72,
    },
    phoneShell: {
      backgroundColor: phoneBackground,
      borderRadius: 38,
      overflow: 'hidden',
      width: '100%',
    },
    phoneShellNative: {
      borderRadius: 0,
      flex: 1,
    },
    screen: {
      backgroundColor: screenBackground,
      height: 860,
      overflow: 'hidden',
      position: 'relative',
      width: '100%',
    },
    statusBar: {
      alignItems: 'center',
      backgroundColor: screenBackground,
      flexDirection: 'row',
      height: 38,
      justifyContent: 'space-between',
      paddingHorizontal: 18,
    },
    statusTime: {
      color: theme.colors.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
    },
    statusIcons: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 7,
    },
    signalBars: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      gap: 2,
    },
    signalBar: {
      backgroundColor: theme.colors.text,
      borderRadius: 2,
      width: 2,
    },
    wifiText: {
      color: theme.colors.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 14,
      transform: [{ rotate: '90deg' }],
    },
    batteryWrap: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 1,
    },
    batteryBody: {
      borderColor: theme.colors.text,
      borderRadius: 3,
      borderWidth: 1,
      height: 8,
      padding: 1,
      width: 16,
    },
    batteryFill: {
      backgroundColor: theme.colors.text,
      borderRadius: 1,
      flex: 1,
    },
    batteryCap: {
      backgroundColor: theme.colors.text,
      borderRadius: 1,
      height: 4,
      width: 2,
    },
    scrollContent: {
      gap: 14,
      paddingBottom: 112,
      paddingHorizontal: 16,
      paddingTop: 10,
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
    headerTitle: {
      color: theme.colors.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 20,
      letterSpacing: -0.4,
      lineHeight: 24,
    },
    headerWelcome: {
      color: theme.colors.muted,
      fontFamily: AppFonts.medium,
      fontSize: 11,
    },
    wave: {
      fontSize: 11,
    },
    headerActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    headerIconButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 38,
      justifyContent: 'center',
      position: 'relative',
      width: 38,
    },
    modeToggle: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: dark ? '#B9831B' : '#F2822E',
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
      backgroundColor: dark ? 'rgba(226,170,45,0.18)' : '#FFF4D8',
    },
    profileButton: {
      borderRadius: 999,
    },
    avatarFrame: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderColor: dark ? '#2E6C4B' : '#FFFFFF',
      borderRadius: 21,
      borderWidth: 2,
      height: 42,
      justifyContent: 'center',
      overflow: 'hidden',
      width: 42,
    },
    avatarImage: {
      height: '100%',
      width: '100%',
    },
    avatarInitials: {
      color: theme.colors.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
    },
    hero: {
      backgroundColor: dark ? '#0E4A36' : '#0E8F5B',
      borderRadius: 24,
      gap: 8,
      padding: 17,
    },
    heroIcon: {
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderRadius: 15,
      height: 45,
      justifyContent: 'center',
      width: 45,
    },
    heroEyebrow: {
      color: '#D7FF9A',
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
      letterSpacing: 0.8,
    },
    heroTitle: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 25,
      letterSpacing: -0.7,
      lineHeight: 30,
    },
    heroSubtitle: {
      color: '#E7F8EE',
      fontFamily: AppFonts.semiBold,
      fontSize: 12,
      lineHeight: 18,
    },
    identityStrip: {
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.11)',
      borderColor: 'rgba(255,255,255,0.15)',
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'space-between',
      marginTop: 2,
      padding: 10,
    },
    identityCopy: {
      flex: 1,
      gap: 1,
    },
    identityName: {
      color: '#FFFFFF',
      fontFamily: AppFonts.bold,
      fontSize: 13,
    },
    identityRole: {
      color: '#D9EFE3',
      fontFamily: AppFonts.medium,
      fontSize: 10,
    },
    signedInPill: {
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderRadius: 999,
      flexDirection: 'row',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    onlineDot: {
      backgroundColor: '#46D28A',
      borderRadius: 999,
      height: 6,
      width: 6,
    },
    signedInText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
      textTransform: 'uppercase',
    },
    urgentCard: {
      backgroundColor: dark ? '#302311' : '#FFF4E7',
      borderColor: dark ? '#70522A' : '#F8D6A7',
      borderRadius: 22,
      borderWidth: 1,
      gap: 12,
      padding: 15,
    },
    urgentHeading: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 10,
    },
    urgentIcon: {
      alignItems: 'center',
      backgroundColor: dark ? '#4A3519' : '#FFE7C3',
      borderRadius: 14,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    urgentCopy: {
      flex: 1,
      gap: 4,
    },
    urgentTitle: {
      color: dark ? '#FFD393' : '#9D5B00',
      fontFamily: AppFonts.extraBold,
      fontSize: 17,
    },
    urgentText: {
      color: theme.colors.text,
      fontFamily: AppFonts.semiBold,
      fontSize: 11,
      lineHeight: 17,
    },
    buttonStack: {
      gap: 8,
    },
    actionButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.primary,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 7,
      justifyContent: 'center',
      minHeight: 46,
      paddingHorizontal: 14,
    },
    actionButtonPrimary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    disabledButton: {
      opacity: 0.5,
    },
    pressed: {
      opacity: 0.76,
    },
    actionButtonText: {
      color: theme.colors.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
      textAlign: 'center',
    },
    actionButtonTextPrimary: {
      color: '#FFFFFF',
    },
    sectionHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    sectionEyebrow: {
      color: theme.colors.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
      letterSpacing: 0.7,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 19,
      letterSpacing: -0.4,
      lineHeight: 24,
    },
    sectionMeta: {
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 999,
      color: theme.colors.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
      overflow: 'hidden',
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 9,
    },
    categoryCard: {
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 19,
      borderWidth: 1,
      gap: 9,
      minHeight: 154,
      padding: 12,
      width: '48.6%',
    },
    categoryCardCompact: {
      width: '100%',
      minHeight: 0,
    },
    pressedCard: {
      opacity: 0.76,
      transform: [{ scale: 0.995 }],
    },
    categoryIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 14,
      height: 39,
      justifyContent: 'center',
      width: 39,
    },
    categoryCopy: {
      flex: 1,
      gap: 5,
    },
    categoryTitle: {
      color: theme.colors.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
      lineHeight: 17,
    },
    categoryDescription: {
      color: theme.colors.textSecondary,
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 15,
    },
    categoryAction: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 2,
      marginTop: 'auto',
    },
    categoryActionText: {
      color: theme.colors.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    formCard: {
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 23,
      borderWidth: 1,
      gap: 12,
      padding: 15,
    },
    body: {
      color: theme.colors.textSecondary,
      fontFamily: AppFonts.medium,
      fontSize: 11,
      lineHeight: 17,
    },
    signInNotice: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.borderStrong,
      borderRadius: 17,
      borderWidth: 1,
      gap: 7,
      padding: 12,
    },
    signInNoticeTitle: {
      color: theme.colors.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 14,
    },
    signInNoticeText: {
      color: theme.colors.textSecondary,
      fontFamily: AppFonts.medium,
      fontSize: 11,
      lineHeight: 17,
    },
    fieldLabel: {
      color: theme.colors.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    fieldHeadingRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    characterCount: {
      color: theme.colors.muted,
      fontFamily: AppFonts.bold,
      fontSize: 9,
    },
    topicGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },
    topicChip: {
      alignItems: 'center',
      backgroundColor: theme.colors.chip,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    topicChipActive: {
      backgroundColor: theme.colors.chipActive,
      borderColor: theme.colors.chipActive,
    },
    topicChipText: {
      color: theme.colors.textSecondary,
      fontFamily: AppFonts.bold,
      fontSize: 10,
    },
    topicChipTextActive: {
      color: theme.colors.chipActiveText,
    },
    priorityRow: {
      flexDirection: 'row',
      gap: 8,
    },
    priorityButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.chip,
      borderColor: theme.colors.border,
      borderRadius: 15,
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      gap: 7,
      justifyContent: 'center',
      minHeight: 43,
      paddingHorizontal: 10,
    },
    priorityButtonActive: {
      backgroundColor: theme.colors.chipActive,
      borderColor: theme.colors.chipActive,
    },
    priorityButtonUrgent: {
      backgroundColor: theme.colors.warning,
      borderColor: theme.colors.warning,
    },
    priorityText: {
      color: theme.colors.textSecondary,
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
    },
    priorityTextActive: {
      color: theme.colors.chipActiveText,
    },
    priorityTextUrgent: {
      color: '#FFFFFF',
    },
    input: {
      backgroundColor: theme.colors.input,
      borderColor: theme.colors.border,
      borderRadius: 16,
      borderWidth: 1,
      color: theme.colors.inputText,
      fontFamily: AppFonts.semiBold,
      fontSize: 12,
      minHeight: 46,
      paddingHorizontal: 12,
    },
    textArea: {
      backgroundColor: theme.colors.input,
      borderColor: theme.colors.border,
      borderRadius: 17,
      borderWidth: 1,
      color: theme.colors.inputText,
      fontFamily: AppFonts.semiBold,
      fontSize: 12,
      lineHeight: 18,
      minHeight: 126,
      padding: 12,
    },
    feedbackCard: {
      alignItems: 'flex-start',
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 9,
      padding: 11,
    },
    feedbackSuccess: {
      backgroundColor: dark ? '#123122' : '#ECFDF3',
      borderColor: dark ? '#28583E' : '#BBF7D0',
    },
    feedbackWarning: {
      backgroundColor: dark ? '#302611' : '#FFFBEB',
      borderColor: dark ? '#6A5422' : '#FDE68A',
    },
    feedbackError: {
      backgroundColor: dark ? '#321713' : '#FEF2F2',
      borderColor: dark ? '#6D3027' : '#FECACA',
    },
    feedbackCopy: {
      flex: 1,
      gap: 2,
    },
    feedbackTitle: {
      color: theme.colors.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
    },
    feedbackMessage: {
      color: theme.colors.textSecondary,
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 16,
    },
    formFootnote: {
      color: theme.colors.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 14,
      textAlign: 'center',
    },
    requestsCard: {
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 23,
      borderWidth: 1,
      gap: 12,
      padding: 15,
    },
    refreshButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 999,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    inlineError: {
      alignItems: 'flex-start',
      backgroundColor: dark ? '#321713' : '#FEF2F2',
      borderColor: dark ? '#6D3027' : '#FECACA',
      borderRadius: 15,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 8,
      padding: 10,
    },
    inlineErrorText: {
      color: theme.colors.danger,
      flex: 1,
      fontFamily: AppFonts.bold,
      fontSize: 10,
      lineHeight: 16,
    },
    loadingState: {
      alignItems: 'center',
      gap: 8,
      justifyContent: 'center',
      minHeight: 90,
    },
    emptyState: {
      alignItems: 'center',
      backgroundColor: theme.colors.softCard,
      borderColor: theme.colors.border,
      borderRadius: 17,
      borderStyle: 'dashed',
      borderWidth: 1,
      gap: 6,
      padding: 16,
    },
    emptyTitle: {
      color: theme.colors.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
      textAlign: 'center',
    },
    emptyText: {
      color: theme.colors.textSecondary,
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 16,
      textAlign: 'center',
    },
    storageText: {
      color: theme.colors.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    requestList: {
      gap: 8,
    },
    requestItem: {
      backgroundColor: theme.colors.softCard,
      borderColor: theme.colors.border,
      borderRadius: 17,
      borderWidth: 1,
      gap: 7,
      padding: 12,
    },
    requestTopRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'space-between',
    },
    requestTitleCopy: {
      flex: 1,
      gap: 2,
    },
    requestTopic: {
      color: theme.colors.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    requestSubject: {
      color: theme.colors.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
      lineHeight: 17,
    },
    statusBadge: {
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    statusBadgeOpen: {
      backgroundColor: theme.colors.primarySoft,
    },
    statusBadgeSuccess: {
      backgroundColor: dark ? '#123122' : '#DCFCE7',
    },
    statusBadgeWarning: {
      backgroundColor: dark ? '#302611' : '#FEF3C7',
    },
    statusBadgeText: {
      color: theme.colors.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    requestDetails: {
      color: theme.colors.textSecondary,
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 16,
    },
    requestMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
      justifyContent: 'space-between',
    },
    requestMeta: {
      color: theme.colors.muted,
      fontFamily: AppFonts.bold,
      fontSize: 9,
    },
    faqList: {
      gap: 8,
    },
    faqCard: {
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 5,
      padding: 13,
    },
    faqQuestion: {
      color: theme.colors.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
    },
    safetyCard: {
      alignItems: 'flex-start',
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.borderStrong,
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      padding: 14,
    },
    safetyCopy: {
      flex: 1,
      gap: 5,
    },
    safetyTitle: {
      color: theme.colors.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 15,
    },
    scrollBottomSpace: {
      height: 8,
    },
    bottomNav: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 22,
      borderWidth: 1,
      bottom: 12,
      flexDirection: 'row',
      left: 12,
      paddingHorizontal: 6,
      paddingVertical: 8,
      position: 'absolute',
      right: 12,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: dark ? 0.22 : 0.08,
      shadowRadius: 10,
    },
    bottomNavItem: {
      alignItems: 'center',
      flex: 1,
      gap: 3,
      justifyContent: 'center',
      minHeight: 49,
    },
    bottomNavText: {
      color: theme.colors.textSecondary,
      fontFamily: AppFonts.bold,
      fontSize: 8,
    },
    bottomNavTextActive: {
      color: theme.colors.primary,
    },
    homeIndicator: {
      alignSelf: 'center',
      backgroundColor: dark ? '#E7EFEA' : '#101612',
      borderRadius: 999,
      bottom: 2,
      height: 4,
      position: 'absolute',
      width: 120,
    },
  });
}