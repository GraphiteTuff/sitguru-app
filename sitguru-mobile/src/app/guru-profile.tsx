import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  CalendarCheck2,
  Check,
  Clock3,
  Heart,
  MapPin,
  MessageCircle,
  PawPrint,
  RefreshCw,
  ShieldCheck,
  Star,
  UserRound,
  WalletCards
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import { SitGuruIcon } from '@/components/SitGuruIcon';
import SitGuruProfilePhotoFrame from '@/components/SitGuruProfilePhotoFrame';
import SitGuruScreen from '@/components/SitGuruScreen';
import MarketplaceTrustNote from '@/components/mobile/MarketplaceTrustNote';
import SitGuruTabBar from '@/components/SitGuruTabBar';
import { AppFonts } from '@/constants/fonts';
import { getGuruVerification, MARKETPLACE_TRUST_LINES } from '@/lib/marketplace-trust';
import {
  setThemePreference,
  type SitGuruThemePreference,
  useThemePreference,
} from '@/hooks/use-color-scheme';
import { useThemeMode } from '@/hooks/use-theme';
import { loadPublicGuruCatalog } from '@/lib/gurus/public-catalog';
import { resolveSupabaseStorageUrl } from '@/lib/storage';
import {
  getGuruBookingLabel,
  getGuruDisplayName,
  getGuruFirstName,
  getGuruLocationLabel,
  getGuruPhotoUrl,
  getGuruProfileNotice,
  getGuruRateLabel,
  getGuruRatingLabel,
  getGuruSearchBadge,
  getGuruServices,
  getGuruSlug,
  isGuruBookable,
  isKnownPreviewGuru,
  type PublicGuruProfile,
} from '@/types/guru';

type ThemeOption = {
  icon: 'sun' | 'moon';
  label: string;
  value: SitGuruThemePreference;
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    icon: 'sun',
    label: 'Light',
    value: 'light',
  },
  {
    icon: 'moon',
    label: 'Dark',
    value: 'dark',
  },
];

const safetyNotes = [...MARKETPLACE_TRUST_LINES];

async function loadPublicGurus() {
  return loadPublicGuruCatalog();
}

export default function GuruProfileScreen() {
  const {
    guruId,
    slug,
  } = useLocalSearchParams<{
    guruId?: string;
    slug?: string;
  }>();

  const { width } = useWindowDimensions();
  const isWebPreview = Platform.OS === 'web';
  const isTablet = Platform.OS !== 'web' && width >= 768;

  const themeMode = useThemeMode();
  const themePreference = useThemePreference();
  const isDark = themeMode === 'dark';
  const palette = getPalette(isDark);
  const styles = createStyles(isDark);

  const [gurus, setGurus] = useState<PublicGuruProfile[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadGurus = useCallback(async () => {
    try {
      const rows = await loadPublicGurus();
      setGurus(rows);
      setLoadError(null);
    } catch (error) {
      setGurus([]);
      setLoadError(
        error instanceof Error
          ? `SitGuru could not load this Guru profile: ${error.message}`
          : 'SitGuru could not load this Guru profile.',
      );
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    loadGurus()
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [loadGurus]);

  const normalizedSlug =
    typeof slug === 'string' ? slug.toLowerCase() : '';

  const selectedGuru = useMemo(() => {
    const match = gurus.find(
      (guru) =>
        guru.id === guruId ||
        getGuruSlug(guru).toLowerCase() === normalizedSlug,
    );

    if (match) return match;
    if (guruId || normalizedSlug) return undefined;
    return gurus[0];
  }, [guruId, gurus, normalizedSlug]);

  const guruName = selectedGuru ? getGuruDisplayName(selectedGuru) : '';
  const guruFirstName = selectedGuru ? getGuruFirstName(selectedGuru) : '';
  const guruLocation = selectedGuru
    ? getGuruLocationLabel(selectedGuru)
    : '';
  const guruPhotoUrl = selectedGuru
    ? resolveSupabaseStorageUrl(getGuruPhotoUrl(selectedGuru))
    : '';
  const preview = selectedGuru ? isKnownPreviewGuru(selectedGuru) : false;
  const bookable = selectedGuru ? isGuruBookable(selectedGuru) : false;
  const serviceList = selectedGuru ? getGuruServices(selectedGuru) : [];
  const notice = selectedGuru ? getGuruProfileNotice(selectedGuru) : '';
  const ratingLabel = selectedGuru
    ? getGuruRatingLabel(selectedGuru)
    : 'No rating yet';
  const reviewCount = Number(selectedGuru?.review_count || 0);
  const hasRating = Number(selectedGuru?.rating_avg) > 0;

  const statusCopy = preview
    ? 'Profile preview'
    : bookable
      ? 'Accepting requests'
      : 'Message first';

  const availabilityCopy = preview
    ? 'This preview profile is not accepting bookings yet.'
    : bookable
      ? `${guruFirstName} is currently open to care requests.`
      : `Message ${guruFirstName} to confirm availability.`;

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await loadGurus();
    } finally {
      setRefreshing(false);
    }
  }

  function openConversation() {
    if (!selectedGuru) return;

    router.push({
      pathname: '/conversation',
      params: {
        guruId: selectedGuru.id,
        slug: getGuruSlug(selectedGuru),
      },
    } as never);
  }

  function handleBookingAction() {
    if (!selectedGuru) return;

    if (preview) {
      Alert.alert(
        'Profile preview',
        'This local Guru profile is a preview and is not accepting booking requests yet.',
      );
      return;
    }

    if (bookable) {
      router.push({
        pathname: '/request-booking',
        params: {
          guruId: selectedGuru.id,
          slug: getGuruSlug(selectedGuru),
        },
      } as never);
      return;
    }

    openConversation();
  }

  return (
    <SitGuruScreen
      center={isWebPreview || isTablet}
      maxWidth={isTablet ? 920 : 620}
      scroll={false}>
      <View
        style={[
          styles.previewCanvas,
          !isWebPreview && styles.previewCanvasNative,
        ]}>
        <View
          style={[
            styles.deviceFrame,
            !isWebPreview && styles.deviceFrameNative,
          ]}>
          {isWebPreview ? (
            <View style={styles.deviceTopSpeaker} />
          ) : null}

          <View
            style={[
              styles.phoneShell,
              !isWebPreview && styles.phoneShellNative,
            ]}>
            <View style={styles.screen}>
              {isWebPreview ? (
                <PhoneStatusBar styles={styles} />
              ) : null}

              <ScrollView
                contentContainerStyle={[
                  styles.scrollContent,
                  isTablet && styles.scrollContentTablet,
                ]}
                refreshControl={
                  <RefreshControl
                    colors={[palette.primary]}
                    onRefresh={() => void handleRefresh()}
                    refreshing={refreshing}
                    tintColor={palette.primary}
                  />
                }
                showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                  <BubblePressable
                    accessibilityLabel="Back to Find Care"
                    accessibilityRole="button"
                    onPress={() => router.push('/find-care')}
                    scaleTo={0.88}
                    style={styles.headerBackButton}>
                    <ArrowLeft
                      color={palette.primary}
                      size={20}
                      strokeWidth={2.5}
                    />
                  </BubblePressable>

                  <View style={styles.headerCopy}>
                    <Text style={styles.headerTitle}>
                      Guru Profile
                    </Text>
                    <Text style={styles.headerSubtitle}>
                      Trusted local pet care
                    </Text>
                  </View>

                  <View style={styles.headerActions}>
                    <BubblePressable
                      accessibilityLabel="Refresh profile"
                      accessibilityRole="button"
                      onPress={() => void handleRefresh()}
                      scaleTo={0.88}
                      style={styles.headerIconButton}>
                      <RefreshCw
                        color={palette.title}
                        size={17}
                        strokeWidth={2.3}
                      />
                    </BubblePressable>

                    <BubblePressable
                      accessibilityLabel="Open notifications"
                      accessibilityRole="button"
                      onPress={() => router.push('/notifications')}
                      scaleTo={0.88}
                      style={styles.headerIconButton}>
                      <Bell
                        color={palette.title}
                        size={17}
                        strokeWidth={2.3}
                      />
                    </BubblePressable>

                    <View style={styles.modeToggle}>
                      {THEME_OPTIONS.map((option) => {
                        const active =
                          themePreference === option.value;

                        return (
                          <BubblePressable
                            key={option.value}
                            accessibilityLabel={`Switch to ${option.label} mode`}
                            accessibilityRole="button"
                            accessibilityState={{
                              selected: active,
                            }}
                            onPress={() =>
                              setThemePreference(option.value)
                            }
                            scaleTo={0.88}
                            style={[
                              styles.modeButton,
                              active &&
                                styles.modeButtonActive,
                            ]}>
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
                          </BubblePressable>
                        );
                      })}
                    </View>
                  </View>
                </View>

                {loading ? (
                  <View style={styles.emptyState}>
                    <ActivityIndicator color={palette.primary} size="small" />
                    <Text style={styles.emptyTitle}>Loading Guru profile</Text>
                    <Text style={styles.emptyText}>
                      SitGuru is checking live Guru data for this profile.
                    </Text>
                  </View>
                ) : loadError ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>Profile unavailable</Text>
                    <Text style={styles.emptyText}>{loadError}</Text>
                  </View>
                ) : !selectedGuru ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>
                      {guruId || normalizedSlug
                        ? 'Guru not found'
                        : 'No Guru profiles yet'}
                    </Text>
                    <Text style={styles.emptyText}>
                      {guruId || normalizedSlug
                        ? 'This Guru profile could not be found. No sample Gurus are shown.'
                        : 'No live Guru profiles are available yet. SitGuru does not show placeholder Gurus here.'}
                    </Text>
                  </View>
                ) : (
                  <>
                <View style={styles.heroCard}>
                  <View style={styles.heroPhotoWrap}>
                    <SitGuruProfilePhotoFrame
                      fallbackEmoji=""
                      helperLabel={
                        preview
                          ? 'Local Guru preview'
                          : 'Public Guru photo'
                      }
                      imageUrl={guruPhotoUrl}
                      name={guruName}
                      roleLabel={getGuruSearchBadge(
                        selectedGuru,
                      )}
                      shape="portrait"
                      size="hero"
                    />

                    <View style={styles.photoStatusBadge}>
                      <View style={styles.photoStatusDot} />
                      <Text style={styles.photoStatusText}>
                        {statusCopy}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.heroContent}>
                    <View style={styles.badgeRow}>
                      <Badge
                        icon={
                          <PawPrint
                            color="#FFFFFF"
                            size={12}
                            strokeWidth={2.5}
                          />
                        }
                        label={getGuruSearchBadge(
                          selectedGuru,
                        )}
                        styles={styles}
                      />

                      {selectedGuru.is_verified &&
                      !preview ? (
                        <Badge
                          icon={
                            <BadgeCheck
                              color={palette.primary}
                              size={12}
                              strokeWidth={2.5}
                            />
                          }
                          label={
                            getGuruVerification(
                              selectedGuru as Record<string, unknown>,
                            ).label || 'Verified'
                          }
                          muted
                          styles={styles}
                        />
                      ) : getGuruVerification(
                          selectedGuru as Record<string, unknown>,
                        ).backgroundChecked && !preview ? (
                        <Badge
                          icon={
                            <BadgeCheck
                              color={palette.primary}
                              size={12}
                              strokeWidth={2.5}
                            />
                          }
                          label="Background checked"
                          muted
                          styles={styles}
                        />
                      ) : null}
                    </View>

                    <Text style={styles.guruName}>
                      {guruName}
                    </Text>

                    <View style={styles.metaRow}>
                      <MapPin
                        color={palette.primary}
                        size={14}
                        strokeWidth={2.3}
                      />
                      <Text style={styles.metaText}>
                        {guruLocation}
                      </Text>
                    </View>

                    <View style={styles.metaRow}>
                      <WalletCards
                        color={palette.primary}
                        size={14}
                        strokeWidth={2.3}
                      />
                      <Text style={styles.metaText}>
                        {getGuruRateLabel(selectedGuru)}
                      </Text>

                      <View style={styles.metaDivider} />

                      <Star
                        color={palette.star}
                        fill={hasRating ? palette.star : 'transparent'}
                        size={13}
                        strokeWidth={2.2}
                      />
                      <Text style={styles.metaText}>
                        {ratingLabel}
                      </Text>
                    </View>

                    {notice ? (
                      <View style={styles.noticeCard}>
                        <Text style={styles.noticeText}>
                          {notice}
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.heroActions}>
                      <ActionButton
                        icon={
                          <MessageCircle
                            color={palette.primary}
                            size={17}
                            strokeWidth={2.4}
                          />
                        }
                        label={
                          preview
                            ? 'Message preview'
                            : `Message ${guruFirstName}`
                        }
                        onPress={openConversation}
                        styles={styles}
                      />

                      <ActionButton
                        disabled={preview}
                        icon={
                          <CalendarCheck2
                            color="#FFFFFF"
                            size={17}
                            strokeWidth={2.4}
                          />
                        }
                        label={getGuruBookingLabel(
                          selectedGuru,
                        )}
                        onPress={handleBookingAction}
                        primary
                        styles={styles}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.quickFacts}>
                  <QuickFact
                    icon={
                      <WalletCards
                        color={palette.primary}
                        size={17}
                        strokeWidth={2.35}
                      />
                    }
                    label="Starting rate"
                    styles={styles}
                    value={getGuruRateLabel(selectedGuru)}
                  />

                  <QuickFact
                    icon={
                      <Star
                        color={palette.star}
                        fill={hasRating ? palette.star : 'transparent'}
                        size={17}
                        strokeWidth={2.35}
                      />
                    }
                    label="Rating"
                    styles={styles}
                    value={ratingLabel}
                  />

                  <QuickFact
                    icon={
                      <Clock3
                        color={palette.primary}
                        size={17}
                        strokeWidth={2.35}
                      />
                    }
                    label="Availability"
                    styles={styles}
                    value={statusCopy}
                  />
                </View>

                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <View>
                      <Text style={styles.sectionEyebrow}>
                        CARE OPTIONS
                      </Text>
                      <Text style={styles.sectionTitle}>
                        Services offered
                      </Text>
                    </View>

                    <View style={styles.sectionIcon}>
                      <PawPrint
                        color={palette.primary}
                        size={20}
                        strokeWidth={2.4}
                      />
                    </View>
                  </View>

                  <View style={styles.servicePills}>
                    {serviceList.length ? (
                      serviceList.map((service) => (
                      <View
                        key={service}
                        style={styles.servicePill}>
                        <Text style={styles.servicePillText}>
                          {service}
                        </Text>
                      </View>
                      ))
                    ) : (
                      <Text style={styles.bodyText}>
                        This Guru has not listed services yet.
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <View>
                      <Text style={styles.sectionEyebrow}>
                        ABOUT
                      </Text>
                      <Text style={styles.sectionTitle}>
                        Meet {guruFirstName}
                      </Text>
                    </View>

                    <View style={styles.sectionIcon}>
                      <UserRound
                        color={palette.primary}
                        size={20}
                        strokeWidth={2.4}
                      />
                    </View>
                  </View>

                  <Text style={styles.bodyText}>
                    {selectedGuru.bio ||
                      'This Guru has not added a bio yet.'}
                  </Text>
                </View>

                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <View>
                      <Text style={styles.sectionEyebrow}>
                        PRICING
                      </Text>
                      <Text style={styles.sectionTitle}>
                        What to expect
                      </Text>
                    </View>

                    <View style={styles.sectionIcon}>
                      <WalletCards
                        color={palette.primary}
                        size={20}
                        strokeWidth={2.4}
                      />
                    </View>
                  </View>

                  <PriceRow
                    label="Starting care rate"
                    styles={styles}
                    value={getGuruRateLabel(selectedGuru)}
                  />
                  <PriceRow
                    label="Additional pet fee"
                    styles={styles}
                    value="Confirmed by Guru"
                  />
                  <PriceRow
                    label="Custom care needs"
                    styles={styles}
                    value="Message first"
                  />

                  <InlineNotice
                    styles={styles}
                    text="Your final price is confirmed only after the Guru accepts your request."
                  />
                </View>

                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <View>
                      <Text style={styles.sectionEyebrow}>
                        TRUST & SAFETY
                      </Text>
                      <Text style={styles.sectionTitle}>
                        Care with confidence
                      </Text>
                    </View>

                    <View style={styles.sectionIcon}>
                      <ShieldCheck
                        color={palette.primary}
                        size={20}
                        strokeWidth={2.4}
                      />
                    </View>
                  </View>

                  {safetyNotes.map((item) => (
                    <TrustRow
                      key={item}
                      styles={styles}
                      text={item}
                    />
                  ))}
                </View>

                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <View>
                      <Text style={styles.sectionEyebrow}>
                        AVAILABILITY
                      </Text>
                      <Text style={styles.sectionTitle}>
                        Request status
                      </Text>
                    </View>

                    <View style={styles.sectionIcon}>
                      <CalendarCheck2
                        color={palette.primary}
                        size={20}
                        strokeWidth={2.4}
                      />
                    </View>
                  </View>

                  <Text style={styles.bodyText}>
                    {availabilityCopy}
                  </Text>

                  <ActionButton
                    disabled={preview}
                    icon={
                      <CalendarCheck2
                        color={
                          preview
                            ? palette.muted
                            : '#FFFFFF'
                        }
                        size={17}
                        strokeWidth={2.4}
                      />
                    }
                    label={getGuruBookingLabel(
                      selectedGuru,
                    )}
                    onPress={handleBookingAction}
                    primary={!preview}
                    styles={styles}
                  />

                  <MarketplaceTrustNote compact />
                </View>

                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <View>
                      <Text style={styles.sectionEyebrow}>
                        REVIEWS
                      </Text>
                      <Text style={styles.sectionTitle}>
                        {reviewCount > 0
                          ? `${reviewCount} reviews`
                          : 'Reviews coming soon'}
                      </Text>
                    </View>

                    <View style={styles.sectionIcon}>
                      <Heart
                        color={palette.primary}
                        size={20}
                        strokeWidth={2.4}
                      />
                    </View>
                  </View>

                  {reviewCount > 0 ? (
                    <Text style={styles.bodyText}>
                      {reviewCount} verified review
                      {reviewCount === 1 ? '' : 's'} on completed SitGuru bookings.
                    </Text>
                  ) : (
                    <Text style={styles.bodyText}>
                      No reviews yet. Reviews appear after completed SitGuru bookings.
                    </Text>
                  )}
                </View>

                <View style={styles.connectCard}>
                  <View style={styles.connectIcon}>
                    <MessageCircle
                      color={palette.primary}
                      size={22}
                      strokeWidth={2.4}
                    />
                  </View>

                  <Text style={styles.connectTitle}>
                    {preview
                      ? 'Interested in local care?'
                      : `Ready to connect with ${guruFirstName}?`}
                  </Text>

                  <Text style={styles.connectText}>
                    {preview
                      ? 'Message SitGuru to learn when more local Gurus become available.'
                      : bookable
                        ? 'Message first or send a care request when you are ready.'
                        : `Message ${guruFirstName} to ask about availability and fit.`}
                  </Text>

                  <View style={styles.connectActions}>
                    <ActionButton
                      icon={
                        <MessageCircle
                          color={palette.primary}
                          size={17}
                          strokeWidth={2.4}
                        />
                      }
                      label="Message"
                      onPress={openConversation}
                      styles={styles}
                    />

                    <ActionButton
                      disabled={preview}
                      icon={
                        <CalendarCheck2
                          color="#FFFFFF"
                          size={17}
                          strokeWidth={2.4}
                        />
                      }
                      label={getGuruBookingLabel(
                        selectedGuru,
                      )}
                      onPress={handleBookingAction}
                      primary
                      styles={styles}
                    />
                  </View>
                </View>
                  </>
                )}
              </ScrollView>

              <SitGuruTabBar active="profile" role="guru" />
            </View>
          </View>

          {isWebPreview ? (
            <View style={styles.homeIndicator} />
          ) : null}
        </View>
      </View>
    </SitGuruScreen>
  );
}

function Badge({
  icon,
  label,
  muted = false,
  styles,
}: {
  icon: ReactNode;
  label: string;
  muted?: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View
      style={[
        styles.badge,
        muted && styles.badgeMuted,
      ]}>
      {icon}
      <Text
        style={[
          styles.badgeText,
          muted && styles.badgeTextMuted,
        ]}>
        {label}
      </Text>
    </View>
  );
}

function ActionButton({
  disabled = false,
  icon,
  label,
  onPress,
  primary = false,
  styles,
}: {
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onPress: () => void;
  primary?: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <BubblePressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.actionButton,
        primary && styles.actionButtonPrimary,
        disabled && styles.actionButtonDisabled,
      ]}>
      {icon}
      <Text
        style={[
          styles.actionButtonText,
          primary && styles.actionButtonTextPrimary,
          disabled && styles.actionButtonTextDisabled,
        ]}>
        {label}
      </Text>
    </BubblePressable>
  );
}

function QuickFact({
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
    <View style={styles.quickFact}>
      <View style={styles.quickFactIcon}>{icon}</View>
      <Text
        numberOfLines={2}
        style={styles.quickFactValue}>
        {value}
      </Text>
      <Text style={styles.quickFactLabel}>{label}</Text>
    </View>
  );
}

function PriceRow({
  label,
  styles,
  value,
}: {
  label: string;
  styles: ReturnType<typeof createStyles>;
  value: string;
}) {
  return (
    <View style={styles.priceRow}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={styles.priceValue}>{value}</Text>
    </View>
  );
}

function TrustRow({
  styles,
  text,
}: {
  styles: ReturnType<typeof createStyles>;
  text: string;
}) {
  return (
    <View style={styles.trustRow}>
      <View style={styles.trustCheck}>
        <Check
          color="#FFFFFF"
          size={11}
          strokeWidth={2.8}
        />
      </View>
      <Text style={styles.trustText}>{text}</Text>
    </View>
  );
}

function InlineNotice({
  styles,
  text,
}: {
  styles: ReturnType<typeof createStyles>;
  text: string;
}) {
  return (
    <View style={styles.inlineNotice}>
      <ShieldCheck
        color={styles.inlineNoticeIcon.color}
        size={17}
        strokeWidth={2.4}
      />
      <Text style={styles.inlineNoticeText}>{text}</Text>
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

function getPalette(isDark: boolean) {
  return {
    background: isDark ? '#06140F' : '#FFF9F1',
    border: isDark ? '#234B38' : '#EADDCB',
    muted: isDark ? '#9DB0A5' : '#738078',
    navMuted: isDark ? '#9BAAA1' : '#748079',
    primary: isDark ? '#39D982' : '#087449',
    primaryDark: isDark ? '#1C9F5E' : '#075D3B',
    primarySoft: isDark ? '#123E2A' : '#E4F5E9',
    star: '#F3A61F',
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
      shadowOffset: {
        width: 0,
        height: 20,
      },
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
    screen: {
      backgroundColor: palette.background,
      flex: 1,
      width: '100%',
    },
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
    },
    batteryWrap: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 2,
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
    batteryCap: {
      backgroundColor: palette.title,
      height: 4,
      width: 2,
    },

    scrollContent: {
      gap: 13,
      paddingBottom: 16,
      paddingHorizontal: 15,
      paddingTop: 9,
    },
    scrollContentTablet: {
      alignSelf: 'center',
      maxWidth: 860,
      paddingHorizontal: 24,
      width: '100%',
    },
    emptyState: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 8,
      justifyContent: 'center',
      minHeight: 220,
      paddingHorizontal: 22,
      paddingVertical: 28,
    },
    emptyTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 16,
      textAlign: 'center',
    },
    emptyText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
    },

    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 9,
      minHeight: 52,
    },
    headerBackButton: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    headerCopy: {
      flex: 1,
      gap: 1,
      minWidth: 0,
    },
    headerTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 19,
      letterSpacing: -0.35,
    },
    headerSubtitle: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
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
      height: 27,
      justifyContent: 'center',
      width: 29,
    },
    modeButtonActive: {
      backgroundColor: isDark
        ? 'rgba(226,170,45,0.18)'
        : '#FFF4D8',
    },

    heroCard: {
      backgroundColor: isDark ? '#0D2B20' : '#ECF8EE',
      borderColor: isDark ? '#2D6548' : '#CFE8D5',
      borderRadius: 24,
      borderWidth: 1,
      gap: 13,
      padding: 14,
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: isDark ? 0.2 : 0.07,
      shadowRadius: 16,
    },
    heroPhotoWrap: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 21,
      borderWidth: 1,
      minHeight: 230,
      overflow: 'hidden',
      padding: 10,
      position: 'relative',
    },
    photoStatusBadge: {
      alignItems: 'center',
      backgroundColor: 'rgba(7,59,38,0.92)',
      borderRadius: 999,
      bottom: 12,
      flexDirection: 'row',
      gap: 5,
      left: 12,
      paddingHorizontal: 10,
      paddingVertical: 6,
      position: 'absolute',
    },
    photoStatusDot: {
      backgroundColor: '#54E995',
      borderRadius: 999,
      height: 6,
      width: 6,
    },
    photoStatusText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 7,
    },
    heroContent: {
      gap: 8,
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    badge: {
      alignItems: 'center',
      backgroundColor: palette.primary,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },
    badgeMuted: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
    },
    badgeText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 7,
      textTransform: 'uppercase',
    },
    badgeTextMuted: {
      color: palette.primary,
    },
    guruName: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 27,
      letterSpacing: -0.65,
      lineHeight: 31,
    },
    metaRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    metaText: {
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 9,
    },
    metaDivider: {
      backgroundColor: palette.border,
      height: 13,
      marginHorizontal: 2,
      width: 1,
    },
    noticeCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 14,
      borderWidth: 1,
      padding: 10,
    },
    noticeText: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 13,
    },
    heroActions: {
      flexDirection: 'row',
      gap: 8,
    },

    actionButton: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 14,
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      minHeight: 46,
      paddingHorizontal: 10,
    },
    actionButtonPrimary: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    actionButtonDisabled: {
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.border,
    },
    actionButtonText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    actionButtonTextPrimary: {
      color: '#FFFFFF',
    },
    actionButtonTextDisabled: {
      color: palette.muted,
    },

    quickFacts: {
      flexDirection: 'row',
      gap: 8,
    },
    quickFact: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 16,
      borderWidth: 1,
      flex: 1,
      gap: 4,
      justifyContent: 'center',
      minHeight: 88,
      paddingHorizontal: 7,
      paddingVertical: 9,
    },
    quickFactIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 10,
      height: 33,
      justifyContent: 'center',
      width: 33,
    },
    quickFactValue: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
      lineHeight: 12,
      textAlign: 'center',
    },
    quickFactLabel: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 7,
      textAlign: 'center',
    },

    sectionCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 19,
      borderWidth: 1,
      gap: 10,
      padding: 13,
    },
    sectionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    sectionEyebrow: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 7,
      letterSpacing: 0.85,
    },
    sectionTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 16,
      letterSpacing: -0.3,
      marginTop: 2,
    },
    sectionIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 12,
      height: 39,
      justifyContent: 'center',
      width: 39,
    },
    servicePills: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },
    servicePill: {
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    servicePillText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    bodyText: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 16,
    },

    priceRow: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.border,
      borderRadius: 13,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'space-between',
      minHeight: 46,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    priceLabel: {
      color: palette.text,
      flex: 1,
      fontFamily: AppFonts.bold,
      fontSize: 8,
    },
    priceValue: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
      textAlign: 'right',
    },
    inlineNotice: {
      alignItems: 'flex-start',
      backgroundColor: palette.primarySoft,
      borderColor: palette.border,
      borderRadius: 13,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 8,
      padding: 10,
    },
    inlineNoticeIcon: {
      color: palette.primary,
    },
    inlineNoticeText: {
      color: palette.text,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 13,
    },

    trustRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      minHeight: 31,
    },
    trustCheck: {
      alignItems: 'center',
      backgroundColor: palette.primary,
      borderRadius: 999,
      height: 21,
      justifyContent: 'center',
      width: 21,
    },
    trustText: {
      color: palette.text,
      flex: 1,
      fontFamily: AppFonts.bold,
      fontSize: 9,
      lineHeight: 13,
    },

    reviewCard: {
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.border,
      borderRadius: 15,
      borderWidth: 1,
      gap: 8,
      padding: 10,
    },
    reviewTopRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    reviewAvatar: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    reviewAvatarText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
    },
    reviewCopy: {
      flex: 1,
      gap: 3,
    },
    reviewName: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    reviewStars: {
      flexDirection: 'row',
      gap: 2,
    },
    reviewText: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 13,
    },

    connectCard: {
      alignItems: 'center',
      backgroundColor: isDark ? '#0D2B20' : '#ECF8EE',
      borderColor: isDark ? '#2D6548' : '#CFE8D5',
      borderRadius: 20,
      borderWidth: 1,
      gap: 8,
      padding: 14,
    },
    connectIcon: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderRadius: 999,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    connectTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 16,
      textAlign: 'center',
    },
    connectText: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 14,
      textAlign: 'center',
    },
    connectActions: {
      flexDirection: 'row',
      gap: 8,
      width: '100%',
    },

  });
}