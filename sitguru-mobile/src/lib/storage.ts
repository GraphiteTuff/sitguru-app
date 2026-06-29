import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const DEFAULT_PUBLIC_BUCKET = 'avatars';

export function resolveSupabaseStorageUrl(pathOrUrl?: string | null) {
  const value = typeof pathOrUrl === 'string' ? pathOrUrl.trim() : '';
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) return value;
  if (!isSupabaseConfigured) return '';

  const normalized = value.replace(/^\/+/, '');
  const [firstSegment, ...rest] = normalized.split('/');
  const bucket = rest.length > 0 ? firstSegment : DEFAULT_PUBLIC_BUCKET;
  const storagePath = rest.length > 0 ? rest.join('/') : normalized;
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}
