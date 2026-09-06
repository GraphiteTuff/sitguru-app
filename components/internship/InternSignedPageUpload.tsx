"use client";

import { useRef, useState } from "react";
import { Camera, Upload } from "lucide-react";
import { uploadInternConfidentialityScan } from "@/lib/internship/actions";

export default function InternSignedPageUpload({
  internId,
  disabled = false,
}: {
  internId: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);

  function pickFile(file: File | undefined) {
    if (!file) {
      setFileName("");
      return;
    }
    setFileName(file.name);
    setBusy(true);
    formRef.current?.requestSubmit();
  }

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
          pickFile(event.currentTarget.files?.[0]);
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          const target = inputRef.current;
          if (!file || !target) return;
          const transfer = new DataTransfer();
          transfer.items.add(file);
          target.files = transfer.files;
          pickFile(file);
        }}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 text-sm font-black !text-white disabled:opacity-50 sm:w-auto"
        >
          <Upload size={16} />
          {busy ? "Uploading…" : "Upload PDF or photo"}
        </button>
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => cameraRef.current?.click()}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 text-sm font-black text-emerald-900 disabled:opacity-50 sm:w-auto"
        >
          <Camera size={16} />
          Take photo
        </button>
      </div>
      {fileName ? (
        <p className="text-sm font-semibold text-slate-600">{fileName}</p>
      ) : (
        <p className="text-sm font-semibold text-slate-500">
          On a phone, take a photo of the signed page. On a computer, upload the PDF
          or a photo.
        </p>
      )}
    </form>
  );
}
