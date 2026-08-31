import { router, useLocalSearchParams } from 'expo-router';
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  MapPin,
  MessageCircle,
  PawPrint,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import { SitGuruIcon } from '@/components/SitGuruIcon';
import SitGuruRoleStatus from '@/components/SitGuruRoleStatus';
import SitGuruScreen from '@/components/SitGuruScreen';
import SitGuruTabBar from '@/components/SitGuruTabBar';
import { AppFonts } from '@/constants/fonts';
import { useBooking } from '@/hooks/data/useBookings';
import {
  setThemePreference,
  type SitGuruThemePreference,
  useThemePreference,
} from '@/hooks/use-color-scheme';
import { useThemeMode } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { formatUsd } from '@/lib/data/money';
import { requestContextualPushPriming } from '@/lib/push-priming';
import { resolveSupabaseStorageUrl } from '@/lib/storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { AppRole } from '@/types/auth';

type RecordRow = Record<string, unknown>;

type PetDetail = {
  id: string;
  name: string;
  species: string;
  breed: string;
  ageLabel: string;
  photoUrl: string | null;
  helper: string;
};

type BookingStatus =
  | 'Pending Guru Review'
  | 'Accepted'
  | 'Active'
  | 'Completed';

type StatusStep = {
  label: BookingStatus;
  shortLabel: string;
};

type PrimaryAction = {
  eyebrow: string;
  title: string;
  text: string;
  label: string;
  route: '/conversation' | '/payments' | '/pawreport-live' | '/reviews';
  icon: 'message' | 'payment' | 'live' | 'review';
};

/** Everything this screen shows about the booking, read from the booking row. */
type BookingView = {
  id: string;
  reference: string;
  statusStep: BookingStatus | null;
  statusLabel: string;
  /** Cancelled, declined, or otherwise closed without care happening. */
  closed: boolean;
  paid: boolean;
  serviceLabel: string;
  petId: string;
  petName: string;
  guruId: string;
  guruName: string;
  guruPhotoUrl: string | null;
  location: string;
  startAt: Date | null;
  endAt: Date | null;
  durationMinutes: number | null;
  notes: string;
  subtotal: number | null;
  fees: number | null;
  credit: number | null;
  total: number | null;
};

type CareNote = {
  title: string;
  detail: string;
};

const NOT_PROVIDED = 'Not provided';

const STATUS_STEPS: StatusStep[] = [
  {
    label: 'Pending Guru Review',
    shortLabel: 'Pending',
  },
  {
    label: 'Accepted',
    shortLabel: 'Accepted',
  },
  {
    label: 'Active',
    shortLabel: 'Active',
  },
  {
    label: 'Completed',
    shortLabel: 'Complete',
  },
];

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

const PET_TABLES = ['pets', 'pet_profiles', 'pet_passports'];
const PET_OWNER_FIELDS = ['owner_id', 'pet_parent_id', 'user_id', 'created_by'];

const PENDING_STATUSES = new Set([
  'pending',
  'pending_guru_review',
  'requested',
  'awaiting_guru',
  'submitted',
  'new',
]);
const ACCEPTED_STATUSES = new Set([
  'accepted',
  'confirmed',
  'paid',
  'upcoming',
  'scheduled',
  'awaiting_payment',
  'payment_pending',
  'payment_required',
]);
const ACTIVE_STATUSES = new Set([
  'active',
  'in_progress',
  'started',
  'in_care',
]);
const COMPLETED_STATUSES = new Set(['completed', 'complete', 'finished']);
const CLOSED_STATUSES = new Set([
  'cancelled',
  'canceled',
  'declined',
  'rejected',
  'expired',
  'refunded',
]);
const PAID_STATUSES = new Set(['paid', 'succeeded', 'captured', 'complete']);

const SUBTOTAL_FIELDS = [
  'subtotal_amount',
  'subtotal',
  'service_amount',
  'base_amount',
  'service_rate',
  'subtotal_amount_cents',
  'subtotal_cents',
];
const FEE_FIELDS = [
  'fee_amount',
  'service_fee',
  'platform_fee',
  'marketplace_fee_amount',
  'sitguru_fee_amount',
  'fee_amount_cents',
  'service_fee_cents',
];
const CREDIT_FIELDS = [
  'credit_amount',
  'discount_amount',
  'promo_amount',
  'pawperks_credit',
  'credit_amount_cents',
  'discount_amount_cents',
];
const TOTAL_FIELDS = [
  'total_amount',
  'total',
  'amount_total',
  'total_customer_paid',
  'estimated_total',
  'amount',
  'price',
  'total_amount_cents',
  'amount_cents',
  'total_cents',
];

export default function BookingDetailsScreen() {
  const { bookingId, conversationId, guruId, petId, petName, viewerRole } =
    useLocalSearchParams<{
      bookingId?: string;
      conversationId?: string;
      guruId?: string;
      petId?: string;
      petName?: string;
      viewerRole?: string;
    }>();
  const { user, profile, primaryRole } = useAuth();
  const isWebPreview = Platform.OS === 'web';
  const themeMode = useThemeMode();
  const themePreference = useThemePreference();
  const isDark = themeMode === 'dark';
  const palette = getPalette(isDark);
  const styles = createStyles(isDark);

  const requestedBookingId =
    typeof bookingId === 'string' ? bookingId.trim() : '';
  const role: AppRole =
    viewerRole === 'guru' || viewerRole === 'pet_parent'
      ? viewerRole
      : (primaryRole ?? 'pet_parent');
  const isGuruViewer = role === 'guru';
  const listRoute = isGuruViewer ? '/guru-requests' : '/bookings';
  const listLabel = isGuruViewer ? 'View care requests' : 'View my bookings';

  const {
    booking,
    loading: bookingLoading,
    error: bookingError,
  } = useBooking(requestedBookingId || null);

  const [selectedPet, setSelectedPet] = useState<PetDetail | null>(null);
  const [petLoadMessage, setPetLoadMessage] = useState('');

  const bookingView = useMemo(
    () => (booking ? buildBookingView(booking.id, booking.raw as RecordRow) : null),
    [booking],
  );

  useEffect(() => {
    if (
      bookingView?.statusStep === 'Accepted' ||
      bookingView?.statusStep === 'Active'
    ) {
      requestContextualPushPriming();
    }
  }, [bookingView?.statusStep]);

  const profileRecord = (profile ?? {}) as RecordRow;
  const userMetadata = (user?.user_metadata ?? {}) as RecordRow;
  const petParentName =
    firstString(profileRecord, ['full_name', 'display_name']) ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    firstString(userMetadata, ['full_name', 'name']) ||
    user?.email?.split('@')[0] ||
    'Pet Parent';
  const petParentAvatarUrl = resolveSupabaseStorageUrl(
    firstString(profileRecord, [
      'avatar_url',
      'photo_url',
      'profile_photo_url',
      'profile_image_url',
    ]) || firstString(userMetadata, ['avatar_url', 'picture']),
  );

  const requestedPetId =
    (typeof petId === 'string' ? petId.trim() : '') || bookingView?.petId || '';
  const requestedPetName =
    (typeof petName === 'string' ? petName.trim() : '') ||
    bookingView?.petName ||
    '';

  useEffect(() => {
    let active = true;

    async function loadPet() {
      if (!user?.id || !isSupabaseConfigured) {
        return;
      }

      if (!requestedPetId && !requestedPetName) {
        setSelectedPet(null);
        return;
      }

      try {
        const pets = await loadPetDetails(user.id);
        if (!active) return;

        const normalizedName = requestedPetName.toLowerCase();

        // Only ever show the pet this booking is actually for.
        const matchingPet =
          pets.find((pet) => pet.id === requestedPetId) ||
          pets.find((pet) => pet.name.toLowerCase() === normalizedName) ||
          null;

        setSelectedPet(matchingPet);
        setPetLoadMessage('');
      } catch {
        if (active) {
          setSelectedPet(null);
          setPetLoadMessage(
            'The Pet Passport for this booking could not be loaded. Pull the booking up again in a moment.',
          );
        }
      }
    }

    void loadPet();

    return () => {
      active = false;
    };
  }, [requestedPetId, requestedPetName, user?.id]);

  const activeStatusIndex = bookingView?.statusStep
    ? STATUS_STEPS.findIndex((step) => step.label === bookingView.statusStep)
    : -1;

  const petDisplayName =
    selectedPet?.name || bookingView?.petName || NOT_PROVIDED;
  const serviceDisplayLabel = bookingView?.serviceLabel || NOT_PROVIDED;

  const careNotes = buildCareNotes(bookingView, selectedPet);

  const priceRows = useMemo(() => {
    if (!bookingView) return [];

    const rows: Array<{ label: string; value: string; savings?: boolean }> = [];

    if (bookingView.subtotal !== null) {
      rows.push({
        label: 'Service rate',
        value: formatUsd(bookingView.subtotal),
      });
    }

    if (bookingView.fees !== null) {
      rows.push({ label: 'Service fee', value: formatUsd(bookingView.fees) });
    }

    if (bookingView.credit !== null && bookingView.credit > 0) {
      rows.push({
        label: 'Credit applied',
        value: `-${formatUsd(bookingView.credit)}`,
        savings: true,
      });
    }

    return rows;
  }, [bookingView]);

  const primaryAction = useMemo<PrimaryAction>(() => {
    const step = bookingView?.statusStep;

    if (step === 'Accepted') {
      return {
        eyebrow: 'REQUEST ACCEPTED',
        title: bookingView?.paid
          ? 'Payment received'
          : 'Pay now to confirm care',
        text: bookingView?.paid
          ? 'Review your receipt and payment status for this booking.'
          : 'Your Guru accepted — finish secure checkout before care begins. Nothing was charged when you sent the request.',
        label: bookingView?.paid ? 'View Payment Status' : 'Pay now',
        route: '/payments',
        icon: 'payment',
      };
    }

    if (step === 'Active') {
      return {
        eyebrow: 'CARE IN PROGRESS',
        title: 'Follow PawReport Live',
        text: 'View care timing, updates, notes, and live visit activity in one place.',
        label: 'View PawReport Live',
        route: '/pawreport-live',
        icon: 'live',
      };
    }

    if (step === 'Completed') {
      return {
        eyebrow: 'CARE COMPLETED',
        title: 'Review the completed visit',
        text: 'Open the final PawReport, confirm care details, and leave a review for the Guru.',
        label: 'Reviews & Ratings',
        route: '/reviews',
        icon: 'review',
      };
    }

    const guruName = bookingView?.guruName;

    return {
      eyebrow: 'AWAITING GURU',
      title: guruName
        ? `Stay connected while ${guruName} reviews`
        : 'Stay connected while a Guru reviews',
      text: 'Use SitGuru messages for availability questions, pet details, and safe care planning.',
      label: 'Message Guru',
      route: '/conversation',
      icon: 'message',
    };
  }, [bookingView]);

  function showPlaceholderAlert(action: string) {
    Alert.alert(
      `${action} is not connected yet`,
      `This button is a safe preview. No booking, payment, message, GPS, or account data was changed.`,
    );
  }

  /** Every hand-off keeps the booking id so the next screen loads real data too. */
  const bookingParams = requestedBookingId
    ? { bookingId: requestedBookingId }
    : {};

  function openConversation(
    conversationRole: 'pet_parent' | 'guru' = isGuruViewer
      ? 'guru'
      : 'pet_parent',
  ) {
    router.push({
      pathname: '/conversation',
      params: {
        viewerRole: conversationRole,
        ...bookingParams,
        ...(typeof conversationId === 'string' && conversationId
          ? { conversationId }
          : {}),
        ...(typeof guruId === 'string' && guruId
          ? { guruId }
          : bookingView?.guruId
            ? { guruId: bookingView.guruId }
            : {}),
        ...(selectedPet?.id ? { petId: selectedPet.id } : {}),
        ...(selectedPet?.name ? { petName: selectedPet.name } : {}),
      },
    });
  }

  function openBookingRoute(
    pathname: '/payments' | '/pawreport-live' | '/reviews' | '/guru-live-walk',
  ) {
    router.push({ pathname, params: bookingParams });
  }

  function openPrimaryAction() {
    if (primaryAction.route === '/conversation') {
      openConversation();
      return;
    }

    openBookingRoute(primaryAction.route);
  }

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
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.header}>
                  <BubblePressable
                    accessibilityLabel="Back to dashboard"
                    accessibilityRole="button"
                    onPress={() =>
                      router.push(
                        isGuruViewer
                          ? '/guru-dashboard'
                          : '/pet-parent-dashboard',
                      )
                    }
                    scaleTo={0.88}
                    style={styles.headerButton}
                  >
                    <ChevronLeft
                      color={palette.title}
                      size={20}
                      strokeWidth={2.5}
                    />
                  </BubblePressable>

                  <View style={styles.headerCopy}>
                    <Text style={styles.headerTitle}>Booking Details</Text>
                    <Text style={styles.headerSubtitle}>
                      {bookingView
                        ? `${petDisplayName} • ${serviceDisplayLabel}`
                        : 'No booking selected'}
                    </Text>
                    <SitGuruRoleStatus compact role={role} />
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
                            accessibilityState={{ selected: active }}
                            onPress={() => setThemePreference(option.value)}
                            scaleTo={0.88}
                            style={[
                              styles.modeButton,
                              active && styles.modeButtonActive,
                            ]}
                          >
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
                              size={14}
                              strokeWidth={2.4}
                            />
                          </BubblePressable>
                        );
                      })}
                    </View>

                    <BubblePressable
                      accessibilityLabel="Open notifications"
                      accessibilityRole="button"
                      onPress={() => router.push('/notifications')}
                      scaleTo={0.88}
                      style={styles.headerButton}
                    >
                      <Bell
                        color={palette.title}
                        size={18}
                        strokeWidth={2.3}
                      />
                    </BubblePressable>

                    <BubblePressable
                      accessibilityLabel="Open Pet Parent profile"
                      accessibilityRole="button"
                      onPress={() => router.push('/account')}
                      scaleTo={0.88}
                      style={styles.profileButton}
                    >
                      <AvatarImage
                        fallback={initials(petParentName)}
                        imageUrl={petParentAvatarUrl}
                        palette={palette}
                        size={38}
                      />
                    </BubblePressable>
                  </View>
                </View>

                {!requestedBookingId ? (
                  <EmptyBookingState
                    listLabel={listLabel}
                    onOpenList={() => router.push(listRoute)}
                    onOpenSupport={() => router.push('/support')}
                    palette={palette}
                    styles={styles}
                    text={
                      isGuruViewer
                        ? 'This screen shows one booking at a time — schedule, pet, care notes, and payment. Nothing opened here because no booking was passed in. Pick a request from your inbox and the real details load.'
                        : 'This screen shows one booking at a time — schedule, your Guru, care notes, and payment. Nothing opened here because no booking was passed in. Pick a booking from your list and the real details load.'
                    }
                    title="No booking selected"
                  />
                ) : bookingLoading ? (
                  <View style={styles.stateCard}>
                    <ActivityIndicator color={palette.primary} />
                    <Text style={styles.stateTitle}>Loading booking…</Text>
                    <Text style={styles.stateText}>
                      Pulling the saved schedule, care notes, and payment
                      details for this booking.
                    </Text>
                  </View>
                ) : !bookingView ? (
                  <EmptyBookingState
                    listLabel={listLabel}
                    onOpenList={() => router.push(listRoute)}
                    onOpenSupport={() => router.push('/support')}
                    palette={palette}
                    styles={styles}
                    text={
                      bookingError
                        ? `SitGuru could not load this booking: ${bookingError}`
                        : 'This booking is no longer available to you. It may have been cancelled, or the link may be out of date.'
                    }
                    title="Booking unavailable"
                  />
                ) : (
                  <>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryTopRow}>
                    <View style={styles.summaryStatusPill}>
                      <Clock3 color="#FFFFFF" size={13} strokeWidth={2.4} />
                      <Text style={styles.summaryStatusText}>
                        {bookingView.statusLabel}
                      </Text>
                    </View>

                    <Text style={styles.bookingId}>
                      {bookingView.reference}
                    </Text>
                  </View>

                  <View style={styles.summaryMainRow}>
                    <AvatarImage
                      fallback={getPetEmoji(selectedPet?.species ?? '')}
                      imageUrl={selectedPet?.photoUrl}
                      palette={palette}
                      size={50}
                      style={styles.summaryPetAvatar}
                    />

                    <View style={styles.summaryCopy}>
                      <Text style={styles.summaryPet}>{petDisplayName}</Text>
                      <Text style={styles.summaryService}>
                        {[
                          bookingView.serviceLabel,
                          formatBookingDate(bookingView.startAt),
                          formatBookingTime(bookingView.startAt),
                        ]
                          .filter(Boolean)
                          .join(' • ') || 'Schedule not provided'}
                      </Text>
                      {bookingView.location ? (
                        <View style={styles.summaryLocationRow}>
                          <MapPin
                            color="rgba(255,255,255,0.78)"
                            size={12}
                            strokeWidth={2.3}
                          />
                          <Text style={styles.summaryLocation}>
                            {bookingView.location}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.summaryPrice}>
                      <Text style={styles.summaryPriceLabel}>
                        {bookingView.paid ? 'PAID' : 'ESTIMATE'}
                      </Text>
                      <Text
                        style={[
                          styles.summaryPriceValue,
                          bookingView.total === null &&
                            styles.summaryPriceValueEmpty,
                        ]}
                      >
                        {bookingView.total === null
                          ? NOT_PROVIDED
                          : formatUsd(bookingView.total)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.summaryPaymentNote}>
                    {bookingPaymentNote(bookingView)}
                  </Text>
                </View>

                {petLoadMessage ? (
                  <View style={styles.loadNotice}>
                    <Text style={styles.loadNoticeText}>{petLoadMessage}</Text>
                  </View>
                ) : null}

                <View style={styles.statusCard}>
                  <View style={styles.sectionHeadingRow}>
                    <View>
                      <Text style={styles.sectionEyebrow}>BOOKING STATUS</Text>
                      <Text style={styles.sectionTitle}>Care progress</Text>
                    </View>
                    <Text style={styles.previewLabel}>
                      {bookingView.statusLabel}
                    </Text>
                  </View>

                  <View style={styles.statusTimeline}>
                    {STATUS_STEPS.map((step, index) => {
                      const active = index === activeStatusIndex;
                      const complete =
                        activeStatusIndex >= 0 && index < activeStatusIndex;

                      return (
                        <View key={step.label} style={styles.statusStepWrap}>
                          <View
                            accessibilityLabel={`${step.label}: ${
                              complete
                                ? 'done'
                                : active
                                  ? 'current step'
                                  : 'not reached yet'
                            }`}
                            style={styles.statusStep}
                          >
                            <View
                              style={[
                                styles.statusDot,
                                complete && styles.statusDotComplete,
                                active && styles.statusDotActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusDotText,
                                  complete && styles.statusDotTextComplete,
                                  active && styles.statusDotTextActive,
                                ]}
                              >
                                {complete ? '✓' : index + 1}
                              </Text>
                            </View>
                            <Text
                              numberOfLines={1}
                              style={[
                                styles.statusLabel,
                                complete && styles.statusLabelComplete,
                                active && styles.statusLabelActive,
                              ]}
                            >
                              {step.shortLabel}
                            </Text>
                          </View>

                          {index < STATUS_STEPS.length - 1 ? (
                            <View
                              style={[
                                styles.statusLine,
                                activeStatusIndex >= 0 &&
                                  index < activeStatusIndex &&
                                  styles.statusLineComplete,
                              ]}
                            />
                          ) : null}
                        </View>
                      );
                    })}
                  </View>

                  <Text style={styles.statusHelper}>
                    {bookingView.closed
                      ? `This booking is ${bookingView.statusLabel.toLowerCase()}, so care never moved through the steps above.`
                      : activeStatusIndex < 0
                        ? 'This booking has not reached a tracked care step yet.'
                        : 'Status updates as your Guru accepts, starts, and completes care.'}
                  </Text>
                </View>

                <BubblePressable
                  accessibilityRole="button"
                  onPress={openPrimaryAction}
                  scaleTo={0.97}
                  style={styles.primaryActionCard}
                >
                  <View style={styles.primaryActionIcon}>
                    <PrimaryActionIcon icon={primaryAction.icon} />
                  </View>

                  <View style={styles.primaryActionCopy}>
                    <Text style={styles.primaryActionEyebrow}>
                      {primaryAction.eyebrow}
                    </Text>
                    <Text style={styles.primaryActionTitle}>
                      {primaryAction.title}
                    </Text>
                    <Text style={styles.primaryActionText}>
                      {primaryAction.text}
                    </Text>
                  </View>

                  <ChevronRight
                    color="#FFFFFF"
                    size={20}
                    strokeWidth={2.5}
                  />
                </BubblePressable>

                <View style={styles.quickActions}>
                  <QuickAction
                    icon={
                      <MessageCircle
                        color={palette.primary}
                        size={20}
                        strokeWidth={2.3}
                      />
                    }
                    label="Message"
                    onPress={openConversation}
                    styles={styles}
                  />

                  {bookingView?.statusStep === 'Accepted' ||
                  bookingView?.statusStep === 'Active' ||
                  bookingView?.paid ? (
                    <QuickAction
                      icon={
                        <WalletCards
                          color={palette.primary}
                          size={20}
                          strokeWidth={2.3}
                        />
                      }
                      label={bookingView?.paid ? 'Receipt' : 'Pay now'}
                      onPress={() => openBookingRoute('/payments')}
                      styles={styles}
                    />
                  ) : null}

                  <QuickAction
                    icon={
                      <PawPrint
                        color={palette.primary}
                        size={20}
                        strokeWidth={2.3}
                      />
                    }
                    label="PawReport"
                    onPress={() => openBookingRoute('/pawreport-live')}
                    styles={styles}
                  />

                  <QuickAction
                    icon={
                      <ShieldCheck
                        color={palette.primary}
                        size={20}
                        strokeWidth={2.3}
                      />
                    }
                    label="Support"
                    onPress={() => router.push('/support')}
                    styles={styles}
                  />
                </View>

                <SectionCard
                  icon={
                    <PawPrint
                      color={palette.primary}
                      size={18}
                      strokeWidth={2.3}
                    />
                  }
                  meta="Pet Passport"
                  styles={styles}
                  title="Pet"
                >
                  <ProfileRow
                    avatar={getPetEmoji(selectedPet?.species ?? '')}
                    detail={
                      selectedPet
                        ? [selectedPet.species, selectedPet.breed, selectedPet.ageLabel]
                            .filter(Boolean)
                            .join(' • ') || NOT_PROVIDED
                        : NOT_PROVIDED
                    }
                    helper={selectedPet?.helper || NOT_PROVIDED}
                    imageUrl={selectedPet?.photoUrl}
                    name={petDisplayName}
                    palette={palette}
                    styles={styles}
                  />

                  <ActionButton
                    label="View Pet Passport"
                    onPress={() => router.push('/pet-passports')}
                    styles={styles}
                    variant="secondary"
                  />
                </SectionCard>

                <SectionCard
                  icon={
                    <ShieldCheck
                      color={palette.primary}
                      size={18}
                      strokeWidth={2.3}
                    />
                  }
                  meta="Care provider"
                  styles={styles}
                  title="Guru"
                >
                  <ProfileRow
                    avatar={
                      bookingView.guruName
                        ? initials(bookingView.guruName)
                        : '?'
                    }
                    detail={bookingView.location || NOT_PROVIDED}
                    imageUrl={bookingView.guruPhotoUrl}
                    name={bookingView.guruName || NOT_PROVIDED}
                    palette={palette}
                    styles={styles}
                  />

                  <View style={styles.twoButtonRow}>
                    <ActionButton
                      label="View Guru"
                      onPress={() =>
                        router.push({
                          pathname: '/guru-profile',
                          params: bookingView.guruId
                            ? { guruId: bookingView.guruId }
                            : {},
                        })
                      }
                      styles={styles}
                      variant="secondary"
                    />
                    <ActionButton
                      label="Message"
                      onPress={openConversation}
                      styles={styles}
                    />
                  </View>
                </SectionCard>

                <SectionCard
                  icon={
                    <CalendarDays
                      color={palette.primary}
                      size={18}
                      strokeWidth={2.3}
                    />
                  }
                  meta="Requested"
                  styles={styles}
                  title="Schedule"
                >
                  <View style={styles.infoGrid}>
                    <InfoTile
                      label="Date"
                      styles={styles}
                      value={
                        formatBookingDate(bookingView.startAt) || NOT_PROVIDED
                      }
                    />
                    <InfoTile
                      label="Time"
                      styles={styles}
                      value={
                        formatBookingTime(bookingView.startAt) || NOT_PROVIDED
                      }
                    />
                    <InfoTile
                      label="Duration"
                      styles={styles}
                      value={formatDuration(bookingView.durationMinutes)}
                    />
                    <InfoTile
                      label="Service"
                      styles={styles}
                      value={bookingView.serviceLabel || NOT_PROVIDED}
                    />
                  </View>

                  {bookingView.startAt ? (
                    <View style={styles.calendarPreview}>
                      {nearbyDayStrip(bookingView.startAt).map((day) => (
                        <View
                          key={day.key}
                          style={[
                            styles.calendarDay,
                            day.active && styles.calendarDayActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.calendarDayText,
                              day.active && styles.calendarDayTextActive,
                            ]}
                          >
                            {day.label}
                          </Text>
                          <Text
                            style={[
                              styles.calendarDateText,
                              day.active && styles.calendarDayTextActive,
                            ]}
                          >
                            {day.date}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </SectionCard>

                <SectionCard
                  icon={
                    <Sparkles
                      color={palette.primary}
                      size={18}
                      strokeWidth={2.3}
                    />
                  }
                  meta="Guru review"
                  styles={styles}
                  title="Care notes"
                >
                  {careNotes.length ? (
                    <View style={styles.noteList}>
                      {careNotes.map((note, index) => (
                        <View
                          key={note.title}
                          style={[
                            styles.noteRow,
                            index === careNotes.length - 1 &&
                              styles.noteRowLast,
                          ]}
                        >
                          <View style={styles.noteCheck}>
                            <Text style={styles.noteCheckText}>✓</Text>
                          </View>
                          <View style={styles.noteCopy}>
                            <Text style={styles.noteTitle}>{note.title}</Text>
                            <Text style={styles.noteText}>{note.detail}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.sectionBodyText}>{NOT_PROVIDED}</Text>
                  )}
                </SectionCard>

                <SectionCard
                  icon={
                    <CircleDollarSign
                      color={palette.primary}
                      size={18}
                      strokeWidth={2.3}
                    />
                  }
                  meta="Estimate only"
                  styles={styles}
                  title="Pricing"
                >
                  {priceRows.length ? (
                    <View style={styles.priceList}>
                      {priceRows.map((row) => (
                        <InfoRow
                          key={row.label}
                          label={row.label}
                          savings={Boolean(row.savings)}
                          styles={styles}
                          value={row.value}
                        />
                      ))}
                    </View>
                  ) : bookingView.total === null ? (
                    <Text style={styles.sectionBodyText}>{NOT_PROVIDED}</Text>
                  ) : null}

                  <View style={styles.totalRow}>
                    <View>
                      <Text style={styles.totalLabel}>
                        {bookingView.paid ? 'Amount paid' : 'Estimated total'}
                      </Text>
                      <Text style={styles.totalHelper}>
                        {bookingView.total === null
                          ? 'No amount is saved on this booking'
                          : bookingView.paid
                            ? 'Recorded on this booking'
                            : 'Saved on this booking'}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.totalValue,
                        bookingView.total === null && styles.totalValueEmpty,
                      ]}
                    >
                      {bookingView.total === null
                        ? NOT_PROVIDED
                        : formatUsd(bookingView.total)}
                    </Text>
                  </View>

                  <View style={styles.paymentNotice}>
                    <ShieldCheck
                      color={palette.primary}
                      size={17}
                      strokeWidth={2.3}
                    />
                    <Text style={styles.paymentNoticeText}>
                      {bookingPaymentNote(bookingView)}
                    </Text>
                  </View>

                  <ActionButton
                    label="View Payment Status"
                    onPress={() => openBookingRoute('/payments')}
                    styles={styles}
                    variant="secondary"
                  />
                </SectionCard>

                <SectionCard
                  icon={
                    <PawPrint
                      color={palette.primary}
                      size={18}
                      strokeWidth={2.3}
                    />
                  }
                  meta={
                    bookingView.statusStep === 'Active'
                      ? 'Care in progress'
                      : bookingView.statusStep === 'Completed'
                        ? 'Completed report'
                        : 'Starts with care'
                  }
                  styles={styles}
                  title="PawReport Live"
                >
                  <View style={styles.pawReportCard}>
                    <View style={styles.pawReportIcon}>
                      <PawPrint color="#FFFFFF" size={23} strokeWidth={2.4} />
                    </View>
                    <View style={styles.pawReportCopy}>
                      <Text style={styles.pawReportTitle}>
                        {bookingView.statusStep === 'Active'
                          ? 'Live care updates available'
                          : bookingView.statusStep === 'Completed'
                            ? 'Completed PawReport ready'
                            : 'PawReport begins at check-in'}
                      </Text>
                      <Text style={styles.pawReportText}>
                        Photos, visit timing, care notes, food, water, and potty updates stay connected to this booking.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.twoButtonRow}>
                    <ActionButton
                      label="Open PawReport"
                      onPress={() => openBookingRoute('/pawreport-live')}
                      styles={styles}
                    />
                    <ActionButton
                      label="Reviews"
                      onPress={() =>
                        router.push({
                          pathname: '/reviews',
                          params: {
                            ...(typeof bookingId === 'string' && bookingId
                              ? { bookingId }
                              : {}),
                          },
                        })
                      }
                      styles={styles}
                      variant="secondary"
                    />
                  </View>
                </SectionCard>

                <SectionCard
                  icon={
                    <UserRound
                      color={palette.primary}
                      size={18}
                      strokeWidth={2.3}
                    />
                  }
                  meta="Guru workspace"
                  styles={styles}
                  title="Guru actions"
                >
                  <Text style={styles.sectionBodyText}>
                    These controls preview the Guru side of the same booking. Accept and decline are not connected yet.
                  </Text>

                  <View style={styles.buttonStack}>
                    <ActionButton
                      label="Back to Guru Requests"
                      onPress={() => router.push('/guru-requests')}
                      styles={styles}
                      variant="secondary"
                    />
                    <ActionButton
                      label="Message Pet Parent"
                      onPress={() => openConversation('guru')}
                      styles={styles}
                    />
                    <ActionButton
                      label="Start Live Walk"
                      onPress={() => openBookingRoute('/guru-live-walk')}
                      styles={styles}
                      variant="secondary"
                    />
                    <ActionButton
                      label="Accept Request Preview"
                      onPress={() => showPlaceholderAlert('Accept Request')}
                      styles={styles}
                    />
                    <ActionButton
                      label="Decline Preview"
                      onPress={() => showPlaceholderAlert('Decline Request')}
                      styles={styles}
                      variant="danger"
                    />
                  </View>
                </SectionCard>

                <SectionCard
                  icon={
                    <ShieldCheck
                      color={palette.primary}
                      size={18}
                      strokeWidth={2.3}
                    />
                  }
                  meta="SitGuru safe care"
                  styles={styles}
                  title="Support & safety"
                >
                  <View style={styles.safetyList}>
                    <SafetyRow
                      styles={styles}
                      text="Keep booking communication, care updates, and payment inside SitGuru."
                    />
                    <SafetyRow
                      styles={styles}
                      text="Live tracking should run only during an active, confirmed booking."
                    />
                    <SafetyRow
                      styles={styles}
                      text="Contact Support whenever booking details or care instructions do not look right."
                    />
                  </View>

                  <ActionButton
                    label="Help & Support"
                    onPress={() => router.push('/support')}
                    styles={styles}
                    variant="secondary"
                  />
                </SectionCard>

                <View style={styles.bottomSpacer} />
                  </>
                )}
              </ScrollView>

              <SitGuruTabBar active="bookings" />
            </View>
          </View>

          {isWebPreview ? <View style={styles.homeIndicator} /> : null}
        </View>
      </View>
    </SitGuruScreen>
  );
}

function PrimaryActionIcon({
  icon,
}: {
  icon: PrimaryAction['icon'];
}) {
  if (icon === 'payment') {
    return (
      <CircleDollarSign
        color="#FFFFFF"
        size={22}
        strokeWidth={2.4}
      />
    );
  }

  if (icon === 'live') {
    return <PawPrint color="#FFFFFF" size={22} strokeWidth={2.4} />;
  }

  if (icon === 'review') {
    return <Sparkles color="#FFFFFF" size={22} strokeWidth={2.4} />;
  }

  return (
    <MessageCircle
      color="#FFFFFF"
      size={22}
      strokeWidth={2.4}
    />
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

function QuickAction({
  icon,
  label,
  onPress,
  styles,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <BubblePressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.quickAction}
    >
      <View style={styles.quickActionIcon}>{icon}</View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </BubblePressable>
  );
}

function SectionCard({
  children,
  icon,
  meta,
  styles,
  title,
}: {
  children: ReactNode;
  icon: ReactNode;
  meta?: string;
  styles: ReturnType<typeof createStyles>;
  title: string;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeadingRow}>
        <View style={styles.sectionHeadingMain}>
          <View style={styles.sectionIcon}>{icon}</View>
          <Text style={styles.sectionCardTitle}>{title}</Text>
        </View>
        {meta ? <Text style={styles.sectionMeta}>{meta}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function ProfileRow({
  avatar,
  badge,
  detail,
  helper,
  imageUrl,
  name,
  palette,
  styles,
}: {
  avatar: string;
  badge?: string;
  detail: string;
  helper?: string;
  imageUrl?: string | null;
  name: string;
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.profileRow}>
      <AvatarImage
        fallback={avatar}
        imageUrl={imageUrl}
        palette={palette}
        size={58}
        style={styles.avatar}
      />
      <View style={styles.profileCopy}>
        <Text style={styles.profileName}>{name}</Text>
        <Text style={styles.profileMeta}>{detail}</Text>
        {helper ? (
          <Text style={styles.profileHelper}>{helper}</Text>
        ) : null}
        {badge ? (
          <View style={styles.profileBadge}>
            <ShieldCheck color="#FFFFFF" size={11} strokeWidth={2.3} />
            <Text style={styles.profileBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function InfoTile({
  label,
  styles,
  value,
}: {
  label: string;
  styles: ReturnType<typeof createStyles>;
  value: string;
}) {
  return (
    <View style={styles.infoTile}>
      <Text style={styles.infoTileValue}>{value}</Text>
      <Text style={styles.infoTileLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({
  label,
  savings = false,
  styles,
  value,
}: {
  label: string;
  savings?: boolean;
  styles: ReturnType<typeof createStyles>;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, savings && styles.infoValueSavings]}>
        {value}
      </Text>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  styles,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  return (
    <BubblePressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.actionButton,
        variant === 'secondary' && styles.actionButtonSecondary,
        variant === 'danger' && styles.actionButtonDanger,
      ]}
    >
      <Text
        style={[
          styles.actionButtonText,
          variant === 'secondary' && styles.actionButtonTextSecondary,
        ]}
      >
        {label}
      </Text>
    </BubblePressable>
  );
}

function SafetyRow({
  styles,
  text,
}: {
  styles: ReturnType<typeof createStyles>;
  text: string;
}) {
  return (
    <View style={styles.safetyRow}>
      <View style={styles.safetyCheck}>
        <Text style={styles.safetyCheckText}>✓</Text>
      </View>
      <Text style={styles.safetyText}>{text}</Text>
    </View>
  );
}

async function loadPetDetails(userId: string): Promise<PetDetail[]> {
  for (const table of PET_TABLES) {
    for (const ownerField of PET_OWNER_FIELDS) {
      const result = await supabase
        .from(table)
        .select('*')
        .eq(ownerField, userId)
        .limit(30);

      if (!result.error && result.data?.length) {
        return (result.data as RecordRow[])
          .map(mapPetDetail)
          .filter((pet): pet is PetDetail => Boolean(pet));
      }
    }
  }

  return [];
}

function mapPetDetail(row: RecordRow, index: number): PetDetail | null {
  const name = firstString(row, ['name', 'pet_name', 'animal_name']);
  if (!name) return null;

  const species = firstString(row, ['species', 'animal_type', 'pet_type']);
  const breed = firstString(row, ['breed', 'breed_name']);
  const ageLabel = firstString(row, ['age_label', 'age']) || getPetAgeLabel(row);
  const helper =
    firstString(row, [
      'care_notes',
      'routine_notes',
      'behavior_notes',
      'bio',
      'description',
    ]) || '';

  return {
    id: firstString(row, ['id', 'pet_id']) || `pet-${index}`,
    name,
    species,
    breed,
    ageLabel,
    photoUrl: resolveSupabaseStorageUrl(
      firstString(row, [
        'photo_url',
        'image_url',
        'avatar_url',
        'pet_photo_url',
      ]),
    ),
    helper,
  };
}

function getPetAgeLabel(row: RecordRow) {
  const years = firstNumber(row, ['age_years', 'years_old']);
  if (years !== null) {
    const rounded = Math.max(0, Math.round(years));
    return `${rounded} ${rounded === 1 ? 'year' : 'years'} old`;
  }
  return '';
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

function firstDate(record: RecordRow, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date;
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
    if (value === false || value === 'false' || value === 0 || value === '0') {
      return false;
    }
  }
  return null;
}

function firstMoney(record: RecordRow, keys: string[]) {
  for (const key of keys) {
    const value = firstNumber(record, [key]);
    if (value === null) continue;
    return /cents/i.test(key) ? value / 100 : value;
  }
  return null;
}

function normalizeBookingStatus(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function humanizeStatus(status: string) {
  const trimmed = status.trim();
  if (!trimmed) return NOT_PROVIDED;
  return trimmed
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function mapStatusStep(status: string): BookingStatus | null {
  const normalized = normalizeBookingStatus(status);
  if (PENDING_STATUSES.has(normalized)) return 'Pending Guru Review';
  if (ACCEPTED_STATUSES.has(normalized)) return 'Accepted';
  if (ACTIVE_STATUSES.has(normalized)) return 'Active';
  if (COMPLETED_STATUSES.has(normalized)) return 'Completed';
  return null;
}

function buildBookingView(id: string, row: RecordRow): BookingView {
  const rawStatus = firstString(row, [
    'status',
    'booking_status',
    'request_status',
  ]);
  const normalized = normalizeBookingStatus(rawStatus);
  const statusStep = mapStatusStep(rawStatus);
  const closed = CLOSED_STATUSES.has(normalized);
  const paymentStatus = normalizeBookingStatus(
    firstString(row, ['payment_status', 'paid_status', 'paymentStatus']),
  );
  const paid =
    PAID_STATUSES.has(paymentStatus) ||
    firstBoolean(row, ['paid', 'is_paid', 'payment_complete']) === true;

  const startAt = firstDate(row, [
    'start_time',
    'starts_at',
    'scheduled_at',
    'requested_start_date',
    'booking_date',
    'service_date',
    'start_date',
    'date',
  ]);
  const endAt = firstDate(row, [
    'end_time',
    'ends_at',
    'requested_end_date',
    'completed_at',
    'end_date',
  ]);

  let durationMinutes = firstNumber(row, [
    'duration_minutes',
    'visit_length_minutes',
    'visit_minutes',
    'length_minutes',
  ]);
  if (durationMinutes === null) {
    const visitLength = firstString(row, [
      'visit_length',
      'duration',
      'time_window',
    ]);
    const parsedMinutes = visitLength.match(/(\d+)/);
    if (parsedMinutes) {
      durationMinutes = Number(parsedMinutes[1]);
    }
  }
  if (durationMinutes === null && startAt && endAt) {
    const diff = Math.round((endAt.getTime() - startAt.getTime()) / 60000);
    if (diff > 0) durationMinutes = diff;
  }

  const subtotal = firstMoney(row, SUBTOTAL_FIELDS);
  const fees = firstMoney(row, FEE_FIELDS);
  const credit = firstMoney(row, CREDIT_FIELDS);
  let total = firstMoney(row, TOTAL_FIELDS);
  if (total === null && subtotal !== null) {
    total = subtotal + (fees ?? 0) - (credit ?? 0);
  }

  const reference =
    firstString(row, [
      'booking_reference',
      'reference',
      'confirmation_code',
      'public_id',
      'short_code',
    ]) || `#${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

  return {
    id,
    reference,
    statusStep,
    statusLabel: statusStep || humanizeStatus(rawStatus),
    closed,
    paid,
    serviceLabel: firstString(row, [
      'service_name',
      'service_type',
      'service',
      'booking_type',
      'serviceType',
    ]),
    petId: firstString(row, ['pet_id', 'petId']),
    petName: firstString(row, [
      'pet_name',
      'animal_name',
      'pet_display_name',
      'petName',
    ]),
    guruId: firstString(row, [
      'guru_id',
      'provider_id',
      'sitter_id',
      'caregiver_id',
      'guruId',
    ]),
    guruName: firstString(row, [
      'guru_name',
      'provider_name',
      'sitter_name',
      'caregiver_name',
      'guruName',
    ]),
    guruPhotoUrl: resolveSupabaseStorageUrl(
      firstString(row, [
        'guru_photo_url',
        'provider_photo_url',
        'guru_avatar_url',
        'caregiver_photo_url',
      ]),
    ),
    location: firstString(row, [
      'service_address',
      'location',
      'service_location',
      'service_city',
      'city',
      'service_area',
      'service_zip',
    ]),
    startAt,
    endAt,
    durationMinutes,
    notes: firstString(row, [
      'notes',
      'care_notes',
      'booking_notes',
      'special_instructions',
      'request_notes',
    ]),
    subtotal,
    fees,
    credit,
    total,
  };
}

function sameCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatBookingDate(date: Date | null) {
  if (!date) return '';

  const today = new Date();
  if (sameCalendarDay(date, today)) return 'Today';

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (sameCalendarDay(date, tomorrow)) return 'Tomorrow';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatBookingTime(date: Date | null) {
  if (!date) return '';

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDuration(minutes: number | null) {
  if (minutes === null || !Number.isFinite(minutes) || minutes <= 0) {
    return NOT_PROVIDED;
  }

  if (minutes < 60) return `${Math.round(minutes)} min`;

  const hours = minutes / 60;
  if (Number.isInteger(hours)) return `${hours} hr`;

  return `${Math.round(minutes)} min`;
}

function nearbyDayStrip(date: Date) {
  return [-2, -1, 0, 1, 2].map((offset) => {
    const day = new Date(date);
    day.setDate(date.getDate() + offset);
    day.setHours(0, 0, 0, 0);

    return {
      key: `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`,
      label: day.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
      date: day.getDate(),
      active: offset === 0,
    };
  });
}

function buildCareNotes(
  bookingView: BookingView | null,
  selectedPet: PetDetail | null,
): CareNote[] {
  const notes: CareNote[] = [];

  if (bookingView?.notes) {
    notes.push({
      title: 'Booking instructions',
      detail: bookingView.notes,
    });
  }

  if (selectedPet?.helper) {
    notes.push({
      title: `${selectedPet.name} — Pet Passport notes`,
      detail: selectedPet.helper,
    });
  }

  return notes;
}

function bookingPaymentNote(view: BookingView) {
  if (view.paid) {
    return view.total === null
      ? 'Payment was received for this booking.'
      : `Payment of ${formatUsd(view.total)} was received for this booking.`;
  }

  if (view.total === null) {
    return 'No payment amount is saved on this booking yet. SitGuru has not charged a payment method.';
  }

  if (view.statusStep === 'Pending Guru Review' || !view.statusStep) {
    return 'Payment happens after the Guru accepts. This request has not charged a payment method.';
  }

  return 'Review the amount saved on this booking and pay securely inside SitGuru when you are ready.';
}

function EmptyBookingState({
  listLabel,
  onOpenList,
  onOpenSupport,
  styles,
  text,
  title,
}: {
  listLabel: string;
  onOpenList: () => void;
  onOpenSupport: () => void;
  palette?: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
  text: string;
  title: string;
}) {
  return (
    <View style={styles.stateCard}>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateText}>{text}</Text>
      <View style={styles.buttonStack}>
        <ActionButton label={listLabel} onPress={onOpenList} styles={styles} />
        <ActionButton
          label="Help & Support"
          onPress={onOpenSupport}
          styles={styles}
          variant="secondary"
        />
      </View>
    </View>
  );
}

function getPetEmoji(species: string) {
  const normalized = species.toLowerCase();
  if (normalized.includes('cat')) return '🐱';
  if (normalized.includes('dog')) return '🐶';
  return '🐾';
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function AvatarImage({
  fallback,
  imageUrl,
  palette,
  size,
  style,
}: {
  fallback: string;
  imageUrl?: string | null;
  palette: ReturnType<typeof getPalette>;
  size: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !imageFailed;
  const isInitials = /^[A-Z0-9]{1,3}$/.test(fallback);

  return (
    <View
      style={[
        {
          alignItems: 'center',
          backgroundColor: palette.primarySoft,
          borderColor: palette.borderStrong,
          borderRadius: size / 2,
          borderWidth: 1.5,
          height: size,
          justifyContent: 'center',
          overflow: 'hidden',
          width: size,
        },
        style,
      ]}
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
            fontSize: isInitials ? Math.max(11, size * 0.28) : size * 0.42,
          }}
        >
          {fallback}
        </Text>
      )}
    </View>
  );
}

function getPalette(isDark: boolean) {
  return {
    background: isDark ? '#06140F' : '#FFF9F1',
    surface: isDark ? '#0B2118' : '#FFFEFA',
    surfaceSoft: isDark ? '#102D21' : '#FFF6E9',
    border: isDark ? '#234B38' : '#EADDCB',
    borderStrong: isDark ? '#2F6B4B' : '#CBE3D1',
    title: isDark ? '#FFF5E8' : '#123F31',
    text: isDark ? '#E8EEE9' : '#27483E',
    muted: isDark ? '#9DB0A5' : '#738078',
    primary: isDark ? '#39D982' : '#087449',
    primaryDark: isDark ? '#087A4C' : '#076A43',
    primarySoft: isDark ? '#123E2A' : '#E4F5E9',
    danger: '#D94A4A',
    orange: '#F15A3A',
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
      gap: 12,
      paddingBottom: 24,
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 9,
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
    headerCopy: {
      flex: 1,
      minWidth: 0,
    },
    headerTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 18,
      letterSpacing: -0.35,
    },
    headerSubtitle: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      marginTop: 1,
    },
    profileButton: {
      borderRadius: 999,
    },
    headerActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
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
      width: 30,
    },
    modeButtonActive: {
      backgroundColor: isDark ? 'rgba(226,170,45,0.18)' : '#FFF4D8',
    },
    summaryCard: {
      backgroundColor: palette.primaryDark,
      borderRadius: 22,
      gap: 11,
      padding: 14,
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 9 },
      shadowOpacity: isDark ? 0.28 : 0.14,
      shadowRadius: 17,
    },
    summaryTopRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    summaryStatusPill: {
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderRadius: 999,
      flexDirection: 'row',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },
    summaryStatusText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    bookingId: {
      color: 'rgba(255,255,255,0.7)',
      fontFamily: AppFonts.bold,
      fontSize: 8,
    },
    summaryMainRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    summaryPetAvatar: {
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderColor: 'rgba(255,255,255,0.35)',
      borderRadius: 16,
    },
    summaryPetEmoji: {
      fontSize: 26,
    },
    summaryCopy: {
      flex: 1,
      minWidth: 0,
    },
    summaryPet: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 19,
    },
    summaryService: {
      color: 'rgba(255,255,255,0.86)',
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 14,
      marginTop: 1,
    },
    summaryLocationRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
      marginTop: 3,
    },
    summaryLocation: {
      color: 'rgba(255,255,255,0.72)',
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
    summaryPrice: {
      alignItems: 'flex-end',
    },
    summaryPriceLabel: {
      color: 'rgba(255,255,255,0.66)',
      fontFamily: AppFonts.bold,
      fontSize: 7,
      letterSpacing: 0.55,
    },
    summaryPriceValue: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 22,
      marginTop: 1,
    },
    summaryPriceValueEmpty: {
      color: 'rgba(255,255,255,0.72)',
      fontSize: 16,
    },
    summaryPaymentNote: {
      color: 'rgba(255,255,255,0.78)',
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
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
    stateCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 10,
      padding: 16,
    },
    stateTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 16,
    },
    stateText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 14,
    },
    statusCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 10,
      padding: 13,
    },
    sectionHeadingRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    sectionEyebrow: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 8,
      letterSpacing: 0.8,
    },
    sectionTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 16,
      marginTop: 2,
    },
    previewLabel: {
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
      overflow: 'hidden',
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    statusTimeline: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    statusStepWrap: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
    },
    statusStep: {
      alignItems: 'center',
      flex: 1,
      gap: 5,
    },
    statusStepComplete: {},
    statusStepActive: {},
    statusDot: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 27,
      justifyContent: 'center',
      width: 27,
    },
    statusDotComplete: {
      backgroundColor: palette.primarySoft,
      borderColor: palette.primary,
    },
    statusDotActive: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    statusDotText: {
      color: palette.muted,
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    statusDotTextComplete: {
      color: palette.primary,
    },
    statusDotTextActive: {
      color: '#FFFFFF',
    },
    statusLabel: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 7,
      textAlign: 'center',
    },
    statusLabelComplete: {
      color: palette.primary,
    },
    statusLabelActive: {
      color: palette.title,
    },
    statusLine: {
      backgroundColor: palette.border,
      height: 2,
      marginHorizontal: -6,
      marginTop: -18,
      width: 18,
    },
    statusLineComplete: {
      backgroundColor: palette.primary,
    },
    statusHelper: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
      textAlign: 'center',
    },
    primaryActionCard: {
      alignItems: 'center',
      backgroundColor: isDark ? '#087A4C' : '#087F50',
      borderRadius: 21,
      flexDirection: 'row',
      gap: 10,
      minHeight: 94,
      padding: 14,
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 9 },
      shadowOpacity: isDark ? 0.28 : 0.14,
      shadowRadius: 17,
    },
    primaryActionIcon: {
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderRadius: 999,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    primaryActionCopy: {
      flex: 1,
      gap: 2,
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
      fontSize: 16,
    },
    primaryActionText: {
      color: 'rgba(255,255,255,0.84)',
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
    },
    quickActions: {
      flexDirection: 'row',
      gap: 8,
    },
    quickAction: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 17,
      borderWidth: 1,
      flex: 1,
      gap: 6,
      justifyContent: 'center',
      minHeight: 72,
      paddingHorizontal: 4,
      paddingVertical: 9,
    },
    quickActionIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    quickActionLabel: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 8,
      textAlign: 'center',
    },
    sectionCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 12,
      padding: 13,
    },
    sectionHeadingMain: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    sectionIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 11,
      height: 32,
      justifyContent: 'center',
      width: 32,
    },
    sectionCardTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 15,
    },
    sectionMeta: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 8,
      textAlign: 'right',
    },
    profileRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 11,
    },
    avatar: {
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.borderStrong,
      borderRadius: 18,
    },
    avatarEmoji: {
      fontSize: 29,
    },
    profileCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    profileName: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 15,
    },
    profileMeta: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
    },
    profileHelper: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
    },
    profileBadge: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: palette.primary,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 4,
      marginTop: 3,
      paddingHorizontal: 7,
      paddingVertical: 4,
    },
    profileBadgeText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.bold,
      fontSize: 7,
    },
    twoButtonRow: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      alignItems: 'center',
      backgroundColor: palette.primaryDark,
      borderRadius: 999,
      flex: 1,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 12,
    },
    actionButtonSecondary: {
      backgroundColor: palette.surface,
      borderColor: palette.borderStrong,
      borderWidth: 1,
    },
    actionButtonDanger: {
      backgroundColor: palette.danger,
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
      textAlign: 'center',
    },
    actionButtonTextSecondary: {
      color: palette.primary,
    },
    infoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    infoTile: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 14,
      flexBasis: '47%',
      flexGrow: 1,
      gap: 2,
      padding: 10,
    },
    infoTileValue: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
    },
    infoTileLabel: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
    calendarPreview: {
      flexDirection: 'row',
      gap: 6,
    },
    calendarDay: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.border,
      borderRadius: 12,
      borderWidth: 1,
      flex: 1,
      justifyContent: 'center',
      minHeight: 52,
    },
    calendarDayActive: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    calendarDayText: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 7,
    },
    calendarDateText: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 15,
      marginTop: 2,
    },
    calendarDayTextActive: {
      color: '#FFFFFF',
    },
    noteList: {
      borderColor: palette.border,
      borderRadius: 16,
      borderWidth: 1,
      overflow: 'hidden',
    },
    noteRow: {
      alignItems: 'flex-start',
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 9,
      padding: 10,
    },
    noteRowLast: {
      borderBottomWidth: 0,
    },
    noteCheck: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      height: 22,
      justifyContent: 'center',
      width: 22,
    },
    noteCheckText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
    },
    noteCopy: {
      flex: 1,
      gap: 2,
    },
    noteTitle: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 10,
    },
    noteText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
    },
    priceList: {
      gap: 7,
    },
    infoRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'space-between',
    },
    infoLabel: {
      color: palette.muted,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 9,
    },
    infoValue: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 10,
      textAlign: 'right',
    },
    infoValueSavings: {
      color: palette.primary,
    },
    totalRow: {
      alignItems: 'center',
      borderTopColor: palette.border,
      borderTopWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 10,
    },
    totalLabel: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
    },
    totalHelper: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      marginTop: 1,
    },
    totalValue: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 22,
    },
    totalValueEmpty: {
      color: palette.muted,
      fontSize: 14,
    },
    paymentNotice: {
      alignItems: 'flex-start',
      backgroundColor: palette.primarySoft,
      borderRadius: 14,
      flexDirection: 'row',
      gap: 7,
      padding: 10,
    },
    paymentNoticeText: {
      color: palette.text,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
    },
    pawReportCard: {
      alignItems: 'center',
      backgroundColor: palette.primaryDark,
      borderRadius: 17,
      flexDirection: 'row',
      gap: 10,
      padding: 11,
    },
    pawReportIcon: {
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderRadius: 999,
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    pawReportCopy: {
      flex: 1,
      gap: 2,
    },
    pawReportTitle: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
    },
    pawReportText: {
      color: 'rgba(255,255,255,0.8)',
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
    },
    sectionBodyText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
    },
    buttonStack: {
      gap: 8,
    },
    safetyList: {
      gap: 8,
    },
    safetyRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 8,
    },
    safetyCheck: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      height: 21,
      justifyContent: 'center',
      width: 21,
    },
    safetyCheckText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    safetyText: {
      color: palette.text,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
    },
    bottomSpacer: {
      height: 16,
    },
  });
}