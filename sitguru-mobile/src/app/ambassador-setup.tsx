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

type StepNumber = 1 | 2 | 3 | 4 | 5;

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
    title: 'Ambassador Profile',
    description:
      'Add your name, contact details, city, state, and outreach area so SitGuru knows where you can help.',
    usedFor:
      'Ambassador dashboard, support, referral context, outreach tracking, and community visibility.',
  },
  {
    step: 2,
    shortTitle: 'Referrals',
    title: 'Referral Code and Links',
    description:
      'Prepare your Ambassador code and referral links for Pet Parents, future Gurus, businesses, and community groups.',
    usedFor:
      'Pet Parent referrals, Guru referrals, business/community referrals, referral tracking, and rewards.',
  },
  {
    step: 3,
    shortTitle: 'Packet',
    title: 'Onboarding Packet',
    description:
      'Review referral expectations, community conduct, approved sharing, and Ambassador responsibilities.',
    usedFor:
      'Ambassador onboarding status, approval review, rewards readiness, and support context.',
  },
  {
    step: 4,
    shortTitle: 'Training',
    title: 'Training and Certification',
    description:
      'Complete Ambassador Academy materials so your outreach stays clear, friendly, accurate, and helpful.',
    usedFor:
      'Ambassador Academy, training progress, badge readiness, talking points, and local outreach.',
  },
  {
    step: 5,
    shortTitle: 'Rewards',
    title: 'Rewards and Support',
    description:
      'Review how referral activity, rewards, support, and local outreach stay organized in the Ambassador dashboard.',
    usedFor:
      'Referral rewards, pending/approved/paid activity, support requests, and local growth planning.',
  },
];

const referralTypes = [
  'Pet Parent referral link',
  'Guru referral link',
  'Business referral link',
  'Community group referral link',
];

const packetItems = [
  'I understand SitGuru Ambassadors are generally referral and community based.',
  'I will use approved SitGuru messaging when sharing with others.',
  'I understand rewards depend on verified activity and SitGuru review.',
  'I will represent SitGuru professionally in local and online conversations.',
];

const trainingItems = [
  'Review the SitGuru story',
  'Review Ambassador basics',
  'Review referral talking points',
  'Review community outreach guidance',
  'Complete Ambassador certification',
];

export default function AmbassadorSetupScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 760;

  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [selectedReferralTypes, setSelectedReferralTypes] = useState<string[]>([
    'Pet Parent referral link',
    'Guru referral link',
  ]);
  const [selectedPacketItems, setSelectedPacketItems] = useState<string[]>([]);
  const [selectedTrainingItems, setSelectedTrainingItems] = useState<string[]>([]);

  const activeStep =
    setupSteps.find((step) => step.step === currentStep) || setupSteps[0];

  const progressWidth = `${Math.round(
    (currentStep / setupSteps.length) * 100,
  )}%` as `${number}%`;

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
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as StepNumber);
      return;
    }

    router.push('/ambassador-dashboard');
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
              <Text style={styles.photoTitle}>Ambassador photo</Text>
              <Text style={styles.photoText}>
                Add an approved Ambassador, community, or local outreach photo later.
              </Text>
            </View>
          </View>

          <View style={[styles.formGrid, isWide && styles.formGridWide]}>
            <Field label="Display name" placeholder="Alex Ambassador" />
            <Field label="Email address" placeholder="alex@example.com" keyboardType="email-address" />
            <Field label="Phone number" placeholder="555-555-5555" keyboardType="phone-pad" />
            <Field label="City" placeholder="Quakertown" />
            <Field label="State" placeholder="PA" />
            <Field label="Outreach area" placeholder="Upper Bucks County" />
          </View>

          <Field
            label="Community notes"
            placeholder="Neighborhoods, pet businesses, vet offices, groomers, groups, schools, or local spaces where you may share SitGuru."
            multiline
          />
        </View>
      );
    }

    if (currentStep === 2) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.referralCodePanel}>
            <Text style={styles.referralEyebrow}>Referral code preview</Text>
            <Text style={styles.referralCode}>SITGURU</Text>
            <Text style={styles.referralText}>
              Your final Ambassador referral code will be generated and tracked after setup is connected.
            </Text>
          </View>

          <View style={styles.checkGrid}>
            {referralTypes.map((item) => {
              const selected = selectedReferralTypes.includes(item);

              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  onPress={() =>
                    toggleValue(item, selectedReferralTypes, setSelectedReferralTypes)
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
            label="Referral notes"
            placeholder="Who do you plan to share SitGuru with first?"
            multiline
          />
        </View>
      );
    }

    if (currentStep === 3) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.checkGrid}>
            {packetItems.map((item) => {
              const selected = selectedPacketItems.includes(item);

              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  onPress={() =>
                    toggleValue(item, selectedPacketItems, setSelectedPacketItems)
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
            label="Legal name for acknowledgment"
            placeholder="Alex Peterson"
          />

          <Field
            label="Packet notes"
            placeholder="Questions about referral expectations, rewards, social sharing, or community outreach."
            multiline
          />
        </View>
      );
    }

    if (currentStep === 4) {
      return (
        <View style={styles.stepBody}>
          <View style={styles.trainingHero}>
            <Text style={styles.trainingIcon}>🎓</Text>
            <View style={styles.trainingCopy}>
              <Text style={styles.trainingTitle}>Ambassador Academy</Text>
              <Text style={styles.trainingText}>
                Training helps keep your outreach warm, clear, accurate, and consistent.
              </Text>
            </View>
          </View>

          <View style={styles.checkGrid}>
            {trainingItems.map((item) => {
              const selected = selectedTrainingItems.includes(item);

              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  onPress={() =>
                    toggleValue(item, selectedTrainingItems, setSelectedTrainingItems)
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
        </View>
      );
    }

    return (
      <View style={styles.stepBody}>
        <View style={styles.rewardsPanel}>
          <Text style={styles.rewardsEyebrow}>Rewards and support</Text>
          <Text style={styles.rewardsTitle}>Track referral activity clearly.</Text>
          <Text style={styles.rewardsText}>
            Your Ambassador dashboard will organize referral activity, training, support, and reward status in one place.
          </Text>
        </View>

        <View style={styles.rewardGrid}>
          <View style={styles.rewardMiniCard}>
            <Text style={styles.rewardMiniValue}>$0</Text>
            <Text style={styles.rewardMiniLabel}>Pending</Text>
          </View>

          <View style={styles.rewardMiniCard}>
            <Text style={styles.rewardMiniValue}>$0</Text>
            <Text style={styles.rewardMiniLabel}>Approved</Text>
          </View>

          <View style={styles.rewardMiniCard}>
            <Text style={styles.rewardMiniValue}>$0</Text>
            <Text style={styles.rewardMiniLabel}>Paid</Text>
          </View>
        </View>

        <View style={[styles.readyActions, isWide && styles.readyActionsWide]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/ambassador-dashboard')}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Go to Ambassador Dashboard</Text>
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
              <Text style={styles.heroBadgeText}>Ambassador setup</Text>
            </View>

            <Text style={styles.title}>Prepare your Ambassador dashboard.</Text>

            <Text style={styles.subtitle}>
              Complete each step so your referrals, training, support, and rewards are organized.
            </Text>

            <View style={styles.progressBlock}>
              <View style={styles.progressTopRow}>
                <Text style={styles.progressLabel}>Step {currentStep} of 5</Text>
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
              <Text style={styles.heroPhotoIcon}>🌟</Text>
              <Text style={styles.heroPhotoTitle}>Ambassador photo area</Text>
              <Text style={styles.heroPhotoText}>
                Add an Ambassador, local outreach, community, or pet event photo here later.
              </Text>
            </View>

            <View style={styles.heroFloatingCard}>
              <Text style={styles.heroFloatingTitle}>Grow local trust</Text>
              <Text style={styles.heroFloatingText}>
                Referrals, training, rewards, and support stay organized here.
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
                {currentStep === 5 ? 'Final step' : 'Required'}
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
            {currentStep === 5 ? 'Dashboard' : 'Continue'}
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
    borderColor: 'rgba(180, 35, 24, 0.18)',
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
    backgroundColor: '#FFF1F0',
    borderColor: 'rgba(180, 35, 24, 0.18)',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroBadgeText: {
    color: SitGuruColors.danger,
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
    color: SitGuruColors.danger,
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
    backgroundColor: SitGuruColors.danger,
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
    backgroundColor: SitGuruColors.danger,
    borderColor: SitGuruColors.danger,
  },
  stepPillComplete: {
    backgroundColor: '#FFF1F0',
    borderColor: 'rgba(180, 35, 24, 0.18)',
  },
  stepPillNumber: {
    color: SitGuruColors.danger,
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
    borderColor: 'rgba(180, 35, 24, 0.18)',
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
    color: SitGuruColors.danger,
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
    backgroundColor: '#FFF1F0',
    borderColor: 'rgba(180, 35, 24, 0.18)',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stepBadgeText: {
    color: SitGuruColors.danger,
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
    color: SitGuruColors.danger,
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
  photoUploadCard: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.background,
    borderColor: 'rgba(180, 35, 24, 0.18)',
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
    color: SitGuruColors.danger,
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
  referralCodePanel: {
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 24,
    gap: 8,
    padding: 16,
  },
  referralEyebrow: {
    color: '#DCEFE2',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  referralCode: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1.6,
    lineHeight: 39,
  },
  referralText: {
    color: '#DCEFE2',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
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
    backgroundColor: '#FFF1F0',
    borderColor: 'rgba(180, 35, 24, 0.18)',
  },
  checkIcon: {
    color: SitGuruColors.danger,
    fontSize: 18,
    fontWeight: '900',
    width: 22,
  },
  checkIconActive: {
    color: SitGuruColors.danger,
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
  trainingHero: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 24,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  trainingIcon: {
    fontSize: 30,
  },
  trainingCopy: {
    flex: 1,
    gap: 4,
  },
  trainingTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  trainingText: {
    color: '#DCEFE2',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  rewardsPanel: {
    backgroundColor: SitGuruColors.primaryDark,
    borderRadius: 24,
    gap: 8,
    padding: 16,
  },
  rewardsEyebrow: {
    color: '#C9F26D',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  rewardsTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 27,
  },
  rewardsText: {
    color: '#DCEFE2',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  rewardGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  rewardMiniCard: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    padding: 13,
  },
  rewardMiniValue: {
    color: SitGuruColors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  rewardMiniLabel: {
    color: SitGuruColors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
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