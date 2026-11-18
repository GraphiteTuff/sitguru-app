/**
 * Server-side TikTok Content Posting API transport for approved SitGuru video.
 * Uploads to TikTok's inbox as a DRAFT; it never publishes a public post.
 * All calls are initiated by a superuser-approved Content Studio action.
 */
const TIKTOK_INBOX_VIDEO_INIT = "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/";
export const TIKTOK_DRAFT_VIDEO_LIMIT = 25 * 1024 * 1024;

type TikTokInboxResponse = {
  data?: { publish_id?: unknown; upload_url?: unknown };
  error?: { code?: unknown };
};

export function tiktokDraftUploadDestination(input: string): string {
  const url = new URL(input);
  // Upload URLs contain temporary capabilities: never expose or log them.
  if (url.protocol !== "https:" || url.hostname !== "open-upload.tiktokapis.com" || url.username || url.password) {
    throw new Error("TikTok returned an untrusted upload destination.");
  }
  return url.toString();
}

export async function uploadApprovedVideoToTikTokDraft(input: {
  accessToken: string;
  bytes: Uint8Array;
  mime: string;
}): Promise<{ publishId: string }> {
  const { accessToken, bytes, mime } = input;
  if (!accessToken) throw new Error("TikTok authorization is missing.");
  if (!["video/mp4", "video/webm", "video/quicktime"].includes(mime)) {
    throw new Error("TikTok drafts require a supported video file.");
  }
  if (bytes.byteLength < 12 || bytes.byteLength > TIKTOK_DRAFT_VIDEO_LIMIT) {
    throw new Error("TikTok draft videos must be no larger than 25 MB.");
  }

  const start = await fetch(TIKTOK_INBOX_VIDEO_INIT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      source_info: {
        source: "FILE_UPLOAD",
        video_size: bytes.byteLength,
        chunk_size: bytes.byteLength,
        total_chunk_count: 1,
      },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!start.ok) throw new Error("TikTok draft initialization was rejected (HTTP " + start.status + ").");
  const response = (await start.json()) as TikTokInboxResponse;
  if (response.error?.code !== "ok" ||
      typeof response.data?.publish_id !== "string" ||
      typeof response.data.upload_url !== "string") {
    throw new Error("TikTok did not authorize the video draft. Reconnect with video.upload permission.");
  }
  const uploadUrl = tiktokDraftUploadDestination(response.data.upload_url);

  // The existing private Content Studio bucket caps creative files at 25 MB.
  // A single final chunk is permitted below TikTok's 64 MB chunk ceiling.
  const body = new Uint8Array(bytes.byteLength);
  body.set(bytes);
  const finish = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": mime,
      "Content-Range": `bytes 0-${bytes.byteLength - 1}/${bytes.byteLength}`,
    },
    body: body.buffer,
    cache: "no-store",
    signal: AbortSignal.timeout(60_000),
  });
  if (finish.status !== 201 && finish.status !== 200) {
    throw new Error("TikTok did not accept the video bytes (HTTP " + finish.status + ").");
  }
  // This is NOT a published URL and must never be marked as 'Published'.
  return { publishId: response.data.publish_id };
}
