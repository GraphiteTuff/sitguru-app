import { router } from 'expo-router';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  PawPrint,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SitGuruIcon } from '@/components/SitGuruIcon';
import SitGuruRoleStatus from '@/components/SitGuruRoleStatus';
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

type BookingStep = 1 | 2 | 3 | 4 | 5 | 6;
type CareMode = 'single' | 'overnight' | 'multi-day';
type DateStatus = 'available' | 'limited' | 'busy';

type RecordRow = Record<string, unknown>;

type PetOption = {
  id: string;
  name: string;
  type: string;
  emoji: string;
  description: string;
  photoUrl: string | null;
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

const FALLBACK_PETS: PetOption[] = [
  {
    id: 'scout',
    name: 'Scout',
    type: 'Dog',
    emoji: '🐶',
    description: 'Friendly dog • 30-minute walk',
    photoUrl: null,
  },
  {
    id: 'luna',
    name: 'Luna',
    type: 'Cat',
    emoji: '🐱',
    description: 'Indoor cat • Feeding and litter notes',
    photoUrl: null,
  },
  {
    id: 'add-pet',
    name: 'Add another pet',
    type: 'Other',
    emoji: '+',
    description: 'Create or update a Pet Passport',
    photoUrl: null,
  },
];

const PET_TABLES = ['pets', 'pet_profiles', 'pet_passports'];
const PET_OWNER_FIELDS = ['owner_id', 'pet_parent_id', 'user_id', 'created_by'];

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

async function loadPetOptions(userId: string): Promise<PetOption[]> {
  for (const table of PET_TABLES) {
    for (const ownerField of PET_OWNER_FIELDS) {
      const result = await supabase
        .from(table)
        .select('*')
        .eq(ownerField, userId)
        .limit(30);

      if (!result.error && result.data?.length) {
        return (result.data as RecordRow[])
          .map(mapPetOption)
          .filter((pet): pet is PetOption => Boolean(pet));
      }
    }
  }

  return [];
}

function mapPetOption(row: RecordRow, index: number): PetOption | null {
  const name = firstString(row, ['name', 'pet_name', 'animal_name']);
  if (!name) return null;

  const species = firstString(row, ['species', 'animal_type', 'pet_type']);
  const breed = firstString(row, ['breed', 'breed_name']);
  const age = firstString(row, ['age_label', 'age']) || getPetAgeLabel(row);
  const type = species || 'Other';

  return {
    id: firstString(row, ['id', 'pet_id']) || `pet-${index}`,
    name,
    type,
    emoji: getPetEmoji(type),
    description:
      [breed, species, age].filter(Boolean).join(' • ') ||
      'Pet Passport ready for care',
    photoUrl: resolveSupabaseStorageUrl(
      firstString(row, [
        'photo_url',
        'image_url',
        'avatar_url',
        'pet_photo_url',
      ]),
    ),
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

function getPetEmoji(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes('cat')) return '🐱';
  if (normalized.includes('dog')) return '🐶';
  return '🐾';
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

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

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

const THEME_OPTIONS: Array<{
  label: string;
  value: SitGuruThemePreference;
  icon: 'sun' | 'moon';
}> = [
  { label: 'Light', value: 'light', icon: 'sun' },
  { label: 'Dark', value: 'dark', icon: 'moon' },
];

export default function RequestBookingScreen() {
  const { user, profile } = useAuth();
  const isWebPreview = Platform.OS === 'web';
  const themeMode = useThemeMode();
  const themePreference = useThemePreference();
  const isDark = themeMode === 'dark';
  const palette = getPalette(isDark);
  const styles = createStyles(isDark);

  const [currentStep, setCurrentStep] = useState<BookingStep>(1);
  const [displayMonth, setDisplayMonth] = useState(monthStart(new Date()));
  const calendarDays = useMemo(
    () => buildCalendarMonth(displayMonth),
    [displayMonth],
  );
  const calendarWeeks = useMemo(
    () => buildCalendarWeeks(calendarDays),
    [calendarDays],
  );

  const firstAvailable =
    calendarDays.find(
      (day) => sameMonth(day.date, displayMonth) && day.status !== 'busy',
    ) || calendarDays[0];

  const [petOptions, setPetOptions] = useState<PetOption[]>(FALLBACK_PETS);
  const [selectedPetId, setSelectedPetId] = useState('scout');
  const [petLoadMessage, setPetLoadMessage] = useState('');
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

  useEffect(() => {
    let active = true;

    async function loadPets() {
      if (!user?.id || !isSupabaseConfigured) {
        return;
      }

      try {
        const loadedPets = await loadPetOptions(user.id);

        if (!active || loadedPets.length === 0) {
          return;
        }

        const addPetOption = FALLBACK_PETS.find((pet) => pet.id === 'add-pet');
        const nextOptions = addPetOption
          ? [...loadedPets, addPetOption]
          : loadedPets;

        setPetOptions(nextOptions);
        setPetLoadMessage('');
        setSelectedPetId((currentId) => {
          if (loadedPets.some((pet) => pet.id === currentId)) {
            return currentId;
          }

          return (
            loadedPets.find((pet) => pet.name.toLowerCase() === 'scout')?.id ??
            loadedPets[0].id
          );
        });
      } catch {
        if (active) {
          setPetLoadMessage(
            'Pet Passport photos could not be refreshed. Showing the saved preview instead.',
          );
        }
      }
    }

    void loadPets();

    return () => {
      active = false;
    };
  }, [user?.id]);

  const selectedPet =
    petOptions.find((pet) => pet.id === selectedPetId) || petOptions[0];
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
    selectedService.mode === 'single'
      ? singleTimeOptions
      : overnightTimeOptions;

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
      'Your request is ready to review in Booking Details. No payment has been charged and no booking is confirmed until a Guru accepts.',
    );
  }

  function choosePet(petId: string) {
    if (petId === 'add-pet') {
      router.push('/pet-passports');
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
      setPawReportItems(
        pawReportItems.filter((currentItem) => currentItem !== item),
      );
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

          <View style={styles.estimateBadge}>
            <CircleDollarSign
              color={palette.primary}
              size={14}
              strokeWidth={2.3}
            />
            <Text style={styles.estimateBadgeText}>Estimate only</Text>
          </View>
        </View>

        <View style={styles.estimateRows}>
          <PriceRow
            label={`${selectedService.title} rate`}
            value={`${currency(estimate.adjustedRate)} / ${selectedService.rateUnit}`}
            styles={styles}
          />
          <PriceRow
            label="Duration"
            value={`${estimate.units} ${unitLabel}`}
            styles={styles}
          />

          {estimate.additionalPetTotal > 0 ? (
            <PriceRow
              label="Additional pet fee"
              value={currency(estimate.additionalPetTotal)}
              styles={styles}
            />
          ) : null}

          {estimate.multiPetSavings > 0 ? (
            <SavingsRow
              label="Multi-pet savings"
              value={`-${currency(estimate.multiPetSavings)}`}
              styles={styles}
            />
          ) : null}

          {estimate.longStaySavings > 0 ? (
            <SavingsRow
              label="Long-stay savings"
              value={`-${currency(estimate.longStaySavings)}`}
              styles={styles}
            />
          ) : null}

          {estimate.pawPerksCredit > 0 ? (
            <SavingsRow
              label="PawPerks credit"
              value={`-${currency(estimate.pawPerksCredit)}`}
              styles={styles}
            />
          ) : null}

          {estimate.referralCredit > 0 ? (
            <SavingsRow
              label="Referral credit"
              value={`-${currency(estimate.referralCredit)}`}
              styles={styles}
            />
          ) : null}
        </View>

        <Text style={styles.estimateNote}>
          No charge is made now. The Guru confirms availability and final
          pricing before payment.
        </Text>
      </View>
    );
  }

  function renderStepContent() {
    if (currentStep === 1) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.petList}>
            {petOptions.map((pet) => {
              const selected = selectedPetId === pet.id;

              return (
                <Pressable
                  key={pet.id}
                  accessibilityRole="button"
                  onPress={() => choosePet(pet.id)}
                  style={({ pressed }) => [
                    styles.petCard,
                    selected && styles.petCardActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <AvatarImage
                    fallback={pet.emoji}
                    imageUrl={pet.photoUrl}
                    palette={palette}
                    size={50}
                    style={styles.petAvatar}
                  />

                  <View style={styles.petCopy}>
                    <Text style={styles.petName}>{pet.name}</Text>
                    <Text style={styles.petDescription} numberOfLines={2}>
                      {pet.description}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.choiceIndicator,
                      selected && styles.choiceIndicatorActive,
                    ]}
                  >
                    {selected ? (
                      <Text style={styles.choiceIndicatorText}>✓</Text>
                    ) : (
                      <ChevronRight
                        color={palette.muted}
                        size={16}
                        strokeWidth={2.4}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.compactCard}>
            <View style={styles.compactCardHeader}>
              <View>
                <Text style={styles.smallSectionTitle}>Additional pets</Text>
                <Text style={styles.helperText}>
                  Add pets included in this request.
                </Text>
              </View>

              <View style={styles.counterRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    setAdditionalPets(Math.max(0, additionalPets - 1))
                  }
                  style={styles.counterButton}
                >
                  <Text style={styles.counterButtonText}>−</Text>
                </Pressable>

                <Text style={styles.counterNumber}>{additionalPets}</Text>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => setAdditionalPets(additionalPets + 1)}
                  style={styles.counterButton}
                >
                  <Text style={styles.counterButtonText}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.compactCard}>
            <Text style={styles.smallSectionTitle}>Apply savings</Text>
            <View style={styles.choiceGrid}>
              <TogglePill
                active={applyPawPerks}
                label="PawPerks"
                onPress={() => setApplyPawPerks(!applyPawPerks)}
                styles={styles}
              />
              <TogglePill
                active={applyReferralCredit}
                label="Referral credit"
                onPress={() => setApplyReferralCredit(!applyReferralCredit)}
                styles={styles}
              />
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/pet-passports')}
            style={styles.passportCard}
          >
            <View style={styles.passportIcon}>
              <PawPrint color={palette.primary} size={20} strokeWidth={2.3} />
            </View>
            <View style={styles.passportCopy}>
              <Text style={styles.passportTitle}>Manage Pet Passports</Text>
              <Text style={styles.passportText}>
                Add a pet or update care details before sending the request.
              </Text>
            </View>
            <ChevronRight
              color={palette.primary}
              size={18}
              strokeWidth={2.4}
            />
          </Pressable>

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
                  style={({ pressed }) => [
                    styles.serviceCard,
                    selected && styles.serviceCardActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.serviceHeader}>
                    <View style={styles.serviceIcon}>
                      <PawPrint
                        color={selected ? '#FFFFFF' : palette.primary}
                        size={18}
                        strokeWidth={2.3}
                      />
                    </View>

                    <View style={styles.serviceCopy}>
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
                          styles.serviceDescription,
                          selected && styles.serviceDescriptionActive,
                        ]}
                      >
                        {service.description}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.serviceRate,
                        selected && styles.serviceTextActive,
                      ]}
                    >
                      {currency(service.baseRate)}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.serviceMeta,
                      selected && styles.serviceDescriptionActive,
                    ]}
                  >
                    per {service.rateUnit} • additional pet +
                    {currency(service.additionalPetRate)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {renderEstimateCard()}
        </View>
      );
    }

    if (currentStep === 3) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.scheduleSummary}>
            <CalendarDays color="#FFFFFF" size={23} strokeWidth={2.3} />
            <View style={styles.scheduleCopy}>
              <Text style={styles.scheduleEyebrow}>Selected schedule</Text>
              <Text style={styles.scheduleTitle}>{selectedRange}</Text>
              <Text style={styles.scheduleText}>
                {selectedService.title} • {estimate.units} {unitLabel} •{' '}
                {selectedTime}
              </Text>
            </View>
          </View>

          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setDisplayMonth((month) => addMonths(month, -1))}
                style={styles.monthButton}
              >
                <Text style={styles.monthButtonText}>‹</Text>
              </Pressable>

              <View style={styles.calendarTitleWrap}>
                <Text style={styles.calendarTitle}>
                  {displayMonth.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setDisplayMonth(monthStart(new Date()));
                    setStartDateId(toDateId(todayStart()));
                    setEndDateId('');
                  }}
                >
                  <Text style={styles.todayButtonText}>Today</Text>
                </Pressable>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => setDisplayMonth((month) => addMonths(month, 1))}
                style={styles.monthButton}
              >
                <Text style={styles.monthButtonText}>›</Text>
              </Pressable>
            </View>

            <Text style={styles.calendarHelp}>
              {selectedService.mode === 'single'
                ? 'Choose one available date.'
                : endDateId
                  ? 'Date range selected. Tap another date to start over.'
                  : 'Choose the start date, then the end date.'}
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
                            styles.dateTag,
                            selected && styles.dateTextSelected,
                            day.status === 'busy' && styles.dateTextMuted,
                          ]}
                          numberOfLines={1}
                        >
                          {day.status === 'busy'
                            ? 'Busy'
                            : isStart && selectedService.mode !== 'single'
                              ? 'Start'
                              : isEnd
                                ? 'End'
                                : day.label || ''}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.compactCard}>
            <Text style={styles.smallSectionTitle}>Preferred time</Text>
            <View style={styles.choiceGrid}>
              {timeOptions.map((time) => (
                <TogglePill
                  key={time}
                  active={selectedTime === time}
                  label={time}
                  onPress={() => setSelectedTime(time)}
                  styles={styles}
                />
              ))}
            </View>
          </View>

          {renderEstimateCard()}
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
            palette={palette}
            styles={styles}
          />
          <Field
            label="Access notes"
            multiline
            onChangeText={setAccessNotes}
            placeholder="Parking, gate code, apartment entry, key location, or arrival instructions."
            value={accessNotes}
            palette={palette}
            styles={styles}
          />

          <View style={styles.compactCard}>
            <Text style={styles.smallSectionTitle}>PawReport updates</Text>
            <Text style={styles.helperText}>
              Choose the updates you want during care.
            </Text>
            <View style={styles.choiceGrid}>
              {pawReportOptions.map((item) => (
                <TogglePill
                  key={item}
                  active={pawReportItems.includes(item)}
                  label={item}
                  onPress={() => togglePawReport(item)}
                  styles={styles}
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
            <View style={styles.reviewHeader}>
              <ShieldCheck color={palette.primary} size={20} strokeWidth={2.4} />
              <View>
                <Text style={styles.reviewEyebrow}>Review request</Text>
                <Text style={styles.reviewTitle}>Everything look right?</Text>
              </View>
            </View>

            <ReviewRow label="Guru" value="Selected Guru" styles={styles} />
            <ReviewRow
              label="Pet"
              value={`${selectedPet.name} • ${selectedPet.type}`}
              styles={styles}
            />
            <ReviewRow
              label="Service"
              value={selectedService.title}
              styles={styles}
            />
            <ReviewRow
              label="Schedule"
              value={selectedRange}
              styles={styles}
            />
            <ReviewRow
              label="Duration"
              value={`${estimate.units} ${unitLabel}`}
              styles={styles}
            />
            <ReviewRow label="Time" value={selectedTime} styles={styles} />
            <ReviewRow
              label="Estimated price"
              value={`${currency(estimate.total)} • final after Guru accepts`}
              styles={styles}
            />
            <ReviewRow
              label="Savings"
              value={
                estimate.totalSavings > 0
                  ? `${currency(estimate.totalSavings)} estimated savings`
                  : 'No savings applied'
              }
              styles={styles}
            />
            <ReviewRow
              label="PawReport"
              value={
                pawReportItems.length
                  ? pawReportItems.join(', ')
                  : 'Can be added later'
              }
              styles={styles}
              last
            />
          </View>

          {renderEstimateCard()}
        </View>
      );
    }

    return (
      <View style={styles.stepBody}>
        <View style={styles.readyCard}>
          <View style={styles.readyIcon}>
            <Sparkles color="#FFFFFF" size={24} strokeWidth={2.4} />
          </View>
          <Text style={styles.readyTitle}>Ready for Guru review</Text>
          <Text style={styles.readyText}>
            Your request is prepared. No payment is charged and the booking is
            not confirmed until the Guru accepts.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/booking-details',
                params: {
                  petId: selectedPet.id,
                  petName: selectedPet.name,
                  viewerRole: 'pet_parent',
                },
              })
            }
            style={styles.readyButton}
          >
            <Text style={styles.readyButtonText}>Open Booking Details</Text>
            <ChevronRight color={palette.primary} size={18} strokeWidth={2.4} />
          </Pressable>
        </View>
      </View>
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
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.header}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    onPress={goBack}
                    style={styles.headerButton}
                  >
                    <ChevronLeft
                      color={palette.title}
                      size={20}
                      strokeWidth={2.5}
                    />
                  </Pressable>

                  <View style={styles.headerCopy}>
                    <Text style={styles.headerTitle}>Request Care</Text>
                    <Text style={styles.headerSubtitle}>
                      Step {currentStep} of {bookingSteps.length}
                    </Text>
                    <SitGuruRoleStatus compact role="pet_parent" />
                  </View>

                  <View style={styles.headerActions}>
                    <View style={styles.modeToggle}>
                      {THEME_OPTIONS.map((option) => {
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
                      accessibilityLabel="Open Pet Parent profile"
                      accessibilityRole="button"
                      onPress={() => router.push('/account')}
                      style={styles.profileButton}
                    >
                      <AvatarImage
                        fallback={initials(petParentName)}
                        imageUrl={petParentAvatarUrl}
                        palette={palette}
                        size={38}
                      />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.progressCard}>
                  <View style={styles.progressCardTop}>
                    <View style={styles.progressNumber}>
                      <Text style={styles.progressNumberText}>{currentStep}</Text>
                    </View>
                    <View style={styles.progressCopy}>
                      <Text style={styles.progressEyebrow}>CARE REQUEST</Text>
                      <Text style={styles.progressTitle}>{activeStep.title}</Text>
                      <Text style={styles.progressText}>
                        {activeStep.description}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: progressWidth }]} />
                  </View>
                </View>

                {petLoadMessage ? (
                  <View style={styles.loadNotice}>
                    <Text style={styles.loadNoticeText}>{petLoadMessage}</Text>
                  </View>
                ) : null}

                <ScrollView
                  horizontal
                  contentContainerStyle={styles.stepRail}
                  showsHorizontalScrollIndicator={false}
                >
                  {bookingSteps.map((step) => {
                    const active = currentStep === step.step;
                    const complete = step.step < currentStep;

                    return (
                      <Pressable
                        key={step.step}
                        accessibilityRole="button"
                        onPress={() => {
                          setNotice('');
                          setCurrentStep(step.step);
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
                            active && styles.stepPillTextActive,
                            complete && styles.stepPillTextComplete,
                          ]}
                        >
                          {complete ? '✓' : step.step}
                        </Text>
                        <Text
                          style={[
                            styles.stepPillText,
                            active && styles.stepPillTextActive,
                            complete && styles.stepPillTextComplete,
                          ]}
                        >
                          {step.shortTitle}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <View style={styles.activePanel}>{renderStepContent()}</View>

                {notice ? (
                  <View style={styles.noticeCard}>
                    <Text style={styles.noticeText}>{notice}</Text>
                  </View>
                ) : null}

                <View style={styles.bottomSpacer} />
              </ScrollView>

              <View style={styles.bottomDock}>
                <Pressable
                  accessibilityRole="button"
                  onPress={goBack}
                  style={styles.dockSecondaryButton}
                >
                  <Text style={styles.dockSecondaryText}>
                    {currentStep === 1 ? 'Find Care' : 'Back'}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={goNext}
                  style={styles.dockPrimaryButton}
                >
                  <Text style={styles.dockPrimaryText}>
                    {currentStep === 6 ? 'Finish' : 'Continue'}
                  </Text>
                  <ChevronRight color="#FFFFFF" size={18} strokeWidth={2.5} />
                </Pressable>
              </View>
            </View>
          </View>

          {isWebPreview ? <View style={styles.homeIndicator} /> : null}
        </View>
      </View>
    </SitGuruScreen>
  );
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
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.togglePill, active && styles.togglePillActive]}
    >
      <Text
        style={[
          styles.togglePillText,
          active && styles.togglePillTextActive,
        ]}
      >
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
  palette,
  styles,
}: {
  label: string;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  palette: ReturnType<typeof getPalette>;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.placeholder}
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
      />
    </View>
  );
}

function PriceRow({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.priceRow}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={styles.priceValue}>{value}</Text>
    </View>
  );
}

function SavingsRow({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.savingsRow}>
      <Text style={styles.savingsLabel}>{label}</Text>
      <Text style={styles.savingsValue}>{value}</Text>
    </View>
  );
}

function ReviewRow({
  label,
  value,
  styles,
  last = false,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
  last?: boolean;
}) {
  return (
    <View style={[styles.reviewRow, last && styles.reviewRowLast]}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
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
    surface: isDark ? '#0B2118' : '#FFFEFA',
    surfaceSoft: isDark ? '#102D21' : '#FFF6E9',
    border: isDark ? '#234B38' : '#EADDCB',
    borderStrong: isDark ? '#2E6C4B' : '#CFE5D7',
    title: isDark ? '#FFF5E8' : '#123F31',
    text: isDark ? '#E8EEE9' : '#27483E',
    muted: isDark ? '#9DB0A5' : '#738078',
    placeholder: isDark ? '#7F9488' : '#9A9A90',
    primary: isDark ? '#39D982' : '#087449',
    primaryDark: isDark ? '#087A4C' : '#075D3B',
    primarySoft: isDark ? '#123E2A' : '#E4F5E9',
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
      paddingBottom: 116,
      paddingHorizontal: 15,
      paddingTop: 10,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    headerButton: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 39,
      justifyContent: 'center',
      width: 39,
    },
    headerCopy: {
      flex: 1,
      gap: 1,
    },
    headerTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 20,
      letterSpacing: -0.4,
    },
    headerSubtitle: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 10,
    },
    headerActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    profileButton: {
      borderRadius: 999,
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
      backgroundColor: isDark ? 'rgba(226,170,45,0.18)' : '#FFF4D8',
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
    progressCard: {
      backgroundColor: isDark ? '#087A4C' : '#087F50',
      borderRadius: 21,
      gap: 12,
      padding: 14,
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.26 : 0.13,
      shadowRadius: 16,
    },
    progressCardTop: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 11,
    },
    progressNumber: {
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderRadius: 999,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    progressNumberText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 18,
    },
    progressCopy: {
      flex: 1,
      gap: 2,
    },
    progressEyebrow: {
      color: 'rgba(255,255,255,0.76)',
      fontFamily: AppFonts.bold,
      fontSize: 8,
      letterSpacing: 0.8,
    },
    progressTitle: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 18,
      lineHeight: 22,
    },
    progressText: {
      color: 'rgba(255,255,255,0.84)',
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 14,
    },
    progressTrack: {
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderRadius: 999,
      height: 6,
      overflow: 'hidden',
    },
    progressFill: {
      backgroundColor: '#FFFFFF',
      borderRadius: 999,
      height: '100%',
    },
    stepRail: {
      gap: 7,
      paddingRight: 4,
    },
    stepPill: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 15,
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
      backgroundColor: palette.primarySoft,
      borderColor: palette.borderStrong,
    },
    stepPillNumber: {
      color: palette.muted,
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    stepPillText: {
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 9,
    },
    stepPillTextActive: {
      color: '#FFFFFF',
    },
    stepPillTextComplete: {
      color: isDark ? '#BDF6D2' : palette.primaryDark,
    },
    activePanel: {
      gap: 12,
    },
    stepBody: {
      gap: 11,
    },
    petList: {
      gap: 8,
    },
    petCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      minHeight: 72,
      padding: 10,
    },
    petCardActive: {
      backgroundColor: palette.primarySoft,
      borderColor: palette.borderStrong,
    },
    petAvatar: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 47,
      justifyContent: 'center',
      width: 47,
    },
    petAvatarText: {
      fontSize: 21,
    },
    petCopy: {
      flex: 1,
      gap: 2,
    },
    petName: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 14,
    },
    petDescription: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 14,
    },
    choiceIndicator: {
      alignItems: 'center',
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 27,
      justifyContent: 'center',
      width: 27,
    },
    choiceIndicatorActive: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    choiceIndicatorText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
    },
    compactCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 9,
      padding: 12,
    },
    compactCardHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    smallSectionTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
    },
    helperText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 14,
    },
    counterRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    counterButton: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 32,
      justifyContent: 'center',
      width: 32,
    },
    counterButtonText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 17,
    },
    counterNumber: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 16,
      minWidth: 18,
      textAlign: 'center',
    },
    passportCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      padding: 11,
    },
    passportIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 12,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    passportCopy: {
      flex: 1,
      gap: 2,
    },
    passportTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
    },
    passportText: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
    },
    choiceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },
    togglePill: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 34,
      paddingHorizontal: 10,
    },
    togglePillActive: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    togglePillText: {
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 9,
    },
    togglePillTextActive: {
      color: '#FFFFFF',
    },
    estimateCard: {
      backgroundColor: palette.surface,
      borderColor: palette.borderStrong,
      borderRadius: 19,
      borderWidth: 1,
      gap: 10,
      padding: 12,
    },
    estimateHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    estimateEyebrow: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 8,
      letterSpacing: 0.75,
      textTransform: 'uppercase',
    },
    estimateTotal: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 25,
      letterSpacing: -0.6,
      lineHeight: 30,
    },
    estimateBadge: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    estimateBadgeText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 8,
    },
    estimateRows: {
      gap: 6,
    },
    priceRow: {
      alignItems: 'center',
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'space-between',
      paddingBottom: 6,
    },
    priceLabel: {
      color: palette.muted,
      flex: 1,
      fontFamily: AppFonts.medium,
      fontSize: 9,
    },
    priceValue: {
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 9,
      textAlign: 'right',
    },
    savingsRow: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 10,
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    savingsLabel: {
      color: palette.primary,
      flex: 1,
      fontFamily: AppFonts.bold,
      fontSize: 9,
    },
    savingsValue: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 9,
    },
    estimateNote: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
    },
    serviceList: {
      gap: 8,
    },
    serviceCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 7,
      padding: 11,
    },
    serviceCardActive: {
      backgroundColor: palette.primaryDark,
      borderColor: palette.primaryDark,
    },
    serviceHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 9,
    },
    serviceIcon: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: 11,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    serviceCopy: {
      flex: 1,
      gap: 2,
    },
    serviceTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
    },
    serviceRate: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
    },
    serviceDescription: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
    },
    serviceDescriptionActive: {
      color: 'rgba(255,255,255,0.78)',
    },
    serviceMeta: {
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 8,
      paddingLeft: 45,
    },
    serviceTextActive: {
      color: '#FFFFFF',
    },
    scheduleSummary: {
      alignItems: 'center',
      backgroundColor: palette.primaryDark,
      borderRadius: 19,
      flexDirection: 'row',
      gap: 10,
      padding: 12,
    },
    scheduleCopy: {
      flex: 1,
      gap: 2,
    },
    scheduleEyebrow: {
      color: 'rgba(255,255,255,0.72)',
      fontFamily: AppFonts.bold,
      fontSize: 8,
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    scheduleTitle: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
    },
    scheduleText: {
      color: 'rgba(255,255,255,0.8)',
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
    },
    calendarCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 19,
      borderWidth: 1,
      gap: 10,
      padding: 10,
    },
    calendarHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    calendarTitleWrap: {
      alignItems: 'center',
      gap: 1,
    },
    calendarTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 14,
    },
    todayButtonText: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 8,
    },
    monthButton: {
      alignItems: 'center',
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 32,
      justifyContent: 'center',
      width: 32,
    },
    monthButtonText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 21,
      lineHeight: 22,
    },
    calendarHelp: {
      color: palette.muted,
      fontFamily: AppFonts.medium,
      fontSize: 8,
      lineHeight: 12,
      textAlign: 'center',
    },
    weekdayRow: {
      flexDirection: 'row',
      gap: 4,
    },
    weekdayText: {
      color: palette.muted,
      flex: 1,
      fontFamily: AppFonts.bold,
      fontSize: 8,
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
      borderRadius: 9,
      borderWidth: 1,
      flex: 1,
      minHeight: 45,
      paddingHorizontal: 1,
      paddingVertical: 5,
    },
    dateOutsideMonth: {
      opacity: 0.34,
    },
    dateToday: {
      borderColor: palette.primary,
      borderWidth: 1.5,
    },
    dateSelected: {
      backgroundColor: palette.primarySoft,
      borderColor: palette.primary,
    },
    dateEndpoint: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    dateBusy: {
      opacity: 0.45,
    },
    dateDay: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
    },
    dateTag: {
      color: palette.muted,
      fontFamily: AppFonts.bold,
      fontSize: 6,
      marginTop: 2,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    dateTextSelected: {
      color: '#FFFFFF',
    },
    dateTextMuted: {
      color: palette.placeholder,
    },
    fieldWrap: {
      gap: 6,
    },
    fieldLabel: {
      color: palette.title,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    input: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 17,
      borderWidth: 1,
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 11,
      minHeight: 48,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },
    multilineInput: {
      minHeight: 94,
      textAlignVertical: 'top',
    },
    reviewCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 19,
      borderWidth: 1,
      overflow: 'hidden',
    },
    reviewHeader: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      flexDirection: 'row',
      gap: 9,
      padding: 11,
    },
    reviewEyebrow: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 8,
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    reviewTitle: {
      color: palette.title,
      fontFamily: AppFonts.extraBold,
      fontSize: 13,
    },
    reviewRow: {
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      gap: 2,
      paddingHorizontal: 11,
      paddingVertical: 9,
    },
    reviewRowLast: {
      borderBottomWidth: 0,
    },
    reviewLabel: {
      color: palette.primary,
      fontFamily: AppFonts.bold,
      fontSize: 7,
      letterSpacing: 0.55,
      textTransform: 'uppercase',
    },
    reviewValue: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 14,
    },
    readyCard: {
      alignItems: 'center',
      backgroundColor: palette.primaryDark,
      borderRadius: 22,
      gap: 8,
      padding: 16,
    },
    readyIcon: {
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderRadius: 999,
      height: 48,
      justifyContent: 'center',
      width: 48,
    },
    readyTitle: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 18,
      textAlign: 'center',
    },
    readyText: {
      color: 'rgba(255,255,255,0.82)',
      fontFamily: AppFonts.medium,
      fontSize: 10,
      lineHeight: 15,
      textAlign: 'center',
    },
    readyButton: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 999,
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      marginTop: 3,
      minHeight: 42,
      paddingHorizontal: 16,
      width: '100%',
    },
    readyButtonText: {
      color: palette.primary,
      fontFamily: AppFonts.extraBold,
      fontSize: 11,
    },
    noticeCard: {
      backgroundColor: palette.surfaceSoft,
      borderColor: palette.borderStrong,
      borderRadius: 15,
      borderWidth: 1,
      padding: 10,
    },
    noticeText: {
      color: palette.text,
      fontFamily: AppFonts.medium,
      fontSize: 9,
      lineHeight: 13,
    },
    pressed: {
      opacity: 0.78,
      transform: [{ scale: 0.99 }],
    },
    bottomSpacer: {
      height: 18,
    },
    bottomDock: {
      alignItems: 'center',
      backgroundColor: isDark ? '#071A12' : '#FFFDF8',
      borderColor: palette.border,
      borderRadius: 21,
      borderWidth: 1,
      bottom: 8,
      flexDirection: 'row',
      gap: 8,
      left: 10,
      padding: 8,
      position: 'absolute',
      right: 10,
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: -7 },
      shadowOpacity: isDark ? 0.26 : 0.08,
      shadowRadius: 16,
    },
    dockSecondaryButton: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 44,
      minWidth: 88,
      paddingHorizontal: 13,
    },
    dockSecondaryText: {
      color: palette.text,
      fontFamily: AppFonts.bold,
      fontSize: 11,
    },
    dockPrimaryButton: {
      alignItems: 'center',
      backgroundColor: palette.primaryDark,
      borderRadius: 999,
      flex: 1,
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: 14,
    },
    dockPrimaryText: {
      color: '#FFFFFF',
      fontFamily: AppFonts.extraBold,
      fontSize: 12,
    },
  });
}