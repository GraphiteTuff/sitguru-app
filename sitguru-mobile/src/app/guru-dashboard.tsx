import { router, type Href } from 'expo-router';
import {
  Bell,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Gift,
  Home,
  MapPin,
  MessageCircle,
  PawPrint,
  Search,
  Sparkles,
  UserRound,
  WalletCards,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
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
  useThemePreference,
  type SitGuruThemePreference,
} from '@/hooks/use-color-scheme';
import { useThemeMode } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { resolveSupabaseStorageUrl } from '@/lib/storage';
import {
  isSupabaseConfigured,
  supabase,
} from '@/lib/supabase';

type RecordRow = Record<string, unknown>;

type GuruBooking = {
  id: string;
  status: string;
  serviceLabel: string;
  petName: string;
  petPhotoUrl: string | null;
  petParentName: string;
  startAt: Date | null;
  endAt: Date | null;
  location: string;
  earnings: number;
  pending: boolean;
  active: boolean;
  completed: boolean;
};

type GuruRequest = {
  id: string;
  serviceLabel: string;
  petName: string;
  petPhotoUrl: string | null;
  startAt: Date | null;
  distanceMiles: number | null;
  earnings: number;
};

type LiveCare = {
  id: string;
  isWalk: boolean;
  petName: string;
  startedAt: Date | null;
};

type PayoutSummary = {
  connected: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  actionRequired: boolean;
  disabledReason: string;
  available: number;
  pending: number;
  nextPayoutAt: Date | null;
};

type ReferralSummary = {
  clicks: number;
  signups: number;
  qualified: number;
  earned: number;
};

type DashboardData = {
  bookings: GuruBooking[];
  requests: GuruRequest[];
  unreadMessages: number;
  unreadNotifications: number;
  liveCare: LiveCare | null;
  earningsMonth: number;
  earningsWeek: number;
  earningsLastMonth: number;
  completedBookings: number;
  payout: PayoutSummary;
  referrals: ReferralSummary;
};

type PrimaryActionIcon =
  | 'paw'
  | 'calendar'
  | 'request'
  | 'payout'
  | 'profile'
  | 'search';

type PrimaryAction = {
  eyebrow: string;
  title: string;
  helper: string;
  route: Href;
  icon: PrimaryActionIcon;
};

const EMPTY_DATA: DashboardData = {
  bookings: [],
  requests: [],
  unreadMessages: 0,
  unreadNotifications: 0,
  liveCare: null,
  earningsMonth: 0,
  earningsWeek: 0,
  earningsLastMonth: 0,
  completedBookings: 0,
  payout: {
    connected: false,
    payoutsEnabled: false,
    detailsSubmitted: false,
    actionRequired: false,
    disabledReason: '',
    available: 0,
    pending: 0,
    nextPayoutAt: null,
  },
  referrals: {
    clicks: 0,
    signups: 0,
    qualified: 0,
    earned: 0,
  },
};

const THEME_OPTIONS: Array<{
  label: string;
  value: SitGuruThemePreference;
  icon: 'sun' | 'moon';
}> = [
  {
    label: 'Light',
    value: 'light',
    icon: 'sun',
  },
  {
    label: 'Dark',
    value: 'dark',
    icon: 'moon',
  },
];

const BOOKING_TABLES = [
  'bookings',
  'booking_requests',
  'service_requests',
];

const GURU_FIELDS = [
  'guru_id',
  'provider_id',
  'sitter_id',
  'caregiver_id',
  'assigned_guru_id',
  'user_id',
];

const CONVERSATION_TABLES = [
  'conversations',
  'message_threads',
];

const CONVERSATION_FIELDS = [
  'guru_id',
  'provider_id',
  'participant_id',
  'user_id',
];

const NOTIFICATION_TABLES = [
  'notifications',
  'user_notifications',
];

const NOTIFICATION_FIELDS = [
  'user_id',
  'recipient_id',
  'profile_id',
  'guru_id',
];

const PAYOUT_TABLES = [
  'guru_payout_accounts',
  'stripe_connected_accounts',
  'connected_accounts',
  'payout_accounts',
];

const PAYOUT_FIELDS = [
  'guru_id',
  'user_id',
  'profile_id',
  'owner_id',
];

const REFERRAL_TABLES = [
  'referral_performance',
  'referral_stats',
  'guru_referrals',
  'referrals',
];

const REFERRAL_FIELDS = [
  'referrer_id',
  'guru_id',
  'user_id',
  'owner_id',
];

const SESSION_TABLES = [
  'booking_visit_sessions',
  'pawreport_sessions',
  'visit_sessions',
];

const SESSION_FIELDS = [
  'guru_id',
  'provider_id',
  'caregiver_id',
  'user_id',
];

const REALTIME_TABLES = [
  'bookings',
  'booking_requests',
  'service_requests',
  'conversations',
  'messages',
  'notifications',
  'booking_visit_sessions',
  'guru_payout_accounts',
  'referrals',
];

export default function GuruDashboardScreen() {
  const { user, profile } = useAuth();
  const themeMode = useThemeMode();
  const themePreference = useThemePreference();

  const isDark = themeMode === 'dark';
  const isWebPreview = Platform.OS === 'web';
  const palette = getPalette(isDark);
  const styles = createStyles(isDark);

  const profileRecord = useMemo(
    () => (profile ?? {}) as RecordRow,
    [profile],
  );

  const [data, setData] =
    useState<DashboardData>(EMPTY_DATA);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [loadMessage, setLoadMessage] =
    useState('');

  const [now, setNow] =
    useState(Date.now());

  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] =
    useState(false);

  const profileName =
    firstString(profileRecord, [
      'full_name',
      'display_name',
    ]) ||
    [
      profile?.first_name,
      profile?.last_name,
    ]
      .filter(Boolean)
      .join(' ') ||
    user?.email?.split('@')[0] ||
    'Guru';

  const firstName =
    profileName
      .split(/\s+/)
      .filter(Boolean)[0] ||
    'Guru';

  const avatarUrl =
    resolveSupabaseStorageUrl(
      firstString(profileRecord, [
        'avatar_url',
        'photo_url',
        'profile_photo_url',
        'profile_image_url',
      ]),
    );

  const city = firstString(
    profileRecord,
    ['service_city', 'city'],
  );

  const state = firstString(
    profileRecord,
    ['service_state', 'state'],
  );

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

  const acceptingBookings =
    firstBoolean(profileRecord, [
      'accepting_bookings',
      'is_accepting_bookings',
      'available_for_bookings',
      'is_available',
    ]);

  const profileCompletion =
    getProfileCompletion(
      profileRecord,
      avatarUrl,
    );

  const refreshDashboard = useCallback(
    async (showRefresh = false) => {
      if (
        !user?.id ||
        !isSupabaseConfigured
      ) {
        setData(EMPTY_DATA);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        setData(
          await loadDashboard(
            user.id,
            profileRecord,
          ),
        );

        setLoadMessage('');
      } catch {
        setLoadMessage(
          'Some Guru activity could not be loaded. Pull down to try again.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      profileRecord,
      user?.id,
    ],
  );

  useEffect(() => {
    void refreshDashboard(false);
  }, [refreshDashboard]);

  useEffect(() => {
    const timer = setInterval(
      () => setNow(Date.now()),
      30_000,
    );

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (
      !user?.id ||
      !isSupabaseConfigured
    ) {
      return;
    }

    let effectActive = true;
    let timer:
      | ReturnType<typeof setTimeout>
      | null = null;

    const refreshSoon = () => {
      if (!effectActive) {
        return;
      }

      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        if (effectActive) {
          void refreshDashboard(false);
        }
      }, 450);
    };

    const channelName = [
      'guru-dashboard',
      user.id,
      Date.now().toString(36),
      Math.random().toString(36).slice(2, 8),
    ].join('-');

    const channel = supabase.channel(
      channelName,
    );

    REALTIME_TABLES.forEach(
      (table) => {
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
          },
          refreshSoon,
        );
      },
    );

    channel.subscribe();

    return () => {
      effectActive = false;

      if (timer) {
        clearTimeout(timer);
      }

      void supabase.removeChannel(
        channel,
      );
    };
  }, [
    refreshDashboard,
    user?.id,
  ]);

  const nextBooking =
    data.bookings
      .filter(
        (booking) =>
          !booking.pending &&
          !booking.completed,
      )
      .sort(compareBookings)[0] ??
    null;

  const pendingRequest =
    data.requests[0] ?? null;

  const todayBookings =
    data.bookings.filter((booking) =>
      sameDay(
        booking.startAt,
        new Date(),
      ),
    );

  const upcomingCount =
    data.bookings.filter(
      (booking) =>
        !booking.pending &&
        !booking.completed,
    ).length;

  const trendPercent =
    data.earningsLastMonth > 0
      ? Math.round(
          ((data.earningsMonth -
            data.earningsLastMonth) /
            data.earningsLastMonth) *
            100,
        )
      : data.earningsMonth > 0
        ? 100
        : 0;

  const primaryAction =
    useMemo<PrimaryAction>(() => {
      if (data.liveCare) {
        return {
          eyebrow:
            data.liveCare.isWalk
              ? 'WALK IN PROGRESS'
              : 'CARE IN PROGRESS',
          title:
            data.liveCare.isWalk
              ? 'Continue Live Walk'
              : 'Continue PawReport',
          helper: `${
            data.liveCare.petName
          } • ${elapsed(
            data.liveCare.startedAt,
            now,
          )}`,
          route: '/guru-live-walk',
          icon: 'paw',
        };
      }

      if (
        nextBooking &&
        startingSoon(
          nextBooking.startAt,
        )
      ) {
        return {
          eyebrow: 'STARTING SOON',
          title:
            'Prepare for Next Booking',
          helper: `${
            nextBooking.serviceLabel
          } • ${formatTime(
            nextBooking.startAt,
          )}`,
          route: '/booking-details',
          icon: 'calendar',
        };
      }

      if (pendingRequest) {
        return {
          eyebrow: 'NEW REQUEST',
          title:
            'Review Care Request',
          helper: `${
            pendingRequest.serviceLabel
          } • ${formatDay(
            pendingRequest.startAt,
          )}`,
          route: '/guru-requests',
          icon: 'request',
        };
      }

      if (
        data.payout.actionRequired
      ) {
        return {
          eyebrow:
            'PAYOUT ACTION REQUIRED',
          title:
            'Finish Payout Setup',
          helper:
            data.payout
              .disabledReason ||
            'Stripe needs additional information.',
          route: '/payments',
          icon: 'payout',
        };
      }

      if (nextBooking) {
        return {
          eyebrow: 'NEXT UP',
          title:
            'View Upcoming Booking',
          helper: `${
            nextBooking.serviceLabel
          } • ${formatDay(
            nextBooking.startAt,
          )}`,
          route: '/booking-details',
          icon: 'calendar',
        };
      }

      if (
        profileCompletion < 100
      ) {
        return {
          eyebrow:
            'GROW YOUR BUSINESS',
          title:
            'Finish Your Guru Profile',
          helper: `${profileCompletion}% complete • Improve booking readiness.`,
          route: '/guru-profile',
          icon: 'profile',
        };
      }

      return {
        eyebrow: acceptingBookings
          ? 'ACCEPTING REQUESTS'
          : 'BUSINESS STATUS',
        title: acceptingBookings
          ? 'View Nearby Opportunities'
          : 'Update Availability',
        helper: acceptingBookings
          ? `Serving up to ${serviceRadius} miles`
          : 'Turn on accepting bookings when you are ready.',
        route: acceptingBookings
          ? '/guru-requests'
          : '/guru-pricing',
        icon: acceptingBookings
          ? 'search'
          : 'calendar',
      };
    }, [
      acceptingBookings,
      data.liveCare,
      data.payout.actionRequired,
      data.payout.disabledReason,
      nextBooking,
      now,
      pendingRequest,
      profileCompletion,
      serviceRadius,
    ]);

  const recommendation =
    getSuccessRecommendation(
      data.payout,
      profileCompletion,
      data.completedBookings,
      Boolean(pendingRequest),
    );

  return (
    <SitGuruScreen
      center={isWebPreview}
      maxWidth={620}
    >
      <RoleGate requiredRole="guru">
        <View
          style={[
            styles.previewCanvas,
            !isWebPreview &&
              styles.previewCanvasNative,
          ]}
        >
          <View
            style={[
              styles.deviceFrame,
              !isWebPreview &&
                styles.deviceFrameNative,
            ]}
          >
            {isWebPreview ? (
              <View
                style={
                  styles.deviceTopSpeaker
                }
              />
            ) : null}

            <View
              style={[
                styles.phoneShell,
                !isWebPreview &&
                  styles.phoneShellNative,
              ]}
            >
              <View style={styles.screen}>
                {isWebPreview ? (
                  <PhoneStatusBar
                    styles={styles}
                  />
                ) : null}

                <ScrollView
                  contentContainerStyle={
                    styles.scrollContent
                  }
                  refreshControl={
                    <RefreshControl
                      refreshing={
                        refreshing
                      }
                      onRefresh={() =>
                        void refreshDashboard(
                          true,
                        )
                      }
                      tintColor={
                        palette.primary
                      }
                      colors={[
                        palette.primary,
                      ]}
                    />
                  }
                  showsVerticalScrollIndicator={
                    false
                  }
                >
                  <View
                    style={styles.header}
                  >
                    <View
                      style={
                        styles.headerCopy
                      }
                    >
                      <Text
                        style={
                          styles.dashboardTitle
                        }
                      >
                        Guru Dashboard
                      </Text>

                      <Text
                        style={
                          styles.welcomeText
                        }
                      >
                        Good {dayPart()},{' '}
                        {firstName}!{' '}
                        <Text
                          style={
                            styles.wave
                          }
                        >
                          👋
                        </Text>
                      </Text>


                      <SitGuruRoleStatus role="guru" />

                      {city || state ? (
                        <View
                          style={
                            styles.locationRow
                          }
                        >
                          <MapPin
                            color={
                              palette.primary
                            }
                            size={12}
                            strokeWidth={
                              2.3
                            }
                          />

                          <Text
                            style={
                              styles.locationText
                            }
                          >
                            {[
                              city,
                              state,
                            ]
                              .filter(
                                Boolean,
                              )
                              .join(
                                ', ',
                              )}{' '}
                            •{' '}
                            {
                              serviceRadius
                            }{' '}
                            mi
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View
                      style={
                        styles.headerActions
                      }
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Open notifications"
                        onPress={() =>
                          router.push(
                            '/notifications',
                          )
                        }
                        style={
                          styles.headerIconButton
                        }
                      >
                        <Bell
                          color={
                            palette.title
                          }
                          size={18}
                          strokeWidth={
                            2.3
                          }
                        />

                        {data.unreadNotifications >
                        0 ? (
                          <View
                            style={
                              styles.headerBadge
                            }
                          >
                            <Text
                              style={
                                styles.headerBadgeText
                              }
                            >
                              {badge(
                                data.unreadNotifications,
                              )}
                            </Text>
                          </View>
                        ) : null}
                      </Pressable>

                      <View
                        style={
                          styles.modeToggle
                        }
                      >
                        {THEME_OPTIONS.map(
                          (option) => {
                            const active =
                              themePreference ===
                              option.value;

                            return (
                              <Pressable
                                key={
                                  option.value
                                }
                                accessibilityRole="button"
                                accessibilityLabel={`Switch to ${option.label} mode`}
                                accessibilityState={{
                                  selected:
                                    active,
                                }}
                                onPress={() =>
                                  setThemePreference(
                                    option.value,
                                  )
                                }
                                style={[
                                  styles.modeButton,
                                  active &&
                                    styles.modeButtonActive,
                                ]}
                              >
                                <SitGuruIcon
                                  name={
                                    option.icon
                                  }
                                  size={15}
                                  color={
                                    active
                                      ? option.value ===
                                        'light'
                                        ? '#F3AA1F'
                                        : isDark
                                          ? '#F0CF62'
                                          : palette.primary
                                      : palette.muted
                                  }
                                  strokeWidth={
                                    2.4
                                  }
                                />
                              </Pressable>
                            );
                          },
                        )}
                      </View>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Switch workspace"
                        onPress={() =>
                          setWorkspaceSwitcherOpen(true)
                        }
                        style={
                          styles.profileButton
                        }
                      >
                        <Avatar
                          fallback={initials(
                            profileName,
                          )}
                          imageUrl={
                            avatarUrl
                          }
                          palette={
                            palette
                          }
                          size={42}
                        />
                      </Pressable>
                    </View>
                  </View>

                  {loadMessage ? (
                    <View
                      style={
                        styles.loadNotice
                      }
                    >
                      <Text
                        style={
                          styles.loadNoticeText
                        }
                      >
                        {loadMessage}
                      </Text>
                    </View>
                  ) : null}

                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      router.push(
                        primaryAction.route,
                      )
                    }
                    style={
                      styles.primaryActionCard
                    }
                  >
                    <View
                      style={
                        styles.primaryActionCopy
                      }
                    >
                      <Text
                        style={
                          styles.primaryActionEyebrow
                        }
                      >
                        {
                          primaryAction.eyebrow
                        }
                      </Text>

                      <Text
                        style={
                          styles.primaryActionTitle
                        }
                      >
                        {
                          primaryAction.title
                        }
                      </Text>

                      <Text
                        style={
                          styles.primaryActionText
                        }
                      >
                        {
                          primaryAction.helper
                        }
                      </Text>
                    </View>

                    <View
                      style={
                        styles.primaryActionIcon
                      }
                    >
                      <PrimaryIcon
                        icon={
                          primaryAction.icon
                        }
                      />
                    </View>

                    <ChevronRight
                      color="#FFFFFF"
                      size={21}
                      strokeWidth={2.5}
                    />
                  </Pressable>

                  {loading ? (
                    <LoadingCard
                      styles={styles}
                    />
                  ) : (
                    <>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() =>
                          router.push(
                            '/payments',
                          )
                        }
                        style={
                          styles.earningsCard
                        }
                      >
                        <View
                          style={
                            styles.earningsTopRow
                          }
                        >
                          <View>
                            <Text
                              style={
                                styles.cardEyebrow
                              }
                            >
                              EARNINGS THIS
                              MONTH
                            </Text>

                            <Text
                              style={
                                styles.earningsValue
                              }
                            >
                              {currency(
                                data.earningsMonth,
                              )}
                            </Text>

                            <Text
                              style={[
                                styles.earningsTrend,
                                trendPercent <
                                  0 &&
                                  styles.earningsTrendNegative,
                              ]}
                            >
                              {trendPercent >=
                              0
                                ? '↑'
                                : '↓'}{' '}
                              {Math.abs(
                                trendPercent,
                              )}
                              % from last
                              month
                            </Text>
                          </View>

                          <MiniTrend
                            value={
                              data.earningsWeek
                            }
                            styles={
                              styles
                            }
                          />
                        </View>

                        <View
                          style={
                            styles.earningsStatsRow
                          }
                        >
                          <Metric
                            label="Available"
                            value={currency(
                              data.payout
                                .available,
                            )}
                            styles={
                              styles
                            }
                          />

                          <Metric
                            label="Pending"
                            value={currency(
                              data.payout
                                .pending,
                            )}
                            styles={
                              styles
                            }
                          />

                          <Metric
                            label="Next payout"
                            value={shortDate(
                              data.payout
                                .nextPayoutAt,
                            )}
                            styles={
                              styles
                            }
                          />
                        </View>
                      </Pressable>

                      <View
                        style={
                          styles.todayCard
                        }
                      >
                        <View
                          style={
                            styles.todayHeader
                          }
                        >
                          <View>
                            <Text
                              style={
                                styles.cardEyebrow
                              }
                            >
                              TODAY’S
                              BUSINESS
                            </Text>

                            <Text
                              style={
                                styles.cardTitle
                              }
                            >
                              At a glance
                            </Text>
                          </View>

                          <Pressable
                            accessibilityRole="button"
                            onPress={() =>
                              router.push(
                                '/guru-requests',
                              )
                            }
                          >
                            <Text
                              style={
                                styles.cardLink
                              }
                            >
                              View all
                            </Text>
                          </Pressable>
                        </View>

                        <BusinessRow
                          badgeCount={
                            todayBookings.length
                          }
                          helper={
                            nextBooking
                              ? `${formatTime(
                                  nextBooking.startAt,
                                )} • ${
                                  nextBooking.serviceLabel
                                }`
                              : 'No care scheduled today'
                          }
                          icon={
                            <CalendarDays
                              color={
                                palette.primary
                              }
                              size={17}
                              strokeWidth={
                                2.3
                              }
                            />
                          }
                          label="Bookings today"
                          onPress={() =>
                            router.push(
                              '/booking-details',
                            )
                          }
                          palette={
                            palette
                          }
                          styles={
                            styles
                          }
                        />

                        <BusinessRow
                          badgeCount={
                            data.requests
                              .length
                          }
                          helper={
                            pendingRequest
                              ? `${
                                  pendingRequest.petName
                                } • ${currency(
                                  pendingRequest.earnings,
                                )}`
                              : 'No requests awaiting response'
                          }
                          icon={
                            <Clock3
                              color={
                                palette.primary
                              }
                              size={17}
                              strokeWidth={
                                2.3
                              }
                            />
                          }
                          label="Pending requests"
                          onPress={() =>
                            router.push(
                              '/guru-requests',
                            )
                          }
                          palette={
                            palette
                          }
                          styles={
                            styles
                          }
                        />

                        <BusinessRow
                          badgeCount={
                            data.unreadMessages
                          }
                          helper="Pet Parent conversations"
                          icon={
                            <MessageCircle
                              color={
                                palette.primary
                              }
                              size={17}
                              strokeWidth={
                                2.3
                              }
                            />
                          }
                          label="Unread messages"
                          last
                          onPress={() =>
                            router.push({
                              pathname:
                                '/messages',
                              params: {
                                role: 'guru',
                              },
                            })
                          }
                          palette={
                            palette
                          }
                          styles={
                            styles
                          }
                        />
                      </View>
                    </>
                  )}

                  <View
                    style={
                      styles.quickActions
                    }
                  >
                    <QuickAction
                      badgeCount={
                        data.requests.length
                      }
                      icon={
                        <Clock3
                          color={
                            palette.primary
                          }
                          size={20}
                          strokeWidth={2.3}
                        />
                      }
                      label="Requests"
                      onPress={() =>
                        router.push(
                          '/guru-requests',
                        )
                      }
                      styles={styles}
                    />

                    <QuickAction
                      icon={
                        <CalendarDays
                          color={
                            palette.primary
                          }
                          size={20}
                          strokeWidth={2.3}
                        />
                      }
                      label="Calendar"
                      onPress={() =>
                        router.push(
                          '/guru-pricing',
                        )
                      }
                      styles={styles}
                    />

                    <QuickAction
                      badgeCount={
                        data.unreadMessages
                      }
                      icon={
                        <MessageCircle
                          color={
                            palette.primary
                          }
                          size={20}
                          strokeWidth={2.3}
                        />
                      }
                      label="Messages"
                      onPress={() =>
                        router.push({
                          pathname:
                            '/messages',
                          params: {
                            role: 'guru',
                          },
                        })
                      }
                      styles={styles}
                    />

                    <QuickAction
                      icon={
                        <PawPrint
                          color={
                            palette.primary
                          }
                          size={20}
                          strokeWidth={2.3}
                        />
                      }
                      label="PawReport"
                      onPress={() =>
                        router.push(
                          '/guru-live-walk',
                        )
                      }
                      styles={styles}
                    />
                  </View>

                  {pendingRequest ? (
                    <RequestCard
                      request={
                        pendingRequest
                      }
                      palette={palette}
                      styles={styles}
                    />
                  ) : null}

                  <View
                    style={
                      styles.statusGrid
                    }
                  >
                    <StatusCard
                      icon={
                        <WalletCards
                          color={
                            palette.primary
                          }
                          size={19}
                          strokeWidth={2.3}
                        />
                      }
                      label="Payouts"
                      value={payoutStatus(
                        data.payout,
                      )}
                      text={
                        data.payout
                          .actionRequired
                          ? 'Complete Stripe verification.'
                          : data.payout
                                .payoutsEnabled
                            ? `${currency(
                                data.payout
                                  .available,
                              )} available`
                            : 'Set up payouts to receive earnings.'
                      }
                      link={
                        data.payout
                          .actionRequired
                          ? 'Finish setup →'
                          : 'View earnings →'
                      }
                      onPress={() =>
                        router.push(
                          '/payments',
                        )
                      }
                      styles={styles}
                    />

                    <StatusCard
                      icon={
                        <Gift
                          color={
                            palette.primary
                          }
                          size={19}
                          strokeWidth={2.3}
                        />
                      }
                      label="Referrals"
                      value={currency(
                        data.referrals
                          .earned,
                      )}
                      text={`${data.referrals.clicks} clicks • ${data.referrals.signups} signups • ${data.referrals.qualified} qualified`}
                      link="Grow referrals →"
                      onPress={() =>
                        router.push(
                          '/guru-referrals',
                        )
                      }
                      styles={styles}
                    />
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      router.push(
                        '/guru-success-center',
                      )
                    }
                    style={
                      styles.successCard
                    }
                  >
                    <View
                      style={
                        styles.successIcon
                      }
                    >
                      <Sparkles
                        color={
                          palette.primary
                        }
                        size={21}
                        strokeWidth={2.3}
                      />
                    </View>

                    <View
                      style={
                        styles.successCopy
                      }
                    >
                      <Text
                        style={
                          styles.successEyebrow
                        }
                      >
                        GURU SUCCESS
                        CENTER
                      </Text>

                      <Text
                        style={
                          styles.successTitle
                        }
                      >
                        {
                          recommendation.title
                        }
                      </Text>

                      <Text
                        style={
                          styles.successText
                        }
                      >
                        {
                          recommendation.text
                        }
                      </Text>
                    </View>

                    <ChevronRight
                      color={
                        palette.primary
                      }
                      size={18}
                      strokeWidth={2.3}
                    />
                  </Pressable>

                  <View
                    style={
                      styles.availabilityCard
                    }
                  >
                    <Text
                      style={
                        styles.cardEyebrow
                      }
                    >
                      AVAILABILITY &
                      PROFILE
                    </Text>

                    <Text
                      style={
                        styles.cardTitle
                      }
                    >
                      Business readiness
                    </Text>

                    <View
                      style={
                        styles.availabilityRows
                      }
                    >
                      <ReadinessRow
                        good={
                          acceptingBookings
                        }
                        label="Accepting requests"
                        value={
                          acceptingBookings
                            ? 'On'
                            : 'Off'
                        }
                        styles={styles}
                      />

                      <ReadinessRow
                        good={
                          profileCompletion >=
                          90
                        }
                        label="Profile strength"
                        value={`${profileCompletion}%`}
                        styles={styles}
                      />

                      <ReadinessRow
                        good
                        label="Service radius"
                        value={`${serviceRadius} mi`}
                        styles={styles}
                      />
                    </View>

                    <View
                      style={
                        styles.twoButtonRow
                      }
                    >
                      <Pressable
                        accessibilityRole="button"
                        onPress={() =>
                          router.push(
                            '/guru-pricing',
                          )
                        }
                        style={
                          styles.outlineButton
                        }
                      >
                        <Text
                          style={
                            styles.outlineButtonText
                          }
                        >
                          Availability
                        </Text>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        onPress={() =>
                          router.push(
                            '/guru-profile',
                          )
                        }
                        style={
                          styles.filledButton
                        }
                      >
                        <Text
                          style={
                            styles.filledButtonText
                          }
                        >
                          Edit Profile
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </ScrollView>

                <View
                  style={
                    styles.bottomNav
                  }
                >
                  <BottomNavItem
                    active
                    icon={
                      <Home
                        color={
                          palette.primary
                        }
                        size={21}
                        strokeWidth={2.4}
                      />
                    }
                    label="Dashboard"
                    onPress={() =>
                      undefined
                    }
                    styles={styles}
                  />

                  <BottomNavItem
                    icon={
                      <MapPin
                        color={
                          palette.navMuted
                        }
                        size={21}
                        strokeWidth={2.3}
                      />
                    }
                    label="Care Map"
                    onPress={() =>
                      router.push(
                        '/guru-care-map',
                      )
                    }
                    styles={styles}
                  />

                  <BottomNavItem
                    badgeCount={
                      upcomingCount +
                      data.requests.length
                    }
                    icon={
                      <CalendarDays
                        color={
                          palette.navMuted
                        }
                        size={21}
                        strokeWidth={2.3}
                      />
                    }
                    label="Bookings"
                    onPress={() =>
                      router.push(
                        '/guru-requests',
                      )
                    }
                    styles={styles}
                  />

                  <BottomNavItem
                    badgeCount={
                      data.unreadMessages
                    }
                    icon={
                      <MessageCircle
                        color={
                          palette.navMuted
                        }
                        size={21}
                        strokeWidth={2.3}
                      />
                    }
                    label="Messages"
                    onPress={() =>
                      router.push({
                        pathname:
                          '/messages',
                        params: {
                          role: 'guru',
                        },
                      })
                    }
                    styles={styles}
                  />

                  <BottomNavItem
                    icon={
                      <UserRound
                        color={
                          palette.navMuted
                        }
                        size={21}
                        strokeWidth={2.3}
                      />
                    }
                    label="Profile"
                    onPress={() =>
                      setWorkspaceSwitcherOpen(true)
                    }
                    styles={styles}
                  />
                </View>

                <SitGuruWorkspaceSwitcher
                  currentRole="guru"
                  onClose={() => setWorkspaceSwitcherOpen(false)}
                  visible={workspaceSwitcherOpen}
                />
              </View>
            </View>

            {isWebPreview ? (
              <View
                style={
                  styles.homeIndicator
                }
              />
            ) : null}
          </View>
        </View>
      </RoleGate>
    </SitGuruScreen>
  );
}

function PrimaryIcon({
  icon,
}: {
  icon: PrimaryActionIcon;
}) {
  if (icon === 'paw') {
    return (
      <PawPrint
        color="#FFFFFF"
        size={21}
        strokeWidth={2.4}
      />
    );
  }

  if (icon === 'calendar') {
    return (
      <CalendarDays
        color="#FFFFFF"
        size={21}
        strokeWidth={2.4}
      />
    );
  }

  if (icon === 'request') {
    return (
      <Clock3
        color="#FFFFFF"
        size={21}
        strokeWidth={2.4}
      />
    );
  }

  if (icon === 'payout') {
    return (
      <CircleDollarSign
        color="#FFFFFF"
        size={21}
        strokeWidth={2.4}
      />
    );
  }

  if (icon === 'profile') {
    return (
      <UserRound
        color="#FFFFFF"
        size={21}
        strokeWidth={2.4}
      />
    );
  }

  return (
    <Search
      color="#FFFFFF"
      size={21}
      strokeWidth={2.4}
    />
  );
}

function LoadingCard({
  styles,
}: {
  styles: ReturnType<
    typeof createStyles
  >;
}) {
  return (
    <View style={styles.loadingCard}>
      <View
        style={
          styles.loadingBarLarge
        }
      />
      <View
        style={
          styles.loadingBarMedium
        }
      />
      <View
        style={
          styles.loadingBarSmall
        }
      />
    </View>
  );
}

function Metric({
  label,
  styles,
  value,
}: {
  label: string;
  styles: ReturnType<
    typeof createStyles
  >;
  value: string;
}) {
  return (
    <View style={styles.metric}>
      <Text
        style={styles.metricValue}
      >
        {value}
      </Text>

      <Text
        style={styles.metricLabel}
      >
        {label}
      </Text>
    </View>
  );
}

function MiniTrend({
  styles,
  value,
}: {
  styles: ReturnType<
    typeof createStyles
  >;
  value: number;
}) {
  const values = [
    value * 0.4,
    value * 0.52,
    value * 0.48,
    value * 0.66,
    value * 0.63,
    value * 0.82,
    value,
  ];

  const max = Math.max(
    ...values,
    1,
  );

  return (
    <View style={styles.trendChart}>
      {values.map(
        (item, index) => (
          <View
            key={`${index}-${item}`}
            style={[
              styles.trendBar,
              {
                height: Math.max(
                  5,
                  Math.round(
                    (item / max) * 38,
                  ),
                ),
              },
            ]}
          />
        ),
      )}
    </View>
  );
}

function BusinessRow({
  badgeCount,
  helper,
  icon,
  label,
  last = false,
  onPress,
  palette,
  styles,
}: {
  badgeCount: number;
  helper: string;
  icon: ReactNode;
  label: string;
  last?: boolean;
  onPress: () => void;
  palette: ReturnType<
    typeof getPalette
  >;
  styles: ReturnType<
    typeof createStyles
  >;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.businessRow,
        last &&
          styles.businessRowLast,
      ]}
    >
      <View
        style={
          styles.businessIcon
        }
      >
        {icon}
      </View>

      <View
        style={
          styles.businessCopy
        }
      >
        <Text
          style={
            styles.businessLabel
          }
        >
          {label}
        </Text>

        <Text
          style={
            styles.businessHelper
          }
          numberOfLines={1}
        >
          {helper}
        </Text>
      </View>

      {badgeCount > 0 ? (
        <View
          style={
            styles.businessBadge
          }
        >
          <Text
            style={
              styles.businessBadgeText
            }
          >
            {badge(badgeCount)}
          </Text>
        </View>
      ) : null}

      <ChevronRight
        color={palette.muted}
        size={17}
        strokeWidth={2.3}
      />
    </Pressable>
  );
}

function QuickAction({
  badgeCount = 0,
  icon,
  label,
  onPress,
  styles,
}: {
  badgeCount?: number;
  icon: ReactNode;
  label: string;
  onPress: () => void;
  styles: ReturnType<
    typeof createStyles
  >;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        pressed &&
          styles.pressed,
      ]}
    >
      <View
        style={
          styles.quickActionIcon
        }
      >
        {icon}

        {badgeCount > 0 ? (
          <View
            style={
              styles.quickActionBadge
            }
          >
            <Text
              style={
                styles.quickActionBadgeText
              }
            >
              {badge(badgeCount)}
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        style={
          styles.quickActionLabel
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

function RequestCard({
  palette,
  request,
  styles,
}: {
  palette: ReturnType<
    typeof getPalette
  >;
  request: GuruRequest;
  styles: ReturnType<
    typeof createStyles
  >;
}) {
  return (
    <View style={styles.requestCard}>
      <View
        style={
          styles.cardHeaderRow
        }
      >
        <View>
          <Text
            style={
              styles.cardEyebrow
            }
          >
            NEW REQUEST
          </Text>

          <Text
            style={
              styles.cardTitle
            }
          >
            Review and respond
          </Text>
        </View>

        <Text
          style={
            styles.requestEarnings
          }
        >
          {currency(
            request.earnings,
          )}
        </Text>
      </View>

      <View
        style={
          styles.requestMainRow
        }
      >
        <Avatar
          emojiFallback
          fallback="🐾"
          imageUrl={
            request.petPhotoUrl
          }
          palette={palette}
          size={52}
        />

        <View
          style={
            styles.requestCopy
          }
        >
          <Text
            style={
              styles.requestService
            }
          >
            {
              request.serviceLabel
            }
          </Text>

          <Text
            style={
              styles.requestMeta
            }
          >
            {request.petName} •{' '}
            {formatDay(
              request.startAt,
            )}
          </Text>

          <Text
            style={
              styles.requestMeta
            }
          >
            {request.distanceMiles !==
            null
              ? `${request.distanceMiles.toFixed(
                  1,
                )} mi away`
              : 'Open request for details'}
          </Text>
        </View>
      </View>

      <View
        style={
          styles.requestButtonRow
        }
      >
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push(
              '/guru-requests',
            )
          }
          style={
            styles.outlineButton
          }
        >
          <Text
            style={
              styles.outlineButtonText
            }
          >
            Decline
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push(
              '/guru-requests',
            )
          }
          style={
            styles.filledButton
          }
        >
          <Text
            style={
              styles.filledButtonText
            }
          >
            Review Request
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function StatusCard({
  icon,
  label,
  link,
  onPress,
  styles,
  text,
  value,
}: {
  icon: ReactNode;
  label: string;
  link: string;
  onPress: () => void;
  styles: ReturnType<
    typeof createStyles
  >;
  text: string;
  value: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={
        styles.statusCard
      }
    >
      <View
        style={
          styles.statusCardHeader
        }
      >
        {icon}

        <Text
          style={
            styles.statusCardLabel
          }
        >
          {label}
        </Text>
      </View>

      <Text
        style={
          styles.statusCardValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.statusCardText
        }
      >
        {text}
      </Text>

      <Text
        style={
          styles.statusCardLink
        }
      >
        {link}
      </Text>
    </Pressable>
  );
}

function ReadinessRow({
  good,
  label,
  styles,
  value,
}: {
  good: boolean;
  label: string;
  styles: ReturnType<
    typeof createStyles
  >;
  value: string;
}) {
  return (
    <View
      style={
        styles.readinessRow
      }
    >
      <Text
        style={
          styles.readinessLabel
        }
      >
        {label}
      </Text>

      <View
        style={[
          styles.readinessPill,
          !good &&
            styles.readinessPillWarning,
        ]}
      >
        <Text
          style={[
            styles.readinessValue,
            !good &&
              styles.readinessValueWarning,
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function BottomNavItem({
  active = false,
  badgeCount = 0,
  icon,
  label,
  onPress,
  styles,
}: {
  active?: boolean;
  badgeCount?: number;
  icon: ReactNode;
  label: string;
  onPress: () => void;
  styles: ReturnType<
    typeof createStyles
  >;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        selected: active,
      }}
      onPress={onPress}
      style={styles.navItem}
    >
      <View
        style={
          styles.navIconWrap
        }
      >
        {icon}

        {badgeCount > 0 ? (
          <View
            style={
              styles.navBadge
            }
          />
        ) : null}
      </View>

      <Text
        style={
          active
            ? styles.navLabelActive
            : styles.navLabel
        }
      >
        {label}
      </Text>
    </Pressable>
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
  palette: ReturnType<
    typeof getPalette
  >;
  size: number;
}) {
  const [
    imageFailed,
    setImageFailed,
  ] = useState(false);

  const showImage =
    Boolean(imageUrl) &&
    !imageFailed;

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor:
          palette.avatarBg,
        borderColor:
          palette.avatarBorder,
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
          onError={() =>
            setImageFailed(true)
          }
          resizeMode="cover"
          source={{
            uri: imageUrl as string,
          }}
          style={{
            height: '100%',
            width: '100%',
          }}
        />
      ) : (
        <Text
          style={{
            color:
              palette.primary,
            fontFamily:
              AppFonts.extraBold,
            fontSize:
              emojiFallback
                ? Math.max(
                    18,
                    size * 0.42,
                  )
                : Math.max(
                    11,
                    size * 0.28,
                  ),
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
  styles: ReturnType<
    typeof createStyles
  >;
}) {
  return (
    <View
      style={styles.statusBar}
    >
      <Text
        style={
          styles.statusTime
        }
      >
        9:41
      </Text>

      <View
        style={
          styles.statusIcons
        }
      >
        <View
          style={
            styles.signalBars
          }
        >
          <View
            style={[
              styles.signalBar,
              { height: 5 },
            ]}
          />

          <View
            style={[
              styles.signalBar,
              { height: 7 },
            ]}
          />

          <View
            style={[
              styles.signalBar,
              { height: 9 },
            ]}
          />
        </View>

        <Text
          style={
            styles.wifiText
          }
        >
          ⌁
        </Text>

        <View
          style={
            styles.batteryWrap
          }
        >
          <View
            style={
              styles.batteryBody
            }
          >
            <View
              style={
                styles.batteryFill
              }
            />
          </View>

          <View
            style={
              styles.batteryCap
            }
          />
        </View>
      </View>
    </View>
  );
}

async function loadDashboard(
  userId: string,
  profile: RecordRow,
): Promise<DashboardData> {
  const [
    bookingRows,
    conversationRows,
    notificationRows,
    payoutRows,
    referralRows,
    sessionRows,
  ] = await Promise.all([
    queryRows(
      BOOKING_TABLES,
      GURU_FIELDS,
      userId,
      100,
    ),
    queryRows(
      CONVERSATION_TABLES,
      CONVERSATION_FIELDS,
      userId,
      80,
    ),
    queryRows(
      NOTIFICATION_TABLES,
      NOTIFICATION_FIELDS,
      userId,
      80,
    ),
    queryRows(
      PAYOUT_TABLES,
      PAYOUT_FIELDS,
      userId,
      10,
    ),
    queryRows(
      REFERRAL_TABLES,
      REFERRAL_FIELDS,
      userId,
      100,
    ),
    queryRows(
      SESSION_TABLES,
      SESSION_FIELDS,
      userId,
      20,
    ),
  ]);

  const bookings = bookingRows
    .map((row, index) =>
      mapBooking(row, index),
    )
    .filter(
      (
        item,
      ): item is GuruBooking =>
        Boolean(item),
    )
    .sort(compareBookings);

  const requests = bookings
    .filter(
      (item) => item.pending,
    )
    .map((item) => {
      const raw =
        bookingRows.find(
          (row) =>
            rowId(row) === item.id,
        ) ?? {};

      return {
        id: item.id,
        serviceLabel:
          item.serviceLabel,
        petName: item.petName,
        petPhotoUrl:
          item.petPhotoUrl,
        startAt: item.startAt,
        distanceMiles:
          distanceMiles(raw),
        earnings: item.earnings,
      };
    });

  const currentMonthStart =
    monthStart(new Date());

  const currentWeekStart =
    weekStart(new Date());

  const lastMonthStart =
    monthStart(
      new Date(
        new Date().getFullYear(),
        new Date().getMonth() - 1,
        1,
      ),
    );

  const completed =
    bookings.filter(
      (item) => item.completed,
    );

  const earningsMonth =
    sumEarnings(
      completed.filter(
        (item) =>
          item.endAt &&
          item.endAt.getTime() >=
            currentMonthStart.getTime(),
      ),
    );

  const earningsWeek =
    sumEarnings(
      completed.filter(
        (item) =>
          item.endAt &&
          item.endAt.getTime() >=
            currentWeekStart.getTime(),
      ),
    );

  const earningsLastMonth =
    sumEarnings(
      completed.filter((item) => {
        if (!item.endAt) {
          return false;
        }

        return (
          item.endAt.getTime() >=
            lastMonthStart.getTime() &&
          item.endAt.getTime() <
            currentMonthStart.getTime()
        );
      }),
    );

  const unreadMessages =
    conversationRows.reduce(
      (total, row) => {
        const value =
          firstNumber(row, [
            'unread_count',
            'guru_unread_count',
            'provider_unread_count',
          ]) ??
          (firstBoolean(row, [
            'is_unread',
            'unread',
          ])
            ? 1
            : 0);

        return (
          total +
          Math.max(
            0,
            Math.round(value),
          )
        );
      },
      0,
    );

  const unreadNotifications =
    notificationRows.reduce(
      (total, row) => {
        if (
          firstBoolean(row, [
            'is_unread',
            'unread',
          ])
        ) {
          return total + 1;
        }

        if (
          !firstBoolean(row, [
            'is_read',
            'read',
            'seen',
          ])
        ) {
          return total + 1;
        }

        return total;
      },
      0,
    );

  const liveCare =
    sessionRows
      .map((row, index) =>
        mapLiveCare(
          row,
          bookings,
          index,
        ),
      )
      .find(
        (
          item,
        ): item is LiveCare =>
          Boolean(item),
      ) ?? null;

  return {
    bookings,
    requests,
    unreadMessages,
    unreadNotifications,
    liveCare,
    earningsMonth,
    earningsWeek,
    earningsLastMonth,
    completedBookings:
      completed.length,
    payout: mapPayout(
      payoutRows[0] ?? {},
      profile,
    ),
    referrals:
      mapReferrals(
        referralRows,
      ),
  };
}

async function queryRows(
  tables: string[],
  ownerFields: string[],
  userId: string,
  limit: number,
): Promise<RecordRow[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  for (const table of tables) {
    for (const ownerField of ownerFields) {
      const result = await supabase
        .from(table)
        .select('*')
        .eq(ownerField, userId)
        .limit(limit);

      if (
        !result.error &&
        result.data?.length
      ) {
        return result.data as RecordRow[];
      }
    }
  }

  return [];
}

function mapBooking(
  row: RecordRow,
  index: number,
): GuruBooking | null {
  const status =
    normalizeStatus(
      firstString(row, [
        'status',
        'booking_status',
        'request_status',
      ]),
    ) || 'pending';

  if (
    [
      'cancelled',
      'canceled',
      'declined',
      'rejected',
    ].includes(status)
  ) {
    return null;
  }

  return {
    id:
      rowId(row) ||
      `booking-${index}`,
    status,
    serviceLabel:
      firstString(row, [
        'service_name',
        'service_type',
        'service',
        'booking_type',
      ]) || 'Pet Care',
    petName:
      firstString(row, [
        'pet_name',
        'animal_name',
      ]) || 'Pet',
    petPhotoUrl:
      resolveSupabaseStorageUrl(
        firstString(row, [
          'pet_photo_url',
          'pet_image_url',
          'animal_photo_url',
        ]),
      ),
    petParentName:
      firstString(row, [
        'pet_parent_name',
        'customer_name',
        'client_name',
        'owner_name',
      ]) || 'Pet Parent',
    startAt: firstDate(row, [
      'start_time',
      'starts_at',
      'scheduled_at',
      'booking_date',
      'service_date',
      'start_date',
      'date',
    ]),
    endAt: firstDate(row, [
      'end_time',
      'ends_at',
      'completed_at',
      'end_date',
    ]),
    location:
      firstString(row, [
        'service_address',
        'location',
        'service_location',
        'city',
      ]) || '',
    earnings:
      firstNumber(row, [
        'guru_earnings',
        'provider_earnings',
        'net_amount',
        'payout_amount',
        'estimated_earnings',
        'guru_amount',
      ]) ?? 0,
    pending: [
      'pending',
      'requested',
      'submitted',
      'awaiting',
      'awaiting_response',
    ].includes(status),
    active:
      [
        'active',
        'in_progress',
        'started',
        'checked_in',
      ].includes(status) ||
      firstBoolean(row, [
        'is_active',
        'care_in_progress',
      ]),
    completed: [
      'completed',
      'complete',
      'finished',
    ].includes(status),
  };
}

function mapPayout(
  row: RecordRow,
  profile: RecordRow,
): PayoutSummary {
  const combined = {
    ...profile,
    ...row,
  };

  const connected = Boolean(
    firstString(combined, [
      'stripe_account_id',
      'stripe_connected_account_id',
      'connected_account_id',
    ]),
  );

  const payoutsEnabled =
    firstBoolean(combined, [
      'stripe_payouts_enabled',
      'payouts_enabled',
    ]);

  const detailsSubmitted =
    firstBoolean(combined, [
      'stripe_details_submitted',
      'details_submitted',
    ]);

  const disabledReason =
    firstString(combined, [
      'stripe_disabled_reason',
      'disabled_reason',
      'requirements_due',
    ]);

  return {
    connected,
    payoutsEnabled,
    detailsSubmitted,
    actionRequired:
      connected &&
      (!payoutsEnabled ||
        !detailsSubmitted ||
        Boolean(disabledReason)),
    disabledReason,
    available:
      firstNumber(combined, [
        'available_balance',
        'available_amount',
        'payout_available',
      ]) ?? 0,
    pending:
      firstNumber(combined, [
        'pending_balance',
        'pending_amount',
        'payout_pending',
      ]) ?? 0,
    nextPayoutAt:
      firstDate(combined, [
        'next_payout_at',
        'next_payout_date',
        'scheduled_payout_at',
      ]),
  };
}

function mapReferrals(
  rows: RecordRow[],
): ReferralSummary {
  const eventCount = (
    row: RecordRow,
    types: string[],
  ) =>
    types.some((type) =>
      firstString(row, [
        'event_type',
        'type',
      ])
        .toLowerCase()
        .includes(type),
    )
      ? 1
      : 0;

  return {
    clicks: rows.reduce(
      (total, row) =>
        total +
        Math.max(
          0,
          Math.round(
            firstNumber(row, [
              'clicks',
              'link_clicks',
              'click_count',
            ]) ??
              eventCount(row, [
                'click',
              ]),
          ),
        ),
      0,
    ),
    signups: rows.reduce(
      (total, row) =>
        total +
        Math.max(
          0,
          Math.round(
            firstNumber(row, [
              'signups',
              'signup_count',
            ]) ??
              eventCount(row, [
                'signup',
              ]),
          ),
        ),
      0,
    ),
    qualified: rows.reduce(
      (total, row) =>
        total +
        Math.max(
          0,
          Math.round(
            firstNumber(row, [
              'qualified_gurus',
              'qualified_count',
              'approved_count',
            ]) ??
              (firstBoolean(row, [
                'is_qualified',
                'qualified',
                'approved',
              ])
                ? 1
                : 0),
          ),
        ),
      0,
    ),
    earned: rows.reduce(
      (total, row) =>
        total +
        Math.max(
          0,
          firstNumber(row, [
            'reward_earned',
            'earned_amount',
            'reward_amount',
          ]) ?? 0,
        ),
      0,
    ),
  };
}

function mapLiveCare(
  row: RecordRow,
  bookings: GuruBooking[],
  index: number,
): LiveCare | null {
  const status =
    normalizeStatus(
      firstString(row, [
        'status',
        'session_status',
        'visit_status',
        'pawreport_status',
      ]),
    ) || 'active';

  if (
    ![
      'active',
      'in_progress',
      'started',
      'checked_in',
      'walk_in_progress',
      'care_in_progress',
      'live',
    ].includes(status)
  ) {
    return null;
  }

  const bookingId =
    firstString(row, [
      'booking_id',
      'booking_request_id',
    ]);

  const booking =
    bookings.find(
      (item) =>
        item.id === bookingId,
    ) ?? null;

  const serviceLabel =
    firstString(row, [
      'service_name',
      'service_type',
      'service',
      'session_type',
    ]) ||
    booking?.serviceLabel ||
    'Pet Care';

  const sessionType =
    firstString(row, [
      'session_type',
      'visit_type',
      'tracking_type',
    ]).toLowerCase();

  return {
    id:
      firstString(row, [
        'id',
        'session_id',
        'visit_session_id',
      ]) ||
      `session-${index}`,
    isWalk:
      firstBoolean(row, [
        'is_walk',
        'walk_active',
        'walk_tracking',
      ]) ||
      serviceLabel
        .toLowerCase()
        .includes('walk') ||
      sessionType.includes(
        'walk',
      ),
    petName:
      firstString(row, [
        'pet_name',
        'animal_name',
      ]) ||
      booking?.petName ||
      'Pet',
    startedAt: firstDate(row, [
      'started_at',
      'start_time',
      'checked_in_at',
      'created_at',
    ]),
  };
}

function firstString(
  record: RecordRow,
  keys: string[],
) {
  for (const key of keys) {
    const value = record[key];

    if (
      typeof value ===
        'string' &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return '';
}

function firstNumber(
  record: RecordRow,
  keys: string[],
) {
  for (const key of keys) {
    const value = record[key];

    if (
      typeof value ===
        'number' &&
      Number.isFinite(value)
    ) {
      return value;
    }

    if (
      typeof value === 'string'
    ) {
      const parsed =
        Number.parseFloat(value);

      if (
        Number.isFinite(parsed)
      ) {
        return parsed;
      }
    }
  }

  return null;
}

function firstBoolean(
  record: RecordRow,
  keys: string[],
) {
  for (const key of keys) {
    const value = record[key];

    if (
      typeof value ===
      'boolean'
    ) {
      return value;
    }

    if (
      value === 1 ||
      value === '1' ||
      value === 'true'
    ) {
      return true;
    }
  }

  return false;
}

function firstDate(
  record: RecordRow,
  keys: string[],
) {
  for (const key of keys) {
    const value = record[key];

    if (
      value instanceof Date &&
      !Number.isNaN(
        value.getTime(),
      )
    ) {
      return value;
    }

    if (
      typeof value ===
        'string' ||
      typeof value ===
        'number'
    ) {
      const parsed =
        new Date(value);

      if (
        !Number.isNaN(
          parsed.getTime(),
        )
      ) {
        return parsed;
      }
    }
  }

  return null;
}

function rowId(
  record: RecordRow,
) {
  return firstString(record, [
    'id',
    'booking_id',
    'request_id',
  ]);
}

function distanceMiles(
  record: RecordRow,
) {
  const value =
    firstNumber(record, [
      'distance_miles',
      'distance',
      'distance_from_guru',
    ]);

  if (value === null) {
    return null;
  }

  const unit =
    firstString(record, [
      'distance_unit',
      'unit',
    ]).toLowerCase();

  if (
    unit.includes('meter')
  ) {
    return value / 1609.344;
  }

  if (
    unit.includes('km') ||
    unit.includes('kilometer')
  ) {
    return value * 0.621371;
  }

  return value;
}

function normalizeStatus(
  value: string,
) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function compareBookings(
  a: GuruBooking,
  b: GuruBooking,
) {
  if (a.active && !b.active) {
    return -1;
  }

  if (!a.active && b.active) {
    return 1;
  }

  if (a.pending && !b.pending) {
    return -1;
  }

  if (!a.pending && b.pending) {
    return 1;
  }

  const aTime =
    a.startAt?.getTime() ??
    Number.MAX_SAFE_INTEGER;

  const bTime =
    b.startAt?.getTime() ??
    Number.MAX_SAFE_INTEGER;

  return aTime - bTime;
}

function sumEarnings(
  bookings: GuruBooking[],
) {
  return bookings.reduce(
    (total, item) =>
      total +
      Math.max(
        0,
        item.earnings,
      ),
    0,
  );
}

function getProfileCompletion(
  profile: RecordRow,
  avatarUrl: string | null,
) {
  const checks = [
    Boolean(
      firstString(profile, [
        'full_name',
        'display_name',
        'first_name',
      ]),
    ),
    Boolean(avatarUrl),
    Boolean(
      firstString(profile, [
        'bio',
        'about',
        'description',
      ]),
    ),
    Boolean(
      firstString(profile, [
        'service_city',
        'city',
        'service_zip',
        'zip_code',
      ]),
    ),
    Boolean(
      firstNumber(profile, [
        'service_radius_miles',
        'radius_miles',
      ]),
    ),
    Boolean(
      firstNumber(profile, [
        'hourly_rate',
        'starting_rate',
        'base_rate',
      ]),
    ),
  ];

  return Math.round(
    (checks.filter(Boolean).length /
      Math.max(
        1,
        checks.length,
      )) *
      100,
  );
}

function getSuccessRecommendation(
  payout: PayoutSummary,
  profileCompletion: number,
  completedBookings: number,
  pendingRequest: boolean,
) {
  if (
    !payout.connected ||
    payout.actionRequired
  ) {
    return {
      title:
        'Complete your payout setup',
      text:
        'Learn how Stripe verification and Guru payouts work.',
    };
  }

  if (
    profileCompletion < 100
  ) {
    return {
      title:
        'Strengthen your Guru profile',
      text:
        'Complete services, pricing, photos, and your service area.',
    };
  }

  if (pendingRequest) {
    return {
      title:
        'Respond to requests confidently',
      text:
        'Review pet details, timing, pricing, and communication tips.',
    };
  }

  if (
    completedBookings === 0
  ) {
    return {
      title:
        'Prepare for your first booking',
      text:
        'Learn care handoffs, messaging, PawReport, and safety.',
    };
  }

  return {
    title:
      'Grow repeat bookings and reviews',
    text:
      'Build trust through communication and complete PawReports.',
  };
}

function payoutStatus(
  payout: PayoutSummary,
) {
  if (!payout.connected) {
    return 'Setup needed';
  }

  if (
    payout.actionRequired
  ) {
    return 'Action required';
  }

  if (
    payout.payoutsEnabled
  ) {
    return 'Payouts active';
  }

  return 'Setup in progress';
}

function sameDay(
  date: Date | null,
  comparison: Date,
) {
  if (!date) {
    return false;
  }

  return (
    date.getFullYear() ===
      comparison.getFullYear() &&
    date.getMonth() ===
      comparison.getMonth() &&
    date.getDate() ===
      comparison.getDate()
  );
}

function startingSoon(
  date: Date | null,
) {
  if (!date) {
    return false;
  }

  const difference =
    date.getTime() -
    Date.now();

  return (
    difference >= 0 &&
    difference <=
      2 * 60 * 60 * 1000
  );
}

function monthStart(
  date: Date,
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
  );
}

function weekStart(
  date: Date,
) {
  const result =
    new Date(date);

  result.setDate(
    result.getDate() -
      result.getDay(),
  );

  result.setHours(
    0,
    0,
    0,
    0,
  );

  return result;
}

function formatDay(
  date: Date | null,
) {
  if (!date) {
    return 'Date TBD';
  }

  const today =
    new Date();

  const tomorrow =
    new Date(today);

  tomorrow.setDate(
    today.getDate() + 1,
  );

  if (
    sameDay(date, today)
  ) {
    return 'Today';
  }

  if (
    sameDay(date, tomorrow)
  ) {
    return 'Tomorrow';
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      month: 'short',
      day: 'numeric',
    },
  ).format(date);
}

function formatTime(
  date: Date | null,
) {
  if (!date) {
    return 'Time TBD';
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      hour: 'numeric',
      minute: '2-digit',
    },
  ).format(date);
}

function shortDate(
  date: Date | null,
) {
  if (!date) {
    return 'Not scheduled';
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      month: 'short',
      day: 'numeric',
    },
  ).format(date);
}

function elapsed(
  date: Date | null,
  now: number,
) {
  if (!date) {
    return 'Care in progress';
  }

  const minutes = Math.max(
    0,
    Math.round(
      (now - date.getTime()) /
        60_000,
    ),
  );

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours =
    Math.floor(minutes / 60);

  return `${hours}h ${
    minutes % 60
  }m`;
}

function currency(
  value: number,
) {
  return new Intl.NumberFormat(
    undefined,
    {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits:
        value % 1 === 0
          ? 0
          : 2,
    },
  ).format(value);
}

function initials(
  name: string,
) {
  const parts = name
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return 'GG';
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function badge(
  value: number,
) {
  return value > 99
    ? '99+'
    : String(value);
}

function dayPart() {
  const hour =
    new Date().getHours();

  if (hour < 12) {
    return 'morning';
  }

  if (hour < 18) {
    return 'afternoon';
  }

  return 'evening';
}

function getPalette(
  isDark: boolean,
) {
  return {
    background: isDark
      ? '#06140F'
      : '#FFF9F1',
    surface: isDark
      ? '#0B2118'
      : '#FFFEFA',
    surfaceSoft: isDark
      ? '#102D21'
      : '#FFF6E9',
    border: isDark
      ? '#234B38'
      : '#EADDCB',
    title: isDark
      ? '#FFF5E8'
      : '#123F31',
    text: isDark
      ? '#E8EEE9'
      : '#27483E',
    muted: isDark
      ? '#9DB0A5'
      : '#738078',
    primary: isDark
      ? '#39D982'
      : '#087449',
    primarySoft: isDark
      ? '#123E2A'
      : '#E4F5E9',
    orange: '#F15A3A',
    navMuted: isDark
      ? '#9BAAA1'
      : '#748079',
    avatarBg: isDark
      ? '#173527'
      : '#EEF5EE',
    avatarBorder: isDark
      ? '#2E6C4B'
      : '#FFFFFF',
    shadow: '#000000',
  };
}

function createStyles(
  isDark: boolean,
) {
  const palette =
    getPalette(isDark);

  return StyleSheet.create({
    previewCanvas: {
      alignItems: 'center',
      justifyContent:
        'flex-start',
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
      backgroundColor:
        '#111713',
      borderColor: '#2E3631',
      borderRadius: 42,
      borderWidth: 2,
      maxWidth: 430,
      overflow: 'hidden',
      paddingBottom: 15,
      paddingHorizontal: 8,
      paddingTop: 10,
      shadowColor:
        '#000000',
      shadowOffset: {
        width: 0,
        height: 20,
      },
      shadowOpacity: 0.27,
      shadowRadius: 28,
      width: '100%',
    },
    deviceFrameNative: {
      backgroundColor:
        'transparent',
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
      backgroundColor:
        '#303832',
      borderRadius: 999,
      height: 6,
      marginBottom: 9,
      width: 86,
    },
    phoneShell: {
      backgroundColor:
        palette.background,
      borderColor:
        palette.border,
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
    screen: {
      backgroundColor:
        palette.background,
      flex: 1,
      width: '100%',
    },
    homeIndicator: {
      alignSelf: 'center',
      backgroundColor:
        '#F3F1EA',
      borderRadius: 999,
      height: 5,
      marginTop: 9,
      width: 116,
    },
    statusBar: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent:
        'space-between',
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
      backgroundColor:
        palette.title,
      borderRadius: 2,
      width: 3,
    },
    wifiText: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    batteryWrap: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 2,
    },
    batteryBody: {
      borderColor:
        palette.title,
      borderRadius: 3,
      borderWidth: 1,
      height: 9,
      padding: 1,
      width: 17,
    },
    batteryFill: {
      backgroundColor:
        palette.title,
      borderRadius: 2,
      flex: 1,
    },
    batteryCap: {
      backgroundColor:
        palette.title,
      height: 4,
      width: 2,
    },
    scrollContent: {
      gap: 13,
      paddingBottom: 112,
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent:
        'space-between',
    },
    headerCopy: {
      flex: 1,
      gap: 2,
      paddingRight: 8,
    },
    dashboardTitle: {
      color: palette.title,
      fontFamily:
        AppFonts.extraBold,
      fontSize: 21,
      letterSpacing: -0.45,
    },
    welcomeText: {
      color: palette.muted,
      fontFamily:
        AppFonts.medium,
      fontSize: 11,
    },
    wave: {
      fontSize: 11,
    },
    locationRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
      marginTop: 2,
    },
    locationText: {
      color: palette.muted,
      fontFamily:
        AppFonts.medium,
      fontSize: 9,
    },
    headerActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    headerIconButton: {
      alignItems: 'center',
      backgroundColor:
        palette.surface,
      borderColor:
        palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 38,
      justifyContent:
        'center',
      position: 'relative',
      width: 38,
    },
    headerBadge: {
      alignItems: 'center',
      backgroundColor:
        palette.orange,
      borderColor:
        palette.surface,
      borderRadius: 999,
      borderWidth: 1.5,
      justifyContent:
        'center',
      minHeight: 17,
      minWidth: 17,
      paddingHorizontal: 4,
      position: 'absolute',
      right: -2,
      top: -4,
    },
    headerBadgeText: {
      color: '#FFFFFF',
      fontFamily:
        AppFonts.extraBold,
      fontSize: 8,
    },
    modeToggle: {
      alignItems: 'center',
      backgroundColor:
        palette.surface,
      borderColor: isDark
        ? '#B9831B'
        : '#F2822E',
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
      justifyContent:
        'center',
      width: 31,
    },
    modeButtonActive: {
      backgroundColor: isDark
        ? 'rgba(226,170,45,0.18)'
        : '#FFF4D8',
    },
    profileButton: {
      borderRadius: 999,
    },
    loadNotice: {
      backgroundColor:
        palette.surfaceSoft,
      borderColor:
        palette.border,
      borderRadius: 14,
      borderWidth: 1,
      padding: 10,
    },
    loadNoticeText: {
      color: palette.text,
      fontFamily:
        AppFonts.medium,
      fontSize: 10,
      lineHeight: 14,
    },
    primaryActionCard: {
      alignItems: 'center',
      backgroundColor:
        isDark
          ? '#087A4C'
          : '#087F50',
      borderRadius: 21,
      flexDirection: 'row',
      gap: 10,
      minHeight: 92,
      padding: 14,
      shadowColor:
        palette.shadow,
      shadowOffset: {
        width: 0,
        height: 9,
      },
      shadowOpacity: isDark
        ? 0.26
        : 0.13,
      shadowRadius: 17,
    },
    primaryActionCopy: {
      flex: 1,
      gap: 2,
    },
    primaryActionEyebrow: {
      color:
        'rgba(255,255,255,0.78)',
      fontFamily: AppFonts.bold,
      fontSize: 8,
      letterSpacing: 0.8,
    },
    primaryActionTitle: {
      color: '#FFFFFF',
      fontFamily:
        AppFonts.extraBold,
      fontSize: 18,
    },
    primaryActionText: {
      color:
        'rgba(255,255,255,0.84)',
      fontFamily:
        AppFonts.medium,
      fontSize: 10,
      lineHeight: 14,
    },
    primaryActionIcon: {
      alignItems: 'center',
      backgroundColor:
        'rgba(255,255,255,0.16)',
      borderRadius: 999,
      height: 44,
      justifyContent:
        'center',
      width: 44,
    },
    loadingCard: {
      backgroundColor:
        palette.surface,
      borderColor:
        palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 10,
      padding: 14,
    },
    loadingBarLarge: {
      backgroundColor:
        palette.surfaceSoft,
      borderRadius: 999,
      height: 15,
      width: '52%',
    },
    loadingBarMedium: {
      backgroundColor:
        palette.surfaceSoft,
      borderRadius: 999,
      height: 11,
      width: '76%',
    },
    loadingBarSmall: {
      backgroundColor:
        palette.surfaceSoft,
      borderRadius: 999,
      height: 10,
      width: '34%',
    },
    earningsCard: {
      backgroundColor:
        palette.surface,
      borderColor:
        palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 12,
      padding: 13,
    },
    earningsTopRow: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      justifyContent:
        'space-between',
    },
    cardEyebrow: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 8,
      letterSpacing: 0.85,
    },
    cardTitle: {
      color: palette.title,
      fontFamily:
        AppFonts.extraBold,
      fontSize: 16,
      marginTop: 2,
    },
    cardHeaderRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent:
        'space-between',
    },
    cardLink: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 9,
    },
    earningsValue: {
      color: palette.title,
      fontFamily:
        AppFonts.extraBold,
      fontSize: 28,
      marginTop: 2,
    },
    earningsTrend: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 8,
      marginTop: 2,
    },
    earningsTrendNegative: {
      color: palette.orange,
    },
    trendChart: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      gap: 3,
      height: 42,
    },
    trendBar: {
      backgroundColor:
        palette.primary,
      borderRadius: 999,
      width: 4,
    },
    earningsStatsRow: {
      borderTopColor:
        palette.border,
      borderTopWidth: 1,
      flexDirection: 'row',
      paddingTop: 10,
    },
    metric: {
      flex: 1,
      gap: 2,
    },
    metricValue: {
      color: palette.title,
      fontFamily:
        AppFonts.extraBold,
      fontSize: 12,
    },
    metricLabel: {
      color: palette.muted,
      fontFamily:
        AppFonts.medium,
      fontSize: 8,
    },
    todayCard: {
      backgroundColor:
        palette.surface,
      borderColor:
        palette.border,
      borderRadius: 20,
      borderWidth: 1,
      overflow: 'hidden',
    },
    todayHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent:
        'space-between',
      paddingBottom: 8,
      paddingHorizontal: 13,
      paddingTop: 12,
    },
    businessRow: {
      alignItems: 'center',
      borderBottomColor:
        palette.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 9,
      minHeight: 56,
      paddingHorizontal: 13,
      paddingVertical: 9,
    },
    businessRowLast: {
      borderBottomWidth: 0,
    },
    businessIcon: {
      alignItems: 'center',
      backgroundColor:
        palette.primarySoft,
      borderRadius: 11,
      height: 32,
      justifyContent:
        'center',
      width: 32,
    },
    businessCopy: {
      flex: 1,
      gap: 2,
    },
    businessLabel: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    businessHelper: {
      color: palette.muted,
      fontFamily:
        AppFonts.medium,
      fontSize: 8,
    },
    businessBadge: {
      alignItems: 'center',
      backgroundColor:
        palette.orange,
      borderRadius: 999,
      justifyContent:
        'center',
      minHeight: 21,
      minWidth: 21,
      paddingHorizontal: 5,
    },
    businessBadgeText: {
      color: '#FFFFFF',
      fontFamily:
        AppFonts.extraBold,
      fontSize: 8,
    },
    quickActions: {
      flexDirection: 'row',
      gap: 8,
    },
    quickAction: {
      alignItems: 'center',
      backgroundColor:
        palette.surface,
      borderColor:
        palette.border,
      borderRadius: 17,
      borderWidth: 1,
      flex: 1,
      gap: 6,
      justifyContent:
        'center',
      minHeight: 74,
      paddingHorizontal: 5,
      paddingVertical: 9,
    },
    quickActionIcon: {
      alignItems: 'center',
      backgroundColor:
        palette.primarySoft,
      borderRadius: 999,
      height: 37,
      justifyContent:
        'center',
      position: 'relative',
      width: 37,
    },
    quickActionBadge: {
      alignItems: 'center',
      backgroundColor:
        palette.orange,
      borderColor:
        palette.surface,
      borderRadius: 999,
      borderWidth: 1.5,
      justifyContent:
        'center',
      minHeight: 17,
      minWidth: 17,
      paddingHorizontal: 4,
      position: 'absolute',
      right: -5,
      top: -5,
    },
    quickActionBadgeText: {
      color: '#FFFFFF',
      fontFamily:
        AppFonts.extraBold,
      fontSize: 7,
    },
    quickActionLabel: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 9,
      textAlign: 'center',
    },
    pressed: {
      opacity: 0.72,
      transform: [
        {
          scale: 0.985,
        },
      ],
    },
    requestCard: {
      backgroundColor:
        palette.surface,
      borderColor:
        palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 11,
      padding: 13,
    },
    requestEarnings: {
      color: palette.title,
      fontFamily:
        AppFonts.extraBold,
      fontSize: 17,
    },
    requestMainRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    requestCopy: {
      flex: 1,
      gap: 3,
    },
    requestService: {
      color: palette.title,
      fontFamily:
        AppFonts.extraBold,
      fontSize: 13,
    },
    requestMeta: {
      color: palette.muted,
      fontFamily:
        AppFonts.medium,
      fontSize: 9,
    },
    requestButtonRow: {
      flexDirection: 'row',
      gap: 8,
    },
    twoButtonRow: {
      flexDirection: 'row',
      gap: 8,
    },
    filledButton: {
      alignItems: 'center',
      backgroundColor:
        palette.primary,
      borderRadius: 999,
      flex: 1,
      justifyContent:
        'center',
      minHeight: 38,
      paddingHorizontal: 10,
    },
    filledButtonText: {
      color: '#FFFFFF',
      fontFamily:
        AppFonts.extraBold,
      fontSize: 9,
    },
    outlineButton: {
      alignItems: 'center',
      backgroundColor:
        palette.surface,
      borderColor:
        palette.primary,
      borderRadius: 999,
      borderWidth: 1,
      flex: 1,
      justifyContent:
        'center',
      minHeight: 38,
      paddingHorizontal: 10,
    },
    outlineButtonText: {
      color: palette.primary,
      fontFamily:
        AppFonts.extraBold,
      fontSize: 9,
    },
    statusGrid: {
      flexDirection: 'row',
      gap: 10,
    },
    statusCard: {
      backgroundColor:
        palette.surface,
      borderColor:
        palette.border,
      borderRadius: 18,
      borderWidth: 1,
      flex: 1,
      gap: 5,
      minHeight: 150,
      padding: 12,
    },
    statusCardHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 7,
    },
    statusCardLabel: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 10,
    },
    statusCardValue: {
      color: palette.title,
      fontFamily:
        AppFonts.extraBold,
      fontSize: 16,
      marginTop: 4,
    },
    statusCardText: {
      color: palette.muted,
      flex: 1,
      fontFamily:
        AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
    },
    statusCardLink: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 8,
    },
    successCard: {
      alignItems: 'center',
      backgroundColor:
        palette.surface,
      borderColor:
        palette.border,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      padding: 12,
    },
    successIcon: {
      alignItems: 'center',
      backgroundColor:
        palette.primarySoft,
      borderRadius: 13,
      height: 42,
      justifyContent:
        'center',
      width: 42,
    },
    successCopy: {
      flex: 1,
      gap: 2,
    },
    successEyebrow: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 7,
      letterSpacing: 0.7,
    },
    successTitle: {
      color: palette.title,
      fontFamily:
        AppFonts.extraBold,
      fontSize: 12,
    },
    successText: {
      color: palette.muted,
      fontFamily:
        AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
    },
    availabilityCard: {
      backgroundColor:
        palette.surface,
      borderColor:
        palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 11,
      padding: 13,
    },
    availabilityRows: {
      gap: 7,
    },
    readinessRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent:
        'space-between',
    },
    readinessLabel: {
      color: palette.text,
      fontFamily:
        AppFonts.medium,
      fontSize: 10,
    },
    readinessPill: {
      backgroundColor:
        palette.primarySoft,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    readinessPillWarning: {
      backgroundColor:
        isDark
          ? '#3A251D'
          : '#FFF0E7',
    },
    readinessValue: {
      color: palette.primary,
      fontFamily:
        AppFonts.extraBold,
      fontSize: 8,
    },
    readinessValueWarning: {
      color: palette.orange,
    },
    bottomNav: {
      alignItems: 'center',
      backgroundColor:
        palette.surface,
      borderColor:
        palette.border,
      borderRadius: 23,
      borderWidth: 1,
      bottom: 8,
      flexDirection: 'row',
      height: 72,
      justifyContent:
        'space-around',
      left: 9,
      paddingBottom: 7,
      paddingHorizontal: 5,
      paddingTop: 7,
      position: 'absolute',
      right: 9,
      shadowColor:
        palette.shadow,
      shadowOffset: {
        width: 0,
        height: -7,
      },
      shadowOpacity: isDark
        ? 0.3
        : 0.08,
      shadowRadius: 15,
    },
    navItem: {
      alignItems: 'center',
      flex: 1,
      gap: 3,
      justifyContent:
        'center',
    },
    navIconWrap: {
      position: 'relative',
    },
    navBadge: {
      backgroundColor:
        palette.orange,
      borderColor:
        palette.surface,
      borderRadius: 999,
      borderWidth: 1.5,
      height: 8,
      position: 'absolute',
      right: -2,
      top: -2,
      width: 8,
    },
    navLabelActive: {
      color: palette.primary,
      fontFamily:
        AppFonts.extraBold,
      fontSize: 8,
    },
    navLabel: {
      color: palette.navMuted,
      fontFamily:
        AppFonts.medium,
      fontSize: 8,
    },
  });
}