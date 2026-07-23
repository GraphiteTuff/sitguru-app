import { router } from 'expo-router';
import {
  Bell,
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock,
  Droplets,
  FileText,
  Footprints,
  HelpCircle,
  Home,
  MapPin,
  MessageCircle,
  Navigation,
  PawPrint,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import RoleGate from '@/components/RoleGate';
import { SitGuruIcon } from '@/components/SitGuruIcon';
import SitGuruRoleStatus from '@/components/SitGuruRoleStatus';
import SitGuruScreen from '@/components/SitGuruScreen';
import SitGuruWorkspaceSwitcher from '@/components/SitGuruWorkspaceSwitcher';
import { AppFonts } from '@/constants/fonts';
import {
  setThemePreference,
  type SitGuruThemePreference,
  useThemePreference,
} from '@/hooks/use-color-scheme';
import { useThemeMode } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { resolveSupabaseStorageUrl } from '@/lib/storage';

type RecordRow = Record<string, unknown>;

type ThemeOption = {
  icon: 'sun' | 'moon';
  label: string;
  value: SitGuruThemePreference;
};

type TimelineUpdate = {
  detail: string;
  icon: ReactNode;
  id: string;
  time: string;
  title: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  { icon: 'sun', label: 'Light', value: 'light' },
  { icon: 'moon', label: 'Dark', value: 'dark' },
];

export default function PawReportLiveScreen() {
  const { width } = useWindowDimensions();
  const { user, profile } = useAuth();
  const isWebPreview = Platform.OS === 'web';
  const isTablet = Platform.OS !== 'web' && width >= 768;

  const themeMode = useThemeMode();
  const themePreference = useThemePreference();
  const isDark = themeMode === 'dark';
  const palette = getPalette(isDark);
  const styles = createStyles(isDark);

  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false);

  const profileRecord = useMemo(
    () => (profile ?? {}) as RecordRow,
    [profile],
  );

  const profileName =
    firstString(profileRecord, ['full_name', 'display_name']) ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    user?.email?.split('@')[0] ||
    'Pet Parent';

  const avatarUrl = resolveSupabaseStorageUrl(
    firstString(profileRecord, [
      'avatar_url',
      'photo_url',
      'profile_photo_url',
      'profile_image_url',
    ]),
  );

  const timelineUpdates = useMemo<TimelineUpdate[]>(
    () => [
      {
        detail: 'Scout’s walk started with Jordan.',
        icon: (
          <Footprints
            color={palette.primary}
            size={17}
            strokeWidth={2.4}
          />
        ),
        id: 'walk-started',
        time: '12:30 PM',
        title: 'Walk started',
      },
      {
        detail: 'Potty break completed during the walk.',
        icon: (
          <PawPrint
            color={palette.primary}
            size={17}
            strokeWidth={2.4}
          />
        ),
        id: 'potty-update',
        time: '12:38 PM',
        title: 'Potty update',
      },
      {
        detail: 'Fresh water was offered after a shady rest.',
        icon: (
          <Droplets
            color={palette.primary}
            size={17}
            strokeWidth={2.4}
          />
        ),
        id: 'water-update',
        time: '12:44 PM',
        title: 'Water refreshed',
      },
      {
        detail: 'A new care photo was added to Scout’s report.',
        icon: (
          <Camera
            color={palette.primary}
            size={17}
            strokeWidth={2.4}
          />
        ),
        id: 'photo-update',
        time: '12:48 PM',
        title: 'Photo added',
      },
      {
        detail: 'Scout is walking calmly and doing great.',
        icon: (
          <FileText
            color={palette.primary}
            size={17}
            strokeWidth={2.4}
          />
        ),
        id: 'care-note',
        time: 'Now',
        title: 'Care note',
      },
    ],
    [palette.primary],
  );

  return (
    <SitGuruScreen
      center={isWebPreview || isTablet}
      maxWidth={isTablet ? 920 : 620}
    >
      <RoleGate requiredRole="pet_parent">
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
                  contentContainerStyle={[
                    styles.scrollContent,
                    isTablet && styles.scrollContentTablet,
                  ]}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.header}>
                    <Pressable
                      accessibilityLabel="Back to Pet Parent Dashboard"
                      accessibilityRole="button"
                      hitSlop={8}
                      onPress={() => router.push('/pet-parent-dashboard')}
                      style={({ pressed }) => [
                        styles.backButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <ChevronLeft
                        color={palette.primary}
                        size={22}
                        strokeWidth={2.5}
                      />
                    </Pressable>

                    <View style={styles.headerCopy}>
                      <Text style={styles.pageTitle}>PawReport Live</Text>
                      <Text style={styles.pageSubtitle}>
                        Scout’s walk • Live now
                      </Text>
                      <SitGuruRoleStatus role="pet_parent" />
                    </View>

                    <View style={styles.headerActions}>
                      <Pressable
                        accessibilityLabel="Open notifications"
                        accessibilityRole="button"
                        onPress={() => router.push('/notifications')}
                        style={({ pressed }) => [
                          styles.headerIconButton,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Bell
                          color={palette.title}
                          size={18}
                          strokeWidth={2.3}
                        />
                      </Pressable>

                      <View style={styles.modeToggle}>
                        {THEME_OPTIONS.map((option) => {
                          const active = themePreference === option.value;

                          return (
                            <Pressable
                              key={option.value}
                              accessibilityLabel={`Switch to ${option.label} mode`}
                              accessibilityRole="button"
                              accessibilityState={{ selected: active }}
                              onPress={() => setThemePreference(option.value)}
                              style={[
                                styles.modeButton,
                                active && styles.modeButtonActive,
                              ]}
                            >
                              <SitGuruIcon
                                color={
                                  active
                                    ? option.value === 'light'
                                      ? '#F3AA1F'
                                      : isDark
                                        ? '#F0CF62'
                                        : palette.primary
                                    : palette.muted
                                }
                                name={option.icon}
                                size={15}
                                strokeWidth={2.4}
                              />
                            </Pressable>
                          );
                        })}
                      </View>

                      <Pressable
                        accessibilityLabel="Switch workspace"
                        accessibilityRole="button"
                        onPress={() => setWorkspaceSwitcherOpen(true)}
                        style={({ pressed }) => [
                          styles.profileButton,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Avatar
                          fallback={initials(profileName)}
                          imageUrl={avatarUrl}
                          palette={palette}
                          size={40}
                        />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.liveHero}>
                    <View style={styles.liveHeroTopRow}>
                      <View style={styles.liveEyebrowRow}>
                        <View style={styles.livePulse} />
                        <Text style={styles.liveEyebrow}>LIVE WALK</Text>
                      </View>

                      <View style={styles.liveBadge}>
                        <Text style={styles.liveBadgeText}>LIVE</Text>
                      </View>
                    </View>

                    <Text style={styles.liveTitle}>Scout is out walking</Text>
                    <Text style={styles.liveSubtitle}>
                      Follow Jordan’s updates, route, photos, and care notes as
                      they happen.
                    </Text>

                    <View style={styles.heroMetrics}>
                      <HeroMetric label="Elapsed" value="18 min" styles={styles} />
                      <View style={styles.heroMetricDivider} />
                      <HeroMetric label="Distance" value="0.7 mi" styles={styles} />
                      <View style={styles.heroMetricDivider} />
                      <HeroMetric label="Updated" value="Now" styles={styles} />
                    </View>
                  </View>

                  <View style={styles.previewNotice}>
                    <ShieldCheck
                      color={palette.primary}
                      size={17}
                      strokeWidth={2.4}
                    />
                    <Text style={styles.previewNoticeText}>
                      Preview mode: live GPS, photos, and push alerts are not
                      connected yet.
                    </Text>
                  </View>

                  <View style={styles.peopleCard}>
                    <PersonSummary
                      detail="Walking now"
                      icon={
                        <UserRound
                          color={palette.primary}
                          size={19}
                          strokeWidth={2.3}
                        />
                      }
                      label="Guru"
                      name="Jordan P."
                      styles={styles}
                    />

                    <View style={styles.peopleDivider} />

                    <PersonSummary
                      detail="30-minute walk"
                      icon={
                        <PawPrint
                          color={palette.primary}
                          size={19}
                          strokeWidth={2.3}
                        />
                      }
                      label="Pet"
                      name="Scout"
                      styles={styles}
                    />
                  </View>

                  <View style={styles.sectionHeader}>
                    <View>
                      <Text style={styles.sectionEyebrow}>LIVE ROUTE</Text>
                      <Text style={styles.sectionTitle}>Walk progress</Text>
                    </View>

                    <View style={styles.routeStatusPill}>
                      <Navigation
                        color={palette.primary}
                        size={13}
                        strokeWidth={2.4}
                      />
                      <Text style={styles.routeStatusText}>Tracking</Text>
                    </View>
                  </View>

                  <MapCard palette={palette} styles={styles} />

                  <View style={styles.statGrid}>
                    <StatCard
                      icon={
                        <Clock
                          color={palette.primary}
                          size={18}
                          strokeWidth={2.4}
                        />
                      }
                      label="Elapsed"
                      value="18 min"
                      styles={styles}
                    />
                    <StatCard
                      icon={
                        <Navigation
                          color={palette.primary}
                          size={18}
                          strokeWidth={2.4}
                        />
                      }
                      label="Distance"
                      value="0.7 mi"
                      styles={styles}
                    />
                    <StatCard
                      icon={
                        <CalendarDays
                          color={palette.primary}
                          size={18}
                          strokeWidth={2.4}
                        />
                      }
                      label="ETA"
                      value="12 min"
                      styles={styles}
                    />
                    <StatCard
                      icon={
                        <MapPin
                          color={palette.primary}
                          size={18}
                          strokeWidth={2.4}
                        />
                      }
                      label="Last update"
                      value="Now"
                      styles={styles}
                    />
                  </View>

                  <View style={styles.sectionHeader}>
                    <View>
                      <Text style={styles.sectionEyebrow}>PAWREPORT</Text>
                      <Text style={styles.sectionTitle}>Live updates</Text>
                    </View>
                    <Text style={styles.sectionMeta}>5 updates</Text>
                  </View>

                  <View style={styles.timelineCard}>
                    {timelineUpdates.map((update, index) => (
                      <TimelineRow
                        key={update.id}
                        detail={update.detail}
                        icon={update.icon}
                        last={index === timelineUpdates.length - 1}
                        time={update.time}
                        title={update.title}
                        styles={styles}
                      />
                    ))}
                  </View>

                  <View style={styles.safetyCard}>
                    <View style={styles.safetyIcon}>
                      <ShieldCheck
                        color={palette.primary}
                        size={20}
                        strokeWidth={2.4}
                      />
                    </View>

                    <View style={styles.safetyCopy}>
                      <Text style={styles.safetyTitle}>Safety and privacy</Text>
                      <Text style={styles.safetyText}>
                        Live tracking only runs during active care and should be
                        visible only to the Pet Parent, assigned Guru, and
                        SitGuru Support.
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push('/conversation')}
                    style={({ pressed }) => [
                      styles.messageButton,
                      pressed && styles.primaryPressed,
                    ]}
                  >
                    <MessageCircle
                      color="#FFFFFF"
                      size={19}
                      strokeWidth={2.4}
                    />
                    <Text style={styles.messageButtonText}>Message Jordan</Text>
                  </Pressable>

                  <View style={styles.actionCard}>
                    <ActionRow
                      icon={
                        <CalendarDays
                          color={palette.primary}
                          size={18}
                          strokeWidth={2.3}
                        />
                      }
                      label="View booking"
                      onPress={() => router.push('/booking-details')}
                      palette={palette}
                      styles={styles}
                    />
                    <ActionRow
                      icon={
                        <Bell
                          color={palette.primary}
                          size={18}
                          strokeWidth={2.3}
                        />
                      }
                      label="Notifications"
                      onPress={() => router.push('/notifications')}
                      palette={palette}
                      styles={styles}
                    />
                    <ActionRow
                      icon={
                        <HelpCircle
                          color={palette.primary}
                          size={18}
                          strokeWidth={2.3}
                        />
                      }
                      label="Help and support"
                      last
                      onPress={() => router.push('/support')}
                      palette={palette}
                      styles={styles}
                    />
                  </View>
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
                    label="Home"
                    onPress={() => router.push('/pet-parent-dashboard')}
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
                    label="Explore"
                    onPress={() => router.push('/find-care')}
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
                    onPress={() => router.push('/booking-details')}
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
                    onPress={() => router.push('/messages')}
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
                    onPress={() => setWorkspaceSwitcherOpen(true)}
                    styles={styles}
                  />
                </View>

                <SitGuruWorkspaceSwitcher
                  currentRole="pet_parent"
                  onClose={() => setWorkspaceSwitcherOpen(false)}
                  visible={workspaceSwitcherOpen}
                />
              </View>
            </View>

            {isWebPreview ? <View style={styles.homeIndicator} /> : null}
          </View>
        </View>
      </RoleGate>
    </SitGuruScreen>
  );
}

function HeroMetric({
  label,
  styles,
  value,
}: {
  label: string;
  styles: ReturnType<typeof createStyles>;
  value: string;
}) {
  return (
    <View style={styles.heroMetric}>
      <Text style={styles.heroMetricValue}>{value}</Text>
      <Text style={styles.heroMetricLabel}>{label}</Text>
    </View>
  );
}

function PersonSummary({
  detail,
  icon,
  label,
  name,
  styles,
}: {
  detail: string;
  icon: ReactNode;
  label: string;
  name: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.personSummary}>
      <View style={styles.personIcon}>{icon}</View>
      <View style={styles.personCopy}>
        <Text style={styles.personLabel}>{label}</Text>
        <Text style={styles.personName}>{name}</Text>
        <Text style={styles.personDetail}>{detail}</Text>
      </View>
    </View>
  );
}

function StatCard({
  icon,
  label,
  styles,
  value,
}: {
  icon: ReactNode;
  label: string;
  styles: ReturnType<typeof createStyles>;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <View style={styles.statCopy}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function TimelineRow({
  detail,
  icon,
  last = false,
  styles,
  time,
  title,
}: {
  detail: string;
  icon: ReactNode;
  last?: boolean;
  styles: ReturnType<typeof createStyles>;
  time: string;
  title: string;
}) {
  return (
    <View style={[styles.timelineRow, last && styles.timelineRowLast]}>
      <View style={styles.timelineIcon}>{icon}</View>
      <View style={styles.timelineCopy}>
        <View style={styles.timelineTitleRow}>
          <Text style={styles.timelineTitle}>{title}</Text>
          <Text style={styles.timelineTime}>{time}</Text>
        </View>
        <Text style={styles.timelineDetail}>{detail}</Text>
      </View>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  last = false,
  onPress,
  palette,
  styles,
}: {
  icon: ReactNode;
  label: string;
  last?: boolean;
  onPress: () => void;
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        last && styles.actionRowLast,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.actionIcon}>{icon}</View>
      <Text style={styles.actionLabel}>{label}</Text>
      <ChevronRight
        color={palette.muted}
        size={18}
        strokeWidth={2.3}
      />
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

function MapCard({
  palette,
  styles,
}: {
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.mapCard}>
      <View style={styles.mapCanvas}>
        <View style={styles.mapBlockOne} />
        <View style={styles.mapBlockTwo} />
        <View style={styles.mapPark} />
        <View style={[styles.route, styles.routeOne]} />
        <View style={[styles.route, styles.routeTwo]} />
        <View style={[styles.routeNode, styles.startNode]} />
        <View style={[styles.routeNode, styles.endNode]} />

        <View style={styles.mapPin}>
          <PawPrint
            color={palette.primary}
            size={18}
            strokeWidth={2.5}
          />
        </View>

        <View style={styles.routePreviewPill}>
          <Navigation
            color={palette.primary}
            size={13}
            strokeWidth={2.4}
          />
          <Text style={styles.routePreviewText}>Live route preview</Text>
        </View>
      </View>
    </View>
  );
}

function Avatar({
  fallback,
  imageUrl,
  palette,
  size,
}: {
  fallback: string;
  imageUrl?: string | null;
  palette: ReturnType<typeof getPalette>;
  size: number;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !imageFailed;

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
      {showImage ? (
        <Image
          onError={() => setImageFailed(true)}
          resizeMode="cover"
          source={{ uri: imageUrl as string }}
          style={{ height: '100%', width: '100%' }}
        />
      ) : (
        <Text
          style={{
            color: palette.primary,
            fontFamily: AppFonts.extraBold,
            fontSize: Math.max(11, size * 0.28),
          }}
        >
          {fallback}
        </Text>
      )}
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
        <View style={styles.batteryWrap}>
          <View style={styles.batteryBody}>
            <View style={styles.batteryFill} />
          </View>
          <View style={styles.batteryCap} />
        </View>
      </View>
    </View>
  );
}

function firstString(record: RecordRow, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return 'PP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getPalette(isDark: boolean) {
  return {
    avatarBg: isDark ? '#173527' : '#EEF5EE',
    avatarBorder: isDark ? '#2E6C4B' : '#FFFFFF',
    background: isDark ? '#06140F' : '#FFF9F1',
    border: isDark ? '#234B38' : '#EADDCB',
    borderStrong: isDark ? '#2D6548' : '#D8C7B0',
    muted: isDark ? '#9DB0A5' : '#738078',
    navMuted: isDark ? '#9BAAA1' : '#748079',
    primary: isDark ? '#39D982' : '#087449',
    primaryDark: isDark ? '#1C9F5E' : '#075D3B',
    primarySoft: isDark ? '#123E2A' : '#E4F5E9',
    routeBg: isDark ? '#142A22' : '#EDF3EE',
    routeStreet: isDark ? '#284538' : '#D8E1DA',
    shadow: '#000000',
    surface: isDark ? '#0B2118' : '#FFFEFA',
    surfaceSoft: isDark ? '#102D21' : '#FFF6E9',
    text: isDark ? '#E8EEE9' : '#27483E',
    title: isDark ? '#FFF5E8' : '#123F31',
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
      overflow: 'visible',
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
    homeIndicator: {
      alignSelf: 'center',
      backgroundColor: '#F3F1EA',
      borderRadius: 999,
      height: 5,
      marginTop: 9,
      opacity: 0.95,
      width: 116,
    },
    screen: {
      backgroundColor: palette.background,
      flex: 1,
      width: '100%',
    },
    statusBar: {
      alignItems: 'center',
      backgroundColor: palette.background,
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
    statusIcons: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
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
      lineHeight: 12,
    },
    batteryWrap: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 2,
    },
    batteryBody: {
      borderColor: palette.title,
      borderRadius: 3,
      borderWidth: 1.1,
      height: 9,
      padding: 1,
      width: 17,
    },
    batteryFill: {
      backgroundColor: palette.title,
      borderRadius: 2,
      flex: 1,
    },
    batteryCap: {
      backgroundColor: palette.title,
      borderRadius: 1,
      height: 4,
      width: 2,
    },
    scrollContent: {
      gap: 13,
      paddingBottom: 112,
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    scrollContentTablet: {
      alignSelf: 'center',
      maxWidth: 860,
      paddingHorizontal: 24,
      width: '100%',
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    backButton: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    headerCopy: {
      flex: 1,
      gap: 1,
      minWidth: 0,
    },
    pageTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 18,
      letterSpacing: -0.35,
      lineHeight: 21,
    },
    pageSubtitle: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 10,
    },
    headerActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 5,
    },
    headerIconButton: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 36,
      justifyContent: 'center',
      width: 36,
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
      width: 29,
    },
    modeButtonActive: {
      backgroundColor: isDark ? 'rgba(226,170,45,0.18)' : '#FFF4D8',
    },
    profileButton: {
      borderRadius: 999,
    },
    liveHero: {
      backgroundColor: isDark ? '#087A4C' : '#087F50',
      borderRadius: 23,
      gap: 8,
      padding: 15,
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 9 },
      shadowOpacity: isDark ? 0.25 : 0.13,
      shadowRadius: 17,
    },
    liveHeroTopRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    liveEyebrowRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    livePulse: {
      backgroundColor: '#70F5A7',
      borderRadius: 999,
      height: 8,
      width: 8,
    },
    liveEyebrow: {
      color: 'rgba(255,255,255,0.78)',
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
      letterSpacing: 0.9,
    },
    liveBadge: {
      backgroundColor: '#FFFFFF',
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },
    liveBadgeText: {
      color: '#087449',
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    liveTitle: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 23,
      letterSpacing: -0.55,
      lineHeight: 28,
    },
    liveSubtitle: {
      color: 'rgba(255,255,255,0.86)',
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 15,
    },
    heroMetrics: {
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderRadius: 16,
      flexDirection: 'row',
      marginTop: 3,
      minHeight: 56,
      paddingHorizontal: 8,
    },
    heroMetric: {
      alignItems: 'center',
      flex: 1,
      gap: 1,
    },
    heroMetricValue: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 14,
    },
    heroMetricLabel: {
      color: 'rgba(255,255,255,0.72)',
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
    heroMetricDivider: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      height: 30,
      width: 1,
    },
    previewNotice: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.border,
      borderRadius: 15,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 8,
      padding: 10,
    },
    previewNoticeText: {
      color: palette.text,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 14,
    },
    peopleCard: {
      alignItems: 'stretch',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 19,
      borderWidth: 1,
      flexDirection: 'row',
      minHeight: 78,
      padding: 11,
    },
    peopleDivider: {
      backgroundColor: palette.border,
      marginHorizontal: 8,
      width: 1,
    },
    personSummary: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      gap: 8,
      minWidth: 0,
    },
    personIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 12,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    personCopy: {
      flex: 1,
      minWidth: 0,
    },
    personLabel: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 7,
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    personName: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
    },
    personDetail: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      marginTop: 1,
    },
    sectionHeader: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 1,
    },
    sectionEyebrow: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 8,
      letterSpacing: 0.9,
    },
    sectionTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 18,
      letterSpacing: -0.35,
      lineHeight: 22,
    },
    sectionMeta: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 9,
    },
    routeStatusPill: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },
    routeStatusText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    mapCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      padding: 10,
    },
    mapCanvas: {
      backgroundColor: palette.routeBg,
      borderRadius: 16,
      height: 184,
      overflow: 'hidden',
      position: 'relative',
    },
    mapBlockOne: {
      backgroundColor: palette.surface,
      borderRadius: 14,
      height: 58,
      left: 15,
      position: 'absolute',
      top: 16,
      width: 94,
    },
    mapBlockTwo: {
      backgroundColor: palette.surface,
      borderRadius: 14,
      bottom: 18,
      height: 53,
      position: 'absolute',
      right: 16,
      width: 108,
    },
    mapPark: {
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      height: 68,
      position: 'absolute',
      right: 24,
      top: 19,
      width: 68,
    },
    route: {
      backgroundColor: palette.primary,
      borderRadius: 999,
      height: 6,
      position: 'absolute',
    },
    routeOne: {
      left: 43,
      top: 101,
      transform: [{ rotate: '18deg' }],
      width: 145,
    },
    routeTwo: {
      left: 135,
      top: 83,
      transform: [{ rotate: '-28deg' }],
      width: 90,
    },
    routeNode: {
      backgroundColor: palette.surface,
      borderColor: palette.primary,
      borderRadius: 999,
      borderWidth: 3,
      height: 18,
      position: 'absolute',
      width: 18,
    },
    startNode: {
      left: 39,
      top: 94,
    },
    endNode: {
      right: 50,
      top: 52,
    },
    mapPin: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 38,
      justifyContent: 'center',
      left: 128,
      position: 'absolute',
      top: 72,
      width: 38,
    },
    routePreviewPill: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      bottom: 10,
      flexDirection: 'row',
      gap: 5,
      left: 10,
      paddingHorizontal: 9,
      paddingVertical: 6,
      position: 'absolute',
    },
    routePreviewText: {
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 8,
    },
    statGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    statCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 16,
      borderWidth: 1,
      flexBasis: '47%',
      flexDirection: 'row',
      flexGrow: 1,
      gap: 9,
      minHeight: 62,
      padding: 10,
    },
    statIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 11,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    statCopy: {
      flex: 1,
    },
    statValue: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
    },
    statLabel: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      marginTop: 1,
    },
    timelineCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      overflow: 'hidden',
    },
    timelineRow: {
      alignItems: 'flex-start',
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 9,
      minHeight: 65,
      padding: 11,
    },
    timelineRowLast: {
      borderBottomWidth: 0,
    },
    timelineIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 11,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    timelineCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    timelineTitleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'space-between',
    },
    timelineTitle: {
      color: palette.title,
      flex: 1,
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
    },
    timelineTime: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 8,
    },
    timelineDetail: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
    },
    safetyCard: {
      alignItems: 'flex-start',
      backgroundColor: palette.primarySoft,
      borderColor: palette.borderStrong,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      padding: 12,
    },
    safetyIcon: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderRadius: 12,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    safetyCopy: {
      flex: 1,
      gap: 3,
    },
    safetyTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
    },
    safetyText: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 14,
    },
    messageButton: {
      alignItems: 'center',
      backgroundColor: isDark ? '#087A4C' : '#087F50',
      borderRadius: 17,
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
      minHeight: 54,
      paddingHorizontal: 16,
    },
    messageButtonText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
    },
    actionCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 19,
      borderWidth: 1,
      overflow: 'hidden',
    },
    actionRow: {
      alignItems: 'center',
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 9,
      minHeight: 54,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    actionRowLast: {
      borderBottomWidth: 0,
    },
    actionIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 10,
      height: 32,
      justifyContent: 'center',
      width: 32,
    },
    actionLabel: {
      color: palette.title,
      flex: 1,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    pressed: {
      opacity: 0.72,
      transform: [{ scale: 0.985 }],
    },
    primaryPressed: {
      opacity: 0.86,
      transform: [{ scale: 0.99 }],
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
      justifyContent: 'space-around',
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