import { useCallback, useEffect, useState } from 'react';

import {
  asBoolean,
  asString,
  firstString,
  getErrorMessage,
  type RecordRow,
} from '@/lib/data/fields';
import { REALTIME_CHANNELS, TABLES } from '@/lib/data/schema';
import { useRealtimeSubscription } from '@/hooks/data/useRealtimeSubscription';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type PublicGuru = {
  id: string;
  userId: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  zip: string;
  bio: string;
  photoUrl: string;
  isPublic: boolean;
  raw: RecordRow;
};

function guruFromRow(row: RecordRow): PublicGuru | null {
  const id = asString(row.id) || asString(row.user_id);
  if (!id) return null;

  const isPublic =
    asBoolean(row.is_public) ??
    asBoolean(row.publicly_visible) ??
    asBoolean(row.is_visible) ??
    true;

  return {
    id,
    userId: asString(row.user_id) || id,
    slug: firstString(row, ['slug', 'guru_slug', 'profile_slug']),
    name: firstString(
      row,
      ['display_name', 'full_name', 'name', 'first_name'],
      'SitGuru Pet Guru',
    ),
    city: firstString(row, ['city', 'service_city']),
    state: firstString(row, ['state', 'region', 'service_state']),
    zip: firstString(row, ['zip', 'zip_code', 'postal_code', 'service_zip']),
    bio: firstString(row, ['bio', 'about', 'tagline', 'headline']),
    photoUrl: firstString(row, [
      'photo_url',
      'avatar_url',
      'profile_photo_url',
      'image_url',
    ]),
    isPublic: Boolean(isPublic),
    raw: row,
  };
}

async function loadPublicGurus(): Promise<{
  gurus: PublicGuru[];
  error: string | null;
}> {
  const primary = await supabase
    .from(TABLES.gurus)
    .select('*')
    .limit(200);

  if (!primary.error && primary.data) {
    return {
      gurus: primary.data
        .map((row) => guruFromRow(row as RecordRow))
        .filter((guru): guru is PublicGuru => Boolean(guru && guru.isPublic)),
      error: null,
    };
  }

  return {
    gurus: [],
    error: getErrorMessage(primary.error, 'Unable to load Gurus.'),
  };
}

export function usePublicGurus(options?: {
  enabled?: boolean;
  realtime?: boolean;
}) {
  const enabled = options?.enabled ?? true;
  const realtime = options?.realtime ?? true;
  const [gurus, setGurus] = useState<PublicGuru[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !isSupabaseConfigured) {
      setGurus([]);
      return;
    }

    setLoading(true);
    const result = await loadPublicGurus();
    setGurus(result.gurus);
    setError(result.error);
    setLoading(false);
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useRealtimeSubscription({
    channelName: REALTIME_CHANNELS.guruLiveSearch,
    table: TABLES.gurus,
    event: 'UPDATE',
    enabled: Boolean(realtime && enabled),
    onChange: () => {
      void refresh();
    },
  });

  const findBySlugOrId = useCallback(
    (slugOrId: string) => {
      const needle = asString(slugOrId).toLowerCase();
      return (
        gurus.find(
          (guru) =>
            guru.slug.toLowerCase() === needle ||
            guru.id.toLowerCase() === needle ||
            guru.userId.toLowerCase() === needle,
        ) ?? null
      );
    },
    [gurus],
  );

  return {
    gurus,
    loading,
    error,
    refresh,
    findBySlugOrId,
  };
}

export function useGuruProfile(
  slugOrId: string | null | undefined,
  options?: { realtime?: boolean },
) {
  const needle = asString(slugOrId);
  const [guru, setGuru] = useState<PublicGuru | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!needle || !isSupabaseConfigured) {
      setGuru(null);
      return;
    }

    setLoading(true);

    const bySlug = await supabase
      .from(TABLES.gurus)
      .select('*')
      .eq('slug', needle)
      .maybeSingle();

    if (!bySlug.error && bySlug.data) {
      setGuru(guruFromRow(bySlug.data as RecordRow));
      setError(null);
      setLoading(false);
      return;
    }

    const byId = await supabase
      .from(TABLES.gurus)
      .select('*')
      .or(`id.eq.${needle},user_id.eq.${needle}`)
      .limit(1)
      .maybeSingle();

    if (byId.error) {
      setGuru(null);
      setError(getErrorMessage(byId.error));
      setLoading(false);
      return;
    }

    setGuru(guruFromRow((byId.data as RecordRow) ?? null));
    setError(null);
    setLoading(false);
  }, [needle]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useRealtimeSubscription({
    channelName: needle
      ? REALTIME_CHANNELS.guruLiveProfile(needle)
      : 'guru-profile-idle',
    table: TABLES.gurus,
    event: 'UPDATE',
    enabled: Boolean(options?.realtime !== false && needle),
    onChange: () => {
      void refresh();
    },
  });

  return { guru, loading, error, refresh };
}
