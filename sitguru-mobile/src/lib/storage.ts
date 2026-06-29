import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const DEFAULT_PUBLIC_BUCKET = 'avatars';

export function resolveSupabaseStorageUrl(pathOrUrl?: string | null) {
  const value = typeof pathOrUrl === 'string' ? pathOrUrl.trim() : '';
  if (!value) return '';
  if (/^(https?:|data:|blob:|file:)/i.test(value)) return value;
  if (!isSupabaseConfigured) return '';

  const normalized = value.replace(/^\/+/, '');
  if (!normalized) return '';

  const publicObjectMarker = '/object/public/';
  const markerIndex = normalized.indexOf(publicObjectMarker);
  const storageValue = markerIndex >= 0 ? normalized.slice(markerIndex + publicObjectMarker.length) : normalized;
  const [firstSegment, ...rest] = storageValue.split('/').filter(Boolean);
  const bucket = rest.length > 0 ? firstSegment : DEFAULT_PUBLIC_BUCKET;
  const storagePath = rest.length > 0 ? rest.join('/') : firstSegment;
  if (!bucket || !storagePath) return '';

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}
