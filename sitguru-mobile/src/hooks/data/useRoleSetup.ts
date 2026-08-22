import { useCallback, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import {
  asBoolean,
  asNumber,
  asString,
  firstString,
  getErrorMessage,
  withMissingColumnRetry,
  type RecordRow,
} from '@/lib/data/fields';
import {
  buildCanonicalPetWritePayload,
  normalizeCanonicalPet,
  type CanonicalPet,
} from '@/lib/data/pets';
import { PET_OWNER_ID_FIELDS, TABLES } from '@/lib/data/schema';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type SetupSaveResult = {
  persisted: boolean;
  error: string | null;
};

export type GuruSetupDraft = {
  displayName: string;
  email: string;
  phone: string;
  yearsExperience: string;
  bio: string;
  serviceArea: string;
  serviceAreaEnabled: boolean;
  serviceCity: string;
  serviceState: string;
  serviceZip: string;
  serviceAreaNotes: string;
  selectedServices: string[];
  selectedPetTypes: string[];
  walkingRate: string;
  sittingRate: string;
  boardingRate: string;
  dropInRate: string;
  serviceNotes: string;
  selectedTrustItems: string[];
  trustNotes: string;
  selectedOnboardingItems: string[];
};

export type PetParentPetDraft = {
  id: string;
  name: string;
  type: 'Dog' | 'Cat' | 'Other';
  breed: string;
  age: string;
  size: string;
  notes: string;
};

export type PetParentSetupDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  locationNotes: string;
  pets: PetParentPetDraft[];
  feedingRoutine: string;
  walkRoutine: string;
  medicationNotes: string;
  behaviorNotes: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelationship: string;
  veterinarian: string;
  emergencyNotes: string;
  notifyMessages: boolean;
  notifyBookings: boolean;
  notifyPawReport: boolean;
  notifyPawPerks: boolean;
};

export type AmbassadorSetupDraft = {
  displayName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  outreachArea: string;
  communityNotes: string;
  referralCode: string;
  selectedReferralTypes: string[];
  referralNotes: string;
  selectedPacketItems: string[];
  legalName: string;
  packetNotes: string;
  selectedTrainingItems: string[];
};

const GURU_TABLES = ['gurus', 'guru_profiles'] as const;
const GURU_OWNER_FIELDS = ['user_id', 'profile_id', 'owner_id'] as const;

const PROFILE_TABLES = [
  'profiles',
  'pet_parents',
  'customer_profiles',
] as const;
const PROFILE_OWNER_FIELDS = ['id', 'user_id'] as const;

const AMBASSADOR_TABLES = ['ambassadors'] as const;
const AMBASSADOR_OWNER_FIELDS = ['user_id', 'profile_id'] as const;

const GURU_SERVICE_KEYS: Record<string, string> = {
  'Dog Walking': 'dog_walking',
  'Pet Sitting': 'pet_sitting',
  Boarding: 'boarding',
  'Doggy Day Care': 'doggy_day_care',
  'Drop-In Visits': 'drop_in_visits',
  'House Sitting': 'house_sitting',
  'Training Support': 'training_support',
  'Medication Help': 'medication_help',
  'Custom Care': 'custom_care',
};

const GURU_RATE_UNITS: Record<string, string> = {
  dog_walking: 'walk',
  pet_sitting: 'visit',
  boarding: 'night',
  drop_in_visits: 'visit',
};

type PersistTarget = {
  tables: readonly string[];
  ownerFields: readonly string[];
};

export function emptyGuruSetupDraft(): GuruSetupDraft {
  return {
    displayName: '',
    email: '',
    phone: '',
    yearsExperience: '',
    bio: '',
    serviceArea: '',
    serviceAreaEnabled: true,
    serviceCity: '',
    serviceState: '',
    serviceZip: '',
    serviceAreaNotes: '',
    selectedServices: [],
    selectedPetTypes: [],
    walkingRate: '',
    sittingRate: '',
    boardingRate: '',
    dropInRate: '',
    serviceNotes: '',
    selectedTrustItems: [],
    trustNotes: '',
    selectedOnboardingItems: [],
  };
}

export function emptyPetParentSetupDraft(): PetParentSetupDraft {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    locationNotes: '',
    pets: [],
    feedingRoutine: '',
    walkRoutine: '',
    medicationNotes: '',
    behaviorNotes: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    veterinarian: '',
    emergencyNotes: '',
    notifyMessages: true,
    notifyBookings: true,
    notifyPawReport: true,
    notifyPawPerks: true,
  };
}

export function emptyAmbassadorSetupDraft(): AmbassadorSetupDraft {
  return {
    displayName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    outreachArea: '',
    communityNotes: '',
    referralCode: '',
    selectedReferralTypes: [
      'Pet Parent referral link',
      'Guru referral link',
    ],
    referralNotes: '',
    selectedPacketItems: [],
    legalName: '',
    packetNotes: '',
    selectedTrainingItems: [],
  };
}

export function useGuruSetup() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (): Promise<{
    draft: GuruSetupDraft;
    step: number;
    error: string | null;
  }> => {
    const draft = emptyGuruSetupDraft();
    draft.displayName = profileName(profile, user?.email);
    draft.email = asString(profile?.email) || asString(user?.email);
    draft.phone = firstString((profile ?? {}) as RecordRow, [
      'phone',
      'phone_number',
    ]);

    if (!user?.id || !isSupabaseConfigured) {
      setLoading(false);
      return {
        draft,
        step: 1,
        error: user?.id
          ? 'Supabase is not configured in this build, so Guru setup cannot be saved.'
          : 'Sign in to save Guru setup.',
      };
    }

    setLoading(true);

    try {
      const guru = await loadOwnedRow(
        { tables: GURU_TABLES, ownerFields: GURU_OWNER_FIELDS },
        user.id,
      );
      const profileRow = await loadOwnedRow(
        { tables: ['profiles'], ownerFields: PROFILE_OWNER_FIELDS },
        user.id,
      );

      applyGuruRow(draft, guru);
      applyGuruRow(draft, profileRow);

      if (guru?.id) {
        await hydrateGuruRates(String(guru.id), draft);
      }

      setLoading(false);
      return {
        draft,
        step: inferGuruStep(draft, guru, profileRow),
        error: null,
      };
    } catch (error) {
      setLoading(false);
      return {
        draft,
        step: 1,
        error: getErrorMessage(
          error,
          'Guru setup could not be loaded. Pull down or reopen this screen to try again.',
        ),
      };
    }
  }, [profile, user]);

  const save = useCallback(
    async (
      draft: GuruSetupDraft,
      nextStep: number,
      options?: { complete?: boolean },
    ): Promise<SetupSaveResult> => {
      if (!user?.id) {
        return { persisted: false, error: 'Sign in to save Guru setup.' };
      }

      if (!isSupabaseConfigured) {
        return {
          persisted: false,
          error:
            'Supabase is not configured in this build. Guru setup was not saved.',
        };
      }

      setSaving(true);

      try {
        const now = new Date().toISOString();
        const complete = Boolean(options?.complete);
        const experience = parseLooseNumber(draft.yearsExperience);
        const walkingRate = parseLooseNumber(draft.walkingRate);
        const displayName = draft.displayName.trim();
        const city = draft.serviceCity.trim();
        const state = draft.serviceState.trim();
        const zip = draft.serviceZip.trim();
        const serviceArea =
          draft.serviceArea.trim() ||
          [city, state, zip].filter(Boolean).join(', ');

        const guruPayload: RecordRow = {
          user_id: user.id,
          display_name: emptyToNull(displayName),
          full_name: emptyToNull(displayName),
          name: emptyToNull(displayName),
          email: emptyToNull(draft.email),
          contact_email: emptyToNull(draft.email),
          phone: emptyToNull(draft.phone),
          bio: emptyToNull(draft.bio),
          about: emptyToNull(draft.bio),
          years_experience: experience,
          experience_years: experience,
          service_area: emptyToNull(serviceArea),
          city: emptyToNull(city),
          state: emptyToNull(state),
          zip_code: emptyToNull(zip),
          postal_code: emptyToNull(zip),
          service_city: emptyToNull(city),
          service_state: emptyToNull(state),
          service_zip: emptyToNull(zip),
          service_zip_code: emptyToNull(zip),
          availability_notes: emptyToNull(draft.serviceAreaNotes),
          availability_enabled: draft.serviceAreaEnabled,
          booking_status: draft.serviceAreaEnabled
            ? 'listed_only'
            : 'not_listed',
          services: draft.selectedServices,
          hourly_rate: walkingRate,
          rate: walkingRate,
          notes: emptyToNull(
            [draft.serviceNotes, draft.trustNotes]
              .map((value) => value.trim())
              .filter(Boolean)
              .join('\n\n'),
          ),
          onboarding_completed:
            complete || draft.selectedOnboardingItems.length >= 5,
          profile_completed: complete,
          onboarding_step: nextStep,
          updated_at: now,
        };

        const saved = await persistOwnedRow(
          { tables: GURU_TABLES, ownerFields: GURU_OWNER_FIELDS },
          user.id,
          guruPayload,
        );

        if (!saved.persisted) {
          setSaving(false);
          return saved;
        }

        await persistOwnedRow(
          { tables: ['profiles'], ownerFields: PROFILE_OWNER_FIELDS },
          user.id,
          {
            id: user.id,
            user_id: user.id,
            display_name: emptyToNull(displayName),
            full_name: emptyToNull(displayName),
            email: emptyToNull(draft.email),
            phone: emptyToNull(draft.phone),
            city: emptyToNull(city),
            state: emptyToNull(state),
            zip_code: emptyToNull(zip),
            service_city: emptyToNull(city),
            service_state: emptyToNull(state),
            service_zip: emptyToNull(zip),
            service_area: emptyToNull(serviceArea),
            updated_at: now,
          },
        );

        const guruId = asString(saved.row?.id);
        if (guruId) {
          await persistGuruServiceRates(guruId, draft);
        }

        setSaving(false);
        return { persisted: true, error: null };
      } catch (error) {
        setSaving(false);
        return {
          persisted: false,
          error: getErrorMessage(error, 'Guru setup was not saved.'),
        };
      }
    },
    [user],
  );

  return { loading, saving, load, save };
}

export function usePetParentSetup() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (): Promise<{
    draft: PetParentSetupDraft;
    step: number;
    error: string | null;
  }> => {
    const draft = emptyPetParentSetupDraft();
    const fullName = profileName(profile, user?.email);
    const [first, ...rest] = fullName.split(/\s+/).filter(Boolean);
    draft.firstName = asString(profile?.first_name) || first || '';
    draft.lastName = asString(profile?.last_name) || rest.join(' ');
    draft.email = asString(profile?.email) || asString(user?.email);
    draft.phone = firstString((profile ?? {}) as RecordRow, [
      'phone',
      'phone_number',
    ]);

    if (!user?.id || !isSupabaseConfigured) {
      setLoading(false);
      return {
        draft,
        step: 1,
        error: user?.id
          ? 'Supabase is not configured in this build, so Pet Parent setup cannot be saved.'
          : 'Sign in to save Pet Parent setup.',
      };
    }

    setLoading(true);

    try {
      const row = await loadOwnedRow(
        { tables: PROFILE_TABLES, ownerFields: PROFILE_OWNER_FIELDS },
        user.id,
      );
      applyPetParentRow(draft, row);

      const pets = await loadOwnedPets(user.id);
      if (pets.length) {
        draft.pets = pets.map(petFromCanonical);
        const primary = pets[0];
        draft.feedingRoutine =
          draft.feedingRoutine || asString(primary.feeding_routine);
        draft.walkRoutine =
          draft.walkRoutine ||
          [primary.potty_routine, primary.walking_instructions]
            .filter(Boolean)
            .join('\n');
        draft.medicationNotes =
          draft.medicationNotes ||
          [primary.medical_notes, primary.allergies]
            .filter(Boolean)
            .join('\n');
        draft.behaviorNotes =
          draft.behaviorNotes ||
          [primary.temperament, primary.personality, primary.notes]
            .filter(Boolean)
            .join('\n');
        if (!draft.emergencyName) {
          draft.emergencyName = asString(primary.emergency_contact_name);
        }
        if (!draft.emergencyPhone) {
          draft.emergencyPhone = asString(primary.emergency_contact_phone);
        }
        if (!draft.veterinarian) {
          draft.veterinarian = asString(primary.vet_name);
        }
      }

      setLoading(false);
      return {
        draft,
        step: inferPetParentStep(draft, row),
        error: null,
      };
    } catch (error) {
      setLoading(false);
      return {
        draft,
        step: 1,
        error: getErrorMessage(
          error,
          'Pet Parent setup could not be loaded. Reopen this screen to try again.',
        ),
      };
    }
  }, [profile, user]);

  const save = useCallback(
    async (
      draft: PetParentSetupDraft,
      nextStep: number,
      options?: { complete?: boolean },
    ): Promise<SetupSaveResult> => {
      if (!user?.id) {
        return {
          persisted: false,
          error: 'Sign in to save Pet Parent setup.',
        };
      }

      if (!isSupabaseConfigured) {
        return {
          persisted: false,
          error:
            'Supabase is not configured in this build. Pet Parent setup was not saved.',
        };
      }

      setSaving(true);

      try {
        const now = new Date().toISOString();
        const firstName = draft.firstName.trim();
        const lastName = draft.lastName.trim();
        const fullName = [firstName, lastName].filter(Boolean).join(' ');
        const city = draft.city.trim();
        const state = draft.state.trim();
        const zip = draft.zipCode.trim();
        const street = draft.streetAddress.trim();
        const careNotes = [
          draft.feedingRoutine,
          draft.walkRoutine,
          draft.medicationNotes,
          draft.behaviorNotes,
          draft.locationNotes,
        ]
          .map((value) => value.trim())
          .filter(Boolean)
          .join('\n\n');

        const profilePayload: RecordRow = {
          id: user.id,
          user_id: user.id,
          first_name: emptyToNull(firstName),
          last_name: emptyToNull(lastName),
          full_name: emptyToNull(fullName),
          display_name: emptyToNull(fullName),
          name: emptyToNull(fullName),
          email: emptyToNull(draft.email),
          phone: emptyToNull(draft.phone),
          phone_number: emptyToNull(draft.phone),
          street_address: emptyToNull(street),
          address: emptyToNull(street),
          service_address: emptyToNull(street),
          home_address: emptyToNull(street),
          city: emptyToNull(city),
          state: emptyToNull(state),
          zip_code: emptyToNull(zip),
          zip: emptyToNull(zip),
          postal_code: emptyToNull(zip),
          service_city: emptyToNull(city),
          service_state: emptyToNull(state),
          service_zip: emptyToNull(zip),
          notes: emptyToNull(draft.locationNotes),
          care_notes: emptyToNull(careNotes),
          care_preferences: emptyToNull(careNotes),
          emergency_contact: emptyToNull(
            [draft.emergencyName, draft.emergencyPhone]
              .map((value) => value.trim())
              .filter(Boolean)
              .join(' — '),
          ),
          emergency_contact_name: emptyToNull(draft.emergencyName),
          emergency_contact_phone: emptyToNull(draft.emergencyPhone),
          emergency_contact_relationship: emptyToNull(
            draft.emergencyRelationship,
          ),
          emergency_vet_name: emptyToNull(draft.veterinarian),
          emergency_notes: emptyToNull(draft.emergencyNotes),
          email_notifications: draft.notifyMessages,
          push_notifications: draft.notifyBookings || draft.notifyPawReport,
          text_notifications: draft.notifyBookings,
          live_walk_updates: draft.notifyPawReport,
          chat_media_activity: draft.notifyMessages,
          financial_transactions: draft.notifyPawPerks,
          message_alerts: draft.notifyMessages,
          booking_alerts: draft.notifyBookings,
          pawreport_alerts: draft.notifyPawReport,
          referral_alerts: draft.notifyPawPerks,
          onboarding_step: nextStep,
          profile_completed: Boolean(options?.complete),
          updated_at: now,
        };

        const saved = await persistOwnedRow(
          { tables: PROFILE_TABLES, ownerFields: PROFILE_OWNER_FIELDS },
          user.id,
          profilePayload,
        );

        if (!saved.persisted) {
          setSaving(false);
          return saved;
        }

        const namedPets = draft.pets.filter((pet) => pet.name.trim());
        for (const pet of namedPets) {
          const result = await saveSetupPet(user.id, draft, pet);
          if (result.error) {
            setSaving(false);
            return { persisted: false, error: result.error };
          }
          if (result.id) pet.id = result.id;
        }

        await persistOwnedRow(
          {
            tables: [
              'notification_preferences',
              'user_notification_preferences',
            ],
            ownerFields: ['user_id'],
          },
          user.id,
          {
            user_id: user.id,
            live_walk_updates: draft.notifyPawReport,
            chat_media_activity: draft.notifyMessages,
            financial_transactions: draft.notifyPawPerks,
            pawreport_alerts: draft.notifyPawReport,
            message_alerts: draft.notifyMessages,
            booking_alerts: draft.notifyBookings,
            referral_alerts: draft.notifyPawPerks,
            updated_at: now,
          },
        );

        setSaving(false);
        return { persisted: true, error: null };
      } catch (error) {
        setSaving(false);
        return {
          persisted: false,
          error: getErrorMessage(error, 'Pet Parent setup was not saved.'),
        };
      }
    },
    [user],
  );

  return { loading, saving, load, save };
}

export function useAmbassadorSetup() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (): Promise<{
    draft: AmbassadorSetupDraft;
    step: number;
    error: string | null;
  }> => {
    const draft = emptyAmbassadorSetupDraft();
    draft.displayName = profileName(profile, user?.email);
    draft.email = asString(profile?.email) || asString(user?.email);
    draft.phone = firstString((profile ?? {}) as RecordRow, [
      'phone',
      'phone_number',
    ]);

    if (!user?.id || !isSupabaseConfigured) {
      setLoading(false);
      return {
        draft,
        step: 1,
        error: user?.id
          ? 'Supabase is not configured in this build, so Ambassador setup cannot be saved.'
          : 'Sign in to save Ambassador setup.',
      };
    }

    setLoading(true);

    try {
      const ambassador = await loadOwnedRow(
        { tables: AMBASSADOR_TABLES, ownerFields: AMBASSADOR_OWNER_FIELDS },
        user.id,
      );
      const profileRow = await loadOwnedRow(
        { tables: ['profiles'], ownerFields: PROFILE_OWNER_FIELDS },
        user.id,
      );

      applyAmbassadorRow(draft, ambassador);
      applyAmbassadorRow(draft, profileRow);

      setLoading(false);
      return {
        draft,
        step: inferAmbassadorStep(draft, ambassador),
        error: null,
      };
    } catch (error) {
      setLoading(false);
      return {
        draft,
        step: 1,
        error: getErrorMessage(
          error,
          'Ambassador setup could not be loaded. Reopen this screen to try again.',
        ),
      };
    }
  }, [profile, user]);

  const save = useCallback(
    async (
      draft: AmbassadorSetupDraft,
      nextStep: number,
      options?: { complete?: boolean },
    ): Promise<SetupSaveResult> => {
      if (!user?.id) {
        return {
          persisted: false,
          error: 'Sign in to save Ambassador setup.',
        };
      }

      if (!isSupabaseConfigured) {
        return {
          persisted: false,
          error:
            'Supabase is not configured in this build. Ambassador setup was not saved.',
        };
      }

      setSaving(true);

      try {
        const now = new Date().toISOString();
        const complete = Boolean(options?.complete);
        const displayName = draft.displayName.trim();
        const trainingCount = draft.selectedTrainingItems.length;
        const packetComplete = draft.selectedPacketItems.length >= 4;
        const trainingComplete = trainingCount >= 5;
        const notes = [
          draft.communityNotes,
          draft.referralNotes,
          draft.packetNotes,
        ]
          .map((value) => value.trim())
          .filter(Boolean)
          .join('\n\n');

        const payload: RecordRow = {
          user_id: user.id,
          display_name: emptyToNull(displayName),
          full_name: emptyToNull(displayName),
          email: emptyToNull(draft.email),
          contact_email: emptyToNull(draft.email),
          login_email: emptyToNull(draft.email),
          phone: emptyToNull(draft.phone),
          city: emptyToNull(draft.city),
          state: emptyToNull(draft.state),
          service_area: emptyToNull(draft.outreachArea),
          notes: emptyToNull(notes),
          onboarding_step: nextStep,
          onboarding_status: packetComplete ? 'completed' : 'started',
          training_status: trainingComplete
            ? 'completed'
            : trainingCount
              ? 'in_progress'
              : 'not_started',
          training_percent: Math.round((trainingCount / 5) * 100),
          certification_name: emptyToNull(draft.legalName),
          updated_at: now,
          ...(complete || packetComplete
            ? { onboarding_completed_at: now }
            : {}),
          ...(trainingComplete ? { training_completed_at: now } : {}),
        };

        const saved = await persistOwnedRow(
          {
            tables: AMBASSADOR_TABLES,
            ownerFields: AMBASSADOR_OWNER_FIELDS,
          },
          user.id,
          payload,
        );

        if (!saved.persisted) {
          setSaving(false);
          return saved;
        }

        await persistOwnedRow(
          { tables: ['profiles'], ownerFields: PROFILE_OWNER_FIELDS },
          user.id,
          {
            id: user.id,
            user_id: user.id,
            display_name: emptyToNull(displayName),
            full_name: emptyToNull(displayName),
            email: emptyToNull(draft.email),
            phone: emptyToNull(draft.phone),
            city: emptyToNull(draft.city),
            state: emptyToNull(draft.state),
            service_area: emptyToNull(draft.outreachArea),
            updated_at: now,
          },
        );

        setSaving(false);
        return { persisted: true, error: null };
      } catch (error) {
        setSaving(false);
        return {
          persisted: false,
          error: getErrorMessage(error, 'Ambassador setup was not saved.'),
        };
      }
    },
    [user],
  );

  return { loading, saving, load, save };
}

async function loadOwnedRow(
  target: PersistTarget,
  userId: string,
): Promise<RecordRow | null> {
  for (const table of target.tables) {
    for (const ownerField of target.ownerFields) {
      const result = await supabase
        .from(table)
        .select('*')
        .eq(ownerField, userId)
        .limit(1);

      if (!result.error && result.data?.length) {
        return result.data[0] as RecordRow;
      }
    }
  }

  return null;
}

async function persistOwnedRow(
  target: PersistTarget,
  userId: string,
  payload: RecordRow,
): Promise<SetupSaveResult & { row: RecordRow | null }> {
  let lastError: string | null = null;

  for (const table of target.tables) {
    for (const ownerField of target.ownerFields) {
      const body = {
        ...payload,
        [ownerField]: userId,
        user_id: payload.user_id ?? userId,
      };

      const updated = await withMissingColumnRetry(async (next) => {
        const response = await supabase
          .from(table)
          .update(next)
          .eq(ownerField, userId)
          .select('*')
          .limit(1);
        return { data: response.data?.[0] ?? null, error: response.error };
      }, body);

      if (!updated.error && updated.data) {
        return {
          persisted: true,
          error: null,
          row: updated.data as RecordRow,
        };
      }

      if (updated.error) lastError = updated.error;

      const inserted = await withMissingColumnRetry(async (next) => {
        const response = await supabase
          .from(table)
          .insert(next)
          .select('*')
          .limit(1);
        return { data: response.data?.[0] ?? null, error: response.error };
      }, body);

      if (!inserted.error) {
        return {
          persisted: true,
          error: null,
          row: (inserted.data as RecordRow | null) ?? body,
        };
      }

      lastError = inserted.error;
    }
  }

  return {
    persisted: false,
    error:
      lastError ||
      'No compatible setup table accepted this save. Your changes were not stored.',
    row: null,
  };
}

async function loadOwnedPets(userId: string): Promise<CanonicalPet[]> {
  for (const ownerField of PET_OWNER_ID_FIELDS) {
    const result = await supabase
      .from(TABLES.pets)
      .select('*')
      .eq(ownerField, userId);

    if (result.error) continue;

    return (result.data ?? [])
      .map((row) => normalizeCanonicalPet(row as RecordRow))
      .filter((pet): pet is CanonicalPet => Boolean(pet));
  }

  return [];
}

async function saveSetupPet(
  userId: string,
  draft: PetParentSetupDraft,
  pet: PetParentPetDraft,
): Promise<{ id: string | null; error: string | null }> {
  const species =
    pet.type === 'Dog' ? 'Dog' : pet.type === 'Cat' ? 'Cat' : 'Other';
  const payload = buildCanonicalPetWritePayload(
    {
      name: pet.name,
      species,
      breed: pet.breed,
      age: pet.age,
      size: pet.size,
      weight: '',
      photo_url: '',
      video_url: '',
      personality: draft.behaviorNotes,
      temperament: draft.behaviorNotes,
      energy_level: '',
      good_with_people: '',
      good_with_pets: '',
      separation_anxiety: '',
      triggers: '',
      feeding_routine: draft.feedingRoutine,
      potty_routine: draft.walkRoutine,
      walking_instructions: draft.walkRoutine,
      sleeping_location: '',
      crate_trained: '',
      favorite_things: '',
      medical_notes: draft.medicationNotes,
      allergies: draft.medicationNotes,
      medical_conditions: '',
      vet_name: draft.veterinarian,
      vet_phone: '',
      emergency_contact_name: draft.emergencyName,
      emergency_contact_phone: draft.emergencyPhone,
      supplies_location: '',
      entry_notes: draft.locationNotes,
      restricted_areas: '',
      safety_notes: '',
      bite_history: '',
      escape_risk: '',
      booking_notes: '',
      care_instructions: [
        draft.feedingRoutine,
        draft.walkRoutine,
        draft.medicationNotes,
        draft.behaviorNotes,
      ]
        .map((value) => value.trim())
        .filter(Boolean)
        .join('\n\n'),
      story: '',
      notes: pet.notes,
    },
    userId,
  );

  const existingId = isUuid(pet.id) ? pet.id : '';

  const result = existingId
    ? await withMissingColumnRetry(async (body) => {
        const response = await supabase
          .from(TABLES.pets)
          .update(body)
          .eq('id', existingId)
          .select('id')
          .maybeSingle();
        return { data: response.data, error: response.error };
      }, payload)
    : await withMissingColumnRetry(async (body) => {
        const response = await supabase
          .from(TABLES.pets)
          .insert(body)
          .select('id')
          .maybeSingle();
        return { data: response.data, error: response.error };
      }, payload);

  if (result.error) {
    return { id: existingId || null, error: result.error };
  }

  return {
    id: asString((result.data as RecordRow | null)?.id) || existingId || null,
    error: null,
  };
}

async function hydrateGuruRates(guruId: string, draft: GuruSetupDraft) {
  const result = await supabase
    .from(TABLES.guruServiceRates)
    .select('*')
    .eq('guru_id', guruId);

  if (result.error || !result.data?.length) return;

  for (const row of result.data as RecordRow[]) {
    const key = asString(row.service_key);
    const amount = asString(row.rate_amount) || asString(row.rate);
    if (!amount) continue;
    if (key === 'dog_walking') draft.walkingRate = amount;
    if (key === 'pet_sitting') draft.sittingRate = amount;
    if (key === 'boarding') draft.boardingRate = amount;
    if (key === 'drop_in_visits') draft.dropInRate = amount;
  }
}

async function persistGuruServiceRates(
  guruId: string,
  draft: GuruSetupDraft,
) {
  const now = new Date().toISOString();
  const rows = [
    {
      key: 'dog_walking',
      label: 'Dog Walking',
      amount: parseLooseNumber(draft.walkingRate),
      unit: GURU_RATE_UNITS.dog_walking,
    },
    {
      key: 'pet_sitting',
      label: 'Pet Sitting',
      amount: parseLooseNumber(draft.sittingRate),
      unit: GURU_RATE_UNITS.pet_sitting,
    },
    {
      key: 'boarding',
      label: 'Boarding',
      amount: parseLooseNumber(draft.boardingRate),
      unit: GURU_RATE_UNITS.boarding,
    },
    {
      key: 'drop_in_visits',
      label: 'Drop-In Visits',
      amount: parseLooseNumber(draft.dropInRate),
      unit: GURU_RATE_UNITS.drop_in_visits,
    },
  ].filter(
    (row) =>
      row.amount != null ||
      draft.selectedServices.includes(row.label),
  );

  const extraServices = draft.selectedServices
    .map((label) => ({
      key: GURU_SERVICE_KEYS[label],
      label,
    }))
    .filter(
      (row): row is { key: string; label: string } =>
        Boolean(row.key) &&
        !rows.some((existing) => existing.key === row.key),
    );

  if (!rows.length && !extraServices.length) return;

  const payload = [
    ...rows.map((row) => ({
      guru_id: guruId,
      service_key: row.key,
      service_label: row.label,
      is_enabled: draft.selectedServices.includes(row.label),
      rate_amount: row.amount,
      rate_unit: row.unit,
      notes: emptyToNull(draft.serviceNotes),
      updated_at: now,
    })),
    ...extraServices.map((row) => ({
      guru_id: guruId,
      service_key: row.key,
      service_label: row.label,
      is_enabled: true,
      rate_amount: null as number | null,
      rate_unit: 'custom',
      notes: emptyToNull(draft.serviceNotes),
      updated_at: now,
    })),
  ];

  const upserted = await supabase
    .from(TABLES.guruServiceRates)
    .upsert(payload, { onConflict: 'guru_id,service_key' });

  if (!upserted.error) return;

  await withMissingColumnRetry(async (body) => {
    const response = await supabase.from(TABLES.guruServiceRates).insert(body);
    return { data: response.data, error: response.error };
  }, payload[0] ?? {});
}

function applyGuruRow(draft: GuruSetupDraft, row: RecordRow | null) {
  if (!row) return;

  draft.displayName =
    firstString(row, ['display_name', 'full_name', 'name']) ||
    draft.displayName;
  draft.email =
    firstString(row, ['email', 'contact_email', 'login_email']) ||
    draft.email;
  draft.phone = firstString(row, ['phone', 'phone_number']) || draft.phone;
  draft.yearsExperience =
    firstString(row, ['years_experience', 'experience_years']) ||
    draft.yearsExperience;
  draft.bio = firstString(row, ['bio', 'about', 'description']) || draft.bio;
  draft.serviceArea =
    firstString(row, ['service_area', 'location']) || draft.serviceArea;
  draft.serviceCity =
    firstString(row, ['service_city', 'city']) || draft.serviceCity;
  draft.serviceState =
    firstString(row, ['service_state', 'state', 'region']) ||
    draft.serviceState;
  draft.serviceZip =
    firstString(row, [
      'service_zip',
      'service_zip_code',
      'zip_code',
      'postal_code',
      'zip',
    ]) || draft.serviceZip;
  draft.serviceAreaNotes =
    firstString(row, ['availability_notes']) || draft.serviceAreaNotes;
  const availability = asBoolean(row.availability_enabled);
  if (availability != null) {
    draft.serviceAreaEnabled = availability;
  } else if (
    firstString(row, ['booking_status']).toLowerCase() === 'not_listed'
  ) {
    draft.serviceAreaEnabled = false;
  }
  draft.selectedServices = uniqueStrings([
    ...draft.selectedServices,
    ...asStringArray(row.services),
    ...asStringArray(row.service_types),
    ...asStringArray(row.services_offered),
  ]);
  draft.walkingRate =
    firstString(row, ['hourly_rate', 'rate', 'base_rate']) ||
    draft.walkingRate;
  const notes = firstString(row, ['notes']);
  if (notes && !draft.trustNotes) draft.trustNotes = notes;
  if (notes && !draft.serviceNotes && !draft.trustNotes) {
    draft.serviceNotes = notes;
  }
  if (asBoolean(row.onboarding_completed)) {
    draft.selectedOnboardingItems = [
      'Review SitGuru care standards',
      'Understand booking request flow',
      'Learn PawReport™ visit updates',
      'Review communication expectations',
      'Prepare profile for SitGuru review',
    ];
  }
}

function applyPetParentRow(
  draft: PetParentSetupDraft,
  row: RecordRow | null,
) {
  if (!row) return;

  draft.firstName =
    firstString(row, ['first_name']) || draft.firstName;
  draft.lastName = firstString(row, ['last_name']) || draft.lastName;
  if (!draft.firstName || !draft.lastName) {
    const fullName = firstString(row, ['full_name', 'display_name', 'name']);
    if (fullName) {
      const [first, ...rest] = fullName.split(/\s+/).filter(Boolean);
      draft.firstName = draft.firstName || first || '';
      draft.lastName = draft.lastName || rest.join(' ');
    }
  }
  draft.email =
    firstString(row, ['email', 'contact_email']) || draft.email;
  draft.phone =
    firstString(row, ['phone', 'phone_number']) || draft.phone;
  draft.streetAddress =
    firstString(row, [
      'street_address',
      'service_address',
      'home_address',
      'address',
    ]) || draft.streetAddress;
  draft.city =
    firstString(row, ['service_city', 'city', 'home_city']) || draft.city;
  draft.state =
    firstString(row, ['service_state', 'state', 'home_state']) ||
    draft.state;
  draft.zipCode =
    firstString(row, [
      'service_zip',
      'zip_code',
      'zip',
      'postal_code',
      'zipcode',
    ]) || draft.zipCode;
  draft.locationNotes =
    firstString(row, ['notes', 'entry_notes']) || draft.locationNotes;
  draft.feedingRoutine =
    firstString(row, ['feeding_routine']) || draft.feedingRoutine;
  draft.walkRoutine =
    firstString(row, ['potty_routine', 'walking_instructions']) ||
    draft.walkRoutine;
  draft.medicationNotes =
    firstString(row, ['care_notes', 'care_preferences', 'medical_notes']) ||
    draft.medicationNotes;
  draft.behaviorNotes =
    firstString(row, ['care_preferences']) || draft.behaviorNotes;
  draft.emergencyName =
    firstString(row, ['emergency_contact_name', 'emergency_contact']) ||
    draft.emergencyName;
  draft.emergencyPhone =
    firstString(row, ['emergency_contact_phone']) || draft.emergencyPhone;
  draft.emergencyRelationship =
    firstString(row, ['emergency_contact_relationship']) ||
    draft.emergencyRelationship;
  draft.veterinarian =
    firstString(row, ['emergency_vet_name', 'vet_name']) ||
    draft.veterinarian;
  draft.emergencyNotes =
    firstString(row, ['emergency_notes']) || draft.emergencyNotes;
  draft.notifyMessages =
    asBoolean(row.email_notifications) ??
    asBoolean(row.chat_media_activity) ??
    asBoolean(row.message_alerts) ??
    draft.notifyMessages;
  draft.notifyBookings =
    asBoolean(row.push_notifications) ??
    asBoolean(row.booking_alerts) ??
    draft.notifyBookings;
  draft.notifyPawReport =
    asBoolean(row.live_walk_updates) ??
    asBoolean(row.pawreport_alerts) ??
    draft.notifyPawReport;
  draft.notifyPawPerks =
    asBoolean(row.financial_transactions) ??
    asBoolean(row.referral_alerts) ??
    draft.notifyPawPerks;
}

function applyAmbassadorRow(
  draft: AmbassadorSetupDraft,
  row: RecordRow | null,
) {
  if (!row) return;

  draft.displayName =
    firstString(row, ['display_name', 'full_name', 'name']) ||
    draft.displayName;
  draft.email =
    firstString(row, ['email', 'contact_email', 'login_email']) ||
    draft.email;
  draft.phone = firstString(row, ['phone', 'phone_number']) || draft.phone;
  draft.city = firstString(row, ['city', 'service_city']) || draft.city;
  draft.state =
    firstString(row, ['state', 'service_state']) || draft.state;
  draft.outreachArea =
    firstString(row, ['service_area']) || draft.outreachArea;
  draft.communityNotes = firstString(row, ['notes']) || draft.communityNotes;
  draft.referralCode =
    firstString(row, ['referral_code']) || draft.referralCode;
  draft.legalName =
    firstString(row, ['certification_name', 'full_name']) || draft.legalName;

  const onboardingStatus = firstString(row, ['onboarding_status']).toLowerCase();
  if (onboardingStatus === 'completed' || onboardingStatus === 'complete') {
    draft.selectedPacketItems = [
      'I understand SitGuru Ambassadors are generally referral and community based.',
      'I will use approved SitGuru messaging when sharing with others.',
      'I understand rewards depend on verified activity and SitGuru review.',
      'I will represent SitGuru professionally in local and online conversations.',
    ];
  }

  const trainingStatus = firstString(row, ['training_status']).toLowerCase();
  const trainingPercent = asNumber(row.training_percent, 0);
  if (
    trainingStatus === 'completed' ||
    trainingStatus === 'complete' ||
    trainingPercent >= 100
  ) {
    draft.selectedTrainingItems = [
      'Review the SitGuru story',
      'Review Ambassador basics',
      'Review referral talking points',
      'Review community outreach guidance',
      'Complete Ambassador certification',
    ];
  }
}

function inferGuruStep(
  draft: GuruSetupDraft,
  guru: RecordRow | null,
  profileRow: RecordRow | null,
) {
  const savedStep = asNumber(
    guru?.onboarding_step ?? profileRow?.onboarding_step,
    0,
  );
  if (savedStep >= 1 && savedStep <= 6) return savedStep;
  if (
    asBoolean(guru?.onboarding_completed) ||
    asBoolean(guru?.profile_completed) ||
    asBoolean(profileRow?.profile_completed)
  ) {
    return 6;
  }
  if (draft.selectedOnboardingItems.length) return 6;
  if (draft.selectedTrustItems.length || draft.trustNotes.trim()) return 5;
  if (
    draft.selectedServices.length ||
    draft.walkingRate.trim() ||
    draft.serviceNotes.trim()
  ) {
    return 4;
  }
  if (
    draft.serviceCity.trim() ||
    draft.serviceZip.trim() ||
    draft.serviceArea.trim()
  ) {
    return 3;
  }
  if (draft.displayName.trim() || draft.bio.trim() || draft.phone.trim()) {
    return 2;
  }
  return 1;
}

function inferPetParentStep(
  draft: PetParentSetupDraft,
  row: RecordRow | null,
) {
  const savedStep = asNumber(row?.onboarding_step, 0);
  if (savedStep >= 1 && savedStep <= 6) return savedStep;
  if (draft.emergencyName.trim() || draft.emergencyPhone.trim()) return 6;
  if (
    draft.feedingRoutine.trim() ||
    draft.walkRoutine.trim() ||
    draft.medicationNotes.trim() ||
    draft.behaviorNotes.trim()
  ) {
    return 5;
  }
  if (draft.pets.some((pet) => pet.name.trim())) return 4;
  if (
    draft.streetAddress.trim() ||
    draft.city.trim() ||
    draft.zipCode.trim()
  ) {
    return 3;
  }
  if (draft.firstName.trim() || draft.phone.trim()) return 2;
  return 1;
}

function inferAmbassadorStep(
  draft: AmbassadorSetupDraft,
  row: RecordRow | null,
) {
  const savedStep = asNumber(row?.onboarding_step, 0);
  if (savedStep >= 1 && savedStep <= 5) return savedStep;
  if (draft.selectedTrainingItems.length) return 5;
  if (draft.selectedPacketItems.length || draft.legalName.trim()) return 4;
  if (draft.referralNotes.trim()) return 3;
  if (
    draft.displayName.trim() ||
    draft.city.trim() ||
    draft.outreachArea.trim()
  ) {
    return 2;
  }
  return 1;
}

function petFromCanonical(pet: CanonicalPet): PetParentPetDraft {
  const species = asString(pet.species).toLowerCase();
  const type: PetParentPetDraft['type'] = species.includes('cat')
    ? 'Cat'
    : species.includes('dog')
      ? 'Dog'
      : 'Other';

  return {
    id: pet.id,
    name: pet.name === 'Unnamed pet' ? '' : pet.name,
    type,
    breed: pet.breed || '',
    age: pet.age || '',
    size: pet.size || '',
    notes: pet.notes || '',
  };
}

function profileName(
  profile:
    | {
        first_name?: string | null;
        last_name?: string | null;
        full_name?: string | null;
      }
    | null
    | undefined,
  email?: string | null,
) {
  const joined = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  return (
    asString(profile?.full_name) ||
    joined ||
    asString(email?.split('@')[0]) ||
    ''
  );
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) return asStringArray(parsed);
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseLooseNumber(value: string): number | null {
  const parsed = Number(value.replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

