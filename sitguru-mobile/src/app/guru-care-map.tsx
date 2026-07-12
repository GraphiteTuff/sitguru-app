import { router } from 'expo-router';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Home,
    MapPin,
    MessageCircle,
    Navigation,
    SlidersHorizontal,
    UserRound
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
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

const MapsModule =
  Platform.OS === 'web' ? null : require('react-native-maps');
const NativeMapView = MapsModule?.default ?? MapsModule?.MapView;
const NativeMarker = MapsModule?.Marker;
const NativeCircle = MapsModule?.Circle;

type RecordRow = Record<string, unknown>;
type DistanceFilter = 5 | 10 | 20 | 50;

type Opportunity = {
  id: string;
  sourceTable: string;
  service: string;
  petName: string;
  startAt: Date | null;
  city: string;
  state: string;
  zip: string;
  distanceMiles: number | null;
  earnings: number;
  status: string;
  latitude: number | null;
  longitude: number | null;
};

type MapCoordinate = {
  latitude: number;
  longitude: number;
};

type MapRegion = MapCoordinate & {
  latitudeDelta: number;
  longitudeDelta: number;
};

type OpportunityMapPoint = {
  opportunity: Opportunity;
  coordinate: MapCoordinate;
};

const REQUEST_TABLES = ['booking_requests', 'service_requests', 'bookings'];
const OWNER_FIELDS = [
  'guru_id',
  'provider_id',
  'sitter_id',
  'assigned_guru_id',
  'user_id',
];

const OPEN_STATUSES = [
  'pending',
  'requested',
  'submitted',
  'awaiting',
  'awaiting_response',
  'requestable',
  'open',
];

const METERS_PER_MILE = 1609.344;
const WEB_MAPLIBRE_CSS_ID = 'sitguru-guru-care-maplibre-css';
const WEB_MAPLIBRE_CSS_URL =
  'https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css';
const WEB_MAP_STYLE_LIGHT = {
  version: 8,
  sources: {
    'sitguru-light-raster': {
      type: 'raster',
      tileSize: 256,
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      ],
      attribution: '© OpenStreetMap contributors © CARTO',
    },
  },
  layers: [
    {
      id: 'sitguru-light-raster-layer',
      type: 'raster',
      source: 'sitguru-light-raster',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
} as const;

const WEB_MAP_STYLE_DARK = {
  version: 8,
  sources: {
    'sitguru-dark-raster': {
      type: 'raster',
      tileSize: 256,
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      attribution: '© OpenStreetMap contributors © CARTO',
    },
  },
  layers: [
    {
      id: 'sitguru-dark-raster-layer',
      type: 'raster',
      source: 'sitguru-dark-raster',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
} as const;

const DEFAULT_SERVICE_COORDINATE: MapCoordinate = {
  latitude: 40.4418,
  longitude: -75.3416,
};

const DEFAULT_MAP_REGION: MapRegion = {
  ...DEFAULT_SERVICE_COORDINATE,
  latitudeDelta: 0.55,
  longitudeDelta: 0.66,
};

const CITY_COORDS: Record<string, MapCoordinate> = {
  'quakertown pa': { latitude: 40.4418, longitude: -75.3416 },
  'bethlehem pa': { latitude: 40.6259, longitude: -75.3705 },
  'allentown pa': { latitude: 40.6023, longitude: -75.4714 },
  'doylestown pa': { latitude: 40.3101, longitude: -75.1299 },
  'philadelphia pa': { latitude: 39.9526, longitude: -75.1652 },
  'easton pa': { latitude: 40.6884, longitude: -75.2207 },
  'lansdale pa': { latitude: 40.2415, longitude: -75.2838 },
  'perkasie pa': { latitude: 40.372, longitude: -75.2927 },
  'new hope pa': { latitude: 40.3643, longitude: -74.9513 },
  'yardley pa': { latitude: 40.2457, longitude: -74.846 },
  'camden nj': { latitude: 39.9259, longitude: -75.1196 },
  'trenton nj': { latitude: 40.2171, longitude: -74.7429 },
  'new york ny': { latitude: 40.7128, longitude: -74.006 },
  'boston ma': { latitude: 42.3601, longitude: -71.0589 },
  'atlanta ga': { latitude: 33.749, longitude: -84.388 },
  'austin tx': { latitude: 30.2672, longitude: -97.7431 },
  'katy tx': { latitude: 29.7858, longitude: -95.8244 },
  'miami fl': { latitude: 25.7617, longitude: -80.1918 },
  'chicago il': { latitude: 41.8781, longitude: -87.6298 },
  'denver co': { latitude: 39.7392, longitude: -104.9903 },
  'los angeles ca': { latitude: 34.0522, longitude: -118.2437 },
  'phoenix az': { latitude: 33.4484, longitude: -112.074 },
  'portland or': { latitude: 45.5152, longitude: -122.6784 },
  'seattle wa': { latitude: 47.6062, longitude: -122.3321 },
};

const ZIP_COORDS: Record<string, MapCoordinate> = {
  '18951': { latitude: 40.4418, longitude: -75.3416 },
  '18018': { latitude: 40.6259, longitude: -75.3705 },
  '18015': { latitude: 40.5887, longitude: -75.3836 },
  '18101': { latitude: 40.6023, longitude: -75.4714 },
  '18102': { latitude: 40.6128, longitude: -75.4774 },
  '18103': { latitude: 40.5671, longitude: -75.4896 },
  '18901': { latitude: 40.3101, longitude: -75.1299 },
  '18042': { latitude: 40.6884, longitude: -75.2207 },
  '19446': { latitude: 40.2415, longitude: -75.2838 },
  '18944': { latitude: 40.372, longitude: -75.2927 },
  '18938': { latitude: 40.3643, longitude: -74.9513 },
  '19067': { latitude: 40.2457, longitude: -74.846 },
  '19102': { latitude: 39.9526, longitude: -75.1652 },
  '19103': { latitude: 39.9522, longitude: -75.174 },
  '19104': { latitude: 39.9612, longitude: -75.1995 },
  '19106': { latitude: 39.9489, longitude: -75.1457 },
  '19107': { latitude: 39.9487, longitude: -75.1594 },
  '08030': { latitude: 39.9259, longitude: -75.1196 },
};

const STATE_COORDS: Record<string, MapCoordinate> = {
  AL: { latitude: 32.8067, longitude: -86.7911 },
  AK: { latitude: 61.3707, longitude: -152.4044 },
  AZ: { latitude: 33.7298, longitude: -111.4312 },
  AR: { latitude: 34.9697, longitude: -92.3731 },
  CA: { latitude: 36.1162, longitude: -119.6816 },
  CO: { latitude: 39.0598, longitude: -105.3111 },
  CT: { latitude: 41.5978, longitude: -72.7554 },
  DE: { latitude: 39.3185, longitude: -75.5071 },
  FL: { latitude: 27.7663, longitude: -81.6868 },
  GA: { latitude: 33.0406, longitude: -83.6431 },
  HI: { latitude: 21.0943, longitude: -157.4983 },
  ID: { latitude: 44.2405, longitude: -114.4788 },
  IL: { latitude: 40.3495, longitude: -88.9861 },
  IN: { latitude: 39.8494, longitude: -86.2583 },
  IA: { latitude: 42.0115, longitude: -93.2105 },
  KS: { latitude: 38.5266, longitude: -96.7265 },
  KY: { latitude: 37.6681, longitude: -84.6701 },
  LA: { latitude: 31.1695, longitude: -91.8678 },
  ME: { latitude: 44.6939, longitude: -69.3819 },
  MD: { latitude: 39.0639, longitude: -76.8021 },
  MA: { latitude: 42.2302, longitude: -71.5305 },
  MI: { latitude: 43.3266, longitude: -84.5361 },
  MN: { latitude: 45.6945, longitude: -93.9002 },
  MS: { latitude: 32.7416, longitude: -89.6787 },
  MO: { latitude: 38.4561, longitude: -92.2884 },
  MT: { latitude: 46.9219, longitude: -110.4544 },
  NE: { latitude: 41.1254, longitude: -98.2681 },
  NV: { latitude: 38.3135, longitude: -117.0554 },
  NH: { latitude: 43.4525, longitude: -71.5639 },
  NJ: { latitude: 40.2989, longitude: -74.521 },
  NM: { latitude: 34.8405, longitude: -106.2485 },
  NY: { latitude: 42.1657, longitude: -74.9481 },
  NC: { latitude: 35.6301, longitude: -79.8064 },
  ND: { latitude: 47.5289, longitude: -99.784 },
  OH: { latitude: 40.3888, longitude: -82.7649 },
  OK: { latitude: 35.5653, longitude: -96.9289 },
  OR: { latitude: 44.572, longitude: -122.0709 },
  PA: { latitude: 40.5908, longitude: -77.2098 },
  RI: { latitude: 41.6809, longitude: -71.5118 },
  SC: { latitude: 33.8569, longitude: -80.945 },
  SD: { latitude: 44.2998, longitude: -99.4388 },
  TN: { latitude: 35.7478, longitude: -86.6923 },
  TX: { latitude: 31.0545, longitude: -97.5635 },
  UT: { latitude: 40.15, longitude: -111.8624 },
  VT: { latitude: 44.0459, longitude: -72.7107 },
  VA: { latitude: 37.7693, longitude: -78.17 },
  WA: { latitude: 47.4009, longitude: -121.4905 },
  WV: { latitude: 38.4912, longitude: -80.9545 },
  WI: { latitude: 44.2685, longitude: -89.6165 },
  WY: { latitude: 42.756, longitude: -107.3025 },
};

const DARK_NATIVE_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#10231B' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#B7C6BC' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#10231B' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#355044' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#13281F' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#173125' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#173B29' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2B3B34' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#16241E' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3A493F' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#243A30' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0B282A' }],
  },
];


export default function GuruCareMapScreen() {
  const { user, profile } = useAuth();
  const themeMode = useThemeMode();
  const isDark = themeMode === 'dark';
  const isWebPreview = Platform.OS === 'web';
  const palette = getPalette(isDark);
  const styles = createStyles(isDark);

  const profileRecord = (profile ?? {}) as RecordRow;
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>(20);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const serviceCity = firstString(profileRecord, ['service_city', 'city']);
  const serviceState = firstString(profileRecord, ['service_state', 'state']);
  const serviceZip = firstString(profileRecord, [
    'service_zip',
    'service_zip_code',
    'zip_code',
  ]);

  const bookingStatus =
    normalizeStatus(
      firstString(profileRecord, [
        'booking_status',
        'guru_booking_status',
        'availability_status',
      ]),
    ) || 'listed_only';

  const serviceRadius = Math.max(
    1,
    Math.round(
      firstNumber(profileRecord, [
        'service_radius_miles',
        'radius_miles',
        'service_radius',
      ]) ?? 20,
    ),
  );

  const acceptingRequests =
    bookingStatus === 'bookable' ||
    bookingStatus === 'requestable' ||
    firstBoolean(profileRecord, [
      'accepting_bookings',
      'is_accepting_bookings',
    ]);

  const loadOpportunities = useCallback(
    async (showRefresh = false) => {
      if (!user?.id || !isSupabaseConfigured) {
        setOpportunities([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const rows = await queryOpportunityRows(user.id);
        setOpportunities(
          rows
            .map((item, index) =>
              mapOpportunity(item.row, item.table, index),
            )
            .filter((item): item is Opportunity => Boolean(item))
            .sort(compareOpportunities),
        );
        setMessage('');
      } catch {
        setMessage(
          'Nearby care demand could not be loaded. Pull down to refresh.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    void loadOpportunities(false);
  }, [loadOpportunities]);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const refreshSoon = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void loadOpportunities(false), 450);
    };

    let channel = supabase.channel(`guru-care-map-${user.id}`);

    REQUEST_TABLES.forEach((table) => {
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
  }, [loadOpportunities, user?.id]);

  const visibleOpportunities = useMemo(
    () =>
      opportunities.filter(
        (item) =>
          item.distanceMiles === null ||
          item.distanceMiles <= distanceFilter,
      ),
    [distanceFilter, opportunities],
  );

  const averageEarnings = visibleOpportunities.length
    ? visibleOpportunities.reduce(
        (total, item) => total + item.earnings,
        0,
      ) / visibleOpportunities.length
    : 0;

  const serviceLatitude = firstNumber(profileRecord, [
    'service_latitude',
    'service_lat',
    'latitude',
    'lat',
    'location_latitude',
  ]);
  const serviceLongitude = firstNumber(profileRecord, [
    'service_longitude',
    'service_lng',
    'longitude',
    'lng',
    'location_longitude',
  ]);

  const serviceCoordinate = useMemo(
    () =>
      resolveServiceCoordinate({
        city: serviceCity,
        latitude: serviceLatitude,
        longitude: serviceLongitude,
        opportunities: visibleOpportunities,
        state: serviceState,
        zip: serviceZip,
      }),
    [
      serviceCity,
      serviceLatitude,
      serviceLongitude,
      serviceState,
      serviceZip,
      visibleOpportunities,
    ],
  );

  const mapPoints = useMemo(
    () =>
      visibleOpportunities.map((opportunity, index) => ({
        opportunity,
        coordinate: resolveOpportunityCoordinate(
          opportunity,
          index,
          serviceCoordinate,
        ),
      })),
    [serviceCoordinate, visibleOpportunities],
  );

  const initialMapRegion = useMemo(
    () => buildMapRegion(serviceCoordinate, [], distanceFilter),
    [distanceFilter, serviceCoordinate],
  );

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
                      onRefresh={() => void loadOpportunities(true)}
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
                      <Text style={styles.title}>Care Map</Text>
                      <Text style={styles.subtitle}>
                        Nearby demand within your service area.
                      </Text>
                    </View>

                    <GuruHeaderActions />
                  </View>

                  <View style={styles.statusCard}>
                    <View style={styles.statusTop}>
                      <View style={styles.statusIcon}>
                        <Navigation
                          color={palette.primary}
                          size={20}
                          strokeWidth={2.3}
                        />
                      </View>

                      <View style={styles.statusCopy}>
                        <Text style={styles.statusEyebrow}>
                          YOUR SERVICE AREA
                        </Text>
                        <Text style={styles.statusTitle}>
                          {[serviceCity, serviceState]
                            .filter(Boolean)
                            .join(', ') || 'Service area not set'}
                        </Text>
                        <Text style={styles.statusText}>
                          {serviceZip ? `${serviceZip} • ` : ''}
                          Up to {serviceRadius} miles
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusPill,
                          !acceptingRequests &&
                            styles.statusPillInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            !acceptingRequests &&
                              styles.statusPillTextInactive,
                          ]}
                        >
                          {acceptingRequests ? 'Accepting' : 'Paused'}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      onPress={() => router.push('/guru-pricing')}
                      style={styles.statusButton}
                    >
                      <Text style={styles.statusButtonText}>
                        Edit availability & service area
                      </Text>
                      <ChevronRight
                        color={palette.primary}
                        size={17}
                        strokeWidth={2.3}
                      />
                    </Pressable>
                  </View>

                  {message ? (
                    <View style={styles.notice}>
                      <Text style={styles.noticeText}>{message}</Text>
                    </View>
                  ) : null}

                  <View style={styles.mapCard}>
                    <View style={styles.mapHeader}>
                      <View>
                        <Text style={styles.cardEyebrow}>
                          LOCAL CARE DEMAND
                        </Text>
                        <Text style={styles.cardTitle}>
                          {visibleOpportunities.length} nearby opportunities
                        </Text>
                      </View>

                      <Pressable
                        accessibilityRole="button"
                        onPress={() => router.push('/guru-pricing')}
                        style={styles.filterButton}
                      >
                        <SlidersHorizontal
                          color={palette.primary}
                          size={17}
                          strokeWidth={2.3}
                        />
                      </Pressable>
                    </View>

                    <CoverageMap
                      center={serviceCoordinate}
                      initialRegion={initialMapRegion}
                      isDark={isDark}
                      mapPoints={mapPoints}
                      onOpportunityPress={(opportunity) =>
                        router.push({
                          pathname: '/guru-requests',
                          params: { requestId: opportunity.id },
                        })
                      }
                      palette={palette}
                      radiusMiles={distanceFilter}
                      styles={styles}
                    />

                    <View style={styles.mapLegend}>
                      <View style={styles.legendItem}>
                        <View style={styles.legendGuruDot} />
                        <Text style={styles.legendText}>Your area</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={styles.legendDemandDot} />
                        <Text style={styles.legendText}>Care request</Text>
                      </View>
                      <Text style={styles.privacyText}>
                        Exact addresses stay hidden until booking acceptance.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.summaryGrid}>
                    <SummaryCard
                      label="Open requests"
                      value={String(visibleOpportunities.length)}
                      styles={styles}
                    />
                    <SummaryCard
                      label="Avg. earnings"
                      value={currency(averageEarnings)}
                      styles={styles}
                    />
                    <SummaryCard
                      label="Current radius"
                      value={`${distanceFilter} mi`}
                      styles={styles}
                    />
                  </View>

                  <View style={styles.distanceCard}>
                    <View>
                      <Text style={styles.cardEyebrow}>DISTANCE FILTER</Text>
                      <Text style={styles.cardTitle}>Show requests within</Text>
                    </View>

                    <View style={styles.distanceRow}>
                      {([5, 10, 20, 50] as DistanceFilter[]).map(
                        (distance) => {
                          const active = distanceFilter === distance;

                          return (
                            <Pressable
                              key={distance}
                              accessibilityRole="button"
                              accessibilityState={{ selected: active }}
                              onPress={() => setDistanceFilter(distance)}
                              style={[
                                styles.distanceButton,
                                active && styles.distanceButtonActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.distanceText,
                                  active && styles.distanceTextActive,
                                ]}
                              >
                                {distance} mi
                              </Text>
                            </Pressable>
                          );
                        },
                      )}
                    </View>
                  </View>

                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Nearby opportunities</Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => router.push('/guru-requests')}
                    >
                      <Text style={styles.sectionLink}>View requests</Text>
                    </Pressable>
                  </View>

                  {loading ? (
                    <View style={styles.loadingCard}>
                      <View style={styles.loadingLineLarge} />
                      <View style={styles.loadingLineMedium} />
                      <View style={styles.loadingLineSmall} />
                    </View>
                  ) : visibleOpportunities.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <View style={styles.emptyIcon}>
                        <MapPin
                          color={palette.primary}
                          size={27}
                          strokeWidth={2.3}
                        />
                      </View>
                      <Text style={styles.emptyTitle}>
                        No nearby requests right now
                      </Text>
                      <Text style={styles.emptyText}>
                        Keep your availability, services, pricing, and service
                        radius current so Pet Parents can find you.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.opportunityStack}>
                      {visibleOpportunities.slice(0, 6).map((item) => (
                        <OpportunityCard
                          key={`${item.sourceTable}-${item.id}`}
                          item={item}
                          palette={palette}
                          styles={styles}
                        />
                      ))}
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
                    active
                    icon={
                      <MapPin
                        color={palette.primary}
                        size={21}
                        strokeWidth={2.4}
                      />
                    }
                    label="Care Map"
                    onPress={() => undefined}
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

function CoverageMap({
  center,
  initialRegion,
  isDark,
  mapPoints,
  onOpportunityPress,
  palette,
  radiusMiles,
  styles,
}: {
  center: MapCoordinate;
  initialRegion: MapRegion;
  isDark: boolean;
  mapPoints: OpportunityMapPoint[];
  onOpportunityPress: (opportunity: Opportunity) => void;
  palette: ReturnType<typeof getPalette>;
  radiusMiles: number;
  styles: ReturnType<typeof createStyles>;
}) {
  if (Platform.OS === 'web') {
    return (
      <WebCareMap
        center={center}
        initialRegion={initialRegion}
        isDark={isDark}
        mapPoints={mapPoints}
        onOpportunityPress={onOpportunityPress}
        palette={palette}
        radiusMiles={radiusMiles}
        styles={styles}
      />
    );
  }

  if (NativeMapView && NativeMarker && NativeCircle) {
    return (
      <NativeCareMap
        center={center}
        initialRegion={initialRegion}
        isDark={isDark}
        mapPoints={mapPoints}
        onOpportunityPress={onOpportunityPress}
        palette={palette}
        radiusMiles={radiusMiles}
        styles={styles}
      />
    );
  }

  return (
    <View style={styles.mapUnavailable}>
      <MapPin color={palette.primary} size={28} strokeWidth={2.3} />
      <Text style={styles.mapUnavailableTitle}>Interactive map unavailable</Text>
      <Text style={styles.mapUnavailableText}>
        Install react-native-maps for native builds and maplibre-gl for web.
      </Text>
    </View>
  );
}

function NativeCareMap({
  center,
  initialRegion,
  isDark,
  mapPoints,
  onOpportunityPress,
  palette,
  radiusMiles,
  styles,
}: {
  center: MapCoordinate;
  initialRegion: MapRegion;
  isDark: boolean;
  mapPoints: OpportunityMapPoint[];
  onOpportunityPress: (opportunity: Opportunity) => void;
  palette: ReturnType<typeof getPalette>;
  radiusMiles: number;
  styles: ReturnType<typeof createStyles>;
}) {
  const nativeMapRef = useRef<any>(null);
  const previousRadiusRef = useRef(radiusMiles);
  const previousCenterRef = useRef(center);

  useEffect(() => {
    const radiusChanged = previousRadiusRef.current !== radiusMiles;
    const centerChanged =
      previousCenterRef.current.latitude !== center.latitude ||
      previousCenterRef.current.longitude !== center.longitude;

    previousRadiusRef.current = radiusMiles;
    previousCenterRef.current = center;

    if (!radiusChanged && !centerChanged) return;

    nativeMapRef.current?.animateToRegion(
      buildMapRegion(center, [], radiusMiles),
      450,
    );
  }, [center, radiusMiles]);

  return (
    <View style={styles.nativeMapWrap}>
      <NativeMapView
        ref={nativeMapRef}
        customMapStyle={isDark ? DARK_NATIVE_MAP_STYLE : []}
        mapType="standard"
        initialRegion={initialRegion}
        pitchEnabled={false}
        rotateEnabled={false}
        scrollEnabled
        showsBuildings
        showsPointsOfInterest
        style={styles.nativeMap}
        zoomEnabled
      >
        <NativeCircle
          center={center}
          fillColor={palette.mapCircleFill}
          radius={Math.max(1, radiusMiles) * METERS_PER_MILE}
          strokeColor={palette.mapCircleStroke}
          strokeWidth={2}
        />

        <NativeMarker
          coordinate={center}
          description={`${radiusMiles} mile request filter`}
          title="Your map center"
          tracksViewChanges={false}
        >
          <View style={styles.nativeGuruMarker}>
            <Navigation color="#FFFFFF" size={17} strokeWidth={2.5} />
          </View>
        </NativeMarker>

        {mapPoints.map((point) => (
          <NativeMarker
            key={`${point.opportunity.sourceTable}-${point.opportunity.id}`}
            coordinate={point.coordinate}
            description={`${point.opportunity.petName} • ${formatDayTime(
              point.opportunity.startAt,
            )}`}
            onPress={() => onOpportunityPress(point.opportunity)}
            title={point.opportunity.service}
          >
            <View style={styles.nativeRequestMarker}>
              <Text style={styles.nativeRequestMarkerText}>🐾</Text>
            </View>
          </NativeMarker>
        ))}
      </NativeMapView>

      <View pointerEvents="none" style={styles.mapCountPill}>
        <Text style={styles.mapCountPillText}>
          {mapPoints.length} request{mapPoints.length === 1 ? '' : 's'} nearby
        </Text>
      </View>
    </View>
  );
}

function WebCareMap({
  center,
  initialRegion,
  isDark,
  mapPoints,
  onOpportunityPress,
  palette,
  radiusMiles,
  styles,
}: {
  center: MapCoordinate;
  initialRegion: MapRegion;
  isDark: boolean;
  mapPoints: OpportunityMapPoint[];
  onOpportunityPress: (opportunity: Opportunity) => void;
  palette: ReturnType<typeof getPalette>;
  radiusMiles: number;
  styles: ReturnType<typeof createStyles>;
}) {
  const containerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const mapLibreRef = useRef<any>(null);
  const requestMarkersRef = useRef<any[]>([]);
  const guruMarkerRef = useRef<any>(null);
  const mapGenerationRef = useRef(0);
  const cameraRef = useRef<{
    center: [number, number];
    zoom: number;
  } | null>(null);
  const callbacksRef = useRef({
    onOpportunityPress,
  });
  const [mapReadyVersion, setMapReadyVersion] = useState(0);
  const [mapInitializationFailed, setMapInitializationFailed] = useState(false);

  useEffect(() => {
    callbacksRef.current = {
      onOpportunityPress,
    };
  }, [onOpportunityPress]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !containerRef.current) return undefined;

    let disposed = false;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const generation = mapGenerationRef.current + 1;
    mapGenerationRef.current = generation;
    setMapReadyVersion(0);

    try {
      ensureMapLibreCss();
      const maplibregl = require('maplibre-gl');
      mapLibreRef.current = maplibregl;

      const savedCamera = cameraRef.current;
      const initialCenter = savedCamera?.center ?? [
        initialRegion.longitude,
        initialRegion.latitude,
      ];
      const initialZoom =
        savedCamera?.zoom ?? regionToWebZoom(initialRegion);

      const map = new maplibregl.Map({
        attributionControl: false,
        center: initialCenter,
        container: containerRef.current,
        dragRotate: false,
        maxZoom: 18,
        minZoom: 3,
        pitchWithRotate: false,
        style: (isDark ? WEB_MAP_STYLE_DARK : WEB_MAP_STYLE_LIGHT) as any,
        zoom: initialZoom,
      });

      mapRef.current = map;

      map.addControl(
        new maplibregl.NavigationControl({
          showCompass: false,
          showZoom: true,
        }),
        'bottom-right',
      );

      map.on('load', () => {
        if (disposed || generation !== mapGenerationRef.current) return;
        setMapInitializationFailed(false);
        setMapReadyVersion(generation);
        resizeTimer = setTimeout(() => map.resize(), 0);
      });

      map.on('moveend', () => {
        if (disposed || generation !== mapGenerationRef.current) return;

        const currentCenter = map.getCenter();
        cameraRef.current = {
          center: [currentCenter.lng, currentCenter.lat],
          zoom: map.getZoom(),
        };
      });

      // Tile and source errors are non-fatal. MapLibre may retry them, so they
      // must not replace the entire map with an error screen.

      // MapLibre owns the camera after its initial load. The current camera is
      // stored in a ref only so a light/dark map rebuild keeps the same view.
    } catch {
      setMapInitializationFailed(true);
    }

    return () => {
      disposed = true;

      if (resizeTimer) clearTimeout(resizeTimer);

      if (mapRef.current) {
        try {
          const currentCenter = mapRef.current.getCenter();
          cameraRef.current = {
            center: [currentCenter.lng, currentCenter.lat],
            zoom: mapRef.current.getZoom(),
          };
        } catch {
          // The map may already be tearing down.
        }
      }

      requestMarkersRef.current.forEach((marker) => marker.remove());
      requestMarkersRef.current = [];
      guruMarkerRef.current?.remove();
      guruMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [isDark]);

  const previousRadiusRef = useRef(radiusMiles);
  const previousCenterRef = useRef(center);

  useEffect(() => {
    const map = mapRef.current;

    if (
      !map ||
      !mapReadyVersion ||
      mapReadyVersion !== mapGenerationRef.current
    ) {
      return;
    }

    const radiusChanged = previousRadiusRef.current !== radiusMiles;
    const centerChanged =
      previousCenterRef.current.latitude !== center.latitude ||
      previousCenterRef.current.longitude !== center.longitude;

    previousRadiusRef.current = radiusMiles;
    previousCenterRef.current = center;

    if (!radiusChanged && !centerChanged) return;

    const nextRegion = buildMapRegion(center, [], radiusMiles);
    const nextZoom = regionToWebZoom(nextRegion);

    cameraRef.current = {
      center: [center.longitude, center.latitude],
      zoom: nextZoom,
    };

    map.easeTo({
      center: [center.longitude, center.latitude],
      duration: 450,
      essential: true,
      zoom: nextZoom,
    });
  }, [center, mapReadyVersion, radiusMiles]);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = mapLibreRef.current;

    if (
      !map ||
      !maplibregl ||
      !mapReadyVersion ||
      mapReadyVersion !== mapGenerationRef.current ||
      !map.isStyleLoaded()
    ) {
      return;
    }

    try {
      const circleData = buildCircleGeoJson(center, radiusMiles);
      const existingSource = map.getSource('sitguru-guru-service-area');

      if (existingSource) {
        existingSource.setData(circleData);
      } else {
        map.addSource('sitguru-guru-service-area', {
          data: circleData,
          type: 'geojson',
        });

        if (!map.getLayer('sitguru-guru-service-area-fill')) {
          map.addLayer({
            id: 'sitguru-guru-service-area-fill',
            paint: {
              'fill-color': palette.mapCircleFillWeb,
              'fill-opacity': 1,
            },
            source: 'sitguru-guru-service-area',
            type: 'fill',
          });
        }

        if (!map.getLayer('sitguru-guru-service-area-line')) {
          map.addLayer({
            id: 'sitguru-guru-service-area-line',
            paint: {
              'line-color': palette.mapCircleStroke,
              'line-dasharray': [2, 2],
              'line-width': 1.7,
            },
            source: 'sitguru-guru-service-area',
            type: 'line',
          });
        }
      }

      requestMarkersRef.current.forEach((marker) => marker.remove());

      requestMarkersRef.current = mapPoints.map((point) => {
        const element = createWebRequestMarker(point.opportunity, palette);

        element.addEventListener('click', (event: Event) => {
          event.stopPropagation();
          callbacksRef.current.onOpportunityPress(point.opportunity);
        });

        return new maplibregl.Marker({
          anchor: 'center',
          element,
        })
          .setLngLat([
            point.coordinate.longitude,
            point.coordinate.latitude,
          ])
          .addTo(map);
      });

      guruMarkerRef.current?.remove();

      const guruElement = createWebGuruMarker();
      guruMarkerRef.current = new maplibregl.Marker({
        anchor: 'center',
        element: guruElement,
      })
        .setLngLat([center.longitude, center.latitude])
        .addTo(map);
    } catch (error) {
      // A theme switch briefly creates a new map before its style is ready.
      // The load event will rerun this effect for the current map generation.
      if (map.isStyleLoaded()) {
        console.warn('Guru Care Map overlay sync failed:', error);
      }
    }
  }, [
    center,
    mapPoints,
    mapReadyVersion,
    palette,
    radiusMiles,
  ]);

  if (mapInitializationFailed) {
    return (
      <View style={styles.mapUnavailable}>
        <MapPin color={palette.primary} size={28} strokeWidth={2.3} />
        <Text style={styles.mapUnavailableTitle}>Map could not load</Text>
        <Text style={styles.mapUnavailableText}>
          Confirm maplibre-gl is installed, then restart Expo with a cleared cache.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.webMapWrap}>
      <View ref={containerRef} style={styles.webMapCanvas} />

      <View pointerEvents="none" style={styles.mapCountPill}>
        <Text style={styles.mapCountPillText}>
          {mapPoints.length} request{mapPoints.length === 1 ? '' : 's'} nearby
        </Text>
      </View>

      <Text pointerEvents="none" style={styles.mapAttribution}>
        © OpenStreetMap • CARTO
      </Text>
    </View>
  );
}

function ensureMapLibreCss() {
  const documentRef = (globalThis as any).document;

  if (
    !documentRef ||
    documentRef.getElementById(WEB_MAPLIBRE_CSS_ID)
  ) {
    return;
  }

  const link = documentRef.createElement('link');
  link.id = WEB_MAPLIBRE_CSS_ID;
  link.rel = 'stylesheet';
  link.href = WEB_MAPLIBRE_CSS_URL;
  documentRef.head.appendChild(link);
}

function createWebGuruMarker() {
  const documentRef = (globalThis as any).document;
  const element = documentRef.createElement('button');

  element.type = 'button';
  element.setAttribute('aria-label', 'Your Guru service area');
  element.style.alignItems = 'center';
  element.style.background = '#087F50';
  element.style.border = '3px solid #FFFFFF';
  element.style.borderRadius = '999px';
  element.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.24)';
  element.style.color = '#FFFFFF';
  element.style.display = 'flex';
  element.style.fontSize = '18px';
  element.style.height = '44px';
  element.style.justifyContent = 'center';
  element.style.padding = '0';
  element.style.width = '44px';
  element.textContent = '➤';

  return element;
}

function createWebRequestMarker(
  opportunity: Opportunity,
  palette: ReturnType<typeof getPalette>,
) {
  const documentRef = (globalThis as any).document;
  const element = documentRef.createElement('button');

  element.type = 'button';
  element.setAttribute(
    'aria-label',
    `Open ${opportunity.service} request for ${opportunity.petName}`,
  );
  element.title = `${opportunity.service} • ${opportunity.petName}`;
  element.style.alignItems = 'center';
  element.style.background = '#FFFFFF';
  element.style.border = `2px solid ${palette.orange}`;
  element.style.borderRadius = '999px';
  element.style.boxShadow = '0 5px 14px rgba(0, 0, 0, 0.22)';
  element.style.cursor = 'pointer';
  element.style.display = 'flex';
  element.style.fontSize = '15px';
  element.style.height = '38px';
  element.style.justifyContent = 'center';
  element.style.padding = '0';
  element.style.width = '38px';
  element.textContent = '🐾';

  return element;
}

function buildCircleGeoJson(
  center: MapCoordinate,
  radiusMiles: number,
) {
  const points = 72;
  const radiusKm = Math.max(1, radiusMiles) * 1.609344;
  const earthRadiusKm = 6371;
  const latitudeRadians = (center.latitude * Math.PI) / 180;
  const coordinates: number[][] = [];

  for (let index = 0; index <= points; index += 1) {
    const bearing = (index / points) * Math.PI * 2;
    const angularDistance = radiusKm / earthRadiusKm;

    const latitude = Math.asin(
      Math.sin(latitudeRadians) * Math.cos(angularDistance) +
        Math.cos(latitudeRadians) *
          Math.sin(angularDistance) *
          Math.cos(bearing),
    );

    const longitude =
      (center.longitude * Math.PI) / 180 +
      Math.atan2(
        Math.sin(bearing) *
          Math.sin(angularDistance) *
          Math.cos(latitudeRadians),
        Math.cos(angularDistance) -
          Math.sin(latitudeRadians) * Math.sin(latitude),
      );

    coordinates.push([
      (longitude * 180) / Math.PI,
      (latitude * 180) / Math.PI,
    ]);
  }

  return {
    features: [
      {
        geometry: {
          coordinates: [coordinates],
          type: 'Polygon',
        },
        properties: {},
        type: 'Feature',
      },
    ],
    type: 'FeatureCollection',
  };
}

function regionToWebZoom(region: MapRegion) {
  const longitudeDelta = Math.max(region.longitudeDelta, 0.0001);

  return Math.max(
    3,
    Math.min(18, Math.log2(360 / longitudeDelta)),
  );
}

function resolveServiceCoordinate({
  city,
  latitude,
  longitude,
  opportunities,
  state,
  zip,
}: {
  city: string;
  latitude: number | null;
  longitude: number | null;
  opportunities: Opportunity[];
  state: string;
  zip: string;
}): MapCoordinate {
  if (latitude !== null && longitude !== null) {
    return { latitude, longitude };
  }

  const zipCoordinate = ZIP_COORDS[zip];
  if (zipCoordinate) return zipCoordinate;

  const cityCoordinate = CITY_COORDS[
    `${city} ${state}`.trim().toLowerCase()
  ];
  if (cityCoordinate) return cityCoordinate;

  const firstOpportunity = opportunities.find(
    (opportunity) =>
      opportunity.latitude !== null ||
      opportunity.longitude !== null ||
      Boolean(opportunity.zip) ||
      Boolean(opportunity.city),
  );

  if (firstOpportunity) {
    return resolveOpportunityCoordinate(
      firstOpportunity,
      0,
      STATE_COORDS[state.toUpperCase()] ??
        DEFAULT_SERVICE_COORDINATE,
    );
  }

  return (
    STATE_COORDS[state.toUpperCase()] ??
    DEFAULT_SERVICE_COORDINATE
  );
}

function resolveOpportunityCoordinate(
  opportunity: Opportunity,
  index: number,
  fallback: MapCoordinate,
): MapCoordinate {
  let coordinate: MapCoordinate | null = null;

  if (
    opportunity.latitude !== null &&
    opportunity.longitude !== null
  ) {
    coordinate = {
      latitude: Math.round(opportunity.latitude * 100) / 100,
      longitude: Math.round(opportunity.longitude * 100) / 100,
    };
  }

  if (!coordinate && opportunity.zip) {
    coordinate = ZIP_COORDS[opportunity.zip] ?? null;
  }

  if (!coordinate && opportunity.city) {
    coordinate =
      CITY_COORDS[
        `${opportunity.city} ${opportunity.state}`
          .trim()
          .toLowerCase()
      ] ?? null;
  }

  if (!coordinate && opportunity.state) {
    coordinate =
      STATE_COORDS[opportunity.state.toUpperCase()] ?? null;
  }

  return addPrivacyOffset(coordinate ?? fallback, index);
}

function addPrivacyOffset(
  coordinate: MapCoordinate,
  index: number,
): MapCoordinate {
  const ring = Math.floor(index / 8) + 1;
  const angle = ((index % 8) / 8) * Math.PI * 2;
  const latitudeOffset = Math.cos(angle) * 0.006 * ring;
  const longitudeOffset = Math.sin(angle) * 0.008 * ring;

  return {
    latitude: coordinate.latitude + latitudeOffset,
    longitude: coordinate.longitude + longitudeOffset,
  };
}

function buildMapRegion(
  center: MapCoordinate,
  mapPoints: OpportunityMapPoint[],
  radiusMiles: number,
): MapRegion {
  const radiusLatitudeDelta = Math.max(
    0.045,
    (Math.max(1, radiusMiles) / 69) * 2.45,
  );
  const radiusLongitudeDelta = radiusLatitudeDelta * 1.22;

  const latitudes = [
    center.latitude,
    ...mapPoints.map((point) => point.coordinate.latitude),
  ];
  const longitudes = [
    center.longitude,
    ...mapPoints.map((point) => point.coordinate.longitude),
  ];

  const latitudeSpread =
    Math.max(...latitudes) - Math.min(...latitudes);
  const longitudeSpread =
    Math.max(...longitudes) - Math.min(...longitudes);

  return {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: Math.max(
      radiusLatitudeDelta,
      latitudeSpread * 1.55,
    ),
    longitudeDelta: Math.max(
      radiusLongitudeDelta,
      longitudeSpread * 1.55,
    ),
  };
}

function SummaryCard({
  label,
  styles,
  value,
}: {
  label: string;
  styles: ReturnType<typeof createStyles>;
  value: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function OpportunityCard({
  item,
  palette,
  styles,
}: {
  item: Opportunity;
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: '/guru-requests',
          params: { requestId: item.id },
        })
      }
      style={styles.opportunityCard}
    >
      <View style={styles.opportunityIcon}>
        <Text style={styles.opportunityEmoji}>🐾</Text>
      </View>

      <View style={styles.opportunityCopy}>
        <Text style={styles.opportunityTitle}>{item.service}</Text>
        <Text style={styles.opportunityMeta}>
          {item.petName} • {formatDayTime(item.startAt)}
        </Text>
        <Text style={styles.opportunityMeta}>
          {[item.city, item.state].filter(Boolean).join(', ') ||
            item.zip ||
            'Nearby service area'}
          {item.distanceMiles !== null
            ? ` • ${item.distanceMiles.toFixed(1)} mi`
            : ''}
        </Text>
      </View>

      <View style={styles.opportunityRight}>
        <Text style={styles.opportunityEarnings}>
          {currency(item.earnings)}
        </Text>
        <ChevronRight
          color={palette.primary}
          size={17}
          strokeWidth={2.3}
        />
      </View>
    </Pressable>
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

async function queryOpportunityRows(userId: string) {
  const rows: Array<{ row: RecordRow; table: string }> = [];

  for (const table of REQUEST_TABLES) {
    let found = false;

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
        found = true;
        break;
      }
    }

    if (found) continue;

    const openResult = await supabase
      .from(table)
      .select('*')
      .in('status', OPEN_STATUSES)
      .limit(100);

    if (!openResult.error && openResult.data?.length) {
      rows.push(
        ...(openResult.data as RecordRow[]).map((row) => ({ row, table })),
      );
    }
  }

  return rows;
}

function mapOpportunity(
  row: RecordRow,
  table: string,
  index: number,
): Opportunity | null {
  const status =
    normalizeStatus(
      firstString(row, ['status', 'request_status', 'booking_status']),
    ) || 'pending';

  if (!OPEN_STATUSES.includes(status)) return null;

  return {
    id: firstString(row, ['id', 'request_id', 'booking_id']) || `request-${index}`,
    sourceTable: table,
    service:
      firstString(row, [
        'service_name',
        'service_type',
        'service',
        'booking_type',
      ]) || 'Pet Care',
    petName: firstString(row, ['pet_name', 'animal_name']) || 'Pet',
    startAt: firstDate(row, [
      'start_time',
      'starts_at',
      'scheduled_at',
      'booking_date',
      'service_date',
      'start_date',
    ]),
    city: firstString(row, ['service_city', 'city']),
    state: firstString(row, ['service_state', 'state']),
    zip: firstString(row, ['service_zip', 'service_zip_code', 'zip_code']),
    distanceMiles: normalizeDistance(
      firstNumber(row, [
        'distance_miles',
        'distance',
        'distance_from_guru',
      ]),
      firstString(row, ['distance_unit', 'unit']),
    ),
    earnings:
      firstNumber(row, [
        'guru_earnings',
        'provider_earnings',
        'net_amount',
        'estimated_earnings',
        'guru_amount',
      ]) ?? 0,
    status,
    latitude: firstNumber(row, ['latitude', 'lat', 'service_latitude']),
    longitude: firstNumber(row, ['longitude', 'lng', 'service_longitude']),
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

function compareOpportunities(a: Opportunity, b: Opportunity) {
  const distanceDifference =
    (a.distanceMiles ?? Number.MAX_SAFE_INTEGER) -
    (b.distanceMiles ?? Number.MAX_SAFE_INTEGER);

  if (distanceDifference !== 0) return distanceDifference;

  return (
    (a.startAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
    (b.startAt?.getTime() ?? Number.MAX_SAFE_INTEGER)
  );
}

function formatDayTime(date: Date | null) {
  if (!date) return 'Time to be confirmed';

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
    mapCircleStroke: isDark ? '#39D982' : '#087449',
    mapCircleFill: isDark
      ? 'rgba(57,217,130,0.12)'
      : 'rgba(8,116,73,0.10)',
    mapCircleFillWeb: isDark
      ? 'rgba(57,217,130,0.16)'
      : 'rgba(8,116,73,0.12)',
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
    statusCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 11,
      padding: 13,
    },
    statusTop: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    statusIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 13,
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    statusCopy: { flex: 1, gap: 2 },
    statusEyebrow: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 7,
      letterSpacing: 0.7,
    },
    statusTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
    },
    statusText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
    statusPill: {
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },
    statusPillInactive: {
      backgroundColor: isDark ? '#3A251D' : '#FFF0E7',
    },
    statusPillText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    statusPillTextInactive: { color: palette.orange },
    statusButton: {
      alignItems: 'center',
      borderTopColor: palette.border,
      borderTopWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 10,
    },
    statusButtonText: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 9,
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
    mapCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 10,
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
    filterButton: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    nativeMapWrap: {
      borderRadius: 18,
      height: 250,
      overflow: 'hidden',
      position: 'relative',
      width: '100%',
    },
    nativeMap: {
      height: '100%',
      width: '100%',
    },
    nativeGuruMarker: {
      alignItems: 'center',
      backgroundColor: palette.primary,
      borderColor: '#FFFFFF',
      borderRadius: 999,
      borderWidth: 3,
      height: 44,
      justifyContent: 'center',
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      width: 44,
    },
    nativeRequestMarker: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderColor: palette.orange,
      borderRadius: 999,
      borderWidth: 2,
      height: 38,
      justifyContent: 'center',
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 7,
      width: 38,
    },
    nativeRequestMarkerText: {
      fontSize: 15,
    },
    webMapWrap: {
      borderRadius: 18,
      height: 250,
      overflow: 'hidden',
      position: 'relative',
      width: '100%',
    },
    webMapCanvas: {
      height: '100%',
      width: '100%',
    },
    mapCountPill: {
      backgroundColor: isDark
        ? 'rgba(6,20,15,0.90)'
        : 'rgba(255,255,255,0.92)',
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      left: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      position: 'absolute',
      top: 10,
    },
    mapCountPillText: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 8,
    },
    mapAttribution: {
      backgroundColor: isDark
        ? 'rgba(6,20,15,0.74)'
        : 'rgba(255,255,255,0.78)',
      bottom: 4,
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 6,
      paddingHorizontal: 4,
      position: 'absolute',
      right: 5,
    },
    mapUnavailable: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderRadius: 18,
      gap: 6,
      height: 250,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    mapUnavailableTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
    },
    mapUnavailableText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
      textAlign: 'center',
    },
    mapCanvas: {
      backgroundColor: palette.mapBackground,
      borderRadius: 18,
      height: 230,
      overflow: 'hidden',
      position: 'relative',
    },
    mapRoadOne: {
      backgroundColor: palette.mapRoad,
      height: 24,
      left: -30,
      position: 'absolute',
      top: 86,
      transform: [{ rotate: '12deg' }],
      width: 430,
    },
    mapRoadTwo: {
      backgroundColor: palette.mapRoad,
      height: 22,
      left: 80,
      position: 'absolute',
      top: 20,
      transform: [{ rotate: '-52deg' }],
      width: 280,
    },
    mapRoadThree: {
      backgroundColor: palette.mapRoad,
      bottom: 34,
      height: 20,
      left: 16,
      position: 'absolute',
      transform: [{ rotate: '-7deg' }],
      width: 330,
    },
    mapPark: {
      backgroundColor: palette.mapPark,
      borderRadius: 999,
      height: 88,
      position: 'absolute',
      right: 24,
      top: 22,
      width: 88,
    },
    serviceRadiusCircle: {
      borderColor: palette.primary,
      borderRadius: 999,
      borderStyle: 'dashed',
      borderWidth: 2,
      height: 160,
      left: '50%',
      marginLeft: -80,
      marginTop: -80,
      opacity: 0.55,
      position: 'absolute',
      top: '50%',
      width: 160,
    },
    guruMarker: {
      alignItems: 'center',
      backgroundColor: palette.primary,
      borderColor: '#FFFFFF',
      borderRadius: 999,
      borderWidth: 3,
      height: 42,
      justifyContent: 'center',
      left: '50%',
      marginLeft: -21,
      marginTop: -21,
      position: 'absolute',
      top: '50%',
      width: 42,
    },
    demandMarker: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderColor: palette.orange,
      borderRadius: 999,
      borderWidth: 2,
      height: 32,
      justifyContent: 'center',
      position: 'absolute',
      width: 32,
    },
    demandMarkerText: { fontSize: 14 },
    mapTopLabel: {
      backgroundColor: isDark
        ? 'rgba(6,20,15,0.88)'
        : 'rgba(255,255,255,0.90)',
      borderRadius: 999,
      left: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      position: 'absolute',
      top: 10,
    },
    mapTopLabelText: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 8,
    },
    mapLegend: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },
    legendItem: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
    },
    legendGuruDot: {
      backgroundColor: palette.primary,
      borderRadius: 999,
      height: 7,
      width: 7,
    },
    legendDemandDot: {
      backgroundColor: palette.orange,
      borderRadius: 999,
      height: 7,
      width: 7,
    },
    legendText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 7,
    },
    privacyText: {
      color: palette.muted,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 7,
      textAlign: 'right',
    },
    summaryGrid: { flexDirection: 'row', gap: 8 },
    summaryCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 16,
      borderWidth: 1,
      flex: 1,
      gap: 2,
      padding: 10,
    },
    summaryValue: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 15,
    },
    summaryLabel: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 7,
    },
    distanceCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 10,
      padding: 12,
    },
    distanceRow: { flexDirection: 'row', gap: 6 },
    distanceButton: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      flex: 1,
      justifyContent: 'center',
      minHeight: 34,
    },
    distanceButtonActive: { backgroundColor: palette.primary },
    distanceText: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 8,
    },
    distanceTextActive: { color: '#FFFFFF' },
    sectionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 15,
    },
    sectionLink: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 8,
    },
    opportunityStack: { gap: 8 },
    opportunityCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 17,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 9,
      padding: 10,
    },
    opportunityIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 12,
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    opportunityEmoji: { fontSize: 19 },
    opportunityCopy: { flex: 1, gap: 2 },
    opportunityTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
    },
    opportunityMeta: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 7,
    },
    opportunityRight: {
      alignItems: 'flex-end',
      gap: 5,
    },
    opportunityEarnings: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
    },
    emptyCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 7,
      paddingHorizontal: 24,
      paddingVertical: 28,
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
      fontSize: 14,
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