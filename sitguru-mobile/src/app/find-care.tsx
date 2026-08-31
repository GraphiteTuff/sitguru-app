import { Asset } from "expo-asset";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ArrowUpDown,
  Check,
  ChevronLeft,
  Heart,
  List,
  Map as MapIcon,
  MapPin,
  PawPrint,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  X,
  Zap,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  type ImageStyle,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  type StyleProp,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BubblePressable from "@/components/BubblePressable";
import { useKeyboardSafe } from "@/components/mobile/KeyboardSafeHost";
import SitGuruFeatureChips from "@/components/mobile/SitGuruFeatureChips";
import { SitGuruIcon } from "@/components/SitGuruIcon";
import SitGuruScreen from "@/components/SitGuruScreen";
import SitGuruTabBar from "@/components/SitGuruTabBar";
import { AppFonts } from "@/constants/fonts";
import { getMobileChromePalette } from "@/constants/mobile-palette";
import { BrandColors } from "@/constants/theme";
import {
  setThemePreference,
  SitGuruThemePreference,
  useThemePreference,
} from "@/hooks/use-color-scheme";
import { useThemeMode } from "@/hooks/use-theme";
import {
  getCompletedBookingCount,
  getGuruVerification,
} from "@/lib/marketplace-trust";
import { loadPublicGuruCatalog } from "@/lib/gurus/public-catalog";
import { resolveSupabaseStorageUrl } from "@/lib/storage";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  getGuruBookingStatusLabel,
  getGuruDisplayName,
  getGuruFirstName,
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

// react-native-maps has no web build, so it can only be loaded conditionally.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MapsModule = Platform.OS === "web" ? null : require("react-native-maps");
const NativeMapView = MapsModule?.default ?? MapsModule?.MapView;
const NativeMarker = MapsModule?.Marker;

// Metro resolves bundled image assets through require().
// eslint-disable-next-line @typescript-eslint/no-require-imports
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

/**
 * Tracks the photo that failed rather than a boolean, so a new photoUrl clears
 * the failure during render instead of through a cascading effect.
 */
function useFailedPhotoUrl(photoUrl?: string | null) {
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);

  return {
    imageFailed: failedPhotoUrl !== null && failedPhotoUrl === (photoUrl ?? ""),
    markImageFailed: () => setFailedPhotoUrl(photoUrl ?? ""),
  };
}

function GuruAvatarImage({
  photoUrl,
  style,
}: {
  photoUrl?: string | null;
  style: StyleProp<ImageStyle>;
}) {
  const { imageFailed, markImageFailed } = useFailedPhotoUrl(photoUrl);

  const source =
    photoUrl && !imageFailed ? { uri: photoUrl } : SITGURU_FALLBACK_AVATAR;

  return (
    <Image
      accessibilityLabel="Guru profile photo"
      onError={markImageFailed}
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
  const { imageFailed, markImageFailed } = useFailedPhotoUrl(photoUrl);

  const source =
    photoUrl && !imageFailed ? { uri: photoUrl } : SITGURU_FALLBACK_AVATAR;

  return (
    <View style={styles.guruProfilePhotoStage}>
      <Image
        accessibilityElementsHidden
        blurRadius={Platform.OS === "web" ? 0 : 6}
        onError={markImageFailed}
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
        onError={markImageFailed}
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

type ThemeOption = {
  label: string;
  value: SitGuruThemePreference;
  icon: "sun" | "moon";
};

type ExploreView = "list" | "map";
type DiscoveryScope = "all" | "nearby";
type GuruSortKey =
  | "recommended"
  | "rating"
  | "reviews"
  | "distance"
  | "price";

type SearchFilters = {
  minRating: number | null;
  minReviews: number | null;
  maxAllInHourly: number | null;
};

type SearchPreferences = {
  sortKey: GuruSortKey;
  serviceValue: string;
  filters: SearchFilters;
};

/**
 * Subset of `marketplace_fee_rules` that the checkout route reads when it
 * resolves the SitGuru marketplace fee for a booking.
 */
type MarketplaceFeeRule = {
  id?: string | null;
  locality_name?: string | null;
  state?: string | null;
  city?: string | null;
  postal_code?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  radius_miles?: number | string | null;
  fee_percent?: number | string | null;
};

type GuruPriceDisplay = {
  allInHourly: number | null;
  baseHourly: number | null;
  detailLabel: string;
  feePercent: number;
  headline: string;
  isAllIn: boolean;
};

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

/**
 * MapLibre and the DOM are only reachable on web, where the library is pulled in
 * through a runtime require(), so its handles carry no static type here.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WebMapHandle = any;

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
const SEARCH_PREFERENCES_STORAGE_KEY = "sitguru.findCareSearchPrefs.v1";

// These mirror app/api/stripe/checkout/route.ts, which resolves the real fee
// from marketplace_fee_rules and clamps every result into the same band.
const DEFAULT_SITGURU_FEE_PERCENT = 15;
const MIN_SITGURU_FEE_PERCENT = 15;
const MAX_SITGURU_FEE_PERCENT = 20;
const LOCAL_DISCOVERY_RADIUS_MILES = 75;
const MAX_MAP_GURUS = 60;
const MAX_NEARBY_MAP_GURUS = 20;
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
    label: "Dog Walking",
    value: "dog_walking",
    keywords: ["walk", "walks", "walking", "dog walking", "trail"],
  },
  {
    label: "Pet Sitting",
    value: "pet_sitting",
    keywords: ["pet sitting", "sitting", "sit", "sitter"],
  },
  {
    label: "Boarding",
    value: "boarding",
    keywords: ["board", "boarding"],
  },
  {
    label: "Doggy Day Care",
    value: "day_care",
    keywords: ["day care", "daycare", "doggy day care", "daycare"],
  },
  {
    label: "Drop-In Visits",
    value: "drop_ins",
    keywords: ["drop", "drop-in", "drop-ins", "drop in", "visit", "visits"],
  },
  {
    label: "House Sitting",
    value: "house_sitting",
    keywords: ["house sitting", "overnight", "house sit"],
  },
  {
    label: "Training Support",
    value: "training_support",
    keywords: ["training", "trainer", "training support"],
  },
  {
    label: "Medication Help",
    value: "medication_help",
    keywords: ["medication", "meds", "medicine"],
  },
  {
    label: "Custom Care",
    value: "custom_care",
    keywords: ["custom", "custom care", "special"],
  },
];

const sortOptions: {
  detail: string;
  label: string;
  value: GuruSortKey;
}[] = [
  {
    value: "recommended",
    label: "Recommended",
    detail: "SitGuru's default match order",
  },
  {
    value: "rating",
    label: "Highest rated",
    detail: "Best star rating first",
  },
  {
    value: "reviews",
    label: "Most reviewed",
    detail: "Most reviews on SitGuru first",
  },
  {
    value: "distance",
    label: "Nearest first",
    detail: "Closest to your home area",
  },
  {
    value: "price",
    label: "Price: low to high",
    detail: "Lowest all-in hourly price first",
  },
];

const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  minRating: null,
  minReviews: null,
  maxAllInHourly: null,
};

const ratingFilterOptions: { label: string; value: number | null }[] = [
  { label: "Any", value: null },
  { label: "4.0+", value: 4 },
  { label: "4.5+", value: 4.5 },
  { label: "4.8+", value: 4.8 },
];

const reviewFilterOptions: { label: string; value: number | null }[] = [
  { label: "Any", value: null },
  { label: "1+", value: 1 },
  { label: "5+", value: 5 },
  { label: "10+", value: 10 },
  { label: "25+", value: 25 },
];

const priceFilterOptions: { label: string; value: number | null }[] = [
  { label: "Any", value: null },
  { label: "Under $25", value: 25 },
  { label: "Under $40", value: 40 },
  { label: "Under $60", value: 60 },
  { label: "Under $80", value: 80 },
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

function certificationStatusMeansComplete(value?: string | null) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return [
    "awarded",
    "certified",
    "complete",
    "completed",
    "graduate",
    "graduated",
    "issued",
    "passed",
  ].includes(normalized);
}

async function loadCertifiedGuruUserIds(
  userIds: string[],
): Promise<Set<string>> {
  const safeUserIds = Array.from(
    new Set(userIds.map((id) => String(id || "").trim()).filter(Boolean)),
  );

  if (!isSupabaseConfigured || safeUserIds.length === 0) {
    return new Set();
  }

  try {
    const result = await supabase
      .from("academy_certifications")
      .select("user_id, badge_status, certificate_status, issued_at")
      .eq("academy_type", "guru")
      .in("user_id", safeUserIds);

    if (result.error || !result.data) return new Set();

    return new Set(
      result.data
        .filter((row) => {
          const record = row as {
            user_id?: string | null;
            badge_status?: string | null;
            certificate_status?: string | null;
            issued_at?: string | null;
          };

          return Boolean(
            record.issued_at ||
              certificationStatusMeansComplete(record.badge_status) ||
              certificationStatusMeansComplete(record.certificate_status),
          );
        })
        .map((row) => String((row as { user_id?: string | null }).user_id || "").trim())
        .filter(Boolean),
    );
  } catch {
    return new Set();
  }
}

/**
 * Reads the same marketplace_fee_rules rows the Stripe checkout route uses so
 * the search results quote the real fee instead of a guessed one. The table is
 * privileged, so an anon-key read is expected to come back empty; callers then
 * fall back to the route's documented default.
 */
async function loadMarketplaceFeeRules(): Promise<MarketplaceFeeRule[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const result = await supabase
      .from("marketplace_fee_rules")
      .select(
        "id, locality_name, state, city, postal_code, latitude, longitude, radius_miles, fee_percent, is_active, priority, created_at",
      )
      .eq("is_active", true)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true });

    if (result.error || !result.data) return [];

    return result.data as MarketplaceFeeRule[];
  } catch {
    return [];
  }
}

export default function FindCareScreen() {
  const themeMode = useThemeMode();
  const themePreference = useThemePreference();
  const isDark = themeMode === "dark";
  const isWebPreview = Platform.OS === "web";
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const palette = useMemo(() => getPalette(isDark), [isDark]);
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const scrollRef = useRef<ScrollView | null>(null);
  const searchFieldRef = useRef<View>(null);
  const homeZipFieldRef = useRef<View>(null);
  const scrollOffsetRef = useRef(0);
  const keyboardHeightRef = useRef(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { revealFocusedInput } = useKeyboardSafe();
  const routeParams = useLocalSearchParams<{
    service?: string | string[];
    zip?: string | string[];
  }>();

  const initialServiceParam = Array.isArray(routeParams.service)
    ? routeParams.service[0]
    : routeParams.service;
  const initialZipParam = Array.isArray(routeParams.zip)
    ? routeParams.zip[0]
    : routeParams.zip;
  const hasServiceRouteParam = Boolean(
    String(initialServiceParam || "").trim(),
  );

  const matchedInitialService = useMemo(() => {
    const raw = String(initialServiceParam || "").trim().toLowerCase();

    if (!raw) {
      return (
        findServiceByValue(sessionSearchPreferences?.serviceValue) ?? services[0]
      );
    }

    if (raw === "all" || raw === "all services") return services[0];

    return (
      services.find(
        (service) =>
          service.value === raw ||
          service.label.toLowerCase() === raw ||
          service.keywords.some((keyword) => raw.includes(keyword)),
      ) || services[0]
    );
  }, [initialServiceParam]);

  const [activeView, setActiveView] = useState<ExploreView>("list");
  const [discoveryScope, setDiscoveryScope] = useState<DiscoveryScope>("all");
  const [searchQuery, setSearchQuery] = useState(
    String(initialZipParam || "").replace(/\D/g, "").slice(0, 5),
  );
  const [selectedService, setSelectedService] =
    useState<ServiceOption>(matchedInitialService);
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
  const [sortKey, setSortKey] = useState<GuruSortKey>(
    () => sessionSearchPreferences?.sortKey ?? "recommended",
  );
  const [filters, setFilters] = useState<SearchFilters>(
    () => sessionSearchPreferences?.filters ?? DEFAULT_SEARCH_FILTERS,
  );
  const [openSheet, setOpenSheet] = useState<"sort" | "filters" | null>(null);
  const [feeRules, setFeeRules] = useState<MarketplaceFeeRule[]>([]);
  const [certifiedGuruUserIds, setCertifiedGuruUserIds] = useState<Set<string>>(
    () => new Set(),
  );

  const cleanZip = searchQuery.replace(/\D/g, "").slice(0, 5);
  const hasValidZip = cleanZip.length === 5;
  const careAreaLabel = hasValidZip
    ? `ZIP ${cleanZip}`
    : homeLocation
      ? `ZIP ${homeLocation.zipCode}`
      : "your care area";
  const sourceGurus = dynamicGurus;
  const activeFilterCount = countActiveFilters(filters, selectedService);
  const hasActiveFilters =
    Boolean(searchQuery.trim()) || activeFilterCount > 0;

  const homeCoordinate = useMemo<MapCoordinate | null>(() => {
    if (
      !homeLocation ||
      homeLocation.latitude === null ||
      homeLocation.longitude === null
    ) {
      return null;
    }

    return {
      latitude: homeLocation.latitude,
      longitude: homeLocation.longitude,
    };
  }, [homeLocation]);

  // Distance ordering needs a real reference point. A resolved search area wins
  // over the saved home ZIP because it is what the user just asked for.
  const distanceOrigin = useMemo<MapCoordinate | null>(() => {
    const searchCenter = getSearchCenter(searchQuery);

    if (searchCenter) {
      return {
        latitude: searchCenter.latitude,
        longitude: searchCenter.longitude,
      };
    }

    return homeCoordinate;
  }, [homeCoordinate, searchQuery]);

  const canSortByDistance = distanceOrigin !== null;
  const appliedSortKey: GuruSortKey =
    sortKey === "distance" && !canSortByDistance ? "recommended" : sortKey;
  const appliedSortLabel =
    sortOptions.find((option) => option.value === appliedSortKey)?.label ??
    "Recommended";

  const searchMatchedGurus = useMemo(
    () => sourceGurus.filter((guru) => guruMatchesSearch(guru, searchQuery)),
    [sourceGurus, searchQuery],
  );

  const filteredGurus = useMemo(() => {
    return searchMatchedGurus.filter((guru) => {
      if (!guruMatchesService(guru, selectedService)) return false;

      if (filters.minRating !== null) {
        const rating = getGuruRatingValue(guru);
        if (rating === null || rating < filters.minRating) return false;
      }

      if (
        filters.minReviews !== null &&
        getGuruReviewCount(guru) < filters.minReviews
      ) {
        return false;
      }

      if (filters.maxAllInHourly !== null) {
        const allInHourly = getGuruPriceDisplay(guru, feeRules).allInHourly;
        if (allInHourly === null || allInHourly > filters.maxAllInHourly) {
          return false;
        }
      }

      return true;
    });
  }, [feeRules, filters, searchMatchedGurus, selectedService]);

  const displayedGurus = useMemo(() => {
    // "Recommended" keeps the screen's original ordering: nearest-first inside a
    // saved home area, otherwise the order the catalog came back in.
    if (appliedSortKey === "recommended") {
      if (
        discoveryScope === "all" ||
        searchQuery.trim() ||
        homeCoordinate === null
      ) {
        return filteredGurus;
      }

      return sortGurusByValue(
        filteredGurus,
        (guru, index) =>
          getDistanceMiles(homeCoordinate, getGuruCoordinate(guru, index)),
        "ascending",
      );
    }

    if (appliedSortKey === "rating") {
      return sortGurusByValue(filteredGurus, getGuruRatingValue, "descending");
    }

    if (appliedSortKey === "reviews") {
      return sortGurusByValue(
        filteredGurus,
        (guru) => {
          const reviewCount = getGuruReviewCount(guru);
          return reviewCount > 0 ? reviewCount : null;
        },
        "descending",
      );
    }

    if (appliedSortKey === "price") {
      return sortGurusByValue(
        filteredGurus,
        (guru) => getGuruPriceDisplay(guru, feeRules).allInHourly,
        "ascending",
      );
    }

    if (distanceOrigin === null) return filteredGurus;

    return sortGurusByValue(
      filteredGurus,
      (guru, index) =>
        getDistanceMiles(distanceOrigin, getGuruCoordinate(guru, index)),
      "ascending",
    );
  }, [
    appliedSortKey,
    discoveryScope,
    distanceOrigin,
    feeRules,
    filteredGurus,
    homeCoordinate,
    searchQuery,
  ]);

  const feeDisclosureLabel = useMemo(() => {
    const percents = Array.from(
      new Set(
        displayedGurus.map((guru) => resolveGuruFeePercent(guru, feeRules)),
      ),
    ).sort((first, second) => first - second);

    if (percents.length === 0) {
      return `${formatFeePercent(DEFAULT_SITGURU_FEE_PERCENT)}%`;
    }

    if (percents.length === 1) return `${formatFeePercent(percents[0])}%`;

    return `${formatFeePercent(percents[0])}–${formatFeePercent(
      percents[percents.length - 1],
    )}%`;
  }, [displayedGurus, feeRules]);

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

    loadPublicGuruCatalog()
      .then(async (gurus) => {
        if (!mounted) return;
        setDynamicGurus(gurus);

        const certifiedIds = await loadCertifiedGuruUserIds(
          gurus.map(getGuruUserId),
        );

        if (mounted) setCertifiedGuruUserIds(certifiedIds);
      })
      .catch(() => {
        if (!mounted) return;
        setDynamicGurus([]);
        setCertifiedGuruUserIds(new Set());
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
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const show = Keyboard.addListener(showEvent, (event) => {
      const nextHeight = event.endCoordinates.height;
      keyboardHeightRef.current = nextHeight;
      setKeyboardHeight(nextHeight);
    });

    const hide = Keyboard.addListener(hideEvent, () => {
      keyboardHeightRef.current = 0;
      setKeyboardHeight(0);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  function scrollFieldAboveKeyboard(field: View | null) {
    if (!field || isWebPreview) return;

    const liftField = () => {
      field.measureInWindow((_x, y, _width, height) => {
        const coveredBy = keyboardHeightRef.current + 16;
        const visibleBottom = windowHeight - coveredBy;
        const fieldBottom = y + height;

        if (fieldBottom <= visibleBottom && y >= insets.top + 8) return;

        const overlap = fieldBottom - visibleBottom;
        scrollRef.current?.scrollTo({
          y: Math.max(0, scrollOffsetRef.current + overlap),
          animated: true,
        });
      });
    };

    requestAnimationFrame(liftField);
    setTimeout(liftField, Platform.OS === "ios" ? 280 : 80);
  }

  useEffect(() => {
    if (!isEditingHomeZip) return;

    const timeout = setTimeout(() => {
      scrollFieldAboveKeyboard(homeZipFieldRef.current);
    }, 80);

    return () => clearTimeout(timeout);
  }, [isEditingHomeZip, keyboardHeight]);

  useEffect(() => {
    setFavoriteGuruIds(readFavoriteGuruIds());
  }, []);

  useEffect(() => {
    setDiscoveryScope(readDiscoveryScope());
  }, []);

  useEffect(() => {
    if (sessionSearchPreferences) return;

    const restored = readStoredSearchPreferences();
    if (!restored) return;

    persistSearchPreferences(restored);
    setSortKey(restored.sortKey);
    setFilters(restored.filters);

    // A service passed in the route is an explicit request and outranks the
    // stored choice.
    if (hasServiceRouteParam) return;

    const restoredService = findServiceByValue(restored.serviceValue);
    if (restoredService) setSelectedService(restoredService);
  }, [hasServiceRouteParam]);

  useEffect(() => {
    let mounted = true;

    loadMarketplaceFeeRules()
      .then((rules) => {
        if (mounted) setFeeRules(rules);
      })
      .catch(() => {
        if (mounted) setFeeRules([]);
      });

    return () => {
      mounted = false;
    };
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

  function handleSelectService(service: ServiceOption) {
    setSelectedService(service);
    setNoticeMessage("");
    persistSearchPreferences({
      sortKey,
      serviceValue: service.value,
      filters,
    });
  }

  function handleSelectSort(nextSortKey: GuruSortKey) {
    if (nextSortKey === "distance" && !canSortByDistance) {
      // Never leave a sort selected that has nothing to sort by. Send the user
      // straight to the one input that unlocks it instead.
      setOpenSheet(null);
      setActiveView("list");
      setNoticeMessage(
        "Add your home ZIP to sort Gurus by distance, or search a ZIP, city, or state.",
      );
      handleOpenHomeZipEditor();
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setSortKey(nextSortKey);
    setOpenSheet(null);
    setNoticeMessage("");
    persistSearchPreferences({
      sortKey: nextSortKey,
      serviceValue: selectedService.value,
      filters,
    });
  }

  function handleChangeFilters(nextFilters: SearchFilters) {
    setFilters(nextFilters);
    setNoticeMessage("");
    persistSearchPreferences({
      sortKey,
      serviceValue: selectedService.value,
      filters: nextFilters,
    });
  }

  function handleClearFilters() {
    setFilters(DEFAULT_SEARCH_FILTERS);
    setSelectedService(services[0]);
    setNoticeMessage("");
    persistSearchPreferences({
      sortKey,
      serviceValue: services[0].value,
      filters: DEFAULT_SEARCH_FILTERS,
    });
  }

  function handleClearSortAndFilters() {
    setFilters(DEFAULT_SEARCH_FILTERS);
    setSelectedService(services[0]);
    setSortKey("recommended");
    setNoticeMessage("");
    persistSearchPreferences({
      sortKey: "recommended",
      serviceValue: services[0].value,
      filters: DEFAULT_SEARCH_FILTERS,
    });
  }

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
    handleSelectService(services[0]);
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
      const slug = getGuruSlug(guru);

      router.push({
        pathname: "/request-booking",
        params: slug
          ? { guruId: guru.id, guruSlug: slug }
          : { guruId: guru.id },
      });
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
    <SitGuruScreen
      scroll={false}
      center={isWebPreview}
      maxWidth={560}
      edgeToEdge={!isWebPreview}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
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
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={
                isWebPreview ? 0 : 68 + Math.max(insets.bottom, 10)
              }
              style={styles.keyboardView}
            >
            <ScrollView
              ref={scrollRef}
              keyboardDismissMode={
                Platform.OS === "ios" ? "interactive" : "on-drag"
              }
              keyboardShouldPersistTaps="handled"
              style={styles.scrollView}
              contentContainerStyle={[
                styles.scrollContent,
                !isWebPreview && styles.scrollContentNative,
                activeView === "map" && styles.mapScrollContent,
                activeView === "map" &&
                  !isWebPreview &&
                  styles.mapScrollContentNative,
                keyboardHeight > 0 && styles.scrollContentKeyboard,
              ]}
              onScroll={(event) => {
                scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
              }}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              scrollEnabled={activeView === "list"}
              bounces={activeView === "list"}
            >
              {isWebPreview ? (
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
              ) : null}

              <View
                style={[
                  styles.header,
                  !isWebPreview && { paddingTop: insets.top + 6 },
                ]}
              >
                <BubblePressable
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
                  scaleTo={0.88}
                  style={styles.backButton}
                >
                  <ChevronLeft
                    size={21}
                    color={palette.title}
                    strokeWidth={2.7}
                  />
                </BubblePressable>

                <Text style={styles.headerTitle}>
                  {activeView === "list" ? "Explore Gurus" : "Explore Map"}
                </Text>

                <View style={styles.modeToggle}>
                  {themeOptions.map((option) => {
                    const active = themePreference === option.value;

                    return (
                      <BubblePressable
                        key={option.value}
                        accessibilityRole="button"
                        accessibilityLabel={`Switch to ${option.label} mode`}
                        onPress={() => setThemePreference(option.value)}
                        scaleTo={0.88}
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
                      </BubblePressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.searchPanel}>
                <View ref={searchFieldRef} style={styles.searchInputRow}>
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
                    onFocus={() => {
                      scrollFieldAboveKeyboard(searchFieldRef.current);
                      revealFocusedInput();
                    }}
                    onSubmitEditing={handleSearch}
                    placeholder="Search zip, city, state, or service"
                    placeholderTextColor={palette.placeholder}
                    returnKeyType="search"
                    style={styles.searchInput}
                  />

                  <BubblePressable
                    accessibilityRole="button"
                    accessibilityLabel="Apply search filters"
                    onPress={handleSearch}
                    scaleTo={0.88}
                    style={styles.filterButton}
                  >
                    <SlidersHorizontal
                      size={17}
                      color={palette.title}
                      strokeWidth={2.4}
                    />
                  </BubblePressable>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.serviceChips}
                >
                  {services.map((service) => {
                    const selected = selectedService.value === service.value;

                    return (
                      <BubblePressable
                        key={service.value}
                        accessibilityRole="button"
                        accessibilityLabel={`Filter by ${service.label}`}
                        onPress={() => handleSelectService(service)}
                        scaleTo={0.88}
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
                      </BubblePressable>
                    );
                  })}
                </ScrollView>

                <View style={styles.refineRow}>
                  <BubblePressable
                    accessibilityLabel={`Change sort order. Currently ${appliedSortLabel}`}
                    accessibilityRole="button"
                    onPress={() => setOpenSheet("sort")}
                    scaleTo={0.88}
                    style={[
                      styles.refinePill,
                      appliedSortKey !== "recommended" &&
                        styles.refinePillActive,
                    ]}
                  >
                    <ArrowUpDown
                      color={
                        appliedSortKey !== "recommended"
                          ? isDark
                            ? "#DFFFEA"
                            : "#FFFFFF"
                          : palette.muted
                      }
                      size={13}
                      strokeWidth={2.5}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.refinePillText,
                        appliedSortKey !== "recommended" &&
                          styles.refinePillTextActive,
                      ]}
                    >
                      {appliedSortLabel}
                    </Text>
                  </BubblePressable>

                  <BubblePressable
                    accessibilityLabel={
                      activeFilterCount > 0
                        ? `Edit filters. ${activeFilterCount} active`
                        : "Add filters"
                    }
                    accessibilityRole="button"
                    onPress={() => setOpenSheet("filters")}
                    scaleTo={0.88}
                    style={[
                      styles.refinePill,
                      activeFilterCount > 0 && styles.refinePillActive,
                    ]}
                  >
                    <SlidersHorizontal
                      color={
                        activeFilterCount > 0
                          ? isDark
                            ? "#DFFFEA"
                            : "#FFFFFF"
                          : palette.muted
                      }
                      size={13}
                      strokeWidth={2.5}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.refinePillText,
                        activeFilterCount > 0 && styles.refinePillTextActive,
                      ]}
                    >
                      Filters
                    </Text>

                    {activeFilterCount > 0 ? (
                      <View style={styles.refineBadge}>
                        <Text style={styles.refineBadgeText}>
                          {activeFilterCount}
                        </Text>
                      </View>
                    ) : null}
                  </BubblePressable>

                  {activeFilterCount > 0 || appliedSortKey !== "recommended" ? (
                    <BubblePressable
                      accessibilityLabel="Clear all sorts and filters"
                      accessibilityRole="button"
                      onPress={handleClearSortAndFilters}
                      scaleTo={0.88}
                      style={styles.refineClearButton}
                    >
                      <Text style={styles.refineClearText}>Clear all</Text>
                    </BubblePressable>
                  ) : null}
                </View>
              </View>

              {noticeMessage && activeView === "list" ? (
                <View style={styles.noticePanel}>
                  <Text style={styles.noticeText}>{noticeMessage}</Text>
                </View>
              ) : null}

              {activeView === "list" ? (
                <>
                  <View style={styles.listMapStage}>
                    <CoverageMap
                      highlightedGuruId={highlightedGuruId}
                      isDark={isDark}
                      mapPoints={mapPoints}
                      mapRegion={mapRegion}
                      onMarkerLeave={() => setHighlightedGuruId(null)}
                      onMarkerOpen={(guru) => {
                        handleSelectGuru(guru);
                        setIsMapPreviewExpanded(true);
                        setActiveView("map");
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
                  </View>

                  <View style={styles.recommendedSection}>
                    <View style={styles.recommendedTop}>
                      <View style={styles.recommendedCopy}>
                        <Text style={styles.recommendedEyebrow}>
                          {hasActiveFilters
                            ? "Search results"
                            : "Recommended near you"}
                        </Text>
                        <Text style={styles.recommendedSubtitle}>
                          {displayedGurus.length === 0
                            ? "Trusted, local pet care Gurus"
                            : `${displayedGurus.length} ${
                                displayedGurus.length === 1 ? "Guru" : "Gurus"
                              } • prices include the ${feeDisclosureLabel} SitGuru fee`}
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
                            <BubblePressable
                              accessibilityRole="button"
                              accessibilityLabel="Change home ZIP code"
                              onPress={handleOpenHomeZipEditor}
                              scaleTo={0.88}
                              style={styles.changeLocationButton}
                            >
                              <Text style={styles.changeLocationText}>
                                Change
                              </Text>
                            </BubblePressable>

                            <BubblePressable
                              accessibilityRole="button"
                              accessibilityLabel="Show all Gurus"
                              onPress={handleShowAllGurus}
                              scaleTo={0.88}
                              style={styles.allGurusLinkButton}
                            >
                              <Text style={styles.allGurusLinkText}>
                                All Gurus
                              </Text>
                            </BubblePressable>
                          </>
                        ) : (
                          <BubblePressable
                            accessibilityRole="button"
                            accessibilityLabel={
                              homeLocation
                                ? "Show Gurus near home"
                                : "Set home ZIP code"
                            }
                            onPress={handleShowNearbyGurus}
                            scaleTo={0.88}
                            style={styles.changeLocationButton}
                          >
                            <Text style={styles.changeLocationText}>
                              {homeLocation ? "Near Me" : "Set ZIP"}
                            </Text>
                          </BubblePressable>
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

                      <View ref={homeZipFieldRef} style={styles.homeZipEditorRow}>
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
                          onFocus={() => {
                            scrollFieldAboveKeyboard(homeZipFieldRef.current);
                            revealFocusedInput();
                          }}
                          onSubmitEditing={handleSaveHomeZip}
                          placeholder="18951"
                          placeholderTextColor={palette.placeholder}
                          returnKeyType="done"
                          style={styles.homeZipInput}
                          value={homeZipDraft}
                        />

                        <BubblePressable
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
                        </BubblePressable>

                        <BubblePressable
                          accessibilityRole="button"
                          disabled={isSavingHomeZip}
                          onPress={handleCancelHomeZipEditor}
                          style={styles.homeZipCancelButton}
                        >
                          <Text style={styles.homeZipCancelText}>Cancel</Text>
                        </BubblePressable>
                      </View>
                    </View>
                  ) : null}

                  {displayedGurus.length === 0 && !isLoadingGurus ? (
                    activeFilterCount > 0 && searchMatchedGurus.length > 0 ? (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>🎚️</Text>
                        <Text style={styles.emptyTitle}>
                          Your filters hid every Guru here.
                        </Text>
                        <Text style={styles.emptyText}>
                          {searchMatchedGurus.length}{" "}
                          {searchMatchedGurus.length === 1 ? "Guru" : "Gurus"}{" "}
                          {searchMatchedGurus.length === 1 ? "matches" : "match"}{" "}
                          {careAreaLabel}, but none clear all{" "}
                          {activeFilterCount}{" "}
                          {activeFilterCount === 1 ? "filter" : "filters"}. Ease
                          one off or clear them.
                        </Text>

                        <BubblePressable
                          accessibilityLabel="Clear all filters"
                          accessibilityRole="button"
                          onPress={handleClearFilters}
                          style={styles.emptyButton}
                        >
                          <Text style={styles.emptyButtonText}>
                            Clear filters
                          </Text>
                        </BubblePressable>

                        <BubblePressable
                          accessibilityLabel="Edit filters"
                          accessibilityRole="button"
                          onPress={() => setOpenSheet("filters")}
                          scaleTo={0.88}
                          style={styles.emptySecondaryButton}
                        >
                          <Text style={styles.emptySecondaryButtonText}>
                            Edit filters
                          </Text>
                        </BubblePressable>
                      </View>
                    ) : sourceGurus.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>🐾</Text>
                        <Text style={styles.emptyTitle}>
                          No Gurus in this area yet.
                        </Text>
                        <Text style={styles.emptyText}>
                          SitGuru does not have live Guru profiles to show for{" "}
                          {careAreaLabel} right now. Try another ZIP, city, or
                          state, or check back as local availability grows.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>🐾</Text>
                        <Text style={styles.emptyTitle}>
                          No Gurus matched this search.
                        </Text>
                        <Text style={styles.emptyText}>
                          Try another ZIP, city, state, or service. You can also
                          switch back to All.
                        </Text>

                        <BubblePressable
                          accessibilityRole="button"
                          onPress={() => {
                            setSearchQuery("");
                            handleClearFilters();
                          }}
                          style={styles.emptyButton}
                        >
                          <Text style={styles.emptyButtonText}>
                            Reset Search
                          </Text>
                        </BubblePressable>
                      </View>
                    )
                  ) : (
                    <View style={styles.guruList}>
                      {displayedGurus.map((guru, index) => (
                        <GuruDiscoveryCard
                          favoriteGuruIds={favoriteGuruIds}
                          feeRules={feeRules}
                          guru={guru}
                          distanceOrigin={distanceOrigin}
                          index={index}
                          isAcademyCertified={certifiedGuruUserIds.has(
                            getGuruUserId(guru),
                          )}
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
                <View
                  style={[
                    styles.mapExplorerStage,
                    !isWebPreview && styles.mapExplorerStageNative,
                  ]}
                >
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
                    <BubblePressable
                      accessibilityRole="button"
                      accessibilityLabel="Show all Gurus on the map"
                      onPress={handleShowAllGurus}
                      scaleTo={0.88}
                      style={styles.mapAllGurusButton}
                    >
                      <Text style={styles.mapAllGurusButtonText}>
                        All Gurus
                      </Text>
                    </BubblePressable>
                  ) : null}

                  <View style={styles.mapUtilityStack}>
                    <BubblePressable
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
                      scaleTo={0.88}
                      style={styles.mapUtilityButton}
                    >
                      <Text style={styles.mapUtilityIcon}>◎</Text>
                    </BubblePressable>

                    <BubblePressable
                      accessibilityRole="button"
                      accessibilityLabel="View Guru list"
                      onPress={() => {
                        setActiveView("list");
                        setIsMapPreviewExpanded(false);
                        setHighlightedGuruId(null);
                        scrollRef.current?.scrollTo({ y: 0, animated: false });
                      }}
                      scaleTo={0.88}
                      style={styles.mapUtilityButton}
                    >
                      <List
                        size={18}
                        color={palette.title}
                        strokeWidth={2.5}
                      />
                    </BubblePressable>
                  </View>

                  {selectedGuru ? (
                    <MapGuruPreviewCard
                      expanded={isMapPreviewExpanded}
                      favoriteGuruIds={favoriteGuruIds}
                      feeRules={feeRules}
                      guru={selectedGuru}
                      distanceOrigin={distanceOrigin}
                      isAcademyCertified={certifiedGuruUserIds.has(
                        getGuruUserId(selectedGuru),
                      )}
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
                <>
                  <SitGuruFeatureChips
                    preset="visitor"
                    title="While you browse"
                  />
                  <View style={styles.bottomSpacer} />
                </>
              ) : null}
            </ScrollView>
            </KeyboardAvoidingView>

            {activeView === "list" && keyboardHeight === 0 ? (
              <BubblePressable
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
              </BubblePressable>
            ) : null}

            <SitGuruTabBar active="explore" />

            {openSheet ? (
              <View style={styles.sheetOverlay}>
                {/*
                  A plain Pressable on purpose: BubblePressable would visibly
                  squash the whole dismiss-catcher behind the sheet.
                */}
                <Pressable
                  accessibilityLabel="Close panel"
                  accessibilityRole="button"
                  onPress={() => setOpenSheet(null)}
                  style={styles.sheetBackdrop}
                />

                {openSheet === "sort" ? (
                  <SortSheet
                    appliedSortKey={appliedSortKey}
                    canSortByDistance={canSortByDistance}
                    isDark={isDark}
                    onClose={() => setOpenSheet(null)}
                    onSelect={handleSelectSort}
                    palette={palette}
                    styles={styles}
                  />
                ) : (
                  <FiltersSheet
                    activeFilterCount={activeFilterCount}
                    feeDisclosureLabel={feeDisclosureLabel}
                    filters={filters}
                    matchCount={displayedGurus.length}
                    onChangeFilters={handleChangeFilters}
                    onClear={handleClearFilters}
                    onClose={() => setOpenSheet(null)}
                    onSelectService={handleSelectService}
                    palette={palette}
                    selectedService={selectedService}
                    styles={styles}
                  />
                )}
              </View>
            ) : null}
          </View>

          {isWebPreview ? <View style={styles.homeIndicator} /> : null}
        </View>
      </View>
    </SitGuruScreen>
  );
}


function SortSheet({
  appliedSortKey,
  canSortByDistance,
  isDark,
  onClose,
  onSelect,
  palette,
  styles,
}: {
  appliedSortKey: GuruSortKey;
  canSortByDistance: boolean;
  isDark: boolean;
  onClose: () => void;
  onSelect: (sortKey: GuruSortKey) => void;
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.sheetCard}>
      <View style={styles.sheetHandle} />

      <View style={styles.sheetHeaderRow}>
        <View style={styles.sheetHeaderCopy}>
          <Text style={styles.sheetTitle}>Sort Gurus</Text>
          <Text style={styles.sheetSubtitle}>
            Pick the order that matters most to you.
          </Text>
        </View>

        <BubblePressable
          accessibilityLabel="Close sort options"
          accessibilityRole="button"
          onPress={onClose}
          scaleTo={0.88}
          style={styles.sheetCloseButton}
        >
          <X color={palette.title} size={17} strokeWidth={2.5} />
        </BubblePressable>
      </View>

      <View style={styles.sheetOptionList}>
        {sortOptions.map((option) => {
          const unavailable = option.value === "distance" && !canSortByDistance;
          const selected = !unavailable && appliedSortKey === option.value;

          return (
            <BubblePressable
              accessibilityLabel={`Sort by ${option.label}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={option.value}
              onPress={() => onSelect(option.value)}
              scaleTo={0.97}
              style={[
                styles.sheetOptionRow,
                selected && styles.sheetOptionRowSelected,
                unavailable && styles.sheetOptionRowUnavailable,
              ]}
            >
              <View style={styles.sheetOptionCopy}>
                <Text
                  style={[
                    styles.sheetOptionLabel,
                    selected && styles.sheetOptionLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.sheetOptionDetail,
                    selected && styles.sheetOptionDetailSelected,
                  ]}
                >
                  {unavailable
                    ? "Needs a home ZIP or an area search — tap to add one"
                    : option.detail}
                </Text>
              </View>

              {selected ? (
                <View style={styles.sheetOptionCheck}>
                  <Check
                    color={isDark ? "#DFFFEA" : "#FFFFFF"}
                    size={13}
                    strokeWidth={3}
                  />
                </View>
              ) : null}
            </BubblePressable>
          );
        })}
      </View>
    </View>
  );
}

function FiltersSheet({
  activeFilterCount,
  feeDisclosureLabel,
  filters,
  matchCount,
  onChangeFilters,
  onClear,
  onClose,
  onSelectService,
  palette,
  selectedService,
  styles,
}: {
  activeFilterCount: number;
  feeDisclosureLabel: string;
  filters: SearchFilters;
  matchCount: number;
  onChangeFilters: (filters: SearchFilters) => void;
  onClear: () => void;
  onClose: () => void;
  onSelectService: (service: ServiceOption) => void;
  palette: ReturnType<typeof getPalette>;
  selectedService: ServiceOption;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.sheetCard}>
      <View style={styles.sheetHandle} />

      <View style={styles.sheetHeaderRow}>
        <View style={styles.sheetHeaderCopy}>
          <Text style={styles.sheetTitle}>Filters</Text>
          <Text style={styles.sheetSubtitle}>
            {matchCount} {matchCount === 1 ? "Guru" : "Gurus"} match right now
          </Text>
        </View>

        {activeFilterCount > 0 ? (
          <BubblePressable
            accessibilityLabel="Clear all filters"
            accessibilityRole="button"
            onPress={onClear}
            scaleTo={0.88}
            style={styles.sheetClearButton}
          >
            <Text style={styles.sheetClearText}>Clear all</Text>
          </BubblePressable>
        ) : null}

        <BubblePressable
          accessibilityLabel="Close filters"
          accessibilityRole="button"
          onPress={onClose}
          scaleTo={0.88}
          style={styles.sheetCloseButton}
        >
          <X color={palette.title} size={17} strokeWidth={2.5} />
        </BubblePressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.sheetScrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.sheetScroll}
      >
        <View style={styles.sheetGroup}>
          <Text style={styles.sheetGroupLabel}>Minimum rating</Text>
          <View style={styles.sheetChipRow}>
            {ratingFilterOptions.map((option) => {
              const selected = filters.minRating === option.value;

              return (
                <BubblePressable
                  accessibilityLabel={`Minimum rating ${option.label}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={option.label}
                  onPress={() =>
                    onChangeFilters({ ...filters, minRating: option.value })
                  }
                  scaleTo={0.88}
                  style={[
                    styles.sheetChip,
                    selected && styles.sheetChipSelected,
                  ]}
                >
                  {option.value !== null ? (
                    <Star
                      color={selected ? palette.gold : palette.muted}
                      fill={selected ? palette.gold : "transparent"}
                      size={11}
                      strokeWidth={2.3}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.sheetChipText,
                      selected && styles.sheetChipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </BubblePressable>
              );
            })}
          </View>
          <Text style={styles.sheetGroupNote}>
            Gurus with no rating yet are hidden while a minimum is set.
          </Text>
        </View>

        <View style={styles.sheetGroup}>
          <Text style={styles.sheetGroupLabel}>Minimum reviews</Text>
          <View style={styles.sheetChipRow}>
            {reviewFilterOptions.map((option) => {
              const selected = filters.minReviews === option.value;

              return (
                <BubblePressable
                  accessibilityLabel={`Minimum reviews ${option.label}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={option.label}
                  onPress={() =>
                    onChangeFilters({ ...filters, minReviews: option.value })
                  }
                  scaleTo={0.88}
                  style={[
                    styles.sheetChip,
                    selected && styles.sheetChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.sheetChipText,
                      selected && styles.sheetChipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </BubblePressable>
              );
            })}
          </View>
        </View>

        <View style={styles.sheetGroup}>
          <Text style={styles.sheetGroupLabel}>All-in price per hour</Text>
          <View style={styles.sheetChipRow}>
            {priceFilterOptions.map((option) => {
              const selected = filters.maxAllInHourly === option.value;

              return (
                <BubblePressable
                  accessibilityLabel={`All-in price ${option.label}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={option.label}
                  onPress={() =>
                    onChangeFilters({
                      ...filters,
                      maxAllInHourly: option.value,
                    })
                  }
                  scaleTo={0.88}
                  style={[
                    styles.sheetChip,
                    selected && styles.sheetChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.sheetChipText,
                      selected && styles.sheetChipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </BubblePressable>
              );
            })}
          </View>
          <Text style={styles.sheetGroupNote}>
            Compared against the total you pay, including the{" "}
            {feeDisclosureLabel} SitGuru fee. Gurus without a published rate are
            hidden while a price cap is set.
          </Text>
        </View>

        <View style={styles.sheetGroup}>
          <Text style={styles.sheetGroupLabel}>Service type</Text>
          <View style={styles.sheetChipRow}>
            {services.map((service) => {
              const selected = selectedService.value === service.value;

              return (
                <BubblePressable
                  accessibilityLabel={`Service type ${service.label}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={service.value}
                  onPress={() => onSelectService(service)}
                  scaleTo={0.88}
                  style={[
                    styles.sheetChip,
                    selected && styles.sheetChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.sheetChipText,
                      selected && styles.sheetChipTextSelected,
                    ]}
                  >
                    {service.label}
                  </Text>
                </BubblePressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <BubblePressable
        accessibilityLabel={`Show ${matchCount} matching Gurus`}
        accessibilityRole="button"
        onPress={onClose}
        style={styles.sheetApplyButton}
      >
        <Text style={styles.sheetApplyButtonText}>
          {matchCount === 0
            ? "No matches — ease a filter off"
            : `Show ${matchCount} ${matchCount === 1 ? "Guru" : "Gurus"}`}
        </Text>
      </BubblePressable>
    </View>
  );
}

function GuruDiscoveryCard({
  favoriteGuruIds,
  feeRules,
  guru,
  distanceOrigin,
  index,
  isAcademyCertified,
  onBook,
  onFavorite,
  onView,
  palette,
  styles,
}: {
  favoriteGuruIds: string[];
  feeRules: MarketplaceFeeRule[];
  guru: PublicGuruProfile;
  distanceOrigin: MapCoordinate | null;
  index: number;
  isAcademyCertified: boolean;
  onBook: (guru: PublicGuruProfile) => void;
  onFavorite: (guru: PublicGuruProfile) => void;
  onView: (guru: PublicGuruProfile) => void;
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
}) {
  const name = getGuruDisplayName(guru);
  const firstName = getGuruFirstName(guru);
  const photoUrl = resolveSupabaseStorageUrl(getGuruPhotoUrl(guru));
  const isFavorite = favoriteGuruIds.includes(String(guru.id));
  const preview = isKnownPreviewGuru(guru);
  const bookable = isGuruBookable(guru);
  const services = getGuruServices(guru);
  const visibleServices = services.slice(0, 4);
  const extraServiceCount = Math.max(services.length - visibleServices.length, 0);
  const distanceLabel = getGuruDistanceLabel(guru, distanceOrigin, index);
  const locationLabel = getGuruCityStateLabel(guru);
  const ratingLabel = getGuruCardRatingLabel(guru);
  const reviewCount = getGuruReviewCount(guru);
  const completedBookings = getCompletedBookingCount(
    guru as Record<string, unknown>,
  );
  const price = getGuruPriceDisplay(guru, feeRules);
  const trustLabel = getGuruCardTrustLabel(guru);
  const bio = getGuruCardBio(guru);
  const title = getGuruTitle(guru);
  const experienceYears = getGuruExperienceYears(guru);
  const serviceMiles = getGuruServiceRadiusMiles(guru);
  const mapReady = guruHasExactMapLocation(guru);
  const founding = isFoundingGuruRecord(guru);
  const verified = getGuruVerification(guru as Record<string, unknown>);
  const identityLabel = verified.identityVerified || verified.backgroundChecked
    ? verified.label || "Verified"
    : "Trusted";
  const meetLabel = `Meet ${firstName}`;
  const bookLabel = preview
    ? "Preview only"
    : bookable
      ? `Book with ${firstName}`
      : "Bookings opening soon";

  return (
    <View style={styles.guruProfileCard}>
      <BubblePressable
        accessibilityLabel={`View ${name} profile`}
        accessibilityRole="button"
        onPress={() => onView(guru)}
        scaleTo={0.97}
        style={styles.guruProfilePhotoButton}
      >
        <GuruCardHeroImage photoUrl={photoUrl} styles={styles} />
        <View pointerEvents="none" style={styles.guruProfilePhotoShade} />
      </BubblePressable>

      {bookable && !preview ? (
        <BubblePressable
          accessibilityLabel={`Quick book ${firstName}`}
          accessibilityRole="button"
          onPress={() => onBook(guru)}
          scaleTo={0.88}
          style={styles.guruProfileQuickBook}
        >
          <Zap color="#FFFFFF" size={12} strokeWidth={2.6} />
          <Text style={styles.guruProfileQuickBookText}>Quick Book</Text>
        </BubblePressable>
      ) : null}

      <BubblePressable
        accessibilityLabel={
          isFavorite
            ? `Remove ${name} from favorite Gurus`
            : `Save ${name} as a favorite Guru`
        }
        accessibilityRole="button"
        accessibilityState={{ selected: isFavorite }}
        hitSlop={8}
        onPress={() => onFavorite(guru)}
        scaleTo={0.88}
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
      </BubblePressable>

      <View style={styles.guruProfilePanel}>
        <View style={styles.guruProfileChipRow}>
          {founding ? (
            <View style={[styles.guruProfileChip, styles.guruProfileChipFounding]}>
              <Text style={styles.guruProfileChipFoundingText}>Founding Guru</Text>
            </View>
          ) : null}

          <View
            style={[
              styles.guruProfileChip,
              verified.identityVerified || verified.backgroundChecked
                ? styles.guruProfileChipVerified
                : styles.guruProfileChipMuted,
            ]}
          >
            <Text
              style={
                verified.identityVerified || verified.backgroundChecked
                  ? styles.guruProfileChipVerifiedText
                  : styles.guruProfileChipMutedText
              }
            >
              {identityLabel}
            </Text>
          </View>

          {isAcademyCertified ? (
            <View style={[styles.guruProfileChip, styles.guruProfileChipAcademy]}>
              <Text style={styles.guruProfileChipAcademyText}>Academy Grad</Text>
            </View>
          ) : null}

          <View
            style={[
              styles.guruProfileChip,
              mapReady
                ? styles.guruProfileChipMap
                : styles.guruProfileChipArea,
            ]}
          >
            <Text
              style={
                mapReady
                  ? styles.guruProfileChipMapText
                  : styles.guruProfileChipAreaText
              }
            >
              {mapReady ? "Map ready" : "Local care area"}
            </Text>
          </View>
        </View>

        <BubblePressable
          accessibilityLabel={`Open ${name} profile details`}
          accessibilityRole="button"
          onPress={() => onView(guru)}
          scaleTo={0.97}
          style={styles.guruProfileContentButton}
        >
          <View style={styles.guruProfileNameRow}>
            <View style={styles.guruProfileNameCopy}>
              <Text numberOfLines={1} style={styles.guruProfileName}>
                {name}
              </Text>
              <Text numberOfLines={1} style={styles.guruProfileTitle}>
                {title}
              </Text>
              <Text numberOfLines={1} style={styles.guruProfileLocation}>
                {locationLabel}
                {distanceLabel ? ` · ${distanceLabel}` : ""}
              </Text>
              <Text numberOfLines={1} style={styles.guruProfileRadius}>
                {serviceMiles}-mile service radius
              </Text>
            </View>
          </View>

          <View style={styles.guruProfileStatRow}>
            <View style={styles.guruProfileStatBox}>
              <Text style={styles.guruProfileStatLabel}>Rating</Text>
              <View style={styles.guruProfileStatValueRow}>
                <Star
                  color={palette.gold}
                  fill={palette.gold}
                  size={12}
                  strokeWidth={2.1}
                />
                <Text style={styles.guruProfileStatValue}>{ratingLabel}</Text>
              </View>
            </View>

            <View style={styles.guruProfileStatBox}>
              <Text style={styles.guruProfileStatLabel}>Reviews</Text>
              <Text style={styles.guruProfileStatValue}>
                {reviewCount > 0 ? reviewCount.toLocaleString() : "New"}
              </Text>
            </View>

            {completedBookings ? (
              <View style={styles.guruProfileStatBox}>
                <Text style={styles.guruProfileStatLabel}>Completed</Text>
                <Text style={styles.guruProfileStatValue}>
                  {completedBookings.toLocaleString()}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.guruProfilePriceRow}>
            <View style={styles.guruProfilePriceCopy}>
              <Text style={styles.guruProfilePriceLabel}>
                {price.isAllIn ? "All-in price" : "Price"}
              </Text>
              <Text numberOfLines={2} style={styles.guruProfilePriceDetail}>
                {price.detailLabel}
              </Text>
            </View>

            <Text numberOfLines={1} style={styles.guruProfilePriceValue}>
              {price.headline}
            </Text>
          </View>

          <View style={styles.guruProfileMetaRow}>
            <View style={styles.guruProfileMetaPill}>
              <Text numberOfLines={1} style={styles.guruProfileMetaPillText}>
                {experienceYears
                  ? `${experienceYears}+ years experience`
                  : "Experience on profile"}
              </Text>
            </View>
            <View style={styles.guruProfileMetaPill}>
              <Text numberOfLines={1} style={styles.guruProfileMetaPillText}>
                Accepts care within {serviceMiles} mi
              </Text>
            </View>
          </View>

          {visibleServices.length > 0 ? (
            <View style={styles.guruProfileServices}>
              {visibleServices.map((chip, chipIndex) => (
                <View
                  key={`${String(guru.id)}-${chip}-${chipIndex}`}
                  style={styles.guruProfileServicePill}
                >
                  <PawPrint color="#D7EEDF" size={9} strokeWidth={2.5} />
                  <Text numberOfLines={1} style={styles.guruProfileServiceText}>
                    {shortenServiceLabel(chip)}
                  </Text>
                </View>
              ))}
              {extraServiceCount > 0 ? (
                <View style={styles.guruProfileServicePill}>
                  <Text numberOfLines={1} style={styles.guruProfileServiceText}>
                    +{extraServiceCount} more
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.guruProfileAboutBlock}>
            <Text style={styles.guruProfileAboutLabel}>About</Text>
            <Text numberOfLines={2} style={styles.guruProfileAboutText}>
              {bio}
            </Text>
          </View>

          <View style={styles.guruProfileTrustRow}>
            <ShieldCheck color="#78D990" size={15} strokeWidth={2.5} />
            <Text style={styles.guruProfileTrustText}>{trustLabel}</Text>
          </View>
        </BubblePressable>

        <View style={styles.guruProfileActionRow}>
          <BubblePressable
            accessibilityLabel={meetLabel}
            accessibilityRole="button"
            onPress={() => onView(guru)}
            style={styles.guruProfileMeetButton}
          >
            <Text style={styles.guruProfileMeetButtonText}>{meetLabel}</Text>
          </BubblePressable>

          <BubblePressable
            accessibilityLabel={bookLabel}
            accessibilityRole="button"
            disabled={!bookable || preview}
            onPress={() => onBook(guru)}
            style={[
              styles.guruProfileRequestButton,
              (!bookable || preview) && styles.guruProfileRequestButtonSecondary,
            ]}
          >
            <Text
              style={[
                styles.guruProfileRequestButtonText,
                (!bookable || preview) &&
                  styles.guruProfileRequestButtonTextSecondary,
              ]}
            >
              {bookLabel}
            </Text>
          </BubblePressable>
        </View>

        <Text style={styles.guruProfileBookNote}>
          Nothing charged until they accept · Cancel free before accept
        </Text>
      </View>
    </View>
  );
}

function MapGuruPreviewCard({
  expanded,
  favoriteGuruIds,
  feeRules,
  guru,
  distanceOrigin,
  isAcademyCertified,
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
  feeRules: MarketplaceFeeRule[];
  guru: PublicGuruProfile;
  distanceOrigin: MapCoordinate | null;
  isAcademyCertified: boolean;
  onBook: (guru: PublicGuruProfile) => void;
  onCollapse: () => void;
  onExpand: () => void;
  onFavorite: (guru: PublicGuruProfile) => void;
  onView: (guru: PublicGuruProfile) => void;
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
}) {
  const name = getGuruDisplayName(guru);
  const firstName = getGuruFirstName(guru);
  const photoUrl = resolveSupabaseStorageUrl(getGuruPhotoUrl(guru));
  const isFavorite = favoriteGuruIds.includes(String(guru.id));
  const preview = isKnownPreviewGuru(guru);
  const bookable = isGuruBookable(guru);
  const serviceMiles = getGuruServiceRadiusMiles(guru);
  const chips = getGuruServices(guru).slice(0, 3);
  const price = getGuruPriceDisplay(guru, feeRules);
  const distanceLabel = getGuruDistanceLabel(guru, distanceOrigin, 0);
  const locationLabel = getGuruCityStateLabel(guru);
  const title = getGuruTitle(guru);
  const reviewCount = getGuruReviewCount(guru);

  if (!expanded) {
    return (
      <View style={styles.mapGuruPreviewCompact}>
        <BubblePressable
          accessibilityRole="button"
          accessibilityLabel={`Expand ${name} preview`}
          onPress={onExpand}
          scaleTo={0.97}
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
              {title} · {locationLabel}
            </Text>

            <Text style={styles.mapGuruPreviewMeta} numberOfLines={1}>
              {distanceLabel ? `${distanceLabel} · ` : ""}
              Serves up to {serviceMiles} mi
              {isAcademyCertified ? " · Academy Grad" : ""}
            </Text>
          </View>
        </BubblePressable>

        <View style={styles.mapGuruPreviewCompactRight}>
          <BubblePressable
            accessibilityRole="button"
            onPress={() => onFavorite(guru)}
            scaleTo={0.88}
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
          </BubblePressable>

          <View style={styles.mapGuruPreviewPriceBlock}>
            <Text numberOfLines={1} style={styles.mapGuruPreviewRate}>
              {price.headline}
            </Text>
            <Text numberOfLines={1} style={styles.mapGuruPreviewRateNote}>
              {price.isAllIn ? "all-in" : "quote needed"}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mapGuruPreviewExpanded}>
      <BubblePressable
        accessibilityRole="button"
        accessibilityLabel="Collapse Guru preview"
        onPress={onCollapse}
        scaleTo={0.88}
        style={styles.mapSheetGrabberButton}
      >
        <View style={styles.mapSheetGrabber} />
      </BubblePressable>

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
                {preview
                  ? "Preview"
                  : isAcademyCertified
                    ? "Academy"
                    : getGuruCardBadgeLabel(guru)}
              </Text>
            </View>
          </View>

          <Text style={styles.mapGuruPreviewLocation} numberOfLines={1}>
            {title}
          </Text>

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
            {reviewCount > 0 ? (
              <Text style={styles.mapGuruPreviewMeta}>
                {reviewCount.toLocaleString()} reviews
              </Text>
            ) : null}
          </View>

          <View style={styles.mapExpandedLocationRow}>
            <MapPin size={12} color={palette.muted} strokeWidth={2.2} />
            <Text style={styles.mapExpandedLocation} numberOfLines={1}>
              {locationLabel}
            </Text>
          </View>

          {distanceLabel ? (
            <Text style={styles.mapExpandedDistance}>{distanceLabel}</Text>
          ) : null}
        </View>

        <BubblePressable
          accessibilityRole="button"
          onPress={() => onFavorite(guru)}
          scaleTo={0.88}
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
        </BubblePressable>
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
        <View style={styles.mapExpandedPriceBlock}>
          <Text numberOfLines={1} style={styles.mapExpandedPrice}>
            {price.headline}
          </Text>
          <Text numberOfLines={2} style={styles.mapExpandedPriceNote}>
            {price.detailLabel}
          </Text>
        </View>

        <BubblePressable
          accessibilityRole="button"
          onPress={() => onView(guru)}
          style={styles.mapExpandedViewButton}
        >
          <Text style={styles.mapExpandedViewButtonText}>Meet {firstName}</Text>
        </BubblePressable>
      </View>

      <BubblePressable
        accessibilityRole="button"
        disabled={!bookable || preview}
        onPress={() => onBook(guru)}
        style={styles.mapExpandedRequestButton}
      >
        <Text style={styles.mapExpandedRequestButtonText}>
          {preview
            ? "Preview only"
            : bookable
              ? `Book with ${firstName}`
              : "Bookings opening soon"}
        </Text>
      </BubblePressable>
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
  const containerRef = useRef<WebMapHandle>(null);
  const mapRef = useRef<WebMapHandle>(null);
  const mapLibreRef = useRef<WebMapHandle>(null);
  const readyMapRef = useRef<WebMapHandle>(null);
  const viewportRef = useRef<MapRegion>(mapRegion);
  const guruMarkersRef = useRef<WebMapHandle[]>([]);
  const userMarkerRef = useRef<WebMapHandle>(null);
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
    // new map before its style has finished loading. The reset has to happen
    // synchronously here, before the new map is constructed below.
    readyMapRef.current = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMapReadyVersion(0);

    try {
      ensureMapLibreCss();
      // maplibre-gl is web-only, so it can only be pulled in at runtime.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
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
  const documentRef = (globalThis as unknown as { document: WebMapHandle }).document;
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
  const documentRef = (globalThis as unknown as { document: WebMapHandle }).document;
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
  const documentRef = (globalThis as unknown as { document: WebMapHandle }).document;
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

/**
 * Sort and filter choices survive navigation for the whole app session even on
 * native, where there is no localStorage to fall back on.
 */
let sessionSearchPreferences: SearchPreferences | null = null;

function coerceSortKey(value: unknown): GuruSortKey {
  return sortOptions.some((option) => option.value === value)
    ? (value as GuruSortKey)
    : "recommended";
}

function coerceFilterValue(
  value: unknown,
  allowed: { value: number | null }[],
) {
  const parsed = typeof value === "number" && Number.isFinite(value) ? value : null;

  return allowed.some((option) => option.value === parsed) ? parsed : null;
}

function readStoredSearchPreferences(): SearchPreferences | null {
  try {
    const storage = getBrowserStorage();
    if (!storage) return null;

    const rawValue = storage.getItem(SEARCH_PREFERENCES_STORAGE_KEY);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue) as Record<string, unknown>;
    const storedFilters = (parsed.filters ?? {}) as Record<string, unknown>;
    const storedService = String(parsed.serviceValue ?? "all");

    return {
      sortKey: coerceSortKey(parsed.sortKey),
      serviceValue: services.some((service) => service.value === storedService)
        ? storedService
        : "all",
      filters: {
        minRating: coerceFilterValue(
          storedFilters.minRating,
          ratingFilterOptions,
        ),
        minReviews: coerceFilterValue(
          storedFilters.minReviews,
          reviewFilterOptions,
        ),
        maxAllInHourly: coerceFilterValue(
          storedFilters.maxAllInHourly,
          priceFilterOptions,
        ),
      },
    };
  } catch {
    return null;
  }
}

function persistSearchPreferences(preferences: SearchPreferences) {
  sessionSearchPreferences = preferences;

  try {
    const storage = getBrowserStorage();
    if (!storage) return;

    storage.setItem(
      SEARCH_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences),
    );
  } catch {
    // The in-session store above still keeps the choices for this session.
  }
}

function findServiceByValue(value: string | undefined) {
  return services.find((service) => service.value === value) ?? null;
}

function countActiveFilters(
  filters: SearchFilters,
  selectedService: ServiceOption,
) {
  return [
    selectedService.value !== "all",
    filters.minRating !== null,
    filters.minReviews !== null,
    filters.maxAllInHourly !== null,
  ].filter(Boolean).length;
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
  origin: MapCoordinate | null,
  index: number,
) {
  if (!origin) return "";

  const distance = getDistanceMiles(origin, getGuruCoordinate(guru, index));

  if (distance < 1) return "Less than 1 mi away";
  if (distance < 10) return `${distance.toFixed(1)} mi away`;
  return `${Math.round(distance)} mi away`;
}

function getGuruUserId(guru: PublicGuruProfile) {
  return String(guru.user_id || "").trim();
}

function getGuruTitle(guru: PublicGuruProfile) {
  const title = getFirstString(guru as Record<string, unknown>, [
    "title",
    "role_title",
    "professional_title",
    "headline",
  ]);

  if (title) return title;

  const firstService = getGuruServices(guru)[0];
  return firstService ? `${firstService} Guru` : "Pet Care Guru";
}

function getGuruExperienceYears(guru: PublicGuruProfile) {
  const years = getFirstNumber(guru as Record<string, unknown>, [
    "experience_years",
    "years_experience",
    "years_of_experience",
    "experience",
  ]);

  return years !== null && years > 0 ? Math.round(years) : null;
}

function guruHasExactMapLocation(guru: PublicGuruProfile) {
  return getGuruCoordinateDetails(guru, 0).quality === "exact";
}

function isFoundingGuruRecord(guru: PublicGuruProfile) {
  const record = guru as Record<string, unknown>;

  return [
    record.is_founding_guru,
    record.founding_guru,
    record.is_founding,
    record.founding,
  ].some(
    (value) =>
      value === true ||
      value === 1 ||
      String(value || "").toLowerCase() === "true",
  );
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

/**
 * Stable ordering helper. Ties fall back to the incoming order and Gurus with no
 * value for the active sort always land at the end, never at the top.
 */
function sortGurusByValue(
  gurus: PublicGuruProfile[],
  getValue: (guru: PublicGuruProfile, index: number) => number | null,
  direction: "ascending" | "descending",
) {
  const decorated = gurus.map((guru, index) => ({
    guru,
    index,
    value: getValue(guru, index),
  }));

  decorated.sort((first, second) => {
    if (first.value === null && second.value === null) {
      return first.index - second.index;
    }

    if (first.value === null) return 1;
    if (second.value === null) return -1;

    if (first.value !== second.value) {
      return direction === "ascending"
        ? first.value - second.value
        : second.value - first.value;
    }

    return first.index - second.index;
  });

  return decorated.map((entry) => entry.guru);
}

function getGuruRatingValue(guru: PublicGuruProfile) {
  const rating = getFirstNumber(guru as Record<string, unknown>, [
    "rating_avg",
    "average_rating",
    "rating",
    "review_rating",
  ]);

  return rating !== null && rating > 0 ? rating : null;
}

function getGuruBaseHourlyRate(guru: PublicGuruProfile) {
  const rate = getFirstNumber(guru as Record<string, unknown>, [
    "hourly_rate",
    "starting_rate",
    "rate",
  ]);

  return rate !== null && rate > 0 ? rate : null;
}

function clampMarketplaceFeePercent(value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return DEFAULT_SITGURU_FEE_PERCENT;

  return clampNumber(
    parsed,
    MIN_SITGURU_FEE_PERCENT,
    MAX_SITGURU_FEE_PERCENT,
  );
}

function normalizeFeeRuleText(value?: string | null) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeFeeRulePostalCode(value?: string | null) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 5);
}

function getGuruPostalCode(guru: PublicGuruProfile) {
  const record = guru as Record<string, unknown>;

  return normalizeFeeRulePostalCode(
    getFirstString(record, [
      "service_zip",
      "service_zip_code",
      "zip_code",
      "zip",
      "postal_code",
      "service_postal_code",
    ]),
  );
}

/**
 * Applies the same match precedence the checkout route uses — postal code,
 * radius, city + state, city, state, then a catch-all rule — against the Guru's
 * published service location, and falls back to the route's default percent.
 */
function resolveGuruFeePercent(
  guru: PublicGuruProfile,
  feeRules: MarketplaceFeeRule[],
) {
  if (feeRules.length === 0) return DEFAULT_SITGURU_FEE_PERCENT;

  const guruPostalCode = getGuruPostalCode(guru);
  const guruCity = normalizeFeeRuleText(getGuruCity(guru));
  const guruState = normalizeFeeRuleText(getGuruStateCode(guru));

  const ruleParts = feeRules.map((rule) => ({
    rule,
    city: normalizeFeeRuleText(rule.city),
    latitude: getFirstNumber(rule as Record<string, unknown>, ["latitude"]),
    longitude: getFirstNumber(rule as Record<string, unknown>, ["longitude"]),
    postalCode: normalizeFeeRulePostalCode(rule.postal_code),
    radiusMiles: getFirstNumber(rule as Record<string, unknown>, [
      "radius_miles",
    ]),
    state: normalizeFeeRuleText(rule.state),
  }));

  const postalMatch = ruleParts.find(
    (part) =>
      part.postalCode.length > 0 &&
      guruPostalCode.length > 0 &&
      part.postalCode === guruPostalCode,
  );

  if (postalMatch) return clampMarketplaceFeePercent(postalMatch.rule.fee_percent);

  const radiusMatch = ruleParts.find((part) => {
    if (
      part.latitude === null ||
      part.longitude === null ||
      part.radiusMiles === null ||
      part.radiusMiles <= 0
    ) {
      return false;
    }

    const distance = getDistanceMiles(
      { latitude: part.latitude, longitude: part.longitude },
      getGuruCoordinate(guru, 0),
    );

    return distance <= part.radiusMiles;
  });

  if (radiusMatch) return clampMarketplaceFeePercent(radiusMatch.rule.fee_percent);

  const cityStateMatch = ruleParts.find(
    (part) =>
      part.city.length > 0 &&
      part.state.length > 0 &&
      part.city === guruCity &&
      part.state === guruState,
  );

  if (cityStateMatch) {
    return clampMarketplaceFeePercent(cityStateMatch.rule.fee_percent);
  }

  const cityMatch = ruleParts.find(
    (part) =>
      part.city.length > 0 && part.state.length === 0 && part.city === guruCity,
  );

  if (cityMatch) return clampMarketplaceFeePercent(cityMatch.rule.fee_percent);

  const stateMatch = ruleParts.find(
    (part) =>
      part.state.length > 0 &&
      part.city.length === 0 &&
      part.postalCode.length === 0 &&
      part.latitude === null &&
      part.longitude === null &&
      part.radiusMiles === null &&
      part.state === guruState,
  );

  if (stateMatch) return clampMarketplaceFeePercent(stateMatch.rule.fee_percent);

  const catchAllMatch = ruleParts.find(
    (part) =>
      part.postalCode.length === 0 &&
      part.city.length === 0 &&
      part.state.length === 0 &&
      part.latitude === null &&
      part.longitude === null &&
      part.radiusMiles === null,
  );

  if (catchAllMatch) {
    return clampMarketplaceFeePercent(catchAllMatch.rule.fee_percent);
  }

  return DEFAULT_SITGURU_FEE_PERCENT;
}

function formatMoneyAmount(value: number) {
  const rounded = Math.round(value * 100) / 100;

  return `$${
    Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2)
  }`;
}

function formatFeePercent(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/**
 * The Guru's published rate is hourly, so the all-in figure is that rate plus
 * the resolved marketplace fee. Gurus with no published rate are never shown a
 * number that could read as a final price.
 */
function getGuruPriceDisplay(
  guru: PublicGuruProfile,
  feeRules: MarketplaceFeeRule[],
): GuruPriceDisplay {
  const feePercent = resolveGuruFeePercent(guru, feeRules);
  const baseHourly = getGuruBaseHourlyRate(guru);

  if (baseHourly === null) {
    return {
      allInHourly: null,
      baseHourly: null,
      detailLabel: "No published rate yet — message for a quote",
      feePercent,
      headline: "Rate on request",
      isAllIn: false,
    };
  }

  const allInHourly = baseHourly * (1 + feePercent / 100);

  return {
    allInHourly,
    baseHourly,
    detailLabel: `${formatMoneyAmount(baseHourly)}/hr rate + ${formatFeePercent(
      feePercent,
    )}% SitGuru fee`,
    feePercent,
    headline: `${formatMoneyAmount(allInHourly)}/hr`,
    isAllIn: true,
  };
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

  const verification = getGuruVerification(guru as Record<string, unknown>);
  if (verification.label) return verification.label;

  return isGuruBookable(guru)
    ? "Booking-ready SitGuru profile"
    : "Trust details available on profile";
}

function getGuruCardBio(guru: PublicGuruProfile) {
  const record = guru as Record<string, unknown>;
  const written = getFirstString(record, [
    "bio",
    "about",
    "description",
    "profile_summary",
  ]);

  if (written) return written;

  return `Hi, I'm ${getGuruFirstName(guru)}! I'm adding the finishing touches to my profile and can't wait to meet local pets and their people.`;
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

  return Array.from(new Set(cleaned));
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
  const chrome = getMobileChromePalette(isDark);
  return {
    bg: chrome.background,
    shell: isDark ? '#071C14' : BrandColors.warmWhite,
    card: chrome.surface,
    cardSoft: chrome.surfaceSoft,
    cardAlt: isDark ? '#0F2A1F' : BrandColors.cream,
    border: chrome.border,
    borderSoft: isDark ? '#214634' : BrandColors.border,
    title: chrome.title,
    text: chrome.text,
    muted: chrome.muted,
    placeholder: chrome.placeholder,
    primary: chrome.guruPrimary,
    primaryDark: chrome.primaryDark,
    greenBright: chrome.guruPrimary,
    gold: chrome.gold,
    heart: isDark ? '#F0CF62' : '#7FA35C',
    favoriteRed: '#F05252',
    favoriteRedSoft: isDark ? 'rgba(240, 82, 82, 0.16)' : '#FFE7E7',
    disabledBg: isDark ? '#173324' : '#F1EADB',
    disabledText: isDark ? '#AEB9AF' : '#657068',
    frame: '#121714',
    frameBorder: '#2D3430',
    mapWater: isDark ? '#0B282A' : '#BFE4EA',
    mapLand: isDark ? '#173125' : '#F4F1E4',
    mapLandAlt: isDark ? '#1C392B' : '#E7EFD7',
    mapGuide: isDark ? 'rgba(22, 63, 47, 0.12)' : 'rgba(29, 76, 58, 0.1)',
    mapStateLine: isDark ? 'rgba(43, 87, 65, 0.22)' : 'rgba(48, 94, 71, 0.22)',
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
    previewCanvasNative: {
      flex: 1,
      minHeight: 0,
      paddingHorizontal: 0,
      paddingVertical: 0,
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
    deviceFrameNative: {
      backgroundColor: "transparent",
      borderRadius: 0,
      borderWidth: 0,
      flex: 1,
      maxWidth: "100%",
      overflow: "visible",
      paddingBottom: 0,
      paddingHorizontal: 0,
      paddingTop: 0,
      shadowOpacity: 0,
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
    phoneShellNative: {
      borderRadius: 0,
      borderWidth: 0,
      flex: 1,
      height: "100%",
      overflow: "hidden",
    },
    keyboardView: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 84,
      paddingHorizontal: 18,
      paddingTop: 14,
    },
    scrollContentNative: {
      paddingBottom: 108,
      paddingTop: 4,
    },
    scrollContentKeyboard: {
      paddingBottom: 32,
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
      alignItems: "center",
      gap: 8,
      paddingRight: 4,
    },
    serviceChip: {
      alignItems: "center",
      backgroundColor: palette.card,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 44,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    serviceChipSelected: {
      backgroundColor: isDark ? "#13452E" : "#0B6B45",
      borderColor: isDark ? "#2CCB74" : "#0B6B45",
    },
    serviceChipText: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 12,
    },
    serviceChipTextSelected: {
      color: isDark ? "#DFFFEA" : "#FFFFFF",
    },

    refineRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
    },
    refinePill: {
      alignItems: "center",
      backgroundColor: palette.card,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: "row",
      gap: 6,
      minHeight: 38,
      paddingHorizontal: 13,
    },
    refinePillActive: {
      backgroundColor: isDark ? "#13452E" : "#0B6B45",
      borderColor: isDark ? "#2CCB74" : "#0B6B45",
    },
    refinePillText: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 11,
      maxWidth: 108,
    },
    refinePillTextActive: {
      color: isDark ? "#DFFFEA" : "#FFFFFF",
    },
    refineBadge: {
      alignItems: "center",
      backgroundColor: isDark ? "#39D982" : "#F3A631",
      borderRadius: 999,
      justifyContent: "center",
      minWidth: 17,
      paddingHorizontal: 4,
      paddingVertical: 1,
    },
    refineBadgeText: {
      color: isDark ? "#06301E" : "#FFFFFF",
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    refineClearButton: {
      alignItems: "center",
      borderRadius: 999,
      justifyContent: "center",
      minHeight: 38,
      paddingHorizontal: 8,
    },
    refineClearText: {
      color: isDark ? palette.greenBright : palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 11,
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
    emptySecondaryButton: {
      alignItems: "center",
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 34,
      paddingHorizontal: 16,
    },
    emptySecondaryButtonText: {
      color: isDark ? palette.greenBright : palette.primary,
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
      flexGrow: 1,
      paddingBottom: 16,
    },
    mapScrollContentNative: {
      flexGrow: 1,
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
      backgroundColor: isDark ? "#0A241B" : "#FFFFFF",
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
      backgroundColor: isDark ? "#0A2A20" : "#F4FAF6",
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
    guruProfileQuickBook: {
      alignItems: "center",
      backgroundColor: palette.primary,
      borderRadius: 999,
      flexDirection: "row",
      gap: 5,
      left: 11,
      minHeight: 32,
      paddingHorizontal: 11,
      position: "absolute",
      top: 11,
      zIndex: 10,
    },
    guruProfileQuickBookText: {
      color: "#FFFFFF",
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
      letterSpacing: 0.2,
    },
    guruProfileChipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    guruProfileChip: {
      alignItems: "center",
      borderRadius: 999,
      flexDirection: "row",
      gap: 4,
      minHeight: 22,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    guruProfileChipFounding: {
      backgroundColor: "#FFF4D4",
    },
    guruProfileChipFoundingText: {
      color: "#7A4E08",
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
      letterSpacing: 0.2,
      textTransform: "uppercase",
    },
    guruProfileChipVerified: {
      backgroundColor: "#DFF6E8",
    },
    guruProfileChipVerifiedText: {
      color: "#0B4C38",
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    guruProfileChipMuted: {
      backgroundColor: "rgba(255, 255, 255, 0.12)",
    },
    guruProfileChipMutedText: {
      color: "rgba(255, 255, 255, 0.82)",
      fontFamily: AppFonts.bold,
      fontSize: 9,
    },
    guruProfileChipAcademy: {
      backgroundColor: "#E8F8EE",
    },
    guruProfileChipAcademyText: {
      color: "#0B4C38",
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    guruProfileChipMap: {
      backgroundColor: "#E4F2FF",
    },
    guruProfileChipMapText: {
      color: "#185A8A",
      fontFamily: AppFonts.bold,
      fontSize: 9,
    },
    guruProfileChipArea: {
      backgroundColor: "#FFF3D8",
    },
    guruProfileChipAreaText: {
      color: "#7A4E08",
      fontFamily: AppFonts.bold,
      fontSize: 9,
    },
    guruProfileTitle: {
      color: isDark ? "#9BE4B8" : "#2A9D6A",
      fontFamily: AppFonts.bold,
      fontSize: 11,
      lineHeight: 14,
    },
    guruProfileRadius: {
      color: "#78D990",
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
      letterSpacing: 0.3,
      lineHeight: 13,
      textTransform: "uppercase",
    },
    guruProfileStatRow: {
      flexDirection: "row",
      gap: 8,
    },
    guruProfileStatBox: {
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#FFFFFF",
      borderColor: isDark ? "rgba(255, 255, 255, 0.14)" : "#D4E8DC",
      borderRadius: 12,
      borderWidth: 1,
      flex: 1,
      minWidth: 0,
      paddingHorizontal: 8,
      paddingVertical: 8,
    },
    guruProfileStatLabel: {
      color: "rgba(255, 255, 255, 0.58)",
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    guruProfileStatValueRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 4,
      marginTop: 3,
    },
    guruProfileStatValue: {
      color: "#FFFFFF",
      fontFamily: AppFonts.extraBold,
      fontSize: 14,
      letterSpacing: -0.3,
      lineHeight: 18,
      marginTop: 3,
    },
    guruProfileMetaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    guruProfileMetaPill: {
      backgroundColor: "rgba(216, 246, 226, 0.14)",
      borderColor: "rgba(216, 246, 226, 0.28)",
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },
    guruProfileMetaPillText: {
      color: "#D7EEDF",
      fontFamily: AppFonts.bold,
      fontSize: 10,
    },
    guruProfileActionRow: {
      flexDirection: "row",
      gap: 8,
    },
    guruProfileMeetButton: {
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderColor: "rgba(255, 255, 255, 0.28)",
      borderRadius: 999,
      borderWidth: 1,
      flex: 1,
      justifyContent: "center",
      minHeight: 42,
      paddingHorizontal: 10,
    },
    guruProfileMeetButtonText: {
      color: "#FFFFFF",
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
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
      color: isDark ? "#FFFFFF" : "#0F3D2A",
      fontFamily: AppFonts.extraBold,
      fontSize: 20,
      letterSpacing: -0.45,
      lineHeight: 23,
    },
    guruProfileLocation: {
      color: isDark ? "rgba(255, 255, 255, 0.76)" : "#2A5C45",
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 14,
    },
    guruProfilePriceRow: {
      alignItems: "center",
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#EEF8F2",
      borderColor: isDark ? "rgba(223, 246, 232, 0.22)" : "#D4E8DC",
      borderRadius: 13,
      borderWidth: 1,
      flexDirection: "row",
      gap: 10,
      justifyContent: "space-between",
      paddingHorizontal: 11,
      paddingVertical: 9,
    },
    guruProfilePriceCopy: {
      flex: 1,
      gap: 1,
      minWidth: 0,
    },
    guruProfilePriceLabel: {
      color: isDark ? "#BFE9D0" : "#1F7A52",
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    guruProfilePriceDetail: {
      color: isDark ? "rgba(255, 255, 255, 0.78)" : "#2A5C45",
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
    },
    guruProfilePriceValue: {
      color: isDark ? "#FFFFFF" : "#0F3D2A",
      fontFamily: AppFonts.extraBold,
      fontSize: 17,
      letterSpacing: -0.4,
      lineHeight: 21,
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
      color: isDark ? "rgba(255, 255, 255, 0.72)" : "#6B8A78",
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
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#FFFFFF",
      borderColor: isDark ? "rgba(255, 255, 255, 0.25)" : "#B8D9C8",
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: "row",
      gap: 4,
      minHeight: 24,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    guruProfileServiceIcon: {
      color: isDark ? "#D7EEDF" : "#2A9D6A",
    },
    guruProfileServiceText: {
      color: isDark ? "#F1F7F3" : "#0F3D2A",
      fontFamily: AppFonts.bold,
      fontSize: 8,
      lineHeight: 10,
    },
    guruProfileAboutBlock: {
      gap: 2,
    },
    guruProfileAboutLabel: {
      color: isDark ? "#FFFFFF" : "#0F3D2A",
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
      lineHeight: 14,
    },
    guruProfileAboutText: {
      color: isDark ? "rgba(255, 255, 255, 0.76)" : "#2A5C45",
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
      color: isDark ? "#C8EBD4" : "#1F7A52",
      fontFamily: AppFonts.bold,
      fontSize: 9,
      lineHeight: 12,
    },
    guruProfileRequestButton: {
      alignItems: "center",
      backgroundColor: palette.primary,
      borderColor: palette.primary,
      borderRadius: 18,
      borderWidth: 1,
      flex: 1,
      justifyContent: "center",
      minHeight: 54,
      paddingHorizontal: 10,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 8,
    },
    guruProfileRequestButtonSecondary: {
      backgroundColor: isDark ? "transparent" : "#FFFFFF",
      borderColor: isDark ? "rgba(255, 255, 255, 0.38)" : palette.primary,
    },
    guruProfileRequestButtonText: {
      color: "#FFFFFF",
      fontFamily: AppFonts.extraBold,
      fontSize: 15,
      letterSpacing: 0.05,
    },
    guruProfileBookNote: {
      color: isDark ? "rgba(255, 255, 255, 0.62)" : "#6B8A78",
      fontFamily: AppFonts.semiBold,
      fontSize: 9,
      lineHeight: 12,
      marginTop: 6,
      textAlign: "center",
    },
    guruProfileRequestButtonTextSecondary: {
      color: isDark ? "#E8F8EE" : palette.primary,
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
    mapExplorerStageNative: {
      flex: 1,
      height: undefined,
      minHeight: 360,
    },
    listMapStage: {
      backgroundColor: palette.mapWater,
      borderColor: palette.border,
      borderRadius: 28,
      borderWidth: 1,
      height: 300,
      marginBottom: 18,
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
    mapGuruPreviewPriceBlock: {
      alignItems: "flex-end",
      maxWidth: 96,
    },
    mapGuruPreviewRate: {
      color: palette.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
      lineHeight: 16,
    },
    mapGuruPreviewRateNote: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      letterSpacing: 0.3,
      lineHeight: 11,
      textTransform: "uppercase",
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
    mapExpandedPriceBlock: {
      gap: 1,
      maxWidth: 132,
      minWidth: 92,
    },
    mapExpandedPrice: {
      color: palette.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 19,
      letterSpacing: -0.35,
    },
    mapExpandedPriceNote: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 11,
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
      borderColor: isDark ? "#48D78E" : palette.primaryDark,
      borderRadius: 18,
      borderWidth: 1,
      bottom: 92,
      flexDirection: "row",
      gap: 8,
      justifyContent: "center",
      left: 18,
      minHeight: 54,
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

    homeIndicator: {
      alignSelf: "center",
      backgroundColor: "#F4F2EC",
      borderRadius: 999,
      height: 5,
      marginTop: 10,
      opacity: 0.9,
      width: 120,
    },

    sheetOverlay: {
      bottom: 0,
      justifyContent: "flex-end",
      left: 0,
      position: "absolute",
      right: 0,
      top: 0,
      zIndex: 80,
    },
    sheetBackdrop: {
      backgroundColor: isDark
        ? "rgba(2, 12, 8, 0.72)"
        : "rgba(9, 40, 28, 0.42)",
      bottom: 0,
      left: 0,
      position: "absolute",
      right: 0,
      top: 0,
    },
    sheetCard: {
      backgroundColor: palette.card,
      borderColor: palette.border,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      borderWidth: 1,
      maxHeight: "82%",
      paddingBottom: 16,
      paddingHorizontal: 16,
      paddingTop: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -10 },
      shadowOpacity: isDark ? 0.4 : 0.18,
      shadowRadius: 22,
    },
    sheetHandle: {
      alignSelf: "center",
      backgroundColor: palette.border,
      borderRadius: 999,
      height: 4,
      marginBottom: 12,
      width: 42,
    },
    sheetHeaderRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
      justifyContent: "space-between",
    },
    sheetHeaderCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    sheetTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 18,
      letterSpacing: -0.3,
    },
    sheetSubtitle: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 11,
      lineHeight: 15,
    },
    sheetCloseButton: {
      alignItems: "center",
      backgroundColor: palette.cardSoft,
      borderColor: palette.borderSoft,
      borderRadius: 999,
      borderWidth: 1,
      height: 34,
      justifyContent: "center",
      width: 34,
    },
    sheetClearButton: {
      alignItems: "center",
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 32,
      paddingHorizontal: 12,
    },
    sheetClearText: {
      color: isDark ? palette.greenBright : palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },

    sheetOptionList: {
      gap: 8,
      marginTop: 14,
    },
    sheetOptionRow: {
      alignItems: "center",
      backgroundColor: palette.cardSoft,
      borderColor: palette.borderSoft,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: "row",
      gap: 10,
      minHeight: 56,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    sheetOptionRowSelected: {
      backgroundColor: isDark ? "#13452E" : "#0B6B45",
      borderColor: isDark ? "#2CCB74" : "#0B6B45",
    },
    sheetOptionRowUnavailable: {
      backgroundColor: palette.disabledBg,
      borderStyle: "dashed",
    },
    sheetOptionCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    sheetOptionLabel: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
    },
    sheetOptionLabelSelected: {
      color: isDark ? "#DFFFEA" : "#FFFFFF",
    },
    sheetOptionDetail: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 14,
    },
    sheetOptionDetailSelected: {
      color: isDark ? "rgba(223, 255, 234, 0.82)" : "rgba(255, 255, 255, 0.84)",
    },
    sheetOptionCheck: {
      alignItems: "center",
      backgroundColor: isDark ? "rgba(57, 217, 130, 0.22)" : "rgba(255, 255, 255, 0.22)",
      borderRadius: 999,
      height: 24,
      justifyContent: "center",
      width: 24,
    },

    sheetScroll: {
      marginTop: 14,
    },
    sheetScrollContent: {
      gap: 16,
      paddingBottom: 6,
    },
    sheetGroup: {
      gap: 8,
    },
    sheetGroupLabel: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
    },
    sheetGroupNote: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
    },
    sheetChipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7,
    },
    sheetChip: {
      alignItems: "center",
      backgroundColor: palette.cardSoft,
      borderColor: palette.borderSoft,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: "row",
      gap: 4,
      justifyContent: "center",
      minHeight: 38,
      paddingHorizontal: 13,
    },
    sheetChipSelected: {
      backgroundColor: isDark ? "#13452E" : "#0B6B45",
      borderColor: isDark ? "#2CCB74" : "#0B6B45",
    },
    sheetChipText: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    sheetChipTextSelected: {
      color: isDark ? "#DFFFEA" : "#FFFFFF",
    },

    sheetApplyButton: {
      alignItems: "center",
      backgroundColor: isDark ? "#1D8E55" : palette.primary,
      borderRadius: 14,
      justifyContent: "center",
      marginTop: 14,
      minHeight: 46,
    },
    sheetApplyButtonText: {
      color: "#FFFFFF",
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
    },
  });
}