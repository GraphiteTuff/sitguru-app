import type { InternshipWorkAttachment } from "./types";

export type InternshipAttachmentGroup = {
  key: string;
  latest: InternshipWorkAttachment;
  previous: InternshipWorkAttachment[];
};

/** Groups the display only. Every upload keeps its original record and actions. */
export function groupInternAttachments(
  files: readonly InternshipWorkAttachment[],
): InternshipAttachmentGroup[] {
  const groups = new Map<string, InternshipWorkAttachment[]>();

  for (const file of files) {
    const key = JSON.stringify([
      file.internId,
      file.itemType,
      file.itemId,
      (file.category || file.caption || "").trim().toLowerCase(),
      file.fileName.trim().toLowerCase() || file.id,
    ]);
    const uploads = groups.get(key) || [];
    uploads.push(file);
    groups.set(key, uploads);
  }

  const timestamp = (file: InternshipWorkAttachment) => {
    const value = Date.parse(file.createdAt);
    return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
  };

  return Array.from(groups, ([key, uploads]) => {
    const sorted = [...uploads].sort((a, b) => timestamp(b) - timestamp(a));
    return { key, latest: sorted[0], previous: sorted.slice(1) };
  });
}
