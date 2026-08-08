import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { resolveSupabaseStorageUrl } from '@/lib/storage';

/** Prefer PawReport bucket; fall back to existing public media buckets. */
export const PAWREPORT_PHOTO_BUCKETS = [
  'pawreport-photos',
  'provider-media',
  'pet-media',
] as const;

export type MediaUploadKind = 'pawreport' | 'chat' | 'passport';

export type MediaUploadInput = {
  localUri: string;
  userId: string;
  /** Optional booking / conversation / pet scope for pathing. */
  scopeId?: string | null;
  kind?: MediaUploadKind;
  mimeType?: string | null;
  fileName?: string | null;
};

export type MediaUploadResult = {
  publicUrl: string;
  bucket: string;
  path: string;
};

function extensionFromMime(mimeType?: string | null, fileName?: string | null) {
  const fromName = fileName?.split('.').pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  if (mimeType?.includes('png')) return 'png';
  if (mimeType?.includes('webp')) return 'webp';
  if (mimeType?.includes('heic')) return 'heic';
  return 'jpg';
}

function contentTypeFromExt(ext: string, mimeType?: string | null) {
  if (mimeType && mimeType.startsWith('image/')) return mimeType;
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic') return 'image/heic';
  return 'image/jpeg';
}

function folderForKind(kind: MediaUploadKind, userId: string, scopeId?: string | null) {
  const scope = (scopeId || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
  if (kind === 'chat') return `chat/${userId}/${scope}`;
  if (kind === 'passport') return `passports/${userId}/${scope}`;
  return `pawreport/${userId}/${scope}`;
}

/**
 * Upload a local image URI to Supabase Storage and return a public URL.
 * Tries PawReport buckets in order so mobile works once any approved bucket exists.
 */
export async function uploadSitGuruMedia(
  input: MediaUploadInput,
): Promise<MediaUploadResult> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured for media uploads.');
  }

  if (!input.localUri) {
    throw new Error('Missing local photo URI.');
  }

  if (!input.userId) {
    throw new Error('Sign in required to upload care photos.');
  }

  const response = await fetch(input.localUri);
  if (!response.ok) {
    throw new Error('Unable to read the selected photo from device storage.');
  }

  const arrayBuffer = await response.arrayBuffer();
  if (!arrayBuffer.byteLength) {
    throw new Error('Photo file was empty.');
  }

  const ext = extensionFromMime(input.mimeType, input.fileName);
  const contentType = contentTypeFromExt(ext, input.mimeType);
  const kind = input.kind ?? 'pawreport';
  const folder = folderForKind(kind, input.userId, input.scopeId);
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  let lastError = 'Upload failed.';

  for (const bucket of PAWREPORT_PHOTO_BUCKETS) {
    const { error } = await supabase.storage.from(bucket).upload(path, arrayBuffer, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      lastError = error.message || lastError;
      continue;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl =
      resolveSupabaseStorageUrl(data.publicUrl) || data.publicUrl || '';

    if (!publicUrl) {
      lastError = `Uploaded to ${bucket} but public URL was missing.`;
      continue;
    }

    return { publicUrl, bucket, path };
  }

  throw new Error(
    `${lastError} Ensure a public bucket named pawreport-photos (or provider-media) exists with upload policies for authenticated Gurus.`,
  );
}

/** Build message body that embeds a remote asset URL instead of a text marker. */
export function mediaMessageBody(input: {
  text?: string;
  photoUrl?: string | null;
  voiceNote?: { url: string; durationMs?: number } | null;
}) {
  const parts: string[] = [];
  const text = input.text?.trim();
  if (text) parts.push(text);
  if (input.photoUrl) parts.push(input.photoUrl);
  if (input.voiceNote?.url) {
    const seconds = Math.max(
      0,
      Math.floor((input.voiceNote.durationMs ?? 0) / 1000),
    );
    parts.push(`[Voice note ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}] ${input.voiceNote.url}`);
  }
  return parts.join('\n').trim();
}
