"use client";

import { Paperclip } from "lucide-react";
import {
  deleteInternAttachment,
  uploadInternAttachment,
} from "@/lib/internship/actions";
import { attachmentsForItem } from "@/lib/internship/portal";
import { internPrimaryBtnClass } from "@/lib/internship/intern-ui";
import type { InternshipWorkAttachment } from "@/lib/internship/types";

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
}) {
  const files = attachmentsForItem(attachments, itemType, itemId).filter((file) => {
    if (!category) return true;
    const kind = String(file.category || file.caption || "").trim().toLowerCase();
    if (kind === category) return true;
    return category === "evidence" && !kind;
  });
  const readOnly = preview;

  return (
    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
        <Paperclip size={12} />
        {label}
      </p>
      {files.length ? (
        <ul className="mt-2 space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2"
            >
              <div className="min-w-0">
                <a
                  href={file.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block min-w-0 truncate text-sm font-black text-emerald-800"
                >
                  {file.fileName}
                </a>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {file.createdAt ? new Date(file.createdAt).toLocaleString() : "Saved"}
                  {file.uploadedByRole === "supervisor" ? " · SitGuru" : " · Intern"}
                  {file.category || file.caption
                    ? ` · ${file.category || file.caption}`
                    : ""}
                </p>
              </div>
              {!readOnly ? (
                <form action={deleteInternAttachment}>
                  <input type="hidden" name="internId" value={internId} />
                  <input type="hidden" name="mode" value={mode} />
                  <input type="hidden" name="itemType" value={itemType} />
                  <input type="hidden" name="attachmentId" value={file.id} />
                  <button className="text-xs font-black text-rose-700 hover:text-rose-900 hover:underline">
                    Remove
                  </button>
                </form>
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
            required
            accept={accept}
            className="min-h-11 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm font-semibold"
          />
          <button className={`${internPrimaryBtnClass} min-h-11 px-4 text-xs`}>
            {itemType === "brand" ? "Upload" : "Attach"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
