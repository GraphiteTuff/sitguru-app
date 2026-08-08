import { useCallback, useEffect, useState } from 'react';

import {
  getErrorMessage,
  withMissingColumnRetry,
  type RecordRow,
} from '@/lib/data/fields';
import {
  buildCanonicalPetWritePayload,
  CANONICAL_PET_SELECT,
  normalizeCanonicalPet,
  type CanonicalPet,
  type CanonicalPetForm,
} from '@/lib/data/pets';
import { PET_OWNER_ID_FIELDS, TABLES } from '@/lib/data/schema';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

async function queryOwnedPets(userId: string): Promise<{
  pets: CanonicalPet[];
  error: string | null;
}> {
  for (const ownerField of PET_OWNER_ID_FIELDS) {
    const result = await supabase
      .from(TABLES.pets)
      .select(CANONICAL_PET_SELECT)
      .eq(ownerField, userId)
      .order('updated_at', { ascending: false });

    if (result.error) {
      // Column may not exist — try next owner field.
      continue;
    }

    const pets = (result.data ?? [])
      .map((row) => normalizeCanonicalPet(row as unknown as RecordRow))
      .filter((pet): pet is CanonicalPet => Boolean(pet));

    return { pets, error: null };
  }

  // Final attempt without ordering if updated_at missing.
  const fallback = await supabase
    .from(TABLES.pets)
    .select(CANONICAL_PET_SELECT)
    .eq('user_id', userId);

  if (fallback.error) {
    return { pets: [], error: getErrorMessage(fallback.error) };
  }

  const pets = (fallback.data ?? [])
    .map((row) => normalizeCanonicalPet(row as unknown as RecordRow))
    .filter((pet): pet is CanonicalPet => Boolean(pet));

  return { pets, error: null };
}

export function usePets(options?: { enabled?: boolean }) {
  const { user, isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  const [pets, setPets] = useState<CanonicalPet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled || !isAuthenticated || !user?.id || !isSupabaseConfigured) {
      setPets([]);
      setError(null);
      return;
    }

    setLoading(true);
    const result = await queryOwnedPets(user.id);
    setPets(result.pets);
    setError(result.error);
    setLoading(false);
  }, [enabled, isAuthenticated, user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const savePet = useCallback(
    async (form: CanonicalPetForm, petId?: string) => {
      if (!user?.id || !isSupabaseConfigured) {
        return {
          pet: null as CanonicalPet | null,
          error: 'Sign in required to save a Pet Passport.',
        };
      }

      setSaving(true);
      const payload = buildCanonicalPetWritePayload(form, user.id);

      const result = petId
        ? await withMissingColumnRetry(async (body) => {
            const response = await supabase
              .from(TABLES.pets)
              .update(body)
              .eq('id', petId)
              .select(CANONICAL_PET_SELECT)
              .maybeSingle();
            return { data: response.data, error: response.error };
          }, payload)
        : await withMissingColumnRetry(async (body) => {
            const response = await supabase
              .from(TABLES.pets)
              .insert(body)
              .select(CANONICAL_PET_SELECT)
              .maybeSingle();
            return { data: response.data, error: response.error };
          }, payload);

      setSaving(false);

      if (result.error) {
        return { pet: null as CanonicalPet | null, error: result.error };
      }

      const pet = normalizeCanonicalPet(
        result.data as unknown as RecordRow | null,
      );
      await refresh();
      return { pet, error: null as string | null };
    },
    [refresh, user?.id],
  );

  const deletePet = useCallback(
    async (petId: string) => {
      if (!user?.id || !isSupabaseConfigured) {
        return { error: 'Sign in required to delete a pet.' };
      }

      setSaving(true);
      const result = await supabase.from(TABLES.pets).delete().eq('id', petId);
      setSaving(false);

      if (result.error) {
        return { error: getErrorMessage(result.error) };
      }

      await refresh();
      return { error: null as string | null };
    },
    [refresh, user?.id],
  );

  return {
    pets,
    loading,
    saving,
    error,
    refresh,
    savePet,
    deletePet,
  };
}
