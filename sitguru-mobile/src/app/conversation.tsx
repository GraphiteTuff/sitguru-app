import { router } from 'expo-router';
import { useState } from 'react';
import {
    Image,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from 'react-native';

import SitGuruLogo from '@/components/SitGuruLogo';
import SitGuruScreen from '@/components/SitGuruScreen';
import { SitGuruColors } from '@/constants/colors';

type Message = {
  id: string;
  sender: 'pet-parent' | 'guru' | 'support';
  senderLabel: string;
  senderEmoji: string;
  senderAvatarUrl?: string;
  body: string;
  time: string;
};

const initialMessages: Message[] = [
  {
    id: '1',
    sender: 'pet-parent',
    senderLabel: 'Pet Parent',
    senderEmoji: '🐶',
    body: 'Hi! I’m looking for dog walking help next week around lunchtime.',
    time: '10:12 AM',
  },
  {
    id: '2',
    sender: 'guru',
    senderLabel: 'Guru',
    senderEmoji: '🏡',
    body: 'Thanks for reaching out. I can usually help with lunchtime walks. What ZIP code is care needed in?',
    time: '10:16 AM',
  },
  {
    id: '3',
    sender: 'pet-parent',
    senderLabel: 'Pet Parent',
    senderEmoji: '🐶',
    body: 'The care ZIP is 18951. Scout is friendly and usually walks for about 30 minutes.',
    time: '10:20 AM',
  },
];

const quickReplies = [
  'What dates do you need?',
  'Can you share pet details?',
  'I’m available.',
  'Please send a booking request.',
];

export default function ConversationScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 760;
  const [draftMessage, setDraftMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [notice, setNotice] = useState('');

  function sendMessage() {
    const cleanMessage = draftMessage.trim();

    if (!cleanMessage) {
      setNotice('Type a message before sending.');
      return;
    }

    const nextMessage: Message = {
      id: `message-${Date.now()}`,
      sender: 'pet-parent',
      senderLabel: 'You',
      senderEmoji: '🐶',
      body: cleanMessage,
      time: 'Now',
    };

    setMessages((currentMessages) => [...currentMessages, nextMessage]);
    setDraftMessage('');
    setNotice('Message added locally. Real messaging will connect to SitGuru conversations later.');
  }

  function useQuickReply(reply: string) {
    setDraftMessage(reply);
    setNotice('');
  }

  function showComingSoon(action: string) {
    setNotice(`${action} will open here after messaging, profiles, and booking requests are connected.`);
  }

  return (
    <SitGuruScreen scroll center={false} maxWidth={860}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <SitGuruLogo size="small" variant="symbol" />

          <View style={styles.topBarActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/notifications')}
              style={styles.topLinkButton}
            >
              <Text style={styles.topLinkText}>Notifications</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/messages')}
              style={styles.topLinkButton}
            >
              <Text style={styles.topLinkText}>Inbox</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.heroPanel, isWide && styles.heroPanelWide]}>
          <View style={styles.heroCopy}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Conversation</Text>
            </View>

            <Text style={styles.title}>Message before booking.</Text>

            <Text style={styles.subtitle}>
              Keep care questions, pet details, timing, and booking context in one
              SitGuru conversation.
            </Text>

            <View style={styles.heroActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/guru-profile')}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>View Profile</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/request-booking')}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Request Care</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/pawreport-live')}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>View Live PawReport</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/booking-details')}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>View Booking</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/guru-requests')}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>View Requests</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.heroPhotoCard}>
            <View style={styles.heroPhotoPlaceholder}>
              <View style={styles.profilePair}>
                <ProfileAvatar emoji="🐶" label="Pet Parent" size="large" />
                <ProfileAvatar emoji="🏡" label="Guru" size="large" />
              </View>

              <Text style={styles.heroPhotoTitle}>Profile avatars</Text>
              <Text style={styles.heroPhotoText}>
                Guru, Pet Parent, pet, and support profile photos will appear in conversation.
              </Text>
            </View>

            <View style={styles.heroFloatingCard}>
              <Text style={styles.heroFloatingTitle}>Care context</Text>
              <Text style={styles.heroFloatingText}>
                Pet, service, dates, notes, and booking status stay connected.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.contextPanel}>
          <View style={styles.contextHeader}>
            <View>
              <Text style={styles.contextEyebrow}>Booking context</Text>
              <Text style={styles.contextTitle}>Scout • Dog Walking</Text>
            </View>

            <Text style={styles.contextBadge}>Care question</Text>
          </View>

          <View style={styles.contextGrid}>
            <View style={styles.contextMiniCard}>
              <Text style={styles.contextMiniLabel}>Care ZIP</Text>
              <Text style={styles.contextMiniValue}>18951</Text>
            </View>

            <View style={styles.contextMiniCard}>
              <Text style={styles.contextMiniLabel}>Service</Text>
              <Text style={styles.contextMiniValue}>Dog Walking</Text>
            </View>

            <View style={styles.contextMiniCard}>
              <Text style={styles.contextMiniLabel}>Timing</Text>
              <Text style={styles.contextMiniValue}>Lunch</Text>
            </View>
          </View>

          <Text style={styles.contextNote}>
            Booking details, Pet Passports, care notes, and PawReport™ updates
            will stay connected to the conversation once the full flow is wired.
          </Text>
        </View>

        <View style={styles.threadPanel}>
          <View style={styles.threadHeader}>
            <View>
              <Text style={styles.threadEyebrow}>Thread</Text>
              <Text style={styles.threadTitle}>Local Guru Conversation</Text>
            </View>

            <Text style={styles.threadBadge}>{messages.length} messages</Text>
          </View>

          <View style={styles.messageList}>
            {messages.map((message) => {
              const isPetParent = message.sender === 'pet-parent';

              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageRow,
                    isPetParent ? styles.messageRowRight : styles.messageRowLeft,
                  ]}
                >
                  {!isPetParent ? (
                    <ProfileAvatar
                      emoji={message.senderEmoji}
                      label={message.senderLabel}
                      uri={message.senderAvatarUrl}
                      size="small"
                    />
                  ) : null}

                  <View
                    style={[
                      styles.messageBubble,
                      isPetParent ? styles.messageBubbleRight : styles.messageBubbleLeft,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageSender,
                        isPetParent && styles.messageSenderRight,
                      ]}
                    >
                      {message.senderLabel} • {message.time}
                    </Text>

                    <Text
                      style={[
                        styles.messageBody,
                        isPetParent && styles.messageBodyRight,
                      ]}
                    >
                      {message.body}
                    </Text>
                  </View>

                  {isPetParent ? (
                    <ProfileAvatar
                      emoji={message.senderEmoji}
                      label={message.senderLabel}
                      uri={message.senderAvatarUrl}
                      size="small"
                    />
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.quickReplyPanel}>
          <Text style={styles.quickReplyEyebrow}>Quick replies</Text>

          <View style={styles.quickReplyGrid}>
            {quickReplies.map((reply) => (
              <Pressable
                key={reply}
                accessibilityRole="button"
                onPress={() => useQuickReply(reply)}
                style={styles.quickReplyPill}
              >
                <Text style={styles.quickReplyText}>{reply}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.composerPanel}>
          <View style={styles.composerHeader}>
            <ProfileAvatar emoji="🐶" label="You" size="small" />
            <View style={styles.composerHeaderCopy}>
              <Text style={styles.composerLabel}>Message as you</Text>
              <Text style={styles.composerHelper}>
                Your profile avatar will show beside sent messages.
              </Text>
            </View>
          </View>

          <TextInput
            multiline
            onChangeText={(value) => {
              setDraftMessage(value);
              setNotice('');
            }}
            placeholder="Write a message..."
            placeholderTextColor={SitGuruColors.textSoft}
            style={styles.composerInput}
            value={draftMessage}
          />

          <View style={styles.composerActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => showComingSoon('Attachment upload')}
              style={styles.composerSecondaryButton}
            >
              <Text style={styles.composerSecondaryText}>Attach</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={sendMessage}
              style={styles.composerPrimaryButton}
            >
              <Text style={styles.composerPrimaryText}>Send</Text>
            </Pressable>
          </View>

          {notice ? (
            <View style={styles.noticePanel}>
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.supportPanel}>
          <View style={styles.supportHeader}>
            <ProfileAvatar emoji="🐾" label="Support" size="small" />

            <View style={styles.supportHeaderCopy}>
              <Text style={styles.supportEyebrow}>Need help?</Text>
              <Text style={styles.supportTitle}>
                Bring SitGuru Support into the conversation.
              </Text>
            </View>
          </View>

          <Text style={styles.supportText}>
            Support can help with setup, booking questions, messages, safety
            concerns, payment timing, and care details.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => showComingSoon('Support handoff')}
            style={styles.supportButton}
          >
            <Text style={styles.supportButtonText}>Ask Support</Text>
          </Pressable>
        </View>

        <View style={styles.bottomDockSpacer} />
      </View>

      <View style={styles.bottomDock}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/messages')}
          style={styles.dockButton}
        >
          <Text style={styles.dockButtonText}>Inbox</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/request-booking')}
          style={styles.dockPrimaryAction}
        >
          <Text style={styles.dockPrimaryText}>Request Care</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/find-care')}
          style={styles.dockButton}
        >
          <Text style={styles.dockButtonText}>Find</Text>
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
  size: 'small' | 'large';
}) {
  const avatarStyle = size === 'large' ? styles.avatarLarge : styles.avatarSmall;
  const imageStyle = size === 'large' ? styles.avatarImageLarge : styles.avatarImageSmall;
  const emojiStyle = size === 'large' ? styles.avatarEmojiLarge : styles.avatarEmojiSmall;

  return (
    <View style={[styles.avatarBase, avatarStyle]}>
      {uri ? (
        <Image source={{ uri }} style={imageStyle} resizeMode="cover" />
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
  profilePair: {
    flexDirection: 'row',
    gap: 12,
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
  contextPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 30,
    borderWidth: 1,
    elevation: 3,
    gap: 13,
    padding: 18,
  },
  contextHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  contextEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  contextTitle: {
    color: SitGuruColors.text,
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 30,
    marginTop: 2,
  },
  contextBadge: {
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
  contextGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  contextMiniCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    minWidth: 130,
    padding: 13,
  },
  contextMiniLabel: {
    color: SitGuruColors.textSoft,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  contextMiniValue: {
    color: SitGuruColors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  contextNote: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
  },
  threadPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 30,
    borderWidth: 1,
    elevation: 3,
    gap: 14,
    padding: 18,
  },
  threadHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  threadEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  threadTitle: {
    color: SitGuruColors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 29,
    marginTop: 2,
  },
  threadBadge: {
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
  messageList: {
    gap: 12,
  },
  messageRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    borderRadius: 22,
    gap: 5,
    maxWidth: '78%',
    padding: 13,
  },
  messageBubbleLeft: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderWidth: 1,
  },
  messageBubbleRight: {
    backgroundColor: SitGuruColors.primary,
  },
  messageSender: {
    color: SitGuruColors.textSoft,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  messageSenderRight: {
    color: '#DCEFE2',
  },
  messageBody: {
    color: SitGuruColors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  messageBodyRight: {
    color: '#FFFFFF',
  },
  quickReplyPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 26,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  quickReplyEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  quickReplyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickReplyPill: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  quickReplyText: {
    color: SitGuruColors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  composerPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 30,
    borderWidth: 1,
    elevation: 3,
    gap: 10,
    padding: 18,
  },
  composerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  composerHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  composerLabel: {
    color: SitGuruColors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  composerHelper: {
    color: SitGuruColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  composerInput: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    color: SitGuruColors.text,
    fontSize: 15,
    fontWeight: '700',
    minHeight: 110,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  composerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  composerSecondaryButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
    minWidth: 110,
    paddingHorizontal: 16,
  },
  composerSecondaryText: {
    color: SitGuruColors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  composerPrimaryButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 16,
  },
  composerPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  noticePanel: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  noticeText: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
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
    borderRadius: 24,
    height: 48,
    width: 48,
  },
  avatarLarge: {
    borderRadius: 50,
    height: 100,
    width: 100,
  },
  avatarImageSmall: {
    height: 48,
    width: 48,
  },
  avatarImageLarge: {
    height: 100,
    width: 100,
  },
  avatarEmojiSmall: {
    fontSize: 21,
  },
  avatarEmojiLarge: {
    fontSize: 44,
  },
  avatarStatusDot: {
    backgroundColor: SitGuruColors.primary,
    borderColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 2,
    bottom: 2,
    height: 12,
    position: 'absolute',
    right: 2,
    width: 12,
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
  },  topBarActions: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

});