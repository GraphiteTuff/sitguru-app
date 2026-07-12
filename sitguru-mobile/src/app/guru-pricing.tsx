import { router } from 'expo-router';
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Home,
  MapPin,
  MessageCircle,
  Percent,
  Save,
  Sparkles,
  UserRound,
  WalletCards,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
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

import RoleGate from '@/components/RoleGate';
import SaveFeedbackBanner, {
  useSaveFeedback,
} from '@/components/SaveFeedbackBanner';
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
type PricingStep = 1 | 2 | 3 | 4 | 5;
type ServiceId =
  | 'dog-walking'
  | 'drop-in'
  | 'doggy-day-care'
  | 'boarding'
  | 'house-sitting'
  | 'multi-day-care';

type ServiceMode = 'single' | 'overnight' | 'multi-day';
type GuruBookingStatus =
  | 'not_listed'
  | 'listed_only'
  | 'requestable'
  | 'bookable';

type ServiceConfig = {
  id: ServiceId;
  title: string;
  shortTitle: string;
  mode: ServiceMode;
  rateUnit: string;
  description: string;
};

type ServiceRate = {
  baseRate: string;
  additionalPetRate: string;
  enabled: boolean;
};

type DayRule = {
  adjustment: number;
  unavailable: boolean;
  label: string;
};

type CalendarDay = {
  id: string;
  date: Date;
  day: string;
};

type PricingPayload = {
  version: number;
  serviceRates: Record<ServiceId, ServiceRate>;
  dayRules: Record<string, DayRule>;
  weekendAdjustment: string;
  holidayAdjustment: string;
  multiPetDiscountEnabled: boolean;
  multiPetDiscountPercent: string;
  longStayDiscountEnabled: boolean;
  longStayMinUnits: string;
  longStayDiscountPercent: string;
  repeatDiscountEnabled: boolean;
  repeatDiscountPercent: string;
  acceptSameDay: boolean;
  acceptWeekends: boolean;
  acceptHolidays: boolean;
  advanceBookingWindow: string;
  availabilityNotes: string;
  bookingStatus: GuruBookingStatus;
  serviceRadiusMiles: string;
};

const THEME_OPTIONS: Array<{
  label: string;
  value: SitGuruThemePreference;
  icon: 'sun' | 'moon';
}> = [
  { label: 'Light', value: 'light', icon: 'sun' },
  { label: 'Dark', value: 'dark', icon: 'moon' },
];

const PRICING_TABLES = [
  'guru_pricing_settings',
  'guru_pricing',
  'guru_business_settings',
];

const OWNER_FIELDS = ['guru_id', 'user_id', 'profile_id', 'owner_id'];

const PRICING_FIELDS = [
  'pricing_settings',
  'pricing_data',
  'settings',
  'data',
];

const pricingSteps: Array<{
  step: PricingStep;
  shortTitle: string;
  title: string;
  description: string;
}> = [
  {
    step: 1,
    shortTitle: 'Rates',
    title: 'Service rates',
    description:
      'Set your base rate and additional-pet rate for each service you offer.',
  },
  {
    step: 2,
    shortTitle: 'Calendar',
    title: 'Calendar pricing',
    description:
      'Adjust special dates, peak days, limited availability, and busy days.',
  },
  {
    step: 3,
    shortTitle: 'Discounts',
    title: 'Discount rules',
    description:
      'Create multi-pet, long-stay, and repeat Pet Parent savings.',
  },
  {
    step: 4,
    shortTitle: 'Availability',
    title: 'Booking availability',
    description:
      'Control booking status, service radius, same-day care, weekends, holidays, and booking windows.',
  },
  {
    step: 5,
    shortTitle: 'Preview',
    title: 'Review and save',
    description:
      'Preview Pet Parent estimates and save your Guru pricing workspace.',
  },
];

const services: ServiceConfig[] = [
  {
    id: 'dog-walking',
    title: 'Dog Walking',
    shortTitle: 'Walks',
    mode: 'single',
    rateUnit: 'visit',
    description: 'Walks, potty breaks, exercise, and outdoor time.',
  },
  {
    id: 'drop-in',
    title: 'Drop-In Visit',
    shortTitle: 'Drop-In',
    mode: 'single',
    rateUnit: 'visit',
    description: 'Food, water, potty, litter, play, and quick care.',
  },
  {
    id: 'doggy-day-care',
    title: 'Doggy Day Care',
    shortTitle: 'Day Care',
    mode: 'single',
    rateUnit: 'day',
    description: 'Daytime supervision, play, and care support.',
  },
  {
    id: 'boarding',
    title: 'Boarding',
    shortTitle: 'Boarding',
    mode: 'overnight',
    rateUnit: 'night',
    description: 'Overnight care with you when available.',
  },
  {
    id: 'house-sitting',
    title: 'House Sitting',
    shortTitle: 'House Sit',
    mode: 'overnight',
    rateUnit: 'night',
    description: 'Overnight or multi-day care in the Pet Parent home.',
  },
  {
    id: 'multi-day-care',
    title: 'Multi-Day Care',
    shortTitle: 'Multi-Day',
    mode: 'multi-day',
    rateUnit: 'day',
    description: 'Care across multiple days with clear date ranges and notes.',
  },
];

const defaultRates: Record<ServiceId, ServiceRate> = {
  'dog-walking': {
    baseRate: '25',
    additionalPetRate: '10',
    enabled: true,
  },
  'drop-in': {
    baseRate: '22',
    additionalPetRate: '8',
    enabled: true,
  },
  'doggy-day-care': {
    baseRate: '40',
    additionalPetRate: '15',
    enabled: false,
  },
  boarding: {
    baseRate: '58',
    additionalPetRate: '22',
    enabled: false,
  },
  'house-sitting': {
    baseRate: '72',
    additionalPetRate: '20',
    enabled: false,
  },
  'multi-day-care': {
    baseRate: '45',
    additionalPetRate: '15',
    enabled: false,
  },
};

const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const BOOKING_STATUS_OPTIONS: Array<{
  value: GuruBookingStatus;
  label: string;
  description: string;
}> = [
  {
    value: 'bookable',
    label: 'Bookable',
    description: 'Pet Parents can start a booking from your profile.',
  },
  {
    value: 'requestable',
    label: 'Requestable',
    description: 'Pet Parents can send a booking or quote request.',
  },
  {
    value: 'listed_only',
    label: 'Listed only',
    description: 'Your profile stays visible, but requests are paused.',
  },
  {
    value: 'not_listed',
    label: 'Not listed',
    description: 'Your profile is hidden from public search.',
  },
];

export default function GuruPricingScreen() {
  const { user, profile } = useAuth();
  const themeMode = useThemeMode();
  const themePreference = useThemePreference();
  const isDark = themeMode === 'dark';
  const isWebPreview = Platform.OS === 'web';
  const palette = getPalette(isDark);
  const styles = createStyles(isDark);

  const profileRecord = useMemo(
    () => (profile ?? {}) as RecordRow,
    [profile],
  );

  const profileName =
    firstString(profileRecord, ['full_name', 'display_name']) ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    user?.email?.split('@')[0] ||
    'Guru';

  const avatarUrl = resolveSupabaseStorageUrl(
    firstString(profileRecord, [
      'avatar_url',
      'photo_url',
      'profile_photo_url',
      'profile_image_url',
    ]),
  );

  const [currentStep, setCurrentStep] = useState<PricingStep>(1);
  const [selectedServiceId, setSelectedServiceId] =
    useState<ServiceId>('dog-walking');
  const [serviceRates, setServiceRates] =
    useState<Record<ServiceId, ServiceRate>>(defaultRates);
  const [displayMonth, setDisplayMonth] = useState(monthStart(new Date()));
  const [selectedDateId, setSelectedDateId] = useState(toDateId(new Date()));
  const [dayRules, setDayRules] = useState<Record<string, DayRule>>({});
  const [weekendAdjustment, setWeekendAdjustment] = useState('8');
  const [holidayAdjustment, setHolidayAdjustment] = useState('15');
  const [multiPetDiscountEnabled, setMultiPetDiscountEnabled] =
    useState(true);
  const [multiPetDiscountPercent, setMultiPetDiscountPercent] =
    useState('10');
  const [longStayDiscountEnabled, setLongStayDiscountEnabled] =
    useState(true);
  const [longStayMinUnits, setLongStayMinUnits] = useState('5');
  const [longStayDiscountPercent, setLongStayDiscountPercent] =
    useState('8');
  const [repeatDiscountEnabled, setRepeatDiscountEnabled] =
    useState(false);
  const [repeatDiscountPercent, setRepeatDiscountPercent] =
    useState('5');
  const [acceptSameDay, setAcceptSameDay] = useState(false);
  const [acceptWeekends, setAcceptWeekends] = useState(true);
  const [acceptHolidays, setAcceptHolidays] = useState(true);
  const [advanceBookingWindow, setAdvanceBookingWindow] =
    useState('180');
  const [availabilityNotes, setAvailabilityNotes] = useState('');
  const [bookingStatus, setBookingStatus] =
    useState<GuruBookingStatus>('requestable');
  const [serviceRadiusMiles, setServiceRadiusMiles] = useState(
    String(
      Math.max(
        1,
        Math.round(
          firstNumber(profileRecord, [
            'service_radius_miles',
            'radius_miles',
            'service_radius',
          ]) ?? 20,
        ),
      ),
    ),
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<
    'idle' | 'saved' | 'session-only'
  >('idle');
  const [message, setMessage] = useState('');

  const {
    feedback,
    showSaved,
    showWarning,
    showError,
    dismissFeedback,
  } = useSaveFeedback();

  const selectedService =
    services.find((service) => service.id === selectedServiceId) ??
    services[0];
  const selectedRate = serviceRates[selectedServiceId];
  const activeStep =
    pricingSteps.find((step) => step.step === currentStep) ??
    pricingSteps[0];

  const progressPercent = Math.round(
    (currentStep / pricingSteps.length) * 100,
  );

  const calendarDays = useMemo(
    () => buildCalendarMonth(displayMonth),
    [displayMonth],
  );

  const calendarWeeks = useMemo(
    () => buildCalendarWeeks(calendarDays),
    [calendarDays],
  );

  const selectedDay =
    calendarDays.find((day) => day.id === selectedDateId) ??
    calendarDays[0];

  const selectedRule = dayRules[selectedDateId];

  const pricingPayload = useMemo<PricingPayload>(
    () => ({
      version: 1,
      serviceRates,
      dayRules,
      weekendAdjustment,
      holidayAdjustment,
      multiPetDiscountEnabled,
      multiPetDiscountPercent,
      longStayDiscountEnabled,
      longStayMinUnits,
      longStayDiscountPercent,
      repeatDiscountEnabled,
      repeatDiscountPercent,
      acceptSameDay,
      acceptWeekends,
      acceptHolidays,
      advanceBookingWindow,
      availabilityNotes,
      bookingStatus,
      serviceRadiusMiles,
    }),
    [
      acceptHolidays,
      acceptSameDay,
      acceptWeekends,
      advanceBookingWindow,
      availabilityNotes,
      bookingStatus,
      dayRules,
      holidayAdjustment,
      longStayDiscountEnabled,
      longStayDiscountPercent,
      longStayMinUnits,
      multiPetDiscountEnabled,
      multiPetDiscountPercent,
      repeatDiscountEnabled,
      repeatDiscountPercent,
      serviceRadiusMiles,
      serviceRates,
      weekendAdjustment,
    ],
  );

  const loadPricing = useCallback(
    async (showRefresh = false) => {
      if (!user?.id || !isSupabaseConfigured) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const stored = await findPricingSettings(user.id);

        if (stored) {
          applyPricingPayload(stored, {
            setAcceptHolidays,
            setAcceptSameDay,
            setAcceptWeekends,
            setAdvanceBookingWindow,
            setAvailabilityNotes,
            setBookingStatus,
            setDayRules,
            setHolidayAdjustment,
            setLongStayDiscountEnabled,
            setLongStayDiscountPercent,
            setLongStayMinUnits,
            setMultiPetDiscountEnabled,
            setMultiPetDiscountPercent,
            setRepeatDiscountEnabled,
            setRepeatDiscountPercent,
            setServiceRadiusMiles,
            setServiceRates,
            setWeekendAdjustment,
          });
        }

        const profileBookingStatus = normalizeBookingStatus(
          firstString(profileRecord, [
            'booking_status',
            'guru_booking_status',
            'availability_status',
          ]),
        );

        if (!stored && profileBookingStatus) {
          setBookingStatus(profileBookingStatus);
        }

        setMessage('');
      } catch {
        setMessage(
          'Some pricing settings could not be loaded. Pull down to try again.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [profileRecord, user?.id],
  );

  useEffect(() => {
    void loadPricing(false);
  }, [loadPricing]);

  function updateSelectedRate(updates: Partial<ServiceRate>) {
    setServiceRates((currentRates) => ({
      ...currentRates,
      [selectedServiceId]: {
        ...currentRates[selectedServiceId],
        ...updates,
      },
    }));
    setSaveState('idle');
  }

  function getDateAdjustment(day: CalendarDay) {
    const rule = dayRules[day.id];

    if (rule) return rule.unavailable ? 0 : rule.adjustment;

    let adjustment = 0;

    if (isWeekend(day.date)) {
      adjustment += toNumber(weekendAdjustment);
    }

    if (isPeakDate(day.date)) {
      adjustment += toNumber(holidayAdjustment);
    }

    return adjustment;
  }

  function getDatePrice(day: CalendarDay) {
    const rule = dayRules[day.id];

    if (rule?.unavailable) return null;

    return toNumber(selectedRate.baseRate) + getDateAdjustment(day);
  }

  function setSelectedDayRule(rule: DayRule) {
    setDayRules((currentRules) => ({
      ...currentRules,
      [selectedDateId]: rule,
    }));
    setSaveState('idle');
  }

  function clearSelectedDayRule() {
    setDayRules((currentRules) => {
      const nextRules = { ...currentRules };
      delete nextRules[selectedDateId];
      return nextRules;
    });
    setSaveState('idle');
  }

  function goBack() {
    if (currentStep === 1) {
      router.push('/guru-dashboard');
      return;
    }

    setCurrentStep((currentStep - 1) as PricingStep);
  }

  async function goNext() {
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as PricingStep);
      return;
    }

    await savePricing();
  }

  async function savePricing() {
    if (!user?.id || !isSupabaseConfigured) {
      setSaveState('session-only');
      showWarning(
        'Pricing was not saved to your account',
        'Supabase is not configured in this build. Your changes remain visible only for this session.',
      );
      return;
    }

    setSaving(true);

    try {
      const saved = await persistPricingSettings(
        user.id,
        pricingPayload,
      );

      if (!saved) {
        setSaveState('session-only');
        showWarning(
          'Pricing was not saved to your account',
          'No compatible Guru pricing table was found. Your changes remain visible only for this session.',
        );
        return;
      }

      setSaveState('saved');
      showSaved(
        'Pricing saved',
        'Your rates, discounts, calendar rules, booking status, and availability were saved to your Guru account.',
      );
    } catch {
      setSaveState('session-only');
      showError(
        'Unable to save pricing',
        'Your changes were not saved. Check the pricing table permissions and try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  function renderServiceSelector() {
    return (
      <ScrollView
        horizontal
        contentContainerStyle={styles.serviceRail}
        showsHorizontalScrollIndicator={false}
      >
        {services.map((service) => {
          const active = selectedServiceId === service.id;
          const enabled = serviceRates[service.id].enabled;

          return (
            <Pressable
              key={service.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setSelectedServiceId(service.id)}
              style={[
                styles.servicePill,
                active && styles.servicePillActive,
              ]}
            >
              <View
                style={[
                  styles.serviceStatusDot,
                  enabled && styles.serviceStatusDotActive,
                ]}
              />
              <Text
                style={[
                  styles.servicePillText,
                  active && styles.servicePillTextActive,
                ]}
              >
                {service.shortTitle}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    );
  }

  function renderPreviewCard() {
    const sampleUnits = selectedService.mode === 'single' ? 1 : 5;
    const baseRate = toNumber(selectedRate.baseRate);
    const additionalPetRate = toNumber(
      selectedRate.additionalPetRate,
    );
    const baseTotal = baseRate * sampleUnits;
    const additionalPetTotal = additionalPetRate * sampleUnits;

    const multiPetSavings = multiPetDiscountEnabled
      ? Math.round(
          additionalPetTotal *
            (toNumber(multiPetDiscountPercent) / 100),
        )
      : 0;

    const longStaySavings =
      longStayDiscountEnabled &&
      sampleUnits >= toNumber(longStayMinUnits)
        ? Math.round(
            baseTotal *
              (toNumber(longStayDiscountPercent) / 100),
          )
        : 0;

    const repeatSavings = repeatDiscountEnabled
      ? Math.round(
          baseTotal *
            (toNumber(repeatDiscountPercent) / 100),
        )
      : 0;

    const total = Math.max(
      0,
      baseTotal +
        additionalPetTotal -
        multiPetSavings -
        longStaySavings -
        repeatSavings,
    );

    return (
      <View style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <View>
            <Text style={styles.previewEyebrow}>
              PET PARENT ESTIMATE
            </Text>
            <Text style={styles.previewTitle}>{currency(total)}</Text>
          </View>

          <View style={styles.previewServicePill}>
            <Text style={styles.previewServiceText}>
              {selectedService.shortTitle}
            </Text>
          </View>
        </View>

        <View style={styles.previewRows}>
          <PreviewRow
            label={`${selectedService.title} × ${sampleUnits}`}
            value={currency(baseTotal)}
            styles={styles}
          />
          <PreviewRow
            label="Additional pet estimate"
            value={currency(additionalPetTotal)}
            styles={styles}
          />

          {multiPetSavings > 0 ? (
            <PreviewRow
              discount
              label="Multi-pet savings"
              value={`-${currency(multiPetSavings)}`}
              styles={styles}
            />
          ) : null}

          {longStaySavings > 0 ? (
            <PreviewRow
              discount
              label="Long-stay savings"
              value={`-${currency(longStaySavings)}`}
              styles={styles}
            />
          ) : null}

          {repeatSavings > 0 ? (
            <PreviewRow
              discount
              label="Repeat Pet Parent savings"
              value={`-${currency(repeatSavings)}`}
              styles={styles}
            />
          ) : null}
        </View>

        <Text style={styles.previewNote}>
          This is an estimate preview. Final checkout and SitGuru marketplace
          support details appear during booking.
        </Text>
      </View>
    );
  }

  function renderRatesStep() {
    return (
      <View style={styles.stepBody}>
        {renderServiceSelector()}

        <View style={styles.contentCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderCopy}>
              <Text style={styles.cardEyebrow}>
                {selectedService.title.toUpperCase()}
              </Text>
              <Text style={styles.cardTitle}>
                Rates and service status
              </Text>
            </View>

            <TogglePill
              active={selectedRate.enabled}
              label={selectedRate.enabled ? 'Offered' : 'Hidden'}
              onPress={() =>
                updateSelectedRate({
                  enabled: !selectedRate.enabled,
                })
              }
              styles={styles}
            />
          </View>

          <Text style={styles.cardText}>
            {selectedService.description}
          </Text>

          <View style={styles.fieldGrid}>
            <MoneyField
              label={`Base rate / ${selectedService.rateUnit}`}
              onChangeText={(value) =>
                updateSelectedRate({ baseRate: value })
              }
              value={selectedRate.baseRate}
              styles={styles}
            />
            <MoneyField
              label={`Additional pet / ${selectedService.rateUnit}`}
              onChangeText={(value) =>
                updateSelectedRate({
                  additionalPetRate: value,
                })
              }
              value={selectedRate.additionalPetRate}
              styles={styles}
            />
          </View>
        </View>

        {renderPreviewCard()}
      </View>
    );
  }

  function renderCalendarStep() {
    return (
      <View style={styles.stepBody}>
        {renderServiceSelector()}

        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <View>
              <Text style={styles.cardEyebrow}>DATE PRICING</Text>
              <Text style={styles.cardTitle}>
                {displayMonth.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>

            <View style={styles.monthControls}>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  setDisplayMonth((month) => addMonths(month, -1))
                }
                style={styles.monthButton}
              >
                <ChevronLeft
                  color={palette.primary}
                  size={18}
                  strokeWidth={2.4}
                />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  setDisplayMonth((month) => addMonths(month, 1))
                }
                style={styles.monthButton}
              >
                <ChevronRight
                  color={palette.primary}
                  size={18}
                  strokeWidth={2.4}
                />
              </Pressable>
            </View>
          </View>

          <Text style={styles.calendarHelp}>
            Select a day to add a custom price or mark it unavailable.
          </Text>

          <View style={styles.weekdayRow}>
            {weekdayLabels.map((label) => (
              <Text key={label} style={styles.weekdayText}>
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.calendarWeeks}>
            {calendarWeeks.map((week, weekIndex) => (
              <View
                key={`week-${weekIndex}`}
                style={styles.calendarWeek}
              >
                {week.map((day) => {
                  const selected = day.id === selectedDateId;
                  const outsideMonth = !sameMonth(
                    day.date,
                    displayMonth,
                  );
                  const rule = dayRules[day.id];
                  const price = getDatePrice(day);

                  return (
                    <Pressable
                      key={day.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setSelectedDateId(day.id)}
                      style={[
                        styles.dateCell,
                        outsideMonth && styles.dateOutsideMonth,
                        isToday(day.date) && styles.dateToday,
                        selected && styles.dateSelected,
                        rule?.unavailable && styles.dateBusy,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dateDay,
                          selected && styles.dateTextSelected,
                          rule?.unavailable &&
                            styles.dateTextMuted,
                        ]}
                      >
                        {day.day}
                      </Text>

                      <Text
                        style={[
                          styles.datePrice,
                          selected && styles.dateTextSelected,
                          rule?.unavailable &&
                            styles.dateTextMuted,
                        ]}
                      >
                        {rule?.unavailable
                          ? 'Busy'
                          : price !== null
                            ? currency(price)
                            : '—'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.cardEyebrow}>SELECTED DATE</Text>
          <Text style={styles.cardTitle}>
            {selectedDay.date.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.cardText}>
            {selectedRule
              ? selectedRule.unavailable
                ? 'Busy and unavailable'
                : `Custom +${currency(selectedRule.adjustment)}`
              : 'Default calendar pricing'}
          </Text>

          <View style={styles.ruleGrid}>
            <RuleButton
              label="+$5"
              onPress={() =>
                setSelectedDayRule({
                  adjustment: 5,
                  unavailable: false,
                  label: 'Custom',
                })
              }
              styles={styles}
            />
            <RuleButton
              label="+$10"
              onPress={() =>
                setSelectedDayRule({
                  adjustment: 10,
                  unavailable: false,
                  label: 'Custom',
                })
              }
              styles={styles}
            />
            <RuleButton
              label="Peak +$15"
              onPress={() =>
                setSelectedDayRule({
                  adjustment: 15,
                  unavailable: false,
                  label: 'Peak',
                })
              }
              styles={styles}
            />
            <RuleButton
              danger
              label="Busy"
              onPress={() =>
                setSelectedDayRule({
                  adjustment: 0,
                  unavailable: true,
                  label: 'Busy',
                })
              }
              styles={styles}
            />
            <RuleButton
              label="Clear"
              onPress={clearSelectedDayRule}
              styles={styles}
            />
          </View>
        </View>

        <View style={styles.fieldGrid}>
          <MoneyField
            label="Weekend add-on"
            onChangeText={(value) => {
              setWeekendAdjustment(value);
              setSaveState('idle');
            }}
            value={weekendAdjustment}
            styles={styles}
          />
          <MoneyField
            label="Peak / holiday add-on"
            onChangeText={(value) => {
              setHolidayAdjustment(value);
              setSaveState('idle');
            }}
            value={holidayAdjustment}
            styles={styles}
          />
        </View>
      </View>
    );
  }

  function renderDiscountsStep() {
    return (
      <View style={styles.stepBody}>
        <SettingCard
          active={multiPetDiscountEnabled}
          description="Apply a percentage discount to the additional-pet portion of an estimate."
          icon={
            <Percent
              color={palette.primary}
              size={20}
              strokeWidth={2.3}
            />
          }
          onPress={() => {
            setMultiPetDiscountEnabled((value) => !value);
            setSaveState('idle');
          }}
          title="Multi-pet discount"
          styles={styles}
        />

        {multiPetDiscountEnabled ? (
          <PercentField
            label="Multi-pet discount"
            onChangeText={(value) => {
              setMultiPetDiscountPercent(value);
              setSaveState('idle');
            }}
            value={multiPetDiscountPercent}
            styles={styles}
          />
        ) : null}

        <SettingCard
          active={longStayDiscountEnabled}
          description="Offer savings when overnight or multi-day care reaches your minimum length."
          icon={
            <CalendarDays
              color={palette.primary}
              size={20}
              strokeWidth={2.3}
            />
          }
          onPress={() => {
            setLongStayDiscountEnabled((value) => !value);
            setSaveState('idle');
          }}
          title="Long-stay discount"
          styles={styles}
        />

        {longStayDiscountEnabled ? (
          <View style={styles.fieldGrid}>
            <NumberField
              label="Starts after"
              suffix="units"
              onChangeText={(value) => {
                setLongStayMinUnits(value);
                setSaveState('idle');
              }}
              value={longStayMinUnits}
              styles={styles}
            />
            <PercentField
              label="Long-stay discount"
              onChangeText={(value) => {
                setLongStayDiscountPercent(value);
                setSaveState('idle');
              }}
              value={longStayDiscountPercent}
              styles={styles}
            />
          </View>
        ) : null}

        <SettingCard
          active={repeatDiscountEnabled}
          description="Reward repeat Pet Parents when they book with you again."
          icon={
            <Sparkles
              color={palette.primary}
              size={20}
              strokeWidth={2.3}
            />
          }
          onPress={() => {
            setRepeatDiscountEnabled((value) => !value);
            setSaveState('idle');
          }}
          title="Repeat Pet Parent discount"
          styles={styles}
        />

        {repeatDiscountEnabled ? (
          <PercentField
            label="Repeat booking discount"
            onChangeText={(value) => {
              setRepeatDiscountPercent(value);
              setSaveState('idle');
            }}
            value={repeatDiscountPercent}
            styles={styles}
          />
        ) : null}

        {renderPreviewCard()}
      </View>
    );
  }

  function renderAvailabilityStep() {
    return (
      <View style={styles.stepBody}>
        <View style={styles.contentCard}>
          <Text style={styles.cardEyebrow}>PUBLIC BOOKING STATUS</Text>
          <Text style={styles.cardTitle}>
            Control how Pet Parents can reach you
          </Text>

          <View style={styles.statusStack}>
            {BOOKING_STATUS_OPTIONS.map((option) => {
              const active = bookingStatus === option.value;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    setBookingStatus(option.value);
                    setSaveState('idle');
                  }}
                  style={[
                    styles.statusOption,
                    active && styles.statusOptionActive,
                  ]}
                >
                  <View
                    style={[
                      styles.statusRadio,
                      active && styles.statusRadioActive,
                    ]}
                  >
                    {active ? (
                      <Check
                        color="#FFFFFF"
                        size={13}
                        strokeWidth={2.7}
                      />
                    ) : null}
                  </View>

                  <View style={styles.statusOptionCopy}>
                    <Text
                      style={[
                        styles.statusOptionTitle,
                        active &&
                          styles.statusOptionTitleActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text style={styles.statusOptionText}>
                      {option.description}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <NumberField
          label="Service radius"
          suffix="miles"
          onChangeText={(value) => {
            setServiceRadiusMiles(value);
            setSaveState('idle');
          }}
          value={serviceRadiusMiles}
          styles={styles}
        />

        <SettingCard
          active={acceptSameDay}
          description="Allow Pet Parents to request care for today when your calendar permits it."
          icon={
            <Clock3
              color={palette.primary}
              size={20}
              strokeWidth={2.3}
            />
          }
          onPress={() => {
            setAcceptSameDay((value) => !value);
            setSaveState('idle');
          }}
          title="Accept same-day requests"
          styles={styles}
        />

        <SettingCard
          active={acceptWeekends}
          description="Allow weekend dates unless you mark them unavailable."
          icon={
            <CalendarDays
              color={palette.primary}
              size={20}
              strokeWidth={2.3}
            />
          }
          onPress={() => {
            setAcceptWeekends((value) => !value);
            setSaveState('idle');
          }}
          title="Accept weekends"
          styles={styles}
        />

        <SettingCard
          active={acceptHolidays}
          description="Allow peak and holiday dates with your pricing rules."
          icon={
            <Sparkles
              color={palette.primary}
              size={20}
              strokeWidth={2.3}
            />
          }
          onPress={() => {
            setAcceptHolidays((value) => !value);
            setSaveState('idle');
          }}
          title="Accept holidays"
          styles={styles}
        />

        <NumberField
          label="Advance booking window"
          suffix="days"
          onChangeText={(value) => {
            setAdvanceBookingWindow(value);
            setSaveState('idle');
          }}
          value={advanceBookingWindow}
          styles={styles}
        />

        <TextArea
          label="Availability notes"
          onChangeText={(value) => {
            setAvailabilityNotes(value);
            setSaveState('idle');
          }}
          placeholder="Share schedule limits, travel rules, unavailable seasons, or booking preferences."
          value={availabilityNotes}
          styles={styles}
        />
      </View>
    );
  }

  function renderPreviewStep() {
    const enabledServices = services.filter(
      (service) => serviceRates[service.id].enabled,
    );

    return (
      <View style={styles.stepBody}>
        {renderServiceSelector()}
        {renderPreviewCard()}

        <View style={styles.contentCard}>
          <Text style={styles.cardEyebrow}>GURU PRICING SUMMARY</Text>
          <Text style={styles.cardTitle}>
            Ready to publish your settings
          </Text>

          <SummaryRow
            label="Services offered"
            value={String(enabledServices.length)}
            styles={styles}
          />
          <SummaryRow
            label="Selected service"
            value={selectedService.title}
            styles={styles}
          />
          <SummaryRow
            label="Base rate"
            value={`${currency(
              toNumber(selectedRate.baseRate),
            )} / ${selectedService.rateUnit}`}
            styles={styles}
          />
          <SummaryRow
            label="Additional pet"
            value={`${currency(
              toNumber(selectedRate.additionalPetRate),
            )} / ${selectedService.rateUnit}`}
            styles={styles}
          />
          <SummaryRow
            label="Public status"
            value={
              BOOKING_STATUS_OPTIONS.find(
                (option) => option.value === bookingStatus,
              )?.label ?? bookingStatus
            }
            styles={styles}
          />
          <SummaryRow
            label="Service radius"
            value={`${serviceRadiusMiles || '0'} miles`}
            styles={styles}
          />
          <SummaryRow
            label="Booking window"
            value={`${advanceBookingWindow || '0'} days`}
            styles={styles}
            last
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/guru-earnings')}
          style={styles.linkCard}
        >
          <View style={styles.linkIcon}>
            <WalletCards
              color={palette.primary}
              size={21}
              strokeWidth={2.3}
            />
          </View>

          <View style={styles.linkCopy}>
            <Text style={styles.linkTitle}>
              Earnings & payout readiness
            </Text>
            <Text style={styles.linkText}>
              Review Stripe status, available balances, and payout activity.
            </Text>
          </View>

          <ChevronRight
            color={palette.primary}
            size={18}
            strokeWidth={2.3}
          />
        </Pressable>

        <View style={styles.saveStateCard}>
          <Save
            color={
              saveState === 'saved'
                ? palette.primary
                : palette.muted
            }
            size={21}
            strokeWidth={2.3}
          />
          <View style={styles.saveStateCopy}>
            <Text style={styles.saveStateTitle}>
              {saveState === 'saved'
                ? 'Pricing saved'
                : saveState === 'session-only'
                  ? 'Session-only changes'
                  : 'Ready to save'}
            </Text>
            <Text style={styles.saveStateText}>
              {saveState === 'saved'
                ? 'Your Guru pricing workspace is up to date.'
                : saveState === 'session-only'
                  ? 'The interface is updated, but the pricing database schema still needs final connection.'
                  : 'Tap Save Pricing to publish these settings to your Guru account.'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  function renderStepContent() {
    if (currentStep === 1) return renderRatesStep();
    if (currentStep === 2) return renderCalendarStep();
    if (currentStep === 3) return renderDiscountsStep();
    if (currentStep === 4) return renderAvailabilityStep();
    return renderPreviewStep();
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

                <SaveFeedbackBanner
                  feedback={feedback}
                  isDark={isDark}
                  onDismiss={dismissFeedback}
                />

                <ScrollView
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={() => void loadPricing(true)}
                      tintColor={palette.primary}
                      colors={[palette.primary]}
                    />
                  }
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
                      <Text style={styles.title}>Pricing & Availability</Text>
                      <Text style={styles.subtitle}>
                        Rates, calendar rules, and booking readiness.
                      </Text>
                    </View>

                    <View style={styles.headerActions}>
                      <View style={styles.modeToggle}>
                        {THEME_OPTIONS.map((option) => {
                          const active =
                            themePreference === option.value;

                          return (
                            <Pressable
                              key={option.value}
                              accessibilityRole="button"
                              accessibilityState={{
                                selected: active,
                              }}
                              accessibilityLabel={`Switch to ${option.label} mode`}
                              onPress={() =>
                                setThemePreference(option.value)
                              }
                              style={[
                                styles.modeButton,
                                active &&
                                  styles.modeButtonActive,
                              ]}
                            >
                              <SitGuruIcon
                                name={option.icon}
                                size={15}
                                color={
                                  active
                                    ? option.value === 'light'
                                      ? '#F3AA1F'
                                      : '#F0CF62'
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
                        accessibilityLabel="Open Guru profile"
                        onPress={() => router.push('/guru-profile')}
                        style={styles.avatarButton}
                      >
                        <Avatar
                          fallback={initials(profileName)}
                          imageUrl={avatarUrl}
                          palette={palette}
                          size={40}
                        />
                      </Pressable>
                    </View>
                  </View>

                  {message ? (
                    <View style={styles.notice}>
                      <Text style={styles.noticeText}>{message}</Text>
                    </View>
                  ) : null}

                  <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                      <View>
                        <Text style={styles.progressEyebrow}>
                          STEP {currentStep} OF 5
                        </Text>
                        <Text style={styles.progressTitle}>
                          {activeStep.title}
                        </Text>
                      </View>

                      <Text style={styles.progressPercent}>
                        {progressPercent}%
                      </Text>
                    </View>

                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${progressPercent}%` as `${number}%`,
                          },
                        ]}
                      />
                    </View>

                    <Text style={styles.progressText}>
                      {activeStep.description}
                    </Text>
                  </View>

                  <ScrollView
                    horizontal
                    contentContainerStyle={styles.stepRail}
                    showsHorizontalScrollIndicator={false}
                  >
                    {pricingSteps.map((step) => {
                      const active = currentStep === step.step;
                      const complete = step.step < currentStep;

                      return (
                        <Pressable
                          key={step.step}
                          accessibilityRole="button"
                          accessibilityState={{
                            selected: active,
                          }}
                          onPress={() =>
                            setCurrentStep(step.step)
                          }
                          style={[
                            styles.stepPill,
                            active && styles.stepPillActive,
                            complete &&
                              styles.stepPillComplete,
                          ]}
                        >
                          <View
                            style={[
                              styles.stepNumber,
                              active &&
                                styles.stepNumberActive,
                              complete &&
                                styles.stepNumberComplete,
                            ]}
                          >
                            {complete ? (
                              <Check
                                color="#FFFFFF"
                                size={12}
                                strokeWidth={2.7}
                              />
                            ) : (
                              <Text
                                style={[
                                  styles.stepNumberText,
                                  active &&
                                    styles.stepNumberTextActive,
                                ]}
                              >
                                {step.step}
                              </Text>
                            )}
                          </View>

                          <Text
                            style={[
                              styles.stepPillText,
                              active &&
                                styles.stepPillTextActive,
                            ]}
                          >
                            {step.shortTitle}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  {loading ? (
                    <LoadingCard styles={styles} />
                  ) : (
                    renderStepContent()
                  )}
                </ScrollView>

                <View style={styles.actionDock}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={goBack}
                    style={styles.secondaryDockButton}
                  >
                    <Text style={styles.secondaryDockText}>
                      {currentStep === 1 ? 'Dashboard' : 'Previous'}
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    disabled={saving}
                    onPress={() => void goNext()}
                    style={styles.primaryDockButton}
                  >
                    {currentStep === 5 ? (
                      saveState === 'saved' ? (
                        <CheckCircle2
                          color="#FFFFFF"
                          size={17}
                          strokeWidth={2.4}
                        />
                      ) : (
                        <Save
                          color="#FFFFFF"
                          size={17}
                          strokeWidth={2.4}
                        />
                      )
                    ) : null}

                    <Text style={styles.primaryDockText}>
                      {saving
                        ? 'Saving...'
                        : currentStep === 5
                          ? saveState === 'saved'
                            ? 'Saved'
                            : 'Save Pricing'
                          : 'Continue'}
                    </Text>

                    {currentStep < 5 ? (
                      <ChevronRight
                        color="#FFFFFF"
                        size={17}
                        strokeWidth={2.4}
                      />
                    ) : null}
                  </Pressable>
                </View>

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
                    icon={
                      <MapPin
                        color={palette.navMuted}
                        size={21}
                        strokeWidth={2.3}
                      />
                    }
                    label="Care Map"
                    onPress={() => router.push('/guru-care-map')}
                    styles={styles}
                  />
                  <BottomNavItem
                    active
                    icon={
                      <CircleDollarSign
                        color={palette.primary}
                        size={21}
                        strokeWidth={2.4}
                      />
                    }
                    label="Pricing"
                    onPress={() => undefined}
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

function MoneyField({
  label,
  onChangeText,
  styles,
  value,
}: {
  label: string;
  onChangeText: (value: string) => void;
  styles: ReturnType<typeof createStyles>;
  value: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputShell}>
        <Text style={styles.inputPrefix}>$</Text>
        <TextInput
          keyboardType="decimal-pad"
          onChangeText={onChangeText}
          placeholder="0"
          placeholderTextColor={stylesPlaceholder(styles)}
          style={styles.input}
          value={value}
        />
      </View>
    </View>
  );
}

function PercentField({
  label,
  onChangeText,
  styles,
  value,
}: {
  label: string;
  onChangeText: (value: string) => void;
  styles: ReturnType<typeof createStyles>;
  value: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputShell}>
        <TextInput
          keyboardType="decimal-pad"
          onChangeText={onChangeText}
          placeholder="0"
          placeholderTextColor={stylesPlaceholder(styles)}
          style={styles.input}
          value={value}
        />
        <Text style={styles.inputSuffix}>%</Text>
      </View>
    </View>
  );
}

function NumberField({
  label,
  onChangeText,
  styles,
  suffix,
  value,
}: {
  label: string;
  onChangeText: (value: string) => void;
  styles: ReturnType<typeof createStyles>;
  suffix: string;
  value: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputShell}>
        <TextInput
          keyboardType="number-pad"
          onChangeText={onChangeText}
          placeholder="0"
          placeholderTextColor={stylesPlaceholder(styles)}
          style={styles.input}
          value={value}
        />
        <Text style={styles.inputSuffix}>{suffix}</Text>
      </View>
    </View>
  );
}

function TextArea({
  label,
  onChangeText,
  placeholder,
  styles,
  value,
}: {
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  styles: ReturnType<typeof createStyles>;
  value: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        multiline
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={stylesPlaceholder(styles)}
        style={[styles.inputShell, styles.textArea]}
        textAlignVertical="top"
        value={value}
      />
    </View>
  );
}

function TogglePill({
  active,
  label,
  onPress,
  styles,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ checked: active }}
      onPress={onPress}
      style={[
        styles.togglePill,
        active && styles.togglePillActive,
      ]}
    >
      <View
        style={[
          styles.togglePillDot,
          active && styles.togglePillDotActive,
        ]}
      />
      <Text
        style={[
          styles.togglePillText,
          active && styles.togglePillTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SettingCard({
  active,
  description,
  icon,
  onPress,
  styles,
  title,
}: {
  active: boolean;
  description: string;
  icon: ReactNode;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  title: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ checked: active }}
      onPress={onPress}
      style={[
        styles.settingCard,
        active && styles.settingCardActive,
      ]}
    >
      <View style={styles.settingIcon}>{icon}</View>

      <View style={styles.settingCopy}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingText}>{description}</Text>
      </View>

      <View
        style={[
          styles.switchTrack,
          active && styles.switchTrackActive,
        ]}
      >
        <View
          style={[
            styles.switchThumb,
            active && styles.switchThumbActive,
          ]}
        />
      </View>
    </Pressable>
  );
}

function RuleButton({
  danger = false,
  label,
  onPress,
  styles,
}: {
  danger?: boolean;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.ruleButton,
        danger && styles.ruleButtonDanger,
      ]}
    >
      <Text
        style={[
          styles.ruleButtonText,
          danger && styles.ruleButtonDangerText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function PreviewRow({
  discount = false,
  label,
  styles,
  value,
}: {
  discount?: boolean;
  label: string;
  styles: ReturnType<typeof createStyles>;
  value: string;
}) {
  return (
    <View style={styles.previewRow}>
      <Text
        style={[
          styles.previewRowLabel,
          discount && styles.previewDiscountText,
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.previewRowValue,
          discount && styles.previewDiscountText,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function SummaryRow({
  label,
  last = false,
  styles,
  value,
}: {
  label: string;
  last?: boolean;
  styles: ReturnType<typeof createStyles>;
  value: string;
}) {
  return (
    <View
      style={[
        styles.summaryRow,
        last && styles.summaryRowLast,
      ]}
    >
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function LoadingCard({
  styles,
}: {
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.loadingCard}>
      <View style={styles.loadingLineLarge} />
      <View style={styles.loadingLineMedium} />
      <View style={styles.loadingLineSmall} />
    </View>
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
  const [failed, setFailed] = useState(false);

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
      {imageUrl && !failed ? (
        <Image
          onError={() => setFailed(true)}
          resizeMode="cover"
          source={{ uri: imageUrl }}
          style={{ height: '100%', width: '100%' }}
        />
      ) : (
        <Text
          style={{
            color: palette.primary,
            fontFamily: AppFonts.extraBold,
            fontSize: 12,
          }}
        >
          {fallback}
        </Text>
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
      style={styles.navItem}
    >
      {icon}
      <Text
        style={active ? styles.navLabelActive : styles.navLabel}
      >
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

async function findPricingSettings(userId: string) {
  for (const table of PRICING_TABLES) {
    for (const ownerField of OWNER_FIELDS) {
      const result = await supabase
        .from(table)
        .select('*')
        .eq(ownerField, userId)
        .limit(1);

      if (!result.error && result.data?.length) {
        const row = result.data[0] as RecordRow;

        for (const field of PRICING_FIELDS) {
          const parsed = parsePricingValue(row[field]);
          if (parsed) return parsed;
        }

        const parsedRow = parsePricingValue(row);
        if (parsedRow) return parsedRow;
      }
    }
  }

  return null;
}

async function persistPricingSettings(
  userId: string,
  payload: PricingPayload,
) {
  const now = new Date().toISOString();

  for (const table of PRICING_TABLES) {
    for (const ownerField of OWNER_FIELDS) {
      for (const pricingField of PRICING_FIELDS) {
        const updatePayload = {
          [pricingField]: payload,
          updated_at: now,
        };

        const updateResult = await supabase
          .from(table)
          .update(updatePayload)
          .eq(ownerField, userId)
          .select('id')
          .limit(1);

        if (
          !updateResult.error &&
          updateResult.data &&
          updateResult.data.length > 0
        ) {
          return true;
        }

        const insertResult = await supabase
          .from(table)
          .insert({
            [ownerField]: userId,
            [pricingField]: payload,
            created_at: now,
            updated_at: now,
          })
          .select('id')
          .limit(1);

        if (!insertResult.error) {
          return true;
        }
      }
    }
  }

  return false;
}

function parsePricingValue(value: unknown): PricingPayload | null {
  if (!value) return null;

  let candidate: unknown = value;

  if (typeof candidate === 'string') {
    try {
      candidate = JSON.parse(candidate);
    } catch {
      return null;
    }
  }

  if (
    typeof candidate !== 'object' ||
    candidate === null ||
    Array.isArray(candidate)
  ) {
    return null;
  }

  const record = candidate as RecordRow;
  const nested =
    record.pricing_settings ??
    record.pricing_data ??
    record.settings ??
    record.data;

  if (nested && nested !== candidate) {
    return parsePricingValue(nested);
  }

  if (!record.serviceRates && !record.service_rates) {
    return null;
  }

  return normalizePricingPayload(record);
}

function normalizePricingPayload(record: RecordRow): PricingPayload {
  const serviceRatesValue =
    (record.serviceRates ?? record.service_rates) as
      | Record<string, unknown>
      | undefined;

  const normalizedRates = { ...defaultRates };

  for (const service of services) {
    const raw = serviceRatesValue?.[service.id];

    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const rate = raw as RecordRow;

      normalizedRates[service.id] = {
        baseRate:
          firstString(rate, ['baseRate', 'base_rate']) ||
          defaultRates[service.id].baseRate,
        additionalPetRate:
          firstString(rate, [
            'additionalPetRate',
            'additional_pet_rate',
          ]) || defaultRates[service.id].additionalPetRate,
        enabled:
          firstBoolean(rate, ['enabled', 'is_enabled']) ||
          defaultRates[service.id].enabled,
      };
    }
  }

  return {
    version: firstNumber(record, ['version']) ?? 1,
    serviceRates: normalizedRates,
    dayRules:
      ((record.dayRules ?? record.day_rules) as Record<
        string,
        DayRule
      >) ?? {},
    weekendAdjustment:
      firstString(record, [
        'weekendAdjustment',
        'weekend_adjustment',
      ]) || '8',
    holidayAdjustment:
      firstString(record, [
        'holidayAdjustment',
        'holiday_adjustment',
      ]) || '15',
    multiPetDiscountEnabled: firstBoolean(record, [
      'multiPetDiscountEnabled',
      'multi_pet_discount_enabled',
    ]),
    multiPetDiscountPercent:
      firstString(record, [
        'multiPetDiscountPercent',
        'multi_pet_discount_percent',
      ]) || '10',
    longStayDiscountEnabled: firstBoolean(record, [
      'longStayDiscountEnabled',
      'long_stay_discount_enabled',
    ]),
    longStayMinUnits:
      firstString(record, [
        'longStayMinUnits',
        'long_stay_min_units',
      ]) || '5',
    longStayDiscountPercent:
      firstString(record, [
        'longStayDiscountPercent',
        'long_stay_discount_percent',
      ]) || '8',
    repeatDiscountEnabled: firstBoolean(record, [
      'repeatDiscountEnabled',
      'repeat_discount_enabled',
    ]),
    repeatDiscountPercent:
      firstString(record, [
        'repeatDiscountPercent',
        'repeat_discount_percent',
      ]) || '5',
    acceptSameDay: firstBoolean(record, [
      'acceptSameDay',
      'accept_same_day',
    ]),
    acceptWeekends: firstBoolean(record, [
      'acceptWeekends',
      'accept_weekends',
    ]),
    acceptHolidays: firstBoolean(record, [
      'acceptHolidays',
      'accept_holidays',
    ]),
    advanceBookingWindow:
      firstString(record, [
        'advanceBookingWindow',
        'advance_booking_window',
      ]) || '180',
    availabilityNotes:
      firstString(record, [
        'availabilityNotes',
        'availability_notes',
      ]) || '',
    bookingStatus:
      normalizeBookingStatus(
        firstString(record, ['bookingStatus', 'booking_status']),
      ) ?? 'requestable',
    serviceRadiusMiles:
      firstString(record, [
        'serviceRadiusMiles',
        'service_radius_miles',
      ]) || '20',
  };
}

function applyPricingPayload(
  payload: PricingPayload,
  setters: {
    setAcceptHolidays: (value: boolean) => void;
    setAcceptSameDay: (value: boolean) => void;
    setAcceptWeekends: (value: boolean) => void;
    setAdvanceBookingWindow: (value: string) => void;
    setAvailabilityNotes: (value: string) => void;
    setBookingStatus: (value: GuruBookingStatus) => void;
    setDayRules: (value: Record<string, DayRule>) => void;
    setHolidayAdjustment: (value: string) => void;
    setLongStayDiscountEnabled: (value: boolean) => void;
    setLongStayDiscountPercent: (value: string) => void;
    setLongStayMinUnits: (value: string) => void;
    setMultiPetDiscountEnabled: (value: boolean) => void;
    setMultiPetDiscountPercent: (value: string) => void;
    setRepeatDiscountEnabled: (value: boolean) => void;
    setRepeatDiscountPercent: (value: string) => void;
    setServiceRadiusMiles: (value: string) => void;
    setServiceRates: (
      value: Record<ServiceId, ServiceRate>,
    ) => void;
    setWeekendAdjustment: (value: string) => void;
  },
) {
  setters.setServiceRates(payload.serviceRates);
  setters.setDayRules(payload.dayRules);
  setters.setWeekendAdjustment(payload.weekendAdjustment);
  setters.setHolidayAdjustment(payload.holidayAdjustment);
  setters.setMultiPetDiscountEnabled(
    payload.multiPetDiscountEnabled,
  );
  setters.setMultiPetDiscountPercent(
    payload.multiPetDiscountPercent,
  );
  setters.setLongStayDiscountEnabled(
    payload.longStayDiscountEnabled,
  );
  setters.setLongStayMinUnits(payload.longStayMinUnits);
  setters.setLongStayDiscountPercent(
    payload.longStayDiscountPercent,
  );
  setters.setRepeatDiscountEnabled(
    payload.repeatDiscountEnabled,
  );
  setters.setRepeatDiscountPercent(
    payload.repeatDiscountPercent,
  );
  setters.setAcceptSameDay(payload.acceptSameDay);
  setters.setAcceptWeekends(payload.acceptWeekends);
  setters.setAcceptHolidays(payload.acceptHolidays);
  setters.setAdvanceBookingWindow(
    payload.advanceBookingWindow,
  );
  setters.setAvailabilityNotes(payload.availabilityNotes);
  setters.setBookingStatus(payload.bookingStatus);
  setters.setServiceRadiusMiles(payload.serviceRadiusMiles);
}

function currency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(Math.max(0, value));
}

function toNumber(value: string) {
  const clean = value.replace(/[^\d.]/g, '');
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : 0;
}

function padNumber(value: number) {
  return String(value).padStart(2, '0');
}

function toDateId(date: Date) {
  return `${date.getFullYear()}-${padNumber(
    date.getMonth() + 1,
  )}-${padNumber(date.getDate())}`;
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + months,
    1,
  );
}

function sameMonth(date: Date, displayMonth: Date) {
  return (
    date.getFullYear() === displayMonth.getFullYear() &&
    date.getMonth() === displayMonth.getMonth()
  );
}

function isToday(date: Date) {
  return toDateId(date) === toDateId(new Date());
}

function isWeekend(date: Date) {
  return date.getDay() === 0 || date.getDay() === 6;
}

function isPeakDate(date: Date) {
  const day = date.getDate();
  return day === 4 || day === 24 || day === 31;
}

function buildCalendarMonth(displayMonth: Date) {
  const firstDay = monthStart(displayMonth);
  const offset = firstDay.getDay();
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(firstDay.getDate() - offset);

  const days: CalendarDay[] = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);

    days.push({
      id: toDateId(date),
      date,
      day: String(date.getDate()),
    });
  }

  return days;
}

function buildCalendarWeeks(days: CalendarDay[]) {
  const weeks: CalendarDay[][] = [];

  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return weeks;
}

function normalizeBookingStatus(
  value: string,
): GuruBookingStatus | null {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (
    normalized === 'not_listed' ||
    normalized === 'listed_only' ||
    normalized === 'requestable' ||
    normalized === 'bookable'
  ) {
    return normalized;
  }

  return null;
}

function firstString(record: RecordRow, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (
      typeof value === 'number' &&
      Number.isFinite(value)
    ) {
      return String(value);
    }
  }

  return '';
}

function firstNumber(record: RecordRow, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (
      typeof value === 'number' &&
      Number.isFinite(value)
    ) {
      return value;
    }

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
    if (value === 1 || value === '1' || value === 'true') {
      return true;
    }
  }

  return false;
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return 'GG';
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function stylesPlaceholder(
  styles: ReturnType<typeof createStyles>,
) {
  return String(
    StyleSheet.flatten(styles.placeholderColor)?.color ??
      '#87928C',
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
    placeholderColor: {
      color: palette.muted,
    },
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
    screen: {
      backgroundColor: palette.background,
      flex: 1,
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
      paddingBottom: 184,
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    headerCopy: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 18,
      letterSpacing: -0.35,
    },
    subtitle: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
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
    avatarButton: {
      borderRadius: 999,
    },
    notice: {
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
    progressCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 19,
      borderWidth: 1,
      gap: 8,
      padding: 12,
    },
    progressHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    progressEyebrow: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 7,
      letterSpacing: 0.75,
    },
    progressTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 15,
      marginTop: 2,
    },
    progressPercent: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 16,
    },
    progressTrack: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 7,
      overflow: 'hidden',
    },
    progressFill: {
      backgroundColor: palette.primary,
      borderRadius: 999,
      height: '100%',
    },
    progressText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
    },
    stepRail: {
      gap: 7,
      paddingRight: 4,
    },
    stepPill: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 5,
      minHeight: 36,
      paddingHorizontal: 10,
    },
    stepPillActive: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    stepPillComplete: {
      borderColor: palette.primary,
    },
    stepNumber: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 20,
      justifyContent: 'center',
      width: 20,
    },
    stepNumberActive: {
      backgroundColor: 'rgba(255,255,255,0.18)',
    },
    stepNumberComplete: {
      backgroundColor: palette.primary,
    },
    stepNumberText: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 7,
    },
    stepNumberTextActive: {
      color: '#FFFFFF',
    },
    stepPillText: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 8,
    },
    stepPillTextActive: {
      color: '#FFFFFF',
    },
    stepBody: {
      gap: 11,
    },
    serviceRail: {
      gap: 7,
      paddingRight: 4,
    },
    servicePill: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 6,
      minHeight: 36,
      paddingHorizontal: 11,
    },
    servicePillActive: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    serviceStatusDot: {
      backgroundColor: palette.muted,
      borderRadius: 999,
      height: 7,
      width: 7,
    },
    serviceStatusDotActive: {
      backgroundColor: isDark ? '#39D982' : '#87D8A4',
    },
    servicePillText: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 8,
    },
    servicePillTextActive: {
      color: '#FFFFFF',
    },
    contentCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 10,
      padding: 13,
    },
    cardHeaderRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'space-between',
    },
    cardHeaderCopy: {
      flex: 1,
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
      fontSize: 14,
      marginTop: 2,
    },
    cardText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
    },
    togglePill: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    togglePillActive: {
      backgroundColor: palette.primarySoft,
    },
    togglePillDot: {
      backgroundColor: palette.muted,
      borderRadius: 999,
      height: 7,
      width: 7,
    },
    togglePillDotActive: {
      backgroundColor: palette.primary,
    },
    togglePillText: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 7,
    },
    togglePillTextActive: {
      color: palette.primary,
    },
    fieldGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 9,
    },
    fieldWrap: {
      flex: 1,
      gap: 6,
      minWidth: 145,
    },
    fieldLabel: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 8,
    },
    inputShell: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: 'row',
      minHeight: 46,
      paddingHorizontal: 11,
    },
    input: {
      color: palette.title,
      flex: 1,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
      paddingVertical: 0,
    },
    inputPrefix: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
      marginRight: 5,
    },
    inputSuffix: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 8,
      marginLeft: 5,
    },
    textArea: {
      color: palette.title,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 14,
      minHeight: 98,
      paddingTop: 12,
    },
    previewCard: {
      backgroundColor: isDark ? '#087A4C' : '#087F50',
      borderRadius: 20,
      gap: 10,
      padding: 13,
    },
    previewHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    previewEyebrow: {
      color: 'rgba(255,255,255,0.72)',
      fontFamily: AppFonts.bold,
      fontSize: 7,
      letterSpacing: 0.7,
    },
    previewTitle: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 27,
      marginTop: 2,
    },
    previewServicePill: {
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },
    previewServiceText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.bold,
      fontSize: 7,
    },
    previewRows: {
      borderTopColor: 'rgba(255,255,255,0.20)',
      borderTopWidth: 1,
      gap: 7,
      paddingTop: 9,
    },
    previewRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'space-between',
    },
    previewRowLabel: {
      color: 'rgba(255,255,255,0.78)',
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
    previewRowValue: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    previewDiscountText: {
      color: '#D9FF90',
    },
    previewNote: {
      color: 'rgba(255,255,255,0.75)',
      fontFamily: AppFonts.medium,
      fontSize: 7,
      lineHeight: 11,
    },
    calendarCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 10,
      padding: 12,
    },
    calendarHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    monthControls: {
      flexDirection: 'row',
      gap: 6,
    },
    monthButton: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    calendarHelp: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 7,
      lineHeight: 11,
    },
    weekdayRow: {
      flexDirection: 'row',
      gap: 4,
    },
    weekdayText: {
      color: palette.muted,
      flex: 1,
      fontFamily: AppFonts.bold,
      fontSize: 7,
      textAlign: 'center',
    },
    calendarWeeks: {
      gap: 4,
    },
    calendarWeek: {
      flexDirection: 'row',
      gap: 4,
    },
    dateCell: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.border,
      borderRadius: 10,
      borderWidth: 1,
      flex: 1,
      minHeight: 47,
      paddingHorizontal: 2,
      paddingVertical: 5,
    },
    dateOutsideMonth: {
      opacity: 0.38,
    },
    dateToday: {
      borderColor: palette.primary,
      borderWidth: 1.5,
    },
    dateSelected: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    dateBusy: {
      backgroundColor: isDark ? '#3A251D' : '#FFF0E7',
    },
    dateDay: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
    },
    datePrice: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 6,
      marginTop: 2,
    },
    dateTextSelected: {
      color: '#FFFFFF',
    },
    dateTextMuted: {
      color: palette.orange,
    },
    ruleGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },
    ruleButton: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      minHeight: 34,
      justifyContent: 'center',
      paddingHorizontal: 11,
    },
    ruleButtonDanger: {
      backgroundColor: isDark ? '#3A251D' : '#FFF0E7',
      borderColor: isDark ? '#75513D' : '#F1C8AD',
    },
    ruleButtonText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 7,
    },
    ruleButtonDangerText: {
      color: palette.orange,
    },
    settingCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      padding: 11,
    },
    settingCardActive: {
      borderColor: palette.primary,
    },
    settingIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 12,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    settingCopy: {
      flex: 1,
      gap: 2,
    },
    settingTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
    },
    settingText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 7,
      lineHeight: 11,
    },
    switchTrack: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 24,
      padding: 3,
      width: 43,
    },
    switchTrackActive: {
      backgroundColor: palette.primary,
    },
    switchThumb: {
      backgroundColor: palette.muted,
      borderRadius: 999,
      height: 18,
      width: 18,
    },
    switchThumbActive: {
      alignSelf: 'flex-end',
      backgroundColor: '#FFFFFF',
    },
    statusStack: {
      gap: 8,
    },
    statusOption: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.border,
      borderRadius: 15,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 9,
      padding: 10,
    },
    statusOptionActive: {
      backgroundColor: palette.primarySoft,
      borderColor: palette.primary,
    },
    statusRadio: {
      alignItems: 'center',
      borderColor: palette.muted,
      borderRadius: 999,
      borderWidth: 1,
      height: 24,
      justifyContent: 'center',
      width: 24,
    },
    statusRadioActive: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    statusOptionCopy: {
      flex: 1,
      gap: 2,
    },
    statusOptionTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    statusOptionTitleActive: {
      color: palette.primary,
    },
    statusOptionText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 7,
      lineHeight: 11,
    },
    summaryRow: {
      alignItems: 'center',
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 9,
      justifyContent: 'space-between',
      minHeight: 36,
    },
    summaryRowLast: {
      borderBottomWidth: 0,
    },
    summaryLabel: {
      color: palette.muted,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 8,
    },
    summaryValue: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
      textAlign: 'right',
    },
    linkCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      padding: 11,
    },
    linkIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 12,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    linkCopy: {
      flex: 1,
      gap: 2,
    },
    linkTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
    },
    linkText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 7,
      lineHeight: 11,
    },
    saveStateCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      padding: 11,
    },
    saveStateCopy: {
      flex: 1,
      gap: 2,
    },
    saveStateTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 10,
    },
    saveStateText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 7,
      lineHeight: 11,
    },
    loadingCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 8,
      padding: 14,
    },
    loadingLineLarge: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 11,
      width: '54%',
    },
    loadingLineMedium: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 8,
      width: '82%',
    },
    loadingLineSmall: {
      backgroundColor: palette.surfaceSoft,
      borderRadius: 999,
      height: 8,
      width: '38%',
    },
    actionDock: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 19,
      borderWidth: 1,
      bottom: 82,
      flexDirection: 'row',
      gap: 8,
      left: 9,
      padding: 7,
      position: 'absolute',
      right: 9,
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: isDark ? 0.2 : 0.06,
      shadowRadius: 10,
    },
    secondaryDockButton: {
      alignItems: 'center',
      borderColor: palette.primary,
      borderRadius: 999,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 40,
      minWidth: 88,
      paddingHorizontal: 12,
    },
    secondaryDockText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    primaryDockButton: {
      alignItems: 'center',
      backgroundColor: palette.primary,
      borderRadius: 999,
      flex: 1,
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 12,
    },
    primaryDockText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    bottomNav: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 23,
      borderWidth: 1,
      bottom: 8,
      flexDirection: 'row',
      height: 68,
      left: 9,
      paddingBottom: 6,
      paddingHorizontal: 5,
      paddingTop: 6,
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