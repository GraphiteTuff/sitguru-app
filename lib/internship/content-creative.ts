export const CONTENT_DRAFT_BUCKET = "sitguru-content-drafts";
export const CONTENT_CREATIVE_LIMIT = 25 * 1024 * 1024;
export const CONTENT_CREATIVE_DIRECT_LIMIT = 4 * 1024 * 1024;

const EXT_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

export function assessContentCreative(file: { name?: string | null; type?: string | null; size?: number | null }) {
  const size = Number(file.size || 0);
  if (size <= 0) return { ok: false as const, error: "Choose a graphic or video." };
  if (size > CONTENT_CREATIVE_LIMIT) return { ok: false as const, error: "Files must be 25MB or smaller." };
  const ext = String(file.name || "").split(".").pop()?.toLowerCase() || "";
  const mime = EXT_MIME[ext];
  if (!mime) return { ok: false as const, error: "Use a PNG, JPG, WEBP, GIF, MP4, WEBM, or MOV file." };
  return { ok: true as const, mime, ext, direct: size <= CONTENT_CREATIVE_DIRECT_LIMIT, size };
}

export function contentCreativeOwned(internId: string, path: string) {
  const clean = String(path || "").replace(/\\/g, "/").replace(/^\/+/, "");
  if (!internId || !clean || clean.includes("..") || clean.includes("//")) return false;
  return clean.startsWith(`interns/${internId}/content/`);
}

export function creativeBytesMatch(mime: string, bytes: Uint8Array) {
  if (bytes.length < 12) return false;
  if (mime === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8;
  if (mime === "image/gif") return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
  if (mime === "image/webp") return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[8] === 0x57 && bytes[9] === 0x45;
  if (mime === "video/webm") return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  if (mime === "video/mp4" || mime === "video/quicktime") {
    return String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]) === "ftyp";
  }
  return false;
}
