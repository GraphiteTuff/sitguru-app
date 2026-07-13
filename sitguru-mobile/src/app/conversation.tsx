import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  CircleDollarSign,
  ImagePlus,
  MapPin,
  MessageCircle,
  PawPrint,
  Send,
  Sparkles,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SitGuruIcon } from '@/components/SitGuruIcon';
import SitGuruRoleStatus from '@/components/SitGuruRoleStatus';
import SitGuruScreen from '@/components/SitGuruScreen';
import SitGuruWorkspaceSwitcher from '@/components/SitGuruWorkspaceSwitcher';
import { AppFonts } from '@/constants/fonts';
import { getWorkspaceDashboardPath, LAST_WORKSPACE_KEY } from '@/constants/workspaces';
import {
  setThemePreference,
  useThemePreference,
  type SitGuruThemePreference,
} from '@/hooks/use-color-scheme';
import { useThemeMode } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { resolveSupabaseStorageUrl } from '@/lib/storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { normalizeRole, type AppRole } from '@/types/auth';

type RecordRow = Record<string, unknown>;

type ConversationRow = {
  id: string;
  customer_id?: string | null;
  guru_id?: string | null;
  subject?: string | null;
  status?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  last_message_at?: string | null;
  last_message_preview?: string | null;
};

type MessageRow = {
  id: string;
  conversation_id?: string | null;
  sender_id?: string | null;
  recipient_id?: string | null;
  content?: string | null;
  body?: string | null;
  message?: string | null;
  created_at?: string | null;
};

type ProfileRow = {
  id: string;
  full_name?: string | null;
  display_name?: string | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  role?: string | null;
  account_type?: string | null;
  profile_photo_url?: string | null;
  profile_image_url?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
  photo_url?: string | null;
};

type BookingContext = {
  id: string | null;
  petId: string | null;
  petName: string;
  petPhotoUrl: string | null;
  service: string;
  dateLabel: string;
  timeLabel: string;
  locationLabel: string;
  statusLabel: string;
  paymentLabel: string;
};

type UiMessage = {
  id: string;
  conversationId: string | null;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
  delivery: 'sent' | 'preview';
};

type NoticeTone = 'success' | 'warning' | 'error' | 'info';

type NoticeState = {
  tone: NoticeTone;
  text: string;
} | null;

type RealtimeState = 'connecting' | 'live' | 'offline' | 'preview';

const THEME_OPTIONS: Array<{
  label: string;
  value: SitGuruThemePreference;
  icon: 'sun' | 'moon';
}> = [
  { label: 'Light', value: 'light', icon: 'sun' },
  { label: 'Dark', value: 'dark', icon: 'moon' },
];

const QUICK_REPLIES = [
  'What dates do you need?',
  'Can you share pet details?',
  'I am available.',
  'Please send a booking request.',
  'That schedule works for me.',
];

const PROFILE_SELECT =
  'id, full_name, display_name, name, first_name, last_name, email, role, account_type, profile_photo_url, profile_image_url, avatar_url, image_url, photo_url';

const PET_TABLES = ['pets', 'pet_profiles', 'pet_passports'];
const PET_OWNER_FIELDS = ['owner_id', 'pet_parent_id', 'user_id', 'created_by'];

const PREVIEW_MESSAGES: UiMessage[] = [
  {
    id: 'preview-1',
    conversationId: null,
    senderId: 'preview-parent',
    recipientId: 'preview-guru',
    body: 'Hi! I am looking for dog walking help next week around lunchtime.',
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    delivery: 'preview',
  },
  {
    id: 'preview-2',
    conversationId: null,
    senderId: 'preview-guru',
    recipientId: 'preview-parent',
    body: 'Thanks for reaching out. I can usually help with lunchtime walks. What ZIP code is care needed in?',
    createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    delivery: 'preview',
  },
  {
    id: 'preview-3',
    conversationId: null,
    senderId: 'preview-parent',
    recipientId: 'preview-guru',
    body: 'The care ZIP is 18951. Scout is friendly and usually walks for about 30 minutes.',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    delivery: 'preview',
  },
];

const FALLBACK_BOOKING_CONTEXT: BookingContext = {
  id: null,
  petId: null,
  petName: 'Scout',
  petPhotoUrl: null,
  service: 'Dog Walking',
  dateLabel: 'Schedule not selected',
  timeLabel: 'Flexible',
  locationLabel: 'Care location shared after booking',
  statusLabel: 'Care question',
  paymentLabel: 'No payment due',
};

function firstString(record: RecordRow | null | undefined, keys: string[]) {
  if (!record) return '';

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }

  return '';
}

function normalizeRole(value?: string | null) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();

  if (normalized === 'provider' || normalized === 'sitter' || normalized === 'pet_guru') {
    return 'guru';
  }

  if (normalized === 'customer' || normalized === 'pet parent' || normalized === 'pet-parent') {
    return 'pet_parent';
  }

  return normalized;
}

function profileName(profile?: ProfileRow | null, fallback = 'SitGuru User') {
  if (!profile) return fallback;

  return (
    profile.full_name?.trim() ||
    profile.display_name?.trim() ||
    profile.name?.trim() ||
    [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() ||
    profile.email?.split('@')[0] ||
    fallback
  );
}

function profileAvatar(profile?: ProfileRow | null) {
  if (!profile) return null;

  return resolveSupabaseStorageUrl(
    profile.profile_photo_url ||
      profile.profile_image_url ||
      profile.avatar_url ||
      profile.image_url ||
      profile.photo_url ||
      null,
  );
}

function initials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return 'SG';
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

function messageBody(row: MessageRow) {
  return row.content?.trim() || row.body?.trim() || row.message?.trim() || '';
}

function normalizeMessage(row: MessageRow): UiMessage | null {
  const body = messageBody(row);
  if (!row.id || !body) return null;

  return {
    id: String(row.id),
    conversationId: row.conversation_id ? String(row.conversation_id) : null,
    senderId: String(row.sender_id ?? ''),
    recipientId: String(row.recipient_id ?? ''),
    body,
    createdAt: row.created_at || new Date().toISOString(),
    delivery: 'sent',
  };
}

function mergeMessages(current: UiMessage[], incoming: UiMessage[]) {
  const byId = new Map<string, UiMessage>();

  [...current, ...incoming].forEach((message) => {
    byId.set(message.id, message);
  });

  return Array.from(byId.values()).sort(
    (first, second) =>
      new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime(),
  );
}

function formatMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDayLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;

  if (dateKey === todayKey) return 'Today';
  if (dateKey === yesterdayKey) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

function formatBookingDate(row: RecordRow) {
  const rawDate = firstString(row, [
    'start_time',
    'start_date',
    'booking_date',
    'scheduled_at',
    'date',
  ]);

  if (!rawDate) return 'Schedule not selected';

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return rawDate;

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatBookingTime(row: RecordRow) {
  const rawDate = firstString(row, ['start_time', 'scheduled_at']);
  const explicit = firstString(row, ['time', 'start_time_label', 'preferred_time']);

  if (explicit && !explicit.includes('T')) return explicit;
  if (!rawDate) return explicit || 'Flexible';

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return explicit || 'Flexible';

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getFallbackRole(primaryRole: AppRole | null, roles: AppRole[]): AppRole {
  if (primaryRole && roles.includes(primaryRole)) return primaryRole;
  if (roles.includes('pet_parent')) return 'pet_parent';
  if (roles.includes('guru')) return 'guru';
  if (roles.includes('ambassador')) return 'ambassador';
  if (roles.includes('admin')) return 'admin';
  return primaryRole ?? 'pet_parent';
}

function roleIsAvailable(role: AppRole, roles: AppRole[]) {
  return roles.length === 0 || roles.includes(role);
}

async function loadProfileRows(ids: string[]) {
  const cleanIds = Array.from(new Set(ids.filter(Boolean)));
  if (!cleanIds.length) return [] as ProfileRow[];

  // Select the complete profile row first. This is more tolerant of the
  // different profile schemas used by the website and mobile app because it
  // does not fail when an optional avatar or display-name column is absent.
  const preferred = await supabase.from('profiles').select('*').in('id', cleanIds);
  if (!preferred.error && preferred.data) return preferred.data as ProfileRow[];

  const fallback = await supabase
    .from('profiles')
    .select('id, full_name, first_name, last_name, email, role, avatar_url')
    .in('id', cleanIds);

  return !fallback.error && fallback.data ? (fallback.data as ProfileRow[]) : [];
}

async function loadLatestConversationForUser(userId: string) {
  const byCustomer = await supabase
    .from('conversations')
    .select('*')
    .eq('customer_id', userId)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (!byCustomer.error && byCustomer.data) return byCustomer.data as ConversationRow;

  const byGuru = await supabase
    .from('conversations')
    .select('*')
    .eq('guru_id', userId)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  return !byGuru.error && byGuru.data ? (byGuru.data as ConversationRow) : null;
}

async function findConversationWithOtherUser({
  userId,
  otherUserId,
  currentRole,
}: {
  userId: string;
  otherUserId: string;
  currentRole: AppRole;
}) {
  const userIsGuru = currentRole === 'guru';
  const customerId = userIsGuru ? otherUserId : userId;
  const guruId = userIsGuru ? userId : otherUserId;

  const result = await supabase
    .from('conversations')
    .select('*')
    .eq('customer_id', customerId)
    .eq('guru_id', guruId)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  return !result.error && result.data ? (result.data as ConversationRow) : null;
}

async function createConversation({
  userId,
  otherUserId,
  currentRole,
  subject,
}: {
  userId: string;
  otherUserId: string;
  currentRole: AppRole;
  subject: string;
}) {
  const userIsGuru = currentRole === 'guru';
  const now = new Date().toISOString();
  const payload = {
    customer_id: userIsGuru ? otherUserId : userId,
    guru_id: userIsGuru ? userId : otherUserId,
    subject,
    status: 'open',
    created_at: now,
    updated_at: now,
    last_message_at: now,
  };

  const result = await supabase.from('conversations').insert(payload).select('*').single();
  return !result.error && result.data ? (result.data as ConversationRow) : null;
}

async function loadConversationMessages(conversationId: string) {
  const result = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(250);

  if (result.error) throw result.error;

  return ((result.data ?? []) as MessageRow[])
    .map(normalizeMessage)
    .filter((message): message is UiMessage => Boolean(message));
}

async function insertMessageWithFallback({
  conversationId,
  senderId,
  recipientId,
  body,
}: {
  conversationId: string;
  senderId: string;
  recipientId: string;
  body: string;
}) {
  const createdAt = new Date().toISOString();
  const payloads: RecordRow[] = [
    {
      conversation_id: conversationId,
      sender_id: senderId,
      recipient_id: recipientId || null,
      content: body,
      body,
      created_at: createdAt,
    },
    {
      conversation_id: conversationId,
      sender_id: senderId,
      recipient_id: recipientId || null,
      content: body,
      created_at: createdAt,
    },
    {
      conversation_id: conversationId,
      sender_id: senderId,
      recipient_id: recipientId || null,
      body,
      created_at: createdAt,
    },
  ];

  let lastError: Error | null = null;

  for (const payload of payloads) {
    const result = await supabase.from('messages').insert(payload).select('*').single();

    if (!result.error && result.data) {
      return result.data as MessageRow;
    }

    lastError = new Error(result.error?.message || 'Unable to send message.');
  }

  throw lastError ?? new Error('Unable to send message.');
}

async function updateConversationPreview(conversationId: string, body: string) {
  const now = new Date().toISOString();

  await supabase
    .from('conversations')
    .update({
      last_message_at: now,
      last_message_preview: body.slice(0, 180),
      updated_at: now,
    })
    .eq('id', conversationId);
}

async function loadBookingContext({
  bookingId,
  conversationId,
  petId,
  petName,
  userId,
}: {
  bookingId: string;
  conversationId: string;
  petId: string;
  petName: string;
  userId: string;
}): Promise<BookingContext> {
  let booking: RecordRow | null = null;

  if (bookingId) {
    const result = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle();
    if (!result.error && result.data) booking = result.data as RecordRow;
  }

  if (!booking && conversationId) {
    const result = await supabase
      .from('bookings')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!result.error && result.data) booking = result.data as RecordRow;
  }

  const requestedPetId =
    petId || firstString(booking, ['pet_id', 'pet_profile_id', 'pet_passport_id']);
  const requestedPetName =
    petName || firstString(booking, ['pet_name', 'animal_name']) || FALLBACK_BOOKING_CONTEXT.petName;

  const pet = await loadPetContext({
    userId,
    petId: requestedPetId,
    petName: requestedPetName,
  });

  if (!booking) {
    return {
      ...FALLBACK_BOOKING_CONTEXT,
      petId: pet.id,
      petName: pet.name,
      petPhotoUrl: pet.photoUrl,
    };
  }

  const service =
    firstString(booking, ['service', 'service_type', 'booking_type', 'service_name']) ||
    'Pet Care';
  const location =
    firstString(booking, [
      'service_location',
      'location',
      'city_state',
      'service_area',
      'zip_code',
      'postal_code',
    ]) || 'Care location shared securely';
  const status =
    firstString(booking, ['booking_status', 'status', 'request_status']) || 'Care question';
  const payment =
    firstString(booking, ['payment_status']) || 'Payment after Guru accepts';

  return {
    id: firstString(booking, ['id']) || bookingId || null,
    petId: pet.id,
    petName: pet.name,
    petPhotoUrl: pet.photoUrl,
    service,
    dateLabel: formatBookingDate(booking),
    timeLabel: formatBookingTime(booking),
    locationLabel: location,
    statusLabel: status,
    paymentLabel: payment,
  };
}

async function loadPetContext({
  userId,
  petId,
  petName,
}: {
  userId: string;
  petId: string;
  petName: string;
}) {
  const cleanName = petName.trim().toLowerCase();

  for (const table of PET_TABLES) {
    for (const ownerField of PET_OWNER_FIELDS) {
      const result = await supabase
        .from(table)
        .select('*')
        .eq(ownerField, userId)
        .limit(30);

      if (result.error || !result.data?.length) continue;

      const rows = result.data as RecordRow[];
      const match =
        rows.find((row) => firstString(row, ['id', 'pet_id']) === petId) ||
        rows.find(
          (row) =>
            firstString(row, ['name', 'pet_name', 'animal_name']).toLowerCase() === cleanName,
        ) ||
        rows.find(
          (row) => firstString(row, ['name', 'pet_name', 'animal_name']).toLowerCase() === 'scout',
        ) ||
        rows[0];

      const name = firstString(match, ['name', 'pet_name', 'animal_name']) || petName || 'Pet';
      const photo = resolveSupabaseStorageUrl(
        firstString(match, [
          'photo_url',
          'image_url',
          'avatar_url',
          'pet_photo_url',
          'profile_photo_url',
        ]),
      );

      return {
        id: firstString(match, ['id', 'pet_id']) || petId || null,
        name,
        photoUrl: photo,
      };
    }
  }

  return {
    id: petId || null,
    name: petName || 'Scout',
    photoUrl: null,
  };
}

export default function ConversationScreen() {
  const params = useLocalSearchParams<{
    conversationId?: string;
    guruId?: string;
    recipientId?: string;
    bookingId?: string;
    petId?: string;
    petName?: string;
    guruName?: string;
    subject?: string;
    viewerRole?: string;
  }>();
  const { user, profile, roles, primaryRole, loading: authLoading } = useAuth();
  const isWebPreview = Platform.OS === 'web';
  const themeMode = useThemeMode();
  const themePreference = useThemePreference();
  const isDark = themeMode === 'dark';
  const palette = getPalette(isDark);
  const styles = createStyles(isDark);
  const threadRef = useRef<ScrollView | null>(null);

  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false);
  const [contextExpanded, setContextExpanded] = useState(true);
  const [draftMessage, setDraftMessage] = useState('');
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [conversation, setConversation] = useState<ConversationRow | null>(null);
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({});
  const [bookingContext, setBookingContext] =
    useState<BookingContext>(FALLBACK_BOOKING_CONTEXT);
  const [loadingThread, setLoadingThread] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [realtimeState, setRealtimeState] = useState<RealtimeState>('connecting');
  const [previewMode, setPreviewMode] = useState(false);

  const requestedViewerRole = normalizeRole(
    typeof params.viewerRole === 'string' ? params.viewerRole : undefined,
  );
  const [activeWorkspaceRole, setActiveWorkspaceRole] =
    useState<AppRole | null>(requestedViewerRole ?? null);

  useEffect(() => {
    let active = true;

    async function resolveWorkspaceRole() {
      if (
        requestedViewerRole &&
        roleIsAvailable(requestedViewerRole, roles)
      ) {
        if (active) setActiveWorkspaceRole(requestedViewerRole);
        return;
      }

      try {
        const savedRole = normalizeRole(
          await AsyncStorage.getItem(LAST_WORKSPACE_KEY),
        );

        if (savedRole && roleIsAvailable(savedRole, roles)) {
          if (active) setActiveWorkspaceRole(savedRole);
          return;
        }
      } catch {
        // The active route and authenticated roles still provide a safe fallback.
      }

      if (active) {
        setActiveWorkspaceRole(getFallbackRole(primaryRole, roles));
      }
    }

    void resolveWorkspaceRole();

    return () => {
      active = false;
    };
  }, [primaryRole, requestedViewerRole, roles]);

  const currentRole =
    activeWorkspaceRole ?? getFallbackRole(primaryRole, roles);
  const currentUserId = user?.id ?? '';
  const requestedConversationId = typeof params.conversationId === 'string' ? params.conversationId : '';
  const requestedOtherUserId =
    (typeof params.recipientId === 'string' ? params.recipientId : '') ||
    (typeof params.guruId === 'string' ? params.guruId : '');
  const requestedBookingId = typeof params.bookingId === 'string' ? params.bookingId : '';
  const requestedPetId = typeof params.petId === 'string' ? params.petId : '';
  const requestedPetName = typeof params.petName === 'string' ? params.petName : '';
  const requestedGuruName = typeof params.guruName === 'string' ? params.guruName : '';
  const requestedSubject =
    (typeof params.subject === 'string' ? params.subject : '') ||
    `${requestedPetName || 'Pet'} care conversation`;

  const profileRecord = (profile ?? {}) as RecordRow;
  const metadata = (user?.user_metadata ?? {}) as RecordRow;
  const currentUserName =
    firstString(profileRecord, ['full_name', 'display_name']) ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() ||
    firstString(metadata, ['full_name', 'name', 'first_name']) ||
    user?.email?.split('@')[0] ||
    'You';
  const currentUserAvatar = resolveSupabaseStorageUrl(
    firstString(profileRecord, [
      'avatar_url',
      'photo_url',
      'profile_photo_url',
      'profile_image_url',
      'image_url',
    ]) || firstString(metadata, ['avatar_url', 'picture']),
  );
  const currentUserFirstName =
    firstString(profileRecord, ['first_name']) ||
    firstString(metadata, ['first_name']) ||
    currentUserName.split(/\s+/)[0] ||
    currentUserName;

  const participantIds = useMemo(() => {
    if (!conversation) return [] as string[];
    return [conversation.customer_id ?? '', conversation.guru_id ?? ''].filter(Boolean);
  }, [conversation]);

  // A legacy website conversation can store a participant/profile id that is
  // different from the active auth user id. Resolve participants by role first
  // so a signed-in Pet Parent is never mistaken for the other person.
  const currentConversationParticipantId = useMemo(() => {
    if (!conversation) return '';
    return currentRole === 'guru'
      ? conversation.guru_id ?? ''
      : conversation.customer_id ?? '';
  }, [conversation, currentRole]);

  const otherUserId = useMemo(() => {
    if (requestedOtherUserId && requestedOtherUserId !== currentUserId) {
      return requestedOtherUserId;
    }

    if (conversation) {
      const roleBasedOtherId =
        currentRole === 'guru'
          ? conversation.customer_id ?? ''
          : conversation.guru_id ?? '';

      if (roleBasedOtherId && roleBasedOtherId !== currentUserId) {
        return roleBasedOtherId;
      }
    }

    return (
      participantIds.find(
        (id) =>
          id !== currentUserId &&
          id !== currentConversationParticipantId,
      ) || ''
    );
  }, [
    conversation,
    currentConversationParticipantId,
    currentRole,
    currentUserId,
    participantIds,
    requestedOtherUserId,
  ]);

  const currentSenderIds = useMemo(
    () =>
      new Set(
        [currentUserId, currentConversationParticipantId].filter(Boolean),
      ),
    [currentConversationParticipantId, currentUserId],
  );

  const otherProfile = profiles[otherUserId] ?? null;
  const hasResolvedOtherUser = Boolean(otherUserId || requestedGuruName || otherProfile);
  const useCurrentUserAsHeaderFallback = !hasResolvedOtherUser;
  const otherName = useCurrentUserAsHeaderFallback
    ? currentUserFirstName
    : profileName(
        otherProfile,
        requestedGuruName ||
          (currentRole === 'pet_parent' ? 'Pet Care Guru' : 'Pet Parent'),
      );
  const otherAvatar = useCurrentUserAsHeaderFallback
    ? currentUserAvatar
    : profileAvatar(otherProfile);
  const otherRole = useCurrentUserAsHeaderFallback
    ? currentRole
    : normalizeRole(otherProfile?.role || otherProfile?.account_type) ||
      (currentRole === 'pet_parent' ? 'guru' : 'pet_parent');
  const otherRoleLabel =
    otherRole === 'guru'
      ? 'Pet Care Guru'
      : otherRole === 'admin'
        ? 'SitGuru Support'
        : otherRole === 'ambassador'
          ? 'SitGuru Ambassador'
          : 'Pet Parent';
  const currentRoleLabel =
    currentRole === 'guru'
      ? 'Pet Care Guru'
      : currentRole === 'admin'
        ? 'SitGuru Support'
        : currentRole === 'ambassador'
          ? 'SitGuru Ambassador'
          : 'Pet Parent';

  const profileBySenderId = useMemo(() => {
    const map = { ...profiles };

    const currentProfileAlias: ProfileRow = {
      id: currentUserId || currentConversationParticipantId,
      full_name: currentUserFirstName,
      first_name: currentUserFirstName,
      avatar_url: currentUserAvatar,
      role: currentRole,
    };

    if (currentUserId) {
      map[currentUserId] = {
        ...(map[currentUserId] ?? {}),
        ...currentProfileAlias,
        id: currentUserId,
      };
    }

    if (currentConversationParticipantId) {
      map[currentConversationParticipantId] = {
        ...(map[currentConversationParticipantId] ?? {}),
        ...currentProfileAlias,
        id: currentConversationParticipantId,
      };
    }

    if (previewMode) {
      map['preview-parent'] = {
        id: 'preview-parent',
        full_name: 'Pet Parent',
        role: 'pet_parent',
      };
      map['preview-guru'] = {
        id: 'preview-guru',
        full_name: 'Local Guru',
        role: 'guru',
      };
    }

    return map;
  }, [
    currentConversationParticipantId,
    currentRole,
    currentUserAvatar,
    currentUserFirstName,
    currentUserId,
    previewMode,
    profiles,
  ]);

  const loadThread = useCallback(async () => {
    if (authLoading) return;

    if (!isSupabaseConfigured || !currentUserId) {
      setPreviewMode(true);
      setMessages(PREVIEW_MESSAGES);
      setRealtimeState('preview');
      setLoadingThread(false);
      setNotice({
        tone: 'warning',
        text: currentUserId
          ? 'Messaging is not configured in this build. Messages on this screen are preview-only and are not saved.'
          : 'Sign in to open a real SitGuru conversation. Messages shown here are preview-only and are not saved.',
      });
      return;
    }

    setLoadingThread(true);
    setNotice(null);
    setPreviewMode(false);
    setRealtimeState('connecting');

    try {
      let nextConversation: ConversationRow | null = null;

      if (requestedConversationId) {
        const result = await supabase
          .from('conversations')
          .select('*')
          .eq('id', requestedConversationId)
          .maybeSingle();

        if (!result.error && result.data) nextConversation = result.data as ConversationRow;
      }

      if (!nextConversation && requestedOtherUserId) {
        nextConversation = await findConversationWithOtherUser({
          userId: currentUserId,
          otherUserId: requestedOtherUserId,
          currentRole,
        });
      }

      if (!nextConversation && requestedOtherUserId) {
        nextConversation = await createConversation({
          userId: currentUserId,
          otherUserId: requestedOtherUserId,
          currentRole,
          subject: requestedSubject,
        });
      }

      if (!nextConversation) {
        nextConversation = await loadLatestConversationForUser(currentUserId);
      }

      if (!nextConversation) {
        setConversation(null);
        setMessages([]);
        setRealtimeState('offline');
        setNotice({
          tone: 'info',
          text: 'No conversation is open yet. Start from a Guru profile or booking to create a secure thread.',
        });
        return;
      }

      setConversation(nextConversation);

      const nextProfiles = await loadProfileRows([
        nextConversation.customer_id ?? '',
        nextConversation.guru_id ?? '',
      ]);
      const nextProfileMap: Record<string, ProfileRow> = {};
      nextProfiles.forEach((row) => {
        nextProfileMap[row.id] = row;
      });
      setProfiles(nextProfileMap);

      const nextMessages = await loadConversationMessages(nextConversation.id);
      setMessages(nextMessages);

      const nextBookingContext = await loadBookingContext({
        bookingId: requestedBookingId,
        conversationId: nextConversation.id,
        petId: requestedPetId,
        petName: requestedPetName,
        userId: currentUserId,
      });
      setBookingContext(nextBookingContext);
    } catch (error) {
      setRealtimeState('offline');
      setNotice({
        tone: 'error',
        text:
          error instanceof Error
            ? `SitGuru could not load this conversation: ${error.message}`
            : 'SitGuru could not load this conversation.',
      });
    } finally {
      setLoadingThread(false);
    }
  }, [
    authLoading,
    currentRole,
    currentUserId,
    requestedBookingId,
    requestedConversationId,
    requestedOtherUserId,
    requestedPetId,
    requestedPetName,
    requestedSubject,
  ]);

  useEffect(() => {
    void loadThread();
  }, [loadThread]);

  useEffect(() => {
    if (!conversation?.id || !isSupabaseConfigured || previewMode) return undefined;

    let active = true;
    const channelName = `sitguru-conversation-${conversation.id}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          if (!active) return;
          const nextMessage = normalizeMessage(payload.new as MessageRow);
          if (!nextMessage) return;
          setMessages((current) => mergeMessages(current, [nextMessage]));
        },
      )
      .subscribe((status) => {
        if (!active) return;

        if (status === 'SUBSCRIBED') setRealtimeState('live');
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setRealtimeState('offline');
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [conversation?.id, previewMode]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      threadRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timeout);
  }, [messages.length]);

  async function sendMessage() {
    const cleanMessage = draftMessage.trim();

    if (!cleanMessage) {
      setNotice({ tone: 'warning', text: 'Type a message before sending.' });
      return;
    }

    if (previewMode || !currentUserId || !conversation?.id) {
      const localMessage: UiMessage = {
        id: `preview-local-${Date.now()}`,
        conversationId: conversation?.id ?? null,
        senderId: currentUserId || 'preview-parent',
        recipientId: otherUserId || 'preview-guru',
        body: cleanMessage,
        createdAt: new Date().toISOString(),
        delivery: 'preview',
      };

      setMessages((current) => mergeMessages(current, [localMessage]));
      setDraftMessage('');
      setNotice({
        tone: 'warning',
        text: 'Message added to this preview only. It was not saved or sent to another user.',
      });
      return;
    }

    setSending(true);
    setNotice(null);

    try {
      const insertedRow = await insertMessageWithFallback({
        conversationId: conversation.id,
        senderId: currentUserId,
        recipientId: otherUserId,
        body: cleanMessage,
      });
      const insertedMessage = normalizeMessage(insertedRow);

      if (insertedMessage) {
        setMessages((current) => mergeMessages(current, [insertedMessage]));
      }

      await updateConversationPreview(conversation.id, cleanMessage);
      setDraftMessage('');
      setNotice({ tone: 'success', text: 'Message sent.' });
    } catch (error) {
      setNotice({
        tone: 'error',
        text:
          error instanceof Error
            ? `Message was not sent: ${error.message}`
            : 'Message was not sent. Please try again.',
      });
    } finally {
      setSending(false);
    }
  }

  function handleQuickReply(reply: string) {
    setDraftMessage(reply);
    setNotice(null);
  }

  function handleAttachment() {
    setNotice({
      tone: 'warning',
      text: 'Attachment upload is not connected yet. No file was selected or sent.',
    });
  }

  function openRequestCare() {
    router.push({
      pathname: '/request-booking',
      params: {
        ...(otherUserId ? { guruId: otherUserId } : {}),
        ...(conversation?.id ? { conversationId: conversation.id } : {}),
        ...(bookingContext.petId ? { petId: bookingContext.petId } : {}),
        ...(bookingContext.petName ? { petName: bookingContext.petName } : {}),
        viewerRole: currentRole,
      },
    });
  }

  function openBookingDetails() {
    router.push({
      pathname: '/booking-details',
      params: {
        ...(bookingContext.id ? { bookingId: bookingContext.id } : {}),
        ...(conversation?.id ? { conversationId: conversation.id } : {}),
        ...(bookingContext.petId ? { petId: bookingContext.petId } : {}),
        ...(bookingContext.petName ? { petName: bookingContext.petName } : {}),
        viewerRole: currentRole,
      },
    });
  }

  function openHeaderProfile() {
    router.push('/account');
  }

  const realtimeLabel =
    realtimeState === 'live'
      ? 'Live'
      : realtimeState === 'connecting'
        ? 'Connecting'
        : realtimeState === 'preview'
          ? 'Preview'
          : 'Offline';

  const realtimeDotStyle =
    realtimeState === 'live'
      ? styles.connectionDotLive
      : realtimeState === 'connecting'
        ? styles.connectionDotConnecting
        : styles.connectionDotOffline;

  const latestOwnMessageId = [...messages]
    .reverse()
    .find((message) => currentSenderIds.has(message.senderId))?.id;

  const navigationIsGuru = currentRole === 'guru';
  const navigationIsPetParent = currentRole === 'pet_parent';
  const workspaceHomeRoute = getWorkspaceDashboardPath(currentRole);
  const secondaryRoute = navigationIsGuru
    ? '/guru-requests'
    : navigationIsPetParent
      ? '/find-care'
      : workspaceHomeRoute;
  const secondaryLabel = navigationIsGuru
    ? 'Requests'
    : navigationIsPetParent
      ? 'Find Care'
      : currentRole === 'ambassador'
        ? 'Ambassador'
        : 'Operations';
  const fourthRoute = navigationIsGuru
    ? '/payments'
    : navigationIsPetParent
      ? '/booking-details'
      : workspaceHomeRoute;
  const fourthLabel = navigationIsGuru
    ? 'Earnings'
    : navigationIsPetParent
      ? 'Bookings'
      : currentRole === 'ambassador'
        ? 'Referrals'
        : 'Admin';

  return (
    <SitGuruScreen center={isWebPreview} maxWidth={620}>
      <View style={[styles.previewCanvas, !isWebPreview && styles.previewCanvasNative]}>
        <View style={[styles.deviceFrame, !isWebPreview && styles.deviceFrameNative]}>
          {isWebPreview ? <View style={styles.deviceTopSpeaker} /> : null}

          <View style={[styles.phoneShell, !isWebPreview && styles.phoneShellNative]}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 4 : 0}
              style={styles.keyboardView}
            >
              {isWebPreview ? <PhoneStatusBar palette={palette} styles={styles} /> : null}

              <View style={styles.header}>
                <Pressable
                  accessibilityLabel="Go back"
                  accessibilityRole="button"
                  onPress={() => router.back()}
                  style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
                >
                  <ChevronLeft color={palette.title} size={20} strokeWidth={2.6} />
                </Pressable>

                <Pressable
                  accessibilityLabel={`Open my ${currentRoleLabel} profile`}
                  accessibilityRole="button"
                  onPress={openHeaderProfile}
                  style={styles.headerIdentity}
                >
                  <ProfileAvatar
                    fallbackName={currentUserFirstName}
                    size="header"
                    uri={currentUserAvatar}
                    isDark={isDark}
                    styles={styles}
                  />

                  <View style={styles.headerCopy}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                      {currentUserFirstName}
                    </Text>
                    <SitGuruRoleStatus
                      compact
                      role={currentRole}
                      statusLabel={realtimeLabel}
                    />
                  </View>
                </Pressable>

                <View style={styles.headerActions}>
                  <View style={styles.modeToggle}>
                    {THEME_OPTIONS.map((option) => {
                      const active = themePreference === option.value;

                      return (
                        <Pressable
                          key={option.value}
                          accessibilityLabel={`Switch to ${option.label} mode`}
                          accessibilityRole="button"
                          onPress={() => setThemePreference(option.value)}
                          style={[styles.modeButton, active && styles.modeButtonActive]}
                        >
                          <SitGuruIcon
                            color={
                              active
                                ? option.value === 'light'
                                  ? '#F3A61D'
                                  : '#F0CF62'
                                : palette.muted
                            }
                            name={option.icon}
                            size={14}
                            strokeWidth={2.4}
                          />
                        </Pressable>
                      );
                    })}
                  </View>

                  <Pressable
                    accessibilityLabel="Open notifications"
                    accessibilityRole="button"
                    onPress={() => router.push('/notifications')}
                    style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
                  >
                    <Bell color={palette.title} size={18} strokeWidth={2.4} />
                  </Pressable>

                  <Pressable
                    accessibilityLabel="Open workspace switcher"
                    accessibilityRole="button"
                    onPress={() => setWorkspaceSwitcherOpen(true)}
                    style={styles.profileButton}
                  >
                    <ProfileAvatar
                      fallbackName={currentUserName}
                      size="header"
                      uri={currentUserAvatar}
                      isDark={isDark}
                      styles={styles}
                    />
                  </Pressable>
                </View>
              </View>

              <View style={styles.body}>
                <View style={styles.contextCard}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setContextExpanded((current) => !current)}
                    style={styles.contextTop}
                  >
                    <PetAvatar
                      name={bookingContext.petName}
                      uri={bookingContext.petPhotoUrl}
                      isDark={isDark}
                      styles={styles}
                    />

                    <View style={styles.contextPrimaryCopy}>
                      <View style={styles.contextTitleRow}>
                        <Text style={styles.contextPetName} numberOfLines={1}>
                          {bookingContext.petName}
                        </Text>
                        <View style={styles.contextStatusPill}>
                          <Text style={styles.contextStatusText} numberOfLines={1}>
                            {bookingContext.statusLabel}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.contextService} numberOfLines={1}>
                        {bookingContext.service}
                      </Text>
                      <Text style={styles.contextSchedule} numberOfLines={1}>
                        {bookingContext.dateLabel} • {bookingContext.timeLabel}
                      </Text>
                    </View>

                    {contextExpanded ? (
                      <ChevronUp color={palette.muted} size={19} strokeWidth={2.4} />
                    ) : (
                      <ChevronDown color={palette.muted} size={19} strokeWidth={2.4} />
                    )}
                  </Pressable>

                  {contextExpanded ? (
                    <View style={styles.contextExpanded}>
                      <View style={styles.contextDetailsRow}>
                        <ContextDetail
                          icon={<MapPin color={palette.primary} size={15} strokeWidth={2.4} />}
                          label="Care area"
                          value={bookingContext.locationLabel}
                          styles={styles}
                        />
                        <ContextDetail
                          icon={<CircleDollarSign color={palette.primary} size={15} strokeWidth={2.4} />}
                          label="Payment"
                          value={bookingContext.paymentLabel}
                          styles={styles}
                        />
                      </View>

                      <View style={styles.contextActions}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={openBookingDetails}
                          style={styles.contextSecondaryButton}
                        >
                          <CalendarDays color={palette.primary} size={16} strokeWidth={2.4} />
                          <Text style={styles.contextSecondaryText}>Booking</Text>
                        </Pressable>

                        <Pressable
                          accessibilityRole="button"
                          onPress={openRequestCare}
                          style={styles.contextPrimaryButton}
                        >
                          <PawPrint color="#FFFFFF" size={16} strokeWidth={2.4} />
                          <Text style={styles.contextPrimaryText}>Request Care</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}
                </View>

                {notice ? <NoticeCard notice={notice} styles={styles} /> : null}

                <ScrollView
                  ref={threadRef}
                  contentContainerStyle={styles.messageList}
                  keyboardShouldPersistTaps="handled"
                  onContentSizeChange={() => threadRef.current?.scrollToEnd({ animated: false })}
                  showsVerticalScrollIndicator={false}
                  style={styles.threadScroll}
                >
                  {loadingThread ? (
                    <View style={styles.loadingState}>
                      <ActivityIndicator color={palette.primary} size="small" />
                      <Text style={styles.loadingText}>Loading secure conversation…</Text>
                    </View>
                  ) : messages.length === 0 ? (
                    <View style={styles.emptyState}>
                      <View style={styles.emptyIcon}>
                        <MessageCircle color={palette.primary} size={28} strokeWidth={2.2} />
                      </View>
                      <Text style={styles.emptyTitle}>Start the conversation</Text>
                      <Text style={styles.emptyText}>
                        Ask about availability, routines, care instructions, or booking details. Messages stay connected to this SitGuru care relationship.
                      </Text>
                    </View>
                  ) : (
                    messages.map((message, index) => {
                      const previousMessage = messages[index - 1];
                      const showDay =
                        !previousMessage ||
                        formatDayLabel(previousMessage.createdAt) !== formatDayLabel(message.createdAt);
                      const isOwn =
                        currentSenderIds.has(message.senderId) ||
                        (previewMode && message.senderId === 'preview-parent');
                      const senderProfile = profileBySenderId[message.senderId] ?? null;
                      const senderName = isOwn
                        ? currentUserFirstName
                        : profileName(senderProfile, otherName);
                      const senderAvatar = isOwn
                        ? currentUserAvatar
                        : profileAvatar(senderProfile) || otherAvatar;
                      const showAvatar =
                        !isOwn &&
                        (index === messages.length - 1 || messages[index + 1]?.senderId !== message.senderId);

                      return (
                        <View key={message.id}>
                          {showDay ? (
                            <View style={styles.dayDivider}>
                              <View style={styles.dayLine} />
                              <Text style={styles.dayText}>{formatDayLabel(message.createdAt)}</Text>
                              <View style={styles.dayLine} />
                            </View>
                          ) : null}

                          <View
                            style={[
                              styles.messageRow,
                              isOwn ? styles.messageRowOwn : styles.messageRowOther,
                            ]}
                          >
                            {!isOwn ? (
                              showAvatar ? (
                                <ProfileAvatar
                                  fallbackName={senderName}
                                  size="message"
                                  uri={senderAvatar}
                                  isDark={isDark}
                                  styles={styles}
                                />
                              ) : (
                                <View style={styles.messageAvatarSpacer} />
                              )
                            ) : null}

                            <View
                              style={[
                                styles.messageGroup,
                                isOwn ? styles.messageGroupOwn : styles.messageGroupOther,
                              ]}
                            >
                              {!isOwn && showAvatar ? (
                                <Text style={styles.senderLabel}>{senderName}</Text>
                              ) : null}

                              <View
                                style={[
                                  styles.messageBubble,
                                  isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.messageBody,
                                    isOwn && styles.messageBodyOwn,
                                  ]}
                                >
                                  {message.body}
                                </Text>
                              </View>

                              <View
                                style={[
                                  styles.messageMetaRow,
                                  isOwn && styles.messageMetaRowOwn,
                                ]}
                              >
                                <Text style={styles.messageTime}>
                                  {formatMessageTime(message.createdAt)}
                                </Text>
                                {isOwn && message.id === latestOwnMessageId ? (
                                  <Text style={styles.messageDelivery}>
                                    {message.delivery === 'preview' ? 'Preview only' : 'Sent'}
                                  </Text>
                                ) : null}
                              </View>
                            </View>
                          </View>
                        </View>
                      );
                    })
                  )}

                  <View style={styles.threadBottomSpace} />
                </ScrollView>

                <View style={styles.quickRepliesWrap}>
                  <ScrollView
                    contentContainerStyle={styles.quickRepliesContent}
                    horizontal
                    keyboardShouldPersistTaps="handled"
                    showsHorizontalScrollIndicator={false}
                  >
                    {QUICK_REPLIES.map((reply) => (
                      <Pressable
                        key={reply}
                        accessibilityRole="button"
                        onPress={() => handleQuickReply(reply)}
                        style={({ pressed }) => [styles.quickReply, pressed && styles.pressed]}
                      >
                        <Sparkles color={palette.primary} size={13} strokeWidth={2.4} />
                        <Text style={styles.quickReplyText}>{reply}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.composer}>
                  <Pressable
                    accessibilityLabel="Add attachment"
                    accessibilityRole="button"
                    onPress={handleAttachment}
                    style={({ pressed }) => [styles.composerIconButton, pressed && styles.pressed]}
                  >
                    <ImagePlus color={palette.primary} size={20} strokeWidth={2.4} />
                  </Pressable>

                  <View style={styles.composerInputWrap}>
                    <TextInput
                      accessibilityLabel="Message"
                      editable={!sending}
                      maxLength={4000}
                      multiline
                      onChangeText={(value) => {
                        setDraftMessage(value);
                        if (notice?.tone !== 'success') setNotice(null);
                      }}
                      onFocus={() =>
                        setTimeout(() => threadRef.current?.scrollToEnd({ animated: true }), 120)
                      }
                      placeholder={`Message ${otherName}`}
                      placeholderTextColor={palette.placeholder}
                      style={styles.composerInput}
                      value={draftMessage}
                    />
                    <Text style={styles.characterCount}>{draftMessage.length}/4000</Text>
                  </View>

                  <Pressable
                    accessibilityLabel="Send message"
                    accessibilityRole="button"
                    accessibilityState={{ disabled: sending || !draftMessage.trim() }}
                    disabled={sending || !draftMessage.trim()}
                    onPress={() => void sendMessage()}
                    style={({ pressed }) => [
                      styles.sendButton,
                      (sending || !draftMessage.trim()) && styles.sendButtonDisabled,
                      pressed && !sending && draftMessage.trim() && styles.pressed,
                    ]}
                  >
                    {sending ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Send color="#FFFFFF" size={20} strokeWidth={2.6} />
                    )}
                  </Pressable>
                </View>
              </View>

              <View style={styles.bottomNav}>
                <NavItem
                  active={false}
                  icon="home"
                  label="Home"
                  onPress={() => router.push(workspaceHomeRoute)}
                  palette={palette}
                  styles={styles}
                />
                <NavItem
                  active={false}
                  icon={navigationIsGuru ? 'bookings' : 'explore'}
                  label={secondaryLabel}
                  onPress={() => router.push(secondaryRoute)}
                  palette={palette}
                  styles={styles}
                />
                <NavItem
                  active
                  icon="messages"
                  label="Messages"
                  onPress={() =>
                    router.push({
                      pathname: '/messages',
                      params: { viewerRole: currentRole },
                    })
                  }
                  palette={palette}
                  styles={styles}
                />
                <NavItem
                  active={false}
                  icon="bookings"
                  label={fourthLabel}
                  onPress={() => router.push(fourthRoute)}
                  palette={palette}
                  styles={styles}
                />
                <NavItem
                  active={false}
                  icon="profile"
                  label="Profile"
                  onPress={() => setWorkspaceSwitcherOpen(true)}
                  palette={palette}
                  styles={styles}
                />
              </View>
            </KeyboardAvoidingView>
          </View>

          {isWebPreview ? <View style={styles.homeIndicator} /> : null}
        </View>
      </View>

      <SitGuruWorkspaceSwitcher
        currentRole={currentRole}
        onClose={() => setWorkspaceSwitcherOpen(false)}
        visible={workspaceSwitcherOpen}
      />
    </SitGuruScreen>
  );
}

function PhoneStatusBar({
  palette,
  styles,
}: {
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.statusBar}>
      <Text style={styles.statusTime}>9:41</Text>
      <View style={styles.statusIcons}>
        <View style={styles.signalBars}>
          <View style={[styles.signalBar, { height: 5, backgroundColor: palette.title }]} />
          <View style={[styles.signalBar, { height: 7, backgroundColor: palette.title }]} />
          <View style={[styles.signalBar, { height: 9, backgroundColor: palette.title }]} />
        </View>
        <Text style={styles.wifiText}>⌁</Text>
        <View style={styles.batteryBody}>
          <View style={styles.batteryFill} />
        </View>
      </View>
    </View>
  );
}

function ProfileAvatar({
  fallbackName,
  isDark,
  size,
  styles,
  uri,
}: {
  fallbackName: string;
  isDark: boolean;
  size: 'header' | 'message';
  styles: ReturnType<typeof createStyles>;
  uri: string | null;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const imageSizeStyle = size === 'header' ? styles.avatarHeaderImage : styles.avatarMessageImage;
  const wrapperSizeStyle = size === 'header' ? styles.avatarHeader : styles.avatarMessage;
  const initialsStyle = size === 'header' ? styles.avatarHeaderInitials : styles.avatarMessageInitials;

  return (
    <View style={[styles.avatarBase, wrapperSizeStyle]}>
      {uri && !failed ? (
        <Image
          accessibilityLabel={`${fallbackName} profile photo`}
          onError={() => setFailed(true)}
          resizeMode="cover"
          source={{ uri }}
          style={imageSizeStyle}
        />
      ) : (
        <View style={[styles.avatarFallback, isDark && styles.avatarFallbackDark]}>
          <Text style={initialsStyle}>{initials(fallbackName)}</Text>
        </View>
      )}
    </View>
  );
}

function PetAvatar({
  isDark,
  name,
  styles,
  uri,
}: {
  isDark: boolean;
  name: string;
  styles: ReturnType<typeof createStyles>;
  uri: string | null;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  return (
    <View style={styles.petAvatar}>
      {uri && !failed ? (
        <Image
          accessibilityLabel={`${name} pet photo`}
          onError={() => setFailed(true)}
          resizeMode="cover"
          source={{ uri }}
          style={styles.petAvatarImage}
        />
      ) : (
        <View style={[styles.petAvatarFallback, isDark && styles.petAvatarFallbackDark]}>
          <PawPrint color="#0B6B45" size={22} strokeWidth={2.4} />
        </View>
      )}
    </View>
  );
}

function ContextDetail({
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
    <View style={styles.contextDetail}>
      <View style={styles.contextDetailIcon}>{icon}</View>
      <View style={styles.contextDetailCopy}>
        <Text style={styles.contextDetailLabel}>{label}</Text>
        <Text style={styles.contextDetailValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function NoticeCard({
  notice,
  styles,
}: {
  notice: Exclude<NoticeState, null>;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View
      style={[
        styles.noticeCard,
        notice.tone === 'success' && styles.noticeCardSuccess,
        notice.tone === 'warning' && styles.noticeCardWarning,
        notice.tone === 'error' && styles.noticeCardError,
      ]}
    >
      <Text
        style={[
          styles.noticeText,
          notice.tone === 'success' && styles.noticeTextSuccess,
          notice.tone === 'warning' && styles.noticeTextWarning,
          notice.tone === 'error' && styles.noticeTextError,
        ]}
      >
        {notice.text}
      </Text>
    </View>
  );
}

function NavItem({
  active,
  icon,
  label,
  onPress,
  palette,
  styles,
}: {
  active: boolean;
  icon: 'home' | 'explore' | 'messages' | 'bookings' | 'profile';
  label: string;
  onPress: () => void;
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}
    >
      <View style={[styles.navIconWrap, active && styles.navIconWrapActive]}>
        <SitGuruIcon
          color={active ? palette.navActive : palette.navMuted}
          name={icon}
          size={20}
          strokeWidth={active ? 2.6 : 2.25}
        />
      </View>
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function getPalette(isDark: boolean) {
  return {
    bg: isDark ? '#06140F' : '#FFF8EF',
    shell: isDark ? '#071C14' : '#FFFCF7',
    surface: isDark ? '#0B261A' : '#FFFFFF',
    surfaceSoft: isDark ? '#103322' : '#F0FAF3',
    surfaceWarm: isDark ? '#10271D' : '#FFF8EF',
    border: isDark ? '#28573F' : '#EADBC7',
    borderStrong: isDark ? '#3C7757' : '#B9DFC6',
    title: isDark ? '#FFF5E8' : '#0A5138',
    text: isDark ? '#EDE9DE' : '#173E31',
    muted: isDark ? '#AAB8AF' : '#6E7C73',
    soft: isDark ? '#819087' : '#94A097',
    placeholder: isDark ? '#7F9187' : '#9B9F98',
    primary: '#0B7A4B',
    primaryDark: '#075B3A',
    primaryBright: '#39D982',
    ownBubble: isDark ? '#0B7A4B' : '#0B7A4B',
    otherBubble: isDark ? '#123124' : '#FFFFFF',
    navActive: isDark ? '#39D982' : '#0B7A4B',
    navMuted: isDark ? '#91A198' : '#79847D',
    frame: '#121714',
    frameBorder: '#2D3430',
  };
}

function createStyles(isDark: boolean) {
  const palette = getPalette(isDark);

  return StyleSheet.create({
    previewCanvas: {
      alignItems: 'center',
      minHeight: 960,
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
      backgroundColor: palette.frame,
      borderColor: palette.frameBorder,
      borderRadius: 42,
      borderWidth: 2,
      maxWidth: 430,
      overflow: 'hidden',
      paddingBottom: 15,
      paddingHorizontal: 8,
      paddingTop: 10,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.28,
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
      backgroundColor: palette.shell,
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
    keyboardView: {
      flex: 1,
    },
    statusBar: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 30,
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
    header: {
      alignItems: 'center',
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 8,
      minHeight: 66,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    headerButton: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    headerIdentity: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      gap: 8,
      minWidth: 0,
    },
    headerCopy: {
      flex: 1,
      minWidth: 0,
    },
    headerTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 14,
      letterSpacing: -0.2,
      lineHeight: 18,
    },
    headerStatusRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
      marginTop: 1,
      minWidth: 0,
    },
    headerSubtitle: {
      color: palette.muted,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 12,
    },
    connectionDot: {
      borderRadius: 999,
      height: 6,
      width: 6,
    },
    connectionDotLive: {
      backgroundColor: '#2BC66B',
    },
    connectionDotConnecting: {
      backgroundColor: '#E6A31D',
    },
    connectionDotOffline: {
      backgroundColor: '#9AA39D',
    },
    headerActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 5,
    },
    modeToggle: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: '#F08A33',
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 2,
      padding: 2,
    },
    modeButton: {
      alignItems: 'center',
      borderRadius: 9,
      height: 27,
      justifyContent: 'center',
      width: 27,
    },
    modeButtonActive: {
      backgroundColor: isDark ? 'rgba(240, 207, 98, 0.15)' : '#FFF1D7',
    },
    profileButton: {
      borderRadius: 999,
    },
    body: {
      flex: 1,
      paddingHorizontal: 10,
      paddingTop: 8,
    },
    contextCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      overflow: 'hidden',
    },
    contextTop: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 9,
      minHeight: 66,
      padding: 9,
    },
    contextPrimaryCopy: {
      flex: 1,
      minWidth: 0,
    },
    contextTitleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
      minWidth: 0,
    },
    contextPetName: {
      color: palette.title,
      flexShrink: 1,
      fontFamily: AppFonts.extraBold,
      fontSize: 14,
      lineHeight: 17,
    },
    contextStatusPill: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      maxWidth: 100,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    contextStatusText: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 7,
      lineHeight: 9,
      textTransform: 'uppercase',
    },
    contextService: {
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 10,
      lineHeight: 13,
      marginTop: 1,
    },
    contextSchedule: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 12,
      marginTop: 1,
    },
    contextExpanded: {
      borderTopColor: palette.border,
      borderTopWidth: 1,
      gap: 8,
      padding: 9,
    },
    contextDetailsRow: {
      flexDirection: 'row',
      gap: 7,
    },
    contextDetail: {
      alignItems: 'center',
      backgroundColor: palette.surfaceWarm,
      borderColor: palette.border,
      borderRadius: 13,
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      gap: 6,
      minHeight: 48,
      padding: 7,
    },
    contextDetailIcon: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 27,
      justifyContent: 'center',
      width: 27,
    },
    contextDetailCopy: {
      flex: 1,
      minWidth: 0,
    },
    contextDetailLabel: {
      color: palette.soft,
      fontFamily: AppFonts.bold,
      fontSize: 7,
      lineHeight: 9,
      textTransform: 'uppercase',
    },
    contextDetailValue: {
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 8,
      lineHeight: 11,
      marginTop: 1,
    },
    contextActions: {
      flexDirection: 'row',
      gap: 7,
    },
    contextSecondaryButton: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.borderStrong,
      borderRadius: 999,
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      gap: 5,
      justifyContent: 'center',
      minHeight: 34,
    },
    contextSecondaryText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    contextPrimaryButton: {
      alignItems: 'center',
      backgroundColor: palette.primary,
      borderRadius: 999,
      flex: 1,
      flexDirection: 'row',
      gap: 5,
      justifyContent: 'center',
      minHeight: 34,
    },
    contextPrimaryText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    noticeCard: {
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.borderStrong,
      borderRadius: 13,
      borderWidth: 1,
      marginTop: 7,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    noticeCardSuccess: {
      backgroundColor: isDark ? '#113A27' : '#EAF8EF',
      borderColor: '#78C895',
    },
    noticeCardWarning: {
      backgroundColor: isDark ? '#3A2C13' : '#FFF5DB',
      borderColor: '#E0B45B',
    },
    noticeCardError: {
      backgroundColor: isDark ? '#3B1E1A' : '#FFF0ED',
      borderColor: '#E9A398',
    },
    noticeText: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
      textAlign: 'center',
    },
    noticeTextSuccess: {
      color: isDark ? '#C4F3D2' : '#075A39',
    },
    noticeTextWarning: {
      color: isDark ? '#F5D98E' : '#775100',
    },
    noticeTextError: {
      color: isDark ? '#F3B5AA' : '#9D3123',
    },
    threadScroll: {
      flex: 1,
      marginTop: 7,
    },
    messageList: {
      paddingBottom: 8,
      paddingHorizontal: 2,
    },
    loadingState: {
      alignItems: 'center',
      gap: 8,
      justifyContent: 'center',
      minHeight: 180,
    },
    loadingText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 11,
    },
    emptyState: {
      alignItems: 'center',
      gap: 8,
      justifyContent: 'center',
      minHeight: 220,
      paddingHorizontal: 24,
    },
    emptyIcon: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 58,
      justifyContent: 'center',
      width: 58,
    },
    emptyTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 16,
    },
    emptyText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 11,
      lineHeight: 17,
      textAlign: 'center',
    },
    dayDivider: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      marginVertical: 10,
    },
    dayLine: {
      backgroundColor: palette.border,
      flex: 1,
      height: 1,
    },
    dayText: {
      color: palette.soft,
      fontFamily: AppFonts.bold,
      fontSize: 8,
      textTransform: 'uppercase',
    },
    messageRow: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      gap: 6,
      marginBottom: 6,
    },
    messageRowOwn: {
      justifyContent: 'flex-end',
    },
    messageRowOther: {
      justifyContent: 'flex-start',
    },
    messageAvatarSpacer: {
      height: 30,
      width: 30,
    },
    messageGroup: {
      maxWidth: '80%',
    },
    messageGroupOwn: {
      alignItems: 'flex-end',
    },
    messageGroupOther: {
      alignItems: 'flex-start',
    },
    senderLabel: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 8,
      marginBottom: 3,
      marginLeft: 4,
    },
    messageBubble: {
      borderRadius: 18,
      paddingHorizontal: 11,
      paddingVertical: 9,
    },
    messageBubbleOwn: {
      backgroundColor: palette.ownBubble,
      borderBottomRightRadius: 6,
    },
    messageBubbleOther: {
      backgroundColor: palette.otherBubble,
      borderBottomLeftRadius: 6,
      borderColor: palette.border,
      borderWidth: 1,
    },
    messageBody: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 11,
      lineHeight: 16,
    },
    messageBodyOwn: {
      color: '#FFFFFF',
    },
    messageMetaRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 5,
      marginTop: 2,
      paddingHorizontal: 4,
    },
    messageMetaRowOwn: {
      justifyContent: 'flex-end',
    },
    messageTime: {
      color: palette.soft,
      fontFamily: AppFonts.medium,
      fontSize: 7,
    },
    messageDelivery: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 7,
    },
    threadBottomSpace: {
      height: 4,
    },
    quickRepliesWrap: {
      borderTopColor: palette.border,
      borderTopWidth: 1,
      marginHorizontal: -10,
      paddingTop: 6,
    },
    quickRepliesContent: {
      gap: 6,
      paddingHorizontal: 10,
      paddingRight: 20,
    },
    quickReply: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 4,
      minHeight: 31,
      paddingHorizontal: 10,
    },
    quickReplyText: {
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 8,
    },
    composer: {
      alignItems: 'flex-end',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 7,
      marginTop: 7,
      padding: 6,
    },
    composerIconButton: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    composerInputWrap: {
      flex: 1,
      minHeight: 40,
      position: 'relative',
    },
    composerInput: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 11,
      maxHeight: 92,
      minHeight: 40,
      paddingBottom: 14,
      paddingHorizontal: 2,
      paddingTop: 8,
      textAlignVertical: 'top',
    },
    characterCount: {
      bottom: 0,
      color: palette.soft,
      fontFamily: AppFonts.medium,
      fontSize: 7,
      position: 'absolute',
      right: 1,
    },
    sendButton: {
      alignItems: 'center',
      backgroundColor: palette.primary,
      borderRadius: 999,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    sendButtonDisabled: {
      opacity: 0.42,
    },
    bottomNav: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderTopColor: palette.border,
      borderTopWidth: 1,
      flexDirection: 'row',
      height: 70,
      justifyContent: 'space-around',
      paddingBottom: 6,
      paddingHorizontal: 5,
      paddingTop: 5,
    },
    navItem: {
      alignItems: 'center',
      flex: 1,
      gap: 2,
      justifyContent: 'center',
    },
    navIconWrap: {
      alignItems: 'center',
      borderRadius: 999,
      height: 28,
      justifyContent: 'center',
      width: 38,
    },
    navIconWrapActive: {
      backgroundColor: palette.surfaceSoft,
    },
    navLabel: {
      color: palette.navMuted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
    navLabelActive: {
      color: palette.navActive,
      fontFamily: AppFonts.bold,
    },
    avatarBase: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.borderStrong,
      borderWidth: 1,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarHeader: {
      borderRadius: 999,
      height: 34,
      width: 34,
    },
    avatarMessage: {
      borderRadius: 999,
      height: 30,
      width: 30,
    },
    avatarHeaderImage: {
      height: 34,
      width: 34,
    },
    avatarMessageImage: {
      height: 30,
      width: 30,
    },
    avatarFallback: {
      alignItems: 'center',
      backgroundColor: '#E9F7EE',
      height: '100%',
      justifyContent: 'center',
      width: '100%',
    },
    avatarFallbackDark: {
      backgroundColor: '#183A2A',
    },
    avatarHeaderInitials: {
      color: palette.primaryDark,
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
    },
    avatarMessageInitials: {
      color: palette.primaryDark,
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    petAvatar: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.borderStrong,
      borderRadius: 15,
      borderWidth: 1,
      height: 48,
      justifyContent: 'center',
      overflow: 'hidden',
      width: 48,
    },
    petAvatarImage: {
      height: 48,
      width: 48,
    },
    petAvatarFallback: {
      alignItems: 'center',
      backgroundColor: '#E9F7EE',
      height: '100%',
      justifyContent: 'center',
      width: '100%',
    },
    petAvatarFallbackDark: {
      backgroundColor: '#183A2A',
    },
    pressed: {
      opacity: 0.78,
      transform: [{ scale: 0.99 }],
    },
    homeIndicator: {
      alignSelf: 'center',
      backgroundColor: '#F3F1EA',
      borderRadius: 999,
      height: 5,
      marginTop: 9,
      width: 116,
    },
  });
}