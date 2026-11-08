/** Browser Brand Kit upload helpers. Keep storage auth on the server. */

/** Files go to Supabase with a signed URL so the browser never posts the bytes through Vercel. */
export const BRAND_DIRECT_UPLOAD_LIMIT = 0;

export function brandUploadUsesSignedUrl(byteLength: number) {
  return Number(byteLength || 0) > BRAND_DIRECT_UPLOAD_LIMIT;
}

export function brandUploadProgressLabel(progress: number, uploading: boolean) {
  if (!uploading) return "";
  const percent = Math.max(0, Math.min(100, Math.round(Number(progress || 0) * 100)));
  if (percent <= 0) return "Starting upload…";
  if (percent >= 100) return "Finishing upload…";
  return `Uploading ${percent}%`;
}

export function parseBrandUploadJson(raw: string): { error?: string; id?: string; signedUrl?: string } {
  try {
    const payload = JSON.parse(raw || "{}") as { error?: string; id?: string; signedUrl?: string };
    return payload && typeof payload === "object" ? payload : {};
  } catch {
    return {};
  }
}

export function brandUploadHttpError(status: number, payload?: { error?: string }) {
  if (payload?.error) return payload.error;
  if (status === 401) return "Sign in again, then upload the file.";
  if (status === 403) return "You cannot upload brand files on this login.";
  if (status === 413) return "That file is too large for SitGuru to accept.";
  if (status === 0) return "The upload was interrupted. Keep this page open and try again.";
  if (status >= 500) return "SitGuru could not store that file. Try again in a moment.";
  return "The file did not finish uploading.";
}

export function brandUploadTransportError(input?: { online?: boolean; aborted?: boolean }) {
  if (input?.aborted) return "Upload cancelled.";
  if (input && input.online === false) {
    return "You appear to be offline. Check your connection and try again.";
  }
  return "The upload was interrupted before SitGuru finished saving the file. Keep this page open and try again.";
}

export function brandUploadShouldRetry(message: string) {
  return /interrupted|try again|could not store|could not be started|did not finish/i.test(message);
}
