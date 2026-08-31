import { router, useLocalSearchParams } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import {
  ArrowUpRight,
  Cat,
  ChevronLeft,
  Compass,
  Dog,
  MapPin,
  PawPrint,
  Send,
  Sparkles,
  Square,
  Star,
  Trash2,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BubblePressable from '@/components/BubblePressable';
import { SitGuruIcon } from '@/components/SitGuruIcon';
import SitGuruScreen from '@/components/SitGuruScreen';
import {
  getCompanion,
  type AiCompanionProfile,
  type CompanionSuggestion,
} from '@/constants/companions';
import { AppFonts } from '@/constants/fonts';
import {
  setThemePreference,
  useThemePreference,
  type SitGuruThemePreference,
} from '@/hooks/use-color-scheme';
import { useThemeMode } from '@/hooks/use-theme';
import {
  useCompanionChat,
  type CompanionChatMessage,
} from '@/hooks/data/useCompanionChat';
import {
  companionAvatarUrl,
  companionWebUrl,
} from '@/lib/ai/companion-api';
import {
  parseCompanionMessage,
  SITGURU_OFFICIAL_HANDLE,
  SITGURU_SOCIAL_LINKS,
  stripTrailingPartialMarker,
  toPlainChatText,
  type CompanionCtaDef,
  type GuruChatSnapshot,
} from '@/lib/ai/chat-markers';

const THEME_OPTIONS: Array<{
  label: string;
  value: SitGuruThemePreference;
  icon: 'sun' | 'moon';
}> = [
  { label: 'Light', value: 'light', icon: 'sun' },
  { label: 'Dark', value: 'dark', icon: 'moon' },
];

type ScreenStyles = ReturnType<typeof createStyles>;
type ScreenPalette = ReturnType<typeof getPalette>;

/**
 * Native in-app chat for one AI companion (Rogue / Taco / Scout / Delilah).
 *
 * Personas, tools, and marker generation all live on the SitGuru web API.
 * This screen streams the reply token by token, renders the CTA / guru-card /
 * social markers the server emits, and persists the thread per companion.
 */
export default function AiCompanionScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const companion = getCompanion(
    Array.isArray(params.id) ? params.id[0] : params.id,
  );

  const isWebPreview = Platform.OS === 'web';
  const themeMode = useThemeMode();
  const themePreference = useThemePreference();
  const isDark = themeMode === 'dark';
  const palette = getPalette(isDark);
  const styles = createStyles(isDark);
  const insets = useSafeAreaInsets();

  const threadRef = useRef<ScrollView | null>(null);
  const composerRef = useRef<TextInput | null>(null);

  const [draft, setDraft] = useState('');
  const {
    messages,
    hydrated,
    streaming,
    error,
    sendMessage,
    clearChat,
    stop,
  } = useCompanionChat(companion);

  const hasConversation = messages.length > 0;
  const lastMessage = messages[messages.length - 1];
  const awaitingFirstToken =
    streaming && (!lastMessage || !lastMessage.content.trim());

  useEffect(() => {
    const timeout = setTimeout(() => {
      threadRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timeout);
  }, [messages.length]);

  function submit(text: string) {
    const clean = text.trim();
    if (!clean || streaming) return;

    sendMessage(clean);
    setDraft('');
    // Project rule: the composer keeps focus straight after a send.
    composerRef.current?.focus();
    setTimeout(() => threadRef.current?.scrollToEnd({ animated: true }), 60);
  }

  function openCompanionCta(def: CompanionCtaDef) {
    if (def.action.kind === 'route') {
      router.push({
        pathname: def.action.pathname,
        params: def.action.params ?? {},
      } as never);
      return;
    }

    if (def.action.kind === 'web') {
      void openBrowserAsync(companionWebUrl(def.action.path), {
        presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
      });
    }
  }

  function openGuruCard(card: GuruChatSnapshot) {
    router.push({
      pathname: '/guru-profile',
      params: { guruId: card.id, slug: card.slug },
    } as never);
  }

  function openSocialLink(url: string) {
    void openBrowserAsync(url, {
      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
    });
  }

  return (
    <SitGuruScreen center={isWebPreview} maxWidth={620}>
      <View style={[styles.previewCanvas, !isWebPreview && styles.previewCanvasNative]}>
        <View style={[styles.deviceFrame, !isWebPreview && styles.deviceFrameNative]}>
          {isWebPreview ? <View style={styles.deviceTopSpeaker} /> : null}

          <View style={[styles.phoneShell, !isWebPreview && styles.phoneShellNative]}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={
                Platform.OS === 'ios' ? Math.max(insets.top, 8) : 0
              }
              style={styles.keyboardView}
            >
              {isWebPreview ? (
                <PhoneStatusBar palette={palette} styles={styles} />
              ) : null}

              <View style={styles.header}>
                <BubblePressable
                  accessibilityLabel="Go back"
                  accessibilityRole="button"
                  onPress={() => router.back()}
                  scaleTo={0.88}
                  style={styles.headerButton}
                >
                  <ChevronLeft color={palette.title} size={20} strokeWidth={2.6} />
                </BubblePressable>

                <View style={styles.headerIdentity}>
                  <CompanionAvatar
                    companion={companion}
                    isDark={isDark}
                    size="header"
                    styles={styles}
                  />

                  <View style={styles.headerCopy}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                      {companion.name}
                    </Text>
                    <Text style={styles.headerSubtitle} numberOfLines={1}>
                      {streaming ? 'Typing…' : companion.title}
                    </Text>
                  </View>
                </View>

                <View style={styles.headerActions}>
                  <View style={styles.modeToggle}>
                    {THEME_OPTIONS.map((option) => {
                      const active = themePreference === option.value;

                      return (
                        <BubblePressable
                          key={option.value}
                          accessibilityLabel={`Switch to ${option.label} mode`}
                          accessibilityRole="button"
                          onPress={() => setThemePreference(option.value)}
                          scaleTo={0.88}
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
                        </BubblePressable>
                      );
                    })}
                  </View>

                  <BubblePressable
                    accessibilityLabel={`Clear the ${companion.name} chat`}
                    accessibilityRole="button"
                    disabled={!hasConversation}
                    onPress={clearChat}
                    scaleTo={0.88}
                    style={[
                      styles.headerButton,
                      !hasConversation && styles.headerButtonDisabled,
                    ]}
                  >
                    <Trash2
                      color={hasConversation ? palette.title : palette.soft}
                      size={17}
                      strokeWidth={2.4}
                    />
                  </BubblePressable>
                </View>
              </View>

              <View style={styles.body}>
                <ScrollView
                  ref={threadRef}
                  contentContainerStyle={styles.messageList}
                  keyboardShouldPersistTaps="handled"
                  onContentSizeChange={() =>
                    threadRef.current?.scrollToEnd({ animated: false })
                  }
                  showsVerticalScrollIndicator={false}
                  style={styles.threadScroll}
                >
                  <CompanionIntro
                    companion={companion}
                    isDark={isDark}
                    palette={palette}
                    styles={styles}
                  />

                  {messages.map((message) =>
                    message.role === 'user' ? (
                      <UserBubble
                        key={message.id}
                        message={message}
                        styles={styles}
                      />
                    ) : (
                      <AssistantBubble
                        key={message.id}
                        companion={companion}
                        isDark={isDark}
                        message={message}
                        onCta={openCompanionCta}
                        onGuruCard={openGuruCard}
                        onSocialLink={openSocialLink}
                        palette={palette}
                        streaming={streaming}
                        styles={styles}
                      />
                    ),
                  )}

                  {awaitingFirstToken ? (
                    <View style={styles.typingRow}>
                      <CompanionAvatar
                        companion={companion}
                        isDark={isDark}
                        size="message"
                        styles={styles}
                      />
                      <View style={styles.typingBubble}>
                        <TypingDots color={palette.primary} styles={styles} />
                      </View>
                    </View>
                  ) : null}

                  <View style={styles.threadBottomSpace} />
                </ScrollView>

                {error ? (
                  <View style={styles.noticeCard}>
                    <Text style={styles.noticeText}>{error}</Text>
                  </View>
                ) : null}

                {hydrated && !hasConversation ? (
                  <View style={styles.suggestionsWrap}>
                    <Text style={styles.suggestionsLabel}>
                      Try asking {companion.name}
                    </Text>
                    <ScrollView
                      contentContainerStyle={styles.suggestionsContent}
                      horizontal
                      keyboardShouldPersistTaps="handled"
                      showsHorizontalScrollIndicator={false}
                    >
                      {companion.suggestions.map((suggestion) => (
                        <SuggestionChip
                          key={suggestion.id}
                          onPress={() => submit(suggestion.prompt)}
                          palette={palette}
                          styles={styles}
                          suggestion={suggestion}
                        />
                      ))}
                    </ScrollView>
                  </View>
                ) : null}

                <View style={styles.composer}>
                  <View style={styles.composerInputWrap}>
                    <TextInput
                      ref={composerRef}
                      multiline
                      onChangeText={setDraft}
                      onFocus={() =>
                        setTimeout(
                          () => threadRef.current?.scrollToEnd({ animated: true }),
                          120,
                        )
                      }
                      onSubmitEditing={() => submit(draft)}
                      placeholder={companion.composerPlaceholder}
                      placeholderTextColor={palette.placeholder}
                      style={styles.composerInput}
                      value={draft}
                    />
                  </View>

                  {streaming ? (
                    <BubblePressable
                      accessibilityLabel="Stop generating"
                      accessibilityRole="button"
                      onPress={stop}
                      scaleTo={0.88}
                      style={styles.stopButton}
                    >
                      <Square color="#FFFFFF" fill="#FFFFFF" size={13} />
                    </BubblePressable>
                  ) : (
                    <BubblePressable
                      accessibilityLabel={`Send to ${companion.name}`}
                      accessibilityRole="button"
                      disabled={!draft.trim()}
                      onPress={() => submit(draft)}
                      scaleTo={0.88}
                      style={[
                        styles.sendButton,
                        !draft.trim() && styles.sendButtonDisabled,
                      ]}
                    >
                      <Send color="#FFFFFF" size={17} strokeWidth={2.4} />
                    </BubblePressable>
                  )}
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>

          {isWebPreview ? <View style={styles.homeIndicator} /> : null}
        </View>
      </View>
    </SitGuruScreen>
  );
}

function CompanionIntro({
  companion,
  isDark,
  palette,
  styles,
}: {
  companion: AiCompanionProfile;
  isDark: boolean;
  palette: ScreenPalette;
  styles: ScreenStyles;
}) {
  return (
    <View style={styles.introCard}>
      <View style={styles.introTop}>
        <CompanionAvatar
          companion={companion}
          isDark={isDark}
          size="intro"
          styles={styles}
        />
        <View style={styles.introCopy}>
          <Text style={styles.introName}>{companion.name}</Text>
          <Text style={styles.introRole}>{companion.title}</Text>
          <Text style={styles.introAudience}>For {companion.audience}</Text>
        </View>
      </View>

      <View style={styles.introGreetingRow}>
        <Sparkles color={palette.primary} size={13} strokeWidth={2.4} />
        <Text style={styles.introGreeting}>{companion.greeting}</Text>
      </View>

      <BubblePressable
        accessibilityRole="button"
        onPress={() => router.push(companion.setupRoute)}
        style={styles.introSecondaryButton}
      >
        <Text style={styles.introSecondaryText}>
          Open {companion.benefitsLabel}
        </Text>
        <ArrowUpRight color={palette.primary} size={14} strokeWidth={2.6} />
      </BubblePressable>
    </View>
  );
}

function SuggestionChip({
  onPress,
  palette,
  styles,
  suggestion,
}: {
  onPress: () => void;
  palette: ScreenPalette;
  styles: ScreenStyles;
  suggestion: CompanionSuggestion;
}) {
  return (
    <BubblePressable
      accessibilityRole="button"
      onPress={onPress}
      scaleTo={0.88}
      style={styles.suggestionChip}
    >
      <Sparkles color={palette.primary} size={12} strokeWidth={2.4} />
      <Text style={styles.suggestionChipText}>{suggestion.label}</Text>
    </BubblePressable>
  );
}

function UserBubble({
  message,
  styles,
}: {
  message: CompanionChatMessage;
  styles: ScreenStyles;
}) {
  return (
    <View style={styles.userRow}>
      <View style={styles.userBubble}>
        <Text style={styles.userBubbleText}>{message.content}</Text>
      </View>
    </View>
  );
}

function AssistantBubble({
  companion,
  isDark,
  message,
  onCta,
  onGuruCard,
  onSocialLink,
  palette,
  streaming,
  styles,
}: {
  companion: AiCompanionProfile;
  isDark: boolean;
  message: CompanionChatMessage;
  onCta: (def: CompanionCtaDef) => void;
  onGuruCard: (card: GuruChatSnapshot) => void;
  onSocialLink: (url: string) => void;
  palette: ScreenPalette;
  streaming: boolean;
  styles: ScreenStyles;
}) {
  const isStreamingBubble = streaming && message.state === 'streaming';

  const parsed = useMemo(() => {
    const source = isStreamingBubble
      ? stripTrailingPartialMarker(message.content)
      : message.content;
    const result = parseCompanionMessage(source);
    return { ...result, text: toPlainChatText(result.text) };
  }, [isStreamingBubble, message.content]);

  const showSocialPack = parsed.ctas.some((def) => def.action.kind === 'social');
  const buttonCtas = parsed.ctas.filter((def) => def.action.kind !== 'social');
  const isError = message.state === 'error';

  if (!parsed.text && !parsed.guruCards.length && !parsed.ctas.length) {
    return null;
  }

  return (
    <View style={styles.assistantRow}>
      <CompanionAvatar
        companion={companion}
        isDark={isDark}
        size="message"
        styles={styles}
      />

      <View style={styles.assistantGroup}>
        <Text style={styles.assistantName}>{companion.name}</Text>

        {parsed.text ? (
          <View
            style={[
              styles.assistantBubble,
              isError && styles.assistantBubbleError,
            ]}
          >
            <Text
              style={[
                styles.assistantBubbleText,
                isError && styles.assistantBubbleTextError,
              ]}
            >
              {parsed.text}
            </Text>
          </View>
        ) : null}

        {parsed.guruCards.map((card) => (
          <GuruSnapshotCard
            card={card}
            key={card.slug}
            onPress={() => onGuruCard(card)}
            palette={palette}
            styles={styles}
          />
        ))}

        {buttonCtas.length ? (
          <View style={styles.ctaStack}>
            {buttonCtas.map((def) => (
              <BubblePressable
                accessibilityRole="button"
                key={def.id}
                onPress={() => onCta(def)}
                style={styles.ctaButton}
              >
                <Text style={styles.ctaButtonText}>{def.label}</Text>
                <ArrowUpRight color="#FFFFFF" size={14} strokeWidth={2.6} />
              </BubblePressable>
            ))}
          </View>
        ) : null}

        {showSocialPack ? (
          <SocialFollowPack onOpen={onSocialLink} styles={styles} />
        ) : null}
      </View>
    </View>
  );
}

function GuruSnapshotCard({
  card,
  onPress,
  palette,
  styles,
}: {
  card: GuruChatSnapshot;
  onPress: () => void;
  palette: ScreenPalette;
  styles: ScreenStyles;
}) {
  const [photoFailed, setPhotoFailed] = useState(false);

  const rateLabel =
    typeof card.rate === 'number' ? `$${Math.round(card.rate)}/visit` : null;
  const ratingLabel =
    typeof card.rating === 'number' ? card.rating.toFixed(1) : null;

  return (
    <BubblePressable
      accessibilityLabel={`Open ${card.name}'s Guru profile`}
      accessibilityRole="button"
      onPress={onPress}
      scaleTo={0.97}
      style={styles.guruCard}
    >
      <View style={styles.guruAvatar}>
        {card.photoUrl && !photoFailed ? (
          <Image
            alt={`${card.name} profile photo`}
            onError={() => setPhotoFailed(true)}
            resizeMode="cover"
            source={{ uri: card.photoUrl }}
            style={styles.guruAvatarImage}
          />
        ) : (
          <View style={styles.guruAvatarFallback}>
            <PawPrint color={palette.primaryDark} size={18} strokeWidth={2.4} />
          </View>
        )}
      </View>

      <View style={styles.guruCopy}>
        <Text style={styles.guruName} numberOfLines={1}>
          {card.name}
        </Text>

        <View style={styles.guruMetaRow}>
          <MapPin color={palette.muted} size={11} strokeWidth={2.4} />
          <Text style={styles.guruMetaText} numberOfLines={1}>
            {card.location}
          </Text>
        </View>

        {card.services.length ? (
          <Text style={styles.guruServices} numberOfLines={1}>
            {card.services.join(' · ')}
          </Text>
        ) : null}

        <View style={styles.guruMetaRow}>
          {ratingLabel ? (
            <>
              <Star color="#E8A317" fill="#E8A317" size={11} />
              <Text style={styles.guruMetaText}>
                {ratingLabel}
                {card.reviewCount ? ` (${card.reviewCount})` : ''}
              </Text>
            </>
          ) : null}
          {rateLabel ? (
            <Text style={styles.guruRate}>{rateLabel}</Text>
          ) : null}
        </View>
      </View>

      <ArrowUpRight color={palette.primary} size={16} strokeWidth={2.6} />
    </BubblePressable>
  );
}

function SocialFollowPack({
  onOpen,
  styles,
}: {
  onOpen: (url: string) => void;
  styles: ScreenStyles;
}) {
  return (
    <View style={styles.socialPack}>
      <Text style={styles.socialTitle}>Follow {SITGURU_OFFICIAL_HANDLE}</Text>
      <Text style={styles.socialSubtitle}>
        Events, pack moments, and community highlights — same handle on every
        platform.
      </Text>

      <View style={styles.socialRow}>
        {SITGURU_SOCIAL_LINKS.map((link) => (
          <BubblePressable
            accessibilityLabel={`Follow SitGuru on ${link.label}`}
            accessibilityRole="button"
            key={link.id}
            onPress={() => onOpen(link.url)}
            scaleTo={0.88}
            style={styles.socialButton}
          >
            <Text style={styles.socialButtonText}>{link.label}</Text>
          </BubblePressable>
        ))}
      </View>
    </View>
  );
}

function CompanionAvatar({
  companion,
  isDark,
  size,
  styles,
}: {
  companion: AiCompanionProfile;
  isDark: boolean;
  size: 'header' | 'message' | 'intro';
  styles: ScreenStyles;
}) {
  // Tracked by url so switching companion clears the previous failure.
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const uri = companionAvatarUrl(companion);
  const failed = failedUri === uri;

  const wrapperStyle =
    size === 'header'
      ? styles.avatarHeader
      : size === 'intro'
        ? styles.avatarIntro
        : styles.avatarMessage;
  const imageStyle =
    size === 'header'
      ? styles.avatarHeaderImage
      : size === 'intro'
        ? styles.avatarIntroImage
        : styles.avatarMessageImage;
  const iconSize = size === 'intro' ? 26 : size === 'header' ? 17 : 15;

  // Rogue is a German Shorthaired Pointer, Taco a tuxedo cat, Scout the
  // Guru matching officer — each falls back to its own mark.
  const FallbackIcon =
    companion.id === 'taco'
      ? Cat
      : companion.id === 'scout'
        ? Compass
        : companion.id === 'delilah'
          ? MapPin
          : Dog;

  return (
    <View style={[styles.avatarBase, wrapperStyle]}>
      {uri && !failed ? (
        <Image
          alt={`${companion.name}, ${companion.title}`}
          onError={() => setFailedUri(uri)}
          resizeMode="cover"
          source={{ uri }}
          style={imageStyle}
        />
      ) : (
        <View style={[styles.avatarFallback, isDark && styles.avatarFallbackDark]}>
          <FallbackIcon
            color={isDark ? '#8BE8B4' : '#0B6B45'}
            size={iconSize}
            strokeWidth={2.4}
          />
        </View>
      )}
    </View>
  );
}

function TypingDots({
  color,
  styles,
}: {
  color: string;
  styles: ScreenStyles;
}) {
  return (
    <View style={styles.typingDots}>
      <TypingDot color={color} delay={0} styles={styles} />
      <TypingDot color={color} delay={160} styles={styles} />
      <TypingDot color={color} delay={320} styles={styles} />
    </View>
  );
}

function TypingDot({
  color,
  delay,
  styles,
}: {
  color: string;
  delay: number;
  styles: ScreenStyles;
}) {
  const [opacity] = useState(() => new Animated.Value(0.3));

  useEffect(() => {
    // The delay sits outside the loop so the three dots stay in step.
    const animation = Animated.sequence([
      Animated.delay(delay),
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 320,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 320,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ),
    ]);

    animation.start();

    return () => animation.stop();
  }, [delay, opacity]);

  return (
    <Animated.View
      style={[styles.typingDot, { backgroundColor: color, opacity }]}
    />
  );
}

function PhoneStatusBar({
  palette,
  styles,
}: {
  palette: ScreenPalette;
  styles: ScreenStyles;
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
    brand: '#0D5C3A',
    ownBubble: '#0B7A4B',
    otherBubble: isDark ? '#123124' : '#FFFFFF',
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
    headerButtonDisabled: {
      opacity: 0.45,
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
    headerSubtitle: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 12,
      marginTop: 1,
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
    body: {
      flex: 1,
      paddingHorizontal: 10,
      paddingTop: 8,
    },
    threadScroll: {
      flex: 1,
    },
    messageList: {
      paddingBottom: 8,
      paddingHorizontal: 2,
    },
    introCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 10,
      marginBottom: 12,
      padding: 12,
    },
    introTop: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    introCopy: {
      flex: 1,
      minWidth: 0,
    },
    introName: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 18,
      lineHeight: 22,
    },
    introRole: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
      letterSpacing: 1.1,
      marginTop: 2,
      textTransform: 'uppercase',
    },
    introAudience: {
      color: palette.muted,
      fontFamily: AppFonts.semiBold,
      fontSize: 10,
      marginTop: 3,
    },
    introGreetingRow: {
      alignItems: 'flex-start',
      backgroundColor: palette.surfaceSoft,
      borderRadius: 14,
      flexDirection: 'row',
      gap: 7,
      padding: 10,
    },
    introGreeting: {
      color: palette.text,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 11,
      lineHeight: 16,
    },
    introSecondaryButton: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.borderStrong,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      minHeight: 40,
    },
    introSecondaryText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
    },
    userRow: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: 8,
    },
    userBubble: {
      backgroundColor: palette.ownBubble,
      borderBottomRightRadius: 6,
      borderRadius: 18,
      maxWidth: '82%',
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    userBubbleText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.medium,
      fontSize: 11,
      lineHeight: 16,
    },
    assistantRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 7,
      marginBottom: 10,
    },
    assistantGroup: {
      alignItems: 'flex-start',
      flex: 1,
      gap: 7,
      minWidth: 0,
    },
    assistantName: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 8,
      marginLeft: 4,
    },
    assistantBubble: {
      backgroundColor: palette.otherBubble,
      borderBottomLeftRadius: 6,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      maxWidth: '100%',
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    assistantBubbleError: {
      backgroundColor: isDark ? '#3B1E1A' : '#FFF0ED',
      borderColor: '#E9A398',
    },
    assistantBubbleText: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 11,
      lineHeight: 17,
    },
    assistantBubbleTextError: {
      color: isDark ? '#F3B5AA' : '#9D3123',
    },
    ctaStack: {
      gap: 6,
      width: '100%',
    },
    ctaButton: {
      alignItems: 'center',
      backgroundColor: palette.brand,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      minHeight: 42,
      paddingHorizontal: 14,
    },
    ctaButtonText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
    },
    guruCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.borderStrong,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 9,
      minHeight: 66,
      padding: 9,
      width: '100%',
    },
    guruAvatar: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderRadius: 13,
      height: 44,
      justifyContent: 'center',
      overflow: 'hidden',
      width: 44,
    },
    guruAvatarImage: {
      height: 44,
      width: 44,
    },
    guruAvatarFallback: {
      alignItems: 'center',
      backgroundColor: isDark ? '#183A2A' : '#E9F7EE',
      height: '100%',
      justifyContent: 'center',
      width: '100%',
    },
    guruCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    guruName: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
      lineHeight: 16,
    },
    guruMetaRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
      minWidth: 0,
    },
    guruMetaText: {
      color: palette.muted,
      flexShrink: 1,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 12,
    },
    guruServices: {
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 9,
      lineHeight: 12,
    },
    guruRate: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    socialPack: {
      backgroundColor: palette.surface,
      borderColor: palette.borderStrong,
      borderRadius: 16,
      borderWidth: 1,
      padding: 10,
      width: '100%',
    },
    socialTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
    },
    socialSubtitle: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
      marginTop: 2,
    },
    socialRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
    },
    socialButton: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.borderStrong,
      borderRadius: 999,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 34,
      paddingHorizontal: 12,
    },
    socialButtonText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
    },
    typingRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 7,
      marginBottom: 10,
    },
    typingBubble: {
      backgroundColor: palette.otherBubble,
      borderBottomLeftRadius: 6,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 11,
    },
    typingDots: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
    },
    typingDot: {
      borderRadius: 999,
      height: 6,
      width: 6,
    },
    threadBottomSpace: {
      height: 4,
    },
    noticeCard: {
      backgroundColor: isDark ? '#3B1E1A' : '#FFF0ED',
      borderColor: '#E9A398',
      borderRadius: 13,
      borderWidth: 1,
      marginTop: 6,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    noticeText: {
      color: isDark ? '#F3B5AA' : '#9D3123',
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
      textAlign: 'center',
    },
    suggestionsWrap: {
      borderTopColor: palette.border,
      borderTopWidth: 1,
      marginHorizontal: -10,
      paddingTop: 7,
    },
    suggestionsLabel: {
      color: palette.soft,
      fontFamily: AppFonts.bold,
      fontSize: 8,
      letterSpacing: 0.8,
      marginBottom: 6,
      paddingHorizontal: 10,
      textTransform: 'uppercase',
    },
    suggestionsContent: {
      gap: 6,
      paddingHorizontal: 10,
      paddingRight: 20,
    },
    suggestionChip: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 5,
      minHeight: 34,
      paddingHorizontal: 11,
    },
    suggestionChipText: {
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 9,
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
    composerInputWrap: {
      flex: 1,
      minHeight: 40,
    },
    composerInput: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 11,
      maxHeight: 92,
      minHeight: 40,
      paddingHorizontal: 6,
      paddingVertical: 10,
      textAlignVertical: 'top',
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
    stopButton: {
      alignItems: 'center',
      backgroundColor: isDark ? '#8A3B31' : '#B4483A',
      borderRadius: 999,
      height: 40,
      justifyContent: 'center',
      width: 40,
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
    avatarHeaderImage: {
      height: 34,
      width: 34,
    },
    avatarMessage: {
      borderRadius: 999,
      height: 30,
      width: 30,
    },
    avatarMessageImage: {
      height: 30,
      width: 30,
    },
    avatarIntro: {
      borderRadius: 999,
      height: 56,
      width: 56,
    },
    avatarIntroImage: {
      height: 56,
      width: 56,
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
