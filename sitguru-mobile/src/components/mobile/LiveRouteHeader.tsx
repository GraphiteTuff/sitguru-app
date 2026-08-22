import { Camera, MapPin, Navigation, LocateFixed } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, {
  Marker,
  Polyline,
  PROVIDER_DEFAULT,
  type Region,
} from 'react-native-maps';

import type { LiveCoords } from '@/hooks/useLiveLocation';
import BubblePressable from '@/components/BubblePressable';
import { SitGuruColors } from '@/constants/colors';
import { AppFonts } from '@/constants/fonts';
import { MobileSpace, MobileType, TOUCH_MIN } from '@/constants/mobile-layout';

export type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

export type RoutePhotoPin = {
  id: string;
  latitude: number;
  longitude: number;
  label?: string;
};

type LiveRouteHeaderProps = {
  locationLabel: string;
  live: boolean;
  coords: LiveCoords | null;
  /** Polyline trail from GPS telemetry / walk track points. */
  trail?: RouteCoordinate[];
  /** Photo (or care-event) pins along the walked path. */
  photoPins?: RoutePhotoPin[];
  distanceMiles?: number;
  error?: string | null;
  /** Progressive disclosure — taller map when the card is the focused deep-dive. */
  expanded?: boolean;
  /** Keep pet/Guru marker centered as telemetry streams in. */
  autoCenter?: boolean;
};

const FALLBACK_REGION: Region = {
  latitude: 39.8283,
  longitude: -98.5795,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

function regionFor(coords: RouteCoordinate, delta = 0.008): Region {
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

/**
 * Floating, gesture-friendly map header — keep the map compact so
 * potty / water quick actions stay in the thumb zone.
 * Map pan/zoom stay local; StickyActionBar below remains tappable.
 */
export default function LiveRouteHeader({
  locationLabel,
  live,
  coords,
  trail = [],
  photoPins = [],
  distanceMiles,
  error,
  expanded = false,
  autoCenter = true,
}: LiveRouteHeaderProps) {
  const mapRef = useRef<MapView | null>(null);
  const [followUser, setFollowUser] = useState(autoCenter);
  const showNativeMap = Platform.OS !== 'web';

  const focusPoint: RouteCoordinate | null = coords
    ? { latitude: coords.latitude, longitude: coords.longitude }
    : trail.length
      ? trail[trail.length - 1]
      : null;

  useEffect(() => {
    if (!autoCenter) {
      setFollowUser(false);
    }
  }, [autoCenter]);

  useEffect(() => {
    if (!showNativeMap || !followUser || !focusPoint || !mapRef.current) {
      return;
    }

    mapRef.current.animateToRegion(regionFor(focusPoint, expanded ? 0.01 : 0.008), 450);
  }, [expanded, focusPoint?.latitude, focusPoint?.longitude, followUser, showNativeMap]);

  return (
    <View style={[styles.shell, expanded && styles.shellExpanded]}>
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

      <View
        style={[styles.mapFrame, expanded && styles.mapFrameExpanded]}
        // Keep map gestures from fighting parent ScrollView / StickyActionBar.
        onStartShouldSetResponderCapture={() => true}
      >
        {showNativeMap ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={
              focusPoint ? regionFor(focusPoint) : FALLBACK_REGION
            }
            pitchEnabled={false}
            rotateEnabled={false}
            scrollEnabled
            zoomEnabled
            toolbarEnabled={false}
            showsUserLocation={live && !coords}
            showsMyLocationButton={false}
            moveOnMarkerPress={false}
            onPanDrag={() => setFollowUser(false)}
          >
            {trail.length > 1 ? (
              <Polyline
                coordinates={trail}
                strokeColor={SitGuruColors.primary}
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
              />
            ) : null}

            {photoPins.map((pin, index) => (
              <Marker
                key={pin.id}
                coordinate={{
                  latitude: pin.latitude,
                  longitude: pin.longitude,
                }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
                title={pin.label || `Photo ${index + 1}`}
              >
                <View style={styles.photoPin}>
                  <Camera color="#FFFFFF" size={12} strokeWidth={2.4} />
                </View>
              </Marker>
            ))}

            {coords ? (
              <Marker
                coordinate={{
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
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
            {trail.length > 1 ? (
              <Text style={styles.webFallbackText}>
                Route trail ready · {trail.length} GPS points
                {photoPins.length
                  ? ` · ${photoPins.length} photo pin${photoPins.length === 1 ? '' : 's'}`
                  : ''}
              </Text>
            ) : null}
          </View>
        )}

        <View style={styles.floatChip}>
          <Text style={styles.floatChipText}>
            {typeof distanceMiles === 'number'
              ? `${distanceMiles.toFixed(1)} mi`
              : coords
                ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
                : 'Waiting for GPS'}
            {photoPins.length
              ? ` · ${photoPins.length} photo${photoPins.length === 1 ? '' : 's'}`
              : ''}
          </Text>
        </View>

        {showNativeMap && !followUser ? (
          <BubblePressable
            accessibilityRole="button"
            accessibilityLabel="Recenter live map"
            onPress={() => {
              setFollowUser(true);
              if (focusPoint && mapRef.current) {
                mapRef.current.animateToRegion(
                  regionFor(focusPoint, expanded ? 0.01 : 0.008),
                  400,
                );
              }
            }}
            scaleTo={0.88}
            style={styles.recenterChip}
          >
            <LocateFixed color="#FFFFFF" size={14} strokeWidth={2.4} />
            <Text style={styles.recenterText}>Recenter</Text>
          </BubblePressable>
        ) : null}
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
    zIndex: 1,
  },
  shellExpanded: {
    elevation: 6,
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
    height: 148,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  mapFrameExpanded: {
    height: 260,
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
  photoPin: {
    alignItems: 'center',
    backgroundColor: '#0D5C3A',
    borderColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 2,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  floatChip: {
    backgroundColor: 'rgba(13, 92, 58, 0.92)',
    borderRadius: 999,
    bottom: 10,
    left: 10,
    maxWidth: '68%',
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: 'absolute',
  },
  floatChipText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.bold,
    fontSize: MobileType.micro,
  },
  recenterChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(13, 92, 58, 0.95)',
    borderRadius: 999,
    bottom: 10,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    position: 'absolute',
    right: 10,
  },
  recenterText: {
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
