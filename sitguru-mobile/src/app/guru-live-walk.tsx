import { router, useLocalSearchParams } from 'expo-router';
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Droplets,
  Footprints,
  Home,
  MessageCircle,
  Pause,
  PawPrint,
  Play,
  Square,
  UserRound,
  Utensils
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
type CareStatus = 'not_started' | 'active' | 'paused' | 'completed';
type UpdateType = 'potty' | 'water' | 'food' | 'photo' | 'note';

type Booking = {
  id: string;
  petName: string;
  parentName: string;
  service: string;
  startAt: Date | null;
  endAt: Date | null;
  notes: string;
  location: string;
};

type Session = {
  id: string;
  sourceTable: string;
  status: CareStatus;
  startedAt: Date | null;
  pausedAt: Date | null;
  completedAt: Date | null;
  distanceMiles: number;
};

type CareUpdate = {
  id: string;
  type: UpdateType | 'status';
  label: string;
  note: string;
  createdAt: Date;
};

const BOOKING_TABLES = ['bookings', 'booking_requests', 'service_requests'];
const SESSION_TABLES = [
  'booking_visit_sessions',
  'pawreport_sessions',
  'visit_sessions',
];
const UPDATE_TABLES = [
  'booking_visit_updates',
  'pawreport_updates',
  'visit_updates',
];

const OWNER_FIELDS = [
  'guru_id',
  'provider_id',
  'caregiver_id',
  'user_id',
];

export default function GuruLiveWalkScreen() {
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const { user } = useAuth();
  const themeMode = useThemeMode();
  const isDark = themeMode === 'dark';
  const isWebPreview = Platform.OS === 'web';
  const palette = getPalette(isDark);
  const styles = createStyles(isDark);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [updates, setUpdates] = useState<CareUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [now, setNow] = useState(Date.now());

  const bookingId = Array.isArray(params.bookingId)
    ? params.bookingId[0]
    : params.bookingId;

  const loadCare = useCallback(
    async (showRefresh = false) => {
      if (!user?.id || !isSupabaseConfigured) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const bookingRow = await findBooking(user.id, bookingId);
        const mappedBooking = bookingRow
          ? mapBooking(bookingRow)
          : null;

        setBooking(mappedBooking);

        const activeBookingId = mappedBooking?.id || bookingId || '';
        const sessionResult = activeBookingId
          ? await findSession(user.id, activeBookingId)
          : null;

        if (sessionResult) {
          const mappedSession = mapSession(
            sessionResult.row,
            sessionResult.table,
          );
          setSession(mappedSession);

          const updateRows = await findUpdates(
            user.id,
            activeBookingId,
            mappedSession.id,
          );

          setUpdates(
            updateRows
              .map((row, index) => mapUpdate(row, index))
              .sort(
                (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
              ),
          );
        } else {
          setSession(null);
          setUpdates([]);
        }

        setMessage('');
      } catch {
        setMessage(
          'PawReport activity could not be loaded. Pull down to refresh.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [bookingId, user?.id],
  );

  useEffect(() => {
    void loadCare(false);
  }, [loadCare]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const refreshSoon = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void loadCare(false), 450);
    };

    let channel = supabase.channel(`guru-pawreport-${user.id}`);

    [...SESSION_TABLES, ...UPDATE_TABLES].forEach((table) => {
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
  }, [loadCare, user?.id]);

  const status: CareStatus = session?.status ?? 'not_started';
  const elapsedTime = useMemo(
    () => formatElapsed(session?.startedAt ?? null, now),
    [now, session?.startedAt],
  );

  async function startCare() {
    if (!user?.id || !booking?.id) {
      Alert.alert(
        'Booking required',
        'Open an accepted booking before starting PawReport Live.',
      );
      return;
    }

    setSaving(true);

    try {
      const created = await createSession(user.id, booking);

      if (!created) {
        throw new Error('No compatible session table found.');
      }

      const mapped = mapSession(created.row, created.table);
      setSession(mapped);
      setUpdates((current) => [
        {
          id: `status-${Date.now()}`,
          type: 'status',
          label: 'Care started',
          note: `PawReport Live started for ${booking.petName}.`,
          createdAt: new Date(),
        },
        ...current,
      ]);
    } catch {
      Alert.alert(
        'Unable to start care',
        'SitGuru could not create the PawReport session. Check the session table and permissions.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(nextStatus: CareStatus) {
    if (!session) return;

    const title =
      nextStatus === 'paused'
        ? 'Pause care?'
        : nextStatus === 'active'
          ? 'Resume care?'
          : 'Complete care?';

    const description =
      nextStatus === 'completed'
        ? 'Complete this visit and prepare the final PawReport?'
        : nextStatus === 'paused'
          ? 'Pause the active timer until care resumes?'
          : 'Resume the active care session?';

    Alert.alert(title, description, [
      { text: 'Cancel', style: 'cancel' },
      {
        text:
          nextStatus === 'completed'
            ? 'Complete'
            : nextStatus === 'paused'
              ? 'Pause'
              : 'Resume',
        onPress: async () => {
          setSaving(true);

          try {
            await updateSessionStatus(session, nextStatus);

            const nowDate = new Date();
            setSession((current) =>
              current
                ? {
                    ...current,
                    status: nextStatus,
                    pausedAt:
                      nextStatus === 'paused'
                        ? nowDate
                        : current.pausedAt,
                    completedAt:
                      nextStatus === 'completed'
                        ? nowDate
                        : current.completedAt,
                  }
                : current,
            );

            setUpdates((current) => [
              {
                id: `status-${Date.now()}`,
                type: 'status',
                label:
                  nextStatus === 'completed'
                    ? 'Care completed'
                    : nextStatus === 'paused'
                      ? 'Care paused'
                      : 'Care resumed',
                note:
                  nextStatus === 'completed'
                    ? 'Final PawReport is ready for review.'
                    : `PawReport status changed to ${nextStatus}.`,
                createdAt: nowDate,
              },
              ...current,
            ]);
          } catch {
            Alert.alert(
              'Unable to update care',
              'SitGuru could not save the PawReport status. Please try again.',
            );
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  }

  async function addUpdate(type: UpdateType) {
    if (!user?.id || !booking?.id || !session) {
      Alert.alert(
        'Start care first',
        'Start the PawReport session before adding care updates.',
      );
      return;
    }

    if (type === 'photo') {
      Alert.alert(
        'Photo upload',
        'The modern PawReport layout is ready for photo uploads. Connect the app’s existing media picker and storage upload to this button.',
      );
      return;
    }

    const labels: Record<Exclude<UpdateType, 'photo'>, string> = {
      potty: 'Potty update',
      water: 'Fresh water',
      food: 'Food update',
      note: 'Care note',
    };

    const notes: Record<Exclude<UpdateType, 'photo'>, string> = {
      potty: `${booking.petName} had a potty break.`,
      water: `Fresh water was provided for ${booking.petName}.`,
      food: `${booking.petName}'s food routine was completed.`,
      note: `A care note was added for ${booking.petName}.`,
    };

    const label = labels[type];
    const note = notes[type];

    setSaving(true);

    try {
      const saved = await createUpdate(
        user.id,
        booking.id,
        session.id,
        type,
        note,
      );

      if (!saved) {
        throw new Error('No compatible update table found.');
      }

      setUpdates((current) => [
        {
          id: firstString(saved, ['id', 'update_id']) || `update-${Date.now()}`,
          type,
          label,
          note,
          createdAt: firstDate(saved, ['created_at', 'updated_at']) || new Date(),
        },
        ...current,
      ]);
    } catch {
      Alert.alert(
        'Unable to save update',
        'SitGuru could not save this PawReport update. Check the update table and permissions.',
      );
    } finally {
      setSaving(false);
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
                      onRefresh={() => void loadCare(true)}
                      tintColor={palette.primary}
                      colors={[palette.primary]}
                    />
                  }
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.header}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Back to Bookings"
                      onPress={() => router.push('/guru-requests')}
                      style={styles.headerIconButton}
                    >
                      <ChevronLeft
                        color={palette.title}
                        size={20}
                        strokeWidth={2.4}
                      />
                    </Pressable>

                    <View style={styles.headerCopy}>
                      <Text style={styles.title}>PawReport Live</Text>
                      <Text style={styles.subtitle}>
                        Active care tracking and Pet Parent updates.
                      </Text>
                    </View>

                    <GuruHeaderActions />
                  </View>

                  {message ? (
                    <View style={styles.notice}>
                      <Text style={styles.noticeText}>{message}</Text>
                    </View>
                  ) : null}

                  {loading ? (
                    <View style={styles.loadingCard}>
                      <View style={styles.loadingLineLarge} />
                      <View style={styles.loadingLineMedium} />
                      <View style={styles.loadingLineSmall} />
                    </View>
                  ) : booking ? (
                    <>
                      <View style={styles.heroCard}>
                        <View style={styles.heroTop}>
                          <View style={styles.petAvatar}>
                            <Text style={styles.petEmoji}>🐾</Text>
                          </View>

                          <View style={styles.heroCopy}>
                            <Text style={styles.heroEyebrow}>
                              {statusLabel(status).toUpperCase()}
                            </Text>
                            <Text style={styles.heroTitle}>
                              {booking.petName}
                            </Text>
                            <Text style={styles.heroText}>
                              {booking.service} • {formatBookingTime(booking.startAt)}
                            </Text>
                          </View>

                          <View style={styles.timerPill}>
                            <Clock3
                              color="#FFFFFF"
                              size={15}
                              strokeWidth={2.3}
                            />
                            <Text style={styles.timerText}>{elapsedTime}</Text>
                          </View>
                        </View>

                        <View style={styles.heroStats}>
                          <HeroStat
                            label="Status"
                            value={statusLabel(status)}
                            styles={styles}
                          />
                          <HeroStat
                            label="Distance"
                            value={`${session?.distanceMiles.toFixed(1) ?? '0.0'} mi`}
                            styles={styles}
                          />
                          <HeroStat
                            label="Updates"
                            value={String(updates.length)}
                            styles={styles}
                          />
                        </View>
                      </View>

                      <View style={styles.mapCard}>
                        <View style={styles.mapHeader}>
                          <View>
                            <Text style={styles.cardEyebrow}>
                              LIVE CARE LOCATION
                            </Text>
                            <Text style={styles.cardTitle}>
                              {booking.location || 'Booking service area'}
                            </Text>
                          </View>

                          <View style={styles.mapStatusPill}>
                            <View
                              style={[
                                styles.liveDot,
                                status !== 'active' && styles.liveDotInactive,
                              ]}
                            />
                            <Text style={styles.mapStatusText}>
                              {status === 'active' ? 'Live' : statusLabel(status)}
                            </Text>
                          </View>
                        </View>

                        <RoutePreview styles={styles} />

                        <Text style={styles.privacyText}>
                          Location should only be tracked during active booked
                          care. Exact routes are visible only to authorized
                          booking participants.
                        </Text>
                      </View>

                      <View style={styles.controlCard}>
                        <Text style={styles.cardEyebrow}>CARE CONTROLS</Text>
                        <Text style={styles.cardTitle}>
                          {status === 'not_started'
                            ? 'Ready to begin'
                            : status === 'completed'
                              ? 'Care completed'
                              : 'PawReport is active'}
                        </Text>

                        {status === 'not_started' ? (
                          <Pressable
                            accessibilityRole="button"
                            disabled={saving}
                            onPress={() => void startCare()}
                            style={styles.startButton}
                          >
                            <Play
                              color="#FFFFFF"
                              size={19}
                              fill="#FFFFFF"
                            />
                            <Text style={styles.startButtonText}>
                              {saving ? 'Starting...' : 'Start Care'}
                            </Text>
                          </Pressable>
                        ) : status === 'completed' ? (
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => router.push('/booking-details')}
                            style={styles.completedButton}
                          >
                            <CheckCircle2
                              color={palette.primary}
                              size={19}
                              strokeWidth={2.4}
                            />
                            <Text style={styles.completedButtonText}>
                              Review Final PawReport
                            </Text>
                          </Pressable>
                        ) : (
                          <View style={styles.controlRow}>
                            <Pressable
                              accessibilityRole="button"
                              disabled={saving}
                              onPress={() =>
                                void changeStatus(
                                  status === 'paused' ? 'active' : 'paused',
                                )
                              }
                              style={styles.pauseButton}
                            >
                              {status === 'paused' ? (
                                <Play
                                  color={palette.primary}
                                  size={18}
                                  strokeWidth={2.4}
                                />
                              ) : (
                                <Pause
                                  color={palette.primary}
                                  size={18}
                                  strokeWidth={2.4}
                                />
                              )}
                              <Text style={styles.pauseButtonText}>
                                {status === 'paused' ? 'Resume' : 'Pause'}
                              </Text>
                            </Pressable>

                            <Pressable
                              accessibilityRole="button"
                              disabled={saving}
                              onPress={() => void changeStatus('completed')}
                              style={styles.endButton}
                            >
                              <Square
                                color="#FFFFFF"
                                size={17}
                                fill="#FFFFFF"
                              />
                              <Text style={styles.endButtonText}>
                                Complete Care
                              </Text>
                            </Pressable>
                          </View>
                        )}
                      </View>

                      <View style={styles.quickCard}>
                        <Text style={styles.cardEyebrow}>QUICK UPDATES</Text>
                        <Text style={styles.cardTitle}>
                          Keep the Pet Parent informed
                        </Text>

                        <View style={styles.quickGrid}>
                          <QuickUpdate
                            icon={
                              <Footprints
                                color={palette.primary}
                                size={20}
                                strokeWidth={2.3}
                              />
                            }
                            label="Potty"
                            onPress={() => void addUpdate('potty')}
                            styles={styles}
                          />
                          <QuickUpdate
                            icon={
                              <Droplets
                                color={palette.primary}
                                size={20}
                                strokeWidth={2.3}
                              />
                            }
                            label="Water"
                            onPress={() => void addUpdate('water')}
                            styles={styles}
                          />
                          <QuickUpdate
                            icon={
                              <Utensils
                                color={palette.primary}
                                size={20}
                                strokeWidth={2.3}
                              />
                            }
                            label="Food"
                            onPress={() => void addUpdate('food')}
                            styles={styles}
                          />
                          <QuickUpdate
                            icon={
                              <Camera
                                color={palette.primary}
                                size={20}
                                strokeWidth={2.3}
                              />
                            }
                            label="Photo"
                            onPress={() => void addUpdate('photo')}
                            styles={styles}
                          />
                          <QuickUpdate
                            icon={
                              <MessageCircle
                                color={palette.primary}
                                size={20}
                                strokeWidth={2.3}
                              />
                            }
                            label="Note"
                            onPress={() => void addUpdate('note')}
                            styles={styles}
                          />
                        </View>
                      </View>

                      <View style={styles.timelineCard}>
                        <View style={styles.timelineHeader}>
                          <View>
                            <Text style={styles.cardEyebrow}>
                              PAWREPORT TIMELINE
                            </Text>
                            <Text style={styles.cardTitle}>
                              Care updates
                            </Text>
                          </View>

                          <Text style={styles.timelineCount}>
                            {updates.length} updates
                          </Text>
                        </View>

                        {updates.length ? (
                          updates.map((update, index) => (
                            <UpdateRow
                              key={update.id}
                              last={index === updates.length - 1}
                              palette={palette}
                              styles={styles}
                              update={update}
                            />
                          ))
                        ) : (
                          <View style={styles.emptyTimeline}>
                            <PawPrint
                              color={palette.primary}
                              size={25}
                              strokeWidth={2.3}
                            />
                            <Text style={styles.emptyTimelineTitle}>
                              No updates yet
                            </Text>
                            <Text style={styles.emptyTimelineText}>
                              Start care and add updates throughout the visit.
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.notesCard}>
                        <Text style={styles.cardEyebrow}>CARE NOTES</Text>
                        <Text style={styles.cardTitle}>
                          Instructions for {booking.petName}
                        </Text>
                        <Text style={styles.notesText}>
                          {booking.notes ||
                            'No special care instructions were included with this booking.'}
                        </Text>

                        <Pressable
                          accessibilityRole="button"
                          onPress={() =>
                            router.push({
                              pathname: '/conversation',
                              params: { bookingId: booking.id },
                            })
                          }
                          style={styles.messageButton}
                        >
                          <MessageCircle
                            color="#FFFFFF"
                            size={18}
                            strokeWidth={2.3}
                          />
                          <Text style={styles.messageButtonText}>
                            Message Pet Parent
                          </Text>
                        </Pressable>
                      </View>
                    </>
                  ) : (
                    <View style={styles.emptyBookingCard}>
                      <View style={styles.emptyBookingIcon}>
                        <PawPrint
                          color={palette.primary}
                          size={30}
                          strokeWidth={2.3}
                        />
                      </View>
                      <Text style={styles.emptyBookingTitle}>
                        No active booking selected
                      </Text>
                      <Text style={styles.emptyBookingText}>
                        Open an accepted booking to prepare or start PawReport
                        Live.
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => router.push('/guru-requests')}
                        style={styles.startButton}
                      >
                        <Text style={styles.startButtonText}>
                          Open Bookings
                        </Text>
                      </Pressable>
                    </View>
                  )}
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
                    active
                    icon={
                      <PawPrint
                        color={palette.primary}
                        size={21}
                        strokeWidth={2.4}
                      />
                    }
                    label="PawReport"
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

function HeroStat({
  label,
  styles,
  value,
}: {
  label: string;
  styles: ReturnType<typeof createStyles>;
  value: string;
}) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function RoutePreview({
  styles,
}: {
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.mapCanvas}>
      <View style={styles.mapRoadOne} />
      <View style={styles.mapRoadTwo} />
      <View style={styles.mapPark} />
      <View style={styles.routeOne} />
      <View style={styles.routeTwo} />
      <View style={styles.startMarker} />
      <View style={styles.endMarker}>
        <PawPrint color="#FFFFFF" size={15} strokeWidth={2.4} />
      </View>
    </View>
  );
}

function QuickUpdate({
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
      style={styles.quickButton}
    >
      <View style={styles.quickIcon}>{icon}</View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function UpdateRow({
  last,
  palette,
  styles,
  update,
}: {
  last: boolean;
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
  update: CareUpdate;
}) {
  return (
    <View style={[styles.updateRow, last && styles.updateRowLast]}>
      <View style={styles.updateIcon}>
        {update.type === 'potty' ? (
          <Footprints
            color={palette.primary}
            size={17}
            strokeWidth={2.3}
          />
        ) : update.type === 'water' ? (
          <Droplets
            color={palette.primary}
            size={17}
            strokeWidth={2.3}
          />
        ) : update.type === 'food' ? (
          <Utensils
            color={palette.primary}
            size={17}
            strokeWidth={2.3}
          />
        ) : update.type === 'photo' ? (
          <Camera
            color={palette.primary}
            size={17}
            strokeWidth={2.3}
          />
        ) : update.type === 'status' ? (
          <CheckCircle2
            color={palette.primary}
            size={17}
            strokeWidth={2.3}
          />
        ) : (
          <MessageCircle
            color={palette.primary}
            size={17}
            strokeWidth={2.3}
          />
        )}
      </View>

      <View style={styles.updateCopy}>
        <Text style={styles.updateTitle}>{update.label}</Text>
        <Text style={styles.updateNote}>{update.note}</Text>
      </View>

      <Text style={styles.updateTime}>{formatTime(update.createdAt)}</Text>
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

async function findBooking(userId: string, bookingId?: string) {
  if (bookingId) {
    for (const table of BOOKING_TABLES) {
      const result = await supabase
        .from(table)
        .select('*')
        .eq('id', bookingId)
        .maybeSingle();

      if (!result.error && result.data) {
        return result.data as RecordRow;
      }
    }
  }

  for (const table of BOOKING_TABLES) {
    for (const ownerField of OWNER_FIELDS) {
      const result = await supabase
        .from(table)
        .select('*')
        .eq(ownerField, userId)
        .in('status', [
          'accepted',
          'confirmed',
          'booked',
          'scheduled',
          'active',
          'in_progress',
        ])
        .order('start_time', { ascending: true })
        .limit(1);

      if (!result.error && result.data?.length) {
        return result.data[0] as RecordRow;
      }
    }
  }

  return null;
}

async function findSession(userId: string, bookingId: string) {
  for (const table of SESSION_TABLES) {
    const byBooking = await supabase
      .from(table)
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!byBooking.error && byBooking.data?.length) {
      return {
        row: byBooking.data[0] as RecordRow,
        table,
      };
    }

    for (const ownerField of OWNER_FIELDS) {
      const byOwner = await supabase
        .from(table)
        .select('*')
        .eq(ownerField, userId)
        .in('status', [
          'active',
          'in_progress',
          'started',
          'paused',
          'completed',
        ])
        .order('created_at', { ascending: false })
        .limit(1);

      if (!byOwner.error && byOwner.data?.length) {
        return {
          row: byOwner.data[0] as RecordRow,
          table,
        };
      }
    }
  }

  return null;
}

async function findUpdates(
  userId: string,
  bookingId: string,
  sessionId: string,
) {
  for (const table of UPDATE_TABLES) {
    const sessionResult = await supabase
      .from(table)
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!sessionResult.error && sessionResult.data?.length) {
      return sessionResult.data as RecordRow[];
    }

    const bookingResult = await supabase
      .from(table)
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!bookingResult.error && bookingResult.data?.length) {
      return bookingResult.data as RecordRow[];
    }
  }

  return [];
}

async function createSession(userId: string, booking: Booking) {
  const now = new Date().toISOString();

  const payloads: RecordRow[] = [
    {
      booking_id: booking.id,
      guru_id: userId,
      status: 'active',
      started_at: now,
      session_type: booking.service.toLowerCase().includes('walk')
        ? 'walk'
        : 'visit',
    },
    {
      booking_id: booking.id,
      user_id: userId,
      status: 'active',
      started_at: now,
    },
    {
      booking_id: booking.id,
      status: 'active',
      started_at: now,
    },
  ];

  for (const table of SESSION_TABLES) {
    for (const payload of payloads) {
      const result = await supabase
        .from(table)
        .insert(payload)
        .select('*')
        .single();

      if (!result.error && result.data) {
        return {
          row: result.data as RecordRow,
          table,
        };
      }
    }
  }

  return null;
}

async function updateSessionStatus(
  session: Session,
  status: CareStatus,
) {
  const now = new Date().toISOString();

  const payloads: RecordRow[] =
    status === 'completed'
      ? [
          { status, completed_at: now, ended_at: now, updated_at: now },
          { status, completed_at: now, updated_at: now },
          { status },
        ]
      : status === 'paused'
        ? [
            { status, paused_at: now, updated_at: now },
            { status, updated_at: now },
            { status },
          ]
        : [
            { status, resumed_at: now, updated_at: now },
            { status, updated_at: now },
            { status },
          ];

  for (const payload of payloads) {
    const result = await supabase
      .from(session.sourceTable)
      .update(payload)
      .eq('id', session.id);

    if (!result.error) return;
  }

  throw new Error('Unable to update session.');
}

async function createUpdate(
  userId: string,
  bookingId: string,
  sessionId: string,
  type: UpdateType,
  note: string,
) {
  const now = new Date().toISOString();

  const payloads: RecordRow[] = [
    {
      session_id: sessionId,
      booking_id: bookingId,
      guru_id: userId,
      update_type: type,
      note,
      created_at: now,
    },
    {
      session_id: sessionId,
      booking_id: bookingId,
      user_id: userId,
      type,
      message: note,
      created_at: now,
    },
    {
      session_id: sessionId,
      booking_id: bookingId,
      type,
      note,
      created_at: now,
    },
  ];

  for (const table of UPDATE_TABLES) {
    for (const payload of payloads) {
      const result = await supabase
        .from(table)
        .insert(payload)
        .select('*')
        .single();

      if (!result.error && result.data) {
        return result.data as RecordRow;
      }
    }
  }

  return null;
}

function mapBooking(row: RecordRow): Booking {
  return {
    id: firstString(row, ['id', 'booking_id', 'request_id']),
    petName: firstString(row, ['pet_name', 'animal_name']) || 'Pet',
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
    ]),
    endAt: firstDate(row, ['end_time', 'ends_at', 'end_date']),
    notes:
      firstString(row, [
        'care_notes',
        'notes',
        'special_instructions',
        'request_notes',
      ]) || '',
    location:
      firstString(row, [
        'service_city',
        'city',
        'service_area',
        'service_zip',
        'zip_code',
      ]) || '',
  };
}

function mapSession(row: RecordRow, table: string): Session {
  const rawStatus = normalizeStatus(
    firstString(row, ['status', 'session_status', 'visit_status']),
  );

  const status: CareStatus = ['completed', 'complete', 'finished'].includes(
    rawStatus,
  )
    ? 'completed'
    : ['paused', 'on_hold'].includes(rawStatus)
      ? 'paused'
      : ['active', 'in_progress', 'started', 'checked_in'].includes(
            rawStatus,
          )
        ? 'active'
        : 'not_started';

  return {
    id:
      firstString(row, ['id', 'session_id', 'visit_session_id']) ||
      `session-${Date.now()}`,
    sourceTable: table,
    status,
    startedAt: firstDate(row, [
      'started_at',
      'start_time',
      'checked_in_at',
      'created_at',
    ]),
    pausedAt: firstDate(row, ['paused_at']),
    completedAt: firstDate(row, [
      'completed_at',
      'ended_at',
      'end_time',
    ]),
    distanceMiles:
      normalizeDistance(
        firstNumber(row, [
          'distance_miles',
          'walk_distance_miles',
          'total_distance_miles',
          'distance',
        ]),
        firstString(row, ['distance_unit', 'unit']),
      ) ?? 0,
  };
}

function mapUpdate(row: RecordRow, index: number): CareUpdate {
  const rawType = normalizeStatus(
    firstString(row, ['update_type', 'type', 'event_type']),
  );

  const type: CareUpdate['type'] = rawType.includes('potty')
    ? 'potty'
    : rawType.includes('water')
      ? 'water'
      : rawType.includes('food')
        ? 'food'
        : rawType.includes('photo')
          ? 'photo'
          : rawType.includes('status')
            ? 'status'
            : 'note';

  const label =
    firstString(row, ['label', 'title']) ||
    (type === 'potty'
      ? 'Potty update'
      : type === 'water'
        ? 'Fresh water'
        : type === 'food'
          ? 'Food update'
          : type === 'photo'
            ? 'Photo update'
            : type === 'status'
              ? 'Care status'
              : 'Care note');

  return {
    id: firstString(row, ['id', 'update_id']) || `update-${index}`,
    type,
    label,
    note:
      firstString(row, ['note', 'message', 'description', 'text']) ||
      'PawReport update recorded.',
    createdAt:
      firstDate(row, ['created_at', 'updated_at', 'recorded_at']) ||
      new Date(),
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

function normalizeStatus(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function normalizeDistance(value: number | null, unit: string) {
  if (value === null) return null;
  const normalized = unit.toLowerCase();
  if (normalized.includes('meter')) return value / 1609.344;
  if (normalized.includes('km')) return value * 0.621371;
  return value;
}

function statusLabel(status: CareStatus) {
  if (status === 'not_started') return 'Not started';
  if (status === 'active') return 'In progress';
  if (status === 'paused') return 'Paused';
  return 'Completed';
}

function formatElapsed(startedAt: Date | null, now: number) {
  if (!startedAt) return '0 min';

  const minutes = Math.max(
    0,
    Math.round((now - startedAt.getTime()) / 60_000),
  );

  if (minutes < 60) return `${minutes} min`;

  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function formatBookingTime(date: Date | null) {
  if (!date) return 'Time to be confirmed';

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
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
    mapBackground: isDark ? '#10291E' : '#EAF5E8',
    mapRoad: isDark ? '#2A4A39' : '#FFFFFF',
    mapPark: isDark ? '#1D4A32' : '#CFE6D5',
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
      gap: 11,
      padding: 14,
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
    petAvatar: {
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderRadius: 999,
      height: 50,
      justifyContent: 'center',
      width: 50,
    },
    petEmoji: { fontSize: 22 },
    heroCopy: { flex: 1, gap: 2 },
    heroEyebrow: {
      color: 'rgba(255,255,255,0.74)',
      fontFamily: AppFonts.bold,
      fontSize: 7,
      letterSpacing: 0.7,
    },
    heroTitle: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 20,
    },
    heroText: {
      color: 'rgba(255,255,255,0.84)',
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
    timerPill: {
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderRadius: 999,
      flexDirection: 'row',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 7,
    },
    timerText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    heroStats: {
      borderTopColor: 'rgba(255,255,255,0.20)',
      borderTopWidth: 1,
      flexDirection: 'row',
      paddingTop: 10,
    },
    heroStat: { flex: 1, gap: 2 },
    heroStatValue: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
    },
    heroStatLabel: {
      color: 'rgba(255,255,255,0.66)',
      fontFamily: AppFonts.medium,
      fontSize: 6,
    },
    mapCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 9,
      padding: 12,
    },
    mapHeader: {
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
    mapStatusPill: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    liveDot: {
      backgroundColor: palette.primary,
      borderRadius: 999,
      height: 7,
      width: 7,
    },
    liveDotInactive: { backgroundColor: palette.muted },
    mapStatusText: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 7,
    },
    mapCanvas: {
      backgroundColor: palette.mapBackground,
      borderRadius: 17,
      height: 190,
      overflow: 'hidden',
      position: 'relative',
    },
    mapRoadOne: {
      backgroundColor: palette.mapRoad,
      height: 23,
      left: -20,
      position: 'absolute',
      top: 77,
      transform: [{ rotate: '13deg' }],
      width: 420,
    },
    mapRoadTwo: {
      backgroundColor: palette.mapRoad,
      height: 20,
      left: 105,
      position: 'absolute',
      top: 20,
      transform: [{ rotate: '-56deg' }],
      width: 260,
    },
    mapPark: {
      backgroundColor: palette.mapPark,
      borderRadius: 999,
      height: 78,
      position: 'absolute',
      right: 24,
      top: 19,
      width: 78,
    },
    routeOne: {
      backgroundColor: palette.primary,
      borderRadius: 999,
      height: 6,
      left: 60,
      position: 'absolute',
      top: 104,
      transform: [{ rotate: '18deg' }],
      width: 180,
    },
    routeTwo: {
      backgroundColor: palette.primary,
      borderRadius: 999,
      height: 6,
      left: 194,
      position: 'absolute',
      top: 82,
      transform: [{ rotate: '-31deg' }],
      width: 90,
    },
    startMarker: {
      backgroundColor: '#FFFFFF',
      borderColor: palette.primary,
      borderRadius: 999,
      borderWidth: 4,
      height: 24,
      left: 52,
      position: 'absolute',
      top: 96,
      width: 24,
    },
    endMarker: {
      alignItems: 'center',
      backgroundColor: palette.primary,
      borderColor: '#FFFFFF',
      borderRadius: 999,
      borderWidth: 3,
      height: 36,
      justifyContent: 'center',
      position: 'absolute',
      right: 74,
      top: 52,
      width: 36,
    },
    privacyText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 7,
      lineHeight: 11,
    },
    controlCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 10,
      padding: 12,
    },
    startButton: {
      alignItems: 'center',
      backgroundColor: palette.primary,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 7,
      justifyContent: 'center',
      minHeight: 45,
      paddingHorizontal: 14,
    },
    startButtonText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
    },
    controlRow: { flexDirection: 'row', gap: 8 },
    pauseButton: {
      alignItems: 'center',
      borderColor: palette.primary,
      borderRadius: 999,
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      minHeight: 43,
    },
    pauseButtonText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    endButton: {
      alignItems: 'center',
      backgroundColor: palette.primary,
      borderRadius: 999,
      flex: 1,
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      minHeight: 43,
    },
    endButtonText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    completedButton: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 7,
      justifyContent: 'center',
      minHeight: 43,
    },
    completedButtonText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    quickCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 10,
      padding: 12,
    },
    quickGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },
    quickButton: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderRadius: 14,
      flexBasis: '18%',
      flexGrow: 1,
      gap: 5,
      justifyContent: 'center',
      minHeight: 72,
      padding: 7,
    },
    quickIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      height: 35,
      justifyContent: 'center',
      width: 35,
    },
    quickLabel: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 7,
    },
    timelineCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      overflow: 'hidden',
      paddingTop: 12,
    },
    timelineHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: 7,
      paddingHorizontal: 12,
    },
    timelineCount: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
    updateRow: {
      alignItems: 'center',
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 9,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    updateRowLast: { borderBottomWidth: 0 },
    updateIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 11,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    updateCopy: { flex: 1, gap: 2 },
    updateTitle: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 9,
    },
    updateNote: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 7,
      lineHeight: 11,
    },
    updateTime: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 7,
    },
    emptyTimeline: {
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 18,
      paddingVertical: 22,
    },
    emptyTimelineTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
    },
    emptyTimelineText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      textAlign: 'center',
    },
    notesCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 9,
      padding: 12,
    },
    notesText: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 14,
    },
    messageButton: {
      alignItems: 'center',
      backgroundColor: palette.primary,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 7,
      justifyContent: 'center',
      minHeight: 42,
    },
    messageButtonText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    emptyBookingCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 8,
      paddingHorizontal: 25,
      paddingVertical: 30,
    },
    emptyBookingIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      height: 62,
      justifyContent: 'center',
      width: 62,
    },
    emptyBookingTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 15,
    },
    emptyBookingText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 14,
      textAlign: 'center',
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