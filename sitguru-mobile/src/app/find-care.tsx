import { Asset } from "expo-asset";
import { router } from "expo-router";
import {
  ChevronLeft,
  Heart,
  List,
  Map as MapIcon,
  MapPin,
  PawPrint,
  ShieldCheck,
  SlidersHorizontal,
  Star,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SitGuruIcon } from "@/components/SitGuruIcon";
import SitGuruScreen from "@/components/SitGuruScreen";
import { AppFonts } from "@/constants/fonts";
import {
  setThemePreference,
  SitGuruThemePreference,
  useThemePreference,
} from "@/hooks/use-color-scheme";
import { useThemeMode } from "@/hooks/use-theme";
import { resolveSupabaseStorageUrl } from "@/lib/storage";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  getGuruBookingStatusLabel,
  getGuruDisplayName,
  getGuruLocationLabel,
  getGuruPhotoUrl,
  getGuruRateLabel,
  getGuruRatingLabel,
  getGuruSlug,
  getGuruVisibilityLabel,
  isGuruBookable,
  isKnownPreviewGuru,
  type PublicGuruProfile,
} from "@/types/guru";

const MapsModule = Platform.OS === "web" ? null : require("react-native-maps");
const NativeMapView = MapsModule?.default ?? MapsModule?.MapView;
const NativeMarker = MapsModule?.Marker;

const SITGURU_FALLBACK_AVATAR = require("../assets/images/sitguru-symbol-green.jpg");

function resolveBundledAssetUri(assetModule: unknown) {
  try {
    const asset = Asset.fromModule(assetModule as number | string);
    const resolvedUri = asset.localUri || asset.uri;

    if (resolvedUri) return resolvedUri;
  } catch {
    // Fall through to the web-module shapes below.
  }

  if (typeof assetModule === "string") return assetModule;

  if (assetModule && typeof assetModule === "object") {
    const assetRecord = assetModule as Record<string, unknown>;

    if (typeof assetRecord.uri === "string") return assetRecord.uri;
    if (typeof assetRecord.default === "string") return assetRecord.default;

    if (assetRecord.default && typeof assetRecord.default === "object") {
      const defaultRecord = assetRecord.default as Record<string, unknown>;
      if (typeof defaultRecord.uri === "string") return defaultRecord.uri;
    }
  }

  return "";
}

const SITGURU_FALLBACK_AVATAR_URI = resolveBundledAssetUri(
  SITGURU_FALLBACK_AVATAR,
);

function GuruAvatarImage({
  photoUrl,
  style,
}: {
  photoUrl?: string | null;
  style: any;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [photoUrl]);

  const source =
    photoUrl && !imageFailed ? { uri: photoUrl } : SITGURU_FALLBACK_AVATAR;

  return (
    <Image
      accessibilityLabel="Guru profile photo"
      onError={() => setImageFailed(true)}
      resizeMode="cover"
      source={source}
      style={style}
    />
  );
}

function GuruCardHeroImage({
  photoUrl,
  styles,
}: {
  photoUrl?: string | null;
  styles: ReturnType<typeof createStyles>;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [photoUrl]);

  const source =
    photoUrl && !imageFailed ? { uri: photoUrl } : SITGURU_FALLBACK_AVATAR;

  return (
    <View style={styles.guruProfilePhotoStage}>
      <Image
        accessibilityElementsHidden
        blurRadius={Platform.OS === "web" ? 0 : 6}
        onError={() => setImageFailed(true)}
        resizeMode="cover"
        source={source}
        style={styles.guruProfilePhotoBackdrop}
      />

      <View
        pointerEvents="none"
        style={styles.guruProfilePhotoBackdropTint}
      />

      <Image
        accessibilityLabel="Guru profile photo"
        onError={() => setImageFailed(true)}
        resizeMode="contain"
        source={source}
        style={styles.guruProfilePhoto}
      />
    </View>
  );
}

type ServiceOption = {
  label: string;
  value: string;
  keywords: string[];
};

type GuruLoadResult = {
  gurus: PublicGuruProfile[];
  usedFallback: boolean;
};

type ThemeOption = {
  label: string;
  value: SitGuruThemePreference;
  icon: "sun" | "moon";
};

type ExploreView = "list" | "map";
type DiscoveryScope = "all" | "nearby";

type HomeLocation = {
  zipCode: string;
  city: string;
  stateCode: string;
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

type GuruMapPoint = {
  guru: PublicGuruProfile;
  id: string;
  name: string;
  photoUrl: string | null | undefined;
  city: string;
  stateCode: string;
  stateName: string;
  coordinate: MapCoordinate;
  coordinateQuality: "exact" | "city" | "state";
  radiusMiles: number;
};

const FAVORITE_GURUS_STORAGE_KEY = "sitguru.favoriteGuruIds.v1";
const HOME_LOCATION_STORAGE_KEY = "sitguru.homeLocation.v1";
const DISCOVERY_SCOPE_STORAGE_KEY = "sitguru.discoveryScope.v1";
const SELECT_FIELDS = "*";
const LOCAL_DISCOVERY_RADIUS_MILES = 75;
const MAX_MAP_GURUS = 60;
const MAX_NEARBY_MAP_GURUS = 20;
const MINIMUM_MAP_GURU_COUNT = 8;
const WEB_MAPLIBRE_CSS_ID = "sitguru-maplibre-css";
const WEB_MAPLIBRE_CSS_URL =
  "https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css";
const WEB_MAP_STYLE_LIGHT = "https://tiles.openfreemap.org/styles/liberty";
const WEB_MAP_STYLE_DARK = "https://tiles.openfreemap.org/styles/dark";

const DEFAULT_US_REGION: MapRegion = {
  latitude: 39.5,
  longitude: -98.35,
  latitudeDelta: 28,
  longitudeDelta: 58,
};

const DARK_NATIVE_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#10231B" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#B7C6BC" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#10231B" }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#355044" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#13281F" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#173125" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#173B29" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2B3B34" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#16241E" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3A493F" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#243A30" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0B282A" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#79A4A3" }],
  },
];

const themeOptions: ThemeOption[] = [
  { label: "Light", value: "light", icon: "sun" },
  { label: "Dark", value: "dark", icon: "moon" },
];

const services: ServiceOption[] = [
  { label: "All", value: "all", keywords: [] },
  {
    label: "Walks",
    value: "walks",
    keywords: ["walk", "walks", "walking", "trail"],
  },
  {
    label: "Drop-ins",
    value: "drop_ins",
    keywords: ["drop", "drop-in", "drop-ins", "visit", "visits", "puppy"],
  },
  {
    label: "Sitting",
    value: "sitting",
    keywords: [
      "sit",
      "sitting",
      "house sitting",
      "cats",
      "senior",
      "medication",
    ],
  },
  {
    label: "Boarding",
    value: "boarding",
    keywords: ["board", "boarding", "day care", "doggy day care"],
  },
];

const STATE_COORDS: Record<string, MapCoordinate & { stateName: string }> = {
  AL: { latitude: 32.8067, longitude: -86.7911, stateName: "Alabama" },
  AK: { latitude: 61.3707, longitude: -152.4044, stateName: "Alaska" },
  AZ: { latitude: 33.7298, longitude: -111.4312, stateName: "Arizona" },
  AR: { latitude: 34.9697, longitude: -92.3731, stateName: "Arkansas" },
  CA: { latitude: 36.1162, longitude: -119.6816, stateName: "California" },
  CO: { latitude: 39.0598, longitude: -105.3111, stateName: "Colorado" },
  CT: { latitude: 41.5978, longitude: -72.7554, stateName: "Connecticut" },
  DE: { latitude: 39.3185, longitude: -75.5071, stateName: "Delaware" },
  FL: { latitude: 27.7663, longitude: -81.6868, stateName: "Florida" },
  GA: { latitude: 33.0406, longitude: -83.6431, stateName: "Georgia" },
  HI: { latitude: 21.0943, longitude: -157.4983, stateName: "Hawaii" },
  ID: { latitude: 44.2405, longitude: -114.4788, stateName: "Idaho" },
  IL: { latitude: 40.3495, longitude: -88.9861, stateName: "Illinois" },
  IN: { latitude: 39.8494, longitude: -86.2583, stateName: "Indiana" },
  IA: { latitude: 42.0115, longitude: -93.2105, stateName: "Iowa" },
  KS: { latitude: 38.5266, longitude: -96.7265, stateName: "Kansas" },
  KY: { latitude: 37.6681, longitude: -84.6701, stateName: "Kentucky" },
  LA: { latitude: 31.1695, longitude: -91.8678, stateName: "Louisiana" },
  ME: { latitude: 44.6939, longitude: -69.3819, stateName: "Maine" },
  MD: { latitude: 39.0639, longitude: -76.8021, stateName: "Maryland" },
  MA: { latitude: 42.2302, longitude: -71.5301, stateName: "Massachusetts" },
  MI: { latitude: 43.3266, longitude: -84.5361, stateName: "Michigan" },
  MN: { latitude: 45.6945, longitude: -93.9002, stateName: "Minnesota" },
  MS: { latitude: 32.7416, longitude: -89.6787, stateName: "Mississippi" },
  MO: { latitude: 38.4561, longitude: -92.2884, stateName: "Missouri" },
  MT: { latitude: 46.9219, longitude: -110.4544, stateName: "Montana" },
  NE: { latitude: 41.1254, longitude: -98.2681, stateName: "Nebraska" },
  NV: { latitude: 38.3135, longitude: -117.0554, stateName: "Nevada" },
  NH: { latitude: 43.4525, longitude: -71.5639, stateName: "New Hampshire" },
  NJ: { latitude: 40.2989, longitude: -74.521, stateName: "New Jersey" },
  NM: { latitude: 34.8405, longitude: -106.2485, stateName: "New Mexico" },
  NY: { latitude: 42.1657, longitude: -74.9481, stateName: "New York" },
  NC: { latitude: 35.6301, longitude: -79.8064, stateName: "North Carolina" },
  ND: { latitude: 47.5289, longitude: -99.784, stateName: "North Dakota" },
  OH: { latitude: 40.3888, longitude: -82.7649, stateName: "Ohio" },
  OK: { latitude: 35.5653, longitude: -96.9289, stateName: "Oklahoma" },
  OR: { latitude: 44.572, longitude: -122.0709, stateName: "Oregon" },
  PA: { latitude: 40.5908, longitude: -77.2098, stateName: "Pennsylvania" },
  RI: { latitude: 41.6809, longitude: -71.5118, stateName: "Rhode Island" },
  SC: { latitude: 33.8569, longitude: -80.945, stateName: "South Carolina" },
  SD: { latitude: 44.2998, longitude: -99.4388, stateName: "South Dakota" },
  TN: { latitude: 35.7478, longitude: -86.6923, stateName: "Tennessee" },
  TX: { latitude: 31.0545, longitude: -97.5635, stateName: "Texas" },
  UT: { latitude: 40.15, longitude: -111.8624, stateName: "Utah" },
  VT: { latitude: 44.0459, longitude: -72.7107, stateName: "Vermont" },
  VA: { latitude: 37.7693, longitude: -78.17, stateName: "Virginia" },
  WA: { latitude: 47.4009, longitude: -121.4905, stateName: "Washington" },
  WV: { latitude: 38.4912, longitude: -80.9545, stateName: "West Virginia" },
  WI: { latitude: 44.2685, longitude: -89.6165, stateName: "Wisconsin" },
  WY: { latitude: 42.756, longitude: -107.3025, stateName: "Wyoming" },
};

const CITY_COORDS: Record<string, MapCoordinate> = {
  "quakertown pa": { latitude: 40.4418, longitude: -75.3416 },
  "bethlehem pa": { latitude: 40.6259, longitude: -75.3705 },
  "philadelphia pa": { latitude: 39.9526, longitude: -75.1652 },
  "doylestown pa": { latitude: 40.3101, longitude: -75.1299 },
  "allentown pa": { latitude: 40.6023, longitude: -75.4714 },
  "lansdale pa": { latitude: 40.2415, longitude: -75.2838 },
  "easton pa": { latitude: 40.6884, longitude: -75.2207 },
  "new hope pa": { latitude: 40.3643, longitude: -74.9513 },
  "yardley pa": { latitude: 40.2457, longitude: -74.846 },
  "perkasie pa": { latitude: 40.372, longitude: -75.2927 },
  "katy tx": { latitude: 29.7858, longitude: -95.8244 },
  "austin tx": { latitude: 30.2672, longitude: -97.7431 },
  "atlanta ga": { latitude: 33.749, longitude: -84.388 },
  "boston ma": { latitude: 42.3601, longitude: -71.0589 },
  "seattle wa": { latitude: 47.6062, longitude: -122.3321 },
  "portland or": { latitude: 45.5152, longitude: -122.6784 },
  "los angeles ca": { latitude: 34.0522, longitude: -118.2437 },
  "phoenix az": { latitude: 33.4484, longitude: -112.074 },
  "denver co": { latitude: 39.7392, longitude: -104.9903 },
  "minneapolis mn": { latitude: 44.9778, longitude: -93.265 },
  "chicago il": { latitude: 41.8781, longitude: -87.6298 },
  "columbus oh": { latitude: 39.9612, longitude: -82.9988 },
  "nashville tn": { latitude: 36.1627, longitude: -86.7816 },
  "new york ny": { latitude: 40.7128, longitude: -74.006 },
  "miami fl": { latitude: 25.7617, longitude: -80.1918 },
};

const ZIP_COORDS: Record<string, MapCoordinate> = {
  "18951": { latitude: 40.4418, longitude: -75.3416 },
  "18018": { latitude: 40.6259, longitude: -75.3705 },
  "18015": { latitude: 40.5887, longitude: -75.3836 },
  "19102": { latitude: 39.9526, longitude: -75.1652 },
  "19103": { latitude: 39.9522, longitude: -75.174 },
  "19104": { latitude: 39.9612, longitude: -75.1995 },
  "19106": { latitude: 39.9489, longitude: -75.1457 },
  "19107": { latitude: 39.9487, longitude: -75.1594 },
  "18901": { latitude: 40.3101, longitude: -75.1299 },
  "18101": { latitude: 40.6023, longitude: -75.4714 },
  "18102": { latitude: 40.6128, longitude: -75.4774 },
  "18103": { latitude: 40.5671, longitude: -75.4896 },
  "19446": { latitude: 40.2415, longitude: -75.2838 },
  "18042": { latitude: 40.6884, longitude: -75.2207 },
  "18938": { latitude: 40.3643, longitude: -74.9513 },
  "19067": { latitude: 40.2457, longitude: -74.846 },
  "18944": { latitude: 40.372, longitude: -75.2927 },
  "77449": { latitude: 29.8362, longitude: -95.7344 },
  "77450": { latitude: 29.756, longitude: -95.7488 },
  "77493": { latitude: 29.856, longitude: -95.8268 },
  "77494": { latitude: 29.7411, longitude: -95.7995 },
  "78701": { latitude: 30.2711, longitude: -97.7437 },
  "78702": { latitude: 30.2637, longitude: -97.7145 },
  "30301": { latitude: 33.749, longitude: -84.388 },
  "30303": { latitude: 33.7527, longitude: -84.3925 },
  "30308": { latitude: 33.7717, longitude: -84.3726 },
  "30309": { latitude: 33.7998, longitude: -84.3875 },
  "02108": { latitude: 42.357, longitude: -71.0636 },
  "02109": { latitude: 42.3618, longitude: -71.0545 },
};

const localZipHints: Record<string, string[]> = {
  "quakertown pa": ["18951"],
  "bethlehem pa": ["18018", "18015"],
  "philadelphia pa": ["19102", "19103", "19104", "19106", "19107"],
  "doylestown pa": ["18901"],
  "allentown pa": ["18101", "18102", "18103"],
  "lansdale pa": ["19446"],
  "easton pa": ["18042"],
  "new hope pa": ["18938"],
  "yardley pa": ["19067"],
  "perkasie pa": ["18944"],
  "katy tx": ["77449", "77450", "77493", "77494"],
  "atlanta ga": ["30301", "30303", "30308", "30309"],
  "austin tx": ["78701", "78702", "78703", "78704"],
  "boston ma": ["02108", "02109", "02110", "02111"],
};

const previewGurus: PublicGuruProfile[] = [
  [
    "preview-wa",
    "Willow Parker",
    "Seattle",
    "WA",
    32,
    18,
    ["Dog Walking", "Drop-In Visits", "Pet Sitting"],
  ],
  [
    "preview-or",
    "Olivia Rivers",
    "Portland",
    "OR",
    29,
    15,
    ["Walks", "Sitting", "Cats"],
  ],
  [
    "preview-ca",
    "Camila Santos",
    "Los Angeles",
    "CA",
    36,
    25,
    ["Dog Walking", "Boarding", "Drop-In Visits"],
  ],
  [
    "preview-az",
    "Avery Stone",
    "Phoenix",
    "AZ",
    28,
    20,
    ["Drop-In Visits", "Senior Pets", "Dog Walking"],
  ],
  [
    "preview-co",
    "Caleb Reed",
    "Denver",
    "CO",
    31,
    22,
    ["Boarding", "Dog Walking", "House Sitting"],
  ],
  [
    "preview-mn",
    "Mia North",
    "Minneapolis",
    "MN",
    30,
    18,
    ["Walks", "Sitting", "Boarding"],
  ],
  [
    "preview-il",
    "Isla Brooks",
    "Chicago",
    "IL",
    27,
    15,
    ["Drop-In Visits", "Pet Sitting", "Cats"],
  ],
  [
    "preview-oh",
    "Owen Hart",
    "Columbus",
    "OH",
    29,
    18,
    ["Walks", "Boarding", "Drop-In Visits"],
  ],
  [
    "preview-tn",
    "Tessa Green",
    "Nashville",
    "TN",
    28,
    20,
    ["Pet Sitting", "Dog Walking", "Weekend Care"],
  ],
  [
    "preview-ga",
    "Alyssa Brooks",
    "Atlanta",
    "GA",
    22,
    18,
    ["Walks", "Drop-In Visits", "Sitting"],
  ],
  [
    "preview-ny",
    "Nina Hart",
    "New York",
    "NY",
    36,
    16,
    ["Cats", "Drop-In Visits", "House Sitting"],
  ],
  [
    "preview-pa",
    "Darius Miller",
    "Philadelphia",
    "PA",
    32,
    25,
    ["Drop-In Visits", "Senior Pets", "Dog Walking"],
  ],
  [
    "preview-ma",
    "Jessica M.",
    "Boston",
    "MA",
    35,
    16,
    ["Walks", "Sitting", "Boarding"],
  ],
  [
    "preview-fl",
    "Faith Lopez",
    "Miami",
    "FL",
    30,
    30,
    ["Boarding", "Walks", "Drop-In Visits"],
  ],
].map(([id, name, city, state, rate, radius, svc]) => ({
  id: id as string,
  display_name: name as string,
  first_name: String(name).split(" ")[0],
  slug: String(name).toLowerCase().replace(/\s+/g, "-"),
  bio: `${name} is a polished local Guru preview showing the care style, services, and trust details SitGuru families can review as local availability grows.`,
  service_city: city as string,
  service_state: state as string,
  hourly_rate: rate as number,
  service_radius_miles: radius as number,
  rating_avg: null,
  review_count: null,
  is_verified: false,
  is_bookable: false,
  accepting_bookings: false,
  is_accepting_bookings: false,
  role: "Local Pet Care Guru",
  services: svc as string[],
  service_area: `${city}, ${state} service area`,
  source: "placeholder",
}));

async function loadPublicGurus(): Promise<GuruLoadResult> {
  if (!isSupabaseConfigured) return { gurus: [], usedFallback: true };

  const sources: Array<{ table: string; profiles?: boolean }> = [
    { table: "public_guru_search_profiles" },
    { table: "guru_profiles" },
    { table: "gurus" },
    { table: "profiles", profiles: true },
  ];

  for (const source of sources) {
    let query = supabase.from(source.table).select(SELECT_FIELDS).limit(60);

    if (source.profiles) {
      query = query.in("role", [
        "guru",
        "pet_guru",
        "Guru",
        "Pet Guru",
        "pet care guru",
      ]);
    }

    const result = await query;

    if (!result.error && result.data?.length) {
      return {
        gurus: (result.data as PublicGuruProfile[]).map((guru) => ({
          ...guru,
          source: source.table as PublicGuruProfile["source"],
        })),
        usedFallback: false,
      };
    }
  }

  return { gurus: [], usedFallback: true };
}

export default function FindCareScreen() {
  const themeMode = useThemeMode();
  const themePreference = useThemePreference();
  const isDark = themeMode === "dark";
  const palette = getPalette(isDark);
  const styles = createStyles(isDark);
  const scrollRef = useRef<ScrollView | null>(null);

  const [activeView, setActiveView] = useState<ExploreView>("list");
  const [discoveryScope, setDiscoveryScope] = useState<DiscoveryScope>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<ServiceOption>(
    services[0],
  );
  const [noticeMessage, setNoticeMessage] = useState("");
  const [dynamicGurus, setDynamicGurus] = useState<PublicGuruProfile[]>([]);
  const [isLoadingGurus, setIsLoadingGurus] = useState(true);
  const [favoriteGuruIds, setFavoriteGuruIds] = useState<string[]>([]);
  const [highlightedGuruId, setHighlightedGuruId] = useState<string | null>(
    null,
  );
  const [selectedGuruId, setSelectedGuruId] = useState<string | null>(null);
  const [mapRegion, setMapRegion] = useState<MapRegion>(DEFAULT_US_REGION);
  const [homeLocation, setHomeLocation] = useState<HomeLocation | null>(null);
  const [homeZipDraft, setHomeZipDraft] = useState("");
  const [isEditingHomeZip, setIsEditingHomeZip] = useState(false);
  const [isSavingHomeZip, setIsSavingHomeZip] = useState(false);
  const [isMapPreviewExpanded, setIsMapPreviewExpanded] = useState(false);

  const cleanZip = searchQuery.replace(/\D/g, "").slice(0, 5);
  const hasValidZip = cleanZip.length === 5;
  const careAreaLabel = hasValidZip
    ? `ZIP ${cleanZip}`
    : homeLocation
      ? `ZIP ${homeLocation.zipCode}`
      : "your care area";
  const sourceGurus = useMemo(() => {
    const requestedSearchCenter = getSearchCenter(searchQuery);
    const requestedSearchArea = getSearchArea(searchQuery);
    const hasSearch = Boolean(searchQuery.trim());
    const homeCoordinate =
      homeLocation &&
      homeLocation.latitude !== null &&
      homeLocation.longitude !== null
        ? {
            latitude: homeLocation.latitude,
            longitude: homeLocation.longitude,
          }
        : null;
    const previewCenter = requestedSearchCenter
      ? {
          latitude: requestedSearchCenter.latitude,
          longitude: requestedSearchCenter.longitude,
        }
      : discoveryScope === "nearby" && !hasSearch
        ? homeCoordinate
        : null;

    const localizedPreviewGurus = previewGurus.map((guru, index) => {
      if (!previewCenter) return guru;

      const coordinate = offsetCoordinateByMiles(
        previewCenter,
        2 + (index % 7) * 1.8,
        (index * 47) % 360,
      );
      const localCity = requestedSearchCenter
        ? requestedSearchArea?.city ||
          (requestedSearchArea?.stateCode ? "Statewide" : "Local area")
        : homeLocation?.city || guru.service_city;
      const localState = requestedSearchCenter
        ? requestedSearchArea?.stateCode || guru.service_state
        : homeLocation?.stateCode || guru.service_state;
      const localZip = requestedSearchArea?.zipCode || homeLocation?.zipCode;

      return {
        ...guru,
        service_city: localCity,
        service_state: localState,
        service_area: requestedSearchCenter
          ? `${localCity}, ${localState} service area`
          : `${homeLocation?.city || guru.service_city}, ${
              homeLocation?.stateCode || guru.service_state
            } service area`,
        zip_code: localZip || undefined,
        service_zip: localZip || undefined,
        service_zip_code: localZip || undefined,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      };
    });

    const previewCandidates = requestedSearchCenter
      ? localizedPreviewGurus
      : previewGurus;

    if (dynamicGurus.length === 0) return previewCandidates;

    const guruIdentity = (guru: PublicGuruProfile) =>
      `${getGuruDisplayName(guru).trim().toLowerCase()}|${getGuruStateCode(guru)}`;
    const liveGuruIdentities = new Set(dynamicGurus.map(guruIdentity));
    const previewFillers = previewCandidates.filter(
      (guru) => !liveGuruIdentities.has(guruIdentity(guru)),
    );

    // Search must run across the complete Guru catalog. Previously the preview
    // fillers were removed whenever the live table already contained eight or
    // more rows, which could leave every search with only one visible match.
    if (hasSearch || discoveryScope === "all") {
      return [...dynamicGurus, ...previewFillers];
    }

    const fillerCount = Math.max(
      0,
      MINIMUM_MAP_GURU_COUNT - dynamicGurus.length,
    );

    return [...dynamicGurus, ...previewFillers.slice(0, fillerCount)];
  }, [discoveryScope, dynamicGurus, homeLocation, searchQuery]);
  const hasActiveFilters =
    Boolean(searchQuery.trim()) || selectedService.value !== "all";

  const displayedGurus = useMemo(() => {
    const filtered = sourceGurus.filter((guru) => {
      return (
        guruMatchesService(guru, selectedService) &&
        guruMatchesSearch(guru, searchQuery)
      );
    });

    if (
      discoveryScope === "all" ||
      searchQuery.trim() ||
      !homeLocation ||
      homeLocation.latitude === null ||
      homeLocation.longitude === null
    ) {
      return filtered;
    }

    return [...filtered].sort((firstGuru, secondGuru) => {
      const firstCoordinate = getGuruCoordinate(firstGuru, 0);
      const secondCoordinate = getGuruCoordinate(secondGuru, 0);
      const homeCoordinate = {
        latitude: homeLocation.latitude as number,
        longitude: homeLocation.longitude as number,
      };

      return (
        getDistanceMiles(homeCoordinate, firstCoordinate) -
        getDistanceMiles(homeCoordinate, secondCoordinate)
      );
    });
  }, [sourceGurus, selectedService, searchQuery, homeLocation, discoveryScope]);

  const mapPoints = useMemo<GuruMapPoint[]>(() => {
    const allPoints = displayedGurus.map((guru, index) => {
      const coordinateDetails = getGuruCoordinateDetails(guru, index);
      const stateCode = getGuruStateCode(guru);
      const stateMeta = STATE_COORDS[stateCode] ?? {
        ...coordinateDetails.coordinate,
        stateName: stateCode || "State",
      };

      return {
        guru,
        id: String(guru.id),
        name: getGuruDisplayName(guru),
        photoUrl: resolveSupabaseStorageUrl(getGuruPhotoUrl(guru)),
        city: getGuruCity(guru),
        stateCode,
        stateName: stateMeta.stateName,
        coordinate: coordinateDetails.coordinate,
        coordinateQuality: coordinateDetails.quality,
        radiusMiles: getGuruServiceRadiusMiles(guru),
      };
    });

    if (allPoints.length === 0) return [];

    // An active search is already the user's filter. Do not apply the saved
    // home-ZIP radius on top of it, and do not discard state-level profiles
    // just because one result has more precise coordinates.
    if (searchQuery.trim()) {
      return allPoints.slice(0, MAX_MAP_GURUS);
    }

    if (discoveryScope === "all") {
      return allPoints.slice(0, MAX_MAP_GURUS);
    }

    const candidates = allPoints;
    const discoveryCenter = resolveMapDiscoveryCenter({
      homeLocation,
      mapPoints: allPoints,
      searchQuery: "",
    });

    if (!discoveryCenter) {
      return candidates.slice(0, MAX_NEARBY_MAP_GURUS);
    }

    const sorted = [...candidates].sort(
      (firstPoint, secondPoint) =>
        getDistanceMiles(discoveryCenter, firstPoint.coordinate) -
        getDistanceMiles(discoveryCenter, secondPoint.coordinate),
    );

    const nearby = sorted.filter(
      (point) =>
        getDistanceMiles(discoveryCenter, point.coordinate) <=
        LOCAL_DISCOVERY_RADIUS_MILES,
    );

    return (nearby.length > 0 ? nearby : sorted.slice(0, 8)).slice(
      0,
      MAX_NEARBY_MAP_GURUS,
    );
  }, [displayedGurus, homeLocation, searchQuery, discoveryScope]);

  const selectedGuru = useMemo(() => {
    if (selectedGuruId) {
      const selectedPoint = mapPoints.find(
        (point) => point.id === selectedGuruId,
      );

      if (selectedPoint) return selectedPoint.guru;

      const selectedListGuru = displayedGurus.find(
        (guru) => String(guru.id) === selectedGuruId,
      );

      if (selectedListGuru) return selectedListGuru;
    }

    return mapPoints[0]?.guru ?? displayedGurus[0] ?? null;
  }, [displayedGurus, mapPoints, selectedGuruId]);

  const targetMapRegion = useMemo(() => {
    return getTargetMapRegion({
      discoveryScope,
      homeLocation,
      mapPoints,
      searchQuery,
    });
  }, [discoveryScope, homeLocation, mapPoints, searchQuery]);

  useEffect(() => {
    setMapRegion(targetMapRegion);
  }, [
    targetMapRegion.latitude,
    targetMapRegion.longitude,
    targetMapRegion.latitudeDelta,
    targetMapRegion.longitudeDelta,
  ]);

  useEffect(() => {
    let mounted = true;

    loadPublicGurus()
      .then(({ gurus }) => {
        if (!mounted) return;
        setDynamicGurus(gurus);
      })
      .catch(() => {
        if (!mounted) return;
        setDynamicGurus([]);
      })
      .finally(() => {
        if (mounted) setIsLoadingGurus(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, 0);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    setFavoriteGuruIds(readFavoriteGuruIds());
  }, []);

  useEffect(() => {
    setDiscoveryScope(readDiscoveryScope());
  }, []);

  useEffect(() => {
    let mounted = true;

    loadSavedHomeLocation()
      .then((savedLocation) => {
        if (!mounted || !savedLocation) return;
        setHomeLocation(savedLocation);
        setHomeZipDraft(savedLocation.zipCode);
      })
      .catch(() => {
        // The screen still works if a saved home location cannot be loaded.
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const availableIds = new Set([
      ...mapPoints.map((point) => point.id),
      ...displayedGurus.map((guru) => String(guru.id)),
    ]);

    setSelectedGuruId((currentGuruId) => {
      if (currentGuruId && availableIds.has(currentGuruId)) {
        return currentGuruId;
      }

      return (
        mapPoints[0]?.id ??
        (displayedGurus[0] ? String(displayedGurus[0].id) : null)
      );
    });
    setIsMapPreviewExpanded(false);
  }, [displayedGurus, mapPoints, selectedService.value, searchQuery]);

  function handleOpenHomeZipEditor() {
    setHomeZipDraft(homeLocation?.zipCode ?? "");
    setIsEditingHomeZip(true);
  }

  function handleCancelHomeZipEditor() {
    setHomeZipDraft(homeLocation?.zipCode ?? "");
    setIsEditingHomeZip(false);
  }

  async function handleSaveHomeZip() {
    const zipCode = homeZipDraft.replace(/\D/g, "").slice(0, 5);

    if (zipCode.length !== 5) {
      Alert.alert(
        "Enter a valid ZIP code",
        "Please enter a 5-digit U.S. home ZIP code.",
      );
      return;
    }

    setIsSavingHomeZip(true);

    try {
      const resolvedLocation = await resolveHomeLocation(zipCode);

      if (!resolvedLocation) {
        Alert.alert(
          "ZIP code not found",
          "We could not identify that ZIP code. Please check it and try again.",
        );
        return;
      }

      setHomeLocation(resolvedLocation);
      setHomeZipDraft(resolvedLocation.zipCode);
      setDiscoveryScope("nearby");
      writeDiscoveryScope("nearby");
      setIsEditingHomeZip(false);
      setSearchQuery("");
      setNoticeMessage(
        `Home area saved. Showing Gurus nearest ${formatHomeLocation(resolvedLocation)}.`,
      );
      writeHomeLocation(resolvedLocation);
      await saveHomeLocationToAccount(resolvedLocation);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch {
      Alert.alert(
        "Unable to save home ZIP",
        "Your ZIP could not be saved right now. Please try again.",
      );
    } finally {
      setIsSavingHomeZip(false);
    }
  }

  function handleShowAllGurus() {
    setDiscoveryScope("all");
    writeDiscoveryScope("all");
    setSearchQuery("");
    setSelectedService(services[0]);
    setNoticeMessage("Showing all available Gurus across SitGuru.");
    setSelectedGuruId(null);
    setHighlightedGuruId(null);
    setIsMapPreviewExpanded(false);
    setMapRegion(DEFAULT_US_REGION);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function handleShowNearbyGurus() {
    if (!homeLocation) {
      setActiveView("list");
      setIsEditingHomeZip(true);
      setHomeZipDraft("");
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setDiscoveryScope("nearby");
    writeDiscoveryScope("nearby");
    setSearchQuery("");
    setNoticeMessage(
      `Showing Gurus nearest ${formatHomeLocation(homeLocation)}.`,
    );
    setSelectedGuruId(null);
    setHighlightedGuruId(null);
    setIsMapPreviewExpanded(false);
  }

  function handleSearch() {
    const resultWord = displayedGurus.length === 1 ? "Guru" : "Gurus";

    if (hasValidZip) {
      setNoticeMessage(
        `Showing ${displayedGurus.length} ${resultWord} for ${careAreaLabel}.`,
      );
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    if (searchQuery.trim()) {
      setNoticeMessage(
        `Showing ${displayedGurus.length} ${resultWord} for "${searchQuery.trim()}". Search works with ZIP, city, state, service, and Guru name.`,
      );
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setNoticeMessage(
      `Showing ${displayedGurus.length} ${resultWord} for ${selectedService.label}.`,
    );
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function handleViewProfile(guru: PublicGuruProfile) {
    const slug = getGuruSlug(guru);

    router.push({
      pathname: "/guru-profile",
      params: slug ? { slug } : { guruId: guru.id },
    });
  }

  function handleBookingAction(guru: PublicGuruProfile) {
    if (isKnownPreviewGuru(guru)) {
      Alert.alert(
        "Profile Preview",
        "This local Guru profile is a preview and is not currently accepting booking requests yet.",
      );
      return;
    }

    if (isGuruBookable(guru)) {
      router.push("/request-booking");
      return;
    }

    router.push("/conversation");
  }

  function handleToggleFavorite(guru: PublicGuruProfile) {
    const name = getGuruDisplayName(guru);
    const guruId = String(guru.id);

    setFavoriteGuruIds((currentFavorites) => {
      const isAlreadyFavorite = currentFavorites.includes(guruId);
      const nextFavorites = isAlreadyFavorite
        ? currentFavorites.filter((id) => id !== guruId)
        : [...currentFavorites, guruId];

      writeFavoriteGuruIds(nextFavorites);

      Alert.alert(
        isAlreadyFavorite ? "Favorite Removed" : "Favorite Guru Saved",
        isAlreadyFavorite
          ? `${name} was removed from your favorite Gurus.`
          : `${name} was saved as one of your favorite Gurus.`,
      );

      return nextFavorites;
    });
  }

  function handleSelectGuru(guru: PublicGuruProfile) {
    setSelectedGuruId(String(guru.id));
    setHighlightedGuruId(String(guru.id));
  }

  return (
    <SitGuruScreen scroll center maxWidth={560}>
      <View style={styles.previewCanvas}>
        <View style={styles.deviceFrame}>
          <View style={styles.deviceTopSpeaker} />

          <View style={styles.phoneShell}>
            <ScrollView
              ref={scrollRef}
              style={styles.scrollView}
              contentContainerStyle={[
                styles.scrollContent,
                activeView === "map" && styles.mapScrollContent,
              ]}
              showsVerticalScrollIndicator={false}
              scrollEnabled={activeView === "list"}
              bounces={activeView === "list"}
            >
              <View style={styles.statusBar}>
                <Text style={styles.statusTime}>9:41</Text>

                <View style={styles.statusIcons}>
                  <View style={styles.signalBars}>
                    <View style={[styles.signalBar, { height: 6 }]} />
                    <View style={[styles.signalBar, { height: 8 }]} />
                    <View style={[styles.signalBar, { height: 10 }]} />
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

              <View style={styles.header}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Go back home"
                  onPress={() => {
                    if (activeView === "map") {
                      setActiveView("list");
                      setIsMapPreviewExpanded(false);
                      setHighlightedGuruId(null);
                      scrollRef.current?.scrollTo({ y: 0, animated: false });
                      return;
                    }

                    router.push("/");
                  }}
                  style={styles.backButton}
                >
                  <ChevronLeft
                    size={21}
                    color={palette.title}
                    strokeWidth={2.7}
                  />
                </Pressable>

                <Text style={styles.headerTitle}>
                  {activeView === "list" ? "Explore Gurus" : "Explore Map"}
                </Text>

                <View style={styles.modeToggle}>
                  {themeOptions.map((option) => {
                    const active = themePreference === option.value;

                    return (
                      <Pressable
                        key={option.value}
                        accessibilityRole="button"
                        accessibilityLabel={`Switch to ${option.label} mode`}
                        onPress={() => setThemePreference(option.value)}
                        style={[
                          styles.modeButton,
                          active && styles.modeButtonActive,
                        ]}
                      >
                        <SitGuruIcon
                          name={option.icon}
                          size={16}
                          color={
                            active
                              ? option.value === "light"
                                ? "#F3AA1F"
                                : isDark
                                  ? "#F0CF62"
                                  : "#0B4C38"
                              : palette.muted
                          }
                          strokeWidth={2.4}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.searchPanel}>
                <View style={styles.searchInputRow}>
                  <SitGuruIcon
                    name="explore"
                    size={18}
                    color={palette.muted}
                    strokeWidth={2.3}
                  />

                  <TextInput
                    value={searchQuery}
                    onChangeText={(value) => {
                      setSearchQuery(value);
                      setNoticeMessage("");
                    }}
                    onSubmitEditing={handleSearch}
                    placeholder="Search zip, city, state, or service"
                    placeholderTextColor={palette.placeholder}
                    returnKeyType="search"
                    style={styles.searchInput}
                  />

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Apply search filters"
                    onPress={handleSearch}
                    style={styles.filterButton}
                  >
                    <SlidersHorizontal
                      size={17}
                      color={palette.title}
                      strokeWidth={2.4}
                    />
                  </Pressable>
                </View>

                <View style={styles.serviceChips}>
                  {services.map((service) => {
                    const selected = selectedService.value === service.value;

                    return (
                      <Pressable
                        key={service.value}
                        accessibilityRole="button"
                        onPress={() => {
                          setSelectedService(service);
                          setNoticeMessage("");
                        }}
                        style={[
                          styles.serviceChip,
                          selected && styles.serviceChipSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.serviceChipText,
                            selected && styles.serviceChipTextSelected,
                          ]}
                        >
                          {service.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {noticeMessage && activeView === "list" ? (
                <View style={styles.noticePanel}>
                  <Text style={styles.noticeText}>{noticeMessage}</Text>
                </View>
              ) : null}

              {activeView === "list" ? (
                <>
                  <View style={styles.recommendedSection}>
                    <View style={styles.recommendedTop}>
                      <View style={styles.recommendedCopy}>
                        <Text style={styles.recommendedEyebrow}>
                          {hasActiveFilters
                            ? "Search results"
                            : "Recommended near you"}
                        </Text>
                        <Text style={styles.recommendedSubtitle}>
                          Trusted, local pet care Gurus
                        </Text>
                      </View>
                    </View>

                    <View style={styles.recommendedLocationRow}>
                      <View style={styles.homeLocationLine}>
                        <MapPin
                          size={12}
                          color={isDark ? palette.greenBright : palette.primary}
                          strokeWidth={2.5}
                        />
                        <Text style={styles.recommendedText} numberOfLines={1}>
                          {isLoadingGurus
                            ? "Loading trusted Gurus..."
                            : discoveryScope === "all" && !searchQuery.trim()
                              ? "All available SitGuru locations"
                              : hasValidZip
                                ? `Near ${cleanZip}`
                                : searchQuery.trim()
                                  ? `Near ${searchQuery.trim()}`
                                  : homeLocation
                                    ? `Near ${formatHomeLocation(homeLocation)}`
                                    : "Set your home ZIP to find nearby Gurus"}
                        </Text>
                      </View>

                      <View style={styles.locationActionGroup}>
                        {discoveryScope === "nearby" ? (
                          <>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel="Change home ZIP code"
                              onPress={handleOpenHomeZipEditor}
                              style={styles.changeLocationButton}
                            >
                              <Text style={styles.changeLocationText}>
                                Change
                              </Text>
                            </Pressable>

                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel="Show all Gurus"
                              onPress={handleShowAllGurus}
                              style={styles.allGurusLinkButton}
                            >
                              <Text style={styles.allGurusLinkText}>
                                All Gurus
                              </Text>
                            </Pressable>
                          </>
                        ) : (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={
                              homeLocation
                                ? "Show Gurus near home"
                                : "Set home ZIP code"
                            }
                            onPress={handleShowNearbyGurus}
                            style={styles.changeLocationButton}
                          >
                            <Text style={styles.changeLocationText}>
                              {homeLocation ? "Near Me" : "Set ZIP"}
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </View>

                  {isEditingHomeZip ? (
                    <View style={styles.homeZipEditor}>
                      <View style={styles.homeZipEditorCopy}>
                        <Text style={styles.homeZipEditorTitle}>
                          Home ZIP code
                        </Text>
                        <Text style={styles.homeZipEditorText}>
                          SitGuru uses this to show and order Gurus closest to
                          your home area.
                        </Text>
                      </View>

                      <View style={styles.homeZipEditorRow}>
                        <TextInput
                          accessibilityLabel="Home ZIP code"
                          autoFocus
                          keyboardType="number-pad"
                          maxLength={5}
                          onChangeText={(value) =>
                            setHomeZipDraft(
                              value.replace(/\D/g, "").slice(0, 5),
                            )
                          }
                          onSubmitEditing={handleSaveHomeZip}
                          placeholder="18951"
                          placeholderTextColor={palette.placeholder}
                          returnKeyType="done"
                          style={styles.homeZipInput}
                          value={homeZipDraft}
                        />

                        <Pressable
                          accessibilityRole="button"
                          disabled={isSavingHomeZip}
                          onPress={handleSaveHomeZip}
                          style={[
                            styles.homeZipSaveButton,
                            isSavingHomeZip && styles.homeZipSaveButtonDisabled,
                          ]}
                        >
                          <Text style={styles.homeZipSaveText}>
                            {isSavingHomeZip ? "Saving..." : "Save"}
                          </Text>
                        </Pressable>

                        <Pressable
                          accessibilityRole="button"
                          disabled={isSavingHomeZip}
                          onPress={handleCancelHomeZipEditor}
                          style={styles.homeZipCancelButton}
                        >
                          <Text style={styles.homeZipCancelText}>Cancel</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}

                  {displayedGurus.length === 0 && !isLoadingGurus ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyIcon}>🐾</Text>
                      <Text style={styles.emptyTitle}>
                        No Gurus matched this search.
                      </Text>
                      <Text style={styles.emptyText}>
                        Try another ZIP, city, state, or service. You can also
                        switch back to All.
                      </Text>

                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          setSearchQuery("");
                          setSelectedService(services[0]);
                          setNoticeMessage("");
                        }}
                        style={styles.emptyButton}
                      >
                        <Text style={styles.emptyButtonText}>Reset Search</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.guruList}>
                      {displayedGurus.map((guru, index) => (
                        <GuruDiscoveryCard
                          favoriteGuruIds={favoriteGuruIds}
                          guru={guru}
                          homeLocation={homeLocation}
                          index={index}
                          key={String(guru.id)}
                          onBook={handleBookingAction}
                          onFavorite={handleToggleFavorite}
                          onView={handleViewProfile}
                          palette={palette}
                          styles={styles}
                        />
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.mapExplorerStage}>
                  <CoverageMap
                    fillScreen
                    highlightedGuruId={highlightedGuruId}
                    isDark={isDark}
                    mapPoints={mapPoints}
                    mapRegion={mapRegion}
                    onMarkerLeave={() => setHighlightedGuruId(null)}
                    onMarkerOpen={(guru) => {
                      handleSelectGuru(guru);
                      setIsMapPreviewExpanded(true);
                    }}
                    onMarkerPress={(guru) => {
                      handleSelectGuru(guru);
                      setIsMapPreviewExpanded(false);
                    }}
                    onRegionChange={setMapRegion}
                    palette={palette}
                    styles={styles}
                    userCoordinate={
                      homeLocation?.latitude !== null &&
                      homeLocation?.latitude !== undefined &&
                      homeLocation?.longitude !== null &&
                      homeLocation?.longitude !== undefined
                        ? {
                            latitude: homeLocation.latitude,
                            longitude: homeLocation.longitude,
                          }
                        : null
                    }
                  />

                  {discoveryScope === "nearby" ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Show all Gurus on the map"
                      onPress={handleShowAllGurus}
                      style={styles.mapAllGurusButton}
                    >
                      <Text style={styles.mapAllGurusButtonText}>
                        All Gurus
                      </Text>
                    </Pressable>
                  ) : null}

                  <View style={styles.mapGuruCountBadge}>
                    <View style={styles.mapGuruCountPaw}>
                      <Text style={styles.mapGuruCountPawText}>🐾</Text>
                    </View>
                    <Text style={styles.mapGuruCountNumber}>
                      {mapPoints.length}
                    </Text>
                    <Text style={styles.mapGuruCountLabel}>Gurus</Text>
                  </View>

                  <View style={styles.mapUtilityStack}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Center map on home area"
                      onPress={() => {
                        if (
                          homeLocation?.latitude !== null &&
                          homeLocation?.latitude !== undefined &&
                          homeLocation?.longitude !== null &&
                          homeLocation?.longitude !== undefined
                        ) {
                          setMapRegion({
                            latitude: homeLocation.latitude,
                            longitude: homeLocation.longitude,
                            latitudeDelta: 0.48,
                            longitudeDelta: 0.54,
                          });
                        }
                      }}
                      style={styles.mapUtilityButton}
                    >
                      <Text style={styles.mapUtilityIcon}>◎</Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="View Guru list"
                      onPress={() => {
                        setActiveView("list");
                        setIsMapPreviewExpanded(false);
                        setHighlightedGuruId(null);
                        scrollRef.current?.scrollTo({ y: 0, animated: false });
                      }}
                      style={styles.mapUtilityButton}
                    >
                      <List
                        size={18}
                        color={palette.title}
                        strokeWidth={2.5}
                      />
                    </Pressable>
                  </View>

                  {selectedGuru ? (
                    <MapGuruPreviewCard
                      expanded={isMapPreviewExpanded}
                      favoriteGuruIds={favoriteGuruIds}
                      guru={selectedGuru}
                      homeLocation={homeLocation}
                      onBook={handleBookingAction}
                      onCollapse={() => setIsMapPreviewExpanded(false)}
                      onExpand={() => setIsMapPreviewExpanded(true)}
                      onFavorite={handleToggleFavorite}
                      onView={handleViewProfile}
                      palette={palette}
                      styles={styles}
                    />
                  ) : null}
                </View>
              )}

              {activeView === "list" ? (
                <View style={styles.bottomSpacer} />
              ) : null}
            </ScrollView>

            {activeView === "list" ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View Guru map"
                onPress={() => {
                  setSelectedGuruId(mapPoints[0]?.id ?? selectedGuruId);
                  setActiveView("map");
                  setIsMapPreviewExpanded(false);
                  setHighlightedGuruId(null);
                  scrollRef.current?.scrollTo({ y: 0, animated: false });
                }}
                style={styles.floatingMapButton}
              >
                <MapIcon size={18} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.floatingMapButtonText}>View Map</Text>
              </Pressable>
            ) : null}

            <View style={styles.bottomNav}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/")}
                style={styles.navItem}
              >
                <SitGuruIcon
                  name="home"
                  size={22}
                  color={palette.navMuted}
                  strokeWidth={2.25}
                />
                <Text style={styles.navLabel}>Home</Text>
              </Pressable>

              <Pressable accessibilityRole="button" style={styles.navItem}>
                <SitGuruIcon
                  name="explore"
                  size={22}
                  color={palette.navActive}
                  strokeWidth={2.6}
                />
                <Text style={styles.navLabelActive}>Explore</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/request-booking")}
                style={styles.navItem}
              >
                <SitGuruIcon
                  name="bookings"
                  size={22}
                  color={palette.navMuted}
                  strokeWidth={2.25}
                />
                <Text style={styles.navLabel}>Bookings</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/messages")}
                style={styles.navItem}
              >
                <SitGuruIcon
                  name="messages"
                  size={22}
                  color={palette.navMuted}
                  strokeWidth={2.25}
                />
                <Text style={styles.navLabel}>Messages</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/login")}
                style={styles.navItem}
              >
                <SitGuruIcon
                  name="profile"
                  size={22}
                  color={palette.navMuted}
                  strokeWidth={2.25}
                />
                <Text style={styles.navLabel}>Profile</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.homeIndicator} />
        </View>
      </View>
    </SitGuruScreen>
  );
}


function GuruDiscoveryCard({
  favoriteGuruIds,
  guru,
  homeLocation,
  index,
  onBook,
  onFavorite,
  onView,
  palette,
  styles,
}: {
  favoriteGuruIds: string[];
  guru: PublicGuruProfile;
  homeLocation: HomeLocation | null;
  index: number;
  onBook: (guru: PublicGuruProfile) => void;
  onFavorite: (guru: PublicGuruProfile) => void;
  onView: (guru: PublicGuruProfile) => void;
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
}) {
  const name = getGuruDisplayName(guru);
  const photoUrl = resolveSupabaseStorageUrl(getGuruPhotoUrl(guru));
  const isFavorite = favoriteGuruIds.includes(String(guru.id));
  const preview = isKnownPreviewGuru(guru);
  const bookable = isGuruBookable(guru);
  const chips = getGuruServices(guru).slice(0, 4);
  const distanceLabel = getGuruDistanceLabel(guru, homeLocation, index);
  const locationLabel = getGuruCityStateLabel(guru);
  const ratingLabel = getGuruCardRatingLabel(guru);
  const reviewCount = getGuruReviewCount(guru);
  const rate = formatCompactRate(getGuruRateLabel(guru));
  const badgeLabel = getGuruCardBadgeLabel(guru);
  const trustLabel = getGuruCardTrustLabel(guru);
  const bio = getGuruCardBio(guru);
  const actionLabel = preview
    ? "View Profile Preview"
    : bookable
      ? "Request Booking"
      : "Message Guru";

  return (
    <View style={styles.guruProfileCard}>
      <Pressable
        accessibilityLabel={`View ${name} profile`}
        accessibilityRole="button"
        onPress={() => onView(guru)}
        style={styles.guruProfilePhotoButton}
      >
        <GuruCardHeroImage photoUrl={photoUrl} styles={styles} />
        <View pointerEvents="none" style={styles.guruProfilePhotoShade} />
      </Pressable>

      <Pressable
        accessibilityLabel={
          isFavorite
            ? `Remove ${name} from favorite Gurus`
            : `Save ${name} as a favorite Guru`
        }
        accessibilityRole="button"
        accessibilityState={{ selected: isFavorite }}
        hitSlop={8}
        onPress={() => onFavorite(guru)}
        style={[
          styles.guruProfileFavoriteButton,
          isFavorite && styles.guruProfileFavoriteButtonSaved,
        ]}
      >
        <Heart
          color={isFavorite ? palette.favoriteRed : "#123F31"}
          fill={isFavorite ? palette.favoriteRed : "transparent"}
          size={19}
          strokeWidth={2.35}
        />
      </Pressable>

      <View style={styles.guruProfilePanel}>
        <View style={styles.guruProfileBadge}>
          <Text style={styles.guruProfileBadgeText}>{badgeLabel}</Text>
        </View>

        <Pressable
          accessibilityLabel={`Open ${name} profile details`}
          accessibilityRole="button"
          onPress={() => onView(guru)}
          style={styles.guruProfileContentButton}
        >
          <View style={styles.guruProfileNameRow}>
            <View style={styles.guruProfileNameCopy}>
              <Text numberOfLines={1} style={styles.guruProfileName}>
                {name}
              </Text>
              <Text numberOfLines={1} style={styles.guruProfileLocation}>
                {locationLabel} • {distanceLabel}
              </Text>
            </View>

            <Text numberOfLines={1} style={styles.guruProfileRate}>
              {rate}
            </Text>
          </View>

          <View style={styles.guruProfileRatingRow}>
            <Star
              color={palette.gold}
              fill={palette.gold}
              size={13}
              strokeWidth={2.1}
            />
            <Text style={styles.guruProfileRatingValue}>{ratingLabel}</Text>
            <Text style={styles.guruProfileReviewText}>
              {reviewCount > 0
                ? `${reviewCount.toLocaleString()} ${
                    reviewCount === 1 ? "review" : "reviews"
                  }`
                : "New to SitGuru"}
            </Text>
          </View>

          <View style={styles.guruProfileServices}>
            {chips.map((chip, chipIndex) => (
              <View
                key={`${String(guru.id)}-${chip}-${chipIndex}`}
                style={styles.guruProfileServicePill}
              >
                <PawPrint
                  color="#D7EEDF"
                  size={9}
                  strokeWidth={2.5}
                />
                <Text numberOfLines={1} style={styles.guruProfileServiceText}>
                  {shortenServiceLabel(chip)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.guruProfileAboutBlock}>
            <Text style={styles.guruProfileAboutLabel}>About</Text>
            <Text numberOfLines={2} style={styles.guruProfileAboutText}>
              {bio}
            </Text>
          </View>

          <View style={styles.guruProfileTrustRow}>
            <ShieldCheck
              color="#78D990"
              size={15}
              strokeWidth={2.5}
            />
            <Text style={styles.guruProfileTrustText}>{trustLabel}</Text>
          </View>
        </Pressable>

        <Pressable
          accessibilityLabel={`${actionLabel} with ${name}`}
          accessibilityRole="button"
          onPress={() => onBook(guru)}
          style={({ pressed }) => [
            styles.guruProfileRequestButton,
            !bookable && !preview && styles.guruProfileRequestButtonSecondary,
            pressed && styles.guruProfileRequestButtonPressed,
          ]}
        >
          <Text
            style={[
              styles.guruProfileRequestButtonText,
              !bookable &&
                !preview &&
                styles.guruProfileRequestButtonTextSecondary,
            ]}
          >
            {actionLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function MapGuruPreviewCard({
  expanded,
  favoriteGuruIds,
  guru,
  homeLocation,
  onBook,
  onCollapse,
  onExpand,
  onFavorite,
  onView,
  palette,
  styles,
}: {
  expanded: boolean;
  favoriteGuruIds: string[];
  guru: PublicGuruProfile;
  homeLocation: HomeLocation | null;
  onBook: (guru: PublicGuruProfile) => void;
  onCollapse: () => void;
  onExpand: () => void;
  onFavorite: (guru: PublicGuruProfile) => void;
  onView: (guru: PublicGuruProfile) => void;
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
}) {
  const name = getGuruDisplayName(guru);
  const photoUrl = resolveSupabaseStorageUrl(getGuruPhotoUrl(guru));
  const isFavorite = favoriteGuruIds.includes(String(guru.id));
  const preview = isKnownPreviewGuru(guru);
  const serviceMiles = getGuruServiceRadiusMiles(guru);
  const chips = getGuruServices(guru).slice(0, 3);
  const rate = formatCompactRate(getGuruRateLabel(guru));
  const distanceLabel = getGuruDistanceLabel(guru, homeLocation, 0);
  const locationLabel = getGuruCityStateLabel(guru);

  if (!expanded) {
    return (
      <View style={styles.mapGuruPreviewCompact}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Expand ${name} preview`}
          onPress={onExpand}
          style={styles.mapGuruPreviewCompactMain}
        >
          <View style={styles.mapCompactAvatarWrap}>
            <GuruAvatarImage
              photoUrl={photoUrl}
              style={styles.mapPreviewAvatarImage}
            />
          </View>

          <View style={styles.mapGuruPreviewMain}>
            <Text style={styles.mapGuruPreviewName} numberOfLines={1}>
              {name}
            </Text>

            <View style={styles.ratingRow}>
              <Text style={styles.ratingValue}>{getGuruRatingLabel(guru)}</Text>
              <Star
                size={13}
                color={palette.gold}
                fill={palette.gold}
                strokeWidth={2.1}
              />
            </View>

            <Text style={styles.mapGuruPreviewLocation} numberOfLines={1}>
              {locationLabel}
            </Text>

            <Text style={styles.mapGuruPreviewMeta} numberOfLines={1}>
              {distanceLabel} • Serves up to {serviceMiles} mi
            </Text>
          </View>
        </Pressable>

        <View style={styles.mapGuruPreviewCompactRight}>
          <Pressable
            accessibilityRole="button"
            onPress={() => onFavorite(guru)}
            style={[
              styles.favoriteButton,
              isFavorite && styles.favoriteButtonSaved,
            ]}
          >
            <Heart
              size={22}
              color={palette.favoriteRed}
              fill={isFavorite ? palette.favoriteRed : "transparent"}
              strokeWidth={2.2}
            />
          </Pressable>
          <Text style={styles.mapGuruPreviewRate}>{rate}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mapGuruPreviewExpanded}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Collapse Guru preview"
        onPress={onCollapse}
        style={styles.mapSheetGrabberButton}
      >
        <View style={styles.mapSheetGrabber} />
      </Pressable>

      <View style={styles.mapGuruExpandedTop}>
        <View style={styles.mapExpandedAvatarWrap}>
          <GuruAvatarImage
            photoUrl={photoUrl}
            style={styles.mapPreviewAvatarImage}
          />
        </View>

        <View style={styles.mapGuruExpandedMain}>
          <View style={styles.mapGuruExpandedNameRow}>
            <Text style={styles.mapGuruExpandedName} numberOfLines={1}>
              {name}
            </Text>
            <View style={styles.topGuruBadge}>
              <Text style={styles.topGuruBadgeText}>
                {preview ? "Preview" : "Top Guru"}
              </Text>
            </View>
          </View>

          <View style={styles.ratingRow}>
            <Text style={styles.mapExpandedRating}>
              {getGuruRatingLabel(guru)}
            </Text>
            <Star
              size={15}
              color={palette.gold}
              fill={palette.gold}
              strokeWidth={2.1}
            />
          </View>

          <View style={styles.mapExpandedLocationRow}>
            <MapPin size={12} color={palette.muted} strokeWidth={2.2} />
            <Text style={styles.mapExpandedLocation} numberOfLines={1}>
              {locationLabel}
            </Text>
          </View>

          <Text style={styles.mapExpandedDistance}>
            {distanceLabel} from you
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => onFavorite(guru)}
          style={[
            styles.favoriteButtonLarge,
            isFavorite && styles.favoriteButtonSaved,
          ]}
        >
          <Heart
            size={24}
            color={palette.favoriteRed}
            fill={isFavorite ? palette.favoriteRed : palette.favoriteRed}
            strokeWidth={2.2}
          />
        </Pressable>
      </View>

      <View style={styles.mapExpandedServices}>
        {chips.map((chip) => (
          <View key={chip} style={styles.mapExpandedServiceItem}>
            <View style={styles.mapExpandedServiceDot} />
            <Text style={styles.mapExpandedServiceText}>
              {shortenServiceLabel(chip)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.mapExpandedRadiusPill}>
        <MapPin size={12} color={palette.primary} strokeWidth={2.3} />
        <Text style={styles.mapExpandedRadiusText}>
          Serves up to {serviceMiles} miles
        </Text>
      </View>

      <View style={styles.mapExpandedDivider} />

      <View style={styles.mapExpandedActionRow}>
        <Text style={styles.mapExpandedPrice}>{rate}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => onView(guru)}
          style={styles.mapExpandedViewButton}
        >
          <Text style={styles.mapExpandedViewButtonText}>View Profile</Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => onBook(guru)}
        style={styles.mapExpandedRequestButton}
      >
        <Text style={styles.mapExpandedRequestButtonText}>Request Care</Text>
      </Pressable>
    </View>
  );
}

function CoverageMap({
  fillScreen = false,
  highlightedGuruId,
  isDark,
  mapPoints,
  mapRegion,
  onMarkerLeave,
  onMarkerOpen,
  onMarkerPress,
  onRegionChange,
  palette,
  styles,
  userCoordinate,
}: {
  fillScreen?: boolean;
  highlightedGuruId: string | null;
  isDark: boolean;
  mapPoints: GuruMapPoint[];
  mapRegion: MapRegion;
  onMarkerLeave: () => void;
  onMarkerOpen: (guru: PublicGuruProfile) => void;
  onMarkerPress: (guru: PublicGuruProfile) => void;
  onRegionChange: (region: MapRegion) => void;
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
  userCoordinate: MapCoordinate | null;
}) {
  if (Platform.OS === "web") {
    return (
      <WebCoverageMap
        fillScreen={fillScreen}
        highlightedGuruId={highlightedGuruId}
        isDark={isDark}
        mapPoints={mapPoints}
        mapRegion={mapRegion}
        onMarkerLeave={onMarkerLeave}
        onMarkerOpen={onMarkerOpen}
        onMarkerPress={onMarkerPress}
        onRegionChange={onRegionChange}
        palette={palette}
        styles={styles}
        userCoordinate={userCoordinate}
      />
    );
  }

  if (NativeMapView && NativeMarker) {
    return (
      <View
        style={[styles.nativeMapWrap, fillScreen && styles.nativeMapWrapFull]}
      >
        <NativeMapView
          region={mapRegion}
          onRegionChangeComplete={onRegionChange}
          style={styles.nativeMap}
          scrollEnabled
          zoomEnabled
          pitchEnabled={false}
          rotateEnabled={false}
          customMapStyle={palette.nativeMapStyle}
        >
          {userCoordinate ? (
            <NativeMarker coordinate={userCoordinate} tracksViewChanges={false}>
              <View style={styles.nativeUserMarkerHalo}>
                <View style={styles.nativeUserMarkerDot} />
              </View>
            </NativeMarker>
          ) : null}

          {mapPoints.map((point) => {
            const isHighlighted = highlightedGuruId === point.id;

            return (
              <NativeMarker
                key={point.id}
                coordinate={point.coordinate}
                title={point.name}
                description={`${point.city}, ${point.stateCode} • ${point.radiusMiles} mile service area`}
                onPress={() => onMarkerOpen(point.guru)}
              >
                <View
                  style={[
                    styles.nativeMarker,
                    isHighlighted && styles.nativeMarkerHighlighted,
                  ]}
                >
                  <GuruAvatarImage
                    photoUrl={point.photoUrl}
                    style={styles.nativeMarkerImage}
                  />
                </View>
              </NativeMarker>
            );
          })}
        </NativeMapView>
      </View>
    );
  }

  return (
    <View
      style={[styles.mapUnavailable, fillScreen && styles.nativeMapWrapFull]}
    >
      <Text style={styles.mapUnavailableTitle}>Map unavailable</Text>
      <Text style={styles.mapUnavailableText}>
        Install react-native-maps for native builds and maplibre-gl for web.
      </Text>
    </View>
  );
}

function WebCoverageMap({
  fillScreen,
  highlightedGuruId,
  isDark,
  mapPoints,
  mapRegion,
  onMarkerLeave,
  onMarkerOpen,
  onMarkerPress,
  onRegionChange,
  palette,
  styles,
  userCoordinate,
}: {
  fillScreen: boolean;
  highlightedGuruId: string | null;
  isDark: boolean;
  mapPoints: GuruMapPoint[];
  mapRegion: MapRegion;
  onMarkerLeave: () => void;
  onMarkerOpen: (guru: PublicGuruProfile) => void;
  onMarkerPress: (guru: PublicGuruProfile) => void;
  onRegionChange: (region: MapRegion) => void;
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
  userCoordinate: MapCoordinate | null;
}) {
  const containerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const mapLibreRef = useRef<any>(null);
  const readyMapRef = useRef<any>(null);
  const viewportRef = useRef<MapRegion>(mapRegion);
  const guruMarkersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const callbacksRef = useRef({
    onMarkerLeave,
    onMarkerOpen,
    onMarkerPress,
    onRegionChange,
  });
  const [mapReadyVersion, setMapReadyVersion] = useState(0);

  useEffect(() => {
    callbacksRef.current = {
      onMarkerLeave,
      onMarkerOpen,
      onMarkerPress,
      onRegionChange,
    };
  }, [onMarkerLeave, onMarkerOpen, onMarkerPress, onRegionChange]);

  useEffect(() => {
    if (Platform.OS !== "web" || !containerRef.current) return undefined;

    let disposed = false;
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

    // A theme change creates a new MapLibre map. Reset the ready-map guard
    // immediately so effects from the previous map cannot add layers to the
    // new map before its style has finished loading.
    readyMapRef.current = null;
    setMapReadyVersion(0);

    try {
      ensureMapLibreCss();
      const maplibregl = require("maplibre-gl");
      mapLibreRef.current = maplibregl;

      const initialRegion = viewportRef.current ?? mapRegion;
      const map = new maplibregl.Map({
        attributionControl: false,
        center: [initialRegion.longitude, initialRegion.latitude],
        container: containerRef.current,
        maxZoom: 18,
        minZoom: 3,
        pitchWithRotate: false,
        dragRotate: false,
        style: isDark ? WEB_MAP_STYLE_DARK : WEB_MAP_STYLE_LIGHT,
        zoom: regionToWebZoom(initialRegion),
      });

      mapRef.current = map;

      const markMapReady = () => {
        if (disposed || mapRef.current !== map || !map.isStyleLoaded()) return;

        readyMapRef.current = map;
        setMapReadyVersion((version) => version + 1);
        resizeTimeout = setTimeout(() => {
          if (!disposed && mapRef.current === map) map.resize();
        }, 0);
      };

      // Wait for MapLibre's idle event. It fires only after the new style,
      // sources, tiles, and initial render have settled. This avoids the
      // "Style is not done loading" race during light/dark theme changes.
      map.once("idle", markMapReady);

      map.on("moveend", () => {
        if (disposed || mapRef.current !== map) return;

        const bounds = map.getBounds();
        const center = map.getCenter();

        // Keep the user's current web-map viewport inside the map component.
        // Do not write every pan/zoom back into React state: doing that makes
        // the controlled mapRegion effect call easeTo(), which emits moveend,
        // which updates state again and causes a maximum-update-depth loop.
        viewportRef.current = {
          latitude: center.lat,
          longitude: center.lng,
          latitudeDelta: Math.max(0.01, bounds.getNorth() - bounds.getSouth()),
          longitudeDelta: Math.max(0.01, bounds.getEast() - bounds.getWest()),
        };
      });
    } catch (error) {
      console.error("SITGURU WEB MAP ERROR:", error);
    }

    return () => {
      disposed = true;
      if (resizeTimeout) clearTimeout(resizeTimeout);
      guruMarkersRef.current.forEach((marker) => marker.remove());
      guruMarkersRef.current = [];
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      if (readyMapRef.current === mapRef.current) {
        readyMapRef.current = null;
      }
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [isDark]);

  useEffect(() => {
    const map = mapRef.current;
    if (
      !map ||
      !mapReadyVersion ||
      readyMapRef.current !== map ||
      !map.isStyleLoaded()
    ) {
      return;
    }

    const currentCenter = map.getCenter();
    const targetZoom = regionToWebZoom(mapRegion);
    const centerChanged =
      Math.abs(currentCenter.lat - mapRegion.latitude) > 0.0005 ||
      Math.abs(currentCenter.lng - mapRegion.longitude) > 0.0005;
    const zoomChanged = Math.abs(map.getZoom() - targetZoom) > 0.05;

    if (centerChanged || zoomChanged) {
      viewportRef.current = mapRegion;
      map.easeTo({
        center: [mapRegion.longitude, mapRegion.latitude],
        duration: 350,
        zoom: targetZoom,
      });
    }
  }, [
    mapReadyVersion,
    mapRegion.latitude,
    mapRegion.longitude,
    mapRegion.latitudeDelta,
    mapRegion.longitudeDelta,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = mapLibreRef.current;
    let cancelled = false;

    if (
      !map ||
      !maplibregl ||
      !mapReadyVersion ||
      readyMapRef.current !== map
    ) {
      return undefined;
    }

    const applyMapData = () => {
      if (
        cancelled ||
        mapRef.current !== map ||
        readyMapRef.current !== map ||
        !map.isStyleLoaded()
      ) {
        return;
      }

      try {
        guruMarkersRef.current.forEach((marker) => marker.remove());
        guruMarkersRef.current = mapPoints.map((point) => {
          const markerElement = createWebGuruMarkerElement({
            highlighted: highlightedGuruId === point.id,
            point,
            palette,
          });

          markerElement.addEventListener("click", (event: Event) => {
            event.stopPropagation();
            callbacksRef.current.onMarkerOpen(point.guru);
          });

          return new maplibregl.Marker({
            anchor: "center",
            element: markerElement,
          })
            .setLngLat([point.coordinate.longitude, point.coordinate.latitude])
            .addTo(map);
        });

        userMarkerRef.current?.remove();
        userMarkerRef.current = null;

        if (userCoordinate) {
          const userElement = createWebUserLocationElement();
          userMarkerRef.current = new maplibregl.Marker({
            anchor: "center",
            element: userElement,
          })
            .setLngLat([userCoordinate.longitude, userCoordinate.latitude])
            .addTo(map);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error ?? "");

        if (!cancelled && /style is not done loading/i.test(message)) {
          map.once("idle", applyMapData);
          return;
        }

        console.error("SITGURU WEB MAP DATA ERROR:", error);
      }
    };

    if (map.isStyleLoaded()) {
      applyMapData();
    } else {
      map.once("idle", applyMapData);
    }

    return () => {
      cancelled = true;
      map.off("idle", applyMapData);
    };
  }, [
    highlightedGuruId,
    mapPoints,
    mapReadyVersion,
    palette.favoriteRed,
    palette.primaryDark,
    userCoordinate?.latitude,
    userCoordinate?.longitude,
  ]);

  return (
    <View style={[styles.webMapWrap, fillScreen && styles.nativeMapWrapFull]}>
      <View ref={containerRef} style={styles.webMapCanvas} />
      <Text pointerEvents="none" style={styles.mapAttribution}>
        © OpenStreetMap • OpenFreeMap
      </Text>
    </View>
  );
}

function ensureMapLibreCss() {
  const documentRef = (globalThis as any).document;
  if (!documentRef || documentRef.getElementById(WEB_MAPLIBRE_CSS_ID)) return;

  const link = documentRef.createElement("link");
  link.id = WEB_MAPLIBRE_CSS_ID;
  link.rel = "stylesheet";
  link.href = WEB_MAPLIBRE_CSS_URL;
  documentRef.head.appendChild(link);
}

function createWebGuruMarkerElement({
  highlighted,
  point,
  palette,
}: {
  highlighted: boolean;
  point: GuruMapPoint;
  palette: ReturnType<typeof getPalette>;
}) {
  const documentRef = (globalThis as any).document;
  const element = documentRef.createElement("button");
  const size = highlighted ? 50 : 42;

  element.type = "button";
  element.setAttribute("aria-label", `Open ${point.name}`);
  element.style.alignItems = "center";
  element.style.background = "#FFFFFF";
  element.style.border = `${highlighted ? 3 : 2}px solid ${
    highlighted ? palette.primary : "#35C98A"
  }`;
  element.style.borderRadius = "999px";
  element.style.boxShadow = "0 5px 14px rgba(0, 0, 0, 0.22)";
  element.style.cursor = "pointer";
  element.style.display = "flex";
  element.style.height = `${size}px`;
  element.style.justifyContent = "center";
  element.style.overflow = "hidden";
  element.style.padding = "0";
  element.style.transition =
    "width 140ms ease, height 140ms ease, border 140ms ease";
  element.style.width = `${size}px`;

  const image = documentRef.createElement("img");
  image.alt = point.name;
  image.draggable = false;
  image.src = point.photoUrl || SITGURU_FALLBACK_AVATAR_URI;
  image.onerror = () => {
    image.onerror = null;
    if (SITGURU_FALLBACK_AVATAR_URI) {
      image.src = SITGURU_FALLBACK_AVATAR_URI;
    }
  };
  image.style.height = "100%";
  image.style.objectFit = "cover";
  image.style.width = "100%";
  element.appendChild(image);

  return element;
}

function createWebUserLocationElement() {
  const documentRef = (globalThis as any).document;
  const halo = documentRef.createElement("div");
  const dot = documentRef.createElement("div");

  halo.style.alignItems = "center";
  halo.style.background = "rgba(47, 128, 237, 0.24)";
  halo.style.borderRadius = "999px";
  halo.style.display = "flex";
  halo.style.height = "30px";
  halo.style.justifyContent = "center";
  halo.style.width = "30px";

  dot.style.background = "#2F80ED";
  dot.style.border = "2px solid #FFFFFF";
  dot.style.borderRadius = "999px";
  dot.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
  dot.style.height = "14px";
  dot.style.width = "14px";
  halo.appendChild(dot);

  return halo;
}

function regionToWebZoom(region: MapRegion) {
  return clampNumber(
    Math.log2(360 / Math.max(0.01, region.longitudeDelta)),
    3,
    18,
  );
}

async function loadSavedHomeLocation(): Promise<HomeLocation | null> {
  const localLocation = readHomeLocation();

  if (!isSupabaseConfigured) {
    return localLocation;
  }

  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      return localLocation;
    }

    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const metadataZip = getFirstString(metadata, [
      "home_zip_code",
      "home_zip",
      "zip_code",
      "zip",
      "postal_code",
    ])
      .replace(/\D/g, "")
      .slice(0, 5);

    if (metadataZip.length === 5) {
      const metadataCity = getFirstString(metadata, ["home_city", "city"]);
      const metadataState = getFirstString(metadata, [
        "home_state",
        "state",
        "state_code",
      ]).toUpperCase();
      const coordinate = ZIP_COORDS[metadataZip];

      if (metadataCity && metadataState) {
        const location: HomeLocation = {
          zipCode: metadataZip,
          city: metadataCity,
          stateCode: metadataState.slice(0, 2),
          latitude: coordinate?.latitude ?? null,
          longitude: coordinate?.longitude ?? null,
        };
        writeHomeLocation(location);
        return location;
      }

      const resolved = await resolveHomeLocation(metadataZip);
      if (resolved) {
        writeHomeLocation(resolved);
        return resolved;
      }
    }

    try {
      const profileResult = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!profileResult.error && profileResult.data) {
        const profile = profileResult.data as Record<string, unknown>;
        const profileZip = getFirstString(profile, [
          "home_zip_code",
          "home_zip",
          "zip_code",
          "zip",
          "postal_code",
        ])
          .replace(/\D/g, "")
          .slice(0, 5);

        if (profileZip.length === 5) {
          const resolved = await resolveHomeLocation(profileZip);
          if (resolved) {
            writeHomeLocation(resolved);
            return resolved;
          }
        }
      }
    } catch {
      // Profile lookup is optional because account metadata is the primary store.
    }
  } catch {
    return localLocation;
  }

  return localLocation;
}

async function saveHomeLocationToAccount(location: HomeLocation) {
  if (!isSupabaseConfigured) return;

  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;

    await supabase.auth.updateUser({
      data: {
        home_zip_code: location.zipCode,
        home_city: location.city,
        home_state: location.stateCode,
      },
    });

    try {
      const profileResult = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!profileResult.error && profileResult.data) {
        const profile = profileResult.data as Record<string, unknown>;
        const profileUpdates: Record<string, string> = {};

        const zipField = [
          "home_zip_code",
          "home_zip",
          "zip_code",
          "zip",
          "postal_code",
        ].find((field) => field in profile);
        const cityField = ["home_city", "city"].find(
          (field) => field in profile,
        );
        const stateField = ["home_state", "state", "state_code"].find(
          (field) => field in profile,
        );

        if (zipField) profileUpdates[zipField] = location.zipCode;
        if (cityField) profileUpdates[cityField] = location.city;
        if (stateField) profileUpdates[stateField] = location.stateCode;

        if (Object.keys(profileUpdates).length > 0) {
          await supabase
            .from("profiles")
            .update(profileUpdates)
            .eq("id", user.id);
        }
      }
    } catch {
      // Account metadata remains the primary source if the profile table differs.
    }
  } catch {
    // Local storage still preserves the preference on web if account sync fails.
  }
}

async function resolveHomeLocation(
  zipCode: string,
): Promise<HomeLocation | null> {
  const normalizedZip = zipCode.replace(/\D/g, "").slice(0, 5);
  if (normalizedZip.length !== 5) return null;

  const localMatch = getLocalZipLocation(normalizedZip);

  try {
    const response = await fetch(
      `https://api.zippopotam.us/us/${normalizedZip}`,
    );

    if (response.ok) {
      const payload = (await response.json()) as {
        places?: Array<{
          "place name"?: string;
          "state abbreviation"?: string;
          latitude?: string;
          longitude?: string;
        }>;
      };
      const place = payload.places?.[0];

      if (place?.["place name"] && place["state abbreviation"]) {
        const latitude = Number.parseFloat(place.latitude ?? "");
        const longitude = Number.parseFloat(place.longitude ?? "");

        return {
          zipCode: normalizedZip,
          city: place["place name"],
          stateCode: place["state abbreviation"].toUpperCase(),
          latitude: Number.isFinite(latitude)
            ? latitude
            : (localMatch?.latitude ?? null),
          longitude: Number.isFinite(longitude)
            ? longitude
            : (localMatch?.longitude ?? null),
        };
      }
    }
  } catch {
    // Use the local city and coordinate fallback when the lookup service is offline.
  }

  return localMatch;
}

function getLocalZipLocation(zipCode: string): HomeLocation | null {
  for (const [cityStateKey, zipCodes] of Object.entries(localZipHints)) {
    if (!zipCodes.includes(zipCode)) continue;

    const stateCode = cityStateKey.slice(-2).toUpperCase();
    const city = cityStateKey
      .slice(0, -3)
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
    const coordinate = ZIP_COORDS[zipCode] ?? CITY_COORDS[cityStateKey];

    return {
      zipCode,
      city,
      stateCode,
      latitude: coordinate?.latitude ?? null,
      longitude: coordinate?.longitude ?? null,
    };
  }

  const coordinate = ZIP_COORDS[zipCode];
  if (!coordinate) return null;

  return {
    zipCode,
    city: "Home area",
    stateCode: "",
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
  };
}

function formatHomeLocation(location: HomeLocation) {
  const cityState = [location.city, location.stateCode]
    .filter(Boolean)
    .join(", ");
  return cityState ? `${location.zipCode} (${cityState})` : location.zipCode;
}

function readHomeLocation(): HomeLocation | null {
  try {
    const storage = getBrowserStorage();
    if (!storage) return null;

    const rawValue = storage.getItem(HOME_LOCATION_STORAGE_KEY);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue) as Partial<HomeLocation>;
    const zipCode = String(parsed.zipCode ?? "")
      .replace(/\D/g, "")
      .slice(0, 5);

    if (zipCode.length !== 5) return null;

    return {
      zipCode,
      city: String(parsed.city ?? "").trim() || "Home area",
      stateCode: String(parsed.stateCode ?? "")
        .trim()
        .toUpperCase()
        .slice(0, 2),
      latitude:
        typeof parsed.latitude === "number" && Number.isFinite(parsed.latitude)
          ? parsed.latitude
          : null,
      longitude:
        typeof parsed.longitude === "number" &&
        Number.isFinite(parsed.longitude)
          ? parsed.longitude
          : null,
    };
  } catch {
    return null;
  }
}

function writeHomeLocation(location: HomeLocation) {
  try {
    const storage = getBrowserStorage();
    if (!storage) return;

    storage.setItem(HOME_LOCATION_STORAGE_KEY, JSON.stringify(location));
  } catch {
    // Account metadata still preserves the preference when browser storage fails.
  }
}

function readDiscoveryScope(): DiscoveryScope {
  try {
    const storage = getBrowserStorage();
    if (!storage) return "all";

    return storage.getItem(DISCOVERY_SCOPE_STORAGE_KEY) === "nearby"
      ? "nearby"
      : "all";
  } catch {
    return "all";
  }
}

function writeDiscoveryScope(scope: DiscoveryScope) {
  try {
    const storage = getBrowserStorage();
    if (!storage) return;

    storage.setItem(DISCOVERY_SCOPE_STORAGE_KEY, scope);
  } catch {
    // The current session still keeps the selected discovery scope.
  }
}

function getDistanceMiles(first: MapCoordinate, second: MapCoordinate) {
  const earthRadiusMiles = 3958.8;
  const latitudeDelta = degreesToRadians(second.latitude - first.latitude);
  const longitudeDelta = degreesToRadians(second.longitude - first.longitude);
  const firstLatitude = degreesToRadians(first.latitude);
  const secondLatitude = degreesToRadians(second.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(haversine));
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getGuruDistanceLabel(
  guru: PublicGuruProfile,
  homeLocation: HomeLocation | null,
  index: number,
) {
  if (
    homeLocation?.latitude !== null &&
    homeLocation?.latitude !== undefined &&
    homeLocation?.longitude !== null &&
    homeLocation?.longitude !== undefined
  ) {
    const distance = getDistanceMiles(
      {
        latitude: homeLocation.latitude,
        longitude: homeLocation.longitude,
      },
      getGuruCoordinate(guru, index),
    );

    if (distance < 1) return "Less than 1 mi away";
    return `${Math.max(1, Math.round(distance))} mi away`;
  }

  return `${index + 2} mi away`;
}


function getGuruCardRatingLabel(guru: PublicGuruProfile) {
  const record = guru as Record<string, unknown>;
  const rating = getFirstNumber(record, [
    "rating_avg",
    "average_rating",
    "rating",
    "review_rating",
  ]);

  if (rating !== null && rating > 0) {
    return rating.toFixed(1);
  }

  const fallback = getGuruRatingLabel(guru);
  const numericMatch = fallback.match(/[0-9]+(?:\.[0-9]+)?/);

  return numericMatch?.[0] ?? "New";
}

function getGuruReviewCount(guru: PublicGuruProfile) {
  const record = guru as Record<string, unknown>;
  const reviewCount = getFirstNumber(record, [
    "review_count",
    "reviews_count",
    "total_reviews",
    "rating_count",
  ]);

  return Math.max(0, Math.round(reviewCount ?? 0));
}

function getGuruCardBadgeLabel(guru: PublicGuruProfile) {
  if (isKnownPreviewGuru(guru)) {
    return "Profile Preview";
  }

  const record = guru as Record<string, unknown>;
  const rating = getFirstNumber(record, [
    "rating_avg",
    "average_rating",
    "rating",
    "review_rating",
  ]);
  const reviews = getGuruReviewCount(guru);

  if ((rating ?? 0) >= 4.8 && reviews >= 5) {
    return "Top Rated";
  }

  if (isGuruBookable(guru)) {
    return "Booking Ready";
  }

  return "Local Guru";
}

function getGuruCardTrustLabel(guru: PublicGuruProfile) {
  if (isKnownPreviewGuru(guru)) {
    return "Local Guru profile preview";
  }

  const record = guru as Record<string, unknown>;
  const backgroundCheckStatus = getFirstString(record, [
    "background_check_status",
    "background_status",
    "check_status",
  ]).toLowerCase();

  const backgroundCheckPassed = [
    record.background_checked,
    record.is_background_checked,
    record.background_check_complete,
    record.background_check_passed,
    record.background_check_verified,
  ].some(
    (value) =>
      value === true ||
      value === 1 ||
      value === "1" ||
      String(value).toLowerCase() === "true",
  );

  if (
    backgroundCheckPassed ||
    ["approved", "complete", "completed", "passed", "verified"].includes(
      backgroundCheckStatus,
    )
  ) {
    return "Background checked";
  }

  if (record.is_verified === true || record.verified === true) {
    return "Identity verified";
  }

  return isGuruBookable(guru)
    ? "Booking-ready SitGuru profile"
    : "Trust details available on profile";
}

function getGuruCardBio(guru: PublicGuruProfile) {
  const record = guru as Record<string, unknown>;

  return (
    getFirstString(record, [
      "bio",
      "about",
      "description",
      "profile_summary",
      "headline",
    ]) ||
    "Reliable local pet care with thoughtful updates, clear communication, and routines tailored to each pet."
  );
}

function formatCompactRate(rateLabel: string) {
  const normalized = rateLabel.replace(/\s+/g, " ").trim();
  const amountMatch = normalized.match(/\$?([0-9]+(?:\.[0-9]{1,2})?)/);

  if (!amountMatch) return normalized || "Rate shown on profile";

  const amount = amountMatch[1].replace(/\.00$/, "");
  return `$${amount}/hr`;
}

function readFavoriteGuruIds() {
  try {
    const storage = getBrowserStorage();
    if (!storage) return [];

    const rawValue = storage.getItem(FAVORITE_GURUS_STORAGE_KEY);
    if (!rawValue) return [];

    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) return [];

    return parsedValue.map((id) => String(id)).filter(Boolean);
  } catch {
    return [];
  }
}

function writeFavoriteGuruIds(favoriteGuruIds: string[]) {
  try {
    const storage = getBrowserStorage();
    if (!storage) return;

    storage.setItem(
      FAVORITE_GURUS_STORAGE_KEY,
      JSON.stringify(favoriteGuruIds),
    );
  } catch {
    // Favorite state still updates in session even if local storage is unavailable.
  }
}

function getBrowserStorage() {
  if (
    typeof globalThis !== "undefined" &&
    "localStorage" in globalThis &&
    globalThis.localStorage
  ) {
    return globalThis.localStorage;
  }

  return null;
}

function guruMatchesService(
  guru: PublicGuruProfile,
  selectedService: ServiceOption,
) {
  if (selectedService.value === "all") return true;

  const searchText = getGuruSearchText(guru);
  return selectedService.keywords.some((keyword) =>
    searchText.includes(keyword),
  );
}

function guruMatchesSearch(guru: PublicGuruProfile, searchQuery: string) {
  const tokens = tokenizeSearch(searchQuery);
  if (tokens.length === 0) return true;

  const searchText = getGuruSearchText(guru);
  const serviceText = getGuruServices(guru).join(" ").toLowerCase();

  return tokens.every((token) => {
    if (searchText.includes(token)) return true;

    const aliases = SEARCH_TOKEN_ALIASES[token] ?? [];
    return aliases.some(
      (alias) => searchText.includes(alias) || serviceText.includes(alias),
    );
  });
}

const SEARCH_TOKEN_ALIASES: Record<string, string[]> = {
  walk: ["walk", "walking"],
  walks: ["walk", "walking"],
  walking: ["walk", "walking"],
  sitter: ["sit", "sitting"],
  sitters: ["sit", "sitting"],
  sitting: ["sit", "sitting", "house sitting", "pet sitting"],
  dropin: ["drop-in", "drop in", "drop"],
  dropins: ["drop-in", "drop in", "drop"],
  boarding: ["board", "boarding"],
  daycare: ["day care", "daycare"],
  cats: ["cat", "cats", "feline"],
  dogs: ["dog", "dogs", "canine"],
};

function tokenizeSearch(searchQuery: string) {
  return searchQuery
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function getGuruSearchText(guru: PublicGuruProfile) {
  const record = guru as Record<string, unknown>;
  const city = getGuruCity(guru);
  const state = getGuruStateCode(guru);

  const parts = [
    getGuruDisplayName(guru),
    getGuruLocationLabel(guru),
    getGuruCityStateLabel(guru),
    STATE_COORDS[state]?.stateName ?? "",
    getGuruRateLabel(guru),
    getGuruRatingLabel(guru),
    getGuruBookingStatusLabel(guru),
    getGuruVisibilityLabel(guru),
    state,
    city,
    getGuruServices(guru).join(" "),
    getRecordText(record, [
      "zip",
      "zip_code",
      "service_zip",
      "service_zip_code",
      "postal_code",
      "service_postal_code",
      "service_area",
      "service_areas",
      "bio",
      "role",
      "display_name",
      "first_name",
      "last_name",
      "full_name",
      "city",
      "state",
      "service_city",
      "service_state",
    ]),
    getZipHints(city, state).join(" "),
  ];

  return parts.join(" ").toLowerCase();
}

function getGuruServices(guru: PublicGuruProfile) {
  const record = guru as Record<string, unknown>;
  const candidates = [
    record.services,
    record.service_types,
    record.offerings,
    record.specialties,
  ];

  const rawValues = candidates.flatMap((value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") return value.split(",");
    return [];
  });

  const cleaned = rawValues
    .map((value) => String(value).trim())
    .filter(Boolean);

  return cleaned.length > 0 ? cleaned : ["Walks", "Drop-ins", "Sitting"];
}

function getRecordText(record: Record<string, unknown>, keys: string[]) {
  return keys
    .map((key) => record[key])
    .flatMap((value) => {
      if (Array.isArray(value)) return value;
      return value;
    })
    .filter((value) => value !== null && value !== undefined)
    .map((value) => String(value))
    .join(" ");
}

function getZipHints(city: string, state: string) {
  const key = `${city} ${state}`.trim().toLowerCase();
  return localZipHints[key] ?? [];
}

function getGuruStateCode(guru: PublicGuruProfile) {
  const record = guru as Record<string, unknown>;
  const rawState =
    getFirstString(record, [
      "service_state",
      "state",
      "location_state",
      "primary_state",
    ]) || "PA";

  return rawState.trim().toUpperCase().slice(0, 2);
}

function getGuruCity(guru: PublicGuruProfile) {
  const record = guru as Record<string, unknown>;

  return (
    getFirstString(record, [
      "service_city",
      "city",
      "location_city",
      "primary_city",
    ]) || ""
  );
}

function getGuruCityStateLabel(guru: PublicGuruProfile) {
  const city = getGuruCity(guru);
  const state = getGuruStateCode(guru);

  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return STATE_COORDS[state]?.stateName ?? state;

  const fallback = getGuruLocationLabel(guru).trim();
  return fallback || "Location available on profile";
}

function getFirstString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function getGuruCoordinate(
  guru: PublicGuruProfile,
  index: number,
): MapCoordinate {
  return getGuruCoordinateDetails(guru, index).coordinate;
}

function getGuruCoordinateDetails(
  guru: PublicGuruProfile,
  index: number,
): {
  coordinate: MapCoordinate;
  quality: "exact" | "city" | "state";
} {
  const record = guru as Record<string, unknown>;
  const lat = getFirstNumber(record, [
    "latitude",
    "lat",
    "service_latitude",
    "service_lat",
    "location_latitude",
    "location_lat",
  ]);
  const lng = getFirstNumber(record, [
    "longitude",
    "lng",
    "lon",
    "service_longitude",
    "service_lng",
    "service_lon",
    "location_longitude",
    "location_lng",
    "location_lon",
  ]);

  if (lat !== null && lng !== null) {
    return {
      coordinate: { latitude: lat, longitude: lng },
      quality: "exact",
    };
  }

  const city = getGuruCity(guru);
  const state = getGuruStateCode(guru);
  const cityKey = `${city} ${state}`.trim().toLowerCase();
  const cityCoordinate = CITY_COORDS[cityKey];

  if (cityCoordinate) {
    return {
      coordinate: addSmallPinOffset(cityCoordinate, index, 0.008, 0.011),
      quality: "city",
    };
  }

  const stateCoordinate = STATE_COORDS[state] ?? STATE_COORDS.PA;

  return {
    coordinate: addSmallPinOffset(stateCoordinate, index, 0.08, 0.11),
    quality: "state",
  };
}

function getFirstNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number.parseFloat(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function addSmallPinOffset(
  coordinate: MapCoordinate,
  index: number,
  latitudeStep = 0.008,
  longitudeStep = 0.011,
) {
  const latOffset = ((index % 5) - 2) * latitudeStep;
  const lngOffset = (((index + 2) % 5) - 2) * longitudeStep;

  return {
    latitude: coordinate.latitude + latOffset,
    longitude: coordinate.longitude + lngOffset,
  };
}

function offsetCoordinateByMiles(
  coordinate: MapCoordinate,
  distanceMiles: number,
  bearingDegrees: number,
): MapCoordinate {
  const bearing = degreesToRadians(bearingDegrees);
  const latitudeMiles = distanceMiles * Math.cos(bearing);
  const longitudeMiles = distanceMiles * Math.sin(bearing);
  const milesPerLongitudeDegree = Math.max(
    1,
    69 * Math.cos(degreesToRadians(coordinate.latitude)),
  );

  return {
    latitude: coordinate.latitude + latitudeMiles / 69,
    longitude: coordinate.longitude + longitudeMiles / milesPerLongitudeDegree,
  };
}

function getGuruServiceRadiusMiles(guru: PublicGuruProfile) {
  const record = guru as Record<string, unknown>;
  const keys = [
    "service_radius_miles",
    "radius_miles",
    "travel_radius_miles",
    "coverage_miles",
    "service_radius",
  ];

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return Math.round(value);
    }

    if (typeof value === "string") {
      const parsed = Number.parseFloat(value);

      if (Number.isFinite(parsed) && parsed > 0) {
        return Math.round(parsed);
      }
    }
  }

  return isKnownPreviewGuru(guru) ? 20 : 15;
}

function getTargetMapRegion({
  discoveryScope,
  homeLocation,
  mapPoints,
  searchQuery,
}: {
  discoveryScope: DiscoveryScope;
  homeLocation: HomeLocation | null;
  mapPoints: GuruMapPoint[];
  searchQuery: string;
}) {
  const searchCenter = getSearchCenter(searchQuery);

  if (searchCenter) {
    return {
      latitude: searchCenter.latitude,
      longitude: searchCenter.longitude,
      latitudeDelta:
        searchCenter.zoom === "state"
          ? 3.2
          : searchCenter.zoom === "city"
            ? 0.55
            : 0.34,
      longitudeDelta:
        searchCenter.zoom === "state"
          ? 4.2
          : searchCenter.zoom === "city"
            ? 0.62
            : 0.38,
    };
  }

  if (searchQuery.trim() && mapPoints.length > 0) {
    return getRegionForMapPoints(mapPoints);
  }

  if (discoveryScope === "all") {
    return DEFAULT_US_REGION;
  }

  if (
    homeLocation &&
    homeLocation.latitude !== null &&
    homeLocation.longitude !== null
  ) {
    return {
      latitude: homeLocation.latitude,
      longitude: homeLocation.longitude,
      latitudeDelta: 0.48,
      longitudeDelta: 0.54,
    };
  }

  if (mapPoints.length > 0) {
    return getRegionForMapPoints(mapPoints);
  }

  return DEFAULT_US_REGION;
}

function resolveMapDiscoveryCenter({
  homeLocation,
  mapPoints,
  searchQuery,
}: {
  homeLocation: HomeLocation | null;
  mapPoints: GuruMapPoint[];
  searchQuery: string;
}): MapCoordinate | null {
  const searchCenter = getSearchCenter(searchQuery);

  if (searchCenter) {
    return {
      latitude: searchCenter.latitude,
      longitude: searchCenter.longitude,
    };
  }

  if (
    homeLocation?.latitude !== null &&
    homeLocation?.latitude !== undefined &&
    homeLocation?.longitude !== null &&
    homeLocation?.longitude !== undefined
  ) {
    return {
      latitude: homeLocation.latitude,
      longitude: homeLocation.longitude,
    };
  }

  return mapPoints[0]?.coordinate ?? null;
}

function getRegionForMapPoints(mapPoints: GuruMapPoint[]): MapRegion {
  const points = mapPoints.slice(0, 8);
  const latitudes = points.map((point) => point.coordinate.latitude);
  const longitudes = points.map((point) => point.coordinate.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta: clampNumber((maxLatitude - minLatitude) * 1.5, 0.35, 4),
    longitudeDelta: clampNumber((maxLongitude - minLongitude) * 1.5, 0.4, 5),
  };
}

function getSearchArea(searchQuery: string): {
  city: string;
  stateCode: string;
  zipCode: string;
} | null {
  const normalized = searchQuery.trim().toLowerCase();
  const zipCode = searchQuery.replace(/\D/g, "").slice(0, 5);

  if (zipCode.length === 5 && ZIP_COORDS[zipCode]) {
    for (const [cityStateKey, zipCodes] of Object.entries(localZipHints)) {
      if (!zipCodes.includes(zipCode)) continue;

      const parts = cityStateKey.split(" ");
      const stateCode = (parts.pop() || "").toUpperCase();
      const city = parts
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

      return { city, stateCode, zipCode };
    }

    return { city: `ZIP ${zipCode}`, stateCode: "", zipCode };
  }

  for (const cityKey of Object.keys(CITY_COORDS)) {
    const parts = cityKey.split(" ");
    const stateCode = (parts.pop() || "").toUpperCase();
    const cityWords = parts.join(" ");

    if (
      normalized === cityKey ||
      normalized.includes(cityKey) ||
      (normalized.includes(cityWords) &&
        normalized.includes(stateCode.toLowerCase()))
    ) {
      return {
        city: cityWords
          .split(" ")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
        stateCode,
        zipCode: "",
      };
    }
  }

  for (const [stateCode, state] of Object.entries(STATE_COORDS)) {
    if (
      normalized === stateCode.toLowerCase() ||
      normalized === state.stateName.toLowerCase()
    ) {
      return { city: "Statewide", stateCode, zipCode: "" };
    }
  }

  return null;
}

function getSearchCenter(searchQuery: string) {
  const normalized = searchQuery.trim().toLowerCase();
  const zip = searchQuery.replace(/\D/g, "").slice(0, 5);

  if (zip.length === 5 && ZIP_COORDS[zip]) {
    return {
      ...ZIP_COORDS[zip],
      zoom: "zip" as const,
    };
  }

  for (const [cityKey, coordinate] of Object.entries(CITY_COORDS)) {
    if (normalized.includes(cityKey)) {
      return {
        ...coordinate,
        zoom: "city" as const,
      };
    }

    const [city, state] = cityKey.split(" ");

    if (normalized.includes(city) && normalized.includes(state)) {
      return {
        ...coordinate,
        zoom: "city" as const,
      };
    }
  }

  for (const [stateCode, state] of Object.entries(STATE_COORDS)) {
    if (
      normalized === stateCode.toLowerCase() ||
      normalized === state.stateName.toLowerCase() ||
      normalized.includes(state.stateName.toLowerCase())
    ) {
      return {
        latitude: state.latitude,
        longitude: state.longitude,
        zoom: "state" as const,
      };
    }
  }

  return null;
}

function shortenServiceLabel(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("walking") || normalized.includes("walk"))
    return "Walks";
  if (normalized.includes("drop")) return "Drop-ins";
  if (normalized.includes("boarding")) return "Boarding";
  if (normalized.includes("sitting")) return "Sitting";
  if (normalized.includes("day care")) return "Day care";
  if (normalized.includes("cats")) return "Cats";

  return label.length > 13 ? `${label.slice(0, 12)}…` : label;
}


function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPalette(isDark: boolean) {
  return {
    bg: isDark ? "#06140F" : "#FFF8EF",
    shell: isDark ? "#071C14" : "#FFFCF7",
    card: isDark ? "#0C261B" : "#FFFDF8",
    cardSoft: isDark ? "#102F22" : "#FFF6EA",
    cardAlt: isDark ? "#0F2A1F" : "#F8F0E3",
    border: isDark ? "#28573F" : "#EEDFCB",
    borderSoft: isDark ? "#214634" : "#F0E1CE",
    title: isDark ? "#FFF3E2" : "#0A573B",
    text: isDark ? "#E9E4D6" : "#163D31",
    muted: isDark ? "#AAB8AF" : "#6F7B73",
    placeholder: isDark ? "#809187" : "#9A9A90",
    primary: "#0B6B45",
    primaryDark: "#074D36",
    greenBright: "#39D982",
    gold: "#F5B638",
    heart: isDark ? "#F0CF62" : "#7FA35C",
    favoriteRed: "#F05252",
    favoriteRedSoft: isDark ? "rgba(240, 82, 82, 0.16)" : "#FFE7E7",
    navActive: isDark ? "#39D982" : "#0B6B45",
    navMuted: isDark ? "#A7B5AC" : "#6F7B73",
    disabledBg: isDark ? "#173324" : "#F1EADB",
    disabledText: isDark ? "#AEB9AF" : "#657068",
    frame: "#121714",
    frameBorder: "#2D3430",
    mapWater: isDark ? "#0B282A" : "#BFE4EA",
    mapLand: isDark ? "#173125" : "#F4F1E4",
    mapLandAlt: isDark ? "#1C392B" : "#E7EFD7",
    mapGuide: isDark ? "rgba(22, 63, 47, 0.12)" : "rgba(29, 76, 58, 0.1)",
    mapStateLine: isDark ? "rgba(43, 87, 65, 0.22)" : "rgba(48, 94, 71, 0.22)",
    nativeMapStyle: isDark ? DARK_NATIVE_MAP_STYLE : [],
  };
}

function createStyles(isDark: boolean) {
  const palette = getPalette(isDark);

  return StyleSheet.create({
    previewCanvas: {
      alignItems: "center",
      minHeight: "100%",
      paddingHorizontal: 16,
      paddingVertical: 24,
      width: "100%",
    },

    deviceFrame: {
      backgroundColor: palette.frame,
      borderColor: palette.frameBorder,
      borderRadius: 42,
      borderWidth: 2,
      maxWidth: 430,
      overflow: "hidden",
      paddingBottom: 16,
      paddingHorizontal: 8,
      paddingTop: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.28,
      shadowRadius: 28,
      width: "100%",
    },
    deviceTopSpeaker: {
      alignSelf: "center",
      backgroundColor: "#2D3430",
      borderRadius: 999,
      height: 6,
      marginBottom: 10,
      opacity: 0.95,
      width: 92,
    },

    phoneShell: {
      backgroundColor: palette.bg,
      borderColor: palette.border,
      borderRadius: 34,
      borderWidth: 1,
      height: 844,
      overflow: "hidden",
      width: "100%",
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 150,
      paddingHorizontal: 18,
      paddingTop: 14,
    },

    statusBar: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    statusTime: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 14,
    },
    statusIcons: {
      alignItems: "center",
      flexDirection: "row",
      gap: 7,
    },
    signalBars: {
      alignItems: "flex-end",
      flexDirection: "row",
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
      fontSize: 12,
      lineHeight: 13,
    },
    batteryWrap: {
      alignItems: "center",
      flexDirection: "row",
      gap: 2,
    },
    batteryBody: {
      borderColor: palette.title,
      borderRadius: 3,
      borderWidth: 1.2,
      height: 10,
      padding: 1,
      width: 18,
    },
    batteryFill: {
      backgroundColor: palette.title,
      borderRadius: 2,
      flex: 1,
    },
    batteryCap: {
      backgroundColor: palette.title,
      borderRadius: 1,
      height: 5,
      width: 2,
    },

    header: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    backButton: {
      alignItems: "center",
      backgroundColor: palette.card,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 38,
      justifyContent: "center",
      width: 38,
    },
    headerTitle: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 16,
      letterSpacing: -0.2,
    },

    modeToggle: {
      alignItems: "center",
      backgroundColor: palette.card,
      borderColor: isDark ? "#B9831B" : "#F2822E",
      borderRadius: 14,
      borderWidth: 1.4,
      flexDirection: "row",
      gap: 3,
      padding: 3,
    },
    modeButton: {
      alignItems: "center",
      borderRadius: 11,
      height: 30,
      justifyContent: "center",
      width: 35,
    },
    modeButtonActive: {
      backgroundColor: isDark ? "rgba(226, 170, 45, 0.18)" : "#FFF4D8",
    },

    searchPanel: {
      backgroundColor: "transparent",
      gap: 12,
      marginBottom: 14,
    },
    searchInputRow: {
      alignItems: "center",
      backgroundColor: palette.card,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: "row",
      minHeight: 46,
      paddingHorizontal: 13,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.18 : 0.05,
      shadowRadius: 15,
    },
    searchInput: {
      color: palette.text,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 13,
      paddingHorizontal: 9,
      paddingVertical: 10,
    },
    filterButton: {
      alignItems: "center",
      backgroundColor: palette.cardSoft,
      borderColor: palette.borderSoft,
      borderRadius: 12,
      borderWidth: 1,
      height: 30,
      justifyContent: "center",
      width: 30,
    },
    serviceChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    serviceChip: {
      alignItems: "center",
      backgroundColor: palette.card,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 30,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    serviceChipSelected: {
      backgroundColor: isDark ? "#13452E" : "#0B6B45",
      borderColor: isDark ? "#2CCB74" : "#0B6B45",
    },
    serviceChipText: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    serviceChipTextSelected: {
      color: isDark ? "#DFFFEA" : "#FFFFFF",
    },

    noticePanel: {
      backgroundColor: palette.cardSoft,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      marginBottom: 14,
      padding: 12,
    },
    noticeText: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 12,
      lineHeight: 18,
    },

    legacyRecommendedHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
      paddingHorizontal: 2,
    },
    legacyRecommendedCopy: {
      flex: 1,
      gap: 2,
    },
    legacyHomeLocationLine: {
      alignItems: "center",
      flexDirection: "row",
      gap: 4,
      minWidth: 0,
    },
    legacyRecommendedEyebrow: {
      color: isDark ? palette.greenBright : palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
      letterSpacing: -0.1,
    },
    legacyRecommendedText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 11,
      lineHeight: 15,
    },
    legacyChangeLocationButton: {
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    legacyChangeLocationText: {
      color: isDark ? palette.greenBright : palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    homeZipEditor: {
      backgroundColor: palette.card,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 11,
      marginBottom: 12,
      padding: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 14,
    },
    homeZipEditorCopy: {
      gap: 2,
    },
    homeZipEditorTitle: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 13,
    },
    homeZipEditorText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 11,
      lineHeight: 15,
    },
    homeZipEditorRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 7,
    },
    homeZipInput: {
      backgroundColor: palette.cardSoft,
      borderColor: palette.border,
      borderRadius: 12,
      borderWidth: 1,
      color: palette.text,
      flex: 1,
      fontFamily: AppFonts.bold,
      fontSize: 14,
      minHeight: 40,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    homeZipSaveButton: {
      alignItems: "center",
      backgroundColor: isDark ? "#1D8E55" : palette.primary,
      borderRadius: 999,
      justifyContent: "center",
      minHeight: 40,
      paddingHorizontal: 15,
    },
    homeZipSaveButtonDisabled: {
      opacity: 0.6,
    },
    homeZipSaveText: {
      color: "#FFFFFF",
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    homeZipCancelButton: {
      alignItems: "center",
      borderRadius: 999,
      justifyContent: "center",
      minHeight: 40,
      paddingHorizontal: 8,
    },
    homeZipCancelText: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },

    resultsIntro: {
      gap: 4,
      marginBottom: 12,
    },
    resultsEyebrow: {
      color: isDark ? palette.greenBright : palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 11,
      letterSpacing: 0.7,
      textTransform: "uppercase",
    },
    resultsTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 23,
      letterSpacing: -0.5,
      lineHeight: 27,
    },
    resultsText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 13,
      lineHeight: 18,
    },

    viewToggleWrap: {
      backgroundColor: palette.card,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: "row",
      gap: 8,
      marginBottom: 12,
      padding: 5,
    },
    viewToggleButton: {
      alignItems: "center",
      borderRadius: 14,
      flex: 1,
      flexDirection: "row",
      gap: 7,
      justifyContent: "center",
      minHeight: 38,
      paddingHorizontal: 12,
    },
    viewToggleButtonActive: {
      backgroundColor: isDark ? "#1D8E55" : palette.primary,
    },
    viewToggleText: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 12,
    },
    viewToggleTextActive: {
      color: "#FFFFFF",
    },

    mapPreviewCard: {
      backgroundColor: palette.card,
      borderColor: palette.border,
      borderRadius: 22,
      borderWidth: 1,
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
      marginBottom: 12,
      padding: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 16,
    },
    mapPreviewCopy: {
      flex: 1,
      flexDirection: "row",
      gap: 10,
    },
    mapPreviewIcon: {
      alignItems: "center",
      backgroundColor: isDark ? "#123C2A" : "#E5F9EC",
      borderRadius: 999,
      height: 38,
      justifyContent: "center",
      width: 38,
    },
    mapPreviewTextBlock: {
      flex: 1,
      gap: 3,
    },
    mapPreviewTitle: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 14,
    },
    mapPreviewText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 12,
      lineHeight: 16,
    },
    mapPreviewButton: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: isDark ? "#1D8E55" : palette.primary,
      borderRadius: 999,
      justifyContent: "center",
      minHeight: 36,
      paddingHorizontal: 13,
    },
    mapPreviewButtonText: {
      color: "#FFFFFF",
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },

    mapPanel: {
      backgroundColor: palette.card,
      borderColor: palette.border,
      borderRadius: 24,
      borderWidth: 1,
      marginBottom: 12,
      overflow: "hidden",
      paddingTop: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.22 : 0.06,
      shadowRadius: 18,
    },
    mapHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: 10,
      justifyContent: "space-between",
      paddingBottom: 10,
      paddingHorizontal: 14,
    },
    mapHeaderCopy: {
      flex: 1,
      gap: 2,
    },
    mapTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 21,
      letterSpacing: -0.4,
      lineHeight: 25,
    },
    mapSubtitle: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 12,
      lineHeight: 16,
    },
    mapCountPill: {
      backgroundColor: isDark ? "#123C2A" : "#DDF9EA",
      borderColor: isDark ? "#2A6A47" : "#8EE8B7",
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 13,
      paddingVertical: 8,
    },
    mapCountText: {
      color: isDark ? "#BDF6D2" : palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 12,
    },

    legacyNativeMapWrap: {
      borderColor: isDark ? "#2B654B" : "#CDEEE6",
      borderTopWidth: 1,
      height: 300,
      overflow: "hidden",
    },
    nativeMap: {
      height: "100%",
      width: "100%",
    },
    nativeMarker: {
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderColor: "#47D79D",
      borderRadius: 999,
      borderWidth: 2,
      height: 42,
      justifyContent: "center",
      overflow: "hidden",
      width: 42,
    },
    nativeMarkerHighlighted: {
      borderColor: palette.primary,
      borderWidth: 3,
      height: 46,
      width: 46,
    },
    nativeMarkerImage: {
      height: "100%",
      width: "100%",
    },
    nativeMarkerFallback: {
      alignItems: "center",
      backgroundColor: "#F5FBF6",
      height: "100%",
      justifyContent: "center",
      width: "100%",
    },
    nativeMarkerInitials: {
      color: palette.primaryDark,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
    },

    legacyUsMapCanvas: {
      backgroundColor: palette.mapWater,
      borderColor: isDark ? "#2B654B" : "#CDEEE6",
      borderTopWidth: 1,
      height: 300,
      overflow: "hidden",
      position: "relative",
    },
    usMapInner: {
      height: "100%",
      position: "relative",
      width: "100%",
    },
    mapRegionAlaska: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 16,
      left: 35,
      letterSpacing: 0.6,
      position: "absolute",
      textTransform: "uppercase",
      top: 211,
    },
    mapRegionHawaii: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 14,
      left: 115,
      letterSpacing: 0.6,
      position: "absolute",
      textTransform: "uppercase",
      top: 218,
    },

    coverageMarker: {
      alignItems: "center",
      justifyContent: "center",
      position: "absolute",
    },
    coverageRing: {
      backgroundColor: "rgba(29, 182, 108, 0.12)",
      borderColor: "rgba(29, 182, 108, 0.16)",
      borderWidth: 1,
      position: "absolute",
    },
    coverageRingHighlighted: {
      backgroundColor: "rgba(240, 82, 82, 0.13)",
      borderColor: "#F05252",
      borderWidth: 2,
    },
    coverageAvatarWrap: {
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderColor: "#40D69B",
      borderRadius: 999,
      borderWidth: 2,
      height: 36,
      justifyContent: "center",
      overflow: "hidden",
      width: 36,
      zIndex: 2,
    },
    coverageAvatarWrapHighlighted: {
      borderColor: "#F05252",
      borderWidth: 3,
      height: 44,
      width: 44,
    },
    coverageAvatar: {
      height: "100%",
      width: "100%",
    },
    coverageAvatarFallback: {
      alignItems: "center",
      backgroundColor: "#F5FBF6",
      height: "100%",
      justifyContent: "center",
      width: "100%",
    },
    coverageAvatarFallbackText: {
      color: palette.primaryDark,
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
    },
    coverageStateLabel: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
      letterSpacing: -0.2,
      lineHeight: 15,
      marginTop: 2,
      textAlign: "center",
      textShadowColor: "#FFFFFF",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
      zIndex: 3,
    },

    mapLegendFloating: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: "rgba(255, 253, 248, 0.94)",
      borderColor: palette.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 13,
      marginLeft: 13,
      marginTop: -35,
      paddingHorizontal: 12,
      paddingVertical: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.07,
      shadowRadius: 12,
      zIndex: 10,
    },
    legendItem: {
      alignItems: "center",
      flexDirection: "row",
      gap: 6,
    },
    legendDot: {
      backgroundColor: palette.primary,
      borderColor: "#D3F4DF",
      borderRadius: 999,
      borderWidth: 3,
      height: 18,
      width: 18,
    },
    legendRing: {
      backgroundColor: "rgba(29, 182, 108, 0.12)",
      borderColor: "rgba(29, 182, 108, 0.2)",
      borderRadius: 999,
      borderWidth: 2,
      height: 18,
      width: 18,
    },
    legendText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 11,
    },

    mapGuruPreview: {
      backgroundColor: palette.card,
      borderColor: palette.border,
      borderRadius: 22,
      borderWidth: 1,
      gap: 10,
      margin: 12,
      marginTop: 10,
      padding: 12,
    },
    mapGuruPreviewTop: {
      alignItems: "center",
      flexDirection: "row",
      gap: 11,
    },
    legacyMapGuruPreviewMain: {
      flex: 1,
      gap: 3,
    },
    legacyMapGuruPreviewName: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 17,
      letterSpacing: -0.3,
    },
    mapGuruPreviewChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7,
    },
    mapGuruPreviewTrust: {
      color: isDark ? "#BFE8C8" : palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 11,
      lineHeight: 16,
    },
    mapGuruPreviewActions: {
      flexDirection: "row",
      gap: 8,
      justifyContent: "flex-end",
    },

    stateSummaryScroll: {
      gap: 10,
      marginBottom: 12,
      paddingRight: 20,
      paddingTop: 2,
    },
    stateSummaryCard: {
      backgroundColor: palette.cardSoft,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      minHeight: 106,
      padding: 12,
      width: 152,
    },
    stateSummaryTop: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    stateSummaryCode: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 17,
    },
    stateSummaryMiles: {
      color: isDark ? "#BFE8C8" : palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 10,
    },
    stateSummaryName: {
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 13,
      marginBottom: 2,
    },
    stateSummaryMeta: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 11,
      marginBottom: 4,
    },
    stateSummaryCities: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 11,
      lineHeight: 15,
    },

    emptyState: {
      alignItems: "center",
      backgroundColor: palette.card,
      borderColor: palette.border,
      borderRadius: 22,
      borderWidth: 1,
      gap: 8,
      padding: 22,
    },
    emptyIcon: {
      fontSize: 34,
    },
    emptyTitle: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 17,
      textAlign: "center",
    },
    emptyText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 13,
      lineHeight: 19,
      textAlign: "center",
    },
    emptyButton: {
      backgroundColor: isDark ? "#1D8E55" : palette.primary,
      borderRadius: 999,
      marginTop: 6,
      paddingHorizontal: 18,
      paddingVertical: 10,
    },
    emptyButtonText: {
      color: "#FFFFFF",
      fontFamily: AppFonts.bold,
      fontSize: 12,
    },

    legacyGuruList: {
      gap: 12,
    },
    legacyGuruCard: {
      backgroundColor: palette.card,
      borderColor: palette.border,
      borderRadius: 22,
      borderWidth: 1,
      gap: 9,
      padding: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.22 : 0.06,
      shadowRadius: 18,
    },
    guruCardHighlighted: {
      borderColor: palette.favoriteRed,
      borderWidth: 1.4,
    },
    guruTopRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
    },
    guruMain: {
      flex: 1,
      gap: 4,
    },
    nameLine: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
      justifyContent: "space-between",
    },
    nameButton: {
      flex: 1,
    },
    legacyGuruName: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 17,
      letterSpacing: -0.2,
    },
    legacyFavoriteButton: {
      alignItems: "center",
      borderRadius: 999,
      height: 30,
      justifyContent: "center",
      width: 30,
    },
    legacyFavoriteButtonSaved: {
      backgroundColor: palette.favoriteRedSoft,
    },
    locationRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 4,
    },
    locationText: {
      color: palette.muted,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 12,
    },
    legacyRatingRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 4,
    },
    ratingText: {
      color: palette.gold,
      fontFamily: AppFonts.bold,
      fontSize: 12,
    },
    rateText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 12,
    },

    serviceRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7,
    },
    serviceTag: {
      backgroundColor: palette.cardSoft,
      borderColor: palette.borderSoft,
      borderRadius: 999,
      borderWidth: 1,
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 10,
      overflow: "hidden",
      paddingHorizontal: 9,
      paddingVertical: 5,
    },
    trustRow: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    trustText: {
      color: isDark ? "#BFE8C8" : palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    dot: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 12,
    },
    coverageInfoRow: {
      alignItems: "center",
      backgroundColor: palette.cardSoft,
      borderColor: palette.border,
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: "row",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    coverageInfoText: {
      color: palette.text,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 11,
    },
    favoriteSavedRow: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: palette.favoriteRedSoft,
      borderRadius: 999,
      flexDirection: "row",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    favoriteSavedText: {
      color: palette.favoriteRed,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    cardFooter: {
      alignItems: "center",
      flexDirection: "row",
      gap: 10,
      justifyContent: "space-between",
    },
    visibilityText: {
      color: palette.muted,
      flex: 1,
      fontFamily: AppFonts.bold,
      fontSize: 10,
      textTransform: "uppercase",
    },
    cardActions: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7,
      justifyContent: "flex-end",
    },
    viewMapButton: {
      alignItems: "center",
      backgroundColor: isDark ? "#102F22" : "#EAF8F0",
      borderColor: isDark ? "#28573F" : "#BFE8C8",
      borderRadius: 999,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 34,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    viewMapButtonText: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    viewButton: {
      alignItems: "center",
      backgroundColor: palette.cardSoft,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 34,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    viewButtonText: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    bookButton: {
      alignItems: "center",
      backgroundColor: isDark ? "#1D8E55" : palette.primary,
      borderRadius: 999,
      justifyContent: "center",
      minHeight: 34,
      paddingHorizontal: 13,
      paddingVertical: 8,
    },
    bookButtonDisabled: {
      backgroundColor: palette.disabledBg,
      borderColor: palette.border,
      borderWidth: 1,
    },
    bookButtonText: {
      color: "#FFFFFF",
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    bookButtonTextDisabled: {
      color: palette.disabledText,
    },

    mapScrollContent: {
      paddingBottom: 88,
    },
    recommendedSection: {
      gap: 7,
      marginBottom: 11,
      paddingHorizontal: 1,
    },
    recommendedTop: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    recommendedCopy: {
      flex: 1,
      gap: 1,
    },
    recommendedEyebrow: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 15,
      letterSpacing: -0.25,
      lineHeight: 19,
    },
    recommendedSubtitle: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 11,
      lineHeight: 15,
    },
    recommendedLocationRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
      justifyContent: "space-between",
    },
    homeLocationLine: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      gap: 4,
      minWidth: 0,
    },
    recommendedText: {
      color: palette.muted,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 14,
    },
    locationActionGroup: {
      alignItems: "center",
      flexDirection: "row",
      gap: 6,
    },
    allGurusLinkButton: {
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },
    allGurusLinkText: {
      color: isDark ? palette.greenBright : palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 10,
    },

    changeLocationButton: {
      borderRadius: 999,
      paddingHorizontal: 5,
      paddingVertical: 4,
    },
    changeLocationText: {
      color: isDark ? palette.greenBright : palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 10,
    },

    guruList: {
      gap: 14,
    },
    guruProfileCard: {
      backgroundColor: isDark ? "#0A241B" : "#0D3026",
      borderColor: isDark ? "#356B51" : "#D7D0C3",
      borderRadius: 22,
      borderWidth: 1,
      overflow: "hidden",
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.34 : 0.16,
      shadowRadius: 18,
    },
    guruProfilePhotoButton: {
      backgroundColor: isDark ? "#0B241B" : "#E8EFEA",
      height: 218,
      overflow: "hidden",
      position: "relative",
      width: "100%",
    },
    guruProfilePhotoStage: {
      backgroundColor: isDark ? "#0B241B" : "#E8EFEA",
      flex: 1,
      overflow: "hidden",
      position: "relative",
      width: "100%",
    },
    guruProfilePhotoBackdrop: {
      ...StyleSheet.absoluteFill,
      opacity: isDark ? 0.34 : 0.28,
      transform: [{ scale: 1.08 }],
    },
    guruProfilePhotoBackdropTint: {
      ...StyleSheet.absoluteFill,
      backgroundColor: isDark
        ? "rgba(5, 24, 17, 0.24)"
        : "rgba(237, 244, 239, 0.18)",
    },
    guruProfilePhoto: {
      ...StyleSheet.absoluteFill,
    },
    guruProfilePhotoShade: {
      backgroundColor: "rgba(5, 29, 21, 0.12)",
      bottom: 0,
      height: 42,
      left: 0,
      position: "absolute",
      right: 0,
    },
    guruProfileFavoriteButton: {
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.96)",
      borderColor: "rgba(18, 63, 49, 0.16)",
      borderRadius: 999,
      borderWidth: 1,
      height: 36,
      justifyContent: "center",
      position: "absolute",
      right: 11,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.16,
      shadowRadius: 7,
      top: 11,
      width: 36,
      zIndex: 10,
    },
    guruProfileFavoriteButtonSaved: {
      backgroundColor: "#FFF4F2",
      borderColor: "#F4B7AF",
    },
    guruProfilePanel: {
      backgroundColor: isDark ? "#0A2A20" : "#10352B",
      gap: 9,
      paddingBottom: 12,
      paddingHorizontal: 13,
      paddingTop: 18,
      position: "relative",
    },
    guruProfileBadge: {
      alignItems: "center",
      backgroundColor: "#F3A631",
      borderRadius: 7,
      justifyContent: "center",
      left: 13,
      minHeight: 24,
      paddingHorizontal: 9,
      position: "absolute",
      top: -12,
      zIndex: 4,
    },
    guruProfileBadgeText: {
      color: "#FFFFFF",
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
      letterSpacing: 0.15,
      textTransform: "uppercase",
    },
    guruProfileContentButton: {
      gap: 8,
    },
    guruProfileNameRow: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: 10,
      justifyContent: "space-between",
    },
    guruProfileNameCopy: {
      flex: 1,
      gap: 1,
      minWidth: 0,
    },
    guruProfileName: {
      color: "#FFFFFF",
      fontFamily: AppFonts.extraBold,
      fontSize: 20,
      letterSpacing: -0.45,
      lineHeight: 23,
    },
    guruProfileLocation: {
      color: "rgba(255, 255, 255, 0.76)",
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 14,
    },
    guruProfileRate: {
      color: "#DFF6E8",
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
      lineHeight: 15,
      marginTop: 2,
      maxWidth: 78,
      textAlign: "right",
    },
    guruProfileRatingRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 4,
    },
    guruProfileRatingValue: {
      color: "#FFD15A",
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
      lineHeight: 14,
    },
    guruProfileReviewText: {
      color: "rgba(255, 255, 255, 0.72)",
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
    },
    guruProfileServices: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    guruProfileServicePill: {
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.06)",
      borderColor: "rgba(255, 255, 255, 0.25)",
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: "row",
      gap: 4,
      minHeight: 24,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    guruProfileServiceIcon: {
      color: "#D7EEDF",
    },
    guruProfileServiceText: {
      color: "#F1F7F3",
      fontFamily: AppFonts.bold,
      fontSize: 8,
      lineHeight: 10,
    },
    guruProfileAboutBlock: {
      gap: 2,
    },
    guruProfileAboutLabel: {
      color: "#FFFFFF",
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
      lineHeight: 14,
    },
    guruProfileAboutText: {
      color: "rgba(255, 255, 255, 0.76)",
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
    },
    guruProfileTrustRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 5,
    },
    guruProfileTrustIcon: {
      color: "#78D990",
    },
    guruProfileTrustText: {
      color: "#C8EBD4",
      fontFamily: AppFonts.bold,
      fontSize: 9,
      lineHeight: 12,
    },
    guruProfileRequestButton: {
      alignItems: "center",
      backgroundColor: "#2B8C5E",
      borderColor: "#43A874",
      borderRadius: 10,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 42,
      paddingHorizontal: 14,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 8,
    },
    guruProfileRequestButtonSecondary: {
      backgroundColor: "transparent",
      borderColor: "rgba(255, 255, 255, 0.38)",
    },
    guruProfileRequestButtonPressed: {
      opacity: 0.84,
      transform: [{ scale: 0.992 }],
    },
    guruProfileRequestButtonText: {
      color: "#FFFFFF",
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
      letterSpacing: 0.05,
    },
    guruProfileRequestButtonTextSecondary: {
      color: "#E8F8EE",
    },
    guruCard: {
      alignItems: "stretch",
      backgroundColor: palette.card,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: "row",
      minHeight: 126,
      padding: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: isDark ? 0.2 : 0.045,
      shadowRadius: 11,
    },
    guruCardPrimary: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      gap: 10,
      minWidth: 0,
    },
    guruListAvatarWrap: {
      backgroundColor: palette.cardSoft,
      borderColor: isDark ? "#2F694D" : "#DDE9DF",
      borderRadius: 999,
      borderWidth: 1.5,
      height: 58,
      overflow: "hidden",
      width: 58,
    },
    guruListAvatarImage: {
      height: "100%",
      width: "100%",
    },
    guruCardBody: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    guruName: {
      color: palette.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
      letterSpacing: -0.15,
      lineHeight: 17,
    },
    ratingRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 3,
    },
    ratingValue: {
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 10,
      lineHeight: 14,
    },
    guruMetaText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
    },
    guruServiceText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
    },
    serviceRadiusPill: {
      alignSelf: "flex-start",
      backgroundColor: isDark ? "rgba(57, 217, 130, 0.15)" : "#E3F6E9",
      borderRadius: 999,
      marginTop: 2,
      paddingHorizontal: 7,
      paddingVertical: 4,
    },
    serviceRadiusPillText: {
      color: isDark ? "#BDF6D2" : palette.primaryDark,
      fontFamily: AppFonts.bold,
      fontSize: 8,
      lineHeight: 10,
    },
    guruCardRight: {
      alignItems: "flex-end",
      justifyContent: "space-between",
      marginLeft: 5,
      minWidth: 54,
    },
    favoriteButton: {
      alignItems: "center",
      borderRadius: 999,
      height: 31,
      justifyContent: "center",
      width: 31,
    },
    favoriteButtonLarge: {
      alignItems: "center",
      borderRadius: 999,
      height: 38,
      justifyContent: "center",
      width: 38,
    },
    favoriteButtonSaved: {
      backgroundColor: palette.favoriteRedSoft,
    },
    guruRateText: {
      color: palette.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
      lineHeight: 16,
    },

    webMapWrap: {
      backgroundColor: palette.mapWater,
      height: 300,
      overflow: "hidden",
      position: "relative",
      width: "100%",
    },
    webMapCanvas: {
      height: "100%",
      width: "100%",
    },
    mapAttribution: {
      backgroundColor: isDark
        ? "rgba(7, 20, 15, 0.72)"
        : "rgba(255, 255, 255, 0.78)",
      borderRadius: 4,
      bottom: 3,
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 7,
      left: 4,
      lineHeight: 9,
      paddingHorizontal: 4,
      paddingVertical: 2,
      position: "absolute",
      zIndex: 8,
    },
    nativeUserMarkerHalo: {
      alignItems: "center",
      backgroundColor: "rgba(47, 128, 237, 0.24)",
      borderRadius: 999,
      height: 30,
      justifyContent: "center",
      width: 30,
    },
    nativeUserMarkerDot: {
      backgroundColor: "#2F80ED",
      borderColor: "#FFFFFF",
      borderRadius: 999,
      borderWidth: 2,
      height: 14,
      width: 14,
    },
    mapUnavailable: {
      alignItems: "center",
      backgroundColor: palette.cardSoft,
      gap: 6,
      height: 300,
      justifyContent: "center",
      paddingHorizontal: 24,
      width: "100%",
    },
    mapUnavailableTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 16,
    },
    mapUnavailableText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 11,
      lineHeight: 16,
      textAlign: "center",
    },

    mapExplorerStage: {
      backgroundColor: palette.mapWater,
      height: 566,
      marginHorizontal: -18,
      overflow: "hidden",
      position: "relative",
    },
    nativeMapWrap: {
      borderTopWidth: 0,
      height: 300,
      overflow: "hidden",
    },
    nativeMapWrapFull: {
      height: "100%",
      width: "100%",
    },
    usMapCanvas: {
      backgroundColor: palette.mapWater,
      borderTopWidth: 0,
      height: 300,
      overflow: "hidden",
      position: "relative",
    },
    usMapCanvasFull: {
      height: "100%",
      width: "100%",
    },
    mapUserLocation: {
      alignItems: "center",
      height: 30,
      justifyContent: "center",
      left: "50%",
      marginLeft: -15,
      marginTop: -15,
      position: "absolute",
      top: "46%",
      width: 30,
      zIndex: 24,
    },
    mapUserLocationHalo: {
      backgroundColor: "rgba(54, 132, 255, 0.22)",
      borderRadius: 999,
      height: 28,
      position: "absolute",
      width: 28,
    },
    mapUserLocationDot: {
      backgroundColor: "#2F80ED",
      borderColor: "#FFFFFF",
      borderRadius: 999,
      borderWidth: 2,
      height: 13,
      width: 13,
    },
    mapAllGurusButton: {
      alignItems: "center",
      backgroundColor: isDark
        ? "rgba(7, 26, 18, 0.94)"
        : "rgba(255, 253, 248, 0.96)",
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      left: 12,
      minHeight: 34,
      paddingHorizontal: 13,
      position: "absolute",
      top: 12,
      zIndex: 35,
    },
    mapAllGurusButtonText: {
      color: isDark ? palette.greenBright : palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
    },

    mapGuruCountBadge: {
      alignItems: "center",
      backgroundColor: isDark
        ? "rgba(16, 33, 26, 0.96)"
        : "rgba(255, 253, 248, 0.96)",
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      minHeight: 63,
      paddingHorizontal: 14,
      paddingVertical: 8,
      position: "absolute",
      right: 18,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: isDark ? 0.26 : 0.12,
      shadowRadius: 12,
      top: 16,
      zIndex: 30,
    },
    mapGuruCountPaw: {
      alignItems: "center",
      backgroundColor: isDark ? "rgba(57, 217, 130, 0.15)" : "#EAF8F0",
      borderRadius: 999,
      height: 24,
      justifyContent: "center",
      marginBottom: 1,
      width: 24,
    },
    mapGuruCountPawText: {
      fontSize: 12,
    },
    mapGuruCountNumber: {
      color: palette.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
      lineHeight: 14,
    },
    mapGuruCountLabel: {
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 9,
      lineHeight: 11,
    },
    mapUtilityStack: {
      bottom: 118,
      gap: 7,
      position: "absolute",
      right: 12,
      zIndex: 32,
    },
    mapUtilityButton: {
      alignItems: "center",
      backgroundColor: isDark
        ? "rgba(16, 33, 26, 0.96)"
        : "rgba(255, 253, 248, 0.97)",
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 42,
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.24 : 0.11,
      shadowRadius: 9,
      width: 42,
    },
    mapUtilityIcon: {
      color: palette.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 23,
      lineHeight: 24,
    },
    mapUtilityArrow: {
      color: palette.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 19,
      lineHeight: 21,
      transform: [{ rotate: "-44deg" }],
    },

    mapCompactAvatarWrap: {
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderColor: isDark ? "#65D99B" : "#7CCEA4",
      borderRadius: 999,
      borderWidth: 2,
      height: 54,
      justifyContent: "center",
      overflow: "hidden",
      width: 54,
    },
    mapExpandedAvatarWrap: {
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderColor: isDark ? "#65D99B" : "#D8D5CB",
      borderRadius: 999,
      borderWidth: 2,
      height: 66,
      justifyContent: "center",
      overflow: "hidden",
      width: 66,
    },
    mapPreviewAvatarImage: {
      height: "100%",
      width: "100%",
    },
    mapPreviewAvatarFallback: {
      alignItems: "center",
      backgroundColor: isDark ? "#163326" : "#EEF7F1",
      height: "100%",
      justifyContent: "center",
      width: "100%",
    },
    mapPreviewAvatarInitials: {
      color: palette.primaryDark,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
    },
    mapExpandedAvatarInitials: {
      color: palette.primaryDark,
      fontFamily: AppFonts.extraBold,
      fontSize: 17,
    },

    mapGuruPreviewCompact: {
      alignItems: "center",
      backgroundColor: isDark
        ? "rgba(16, 33, 26, 0.98)"
        : "rgba(255, 253, 248, 0.98)",
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      bottom: 10,
      flexDirection: "row",
      left: 12,
      minHeight: 94,
      padding: 10,
      position: "absolute",
      right: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.34 : 0.16,
      shadowRadius: 18,
      zIndex: 40,
    },
    mapGuruPreviewCompactMain: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      gap: 10,
      minWidth: 0,
    },
    mapGuruPreviewMain: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    mapGuruPreviewName: {
      color: palette.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 15,
      letterSpacing: -0.25,
      lineHeight: 19,
    },
    mapGuruPreviewLocation: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 13,
    },
    mapGuruPreviewMeta: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 14,
    },
    mapGuruPreviewCompactRight: {
      alignItems: "flex-end",
      gap: 14,
      justifyContent: "space-between",
      marginLeft: 7,
    },
    mapGuruPreviewRate: {
      color: palette.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
      lineHeight: 16,
    },

    mapGuruPreviewExpanded: {
      backgroundColor: palette.card,
      borderColor: palette.border,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      borderWidth: 1,
      bottom: 0,
      left: 0,
      paddingBottom: 11,
      paddingHorizontal: 15,
      position: "absolute",
      right: 0,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: isDark ? 0.34 : 0.16,
      shadowRadius: 18,
      zIndex: 50,
    },
    mapSheetGrabberButton: {
      alignItems: "center",
      height: 20,
      justifyContent: "center",
    },
    mapSheetGrabber: {
      backgroundColor: isDark ? "#52655C" : "#B9B9B4",
      borderRadius: 999,
      height: 4,
      width: 42,
    },
    mapGuruExpandedTop: {
      alignItems: "center",
      flexDirection: "row",
      gap: 10,
    },
    mapGuruExpandedMain: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    mapGuruExpandedNameRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 7,
    },
    mapGuruExpandedName: {
      color: palette.text,
      flexShrink: 1,
      fontFamily: AppFonts.extraBold,
      fontSize: 18,
      letterSpacing: -0.35,
      lineHeight: 21,
    },
    topGuruBadge: {
      backgroundColor: isDark ? "rgba(57, 217, 130, 0.16)" : "#E3F6E9",
      borderRadius: 999,
      paddingHorizontal: 7,
      paddingVertical: 4,
    },
    topGuruBadgeText: {
      color: isDark ? "#BDF6D2" : palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 8,
      lineHeight: 10,
    },
    mapExpandedRating: {
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 12,
    },
    mapExpandedLocationRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 4,
      marginTop: 1,
      minWidth: 0,
    },
    mapExpandedLocation: {
      color: palette.text,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 11,
      lineHeight: 15,
    },
    mapExpandedDistance: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 14,
    },
    mapExpandedServices: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 13,
      justifyContent: "center",
      marginTop: 8,
    },
    mapExpandedServiceItem: {
      alignItems: "center",
      flexDirection: "row",
      gap: 5,
    },
    mapExpandedServiceDot: {
      backgroundColor: isDark ? palette.greenBright : palette.primary,
      borderRadius: 999,
      height: 5,
      width: 5,
    },
    mapExpandedServiceText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 10,
    },
    mapExpandedRadiusPill: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: isDark ? "rgba(57, 217, 130, 0.15)" : "#E3F6E9",
      borderRadius: 999,
      flexDirection: "row",
      gap: 5,
      marginTop: 8,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },
    mapExpandedRadiusText: {
      color: isDark ? "#BDF6D2" : palette.primaryDark,
      fontFamily: AppFonts.bold,
      fontSize: 9,
    },
    mapExpandedDivider: {
      backgroundColor: palette.border,
      height: 1,
      marginVertical: 8,
      width: "100%",
    },
    mapExpandedActionRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 14,
    },
    mapExpandedPrice: {
      color: palette.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 19,
      letterSpacing: -0.35,
      minWidth: 72,
    },
    mapExpandedViewButton: {
      alignItems: "center",
      backgroundColor: isDark ? "#1D8E55" : palette.primary,
      borderRadius: 999,
      flex: 1,
      justifyContent: "center",
      minHeight: 40,
      paddingHorizontal: 18,
    },
    mapExpandedViewButtonText: {
      color: "#FFFFFF",
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
    },
    mapExpandedRequestButton: {
      alignItems: "center",
      backgroundColor: palette.card,
      borderColor: isDark ? "#5D7568" : "#B8BCB9",
      borderRadius: 999,
      borderWidth: 1,
      justifyContent: "center",
      marginTop: 8,
      minHeight: 38,
    },
    mapExpandedRequestButtonText: {
      color: isDark ? palette.greenBright : palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
    },

    floatingMapButton: {
      alignItems: "center",
      backgroundColor: isDark ? "#1D8E55" : palette.primary,
      borderColor: isDark ? "#48D78E" : "#075A3A",
      borderRadius: 14,
      borderWidth: 1,
      bottom: 92,
      flexDirection: "row",
      gap: 8,
      justifyContent: "center",
      left: 18,
      minHeight: 47,
      position: "absolute",
      right: 18,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.32 : 0.18,
      shadowRadius: 14,
      zIndex: 40,
    },
    floatingMapButtonText: {
      color: "#FFFFFF",
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
    },

    bottomSpacer: {
      height: 18,
    },

    legacyFloatingMapButton: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: isDark ? "#1D8E55" : palette.primary,
      borderColor: isDark ? "#48D78E" : "#075A3A",
      borderRadius: 999,
      borderWidth: 1,
      bottom: 92,
      flexDirection: "row",
      gap: 7,
      justifyContent: "center",
      minHeight: 42,
      paddingHorizontal: 20,
      position: "absolute",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.3 : 0.18,
      shadowRadius: 14,
      zIndex: 40,
    },
    legacyFloatingMapButtonText: {
      color: "#FFFFFF",
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
    },

    bottomNav: {
      alignItems: "center",
      backgroundColor: isDark ? "#071A12" : "#FFFDF8",
      borderColor: isDark ? "#224D38" : "#EEDFCC",
      borderRadius: 24,
      borderWidth: 1,
      bottom: 8,
      flexDirection: "row",
      height: 76,
      justifyContent: "space-around",
      left: 10,
      paddingBottom: 8,
      paddingHorizontal: 8,
      paddingTop: 8,
      position: "absolute",
      right: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: isDark ? 0.28 : 0.08,
      shadowRadius: 18,
    },
    navItem: {
      alignItems: "center",
      flex: 1,
      gap: 4,
      justifyContent: "center",
    },
    navLabelActive: {
      color: palette.navActive,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    navLabel: {
      color: palette.navMuted,
      fontFamily: AppFonts.medium,
      fontSize: 11,
    },

    homeIndicator: {
      alignSelf: "center",
      backgroundColor: "#F4F2EC",
      borderRadius: 999,
      height: 5,
      marginTop: 10,
      opacity: 0.9,
      width: 120,
    },
  });
}