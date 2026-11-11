/**
 * YouTube helpers for Reads & Listen.
 * V1: manual URL / video-ID import. Automated channel sync is V2-ready.
 */

const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export function extractYoutubeVideoId(input: string): string | null {
  const raw = String(input || "").trim();
  if (!raw) return null;
  if (YOUTUBE_ID_RE.test(raw)) return raw;

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] || "";
      return YOUTUBE_ID_RE.test(id) ? id : null;
    }

    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const v = url.searchParams.get("v");
      if (v && YOUTUBE_ID_RE.test(v)) return v;

      const parts = url.pathname.split("/").filter(Boolean);
      if (
        (parts[0] === "embed" ||
          parts[0] === "shorts" ||
          parts[0] === "live" ||
          parts[0] === "v") &&
        parts[1] &&
        YOUTUBE_ID_RE.test(parts[1])
      ) {
        return parts[1];
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function youtubeWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

export function youtubeEmbedUrl(videoId: string, origin?: string) {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  if (origin) params.set("origin", origin);
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
}

export function youtubeThumbnailUrl(
  videoId: string,
  quality: "hqdefault" | "mqdefault" | "sddefault" | "maxresdefault" = "hqdefault",
) {
  return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/${quality}.jpg`;
}

export function withYoutubeUtm(
  url: string,
  params: { campaign?: string; content?: string } = {},
) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("utm_source", "sitguru");
    parsed.searchParams.set("utm_medium", "reads");
    parsed.searchParams.set(
      "utm_campaign",
      params.campaign || "reads_listen",
    );
    if (params.content) {
      parsed.searchParams.set("utm_content", params.content);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

/** Placeholder metadata until optional YouTube Data API is configured. */
export type YoutubeImportDraft = {
  youtube_video_id: string;
  youtube_url: string;
  title: string;
  description: string;
  thumbnail_url: string;
  import_status: "needs_review";
  import_source: "manual";
};

export function buildManualYoutubeImport(
  input: string,
  overrides?: Partial<Pick<YoutubeImportDraft, "title" | "description">>,
): YoutubeImportDraft | null {
  const id = extractYoutubeVideoId(input);
  if (!id) return null;

  return {
    youtube_video_id: id,
    youtube_url: youtubeWatchUrl(id),
    title: overrides?.title || `YouTube video ${id}`,
    description:
      overrides?.description ||
      "Imported from YouTube. Review metadata, topics, and relationships before publishing.",
    thumbnail_url: youtubeThumbnailUrl(id),
    import_status: "needs_review",
    import_source: "manual",
  };
}
