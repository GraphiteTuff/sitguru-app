import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { resolveSupabaseStorageUrl } from '@/lib/storage';
import { TABLES } from '@/lib/data/schema';
import {
  uploadSitGuruMedia,
  type MediaUploadKind,
} from '@/lib/data/media-upload';

export const MAX_PROFILE_GALLERY = 8;
export const MAX_INTRO_VIDEO_SECONDS = 30;
export const MAX_INTRO_VIDEO_BYTES = 30 * 1024 * 1024;

export type ProfileMediaKind = 'cover' | 'gallery' | 'video';

export type ProfileMediaItem = {
  id: string;
  userId: string;
  kind: ProfileMediaKind;
  fileUrl: string;
  fileType: string | null;
  storageBucket: string | null;
  storagePath: string | null;
  sortOrder: number;
};

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function mapRow(row: Record<string, unknown>): ProfileMediaItem | null {
  const id = asText(row.id);
  const userId = asText(row.user_id);
  const kind = asText(row.kind) as ProfileMediaKind;
  const fileUrl = resolveSupabaseStorageUrl(asText(row.file_url)) || asText(row.file_url);

  if (!id || !userId || !fileUrl) return null;
  if (kind !== 'cover' && kind !== 'gallery' && kind !== 'video') return null;

  return {
    id,
    userId,
    kind,
    fileUrl,
    fileType: asText(row.file_type) || null,
    storageBucket: asText(row.storage_bucket) || null,
    storagePath: asText(row.storage_path) || null,
    sortOrder: Number(row.sort_order) || 0,
  };
}

export async function loadProfileMedia(userId: string) {
  if (!isSupabaseConfigured || !userId) {
    return { items: [] as ProfileMediaItem[], error: null as string | null };
  }

  const { data, error } = await supabase
    .from(TABLES.profileMedia)
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return { items: [], error: error.message };
  }

  return {
    items: (data || [])
      .map((row) => mapRow(row as Record<string, unknown>))
      .filter((item): item is ProfileMediaItem => Boolean(item)),
    error: null,
  };
}

export async function persistProfilePhotoFields(params: {
  userId: string;
  isGuru: boolean;
  avatarUrl?: string;
  coverUrl?: string;
  introVideoUrl?: string;
}) {
  const profilePatch: Record<string, string> = {};
  if (params.avatarUrl) {
    profilePatch.avatar_url = params.avatarUrl;
    profilePatch.profile_photo_url = params.avatarUrl;
    profilePatch.photo_url = params.avatarUrl;
  }
  if (params.coverUrl) {
    profilePatch.cover_url = params.coverUrl;
  }
  if (params.introVideoUrl) {
    profilePatch.intro_video_url = params.introVideoUrl;
    profilePatch.profile_video_url = params.introVideoUrl;
    profilePatch.video_url = params.introVideoUrl;
  }

  if (Object.keys(profilePatch).length) {
    const { error } = await supabase
      .from(TABLES.profiles)
      .update(profilePatch)
      .eq('id', params.userId);
    if (error) throw error;
  }

  if (!params.isGuru) return;

  const guruPatch: Record<string, string> = {};
  if (params.avatarUrl) {
    guruPatch.avatar_url = params.avatarUrl;
    guruPatch.profile_photo_url = params.avatarUrl;
    guruPatch.photo_url = params.avatarUrl;
  }
  if (params.coverUrl) {
    guruPatch.cover_url = params.coverUrl;
  }
  if (params.introVideoUrl) {
    guruPatch.intro_video_url = params.introVideoUrl;
    guruPatch.profile_video_url = params.introVideoUrl;
    guruPatch.video_url = params.introVideoUrl;
  }

  if (Object.keys(guruPatch).length) {
    const byUser = await supabase
      .from(TABLES.gurus)
      .update(guruPatch)
      .eq('user_id', params.userId);

    if (byUser.error || !byUser.count) {
      await supabase
        .from(TABLES.gurus)
        .update(guruPatch)
        .eq('id', params.userId);
    }
  }
}

export async function uploadAndSaveProfileMedia(params: {
  userId: string;
  isGuru: boolean;
  kind: Extract<MediaUploadKind, 'avatar' | 'cover' | 'gallery' | 'video'>;
  localUri: string;
  mimeType?: string | null;
  fileName?: string | null;
  replaceVideo?: boolean;
}) {
  const uploaded = await uploadSitGuruMedia({
    localUri: params.localUri,
    userId: params.userId,
    kind: params.kind,
    mimeType: params.mimeType,
    fileName: params.fileName,
  });

  if (params.kind === 'avatar') {
    await persistProfilePhotoFields({
      userId: params.userId,
      isGuru: params.isGuru,
      avatarUrl: uploaded.publicUrl,
    });
    return { uploaded, item: null as ProfileMediaItem | null };
  }

  if (params.kind === 'cover') {
    await persistProfilePhotoFields({
      userId: params.userId,
      isGuru: params.isGuru,
      coverUrl: uploaded.publicUrl,
    });
    await supabase
      .from(TABLES.profileMedia)
      .delete()
      .eq('user_id', params.userId)
      .eq('kind', 'cover');
  }

  if (params.kind === 'video') {
    await persistProfilePhotoFields({
      userId: params.userId,
      isGuru: params.isGuru,
      introVideoUrl: uploaded.publicUrl,
    });

    if (params.replaceVideo) {
      await supabase
        .from(TABLES.profileMedia)
        .delete()
        .eq('user_id', params.userId)
        .eq('kind', 'video');
    }
  }

  const row = {
    user_id: params.userId,
    kind: params.kind === 'avatar' ? 'gallery' : params.kind,
    file_url: uploaded.publicUrl,
    file_type: uploaded.bucket ? params.mimeType || null : null,
    storage_bucket: uploaded.bucket,
    storage_path: uploaded.path,
    sort_order: params.kind === 'cover' ? 0 : Date.now() % 100000,
    updated_at: new Date().toISOString(),
  };

  if (params.kind === 'avatar') {
    return { uploaded, item: null };
  }

  const { data, error } = await supabase
    .from(TABLES.profileMedia)
    .insert(row)
    .select('*')
    .maybeSingle();

  if (error) throw error;

  return {
    uploaded,
    item: data ? mapRow(data as Record<string, unknown>) : null,
  };
}

export async function deleteProfileMediaItem(item: ProfileMediaItem) {
  const { error } = await supabase
    .from(TABLES.profileMedia)
    .delete()
    .eq('id', item.id)
    .eq('user_id', item.userId);

  if (error) throw error;
}
