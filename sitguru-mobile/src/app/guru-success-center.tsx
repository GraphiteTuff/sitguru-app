import { router } from 'expo-router';
import {
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    HeartHandshake,
    Home,
    MessageCircle,
    PawPrint,
    Search,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    UserRound,
    X,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { GuruHeaderActions } from '@/components/GuruHeaderActions';
import RoleGate from '@/components/RoleGate';
import SitGuruScreen from '@/components/SitGuruScreen';
import { AppFonts } from '@/constants/fonts';
import { useThemeMode } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';

type RecordRow = Record<string, unknown>;
type CategoryId =
  | 'all'
  | 'start'
  | 'bookings'
  | 'pawreport'
  | 'earnings'
  | 'growth'
  | 'safety';

type Lesson = {
  id: string;
  category: Exclude<CategoryId, 'all'>;
  title: string;
  description: string;
  duration: string;
  route?: string;
  bullets: string[];
};

const CATEGORIES: Array<{
  id: CategoryId;
  label: string;
}> = [
  { id: 'all', label: 'All' },
  { id: 'start', label: 'Start Here' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'pawreport', label: 'PawReport' },
  { id: 'earnings', label: 'Earnings' },
  { id: 'growth', label: 'Growth' },
  { id: 'safety', label: 'Safety' },
];

const LESSONS: Lesson[] = [
  {
    id: 'profile',
    category: 'start',
    title: 'Build a booking-ready Guru profile',
    description:
      'Complete your photo, bio, services, prices, service area, and trust details.',
    duration: '6 min',
    route: '/guru-profile',
    bullets: [
      'Use a friendly, current profile photo.',
      'Explain your experience and the pets you serve best.',
      'Keep services, prices, and service radius accurate.',
      'Make sure your public booking status matches your availability.',
    ],
  },
  {
    id: 'availability',
    category: 'start',
    title: 'Set availability and service area',
    description:
      'Control when and where Pet Parents can request your care.',
    duration: '5 min',
    route: '/guru-pricing',
    bullets: [
      'Set recurring weekly availability.',
      'Block personal days before requests arrive.',
      'Keep your service radius realistic.',
      'Pause requests when you cannot respond quickly.',
    ],
  },
  {
    id: 'request-review',
    category: 'bookings',
    title: 'Review requests confidently',
    description:
      'Understand the pet, schedule, pricing, distance, and care expectations before accepting.',
    duration: '7 min',
    route: '/guru-requests',
    bullets: [
      'Read the Pet Passport and care instructions.',
      'Confirm timing, service type, and estimated earnings.',
      'Ask clarifying questions inside SitGuru.',
      'Decline promptly when the request is not a good fit.',
    ],
  },
  {
    id: 'first-booking',
    category: 'bookings',
    title: 'Prepare for your first booking',
    description:
      'Use a consistent preparation checklist before care begins.',
    duration: '8 min',
    route: '/guru-requests',
    bullets: [
      'Confirm access instructions and emergency contacts.',
      'Review medications, feeding, routines, and behavior notes.',
      'Message the Pet Parent before arrival.',
      'Open PawReport when active care begins.',
    ],
  },
  {
    id: 'communication',
    category: 'bookings',
    title: 'Communicate like a professional',
    description:
      'Build confidence with timely, clear, and friendly messages.',
    duration: '5 min',
    route: '/messages',
    bullets: [
      'Reply quickly to requests and questions.',
      'Keep booking decisions and payment conversations inside SitGuru.',
      'Confirm important care details in writing.',
      'Report changes or concerns as soon as possible.',
    ],
  },
  {
    id: 'pawreport-start',
    category: 'pawreport',
    title: 'Start and use PawReport Live',
    description:
      'Document active care with check-in, updates, photos, and notes.',
    duration: '9 min',
    route: '/guru-live-walk',
    bullets: [
      'Start the visit only when booked care begins.',
      'Use walk tracking only during an active dog walk.',
      'Record potty, food, water, medication, and behavior updates.',
      'Add clear photos without exposing private home details.',
    ],
  },
  {
    id: 'pawreport-complete',
    category: 'pawreport',
    title: 'Complete a strong final PawReport',
    description:
      'Give Pet Parents a clear, useful summary after every visit.',
    duration: '6 min',
    route: '/guru-live-walk',
    bullets: [
      'Summarize how the pet did.',
      'Confirm all requested care steps were completed.',
      'Mention anything the Pet Parent should monitor.',
      'End the visit and submit the report promptly.',
    ],
  },
  {
    id: 'stripe',
    category: 'earnings',
    title: 'Set up Stripe payouts',
    description:
      'Complete identity, tax, and bank verification to receive Guru earnings.',
    duration: '7 min',
    route: '/guru-earnings',
    bullets: [
      'Use SitGuru’s secure Stripe onboarding.',
      'Complete every requested verification step.',
      'Keep bank and legal information current.',
      'Resolve payout restrictions as soon as they appear.',
    ],
  },
  {
    id: 'earnings',
    category: 'earnings',
    title: 'Understand earnings and marketplace fees',
    description:
      'Know how booking totals, fees, adjustments, tips, and payouts are shown.',
    duration: '6 min',
    route: '/guru-earnings',
    bullets: [
      'Review estimated Guru earnings before acceptance.',
      'Check pending and available balances separately.',
      'Understand refunds and adjustments.',
      'Use payout history to reconcile completed bookings.',
    ],
  },
  {
    id: 'reviews',
    category: 'growth',
    title: 'Earn reviews and repeat bookings',
    description:
      'Turn reliable care and communication into long-term relationships.',
    duration: '6 min',
    route: '/reviews',
    bullets: [
      'Arrive on time and follow care instructions.',
      'Send complete PawReports.',
      'Communicate changes before they become problems.',
      'Encourage feedback after successful care.',
    ],
  },
  {
    id: 'referrals',
    category: 'growth',
    title: 'Grow with Guru referrals',
    description:
      'Share your referral code, track performance, and understand qualification.',
    duration: '5 min',
    route: '/guru-referrals',
    bullets: [
      'Invite people who are a strong fit for trusted pet care.',
      'Use your personal code or referral link.',
      'Track clicks, signups, qualification, and rewards.',
      'Avoid self-referrals, duplicate accounts, or misleading promotions.',
    ],
  },
  {
    id: 'visibility',
    category: 'growth',
    title: 'Improve search visibility',
    description:
      'Keep your profile public, complete, and ready for local Pet Parents.',
    duration: '5 min',
    route: '/guru-profile',
    bullets: [
      'Maintain accurate services and prices.',
      'Keep your service area enabled.',
      'Use booking status intentionally: bookable, requestable, listed only, or not listed.',
      'Respond quickly and protect your service quality.',
    ],
  },
  {
    id: 'meet-greet',
    category: 'safety',
    title: 'Use safe meet-and-greets',
    description:
      'Prepare for introductions, access, routines, and behavior concerns.',
    duration: '7 min',
    route: '/support',
    bullets: [
      'Meet in a safe, appropriate setting.',
      'Discuss pet behavior and handling expectations.',
      'Confirm access, keys, alarms, and emergency contacts.',
      'Decline care when safety concerns cannot be resolved.',
    ],
  },
  {
    id: 'incident',
    category: 'safety',
    title: 'Respond to incidents and emergencies',
    description:
      'Know what to do when a pet, person, or property may be at risk.',
    duration: '8 min',
    route: '/support',
    bullets: [
      'Protect immediate safety first.',
      'Contact emergency services or veterinary care when needed.',
      'Notify the Pet Parent and SitGuru promptly.',
      'Document facts, timing, photos, and actions taken.',
    ],
  },
];

export default function GuruSuccessCenterScreen() {
  const { user, profile } = useAuth();
  const themeMode = useThemeMode();
  const isDark = themeMode === 'dark';
  const isWebPreview = Platform.OS === 'web';
  const palette = getPalette(isDark);
  const styles = createStyles(isDark);

  const profileRecord = (profile ?? {}) as RecordRow;
  const [category, setCategory] = useState<CategoryId>('all');
  const [query, setQuery] = useState('');
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  const profileCompletion = getProfileCompletion(profileRecord);
  const payoutReady = firstBoolean(profileRecord, [
    'stripe_payouts_enabled',
    'payouts_enabled',
  ]);
  const completedBookings =
    firstNumber(profileRecord, [
      'completed_bookings',
      'booking_count',
      'jobs_completed',
    ]) ?? 0;

  const recommendedLesson = !payoutReady
    ? LESSONS.find((lesson) => lesson.id === 'stripe')!
    : profileCompletion < 100
      ? LESSONS.find((lesson) => lesson.id === 'profile')!
      : completedBookings === 0
        ? LESSONS.find((lesson) => lesson.id === 'first-booking')!
        : LESSONS.find((lesson) => lesson.id === 'reviews')!;

  const visibleLessons = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return LESSONS.filter((lesson) => {
      if (category !== 'all' && lesson.category !== category) return false;
      if (!normalizedQuery) return true;

      return [
        lesson.title,
        lesson.description,
        ...lesson.bullets,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [category, query]);

  const progress = Math.round(
    (completedLessons.length / LESSONS.length) * 100,
  );

  function toggleCompleted(id: string) {
    setCompletedLessons((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

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
                  keyboardShouldPersistTaps="handled"
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
                      <Text style={styles.title}>Guru Success Center</Text>
                      <Text style={styles.subtitle}>
                        Learn, grow, and run your care business.
                      </Text>
                    </View>

                    <GuruHeaderActions />
                  </View>

                  <View style={styles.heroCard}>
                    <View style={styles.heroIcon}>
                      <Sparkles color="#FFFFFF" size={24} strokeWidth={2.4} />
                    </View>

                    <View style={styles.heroCopy}>
                      <Text style={styles.heroEyebrow}>
                        RECOMMENDED FOR YOU
                      </Text>
                      <Text style={styles.heroTitle}>
                        {recommendedLesson.title}
                      </Text>
                      <Text style={styles.heroText}>
                        {recommendedLesson.description}
                      </Text>
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        setCategory(recommendedLesson.category);
                        setExpandedLesson(recommendedLesson.id);
                      }}
                      style={styles.heroButton}
                    >
                      <Text style={styles.heroButtonText}>Start</Text>
                      <ChevronRight
                        color={palette.primary}
                        size={17}
                        strokeWidth={2.3}
                      />
                    </Pressable>
                  </View>

                  <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                      <View>
                        <Text style={styles.cardEyebrow}>YOUR PROGRESS</Text>
                        <Text style={styles.cardTitle}>
                          {completedLessons.length} of {LESSONS.length} lessons
                        </Text>
                      </View>
                      <Text style={styles.progressPercent}>{progress}%</Text>
                    </View>

                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${progress}%` as `${number}%` },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.searchBar}>
                    <Search
                      color={palette.muted}
                      size={18}
                      strokeWidth={2.2}
                    />
                    <TextInput
                      accessibilityLabel="Search Guru Success Center"
                      onChangeText={setQuery}
                      placeholder="Search lessons and help topics"
                      placeholderTextColor={palette.muted}
                      style={styles.searchInput}
                      value={query}
                    />
                    {query ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Clear search"
                        onPress={() => setQuery('')}
                      >
                        <X
                          color={palette.muted}
                          size={18}
                          strokeWidth={2.2}
                        />
                      </Pressable>
                    ) : null}
                  </View>

                  <ScrollView
                    horizontal
                    contentContainerStyle={styles.categoryRow}
                    showsHorizontalScrollIndicator={false}
                  >
                    {CATEGORIES.map((item) => {
                      const active = category === item.id;

                      return (
                        <Pressable
                          key={item.id}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          onPress={() => setCategory(item.id)}
                          style={[
                            styles.categoryButton,
                            active && styles.categoryButtonActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.categoryText,
                              active && styles.categoryTextActive,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                      {category === 'all'
                        ? 'All lessons'
                        : CATEGORIES.find((item) => item.id === category)?.label}
                    </Text>
                    <Text style={styles.sectionCount}>
                      {visibleLessons.length} topics
                    </Text>
                  </View>

                  {visibleLessons.length ? (
                    <View style={styles.lessonStack}>
                      {visibleLessons.map((lesson) => (
                        <LessonCard
                          key={lesson.id}
                          completed={completedLessons.includes(lesson.id)}
                          expanded={expandedLesson === lesson.id}
                          lesson={lesson}
                          onExpand={() =>
                            setExpandedLesson((current) =>
                              current === lesson.id ? null : lesson.id,
                            )
                          }
                          onToggleComplete={() => toggleCompleted(lesson.id)}
                          palette={palette}
                          styles={styles}
                        />
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyCard}>
                      <BookOpen
                        color={palette.primary}
                        size={28}
                        strokeWidth={2.2}
                      />
                      <Text style={styles.emptyTitle}>No lessons found</Text>
                      <Text style={styles.emptyText}>
                        Try another search term or category.
                      </Text>
                    </View>
                  )}

                  <View style={styles.supportCard}>
                    <View style={styles.supportIcon}>
                      <HeartHandshake
                        color={palette.primary}
                        size={22}
                        strokeWidth={2.3}
                      />
                    </View>

                    <View style={styles.supportCopy}>
                      <Text style={styles.supportTitle}>
                        Need help with a real booking?
                      </Text>
                      <Text style={styles.supportText}>
                        Contact SitGuru Support for care, safety, payment, or
                        account assistance.
                      </Text>
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      onPress={() => router.push('/support')}
                      style={styles.supportButton}
                    >
                      <ChevronRight
                        color="#FFFFFF"
                        size={18}
                        strokeWidth={2.3}
                      />
                    </Pressable>
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
                    label="Dashboard"
                    onPress={() => router.push('/guru-dashboard')}
                    styles={styles}
                  />
                  <BottomNavItem
                    active
                    icon={
                      <BookOpen
                        color={palette.primary}
                        size={21}
                        strokeWidth={2.4}
                      />
                    }
                    label="Learn"
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

function LessonCard({
  completed,
  expanded,
  lesson,
  onExpand,
  onToggleComplete,
  palette,
  styles,
}: {
  completed: boolean;
  expanded: boolean;
  lesson: Lesson;
  onExpand: () => void;
  onToggleComplete: () => void;
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.lessonCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onExpand}
        style={styles.lessonHeader}
      >
        <View style={styles.lessonIcon}>
          <LessonIcon category={lesson.category} palette={palette} />
        </View>

        <View style={styles.lessonCopy}>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <Text style={styles.lessonDescription} numberOfLines={2}>
            {lesson.description}
          </Text>

          <View style={styles.lessonMetaRow}>
            <Text style={styles.lessonDuration}>{lesson.duration}</Text>
            {completed ? (
              <View style={styles.completedPill}>
                <CheckCircle2
                  color={palette.primary}
                  size={12}
                  strokeWidth={2.4}
                />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View
          style={[
            styles.chevronButton,
            expanded && styles.chevronButtonExpanded,
          ]}
        >
          <ChevronDown
            color={palette.primary}
            size={18}
            strokeWidth={2.3}
          />
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.lessonBody}>
          {lesson.bullets.map((bullet) => (
            <View key={bullet} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}

          <View style={styles.lessonActions}>
            {lesson.route ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(lesson.route as never)}
                style={styles.openToolButton}
              >
                <Text style={styles.openToolButtonText}>Open Related Tool</Text>
                <ChevronRight
                  color="#FFFFFF"
                  size={17}
                  strokeWidth={2.3}
                />
              </Pressable>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={onToggleComplete}
              style={styles.completeButton}
            >
              <CheckCircle2
                color={palette.primary}
                size={17}
                strokeWidth={2.3}
              />
              <Text style={styles.completeButtonText}>
                {completed ? 'Mark Incomplete' : 'Mark Complete'}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function LessonIcon({
  category,
  palette,
}: {
  category: Lesson['category'];
  palette: ReturnType<typeof getPalette>;
}) {
  const common = {
    color: palette.primary,
    size: 20,
    strokeWidth: 2.3,
  };

  if (category === 'start') return <UserRound {...common} />;
  if (category === 'bookings') return <CalendarDays {...common} />;
  if (category === 'pawreport') return <PawPrint {...common} />;
  if (category === 'earnings') return <CircleDollarSign {...common} />;
  if (category === 'growth') return <TrendingUp {...common} />;
  return <ShieldCheck {...common} />;
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

function getProfileCompletion(profile: RecordRow) {
  const checks = [
    Boolean(firstString(profile, ['full_name', 'display_name', 'first_name'])),
    Boolean(firstString(profile, ['avatar_url', 'profile_photo_url'])),
    Boolean(firstString(profile, ['bio', 'about', 'description'])),
    Boolean(
      firstString(profile, [
        'service_city',
        'city',
        'service_zip',
        'zip_code',
      ]),
    ),
    Boolean(
      firstNumber(profile, ['service_radius_miles', 'radius_miles']),
    ),
    Boolean(
      firstNumber(profile, ['hourly_rate', 'starting_rate', 'base_rate']),
    ),
  ];

  return Math.round(
    (checks.filter(Boolean).length / Math.max(1, checks.length)) * 100,
  );
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
    navMuted: isDark ? '#9BAAA1' : '#748079',
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
    heroCard: {
      alignItems: 'center',
      backgroundColor: isDark ? '#087A4C' : '#087F50',
      borderRadius: 22,
      flexDirection: 'row',
      gap: 10,
      padding: 14,
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 9 },
      shadowOpacity: isDark ? 0.26 : 0.13,
      shadowRadius: 17,
    },
    heroIcon: {
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderRadius: 14,
      height: 48,
      justifyContent: 'center',
      width: 48,
    },
    heroCopy: { flex: 1, gap: 2 },
    heroEyebrow: {
      color: 'rgba(255,255,255,0.76)',
      fontFamily: AppFonts.bold,
      fontSize: 7,
      letterSpacing: 0.75,
    },
    heroTitle: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 14,
    },
    heroText: {
      color: 'rgba(255,255,255,0.84)',
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
    },
    heroButton: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 999,
      flexDirection: 'row',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    heroButtonText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    progressCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 10,
      padding: 12,
    },
    progressHeader: {
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
      fontSize: 13,
      marginTop: 2,
    },
    progressPercent: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 18,
    },
    progressTrack: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 8,
      overflow: 'hidden',
    },
    progressFill: {
      backgroundColor: palette.primary,
      borderRadius: 999,
      height: '100%',
    },
    searchBar: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 8,
      minHeight: 47,
      paddingHorizontal: 12,
    },
    searchInput: {
      color: palette.title,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 10,
      paddingVertical: 0,
    },
    categoryRow: {
      gap: 7,
      paddingRight: 4,
    },
    categoryButton: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    categoryButtonActive: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    categoryText: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 8,
    },
    categoryTextActive: { color: '#FFFFFF' },
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
    sectionCount: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
    lessonStack: { gap: 9 },
    lessonCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      overflow: 'hidden',
    },
    lessonHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 9,
      padding: 11,
    },
    lessonIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 12,
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    lessonCopy: { flex: 1, gap: 2 },
    lessonTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
    },
    lessonDescription: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
    },
    lessonMetaRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 7,
      marginTop: 2,
    },
    lessonDuration: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 7,
    },
    completedPill: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 3,
    },
    completedText: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 6,
    },
    chevronButton: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 32,
      justifyContent: 'center',
      transform: [{ rotate: '0deg' }],
      width: 32,
    },
    chevronButtonExpanded: {
      transform: [{ rotate: '180deg' }],
    },
    lessonBody: {
      borderTopColor: palette.border,
      borderTopWidth: 1,
      gap: 8,
      padding: 12,
    },
    bulletRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 7,
    },
    bulletDot: {
      backgroundColor: palette.primary,
      borderRadius: 999,
      height: 6,
      marginTop: 4,
      width: 6,
    },
    bulletText: {
      color: palette.text,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
    },
    lessonActions: {
      flexDirection: 'row',
      gap: 7,
      marginTop: 3,
    },
    openToolButton: {
      alignItems: 'center',
      backgroundColor: palette.primary,
      borderRadius: 999,
      flex: 1,
      flexDirection: 'row',
      gap: 5,
      justifyContent: 'center',
      minHeight: 38,
      paddingHorizontal: 9,
    },
    openToolButtonText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    completeButton: {
      alignItems: 'center',
      borderColor: palette.primary,
      borderRadius: 999,
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      gap: 5,
      justifyContent: 'center',
      minHeight: 38,
      paddingHorizontal: 9,
    },
    completeButtonText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    emptyCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 7,
      paddingVertical: 28,
    },
    emptyTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 14,
    },
    emptyText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
    },
    supportCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      padding: 12,
    },
    supportIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 13,
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    supportCopy: { flex: 1, gap: 2 },
    supportTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
    },
    supportText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
    },
    supportButton: {
      alignItems: 'center',
      backgroundColor: palette.primary,
      borderRadius: 999,
      height: 34,
      justifyContent: 'center',
      width: 34,
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