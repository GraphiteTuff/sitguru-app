import type { ImagePickerAsset } from 'expo-image-picker';
import { Platform } from 'react-native';
import { sitguruApiFetch } from '@/lib/data/api';

type PreparedUpload = { uploadId: string; path: string; signedUrl: string; mime: string };
type VerifiedUpload = { mediaPath: string; mediaMime: string };

export async function uploadCommunityMedia(asset: ImagePickerAsset, onProgress: (value: number) => void) {
  const video = asset.type === 'video';
  const mime = asset.mimeType || (video ? 'video/mp4' : 'image/jpeg');
  const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : mime === 'video/quicktime' ? 'mov' : video ? 'mp4' : 'jpg';
  const name = `community.${extension}`;
  let blob: Blob | undefined;
  let size = asset.fileSize || 0;
  if (Platform.OS === 'web') {
    blob = await (await fetch(asset.uri)).blob();
    size = blob.size;
  }
  if (!size) throw new Error('This file’s size could not be checked. Select another photo or video.');
  const limit = 25 * 1024 * 1024;
  if (size > limit) throw new Error('Choose a photo or video under 25 MB.');
  onProgress(0);
  const prepared = await sitguruApiFetch<PreparedUpload>('/api/community-studio/upload', { method: 'POST', body: { action: 'prepare', name, size } });
  if (prepared.error || !prepared.data) throw new Error(prepared.error || 'Your upload could not start.');
  const target = prepared.data;
  await new Promise<void>((resolve, reject) => {
    const body = new FormData();
    body.append('cacheControl', '3600');
    if (blob) body.append('', blob, name);
    else body.append('', { uri: asset.uri, type: mime, name } as never);
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', target.signedUrl);
    xhr.timeout = 120_000;
    xhr.upload.onprogress = event => {
      if (event.lengthComputable) onProgress(Math.min(95, Math.round(event.loaded / event.total * 95)));
    };
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('The upload did not finish. Please try again.'));
    xhr.onerror = () => reject(new Error('Your connection was interrupted. Your story is still here.'));
    xhr.ontimeout = () => reject(new Error('The upload timed out. Try a smaller video or a stronger connection.'));
    xhr.send(body);
  });
  const verified = await sitguruApiFetch<VerifiedUpload>('/api/community-studio/upload', { method: 'POST', body: { action: 'verify', uploadId: target.uploadId }, timeoutMs: 120_000 });
  if (verified.error || !verified.data?.mediaPath) throw new Error(verified.error || 'The media could not be checked safely.');
  onProgress(100);
  return verified.data;
}
