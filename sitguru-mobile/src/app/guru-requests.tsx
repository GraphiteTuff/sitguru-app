import { router } from 'expo-router';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Home,
  MapPin,
  MessageCircle,
  Search,
  UserRound,
  X,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GuruHeaderActions } from '@/components/GuruHeaderActions';
import RoleGate from '@/components/RoleGate';
import SitGuruScreen from '@/components/SitGuruScreen';
import { AppFonts } from '@/constants/fonts';
import { useThemeMode } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { resolveSupabaseStorageUrl } from '@/lib/storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type RecordRow = Record<string, unknown>;
type RequestTab = 'pending' | 'upcoming' | 'past';

type CareRequest = {
  id: string;
  sourceTable: string;
  status: string;
  petName: string;
  petPhotoUrl: string | null;
  parentName: string;
  service: string;
  startAt: Date | null;
  endAt: Date | null;
  earnings: number;
  distanceMiles: number | null;
  location: string;
  notes: string;
  pending: boolean;
  upcoming: boolean;
  past: boolean;
};

const TABLES = ['booking_requests', 'service_requests', 'bookings'];
const OWNER_FIELDS = [
  'guru_id',
  'provider_id',
  'sitter_id',
  'caregiver_id',
  'assigned_guru_id',
  'user_id',
];

export default function GuruRequestsScreen() {
  const { user } = useAuth();
  const themeMode = useThemeMode();
  const isDark = themeMode === 'dark';
  const isWebPreview = Platform.OS === 'web';
  const palette = getPalette(isDark);
  const styles = createStyles(isDark);

  const [requests, setRequests] = useState<CareRequest[]>([]);
  const [tab, setTab] = useState<RequestTab>('pending');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const loadRequests = useCallback(
    async (showRefresh = false) => {
      if (!user?.id || !isSupabaseConfigured) {
        setRequests([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const rows = await queryGuruRows(user.id);
        const mapped = rows
          .map((item, index) => mapRequest(item.row, item.table, index))
          .filter((item): item is CareRequest => Boolean(item))
          .sort(compareRequests);

        setRequests(mapped);
        setMessage('');
      } catch {
        setMessage(
          'Some requests could not be loaded. Pull down to refresh.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    void loadRequests(false);
  }, [loadRequests]);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const refreshSoon = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void loadRequests(false), 450);
    };

    let channel = supabase.channel(`guru-requests-${user.id}`);

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
  }, [loadRequests, user?.id]);

  const counts = useMemo(
    () => ({
      pending: requests.filter((item) => item.pending).length,
      upcoming: requests.filter((item) => item.upcoming).length,
      past: requests.filter((item) => item.past).length,
    }),
    [requests],
  );

  const visibleRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return requests.filter((item) => {
      const matchesTab =
        tab === 'pending'
          ? item.pending
          : tab === 'upcoming'
            ? item.upcoming
            : item.past;

      if (!matchesTab) return false;
      if (!normalizedQuery) return true;

      return [
        item.petName,
        item.parentName,
        item.service,
        item.location,
        item.notes,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [query, requests, tab]);

  async function updateRequestStatus(
    request: CareRequest,
    nextStatus: 'accepted' | 'declined',
  ) {
    if (!isSupabaseConfigured) {
      Alert.alert(
        'SitGuru connection needed',
        'Supabase is not configured for this build.',
      );
      return;
    }

    const actionLabel = nextStatus === 'accepted' ? 'Accept' : 'Decline';

    Alert.alert(
      `${actionLabel} request?`,
      `${actionLabel} the ${request.service} request for ${request.petName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionLabel,
          style: nextStatus === 'declined' ? 'destructive' : 'default',
          onPress: async () => {
            setUpdatingId(request.id);

            try {
              const result = await supabase
                .from(request.sourceTable)
                .update({
                  status: nextStatus,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', request.id);

              if (result.error) throw result.error;

              setRequests((current) =>
                current.map((item) =>
                  item.id === request.id
                    ? {
                        ...item,
                        status: nextStatus,
                        pending: false,
                        upcoming: nextStatus === 'accepted',
                        past: nextStatus === 'declined',
                      }
                    : item,
                ),
              );

              setTab(nextStatus === 'accepted' ? 'upcoming' : 'past');

              Alert.alert(
                nextStatus === 'accepted'
                  ? 'Request accepted'
                  : 'Request declined',
                nextStatus === 'accepted'
                  ? 'The booking is now in Upcoming care.'
                  : 'The request was moved out of your pending queue.',
              );
            } catch {
              Alert.alert(
                'Unable to update request',
                'SitGuru could not update this request. Check the table permissions and status field, then try again.',
              );
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ],
    );
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
                  keyboardShouldPersistTaps="handled"
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={() => void loadRequests(true)}
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
                      <Text style={styles.title}>Bookings & Requests</Text>
                      <Text style={styles.subtitle}>
                        Review, accept, and prepare for care.
                      </Text>
                    </View>

                    <GuruHeaderActions />
                  </View>

                  {message ? (
                    <View style={styles.notice}>
                      <Text style={styles.noticeText}>{message}</Text>
                    </View>
                  ) : null}

                  <View style={styles.tabRow}>
                    {(
                      [
                        ['pending', 'Pending', counts.pending],
                        ['upcoming', 'Upcoming', counts.upcoming],
                        ['past', 'Past', counts.past],
                      ] as const
                    ).map(([value, label, count]) => {
                      const active = tab === value;

                      return (
                        <Pressable
                          key={value}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          onPress={() => setTab(value)}
                          style={[
                            styles.tabButton,
                            active && styles.tabButtonActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.tabLabel,
                              active && styles.tabLabelActive,
                            ]}
                          >
                            {label}
                          </Text>

                          <View
                            style={[
                              styles.tabBadge,
                              active && styles.tabBadgeActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.tabBadgeText,
                                active && styles.tabBadgeTextActive,
                              ]}
                            >
                              {count}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.searchBar}>
                    <Search
                      color={palette.muted}
                      size={18}
                      strokeWidth={2.2}
                    />
                    <TextInput
                      accessibilityLabel="Search care requests"
                      onChangeText={setQuery}
                      placeholder="Search pets, services, or Pet Parents"
                      placeholderTextColor={palette.muted}
                      style={styles.searchInput}
                      value={query}
                    />
                    {query ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Clear search"
                        onPress={() => setQuery('')}
                      >
                        <X
                          color={palette.muted}
                          size={18}
                          strokeWidth={2.2}
                        />
                      </Pressable>
                    ) : null}
                  </View>

                  {loading ? (
                    <LoadingCards styles={styles} />
                  ) : visibleRequests.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <View style={styles.emptyIcon}>
                        <CalendarDays
                          color={palette.primary}
                          size={28}
                          strokeWidth={2.2}
                        />
                      </View>
                      <Text style={styles.emptyTitle}>
                        {tab === 'pending'
                          ? 'No requests waiting'
                          : tab === 'upcoming'
                            ? 'No upcoming care'
                            : 'No past bookings yet'}
                      </Text>
                      <Text style={styles.emptyText}>
                        {tab === 'pending'
                          ? 'New Pet Parent requests will appear here.'
                          : tab === 'upcoming'
                            ? 'Accepted bookings will appear here with preparation details.'
                            : 'Completed and declined requests will be saved here.'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.requestStack}>
                      {visibleRequests.map((request) => (
                        <RequestCard
                          key={`${request.sourceTable}-${request.id}`}
                          request={request}
                          updating={updatingId === request.id}
                          onAccept={() =>
                            void updateRequestStatus(request, 'accepted')
                          }
                          onDecline={() =>
                            void updateRequestStatus(request, 'declined')
                          }
                          palette={palette}
                          styles={styles}
                        />
                      ))}
                    </View>
                  )}

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push('/guru-pricing')}
                    style={styles.infoCard}
                  >
                    <View style={styles.infoIcon}>
                      <Clock3
                        color={palette.primary}
                        size={20}
                        strokeWidth={2.3}
                      />
                    </View>

                    <View style={styles.infoCopy}>
                      <Text style={styles.infoTitle}>
                        Keep pricing and availability current
                      </Text>
                      <Text style={styles.infoText}>
                        Accurate rates and calendar rules help avoid declined
                        requests.
                      </Text>
                    </View>

                    <ChevronRight
                      color={palette.primary}
                      size={18}
                      strokeWidth={2.3}
                    />
                  </Pressable>
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
                      <MapPin
                        color={palette.navMuted}
                        size={21}
                        strokeWidth={2.3}
                      />
                    }
                    label="Care Map"
                    onPress={() => router.push('/guru-care-map')}
                    styles={styles}
                  />
                  <BottomNavItem
                    active
                    icon={
                      <CalendarDays
                        color={palette.primary}
                        size={21}
                        strokeWidth={2.4}
                      />
                    }
                    label="Bookings"
                    onPress={() => undefined}
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

function RequestCard({
  onAccept,
  onDecline,
  palette,
  request,
  styles,
  updating,
}: {
  onAccept: () => void;
  onDecline: () => void;
  palette: ReturnType<typeof getPalette>;
  request: CareRequest;
  styles: ReturnType<typeof createStyles>;
  updating: boolean;
}) {
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Avatar
          emojiFallback
          fallback="🐾"
          imageUrl={request.petPhotoUrl}
          palette={palette}
          size={54}
        />

        <View style={styles.requestCopy}>
          <Text style={styles.petName}>{request.petName}</Text>
          <Text style={styles.serviceLine}>{request.service}</Text>
          <Text style={styles.dateLine}>
            {formatDateTime(request.startAt)}
          </Text>
        </View>

        <View style={styles.earningsBox}>
          <Text style={styles.earningsLabel}>Your earnings</Text>
          <Text style={styles.earningsValue}>
            {currency(request.earnings)}
          </Text>
        </View>
      </View>

      <View style={styles.detailGrid}>
        <Detail
          icon={
            <UserRound
              color={palette.primary}
              size={15}
              strokeWidth={2.2}
            />
          }
          label={request.parentName}
          styles={styles}
        />
        <Detail
          icon={
            <MapPin
              color={palette.primary}
              size={15}
              strokeWidth={2.2}
            />
          }
          label={
            request.distanceMiles !== null
              ? `${request.distanceMiles.toFixed(1)} miles away`
              : request.location || 'Location available in details'
          }
          styles={styles}
        />
      </View>

      {request.notes ? (
        <Text style={styles.notes} numberOfLines={3}>
          {request.notes}
        </Text>
      ) : null}

      <View style={styles.cardActions}>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: '/booking-details',
              params: { bookingId: request.id },
            })
          }
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>View Details</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: '/conversation',
              params: { bookingId: request.id },
            })
          }
          style={styles.iconButton}
        >
          <MessageCircle
            color={palette.primary}
            size={18}
            strokeWidth={2.3}
          />
        </Pressable>

        {request.pending ? (
          <>
            <Pressable
              accessibilityRole="button"
              disabled={updating}
              onPress={onDecline}
              style={styles.declineButton}
            >
              <X
                color={palette.orange}
                size={17}
                strokeWidth={2.5}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={updating}
              onPress={onAccept}
              style={styles.acceptButton}
            >
              <Check color="#FFFFFF" size={17} strokeWidth={2.5} />
              <Text style={styles.acceptButtonText}>
                {updating ? 'Saving...' : 'Accept'}
              </Text>
            </Pressable>
          </>
        ) : request.upcoming ? (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/guru-live-walk',
                params: { bookingId: request.id },
              })
            }
            style={styles.acceptButton}
          >
            <Text style={styles.acceptButtonText}>Prepare Care</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function Detail({
  icon,
  label,
  styles,
}: {
  icon: ReactNode;
  label: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.detailItem}>
      {icon}
      <Text style={styles.detailText} numberOfLines={1}>
        {label}
      </Text>
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

function Avatar({
  emojiFallback = false,
  fallback,
  imageUrl,
  palette,
  size,
}: {
  emojiFallback?: boolean;
  fallback: string;
  imageUrl?: string | null;
  palette: ReturnType<typeof getPalette>;
  size: number;
}) {
  const [failed, setFailed] = useState(false);

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
      {imageUrl && !failed ? (
        <Image
          onError={() => setFailed(true)}
          resizeMode="cover"
          source={{ uri: imageUrl }}
          style={{ height: '100%', width: '100%' }}
        />
      ) : (
        <Text
          style={{
            color: palette.primary,
            fontFamily: AppFonts.extraBold,
            fontSize: emojiFallback ? 23 : 12,
          }}
        >
          {fallback}
        </Text>
      )}
    </View>
  );
}

function LoadingCards({
  styles,
}: {
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.requestStack}>
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.loadingCard}>
          <View style={styles.loadingCircle} />
          <View style={styles.loadingCopy}>
            <View style={styles.loadingLineLarge} />
            <View style={styles.loadingLineMedium} />
            <View style={styles.loadingLineSmall} />
          </View>
        </View>
      ))}
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

async function queryGuruRows(userId: string) {
  const rows: Array<{ row: RecordRow; table: string }> = [];

  for (const table of TABLES) {
    for (const ownerField of OWNER_FIELDS) {
      const result = await supabase
        .from(table)
        .select('*')
        .eq(ownerField, userId)
        .limit(100);

      if (!result.error && result.data?.length) {
        rows.push(
          ...(result.data as RecordRow[]).map((row) => ({ row, table })),
        );
        break;
      }
    }
  }

  return rows;
}

function mapRequest(
  row: RecordRow,
  sourceTable: string,
  index: number,
): CareRequest | null {
  const status =
    normalizeStatus(
      firstString(row, ['status', 'booking_status', 'request_status']),
    ) || 'pending';

  if (status === 'not_listed') return null;

  const pendingStatuses = [
    'pending',
    'requested',
    'submitted',
    'awaiting',
    'awaiting_response',
    'requestable',
  ];

  const upcomingStatuses = [
    'accepted',
    'confirmed',
    'booked',
    'scheduled',
    'active',
    'in_progress',
  ];

  const pastStatuses = [
    'completed',
    'complete',
    'finished',
    'declined',
    'rejected',
    'cancelled',
    'canceled',
  ];

  return {
    id: firstString(row, ['id', 'booking_id', 'request_id']) || `request-${index}`,
    sourceTable,
    status,
    petName: firstString(row, ['pet_name', 'animal_name']) || 'Pet',
    petPhotoUrl: resolveSupabaseStorageUrl(
      firstString(row, [
        'pet_photo_url',
        'pet_image_url',
        'animal_photo_url',
      ]),
    ),
    parentName:
      firstString(row, [
        'pet_parent_name',
        'customer_name',
        'client_name',
        'owner_name',
      ]) || 'Pet Parent',
    service:
      firstString(row, [
        'service_name',
        'service_type',
        'service',
        'booking_type',
      ]) || 'Pet Care',
    startAt: firstDate(row, [
      'start_time',
      'starts_at',
      'scheduled_at',
      'booking_date',
      'service_date',
      'start_date',
      'date',
    ]),
    endAt: firstDate(row, [
      'end_time',
      'ends_at',
      'completed_at',
      'end_date',
    ]),
    earnings:
      firstNumber(row, [
        'guru_earnings',
        'provider_earnings',
        'net_amount',
        'payout_amount',
        'estimated_earnings',
        'guru_amount',
      ]) ?? 0,
    distanceMiles: normalizeDistance(
      firstNumber(row, [
        'distance_miles',
        'distance',
        'distance_from_guru',
      ]),
      firstString(row, ['distance_unit', 'unit']),
    ),
    location:
      firstString(row, [
        'service_city',
        'city',
        'service_area',
        'service_zip',
        'zip_code',
      ]) || '',
    notes:
      firstString(row, [
        'care_notes',
        'notes',
        'special_instructions',
        'request_notes',
      ]) || '',
    pending: pendingStatuses.includes(status),
    upcoming: upcomingStatuses.includes(status),
    past: pastStatuses.includes(status),
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

function normalizeDistance(value: number | null, unit: string) {
  if (value === null) return null;
  const normalized = unit.toLowerCase();
  if (normalized.includes('meter')) return value / 1609.344;
  if (normalized.includes('km')) return value * 0.621371;
  return value;
}

function normalizeStatus(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function compareRequests(a: CareRequest, b: CareRequest) {
  const group = (item: CareRequest) =>
    item.pending ? 0 : item.upcoming ? 1 : 2;

  const groupDifference = group(a) - group(b);
  if (groupDifference !== 0) return groupDifference;

  return (
    (a.startAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
    (b.startAt?.getTime() ?? Number.MAX_SAFE_INTEGER)
  );
}

function formatDateTime(date: Date | null) {
  if (!date) return 'Date and time to be confirmed';

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function currency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'GG';
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
    orange: '#F15A3A',
    navMuted: isDark ? '#9BAAA1' : '#748079',
    avatarBg: isDark ? '#173527' : '#EEF5EE',
    avatarBorder: isDark ? '#2E6C4B' : '#FFFFFF',
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
      lineHeight: 13,
    },
    tabRow: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 4,
      padding: 4,
    },
    tabButton: {
      alignItems: 'center',
      borderRadius: 12,
      flex: 1,
      flexDirection: 'row',
      gap: 5,
      justifyContent: 'center',
      minHeight: 38,
    },
    tabButtonActive: { backgroundColor: palette.primary },
    tabLabel: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 9,
    },
    tabLabelActive: { color: '#FFFFFF' },
    tabBadge: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      justifyContent: 'center',
      minHeight: 19,
      minWidth: 19,
      paddingHorizontal: 5,
    },
    tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.18)' },
    tabBadgeText: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    tabBadgeTextActive: { color: '#FFFFFF' },
    searchBar: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 8,
      minHeight: 47,
      paddingHorizontal: 12,
    },
    searchInput: {
      color: palette.title,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 10,
      paddingVertical: 0,
    },
    requestStack: { gap: 10 },
    requestCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 11,
      padding: 13,
    },
    requestHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    requestCopy: { flex: 1, gap: 2 },
    petName: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 14,
    },
    serviceLine: {
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 9,
    },
    dateLine: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
    earningsBox: {
      alignItems: 'flex-end',
      backgroundColor: palette.primarySoft,
      borderRadius: 12,
      paddingHorizontal: 9,
      paddingVertical: 7,
    },
    earningsLabel: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 6,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    earningsValue: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 15,
      marginTop: 1,
    },
    detailGrid: { flexDirection: 'row', gap: 8 },
    detailItem: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderRadius: 11,
      flex: 1,
      flexDirection: 'row',
      gap: 5,
      minHeight: 33,
      paddingHorizontal: 8,
    },
    detailText: {
      color: palette.text,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
    notes: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
    },
    cardActions: { flexDirection: 'row', gap: 7 },
    secondaryButton: {
      alignItems: 'center',
      borderColor: palette.primary,
      borderRadius: 999,
      borderWidth: 1,
      flex: 1,
      justifyContent: 'center',
      minHeight: 38,
      paddingHorizontal: 9,
    },
    secondaryButtonText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    iconButton: {
      alignItems: 'center',
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    declineButton: {
      alignItems: 'center',
      backgroundColor: isDark ? '#3A251D' : '#FFF0E7',
      borderRadius: 999,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    acceptButton: {
      alignItems: 'center',
      backgroundColor: palette.primary,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 5,
      justifyContent: 'center',
      minHeight: 38,
      paddingHorizontal: 14,
    },
    acceptButtonText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    emptyCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 7,
      paddingHorizontal: 24,
      paddingVertical: 30,
    },
    emptyIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      height: 58,
      justifyContent: 'center',
      width: 58,
    },
    emptyTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 15,
      marginTop: 3,
    },
    emptyText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 14,
      textAlign: 'center',
    },
    loadingCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 11,
      padding: 13,
    },
    loadingCircle: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 52,
      width: 52,
    },
    loadingCopy: { flex: 1, gap: 8 },
    loadingLineLarge: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 10,
      width: '64%',
    },
    loadingLineMedium: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 8,
      width: '86%',
    },
    loadingLineSmall: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 8,
      width: '44%',
    },
    infoCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      padding: 12,
    },
    infoIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 12,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    infoCopy: { flex: 1, gap: 2 },
    infoTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
    },
    infoText: {
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