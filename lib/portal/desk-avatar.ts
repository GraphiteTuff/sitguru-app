const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export function deskAvatarFileError(file: { name?: string | null; type?: string | null; size?: number | null }) {
  const mime = String(file.type || "").toLowerCase();
  const ext = String(file.name || "").toLowerCase().split(".").pop() || "";
  if (!TYPES.has(mime) && !EXTENSIONS.has(ext)) return "Use a JPG, PNG, or WEBP photo.";
  const size = Number(file.size || 0);
  if (size <= 0) return "Choose a profile photo.";
  if (size > MAX_BYTES) return "Profile photos must be 8MB or smaller.";
  return "";
}

export function deskAvatarExtension(file: { name?: string | null; type?: string | null }) {
  const mime = String(file.type || "").toLowerCase();
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  const ext = String(file.name || "").toLowerCase().split(".").pop() || "";
  if (ext === "png" || ext === "webp") return ext;
  return "jpg";
}
