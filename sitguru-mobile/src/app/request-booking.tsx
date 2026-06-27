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

type BookingStep = 1 | 2 | 3 | 4 | 5 | 6;
type CareMode = 'single' | 'overnight' | 'multi-day';
type DateStatus = 'available' | 'limited' | 'busy';

type PetOption = {
  id: string;
  name: string;
  type: 'Dog' | 'Cat' | 'Other';
  emoji: string;
  description: string;
};

type ServiceOption = {
  id: string;
  title: string;
  mode: CareMode;
  baseRate: number;
  additionalPetRate: number;
  rateUnit: string;
  description: string;
};

type CalendarDay = {
  id: string;
  date: Date;
  day: string;
  status: DateStatus;
  priceAdjustment: number;
  label?: string;
};

const bookingSteps: {
  step: BookingStep;
  shortTitle: string;
  title: string;
  description: string;
}[] = [
  {
    step: 1,
    shortTitle: 'Pet',
    title: 'Choose your pet',
    description:
      'Select the Pet Passport for this care request so the Guru can review the right care details.',
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
    title: 'Choose dates',
    description:
      'Select a date or date range. Estimated prices appear under each available day.',
  },
  {
    step: 4,
    shortTitle: 'Details',
    title: 'Add care details',
    description:
      'Share care notes, access instructions, and PawReport preferences so the Guru can prepare.',
  },
  {
    step: 5,
    shortTitle: 'Review',
    title: 'Review request',
    description:
      'Review your pet, service, dates, care notes, savings, and estimated price before sending.',
  },
  {
    step: 6,
    shortTitle: 'Send',
    title: 'Send request',
    description:
      'Send this request to the Guru. Payment happens later after the Guru accepts.',
  },
];

const pets: PetOption[] = [
  {
    id: 'scout',
    name: 'Scout',
    type: 'Dog',
    emoji: '🐶',
    description: 'Friendly dog • 30-minute walk',
  },
  {
    id: 'luna',
    name: 'Luna',
    type: 'Cat',
    emoji: '🐱',
    description: 'Indoor cat • Feeding and litter notes',
  },
  {
    id: 'add-pet',
    name: 'Add another pet',
    type: 'Other',
    emoji: '+',
    description: 'Create or update a Pet Passport',
  },
];

const services: ServiceOption[] = [
  {
    id: 'dog-walking',
    title: 'Dog Walking',
    mode: 'single',
    baseRate: 25,
    additionalPetRate: 10,
    rateUnit: 'visit',
    description: 'Walks, potty breaks, exercise, and outdoor time.',
  },
  {
    id: 'drop-in',
    title: 'Drop-In Visit',
    mode: 'single',
    baseRate: 22,
    additionalPetRate: 8,
    rateUnit: 'visit',
    description: 'Food, water, potty break, litter, play, and quick care.',
  },
  {
    id: 'doggy-day-care',
    title: 'Doggy Day Care',
    mode: 'single',
    baseRate: 40,
    additionalPetRate: 15,
    rateUnit: 'day',
    description: 'Daytime care with play, supervision, and routine support.',
  },
  {
    id: 'boarding',
    title: 'Boarding',
    mode: 'overnight',
    baseRate: 58,
    additionalPetRate: 22,
    rateUnit: 'night',
    description: 'Overnight care with a Guru when available.',
  },
  {
    id: 'house-sitting',
    title: 'House Sitting',
    mode: 'overnight',
    baseRate: 72,
    additionalPetRate: 20,
    rateUnit: 'night',
    description: 'Overnight or multi-day care in the Pet Parent home.',
  },
  {
    id: 'multi-day-care',
    title: 'Multi-Day Care',
    mode: 'multi-day',
    baseRate: 45,
    additionalPetRate: 15,
    rateUnit: 'day',
    description: 'Care across multiple days with clear date range and notes.',
  },
];

const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const singleTimeOptions = ['Morning', 'Midday', 'Afternoon', 'Evening', 'Flexible'];
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

function todayStart() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function sameMonth(date: Date, month: Date) {
  return (
    date.getFullYear() === month.getFullYear() &&
    date.getMonth() === month.getMonth()
  );
}

function isToday(date: Date) {
  return toDateId(date) === toDateId(todayStart());
}

function buildCalendarDay(date: Date): CalendarDay {
  const dayOfWeek = date.getDay();
  const dayOfMonth = date.getDate();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isPeak = dayOfMonth === 4 || dayOfMonth === 24 || dayOfMonth === 31;

  let status: DateStatus = 'available';
  let priceAdjustment = 0;
  let label = '';

  if (date < todayStart()) {
    return {
      id: toDateId(date),
      date,
      day: String(dayOfMonth),
      status: 'busy',
      priceAdjustment: 0,
      label: 'Past',
    };
  }

  if (isWeekend) {
    priceAdjustment += 8;
    label = 'Weekend';
  }

  if (isPeak) {
    priceAdjustment += 15;
    label = 'Peak';
  }

  if (dayOfWeek === 2 && dayOfMonth % 2 === 0) {
    status = 'limited';
    priceAdjustment += 5;
    label = label || 'Limited';
  }

  if (dayOfWeek === 1 && dayOfMonth % 5 === 0) {
    status = 'busy';
    label = 'Busy';
  }

  return {
    id: toDateId(date),
    date,
    day: String(dayOfMonth),
    status,
    priceAdjustment,
    label,
  };
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
    days.push(buildCalendarDay(date));
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

function dateLabel(dateId: string) {
  if (!dateId) return 'Choose date';

  return dateFromId(dateId).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function rangeLabel(startDateId: string, endDateId: string, mode: CareMode) {
  if (!startDateId) return 'Choose date';

  if (mode === 'single') return dateLabel(startDateId);

  if (!endDateId) return `${dateLabel(startDateId)} • choose end date`;

  return `${dateLabel(startDateId)} → ${dateLabel(endDateId)}`;
}

function isDateInRange(dateId: string, startDateId: string, endDateId: string) {
  if (!startDateId) return false;
  if (!endDateId) return dateId === startDateId;

  const start = startDateId <= endDateId ? startDateId : endDateId;
  const end = startDateId <= endDateId ? endDateId : startDateId;

  return dateId >= start && dateId <= end;
}

function getRangeDateIds(startDateId: string, endDateId: string) {
  if (!startDateId) return [];

  const start = dateFromId(startDateId);
  const end = endDateId ? dateFromId(endDateId) : dateFromId(startDateId);
  const safeStart = start <= end ? start : end;
  const safeEnd = start <= end ? end : start;
  const current = new Date(safeStart);
  const ids: string[] = [];

  while (current <= safeEnd) {
    ids.push(toDateId(current));
    current.setDate(current.getDate() + 1);
  }

  return ids;
}

function getUnits(mode: CareMode, startDateId: string, endDateId: string) {
  if (mode === 'single') return 1;

  if (!startDateId || !endDateId || startDateId === endDateId) return 1;

  const start = dateFromId(startDateId).getTime();
  const end = dateFromId(endDateId).getTime();
  const days = Math.max(1, Math.abs(Math.round((end - start) / 86400000)));

  return mode === 'overnight' ? days : days + 1;
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
  const units = getUnits(service.mode, startDateId, endDateId);
  const ids =
    service.mode === 'single'
      ? [startDateId]
      : getRangeDateIds(startDateId, endDateId || startDateId);

  const averageAdjustment =
    ids.length > 0
      ? Math.round(
          ids.reduce((total, id) => {
            const day = buildCalendarDay(dateFromId(id));
            return total + (day.status === 'busy' ? 0 : day.priceAdjustment);
          }, 0) / ids.length,
        )
      : 0;

  const adjustedRate = service.baseRate + averageAdjustment;
  const baseTotal = adjustedRate * units;
  const additionalPetTotal = additionalPets * service.additionalPetRate * units;
  const multiPetSavings =
    additionalPets > 0 ? Math.round(additionalPetTotal * 0.1) : 0;
  const longStaySavings =
    service.mode !== 'single' && units >= 5 ? Math.round(baseTotal * 0.08) : 0;
  const pawPerksCredit = applyPawPerks ? 10 : 0;
  const referralCredit = applyReferralCredit ? 5 : 0;

  const totalSavings =
    multiPetSavings + longStaySavings + pawPerksCredit + referralCredit;

  return {
    units,
    adjustedRate,
    baseTotal,
    additionalPetTotal,
    multiPetSavings,
    longStaySavings,
    pawPerksCredit,
    referralCredit,
    totalSavings,
    total: Math.max(0, baseTotal + additionalPetTotal - totalSavings),
  };
}

export default function RequestBookingScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 760;

  const [currentStep, setCurrentStep] = useState<BookingStep>(1);
  const [displayMonth, setDisplayMonth] = useState(monthStart(new Date()));
  const calendarDays = useMemo(() => buildCalendarMonth(displayMonth), [displayMonth]);
  const calendarWeeks = useMemo(() => buildCalendarWeeks(calendarDays), [calendarDays]);

  const firstAvailable =
    calendarDays.find((day) => sameMonth(day.date, displayMonth) && day.status !== 'busy') ||
    calendarDays[0];

  const [selectedPetId, setSelectedPetId] = useState('scout');
  const [selectedServiceId, setSelectedServiceId] = useState('dog-walking');
  const [startDateId, setStartDateId] = useState(firstAvailable.id);
  const [endDateId, setEndDateId] = useState('');
  const [selectedTime, setSelectedTime] = useState('Midday');
  const [additionalPets, setAdditionalPets] = useState(0);
  const [applyPawPerks, setApplyPawPerks] = useState(true);
  const [applyReferralCredit, setApplyReferralCredit] = useState(false);
  const [careNotes, setCareNotes] = useState('');
  const [accessNotes, setAccessNotes] = useState('');
  const [pawReportItems, setPawReportItems] = useState<string[]>([
    'Photo updates',
    'Care notes',
  ]);
  const [notice, setNotice] = useState('');

  const selectedPet = pets.find((pet) => pet.id === selectedPetId) || pets[0];
  const selectedService =
    services.find((service) => service.id === selectedServiceId) || services[0];
  const activeStep =
    bookingSteps.find((step) => step.step === currentStep) || bookingSteps[0];
  const progressWidth = `${Math.round(
    (currentStep / bookingSteps.length) * 100,
  )}%` as `${number}%`;
  const selectedRange = rangeLabel(startDateId, endDateId, selectedService.mode);
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
  const timeOptions =
    selectedService.mode === 'single' ? singleTimeOptions : overnightTimeOptions;

  function goBack() {
    setNotice('');

    if (currentStep === 1) {
      router.push('/find-care');
      return;
    }

    setCurrentStep((currentStep - 1) as BookingStep);
  }

  function goNext() {
    setNotice('');

    if (currentStep < 6) {
      setCurrentStep((currentStep + 1) as BookingStep);
      return;
    }

    setNotice(
      'Request prepared. The Guru reviews availability and final price before payment.',
    );
  }

  function choosePet(petId: string) {
    if (petId === 'add-pet') {
      router.push('/pet-parent-setup');
      return;
    }

    setSelectedPetId(petId);
  }

  function chooseService(service: ServiceOption) {
    setSelectedServiceId(service.id);
    setEndDateId('');

    if (service.mode === 'single') {
      setSelectedTime('Midday');
    } else {
      setSelectedTime('Flexible handoff');
    }
  }

  function chooseDate(day: CalendarDay) {
    if (day.status === 'busy') {
      setNotice('This date is unavailable. Please choose another day.');
      return;
    }

    setNotice('');

    if (selectedService.mode === 'single') {
      setStartDateId(day.id);
      setEndDateId('');
      return;
    }

    if (!startDateId || endDateId || day.id < startDateId) {
      setStartDateId(day.id);
      setEndDateId('');
      return;
    }

    if (day.id === startDateId) {
      setEndDateId('');
      return;
    }

    setEndDateId(day.id);
  }

  function togglePawReport(item: string) {
    if (pawReportItems.includes(item)) {
      setPawReportItems(pawReportItems.filter((currentItem) => currentItem !== item));
      return;
    }

    setPawReportItems([...pawReportItems, item]);
  }

  function renderEstimateCard() {
    return (
      <View style={styles.estimateCard}>
        <View style={styles.estimateHeader}>
          <View>
            <Text style={styles.estimateEyebrow}>Estimated total</Text>
            <Text style={styles.estimateTotal}>{currency(estimate.total)}</Text>
          </View>
          <Text style={styles.estimateBadge}>Final after Guru accepts</Text>
        </View>

        <View style={styles.estimateRows}>
          <PriceRow
            label={`${selectedService.title} rate`}
            value={`${currency(estimate.adjustedRate)} / ${selectedService.rateUnit}`}
          />
          <PriceRow label="Duration" value={`${estimate.units} ${unitLabel}`} />

          {estimate.additionalPetTotal > 0 ? (
            <PriceRow
              label="Additional pet fee"
              value={currency(estimate.additionalPetTotal)}
            />
          ) : null}

          {estimate.multiPetSavings > 0 ? (
            <SavingsRow
              label="Multi-pet savings"
              value={`-${currency(estimate.multiPetSavings)}`}
            />
          ) : null}

          {estimate.longStaySavings > 0 ? (
            <SavingsRow
              label="Long-stay savings"
              value={`-${currency(estimate.longStaySavings)}`}
            />
          ) : null}

          {estimate.pawPerksCredit > 0 ? (
            <SavingsRow
              label="PawPerks credit"
              value={`-${currency(estimate.pawPerksCredit)}`}
            />
          ) : null}

          {estimate.referralCredit > 0 ? (
            <SavingsRow
              label="Referral credit"
              value={`-${currency(estimate.referralCredit)}`}
            />
          ) : null}
        </View>

        <Text style={styles.estimateNote}>
          This estimate is not a charge. The Guru confirms availability and final pricing before payment.
        </Text>
      </View>
    );
  }

  function renderStepContent() {
    if (currentStep === 1) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.petList}>
            {pets.map((pet) => {
              const selected = selectedPetId === pet.id;

              return (
                <Pressable
                  key={pet.id}
                  accessibilityRole="button"
                  onPress={() => choosePet(pet.id)}
                  style={[styles.petCard, selected && styles.petCardActive]}
                >
                  <View style={styles.petAvatar}>
                    <Text style={styles.petAvatarText}>{pet.emoji}</Text>
                  </View>
                  <View style={styles.petCopy}>
                    <Text style={styles.petName}>{pet.name}</Text>
                    <Text style={styles.petDescription}>{pet.description}</Text>
                  </View>
                  <Text style={styles.petStatus}>{selected ? 'Selected' : 'Choose'}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.counterCard}>
            <Text style={styles.smallSectionTitle}>Additional pets</Text>
            <View style={styles.counterRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setAdditionalPets(Math.max(0, additionalPets - 1))}
                style={styles.counterButton}
              >
                <Text style={styles.counterButtonText}>-</Text>
              </Pressable>
              <View style={styles.counterValue}>
                <Text style={styles.counterNumber}>{additionalPets}</Text>
                <Text style={styles.counterLabel}>extra pets</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => setAdditionalPets(additionalPets + 1)}
                style={styles.counterButton}
              >
                <Text style={styles.counterButtonText}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.savingsCard}>
            <Text style={styles.smallSectionTitle}>Pet Parent savings</Text>
            <TogglePill
              active={applyPawPerks}
              label="Apply PawPerks credit"
              onPress={() => setApplyPawPerks(!applyPawPerks)}
            />
            <TogglePill
              active={applyReferralCredit}
              label="Apply referral credit"
              onPress={() => setApplyReferralCredit(!applyReferralCredit)}
            />
          </View>

          {renderEstimateCard()}
        </View>
      );
    }

    if (currentStep === 2) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.serviceList}>
            {services.map((service) => {
              const selected = selectedServiceId === service.id;

              return (
                <Pressable
                  key={service.id}
                  accessibilityRole="button"
                  onPress={() => chooseService(service)}
                  style={[styles.serviceCard, selected && styles.serviceCardActive]}
                >
                  <View style={styles.serviceHeader}>
                    <Text
                      style={[
                        styles.serviceTitle,
                        selected && styles.serviceTextActive,
                      ]}
                    >
                      {service.title}
                    </Text>
                    <Text
                      style={[
                        styles.serviceRate,
                        selected && styles.serviceTextActive,
                      ]}
                    >
                      {currency(service.baseRate)} / {service.rateUnit}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.serviceDescription,
                      selected && styles.serviceTextActive,
                    ]}
                  >
                    {service.description}
                  </Text>
                  <Text
                    style={[
                      styles.serviceMeta,
                      selected && styles.serviceTextActive,
                    ]}
                  >
                    Additional pet: +{currency(service.additionalPetRate)} / {service.rateUnit}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      );
    }

    if (currentStep === 3) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.scheduleSummary}>
            <Text style={styles.scheduleEyebrow}>Selected schedule</Text>
            <Text style={styles.scheduleTitle}>{selectedRange}</Text>
            <Text style={styles.scheduleText}>
              {selectedService.title} • {estimate.units} {unitLabel} • {selectedTime}
            </Text>
          </View>

          {renderEstimateCard()}

          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>
                {displayMonth.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              <View style={styles.monthControls}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setDisplayMonth((month) => addMonths(month, -1))}
                  style={styles.monthButton}
                >
                  <Text style={styles.monthButtonText}>‹</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setDisplayMonth(monthStart(new Date()));
                    setStartDateId(toDateId(todayStart()));
                    setEndDateId('');
                  }}
                  style={styles.todayButton}
                >
                  <Text style={styles.todayButtonText}>Today</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setDisplayMonth((month) => addMonths(month, 1))}
                  style={styles.monthButton}
                >
                  <Text style={styles.monthButtonText}>›</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.calendarHelp}>
              {selectedService.mode === 'single'
                ? 'Tap one date. Prices are estimates.'
                : endDateId
                  ? 'Range selected. Tap another date to start over.'
                  : 'Tap start date, then end date.'}
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
                <View key={`week-${weekIndex}`} style={styles.calendarWeek}>
                  {week.map((day) => {
                    const selected =
                      selectedService.mode === 'single'
                        ? day.id === startDateId
                        : isDateInRange(day.id, startDateId, endDateId);
                    const isStart = day.id === startDateId;
                    const isEnd = day.id === endDateId && Boolean(endDateId);
                    const outsideMonth = !sameMonth(day.date, displayMonth);
                    const dayPrice =
                      day.status === 'busy'
                        ? null
                        : selectedService.baseRate + day.priceAdjustment;

                    return (
                      <Pressable
                        key={day.id}
                        accessibilityRole="button"
                        onPress={() => chooseDate(day)}
                        style={[
                          styles.dateCell,
                          outsideMonth && styles.dateOutsideMonth,
                          isToday(day.date) && styles.dateToday,
                          selected && styles.dateSelected,
                          (isStart || isEnd) && styles.dateEndpoint,
                          day.status === 'busy' && styles.dateBusy,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dateDay,
                            selected && styles.dateTextSelected,
                            day.status === 'busy' && styles.dateTextMuted,
                          ]}
                        >
                          {day.day}
                        </Text>
                        <Text
                          style={[
                            styles.datePrice,
                            selected && styles.dateTextSelected,
                            day.status === 'busy' && styles.dateTextMuted,
                          ]}
                        >
                          {day.status === 'busy' ? 'Busy' : dayPrice ? currency(dayPrice) : '-'}
                        </Text>
                        <Text
                          style={[
                            styles.dateTag,
                            selected && styles.dateTextSelected,
                          ]}
                        >
                          {isStart && selectedService.mode !== 'single'
                            ? 'Start'
                            : isEnd
                              ? 'End'
                              : isToday(day.date)
                                ? 'Today'
                                : day.label || ''}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.choiceSection}>
            <Text style={styles.smallSectionTitle}>Preferred time</Text>
            <View style={styles.choiceGrid}>
              {timeOptions.map((time) => (
                <TogglePill
                  key={time}
                  active={selectedTime === time}
                  label={time}
                  onPress={() => setSelectedTime(time)}
                />
              ))}
            </View>
          </View>
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
            <Text style={styles.smallSectionTitle}>PawReport updates requested</Text>
            <View style={styles.choiceGrid}>
              {pawReportOptions.map((item) => (
                <TogglePill
                  key={item}
                  active={pawReportItems.includes(item)}
                  label={item}
                  onPress={() => togglePawReport(item)}
                />
              ))}
            </View>
          </View>
        </View>
      );
    }

    if (currentStep === 5) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.reviewCard}>
            <Text style={styles.reviewEyebrow}>Review request</Text>
            <ReviewRow label="Guru" value="Local Guru" />
            <ReviewRow label="Pet" value={`${selectedPet.name} • ${selectedPet.type}`} />
            <ReviewRow label="Service" value={selectedService.title} />
            <ReviewRow label="Schedule" value={selectedRange} />
            <ReviewRow label="Duration" value={`${estimate.units} ${unitLabel}`} />
            <ReviewRow label="Time" value={selectedTime} />
            <ReviewRow
              label="Estimated price"
              value={`${currency(estimate.total)} • final after Guru accepts`}
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
              label="PawReport"
              value={pawReportItems.length ? pawReportItems.join(', ') : 'Can be added later'}
            />
          </View>

          {renderEstimateCard()}
        </View>
      );
    }

    return (
      <View style={styles.stepBody}>
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Ready to send.</Text>
          <Text style={styles.successText}>
            This request goes to the Guru for review. Payment happens later after the Guru accepts.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={goNext}
            style={styles.submitButton}
          >
            <Text style={styles.submitButtonText}>Submit Request</Text>
          </Pressable>
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
              <Text style={styles.heroBadgeText}>Pet Parent Booking Request</Text>
            </View>
            <Text style={styles.title}>Pet Parent Booking Request.</Text>
            <Text style={styles.subtitle}>
              Choose your pet, service, dates, savings, and notes. The Guru reviews before payment.
            </Text>
            <View style={styles.heroActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/conversation')}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Message First</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/find-care')}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Back to Search</Text>
              </Pressable>
            </View>
            <View style={styles.progressBlock}>
              <View style={styles.progressTopRow}>
                <Text style={styles.progressLabel}>Step {currentStep} of 6</Text>
                <Text style={styles.progressPercent}>
                  {Math.round((currentStep / bookingSteps.length) * 100)}%
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: progressWidth }]} />
              </View>
            </View>
          </View>

          <View style={styles.heroVisualCard}>
            <Text style={styles.heroVisualIcon}>📅</Text>
            <Text style={styles.heroVisualTitle}>Booking calendar</Text>
            <Text style={styles.heroVisualText}>
              Pet Parents see estimated prices. Gurus confirm final availability and pricing.
            </Text>
          </View>
        </View>

        <View style={styles.stepRail}>
          {bookingSteps.map((step) => {
            const active = currentStep === step.step;
            const complete = step.step < currentStep;

            return (
              <Pressable
                key={step.step}
                accessibilityRole="button"
                onPress={() => setCurrentStep(step.step)}
                style={[styles.stepPill, active && styles.stepPillActive]}
              >
                <Text style={[styles.stepPillText, active && styles.stepPillTextActive]}>
                  {complete ? '✓ ' : ''}
                  {step.shortTitle}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.activePanel}>
          <View style={styles.stepHeader}>
            <View>
              <Text style={styles.stepEyebrow}>Step {activeStep.step}</Text>
              <Text style={styles.stepTitle}>{activeStep.title}</Text>
            </View>
            <Text style={styles.stepBadge}>
              {currentStep >= 5 ? 'Review' : 'Required'}
            </Text>
          </View>
          <Text style={styles.stepDescription}>{activeStep.description}</Text>
          {renderStepContent()}
        </View>

        {notice ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        <View style={styles.bottomDockSpacer} />
      </View>

      <View style={styles.bottomDock}>
        <Pressable
          accessibilityRole="button"
          onPress={goBack}
          style={styles.dockSecondaryButton}
        >
          <Text style={styles.dockSecondaryText}>
            {currentStep === 1 ? 'Search' : 'Back'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={goNext}
          style={styles.dockPrimaryButton}
        >
          <Text style={styles.dockPrimaryText}>
            {currentStep === 6 ? 'Submit' : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </SitGuruScreen>
  );
}

function TogglePill({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.togglePill, active && styles.togglePillActive]}
    >
      <Text style={[styles.togglePillText, active && styles.togglePillTextActive]}>
        {active ? '✓ ' : ''}
        {label}
      </Text>
    </Pressable>
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
  keyboardType?: 'default' | 'number-pad' | 'email-address' | 'phone-pad';
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

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.priceRow}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={styles.priceValue}>{value}</Text>
    </View>
  );
}

function SavingsRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.savingsRow}>
      <Text style={styles.savingsLabel}>{label}</Text>
      <Text style={styles.savingsValue}>{value}</Text>
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
    padding: 18,
  },
  heroPanelWide: {
    flexDirection: 'row',
  },
  heroCopy: {
    flex: 1,
    gap: 16,
    justifyContent: 'center',
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
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 18,
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
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: SitGuruColors.primary,
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
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  progressPercent: {
    color: SitGuruColors.text,
    fontSize: 12,
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
  heroVisualCard: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 28,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    minHeight: 260,
    padding: 22,
  },
  heroVisualIcon: {
    fontSize: 42,
  },
  heroVisualTitle: {
    color: SitGuruColors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroVisualText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
  },
  stepRail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stepPill: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 11,
  },
  stepPillActive: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  stepPillText: {
    color: SitGuruColors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  stepPillTextActive: {
    color: '#FFFFFF',
  },
  activePanel: {
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
    textTransform: 'uppercase',
  },
  stepTitle: {
    color: SitGuruColors.text,
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -0.7,
    lineHeight: 34,
  },
  stepBadge: {
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
  stepDescription: {
    color: SitGuruColors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  stepBody: {
    gap: 12,
  },
  petList: {
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
    minHeight: 72,
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
  petAvatarText: {
    fontSize: 24,
  },
  petCopy: {
    flex: 1,
    gap: 3,
  },
  petName: {
    color: SitGuruColors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  petDescription: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  petStatus: {
    color: SitGuruColors.primary,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  counterCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  smallSectionTitle: {
    color: SitGuruColors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  counterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
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
  },
  counterNumber: {
    color: SitGuruColors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  counterLabel: {
    color: SitGuruColors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  savingsCard: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  togglePill: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  togglePillActive: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  togglePillText: {
    color: SitGuruColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  togglePillTextActive: {
    color: '#FFFFFF',
  },
  estimateCard: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 2,
    gap: 12,
    padding: 16,
  },
  estimateHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  estimateEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  estimateTotal: {
    color: SitGuruColors.text,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 39,
  },
  estimateBadge: {
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
  estimateRows: {
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
  },
  estimateNote: {
    color: SitGuruColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  serviceList: {
    gap: 10,
  },
  serviceCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
    minHeight: 88,
    padding: 14,
  },
  serviceCardActive: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  serviceHeader: {
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
  serviceRate: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  serviceDescription: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  serviceMeta: {
    color: SitGuruColors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  serviceTextActive: {
    color: '#FFFFFF',
  },
  scheduleSummary: {
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 24,
    gap: 6,
    padding: 16,
  },
  scheduleEyebrow: {
    color: '#C9F26D',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  scheduleTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 27,
  },
  scheduleText: {
    color: '#DCEFE2',
    fontSize: 14,
    fontWeight: '700',
  },
  calendarCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  calendarHeader: {
    gap: 10,
  },
  calendarTitle: {
    color: SitGuruColors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  monthControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
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
    fontSize: 28,
    fontWeight: '900',
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
  },
  todayButtonText: {
    color: SitGuruColors.primary,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  calendarHelp: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  weekdayRow: {
    flexDirection: 'row',
    gap: 6,
  },
  weekdayText: {
    color: SitGuruColors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  calendarWeeks: {
    gap: 6,
  },
  calendarWeek: {
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
  dateOutsideMonth: {
    opacity: 0.42,
  },
  dateToday: {
    borderColor: SitGuruColors.primary,
    borderWidth: 2,
  },
  dateSelected: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
  },
  dateEndpoint: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  dateBusy: {
    backgroundColor: '#F4F0EC',
    borderColor: '#E2D7CC',
    opacity: 0.62,
  },
  dateDay: {
    color: SitGuruColors.text,
    fontSize: 20,
    fontWeight: '900',
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
  dateTextSelected: {
    color: '#FFFFFF',
  },
  dateTextMuted: {
    color: SitGuruColors.textSoft,
  },
  choiceSection: {
    gap: 9,
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  reviewCard: {
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
  successCard: {
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
  noticeCard: {
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
  dockSecondaryButton: {
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
  dockPrimaryButton: {
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
});