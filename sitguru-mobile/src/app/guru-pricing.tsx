import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
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

type RequestStep = 1 | 2 | 3 | 4 | 5 | 6;
type CareMode = 'single' | 'overnight' | 'multi-day';
type AvailabilityStatus = 'available' | 'limited' | 'unavailable';

type RequestStepConfig = {
  step: RequestStep;
  shortTitle: string;
  title: string;
  description: string;
};

type PetOption = {
  id: string;
  name: string;
  type: 'Dog' | 'Cat' | 'Other';
  details: string;
  emoji: string;
};

type ServiceOption = {
  id: string;
  label: string;
  detail: string;
  duration: string;
  mode: CareMode;
  baseRate: number;
  additionalPetRate: number;
  rateUnit: string;
  bestFor: string;
};

type CalendarDate = {
  id: string;
  date: Date;
  day: string;
  fullLabel: string;
  shortLabel: string;
  status: AvailabilityStatus;
  priceAdjustment: number;
  priceLabel?: string;
};

const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const requestSteps: RequestStepConfig[] = [
  {
    step: 1,
    shortTitle: 'Pet',
    title: 'Choose a pet',
    description:
      'Select the Pet Passport connected to this request so the Guru can review the right care details.',
  },
  {
    step: 2,
    shortTitle: 'Service',
    title: 'Choose care type',
    description:
      'Pick the care service you need, including walks, drop-ins, overnight care, boarding, or multi-day care.',
  },
  {
    step: 3,
    shortTitle: 'Calendar',
    title: 'Choose dates and time',
    description:
      'Use the calendar-style picker for single visits, overnight stays, or multi-day care windows.',
  },
  {
    step: 4,
    shortTitle: 'Details',
    title: 'Add care details',
    description:
      'Share routines, access notes, safety details, and PawReport™ preferences so the Guru can prepare.',
  },
  {
    step: 5,
    shortTitle: 'Review',
    title: 'Review your request',
    description:
      'Review the Guru, pet, service, schedule, notes, savings, and estimated price before sending.',
  },
  {
    step: 6,
    shortTitle: 'Send',
    title: 'Send request',
    description:
      'Send the request to the Guru for review. Payment should happen later after the Guru accepts.',
  },
];

const pets: PetOption[] = [
  {
    id: 'scout',
    name: 'Scout',
    type: 'Dog',
    details: 'Friendly dog • 30-minute walk',
    emoji: '🐶',
  },
  {
    id: 'luna',
    name: 'Luna',
    type: 'Cat',
    details: 'Indoor cat • Feeding and litter notes',
    emoji: '🐱',
  },
  {
    id: 'add-pet',
    name: 'Add another pet',
    type: 'Other',
    details: 'Create or update a Pet Passport',
    emoji: '＋',
  },
];

const services: ServiceOption[] = [
  {
    id: 'dog-walking',
    label: 'Dog Walking',
    detail: 'Walks, potty breaks, exercise, and outdoor time.',
    duration: '30–60 min',
    mode: 'single',
    baseRate: 25,
    additionalPetRate: 10,
    rateUnit: 'visit',
    bestFor: 'Daily walks and quick exercise.',
  },
  {
    id: 'drop-in',
    label: 'Drop-In Visit',
    detail: 'Food, water, potty break, litter, play, and quick care.',
    duration: '20–45 min',
    mode: 'single',
    baseRate: 22,
    additionalPetRate: 8,
    rateUnit: 'visit',
    bestFor: 'Quick visits, feeding, and check-ins.',
  },
  {
    id: 'pet-sitting',
    label: 'Pet Sitting',
    detail: 'In-home care, companionship, routines, and check-ins.',
    duration: 'Custom',
    mode: 'multi-day',
    baseRate: 38,
    additionalPetRate: 12,
    rateUnit: 'day',
    bestFor: 'Recurring care and multi-day home visits.',
  },
  {
    id: 'doggy-day-care',
    label: 'Doggy Day Care',
    detail: 'Daytime care with play, supervision, and routine support.',
    duration: 'Daytime',
    mode: 'single',
    baseRate: 40,
    additionalPetRate: 15,
    rateUnit: 'day',
    bestFor: 'Daytime care while Pet Parents are away.',
  },
  {
    id: 'boarding',
    label: 'Boarding',
    detail: 'Overnight care with a Guru when available.',
    duration: 'Overnight',
    mode: 'overnight',
    baseRate: 58,
    additionalPetRate: 22,
    rateUnit: 'night',
    bestFor: 'Overnight stays away from home.',
  },
  {
    id: 'house-sitting',
    label: 'House Sitting',
    detail: 'Overnight or multi-day care in the Pet Parent’s home.',
    duration: 'Overnight / Multi-day',
    mode: 'overnight',
    baseRate: 72,
    additionalPetRate: 20,
    rateUnit: 'night',
    bestFor: 'Pets who do best staying home.',
  },
  {
    id: 'multi-day-care',
    label: 'Multi-Day Care',
    detail: 'Care across multiple days with a clear date range and notes.',
    duration: '2+ days',
    mode: 'multi-day',
    baseRate: 45,
    additionalPetRate: 15,
    rateUnit: 'day',
    bestFor: 'Vacations, travel, work trips, and extended care.',
  },
];

const guruDiscountRules = {
  multiPetDiscountPercent: 10,
  longStayMinUnits: 5,
  longStayDiscountPercent: 8,
};

const singleTimeOptions = [
  'Morning',
  'Midday',
  'Afternoon',
  'Evening',
  'Flexible',
];

const overnightTimeOptions = [
  'Morning handoff',
  'Afternoon handoff',
  'Evening handoff',
  'Flexible handoff',
];

const pawReportOptions = [
  'Photo updates',
  'Potty updates',
  'Food and water',
  'Care notes',
  'Visit timing',
];

function currency(value: number) {
  return `$${Math.max(0, Math.round(value)).toLocaleString('en-US')}`;
}

function padNumber(value: number) {
  return String(value).padStart(2, '0');
}

function toDateId(date: Date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(
    date.getDate(),
  )}`;
}

function dateFromId(dateId: string) {
  const [year, month, day] = dateId.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getTodayStart() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function getDateLabel(date: Date) {
  return {
    day: date.toLocaleDateString('en-US', { day: 'numeric' }),
    fullLabel: date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }),
    shortLabel: date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  };
}

function getCalendarMeta(date: Date) {
  const todayStart = getTodayStart();
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfWeek = date.getDay();
  const dayOfMonth = date.getDate();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isHolidayLike =
    dayOfMonth === 4 || dayOfMonth === 24 || dayOfMonth === 31;

  let status: AvailabilityStatus = 'available';
  let priceAdjustment = 0;
  let priceLabel = '';

  if (dateStart < todayStart) {
    return {
      status: 'unavailable' as AvailabilityStatus,
      priceAdjustment: 0,
      priceLabel: 'Past',
    };
  }

  if (isWeekend) {
    priceAdjustment += 8;
    priceLabel = 'Weekend';
  }

  if (isHolidayLike) {
    priceAdjustment += 15;
    priceLabel = 'Peak';
  }

  if (dayOfWeek === 2 && dayOfMonth % 2 === 0) {
    status = 'limited';
    priceAdjustment += 5;
    priceLabel = priceLabel || 'Limited';
  }

  if (dayOfWeek === 1 && dayOfMonth % 5 === 0) {
    status = 'unavailable';
    priceLabel = 'Busy';
  }

  return {
    status,
    priceAdjustment,
    priceLabel,
  };
}

function buildCalendarDate(date: Date): CalendarDate {
  const labels = getDateLabel(date);
  const meta = getCalendarMeta(date);

  return {
    id: toDateId(date),
    date,
    day: labels.day,
    fullLabel: labels.fullLabel,
    shortLabel: labels.shortLabel,
    status: meta.status,
    priceAdjustment: meta.priceAdjustment,
    priceLabel: meta.priceLabel,
  };
}

function buildCalendarMonth(displayMonth: Date) {
  const start = monthStart(displayMonth);
  const firstDayOffset = start.getDay();
  const calendarStart = new Date(start);
  calendarStart.setDate(start.getDate() - firstDayOffset);

  const dates: CalendarDate[] = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    dates.push(buildCalendarDate(date));
  }

  return dates;
}

function buildCalendarWeeks(calendarDates: CalendarDate[]) {
  const weeks: CalendarDate[][] = [];

  for (let index = 0; index < calendarDates.length; index += 7) {
    weeks.push(calendarDates.slice(index, index + 7));
  }

  return weeks;
}

function isSameMonth(date: Date, displayMonth: Date) {
  return (
    date.getMonth() === displayMonth.getMonth() &&
    date.getFullYear() === displayMonth.getFullYear()
  );
}

function isToday(date: Date) {
  return toDateId(date) === toDateId(getTodayStart());
}

function getDateById(calendarDates: CalendarDate[], dateId: string) {
  return (
    calendarDates.find((date) => date.id === dateId) ||
    (dateId ? buildCalendarDate(dateFromId(dateId)) : undefined)
  );
}

function getAllDatesForRange(startDateId: string, endDateId: string) {
  if (!startDateId) return [];

  const start = dateFromId(startDateId);
  const end = endDateId ? dateFromId(endDateId) : dateFromId(startDateId);
  const safeStart = start <= end ? start : end;
  const safeEnd = start <= end ? end : start;

  const dates: string[] = [];
  const current = new Date(safeStart);

  while (current <= safeEnd) {
    dates.push(toDateId(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function isDateInRange(dateId: string, startDateId: string, endDateId: string) {
  if (!startDateId) return false;
  if (!endDateId) return dateId === startDateId;

  const start = startDateId <= endDateId ? startDateId : endDateId;
  const end = startDateId <= endDateId ? endDateId : startDateId;

  return dateId >= start && dateId <= end;
}

function getUnitsForService(mode: CareMode, startDateId: string, endDateId: string) {
  if (mode === 'single') return 1;

  if (!startDateId || !endDateId || startDateId === endDateId) {
    return 1;
  }

  const startTime = dateFromId(startDateId).getTime();
  const endTime = dateFromId(endDateId).getTime();
  const dayDifference = Math.round((endTime - startTime) / (1000 * 60 * 60 * 24));
  const safeDifference = Math.max(1, Math.abs(dayDifference));

  if (mode === 'overnight') return safeDifference;

  return safeDifference + 1;
}

function getDateRangeLabel({
  calendarDates,
  startDateId,
  endDateId,
  mode,
}: {
  calendarDates: CalendarDate[];
  startDateId: string;
  endDateId: string;
  mode: CareMode;
}) {
  const startDate = getDateById(calendarDates, startDateId);
  const endDate = getDateById(calendarDates, endDateId);

  if (!startDate) return 'Choose date';

  if (mode === 'single') {
    return startDate.fullLabel;
  }

  if (!endDateId || !endDate) {
    return `${startDate.fullLabel} • choose end date`;
  }

  return `${startDate.shortLabel} → ${endDate.shortLabel}`;
}

function getRangeSelectionHint({
  mode,
  startDateId,
  endDateId,
}: {
  mode: CareMode;
  startDateId: string;
  endDateId: string;
}) {
  if (mode === 'single') return 'Tap one date.';

  if (!startDateId) return 'Tap a start date.';
  if (!endDateId) return 'Now tap an end date.';

  return 'Range selected. Tap another date to start over.';
}

function getDatePrice(date: CalendarDate, service: ServiceOption) {
  if (date.status === 'unavailable') return null;

  return service.baseRate + date.priceAdjustment;
}

function getAverageDateAdjustment(dateIds: string[]) {
  if (!dateIds.length) return 0;

  const calendarDates = dateIds.map((dateId) => buildCalendarDate(dateFromId(dateId)));

  const totalAdjustments = calendarDates.reduce(
    (sum, date) => sum + (date.status === 'unavailable' ? 0 : date.priceAdjustment),
    0,
  );

  return Math.round(totalAdjustments / calendarDates.length);
}

function getEstimate({
  service,
  startDateId,
  endDateId,
  additionalPets,
  applyPawPerks,
  applyReferralCredit,
}: {
  service: ServiceOption;
  startDateId: string;
  endDateId: string;
  additionalPets: number;
  applyPawPerks: boolean;
  applyReferralCredit: boolean;
}) {
  const units = getUnitsForService(service.mode, startDateId, endDateId);
  const rangeDateIds =
    service.mode === 'single'
      ? [startDateId]
      : getAllDatesForRange(startDateId, endDateId || startDateId);

  const averageAdjustment = getAverageDateAdjustment(rangeDateIds);
  const adjustedRate = service.baseRate + averageAdjustment;
  const baseTotal = adjustedRate * units;
  const additionalPetTotal = additionalPets > 0 ? additionalPets * service.additionalPetRate * units : 0;
  const grossTotal = baseTotal + additionalPetTotal;

  const multiPetSavings =
    additionalPets > 0
      ? Math.round(additionalPetTotal * (guruDiscountRules.multiPetDiscountPercent / 100))
      : 0;

  const longStaySavings =
    service.mode !== 'single' && units >= guruDiscountRules.longStayMinUnits
      ? Math.round(baseTotal * (guruDiscountRules.longStayDiscountPercent / 100))
      : 0;

  const pawPerksCredit = applyPawPerks ? 10 : 0;
  const referralCredit = applyReferralCredit ? 5 : 0;
  const totalSavings =
    multiPetSavings + longStaySavings + pawPerksCredit + referralCredit;

  return {
    units,
    adjustedRate,
    baseTotal,
    additionalPetTotal,
    grossTotal,
    multiPetSavings,
    longStaySavings,
    pawPerksCredit,
    referralCredit,
    totalSavings,
    estimatedSubtotal: Math.max(0, grossTotal - totalSavings),
  };
}

export default function RequestBookingScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 760;

  const [displayMonth, setDisplayMonth] = useState(monthStart(new Date()));

  const calendarDates = useMemo(
    () => buildCalendarMonth(displayMonth),
    [displayMonth],
  );

  const calendarWeeks = useMemo(
    () => buildCalendarWeeks(calendarDates),
    [calendarDates],
  );

  const firstAvailableDate =
    calendarDates.find(
      (date) =>
        isSameMonth(date.date, displayMonth) && date.status !== 'unavailable',
    ) || calendarDates[0];

  const [currentStep, setCurrentStep] = useState<RequestStep>(1);
  const [selectedPetId, setSelectedPetId] = useState('scout');
  const [selectedServiceId, setSelectedServiceId] = useState('dog-walking');
  const [startDateId, setStartDateId] = useState(firstAvailableDate.id);
  const [endDateId, setEndDateId] = useState('');
  const [selectedTime, setSelectedTime] = useState('Midday');
  const [additionalPets, setAdditionalPets] = useState(0);
  const [careNotes, setCareNotes] = useState('');
  const [accessNotes, setAccessNotes] = useState('');
  const [applyPawPerks, setApplyPawPerks] = useState(true);
  const [applyReferralCredit, setApplyReferralCredit] = useState(false);
  const [pawReportItems, setPawReportItems] = useState<string[]>([
    'Photo updates',
    'Care notes',
  ]);
  const [notice, setNotice] = useState('');

  const selectedPet = pets.find((pet) => pet.id === selectedPetId) || pets[0];
  const selectedService =
    services.find((service) => service.id === selectedServiceId) || services[0];

  const activeStep =
    requestSteps.find((step) => step.step === currentStep) || requestSteps[0];

  const progressWidth = `${Math.round(
    (currentStep / requestSteps.length) * 100,
  )}%` as `${number}%`;

  const timeOptions =
    selectedService.mode === 'single' ? singleTimeOptions : overnightTimeOptions;

  const selectedDateRangeLabel = getDateRangeLabel({
    calendarDates,
    startDateId,
    endDateId,
    mode: selectedService.mode,
  });

  const estimate = getEstimate({
    service: selectedService,
    startDateId,
    endDateId,
    additionalPets,
    applyPawPerks,
    applyReferralCredit,
  });

  const unitLabel =
    selectedService.mode === 'single'
      ? selectedService.rateUnit
      : selectedService.mode === 'overnight'
        ? estimate.units === 1
          ? 'night'
          : 'nights'
        : estimate.units === 1
          ? 'day'
          : 'days';

  const rangeSelectionHint = getRangeSelectionHint({
    mode: selectedService.mode,
    startDateId,
    endDateId,
  });

  function goBack() {
    setNotice('');

    if (currentStep === 1) {
      router.push('/find-care');
      return;
    }

    setCurrentStep((currentStep - 1) as RequestStep);
  }

  function goNext() {
    setNotice('');

    if (currentStep < 6) {
      setCurrentStep((currentStep + 1) as RequestStep);
      return;
    }

    setNotice(
      'Care request prepared. Next, this will send to the Guru for review. Payment should happen only after the Guru accepts.',
    );
  }

  function choosePet(petId: string) {
    if (petId === 'add-pet') {
      router.push('/pet-parent-setup');
      return;
    }

    setSelectedPetId(petId);
    setNotice('');
  }

  function chooseService(service: ServiceOption) {
    setSelectedServiceId(service.id);
    setNotice('');

    if (service.mode === 'single') {
      setEndDateId('');
      if (!singleTimeOptions.includes(selectedTime)) {
        setSelectedTime('Midday');
      }
      return;
    }

    if (!overnightTimeOptions.includes(selectedTime)) {
      setSelectedTime('Flexible handoff');
    }
  }

  function chooseDate(date: CalendarDate) {
    if (date.status === 'unavailable') {
      setNotice('This day is marked busy by the Guru. Choose another available day.');
      return;
    }

    setNotice('');

    if (selectedService.mode === 'single') {
      setStartDateId(date.id);
      setEndDateId('');
      return;
    }

    if (!startDateId || endDateId || date.id < startDateId) {
      setStartDateId(date.id);
      setEndDateId('');
      return;
    }

    if (date.id === startDateId) {
      setEndDateId('');
      return;
    }

    setEndDateId(date.id);
  }

  function goToPreviousMonth() {
    setDisplayMonth((currentMonth) => addMonths(currentMonth, -1));
    setEndDateId('');
  }

  function goToNextMonth() {
    setDisplayMonth((currentMonth) => addMonths(currentMonth, 1));
    setEndDateId('');
  }

  function goToCurrentMonth() {
    const currentMonth = monthStart(new Date());
    const todayId = toDateId(getTodayStart());

    setDisplayMonth(currentMonth);
    setStartDateId(todayId);
    setEndDateId('');
    setNotice('');
  }

  function togglePawReportItem(item: string) {
    if (pawReportItems.includes(item)) {
      setPawReportItems(pawReportItems.filter((currentItem) => currentItem !== item));
      return;
    }

    setPawReportItems([...pawReportItems, item]);
  }

  function openProfilePreview() {
    setNotice(
      'Guru profile preview will open here after Guru profile pages are connected.',
    );
  }

  function openMessages() {
    router.push('/conversation');
  }

  function renderPriceCard() {
    return (
      <View style={styles.priceCard}>
        <View style={styles.priceHeader}>
          <View>
            <Text style={styles.priceEyebrow}>Estimated price</Text>
            <Text style={styles.priceTotal}>{currency(estimate.estimatedSubtotal)}</Text>
          </View>

          <Text style={styles.priceBadge}>Guru can update</Text>
        </View>

        <View style={styles.priceRows}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{selectedService.label} rate</Text>
            <Text style={styles.priceValue}>
              {currency(estimate.adjustedRate)} / {selectedService.rateUnit}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Duration</Text>
            <Text style={styles.priceValue}>
              {estimate.units} {unitLabel}
            </Text>
          </View>

          {estimate.additionalPetTotal > 0 ? (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Additional pet fee</Text>
              <Text style={styles.priceValue}>
                {currency(estimate.additionalPetTotal)}
              </Text>
            </View>
          ) : null}

          {estimate.multiPetSavings > 0 ? (
            <View style={styles.savingsRow}>
              <Text style={styles.savingsLabel}>Multi-pet savings</Text>
              <Text style={styles.savingsValue}>
                -{currency(estimate.multiPetSavings)}
              </Text>
            </View>
          ) : null}

          {estimate.longStaySavings > 0 ? (
            <View style={styles.savingsRow}>
              <Text style={styles.savingsLabel}>Long-stay savings</Text>
              <Text style={styles.savingsValue}>
                -{currency(estimate.longStaySavings)}
              </Text>
            </View>
          ) : null}

          {estimate.pawPerksCredit > 0 ? (
            <View style={styles.savingsRow}>
              <Text style={styles.savingsLabel}>PawPerks credit</Text>
              <Text style={styles.savingsValue}>
                -{currency(estimate.pawPerksCredit)}
              </Text>
            </View>
          ) : null}

          {estimate.referralCredit > 0 ? (
            <View style={styles.savingsRow}>
              <Text style={styles.savingsLabel}>Referral credit</Text>
              <Text style={styles.savingsValue}>
                -{currency(estimate.referralCredit)}
              </Text>
            </View>
          ) : null}

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Payment timing</Text>
            <Text style={styles.priceValue}>After Guru accepts</Text>
          </View>
        </View>

        <Text style={styles.priceDisclaimer}>
          This is an estimate. Gurus can update availability, service rates, date
          pricing, discounts, and final pricing before accepting.
        </Text>
      </View>
    );
  }

  function renderStepContent() {
    if (currentStep === 1) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.petGrid}>
            {pets.map((pet) => {
              const selected = selectedPetId === pet.id;

              return (
                <Pressable
                  key={pet.id}
                  accessibilityRole="button"
                  onPress={() => choosePet(pet.id)}
                  style={[styles.petCard, selected && styles.petCardActive]}
                >
                  <View
                    style={[
                      styles.petAvatar,
                      selected && styles.petAvatarActive,
                    ]}
                  >
                    <Text style={styles.petAvatarText}>{pet.emoji}</Text>
                  </View>

                  <View style={styles.petCardCopy}>
                    <Text
                      style={[
                        styles.petName,
                        selected && styles.petNameActive,
                      ]}
                    >
                      {pet.name}
                    </Text>
                    <Text
                      style={[
                        styles.petDetails,
                        selected && styles.petDetailsActive,
                      ]}
                    >
                      {pet.details}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.petSelectText,
                      selected && styles.petSelectTextActive,
                    ]}
                  >
                    {selected ? 'Selected' : 'Choose'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.additionalPetsPanel}>
            <Text style={styles.choiceSectionTitle}>Additional pets</Text>

            <View style={styles.counterRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setAdditionalPets(Math.max(0, additionalPets - 1))}
                style={styles.counterButton}
              >
                <Text style={styles.counterButtonText}>-</Text>
              </Pressable>

              <View style={styles.counterValue}>
                <Text style={styles.counterValueText}>{additionalPets}</Text>
                <Text style={styles.counterValueLabel}>extra pets</Text>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => setAdditionalPets(additionalPets + 1)}
                style={styles.counterButton}
              >
                <Text style={styles.counterButtonText}>+</Text>
              </Pressable>
            </View>

            <Text style={styles.counterHelper}>
              Guru multi-pet savings can apply when extra pets are included.
            </Text>
          </View>

          <View style={styles.discountPanel}>
            <Text style={styles.choiceSectionTitle}>Pet Parent savings</Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => setApplyPawPerks(!applyPawPerks)}
              style={[
                styles.discountToggle,
                applyPawPerks && styles.discountToggleActive,
              ]}
            >
              <Text
                style={[
                  styles.discountToggleText,
                  applyPawPerks && styles.discountToggleTextActive,
                ]}
              >
                {applyPawPerks ? '✓ ' : ''}
                Apply PawPerks credit
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => setApplyReferralCredit(!applyReferralCredit)}
              style={[
                styles.discountToggle,
                applyReferralCredit && styles.discountToggleActive,
              ]}
            >
              <Text
                style={[
                  styles.discountToggleText,
                  applyReferralCredit && styles.discountToggleTextActive,
                ]}
              >
                {applyReferralCredit ? '✓ ' : ''}
                Apply referral credit
              </Text>
            </Pressable>
          </View>

          {renderPriceCard()}
        </View>
      );
    }

    if (currentStep === 2) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.serviceGrid}>
            {services.map((service) => {
              const selected = selectedServiceId === service.id;

              return (
                <Pressable
                  key={service.id}
                  accessibilityRole="button"
                  onPress={() => chooseService(service)}
                  style={[
                    styles.serviceCard,
                    selected && styles.serviceCardActive,
                  ]}
                >
                  <View style={styles.serviceTopRow}>
                    <Text
                      style={[
                        styles.serviceTitle,
                        selected && styles.serviceTitleActive,
                      ]}
                    >
                      {service.label}
                    </Text>

                    <Text
                      style={[
                        styles.serviceDuration,
                        selected && styles.serviceDurationActive,
                      ]}
                    >
                      {currency(service.baseRate)} / {service.rateUnit}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.serviceDetail,
                      selected && styles.serviceDetailActive,
                    ]}
                  >
                    {service.detail}
                  </Text>

                  <Text
                    style={[
                      styles.serviceBestFor,
                      selected && styles.serviceBestForActive,
                    ]}
                  >
                    Additional pet: +{currency(service.additionalPetRate)} / {service.rateUnit}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Rates can change by day</Text>
            <Text style={styles.infoCardText}>
              Gurus can update service rates, weekend pricing, holiday pricing,
              multi-pet discounts, long-stay savings, and availability by day.
            </Text>
          </View>
        </View>
      );
    }

    if (currentStep === 3) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.calendarSummaryPanel}>
            <View>
              <Text style={styles.calendarEyebrow}>Selected schedule</Text>
              <Text style={styles.calendarTitle}>{selectedDateRangeLabel}</Text>
              <Text style={styles.calendarText}>
                {selectedService.label} • {estimate.units} {unitLabel} • {selectedTime}
              </Text>
            </View>

            <View style={styles.calendarBadge}>
              <Text style={styles.calendarBadgeText}>
                {selectedService.mode === 'single'
                  ? 'Single visit'
                  : selectedService.mode === 'overnight'
                    ? 'Overnight'
                    : 'Multi-day'}
              </Text>
            </View>
          </View>

          <View style={styles.stickyEstimateCard}>
            <View>
              <Text style={styles.stickyEstimateLabel}>Estimate</Text>
              <Text style={styles.stickyEstimateValue}>
                {currency(estimate.estimatedSubtotal)}
              </Text>
            </View>

            <View style={styles.stickyEstimateCopy}>
              <Text style={styles.stickyEstimateTitle}>
                Savings included
              </Text>
              <Text style={styles.stickyEstimateText}>
                Multi-pet, long-stay, PawPerks, and referral credits can apply.
              </Text>
            </View>
          </View>

          <View style={styles.calendarPanel}>
            <View style={styles.calendarHeader}>
              <View style={styles.calendarHeaderCopy}>
                <Text style={styles.calendarHeaderTitle}>
                  {displayMonth.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
                <Text style={styles.calendarHeaderText}>
                  {rangeSelectionHint} Prices show under each day.
                </Text>
              </View>

              <View style={styles.monthControls}>
                <Pressable
                  accessibilityRole="button"
                  onPress={goToPreviousMonth}
                  style={styles.monthButton}
                >
                  <Text style={styles.monthButtonText}>‹</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={goToCurrentMonth}
                  style={styles.todayButton}
                >
                  <Text style={styles.todayButtonText}>Today</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={goToNextMonth}
                  style={styles.monthButton}
                >
                  <Text style={styles.monthButtonText}>›</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.rangeGuidePanel}>
              <View style={styles.rangeGuideStep}>
                <Text style={styles.rangeGuideLabel}>Start</Text>
                <Text style={styles.rangeGuideValue}>
                  {getDateById(calendarDates, startDateId)?.shortLabel || 'Choose'}
                </Text>
              </View>

              <View style={styles.rangeGuideDivider} />

              <View style={styles.rangeGuideStep}>
                <Text style={styles.rangeGuideLabel}>
                  {selectedService.mode === 'single' ? 'Visit' : 'End'}
                </Text>
                <Text style={styles.rangeGuideValue}>
                  {selectedService.mode === 'single'
                    ? 'Single day'
                    : getDateById(calendarDates, endDateId)?.shortLabel || 'Choose'}
                </Text>
              </View>
            </View>

            <View style={styles.calendarLegend}>
              <Text style={styles.legendText}>• Price is estimated</Text>
              <Text style={styles.legendText}>• Busy days are unavailable</Text>
              <Text style={styles.legendText}>• Peak rates may apply</Text>
            </View>

            <View style={styles.weekdayHeader}>
              {weekdayLabels.map((weekday) => (
                <Text key={weekday} style={styles.weekdayHeaderText}>
                  {weekday}
                </Text>
              ))}
            </View>

            <View style={styles.calendarWeeks}>
              {calendarWeeks.map((week, weekIndex) => (
                <View key={`week-${weekIndex}`} style={styles.calendarWeekRow}>
                  {week.map((date) => {
                    const selected =
                      selectedService.mode === 'single'
                        ? date.id === startDateId
                        : isDateInRange(date.id, startDateId, endDateId);

                    const isStart = date.id === startDateId;
                    const isEnd = date.id === endDateId && Boolean(endDateId);
                    const inCurrentMonth = isSameMonth(date.date, displayMonth);
                    const today = isToday(date.date);
                    const dayPrice = getDatePrice(date, selectedService);
                    const unavailable = date.status === 'unavailable';

                    return (
                      <Pressable
                        key={date.id}
                        accessibilityRole="button"
                        onPress={() => chooseDate(date)}
                        style={[
                          styles.dateCell,
                          !inCurrentMonth && styles.dateCellOutsideMonth,
                          today && styles.dateCellToday,
                          selected && styles.dateCellSelected,
                          (isStart || isEnd) && styles.dateCellEndpoint,
                          unavailable && styles.dateCellUnavailable,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dateDay,
                            selected && styles.dateTextSelected,
                            unavailable && styles.dateTextUnavailable,
                          ]}
                        >
                          {date.day}
                        </Text>

                        <Text
                          style={[
                            styles.datePrice,
                            selected && styles.dateTextSelected,
                            unavailable && styles.dateTextUnavailable,
                          ]}
                        >
                          {unavailable ? 'Busy' : dayPrice ? currency(dayPrice) : '—'}
                        </Text>

                        {isStart && selectedService.mode !== 'single' ? (
                          <Text style={styles.dateRangeLabelSelected}>Start</Text>
                        ) : isEnd ? (
                          <Text style={styles.dateRangeLabelSelected}>End</Text>
                        ) : today ? (
                          <Text
                            style={[
                              styles.dateTodayLabel,
                              selected && styles.dateTextSelected,
                            ]}
                          >
                            Today
                          </Text>
                        ) : date.priceLabel && !unavailable ? (
                          <Text
                            style={[
                              styles.dateTag,
                              selected && styles.dateTextSelected,
                            ]}
                          >
                            {date.priceLabel}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.choiceSection}>
            <Text style={styles.choiceSectionTitle}>Preferred time</Text>

            <View style={styles.choiceGrid}>
              {timeOptions.map((time) => {
                const selected = selectedTime === time;

                return (
                  <Pressable
                    key={time}
                    accessibilityRole="button"
                    onPress={() => {
                      setSelectedTime(time);
                      setNotice('');
                    }}
                    style={[
                      styles.choicePill,
                      selected && styles.choicePillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.choicePillText,
                        selected && styles.choicePillTextActive,
                      ]}
                    >
                      {time}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {renderPriceCard()}
        </View>
      );
    }

    if (currentStep === 4) {
      return (
        <View style={styles.stepBody}>
          <Field
            label="Care notes"
            multiline
            onChangeText={setCareNotes}
            placeholder="Food, water, potty, leash, medication, anxiety, routine, or special instructions."
            value={careNotes}
          />

          <Field
            label="Access notes"
            multiline
            onChangeText={setAccessNotes}
            placeholder="Parking, gate code, apartment entry, key location, or arrival instructions."
            value={accessNotes}
          />

          <View style={styles.choiceSection}>
            <Text style={styles.choiceSectionTitle}>PawReport™ updates requested</Text>

            <View style={styles.choiceGrid}>
              {pawReportOptions.map((item) => {
                const selected = pawReportItems.includes(item);

                return (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    onPress={() => togglePawReportItem(item)}
                    style={[
                      styles.choicePill,
                      selected && styles.choicePillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.choicePillText,
                        selected && styles.choicePillTextActive,
                      ]}
                    >
                      {selected ? '✓ ' : ''}
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Keep details inside SitGuru</Text>
            <Text style={styles.infoCardText}>
              Clear notes help the Guru prepare and keep care details connected
              to the request, messages, and future PawReport™ updates.
            </Text>
          </View>
        </View>
      );
    }

    if (currentStep === 5) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.reviewPanel}>
            <Text style={styles.reviewEyebrow}>Review request</Text>

            <ReviewRow label="Guru" value="Local Guru" />
            <ReviewRow label="Pet" value={`${selectedPet.name} • ${selectedPet.type}`} />
            <ReviewRow label="Service" value={selectedService.label} />
            <ReviewRow label="Schedule" value={selectedDateRangeLabel} />
            <ReviewRow label="Duration" value={`${estimate.units} ${unitLabel}`} />
            <ReviewRow label="Time" value={selectedTime} />
            <ReviewRow
              label="Estimated price"
              value={`${currency(estimate.estimatedSubtotal)} • final after Guru accepts`}
            />
            <ReviewRow
              label="Savings"
              value={
                estimate.totalSavings > 0
                  ? `${currency(estimate.totalSavings)} estimated savings`
                  : 'No savings applied'
              }
            />
            <ReviewRow
              label="PawReport™"
              value={pawReportItems.length ? pawReportItems.join(', ') : 'Can be added later'}
            />
            <ReviewRow
              label="Care notes"
              value={careNotes.trim() || 'Can be added before sending'}
            />
            <ReviewRow
              label="Access notes"
              value={accessNotes.trim() || 'Can be added before sending'}
            />
          </View>

          {renderPriceCard()}
        </View>
      );
    }

    return (
      <View style={styles.stepBody}>
        <View style={styles.successPanel}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Ready to send to the Guru.</Text>
          <Text style={styles.successText}>
            Your request includes the pet, service, dates, timing, notes, savings,
            and estimated price. Payment should happen later after the Guru accepts.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={goNext}
            style={styles.submitButton}
          >
            <Text style={styles.submitButtonText}>Submit Request</Text>
          </Pressable>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>What happens next?</Text>
          <Text style={styles.infoCardText}>
            The Guru reviews the request, messages if needed, accepts if available,
            and then the booking can move into payment and visit preparation.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SitGuruScreen scroll center={false} maxWidth={920}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <SitGuruLogo size="small" variant="symbol" />

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/find-care')}
            style={styles.topLinkButton}
          >
            <Text style={styles.topLinkText}>Find Care</Text>
          </Pressable>
        </View>

        <View style={[styles.heroPanel, isWide && styles.heroPanelWide]}>
          <View style={styles.heroCopy}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Request Booking</Text>
            </View>

            <Text style={styles.title}>Request care from a Guru.</Text>

            <Text style={styles.subtitle}>
              Choose your pet, service, dates, savings, and notes. Prices are
              estimated until the Guru accepts.
            </Text>

            <View style={styles.heroActions}>
              <Pressable
                accessibilityRole="button"
                onPress={openProfilePreview}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>View Guru</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={openMessages}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Message First</Text>
              </Pressable>
            </View>

            <View style={styles.progressBlock}>
              <View style={styles.progressTopRow}>
                <Text style={styles.progressLabel}>
                  Step {currentStep} of {requestSteps.length}
                </Text>
                <Text style={styles.progressPercent}>
                  {Math.round((currentStep / requestSteps.length) * 100)}%
                </Text>
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: progressWidth }]} />
              </View>
            </View>
          </View>

          <View style={styles.heroPhotoCard}>
            <View style={styles.heroPhotoPlaceholder}>
              <Text style={styles.heroPhotoIcon}>📅</Text>
              <Text style={styles.heroPhotoTitle}>Booking calendar area</Text>
              <Text style={styles.heroPhotoText}>
                Thumb-friendly calendar rows help Pet Parents compare dates,
                prices, and savings quickly.
              </Text>
            </View>

            <View style={styles.heroFloatingCard}>
              <Text style={styles.heroFloatingTitle}>Price by day</Text>
              <Text style={styles.heroFloatingText}>
                Gurus can update rates, discounts, and availability.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.stepsRail}>
          {requestSteps.map((step) => {
            const active = step.step === currentStep;
            const complete = step.step < currentStep;

            return (
              <Pressable
                key={step.step}
                accessibilityRole="button"
                onPress={() => {
                  setCurrentStep(step.step);
                  setNotice('');
                }}
                style={[
                  styles.stepPill,
                  active && styles.stepPillActive,
                  complete && styles.stepPillComplete,
                ]}
              >
                <Text
                  style={[
                    styles.stepPillNumber,
                    active && styles.stepPillNumberActive,
                  ]}
                >
                  {complete ? '✓' : step.step}
                </Text>
                <Text
                  style={[
                    styles.stepPillText,
                    active && styles.stepPillTextActive,
                  ]}
                >
                  {step.shortTitle}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.activeStepPanel}>
          <View style={styles.stepHeader}>
            <View>
              <Text style={styles.stepEyebrow}>Step {activeStep.step}</Text>
              <Text style={styles.stepTitle}>{activeStep.title}</Text>
            </View>

            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>
                {currentStep >= 5 ? 'Review' : 'Required'}
              </Text>
            </View>
          </View>

          <Text style={styles.stepDescription}>{activeStep.description}</Text>

          {renderStepContent()}
        </View>

        {notice ? (
          <View style={styles.noticePanel}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        <View style={styles.bottomDockSpacer} />
      </View>

      <View style={styles.bottomDock}>
        <Pressable
          accessibilityRole="button"
          onPress={goBack}
          style={styles.dockSecondaryAction}
        >
          <Text style={styles.dockSecondaryText}>
            {currentStep === 1 ? 'Search' : 'Back'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={goNext}
          style={styles.dockPrimaryAction}
        >
          <Text style={styles.dockPrimaryText}>
            {currentStep === 6 ? 'Submit' : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </SitGuruScreen>
  );
}

function Field({
  label,
  placeholder,
  keyboardType,
  multiline = false,
  value,
  onChangeText,
}: {
  label: string;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'phone-pad';
  multiline?: boolean;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={SitGuruColors.textSoft}
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
      />
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
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
  progressBlock: {
    gap: 8,
  },
  progressTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: SitGuruColors.primary,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  progressPercent: {
    color: SitGuruColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  progressTrack: {
    backgroundColor: SitGuruColors.background,
    borderRadius: 999,
    height: 10,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    height: '100%',
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
    gap: 8,
    justifyContent: 'center',
    padding: 22,
  },
  heroPhotoIcon: {
    fontSize: 44,
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
  stepsRail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stepPill: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  stepPillActive: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  stepPillComplete: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
  },
  stepPillNumber: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  stepPillNumberActive: {
    color: '#FFFFFF',
  },
  stepPillText: {
    color: SitGuruColors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  stepPillTextActive: {
    color: '#FFFFFF',
  },
  activeStepPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 30,
    borderWidth: 1,
    elevation: 3,
    gap: 14,
    padding: 18,
  },
  stepHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  stepEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  stepTitle: {
    color: SitGuruColors.text,
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -0.7,
    lineHeight: 34,
    marginTop: 2,
  },
  stepBadge: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stepBadgeText: {
    color: SitGuruColors.primary,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  stepDescription: {
    color: SitGuruColors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  stepBody: {
    gap: 12,
  },
  petGrid: {
    gap: 10,
  },
  petCard: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  petCardActive: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
  },
  petAvatar: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  petAvatarActive: {
    borderColor: SitGuruColors.primary,
  },
  petAvatarText: {
    fontSize: 26,
  },
  petCardCopy: {
    flex: 1,
    gap: 3,
  },
  petName: {
    color: SitGuruColors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  petNameActive: {
    color: SitGuruColors.primary,
  },
  petDetails: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  petDetailsActive: {
    color: SitGuruColors.text,
  },
  petSelectText: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  petSelectTextActive: {
    color: SitGuruColors.primary,
  },
  additionalPetsPanel: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  counterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  counterButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  counterButtonText: {
    color: SitGuruColors.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  counterValue: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  counterValueText: {
    color: SitGuruColors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  counterValueLabel: {
    color: SitGuruColors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  counterHelper: {
    color: SitGuruColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
  discountPanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  discountToggle: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  discountToggleActive: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  discountToggleText: {
    color: SitGuruColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  discountToggleTextActive: {
    color: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 24,
    gap: 6,
    padding: 16,
  },
  infoCardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  infoCardText: {
    color: '#DCEFE2',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  serviceGrid: {
    gap: 10,
  },
  serviceCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  serviceCardActive: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  serviceTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  serviceTitle: {
    color: SitGuruColors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
  },
  serviceTitleActive: {
    color: '#FFFFFF',
  },
  serviceDuration: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  serviceDurationActive: {
    color: '#DCEFE2',
  },
  serviceDetail: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  serviceDetailActive: {
    color: '#DCEFE2',
  },
  serviceBestFor: {
    color: SitGuruColors.text,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 18,
  },
  serviceBestForActive: {
    color: '#FFFFFF',
  },
  stickyEstimateCard: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 3,
    flexDirection: 'row',
    gap: 14,
    padding: 14,
  },
  stickyEstimateLabel: {
    color: SitGuruColors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  stickyEstimateValue: {
    color: SitGuruColors.text,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  stickyEstimateCopy: {
    flex: 1,
    gap: 3,
  },
  stickyEstimateTitle: {
    color: SitGuruColors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  stickyEstimateText: {
    color: SitGuruColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  priceCard: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 2,
    gap: 12,
    padding: 16,
  },
  priceHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  priceEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  priceTotal: {
    color: SitGuruColors.text,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 39,
  },
  priceBadge: {
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
  priceRows: {
    gap: 8,
  },
  priceRow: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    padding: 11,
  },
  priceLabel: {
    color: SitGuruColors.textMuted,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
  },
  priceValue: {
    color: SitGuruColors.text,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'right',
  },
  savingsRow: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    padding: 11,
  },
  savingsLabel: {
    color: SitGuruColors.primary,
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
  },
  savingsValue: {
    color: SitGuruColors.primary,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'right',
  },
  priceDisclaimer: {
    color: SitGuruColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  calendarSummaryPanel: {
    alignItems: 'flex-start',
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 24,
    gap: 12,
    justifyContent: 'space-between',
    padding: 16,
  },
  calendarEyebrow: {
    color: '#C9F26D',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  calendarTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 27,
    marginTop: 3,
  },
  calendarText: {
    color: '#DCEFE2',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
    marginTop: 4,
  },
  calendarBadge: {
    backgroundColor: '#C9F26D',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  calendarBadgeText: {
    color: SitGuruColors.text,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  calendarPanel: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  calendarHeader: {
    alignItems: 'flex-start',
    gap: 12,
  },
  calendarHeaderCopy: {
    gap: 3,
  },
  calendarHeaderTitle: {
    color: SitGuruColors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 27,
  },
  calendarHeaderText: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  monthControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  monthButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  monthButtonText: {
    color: SitGuruColors.primary,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
  },
  todayButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  todayButtonText: {
    color: SitGuruColors.primary,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  rangeGuidePanel: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 12,
  },
  rangeGuideStep: {
    flex: 1,
    gap: 2,
  },
  rangeGuideLabel: {
    color: SitGuruColors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  rangeGuideValue: {
    color: SitGuruColors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  rangeGuideDivider: {
    backgroundColor: SitGuruColors.border,
    height: 34,
    marginHorizontal: 10,
    width: 1,
  },
  calendarLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendText: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    color: SitGuruColors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  weekdayHeader: {
    flexDirection: 'row',
    gap: 6,
  },
  weekdayHeaderText: {
    color: SitGuruColors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  calendarWeeks: {
    gap: 6,
  },
  calendarWeekRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dateCell: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minHeight: 92,
    paddingHorizontal: 3,
    paddingVertical: 8,
  },
  dateCellOutsideMonth: {
    opacity: 0.42,
  },
  dateCellToday: {
    borderColor: SitGuruColors.primary,
    borderWidth: 2,
  },
  dateCellSelected: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
  },
  dateCellEndpoint: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  dateCellUnavailable: {
    backgroundColor: '#F4F0EC',
    borderColor: '#E2D7CC',
    opacity: 0.62,
  },
  dateDay: {
    color: SitGuruColors.text,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 24,
  },
  datePrice: {
    color: SitGuruColors.primary,
    fontSize: 11,
    fontWeight: '900',
    marginTop: 2,
  },
  dateTag: {
    color: SitGuruColors.textSoft,
    fontSize: 8,
    fontWeight: '900',
    marginTop: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  dateTodayLabel: {
    color: SitGuruColors.primary,
    fontSize: 8,
    fontWeight: '900',
    marginTop: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  dateRangeLabelSelected: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    marginTop: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  dateTextSelected: {
    color: '#FFFFFF',
  },
  dateTextUnavailable: {
    color: SitGuruColors.textSoft,
  },
  choiceSection: {
    gap: 9,
  },
  choiceSectionTitle: {
    color: SitGuruColors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choicePill: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  choicePillActive: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  choicePillText: {
    color: SitGuruColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  choicePillTextActive: {
    color: '#FFFFFF',
  },
  fieldWrap: {
    gap: 7,
  },
  fieldLabel: {
    color: SitGuruColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  input: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 18,
    borderWidth: 1,
    color: SitGuruColors.text,
    fontSize: 15,
    fontWeight: '800',
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multilineInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  reviewPanel: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  reviewEyebrow: {
    backgroundColor: SitGuruColors.primaryDark,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    padding: 14,
    textTransform: 'uppercase',
  },
  reviewRow: {
    borderBottomColor: SitGuruColors.border,
    borderBottomWidth: 1,
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  reviewLabel: {
    color: SitGuruColors.primary,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  reviewValue: {
    color: SitGuruColors.text,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  successPanel: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 28,
    gap: 9,
    padding: 18,
  },
  successIcon: {
    color: '#C9F26D',
    fontSize: 38,
    fontWeight: '900',
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 29,
    textAlign: 'center',
  },
  successText: {
    color: '#DCEFE2',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
    textAlign: 'center',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    justifyContent: 'center',
    marginTop: 4,
    minHeight: 52,
    paddingHorizontal: 18,
    width: '100%',
  },
  submitButtonText: {
    color: SitGuruColors.text,
    fontSize: 15,
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
  dockSecondaryAction: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
    minWidth: 92,
    paddingHorizontal: 14,
  },
  dockSecondaryText: {
    color: SitGuruColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
});