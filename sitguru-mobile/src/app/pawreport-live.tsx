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
} from 'lucide-react-native';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
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
import type { LiveCoords } from '@/hooks/useLiveLocation';

function formatClock(date: Date | null) {
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/**
 * Pet Parent live PawReport tracker — walk API metrics + event badges/logs.
 */
export default function PawReportLiveScreen() {
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const bookingId = Array.isArray(params.bookingId)
    ? params.bookingId[0]
    : params.bookingId;

  const { snapshot, loading, error, refresh, bookingId: activeId } =
    usePawReportLive(bookingId);

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
      timestamp: Date.now(),
    };
  }, [snapshot.latitude, snapshot.longitude]);

  return (
    <RoleGate requiredRole="pet_parent">
      <MobileScreen
        scrollBottomInset={StickyFooterClearance.actionPlusNav}
        refreshing={loading}
        onRefresh={() => void refresh()}
        footer={
          <StickyActionBar embedded>
            {snapshot.isLive ? (
              <>
                <SitGuruButton
                  label="Message Guru"
                  onPress={() => router.push('/messages')}
                />
                <SitGuruButton
                  label="Back to dashboard"
                  variant="secondary"
                  onPress={() => router.push('/pet-parent-dashboard')}
                />
              </>
            ) : (
              <>
                <SitGuruButton
                  label="Submit Visit Review"
                  onPress={() =>
                    router.push({
                      pathname: '/reviews',
                      params: {
                        bookingId: activeId || bookingId || '',
                      },
                    })
                  }
                  accessibilityLabel="Open end-of-visit review"
                />
                <SitGuruButton
                  label="Skip for now"
                  variant="secondary"
                  onPress={() => router.push('/pet-parent-dashboard')}
                />
              </>
            )}
          </StickyActionBar>
        }
      >
        <View style={styles.header}>
          <TouchTarget
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.push('/pet-parent-dashboard')}
            style={styles.back}
          >
            <ChevronLeft color={SitGuruColors.text} size={22} strokeWidth={2.4} />
          </TouchTarget>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>PawReport Live</Text>
            <Text style={styles.subtitle}>
              {snapshot.petName}
              {snapshot.isLive ? ' · Live now' : ` · ${snapshot.statusLabel}`}
            </Text>
          </View>
        </View>

        {error ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{error}</Text>
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
                value={snapshot.isLive ? 'Live' : 'Idle'}
              />
            </View>

            <LiveRouteHeader
              locationLabel={`${snapshot.petName} with ${snapshot.guruName}`}
              live={snapshot.isLive}
              coords={coords}
              trail={snapshot.trail}
              photoPins={snapshot.photoPins}
              distanceMiles={snapshot.distanceMiles}
              expanded
              autoCenter
            />

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
                <Text style={styles.sectionEyebrow}>Live photos</Text>
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
              <Text style={styles.sectionTitle}>Custom updates</Text>
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
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: MobileSpace.sm,
    marginBottom: MobileSpace.md,
  },
  back: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 14,
    height: TOUCH_MIN,
    width: TOUCH_MIN,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.title,
  },
  subtitle: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.body,
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
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minHeight: 88,
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
