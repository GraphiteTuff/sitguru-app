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

type PricingStep = 1 | 2 | 3 | 4 | 5;
type ServiceId =
  | 'dog-walking'
  | 'drop-in'
  | 'doggy-day-care'
  | 'boarding'
  | 'house-sitting'
  | 'multi-day-care';

type ServiceMode = 'single' | 'overnight' | 'multi-day';

type ServiceConfig = {
  id: ServiceId;
  title: string;
  mode: ServiceMode;
  rateUnit: string;
  description: string;
};

type ServiceRate = {
  baseRate: string;
  additionalPetRate: string;
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

const pricingSteps: {
  step: PricingStep;
  shortTitle: string;
  title: string;
  description: string;
}[] = [
  {
    step: 1,
    shortTitle: 'Rates',
    title: 'Set service rates',
    description:
      'Control the base rate and additional-pet rate for each service you offer.',
  },
  {
    step: 2,
    shortTitle: 'Calendar',
    title: 'Set calendar pricing',
    description:
      'Update special dates, peak days, limited availability, or busy days.',
  },
  {
    step: 3,
    shortTitle: 'Discounts',
    title: 'Set discount rules',
    description:
      'Create multi-pet savings, long-stay savings, and repeat Pet Parent discounts.',
  },
  {
    step: 4,
    shortTitle: 'Availability',
    title: 'Set availability rules',
    description:
      'Control same-day requests, weekend requests, holiday requests, and advance booking windows.',
  },
  {
    step: 5,
    shortTitle: 'Preview',
    title: 'Preview pricing',
    description:
      'Review how your rates and discounts may appear to Pet Parents before a request is sent.',
  },
];

const services: ServiceConfig[] = [
  {
    id: 'dog-walking',
    title: 'Dog Walking',
    mode: 'single',
    rateUnit: 'visit',
    description: 'Walks, potty breaks, exercise, and outdoor time.',
  },
  {
    id: 'drop-in',
    title: 'Drop-In Visit',
    mode: 'single',
    rateUnit: 'visit',
    description: 'Food, water, potty, litter, play, and quick care.',
  },
  {
    id: 'doggy-day-care',
    title: 'Doggy Day Care',
    mode: 'single',
    rateUnit: 'day',
    description: 'Daytime supervision, play, and care support.',
  },
  {
    id: 'boarding',
    title: 'Boarding',
    mode: 'overnight',
    rateUnit: 'night',
    description: 'Overnight care with you when available.',
  },
  {
    id: 'house-sitting',
    title: 'House Sitting',
    mode: 'overnight',
    rateUnit: 'night',
    description: 'Overnight or multi-day care in the Pet Parent home.',
  },
  {
    id: 'multi-day-care',
    title: 'Multi-Day Care',
    mode: 'multi-day',
    rateUnit: 'day',
    description: 'Care across multiple days with clear date range and notes.',
  },
];

const defaultRates: Record<ServiceId, ServiceRate> = {
  'dog-walking': {
    baseRate: '25',
    additionalPetRate: '10',
  },
  'drop-in': {
    baseRate: '22',
    additionalPetRate: '8',
  },
  'doggy-day-care': {
    baseRate: '40',
    additionalPetRate: '15',
  },
  boarding: {
    baseRate: '58',
    additionalPetRate: '22',
  },
  'house-sitting': {
    baseRate: '72',
    additionalPetRate: '20',
  },
  'multi-day-care': {
    baseRate: '45',
    additionalPetRate: '15',
  },
};

const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function currency(value: number) {
  return `$${Math.max(0, Math.round(value)).toLocaleString('en-US')}`;
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
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(
    date.getDate(),
  )}`;
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
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

export default function GuruPricingScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 760;

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
  const [multiPetDiscountEnabled, setMultiPetDiscountEnabled] = useState(true);
  const [multiPetDiscountPercent, setMultiPetDiscountPercent] = useState('10');
  const [longStayDiscountEnabled, setLongStayDiscountEnabled] = useState(true);
  const [longStayMinUnits, setLongStayMinUnits] = useState('5');
  const [longStayDiscountPercent, setLongStayDiscountPercent] = useState('8');
  const [repeatDiscountEnabled, setRepeatDiscountEnabled] = useState(false);
  const [repeatDiscountPercent, setRepeatDiscountPercent] = useState('5');
  const [acceptSameDay, setAcceptSameDay] = useState(false);
  const [acceptWeekends, setAcceptWeekends] = useState(true);
  const [acceptHolidays, setAcceptHolidays] = useState(true);
  const [advanceBookingWindow, setAdvanceBookingWindow] = useState('180');
  const [availabilityNotes, setAvailabilityNotes] = useState('');

  const selectedService =
    services.find((service) => service.id === selectedServiceId) || services[0];
  const selectedRate = serviceRates[selectedServiceId];
  const activeStep =
    pricingSteps.find((step) => step.step === currentStep) || pricingSteps[0];
  const progressWidth = `${Math.round(
    (currentStep / pricingSteps.length) * 100,
  )}%` as `${number}%`;

  const calendarDays = useMemo(() => buildCalendarMonth(displayMonth), [displayMonth]);
  const calendarWeeks = useMemo(() => buildCalendarWeeks(calendarDays), [calendarDays]);
  const selectedDay =
    calendarDays.find((day) => day.id === selectedDateId) || calendarDays[0];
  const selectedRule = dayRules[selectedDateId];

  function updateSelectedRate(updates: Partial<ServiceRate>) {
    setServiceRates((currentRates) => ({
      ...currentRates,
      [selectedServiceId]: {
        ...currentRates[selectedServiceId],
        ...updates,
      },
    }));
  }

  function getDateAdjustment(day: CalendarDay) {
    const rule = dayRules[day.id];

    if (rule) return rule.unavailable ? 0 : rule.adjustment;

    let adjustment = 0;

    if (isWeekend(day.date)) adjustment += toNumber(weekendAdjustment);
    if (isPeakDate(day.date)) adjustment += toNumber(holidayAdjustment);

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
  }

  function clearSelectedDayRule() {
    setDayRules((currentRules) => {
      const nextRules = { ...currentRules };
      delete nextRules[selectedDateId];
      return nextRules;
    });
  }

  function goBack() {
    if (currentStep === 1) {
      router.push('/guru-dashboard');
      return;
    }

    setCurrentStep((currentStep - 1) as PricingStep);
  }

  function goNext() {
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as PricingStep);
      return;
    }

    router.push('/guru-dashboard');
  }

  function renderServiceSelector() {
    return (
      <View style={styles.serviceRail}>
        {services.map((service) => {
          const active = selectedServiceId === service.id;

          return (
            <Pressable
              key={service.id}
              accessibilityRole="button"
              onPress={() => setSelectedServiceId(service.id)}
              style={[styles.servicePill, active && styles.servicePillActive]}
            >
              <Text
                style={[
                  styles.servicePillText,
                  active && styles.servicePillTextActive,
                ]}
              >
                {service.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  function renderPreviewCard() {
    const sampleUnits = selectedService.mode === 'single' ? 1 : 5;
    const baseRate = toNumber(selectedRate.baseRate);
    const additionalPetRate = toNumber(selectedRate.additionalPetRate);
    const baseTotal = baseRate * sampleUnits;
    const additionalPetTotal = additionalPetRate * sampleUnits;
    const multiPetSavings = multiPetDiscountEnabled
      ? Math.round(additionalPetTotal * (toNumber(multiPetDiscountPercent) / 100))
      : 0;
    const longStaySavings =
      longStayDiscountEnabled && sampleUnits >= toNumber(longStayMinUnits)
        ? Math.round(baseTotal * (toNumber(longStayDiscountPercent) / 100))
        : 0;
    const repeatSavings = repeatDiscountEnabled
      ? Math.round(baseTotal * (toNumber(repeatDiscountPercent) / 100))
      : 0;
    const total = Math.max(
      0,
      baseTotal + additionalPetTotal - multiPetSavings - longStaySavings - repeatSavings,
    );

    return (
      <View style={styles.previewPanel}>
        <Text style={styles.previewEyebrow}>Pet Parent estimate preview</Text>
        <Text style={styles.previewTitle}>{currency(total)}</Text>

        <View style={styles.previewRows}>
          <PriceRow label={`${selectedService.title} x ${sampleUnits}`} value={currency(baseTotal)} />
          <PriceRow label="Additional pet estimate" value={currency(additionalPetTotal)} />
          {multiPetSavings > 0 ? (
            <SavingsRow label="Multi-pet savings" value={`-${currency(multiPetSavings)}`} />
          ) : null}
          {longStaySavings > 0 ? (
            <SavingsRow label="Long-stay savings" value={`-${currency(longStaySavings)}`} />
          ) : null}
          {repeatSavings > 0 ? (
            <SavingsRow label="Repeat Pet Parent savings" value={`-${currency(repeatSavings)}`} />
          ) : null}
          <PriceRow label="Estimated total" value={currency(total)} />
        </View>

        <Text style={styles.previewNote}>
          This is a preview only. Pet Parents request care first, then you confirm availability and final pricing.
        </Text>
      </View>
    );
  }

  function renderStepContent() {
    if (currentStep === 1) {
      return (
        <View style={styles.stepBody}>
          {renderServiceSelector()}

          <View style={styles.editorPanel}>
            <Text style={styles.editorEyebrow}>{selectedService.title}</Text>
            <Text style={styles.editorTitle}>Base rate and additional-pet fee</Text>
            <Text style={styles.editorText}>{selectedService.description}</Text>

            <View style={[styles.formGrid, isWide && styles.formGridWide]}>
              <Field
                keyboardType="number-pad"
                label={`Base rate / ${selectedService.rateUnit}`}
                onChangeText={(value) => updateSelectedRate({ baseRate: value })}
                placeholder="25"
                value={selectedRate.baseRate}
              />
              <Field
                keyboardType="number-pad"
                label={`Additional pet / ${selectedService.rateUnit}`}
                onChangeText={(value) =>
                  updateSelectedRate({ additionalPetRate: value })
                }
                placeholder="10"
                value={selectedRate.additionalPetRate}
              />
            </View>
          </View>

          {renderPreviewCard()}
        </View>
      );
    }

    if (currentStep === 2) {
      return (
        <View style={styles.stepBody}>
          {renderServiceSelector()}

          <View style={styles.calendarPanel}>
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
                  onPress={() => setDisplayMonth((month) => addMonths(month, 1))}
                  style={styles.monthButton}
                >
                  <Text style={styles.monthButtonText}>›</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.calendarHelp}>
              Tap a date to adjust the price or mark the date busy.
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
                    const selected = day.id === selectedDateId;
                    const outsideMonth = !sameMonth(day.date, displayMonth);
                    const rule = dayRules[day.id];
                    const price = getDatePrice(day);

                    return (
                      <Pressable
                        key={day.id}
                        accessibilityRole="button"
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
                            rule?.unavailable && styles.dateTextMuted,
                          ]}
                        >
                          {day.day}
                        </Text>
                        <Text
                          style={[
                            styles.datePrice,
                            selected && styles.dateTextSelected,
                            rule?.unavailable && styles.dateTextMuted,
                          ]}
                        >
                          {rule?.unavailable ? 'Busy' : price ? currency(price) : '-'}
                        </Text>
                        <Text
                          style={[
                            styles.dateTag,
                            selected && styles.dateTextSelected,
                          ]}
                        >
                          {rule?.label || (isToday(day.date) ? 'Today' : '')}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.dayRulePanel}>
            <Text style={styles.editorEyebrow}>Selected date</Text>
            <Text style={styles.editorTitle}>
              {selectedDay.date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <Text style={styles.editorText}>
              Current rule:{' '}
              {selectedRule
                ? selectedRule.unavailable
                  ? 'Busy / unavailable'
                  : `+${currency(selectedRule.adjustment)} ${selectedRule.label}`
                : 'Default pricing'}
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
              />
              <RuleButton label="Clear" onPress={clearSelectedDayRule} />
            </View>
          </View>

          <View style={[styles.formGrid, isWide && styles.formGridWide]}>
            <Field
              keyboardType="number-pad"
              label="Default weekend add-on"
              onChangeText={setWeekendAdjustment}
              placeholder="8"
              value={weekendAdjustment}
            />
            <Field
              keyboardType="number-pad"
              label="Default peak / holiday add-on"
              onChangeText={setHolidayAdjustment}
              placeholder="15"
              value={holidayAdjustment}
            />
          </View>
        </View>
      );
    }

    if (currentStep === 3) {
      return (
        <View style={styles.stepBody}>
          <ToggleCard
            active={multiPetDiscountEnabled}
            description="Give Pet Parents a clearer price when they book care for more than one pet."
            onPress={() => setMultiPetDiscountEnabled(!multiPetDiscountEnabled)}
            title="Multi-pet discount"
          />

          <Field
            keyboardType="number-pad"
            label="Multi-pet discount percent"
            onChangeText={setMultiPetDiscountPercent}
            placeholder="10"
            value={multiPetDiscountPercent}
          />

          <ToggleCard
            active={longStayDiscountEnabled}
            description="Offer a discount when overnight or multi-day care reaches your chosen minimum."
            onPress={() => setLongStayDiscountEnabled(!longStayDiscountEnabled)}
            title="Long-stay discount"
          />

          <View style={[styles.formGrid, isWide && styles.formGridWide]}>
            <Field
              keyboardType="number-pad"
              label="Long-stay starts at"
              onChangeText={setLongStayMinUnits}
              placeholder="5"
              value={longStayMinUnits}
            />
            <Field
              keyboardType="number-pad"
              label="Long-stay discount percent"
              onChangeText={setLongStayDiscountPercent}
              placeholder="8"
              value={longStayDiscountPercent}
            />
          </View>

          <ToggleCard
            active={repeatDiscountEnabled}
            description="Reward repeat Pet Parents when they book with you again."
            onPress={() => setRepeatDiscountEnabled(!repeatDiscountEnabled)}
            title="Repeat Pet Parent discount"
          />

          <Field
            keyboardType="number-pad"
            label="Repeat Pet Parent discount percent"
            onChangeText={setRepeatDiscountPercent}
            placeholder="5"
            value={repeatDiscountPercent}
          />

          {renderPreviewCard()}
        </View>
      );
    }

    if (currentStep === 4) {
      return (
        <View style={styles.stepBody}>
          <View style={[styles.formGrid, isWide && styles.formGridWide]}>
            <ToggleCard
              active={acceptSameDay}
              description="Allow Pet Parents to request care for today when your calendar allows it."
              onPress={() => setAcceptSameDay(!acceptSameDay)}
              title="Accept same-day requests"
            />
            <ToggleCard
              active={acceptWeekends}
              description="Allow weekend dates to appear available unless marked busy."
              onPress={() => setAcceptWeekends(!acceptWeekends)}
              title="Accept weekends"
            />
            <ToggleCard
              active={acceptHolidays}
              description="Allow peak and holiday dates to appear available with your pricing rules."
              onPress={() => setAcceptHolidays(!acceptHolidays)}
              title="Accept holidays"
            />
          </View>

          <Field
            keyboardType="number-pad"
            label="Advance booking window"
            onChangeText={setAdvanceBookingWindow}
            placeholder="180"
            value={advanceBookingWindow}
          />

          <Field
            label="Availability notes"
            multiline
            onChangeText={setAvailabilityNotes}
            placeholder="Share schedule rules, travel limits, unavailable seasons, or booking preferences."
            value={availabilityNotes}
          />
        </View>
      );
    }

    return (
      <View style={styles.stepBody}>
        {renderServiceSelector()}
        {renderPreviewCard()}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryEyebrow}>Guru pricing summary</Text>
          <Text style={styles.summaryTitle}>Pricing controls are ready.</Text>
          <View style={styles.summaryRows}>
            <PriceRow label="Selected service" value={selectedService.title} />
            <PriceRow
              label="Base rate"
              value={`${currency(toNumber(selectedRate.baseRate))} / ${selectedService.rateUnit}`}
            />
            <PriceRow
              label="Additional pet"
              value={`${currency(toNumber(selectedRate.additionalPetRate))} / ${selectedService.rateUnit}`}
            />
            <PriceRow
              label="Multi-pet discount"
              value={multiPetDiscountEnabled ? `${multiPetDiscountPercent}%` : 'Off'}
            />
            <PriceRow
              label="Long-stay discount"
              value={
                longStayDiscountEnabled
                  ? `${longStayDiscountPercent}% after ${longStayMinUnits}`
                  : 'Off'
              }
            />
            <PriceRow label="Booking window" value={`${advanceBookingWindow} days ahead`} />
          </View>
          <Text style={styles.summaryNote}>
            This is a Guru-only workspace. Pet Parents see clean estimates during booking, while you control rates and availability here.
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
            onPress={() => router.push('/guru-dashboard')}
            style={styles.topLinkButton}
          >
            <Text style={styles.topLinkText}>Dashboard</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/payments')}
            style={styles.topLinkButton}
          >
            <Text style={styles.topLinkText}>Payout Readiness</Text>
          </Pressable>
        </View>

        <View style={[styles.heroPanel, isWide && styles.heroPanelWide]}>
          <View style={styles.heroCopy}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Guru Pricing Workspace</Text>
            </View>
            <Text style={styles.title}>Control your rates and calendar.</Text>
            <Text style={styles.subtitle}>
              Set service rates, additional pet fees, discounts, date pricing, busy days, and booking rules. Review payout readiness from Payments & Payouts.
            </Text>
            <View style={styles.progressBlock}>
              <View style={styles.progressTopRow}>
                <Text style={styles.progressLabel}>Step {currentStep} of 5</Text>
                <Text style={styles.progressPercent}>
                  {Math.round((currentStep / pricingSteps.length) * 100)}%
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: progressWidth }]} />
              </View>
            </View>
          </View>

          <View style={styles.heroVisualCard}>
            <Text style={styles.heroVisualIcon}>💵</Text>
            <Text style={styles.heroVisualTitle}>Guru-only pricing controls</Text>
            <Text style={styles.heroVisualText}>
              This screen controls what Pet Parents may see as estimates before sending a request.
            </Text>
          </View>
        </View>

        <View style={styles.stepRail}>
          {pricingSteps.map((step) => {
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
              <Text style={styles.stepEyebrow}>Guru pricing step {activeStep.step}</Text>
              <Text style={styles.stepTitle}>{activeStep.title}</Text>
            </View>
            <Text style={styles.stepBadge}>
              {currentStep === 5 ? 'Preview' : 'Guru Setup'}
            </Text>
          </View>
          <Text style={styles.stepDescription}>{activeStep.description}</Text>
          {renderStepContent()}
        </View>

        <View style={styles.bottomDockSpacer} />
      </View>

      <View style={styles.bottomDock}>
        <Pressable
          accessibilityRole="button"
          onPress={goBack}
          style={styles.dockSecondaryButton}
        >
          <Text style={styles.dockSecondaryText}>
            {currentStep === 1 ? 'Dashboard' : 'Previous'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={goNext}
          style={styles.dockPrimaryButton}
        >
          <Text style={styles.dockPrimaryText}>
            {currentStep === 5 ? 'Done' : 'Continue'}
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

function RuleButton({
  label,
  danger = false,
  onPress,
}: {
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.ruleButton, danger && styles.ruleButtonDanger]}
    >
      <Text style={[styles.ruleButtonText, danger && styles.ruleButtonDangerText]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ToggleCard({
  active,
  title,
  description,
  onPress,
}: {
  active: boolean;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.toggleCard, active && styles.toggleCardActive]}
    >
      <View style={[styles.toggleDot, active && styles.toggleDotActive]}>
        <Text style={[styles.toggleDotText, active && styles.toggleDotTextActive]}>
          {active ? '✓' : '•'}
        </Text>
      </View>
      <View style={styles.toggleCopy}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleText}>{description}</Text>
      </View>
    </Pressable>
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
  serviceRail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  servicePill: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  servicePillActive: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  servicePillText: {
    color: SitGuruColors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  servicePillTextActive: {
    color: '#FFFFFF',
  },
  editorPanel: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  editorEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  editorTitle: {
    color: SitGuruColors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 27,
  },
  editorText: {
    color: SitGuruColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  formGrid: {
    gap: 12,
  },
  formGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  fieldWrap: {
    flex: 1,
    gap: 7,
    minWidth: 180,
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
  previewPanel: {
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 28,
    gap: 12,
    padding: 18,
  },
  previewEyebrow: {
    color: '#C9F26D',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  previewTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 35,
  },
  previewRows: {
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
  previewNote: {
    color: '#DCEFE2',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
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
    gap: 10,
  },
  calendarTitle: {
    color: SitGuruColors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  monthControls: {
    flexDirection: 'row',
    gap: 8,
  },
  monthButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    height: 52,
    justifyContent: 'center',
  },
  monthButtonText: {
    color: SitGuruColors.primary,
    fontSize: 28,
    fontWeight: '900',
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
  dayRulePanel: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  ruleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ruleButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  ruleButtonDanger: {
    backgroundColor: '#FFF1F0',
    borderColor: 'rgba(180, 35, 24, 0.18)',
  },
  ruleButtonText: {
    color: SitGuruColors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  ruleButtonDangerText: {
    color: SitGuruColors.danger,
  },
  toggleCard: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  toggleCardActive: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
  },
  toggleDot: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  toggleDotActive: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  toggleDotText: {
    color: SitGuruColors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  toggleDotTextActive: {
    color: '#FFFFFF',
  },
  toggleCopy: {
    flex: 1,
    gap: 4,
  },
  toggleTitle: {
    color: SitGuruColors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  toggleText: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  summaryCard: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  summaryEyebrow: {
    color: SitGuruColors.primary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  summaryTitle: {
    color: SitGuruColors.text,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 27,
  },
  summaryRows: {
    gap: 8,
  },
  summaryNote: {
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