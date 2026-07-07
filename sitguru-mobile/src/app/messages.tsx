import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

type MessageFilter = 'all' | 'pet-parent' | 'guru' | 'ambassador' | 'support';

type ConversationPreview = {
  id: string;
  role: MessageFilter;
  title: string;
  subtitle: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  status: string;
  contextLabel: string;
  contextValue: string;
  avatarLabel: string;
  avatarEmoji: string;
  avatarUrl?: string;
};

const filters: { label: string; value: MessageFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pet Parent', value: 'pet-parent' },
  { label: 'Guru', value: 'guru' },
  { label: 'Ambassador', value: 'ambassador' },
  { label: 'Support', value: 'support' },
];

const conversations: ConversationPreview[] = [
  {
    id: 'pet-parent-guru',
    role: 'pet-parent',
    title: 'Local Guru Conversation',
    subtitle: 'Pet Parent ↔ Guru',
    lastMessage:
      'Hi! I’m looking for dog walking help next week. Are you available around lunchtime?',
    time: 'Now',
    unreadCount: 2,
    status: 'Care question',
    contextLabel: 'Pet',
    contextValue: 'Scout • Dog Walking',
    avatarLabel: 'Guru',
    avatarEmoji: '🏡',
  },
  {
    id: 'guru-request',
    role: 'guru',
    title: 'New Care Request',
    subtitle: 'Guru dashboard message',
    lastMessage:
      'A Pet Parent sent dates, pet notes, and care expectations for review.',
    time: '12m',
    unreadCount: 1,
    status: 'Request pending',
    contextLabel: 'Booking',
    contextValue: 'Review before accepting',
    avatarLabel: 'Pet Parent',
    avatarEmoji: '🐶',
  },
  {
    id: 'ambassador-support',
    role: 'ambassador',
    title: 'Ambassador Support',
    subtitle: 'Ambassador ↔ SitGuru',
    lastMessage:
      'Can you help me with the best wording for sharing SitGuru with local pet groups?',
    time: '1h',
    unreadCount: 0,
    status: 'Support',
    contextLabel: 'Referral',
    contextValue: 'Community outreach',
    avatarLabel: 'Ambassador',
    avatarEmoji: '🌟',
  },
  {
    id: 'admin-support',
    role: 'support',
    title: 'SitGuru Support',
    subtitle: 'Account and care help',
    lastMessage:
      'Questions about bookings, profiles, setup, referrals, or care details can start here.',
    time: 'Open',
    unreadCount: 0,
    status: 'Help center',
    contextLabel: 'Support',
    contextValue: 'Admin assistance',
    avatarLabel: 'Support',
    avatarEmoji: '🐾',
  },
];

export default function MessagesScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 760;
  const [activeFilter, setActiveFilter] = useState<MessageFilter>('all');

  const visibleConversations =
    activeFilter === 'all'
      ? conversations
      : conversations.filter((conversation) => conversation.role === activeFilter);

  return (
    <SitGuruScreen scroll center={false} maxWidth={860}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <SitGuruLogo size="small" variant="symbol" />

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/role-selection')}
            style={styles.topLinkButton}
          >
            <Text style={styles.topLinkText}>Roles</Text>
          </Pressable>
        </View>

        <View style={[styles.heroPanel, isWide && styles.heroPanelWide]}>
          <View style={styles.heroCopy}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Messages</Text>
            </View>

            <Text style={styles.title}>Conversations that keep care clear.</Text>

            <Text style={styles.subtitle}>
              Message Gurus, Pet Parents, Ambassadors, and SitGuru Support from
              one organized place.
            </Text>

            <View style={styles.heroActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/find-care')}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Find Care</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/conversation')}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Open Conversation</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.heroPhotoCard}>
            <View style={styles.heroPhotoPlaceholder}>
              <ProfileAvatar
                emoji="💬"
                label="Messages"
                size="large"
              />

              <Text style={styles.heroPhotoTitle}>Message profile area</Text>
              <Text style={styles.heroPhotoText}>
                Real profile photos for Gurus, Pet Parents, Ambassadors, and Support will appear here.
              </Text>
            </View>

            <View style={styles.heroFloatingCard}>
              <Text style={styles.heroFloatingTitle}>Message first</Text>
              <Text style={styles.heroFloatingText}>
                Ask questions before requesting care.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.filterRail}>
          {filters.map((filter) => {
            const active = activeFilter === filter.value;

            return (
              <Pressable
                key={filter.value}
                accessibilityRole="button"
                onPress={() => setActiveFilter(filter.value)}
                style={[styles.filterPill, active && styles.filterPillActive]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    active && styles.filterPillTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.inboxPanel}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>Inbox</Text>
              <Text style={styles.sectionTitle}>Active conversations</Text>
            </View>

            <Text style={styles.sectionBadge}>
              {visibleConversations.length} shown
            </Text>
          </View>

          <View style={styles.conversationList}>
            {visibleConversations.map((conversation) => (
              <Pressable
                key={conversation.id}
                accessibilityRole="button"
                onPress={() => router.push('/conversation')}
                style={styles.conversationCard}
              >
                <View style={styles.conversationPhotoRow}>
                  <ProfileAvatar
                    emoji={conversation.avatarEmoji}
                    label={conversation.avatarLabel}
                    uri={conversation.avatarUrl}
                    size="medium"
                  />

                  <View style={styles.conversationTitleWrap}>
                    <Text style={styles.conversationTitle}>
                      {conversation.title}
                    </Text>
                    <Text style={styles.conversationSubtitle}>
                      {conversation.subtitle}
                    </Text>
                  </View>

                  <View style={styles.conversationMeta}>
                    <Text style={styles.conversationTime}>
                      {conversation.time}
                    </Text>

                    {conversation.unreadCount > 0 ? (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>
                          {conversation.unreadCount}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <Text style={styles.lastMessage}>{conversation.lastMessage}</Text>

                <View style={styles.contextCard}>
                  <View>
                    <Text style={styles.contextLabel}>
                      {conversation.contextLabel}
                    </Text>
                    <Text style={styles.contextValue}>
                      {conversation.contextValue}
                    </Text>
                  </View>

                  <Text style={styles.statusPill}>{conversation.status}</Text>
                </View>

                <View style={styles.conversationActions}>
                  <Text style={styles.openText}>Open conversation →</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.supportPanel}>
          <View style={styles.supportHeader}>
            <ProfileAvatar emoji="🐾" label="Support" size="small" />

            <View style={styles.supportHeaderCopy}>
              <Text style={styles.supportEyebrow}>SitGuru Support</Text>
              <Text style={styles.supportTitle}>
                Need help with a message or booking?
              </Text>
            </View>
          </View>

          <Text style={styles.supportText}>
            Start with support for account questions, profile setup, booking help,
            referral questions, or care details.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/conversation')}
            style={styles.supportButton}
          >
            <Text style={styles.supportButtonText}>Message Support</Text>
          </Pressable>
        </View>

        <View style={styles.bottomDockSpacer} />
      </View>

      <View style={styles.bottomDock}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/messages')}
          style={styles.dockPrimaryAction}
        >
          <Text style={styles.dockPrimaryText}>Messages</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/find-care')}
          style={styles.dockButton}
        >
          <Text style={styles.dockButtonText}>Find Care</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/role-selection')}
          style={styles.dockButton}
        >
          <Text style={styles.dockButtonText}>Roles</Text>
        </Pressable>
      </View>
    </SitGuruScreen>
  );
}

function ProfileAvatar({
  emoji,
  label,
  uri,
  size,
}: {
  emoji: string;
  label: string;
  uri?: string;
  size: 'small' | 'medium' | 'large';
}) {
  const avatarStyle =
    size === 'large'
      ? styles.avatarLarge
      : size === 'medium'
        ? styles.avatarMedium
        : styles.avatarSmall;

  const imageStyle =
    size === 'large'
      ? styles.avatarImageLarge
      : size === 'medium'
        ? styles.avatarImageMedium
        : styles.avatarImageSmall;

  const emojiStyle =
    size === 'large'
      ? styles.avatarEmojiLarge
      : size === 'medium'
        ? styles.avatarEmojiMedium
        : styles.avatarEmojiSmall;

  return (
    <View style={[styles.avatarBase, avatarStyle]}>
      {uri ? (
        <Image
          accessibilityLabel={`${label} profile photo`}
          alt={`${label} profile photo`}
          source={{ uri }}
          style={imageStyle}
          resizeMode="cover"
        />
      ) : (
        <Text style={emojiStyle}>{emoji}</Text>
      )}

      <View style={styles.avatarStatusDot} />

      <Text style={styles.avatarLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 18,
    paddingBottom: 14,
    paddingVertical: 4,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topLinkButton: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  topLinkText: {
    color: SitGuruColors.primary,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  heroPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 34,
    borderWidth: 1,
    elevation: 4,
    gap: 18,
    overflow: 'hidden',
    padding: 18,
  },
  heroPanelWide: {
    flexDirection: 'row',
  },
  heroCopy: {
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 4,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroBadgeText: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    color: SitGuruColors.text,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.1,
    lineHeight: 45,
  },
  subtitle: {
    color: SitGuruColors.textMuted,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 25,
  },
  heroActions: {
    gap: 10,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: SitGuruColors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  heroPhotoCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 30,
    borderWidth: 1,
    flex: 1,
    minHeight: 300,
    overflow: 'hidden',
    position: 'relative',
  },
  heroPhotoPlaceholder: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    padding: 22,
  },
  heroPhotoTitle: {
    color: SitGuruColors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroPhotoText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    maxWidth: 260,
    textAlign: 'center',
  },
  heroFloatingCard: {
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 22,
    bottom: 14,
    gap: 3,
    left: 14,
    padding: 14,
    position: 'absolute',
    right: 14,
  },
  heroFloatingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  heroFloatingText: {
    color: '#DCEFE2',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  filterRail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  filterPillActive: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  filterPillText: {
    color: SitGuruColors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  inboxPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 30,
    borderWidth: 1,
    elevation: 3,
    gap: 14,
    padding: 18,
  },
  sectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  sectionEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: SitGuruColors.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 31,
  },
  sectionBadge: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 999,
    borderWidth: 1,
    color: SitGuruColors.primary,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: 'uppercase',
  },
  conversationList: {
    gap: 12,
  },
  conversationCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 26,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  conversationPhotoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  conversationTitleWrap: {
    flex: 1,
    gap: 2,
  },
  conversationTitle: {
    color: SitGuruColors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  conversationSubtitle: {
    color: SitGuruColors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  conversationMeta: {
    alignItems: 'flex-end',
    gap: 5,
  },
  conversationTime: {
    color: SitGuruColors.textSoft,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  unreadBadge: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    height: 24,
    justifyContent: 'center',
    minWidth: 24,
    paddingHorizontal: 7,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  lastMessage: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  contextCard: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    padding: 12,
  },
  contextLabel: {
    color: SitGuruColors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  contextValue: {
    color: SitGuruColors.text,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 999,
    color: SitGuruColors.primary,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: 'uppercase',
  },
  conversationActions: {
    alignItems: 'flex-end',
  },
  openText: {
    color: SitGuruColors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  supportPanel: {
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 30,
    gap: 10,
    padding: 18,
  },
  supportHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  supportHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  supportEyebrow: {
    color: '#C9F26D',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  supportTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 29,
  },
  supportText: {
    color: '#DCEFE2',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  supportButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    justifyContent: 'center',
    marginTop: 4,
    minHeight: 52,
    paddingHorizontal: 18,
  },
  supportButtonText: {
    color: SitGuruColors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  avatarBase: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderWidth: 2,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  avatarSmall: {
    borderRadius: 26,
    height: 52,
    width: 52,
  },
  avatarMedium: {
    borderRadius: 34,
    height: 68,
    width: 68,
  },
  avatarLarge: {
    borderRadius: 50,
    height: 100,
    width: 100,
  },
  avatarImageSmall: {
    height: 52,
    width: 52,
  },
  avatarImageMedium: {
    height: 68,
    width: 68,
  },
  avatarImageLarge: {
    height: 100,
    width: 100,
  },
  avatarEmojiSmall: {
    fontSize: 22,
  },
  avatarEmojiMedium: {
    fontSize: 30,
  },
  avatarEmojiLarge: {
    fontSize: 44,
  },
  avatarStatusDot: {
    backgroundColor: SitGuruColors.primary,
    borderColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 2,
    bottom: 3,
    height: 13,
    position: 'absolute',
    right: 3,
    width: 13,
  },
  avatarLabel: {
    color: 'transparent',
    fontSize: 1,
    height: 1,
    position: 'absolute',
    width: 1,
  },
  bottomDockSpacer: {
    height: 88,
  },
  bottomDock: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    bottom: 16,
    elevation: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    left: 16,
    padding: 8,
    position: 'absolute',
    right: 16,
  },
  dockPrimaryAction: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 16,
  },
  dockPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  dockButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
    minWidth: 78,
    paddingHorizontal: 12,
  },
  dockButtonText: {
    color: SitGuruColors.text,
    fontSize: 12,
    fontWeight: '900',
  },
});