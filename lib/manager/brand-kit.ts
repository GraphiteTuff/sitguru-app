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
  updatedAt: string;
  uploadedByName: string;
  previewKind: "image" | "video" | "file";
  sharePointSourceUrl: string;
};

export const BRAND_PAGE_SIZE = 12;

export function internBrandLibraryHref(input: { q?: string; category?: string; page?: number }) {
  const params = new URLSearchParams();
  params.set("tool", "brand");
  const query = String(input.q || "").trim();
  const category = String(input.category || "").trim();
  if (query) params.set("q", query);
  if (category) params.set("category", category);
  if (input.page && input.page > 1) params.set("page", String(input.page));
  return `/intern/toolkit?${params.toString()}`;
}

export type BrandLibraryStatus = "approved" | "draft" | "pending_review" | "archived" | "active" | "all";

export type BrandLibrarySort = "approved_first" | "newest" | "oldest" | "name_asc" | "name_desc" | "updated";

const SHAREPOINT_HOST = "sitgurullc.sharepoint.com";
const SHAREPOINT_SITE = "/sites/SitGuruMarketingCommunityGrowth";
const FILE_EXT = /\.(jpg|jpeg|png|webp|gif|svg|pdf|zip|mp4|webm|mov|eps|ai)$/i;

export function parseSitGuruSharePointUrl(raw: string):
  | { ok: true; href: string; kind: "file" | "folder" }
  | { ok: false; error: string } {
  const value = String(raw || "").trim();
  if (!value) return { ok: false, error: "Paste a SharePoint file URL." };
  if (value.length > 2000) return { ok: false, error: "That SharePoint URL is too long." };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, error: "Paste a full https SharePoint URL." };
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    return { ok: false, error: "SharePoint links must be https on the SitGuru tenant." };
  }
  if (url.hostname.toLowerCase() !== SHAREPOINT_HOST) {
    return { ok: false, error: "That link is not on the SitGuru SharePoint tenant." };
  }
  const path = decodeURIComponent(url.pathname);
  if (!path.includes(SHAREPOINT_SITE) || path.includes("..")) {
    return { ok: false, error: "That link is not in the SitGuru Marketing SharePoint site." };
  }
  const id = decodeURIComponent(url.searchParams.get("id") || "");
  const target = id || path;
  const sharing = path.match(/^\/:([a-z]):\//i)?.[1]?.toLowerCase() || "";
  const file = sharing ? sharing !== "f" : FILE_EXT.test(target);
  url.hash = "";
  return { ok: true, href: url.toString(), kind: file ? "file" : "folder" };
}

export function sharePointSourceAction(input: {
  sourceUrl?: string;
  folderHref?: string;
  libraryHref?: string;
}) {
  const source = String(input.sourceUrl || "").trim();
  if (source) {
    const parsed = parseSitGuruSharePointUrl(source);
    if (parsed.ok && parsed.kind === "file") {
      return {
        label: "View SharePoint Source File",
        href: parsed.href,
        note: "This opens the saved SharePoint file URL. SitGuru has not checked the file itself.",
      };
    }
    if (parsed.ok) {
      return {
        label: "Open SharePoint Folder",
        href: parsed.href,
        note: "This opens a SharePoint folder, not an individual file.",
      };
    }
  }
  if (input.folderHref) {
    return {
      label: "Open SharePoint Folder",
      href: input.folderHref,
      note: "This opens the Brand Kit folder. An individual file link has not been saved.",
    };
  }
  if (input.libraryHref) {
    return {
      label: "Open SharePoint Brand Library",
      href: input.libraryHref,
      note: "This opens the document library. An individual file link has not been saved.",
    };
  }
  return null;
}

export function brandDownloadFileName(fileName: string) {
  const safe = safeBrandFileName(fileName);
  return safe && safe.includes(".") ? safe : safe ? `${safe}.bin` : "sitguru-brand-file";
}

/** Ava and interns stay on approved files. Super Admins can open the other queues. */
export function resolveBrandLibraryStatus(input: { isSuperUser: boolean; status?: string }): BrandLibraryStatus {
  const requested = String(input.status || "").trim();
  if (!input.isSuperUser) return "approved";
  if (
    requested === "approved" ||
    requested === "draft" ||
    requested === "pending_review" ||
    requested === "archived" ||
    requested === "all"
  ) {
    return requested;
  }
  return "active";
}

export function sortBrandAssets<
  T extends { title: string; approvalStatus: string; createdAt: string; updatedAt?: string },
>(assets: T[], sort: string) {
  const rank = (status: string) =>
    status === "approved" ? 0 : status === "pending_review" ? 1 : status === "draft" ? 2 : 3;
  const time = (value?: string) => Date.parse(value || "") || 0;
  return [...assets].sort((a, b) => {
    if (sort === "oldest") return time(a.createdAt) - time(b.createdAt);
    if (sort === "name_asc") return a.title.localeCompare(b.title);
    if (sort === "name_desc") return b.title.localeCompare(a.title);
    if (sort === "updated") return time(b.updatedAt || b.createdAt) - time(a.updatedAt || a.createdAt);
    if (sort === "newest") return time(b.createdAt) - time(a.createdAt);
    const byStatus = rank(a.approvalStatus) - rank(b.approvalStatus);
    if (byStatus) return byStatus;
    return time(b.createdAt) - time(a.createdAt);
  });
}

export function paginateBrandAssets<T>(assets: T[], page: number, pageSize = BRAND_PAGE_SIZE) {
  const size = Math.min(200, Math.max(1, pageSize));
  const total = assets.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, page || 1), pages);
  const start = (current - 1) * size;
  return { assets: assets.slice(start, start + size), page: current, pages, total };
}

export type BrandMasterFolder = {
  name: string;
  purpose: string;
  archived: boolean;
};

/**
 * SharePoint holds the master. Approved files stay in an active folder.
 * Only retired designs belong in 99 Brand Archive.
 */
export function brandMasterFolder(input: {
  category: string;
  mimeType: string;
  approvalStatus: string;
}): BrandMasterFolder {
  if (input.approvalStatus === "archived") {
    return {
      name: "99 Brand Archive",
      purpose: "Old designs, superseded versions, and references. Current logos stay out of this folder.",
      archived: true,
    };
  }
  if (input.category === "seasonal") {
    return {
      name: "03 Seasonal Logos",
      purpose: "Halloween, Thanksgiving, Christmas, and other seasonal marks.",
      archived: false,
    };
  }
  if (input.category === "guidelines") {
    return {
      name: "05 Brand Guidelines",
      purpose: "Colors, fonts, and approved logo usage.",
      archived: false,
    };
  }
  if (
    input.category === "flyers" ||
    input.category === "templates" ||
    input.category === "campaign_materials" ||
    input.category === "videos"
  ) {
    return {
      name: "04 Marketing & Print Assets",
      purpose: "Flyers, QR graphics, and print-ready files.",
      archived: false,
    };
  }
  const mime = input.mimeType.toLowerCase();
  if (input.category === "social_graphics" || mime === "image/jpeg" || mime === "image/webp") {
    return {
      name: "02 Digital & Social Logos",
      purpose: "Web, Canva, and social profile versions, including horizontal JPG files.",
      archived: false,
    };
  }
  return {
    name: "01 Official Master Logos",
    purpose: "Approved SVG, EPS, and transparent PNG masters.",
    archived: false,
  };
}

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
