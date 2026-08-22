import { sitguruApiFetch } from '@/lib/data/api';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { PublicGuruProfile } from '@/types/guru';

const SELECT_FIELDS =
  'id, user_id, full_name, display_name, first_name, last_name, slug, username, handle, bio, title, city, state, service_city, service_state, service_area, zip_code, service_zip, service_zip_code, service_radius_miles, service_radius, radius_miles, avatar_url, profile_photo_url, photo_url, image_url, hourly_rate, starting_rate, rate, rating_avg, rating, review_count, is_verified, is_bookable, accepting_bookings, is_accepting_bookings, is_public_visible, admin_status, profile_quality_status, role, services, experience_years, latitude, longitude, lat, lng, service_latitude, service_longitude, completed_bookings';

const GURU_CATALOG_TTL_MS = 45_000;

let guruCatalogCache: {
  expiresAt: number;
  gurus: PublicGuruProfile[];
} | null = null;

type PublicSearchPayload = {
  gurus?: PublicGuruProfile[];
};

function asCatalogGuru(guru: PublicGuruProfile): PublicGuruProfile {
  return {
    ...guru,
    source: guru.source ?? 'public_guru_search_profiles',
  };
}

async function loadGurusFromWebsite(): Promise<PublicGuruProfile[]> {
  for (const path of ['/api/gurus/public-search', '/api/search/gurus']) {
    const result = await sitguruApiFetch<PublicSearchPayload>(path, {
      auth: false,
      timeoutMs: 15_000,
    });
    const gurus = Array.isArray(result.data?.gurus) ? result.data.gurus : [];

    if (gurus.length) {
      return gurus.map(asCatalogGuru);
    }
  }

  return [];
}

async function loadGurusFromSource(source: {
  table: string;
  profiles?: boolean;
}): Promise<PublicGuruProfile[]> {
  for (const columns of [SELECT_FIELDS, '*']) {
    let query = supabase.from(source.table).select(columns).limit(60);

    if (source.profiles) {
      query = query.in('role', [
        'guru',
        'pet_guru',
        'Guru',
        'Pet Guru',
        'pet care guru',
      ]);
    }

    const result = await query;

    if (!result.error && result.data?.length) {
      return (result.data as PublicGuruProfile[]).map((guru) => ({
        ...guru,
        source: source.table as PublicGuruProfile['source'],
      }));
    }
  }

  return [];
}

async function loadGurusFromSupabase(): Promise<PublicGuruProfile[]> {
  if (!isSupabaseConfigured) return [];

  const sources: Array<{ table: string; profiles?: boolean }> = [
    { table: 'public_guru_search_profiles' },
    { table: 'guru_profiles' },
    { table: 'gurus' },
    { table: 'profiles', profiles: true },
  ];

  for (const source of sources) {
    const gurus = await loadGurusFromSource(source);
    if (gurus.length) return gurus;
  }

  return [];
}

/**
 * Same Guru list the website search page uses. The web API reads with the
 * service role; a direct anon-key table query is only the fallback.
 */
export async function loadPublicGuruCatalog(): Promise<PublicGuruProfile[]> {
  if (guruCatalogCache && guruCatalogCache.expiresAt > Date.now()) {
    return guruCatalogCache.gurus;
  }

  const fromWebsite = await loadGurusFromWebsite();
  const resolved = fromWebsite.length
    ? fromWebsite
    : await loadGurusFromSupabase();

  if (resolved.length) {
    guruCatalogCache = {
      expiresAt: Date.now() + GURU_CATALOG_TTL_MS,
      gurus: resolved,
    };
  }

  return resolved;
}
