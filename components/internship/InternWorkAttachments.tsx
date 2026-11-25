"use client";

import { Paperclip } from "lucide-react";
import {
  deleteInternAttachment,
  uploadInternAttachment,
} from "@/lib/internship/actions";
import { attachmentsForItem } from "@/lib/internship/portal";
import { groupInternAttachments } from "@/lib/internship/attachment-groups";
import { internPrimaryBtnClass } from "@/lib/internship/intern-ui";
import type { InternshipWorkAttachment } from "@/lib/internship/types";

const uploadDate = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function uploadedAt(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? `${uploadDate.format(date)} UTC` : "Date unavailable";
}

export default function InternWorkAttachments({
  internId,
  itemType,
  itemId,
  attachments,
  mode = "intern",
  preview = false,
  label = "Supporting files",
  category,
  accept,
  emptyCopy,
  hint,
  compact = false,
}: {
  internId: string;
  itemType: string;
  itemId: string;
  attachments: InternshipWorkAttachment[];
  mode?: "intern" | "supervisor";
  preview?: boolean;
  label?: string;
  category?: string;
  accept?: string;
  emptyCopy?: string;
  hint?: string;
  compact?: boolean;
}) {
  const files = attachmentsForItem(attachments, itemType, itemId).filter((file) => {
    if (file.internId !== internId) return false;
    if (!category) return true;
    const kind = String(file.category || file.caption || "").trim().toLowerCase();
    if (kind === category) return true;
    return category === "evidence" && !kind;
  });
  const readOnly = preview;
  const groups = compact
    ? groupInternAttachments(files)
    : files.map((file) => ({ key: file.id, latest: file, previous: [] }));

  function fileRow(file: InternshipWorkAttachment, latest = false) {
    const savedAt = uploadedAt(file.createdAt);
    return (
      <div className="flex items-start justify-between gap-3 rounded-xl bg-white px-3 py-2">
        <div className="min-w-0 flex-1">
          <a
            href={file.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center text-sm font-bold text-emerald-800 underline-offset-4 [overflow-wrap:anywhere] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {file.fileName}
          </a>
          {latest ? (
            <span className="ml-2 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
              Latest
            </span>
          ) : null}
          <p className="text-xs leading-5 text-slate-600">
            {Number.isFinite(Date.parse(file.createdAt)) ? (
              <>Uploaded <time dateTime={file.createdAt}>{savedAt}</time></>
            ) : "Upload date unavailable"}
            {file.uploadedByRole === "supervisor" ? " · SitGuru" : " · Intern"}
            {file.category || file.caption ? ` · ${file.category || file.caption}` : ""}
          </p>
        </div>
        {!readOnly ? (
          <form action={deleteInternAttachment} className="shrink-0">
            <input type="hidden" name="internId" value={internId} />
            <input type="hidden" name="mode" value={mode} />
            <input type="hidden" name="itemType" value={itemType} />
            <input type="hidden" name="attachmentId" value={file.id} />
            <button
              aria-label={`Remove ${file.fileName}, uploaded ${savedAt}`}
              className="min-h-11 rounded-lg px-2 text-xs font-bold text-rose-700 hover:text-rose-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Remove
            </button>
          </form>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <Paperclip size={16} aria-hidden="true" />
        {label}
      </p>
      {files.length ? (
        <ul className="mt-2 space-y-2">
          {groups.map((group) => (
            <li key={group.key}>
              {fileRow(group.latest, group.previous.length > 0)}
              {group.previous.length ? (
                <details className="mt-1 rounded-xl border border-slate-200 bg-white px-3">
                  <summary className="min-h-11 cursor-pointer content-center rounded-lg text-sm font-semibold text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                    Previous uploads ({group.previous.length})
                  </summary>
                  <ul className="space-y-2 border-t border-slate-100 py-2">
                    {group.previous.map((file) => <li key={file.id}>{fileRow(file)}</li>)}
                  </ul>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
          {emptyCopy
            ? emptyCopy
            : itemType === "brand"
              ? "Upload Canva/CapCut exports, flyers, or logo files SitGuru should review. PDF, Word, PNG, JPG, SVG, or slides under 10MB. No customer names."
              : "Attach the file this box asks for. Do not include customer names, emails, or payment details."}
        </p>
      )}
      {!readOnly ? (
        <form
          action={uploadInternAttachment}
          encType="multipart/form-data"
          className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]"
        >
          <input type="hidden" name="internId" value={internId} />
          <input type="hidden" name="mode" value={mode} />
          <input type="hidden" name="itemType" value={itemType} />
          <input type="hidden" name="itemId" value={itemId} />
          {category ? <input type="hidden" name="caption" value={category} /> : null}
          {category ? <input type="hidden" name="category" value={category} /> : null}
          {hint ? (
            <p className="sm:col-span-2 text-xs font-semibold leading-5 text-slate-500">{hint}</p>
          ) : null}
          <input
            name="file"
            type="file"
            aria-label={`Add ${label.toLowerCase()}`}
            required
            accept={accept}
            className="min-h-11 min-w-0 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm font-semibold"
          />
          <button className={`${internPrimaryBtnClass} min-h-11 px-4 text-xs`}>
            {itemType === "brand" ? "Upload" : "Attach"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
