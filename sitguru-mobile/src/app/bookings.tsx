import { router } from 'expo-router';
import {
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  PawPrint,
  Plus,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import SitGuruButton from '@/components/SitGuruButton';
import SitGuruIconButton from '@/components/SitGuruIconButton';
import SitGuruChip from '@/components/mobile/SitGuruChip';
import SitGuruScreen from '@/components/SitGuruScreen';
import SitGuruTabBar from '@/components/SitGuruTabBar';
import SitGuruThemeToggle from '@/components/SitGuruThemeToggle';
import { ButtonMetrics } from '@/constants/button-tokens';
import { AppFonts } from '@/constants/fonts';
import { useThemeMode } from '@/hooks/use-theme';
import { useBookings, type SitGuruBooking } from '@/hooks/data/useBookings';
import { useFloatingTabBarScroll } from '@/hooks/useFloatingTabBarScroll';

type BookingFilter = 'upcoming' | 'past' | 'all';

const filterOptions: Array<{ label: string; value: BookingFilter }> = [
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Past', value: 'past' },
  { label: 'All', value: 'all' },
];

const PAST_STATUSES = new Set(['completed', 'cancelled', 'canceled', 'declined']);
const LIVE_STATUSES = new Set(['in_progress', 'active', 'started']);

/** Bookings a Guru accepted but the parent has not paid for yet. */
function needsPayment(booking: SitGuruBooking): boolean {
  const accepted = booking.status === 'accepted' || booking.status === 'confirmed';
  const settled =
    booking.paymentStatus === 'paid' ||
    booking.paymentStatus === 'succeeded' ||
    booking.paymentStatus === 'captured';

  return accepted && !settled;
}

function statusLabel(booking: SitGuruBooking): string {
  if (LIVE_STATUSES.has(booking.status)) return 'In care';
  if (needsPayment(booking)) return 'Payment due';

  switch (booking.status) {
    case 'pending':
      return 'Awaiting Guru';
    case 'accepted':
    case 'confirmed':
      return 'Confirmed';
    case 'completed':
      return 'Completed';
    case 'cancelled':
    case 'canceled':
      return 'Cancelled';
    case 'declined':
      return 'Declined';
    default:
      return booking.status ? booking.status.replace(/_/g, ' ') : 'Requested';
  }
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value: string): string {
  const date = parseDate(value);
  if (!date) return 'Date to be confirmed';

  const today = new Date();
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (sameDay) {
    return `Today · ${date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    })}`;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

export default function BookingsScreen() {
  const isWebPreview = Platform.OS === 'web';
  const isDark = useThemeMode() === 'dark';
  const palette = getPalette(isDark);
  const styles = createStyles(isDark);

  const { bookings, loading, error, refresh } = useBookings({
    role: 'pet_parent',
  });
  const tabBarScroll = useFloatingTabBarScroll();

  const [activeFilter, setActiveFilter] = useState<BookingFilter>('upcoming');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sorted = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const aTime = parseDate(a.requestedStartDate)?.getTime() ?? 0;
      const bTime = parseDate(b.requestedStartDate)?.getTime() ?? 0;
      return bTime - aTime;
    });
  }, [bookings]);

  const visible = useMemo(() => {
    if (activeFilter === 'all') return sorted;

    return sorted.filter((booking) => {
      const isPast = PAST_STATUSES.has(booking.status);
      return activeFilter === 'past' ? isPast : !isPast;
    });
  }, [activeFilter, sorted]);

  const actionCount = useMemo(
    () => bookings.filter(needsPayment).length,
    [bookings],
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  return (
    <SitGuruScreen center={isWebPreview} maxWidth={620}>
      <View
        style={[
          styles.previewCanvas,
          !isWebPreview && styles.previewCanvasNative,
        ]}
      >
        <View
          style={[styles.deviceFrame, !isWebPreview && styles.deviceFrameNative]}
        >
          <View
            style={[styles.phoneShell, !isWebPreview && styles.phoneShellNative]}
          >
            <View style={styles.screen}>
              <ScrollView
                {...tabBarScroll}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={() => void handleRefresh()}
                    tintColor={palette.primary}
                    colors={[palette.primary]}
                  />
                }
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.header}>
                  <View style={styles.headerCopy}>
                    <Text style={styles.title}>Bookings</Text>
                    <Text style={styles.subtitle}>
                      {actionCount > 0
                        ? `${actionCount} booking${actionCount === 1 ? '' : 's'} ready to pay.`
                        : 'Care you have requested and completed.'}
                    </Text>
                  </View>

                  <View style={styles.headerActions}>
                    <SitGuruThemeToggle />

                    <SitGuruIconButton
                      accessibilityHint="Starts a new care request."
                      accessibilityLabel="Request care"
                      onPress={() => router.push('/find-care')}
                      variant="accent"
                    >
                      <Plus
                        color="#FFFFFF"
                        size={ButtonMetrics.iconGlyph}
                        strokeWidth={2.6}
                      />
                    </SitGuruIconButton>
                  </View>
                </View>

                <View style={styles.filterRail}>
                  {filterOptions.map((option) => (
                    <SitGuruChip
                      key={option.value}
                      label={option.label}
                      onPress={() => setActiveFilter(option.value)}
                      selected={activeFilter === option.value}
                    />
                  ))}
                </View>

                {error ? (
                  <View style={styles.noticeCard}>
                    <Text style={styles.noticeText}>
                      Some bookings could not be loaded. Pull down to try again.
                    </Text>
                  </View>
                ) : null}

                {loading && bookings.length === 0 ? (
                  <View style={styles.loadingList}>
                    {[0, 1, 2].map((item) => (
                      <View key={item} style={styles.loadingRow}>
                        <View style={styles.loadingIcon} />
                        <View style={styles.loadingCopy}>
                          <View style={styles.loadingBarLarge} />
                          <View style={styles.loadingBarSmall} />
                        </View>
                      </View>
                    ))}
                  </View>
                ) : visible.length > 0 ? (
                  <View style={styles.bookingList}>
                    {visible.map((booking) => (
                      <BookingRow
                        booking={booking}
                        key={booking.id}
                        palette={palette}
                        styles={styles}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyCard}>
                    <View style={styles.emptyIcon}>
                      <CalendarDays
                        color={palette.primary}
                        size={26}
                        strokeWidth={2.3}
                      />
                    </View>

                    <Text style={styles.emptyTitle}>
                      {activeFilter === 'past'
                        ? 'No past bookings'
                        : 'No upcoming care'}
                    </Text>

                    <Text style={styles.emptyText}>
                      {activeFilter === 'past'
                        ? 'Completed and cancelled bookings will show up here.'
                        : 'Your upcoming pet care bookings will appear here.'}
                    </Text>

                    <SitGuruButton
                      label="Find a Guru"
                      onPress={() => router.push('/find-care')}
                    />
                  </View>
                )}
              </ScrollView>

              <SitGuruTabBar active="bookings" />
            </View>
          </View>
        </View>
      </View>
    </SitGuruScreen>
  );
}

function BookingRow({
  booking,
  palette,
  styles,
}: {
  booking: SitGuruBooking;
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
}) {
  const live = LIVE_STATUSES.has(booking.status);
  const payable = needsPayment(booking);
  const past = PAST_STATUSES.has(booking.status);

  return (
    <BubblePressable
      accessibilityHint={`Opens details for ${booking.petName} with ${booking.guruName}.`}
      accessibilityLabel={`${booking.serviceType} for ${booking.petName}`}
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: '/booking-details',
          params: { bookingId: booking.id },
        })
      }
      scaleTo={0.97}
      style={styles.bookingCard}
    >
      <View style={styles.bookingIcon}>
        <PawPrint color={palette.primary} size={20} strokeWidth={2.3} />
      </View>

      <View style={styles.bookingCopy}>
        <View style={styles.bookingTopRow}>
          <Text numberOfLines={1} style={styles.bookingService}>
            {booking.serviceType}
          </Text>

          <View
            style={[
              styles.statusPill,
              live && styles.statusPillLive,
              payable && styles.statusPillPayable,
              past && styles.statusPillPast,
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                live && styles.statusPillTextLive,
                payable && styles.statusPillTextPayable,
                past && styles.statusPillTextPast,
              ]}
            >
              {statusLabel(booking)}
            </Text>
          </View>
        </View>

        <Text numberOfLines={1} style={styles.bookingMeta}>
          {booking.petName} · {booking.guruName}
        </Text>

        <View style={styles.bookingBottomRow}>
          <CalendarDays color={palette.muted} size={14} strokeWidth={2.3} />
          <Text style={styles.bookingDate}>
            {formatDate(booking.requestedStartDate)}
          </Text>

          {payable ? (
            <>
              <CircleDollarSign
                color={palette.orange}
                size={14}
                strokeWidth={2.4}
              />
              <Text style={styles.bookingPayNote}>Pay to confirm</Text>
            </>
          ) : null}
        </View>
      </View>

      <ChevronRight color={palette.muted} size={18} strokeWidth={2.3} />
    </BubblePressable>
  );
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
    onPrimary: isDark ? '#06140F' : '#FFFFFF',
    orange: '#F15A3A',
    orangeSoft: isDark ? '#3A1A12' : '#FDEBE6',
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
      overflow: 'hidden',
    },
    screen: {
      backgroundColor: palette.background,
      flex: 1,
      width: '100%',
    },

    scrollContent: {
      gap: 13,
      paddingBottom: 24,
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
      minWidth: 0,
    },
    title: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 22,
      letterSpacing: -0.4,
    },
    subtitle: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 12,
      marginTop: 2,
    },
    headerActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },

    filterRail: {
      flexDirection: 'row',
      gap: 8,
    },

    noticeCard: {
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.border,
      borderRadius: 14,
      borderWidth: 1,
      padding: 12,
    },
    noticeText: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 12,
    },

    loadingList: {
      gap: 10,
    },
    loadingRow: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 12,
      padding: 14,
    },
    loadingIcon: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 12,
      height: 42,
      width: 42,
    },
    loadingCopy: {
      flex: 1,
      gap: 7,
    },
    loadingBarLarge: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 6,
      height: 12,
      width: '62%',
    },
    loadingBarSmall: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 6,
      height: 10,
      width: '40%',
    },

    bookingList: {
      gap: 10,
    },
    bookingCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 12,
      padding: 14,
    },
    bookingIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 12,
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    bookingCopy: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    bookingTopRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'space-between',
    },
    bookingService: {
      color: palette.title,
      flexShrink: 1,
      fontFamily: AppFonts.bold,
      fontSize: 14,
    },
    bookingMeta: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 12,
    },
    bookingBottomRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 5,
    },
    bookingDate: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 11,
      marginRight: 4,
    },
    bookingPayNote: {
      color: palette.orange,
      fontFamily: AppFonts.semiBold,
      fontSize: 11,
    },

    statusPill: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 3,
    },
    statusPillLive: {
      backgroundColor: palette.primary,
    },
    statusPillPayable: {
      backgroundColor: palette.orangeSoft,
    },
    statusPillPast: {
      backgroundColor: palette.surfaceSoft,
    },
    statusPillText: {
      color: palette.text,
      fontFamily: AppFonts.semiBold,
      fontSize: 10,
    },
    statusPillTextLive: {
      color: palette.onPrimary,
    },
    statusPillTextPayable: {
      color: palette.orange,
    },
    statusPillTextPast: {
      color: palette.muted,
    },

    emptyCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 26,
    },
    emptyIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      height: 52,
      justifyContent: 'center',
      width: 52,
    },
    emptyTitle: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 15,
    },
    emptyText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 12,
      textAlign: 'center',
    },
  });
}
