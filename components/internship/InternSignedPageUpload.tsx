"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { uploadInternConfidentialityScan } from "@/lib/internship/actions";

export default function InternSignedPageUpload({
  internId,
  disabled = false,
}: {
  internId: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      ref={formRef}
      action={uploadInternConfidentialityScan}
      encType="multipart/form-data"
      className="mt-4 space-y-3"
    >
      <input type="hidden" name="internId" value={internId} />
      <input
        ref={inputRef}
        name="file"
        type="file"
        required
        accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (!file) {
            setFileName("");
            return;
          }
          setFileName(file.name);
          setBusy(true);
          formRef.current?.requestSubmit();
        }}
      />
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 text-sm font-black !text-white disabled:opacity-50"
      >
        <Upload size={16} />
        {busy ? "Uploading…" : "Upload signed page"}
      </button>
      {fileName ? (
        <p className="text-sm font-semibold text-slate-600">{fileName}</p>
      ) : (
        <p className="text-sm font-semibold text-slate-500">
          Click Upload signed page to choose a PDF or photo.
        </p>
      )}
    </form>
  );
}
