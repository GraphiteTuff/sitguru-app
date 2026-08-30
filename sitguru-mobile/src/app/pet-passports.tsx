import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Pencil, Trash2 } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import BubblePressable from '@/components/BubblePressable';
import FocusTextInput from '@/components/mobile/FocusTextInput';
import MobileScreen from '@/components/mobile/MobileScreen';
import MobileWizard, { type WizardStep } from '@/components/mobile/MobileWizard';
import TouchTarget from '@/components/mobile/TouchTarget';
import VaccineScanStep from '@/components/mobile/VaccineScanStep';
import WelcomeSummaryCard from '@/components/mobile/WelcomeSummaryCard';
import SitGuruProfilePhotoFrame from '@/components/SitGuruProfilePhotoFrame';
import { SitGuruColors } from '@/constants/colors';
import { AppFonts } from '@/constants/fonts';
import {
  MobileSpace,
  MobileType,
  TOUCH_MIN,
} from '@/constants/mobile-layout';
import { usePets } from '@/hooks/data/usePets';
import { useAuth } from '@/hooks/useAuth';
import {
  calculatePetCompletion,
  EMPTY_CANONICAL_PET_FORM,
  petToForm,
  type CanonicalPet,
  type CanonicalPetForm,
} from '@/lib/data/pets';
import {
  emptyVaccinePanel,
  hasAnyVaccine,
  parseVaccinePanel,
  serializeVaccinePanel,
  vaccineSummary,
  VACCINE_OPTIONS,
  type VaccineKey,
  type VaccinePanelState,
} from '@/lib/data/pet-vaccines';
import { uploadSitGuruMedia } from '@/lib/data/media-upload';

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'basics',
    title: 'Who is this pet?',
    helper: 'Name and type are enough to save — extras are optional.',
  },
  {
    id: 'profile',
    title: 'Breed, weight & age',
    helper: 'Skip anytime — Gurus can still care with name and type.',
  },
  {
    id: 'vaccines',
    title: 'Vaccines & scan',
    helper: 'Optional — toggle vaccines or skip and add papers later.',
  },
  {
    id: 'care',
    title: 'Diet & care notes',
    helper: 'Optional comfort tips — save whenever you are ready.',
  },
];

const TYPE_OPTIONS = ['Dog', 'Cat', 'Other'] as const;
const SIZE_OPTIONS = ['Teacup', 'Small', 'Medium', 'Large', 'Extra Large'] as const;

type Draft = {
  petId: string | null;
  name: string;
  type: (typeof TYPE_OPTIONS)[number] | null;
  size: (typeof SIZE_OPTIONS)[number] | null;
  breed: string;
  weight: string;
  age: string;
  dietaryNotes: string;
  careNote: string;
  vaccineUri: string | null;
  vaccines: VaccinePanelState;
  existingPhotoUrl: string;
};

const EMPTY: Draft = {
  petId: null,
  name: '',
  type: null,
  size: null,
  breed: '',
  weight: '',
  age: '',
  dietaryNotes: '',
  careNote: '',
  vaccineUri: null,
  vaccines: emptyVaccinePanel(),
  existingPhotoUrl: '',
};

function paramValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function draftFromPet(pet: CanonicalPet): Draft {
  const parsed = parseVaccinePanel(pet.medical_notes);
  const type = TYPE_OPTIONS.find(
    (option) => option.toLowerCase() === (pet.species || '').toLowerCase(),
  );
  const size = SIZE_OPTIONS.find(
    (option) => option.toLowerCase() === (pet.size || '').toLowerCase(),
  );

  return {
    petId: pet.id,
    name: pet.name || '',
    type: type ?? null,
    size: size ?? null,
    breed: pet.breed || '',
    weight: pet.weight || '',
    age: pet.age || '',
    dietaryNotes: pet.feeding_routine || '',
    careNote: pet.care_instructions || pet.notes || parsed.remainder,
    vaccineUri: null,
    vaccines: parsed.panel,
    existingPhotoUrl: pet.photo_url || '',
  };
}

function ScreenHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.header}>
      <TouchTarget
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={onBack}
        style={styles.backButton}
      >
        <ChevronLeft color={SitGuruColors.text} size={22} strokeWidth={2.4} />
      </TouchTarget>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

/**
 * Native Pet Passport wizard — full CRUD against Supabase `pets` via usePets.
 */
export default function PetPassportsScreen() {
  const params = useLocalSearchParams<{
    mode?: string;
    petId?: string;
  }>();
  const { user } = useAuth();
  const { pets, loading, saving, error, savePet, deletePet, refresh } =
    usePets();
  const [mode, setMode] = useState<'hub' | 'wizard' | 'summary'>('hub');
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [welcomePet, setWelcomePet] = useState<{
    id: string;
    name: string;
    type: string | null;
    breed: string;
    size: string | null;
  } | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const editing = Boolean(draft.petId);

  const canContinue = useMemo(() => {
    // Only name + type are required to progress or save.
    if (stepIndex === 0) return draft.name.trim().length > 1 && !!draft.type;
    return draft.name.trim().length > 1 && !!draft.type;
  }, [draft.name, draft.type, stepIndex]);

  const canSaveBasics = draft.name.trim().length > 1 && !!draft.type;
  function startWizard(pet?: CanonicalPet | null) {
    setDraft(pet ? draftFromPet(pet) : EMPTY);
    setStepIndex(0);
    setMode('wizard');
  }

  // Progressive disclosure from PriorityCarousel / deep links.
  useEffect(() => {
    if (bootstrapped || loading) return;

    const requestedMode = paramValue(params.mode);
    const requestedPetId = paramValue(params.petId);

    if (requestedMode === 'wizard' || requestedPetId) {
      const match = requestedPetId
        ? pets.find((pet) => pet.id === requestedPetId)
        : null;
      startWizard(match ?? null);
    }

    setBootstrapped(true);
  }, [bootstrapped, loading, params.mode, params.petId, pets]);

  function updateVaccine(
    key: VaccineKey,
    patch: Partial<VaccinePanelState[VaccineKey]>,
  ) {
    setDraft((current) => ({
      ...current,
      vaccines: {
        ...current.vaccines,
        [key]: {
          ...current.vaccines[key],
          ...patch,
        },
      },
    }));
  }

  async function finishWizard() {
    if (!user?.id || !draft.type || !canSaveBasics) return;

    let photoUrl = draft.existingPhotoUrl;

    if (draft.vaccineUri) {
      try {
        const uploaded = await uploadSitGuruMedia({
          localUri: draft.vaccineUri,
          userId: user.id,
          scopeId: draft.petId || 'passport',
          kind: 'passport',
        });
        photoUrl = uploaded.publicUrl;
      } catch (uploadError) {
        Alert.alert(
          'Vaccine scan upload failed',
          uploadError instanceof Error
            ? uploadError.message
            : 'SitGuru could not upload vaccine papers.',
        );
        return;
      }
    }

    const medicalRemainder = [
      hasAnyVaccine(draft.vaccines)
        ? `Vaccines logged: ${vaccineSummary(draft.vaccines)}.`
        : '',
      photoUrl ? 'Vaccine papers attached via Pet Passport scan.' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const form: CanonicalPetForm = {
      ...EMPTY_CANONICAL_PET_FORM,
      name: draft.name.trim(),
      species: draft.type,
      size: draft.size || '',
      breed: draft.breed.trim(),
      weight: draft.weight.trim(),
      age: draft.age.trim(),
      feeding_routine: draft.dietaryNotes.trim(),
      photo_url: photoUrl,
      care_instructions: draft.careNote.trim(),
      notes: draft.careNote.trim(),
      medical_notes: serializeVaccinePanel(draft.vaccines, medicalRemainder),
    };

    const result = await savePet(form, draft.petId || undefined);
    if (result.error || !result.pet) {
      Alert.alert(
        'Could not save passport',
        result.error || 'SitGuru could not save this pet.',
      );
      return;
    }

    setWelcomePet({
      id: result.pet.id,
      name: result.pet.name || draft.name.trim(),
      type: draft.type,
      breed: draft.breed.trim(),
      size: draft.size,
    });
    setMode('summary');
    setDraft(EMPTY);
    setStepIndex(0);
  }

  function confirmDelete(pet: CanonicalPet) {
    Alert.alert(
      `Remove ${pet.name}?`,
      'This deletes the Pet Passport from your SitGuru account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const result = await deletePet(pet.id);
              if (result.error) {
                Alert.alert('Could not delete', result.error);
              }
            })();
          },
        },
      ],
    );
  }

  if (mode === 'summary' && welcomePet) {
    return (
      <MobileScreen>
        <ScreenHeader
          title="Passport ready"
          onBack={() => {
            setWelcomePet(null);
            setMode('hub');
          }}
        />
        <WelcomeSummaryCard
          petName={welcomePet.name}
          petType={welcomePet.type}
          breed={welcomePet.breed}
          size={welcomePet.size}
          onOpenDashboard={() => {
            router.push({
              pathname: '/pet-parent-dashboard',
              params: {
                welcomePet: welcomePet.name,
                welcomePetId: welcomePet.id,
              },
            });
          }}
          onStayHere={() => {
            setWelcomePet(null);
            setMode('hub');
          }}
        />
      </MobileScreen>
    );
  }

  if (mode === 'wizard') {
    return (
      <MobileScreen>
        <ScreenHeader
          title={editing ? 'Complete Pet Passport' : 'Add Pet Passport'}
          onBack={() => setMode('hub')}
        />
        <MobileWizard
          steps={WIZARD_STEPS}
          stepIndex={stepIndex}
          nextDisabled={!canContinue || saving}
          nextLabel={
            stepIndex === WIZARD_STEPS.length - 1
              ? saving
                ? 'Saving…'
                : editing
                  ? 'Save updates'
                  : 'Save passport'
              : 'Continue'
          }
          skipLabel={
            stepIndex === 0 && canSaveBasics
              ? saving
                ? 'Saving…'
                : 'Save & finish later'
              : stepIndex > 0 && stepIndex < WIZARD_STEPS.length - 1
                ? 'Skip for now'
                : undefined
          }
          onSkip={
            stepIndex === 0 && canSaveBasics
              ? () => {
                  void finishWizard();
                }
              : stepIndex > 0 && stepIndex < WIZARD_STEPS.length - 1
                ? () => setStepIndex((i) => i + 1)
                : undefined
          }
          onBack={() => {
            if (stepIndex === 0) setMode('hub');
            else setStepIndex((i) => i - 1);
          }}
          onNext={() => {
            if (stepIndex >= WIZARD_STEPS.length - 1) {
              void finishWizard();
            } else {
              setStepIndex((i) => i + 1);
            }
          }}
        >
          {stepIndex === 0 ? (
            <View style={styles.stepBody}>
              <FocusTextInput
                accessibilityLabel="Pet name"
                editable={!saving}
                onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
                placeholder="Pet name"
                valid={draft.name.trim().length > 1}
                value={draft.name}
              />
              <Text style={styles.fieldLabel}>Pet type</Text>
              <View style={styles.pillRow}>
                {TYPE_OPTIONS.map((option) => {
                  const active = draft.type === option;
                  return (
                    <TouchTarget
                      key={option}
                      accessibilityRole="button"
                      accessibilityLabel={option}
                      onPress={() => setDraft((d) => ({ ...d, type: option }))}
                      style={[styles.pill, active && styles.pillActive]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          active && styles.pillTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchTarget>
                  );
                })}
              </View>
            </View>
          ) : null}

          {stepIndex === 1 ? (
            <View style={styles.stepBody}>
              <Text style={styles.fieldLabel}>Size (optional)</Text>
              <View style={styles.pillRow}>
                {SIZE_OPTIONS.map((option) => {
                  const active = draft.size === option;
                  return (
                    <TouchTarget
                      key={option}
                      accessibilityRole="button"
                      accessibilityLabel={option}
                      onPress={() => setDraft((d) => ({ ...d, size: option }))}
                      style={[styles.pill, active && styles.pillActive]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          active && styles.pillTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchTarget>
                  );
                })}
              </View>
              <FocusTextInput
                accessibilityLabel="Breed"
                editable={!saving}
                onChangeText={(breed) => setDraft((d) => ({ ...d, breed }))}
                placeholder="Breed"
                valid={draft.breed.trim().length > 1}
                value={draft.breed}
              />
              <FocusTextInput
                accessibilityLabel="Weight"
                editable={!saving}
                keyboardType="decimal-pad"
                onChangeText={(weight) => setDraft((d) => ({ ...d, weight }))}
                placeholder="Weight (lbs)"
                valid={draft.weight.trim().length > 0}
                value={draft.weight}
              />
              <FocusTextInput
                accessibilityLabel="Age"
                editable={!saving}
                onChangeText={(age) => setDraft((d) => ({ ...d, age }))}
                placeholder="Age (e.g. 3 years)"
                valid={draft.age.trim().length > 0}
                value={draft.age}
              />
            </View>
          ) : null}

          {stepIndex === 2 ? (
            <View style={styles.stepBody}>
              {VACCINE_OPTIONS.map((option) => {
                const record = draft.vaccines[option.key];
                return (
                  <View key={option.key} style={styles.vaccineCard}>
                    <TouchTarget
                      accessibilityRole="button"
                      accessibilityLabel={`${option.label} ${record.enabled ? 'on' : 'off'}`}
                      onPress={() =>
                        updateVaccine(option.key, {
                          enabled: !record.enabled,
                        })
                      }
                      style={[
                        styles.vaccineToggle,
                        record.enabled && styles.vaccineToggleOn,
                      ]}
                    >
                      <View style={styles.vaccineCopy}>
                        <Text
                          style={[
                            styles.vaccineTitle,
                            record.enabled && styles.vaccineTitleOn,
                          ]}
                        >
                          {option.label}
                        </Text>
                        <Text
                          style={[
                            styles.vaccineHelper,
                            record.enabled && styles.vaccineHelperOn,
                          ]}
                        >
                          {option.helper}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.vaccineState,
                          record.enabled && styles.vaccineStateOn,
                        ]}
                      >
                        {record.enabled ? 'On' : 'Off'}
                      </Text>
                    </TouchTarget>
                    {record.enabled ? (
                      <FocusTextInput
                        accessibilityLabel={`${option.label} date`}
                        editable={!saving}
                        onChangeText={(date) =>
                          updateVaccine(option.key, { date })
                        }
                        placeholder="Date given (YYYY-MM-DD)"
                        value={record.date}
                      />
                    ) : null}
                  </View>
                );
              })}

              <Text style={styles.fieldLabel}>Optional paper scan</Text>
              <VaccineScanStep
                uri={draft.vaccineUri || draft.existingPhotoUrl || null}
                onCapture={(uri) =>
                  setDraft((d) => ({
                    ...d,
                    vaccineUri: uri || null,
                    existingPhotoUrl: uri ? d.existingPhotoUrl : '',
                  }))
                }
              />
            </View>
          ) : null}

          {stepIndex === 3 ? (
            <View style={styles.stepBody}>
              <Text style={styles.fieldLabel}>Dietary notes</Text>
              <FocusTextInput
                accessibilityLabel="Dietary notes"
                editable={!saving}
                inputStyle={styles.noteInput}
                multiline
                onChangeText={(dietaryNotes) =>
                  setDraft((d) => ({ ...d, dietaryNotes }))
                }
                placeholder="Feeding schedule, food brand, allergies…"
                valid={draft.dietaryNotes.trim().length > 2}
                value={draft.dietaryNotes}
              />
              <Text style={styles.fieldLabel}>Care snapshot</Text>
              <FocusTextInput
                accessibilityLabel="Care note"
                editable={!saving}
                inputStyle={styles.noteInput}
                multiline
                onChangeText={(careNote) =>
                  setDraft((d) => ({ ...d, careNote }))
                }
                placeholder="Routines, comfort tips, handoff notes…"
                valid={draft.careNote.trim().length > 3}
                value={draft.careNote}
              />
            </View>
          ) : null}
        </MobileWizard>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen
      refreshing={loading}
      onRefresh={() => void refresh()}
      footer={
        <TouchTarget
          accessibilityRole="button"
          accessibilityLabel="Add Pet Passport"
          onPress={() => startWizard(null)}
          style={styles.stickyCta}
        >
          <Text style={styles.stickyCtaText}>Add Pet Passport</Text>
        </TouchTarget>
      }
    >
      <ScreenHeader
        title="Pet Passports"
        onBack={() => router.push('/pet-parent-dashboard')}
      />
      <Text style={styles.subtitle}>
        Passports save to your SitGuru account — Gurus see diet, vaccines, and
        care notes before arrival.
      </Text>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading && pets.length === 0 ? (
        <View style={styles.emptyCard}>
          <ActivityIndicator color={SitGuruColors.primary} />
          <Text style={styles.emptyText}>Loading passports…</Text>
        </View>
      ) : pets.length === 0 ? (
        <View style={styles.emptyCard}>
          <SitGuruProfilePhotoFrame
            fallbackEmoji="🐾"
            name="New pet"
            shape="square"
            size="md"
          />
          <Text style={styles.emptyTitle}>No passports yet</Text>
          <Text style={styles.emptyText}>
            Start the wizard for name, breed, weight, age, vaccines, and dietary
            notes.
          </Text>
          <TouchTarget
            accessibilityRole="button"
            accessibilityLabel="Start passport wizard"
            onPress={() => startWizard(null)}
            style={styles.inlineCta}
          >
            <Text style={styles.stickyCtaText}>Start wizard</Text>
          </TouchTarget>
        </View>
      ) : (
        pets.map((pet) => {
          const form = petToForm(pet);
          const completion = calculatePetCompletion(form);
          const vaccines = parseVaccinePanel(pet.medical_notes).panel;
          const incomplete = completion < 70;

          return (
            <BubblePressable
              key={pet.id}
              accessibilityRole="button"
              accessibilityLabel={
                incomplete
                  ? `Complete ${pet.name}'s passport`
                  : `${pet.name}'s passport`
              }
              onPress={() => startWizard(pet)}
              scaleTo={0.97}
              style={styles.petCard}
            >
              <View style={styles.petTop}>
                <SitGuruProfilePhotoFrame
                  fallbackEmoji={
                    (pet.species || '').toLowerCase().includes('cat')
                      ? '🐱'
                      : '🐶'
                  }
                  imageUrl={pet.photo_url}
                  name={pet.name}
                  shape="square"
                  size="md"
                />
                <View style={styles.petCopy}>
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={styles.petMeta}>
                    {[pet.species, pet.size, pet.breed, pet.weight, pet.age]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                  <Text style={styles.petMeta} numberOfLines={2}>
                    {pet.feeding_routine ||
                      pet.care_instructions ||
                      pet.notes ||
                      'Add dietary and care notes'}
                  </Text>
                  <Text style={styles.petMeta} numberOfLines={1}>
                    {vaccineSummary(vaccines)}
                  </Text>
                  <Text
                    style={[
                      styles.badge,
                      incomplete ? styles.badgeWarn : null,
                    ]}
                  >
                    {incomplete
                      ? `${completion}% complete · tap to finish`
                      : `${completion}% ready · tap to edit`}
                  </Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchTarget
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${pet.name}`}
                  onPress={() => startWizard(pet)}
                  style={styles.secondaryLink}
                >
                  <Pencil
                    color={SitGuruColors.primary}
                    size={16}
                    strokeWidth={2.4}
                  />
                  <Text style={styles.secondaryLinkText}>
                    {incomplete ? 'Continue' : 'Edit'}
                  </Text>
                </TouchTarget>
                <TouchTarget
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${pet.name}`}
                  onPress={() => confirmDelete(pet)}
                  style={styles.dangerLink}
                >
                  <Trash2 color="#B42318" size={16} strokeWidth={2.4} />
                  <Text style={styles.dangerLinkText}>Delete</Text>
                </TouchTarget>
                <TouchTarget
                  accessibilityRole="button"
                  accessibilityLabel={`Request care for ${pet.name}`}
                  onPress={() =>
                    router.push({
                      pathname: '/request-booking',
                      params: { petId: pet.id, petName: pet.name },
                    })
                  }
                  style={styles.secondaryLink}
                >
                  <Text style={styles.secondaryLinkText}>Request Care</Text>
                </TouchTarget>
              </View>
            </BubblePressable>
          );
        })
      )}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: MobileSpace.sm,
    marginBottom: MobileSpace.md,
    minHeight: TOUCH_MIN,
  },
  backButton: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 14,
    height: TOUCH_MIN,
    width: TOUCH_MIN,
  },
  headerTitle: {
    color: SitGuruColors.text,
    flex: 1,
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.title,
    letterSpacing: -0.4,
  },
  headerSpacer: {
    width: TOUCH_MIN,
  },
  subtitle: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.body,
    lineHeight: 22,
    marginBottom: MobileSpace.md,
  },
  stickyCta: {
    backgroundColor: SitGuruColors.primary,
    borderRadius: 16,
    minHeight: TOUCH_MIN + 8,
    width: '100%',
  },
  inlineCta: {
    backgroundColor: SitGuruColors.primary,
    borderRadius: 16,
    minHeight: TOUCH_MIN,
    marginTop: MobileSpace.sm,
    paddingHorizontal: MobileSpace.lg,
  },
  stickyCtaText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.section,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: MobileSpace.md,
    padding: MobileSpace.xl,
  },
  emptyTitle: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.section,
  },
  emptyText: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.body,
    lineHeight: 22,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#FEF3F2',
    borderRadius: 14,
    marginBottom: MobileSpace.md,
    padding: MobileSpace.md,
  },
  errorText: {
    color: '#B42318',
    fontFamily: AppFonts.medium,
    fontSize: MobileType.caption,
  },
  petCard: {
    backgroundColor: SitGuruColors.surface,
    borderColor: SitGuruColors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: MobileSpace.md,
    marginBottom: MobileSpace.md,
    padding: MobileSpace.lg,
  },
  petTop: {
    flexDirection: 'row',
    gap: MobileSpace.md,
  },
  petCopy: {
    flex: 1,
    gap: 4,
  },
  petName: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.section,
  },
  petMeta: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.label,
    lineHeight: 20,
  },
  badge: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.bold,
    fontSize: MobileType.caption,
    marginTop: 4,
  },
  badgeWarn: {
    color: '#B54708',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: MobileSpace.sm,
  },
  secondaryLink: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: TOUCH_MIN,
    paddingHorizontal: 12,
  },
  secondaryLinkText: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.label,
  },
  dangerLink: {
    alignItems: 'center',
    backgroundColor: '#FEF3F2',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: TOUCH_MIN,
    paddingHorizontal: 12,
  },
  dangerLinkText: {
    color: '#B42318',
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.label,
  },
  stepBody: {
    gap: MobileSpace.md,
    width: '100%',
  },
  noteInput: {
    minHeight: 120,
    paddingTop: MobileSpace.md,
    textAlignVertical: 'top',
  },
  fieldLabel: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.bold,
    fontSize: MobileType.label,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: MobileSpace.sm,
  },
  pill: {
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.primaryLight,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: TOUCH_MIN - 4,
    paddingHorizontal: 14,
  },
  pillActive: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  pillText: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.bold,
    fontSize: MobileType.label,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  vaccineCard: {
    gap: MobileSpace.sm,
  },
  vaccineToggle: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderColor: SitGuruColors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: MobileSpace.md,
    justifyContent: 'space-between',
    minHeight: TOUCH_MIN + 8,
    paddingHorizontal: MobileSpace.md,
    paddingVertical: MobileSpace.sm,
  },
  vaccineToggleOn: {
    backgroundColor: SitGuruColors.primary,
    borderColor: SitGuruColors.primary,
  },
  vaccineCopy: {
    flex: 1,
    gap: 2,
  },
  vaccineTitle: {
    color: SitGuruColors.text,
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.body,
  },
  vaccineTitleOn: {
    color: '#FFFFFF',
  },
  vaccineHelper: {
    color: SitGuruColors.textMuted,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.caption,
  },
  vaccineHelperOn: {
    color: 'rgba(255,255,255,0.82)',
  },
  vaccineState: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.bold,
    fontSize: MobileType.label,
  },
  vaccineStateOn: {
    color: '#FFFFFF',
  },
});
