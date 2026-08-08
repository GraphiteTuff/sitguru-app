import { MapPin, Navigation } from 'lucide-react-native';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';

import type { LiveCoords } from '@/hooks/useLiveLocation';
import { SitGuruColors } from '@/constants/colors';
import { AppFonts } from '@/constants/fonts';
import { MobileSpace, MobileType, TOUCH_MIN } from '@/constants/mobile-layout';

type LiveRouteHeaderProps = {
  locationLabel: string;
  live: boolean;
  coords: LiveCoords | null;
  /** Optional trail points for the minimized map. */
  trail?: Array<{ latitude: number; longitude: number }>;
  distanceMiles?: number;
  error?: string | null;
};

const FALLBACK_REGION = {
  latitude: 39.8283,
  longitude: -98.5795,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

/**
 * Floating, gesture-friendly map header — keep the map compact so
 * potty / water quick actions stay in the thumb zone.
 */
export default function LiveRouteHeader({
  locationLabel,
  live,
  coords,
  trail = [],
  distanceMiles,
  error,
}: LiveRouteHeaderProps) {
  const region = coords
    ? {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      }
    : FALLBACK_REGION;

  const showNativeMap = Platform.OS !== 'web';

  return (
    <View style={styles.shell}>
      <View style={styles.metaRow}>
        <View style={styles.metaCopy}>
          <Text style={styles.eyebrow}>Live route</Text>
          <Text style={styles.title} numberOfLines={1}>
            {locationLabel || 'Service area'}
          </Text>
        </View>

        <View style={[styles.statusPill, !live && styles.statusPillIdle]}>
          <View style={[styles.dot, !live && styles.dotIdle]} />
          <Text style={[styles.statusText, !live && styles.statusTextIdle]}>
            {live ? 'Tracking' : 'Paused'}
          </Text>
        </View>
      </View>

      <View style={styles.mapFrame}>
        {showNativeMap ? (
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            region={region}
            pitchEnabled={false}
            rotateEnabled={false}
            scrollEnabled
            zoomEnabled
            toolbarEnabled={false}
            showsUserLocation={live}
            showsMyLocationButton={false}
          >
            {trail.length > 1 ? (
              <Polyline
                coordinates={trail}
                strokeColor={SitGuruColors.primary}
                strokeWidth={4}
              />
            ) : null}
            {coords ? (
              <Marker
                coordinate={{
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.guruPin}>
                  <Navigation color="#FFFFFF" size={14} strokeWidth={2.6} />
                </View>
              </Marker>
            ) : null}
          </MapView>
        ) : (
          <View style={styles.webFallback}>
            <MapPin color={SitGuruColors.primary} size={22} strokeWidth={2.4} />
            <Text style={styles.webFallbackText}>
              Live map preview requires a device build.
            </Text>
          </View>
        )}

        <View style={styles.floatChip}>
          <Text style={styles.floatChipText}>
            {typeof distanceMiles === 'number'
              ? `${distanceMiles.toFixed(1)} mi`
              : coords
                ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
                : 'Waiting for GPS'}
          </Text>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 22,
    borderWidth: 1,
    elevation: 4,
    gap: MobileSpace.sm,
    padding: MobileSpace.md,
    shadowColor: '#0B3B24',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    width: '100%',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: MobileSpace.sm,
    justifyContent: 'space-between',
    minHeight: TOUCH_MIN - 8,
  },
  metaCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  eyebrow: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.bold,
    fontSize: MobileType.micro,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.section,
  },
  statusPill: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12,
  },
  statusPillIdle: {
    backgroundColor: SitGuruColors.background,
  },
  dot: {
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  dotIdle: {
    backgroundColor: SitGuruColors.textSoft,
  },
  statusText: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.bold,
    fontSize: MobileType.caption,
  },
  statusTextIdle: {
    color: SitGuruColors.textMuted,
  },
  mapFrame: {
    borderRadius: 16,
    height: 132,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  webFallback: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surfaceSoft,
    flex: 1,
    gap: MobileSpace.sm,
    justifyContent: 'center',
    padding: MobileSpace.lg,
  },
  webFallbackText: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.caption,
    textAlign: 'center',
  },
  guruPin: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 2,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  floatChip: {
    backgroundColor: 'rgba(13, 92, 58, 0.92)',
    borderRadius: 999,
    bottom: 10,
    left: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: 'absolute',
  },
  floatChipText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.bold,
    fontSize: MobileType.micro,
  },
  error: {
    color: '#B42318',
    fontFamily: AppFonts.medium,
    fontSize: MobileType.caption,
  },
});
