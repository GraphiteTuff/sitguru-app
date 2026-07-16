import { router } from 'expo-router';
import {
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  CircleDollarSign,
  Gift,
  Home,
  MessageCircle,
  PawPrint,
  Search,
  Settings2,
  ShieldCheck,
  Star,
  UserRound,
  X
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { SitGuruIcon } from '@/components/SitGuruIcon';
import SitGuruRoleStatus from '@/components/SitGuruRoleStatus';
import SitGuruScreen from '@/components/SitGuruScreen';
import SitGuruWorkspaceSwitcher from '@/components/SitGuruWorkspaceSwitcher';
import { AppFonts } from '@/constants/fonts';
import { getAppTheme } from '@/constants/theme';
import {
  setThemePreference,
  type SitGuruThemePreference,
  useColorScheme,
  useThemePreference,
} from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { resolveSupabaseStorageUrl } from '@/lib/storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { AppRole } from '@/types/auth';

type RecordRow = Record<string, unknown>;

type NotificationCategory =
  | 'all'
  | 'bookings'
  | 'messages'
  | 'pawreport'
  | 'payments'
  | 'guru'
  | 'ambassador'
  | 'support'
  | 'account';

type NotificationItem = {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  createdAt: string;
  unread: boolean;
  dismissed: boolean;
  actionLabel: string;
  href: string;
  raw: RecordRow;
  table: string;
};

type NotificationPreferenceKey =
  | 'booking_alerts'
  | 'message_alerts'
  | 'pawreport_alerts'
  | 'payment_alerts'
  | 'referral_alerts';

type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

const DEFAULT_PREFERENCES: NotificationPreferences = {
  booking_alerts: true,
  message_alerts: true,
  pawreport_alerts: true,
  payment_alerts: true,
  referral_alerts: true,
};

const THEME_OPTIONS: {
  icon: 'sun' | 'moon';
  label: string;
  value: SitGuruThemePreference;
}[] = [
  { icon: 'sun', label: 'Light', value: 'light' },
  { icon: 'moon', label: 'Dark', value: 'dark' },
];

const FILTERS: {
  key: NotificationCategory;
  label: string;
}[] = [
  { key: 'all', label: 'All' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'messages', label: 'Messages' },
  { key: 'pawreport', label: 'PawReport' },
  { key: 'payments', label: 'Payments' },
  { key: 'guru', label: 'Guru' },
  { key: 'ambassador', label: 'Ambassador' },
  { key: 'support', label: 'Support' },
];

const NOTIFICATION_TABLES = ['notifications', 'user_notifications'] as const;
const PREFERENCE_TABLES = [
  'notification_preferences',
  'user_notification_preferences',
] as const;

function asText(value: unknown) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function firstText(row: RecordRow, keys: string[]) {
  for (const key of keys) {
    const value = asText(row[key]);
    if (value) return value;
  }

  return '';
}

function firstBoolean(row: RecordRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === 'boolean') return value;
    if (value === 1 || value === '1' || value === 'true') return true;
    if (value === 0 || value === '0' || value === 'false') return false;
  }

  return false;
}

function normalizeCategory(row: RecordRow): NotificationCategory {
  const value = firstText(row, [
    'category',
    'notification_type',
    'type',
    'event_type',
    'topic',
  ]).toLowerCase();

  if (value.includes('booking') || value.includes('request')) {
    return 'bookings';
  }

  if (value.includes('message') || value.includes('conversation')) {
    return 'messages';
  }

  if (
    value.includes('pawreport') ||
    value.includes('walk') ||
    value.includes('visit') ||
    value.includes('care update')
  ) {
    return 'pawreport';
  }

  if (
    value.includes('payment') ||
    value.includes('payout') ||
    value.includes('refund') ||
    value.includes('charge')
  ) {
    return 'payments';
  }

  if (value.includes('ambassador') || value.includes('referral')) {
    return 'ambassador';
  }

  if (value.includes('guru') || value.includes('review')) {
    return 'guru';
  }

  if (value.includes('support') || value.includes('safety')) {
    return 'support';
  }

  return 'account';
}

function resolveHref(category: NotificationCategory, row: RecordRow) {
  const explicit = firstText(row, [
    'href',
    'route',
    'action_url',
    'deep_link',
    'link',
  ]);

  if (explicit.startsWith('/')) return explicit;

  switch (category) {
    case 'bookings':
      return '/booking-details';
    case 'messages':
      return '/conversation';
    case 'pawreport':
      return '/pawreport-live';
    case 'payments':
      return '/payments';
    case 'guru':
      return '/guru-dashboard';
    case 'ambassador':
      return '/ambassador-dashboard';
    case 'support':
      return '/support';
    default:
      return '/account';
  }
}

function actionLabel(category: NotificationCategory, row: RecordRow) {
  const explicit = firstText(row, ['action_label', 'cta_label', 'button_label']);
  if (explicit) return explicit;

  switch (category) {
    case 'bookings':
      return 'View booking';
    case 'messages':
      return 'Open messages';
    case 'pawreport':
      return 'View PawReport';
    case 'payments':
      return 'Open payments';
    case 'guru':
      return 'Open Guru dashboard';
    case 'ambassador':
      return 'Open Ambassador hub';
    case 'support':
      return 'Open support';
    default:
      return 'View details';
  }
}

function notificationFromRow(
  row: RecordRow,
  index: number,
  table: string,
): NotificationItem {
  const category = normalizeCategory(row);

  const dismissed =
    firstBoolean(row, ['dismissed', 'is_dismissed', 'archived']) ||
    Boolean(firstText(row, ['dismissed_at', 'archived_at']));

  const read =
    firstBoolean(row, ['read', 'is_read', 'seen']) ||
    Boolean(firstText(row, ['read_at', 'seen_at']));

  return {
    id:
      firstText(row, ['id', 'notification_id', 'event_id']) ||
      `${table}-${index}`,
    category,
    title:
      firstText(row, ['title', 'subject', 'headline']) ||
      'SitGuru notification',
    message:
      firstText(row, ['message', 'body', 'description', 'content']) ||
      'Open SitGuru to review this update.',
    createdAt:
      firstText(row, [
        'created_at',
        'sent_at',
        'published_at',
        'updated_at',
      ]) || new Date().toISOString(),
    unread: !read,
    dismissed,
    actionLabel: actionLabel(category, row),
    href: resolveHref(category, row),
    raw: row,
    table,
  };
}

function formatRelativeTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Recently';

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60_000));

  if (minutes < 1) return 'Now';
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function categoryLabel(category: NotificationCategory) {
  switch (category) {
    case 'pawreport':
      return 'PawReport';
    case 'bookings':
      return 'Bookings';
    case 'messages':
      return 'Messages';
    case 'payments':
      return 'Payments';
    case 'guru':
      return 'Guru';
    case 'ambassador':
      return 'Ambassador';
    case 'support':
      return 'Support';
    default:
      return 'Account';
  }
}

function categoryIcon(
  category: NotificationCategory,
  color: string,
): ReactNode {
  switch (category) {
    case 'bookings':
      return <CalendarDays color={color} size={20} strokeWidth={2.3} />;
    case 'messages':
      return <MessageCircle color={color} size={20} strokeWidth={2.3} />;
    case 'pawreport':
      return <PawPrint color={color} size={20} strokeWidth={2.3} />;
    case 'payments':
      return <CircleDollarSign color={color} size={20} strokeWidth={2.3} />;
    case 'guru':
      return <Star color={color} size={20} strokeWidth={2.3} />;
    case 'ambassador':
      return <Gift color={color} size={20} strokeWidth={2.3} />;
    case 'support':
      return <ShieldCheck color={color} size={20} strokeWidth={2.3} />;
    default:
      return <Bell color={color} size={20} strokeWidth={2.3} />;
  }
}

async function loadNotifications(userId: string) {
  for (const table of NOTIFICATION_TABLES) {
    for (const field of [
      'user_id',
      'recipient_id',
      'profile_id',
      'pet_parent_id',
      'guru_id',
      'ambassador_id',
    ]) {
      const result = await supabase
        .from(table)
        .select('*')
        .eq(field, userId)
        .limit(200);

      if (result.error) continue;

      return ((result.data || []) as RecordRow[])
        .map((row, index) => notificationFromRow(row, index, table))
        .filter((item) => !item.dismissed)
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime(),
        );
    }
  }

  return [];
}

async function updateNotification(
  item: NotificationItem,
  values: Record<string, unknown>,
) {
  const result = await supabase
    .from(item.table)
    .update(values)
    .eq('id', item.id);

  if (!result.error) return true;

  const compatibilityResult = await supabase
    .from(item.table)
    .update(
      Object.fromEntries(
        Object.entries(values).filter(
          ([key]) =>
            ![
              'read_at',
              'seen_at',
              'dismissed_at',
              'archived_at',
            ].includes(key),
        ),
      ),
    )
    .eq('id', item.id);

  return !compatibilityResult.error;
}

async function loadPreferences(
  userId: string,
): Promise<{
  preferences: NotificationPreferences;
  table: string | null;
}> {
  for (const table of PREFERENCE_TABLES) {
    for (const field of ['user_id', 'profile_id', 'recipient_id']) {
      const result = await supabase
        .from(table)
        .select('*')
        .eq(field, userId)
        .maybeSingle();

      if (result.error) continue;

      if (!result.data) {
        return {
          preferences: DEFAULT_PREFERENCES,
          table,
        };
      }

      const row = result.data as RecordRow;

      return {
        preferences: {
          booking_alerts:
            row.booking_alerts === undefined
              ? true
              : firstBoolean(row, ['booking_alerts']),
          message_alerts:
            row.message_alerts === undefined
              ? true
              : firstBoolean(row, ['message_alerts']),
          pawreport_alerts:
            row.pawreport_alerts === undefined
              ? true
              : firstBoolean(row, ['pawreport_alerts']),
          payment_alerts:
            row.payment_alerts === undefined
              ? true
              : firstBoolean(row, ['payment_alerts']),
          referral_alerts:
            row.referral_alerts === undefined
              ? true
              : firstBoolean(row, ['referral_alerts']),
        },
        table,
      };
    }
  }

  return {
    preferences: DEFAULT_PREFERENCES,
    table: null,
  };
}

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const themePreference = useThemePreference();
  const theme = getAppTheme(colorScheme === 'dark' ? 'dark' : 'light');
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isWebPreview = Platform.OS === 'web';

  const {
    user,
    profile,
    roles,
    primaryRole,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const activeRole: AppRole = primaryRole || roles[0] || 'pet_parent';

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [selectedFilter, setSelectedFilter] =
    useState<NotificationCategory>('all');
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [preferenceTable, setPreferenceTable] = useState<string | null>(null);
  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingPreference, setSavingPreference] =
    useState<NotificationPreferenceKey | null>(null);
  const [message, setMessage] = useState('');

  const displayName =
    profile?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    user?.email?.split('@')[0] ||
    'SitGuru member';

  const firstName =
    displayName.split(/\s+/).filter(Boolean)[0] || 'Member';

  const profileRecord = (profile ?? {}) as RecordRow;
  const metadata = (user?.user_metadata ?? {}) as RecordRow;
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

  const refresh = useCallback(
    async (showRefresh = false) => {
      if (authLoading) return;

      if (!isSupabaseConfigured || !user?.id) {
        setItems([]);
        setLoading(false);
        setRefreshing(false);
        setMessage(
          isAuthenticated
            ? 'Notifications are not connected in this environment.'
            : '',
        );
        return;
      }

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const [nextItems, preferenceResult] = await Promise.all([
          loadNotifications(user.id),
          loadPreferences(user.id),
        ]);

        setItems(nextItems);
        setPreferences(preferenceResult.preferences);
        setPreferenceTable(preferenceResult.table);
        setMessage('');
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : 'SitGuru could not load notifications.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authLoading, isAuthenticated, user?.id],
  );

  useEffect(() => {
    void refresh(false);
  }, [refresh]);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) return;

    const channel = supabase
      .channel(`mobile-notifications-${user.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => void refresh(false),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_notifications',
        },
        () => void refresh(false),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh, user?.id]);

  const visibleItems = useMemo(
    () =>
      items.filter(
        (item) =>
          selectedFilter === 'all' || item.category === selectedFilter,
      ),
    [items, selectedFilter],
  );

  const unreadCount = items.filter((item) => item.unread).length;
  const bookingCount = items.filter(
    (item) => item.category === 'bookings' && item.unread,
  ).length;
  const pawReportCount = items.filter(
    (item) => item.category === 'pawreport' && item.unread,
  ).length;
  const messageCount = items.filter(
    (item) => item.category === 'messages' && item.unread,
  ).length;

  async function markRead(item: NotificationItem) {
    if (!isSupabaseConfigured) return;

    const success = await updateNotification(item, {
      is_read: true,
      read: true,
      seen: true,
      read_at: new Date().toISOString(),
      seen_at: new Date().toISOString(),
    });

    if (!success) {
      setMessage('SitGuru could not update this notification.');
      return;
    }

    setItems((current) =>
      current.map((candidate) =>
        candidate.id === item.id
          ? { ...candidate, unread: false }
          : candidate,
      ),
    );
  }

  async function dismiss(item: NotificationItem) {
    if (!isSupabaseConfigured) return;

    const success = await updateNotification(item, {
      dismissed: true,
      is_dismissed: true,
      archived: true,
      dismissed_at: new Date().toISOString(),
      archived_at: new Date().toISOString(),
    });

    if (!success) {
      setMessage('SitGuru could not dismiss this notification.');
      return;
    }

    setItems((current) =>
      current.filter((candidate) => candidate.id !== item.id),
    );
  }

  async function markAllRead() {
    const unreadItems = items.filter((item) => item.unread);

    if (!unreadItems.length) return;

    const results = await Promise.all(
      unreadItems.map((item) =>
        updateNotification(item, {
          is_read: true,
          read: true,
          seen: true,
          read_at: new Date().toISOString(),
          seen_at: new Date().toISOString(),
        }),
      ),
    );

    if (results.some((result) => !result)) {
      setMessage(
        'Some notifications could not be updated. Pull down to refresh.',
      );
      return;
    }

    setItems((current) =>
      current.map((item) => ({ ...item, unread: false })),
    );
  }

  async function togglePreference(key: NotificationPreferenceKey) {
    if (!user?.id || !isSupabaseConfigured) return;

    const nextValue = !preferences[key];
    const nextPreferences = {
      ...preferences,
      [key]: nextValue,
    };

    setSavingPreference(key);

    let saved = false;

    if (preferenceTable) {
      const update = await supabase
        .from(preferenceTable)
        .update({
          [key]: nextValue,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      saved = !update.error;

      if (!saved) {
        const fallback = await supabase
          .from(preferenceTable)
          .upsert({
            user_id: user.id,
            ...nextPreferences,
            updated_at: new Date().toISOString(),
          });

        saved = !fallback.error;
      }
    } else {
      for (const table of PREFERENCE_TABLES) {
        const insert = await supabase.from(table).upsert({
          user_id: user.id,
          ...nextPreferences,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (!insert.error) {
          saved = true;
          setPreferenceTable(table);
          break;
        }
      }
    }

    setSavingPreference(null);

    if (!saved) {
      setMessage(
        'Notification preference was not saved. Please try again.',
      );
      return;
    }

    setPreferences(nextPreferences);
    setMessage('Notification preference saved.');
  }

  function openNotification(item: NotificationItem) {
    if (item.unread) {
      void markRead(item);
    }

    router.push(item.href as never);
  }

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
                  refreshControl={
                    <RefreshControl
                      colors={[theme.colors.primary]}
                      onRefresh={() => void refresh(true)}
                      refreshing={refreshing}
                      tintColor={theme.colors.primary}
                    />
                  }
                  showsVerticalScrollIndicator={false}>
                  <View style={styles.header}>
                    <View style={styles.headerCopy}>
                      <Text style={styles.headerTitle}>Notifications</Text>
                      <Text style={styles.headerWelcome}>
                        Welcome back, {firstName}!{' '}
                        <Text style={styles.wave}>👋</Text>
                      </Text>
                      <SitGuruRoleStatus role={activeRole} />
                    </View>

                    <View style={styles.headerActions}>
                      <Pressable
                        accessibilityLabel="Mark all notifications read"
                        accessibilityRole="button"
                        onPress={() => void markAllRead()}
                        style={styles.headerIconButton}>
                        <CheckCheck
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
                              onPress={() =>
                                setThemePreference(option.value)
                              }
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
                      <Bell color="#FFFFFF" size={24} strokeWidth={2.4} />
                    </View>
                    <Text style={styles.heroEyebrow}>
                      NOTIFICATIONS & ALERTS
                    </Text>
                    <Text style={styles.heroTitle}>
                      Stay on top of care
                    </Text>
                    <Text style={styles.heroSubtitle}>
                      Booking alerts, messages, PawReport updates, payments,
                      reminders, and account notices in one place.
                    </Text>
                  </View>

                  {message ? (
                    <View style={styles.messageCard}>
                      <Text style={styles.messageText}>{message}</Text>
                    </View>
                  ) : null}

                  <View style={styles.summaryGrid}>
                    {[
                      ['Unread', unreadCount],
                      ['Booking', bookingCount],
                      ['PawReport', pawReportCount],
                      ['Messages', messageCount],
                    ].map(([label, value]) => (
                      <View key={String(label)} style={styles.summaryCard}>
                        <Text style={styles.summaryValue}>{value}</Text>
                        <Text style={styles.summaryLabel}>{label}</Text>
                      </View>
                    ))}
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterRow}>
                    {FILTERS.map((filter) => {
                      const active = selectedFilter === filter.key;

                      return (
                        <Pressable
                          key={filter.key}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          onPress={() => setSelectedFilter(filter.key)}
                          style={[
                            styles.filterPill,
                            active ? styles.filterPillActive : null,
                          ]}>
                          <Text
                            style={[
                              styles.filterText,
                              active ? styles.filterTextActive : null,
                            ]}>
                            {filter.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  {loading ? (
                    <View style={styles.loadingCard}>
                      <ActivityIndicator
                        color={theme.colors.primary}
                        size="small"
                      />
                      <Text style={styles.loadingText}>
                        Loading notifications…
                      </Text>
                    </View>
                  ) : !isAuthenticated ? (
                    <View style={styles.emptyCard}>
                      <Bell
                        color={theme.colors.primary}
                        size={27}
                        strokeWidth={2.3}
                      />
                      <Text style={styles.emptyTitle}>
                        Sign in to view alerts
                      </Text>
                      <Text style={styles.emptyText}>
                        Notifications are connected to your SitGuru account
                        and active workspace.
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => router.push('/login')}
                        style={styles.primaryButton}>
                        <Text style={styles.primaryButtonText}>Sign in</Text>
                      </Pressable>
                    </View>
                  ) : visibleItems.length ? (
                    <View style={styles.notificationStack}>
                      {visibleItems.map((item) => (
                        <View
                          key={item.id}
                          style={[
                            styles.notificationCard,
                            item.unread
                              ? styles.notificationCardUnread
                              : null,
                          ]}>
                          <View style={styles.notificationTopRow}>
                            <View style={styles.notificationIcon}>
                              {categoryIcon(
                                item.category,
                                theme.colors.primary,
                              )}
                            </View>

                            <View style={styles.notificationCopy}>
                              <View style={styles.badgeRow}>
                                <Text style={styles.categoryBadge}>
                                  {categoryLabel(item.category)}
                                </Text>
                                <Text style={styles.timeText}>
                                  {formatRelativeTime(item.createdAt)}
                                </Text>
                                {item.unread ? (
                                  <View
                                    accessibilityLabel="Unread notification"
                                    style={styles.unreadDot}
                                  />
                                ) : null}
                              </View>

                              <Text style={styles.notificationTitle}>
                                {item.title}
                              </Text>
                              <Text style={styles.notificationMessage}>
                                {item.message}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.cardActions}>
                            <Pressable
                              accessibilityRole="button"
                              onPress={() => openNotification(item)}
                              style={styles.primaryButton}>
                              <Text style={styles.primaryButtonText}>
                                {item.actionLabel}
                              </Text>
                            </Pressable>

                            {item.unread ? (
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => void markRead(item)}
                                style={styles.iconActionButton}>
                                <Check
                                  color={theme.colors.primary}
                                  size={17}
                                  strokeWidth={2.5}
                                />
                              </Pressable>
                            ) : null}

                            <Pressable
                              accessibilityRole="button"
                              onPress={() => void dismiss(item)}
                              style={styles.iconActionButton}>
                              <X
                                color={theme.colors.primary}
                                size={17}
                                strokeWidth={2.5}
                              />
                            </Pressable>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyCard}>
                      <CheckCheck
                        color={theme.colors.primary}
                        size={28}
                        strokeWidth={2.3}
                      />
                      <Text style={styles.emptyTitle}>You’re all caught up</Text>
                      <Text style={styles.emptyText}>
                        New booking, message, PawReport, payment, support, and
                        account alerts will appear here.
                      </Text>
                    </View>
                  )}

                  <View style={styles.preferencesCard}>
                    <View style={styles.sectionHeader}>
                      <View>
                        <Text style={styles.sectionEyebrow}>
                          YOUR PREFERENCES
                        </Text>
                        <Text style={styles.sectionTitle}>
                          Notification settings
                        </Text>
                      </View>
                      <Settings2
                        color={theme.colors.primary}
                        size={21}
                        strokeWidth={2.3}
                      />
                    </View>

                    {[
                      ['booking_alerts', 'Booking alerts'],
                      ['message_alerts', 'Message alerts'],
                      ['pawreport_alerts', 'PawReport Live alerts'],
                      ['payment_alerts', 'Payment and payout alerts'],
                      ['referral_alerts', 'PawPerks and referral alerts'],
                    ].map(([key, label]) => {
                      const preferenceKey =
                        key as NotificationPreferenceKey;

                      return (
                        <View key={key} style={styles.preferenceRow}>
                          <View style={styles.preferenceCopy}>
                            <Text style={styles.preferenceLabel}>
                              {label}
                            </Text>
                            <Text style={styles.preferenceHelp}>
                              Manage alerts for this activity.
                            </Text>
                          </View>

                          {savingPreference === preferenceKey ? (
                            <ActivityIndicator
                              color={theme.colors.primary}
                              size="small"
                            />
                          ) : (
                            <Switch
                              accessibilityLabel={label}
                              onValueChange={() =>
                                void togglePreference(preferenceKey)
                              }
                              trackColor={{
                                false: theme.colors.border,
                                true: theme.colors.primarySoft,
                              }}
                              thumbColor={
                                preferences[preferenceKey]
                                  ? theme.colors.primary
                                  : '#FFFFFF'
                              }
                              value={preferences[preferenceKey]}
                            />
                          )}
                        </View>
                      );
                    })}
                  </View>

                  <View style={styles.privacyCard}>
                    <ShieldCheck
                      color={theme.colors.primary}
                      size={22}
                      strokeWidth={2.3}
                    />
                    <View style={styles.privacyCopy}>
                      <Text style={styles.privacyTitle}>
                        Safety & privacy
                      </Text>
                      <Text style={styles.privacyText}>
                        SitGuru only shows care, booking, payment, and account
                        details to the correct signed-in user and workspace.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.scrollBottomSpace} />
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
                        activeRole === 'guru'
                          ? '/guru-dashboard'
                          : activeRole === 'ambassador'
                            ? '/ambassador-dashboard'
                            : activeRole === 'admin'
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

  if (!parts.length) return 'SG';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

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
      backgroundColor: dark ? '#06140F' : '#FFF9F1',
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
    screen: {
      backgroundColor: dark ? '#06140F' : '#FFF9F1',
      flex: 1,
      position: 'relative',
      width: '100%',
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
      backgroundColor: theme.colors.text,
      borderRadius: 2,
      width: 3,
    },
    wifiText: {
      color: theme.colors.text,
      fontFamily: AppFonts.bold,
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
    scrollContent: {
      gap: 13,
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
    messageCard: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.borderStrong,
      borderRadius: 16,
      borderWidth: 1,
      padding: 11,
    },
    messageText: {
      color: theme.colors.text,
      fontFamily: AppFonts.semiBold,
      fontSize: 10,
      lineHeight: 16,
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    summaryCard: {
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 17,
      borderWidth: 1,
      flexBasis: '47%',
      flexGrow: 1,
      padding: 12,
    },
    summaryValue: {
      color: theme.colors.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 24,
    },
    summaryLabel: {
      color: theme.colors.textSecondary,
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
      textTransform: 'uppercase',
    },
    filterRow: {
      gap: 7,
      paddingRight: 8,
    },
    filterPill: {
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 11,
      paddingVertical: 8,
    },
    filterPillActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterText: {
      color: theme.colors.textSecondary,
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
    },
    filterTextActive: {
      color: '#FFFFFF',
    },
    loadingCard: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 8,
      justifyContent: 'center',
      minHeight: 120,
      padding: 18,
    },
    loadingText: {
      color: theme.colors.textSecondary,
      fontFamily: AppFonts.semiBold,
      fontSize: 11,
    },
    notificationStack: {
      gap: 9,
    },
    notificationCard: {
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 11,
      padding: 13,
    },
    notificationCardUnread: {
      borderColor: theme.colors.borderStrong,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: dark ? 0.18 : 0.06,
      shadowRadius: 9,
    },
    notificationTopRow: {
      flexDirection: 'row',
      gap: 10,
    },
    notificationIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 14,
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    notificationCopy: {
      flex: 1,
      gap: 4,
    },
    badgeRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    categoryBadge: {
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 999,
      color: theme.colors.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
      overflow: 'hidden',
      paddingHorizontal: 7,
      paddingVertical: 4,
      textTransform: 'uppercase',
    },
    timeText: {
      color: theme.colors.muted,
      flex: 1,
      fontFamily: AppFonts.bold,
      fontSize: 9,
    },
    unreadDot: {
      backgroundColor: theme.colors.primary,
      borderRadius: 999,
      height: 8,
      width: 8,
    },
    notificationTitle: {
      color: theme.colors.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 14,
      lineHeight: 18,
    },
    notificationMessage: {
      color: theme.colors.textSecondary,
      fontFamily: AppFonts.semiBold,
      fontSize: 10,
      lineHeight: 16,
    },
    cardActions: {
      flexDirection: 'row',
      gap: 7,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: 999,
      flex: 1,
      justifyContent: 'center',
      minHeight: 43,
      paddingHorizontal: 12,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
      textAlign: 'center',
    },
    iconActionButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 999,
      height: 43,
      justifyContent: 'center',
      width: 43,
    },
    emptyCard: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 20,
      borderStyle: 'dashed',
      borderWidth: 1,
      gap: 7,
      padding: 20,
    },
    emptyTitle: {
      color: theme.colors.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 15,
      textAlign: 'center',
    },
    emptyText: {
      color: theme.colors.textSecondary,
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 16,
      textAlign: 'center',
    },
    preferencesCard: {
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 22,
      borderWidth: 1,
      gap: 10,
      padding: 14,
    },
    sectionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    sectionEyebrow: {
      color: theme.colors.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
      letterSpacing: 0.7,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 17,
      letterSpacing: -0.3,
    },
    preferenceRow: {
      alignItems: 'center',
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'space-between',
      paddingTop: 10,
    },
    preferenceCopy: {
      flex: 1,
      gap: 2,
    },
    preferenceLabel: {
      color: theme.colors.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
    },
    preferenceHelp: {
      color: theme.colors.textSecondary,
      fontFamily: AppFonts.medium,
      fontSize: 9,
    },
    privacyCard: {
      alignItems: 'flex-start',
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.borderStrong,
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 9,
      padding: 13,
    },
    privacyCopy: {
      flex: 1,
      gap: 4,
    },
    privacyTitle: {
      color: theme.colors.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
    },
    privacyText: {
      color: theme.colors.textSecondary,
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 16,
    },
    scrollBottomSpace: {
      height: 6,
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
      width: 116,
    },
    pressed: {
      opacity: 0.76,
    },
  });
}