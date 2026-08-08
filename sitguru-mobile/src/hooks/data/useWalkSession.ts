import { useCallback, useState } from 'react';

import { sitguruApiFetch } from '@/lib/data/api';
import { asString, getErrorMessage, type RecordRow } from '@/lib/data/fields';
import { API_PATHS, TABLES } from '@/lib/data/schema';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type WalkActionName =
  | 'start_walk'
  | 'take_break'
  | 'resume'
  | 'potty_break'
  | 'end_walk'
  | 'ping_coordinate';

export type WalkActionInput = {
  action: WalkActionName;
  lat?: number | null;
  lng?: number | null;
  accuracy?: number | null;
  pottyKind?: 'pee' | 'poop';
  note?: string;
};

/**
 * Guru care mutations go through the same web walk API as desktop phones.
 * Pet Parent live GPS on web uses SSE (`/api/walk/stream/[bookingId]`);
 * use `loadVisitUpdates` for RLS-scoped Supabase reads as a mobile fallback.
 */
export function useWalkSession(bookingId: string | null | undefined) {
  const { user } = useAuth();
  const id = asString(bookingId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<RecordRow | null>(null);

  const runAction = useCallback(
    async (input: WalkActionInput) => {
      if (!id) {
        return { ok: false, error: 'Missing booking id.' };
      }

      setBusy(true);
      setError(null);

      const result = await sitguruApiFetch<{
        ok?: boolean;
        event?: RecordRow;
        error?: string;
      }>(API_PATHS.walkAction(id), {
        body: input,
      });

      setBusy(false);

      if (result.error) {
        setError(result.error);
        return { ok: false, error: result.error };
      }

      setLastEvent((result.data?.event as RecordRow | undefined) ?? null);
      return { ok: true, error: null as string | null, event: result.data?.event };
    },
    [id],
  );

  const loadVisitUpdates = useCallback(async () => {
    if (!id || !isSupabaseConfigured) {
      return { updates: [] as RecordRow[], error: 'Booking unavailable.' };
    }

    const result = await supabase
      .from(TABLES.bookingVisitUpdates)
      .select('*')
      .eq('booking_id', id)
      .order('created_at', { ascending: true })
      .limit(500);

    if (result.error) {
      return {
        updates: [] as RecordRow[],
        error: getErrorMessage(result.error),
      };
    }

    return {
      updates: (result.data ?? []) as RecordRow[],
      error: null as string | null,
    };
  }, [id]);

  const loadVisitSession = useCallback(async () => {
    if (!id || !isSupabaseConfigured) {
      return { session: null as RecordRow | null, error: 'Booking unavailable.' };
    }

    const result = await supabase
      .from(TABLES.bookingVisitSessions)
      .select('*')
      .eq('booking_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (result.error) {
      return {
        session: null,
        error: getErrorMessage(result.error),
      };
    }

    return {
      session: (result.data as RecordRow | null) ?? null,
      error: null as string | null,
    };
  }, [id]);

  return {
    bookingId: id || null,
    userId: user?.id ?? null,
    busy,
    error,
    lastEvent,
    runAction,
    startWalk: (coords?: { lat?: number; lng?: number; accuracy?: number }) =>
      runAction({
        action: 'start_walk',
        lat: coords?.lat,
        lng: coords?.lng,
        accuracy: coords?.accuracy,
      }),
    takeBreak: () => runAction({ action: 'take_break' }),
    resume: () => runAction({ action: 'resume' }),
    pottyBreak: (pottyKind: 'pee' | 'poop', note?: string) =>
      runAction({ action: 'potty_break', pottyKind, note }),
    endWalk: () => runAction({ action: 'end_walk' }),
    pingCoordinate: (lat: number, lng: number, accuracy?: number) =>
      runAction({ action: 'ping_coordinate', lat, lng, accuracy }),
    loadVisitUpdates,
    loadVisitSession,
  };
}
