import { internFirstName } from "@/lib/internship/student-dashboard";

export const INTERN_PORTAL_THEMES = [
  {
    id: "emerald",
    label: "SitGuru green",
    hero: "bg-[radial-gradient(circle_at_86%_18%,rgba(255,255,255,0.96),transparent_20%),linear-gradient(120deg,#bbf7e1_0%,#dff9f0_46%,#ccefff_100%)]",
  },
  {
    id: "sky",
    label: "Sky",
    hero: "bg-[radial-gradient(circle_at_86%_18%,rgba(255,255,255,0.96),transparent_20%),linear-gradient(120deg,#bae6fd_0%,#e0f2fe_46%,#dcfce7_100%)]",
  },
  {
    id: "amber",
    label: "Amber",
    hero: "bg-[radial-gradient(circle_at_86%_18%,rgba(255,255,255,0.96),transparent_20%),linear-gradient(120deg,#fde68a_0%,#fef3c7_46%,#d9f99d_100%)]",
  },
  {
    id: "violet",
    label: "Violet",
    hero: "bg-[radial-gradient(circle_at_86%_18%,rgba(255,255,255,0.96),transparent_20%),linear-gradient(120deg,#ddd6fe_0%,#ede9fe_46%,#ccfbf1_100%)]",
  },
] as const;

export type InternPortalThemeId = (typeof INTERN_PORTAL_THEMES)[number]["id"];

export const INTERN_WORK_ITEM_TYPES = [
  "task",
  "content",
  "campaign",
  "metric",
  "weekly",
  "experiment",
  "report",
  "brand",
] as const;

export type InternWorkItemType = (typeof INTERN_WORK_ITEM_TYPES)[number];

export const INTERNSHIP_ASSETS_BUCKET = "internship-assets";
export const MAX_INTERN_UPLOAD_BYTES = 10 * 1024 * 1024;

const ALLOWED_UPLOAD_EXT = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
  "svg",
  "pdf",
  "doc",
  "docx",
  "xlsx",
  "pptx",
  "txt",
  "csv",
]);

const ALLOWED_UPLOAD_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
]);

export function internPortalTheme(value: string | null | undefined): InternPortalThemeId {
  const id = String(value || "emerald").trim().toLowerCase();
  return INTERN_PORTAL_THEMES.some((theme) => theme.id === id)
    ? (id as InternPortalThemeId)
    : "emerald";
}

export function internPortalHeroClass(value: string | null | undefined) {
  const id = internPortalTheme(value);
  return INTERN_PORTAL_THEMES.find((theme) => theme.id === id)?.hero || INTERN_PORTAL_THEMES[0].hero;
}

export function internPortalFirstName(intern: {
  preferredName?: string | null;
  fullName?: string | null;
}) {
  return internFirstName(intern.preferredName || intern.fullName || "");
}

export function internWorkItemType(value: string | null | undefined): InternWorkItemType | null {
  const type = String(value || "").trim().toLowerCase();
  return INTERN_WORK_ITEM_TYPES.includes(type as InternWorkItemType)
    ? (type as InternWorkItemType)
    : null;
}

export function internSafeFileName(value: string | null | undefined) {
  const raw = String(value || "file").trim() || "file";
  const cleaned = raw.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
  return cleaned.slice(0, 80) || "file";
}

export function internUploadExtension(fileName: string, mimeType = "") {
  const fromName = fileName.split(".").pop()?.toLowerCase() || "";
  if (ALLOWED_UPLOAD_EXT.has(fromName)) return fromName;
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/heic") return "heic";
  if (mimeType === "image/heif") return "heif";
  if (mimeType === "image/svg+xml") return "svg";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("wordprocessingml")) return "docx";
  if (mimeType.includes("spreadsheetml")) return "xlsx";
  if (mimeType.includes("presentationml")) return "pptx";
  if (mimeType === "text/csv") return "csv";
  if (mimeType.startsWith("image/")) return "jpg";
  return "bin";
}

export function internAllowedUpload(file: {
  name?: string | null;
  type?: string | null;
  size?: number | null;
}) {
  const name = String(file.name || "");
  const mime = String(file.type || "").toLowerCase();
  const size = Number(file.size || 0);
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (size <= 0) return "Choose a file.";
  if (size > MAX_INTERN_UPLOAD_BYTES) return "Files must be 10MB or smaller.";
  if (!ALLOWED_UPLOAD_EXT.has(ext) && !ALLOWED_UPLOAD_MIME.has(mime)) {
    return "Use a PDF, Word, Excel, PowerPoint, image, or text file.";
  }
  return "";
}

export function attachmentsForItem<T extends { itemType: string; itemId: string }>(
  attachments: T[] | null | undefined,
  itemType: string,
  itemId: string,
) {
  return (attachments || []).filter(
    (row) => row.itemType === itemType && row.itemId === itemId,
  );
}

export function internEvidenceForFinal<
  T extends { contributesToFinal?: boolean; fileName: string; caption?: string },
>(attachments: T[] | null | undefined) {
  return (attachments || []).filter((row) => row.contributesToFinal !== false);
}

export function internSafeLinkedInUrl(value: string | null | undefined) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) return "";
    return url.toString();
  } catch {
    return "";
  }
}
