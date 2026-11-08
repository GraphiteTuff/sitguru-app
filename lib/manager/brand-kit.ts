/** Company Brand Kit rules. Pure checks — storage and auth live beside this. */

export const BRAND_KIT_BUCKET = "sitguru-brand-kit";

export const BRAND_CATEGORIES = [
  { id: "official_logos", label: "Official SitGuru Logos" },
  { id: "header_footer_logos", label: "Header and Footer Logos" },
  { id: "seasonal", label: "Seasonal Branding" },
  { id: "social_graphics", label: "Social Media Graphics" },
  { id: "flyers", label: "Marketing Flyers" },
  { id: "videos", label: "Videos" },
  { id: "guidelines", label: "Brand Guidelines" },
  { id: "templates", label: "Templates" },
  { id: "campaign_materials", label: "Approved Campaign Materials" },
] as const;

export type BrandCategoryId = (typeof BRAND_CATEGORIES)[number]["id"];

export const BRAND_STATUSES = ["draft", "pending_review", "approved", "archived"] as const;
export type BrandStatus = (typeof BRAND_STATUSES)[number];

export const BRAND_IMAGE_LIMIT = 15 * 1024 * 1024;
export const BRAND_FILE_LIMIT = 25 * 1024 * 1024;

const EXT_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  zip: "application/zip",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export type BrandActor = {
  canAccessAdmin: boolean;
  isSuperUser: boolean;
  growthOnly: boolean;
  intern: boolean;
};

export type BrandCapabilities = {
  viewLibrary: boolean;
  viewApproved: boolean;
  upload: boolean;
  edit: boolean;
  archive: boolean;
  approve: boolean;
  delete: boolean;
};

export function brandCategoryLabel(id: string) {
  return BRAND_CATEGORIES.find((item) => item.id === id)?.label || "Brand asset";
}

export function isBrandCategory(value: string): value is BrandCategoryId {
  return BRAND_CATEGORIES.some((item) => item.id === value);
}

export function isBrandStatus(value: string): value is BrandStatus {
  return (BRAND_STATUSES as readonly string[]).includes(value);
}

export function brandKitCapabilities(actor: BrandActor | null): BrandCapabilities {
  const editor = Boolean(
    actor && actor.canAccessAdmin && (actor.isSuperUser || actor.growthOnly),
  );
  return {
    viewLibrary: editor,
    viewApproved: editor || Boolean(actor?.intern),
    upload: editor,
    edit: editor,
    archive: editor,
    approve: Boolean(actor?.isSuperUser),
    delete: Boolean(actor?.isSuperUser),
  };
}

export function safeBrandFileName(fileName: string) {
  const base = String(fileName || "")
    .replace(/\0/g, "")
    .split(/[/\\]/)
    .pop()
    ?.trim() || "";
  if (!base || base === "." || base === ".." || base.includes("..")) return "";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^\.+/, "");
  return cleaned.slice(0, 80);
}

export function brandExtension(fileName: string) {
  const safe = safeBrandFileName(fileName);
  const ext = safe.split(".").pop()?.toLowerCase() || "";
  return EXT_MIME[ext] ? ext === "jpeg" ? "jpg" : ext : "";
}

function limitForMime(mime: string) {
  if (mime.startsWith("video/") || mime === "application/zip") return BRAND_FILE_LIMIT;
  return BRAND_IMAGE_LIMIT;
}

export function assessBrandUploadClaim(input: {
  fileName: string;
  declaredMime: string;
  declaredSize: number;
}) {
  const safeName = safeBrandFileName(input.fileName);
  const ext = brandExtension(input.fileName);
  const declared = String(input.declaredMime || "").toLowerCase().split(";")[0].trim();
  const normalized = declared === "application/x-zip-compressed" ? "application/zip" : declared;
  const fromExt = ext ? EXT_MIME[ext] : "";
  const mime = normalized && MIME_EXT[normalized] ? normalized : fromExt;
  const size = Number(input.declaredSize || 0);
  if (!safeName || !ext) return { ok: false as const, error: "Use a PNG, JPG, WEBP, SVG, PDF, ZIP, MP4, WEBM, or MOV file." };
  if (!mime || MIME_EXT[mime] !== (ext === "jpeg" ? "jpg" : ext) && !(mime === "image/jpeg" && ext === "jpg")) {
    return { ok: false as const, error: "The file type does not match its name." };
  }
  if (fromExt && mime !== fromExt) return { ok: false as const, error: "The file type does not match its name." };
  if (!Number.isFinite(size) || size <= 0) return { ok: false as const, error: "Choose a file." };
  if (size > limitForMime(mime)) {
    const mb = Math.round(limitForMime(mime) / (1024 * 1024));
    return { ok: false as const, error: `Files of this type must be ${mb}MB or smaller.` };
  }
  return { ok: true as const, mime, ext: ext === "jpeg" ? "jpg" : ext, safeName, size };
}

function ascii(bytes: Uint8Array, start: number, length: number) {
  let out = "";
  for (let i = start; i < start + length && i < bytes.length; i += 1) out += String.fromCharCode(bytes[i]);
  return out;
}

export function sniffBrandMime(bytes: Uint8Array) {
  if (bytes.length >= 8 && bytes[0] === 0x89 && ascii(bytes, 1, 3) === "PNG") return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "image/webp";
  if (bytes.length >= 5 && ascii(bytes, 0, 5) === "%PDF-") return "application/pdf";
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)) {
    return "application/zip";
  }
  if (bytes.length >= 12 && ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4).toLowerCase();
    if (brand.startsWith("qt")) return "video/quicktime";
    return "video/mp4";
  }
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return "video/webm";
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, Math.min(bytes.length, 800))).trim();
  if (text.startsWith("<svg") || (text.startsWith("<?xml") && text.includes("<svg"))) return "image/svg+xml";
  return "";
}

export function svgUnsafe(bytes: Uint8Array) {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes).toLowerCase();
  return /<script|javascript:|on[a-z]+\s*=/.test(text);
}

export function inspectBrandBytes(input: {
  bytes: Uint8Array;
  fileName: string;
  declaredMime: string;
  byteLength: number;
}) {
  const claim = assessBrandUploadClaim({
    fileName: input.fileName,
    declaredMime: input.declaredMime,
    declaredSize: input.byteLength,
  });
  if (!claim.ok) return claim;
  const sniffed = sniffBrandMime(input.bytes);
  if (!sniffed) return { ok: false as const, error: "SitGuru could not recognize this file." };
  if (sniffed !== claim.mime) return { ok: false as const, error: "File contents do not match the file type." };
  if (sniffed === "image/svg+xml" && svgUnsafe(input.bytes)) {
    return { ok: false as const, error: "This SVG includes active content and cannot be stored." };
  }
  return { ok: true as const, mime: claim.mime, ext: claim.ext, safeName: claim.safeName };
}

export type BrandAssetRecord = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  approvalStatus: BrandStatus;
  fileName: string;
  mimeType: string;
  fileSize: number;
  version: number;
  createdAt: string;
  uploadedByName: string;
  previewKind: "image" | "video" | "file";
};

export function brandPreviewKind(mime: string): "image" | "video" | "file" {
  if (mime === "image/png" || mime === "image/jpeg" || mime === "image/webp") return "image";
  if (mime.startsWith("video/")) return "video";
  return "file";
}

export function sanitizeBrandTags(value: unknown) {
  const raw = Array.isArray(value) ? value : String(value || "").split(",");
  const tags: string[] = [];
  for (const item of raw) {
    const tag = String(item || "").trim().replace(/\s+/g, " ").slice(0, 40);
    if (!tag || tags.includes(tag)) continue;
    tags.push(tag);
    if (tags.length >= 12) break;
  }
  return tags;
}

export function sanitizeBrandText(value: unknown, max: number) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

export const BUILT_IN_BRAND_ASSETS = [
  {
    title: "SitGuru wordmark",
    href: "/images/sitguru-logo-cropped.png",
    category: "official_logos" as const,
    note: "Built-in site file",
  },
  {
    title: "SitGuru icon",
    href: "/images/brand/intern/sitguru-icon-green.svg",
    category: "official_logos" as const,
    note: "Built-in site file",
  },
  {
    title: "SitGuru logo, dark",
    href: "/images/brand/intern/sitguru-logo-dark.png",
    category: "header_footer_logos" as const,
    note: "Built-in site file",
  },
] as const;
