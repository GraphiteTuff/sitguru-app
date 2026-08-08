import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import MobileScreen from '@/components/mobile/MobileScreen';
import MobileWizard, { type WizardStep } from '@/components/mobile/MobileWizard';
import TouchTarget from '@/components/mobile/TouchTarget';
import VaccineScanStep from '@/components/mobile/VaccineScanStep';
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
  EMPTY_CANONICAL_PET_FORM,
  type CanonicalPetForm,
} from '@/lib/data/pets';
import { uploadSitGuruMedia } from '@/lib/data/media-upload';

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'basics',
    title: 'Who is this pet?',
    helper: 'Name and type first — we keep each step short.',
  },
  {
    id: 'size',
    title: 'Size & breed',
    helper: 'Helps Gurus prepare the right gear and energy.',
  },
  {
    id: 'vaccines',
    title: 'Scan vaccine papers',
    helper: 'Use the camera — no long text forms for records.',
  },
  {
    id: 'care',
    title: 'Care snapshot',
    helper: 'One comfort note Gurus will see before arrival.',
  },
];

const TYPE_OPTIONS = ['Dog', 'Cat', 'Other'] as const;
const SIZE_OPTIONS = ['Teacup', 'Small', 'Medium', 'Large', 'Extra Large'] as const;

type Draft = {
  name: string;
  type: (typeof TYPE_OPTIONS)[number] | null;
  size: (typeof SIZE_OPTIONS)[number] | null;
  breed: string;
  vaccineUri: string | null;
  careNote: string;
};

const EMPTY: Draft = {
  name: '',
  type: null,
  size: null,
  breed: '',
  vaccineUri: null,
  careNote: '',
};

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
 * Native Pet Passport wizard — persists to Supabase `pets` via usePets.
 */
export default function PetPassportsScreen() {
  const { user } = useAuth();
  const { pets, loading, saving, error, savePet, refresh } = usePets();
  const [mode, setMode] = useState<'hub' | 'wizard'>('hub');
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY);

  const canContinue = useMemo(() => {
    if (stepIndex === 0) return draft.name.trim().length > 1 && !!draft.type;
    if (stepIndex === 1) return !!draft.size;
    if (stepIndex === 2) return !!draft.vaccineUri;
    if (stepIndex === 3) return draft.careNote.trim().length > 3;
    return false;
  }, [draft, stepIndex]);

  function startWizard() {
    setDraft(EMPTY);
    setStepIndex(0);
    setMode('wizard');
  }

  async function finishWizard() {
    if (!user?.id || !draft.type || !draft.size || !draft.vaccineUri) return;

    let photoUrl = '';
    try {
      const uploaded = await uploadSitGuruMedia({
        localUri: draft.vaccineUri,
        userId: user.id,
        scopeId: 'passport',
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

    const form: CanonicalPetForm = {
      ...EMPTY_CANONICAL_PET_FORM,
      name: draft.name.trim(),
      species: draft.type,
      size: draft.size,
      breed: draft.breed.trim(),
      photo_url: photoUrl,
      care_instructions: draft.careNote.trim(),
      notes: draft.careNote.trim(),
      medical_notes: 'Vaccine papers attached via Pet Passport scan.',
    };

    const result = await savePet(form);
    if (result.error || !result.pet) {
      Alert.alert(
        'Could not save passport',
        result.error || 'SitGuru could not save this pet.',
      );
      return;
    }

    setMode('hub');
    Alert.alert(
      'Passport saved',
      `${result.pet.name}'s passport is live for Gurus.`,
    );
  }

  if (mode === 'wizard') {
    return (
      <MobileScreen>
        <ScreenHeader title="Add Pet Passport" onBack={() => setMode('hub')} />
        <MobileWizard
          steps={WIZARD_STEPS}
          stepIndex={stepIndex}
          nextDisabled={!canContinue || saving}
          nextLabel={
            stepIndex === WIZARD_STEPS.length - 1
              ? saving
                ? 'Saving…'
                : 'Save passport'
              : 'Continue'
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
              <TextInput
                accessibilityLabel="Pet name"
                onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
                placeholder="Pet name"
                placeholderTextColor={SitGuruColors.textSoft}
                style={styles.input}
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
              <Text style={styles.fieldLabel}>Size</Text>
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
              <TextInput
                accessibilityLabel="Breed"
                onChangeText={(breed) => setDraft((d) => ({ ...d, breed }))}
                placeholder="Breed (optional)"
                placeholderTextColor={SitGuruColors.textSoft}
                style={styles.input}
                value={draft.breed}
              />
            </View>
          ) : null}

          {stepIndex === 2 ? (
            <VaccineScanStep
              uri={draft.vaccineUri}
              onCapture={(uri) =>
                setDraft((d) => ({ ...d, vaccineUri: uri || null }))
              }
            />
          ) : null}

          {stepIndex === 3 ? (
            <View style={styles.stepBody}>
              <TextInput
                accessibilityLabel="Care note"
                multiline
                onChangeText={(careNote) =>
                  setDraft((d) => ({ ...d, careNote }))
                }
                placeholder="Routines, comfort tips, handoff notes…"
                placeholderTextColor={SitGuruColors.textSoft}
                style={[styles.input, styles.noteInput]}
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
          onPress={startWizard}
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
        Passports save to your SitGuru account — Gurus see routines and vaccine
        scans before care starts.
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
            Start the wizard to add name, size, vaccine scan, and a short care
            note.
          </Text>
        </View>
      ) : (
        pets.map((pet) => (
          <View key={pet.id} style={styles.petCard}>
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
                  {[pet.species, pet.size, pet.breed].filter(Boolean).join(' · ')}
                </Text>
                <Text style={styles.petMeta} numberOfLines={2}>
                  {pet.care_instructions || pet.notes || 'Care notes ready'}
                </Text>
                {pet.photo_url ? (
                  <Text style={styles.badge}>Vaccine scan attached</Text>
                ) : null}
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/request-booking',
                  params: { petId: pet.id, petName: pet.name },
                })
              }
              style={styles.secondaryLink}
            >
              <Text style={styles.secondaryLinkText}>Request Care</Text>
            </Pressable>
          </View>
        ))
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
  secondaryLink: {
    alignItems: 'center',
    backgroundColor: SitGuruColors.surfaceSoft,
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: TOUCH_MIN,
  },
  secondaryLinkText: {
    color: SitGuruColors.primary,
    fontFamily: AppFonts.extraBold,
    fontSize: MobileType.label,
  },
  stepBody: {
    gap: MobileSpace.md,
    width: '100%',
  },
  input: {
    backgroundColor: SitGuruColors.background,
    borderColor: SitGuruColors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: SitGuruColors.text,
    fontFamily: AppFonts.medium,
    fontSize: MobileType.body,
    minHeight: TOUCH_MIN + 6,
    paddingHorizontal: MobileSpace.md,
  },
  noteInput: {
    minHeight: 140,
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
});
