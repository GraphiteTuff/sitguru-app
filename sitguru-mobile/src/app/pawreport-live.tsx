import { router, useLocalSearchParams } from 'expo-router';
import {
  Camera,
  ChevronLeft,
  Clock3,
  Droplets,
  FileText,
  Footprints,
  MapPin,
  MessageCircle,
  Navigation,
  PawPrint,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react-native';
import { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import LiveRouteHeader from '@/components/mobile/LiveRouteHeader';
import CachedRemoteImage from '@/components/mobile/CachedRemoteImage';
import MobileScreen from '@/components/mobile/MobileScreen';
import StickyActionBar from '@/components/mobile/StickyActionBar';
import TouchTarget from '@/components/mobile/TouchTarget';
import RoleGate from '@/components/RoleGate';
import SitGuruButton from '@/components/SitGuruButton';
import { SitGuruColors } from '@/constants/colors';
import { AppFonts } from '@/constants/fonts';
import {
  MobileSpace,
  MobileType,
  StickyFooterClearance,
  TOUCH_MIN,
} from '@/constants/mobile-layout';
import { usePawReportLive } from '@/hooks/data/usePawReportLive';
import { requestContextualPushPriming } from '@/lib/push-priming';
import type { LiveCoords } from '@/hooks/useLiveLocation';

function formatClock(date: Date | null) {
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/**
 * Pet Parent live PawReport tracker — walk API metrics + event badges/logs.
 */
export default function PawReportLiveScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 760;
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const bookingId = Array.isArray(params.bookingId)
    ? params.bookingId[0]
    : params.bookingId;

  const { snapshot, loading, error, refresh, bookingId: activeId } =
    usePawReportLive(bookingId);
  const hasBooking = Boolean(activeId || bookingId);
  const reviewReady = hasBooking && /completed|finished|ended/i.test(snapshot.statusLabel);

  const coords = useMemo<LiveCoords | null>(() => {
    if (
      typeof snapshot.latitude !== 'number' ||
      typeof snapshot.longitude !== 'number'
    ) {
      return null;
    }
    return {
      latitude: snapshot.latitude,
      longitude: snapshot.longitude,
      accuracy: null,
      heading: null,
      speed: null,
      timestamp: 0,
    };
  }, [snapshot.latitude, snapshot.longitude]);

  // Only show real coordinates, never the map component's generic fallback center.
  const hasRoute = Boolean(coords || snapshot.trail.length > 0);

  useEffect(() => {
    if (snapshot.isLive) {
      requestContextualPushPriming();
    }
  }, [snapshot.isLive]);

  return (
    <RoleGate requiredRole="pet_parent">
      <MobileScreen
        scrollBottomInset={StickyFooterClearance.actionPlusNav}
        refreshing={loading}
        onRefresh={() => void refresh()}
        footer={
          <StickyActionBar embedded>
            {snapshot.isLive && hasBooking ? (
              <>
                <SitGuruButton
                  label="Message Guru"
                  onPress={() =>
                    router.push({
                      pathname: '/conversation',
                      params: { bookingId: activeId || bookingId || '' },
                    })
                  }
                />
                <SitGuruButton
                  label="Back to dashboard"
                  variant="secondary"
                  onPress={() => router.push('/pet-parent-dashboard')}
                />
              </>
            ) : reviewReady ? (
              <>
                <SitGuruButton
                  label="Review completed visit"
                  onPress={() =>
                    router.push({
                      pathname: '/reviews',
                      params: { bookingId: activeId || bookingId || '' },
                    })
                  }
                />
                <SitGuruButton
                  label="My bookings"
                  variant="secondary"
                  onPress={() => router.push('/bookings')}
                />
              </>
            ) : (
              <>
                <SitGuruButton
                  label={hasBooking ? 'My bookings' : 'Find care'}
                  onPress={() => router.push(hasBooking ? '/bookings' : '/find-care')}
                />
                <SitGuruButton
                  label="Back to dashboard"
                  variant="secondary"
                  onPress={() => router.push('/pet-parent-dashboard')}
                />
              </>
            )}
          </StickyActionBar>
        }
      >
        <View style={[styles.pageWidth, isWide && styles.pageWidthWide]}>
          <View style={styles.header}>
            <TouchTarget
              accessibilityRole="button"
              accessibilityLabel="Back to Pet Parent dashboard"
              onPress={() => router.push('/pet-parent-dashboard')}
              style={styles.back}
            >
              <ChevronLeft color="#FFFFFF" size={22} strokeWidth={2.4} />
            </TouchTarget>
            <View style={styles.headerCopy}>
              <View style={styles.eyebrowRow}>
                <PawPrint color="#C6F68D" size={16} strokeWidth={2.5} />
                <Text style={styles.eyebrow}>The SitGuru care experience</Text>
              </View>
              <Text style={styles.title}>PawReport Live</Text>
              <Text style={styles.subtitle}>
                {snapshot.petName}
                {snapshot.isLive
                  ? ' · Live now'
                  : hasBooking
                    ? ' · ' + snapshot.statusLabel
                    : ' · Choose a booking'}
              </Text>
            </View>
            <TouchTarget
              accessibilityRole="button"
              accessibilityLabel="Refresh PawReport"
              onPress={() => void refresh()}
              style={styles.refresh}
            >
              <RefreshCw color="#FFFFFF" size={20} strokeWidth={2.4} />
            </TouchTarget>
          </View>
          <View style={styles.contextRow}>
            <ShieldCheck color="#147346" size={18} strokeWidth={2.3} />
            <Text style={styles.contextText}>
              {hasBooking
                ? "Your Guru's shared updates, connected to this booking."
                : 'Open a booking to view live visit details. No sample data is shown here.'}
            </Text>
          </View>

        {error ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              {snapshot.logs.length || snapshot.photos.length
                ? 'Live map is catching up. Care notes and photos below are still from this visit.'
                : 'PawReport will appear when your Guru starts care. Pull down to refresh.'}
            </Text>
          </View>
        ) : null}

        {loading && !activeId ? (
          <View style={styles.loading}>
            <ActivityIndicator color={SitGuruColors.primary} />
            <Text style={styles.loadingText}>Loading live care…</Text>
          </View>
        ) : (
          <>
            <View style={styles.metricsRow}>
              <Metric
                icon={
                  <Clock3 color={SitGuruColors.primary} size={18} strokeWidth={2.4} />
                }
                label="Timer"
                value={`${snapshot.durationMinutes} min`}
              />
              <Metric
                icon={
                  <Navigation
                    color={SitGuruColors.primary}
                    size={18}
                    strokeWidth={2.4}
                  />
                }
                label="Distance"
                value={`${snapshot.distanceMiles.toFixed(1)} mi`}
              />
              <Metric
                icon={
                  <MapPin color={SitGuruColors.primary} size={18} strokeWidth={2.4} />
                }
                label="Status"
                value={snapshot.isLive ? 'Live' : hasBooking ? 'Waiting' : 'No visit'}
              />
            </View>

            {hasRoute ? (
              <LiveRouteHeader
                locationLabel={snapshot.petName + ' with ' + snapshot.guruName}
                live={snapshot.isLive}
                coords={coords}
                trail={snapshot.trail}
                photoPins={snapshot.photoPins}
                distanceMiles={snapshot.distanceMiles}
                expanded
                autoCenter
              />
            ) : (
              <View style={styles.emptyRoute}>
                <View style={styles.emptyRouteIcon}>
                  <MapPin color="#00844C" size={28} strokeWidth={2.2} />
                </View>
                <Text style={styles.emptyRouteTitle}>Walk map</Text>
                <Text style={styles.emptyRouteText}>
                  Your Guru's route will appear here when GPS tracking is available for this booking.
                </Text>
              </View>
            )}

            {snapshot.badges.length ? (
              <View style={styles.badgeRow}>
                {snapshot.badges.map((badge) => (
                  <View key={badge.id} style={styles.badge}>
                    {badge.kind === 'photo' ? (
                      <Camera color={SitGuruColors.primary} size={14} />
                    ) : badge.kind === 'water' ? (
                      <Droplets color={SitGuruColors.primary} size={14} />
                    ) : badge.kind === 'potty' ? (
                      <Footprints color={SitGuruColors.primary} size={14} />
                    ) : (
                      <FileText color={SitGuruColors.primary} size={14} />
                    )}
                    <Text style={styles.badgeText}>{badge.label}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyBadges}>
                Event badges appear as photos, water, and potty updates arrive.
              </Text>
            )}

            {snapshot.photos.length ? (
              <View style={styles.photoSection}>
                <Text style={styles.sectionEyebrow}>Photos from your Guru</Text>
                <Text style={styles.sectionTitle}>
                  {snapshot.photoCount} new photo
                  {snapshot.photoCount === 1 ? '' : 's'}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photoTrack}
                >
                  {snapshot.photos.map((photo) => (
                    <CachedRemoteImage
                      key={photo.id}
                      uri={photo.url}
                      accessibilityLabel="Live care photo"
                      style={styles.photoThumb}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionEyebrow}>Care log</Text>
              <Text style={styles.sectionTitle}>Care timeline</Text>
              <Text style={styles.message}>{snapshot.message}</Text>

              {snapshot.logs.length === 0 ? (
                <View style={styles.emptyLog}>
                  <MessageCircle
                    color={SitGuruColors.primary}
                    size={20}
                    strokeWidth={2.4}
                  />
                  <Text style={styles.emptyLogText}>
                    Itemized care notes will stream here from your Guru’s walk
                    session.
                  </Text>
                </View>
              ) : (
                snapshot.logs.map((log) => (
                  <View key={log.id} style={styles.logRow}>
                    <View style={styles.logIcon}>
                      {log.kind === 'photo' ? (
                        <Camera color={SitGuruColors.primary} size={16} />
                      ) : log.kind === 'water' ? (
                        <Droplets color={SitGuruColors.primary} size={16} />
                      ) : log.kind === 'potty' ? (
                        <Footprints color={SitGuruColors.primary} size={16} />
                      ) : (
                        <FileText color={SitGuruColors.primary} size={16} />
                      )}
                    </View>
                    <View style={styles.logCopy}>
                      <Text style={styles.logTitle}>{log.title}</Text>
                      {log.photoUrl ? (
                        <CachedRemoteImage
                          uri={log.photoUrl}
                          accessibilityLabel={log.title}
                          style={styles.logPhoto}
                        />
                      ) : (
                        <Text style={styles.logDetail}>{log.detail}</Text>
                      )}
                    </View>
                    <Text style={styles.logTime}>
                      {formatClock(log.createdAt)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
        </View>
      </MobileScreen>
    </RoleGate>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metric}>
      {icon}
      <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pageWidth: {
    width: '100%',
    alignSelf: 'center',
    gap: MobileSpace.md,
  },
  pageWidthWide: {
    maxWidth: 980,
    paddingHorizontal: MobileSpace.lg,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#005438',
    borderRadius: 24,
    flexDirection: 'row',
    gap: MobileSpace.sm,
    minHeight: 122,
    padding: MobileSpace.md,
  },
  back: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 14,
    height: TOUCH_MIN,
    width: TOUCH_MIN,
  },
  refresh: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 14,
    height: TOUCH_MIN,
    width: TOUCH_MIN,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyebrow: {
    color: '#C6F68D',
    fontFamily: AppFonts.bold,
    fontSize: MobileType.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.title,
  },
  subtitle: {
    color: '#E8FFF2',
    fontFamily: AppFonts.medium,
    fontSize: MobileType.caption,
  },
  contextRow: {
    backgroundColor: '#E9F7EF',
    borderColor: '#D1EBDD',
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    flexDirection: 'row',
    gap: MobileSpace.sm,
    padding: MobileSpace.md,
  },
  contextText: {
    flex: 1,
    color: '#174B36',
    fontFamily: AppFonts.medium,
    fontSize: MobileType.caption,
    lineHeight: 20,
  },
  emptyRoute: {
    alignItems: 'center',
    backgroundColor: '#EDFAF2',
    borderColor: '#CEEADA',
    borderRadius: 22,
    borderWidth: 1,
    gap: MobileSpace.sm,
    justifyContent: 'center',
    minHeight: 205,
    padding: MobileSpace.xl,
  },
  emptyRouteIcon: {
    alignItems: 'center',
    backgroundColor: '#D7F2E3',
    borderRadius: 18,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  emptyRouteTitle: {
    color: '#123D2C',
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.section,
  },
  emptyRouteText: {
    color: '#425F50',
    fontFamily: AppFonts.medium,
    fontSize: MobileType.caption,
    lineHeight: 21,
    textAlign: 'center',
  },
  notice: {
    backgroundColor: '#FEF3F2',
    borderRadius: 14,
    marginBottom: MobileSpace.md,
    padding: MobileSpace.md,
  },
  noticeText: {
    color: '#B42318',
    fontFamily: AppFonts.medium,
    fontSize: MobileType.caption,
  },
  loading: {
    alignItems: 'center',
    gap: MobileSpace.sm,
    paddingVertical: MobileSpace.xxl,
  },
  loadingText: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.medium,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: MobileSpace.sm,
    marginBottom: MobileSpace.md,
  },
  metric: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D1EBDD',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 5,
    minWidth: 0,
    minHeight: 100,
    padding: MobileSpace.sm,
  },
  metricValue: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.section,
  },
  metricLabel: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.micro,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: MobileSpace.sm,
    marginTop: MobileSpace.md,
    marginBottom: MobileSpace.md,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12,
  },
  badgeText: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.bold,
    fontSize: MobileType.caption,
  },
  emptyBadges: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.caption,
    marginVertical: MobileSpace.md,
  },
  photoSection: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: MobileSpace.sm,
    marginBottom: MobileSpace.md,
    padding: MobileSpace.lg,
  },
  photoTrack: {
    gap: MobileSpace.sm,
    paddingVertical: MobileSpace.xs,
  },
  photoThumb: {
    borderRadius: 16,
    height: 120,
    width: 120,
  },
  section: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: MobileSpace.sm,
    padding: MobileSpace.lg,
  },
  sectionEyebrow: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.bold,
    fontSize: MobileType.micro,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.section,
  },
  message: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.body,
    lineHeight: 22,
    marginBottom: MobileSpace.sm,
  },
  emptyLog: {
    alignItems: 'center',
    gap: MobileSpace.sm,
    paddingVertical: MobileSpace.lg,
  },
  emptyLogText: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.caption,
    textAlign: 'center',
  },
  logRow: {
    alignItems: 'flex-start',
    borderTopColor: SitGuruColors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: MobileSpace.sm,
    paddingVertical: MobileSpace.md,
  },
  logIcon: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  logCopy: {
    flex: 1,
    gap: 2,
  },
  logTitle: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.bold,
    fontSize: MobileType.label,
  },
  logDetail: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.caption,
    lineHeight: 18,
  },
  logPhoto: {
    borderRadius: 12,
    height: 96,
    marginTop: 6,
    width: 120,
  },
  logTime: {
    color: SitGuruColors.textSoft,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.micro,
  },
});
