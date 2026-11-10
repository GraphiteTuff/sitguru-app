export const COMMUNITY_MEDIA_LIMIT = 25 * 1024 * 1024;
const supportedExtensions = /\.(jpe?g|png|webp|mp4|mov)$/i;

export function communityFileError(file: Pick<File, "name" | "size" | "type">) {
  if (!file.size) return "Choose a photo or video that is not empty.";
  if (file.size > COMMUNITY_MEDIA_LIMIT) return "Choose a photo or short video up to 25 MB.";
  if (!supportedExtensions.test(file.name)) return "Choose a JPG, PNG, WebP, MP4, MOV file.";
  return "";
}

type UploadResult = { mediaPath: string; mediaMime: string };

/** Matches Content Studio's private signed-upload workflow, with actual transfer progress. */
export async function uploadCommunityMedia(
  file: File,
  onProgress: (percent: number) => void,
  onProcessing: () => void,
  signal: AbortSignal,
): Promise<UploadResult> {
  const error = communityFileError(file);
  if (error) throw new Error(error);
  const prepared = await fetch("/api/community-studio/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "prepare", name: file.name, size: file.size }),
    signal,
  });
  const start = await prepared.json();
  if (!prepared.ok || !start.signedUrl || !start.uploadId) throw new Error(start.error || "The upload could not be started. Please try again.");
  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    const abort = () => request.abort();
    signal.addEventListener("abort", abort, { once: true });
    request.open("PUT", start.signedUrl);
    request.upload.onprogress = event => {
      if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 100));
    };
    request.onload = () => {
      signal.removeEventListener("abort", abort);
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error("Your media did not finish uploading. Please try again."));
    };
    request.onerror = () => { signal.removeEventListener("abort", abort); reject(new Error("The upload lost its connection. Your story is still here; please try again.")); };
    request.onabort = () => { signal.removeEventListener("abort", abort); reject(new DOMException("Upload cancelled", "AbortError")); };
    const body = new FormData();
    body.append("cacheControl", "0");
    body.append("", file);
    request.send(body);
    if (signal.aborted) request.abort();
  });
  onProgress(100);
  onProcessing();
  const verified = await fetch("/api/community-studio/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "verify", uploadId: start.uploadId }),
    signal,
  });
  const done = await verified.json();
  if (!verified.ok || !done.mediaPath || !done.mediaMime) throw new Error(done.error || "Your media could not be checked. Please choose another file.");
  return { mediaPath: done.mediaPath, mediaMime: done.mediaMime };
}
