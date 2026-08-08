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

  const mime = (mimeType || '').toLowerCase();
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('heic')) return 'heic';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  if (mime.includes('aac')) return 'aac';
  if (
    mime.includes('m4a') ||
    mime.includes('mp4') ||
    mime.includes('x-m4a') ||
    mime.startsWith('audio/')
  ) {
    return 'm4a';
  }
  return 'jpg';
}

function contentTypeFromExt(ext: string, mimeType?: string | null) {
  const mime = (mimeType || '').toLowerCase();

  // Normalize common Expo recorder types to broadly accepted audio MIME.
  if (mime === 'audio/m4a' || mime === 'audio/x-m4a') return 'audio/mp4';
  if (mime.startsWith('image/') || mime.startsWith('audio/')) return mime;

  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic') return 'image/heic';
  if (ext === 'm4a' || ext === 'mp4') return 'audio/mp4';
  if (ext === 'mp3') return 'audio/mpeg';
  if (ext === 'aac') return 'audio/aac';
  if (ext === 'wav') return 'audio/wav';
  return 'image/jpeg';
}

function folderForKind(kind: MediaUploadKind, userId: string, scopeId?: string | null) {
  const scope = (scopeId || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
  if (kind === 'chat') return `chat/${userId}/${scope}`;
  if (kind === 'passport') return `passports/${userId}/${scope}`;
  return `pawreport/${userId}/${scope}`;
}

/**
 * Upload a local image or audio URI to Supabase Storage and return a public URL.
 * Tries PawReport buckets in order so mobile works once any approved bucket exists.
 */
export async function uploadSitGuruMedia(
  input: MediaUploadInput,
): Promise<MediaUploadResult> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured for media uploads.');
  }

  if (!input.localUri) {
    throw new Error('Missing local media URI.');
  }

  if (!input.userId) {
    throw new Error('Sign in required to upload media.');
  }

  const response = await fetch(input.localUri);
  if (!response.ok) {
    throw new Error('Unable to read the selected media from device storage.');
  }

  const arrayBuffer = await response.arrayBuffer();
  if (!arrayBuffer.byteLength) {
    throw new Error('Media file was empty.');
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
    `${lastError} Ensure a public bucket named pawreport-photos (or provider-media) exists with upload policies for authenticated users.`,
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

export type ParsedMessagePart =
  | { type: 'text'; value: string }
  | { type: 'voice'; url: string; label: string };

/** Split a stored chat body into text and playable voice-note parts. */
export function parseMessageMediaParts(body: string): ParsedMessagePart[] {
  const source = body || '';
  const parts: ParsedMessagePart[] = [];
  let cursor = 0;
  const pattern = /\[Voice note (\d+:\d{2})\]\s+(https?:\/\/\S+)/gi;

  for (const match of source.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      const ahead = source.slice(cursor, index).trim();
      if (ahead) parts.push({ type: 'text', value: ahead });
    }

    parts.push({
      type: 'voice',
      label: `Voice note · ${match[1]}`,
      url: match[2],
    });
    cursor = index + match[0].length;
  }

  const trailing = source.slice(cursor).trim();
  if (trailing) parts.push({ type: 'text', value: trailing });
  if (!parts.length && source.trim()) {
    parts.push({ type: 'text', value: source.trim() });
  }
  return parts;
}
