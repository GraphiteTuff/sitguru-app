import { router } from 'expo-router';
import { useState } from 'react';
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

type StepNumber = 1 | 2 | 3 | 4 | 5 | 6;

type SetupStep = {
  step: StepNumber;
  shortTitle: string;
  title: string;
  description: string;
  usedFor: string;
};

const setupSteps: SetupStep[] = [
  {
    step: 1,
    shortTitle: 'Profile',
    title: 'Complete Your Profile',
    description:
      'Add your display name, photo, bio, contact details, and care style so Pet Parents can understand who you are.',
    usedFor:
      'Public Guru profile, search cards, messages, booking requests, trust signals, and dashboard profile health.',
  },
  {
    step: 2,
    shortTitle: 'Service Area',
    title: 'Set Your Service Area',
    description:
      'Add your service city, state, ZIP code, and service area so SitGuru can match you with local Pet Parents.',
    usedFor:
      'Find Care search, map visibility, local matching, service area filtering, and care request availability.',
  },
  {
    step: 3,
    shortTitle: 'Services',
    title: 'Add Services and Pricing',
    description:
      'Choose the care services you offer, the pets you accept, and starting rates so Pet Parents know what they can request.',
    usedFor:
      'Guru search filters, public profile services, booking request options, and Pet Parent care matching.',
  },
  {
    step: 4,
    shortTitle: 'Trust',
    title: 'Trust & Safety Readiness',
    description:
      'Prepare the reliability, communication, safety, and experience details that help Pet Parents feel confident booking you.',
    usedFor:
      'Trust signals, profile readiness, booking confidence, support context, and Guru quality review.',
  },
  {
    step: 5,
    shortTitle: 'Onboarding',
    title: 'Guru Onboarding Packet',
    description:
      'Review SitGuru expectations, care standards, PawReport™ basics, booking flow, and professional conduct.',
    usedFor:
      'Guru Academy, onboarding progress, booking readiness, care standards, and profile review.',
  },
  {
    step: 6,
    shortTitle: 'Payouts',
    title: 'Prepare Payout Setup',
    description:
      'Review payout readiness so completed bookings can move through the correct earnings and payout flow.',
    usedFor:
      'Earnings, payout readiness, completed booking payouts, account review, and future Guru financial dashboard.',
  },
];

const zipLookup: Record<string, { city: string; state: string }> = {
  '18951': { city: 'Quakertown', state: 'PA' },
  '18018': { city: 'Bethlehem', state: 'PA' },
  '18101': { city: 'Allentown', state: 'PA' },
  '19103': { city: 'Philadelphia', state: 'PA' },
  '08030': { city: 'Camden', state: 'NJ' },
};

const serviceOptions = [
  'Dog Walking',
  'Drop-In Visits',
  'Pet Sitting',
  'House Sitting',
  'Boarding',
  'Doggy Day Care',
  'Training Support',
];

const petTypeOptions = ['Dogs', 'Cats', 'Other Pets'];

const trustItems = [
  'I communicate clearly with Pet Parents.',
  'I keep pet routines, safety, and notes organized.',
  'I understand that care details should stay inside SitGuru.',
  'I can complete PawReport™ updates after care.',
];

const onboardingItems = [
  'Review SitGuru care standards',
  'Understand booking request flow',
  'Learn PawReport™ visit updates',
  'Review communication expectations',
  'Prepare profile for SitGuru review',
];

function extractZipCode(value: string) {
  const match = value.match(/\b\d{5}(?:-\d{4})?\b/);
  return match?.[0]?.slice(0, 5) || '';
}

export default function GuruSetupScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 760;

  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [serviceArea, setServiceArea] = useState('');
  const [serviceAreaEnabled, setServiceAreaEnabled] = useState(true);
  const [serviceCity, setServiceCity] = useState('');
  const [serviceState, setServiceState] = useState('');
  const [serviceZip, setServiceZip] = useState('');
  const [locationMessage, setLocationMessage] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedPetTypes, setSelectedPetTypes] = useState<string[]>([]);
  const [selectedTrustItems, setSelectedTrustItems] = useState<string[]>([]);
  const [selectedOnboardingItems, setSelectedOnboardingItems] = useState<string[]>([]);

  const activeStep =
    setupSteps.find((step) => step.step === currentStep) || setupSteps[0];

  const progressWidth = `${Math.round(
    (currentStep / setupSteps.length) * 100,
  )}%` as `${number}%`;

  function applyZipLookup(nextZip: string) {
    const location = zipLookup[nextZip];

    if (!location) {
      setLocationMessage(
        nextZip.length === 5
          ? 'ZIP entered. City and state can be confirmed when location services are connected.'
          : '',
      );
      return;
    }

    setServiceCity(location.city);
    setServiceState(location.state);
    setLocationMessage(`ZIP found: ${location.city}, ${location.state}.`);
  }

  function handleServiceAreaChange(value: string) {
    setServiceArea(value);

    const extractedZip = extractZipCode(value);

    if (extractedZip) {
      setServiceZip(extractedZip);
      applyZipLookup(extractedZip);
    }
  }

  function handleZipChange(value: string) {
    const cleanZip = value.replace(/\D/g, '').slice(0, 5);
    setServiceZip(cleanZip);

    if (cleanZip.length === 5) {
      applyZipLookup(cleanZip);
      return;
    }

    setLocationMessage(
      'Enter a 5-digit ZIP code to auto-fill city and state when available.',
    );
  }

  function toggleValue(value: string, values: string[], setter: (next: string[]) => void) {
    if (values.includes(value)) {
      setter(values.filter((item) => item !== value));
      return;
    }

    setter([...values, value]);
  }

  function goBack() {
    if (currentStep === 1) {
      router.push('/role-selection');
      return;
    }

    setCurrentStep((currentStep - 1) as StepNumber);
  }

  function goNext() {
    if (currentStep < 6) {
      setCurrentStep((currentStep + 1) as StepNumber);
      return;
    }

    router.push('/guru-dashboard');
  }

  function renderStepContent() {
    if (currentStep === 1) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.photoUploadCard}>
            <View style={styles.photoIconBox}>
              <Text style={styles.photoIcon}>＋</Text>
            </View>

            <View style={styles.photoCopy}>
              <Text style={styles.photoTitle}>Profile photo</Text>
              <Text style={styles.photoText}>
                Add a clear, friendly profile photo later. This should be the image Pet Parents see in search.
              </Text>
            </View>
          </View>

          <View style={[styles.formGrid, isWide && styles.formGridWide]}>
            <Field label="Display name" placeholder="Alex Pet Care" />
            <Field label="Email address" placeholder="alex@example.com" keyboardType="email-address" />
            <Field label="Phone number" placeholder="555-555-5555" keyboardType="phone-pad" />
            <Field label="Years of experience" placeholder="3 years" />
          </View>

          <Field
            label="Short Guru bio"
            placeholder="Tell Pet Parents about your care style, experience, pets you love caring for, and what makes you reliable."
            multiline
          />
        </View>
      );
    }

    if (currentStep === 2) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.locationHero}>
            <Text style={styles.locationIcon}>⌖</Text>
            <View style={styles.locationCopy}>
              <Text style={styles.locationTitle}>Your service area controls search visibility.</Text>
              <Text style={styles.locationText}>
                Add city, state, ZIP code, and the areas where you are willing to provide care.
              </Text>
            </View>
          </View>

          <Field
            label="Service area"
            onChangeText={handleServiceAreaChange}
            placeholder="Quakertown, PA 18951 or Upper Bucks"
            value={serviceArea}
          />

          <View style={[styles.formRow, isWide && styles.formRowWide]}>
            <Field
              label="Service city"
              onChangeText={setServiceCity}
              placeholder="Quakertown"
              value={serviceCity}
            />
            <Field
              label="Service state"
              onChangeText={setServiceState}
              placeholder="PA"
              value={serviceState}
            />
            <Field
              keyboardType="number-pad"
              label="Service ZIP"
              onChangeText={handleZipChange}
              placeholder="18951"
              value={serviceZip}
            />
          </View>

          {locationMessage ? (
            <View style={styles.locationMessage}>
              <Text style={styles.locationMessageText}>{locationMessage}</Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={() => setServiceAreaEnabled(!serviceAreaEnabled)}
            style={[
              styles.serviceAreaToggle,
              serviceAreaEnabled && styles.serviceAreaToggleActive,
            ]}
          >
            <Text
              style={[
                styles.serviceAreaToggleText,
                serviceAreaEnabled && styles.serviceAreaToggleTextActive,
              ]}
            >
              {serviceAreaEnabled
                ? 'Service area enabled'
                : 'Service area paused'}
            </Text>
          </Pressable>

          <Field
            label="Service area notes"
            placeholder="Neighborhoods, towns, travel limits, apartment access notes, or areas you prefer to serve."
            multiline
          />
        </View>
      );
    }

    if (currentStep === 3) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.choiceSection}>
            <Text style={styles.choiceSectionTitle}>Services offered</Text>
            <View style={styles.choiceGrid}>
              {serviceOptions.map((service) => {
                const selected = selectedServices.includes(service);

                return (
                  <Pressable
                    key={service}
                    accessibilityRole="button"
                    onPress={() =>
                      toggleValue(service, selectedServices, setSelectedServices)
                    }
                    style={[styles.choicePill, selected && styles.choicePillActive]}
                  >
                    <Text
                      style={[
                        styles.choicePillText,
                        selected && styles.choicePillTextActive,
                      ]}
                    >
                      {service}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.choiceSection}>
            <Text style={styles.choiceSectionTitle}>Pets accepted</Text>
            <View style={styles.choiceGrid}>
              {petTypeOptions.map((petType) => {
                const selected = selectedPetTypes.includes(petType);

                return (
                  <Pressable
                    key={petType}
                    accessibilityRole="button"
                    onPress={() =>
                      toggleValue(petType, selectedPetTypes, setSelectedPetTypes)
                    }
                    style={[styles.petTypeButton, selected && styles.petTypeButtonActive]}
                  >
                    <Text style={styles.petTypeIcon}>
                      {petType === 'Dogs' ? '🐶' : petType === 'Cats' ? '🐱' : '🐾'}
                    </Text>
                    <Text
                      style={[
                        styles.petTypeText,
                        selected && styles.petTypeTextActive,
                      ]}
                    >
                      {petType}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.formGrid, isWide && styles.formGridWide]}>
            <Field label="Starting walking rate" placeholder="$20" />
            <Field label="Starting sitting rate" placeholder="$35" />
            <Field label="Starting boarding rate" placeholder="$50" />
            <Field label="Drop-in visit rate" placeholder="$20" />
          </View>

          <Field
            label="Service notes"
            placeholder="Describe what is included, care limits, availability preferences, and what Pet Parents should know before requesting care."
            multiline
          />
        </View>
      );
    }

    if (currentStep === 4) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.checkGrid}>
            {trustItems.map((item) => {
              const selected = selectedTrustItems.includes(item);

              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  onPress={() =>
                    toggleValue(item, selectedTrustItems, setSelectedTrustItems)
                  }
                  style={[styles.checkCard, selected && styles.checkCardActive]}
                >
                  <Text style={[styles.checkIcon, selected && styles.checkIconActive]}>
                    {selected ? '✓' : '•'}
                  </Text>
                  <Text style={[styles.checkText, selected && styles.checkTextActive]}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Field
            label="Trust and safety notes"
            placeholder="Share relevant experience, comfort with pets, reliability, communication style, or safety practices."
            multiline
          />
        </View>
      );
    }

    if (currentStep === 5) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.checkGrid}>
            {onboardingItems.map((item) => {
              const selected = selectedOnboardingItems.includes(item);

              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  onPress={() =>
                    toggleValue(item, selectedOnboardingItems, setSelectedOnboardingItems)
                  }
                  style={[styles.checkCard, selected && styles.checkCardActive]}
                >
                  <Text style={[styles.checkIcon, selected && styles.checkIconActive]}>
                    {selected ? '✓' : '•'}
                  </Text>
                  <Text style={[styles.checkText, selected && styles.checkTextActive]}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Guru Academy</Text>
            <Text style={styles.infoCardText}>
              Your onboarding materials will help you understand booking requests, communication, care standards, PawReport™ updates, and profile expectations.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.stepBody}>
        <View style={styles.payoutPanel}>
          <Text style={styles.payoutEyebrow}>Payout readiness</Text>
          <Text style={styles.payoutTitle}>Prepare for future completed bookings.</Text>
          <Text style={styles.payoutText}>
            After setup, payout details can be completed before eligible earnings are released from completed care.
          </Text>
        </View>

        <View style={styles.checkGrid}>
          <View style={styles.checkCard}>
            <Text style={styles.checkIcon}>•</Text>
            <Text style={styles.checkText}>Review payout setup requirements</Text>
          </View>

          <View style={styles.checkCard}>
            <Text style={styles.checkIcon}>•</Text>
            <Text style={styles.checkText}>Keep profile and service details accurate</Text>
          </View>

          <View style={styles.checkCard}>
            <Text style={styles.checkIcon}>•</Text>
            <Text style={styles.checkText}>Track completed bookings and payout status from earnings</Text>
          </View>
        </View>

        <View style={[styles.readyActions, isWide && styles.readyActionsWide]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/guru-dashboard')}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Go to Guru Dashboard</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/role-selection')}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Switch Role</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <SitGuruScreen scroll center={false} maxWidth={860}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <SitGuruLogo size="small" variant="symbol" />

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/role-selection')}
            style={styles.topLinkButton}
          >
            <Text style={styles.topLinkText}>Roles</Text>
          </Pressable>
        </View>

        <View style={[styles.heroPanel, isWide && styles.heroPanelWide]}>
          <View style={styles.heroCopy}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Pet Guru setup</Text>
            </View>

            <Text style={styles.title}>Build your Guru profile.</Text>

            <Text style={styles.subtitle}>
              Complete each step so Pet Parents can find, understand, message,
              and request care from you.
            </Text>

            <View style={styles.progressBlock}>
              <View style={styles.progressTopRow}>
                <Text style={styles.progressLabel}>Step {currentStep} of 6</Text>
                <Text style={styles.progressPercent}>
                  {Math.round((currentStep / setupSteps.length) * 100)}%
                </Text>
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: progressWidth }]} />
              </View>
            </View>
          </View>

          <View style={styles.heroPhotoCard}>
            <View style={styles.heroPhotoPlaceholder}>
              <Text style={styles.heroPhotoIcon}>🏡</Text>
              <Text style={styles.heroPhotoTitle}>Guru photo area</Text>
              <Text style={styles.heroPhotoText}>
                Add a profile, pet care, walking, boarding, or visit photo here later.
              </Text>
            </View>

            <View style={styles.heroFloatingCard}>
              <Text style={styles.heroFloatingTitle}>Search visibility</Text>
              <Text style={styles.heroFloatingText}>
                Profile, service area, services, and readiness help you appear in search.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.stepsRail}>
          {setupSteps.map((step) => {
            const active = step.step === currentStep;
            const complete = step.step < currentStep;

            return (
              <Pressable
                key={step.step}
                accessibilityRole="button"
                onPress={() => setCurrentStep(step.step)}
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
                {currentStep === 6 ? 'Final step' : 'Required'}
              </Text>
            </View>
          </View>

          <Text style={styles.stepDescription}>{activeStep.description}</Text>

          <View style={styles.usedForCard}>
            <Text style={styles.usedForLabel}>Used for</Text>
            <Text style={styles.usedForText}>{activeStep.usedFor}</Text>
          </View>

          {renderStepContent()}
        </View>

        <View style={styles.bottomDockSpacer} />
      </View>

      <View style={styles.bottomDock}>
        <Pressable
          accessibilityRole="button"
          onPress={goBack}
          style={styles.dockSecondaryAction}
        >
          <Text style={styles.dockSecondaryText}>
            {currentStep === 1 ? 'Roles' : 'Back'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={goNext}
          style={styles.dockPrimaryAction}
        >
          <Text style={styles.dockPrimaryText}>
            {currentStep === 6 ? 'Dashboard' : 'Continue'}
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
  value?: string;
  onChangeText?: (value: string) => void;
}) {
  const [localValue, setLocalValue] = useState('');
  const isControlled = value !== undefined || onChangeText !== undefined;
  const inputValue = isControlled ? value ?? '' : localValue;

  function handleChangeText(nextValue: string) {
    if (onChangeText) {
      onChangeText(nextValue);
      return;
    }

    setLocalValue(nextValue);
  }

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={SitGuruColors.textSoft}
        style={[styles.input, multiline && styles.multilineInput]}
        value={inputValue}
      />
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
  usedForCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
    padding: 13,
  },
  usedForLabel: {
    color: SitGuruColors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  usedForText: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  stepBody: {
    gap: 12,
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
  formGrid: {
    gap: 12,
  },
  formGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  formRow: {
    gap: 12,
  },
  formRowWide: {
    flexDirection: 'row',
  },
  photoUploadCard: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 14,
  },
  photoIconBox: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  photoIcon: {
    color: SitGuruColors.primary,
    fontSize: 26,
    fontWeight: '900',
  },
  photoCopy: {
    flex: 1,
    gap: 4,
  },
  photoTitle: {
    color: SitGuruColors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  photoText: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  locationHero: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 24,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  locationIcon: {
    color: '#C9F26D',
    fontSize: 28,
    fontWeight: '900',
  },
  locationCopy: {
    flex: 1,
    gap: 4,
  },
  locationTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  locationText: {
    color: '#DCEFE2',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  locationMessage: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  locationMessageText: {
    color: SitGuruColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  serviceAreaToggle: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 14,
  },
  serviceAreaToggleActive: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  serviceAreaToggleText: {
    color: SitGuruColors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  serviceAreaToggleTextActive: {
    color: '#FFFFFF',
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
  petTypeButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
    minWidth: 120,
    padding: 13,
  },
  petTypeButtonActive: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  petTypeIcon: {
    fontSize: 22,
  },
  petTypeText: {
    color: SitGuruColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  petTypeTextActive: {
    color: '#FFFFFF',
  },
  checkGrid: {
    gap: 10,
  },
  checkCard: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 13,
  },
  checkCardActive: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
  },
  checkIcon: {
    color: SitGuruColors.primary,
    fontSize: 18,
    fontWeight: '900',
    width: 22,
  },
  checkIconActive: {
    color: SitGuruColors.primary,
  },
  checkText: {
    color: SitGuruColors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  checkTextActive: {
    color: SitGuruColors.text,
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
  payoutPanel: {
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 24,
    gap: 8,
    padding: 16,
  },
  payoutEyebrow: {
    color: '#C9F26D',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  payoutTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 27,
  },
  payoutText: {
    color: '#DCEFE2',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  readyActions: {
    gap: 10,
    marginTop: 4,
  },
  readyActionsWide: {
    flexDirection: 'row',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primary,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: SitGuruColors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: SitGuruColors.text,
    fontSize: 15,
    fontWeight: '900',
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
