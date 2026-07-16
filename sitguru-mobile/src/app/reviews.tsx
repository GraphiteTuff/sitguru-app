import { router, useLocalSearchParams } from 'expo-router';
import {
  AlertTriangle,
  Bell,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flag,
  Heart,
  Home,
  MessageCircle,
  PawPrint,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
} from 'lucide-react-native';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { SitGuruIcon } from '@/components/SitGuruIcon';
import SitGuruRoleStatus from '@/components/SitGuruRoleStatus';
import SitGuruScreen from '@/components/SitGuruScreen';
import SitGuruWorkspaceSwitcher from '@/components/SitGuruWorkspaceSwitcher';
import { AppFonts } from '@/constants/fonts';
import { getAppTheme } from '@/constants/theme';
import {
  setThemePreference,
  useColorScheme,
  useThemePreference,
  type SitGuruThemePreference,
} from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { resolveSupabaseStorageUrl } from '@/lib/storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { roleLabel, type AppRole } from '@/types/auth';

type RecordRow = Record<string, unknown>;
type ReviewTableName = 'booking_reviews' | 'reviews';

type ReviewFeedback = {
  tone: 'success' | 'warning' | 'error';
  title: string;
  message: string;
};

type ReviewCategory =
  | 'Communication'
  | 'Reliability'
  | 'Pet care quality'
  | 'PawReport updates'
  | 'Safety/trust';

type CategoryRating = 'Excellent' | 'Good' | 'Needs work';

type ReviewView = {
  id: string;
  table: ReviewTableName;
  bookingId: string;
  reviewerUserId: string;
  guruUserId: string;
  reviewerName: string;
  guruName: string;
  rating: number;
  reviewText: string;
  categoryRatings: Record<string, string>;
  praise: string[];
  status: string;
  verifiedBooking: boolean;
  responseText: string;
  responseAt: string;
  createdAt: string;
};

type BookingView = {
  id: string;
  petParentUserId: string;
  guruUserId: string;
  petName: string;
  guruName: string;
  service: string;
  status: string;
  completedAt: string;
  pawReportComplete: boolean;
};

type ReviewLoadResult = {
  table: ReviewTableName | null;
  rows: RecordRow[];
  error: string;
};

type ReviewInsertResult = {
  ok: boolean;
  table: ReviewTableName | null;
  row: RecordRow | null;
  error: string;
};

type ReviewResponseResult = {
  ok: boolean;
  error: string;
};

type CategoryDefinition = {
  key: ReviewCategory;
  icon: ComponentType<{
    color?: string;
    size?: number;
    strokeWidth?: number;
  }>;
};

const REVIEW_TABLES: ReviewTableName[] = ['booking_reviews', 'reviews'];

const THEME_OPTIONS: {
  icon: 'sun' | 'moon';
  label: string;
  value: SitGuruThemePreference;
}[] = [
  { icon: 'sun', label: 'Light', value: 'light' },
  { icon: 'moon', label: 'Dark', value: 'dark' },
];

const ratingLabels: Record<number, string> = {
  5: 'Excellent care',
  4: 'Great care',
  3: 'Good care',
  2: 'Needs improvement',
  1: 'Poor experience',
};

const categories: CategoryDefinition[] = [
  { key: 'Communication', icon: MessageCircle },
  { key: 'Reliability', icon: Clock3 },
  { key: 'Pet care quality', icon: PawPrint },
  { key: 'PawReport updates', icon: Sparkles },
  { key: 'Safety/trust', icon: ShieldCheck },
];

const categoryOptions: CategoryRating[] = [
  'Excellent',
  'Good',
  'Needs work',
];

const praiseChips = [
  'Great communication',
  'On time',
  'Sent helpful updates',
  'My pet was happy',
  'Followed care notes',
  'Would book again',
];

const COMPLETED_BOOKING_STATUSES = new Set([
  'completed',
  'complete',
  'fulfilled',
  'finished',
  'closed',
]);

function asText(value: unknown) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  const parsed = Number(asText(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function asBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;

  const normalized = asText(value).toLowerCase();
  return ['true', '1', 'yes', 'complete', 'completed'].includes(normalized);
}

function firstText(row: RecordRow | null | undefined, keys: string[]) {
  if (!row) return '';

  for (const key of keys) {
    const value = asText(row[key]);
    if (value) return value;
  }

  return '';
}

function firstBoolean(row: RecordRow | null | undefined, keys: string[]) {
  if (!row) return false;

  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      return asBoolean(row[key]);
    }
  }

  return false;
}

function normalizeStatus(value: unknown) {
  return asText(value)
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .trim();
}

function titleCase(value: unknown) {
  const text = normalizeStatus(value).replace(/_/g, ' ');
  if (!text) return 'Unknown';

  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: unknown) {
  const text = asText(value);
  if (!text) return 'Date unavailable';

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return 'Date unavailable';

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function parseObject(value: unknown): Record<string, string> {
  if (!value) return {};

  if (typeof value === 'object' && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .map(([key, item]) => [key, asText(item)])
        .filter(([, item]) => Boolean(item)),
    );
  }

  if (typeof value === 'string') {
    try {
      return parseObject(JSON.parse(value));
    } catch {
      return {};
    }
  }

  return {};
}

function parseStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(asText).filter(Boolean);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(asText).filter(Boolean);
      }
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function getMissingColumn(message: string) {
  const patterns = [
    /Could not find the '([^']+)' column/i,
    /column ["']?([a-zA-Z0-9_]+)["']? does not exist/i,
    /record ["']?[^"']+["']? has no field ["']?([a-zA-Z0-9_]+)["']?/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) return match[1];
  }

  return '';
}

function isMissingTable(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes('could not find the table') ||
    (normalized.includes('relation') &&
      normalized.includes('does not exist')) ||
    normalized.includes('schema cache')
  );
}

function isMissingColumn(message: string) {
  return Boolean(getMissingColumn(message));
}

function cleanPayload(payload: RecordRow) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
}

function bookingFromRow(row: RecordRow | null): BookingView | null {
  if (!row) return null;

  const id = firstText(row, ['id', 'booking_id']);
  if (!id) return null;

  const status =
    firstText(row, ['booking_status', 'status', 'request_status']) ||
    'unknown';

  return {
    id,
    petParentUserId: firstText(row, [
      'customer_id',
      'pet_parent_id',
      'owner_id',
      'client_id',
      'booked_by',
      'user_id',
    ]),
    guruUserId: firstText(row, [
      'guru_id',
      'provider_id',
      'sitter_id',
      'caregiver_id',
    ]),
    petName:
      firstText(row, ['pet_name', 'animal_name', 'pet_display_name']) ||
      'Your pet',
    guruName:
      firstText(row, [
        'guru_name',
        'provider_name',
        'sitter_name',
        'caregiver_name',
      ]) || 'Your Guru',
    service:
      firstText(row, [
        'service_name',
        'service',
        'service_type',
        'booking_type',
      ]) || 'Pet care',
    status,
    completedAt: firstText(row, [
      'completed_at',
      'ended_at',
      'end_time',
      'service_completed_at',
      'updated_at',
    ]),
    pawReportComplete:
      firstBoolean(row, [
        'pawreport_completed',
        'paw_report_completed',
        'report_completed',
        'care_report_completed',
      ]) ||
      Boolean(
        firstText(row, [
          'pawreport_completed_at',
          'paw_report_completed_at',
          'report_completed_at',
        ]),
      ),
  };
}

function reviewFromRow(
  row: RecordRow,
  table: ReviewTableName,
  index: number,
): ReviewView {
  return {
    id:
      firstText(row, ['id', 'review_id']) ||
      `${table}-review-${index}`,
    table,
    bookingId: firstText(row, ['booking_id', 'care_booking_id']),
    reviewerUserId: firstText(row, [
      'reviewer_user_id',
      'reviewer_id',
      'customer_id',
      'pet_parent_id',
      'author_id',
      'user_id',
    ]),
    guruUserId: firstText(row, [
      'guru_user_id',
      'guru_id',
      'provider_id',
      'reviewee_id',
      'subject_user_id',
    ]),
    reviewerName:
      firstText(row, [
        'reviewer_name',
        'customer_name',
        'pet_parent_name',
        'author_name',
      ]) || 'Pet Parent',
    guruName:
      firstText(row, [
        'guru_name',
        'provider_name',
        'reviewee_name',
      ]) || 'SitGuru Guru',
    rating: Math.max(
      0,
      Math.min(
        5,
        asNumber(
          row.rating ??
            row.overall_rating ??
            row.stars ??
            row.score,
        ),
      ),
    ),
    reviewText: firstText(row, [
      'review_text',
      'review',
      'comment',
      'body',
      'message',
      'content',
    ]),
    categoryRatings: parseObject(
      row.category_ratings ??
        row.category_scores ??
        row.ratings_breakdown ??
        row.details,
    ),
    praise: parseStringArray(
      row.praise_tags ??
        row.praise ??
        row.highlights ??
        row.tags,
    ),
    status:
      firstText(row, ['status', 'review_status', 'moderation_status']) ||
      'published',
    verifiedBooking:
      firstBoolean(row, [
        'verified_booking',
        'is_verified',
        'verified',
      ]) ||
      Boolean(firstText(row, ['booking_id', 'care_booking_id'])),
    responseText: firstText(row, [
      'guru_response',
      'provider_response',
      'response',
      'owner_response',
    ]),
    responseAt: firstText(row, [
      'guru_response_at',
      'provider_response_at',
      'responded_at',
      'response_at',
    ]),
    createdAt: firstText(row, [
      'created_at',
      'submitted_at',
      'published_at',
    ]),
  };
}

function isBookingCompleted(booking: BookingView | null) {
  if (!booking) return false;

  return (
    COMPLETED_BOOKING_STATUSES.has(normalizeStatus(booking.status)) ||
    Boolean(booking.completedAt)
  );
}

function isReviewVisible(review: ReviewView) {
  const status = normalizeStatus(review.status);

  return ![
    'rejected',
    'removed',
    'deleted',
    'hidden',
    'void',
    'voided',
  ].includes(status);
}

function roleCanReview(role: AppRole | null) {
  return role === 'pet_parent';
}

async function loadBookingById(bookingId: string) {
  if (!bookingId) return null;

  const result = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle();

  if (result.error || !result.data) return null;
  return bookingFromRow(result.data as RecordRow);
}

async function loadLatestBookingForUser(
  userId: string,
  role: AppRole | null,
) {
  const fields =
    role === 'guru'
      ? ['guru_id', 'provider_id', 'sitter_id', 'caregiver_id']
      : [
          'customer_id',
          'pet_parent_id',
          'owner_id',
          'client_id',
          'booked_by',
          'user_id',
        ];

  for (const field of fields) {
    const result = await supabase
      .from('bookings')
      .select('*')
      .eq(field, userId)
      .order('completed_at', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(30);

    if (result.error) {
      if (isMissingColumn(result.error.message)) continue;
      return null;
    }

    const rows = (result.data || []) as RecordRow[];
    const completed = rows
      .map(bookingFromRow)
      .filter((item): item is BookingView => Boolean(item))
      .find(isBookingCompleted);

    if (completed) return completed;

    const first = bookingFromRow(rows[0] || null);
    if (first) return first;
  }

  return null;
}

async function loadProfileName(userId: string, fallback: string) {
  if (!userId) return fallback;

  const result = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (result.error || !result.data) return fallback;

  const row = result.data as RecordRow;

  return (
    firstText(row, [
      'full_name',
      'display_name',
      'name',
      'business_name',
    ]) ||
    [firstText(row, ['first_name']), firstText(row, ['last_name'])]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    firstText(row, ['email']).split('@')[0] ||
    fallback
  );
}

async function loadReviewsForGuru(
  guruUserId: string,
): Promise<ReviewLoadResult> {
  if (!guruUserId) {
    return {
      table: null,
      rows: [],
      error: '',
    };
  }

  let lastError = '';

  for (const table of REVIEW_TABLES) {
    const guruFields = [
      'guru_user_id',
      'guru_id',
      'provider_id',
      'reviewee_id',
      'subject_user_id',
    ];

    for (const field of guruFields) {
      const result = await supabase
        .from(table)
        .select('*')
        .eq(field, guruUserId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!result.error) {
        return {
          table,
          rows: (result.data || []) as RecordRow[],
          error: '',
        };
      }

      lastError = result.error.message;

      if (isMissingTable(result.error.message)) break;
      if (isMissingColumn(result.error.message)) continue;

      return {
        table,
        rows: [],
        error: result.error.message,
      };
    }
  }

  return {
    table: null,
    rows: [],
    error:
      lastError && !isMissingTable(lastError)
        ? lastError
        : '',
  };
}

async function findExistingReview({
  bookingId,
  reviewerUserId,
}: {
  bookingId: string;
  reviewerUserId: string;
}) {
  for (const table of REVIEW_TABLES) {
    const bookingFields = ['booking_id', 'care_booking_id'];
    const reviewerFields = [
      'reviewer_user_id',
      'reviewer_id',
      'customer_id',
      'pet_parent_id',
      'author_id',
      'user_id',
    ];

    for (const bookingField of bookingFields) {
      for (const reviewerField of reviewerFields) {
        const result = await supabase
          .from(table)
          .select('*')
          .eq(bookingField, bookingId)
          .eq(reviewerField, reviewerUserId)
          .limit(1)
          .maybeSingle();

        if (!result.error && result.data) {
          return {
            table,
            row: result.data as RecordRow,
          };
        }

        if (result.error) {
          if (isMissingTable(result.error.message)) break;
          if (isMissingColumn(result.error.message)) continue;
        }
      }
    }
  }

  return null;
}

async function insertReview(
  payload: RecordRow,
): Promise<ReviewInsertResult> {
  let lastError = '';

  for (const table of REVIEW_TABLES) {
    const workingPayload = cleanPayload(payload);

    for (let attempt = 0; attempt < 50; attempt += 1) {
      const result = await supabase
        .from(table)
        .insert(workingPayload)
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!result.error) {
        return {
          ok: true,
          table,
          row: (result.data || null) as RecordRow | null,
          error: '',
        };
      }

      lastError = result.error.message;

      if (isMissingTable(result.error.message)) break;

      const missingColumn = getMissingColumn(result.error.message);

      if (
        missingColumn &&
        Object.prototype.hasOwnProperty.call(
          workingPayload,
          missingColumn,
        )
      ) {
        delete workingPayload[missingColumn];
        continue;
      }

      return {
        ok: false,
        table,
        row: null,
        error: result.error.message,
      };
    }
  }

  return {
    ok: false,
    table: null,
    row: null,
    error:
      lastError ||
      'SitGuru review storage is not available yet.',
  };
}

async function saveGuruResponse({
  table,
  reviewId,
  guruUserId,
  response,
}: {
  table: ReviewTableName;
  reviewId: string;
  guruUserId: string;
  response: string;
}): Promise<ReviewResponseResult> {
  const now = new Date().toISOString();

  const payloads: RecordRow[] = [
    {
      guru_response: response,
      guru_response_at: now,
      guru_response_by: guruUserId,
      updated_at: now,
    },
    {
      provider_response: response,
      provider_response_at: now,
      provider_response_by: guruUserId,
      updated_at: now,
    },
    {
      response,
      response_at: now,
      responded_by: guruUserId,
      updated_at: now,
    },
  ];

  let lastError = '';

  for (const payload of payloads) {
    const result = await supabase
      .from(table)
      .update(payload)
      .eq('id', reviewId)
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!result.error && result.data) {
      return {
        ok: true,
        error: '',
      };
    }

    lastError = result.error?.message || 'Review response was not saved.';

    if (
      result.error &&
      (isMissingColumn(result.error.message) ||
        isMissingTable(result.error.message))
    ) {
      continue;
    }

    return {
      ok: false,
      error: lastError,
    };
  }

  return {
    ok: false,
    error: lastError || 'Review response was not saved.',
  };
}

function Button({
  label,
  onPress,
  icon,
  primary = false,
  disabled = false,
  styles,
}: {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  primary?: boolean;
  disabled?: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : null,
        disabled ? styles.buttonDisabled : null,
        pressed && !disabled ? styles.pressed : null,
      ]}>
      {icon}
      <Text
        style={[
          styles.buttonText,
          primary ? styles.buttonTextPrimary : null,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function ReviewsScreen() {
  const params = useLocalSearchParams<{
    bookingId?: string;
    guruId?: string;
  }>();

  const colorScheme = useColorScheme();
  const themePreference = useThemePreference();
  const theme = getAppTheme(colorScheme === 'dark' ? 'dark' : 'light');
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width } = useWindowDimensions();
  const isWebPreview = Platform.OS === 'web';

  const {
    user,
    profile,
    primaryRole,
    roles,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const bookingId =
    typeof params.bookingId === 'string' ? params.bookingId : '';
  const requestedGuruId =
    typeof params.guruId === 'string' ? params.guruId : '';

  const effectiveRole: AppRole =
    primaryRole ||
    roles[0] ||
    'pet_parent';

  const [booking, setBooking] = useState<BookingView | null>(null);
  const [guruName, setGuruName] = useState('Your Guru');
  const [reviews, setReviews] = useState<ReviewView[]>([]);
  const [reviewTable, setReviewTable] =
    useState<ReviewTableName | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [rating, setRating] = useState(5);
  const [selectedCategories, setSelectedCategories] =
    useState<Record<string, CategoryRating>>({});
  const [selectedPraise, setSelectedPraise] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState('');
  const [feedback, setFeedback] =
    useState<ReviewFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [responseReviewId, setResponseReviewId] = useState('');
  const [responseText, setResponseText] = useState('');
  const [savingResponse, setSavingResponse] = useState(false);
  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false);

  const guruUserId =
    requestedGuruId ||
    booking?.guruUserId ||
    (effectiveRole === 'guru' ? user?.id || '' : '');

  const currentUserName =
    profile?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    user?.email?.split('@')[0] ||
    'Pet Parent';

  const firstName =
    currentUserName.split(/\s+/).filter(Boolean)[0] || 'Member';

  const profileRecord = (profile ?? {}) as RecordRow;
  const metadata = (user?.user_metadata ?? {}) as RecordRow;
  const rawAvatar =
    firstText(profileRecord, [
      'avatar_url',
      'photo_url',
      'profile_photo_url',
      'profile_image_url',
    ]) || firstText(metadata, ['avatar_url', 'picture']);

  const avatarUrl = rawAvatar
    ? resolveSupabaseStorageUrl(rawAvatar)
    : null;

  const visibleReviews = useMemo(
    () => reviews.filter(isReviewVisible),
    [reviews],
  );

  const metrics = useMemo(() => {
    const rated = visibleReviews.filter((item) => item.rating > 0);
    const average = rated.length
      ? rated.reduce((sum, item) => sum + item.rating, 0) /
        rated.length
      : 0;

    const verified = visibleReviews.filter(
      (item) => item.verifiedBooking,
    ).length;

    const withResponses = visibleReviews.filter(
      (item) => Boolean(item.responseText),
    ).length;

    return {
      average,
      total: visibleReviews.length,
      verified,
      withResponses,
    };
  }, [visibleReviews]);

  const canSubmitReview =
    roleCanReview(effectiveRole) &&
    isAuthenticated &&
    Boolean(user?.id) &&
    Boolean(booking?.id) &&
    isBookingCompleted(booking);

  const isWide = width >= 720;

  const refresh = useCallback(async () => {
    if (authLoading) return;

    if (!isSupabaseConfigured) {
      setLoading(false);
      setLoadError(
        'The mobile app is not connected to Supabase in this environment.',
      );
      return;
    }

    if (!user?.id) {
      setBooking(null);
      setReviews([]);
      setLoading(false);
      setLoadError('');
      return;
    }

    setLoading(true);
    setLoadError('');

    try {
      const nextBooking =
        (bookingId ? await loadBookingById(bookingId) : null) ||
        (await loadLatestBookingForUser(user.id, effectiveRole));

      setBooking(nextBooking);

      const nextGuruUserId =
        requestedGuruId ||
        nextBooking?.guruUserId ||
        (effectiveRole === 'guru' ? user.id : '');

      if (!nextGuruUserId) {
        setGuruName(nextBooking?.guruName || 'Your Guru');
        setReviews([]);
        setReviewTable(null);
        setLoading(false);
        return;
      }

      const [nextGuruName, reviewResult] = await Promise.all([
        loadProfileName(
          nextGuruUserId,
          nextBooking?.guruName || 'Your Guru',
        ),
        loadReviewsForGuru(nextGuruUserId),
      ]);

      setGuruName(nextGuruName);
      setReviewTable(reviewResult.table);
      setReviews(
        reviewResult.rows.map((row, index) =>
          reviewFromRow(
            row,
            reviewResult.table || 'reviews',
            index,
          ),
        ),
      );
      setLoadError(reviewResult.error);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : 'SitGuru could not load reviews.',
      );
    } finally {
      setLoading(false);
    }
  }, [
    authLoading,
    bookingId,
    effectiveRole,
    requestedGuruId,
    user?.id,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function togglePraise(chip: string) {
    setSelectedPraise((current) =>
      current.includes(chip)
        ? current.filter((item) => item !== chip)
        : [...current, chip],
    );
  }

  async function submitReview() {
    setFeedback(null);

    if (!isSupabaseConfigured) {
      setFeedback({
        tone: 'error',
        title: 'Review not submitted',
        message:
          'The mobile app is not connected to Supabase in this environment.',
      });
      return;
    }

    if (!isAuthenticated || !user?.id) {
      setFeedback({
        tone: 'warning',
        title: 'Sign in required',
        message:
          'Sign in as the Pet Parent connected to the completed booking.',
      });
      return;
    }

    if (!booking?.id) {
      setFeedback({
        tone: 'warning',
        title: 'Completed booking required',
        message:
          'Open Reviews from a completed booking so SitGuru can verify the care.',
      });
      return;
    }

    if (!isBookingCompleted(booking)) {
      setFeedback({
        tone: 'warning',
        title: 'Review not available yet',
        message:
          'This booking must be completed before a verified review can be submitted.',
      });
      return;
    }

    if (!roleCanReview(effectiveRole)) {
      setFeedback({
        tone: 'warning',
        title: 'Pet Parent review required',
        message:
          'The Pet Parent connected to this booking submits the care review. Gurus can respond to published reviews.',
      });
      return;
    }

    if (
      booking.petParentUserId &&
      booking.petParentUserId !== user.id
    ) {
      setFeedback({
        tone: 'error',
        title: 'Review not submitted',
        message:
          'This booking is connected to a different Pet Parent account.',
      });
      return;
    }

    if (!booking.guruUserId && !requestedGuruId) {
      setFeedback({
        tone: 'error',
        title: 'Guru could not be verified',
        message:
          'SitGuru could not identify the Guru connected to this booking.',
      });
      return;
    }

    const cleanReview = reviewText.trim();

    if (cleanReview.length < 10) {
      setFeedback({
        tone: 'warning',
        title: 'Add a little more detail',
        message:
          'Please enter at least 10 characters about the completed care.',
      });
      return;
    }

    setSubmitting(true);

    try {
      const existing = await findExistingReview({
        bookingId: booking.id,
        reviewerUserId: user.id,
      });

      if (existing) {
        setFeedback({
          tone: 'warning',
          title: 'Review already submitted',
          message:
            'Only one verified Pet Parent review is allowed for each completed booking.',
        });
        setSubmitting(false);
        return;
      }

      const now = new Date().toISOString();
      const nextGuruUserId =
        booking.guruUserId || requestedGuruId;

      const payload: RecordRow = {
        booking_id: booking.id,
        care_booking_id: booking.id,

        reviewer_user_id: user.id,
        reviewer_id: user.id,
        customer_id: user.id,
        pet_parent_id: user.id,
        author_id: user.id,
        user_id: user.id,

        guru_user_id: nextGuruUserId,
        guru_id: nextGuruUserId,
        provider_id: nextGuruUserId,
        reviewee_id: nextGuruUserId,
        subject_user_id: nextGuruUserId,

        reviewer_name: currentUserName,
        customer_name: currentUserName,
        pet_parent_name: currentUserName,
        author_name: currentUserName,

        guru_name: guruName,
        provider_name: guruName,
        reviewee_name: guruName,

        rating,
        overall_rating: rating,
        stars: rating,
        score: rating,

        review_text: cleanReview,
        review: cleanReview,
        comment: cleanReview,
        body: cleanReview,
        message: cleanReview,
        content: cleanReview,

        category_ratings: selectedCategories,
        category_scores: selectedCategories,
        ratings_breakdown: selectedCategories,

        praise_tags: selectedPraise,
        praise: selectedPraise,
        highlights: selectedPraise,
        tags: selectedPraise,

        verified_booking: true,
        is_verified: true,
        verified: true,

        status: 'published',
        review_status: 'published',
        moderation_status: 'published',

        source: 'sitguru_mobile_app',
        submitted_at: now,
        published_at: now,
        created_at: now,
        updated_at: now,
      };

      const result = await insertReview(payload);

      if (!result.ok) {
        setFeedback({
          tone: 'error',
          title: 'Review not submitted',
          message:
            result.error ||
            'SitGuru could not save this review. Please try again.',
        });
        setSubmitting(false);
        return;
      }

      setReviewTable(result.table);
      setReviewText('');
      setSelectedCategories({});
      setSelectedPraise([]);
      setRating(5);

      setFeedback({
        tone: 'success',
        title: 'Review submitted',
        message:
          'SitGuru saved this as a verified-booking review. Thank you for helping local Pet Parents.',
      });

      await refresh();
    } catch (error) {
      setFeedback({
        tone: 'error',
        title: 'Review not submitted',
        message:
          error instanceof Error
            ? error.message
            : 'SitGuru could not save this review.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function submitGuruResponse(review: ReviewView) {
    setFeedback(null);

    if (!user?.id || effectiveRole !== 'guru') {
      setFeedback({
        tone: 'warning',
        title: 'Guru response required',
        message:
          'Sign in to the Guru workspace connected to this review.',
      });
      return;
    }

    if (review.guruUserId && review.guruUserId !== user.id) {
      setFeedback({
        tone: 'error',
        title: 'Response not saved',
        message:
          'This review is connected to a different Guru account.',
      });
      return;
    }

    const cleanResponse = responseText.trim();

    if (cleanResponse.length < 5) {
      setFeedback({
        tone: 'warning',
        title: 'Add a response',
        message:
          'Please enter at least five characters before saving the response.',
      });
      return;
    }

    setSavingResponse(true);

    const result = await saveGuruResponse({
      table: review.table,
      reviewId: review.id,
      guruUserId: user.id,
      response: cleanResponse,
    });

    setSavingResponse(false);

    if (!result.ok) {
      setFeedback({
        tone: 'error',
        title: 'Response not saved',
        message: result.error,
      });
      return;
    }

    setResponseReviewId('');
    setResponseText('');

    setFeedback({
      tone: 'success',
      title: 'Response saved',
      message:
        'Your Guru response is now connected to the verified review.',
    });

    await refresh();
  }

  function reportReview(review: ReviewView) {
    router.push({
      pathname: '/support',
      params: {
        topic: 'Reviews',
        reference: review.id,
      },
    });
  }

  return (
    <>
      <SitGuruScreen center={isWebPreview} maxWidth={620}>
        <View
          style={[
            styles.previewCanvas,
            !isWebPreview ? styles.previewCanvasNative : null,
          ]}>
          <View
            style={[
              styles.deviceFrame,
              !isWebPreview ? styles.deviceFrameNative : null,
            ]}>
            {isWebPreview ? <View style={styles.deviceTopSpeaker} /> : null}

            <View
              style={[
                styles.phoneShell,
                !isWebPreview ? styles.phoneShellNative : null,
              ]}>
              <View
                style={[
                  styles.screen,
                  !isWebPreview ? styles.screenNative : null,
                ]}>
                {isWebPreview ? (
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
                ) : null}

                <ScrollView
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}>
                  <View style={styles.page}>
                    <View style={styles.header}>
                      <View style={styles.headerCopy}>
                        <Text style={styles.headerTitle}>Reviews & Ratings</Text>
                        <Text style={styles.headerWelcome}>
                          Welcome back, {firstName}!{' '}
                          <Text style={styles.wave}>👋</Text>
                        </Text>
                        <SitGuruRoleStatus role={effectiveRole} />
                      </View>

                      <View style={styles.headerActions}>
                        <Pressable
                          accessibilityLabel="Open notifications"
                          accessibilityRole="button"
                          onPress={() => router.push('/notifications')}
                          style={styles.headerIconButton}>
                          <Bell
                            color={theme.colors.text}
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
                                  active ? styles.modeButtonActive : null,
                                ]}>
                                <SitGuruIcon
                                  color={
                                    active
                                      ? option.value === 'light'
                                        ? '#F3AA1F'
                                        : theme.mode === 'dark'
                                          ? '#F0CF62'
                                          : theme.colors.primary
                                      : theme.colors.muted
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
                          style={styles.profileButton}>
                          <HeaderAvatar
                            fallback={initials(currentUserName)}
                            imageUrl={avatarUrl}
                            styles={styles}
                          />
                        </Pressable>
                      </View>
                    </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Star color="#FFFFFF" size={28} strokeWidth={2.3} />
          </View>
          <Text style={styles.eyebrow}>Verified care feedback</Text>
          <Text style={styles.title}>Reviews & Ratings</Text>
          <Text style={styles.subtitle}>
            Recognize excellent care, help local Pet Parents book confidently,
            and give Gurus a respectful place to respond.
          </Text>

          <View style={styles.roleStrip}>
            <Text style={styles.roleStripName}>
              {currentUserName}
            </Text>
            <Text style={styles.roleStripRole}>
              {effectiveRole ? roleLabel(effectiveRole) : 'Member'}
            </Text>
          </View>
        </View>

        {loadError ? (
          <View style={styles.errorCard}>
            <AlertTriangle
              color={theme.colors.danger}
              size={22}
              strokeWidth={2.4}
            />
            <Text style={styles.errorText}>{loadError}</Text>
          </View>
        ) : null}

        <View style={styles.bookingCard}>
          <View style={styles.bookingIcon}>
            <CalendarCheck2
              color={theme.colors.primary}
              size={25}
              strokeWidth={2.3}
            />
          </View>

          <View style={styles.bookingCopy}>
            <Text style={styles.bookingEyebrow}>
              {booking?.id ? 'Booking connected' : 'No booking selected'}
            </Text>
            <Text style={styles.bookingTitle}>
              {booking?.petName || 'Open a completed booking'}
            </Text>
            <Text style={styles.bookingMeta}>
              {booking
                ? `${booking.service} • ${titleCase(booking.status)}`
                : 'Reviews become available after completed care.'}
            </Text>
            <Text style={styles.bookingMeta}>
              Guru: {guruName}
            </Text>
          </View>

          <View
            style={[
              styles.bookingStatus,
              isBookingCompleted(booking)
                ? styles.bookingStatusComplete
                : styles.bookingStatusPending,
            ]}>
            <Text style={styles.bookingStatusText}>
              {isBookingCompleted(booking) ? 'Review eligible' : 'Not ready'}
            </Text>
          </View>
        </View>

        {effectiveRole === 'pet_parent' ? (
          <View style={styles.formCard}>
            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionEyebrow}>Post-care feedback</Text>
                <Text style={styles.sectionTitle}>Rate this care</Text>
              </View>
              <ShieldCheck
                color={theme.colors.primary}
                size={25}
                strokeWidth={2.3}
              />
            </View>

            {!isAuthenticated && !authLoading ? (
              <View style={styles.noticeCard}>
                <Text style={styles.noticeTitle}>Sign in to review</Text>
                <Text style={styles.body}>
                  The Pet Parent connected to the completed booking submits the
                  verified review.
                </Text>
                <Button
                  label="Sign in"
                  onPress={() => router.push('/login')}
                  primary
                  styles={styles}
                />
              </View>
            ) : null}

            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  accessibilityLabel={`${star} star rating`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: star === rating }}
                  hitSlop={7}
                  onPress={() => setRating(star)}
                  style={({ pressed }) => [
                    styles.starButton,
                    pressed ? styles.pressed : null,
                  ]}>
                  <Star
                    color={
                      star <= rating
                        ? theme.colors.highlight
                        : theme.colors.borderStrong
                    }
                    fill={
                      star <= rating
                        ? theme.colors.highlight
                        : 'transparent'
                    }
                    size={39}
                    strokeWidth={2}
                  />
                </Pressable>
              ))}
            </View>

            <Text style={styles.ratingLabel}>
              {ratingLabels[rating]}
            </Text>

            <Text style={styles.fieldLabel}>Care categories</Text>
            <View style={styles.categoryList}>
              {categories.map((category) => {
                const Icon = category.icon;

                return (
                  <View key={category.key} style={styles.categoryRow}>
                    <View style={styles.categoryHeading}>
                      <View style={styles.categoryIcon}>
                        <Icon
                          color={theme.colors.primary}
                          size={17}
                          strokeWidth={2.3}
                        />
                      </View>
                      <Text style={styles.categoryTitle}>
                        {category.key}
                      </Text>
                    </View>

                    <View style={styles.chipRow}>
                      {categoryOptions.map((option) => {
                        const active =
                          selectedCategories[category.key] === option;

                        return (
                          <Pressable
                            key={option}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            onPress={() =>
                              setSelectedCategories((current) => ({
                                ...current,
                                [category.key]: option,
                              }))
                            }
                            style={[
                              styles.chip,
                              active ? styles.chipActive : null,
                            ]}>
                            <Text
                              style={[
                                styles.chipText,
                                active ? styles.chipTextActive : null,
                              ]}>
                              {option}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Written review</Text>
            <TextInput
              multiline
              value={reviewText}
              onChangeText={setReviewText}
              placeholder="Share what went well, how your pet did, and what future Pet Parents should know."
              placeholderTextColor={theme.colors.inputPlaceholder}
              style={styles.reviewInput}
              textAlignVertical="top"
              maxLength={3000}
            />
            <Text style={styles.characterCount}>
              {reviewText.trim().length}/3000
            </Text>

            <Text style={styles.fieldLabel}>Quick praise</Text>
            <View style={styles.chipRow}>
              {praiseChips.map((chip) => {
                const active = selectedPraise.includes(chip);

                return (
                  <Pressable
                    key={chip}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => togglePraise(chip)}
                    style={[
                      styles.chip,
                      active ? styles.chipActive : null,
                    ]}>
                    <Heart
                      color={
                        active
                          ? theme.colors.chipActiveText
                          : theme.colors.textSecondary
                      }
                      fill={active ? theme.colors.chipActiveText : 'transparent'}
                      size={14}
                      strokeWidth={2.2}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        active ? styles.chipTextActive : null,
                      ]}>
                      {chip}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {feedback ? (
              <View
                style={[
                  styles.feedbackCard,
                  feedback.tone === 'success'
                    ? styles.feedbackSuccess
                    : feedback.tone === 'warning'
                      ? styles.feedbackWarning
                      : styles.feedbackError,
                ]}>
                {feedback.tone === 'success' ? (
                  <CheckCircle2
                    color={theme.colors.success}
                    size={21}
                    strokeWidth={2.4}
                  />
                ) : (
                  <AlertTriangle
                    color={
                      feedback.tone === 'warning'
                        ? theme.colors.warning
                        : theme.colors.danger
                    }
                    size={21}
                    strokeWidth={2.4}
                  />
                )}
                <View style={styles.feedbackCopy}>
                  <Text style={styles.feedbackTitle}>
                    {feedback.title}
                  </Text>
                  <Text style={styles.feedbackMessage}>
                    {feedback.message}
                  </Text>
                </View>
              </View>
            ) : null}

            <Button
              label={submitting ? 'Submitting review…' : 'Submit verified review'}
              onPress={() => void submitReview()}
              icon={
                submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Send color="#FFFFFF" size={18} strokeWidth={2.4} />
                )
              }
              primary
              disabled={submitting || !canSubmitReview}
              styles={styles}
            />

            {!canSubmitReview && isAuthenticated ? (
              <Text style={styles.formFootnote}>
                A verified review requires a completed booking connected to the
                signed-in Pet Parent.
              </Text>
            ) : (
              <Text style={styles.formFootnote}>
                Only one verified Pet Parent review is allowed per completed
                booking. A review is labeled submitted only after Supabase
                confirms the save.
              </Text>
            )}
          </View>
        ) : null}

        {feedback && effectiveRole !== 'pet_parent' ? (
          <View
            style={[
              styles.feedbackCard,
              feedback.tone === 'success'
                ? styles.feedbackSuccess
                : feedback.tone === 'warning'
                  ? styles.feedbackWarning
                  : styles.feedbackError,
            ]}>
            {feedback.tone === 'success' ? (
              <CheckCircle2
                color={theme.colors.success}
                size={21}
                strokeWidth={2.4}
              />
            ) : (
              <AlertTriangle
                color={
                  feedback.tone === 'warning'
                    ? theme.colors.warning
                    : theme.colors.danger
                }
                size={21}
                strokeWidth={2.4}
              />
            )}
            <View style={styles.feedbackCopy}>
              <Text style={styles.feedbackTitle}>{feedback.title}</Text>
              <Text style={styles.feedbackMessage}>{feedback.message}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.metricsCard}>
          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionEyebrow}>Public reputation</Text>
              <Text style={styles.sectionTitle}>{guruName}</Text>
            </View>
            <Star
              color={theme.colors.highlight}
              fill={theme.colors.highlight}
              size={26}
              strokeWidth={2}
            />
          </View>

          <View style={styles.metrics}>
            <Metric
              label="Average rating"
              value={metrics.total ? metrics.average.toFixed(1) : '—'}
              styles={styles}
            />
            <Metric
              label="Reviews"
              value={String(metrics.total)}
              styles={styles}
            />
            <Metric
              label="Verified"
              value={String(metrics.verified)}
              styles={styles}
            />
            <Metric
              label="Guru responses"
              value={String(metrics.withResponses)}
              styles={styles}
            />
          </View>
        </View>

        <View style={styles.reviewsSection}>
          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionEyebrow}>Verified feedback</Text>
              <Text style={styles.sectionTitle}>Care reviews</Text>
            </View>
            {reviewTable ? (
              <Text style={styles.tableBadge}>
                {reviewTable.replace(/_/g, ' ')}
              </Text>
            ) : null}
          </View>

          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator
                color={theme.colors.primary}
                size="small"
              />
              <Text style={styles.body}>Loading reviews…</Text>
            </View>
          ) : visibleReviews.length ? (
            <View style={styles.reviewGrid}>
              {visibleReviews.map((item) => (
                <View
                  key={`${item.table}-${item.id}`}
                  style={[
                    styles.reviewCard,
                    isWide ? styles.reviewCardWide : null,
                  ]}>
                  <View style={styles.reviewTopRow}>
                    <View style={styles.reviewerIdentity}>
                      <View style={styles.reviewerAvatar}>
                        <UserRound
                          color={theme.colors.primary}
                          size={19}
                          strokeWidth={2.3}
                        />
                      </View>
                      <View style={styles.reviewerCopy}>
                        <Text style={styles.reviewName}>
                          {item.reviewerName}
                        </Text>
                        <Text style={styles.reviewDate}>
                          {formatDate(item.createdAt)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.ratingPill}>
                      <Star
                        color={theme.colors.highlight}
                        fill={theme.colors.highlight}
                        size={14}
                        strokeWidth={2}
                      />
                      <Text style={styles.ratingPillText}>
                        {item.rating ? item.rating.toFixed(1) : '—'}
                      </Text>
                    </View>
                  </View>

                  {item.verifiedBooking ? (
                    <View style={styles.verifiedBadge}>
                      <ShieldCheck
                        color={theme.colors.success}
                        size={14}
                        strokeWidth={2.4}
                      />
                      <Text style={styles.verifiedBadgeText}>
                        Verified booking
                      </Text>
                    </View>
                  ) : null}

                  <Text style={styles.reviewBody}>
                    {item.reviewText || 'Rating submitted without written feedback.'}
                  </Text>

                  {item.praise.length ? (
                    <View style={styles.praiseRow}>
                      {item.praise.slice(0, 6).map((tag) => (
                        <View key={tag} style={styles.praiseTag}>
                          <Text style={styles.praiseTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {Object.keys(item.categoryRatings).length ? (
                    <View style={styles.categorySummary}>
                      {Object.entries(item.categoryRatings).map(
                        ([key, value]) => (
                          <View
                            key={key}
                            style={styles.categorySummaryRow}>
                            <Text style={styles.categorySummaryLabel}>
                              {key}
                            </Text>
                            <Text style={styles.categorySummaryValue}>
                              {value}
                            </Text>
                          </View>
                        ),
                      )}
                    </View>
                  ) : null}

                  {item.responseText ? (
                    <View style={styles.responseCard}>
                      <Text style={styles.responseEyebrow}>
                        Response from {item.guruName || guruName}
                      </Text>
                      <Text style={styles.responseText}>
                        {item.responseText}
                      </Text>
                      {item.responseAt ? (
                        <Text style={styles.responseDate}>
                          {formatDate(item.responseAt)}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  {effectiveRole === 'guru' &&
                  (!item.guruUserId || item.guruUserId === user?.id) ? (
                    responseReviewId === item.id ? (
                      <View style={styles.responseForm}>
                        <Text style={styles.fieldLabel}>
                          Public Guru response
                        </Text>
                        <TextInput
                          multiline
                          value={responseText}
                          onChangeText={setResponseText}
                          placeholder="Thank the Pet Parent or respectfully add helpful context."
                          placeholderTextColor={theme.colors.inputPlaceholder}
                          style={styles.responseInput}
                          textAlignVertical="top"
                          maxLength={1500}
                        />
                        <View style={styles.buttonRow}>
                          <Button
                            label="Cancel"
                            onPress={() => {
                              setResponseReviewId('');
                              setResponseText('');
                            }}
                            styles={styles}
                          />
                          <Button
                            label={
                              savingResponse
                                ? 'Saving response…'
                                : 'Save response'
                            }
                            onPress={() => void submitGuruResponse(item)}
                            icon={
                              savingResponse ? (
                                <ActivityIndicator
                                  color="#FFFFFF"
                                  size="small"
                                />
                              ) : (
                                <Send
                                  color="#FFFFFF"
                                  size={16}
                                  strokeWidth={2.4}
                                />
                              )
                            }
                            primary
                            disabled={savingResponse}
                            styles={styles}
                          />
                        </View>
                      </View>
                    ) : (
                      <Button
                        label={
                          item.responseText
                            ? 'Update Guru response'
                            : 'Respond as Guru'
                        }
                        onPress={() => {
                          setResponseReviewId(item.id);
                          setResponseText(item.responseText);
                        }}
                        icon={
                          <MessageCircle
                            color={theme.colors.primary}
                            size={16}
                            strokeWidth={2.4}
                          />
                        }
                        styles={styles}
                      />
                    )
                  ) : null}

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => reportReview(item)}
                    style={styles.reportButton}>
                    <Flag
                      color={theme.colors.textSecondary}
                      size={14}
                      strokeWidth={2.2}
                    />
                    <Text style={styles.reportButtonText}>
                      Report a concern
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Star
                color={theme.colors.primary}
                size={30}
                strokeWidth={2.1}
              />
              <Text style={styles.emptyTitle}>No verified reviews yet</Text>
              <Text style={styles.emptyText}>
                Reviews will appear after completed SitGuru bookings are
                submitted and saved.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.supportCard}>
          <View style={styles.supportIcon}>
            <Flag
              color={theme.colors.primary}
              size={22}
              strokeWidth={2.3}
            />
          </View>
          <View style={styles.supportCopy}>
            <Text style={styles.supportTitle}>Private feedback or concern</Text>
            <Text style={styles.body}>
              Reviews are public reputation feedback. Use Support for safety,
              payment, conduct, account, or private booking concerns.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/support')}
            style={styles.supportButton}>
            <Text style={styles.supportButtonText}>Open Support</Text>
            <ChevronRight
              color={theme.colors.primary}
              size={16}
              strokeWidth={2.5}
            />
          </Pressable>
        </View>

        <View style={styles.buttonStack}>
          <Button
            label="Back to booking details"
            onPress={() => router.push('/booking-details')}
            styles={styles}
          />
          <Button
            label="Message through SitGuru"
            onPress={() => router.push('/conversation')}
            icon={
              <MessageCircle
                color="#FFFFFF"
                size={17}
                strokeWidth={2.4}
              />
            }
            primary
            styles={styles}
          />
          <Button
            label="View PawReport Live"
            onPress={() => router.push('/pawreport-live')}
            styles={styles}
          />
        </View>

                  </View>
                </ScrollView>

                <View style={styles.bottomNav}>
                  <BottomNavItem
                    label="Home"
                    icon={
                      <Home
                        color={theme.colors.textSecondary}
                        size={20}
                        strokeWidth={2.3}
                      />
                    }
                    onPress={() =>
                      router.push(
                        effectiveRole === 'guru'
                          ? '/guru-dashboard'
                          : effectiveRole === 'ambassador'
                            ? '/ambassador-dashboard'
                            : effectiveRole === 'admin'
                              ? '/admin-dashboard'
                              : '/pet-parent-dashboard',
                      )
                    }
                    styles={styles}
                  />
                  <BottomNavItem
                    label="Explore"
                    icon={
                      <Search
                        color={theme.colors.textSecondary}
                        size={20}
                        strokeWidth={2.3}
                      />
                    }
                    onPress={() => router.push('/find-care')}
                    styles={styles}
                  />
                  <BottomNavItem
                    active
                    label="Bookings"
                    icon={
                      <CalendarDays
                        color={theme.colors.primary}
                        size={20}
                        strokeWidth={2.4}
                      />
                    }
                    onPress={() => router.push('/booking-details')}
                    styles={styles}
                  />
                  <BottomNavItem
                    label="Messages"
                    icon={
                      <MessageCircle
                        color={theme.colors.textSecondary}
                        size={20}
                        strokeWidth={2.3}
                      />
                    }
                    onPress={() => router.push('/conversation')}
                    styles={styles}
                  />
                  <BottomNavItem
                    label="Profile"
                    icon={
                      <UserRound
                        color={theme.colors.textSecondary}
                        size={20}
                        strokeWidth={2.3}
                      />
                    }
                    onPress={() => router.push('/account')}
                    styles={styles}
                  />
                </View>

                {isWebPreview ? <View style={styles.homeIndicator} /> : null}
              </View>
            </View>
          </View>
        </View>
      </SitGuruScreen>

      <SitGuruWorkspaceSwitcher
        currentRole={effectiveRole}
        onClose={() => setWorkspaceSwitcherOpen(false)}
        profileHref="/account"
        profileLabel="Manage account"
        visible={workspaceSwitcherOpen}
      />
    </>
  );
}


function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return 'SG';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function HeaderAvatar({
  fallback,
  imageUrl,
  styles,
}: {
  fallback: string;
  imageUrl: string | null;
  styles: ReturnType<typeof createStyles>;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <View style={styles.avatarFrame}>
      {showImage ? (
        <Image
          onError={() => setImageFailed(true)}
          resizeMode="cover"
          source={{ uri: imageUrl as string }}
          style={styles.avatarImage}
        />
      ) : (
        <Text style={styles.avatarInitials}>{fallback}</Text>
      )}
    </View>
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
      style={({ pressed }) => [
        styles.bottomNavItem,
        pressed ? styles.pressed : null,
      ]}>
      {icon}
      <Text
        style={[
          styles.bottomNavText,
          active ? styles.bottomNavTextActive : null,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Metric({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof getAppTheme>) {
  const dark = theme.mode === 'dark';

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
      backgroundColor: dark ? '#06140F' : '#FFF9F1',
      borderColor: theme.colors.border,
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
      backgroundColor: dark ? '#06140F' : '#FFF9F1',
      flex: 1,
      position: 'relative',
      width: '100%',
    },
    screenNative: {
      minHeight: '100%',
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
      color: theme.colors.text,
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
      backgroundColor: theme.colors.text,
      borderRadius: 2,
      width: 3,
    },
    wifiText: {
      color: theme.colors.text,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    batteryWrap: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 2,
    },
    batteryBody: {
      borderColor: theme.colors.text,
      borderRadius: 3,
      borderWidth: 1,
      height: 9,
      padding: 1,
      width: 17,
    },
    batteryFill: {
      backgroundColor: theme.colors.text,
      borderRadius: 2,
      flex: 1,
    },
    batteryCap: {
      backgroundColor: theme.colors.text,
      height: 4,
      width: 2,
    },
    scrollContent: {
      paddingBottom: 112,
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 13,
    },
    headerCopy: {
      flex: 1,
      gap: 2,
      paddingRight: 8,
    },
    headerTitle: {
      color: theme.colors.text,
      fontFamily: AppFonts.extraBold,
      fontSize: 20,
      letterSpacing: -0.4,
      lineHeight: 24,
    },
    headerWelcome: {
      color: theme.colors.muted,
      fontFamily: AppFonts.medium,
      fontSize: 11,
    },
    wave: {
      fontSize: 11,
    },
    headerActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    headerIconButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    modeToggle: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: dark ? '#B9831B' : '#F2822E',
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
      backgroundColor: dark ? 'rgba(226,170,45,0.18)' : '#FFF4D8',
    },
    profileButton: {
      borderRadius: 999,
    },
    avatarFrame: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderColor: dark ? '#2E6C4B' : '#FFFFFF',
      borderRadius: 21,
      borderWidth: 2,
      height: 42,
      justifyContent: 'center',
      overflow: 'hidden',
      width: 42,
    },
    avatarImage: {
      height: '100%',
      width: '100%',
    },
    avatarInitials: {
      color: theme.colors.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
    },
    page: {
      gap: 17,
      paddingBottom: 20,
    },
    topBar: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    topButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 42,
      paddingHorizontal: 14,
    },
    topButtonText: {
      color: theme.colors.primary,
      fontSize: 12,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    refreshButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 7,
      minHeight: 42,
      paddingHorizontal: 13,
    },
    refreshText: {
      color: theme.colors.primary,
      fontSize: 11,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    pressed: {
      opacity: 0.76,
    },
    hero: {
      backgroundColor: dark ? '#0D2A1C' : '#0F563E',
      borderRadius: 30,
      gap: 10,
      overflow: 'hidden',
      padding: 22,
    },
    heroIcon: {
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderRadius: 18,
      height: 52,
      justifyContent: 'center',
      width: 52,
    },
    eyebrow: {
      color: dark ? '#A6E9C2' : '#C9F26D',
      fontSize: 11,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
    },
    title: {
      color: '#FFFFFF',
      fontSize: 36,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      letterSpacing: -1.1,
      lineHeight: 41,
    },
    subtitle: {
      color: '#E4F5EB',
      fontSize: 15,
      fontFamily: AppFonts.semiBold,
      fontWeight: '700',
      lineHeight: 23,
    },
    roleStrip: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderColor: 'rgba(255,255,255,0.14)',
      borderRadius: 18,
      borderWidth: 1,
      gap: 2,
      marginTop: 4,
      padding: 12,
    },
    roleStripName: {
      color: '#FFFFFF',
      fontSize: 15,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    roleStripRole: {
      color: '#D7EADF',
      fontSize: 12,
      fontFamily: AppFonts.semiBold,
      fontWeight: '700',
    },
    errorCard: {
      alignItems: 'flex-start',
      backgroundColor: dark ? '#321713' : '#FEF2F2',
      borderColor: dark ? '#6D3027' : '#FECACA',
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      padding: 13,
    },
    errorText: {
      color: theme.colors.danger,
      flex: 1,
      fontSize: 12,
      fontFamily: AppFonts.bold,
      fontWeight: '800',
      lineHeight: 19,
    },
    bookingCard: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 25,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 13,
      padding: 16,
    },
    bookingIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 17,
      height: 50,
      justifyContent: 'center',
      width: 50,
    },
    bookingCopy: {
      flex: 1,
      gap: 2,
    },
    bookingEyebrow: {
      color: theme.colors.primary,
      fontSize: 10,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    bookingTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    bookingMeta: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontFamily: AppFonts.semiBold,
      fontWeight: '700',
      lineHeight: 17,
    },
    bookingStatus: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    bookingStatusComplete: {
      backgroundColor: dark ? '#123122' : '#DCFCE7',
    },
    bookingStatusPending: {
      backgroundColor: dark ? '#302611' : '#FEF3C7',
    },
    bookingStatusText: {
      color: theme.colors.text,
      fontSize: 9,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      textTransform: 'uppercase',
    },
    formCard: {
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 28,
      borderWidth: 1,
      gap: 14,
      padding: 18,
    },
    sectionHeading: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
    },
    sectionEyebrow: {
      color: theme.colors.primary,
      fontSize: 10,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: 22,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      letterSpacing: -0.4,
      lineHeight: 28,
    },
    noticeCard: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.borderStrong,
      borderRadius: 18,
      borderWidth: 1,
      gap: 9,
      padding: 14,
    },
    noticeTitle: {
      color: theme.colors.text,
      fontSize: 15,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    body: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      fontFamily: AppFonts.semiBold,
      fontWeight: '700',
      lineHeight: 21,
    },
    stars: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 5,
    },
    starButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 47,
      minWidth: 47,
    },
    ratingLabel: {
      color: theme.colors.primaryDark,
      fontSize: 17,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    fieldLabel: {
      color: theme.colors.text,
      fontSize: 11,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    categoryList: {
      gap: 13,
    },
    categoryRow: {
      backgroundColor: theme.colors.softCard,
      borderColor: theme.colors.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 9,
      padding: 13,
    },
    categoryHeading: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 9,
    },
    categoryIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 12,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    categoryTitle: {
      color: theme.colors.text,
      fontSize: 14,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      alignItems: 'center',
      backgroundColor: theme.colors.chip,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    chipActive: {
      backgroundColor: theme.colors.chipActive,
      borderColor: theme.colors.chipActive,
    },
    chipText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    chipTextActive: {
      color: theme.colors.chipActiveText,
    },
    reviewInput: {
      backgroundColor: theme.colors.input,
      borderColor: theme.colors.border,
      borderRadius: 20,
      borderWidth: 1,
      color: theme.colors.inputText,
      fontSize: 15,
      fontFamily: AppFonts.semiBold,
      fontWeight: '700',
      lineHeight: 22,
      minHeight: 145,
      padding: 14,
    },
    characterCount: {
      color: theme.colors.muted,
      fontSize: 10,
      fontFamily: AppFonts.bold,
      fontWeight: '800',
      textAlign: 'right',
    },
    feedbackCard: {
      alignItems: 'flex-start',
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      padding: 13,
    },
    feedbackSuccess: {
      backgroundColor: dark ? '#123122' : '#ECFDF3',
      borderColor: dark ? '#28583E' : '#BBF7D0',
    },
    feedbackWarning: {
      backgroundColor: dark ? '#302611' : '#FFFBEB',
      borderColor: dark ? '#6A5422' : '#FDE68A',
    },
    feedbackError: {
      backgroundColor: dark ? '#321713' : '#FEF2F2',
      borderColor: dark ? '#6D3027' : '#FECACA',
    },
    feedbackCopy: {
      flex: 1,
      gap: 3,
    },
    feedbackTitle: {
      color: theme.colors.text,
      fontSize: 14,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    feedbackMessage: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontFamily: AppFonts.semiBold,
      fontWeight: '700',
      lineHeight: 19,
    },
    button: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.primary,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      flexGrow: 1,
      gap: 8,
      justifyContent: 'center',
      minHeight: 49,
      minWidth: 160,
      paddingHorizontal: 16,
    },
    buttonPrimary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    buttonText: {
      color: theme.colors.primary,
      fontSize: 13,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    buttonTextPrimary: {
      color: '#FFFFFF',
    },
    buttonDisabled: {
      opacity: 0.48,
    },
    formFootnote: {
      color: theme.colors.muted,
      fontSize: 11,
      fontFamily: AppFonts.semiBold,
      fontWeight: '700',
      lineHeight: 17,
      textAlign: 'center',
    },
    metricsCard: {
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 27,
      borderWidth: 1,
      gap: 14,
      padding: 18,
    },
    metrics: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    metric: {
      backgroundColor: theme.colors.softCard,
      borderColor: theme.colors.border,
      borderRadius: 17,
      borderWidth: 1,
      flex: 1,
      minWidth: 130,
      padding: 13,
    },
    metricValue: {
      color: theme.colors.primaryDark,
      fontSize: 23,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    metricLabel: {
      color: theme.colors.textSecondary,
      fontSize: 10,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      marginTop: 3,
      textTransform: 'uppercase',
    },
    reviewsSection: {
      gap: 12,
    },
    tableBadge: {
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 999,
      color: theme.colors.primary,
      fontSize: 10,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      paddingHorizontal: 10,
      paddingVertical: 7,
      textTransform: 'uppercase',
    },
    loadingState: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 22,
      borderWidth: 1,
      gap: 10,
      justifyContent: 'center',
      minHeight: 130,
    },
    reviewGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    reviewCard: {
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 23,
      borderWidth: 1,
      gap: 11,
      padding: 16,
      width: '100%',
    },
    reviewCardWide: {
      width: '48.9%',
    },
    reviewTopRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'space-between',
    },
    reviewerIdentity: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      gap: 10,
    },
    reviewerAvatar: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 999,
      height: 39,
      justifyContent: 'center',
      width: 39,
    },
    reviewerCopy: {
      flex: 1,
      gap: 1,
    },
    reviewName: {
      color: theme.colors.text,
      fontSize: 14,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    reviewDate: {
      color: theme.colors.muted,
      fontSize: 10,
      fontFamily: AppFonts.semiBold,
      fontWeight: '700',
    },
    ratingPill: {
      alignItems: 'center',
      backgroundColor: theme.colors.highlightSoft,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },
    ratingPillText: {
      color: theme.colors.text,
      fontSize: 11,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    verifiedBadge: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: dark ? '#123122' : '#ECFDF3',
      borderRadius: 999,
      flexDirection: 'row',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },
    verifiedBadgeText: {
      color: theme.colors.success,
      fontSize: 10,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    reviewBody: {
      color: theme.colors.text,
      fontSize: 14,
      fontFamily: AppFonts.semiBold,
      fontWeight: '700',
      lineHeight: 21,
    },
    praiseRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    praiseTag: {
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },
    praiseTagText: {
      color: theme.colors.primary,
      fontSize: 10,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    categorySummary: {
      backgroundColor: theme.colors.softCard,
      borderRadius: 15,
      gap: 6,
      padding: 10,
    },
    categorySummaryRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'space-between',
    },
    categorySummaryLabel: {
      color: theme.colors.textSecondary,
      flex: 1,
      fontSize: 10,
      fontFamily: AppFonts.bold,
      fontWeight: '800',
    },
    categorySummaryValue: {
      color: theme.colors.primary,
      fontSize: 10,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    responseCard: {
      backgroundColor: dark ? '#10271D' : '#FFF8EF',
      borderColor: theme.colors.border,
      borderLeftColor: theme.colors.primary,
      borderLeftWidth: 4,
      borderRadius: 15,
      borderWidth: 1,
      gap: 5,
      padding: 12,
    },
    responseEyebrow: {
      color: theme.colors.primary,
      fontSize: 9,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    responseText: {
      color: theme.colors.text,
      fontSize: 12,
      fontFamily: AppFonts.semiBold,
      fontWeight: '700',
      lineHeight: 19,
    },
    responseDate: {
      color: theme.colors.muted,
      fontSize: 9,
      fontFamily: AppFonts.semiBold,
      fontWeight: '700',
    },
    responseForm: {
      gap: 9,
    },
    responseInput: {
      backgroundColor: theme.colors.input,
      borderColor: theme.colors.border,
      borderRadius: 17,
      borderWidth: 1,
      color: theme.colors.inputText,
      fontSize: 13,
      fontFamily: AppFonts.semiBold,
      fontWeight: '700',
      lineHeight: 20,
      minHeight: 105,
      padding: 12,
    },
    buttonRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    reportButton: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      flexDirection: 'row',
      gap: 6,
      paddingVertical: 5,
    },
    reportButtonText: {
      color: theme.colors.textSecondary,
      fontSize: 10,
      fontFamily: AppFonts.bold,
      fontWeight: '800',
    },
    emptyState: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 23,
      borderStyle: 'dashed',
      borderWidth: 1,
      gap: 8,
      padding: 24,
    },
    emptyTitle: {
      color: theme.colors.text,
      fontSize: 17,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
      textAlign: 'center',
    },
    emptyText: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      fontFamily: AppFonts.semiBold,
      fontWeight: '700',
      lineHeight: 20,
      textAlign: 'center',
    },
    supportCard: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.borderStrong,
      borderRadius: 24,
      borderWidth: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      padding: 16,
    },
    supportIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderRadius: 16,
      height: 46,
      justifyContent: 'center',
      width: 46,
    },
    supportCopy: {
      flex: 1,
      gap: 4,
      minWidth: 190,
    },
    supportTitle: {
      color: theme.colors.text,
      fontSize: 16,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    supportButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 4,
      minHeight: 40,
      paddingHorizontal: 12,
    },
    supportButtonText: {
      color: theme.colors.primary,
      fontSize: 11,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    buttonStack: {
      gap: 9,
    },
    bottomDock: {
      backgroundColor: dark ? '#0B1510' : '#0F4D38',
      borderColor: dark ? '#23372C' : '#DCEFE6',
      borderRadius: 27,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 4,
      padding: 7,
    },
    dockButton: {
      alignItems: 'center',
      borderRadius: 18,
      flex: 1,
      paddingHorizontal: 5,
      paddingVertical: 11,
    },
    dockButtonPressed: {
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    dockText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontFamily: AppFonts.extraBold,
      fontWeight: '900',
    },
    bottomNav: {
      alignItems: 'center',
      backgroundColor: theme.colors.elevatedCard,
      borderColor: theme.colors.border,
      borderRadius: 22,
      borderWidth: 1,
      bottom: 12,
      flexDirection: 'row',
      left: 12,
      paddingHorizontal: 6,
      paddingVertical: 8,
      position: 'absolute',
      right: 12,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: dark ? 0.22 : 0.08,
      shadowRadius: 10,
    },
    bottomNavItem: {
      alignItems: 'center',
      flex: 1,
      gap: 3,
      justifyContent: 'center',
      minHeight: 49,
    },
    bottomNavText: {
      color: theme.colors.textSecondary,
      fontFamily: AppFonts.bold,
      fontSize: 8,
    },
    bottomNavTextActive: {
      color: theme.colors.primary,
    },
    homeIndicator: {
      alignSelf: 'center',
      backgroundColor: dark ? '#E7EFEA' : '#101612',
      borderRadius: 999,
      bottom: 2,
      height: 4,
      position: 'absolute',
      width: 116,
    },
  });
}