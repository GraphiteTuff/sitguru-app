import { router, useLocalSearchParams } from 'expo-router';
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Home,
  MessageCircle,
  Search,
  ShieldCheck,
  UserRound,
  X
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SitGuruIcon } from '@/components/SitGuruIcon';
import SitGuruScreen from '@/components/SitGuruScreen';
import { AppFonts } from '@/constants/fonts';
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

type MessageFilter = 'all' | 'unread' | 'bookings' | 'support';

type ThemeOption = {
  label: string;
  value: SitGuruThemePreference;
  icon: 'sun' | 'moon';
};

type ConversationPreview = {
  id: string;
  title: string;
  avatarUrl: string | null;
  lastMessage: string;
  lastMessageAt: Date | null;
  unreadCount: number;
  bookingLabel: string;
  serviceLabel: string;
  petName: string;
  isSupport: boolean;
  isBookingRelated: boolean;
  activeCare: boolean;
};

const themeOptions: ThemeOption[] = [
  { label: 'Light', value: 'light', icon: 'sun' },
  { label: 'Dark', value: 'dark', icon: 'moon' },
];

const filterOptions: Array<{ label: string; value: MessageFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Bookings', value: 'bookings' },
  { label: 'Support', value: 'support' },
];

const CONVERSATION_TABLES = ['conversations', 'message_threads'];
const OWNER_FIELDS = [
  'pet_parent_id',
  'customer_id',
  'client_id',
  'user_id',
  'participant_id',
  'created_by',
];

const MESSAGE_TABLES = ['messages', 'conversation_messages'];
const REALTIME_TABLES = [
  'conversations',
  'message_threads',
  'messages',
  'conversation_messages',
];

export default function MessagesScreen() {
  const routeParams = useLocalSearchParams<{
    from?: string;
    role?: string;
  }>();
  const { user, profile, roles } = useAuth();
  const themeMode = useThemeMode();
  const themePreference = useThemePreference();
  const isDark = themeMode === 'dark';
  const isWebPreview = Platform.OS === 'web';

  const palette = getPalette(isDark);
  const styles = createStyles(isDark);

  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [activeFilter, setActiveFilter] = useState<MessageFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadMessage, setLoadMessage] = useState('');

  const profileRecord = (profile ?? {}) as RecordRow;
  const profileName =
    getFirstString(profileRecord, ['full_name', 'display_name']) ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    user?.email?.split('@')[0] ||
    'Pet Parent';

  const profilePhotoUrl = resolveSupabaseStorageUrl(
    getFirstString(profileRecord, [
      'avatar_url',
      'photo_url',
      'profile_photo_url',
      'profile_image_url',
    ]),
  );

  const activeRole = resolveActiveRole({
    routeRole: routeParams.role,
    routeFrom: routeParams.from,
    profile: profileRecord,
    userMetadata: (user?.user_metadata ?? {}) as RecordRow,
    roles,
  });

  const homeRoute =
    activeRole === 'guru'
      ? '/guru-dashboard'
      : activeRole === 'ambassador'
        ? '/ambassador-dashboard'
        : '/pet-parent-dashboard';

  const loadMessages = useCallback(
    async (showRefresh = false) => {
      if (!user?.id || !isSupabaseConfigured) {
        setConversations([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const rows = await loadConversationPreviews(user.id);
        setConversations(rows);
        setLoadMessage('');
      } catch {
        setLoadMessage(
          'Some conversations could not be loaded. Pull down to try again.',
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    void loadMessages(false);
  }, [loadMessages]);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const refreshSoon = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void loadMessages(false);
      }, 450);
    };

    let channel = supabase.channel(`messages-screen-${user.id}`);

    REALTIME_TABLES.forEach((table) => {
      channel = channel.on(
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
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [loadMessages, user?.id]);

  const filteredConversations = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return conversations.filter((conversation) => {
      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'unread' && conversation.unreadCount > 0) ||
        (activeFilter === 'bookings' && conversation.isBookingRelated) ||
        (activeFilter === 'support' && conversation.isSupport);

      if (!matchesFilter) return false;
      if (!normalizedSearch) return true;

      const haystack = [
        conversation.title,
        conversation.lastMessage,
        conversation.bookingLabel,
        conversation.serviceLabel,
        conversation.petName,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [activeFilter, conversations, searchQuery]);

  const unreadTotal = conversations.reduce(
    (total, conversation) => total + conversation.unreadCount,
    0,
  );

  return (
    <SitGuruScreen center={isWebPreview} maxWidth={620}>
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
                      refreshing={isRefreshing}
                      onRefresh={() => void loadMessages(true)}
                      tintColor={palette.primary}
                      colors={[palette.primary]}
                    />
                  }
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.header}>
                    <View>
                      <Text style={styles.title}>Messages</Text>
                      <Text style={styles.subtitle}>
                        Conversations about bookings and care.
                      </Text>
                    </View>

                    <View style={styles.headerActions}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Open notifications"
                        onPress={() => router.push('/notifications')}
                        style={styles.headerIconButton}
                      >
                        <Bell
                          color={palette.title}
                          size={18}
                          strokeWidth={2.3}
                        />
                        {unreadTotal > 0 ? (
                          <View style={styles.headerBadge}>
                            <Text style={styles.headerBadgeText}>
                              {formatBadge(unreadTotal)}
                            </Text>
                          </View>
                        ) : null}
                      </Pressable>

                      <View style={styles.modeToggle}>
                        {themeOptions.map((option) => {
                          const active = themePreference === option.value;

                          return (
                            <Pressable
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
                            </Pressable>
                          );
                        })}
                      </View>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Open profile"
                        onPress={() => router.push('/account')}
                        style={styles.profileButton}
                      >
                        <Avatar
                          fallback={getInitials(profileName)}
                          imageUrl={profilePhotoUrl}
                          palette={palette}
                          size={40}
                        />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.searchRow}>
                    <Search
                      color={palette.muted}
                      size={17}
                      strokeWidth={2.3}
                    />

                    <TextInput
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Search conversations"
                      placeholderTextColor={palette.placeholder}
                      style={styles.searchInput}
                    />

                    {searchQuery ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Clear search"
                        hitSlop={8}
                        onPress={() => setSearchQuery('')}
                      >
                        <X
                          color={palette.muted}
                          size={17}
                          strokeWidth={2.3}
                        />
                      </Pressable>
                    ) : null}
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterRail}
                  >
                    {filterOptions.map((option) => {
                      const active = activeFilter === option.value;

                      return (
                        <Pressable
                          key={option.value}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          onPress={() => setActiveFilter(option.value)}
                          style={[
                            styles.filterPill,
                            active && styles.filterPillActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.filterPillText,
                              active && styles.filterPillTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  {loadMessage ? (
                    <View style={styles.noticeCard}>
                      <Text style={styles.noticeText}>{loadMessage}</Text>
                    </View>
                  ) : null}

                  {isLoading ? (
                    <View style={styles.loadingList}>
                      {[0, 1, 2, 3].map((item) => (
                        <View key={item} style={styles.loadingRow}>
                          <View style={styles.loadingAvatar} />
                          <View style={styles.loadingCopy}>
                            <View style={styles.loadingBarLarge} />
                            <View style={styles.loadingBarSmall} />
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : filteredConversations.length > 0 ? (
                    <View style={styles.conversationList}>
                      {filteredConversations.map((conversation) => (
                        <ConversationRow
                          conversation={conversation}
                          key={conversation.id}
                          palette={palette}
                          styles={styles}
                        />
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyCard}>
                      <View style={styles.emptyIcon}>
                        <MessageCircle
                          color={palette.primary}
                          size={26}
                          strokeWidth={2.3}
                        />
                      </View>

                      <Text style={styles.emptyTitle}>
                        {searchQuery || activeFilter !== 'all'
                          ? 'No conversations matched'
                          : 'No messages yet'}
                      </Text>

                      <Text style={styles.emptyText}>
                        {searchQuery || activeFilter !== 'all'
                          ? 'Try another search or choose All.'
                          : 'Find a Guru and start a conversation before requesting care.'}
                      </Text>

                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          if (searchQuery || activeFilter !== 'all') {
                            setSearchQuery('');
                            setActiveFilter('all');
                            return;
                          }

                          router.push('/find-care');
                        }}
                        style={styles.emptyButton}
                      >
                        <Text style={styles.emptyButtonText}>
                          {searchQuery || activeFilter !== 'all'
                            ? 'Reset'
                            : 'Find a Guru'}
                        </Text>
                      </Pressable>
                    </View>
                  )}

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push('/support')}
                    style={styles.supportCard}
                  >
                    <View style={styles.supportIcon}>
                      <ShieldCheck
                        color={palette.primary}
                        size={21}
                        strokeWidth={2.3}
                      />
                    </View>

                    <View style={styles.supportCopy}>
                      <Text style={styles.supportTitle}>SitGuru Support</Text>
                      <Text style={styles.supportText}>
                        Get help with bookings, payments, profiles, or care.
                      </Text>
                    </View>

                    <ChevronRight
                      color={palette.primary}
                      size={18}
                      strokeWidth={2.3}
                    />
                  </Pressable>
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
                    onPress={() => router.push(homeRoute)}
                    styles={styles}
                  />

                  <BottomNavItem
                    icon={
                      <Search
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
                    icon={
                      <CalendarDays
                        color={palette.navMuted}
                        size={21}
                        strokeWidth={2.3}
                      />
                    }
                    label="Bookings"
                    onPress={() => router.push('/booking-details')}
                    styles={styles}
                  />

                  <BottomNavItem
                    active
                    badge={unreadTotal}
                    icon={
                      <MessageCircle
                        color={palette.primary}
                        size={21}
                        strokeWidth={2.4}
                      />
                    }
                    label="Messages"
                    onPress={() => undefined}
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
                    onPress={() => router.push('/account')}
                    styles={styles}
                  />
                </View>
              </View>
            </View>

            {isWebPreview ? <View style={styles.homeIndicator} /> : null}
          </View>
        </View>
    </SitGuruScreen>
  );
}

function ConversationRow({
  conversation,
  palette,
  styles,
}: {
  conversation: ConversationPreview;
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: '/conversation',
          params: { conversationId: conversation.id },
        })
      }
      style={({ pressed }) => [
        styles.conversationRow,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.avatarWrap}>
        <Avatar
          fallback={getInitials(conversation.title)}
          imageUrl={conversation.avatarUrl}
          palette={palette}
          size={48}
        />

        {conversation.activeCare ? <View style={styles.activeCareDot} /> : null}
      </View>

      <View style={styles.conversationCopy}>
        <View style={styles.conversationTopLine}>
          <Text style={styles.conversationTitle} numberOfLines={1}>
            {conversation.title}
          </Text>
          <Text style={styles.conversationTime}>
            {formatRelativeTime(conversation.lastMessageAt)}
          </Text>
        </View>

        <Text
          numberOfLines={1}
          style={[
            styles.lastMessage,
            conversation.unreadCount > 0 && styles.lastMessageUnread,
          ]}
        >
          {conversation.lastMessage || 'Open conversation'}
        </Text>

        {conversation.bookingLabel ||
        conversation.serviceLabel ||
        conversation.petName ? (
          <Text style={styles.contextText} numberOfLines={1}>
            {[conversation.bookingLabel, conversation.serviceLabel, conversation.petName]
              .filter(Boolean)
              .join(' • ')}
          </Text>
        ) : null}
      </View>

      {conversation.unreadCount > 0 ? (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>
            {formatBadge(conversation.unreadCount)}
          </Text>
        </View>
      ) : (
        <ChevronRight
          color={palette.muted}
          size={18}
          strokeWidth={2.2}
        />
      )}
    </Pressable>
  );
}

function BottomNavItem({
  active = false,
  badge = 0,
  icon,
  label,
  onPress,
  styles,
}: {
  active?: boolean;
  badge?: number;
  icon: React.ReactNode;
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
      <View style={styles.navIconWrap}>
        {icon}
        {badge > 0 ? <View style={styles.navBadge} /> : null}
      </View>

      <Text style={active ? styles.navLabelActive : styles.navLabel}>
        {label}
      </Text>
    </Pressable>
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
          accessibilityLabel={`${fallback} profile photo`}
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
            fontSize: Math.max(11, size * 0.27),
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

async function loadConversationPreviews(
  userId: string,
): Promise<ConversationPreview[]> {
  const conversationRows = await queryFirstAvailableRows(
    CONVERSATION_TABLES,
    OWNER_FIELDS,
    userId,
    80,
  );

  const mapped = await Promise.all(
    conversationRows.map(async (row, index) => {
      const conversation = mapConversationRow(row, index);

      if (!conversation.lastMessage) {
        const latestMessage = await loadLatestMessage(conversation.id);

        if (latestMessage) {
          conversation.lastMessage = latestMessage.body;
          conversation.lastMessageAt = latestMessage.createdAt;
        }
      }

      return conversation;
    }),
  );

  return mapped.sort((a, b) => {
    const aTime = a.lastMessageAt?.getTime() ?? 0;
    const bTime = b.lastMessageAt?.getTime() ?? 0;
    return bTime - aTime;
  });
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

async function loadLatestMessage(conversationId: string) {
  if (!isSupabaseConfigured || !conversationId) return null;

  for (const table of MESSAGE_TABLES) {
    const result = await supabase
      .from(table)
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!result.error && result.data?.length) {
      const row = result.data[0] as RecordRow;

      return {
        body:
          getFirstString(row, ['body', 'message', 'content', 'text']) ||
          'Open conversation',
        createdAt: getFirstDate(row, [
          'created_at',
          'sent_at',
          'updated_at',
        ]),
      };
    }
  }

  return null;
}

function mapConversationRow(
  row: RecordRow,
  index: number,
): ConversationPreview {
  const id =
    getFirstString(row, ['id', 'conversation_id', 'thread_id']) ||
    `conversation-${index}`;

  const title =
    getFirstString(row, [
      'other_user_name',
      'participant_name',
      'guru_name',
      'pet_parent_name',
      'display_name',
      'title',
      'name',
    ]) || 'SitGuru Conversation';

  const serviceLabel = getFirstString(row, [
    'service_name',
    'service_type',
    'booking_service',
  ]);

  const bookingLabel = getFirstString(row, [
    'booking_label',
    'booking_status',
    'booking_reference',
  ]);

  const petName = getFirstString(row, ['pet_name', 'animal_name']);

  const type = getFirstString(row, [
    'conversation_type',
    'thread_type',
    'type',
    'category',
  ]).toLowerCase();

  const isSupport =
    type.includes('support') ||
    title.toLowerCase().includes('support') ||
    getFirstBoolean(row, ['is_support']);

  const isBookingRelated =
    Boolean(serviceLabel || bookingLabel || petName) ||
    type.includes('booking') ||
    getFirstBoolean(row, ['is_booking_related']);

  return {
    id,
    title,
    avatarUrl: resolveSupabaseStorageUrl(
      getFirstString(row, [
        'other_user_avatar_url',
        'participant_avatar_url',
        'guru_photo_url',
        'pet_parent_photo_url',
        'avatar_url',
        'photo_url',
      ]),
    ),
    lastMessage:
      getFirstString(row, [
        'last_message',
        'latest_message',
        'message_preview',
        'snippet',
      ]) || '',
    lastMessageAt: getFirstDate(row, [
      'last_message_at',
      'latest_message_at',
      'updated_at',
      'created_at',
    ]),
    unreadCount: Math.max(
      0,
      Math.round(
        getFirstNumber(row, [
          'unread_count',
          'pet_parent_unread_count',
          'customer_unread_count',
        ]) ?? (getFirstBoolean(row, ['is_unread', 'unread']) ? 1 : 0),
      ),
    ),
    bookingLabel,
    serviceLabel,
    petName,
    isSupport,
    isBookingRelated,
    activeCare:
      getFirstBoolean(row, ['care_in_progress', 'is_active_care']) ||
      ['active', 'in_progress', 'started'].includes(
        getFirstString(row, ['booking_status', 'care_status']).toLowerCase(),
      ),
  };
}

function resolveActiveRole({
  profile,
  roles,
  routeFrom,
  routeRole,
  userMetadata,
}: {
  profile: RecordRow;
  roles: string[];
  routeFrom?: string | string[];
  routeRole?: string | string[];
  userMetadata: RecordRow;
}): 'pet_parent' | 'guru' | 'ambassador' {
  const explicitRouteRole = normalizeRoleValue(
    getSingleParam(routeRole) || getSingleParam(routeFrom),
  );

  if (explicitRouteRole) return explicitRouteRole;

  const savedRole = normalizeRoleValue(
    getFirstString(profile, [
      'active_role',
      'selected_role',
      'current_role',
      'primary_role',
      'last_active_role',
    ]) ||
      getFirstString(userMetadata, [
        'active_role',
        'selected_role',
        'current_role',
        'primary_role',
        'last_active_role',
      ]),
  );

  if (savedRole) return savedRole;

  const normalizedRoles = roles.map((role) => normalizeRoleValue(role)).filter(Boolean);

  // Pet Parent is the safest fallback for the shared mobile Messages screen.
  // This prevents multi-role accounts from being redirected to Guru Dashboard
  // just because "guru" also exists in their role list.
  if (normalizedRoles.includes('pet_parent')) return 'pet_parent';
  if (normalizedRoles.includes('guru')) return 'guru';
  if (normalizedRoles.includes('ambassador')) return 'ambassador';

  return 'pet_parent';
}

function getSingleParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function normalizeRoleValue(
  value: string,
): 'pet_parent' | 'guru' | 'ambassador' | null {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');

  if (
    normalized === 'pet_parent' ||
    normalized === 'petparent' ||
    normalized.includes('pet_parent_dashboard') ||
    normalized.includes('pet-parent-dashboard')
  ) {
    return 'pet_parent';
  }

  if (
    normalized === 'guru' ||
    normalized === 'pet_guru' ||
    normalized.includes('guru_dashboard') ||
    normalized.includes('guru-dashboard')
  ) {
    return 'guru';
  }

  if (
    normalized === 'ambassador' ||
    normalized.includes('ambassador_dashboard') ||
    normalized.includes('ambassador-dashboard')
  ) {
    return 'ambassador';
  }

  return null;
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

function formatRelativeTime(date: Date | null) {
  if (!date) return '';

  const minutes = Math.max(
    0,
    Math.round((Date.now() - date.getTime()) / 60_000),
  );

  if (minutes < 1) return 'Now';
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function getInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return 'SG';
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
    border: isDark ? '#234B38' : '#EADDCB',
    title: isDark ? '#FFF5E8' : '#123F31',
    text: isDark ? '#E8EEE9' : '#27483E',
    muted: isDark ? '#9DB0A5' : '#738078',
    placeholder: isDark ? '#809187' : '#9A9A90',
    primary: isDark ? '#39D982' : '#087449',
    primarySoft: isDark ? '#123E2A' : '#E4F5E9',
    orange: '#F15A3A',
    navMuted: isDark ? '#9BAAA1' : '#748079',
    avatarBg: isDark ? '#173527' : '#EEF5EE',
    avatarBorder: isDark ? '#2E6C4B' : '#FFFFFF',
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
      paddingBottom: 105,
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    title: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 22,
      letterSpacing: -0.45,
    },
    subtitle: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 10,
      marginTop: 2,
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
      height: 38,
      justifyContent: 'center',
      position: 'relative',
      width: 38,
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
    profileButton: {
      borderRadius: 999,
    },

    searchRow: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 17,
      borderWidth: 1,
      flexDirection: 'row',
      minHeight: 44,
      paddingHorizontal: 12,
    },
    searchInput: {
      color: palette.text,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 11,
      paddingHorizontal: 8,
      paddingVertical: 9,
    },
    filterRail: {
      gap: 7,
      paddingRight: 10,
    },
    filterPill: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      minHeight: 30,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    filterPillActive: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    filterPillText: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 9,
    },
    filterPillTextActive: {
      color: '#FFFFFF',
    },

    noticeCard: {
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
      lineHeight: 13,
    },

    conversationList: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      overflow: 'hidden',
    },
    conversationRow: {
      alignItems: 'center',
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 10,
      minHeight: 76,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    pressed: {
      opacity: 0.72,
    },
    avatarWrap: {
      position: 'relative',
    },
    activeCareDot: {
      backgroundColor: palette.primary,
      borderColor: palette.surface,
      borderRadius: 999,
      borderWidth: 2,
      bottom: 0,
      height: 12,
      position: 'absolute',
      right: 0,
      width: 12,
    },
    conversationCopy: {
      flex: 1,
      gap: 3,
    },
    conversationTopLine: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'space-between',
    },
    conversationTitle: {
      color: palette.title,
      flex: 1,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
    },
    conversationTime: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
    lastMessage: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
    },
    lastMessageUnread: {
      color: palette.text,
      fontFamily: AppFonts.bold,
    },
    contextText: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 8,
    },
    unreadBadge: {
      alignItems: 'center',
      backgroundColor: palette.orange,
      borderRadius: 999,
      justifyContent: 'center',
      minHeight: 21,
      minWidth: 21,
      paddingHorizontal: 6,
    },
    unreadBadgeText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },

    loadingList: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      overflow: 'hidden',
    },
    loadingRow: {
      alignItems: 'center',
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 10,
      minHeight: 74,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    loadingAvatar: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 48,
      width: 48,
    },
    loadingCopy: {
      flex: 1,
      gap: 7,
    },
    loadingBarLarge: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 11,
      width: '48%',
    },
    loadingBarSmall: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 9,
      width: '76%',
    },

    emptyCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 7,
      padding: 22,
    },
    emptyIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      height: 50,
      justifyContent: 'center',
      width: 50,
    },
    emptyTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 15,
      textAlign: 'center',
    },
    emptyText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 14,
      textAlign: 'center',
    },
    emptyButton: {
      backgroundColor: palette.primary,
      borderRadius: 999,
      marginTop: 3,
      paddingHorizontal: 16,
      paddingVertical: 9,
    },
    emptyButtonText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
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
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    supportCopy: {
      flex: 1,
      gap: 2,
    },
    supportTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
    },
    supportText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
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
    navIconWrap: {
      position: 'relative',
    },
    navBadge: {
      backgroundColor: palette.orange,
      borderColor: palette.surface,
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