import { router, useLocalSearchParams } from 'expo-router';
import {
  Bell,
  CalendarDays,
  ChevronRight,
  CreditCard,
  Gift,
  MapPin,
  MessageCircle,
  PawPrint,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import RoleGate from '@/components/RoleGate';
import MobileScreen from '@/components/mobile/MobileScreen';
import PriorityCarousel, {
  type PriorityCard,
} from '@/components/mobile/PriorityCarousel';
import ServiceCoreGrid, {
  CARE_SERVICES,
  type CareServiceKey,
} from '@/components/mobile/ServiceCoreGrid';
import { DashboardSkeletonStack } from '@/components/mobile/SkeletonPanel';
import StickyActionBar from '@/components/mobile/StickyActionBar';
import TouchTarget from '@/components/mobile/TouchTarget';
import SitGuruButton from '@/components/SitGuruButton';
import { SitGuruIcon } from '@/components/SitGuruIcon';
import SitGuruRoleStatus from '@/components/SitGuruRoleStatus';
import SitGuruScreen from '@/components/SitGuruScreen';
import SitGuruTabBar from '@/components/SitGuruTabBar';
import SitGuruWorkspaceSwitcher from '@/components/SitGuruWorkspaceSwitcher';
import { isVisitReviewClosed } from '@/lib/reviews/visit-review';
import { AI_COMPANIONS } from '@/constants/companions';
import { AppFonts } from '@/constants/fonts';
import {
  StickyFooterClearance,
  TOUCH_MIN,
} from '@/constants/mobile-layout';
import {
  setThemePreference,
  type SitGuruThemePreference,
  useThemePreference,
} from '@/hooks/use-color-scheme';
import { useThemeMode } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { resolveSupabaseStorageUrl } from '@/lib/storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type RecordRow = Record<string, unknown>;

type ThemeOption = {
  label: string;
  value: SitGuruThemePreference;
  icon: 'sun' | 'moon';
};

type DashboardPet = {
  id: string;
  name: string;
  species: string;
  breed: string;
  ageLabel: string;
  photoUrl: string | null;
  complete: boolean;
};

type DashboardBooking = {
  id: string;
  status: string;
  serviceLabel: string;
  startAt: Date | null;
  endAt: Date | null;
  guruName: string;
  guruPhotoUrl: string | null;
  petName: string;
  petPhotoUrl: string | null;
  location: string;
  active: boolean;
  completed: boolean;
};

type LiveCare = {
  id: string;
  bookingId: string;
  status: string;
  isWalk: boolean;
  serviceLabel: string;
  petName: string;
  petPhotoUrl: string | null;
  guruName: string;
  guruPhotoUrl: string | null;
  startedAt: Date | null;
  endedAt: Date | null;
  durationMinutes: number | null;
  distanceMiles: number | null;
  latestUpdate: string;
  latestUpdateAt: Date | null;
  routePointCount: number;
  photoCount: number;
};

type DashboardData = {
  bookings: DashboardBooking[];
  pets: DashboardPet[];
  unreadMessages: number;
  unreadNotifications: number;
  activeCare: LiveCare | null;
  recentCompletedCare: LiveCare | null;
};

const EMPTY_DATA: DashboardData = {
  bookings: [],
  pets: [],
  unreadMessages: 0,
  unreadNotifications: 0,
  activeCare: null,
  recentCompletedCare: null,
};

const themeOptions: ThemeOption[] = [
  { label: 'Light', value: 'light', icon: 'sun' },
  { label: 'Dark', value: 'dark', icon: 'moon' },
];

const BOOKING_TABLES = ['bookings', 'booking_requests', 'service_requests'];
const BOOKING_OWNER_FIELDS = [
  'pet_parent_id',
  'client_id',
  'customer_id',
  'owner_id',
  'user_id',
  'created_by',
];

const PET_TABLES = ['pets', 'pet_profiles', 'pet_passports'];
const PET_OWNER_FIELDS = ['owner_id', 'pet_parent_id', 'user_id', 'created_by'];

const CONVERSATION_TABLES = ['conversations', 'message_threads'];
const CONVERSATION_OWNER_FIELDS = [
  'pet_parent_id',
  'participant_id',
  'user_id',
  'customer_id',
];

const NOTIFICATION_TABLES = ['notifications', 'user_notifications'];
const NOTIFICATION_OWNER_FIELDS = [
  'user_id',
  'recipient_id',
  'profile_id',
  'pet_parent_id',
];

const SESSION_TABLES = [
  'booking_visit_sessions',
  'pawreport_sessions',
  'visit_sessions',
];

const SESSION_OWNER_FIELDS = [
  'pet_parent_id',
  'customer_id',
  'client_id',
  'owner_id',
  'user_id',
];

const UPDATE_TABLES = [
  'booking_visit_updates',
  'pawreport_updates',
  'visit_updates',
];

const LOCATION_TABLES = [
  'booking_visit_locations',
  'pawreport_locations',
  'visit_locations',
];

const REALTIME_TABLES = [
  'bookings',
  'booking_requests',
  'pets',
  'pet_profiles',
  'conversations',
  'messages',
  'notifications',
  'booking_visit_sessions',
  'booking_visit_updates',
  'booking_visit_locations',
];

export default function PetParentDashboardScreen() {
  const { user, profile } = useAuth();
  const params = useLocalSearchParams<{
    welcomePet?: string;
    welcomePetId?: string;
  }>();
  const welcomePetName = Array.isArray(params.welcomePet)
    ? params.welcomePet[0]
    : params.welcomePet;
  const welcomePetId = Array.isArray(params.welcomePetId)
    ? params.welcomePetId[0]
    : params.welcomePetId;

  const themeMode = useThemeMode();
  const themePreference = useThemePreference();
  const isDark = themeMode === 'dark';
  const palette = getPalette(isDark);
  const styles = createStyles(isDark);

  const [dashboardData, setDashboardData] =
    useState<DashboardData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadMessage, setLoadMessage] = useState('');
  const [now, setNow] = useState(Date.now());
  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false);
  const [selectedServiceKey, setSelectedServiceKey] =
    useState<CareServiceKey | null>(null);
  const [needsVisitReview, setNeedsVisitReview] = useState(false);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const profileRecord = (profile ?? {}) as RecordRow;
  const profileName =
    getFirstString(profileRecord, ['full_name', 'display_name']) ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    user?.email?.split('@')[0] ||
    'Pet Parent';

  const firstName = profileName.split(/\s+/).filter(Boolean)[0] || 'Pet Parent';
  const avatarUrl = resolveSupabaseStorageUrl(
    getFirstString(profileRecord, [
      'avatar_url',
      'photo_url',
      'profile_photo_url',
      'profile_image_url',
    ]),
  );

  const profileLocation = getProfileLocation(profileRecord);
  const pawPoints = Math.max(
    0,
    Math.round(
      getFirstNumber(profileRecord, [
        'paw_points',
        'pawpoints',
        'reward_points',
        'rewards_points',
        'points_balance',
      ]) ?? 0,
    ),
  );

  const availableCredit = Math.max(
    0,
    getFirstNumber(profileRecord, [
      'available_credit',
      'credit_balance',
      'pawperks_credit',
      'referral_credit',
    ]) ?? 0,
  );

  const refreshDashboard = useCallback(
    async (showRefresh = false) => {
      if (!user?.id || !isSupabaseConfigured) {
        setDashboardData(EMPTY_DATA);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const data = await loadPetParentDashboard(user.id);
        setDashboardData(data);
        setLoadMessage('');
      } catch {
        setLoadMessage(
          'Some live details could not be loaded. Pull down to try again.',
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    void refreshDashboard(false);
  }, [refreshDashboard]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) return;

    let effectActive = true;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const refreshSoon = () => {
      if (!effectActive) return;

      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }

      refreshTimer = setTimeout(() => {
        if (effectActive) {
          void refreshDashboard(false);
        }
      }, 500);
    };

    const channelName = [
      'pet-parent-dashboard',
      user.id,
      Date.now().toString(36),
      Math.random().toString(36).slice(2, 8),
    ].join('-');

    const channel = supabase.channel(channelName);

    REALTIME_TABLES.forEach((table) => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
        },
        refreshSoon,
      );
    });

    channel.subscribe();

    return () => {
      effectActive = false;

      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }

      void supabase.removeChannel(channel);
    };
  }, [refreshDashboard, user?.id]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const currentBooking = useMemo(() => {
    const active = dashboardData.bookings.find((booking) => booking.active);
    if (active) return active;

    return (
      dashboardData.bookings
        .filter((booking) => isUpcomingStatus(booking.status))
        .sort(compareBookings)[0] ?? null
    );
  }, [dashboardData.bookings]);

  const activeCare = dashboardData.activeCare;
  const recentCompletedCare = dashboardData.recentCompletedCare;

  useEffect(() => {
    let cancelled = false;
    const bookingId = recentCompletedCare?.bookingId || recentCompletedCare?.id;

    if (!bookingId || activeCare) {
      setNeedsVisitReview(false);
      return;
    }

    void isVisitReviewClosed(bookingId).then((closed) => {
      if (!cancelled) setNeedsVisitReview(!closed);
    });

    return () => {
      cancelled = true;
    };
  }, [activeCare, recentCompletedCare]);

  const primaryAction = useMemo(() => {
    if (activeCare) {
      return {
        eyebrow: activeCare.isWalk ? 'WALK IN PROGRESS' : 'CARE IN PROGRESS',
        title: activeCare.isWalk ? 'View Live Walk' : 'View Live Care',
        helper: 'Follow updates from your Guru in real time.',
        route: '/pawreport-live' as const,
      };
    }

    if (needsVisitReview && recentCompletedCare) {
      return {
        eyebrow: 'RATE YOUR GURU',
        title: 'Submit Visit Review',
        helper: 'Share stars and praise while the visit is fresh.',
        route: '/reviews' as const,
        params: {
          bookingId: recentCompletedCare.bookingId || recentCompletedCare.id,
        },
      };
    }

    if (currentBooking) {
      return {
        eyebrow: 'UPCOMING CARE',
        title: 'View Upcoming Care',
        helper: 'Review timing, your Guru, and pet instructions.',
        route: '/booking-details' as const,
        params: { bookingId: currentBooking.id },
      };
    }

    if (recentCompletedCare) {
      return {
        eyebrow: 'PAWREPORT COMPLETE',
        title: 'View Care Report',
        helper: 'Review the completed care summary and updates.',
        route: '/pawreport-live' as const,
      };
    }

    return {
      eyebrow: 'READY WHEN YOU ARE',
      title: 'Find a Guru',
      helper: 'Browse trusted local pet care near you.',
      route: '/find-care' as const,
    };
  }, [activeCare, currentBooking, needsVisitReview, recentCompletedCare]);

  const upcomingCount = dashboardData.bookings.filter((booking) =>
    isUpcomingStatus(booking.status),
  ).length;

  const scrollBottomInset = StickyFooterClearance.navOnly;

  const priorityCards = useMemo<PriorityCard[]>(() => {
    const cards: PriorityCard[] = [];

    if (welcomePetName) {
      cards.push({
        id: 'welcome-passport',
        eyebrow: 'Welcome summary',
        title: `${welcomePetName} joined your pack`,
        helper:
          'Passport saved — open Find Care when you are ready, or edit details anytime.',
        tone: 'primary',
        ctaLabel: 'Open passport',
        onPress: () =>
          router.push({
            pathname: '/pet-passports',
            params: welcomePetId
              ? { mode: 'wizard', petId: welcomePetId }
              : { mode: 'wizard' },
          }),
        icon: <PawPrint color="#FFFFFF" size={22} strokeWidth={2.4} />,
      });
    }

    if (needsVisitReview && recentCompletedCare) {
      const reviewBookingId =
        recentCompletedCare.bookingId || recentCompletedCare.id;

      cards.push({
        id: 'visit-review',
        eyebrow: 'Visit complete',
        title: recentCompletedCare.petName
          ? `Rate ${recentCompletedCare.guruName || 'your Guru'} for ${recentCompletedCare.petName}`
          : 'Rate your Guru',
        helper:
          'Stars, praise tags, and a short note — the last step after care wraps.',
        tone: 'primary',
        ctaLabel: 'Open review',
        onPress: () =>
          router.push({
            pathname: '/reviews',
            params: { bookingId: reviewBookingId },
          }),
        icon: <Star color="#FFFFFF" size={22} strokeWidth={2.4} />,
      });
    }

    if (activeCare) {
      cards.push({
        id: 'live-care',
        eyebrow: activeCare.isWalk ? 'Live walk' : 'Live care',
        title: activeCare.petName
          ? `${activeCare.petName} is with ${activeCare.guruName || 'your Guru'}`
          : 'Care in progress',
        helper:
          activeCare.photoCount > 0
            ? `${activeCare.photoCount} new photo${activeCare.photoCount === 1 ? '' : 's'} · ${activeCare.latestUpdate || 'Open PawReport Live'}`
            : activeCare.latestUpdate || 'Open PawReport Live for updates.',
        tone: needsVisitReview ? 'surface' : 'primary',
        ctaLabel: 'Open PawReport Live',
        onPress: () => router.push('/pawreport-live'),
        icon: <PawPrint color={needsVisitReview ? palette.primary : '#FFFFFF'} size={22} strokeWidth={2.4} />,
      });
    } else if (currentBooking) {
      cards.push({
        id: 'next-booking',
        eyebrow: 'Next booking',
        title: currentBooking.serviceLabel || 'Upcoming care',
        helper: [
          currentBooking.petName,
          currentBooking.guruName,
          formatBookingDay(currentBooking.startAt),
        ]
          .filter(Boolean)
          .join(' · '),
        tone: needsVisitReview ? 'surface' : 'primary',
        ctaLabel: 'View booking',
        onPress: () =>
          router.push({
            pathname: '/booking-details',
            params: { bookingId: currentBooking.id },
          }),
        icon: (
          <CalendarDays
            color={needsVisitReview ? palette.primary : '#FFFFFF'}
            size={22}
            strokeWidth={2.4}
          />
        ),
      });
    } else if (!needsVisitReview) {
      cards.push({
        id: 'find-care',
        eyebrow: 'Ready when you are',
        title: 'Find a trusted Guru',
        helper: 'Browse local sitters and request care in a few taps.',
        tone: 'primary',
        ctaLabel: 'Find Care',
        onPress: () => router.push('/find-care'),
        icon: <Search color="#FFFFFF" size={22} strokeWidth={2.4} />,
      });
    }

    const incompletePets = dashboardData.pets.filter((pet) => !pet.complete);
    cards.push({
      id: 'pets',
      eyebrow: 'Pet Passports',
      title:
        dashboardData.pets.length === 0
          ? 'Add your first pet'
          : incompletePets.length
            ? `${incompletePets.length} passport${incompletePets.length === 1 ? '' : 's'} need details`
            : `${dashboardData.pets.length} pet${dashboardData.pets.length === 1 ? '' : 's'} ready`,
      helper:
        dashboardData.pets.length === 0
          ? 'Save routines, meds, and handoff notes before booking.'
          : incompletePets.length
            ? 'Tap to continue the passport wizard — no alerts, just the next step.'
            : 'Tap to manage passports and care notes.',
      onPress: () => {
        if (dashboardData.pets.length === 0) {
          router.push({
            pathname: '/pet-passports',
            params: { mode: 'wizard' },
          });
          return;
        }

        if (incompletePets[0]) {
          router.push({
            pathname: '/pet-passports',
            params: {
              mode: 'wizard',
              petId: incompletePets[0].id,
            },
          });
          return;
        }

        router.push('/pet-passports');
      },
      icon: <PawPrint color={palette.primary} size={22} strokeWidth={2.4} />,
    });

    if (dashboardData.unreadMessages > 0 || dashboardData.unreadNotifications > 0) {
      cards.push({
        id: 'inbox',
        eyebrow: 'Needs attention',
        title: 'Messages & alerts',
        helper: [
          dashboardData.unreadMessages
            ? `${dashboardData.unreadMessages} unread message${dashboardData.unreadMessages === 1 ? '' : 's'}`
            : null,
          dashboardData.unreadNotifications
            ? `${dashboardData.unreadNotifications} notification${dashboardData.unreadNotifications === 1 ? '' : 's'}`
            : null,
        ]
          .filter(Boolean)
          .join(' · '),
        tone: 'warning',
        ctaLabel: 'Open inbox',
        onPress: () =>
          router.push(
            dashboardData.unreadMessages > 0 ? '/messages' : '/notifications',
          ),
        icon: <Bell color={palette.orange} size={22} strokeWidth={2.4} />,
      });
    }

    cards.push({
      id: 'rewards',
      eyebrow: 'PawPoints',
      title: `${pawPoints.toLocaleString()} points`,
      helper:
        availableCredit > 0
          ? `$${availableCredit.toFixed(2)} credit ready`
          : 'Earn rewards through bookings and referrals.',
      onPress: () => router.push('/pawperks'),
      icon: <Gift color={palette.primary} size={22} strokeWidth={2.4} />,
    });

    return cards;
  }, [
    activeCare,
    availableCredit,
    currentBooking,
    dashboardData.pets,
    dashboardData.unreadMessages,
    dashboardData.unreadNotifications,
    needsVisitReview,
    palette.orange,
    palette.primary,
    pawPoints,
    recentCompletedCare,
    welcomePetId,
    welcomePetName,
  ]);

  const companionCards = useMemo<PriorityCard[]>(
    () =>
      AI_COMPANIONS.map((companion) => ({
        id: companion.id,
        eyebrow: 'AI Companion',
        title: `${companion.name} · ${companion.title}`,
        helper: companion.helper,
        tone: companion.id === 'rogue' ? 'primary' : 'surface',
        ctaLabel: companion.ctaLabel,
        onPress: () =>
          router.push({
            pathname: '/ai-companion',
            params: { id: companion.id },
          } as never),
        icon: (
          <Sparkles
            color={companion.id === 'rogue' ? '#FFFFFF' : palette.primary}
            size={22}
            strokeWidth={2.4}
          />
        ),
      })),
    [palette.primary],
  );

  const selectedService = CARE_SERVICES.find(
    (service) => service.key === selectedServiceKey,
  );

  const requestCareLabel = selectedService
    ? `Request ${selectedService.label}`
    : primaryAction.title;

  return (
    <SitGuruScreen center={false} maxWidth={620} scroll={false}>
      <RoleGate requiredRole="pet_parent">
        <MobileScreen
          scrollBottomInset={scrollBottomInset}
          refreshing={isRefreshing}
          onRefresh={() => void refreshDashboard(true)}
          refreshColor={palette.primary}
          footer={
            <View>
              <StickyActionBar embedded>
                <SitGuruButton
                  label={requestCareLabel}
                  onPress={() => {
                    if (selectedService) {
                      router.push({
                        pathname: '/request-booking',
                        params: { serviceType: selectedService.serviceType },
                      });
                      return;
                    }

                    if (
                      'params' in primaryAction &&
                      primaryAction.params
                    ) {
                      router.push({
                        pathname: primaryAction.route,
                        params: primaryAction.params,
                      } as never);
                      return;
                    }

                    router.push(primaryAction.route);
                  }}
                  accessibilityLabel={`${requestCareLabel}. ${selectedService?.helper || primaryAction.helper}`}
                />
              </StickyActionBar>

              <SitGuruTabBar
                active="home"
                badges={{ messages: dashboardData.unreadMessages }}
              />

              <SitGuruWorkspaceSwitcher
                currentRole="pet_parent"
                onClose={() => setWorkspaceSwitcherOpen(false)}
                visible={workspaceSwitcherOpen}
              />
            </View>
          }
        >
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.dashboardTitle}>
                  Hey, {firstName}
                </Text>
                <Text style={styles.welcomeText}>
                  Your pets, bookings, and Gurus in one place.
                </Text>

                <SitGuruRoleStatus role="pet_parent" />

                {profileLocation ? (
                  <View style={styles.locationRow}>
                    <MapPin
                      color={palette.primary}
                      size={13}
                      strokeWidth={2.4}
                    />
                    <Text style={styles.locationText}>{profileLocation}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.headerActions}>
                <TouchTarget
                  accessibilityRole="button"
                  accessibilityLabel="Open notifications"
                  onPress={() => router.push('/notifications')}
                  style={styles.headerIconButton}
                >
                  <Bell color={palette.title} size={18} strokeWidth={2.2} />

                  {dashboardData.unreadNotifications > 0 ? (
                    <View style={styles.headerBadge}>
                      <Text style={styles.headerBadgeText}>
                        {formatBadge(dashboardData.unreadNotifications)}
                      </Text>
                    </View>
                  ) : null}
                </TouchTarget>

                <View style={styles.modeToggle}>
                  {themeOptions.map((option) => {
                    const active = themePreference === option.value;

                    return (
                      <TouchTarget
                        key={option.value}
                        accessibilityRole="button"
                        accessibilityLabel={`Switch to ${option.label} mode`}
                        accessibilityState={{ selected: active }}
                        onPress={() => setThemePreference(option.value)}
                        style={[
                          styles.modeButton,
                          active && styles.modeButtonActive,
                        ]}
                      >
                        <SitGuruIcon
                          name={option.icon}
                          size={15}
                          color={
                            active
                              ? option.value === 'light'
                                ? '#F3AA1F'
                                : isDark
                                  ? '#F0CF62'
                                  : palette.primary
                              : palette.muted
                          }
                          strokeWidth={2.4}
                        />
                      </TouchTarget>
                    );
                  })}
                </View>

                <TouchTarget
                  accessibilityRole="button"
                  accessibilityLabel="Switch workspace"
                  onPress={() => setWorkspaceSwitcherOpen(true)}
                  style={styles.profileButton}
                >
                  <Avatar
                    fallback={getInitials(profileName)}
                    imageUrl={avatarUrl}
                    palette={palette}
                    size={42}
                  />
                </TouchTarget>
              </View>
            </View>

            {loadMessage ? (
              <View style={styles.loadNotice}>
                <Text style={styles.loadNoticeText}>{loadMessage}</Text>
              </View>
            ) : null}

            {isLoading ? (
              <DashboardSkeletonStack />
            ) : (
              <PriorityCarousel label="Priority" cards={priorityCards} />
            )}

            <ServiceCoreGrid
              selectedKey={selectedServiceKey}
              onSelect={(service) => {
                setSelectedServiceKey(service.key);
              }}
            />

            <PriorityCarousel
              label="AI Companions"
              cards={companionCards}
            />

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>QUICK ACTIONS</Text>
                <Text style={styles.sectionTitle}>Jump in</Text>
              </View>
            </View>

            <View style={styles.quickActions}>
              <QuickAction
                icon={
                  <Search
                    color={palette.primary}
                    size={21}
                    strokeWidth={2.4}
                  />
                }
                label="Find Care"
                onPress={() => router.push('/find-care')}
                styles={styles}
              />

              <QuickAction
                icon={
                  <CalendarDays
                    color={palette.primary}
                    size={21}
                    strokeWidth={2.4}
                  />
                }
                label="Request"
                onPress={() => router.push('/request-booking')}
                styles={styles}
              />

              <QuickAction
                icon={
                  <PawPrint
                    color={palette.primary}
                    size={21}
                    strokeWidth={2.4}
                  />
                }
                label="My Pets"
                onPress={() => router.push('/pet-passports')}
                styles={styles}
              />

              <QuickAction
                badge={dashboardData.unreadMessages}
                icon={
                  <MessageCircle
                    color={palette.primary}
                    size={21}
                    strokeWidth={2.4}
                  />
                }
                label="Messages"
                onPress={() => router.push('/messages')}
                styles={styles}
              />
            </View>

            {/* Messages and My Pets live in the quick-action tiles above, so
              * this list only carries destinations that appear nowhere else. */}
            <View style={styles.menuCard}>
              <ActivityRow
                badge={upcomingCount}
                icon={
                  <CalendarDays
                    color={palette.primary}
                    size={18}
                    strokeWidth={2.3}
                  />
                }
                label="Bookings"
                onPress={() => router.push('/bookings')}
                palette={palette}
                styles={styles}
              />

              <ActivityRow
                icon={
                  <CreditCard
                    color={palette.primary}
                    size={18}
                    strokeWidth={2.3}
                  />
                }
                label="Payments & Receipts"
                onPress={() => router.push('/payments')}
                palette={palette}
                styles={styles}
              />

              <ActivityRow
                badge={dashboardData.unreadNotifications}
                icon={
                  <Bell
                    color={palette.primary}
                    size={18}
                    strokeWidth={2.3}
                  />
                }
                label="Notifications"
                last
                onPress={() => router.push('/notifications')}
                palette={palette}
                styles={styles}
              />
            </View>

            <View style={styles.petsSectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>PETS & PASSPORTS</Text>
                <Text style={styles.sectionTitle}>Your pets</Text>
              </View>

              <TouchTarget
                accessibilityRole="button"
                accessibilityLabel="Add a pet"
                onPress={() => router.push('/pet-passports')}
                style={styles.addPetButton}
              >
                <Plus color={palette.primary} size={18} strokeWidth={2.7} />
              </TouchTarget>
            </View>

            <View style={styles.petsCard}>
              {dashboardData.pets.length > 0 ? (
                <View style={styles.petPreviewList}>
                  {dashboardData.pets.slice(0, 2).map((pet) => (
                    <BubblePressable
                      accessibilityRole="button"
                      key={pet.id}
                      onPress={() => router.push('/pet-passports')}
                      scaleTo={0.97}
                      style={styles.petPreviewRow}
                    >
                      <Avatar
                        emojiFallback
                        fallback="🐾"
                        imageUrl={pet.photoUrl}
                        palette={palette}
                        size={48}
                      />

                      <View style={styles.petPreviewCopy}>
                        <Text style={styles.petName}>{pet.name}</Text>
                        <Text style={styles.petMeta} numberOfLines={1}>
                          {[pet.breed, pet.species, pet.ageLabel]
                            .filter(Boolean)
                            .join(' • ') || 'Pet Passport'}
                        </Text>

                        <View
                          style={[
                            styles.petStatusPill,
                            !pet.complete && styles.petStatusPillIncomplete,
                          ]}
                        >
                          <Text
                            style={[
                              styles.petStatusText,
                              !pet.complete && styles.petStatusTextIncomplete,
                            ]}
                          >
                            {pet.complete
                              ? 'Profile complete'
                              : 'Profile needs details'}
                          </Text>
                        </View>
                      </View>

                      <ChevronRight
                        color={palette.muted}
                        size={18}
                        strokeWidth={2.2}
                      />
                    </BubblePressable>
                  ))}
                </View>
              ) : (
                <View style={styles.petEmptyState}>
                  <View style={styles.petEmptyIcon}>
                    <PawPrint
                      color={palette.primary}
                      size={23}
                      strokeWidth={2.3}
                    />
                  </View>

                  <View style={styles.petEmptyCopy}>
                    <Text style={styles.petEmptyTitle}>
                      Add your first pet
                    </Text>
                    <Text style={styles.petEmptyText}>
                      Save routines, medications, feeding, and care notes.
                    </Text>
                  </View>
                </View>
              )}

              <TouchTarget
                accessibilityRole="button"
                onPress={() => router.push('/pet-passports')}
                style={styles.managePetsButton}
              >
                <Text style={styles.managePetsButtonText}>
                  Manage Pet Passports
                </Text>
              </TouchTarget>
            </View>

            <BubblePressable
              accessibilityRole="button"
              onPress={() => router.push('/pawperks')}
              scaleTo={0.97}
              style={styles.rewardsCard}
            >
              <View style={styles.rewardsIcon}>
                <Gift color={palette.primary} size={22} strokeWidth={2.4} />
              </View>

              <View style={styles.rewardsCopy}>
                <Text style={styles.rewardsTitle}>PawPoints Rewards</Text>
                <Text style={styles.rewardsValue}>
                  {pawPoints.toLocaleString()} points
                </Text>
                <Text style={styles.rewardsText}>
                  {availableCredit > 0
                    ? `$${availableCredit.toFixed(2)} available credit`
                    : 'Earn rewards through bookings and referrals.'}
                </Text>
              </View>

              <PawPrint
                color={palette.primary}
                size={34}
                strokeWidth={2.2}
              />
            </BubblePressable>

            <View style={styles.toolsCard}>
              <ToolRow
                icon={
                  <Settings
                    color={palette.primary}
                    size={18}
                    strokeWidth={2.3}
                  />
                }
                label="Account & Settings"
                onPress={() => router.push('/account')}
                palette={palette}
                styles={styles}
              />

              <ToolRow
                icon={
                  <ShieldCheck
                    color={palette.primary}
                    size={18}
                    strokeWidth={2.3}
                  />
                }
                label="Safety & Support"
                onPress={() => router.push('/support')}
                palette={palette}
                styles={styles}
                last
              />
            </View>
        </MobileScreen>
      </RoleGate>
    </SitGuruScreen>
  );
}

function EmptyCareCard({
  styles,
}: {
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.emptyCareCard}>
      <View style={styles.emptyCareIcon}>
        <PawPrint color="#087449" size={24} strokeWidth={2.4} />
      </View>

      <View style={styles.emptyCareCopy}>
        <Text style={styles.emptyCareTitle}>No upcoming care yet</Text>
        <Text style={styles.emptyCareText}>
          Find a local Guru and send your first care request.
        </Text>
      </View>

      <TouchTarget
        accessibilityRole="button"
        onPress={() => router.push('/find-care')}
        style={styles.emptyCareButton}
      >
        <Text style={styles.emptyCareButtonText}>Find Care</Text>
      </TouchTarget>
    </View>
  );
}

function UpcomingCareCard({
  booking,
  palette,
  styles,
}: {
  booking: DashboardBooking;
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View>
          <Text style={styles.bookingDay}>
            {formatBookingDay(booking.startAt)}
          </Text>
          <Text style={styles.bookingTime}>
            {formatBookingTime(booking.startAt)}
          </Text>
        </View>

        <View style={styles.bookingStatusPill}>
          <Text style={styles.bookingStatusText}>
            {formatStatus(booking.status)}
          </Text>
        </View>
      </View>

      <View style={styles.bookingPeopleRow}>
        <Avatar
          emojiFallback
          fallback="🐾"
          imageUrl={booking.petPhotoUrl}
          palette={palette}
          size={52}
        />

        <View style={styles.bookingMain}>
          <Text style={styles.bookingService}>{booking.serviceLabel}</Text>
          <Text style={styles.bookingPetName}>
            {booking.petName || 'Your pet'}
          </Text>

          <View style={styles.bookingMetaRow}>
            <UserRound
              color={palette.muted}
              size={12}
              strokeWidth={2.2}
            />
            <Text style={styles.bookingMetaText}>
              with {booking.guruName || 'your Guru'}
            </Text>
          </View>

          {booking.location ? (
            <View style={styles.bookingMetaRow}>
              <MapPin
                color={palette.muted}
                size={12}
                strokeWidth={2.2}
              />
              <Text style={styles.bookingMetaText} numberOfLines={1}>
                {booking.location}
              </Text>
            </View>
          ) : null}
        </View>

        <Avatar
          fallback={getInitials(booking.guruName || 'Guru')}
          imageUrl={booking.guruPhotoUrl}
          palette={palette}
          size={46}
        />
      </View>

      <View style={styles.twoButtonRow}>
        <TouchTarget
          accessibilityRole="button"
          onPress={() => router.push('/conversation')}
          style={styles.outlineButton}
        >
          <MessageCircle
            color={palette.primary}
            size={18}
            strokeWidth={2.3}
          />
          <Text style={styles.outlineButtonText}>Message Guru</Text>
        </TouchTarget>

        <TouchTarget
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: '/booking-details',
              params: { bookingId: booking.id },
            })
          }
          style={styles.filledButton}
        >
          <Text style={styles.filledButtonText}>View Details</Text>
        </TouchTarget>
      </View>

      <View style={styles.bookingFooter}>
        <PawPrint
          color={palette.primary}
          size={15}
          strokeWidth={2.3}
        />
        <Text style={styles.bookingFooterText}>
          PawReport Live will be available when care begins.
        </Text>
        <ChevronRight
          color={palette.primary}
          size={17}
          strokeWidth={2.3}
        />
      </View>
    </View>
  );
}

function LiveCareCard({
  care,
  elapsedMinutes,
  palette,
  styles,
}: {
  care: LiveCare;
  elapsedMinutes: number;
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
}) {
  const distanceLabel =
    care.distanceMiles !== null
      ? `${care.distanceMiles.toFixed(1)} mi`
      : 'Tracking';

  return (
    <View style={styles.liveCard}>
      <View style={styles.liveHeader}>
        <View style={styles.liveCopy}>
          <View style={styles.liveStatusPill}>
            <Text style={styles.liveStatusText}>
              {care.isWalk ? 'WALK IN PROGRESS' : 'CARE IN PROGRESS'}
            </Text>
          </View>

          <Text style={styles.liveTitle}>
            {care.petName
              ? `${care.petName}'s ${care.isWalk ? 'Walk' : 'Care'} is Live`
              : care.isWalk
                ? 'Live Walk in Progress'
                : 'Live Care in Progress'}
          </Text>

          <Text style={styles.liveStartedText}>
            Started {formatBookingTime(care.startedAt)}
          </Text>
        </View>

        <View style={styles.liveGuru}>
          <Avatar
            fallback={getInitials(care.guruName || 'Guru')}
            imageUrl={care.guruPhotoUrl}
            palette={palette}
            size={42}
          />
          <Text style={styles.liveGuruName} numberOfLines={2}>
            with {care.guruName || 'your Guru'}
          </Text>
        </View>
      </View>

      <View style={styles.liveMetrics}>
        <View style={styles.liveMetric}>
          <Text style={styles.liveMetricValue}>
            {care.isWalk ? distanceLabel : `${elapsedMinutes} min`}
          </Text>
          <Text style={styles.liveMetricLabel}>
            {care.isWalk ? 'Live distance' : 'Elapsed'}
          </Text>
        </View>

        <View style={styles.liveMetricDivider} />

        <View style={styles.liveMetric}>
          <Text style={styles.liveMetricValue}>{elapsedMinutes} min</Text>
          <Text style={styles.liveMetricLabel}>
            {care.isWalk ? 'Elapsed' : 'Care time'}
          </Text>
        </View>
      </View>

      {care.isWalk ? (
        <View style={styles.routePreview}>
          <View style={styles.routeStreetOne} />
          <View style={styles.routeStreetTwo} />
          <View style={styles.routeLineOne} />
          <View style={styles.routeLineTwo} />
          <View style={styles.routeStartDot} />
          <View style={styles.routeEndDot} />
          <Text style={styles.routePreviewLabel}>
            {care.routePointCount > 0
              ? `${care.routePointCount} live route points`
              : 'Live route tracking'}
          </Text>
        </View>
      ) : (
        <View style={styles.visitTimelinePreview}>
          <View style={styles.timelineDot} />
          <View style={styles.timelineLine} />
          <Text style={styles.visitTimelineText}>
            Live visit updates are being added by your Guru.
          </Text>
        </View>
      )}

      <View style={styles.latestUpdateRow}>
        <PawPrint
          color={palette.primary}
          size={15}
          strokeWidth={2.3}
        />
        <Text style={styles.latestUpdateText} numberOfLines={2}>
          {care.latestUpdate || 'PawReport Live started'}
        </Text>
        <Text style={styles.latestUpdateTime}>
          {formatRelativeTime(care.latestUpdateAt)}
        </Text>
      </View>

      <View style={styles.twoButtonRow}>
        <BubblePressable
          accessibilityRole="button"
          onPress={() => router.push('/pawreport-live')}
          style={styles.filledButton}
        >
          <Text style={styles.filledButtonText}>
            {care.isWalk ? 'View Live Walk' : 'View Live Care'}
          </Text>
        </BubblePressable>

        <BubblePressable
          accessibilityRole="button"
          onPress={() => router.push('/conversation')}
          style={styles.outlineButton}
        >
          <Text style={styles.outlineButtonText}>Message Guru</Text>
        </BubblePressable>
      </View>
    </View>
  );
}

function CompletedCareCard({
  care,
  styles,
}: {
  care: LiveCare;
  styles: ReturnType<typeof createStyles>;
}) {
  const bookingId = care.bookingId || care.id;

  return (
    <View style={styles.completedCard}>
      <View style={styles.completedIcon}>
        <Sparkles color="#087449" size={22} strokeWidth={2.3} />
      </View>

      <View style={styles.completedCopy}>
        <Text style={styles.completedEyebrow}>PAWREPORT COMPLETE</Text>
        <Text style={styles.completedTitle}>
          {care.petName ? `${care.petName}'s care is complete` : 'Care complete'}
        </Text>
        <Text style={styles.completedText}>
          Review photos, then rate your Guru — the carousel will focus the review loop next.
        </Text>
      </View>

      <BubblePressable
        accessibilityRole="button"
        onPress={() =>
          router.push({
            pathname: '/reviews',
            params: { bookingId },
          })
        }
        style={styles.completedButton}
      >
        <Text style={styles.completedButtonText}>Rate Guru</Text>
      </BubblePressable>
    </View>
  );
}

function QuickAction({
  badge = 0,
  icon,
  label,
  onPress,
  styles,
}: {
  badge?: number;
  icon: ReactNode;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <TouchTarget
      accessibilityRole="button"
      onPress={onPress}
      style={styles.quickAction}
    >
      <View style={styles.quickActionIcon}>
        {icon}

        {badge > 0 ? (
          <View style={styles.quickActionBadge}>
            <Text style={styles.quickActionBadgeText}>
              {formatBadge(badge)}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchTarget>
  );
}

function ActivityRow({
  badge = 0,
  icon,
  label,
  last = false,
  onPress,
  palette,
  styles,
}: {
  badge?: number;
  icon: ReactNode;
  label: string;
  last?: boolean;
  onPress: () => void;
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <TouchTarget
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.activityRow, last && styles.activityRowLast]}
    >
      <View style={styles.activityIcon}>{icon}</View>
      <Text style={styles.activityLabel}>{label}</Text>

      {badge > 0 ? (
        <View style={styles.activityBadge}>
          <Text style={styles.activityBadgeText}>{formatBadge(badge)}</Text>
        </View>
      ) : null}

      <ChevronRight
        color={palette.muted}
        size={18}
        strokeWidth={2.3}
      />
    </TouchTarget>
  );
}

function ToolRow({
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
    <TouchTarget
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.toolRow, last && styles.toolRowLast]}
    >
      <View style={styles.toolIcon}>{icon}</View>
      <Text style={styles.toolLabel}>{label}</Text>
      <ChevronRight
        color={palette.muted}
        size={18}
        strokeWidth={2.3}
      />
    </TouchTarget>
  );
}

function Avatar({
  emojiFallback = false,
  fallback,
  imageUrl,
  palette,
  size,
}: {
  emojiFallback?: boolean;
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
            fontSize: emojiFallback
              ? Math.max(18, size * 0.42)
              : Math.max(11, size * 0.28),
          }}
        >
          {fallback}
        </Text>
      )}
    </View>
  );
}

async function loadPetParentDashboard(
  userId: string,
): Promise<DashboardData> {
  const [bookingRows, petRows, conversationRows, notificationRows, ownerSessions] =
    await Promise.all([
      queryFirstAvailableRows(
        BOOKING_TABLES,
        BOOKING_OWNER_FIELDS,
        userId,
        60,
      ),
      queryFirstAvailableRows(PET_TABLES, PET_OWNER_FIELDS, userId, 30),
      queryFirstAvailableRows(
        CONVERSATION_TABLES,
        CONVERSATION_OWNER_FIELDS,
        userId,
        60,
      ),
      queryFirstAvailableRows(
        NOTIFICATION_TABLES,
        NOTIFICATION_OWNER_FIELDS,
        userId,
        80,
      ),
      queryFirstAvailableRows(
        SESSION_TABLES,
        SESSION_OWNER_FIELDS,
        userId,
        30,
      ),
    ]);

  const bookings = bookingRows
    .map((row, index) => mapBookingRow(row, index))
    .filter((booking): booking is DashboardBooking => Boolean(booking))
    .sort(compareBookings);

  const pets = petRows
    .map((row, index) => mapPetRow(row, index))
    .filter((pet): pet is DashboardPet => Boolean(pet));

  const bookingIds = bookings.map((booking) => booking.id).filter(Boolean);

  const linkedSessions =
    ownerSessions.length > 0
      ? ownerSessions
      : await queryRowsByValues(
          SESSION_TABLES,
          ['booking_id', 'booking_request_id'],
          bookingIds,
          30,
        );

  const sessions = linkedSessions
    .map((row, index) => mapLiveCareRow(row, bookings, index))
    .filter((care): care is LiveCare => Boolean(care))
    .sort(compareLiveCare);

  const activeCareBase =
    sessions.find((care) => isActiveCareStatus(care.status)) ?? null;

  const recentCompletedBase =
    sessions.find((care) => isRecentCompletedCare(care)) ?? null;

  const selectedCare = activeCareBase ?? recentCompletedBase;
  let selectedCareWithUpdates = selectedCare;

  if (selectedCare) {
    const [updateRows, locationRows] = await Promise.all([
      queryRowsByValues(
        UPDATE_TABLES,
        ['session_id', 'visit_session_id', 'pawreport_session_id', 'booking_id'],
        [selectedCare.id, selectedCare.bookingId].filter(Boolean),
        40,
      ),
      queryRowsByValues(
        LOCATION_TABLES,
        ['session_id', 'visit_session_id', 'pawreport_session_id', 'booking_id'],
        [selectedCare.id, selectedCare.bookingId].filter(Boolean),
        500,
      ),
    ]);

    const mappedUpdates = updateRows.map(mapCareUpdate);
    const latestUpdate = mappedUpdates.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )[0];
    const photoCount = mappedUpdates.filter((item) => item.isPhoto).length;

    selectedCareWithUpdates = {
      ...selectedCare,
      latestUpdate:
        latestUpdate?.label ||
        selectedCare.latestUpdate ||
        (selectedCare.isWalk
          ? 'Live walk tracking started'
          : 'PawReport Live started'),
      latestUpdateAt:
        latestUpdate?.createdAt ?? selectedCare.latestUpdateAt,
      routePointCount: locationRows.length,
      photoCount,
    };
  }

  const unreadMessages = conversationRows.reduce((total, row) => {
    const unread =
      getFirstNumber(row, [
        'unread_count',
        'pet_parent_unread_count',
        'customer_unread_count',
      ]) ?? (getFirstBoolean(row, ['is_unread', 'unread']) ? 1 : 0);

    return total + Math.max(0, Math.round(unread));
  }, 0);

  const unreadNotifications = notificationRows.reduce((total, row) => {
    const read = getFirstBoolean(row, ['is_read', 'read', 'seen']);
    const unread = getFirstBoolean(row, ['is_unread', 'unread']);

    if (unread) return total + 1;
    if (!read) return total + 1;
    return total;
  }, 0);

  return {
    bookings,
    pets,
    unreadMessages,
    unreadNotifications,
    activeCare:
      activeCareBase && selectedCareWithUpdates?.id === activeCareBase.id
        ? selectedCareWithUpdates
        : activeCareBase,
    recentCompletedCare:
      recentCompletedBase &&
      selectedCareWithUpdates?.id === recentCompletedBase.id
        ? selectedCareWithUpdates
        : recentCompletedBase,
  };
}

async function queryFirstAvailableRows(
  tables: string[],
  ownerFields: string[],
  userId: string,
  limit: number,
): Promise<RecordRow[]> {
  if (!isSupabaseConfigured) return [];

  for (const table of tables) {
    for (const ownerField of ownerFields) {
      const result = await supabase
        .from(table)
        .select('*')
        .eq(ownerField, userId)
        .limit(limit);

      if (!result.error && result.data?.length) {
        return result.data as RecordRow[];
      }
    }
  }

  return [];
}

async function queryRowsByValues(
  tables: string[],
  fields: string[],
  values: string[],
  limit: number,
): Promise<RecordRow[]> {
  if (!isSupabaseConfigured || values.length === 0) return [];

  const uniqueValues = Array.from(new Set(values.filter(Boolean)));

  for (const table of tables) {
    for (const field of fields) {
      const result = await supabase
        .from(table)
        .select('*')
        .in(field, uniqueValues)
        .limit(limit);

      if (!result.error && result.data?.length) {
        return result.data as RecordRow[];
      }
    }
  }

  return [];
}

function mapBookingRow(
  row: RecordRow,
  index: number,
): DashboardBooking | null {
  const status =
    normalizeStatus(
      getFirstString(row, ['status', 'booking_status', 'request_status']),
    ) || 'pending';

  if (['cancelled', 'canceled', 'declined', 'rejected'].includes(status)) {
    return null;
  }

  return {
    id:
      getFirstString(row, ['id', 'booking_id', 'request_id']) ||
      `booking-${index}`,
    status,
    serviceLabel:
      getFirstString(row, [
        'service_name',
        'service_type',
        'service',
        'booking_type',
      ]) || 'Pet Care Visit',
    startAt: getFirstDate(row, [
      'start_time',
      'starts_at',
      'scheduled_at',
      'booking_date',
      'service_date',
      'start_date',
      'date',
    ]),
    endAt: getFirstDate(row, [
      'end_time',
      'ends_at',
      'completed_at',
      'end_date',
    ]),
    guruName:
      getFirstString(row, [
        'guru_name',
        'provider_name',
        'sitter_name',
        'caregiver_name',
      ]) || 'Your Guru',
    guruPhotoUrl: resolveSupabaseStorageUrl(
      getFirstString(row, [
        'guru_photo_url',
        'provider_photo_url',
        'guru_avatar_url',
        'caregiver_photo_url',
      ]),
    ),
    petName:
      getFirstString(row, ['pet_name', 'animal_name']) || 'Your pet',
    petPhotoUrl: resolveSupabaseStorageUrl(
      getFirstString(row, [
        'pet_photo_url',
        'pet_image_url',
        'animal_photo_url',
      ]),
    ),
    location:
      getFirstString(row, [
        'service_address',
        'location',
        'service_location',
        'city',
      ]) || '',
    active:
      ['active', 'in_progress', 'started', 'checked_in'].includes(status) ||
      getFirstBoolean(row, ['is_active', 'care_in_progress']),
    completed: ['completed', 'complete', 'finished'].includes(status),
  };
}

function mapPetRow(row: RecordRow, index: number): DashboardPet | null {
  const name = getFirstString(row, ['name', 'pet_name', 'animal_name']);

  if (!name) return null;

  const completionFields = [
    getFirstString(row, ['breed', 'breed_name']),
    getFirstString(row, ['species', 'animal_type', 'pet_type']),
    getFirstString(row, [
      'photo_url',
      'image_url',
      'avatar_url',
      'pet_photo_url',
    ]),
    getFirstString(row, [
      'care_notes',
      'routine_notes',
      'feeding_instructions',
      'medication_notes',
    ]),
  ];

  return {
    id: getFirstString(row, ['id', 'pet_id']) || `pet-${index}`,
    name,
    species: getFirstString(row, ['species', 'animal_type', 'pet_type']),
    breed: getFirstString(row, ['breed', 'breed_name']),
    ageLabel: getPetAgeLabel(row),
    photoUrl: resolveSupabaseStorageUrl(
      getFirstString(row, [
        'photo_url',
        'image_url',
        'avatar_url',
        'pet_photo_url',
      ]),
    ),
    complete:
      getFirstBoolean(row, [
        'is_complete',
        'profile_complete',
        'is_profile_complete',
      ]) || completionFields.filter(Boolean).length >= 3,
  };
}

function mapLiveCareRow(
  row: RecordRow,
  bookings: DashboardBooking[],
  index: number,
): LiveCare | null {
  const id =
    getFirstString(row, ['id', 'session_id', 'visit_session_id']) ||
    `session-${index}`;

  const bookingId = getFirstString(row, [
    'booking_id',
    'booking_request_id',
  ]);

  const booking = bookings.find((item) => item.id === bookingId) ?? null;

  const status =
    normalizeStatus(
      getFirstString(row, [
        'status',
        'session_status',
        'visit_status',
        'pawreport_status',
      ]),
    ) || 'active';

  const serviceLabel =
    getFirstString(row, [
      'service_name',
      'service_type',
      'service',
      'session_type',
    ]) ||
    booking?.serviceLabel ||
    'Pet Care';

  const sessionType = getFirstString(row, [
    'session_type',
    'visit_type',
    'tracking_type',
  ]).toLowerCase();

  const isWalk =
    getFirstBoolean(row, ['is_walk', 'walk_active', 'walk_tracking']) ||
    serviceLabel.toLowerCase().includes('walk') ||
    sessionType.includes('walk');

  return {
    id,
    bookingId: bookingId || booking?.id || '',
    status,
    isWalk,
    serviceLabel,
    petName:
      getFirstString(row, ['pet_name', 'animal_name']) ||
      booking?.petName ||
      'Your pet',
    petPhotoUrl: resolveSupabaseStorageUrl(
      getFirstString(row, [
        'pet_photo_url',
        'pet_image_url',
        'animal_photo_url',
      ]) || booking?.petPhotoUrl,
    ),
    guruName:
      getFirstString(row, [
        'guru_name',
        'provider_name',
        'sitter_name',
        'caregiver_name',
      ]) ||
      booking?.guruName ||
      'Your Guru',
    guruPhotoUrl: resolveSupabaseStorageUrl(
      getFirstString(row, [
        'guru_photo_url',
        'provider_photo_url',
        'guru_avatar_url',
      ]) || booking?.guruPhotoUrl,
    ),
    startedAt: getFirstDate(row, [
      'started_at',
      'start_time',
      'checked_in_at',
      'created_at',
    ]),
    endedAt: getFirstDate(row, [
      'ended_at',
      'end_time',
      'completed_at',
      'finished_at',
    ]),
    durationMinutes: getFirstNumber(row, [
      'duration_minutes',
      'elapsed_minutes',
      'walk_duration_minutes',
      'total_minutes',
    ]),
    distanceMiles: normalizeDistanceMiles(
      getFirstNumber(row, [
        'distance_miles',
        'walk_distance_miles',
        'total_distance_miles',
        'distance',
      ]),
      getFirstString(row, ['distance_unit', 'unit']),
    ),
    latestUpdate:
      getFirstString(row, [
        'latest_update',
        'latest_note',
        'status_message',
        'summary',
      ]) || '',
    latestUpdateAt: getFirstDate(row, [
      'latest_update_at',
      'updated_at',
      'last_location_at',
    ]),
    routePointCount: Math.max(
      0,
      Math.round(
        getFirstNumber(row, [
          'route_point_count',
          'location_count',
          'tracking_point_count',
        ]) ?? 0,
      ),
    ),
    photoCount: 0,
  };
}

function mapCareUpdate(row: RecordRow) {
  const type = getFirstString(row, [
    'update_type',
    'type',
    'event_type',
    'category',
  ]);

  const copy = getFirstString(row, [
    'title',
    'message',
    'note',
    'description',
    'caption',
    'body',
  ]);

  const photoUrl = getFirstString(row, [
    'photo_url',
    'image_url',
    'media_url',
    'attachment_url',
  ]);

  const isPhoto =
    Boolean(photoUrl) ||
    type.toLowerCase().includes('photo') ||
    type.toLowerCase().includes('image') ||
    /^https?:\/\//i.test(copy);

  return {
    label: copy || formatCareUpdateType(type),
    isPhoto,
    createdAt:
      getFirstDate(row, ['created_at', 'recorded_at', 'updated_at']) ??
      new Date(0),
  };
}

function formatCareUpdateType(type: string) {
  const normalized = type.toLowerCase();

  if (normalized.includes('potty') || normalized.includes('pee')) {
    return 'Potty update recorded';
  }

  if (normalized.includes('poop')) return 'Poop update recorded';
  if (normalized.includes('water')) return 'Fresh water provided';
  if (normalized.includes('food') || normalized.includes('feed')) {
    return 'Meal update recorded';
  }

  if (normalized.includes('photo')) return 'New photo added';
  if (normalized.includes('medication')) return 'Medication update recorded';
  if (normalized.includes('walk')) return 'Walk update recorded';
  if (normalized.includes('play')) return 'Playtime update recorded';

  return type ? formatStatus(type) : 'PawReport update added';
}

function getProfileLocation(profile: RecordRow) {
  const city = getFirstString(profile, ['city', 'home_city', 'service_city']);
  const state = getFirstString(profile, [
    'state',
    'home_state',
    'service_state',
  ]);
  const zip = getFirstString(profile, [
    'zip_code',
    'zip',
    'postal_code',
    'service_zip',
  ]);

  const cityState = [city, state].filter(Boolean).join(', ');
  return [cityState, zip].filter(Boolean).join(' ');
}

function getPetAgeLabel(row: RecordRow) {
  const explicit = getFirstString(row, ['age_label', 'age']);
  if (explicit) return explicit;

  const years = getFirstNumber(row, ['age_years', 'years_old']);
  if (years !== null) {
    return `${Math.round(years)} ${Math.round(years) === 1 ? 'yr' : 'yrs'}`;
  }

  const birthDate = getFirstDate(row, ['birth_date', 'birthday', 'date_of_birth']);
  if (!birthDate) return '';

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? `${age} ${age === 1 ? 'yr' : 'yrs'}` : '';
}

function getFirstString(record: RecordRow, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function getFirstNumber(record: RecordRow, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

function getFirstBoolean(record: RecordRow, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'boolean') return value;
    if (value === 1 || value === '1' || value === 'true') return true;
  }

  return false;
}

function getFirstDate(record: RecordRow, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }

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

function normalizeDistanceMiles(
  value: number | null,
  unit: string,
): number | null {
  if (value === null) return null;

  const normalizedUnit = unit.toLowerCase();

  if (normalizedUnit.includes('meter')) return value / 1609.344;
  if (normalizedUnit.includes('km') || normalizedUnit.includes('kilometer')) {
    return value * 0.621371;
  }

  return value;
}

function isUpcomingStatus(status: string) {
  return [
    'accepted',
    'confirmed',
    'approved',
    'scheduled',
    'pending',
    'requested',
    'submitted',
    'awaiting',
    'awaiting_response',
  ].includes(status);
}

function isActiveCareStatus(status: string) {
  return [
    'active',
    'in_progress',
    'started',
    'checked_in',
    'walk_in_progress',
    'care_in_progress',
    'live',
  ].includes(status);
}

function isRecentCompletedCare(care: LiveCare) {
  if (!['completed', 'complete', 'finished', 'ended'].includes(care.status)) {
    return false;
  }

  const endTime = care.endedAt?.getTime();
  if (!endTime) return true;

  return Date.now() - endTime <= 72 * 60 * 60 * 1000;
}

function compareBookings(a: DashboardBooking, b: DashboardBooking) {
  if (a.active && !b.active) return -1;
  if (!a.active && b.active) return 1;

  const aTime = a.startAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const bTime = b.startAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return aTime - bTime;
}

function compareLiveCare(a: LiveCare, b: LiveCare) {
  if (isActiveCareStatus(a.status) && !isActiveCareStatus(b.status)) return -1;
  if (!isActiveCareStatus(a.status) && isActiveCareStatus(b.status)) return 1;

  const aTime =
    a.startedAt?.getTime() ??
    a.endedAt?.getTime() ??
    Number.MIN_SAFE_INTEGER;
  const bTime =
    b.startedAt?.getTime() ??
    b.endedAt?.getTime() ??
    Number.MIN_SAFE_INTEGER;

  return bTime - aTime;
}

function getElapsedMinutes(care: LiveCare, now: number) {
  if (care.durationMinutes !== null && care.endedAt) {
    return Math.max(0, Math.round(care.durationMinutes));
  }

  if (!care.startedAt) {
    return Math.max(0, Math.round(care.durationMinutes ?? 0));
  }

  return Math.max(
    0,
    Math.round(
      ((care.endedAt?.getTime() ?? now) - care.startedAt.getTime()) / 60_000,
    ),
  );
}

function formatBookingDay(date: Date | null) {
  if (!date) return 'Upcoming';

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (isSameCalendarDay(date, today)) return 'Today';
  if (isSameCalendarDay(date, tomorrow)) return 'Tomorrow';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatBookingTime(date: Date | null) {
  if (!date) return 'Time to be confirmed';

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatRelativeTime(date: Date | null) {
  if (!date) return 'Live';

  const minutes = Math.max(
    0,
    Math.round((Date.now() - date.getTime()) / 60_000),
  );

  if (minutes < 1) return 'Now';
  if (minutes === 1) return '1 min ago';
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  return `${hours} ${hours === 1 ? 'hr' : 'hrs'} ago`;
}

function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatStatus(status: string) {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return 'PP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatBadge(value: number) {
  return value > 99 ? '99+' : String(value);
}

function getPalette(isDark: boolean) {
  return {
    background: isDark ? '#06140F' : '#FFF9F1',
    surface: isDark ? '#0B2118' : '#FFFEFA',
    surfaceSoft: isDark ? '#102D21' : '#FFF6E9',
    surfaceGreen: isDark ? '#123624' : '#EEF8E8',
    border: isDark ? '#234B38' : '#EADDCB',
    borderStrong: isDark ? '#2D6548' : '#D8C7B0',
    title: isDark ? '#FFF5E8' : '#123F31',
    text: isDark ? '#E8EEE9' : '#27483E',
    muted: isDark ? '#9DB0A5' : '#738078',
    primary: isDark ? '#39D982' : '#087449',
    primaryDark: isDark ? '#1C9F5E' : '#075D3B',
    primarySoft: isDark ? '#123E2A' : '#E4F5E9',
    orange: '#F15A3A',
    gold: '#F4B93E',
    white: '#FFFFFF',
    avatarBg: isDark ? '#173527' : '#EEF5EE',
    avatarBorder: isDark ? '#2E6C4B' : '#FFFFFF',
    routeBg: isDark ? '#142A22' : '#EDF3EE',
    routeStreet: isDark ? '#284538' : '#D8E1DA',
    shadow: '#000000',
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
      overflow: 'hidden',
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
    scrollContent: {
      gap: 14,
      paddingBottom: 112,
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
      gap: 2,
      paddingRight: 8,
    },
    dashboardTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 21,
      letterSpacing: -0.45,
      lineHeight: 25,
    },
    welcomeText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 12,
    },
    wave: {
      fontSize: 12,
    },
    locationRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
      marginTop: 2,
    },
    locationText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 10,
    },
    headerActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    headerIconButton: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: TOUCH_MIN,
      justifyContent: 'center',
      position: 'relative',
      width: TOUCH_MIN,
    },
    headerBadge: {
      alignItems: 'center',
      backgroundColor: palette.orange,
      borderColor: palette.surface,
      borderRadius: 999,
      borderWidth: 1.5,
      justifyContent: 'center',
      minHeight: 17,
      minWidth: 17,
      paddingHorizontal: 4,
      position: 'absolute',
      right: -2,
      top: -4,
    },
    headerBadgeText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
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
      borderRadius: 12,
      height: TOUCH_MIN,
      justifyContent: 'center',
      minWidth: TOUCH_MIN,
      width: TOUCH_MIN,
    },
    modeButtonActive: {
      backgroundColor: isDark ? 'rgba(226,170,45,0.18)' : '#FFF4D8',
    },
    profileButton: {
      borderRadius: 999,
    },

    loadNotice: {
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.border,
      borderRadius: 14,
      borderWidth: 1,
      padding: 10,
    },
    loadNoticeText: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 14,
    },

    primaryActionCard: {
      alignItems: 'center',
      backgroundColor: isDark ? '#087A4C' : '#087F50',
      borderRadius: 22,
      flexDirection: 'row',
      gap: 11,
      minHeight: 86,
      padding: 14,
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 9 },
      shadowOpacity: isDark ? 0.26 : 0.13,
      shadowRadius: 17,
    },
    primaryActionIcon: {
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderRadius: 16,
      height: 48,
      justifyContent: 'center',
      width: 48,
    },
    primaryActionCopy: {
      flex: 1,
      gap: 1,
    },
    primaryActionEyebrow: {
      color: 'rgba(255,255,255,0.78)',
      fontFamily: AppFonts.bold,
      fontSize: 8,
      letterSpacing: 0.8,
    },
    primaryActionTitle: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 18,
      letterSpacing: -0.25,
    },
    primaryActionText: {
      color: 'rgba(255,255,255,0.83)',
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 14,
    },

    sectionHeader: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 1,
    },
    petsSectionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 2,
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
    sectionLink: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 13,
    },
    sectionLinkButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: TOUCH_MIN,
      minWidth: TOUCH_MIN,
      paddingHorizontal: 8,
    },

    loadingCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 10,
      padding: 14,
    },
    loadingBarLarge: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 15,
      width: '52%',
    },
    loadingBarMedium: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 11,
      width: '76%',
    },
    loadingBarSmall: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 10,
      width: '34%',
    },

    emptyCareCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      padding: 13,
    },
    emptyCareIcon: {
      alignItems: 'center',
      backgroundColor: '#E4F5E9',
      borderRadius: 15,
      height: 46,
      justifyContent: 'center',
      width: 46,
    },
    emptyCareCopy: {
      flex: 1,
      gap: 2,
    },
    emptyCareTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
    },
    emptyCareText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
    },
    emptyCareButton: {
      alignItems: 'center',
      backgroundColor: palette.primary,
      borderRadius: 14,
      justifyContent: 'center',
      minHeight: TOUCH_MIN,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    emptyCareButtonText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.bold,
      fontSize: 14,
    },

    bookingCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 11,
      padding: 13,
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: isDark ? 0.18 : 0.05,
      shadowRadius: 14,
    },
    bookingHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    bookingDay: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
    },
    bookingTime: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 11,
      marginTop: 1,
    },
    bookingStatusPill: {
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },
    bookingStatusText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
      letterSpacing: 0.3,
    },
    bookingPeopleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 9,
    },
    bookingMain: {
      flex: 1,
      gap: 2,
    },
    bookingService: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 15,
    },
    bookingPetName: {
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    bookingMetaRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 3,
    },
    bookingMetaText: {
      color: palette.muted,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 9,
    },
    bookingFooter: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderRadius: 13,
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 9,
    },
    bookingFooterText: {
      color: palette.text,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 12,
    },

    liveCard: {
      backgroundColor: isDark ? '#0D1C18' : palette.surface,
      borderColor: isDark ? '#254A3A' : palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 10,
      padding: 13,
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.24 : 0.06,
      shadowRadius: 15,
    },
    liveHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'space-between',
    },
    liveCopy: {
      flex: 1,
      gap: 2,
    },
    liveStatusPill: {
      alignSelf: 'flex-start',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    liveStatusText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 7,
      letterSpacing: 0.5,
    },
    liveTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 16,
      letterSpacing: -0.25,
      marginTop: 2,
    },
    liveStartedText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
    },
    liveGuru: {
      alignItems: 'center',
      maxWidth: 76,
    },
    liveGuruName: {
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 8,
      marginTop: 2,
      textAlign: 'center',
    },
    liveMetrics: {
      alignItems: 'center',
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      borderTopColor: palette.border,
      borderTopWidth: 1,
      flexDirection: 'row',
      paddingVertical: 8,
    },
    liveMetric: {
      flex: 1,
      gap: 1,
    },
    liveMetricDivider: {
      backgroundColor: palette.border,
      height: 28,
      width: 1,
    },
    liveMetricValue: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 15,
    },
    liveMetricLabel: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },

    routePreview: {
      backgroundColor: palette.routeBg,
      borderRadius: 13,
      height: 76,
      overflow: 'hidden',
      position: 'relative',
    },
    routeStreetOne: {
      backgroundColor: palette.routeStreet,
      height: 6,
      left: -10,
      position: 'absolute',
      top: 28,
      transform: [{ rotate: '-8deg' }],
      width: '115%',
    },
    routeStreetTwo: {
      backgroundColor: palette.routeStreet,
      height: 5,
      left: 112,
      position: 'absolute',
      top: -8,
      transform: [{ rotate: '72deg' }],
      width: 110,
    },
    routeLineOne: {
      backgroundColor: palette.primary,
      borderRadius: 999,
      height: 3,
      left: 70,
      position: 'absolute',
      top: 43,
      transform: [{ rotate: '-14deg' }],
      width: 85,
    },
    routeLineTwo: {
      backgroundColor: palette.primary,
      borderRadius: 999,
      height: 3,
      left: 145,
      position: 'absolute',
      top: 34,
      transform: [{ rotate: '19deg' }],
      width: 72,
    },
    routeStartDot: {
      backgroundColor: '#2D9CDB',
      borderColor: '#FFFFFF',
      borderRadius: 999,
      borderWidth: 2,
      height: 11,
      left: 66,
      position: 'absolute',
      top: 39,
      width: 11,
    },
    routeEndDot: {
      backgroundColor: palette.primary,
      borderColor: '#FFFFFF',
      borderRadius: 999,
      borderWidth: 2,
      height: 11,
      left: 210,
      position: 'absolute',
      top: 43,
      width: 11,
    },
    routePreviewLabel: {
      bottom: 6,
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 7,
      left: 8,
      position: 'absolute',
    },
    visitTimelinePreview: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderRadius: 13,
      flexDirection: 'row',
      gap: 8,
      minHeight: 54,
      padding: 10,
    },
    timelineDot: {
      backgroundColor: palette.primary,
      borderRadius: 999,
      height: 11,
      width: 11,
    },
    timelineLine: {
      backgroundColor: palette.primary,
      height: 2,
      width: 34,
    },
    visitTimelineText: {
      color: palette.text,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 12,
    },
    latestUpdateRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    latestUpdateText: {
      color: palette.text,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 12,
    },
    latestUpdateTime: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },

    twoButtonRow: {
      flexDirection: 'column',
      gap: 8,
      width: '100%',
    },
    filledButton: {
      alignItems: 'center',
      backgroundColor: palette.primary,
      borderRadius: 14,
      justifyContent: 'center',
      minHeight: TOUCH_MIN,
      paddingHorizontal: 14,
      width: '100%',
    },
    filledButtonText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 14,
    },
    outlineButton: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.primary,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
      minHeight: TOUCH_MIN,
      paddingHorizontal: 14,
      width: '100%',
    },
    outlineButtonText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 14,
    },

    completedCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      padding: 13,
    },
    completedIcon: {
      alignItems: 'center',
      backgroundColor: '#E4F5E9',
      borderRadius: 14,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    completedCopy: {
      flex: 1,
      gap: 2,
    },
    completedEyebrow: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 7,
      letterSpacing: 0.6,
    },
    completedTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
    },
    completedText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 12,
    },
    completedButton: {
      alignItems: 'center',
      backgroundColor: palette.primary,
      borderRadius: 14,
      justifyContent: 'center',
      minHeight: TOUCH_MIN,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    completedButtonText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 14,
    },

    quickActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      width: '100%',
    },
    quickActionsCompact: {
      flexWrap: 'wrap',
    },
    quickAction: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 16,
      borderWidth: 1,
      flexGrow: 1,
      gap: 6,
      justifyContent: 'center',
      minHeight: 88,
      minWidth: '46%',
      paddingHorizontal: 10,
      paddingVertical: 12,
    },
    quickActionIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      height: TOUCH_MIN,
      justifyContent: 'center',
      position: 'relative',
      width: TOUCH_MIN,
    },
    quickActionBadge: {
      alignItems: 'center',
      backgroundColor: palette.orange,
      borderColor: palette.surface,
      borderRadius: 999,
      borderWidth: 1.5,
      justifyContent: 'center',
      minHeight: 20,
      minWidth: 20,
      paddingHorizontal: 4,
      position: 'absolute',
      right: -4,
      top: -4,
    },
    quickActionBadgeText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
    },
    quickActionLabel: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 13,
      textAlign: 'center',
    },
    menuCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      overflow: 'hidden',
    },
    activityRow: {
      alignItems: 'center',
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 10,
      minHeight: TOUCH_MIN,
      paddingHorizontal: 13,
      paddingVertical: 10,
      width: '100%',
    },
    activityRowLast: {
      borderBottomWidth: 0,
    },
    activityIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 12,
      height: TOUCH_MIN,
      justifyContent: 'center',
      width: TOUCH_MIN,
    },
    activityLabel: {
      color: palette.title,
      flex: 1,
      flexShrink: 1,
      fontFamily: AppFonts.bold,
      fontSize: 14,
      minWidth: 0,
    },
    activityBadge: {
      alignItems: 'center',
      backgroundColor: palette.orange,
      borderRadius: 999,
      justifyContent: 'center',
      minHeight: 21,
      minWidth: 21,
      paddingHorizontal: 6,
    },
    activityBadgeText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },

    addPetButton: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: TOUCH_MIN,
      justifyContent: 'center',
      width: TOUCH_MIN,
    },
    petsCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 10,
      padding: 13,
    },
    petPreviewList: {
      gap: 8,
    },
    petPreviewRow: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderRadius: 15,
      flexDirection: 'row',
      gap: 9,
      padding: 9,
    },
    petPreviewCopy: {
      flex: 1,
      gap: 2,
    },
    petName: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
    },
    petMeta: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
    },
    petStatusPill: {
      alignSelf: 'flex-start',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      marginTop: 2,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    petStatusPillIncomplete: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
    },
    petStatusText: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 7,
    },
    petStatusTextIncomplete: {
      color: palette.muted,
    },
    petEmptyState: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderRadius: 15,
      flexDirection: 'row',
      gap: 10,
      padding: 11,
    },
    petEmptyIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 13,
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    petEmptyCopy: {
      flex: 1,
      gap: 2,
    },
    petEmptyTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
    },
    petEmptyText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
    },
    managePetsButton: {
      alignItems: 'center',
      backgroundColor: palette.primary,
      borderRadius: 14,
      justifyContent: 'center',
      minHeight: TOUCH_MIN,
      paddingHorizontal: 16,
      width: '100%',
    },
    managePetsButtonText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 14,
    },

    rewardsCard: {
      alignItems: 'center',
      backgroundColor: palette.surfaceGreen,
      borderColor: isDark ? palette.borderStrong : '#DCE9D4',
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 11,
      minHeight: 96,
      padding: 13,
    },
    rewardsIcon: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderRadius: 15,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    rewardsCopy: {
      flex: 1,
      gap: 2,
    },
    rewardsTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
    },
    rewardsValue: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 18,
      letterSpacing: -0.25,
    },
    rewardsText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 12,
    },

    toolsCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      overflow: 'hidden',
    },
    toolRow: {
      alignItems: 'center',
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 10,
      minHeight: TOUCH_MIN,
      paddingHorizontal: 12,
      width: '100%',
    },
    toolRowLast: {
      borderBottomWidth: 0,
    },
    toolIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 12,
      height: TOUCH_MIN,
      justifyContent: 'center',
      width: TOUCH_MIN,
    },
    toolLabel: {
      color: palette.title,
      flex: 1,
      flexShrink: 1,
      fontFamily: AppFonts.bold,
      fontSize: 14,
      minWidth: 0,
    },
  });
}