"use client";

import { Paperclip } from "lucide-react";
import {
  deleteInternAttachment,
  uploadInternAttachment,
} from "@/lib/internship/actions";
import { attachmentsForItem } from "@/lib/internship/portal";
import type { InternshipWorkAttachment } from "@/lib/internship/types";

export default function InternWorkAttachments({
  internId,
  itemType,
  itemId,
  attachments,
  mode = "intern",
  preview = false,
  label = "Supporting files",
}: {
  internId: string;
  itemType: string;
  itemId: string;
  attachments: InternshipWorkAttachment[];
  mode?: "intern" | "supervisor";
  preview?: boolean;
  label?: string;
}) {
  const files = attachmentsForItem(attachments, itemType, itemId);
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
              <a
                href={file.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 truncate text-sm font-black text-emerald-800"
              >
                {file.fileName}
              </a>
              {!readOnly ? (
                <form action={deleteInternAttachment}>
                  <input type="hidden" name="internId" value={internId} />
                  <input type="hidden" name="mode" value={mode} />
                  <input type="hidden" name="attachmentId" value={file.id} />
                  <button className="text-xs font-black text-rose-700">Remove</button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs font-semibold text-slate-500">
          Attach PDFs, slides, screenshots, or drafts that support this work and the
          Business Growth Report.
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
          <input
            name="file"
            type="file"
            required
            className="min-h-11 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm font-semibold"
          />
          <button className="min-h-11 rounded-2xl bg-[#0D5C3A] px-4 text-xs font-black !text-white">
            Attach
          </button>
        </form>
      ) : null}
    </div>
  );
}
