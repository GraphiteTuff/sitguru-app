import { router } from 'expo-router';
import {
    Bell,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    Clock3,
    Home,
    MapPin,
    MessageCircle,
    PawPrint,
    ShieldCheck,
    Sparkles,
    UserRound,
    WalletCards,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
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

const PRICE_ROWS = [
  {
    label: 'Service rate',
    value: '$25',
  },
  {
    label: 'Additional pet fee',
    value: '$0',
  },
  {
    label: 'Multi-pet savings',
    value: '—',
  },
  {
    label: 'PawPerks credit',
    value: '-$5',
    savings: true,
  },
];

const CARE_NOTES = [
  {
    title: 'Feeding & water',
    detail: 'Fresh water before and after the walk.',
  },
  {
    title: 'Walk & potty',
    detail: 'Neighborhood loop, potty update, and a calm return home.',
  },
  {
    title: 'Medication & allergies',
    detail: 'No medication listed. Allergy details remain available for Guru review.',
  },
  {
    title: 'Access notes',
    detail: 'Use SitGuru messages for safe handoff and entry details.',
  },
];

export default function BookingDetailsScreen() {
  const isWebPreview = Platform.OS === 'web';
  const themeMode = useThemeMode();
  const themePreference = useThemePreference();
  const isDark = themeMode === 'dark';
  const palette = getPalette(isDark);
  const styles = createStyles(isDark);

  const [selectedStatus, setSelectedStatus] =
    useState<BookingStatus>('Pending Guru Review');

  const activeStatusIndex = STATUS_STEPS.findIndex(
    (step) => step.label === selectedStatus,
  );

  const primaryAction = useMemo<PrimaryAction>(() => {
    if (selectedStatus === 'Accepted') {
      return {
        eyebrow: 'REQUEST ACCEPTED',
        title: 'Complete payment when ready',
        text: 'Review the final amount and pay securely inside SitGuru before care begins.',
        label: 'Open Payments',
        route: '/payments',
        icon: 'payment',
      };
    }

    if (selectedStatus === 'Active') {
      return {
        eyebrow: 'CARE IN PROGRESS',
        title: 'Follow PawReport Live',
        text: 'View care timing, updates, notes, and live visit activity in one place.',
        label: 'View PawReport Live',
        route: '/pawreport-live',
        icon: 'live',
      };
    }

    if (selectedStatus === 'Completed') {
      return {
        eyebrow: 'CARE COMPLETED',
        title: 'Review the completed visit',
        text: 'Open the final PawReport, confirm care details, and leave a review for the Guru.',
        label: 'Reviews & Ratings',
        route: '/reviews',
        icon: 'review',
      };
    }

    return {
      eyebrow: 'AWAITING GURU',
      title: 'Stay connected while Jordan reviews',
      text: 'Use SitGuru messages for availability questions, pet details, and safe care planning.',
      label: 'Message Guru',
      route: '/conversation',
      icon: 'message',
    };
  }, [selectedStatus]);

  function previewStatus(status: BookingStatus) {
    setSelectedStatus(status);

    Alert.alert(
      'Status preview only',
      `The screen is now previewing the “${status}” state. No booking status was changed or saved.`,
    );
  }

  function showPlaceholderAlert(action: string) {
    Alert.alert(
      `${action} is not connected yet`,
      `This button is a safe preview. No booking, payment, message, GPS, or account data was changed.`,
    );
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
                  <Pressable
                    accessibilityLabel="Back to dashboard"
                    accessibilityRole="button"
                    onPress={() => router.push('/pet-parent-dashboard')}
                    style={({ pressed }) => [
                      styles.headerButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <ChevronLeft
                      color={palette.title}
                      size={20}
                      strokeWidth={2.5}
                    />
                  </Pressable>

                  <View style={styles.headerCopy}>
                    <Text style={styles.headerTitle}>Booking Details</Text>
                    <Text style={styles.headerSubtitle}>Scout • Dog Walking</Text>
                  </View>

                  <View style={styles.headerActions}>
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
                          </Pressable>
                        );
                      })}
                    </View>

                    <Pressable
                      accessibilityLabel="Open notifications"
                      accessibilityRole="button"
                      onPress={() => router.push('/notifications')}
                      style={({ pressed }) => [
                        styles.headerButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Bell
                        color={palette.title}
                        size={18}
                        strokeWidth={2.3}
                      />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.summaryCard}>
                  <View style={styles.summaryTopRow}>
                    <View style={styles.summaryStatusPill}>
                      <Clock3 color="#FFFFFF" size={13} strokeWidth={2.4} />
                      <Text style={styles.summaryStatusText}>
                        {selectedStatus}
                      </Text>
                    </View>

                    <Text style={styles.bookingId}>#SG-24017</Text>
                  </View>

                  <View style={styles.summaryMainRow}>
                    <View style={styles.summaryPetAvatar}>
                      <Text style={styles.summaryPetEmoji}>🐶</Text>
                    </View>

                    <View style={styles.summaryCopy}>
                      <Text style={styles.summaryPet}>Scout</Text>
                      <Text style={styles.summaryService}>
                        Dog Walking • Today • 12:30 PM
                      </Text>
                      <View style={styles.summaryLocationRow}>
                        <MapPin
                          color="rgba(255,255,255,0.78)"
                          size={12}
                          strokeWidth={2.3}
                        />
                        <Text style={styles.summaryLocation}>
                          Quakertown, PA
                        </Text>
                      </View>
                    </View>

                    <View style={styles.summaryPrice}>
                      <Text style={styles.summaryPriceLabel}>ESTIMATE</Text>
                      <Text style={styles.summaryPriceValue}>$20</Text>
                    </View>
                  </View>

                  <Text style={styles.summaryPaymentNote}>
                    No payment is charged until the Guru accepts and the final amount is confirmed.
                  </Text>
                </View>

                <View style={styles.statusCard}>
                  <View style={styles.sectionHeadingRow}>
                    <View>
                      <Text style={styles.sectionEyebrow}>BOOKING STATUS</Text>
                      <Text style={styles.sectionTitle}>Care progress</Text>
                    </View>
                    <Text style={styles.previewLabel}>Preview</Text>
                  </View>

                  <View style={styles.statusTimeline}>
                    {STATUS_STEPS.map((step, index) => {
                      const active = index === activeStatusIndex;
                      const complete = index < activeStatusIndex;

                      return (
                        <View key={step.label} style={styles.statusStepWrap}>
                          <Pressable
                            accessibilityLabel={`Preview ${step.label} status`}
                            accessibilityRole="button"
                            onPress={() => previewStatus(step.label)}
                            style={({ pressed }) => [
                              styles.statusStep,
                              complete && styles.statusStepComplete,
                              active && styles.statusStepActive,
                              pressed && styles.pressed,
                            ]}
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
                                  (complete || active) &&
                                    styles.statusDotTextActive,
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
                          </Pressable>

                          {index < STATUS_STEPS.length - 1 ? (
                            <View
                              style={[
                                styles.statusLine,
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
                    Tap a status to preview the interface only. Status changes are not saved from this screen yet.
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push(primaryAction.route)}
                  style={({ pressed }) => [
                    styles.primaryActionCard,
                    pressed && styles.primaryActionPressed,
                  ]}
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
                </Pressable>

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
                    onPress={() => router.push('/conversation')}
                    styles={styles}
                  />

                  <QuickAction
                    icon={
                      <WalletCards
                        color={palette.primary}
                        size={20}
                        strokeWidth={2.3}
                      />
                    }
                    label="Payment"
                    onPress={() => router.push('/payments')}
                    styles={styles}
                  />

                  <QuickAction
                    icon={
                      <PawPrint
                        color={palette.primary}
                        size={20}
                        strokeWidth={2.3}
                      />
                    }
                    label="PawReport"
                    onPress={() => router.push('/pawreport-live')}
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
                    avatar="🐶"
                    detail="Dog • Medium • 4 years old"
                    helper="Friendly, loves brisk walks, and prefers a quiet greeting."
                    name="Scout"
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
                    avatar="🧢"
                    badge="Booking-ready Guru profile"
                    detail="Jordan P. • Near Quakertown"
                    helper="Background checked • SitGuru communication enabled"
                    name="Jordan P."
                    styles={styles}
                  />

                  <View style={styles.twoButtonRow}>
                    <ActionButton
                      label="View Guru"
                      onPress={() => router.push('/guru-profile')}
                      styles={styles}
                      variant="secondary"
                    />
                    <ActionButton
                      label="Message"
                      onPress={() => router.push('/conversation')}
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
                    <InfoTile label="Date" styles={styles} value="Today" />
                    <InfoTile label="Time" styles={styles} value="12:30 PM" />
                    <InfoTile
                      label="Duration"
                      styles={styles}
                      value="30 min"
                    />
                    <InfoTile
                      label="Service"
                      styles={styles}
                      value="Dog Walk"
                    />
                  </View>

                  <View style={styles.calendarPreview}>
                    {['Mo', 'Tu', 'We', 'Th', 'Fr'].map((day, index) => {
                      const active = index === 2;

                      return (
                        <View
                          key={day}
                          style={[
                            styles.calendarDay,
                            active && styles.calendarDayActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.calendarDayText,
                              active && styles.calendarDayTextActive,
                            ]}
                          >
                            {day}
                          </Text>
                          <Text
                            style={[
                              styles.calendarDateText,
                              active && styles.calendarDayTextActive,
                            ]}
                          >
                            {12 + index}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
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
                  <View style={styles.noteList}>
                    {CARE_NOTES.map((note, index) => (
                      <View
                        key={note.title}
                        style={[
                          styles.noteRow,
                          index === CARE_NOTES.length - 1 &&
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
                  <View style={styles.priceList}>
                    {PRICE_ROWS.map((row) => (
                      <InfoRow
                        key={row.label}
                        label={row.label}
                        savings={Boolean(row.savings)}
                        styles={styles}
                        value={row.value}
                      />
                    ))}
                  </View>

                  <View style={styles.totalRow}>
                    <View>
                      <Text style={styles.totalLabel}>Estimated total</Text>
                      <Text style={styles.totalHelper}>
                        Final after Guru accepts
                      </Text>
                    </View>
                    <Text style={styles.totalValue}>$20</Text>
                  </View>

                  <View style={styles.paymentNotice}>
                    <ShieldCheck
                      color={palette.primary}
                      size={17}
                      strokeWidth={2.3}
                    />
                    <Text style={styles.paymentNoticeText}>
                      Payment happens later. This request has not charged your payment method.
                    </Text>
                  </View>

                  <ActionButton
                    label="View Payment Status"
                    onPress={() => router.push('/payments')}
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
                    selectedStatus === 'Active'
                      ? 'Care in progress'
                      : selectedStatus === 'Completed'
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
                        {selectedStatus === 'Active'
                          ? 'Live care updates available'
                          : selectedStatus === 'Completed'
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
                      onPress={() => router.push('/pawreport-live')}
                      styles={styles}
                    />
                    <ActionButton
                      label="Reviews"
                      onPress={() => router.push('/reviews')}
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
                      onPress={() => router.push('/conversation')}
                      styles={styles}
                    />
                    <ActionButton
                      label="Start Live Walk"
                      onPress={() => router.push('/guru-live-walk')}
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
                  onPress={() => router.push('/pet-parent-dashboard')}
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
                  onPress={() => router.push('/conversation')}
                  styles={styles}
                />

                <BottomNavItem
                  active
                  icon={
                    <CalendarDays
                      color={palette.primary}
                      size={21}
                      strokeWidth={2.4}
                    />
                  }
                  label="Booking"
                  onPress={() => undefined}
                  styles={styles}
                />

                <BottomNavItem
                  icon={
                    <PawPrint
                      color={palette.navMuted}
                      size={21}
                      strokeWidth={2.3}
                    />
                  }
                  label="Live"
                  onPress={() => router.push('/pawreport-live')}
                  styles={styles}
                />

                <BottomNavItem
                  icon={
                    <ShieldCheck
                      color={palette.navMuted}
                      size={21}
                      strokeWidth={2.3}
                    />
                  }
                  label="Help"
                  onPress={() => router.push('/support')}
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
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.quickActionIcon}>{icon}</View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
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
  name,
  styles,
}: {
  avatar: string;
  badge?: string;
  detail: string;
  helper: string;
  name: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.profileRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarEmoji}>{avatar}</Text>
      </View>
      <View style={styles.profileCopy}>
        <Text style={styles.profileName}>{name}</Text>
        <Text style={styles.profileMeta}>{detail}</Text>
        <Text style={styles.profileHelper}>{helper}</Text>
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
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        variant === 'secondary' && styles.actionButtonSecondary,
        variant === 'danger' && styles.actionButtonDanger,
        pressed && styles.pressed,
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
    </Pressable>
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
    navMuted: isDark ? '#9BAAA1' : '#748079',
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
      paddingBottom: 110,
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
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 16,
      height: 50,
      justifyContent: 'center',
      width: 50,
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
    summaryPaymentNote: {
      color: 'rgba(255,255,255,0.78)',
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
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
    primaryActionPressed: {
      opacity: 0.86,
      transform: [{ scale: 0.99 }],
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
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.borderStrong,
      borderRadius: 18,
      borderWidth: 1,
      height: 58,
      justifyContent: 'center',
      width: 58,
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
    pressed: {
      opacity: 0.76,
      transform: [{ scale: 0.99 }],
    },
    bottomSpacer: {
      height: 16,
    },
    bottomNav: {
      alignItems: 'center',
      backgroundColor: isDark ? '#071A12' : '#FFFDF8',
      borderColor: palette.border,
      borderRadius: 24,
      borderWidth: 1,
      bottom: 8,
      flexDirection: 'row',
      height: 76,
      justifyContent: 'space-around',
      left: 10,
      paddingBottom: 8,
      paddingHorizontal: 7,
      paddingTop: 8,
      position: 'absolute',
      right: 10,
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: isDark ? 0.28 : 0.08,
      shadowRadius: 18,
    },
    navItem: {
      alignItems: 'center',
      flex: 1,
      gap: 4,
      justifyContent: 'center',
    },
    navLabelActive: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 9,
    },
    navLabel: {
      color: palette.navMuted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
    },
  });
}